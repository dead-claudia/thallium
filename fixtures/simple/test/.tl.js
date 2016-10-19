"use strict"

var t = require("../../../index.js")

t.reporter(require("../../../scripts/cli/pipe-reporter.js"))

module.exports = {thallium: t, files: "./*.js"}
