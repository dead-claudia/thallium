"use strict"

/* eslint-disable max-len */

var t = require("thallium")
var assert = require("thallium/assert")

function fail() {
    assert.match(
        {propertyOne: 1, propertyTwo: 2, propertyThree: 5, propertyFour: 4},
        {propertyOne: 1, propertyTwo: 2, propertyThree: 3, propertyFour: 4}
    )
}

t.testSkip("core (basic) has `base()`", function () {})
t.testSkip("core (basic) has `test()`", function () {})
t.testSkip("core (basic) has `parent()`", function () {})
t.testSkip("core (basic) can accept a string + function", function () {})
t.testSkip("core (basic) can accept a string", function () {})
t.test("core (basic) returns the current instance when given a callback", fail)
t.test("core (basic) returns a prototypal clone when not given a callback", fail)
t.testSkip("core (basic) runs block tests within tests", function () {})
t.testSkip("core (basic) runs successful inline tests within tests", function () {})
t.testSkip("core (basic) accepts a callback with `t.run()`", function () {})
