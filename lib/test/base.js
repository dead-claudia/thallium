"use strict"

var Test = require("./test.js")
var Common = require("./common.js")
var r = require("../util/util.js").r

var report = Common.report

/** @this {Test} */
function run() {
    this.running = true

    return report(this, r("start")).bind(this)
    .then(/** @this */ function () {
        // Only unset it to run the tests.
        this.initializing = false
        return Common.runTests(this, r("pass"))
    })
    .finally(/** @this */ function () { this.initializing = true })
    .then(/** @this */ function () { report(this, r("end")) })
    .then(/** @this */ function () { report(this, r("exit")) })
    .finally(/** @this */ function () { this.running = false })
}

exports.create = function (methods) {
    var test = Test.create()

    test.methods = methods
    test.index = 0
    test.reporters = []
    test.isRoot = true
    test.initializing = true
    test.run = run

    return test
}
