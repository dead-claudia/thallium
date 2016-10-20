"use strict"

/* eslint no-console: 2 */

var path = require("path")
var interpret = require("interpret")
var peach = require("../util.js").peach
var resolveDefault = require("./common.js").resolveDefault
var globParent = require("./glob-parent.js")

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

function getDataFromArgs(state) {
    var data = {exts: [], modules: [], loads: []}

    for (var i = 0; i < state.args.require.length; i++) {
        var entry = state.args.require[i]
        var index = entry.indexOf(":")

        if (index >= 0) {
            var ext = entry.slice(0, index)

            if (ext[0] !== ".") ext = "." + ext
            data.exts.push(ext)
            data.modules.push(entry.slice(index + 1))
        } else {
            data.loads.push(entry)
        }
    }

    return data
}

function getInitialData(state) {
    var data = getDataFromArgs(state)
    var loads = []
    var loadsCache = Object.create(null)
    var i

    // Uniquify the data, in insertion order.
    for (i = 0; i < data.loads.length; i++) {
        var load = data.loads[i]

        if (!hasOwn.call(loadsCache, load)) {
            loadsCache[load] = true
            loads.push(load)
        }
    }

    var exts = Object.create(null)
    var inferrable = Object.create(null)
    var modules = []
    var ext

    // Uniquify the modules, in reverse insertion order
    for (i = data.exts.length - 1; i >= 0; i--) {
        ext = data.exts[i]

        if (!hasOwn.call(exts, ext)) {
            exts[ext] = true
            modules.push(data.modules[i])
        }
    }

    modules.reverse()

    // Mixin the interpret modules as well
    for (ext in interpret.jsVariants) {
        if (hasOwn.call(interpret.jsVariants, ext) && !hasOwn.call(exts, ext)) {
            exts[ext] = true
            if (ext !== ".js" && ext !== ".node") inferrable[ext] = true
        }
    }

    return {
        exts: keysToRegExp(exts),
        inferrable: keysToRegExp(inferrable),
        modules: modules,
        loads: loads,
    }
}

// `Array.prototype.reduce` won't work here, because it doesn't permit breaking
// early.
function findFirst(list, isEnd, func, initial) {
    if (list.length === 0) return initial
    return loop(initial, 0)
    function loop(last, index) {
        return func(last, list[index]).then(function (next) {
            if (index + 1 === list.length || isEnd(next)) return next
            return loop(next, index + 1)
        })
    }
}

function findConfig(state, data) {
    var cached = Object.create(null)

    function hasExt(file, ext) {
        return data.exts.test(file) && data.exts.exec(file)[1] === ext
    }

    function resolve(dir, file) {
        return state.util.resolve(path.join(dir, file))
    }

    function searchPath(dir, isConfigExt, recurse) {
        var cache = cached[dir] = {
            map: Object.create(null),
            default: undefined,
        }

        return state.util.readdir(dir)
        .then(function (files) {
            return files.filter(function (file) {
                return file === ".tl.js" ||
                    file.slice(0, 4) === ".tl." && isConfigExt(file)
            })
        })
        .catch(function (e) {
            if (e.code === "ENOENT") return []
            if (e.code === "ENOTDIR") return []
            if (e.code === "EISDIR") return []
            throw e
        })
        .then(function (listing) {
            return findFirst(listing, function (last) {
                return last === ".tl.js"
            }, function (last, file) {
                var ext = data.exts.exec(file)[1]

                return state.util.stat(path.join(dir, file))
                .then(function (stat) { return stat.isFile() ? file : last })
                .catch(function (e) {
                    if (e.code === "ENOENT") return last
                    if (e.code === "ENOTDIR") return last
                    if (e.code === "EISDIR") return last
                    throw e
                })
                .then(function (file) {
                    if (file != null) cache.map[ext] = resolve(dir, file)
                    return file
                })
            })
        })
        .then(function (file) {
            if (file != null) return cache.default = resolve(dir, file)
            if (path.dirname(dir) === dir) return undefined
            return recurse(path.dirname(dir))
        })
    }

    function searchPathInferred(dir) {
        if (hasOwn.call(cached, dir)) {
            // Just infer a key out of it. If there's none, rely on the default.
            // If there's a JS ext, prefer that. Otherwise, pick one and use it,
            // since there's usually only one.
            var cache = cached[dir]
            var keys = Object.keys(cache.map)

            if (keys.length === 0) return cache.default
            if (hasOwn.call(cache.map, ".js")) return cache.map[".js"]
            return cache.map[keys[0]]
        }

        return searchPath(dir,
            function (file) { return data.exts.test(file) },
            searchPathInferred)
    }

    function searchPathExt(dir, ext) {
        if (hasOwn.call(cached, dir)) {
            var cache = cached[dir]

            return Promise.resolve(cache.map[ext] || cache.default)
        }

        return searchPath(dir,
            function (file) { return hasExt(file, ext) },
            function (dir) { return searchPathExt(dir, ext) })
    }

    return findFirst(
        state.args.files.length ? state.args.files : ["test/**"],
        function (last) { return last.matched },
        function (last, glob) {
            glob = state.util.resolve(glob)

            if (data.exts.test(glob)) {
                var ext = data.exts.exec(glob)[1]

                return searchPathExt(globParent(glob), ext)
                .then(function (file) {
                    if (hasExt(file, ext)) {
                        last.matched = true
                        last.name = file
                    } else if (last.name == null) {
                        last.matched = false
                        last.name = file
                    }

                    return last
                })
            } else if (last.name == null) {
                return searchPathInferred(globParent(glob))
                .then(function (file) {
                    last.matched = false
                    last.name = file
                    return last
                })
            } else {
                return Promise.resolve(last)
            }
        },
        {matched: false, name: undefined})
    .then(function (result) {
        return result.name
    })
}

