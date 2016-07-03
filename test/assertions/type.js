"use strict"

/* global Symbol */

describe("assertions (type)", function () {
    describe("t.type()", function () {
        it("checks good types", function () {
            t.type(true, "boolean")
            t.type(false, "boolean")
            t.type(0, "number")
            t.type(1, "number")
            t.type(NaN, "number")
            t.type(Infinity, "number")
            t.type("foo", "string")
            t.type("", "string")
            t.type(null, "object")
            t.type({}, "object")
            t.type([], "object")
            t.type(function () {}, "function")
            t.type(undefined, "undefined")
            if (typeof Symbol === "function") t.type(Symbol(), "symbol")
        })

        it("checks bad types", function () { // eslint-disable-line max-statements, max-len
            function typeFail(value) {
                // Silently swallowing exceptions is bad, so we can't use
                // traditional Thallium assertions to test.
                try {
                    t.type(value, "nope")
                } catch (e) {
                    if (e instanceof TypeError) return
                    throw e
                }

                throw new (t.reflect()).AssertionError(
                    "Expected t.type to throw an TypeError",
                    TypeError)
            }

            typeFail(true)
            typeFail(false)
            typeFail(0)
            typeFail(1)
            typeFail(NaN)
            typeFail(Infinity)
            typeFail("foo")
            typeFail("")
            typeFail(null)
            typeFail({})
            typeFail([])
            typeFail(function () {})
            typeFail(undefined)
            if (typeof Symbol === "function") typeFail(Symbol())

            Util.fail("type", true, "number")
            Util.fail("type", false, "number")
            Util.fail("type", 0, "boolean")
            Util.fail("type", 1, "boolean")
            Util.fail("type", NaN, "boolean")
            Util.fail("type", Infinity, "boolean")
            Util.fail("type", "foo", "object")
            Util.fail("type", "", "object")
            Util.fail("type", null, "string")
            Util.fail("type", {}, "string")
            Util.fail("type", [], "string")
            Util.fail("type", function () {}, "object")
            Util.fail("type", undefined, "string")

            if (typeof Symbol === "function") {
                Util.fail("type", Symbol(), "number")
            }
        })
    })

    describe("t.notType()", function () {
        it("checks good types", function () {
            Util.fail("notType", true, "boolean")
            Util.fail("notType", false, "boolean")
            Util.fail("notType", 0, "number")
            Util.fail("notType", 1, "number")
            Util.fail("notType", NaN, "number")
            Util.fail("notType", Infinity, "number")
            Util.fail("notType", "foo", "string")
            Util.fail("notType", "", "string")
            Util.fail("notType", null, "object")
            Util.fail("notType", {}, "object")
            Util.fail("notType", [], "object")
            Util.fail("notType", function () {}, "function")
            Util.fail("notType", undefined, "undefined")

            if (typeof Symbol === "function") {
                Util.fail("notType", Symbol(), "symbol")
            }
        })

        it("checks bad types", function () { // eslint-disable-line max-statements, max-len
            function typeFail(value) {
                // Silently swallowing exceptions is bad, so we can't use
                // traditional Thallium assertions to test.
                try {
                    t.type(value, "nope")
                } catch (e) {
                    if (e instanceof TypeError) return
                    throw e
                }

                throw new (t.reflect()).AssertionError(
                    "Expected t.type to throw an TypeError",
                    TypeError)
            }

            typeFail(true)
            typeFail(false)
            typeFail(0)
            typeFail(1)
            typeFail(NaN)
            typeFail(Infinity)
            typeFail("foo")
            typeFail("")
            typeFail(null)
            typeFail({})
            typeFail([])
            typeFail(function () {})
            typeFail(undefined)
            if (typeof Symbol === "function") typeFail(Symbol())

            t.notType(true, "number")
            t.notType(false, "number")
            t.notType(0, "boolean")
            t.notType(1, "boolean")
            t.notType(NaN, "boolean")
            t.notType(Infinity, "boolean")
            t.notType("foo", "object")
            t.notType("", "object")
            t.notType(null, "string")
            t.notType({}, "string")
            t.notType([], "string")
            t.notType(function () {}, "object")
            t.notType(undefined, "string")
            if (typeof Symbol === "function") t.notType(Symbol(), "number")
        })
    })

    function testType(name, callback) {
        function check(name) {
            return t[name].bind(t)
        }

        Util.basic("t." + name + "()", function () {
            callback(check(name), Util.fail.bind(undefined, name))
        })

        var negated = "not" + name[0].toUpperCase() + name.slice(1)

        Util.basic("t." + negated + "()", function () {
            callback(Util.fail.bind(undefined, negated), check(negated))
        })
    }

    testType("boolean", function (is, not) {
        is(true)
        is(false)
        not(0)
        not(1)
        not(NaN)
        not(Infinity)
        not("foo")
        not("")
        not(null)
        not({})
        not([])
        not(function () {})
        not(undefined)
        not()
        if (typeof Symbol === "function") not(Symbol())
    })

    testType("number", function (is, not) {
        not(true)
        not(false)
        is(0)
        is(1)
        is(NaN)
        is(Infinity)
        not("foo")
        not("")
        not(null)
        not({})
        not([])
        not(function () {})
        not(undefined)
        not()
        if (typeof Symbol === "function") not(Symbol())
    })

    testType("function", function (is, not) {
        not(true)
        not(false)
        not(0)
        not(1)
        not(NaN)
        not(Infinity)
        not("foo")
        not("")
        not(null)
        not({})
        not([])
        is(function () {})
        not(undefined)
        not()
        if (typeof Symbol === "function") not(Symbol())
    })

    testType("object", function (is, not) {
        not(true)
        not(false)
        not(0)
        not(1)
        not(NaN)
        not(Infinity)
        not("foo")
        not("")
        is(null)
        is({})
        is([])
        not(function () {})
        not(undefined)
        not()
        if (typeof Symbol === "function") not(Symbol())
    })

    testType("string", function (is, not) {
        not(true)
        not(false)
        not(0)
        not(1)
        not(NaN)
        not(Infinity)
        is("foo")
        is("")
        not(null)
        not({})
        not([])
        not(function () {})
        not(undefined)
        not()
        if (typeof Symbol === "function") not(Symbol())
    })

    testType("symbol", function (is, not) {
        not(true)
        not(false)
        not(0)
        not(1)
        not(NaN)
        not(Infinity)
        not("foo")
        not("")
        not(null)
        not({})
        not([])
        not(function () {})
        not(undefined)
        not()
        if (typeof Symbol === "function") is(Symbol())
    })

    testType("undefined", function (is, not) {
        not(true)
        not(false)
        not(0)
        not(1)
        not(NaN)
        not(Infinity)
        not("foo")
        not("")
        not(null)
        not({})
        not([])
        not(function () {})
        is(undefined)
        is()
        if (typeof Symbol === "function") not(Symbol())
    })

    testType("true", function (is, not) {
        is(true)
        not(false)
        not(0)
        not(1)
        not(NaN)
        not(Infinity)
        not("foo")
        not("")
        not(null)
        not({})
        not([])
        not(function () {})
        not(undefined)
        not()
        if (typeof Symbol === "function") not(Symbol())
    })

    testType("false", function (is, not) {
        not(true)
        is(false)
        not(0)
        not(1)
        not(NaN)
        not(Infinity)
        not("foo")
        not("")
        not(null)
        not({})
        not([])
        not(function () {})
        not(undefined)
        not()
        if (typeof Symbol === "function") not(Symbol())
    })

    testType("null", function (is, not) {
        not(true)
        not(false)
        not(0)
        not(1)
        not(NaN)
        not(Infinity)
        not("foo")
        not("")
        is(null)
        not({})
        not([])
        not(function () {})
        not(undefined)
        not()
        if (typeof Symbol === "function") not(Symbol())
    })

    testType("exists", function (is, not) {
        is(true)
        is(false)
        is(0)
        is(1)
        is(NaN)
        is(Infinity)
        is("foo")
        is("")
        not(null)
        is({})
        is([])
        is(function () {})
        not(undefined)
        not()
        if (typeof Symbol === "function") is(Symbol())
    })

    testType("array", function (is, not) {
        not(true)
        not(false)
        not(0)
        not(1)
        not(NaN)
        not(Infinity)
        not("foo")
        not("")
        not(null)
        not({})
        is([])
        not(function () {})
        not(undefined)
        not()
        if (typeof Symbol === "function") not(Symbol())
    })

    Util.basic("t.instanceof()", function () {
        function A() {}
        t.instanceof(new A(), A)
        t.instanceof(new A(), Object)

        function B() {}
        Util.methods(B, A)

        t.instanceof(new B(), B)
        t.instanceof(new B(), A)

        Util.fail("instanceof", new A(), B)
        Util.fail("instanceof", [], RegExp)
    })

    Util.basic("t.notInstanceof()", function () {
        function A() {}
        Util.fail("notInstanceof", new A(), A)
        Util.fail("notInstanceof", new A(), Object)

        function B() {}
        Util.methods(B, A)

        Util.fail("notInstanceof", new B(), B)
        Util.fail("notInstanceof", new B(), A)

        t.notInstanceof(new A(), B)
        t.notInstanceof([], RegExp)
    })
})
