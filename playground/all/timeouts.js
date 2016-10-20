"use strict"

var t = require("../../index.js")

function fail(t) {
    t.fail("fail")
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
