"use strict"

/* global Map */

var t = require("../../index.js")
var methods = require("../../lib/common.js").methods
var Util = require("../../helpers/base.js")
var fail = Util.fail
var basic = Util.basic

describe("assertions (base)", function () { // eslint-disable-line max-len, max-statements
    describe("t.assert()", function () {
        it("works", function () {
            function fail(arg, message) {
                try {
                    t.assert(arg, message)
                    throw new Error("Expected assertion to throw")
                } catch (e) {
                    t.equal(e.message, message)
                }
            }

            t.assert(true)
            t.assert(1)
            t.assert(Infinity)
            t.assert("foo")
            t.assert({})
            t.assert([])
            t.assert(new Date())
            if (typeof Symbol === "function") t.assert(Symbol()) // eslint-disable-line no-undef, max-len

            fail(undefined, "message")
            fail(null, "message")
            fail(false, "message")
            fail(0, "message")
            fail("", "message")
            fail(NaN, "message")
        })

        it("escapes the message", function () {
            fail("assert", undefined, "{test}")
            fail("assert", null, "{test}")
            fail("assert", false, "{test}")
            fail("assert", 0, "{test}")
            fail("assert", "", "{test}")
            fail("assert", NaN, "{test}")
        })
    })

    basic("t.ok()", function () {
        t.ok(true)
        t.ok(1)
        t.ok(Infinity)
        t.ok("foo")
        t.ok({})
        t.ok([])
        t.ok(new Date())
        if (typeof Symbol === "function") t.ok(Symbol()) // eslint-disable-line no-undef, max-len

        fail("ok")
        fail("ok", undefined)
        fail("ok", null)
        fail("ok", false)
        fail("ok", 0)
        fail("ok", "")
        fail("ok", NaN)
    })

    basic("t.notOk()", function () {
        fail("notOk", true)
        fail("notOk", 1)
        fail("notOk", Infinity)
        fail("notOk", "foo")
        fail("notOk", {})
        fail("notOk", [])
        fail("notOk", new Date())
        if (typeof Symbol === "function") fail("notOk", Symbol()) // eslint-disable-line no-undef, max-len

        t.notOk()
        t.notOk(undefined)
        t.notOk(null)
        t.notOk(false)
        t.notOk(0)
        t.notOk("")
        t.notOk(NaN)
    })

    basic("t.equal()", function () {
        t.equal(0, 0)
        t.equal(1, 1)
        t.equal(null, null)
        t.equal(undefined, undefined)
        t.equal(Infinity, Infinity)
        t.equal(NaN, NaN)
        t.equal("", "")
        t.equal("foo", "foo")

        var obj = {}

        t.equal(obj, obj)

        fail("equal", {}, {})
        fail("equal", null, undefined)
        fail("equal", 0, 1)
        fail("equal", 1, "1")
    })

    basic("t.notEqual()", function () {
        fail("notEqual", 0, 0)
        fail("notEqual", 1, 1)
        fail("notEqual", null, null)
        fail("notEqual", undefined, undefined)
        fail("notEqual", Infinity, Infinity)
        fail("notEqual", NaN, NaN)
        fail("notEqual", "", "")
        fail("notEqual", "foo", "foo")

        var obj = {}

        fail("notEqual", obj, obj)

        t.notEqual({}, {})
        t.notEqual(null, undefined)
        t.notEqual(0, 1)
        t.notEqual(1, "1")
    })

    basic("t.equalLoose()", function () {
        t.equalLoose(0, 0)
        t.equalLoose(1, 1)
        t.equalLoose(null, null)
        t.equalLoose(undefined, undefined)
        t.equalLoose(Infinity, Infinity)
        t.equalLoose(NaN, NaN)
        t.equalLoose("", "")
        t.equalLoose("foo", "foo")
        t.equalLoose(null, undefined)
        t.equalLoose(1, "1")

        var obj = {}

        t.equalLoose(obj, obj)

        fail("equalLoose", {}, {})
        fail("equalLoose", 0, 1)
    })

    basic("t.notEqualLoose()", function () {
        fail("notEqualLoose", 0, 0)
        fail("notEqualLoose", 1, 1)
        fail("notEqualLoose", null, null)
        fail("notEqualLoose", undefined, undefined)
        fail("notEqualLoose", Infinity, Infinity)
        fail("notEqualLoose", NaN, NaN)
        fail("notEqualLoose", "", "")
        fail("notEqualLoose", "foo", "foo")
        fail("notEqualLoose", null, undefined)
        fail("notEqualLoose", 1, "1")

        var obj = {}

        fail("notEqualLoose", obj, obj)

        t.notEqualLoose({}, {})
        t.notEqualLoose(0, 1)
    })

    basic("t.deepEqual()", function () {
        t.deepEqual(0, 0)
        t.deepEqual(1, 1)
        t.deepEqual(null, null)
        t.deepEqual(undefined, undefined)
        t.deepEqual(Infinity, Infinity)
        t.deepEqual(NaN, NaN)
        t.deepEqual("", "")
        t.deepEqual("foo", "foo")

        var obj = {}

        t.deepEqual(obj, obj)

        t.deepEqual({}, {})
        fail("deepEqual", null, undefined)
        fail("deepEqual", 0, 1)
        fail("deepEqual", 1, "1")

        t.deepEqual(
            {a: [2, 3], b: [4]},
            {a: [2, 3], b: [4]})
    })

    basic("t.notDeepEqual()", function () {
        fail("notDeepEqual", 0, 0)
        fail("notDeepEqual", 1, 1)
        fail("notDeepEqual", null, null)
        fail("notDeepEqual", undefined, undefined)
        fail("notDeepEqual", Infinity, Infinity)
        fail("notDeepEqual", NaN, NaN)
        fail("notDeepEqual", "", "")
        fail("notDeepEqual", "foo", "foo")

        var obj = {}

        fail("notDeepEqual", obj, obj)

        fail("notDeepEqual", {}, {})
        t.notDeepEqual(null, undefined)
        t.notDeepEqual(0, 1)
        t.notDeepEqual(1, "1")

        fail("notDeepEqual",
            {a: [2, 3], b: [4]},
            {a: [2, 3], b: [4]})
    })

    basic("t.deepEqualLoose()", function () {
        t.deepEqualLoose(0, 0)
        t.deepEqualLoose(1, 1)
        t.deepEqualLoose(null, null)
        t.deepEqualLoose(undefined, undefined)
        t.deepEqualLoose(Infinity, Infinity)
        t.deepEqualLoose(NaN, NaN)
        t.deepEqualLoose("", "")
        t.deepEqualLoose("foo", "foo")

        var obj = {}

        t.deepEqualLoose(obj, obj)

        t.deepEqualLoose({}, {})
        t.deepEqualLoose(null, undefined)
        fail("deepEqualLoose", 0, 1)
        t.deepEqualLoose(1, "1")

        t.deepEqualLoose(
            {a: [2, 3], b: [4]},
            {a: [2, 3], b: [4]})
    })

    basic("t.notDeepEqualLoose()", function () {
        fail("notDeepEqualLoose", 0, 0)
        fail("notDeepEqualLoose", 1, 1)
        fail("notDeepEqualLoose", null, null)
        fail("notDeepEqualLoose", undefined, undefined)
        fail("notDeepEqualLoose", Infinity, Infinity)
        fail("notDeepEqualLoose", NaN, NaN)
        fail("notDeepEqualLoose", "", "")
        fail("notDeepEqualLoose", "foo", "foo")

        var obj = {}

        fail("notDeepEqualLoose", obj, obj)

        fail("notDeepEqualLoose", {}, {})
        fail("notDeepEqualLoose", null, undefined)
        t.notDeepEqualLoose(0, 1)
        fail("notDeepEqualLoose", 1, "1")

        fail("notDeepEqualLoose",
            {a: [2, 3], b: [4]},
            {a: [2, 3], b: [4]})
    })

    function F() { this.value = 1 }
    methods(F, {
        get prop() { return 1 },
    })

    basic("t.hasOwn()", function () {
        t.hasOwn({prop: 1}, "prop")
        t.hasOwn({prop: 1}, "prop", 1)
        t.hasOwn(new F(), "value", 1)

        fail("hasOwn", {prop: 1}, "toString")
        fail("hasOwn", {prop: 1}, "value")
        fail("hasOwn", {prop: 1}, "prop", 2)
        fail("hasOwn", {prop: 1}, "prop", "1")
        fail("hasOwn", new F(), "prop")
        fail("hasOwn", new F(), "prop", 1)
        fail("hasOwn", new F(), "value", 2)
    })

    basic("t.notHasOwn()", function () {
        fail("notHasOwn", {prop: 1}, "prop")
        fail("notHasOwn", {prop: 1}, "prop", 1)
        fail("notHasOwn", new F(), "value", 1)

        t.notHasOwn({prop: 1}, "toString")
        t.notHasOwn({prop: 1}, "value")
        t.notHasOwn({prop: 1}, "prop", 2)
        t.notHasOwn({prop: 1}, "prop", "1")
        t.notHasOwn(new F(), "prop")
        t.notHasOwn(new F(), "prop", 1)
        t.notHasOwn(new F(), "value", 2)
    })

    basic("t.hasOwnLoose()", function () {
        t.hasOwnLoose({prop: 1}, "prop", 1)
        t.hasOwnLoose(new F(), "value", 1)
        t.hasOwnLoose({prop: 1}, "prop", "1")

        fail("hasOwnLoose", {prop: 1}, "prop", 2)
        fail("hasOwnLoose", new F(), "prop", 1)
        fail("hasOwnLoose", new F(), "value", 2)
    })

    basic("t.notHasOwnLoose()", function () {
        fail("notHasOwnLoose", {prop: 1}, "prop", 1)
        fail("notHasOwnLoose", new F(), "value", 1)
        fail("notHasOwnLoose", {prop: 1}, "prop", "1")

        t.notHasOwnLoose({prop: 1}, "prop", 2)
        t.notHasOwnLoose(new F(), "prop", 1)
        t.notHasOwnLoose(new F(), "value", 2)
    })

    basic("t.hasKey()", function () {
        t.hasKey({prop: 1}, "prop")
        t.hasKey({prop: 1}, "prop", 1)
        t.hasKey(new F(), "value", 1)
        t.hasKey({prop: 1}, "toString")
        t.hasKey(new F(), "prop")
        t.hasKey(new F(), "prop", 1)

        fail("hasKey", {prop: 1}, "value")
        fail("hasKey", {prop: 1}, "prop", 2)
        fail("hasKey", {prop: 1}, "prop", "1")
        fail("hasKey", new F(), "value", 2)
    })

    basic("t.notHasKey()", function () {
        fail("notHasKey", {prop: 1}, "prop")
        fail("notHasKey", {prop: 1}, "prop", 1)
        fail("notHasKey", new F(), "value", 1)
        fail("notHasKey", {prop: 1}, "toString")
        fail("notHasKey", new F(), "prop")
        fail("notHasKey", new F(), "prop", 1)

        t.notHasKey({prop: 1}, "value")
        t.notHasKey({prop: 1}, "prop", 2)
        t.notHasKey({prop: 1}, "prop", "1")
        t.notHasKey(new F(), "value", 2)
    })

    basic("t.hasKeyLoose()", function () {
        t.hasKeyLoose({prop: 1}, "prop", 1)
        t.hasKeyLoose(new F(), "value", 1)
        t.hasKeyLoose(new F(), "prop", 1)
        t.hasKeyLoose({prop: 1}, "prop", "1")

        fail("hasKeyLoose", {prop: 1}, "prop", 2)
        fail("hasKeyLoose", new F(), "value", 2)
    })

    basic("t.notHasKeyLoose()", function () {
        fail("notHasKeyLoose", {prop: 1}, "prop", 1)
        fail("notHasKeyLoose", new F(), "value", 1)
        fail("notHasKeyLoose", new F(), "prop", 1)
        fail("notHasKeyLoose", {prop: 1}, "prop", "1")

        t.notHasKeyLoose({prop: 1}, "prop", 2)
        t.notHasKeyLoose(new F(), "value", 2)
    })

    if (typeof Map !== "undefined") {
        basic("t.has()", function () {
            t.has(new Map([["prop", 1]]), "prop")
            t.has(new Map([["prop", 1]]), "prop", 1)

            fail("has", new Map([["prop", 1]]), "value")
            fail("has", new Map([["prop", 1]]), "prop", 2)
            fail("has", new Map([["prop", 1]]), "prop", "1")
        })

        basic("t.notHas()", function () {
            fail("notHas", new Map([["prop", 1]]), "prop")
            fail("notHas", new Map([["prop", 1]]), "prop", 1)

            t.notHas(new Map([["prop", 1]]), "value")
            t.notHas(new Map([["prop", 1]]), "prop", 2)
            t.notHas(new Map([["prop", 1]]), "prop", "1")
        })

        basic("t.hasLoose()", function () {
            t.hasLoose(new Map([["prop", 1]]), "prop", 1)
            t.hasLoose(new Map([["prop", 1]]), "prop", "1")

            fail("hasLoose", new Map([["prop", 1]]), "prop", 2)
        })

        basic("t.notHasLoose()", function () {
            fail("notHasLoose", new Map([["prop", 1]]), "prop", 1)
            fail("notHasLoose", new Map([["prop", 1]]), "prop", "1")

            t.notHasLoose(new Map([["prop", 1]]), "prop", 2)
        })
    }
})
