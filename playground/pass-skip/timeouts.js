"use strict"

var t = require("thallium")

t.test("core (timeouts) (FLAKE)", function () {
    t.test("succeeds with own", function () {})
    t.test("fails with own", function () {})
    t.test("succeeds with inherited", function () {})
    t.test("fails with inherited", function () {})
    t.test("gets own set timeout", function () {})
    t.test("gets own inline set timeout", function () {})
    t.test("gets own sync inner timeout", function () {})
    t.test("gets default timeout", function () {})
})
