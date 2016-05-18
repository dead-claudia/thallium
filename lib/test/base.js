"use strict"

var methods = require("../methods.js")
var Test = require("./test.js")
var Common = require("./common.js")
var r = require("../util.js").r

var report = Common.report

module.exports = Base
function Base(methods) {
    Test.call(this, methods)

    this.methods = methods
    this.index = 0
    this.reporters = []
    this.isRoot = true
    this.initializing = true
}

methods(Base, Test, {
    run: function () {
        this.running = true

        var self = this

        return report(this, r("start"))
        .then(function () {
            // Only unset it to run the tests.
            self.initializing = false
            return Common.runTests(self, r("pass"))
        })
        .finally(function () { self.initializing = true })
        .then(function () { return report(self, r("end")) })
        .then(function () { return report(self, r("exit")) })
        .finally(function () { self.running = false })
    },
})
