#!/usr/bin/env node
/* eslint-env node */
"use strict"

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
var Module = require("module")
var parse = load(process.cwd(), "parse.js", false)
var args = parse(process.argv.slice(2))
var base = args.cwd != null ? path.resolve(args.cwd) : process.cwd()

// Respawn with the local version
load(base, "init.js", args.forceLocal)(args)

// Prefer a local installation to a global one if at all possible
function load(baseDir, name, forceLocal) {
    // Hack: hijack Node's internal resolution algorithm to require the file
    // as if from a fake module in the correct base directory. It also will
    // avoid several bugs with the `resolve` module (Node's is necessarily more
    // stable).
    try {
        if (!forceLocal) {
            var m = new Module(path.resolve(baseDir, "dummy.js"), undefined)

            m.filename = m.id
            m.paths = Module._nodeModulePaths(baseDir)
            m.loaded = true
            return m.require("thallium/" + name)
        }
    } catch (_) {
        // do nothing
    }

    return require("../lib/cli/" + name) // eslint-disable-line global-require
}
