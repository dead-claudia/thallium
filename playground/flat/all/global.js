"use strict"

var t = require("thallium")

function fail(t) {
    t.fail("fail")
}

t.test("works", function () {})
t.test("doesn't work", fail)
t.test("what", function () {})
t.testSkip("ever", function () {})
t.test("you may stop now", function () {})
