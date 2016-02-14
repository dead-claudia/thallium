"use strict"

var methods = require("../util/methods.js")
var report = require("../common.js").report
var r = require("../util/util.js").r
var Test = require("./test.js")
var InlineTest = require("./inline-test.js")

function runPendingTest(ctx, isMain, callback) {
    ctx.running = true
    var index = isMain ? -1 : ctx.index
    return report(ctx, r("pending", index), function (err) {
        ctx.running = false
        return callback(err)
    })
}

// Initialize the test as an inline test, because the methods still have
// to be exposed.
exports.InlineTest = InlineSkipTest
function InlineSkipTest(methods, name, index) {
    InlineTest.call(this, methods, name, index)
}

methods(InlineSkipTest, InlineTest, {
    run: function (isMain, callback) {
        return runPendingTest(this, isMain, callback)
    },
})

exports.BlockTest = BlockSkipTest
function BlockSkipTest(methods, name, index) {
    Test.call(this)
    this.methods = methods
    this.name = name
    this.index = index
    this.parent = methods._
}

methods(BlockSkipTest, Test, {
    run: function (isMain, callback) {
        return runPendingTest(this, isMain, callback)
    },
})
