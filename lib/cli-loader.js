"use strict"

var Promise = require("bluebird")
var path = require("path")
var interpret = require("interpret")
var methods = require("./common.js").methods
var CliCommon = require("./cli-common.js")
var resolveDefault = CliCommon.resolveDefault
var globParent = CliCommon.globParent

var hasOwn = Object.prototype.hasOwnProperty

// There's no neater way to do this.
var allExts = new RegExp(".(" +
    Object.keys(interpret.jsVariants)
    .map(function (ext) { return ext.replace(/\./g, "\\.") })
    .join("|") + ")$")

exports.isValid = isValid
function isValid(file) {
    return allExts.test(path.basename(file))
}

exports.getExt = getExt
function getExt(file) {
    return allExts.exec(path.basename(file))[1]
}

// Exported for testing
exports.Register = Register
function Register(ext, value, load, use) {
    this.ext = ext
    this.value = value
    this.require = load
    this.loaded = false

    // `this.use` may change, but `this.specified` marks this as specified
    // explicitly in the CLI, and should never.
    this.specified = this.use = !!use

    // This is only for testing.
    this.original = false
}

methods(Register, {
    registerFail: function () {
        return Promise.reject(
            new Error("Could not register extension " + this.ext))
    },

    registerSingle: function (entry, baseDir) {
        return Promise.bind(this).then(/** @this */ function () {
            if (this.specified) {
                return resolveDefault(this.require(entry, baseDir))
            } else if (typeof entry === "string") {
                this.require(entry, baseDir)
            } else {
                entry.register(this.require(entry.module, baseDir))
            }

            return undefined
        })
        .catch(/** @this */ function () {
            return this.registerFail()
        })
    },

    registerList: function (baseDir) {
        if (Array.isArray(this.value)) {
            return this.value.reduce(function (p, value) {
                return p.catch(/** @this */ function () {
                    return this.registerSingle(value, baseDir)
                })
            }, this.registerFail().bind(this))
        } else {
            return this.registerSingle(this.value, baseDir)
        }
    },

    register: function (baseDir) {
        // Only load a module once.
        if (this.loaded || !this.use) {
            return Promise.resolve()
        }

        this.loaded = true

        return this.registerList(baseDir)
        .finally(/** @this */ function () {
            this.ext = this.value = this.require = null
        })
        .bind().return()
    },
})

// Exported for testing
exports.Simple = Simple
function Simple(module, load) {
    this.module = module
    this.require = load
    this.loaded = false

    // Placeholder to mark an assumption made in the config location
    // inference algorithm.
    this.use = true
}

methods(Simple, {
    register: function (baseDir) {
        if (this.loaded) {
            return Promise.resolve()
        }

        this.loaded = true

        var self = this

        return Promise.try(function () {
            return resolveDefault(self.require(self.module, baseDir))
        })
        .then(function () {
            self.module = self.require = null
        })
    },
})

// A sentinel for JS configs, exported for testing
var jsLoader = exports.jsLoader = {
    ext: ".js",
    use: true,
    original: true,
    register: function () {},
}

function Extractor(state) {
    this.map = Object.create(null)
    this.load = state.util.load
}

methods(Extractor, {
    put: function (ext, mod, use) {
        this.map[ext] = new Register(ext, mod, this.load, use)
    },

    putExt: function (ext, original) {
        var mod = interpret.jsVariants[ext]

        // Don't include natively implemented extensions. The loaders make
        // the assumption there's something to load.
        if (mod && !hasOwn.call(this.map, ext)) {
            this.put(ext, mod, false)
            this.map[ext].original = !!original
        }
    },
})

