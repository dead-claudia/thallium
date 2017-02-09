"use strict"

var t = require("thallium")
var assert = require("thallium/assert")

function fail() {
    assert.match(
        {propertyOne: 1, propertyTwo: 2, propertyThree: 5, propertyFour: 4},
        {propertyOne: 1, propertyTwo: 2, propertyThree: 3, propertyFour: 4}
    )
}

t.test("core (basic)", function () {
    t.testSkip("has `base()`", function () {})
    t.testSkip("has `test()`", function () {})
    t.testSkip("has `parent()`", function () {})
    t.testSkip("can accept a string + function", function () {})
    t.testSkip("can accept a string", function () {})
    t.test("returns the current instance when given a callback", fail)
    t.test("returns a prototypal clone when not given a callback", fail)
    t.testSkip("runs block tests within tests", function () {})
    t.testSkip("runs successful inline tests within tests", function () {})
    t.testSkip("accepts a callback with `t.run()`", function () {})
})
