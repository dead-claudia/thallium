"use strict"

var t = require("../../index.js")
var util = require("../../test-util/assertions.js")
var fail = util.fail
var basic = util.basic

suite("assertions (base)", function () {
    suite("t.assert()", function () {
        test("works", function () {
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

        test("doesn't escape the message", function () {
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
        if (typeof Symbol === "function") t.ok(Symbol())

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
        if (typeof Symbol === "function") fail("notOk", Symbol())

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

    basic("t.looseEqual()", function () {
        t.looseEqual(0, 0)
        t.looseEqual(1, 1)
        t.looseEqual(null, null)
        t.looseEqual(undefined, undefined)
        t.looseEqual(Infinity, Infinity)
        t.looseEqual(NaN, NaN)
        t.looseEqual("", "")
        t.looseEqual("foo", "foo")
        t.looseEqual(null, undefined)
        t.looseEqual(1, "1")

        var obj = {}
        t.looseEqual(obj, obj)

        fail("looseEqual", {}, {})
        fail("looseEqual", 0, 1)
    })

    basic("t.notLooseEqual()", function () {
        fail("notLooseEqual", 0, 0)
        fail("notLooseEqual", 1, 1)
        fail("notLooseEqual", null, null)
        fail("notLooseEqual", undefined, undefined)
        fail("notLooseEqual", Infinity, Infinity)
        fail("notLooseEqual", NaN, NaN)
        fail("notLooseEqual", "", "")
        fail("notLooseEqual", "foo", "foo")
        fail("notLooseEqual", null, undefined)
        fail("notLooseEqual", 1, "1")

        var obj = {}
        fail("notLooseEqual", obj, obj)

        t.notLooseEqual({}, {})
        t.notLooseEqual(0, 1)
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

    basic("t.looseDeepEqual()", function () {
        t.looseDeepEqual(0, 0)
        t.looseDeepEqual(1, 1)
        t.looseDeepEqual(null, null)
        t.looseDeepEqual(undefined, undefined)
        t.looseDeepEqual(Infinity, Infinity)
        t.looseDeepEqual(NaN, NaN)
        t.looseDeepEqual("", "")
        t.looseDeepEqual("foo", "foo")

        var obj = {}
        t.looseDeepEqual(obj, obj)

        t.looseDeepEqual({}, {})
        t.looseDeepEqual(null, undefined)
        fail("looseDeepEqual", 0, 1)
        t.looseDeepEqual(1, "1")

        t.looseDeepEqual(
            {a: [2, 3], b: [4]},
            {a: [2, 3], b: [4]})
    })

    basic("t.notLooseDeepEqual()", function () {
        fail("notLooseDeepEqual", 0, 0)
        fail("notLooseDeepEqual", 1, 1)
        fail("notLooseDeepEqual", null, null)
        fail("notLooseDeepEqual", undefined, undefined)
        fail("notLooseDeepEqual", Infinity, Infinity)
        fail("notLooseDeepEqual", NaN, NaN)
        fail("notLooseDeepEqual", "", "")
        fail("notLooseDeepEqual", "foo", "foo")

        var obj = {}
        fail("notLooseDeepEqual", obj, obj)

        fail("notLooseDeepEqual", {}, {})
        fail("notLooseDeepEqual", null, undefined)
        t.notLooseDeepEqual(0, 1)
        fail("notLooseDeepEqual", 1, "1")

        fail("notLooseDeepEqual",
            {a: [2, 3], b: [4]},
            {a: [2, 3], b: [4]})
    })

    basic("t.hasOwn()", function () {
        function F() {
            this.value = 1
        }
        F.prototype.prop = 1

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
        function F() {
            this.value = 1
        }
        F.prototype.prop = 1

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

    basic("t.looseHasOwn()", function () {
        function F() {
            this.value = 1
        }
        F.prototype.prop = 1

        t.looseHasOwn({prop: 1}, "prop")
        t.looseHasOwn({prop: 1}, "prop", 1)
        t.looseHasOwn(new F(), "value", 1)
        t.looseHasOwn({prop: 1}, "prop", "1")

        fail("looseHasOwn", {prop: 1}, "toString")
        fail("looseHasOwn", {prop: 1}, "value")
        fail("looseHasOwn", {prop: 1}, "prop", 2)
        fail("looseHasOwn", new F(), "prop")
        fail("looseHasOwn", new F(), "prop", 1)
        fail("looseHasOwn", new F(), "value", 2)
    })

    basic("t.notLooseHasOwn()", function () {
        function F() {
            this.value = 1
        }
        F.prototype.prop = 1

        fail("notLooseHasOwn", {prop: 1}, "prop")
        fail("notLooseHasOwn", {prop: 1}, "prop", 1)
        fail("notLooseHasOwn", new F(), "value", 1)
        fail("notLooseHasOwn", {prop: 1}, "prop", "1")

        t.notLooseHasOwn({prop: 1}, "toString")
        t.notLooseHasOwn({prop: 1}, "value")
        t.notLooseHasOwn({prop: 1}, "prop", 2)
        t.notLooseHasOwn(new F(), "prop")
        t.notLooseHasOwn(new F(), "prop", 1)
        t.notLooseHasOwn(new F(), "value", 2)
    })

    basic("t.hasKey()", function () {
        function F() {
            this.value = 1
        }
        F.prototype.prop = 1

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
        function F() {
            this.value = 1
        }
        F.prototype.prop = 1

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

    basic("t.looseHasKey()", function () {
        function F() {
            this.value = 1
        }
        F.prototype.prop = 1

        t.looseHasKey({prop: 1}, "prop")
        t.looseHasKey({prop: 1}, "prop", 1)
        t.looseHasKey(new F(), "value", 1)
        t.looseHasKey({prop: 1}, "toString")
        t.looseHasKey(new F(), "prop")
        t.looseHasKey(new F(), "prop", 1)
        t.looseHasKey({prop: 1}, "prop", "1")

        fail("looseHasKey", {prop: 1}, "value")
        fail("looseHasKey", {prop: 1}, "prop", 2)
        fail("looseHasKey", new F(), "value", 2)
    })

    basic("t.notLooseHasKey()", function () {
        function F() {
            this.value = 1
        }
        F.prototype.prop = 1

        fail("notLooseHasKey", {prop: 1}, "prop")
        fail("notLooseHasKey", {prop: 1}, "prop", 1)
        fail("notLooseHasKey", new F(), "value", 1)
        fail("notLooseHasKey", {prop: 1}, "toString")
        fail("notLooseHasKey", new F(), "prop")
        fail("notLooseHasKey", new F(), "prop", 1)
        fail("notLooseHasKey", {prop: 1}, "prop", "1")

        t.notLooseHasKey({prop: 1}, "value")
        t.notLooseHasKey({prop: 1}, "prop", 2)
        t.notLooseHasKey(new F(), "value", 2)
    })
})
