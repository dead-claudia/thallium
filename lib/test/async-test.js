"use strict"

var methods = require("../util/methods.js")
var AsyncTimer = require("../async/async-timer.js")
var Test = require("./test.js")
var nextTick = require("../util/timers.js").nextTick
var report = require("./common.js").report
var iterate = require("../async/iterate.js")
var util = require("../util/util.js")
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

// In milliseconds
var DEFAULT_TIMEOUT = AsyncTest.DEFAULT_TIMEOUT = 2000

methods(AsyncTest, Test, {
    getTimeout: function () {
        var ctx = this // eslint-disable-line consistent-this

        // 0 means inherit timeout
        while (!ctx.timeout && !ctx.isBase) {
            ctx = ctx.parent
        }

        return ctx.timeout || DEFAULT_TIMEOUT
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
            return nextTick(callback, null, r("pass"))
        }

        function fail(err) {
            if (timer.resolved) return undefined
            timer.resolved = true
            return nextTick(callback, null, r("fail", err))
        }

        function done(err) {
            // Ignore calls to this if something interesting was returned.
            if (interesting) return

            if (count++) {
                // Since the standard sequence has already moved on, the full
                // path is required. Error are ignored in this callback, since
                // there is no reliable way to handle them before the test ends.
                nextTick(report, self,
                    r("extra", {count: count, value: err}),
                    function () {})
            } else if (err != null) {
                fail(err)
            } else {
                pass()
            }
        }

        try {
            var res = this.callback.call(methods, methods, done)

            // It can't be interesting if the result's nullish.
            interesting = res != null

            if (util.isThenable(res)) {
                res.then(pass, fail)
            } else if (util.isIterator(res)) {
                iterate(res, pass, fail)
            } else {
                // Not interesting enough. Mark it as such.
                interesting = false
            }
        } catch (e) {
            // Synchronous failures when initializing an async test
            // are test failures, not fatal errors.
            return nextTick(fail, e)
        }

        // Start the polling after the initialization. The timeout *must* be
        // synchronously set, but the timer won't be affected by a slow
        // initialization.
        timer.start(this.getTimeout())

        return undefined
    },
})
