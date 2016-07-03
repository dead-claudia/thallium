"use strict"

/* eslint-env node */

/**
 * This contains the Node-specific reporter stuff.
 */

var tty = require("tty")

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

if (tty.isatty(1) && tty.isatty(2)) {
    if (process.stdout.columns) {
        exports.windowWidth = process.stdout.columns
    } else if (process.stdout.getWindowSize) {
        exports.windowWidth = process.stdout.getWindowSize(1)[0]
    } else if (tty.getWindowSize) {
        exports.windowWidth = tty.getWindowSize()[1]
    }
}

var newline = exports.newline = process.platform === "win32" ? "\r\n" : "\n"
var lastIsNewline = true

exports.defaultOpts = {
    log: function (line, callback) {
        lastIsNewline = true
        return process.stdout.write(line + newline, "utf-8", callback)
    },

    write: function (str, callback) {
        lastIsNewline = str.slice(-1) !== "\n"
        return process.stdout.write(str, "utf-8", callback)
    },

    reset: function (callback) {
        if (!lastIsNewline) {
            return process.stdout.write(newline, "utf-8", callback)
        } else {
            return callback()
        }
    },
}

/**
 * Derived from supports-color, but with all the `level` whatever and all the
 * other useless crud this doesn't need from that. Also, it ignores CLI flags,
 * and can be force-set.
 */
exports.colorSupport = (function () {
    var env = process.env

    if (env.FORCE_COLOR) return 0x3
    if (env.FORCE_NO_COLOR) return 0x2
    if (process.stdout && !process.stdout.isTTY) return 0x0
    if (process.platform === "win32") return 0x1
    if (env.CI || env.TEAMCITY_VERSION) return 0x0
    if (env.COLORTERM) return 0x1
    if (env.TERM === "dumb") return 0x0
    if (/^xterm-256(color)?/.test(env.TERM)) return 0x1
    return /^screen|^xterm|^vt100|color|ansi|cygwin|linux/i.test(env.TERM)|0
})()
