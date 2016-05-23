"use strict"

// This is a basic TAP-generating reporter.

var methods = require("../lib/methods.js")
var Reporter = require("../lib/reporter.js")
var c = Reporter.color

function ErrorSpec(ev, extra) {
    this.event = ev
    this.extra = extra
}

function Printer() {
    Reporter.Printer.apply(this, arguments)
}

methods(Printer, Reporter.Printer, {
    reset: function () {
        Reporter.Printer.prototype.reset.call(this)

        this.errorSpecs = []
        this.level = 1
        this.initialDepth = 0
    },

    indent: function () {
        var level = this.level
        var ret = ""

        while (level--) ret += "  "
        return ret
    },

    name: function (ev) {
        return ev.path[this.level - 1].name
    },

    printFailList: function (pre, str) {
        var parts = str.split(/\r?\n/g)

        this.print("    " + c("fail", pre + parts[0].trim()))

        for (var i = 1; i < parts.length; i++) {
            this.print("      " + c("fail", parts[i].trim()))
        }
    },

    printError: function (path, index, value) {
        this.print("  " + c("plain", index + 1 + ") " + path + ":"))

        if (value instanceof Error) {
            this.printFailList("", value.stack)
        } else {
            this.printFailList("", Reporter.inspect(value))
        }
    },

    printExtra: function (path, index, value) {
        this.print("  " + c("plain", index + 1 + ") " + path + ": (extra)"))
        this.printFailList("- value: ", Reporter.inspect(value.value))
        this.printFailList("- ", value.stack)
    },

    initStatus: function (ev, status) {
        this.tree.getPath(ev.path).status = status
        this.tests++
    },
})

function Dispatcher(opts) {
    this._ = new Printer(opts)
}

methods(Dispatcher, {
    start: function (ev) {
        this._.reset()
        this._.print()

        if (ev.path.length > 0) {
            var indent = "  "

            for (var i = 0; i < ev.path.length; i++) {
                this._.print(indent + ev.path[i].name)
                indent += "  "
            }

            this._.level = ev.path.length + 1
        }
    },

    enter: function (ev) {
        if (this._.pass && this._.level === 1) this._.print()
        this._.initStatus(ev, [])
        this._.pass++
        this._.print(this._.indent() + this._.name(ev))
        this._.level++
    },

    leave: function () {
        this._.level--
    },

    pass: function (ev) {
        this._.initStatus(ev, [])
        this._.pass++
        this._.print(this._.indent() +
            c("checkmark", Reporter.Symbols.Pass + " ") +
            c("pass", this._.name(ev)))
    },

    fail: function (ev) {
        var index = this._.errorSpecs.length
        var status = [index]

        this._.initStatus(ev, status)
        this._.fail++
        this._.errorSpecs.push(new ErrorSpec(ev, false))
        this._.print(this._.indent() +
            c("fail", index + 1 + ") " + this._.name(ev)))
    },

    skip: function (ev) {
        this._.tree.getPath(ev.path).status = []
        this._.skip++
        this._.print(this._.indent() + c("skip", "- " + this._.name(ev)))
    },

    // These get printed at the end
    extra: function (ev) {
        var status = this._.tree.getPath(ev.path).status

        if (!status.length) this._.fail++
        status.push(this._.errorSpecs.length)
        this._.errorSpecs.push(new ErrorSpec(ev, true))
    },

    end: function () {
        if (!this._.tests && !this._.skip) {
            this._.print(c("plain", "  0 tests"))
            this._.print()
            return
        }

        this._.print()

        if (this._.tests === 1) this._.print(c("plain", "  1 test"))
        else this._.print(c("plain", "  " + this._.tests + " tests"))

        if (this._.pass || this._.skip || this._.fail) {
            if (this._.pass) {
                this._.print(c("bright pass", "  ") +
                    c("green", this._.pass + " passing"))
            }

            if (this._.skip) {
                this._.print(c("skip", "  " + this._.skip + " skipped"))
            }

            if (this._.fail) {
                this._.print(c("bright fail", "  ") +
                    c("fail", this._.fail + " failing"))
            }

            this._.print()
        }

        if (!this._.errorSpecs.length) return

        for (var i = 0; i < this._.errorSpecs.length; i++) {
            var spec = this._.errorSpecs[i]
            var path = Reporter.joinPath(spec.event)

            if (spec.extra) {
                this._.printExtra(path, i, spec.event.value)
            } else {
                this._.printError(path, i, spec.event.value)
            }

            this._.print()
        }
    },

    error: function (ev) {
        var stack

        if (ev.value instanceof Error) {
            stack = ev.value.stack.split(/\r?\n/g)
        } else {
            stack = Reporter.inspect(ev.value).split(/\r?\n/g)
        }

        this._.print()

        for (var i = 0; i < stack.length; i++) {
            this._.print(stack[i])
        }

        // Pitch it all.
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
