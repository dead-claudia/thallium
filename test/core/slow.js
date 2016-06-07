"use strict"

// TODO: implement this

var t = require("../../index.js")
var Util = require("../../helpers/base.js")
var n = Util.n
var p = Util.p

function push(ret) {
    return Util.push(ret, true)
}

// Note that this entire section may be flaky on slower machines. Thankfully,
// these have been tested against a slower machine, so it should hopefully not
// be too bad.
describe("core (slow) (FLAKE)", function () {
    it("succeeds with own", function () {
        var tt = t.reflect().base()
        var ret = []

        tt.reporter(push(ret))

        tt.async("test", function (tt, done) {
            // It's highly unlikely the engine will take this long to finish.
            tt.slow(10)
            done()
        })

        return tt.run().then(function () {
            t.match(ret, [
                n("start", []),
                n("pass", [p("test", 0)], undefined, "fast"),
                n("end", []),
            ])
        })
    })

    it("hits middle with own", function () {
        var tt = t.reflect().base()
        var ret = []

        tt.reporter(push(ret))

        tt.async("test", function (tt, done) {
            // It's highly unlikely the engine will take this long to finish.
            tt.slow(100)
            global.setTimeout(function () { done() }, 60)
        })

        return tt.run().then(function () {
            t.match(ret, [
                n("start", []),
                n("pass", [p("test", 0)], undefined, "medium"),
                n("end", []),
            ])
        })
    })

    it("fails with own", function () {
        var tt = t.reflect().base()
        var ret = []

        tt.reporter(push(ret))

        tt.async("test", function (tt, done) {
            tt.slow(50)
            // It's highly unlikely the engine will take this long to finish
            global.setTimeout(function () { done() }, 200)
        })

        return tt.run().then(function () {
            t.match(ret, [
                n("start", []),
                n("pass", [p("test", 0)], undefined, "slow"),
                n("end", []),
            ])
        })
    })

    it("succeeds with inherited", function () {
        var tt = t.reflect().base()
        var ret = []

        tt.reporter(push(ret))

        tt.test("test")
        .slow(50)
        .async("inner", function (tt, done) { done() })

        return tt.run().then(function () {
            t.match(ret, [
                n("start", []),
                n("enter", [p("test", 0)], undefined, "fast"),
                n("pass", [p("test", 0), p("inner", 0)], undefined, "fast"),
                n("leave", [p("test", 0)]),
                n("end", []),
            ])
        })
    })

    it("fails with inherited", function () {
        var tt = t.reflect().base()
        var ret = []

        tt.reporter(push(ret))

        tt.test("test")
        .slow(50)
        .async("inner", function (tt, done) {
            global.setTimeout(function () { done() }, 200)
        })

        return tt.run().then(function () {
            t.match(ret, [
                n("start", []),
                n("enter", [p("test", 0)], undefined, "fast"),
                n("pass", [p("test", 0), p("inner", 0)], undefined, "slow"),
                n("leave", [p("test", 0)]),
                n("end", []),
            ])
        })
    })

    it("gets own block slow", function () {
        var tt = t.reflect().base()
        var active, raw

        tt.test("test", function (tt) {
            tt.slow(50)
            active = tt.reflect().activeSlow()
            raw = tt.reflect().slow()
        })

        return tt.run().then(function () {
            t.equal(active, 50)
            t.equal(raw, 50)
        })
    })

    it("gets own inline slow", function () {
        var tt = t.reflect().base()
        var ttt = tt.test("test").slow(50)

        t.equal(ttt.reflect().activeSlow(), 50)
        t.equal(ttt.reflect().slow(), 50)
    })

    it("gets inherited block slow", function () {
        var tt = t.reflect().base()
        var active, raw

        tt.test("test")
        .slow(50)
        .test("inner", function (tt) {
            active = tt.reflect().activeSlow()
            raw = tt.reflect().slow()
        })

        return tt.run().then(function () {
            t.equal(active, 50)
            t.equal(raw, 0)
        })
    })

    it("gets inherited inline slow", function () {
        var tt = t.reflect().base()
        var ttt = tt.test("test")
        .slow(50)
        .test("inner")

        t.equal(ttt.reflect().activeSlow(), 50)
        t.equal(ttt.reflect().slow(), 0)
    })

    it("gets default slow", function () {
        var tt = t.reflect().base()
        var active, raw

        tt.test("test", function (tt) {
            active = tt.reflect().activeSlow()
            raw = tt.reflect().slow()
        })

        return tt.run().then(function () {
            t.equal(active, 75)
            t.equal(raw, 0)
        })
    })
})
