"use strict"

var methods = require("./methods.js")
var Tests = require("./tests.js")
var Flags = Tests.Flags

function addReporter(test, reporter, blocking) {
    if (!(test.status & Flags.Reporting)) {
        test.status |= Flags.Reporting
        test.reporters = [reporter]
        test.blocking = [blocking]
    } else if (test.reporters.indexOf(reporter) < 0) {
        test.reporters.push(reporter)
        test.blocking.push(blocking)
    }
}

function removeReporter(test, reporter) {
    if (test.status & Flags.Reporting) {
        var index = test.reporters.indexOf(reporter)

        if (index >= 0) {
            if (test.reporters.length > 1) {
                test.reporters.splice(index, 1)
                test.blocking.splice(index, 1)
            } else if (test.status & Flags.Root) {
                test.reporters.pop()
                test.blocking.pop()
            } else {
                test.status &= ~Flags.Reporting
                test.reporters = test.parent.reporters
                test.blocking = test.parent.blocking
            }
        }
    }
}

/**
 * This contains the low level, more arcane things that are generally not
 * interesting to anyone other than plugin developers.
 */
function Reflect(test) {
    if (test.reflect != null) return test.reflect
    this._ = test
}

methods(Reflect, {
    /**
     * Get the currently executing test.
     */
    get current() {
        return new Reflect(this._.current.value)
    },

    /**
     * Get the global root.
     */
    get global() {
        return new Reflect(this._.root)
    },

    /**
     * @deprecated
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
     * Is this locked (i.e. unsafe to modify)?
     */
    get locked() {
        return !!(this._.status & Flags.Locked)
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

    /**
     * Before/after hooks, for initialization and cleanup.
     */

    /**
     * Add a hook to be run before each subtest, including their subtests and so
     * on.
     */
    addBeforeEach: function (func) {
        this._.beforeEach.push(func)
    },

    /**
     * Add a hook to be run once before all subtests are run.
     */
    addBeforeAll: function (func) {
        this._.beforeAll.push(func)
    },

   /**
    * Add a hook to be run after each subtest, including their subtests and so
    * on.
    */
    addAfterEach: function (func) {
        this._.afterEach.push(func)
    },

    /**
     * Add a hook to be run once after all subtests are run.
     */
    addAfterAll: function (func) {
        this._.afterAll.push(func)
    },

    /**
     * Remove a hook previously added with `t.before` or
     * `reflect.addBeforeEach`.
     */
    removeBeforeEach: function (func) {
        var index = this._.beforeEach.indexOf(func)

        if (index >= 0) this._.beforeEach.splice(index, 1)
    },

    /**
     * Remove a hook previously added with `t.beforeAll` or
     * `reflect.addBeforeAll`.
     */
    removeBeforeAll: function (func) {
        var index = this._.beforeAll.indexOf(func)

        if (index >= 0) this._.beforeAll.splice(index, 1)
    },

    /**
     * Remove a hook previously added with `t.after` or`reflect.addAfterEach`.
     */
    removeAfterEach: function (func) {
        var index = this._.afterEach.indexOf(func)

        if (index >= 0) this._.afterEach.splice(index, 1)
    },

    /**
     * Remove a hook previously added with `t.afterAll` or
     * `reflect.addAfterAll`.
     */
    removeAfterAll: function (func) {
        var index = this._.afterAll.indexOf(func)

        if (index >= 0) this._.afterAll.splice(index, 1)
    },

    /**
     * Thallium API methods made available on reflect objects, so they don't
     * need a test instance to wrap everything.
     */

    /**
     * Add a reporter.
     */
    addReporter: function (reporter, blocking) {
        if (typeof reporter !== "function") {
            throw new TypeError("Expected `reporter` to be a function")
        }

        if (blocking != null && typeof blocking !== "boolean") {
            throw new TypeError("Expected `blocking` to be a boolean if passed")
        }

        addReporter(this._.current.value, reporter, !!blocking)
    },

    /**
     * Remove a reporter.
     */
    removeReporter: function (reporter) {
        if (typeof reporter !== "function") {
            throw new TypeError("Expected `reporter` to be a function")
        }

        removeReporter(this._.current.value, reporter)
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

        Tests.addNormal(this._.current.value, name, callback)
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

        Tests.addSkipped(this._.current.value, name)
    },
})

module.exports = Thallium
function Thallium() {
    this._ = Tests.createRoot(this)
}

methods(Thallium, {
    /**
     * Call a plugin and return the result. The plugin is called with a Reflect
     * instance for access to plenty of potentially useful internal details.
     */
    call: function (plugin) {
        var reflect = new Reflect(this._.current.value)

        return plugin.call(reflect, reflect)
    },

    /**
     * Whitelist specific tests, using array-based selectors where each entry
     * is either a string or regular expression.
     */
    only: function (/* ...selectors */) {
        Tests.onlyAdd.apply(this._.current.value, arguments)
    },

    /**
     * Add a reporter.
     */
    reporter: function (reporter, blocking) {
        if (typeof reporter !== "function") {
            throw new TypeError("Expected `reporter` to be a function")
        }

        if (blocking != null && typeof blocking !== "boolean") {
            throw new TypeError("Expected `blocking` to be a boolean if passed")
        }

        addReporter(this._.current.value, reporter, !!blocking)
    },

    /**
     * Get the current timeout. 0 means inherit the parent's, and `Infinity`
     * means it's disabled.
     */
    get timeout() {
        return Tests.timeout(this._.current.value)
    },

    /**
     * This sets the timeout in milliseconds, rounding negatives to 0. Setting
     * the timeout to 0 means to inherit the parent timeout, and setting it to
     * `Infinity` disables it.
     */
    set timeout(timeout) {
        this._.current.value.timeout = Math.max(+timeout, 0)
    },

    /**
     * Get the current slow threshold. 0 means inherit the parent's, and
     * `Infinity` means it's disabled.
     */
    get slow() {
        return Tests.slow(this._.current.value)
    },

    /**
     * This sets the slow threshold in milliseconds, rounding negatives to 0,
     * and returns the current instance for chaining. Setting the timeout to 0
     * means to inherit the parent threshold, and setting it to `Infinity`
     * disables it.
     */
    set slow(slow) {
        this._.current.value.slow = Math.max(+slow, 0)
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

        return Tests.runTest(this._)
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

        Tests.addNormal(this._.current.value, name, callback)
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

        Tests.addSkipped(this._.current.value, name)
    },

    before: function (func) {
        this._.current.value.beforeEach.push(func)
    },

    beforeAll: function (func) {
        this._.current.value.beforeAll.push(func)
    },

    after: function (func) {
        this._.current.value.afterEach.push(func)
    },

    afterAll: function (func) {
        this._.current.value.afterAll.push(func)
    },
})
