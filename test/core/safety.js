"use strict"

describe("core (safety)", function () {
    var p = Util.p
    var n = Util.n

    function valueOf(value) {
        return {valueOf: function () { return value }}
    }

    function createSentinel(name) {
        var e = new Error(name)

        e.marker = function () {}
        return e
    }

    it("disallows non-nullish non-functions as `test` impls", function () {
        var tt = t.create()

        assert.throws(function () { tt.test("test", 1) }, TypeError)
        assert.throws(function () { tt.test("test", 0) }, TypeError)
        assert.throws(function () { tt.test("test", true) }, TypeError)
        assert.throws(function () { tt.test("test", false) }, TypeError)
        assert.throws(function () { tt.test("test", "hi") }, TypeError)
        assert.throws(function () { tt.test("test", "") }, TypeError)
        assert.throws(function () { tt.test("test", []) }, TypeError)
        assert.throws(function () { tt.test("test", [1, 2, 3, 4, 5]) }, TypeError) // eslint-disable-line max-len
        assert.throws(function () { tt.test("test", {hello: "world"}) }, TypeError) // eslint-disable-line max-len
        assert.throws(function () { tt.test("test", {}) }, TypeError)
        assert.throws(function () { tt.test("test", valueOf(false)) }, TypeError) // eslint-disable-line max-len
        assert.throws(function () { tt.test("test", valueOf(undefined)) }, TypeError) // eslint-disable-line max-len

        /* eslint-disable no-unused-vars */

        tt.test("test")
        tt.test("test", undefined)
        tt.test("test", null)
        tt.test("test", function () {})
        tt.test("test", function (t) {})
        tt.test("test", function (t, why) {}) // too many arguments
        tt.test("test", function () {
            return {next: function () { return {done: true} }}
        })

        /* eslint-enable no-unused-vars */
    })

    it("catches unsafe access", function () {
        var tt = t.create()
        var ret = []

        tt.reporter(Util.push(ret))

        // This is not exactly elegant...
        var error = (function () {
            var inner
            var tt = t.create().test("test", function (tt) { inner = tt })

            return tt.run().then(function () {
                try { inner.call(function () {}) } catch (e) { return e }
                return assert.fail("Expected an error to be thrown")
            })
        })()

        tt.test("one", function () { tt.test("hi") })
        tt.test("two", function () { tt.try(function () {}) })
        tt.test("three", function () { tt.call(function () {}) })

        tt.test("four", function (tt) {
            tt.test("inner", function () { tt.call(function () {}) })
        })

        tt.test("five", function (tt) {
            tt.test("inner", function () { tt.reporter(function () {}) })
        })

        return Util.Promise.join(error, tt.run(), function (error) {
            assert.match(ret, [
                n("start", []),
                n("fail", [p("one", 0)], error),
                n("fail", [p("two", 1)], error),
                n("fail", [p("three", 2)], error),
                n("enter", [p("four", 3)]),
                n("fail", [p("four", 3), p("inner", 0)], error),
                n("leave", [p("four", 3)]),
                n("enter", [p("five", 4)]),
                n("fail", [p("five", 4), p("inner", 0)], error),
                n("leave", [p("five", 4)]),
                n("end", []),
            ])
        })
    })

    it("catches concurrent runs", function () {
        var tt = t.create()
        var res = tt.run()

        assert.throws(function () { tt.run() }, Error)
        return res
    })

    it("catches concurrent runs when given a callback", function () {
        var tt = t.create()
        var p = tt.run()

        assert.throws(function () { tt.run() }, Error)
        return p
    })

    it("allows non-concurrent runs with reporter error", function () {
        var tt = t.create()
        var sentinel = createSentinel("fail")

        tt.reporter(function () { throw sentinel })

        return tt.run().then(
            function () { assert.fail("Expected a rejection") },
            function (err) { assert.equal(err, sentinel) })
        .then(function () {
            return tt.run().then(
                function () { assert.fail("Expected a rejection") },
                function (err) { assert.equal(err, sentinel) })
        })
    })
})
