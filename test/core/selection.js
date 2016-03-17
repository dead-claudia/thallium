"use strict"

var t = require("../../index.js")
var util = require("../../test-util/base.js")
var p = util.p
var n = util.n

suite("core (selection)", function () {
    function fail(tt) {
        tt.define("fail", function () { return {test: false, message: "fail"} })
    }

    test("skips tests with callbacks", function () {
        var tt = t.base().use(fail)
        var ret = []

        tt.reporter(util.push(ret))

        tt.test("one", function (tt) {
            tt.testSkip("inner", function (tt) { tt.fail() })
            tt.test("other")
        })

        tt.test("two", function (tt) {
            tt.test("inner")
            tt.test("other")
        })

        tt.run().then(function () {
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

    test("skips tests without callbacks", function () {
        var tt = t.base().use(fail)
        var ret = []

        tt.reporter(util.push(ret))

        tt.test("one", function (tt) {
            tt.testSkip("inner").fail()
            tt.test("other")
        })

        tt.test("two", function (tt) {
            tt.test("inner")
            tt.test("other")
        })

        tt.run().then(function () {
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

    test("skips async tests", function () {
        var tt = t.base().use(fail)
        var ret = []

        tt.reporter(util.push(ret))

        tt.test("one", function (tt) {
            tt.asyncSkip("inner", function (tt) { tt.fail() })
            tt.test("other")
        })

        tt.test("two", function (tt) {
            tt.test("inner")
            tt.test("other")
        })

        tt.run().then(function () {
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

    test("skips inline tests run directly", function () {
        var ret = []
        var tt = t.base().reporter(util.push(ret))
        var ttt = tt.testSkip("test")

        ttt.run().then(function () {
            t.deepEqual(ret, [
                n("pending", [p("test", 0)]),
                n("exit", [p("test", 0)]),
            ])
        })
    })

    test("only tests with callbacks", function () {
        var tt = t.base().use(fail)
        var ret = []

        tt.reporter(util.push(ret))
        tt.only(["one", "inner"])

        tt.test("one", function (tt) {
            tt.test("inner", function () {})
            tt.test("other", function (tt) { tt.fail() })
        })

        tt.test("two", function (tt) {
            tt.test("inner", function (tt) { tt.fail() })
            tt.test("other", function (tt) { tt.fail() })
        })

        tt.run().then(function () {
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

    test("only tests without callbacks", function () {
        var tt = t.base().use(fail)
        var ret = []

        tt.reporter(util.push(ret))
        tt.only(["one", "inner"])

        tt.test("one", function (tt) {
            tt.test("inner")
            tt.test("other").fail()
        })

        tt.test("two", function (tt) {
            tt.test("inner").fail()
            tt.test("other").fail()
        })

        tt.run().then(function () {
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

    test("only async tests", function () {
        var tt = t.base().use(fail)
        var ret = []

        tt.reporter(util.push(ret))
        tt.only(["one", "inner"])

        tt.test("one", function (tt) {
            tt.async("inner", function (_, done) { done() })
            tt.async("other", function (tt) { tt.fail() })
        })

        tt.test("two", function (tt) {
            tt.async("inner", function (tt) { tt.fail() })
            tt.async("other", function (tt) { tt.fail() })
        })

        tt.run().then(function () {
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

    test("only tests as index with callbacks", function () {
        var tt = t.base().use(fail)
        var ret = []

        tt.reporter(util.push(ret))
        tt.only(["one", "inner"])

        tt.test("0", function (tt) {
            tt.test("inner", function () {})
            tt.test("other").fail()
        })

        tt.test("1", function (tt) {
            tt.test("inner").fail()
            tt.test("other").fail()
        })

        tt.run().then(function () {
            t.deepEqual(ret, [
                n("start", []),
                n("end", []),
                n("exit", []),
            ])
        })
    })

    test("only tests as index index without callbacks", function () {
        var tt = t.base().use(fail)
        var ret = []

        tt.reporter(util.push(ret))
        tt.only(["one", "inner"])

        tt.test("0", function (tt) {
            tt.test("inner")
            tt.test("other").fail()
        })

        tt.test("1", function (tt) {
            tt.test("inner").fail()
            tt.test("other").fail()
        })

        tt.run().then(function () {
            t.deepEqual(ret, [
                n("start", []),
                n("end", []),
                n("exit", []),
            ])
        })
    })

    test("only async tests as index", function () {
        var tt = t.base().use(fail)
        var ret = []

        tt.reporter(util.push(ret))
        tt.only(["one", "inner"])

        tt.test("0", function (tt) {
            tt.async("inner", function (_, done) { done() })
            tt.async("other", function (tt) { tt.fail() })
        })

        tt.test("1", function (tt) {
            tt.async("inner", function (tt) { tt.fail() })
            tt.async("other", function (tt) { tt.fail() })
        })

        tt.run().then(function () {
            t.deepEqual(ret, [
                n("start", []),
                n("end", []),
                n("exit", []),
            ])
        })
    })

    test("only against regexp", function () {
        var tt = t.base().use(fail)
        var ret = []

        tt.reporter(util.push(ret))
        tt.only([/^one$/, "inner"])

        tt.test("one", function (tt) {
            tt.test("inner", function () {})
            tt.test("other", function (tt) { tt.fail() })
        })

        tt.test("two", function (tt) {
            tt.test("inner", function (tt) { tt.fail() })
            tt.test("other", function (tt) { tt.fail() })
        })

        tt.run().then(function () {
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
