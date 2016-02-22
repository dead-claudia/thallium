/* eslint max-nested-callbacks: [2, 5] */
"use strict"

var t = require("../index.js")
var util = require("../test-util/base.js")
var n = util.n

run("do")
run("block")

function run(name) {
    suite(name + "()", function () {
        test("exists", function () {
            var tt = t.base()

            t.hasKey(tt, name)
            t.function(tt[name])
        })

        test("runs blocks in sync tests", function (done) {
            var tt = t.base()
            var len, self // eslint-disable-line consistent-this
            var ret = []

            tt.reporter(util.push(ret))

            tt.test("test", function (tt) {
                tt[name](function () {
                    len = arguments.length
                    self = this // eslint-disable-line no-invalid-this
                })
            })

            tt.run(util.wrap(done, function () {
                t.undefined(self)
                t.equal(len, 0)
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("end", "test", 0),
                    n("pass", "test", 0),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])
            }))
        })

        test("propagates errors from blocks in sync tests", function (done) {
            var tt = t.base()
            var ret = []
            var sentinel = new Error("sentinel")

            sentinel.marker = function () {}

            tt.reporter(util.push(ret))

            tt.test("test", function (tt) {
                tt[name](function () { throw sentinel })
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
        })

        test("runs blocks in async tests", function (done) {
            var tt = t.base()
            var len, self // eslint-disable-line consistent-this
            var ret = []

            tt.reporter(util.push(ret))

            tt.async("test", function (tt, done) {
                tt[name](function () {
                    len = arguments.length
                    self = this // eslint-disable-line no-invalid-this
                })
                done()
            })

            tt.run(util.wrap(done, function () {
                t.undefined(self)
                t.equal(len, 0)
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("end", "test", 0),
                    n("pass", "test", 0),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])
            }))
        })

        test("propagates errors from blocks in async tests", function (done) {
            var tt = t.base()
            var ret = []
            var sentinel = new Error("sentinel")

            sentinel.marker = function () {}

            tt.reporter(util.push(ret))

            tt.async("test", function (tt, done) {
                tt[name](function () { throw sentinel })
                done()
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
        })

        test("runs blocks in inline sync tests", function (done) {
            var tt = t.base()
            var len, self // eslint-disable-line consistent-this
            var ret = []

            tt.reporter(util.push(ret))

            tt.test("test")[name](function () {
                len = arguments.length
                self = this // eslint-disable-line no-invalid-this
            })

            tt.run(util.wrap(done, function () {
                t.undefined(self)
                t.equal(len, 0)
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("end", "test", 0),
                    n("pass", "test", 0),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])
            }))
        })

        test("propagates errors from blocks in inline sync tests", function (done) { // eslint-disable-line max-len
            var tt = t.base()
            var ret = []
            var sentinel = new Error("sentinel")

            sentinel.marker = function () {}

            tt.reporter(util.push(ret))

            tt.test("test")[name](function () { throw sentinel })

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
        })
    })
}
