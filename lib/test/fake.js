"use strict"

/**
 * This contains all the fake namespaces
 */

var methods = require("../methods.js")
var report = require("./common.js").report
var r = require("../util.js").r
var Test = require("./test.js")
var Sync = require("./sync.js")

function createNs(run) {
    return Object.freeze({
        /**
         * This has to look like an inline test, because the methods still have
         * to be exposed, even though the tests aren't run.
         */
        Inline: methods(function Inline() {
            Sync.Inline.apply(this, arguments)
        }, Sync.Inline, {run: run}),

        Block: methods(function Block(methods, name, index) {
            Test.call(this)

            this.methods = methods
            this.name = name
            this.index = index
            this.parent = methods._
        }, Sync.Block, {run: run}),
    })
}

exports.Dummy = createNs(function () {})
exports.Skip = createNs(/** @this */ function (isMain) {
    this.running = true

    var self = this

    return report(this, r("pending"))
    .finally(function () { self.running = false })
    .then(function () { return isMain ? report(self, r("exit")) : undefined })
    .return(undefined)
})
