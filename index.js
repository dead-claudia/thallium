"use strict"

// Main entry point, for those wanting to use this framework with the core
// assertions.
var Techtonic = require("./lib/techtonic.js")
module.exports = new Techtonic().use(require("./assertions.js"))
