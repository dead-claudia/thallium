"use strict"

var t = require("../../index.js")

t.reporter(require("../../test-util/cli/pipe-reporter.js"))

module.exports = {thallium: t}
