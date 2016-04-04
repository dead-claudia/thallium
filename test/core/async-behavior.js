"use strict"

var t = require("../../index.js")
var Util = require("../../test-util/base.js")

var n = Util.n
var p = Util.p

describe("core (asynchronous behavior)", function () {
    it("with normal tests", function () {
        var tt = t.base()
        var called = false

        tt.test("test", function () { called = true })

        var ret = tt.run().then(function () { t.true(called) })

        t.false(called)
        return ret
    })

    it("with shorthand tests", function () {
        var tt = t.base()
        var called = false

        tt.define("assert", function () {
            called = true
            return {test: false}
        })

        tt.test("test").assert()

        var ret = tt.run().then(function () { t.true(called) })

        t.false(called)
        return ret
    })

    it("with async tests + sync done call", function () {
        var tt = t.base()
        var called = false

        tt.async("test", function (_, done) {
            called = true
            return done()
        })

        var ret = tt.run().then(function () { t.true(called) })

        t.false(called)
        return ret
    })

    it("with async tests + async done call", function () {
        var tt = t.base()
        var called = false

        tt.async("test", function (_, done) {
            called = true
            setTimeout(function () { done() }, 0)
        })

        var ret = tt.run().then(function () { t.true(called) })

        t.false(called)
        return ret
    })

    it("with async tests + duplicate thenable resolution", function () {
        var tt = t.base()
        var called = false

        tt.async("test", function () {
            called = true
            return {
                then: function (resolve) {
                    resolve()
                    resolve()
                    resolve()
                },
            }
        })

        var ret = tt.run().then(function () { t.true(called) })

        t.false(called)
        return ret
    })

    it("with async tests + duplicate thenable rejection", function () {
        var tt = t.base()
        var called = false
        var ret = []
        var sentinel = new Error("sentinel")

        sentinel.marker = function () {}

        tt.reporter(Util.push(ret))

        tt.async("test", function () {
            called = true
            return {
                then: function (_, reject) {
                    reject(sentinel)
                    reject()
                    reject()
                },
            }
        })

        var result = tt.run().then(function () {
            t.deepEqual(ret, [
                n("start", []),
                n("start", [p("test", 0)]),
                n("end", [p("test", 0)]),
                n("fail", [p("test", 0)], sentinel),
                n("end", []),
                n("exit", []),
            ])
        })

        t.false(called)
        return result
    })

    it("with async tests + mixed thenable (resolve first)", function () {
        var tt = t.base()
        var called = false
        var ret = []
        var sentinel = new Error("sentinel")

        sentinel.marker = function () {}

        tt.reporter(Util.push(ret))

        tt.async("test", function () {
            called = true
            return {
                then: function (resolve, reject) {
                    resolve()
                    reject(sentinel)
                    resolve()
                    reject()
                },
            }
        })

        var result = tt.run().then(function () {
            t.deepEqual(ret, [
                n("start", []),
                n("start", [p("test", 0)]),
                n("end", [p("test", 0)]),
                n("pass", [p("test", 0)]),
                n("end", []),
                n("exit", []),
            ])
        })

        t.false(called)
        return result
    })

    it("with async tests + mixed thenable (reject first)", function () {
        var tt = t.base()
        var called = false
        var ret = []
        var sentinel = new Error("sentinel")

        sentinel.marker = function () {}

        tt.reporter(Util.push(ret))

        tt.async("test", function () {
            called = true

            return {
                then: function (resolve, reject) {
                    reject(sentinel)
                    resolve()
                    reject()
                    resolve()
                },
            }
        })

        var result = tt.run().then(function () {
            t.deepEqual(ret, [
                n("start", []),
                n("start", [p("test", 0)]),
                n("end", [p("test", 0)]),
                n("fail", [p("test", 0)], sentinel),
                n("end", []),
                n("exit", []),
            ])
        })

        t.false(called)
        return result
    })
})
