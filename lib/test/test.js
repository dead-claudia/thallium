"use strict"

const m = require("../messages.js")
const Common = require("./common.js")
const r = require("../util.js").r

const report = Common.report

module.exports = class Test {
    constructor() {
        this.plugins = new Set()
        this.tests = []

        // In case this is called out of its own init, that error is caught.
        this.initializing = false

        // Keep this from being run multiple times concurrently.
        this.running = false

        // Whether this is the root test.
        this.isRoot = false

        // Inline tests need to be marked immediately before running.
        this.deinit = []

        // 0 means inherit timeout
        this.timeout = 0

        // Whether this test was slow.
        this.slow = false
    }

    /**
     * This runs the test, and returns a promise resolved when it's done.
     *
     * @this {Test} The current context
     * @param {Boolean} isMain Whether the test is run directly as the main
     *                         test or as a child test.
     */
    run(isMain) {
        if (this.running) {
            throw new Error(m("run.concurrent"))
        }

        this.running = true

        return report(this, r("start"))
        .then(() => {
            this.initializing = true
            return this.init()
        })
        // If an error occurs, the initialization still finished (albeit
        // unsuccessfully)
        .finally(() => { this.initializing = false })
        .then(res => {
            for (const test of this.deinit) {
                test.initializing = false
            }

            return Common.runTests(this, res)
        })
        .tap(() => report(this, r("end")))
        .tap(res => report(this, r(res.type, res.value)))
        .then(() => isMain ? report(this, r("exit")) : undefined)
        .finally(() => { this.running = false })
    }
}
