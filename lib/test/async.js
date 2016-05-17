"use strict"

const Promise = require("bluebird")
const m = require("../messages.js")
const Test = require("./test.js")
const Common = require("./common.js")
const Util = require("../util.js")
const r = Util.r

function checkResult(result, message) {
    if (typeof result !== "object" || result === null) {
        throw new TypeError(m(message))
    }

    return result
}

class Iterator {
    constructor(gen, resolve, reject) {
        this.gen = gen
        this.resolve = resolve
        this.reject = reject
    }

    step(func, value, message) {
        let next

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
        return Promise.resolve(next.value).then(
            v => this.step(this.gen.next, v, "type.iterate.next"),
            e => {
                const func = this.gen.throw

                if (typeof func === "function") {
                    return this.step(func, e, "type.iterate.throw")
                } else {
                    return this.reject(e)
                }
            })
    }
}

/**
 * This is a modified version of the async-await official, non-normative
 * desugaring helper, for better error checking and adapted to accept an
 * already-instantiated iterator instead of a generator.
 */
function iterate(gen) {
    return new Promise((resolve, reject) => {
        const iter = new Iterator(gen, resolve, reject)

        iter.step(gen.next, undefined, "type.iterate.next")
    })
}

// TODO: add slow semantics
class AsyncState {
    constructor(ctx, resolve) {
        this.ctx = ctx
        this.resolve = resolve

        this.count = 0
        this.interesting = false
        this.timer = null
        this.timeout = 0
    }

    pass() {
        if (this.timer) {
            clearTimeout(this.timer)
            this.timer = null
        }

        return this.resolve(r("pass"))
    }

    fail(e) {
        if (this.timer) {
            clearTimeout(this.timer)
            this.timer = null
        }

        return this.resolve(r("fail", e))
    }

    callback(err) {
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
    }

    wrapPromise(p) {
        return p.then(() => this.pass(), e => this.fail(e))
    }

    initBody() {
        const methods = Object.create(this.ctx.methods)

        methods._ = this.ctx

        const res = this.ctx.callback.call(methods, methods, err => {
            // Ignore calls to this if something interesting was already
            // returned.
            if (this.interesting) return undefined
            return this.callback(err)
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
    }

    timeoutFail() {
        return this.fail(Common.timeoutFail(this.timeout))
    }

    initTimeout(start) {
        // We still need to address whether the test took too long during
        // initialization. If the timeout is 50ms, and it took 2 full seconds to
        // load, it should fail.
        this.timeout = Common.getTimeout(this.ctx)

        // Don't bother checking/setting a timeout if it was `Infinity`.
        if (this.timeout !== Infinity) {
            if (Date.now() - start > this.timeout) {
                return this.timeoutFail()
            } else {
                this.timer = setTimeout(() => this.timeoutFail(), this.timeout)
            }
        }

        return undefined
    }

    run() {
        const start = Date.now()

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
    }
}

module.exports = class Async extends Test {
    constructor(methods, name, index, callback) {
        super()

        this.methods = methods
        this.name = name
        this.index = index
        this.callback = callback
        this.parent = methods._
    }

    init() {
        // There's no real way to avoid using the Promise constructor, since
        // it's difficult to handle the cancellation and failing test semantics
        // properly as well.
        return new Promise(resolve => new AsyncState(this, resolve).run())
    }
}
