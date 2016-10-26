"use strict"

var fail = require("../../assert").fail

describe("core (basic)", function () {
    it("has `base()`", fail)
    it("has `test()`", fail)
    it("has `parent()`", fail)
    it("can accept a string + function", fail)
    it("can accept a string", fail)
    it("returns the current instance when given a callback", fail)
    it("returns a prototypal clone when not given a callback", fail)
    it("runs block tests within tests", fail)
    it("runs successful inline tests within tests", fail)
    it("accepts a callback with `t.run()`", fail)
})
