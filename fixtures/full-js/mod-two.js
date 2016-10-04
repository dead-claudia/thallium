"use strict"

var t = require("../../index.js")
var assert = require("../../assert.js")

t.test("mod-two", function (t) {
    t.test("1 === 2").try(assert.equal, 1, 2)

    t.test("expandos don't transfer", function (t) {
        assert.notHasKey(t, "foo")
    })

    function isNope(str) {
        if (str !== "nope") {
            assert.failFormat("Expected {actual} to be a nope", {actual: str})
        }
    }

    t.test("what a fail...").try(isNope, "yep")
})
