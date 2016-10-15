"use strict"

/* eslint-disable global-require */

var fs = require("fs")
var path = require("path")
var Promise = require("../bluebird.js")
var resolveMod = Promise.promisify(require("resolve"))
var GlobStream = require("./glob-stream.js")

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
 * var parse = require("./parse.js")
 * var Util = require("./util.js")
 * var Run = require("./run.js")
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

exports.load = function (file, baseDir) {
    return resolveMod(file, {
        basedir: baseDir,
        extensions: Object.keys(require.extensions),
    })
    .then(function (path) {
        return {exports: require(path)}
    })
}

exports.read = function (file) {
    return Promise.fromCallback(function (callback) {
        return fs.readFile(path.resolve(file), "utf-8", callback)
    })
}

var dummyStat = {
    isDirectory: function () {
        return false
    },

    isFile: function () {
        return false
    },
}

exports.stat = function (file) {
    return new Promise(function (resolve, reject) {
        return fs.stat(path.resolve(file), function (err, stat) {
            if (err == null) {
                return resolve(stat)
            } else if (err.code === "ENOENT") {
                return resolve(dummyStat)
            } else {
                return reject(err)
            }
        })
    })
}

exports.readdir = function (dir) {
    return new Promise(function (resolve, reject) {
        return fs.readdir(path.resolve(dir), function (err, files) {
            return err != null ? reject(err) : resolve(files)
        })
    })
}

exports.resolve = function (file) { return path.resolve(file) }
exports.chdir = process.chdir
exports.cwd = process.cwd

exports.readGlob = function (glob) {
    return new Promise(function (resolve, reject) {
        return GlobStream.create(glob)
        .on("data", require)
        .on("end", resolve)
        .on("warn", function (str) { console.warn("WARNING: " + str) })
        .on("error", reject)
    })
}
