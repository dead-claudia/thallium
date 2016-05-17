"use strict"

const t = require("../index.js")

describe("class AssertionError", () => {
    it("exists", () => {
        t.function(t.AssertionError)
    })

    it("is an error", () => {
        t.instanceof(new t.AssertionError("message"), Error)
    })

    it("correctly sets properties", () => {
        t.match(new t.AssertionError("message", 1, 2), {
            message: "message",
            expected: 1,
            actual: 2,
        })
    })
})
