"use strict"

var methods = require("../methods")
var assert = require("../util").assert

/**
 * All the report types.
 */

var Types = exports.Types = Object.freeze({
    Start: 0,
    Enter: 1,
    Leave: 2,
    Pass: 3,
    Fail: 4,
    Skip: 5,
    End: 6,
    Error: 7,

    // Note that `Hook` is actually a bit flag, to save some space (and to
    // simplify the type representation).
    Hook: 8,
    BeforeAll: 8 | 0,
    BeforeEach: 8 | 1,
    AfterEach: 8 | 2,
    AfterAll: 8 | 3,
})

function Report(type) {
    assert(typeof type === "number")
    this._ = type
}

methods(Report, {
    // The report types
    get isStart() { return this._ === Types.Start },
    get isEnter() { return this._ === Types.Enter },
    get isLeave() { return this._ === Types.Leave },
    get isPass() { return this._ === Types.Pass },
    get isFail() { return this._ === Types.Fail },
    get isSkip() { return this._ === Types.Skip },
    get isEnd() { return this._ === Types.End },
    get isError() { return this._ === Types.Error },
    get isBeforeAll() { return this._ === Types.BeforeAll },
    get isBeforeEach() { return this._ === Types.BeforeEach },
    get isAfterEach() { return this._ === Types.AfterEach },
    get isAfterAll() { return this._ === Types.AfterAll },

    // Generic check
    get isHook() { return (this._ & Types.Hook) !== 0 },

    /**
     * Get a stringified description of the type.
     */
    get type() {
        switch (this._) {
        case Types.Start: return "start"
        case Types.Enter: return "enter"
        case Types.Leave: return "leave"
        case Types.Pass: return "pass"
        case Types.Fail: return "fail"
        case Types.Skip: return "skip"
        case Types.End: return "end"
        case Types.Error: return "error"
        case Types.BeforeAll: return "before all"
        case Types.BeforeEach: return "before each"
        case Types.AfterEach: return "after each"
        case Types.AfterAll: return "after all"
        default: throw new Error("unreachable")
        }
    },

    inspect: function () {
        var inspect = {type: this.type}
        var type = this._

        if (type !== Types.Start &&
                type !== Types.End &&
                type !== Types.Error) {
            inspect.path = this.path
        }

        if (type & Types.Hook) {
            inspect.rootPath = this.rootPath
        }

        // Only add the relevant properties
        if (type === Types.Fail ||
                type === Types.Error ||
                type & Types.Hook) {
            inspect.error = this.error
        }

        if (type === Types.Enter ||
                type === Types.Pass ||
                type === Types.Fail) {
            inspect.duration = this.duration
            inspect.slow = this.slow
        }

        if (type === Types.Fail) {
            inspect.isFailable = this.isFailable
        }

        return inspect
    },
})

exports.start = function () {
    return new Report(Types.Start)
}

exports.enter = function (path, duration, slow) {
    var report = new Report(Types.Enter)

    report.path = path
    report.duration = duration
    report.slow = slow
    return report
}

exports.leave = function (path) {
    var report = new Report(Types.Leave)

    report.path = path
    return report
}

exports.pass = function (path, duration, slow) {
    var report = new Report(Types.Pass)

    report.path = path
    report.duration = duration
    report.slow = slow
    return report
}

exports.fail = function (path, error, duration, slow, isFailable) { // eslint-disable-line max-params, max-len
    var report = new Report(Types.Fail)

    report.path = path
    report.error = error
    report.duration = duration
    report.slow = slow
    report.isFailable = isFailable
    return report
}

exports.skip = function (path) {
    var report = new Report(Types.Skip)

    report.path = path
    return report
}

exports.end = function () {
    return new Report(Types.End)
}

exports.error = function (error) {
    var report = new Report(Types.Error)

    report.error = error
    return report
}

exports.hook = function (stage, path, rootPath, func, error) { // eslint-disable-line max-params, max-len
    var report = new Report(stage)

    report.path = path
    report.rootPath = rootPath
    report.name = func.name || func.displayName || ""
    report.error = error
    return report
}
