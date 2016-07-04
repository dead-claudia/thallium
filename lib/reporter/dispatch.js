"use strict"

var Promise = require("bluebird")
var Resolver = require("../resolver.js")
var Status = require("./status.js")
var ConsoleReporter = require("./console-reporter.js")
var Colors = require("./colors.js")
var hasOwn = Object.prototype.hasOwnProperty

function callEvent(methods, reporter, ev) {
    switch (ev.type) {
    case "start": return methods.start(reporter, ev)
    case "enter": return methods.enter(reporter, ev)
    case "leave": return methods.leave(reporter, ev)
    case "pass": return methods.pass(reporter, ev)
    case "fail": return methods.fail(reporter, ev)
    case "skip": return methods.skip(reporter, ev)
    case "extra": return methods.extra(reporter, ev)
    case "end": return methods.end(reporter, ev)
    case "error": return methods.error(reporter, ev)
    default: throw new Error("unreachable")
    }
}

function setColor(reporter) {
    if (reporter.opts.color != null) {
        Colors.maybeSet(reporter.opts.color)
    }
}

function unsetColor(reporter) {
    if (reporter.opts.color != null) {
        Colors.maybeRestore()
    }
}

/**
 * A macro of sorts, to simplify creating reporters.
 */
module.exports = function (methods) {
    if (methods.Reporter == null) methods.Reporter = ConsoleReporter
    if (methods.before == null) methods.before = setColor
    if (methods.after == null) methods.after = unsetColor

    return function (opts) {
        var reporter = new methods.Reporter(opts, methods)

        return function (ev) {
            if (!hasOwn.call(methods, ev.type)) {
                throw new TypeError("Unknown report type: \"" + ev.type + "\"")
            }

            // Only some events have common steps.
            switch (ev.type) {
            case "start":
                reporter.running = true
                break

            case "enter":
            case "pass":
                reporter.get(ev.path).status = Status.Passing
                reporter.duration += ev.duration
                reporter.tests++
                reporter.pass++
                break

            case "fail":
                reporter.get(ev.path).status = Status.Failing
                reporter.duration += ev.duration
                reporter.tests++
                reporter.fail++
                break

            case "skip":
                reporter.get(ev.path).status = Status.Skipped
                // Skipped tests aren't counted in the total test count
                reporter.skip++
                break

            case "extra":
                // Ignore calls after `end`, as there is no graceful way to
                // handle them
                if (!reporter.running) break

                var tree = reporter.get(ev.path)

                // Extra calls get printed at the end
                if (tree.status !== Status.Failing) {
                    tree.status = Status.Failing
                    reporter.fail++
                }
                break

            default:
                // No other event has any common steps to take.
            }

            return Promise.resolve(methods.before(reporter))
            .then(function () { return callEvent(methods, reporter, ev) })
            .finally(function () { return methods.after(reporter) })
            .finally(function () {
                if (ev.type === "end" || ev.type === "error") {
                    reporter.reset()
                    return Resolver.resolve0(reporter.opts.reset, reporter.opts)
                } else {
                    return undefined
                }
            })
        }
    }
}
