"use strict"

/* global Symbol */

describe("assertions (type)", function () {
    describe("type()", function () {
        it("checks good types", function () {
            assert.type(true, "boolean")
            assert.type(false, "boolean")
            assert.type(0, "number")
            assert.type(1, "number")
            assert.type(NaN, "number")
            assert.type(Infinity, "number")
            assert.type("foo", "string")
            assert.type("", "string")
            assert.type(null, "object")
            assert.type({}, "object")
            assert.type([], "object")
            assert.type(function () {}, "function")
            assert.type(undefined, "undefined")
            if (typeof Symbol === "function") assert.type(Symbol(), "symbol")
        })

        it("checks bad types", function () { // eslint-disable-line max-statements, max-len
            function typeFail(value) {
                // Silently swallowing exceptions is bad, so we can't use
                // traditional Thallium assertions to test.
                try {
                    assert.type(value, "nope")
                } catch (e) {
                    if (e instanceof TypeError) return
                    throw e
                }

                throw new assert.AssertionError(
                    "Expected t.type to throw an TypeError",
                    undefined, TypeError)
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

            Util.fail1("type", true, "number")
            Util.fail1("type", false, "number")
            Util.fail1("type", 0, "boolean")
            Util.fail1("type", 1, "boolean")
            Util.fail1("type", NaN, "boolean")
            Util.fail1("type", Infinity, "boolean")
            Util.fail1("type", "foo", "object")
            Util.fail1("type", "", "object")
            Util.fail1("type", null, "string")
            Util.fail1("type", {}, "string")
            Util.fail1("type", [], "string")
            Util.fail1("type", function () {}, "object")
            Util.fail1("type", undefined, "string")

            if (typeof Symbol === "function") {
                Util.fail1("type", Symbol(), "number")
            }
        })
    })

    describe("notType()", function () {
        it("checks good types", function () {
            Util.fail1("notType", true, "boolean")
            Util.fail1("notType", false, "boolean")
            Util.fail1("notType", 0, "number")
            Util.fail1("notType", 1, "number")
            Util.fail1("notType", NaN, "number")
            Util.fail1("notType", Infinity, "number")
            Util.fail1("notType", "foo", "string")
            Util.fail1("notType", "", "string")
            Util.fail1("notType", null, "object")
            Util.fail1("notType", {}, "object")
            Util.fail1("notType", [], "object")
            Util.fail1("notType", function () {}, "function")
            Util.fail1("notType", undefined, "undefined")

            if (typeof Symbol === "function") {
                Util.fail1("notType", Symbol(), "symbol")
            }
        })

        it("checks bad types", function () { // eslint-disable-line max-statements, max-len
            function typeFail(value) {
                // Silently swallowing exceptions is bad, so we can't use
                // traditional Thallium assertions to test.
                try {
                    assert.type(value, "nope")
                } catch (e) {
                    if (e instanceof TypeError) return
                    throw e
                }

                throw new assert.AssertionError(
                    "Expected t.type to throw an TypeError",
                    undefined, TypeError)
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

            assert.notType(true, "number")
            assert.notType(false, "number")
            assert.notType(0, "boolean")
            assert.notType(1, "boolean")
            assert.notType(NaN, "boolean")
            assert.notType(Infinity, "boolean")
            assert.notType("foo", "object")
            assert.notType("", "object")
            assert.notType(null, "string")
            assert.notType({}, "string")
            assert.notType([], "string")
            assert.notType(function () {}, "object")
            assert.notType(undefined, "string")
            if (typeof Symbol === "function") assert.notType(Symbol(), "number")
        })
    })

    function testType(name, callback) {
        Util.basic(name + "()", function () {
            callback(assert[name], Util.fail1.bind(undefined, name))
        })

        var negated = "not" + name[0].toUpperCase() + name.slice(1)

        Util.basic(negated + "()", function () {
            callback(Util.fail1.bind(undefined, negated), assert[negated])
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
        not(null)
        is({})
        is([])
        not(function () {})
        not(undefined)
        not()
        if (typeof Symbol === "function") not(Symbol())
    })

    testType("objectOrNull", function (is, not) {
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

    Util.basic("inherits()", function () {
        function A() {}
        assert.inherits(new A(), A)
        assert.inherits(new A(), Object)

        function B() {}
        Util.methods(B, A)

        assert.inherits(new B(), B)
        assert.inherits(new B(), A)

        Util.fail1("inherits", new A(), B)
        Util.fail1("inherits", [], RegExp)
    })

    Util.basic("notInherits()", function () {
        function A() {}
        Util.fail1("notInherits", new A(), A)
        Util.fail1("notInherits", new A(), Object)

        function B() {}
        Util.methods(B, A)

        Util.fail1("notInherits", new B(), B)
        Util.fail1("notInherits", new B(), A)

        assert.notInherits(new A(), B)
        assert.notInherits([], RegExp)
    })
})
