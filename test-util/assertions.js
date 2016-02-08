"use strict"

/* global suite, test */

var t = require("../index.js")

// Safe, because this isn't being run with the `exports` interface.
exports.fail = function (name) {
    var args = []
    for (var i = 1; i < arguments.length; i++) {
        args.push(arguments[i])
    }

    t.throws(function () {
        t[name].apply(t, args)
    }, t.AssertionError)
}

exports.basic = function (desc, callback) {
    suite(desc, function () { return test("works", callback) })
}
