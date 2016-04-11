"use strict"

const t = require("../index.js")

describe("define()", () => {
    it("exists", () => {
        const tt = t.base()

        t.hasKey(tt, "define")
        t.function(tt.define)
    })

    it("works with string + function", () => {
        const tt = t.base()
        let self // eslint-disable-line consistent-this

        tt.define("assert", /** @this */ function (test, expected, actual) {
            self = this
            return {
                test, expected, actual,
                message: "{expected} :: {actual}",
            }
        })

        tt.assert(true, {}, {})
        t.undefined(self)

        const expected = {}
        const actual = {}

        try {
            tt.assert(false, expected, actual)
        } catch (e) {
            t.undefined(self)
            t.instanceof(e, t.AssertionError)
            t.hasKeys(e, {expected, actual, message: "{} :: {}"})
            return
        }

        throw new t.AssertionError("Expected tt.assert to throw an error")
    })

    it("works with object", () => {
        const tt = t.base()
        let self // eslint-disable-line consistent-this

        tt.define({
            assert(test, expected, actual) {
                self = this
                return {
                    test, expected, actual,
                    message: "{expected} :: {actual}",
                }
            },
        })

        tt.assert(true, {}, {})
        t.undefined(self)

        const expected = {}
        const actual = {}

        try {
            tt.assert(false, expected, actual)
        } catch (e) {
            t.undefined(self)
            t.instanceof(e, t.AssertionError)
            t.hasKeys(e, {expected, actual, message: "{} :: {}"})
            return
        }

        throw new t.AssertionError("Expected tt.assert to throw an error")
    })

    it("allows arbitrary properties to be used in the message", () => {
        const tt = t.base()

        tt.define("assert", (test, extra) => {
            return {test, extra, message: "{extra}"}
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

        throw new t.AssertionError("Expected tt.assert to throw an error")
    })
})
