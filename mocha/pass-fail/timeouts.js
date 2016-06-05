"use strict"

var t = require("../../index.js")

function fail() {
    t.fail("fail")
}

describe("core (timeouts) (FLAKE)", function () {
    it("succeeds with own", function () {})
    it("fails with own", function () {})
    it("succeeds with inherited", function () {})
    it("fails with inherited", function () {})
    it("gets own set timeout", fail)
    it("gets own inline set timeout", fail)
    it("gets own sync inner timeout", fail)
    it("gets default timeout", function () {})
})
