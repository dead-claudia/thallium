describe("core/attempts", function () {
    "use strict"

    var r = Util.report

    function immediate(ctx) {
        if (--ctx.attempts) throw new Error("fail")
    }

    function deferred(ctx) {
        return {then: function (resolve, reject) {
            if (--ctx.attempts) reject(new Error("fail"))
            resolve()
        }}
    }

    r.test("succeeds with own immediate", {
        attempts: 3,
        init: function (tt, ctx) {
            tt.test("test", function () {
                tt.attempts = 3
                return immediate(ctx)
            })
        },
        expected: [
            r.pass("test"),
        ],
    })

    r.test("succeeds with own deferred", {
        attempts: 3,
        init: function (tt, ctx) {
            tt.test("test", function () {
                tt.attempts = 3
                return deferred(ctx)
            })
        },
        expected: [
            r.pass("test"),
        ],
    })

    r.test("fails with own immediate", {
        attempts: 5,
        init: function (tt, ctx) {
            tt.test("test", function () {
                tt.attempts = 3
                return immediate(ctx)
            })
        },
        expected: [
            r.fail("test", new Error("fail")),
        ],
    })

    r.test("fails with own deferred", {
        attempts: 5,
        init: function (tt, ctx) {
            tt.test("test", function () {
                tt.attempts = 3
                return deferred(ctx)
            })
        },
        expected: [
            r.fail("test", new Error("fail")),
        ],
    })

    r.test("succeeds with inherited", {
        attempts: 3,
        init: function (tt, ctx) {
            tt.test("test", function () {
                tt.attempts = 3
                tt.test("inner", function () { return immediate(ctx) })
            })
        },
        expected: [
            r.suite("test", [
                r.pass("inner"),
            ]),
        ],
    })

    r.test("fails with inherited", {
        attempts: 5,
        init: function (tt, ctx) {
            tt.test("test", function () {
                tt.attempts = 3
                tt.test("inner", function () { return deferred(ctx) })
            })
        },
        expected: [
            r.suite("test", [
                r.fail("inner", new Error("fail")),
            ]),
        ],
    })

    r.test("gets own attempts", {
        init: function (tt, ctx) {
            tt.test("test", function () {
                tt.attempts = 5
                ctx.active = tt.reflect.attempts
            })
        },
        after: function () {
            assert.equal(this.active, 5)
        },
    })

    r.test("gets inherited attempts", {
        init: function (tt, ctx) {
            tt.test("test", function () {
                tt.attempts = 5
                tt.test("inner", function () {
                    ctx.active = tt.reflect.attempts
                })
            })
        },

        after: function () {
            assert.equal(this.active, 5)
        },
    })

    r.test("gets default attempts", {
        init: function (tt, ctx) {
            tt.test("test", function () {
                ctx.active = tt.reflect.attempts
            })
        },
        after: function () {
            assert.equal(this.active, 1)
        },
    })
})
