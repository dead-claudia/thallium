"use strict"

var methods = require("./methods.js")
var Test = require("./test.js")
var timers = require("./timers.js")
var common = require("./common.js")
var r = require("./util.js").r

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
    run: function (_, callback) {
        this.running = true

        var self = this

        function exit(err) {
            self.running = false
            return callback(err)
        }

        timers.nextTick(common.report, self, r("start", -1), function (err) {
            if (err != null) return exit(err)

            // Only unset it to run the tests.
            self.initializing = false

            return common.runTests(self, r("pass", 0), function (err) {
                // If an error occurs, the tests have already been run
                // (albeit unsuccessfully)
                self.initializing = true
                if (err != null) return exit(err)
                return common.report(self, r("end", -1), function (err) {
                    if (err != null) return exit(err)
                    return common.report(self, r("exit", 0), exit)
                })
            })
        })
    },
})
