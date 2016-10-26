"use strict"

/* eslint-disable max-len */

var t = require("../../..")
var fail = require("../../../assert").fail

t.testSkip("core (basic) has `base()`")
t.testSkip("core (basic) has `test()`")
t.testSkip("core (basic) has `parent()`")
t.testSkip("core (basic) can accept a string + function")
t.testSkip("core (basic) can accept a string")
t.test("core (basic) returns the current instance when given a callback", fail)
t.test("core (basic) returns a prototypal clone when not given a callback", fail)
t.testSkip("core (basic) runs block tests within tests")
t.testSkip("core (basic) runs successful inline tests within tests")
t.testSkip("core (basic) accepts a callback with `t.run()`")
