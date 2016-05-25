"use strict"

// This is a basic TAP-generating reporter.

var Promise = require("bluebird")
var methods = require("../lib/common.js").methods
var R = require("../lib/reporter.js")
var inspect = require("util").inspect

var Status = R.Status

function shouldBreakLines(minLength, str) {
    return str.length > R.windowWidth - minLength ||
        /\r?\n|[:?-]/.test(str)
}

function Reporter() {
    R.Reporter.apply(this, arguments)
}

methods(Reporter, R.Reporter, {
    reset: function () {
        R.Reporter.prototype.reset.call(this)
        this.counter = 0
    },

    printTemplate: function (ev, tmpl, skip) {
        if (!skip) this.counter++

        return this.print(
            tmpl.replace(/%c/g, this.counter)
                .replace(/%p/g, R.joinPath(ev).replace(/\$/g, "$$$$")))
    },

    printLines: function (value, skipFirst) {
        var lines = value.replace(/^/gm, "    ").split(/\r?\n/)

        if (skipFirst) lines = lines.slice(1)
        return Promise.bind(this, lines).each(this.print)
    },

    printRaw: function (key, str) {
        if (shouldBreakLines(key.length, str)) {
            return this.print("  " + key + ": |-")
            .bind(this)
            .then(/** @this */ function () {
                return this.printLines(str, false)
            })
        } else {
            return this.print("  " + key + ": " + str)
        }
    },

    printValue: function (key, value) {
        return this.printRaw(key, inspect(value))
    },

    printError: function (ev) {
        var err = ev.value

        // Let's *not* depend on the constructor being Thallium's...
        if (!(err instanceof Error)) {
            return this.printValue(err)
        }

        if (err.name !== "AssertionError") {
            return this.print("  stack: |-").bind(this)
            .then(/** @this */ function () {
                return this.printLines(err.stack, false)
            })
        }

        return Promise.bind(this)
        .then(/** @this */ function () {
            return this.printValue("expected", err.expected)
        })
        .then(/** @this */ function () {
            return this.printValue("actual", err.actual)
        })
        .then(/** @this */ function () {
            return this.printRaw("message", err.message)
        })
        .then(/** @this */ function () {
            return this.print("  stack: |-")
        })
        .then(/** @this */ function () {
            var message = err.message

            err.message = ""
            return this.printLines(err.stack, true)
            .then(function () { err.message = message })
        })
    },

    report: function (ev) {
        switch (ev.type) {
        case "start":
            this.running = true
            return this.print("TAP version 13")

        case "enter":
            // Print a leading comment, to make some TAP formatters prettier.
            this.tests++
            this.pass++
            this.tree.getPath(ev.path).status = Status.Passing
            return this.printTemplate(ev, "# %p", true)
            .bind(this).then(/** @this */ function () {
                return this.printTemplate(ev, "ok %c")
            })

        // This is meaningless for the output.
        case "leave": return undefined

        case "pass":
            this.tests++
            this.pass++
            this.tree.getPath(ev.path).status = Status.Passing
            return this.printTemplate(ev, "ok %c %p")

        case "fail":
            this.tests++
            this.fail++
            this.tree.getPath(ev.path).status = Status.Failing
            return this.printTemplate(ev, "not ok %c %p").bind(this)
            .then(/** @this */ function () { return this.print("  ---") })
            .then(/** @this */ function () { return this.printError(ev) })
            .then(/** @this */ function () { return this.print("  ...") })

        case "skip":
            this.skip++
            this.tree.getPath(ev.path).status = Status.Skipped
            return this.printTemplate(ev, "ok %c # skip %p")

        case "extra":
            // Ignore calls after `end`, as there is no graceful way to handle
            // them
            if (!this.counter) return undefined

            var tree = this.tree.getPath(ev.path)

            if (tree.status < Status.Passing) {
                throw new Error("(Thallium internal) unreachable")
            }

            // Only resolve once.
            if (tree.status === Status.Passing) {
                tree.status = Status.Failing
                this.fail++
            }

            return this.printTemplate(ev, "not ok %c %p # extra").bind(this)
            .then(/** @this */ function () { return this.print("  ---") })
            .tap(/** @this */ function () {
                return this.printValue("count", ev.value.count)
            })
            .tap(/** @this */ function () {
                return this.printValue("value", ev.value.value)
            })
            .then(/** @this */ function () { return this.print("  ...") })

        case "end":
            var p = this.print("1.." + this.counter)
            .bind(this).then(/** @this */ function () {
                return this.print("# tests " + this.tests)
            })

            if (this.pass) {
                p = p.then(/** @this */ function () {
                    return this.print("# pass " + this.pass)
                })
            }

            if (this.fail) {
                p = p.then(/** @this */ function () {
                    return this.print("# fail " + this.fail)
                })
            }

            if (this.skip) {
                p = p.then(/** @this */ function () {
                    return this.print("# skip " + this.skip)
                })
            }

            return p.then(/** @this */ function () { this.reset() })

        case "error":
            return this.print("Bail out!").bind(this)
            .then(/** @this */ function () { return this.print("  ---") })
            .then(/** @this */ function () { return this.printError(ev) })
            .then(/** @this */ function () { return this.print("  ...") })
            .then(/** @this */ function () { this.reset() })

        default:
            throw new TypeError("Unknown report type: \"" + ev.type + "\"")
        }
    },
})

module.exports = function (opts) {
    var reporter = new Reporter(opts).reporter()

    reporter.block = true
    return reporter
}
