"use strict"

const t = require("../../../../index.js")

t.reporter(require("../../../../test-util/pipe-reporter.js"))

module.exports = {techtonic: t, files: "./*.js"}
