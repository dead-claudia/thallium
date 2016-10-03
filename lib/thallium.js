"use strict"

var Promise = require("./bluebird.js")
var m = require("./messages.js")
var methods = require("./methods.js")

var Tests = require("./tests.js")
var Flags = Tests.Flags
var Types = Tests.Types

var assert = require("../assert.js")
var AssertionError = assert.AssertionError
var format = assert.format

function checkInit(test) {
    if (!(test.status & Flags.Init)) {
        throw new ReferenceError(m("fail.checkInit"))
    }
}

// This is literally run for most of the primary API, so it must be fast.
function isSkipped(test) {
    // Roots aren't skippable, so that must be checked as well.
    return test.status & (
        Flags.Root |
        Flags.Skipped |
        Flags.OnlyChild
    ) === Flags.Skipped
}

function getEnumerableSymbols(keys, object) {
    var symbols = Object.getOwnPropertySymbols(object)

    for (var i = 0; i < symbols.length; i++) {
        var sym = symbols[i]

        if (Object.getOwnPropertyDescriptor(sym).enumerable) keys.push(sym)
    }
}

// This handles name + func vs object with methods.
function iterateSetter(test, name, func, iterator) {
    // Check both the name and function, so ES6 symbol polyfills (which use
    // objects since it's impossible to fully polyfill primitives) work.
    if (typeof name === "object" && name != null && func == null) {
        var keys = Object.keys(name)

        if (typeof Object.getOwnPropertySymbols === "function") {
            getEnumerableSymbols(keys, name)
        }

        for (var i = 0; i < keys.length; i++) {
            var key = keys[i]

            if (typeof name[key] !== "function") {
                throw new TypeError(m("type.define.callback", key))
            }

            test.methods[key] = iterator(test, key, name[key])
        }
    } else {
        if (typeof func !== "function") {
            throw new TypeError(m("type.define.callback", name))
        }

        test.methods[name] = iterator(test, name, func)
    }
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
            throw new AssertionError(
                format(res.message, res),
                res.expected, res.actual)
        }
    }

    return /** @this */ function () {
        checkInit(this._)

        if (!isSkipped(this._)) {
            if ((this._.status & Flags.Inline) !== 0) {
                var args = []

                for (var i = 0; i < arguments.length; i++) {
                    args.push(arguments[i])
                }

                this._.data.state.inline.push(new DelayedCall(run, args))
            } else {
                run.apply(undefined, arguments)
            }
        }

        return this
    }
}

/**
 * The whitelist is actually stored as a binary search tree for faster lookup
 * times when there are multiple selectors. Objects can't be used for the nodes,
 * where keys represent values and values represent children, because regular
 * expressions aren't possible to use.
 */

function isEquivalent(entry, item) {
    if (typeof entry === "string" && typeof item === "string") {
        return entry === item
    } else if (entry instanceof RegExp && item instanceof RegExp) {
        return entry.toString() === item.toString()
    } else {
        return false
    }
}

function matches(entry, item) {
    if (typeof entry === "string") {
        return entry === item
    } else {
        return entry.test(item)
    }
}

function Only(value) {
    this.value = value
    this.children = []
}

var found = false

function find(comparator, node, entry) {
    for (var i = 0; i < node.children.length; i++) {
        var child = node.children[i]

        if (comparator(child.value, entry)) {
            found = true
            return child
        }
    }

    found = false
    return undefined
}

function onlyAdd(node, selector) {
    for (var i = 0; i < selector.length; i++) {
        var entry = selector[i]

        // Strings and regular expressions are the only things allowed.
        if (typeof entry !== "string" && !(entry instanceof RegExp)) {
            throw new TypeError(m("type.only.selector"))
        }

        var child = find(isEquivalent, node, entry)

        if (!found) {
            child = new Only(entry)
            node.children.push(child)
        }

        node = child
    }
}

/**
 * This checks if the test was whitelisted in a `t.only()` call, or for
 * convenience, returns `true` if `t.only()` was never called. Note that `path`
 * is assumed to be an array-based stack, and it will be mutated.
 */
