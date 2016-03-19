import m from "./messages.js"

import AssertionError from "./assertion-error.js"
import inspect from "./util/inspect.js"

import BaseTest from "./test/base-test.js"
import InlineTest from "./test/inline-test.js"
import BlockTest from "./test/block-test.js"
import * as dummy from "./test/dummy-test.js"
import * as skip from "./test/skip-test.js"
import AsyncTest, {getTimeout} from "./test/async-test.js"

import {activeReporters} from "./test/common.js"
import {isIterator, bind} from "./util/util.js"
import Only from "./only.js"

function checkInit(ctx) {
    if (!ctx.initializing) {
        throw new ReferenceError(m("fail.checkInit"))
    }
}

// This is used to pull the common part out of `do()` and `block()`, so if one's
// changed, the other still has the correct implementation.
function doBlock(ctx, func) {
    if (typeof func !== "function") {
        throw new TypeError(m("type.any.callback"))
    }

    checkInit(ctx._)

    if (ctx._.inline) {
        ctx._.inline.push({run: func, args: []})
    } else {
        func()
    }

    return ctx
}

// This handles possibly nested arrays of arguments.
function iterateCall(args, func) {
    for (const arg of args) {
        if (Array.isArray(arg)) {
            iterateCall(arg, func)
        } else {
            func(arg)
        }
    }
}

// This handles name + func vs object with methods.
function makeSetter(name, func, run) {
    if (typeof name === "object") {
        for (const key of Object.keys(name)) {
            run(key, name[key])
        }
    } else {
        if (typeof name !== "string") {
            throw new TypeError(m("type.setters.name"))
        }

        run(name, func)
    }
}

// This formats the assertion error messages.
function format(obj) {
    if (!obj.message) return "unspecified"
    return obj.message.replace(/(.?)\{(.+?)\}/g, (m, pre, prop) => {
        if (pre === "\\") return m.slice(1)
        if ({}.hasOwnProperty.call(obj, prop)) {
            return pre + inspect(obj[prop])
        }
        return m
    })
}

// This checks if the test was whitelisted in a `t.only()` call, or for
// convenience, returns `true` if `t.only()` was never called.
function isOnly(test, name) {
    const path = [name]

    // This gets the path in reverse order. A FIFO stack is appropriate here.
    while (test.only == null && !test.isBase) {
        path.push(test.name)
        test = test.parent
    }

    // If no `only` is active, then anything works.
    if (test.only == null) return true
    return test.only.check(path)
}

function runTest(ctx, ns, name, callback) {
    checkInit(ctx._)

    if (typeof name !== "string") {
        throw new TypeError(m("type.test.name"))
    }

    if (typeof callback !== "function" && callback != null) {
        throw new TypeError(m("type.callback.optional"))
    }

    if (!isOnly(ctx._, name)) {
        ns = dummy
    }

    const index = ctx._.tests.length

    if (callback == null) {
        const t = new ns.InlineTest(ctx, name, index)

        ctx._.tests.push(t)
        return t.methods
    } else {
        ctx._.tests.push(new ns.BlockTest(ctx, name, index, callback))
        return ctx
    }
}

function runAsync(ctx, Test, name, callback) {
    if (typeof name !== "string") {
        throw new TypeError(m("type.test.name"))
    }

    if (typeof callback !== "function" && !isIterator(callback)) {
        throw new TypeError(m("type.async.callback"))
    }

    checkInit(ctx._)

    const T = isOnly(ctx._, name) ? Test : dummy.BlockTest
    const index = ctx._.tests.length

    ctx._.tests.push(new T(ctx, name, index, callback))
}

/**
 * Factory for creating Techtonic instances.
 */
export default class Techtonic {
    constructor() {
        this._ = new BaseTest(this)
    }

    /**
     * Exposed for testing, but might be interesting for consumers.
     */
    base() {
        return new Techtonic()
    }

    /**
     * Whitelist specific tests, using array-based selectors where each entry
     * is either a string or regular expression.
     *
     * Returns the current instance for chaining.
     */
    only(...selectors) {
        checkInit(this._)

        this._.only = new Only()

        let i = 0

        for (const selector of selectors) {
            if (!Array.isArray(selector)) {
                throw new TypeError(m("type.only.index", i))
            }

            this._.only.add(selector)

            i++
        }

        return this
    }

    /**
     * Run `func` when tests are run. This is synchronous for block and async
     * tests, but not inline tests. It's probably most useful for plugin
     * authors.
     *
     * Returns the current instance for chaining.
     */
    do(func) {
        return doBlock(this, func)
    }

    /**
     * ES3-compatible alias of `t.do()`. Does exactly the same thing.
     */
    block(func) {
        return doBlock(this, func)
    }

    /**
     * Use a number of plugins. Possibly nested lists of them are also
     * supported.
     *
     * Returns the current instance for chaining.
     */
    use(...plugins) {
        checkInit(this._)

        iterateCall(plugins, plugin => {
            if (typeof plugin !== "function") {
                throw new TypeError(m("type.plugin"))
            }

            if (this._.plugins.indexOf(plugin) < 0) {
                // Add plugin before calling it.
                this._.plugins.push(plugin)
                plugin.call(this, this)
            }
        })

        return this
    }

