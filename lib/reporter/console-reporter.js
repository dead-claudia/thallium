"use strict"

var diff = require("diff")

var methods = require("../methods")
var inspect = require("clean-assert-util").inspect
var Util = require("../util")
var Console = require("../replaced/console")
var assert = Util.assert

var Reporter = require("./reporter")
var RUtil = require("./util")

function printTime(_, color, count, label) {
    assert(_ != null && typeof _ === "object")
    assert(typeof color === "string")
    assert(typeof count === "number")
    assert(typeof label === "string")
    if (count === 0) return undefined

    var str = RUtil.color(color, "  " + count + label)

    if (!_.timePrinted) {
        _.timePrinted = true
        str += RUtil.color("light", " (" + RUtil.formatTime(_.duration) + ")")
    }

    return _.print(str)
}

function unifiedDiff(err) {
    assert(err != null && typeof err === "object")
    assert(err.name === "AssertionError")

    var actual = inspect(err.actual)
    var expected = inspect(err.expected)
    var msg = diff.createPatch("string", actual, expected)
    var header = Console.newline +
        RUtil.color("diff added", "+ expected") + " " +
        RUtil.color("diff removed", "- actual") +
        Console.newline + Console.newline

    return header + msg.split(/\r?\n|\r/g).slice(4)
    .filter(function (line) { return !/^\@\@|^\\ No newline/.test(line) })
    .map(function (line) {
        switch (line[0]) {
        case "+": return RUtil.color("diff added", line.trimRight())
        case "-": return RUtil.color("diff removed", line.trimRight())
        default: return line.trimRight()
        }
    })
    .join(Console.newline)
}

function formatFail(str) {
    return str.trimRight()
    .split(/\r?\n|\r/g)
    .map(function (line) { return RUtil.color("fail", line.trimRight()) })
    .join(Console.newline)
}

function getDiffStack(e) {
    assert(e instanceof Error)

    var description = formatFail(e.name + ": " + e.message)

    if (e.name === "AssertionError" && e.showDiff !== false) {
        description += Console.newline + unifiedDiff(e)
    }

    var stripped = formatFail(RUtil.readStack(e))

    if (stripped === "") return description
    return description + Console.newline + stripped
}

function inspectTrimmed(object) {
    return inspect(object).trimRight()
    .split(/\r?\n|\r/g)
    .map(function (line) { return line.trimRight() })
    .join(Console.newline)
}

function printFailList(_, err) {
    assert(_ != null && typeof _ === "object")

    var str = err instanceof Error ? getDiffStack(err) : inspectTrimmed(err)
    var parts = str.split(/\r?\n/g)

    return _.print("    " + parts[0]).then(function () {
        return Util.peach(parts.slice(1), function (part) {
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
 * @param {Object} methods The actions for the reporter.
 * @param {Function} opts.write The unbufferred writer for the reporter.
 */
function ConsoleReporter(opts, methods) {
    assert(opts == null || typeof opts === "object")
    assert(methods != null && typeof methods === "object")

    Reporter.call(this, RUtil.Tree, opts, methods, true)

    if (!Console.colorSupport.isForced &&
            methods.accepts.indexOf("color") >= 0) {
        this.opts.color = opts.color
    }

    RUtil.defaultify(this, opts, "write")
    this.reset()
}

methods(ConsoleReporter, Reporter, {
    print: function (str) {
        if (str == null) str = ""
        assert(typeof str === "string")
        return Promise.resolve(this.opts.write(str + "\n"))
    },

    write: function (str) {
        if (str != null) {
            assert(typeof str === "string")
            return Promise.resolve(this.opts.write(str))
        } else {
            return Promise.resolve()
        }
    },

    printResults: function () {
        var self = this

        if (!this.tests && !this.skip) {
            return this.print(
                RUtil.color("plain", "  0 tests") +
                RUtil.color("light", " (0ms)"))
            .then(function () { return self.print() })
        }

        return this.print()
        .then(function () {
            return printTime(self, "green", self.pass, " passing")
        })
        .then(function () {
            return printTime(self, "skip", self.skip, " skipped")
        })
        .then(function () {
            return printTime(self, "fail", self.fail, " failing")
        })
        .then(function () { return self.print() })
        .then(function () {
            return Util.peach(self.errors, function (report, i) {
                var name = i + 1 + ") " + RUtil.joinPath(report) +
                    RUtil.formatRest(report)

                return self.print("  " + RUtil.color("plain", name + ":"))
                .then(function () {
                    return printFailList(self, report.error)
                })
                .then(function () { return self.print() })
            })
        })
    },

    printError: function (report) {
        assert(report != null && typeof report === "object")

        var self = this
        var lines = report.error instanceof Error
            ? RUtil.getStack(report.error)
            : inspectTrimmed(report.error)

        return this.print().then(function () {
            return Util.peach(lines.split(/\r?\n/g), function (line) {
                return self.print(line)
            })
        })
    },
})
