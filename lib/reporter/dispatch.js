"use strict"

var Promise = require("bluebird")
var Resolver = require("../resolver.js")
var Status = require("./status.js")
var ConsoleReporter = require("./console-reporter.js")
var Colors = require("./colors.js")

exports.setColor = function (reporter) {
    if (reporter.opts.color != null) Colors.maybeSet(reporter.opts.color)
}

exports.unsetColor = function (reporter) {
    if (reporter.opts.color != null) Colors.maybeRestore()
}

exports.consoleReporter = function (opts, methods) {
    return new ConsoleReporter(opts, methods)
}

/**
 * A macro of sorts, to simplify creating reporters. It accepts an object with
 * the following parameters:
 *
 * `accepts: string[]` - The properties accepted. Everything else is ignored,
 * and it's partially there for documentation. This parameter is required.
 *
 * `create(opts, methods)` - Create a new reporter instance.  This parameter is
 * required. Note that `methods` refers to the parameter object itself.
 *
 * `init(state, opts)` - Initialize extra reporter state, if applicable.
 *
 * `before(reporter)` - Do things before each event, returning a possible
 * thenable when done. This defaults to a no-op.
 *
 * `after(reporter)` - Do things after each event, returning a possible
 * thenable when done. This defaults to a no-op.
 *
 * `report(reporter, ev)` - Handle a test report. This may return a possible
 * thenable when done, and it is required.
 */
exports.on = function (methods) {
    return function (opts) {
        var r = methods.create(opts, methods)

        return function (ev) {
            // Only some events have common steps.
            if (ev.start()) {
                r.running = true
            } else if (ev.enter() || ev.pass()) {
                r.get(ev.path).status = Status.Passing
                r.duration += ev.duration
                r.tests++
                r.pass++
            } else if (ev.fail()) {
                r.get(ev.path).status = Status.Failing
                r.duration += ev.duration
                r.tests++
                r.fail++
            } else if (ev.skip()) {
                r.get(ev.path).status = Status.Skipped
                // Skipped tests aren't counted in the total test count
                r.skip++
            } else if (ev.extra() && r.running) {
                // Ignore calls after `end`, as there is no graceful way to
                // handle them
                if (r.get(ev.path).status !== Status.Failing) {
                    r.get(ev.path).status = Status.Failing
                    r.fail++
                }
            }

            return Promise.resolve(
                typeof methods.before === "function"
                    ? methods.before(r)
                    : undefined)
            .then(function () { return methods.report(r, ev) })
            .finally(function () {
                return typeof methods.after === "function"
                    ? methods.after(r)
                    : undefined
            })
            .finally(function () {
                if (ev.end() || ev.error()) {
                    r.reset()
                    return Resolver.resolve0(r.opts.reset, r.opts)
                } else {
                    return undefined
                }
            })
        }
    }
}
