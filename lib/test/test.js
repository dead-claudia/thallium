"use strict"

var methods = require("../methods.js")
var m = require("../messages.js")
var Common = require("./common.js")
var r = require("../util.js").r

var report = Common.report

module.exports = Test
function Test() {
    this.plugins = []
    this.tests = []

    // In case this is called out of its own init, that error is caught.
    this.initializing = false

    // Keep this from being run multiple times concurrently.
    this.running = false

    // Whether this is the root test.
    this.isRoot = false

    // Inline tests need to be marked immediately before running.
    this.deinit = []

    // 0 means inherit timeout
    this.timeout = 0

    // Whether this test was slow.
    this.slow = false
}

methods(Test, {
    /**
     * This runs the test, and returns a promise resolved when it's done.
     *
     * @this {Test} The current context
     * @param {Boolean} isMain Whether the test is run directly as the main
     *                         test or as a child test.
     */
    run: function (isMain) {
        if (this.running) {
            throw new Error(m("run.concurrent"))
        }

        this.running = true

        var self = this

        return report(this, r("start"))
        .then(function () {
            self.initializing = true
            return self.init()
        })
        // If an error occurs, the initialization still finished (albeit
        // unsuccessfully)
        .finally(function () { self.initializing = false })
        .then(function (res) {
            for (var i = 0; i < self.deinit.length; i++) {
                self.deinit[i].initializing = false
            }

            return Common.runTests(self, res)
        })
        .tap(function () { return report(self, r("end")) })
        .tap(function (res) { return report(self, r(res.type, res.value)) })
        .then(function () {
            return isMain ? report(self, r("exit")) : undefined
        })
        .finally(function () { self.running = false })
    },
})