var isWindows = process.platform === "win32"

function isNonModule(path) {
    if (isWindows) {
        return /^[A-Za-z]:[\\\/]|^[\\\/]|^\.\.?[\\\/]/.test(path)
    } else {
        return /^\.?\.?\//.test(path)
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
function makeSimple(state, baseDir, mod, config) {
    return {
        state: state,
        baseDir: baseDir,
        mod: mod,
        mask: config ? Mask.Config : 0,
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

function loadMod(state, baseDir, mod) {
    return state.util.load(mod, baseDir).then(function (mod) {
        return resolveDefault(mod.exports)
    })
}

function loadExt(state, baseDir, mod) {
    return load(0)
    function load(index) {
        if (index >= mod.length) return Promise.resolve(false)

        var entry = mod[index]
        var promise

        if (typeof entry === "string") {
            promise = state.util.load(entry, baseDir)
        } else {
            promise = state.util.load(entry.module, baseDir)
            .then(function (mod) { entry.register(mod.exports) })
        }

        // Recurse with the next one if no module was found.
        return promise.then(
            function () { return true },
            function (e) {
                if (e.code !== "MODULE_NOT_FOUND") throw e
                return load(index + 1)
            })
    }
}

exports.load = function (loader) {
    if (!(loader.mask & Mask.Internal)) {
        return load(loader.state, loader.baseDir, loader.mod, loader.mask)
    } else if (loader.mask & Mask.Config) {
        return load(loader.state, loader.baseDir, undefined, loader.mask)
    } else {
        return load(loader.state, loader.baseDir, loader.ext, loader.mask)
    }
}

function load(state, baseDir, name, mask) {
    if (!(mask & Mask.Internal)) {
        return loadMod(state, baseDir, name)
    } else if (mask & Mask.Config) {
        return Promise.all([
            loadMod(state, baseDir, "thallium"),
            loadMod(state, baseDir, "thallium/r/spec"),
        ]).then(function (opts) {
            opts[0].reporter((0, opts[1])())
            return {thallium: opts[0]}
        })
    } else {
        var mod = interpret.jsVariants[name]

        if (mod == null) return Promise.resolve()
        return loadExt(state, baseDir, Array.isArray(mod) ? mod : [mod])
        .then(function (loaded) {
            if (!loaded) {
                // Let's be a little more helpful here...
                var last = Array.isArray(mod) ? mod[0] : mod
                var idea = typeof last === "string" ? last : last.module

                throw new Error(
                    "Could not find loader for ext " + name + ". " +
                    "Try `npm i` if you haven't already, or " +
                    "`npm i --save-dev " + idea + "`, if you aren't already " +
                    "using that or something else.")
            }
        })
    }
}

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

function serialize(state, data, config, iterator) {
    // Default to the current working directory if no config is present.
    var baseDir = getBaseDir(state.util, state.args.files, config)
    var loaded = Object.create(null)

    function inferInterpret(file) {
        if (data.exts.test(file) && data.inferrable.test(file)) {
            var ext = data.exts.exec(file)[1]

            if (!hasOwn.call(loaded, ext)) {
                loaded[ext] = true
                return iterator(makeInterpret(state, baseDir, ext))
            }
        }

        return Promise.resolve()
    }

    function doSimple(mod, config) {
        if (!config && isNonModule(mod)) {
            mod = state.util.resolve(mod)
        }

        return iterator(makeSimple(state, baseDir, mod, !!config))
    }

    return peach(data.modules, function (mod) {
        return doSimple(mod, false)
    })

    .then(function () {
        return config != null && isNonModule(config)
            ? inferInterpret(config)
            : undefined
    })

    // Load the globs' extensions as well, if there were any.
    .then(function () {
        return peach(state.args.files, function (file) {
            return file[0] !== "!" ? inferInterpret(file) : undefined
        })
    })

    // Load all the require hooks, *then* load all the modules themselves.
    .then(function () {
        return peach(data.loads, function (file) {
            return isNonModule(file) ? inferInterpret(file) : undefined
        })
    })

    .then(function () {
        return peach(data.loads, function (file) {
            return doSimple(file, false)
        })
    })

    .then(function () {
        return config != null
            ? doSimple(config, true)
            : iterator(makeDefault(state, baseDir))
    })

    .then(function () {
        // Infer the extension to fill in unknown globs, if we have a config.
        var ext = config != null && data.exts.test(config)
            ? data.exts.exec(config)[1]
            : ".js"

        if (state.args.files.length === 0) {
            return [state.util.resolve("test/**/*" + ext)]
        }

        // Let's be sensical and limit the extension-free globs to this, instead
        // of trying to execute *everything*. Note that it is blind to the file
        // system, though, so it's pretty dumb, and won't notice `tl test`.
        var globs = []

        for (var i = 0; i < state.args.files.length; i++) {
            var glob = state.args.files[i]
            var negated = glob.length > 1 && glob[0] === "!"

            if (negated) glob = glob.slice(1)
            if (shouldAppendExt(glob)) glob += path.sep + "*" + ext

            var replacement = state.util.resolve(glob)

            globs.push(negated ? "!" + replacement : replacement)
        }

        return globs
    })
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

    if (state.args.config != null) {
        var config = state.util.resolve(state.args.config)

        return serialize(state, data, config, iterator)
    } else {
        return findConfig(state, data).then(function (config) {
            return serialize(state, data, config, iterator)
        })
    }
}
