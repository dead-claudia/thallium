"use strict"

/* eslint max-nested-callbacks: [2, 5] */

describe("core (selection)", function () {
    var p = Util.p
    var n = Util.n

    function fail() {
        assert.fail("fail")
    }

    describe("skip", function () {
        it("tests with callbacks", function () {
            var tt = t.create()
            var ret = []

            tt.reporter(Util.push(ret))

            tt.test("one", function (tt) {
                tt.testSkip("inner", function () { fail() })
                tt.test("other")
            })

            tt.test("two", function (tt) {
                tt.test("inner")
                tt.test("other")
            })

            return tt.run().then(function () {
                assert.match(ret, [
                    n("start", []),
                    n("enter", [p("one", 0)]),
                    n("skip", [p("one", 0), p("inner", 0)]),
                    n("pass", [p("one", 0), p("other", 1)]),
                    n("leave", [p("one", 0)]),
                    n("enter", [p("two", 1)]),
                    n("pass", [p("two", 1), p("inner", 0)]),
                    n("pass", [p("two", 1), p("other", 1)]),
                    n("leave", [p("two", 1)]),
                    n("end", []),
                ])
            })
        })

        it("tests without callbacks", function () {
            var tt = t.create()
            var ret = []

            tt.reporter(Util.push(ret))

            tt.test("one", function (tt) {
                tt.testSkip("inner").try(fail)
                tt.test("other")
            })

            tt.test("two", function (tt) {
                tt.test("inner")
                tt.test("other")
            })

            return tt.run().then(function () {
                assert.match(ret, [
                    n("start", []),
                    n("enter", [p("one", 0)]),
                    n("skip", [p("one", 0), p("inner", 0)]),
                    n("pass", [p("one", 0), p("other", 1)]),
                    n("leave", [p("one", 0)]),
                    n("enter", [p("two", 1)]),
                    n("pass", [p("two", 1), p("inner", 0)]),
                    n("pass", [p("two", 1), p("other", 1)]),
                    n("leave", [p("two", 1)]),
                    n("end", []),
                ])
            })
        })

        it("async tests", function () {
            var tt = t.create()
            var ret = []

            tt.reporter(Util.push(ret))

            tt.test("one", function (tt) {
                tt.asyncSkip("inner", function () { fail() })
                tt.test("other")
            })

            tt.test("two", function (tt) {
                tt.test("inner")
                tt.test("other")
            })

            return tt.run().then(function () {
                assert.match(ret, [
                    n("start", []),
                    n("enter", [p("one", 0)]),
                    n("skip", [p("one", 0), p("inner", 0)]),
                    n("pass", [p("one", 0), p("other", 1)]),
                    n("leave", [p("one", 0)]),
                    n("enter", [p("two", 1)]),
                    n("pass", [p("two", 1), p("inner", 0)]),
                    n("pass", [p("two", 1), p("other", 1)]),
                    n("leave", [p("two", 1)]),
                    n("end", []),
                ])
            })
        })

        it("inline tests run directly", function () {
            var ret = []
            var tt = t.create().reporter(Util.push(ret))
            var ttt = tt.testSkip("test")

            return ttt.run().then(function () {
                assert.match(ret, [
                    n("start", [p("test", 0)]),
                    n("end", [p("test", 0)]),
                ])
            })
        })
    })

    describe("only", function () {
        it("tests with callbacks", function () {
            var tt = t.create()
            var ret = []

            tt.reporter(Util.push(ret))
            tt.only(["one", "inner"])

            tt.test("one", function (tt) {
                tt.test("inner", function () {})
                tt.test("other", function () { fail() })
            })

            tt.test("two", function (tt) {
                tt.test("inner", function () { fail() })
                tt.test("other", function () { fail() })
            })

            return tt.run().then(function () {
                assert.match(ret, [
                    n("start", []),
                    n("enter", [p("one", 0)]),
                    n("pass", [p("one", 0), p("inner", 0)]),
                    n("leave", [p("one", 0)]),
                    n("end", []),
                ])
            })
        })

        it("tests without callbacks", function () {
            var tt = t.create()
            var ret = []

            tt.reporter(Util.push(ret))
            tt.only(["one", "inner"])

            tt.test("one", function (tt) {
                tt.test("inner")
                tt.test("other").try(fail)
            })

            tt.test("two", function (tt) {
                tt.test("inner").try(fail)
                tt.test("other").try(fail)
            })

            return tt.run().then(function () {
                assert.match(ret, [
                    n("start", []),
                    n("enter", [p("one", 0)]),
                    n("pass", [p("one", 0), p("inner", 0)]),
                    n("leave", [p("one", 0)]),
                    n("end", []),
                ])
            })
        })

        it("async tests", function () {
            var tt = t.create()
            var ret = []

            tt.reporter(Util.push(ret))
            tt.only(["one", "inner"])

            tt.test("one", function (tt) {
                tt.async("inner", function (_, done) { done() })
                tt.async("other", function () { fail() })
            })

            tt.test("two", function (tt) {
                tt.async("inner", function () { fail() })
                tt.async("other", function () { fail() })
            })

            return tt.run().then(function () {
                assert.match(ret, [
                    n("start", []),
                    n("enter", [p("one", 0)]),
                    n("pass", [p("one", 0), p("inner", 0)]),
                    n("leave", [p("one", 0)]),
                    n("end", []),
                ])
            })
        })

        it("tests as index with callbacks", function () {
            var tt = t.create()
            var ret = []

            tt.reporter(Util.push(ret))
            tt.only(["one", "inner"])

            tt.test("0", function (tt) {
                tt.test("inner", function () {})
                tt.test("other").try(fail)
            })

            tt.test("1", function (tt) {
                tt.test("inner").try(fail)
                tt.test("other").try(fail)
            })

            return tt.run().then(function () {
                assert.match(ret, [
                    n("start", []),
                    n("end", []),
                ])
            })
        })

        it("tests as index index without callbacks", function () {
            var tt = t.create()
            var ret = []

            tt.reporter(Util.push(ret))
            tt.only(["one", "inner"])

            tt.test("0", function (tt) {
                tt.test("inner")
                tt.test("other").try(fail)
            })

            tt.test("1", function (tt) {
                tt.test("inner").try(fail)
                tt.test("other").try(fail)
            })

            return tt.run().then(function () {
                assert.match(ret, [
                    n("start", []),
                    n("end", []),
                ])
            })
        })

        it("async tests as index", function () {
            var tt = t.create()
            var ret = []

            tt.reporter(Util.push(ret))
            tt.only(["one", "inner"])

            tt.test("0", function (tt) {
                tt.async("inner", function (_, done) { done() })
                tt.async("other", function () { fail() })
            })

            tt.test("1", function (tt) {
                tt.async("inner", function () { fail() })
                tt.async("other", function () { fail() })
            })

            return tt.run().then(function () {
                assert.match(ret, [
                    n("start", []),
                    n("end", []),
                ])
            })
        })

        it("against regexp", function () {
            var tt = t.create()
            var ret = []

            tt.reporter(Util.push(ret))
            tt.only([/^one$/, "inner"])

            tt.test("one", function (tt) {
                tt.test("inner", function () {})
                tt.test("other", function () { fail() })
            })

            tt.test("two", function (tt) {
                tt.test("inner", function () { fail() })
                tt.test("other", function () { fail() })
            })

            return tt.run().then(function () {
                assert.match(ret, [
                    n("start", []),
                    n("enter", [p("one", 0)]),
                    n("pass", [p("one", 0), p("inner", 0)]),
                    n("leave", [p("one", 0)]),
                    n("end", []),
                ])
            })
        })
    })
})
