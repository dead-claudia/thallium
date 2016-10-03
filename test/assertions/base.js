"use strict"

/* global Map, Symbol */

describe("assertions (base)", function () { // eslint-disable-line max-len, max-statements
    describe("assert()", function () {
        it("works", function () {
            function fail(arg, message) {
                try {
                    assert.assert(arg, message)
                    throw new Error("Expected assertion to throw")
                } catch (e) {
                    assert.equal(e.message, message)
                }
            }

            assert.assert(true)
            assert.assert(1)
            assert.assert(Infinity)
            assert.assert("foo")
            assert.assert({})
            assert.assert([])
            assert.assert(new Date())
            if (typeof Symbol === "function") t.assert(Symbol())

            fail(undefined, "message")
            fail(null, "message")
            fail(false, "message")
            fail(0, "message")
            fail("", "message")
            fail(NaN, "message")
        })

        it("escapes the message", function () {
            Util.fail1("assert", undefined, "{test}")
            Util.fail1("assert", null, "{test}")
            Util.fail1("assert", false, "{test}")
            Util.fail1("assert", 0, "{test}")
            Util.fail1("assert", "", "{test}")
            Util.fail1("assert", NaN, "{test}")
        })
    })

    Util.basic("ok()", function () {
        assert.ok(true)
        assert.ok(1)
        assert.ok(Infinity)
        assert.ok("foo")
        assert.ok({})
        assert.ok([])
        assert.ok(new Date())
        if (typeof Symbol === "function") assert.ok(Symbol())

        Util.fail1("ok")
        Util.fail1("ok", undefined)
        Util.fail1("ok", null)
        Util.fail1("ok", false)
        Util.fail1("ok", 0)
        Util.fail1("ok", "")
        Util.fail1("ok", NaN)
    })

    Util.basic("notOk()", function () {
        Util.fail1("notOk", true)
        Util.fail1("notOk", 1)
        Util.fail1("notOk", Infinity)
        Util.fail1("notOk", "foo")
        Util.fail1("notOk", {})
        Util.fail1("notOk", [])
        Util.fail1("notOk", new Date())
        if (typeof Symbol === "function") Util.fail1("notOk", Symbol())

        assert.notOk()
        assert.notOk(undefined)
        assert.notOk(null)
        assert.notOk(false)
        assert.notOk(0)
        assert.notOk("")
        assert.notOk(NaN)
    })

    Util.basic("equal()", function () {
        assert.equal(0, 0)
        assert.equal(1, 1)
        assert.equal(null, null)
        assert.equal(undefined, undefined)
        assert.equal(Infinity, Infinity)
        assert.equal(NaN, NaN)
        assert.equal("", "")
        assert.equal("foo", "foo")

        var obj = {}

        assert.equal(obj, obj)

        Util.fail1("equal", {}, {})
        Util.fail1("equal", null, undefined)
        Util.fail1("equal", 0, 1)
        Util.fail1("equal", 1, "1")
    })

    Util.basic("notEqual()", function () {
        Util.fail1("notEqual", 0, 0)
        Util.fail1("notEqual", 1, 1)
        Util.fail1("notEqual", null, null)
        Util.fail1("notEqual", undefined, undefined)
        Util.fail1("notEqual", Infinity, Infinity)
        Util.fail1("notEqual", NaN, NaN)
        Util.fail1("notEqual", "", "")
        Util.fail1("notEqual", "foo", "foo")

        var obj = {}

        Util.fail1("notEqual", obj, obj)

        assert.notEqual({}, {})
        assert.notEqual(null, undefined)
        assert.notEqual(0, 1)
        assert.notEqual(1, "1")
    })

    Util.basic("equalLoose()", function () {
        assert.equalLoose(0, 0)
        assert.equalLoose(1, 1)
        assert.equalLoose(null, null)
        assert.equalLoose(undefined, undefined)
        assert.equalLoose(Infinity, Infinity)
        assert.equalLoose(NaN, NaN)
        assert.equalLoose("", "")
        assert.equalLoose("foo", "foo")
        assert.equalLoose(null, undefined)
        assert.equalLoose(1, "1")

        var obj = {}

        assert.equalLoose(obj, obj)

        Util.fail1("equalLoose", {}, {})
        Util.fail1("equalLoose", 0, 1)
    })

    Util.basic("notEqualLoose()", function () {
        Util.fail1("notEqualLoose", 0, 0)
        Util.fail1("notEqualLoose", 1, 1)
        Util.fail1("notEqualLoose", null, null)
        Util.fail1("notEqualLoose", undefined, undefined)
        Util.fail1("notEqualLoose", Infinity, Infinity)
        Util.fail1("notEqualLoose", NaN, NaN)
        Util.fail1("notEqualLoose", "", "")
        Util.fail1("notEqualLoose", "foo", "foo")
        Util.fail1("notEqualLoose", null, undefined)
        Util.fail1("notEqualLoose", 1, "1")

        var obj = {}

        Util.fail1("notEqualLoose", obj, obj)

        assert.notEqualLoose({}, {})
        assert.notEqualLoose(0, 1)
    })

    Util.basic("deepEqual()", function () {
        assert.deepEqual(0, 0)
        assert.deepEqual(1, 1)
        assert.deepEqual(null, null)
        assert.deepEqual(undefined, undefined)
        assert.deepEqual(Infinity, Infinity)
        assert.deepEqual(NaN, NaN)
        assert.deepEqual("", "")
        assert.deepEqual("foo", "foo")

        var obj = {}

        assert.deepEqual(obj, obj)

        assert.deepEqual({}, {})
        Util.fail1("deepEqual", null, undefined)
        Util.fail1("deepEqual", 0, 1)
        Util.fail1("deepEqual", 1, "1")

        assert.deepEqual(
            {a: [2, 3], b: [4]},
            {a: [2, 3], b: [4]})
    })

    Util.basic("notDeepEqual()", function () {
        Util.fail1("notDeepEqual", 0, 0)
        Util.fail1("notDeepEqual", 1, 1)
        Util.fail1("notDeepEqual", null, null)
        Util.fail1("notDeepEqual", undefined, undefined)
        Util.fail1("notDeepEqual", Infinity, Infinity)
        Util.fail1("notDeepEqual", NaN, NaN)
        Util.fail1("notDeepEqual", "", "")
        Util.fail1("notDeepEqual", "foo", "foo")

        var obj = {}

        Util.fail1("notDeepEqual", obj, obj)

        Util.fail1("notDeepEqual", {}, {})
        assert.notDeepEqual(null, undefined)
        assert.notDeepEqual(0, 1)
        assert.notDeepEqual(1, "1")

        Util.fail1("notDeepEqual",
            {a: [2, 3], b: [4]},
            {a: [2, 3], b: [4]})
    })

    function F() { this.value = 1 }
    Util.methods(F, {
        get prop() { return 1 },
    })

    Util.basic("hasOwn()", function () {
        assert.hasOwn({prop: 1}, "prop")
        assert.hasOwn({prop: 1}, "prop", 1)
        assert.hasOwn(new F(), "value", 1)

        Util.fail1("hasOwn", {prop: 1}, "toString")
        Util.fail1("hasOwn", {prop: 1}, "value")
        Util.fail1("hasOwn", {prop: 1}, "prop", 2)
        Util.fail1("hasOwn", {prop: 1}, "prop", "1")
        Util.fail1("hasOwn", new F(), "prop")
        Util.fail1("hasOwn", new F(), "prop", 1)
        Util.fail1("hasOwn", new F(), "value", 2)
    })

    Util.basic("notHasOwn()", function () {
        Util.fail1("notHasOwn", {prop: 1}, "prop")
        Util.fail1("notHasOwn", {prop: 1}, "prop", 1)
        Util.fail1("notHasOwn", new F(), "value", 1)

        assert.notHasOwn({prop: 1}, "toString")
        assert.notHasOwn({prop: 1}, "value")
        assert.notHasOwn({prop: 1}, "prop", 2)
        assert.notHasOwn({prop: 1}, "prop", "1")
        assert.notHasOwn(new F(), "prop")
        assert.notHasOwn(new F(), "prop", 1)
        assert.notHasOwn(new F(), "value", 2)
    })

    Util.basic("hasOwnLoose()", function () {
        assert.hasOwnLoose({prop: 1}, "prop", 1)
        assert.hasOwnLoose(new F(), "value", 1)
        assert.hasOwnLoose({prop: 1}, "prop", "1")

        Util.fail1("hasOwnLoose", {prop: 1}, "prop", 2)
        Util.fail1("hasOwnLoose", new F(), "prop", 1)
        Util.fail1("hasOwnLoose", new F(), "value", 2)
    })

    Util.basic("notHasOwnLoose()", function () {
        Util.fail1("notHasOwnLoose", {prop: 1}, "prop", 1)
        Util.fail1("notHasOwnLoose", new F(), "value", 1)
        Util.fail1("notHasOwnLoose", {prop: 1}, "prop", "1")

        assert.notHasOwnLoose({prop: 1}, "prop", 2)
        assert.notHasOwnLoose(new F(), "prop", 1)
        assert.notHasOwnLoose(new F(), "value", 2)
    })

    Util.basic("hasKey()", function () {
        assert.hasKey({prop: 1}, "prop")
        assert.hasKey({prop: 1}, "prop", 1)
        assert.hasKey(new F(), "value", 1)
        assert.hasKey({prop: 1}, "toString")
        assert.hasKey(new F(), "prop")
        assert.hasKey(new F(), "prop", 1)

        Util.fail1("hasKey", {prop: 1}, "value")
        Util.fail1("hasKey", {prop: 1}, "prop", 2)
        Util.fail1("hasKey", {prop: 1}, "prop", "1")
        Util.fail1("hasKey", new F(), "value", 2)
    })

    Util.basic("notHasKey()", function () {
        Util.fail1("notHasKey", {prop: 1}, "prop")
        Util.fail1("notHasKey", {prop: 1}, "prop", 1)
        Util.fail1("notHasKey", new F(), "value", 1)
        Util.fail1("notHasKey", {prop: 1}, "toString")
        Util.fail1("notHasKey", new F(), "prop")
        Util.fail1("notHasKey", new F(), "prop", 1)

        assert.notHasKey({prop: 1}, "value")
        assert.notHasKey({prop: 1}, "prop", 2)
        assert.notHasKey({prop: 1}, "prop", "1")
        assert.notHasKey(new F(), "value", 2)
    })

    Util.basic("hasKeyLoose()", function () {
        assert.hasKeyLoose({prop: 1}, "prop", 1)
        assert.hasKeyLoose(new F(), "value", 1)
        assert.hasKeyLoose(new F(), "prop", 1)
        assert.hasKeyLoose({prop: 1}, "prop", "1")

        Util.fail1("hasKeyLoose", {prop: 1}, "prop", 2)
        Util.fail1("hasKeyLoose", new F(), "value", 2)
    })

    Util.basic("notHasKeyLoose()", function () {
        Util.fail1("notHasKeyLoose", {prop: 1}, "prop", 1)
        Util.fail1("notHasKeyLoose", new F(), "value", 1)
        Util.fail1("notHasKeyLoose", new F(), "prop", 1)
        Util.fail1("notHasKeyLoose", {prop: 1}, "prop", "1")

        assert.notHasKeyLoose({prop: 1}, "prop", 2)
        assert.notHasKeyLoose(new F(), "value", 2)
    })

    if (typeof Map !== "undefined") {
        Util.basic("has()", function () {
            t.has(new Map([["prop", 1]]), "prop")
            t.has(new Map([["prop", 1]]), "prop", 1)

            Util.fail1("has", new Map([["prop", 1]]), "value")
            Util.fail1("has", new Map([["prop", 1]]), "prop", 2)
            Util.fail1("has", new Map([["prop", 1]]), "prop", "1")
        })

        Util.basic("notHas()", function () {
            Util.fail1("notHas", new Map([["prop", 1]]), "prop")
            Util.fail1("notHas", new Map([["prop", 1]]), "prop", 1)

            t.notHas(new Map([["prop", 1]]), "value")
            t.notHas(new Map([["prop", 1]]), "prop", 2)
            t.notHas(new Map([["prop", 1]]), "prop", "1")
        })

        Util.basic("hasLoose()", function () {
            t.hasLoose(new Map([["prop", 1]]), "prop", 1)
            t.hasLoose(new Map([["prop", 1]]), "prop", "1")

            Util.fail1("hasLoose", new Map([["prop", 1]]), "prop", 2)
        })

        Util.basic("notHasLoose()", function () {
            Util.fail1("notHasLoose", new Map([["prop", 1]]), "prop", 1)
            Util.fail1("notHasLoose", new Map([["prop", 1]]), "prop", "1")

            t.notHasLoose(new Map([["prop", 1]]), "prop", 2)
        })
    }
})
