#!/usr/bin/env node
"use strict"

/* eslint-env node */

/**
 * This script loads Thallium, and respawns Node if necessary with the proper
 * CLI flags (if other arguments are passed).
 *
 * It also tries to delegate to the local installation as much as possible.
 */

if (require.main !== module) {
    throw new Error("This is not a module!")
}

var path = require("path")
var resolve = require("resolve")
var parse = require(lookup(process.cwd(), "lib/cli/parse.js", false))
var args = parse(process.argv.slice(2))
var base = args.cwd != null ? path.resolve(args.cwd) : process.cwd()

require(lookup(base, "lib/cli/init.js", args.forceLocal))(
    // Respawn with the local version
    lookup(base, "bin/tl.js", args.forceLocal), args,
    function (e) {
        console.error(e.stack)
        process.exit(1) // eslint-disable-line no-process-exit
    },
    process.exit)

// Prefer a local installation to a global one if at all possible
function lookup(basedir, name, forceLocal) {
    if (forceLocal) return path.resolve(__dirname, "..", name)

    try {
        return resolve.sync("thallium/" + name, {basedir: basedir})
    } catch (_) {
        return path.resolve(__dirname, "..", name)
    }
}
