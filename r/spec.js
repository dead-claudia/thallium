"use strict"

// This is a reporter that mimics Mocha's `spec` reporter.

var peach = require("../lib/util.js").peach
var R = require("../lib/reporter.js")
var c = R.color

function indent(level) {
    var ret = ""

    while (level--) ret += "  "
    return ret
}

function getName(level, report) {
    return report.path[level - 1].name
}

function printReport(_, init) {
    if (_.state.lastIsNested && _.state.level === 1) {
        return _.print().then(function () {
            _.state.lastIsNested = false
            return _.print(indent(_.state.level) + init())
        })
    } else {
        _.state.lastIsNested = false
        return _.print(indent(_.state.level) + init())
    }
}

module.exports = R.on({
    accepts: ["print", "reset", "colors"],
    create: R.consoleReporter,
    before: R.setColor,
    after: R.unsetColor,

    init: function (state) {
        state.level = 1
        state.lastIsNested = false
    },

    report: function (_, report) {
        if (report.start) {
            if (report.path.length === 0) return _.print()

            return _.print().then(function () {
                return peach(report.path, function (entry) {
                    return _.print(indent(_.state.level++) + entry.name)
                })
            })
        } else if (report.enter) {
            return printReport(_, function () {
                return getName(_.state.level++, report)
            })
        } else if (report.leave) {
            _.state.level--
            _.state.lastIsNested = true
            return undefined
        } else if (report.pass) {
            return printReport(_, function () {
                var str =
                    c("checkmark", R.symbols().Pass + " ") +
                    c("pass", getName(_.state.level, report))

                var speed = R.speed(report)

                if (speed !== "fast") {
                    str += c(speed, " (" + report.duration + "ms)")
                }

                return str
            })
        } else if (report.hook || report.fail) {
            return printReport(_, function () {
                _.pushError(report)
                var name = getName(_.state.level, report)

                if (report.hook) name += " (" + report.value.stage + ")"
                return c("fail", _.errors.length + ") " + name)
            })
        } else if (report.skip) {
            return printReport(_, function () {
                return c("skip", "- " + getName(_.state.level, report))
            })
        }

        if (report.end) return _.printResults()
        if (report.error) return _.printError(report)
        return undefined
    },
})
