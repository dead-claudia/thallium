"use strict"

var Promise = require("bluebird")
var methods = require("../methods.js")
var Test = require("./test.js")
var report = require("./common.js").report
var r = require("../util.js").r

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

        return report(this, r("start")).bind(this)
        .then(/** @this */ function () {
            // Only unset it to run the tests.
            this.initializing = false
            return Promise.each(this.tests, function (test) {
                return test.run(false)
            })
        })
        .finally(/** @this */ function () { this.initializing = true })
        .then(/** @this */ function () { return report(this, r("end")) })
        .finally(/** @this */ function () { this.running = false })
    },
})
