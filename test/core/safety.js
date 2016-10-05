"use strict"

describe("core (safety)", function () {
    var p = Util.p
    var n = Util.n

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

    it("disallows non-functions as `async` impls", function () {
        var tt = t.create()

        assert.throws(function () { tt.async("test", 1) }, TypeError)
        assert.throws(function () { tt.async("test", 0) }, TypeError)
        assert.throws(function () { tt.async("test", true) }, TypeError)
        assert.throws(function () { tt.async("test", false) }, TypeError)
        assert.throws(function () { tt.async("test", "hi") }, TypeError)
        assert.throws(function () { tt.async("test", "") }, TypeError)
        assert.throws(function () { tt.async("test", []) }, TypeError)
        assert.throws(function () { tt.async("test", [1, 2, 3, 4, 5]) }, TypeError) // eslint-disable-line max-len
        assert.throws(function () { tt.async("test", {hello: "world"}) }, TypeError) // eslint-disable-line max-len
        assert.throws(function () { tt.async("test", {}) }, TypeError)
        assert.throws(function () { tt.async("test", valueOf(false)) }, TypeError) // eslint-disable-line max-len
        assert.throws(function () { tt.async("test", valueOf(undefined)) }, TypeError) // eslint-disable-line max-len
        assert.throws(function () { tt.async("test") }, TypeError)
        assert.throws(function () { tt.async("test", undefined) }, TypeError)
        assert.throws(function () { tt.async("test", null) }, TypeError)

        /* eslint-disable no-unused-vars */

        tt.async("test", function () {})
        tt.async("test", function (t) {})
        tt.async("test", function (t, why) {}) // too many arguments
        tt.async("test", function (t, why, wtf) {}) // too many arguments
        tt.async("test", function () {
            return {next: function () { return {done: true} }}
        })

        /* eslint-enable no-unused-vars */
    })

    it("catches unsafe access", function () {
        var tt = t.create()
        var ret = []

        tt.reporter(Util.push(ret))

        var error = new ReferenceError(Util.m("fail.checkInit"))

        function plugin() {}

        tt.test("one", function () { tt.test("hi") })
        tt.test("two", function () { tt.try(plugin) })
        tt.test("three", function () { tt.use(plugin) })

        tt.test("four", function (tt) {
            tt.test("inner", function () { tt.use(plugin) })
        })

        tt.test("five", function (tt) {
            tt.test("inner", function () { tt.reporter(noopReporter) })
        })

        return tt.run().then(function () {
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

        tt.reporter(noopReporter)

        var res = tt.run()

        assert.throws(function () { tt.run() }, Error)
        return res
    })

    it("catches concurrent runs when given a callback", function () {
        var tt = t.create().reporter(noopReporter)
        var p = tt.run()

        assert.throws(function () { tt.run() }, Error)
        return p
    })

    it("allows non-concurrent runs with reporter error", function () {
        var tt = t.create()
        var sentinel = createSentinel("fail")

        tt.reporter(function (_, done) { done(sentinel) })

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
