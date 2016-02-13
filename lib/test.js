"use strict"

var methods = require("./methods.js")
var timers = require("./timers.js")
var messages = require("./constants.js").messages
var common = require("./common.js")
var r = require("./util.js").r

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
    run: function (isMain, callback) {
        if (this.running) {
            throw new Error(messages.unsafeRun)
        }

        this.running = true

        var index = isMain ? -1 : this.index
        var self = this

        function exit(err) {
            // This has to be unset regardless of errors.
            self.running = false
            return callback(err)
        }

        function end(err) {
            if (err != null) return exit(err)
            if (isMain) {
                return common.report(self, r("exit", 0), exit)
            } else {
                return exit()
            }
        }

        function runTests(res) {
            return common.report(self, r("end", index), function (err) {
                if (err != null) return exit(err)
                return common.report(self, r(res.type, index, res.value), end)
            })
        }

        timers.nextTick(common.report, this, r("start", index), function (err) {
            if (err != null) return exit(err)
            self.initializing = true
            return self.init(function (err, res) {
                // If an error occurs, the initialization has already finished
                // (albeit unsuccessfully)
                self.initializing = false
                if (err != null) return exit(err)

                for (var i = 0; i < self.deinit.length; i++) {
                    self.deinit[i].initializing = false
                }

                return common.runTests(self, res, function (err, res) {
                    if (err != null) return exit(err)
                    return runTests(res)
                })
            })
        })
    },
})
