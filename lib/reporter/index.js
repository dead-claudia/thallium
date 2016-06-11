"use strict"

var Promise = require("bluebird")
var m = require("../messages.js")
var methods = require("../methods.js")
var inspect = require("../inspect.js")
// var diff = require("diff")
var Console = require("./console.js")

exports.Symbols = Console.Symbols
exports.windowWidth = Console.windowWidth
exports.newline = Console.newline

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
    if (Console.useColors()) {
        return "\u001b[" + colorToNumber(name) + "m" + str + "\u001b[0m"
    } else {
        return String(str)
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

/**
 * A macro of sorts, to simplify creating reporters.
 */
exports.on = function (methods) {
    return function (opts) {
        var reporter = new Reporter(opts, methods.init)

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

            return Promise.resolve(methods[ev.type](reporter, ev))
            .finally(function () {
                if (ev.type === "end" || ev.type === "error") {
                    reporter.reset()
                    return reporter.opts.reset()
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
function isReport(opts) {
    if (!hasOwn.call(opts, "type")) return false
    if (!hasOwn.call(opts, "value")) return false
    if (!hasOwn.call(opts, "path")) return false

    return typeof opts.type === "string" && Array.isArray(opts.path)
}

function promisify(f, inst) {
    return function (line) {
        return Promise.resolve(f.call(inst, line))
    }
}

function defaultify(opts, prop, defaultValue) {
    if (opts[prop] == null) {
        opts[prop] = defaultValue
    } else {
        opts[prop] = promisify(opts[prop], opts)
    }
}

function simpleInspect(value) {
    if (value instanceof Error) {
        return value.stack
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
    if (isRepeat(r._cache, path)) {
        return r._cache.result
    }

    var child = r._base

    for (var i = 0; i < path.length; i++) {
        var entry = path[i]

        if (hasOwn.call(child.children, entry.index)) {
            child = child.children[entry.index]
        } else {
            child = child.children[entry.index] = new Tree(entry.name)
        }
    }

    return r._cache.result = child
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

function printTime(r, str) {
    if (!r.timePrinted) {
        r.timePrinted = true
        str += color("light", " (" + formatTime(r.duration) + ")")
    }
    return str
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
    (0, reporter.init)(this)
}

/**
 * Base class for all reporters.
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
 * @param {Function} init The init function for the subclass reporter's
 *                        isolated state (created by factory).
 */
function Reporter(opts, init) {
    if (opts == null) opts = {}
    if (isReport(opts)) {
        throw new TypeError(m("type.reporter.argument"))
    }

    defaultify(opts, "print", Console.defaultLog)
    defaultify(opts, "write", Console.defaultWrite)
    defaultify(opts, "reset", Console.defaultReset)

    this.opts = opts
    if (typeof init !== "function") init = function () {}
    this.init = init
    this.reset()
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
        this._base = new Tree("<base>")
        this._cache = {path: null, result: null}
    },

    pushError: function (ev, extra) {
        this.errors.push(new ErrorSpec(ev, extra))
    },

    get: function (path) {
        return getPath(this, path)
    },

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
                p = p.then(function () {
                    return self.print(printTime(self,
                        color("bright pass", "  ") +
                        color("green", self.pass + " passing")))
                })
            }

            if (self.skip) {
                p = p.then(function () {
                    return self.print(printTime(self,
                        color("skip", "  " + self.skip + " skipped")))
                })
            }

            if (self.fail) {
                p = p.then(function () {
                    return self.print(printTime(self,
                        color("bright fail", "  ") +
                        color("fail", self.fail + " failing")))
                })
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
