"use strict"

// Main entry point, for those wanting to use this framework with the core
// assertions.
module.exports = require("./lib/core.js")().use(require("./assertions.js"))
