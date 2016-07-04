"use strict"

var Promise = require("bluebird")
var Resolver = require("../resolver.js")
var Status = require("./status.js")
var ConsoleReporter = require("./console-reporter.js")
var Colors = require("./colors.js")

function callEvent(methods, reporter, ev) {
    if (ev.start()) return methods.start(reporter, ev)
    if (ev.enter()) return methods.enter(reporter, ev)
    if (ev.leave()) return methods.leave(reporter, ev)
    if (ev.pass()) return methods.pass(reporter, ev)
    if (ev.fail()) return methods.fail(reporter, ev)
    if (ev.skip()) return methods.skip(reporter, ev)
    if (ev.extra()) return methods.extra(reporter, ev)
    if (ev.end()) return methods.end(reporter, ev)
    if (ev.error()) return methods.error(reporter, ev)
    throw new Error("unreachable")
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
            // Only some events have common steps.
            if (ev.start()) {
                reporter.running = true
            } else if (ev.enter() || ev.pass()) {
                reporter.get(ev.path).status = Status.Passing
                reporter.duration += ev.duration
                reporter.tests++
                reporter.pass++
            } else if (ev.fail()) {
                reporter.get(ev.path).status = Status.Failing
                reporter.duration += ev.duration
                reporter.tests++
                reporter.fail++
            } else if (ev.skip()) {
                reporter.get(ev.path).status = Status.Skipped
                // Skipped tests aren't counted in the total test count
                reporter.skip++
            } else if (ev.extra()) {
                // Ignore calls after `end`, as there is no graceful way to
                // handle them
                if (reporter.running) {
                    var tree = reporter.get(ev.path)

                    // Extra calls get printed at the end
                    if (tree.status !== Status.Failing) {
                        tree.status = Status.Failing
                        reporter.fail++
                    }
                }
            }

            return Promise.resolve(methods.before(reporter))
            .then(function () { return callEvent(methods, reporter, ev) })
            .finally(function () { return methods.after(reporter) })
            .finally(function () {
                if (ev.end() || ev.error()) {
                    reporter.reset()
                    return Resolver.resolve0(reporter.opts.reset, reporter.opts)
                } else {
                    return undefined
                }
            })
        }
    }
}
