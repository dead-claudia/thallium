import t from "../../src/index.js"
import global from "../../src/global.js"

const Symbol = typeof global.Symbol === "function" &&
        typeof global.Symbol() === "symbol"
    ? global.Symbol
    : undefined

suite("assertions (deep equal)", () => {
    test("equal", () => {
        t.looseDeepEqual(
            {a: [2, 3], b: [4]},
            {a: [2, 3], b: [4]}
        )
    })

    test("not equal", () => {
        t.notLooseDeepEqual(
            {x: 5, y: [6]},
            {x: 5, y: 6}
        )
    })

    test("nested nulls", () => {
        t.looseDeepEqual(
            [null, null, null],
            [null, null, null]
        )
    })

    test("strict equal", () => {
        t.notDeepEqual(
            [{a: 3}, {b: 4}],
            [{a: "3"}, {b: "4"}]
        )
    })

    test("non-objects", () => {
        t.looseDeepEqual(3, 3)
        t.looseDeepEqual("beep", "beep")
        t.looseDeepEqual("3", 3)
        t.notDeepEqual("3", 3)
        t.notLooseDeepEqual("3", [3])
    })

    /* eslint-disable prefer-rest-params */

    test("arguments class", () => {
        t.looseDeepEqual(
            (function () { return arguments })(1, 2, 3),
            (function () { return arguments })(1, 2, 3)
        )

        t.notLooseDeepEqual(
            (function () { return arguments })(1, 2, 3),
            [1, 2, 3]
        )
    })

    /* eslint-enable prefer-rest-params */

    test("dates", () => {
        t.looseDeepEqual(
            new Date(1387585278000),
            new Date("Fri Dec 20 2013 16:21:18 GMT-0800 (PST)")
        )
    })

    if (typeof global.Buffer === "function") {
        test("buffers", () => {
            t.looseDeepEqual(
                new global.Buffer("xyz"), // eslint-disable-line no-undef
                new global.Buffer("xyz") // eslint-disable-line no-undef
            )
        })
    }

    test("booleans and arrays", () => {
        t.notLooseDeepEqual(true, [])
    })

    test("null == undefined", () => {
        t.looseDeepEqual(null, undefined)
        t.looseDeepEqual(undefined, null)

        t.notDeepEqual(null, undefined)
        t.notDeepEqual(undefined, null)
    })

    test("prototypes", () => {
        function A() {}
        function B() {}

        t.looseDeepEqual(new A(), new A())
        t.looseDeepEqual(new A(), new B())

        t.looseDeepEqual(new A(), new A())
        t.notDeepEqual(new A(), new B())
    })

    test("one is object", () => {
        t.notLooseDeepEqual("foo", {bar: 1})
        t.notLooseDeepEqual({foo: 1}, "bar")

        t.notDeepEqual("foo", {bar: 1})
        t.notDeepEqual({foo: 1}, "bar")
    })

    test("both are strings", () => {
        t.looseDeepEqual("foo", "foo")
        t.notLooseDeepEqual("foo", "bar")

        t.deepEqual("foo", "foo")
        t.notDeepEqual("foo", "bar")
    })

    test("differing keys", () => {
        t.notDeepEqual({a: 1, b: 2}, {b: 1, c: 2})
        t.notLooseDeepEqual({a: 1, b: 2}, {b: 1, c: 2})
    })

    if (typeof Symbol === "function") {
        test("both are symbols", () => {
            t.looseDeepEqual(
                Symbol("foo"),
                Symbol("foo")
            )
            t.notLooseDeepEqual(
                Symbol("foo"),
                Symbol("bar")
            )

            t.notDeepEqual(
                Symbol("foo"),
                Symbol("foo")
            )
            t.notDeepEqual(
                Symbol("foo"),
                Symbol("bar")
            )
        })
    }
})
