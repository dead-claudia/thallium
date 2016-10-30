"use strict"

/* eslint no-console: 2 */

var path = require("path")
var interpret = require("interpret")
var resolveDefault = require("./common").resolveDefault
var globParent = require("./init-common").globParent
var peach = require("../util").peach

var hasOwn = Object.prototype.hasOwnProperty

// Sort the keys by dots then UCS-2 character value. This is to ensure the
// regexp remains order-independent and deterministic.
//
// (e.g. `--require spec.foo:foo-spec --require foo:foo-register` should work.)
function extCompare(a, b) {
    var diff = countDots(b) - countDots(a)

    if (diff !== 0) return diff

    // Builtin extensions should be held first after multiple extension checks
    if (a === ".js") return 1
    if (b === ".js") return -1
    if (a === ".node") return 1
    if (b === ".node") return -1

    return textCompare(a, b)
}

function countDots(str) {
    var count = 0

    for (var i = 0; i < str.length; i++) {
        if (str[i] === ".") count++
    }

    return count
}

function textCompare(a, b) {
    var end = Math.min(a.length, b.length)

    for (var i = 0; i < end; i++) {
        var diff = a.charCodeAt(i) - b.charCodeAt(i)

        if (diff !== 0) {
            if (a[i] === ".") return 1
            if (b[i] === ".") return -1
            return diff
        }
    }

    return b.length - a.length
}

// Exported for testing
exports.keysToRegExp = keysToRegExp
function keysToRegExp(object) {
    var keys = Object.keys(object)
        .sort(extCompare)
        .map(function (key) { return key.replace(/\./g, "\\.") })

    if (keys.length === 0) {
        return /(?!)/ // Matches nothing
    } else if (keys.length === 1) {
        return new RegExp(".(" + keys[0] + ")$")
    } else {
        return new RegExp(".(" + keys.join("|") + ")$")
    }
}

function getInitialData(state) {
    var exts = Object.create(null)
    var inferrable = Object.create(null)
    var modules = []
    var loads = []
    var loadsCache = Object.create(null)

    state.args.require.forEach(function (entry) {
        if (entry.includes(":")) {
            var index = entry.indexOf(":")
            var raw = entry.slice(0, index)
            var ext = raw[0] === "." ? raw : "." + raw

            // Uniquify the modules, in reverse insertion order
            if (!hasOwn.call(exts, ext)) {
                exts[ext] = true
                modules.push(entry.slice(index + 1))
            }
        } else if (!hasOwn.call(loadsCache, entry)) {
            // Uniquify the loading data, in insertion order.
            loadsCache[entry] = true
            loads.push(entry)
        }
    })

    // Mixin the interpret modules as well
    for (var ext in interpret.jsVariants) {
        if (hasOwn.call(interpret.jsVariants, ext) && !hasOwn.call(exts, ext)) {
            exts[ext] = true
            if (ext !== ".js" && ext !== ".node") inferrable[ext] = true
        }
    }

    return {
        exts: keysToRegExp(exts),
        inferrable: keysToRegExp(inferrable),
        // Load all the require hooks, *then* load all the modules themselves.
        modules: modules.reverse().concat(loads),
    }
}

function isMissingError(e) {
    return e.code === "ENOENT" || e.code === "ENOTDIR" || e.code === "EISDIR"
}

function findConfig(state, data) {
    var cached = Object.create(null)

    function searchSingle(dir, isConfigExt) {
        var cache = cached[dir] = {
            map: Object.create(null),
            default: undefined,
        }

        var listing, last

        try {
            listing = state.util.readdir(dir)
        } catch (e) {
            if (!isMissingError(e)) throw e
            listing = []
        }

        for (var i = 0; i < listing.length; i++) {
            var file = listing[i]

            if (file !== ".tl.js" &&
                    !(file.startsWith(".tl.") && isConfigExt(file))) {
                continue
            }

            var resolved = state.util.resolve(path.join(dir, file))

            try {
                if (state.util.stat(resolved).isFile()) last = resolved
            } catch (e) {
                if (!isMissingError(e)) throw e
            }

            if (last != null) {
                cache.map[data.exts.exec(file)[1]] = last
                if (file === ".tl.js") break
            }
        }

        if (last != null) cache.default = last
        return last
    }

    function searchPathInferred(dir) {
        var file

        do {
            if (hasOwn.call(cached, dir)) {
                // Just infer a key out of it. If there's none, rely on the
                // default. If there's a JS ext, prefer that. Otherwise, pick
                // one and use it, since there's usually only one.
                var cache = cached[dir]
                var keys = Object.keys(cache.map)

                if (keys.length === 0) return cache.default
                if (hasOwn.call(cache.map, ".js")) return cache.map[".js"]
                return cache.map[keys[0]]
            }
            file = searchSingle(dir, function (file) {
                return data.exts.test(file)
            })
        } while (file == null && dir !== (dir = path.dirname(dir)))

        return file
    }

    function searchPathExt(dir, ext) {
        var file

        do {
            if (hasOwn.call(cached, dir)) {
                return cached[dir].map[ext] || cached[dir].default
            }
            file = searchSingle(dir, function (file) {
                return data.exts.test(file) && data.exts.exec(file)[1] === ext
            })
        } while (file == null && dir !== (dir = path.dirname(dir)))

        return file
    }

    var files = state.args.files.length ? state.args.files : ["test/**"]
    var last

    for (var i = 0; i < files.length; i++) {
        var glob = state.util.resolve(files[i])

        if (data.exts.test(glob)) {
            var ext = data.exts.exec(glob)[1]
            var file = searchPathExt(globParent(glob), ext)

            if (file != null && file.endsWith(ext)) return file
            if (last == null) last = file
        } else if (last == null) {
            last = searchPathInferred(globParent(glob))
        }
    }

    return last
}

