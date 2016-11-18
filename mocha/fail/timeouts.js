"use strict"

var fail = require("../../assert").fail

describe("core (timeouts) (FLAKE)", function () {
    it("succeeds with own", fail)
    it("fails with own", fail)
    it("succeeds with inherited", fail)
    it("fails with inherited", fail)
    it("gets own set timeout", fail)
    it("gets own inline set timeout", fail)
    it("gets own sync inner timeout", fail)
    it("gets default timeout", fail)
})
