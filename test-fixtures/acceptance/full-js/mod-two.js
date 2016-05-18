"use strict"

var t = require("../../../index.js")

t.test("mod-two", function (t) {
    t.test("1 === 2").equal(1, 2)

    t.test("expandos don't transfer", function (t) {
        t.notHasKey(t, "foo")
    })

    t.define("isNope", function (str) {
        return {
            test: str === "nope",
            actual: str,
            message: "Expected {actual} to be a nope",
        }
    })

    t.test("what a fail...").isNope("yep")
})
