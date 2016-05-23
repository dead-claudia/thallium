"use strict"

var methods = require("../methods.js")
var Test = require("./test.js")
var p = require("../util.js").p

exports.Inline = Inline
function Inline(methods, name, index, callback) {
    Test.call(this)

    this.name = name
    this.index = index
    this.callback = callback
    this.parent = methods._

    // Initialize the test now, because the methods are immediately
    // returned, instead of being revealed through the callback.
    this.inline = []
    this.initializing = true
    this.methods = Object.create(methods)
    this.methods._ = this
}

methods(Inline, Test, {
    init: function () {
        for (var i = 0; i < this.inline.length; i++) {
            var test = this.inline[i]

            try {
                test.run.apply(undefined, test.args)
            } catch (e) {
                // Stop immediately like what block tests do.
                return p(false, e)
            }
        }

        return p(true)
    },
})

exports.Block = Block
function Block(methods, name, index, callback) {
    Test.call(this)

    this.name = name
    this.index = index
    this.callback = callback
    this.methods = methods
    this.parent = methods._
}

methods(Block, Test, {
    init: function () {
        var methods = Object.create(this.methods)

        methods._ = this

        try {
            this.callback.call(methods, methods)
            return p(true)
        } catch (e) {
            return p(false, e)
        }
    },
})
