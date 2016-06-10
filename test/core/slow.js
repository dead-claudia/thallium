"use strict"

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
    function at(host, i) {
        if (host == null) return undefined
        if (host[i] == null) return undefined
        return {slow: host[i].slow, duration: host[i].duration}
    }

    function speed(data, type) {
        switch (type) {
        case "fast": t.between(data.duration, 0, data.slow / 2); break
        case "medium": t.between(data.duration, data.slow / 2, data.slow); break
        case "slow": t.above(data.duration, data.slow); break
        default: throw new RangeError("Unknown type: `" + type + "`")
        }
    }

    function nontest(slow) {
        if (slow == null) slow = 75
        return {duration: -1, slow: slow}
    }

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
            var data = at(ret, 1)

            t.match(ret, [
                n("start", [], undefined, nontest()),
                n("pass", [p("test", 0)], undefined, data),
                n("end", [], undefined, nontest()),
            ])

            speed(data, "fast")
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
            var data = at(ret, 1)

            t.match(ret, [
                n("start", [], undefined, nontest()),
                n("pass", [p("test", 0)], undefined, data),
                n("end", [], undefined, nontest()),
            ])

            t.equal(data.slow, 100)
            speed(data, "medium")
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
            var data = at(ret, 1)

            t.match(ret, [
                n("start", [], undefined, nontest()),
                n("pass", [p("test", 0)], undefined, data),
                n("end", [], undefined, nontest()),
            ])

            t.equal(data.slow, 50)
            speed(data, "slow")
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
            var data1 = at(ret, 1)
            var data2 = at(ret, 2)

            t.match(ret, [
                n("start", [], undefined, nontest()),
                n("enter", [p("test", 0)], undefined, data1),
                n("pass", [p("test", 0), p("inner", 0)], undefined, data2),
                n("leave", [p("test", 0)], undefined, nontest(50)),
                n("end", [], undefined, nontest()),
            ])

            t.equal(data1.slow, 50)
            t.equal(data2.slow, 50)
            speed(data1, "fast")
            speed(data2, "fast")
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
            var data1 = at(ret, 1)
            var data2 = at(ret, 2)

            t.match(ret, [
                n("start", [], undefined, nontest()),
                n("enter", [p("test", 0)], undefined, data1),
                n("pass", [p("test", 0), p("inner", 0)], undefined, data2),
                n("leave", [p("test", 0)], undefined, nontest(50)),
                n("end", [], undefined, nontest()),
            ])

            t.equal(data1.slow, 50)
            t.equal(data2.slow, 50)
            speed(data1, "fast")
            speed(data2, "slow")
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
