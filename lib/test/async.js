"use strict"

const Promise = require("bluebird")
const m = require("../messages.js")
const Test = require("./test.js")
const report = require("./common.js").report
const Util = require("../util.js")
const r = Util.r

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
    return new Promise((resolve, reject) => {
        function step(func, value, message) {
            let next

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
                v => step(gen.next, v, "type.iterate.next"),
                e => {
                    const func = gen.throw

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

const DEFAULT_TIMEOUT = 2000 // ms

module.exports = class Async extends Test {
    constructor(methods, name, index, callback) {
        super()

        this.methods = methods
        this.name = name
        this.index = index
        this.callback = callback
        this.parent = methods._
    }

    /**
     * Gets the active timeout for the test. This is exported for use in the
     * API.
     *
     * Note that a timeout of 0 means to inherit the parent.
     */
    static getTimeout(ctx) {
        while (!ctx.timeout && !ctx.isRoot) {
            ctx = ctx.parent
        }

        return ctx.timeout || DEFAULT_TIMEOUT
    }

    init() {
        const methods = Object.create(this.methods)

        methods._ = this

        // There's no real way to avoid using the Promise constructor, since
        // it's difficult to handle the cancellation and failing test semantics
        // properly as well.
        return new Promise(resolve => {
            let count = 0
            let interesting = false
            let timer

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
                const res = this.callback.call(methods, methods, err => {
                    // Ignore calls to this if something interesting was already
                    // returned.
                    if (interesting) return

                    // Errors are ignored here, since there is no reliable way
                    // to handle them after the test ends.
                    if (count++) {
                        report(this, r("extra", {count, value: err}))
                        return
                    }

                    if (err != null) fail(err)
                    else pass()
                })

                // It can't be interesting if the result's nullish.
                interesting = res != null

                if (Util.isThenable(res)) {
                    Promise.resolve(res).then(pass, fail)
                } else if (Util.isIterator(res)) {
                    // No, Bluebird's coroutines don't work.
                    iterate(res).then(pass, fail)
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
            const timeout = Async.getTimeout(this)

            // Don't waste time setting a timeout if it was `Infinity`.
            if (timeout !== Infinity) {
                timer = setTimeout(
                    () => fail(new Error(m("async.timeout"))),
                    timeout)
            }

            return undefined
        })
    }
}
