"use strict"

var t = require("thallium")
var assert = require("thallium/assert")

function fail() {
    assert.match(
        {propertyOne: 1, propertyTwo: 2, propertyThree: 5, propertyFour: 4},
        {propertyOne: 1, propertyTwo: 2, propertyThree: 3, propertyFour: 4}
    )
}

t.testSkip("works", function () {})
t.test("doesn't work", fail)
t.testSkip("what", function () {})
t.testSkip("ever", function () {})
t.testSkip("you may stop now", function () {})
