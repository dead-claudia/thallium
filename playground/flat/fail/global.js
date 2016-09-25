"use strict"

var t = require("../../../index.js")

function fail(t) {
    t.fail("fail")
}

t.test("works", fail)
t.test("doesn't work", fail)
t.test("what", fail)
t.test("ever", fail)
t.test("you may stop now", fail)