function isOnly(test, path) {
    var i = path.length|0

    while (!(test.status & (Flags.Root | Flags.HasOnly))) {
        path.push(test.data.name)
        test = test.data.parent
        i++
    }

    // If there isn't any `only` active, then let's skip the check and return
    // `true` for convenience.
    if (test.status & Flags.HasOnly) {
        var current = test.only

        while (i !== 0) {
            current = find(matches, current, path[--i])
            if (!found) return false
        }
    }

    return true
}

function addSyncTest(test, block, inline, name, callback) { // eslint-disable-line max-params, max-len
    checkInit(test)

    // Don't add subtests to parent tests that never run their children. That's
    // a memory leak waiting to happen.
    if (isSkipped(test) || !isOnly(test, [name])) {
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
            test.tests.push(block(test.methods, name, index, callback))
            return test
        } else {
            var tt = inline(test.methods, name, index)

            test.tests.push(tt)
            return tt
        }
    }
}

function addAsyncTest(test, createTest, name, callback) {
    checkInit(test)

    // Don't add subtests to parent tests that never run their children.
    // That's a memory leak waiting to happen.
    if (!isSkipped(test) && isOnly(test, [name])) {
        var index = test.tests.length

        test.tests.push(createTest(test.methods, name, index, callback))
    }

    return test
}

/**
 * @this {State}
 * Run `func` with `...args` when assertions are run, only if the test isn't
 * skipped. This is immediately for block and async tests, but deferred for
 * inline tests. It's useful for inline assertions.
 */
