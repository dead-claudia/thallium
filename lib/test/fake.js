"use strict"

/**
 * This contains all the fake namespaces
 */

const report = require("./common.js").report
const r = require("../util.js").r
const Test = require("./test.js")
const Sync = require("./sync.js")

function createFakeNs(impl) {
    return {
        /**
         * This has to look like an inline test, because the methods still have
         * to be exposed, even though the tests aren't run.
         */
        Inline: class Inline extends Sync.Inline {
            run(isMain) { return impl(this, isMain) }
        },

        Block: class Block extends Test {
            constructor(methods, name, index) {
                super()

                this.methods = methods
                this.name = name
                this.index = index
                this.parent = methods._
            }

            run(isMain) { return impl(this, isMain) }
        },
    }
}

exports.Dummy = createFakeNs(() => {})
exports.Skip = createFakeNs((test, isMain) => {
    test.running = true

    return report(test, r("pending")).bind(test)
    .finally(() => { test.running = false })
    .then(() => isMain ? report(test, r("exit")) : undefined)
    .return(undefined)
})
