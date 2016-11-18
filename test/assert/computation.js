"use strict"

describe("assert (computation)", function () {
    var fail = Util.fail
    var basic = Util.basic

    describe("throws()", function () {
        it("works", function () {
            assert.throws(function () { throw new Error("fail") })
            assert.throws(TypeError, function () { throw new TypeError("fail") }) // eslint-disable-line max-len
            assert.throws(Error, function () { throw new TypeError("fail") })
            fail("throws", Error, function () {})
            fail("throws", function () {})
        })

        it("doesn't rethrow non-matching errors", function () {
            fail("throws", TypeError, function () { throw new Error("fail") })
        })

        it("doesn't rethrow non-errors", function () {
            /* eslint-disable no-throw-literal */

            assert.throws(function () { throw undefined })
            assert.throws(function () { throw null })
            assert.throws(function () { throw 1 })
            assert.throws(function () { throw "why" })
            assert.throws(function () { throw true })
            assert.throws(function () { throw [] })
            assert.throws(function () { throw {} })

            fail("throws", Error, function () { throw undefined })
            fail("throws", Error, function () { throw null })
            fail("throws", Error, function () { throw 1 })
            fail("throws", Error, function () { throw "why" })
            fail("throws", Error, function () { throw true })
            fail("throws", Error, function () { throw [] })
            fail("throws", Error, function () { throw {} })

            /* eslint-disable no-undef */

            if (typeof Symbol === "function") {
                assert.throws(function () { throw Symbol() })
                fail("throws", Error, function () { throw Symbol() })
            }

            /* eslint-enable no-undef, no-throw-literal */
        })
    })

    basic("throwsMatch()", function () {
        var sentinel = new Error("sentinel")

        function test() { throw sentinel }
        function is(e) { return e === sentinel }
        function not(e) { return e !== sentinel }

        assert.throwsMatch(is, test)
        assert.throwsMatch("sentinel", test)
        assert.throwsMatch(/sent/, test)
        assert.throwsMatch({message: "sentinel"}, test)

        fail("throwsMatch", not, test)
        fail("throwsMatch", not, function () {})
        fail("throwsMatch", "nope", test)
        fail("throwsMatch", /hi/, test)
        fail("throwsMatch", {message: "nope"}, test)
    })

    describe("atLeast()", function () {
        it("works", function () {
            assert.atLeast(0, 0)
            assert.atLeast(1, 1)
            assert.atLeast(1, -1)
            assert.atLeast(12398.4639, 1245.472398)

            fail("atLeast", 0, 1000)
            fail("atLeast", -1, 1)
            fail("atLeast", -1, 0)
        })

        it("works with Infinities", function () {
            assert.atLeast(0, -Infinity)
            assert.atLeast(-Infinity, -Infinity)
            assert.atLeast(Infinity, -Infinity)
            assert.atLeast(Infinity, 0)
            assert.atLeast(Infinity, Infinity)

            fail("atLeast", -Infinity, Infinity)
            fail("atLeast", -Infinity, 0)
        })

        it("fails with NaNs", function () {
            fail("atLeast", NaN, 0)
            fail("atLeast", 0, NaN)
            fail("atLeast", NaN, NaN)
            fail("atLeast", NaN, Infinity)
            fail("atLeast", Infinity, NaN)
            fail("atLeast", NaN, -Infinity)
            fail("atLeast", -Infinity, NaN)
        })
    })

    describe("atMost()", function () {
        it("works", function () {
            assert.atMost(0, 0)
            assert.atMost(1, 1)
            fail("atMost", 1, -1)
            fail("atMost", 12398.4639, 1245.472398)

            assert.atMost(0, 1000)
            assert.atMost(-1, 1)
            assert.atMost(-1, 0)
        })

        it("works with Infinities", function () {
            fail("atMost", 0, -Infinity)
            assert.atMost(-Infinity, -Infinity)
            fail("atMost", Infinity, -Infinity)
            fail("atMost", Infinity, 0)
            assert.atMost(Infinity, Infinity)

            assert.atMost(-Infinity, Infinity)
            assert.atMost(-Infinity, 0)
        })

        it("fails with NaNs", function () {
            fail("atMost", NaN, 0)
            fail("atMost", 0, NaN)
            fail("atMost", NaN, NaN)
            fail("atMost", NaN, Infinity)
            fail("atMost", Infinity, NaN)
            fail("atMost", NaN, -Infinity)
            fail("atMost", -Infinity, NaN)
        })
    })

    describe("below()", function () {
        it("works", function () {
            fail("below", 0, 0)
            fail("below", 1, 1)
            fail("below", 1, -1)
            fail("below", 12398.4639, 1245.472398)

            assert.below(0, 1000)
            assert.below(-1, 1)
            assert.below(-1, 0)
        })

        it("works with Infinities", function () {
            fail("below", 0, -Infinity)
            fail("below", -Infinity, -Infinity)
            fail("below", Infinity, -Infinity)
            fail("below", Infinity, 0)
            fail("below", Infinity, Infinity)

            assert.below(-Infinity, Infinity)
            assert.below(-Infinity, 0)
        })

        it("fails with NaNs", function () {
            fail("below", NaN, 0)
            fail("below", 0, NaN)
            fail("below", NaN, NaN)
            fail("below", NaN, Infinity)
            fail("below", Infinity, NaN)
            fail("below", NaN, -Infinity)
            fail("below", -Infinity, NaN)
        })
    })

    describe("between()", function () {
        it("works", function () {
            assert.between(0, 0, 1)
            assert.between(1, 0, 1)
            assert.between(1, 1, 1)
            assert.between(0, -1, 1)
            fail("between", 1, -1, 0)
            assert.between(1, -1, 1)
            fail("between", 12398.4639, 1245.472398, 12345.12345)
        })

        it("works with Infinities", function () {
            fail("between", 0, -Infinity, -1)
            assert.between(0, -Infinity, 0)
            assert.between(-Infinity, -Infinity, -Infinity)
            assert.between(-Infinity, -Infinity, 0)
            fail("between", Infinity, -Infinity, 0)
            fail("between", Infinity, 0, 0)
            assert.between(Infinity, 0, Infinity)
            assert.between(-Infinity, -Infinity, Infinity)
        })

        it("fails with NaNs", function () {
            fail("between", NaN, 0, NaN)
            fail("between", NaN, NaN, 0)
            fail("between", 0, NaN, 0)
            fail("between", 0, 0, NaN)
            fail("between", NaN, NaN, NaN)
            fail("between", NaN, 0, Infinity)
            fail("between", NaN, -Infinity, 0)
            fail("between", NaN, -Infinity, Infinity)
            fail("between", Infinity, NaN, 0)
            fail("between", Infinity, 0, NaN)
            fail("between", Infinity, NaN, NaN)
            fail("between", -Infinity, NaN, 0)
            fail("between", -Infinity, 0, NaN)
            fail("between", -Infinity, NaN, NaN)
        })
    })

    describe("closeTo()", function () {
        it("works", function () {
            assert.closeTo(0, 0, 0)
            assert.closeTo(-0, 0, 0)
            assert.closeTo(0.1, 0, 0.2)
            assert.closeTo(-0.1, 0, 0.2)
            assert.closeTo(0.5, 1, 1)
            assert.closeTo(-0.5, -1, 1)
            assert.closeTo(-0.5, 0, 1)
            assert.closeTo(0.5, 0, 1)
            fail("closeTo", 0.2, 0, 0.1)
            fail("closeTo", -0.2, 0, 0.1)
            fail("closeTo", 1, 0, 0.2)
            fail("closeTo", 1, -1, 0.2)
            fail("closeTo", 1, 0, 0.2)
        })

        it("works with Infinities", function () {
            assert.closeTo(0, 0, Infinity)
            assert.closeTo(100, 0, Infinity)
            assert.closeTo(Infinity, 0, Infinity)
            assert.closeTo(Infinity, -Infinity, Infinity)
            assert.closeTo(0, 0, Infinity)
            assert.closeTo(0, 100, Infinity)
            assert.closeTo(0, Infinity, Infinity)
            assert.closeTo(-Infinity, Infinity, Infinity)
        })

        it("fails with NaNs", function () {
            fail("closeTo", NaN, 0, 0)
            fail("closeTo", NaN, 0, Infinity)
            fail("closeTo", NaN, Infinity, 0)
            fail("closeTo", NaN, Infinity, Infinity)
            fail("closeTo", NaN, -Infinity, 0)
            fail("closeTo", NaN, -Infinity, Infinity)
            fail("closeTo", 0, NaN, 0)
            fail("closeTo", 0, NaN, Infinity)
            fail("closeTo", Infinity, NaN, 0)
            fail("closeTo", Infinity, NaN, Infinity)
            fail("closeTo", -Infinity, NaN, 0)
            fail("closeTo", -Infinity, NaN, Infinity)
        })
    })

    describe("notCloseTo()", function () {
        it("works", function () {
            fail("notCloseTo", 0, 0, 0)
            fail("notCloseTo", 0, 0, 0)
            fail("notCloseTo", 0.1, 0, 0.2)
            fail("notCloseTo", -0.1, 0, 0.2)
            fail("notCloseTo", 0.5, 1, 1)
            fail("notCloseTo", -0.5, -1, 1)
            fail("notCloseTo", -0.5, 0, 1)
            fail("notCloseTo", 0.5, 0, 1)
            assert.notCloseTo(0.2, 0, 0.1)
            assert.notCloseTo(-0.2, 0, 0.1)
            assert.notCloseTo(1, 0, 0.2)
            assert.notCloseTo(1, -1, 0.2)
            assert.notCloseTo(1, 0, 0.2)
        })

        it("works with Infinities", function () {
            fail("notCloseTo", 0, 0, Infinity)
            fail("notCloseTo", 100, 0, Infinity)
            fail("notCloseTo", Infinity, 0, Infinity)
            fail("notCloseTo", Infinity, -Infinity, Infinity)
            fail("notCloseTo", 0, 0, Infinity)
            fail("notCloseTo", 0, 100, Infinity)
            fail("notCloseTo", 0, Infinity, Infinity)
            fail("notCloseTo", -Infinity, Infinity, Infinity)
        })

        it("fails with NaNs", function () {
            fail("notCloseTo", NaN, 0, 0)
            fail("notCloseTo", NaN, 0, Infinity)
            fail("notCloseTo", NaN, Infinity, 0)
            fail("notCloseTo", NaN, Infinity, Infinity)
            fail("notCloseTo", NaN, -Infinity, 0)
            fail("notCloseTo", NaN, -Infinity, Infinity)
            fail("notCloseTo", 0, NaN, 0)
            fail("notCloseTo", 0, NaN, Infinity)
            fail("notCloseTo", Infinity, NaN, 0)
            fail("notCloseTo", Infinity, NaN, Infinity)
            fail("notCloseTo", -Infinity, NaN, 0)
            fail("notCloseTo", -Infinity, NaN, Infinity)
        })
    })
})
