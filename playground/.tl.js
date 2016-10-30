"use strict"

// Set the directory via the wrapper script:
// node playground pass
// node playground fail
// etc...
//
// Run `node playground` for more details.

// Set the reporter and options below:
var reporter = {
    module: "../r/spec",
    opts: {},
}

var t = exports.thallium = require("../index")

t.reporter(require(reporter.module), reporter.opts)
