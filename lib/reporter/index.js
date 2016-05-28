"use strict"

var Promise = require("bluebird")
var inspect = require("../inspect.js")
var diff = require("diff")
var Common = require("../common.js")
var Console = require("./console.js")

var m = Common.m
var hasOwn = Object.prototype.hasOwnProperty

// For debugging
exports.useColors = Console.useColors

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

exports.Symbols = Console.Symbols

exports.color = color
function color(name, str) {
    if (Console.useColors) {
        return "\u001b[" + colorToNumber(name) + "m" + str + "\u001b[0m"
    } else {
        return String(str)
    }
}

exports.windowWidth = Console.windowWidth

exports.joinPath = function (ev) {
    var path = ""

    for (var i = 0; i < ev.path.length; i++) {
        path += " " + ev.path[i].name
    }

    // Engine assist with `.concat`
    return path.slice(1).concat()
}

// Smaller inspection than the full stack util.inspect gives.
exports.inspect = function (err) {
    if (err instanceof Error && typeof err.inspect !== "function") {
        return "[" + err.name + ": " + err.message + "]"
    } else {
        return inspect(err)
    }
}

exports.unifiedDiff = function (err) {
    var msg = diff.createPatch("string", err.actual, err.expected)
    var lines = msg.split("\n").splice(4)
    var ret = "\n      " +
        color("diff added", "+ expected") + " " +
        color("diff removed", "- actual") +
        "\n"

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i]

        if (line[0] === "+") {
            ret += "\n      " + color("diff added", line)
        } else if (line[0] === "-") {
            ret += "\n      " + color("diff removed", line)
        } else if (!line.match(/\@\@|\\ No newline/)) {
            ret += "\n      " + line
        }
    }

    return ret
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

function promisify(f) {
    return function (line) {
        return Promise.resolve(f(line))
    }
}

/**
 * Note: printing is asynchronous, because otherwise, if enough errors exist,
 * Node will eventually start dropping lines sent to its buffer, especially when
 * stack traces get involved. If Thallium's output is redirected, that can be a
 * big problem for consumers, as they only have part of the output, and won't be
 * able to see all the errors later. Also, if console warnings come up en-masse,
 * that would also contribute. So, we have to wait for each line to flush before
 * we can continue, so the full output makes its way to the console.
 *
 * Some test frameworks like Tape miss this, though.
 */
exports.Reporter = Reporter
function Reporter(opts) {
    if (opts == null) opts = {}
    if (opts.print == null) opts.print = Console.defaultLog
    else opts.print = promisify(opts.print)

    if (isReport(opts)) {
        throw new TypeError(m("type.reporter.argument"))
    }

    this.opts = opts
    this.reset()
}

Common.methods(Reporter, {
    reset: function () {
        this.tests = 0
        this.pass = 0
        this.fail = 0
        this.skip = 0
        this.tree = new Tree("")
    },

    print: function (str) {
        if (str == null) str = ""
        return this.opts.print(str).bind(this).return()
    },

    reporter: function () {
        var self = this

        return function (ev) {
            return Promise.resolve(self.report(ev))
        }
    },
})

exports.Status = Object.freeze({
    Unknown: 0,
    Skipped: 1,
    Passing: 2,
    Failing: 3,
})

exports.Tree = Tree
function Tree(value) {
    this.value = value
    this.status = exports.Status.Unknown
    this.children = Object.create(null)
    this.lastTree = null
}

Common.methods(Tree, {
    isRepeat: function (path) {
        // Can't be a repeat the first time.
        if (this.lastPath == null) {
            return false
        }

        if (path === this.lastPath) {
            return true
        }

        if (path.length !== this.lastPath.length) {
            return false
        }

        // It's an easy enough heuristic to check because it's unlikely the
        // nesting will be consistently more than a few levels deep (>= 5)
        for (var i = 0; i < path.length; i++) {
            if (path[i] !== this.lastPath[i]) {
                return false
            }
        }

        this.lastPath = path
        return true
    },

    hasPath: function (path) {
        if (this.isRepeat(path)) {
            return true
        }

        var tree = this // eslint-disable-line consistent-this

        for (var i = 0; i < path.length; i++) {
            var entry = path[i]

            if (hasOwn.call(tree.children, entry.index)) {
                tree = tree.children[entry.index]
            } else {
                return false
            }
        }

        return true
    },

    getPath: function (path) {
        if (this.isRepeat(path)) {
            return this.lastTree
        }

        var tree = this // eslint-disable-line consistent-this

        for (var i = 0; i < path.length; i++) {
            var entry = path[i]

            if (hasOwn.call(tree.children, entry.index)) {
                tree = tree.children[entry.index]
            } else {
                tree = tree.children[entry.index] = new Tree(entry.name)
            }
        }

        this.lastPath = path
        return this.lastTree = tree
    },
})
