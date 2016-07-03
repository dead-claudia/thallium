"use strict"

/* global console */

/**
 * This contains the browser-specific reporter stuff.
 */

/**
 * Default symbol map.
 */
exports.Symbols = Object.freeze({
    Pass: "✓",
    Fail: "✖",
    Dot: "․",
})

exports.windowWidth = 75
exports.newline = "\n"

/**
 * Since browsers don't have unbuffered output, this kind of simulates it.
 */

var acc = ""

exports.defaultOpts = {
    reset: function (callback) {
        if (acc !== "") {
            console.log(acc)
            acc = ""
        }

        callback()
    },

    log: function (line, callback) {
        if (acc !== "") {
            line += acc
            acc = ""
        }

        var lines = line.split("\n")

        // So lines are printed consistently.
        for (var i = 0; i < lines.length; i++) {
            console.log(lines[i])
        }

        return callback()
    },

    write: function (str, callback) {
        var index = str.indexOf("\n")

        if (index < 0) {
            acc += str
            return callback()
        }

        console.log(acc + str.slice(0, index))

        var lines = str.slice(index + 1).split("\n")

        acc = lines.pop()

        for (var i = 0; i < lines.length; i++) {
            console.log(lines[i])
        }

        return callback()
    },
}

// Conveniently unforced and unsupported, since you can only specify
// line-by-line colors via CSS, and even that isn't very portable.
exports.colorSupport = 0
