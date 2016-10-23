"use strict"

module.exports = require("../lib/browser-bundle.js")

require("../migrate/index.js")

// Note: both of these are deprecated
module.exports.assertions = require("../assertions.js")
module.exports.create = require("../migrate/common.js").deprecate(
    "`tl.create` is deprecated. Please use `tl.root` instead.",
    module.exports.root)
