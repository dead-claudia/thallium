"use strict"

// A simple script to set up the `thallium/assert` definition, run on both
// postinstall and `clean-assert` update.

var fs = require("fs")
var path = require("path")
var file = require.resolve("clean-assert/index.d.ts")
var dest = path.resolve(__dirname, "../assert.d.ts")

fs.createReadStream(file).pipe(fs.createWriteStream(dest))
