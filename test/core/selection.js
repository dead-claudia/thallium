"use strict"

var t = require("../../index.js")
var util = require("../../test-util/base.js")
var p = util.p
var n = util.n

suite("core (selection)", function () {
    function fail(tt) {
        tt.define("fail", function () { return {test: false, message: "fail"} })
    }

    test("skips tests with callbacks", function (done) {
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

        tt.run(util.wrap(done, function () {
            t.deepEqual(ret, [
                n("start", undefined, -1),
                n("start", "one", 0),
                n("pending", "inner", 0, p("one", 0)),
                n("start", "other", 1, p("one", 0)),
                n("end", "other", 1, p("one", 0)),
                n("pass", "other", 1, p("one", 0)),
                n("end", "one", 0),
                n("pass", "one", 0),
                n("start", "two", 1),
                n("start", "inner", 0, p("two", 1)),
                n("end", "inner", 0, p("two", 1)),
                n("pass", "inner", 0, p("two", 1)),
                n("start", "other", 1, p("two", 1)),
                n("end", "other", 1, p("two", 1)),
                n("pass", "other", 1, p("two", 1)),
                n("end", "two", 1),
                n("pass", "two", 1),
                n("end", undefined, -1),
                n("exit", undefined, 0),
            ])
        }))
    })

    test("skips tests without callbacks", function (done) {
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

        tt.run(util.wrap(done, function () {
            t.deepEqual(ret, [
                n("start", undefined, -1),
                n("start", "one", 0),
                n("pending", "inner", 0, p("one", 0)),
                n("start", "other", 1, p("one", 0)),
                n("end", "other", 1, p("one", 0)),
                n("pass", "other", 1, p("one", 0)),
                n("end", "one", 0),
                n("pass", "one", 0),
                n("start", "two", 1),
                n("start", "inner", 0, p("two", 1)),
                n("end", "inner", 0, p("two", 1)),
                n("pass", "inner", 0, p("two", 1)),
                n("start", "other", 1, p("two", 1)),
                n("end", "other", 1, p("two", 1)),
                n("pass", "other", 1, p("two", 1)),
                n("end", "two", 1),
                n("pass", "two", 1),
                n("end", undefined, -1),
                n("exit", undefined, 0),
            ])
        }))
    })

    test("skips async tests", function (done) {
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

        tt.run(util.wrap(done, function () {
            t.deepEqual(ret, [
                n("start", undefined, -1),
                n("start", "one", 0),
                n("pending", "inner", 0, p("one", 0)),
                n("start", "other", 1, p("one", 0)),
                n("end", "other", 1, p("one", 0)),
                n("pass", "other", 1, p("one", 0)),
                n("end", "one", 0),
                n("pass", "one", 0),
                n("start", "two", 1),
                n("start", "inner", 0, p("two", 1)),
                n("end", "inner", 0, p("two", 1)),
                n("pass", "inner", 0, p("two", 1)),
                n("start", "other", 1, p("two", 1)),
                n("end", "other", 1, p("two", 1)),
                n("pass", "other", 1, p("two", 1)),
                n("end", "two", 1),
                n("pass", "two", 1),
                n("end", undefined, -1),
                n("exit", undefined, 0),
            ])
        }))
    })

    test("only tests with callbacks", function (done) {
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

        tt.run(util.wrap(done, function () {
            t.deepEqual(ret, [
                n("start", undefined, -1),
                n("start", "one", 0),
                n("start", "inner", 0, p("one", 0)),
                n("end", "inner", 0, p("one", 0)),
                n("pass", "inner", 0, p("one", 0)),
                n("end", "one", 0),
                n("pass", "one", 0),
                n("end", undefined, -1),
                n("exit", undefined, 0),
            ])
        }))
    })

    test("only tests without callbacks", function (done) {
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

        tt.run(util.wrap(done, function () {
            t.deepEqual(ret, [
                n("start", undefined, -1),
                n("start", "one", 0),
                n("start", "inner", 0, p("one", 0)),
                n("end", "inner", 0, p("one", 0)),
                n("pass", "inner", 0, p("one", 0)),
                n("end", "one", 0),
                n("pass", "one", 0),
                n("end", undefined, -1),
                n("exit", undefined, 0),
            ])
        }))
    })

    test("only async tests", function (done) {
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

        tt.run(util.wrap(done, function () {
            t.deepEqual(ret, [
                n("start", undefined, -1),
                n("start", "one", 0),
                n("start", "inner", 0, p("one", 0)),
                n("end", "inner", 0, p("one", 0)),
                n("pass", "inner", 0, p("one", 0)),
                n("end", "one", 0),
                n("pass", "one", 0),
                n("end", undefined, -1),
                n("exit", undefined, 0),
            ])
        }))
    })

    test("only tests as index with callbacks", function (done) {
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

        tt.run(util.wrap(done, function () {
            t.deepEqual(ret, [
                n("start", undefined, -1),
                n("end", undefined, -1),
                n("exit", undefined, 0),
            ])
        }))
    })

    test("only tests as index index without callbacks", function (done) {
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

        tt.run(util.wrap(done, function () {
            t.deepEqual(ret, [
                n("start", undefined, -1),
                n("end", undefined, -1),
                n("exit", undefined, 0),
            ])
        }))
    })

    test("only async tests as index", function (done) {
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

        tt.run(util.wrap(done, function () {
            t.deepEqual(ret, [
                n("start", undefined, -1),
                n("end", undefined, -1),
                n("exit", undefined, 0),
            ])
        }))
    })
})
