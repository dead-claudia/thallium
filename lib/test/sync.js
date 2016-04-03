"use strict"

var createTest = require("./test.js").createTest
var r = require("../util/util.js").r

function createSyncTest(opts) {
    return function (methods, name, index, callback) {
        var ret = createTest()

        ret.name = name
        ret.index = index
        ret.callback = callback
        ret.init = opts.init
        ret.parent = methods._
        opts.construct.call(ret, methods)
        return ret
    }
}

exports.createInlineTest = exports.InlineTest = createSyncTest({
    construct: function (methods) {
        // Initialize the test now, because the methods are immediately
        // returned, instead of being revealed through the callback.
        this.inline = []
        this.initializing = true
        this.methods = Object.create(methods)
        this.methods._ = this
    },

    init: function () {
        for (var i = 0; i < this.inline.length; i++) {
            var test = this.inline[i]

            try {
                test.run.apply(undefined, test.args)
            } catch (e) {
                // Stop immediately like what block tests do.
                return r("fail", e)
            }
        }

        return r("pass")
    },
})

exports.createBlockTest = exports.BlockTest = createSyncTest({
    construct: function (methods) {
        this.methods = methods
    },

    init: function () {
        var methods = Object.create(this.methods)

        methods._ = this

        try {
            this.callback.call(methods, methods)
            return r("pass")
        } catch (e) {
            return r("fail", e)
        }
    },
})
