"use strict"

var diff = require("diff")

var methods = require("../methods")
var inspect = require("clean-assert-util").inspect
var peach = require("../util").peach
var Reporter = require("./reporter")
var Util = require("./util")
var Settings = require("../settings")

function printTime(_, p, str) {
    if (!_.timePrinted) {
        _.timePrinted = true
        str += Util.color("light", " (" + Util.formatTime(_.duration) + ")")
    }

    return p.then(function () { return _.print(str) })
}

function unifiedDiff(err) {
    var actual = inspect(err.actual)
    var expected = inspect(err.expected)
    var msg = diff.createPatch("string", actual, expected)
    var header = Settings.newline() +
        Util.color("diff added", "+ expected") + " " +
        Util.color("diff removed", "- actual") +
        Settings.newline() + Settings.newline()

    return header + msg.split(/\r?\n|\r/g).slice(4)
    .filter(function (line) { return !/^\@\@|^\\ No newline/.test(line) })
    .map(function (line) {
        if (line[0] === "+") return Util.color("diff added", line.trimRight())
        if (line[0] === "-") return Util.color("diff removed", line.trimRight())
        return line.trimRight()
    })
    .join(Settings.newline())
}

function formatFail(str) {
    return str.trimRight()
    .split(/\r?\n|\r/g)
    .map(function (line) { return Util.color("fail", line.trimRight()) })
    .join(Settings.newline())
}

function getDiffStack(e) {
    var description = formatFail(e.name + ": " + e.message)

    if (e.name === "AssertionError" && e.showDiff !== false) {
        description += Settings.newline() + unifiedDiff(e)
    }

    var stripped = formatFail(Util.readStack(e))

    if (stripped === "") return description
    return description + Settings.newline() + stripped
}

function inspectTrimmed(object) {
    return inspect(object).trimRight()
    .split(/\r?\n|\r/g)
    .map(function (line) { return line.trimRight() })
    .join(Settings.newline())
}

function printFailList(_, err) {
    var str = err instanceof Error ? getDiffStack(err) : inspectTrimmed(err)
    var parts = str.split(/\r?\n/g)

    return _.print("    " + parts[0]).then(function () {
        return peach(parts.slice(1), function (part) {
            return _.print(part ? "      " + part : "")
        })
    })
}

module.exports = function (opts, methods) {
    return new ConsoleReporter(opts, methods)
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
 * @param {Function} opts.write The unbufferred writer for the reporter.
 * @param {Function} opts.reset A reset function for the printer + writer.
 * @param {String[]} accepts The options accepted.
 * @param {Function} init The init function for the subclass reporter's
 *                        isolated state (created by factory).
 */
function ConsoleReporter(opts, methods) {
    Reporter.call(this, Util.Tree, opts, methods, true)

    if (!Util.Colors.forced() && methods.accepts.indexOf("color") >= 0) {
        this.opts.color = opts.color
    }

    Util.defaultify(this, opts, "write")
    this.reset()
}

methods(ConsoleReporter, Reporter, {
    print: function (str) {
        if (str == null) str = ""
        return Promise.resolve(this.opts.write(str + "\n"))
    },

    write: function (str) {
        if (str != null) {
            return Promise.resolve(this.opts.write(str))
        } else {
            return Promise.resolve()
        }
    },

    printResults: function () {
        var self = this

        if (!this.tests && !this.skip) {
            return this.print(
                Util.color("plain", "  0 tests") +
                Util.color("light", " (0ms)"))
            .then(function () { return self.print() })
        }

        return this.print().then(function () {
            var p = Promise.resolve()

            if (self.pass) {
                p = printTime(self, p,
                    Util.color("bright pass", "  ") +
                    Util.color("green", self.pass + " passing"))
            }

            if (self.skip) {
                p = printTime(self, p,
                    Util.color("skip", "  " + self.skip + " skipped"))
            }

            if (self.fail) {
                p = printTime(self, p,
                    Util.color("bright fail", "  ") +
                    Util.color("fail", self.fail + " failing"))
            }

            return p
        })
        .then(function () { return self.print() })
        .then(function () {
            return peach(self.errors, function (report, i) {
                var name = i + 1 + ") " + Util.joinPath(report) +
                    Util.formatRest(report)

                return self.print("  " + Util.color("plain", name + ":"))
                .then(function () {
                    return printFailList(self, report.error)
                })
                .then(function () { return self.print() })
            })
        })
    },

    printError: function (report) {
        var self = this
        var lines = report.error instanceof Error
            ? Util.getStack(report.error)
            : inspectTrimmed(report.error)

        return this.print().then(function () {
            return peach(lines.split(/\r?\n/g), function (line) {
                return self.print(line)
            })
        })
    },
})
