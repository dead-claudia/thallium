"use strict"

var t = require("../../index.js")

function fail() {
    t.fail("fail")
}

describe("core (timeouts) (FLAKE)", function () {
    it("succeeds with own")
    it("fails with own")
    it("succeeds with inherited")
    it("fails with inherited")
    it("gets own set timeout", fail)
    it("gets own inline set timeout", fail)
    it("gets own sync inner timeout", fail)
    it("gets default timeout")
})
