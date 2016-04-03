"use strict"

var createTest = require("./test.js").createTest
var common = require("./common.js")
var r = require("../util/util.js").r

var report = common.report

/** @this {Test} */
function run() {
    this.running = true

    return report(this, r("start")).bind(this)
    .then(/** @this */ function () {
        // Only unset it to run the tests.
        this.initializing = false
        return common.runTests(this, r("pass"))
    })
    .finally(/** @this */ function () { this.initializing = true })
    .then(/** @this */ function () { report(this, r("end")) })
    .then(/** @this */ function () { report(this, r("exit")) })
    .finally(/** @this */ function () { this.running = false })
}

exports.createBaseTest = exports.BaseTest = function (methods) {
    var ret = createTest()

    ret.methods = methods
    ret.index = 0
    ret.reporters = []
    ret.isBase = true
    ret.initializing = true
    ret.run = run
    return ret
}
