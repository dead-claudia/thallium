"use strict"

/* global setTimeout */

var t = require("../../index.js")
var util = require("../../test-util/base.js")

suite("core (asynchronous behavior)", function () {
    test("with normal tests", function (done) {
        var tt = t.base()
        var called = false

        tt.test("test", function () { called = true })
        tt.run(util.wrap(done, function () { t.true(called) }))
        t.false(called)
    })

    test("with shorthand tests", function (done) {
        var tt = t.base()
        var called = false

        tt.define("assert", function () {
            called = true
            return {test: false, message: "should never happen"}
        })

        tt.test("test").assert()
        tt.run(util.wrap(done, function () { t.true(called) }))
        t.false(called)
    })

    test("with async tests + sync done call", function (done) {
        var tt = t.base()
        var called = false

        tt.async("test", function (_, done) {
            called = true
            done()
        })
        tt.run(util.wrap(done, function () { t.true(called) }))

        t.false(called)
    })

    test("with async tests + async done call", function (done) {
        var tt = t.base()
        var called = false

        tt.async("test", function (_, done) {
            called = true
            setTimeout(function () { return done() })
        })

        tt.run(util.wrap(done, function () { t.true(called) }))

        t.false(called)
    })

    test("returns thenable without callback", function (done) {
        var tt = t.base()
        var called = false

        tt.async("test", function (_, done) {
            called = true
            setTimeout(function () { return done() })
        })

        var ret = tt.run()

        ret.then(function () {
            t.true(called)
            done()
        }, done)
    })
})
