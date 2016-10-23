"use strict"

// This is a reporter that mimics Mocha's `dot` reporter

var R = require("../lib/reporter.js")

function width() {
    return R.windowWidth() * 4 / 3 | 0
}

function printDot(_, color) {
    if (_.state.counter++ % width() === 0) {
        return _.write(R.newline() + "  ")
        .then(function () { return _.write(R.color(color, R.symbols().Dot)) })
    } else {
        return _.write(R.color(color, R.symbols().Dot))
    }
}

module.exports = R.on({
    accepts: ["print", "write", "reset", "colors"],
    create: R.consoleReporter,
    before: R.setColor,
    after: R.unsetColor,
    init: function (state) { state.counter = 0 },

    report: function (_, report) {
        if (report.enter || report.pass) {
            return printDot(_, R.speed(report))
        } else if (report.hook || report.fail) {
            _.pushError(report)
            return printDot(_, "fail")
        } else if (report.skip) {
            return printDot(_, "skip")
        } else if (report.end) {
            return _.print().then(_.printResults.bind(_))
        } else if (report.error) {
            if (_.state.counter) {
                return _.print().then(_.printError.bind(_, report))
            } else {
                return _.printError(report)
            }
        } else {
            return undefined
        }
    },
})
