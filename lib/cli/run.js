"use strict"

/**
 * This is the main front-end for the CLI.
 */

const Promise = require("bluebird")

const parse = require("./args.js").parse
const resolveAny = require("../util.js").resolveAny
const LoaderData = require("./loader-data.js")
const inferLocation = require("./infer-location.js")
const load = require("./load.js")
const merge = require("./merge.js")
const help = require("./help.js")

/**
 * This contains the CLI state.
 *
 * @param  {Object} opts
 * @param  {string[]} opts.argv The CLI arguments, to be parsed.
 * @param  {string} opts.cwd  The default current working directory.
 * @param  {Object} opts.util A set of utilities to use to power the CLI. Mostly
 *                            for testing.
 *
 *                            Currently, this should have two members: `load`
 *                            and `exists`.
 */
class State {
    constructor(opts) {
        this.oldCwd = opts.cwd
        this.args = parse(opts.cwd, opts.argv)
        this.fail = false
        this.util = opts.util
    }
}
// Exported for testing
exports.State = State

// Exported for testing
exports.exitReporter = exitReporter
function exitReporter(state) {
    return (report, done) => {
        if (!state.fail) {
            state.fail = report.type === "fail" || report.type === "extra"
        }

        return done()
    }
}

/**
 * See the State class above for options.
 */
exports.run = opts => {
    const state = new State(opts)

    if (state.args.help) {
        help(state.args.help)
        return Promise.resolve(0)
    }

    return Promise.try(() => {
        state.util.chdir(state.args.cwd)
        return LoaderData.extractIntoMap(state)
    })
    .then(data => inferLocation(state, data))
    .then(data => load(state, data))
    .then(data => merge(state, data))
    .tap(data => { data.techtonic.reporter(exitReporter(state)) })
    .tap(data => {
        return state.util.readGlob(data.files.length ? data.files : ["test/**"])
    })
    .get("techtonic")
    .then(t => resolveAny(t.run, t))
    .then(() => +state.fail)
    // Don't forget to do this.
    .finally(() => { state.util.chdir(state.oldCwd) })
    .bind(undefined)
}
