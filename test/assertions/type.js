"use strict"

var t = require("../../index.js")
var methods = require("../../lib/methods.js")
var Util = require("../../helpers/base.js")
var fail = Util.fail
var basic = Util.basic

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
            if (typeof Symbol === "function") t.type(Symbol(), "symbol") // eslint-disable-line no-undef, max-len
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
            if (typeof Symbol === "function") typeFail(Symbol()) // eslint-disable-line no-undef, max-len

            fail("type", true, "number")
            fail("type", false, "number")
            fail("type", 0, "boolean")
            fail("type", 1, "boolean")
            fail("type", NaN, "boolean")
            fail("type", Infinity, "boolean")
            fail("type", "foo", "object")
            fail("type", "", "object")
            fail("type", null, "string")
            fail("type", {}, "string")
            fail("type", [], "string")
            fail("type", function () {}, "object")
            fail("type", undefined, "string")
            if (typeof Symbol === "function") fail("type", Symbol(), "number") // eslint-disable-line no-undef, max-len
        })
    })

    describe("t.notType()", function () {
        it("checks good types", function () {
            fail("notType", true, "boolean")
            fail("notType", false, "boolean")
            fail("notType", 0, "number")
            fail("notType", 1, "number")
            fail("notType", NaN, "number")
            fail("notType", Infinity, "number")
            fail("notType", "foo", "string")
            fail("notType", "", "string")
            fail("notType", null, "object")
            fail("notType", {}, "object")
            fail("notType", [], "object")
            fail("notType", function () {}, "function")
            fail("notType", undefined, "undefined")
            if (typeof Symbol === "function") fail("notType", Symbol(), "symbol") // eslint-disable-line no-undef, max-len
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
            if (typeof Symbol === "function") typeFail(Symbol()) // eslint-disable-line no-undef, max-len

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
            if (typeof Symbol === "function") t.notType(Symbol(), "number") // eslint-disable-line no-undef, max-len
        })
    })

    function testType(name, callback) {
        function check(name) {
            return t[name].bind(t)
        }

        basic("t." + name + "()", function () {
            callback(check(name), fail.bind(undefined, name))
        })

        var negated = "not" + name[0].toUpperCase() + name.slice(1)

        basic("t." + negated + "()", function () {
            callback(fail.bind(undefined, negated), check(negated))
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
        if (typeof Symbol === "function") not(Symbol()) // eslint-disable-line no-undef, max-len
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
        if (typeof Symbol === "function") not(Symbol()) // eslint-disable-line no-undef, max-len
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
        if (typeof Symbol === "function") not(Symbol()) // eslint-disable-line no-undef, max-len
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
        if (typeof Symbol === "function") not(Symbol()) // eslint-disable-line no-undef, max-len
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
        if (typeof Symbol === "function") not(Symbol()) // eslint-disable-line no-undef, max-len
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
        if (typeof Symbol === "function") is(Symbol()) // eslint-disable-line no-undef, max-len
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
        if (typeof Symbol === "function") not(Symbol()) // eslint-disable-line no-undef, max-len
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
        if (typeof Symbol === "function") not(Symbol()) // eslint-disable-line no-undef, max-len
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
        if (typeof Symbol === "function") not(Symbol()) // eslint-disable-line no-undef, max-len
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
        if (typeof Symbol === "function") not(Symbol()) // eslint-disable-line no-undef, max-len
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
        if (typeof Symbol === "function") is(Symbol()) // eslint-disable-line no-undef, max-len
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
        if (typeof Symbol === "function") not(Symbol()) // eslint-disable-line no-undef, max-len
    })

    basic("t.instanceof()", function () {
        function A() {}
        t.instanceof(new A(), A)
        t.instanceof(new A(), Object)

        function B() {}
        methods(B, A)

        t.instanceof(new B(), B)
        t.instanceof(new B(), A)

        fail("instanceof", new A(), B)
        fail("instanceof", [], RegExp)
    })

    basic("t.notInstanceof()", function () {
        function A() {}
        fail("notInstanceof", new A(), A)
        fail("notInstanceof", new A(), Object)

        function B() {}
        methods(B, A)

        fail("notInstanceof", new B(), B)
        fail("notInstanceof", new B(), A)

        t.notInstanceof(new A(), B)
        t.notInstanceof([], RegExp)
    })
})
