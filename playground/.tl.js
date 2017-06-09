"use strict"

// Set the directory via the wrapper script:
// node playground pass
// node playground fail
// etc...
//
// Run `node playground` for more details.

// Set the reporter and options below:
var t = exports.thallium = require("../index")

t.reporter = ["spec"]
