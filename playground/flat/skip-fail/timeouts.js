"use strict"

var t = require("../../../index.js")

function fail(t) {
    t.fail("fail")
}

t.testSkip("core (timeouts) (FLAKE) succeeds with own")
t.testSkip("core (timeouts) (FLAKE) fails with own")
t.testSkip("core (timeouts) (FLAKE) succeeds with inherited")
t.testSkip("core (timeouts) (FLAKE) fails with inherited")
t.test("core (timeouts) (FLAKE) gets own set timeout", fail)
t.test("core (timeouts) (FLAKE) gets own inline set timeout", fail)
t.test("core (timeouts) (FLAKE) gets own sync inner timeout", fail)
t.testSkip("core (timeouts) (FLAKE) gets default timeout")
