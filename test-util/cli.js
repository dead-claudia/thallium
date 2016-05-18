"use strict"

var path = require("path")
var minimatch = require("minimatch")
var interpret = require("interpret")
var t = require("../index.js")
var methods = require("../lib/methods.js")
var State = require("../lib/cli/run.js").State
var LoaderData = require("../lib/cli/loader-data.js")

exports.fixture = function (dir) {
    return path.resolve(__dirname, "../test-fixtures", dir)
}

function notFound(file) {
    var e = new Error("Cannot find module '" + file + "'")

    e.code = "MODULE_NOT_FOUND"
    return e
}

// Fake a Node `fs` errpr
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

function initTree(files, listing, file, entry) {
    if (entry == null) {
        throw new TypeError("value for entry " + file + " must exist")
    } else if (typeof entry === "string") {
        // Node tries to execute unknown extensions as JS, but this is better.
        files.set(file, function (type) {
            if (type === "read") return entry
            throw new Error(file + " is not executable!")
        })
        listing.push(file)
    } else if (typeof entry === "function") {
        // Cache the load, like Node.
        var value

        files.set(file, function (type) {
            if (type === "load") {
                if (entry == null) return value
                return value = entry()
            }
            throw new Error(file + " shouldn't be read!")
        })
        listing.push(file)
    } else {
        files.set(file, {type: "directory"})

        for (var key in entry) {
            if ({}.hasOwnProperty.call(entry, key)) {
                initTree(files, listing, path.resolve(file, key), entry[key])
            }
        }
    }
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

exports.mock = function (tree) {
    var files = new Map()
    var listing = []
    var cwd = process.platform === "win32" ? "C:\\" : "/"

    initTree(files, listing, cwd, tree)

    function resolve(file) {
        return path.resolve(cwd, file)
    }

    function resolveGlobs(globs) {
        if (!Array.isArray(globs)) globs = [globs]

        if (globs.length === 1) {
            var single

            if (globs[0][0] === "!") {
                single = "!" + resolve(globs[0].slice(1))
            } else {
                single = resolve(globs[0])
            }

            var mm = new minimatch.Minimatch(single, {
                nocase: process.platform === "win32",
                nocomment: true,
            })

            return function (file) { return mm.match(file) }
        }

        var ignores = []
        var keeps = []

        for (var i = 0; i < globs.length; i++) {
            var raw = globs[i]
            var cooked, list

            if (raw[0] === "!") {
                cooked = resolve(raw.slice(1))
                list = ignores
            } else {
                cooked = resolve(raw)
                list = keeps
            }

            list.push(new minimatch.Minimatch(cooked, {
                nocase: process.platform === "win32",
                nocomment: true,
            }))
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

    function load(file) {
        // Total hack, but it's easier than implementing Node's resolution
        // algorithm.
        if (file === "thallium") {
            return load("node_modules/thallium")
        }

        if (interpretMocks[file] != null) return interpretMocks[file]
        if (interpretModules[file]) return undefined

        var target = resolve(file)

        // Directories are initialized as objects.
        if (!files.has(target)) throw notFound(file)

        var func = files.get(target)

        if (typeof func !== "function") func = files.get(target + ".js")

        if (typeof func !== "function") {
            func = files.get(path.join(target, "index.js"))
        }

        if (typeof func !== "function") throw notFound(file)

        return func("load")
    }

    return {
        readGlob: function (globs) {
            var matcher = resolveGlobs(globs)

            for (var i = 0; i < listing.length; i++) {
                var item = listing[i]

                if (matcher(item)) load(item)
            }
        },

        read: function (file) {
            var target = resolve(file)

            // Directories are initialized as objects.
            if (!files.has(target)) {
                throw fsError({
                    path: file,
                    message: "no such file or directory",
                    code: "ENOENT",
                    errno: -2,
                    syscall: "open",
                })
            }

            var func = files.get(target)

            if (typeof func === "object") {
                throw fsError({
                    message: "illegal operation on a directory",
                    code: "EISDIR",
                    errno: -21,
                    syscall: "read",
                })
            }

            return func("read")
        },

        load: load,
        resolve: resolve,
        cwd: function () { return cwd },
        chdir: function (dir) { cwd = resolve(dir) },
        exists: function (file) {
            return typeof files.get(resolve(file)) === "function"
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

methods(Loader, {
    // Partially copied from the module itself. Checks and cleans the
    // map of default keys.
    clean: function (map) {
        var list = []
        var self = this

        map.forEach(function (data, ext) {
            // Skip any custom or out-of-order modules.
            if (!data.original) return

            if (ext === ".js") {
                t.deepEqual(data, LoaderData.jsLoader)
            } else {
                var mod = interpret.jsVariants[ext]

                t.deepEqual(data, Object.assign(
                    new LoaderData.Register(ext, mod, self.load),
                    {original: true}
                ))
            }

            list.push(ext)
        })

        for (var i = 0; i < list.length; i++) {
            map.delete(list[i])
        }

        return map
    },

    require: function (ext, mod, use) {
        return new LoaderData.Register(ext, mod, this.load, use)
    },

    register: function (ext, use) {
        return this.require(ext, interpret.jsVariants[ext], use)
    },
})
