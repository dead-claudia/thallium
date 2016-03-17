"use strict"

var methods = require("../util/methods.js")
var report = require("./common.js").report
var r = require("../util/util.js").r
var Test = require("./test.js")
var InlineTest = require("./inline-test.js")

/** @this */
function runPendingTest(isMain) {
    var self = this

    self.running = true
    return report(self, r("pending"))
    .finally(function () { self.running = false })
    .then(function () { return isMain && report(self, r("exit")) })
}

// Initialize the test as an inline test, because the methods still have
// to be exposed.
exports.InlineTest = InlineSkipTest
function InlineSkipTest(methods, name, index) {
    InlineTest.call(this, methods, name, index)
}

methods(InlineSkipTest, InlineTest, {run: runPendingTest})

exports.BlockTest = BlockSkipTest
function BlockSkipTest(methods, name, index) {
    Test.call(this)
    this.methods = methods
    this.name = name
    this.index = index
    this.parent = methods._
}

methods(BlockSkipTest, Test, {run: runPendingTest})
