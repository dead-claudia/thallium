"use strict"

var t = require("thallium")

t.test("core (timeouts) (FLAKE) succeeds with own", function () {})
t.test("core (timeouts) (FLAKE) fails with own", function () {})
t.test("core (timeouts) (FLAKE) succeeds with inherited", function () {})
t.test("core (timeouts) (FLAKE) fails with inherited", function () {})
t.testSkip("core (timeouts) (FLAKE) gets own set timeout", function () {})
t.testSkip("core (timeouts) (FLAKE) gets own inline set timeout", function () {}) // eslint-disable-line max-len
t.testSkip("core (timeouts) (FLAKE) gets own sync inner timeout", function () {}) // eslint-disable-line max-len
t.test("core (timeouts) (FLAKE) gets default timeout", function () {})
