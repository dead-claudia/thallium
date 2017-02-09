"use strict"

var t = require("thallium")
var assert = require("thallium/assert")

function fail() {
    assert.match(
        {propertyOne: 1, propertyTwo: 2, propertyThree: 5, propertyFour: 4},
        {propertyOne: 1, propertyTwo: 2, propertyThree: 3, propertyFour: 4}
    )
}

t.testSkip("core (timeouts) (FLAKE) succeeds with own", function () {})
t.testSkip("core (timeouts) (FLAKE) fails with own", function () {})
t.testSkip("core (timeouts) (FLAKE) succeeds with inherited", function () {})
t.testSkip("core (timeouts) (FLAKE) fails with inherited", function () {})
t.test("core (timeouts) (FLAKE) gets own set timeout", fail)
t.test("core (timeouts) (FLAKE) gets own inline set timeout", fail)
t.test("core (timeouts) (FLAKE) gets own sync inner timeout", fail)
t.testSkip("core (timeouts) (FLAKE) gets default timeout", function () {})
