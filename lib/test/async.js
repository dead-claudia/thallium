"use strict"

var Promise = require("bluebird")
var m = require("../messages.js").m
var createTest = require("./test.js").createTest
var report = require("./common.js").report
var util = require("../util/util.js")
var r = util.r

function checkResult(result, message) {
    if (typeof result !== "object" || result === null) {
        throw new TypeError(m(message))
    }

    return result
}

/**
 * This is a modified version of the async-await official, non-normative
 * desugaring helper, for better error checking and adapted to accept an
 * already-instantiated iterator instead of a generator.
 */
function iterate(gen) {
    return new Promise(function (resolve, reject) {
        function step(func, value, message) {
            var next

            try {
                next = checkResult(func.call(gen, value), message)
            } catch (e) {
                // finished with failure, reject the promise
                return reject(e)
            }

            if (next.done) {
                // finished with success, resolve the promise
                return resolve(next.value)
            }

            // not finished, chain off the yielded promise and `step` again
            return Promise.resolve(next.value).then(
                function (v) { return step(gen.next, v, "type.iterate.next") },
                function (e) {
                    var func = gen.throw

                    if (typeof func === "function") {
                        return step(func, e, "type.iterate.throw")
                    } else {
                        return reject(e)
                    }
                })
        }

        return step(gen.next, undefined, "type.iterate.next")
    })
}

var DEFAULT_TIMEOUT = 2000 // ms

/**
 * Gets the active timeout for the test. This is exported for use in the API.
 *
 * Note that a timeout of 0 means to inherit the parent.
 */
exports.getTimeout = getTimeout
function getTimeout(ctx) {
    while (!ctx.timeout && !ctx.isBase) {
        ctx = ctx.parent
    }

    return ctx.timeout || DEFAULT_TIMEOUT
}

/** @this */
function init() {
    var self = this
    var methods = Object.create(self.methods)

    methods._ = self

    // There's no real way to avoid using the Promise constructor, since
    // it's difficult to handle the cancellation and failing test semantics
    // properly as well.
    return new Promise(function (resolve) {
        var count = 0
        var interesting = false
        var timer

        function pass() {
            if (timer) {
                clearTimeout(timer)
                timer = undefined
            }

            resolve(r("pass"))
        }

        function fail(e) {
            if (timer) {
                clearTimeout(timer)
                timer = undefined
            }

            resolve(r("fail", e))
        }

        try {
            var res = self.callback.call(methods, methods, function (err) {
                // Ignore calls to this if something interesting was already
                // returned.
                if (interesting) return

                // Errors are ignored here, since there is no reliable way to
                // handle them after the test ends.
                if (count++) {
                    report(self, r("extra", {count: count, value: err}))
                    return
                }

                if (err != null) fail(err)
                else pass()
            })

            // It can't be interesting if the result's nullish.
            interesting = res != null

            if (util.isThenable(res)) {
                return Promise.resolve(res).then(pass, fail)
            } else if (util.isIterator(res)) {
                // No, Bluebird's coroutines don't work.
                return iterate(res).then(pass, fail)
            } else {
                // Not interesting enough. Mark it as such.
                interesting = false
            }
        } catch (e) {
            // Synchronous failures when initializing an async test are test
            // failures, not fatal errors.
            return fail(e)
        }

        // Start the polling after the initialization. The timeout *must* be
        // synchronously set, but the timer won't be affected by a slow
        // initialization.
        var timeout = getTimeout(self)

        // Don't waste time setting a timeout if it was `Infinity`.
        if (timeout !== Infinity) {
            timer = setTimeout(
                function () { fail(new Error(m("async.timeout"))) },
                timeout)
        }

        return undefined
    })
}

exports.createAsyncTest = exports.AsyncTest =
function (methods, name, index, callback) {
    var test = createTest()

    test.methods = methods
    test.name = name
    test.index = index
    test.callback = callback
    test.init = init
    test.parent = methods._

    return test
}
