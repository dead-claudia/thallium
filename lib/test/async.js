"use strict"

var methods = require("../methods.js")
var Promise = require("bluebird")
var m = require("../messages.js")
var Test = require("./test.js")
var Common = require("./common.js")
var Util = require("../util.js")
var r = Util.r
var p = Util.p

// Prevent Sinon interference when they install their mocks
var setTimeout = global.setTimeout
var clearTimeout = global.clearTimeout

function checkResult(result, message) {
    if (typeof result !== "object" || result === null) {
        throw new TypeError(m(message))
    }

    return result
}

function Iterator(gen, resolve, reject) {
    this.gen = gen
    this.resolve = resolve
    this.reject = reject
}

methods(Iterator, {
    step: function (func, value, message) {
        var next

        try {
            next = checkResult(func.call(this.gen, value), message)
        } catch (e) {
            // finished with failure, reject the promise
            return this.reject(e)
        }

        if (next.done) {
            // finished with success, resolve the promise
            return this.resolve(next.value)
        }

        // not finished, chain off the yielded promise and `step` again
        return Promise.bind(this, next.value).then(
            /** @this */ function (v) {
                return this.step(this.gen.next, v, "type.iterate.next")
            },
            /** @this */ function (e) {
                var func = this.gen.throw

                if (typeof func === "function") {
                    return this.step(func, e, "type.iterate.throw")
                } else {
                    return this.reject(e)
                }
            })
    },
})

/**
 * This is a modified version of the async-await official, non-normative
 * desugaring helper, for better error checking and adapted to accept an
 * already-instantiated iterator instead of a generator.
 */
function iterate(gen) {
    return new Promise(function (resolve, reject) {
        var iter = new Iterator(gen, resolve, reject)

        iter.step(gen.next, undefined, "type.iterate.next")
    })
}

// TODO: add slow semantics
function AsyncState(ctx, resolve) {
    this.ctx = ctx
    this.resolve = resolve

    this.count = 0
    this.interesting = false
    this.timer = null
    this.timeout = 0
}

methods(AsyncState, {
    pass: function () {
        if (this.timer) {
            clearTimeout(this.timer)
            this.timer = null
        }

        return this.resolve(p(true))
    },

    fail: function (e) {
        if (this.timer) {
            clearTimeout(this.timer)
            this.timer = null
        }

        return this.resolve(p(false, e))
    },

    callback: function (err) {
        // Errors are ignored here, since there is no reliable way
        // to handle them after the test ends. Bluebird will warn
        // about unhandled errors to the console, anyways, so it'll
        // be hard to miss.
        if (this.count++) {
            // Create a helpful stack to display.
            var e = new Error()

            e.name = ""

            Common.report(this.ctx, r("extra", {
                count: this.count,
                value: err,
                // Trim the initial newline
                stack: e.stack.slice(1),
            }))

            return undefined
        }

        if (err != null) return this.fail(err)
        else return this.pass()
    },

    initBody: function () {
        var methods = Object.create(this.ctx.methods)
        var self = this

        methods._ = this.ctx

        var res = this.ctx.callback.call(methods, methods, function (err) {
            // Ignore calls to this if something interesting was already
            // returned.
            if (self.interesting) return undefined
            return self.callback(err)
        })

        // It can't be interesting if the result's nullish.
        this.interesting = res != null

        if (Util.isThenable(res)) {
            Promise.bind(this, res).then(this.pass, this.fail)
        } else if (Util.isIterator(res)) {
            // No, Bluebird's coroutines don't work.
            iterate(res).bind(this).then(this.pass, this.fail)
        } else {
            // Not interesting enough. Mark it as such.
            this.interesting = false
        }
    },

    timeoutFail: function () {
        return this.fail(Common.timeoutFail(this.timeout))
    },

    initTimeout: function () {
        this.timeout = Common.getTimeout(this.ctx)

        // Don't bother checking/setting a timeout if it was `Infinity`.
        if (this.timeout !== Infinity) {
            var self = this

            this.timer = setTimeout(function () {
                self.timeoutFail()
            }, this.timeout)
        }

        return undefined
    },

    run: function () {
        try {
            this.initBody()
        } catch (e) {
            // Synchronous failures when initializing an async test are test
            // failures, not fatal errors.
            return this.fail(e)
        }

        // Set the timeout *after* initialization. The timeout may not be known
        // until after initialization.
        return this.initTimeout()
    },
})

module.exports = Async
function Async(methods, name, index, callback) {
    Test.call(this)

    this.methods = methods
    this.name = name
    this.index = index
    this.callback = callback
    this.parent = methods._
}

methods(Async, Test, {
    init: function () {
        // There's no real way to avoid using the Promise constructor, since
        // it's difficult to handle the cancellation and failing test semantics
        // properly as well.
        var self = this

        return new Promise(function (resolve) {
            return new AsyncState(self, resolve).run()
        })
    },
})
