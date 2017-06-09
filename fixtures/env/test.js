"use strict"

/* eslint-env node */
var t = require("thallium")

// Don't print anything
t.reporter = function () {}

console.log("ENV_FOO = " + process.env.ENV_FOO)
console.log("ENV_BAR = " + process.env.ENV_BAR)
console.log("ENV_BAZ = " + process.env.ENV_BAZ)
