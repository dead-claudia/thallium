// Note: updates to this should also be reflected in
// fixtures/mid-coffee/spec/timeouts.coffee, as it's trying to
// represent more real-world usage.

// Note that this entire section may be flaky on slower machines. Thankfully,
// these have been tested against a slower machine, so it should hopefully not
// be too bad.
describe("core/timeouts (FLAKE)", /** @this */ function () {
    "use strict"

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
        var tt = Util.create()
        var ret = []

        tt.reporter(Util.push, ret)

        tt.test("test", function () {
            // It's highly unlikely the engine will take this long to finish
            tt.timeout = 10
            return resolve()
        })

        return tt.run().then(function () {
            assert.match(ret, [
                n.start(),
                n.pass([p("test", 0)]),
                n.end(),
            ])
        })
    })

    it("fails with own", function () {
        var tt = Util.create()
        var ret = []

        tt.reporter(Util.push, ret)

        tt.test("test", function () {
            tt.timeout = 50
            // It's highly unlikely the engine will take this long to finish
            return delay(200)
        })

        return tt.run().then(function () {
            assert.match(ret, [
                n.start(),
                n.fail([p("test", 0)], new Error("Timeout of 50 reached")),
                n.end(),
            ])
        })
    })

    it("succeeds with inherited", function () {
        var tt = Util.create()
        var ret = []

        tt.reporter(Util.push, ret)

        tt.test("test", function () {
            tt.timeout = 50
            tt.test("inner", function () { return resolve() })
        })

        return tt.run().then(function () {
            assert.match(ret, [
                n.start(),
                n.enter([p("test", 0)]),
                n.pass([p("test", 0), p("inner", 0)]),
                n.leave([p("test", 0)]),
                n.end(),
            ])
        })
    })

    it("fails with inherited", function () {
        var tt = Util.create()
        var ret = []

        tt.reporter(Util.push, ret)

        tt.test("test", function () {
            tt.timeout = 50
            // It's highly unlikely the engine will take this long to finish
            tt.test("inner", function () { return delay(200) })
        })

        return tt.run().then(function () {
            assert.match(ret, [
                n.start(),
                n.enter([p("test", 0)]),
                n.fail([p("test", 0), p("inner", 0)],
                    new Error("Timeout of 50 reached")),
                n.leave([p("test", 0)]),
                n.end(),
            ])
        })
    })

    function timeout(reflect) {
        return reflect.timeout
    }

    it("gets own timeout", function () {
        var tt = Util.create()
        var active

        tt.test("test", function () {
            tt.timeout = 50
            active = tt.call(timeout)
        })

        return tt.run().then(function () {
            assert.equal(active, 50)
        })
    })

    it("gets inherited timeout", function () {
        var tt = Util.create()
        var active

        tt.test("test", function () {
            tt.timeout = 50
            tt.test("inner", function () {
                active = tt.call(timeout)
            })
        })

        return tt.run().then(function () {
            assert.equal(active, 50)
        })
    })

    it("gets default timeout", function () {
        var tt = Util.create()
        var active

        tt.test("test", function () {
            active = tt.call(timeout)
        })

        return tt.run().then(function () {
            assert.equal(active, 2000)
        })
    })
})
