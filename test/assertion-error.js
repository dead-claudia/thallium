"use strict"

const t = require("../index.js")

describe("class AssertionError", () => {
    it("exists", () => {
        t.function(t.AssertionError)
    })

    it("is an error", () => {
        t.instanceof(new t.AssertionError("message"), Error)
    })
})
