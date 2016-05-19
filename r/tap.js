"use strict"

// This is a basic TAP-generating reporter.

var methods = require("../lib/methods.js")
var Tree = require("../lib/reporter/tree.js")
var BasePrinter = require("../lib/reporter/base-printer.js")
var inspect = require("util").inspect
var Text = require("../lib/reporter/text.js")

function shouldBreakLines(minLength, str) {
    return str.length > Text.windowWidth - minLength ||
        /\r?\n|[:?-]/.test(str)
}

function Printer() {
    BasePrinter.apply(this, arguments)
}

methods(Printer, BasePrinter, {
    printTemplate: function (ev, tmpl, skip) {
        var path = ev.path.map(function (i) { return i.name }).join(" ")

        if (!skip) this.counter++

        return this.opts.print(
            tmpl.replace(/%c/g, this.counter)
                .replace(/%p/g, path.replace(/\$/g, "$$$$")))
    },

    printLines: function (key, value, skipFirst) {
        this.opts.print("  " + key + ": |-")

        var lines = value.split(/\r?\n/)

        for (var i = +!!skipFirst; i < lines.length; i++) {
            this.opts.print("    " + lines[i])
        }
    },

    printValue: function (key, value) {
        var str = inspect(value)

        if (shouldBreakLines(key.length, str)) {
            this.printLines(key, str, false)
        } else {
            this.opts.print("  " + key + ": " + value)
        }
    },

    printAssertion: function (err) {
        this.printValue("expected", err.expected)
        this.printValue("actual", err.actual)

        var message = err.message

        err.message = ""
        this.printLines("stack", err.stack, true)
        err.message = message
    },

    printStack: function (err) {
        this.printLines("stack", err.stack)
    },
})

function Dispatcher(opts) {
    this._ = new Printer(opts)
}

methods(Dispatcher, {
    start: function (ev) {
        if (!this._.running) {
            this._.opts.print("TAP version 13")
            this._.running = true
        }

        ev.path.pop()

        // Print a leading comment, to make some TAP formatters prettier.
        if (ev.path.length && !this._.tree.hasPath(ev.path)) {
            this._.printTemplate(ev, "# %p", true)
            // Add the path.
            this._.tree.getPath(ev.path)
        }
    },

    // This is meaningless for the output.
    end: function () {},

    pass: function (ev) {
        this._.tests++
        this._.printTemplate(ev, "ok %c %p")
        this._.pass++
        this._.tree.getPath(ev.path).status = Tree.PASSING
    },

    fail: function (ev) {
        this._.tests++
        this._.printTemplate(ev, "not ok %c %p")
        this._.opts.print("  ---")
        this._.printError(ev.value)
        this._.opts.print("  ...")
        this._.fail++
        this._.tree.getPath(ev.path).status = Tree.FAILING
    },

    skip: function (ev) {
        if (!this._.running) {
            this._.opts.print("TAP version 13")
            this._.running = true
        }
        this._.skip++
        this._.printTemplate(ev, "ok %c # skip %p")
    },

    extra: function (ev) {
        var tree = this._.tree.getPath(ev.path)

        if (!tree.status) {
            throw new Error("(Thallium internal) unreachable")
        }

        // Only resolve once.
        if (tree.status === Tree.PASSING) {
            tree.status = Tree.FAILING
            this._.fail++
        }

        this._.printTemplate(ev, "not ok %c %p # extra")
        this._.opts.print("  ---")
        this._.printValue("count", ev.value.count)
        this._.printValue("value", ev.value.value)
        this._.opts.print("  ...")
    },

    exit: function () {
        this._.opts.print("1.." + this._.counter)
        this._.opts.print("# tests " + this._.tests)

        if (this._.pass) this._.opts.print("# pass " + this._.pass)
        if (this._.fail) this._.opts.print("# fail " + this._.fail)
        if (this._.skip) this._.opts.print("# skip " + this._.skip)

        this._.reset()
    },

    error: function (ev) {
        this._.opts.print("Bail out!")
        this._.opts.print("  ---")
        this._.printError(ev.value)
        this._.opts.print("  ...")
        this._.reset()
    },
})

// This is synchronous, and the `print` option must act synchronously.
module.exports = function (opts) {
    if (opts == null) opts = {}
    if (opts.print == null) opts.print = console.log.bind(console)

    var dispatcher = new Dispatcher(opts)

    return function (ev, done) {
        dispatcher[ev.type](ev)
        return done()
    }
}
