"use strict"

var ApiUtil = require("./core/api-util.js")
var Errors = require("./errors.js")
var inspect = require("./inspect.js")
var Common = require("./core/common.js")
var methods = require("./methods.js")
var Tests = require("./core/tests.js")
var runTest = require("./core/test.js").runTest
var m = require("./messages.js")
var Flags = require("./core/flags.js")
var Only = require("./core/only.js")

var hasOwn = Object.prototype.hasOwnProperty

var AssertionError = Errors.defineError([
    "class AssertionError extends Error {",
    "    constructor(message, expected, actual) {",
    "        super()",
    "        this.message = message",
    "        this.expected = expected",
    "        this.actual = actual",
    "    }",
    "",
    "    get name() {",
    "        return 'AssertionError'",
    "    }",
    "}",
    "new AssertionError('message', 1, 2)", // check native subclassing support
    "return AssertionError",
], {
    constructor: function (message, expected, actual) {
        Errors.readStack(this)
        this.message = message
        this.expected = expected
        this.actual = actual
    },

    name: "AssertionError",
})

// This formats the assertion error messages.
function format(object) {
    object.message += ""

    if (!object.message) return "unspecified"

    return object.message.replace(/(.?)\{(.+?)\}/g, function (m, pre, prop) {
        if (pre === "\\") return m.slice(1)
        if (hasOwn.call(object, prop)) return pre + inspect(object[prop])
        return pre + m
    })
}

function DelayedCall(run, args) {
    this.run = run
    this.args = args
}

function isLocked(method) {
    return method === "_" ||
        method === "reflect" ||
        method === "only" ||
        method === "use" ||
        method === "reporter" ||
        method === "define" ||
        method === "timeout" ||
        method === "slow" ||
        method === "run" ||
        method === "test" ||
        method === "testSkip" ||
        method === "async" ||
        method === "asyncSkip"
}

function defineAssertion(test, name, func) {
    // Don't let native methods get overridden by assertions
    if (isLocked(name)) {
        throw new RangeError("Method '" + name + "' is locked!")
    }

    function run() {
        var res = func.apply(undefined, arguments)

        if (typeof res !== "object" || res === null) {
            throw new TypeError(m("type.define.return", name))
        }

        if (!res.test) {
            throw new AssertionError(format(res), res.expected,
                res.actual)
        }
    }

    return /** @this */ function () {
        ApiUtil.checkInit(this._)

        if (!ApiUtil.isSkipped(this._)) {
            if ((this._.status & Flags.Inline) !== 0) {
                this._.data.state.inline.push(
                    new DelayedCall(run, ApiUtil.restify.apply([], arguments)))
            } else {
                run.apply(undefined, arguments)
            }
        }

        return this
    }
}

function addSyncTest(test, Ns, name, callback) {
    ApiUtil.checkInit(test)

    // Don't add subtests to parent tests that never run their children. That's
    // a memory leak waiting to happen.
    if (ApiUtil.isSkipped(test) || !ApiUtil.isOnly(test, [name])) {
        if (callback != null) {
            // No need to create a block test that is never used.
            return test
        } else {
            // Inline tests do actually expose themselves before they're run, so
            // that has to be returned.
            return Tests.dummyInline(test.methods, name, 0)
        }
    } else {
        var index = test.tests.length

        if (callback != null) {
            test.tests.push(Ns.block(test.methods, name, index, callback))
            return test
        } else {
            var tt = Ns.inline(test.methods, name, index)

            test.tests.push(tt)
            return tt
        }
    }
}

function addAsyncTest(test, createTest, name, callback) {
    ApiUtil.checkInit(test)

    // Don't add subtests to parent tests that never run their children.
    // That's a memory leak waiting to happen.
    if (!ApiUtil.isSkipped(test) && ApiUtil.isOnly(test, [name])) {
        var index = test.tests.length

        test.tests.push(createTest(test.methods, name, index, callback))
    }

    return test
}

