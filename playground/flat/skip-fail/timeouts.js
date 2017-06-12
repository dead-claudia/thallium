"use strict"

var t = require("thallium")
var assert = require("thallium/assert")

function fail() {
    assert.match(
        {propertyOne: 1, propertyTwo: 2, propertyThree: 5, propertyFour: 4},
        {propertyOne: 1, propertyTwo: 2, propertyThree: 3, propertyFour: 4}
    )
}

t.test("core (timeouts) (FLAKE) succeeds with own", function () { t.skip() })
t.test("core (timeouts) (FLAKE) fails with own", function () { t.skip() })
t.test("core (timeouts) (FLAKE) succeeds with inherited", function () { t.skip() }) // eslint-disable-line max-len
t.test("core (timeouts) (FLAKE) fails with inherited", function () { t.skip() })
t.test("core (timeouts) (FLAKE) gets own set timeout", fail)
t.test("core (timeouts) (FLAKE) gets own inline set timeout", fail)
t.test("core (timeouts) (FLAKE) gets own sync inner timeout", fail)
t.test("core (timeouts) (FLAKE) gets default timeout", function () { t.skip() })
