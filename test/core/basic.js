"use strict"

/* eslint max-nested-callbacks: [2, 5] */

// Note: updates to this should also be reflected in fixtures/basic.coffee, as
// it's trying to represent more real-world usage.

var Promise = require("bluebird")
var t = require("../../index.js")

describe("core (basic)", function () {
    describe("reflect()", function () {
        it("exists", function () {
            t.function(t.reflect)
        })

        it("has base()", function () {
            t.function(t.reflect().base)
        })

        it("has parent()", function () {
            var tt = t.reflect().base()

            t.undefined(tt.reflect().parent())
            t.equal(tt.test("test").reflect().parent(), tt)
        })
    })

    describe("test()", function () {
        it("exists", function () {
            t.function(t.reflect().base().test)
        })

        it("accepts a string + function", function () {
            var tt = t.reflect().base()

            tt.test("test", function () {})
        })

        it("accepts a string", function () {
            var tt = t.reflect().base()

            tt.test("test")
        })

        it("returns the current instance when given a callback", function () {
            var tt = t.reflect().base()
            var test = tt.test("test", function () {})

            t.equal(test, tt)
        })

        it("returns a prototypal clone when not given a callback", function () {
            var tt = t.reflect().base()
            var test = tt.test("test")

            t.notEqual(test, tt)
            t.equal(Object.getPrototypeOf(test), tt)
        })
    })

    describe("run()", function () {
        it("exists", function () {
            t.function(t.reflect().base().run)
        })

        it("runs block tests within tests", function () {
            var tt = t.reflect().base()
            var called = 0

            tt.test("test", function (tt) {
                tt.test("foo", function () { called++ })
            })

            return tt.run().then(function () { t.equal(called, 1) })
        })

        it("runs successful inline tests within tests", function () {
            var tt = t.reflect().base()
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

        it("accepts a callback", function () {
            var tt = t.reflect().base()
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
})
