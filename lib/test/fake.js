"use strict"

/**
 * This contains all the fake namespaces
 */

var report = require("./common.js").report
var r = require("../util/util.js").r
var Test = require("./test.js")
var Sync = require("./sync.js")

function createFakeNs(run) {
    return {
        /**
         * This has to look like an inline test, because the methods still have
         * to be exposed, even though the tests aren't run.
         */
        createInline: function (methods, name, index) {
            var ret = Sync.createInline(methods, name, index)

            ret.run = run
            return ret
        },

        createBlock: function (methods, name, index) {
            var ret = Test.create()

            ret.methods = methods
            ret.name = name
            ret.index = index
            ret.run = run
            ret.parent = methods._
            return ret
        },
    }
}

exports.Dummy = createFakeNs(function () {})
exports.Skip = createFakeNs(/** @this */ function (isMain) {
    this.running = true

    return report(this, r("pending")).bind(this)
    .finally(/** @this */ function () { this.running = false })
    .then(/** @this */ function () {
        if (isMain) return report(this, r("exit"))
        else return undefined
    })
    .bind(undefined).return(undefined)
})
