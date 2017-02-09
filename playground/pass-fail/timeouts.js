"use strict"

var t = require("thallium")
var assert = require("thallium/assert")

function fail() {
    assert.match(
        {propertyOne: 1, propertyTwo: 2, propertyThree: 5, propertyFour: 4},
        {propertyOne: 1, propertyTwo: 2, propertyThree: 3, propertyFour: 4}
    )
}

t.test("core (timeouts) (FLAKE)", function () {
    t.test("succeeds with own", function () {})
    t.test("fails with own", function () {})
    t.test("succeeds with inherited", function () {})
    t.test("fails with inherited", function () {})
    t.test("gets own set timeout", fail)
    t.test("gets own inline set timeout", fail)
    t.test("gets own sync inner timeout", fail)
    t.test("gets default timeout", function () {})
})
