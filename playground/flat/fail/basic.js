"use strict"

var t = require("../../../index.js")

function fail(t) {
    t.fail("fail")
}

t.test("core (basic) has `base()`", fail)
t.test("core (basic) has `test()`", fail)
t.test("core (basic) has `parent()`", fail)
t.test("core (basic) can accept a string + function", fail)
t.test("core (basic) can accept a string", fail)
t.test("core (basic) returns the current instance when given a callback", fail)
t.test("core (basic) returns a prototypal clone when not given a callback", fail) // eslint-disable-line max-len
t.test("core (basic) runs block tests within tests", fail)
t.test("core (basic) runs successful inline tests within tests", fail)
t.test("core (basic) accepts a callback with `t.run()`", fail)
