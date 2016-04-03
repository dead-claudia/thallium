"use strict"

/**
 * Main entry point, for those wanting to use this framework with the core
 * assertions.
 */

exports.t = require("./techtonic.js").base()
    .use(require("./assertions.js"))
