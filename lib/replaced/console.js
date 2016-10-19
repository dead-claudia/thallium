"use strict"

/**
 * This contains the Node-specific console stuff.
 */

var tty = require("tty")
var pcall = require("../util.js").pcall
var stdout = global.process.stdout

exports.windowWidth = 75
exports.newline = require("os").EOL

/**
 * Default symbol map.
 */
exports.Symbols = Object.freeze({
    Pass: "✓",
    Fail: "✖",
    Dot: "․",
})

if (global.process.platform === "win32") {
    // With node on Windows: use symbols available in terminal default fonts
    exports.Symbols = Object.freeze({
        Pass: "\u221A",
        Fail: "\u00D7",
        Dot: ".",
    })
}

if (tty.isatty(1) && tty.isatty(2)) {
    if (global.process.stdout.columns) {
        exports.windowWidth = stdout.columns
    } else if (stdout.getWindowSize) {
        exports.windowWidth = stdout.getWindowSize(1)[0]
    } else if (tty.getWindowSize) {
        exports.windowWidth = tty.getWindowSize()[1]
    }
}

// If nothing has printed yet, don't print a newline afterwards.
var lastIsNewline = true

exports.defaultOpts = {
    print: function (line) {
        lastIsNewline = true
        return pcall(function (callback) {
            stdout.write(line + exports.newline, "utf-8", callback)
        })
    },

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
    var env = global.process.env

    if (env.FORCE_COLOR) return 0x3
    if (env.FORCE_NO_COLOR) return 0x2
    if (!stdout.isTTY) return 0x0
    if (global.process.platform === "win32") return 0x1
    if (env.CI || env.TEAMCITY_VERSION) return 0x0
    if (env.COLORTERM) return 0x1
    if (env.TERM === "dumb") return 0x0
    if (/^xterm-256(color)?/.test(env.TERM)) return 0x1
    return /^screen|^xterm|^vt100|color|ansi|cygwin|linux/i.test(env.TERM)|0
})()
