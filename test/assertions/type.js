"use strict"

/* global Symbol */

describe("assertions (type)", function () {
    function testType(name, callback) {
        Util.basic(name + "()", function () {
            callback(assert[name], Util.fail.bind(undefined, name))
        })

        var negated = "not" + name[0].toUpperCase() + name.slice(1)

        Util.basic(negated + "()", function () {
            callback(Util.fail.bind(undefined, negated), assert[negated])
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

        Util.fail("inherits", new A(), B)
        Util.fail("inherits", [], RegExp)
    })

    Util.basic("notInherits()", function () {
        function A() {}
        Util.fail("notInherits", new A(), A)
        Util.fail("notInherits", new A(), Object)

        function B() {}
        Util.methods(B, A)

        Util.fail("notInherits", new B(), B)
        Util.fail("notInherits", new B(), A)

        assert.notInherits(new A(), B)
        assert.notInherits([], RegExp)
    })
})
