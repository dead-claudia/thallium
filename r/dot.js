"use strict"

// This is a reporter that mimics Mocha's `dot` reporter

var R = require("../lib/reporter.js")

function width() {
    return R.windowWidth() * 4 / 3 | 0
}

function printDot(r, color) {
    if (r.state.counter++ % width() === 0) {
        return r.write(R.newline() + "  ")
        .then(function () { return r.write(R.color(color, R.symbols().Dot)) })
    } else {
        return r.write(R.color(color, R.symbols().Dot))
    }
}

module.exports = R.on({
    accepts: ["print", "write", "reset", "colors"],
    create: R.consoleReporter,
    before: R.setColor,
    after: R.unsetColor,
    init: function (state) { state.counter = 0 },

    report: function (r, ev) {
        if (ev.enter || ev.pass) {
            return printDot(r, R.speed(ev))
        } else if (ev.hook || ev.fail) {
            r.pushError(ev)
            return printDot(r, "fail")
        } else if (ev.skip) {
            return printDot(r, "skip")
        } else if (ev.end) {
            return r.print().then(function () { return r.printResults() })
        } else if (ev.error) {
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