var isWindows = process.platform === "win32"

function isNonModule(path) {
    if (isWindows) {
        return /^[A-Za-z]:[\\\/]|^[\\\/]|^\.\.?[\\\/]/.test(path)
    } else {
        return /^\.{0,2}\//.test(path)
    }
}

var Mask = exports.Mask = Object.freeze({
    Config: 0x1,
    Internal: 0x2,
})

// Exported for testing
exports.makeDefault = makeDefault
function makeDefault(state, baseDir) {
    return {
        state: state,
        baseDir: baseDir,
        mask: Mask.Config | Mask.Internal,
    }
}

// Exported for testing
exports.makeSimple = makeSimple
function makeSimple(state, baseDir, mod, isConfig) {
    return {
        state: state,
        baseDir: baseDir,
        mod: mod,
        mask: isConfig ? Mask.Config : 0,
    }
}

// Exported for testing
exports.makeInterpret = makeInterpret
function makeInterpret(state, baseDir, ext) {
    return {
        state: state,
        baseDir: baseDir,
        ext: ext,
        mask: Mask.Internal,
    }
}

function loadMod(loader, mod) {
    return resolveDefault(loader.state.util.load(mod, loader.baseDir))
}

exports.load = function (loader) {
    return Promise.resolve().then(function () {
        if (!(loader.mask & Mask.Internal)) {
            return loadMod(loader, loader.mod)
        }

        if (loader.mask & Mask.Config) {
            var thallium = loadMod(loader, "thallium")
            var spec = loadMod(loader, "thallium/r/spec")

            thallium.reporter(spec)
            return {thallium: thallium}
        }

        var state = loader.state
        var baseDir = loader.baseDir
        var modules = interpret.jsVariants[loader.ext]

        if (modules == null) return undefined
        if (!Array.isArray(modules)) modules = [modules]

        for (var i = 0; i < modules.length; i++) {
            var entry = modules[i]

            try {
                if (typeof entry === "string") {
                    state.util.load(entry, baseDir)
                } else {
                    entry.register(state.util.load(entry.module, baseDir))
                }

                return undefined
            } catch (e) {
                if (e.code !== "MODULE_NOT_FOUND") throw e
            }
        }

        // Let's be a little more helpful here...
        var last = Array.isArray(modules) ? modules[0] : modules
        var idea = typeof last === "string" ? last : last.module

        throw new Error(
            "Could not find loader for ext " + loader.ext + ". Try `npm i` " +
            "if you haven't already, or `npm i --save-dev " + idea + ", if " +
            "you aren't already using that or something else.")
    })
}

// Default to the current working directory if no config or files are present.
function getBaseDir(util, files, config) {
    if (config != null) return path.dirname(util.resolve(config))
    if (files.length !== 0) return util.resolve(globParent(files[0]))
    return util.resolve("test")
}

function shouldAppendExt(glob) {
    if (glob[0] === "!") return false
    if (glob.slice(-1) === path.sep) return false

    if (isWindows) {
        var last = glob.slice(-3)

        return last === "\\**" || last === "/**"
    } else {
        return glob.slice(-3) === "/**"
    }
}

function getRealGlobs(state, ext) {
    if (state.args.files.length === 0) {
        return [state.util.resolve("test/**/*" + ext)]
    } else {
        // Let's be sensical and limit the extension-free globs to this, instead
        // of trying to execute *everything*. Note that it is blind to the file
        // system, though, so it's pretty dumb, and won't notice `tl test`.
        return state.args.files.map(function (glob) {
            var negated = glob.length > 1 && glob[0] === "!"

            if (negated) glob = glob.slice(1)
            if (shouldAppendExt(glob)) glob += path.sep + "*" + ext

            var replacement = state.util.resolve(glob)

            return negated ? "!" + replacement : replacement
        })
    }
}

/**
 * From a CLI `state`, find the config and serialize the modules to be loaded,
 * calling `iterator` on each item with a hook object containing a `load`
 * method, either a `Simple` or `Interpret` instance. This returns a promise to
 * the globs to be loaded.
 *
 * This is very similar in style to the async iteration proposal:
 * https://github.com/tc39/proposal-async-iteration
 */
exports.initialize = function (state, iterator) {
    var data = getInitialData(state)
    var config = state.args.config != null
        ? state.util.resolve(state.args.config)
        : findConfig(state, data)
    var baseDir = getBaseDir(state.util, state.args.files, config)
    var loaded = Object.create(null)
    var queue = []

    function inferInterpret(file) {
        if (!data.exts.test(file)) return
        if (!data.inferrable.test(file)) return

        var ext = data.exts.exec(file)[1]

        if (!hasOwn.call(loaded, ext)) {
            loaded[ext] = true
            queue.push(makeInterpret(state, baseDir, ext))
        }
    }

    data.modules.forEach(function (mod) {
        if (isNonModule(mod)) mod = state.util.resolve(mod)
        queue.push(makeSimple(state, baseDir, mod, false))
    })

    if (config != null && isNonModule(config)) {
        inferInterpret(config)
    }

    // Load the globs' extensions as well, if there were any.
    state.args.files.forEach(function (file) {
        if (file[0] !== "!") inferInterpret(file)
    })

    if (config != null) {
        queue.push(makeSimple(state, baseDir, config, true))
    } else {
        queue.push(makeDefault(state, baseDir))
    }

    // Infer the extension to fill in unknown globs, if we have a config.
    var ext = config != null && data.exts.test(config)
        ? data.exts.exec(config)[1]
        : ".js"
    var globs = getRealGlobs(state, ext)

    return peach(queue, iterator).then(function () { return globs })
}
