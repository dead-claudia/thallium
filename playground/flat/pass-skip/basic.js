"use strict"

var t = require("../../..")

t.test("core (basic) has `base()`", function () {})
t.test("core (basic) has `test()`", function () {})
t.test("core (basic) has `parent()`", function () {})
t.test("core (basic) can accept a string + function", function () {})
t.test("core (basic) can accept a string", function () {})
t.testSkip("core (basic) returns the current instance when given a callback")
t.testSkip("core (basic) returns a prototypal clone when not given a callback")
t.test("core (basic) runs block tests within tests", function () {})
t.test("core (basic) runs successful inline tests within tests", function () {})
t.test("core (basic) accepts a callback with `t.run()`", function () {})
