#!/usr/bin/env node
"use strict"

/* eslint-env node */
/* eslint-disable no-process-exit */
// This script filters out Thallium's arguments, and fires `tl` with
// them.

if (require.main !== module) {
    throw new Error("This is not a module!")
}

if (process.argv.length < 3 || process.argv.some(function (arg) {
    return /^(-h|--?help|\/\?|\/h(elp)?)$/.test(arg)
})) {
    /* eslint-disable max-len */

    console.log()
    console.log("Usage: node playground { type } | start")
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
    console.log("To set the reporter and options, modify `playground/.tl.js` however you need")
    console.log("to.")
    console.log()
    console.log("Additionally, you may run `node playground start` to start a server that serves")
    console.log("up an HTML version to run the playground tests with the DOM runner")

    /* eslint-enable max-len */

    process.exit()
}

var cp = require("child_process")
var path = require("path")
var http = require("http")
var ecstatic = require("ecstatic")
var dir = process.argv[2]

if (dir === "start") {
    http.createServer(ecstatic(path.dirname(__dirname)))
    .listen(8080, function () {
        console.log("Server is available at http://localhost:8080")
    })
} else if (!/^(flat\/)?(pass(-skip|-fail)?|skip(-fail)?|fail|all)$/.test(dir)) {
    throw new TypeError("argument must be a valid directory")
} else {
    // If only I could literally substitute the process...
    cp.spawn(process.argv[0], [
        path.resolve(__dirname, "../bin/tl.js"),
        "--force-local",
        path.resolve(__dirname, dir, "**/*.js"),
    ], {
        cwd: process.cwd(),
        stdio: "inherit",
    })
    .on("exit", function (code) { if (code != null) process.exit(code) })
    .on("close", function (code) { if (code != null) process.exit(code) })
}
