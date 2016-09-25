"use strict"

var t = require("../../../index.js")

function fail(t) {
    t.fail("fail")
}

t.test("works", function () {})
t.test("doesn't work", fail)
t.test("what", function () {})
t.test("ever", function () {})
t.test("you may stop now", function () {})
