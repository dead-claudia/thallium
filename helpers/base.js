"use strict"

/* eslint-env mocha */

var t = require("../index.js")
var AssertionError = t.reflect().AssertionError

exports.push = function (ret) {
    return function (arg, done) {
        ret.push(arg)
        return done()
    }
}

exports.n = function (type, path, value/* , slow */) {
    return {type: type, path: path, value: value/* , slow: !!slow */}
}

exports.p = function (name, index) {
    return {name: name, index: index}
}

exports.fail = function (name) {
    var args = []

    for (var i = 1; i < arguments.length; i++) {
        args.push(arguments[i])
    }

    // Silently swallowing exceptions is bad.
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
