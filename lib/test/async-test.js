"use strict"

var Promise = require("bluebird")
var methods = require("../util/methods.js")
var AsyncTimer = require("../async/async-timer.js")
var Test = require("./test.js")
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

function getTimeout(ctx) {
    // 0 means inherit timeout
    while (!ctx.timeout && !ctx.isBase) {
        ctx = ctx.parent
    }

    return ctx.timeout || DEFAULT_TIMEOUT
}

methods(AsyncTest, Test, {
    init: function () {
        var methods = Object.create(this.methods)

        methods._ = this

        var self = this

        // There's no real way to avoid using the Promise constructor, since
        // it's difficult to handle the cancellation and failing test semantics
        // properly as well.
        return new Promise(function (resolve) {
            var timer = new AsyncTimer(fail)
            var count = 0
            var interesting = false

            function pass() {
                timer.resolved = true
                return resolve(r("pass"))
            }

            function fail(err) {
                timer.resolved = true
                return resolve(r("fail", err))
            }

            function done(err) {
                // Ignore calls to this if something interesting was returned.
                if (interesting) return

                if (count++) {
                    // Errors are ignored here, since there is no reliable way
                    // to handle them after the test ends.
                    report(self, r("extra", {count: count, value: err}))
                } else if (err != null) {
                    fail(err)
                } else {
                    pass()
                }
            }

            try {
                var res = self.callback.call(methods, methods, done)

                // It can't be interesting if the result's nullish.
                interesting = res != null

                if (util.isThenable(res)) {
                    Promise.resolve(res).then(pass, fail)
                } else if (util.isIterator(res)) {
                    // No, Bluebird's coroutines don't work.
                    iterate(res).then(pass, fail)
                } else {
                    // Not interesting enough. Mark it as such.
                    interesting = false
                }
            } catch (e) {
                // Synchronous failures when initializing an async test
                // are test failures, not fatal errors.
                return fail(e)
            }

            // Start the polling after the initialization. The timeout *must* be
            // synchronously set, but the timer won't be affected by a slow
            // initialization.
            timer.start(getTimeout(self))

            return undefined
        })
    },
})
