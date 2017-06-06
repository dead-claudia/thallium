"use strict"

var Util = require("../util")
var Console = require("../replaced/console")
var assert = Util.assert

/*
 * Stack normalization
 */

// Exported for debugging
exports.readStack = readStack
function readStack(e) {
    var stack = Util.getStack(e)

    // If it doesn't start with the message, just return the stack.
    //  Firefox, Safari                Chrome, IE
    if (/^(@)?\S+\:\d+/.test(stack) || /^\s*at/.test(stack)) {
        return formatLineBreaks(stack)
    }

    var index = stack.indexOf(e.message)

    if (index < 0) return formatLineBreaks(Util.getStack(e))
    var re = /\r?\n/g

    re.lastIndex = index + e.message.length
    if (!re.test(stack)) return ""
    return formatLineBreaks(stack.slice(re.lastIndex))
}

function formatLineBreaks(str) {
    assert(typeof str === "string")

    return str.replace(/^\s+|[^\r\n\S]+$/g, "")
        .replace(/\s*(\r?\n|\r)\s*/g, Console.newline)
}

exports.getStack = function (e) {
    if (!(e instanceof Error)) return formatLineBreaks(Util.getStack(e))
    var description = (e.name + ": " + e.message)
        .replace(/\s+$/gm, "")
        .replace(/\r?\n|\r/g, Console.newline)
    var stripped = readStack(e)

    if (stripped === "") return description
    return description + Console.newline + stripped
}

// Color palette pulled from Mocha
function colorToNumber(name) {
    assert(typeof name === "string")

    switch (name) {
    case "pass": return 90
    case "fail": return 31

    case "bright pass": return 92
    case "bright fail": return 91
    case "bright yellow": return 93

    case "skip": return 36
    case "suite": return 0
    case "plain": return 0

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

// TODO: use the state to calculate this instead of relying on a global...
exports.color = color
function color(name, str) {
    assert(typeof name === "string")
    assert(typeof str === "string")

    if (Console.colorSupport.isSupported) {
        return "\u001b[" + colorToNumber(name) + "m" + str + "\u001b[0m"
    } else {
        return str
    }
}

exports.setColor = function (_) {
    assert(_ != null && typeof _ === "object")
    if (_.opts.color != null) {
        Console.colorSupport.isSupported = !!_.opts.color
    }
}

exports.unsetColor = function (_) {
    assert(_ != null && typeof _ === "object")
    if (_.opts.color != null && !Console.colorSupport.isForced) {
        Console.colorSupport.isSupported = this.oldSupported
    }
}

var Status = exports.Status = Object.freeze({
    Unknown: 0,
    Skipped: 1,
    Passing: 2,
    Failing: 3,
})

exports.Tree = function (value) {
    assert(value == null || typeof value === "string")

    this.value = value
    this.status = Status.Unknown
    this.children = Object.create(null)
}

exports.defaultify = function (_, opts, prop) {
    assert(_ != null && typeof _ === "object")
    assert(opts == null || typeof opts === "object")
    assert(typeof prop === "string")

    if (_.methods.accepts.indexOf(prop) >= 0) {
        var used = opts != null && typeof opts[prop] === "function"
            ? opts
            : Console.defaults

        _.opts[prop] = function () {
            return Promise.resolve(used[prop].apply(used, arguments))
        }
    }
}

function joinPath(reportPath) {
    assert(Array.isArray(reportPath))

    var path = ""

    for (var i = 0; i < reportPath.length; i++) {
        path += " " + reportPath[i].name
    }

    return path.slice(1)
}

exports.joinPath = function (report) {
    assert(report != null && typeof report === "object")

    return joinPath(report.path)
}

exports.speed = function (report) {
    assert(report != null && typeof report === "object")

    if (report.duration >= report.slow) return "slow"
    if (report.duration >= report.slow / 2) return "medium"
    if (report.duration >= 0) return "fast"
    throw new RangeError("Duration must not be negative")
}

exports.formatTime = (function () {
    var s = 1000 /* ms */
    var m = 60 * s
    var h = 60 * m
    var d = 24 * h

    return function (ms) {
        assert(typeof ms === "number")

        if (ms >= d) return Math.round(ms / d) + "d"
        if (ms >= h) return Math.round(ms / h) + "h"
        if (ms >= m) return Math.round(ms / m) + "m"
        if (ms >= s) return Math.round(ms / s) + "s"
        return ms + "ms"
    }
})()

exports.formatRest = function (report) {
    assert(report != null && typeof report === "object")

    if (!report.isHook) return ""
    var path = " ("

    if (report.rootPath.length) {
        path += report.stage
        if (report.name) path += " ‒ " + report.name
        if (report.path.length > report.rootPath.length + 1) {
            path += ", in " + joinPath(report.rootPath)
        }
    } else {
        path += "global " + report.stage
        if (report.name) path += " ‒ " + report.name
    }

    return path + ")"
}
