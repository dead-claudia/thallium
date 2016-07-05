"use strict"

// This is a reporter that mimics Mocha's `dot` reporter

var R = require("../lib/reporter.js")
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
    accepts: ["print", "write", "reset", "colors"],
    create: R.consoleReporter,
    before: R.setColor,
    after: R.unsetColor,
    init: function (state) { state.counter = 0 },

    report: function (r, ev) {
        if (ev.enter() || ev.pass()) {
            return printDot(r, R.speed(ev))
        } else if (ev.fail()) {
            r.pushError(ev, false)
            return printDot(r, "fail")
        } else if (ev.skip()) {
            return printDot(r, "skip")
        } else if (ev.extra()) {
            return r.pushError(ev, true)
        } else if (ev.end()) {
            return r.print().then(function () { return r.printResults() })
        } else if (ev.error()) {
            if (r.state.counter) {
                return r.print().then(function () { return r.printError(ev) })
            } else {
                return r.printError(ev)
            }
        } else {
            return undefined
        }
    },
})
