"use strict"

/* eslint no-console: 2 */

var path = require("path")
var interpret = require("interpret")
var Promise = require("../bluebird.js")
var methods = require("../methods.js")
var m = require("../messages.js")
var Common = require("./common.js")

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
        inferrable: inferrable,
        modules: modules,
        loads: loads,
    }
}

// TL;DR: Bluebird's `Promise.prototype.reduce` sucks...
//
// Bluebird doesn't call the `reduce` callback when the initial value is
// `undefined` and the files only contain one entry, and this is documented
// behavior. I think it's rather pointless and inconsistent, because I plainly
// don't see the use case, and it doesn't align with nearly every other JS
// `reduce` function, including the one in the standard.
//
// The only potential use case I see is for performance, but even that should
// normally be handwritten to show the intent behind it, so it's clear why it
// works that way.
function findFirst(promise, func, initial) {
    return Promise.resolve(promise).then(function (list) {
        return list.reduce(
            function (p, item) { return Promise.join(p, item, func) },
            Promise.resolve(initial))
    })
}

function findConfig(state, data) {
    var cached = Object.create(null)

    function hasExt(file, ext) {
        return data.exts.test(file) && data.exts.exec(file)[1] === ext
    }

    function resolve(dir, file) {
        return state.util.resolve(path.join(dir, file))
    }

    function searchPathInferred(dir) {
        if (hasOwn.call(cached, dir)) {
            // Just infer a key out of it. If there's none, rely on the default.
            // If there's a JS ext, prefer that. Otherwise, pick one and use it,
            // since there's usually only one.
            var keys = Object.keys(cached[dir].map)

            if (keys.length === 0) return cached[dir].default
            if (hasOwn.call(cached[dir].map, ".js")) {
                return cached[dir].map[".js"]
            }
            return cached[dir].map[keys[0]]
        }

        var cache = cached[dir] = {
            map: Object.create(null),
            default: undefined,
        }

        return findFirst(
            state.util.readdir(dir)
            .filter(function (file) {
                return file === ".tl.js" ||
                    file.slice(0, 4) === ".tl." && data.exts.test(file)
            })
            .catchReturn({code: "ENOENT"}, []),
            function (last, file) {
                var ext = last === ".tl.js" ? ".js" : data.exts.exec(file)[1]

                return Promise.try(function () {
                    if (last === ".tl.js") return last
                    return state.util.stat(path.join(dir, file))
                    .then(function (stat) {
                        return stat.isFile() ? file : last
                    })
                    .catchReturn({code: "ENOENT"}, last)
                })
                .tap(function (file) {
                    if (file != null) cache.map[ext] = resolve(dir, file)
                })
            })
        .then(function (file) {
            if (file != null) {
                file = state.util.resolve(path.join(dir, file))
                return cache.default = file
            }
            if (path.dirname(dir) === dir) return undefined
            return searchPathInferred(path.dirname(dir))
        })
    }

    function searchPath(dir, ext) {
        if (hasOwn.call(cached, dir)) {
            return Promise.resolve(cached[dir].map[ext] || cached[dir].default)
        }

        var cache = cached[dir] = {
            map: Object.create(null),
            default: undefined,
        }

        return findFirst(
            state.util.readdir(dir)
            .filter(function (file) {
                return file === ".tl.js" ||
                    file.slice(0, 4) === ".tl." && hasExt(file, ext)
            })
            .catchReturn({code: "ENOENT"}, []),
            function (last, file) {
                var ext = last === ".tl.js" ? ".js" : data.exts.exec(file)[1]

                return Promise.try(function () {
                    if (last === ".tl.js") return last
                    return state.util.stat(path.join(dir, file))
                    .then(function (stat) {
                        return stat.isFile() ? file : last
                    })
                    .catchReturn({code: "ENOENT"}, last)
                })
                .tap(function (file) {
                    if (file != null) cache.map[ext] = resolve(dir, file)
                })
            })
        .then(function (file) {
            if (file != null) {
                file = state.util.resolve(path.join(dir, file))
                return cache.default = file
            }
            if (path.dirname(dir) === dir) return undefined
            return searchPath(path.dirname(dir), ext)
        })
    }

    return findFirst(
        state.args.files.length ? state.args.files : ["test/**"],
        function (last, glob) {
            if (last.matched) {
                return last
            }
            glob = state.util.resolve(glob)

            if (data.exts.test(glob)) {
                var ext = data.exts.exec(glob)[1]

                return searchPath(Common.globParent(glob), ext)
                .then(function (file) {
                    if (hasExt(file, ext)) return {matched: true, name: file}
                    if (last.name == null) return {matched: false, name: file}
                    return last
                })
            } else if (last.name == null) {
                return searchPathInferred(Common.globParent(glob))
                .then(function (file) { return {matched: false, name: file} })
            } else {
                return last
            }
        },
        {matched: false, name: undefined})
    .get("name")
}

