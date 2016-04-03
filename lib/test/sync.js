"use strict"

var Test = require("./test.js")
var r = require("../util/util.js").r

function createSyncTest(opts) {
    return function (methods, name, index, callback) {
        var ret = Test.create()

        ret.name = name
        ret.index = index
        ret.callback = callback
        ret.parent = methods._
        ret.init = opts.init
        opts.construct(ret, methods)
        return ret
    }
}

exports.createInline = createSyncTest({
    construct: function (ret, methods) {
        // Initialize the test now, because the methods are immediately
        // returned, instead of being revealed through the callback.
        ret.inline = []
        ret.initializing = true
        ret.methods = Object.create(methods)
        ret.methods._ = ret
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

exports.createBlock = createSyncTest({
    construct: function (ret, methods) {
        ret.methods = methods
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
