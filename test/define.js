"use strict"

var t = require("../index.js")

suite("define()", function () {
    test("exists", function () {
        var tt = t.base()

        t.hasKey(tt, "define")
        t.function(tt.define)
    })

    test("works with string + function", function () {
        var tt = t.base()
        var self // eslint-disable-line consistent-this

        tt.define("assert", /** @this */ function (test, expected, actual) {
            self = this
            return {
                test: test, expected: expected, actual: actual,
                message: "{expected} :: {actual}",
            }
        })

        tt.assert(true, {}, {})
        t.undefined(self)

        var expected = {}
        var actual = {}

        try {
            tt.assert(false, expected, actual)
        } catch (e) {
            t.undefined(self)
            t.instanceof(e, t.AssertionError)
            t.hasKeys(e, {
                expected: expected,
                actual: actual,
                message: "{} :: {}",
            })
            return
        }

        throw new Error("Expected tt.assert to throw an error")
    })

    test("works with object", function () {
        var tt = t.base()

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
        var message = "{} :: {}"

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
        var tt = t.base()

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
