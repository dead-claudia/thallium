#!/usr/bin/env node
"use strict"

process.title = "techtonic"

var cp = require("child_process")
var path = require("path")
var help = require("./cli-help.js")

var args = {
    config: null,
    register: [],
    module: null,
    cwd: null,
}

var node = []
var rest = []
var last

for (var i = 2; i < process.argv.length; i++) {
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

var res = cp.spawnSync("node", [].concat.apply([
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

process.exit(res.status)
