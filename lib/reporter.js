"use strict"

// TODO: add `diff` support
// var diff = require("diff")

var Promise = require("./bluebird.js")
var methods = require("./methods.js")
var inspect = require("./replaced/inspect.js")
var Util = require("./util.js")
var Settings = require("./settings.js")

var hasOwn = Object.prototype.hasOwnProperty

exports.symbols = Settings.symbols
exports.windowWidth = Settings.windowWidth
exports.newline = Settings.newline

/*
 * Stack normalization
 */

var stackIncludesMessage = (function () {
    var stack = Util.getStack(new Error("test"))

    //     Firefox, Safari                 Chrome, IE
    return !/^(@)?\S+\:\d+/.test(stack) && !/^\s*at/.test(stack)
})()

exports.getStack = getStack
function getStack(e) {
    if (e instanceof Error) {
        var description = (e.name + ": " + e.message).replace(/^\s+/gm, "")
        var stripped = ""

        if (stackIncludesMessage) {
            var stack = Util.getStack(e)
            var index = stack.indexOf(e.message)

            if (index < 0) return Util.getStack(e).replace(/^\s+/gm, "")

            index = stack.indexOf(Settings.newline(), index + e.message.length)
            if (index >= 0) {
                stripped = stack.slice(index + Settings.newline().length)
                    .replace(/^\s+/gm, "")
            }
        } else {
            stripped = Util.getStack(e).replace(/^\s+/gm, "")
        }

        if (stripped !== "") description += Settings.newline() + stripped
        return description
    } else {
        return Util.getStack(e).replace(/^\s+/gm, "")
    }
}

var Colors = exports.Colors = Settings.Colors

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
    if (Colors.supported()) {
        return "\u001b[" + colorToNumber(name) + "m" + str + "\u001b[0m"
    } else {
        return str + ""
    }
}

exports.setColor = function (reporter) {
    if (reporter.opts.color != null) Colors.maybeSet(reporter.opts.color)
}

exports.unsetColor = function (reporter) {
    if (reporter.opts.color != null) Colors.maybeRestore()
}

exports.consoleReporter = function (opts, methods) {
    return new ConsoleReporter(opts, methods)
}

var Status = Object.freeze({
    Unknown: 0,
    Skipped: 1,
    Passing: 2,
    Failing: 3,
})

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
    if (typeof opts !== "object" || opts === null) return false
    if (!hasOwn.call(opts, "_")) return false
    if (!hasOwn.call(opts, "path")) return false
    if (!hasOwn.call(opts, "value")) return false
    if (!hasOwn.call(opts, "duration")) return false
    if (!hasOwn.call(opts, "slow")) return false

    return typeof opts._ === "number" && Array.isArray(opts.path) &&
        typeof opts.duration === "number" &&
        typeof opts.slow === "number"
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
        if (isReport(opts)) {
            throw new TypeError(
                "Options cannot be a report. Did you forget to call the " +
                "factory first?")
        }

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
                    return r.opts.reset()
                } else {
                    return undefined
                }
            })
        }
    }
}

function State(reporter) {
    if (typeof reporter.methods.init === "function") {
        (0, reporter.methods.init)(this, reporter.opts)
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

function defaultify(r, opts, prop) {
    if (r.methods.accepts.indexOf(prop) >= 0) {
        var used = typeof opts[prop] === "function"
            ? opts
            : Settings.defaultOpts()

        r.opts[prop] = function () {
            return Promise.resolve(used[prop].apply(used, arguments))
        }
    }
}

// exports.unifiedDiff = unifiedDiff
// function unifiedDiff(err) {
//     var msg = diff.createPatch("string", err.actual, err.expected)
//     var lines = msg.split(Settings.newline()).slice(0, 4)
//     var ret = Settings.newline() + "      " +
//         color("diff added", "+ expected") + " " +
//         color("diff removed", "- actual") +
//         Settings.newline()
//
//     for (var i = 0; i < lines.length; i++) {
//         var line = lines[i]
//
//         if (line[0] === "+") {
//             ret += Settings.newline() + "      " + color("diff added", line)
//         } else if (line[0] === "-") {
//             ret += Settings.newline() + "      " +
//                 color("diff removed", line)
//         } else if (!/\@\@|\\ No newline/.test(line)) {
//             ret += Settings.newline() + "      " + line
//         }
//     }
//
//     return ret
// }

/**
 * This helps speed up getting previous trees, so a potentially expensive
 * tree search doesn't have to be performed.
 *
 * (This does actually make a slight perf difference in the tests.)
 */
function isRepeat(cache, path) {
    // Can't be a repeat the first time.
    if (cache.path == null) return false
    if (path.length !== cache.path.length) return false
    if (path === cache.path) return true

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

/**
 * Superclass for all reporters. This covers the state for pretty much every
 * reporter.
 *
 * Note that if you delay the initial reset, you still must call it before the
 * constructor finishes.
 */
exports.Reporter = Reporter
function Reporter(Tree, opts, methods, delay) {
    this.Tree = Tree
    this.opts = {}
    this.methods = methods
    defaultify(this, opts, "reset")
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

    pushError: function (ev) {
        this.errors.push(ev)
    },

    get: function (path) {
        if (isRepeat(this.cache, path)) {
            return this.cache.result
        }

        var child = this.base

        for (var i = 0; i < path.length; i++) {
            var entry = path[i]

            if (hasOwn.call(child.children, entry.index)) {
                child = child.children[entry.index]
            } else {
                child = child.children[entry.index] = new this.Tree(entry.name)
            }
        }

        return this.cache.result = child
    },
})

function Tree(value) {
    this.value = value
    this.status = Status.Unknown
    this.children = Object.create(null)
}

function simpleInspect(value) {
    if (value instanceof Error) {
        return getStack(value)
    } else {
        return inspect(value)
    }
}

function printTime(r, p, str) {
    if (!r.timePrinted) {
        r.timePrinted = true
        str += color("light", " (" + formatTime(r.duration) + ")")
    }

    return p.then(function () { return r.print(str) })
}

function printFailList(r, str) {
    var parts = str.split(/\r?\n/g)

    return r.print("    " + color("fail", parts[0].trim()))
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
function ConsoleReporter(opts, methods) {
    Reporter.call(this, Tree, opts, methods, true)

    if (!Colors.forced() && methods.accepts.indexOf("color") >= 0) {
        this.opts.color = opts.color
    }

    defaultify(this, opts, "print")
    defaultify(this, opts, "write")
    this.reset()
}

methods(ConsoleReporter, Reporter, {
    print: function (str) {
        if (str == null) str = ""
        return Promise.resolve(this.opts.print(str))
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
        .return(this.errors).each(function (ev, i) {
            var name = i + 1 + ") " + joinPath(ev) + ":"

            return self.print("  " + color("plain", name))
            .then(function () {
                return printFailList(self, simpleInspect(ev.value))
            })
            .then(function () { return self.print() })
        })
    },

    printError: function (ev) {
        var self = this

        return this.print()
        .return(simpleInspect(ev.value).split(/\r?\n/g))
        .each(function (line) { return self.print(line) })
    },
})
