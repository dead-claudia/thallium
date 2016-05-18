"use strict"

var methods = require("../methods.js")
var Promise = require("bluebird")
var m = require("../messages.js")
var Test = require("./test.js")
var Common = require("./common.js")
var Util = require("../util.js")
var r = Util.r

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

        var self = this

        // not finished, chain off the yielded promise and `step` again
        return Promise.resolve(next.value).then(
            function (v) {
                return self.step(self.gen.next, v, "type.iterate.next")
            },
            function (e) {
                var func = self.gen.throw

                if (typeof func === "function") {
                    return self.step(func, e, "type.iterate.throw")
                } else {
                    return self.reject(e)
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

        return this.resolve(r("pass"))
    },

    fail: function (e) {
        if (this.timer) {
            clearTimeout(this.timer)
            this.timer = null
        }

        return this.resolve(r("fail", e))
    },

    callback: function (err) {
        // Errors are ignored here, since there is no reliable way
        // to handle them after the test ends. Bluebird will warn
        // about unhandled errors to the console, anyways, so it'll
        // be hard to miss.
        if (this.count++) {
            Common.report(this.ctx, r("extra", {count: this.count, value: err}))
            return undefined
        }

        if (err != null) return this.fail(err)
        else return this.pass()
    },

    wrapPromise: function (p) {
        var self = this

        return p.then(
            function () { return self.pass() },
            function (e) { return self.fail(e) })
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
            this.wrapPromise(Promise.resolve(res))
        } else if (Util.isIterator(res)) {
            // No, Bluebird's coroutines don't work.
            this.wrapPromise(iterate(res))
        } else {
            // Not interesting enough. Mark it as such.
            this.interesting = false
        }
    },

    timeoutFail: function () {
        return this.fail(Common.timeoutFail(this.timeout))
    },

    initTimeout: function (start) {
        // We still need to address whether the test took too long during
        // initialization. If the timeout is 50ms, and it took 2 full seconds to
        // load, it should fail.
        this.timeout = Common.getTimeout(this.ctx)

        // Don't bother checking/setting a timeout if it was `Infinity`.
        if (this.timeout !== Infinity) {
            if (Date.now() - start > this.timeout) {
                return this.timeoutFail()
            } else {
                var self = this

                this.timer = setTimeout(function () {
                    self.timeoutFail()
                }, this.timeout)
            }
        }

        return undefined
    },

    run: function () {
        var start = Date.now()

        try {
            this.initBody()
        } catch (e) {
            // Synchronous failures when initializing an async test are test
            // failures, not fatal errors.
            return this.fail(e)
        }

        // Set the timeout *after* initialization. The timeout may not be known
        // until after initialization.
        return this.initTimeout(start)
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
