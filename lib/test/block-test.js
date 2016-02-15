"use strict"

var methods = require("../util/methods.js")
var timers = require("../util/timers.js")
var Test = require("./test.js")
var r = require("../util/util.js").r

module.exports = BlockTest
function BlockTest(methods, name, index, callback) {
    Test.call(this)
    this.methods = methods
    this.name = name
    this.index = index
    this.callback = callback
    this.parent = methods._
}

methods(BlockTest, Test, {
    init: function (callback) {
        var methods = Object.create(this.methods)

        methods._ = this

        try {
            this.callback.call(methods, methods)
        } catch (e) {
            return timers.nextTick(callback, null, r("fail", this.index, e))
        }

        return timers.nextTick(callback, null, r("pass", this.index))
    },
})
