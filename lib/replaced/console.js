"use strict"

/* eslint-env node */

/**
 * This contains the Node-specific console stuff.
 */

var tty = require("tty")
var methods = require("../methods")
var Util = require("../util")
var assert = Util.assert
var pcall = Util.pcall
var stdout = process.stdout

exports.windowWidth = 75
exports.newline = require("os").EOL

/**
 * Default symbol map.
 */
exports.symbols = Object.freeze({
    Pass: "✓",
    Fail: "✖",
    Dot: "․",
    DotFail: "!",
})

if (process.platform === "win32") {
    // With node on Windows: use symbols available in terminal default fonts
    exports.symbols = Object.freeze({
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
exports.Defaults = Defaults
function Defaults(opts) {
    this.opts = opts
    this.lastIsNewline = true
}

methods(Defaults, {
    write: function (str) {
        assert(typeof str === "string")
        this.lastIsNewline =
            str.slice(-this.opts.newline.length) !== this.opts.newline
        return pcall(function (callback) {
            stdout.write(str, "utf-8", callback)
        })
    },

    reset: function () {
        if (!this.lastIsNewline) {
            this.lastIsNewline = true
            var self = this

            return pcall(function (callback) {
                stdout.write(self.opts.newline, "utf-8", callback)
            })
        } else {
            return Promise.resolve()
        }
    },
})

// If nothing has printed yet, don't print a newline afterwards.
var lastIsNewline = true

exports.defaults = {
    write: function (str) {
        assert(typeof str === "string")
        lastIsNewline = str.slice(-exports.newline.length) !== exports.newline
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
    if (process.env.FORCE_COLOR) {
        return {isSupported: true, isForced: true}
    } else if (process.env.FORCE_NO_COLOR) {
        return {isSupported: false, isForced: true}
    } else if (!stdout.isTTY) {
        return {isSupported: false, isForced: false}
    } else if (process.platform === "win32") {
        return {isSupported: true, isForced: false}
    } else if (process.env.CI || process.env.TEAMCITY_VERSION) {
        return {isSupported: false, isForced: false}
    } else if (process.env.COLORTERM) {
        return {isSupported: true, isForced: false}
    } else if (process.env.TERM === "dumb") {
        return {isSupported: false, isForced: false}
    } else if (/^xterm-256(color)?/.test(process.env.TERM)) {
        return {isSupported: true, isForced: false}
    } else {
        return {
            isSupported: /^screen|^xterm|^vt100|color|ansi|cygwin|linux/i
                .test(process.env.TERM),
            isForced: false,
        }
    }
})()