    /**
     * Add a number of reporters. Possibly nested lists of them are also
     * supported.
     *
     * Returns the current instance for chaining.
     */
    reporter(...reporters) {
        checkInit(this._)

        iterateCall(reporters, reporter => {
            if (typeof reporter !== "function") {
                throw new TypeError(m("type.reporter"))
            }

            if (this._.reporters == null) {
                this._.reporters = [reporter]
            } else if (this._.reporters.indexOf(reporter) < 0) {
                this._.reporters.push(reporter)
            }
        })

        return this
    }

    /**
     * Define one or more (if an object is passed) assertions.
     *
     * Returns the current instance for chaining.
     */
    define(name, func) {
        checkInit(this._)

        makeSetter(name, func, (name, func) => {
            if (typeof func !== "function") {
                throw new TypeError(m("type.define.callback", name))
            }

            function run(...args) {
                const res = func(...args)

                if (typeof res !== "object" || res == null) {
                    throw new TypeError(m("type.define.return", name))
                }

                if (!res.test) {
                    throw new AssertionError(
                        format(res),
                        res.expected,
                        res.actual)
                }
            }

            this[name] = function (...args) {
                checkInit(this._)
                if (this._.inline) {
                    this._.inline.push({run, args})
                } else {
                    run(...args)
                }

                return this
            }
        })

        return this
    }

    /**
     * Wrap one or more (if an object is passed) existing methods.
     *
     * Returns the current instance for chaining.
     */
    wrap(name, func) {
        checkInit(this._)

        makeSetter(name, func, (name, func) => {
            if (typeof func !== "function") {
                throw new TypeError(m("type.define.callback", name))
            }

            const old = this[name]

            if (typeof old !== "function") {
                throw new TypeError(m("missing.wrap.callback", name))
            }

            this[name] = function (...args) {
                checkInit(this._)

                const ret = func(bind(old, this), ...args)

                return ret !== undefined ? ret : this
            }
        })

        return this
    }

    /**
     * Define one or more (if an object is passed) new methods.
     *
     * Returns the current instance for chaining.
     */
    add(name, func) {
        checkInit(this._)

        makeSetter(name, func, (name, func) => {
            if (typeof func !== "function") {
                throw new TypeError(m("type.define.callback", name))
            }

            this[name] = function (...args) {
                checkInit(this._)

                const ret = func.call(this, this, ...args)

                return ret !== undefined ? ret : this
            }
        })

        return this
    }

    /**
     * If an argument was passed, this sets the timeout in milliseconds,
     * rounding negatives to 0, and returns the current instance for chaining.
     * Setting the timeout to 0 means to inherit the parent timeout, and setting
     * it to `Infinity` disables it.
     *
     * Otherwise, it returns the active (not necessarily own) timeout, or the
     * framework default of 2000 milliseconds.
     */
    timeout(timeout) {
        if (timeout != null) {
            checkInit(this._)
            if (timeout < 0) timeout = 0
            this._.timeout = timeout
            return this
        } else {
            return getTimeout(this._)
        }
    }

    /**
     * Get the parent test. Mostly useful for plugin authors.
     */
    parent() {
        if (this._.isBase) return undefined
        return this._.parent.methods
    }

    /**
     * Assert that this test is currently being initialized (and is thus safe to
     * modify). This should *always* be used by plugin authors if a test method
     * modifies state. If you use `define`, `wrap` or `add`, this is already
     * done for you.
     *
     * Returns the current instance for chaining.
     */
    checkInit() {
        checkInit(this._)
        return this
    }

    /**
     * Run the tests (or the test's tests if it's not a base instance). Pass a
     * `callback` to be called with a possible error, and this returns a promise
     * otherwise.
     */
    run(callback) {
        if (typeof callback !== "function" && callback != null) {
            throw new TypeError(m("type.callback.optional"))
        }

        checkInit(this._)

        if (this._.running) {
            throw new Error(m("run.concurrent"))
        }

        return this._.run(true).asCallback(callback)
    }

    /**
     * Add a skipped block or inline test.
     */
    testSkip(name, callback) {
        return runTest(this, skip, name, callback)
    }

    /**
     * Add a block or inline test.
     */
    test(name, callback) {
        return runTest(this, {InlineTest, BlockTest}, name, callback)
    }

    /**
    * Add a skipped async test.
    */
    asyncSkip(name, callback) {
        runAsync(this, skip.BlockTest, name, callback)

        return this
    }

    /**
     * Add an async test.
     */
    async(name, callback) {
        runAsync(this, AsyncTest, name, callback)

        return this
    }

    /**
     * Get a list of all active reporters, either on this instance or on the
     * closest parent.
     */
    reporters() {
        return activeReporters(this._).slice()
    }

    /**
     * Check if this is an inline test. Mostly useful for plugin authors.
     */
    inline() {
        return this._.inline
    }

    // Export the AssertionError constructor
    get AssertionError() {
        return AssertionError
    }
}
