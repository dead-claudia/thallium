/* eslint strict: [2, "global"] */
/* eslint-env node */
"use strict"

// Main entry point, for those wanting to use this framework with the core
// assertions.
module.exports = require("./core.js").base().use(require("./assertions.js"))
