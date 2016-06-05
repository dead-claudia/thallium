"use strict"

/**
 * This is the main front-end for the CLI.
 */

var fs = require("fs")
var path = require("path")
var Promise = require("bluebird")

var parse = require("./args.js").parse
var resolveAny = require("../core/common.js").resolveAny
var serialize = require("./loader.js").serialize
var CliCommon = require("./common.js")

function help(value) {
    var file = value === "detailed" ? "help-detailed.txt" : "help-simple.txt"
    var text = fs.readFileSync(path.resolve(__dirname, file), "utf-8")

    // Pad the top by a line.
    console.log()
    console.log(
        process.platform === "win32"
            ? text.replace(/\n/g, "\r\n")
            : text)
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

/**
 * See the State class above for options.
 */
exports.run = function (opts) {
    var state = new State(opts)

    if (state.args.help) {
        help(state.args.help)
        return Promise.resolve(0)
    }

    return Promise.try(function () {
        state.util.chdir(state.args.cwd)

        var config, baseDir

        return serialize(state, function (loader) {
            return loader.load().then(function (result) {
                if (loader.config) {
                    config = result != null ? result : {}
                    baseDir = loader.baseDir
                }
            })
        })
        .then(function (globs) {
            return CliCommon.merge(globs, config, state.util.load, baseDir)
        })
        .then(function (data) {
            data.thallium.reporter(exitReporter(state))
            return state.util.readGlob(data.files).return(data)
        })
    })
    .then(function (data) {
        // This *might* be wrapped, so let's not assume the one who wrapped it
        // upheld *both* parts of the API, accepting a callback and returning a
        // promise, but instead assume they just upheld one.
        return resolveAny(data.thallium.run, data.thallium)
    })
    .then(function () { return +state.fail })
    // Don't forget to do this.
    .finally(function () { state.util.chdir(state.oldCwd) })
}
