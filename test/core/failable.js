describe("core/failable", function () {
    "use strict"

    var r = Util.report

    function immediate() {
        throw new Error("fail")
    }

    function deferred() {
        return {then: function (resolve, reject) {
            reject(new Error("fail"))
        }}
    }

    r.testTree("works with own immediate", {
        init: function (tt) {
            tt.test("test", function () {
                tt.isFailable = true
                return immediate()
            })
        },
        expected: [
            r.fail("test", new Error("fail"), {isFailable: true}),
        ],
    })

    r.testTree("works with own deferred", {
        init: function (tt) {
            tt.test("test", function () {
                tt.isFailable = true
                return deferred()
            })
        },
        expected: [
            r.fail("test", new Error("fail"), {isFailable: true}),
        ],
    })

    r.testTree("works with inherited", {
        init: function (tt) {
            tt.test("test", function () {
                tt.isFailable = true
                tt.test("inner", function () { return immediate() })
            })
        },
        expected: [
            r.suite("test", [
                r.fail("inner", new Error("fail"), {isFailable: true}),
            ]),
        ],
    })

    r.testTree("gets own isFailable", {
        init: function (tt, ctx) {
            tt.test("test", function () {
                tt.isFailable = true
                ctx.isFailable = tt.reflect.isFailable
            })
        },
        after: function () {
            assert.equal(this.isFailable, true)
        },
    })

    r.testTree("gets inherited isFailable", {
        init: function (tt, ctx) {
            tt.test("test", function () {
                tt.isFailable = true
                tt.test("inner", function () {
                    ctx.isFailable = tt.reflect.isFailable
                })
            })
        },
        after: function () {
            assert.equal(this.isFailable, true)
        },
    })

    r.testTree("gets default isFailable", {
        init: function (tt, ctx) {
            tt.test("test", function () {
                ctx.isFailable = tt.reflect.isFailable
            })
        },
        after: function () {
            assert.equal(this.isFailable, false)
        },
    })
})
