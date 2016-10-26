"use strict"

var t = require("../..")
var fail = require("../../assert").fail

t.test("core (timeouts) (FLAKE)", function () {
    t.testSkip("succeeds with own")
    t.testSkip("fails with own")
    t.testSkip("succeeds with inherited")
    t.testSkip("fails with inherited")
    t.test("gets own set timeout", fail)
    t.test("gets own inline set timeout", fail)
    t.test("gets own sync inner timeout", fail)
    t.testSkip("gets default timeout")
})
