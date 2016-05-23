"use strict"

// Note: updates to this should also be reflected in
// test-fixtures/acceptance/mid-coffee/basic.coffee, as it's trying to
// represent more real-world usage.

var Promise = require("bluebird")
var t = require("../../index.js")

describe("core (basic)", function () {
    it("has `base()`", function () {
        t.hasKey(t, "base")
        t.equal(t.base().base, t.base)
    })

    it("has `test()`", function () {
        var tt = t.base()

        t.hasKey(tt, "test")
        t.function(tt.test)
    })

    it("has `parent()`", function () {
        var tt = t.base()

        t.hasKey(tt, "parent")
        t.function(tt.parent)
        t.equal(tt.test("test").parent(), tt)
        t.undefined(tt.parent())
    })

    it("can accept a string + function", function () {
        var tt = t.base()

        tt.test("test", function () {})
    })

    it("can accept a string", function () {
        var tt = t.base()

        tt.test("test")
    })

    it("returns the current instance when given a callback", function () {
        var tt = t.base()
        var test = tt.test("test", function () {})

        t.equal(test, tt)
    })

    it("returns a prototypal clone when not given a callback", function () {
        var tt = t.base()
        var test = tt.test("test")

        t.notEqual(test, tt)
        t.equal(Object.getPrototypeOf(test), tt)
    })

    it("runs block tests within tests", function () {
        var tt = t.base()
        var called = 0

        tt.test("test", function (tt) {
            tt.test("foo", function () { called++ })
        })

        return tt.run().then(function () { t.equal(called, 1) })
    })

    it("runs successful inline tests within tests", function () {
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

        return tt.run().then(function () { t.notOk(err) })
    })

    it("accepts a callback with `t.run()`", function () {
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

        return Promise.fromCallback(function (cb) { tt.run(cb) })
        .then(function () { t.notOk(err) })
    })
})
