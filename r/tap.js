"use strict"

// This is a basic TAP-generating reporter.

var methods = require("../lib/methods.js")
var Reporter = require("../lib/reporter.js")
var inspect = require("util").inspect

var Status = Reporter.Status

function shouldBreakLines(minLength, str) {
    return str.length > Reporter.windowWidth - minLength ||
        /\r?\n|[:?-]/.test(str)
}

function Printer() {
    Reporter.Printer.apply(this, arguments)
}

methods(Printer, Reporter.Printer, {
    reset: function () {
        Reporter.Printer.prototype.reset.call(this)
        this.counter = 0
    },

    printTemplate: function (ev, tmpl, skip) {
        var path = Reporter.joinPath(ev)

        if (!skip) this.counter++

        return this.print(
            tmpl.replace(/%c/g, this.counter)
                .replace(/%p/g, path.replace(/\$/g, "$$$$")))
    },

    printLines: function (value, skipFirst) {
        var lines = value.replace(/^/gm, "    ").split(/\r?\n/)

        for (var i = +!!skipFirst; i < lines.length; i++) {
            this.print(lines[i])
        }
    },

    printRaw: function (key, str) {
        if (shouldBreakLines(key.length, str)) {
            this.print("  " + key + ": |-")
            this.printLines(str, false)
        } else {
            this.print("  " + key + ": " + str)
        }
    },

    printValue: function (key, value) {
        return this.printRaw(key, inspect(value))
    },

    printError: function (err) {
        // Let's *not* depend on the constructor being Thallium's...
        if (err instanceof Error) {
            if (err.name === "AssertionError") {
                this.printValue("expected", err.expected)
                this.printValue("actual", err.actual)

                var message = err.message

                err.message = ""
                this.printRaw("message", message)
                this.print("  stack: |-")
                this.printLines(err.stack, true)
                err.message = message
            } else {
                this.print("  stack: |-")
                this.printLines(err.stack, false)
            }
        } else {
            this.printValue(err)
        }
    },
})

function Dispatcher(opts) {
    this._ = new Printer(opts)
    this._.tree.status = Status.Unknown
}

methods(Dispatcher, {
    start: function () {
        this._.print("TAP version 13")
        this._.running = true
    },

    enter: function (ev) {
        // Print a leading comment, to make some TAP formatters prettier.
        this._.tests++
        this._.pass++
        this._.tree.getPath(ev.path).status = Status.Passing
        this._.printTemplate(ev, "# %p", true)
        this._.printTemplate(ev, "ok %c")
    },

    // This is meaningless for the output.
    leave: function () {},

    pass: function (ev) {
        this._.tests++
        this._.pass++
        this._.printTemplate(ev, "ok %c %p")
        this._.tree.getPath(ev.path).status = Status.Passing
    },

    fail: function (ev) {
        this._.tests++
        this._.fail++
        this._.printTemplate(ev, "not ok %c %p")
        this._.print("  ---")
        this._.printError(ev.value)
        this._.print("  ...")
        this._.tree.getPath(ev.path).status = Status.Failing
    },

    skip: function (ev) {
        this._.skip++
        this._.printTemplate(ev, "ok %c # skip %p")
        this._.tree.getPath(ev.path).status = Status.Skipped
    },

    extra: function (ev) {
        var tree = this._.tree.getPath(ev.path)

        if (tree.status < Status.Passing) {
            throw new Error("(Thallium internal) unreachable")
        }

        // Only resolve once.
        if (tree.status === Status.Passing) {
            tree.status = Status.Failing
            this._.fail++
        }

        this._.printTemplate(ev, "not ok %c %p # extra")
        this._.print("  ---")
        this._.printValue("count", ev.value.count)
        this._.printValue("value", ev.value.value)
        this._.print("  ...")
    },

    end: function () {
        this._.print("1.." + this._.counter)
        this._.print("# tests " + this._.tests)

        if (this._.pass) this._.print("# pass " + this._.pass)
        if (this._.fail) this._.print("# fail " + this._.fail)
        if (this._.skip) this._.print("# skip " + this._.skip)

        this._.reset()
    },

    error: function (ev) {
        this._.print("Bail out!")
        this._.print("  ---")
        this._.printError(ev.value)
        this._.print("  ...")
        this._.reset()
    },
})

// This is synchronous, and the `print` option must act synchronously.
module.exports = function (opts) {
    var dispatcher = new Dispatcher(opts)

    return function (ev, done) {
        dispatcher[ev.type](ev)
        return done()
    }
}
