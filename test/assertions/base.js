"use strict"

const t = require("../../index.js")
const Util = require("../../test-util/assertions.js")
const fail = Util.fail
const basic = Util.basic

describe("assertions (base)", () => {
    describe("t.assert()", () => {
        it("works", () => {
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
            t.assert(Symbol())

            fail(undefined, "message")
            fail(null, "message")
            fail(false, "message")
            fail(0, "message")
            fail("", "message")
            fail(NaN, "message")
        })

        it("escapes the message", () => {
            fail("assert", undefined, "{test}")
            fail("assert", null, "{test}")
            fail("assert", false, "{test}")
            fail("assert", 0, "{test}")
            fail("assert", "", "{test}")
            fail("assert", NaN, "{test}")
        })
    })

    basic("t.ok()", () => {
        t.ok(true)
        t.ok(1)
        t.ok(Infinity)
        t.ok("foo")
        t.ok({})
        t.ok([])
        t.ok(new Date())
        t.ok(Symbol())

        fail("ok")
        fail("ok", undefined)
        fail("ok", null)
        fail("ok", false)
        fail("ok", 0)
        fail("ok", "")
        fail("ok", NaN)
    })

    basic("t.notOk()", () => {
        fail("notOk", true)
        fail("notOk", 1)
        fail("notOk", Infinity)
        fail("notOk", "foo")
        fail("notOk", {})
        fail("notOk", [])
        fail("notOk", new Date())
        fail("notOk", Symbol())

        t.notOk()
        t.notOk(undefined)
        t.notOk(null)
        t.notOk(false)
        t.notOk(0)
        t.notOk("")
        t.notOk(NaN)
    })

    basic("t.equal()", () => {
        t.equal(0, 0)
        t.equal(1, 1)
        t.equal(null, null)
        t.equal(undefined, undefined)
        t.equal(Infinity, Infinity)
        t.equal(NaN, NaN)
        t.equal("", "")
        t.equal("foo", "foo")

        const obj = {}

        t.equal(obj, obj)

        fail("equal", {}, {})
        fail("equal", null, undefined)
        fail("equal", 0, 1)
        fail("equal", 1, "1")
    })

    basic("t.notEqual()", () => {
        fail("notEqual", 0, 0)
        fail("notEqual", 1, 1)
        fail("notEqual", null, null)
        fail("notEqual", undefined, undefined)
        fail("notEqual", Infinity, Infinity)
        fail("notEqual", NaN, NaN)
        fail("notEqual", "", "")
        fail("notEqual", "foo", "foo")

        const obj = {}

        fail("notEqual", obj, obj)

        t.notEqual({}, {})
        t.notEqual(null, undefined)
        t.notEqual(0, 1)
        t.notEqual(1, "1")
    })

    basic("t.equalLoose()", () => {
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

        const obj = {}

        t.equalLoose(obj, obj)

        fail("equalLoose", {}, {})
        fail("equalLoose", 0, 1)
    })

    basic("t.notEqualLoose()", () => {
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

        const obj = {}

        fail("notEqualLoose", obj, obj)

        t.notEqualLoose({}, {})
        t.notEqualLoose(0, 1)
    })

    basic("t.deepEqual()", () => {
        t.deepEqual(0, 0)
        t.deepEqual(1, 1)
        t.deepEqual(null, null)
        t.deepEqual(undefined, undefined)
        t.deepEqual(Infinity, Infinity)
        t.deepEqual(NaN, NaN)
        t.deepEqual("", "")
        t.deepEqual("foo", "foo")

        const obj = {}

        t.deepEqual(obj, obj)

        t.deepEqual({}, {})
        fail("deepEqual", null, undefined)
        fail("deepEqual", 0, 1)
        fail("deepEqual", 1, "1")

        t.deepEqual(
            {a: [2, 3], b: [4]},
            {a: [2, 3], b: [4]})
    })

    basic("t.notDeepEqual()", () => {
        fail("notDeepEqual", 0, 0)
        fail("notDeepEqual", 1, 1)
        fail("notDeepEqual", null, null)
        fail("notDeepEqual", undefined, undefined)
        fail("notDeepEqual", Infinity, Infinity)
        fail("notDeepEqual", NaN, NaN)
        fail("notDeepEqual", "", "")
        fail("notDeepEqual", "foo", "foo")

        const obj = {}

        fail("notDeepEqual", obj, obj)

        fail("notDeepEqual", {}, {})
        t.notDeepEqual(null, undefined)
        t.notDeepEqual(0, 1)
        t.notDeepEqual(1, "1")

        fail("notDeepEqual",
            {a: [2, 3], b: [4]},
            {a: [2, 3], b: [4]})
    })

    basic("t.deepEqualLoose()", () => {
        t.deepEqualLoose(0, 0)
        t.deepEqualLoose(1, 1)
        t.deepEqualLoose(null, null)
        t.deepEqualLoose(undefined, undefined)
        t.deepEqualLoose(Infinity, Infinity)
        t.deepEqualLoose(NaN, NaN)
        t.deepEqualLoose("", "")
        t.deepEqualLoose("foo", "foo")

        const obj = {}

        t.deepEqualLoose(obj, obj)

        t.deepEqualLoose({}, {})
        t.deepEqualLoose(null, undefined)
        fail("deepEqualLoose", 0, 1)
        t.deepEqualLoose(1, "1")

        t.deepEqualLoose(
            {a: [2, 3], b: [4]},
            {a: [2, 3], b: [4]})
    })

    basic("t.notDeepEqualLoose()", () => {
        fail("notDeepEqualLoose", 0, 0)
        fail("notDeepEqualLoose", 1, 1)
        fail("notDeepEqualLoose", null, null)
        fail("notDeepEqualLoose", undefined, undefined)
        fail("notDeepEqualLoose", Infinity, Infinity)
        fail("notDeepEqualLoose", NaN, NaN)
        fail("notDeepEqualLoose", "", "")
        fail("notDeepEqualLoose", "foo", "foo")

        const obj = {}

        fail("notDeepEqualLoose", obj, obj)

        fail("notDeepEqualLoose", {}, {})
        fail("notDeepEqualLoose", null, undefined)
        t.notDeepEqualLoose(0, 1)
        fail("notDeepEqualLoose", 1, "1")

        fail("notDeepEqualLoose",
            {a: [2, 3], b: [4]},
            {a: [2, 3], b: [4]})
    })

    class F {
        constructor() { this.value = 1 }
        get prop() { return 1 }
    }

    basic("t.hasOwn()", () => {
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

    basic("t.notHasOwn()", () => {
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

    basic("t.hasOwnLoose()", () => {
        t.hasOwnLoose({prop: 1}, "prop", 1)
        t.hasOwnLoose(new F(), "value", 1)
        t.hasOwnLoose({prop: 1}, "prop", "1")

        fail("hasOwnLoose", {prop: 1}, "prop", 2)
        fail("hasOwnLoose", new F(), "prop", 1)
        fail("hasOwnLoose", new F(), "value", 2)
    })

    basic("t.notHasOwnLoose()", () => {
        fail("notHasOwnLoose", {prop: 1}, "prop", 1)
        fail("notHasOwnLoose", new F(), "value", 1)
        fail("notHasOwnLoose", {prop: 1}, "prop", "1")

        t.notHasOwnLoose({prop: 1}, "prop", 2)
        t.notHasOwnLoose(new F(), "prop", 1)
        t.notHasOwnLoose(new F(), "value", 2)
    })

    basic("t.hasKey()", () => {
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

    basic("t.notHasKey()", () => {
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

    basic("t.hasKeyLoose()", () => {
        t.hasKeyLoose({prop: 1}, "prop", 1)
        t.hasKeyLoose(new F(), "value", 1)
        t.hasKeyLoose(new F(), "prop", 1)
        t.hasKeyLoose({prop: 1}, "prop", "1")

        fail("hasKeyLoose", {prop: 1}, "prop", 2)
        fail("hasKeyLoose", new F(), "value", 2)
    })

    basic("t.notHasKeyLoose()", () => {
        fail("notHasKeyLoose", {prop: 1}, "prop", 1)
        fail("notHasKeyLoose", new F(), "value", 1)
        fail("notHasKeyLoose", new F(), "prop", 1)
        fail("notHasKeyLoose", {prop: 1}, "prop", "1")

        t.notHasKeyLoose({prop: 1}, "prop", 2)
        t.notHasKeyLoose(new F(), "value", 2)
    })

    basic("t.has()", () => {
        t.has(new Map([["prop", 1]]), "prop")
        t.has(new Map([["prop", 1]]), "prop", 1)

        fail("has", new Map([["prop", 1]]), "value")
        fail("has", new Map([["prop", 1]]), "prop", 2)
        fail("has", new Map([["prop", 1]]), "prop", "1")
    })

    basic("t.notHas()", () => {
        fail("notHas", new Map([["prop", 1]]), "prop")
        fail("notHas", new Map([["prop", 1]]), "prop", 1)

        t.notHas(new Map([["prop", 1]]), "value")
        t.notHas(new Map([["prop", 1]]), "prop", 2)
        t.notHas(new Map([["prop", 1]]), "prop", "1")
    })

    basic("t.hasLoose()", () => {
        t.hasLoose(new Map([["prop", 1]]), "prop", 1)
        t.hasLoose(new Map([["prop", 1]]), "prop", "1")

        fail("hasLoose", new Map([["prop", 1]]), "prop", 2)
    })

    basic("t.notHasLoose()", () => {
        fail("notHasLoose", new Map([["prop", 1]]), "prop", 1)
        fail("notHasLoose", new Map([["prop", 1]]), "prop", "1")

        t.notHasLoose(new Map([["prop", 1]]), "prop", 2)
    })
})
