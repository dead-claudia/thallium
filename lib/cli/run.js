"use strict"

/**
 * This is the main front-end for the CLI.
 */

var fs = require("fs")
var path = require("path")
var Promise = require("bluebird")

var parse = require("./args.js").parse
var resolveAny = require("../common.js").resolveAny
var Loader = require("./loader.js")
var CliCommon = require("./common.js")

function help(value) {
    var file = value === "detailed" ? "help-detailed.txt" : "help-simple.txt"

    // Pad the top by a line.
    console.log()
    console.log(fs.readFileSync(path.resolve(__dirname, file), "utf-8"))
}

/**
 * Load the config using the file from `loader.js` and the loader map.
 * `load` is `state.util.load` from the command line state, `file` is the config
 * file, and `loaders` contain all the loaders to register. It returns a promise
 * to the loaded config.
 */
exports.load = function (load, file, loaders, baseDir) {
    // Load all previously marked modules.
    return Promise.each(Object.keys(loaders), function (key) {
        return loaders[key].register(baseDir)
    })
    .then(function () {
        if (file == null) return {}
        return CliCommon.resolveDefault(load(file, baseDir))
    })
    .then(function (data) {
        return CliCommon.isObjectLike(data) ? data : {}
    })
}

var hasOwn = Object.prototype.hasOwnProperty

/**
 * This represents the CLI state.
 *
 * - `opts.argv` represents the raw arguments as an array.
 * - `opts.cwd` represents the initial current working directory.
 * - `opts.util` represents the external state. It's injected because it's
 * 	 easier to mock a few higher level methods than to set up a mock for a fully
 * 	 functional `fs` mock.
 */
// Exported for testing
exports.State = State
function State(opts) {
    this.oldCwd = opts.cwd
    this.args = parse(opts.cwd, opts.argv)
    this.fail = false
    this.util = opts.util
}

// Exported for testing
exports.exitReporter = exitReporter
function exitReporter(state) {
    var reset = false

    return function (ev, done) {
        if (reset) {
            state.fail = false
            reset = false
        }

        if (ev.type === "end") {
            reset = true
        } else if (!state.fail) {
            state.fail = ev.type === "fail" || ev.type === "extra"
        }

        return done()
    }
}

function anticipateExt(file, loaders) {
    if (Loader.isValid(file)) return Loader.getExt(file)
    if (!/\./.test(file)) return ".js"

    var exts = path.basename(file).split(".")
    var ext

    do {
        ext = "." + exts.pop()
    } while (!hasOwn.call(loaders, ext) && exts.length)

    return exts.length !== 0 ? ext : ".js"
}

/**
 * See the State class above for options.
 */
exports.run = function (opts) {
    var state = new State(opts)

    if (state.args.help) {
        help(state.args.help)
        return Promise.resolve(0)
    }

    var ext, baseDir

    return Promise.try(function () {
        state.util.chdir(state.args.cwd)

        var loaders = Loader.extractIntoMap(state)
        var file = Loader.findConfig(state, loaders)

        if (state.args.files.length === 0) {
            ext = anticipateExt(file, loaders)
        }

        baseDir = path.relative(state.util.cwd(), path.dirname(file))

        return exports.load(state.util.load, file, loaders, baseDir)
    })
    .then(function (data) {
        return CliCommon.mergeState(state, data, baseDir)
    })
    .tap(function (data) {
        return data.thallium.reporter(exitReporter(state))
    })
    .tap(function (data) {
        if (data.files.length === 0) data.files = ["test/**/*" + ext]
    })
    .tap(function (data) {
        return state.util.readGlob(data.files)
    })
    .then(function (data) {
        return resolveAny(data.thallium.run, data.thallium)
    })
    .then(function () { return +state.fail })
    // Don't forget to do this.
    .finally(function () { state.util.chdir(state.oldCwd) })
}
