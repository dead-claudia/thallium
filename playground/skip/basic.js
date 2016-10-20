"use strict"

var t = require("../../index.js")

t.test("core (basic)", function () {
    t.testSkip("has `base()`")
    t.testSkip("has `test()`")
    t.testSkip("has `parent()`")
    t.testSkip("can accept a string + function")
    t.testSkip("can accept a string")
    t.testSkip("returns the current instance when given a callback")
    t.testSkip("returns a prototypal clone when not given a callback")
    t.testSkip("runs block tests within tests")
    t.testSkip("runs successful inline tests within tests")
    t.testSkip("accepts a callback with `t.run()`")
})
