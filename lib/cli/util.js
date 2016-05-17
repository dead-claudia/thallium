"use strict"

/* eslint-disable global-require */

const Promise = require("bluebird")
const gs = require("glob-stream")
const fs = require("fs")
const path = require("path")
const resolve = require("resolve")

/**
 * The injected utilities for actually running the CLI.
 */

exports.load = (file, baseDir) => {
    return require(resolve.sync(file, {basedir: baseDir}))
}

exports.exists = file => {
    try {
        return fs.statSync(path.resolve(file)).isFile()
    } catch (e) {
        if (e.code === "ENOENT" || e.code === "EISDIR") return false
        throw e
    }
}

exports.resolve = file => path.resolve(file)
exports.chdir = process.chdir
exports.cwd = process.cwd

exports.readGlob = glob => new Promise((resolve, reject) => {
    return gs.create(glob, {nodir: true})
    .on("data", m => require(m.path))
    .on("end", resolve)
    .on("error", reject)
})
