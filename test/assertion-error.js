"use strict"

var t = require("../index.js")

describe("class AssertionError", function () {
    it("exists", function () {
        t.function(t.AssertionError)
    })

    it("is an error", function () {
        t.instanceof(new t.AssertionError("message"), Error)
    })

    it("correctly sets properties", function () {
        t.match(new t.AssertionError("message", 1, 2), {
            message: "message",
            expected: 1,
            actual: 2,
        })
    })
})
