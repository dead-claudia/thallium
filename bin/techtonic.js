#!/usr/bin/env node
"use strict"

if (require.main !== module) {
    throw new Error("This is not a module!")
}

const cp = require("child_process")
const path = require("path")
const help = require("../lib/cli/help.js")

const args = {
    config: null,
    register: [],
    module: null,
    cwd: null,
}

const node = []
const rest = []
let last, i

for (i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i]

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

process.exit(cp.spawnSync(process.argv[0], [].concat(...[
    node,
    [path.resolve(__dirname, "_techtonic.js")],
    args.config == null ? [] : ["--config", args.config],
    args.module == null ? [] : ["--module", args.module],
    args.cwd == null ? [] : ["--cwd", args.cwd],
    args.register.map(arg => ["--register", arg]),
    ["--"],
    rest,
]), {
    cwd: process.cwd(),
    stdio: "inherit",
}).code)
