"use strict"

var Util = require("./util.js")

function getName(func) {
    var name = func.name

    if (name == null) name = func.displayName
    if (name) return Util.escape(name)
    return "<anonymous>"
}

exports.throws = function (callback, Type) {
    if (typeof callback !== "function") {
        throw new TypeError("`callback` must be a function")
    }

    if (Type != null && typeof Type !== "function") {
        throw new TypeError("`Type` must be a function if it exists")
    }

    try {
        callback() // eslint-disable-line callback-return
    } catch (e) {
        if (Type != null && !(e instanceof Type)) {
            Util.fail(
                "Expected callback to throw an instance of " + getName(Type) +
                ", but found {actual}",
                {actual: e})
        }
        return
    }

    throw new Util.AssertionError("Expected callback to throw")
}

exports.notThrows = function (callback, Type) {
    if (typeof callback !== "function") {
        throw new TypeError("`callback` must be a function")
    }

    // Actually be useful.
    if (Type == null) {
        throw new TypeError(
            "`Type` must be a function. If you just intend to verify no " +
            "error is thrown, regardless of type, just call the callback " +
            "directly, etc.")
    }

    if (typeof Type !== "function") {
        throw new TypeError("`Type` must be a function")
    }

    try {
        callback() // eslint-disable-line callback-return
    } catch (e) {
        if (e instanceof Type) {
            Util.fail(
                "Expected callback to not throw an instance of " +
                getName(Type) + ", but found {actual}",
                {actual: e})
        }
    }
}

function throwsMatchTest(matcher, e) {
    if (typeof matcher === "string") return e.message === matcher
    if (typeof matcher === "function") return !!matcher(e)
    return !!matcher.test(e.message)
}

function throwsMatch(callback, matcher, invert) {
    if (typeof callback !== "function") {
        throw new TypeError("`callback` must be a function")
    }

    // Not accepting objects yet.
    if (typeof matcher !== "string" &&
            typeof matcher !== "function" &&
            !(matcher instanceof RegExp)) {
        throw new TypeError("`matcher` must be a string, RegExp, or function")
    }

    try {
        callback() // eslint-disable-line callback-return
    } catch (e) {
        if (invert === throwsMatchTest(matcher, e)) {
            Util.fail(
                "Expected callback to " + (invert ? "not" : "") + " throw an " +
                "error that matches {expected}, but found {actual}",
                {expected: matcher, actual: e})
        }
        return
    }

    if (!invert) {
        throw new Util.AssertionError("Expected callback to throw")
    }
}

exports.throwsMatch = function (callback, matcher) {
    return throwsMatch(callback, matcher, false)
}

exports.notThrowsMatch = function (callback, matcher) {
    return throwsMatch(callback, matcher, true)
}
