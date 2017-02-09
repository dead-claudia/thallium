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
    t.test("has `base()`", fail)
    t.test("has `test()`", fail)
    t.test("has `parent()`", fail)
    t.test("can accept a string + function", fail)
    t.test("can accept a string", fail)
    t.test("returns the current instance when given a callback", fail)
    t.test("returns a prototypal clone when not given a callback", fail)
    t.test("runs block tests within tests", fail)
    t.test("runs successful inline tests within tests", fail)
    t.test("accepts a callback with `t.run()`", fail)
})
