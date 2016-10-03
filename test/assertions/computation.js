"use strict"

describe("assertions (computation)", function () {
    var fail = Util.fail1
    var basic = Util.basic

    describe("throws()", function () {
        it("works", function () {
            assert.throws(function () { throw new Error("fail") })
            assert.throws(function () { throw new TypeError("fail") }, TypeError) // eslint-disable-line max-len
            assert.throws(function () { throw new TypeError("fail") }, Error)
            fail("throws", function () {}, Error)
            fail("throws", function () {})
        })

        it("doesn't rethrow non-matching errors", function () {
            fail("throws", function () { throw new Error("fail") }, TypeError)
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

            fail("throws", function () { throw undefined }, Error)
            fail("throws", function () { throw null }, Error)
            fail("throws", function () { throw 1 }, Error)
            fail("throws", function () { throw "why" }, Error)
            fail("throws", function () { throw true }, Error)
            fail("throws", function () { throw [] }, Error)
            fail("throws", function () { throw {} }, Error)

            /* eslint-disable no-undef */

            if (typeof Symbol === "function") {
                assert.throws(function () { throw Symbol() })
                fail("throws", function () { throw Symbol() }, Error)
            }

            /* eslint-enable no-undef, no-throw-literal */
        })
    })

    describe("notThrows()", function () {
        /* eslint-disable max-len */

        it("works", function () {
            fail("notThrows", function () { throw new TypeError("fail") }, TypeError)
            fail("notThrows", function () { throw new TypeError("fail") }, Error)
            assert.notThrows(function () { throw new Error("fail") }, TypeError)
            assert.notThrows(function () {}, Error)
        })

        it("doesn't rethrow non-errors", function () {
            /* eslint-disable no-throw-literal */

            assert.notThrows(function () { throw undefined }, Error)
            assert.notThrows(function () { throw null }, Error)
            assert.notThrows(function () { throw 1 }, Error)
            assert.notThrows(function () { throw "why" }, Error)
            assert.notThrows(function () { throw true }, Error)
            assert.notThrows(function () { throw [] }, Error)
            assert.notThrows(function () { throw {} }, Error)

            /* eslint-disable no-undef */

            if (typeof Symbol === "function") {
                assert.notThrows(function () { throw Symbol() }, Error)
            }

            /* eslint-enable no-undef, no-throw-literal */
        })

        /* eslint-enable max-len */
    })

    basic("throwsMatch()", function () {
        var sentinel = new Error("sentinel")

        function test() { throw sentinel }
        function is(e) { return e === sentinel }
        function not(e) { return e !== sentinel }

        assert.throwsMatch(test, is)
        assert.throwsMatch(test, "sentinel")
        assert.throwsMatch(test, /sent/)

        fail("throwsMatch", test, not)
        fail("throwsMatch", function () {}, not)
        fail("throwsMatch", test, "nope")
        fail("throwsMatch", test, /hi/)
    })

    basic("notThrowsMatch()", function () {
        var sentinel = new Error("sentinel")

        function test() { throw sentinel }
        function is(e) { return e === sentinel }
        function not(e) { return e !== sentinel }

        fail("notThrowsMatch", test, is)
        fail("notThrowsMatch", test, "sentinel")
        fail("notThrowsMatch", test, /sent/)

        assert.notThrowsMatch(test, not)
        assert.notThrowsMatch(function () {}, not)
        assert.notThrowsMatch(test, "nope")
        assert.notThrowsMatch(test, /hi/)
    })

    basic("length()", function () {
        assert.length([], 0)
        assert.length([1, 2, 3, 4, 5], 5)
        assert.length(new Array(5), 5)
        assert.length({length: 5}, 5)

        assert.throws(function () { t.length({}) }, TypeError)
        fail("length", {}, 0)
        fail("length", [], 1)
        fail("length", [], Infinity)
        fail("length", [], -Infinity)
        fail("length", [], NaN)
        fail("length", [], -1)

        assert.throws(function () { t.length(null, -1) }, TypeError)
        assert.throws(function () { t.length(undefined, -1) }, TypeError)
    })

    basic("notLength()", function () {
        fail("notLength", [], 0)
        fail("notLength", [1, 2, 3, 4, 5], 5)
        fail("notLength", new Array(5), 5)
        fail("notLength", {length: 5}, 5)

        assert.throws(function () { t.notLength({}) }, TypeError)
        fail("notLength", {}, 0)

        assert.notLength([], 1)
        assert.notLength([], Infinity)
        assert.notLength([], -Infinity)
        fail("notLength", [], NaN)
        assert.notLength([], -1)

        assert.throws(function () { t.notLength(null, -1) }, TypeError)
        assert.throws(function () { t.notLength(undefined, -1) }, TypeError)
    })

    describe("lengthAtLeast()", function () {
        it("works", function () {
            assert.lengthAtLeast([], 0)
            assert.lengthAtLeast([1], 0)
            assert.lengthAtLeast([1], 1)
            assert.lengthAtLeast([1, 2, 3], 1)
            assert.lengthAtLeast([], -1)

            fail("lengthAtLeast", [], 1)
            fail("lengthAtLeast", [1], 3)
            fail("lengthAtLeast", [1, 2, 3], 10)

            assert.lengthAtLeast({length: 0}, 0)
            assert.lengthAtLeast({length: 1}, 0)
            assert.lengthAtLeast({length: 1}, 1)
            assert.lengthAtLeast({length: 3}, 1)
            assert.lengthAtLeast({length: 0}, -1)

            fail("lengthAtLeast", {length: 0}, 1)
            fail("lengthAtLeast", {length: 1}, 3)
            fail("lengthAtLeast", {length: 3}, 10)
        })

        it("works with Infinities", function () {
            assert.lengthAtLeast([], -Infinity)
            assert.lengthAtLeast({length: -Infinity}, -Infinity)
            assert.lengthAtLeast({length: Infinity}, -Infinity)
            fail("lengthAtLeast", [1], Infinity)
            assert.lengthAtLeast({length: Infinity}, Infinity)
        })

        it("fails with NaNs", function () {
            fail("lengthAtLeast", [], NaN)
            fail("lengthAtLeast", [1], NaN)
            fail("lengthAtLeast", {length: Infinity}, NaN)
            fail("lengthAtLeast", {length: -Infinity}, NaN)
            fail("lengthAtLeast", {length: NaN}, NaN)
            fail("lengthAtLeast", {length: NaN}, 0)
            fail("lengthAtLeast", {length: NaN}, 1)
            fail("lengthAtLeast", {length: NaN}, -Infinity)
            fail("lengthAtLeast", {length: NaN}, Infinity)
        })
    })

    describe("lengthAtMost()", function () {
        it("works", function () {
            assert.lengthAtMost([], 0)
            fail("lengthAtMost", [1], 0)
            assert.lengthAtMost([1], 1)
            fail("lengthAtMost", [1, 2, 3], 1)
            fail("lengthAtMost", [], -1)

            assert.lengthAtMost([], 1)
            assert.lengthAtMost([1], 3)
            assert.lengthAtMost([1, 2, 3], 10)

            assert.lengthAtMost({length: 0}, 0)
            fail("lengthAtMost", {length: 1}, 0)
            assert.lengthAtMost({length: 1}, 1)
            fail("lengthAtMost", {length: 3}, 1)
            fail("lengthAtMost", {length: 0}, -1)

            assert.lengthAtMost({length: 0}, 1)
            assert.lengthAtMost({length: 1}, 3)
            assert.lengthAtMost({length: 3}, 10)
        })

        it("works with Infinities", function () {
            fail("lengthAtMost", [], -Infinity)
            assert.lengthAtMost({length: -Infinity}, -Infinity)
            fail("lengthAtMost", {length: Infinity}, -Infinity)
            assert.lengthAtMost([1], Infinity)
            assert.lengthAtMost({length: Infinity}, Infinity)
        })

        it("fails with NaNs", function () {
            fail("lengthAtMost", [], NaN)
            fail("lengthAtMost", [1], NaN)
            fail("lengthAtMost", {length: Infinity}, NaN)
            fail("lengthAtMost", {length: -Infinity}, NaN)
            fail("lengthAtMost", {length: NaN}, NaN)
            fail("lengthAtMost", {length: NaN}, 0)
            fail("lengthAtMost", {length: NaN}, 1)
            fail("lengthAtMost", {length: NaN}, -Infinity)
            fail("lengthAtMost", {length: NaN}, Infinity)
        })
    })

    describe("lengthAbove()", function () {
        it("works", function () {
            fail("lengthAbove", [], 0)
            assert.lengthAbove([1], 0)
            fail("lengthAbove", [1], 1)
            assert.lengthAbove([1, 2, 3], 1)
            assert.lengthAbove([], -1)

            fail("lengthAbove", [], 1)
            fail("lengthAbove", [1], 3)
            fail("lengthAbove", [1, 2, 3], 10)

            fail("lengthAbove", {length: 0}, 0)
            assert.lengthAbove({length: 1}, 0)
            fail("lengthAbove", {length: 1}, 1)
            assert.lengthAbove({length: 3}, 1)
            assert.lengthAbove({length: 0}, -1)

            fail("lengthAbove", {length: 0}, 1)
            fail("lengthAbove", {length: 1}, 3)
            fail("lengthAbove", {length: 3}, 10)
        })

        it("works with Infinities", function () {
            assert.lengthAbove([], -Infinity)
            fail("lengthAbove", {length: -Infinity}, -Infinity)
            assert.lengthAbove({length: Infinity}, -Infinity)
            fail("lengthAbove", [1], Infinity)
            fail("lengthAbove", {length: Infinity}, Infinity)
        })

        it("fails with NaNs", function () {
            fail("lengthAbove", [], NaN)
            fail("lengthAbove", [1], NaN)
            fail("lengthAbove", {length: Infinity}, NaN)
            fail("lengthAbove", {length: -Infinity}, NaN)
            fail("lengthAbove", {length: NaN}, NaN)
            fail("lengthAbove", {length: NaN}, 0)
            fail("lengthAbove", {length: NaN}, 1)
            fail("lengthAbove", {length: NaN}, -Infinity)
            fail("lengthAbove", {length: NaN}, Infinity)
        })
    })

    describe("lengthBelow()", function () {
        it("works", function () {
            fail("lengthBelow", [], 0)
            fail("lengthBelow", [1], 0)
            fail("lengthBelow", [1], 1)
            fail("lengthBelow", [1, 2, 3], 1)
            fail("lengthBelow", [], -1)

            assert.lengthBelow([], 1)
            assert.lengthBelow([1], 3)
            assert.lengthBelow([1, 2, 3], 10)

            fail("lengthBelow", {length: 0}, 0)
            fail("lengthBelow", {length: 1}, 0)
            fail("lengthBelow", {length: 1}, 1)
            fail("lengthBelow", {length: 3}, 1)
            fail("lengthBelow", {length: 0}, -1)

            assert.lengthBelow({length: 0}, 1)
            assert.lengthBelow({length: 1}, 3)
            assert.lengthBelow({length: 3}, 10)
        })

        it("works with Infinities", function () {
            fail("lengthBelow", [], -Infinity)
            fail("lengthBelow", {length: -Infinity}, -Infinity)
            fail("lengthBelow", {length: Infinity}, -Infinity)
            assert.lengthBelow([1], Infinity)
            fail("lengthBelow", {length: Infinity}, Infinity)
        })

        it("fails with NaNs", function () {
            fail("lengthBelow", [], NaN)
            fail("lengthBelow", [1], NaN)
            fail("lengthBelow", {length: Infinity}, NaN)
            fail("lengthBelow", {length: -Infinity}, NaN)
            fail("lengthBelow", {length: NaN}, NaN)
            fail("lengthBelow", {length: NaN}, 0)
            fail("lengthBelow", {length: NaN}, 1)
            fail("lengthBelow", {length: NaN}, -Infinity)
            fail("lengthBelow", {length: NaN}, Infinity)
        })
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
            assert.closeTo(0, 0, -0)

            assert.closeTo(0.1, 0, 0.2)
            assert.closeTo(-0.1, 0, 0.2)

            assert.closeTo(0.5, 1, 1)
            assert.closeTo(-0.5, -1, 1)
            assert.closeTo(-0.5, 0, 1)
            assert.closeTo(0.5, 0, 1)

            fail("closeTo", 0.2, 0, 0.1)
            fail("closeTo", -0.2, 0, 0.1)

            fail("closeTo", 1, 0, 0.5)
            fail("closeTo", 1, -1, -0.5)
            fail("closeTo", 1, 0, -0.5)
            fail("closeTo", 1, 0, 0.5)
        })

        it("works with Infinities", function () {
            assert.closeTo(0, 0, Infinity)
            assert.closeTo(100, 0, Infinity)
            assert.closeTo(Infinity, -Infinity, Infinity)

            assert.closeTo(0, 0, -Infinity)
            assert.closeTo(100, 0, -Infinity)
            assert.closeTo(Infinity, -Infinity, -Infinity)
        })

        it("fails with NaNs", function () {
            fail("closeTo", NaN, 0, 0)
            fail("closeTo", NaN, 0, Infinity)
            fail("closeTo", NaN, Infinity, Infinity)
            fail("closeTo", NaN, Infinity, 0)

            fail("closeTo", NaN, 0, -Infinity)
            fail("closeTo", NaN, -Infinity, -Infinity)
            fail("closeTo", NaN, -Infinity, 0)

            fail("closeTo", NaN, Infinity, -Infinity)
            fail("closeTo", NaN, -Infinity, Infinity)

            fail("closeTo", 0, NaN, 0)
            fail("closeTo", 0, NaN, Infinity)
            fail("closeTo", Infinity, NaN, Infinity)
            fail("closeTo", Infinity, NaN, 0)

            fail("closeTo", 0, NaN, -Infinity)
            fail("closeTo", -Infinity, NaN, -Infinity)
            fail("closeTo", -Infinity, NaN, 0)

            fail("closeTo", Infinity, NaN, -Infinity)
            fail("closeTo", -Infinity, NaN, Infinity)
        })
    })

    describe("notCloseTo()", function () {
        it("works", function () {
            fail("notCloseTo", 0, 0, 0)
            fail("notCloseTo", 0, 0, -0)

            fail("notCloseTo", 0.1, 0, 0.2)
            fail("notCloseTo", -0.1, 0, 0.2)

            fail("notCloseTo", 0.5, 1, 1)
            fail("notCloseTo", -0.5, -1, 1)
            fail("notCloseTo", -0.5, 0, 1)
            fail("notCloseTo", 0.5, 0, 1)

            assert.notCloseTo(0.2, 0, 0.1)
            assert.notCloseTo(-0.2, 0, 0.1)

            assert.notCloseTo(1, 0, 0.5)
            assert.notCloseTo(1, -1, -0.5)
            assert.notCloseTo(1, 0, -0.5)
            assert.notCloseTo(1, 0, 0.5)
        })

        it("works with Infinities", function () {
            fail("notCloseTo", 0, 0, Infinity)
            fail("notCloseTo", 100, 0, Infinity)
            fail("notCloseTo", Infinity, -Infinity, Infinity)

            fail("notCloseTo", 0, 0, -Infinity)
            fail("notCloseTo", 100, 0, -Infinity)
            fail("notCloseTo", Infinity, -Infinity, -Infinity)
        })

        it("fails with NaNs", function () {
            fail("notCloseTo", NaN, 0, 0)
            fail("notCloseTo", NaN, 0, Infinity)
            fail("notCloseTo", NaN, Infinity, Infinity)
            fail("notCloseTo", NaN, Infinity, 0)

            fail("notCloseTo", NaN, 0, -Infinity)
            fail("notCloseTo", NaN, -Infinity, -Infinity)
            fail("notCloseTo", NaN, -Infinity, 0)

            fail("notCloseTo", NaN, Infinity, -Infinity)
            fail("notCloseTo", NaN, -Infinity, Infinity)

            fail("notCloseTo", 0, NaN, 0)
            fail("notCloseTo", 0, NaN, Infinity)
            fail("notCloseTo", Infinity, NaN, Infinity)
            fail("notCloseTo", Infinity, NaN, 0)

            fail("notCloseTo", 0, NaN, -Infinity)
            fail("notCloseTo", -Infinity, NaN, -Infinity)
            fail("notCloseTo", -Infinity, NaN, 0)

            fail("notCloseTo", Infinity, NaN, -Infinity)
            fail("notCloseTo", -Infinity, NaN, Infinity)
        })
    })
})
