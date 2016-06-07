"use strict"

/* global console */

/**
 * This contains the browser-specific reporter stuff.
 */

var Promise = require("bluebird")
var useColors = false

// Settable for debugging
exports.useColors = function (value) {
    if (arguments.length) return useColors = !!value
    else return useColors
}

/**
 * Default symbol map.
 */
exports.Symbols = Object.freeze({
    Pass: "✓",
    Fail: "✖",
    Dot: "․",
})

exports.windowWidth = 75

exports.newline = "\n"

/**
 * Since browsers don't have unbuffered output, this kind of simulates it.
 */

var acc = ""

exports.defaultReset = function () {
    if (acc !== "") {
        console.log(acc)
        acc = ""
    }
}

exports.defaultLog = function (line) {
    return Promise.fromCallback(function (callback) {
        if (acc !== "") {
            line += acc
            acc = ""
        }

        var lines = line.split("\n")

        // So lines are printed consistently.
        for (var i = 0; i < lines.length; i++) {
            console.log(lines[i])
        }

        return callback()
    })
}

exports.defaultWrite = function (str) {
    return Promise.fromCallback(function (callback) {
        var index = str.indexOf("\n")

        if (index < 0) {
            acc += str
            return callback()
        }

        console.log(acc + str.slice(0, index))

        var lines = str.slice(index + 1).split("\n")

        acc = lines.pop()

        for (var i = 0; i < lines.length; i++) {
            console.log(lines[i])
        }

        return callback()
    })
}
