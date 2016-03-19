import t from "../../src/index.js"
import {fail, basic} from "../../test-util/assertions.js"

suite("assertions (computation)", () => {
    basic("t.throws()", () => {
        t.throws(() => { throw new Error("fail") })
        t.throws(() => { throw new TypeError("fail") }, TypeError)
        t.throws(() => { throw new TypeError("fail") }, Error)

        fail("throws", () => { throw new Error("fail") }, TypeError)
        fail("throws", () => {}, Error)
        fail("throws", () => {})
    })

    basic("t.notThrows()", () => {
        fail("notThrows", () => { throw new Error("fail") })
        fail("notThrows", () => { throw new TypeError("fail") }, TypeError)
        fail("notThrows", () => { throw new TypeError("fail") }, Error)

        t.notThrows(() => { throw new Error("fail") }, TypeError)
        t.notThrows(() => {}, Error)
        t.notThrows(() => {})
    })

    basic("t.throwsMatch()", () => {
        const sentinel = new Error("sentinel")

        function test() { throw sentinel }
        function not(x) { return x !== sentinel }

        t.throwsMatch(test, e => e === sentinel)
        t.throwsMatch(test, "sentinel")
        t.throwsMatch(test, /sent/)

        fail("throwsMatch", test, not)
        fail("throwsMatch", () => {}, not)
        fail("throwsMatch", test, "nope")
        fail("throwsMatch", test, /hi/)
    })

    basic("t.notThrowsMatch()", () => {
        const sentinel = new Error("sentinel")

        function test() { throw sentinel }
        function not(x) { return x !== sentinel }

        fail("notThrowsMatch", test, e => e === sentinel)
        fail("notThrowsMatch", test, "sentinel")
        fail("notThrowsMatch", test, /sent/)

        t.notThrowsMatch(test, not)
        t.notThrowsMatch(() => {}, not)
        t.notThrowsMatch(test, "nope")
        t.notThrowsMatch(test, /hi/)
    })

    basic("t.length()", () => {
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

        t.throws(() => t.length(null, -1), TypeError)
        t.throws(() => t.length(undefined, -1), TypeError)
    })

    basic("t.notLength()", () => {
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

        t.throws(() => t.notLength(null, -1), TypeError)
        t.throws(() => t.notLength(undefined, -1), TypeError)
    })

    suite("t.lengthAtLeast()", () => {
        test("works", () => {
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

        test("works with Infinities", () => {
            t.lengthAtLeast([], -Infinity)
            t.lengthAtLeast({length: -Infinity}, -Infinity)
            t.lengthAtLeast({length: Infinity}, -Infinity)
            fail("lengthAtLeast", [1], Infinity)
            t.lengthAtLeast({length: Infinity}, Infinity)
        })

        test("fails with NaNs", () => {
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

    suite("t.lengthAtMost()", () => {
        test("works", () => {
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

        test("works with Infinities", () => {
            fail("lengthAtMost", [], -Infinity)
            t.lengthAtMost({length: -Infinity}, -Infinity)
            fail("lengthAtMost", {length: Infinity}, -Infinity)
            t.lengthAtMost([1], Infinity)
            t.lengthAtMost({length: Infinity}, Infinity)
        })

        test("fails with NaNs", () => {
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

    suite("t.lengthAbove()", () => {
        test("works", () => {
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

        test("works with Infinities", () => {
            t.lengthAbove([], -Infinity)
            fail("lengthAbove", {length: -Infinity}, -Infinity)
            t.lengthAbove({length: Infinity}, -Infinity)
            fail("lengthAbove", [1], Infinity)
            fail("lengthAbove", {length: Infinity}, Infinity)
        })

        test("fails with NaNs", () => {
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

    suite("t.lengthBelow()", () => {
        test("works", () => {
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

        test("works with Infinities", () => {
            fail("lengthBelow", [], -Infinity)
            fail("lengthBelow", {length: -Infinity}, -Infinity)
            fail("lengthBelow", {length: Infinity}, -Infinity)
            t.lengthBelow([1], Infinity)
            fail("lengthBelow", {length: Infinity}, Infinity)
        })

        test("fails with NaNs", () => {
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

    suite("t.closeTo()", () => {
        test("works", () => {
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

        test("works with Infinities", () => {
            t.closeTo(0, 0, Infinity)
            t.closeTo(100, 0, Infinity)
            t.closeTo(Infinity, -Infinity, Infinity)

            t.closeTo(0, 0, -Infinity)
            t.closeTo(100, 0, -Infinity)
            t.closeTo(Infinity, -Infinity, -Infinity)
        })

        test("fails with NaNs", () => {
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

    suite("t.notCloseTo()", () => {
        test("works", () => {
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

        test("works with Infinities", () => {
            fail("notCloseTo", 0, 0, Infinity)
            fail("notCloseTo", 100, 0, Infinity)
            fail("notCloseTo", Infinity, -Infinity, Infinity)

            fail("notCloseTo", 0, 0, -Infinity)
            fail("notCloseTo", 100, 0, -Infinity)
            fail("notCloseTo", Infinity, -Infinity, -Infinity)
        })

        test("fails with NaNs", () => {
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
