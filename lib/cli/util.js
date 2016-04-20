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

exports.exists = file => {
    try {
        return fs.statSync(resolve(file)).isFile()
    } catch (e) {
        if (e.code === "ENOENT" || e.code === "EISDIR") return false
        throw e
    }
}

exports.chdir = process.chdir

exports.readGlobs = glob => new Promise((resolve, reject) => {
    gs.create(glob, {nodir: true})
    .on("error", e => reject(e))
    .on("data", m => require(m.path)) // eslint-disable-line global-require
    .on("end", () => resolve())
})
