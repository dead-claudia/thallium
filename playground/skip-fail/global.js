"use strict"

var t = require("../..")
var fail = require("../../assert").fail

t.testSkip("works")
t.test("doesn't work", fail)
t.testSkip("what")
t.testSkip("ever")
t.testSkip("you may stop now")
