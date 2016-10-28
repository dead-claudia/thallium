"use strict"

var t = require("../..")
var assert = require("../../assert")

t.test("mod-two", function () {
    t.test("1 === 2", function () {
        assert.equal(1, 2)
    })

    function isNope(actual) {
        if (actual !== "nope") {
            assert.fail("Expected {actual} to be a nope", {actual: actual})
        }
    }

    t.test("what a fail...", function () {
        isNope("yep")
    })
})
