"use strict"

/* eslint-disable no-process-exit */

var fs = require("fs")
var path = require("path")
var browserify = require("browserify")
var mkdirp = require("mkdirp")

/**
 * Note: all paths are relative to this module. Also, the format for each entry
 * is this:
 *
 * "module name": ["source file", "destination file"]
 */
var modules = {
    "thallium/assertions": ["../assertions.js", "../dist/assertions.js"],
    "thallium/core": ["../core.js", "../dist/core.js"],
    "thallium/index": ["../index.js", "../dist/index.js"],
    "thallium": ["../index.js", "../dist/index.js"],
    "thallium/r/tap": ["../r/tap.js", "../dist/r/tap.js"],
    "thallium/r/spec": ["../r/spec.js", "../dist/r/spec.js"],
    "thallium/r/dot": ["../r/dot.js", "../dist/r/dot.js"],
}

Object.keys(modules).forEach(function (name) {
    var pair = modules[name]
    var src = path.resolve(__dirname, pair[0])
    var dest = path.resolve(__dirname, pair[1])

    function bail(e) {
        console.error(e)
        process.exit(1)
    }

    return mkdirp(path.dirname(dest), function (err) {
        if (err != null) return bail(err)
        return browserify()
        .require(src, {expose: name})
        .bundle()
        .on("error", bail)
        .pipe(fs.createWriteStream(dest, "utf-8"))
        .on("error", bail)
        .on("end", function () { process.exit() })
    })
})
