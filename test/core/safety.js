"use strict"

var m = require("../../lib/messages.js")
var t = require("../../index.js")
var Util = require("../../helpers/base.js")
var p = Util.p
var n = Util.n

describe("core (safety)", function () {
    function valueOf(value) {
        return {valueOf: function () { return value }}
    }

    function noopReporter(_, done) {
        done()
    }

    function createSentinel(name) {
        var e = new Error(name)

        e.marker = function () {}
        return e
    }

    it("disallows non-nullish non-functions as `test` impls", function () {
        var tt = t.reflect().base()

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
        t.throws(function () { tt.test("test", valueOf(false)) }, TypeError)
        t.throws(function () { tt.test("test", valueOf(undefined)) }, TypeError)

        /* eslint-disable no-unused-vars */

        tt.test("test")
        tt.test("test", undefined)
        tt.test("test", null)
        tt.test("test", function () {})
        tt.test("test", function (t) {})
        tt.test("test", function (t, done) {}) // too many arguments
        tt.test("test", function () {
            return {next: function () { return {done: true} }}
        })

        /* eslint-enable no-unused-vars */
    })

    it("disallows non-functions as `async` impls", function () {
        var tt = t.reflect().base()

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
        t.throws(function () { tt.async("test", valueOf(false)) }, TypeError)
        t.throws(function () { tt.async("test", valueOf(undefined)) }, TypeError) // eslint-disable-line max-len
        t.throws(function () { tt.async("test") }, TypeError)
        t.throws(function () { tt.async("test", undefined) }, TypeError)
        t.throws(function () { tt.async("test", null) }, TypeError)

        /* eslint-disable no-unused-vars */

        tt.async("test", function () {})
        tt.async("test", function (t) {})
        tt.async("test", function (t, done) {})
        tt.async("test", function (t, done, wtf) {}) // too many arguments
        tt.async("test", function () {
            return {next: function () { return {done: true} }}
        })

        /* eslint-enable no-unused-vars */
    })

    it("catches unsafe access", function () {
        var tt = t.reflect().base()
        var ret = []

        tt.reporter(Util.push(ret))

        var error = new ReferenceError(m("fail.checkInit"))

        function plugin() {}

        tt.test("one", function () { tt.test("hi") })
        tt.test("two", function () { tt.define("hi", function () {}) })
        tt.define("assert", function () { return {test: true} })
        tt.test("three", function () { tt.assert() })
        tt.test("four", function () { tt.use(plugin) })

        tt.test("five", function (tt) {
            tt.test("inner", function () { tt.use(plugin) })
        })

        tt.test("six", function (tt) {
            tt.test("inner", function () { tt.reporter(noopReporter) })
        })

        tt.test("seven", function () { tt.add("inner", function () {}) })

        tt.test("eight", function () {
            tt.wrap("test", function (func) { return func() })
        })

        return tt.run().then(function () {
            t.match(ret, [
                n("start", []),
                n("fail", [p("one", 0)], error),
                n("fail", [p("two", 1)], error),
                n("fail", [p("three", 2)], error),
                n("fail", [p("four", 3)], error),
                n("enter", [p("five", 4)]),
                n("fail", [p("five", 4), p("inner", 0)], error),
                n("leave", [p("five", 4)]),
                n("enter", [p("six", 5)]),
                n("fail", [p("six", 5), p("inner", 0)], error),
                n("leave", [p("six", 5)]),
                n("fail", [p("seven", 6)], error),
                n("fail", [p("eight", 7)], error),
                n("end", []),
            ])
        })
    })

    it("reports extraneous async done", function () {
        var tt = t.reflect().base()
        var ret = []
        var sentinel = createSentinel("sentinel")

        tt.reporter(Util.push(ret))

        tt.test("test", function (tt) {
            tt.test("inner", function (tt) {
                tt.async("fail", function (tt, done) {
                    done() // eslint-disable-line callback-return
                    done() // eslint-disable-line callback-return
                    done(sentinel) // eslint-disable-line callback-return
                })
            })
        })

        return tt.run().then(function () {
            for (var i = 0; i < ret.length; i++) {
                var entry = ret[i]

                if (entry.type === "extra") {
                    t.string(entry.value.stack)
                    delete entry.value.stack
                }
            }

            t.includesMatchAny(
                [3, 4, 5, 6].map(function (i) {
                    var splice1 = n("extra",
                        [p("test", 0), p("inner", 0), p("fail", 0)],
                        {count: 2, value: undefined})

                    var splice2 = n("extra",
                        [p("test", 0), p("inner", 0), p("fail", 0)],
                        {count: 3, value: sentinel})

                    var node = [
                        n("start", []),
                        n("enter", [p("test", 0)]),
                        n("enter", [p("test", 0), p("inner", 0)]),
                        // Extras should first appear here.
                        n("pass", [p("test", 0), p("inner", 0), p("fail", 0)]),
                        n("leave", [p("test", 0), p("inner", 0)]),
                        n("leave", [p("test", 0)]),
                        n("end", []),
                    ]

                    node.splice(i, 0, splice1, splice2)
                    return node
                }),
                [ret])
        })
    })

    it("catches concurrent runs", function () {
        var tt = t.reflect().base()

        tt.reporter(noopReporter)

        var res = tt.run()

        t.throws(function () { tt.run() }, Error)
        return res
    })

    it("catches concurrent runs when given a callback", function (done) {
        var tt = t.reflect().base()

        tt.reporter(noopReporter)
        tt.run(done)
        t.throws(function () { tt.run(done) }, Error)
    })

    it("allows non-concurrent runs with reporter error", function () {
        var tt = t.reflect().base()
        var sentinel = createSentinel("fail")

        tt.reporter(function (_, done) { done(sentinel) })

        return tt.run().then(
            function () { t.fail("Expected a rejection") },
            function (err) { t.equal(err, sentinel) })
        .then(function () {
            return tt.run().then(
                function () { t.fail("Expected a rejection") },
                function (err) { t.equal(err, sentinel) })
        })
    })
})
