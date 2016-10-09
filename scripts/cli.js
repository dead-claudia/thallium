"use strict"

/* eslint-env node */

var path = require("path")
var minimatch = require("minimatch")
var interpret = require("interpret")
var Promise = require("../lib/bluebird.js")
var State = require("../lib/cli/run.js").State

var hasOwn = Object.prototype.hasOwnProperty

exports.fixture = function (dir) {
    var trailing = /[\\\/]$/.test(dir)

    if (trailing) dir = dir.slice(0, -1)

    var ret = path.resolve(__dirname, "../fixtures", dir)

    return trailing ? ret + path.sep : ret
}

function notFound(file) {
    var e = new Error("Cannot find module '" + file + "'")

    e.code = "MODULE_NOT_FOUND"
    return e
}

// Fake a Node `fs` error
function fsError(opts) {
    var message = opts.code + ": " + opts.message

    if (opts.syscall != null) message += ", " + opts.syscall
    if (opts.path != null) message += " '" + opts.path + "'"

    var e = new Error(message)

    if (opts.errno != null) e.errno = opts.errno
    if (opts.code != null) e.code = opts.code
    if (opts.syscall != null) e.syscall = opts.syscall
    if (opts.path != null) e.path = opts.path
    return e
}

// Mock the node-interpret modules that are associated with a `register` method.
var interpretMocks = {
    "babel-register": function () {},
    "babel-core/register": function () {},
    "babel/register": function () {},
    "node-jsx": function () { return {install: function () {}} },
}

var interpretModules = {} // eslint-disable-line newline-after-var

;(function () {
    function addSingle(mod) {
        if (mod == null) {
            // do nothing - it's a native extension.
        } else if (typeof mod === "string") {
            interpretModules[mod] = true
        } else {
            interpretModules[mod.module] = true
        }
    }

    for (var key in interpret.jsVariants) {
        if ({}.hasOwnProperty.call(interpret.jsVariants, key)) {
            var mod = interpret.jsVariants[key]

            if (Array.isArray(mod)) {
                for (var i = 0; i < mod.length; i++) {
                    addSingle(mod[i])
                }
            } else {
                addSingle(mod)
            }
        }
    }
})()

function singleMatcher(resolve, glob) {
    var single

    if (glob[0] === "!") {
        single = "!" + resolve(glob.slice(1))
    } else {
        single = resolve(glob)
    }

    var mm = new minimatch.Minimatch(single, {
        nocase: process.platform === "win32",
        nocomment: true,
    })

    return function (file) {
        return mm.match(file)
    }
}

function multiMatcher(resolve, globs) {
    var ignores = []
    var keeps = []
    var opts = {
        nocase: process.platform === "win32",
        nocomment: true,
    }

    for (var i = 0; i < globs.length; i++) {
        var raw = globs[i]

        if (raw[0] === "!") {
            raw = raw.slice(1)
            ignores.push(new minimatch.Minimatch(resolve(raw), opts))
        } else {
            keeps.push(new minimatch.Minimatch(resolve(raw), opts))
        }
    }

    return function (file) {
        for (var i = 0; i < ignores.length; i++) {
            if (ignores[i].match(file)) return false
        }

        for (var j = 0; j < keeps.length; j++) {
            if (keeps[j].match(file)) return true
        }

        return false
    }
}

