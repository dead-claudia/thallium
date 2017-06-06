"use strict"

/* eslint-disable global-require */

var Module = require("module")
var fs = require("fs")
var path = require("path")
var GlobStream = require("./glob-stream")

/**
 * The injected utilities for actually running the CLI. If you need to port the
 * CLI to any other platform, make a file implementing these methods:
 *
 * - `load(file, baseDir)` - Resolve and load a module.
 * - `read(file)` - Read the contents of a file.
 * - `stat(file)` - Retrieve a stat for the file. It expects a module with two
 *   boolean methods: `stat.isFile()` and `stat.isDirectory()`.
 * - `readdir(dir)` - Get a directory listing.
 * - `resolve(file)` - Resolve a file relative to the current working directory,
 *   if it's not already absolute.
 * - `chdir(directory)` - Change the current working directory.
 * - `cwd()` - Get the current working directory.
 * - `readGlob(globs)` - Execute a glob, loading each file matched by it.
 *
 * Then, you can make a new entry script like this:
 *
 * ```js
 * var parse = require("./args").parse
 * var Util = require("./util")
 * var Run = require("./run")
 *
 * Run.run(parse(argv), Util)
 * .catch(function (e) {
 *     printError(e.stack)
 *     return 1
 * })
 * .then(exit)
 * ```
 *
 * And you're good to go.
 */

exports.load = function (file, basedir) {
    // Hack: hijack Node's internal resolution algorithm to require the file
    // as if from a fake module in the correct base directory. It also will
    // avoid several bugs with the `resolve` module (Node's is necessarily more
    // stable).
    var m = new Module(path.resolve(basedir, "dummy.js"), undefined)

    m.filename = m.id
    m.paths = Module._nodeModulePaths(basedir)
    m.loaded = true
    return m.require(file)
}

exports.stat = function (file) {
    return fs.statSync(path.resolve(file))
}

exports.readdir = function (dir) {
    return fs.readdirSync(path.resolve(dir))
}

exports.resolve = function (file) {
    return path.resolve(file)
}

exports.chdir = process.chdir
exports.cwd = process.cwd

exports.readGlob = function (glob) {
    return new Promise(function (resolve, reject) {
        var gs = GlobStream.create(glob)

        if (gs == null) {
            console.warn("WARNING: No positive glob")
            return resolve()
        } else {
            return GlobStream.create(glob)
            .on("data", require)
            .on("end", resolve)
            .on("warn", function (str) { console.warn("WARNING: " + str) })
            .on("error", reject)
        }
    })
}
