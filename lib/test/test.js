"use strict"

var m = require("../messages.js")
var Common = require("./common.js")
var r = require("../util/util.js").r

var report = Common.report

exports.create = function () {
    // Seal for safety
    return {
        plugins: [],
        tests: [],
        run: run,

        // In case this is called out of its own init, that error is caught.
        initializing: false,

        // Keep this from being run multiple times concurrently.
        running: false,

        // Whether this is the root test.
        isRoot: false,

        // Inline tests need to be marked immediately before running.
        deinit: [],

        // 0 means inherit timeout
        timeout: 0,
    }
}

/**
 * This runs the test, and returns a promise resolved when it's done.
 *
 * @this {Test} The current context
 * @param {Boolean} isMain Whether the test is run directly as the main
 *                         test or as a child test.
 */
function run(isMain) {
    if (this.running) {
        throw new Error(m("run.concurrent"))
    }

    this.running = true

    return report(this, r("start")).bind(this)
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

        return Common.runTests(this, res)
    })
    .tap(/** @this */ function () { return report(this, r("end")) })
    .tap(/** @this */ function (res) {
        return report(this, r(res.type, res.value))
    })
    .then(/** @this */ function () {
        if (isMain) return report(this, r("exit"))
        else return undefined
    })
    .finally(/** @this */ function () { this.running = false })
}
