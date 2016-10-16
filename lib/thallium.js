"use strict"

var methods = require("./methods.js")
var Tests = require("./tests.js")
var Flags = Tests.Flags

function checkInit(test) {
    if (test.status & Flags.Locked) {
        throw new ReferenceError(
            "It is only safe to call test methods during initialization")
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
     * Assert that this test is currently being initialized (and is thus safe to
     * modify). This should *always* be used for anything dependent on test
     * state. If you use `define`, `wrap` or `add`, this is already done for
     * you.
     */
    checkInit: function () {
        checkInit(this._)
    },

    /**
     * Get the methods associated with this instance.
     */
    get methods() {
        return this._.methods
    },

    /**
     * Get the current total test count.
     */
    get count() {
        return this._.tests.length
    },

    /**
     * Get a copy of the current test list, as a Reflect collection. This is
     * intentionally a slice, so you can't mutate the real children.
     */
    get children() {
        var list = new Array(this._.tests.length)

        for (var i = 0; i < this._.tests.length; i++) {
            list[i] = new Reflect(this._.tests[i])
        }

        return list
    },

    /**
     * Get the test name, or `undefined` if it's the root test.
     */
    get name() {
        if (this._.status & Flags.Root) {
            return undefined
        } else {
            return this._.name
        }
    },

    /**
     * Get the test index, or `-1` if it's the root test.
     */
    get index() {
        if (this._.status & Flags.Root) {
            return -1
        } else {
            return this._.index
        }
    },

    /**
     * Is this test the root, i.e. top level?
     */
    get root() {
        return !!(this._.status & Flags.Root)
    },

    /**
     * Get a list of all own reporters. If none were added, an empty list is
     * returned.
     */
    get reporters() {
        if (this._.status & Flags.Reporting) {
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
    get activeReporters() {
        return this._.reporters.slice()
    },

    /**
     * Get the own, not necessarily active, timeout. 0 means inherit the
     * parent's, and `Infinity` means it's disabled.
     */
    get timeout() {
        return this._.timeout
    },

    /**
     * Get the active timeout in milliseconds, not necessarily own, or the
     * framework default of 2000, if none was set.
     */
    get activeTimeout() {
        return Tests.timeout(this._)
    },

    /**
     * Get the own, not necessarily active, slow threshold. 0 means inherit the
     * parent's, and `Infinity` means it's disabled.
     */
    get slow() {
        return this._.slow
    },

    /**
     * Get the active slow threshold in milliseconds, not necessarily own, or
     * the framework default of 75, if none was set.
     */
    get activeSlow() {
        return Tests.slow(this._)
    },

    /**
     * Get the parent test as a Reflect.
     */
    get parent() {
        if (this._.status & Flags.Root) {
            return undefined
        } else {
            return new Reflect(this._.parent)
        }
    },

    addBeforeEach: function (func) {
        checkInit(this._)
        this._.beforeEach.push(func)
    },

    addBeforeAll: function (func) {
        checkInit(this._)
        this._.beforeAll.push(func)
    },

    addAfterEach: function (func) {
        checkInit(this._)
        this._.afterEach.push(func)
    },

    addAfterAll: function (func) {
        checkInit(this._)
        this._.afterAll.push(func)
    },

    removeBeforeEach: function (func) {
        checkInit(this._)
        var index = this._.beforeEach.indexOf(func)

        if (index >= 0) this._.beforeEach.splice(index, 1)
    },

    removeBeforeAll: function (func) {
        checkInit(this._)
        var index = this._.beforeAll.indexOf(func)

        if (index >= 0) this._.beforeAll.splice(index, 1)
    },

    removeAfterEach: function (func) {
        checkInit(this._)
        var index = this._.afterEach.indexOf(func)

        if (index >= 0) this._.afterEach.splice(index, 1)
    },

    removeAfterAll: function (func) {
        checkInit(this._)
        var index = this._.afterAll.indexOf(func)

        if (index >= 0) this._.afterAll.splice(index, 1)
    },
})

module.exports = Thallium
function Thallium() {
    this._ = Tests.base(this)
}

methods(Thallium, {
    /**
     * Call a plugin and return the result. The plugin is called with a Reflect
     * instance for access to plenty of potentially useful internal details.
     */
    call: function (plugin) {
        var reflect = new Reflect(this._)

        return plugin.call(reflect, reflect)
    },

    /**
     * Whitelist specific tests, using array-based selectors where each entry
     * is either a string or regular expression.
     */
    only: function (/* ...selectors */) {
        checkInit(this._)
        Tests.onlyAdd.apply(this._, arguments)
    },

    /**
     * Add a reporter.
     */
    reporter: function (reporter, blocking) {
        checkInit(this._)

        if (typeof reporter !== "function") {
            throw new TypeError("Expected `reporter` to be a function")
        }

        if (blocking != null && typeof blocking !== "boolean") {
            throw new TypeError("Expected `blocking` to be a boolean if passed")
        }

        if (!(this._.status & Flags.Reporting)) {
            this._.status |= Flags.Reporting
            this._.reporters = [reporter]
            this._.blocking = [!!blocking]
        } else if (this._.reporters.indexOf(reporter) < 0) {
            this._.reporters.push(reporter)
            this._.blocking.push(!!blocking)
        }
    },

    /**
     * Remove a reporter.
     */
    removeReporter: function (reporter) {
        checkInit(this._)

        if (typeof reporter !== "function") {
            throw new TypeError("Expected `reporter` to be a function")
        }

        if (!(this._.status & Flags.Reporting)) return

        var index = this._.reporters.indexOf(reporter)

        if (index >= 0) {
            if (this._.reporters.length === 1) {
                if (this._.status & Flags.Root) {
                    this._.reporters.pop()
                    this._.blocking.pop()
                } else {
                    this._.status &= ~Flags.Reporting
                    this._.reporters = this._.parent.reporters
                    this._.blocking = this._.parent.blocking
                }
            } else {
                this._.reporters.splice(index, 1)
                this._.blocking.splice(index, 1)
            }
        }
    },

    /**
     * Get the current timeout. 0 means inherit the parent's, and `Infinity`
     * means it's disabled.
     */
    get timeout() {
        return Tests.timeout(this._)
    },

    /**
     * This sets the timeout in milliseconds, rounding negatives to 0. Setting
     * the timeout to 0 means to inherit the parent timeout, and setting it to
     * `Infinity` disables it.
     */
    set timeout(timeout) {
        checkInit(this._)
        this._.timeout = Math.max(+timeout, 0)
    },

    /**
     * Get the current slow threshold. 0 means inherit the parent's, and
     * `Infinity` means it's disabled.
     */
    get slow() {
        return Tests.slow(this._)
    },

    /**
     * This sets the slow threshold in milliseconds, rounding negatives to 0,
     * and returns the current instance for chaining. Setting the timeout to 0
     * means to inherit the parent threshold, and setting it to `Infinity`
     * disables it.
     */
    set slow(slow) {
        checkInit(this._)
        this._.slow = Math.max(+slow, 0)
    },

    /**
     * Run the tests (or the test's tests if it's not a base instance). Pass a
     * `callback` to be called with a possible error, and this returns a promise
     * otherwise.
     */
    run: function () {
        if (!(this._.status & Flags.Root)) {
            throw new Error(
                "Only the root test can be run - If you only want to run a " +
                "subtest, use `t.only([\"selector1\", ...])` instead")
        }

        if (this._.status & Flags.Locked) {
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

        if (typeof callback !== "function") {
            throw new TypeError("Expected callback to be a function if passed")
        }

        checkInit(this._)
        Tests.addNormal(this._, name, callback)
    },

    /**
     * Add a skipped block or inline test.
     */
    testSkip: function (name, callback) {
        if (typeof name !== "string") {
            throw new TypeError("Expected `name` to be a string")
        }

        if (typeof callback !== "function") {
            throw new TypeError("Expected callback to be a function if passed")
        }

        checkInit(this._)
        Tests.addSkipped(this._, name, callback)
    },

    before: function (func) {
        checkInit(this._)
        this._.beforeEach.push(func)
    },

    beforeAll: function (func) {
        checkInit(this._)
        this._.beforeAll.push(func)
    },

    after: function (func) {
        checkInit(this._)
        this._.afterEach.push(func)
    },

    afterAll: function (func) {
        checkInit(this._)
        this._.afterAll.push(func)
    },
})
