#!/usr/bin/env node
"use strict"

/* eslint-env node */
/* eslint-disable no-process-exit */
// This script filters out Thallium's arguments, and fires `_tl.js` with
// them.

if (require.main !== module) {
    throw new Error("This is not a module!")
}

if (process.argv.length < 3 || process.argv.some(function (arg) {
    return /^(-h|--?help|\/\?|\/h(elp)?)$/.test(arg)
})) {
    /* eslint-disable max-len */

    console.log()
    console.log("Usage: node playground { type }")
    console.log()
    console.log("`type` refers to the directory to run, one of the following:")
    console.log()
    console.log("    pass      - all passing")
    console.log("    fail      - all failing")
    console.log("    skip      - all skipped")
    console.log("    pass-skip - some passing, some skipped")
    console.log("    pass-fail - some passing, some failing")
    console.log("    skip-fail - some skipped, some failing")
    console.log("    all       - some passing, some failing, and some skipped")
    console.log()
    console.log("If you want it with no subtests, use `flat/pass`, etc.")
    console.log()
    console.log("To set the reporter and options, modify `playground/.tl.coffee` however you")
    console.log("need to.")

    /* eslint-enable max-len */

    process.exit()
}

var cp = require("child_process")
var path = require("path")

var dir = process.argv[2]

if (!/^(flat\/)?(pass(-skip|-fail)?|skip(-fail)?|fail|all)$/.test(dir)) {
    throw new TypeError("argument must be a valid directory")
}

// If only I could literally substitute the process...
function exit(code) {
    if (code != null) process.exit(code)
}

cp.spawn(process.argv[0], [
    path.resolve(__dirname, "../bin/_tl.js"),
    path.resolve(__dirname, dir, "**/*.js"),
], {
    cwd: process.cwd(),
    stdio: "inherit",
})
.on("exit", exit)
.on("close", exit)
