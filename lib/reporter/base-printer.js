"use strict"

const Tree = require("./tree.js")

module.exports = class Printer {
    constructor(opts) {
        this.opts = opts
        this.reset()
    }

    printAssertion() { throw new Error("printAssertionError() is abstract") }
    printStack() { throw new Error("printStack() is abstract") }
    printValue() { throw new Error("printValue() is abstract") }

    reset() {
        this.running = false
        this.counter = 0
        this.tests = 0
        this.passing = 0
        this.failing = 0
        this.pending = 0
        this.tree = new Tree("")
    }

    printError(err) {
        // Let's *not* depend on the constructor being Thallium's...
        if (err instanceof Error) {
            if (err.name === "AssertionError") {
                this.printAssertion(err)
            } else {
                this.printStack(err)
            }
        } else {
            this.printValue(err)
        }
    }
}
