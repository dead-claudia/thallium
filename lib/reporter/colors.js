"use strict"

var Console = require("./console.js")

// Console.colorSupport is a mask with the following bits:
// 0x1 - if set, colors supported by default
// 0x2 - if set, force color support
module.exports = {
    mask: Console.colorSupport|0,
    supported: (Console.colorSupport & 0x1) !== 0,
    forced: (Console.colorSupport & 0x2) !== 0,

    maybeSet: function (value) {
        if (!this.forced) this.supported = !!value
    },

    maybeRestore: function () {
        if (!this.forced) this.supported = (this.mask & 0x1) !== 0
    },

    // Only for debugging
    forceSet: function (value) {
        this.supported = !!value
        this.forced = true
    },

    forceRestore: function () {
        this.supported = (this.mask & 0x1) !== 0
        this.forced = (this.mask & 0x2) !== 0
    },
}
