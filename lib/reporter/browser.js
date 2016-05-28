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

exports.defaultLog = function (line) {
    return Promise.fromCallback(function (callback) {
        console.log(line + "\n")
        return callback()
    })
}
