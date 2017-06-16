"use strict"

var methods = require("../methods")
var assert = require("../util").assert

/**
 * All the report types.
 */

var Type = Object.freeze({
    Mask: 0x0f,
    Start: 0,
    Enter: 1,
    Leave: 2,
    Pass: 3,
    Fail: 4,
    Skip: 5,
    End: 6,
    Error: 7,
    Hook: 8,
    BeforeAll: 8 | 0,
    BeforeEach: 8 | 1,
    AfterEach: 8 | 2,
    AfterAll: 8 | 3,
})

function Report( // eslint-disable-line max-params
    type, test, duration, parent, error, origin, hookName
) {
    assert(typeof type === "number")
    this._type = type
    this._test = test
    this._duration = duration
    this._parent = parent
    this._origin = origin != null ? origin : this
    this._error = error
    this._hookName = hookName
}

methods(Report, {
    inspect: function () {
        var inspect = {type: this.type}
        var type = this._type

        // Only add the relevant properties
        if (type === Type.Fail ||
            type === Type.Error ||
            type & Type.Hook) {
            inspect.value = this.value
        }

        if (type === Type.Enter ||
                type === Type.Pass ||
                type === Type.Fail) {
            inspect.duration = this.duration
            inspect.slow = this.slow
        }

        if (type === Type.Fail) {
            inspect.isFailable = this.isFailable
        }

        if (type !== Type.Start &&
                    type !== Type.End &&
                    type !== Type.Error) {
            inspect.parent = this._parent
        }

        if (type & Type.Hook) {
            inspect.origin = this._origin
        }

        return inspect
    },

    // The report types
    get isStart() { return (this._type & Type.Mask) === Type.Start },
    get isEnter() { return (this._type & Type.Mask) === Type.Enter },
    get isLeave() { return (this._type & Type.Mask) === Type.Leave },
    get isPass() { return (this._type & Type.Mask) === Type.Pass },
    get isFail() { return (this._type & Type.Mask) === Type.Fail },
    get isSkip() { return (this._type & Type.Mask) === Type.Skip },
    get isEnd() { return (this._type & Type.Mask) === Type.End },
    get isError() { return (this._type & Type.Mask) === Type.Error },
    get isBeforeAll() { return (this._type & Type.Mask) === Type.BeforeAll },
    get isBeforeEach() { return (this._type & Type.Mask) === Type.BeforeEach },
    get isAfterEach() { return (this._type & Type.Mask) === Type.AfterEach },
    get isAfterAll() { return (this._type & Type.Mask) === Type.AfterAll },

    // Generic check
    get isHook() { return (this._type & Type.Hook) !== 0 },

    /**
     * Get a stringified description of the type.
     */
    get type() {
        switch (this._type) {
        case Type.Start: return "start"
        case Type.Enter: return "enter"
        case Type.Leave: return "leave"
        case Type.Pass: return "pass"
        case Type.Fail: return "fail"
        case Type.Skip: return "skip"
        case Type.End: return "end"
        case Type.Error: return "error"
        case Type.BeforeAll: return "before all"
        case Type.BeforeEach: return "before each"
        case Type.AfterEach: return "after each"
        case Type.AfterAll: return "after all"
        default: throw new Error("unreachable")
        }
    },

    get parent() { return this._parent },
    get origin() { return this._origin },
    get duration() { return this._duration },
    get error() { return this._error },
    get hookName() { return this._hookName },

    get name() { return this._test.name },
    get index() { return this._test.index },
    get slow() { return this._test.slow },
    get timeout() { return this._test.timeout },
    get isFailable() { return this._test.isFailable },

    get fullName() {
        if (this._parent == null) return undefined
        var name = this._test.name
        var report = this._parent

        while (report._parent != null) {
            name = report._test.name + " " + name
            report = report._parent
        }

        return name
    },
})

exports.start = function (root) {
    return new Report(Type.Start, root, 0)
}

exports.enter = function (test, parent, duration) {
    return new Report(Type.Enter, test, duration, parent)
}

exports.leave = function (test, parent) {
    return new Report(Type.Leave, test, 0, parent)
}

exports.pass = function (test, parent, duration) {
    return new Report(Type.Pass, test, duration, parent)
}

exports.fail = function (test, parent, duration, error) {
    return new Report(Type.Fail, test, duration, parent, error)
}

exports.skip = function (test, parent) {
    return new Report(Type.Skip, test, 0, parent)
}

exports.end = function (root) {
    return new Report(Type.End, root, 0)
}

exports.error = function (root, error) {
    return new Report(Type.Error, root, 0, undefined, error)
}

function getName(func) {
    if (func.name != null) return func.name + ""
    if (func.displayName != null) return func.displayName + ""
    return ""
}

exports.beforeAll = function ( // eslint-disable-line max-params
    test, parent, origin, error, func
) {
    return new Report(Type.BeforeAll, test, 0, parent, error,
        origin, getName(func))
}

exports.beforeEach = function ( // eslint-disable-line max-params
    test, parent, origin, error, func
) {
    return new Report(Type.BeforeEach, test, 0, parent, error,
        origin, getName(func))
}

exports.afterEach = function ( // eslint-disable-line max-params
    test, parent, origin, error, func
) {
    return new Report(Type.AfterEach, test, 0, parent, error,
        origin, getName(func))
}

exports.afterAll = function ( // eslint-disable-line max-params
    test, parent, origin, error, func
) {
    return new Report(Type.AfterAll, test, 0, parent, error,
        origin, getName(func))
}
