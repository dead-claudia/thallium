"use strict"

module.exports = require("../lib/browser-bundle")

require("../migrate/index")

// Note: both of these are deprecated
module.exports.assertions = require("../assertions")
module.exports.create = require("../migrate/common").deprecate(
    "`tl.create` is deprecated. Please use `tl.root` instead.",
    module.exports.root)
