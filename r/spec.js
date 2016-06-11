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

function printReport(init) {
    return function (r, ev) {
        return Promise.try(function () {
            if (r.state.lastIsNested && r.state.level === 1) return r.print()
            else return undefined
        })
        .then(function () {
            r.state.lastIsNested = false
            return r.print(indent(r.state.level) + init(r, ev))
        })
    }
}

module.exports = R.on({
    init: function (state) {
        state.level = 1
        state.lastIsNested = false
    },

    start: function (r, ev) {
        if (ev.path.length === 0) return r.print()

        return r.print().return(ev.path).each(function (entry) {
            return r.print(indent(r.state.level++) + entry.name)
        })
    },

    enter: printReport(function (r, ev) {
        return getName(r.state.level++, ev)
    }),

    leave: function (r) {
        r.state.level--
        r.state.lastIsNested = true
    },

    pass: printReport(function (r, ev) {
        var str =
            c("checkmark", R.Symbols.Pass + " ") +
            c("pass", getName(r.state.level, ev))

        var speed = R.speed(ev)

        if (speed !== "fast") {
            str += c(speed, " (" + ev.duration + "ms)")
        }

        return str
    }),

    fail: printReport(function (r, ev) {
        r.pushError(ev, false)
        return c("fail", r.errors.length + ") " + getName(r.state.level, ev))
    }),

    skip: printReport(function (r, ev) {
        return c("skip", "- " + getName(r.state.level, ev))
    }),

    extra: function (r, ev) { r.pushError(ev, true) },
    end: function (r) { return r.printResults() },
    error: function (r, ev) { return r.printError(ev) },
})
