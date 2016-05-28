"use strict"

/* eslint-env node */

/**
 * This contains the Node-specific reporter stuff.
 */

var Promise = require("bluebird")
var tty = require("tty")

var useColors = process.env.THALLIUM_COLORS ||
    require("supports-color") // eslint-disable-line global-require

var isatty = tty.isatty(1) && tty.isatty(2)

// Settable for debugging
exports.useColors = function (value) {
    if (arguments.length) return useColors = !!value
    else return useColors
}

/**
 * Default symbol map.
 */
if (process.platform === "win32") {
    // With node.js on Windows: use symbols available in terminal default fonts
    exports.Symbols = Object.freeze({
        Pass: "\u221A",
        Fail: "\u00D7",
        Dot: ".",
    })
} else {
    exports.Symbols = Object.freeze({
        Pass: "✓",
        Fail: "✖",
        Dot: "․",
    })
}

exports.windowWidth = 75

if (isatty) {
    if (process.stdout.columns) {
        exports.windowWidth = process.stdout.columns
    } else if (process.stdout.getWindowSize) {
        exports.windowWidth = process.stdout.getWindowSize(1)[0]
    } else if (tty.getWindowSize) {
        exports.windowWidth = tty.getWindowSize()[1]
    }
}

var lineEnding = process.platform === "win32" ? "\r\n" : "\n"

exports.defaultLog = function (line) {
    return Promise.fromCallback(function (callback) {
        return process.stdout.write(line + lineEnding, "utf-8", callback)
    })
}
