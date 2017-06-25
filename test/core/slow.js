// Note that this entire section may be flaky on slower machines. Thankfully,
// these have been tested against a slower machine, so it should hopefully not
// be too bad.

// NOTE: when the report model changes, the timing tests *must* be updated to
// handle them correctly.
describe("core/slow (FLAKE)", /** @this */ function () {
    "use strict"

    this.retries(3)

    var r = Util.report

    function speed(data, type) {
        switch (type) {
        case "fast":
            assert.between(data.duration, 0, data.slow / 2)
            break

        case "medium":
            assert.between(data.duration, data.slow / 2, data.slow)
            break

        case "slow":
            assert.above(data.duration, data.slow)
            break

        default:
            throw new RangeError("Unknown type: `" + type + "`")
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

    r.testTree("succeeds with own", {
        each: function (report) {
            if (!report.isPass) return
            this.duration = report.duration
            assert.equal(report.slow, 10)
            speed(report, "fast")
        },
        init: function (tt) {
            tt.test("test", function () {
                // It's highly unlikely the engine will take this long to finish
                tt.slow = 10
                return resolve()
            })
        },
        expected: function () {
            return [
                r.pass("test", {duration: this.duration, slow: 10}),
            ]
        },
    })

    r.testTree("hits middle with own", {
        each: function (report) {
            if (!report.isPass) return
            this.duration = report.duration
            assert.equal(report.slow, 100)
            speed(report, "medium")
        },
        init: function (tt) {
            tt.test("test", function () {
                // It's highly unlikely the engine will take this long to finish
                tt.slow = 100
                return delay(60)
            })
        },
        expected: function () {
            return [
                r.pass("test", {duration: this.duration, slow: 100}),
            ]
        },
    })

    r.testTree("fails with own", {
        each: function (report) {
            if (!report.isPass) return
            this.duration = report.duration
            assert.equal(report.slow, 50)
            speed(report, "slow")
        },
        init: function (tt) {
            tt.test("test", function () {
                tt.slow = 50
                // It's highly unlikely the engine will take this long to finish
                return delay(200)
            })
        },
        expected: function () {
            return [
                r.pass("test", {duration: this.duration, slow: 50}),
            ]
        },
    })

    r.testTree("succeeds with inherited", {
        each: function (report) {
            if (!report.isPass && !report.isEnter) return
            this.duration = report.duration
            assert.equal(report.slow, 50)
            speed(report, "fast")
            if (report.isEnter) {
                this.duration1 = report.duration
            } else {
                this.duration2 = report.duration
            }
        },
        init: function (tt) {
            tt.test("test", function () {
                tt.slow = 50
                tt.test("inner", function () { return resolve() })
            })
        },
        expected: function () {
            return [
                r.suite("test", {duration: this.duration1, slow: 50}, [
                    r.pass("inner", {duration: this.duration2, slow: 50}),
                ]),
            ]
        },
    })

    r.testTree("fails with inherited", {
        each: function (report) {
            if (!report.isPass && !report.isEnter) return
            assert.equal(report.slow, 50)
            if (report.isEnter) {
                speed(report, "fast")
                this.duration1 = report.duration
            } else {
                speed(report, "slow")
                this.duration2 = report.duration
            }
        },
        init: function (tt) {
            tt.test("test", function () {
                tt.slow = 50
                tt.test("inner", function () { return delay(200) })
            })
        },
        expected: function () {
            return [
                r.suite("test", {duration: this.duration1, slow: 50}, [
                    r.pass("inner", {duration: this.duration2, slow: 50}),
                ]),
            ]
        },
    })

    r.testTree("gets own slow", {
        init: function (tt, ctx) {
            tt.test("test", function () {
                tt.slow = 50
                ctx.active = tt.reflect.slow
            })
        },
        after: function () {
            assert.equal(this.active, 50)
        },
    })

    r.testTree("gets inherited slow", {
        init: function (tt, ctx) {
            tt.test("test", function () {
                tt.slow = 50
                tt.test("inner", function () {
                    ctx.active = tt.reflect.slow
                })
            })
        },
        after: function () {
            assert.equal(this.active, 50)
        },
    })

    r.testTree("gets default slow", {
        init: function (tt, ctx) {
            tt.test("test", function () {
                ctx.active = tt.reflect.slow
            })
        },
        after: function () {
            assert.equal(this.active, 75)
        },
    })
})
