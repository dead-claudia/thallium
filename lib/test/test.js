"use strict"

var Promise = require("bluebird")
var methods = require("../methods.js")
var m = require("../messages.js")
var report = require("./common.js").report
var r = require("../util.js").r

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

function fire(ctx, name) {
    return report(ctx, r(name))
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

        return Promise.bind(this, isMain ? fire(this, "start") : undefined)
        .then(/** @this */ function () {
            this.initializing = true
            return this.init()
        })
        // If an error occurs, the initialization still finished (albeit
        // unsuccessfully)
        .finally(/** @this */ function () { this.initializing = false })
        .then(/** @this */ function (res) {
            for (var i = 0; i < this.deinit.length; i++) {
                this.deinit[i].initializing = false
            }

            if (isMain) {
                // Errors at the top level are considered fatal for the parent.
                if (!res.passing) throw res.value
                return Promise.bind(this, this.tests)
                .each(function (test) { return test.run(false) })
                .then(/** @this */ function () { return fire(this, "end") })
            } else if (res.passing && this.tests.length) {
                // Report this as if it was a parent test if it's passing
                // and it has children.
                return Promise.bind(this, this.tests)
                .tap(/** @this */ function () { return fire(this, "enter") })
                .each(function (test) { return test.run(false) })
                .tap(/** @this */ function () { return fire(this, "leave") })
            } else if (res.passing) {
                return report(this, r("pass"))
            } else {
                return report(this, r("fail", res.value))
            }
        })
        .finally(/** @this */ function () { this.running = false })
    },
})
