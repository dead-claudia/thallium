"use strict"

var Promise = require("./bluebird.js")
var methods = require("./methods.js")

var Tests = require("./tests.js")
var Flags = Tests.Flags
var Types = Tests.Types

function checkInit(test) {
    if (!(test.status & Flags.Init)) {
        throw new ReferenceError(
            "It is only safe to call test methods during initialization")
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

function findEquivalent(node, entry) {
    for (var i = 0; i < node.children.length; i++) {
        var child = node.children[i]

        if (isEquivalent(child.value, entry)) return child
    }

    return undefined
}

function findMatches(node, entry) {
    for (var i = 0; i < node.children.length; i++) {
        var child = node.children[i]

        if (matches(child.value, entry)) return child
    }

    return undefined
}

function onlyAdd(node, selector, index) {
    for (var i = 0; i < selector.length; i++) {
        var entry = selector[i]

        // Strings and regular expressions are the only things allowed.
        if (typeof entry !== "string" && !(entry instanceof RegExp)) {
            throw new TypeError(
                "Selector " + index + " must consist of only strings and/or " +
                "regular expressions")
        }

        var child = findEquivalent(node, entry)

        if (child == null) {
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
            current = findMatches(current, path[--i])
            if (current == null) return false
        }
    }

    return true
}

function addSyncTest(test, block, inline, name, callback) { // eslint-disable-line max-params, max-len
    checkInit(test)

    // Don't add subtests to parent tests that never run their children. That's
    // a memory leak waiting to happen.
    if (test.status & Flags.Skipped || !isOnly(test, [name])) {
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
    if (!(test.status & Flags.Skipped) && isOnly(test, [name])) {
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
        this.data.context.push({func: func, args: args})
    } else {
        func.apply(undefined, args)
    }
}

/**
 * Convert a stringified type to an internal numeric enum member.
 */
function toReportType(type) {
    switch (type) {
    case "start": return Types.Start
    case "enter": return Types.Enter
    case "leave": return Types.Leave
    case "pass": return Types.Pass
    case "fail": return Types.Fail
    case "skip": return Types.Skip
    case "end": return Types.End
    case "error": return Types.Error
    default: throw new RangeError("Unknown report `type`: " + type)
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
        return !(this._.status & Flags.Skipped) && isOnly(this._, [])
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
            // For speed and memory reasons, the actual referenced reporters are
            // always the active set.
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
            throw new TypeError("Expected callback to be a function")
        }

        checkInit(this._)

        if (!(this._.status & Flags.Skipped) && isOnly(this._, [])) {
            attempt.apply(this._, arguments)
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
     * Creates a new report, mainly for testing reporters.
     */
    report: function (type, path, value, duration, slow) { // eslint-disable-line max-params, max-len
        if (typeof type !== "string") {
            throw new TypeError("Expected `type` to be a string")
        }

        if (!Array.isArray(path)) {
            throw new TypeError("Expected `path` to be an array of locations")
        }

        var internal = toReportType(type)

        if (internal === Types.Pass || internal === Types.Fail ||
                internal === Types.Enter) {
            if (duration == null) duration = 10
            if (typeof duration !== "number") {
                throw new TypeError(
                    "Expected `duration` to be a number if it exists")
            }

            if (slow == null) slow = 75
            if (typeof slow !== "number") {
                throw new TypeError(
                    "Expected `slow` to be a number if it exists")
            }
        } else {
            duration = -1
            slow = 0
        }

        if (internal !== Types.Fail && internal !== Types.Error) {
            value = undefined
        }

        return new Tests.Report(internal, path, value, duration|0, slow|0)
    },

    /**
     * Creates a new location, mainly for testing reporters.
     */
    loc: function (name, index) {
        if (typeof name !== "string") {
            throw new TypeError("Expected `name` to be a string")
        }

        if (typeof index !== "number") {
            throw new TypeError("Expected `index` to be a number")
        }

        return {name: name, index: index|0}
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
    create: function () {
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

        if (!(this._.status & Flags.Skipped)) {
            this._.status |= Flags.HasOnly
            this._.only = new Only()

            for (var i = 0; i < arguments.length; i++) {
                var selector = arguments[i]

                if (!Array.isArray(selector)) {
                    throw new TypeError(
                        "Expected selector " + i + " to be an array")
                }

                onlyAdd(this._.only, selector, i)
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

        if (!(this._.status & Flags.Skipped)) {
            for (var i = 0; i < arguments.length; i++) {
                var plugin = arguments[i]

                if (typeof plugin !== "function") {
                    throw new TypeError("Expected `plugin` to be a function")
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
     * Add a number of reporters.
     *
     * Returns the current instance for chaining.
     */
    reporter: function (/* ...reporters */) {
        checkInit(this._)

        for (var i = 0; i < arguments.length; i++) {
            var reporter = arguments[i]

            if (typeof reporter !== "function") {
                throw new TypeError("Expected `reporter` to be a function")
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
     * Remove a number of reporters.
     *
     * Returns the current instance for chaining.
     */
    removeReporter: function (/* ...reporters */) {
        checkInit(this._)

        for (var i = 0; i < arguments.length; i++) {
            var reporter = arguments[i]

            if (typeof reporter !== "function") {
                throw new TypeError("Expected `reporter` to be a function")
            }

            if (this._.status & Flags.HasReporter) {
                var index = this._.reporters.indexOf(reporter)

                if (index >= 0) this._.reporters.splice(index, 1)
            }
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
            throw new TypeError("Expected callback to be a function")
        }

        checkInit(this._)

        if (!(this._.status & Flags.Skipped) && isOnly(this._, [])) {
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
    run: function () {
        checkInit(this._)

        if (!(this._.status & Flags.Root)) {
            throw new Error(
                "Only the root test can be run - If you only want to run a " +
                "subtest, use `t.only([\"selector1\", ...])` instead")
        }

        if (this._.status & Flags.Running) {
            throw new Error("Can't run the same test concurrently")
        }

        return Tests.runTest(this._).bind().return()
    },

    /**
     * Add a block or inline test.
     */
    test: function (name, callback) {
        if (typeof name !== "string") {
            throw new TypeError("Expected `name` to be a string")
        }

        if (typeof callback !== "function" && callback != null) {
            throw new TypeError("Expected callback to be a function if passed")
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
            throw new TypeError("Expected `name` to be a string")
        }

        if (typeof callback !== "function" && callback != null) {
            throw new TypeError("Expected callback to be a function if passed")
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
            throw new TypeError("Expected `name` to be a string")
        }

        if (typeof callback !== "function") {
            throw new TypeError("Expected callback to be a function")
        }

        return addAsyncTest(this._, Tests.async, name, callback).methods
    },

    /**
     * Add a skipped async test.
     */
    asyncSkip: function (name, callback) {
        if (typeof name !== "string") {
            throw new TypeError("Expected `name` to be a string")
        }

        if (typeof callback !== "function") {
            throw new TypeError("Expected callback to be a function")
        }

        return addAsyncTest(this._, Tests.skipBlock, name, callback).methods
    },
})
