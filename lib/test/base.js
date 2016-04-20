"use strict"

const Test = require("./test.js")
const Common = require("./common.js")
const r = require("../util.js").r

const report = Common.report

module.exports = class Base extends Test {
    constructor(methods) {
        super()

        this.methods = methods
        this.index = 0
        this.reporters = new Set()
        this.isRoot = true
        this.initializing = true
    }

    run() {
        this.running = true

        return report(this, r("start"))
        .then(() => {
            // Only unset it to run the tests.
            this.initializing = false
            return Common.runTests(this, r("pass"))
        })
        .finally(() => { this.initializing = true })
        .then(() => report(this, r("end")))
        .then(() => report(this, r("exit")))
        .finally(() => { this.running = false })
    }
}
