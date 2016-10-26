"use strict"

var t = require("../../..")
var fail = require("../../../assert").fail

t.test("core (timeouts) (FLAKE) succeeds with own", fail)
t.test("core (timeouts) (FLAKE) fails with own", fail)
t.test("core (timeouts) (FLAKE) succeeds with inherited", fail)
t.test("core (timeouts) (FLAKE) fails with inherited", fail)
t.test("core (timeouts) (FLAKE) gets own set timeout", fail)
t.test("core (timeouts) (FLAKE) gets own inline set timeout", fail)
t.test("core (timeouts) (FLAKE) gets own sync inner timeout", fail)
t.test("core (timeouts) (FLAKE) gets default timeout", fail)
