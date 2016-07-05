"use strict"

/**
 * This contains the browser console stuff.
 */

exports.Symbols = Object.freeze({
    Pass: "✓",
    Fail: "✖",
    Dot: "․",
})

exports.windowWidth = 75
exports.newline = "\n"

// Color support is unforced and unsupported, since you can only specify
// line-by-line colors via CSS, and even that isn't very portable.
exports.colorSupport = 0

/**
 * Since browsers don't have unbuffered output, this kind of simulates it.
 */

var acc = ""

exports.defaultOpts = {
    reset: function (callback) {
        if (acc !== "") {
            global.console.log(acc)
            acc = ""
        }

        callback()
    },

    log: function (line, callback) {
        return this.write(line + "\n", callback)
    },

    write: function (str, callback) {
        acc += str

        var index = str.indexOf("\n")

        if (index >= 0) {
            var lines = str.split("\n")

            acc = lines.pop()

            for (var i = 0; i < lines.length; i++) {
                global.console.log(lines[i])
            }
        }

        return callback()
    },
}
