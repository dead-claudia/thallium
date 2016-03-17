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

    test("catches unsafe access", function () {
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

        tt.run().then(function () {
            t.deepEqual(ret, [
                n("start", []),
                n("start", [p("one", 0)]),
                n("end", [p("one", 0)]),
                n("fail", [p("one", 0)], error),
                n("start", [p("two", 1)]),
                n("end", [p("two", 1)]),
                n("fail", [p("two", 1)], error),
                n("start", [p("three", 2)]),
                n("end", [p("three", 2)]),
                n("fail", [p("three", 2)], error),
                n("start", [p("four", 3)]),
                n("end", [p("four", 3)]),
                n("fail", [p("four", 3)], error),
                n("start", [p("five", 4)]),
                n("start", [p("five", 4), p("inner", 0)]),
                n("end", [p("five", 4), p("inner", 0)]),
                n("fail", [p("five", 4), p("inner", 0)], error),
                n("end", [p("five", 4)]),
                n("pass", [p("five", 4)]),
                n("start", [p("six", 5)]),
                n("start", [p("six", 5), p("inner", 0)]),
                n("end", [p("six", 5), p("inner", 0)]),
                n("fail", [p("six", 5), p("inner", 0)], error),
                n("end", [p("six", 5)]),
                n("pass", [p("six", 5)]),
                n("start", [p("seven", 6)]),
                n("end", [p("seven", 6)]),
                n("fail", [p("seven", 6)], error),
                n("start", [p("eight", 7)]),
                n("end", [p("eight", 7)]),
                n("fail", [p("eight", 7)], error),
                n("end", []),
                n("exit", []),
            ])
        })
    })

    test("reports extraneous async done", function () {
        var tt = t.base()
        var ret = []

        var sentinel = new Error("true")

        sentinel.marker = function () {}

        tt.reporter(util.push(ret))

        tt.test("test", function (tt) {
            tt.test("inner", function (tt) {
                tt.async("fail", function (tt, done) {
                    /* eslint-disable callback-return */

                    done()
                    done()
                    done(sentinel)

                    /* eslint-enable callback-return */
                })
            })
        })

        tt.run().then(function () {
            t.includesDeepAny([4, 5, 6, 7, 8, 9, 10, 11, 12].map(function (i) {
                var splice1 = n("extra",
                    [p("test", 0), p("inner", 0), p("fail", 0)],
                    {count: 2, value: undefined})

                var splice2 = n("extra",
                    [p("test", 0), p("inner", 0), p("fail", 0)],
                    {count: 3, value: sentinel})

                var nodes = [
                    n("start", []),
                    n("start", [p("test", 0)]),
                    n("start", [p("test", 0), p("inner", 0)]),
                    n("start", [p("test", 0), p("inner", 0), p("fail", 0)]),
                    // Extras should first appear here.
                    n("end", [p("test", 0), p("inner", 0), p("fail", 0)]),
                    n("pass", [p("test", 0), p("inner", 0), p("fail", 0)]),
                    n("end", [p("test", 0), p("inner", 0)]),
                    n("pass", [p("test", 0), p("inner", 0)]),
                    n("end", [p("test", 0)]),
                    n("pass", [p("test", 0)]),
                    n("end", []),
                    n("exit", []),
                ]

                nodes.splice(i, 0, splice1, splice2)
                return nodes
            }), [ret])
        })
    })

    test("catches concurrent runs", function () {
        var tt = t.base()

        tt.reporter(function (_, done) { done() })
        var res = tt.run()

        t.throws(function () { tt.run() }, Error)

        return res
    })

    test("catches concurrent runs when given a callback", function (done) {
        var tt = t.base()

        tt.reporter(function (_, done) { done() })
        tt.run(done)
        t.throws(function () { tt.run() }, Error)
    })

    test("allows non-concurrent runs with reporter error", function () {
        var tt = t.base()
        var sentinel = new Error("fail")

        tt.reporter(function (_, done) { done(sentinel) })

        tt.run()
        .then(
            function () { t.fail("Expected a rejection") },
            function (err) { t.equal(err, sentinel) })
        .then(function () {
            tt.run()
            .then(
                function () { t.fail("Expected a rejection") },
                function (err) { t.equal(err, sentinel) })
        })
    })
})
