"use strict"

var path = require("path")
var minimatch = require("minimatch")
var interpret = require("interpret")
var peach = require("../../lib/util").peach
var parse = require("../../lib/cli/parse")
var State = require("../../lib/cli/run").State
var methods = require("../../lib/methods")

var hasOwn = Object.prototype.hasOwnProperty

exports.fixture = function (dir) {
    var trailing = /[\\\/]$/.test(dir)

    if (trailing) dir = dir.slice(0, -1)

    var ret = path.resolve(__dirname, "../../fixtures", dir)

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

var interpretModules = {}

Object.keys(interpret.jsVariants)
.map(function (key) { return interpret.jsVariants[key] })
.forEach(function (mod) {
    (Array.isArray(mod) ? mod : [mod]).forEach(function (mod) {
        if (mod == null) {
            // do nothing - it's a native extension.
        } else if (typeof mod === "string") {
            interpretModules[mod] = true
        } else {
            interpretModules[mod.module] = true
        }
    })
})

function makeMatcher(resolve, globs) {
    var glob, single

    if (Array.isArray(globs)) {
        if (globs.length !== 1) return new MultiMatcher(resolve, globs)
        glob = globs[0]
    } else {
        glob = globs
    }

    if (glob[0] === "!") {
        single = "!" + resolve(glob.slice(1))
    } else {
        single = resolve(glob)
    }

    return new minimatch.Minimatch(single, {
        nocase: process.platform === "win32",
        nocomment: true,
    })
}

function MultiMatcher(resolve, globs) {
    this.ignores = []
    this.keeps = []
    var opts = {
        nocase: process.platform === "win32",
        nocomment: true,
    }

    globs.forEach(function (raw) {
        if (raw[0] === "!") {
            this.ignores.push(new minimatch.Minimatch(
                resolve(raw.slice(1)), opts))
        } else {
            this.keeps.push(new minimatch.Minimatch(resolve(raw), opts))
        }
    }, this)
}

methods(MultiMatcher, {
    match: function (file) {
        for (var i = 0; i < this.ignores.length; i++) {
            if (this.ignores[i].match(file)) return false
        }

        for (var j = 0; j < this.keeps.length; j++) {
            if (this.keeps[j].match(file)) return true
        }

        return false
    },
})

function FileEntry(file) {
    this.file = file
}

methods(FileEntry, {
    load: function () {
        throw new Error(this.file + " is not executable!")
    },
})

function ModuleEntry(factory) {
    this.factory = factory
    this.value = undefined
}

methods(ModuleEntry, {
    // Cache the load, like Node.
    load: function () {
        if (this.factory != null) {
            this.value = (0, this.factory)()
            this.factory = null
        }

        return this.value
    },
})

function Stat(isFile) {
    this._isFile = isFile
}

methods(Stat, {
    isFile: function () { return this._isFile },
    isDirectory: function () { return !this._isFile },
})

function Mock(tree) {
    this._files = Object.create(null)
    this._listing = []
    this._cwd = process.platform === "win32" ? "C:\\" : "/"
    this._initTree(this._cwd, tree)

    // Bind these exported members
    this.resolve = this.resolve.bind(this)
    this.load = this.load.bind(this)
    this.readGlob = this.readGlob.bind(this)
    this.readdir = this.readdir.bind(this)
    this.stat = this.stat.bind(this)
    this.cwd = this.cwd.bind(this)
    this.chdir = this.chdir.bind(this)
}

methods(Mock, {
    _initTree: function (file, entry) {
        if (entry == null) {
            throw new TypeError("value for entry " + file + " must exist")
        } else if (typeof entry === "string") {
            this._files[file] = new FileEntry(file)
            this._listing.push(file)
        } else if (typeof entry === "function") {
            this._files[file] = new ModuleEntry(entry)
            this._listing.push(file)
        } else {
            var children = this._files[file] = []
            var keys = Object.keys(entry)

            for (var i = 0; i < keys.length; i++) {
                var key = keys[i]
                var resolved = path.resolve(file, key)

                children.push(path.basename(resolved))
                this._initTree(resolved, entry[key])
            }
        }
    },

    resolve: function (file) {
        return path.resolve(this._cwd, file)
    },

    load: function (file) {
        // Total hack, but it's easier than implementing Node's resolution
        // algorithm.
        if (file === "thallium") {
            file = "node_modules/thallium"
        }

        if (interpretMocks[file] != null) {
            return interpretMocks[file]
        }

        if (interpretModules[file]) {
            return undefined
        }

        var target = this.resolve(file)

        // Directories are initialized as objects.
        if (!hasOwn.call(this._files, target)) {
            throw notFound(file)
        }

        var entry = this._files[target]

        if (Array.isArray(entry) || entry == null) {
            entry = this._files[target + ".js"]
        }

        if (Array.isArray(entry)) {
            entry = this._files[path.join(target, "index.js")]
        }

        if (entry == null) {
            throw notFound(file)
        }

        return entry.load()
    },

    readGlob: function (globs) {
        var matcher = makeMatcher(this.resolve, globs)

        return peach(
            this._listing.filter(function (file) {
                return matcher.match(file)
            }),
            this.load)
    },

    readdir: function (dir) {
        var entry = this._files[this.resolve(dir)]

        if (entry == null) {
            throw fsError({
                path: dir,
                message: "no such file or directory",
                code: "ENOENT",
                errno: -2,
                syscall: "scandir",
            })
        } else if (Array.isArray(entry)) {
            return entry.slice()
        } else {
            throw fsError({
                path: dir,
                message: "not a directory",
                code: "ENOTDIR",
                errno: -20,
                syscall: "scandir",
            })
        }
    },

    stat: function (file) {
        var entry = this._files[this.resolve(file)]

        if (entry == null) {
            throw fsError({
                path: file,
                message: "no such file or directory",
                code: "ENOENT",
                errno: -2,
                syscall: "stat",
            })
        } else {
            return new Stat(!Array.isArray(entry))
        }
    },

    cwd: function () { return this._cwd },
    chdir: function (dir) { this._cwd = this.resolve(dir) },
})

exports.mock = function (tree) {
    return new Mock(tree)
}

exports.Loader = function (args, util) {
    if (typeof args === "string") {
        args = args.trim()
        args = args ? args.split(/\s+/g) : []
    }

    this.state = new State(parse(args), util)
    this.load = util.load
}
