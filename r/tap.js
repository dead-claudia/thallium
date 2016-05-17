"use strict"

// This is a basic TAP-generating reporter.

const Tree = require("../lib/reporter/tree.js")
const BasePrinter = require("../lib/reporter/base-printer.js")
const inspect = require("util").inspect

function shouldBreakLines(minLength, str) {
    return str.length > 80 - minLength || /\r?\n|[:?-]/.test(str)
}

class Printer extends BasePrinter {
    printTemplate(ev, tmpl) {
        const path = ev.path.map(i => i.name).join(" ")

        return this.opts.print(
            tmpl.replace(/%c/g, ++this.counter)
                .replace(/%p/g, path.replace(/\$/g, "$$$$")))
    }

    printLines(key, value, skipFirst) {
        this.opts.print(`  ${key}: |-`)

        for (const line of value.split(/\r?\n/)) {
            if (skipFirst) skipFirst = false
            else this.opts.print(`    ${line}`)
        }
    }

    printValue(key, value) {
        const str = inspect(value)

        if (shouldBreakLines(key.length, str)) {
            this.printLines(key, str, false)
        } else {
            this.opts.print(`  ${key}: ${value}`)
        }
    }

    printAssertion(err) {
        this.printValue("expected", err.expected)
        this.printValue("actual", err.actual)

        const message = err.message

        err.message = ""
        this.printLines("stack", err.stack, true)
        err.message = message
    }

    printStack(err) {
        this.printLines("stack", err.stack)
    }
}

class Dispatcher {
    constructor(opts) {
        this._ = new Printer(opts)
    }

    start() {
        if (!this._.running) {
            this._.opts.print("TAP version 13")
            this._.running = true
        }
    }

    // This is meaningless for the output.
    end() {}

    pass(ev) {
        this._.tests++
        this._.printTemplate(ev, "ok %c %p")
        this._.passing++
        this._.tree.getPath(ev.path).status = Tree.PASSING
    }

    fail(ev) {
        this._.tests++
        this._.printTemplate(ev, "not ok %c %p")
        this._.opts.print("  ---")
        this._.printError(ev.value)
        this._.opts.print("  ...")
        this._.failing++
        this._.tree.getPath(ev.path).status = Tree.FAILING
    }

    pending(ev) {
        if (!this._.running) {
            this._.opts.print("TAP version 13")
            this._.running = true
        }
        this._.pending++
        this._.printTemplate(ev, "ok %c # skip %p")
    }

    extra(ev) {
        const tree = this._.tree.getPath(ev.path)

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
    }

    exit() {
        this._.opts.print(`# tests ${this._.tests}`)
        this._.opts.print(`# passing ${this._.passing}`)
        this._.opts.print(`# failing ${this._.failing}`)
        this._.opts.print(`# pending ${this._.pending}`)
        this._.opts.print(`1..${this._.counter}`)
        this._.reset()
    }

    error(ev) {
        this._.opts.print("Bail out!")
        this._.opts.print("  ---")
        this._.printError(ev.value)
        this._.opts.print("  ...")
        this._.reset()
    }
}

// This is synchronous, and the `print` option must act synchronously.
module.exports = opts => {
    if (opts == null) opts = {}
    if (opts.print == null) opts.print = console.log

    const dispatcher = new Dispatcher(opts)

    return (ev, done) => {
        dispatcher[ev.type](ev)
        return done()
    }
}
