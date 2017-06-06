#!/usr/bin/env node
"use strict"

/**
 * This is a thin layer of indirection to find and execute the correct init, so
 * it's not otherwise coupled to the CLI initialization process.
 *
 * Note: this hijacks Node's module resolution algorithm to require files as if
 * from a fake module in the correct base directory.
 */

if (require.main !== module) {
    throw new Error("This is not a module!")
}

var path = require("path")
var Module = require("module")
var init

try {
    var baseDir = path.resolve(process.cwd())
    var m = new Module(path.join(baseDir, "dummy.js"), undefined)

    m.filename = m.id
    m.paths = Module._nodeModulePaths(baseDir)
    m.loaded = true
    init = m.require("thallium/lib/cli/init.js")
} catch (_) {
    init = require("../lib/cli/init.js") // eslint-disable-line global-require
}

// Note: This *must* be called after module load, so that errors thrown don't
// result in running the same code twice.
init()
