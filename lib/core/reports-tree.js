"use strict"

var methods = require("../methods")
var assert = require("../util").assert
var Constants = require("./constants")

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

exports.data = function (test, parent) {
    return new TestData(test, parent)
}

exports.deref = function (data) {
    if (data == null || data._.test.data == null) return
    data._.test.data = undefined
    data._.test = {
        name: data.name,
        index: data.index,
        slow: data.slow,
        timeout: data.timeout,
        isFailable: data.isFailable,
    }
}

function TestData(test, parent) {
    assert(test != null && typeof test === "object")
    assert(parent == null || typeof parent === "object")

    this._ = {test: test, parent: parent}
}

methods(TestData, {
    inspect: function () {
        return {
            name: this.name,
            index: this.index,
            slow: this.slow,
            timeout: this.timeout,
            isFailable: this.isFailable,
            path: this.path,
        }
    },

    get isRoot() { return this._.parent == null },
    get parent() { return this._.parent },

    get name() { return this._.test.name },
    get index() { return this._.test.index },
    get slow() { return this._.test.slow || Constants.defaultSlow },
    get timeout() { return this._.test.timeout || Constants.defaultTimeout },
    get isFailable() { return this._.test.isFailable },

    get fullName() {
        if (this.isRoot) return undefined

        var name = this.name
        var test = this.parent

        while (!test.isRoot) {
            name = test.name + " " + name
            test = test.parent
        }

        return name
    },

    get path() {
        var test = this // eslint-disable-line consistent-this
        var list = []

        while (!test.isRoot) {
            list.push(test)
            test = test.parent
        }

        return list.reverse()
    },
})

function Result( // eslint-disable-line max-params
    type, test, origin, duration, error, name
) {
    assert(typeof type === "number")
    assert(test == null || typeof test === "object")
    assert(origin == null || typeof origin === "object")
    assert(typeof duration === "number")
    assert(name == null || typeof name === "string")

    this._ = {
        type: type,
        test: test,
        origin: origin,
        duration: duration,
        error: error,
        name: name,
    }
}

methods(Result, {
    inspect: function () {
        var inspect = {type: this.type}

        // Only add the relevant properties
        if (this.isFail || this.isError || this.isHook) {
            inspect.error = this.error
        }

        if (this.isEnter || this.isPass || this.isFail) {
            inspect.duration = this.duration
        }

        if (!this.isError) inspect.test = this.test

        if (this.isHook) {
            inspect.origin = this.origin
            inspect.name = this.name
        }

        return inspect
    },

    // The report types
    get isStart() { return (this._.type & Type.Mask) === Type.Start },
    get isEnter() { return (this._.type & Type.Mask) === Type.Enter },
    get isLeave() { return (this._.type & Type.Mask) === Type.Leave },
    get isPass() { return (this._.type & Type.Mask) === Type.Pass },
    get isFail() { return (this._.type & Type.Mask) === Type.Fail },
    get isSkip() { return (this._.type & Type.Mask) === Type.Skip },
    get isEnd() { return (this._.type & Type.Mask) === Type.End },
    get isError() { return (this._.type & Type.Mask) === Type.Error },
    get isBeforeAll() { return (this._.type & Type.Mask) === Type.BeforeAll },
    get isBeforeEach() { return (this._.type & Type.Mask) === Type.BeforeEach },
    get isAfterEach() { return (this._.type & Type.Mask) === Type.AfterEach },
    get isAfterAll() { return (this._.type & Type.Mask) === Type.AfterAll },

    // Generic check
    get isHook() { return (this._.type & Type.Hook) !== 0 },

    /**
     * Get a stringified description of the type.
     */
    get type() {
        switch (this._.type) {
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

    get test() { return this._.test },
    get origin() { return this._.origin },
    get duration() { return this._.duration },
    get error() { return this._.error },
    get name() { return this._.name },
})

exports.start = function (test) {
    return new Result(Type.Start, test, test, 0)
}

exports.enter = function (test, duration) {
    return new Result(Type.Enter, test, test, duration)
}

exports.leave = function (test) {
    return new Result(Type.Leave, test, test, 0)
}

exports.pass = function (test, duration) {
    return new Result(Type.Pass, test, test, duration)
}

exports.fail = function (test, duration, error) {
    return new Result(Type.Fail, test, test, duration, error)
}

exports.skip = function (test) {
    return new Result(Type.Skip, test, test, 0)
}

exports.end = function (test) {
    return new Result(Type.End, test, test, 0)
}

exports.error = function (error) {
    return new Result(Type.Error, undefined, undefined, 0, error)
}

function getName(func) {
    if (func.name != null) return func.name + ""
    if (func.displayName != null) return func.displayName + ""
    return ""
}

exports.beforeAll = function (test, origin, error, func) {
    return new Result(Type.BeforeAll, test, origin, 0, error, getName(func))
}

exports.beforeEach = function (test, origin, error, func) {
    return new Result(Type.BeforeEach, test, origin, 0, error, getName(func))
}

exports.afterEach = function (test, origin, error, func) {
    return new Result(Type.AfterEach, test, origin, 0, error, getName(func))
}

exports.afterAll = function (test, origin, error, func) {
    return new Result(Type.AfterAll, test, origin, 0, error, getName(func))
}
