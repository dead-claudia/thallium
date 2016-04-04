"use strict"

var t = require("../index.js")

describe("class AssertionError", function () {
    it("exists", function () {
        t.function(t.AssertionError)
    })

    it("is an error", function () {
        t.instanceof(new t.AssertionError("message"), Error)
    })
})
