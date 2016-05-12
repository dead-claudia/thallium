"use strict"

/**
 * This is the main front-end for the CLI.
 */

const path = require("path")
const Promise = require("bluebird")

const parse = require("./args.js").parse
const resolveAny = require("../util.js").resolveAny
const LoaderData = require("./loader-data.js")
const findConfig = require("./find-config.js")
const load = require("./load.js")
const merge = require("./merge.js").mergeState
const help = require("./help.js")

/**
 * This represents the CLI state.
 *
 * - `opts.argv` represents the raw arguments as an array.
 * - `opts.cwd` represents the initial current working directory.
 * - `opts.util` represents the external state. It's injected because it's
 * 	 easier to mock a few higher level methods than to set up a mock for a fully
 * 	 functional `fs` mock.
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
    let reset = false

    return (ev, done) => {
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

    const exts = path.basename(file).split(".")
    let ext

    do {
        ext = `.${exts.pop()}`
    } while (!loaders.has(ext) && exts.length)

    return exts.length !== 0 ? ext : ".js"
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

    let ext, baseDir

    return Promise.try(() => {
        state.util.chdir(state.args.cwd)

        const loaders = LoaderData.extractIntoMap(state)
        const file = findConfig(state, loaders)

        if (state.args.files.length === 0) {
            ext = anticipateExt(file, loaders)
        }

        baseDir = path.relative(state.args.cwd, path.dirname(file))

        return load(state.util.load, file, loaders, baseDir)
    })
    .then(data => merge(state, data, baseDir))
    .tap(data => data.techtonic.reporter(exitReporter(state)))
    .tap(data => {
        if (data.files.length === 0) data.files = [`test/**/*${ext}`]
    })
    .tap(data => state.util.readGlob(data.files))
    .then(data => resolveAny(data.techtonic.run, data.techtonic))
    .then(() => +state.fail)
    // Don't forget to do this.
    .finally(() => { state.util.chdir(state.oldCwd) })
}
