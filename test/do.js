"use strict"

var t = require("../lib/index.js").t
var Util = require("../test-util/base.js")
var n = Util.n
var p = Util.p

run("do")
run("block")

function run(name) {
    describe(name + "()", function () {
        it("exists", function () {
            var tt = t.base()

            t.hasKey(tt, name)
            t.function(tt[name])
        })

        it("runs blocks in sync tests", function () {
            var tt = t.base()
            var ret = []
            var len, self // eslint-disable-line consistent-this

            tt.reporter(Util.push(ret))

            tt.test("test", function (tt) {
                tt[name](/** @this */ function () {
                    len = arguments.length
                    self = this
                })
            })

            return tt.run().then(function () {
                t.undefined(self)
                t.equal(len, 0)
                t.deepEqual(ret, [
                    n("start", []),
                    n("start", [p("test", 0)]),
                    n("end", [p("test", 0)]),
                    n("pass", [p("test", 0)]),
                    n("end", []),
                    n("exit", []),
                ])
            })
        })

        it("propagates errors from blocks in sync tests", function () {
            var tt = t.base()
            var ret = []
            var sentinel = new Error("sentinel")

            sentinel.marker = function () {}

            tt.reporter(Util.push(ret))

            tt.test("test", function (tt) {
                tt[name](function () { throw sentinel })
            })

            return tt.run().then(function () {
                t.deepEqual(ret, [
                    n("start", []),
                    n("start", [p("test", 0)]),
                    n("end", [p("test", 0)]),
                    n("fail", [p("test", 0)], sentinel),
                    n("end", []),
                    n("exit", []),
                ])
            })
        })

        it("runs blocks in async tests", function () {
            var tt = t.base()
            var ret = []
            var len, self // eslint-disable-line consistent-this

            tt.reporter(Util.push(ret))

            tt.async("test", function (tt, done) {
                tt[name](/** @this */ function () {
                    len = arguments.length
                    self = this
                })

                done()
            })

            return tt.run().then(function () {
                t.undefined(self)
                t.equal(len, 0)
                t.deepEqual(ret, [
                    n("start", []),
                    n("start", [p("test", 0)]),
                    n("end", [p("test", 0)]),
                    n("pass", [p("test", 0)]),
                    n("end", []),
                    n("exit", []),
                ])
            })
        })

        it("propagates errors from blocks in async tests", function () {
            var tt = t.base()
            var ret = []
            var sentinel = new Error("sentinel")

            sentinel.marker = function () {}

            tt.reporter(Util.push(ret))

            tt.async("test", function (tt, done) {
                tt[name](/** @this */ function () { throw sentinel })
                done()
            })

            return tt.run().then(function () {
                t.deepEqual(ret, [
                    n("start", []),
                    n("start", [p("test", 0)]),
                    n("end", [p("test", 0)]),
                    n("fail", [p("test", 0)], sentinel),
                    n("end", []),
                    n("exit", []),
                ])
            })
        })

        it("runs blocks in inline sync tests", function () {
            var tt = t.base()
            var ret = []
            var len, self // eslint-disable-line consistent-this

            tt.reporter(Util.push(ret))

            tt.test("test")[name](/** @this */ function () {
                len = arguments.length
                self = this
            })

            tt.run().then(function () {
                t.undefined(self)
                t.equal(len, 0)
                t.deepEqual(ret, [
                    n("start", []),
                    n("start", [p("test", 0)]),
                    n("end", [p("test", 0)]),
                    n("pass", [p("test", 0)]),
                    n("end", []),
                    n("exit", []),
                ])
            })
        })

        it("propagates errors from blocks in inline sync tests", function () {
            var tt = t.base()
            var ret = []
            var sentinel = new Error("sentinel")

            sentinel.marker = function () {}

            tt.reporter(Util.push(ret))

            tt.test("test")[name](function () { throw sentinel })

            return tt.run().then(function () {
                t.deepEqual(ret, [
                    n("start", []),
                    n("start", [p("test", 0)]),
                    n("end", [p("test", 0)]),
                    n("fail", [p("test", 0)], sentinel),
                    n("end", []),
                    n("exit", []),
                ])
            })
        })
    })
}