function attempt(func, a, b, c/* , ...args */) {
    if (!(this.status & Flags.Inline)) {
        switch (arguments.length) {
        case 0: throw new TypeError("unreachable")
        case 1: func(); return
        case 2: func(a); return
        case 3: func(a, b); return
        case 4: func(a, b, c); return
        default: // do nothing
        }
    }

    var args = []

    for (var i = 1; i < arguments.length; i++) {
        args.push(arguments[i])
    }

    if (this.status & Flags.Inline) {
        this.data.state.inline.push(new DelayedCall(func, args))
    } else {
        func.apply(undefined, args)
    }
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
        checkInit(this._)
        return this._.methods
    },

    /**
     * Is this test runnable (i.e. running isn't a no-op).
     */
    runnable: function () {
        checkInit(this._)
        return !!(this._.status & Flags.Skipped)
    },

    /**
     * Is this test specifically skipped (created with `t.testSkip()` or
     * `t.asyncSkip()`).
     */
    skipped: function () {
        checkInit(this._)
        return !!(this._.status & Flags.HasSkip)
    },

    /**
     * Is this test the root, i.e. top level?
     */
    root: function () {
        checkInit(this._)
        return !!(this._.status & Flags.Root)
    },

    /**
     * Is this an inline test?
     */
    inline: function () {
        checkInit(this._)
        return !!(this._.status & Flags.Inline)
    },

    /**
     * Is this an async test?
     */
    async: function () {
        checkInit(this._)
        return !!(this._.status & Flags.Async)
    },

    /**
     * Get a list of all own reporters. If none were added, an empty list is
     * returned.
     */
    reporters: function () {
        checkInit(this._)
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
        checkInit(this._)
        return this._.reporters.slice()
    },

    /**
     * Assert that this test is currently being initialized (and is thus safe to
     * modify). This should *always* be used for anything dependent on test
     * state. If you use `define`, `wrap` or `add`, this is already done for
     * you.
     */
    checkInit: function () {
        checkInit(this._)
    },

    /**
     * Run `func` with `...args` when assertions are run, only if the test isn't
     * skipped. This is immediately for block and async tests, but deferred for
     * inline tests. It's defined as both `t.try` and `reflect.try`
     */
    try: function (func/* , ...args */) {
        if (typeof func !== "function") {
            throw new TypeError(m("type.any.callback"))
        }

        checkInit(this._)

        if (!isSkipped(this._) && isOnly(this._, [])) {
            attempt.apply(this._, arguments)
        }
    },

    /**
     * Define one or more assertions. This is also defined on the master
     * instance for ease of use.
     */
    define: function (name, func) {
        checkInit(this._)
        if (!isSkipped(this._)) {
            iterateSetter(this._, name, func, defineAssertion)
        }
    },

    /**
     * Wrap one or more existing methods to patch them. When the wrapped method
     * is called, the wrapper is called with the old function bound to the
     * instance, followed by its normal arguments.
     */
    wrap: function (name, func) {
        checkInit(this._)

        if (!isSkipped(this._)) {
            iterateSetter(this._, name, func, function (test, name, func) {
                // Don't let `reflect` and `_` change.
                if (name === "reflect" || name === "_") {
                    throw new RangeError("Method '" + name + "' is locked!")
                }

                var old = test.methods[name]

                if (typeof old !== "function") {
                    throw new TypeError(m("missing.wrap.callback", name))
                }

                return /** @this */ function () {
                    var args = [old.bind(this)]

                    for (var i = 0; i < arguments.length; i++) {
                        args.push(arguments[i])
                    }

                    var ret = func.apply(this, args)

                    return ret !== undefined ? ret : this
                }
            })
        }
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
        checkInit(this._)

        if (!isSkipped(this._)) {
            iterateSetter(this._, name, func, function (test, name, func) {
                if (typeof test.methods[name] !== "undefined") {
                    throw new TypeError("Method '" + name + "' already exists!")
                }

                return /** @this */ function () {
                    checkInit(this._)

                    var args = [this]

                    for (var i = 0; i < arguments.length; i++) {
                        args.push(arguments[i])
                    }

                    var ret = func.apply(this, args)

                    return ret !== undefined ? ret : this
                }
            })
        }
    },

    /**
     * Get the own, not necessarily active, timeout. 0 means inherit the
     * parent's, and `Infinity` means it's disabled.
     */
    timeout: function () {
        checkInit(this._)
        return this._.timeout
    },

    /**
     * Get the active timeout in milliseconds, not necessarily own, or the
     * framework default of 2000, if none was set.
     */
    activeTimeout: function () {
        checkInit(this._)
        return Tests.timeout(this._)
    },

    /**
     * Get the own, not necessarily active, slow threshold. 0 means inherit the
     * parent's, and `Infinity` means it's disabled.
     */
    slow: function () {
        checkInit(this._)
        return this._.slow
    },

    /**
     * Get the active slow threshold in milliseconds, not necessarily own, or
     * the framework default of 75, if none was set.
     */
    activeSlow: function () {
        checkInit(this._)
        return Tests.slow(this._)
    },

    /**
     * Get the parent test.
     */
    parent: function () {
        checkInit(this._)
        if (this._.status & Flags.Root) return undefined
        else return this._.data.parent.methods
    },

    /**
     * A reference to the AssertionError constructor.
     */
    AssertionError: AssertionError,

    /**
     * Creates a new report, mainly for testing reporters.
     */
    report: function (type, path, value, duration, slow) { // eslint-disable-line max-params, max-len
        if (typeof type !== "string") {
            throw new TypeError(m("type.report.type"))
        }

        if (!Array.isArray(path)) {
            throw new TypeError(m("type.report.path"))
        }

        if (typeof duration !== "number" && duration != null) {
            throw new TypeError(m("type.report.duration"))
        }

        if (typeof slow !== "number" && slow != null) {
            throw new TypeError(m("type.report.slow"))
        }

        for (var i = 0; i < path.length; i++) {
            if (!(path[i] instanceof Tests.Location)) {
                throw new TypeError(m("type.report.path.index", i))
            }
        }

        var internal = Tests.toReportType(type)

        if (internal === Types.Pass || internal === Types.Fail ||
                internal === Types.Enter) {
            if (duration == null) duration = 10
            if (slow == null) slow = 75
        } else {
            duration = -1
            slow = 0
        }

        if (internal === Types.Extra) {
            if (!(value instanceof Tests.ExtraCall)) {
                throw new TypeError(m("type.report.value.extra"))
            }
        } else if (internal !== Types.Fail && internal !== Types.Error) {
            value = undefined
        }

        return new Tests.Report(internal, path, value, duration|0, slow|0)
    },

    /**
     * Creates a new location, mainly for testing reporters.
     */
    loc: function (name, index) {
        if (typeof name !== "string") {
            throw new TypeError(m("type.loc.name"))
        }

        if (typeof index !== "number") {
            throw new TypeError(m("type.loc.index"))
        }

        return new Tests.Location(name, index|0)
    },

    /**
     * Creates an extra call data object, mainly for testing reporters.
     */
    extra: function (count, value, stack) {
        if (typeof count !== "number") {
            throw new TypeError(m("type.extra.count"))
        }

        if (typeof stack !== "string") {
            throw new TypeError(m("type.extra.stack"))
        }

        return new Tests.ExtraCall(count|0, value, stack)
    },

    /**
     * Sets the global scheduler. Note that this *should not* be called when
     * tests are running, and mainly exists for compatibility with runtimes that
     * don't have the normal timing constructs.
     *
     * Also, note that the scheduler *must* execute the function asynchronously,
     * or this framework *will* break.
     */
    scheduler: function (func) {
        Promise.setScheduler(func)
    },
})

