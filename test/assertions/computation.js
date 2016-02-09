"use strict"

var t = require("../../index.js")
var util = require("../../test-util/assertions.js")
var fail = util.fail
var basic = util.basic

suite("assertions (computation)", function () {
    basic("t.throws()", function () {
        t.throws(function () { throw new Error("fail") })
        t.throws(function () { throw new TypeError("fail") }, TypeError)
        t.throws(function () { throw new TypeError("fail") }, Error)

        fail("throws", function () { throw new Error("fail") }, TypeError)
        fail("throws", function () {}, Error)
        fail("throws", function () {})
    })

    basic("t.notThrows()", function () {
        fail("notThrows", function () {
            throw new Error("fail")
        })

        fail("notThrows", function () {
            throw new TypeError("fail")
        }, TypeError)

        fail("notThrows", function () {
            throw new TypeError("fail")
        }, Error)

        t.notThrows(function () { throw new Error("fail") }, TypeError)
        t.notThrows(function () {}, Error)
        t.notThrows(function () {})
    })

    basic("t.throwsMatch()", function () {
        var sentinel = new Error("sentinel")

        function test() { throw sentinel }
        function not(x) { return x !== sentinel }

        t.throwsMatch(test, function (e) { return e === sentinel })
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
        function not(x) { return x !== sentinel }

        fail("notThrowsMatch", test, function (e) { return e === sentinel })
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

    suite("t.closeTo()", function () {
        test("works", function () {
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

        test("works with Infinities", function () {
            t.closeTo(0, 0, Infinity)
            t.closeTo(100, 0, Infinity)
            t.closeTo(Infinity, -Infinity, Infinity)

            t.closeTo(0, 0, -Infinity)
            t.closeTo(100, 0, -Infinity)
            t.closeTo(Infinity, -Infinity, -Infinity)
        })

        test("fails with NaNs", function () {
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

    suite("t.notCloseTo()", function () {
        test("works", function () {
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

        test("works with Infinities", function () {
            fail("notCloseTo", 0, 0, Infinity)
            fail("notCloseTo", 100, 0, Infinity)
            fail("notCloseTo", Infinity, -Infinity, Infinity)

            fail("notCloseTo", 0, 0, -Infinity)
            fail("notCloseTo", 100, 0, -Infinity)
            fail("notCloseTo", Infinity, -Infinity, -Infinity)
        })

        test("fails with NaNs", function () {
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
