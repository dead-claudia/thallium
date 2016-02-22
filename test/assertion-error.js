"use strict"

var t = require("../index.js")

suite("class AssertionError", function () {
    test("exists", function () {
        t.function(t.AssertionError)
    })

    test("is an error", function () {
        t.instanceof(new t.AssertionError("message"), Error)
    })
})