module.exports = Thallium
function Thallium() {
    this._ = Tests.base(this)
}

methods(Thallium, {
    /**
     * Create a new Thallium instance
     */
    base: function () {
        return new Thallium()
    },

    /**
     * Contains several internal methods that are not as useful for most users,
     * but give plenty of access to details for plugin/reporter/etc. developers,
     * in case they need it.
     */
    reflect: function () {
        checkInit(this._)
        return new Reflect(this._)
    },

    /**
     * Whitelist specific tests, using array-based selectors where each entry
     * is either a string or regular expression.
     *
     * Returns the current instance for chaining.
     */
    only: function (/* ...selectors */) {
        checkInit(this._)

        if (!isSkipped(this._)) {
            this._.status |= Flags.HasOnly
            this._.only = new Only()

            for (var i = 0; i < arguments.length; i++) {
                var selector = arguments[i]

                if (!Array.isArray(selector)) {
                    throw new TypeError(m("type.only.index", i))
                }

                onlyAdd(this._.only, selector)
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
        checkInit(this._)

        if (!isSkipped(this._)) {
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
        checkInit(this._)

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
        checkInit(this._)
        if (!isSkipped(this._)) {
            iterateSetter(this._, name, func, defineAssertion)
        }
        return this
    },

    /**
     * Run `func` with `...args` when assertions are run, only if the test isn't
     * skipped. This is immediately for block and async tests, but deferred for
     * inline tests. It's defined as both `t.try` and `reflect.try`
     */
    try: function (func/* , ...args */) {
        if (typeof func !== "function") {
            throw new TypeError(m("type.any.callback"))
        }

        checkInit(this._)

        if (!isSkipped(this._) && isOnly(this._, [])) {
            attempt.apply(this._, arguments)
        }
    },

    /**
     * This sets the timeout in milliseconds, rounding negatives to 0, and
     * returns the current instance for chaining. Setting the timeout to 0 means
     * to inherit the parent timeout, and setting it to `Infinity` disables it.
     */
    timeout: function (timeout) {
        checkInit(this._)
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
        checkInit(this._)
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

        checkInit(this._)

        if (this._.status & Flags.Running) {
            throw new Error(m("run.concurrent"))
        }

        var test = this._

        return Tests.runTest(test, true)
        // Tell the reporter something happened. Otherwise, it'll have to wrap
        // this method in a plugin, which shouldn't be necessary.
        .catch(function (e) { return Tests.reportError(test, e).throw(e) })
        .bind().return()
        .asCallback(callback)
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

        return addSyncTest(
            this._,
            Tests.syncBlock,
            Tests.syncInline,
            name,
            callback
        ).methods
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

        return addSyncTest(
            this._,
            Tests.skipBlock,
            Tests.skipInline,
            name,
            callback
        ).methods
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

        return addAsyncTest(this._, Tests.skipBlock, name, callback).methods
    },
})
