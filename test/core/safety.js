"use strict"

describe("core (safety)", function () {
    var p = Util.p
    var n = Util.n

    function createSentinel(name) {
        var e = new Error(name)

        e.marker = function () {}
        return e
    }

    it("catches unsafe access", function () {
        var tt = Util.create()
        var ret = []

        tt.reporter(Util.push(ret))

        // This is not exactly elegant...
        var error = (function () {
            var inner
            var tt = Util.create()

            tt.test("test", function (tt) { inner = tt })

            return tt.run().then(function () {
                return inner.call(function (r) {
                    try { r.checkInit() } catch (e) { return e }
                    return assert.fail("Expected an error to be thrown")
                })
            })
        })()

        function id(r) { return r }

        tt.test("one", function () { tt.test("hi", function () {}) })
        tt.test("two", function () { tt.call(id).checkInit() })

        tt.test("three", function (tt) {
            tt.test("inner", function () { tt.call(id).checkInit() })
        })

        tt.test("four", function (tt) {
            tt.test("inner", function () { tt.reporter(function () {}) })
        })

        return Util.Promise.join(error, tt.run(), function (error) {
            assert.match(ret, [
                n("start", []),
                n("fail", [p("one", 0)], error),
                n("fail", [p("two", 1)], error),
                n("enter", [p("three", 2)]),
                n("fail", [p("three", 2), p("inner", 0)], error),
                n("leave", [p("three", 2)]),
                n("enter", [p("four", 3)]),
                n("fail", [p("four", 3), p("inner", 0)], error),
                n("leave", [p("four", 3)]),
                n("end", []),
            ])
        })
    })

    it("catches concurrent runs", function () {
        var tt = Util.create()
        var res = tt.run()

        assert.throws(function () { tt.run() }, Error)
        return res
    })

    it("allows non-concurrent runs with reporter error", function () {
        var tt = Util.create()
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
