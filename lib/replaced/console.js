"use strict"

/* eslint-env node */

/**
 * This contains the Node-specific console stuff.
 */

var tty = require("tty")
var pcall = require("../util").pcall
var stdout = process.stdout

exports.windowWidth = 75
exports.newline = require("os").EOL

/**
 * Default symbol map.
 */
exports.Symbols = Object.freeze({
    Pass: "✓",
    Fail: "✖",
    Dot: "․",
    DotFail: "!",
})

if (process.platform === "win32") {
    // With node on Windows: use symbols available in terminal default fonts
    exports.Symbols = Object.freeze({
        Pass: "\u221A",
        Fail: "\u00D7",
        Dot: ".",
        DotFail: "!",
    })
}

// Travis mysteriously presents a TTY with zero columns, so this must be
// checked. See https://github.com/travis-ci/travis-ci/issues/6896.
if (tty.isatty(1) && tty.isatty(2) && stdout.columns) {
    exports.windowWidth = stdout.columns
}

// If nothing has printed yet, don't print a newline afterwards.
var lastIsNewline = true

exports.defaultOpts = {
    write: function (str) {
        var newline = exports.newline

        lastIsNewline = str.slice(-newline.length) !== newline
        return pcall(function (callback) {
            stdout.write(str, "utf-8", callback)
        })
    },

    reset: function () {
        if (!lastIsNewline) {
            lastIsNewline = true
            return pcall(function (callback) {
                stdout.write(exports.newline, "utf-8", callback)
            })
        } else {
            return Promise.resolve()
        }
    },
}

/**
 * colorSupport is a mask with the following bits:
 * 0x1 - if set, colors supported by default
 * 0x2 - if set, force color support
 *
 * Derived from supports-color, but with all the `level` whatever and all
 * the other useless crud this doesn't need from that. Also, it ignores CLI
 * flags.
 */
exports.colorSupport = (function () {
    if (process.env.FORCE_COLOR) return 0x3
    if (process.env.FORCE_NO_COLOR) return 0x2
    if (!stdout.isTTY) return 0x0
    if (process.platform === "win32") return 0x1
    if (process.env.CI || process.env.TEAMCITY_VERSION) return 0x0
    if (process.env.COLORTERM) return 0x1
    if (process.env.TERM === "dumb") return 0x0
    if (/^xterm-256(color)?/.test(process.env.TERM)) return 0x1
    return /^screen|^xterm|^vt100|color|ansi|cygwin|linux/i
        .test(process.env.TERM)|0
})()
