"use strict"

var methods = require("../util/methods.js")
var timers = require("../util/timers.js")
var Test = require("./test.js")
var r = require("../util/util.js").r

module.exports = InlineTest

function InlineTest(methods, name, index) {
    Test.call(this)

    // Initialize the test now, because the methods are immediately
    // returned, instead of being revealed through the callback.

    this.name = name
    this.index = index
    this.parent = methods._
    this.methods = Object.create(methods)
    this.methods._ = this
    this.inline = []
    this.initializing = true
}

methods(InlineTest, Test, {
    init: function (callback) {
        for (var i = 0; i < this.inline.length; i++) {
            var inline = this.inline[i]

            try {
                inline.run.apply(undefined, inline.args)
            } catch (e) {
                // Don't run all the assertions.
                return timers.nextTick(callback, null, r("fail", e))
            }
        }

        return timers.nextTick(callback, null, r("pass"))
    },
})
