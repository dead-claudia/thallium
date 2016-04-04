"use strict"

/**
 * Main entry point, for those wanting to use this framework with the core
 * assertions.
 */

module.exports = require("./lib/techtonic.js").base()
    .use(require("./assertions.js"))
