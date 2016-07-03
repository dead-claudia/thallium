"use strict"

// TODO: add `diff` support

var Promise = require("bluebird")
var Util = require("../util.js")
var m = require("../messages.js")
var methods = require("../methods.js")
var inspect = require("../inspect.js")
// var diff = require("diff")
var Console = require("./console.js")
var Resolver = require("../resolver.js")

exports.Symbols = Console.Symbols
exports.windowWidth = Console.windowWidth
exports.newline = Console.newline

var stackIncludesMessage = (function () {
    var stack = Util.getStack(new Error("test"))

    //     Firefox, Safari                 Chrome, IE
    return !/^(@)?\S+\:\d+/.test(stack) && !/^\s*at/.test(stack)
})()

exports.stripMessage = stripMessage
function stripMessage(e) {
    if (stackIncludesMessage) {
        var stack = Util.getStack(e)
        var index = stack.indexOf(e.message)

        if (index < 0) return Util.getStack(e).replace(/^\s+/gm, "")
        index = stack.indexOf("\n", index + e.message.length)
        if (index < 0) return ""
        else return stack.slice(index + 1).replace(/^\s+/gm, "")
    }

    return Util.getStack(e).replace(/^\s+/gm, "")
}

exports.getStack = getStack
function getStack(e) {
    var description = (e.name + ": " + e.message).replace(/^\s+/gm, "")
    var stripped = stripMessage(e)

    if (stripped !== "") description += "\n" + stripped
    return description
}

// Console.colorSupport is a mask with the following bits:
// 0x1 - if set, colors supported by default
// 0x2 - if set, force color support
var Colors = exports.Colors = {
    mask: Console.colorSupport|0,
    supported: (Console.colorSupport & 0x1) !== 0,
    forced: (Console.colorSupport & 0x2) !== 0,

    maybeSet: function (value) {
        if (!this.forced) this.supported = !!value
    },

    maybeRestore: function () {
        if (!this.forced) this.supported = (this.mask & 0x1) !== 0
    },

    // Only for debugging
    forceSet: function (value) {
        this.supported = !!value
        this.forced = true
    },

    forceRestore: function () {
        this.supported = (this.mask & 0x1) !== 0
        this.forced = (this.mask & 0x2) !== 0
    },
}

var hasOwn = Object.prototype.hasOwnProperty

// Color palette pulled from Mocha
function colorToNumber(name) {
    switch (name) {
    case "pass": return 90
    case "fail": return 31

    case "bright pass": return 92
    case "bright fail": return 91
    case "bright yellow": return 93

    case "skip": return 36
    case "suite": return 0
    case "plain": return 0

    case "error title": return 0
    case "error message": return 31
    case "error stack": return 90

    case "checkmark": return 32
    case "fast": return 90
    case "medium": return 33
    case "slow": return 31
    case "green": return 32
    case "light": return 90

    case "diff gutter": return 90
    case "diff added": return 32
    case "diff removed": return 31
    default: throw new TypeError("Invalid name: \"" + name + "\"")
    }
}

exports.color = color
function color(name, str) {
    if (Colors.supported) {
        return "\u001b[" + colorToNumber(name) + "m" + str + "\u001b[0m"
    } else {
        return str + ""
    }
}

exports.joinPath = joinPath
function joinPath(ev) {
    var path = ""

    for (var i = 0; i < ev.path.length; i++) {
        path += " " + ev.path[i].name
    }

    return path.slice(1)
}

exports.speed = function (ev) {
    if (ev.duration >= ev.slow) return "slow"
    if (ev.duration >= ev.slow / 2) return "medium"
    if (ev.duration >= 0) return "fast"
    throw new RangeError("Duration must not be negative")
}

// exports.unifiedDiff = function (err) {
//     var msg = diff.createPatch("string", err.actual, err.expected)
//     var lines = msg.split("\n").slice(0, 4)
//     var ret = "\n      " +
//         color("diff added", "+ expected") + " " +
//         color("diff removed", "- actual") +
//         "\n"
//
//     for (var i = 0; i < lines.length; i++) {
//         var line = lines[i]
//
//         if (line[0] === "+") {
//             ret += "\n      " + color("diff added", line)
//         } else if (line[0] === "-") {
//             ret += "\n      " + color("diff removed", line)
//         } else if (!/\@\@|\\ No newline/.test(line)) {
//             ret += "\n      " + line
//         }
//     }
//
//     return ret
// }

/**
 * This represents the various test status types.
 */
var Status = Object.freeze({
    Unknown: 0,
    Skipped: 1,
    Passing: 2,
    Failing: 3,
})

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

function promisify1(f, inst) {
    return function (line) { return Resolver.resolve1(f, inst, line) }
}

