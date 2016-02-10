"use strict"

var t = require("../index.js")

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
