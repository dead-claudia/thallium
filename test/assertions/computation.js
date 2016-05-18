"use strict"

var t = require("../../index.js")
var Util = require("../../test-util/assertions.js")
var fail = Util.fail
var basic = Util.basic

describe("assertions (computation)", function () {
    basic("t.throws()", function () {
        t.throws(function () { throw new Error("fail") })
        t.throws(function () { throw new TypeError("fail") }, TypeError)
        t.throws(function () { throw new TypeError("fail") }, Error)

        var thrown = false

        try {
            t.throws(function () { throw new Error("fail") }, TypeError)
        } catch (e) {
            t.equal(Object.getPrototypeOf(e), Error.prototype)
            thrown = true
        }

        t.assert(thrown, "Expected an error to be thrown")
        fail("throws", function () {}, Error)
        fail("throws", function () {})
    })

    basic("t.notThrows()", function () {
        fail("notThrows", function () { throw new Error("fail") })

        fail("notThrows", function () {
            throw new TypeError("fail")
        }, TypeError)

        fail("notThrows", function () { throw new TypeError("fail") }, Error)
        t.notThrows(function () { throw new Error("fail") }, TypeError)
        t.notThrows(function () {}, Error)
        t.notThrows(function () {})
    })

    basic("t.throwsMatch()", function () {
        var sentinel = new Error("sentinel")

        function test() { throw sentinel }
        function is(e) { return e === sentinel }
        function not(e) { return e !== sentinel }

        t.throwsMatch(test, is)
        t.throwsMatch(test, "sentinel")
        t.throwsMatch(test, /sent/)

        fail("throwsMatch", test, not)
        fail("throwsMatch", function () {}, not)
        fail("throwsMatch", test, "nope")
        fail("throwsMatch", test, /hi/)
    })

    basic("t.notThrowsMatch()", function () {
        var sentinel = new Error("sentinel")

        function test() { throw sentinel }
        function is(e) { return e === sentinel }
        function not(e) { return e !== sentinel }

        fail("notThrowsMatch", test, is)
        fail("notThrowsMatch", test, "sentinel")
        fail("notThrowsMatch", test, /sent/)

        t.notThrowsMatch(test, not)
        t.notThrowsMatch(function () {}, not)
        t.notThrowsMatch(test, "nope")
        t.notThrowsMatch(test, /hi/)
    })

    basic("t.length()", function () {
        t.length([], 0)
        t.length([1, 2, 3, 4, 5], 5)
        t.length(new Array(5), 5)

        fail("length", {})
        fail("length", {}, 0)
        fail("length", [], 1)
        fail("length", [], Infinity)
        fail("length", [], -Infinity)
        fail("length", [], NaN)
        fail("length", [], -1)

        t.throws(function () { t.length(null, -1) }, TypeError)
        t.throws(function () { t.length(undefined, -1) }, TypeError)
    })

    basic("t.notLength()", function () {
        fail("notLength", [], 0)
        fail("notLength", [1, 2, 3, 4, 5], 5)
        fail("notLength", new Array(5), 5)

        fail("notLength", {})
        fail("notLength", {}, 0)

        t.notLength([], 1)
        t.notLength([], Infinity)
        t.notLength([], -Infinity)
        t.notLength([], NaN)
        t.notLength([], -1)

        t.throws(function () { t.notLength(null, -1) }, TypeError)
        t.throws(function () { t.notLength(undefined, -1) }, TypeError)
    })

    describe("t.lengthAtLeast()", function () {
        it("works", function () {
            t.lengthAtLeast([], 0)
            t.lengthAtLeast([1], 0)
            t.lengthAtLeast([1], 1)
            t.lengthAtLeast([1, 2, 3], 1)
            t.lengthAtLeast([], -1)

            fail("lengthAtLeast", [], 1)
            fail("lengthAtLeast", [1], 3)
            fail("lengthAtLeast", [1, 2, 3], 10)

            t.lengthAtLeast({length: 0}, 0)
            t.lengthAtLeast({length: 1}, 0)
            t.lengthAtLeast({length: 1}, 1)
            t.lengthAtLeast({length: 3}, 1)
            t.lengthAtLeast({length: 0}, -1)

            fail("lengthAtLeast", {length: 0}, 1)
            fail("lengthAtLeast", {length: 1}, 3)
            fail("lengthAtLeast", {length: 3}, 10)
        })

        it("works with Infinities", function () {
            t.lengthAtLeast([], -Infinity)
            t.lengthAtLeast({length: -Infinity}, -Infinity)
            t.lengthAtLeast({length: Infinity}, -Infinity)
            fail("lengthAtLeast", [1], Infinity)
            t.lengthAtLeast({length: Infinity}, Infinity)
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

    describe("t.lengthAtMost()", function () {
        it("works", function () {
            t.lengthAtMost([], 0)
            fail("lengthAtMost", [1], 0)
            t.lengthAtMost([1], 1)
            fail("lengthAtMost", [1, 2, 3], 1)
            fail("lengthAtMost", [], -1)

            t.lengthAtMost([], 1)
            t.lengthAtMost([1], 3)
            t.lengthAtMost([1, 2, 3], 10)

            t.lengthAtMost({length: 0}, 0)
            fail("lengthAtMost", {length: 1}, 0)
            t.lengthAtMost({length: 1}, 1)
            fail("lengthAtMost", {length: 3}, 1)
            fail("lengthAtMost", {length: 0}, -1)

            t.lengthAtMost({length: 0}, 1)
            t.lengthAtMost({length: 1}, 3)
            t.lengthAtMost({length: 3}, 10)
        })

        it("works with Infinities", function () {
            fail("lengthAtMost", [], -Infinity)
            t.lengthAtMost({length: -Infinity}, -Infinity)
            fail("lengthAtMost", {length: Infinity}, -Infinity)
            t.lengthAtMost([1], Infinity)
            t.lengthAtMost({length: Infinity}, Infinity)
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

    describe("t.lengthAbove()", function () {
        it("works", function () {
            fail("lengthAbove", [], 0)
            t.lengthAbove([1], 0)
            fail("lengthAbove", [1], 1)
            t.lengthAbove([1, 2, 3], 1)
            t.lengthAbove([], -1)

            fail("lengthAbove", [], 1)
            fail("lengthAbove", [1], 3)
            fail("lengthAbove", [1, 2, 3], 10)

            fail("lengthAbove", {length: 0}, 0)
            t.lengthAbove({length: 1}, 0)
            fail("lengthAbove", {length: 1}, 1)
            t.lengthAbove({length: 3}, 1)
            t.lengthAbove({length: 0}, -1)

            fail("lengthAbove", {length: 0}, 1)
            fail("lengthAbove", {length: 1}, 3)
            fail("lengthAbove", {length: 3}, 10)
        })

        it("works with Infinities", function () {
            t.lengthAbove([], -Infinity)
            fail("lengthAbove", {length: -Infinity}, -Infinity)
            t.lengthAbove({length: Infinity}, -Infinity)
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

    describe("t.lengthBelow()", function () {
        it("works", function () {
            fail("lengthBelow", [], 0)
            fail("lengthBelow", [1], 0)
            fail("lengthBelow", [1], 1)
            fail("lengthBelow", [1, 2, 3], 1)
            fail("lengthBelow", [], -1)

            t.lengthBelow([], 1)
            t.lengthBelow([1], 3)
            t.lengthBelow([1, 2, 3], 10)

            fail("lengthBelow", {length: 0}, 0)
            fail("lengthBelow", {length: 1}, 0)
            fail("lengthBelow", {length: 1}, 1)
            fail("lengthBelow", {length: 3}, 1)
            fail("lengthBelow", {length: 0}, -1)

            t.lengthBelow({length: 0}, 1)
            t.lengthBelow({length: 1}, 3)
            t.lengthBelow({length: 3}, 10)
        })

        it("works with Infinities", function () {
            fail("lengthBelow", [], -Infinity)
            fail("lengthBelow", {length: -Infinity}, -Infinity)
            fail("lengthBelow", {length: Infinity}, -Infinity)
            t.lengthBelow([1], Infinity)
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

    describe("t.atLeast()", function () {
        it("works", function () {
            t.atLeast(0, 0)
            t.atLeast(1, 1)
            t.atLeast(1, -1)
            t.atLeast(12398.4639, 1245.472398)

            fail("atLeast", 0, 1000)
            fail("atLeast", -1, 1)
            fail("atLeast", -1, 0)
        })

        it("works with Infinities", function () {
            t.atLeast(0, -Infinity)
            t.atLeast(-Infinity, -Infinity)
            t.atLeast(Infinity, -Infinity)
            t.atLeast(Infinity, 0)
            t.atLeast(Infinity, Infinity)

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

    describe("t.atMost()", function () {
        it("works", function () {
            t.atMost(0, 0)
            t.atMost(1, 1)
            fail("atMost", 1, -1)
            fail("atMost", 12398.4639, 1245.472398)

            t.atMost(0, 1000)
            t.atMost(-1, 1)
            t.atMost(-1, 0)
        })

        it("works with Infinities", function () {
            fail("atMost", 0, -Infinity)
            t.atMost(-Infinity, -Infinity)
            fail("atMost", Infinity, -Infinity)
            fail("atMost", Infinity, 0)
            t.atMost(Infinity, Infinity)

            t.atMost(-Infinity, Infinity)
            t.atMost(-Infinity, 0)
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

    describe("t.below()", function () {
        it("works", function () {
            fail("below", 0, 0)
            fail("below", 1, 1)
            fail("below", 1, -1)
            fail("below", 12398.4639, 1245.472398)

            t.below(0, 1000)
            t.below(-1, 1)
            t.below(-1, 0)
        })

        it("works with Infinities", function () {
            fail("below", 0, -Infinity)
            fail("below", -Infinity, -Infinity)
            fail("below", Infinity, -Infinity)
            fail("below", Infinity, 0)
            fail("below", Infinity, Infinity)

            t.below(-Infinity, Infinity)
            t.below(-Infinity, 0)
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

    describe("t.closeTo()", function () {
        it("works", function () {
            t.closeTo(0, 0, 0)
            t.closeTo(0, 0, -0)

            t.closeTo(0.1, 0, 0.2)
            t.closeTo(-0.1, 0, 0.2)

            t.closeTo(0.5, 1, 1)
            t.closeTo(-0.5, -1, 1)
            t.closeTo(-0.5, 0, 1)
            t.closeTo(0.5, 0, 1)

            fail("closeTo", 0.2, 0, 0.1)
            fail("closeTo", -0.2, 0, 0.1)

            fail("closeTo", 1, 0, 0.5)
            fail("closeTo", 1, -1, -0.5)
            fail("closeTo", 1, 0, -0.5)
            fail("closeTo", 1, 0, 0.5)
        })

        it("works with Infinities", function () {
            t.closeTo(0, 0, Infinity)
            t.closeTo(100, 0, Infinity)
            t.closeTo(Infinity, -Infinity, Infinity)

            t.closeTo(0, 0, -Infinity)
            t.closeTo(100, 0, -Infinity)
            t.closeTo(Infinity, -Infinity, -Infinity)
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

    describe("t.notCloseTo()", function () {
        it("works", function () {
            fail("notCloseTo", 0, 0, 0)
            fail("notCloseTo", 0, 0, -0)

            fail("notCloseTo", 0.1, 0, 0.2)
            fail("notCloseTo", -0.1, 0, 0.2)

            fail("notCloseTo", 0.5, 1, 1)
            fail("notCloseTo", -0.5, -1, 1)
            fail("notCloseTo", -0.5, 0, 1)
            fail("notCloseTo", 0.5, 0, 1)

            t.notCloseTo(0.2, 0, 0.1)
            t.notCloseTo(-0.2, 0, 0.1)

            t.notCloseTo(1, 0, 0.5)
            t.notCloseTo(1, -1, -0.5)
            t.notCloseTo(1, 0, -0.5)
            t.notCloseTo(1, 0, 0.5)
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
