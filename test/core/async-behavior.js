"use strict"

/* global setTimeout */

var t = require("../../index.js")
var util = require("../../test-util/base.js")
var n = util.n

suite("core (asynchronous behavior)", function () {
    test("with normal tests", function (done) {
        var tt = t.base()
        var called = false

        tt.test("test", function () { called = true })
        tt.run(util.wrap(done, function () { t.true(called) }))
        t.false(called)
    })

    test("with shorthand tests", function (done) {
        var tt = t.base()
        var called = false

        tt.define("assert", function () {
            called = true
            return {test: false, message: "should never happen"}
        })

        tt.test("test").assert()
        tt.run(util.wrap(done, function () { t.true(called) }))
        t.false(called)
    })

    test("with async tests + sync done call", function (done) {
        var tt = t.base()
        var called = false

        tt.async("test", function (_, done) {
            called = true
            done()
        })
        tt.run(util.wrap(done, function () { t.true(called) }))

        t.false(called)
    })

    test("with async tests + async done call", function (done) {
        var tt = t.base()
        var called = false

        tt.async("test", function (_, done) {
            called = true
            setTimeout(function () { return done() })
        })

        tt.run(util.wrap(done, function () { t.true(called) }))

        t.false(called)
    })

    test("with async tests + duplicate thenable resolution", function (done) {
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

        tt.run(util.wrap(done, function () { t.true(called) }))

        t.false(called)
    })

    test("with async tests + duplicate thenable rejection", function (done) {
        var tt = t.base()
        var called = false
        var ret = []
        var sentinel = new Error("sentinel")

        sentinel.marker = function () {}

        tt.reporter(util.push(ret))

        tt.async("test", function () {
            called = true
            return {
                then: function (resolve, reject) {
                    reject(sentinel)
                    reject()
                    reject()
                },
            }
        })

        tt.run(util.wrap(done, function () {
            t.deepEqual(ret, [
                n("start", undefined, -1),
                n("start", "test", 0),
                n("end", "test", 0),
                n("fail", "test", 0, undefined, sentinel),
                n("end", undefined, -1),
                n("exit", undefined, 0),
            ])
        }))

        t.false(called)
    })

    test("with async tests + mixed thenable (resolve first)", function (done) {
        var tt = t.base()
        var called = false
        var ret = []
        var sentinel = new Error("sentinel")

        sentinel.marker = function () {}

        tt.reporter(util.push(ret))

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

        tt.run(util.wrap(done, function () {
            t.deepEqual(ret, [
                n("start", undefined, -1),
                n("start", "test", 0),
                n("end", "test", 0),
                n("pass", "test", 0),
                n("end", undefined, -1),
                n("exit", undefined, 0),
            ])
        }))

        t.false(called)
    })

    test("with async tests + mixed thenable (reject first)", function (done) {
        var tt = t.base()
        var called = false
        var ret = []
        var sentinel = new Error("sentinel")

        sentinel.marker = function () {}

        tt.reporter(util.push(ret))

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

        tt.run(util.wrap(done, function () {
            t.deepEqual(ret, [
                n("start", undefined, -1),
                n("start", "test", 0),
                n("end", "test", 0),
                n("fail", "test", 0, undefined, sentinel),
                n("end", undefined, -1),
                n("exit", undefined, 0),
            ])
        }))

        t.false(called)
    })
})
