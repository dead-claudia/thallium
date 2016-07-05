"use strict"

// This is a basic TAP-generating reporter.

var Promise = require("bluebird")
var R = require("../lib/reporter/index.js")
var inspect = require("../lib/inspect.js")

function shouldBreak(minLength, str) {
    return str.length > R.windowWidth - minLength || /\r?\n|[:?-]/.test(str)
}

function template(r, ev, tmpl, skip) {
    if (!skip) r.state.counter++

    return r.print(
        tmpl.replace(/%c/g, r.state.counter)
            .replace(/%p/g, R.joinPath(ev).replace(/\$/g, "$$$$")))
}

function printLines(r, value, skipFirst) {
    var lines = value.replace(/^/gm, "    ").split(/\r?\n/g)

    if (skipFirst) lines = lines.slice(1)
    return Promise.each(lines, function (line) { return r.print(line) })
}

function printRaw(r, key, str) {
    if (shouldBreak(key.length, str)) {
        return r.print("  " + key + ": |-")
        .then(function () { return printLines(r, str, false) })
    } else {
        return r.print("  " + key + ": " + str)
    }
}

function printValue(r, key, value) {
    return printRaw(r, key, inspect(value))
}

function printLine(p, r, line) {
    return p.then(function () { return r.print(line) })
}

function printError(r, ev) {
    var err = ev.value

    if (!(err instanceof Error)) {
        return printValue(r, "value", err)
    }

    // Let's *not* depend on the constructor being Thallium's...
    if (err.name !== "AssertionError") {
        return r.print("  stack: |-").then(function () {
            return printLines(r, R.getStack(err), false)
        })
    }

    return printValue(r, "expected", err.expected)
    .then(function () { return printValue(r, "actual", err.actual) })
    .then(function () { return printRaw(r, "message", err.message) })
    .then(function () { return r.print("  stack: |-") })
    .then(function () {
        var message = err.message

        err.message = ""
        return printLines(r, R.getStack(err), true)
        .then(function () { err.message = message })
    })
}

module.exports = R.on({
    accepts: ["print", "reset"],
    create: R.consoleReporter,
    init: function (state) { state.counter = 0 },

    report: function (r, ev) {
        if (ev.start()) {
            return r.print("TAP version 13")
        } else if (ev.enter()) {
            // Print a leading comment, to make some TAP formatters prettier.
            return template(r, ev, "# %p", true)
            .then(function () { return template(r, ev, "ok %c") })
        } else if (ev.pass()) {
            return template(r, ev, "ok %c %p")
        } else if (ev.fail()) {
            return template(r, ev, "not ok %c %p")
            .then(function () { return r.print("  ---") })
            .then(function () { return printError(r, ev) })
            .then(function () { return r.print("  ...") })
        } else if (ev.skip()) {
            return template(r, ev, "ok %c # skip %p")
        } else if (ev.extra()) {
            return template(r, ev, "not ok %c %p # extra")
            .then(function () { return r.print("  ---") })
            .then(function () { return printValue(r, "count", ev.value.count) })
            .then(function () { return printValue(r, "value", ev.value.value) })
            .then(function () { return r.print("  ...") })
        } else if (ev.end()) {
            var p = r.print("1.." + r.state.counter)
            .then(function () { return r.print("# tests " + r.tests) })

            if (r.pass) p = printLine(p, r, "# pass " + r.pass)
            if (r.fail) p = printLine(p, r, "# fail " + r.fail)
            if (r.skip) p = printLine(p, r, "# skip " + r.skip)
            return printLine(p, r, "# duration " + R.formatTime(r.duration))
        } else if (ev.error()) {
            return r.print("Bail out!")
            .then(function () { return r.print("  ---") })
            .then(function () { return printError(r, ev) })
            .then(function () { return r.print("  ...") })
        } else {
            return undefined
        }
    },
})
