"use strict"

var t = require("thallium")
var assert = require("thallium/assert")

function fail() {
    assert.match(
        {propertyOne: 1, propertyTwo: 2, propertyThree: 5, propertyFour: 4},
        {propertyOne: 1, propertyTwo: 2, propertyThree: 3, propertyFour: 4}
    )
}

t.test("works", function () {})
t.test("doesn't work", fail)
t.test("what", function () {})
t.test("ever", function () {})
t.test("you may stop now", function () {})
