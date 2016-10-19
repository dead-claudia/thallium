"use strict"

// Note that this entire section may be flaky on slower machines. Thankfully,
// these have been tested against a slower machine, so it should hopefully not
// be too bad.
describe("core (slow) (FLAKE)", /** @this */ function () {
    this.retries(3)

    var n = Util.n
    var p = Util.p

    function speed(data, type) {
        switch (type) {
        case "fast": assert.between(data.duration, 0, data.slow / 2); break
        case "medium": assert.between(data.duration, data.slow / 2, data.slow); break // eslint-disable-line max-len
        case "slow": assert.above(data.duration, data.slow); break
        default: throw new RangeError("Unknown type: `" + type + "`")
        }
    }

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
        var tt = Util.create()
        var ret = []

        tt.reporter(Util.push(ret, true))

        tt.test("test", function () {
            // It's highly unlikely the engine will take this long to finish.
            tt.slow = 10
            return resolve()
        })

        return tt.run().then(function () {
            assert.match(ret, [
                n("start", [], undefined, -1, 75),
                n("pass", [p("test", 0)], undefined, ret[1].duration, ret[1].slow), // eslint-disable-line max-len
                n("end", [], undefined, -1, 75),
            ])

            speed(ret[1], "fast")
        })
    })

    it("hits middle with own", function () {
        var tt = Util.create()
        var ret = []

        tt.reporter(Util.push(ret, true))

        tt.test("test", function () {
            // It's highly unlikely the engine will take this long to finish.
            tt.slow = 100
            return delay(60)
        })

        return tt.run().then(function () {
            assert.match(ret, [
                n("start", [], undefined, -1, 75),
                n("pass", [p("test", 0)], undefined, ret[1].duration, ret[1].slow), // eslint-disable-line max-len
                n("end", [], undefined, -1, 75),
            ])

            assert.equal(ret[1].slow, 100)
            speed(ret[1], "medium")
        })
    })

    it("fails with own", function () {
        var tt = Util.create()
        var ret = []

        tt.reporter(Util.push(ret, true))

        tt.test("test", function () {
            tt.slow = 50
            // It's highly unlikely the engine will take this long to finish
            return delay(200)
        })

        return tt.run().then(function () {
            assert.match(ret, [
                n("start", [], undefined, -1, 75),
                n("pass", [p("test", 0)], undefined, ret[1].duration, ret[1].slow), // eslint-disable-line max-len
                n("end", [], undefined, -1, 75),
            ])

            assert.equal(ret[1].slow, 50)
            speed(ret[1], "slow")
        })
    })

    it("succeeds with inherited", function () {
        var tt = Util.create()
        var ret = []

        tt.reporter(Util.push(ret, true))

        tt.test("test", function () {
            tt.slow = 50
            tt.test("inner", function () { return resolve() })
        })

        return tt.run().then(function () {
            assert.match(ret, [
                n("start", [], undefined, -1, 75),
                n("enter", [p("test", 0)], undefined, ret[1].duration, ret[1].slow), // eslint-disable-line max-len
                n("pass", [p("test", 0), p("inner", 0)], undefined, ret[2].duration, ret[2].slow), // eslint-disable-line max-len
                n("leave", [p("test", 0)], undefined, -1, 50),
                n("end", [], undefined, -1, 75),
            ])

            assert.equal(ret[1].slow, 50)
            assert.equal(ret[2].slow, 50)
            speed(ret[1], "fast")
            speed(ret[2], "fast")
        })
    })

    it("fails with inherited", function () {
        var tt = Util.create()
        var ret = []

        tt.reporter(Util.push(ret, true))

        tt.test("test", function () {
            tt.slow = 50
            tt.test("inner", function () { return delay(200) })
        })

        return tt.run().then(function () {
            assert.match(ret, [
                n("start", [], undefined, -1, 75),
                n("enter", [p("test", 0)], undefined, ret[1].duration, ret[1].slow), // eslint-disable-line max-len
                n("pass", [p("test", 0), p("inner", 0)], undefined, ret[2].duration, ret[2].slow), // eslint-disable-line max-len
                n("leave", [p("test", 0)], undefined, -1, 50),
                n("end", [], undefined, -1, 75),
            ])

            assert.equal(ret[1].slow, 50)
            assert.equal(ret[2].slow, 50)
            speed(ret[1], "fast")
            speed(ret[2], "slow")
        })
    })

    function slow(reflect) {
        return reflect.slow
    }

    function activeSlow(reflect) {
        return reflect.activeSlow
    }

    it("gets own slow", function () {
        var tt = Util.create()
        var active, raw

        tt.test("test", function () {
            tt.slow = 50
            active = tt.call(activeSlow)
            raw = tt.call(slow)
        })

        return tt.run().then(function () {
            assert.equal(active, 50)
            assert.equal(raw, 50)
        })
    })

    it("gets inherited slow", function () {
        var tt = Util.create()
        var active, raw

        tt.test("test", function () {
            tt.slow = 50
            tt.test("inner", function () {
                active = tt.call(activeSlow)
                raw = tt.call(slow)
            })
        })

        return tt.run().then(function () {
            assert.equal(active, 50)
            assert.equal(raw, 0)
        })
    })

    it("gets default slow", function () {
        var tt = Util.create()
        var active, raw

        tt.test("test", function () {
            active = tt.call(activeSlow)
            raw = tt.call(slow)
        })

        return tt.run().then(function () {
            assert.equal(active, 75)
            assert.equal(raw, 0)
        })
    })
})
