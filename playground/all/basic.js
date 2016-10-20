"use strict"

var t = require("../../index.js")

function fail(t) {
    t.fail("fail")
}

t.test("core (basic)", function () {
    t.test("has `base()`", function () {})
    t.test("has `test()`", function () {})
    t.test("has `parent()`", function () {})
    t.test("can accept a string + function", function () {})
    t.test("can accept a string", function () {})
    t.test("returns the current instance when given a callback", fail)
    t.test("returns a prototypal clone when not given a callback", fail)
    t.test("runs block tests within tests", function () {})
    t.test("runs successful inline tests within tests", function () {})
    t.testSkip("accepts a callback with `t.run()`")
})
