"use strict"

const Promise = require("bluebird")
const gs = require("glob-stream")
const fs = require("fs")
const path = require("path")

/**
 * The injected utilities for actually running the CLI.
 */

function resolve(file) {
    return path.resolve(process.cwd(), file)
}

exports.load = dir => require(resolve(dir)) // eslint-disable-line global-require, max-len

exports.exists = function (file) {
    try {
        return fs.stat(resolve(file)).isDirectory()
    } catch (e) {
        if (e.code === "ENOENT" || e.code === "EISDIR") return false
        throw e
    }
}

exports.chdir = process.chdir

exports.readGlobs = glob => new Promise((resolve, reject) => {
    gs.create(glob, {nodir: true})
    .on("error", reject)
    .on("data", require)
    .on("end", resolve)
})
