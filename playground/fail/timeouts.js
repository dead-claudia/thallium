"use strict"

var t = require("../..")
var fail = require("../../assert").fail

t.test("core (timeouts) (FLAKE)", function () {
    t.test("succeeds with own", fail)
    t.test("fails with own", fail)
    t.test("succeeds with inherited", fail)
    t.test("fails with inherited", fail)
    t.test("gets own set timeout", fail)
    t.test("gets own inline set timeout", fail)
    t.test("gets own sync inner timeout", fail)
    t.test("gets default timeout", fail)
})
