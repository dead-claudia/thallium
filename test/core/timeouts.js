"use strict"

var t = require("../../lib/index").t
var Util = require("../../test-util/base.js")
var n = Util.n
var p = Util.p

describe("core (timeouts)", function () {
    it("succeeds with own", function () {
        var tt = t.base()
        var ret = []

        tt.reporter(Util.push(ret))

        tt.async("test", function (tt, done) {
            // It's highly unlikely the engine will take this long to finish.
            tt.timeout(10)
            done()
        })

        return tt.run().then(function () {
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

    it("fails with own", function () {
        var tt = t.base()
        var ret = []

        tt.reporter(Util.push(ret))

        tt.async("test", function (tt, done) {
            tt.timeout(50)
            // It's highly unlikely the engine will take this long to finish
            setTimeout(function () { done() }, 200)
        })

        return tt.run().then(function () {
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

    it("succeeds with inherited", function () {
        var tt = t.base()
        var ret = []

        tt.reporter(Util.push(ret))

        tt.test("test")
        .timeout(50)
        .async("inner", function (tt, done) { done() })

        return tt.run().then(function () {
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

    it("fails with inherited", function () {
        var tt = t.base()
        var ret = []

        tt.reporter(Util.push(ret))

        tt.test("test")
        .timeout(50)
        .async("inner", function (tt, done) {
            // It's highly unlikely the engine will take this long to finish.
            setTimeout(function () { done() }, 200)
        })

        return tt.run().then(function () {
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

    it("gets own set timeout", function () {
        var tt = t.base()
        var timeout

        tt.test("test", function (tt) {
            tt.timeout(50)
            timeout = tt.timeout()
        })

        return tt.run().then(function () { t.equal(timeout, 50) })
    })

    it("gets own set timeout", function () {
        var tt = t.base()
        var timeout

        tt.test("test")
        .timeout(50)
        .test("inner", function (tt) { timeout = tt.timeout() })

        return tt.run().then(function () { t.equal(timeout, 50) })
    })

    it("gets own sync inner timeout", function () {
        var tt = t.base()

        var timeout = tt.test("test")
        .timeout(50)
        .test("inner").timeout()

        return tt.run().then(function () { t.equal(timeout, 50) })
    })

    it("gets default timeout", function () {
        var tt = t.base()
        var timeout

        tt.test("test", function (tt) { timeout = tt.timeout() })

        return tt.run().then(function () { t.equal(timeout, 2000) })
    })
})
