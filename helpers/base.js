"use strict"

/* eslint-env mocha */

var t = require("../index.js")
var AssertionError = t.reflect().AssertionError

exports.push = function (ret, keep) {
    return function push(arg, done) {
        // Any equality tests on this are inherently flaky.
        t.hasOwn(arg, "speed")
        t.includesAny(["fast", "medium", "slow", null], arg.speed)
        if (!keep) arg.speed = null
        ret.push(arg)
        return done()
    }
}

exports.n = function (type, path, value, speed) {
    if (speed == null) speed = null
    return {
        type: type,
        path: path,
        value: value,
        speed: speed,
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
