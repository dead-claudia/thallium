"use strict"

// Note: updates to this should also be reflected in
// fixtures/mid-coffee/spec/timeouts.coffee, as it's trying to
// represent more real-world usage.

// Note that this entire section may be flaky on slower machines. Thankfully,
// these have been tested against a slower machine, so it should hopefully not
// be too bad.
describe("core (timeouts) (FLAKE)", /** @this */ function () {
    this.retries(3)

    var n = Util.n
    var p = Util.p

    function resolve() {
        return {then: function (resolve) { resolve() }}
    }

    function delay(ms) {
        return {
            then: function (resolve) {
                Util.setTimeout(resolve, ms)
            },
        }
    }

    it("succeeds with own", function () {
        var tt = t.create()
        var ret = []

        tt.reporter(Util.push(ret))

        tt.test("test", function (tt) {
            // It's highly unlikely the engine will take this long to finish.
            tt.timeout(10)
            return resolve()
        })

        return tt.run().then(function () {
            assert.match(ret, [
                n("start", []),
                n("pass", [p("test", 0)]),
                n("end", []),
            ])
        })
    })

    it("fails with own", function () {
        var tt = t.create()
        var ret = []

        tt.reporter(Util.push(ret))

        tt.test("test", function (tt) {
            tt.timeout(50)
            // It's highly unlikely the engine will take this long to finish
            return delay(200)
        })

        return tt.run().then(function () {
            assert.match(ret, [
                n("start", []),
                n("fail", [p("test", 0)], new Error("Timeout of 50 reached")),
                n("end", []),
            ])
        })
    })

    it("succeeds with inherited", function () {
        var tt = t.create()
        var ret = []

        tt.reporter(Util.push(ret))

        tt.test("test")
        .timeout(50)
        .test("inner", function () { return resolve() })

        return tt.run().then(function () {
            assert.match(ret, [
                n("start", []),
                n("enter", [p("test", 0)]),
                n("pass", [p("test", 0), p("inner", 0)]),
                n("leave", [p("test", 0)]),
                n("end", []),
            ])
        })
    })

    it("fails with inherited", function () {
        var tt = t.create()
        var ret = []

        tt.reporter(Util.push(ret))

        tt.test("test")
        .timeout(50)
        .test("inner", function () {
            // It's highly unlikely the engine will take this long to finish.
            return delay(200)
        })

        return tt.run().then(function () {
            assert.match(ret, [
                n("start", []),
                n("enter", [p("test", 0)]),
                n("fail", [p("test", 0), p("inner", 0)],
                    new Error("Timeout of 50 reached")),
                n("leave", [p("test", 0)]),
                n("end", []),
            ])
        })
    })

    function timeout(reflect) {
        return reflect.timeout
    }

    function activeTimeout(reflect) {
        return reflect.activeTimeout
    }

    it("gets own block timeout", function () {
        var tt = t.create()
        var active, raw

        tt.test("test", function (tt) {
            tt.timeout(50)
            active = tt.call(activeTimeout)
            raw = tt.call(timeout)
        })

        return tt.run().then(function () {
            assert.equal(active, 50)
            assert.equal(raw, 50)
        })
    })

    it("gets own inline timeout", function () {
        var tt = t.create()
        var ttt = tt.test("test").timeout(50)

        assert.equal(ttt.call(activeTimeout), 50)
        assert.equal(ttt.call(timeout), 50)
    })

    it("gets inherited block timeout", function () {
        var tt = t.create()
        var active, raw

        tt.test("test")
        .timeout(50)
        .test("inner", function (tt) {
            active = tt.call(activeTimeout)
            raw = tt.call(timeout)
        })

        return tt.run().then(function () {
            assert.equal(active, 50)
            assert.equal(raw, 0)
        })
    })

    it("gets inherited inline timeout", function () {
        var tt = t.create()
        var ttt = tt.test("test")
        .timeout(50)
        .test("inner")

        assert.equal(ttt.call(activeTimeout), 50)
        assert.equal(ttt.call(timeout), 0)
    })

    it("gets default timeout", function () {
        var tt = t.create()
        var active, raw

        tt.test("test", function (tt) {
            active = tt.call(activeTimeout)
            raw = tt.call(timeout)
        })

        return tt.run().then(function () {
            assert.equal(active, 2000)
            assert.equal(raw, 0)
        })
    })
})
