"use strict"

var Promise = require("bluebird")
var path = require("path")
var interpret = require("interpret")
var methods = require("../methods.js")
var resolveDefault = require("./common.js").resolveDefault

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
    this.use = !!use

    // This is only for testing.
    this.original = false
}

methods(Register, {
    registerSingle: function (entry, baseDir) {
        try {
            if (typeof entry === "string") {
                this.require(entry, baseDir)
            } else {
                entry.register(this.require(entry.module, baseDir))
            }

            return true
        } catch (e) {
            return false
        }
    },

    registerList: function (baseDir) {
        if (Array.isArray(this.value)) {
            for (var i = 0; i < this.value.length; i++) {
                if (this.registerSingle(this.value[i], baseDir)) {
                    return Promise.resolve()
                }
            }
        } else if (this.registerSingle(this.value, baseDir)) {
            return Promise.resolve()
        }

        return Promise.reject(
            new Error("Could not register extension " + this.ext))
    },

    register: function (baseDir) {
        // Only load a module once.
        if (this.loaded || !this.use) {
            return Promise.resolve()
        }

        this.loaded = true

        var self = this

        return this.registerList(baseDir).then(function () {
            self.ext = self.value = self.require = null
        })
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
            if (original) this.map[ext].original = true
        }
    },
})

exports.extractIntoMap = function (state) {
    var extractor = new Extractor(state)
    var dummy = 0

    for (var i = 0; i < state.args.require.length; i++) {
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

    for (var j = 0; j < state.args.files.length; j++) {
        var file = state.args.files[j]

        // Globs and files without known extensions are obviously useless.
        if (file != null && isValid(file)) {
            extractor.putExt(getExt(file))
        }
    }

    // This takes precedence over other extensions.
    if (!hasOwn.call(extractor.map, ".js")) {
        extractor.map[".js"] = jsLoader
    }

    for (var key in interpret.jsVariants) {
        if (hasOwn.call(interpret.jsVariants, key)) {
            extractor.putExt(key, true)
        }
    }

    return extractor.map
}
