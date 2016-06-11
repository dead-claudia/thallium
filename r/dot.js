"use strict"

// This is a reporter that mimics Mocha's `dot` reporter

var R = require("../lib/reporter/index.js")
var width = R.windowWidth * 0.75 | 0

function printDot(r, color) {
    if (r.state.counter++ % width === 0) {
        return r.write(R.newline + "  ")
        .then(function () { return r.write(R.color(color, R.Symbols.Dot)) })
    } else {
        return r.write(R.color(color, R.Symbols.Dot))
    }
}

module.exports = R.on({
    init: function (state) { state.counter = 0 },
    start: function () {},
    enter: function (r, ev) { return printDot(r, R.speed(ev)) },
    // This is meaningless for the output.
    leave: function () {},
    pass: function (r, ev) { return printDot(r, R.speed(ev)) },

    fail: function (r, ev) {
        r.pushError(ev, false)
        return printDot(r, "fail")
    },

    skip: function (r) { return printDot(r, "skip") },
    extra: function (r, ev) { r.pushError(ev, true) },

    end: function (r) {
        return r.print().then(function () { return r.printResults() })
    },

    error: function (r, ev) {
        if (r.state.counter) {
            return r.print().then(function () { return r.printError(ev) })
        } else {
            return r.printError(ev)
        }
    },
})
