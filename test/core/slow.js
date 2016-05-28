"use strict"

// TODO: implement this in core

var t = require("../../index.js")
var Util = require("../../helpers/base.js")
var n = Util.n
var p = Util.p

// Note that this entire section may be flaky on slower machines. Thankfully,
// these have been tested against a slower machine, so it should hopefully not
// be too bad.
describe.skip("core (slow) (FLAKE)", function () {
    it("succeeds with own", function () {
        var tt = t.base()
        var ret = []

        tt.reporter(Util.push(ret))

        tt.async("test", function (tt, done) {
            // It's highly unlikely the engine will take this long to finish.
            tt.slow(10)
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
            tt.slow(50)
            // It's highly unlikely the engine will take this long to finish
            global.setTimeout(function () { done() }, 200)
        })

        return tt.run().then(function () {
            t.match(ret, [
                n("start", []),
                n("pass", [p("test", 0)], undefined, true),
                n("end", []),
            ])
        })
    })

    it("succeeds with inherited", function () {
        var tt = t.base()
        var ret = []

        tt.reporter(Util.push(ret))

        tt.test("test")
        .slow(50)
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
        .slow(50)
        .async("inner", function (tt, done) {
            // It's highly unlikely the engine will take this long to finish.
            global.setTimeout(function () { done() }, 200)
        })

        return tt.run().then(function () {
            t.match(ret, [
                n("start", []),
                n("enter", [p("test", 0)]),
                n("pass", [p("test", 0), p("inner", 0)], undefined, true),
                n("leave", [p("test", 0)]),
                n("end", []),
            ])
        })
    })

    it("gets own set slow timeout", function () {
        var tt = t.base()
        var slow

        tt.test("test", function (tt) {
            tt.slow(50)
            slow = tt.slow()
        })

        return tt.run().then(function () { t.equal(slow, 50) })
    })

    it("gets own inline set slow timeout", function () {
        var tt = t.base()
        var slow

        tt.test("test")
        .slow(50)
        .test("inner", function (tt) { slow = tt.slow() })

        return tt.run().then(function () { t.equal(slow, 50) })
    })

    it("gets own sync inner slow timeout", function () {
        var tt = t.base()

        var slow = tt.test("test")
        .slow(50)
        .test("inner").slow()

        return tt.run().then(function () { t.equal(slow, 50) })
    })

    it("gets default slow timeout", function () {
        var tt = t.base()
        var slow

        tt.test("test", function (tt) { slow = tt.slow() })

        return tt.run().then(function () { t.equal(slow, 75) })
    })
})
