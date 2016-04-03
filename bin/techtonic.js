#!/usr/bin/env node
"use strict"

var cp = require("child_process")
var path = require("path")
var help = require("../lib/cli/help.js")

var args = {
    config: null,
    register: [],
    module: null,
    cwd: null,
}

process.title = "techtonic " +
    process.argv
    .slice(2)
    .map(function (x) { return "'" + JSON.stringify(x).slice(1, -1) + "'" })
    .join(" ")

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
    } else if (/^(-hh|--help-detailed)$/.test(arg)) {
        help(true)
    } else if (/^(-c|--config)$/.test(arg)) {
        last = "config"
    } else if (/^(-r|--register)$/.test(arg)) {
        last = "register"
    } else if (/^(-m|--module)$/.test(arg)) {
        last = "module"
    } else if (arg === "--cwd") {
        last = "cwd"
    } else if (arg === "--") {
        i++
        break
    } else {
        (/-/.test(arg) ? node : rest).push(arg)
    }
}

// Append the rest.
while (i < process.argv.length) rest.push(process.argv[i++])

var count = 2
var code = 0

function exit(status) {
    code = status != null ? status : code
    if (--count) process.exit(code)
}

cp.spawn("node", [].concat.apply([
    node,
    [path.resolve(__dirname, "_techtonic.js")],
    args.config == null ? [] : ["--config", args.config],
    args.module == null ? [] : ["--module", args.module],
    args.cwd == null ? [] : ["--cwd", args.cwd],
    args.register.map(function (arg) { return ["--register", arg] }),
    ["--"],
    rest,
]), {
    cwd: process.cwd(),
    stdio: "inherit",
})
.on("exit", exit)
.on("close", exit)
