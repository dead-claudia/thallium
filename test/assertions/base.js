"use strict"

/* global Map, Symbol */

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
            if (typeof Symbol === "function") t.assert(Symbol())

            fail(undefined, "message")
            fail(null, "message")
            fail(false, "message")
            fail(0, "message")
            fail("", "message")
            fail(NaN, "message")
        })

        it("escapes the message", function () {
            Util.fail("assert", undefined, "{test}")
            Util.fail("assert", null, "{test}")
            Util.fail("assert", false, "{test}")
            Util.fail("assert", 0, "{test}")
            Util.fail("assert", "", "{test}")
            Util.fail("assert", NaN, "{test}")
        })
    })

    Util.basic("t.ok()", function () {
        t.ok(true)
        t.ok(1)
        t.ok(Infinity)
        t.ok("foo")
        t.ok({})
        t.ok([])
        t.ok(new Date())
        if (typeof Symbol === "function") t.ok(Symbol())

        Util.fail("ok")
        Util.fail("ok", undefined)
        Util.fail("ok", null)
        Util.fail("ok", false)
        Util.fail("ok", 0)
        Util.fail("ok", "")
        Util.fail("ok", NaN)
    })

    Util.basic("t.notOk()", function () {
        Util.fail("notOk", true)
        Util.fail("notOk", 1)
        Util.fail("notOk", Infinity)
        Util.fail("notOk", "foo")
        Util.fail("notOk", {})
        Util.fail("notOk", [])
        Util.fail("notOk", new Date())
        if (typeof Symbol === "function") Util.fail("notOk", Symbol())

        t.notOk()
        t.notOk(undefined)
        t.notOk(null)
        t.notOk(false)
        t.notOk(0)
        t.notOk("")
        t.notOk(NaN)
    })

    Util.basic("t.equal()", function () {
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

        Util.fail("equal", {}, {})
        Util.fail("equal", null, undefined)
        Util.fail("equal", 0, 1)
        Util.fail("equal", 1, "1")
    })

    Util.basic("t.notEqual()", function () {
        Util.fail("notEqual", 0, 0)
        Util.fail("notEqual", 1, 1)
        Util.fail("notEqual", null, null)
        Util.fail("notEqual", undefined, undefined)
        Util.fail("notEqual", Infinity, Infinity)
        Util.fail("notEqual", NaN, NaN)
        Util.fail("notEqual", "", "")
        Util.fail("notEqual", "foo", "foo")

        var obj = {}

        Util.fail("notEqual", obj, obj)

        t.notEqual({}, {})
        t.notEqual(null, undefined)
        t.notEqual(0, 1)
        t.notEqual(1, "1")
    })

    Util.basic("t.equalLoose()", function () {
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

        Util.fail("equalLoose", {}, {})
        Util.fail("equalLoose", 0, 1)
    })

    Util.basic("t.notEqualLoose()", function () {
        Util.fail("notEqualLoose", 0, 0)
        Util.fail("notEqualLoose", 1, 1)
        Util.fail("notEqualLoose", null, null)
        Util.fail("notEqualLoose", undefined, undefined)
        Util.fail("notEqualLoose", Infinity, Infinity)
        Util.fail("notEqualLoose", NaN, NaN)
        Util.fail("notEqualLoose", "", "")
        Util.fail("notEqualLoose", "foo", "foo")
        Util.fail("notEqualLoose", null, undefined)
        Util.fail("notEqualLoose", 1, "1")

        var obj = {}

        Util.fail("notEqualLoose", obj, obj)

        t.notEqualLoose({}, {})
        t.notEqualLoose(0, 1)
    })

    Util.basic("t.deepEqual()", function () {
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
        Util.fail("deepEqual", null, undefined)
        Util.fail("deepEqual", 0, 1)
        Util.fail("deepEqual", 1, "1")

        t.deepEqual(
            {a: [2, 3], b: [4]},
            {a: [2, 3], b: [4]})
    })

    Util.basic("t.notDeepEqual()", function () {
        Util.fail("notDeepEqual", 0, 0)
        Util.fail("notDeepEqual", 1, 1)
        Util.fail("notDeepEqual", null, null)
        Util.fail("notDeepEqual", undefined, undefined)
        Util.fail("notDeepEqual", Infinity, Infinity)
        Util.fail("notDeepEqual", NaN, NaN)
        Util.fail("notDeepEqual", "", "")
        Util.fail("notDeepEqual", "foo", "foo")

        var obj = {}

        Util.fail("notDeepEqual", obj, obj)

        Util.fail("notDeepEqual", {}, {})
        t.notDeepEqual(null, undefined)
        t.notDeepEqual(0, 1)
        t.notDeepEqual(1, "1")

        Util.fail("notDeepEqual",
            {a: [2, 3], b: [4]},
            {a: [2, 3], b: [4]})
    })

    function F() { this.value = 1 }
    Util.methods(F, {
        get prop() { return 1 },
    })

    Util.basic("t.hasOwn()", function () {
        t.hasOwn({prop: 1}, "prop")
        t.hasOwn({prop: 1}, "prop", 1)
        t.hasOwn(new F(), "value", 1)

        Util.fail("hasOwn", {prop: 1}, "toString")
        Util.fail("hasOwn", {prop: 1}, "value")
        Util.fail("hasOwn", {prop: 1}, "prop", 2)
        Util.fail("hasOwn", {prop: 1}, "prop", "1")
        Util.fail("hasOwn", new F(), "prop")
        Util.fail("hasOwn", new F(), "prop", 1)
        Util.fail("hasOwn", new F(), "value", 2)
    })

    Util.basic("t.notHasOwn()", function () {
        Util.fail("notHasOwn", {prop: 1}, "prop")
        Util.fail("notHasOwn", {prop: 1}, "prop", 1)
        Util.fail("notHasOwn", new F(), "value", 1)

        t.notHasOwn({prop: 1}, "toString")
        t.notHasOwn({prop: 1}, "value")
        t.notHasOwn({prop: 1}, "prop", 2)
        t.notHasOwn({prop: 1}, "prop", "1")
        t.notHasOwn(new F(), "prop")
        t.notHasOwn(new F(), "prop", 1)
        t.notHasOwn(new F(), "value", 2)
    })

    Util.basic("t.hasOwnLoose()", function () {
        t.hasOwnLoose({prop: 1}, "prop", 1)
        t.hasOwnLoose(new F(), "value", 1)
        t.hasOwnLoose({prop: 1}, "prop", "1")

        Util.fail("hasOwnLoose", {prop: 1}, "prop", 2)
        Util.fail("hasOwnLoose", new F(), "prop", 1)
        Util.fail("hasOwnLoose", new F(), "value", 2)
    })

    Util.basic("t.notHasOwnLoose()", function () {
        Util.fail("notHasOwnLoose", {prop: 1}, "prop", 1)
        Util.fail("notHasOwnLoose", new F(), "value", 1)
        Util.fail("notHasOwnLoose", {prop: 1}, "prop", "1")

        t.notHasOwnLoose({prop: 1}, "prop", 2)
        t.notHasOwnLoose(new F(), "prop", 1)
        t.notHasOwnLoose(new F(), "value", 2)
    })

    Util.basic("t.hasKey()", function () {
        t.hasKey({prop: 1}, "prop")
        t.hasKey({prop: 1}, "prop", 1)
        t.hasKey(new F(), "value", 1)
        t.hasKey({prop: 1}, "toString")
        t.hasKey(new F(), "prop")
        t.hasKey(new F(), "prop", 1)

        Util.fail("hasKey", {prop: 1}, "value")
        Util.fail("hasKey", {prop: 1}, "prop", 2)
        Util.fail("hasKey", {prop: 1}, "prop", "1")
        Util.fail("hasKey", new F(), "value", 2)
    })

    Util.basic("t.notHasKey()", function () {
        Util.fail("notHasKey", {prop: 1}, "prop")
        Util.fail("notHasKey", {prop: 1}, "prop", 1)
        Util.fail("notHasKey", new F(), "value", 1)
        Util.fail("notHasKey", {prop: 1}, "toString")
        Util.fail("notHasKey", new F(), "prop")
        Util.fail("notHasKey", new F(), "prop", 1)

        t.notHasKey({prop: 1}, "value")
        t.notHasKey({prop: 1}, "prop", 2)
        t.notHasKey({prop: 1}, "prop", "1")
        t.notHasKey(new F(), "value", 2)
    })

    Util.basic("t.hasKeyLoose()", function () {
        t.hasKeyLoose({prop: 1}, "prop", 1)
        t.hasKeyLoose(new F(), "value", 1)
        t.hasKeyLoose(new F(), "prop", 1)
        t.hasKeyLoose({prop: 1}, "prop", "1")

        Util.fail("hasKeyLoose", {prop: 1}, "prop", 2)
        Util.fail("hasKeyLoose", new F(), "value", 2)
    })

    Util.basic("t.notHasKeyLoose()", function () {
        Util.fail("notHasKeyLoose", {prop: 1}, "prop", 1)
        Util.fail("notHasKeyLoose", new F(), "value", 1)
        Util.fail("notHasKeyLoose", new F(), "prop", 1)
        Util.fail("notHasKeyLoose", {prop: 1}, "prop", "1")

        t.notHasKeyLoose({prop: 1}, "prop", 2)
        t.notHasKeyLoose(new F(), "value", 2)
    })

    if (typeof Map !== "undefined") {
        Util.basic("t.has()", function () {
            t.has(new Map([["prop", 1]]), "prop")
            t.has(new Map([["prop", 1]]), "prop", 1)

            Util.fail("has", new Map([["prop", 1]]), "value")
            Util.fail("has", new Map([["prop", 1]]), "prop", 2)
            Util.fail("has", new Map([["prop", 1]]), "prop", "1")
        })

        Util.basic("t.notHas()", function () {
            Util.fail("notHas", new Map([["prop", 1]]), "prop")
            Util.fail("notHas", new Map([["prop", 1]]), "prop", 1)

            t.notHas(new Map([["prop", 1]]), "value")
            t.notHas(new Map([["prop", 1]]), "prop", 2)
            t.notHas(new Map([["prop", 1]]), "prop", "1")
        })

        Util.basic("t.hasLoose()", function () {
            t.hasLoose(new Map([["prop", 1]]), "prop", 1)
            t.hasLoose(new Map([["prop", 1]]), "prop", "1")

            Util.fail("hasLoose", new Map([["prop", 1]]), "prop", 2)
        })

        Util.basic("t.notHasLoose()", function () {
            Util.fail("notHasLoose", new Map([["prop", 1]]), "prop", 1)
            Util.fail("notHasLoose", new Map([["prop", 1]]), "prop", "1")

            t.notHasLoose(new Map([["prop", 1]]), "prop", 2)
        })
    }
})
