"use strict"

/* global setTimeout */

var t = require("../../index.js")
var util = require("../../test-util/base.js")
var p = util.p
var n = util.n

suite("core (timeouts)", function () {
    test("succeeds with own", function () {
        var tt = t.base()
        var ret = []

        tt.reporter(util.push(ret))

        tt.async("test", function (tt, done) {
            tt.timeout(10)
            done()
        })

        tt.run().then(function () {
            t.deepEqual(ret, [
                n("start", []),
                n("start", [p("test", 0)]),
                n("end", [p("test", 0)]),
                n("pass", [p("test", 0)]),
                n("end", []),
                n("exit", []),
            ])
        })
    })

    test("fails with own", function () {
        var tt = t.base()
        var ret = []

        tt.reporter(util.push(ret))

        tt.async("test", function (tt, done) {
            tt.timeout(50)
            // It's highly unlikely the engine will take this long to
            // finish.
            setTimeout(function () { done() }, 200)
        })

        tt.run().then(function () {
            t.deepEqual(ret, [
                n("start", []),
                n("start", [p("test", 0)]),
                n("end", [p("test", 0)]),
                n("fail", [p("test", 0)], new Error("Timeout of 50 reached.")),
                n("end", []),
                n("exit", []),
            ])
        })
    })

    test("succeeds with inherited", function () {
        var tt = t.base()
        var ret = []

        tt.reporter(util.push(ret))

        tt.test("test")
        .timeout(50)
        .async("inner", function (tt, done) { done() })

        tt.run().then(function () {
            t.deepEqual(ret, [
                n("start", []),
                n("start", [p("test", 0)]),
                n("start", [p("test", 0), p("inner", 0)]),
                n("end", [p("test", 0), p("inner", 0)]),
                n("pass", [p("test", 0), p("inner", 0)]),
                n("end", [p("test", 0)]),
                n("pass", [p("test", 0)]),
                n("end", []),
                n("exit", []),
            ])
        })
    })

    test("fails with inherited", function () {
        var tt = t.base()
        var ret = []

        tt.reporter(util.push(ret))

        tt.test("test")
        .timeout(50)
        .async("inner", function (tt, done) {
            // It's highly unlikely the engine will take this long to
            // finish.
            setTimeout(function () { done() }, 200)
        })

        tt.run().then(function () {
            t.deepEqual(ret, [
                n("start", []),
                n("start", [p("test", 0)]),
                n("start", [p("test", 0), p("inner", 0)]),
                n("end", [p("test", 0), p("inner", 0)]),
                n("fail", [p("test", 0), p("inner", 0)],
                    new Error("Timeout of 50 reached.")),
                n("end", [p("test", 0)]),
                n("pass", [p("test", 0)]),
                n("end", []),
                n("exit", []),
            ])
        })
    })

    test("gets own set timeout", function () {
        var tt = t.base()
        var timeout

        tt.test("test", function (tt) {
            tt.timeout(50)
            timeout = tt.timeout()
        })

        tt.run().then(function () {
            t.equal(timeout, 50)
        })
    })

    test("gets own set timeout", function () {
        var tt = t.base()
        var timeout

        tt.test("test")
        .timeout(50)
        .test("inner", function (tt) { timeout = tt.timeout() })

        tt.run().then(function () {
            t.equal(timeout, 50)
        })
    })

    test("gets own sync inner timeout", function () {
        var tt = t.base()

        var timeout = tt.test("test")
        .timeout(50)
        .test("inner").timeout()

        tt.run().then(function () {
            t.equal(timeout, 50)
        })
    })

    test("gets default timeout", function () {
        var tt = t.base()
        var timeout

        tt.test("test", function (tt) {
            timeout = tt.timeout()
        })

        tt.run().then(function () {
            t.equal(timeout, 2000)
        })
    })
})
