"use strict"

// This is a reporter that mimics Mocha's `dot` reporter

var R = require("../lib/reporter")

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
    accepts: ["write", "reset", "colors"],
    create: R.consoleReporter,
    before: R.setColor,
    after: R.unsetColor,
    init: function (state) { state.counter = 0 },

    report: function (_, report) {
        if (report.isEnter || report.isPass) {
            return printDot(_, R.speed(report))
        } else if (report.isHook || report.isFail) {
            _.pushError(report)
            return printDot(_, "fail")
        } else if (report.isSkip) {
            return printDot(_, "skip")
        } else if (report.isEnd) {
            return _.print().then(_.printResults.bind(_))
        } else if (report.isError) {
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
