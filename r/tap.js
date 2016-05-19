"use strict"

// This is a basic TAP-generating reporter.

var methods = require("../lib/methods.js")
var Tree = require("../lib/reporter/tree.js")
var BasePrinter = require("../lib/reporter/base-printer.js")
var inspect = require("util").inspect

function shouldBreakLines(minLength, str) {
    return str.length > 80 - minLength || /\r?\n|[:?-]/.test(str)
}

function Printer() {
    BasePrinter.apply(this, arguments)
}

methods(Printer, BasePrinter, {
    printTemplate: function (ev, tmpl) {
        var path = ev.path.map(function (i) { return i.name }).join(" ")

        return this.opts.print(
            tmpl.replace(/%c/g, ++this.counter)
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
    start: function () {
        if (!this._.running) {
            this._.opts.print("TAP version 13")
            this._.running = true
        }
    },

    // This is meaningless for the output.
    end: function () {},

    pass: function (ev) {
        this._.tests++
        this._.printTemplate(ev, "ok %c %p")
        this._.passing++
        this._.tree.getPath(ev.path).status = Tree.PASSING
    },

    fail: function (ev) {
        this._.tests++
        this._.printTemplate(ev, "not ok %c %p")
        this._.opts.print("  ---")
        this._.printError(ev.value)
        this._.opts.print("  ...")
        this._.failing++
        this._.tree.getPath(ev.path).status = Tree.FAILING
    },

    pending: function (ev) {
        if (!this._.running) {
            this._.opts.print("TAP version 13")
            this._.running = true
        }
        this._.pending++
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
            this._.failing++
        }

        this._.printTemplate(ev, "not ok %c %p # extra")
        this._.opts.print("  ---")
        this._.printValue("count", ev.value.count)
        this._.printValue("value", ev.value.value)
        this._.opts.print("  ...")
    },

    exit: function () {
        this._.opts.print("# tests " + this._.tests)
        this._.opts.print("# passing " + this._.passing)
        this._.opts.print("# failing " + this._.failing)
        this._.opts.print("# pending " + this._.pending)
        this._.opts.print("1.." + this._.counter)
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
