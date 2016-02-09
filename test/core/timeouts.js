"use strict"

/* global setTimeout */

var t = require("../../index.js")
var createBase = require("../../lib/core.js")
var util = require("../../test-util/base.js")
var p = util.p
var n = util.n

suite("core (timeouts)", function () {
    test("succeeds with own", function (done) {
        var tt = createBase()
        var ret = []
        tt.reporter(util.push(ret))

        tt.async("test", function (tt, done) {
            tt.timeout(10)
            done()
        })

        tt.run(util.wrap(done, function () {
            t.deepEqual(ret, [
                n("start", undefined, -1),
                n("start", "test", 0),
                n("end", "test", 0),
                n("pass", "test", 0),
                n("end", undefined, -1),
                n("exit", undefined, 0),
            ])
        }))
    })

    test("fails with own", function (done) {
        var tt = createBase()
        var ret = []
        tt.reporter(util.push(ret))

        tt.async("test", function (tt, done) {
            tt.timeout(50)
            // It's highly unlikely the engine will take this long to
            // finish.
            setTimeout(function () { done() }, 200)
        })

        tt.run(util.wrap(done, function () {
            t.deepEqual(ret, [
                n("start", undefined, -1),
                n("start", "test", 0),
                n("end", "test", 0),
                n("fail", "test", 0, undefined,
                    new Error("Timeout of 50 reached.")),
                n("end", undefined, -1),
                n("exit", undefined, 0),
            ])
        }))
    })

    test("succeeds with inherited", function (done) {
        var tt = createBase()
        var ret = []
        tt.reporter(util.push(ret))

        tt.test("test")
        .timeout(50)
        .async("inner", function (tt, done) { done() })

        tt.run(util.wrap(done, function () {
            t.deepEqual(ret, [
                n("start", undefined, -1),
                n("start", "test", 0),
                n("start", "inner", 0, p("test", 0)),
                n("end", "inner", 0, p("test", 0)),
                n("pass", "inner", 0, p("test", 0)),
                n("end", "test", 0),
                n("pass", "test", 0),
                n("end", undefined, -1),
                n("exit", undefined, 0),
            ])
        }))
    })

    test("fails with inherited", function (done) {
        var tt = createBase()
        var ret = []
        tt.reporter(util.push(ret))

        tt.test("test")
        .timeout(50)
        .async("inner", function (tt, done) {
            // It's highly unlikely the engine will take this long to
            // finish.
            setTimeout(function () { done() }, 200)
        })

        tt.run(util.wrap(done, function () {
            t.deepEqual(ret, [
                n("start", undefined, -1),
                n("start", "test", 0),
                n("start", "inner", 0, p("test", 0)),
                n("end", "inner", 0, p("test", 0)),
                n("fail", "inner", 0, p("test", 0),
                    new Error("Timeout of 50 reached.")),
                n("end", "test", 0),
                n("pass", "test", 0),
                n("end", undefined, -1),
                n("exit", undefined, 0),
            ])
        }))
    })

    test("gets own set timeout", function (done) {
        var tt = createBase()
        var timeout

        tt.test("test", function (tt) {
            tt.timeout(50)
            timeout = tt.timeout()
        })

        tt.run(util.wrap(done, function () {
            t.equal(timeout, 50)
        }))
    })

    test("gets own set timeout", function (done) {
        var tt = createBase()
        var timeout

        tt.test("test")
        .timeout(50)
        .test("inner", function (tt) { timeout = tt.timeout() })

        tt.run(util.wrap(done, function () {
            t.equal(timeout, 50)
        }))
    })

    test("gets own sync inner timeout", function (done) {
        var tt = createBase()

        var timeout = tt.test("test")
        .timeout(50)
        .test("inner").timeout()

        tt.run(util.wrap(done, function () {
            t.equal(timeout, 50)
        }))
    })

    test("gets default timeout", function (done) {
        var tt = createBase()
        var timeout

        tt.test("test", function (tt) {
            timeout = tt.timeout()
        })

        tt.run(util.wrap(done, function () {
            t.equal(timeout, 2000)
        }))
    })
})
