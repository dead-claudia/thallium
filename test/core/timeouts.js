"use strict"

// Note: updates to this should also be reflected in
// fixtures/mid-coffee/timeouts.coffee, as it's trying to
// represent more real-world usage.

var t = require("../../index.js")
var Util = require("../../helpers/base.js")
var n = Util.n
var p = Util.p

// Note that this entire section may be flaky on slower machines. Thankfully,
// these have been tested against a slower machine, so it should hopefully not
// be too bad.
describe("core (timeouts) (FLAKE)", function () {
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
            t.match(ret, [
                n("start", []),
                n("pass", [p("test", 0)]),
                n("end", []),
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
            global.setTimeout(function () { done() }, 200)
        })

        return tt.run().then(function () {
            t.match(ret, [
                n("start", []),
                n("fail", [p("test", 0)], new Error("Timeout of 50 reached.")),
                n("end", []),
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
            t.match(ret, [
                n("start", []),
                n("enter", [p("test", 0)]),
                n("pass", [p("test", 0), p("inner", 0)]),
                n("leave", [p("test", 0)]),
                n("end", []),
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
            global.setTimeout(function () { done() }, 200)
        })

        return tt.run().then(function () {
            t.match(ret, [
                n("start", []),
                n("enter", [p("test", 0)]),
                n("fail", [p("test", 0), p("inner", 0)],
                    new Error("Timeout of 50 reached.")),
                n("leave", [p("test", 0)]),
                n("end", []),
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

    it("gets own inline set timeout", function () {
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
