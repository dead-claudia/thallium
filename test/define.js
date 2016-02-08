"use strict"

var t = require("../index.js")
var inspect = require("../lib/inspect.js")
var createBase = require("../lib/core.js")

suite("define", function () {
    test("exists", function () {
        var tt = createBase()
        t.hasKey(tt, "define")
        t.function(tt.define)
    })

    test("works with string + function", function () {
        var tt = createBase()

        tt.define("assert", function (test, expected, actual) {
            return {
                test: test, expected: expected, actual: actual,
                message: "{expected} :: {actual}",
            }
        })

        tt.assert(true, {}, {})

        var expected = {}
        var actual = {}
        var message = inspect(expected) + " :: " + inspect(actual)

        try {
            tt.assert(false, expected, actual)
        } catch (e) {
            t.instanceof(e, t.AssertionError)
            t.hasKeys(e, {
                expected: expected,
                actual: actual,
                message: message,
            })
            return
        }

        throw new Error("Expected tt.assert to throw an error")
    })

    test("works with object", function () {
        var tt = createBase()

        tt.define({
            assert: function (test, expected, actual) {
                return {
                    test: test, expected: expected, actual: actual,
                    message: "{expected} :: {actual}",
                }
            },
        })

        tt.assert(true, {}, {})

        var expected = {}
        var actual = {}
        var message = inspect(expected) + " :: " + inspect(actual)

        try {
            tt.assert(false, expected, actual)
        } catch (e) {
            t.instanceof(e, t.AssertionError)
            t.hasKeys(e, {
                expected: expected,
                actual: actual,
                message: message,
            })
            return
        }

        throw new Error("Expected tt.assert to throw an error")
    })

    test("allows arbitrary properties to be used in the message", function () {
        var tt = createBase()

        tt.define("assert", function (test, extra) {
            return {test: test, extra: extra, message: "{extra}"}
        })

        try {
            tt.assert(false, "message")
        } catch (e) {
            t.instanceof(e, t.AssertionError)
            t.hasKeys(e, {
                expected: undefined,
                actual: undefined,
                message: "'message'",
            })
            return
        }

        throw new Error("Expected tt.assert to throw an error")
    })
})
