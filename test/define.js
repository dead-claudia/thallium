import t from "../src/index.js"

suite("define()", () => {
    test("exists", () => {
        const tt = t.base()

        t.hasKey(tt, "define")
        t.function(tt.define)
    })

    test("works with string + function", () => {
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
            t.hasKeys(e, {
                expected, actual,
                message: "{} :: {}",
            })
            return
        }

        throw new Error("Expected tt.assert to throw an error")
    })

    test("works with object", () => {
        const tt = t.base()

        tt.define({
            assert(test, expected, actual) {
                return {
                    test, expected, actual,
                    message: "{expected} :: {actual}",
                }
            },
        })

        tt.assert(true, {}, {})

        const expected = {}
        const actual = {}
        const message = "{} :: {}"

        try {
            tt.assert(false, expected, actual)
        } catch (e) {
            t.instanceof(e, t.AssertionError)
            t.hasKeys(e, {expected, actual, message})
            return
        }

        throw new Error("Expected tt.assert to throw an error")
    })

    test("allows arbitrary properties to be used in the message", () => {
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

        throw new Error("Expected tt.assert to throw an error")
    })
})
