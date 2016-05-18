"use strict"

/* eslint-env mocha */

var t = require("../index.js")

exports.fail = function (name) {
    var args = []

    for (var i = 1; i < arguments.length; i++) {
        args.push(arguments[i])
    }

    // Silently swallowing exceptions is bad.
    try {
        t[name].apply(t, args)
    } catch (e) {
        if (e instanceof t.AssertionError) return
        throw e
    }

    throw new t.AssertionError(
        "Expected t." + name + " to throw an AssertionError",
        t.AssertionError)
}

exports.basic = function (desc, callback) {
    describe(desc, function () {
        it("works", callback)
    })
}
