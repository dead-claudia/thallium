"use strict"

var m = require("../messages.js")
var methods = require("../methods.js")

exports.ExtraCall = function (count, value, stack) {
    this.count = count
    this.value = value
    this.stack = stack
}

exports.ReportData = function (type, value, duration) {
    if (typeof type !== "number") throw new TypeError("type must be a number")
    this.type = type
    this.value = value
    this.duration = duration
}

exports.ResultData = function (time, caught, value) {
    this.time = time
    this.caught = caught
    this.value = value
}

exports.Location = function (name, index) {
    this.name = name
    this.index = index
}

var Types = exports.Types = Object.freeze({
    Start: 0,
    Enter: 1,
    Leave: 2,
    Pass: 3,
    Fail: 4,
    Skip: 5,
    End: 6,
    Error: 7,
    Extra: 8,
})

/**
 * Convert a stringified type to an internal numeric enum member.
 */
exports.toReportType = function (type) {
    switch (type) {
    case "start": return Types.Start
    case "enter": return Types.Enter
    case "leave": return Types.Leave
    case "pass": return Types.Pass
    case "fail": return Types.Fail
    case "skip": return Types.Skip
    case "end": return Types.End
    case "error": return Types.Error
    case "extra": return Types.Extra
    default: throw new RangeError(m("type.report.type.unknown", type))
    }
}

exports.hasDuration = function (type) {
    return type === Types.Pass || type === Types.Fail || type === Types.Enter
}

exports.Report = Report
function Report(type, path, value, duration, slow) { // eslint-disable-line max-params, max-len
    if (typeof type !== "number") throw new TypeError("type must be a number")
    this._ = type
    this.path = path
    this.value = value
    this.duration = duration
    this.slow = slow
}

methods(Report, {
    // The report types
    start: function () { return this._ === Types.Start },
    enter: function () { return this._ === Types.Enter },
    leave: function () { return this._ === Types.Leave },
    pass: function () { return this._ === Types.Pass },
    fail: function () { return this._ === Types.Fail },
    skip: function () { return this._ === Types.Skip },
    end: function () { return this._ === Types.End },
    error: function () { return this._ === Types.Error },
    extra: function () { return this._ === Types.Extra },

    /**
     * Get a stringified description of the type.
     */
    type: function () {
        switch (this._) {
        case Types.Start: return "start"
        case Types.Enter: return "enter"
        case Types.Leave: return "leave"
        case Types.Pass: return "pass"
        case Types.Fail: return "fail"
        case Types.Skip: return "skip"
        case Types.End: return "end"
        case Types.Error: return "error"
        case Types.Extra: return "extra"
        default: throw new Error("unreachable")
        }
    },
})
