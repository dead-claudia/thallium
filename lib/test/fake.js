"use strict"

/**
 * This contains all the fake namespaces
 */

const report = require("./common.js").report
const r = require("../util.js").r
const Test = require("./test.js")
const Sync = require("./sync.js")

exports.Dummy = Object.freeze({
    /**
     * This has to look like an inline test, because the methods still have
     * to be exposed, even though the tests aren't run.
     */
    Inline: class Inline extends Sync.Inline {
        run() {}
    },

    Block: class Block extends Test {
        constructor(methods, name, index) {
            super()

            this.methods = methods
            this.name = name
            this.index = index
            this.parent = methods._
        }

        run() {}
    },
})

exports.Skip = Object.freeze({
    /**
     * This has to look like an inline test, because the methods still have
     * to be exposed, even though the tests aren't run.
     */
    Inline: class Inline extends Sync.Inline {
        run(isMain) {
            this.running = true

            return report(this, r("pending"))
            .finally(() => { this.running = false })
            .then(() => isMain ? report(this, r("exit")) : undefined)
            .return(undefined)
        }
    },

    Block: class Block extends Test {
        constructor(methods, name, index) {
            super()

            this.methods = methods
            this.name = name
            this.index = index
            this.parent = methods._
        }

        run(isMain) {
            this.running = true

            return report(this, r("pending"))
            .finally(() => { this.running = false })
            .then(() => isMain ? report(this, r("exit")) : undefined)
            .return(undefined)
        }
    },
})
