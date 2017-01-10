"use strict"

/**
 * This is the main front-end for the CLI.
 */

var Loader = require("./loader")
var CliCommon = require("./common")
var Colors = require("../settings").Colors

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

function restore(state) {
    if (state.oldCwd != null) state.util.chdir(state.oldCwd)
    Colors.forceRestore()
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
    .then(function (files) {
        var data = CliCommon.merge({
            files: files,
            config: config,
            baseDir: baseDir,
            load: state.util.load,
            isDefault: state.args.files.length === 0,
        })

        data.thallium.call(function (reflect) {
            reflect.reporter(exitReporter, state)
        })

        return state.util.readGlob(data.files).then(function () {
            // This is intentionally *after* all tests are loaded.
            // TODO: In v0.4, change this to use `hasReporter`
            if (data.thallium._.root.reporter == null) {
                data.thallium.reporter(
                    CliCommon.resolveDefault(
                        state.util.load("thallium/r/spec", baseDir)))
            }

            return data.thallium.run()
        })
    })
    // Don't forget to clean up the environment.
    .then(
        function () { restore(state); return +state.fail },
        function (e) { restore(state); throw e })
}
