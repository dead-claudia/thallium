"use strict"

const t = require("../../../../index.js")

t.reporter(require("../../../../test-util/pipe-reporter.js"))

module.exports = {thallium: t, files: "./*.js"}
