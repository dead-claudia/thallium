"use strict"

var methods = require("../methods.js")
var Tree = require("./tree.js")

module.exports = Printer

function Printer(opts) {
    this.opts = opts
    this.reset()
}

function abstract(name) {
    return function () { throw new ReferenceError(name + "() is abstract") }
}

methods(Printer, {
    printAssertion: abstract("printAssertion"),
    printStack: abstract("printStack"),
    printValue: abstract("printValue"),

    reset: function () {
        this.running = false
        this.counter = 0
        this.tests = 0
        this.pass = 0
        this.fail = 0
        this.skip = 0
        this.tree = new Tree("")
    },

    printError: function (err) {
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
    },
})
