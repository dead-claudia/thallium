"use strict"

var inspect = require("util").inspect
var AssertionError = require("../index.js").AssertionError

describe("class AssertionError", function () {
    it("is an error", function () {
        if (!(new AssertionError("message") instanceof Error)) {
            throw new Error("Expected t.AssertionError to subclass Error")
        }
    })

    function equal(e, prop, expected) {
        if (!{}.hasOwnProperty.call(e, prop)) {
            throw new Error("Expected error to have own " + prop + " property")
        }

        if (e[prop] !== expected) {
            throw new Error("Expected e." + prop + " to equal " +
                inspect(expected) + ", but found " + inspect(e[prop]))
        }
    }

    it("correctly sets properties", function () {
        var e = new AssertionError("message", 1, 2)

        equal(e, "message", "message")
        equal(e, "expected", 1)
        equal(e, "actual", 2)
    })
})
