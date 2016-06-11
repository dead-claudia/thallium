"use strict"

/* eslint-env mocha */

var t = require("../index.js")
var AssertionError = t.reflect().AssertionError

function fixArg(arg, type) {
    if (type === "pass" || type === "fail" || type === "enter") {
        arg.duration = 10
        arg.slow = 75
    } else {
        arg.duration = -1
        arg.slow = 0
    }
}

exports.push = function (ret, keep) {
    return function push(arg, done) {
        // Any equality tests on either of these are inherently flaky.
        t.hasOwn(arg, "duration")
        t.hasOwn(arg, "slow")
        t.number(arg.duration)
        t.number(arg.slow)
        if (!keep) fixArg(arg, arg.type)
        ret.push(arg)
        return done()
    }
}

exports.n = function (type, path, value, extra) { // eslint-disable-line max-params, max-len
    if (extra == null) fixArg(extra = {}, type)
    return {
        type: type,
        path: path,
        value: value,
        duration: extra.duration,
        slow: extra.slow|0,
    }
}

exports.p = function (name, index) {
    return {name: name, index: index}
}

exports.fail = function (name) {
    var args = []

    for (var i = 1; i < arguments.length; i++) {
        args.push(arguments[i])
    }

    // Silently swallowing exceptions is bad, so we can't use traditional
    // Thallium assertions to test.
    try {
        t[name].apply(t, args)
    } catch (e) {
        if (e instanceof AssertionError) return
        throw e
    }

    throw new AssertionError(
        "Expected t." + name + " to throw an AssertionError",
        AssertionError)
}

exports.basic = function (desc, callback) {
    describe(desc, function () {
        it("works", callback)
    })
}
