"use strict"

var tty = require("tty")

var useColors = require("supports-color") || // eslint-disable-line global-require, max-len
    process.env.THALLIUM_COLORS != null

var isatty = tty.isatty(1) && tty.isatty(2)

function colorToNumber(name) {
    switch (name) {
    case "pass": return 90
    case "fail": return 31

    case "bright pass": return 92
    case "bright fail": return 91
    case "bright yellow": return 93

    case "pending": return 36
    case "suite": return 0

    case "error title": return 0
    case "error message": return 31
    case "error stack": return 90

    case "checkmark": return 32
    case "fast": return 90
    case "medium": return 33
    case "slow": return 31
    case "green": return 32
    case "light": return 90

    case "diff gutter": return 90
    case "diff added": return 32
    case "diff removed": return 31
    default: throw new TypeError("Invalid name: \"" + name + "\"")
    }
}

/**
 * Default symbol map.
 */

if (process.platform === "win32") {
    // With node.js on Windows: use symbols available in terminal default fonts
    exports.symbols = {
        ok: "\u221A",
        err: "\u00D7",
        dot: ".",
    }
} else {
    exports.symbols = {
        ok: "✓",
        err: "✖",
        dot: "․",
    }
}

exports.color = function (name, str) {
    if (useColors) {
        return "\u001b[" + colorToNumber(name) + "m" + str + "\u001b[0m"
    } else {
        return String(str)
    }
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
