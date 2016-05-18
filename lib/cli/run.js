"use strict"

/**
 * This is the main front-end for the CLI.
 */

var path = require("path")
var Promise = require("bluebird")

var parse = require("./args.js").parse
var resolveAny = require("../util.js").resolveAny
var LoaderData = require("./loader-data.js")
var findConfig = require("./find-config.js")
var load = require("./load.js")
var merge = require("./merge.js").mergeState
var help = require("./help.js")

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

        if (ev.type === "exit") {
            reset = true
        } else if (!state.fail) {
            state.fail = ev.type === "fail" || ev.type === "extra"
        }

        return done()
    }
}

function anticipateExt(file, loaders) {
    if (LoaderData.isValid(file)) return LoaderData.getExt(file)
    if (!/\./.test(file)) return ".js"

    var exts = path.basename(file).split(".")
    var ext

    do {
        ext = "." + exts.pop()
    } while (!loaders.has(ext) && exts.length)

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

        var loaders = LoaderData.extractIntoMap(state)
        var file = findConfig(state, loaders)

        if (state.args.files.length === 0) {
            ext = anticipateExt(file, loaders)
        }

        baseDir = path.relative(state.util.cwd(), path.dirname(file))

        return load(state.util.load, file, loaders, baseDir)
    })
    .then(function (data) {
        return merge(state, data, baseDir)
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
