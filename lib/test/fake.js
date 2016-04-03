"use strict"

/**
 * This contains all the fake namespaces
 */

var report = require("./common.js").report
var r = require("../util/util.js").r
var createTest = require("./test.js").createTest
var createInlineTest = require("./sync.js").createInlineTest

function createFakeNs(run) {
    var ret = {
        /**
         * This has to look like an inline test, because the methods still have
         * to be exposed, even though the tests aren't run.
         */
        InlineTest: function () {
            var ret = createInlineTest.apply(undefined, arguments)

            ret.run = run
            return ret
        },

        BlockTest: function (methods, name, index) {
            var ret = createTest()

            ret.methods = methods
            ret.name = name
            ret.index = index
            ret.run = run
            ret.parent = methods._
            return ret
        },
    }

    ret.createInlineTest = ret.InlineTest
    ret.createBlockTest = ret.BlockTest
    return ret
}

exports.dummy = createFakeNs(function () {})
exports.skip = createFakeNs(/** @this */ function (isMain) {
    this.running = true

    return report(this, r("pending")).bind(this)
    .finally(/** @this */ function () { this.running = false })
    .then(/** @this */ function () {
        if (isMain) return report(this, r("exit"))
        else return undefined
    })
    .bind(undefined).return(undefined)
})
