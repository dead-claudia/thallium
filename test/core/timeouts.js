// Note: updates to this should also be reflected in
// fixtures/mid-coffee/spec/timeouts.coffee, as it's trying to
// represent more real-world usage.

// Note that this entire section may be flaky on slower machines. Thankfully,
// these have been tested against a slower machine, so it should hopefully not
// be too bad.
describe("core/timeouts (FLAKE)", /** @this */ function () {
    "use strict"

    this.retries(3)

    var r = Util.report

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

    r.test("succeeds with own", {
        init: function (tt) {
            tt.test("test", function () {
                // It's highly unlikely the engine will take this long to finish
                tt.timeout = 10
                return resolve()
            })
        },
        expected: r.root([
            r.pass("test"),
        ]),
    })

    r.test("fails with own", {
        init: function (tt) {
            tt.test("test", function () {
                tt.timeout = 50
                // It's highly unlikely the engine will take this long to finish
                return delay(200)
            })
        },
        expected: r.root([
            r.fail("test", new Error("Timeout of 50 reached")),
        ]),
    })

    r.test("succeeds with inherited", {
        init: function (tt) {
            tt.test("test", function () {
                tt.timeout = 50
                tt.test("inner", function () { return resolve() })
            })
        },
        expected: r.root([
            r.suite("test", [
                r.pass("inner"),
            ]),
        ]),
    })

    r.test("fails with inherited", {
        init: function (tt) {
            tt.test("test", function () {
                tt.timeout = 50
                // It's highly unlikely the engine will take this long to finish
                tt.test("inner", function () { return delay(200) })
            })
        },
        expected: r.root([
            r.suite("test", [
                r.fail("inner", new Error("Timeout of 50 reached")),
            ]),
        ]),
    })

    r.test("gets own timeout", {
        init: function (tt, ctx) {
            tt.test("test", function () {
                tt.timeout = 50
                ctx.active = tt.reflect.timeout
            })
        },
        after: function () {
            assert.equal(this.active, 50)
        },
    })

    r.test("gets inherited timeout", {
        init: function (tt, ctx) {
            tt.test("test", function () {
                tt.timeout = 50
                tt.test("inner", function () {
                    ctx.active = tt.reflect.timeout
                })
            })
        },
        after: function () {
            assert.equal(this.active, 50)
        },
    })

    r.test("gets default timeout", {
        init: function (tt, ctx) {
            tt.test("test", function () {
                ctx.active = tt.reflect.timeout
            })
        },
        after: function () {
            assert.equal(this.active, 2000)
        },
    })
})
