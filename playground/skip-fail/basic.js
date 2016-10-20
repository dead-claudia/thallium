"use strict"

var t = require("../../index.js")

function fail(t) {
    t.fail("fail")
}

t.test("core (basic)", function () {
    t.testSkip("has `base()`")
    t.testSkip("has `test()`")
    t.testSkip("has `parent()`")
    t.testSkip("can accept a string + function")
    t.testSkip("can accept a string")
    t.test("returns the current instance when given a callback", fail)
    t.test("returns a prototypal clone when not given a callback", fail)
    t.testSkip("runs block tests within tests")
    t.testSkip("runs successful inline tests within tests")
    t.testSkip("accepts a callback with `t.run()`")
})