/**
 * This contains the low level, more arcane things that are generally not
 * interesting to anyone other than plugin developers.
 */
function Reflect(test) {
    this._ = test
}

methods(Reflect, {
    /**
     * Create a new Thallium instance
     */
    base: function () {
        return new Thallium()
    },

    /**
     * Get the methods associated with this instance.
     */
    methods: function () {
        ApiUtil.checkInit(this._)
        return this._.methods
    },

    /**
     * Is this test runnable (i.e. running isn't a no-op).
     */
    runnable: function () {
        ApiUtil.checkInit(this._)
        return !!(this._.status & Flags.Skipped)
    },

    /**
     * Is this test specifically skipped (created with `t.testSkip()` or
     * `t.asyncSkip()`).
     */
    skipped: function () {
        ApiUtil.checkInit(this._)
        return !!(this._.status & Flags.HasSkip)
    },

    /**
     * Is this test the root, i.e. top level?
     */
    root: function () {
        ApiUtil.checkInit(this._)
        return !!(this._.status & Flags.Root)
    },

    /**
     * Is this an inline test?
     */
    inline: function () {
        ApiUtil.checkInit(this._)
        return !!(this._.status & Flags.Inline)
    },

    /**
     * Is this an async test?
     */
    async: function () {
        ApiUtil.checkInit(this._)
        return !!(this._.status & Flags.Async)
    },

    /**
     * Get a list of all own reporters. If none were added, an empty list is
     * returned.
     */
    reporters: function () {
        ApiUtil.checkInit(this._)
        if (this._.status & Flags.HasReporter) {
            return this._.reporters.slice()
        } else {
            // For speed reasons, the actual referenced reporters are always the
            // active set.
            return []
        }
    },

    /**
     * Get a list of all active reporters, either on this instance or on the
     * closest parent.
     */
    activeReporters: function () {
        ApiUtil.checkInit(this._)
        return this._.reporters.slice()
    },

    /**
     * Assert that this test is currently being initialized (and is thus safe to
     * modify). This should *always* be used for anything dependent on test
     * state. If you use `define`, `wrap` or `add`, this is already done for
     * you.
     */
    checkInit: function () {
        ApiUtil.checkInit(this._)
    },

    /**
     * Run `func` when assertions are run, only if the test isn't skipped. This
     * is immediately for block and async tests, but deferred for inline tests.
     * It's useful if you need these guarantees.
     */
    do: function (func) {
        if (typeof func !== "function") {
            throw new TypeError(m("type.any.callback"))
        }

        ApiUtil.checkInit(this._)

        if (!ApiUtil.isSkipped(this._) && ApiUtil.isOnly(this._, [])) {
            if (this._.status & Flags.Inline) {
                this._.data.state.inline.push(new DelayedCall(func, []))
            } else {
                func()
            }
        }
    },

    /**
     * Define one or more assertions. This is also defined on the master
     * instance for ease of use.
     */
    define: function (name, func) {
        ApiUtil.checkInit(this._)
        ApiUtil.iterateSetter(this._, name, func, defineAssertion)
    },

    /**
     * Wrap one or more existing methods to patch them. When the wrapped method
     * is called, the wrapper is called with the old function bound to the
     * instance, followed by its normal arguments.
     */
    wrap: function (name, func) {
        ApiUtil.checkInit(this._)

        ApiUtil.iterateSetter(this._, name, func, function (test, name, func) {
            // Don't let `reflect` and `_` change.
            if (name === "reflect" || name === "_") {
                throw new RangeError("Method '" + name + "' is locked!")
            }

            var old = test.methods[name]

            if (typeof old !== "function") {
                throw new TypeError(m("missing.wrap.callback", name))
            }

            return /** @this */ function () {
                var args = ApiUtil.restify.apply([old.bind(this)], arguments)
                var ret = func.apply(this, args)

                return ret !== undefined ? ret : this
            }
        })
    },

    /**
     * Define one or more new methods. The method is called with `this` as both
     * the instance and the first argument, and then the normal arguments
     * afterwards. `checkInit` is automatically called before any of your work
     * is done.
     *
     * If you just want to generate tests and/or batches of assertions, just
     * create a function.
     */
    add: function (name, func) {
        ApiUtil.checkInit(this._)

        ApiUtil.iterateSetter(this._, name, func, function (test, name, func) {
            if (typeof test.methods[name] !== "undefined") {
                throw new TypeError("Method '" + name + "' already exists!")
            }

            return /** @this */ function () {
                ApiUtil.checkInit(this._)

                var args = ApiUtil.restify.apply([this], arguments)
                var ret = func.apply(this, args)

                return ret !== undefined ? ret : this
            }
        })
    },

    /**
     * Get the own, not necessarily active, timeout. 0 means inherit the
     * parent's, and `Infinity` means it's disabled.
     */
    timeout: function () {
        ApiUtil.checkInit(this._)
        return this._.timeout
    },

    /**
     * Get the active timeout in milliseconds, not necessarily own, or the
     * framework default of 2000, if none was set.
     */
    activeTimeout: function () {
        ApiUtil.checkInit(this._)
        return Common.timeout(this._)
    },

    /**
     * Get the own, not necessarily active, slow threshold. 0 means inherit the
     * parent's, and `Infinity` means it's disabled.
     */
    slow: function () {
        ApiUtil.checkInit(this._)
        return this._.slow
    },

    /**
     * Get the active slow threshold in milliseconds, not necessarily own, or
     * the framework default of 75, if none was set.
     */
    activeSlow: function () {
        ApiUtil.checkInit(this._)
        return Common.slow(this._)
    },

    /**
     * Get the parent test.
     */
    parent: function () {
        ApiUtil.checkInit(this._)
        if (this._.status & Flags.Root) return undefined
        else return this._.data.parent.methods
    },

    /**
     * A reference to the AssertionError constructor.
     */
    AssertionError: AssertionError,
})

