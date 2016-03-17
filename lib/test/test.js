"use strict"

var methods = require("../util/methods.js")
var m = require("../messages.js")
var common = require("./common.js")
var report = common.report
var r = require("../util/util.js").r

module.exports = Test
function Test() {
    this.plugins = []

    this.tests = []

    // In case this is called out of its own init, that error is caught.
    this.initializing = false

    // Keep this from being run multiple times concurrently.
    this.running = false

    // Necessary for inline tests, which need explicitly marked.
    this.deinit = []

    // 0 means inherit timeout
    this.timeout = 0

    // Placeholders for pretty shape
    this.parent = null
    this.reporters = null
    this.only = null
}

methods(Test, {
    // Set up the default runner.
    run: function (isMain) {
        if (this.running) {
            throw new Error(m("run.concurrent"))
        }

        this.running = true

        var self = this

        return report(self, r("start"))
        .then(function () {
            self.initializing = true
            return self.init()
        })
        .finally(function () {
            // If an error occurs, the initialization has already finished
            // (albeit unsuccessfully)
            self.initializing = false
        })
        .then(function (res) {
            for (var i = 0; i < self.deinit.length; i++) {
                self.deinit[i].initializing = false
            }

            return common.runTests(self, res)
        })
        .tap(function () { return report(self, r("end")) })
        .tap(function (res) { return report(self, r(res.type, res.value)) })
        .then(function () { return isMain && report(self, r("exit")) })
        .finally(function () { self.running = false })
    },
})
