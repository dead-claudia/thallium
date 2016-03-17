"use strict"

var Promise = require("bluebird")
var methods = require("../util/methods.js")
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
    init: function () {
        var methods = Object.create(this.methods)

        methods._ = this

        var self = this

        return new Promise(function (resolve) {
            try {
                self.callback.call(methods, methods)
            } catch (e) {
                return resolve(r("fail", e))
            }

            return resolve(r("pass"))
        })
    },
})