exports.extractIntoMap = function (state) {
    var extractor = new Extractor(state)
    var dummy = 0
    var i

    for (i = 0; i < state.args.require.length; i++) {
        var entry = state.args.require[i]
        var index = entry.indexOf(":")

        if (index >= 0) {
            var ext = entry.slice(0, index)

            if (ext[0] !== ".") ext = "." + ext
            extractor.put(ext, entry.slice(index + 1), true)
        } else {
            extractor.map[dummy++] = new Simple(entry, extractor.load)
        }
    }

    // Globs and files without known extensions are obviously useless.
    if (state.args.config != null && isValid(state.args.config)) {
        extractor.putExt(getExt(state.args.config))
    }

    for (i = 0; i < state.args.files.length; i++) {
        var file = state.args.files[i]

        // Globs and files without known extensions are obviously useless.
        if (file != null && isValid(file)) {
            extractor.putExt(getExt(file))
        }
    }

    // This takes precedence over other extensions.
    if (!hasOwn.call(extractor.map, ".js")) {
        extractor.map[".js"] = jsLoader
    }

    var variants = Object.keys(interpret.jsVariants)

    for (i = 0; i < variants.length; i++) {
        extractor.putExt(variants[i], true)
    }

    return extractor.map
}

// The dirname of the root is the root
function isRoot(dir) {
    return path.dirname(dir) === dir
}

function Utils(state, loaders) {
    this.exists = state.util.exists
    // calls to `check` are cached to avoid numerous duplicate directory
    // reads.
    this.cache = Object.create(null)
    this.loaders = loaders
    this.resolve = state.util.resolve
}

methods(Utils, {
    check: function (file) {
        if (hasOwn.call(this.cache, file)) {
            return this.cache[file]
        } else {
            return this.cache[file] = this.exists(file)
        }
    },

    walkUp: function (dir, base) {
        dir = this.resolve(dir)
        for (;;) {
            var file = path.join(dir, base)

            if (this.check(file)) return file
            if (isRoot(dir)) return null

            dir = path.dirname(dir)
        }
    },

    // 1. Get a list of all `.tl.{ext}` files.
    // 2. Find the first file to exist.
    // 3. If we can't find one and we're not at the root level, recurse upwards.
    search: function (dir) {
        dir = this.resolve(dir)
        for (;;) {
            var base = path.join(dir, ".tl")

            var keys = Object.keys(this.loaders)

            for (var i = 0; i < keys.length; i++) {
                var key = keys[i]
                var loader = this.loaders[key]

                // Skip the extension-free loaders
                if (loader.ext) {
                    var file = base + loader.ext

                    if (this.check(file)) return file
                }
            }

            if (isRoot(dir)) return null

            dir = path.dirname(dir)
        }
    },

    findDirectMatch: function (list) {
        for (var i = 0; i < list.length; i++) {
            var glob = list[i]

            if (isValid(glob)) {
                var ret = this.walkUp(
                    globParent(glob),
                    ".tl" + getExt(glob))

                if (ret != null) return ret
            }
        }

        return null
    },

    findWalkingMatch: function (list) {
        for (var j = 0; j < list.length; j++) {
            var glob = list[j]
            var ret

            if (isValid(glob)) {
                ret = this.walkUp(globParent(glob), ".tl.js")
            } else {
                ret = this.search(globParent(glob))
            }

            if (ret != null) return ret
        }

        return null
    },

    // Try to find one with a matching extension, or failing that, one in JS.
    findExact: function (list) {
        var ret = this.findDirectMatch(list)

        return ret != null ? ret : this.findWalkingMatch(list)
    },
})

exports.findConfig = function (state, loaders) {
    var utils = new Utils(state, loaders)
    var raw

    if (state.args.config != null) {
        raw = state.args.config
    } else if (state.args.files.length !== 0) {
        raw = utils.findExact(state.args.files)
    } else {
        raw = utils.search("test")
    }

    if (raw == null) return null

    var resolved = state.util.resolve(raw)

    // The original iteration only checked arguments, not the file system.
    if (isValid(resolved)) {
        var ext = getExt(resolved)

        // This is meaningless for simple loaders, so it works.
        if (hasOwn.call(loaders, ext)) loaders[ext].use = true
    }

    return resolved
}
