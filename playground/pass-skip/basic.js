"use strict"

var t = require("thallium")

t.test("core (basic)", function () {
    t.test("has `base()`", function () {})
    t.test("has `test()`", function () {})
    t.test("has `parent()`", function () {})
    t.test("can accept a string + function", function () {})
    t.test("can accept a string", function () {})
    t.testSkip("returns the current instance when given a callback", function () {}) // eslint-disable-line max-len
    t.testSkip("returns a prototypal clone when not given a callback", function () {}) // eslint-disable-line max-len
    t.test("runs block tests within tests", function () {})
    t.test("runs successful inline tests within tests", function () {})
    t.test("accepts a callback with `t.run()`", function () {})
})
