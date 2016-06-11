"use strict"

var methods = require("../methods.js")

/**
 * A settable color support reference. `mask` is a mask of one of the following:
 *
 * 0b00 = 0 -> unforced, color unsupported
 * 0b01 = 1 -> unforced, color supported
 * 0b10 = 2 -> forced, color unsupported
 * 0b11 = 3 -> forced, color supported
 *
 * Note that a mask is mostly used for more convenient way to return multiple
 * values for the default.
 */
module.exports = SupportsColor
function SupportsColor(mask) {
    this.defaultSupported = this.supported = mask & 0x1
    this.defaultForced = this.forced = mask & 0x2
}

methods(SupportsColor, {
    get: function () { return this.supported },
    set: function (value) { if (!this.forced) this.supported = value },
    reset: function () {
        this.supported = this.defaultSupported
        this.forced = this.defaultForced
    },
})