function promisify0(f, inst) {
    return function () { return Resolver.resolve0(f, inst) }
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
exports.on = function (methods) {
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

/**
 * Since it's so easy to accidentially not instantiate the stock reporter. It's
 * best to verify, and complain when it gets called, so it doesn't silently
 * fail to work (the stock reporters *do* accept option objects, and a report
 * would otherwise be a valid argument). This will likely get called twice when
 * mistakenly not instantiated beforehand, once with a `"start"` event and once
 * with an `"error"` event, so an error will eventually propagate out of the
 * chain.
 */
exports.isReport = isReport
function isReport(opts) {
    if (!hasOwn.call(opts, "type")) return false
    if (!hasOwn.call(opts, "value")) return false
    if (!hasOwn.call(opts, "path")) return false

    return typeof opts.type === "string" && Array.isArray(opts.path)
}

function simpleInspect(value) {
    if (value instanceof Error) {
        return getStack(value)
    } else {
        return inspect(value)
    }
}

/**
 * This helps speed up getting previous trees, so a potentially expensive
 * tree search doesn't have to be performed.
 *
 * (This does actually make a slight perf difference in the tests.)
 */
function isRepeat(cache, path) {
    // Can't be a repeat the first time.
    if (cache.path == null) return false
    if (path === cache.path) return true
    if (path.length !== cache.path.length) return false

    // It's unlikely the nesting will be consistently more than a few levels
    // deep (>= 5), so this shouldn't bog anything down.
    for (var i = 0; i < path.length; i++) {
        if (path[i] !== cache.path[i]) {
            return false
        }
    }

    cache.path = path
    return true
}

function getPath(r, path) {
    if (isRepeat(r.cache, path)) {
        return r.cache.result
    }

    var child = r.base

    for (var i = 0; i < path.length; i++) {
        var entry = path[i]

        if (hasOwn.call(child.children, entry.index)) {
            child = child.children[entry.index]
        } else {
            child = child.children[entry.index] = new r.Tree(entry.name)
        }
    }

    return r.cache.result = child
}

var formatTime = exports.formatTime = (function () {
    var s = 1000 /* ms */
    var m = 60 * s
    var h = 60 * m
    var d = 24 * h

    return function (ms) {
        if (ms >= d) return Math.round(ms / d) + "d"
        if (ms >= h) return Math.round(ms / h) + "h"
        if (ms >= m) return Math.round(ms / m) + "m"
        if (ms >= s) return Math.round(ms / s) + "s"
        return ms + "ms"
    }
})()

function printTime(r, p, str) {
    if (!r.timePrinted) {
        r.timePrinted = true
        str += color("light", " (" + formatTime(r.duration) + ")")
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
 * This contains a high-level description of a test error event, since `"fail"`
 * and `"extra"` events are very closely handled in some of the reporters.
 */
function ErrorSpec(event, extra) {
    this.event = event
    this.extra = extra
}

function Tree(value) {
    this.value = value
    this.status = Status.Unknown
    this.children = Object.create(null)
}

function State(reporter) {
    if (typeof reporter.methods.init === "function") {
        (0, reporter.methods.init)(this, reporter.opts)
    }
}

function defaultify(r, prop, promisify) { // eslint-disable-line max-params
    if (r.methods.accepts.indexOf(prop) >= 0) {
        var used

        if (typeof r.opts[prop] === "function") {
            used = r.opts
        } else {
            used = Console.defaultOpts
        }

        r.opts[prop] = promisify(used[prop], used)
    }
}

/**
 * Superclass for all reporters. This covers the state for pretty much every
 * reporter.
 *
 * Note that if you delay the initial reset, you still must call it before the
 * constructor finishes.
 */
exports.Reporter = Reporter
function Reporter(tree, opts, methods, delay) {
    this.Tree = Tree
    this.opts = opts != null ? opts : {}
    this.methods = methods
    defaultify(this, "reset", promisify0)
    if (!delay) this.reset()
}

methods(Reporter, {
    reset: function () {
        this.running = false
        this.timePrinted = false
        this.tests = 0
        this.pass = 0
        this.fail = 0
        this.skip = 0
        this.duration = 0
        this.errors = []
        this.state = new State(this)
        this.base = new this.Tree(null)
        this.cache = {path: null, result: null}
    },

    pushError: function (ev, extra) {
        this.errors.push(new ErrorSpec(ev, extra))
    },

    get: function (path) {
        return getPath(this, path)
    },
})

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
function ConsoleReporter(opts, methods) {
    if (isReport(opts)) {
        throw new TypeError(m("type.reporter.argument"))
    }

    Reporter.call(this, Tree, opts, methods, true)

    if (!Colors.forced && methods.accepts.indexOf("color") >= 0) {
        this.opts.color = opts.color
    }

    defaultify(this, "print", promisify1)
    defaultify(this, "write", promisify1)
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
            var name = i + 1 + ") " + joinPath(spec.event) + ":"
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
