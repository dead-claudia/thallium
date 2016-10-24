"use strict"

var t = require("../../index.js")
var assert = require("../../assert/index.js")

t.test("mod-two", function () {
    t.test("1 === 2", function () {
        assert.equal(1, 2)
    })

    function isNope(str) {
        if (str !== "nope") {
            assert.failFormat("Expected {actual} to be a nope", {actual: str})
        }
    }

    t.test("what a fail...", function () {
        isNope("yep")
    })
})
