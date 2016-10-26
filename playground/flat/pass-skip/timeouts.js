"use strict"

var t = require("../../..")

t.test("core (timeouts) (FLAKE) succeeds with own", function () {})
t.test("core (timeouts) (FLAKE) fails with own", function () {})
t.test("core (timeouts) (FLAKE) succeeds with inherited", function () {})
t.test("core (timeouts) (FLAKE) fails with inherited", function () {})
t.testSkip("core (timeouts) (FLAKE) gets own set timeout")
t.testSkip("core (timeouts) (FLAKE) gets own inline set timeout")
t.testSkip("core (timeouts) (FLAKE) gets own sync inner timeout")
t.test("core (timeouts) (FLAKE) gets default timeout", function () {})