var isWindows = process.platform === "win32"

function isNonModule(path) {
    if (isWindows) {
        return /^[A-Za-z]:[\\\/]|^[\\\/]|^\.\.?[\\\/]/.test(path)
    } else {
        return /^\.?\.?\//.test(path)
    }
}

// Exported for testing
exports.Simple = Simple
function Simple(state, baseDir, mod, config) {
    if (!config && isNonModule(mod)) {
        mod = state.util.resolve(mod)
    }

    this.state = state
    this.baseDir = baseDir
    this.mod = mod
    this.config = !!config
}

methods(Simple, {
    load: function () {
        return this.state.util.load(this.mod, this.baseDir)
        .then(function (mod) {
            return Common.resolveDefault(mod.exports)
        })
    },
})

// Exported for testing
exports.Interpret = Interpret
function Interpret(state, baseDir, ext) {
    this.state = state
    this.baseDir = baseDir
    this.ext = ext
    // Consistency
    this.config = false
}

methods(Interpret, {
    loadSingle: function (entry) {
        var promise

        if (typeof entry === "string") {
            promise = this.state.util.load(entry, this.baseDir)
        } else {
            promise = this.state.util.load(entry.module, this.baseDir)
            .then(function (mod) { return entry.register(mod.exports) })
        }

        return promise
        .return(true)
        // Let's not hide errors from trying to execute the hook.
        .catchReturn({code: "MODULE_NOT_FOUND"}, false)
    },

    load: function () {
        var self = this
        var mod = interpret.jsVariants[self.ext]

        return Promise.try(function () {
            if (mod == null) {
                return true
            } else if (Array.isArray(mod)) {
                return Promise.reduce(mod, function (loaded, mod) {
                    return loaded || self.loadSingle(mod)
                }, false)
            } else {
                return self.loadSingle(mod)
            }
        })
        .then(function (loaded) {
            if (!loaded) {
                // Let's be a little more helpful here...
                var last = Array.isArray(mod) ? mod[0] : mod
                var idea = typeof last === "string" ? last : last.module

                throw new Error(m("missing.cli.loader", self.ext, idea))
            }
        })
    },
})

function getBaseDir(util, files, config) {
    if (config != null) return path.dirname(util.resolve(config))
    if (files.length !== 0) return util.resolve(Common.globParent(files[0]))
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
        if (data.exts.test(file)) {
            var ext = data.exts.exec(file)[1]

            if (data.inferrable[ext] && !hasOwn.call(loaded, ext)) {
                loaded[ext] = true
                return iterator(new Interpret(state, baseDir, ext))
            }
        }

        return Promise.resolve()
    }

    function doSimple(mod, config) {
        return iterator(new Simple(state, baseDir, mod, !!config))
    }

    return Promise.each(data.modules, function (mod) {
        return doSimple(mod, false)
    })

    .then(function () {
        return config != null && isNonModule(config)
            ? inferInterpret(config)
            : undefined
    })

    // Load the globs' extensions as well, if there were any.
    .return(state.args.files).each(function (file) {
        return file[0] !== "!" ? inferInterpret(file) : undefined
    })

    // Load all the require hooks, *then* load all the modules themselves.
    .return(data.loads).each(function (file) {
        return isNonModule(file) ? inferInterpret(file) : undefined
    })
    .each(function (file) { return doSimple(file, false) })
    .then(function () {
        return config != null ? doSimple(config, true) : undefined
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
exports.serialize = function (state, iterator) {
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
