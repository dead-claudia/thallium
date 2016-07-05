"use strict"

// This is a reporter that mimics Mocha's `spec` reporter.

var Promise = require("bluebird")
var R = require("../lib/reporter/index.js")
var c = R.color

function indent(level) {
    var ret = ""

    while (level--) ret += "  "
    return ret
}

function getName(level, ev) {
    return ev.path[level - 1].name
}

function printReport(r, ev, init) {
    return Promise.try(function () {
        if (r.state.lastIsNested && r.state.level === 1) return r.print()
        else return undefined
    })
    .then(function () {
        r.state.lastIsNested = false
        return r.print(indent(r.state.level) + init())
    })
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

    report: function (r, ev) {
        if (ev.start()) {
            if (ev.path.length === 0) return r.print()

            return r.print().return(ev.path).each(function (entry) {
                return r.print(indent(r.state.level++) + entry.name)
            })
        } else if (ev.enter()) {
            return printReport(r, ev, function () {
                return getName(r.state.level++, ev)
            })
        } else if (ev.leave()) {
            r.state.level--
            r.state.lastIsNested = true
            return undefined
        } else if (ev.pass()) {
            return printReport(r, ev, function () {
                var str =
                    c("checkmark", R.Symbols.Pass + " ") +
                    c("pass", getName(r.state.level, ev))

                var speed = R.speed(ev)

                if (speed !== "fast") {
                    str += c(speed, " (" + ev.duration + "ms)")
                }

                return str
            })
        } else if (ev.fail()) {
            return printReport(r, ev, function () {
                r.pushError(ev, false)
                return c("fail", r.errors.length + ") " +
                    getName(r.state.level, ev))
            })
        } else if (ev.skip()) {
            return printReport(r, ev, function () {
                return c("skip", "- " + getName(r.state.level, ev))
            })
        }

        if (ev.extra()) return r.pushError(ev, true)
        if (ev.end()) return r.printResults()
        if (ev.error()) return r.printError(ev)
        return undefined
    },
})
