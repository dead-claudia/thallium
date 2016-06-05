"use strict"

/* eslint-disable global-require */

var Promise = require("bluebird")
var GlobStream = require("./glob-stream.js")
var fs = require("fs")
var path = require("path")
var resolveMod = require("resolve")

/**
 * The injected utilities for actually running the CLI.
 */

exports.load = function (file, baseDir) {
    return new Promise(function (resolve, reject) {
        return resolveMod(file, {
            basedir: baseDir,
            extensions: [".js", ".node", ".json"],
        }, function (err, path) {
            return err != null ? reject(err) : resolve(path)
        })
    })
    .then(function (path) {
        return {exports: require(path)}
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
        .on("data", function (m) { require(m.path) })
        .on("end", resolve)
        .on("warn", function (str) { console.warn("WARNING: " + str) })
        .on("error", reject)
    })
}
