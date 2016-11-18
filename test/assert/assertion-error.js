"use strict"

describe("core (assertion error)", function () {
    var AssertionError = assert.AssertionError
    var hasOwn = Object.prototype.hasOwnProperty

    it("is an error", function () {
        if (!(new AssertionError() instanceof Error)) {
            throw new Error("Expected AssertionError to subclass Error")
        }
    })

    function checkValue(e, prop, expected, own) {
        if (own && !hasOwn.call(e, prop)) {
            throw new Error("Expected error to have own `" + prop +
                "` property")
        }

        if (e[prop] !== expected) {
            throw new Error("Expected e." + prop + " to equal " +
                Util.inspect(expected) + ", but found " +
                Util.inspect(e[prop]))
        }
    }

    // Otherwise, this won't work on native subclasses.
    function check(name, message, expected, actual) {
        it(name, function () {
            var e = new AssertionError(message, expected, actual)

            checkValue(e, "message", message)
            checkValue(e, "expected", expected, true)
            checkValue(e, "actual", actual, true)
        })
    }

    check("correctly sets existing properties", "message", 1, 2)
    check("correctly sets missing `actual`", "message", 1, undefined)
    check("correctly sets missing `expected`", "message", undefined, 2)
    check("correctly sets missing `message`", "", 1, 2)
})
