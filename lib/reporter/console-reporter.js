"use strict"

var Promise = require("bluebird")
var Reporter = require("./reporter.js")
var m = require("../messages.js")
var methods = require("../methods.js")
var inspect = require("../inspect.js")
var Tree = require("./tree.js")
var Resolver = require("../resolver.js")
var ReporterUtil = require("./util.js")
var Stack = require("./stack.js")
var color = require("./color.js")
var Colors = require("./colors.js")

function promisify1(f, inst) {
    return function (line) { return Resolver.resolve1(f, inst, line) }
}

function simpleInspect(value) {
    if (value instanceof Error) {
        return Stack.getStack(value)
    } else {
        return inspect(value)
    }
}

function printTime(r, p, str) {
    if (!r.timePrinted) {
        r.timePrinted = true
        str += color("light", " (" + ReporterUtil.formatTime(r.duration) + ")")
    }

    return p.then(function () { return r.print(str) })
}

function printFailList(r, pre, str) {
    var parts = str.split(/\r?\n/g)

    return r.print("    " + color("fail", pre + parts[0].trim()))
    .return(parts.slice(1)).each(function (part) {
        return r.print("      " + color("fail", part.trim()))
    })
}

/**
 * Base class for most console reporters.
 *
 * Note: printing is asynchronous, because otherwise, if enough errors exist,
 * Node will eventually start dropping lines sent to its buffer, especially when
 * stack traces get involved. If Thallium's output is redirected, that can be a
 * big problem for consumers, as they only have part of the output, and won't be
 * able to see all the errors later. Also, if console warnings come up en-masse,
 * that would also contribute. So, we have to wait for each line to flush before
 * we can continue, so the full output makes its way to the console.
 *
 * Some test frameworks like Tape miss this, though.
 *
 * @param {Object} opts The options for the reporter.
 * @param {Function} opts.print The printer for the reporter.
 * @param {Function} opts.write The unbufferred writer for the reporter.
 * @param {Function} opts.reset A reset function for the printer + writer.
 * @param {String[]} accepts The options accepted.
 * @param {Function} init The init function for the subclass reporter's
 *                        isolated state (created by factory).
 */
module.exports = ConsoleReporter
function ConsoleReporter(opts, methods) {
    if (ReporterUtil.isReport(opts)) {
        throw new TypeError(m("type.reporter.argument"))
    }

    Reporter.call(this, Tree.Tree, opts, methods, true)

    if (!Colors.forced && methods.accepts.indexOf("color") >= 0) {
        this.opts.color = opts.color
    }

    ReporterUtil.defaultify(this, "print", promisify1)
    ReporterUtil.defaultify(this, "write", promisify1)
    this.reset()
}

methods(ConsoleReporter, Reporter, {
    print: function (str) {
        if (str == null) str = ""
        return this.opts.print(str)
    },

    write: function (str) {
        if (str != null) {
            return this.opts.write(str)
        } else {
            return Promise.resolve()
        }
    },

    printResults: function () {
        var self = this

        if (!this.tests && !this.skip) {
            return this.print(
                color("plain", "  0 tests") +
                color("light", " (0ms)"))
            .then(function () { return self.print() })
        }

        return this.print().then(function () {
            var p = Promise.resolve()

            if (self.pass) {
                p = printTime(self, p,
                    color("bright pass", "  ") +
                    color("green", self.pass + " passing"))
            }

            if (self.skip) {
                p = printTime(self, p,
                    color("skip", "  " + self.skip + " skipped"))
            }

            if (self.fail) {
                p = printTime(self, p,
                    color("bright fail", "  ") +
                    color("fail", self.fail + " failing"))
            }

            return p
        })
        .then(function () { return self.print() })
        .return(this.errors).each(function (spec, i) {
            var name = i + 1 + ") " + ReporterUtil.joinPath(spec.event) + ":"
            var value = spec.event.value
            var p

            if (spec.extra) {
                p = self.print("  " + color("plain", name + " (extra)"))
                .then(function () {
                    // Smaller inspection than the full stack util.inspect
                    // gives.

                    var err = value.value
                    var str

                    if (err instanceof Error &&
                            typeof err.inspect !== "function") {
                        str = "[" + err.name + ": " + err.message + "]"
                    } else {
                        str = inspect(err)
                    }

                    return printFailList(self, "- value: ", str)
                })
                .then(function () {
                    return printFailList(self, "- ", value.stack)
                })
            } else {
                p = self.print("  " + color("plain", name))
                .then(function () {
                    return printFailList(self, "", simpleInspect(value))
                })
            }

            return p.then(function () { return self.print() })
        })
    },

    printError: function (ev) {
        var self = this

        return this.print()
        .return(simpleInspect(ev.value).split(/\r?\n/g))
        .each(function (line) { return self.print(line) })
    },
})
