"use strict"

var t = require("../../..")

function fail(t) {
    t.fail("fail")
}

t.test("core (timeouts) (FLAKE) succeeds with own", function () {})
t.test("core (timeouts) (FLAKE) fails with own", function () {})
t.test("core (timeouts) (FLAKE) succeeds with inherited", function () {})
t.test("core (timeouts) (FLAKE) fails with inherited", function () {})
t.test("core (timeouts) (FLAKE) gets own set timeout", fail)
t.test("core (timeouts) (FLAKE) gets own inline set timeout", fail)
t.test("core (timeouts) (FLAKE) gets own sync inner timeout", fail)
t.test("core (timeouts) (FLAKE) gets default timeout", function () {})
