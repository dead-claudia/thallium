"use strict"

var t = require("../../index.js")
var util = require("../../test-util/base.js")
var p = util.p
var n = util.n

suite("core (safety)", function () {
    test("disallows non-nullish non-functions as `test` impls", function () {
        var tt = t.base()
        t.throws(function () { tt.test("test", 1) }, TypeError)
        t.throws(function () { tt.test("test", 0) }, TypeError)
        t.throws(function () { tt.test("test", true) }, TypeError)
        t.throws(function () { tt.test("test", false) }, TypeError)
        t.throws(function () { tt.test("test", "hi") }, TypeError)
        t.throws(function () { tt.test("test", "") }, TypeError)
        t.throws(function () { tt.test("test", []) }, TypeError)
        t.throws(function () { tt.test("test", [1, 2, 3, 4, 5]) }, TypeError)
        t.throws(function () { tt.test("test", {hello: "world"}) }, TypeError)
        t.throws(function () { tt.test("test", {}) }, TypeError)

        t.throws(function () {
            tt.test("test", {valueOf: function () { return false }})
        }, TypeError)

        t.throws(function () {
            tt.test("test", {valueOf: function () { return undefined }})
        }, TypeError)

        tt.test("test")
        tt.test("test", undefined)
        tt.test("test", null)
        tt.test("test", function () {})

        /* eslint-disable no-unused-vars */
        tt.test("test", function (t) {})

        // it also ignores too many arguments
        tt.test("test", function (t, done) {})
        /* eslint-enable no-unused-vars */

        tt.test("test", function () {
            return {next: function () { return {done: true} }}
        })
    })

    test("disallows non-functions as `async` impls", function () {
        var tt = t.base()
        t.throws(function () { tt.async("test", 1) }, TypeError)
        t.throws(function () { tt.async("test", 0) }, TypeError)
        t.throws(function () { tt.async("test", true) }, TypeError)
        t.throws(function () { tt.async("test", false) }, TypeError)
        t.throws(function () { tt.async("test", "hi") }, TypeError)
        t.throws(function () { tt.async("test", "") }, TypeError)
        t.throws(function () { tt.async("test", []) }, TypeError)
        t.throws(function () { tt.async("test", [1, 2, 3, 4, 5]) }, TypeError)
        t.throws(function () { tt.async("test", {hello: "world"}) }, TypeError)
        t.throws(function () { tt.async("test", {}) }, TypeError)

        t.throws(function () {
            tt.async("test", {valueOf: function () { return false }})
        }, TypeError)

        t.throws(function () {
            tt.async("test", {valueOf: function () { return undefined }})
        }, TypeError)

        t.throws(function () { tt.async("test") }, TypeError)
        t.throws(function () { tt.async("test", undefined) }, TypeError)
        t.throws(function () { tt.async("test", null) }, TypeError)

        tt.async("test", function () {})

        /* eslint-disable no-unused-vars */
        tt.async("test", function (t) {})
        tt.async("test", function (t, done) {})

        // it also ignores too many arguments
        tt.async("test", function (t, done, wtf) {})
        /* eslint-enable no-unused-vars */

        tt.async("test", function () {
            return {next: function () { return {done: true} }}
        })
    })

    test("catches unsafe access", function (done) {
        var tt = t.base()
        var ret = []

        tt.reporter(util.push(ret))

        var error = new ReferenceError(
            "It is only safe to call test methods during initialization")

        function plugin() {}

        tt.test("one", function () {
            tt.test("hi")
        })

        tt.test("two", function () {
            tt.define("hi", function () {})
        })

        tt.define("assert", function () { return {test: true} })

        tt.test("three", function () {
            tt.assert()
        })

        tt.test("four", function () {
            tt.use(plugin)
        })

        tt.test("five", function (tt) {
            tt.test("inner", function () {
                tt.use(plugin)
            })
        })

        tt.test("six", function (tt) {
            tt.test("inner", function () {
                tt.use(plugin)
            })
        })

        tt.test("seven", function () {
            tt.add("inner", function () {})
        })

        tt.test("eight", function () {
            tt.wrap("test", function (func) { return func() })
        })

        tt.run(util.wrap(done, function () {
            t.deepEqual(ret, [
                n("start", undefined, -1),

                n("start", "one", 0),
                n("end", "one", 0),
                n("fail", "one", 0, undefined, error),

                n("start", "two", 1),
                n("end", "two", 1),
                n("fail", "two", 1, undefined, error),

                n("start", "three", 2),
                n("end", "three", 2),
                n("fail", "three", 2, undefined, error),

                n("start", "four", 3),
                n("end", "four", 3),
                n("fail", "four", 3, undefined, error),

                n("start", "five", 4),

                n("start", "inner", 0, p("five", 4)),
                n("end", "inner", 0, p("five", 4)),
                n("fail", "inner", 0, p("five", 4), error),

                n("end", "five", 4),
                n("pass", "five", 4),

                n("start", "six", 5),

                n("start", "inner", 0, p("six", 5)),
                n("end", "inner", 0, p("six", 5)),
                n("fail", "inner", 0, p("six", 5), error),

                n("end", "six", 5),
                n("pass", "six", 5),

                n("start", "seven", 6),
                n("end", "seven", 6),
                n("fail", "seven", 6, undefined, error),

                n("start", "eight", 7),
                n("end", "eight", 7),
                n("fail", "eight", 7, undefined, error),

                n("end", undefined, -1),
                n("exit", undefined, 0),
            ])
        }))
    })

    test("reports extraneous async done", function (done) {
        var tt = t.base()
        var ret = []

        var sentinel = new Error("true")
        // Only unique property
        sentinel.marker = function () {}

        tt.reporter(util.push(ret))

        tt.test("test", function (tt) {
            tt.test("inner", function (tt) {
                tt.async("fail", function (tt, done) {
                    done()
                    done()
                    done(sentinel)
                })
            })
        })

        function r(name, index) {
            return {name: name, index: index}
        }

        tt.run(util.wrap(done, function () {
            t.includesDeepAny([4, 5, 6, 7, 8, 9, 10, 11, 12].map(function (i) {
                var splice1 = n("extra", "fail", 0,
                    [r("test", 0), r("inner", 0)],
                    {count: 2, value: undefined})

                var splice2 = n("extra", "fail", 0,
                    [r("test", 0), r("inner", 0)],
                    {count: 3, value: sentinel})

                var nodes = [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("start", "inner", 0, p("test", 0)),
                    n("start", "fail", 0, p("inner", 0, p("test", 0))),
                    // Extras should first appear here.
                    n("end", "fail", 0, p("inner", 0, p("test", 0))),
                    n("pass", "fail", 0, p("inner", 0, p("test", 0))),
                    n("end", "inner", 0, p("test", 0)),
                    n("pass", "inner", 0, p("test", 0)),
                    n("end", "test", 0),
                    n("pass", "test", 0),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ]

                nodes.splice(i, 0, splice1, splice2)
                return nodes
            }), [ret])
        }))
    })

    test("catches concurrent runs", function () {
        var tt = t.base()
        tt.reporter(function (_, done) { done() })
        var p = tt.run()
        t.throws(function () { tt.run() }, Error)
        return p
    })
})