module.exports = Thallium
function Thallium() {
    this._ = Tests.base(this)
}

methods(Thallium, {
    /**
     * Contains several internal methods that are not as useful for most users,
     * but give plenty of access to details for plugin/reporter/etc. developers,
     * in case they need it.
     */
    reflect: function () {
        ApiUtil.checkInit(this._)
        return new Reflect(this._)
    },

    /**
     * Whitelist specific tests, using array-based selectors where each entry
     * is either a string or regular expression.
     *
     * Returns the current instance for chaining.
     */
    only: function (/* ...selectors */) {
        ApiUtil.checkInit(this._)

        if (!ApiUtil.isSkipped(this._)) {
            this._.status |= Flags.HasOnly
            this._.only = new Only.Only()

            for (var i = 0; i < arguments.length; i++) {
                var selector = arguments[i]

                if (!Array.isArray(selector)) {
                    throw new TypeError(m("type.only.index", i))
                }

                Only.add(this._.only, selector)
            }
        }

        return this
    },

    /**
     * Use a number of plugins. Note that this does nothing for skipped/filtered
     * tests for memory reasons.
     *
     * Returns the current instance for chaining.
     */
    use: function (/* ...plugins */) {
        ApiUtil.checkInit(this._)

        if (!ApiUtil.isSkipped(this._)) {
            for (var i = 0; i < arguments.length; i++) {
                var plugin = arguments[i]

                if (typeof plugin !== "function") {
                    throw new TypeError(m("type.plugin"))
                }

                if (this._.plugins.indexOf(plugin) === -1) {
                    // Add plugin before calling it.
                    this._.plugins.push(plugin)
                    plugin.call(this, this)
                }
            }
        }

        return this
    },

    /**
     * Add a number of reporters. Note that this does add reporters to skipped
     * tests, because they're still runnable.
     *
     * Returns the current instance for chaining.
     */
    reporter: function (/* ...reporters */) {
        ApiUtil.checkInit(this._)

        for (var i = 0; i < arguments.length; i++) {
            var reporter = arguments[i]

            if (typeof reporter !== "function") {
                throw new TypeError(m("type.reporter"))
            }

            if (!(this._.status & Flags.HasReporter)) {
                this._.status |= Flags.HasReporter
                this._.reporters = [reporter]
            } else if (this._.reporters.indexOf(reporter) < 0) {
                this._.reporters.push(reporter)
            }
        }

        return this
    },

    /**
     * Define one or more assertions.
     *
     * Returns the current instance for chaining.
     */
    define: function (name, func) {
        ApiUtil.checkInit(this._)
        ApiUtil.iterateSetter(this._, name, func, defineAssertion)
        return this
    },

    /**
     * This sets the timeout in milliseconds, rounding negatives to 0, and
     * returns the current instance for chaining. Setting the timeout to 0 means
     * to inherit the parent timeout, and setting it to `Infinity` disables it.
     */
    timeout: function (timeout) {
        ApiUtil.checkInit(this._)
        this._.timeout = Math.max(+timeout, 0)
        return this
    },

    /**
     * This sets the slow threshold in milliseconds, rounding negatives to 0,
     * and returns the current instance for chaining. Setting the timeout to 0
     * means to inherit the parent threshold, and setting it to `Infinity`
     * disables it.
     */
    slow: function (slow) {
        ApiUtil.checkInit(this._)
        this._.slow = Math.max(+slow, 0)
        return this
    },

    /**
     * Run the tests (or the test's tests if it's not a base instance). Pass a
     * `callback` to be called with a possible error, and this returns a promise
     * otherwise.
     */
    run: function (callback) {
        if (typeof callback !== "function" && callback != null) {
            throw new TypeError(m("type.callback.optional"))
        }

        ApiUtil.checkInit(this._)

        if (this._.status & Flags.Running) {
            throw new Error(m("run.concurrent"))
        }

        var test = this._

        return runTest(test, true)
        // Tell the reporter something happened. Otherwise, it'll have to wrap
        // this method in a plugin, which shouldn't be necessary.
        .catch(function (e) {
            return Common.report(test, Common.r("error", e, -1)).throw(e)
        })
        .bind().return()
        .asCallback(callback)
    },

    /**
     * Add a skipped block or inline test.
     */
    testSkip: function (name, callback) {
        if (typeof name !== "string") {
            throw new TypeError(m("type.test.name"))
        }

        if (typeof callback !== "function" && callback != null) {
            throw new TypeError(m("type.callback.optional"))
        }

        return addSyncTest(this._, Tests.Skip, name, callback).methods
    },

    /**
     * Add a block or inline test.
     */
    test: function (name, callback) {
        if (typeof name !== "string") {
            throw new TypeError(m("type.test.name"))
        }

        if (typeof callback !== "function" && callback != null) {
            throw new TypeError(m("type.callback.optional"))
        }

        return addSyncTest(this._, Tests.Sync, name, callback).methods
    },

    /**
     * Add a skipped async test.
     */
    asyncSkip: function (name, callback) {
        if (typeof name !== "string") {
            throw new TypeError(m("type.test.name"))
        }

        if (typeof callback !== "function") {
            throw new TypeError(m("type.async.callback"))
        }

        return addAsyncTest(this._, Tests.Skip.block, name, callback).methods
    },

    /**
     * Add an async test.
     */
    async: function (name, callback) {
        if (typeof name !== "string") {
            throw new TypeError(m("type.test.name"))
        }

        if (typeof callback !== "function") {
            throw new TypeError(m("type.async.callback"))
        }

        return addAsyncTest(this._, Tests.async, name, callback).methods
    },
})
