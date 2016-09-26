#!/usr/bin/env node
"use strict"

/* eslint-disable no-process-exit */
// This script filters out Thallium's arguments, and fires `_thallium.js` with
// them.

if (require.main !== module) {
    throw new Error("This is not a module!")
}

var cp = require("child_process")
var path = require("path")
var fs = require("fs")

function help(value) {
    var file = value === "detailed" ? "help-detailed.txt" : "help-simple.txt"
    var text = fs.readFileSync(
        path.resolve(__dirname, "../lib/cli", file),
        "utf-8")

    // Pad the top by a line.
    console.log()
    console.log(
        process.platform === "win32"
            ? text.replace("\n", "\r\n")
            : text)
}

var args = {
    config: null,
    require: [],
    cwd: null,
}

var color
var node = []
var rest = []
var last, i

for (i = 2; i < process.argv.length; i++) {
    var arg = process.argv[i]

    if (last != null) {
        if (Array.isArray(args[last])) args[last].push(arg)
        else args[last] = arg
        last = null
    } else if (/^(-h|--help)$/.test(arg)) {
        help()
        process.exit()
    } else if (/^(-hh|--help-detailed)$/.test(arg)) {
        help(true)
        process.exit()
    } else if (/^--(no-)?color$/.test(arg)) {
        color = arg
    } else if (/^(-c|--config)$/.test(arg)) {
        last = "config"
    } else if (/^(-r|--require)$/.test(arg)) {
        last = "require"
    } else if (arg === "--cwd") {
        last = "cwd"
    } else if (arg === "--") {
        i++
        break
    } else {
        (/^-/.test(arg) ? node : rest).push(arg)
    }
}

// Append the rest.
while (i < process.argv.length) rest.push(process.argv[i++])

// If only I could literally substitute the process...
function exit(code) {
    if (code != null) process.exit(code)
}

cp.spawn(process.argv[0], Array.prototype.concat.apply([], [
    node,
    [path.resolve(__dirname, "_thallium.js")],
    color || [],
    args.config == null ? [] : ["--config", args.config],
    args.cwd == null ? [] : ["--cwd", args.cwd],
    Array.prototype.concat.apply([],
        args.require.map(function (arg) { return ["--require", arg] })),
    ["--"],
    rest,
]), {
    cwd: process.cwd(),
    stdio: "inherit",
})
.on("exit", exit)
.on("close", exit)
