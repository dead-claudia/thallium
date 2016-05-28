"use strict"

/* eslint-disable global-require */

var Promise = require("bluebird")
var GlobStream = require("glob-stream")
var fs = require("fs")
var path = require("path")
var resolve = require("resolve")

/**
 * The injected utilities for actually running the CLI.
 */

exports.load = function (file, baseDir) {
    return require(resolve.sync(file, {basedir: baseDir}))
}

exports.exists = function (file) {
    try {
        return fs.statSync(path.resolve(file)).isFile()
    } catch (e) {
        if (e.code === "ENOENT" || e.code === "EISDIR") return false
        throw e
    }
}

exports.resolve = function (file) { return path.resolve(file) }
exports.chdir = process.chdir
exports.cwd = process.cwd

exports.readGlob = function (glob) {
    return new Promise(function (resolve, reject) {
        return GlobStream.create(glob, {nodir: true})
        .on("data", function (m) { require(m.path) })
        .on("end", resolve)
        .on("error", reject)
    })
}
