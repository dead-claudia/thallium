"use strict"

var t = require("thallium")

t.test("core (basic)", function () {
    t.testSkip("has `base()`", function () {})
    t.testSkip("has `test()`", function () {})
    t.testSkip("has `parent()`", function () {})
    t.testSkip("can accept a string + function", function () {})
    t.testSkip("can accept a string", function () {})
    t.testSkip("returns the current instance when given a callback", function () {}) // eslint-disable-line max-len
    t.testSkip("returns a prototypal clone when not given a callback", function () {}) // eslint-disable-line max-len
    t.testSkip("runs block tests within tests", function () {})
    t.testSkip("runs successful inline tests within tests", function () {})
    t.testSkip("accepts a callback with `t.run()`", function () {})
})
