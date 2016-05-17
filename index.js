"use strict"

/**
 * Main entry point, for those wanting to use this framework with the core
 * assertions.
 */
const Thallium = require("./lib/thallium.js")

module.exports = new Thallium().use(require("./assertions.js"))
