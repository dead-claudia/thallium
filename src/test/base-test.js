import {Test} from "./test.js"
import {runTests, report} from "./common.js"
import {r} from "../util/util.js"

export class BaseTest extends Test {
    constructor(methods) {
        super()
        this.methods = methods
        this.index = 0
        this.reporters = []
        this.isBase = true
        this.initializing = true
    }

    run() {
        this.running = true

        return report(this, r("start"))
        .then(() => {
            // Only unset it to run the tests.
            this.initializing = false
            return runTests(this, r("pass"))
        })
        .finally(() => { this.initializing = true })
        .then(() => report(this, r("end")))
        .then(() => report(this, r("exit")))
        .finally(() => { this.running = false })
    }
}
