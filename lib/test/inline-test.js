"use strict"

var Promise = require("bluebird")
var methods = require("../util/methods.js")
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
    init: function () {
        var self = this

        return new Promise(function (resolve) {
            for (var i = 0; i < self.inline.length; i++) {
                var inline = self.inline[i]

                try {
                    inline.run.apply(undefined, inline.args)
                } catch (e) {
                    // Don't run all the assertions.
                    return resolve(r("fail", e))
                }
            }

            return resolve(r("pass"))
        })
    },
})
