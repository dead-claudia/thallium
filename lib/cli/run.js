"use strict"

/**
 * This is the main front-end for the CLI.
 */

var Loader = require("./loader")
var CliCommon = require("./common")
var Console = require("../replaced/console")
var assert = require("../util").assert

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
    assert(args != null && typeof args === "object")
    assert(util != null && typeof util === "object")

    this.colorsForced = Console.colorSupport.isForced
    this.colorsSupported = Console.colorSupport.isSupported
    this.args = args
    this.util = util
    this.oldCwd = undefined
}

function restore(state) {
    assert(state != null && typeof state === "object")
    if (state.oldCwd != null) state.util.chdir(state.oldCwd)
    Console.colorSupport.isForced = state.colorsForced
    Console.colorSupport.isSupported = state.colorsSupported
}

/**
 * See the State class above for options.
 */
exports.run = function (args, util) {
    var state = new State(args, util)

    if (state.args.color != null) {
        Console.colorSupport.isForced = true
        Console.colorSupport.isSupported = !!state.args.color
    }

    if (state.args.cwd != null) {
        state.oldCwd = util.cwd()
        state.util.chdir(state.args.cwd)
    }

    var config, baseDir

    return Loader.initialize(state, function (loader) {
        return Loader.load(loader).then(function (result) {
            if (loader.mask & Loader.Mask.Config) {
                if (result != null) config = result
                baseDir = loader.baseDir
            }
        })
    })
    .then(function (files) {
        return CliCommon.merge({
            files: files,
            config: config,
            baseDir: baseDir,
            load: state.util.load,
            isDefault: state.args.files.length === 0,
        })
    })
    .then(function (data) {
        return state.util.readGlob(data.files)
        .then(function () { return data.t.run() })
    })
    // Don't forget to clean up the environment.
    .then(
        function (result) { restore(state); return +!result.isSuccess },
        function (e) { restore(state); throw e })
}
