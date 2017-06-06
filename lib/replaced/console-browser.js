"use strict"

var methods = require("../methods")
var assert = require("../util").assert

/**
 * This contains the browser console stuff.
 */

exports.symbols = Object.freeze({
    Pass: "✓",
    Fail: "✖",
    Dot: "․",
    DotFail: "!",
})

exports.windowWidth = 75
exports.newline = "\n"

// Color support is unforced and unsupported, since you can only specify
// line-by-line colors via CSS, and even that isn't very portable.
exports.colorSupport = {
    isSupported: false,
    isForced: false,
}

/**
 * Since browsers don't have unbuffered output, this kind of simulates it.
 */

exports.Defaults = Defaults
function Defaults(opts) {
    this.opts = opts
    this.acc = ""
}

methods(Defaults, {
    write: function (str) {
        assert(typeof str === "string")
        var newline = this.opts.newline

        this.acc += str
        var index = str.indexOf(newline)

        if (index >= 0) {
            var lines = str.split(newline)

            this.acc = lines.pop()

            for (var i = 0; i < lines.length; i++) {
                global.console.log(lines[i])
            }
        }
    },

    reset: function () {
        if (this.acc !== "") {
            global.console.log(this.acc)
            this.acc = ""
        }
    },
})

var acc = ""

exports.defaults = {
    write: function (str) {
        assert(typeof str === "string")
        acc += str
        var index = str.indexOf(exports.newline)

        if (index >= 0) {
            var lines = str.split(exports.newline)

            acc = lines.pop()

            for (var i = 0; i < lines.length; i++) {
                global.console.log(lines[i])
            }
        }
    },

    reset: function () {
        if (acc !== "") {
            global.console.log(acc)
            acc = ""
        }
    },
}
