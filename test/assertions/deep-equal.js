"use strict"

var t = require("../../index.js")
var util = require("../../lib/util.js")

suite("assertions (deep equal)", function () {
    test("equal", function () {
        t.looseDeepEqual(
            {a: [2, 3], b: [4]},
            {a: [2, 3], b: [4]}
        )
    })

    test("not equal", function () {
        t.notLooseDeepEqual(
            {x: 5, y: [6]},
            {x: 5, y: 6}
        )
    })

    test("nested nulls", function () {
        t.looseDeepEqual(
            [null, null, null],
            [null, null, null]
        )
    })

    test("strict equal", function () {
        t.notDeepEqual(
            [{a: 3}, {b: 4}],
            [{a: "3"}, {b: "4"}]
        )
    })

    test("non-objects", function () {
        t.looseDeepEqual(3, 3)
        t.looseDeepEqual("beep", "beep")
        t.looseDeepEqual("3", 3)
        t.notDeepEqual("3", 3)
        t.notLooseDeepEqual("3", [3])
    })

    test("arguments class", function () {
        t.looseDeepEqual(
            (function (){ return arguments })(1, 2, 3),
            (function (){ return arguments })(1, 2, 3)
        )

        t.notLooseDeepEqual(
            (function (){ return arguments })(1, 2, 3),
            [1, 2, 3]
        )
    })

    test("dates", function () {
        var d0 = new Date(1387585278000)
        var d1 = new Date("Fri Dec 20 2013 16:21:18 GMT-0800 (PST)")
        t.looseDeepEqual(d0, d1)
    })

    if (typeof Buffer === "function") {
        test("buffers", function () {
            t.looseDeepEqual(
                new Buffer("xyz"), // eslint-disable-line no-undef
                new Buffer("xyz") // eslint-disable-line no-undef
            )
        })
    }

    test("booleans and arrays", function () {
        t.notLooseDeepEqual(true, [])
    })

    test("null == undefined", function () {
        t.looseDeepEqual(null, undefined)
        t.looseDeepEqual(undefined, null)

        t.notDeepEqual(null, undefined)
        t.notDeepEqual(undefined, null)
    })

    test("prototypes", function () {
        function A() {}
        function B() {}

        t.looseDeepEqual(new A(), new A())
        t.looseDeepEqual(new A(), new B())

        t.true(util.deepEqual(new A(), new A()))
        t.notDeepEqual(new A(), new B())
    })

    test("one is object", function () {
        t.notLooseDeepEqual("foo", {bar: 1})
        t.notLooseDeepEqual({foo: 1}, "bar")

        t.notDeepEqual("foo", {bar: 1})
        t.notDeepEqual({foo: 1}, "bar")
    })

    test("both are strings", function () {
        t.looseDeepEqual("foo", "foo")
        t.notLooseDeepEqual("foo", "bar")

        t.true(util.deepEqual("foo", "foo"))
        t.notDeepEqual("foo", "bar")
    })

    if (typeof Symbol === "function") {
        test("both are symbols", function () {
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
