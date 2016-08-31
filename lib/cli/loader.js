"use strict"

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

var interpretExt = keysToRegExp(interpret.jsVariants)

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
    var modules = []

    // Uniquify the modules, in reverse insertion order
    for (i = data.exts.length - 1; i >= 0; i--) {
        var ext = data.exts[i]

        if (!hasOwn.call(exts, ext)) {
            exts[ext] = true
            modules.push(data.modules[i])
        }
    }

    modules.reverse()

    return {
        exts: keysToRegExp(exts),
        modules: modules,
        loads: loads,
    }
}

function DataAdder(dataMap, index, ext) {
    this.dataMap = dataMap
    this.index = index
    this.ext = ext
}

function addSingleToMap(adder, file, level) {
    adder.dataMap[file] = {
        ext: adder.ext,
        index: adder.index,
        level: level,
    }
}

function diffExisting(adder, file, level) {
    var cached = adder.dataMap[file]

    if (cached.index < adder.index) {
        cached.ext = adder.ext
        cached.index = adder.index
        cached.level = level
    } else if (cached.index === adder.index) {
        cached.level = Math.min(cached.level, level)
        cached.ext = adder.ext
    } else {
        // The parents also have higher indices. Just skip
        // the rest.
        return false
    }
    return true
}

function checkSingle(adder, file, level) {
    if (hasOwn.call(adder.dataMap, file)) {
        return diffExisting(adder, file, level)
    } else {
        addSingleToMap(adder, file, level)
        return true
    }
}

function addPathToMap(adder, file) {
    // Only proceed if the index is lower or equal or if the file
    // doesn't yet exist.
    if (!hasOwn.call(adder.dataMap, file) ||
            adder.dataMap[file].index <= adder.index) {
        // The level is never negative.
        addSingleToMap(adder, file, 0)
    }

    var next = file
    var level = 0

    do {
        level++
        file = next
        next = path.dirname(file)
    } while (checkSingle(adder, file, level) && next !== file)
}

function ConfigFinder(state, data) {
    this.state = state
    this.data = data
    this.dataMap = Object.create(null)
    this.cached = Object.create(null)
    this.last = undefined
}

function getPossibleExt(finder, file) {
    if (interpretExt.test(file)) {
        return interpretExt.exec(file)[1]
    } else if (finder.data.exts.test(file)) {
        return finder.data.exts.exec(file)[1]
    } else {
        return undefined
    }
}

function isConfigLike(finder, data) {
    if (data.base.slice(0, 4) !== ".tl.") {
        return false
    } else if (!finder.data.exts.test(data.base) &&
            !interpretExt.test(data.base)) {
        return false
    } else if (data.base.slice(-3) === ".js") {
        return true
    } else {
        return data.data.ext == null ||
            data.base.slice(-data.data.ext.length) === data.data.ext
    }
}

function higherPriority(finder, data) {
    // Check for the level before the index. The lower, the
    // higher. Also, plain JS is higher precedence than anything
    // else.
    return data.data.level < finder.last.data.level ||
        data.data.index < finder.last.data.index ||
        finder.last.base !== ".tl.js" && data.base === ".tl.js"
}

function checkDir(finder, dir) {
    if (hasOwn.call(finder.cached, dir)) {
        return undefined
    }

    finder.cached[dir] = true

    return finder.state.util.readdir(dir)

    // Gracefully ignore missing directories.
    .catchReturn({code: "ENOENT"}, [])

    // Resolve the file and data.
    .map(function (base) {
        return {
            base: base,
            data: finder.dataMap[dir],
            file: path.join(dir, base),
        }
    })

    // If we've already read a listing from it, it's clearly can't be a config.
    .filter(function (data) {
        return !hasOwn.call(finder.cached, data.file) &&
            isConfigLike(finder, data)
    })

    // Iterate the entries themselves in parallel.
    .map(function (data) {
        // Only do a stat if we have to. We can skip it if a last good file
        // exists, and this one is higher priority than that.

        if (finder.last == null) {
            return finder.state.util.stat(data.file).then(function (stat) {
                if (finder.last == null || higherPriority(finder, data)) {
                    if (stat.isFile()) finder.last = data
                }
            })
        } else if (higherPriority(finder, data)) {
            return finder.state.util.stat(data.file).then(function (stat) {
                if (stat.isFile()) finder.last = data
            })
        } else {
            return undefined
        }
    })
}