exports.mock = function (tree) {
    var files = Object.create(null)
    var listing = []
    var cwd = process.platform === "win32" ? "C:\\" : "/"

    initTree(cwd, tree)

    function initTree(file, entry) {
        if (entry == null) {
            throw new TypeError("value for entry " + file + " must exist")
        } else if (typeof entry === "string") {
            // Node tries to execute unknown extensions as JS, but this is
            // better.
            files[file] = Promise.method(function (type) {
                if (type === "read") return entry
                throw new Error(file + " is not executable!")
            })
            listing.push(file)
        } else if (typeof entry === "function") {
            // Cache the load, like Node.
            var value

            files[file] = Promise.method(function (type) {
                if (type === "load") {
                    if (entry != null) {
                        value = {exports: entry()}
                        entry = null
                    }
                    return value
                }
                throw new Error(file + " shouldn't be read!")
            })
            listing.push(file)
        } else {
            var keys = Object.keys(entry)
            var children = files[file] = []

            for (var i = 0; i < keys.length; i++) {
                var key = keys[i]
                var resolved = path.resolve(file, key)

                children.push(path.basename(resolved))
                initTree(resolved, entry[key])
            }
        }
    }

    function resolve(file) {
        return path.resolve(cwd, file)
    }

    function load(file) {
        // Total hack, but it's easier than implementing Node's resolution
        // algorithm.
        if (file === "thallium") {
            return load("node_modules/thallium")
        }

        if (interpretMocks[file] != null) {
            return Promise.resolve(interpretMocks[file])
        }

        if (interpretModules[file]) {
            return Promise.resolve(undefined)
        }

        var target = resolve(file)

        // Directories are initialized as objects.
        if (!hasOwn.call(files, target)) {
            return Promise.reject(notFound(file))
        }

        var func = files[target]

        if (typeof func !== "function") func = files[target + ".js"]

        if (typeof func !== "function") {
            func = files[path.join(target, "index.js")]
        }

        if (typeof func !== "function") {
            return Promise.reject(notFound(file))
        }

        return func("load")
    }

    return {
        resolve: resolve,
        load: load,

        readGlob: function (globs) {
            if (!Array.isArray(globs)) globs = [globs]

            var matcher

            if (globs.length === 1) {
                matcher = singleMatcher(resolve, globs[0])
            } else {
                matcher = multiMatcher(resolve, globs)
            }

            return Promise.filter(listing, matcher).each(load)
        },

        read: function (file) {
            var target = resolve(file)

            // Directories are initialized as objects.
            if (!hasOwn.call(files, target)) {
                return Promise.reject(fsError({
                    path: file,
                    message: "no such file or directory",
                    code: "ENOENT",
                    errno: -2,
                    syscall: "open",
                }))
            }

            var func = files[target]

            if (typeof func === "object") {
                return Promise.reject(fsError({
                    message: "illegal operation on a directory",
                    code: "EISDIR",
                    errno: -21,
                    syscall: "read",
                }))
            }

            return func("read")
        },

        readdir: function (dir) {
            var entry = files[resolve(dir)]

            if (typeof entry === "object") {
                return Promise.resolve(entry.slice())
            } else if (typeof entry !== "undefined") {
                return Promise.reject(fsError({
                    path: dir,
                    message: "not a directory",
                    code: "ENOTDIR",
                    errno: -20,
                    syscall: "scandir",
                }))
            } else {
                return Promise.reject(fsError({
                    path: dir,
                    message: "no such file or directory",
                    code: "ENOENT",
                    errno: -2,
                    syscall: "scandir",
                }))
            }
        },

        stat: function (file) {
            var entry = files[resolve(file)]

            if (typeof entry === "object") {
                return Promise.resolve({
                    isFile: function () { return false },
                    isDirectory: function () { return true },
                })
            } else if (typeof entry !== "undefined") {
                return Promise.resolve({
                    isFile: function () { return true },
                    isDirectory: function () { return false },
                })
            } else {
                return Promise.resolve({
                    isFile: function () { return false },
                    isDirectory: function () { return false },
                })
            }
        },

        cwd: function () { return cwd },
        chdir: function (dir) { cwd = resolve(dir) },
        exists: function (file) {
            return Promise.resolve(typeof files[resolve(file)] === "function")
        },
    }
}

exports.state = function (argv, util) {
    return new State({cwd: util.cwd(), argv: argv, util: util})
}

exports.Loader = Loader
function Loader(argv, util) {
    if (typeof argv === "string") {
        argv = argv.trim()
        argv = argv ? argv.split(/\s+/g) : []
    }

    this.state = new State({cwd: util.cwd(), argv: argv, util: util})
    this.load = util.load
}
