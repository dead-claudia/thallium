"use strict"

/**
 * Main entry point, for those wanting to use this framework with the core
 * assertions.
 */
var Thallium = require("./lib/thallium.js")

require("./lib/deprecated.js").main(module.exports = new Thallium())
