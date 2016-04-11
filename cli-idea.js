/* eslint-disable */
"use strict"

/**
 * CLI:
 *
 * -h, --help - basic help
 * -H, --help-detailed - detailed help
 * --cwd [directory] - current working directory to use
 * -c, --config [file] - config to use
 * -r, --register [ext] - register extension from node-interpret
 * -r, --register [ext]:[module] - register extension with module
 * -m, --module [techtonic] - what module to use for Techtonic
 * -R, --reporter [reporter] - use a reporter imported from a module, accepts
 *                             subarg syntax for options (wrap in brackets to
 *                             just call with empty object).
 * -- - stop parsing options
 * [files...] - One or more files globs
 */

// General
const path = require("path")
const t = require("techtonic")

t.reporter(require("techtonic/r/spec")())
t.use(require("techtonic-sinon"))
t.use(require("techtonic-bdd"))

// Could also be a Promise returning this.
module.exports = {
    files: "./**",
    module: "techtonic",
    techtonic: t,
}

// Parallel
// .techtonic.js
const path = require("path")
const t = require("techtonic")

t.reporter(require("techtonic/r/spec")())

// Could also be a Promise returning this.
module.exports = {
    files: "./**",
    module: "techtonic",
    // Note: the `techtonic` property is ignored.
    parallel: true, // auto-scale parallelism
}

// .techtonic-child.js
const path = require("path")
const t = require("techtonic")

t.use(require("techtonic-sinon"))
t.use(require("techtonic-bdd"))

// Could also be a Promise returning this.
module.exports = {
    techtonic: t,
}
