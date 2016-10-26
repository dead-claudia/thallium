"use strict"

/**
 * This is the main front-end for the CLI.
 */

var Loader = require("./loader.js")
var CliCommon = require("./common.js")
var Colors = require("../settings.js").Colors

/**
 * This represents the CLI state.
 *
 * - `args` represents the parsed arguments.
 * - `util` represents the external state. It's injected because it's easier to
 *   mock a few higher level methods than to set up a mock for a fully
 * 	 functional `fs` mock.
 */
// Exported for testing
exports.State = State
function State(args, util) {
    this.args = args
    this.util = util
    this.oldCwd = undefined
    this.fail = false
}

// Exported for testing
exports.exitReporter = exitReporter
function exitReporter(state) {
    var reset = false

    return function (report) {
        if (reset) {
            state.fail = false
            reset = false
        }

        if (report.isEnd) {
            reset = true
        } else if (report.isError) {
            state.fail = true
            reset = true
        } else if (!state.fail) {
            state.fail = report.isFail || report.isError
        }
    }
}

/**
 * See the State class above for options.
 */
exports.run = function (args, util) {
    var state = new State(args, util)

    if (state.args.color != null) {
        Colors.forceSet(state.args.color)
    }

    if (state.args.cwd != null) {
        state.oldCwd = util.cwd()
        state.util.chdir(state.args.cwd)
    }

    var config = {}
    var baseDir

    return Loader.initialize(state, function (loader) {
        return Loader.load(loader).then(function (result) {
            if (loader.mask & Loader.Mask.Config) {
                if (result != null) config = result
                baseDir = loader.baseDir
            }
        })
    })
    .then(function (globs) {
        return CliCommon.merge({
            files: globs,
            config: config,
            load: state.util.load,
            baseDir: baseDir,
            isDefault: state.args.files.length === 0,
        })
    })
    .then(function (data) {
        data.thallium.reporter(exitReporter(state))
        return state.util.readGlob(data.files)
        .then(function () { return data })
    })
    .then(function (data) { return data.thallium.run() })
    // Don't forget to clean up the environment.
    .then(
        function () {
            if (state.oldCwd != null) state.util.chdir(state.oldCwd)
            Colors.forceRestore()
            return +state.fail
        },
        function (e) {
            if (state.oldCwd != null) state.util.chdir(state.oldCwd)
            Colors.forceRestore()
            throw e
        })
}
