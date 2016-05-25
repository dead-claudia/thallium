"use strict"

// This is a basic TAP-generating reporter.

var Promise = require("bluebird")
var methods = require("../lib/common.js").methods
var R = require("../lib/reporter.js")
var c = R.color

function Reporter() {
    R.Reporter.apply(this, arguments)
}

function simpleInspect(value) {
    if (value instanceof Error) {
        return value.stack
    } else {
        return R.inspect(value)
    }
}

methods(Reporter, R.Reporter, {
    reset: function () {
        R.Reporter.prototype.reset.call(this)

        this.errorSpecs = []
        this.level = 1
        this.initialDepth = 0
        this.lastIsNested = false
    },

    indent: function () {
        var level = this.level
        var ret = ""

        while (level--) ret += "  "
        return ret
    },

    name: function (ev) {
        return ev.path[this.level - 1].name
    },

    printFailList: function (pre, str) {
        var parts = str.split(/\r?\n/g)

        return this.print("    " + c("fail", pre + parts[0].trim()))
        .return(parts.slice(1)).each(/** @this */ function (part) {
            return this.print("      " + c("fail", part.trim()))
        })
    },

    printError: function (path, index, value) {
        return this.print("  " + c("plain", index + 1 + ") " + path + ":"))
        .then(/** @this */ function () {
            return this.printFailList("", simpleInspect(value))
        })
    },

    printExtra: function (path, index, value) {
        var str = c("plain", index + 1 + ") " + path + ": (extra)")

        return this.print("  " + str)
        .tap(/** @this */ function () {
            return this.printFailList("- value: ", R.inspect(value.value))
        })
        .then(/** @this */ function () {
            return this.printFailList("- ", value.stack)
        })
    },

    initStatus: function (ev, status) {
        this.tree.getPath(ev.path).status = status
        this.tests++
    },

    printReport: function (ev, status, init) {
        return Promise.bind(this).then(/** @this */ function () {
            if (this.lastIsNested && this.level === 1) return this.print()
            else return undefined
        })
        .then(/** @this */ function () {
            this.initStatus(ev, status)
            this.lastIsNested = false
            return this.print(this.indent() + init.call(this, ev))
        })
    },

    printTestTotal: function () {
        if (this.tests === 1) return this.print(c("plain", "  1 test"))
        else return this.print(c("plain", "  " + this.tests + " tests"))
    },

    printSummary: function () {
        if (!this.pass && !this.skip && !this.fail) {
            return undefined
        }

        var p = Promise.bind(this)

        if (this.pass) {
            p = p.then(/** @this */ function () {
                return this.print(c("bright pass", "  ") +
                    c("green", this.pass + " passing"))
            })
        }

        if (this.skip) {
            p = p.then(/** @this */ function () {
                return this.print(c("skip", "  " + this.skip + " skipped"))
            })
        }

        if (this.fail) {
            p = p.then(/** @this */ function () {
                return this.print(c("bright fail", "  ") +
                    c("fail", this.fail + " failing"))
            })
        }

        return p.then(this.print)
    },

    printErrorList: function () {
        if (!this.errorSpecs.length) return undefined
        return Promise.bind(this, this.errorSpecs)
        .each(/** @this */ function (spec, i) {
            var path = R.joinPath(spec.event)
            var p

            if (spec.extra) {
                p = this.printExtra(path, i, spec.event.value)
            } else {
                p = this.printError(path, i, spec.event.value)
            }

            return p.return().then(this.print)
        })
    },

    report: function (ev) {
        switch (ev.type) {
        case "start":
            this.reset()

            if (ev.path.length === 0) return this.print()

            this.level = 0
            return this.print()
            .return(ev.path).each(/** @this */ function (entry) {
                this.indent++
                return this.print(this.indent() + entry.name)
            })
            .then(/** @this */ function () { this.level++ })

        case "enter":
            return this.printReport(ev, [], /** @this */ function (ev) {
                this.pass++
                return this.name(ev)
            })
            .then(/** @this */ function () { this.level++ })

        case "leave":
            this.level--
            this.lastIsNested = true
            return undefined

        case "pass":
            return this.printReport(ev, [], /** @this */ function (ev) {
                this.pass++
                return c("checkmark", R.Symbols.Pass + " ") +
                    c("pass", this.name(ev))
            })

        case "fail":
            var index = this.errorSpecs.length

            return this.printReport(ev, [index], /** @this */ function (ev) {
                this.fail++
                this.errorSpecs.push({event: ev, extra: false})
                return c("fail", index + 1 + ") " + this.name(ev))
            })

        case "skip":
            return this.printReport(ev, [], /** @this */ function (ev) {
                this.tests-- // Skipped tests shouldn't be counted in the total
                this.skip++
                return c("skip", "- " + this.name(ev))
            })

        case "extra":
            // Ignore calls after `end`, as there is no graceful way to handle
            // them
            if (!this.tests) return undefined

            // Extra calls get printed at the end
            var status = this.tree.getPath(ev.path).status

            if (!status.length) this.fail++
            status.push(this.errorSpecs.length)
            this.errorSpecs.push({event: ev, extra: true})
            return undefined

        case "end":
            if (!this.tests && !this.skip) {
                return this.print(c("plain", "  0 tests")).then(this.print)
            }

            return this.print()
            .then(/** @this */ function () {
                if (this.tests === 1) return this.print(c("plain", "  1 test"))
                else return this.print(c("plain", "  " + this.tests + " tests"))
            })
            .then(this.printSummary)
            .then(this.printErrorList)

        case "error":
            return this.print()
            .return(simpleInspect(ev.value).split(/\r?\n/g))
            .each(this.print)
            .then(this.reset)

        default:
            throw new TypeError("Unknown report type: \"" + ev.type + "\"")
        }
    },
})

module.exports = function (opts) {
    return new Reporter(opts).reporter()
}
