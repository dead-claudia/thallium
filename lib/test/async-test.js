"use strict"

var methods = require("../util/methods.js")
var constants = require("../constants.js")
var AsyncTimer = require("../async/async-timer.js")
var Test = require("./test.js")
var timers = require("../util/timers.js")
var report = require("./common.js").report
var iterate = require("../async/iterate.js")
var util = require("../util/util.js")
var o = require("../util/option.js")
var r = util.r

module.exports = AsyncTest
function AsyncTest(methods, name, index, callback) {
    Test.call(this)
    this.methods = methods
    this.name = name
    this.index = index
    this.callback = callback
    this.parent = methods._
}

// Note: this doesn't save the parent, because either it uses a shared
// reference, which may surprise some consumers, or it creates a redundant
// map of nodes and parent nodes, which is wasteful in memory, especially
// for an object likely to be thrown away. If you want the parent, you get
// the entry of the previous index.
function getPath(node) {
    var ret = []

    while (!node.isBase) {
        ret.unshift({
            name: node.name,
            index: node.index,
        })
        node = node.parent
    }

    return ret
}

methods(AsyncTest, Test, {
    getTimeout: function () {
        var ctx = this // eslint-disable-line consistent-this

        // 0 means inherit timeout
        while (!ctx.timeout && !ctx.isBase) {
            ctx = ctx.parent
        }

        return ctx.timeout || constants.DEFAULT_TIMEOUT
    },

    init: function (callback) {
        var methods = Object.create(this.methods)

        methods._ = this

        var self = this
        var timer = new AsyncTimer(fail)
        var count = 0
        var interesting = false

        function pass() {
            if (timer.resolved) return undefined
            timer.resolved = true
            return timers.nextTick(callback, null, r("pass", self.index))
        }

        function fail(err) {
            if (timer.resolved) return undefined
            timer.resolved = true
            return timers.nextTick(callback, null, r("fail", self.index, err))
        }

        function done(err) {
            // Ignore calls to this if something interesting was returned.
            if (interesting) return

            if (count++) {
                // Since the standard sequence has already moved on,
                // the full path is required. Error are ignored in
                // this callback, since there is no reliable way to
                // handle them before the test ends.
                timers.nextTick(report, self, {
                    type: "extra",
                    index: self.index,
                    value: {count: count, value: err},
                    parent: getPath(self.parent),
                }, function () {})
            } else {
                o(err).then(fail, pass)
            }
        }

        try {
            interesting = o(this.callback.call(methods, methods, done))
            .then(function (res) {
                if (util.isThenable(res)) res.then(pass, fail)
                else if (util.isIterator(res)) iterate(res, pass, fail)
                // Not interesting enough. Mark it as such.
                else return null
                return res
            })
            .some()
        } catch (e) {
            // Synchronous failures when initializing an async test
            // are test failures, not fatal errors.
            return timers.nextTick(fail, e)
        }

        // Start the polling after the initialization. The timeout *must* be
        // synchronously set, but the timer won't be affected by a slow
        // initialization.
        timer.start(this.getTimeout())

        return undefined
    },
})
