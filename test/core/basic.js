"use strict"

var t = require("../../index.js")
var util = require("../../test-util/base.js")

suite("core (basic)", function () {
    test("has `base()`", function () {
        t.hasKey(t, "base")
        t.equal(t.base().base, t.base)
    })

    test("has `test()`", function () {
        var tt = t.base()
        t.hasKey(tt, "test")
        t.function(tt.test)
    })

    test("has `parent()`", function () {
        var tt = t.base()
        t.hasKey(tt, "parent")
        t.function(tt.parent)
        t.equal(tt.test("test").parent(), tt)
    })

    test("can accept a string + function", function () {
        var tt = t.base()
        tt.test("test", function () {})
    })

    test("can accept a string", function () {
        var tt = t.base()
        tt.test("test")
    })

    test("returns the current instance when given a callback", function () {
        var tt = t.base()
        var test = tt.test("test", function () {})
        t.equal(test, tt)
    })

    test("returns a prototypal clone when given a callback", function () {
        var tt = t.base()
        var test = tt.test("test")
        t.notEqual(test, tt)
        t.equal(Object.getPrototypeOf(test), tt)
    })

    test("runs block tests within tests", function (done) {
        var tt = t.base()
        var called = false
        tt.test("test", function (tt) {
            tt.test("foo", function () {
                called = true
            })
        })

        tt.run(util.wrap(done, function () {
            t.true(called)
        }))
    })

    test("runs successful inline tests within tests", function (done) {
        var tt = t.base()
        var err

        tt.reporter(function (res, done) {
            if (res.type === "fail") {
                err = res.value
            }
            done()
        })

        tt.test("test", function (tt) {
            tt.test("foo").use(function () {})
        })

        tt.run(util.wrap(done, function () {
            t.notOk(err)
        }))
    })
})
