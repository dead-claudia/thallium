"use strict"

/**
 * This is the main front-end for the CLI.
 */

var fs = require("fs")
var path = require("path")

var Promise = require("../bluebird.js")
var Loader = require("./loader.js")
var CliCommon = require("./common.js")
var R = require("../reporter.js")

function help(value) {
    var file = value === "detailed" ? "help-detailed.txt" : "help-simple.txt"
    var text = fs.readFileSync(path.resolve(__dirname, file), "utf-8")

    // Pad the top by a line.
    console.log()
    console.log(
        process.platform === "win32"
            ? text.replace("\n", "\r\n")
            : text)
}

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

    return function (ev) {
        if (reset) {
            state.fail = false
            reset = false
        }

        if (ev.end()) {
            reset = true
        } else if (ev.error()) {
            state.fail = true
            reset = true
        } else if (!state.fail) {
            state.fail = ev.fail() || ev.error()
        }
    }
}

/**
 * See the State class above for options.
 */
exports.run = function (args, util) {
    var state = new State(args, util)

    if (state.args.help != null) {
        help(state.args.help)
        return Promise.resolve(0)
    }

    if (state.args.color != null) {
        R.Colors.forceSet(state.args.color)
    }

    return Promise.try(function () {
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
            return state.util.readGlob(data.files).return(data)
        })
    })
    .then(function (data) { return data.thallium.run() })
    .then(function () { return +state.fail })
    // Don't forget to do this.
    .finally(function () {
        if (state.oldCwd != null) state.util.chdir(state.oldCwd)
        R.Colors.forceRestore()
    })
}
