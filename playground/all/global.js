"use strict"

var t = require("../..")
var fail = require("../../assert").fail

t.test("works", function () {})
t.test("doesn't work", fail)
t.test("what", function () {})
t.testSkip("ever")
t.test("you may stop now", function () {})
