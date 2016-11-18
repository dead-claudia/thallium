"use strict"

var t = require("thallium")
var assert = require("thallium/assert")

t.test("injection worked", function () {
    assert.ok(global.INJECTED)
})