function addGlobToMap(finder, file, i) {
    var adder = new DataAdder(finder.dataMap, i, getPossibleExt(finder, file))
    var parent = Common.globParent(finder.state.util.resolve(file))

    addPathToMap(adder, parent)
}

function findConfig(finder) {
    var files = finder.state.args.files.length
        ? finder.state.args.files
        : ["test/**"]

    for (var i = 0; i < files.length; i++) {
        if (files[i][0] !== "!") {
            addGlobToMap(finder, files[i], i)
        }
    }

    // Iterate each directory in sequence. It's actually faster this way.
    return Promise.each(Object.keys(finder.dataMap), function (dir) {
        return checkDir(finder, dir)
    })
    .then(function () {
        return finder.last != null ? finder.last.file : undefined
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
            .then(function (mod) { entry.register(mod.exports) })
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

function Serializer(state, data, config, iterator) {
    this.state = state
    this.data = data
    this.config = config
    this.iterator = iterator

    // Default to the current working directory if no config is present.
    this.baseDir = getBaseDir(state.util, state.args.files, config)
    this.loaded = Object.create(null)
}

function inferInterpret(serializer, file) {
    if (interpretExt.test(file) && !serializer.data.exts.test(file)) {
        var ext = interpretExt.exec(file)[1]

        if (!hasOwn.call(serializer.loaded, ext) && ext !== ".js") {
            serializer.loaded[ext] = true
            return (0, serializer.iterator)(
                new Interpret(serializer.state, serializer.baseDir, ext))
        }
    }

    return Promise.resolve()
}

function doSimple(serializer, mod, config) {
    return (0, serializer.iterator)(
        new Simple(serializer.state, serializer.baseDir, mod, !!config))
}

function inferExtension(config, exts) {
    if (config == null) {
        return ".js"
    } else if (interpretExt.test(config)) {
        return interpretExt.exec(config)[1]
    } else if (exts.test(config)) {
        return exts.exec(config)[1]
    } else {
        return ".js"
    }
}

function finalizeExtension(serializer) {
    // Infer the extension to fill in unknown globs, if we have a config.
    var ext = inferExtension(serializer.config, serializer.data.exts)

    if (serializer.state.args.files.length === 0) {
        return [serializer.state.util.resolve("test/**/*" + ext)]
    }

    // Let's be sensical and limit the extension-free globs to this, instead
    // of trying to execute *everything*. Note that it is blind to the file
    // system, though, so it's pretty dumb, and won't notice `tl test`.
    var globs = []
    var files = serializer.state.args.files

    for (var i = 0; i < files.length; i++) {
        var glob = files[i]
        var negated = glob.length > 1 && glob[0] === "!"

        if (negated) glob = glob.slice(1)
        if (shouldAppendExt(glob)) glob += path.sep + "*" + ext

        var replacement = serializer.state.util.resolve(glob)

        globs.push(negated ? "!" + replacement : replacement)
    }

    return globs
}

function serialize(serializer) {
    return Promise.each(serializer.data.modules, function (mod) {
        return doSimple(serializer, mod, false)
    })

    .then(function () {
        if (serializer.config != null && isNonModule(serializer.config)) {
            return inferInterpret(serializer, serializer.config)
        } else {
            return undefined
        }
    })

    // Load the globs' extensions as well, if there were any.
    .return(serializer.state.args.files).each(function (file) {
        if (file[0] !== "!") {
            return inferInterpret(serializer, file)
        } else {
            return undefined
        }
    })

    // Load all the require hooks, *then* load all the modules themselves.
    .return(serializer.data.loads).each(function (file) {
        if (isNonModule(file)) {
            return inferInterpret(serializer, file)
        } else {
            return undefined
        }
    })
    .each(function (file) { return doSimple(serializer, file, false) })
    .then(function () {
        if (serializer.config != null) {
            return doSimple(serializer, serializer.config, true)
        } else {
            return undefined
        }
    })
    .then(function () { return finalizeExtension(serializer) })
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

        return serialize(new Serializer(state, data, config, iterator))
    } else {
        var finder = new ConfigFinder(state, data)

        return findConfig(finder).then(function (config) {
            return serialize(new Serializer(state, data, config, iterator))
        })
    }
}
