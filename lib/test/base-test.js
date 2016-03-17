"use strict"

var methods = require("../util/methods.js")
var Test = require("./test.js")
var common = require("./common.js")
var report = common.report
var r = require("../util/util.js").r

module.exports = BaseTest
function BaseTest(methods) {
    Test.call(this)
    this.methods = methods
    this.index = 0
    this.reporters = []
    this.isBase = true
    this.initializing = true
}

methods(BaseTest, Test, {
    run: function () {
        this.running = true

        var self = this

        return report(self, r("start"))
        .then(function () {
            // Only unset it to run the tests.
            self.initializing = false
            return common.runTests(self, r("pass"))
        })
        .finally(function () { self.initializing = true })
        .then(function () { return report(self, r("end")) })
        .then(function () { return report(self, r("exit")) })
        .finally(function () { self.running = false })
    },
})
