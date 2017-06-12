"use strict"

var t = require("../../..")

t.reporter = require("../../../test-util/cli/pipe-reporter")
t.files = ["./*.js"]

module.exports = t
