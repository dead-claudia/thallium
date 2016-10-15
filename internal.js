"use strict"

var Promise = require("./lib/bluebird.js")
var Thallium = require("./lib/thallium.js")
var Tests = require("./lib/tests.js")
var Types = Tests.Types
var Report = Tests.Report

/**
 * Convert a stringified type to an internal numeric enum member.
 */
function toReportType(type) {
    switch (type) {
    case "start": return Types.Start
    case "enter": return Types.Enter
    case "leave": return Types.Leave
    case "pass": return Types.Pass
    case "fail": return Types.Fail
    case "skip": return Types.Skip
    case "end": return Types.End
    case "error": return Types.Error
    default: throw new RangeError("Unknown report `type`: " + type)
    }
}

exports.createBase = function () {
    return new Thallium()
}

/**
 * Creates a new report, mainly for testing reporters.
 */
exports.createReport = function (type, path, value, duration, slow) { // eslint-disable-line max-params, max-len
    if (typeof type !== "string") {
        throw new TypeError("Expected `type` to be a string")
    }

    if (!Array.isArray(path)) {
        throw new TypeError("Expected `path` to be an array of locations")
    }

    var converted = toReportType(type)

    if (converted === Types.Pass ||
            converted === Types.Fail ||
            converted === Types.Enter) {
        if (duration == null) {
            duration = 10
        } else if (typeof duration !== "number") {
            throw new TypeError(
                "Expected `duration` to be a number if it exists")
        }

        if (slow == null) {
            slow = 75
        } else if (typeof slow !== "number") {
            throw new TypeError("Expected `slow` to be a number if it exists")
        }

        if (converted === Types.Fail) {
            return new Report(converted, path, value, duration|0, slow|0)
        } else {
            return new Report(converted, path, undefined, duration|0, slow|0)
        }
    } else if (converted === Types.Error) {
        return new Report(converted, path, value, -1, 0)
    } else {
        return new Report(converted, path, undefined, -1, 0)
    }
}

/**
 * Creates a new location, mainly for testing reporters.
 */
exports.createLocation = function (name, index) {
    if (typeof name !== "string") {
        throw new TypeError("Expected `name` to be a string")
    }

    if (typeof index !== "number") {
        throw new TypeError("Expected `index` to be a number")
    }

    return {name: name, index: index|0}
}

/**
 * Sets the global scheduler. Note that this *should not* be called when
 * tests are running, and mainly exists for compatibility with runtimes that
 * don't have the normal timing constructs.
 *
 * Also, note that the scheduler *must* execute the function asynchronously,
 * or this framework *will* break.
 */
exports.setScheduler = function (func) {
    Promise.setScheduler(func)
}
