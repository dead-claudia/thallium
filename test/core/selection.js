"use strict"

/* eslint max-nested-callbacks: [2, 5] */

var t = require("../../lib/index").t
var Util = require("../../test-util/base.js")
var p = Util.p
var n = Util.n

describe("core (selection)", function () {
    function fail(t) {
        t.define("fail", function () {
            return {test: false, message: fail}
        })
    }

    describe("skip", function () {
        it("tests with callbacks", function () {
            var tt = t.base().use(fail)
            var ret = []

            tt.reporter(Util.push(ret))

            tt.test("one", function (t) {
                t.testSkip("inner", function (tt) { tt.fail() })
                t.test("other")
            })

            tt.test("two", function (t) {
                t.test("inner")
                t.test("other")
            })

            return tt.run().then(function () {
                t.deepEqual(ret, [
                    n("start", []),
                    n("start", [p("one", 0)]),
                    n("pending", [p("one", 0), p("inner", 0)]),
                    n("start", [p("one", 0), p("other", 1)]),
                    n("end", [p("one", 0), p("other", 1)]),
                    n("pass", [p("one", 0), p("other", 1)]),
                    n("end", [p("one", 0)]),
                    n("pass", [p("one", 0)]),
                    n("start", [p("two", 1)]),
                    n("start", [p("two", 1), p("inner", 0)]),
                    n("end", [p("two", 1), p("inner", 0)]),
                    n("pass", [p("two", 1), p("inner", 0)]),
                    n("start", [p("two", 1), p("other", 1)]),
                    n("end", [p("two", 1), p("other", 1)]),
                    n("pass", [p("two", 1), p("other", 1)]),
                    n("end", [p("two", 1)]),
                    n("pass", [p("two", 1)]),
                    n("end", []),
                    n("exit", []),
                ])
            })
        })

        it("tests without callbacks", function () {
            var tt = t.base().use(fail)
            var ret = []

            tt.reporter(Util.push(ret))

            tt.test("one", function (t) {
                t.testSkip("inner").fail()
                t.test("other")
            })

            tt.test("two", function (t) {
                t.test("inner")
                t.test("other")
            })

            return tt.run().then(function () {
                t.deepEqual(ret, [
                    n("start", []),
                    n("start", [p("one", 0)]),
                    n("pending", [p("one", 0), p("inner", 0)]),
                    n("start", [p("one", 0), p("other", 1)]),
                    n("end", [p("one", 0), p("other", 1)]),
                    n("pass", [p("one", 0), p("other", 1)]),
                    n("end", [p("one", 0)]),
                    n("pass", [p("one", 0)]),
                    n("start", [p("two", 1)]),
                    n("start", [p("two", 1), p("inner", 0)]),
                    n("end", [p("two", 1), p("inner", 0)]),
                    n("pass", [p("two", 1), p("inner", 0)]),
                    n("start", [p("two", 1), p("other", 1)]),
                    n("end", [p("two", 1), p("other", 1)]),
                    n("pass", [p("two", 1), p("other", 1)]),
                    n("end", [p("two", 1)]),
                    n("pass", [p("two", 1)]),
                    n("end", []),
                    n("exit", []),
                ])
            })
        })

        it("async tests", function () {
            var tt = t.base().use(fail)
            var ret = []

            tt.reporter(Util.push(ret))

            tt.test("one", function (tt) {
                tt.asyncSkip("inner", function (tt) { tt.fail() })
                tt.test("other")
            })

            tt.test("two", function (tt) {
                tt.test("inner")
                tt.test("other")
            })

            return tt.run().then(function () {
                t.deepEqual(ret, [
                    n("start", []),
                    n("start", [p("one", 0)]),
                    n("pending", [p("one", 0), p("inner", 0)]),
                    n("start", [p("one", 0), p("other", 1)]),
                    n("end", [p("one", 0), p("other", 1)]),
                    n("pass", [p("one", 0), p("other", 1)]),
                    n("end", [p("one", 0)]),
                    n("pass", [p("one", 0)]),
                    n("start", [p("two", 1)]),
                    n("start", [p("two", 1), p("inner", 0)]),
                    n("end", [p("two", 1), p("inner", 0)]),
                    n("pass", [p("two", 1), p("inner", 0)]),
                    n("start", [p("two", 1), p("other", 1)]),
                    n("end", [p("two", 1), p("other", 1)]),
                    n("pass", [p("two", 1), p("other", 1)]),
                    n("end", [p("two", 1)]),
                    n("pass", [p("two", 1)]),
                    n("end", []),
                    n("exit", []),
                ])
            })
        })

        it("inline tests run directly", function () {
            var ret = []
            var tt = t.base().reporter(Util.push(ret))
            var ttt = tt.testSkip("test")

            return ttt.run().then(function () {
                t.deepEqual(ret, [
                    n("pending", [p("test", 0)]),
                    n("exit", [p("test", 0)]),
                ])
            })
        })
    })

    describe("only", function () {
        it("tests with callbacks", function () {
            var tt = t.base().use(fail)
            var ret = []

            tt.reporter(Util.push(ret))
            tt.only(["one", "inner"])

            tt.test("one", function (tt) {
                tt.test("inner", function () {})
                tt.test("other", function (tt) { tt.fail() })
            })

            tt.test("two", function (tt) {
                tt.test("inner", function (tt) { tt.fail() })
                tt.test("other", function (tt) { tt.fail() })
            })

            return tt.run().then(function () {
                t.deepEqual(ret, [
                    n("start", []),
                    n("start", [p("one", 0)]),
                    n("start", [p("one", 0), p("inner", 0)]),
                    n("end", [p("one", 0), p("inner", 0)]),
                    n("pass", [p("one", 0), p("inner", 0)]),
                    n("end", [p("one", 0)]),
                    n("pass", [p("one", 0)]),
                    n("end", []),
                    n("exit", []),
                ])
            })
        })

        it("tests without callbacks", function () {
            var tt = t.base().use(fail)
            var ret = []

            tt.reporter(Util.push(ret))
            tt.only(["one", "inner"])

            tt.test("one", function (tt) {
                tt.test("inner")
                tt.test("other").fail()
            })

            tt.test("two", function (tt) {
                tt.test("inner").fail()
                tt.test("other").fail()
            })

            return tt.run().then(function () {
                t.deepEqual(ret, [
                    n("start", []),
                    n("start", [p("one", 0)]),
                    n("start", [p("one", 0), p("inner", 0)]),
                    n("end", [p("one", 0), p("inner", 0)]),
                    n("pass", [p("one", 0), p("inner", 0)]),
                    n("end", [p("one", 0)]),
                    n("pass", [p("one", 0)]),
                    n("end", []),
                    n("exit", []),
                ])
            })
        })

        it("async tests", function () {
            var tt = t.base().use(fail)
            var ret = []

            tt.reporter(Util.push(ret))
            tt.only(["one", "inner"])

            tt.test("one", function (tt) {
                tt.async("inner", function (_, done) { done() })
                tt.async("other", function (tt) { tt.fail() })
            })

            tt.test("two", function (tt) {
                tt.async("inner", function (tt) { tt.fail() })
                tt.async("other", function (tt) { tt.fail() })
            })

            return tt.run().then(function () {
                t.deepEqual(ret, [
                    n("start", []),
                    n("start", [p("one", 0)]),
                    n("start", [p("one", 0), p("inner", 0)]),
                    n("end", [p("one", 0), p("inner", 0)]),
                    n("pass", [p("one", 0), p("inner", 0)]),
                    n("end", [p("one", 0)]),
                    n("pass", [p("one", 0)]),
                    n("end", []),
                    n("exit", []),
                ])
            })
        })

        it("tests as index with callbacks", function () {
            var tt = t.base().use(fail)
            var ret = []

            tt.reporter(Util.push(ret))
            tt.only(["one", "inner"])

            tt.test("0", function (tt) {
                tt.test("inner", function () {})
                tt.test("other").fail()
            })

            tt.test("1", function (tt) {
                tt.test("inner").fail()
                tt.test("other").fail()
            })

            return tt.run().then(function () {
                t.deepEqual(ret, [
                    n("start", []),
                    n("end", []),
                    n("exit", []),
                ])
            })
        })

        it("tests as index index without callbacks", function () {
            var tt = t.base().use(fail)
            var ret = []

            tt.reporter(Util.push(ret))
            tt.only(["one", "inner"])

            tt.test("0", function (tt) {
                tt.test("inner")
                tt.test("other").fail()
            })

            tt.test("1", function (tt) {
                tt.test("inner").fail()
                tt.test("other").fail()
            })

            return tt.run().then(function () {
                t.deepEqual(ret, [
                    n("start", []),
                    n("end", []),
                    n("exit", []),
                ])
            })
        })

        it("async tests as index", function () {
            var tt = t.base().use(fail)
            var ret = []

            tt.reporter(Util.push(ret))
            tt.only(["one", "inner"])

            tt.test("0", function (tt) {
                tt.async("inner", function (_, done) { done() })
                tt.async("other", function (tt) { tt.fail() })
            })

            tt.test("1", function (tt) {
                tt.async("inner", function (tt) { tt.fail() })
                tt.async("other", function (tt) { tt.fail() })
            })

            return tt.run().then(function () {
                t.deepEqual(ret, [
                    n("start", []),
                    n("end", []),
                    n("exit", []),
                ])
            })
        })

        it("against regexp", function () {
            var tt = t.base().use(fail)
            var ret = []

            tt.reporter(Util.push(ret))
            tt.only([/^one$/, "inner"])

            tt.test("one", function (tt) {
                tt.test("inner", function () {})
                tt.test("other", function (tt) { tt.fail() })
            })

            tt.test("two", function (tt) {
                tt.test("inner", function (tt) { tt.fail() })
                tt.test("other", function (tt) { tt.fail() })
            })

            return tt.run().then(function () {
                t.deepEqual(ret, [
                    n("start", []),
                    n("start", [p("one", 0)]),
                    n("start", [p("one", 0), p("inner", 0)]),
                    n("end", [p("one", 0), p("inner", 0)]),
                    n("pass", [p("one", 0), p("inner", 0)]),
                    n("end", [p("one", 0)]),
                    n("pass", [p("one", 0)]),
                    n("end", []),
                    n("exit", []),
                ])
            })
        })
    })
})
