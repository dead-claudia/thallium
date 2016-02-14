"use strict"

var methods = require("../util/methods.js")
var timers = require("../timers.js")
var Test = require("./test.js")
var InlineTest = require("./inline-test.js")

// Initialize the test as an inline test, because the methods still have
// to be exposed.
exports.InlineTest = InlineDummyTest
function InlineDummyTest(methods, name, index) {
    InlineTest.call(this, methods, name, index)
}

methods(InlineDummyTest, InlineTest, {
    // Don't do anything.
    run: function (isMain, callback) {
        return timers.nextTick(callback)
    },
})

exports.BlockTest = BlockDummyTest
function BlockDummyTest(methods, name, index) {
    Test.call(this)
    this.methods = methods
    this.name = name
    this.index = index
    this.parent = methods._
}

methods(BlockDummyTest, Test, {
    // Don't do anything.
    run: function (isMain, callback) {
        return timers.nextTick(callback)
    },
})
