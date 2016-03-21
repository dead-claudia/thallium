import {m} from "../messages.js"
import {report, runTests} from "./common.js"
import {r} from "../util/util.js"

export class Test {
    constructor() {
        this.plugins = []
        this.tests = []

        // In case this is called out of its own init, that error is caught.
        this.initializing = false

        // Keep this from being run multiple times concurrently.
        this.running = false

        // Inline tests need to be marked immediately before running.
        this.deinit = []

        // 0 means inherit timeout
        this.timeout = 0

        // Placeholders for pretty shape
        this.parent = null
        this.reporters = null
        this.only = null
    }

    /**
     * This runs the body of the test.
     */
    // abstract init() {}

    /**
     * This runs the test, and returns a promise resolved when it's done.
     *
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
        // If an error occurs, the initialization has already finished (albeit
        // unsuccessfully)
        .finally(() => { this.initializing = false })
        .then(res => {
            for (const test of this.deinit) {
                test.initializing = false
            }

            return runTests(this, res)
        })
        .tap(() => report(this, r("end")))
        .tap(res => report(this, r(res.type, res.value)))
        .then(() => isMain && report(this, r("exit")))
        .finally(() => { this.running = false })
    }
}
