"use strict"

var methods = require("../methods")
var Util = require("../util")
var Tests = require("../core/tests")
var Constants = require("../core/constants")
var Filter = require("../core/filter")
var Reporters = require("../../r/index")

var Common = require("./common")
var Reflect = require("./reflect")

module.exports = Thallium
function Thallium() {
    this._ = Tests.createRoot()
}

methods(Thallium, {
    /**
     * Get a Reflect instance directly.
     */
    get reflect() {
        return new Reflect(this._.root.current)
    },

    /**
     * Call a plugin and return the result. The plugin is called with a Reflect
     * instance for access to plenty of potentially useful internal details.
     */
    call: function (plugin) {
        if (typeof plugin !== "function") {
            throw new TypeError("Expected `plugin` to be a function")
        }

        return plugin.call(this.reflect, this.reflect)
    },

    /**
     * Whitelist specific tests, using array-based selectors where each entry
     * is either a string or regular expression.
     */
    set only(selectors) {
        var root = this._.root

        if (root.current !== root) {
            throw new Error("Reporters may only be added to the root.")
        }

        Filter.validate(selectors)
        root.only = Filter.create(selectors)
    },

    /**
     * Add a reporter.
     */
    set reporter(reporter) {
        if (Array.isArray(reporter)
            ? typeof reporter[0] !== "string"
            : typeof reporter !== "function"
        ) {
            throw new TypeError(
                "Expected `reporter` to be a `[string, opts?]` pair or a " +
                "function.")
        }

        var root = this._.root

        if (root.current !== root) {
            throw new Error("Reporters may only be added to the root.")
        }

        if (typeof reporter === "function") {
            root.reporter = reporter
        } else {
            var mod = Reporters[reporter]

            if (mod == null) {
                throw new TypeError("Built-in reporter " +
                    JSON.stringify(reporter) + " not found")
            }

            root.reporter = mod(reporter[1])
        }
    },

    /**
     * Check if this has a reporter.
     */
    get hasReporter() {
        return this._.root.reporter != null
    },

    /**
     * Get the current file set.
     */
    get files() {
        return this._.files
    },

    /**
     * Set the current file set.
     */
    set files(files) {
        var root = this._.root

        if (root.current !== root) {
            throw new Error("Files may only be set in the root.")
        }

        if (files == null) {
            root.files = undefined
        } else {
            if (!Array.isArray(files)) {
                throw new TypeError(
                    "Expected files to be an array if it exists, but found " +
                    "a(n) " + Util.getType(files))
            }

            for (var i = 0; i < files.length; i++) {
                var glob = files[i]

                if (typeof glob !== "string") {
                    throw new TypeError(
                        "Expected t.files[" + i + "] to be a string, but " +
                        "found a(n) " + Util.getType(glob))
                }
            }

            root.files = files
        }
    },

    /**
     * Set the current file set.
     */
    set options(opts) {
        if (opts != null) {
            if (typeof opts !== "object") {
                throw new Error("Options must be an object if given.")
            }

            if (opts.only != null) Filter.validate(opts.only)
            if (opts.skip != null) Filter.validate(opts.skip)
        }

        this._.options = opts
    },

    /**
     * Get the current timeout. 0 means inherit the parent's, and `Infinity`
     * means it's disabled.
     */
    get timeout() {
        return this._.root.current.timeout || Constants.defaultTimeout
    },

    /**
     * Set the timeout in milliseconds, rounding negatives to 0. Setting the
     * timeout to 0 means to inherit the parent timeout, and setting it to
     * `Infinity` disables it.
     */
    set timeout(timeout) {
        this._.root.current.timeout = Math.floor(Math.max(+timeout, 0))
    },

    /**
     * Get the current slow threshold. 0 means inherit the parent's, and
     * `Infinity` means it's disabled.
     */
    get slow() {
        return this._.root.current.slow || Constants.defaultSlow
    },

    /**
     * Set the slow threshold in milliseconds, rounding negatives to 0. Setting
     * the timeout to 0 means to inherit the parent threshold, and setting it to
     * `Infinity` disables it.
     */
    set slow(slow) {
        this._.root.current.slow = Math.floor(Math.max(+slow, 0))
    },

    /**
     * Get the current attempt count. `0` means inherit the parent's.
     */
    get attempts() {
        return this._.root.current.attempts
    },

    /**
     * Set the number of attempts allowed, rounding negatives to 0. Setting the
     * count to `0` means to inherit the parent retry count.
     */
    set attempts(attempts) {
        // This is done differently to avoid a massive performance penalty.
        var calculated = Math.floor(Math.max(attempts, 0))
        var test = this._.root.current

        test.attempts = calculated || test.parent.attempts
    },

    /**
     * Get whether this test is failable.
     */
    get isFailable() {
        return this._.root.current.isFailable
    },

    /**
     * Get whether this test is failable.
     */
    set isFailable(isFailable) {
        this._.root.current.isFailable = !!isFailable
    },

    /**
     * Run the tests (or the test's tests if it's not a base instance).
     */
    run: function (opts) {
        var root = this._.root

        if (root.current !== root) {
            throw new Error(
                "Only the root test can be run - If you only want to run a " +
                "subtest, use `t.only = [[\"test\", ...]]` instead.")
        }

        if (root.locked) {
            throw new Error("Can't run while tests are already running.")
        }

        if (opts != null) {
            if (typeof opts !== "object") {
                throw new Error("Options must be an object if given.")
            }

            if (opts.only != null) Filter.validate(opts.only)
            if (opts.skip != null) Filter.validate(opts.skip)
        }

        var restore = root.reporter == null

        if (restore) root.reporter = Reporters.spec()
        return Tests.runTest(root, opts).then(
            function (v) { if (restore) root.reporter = undefined; return v },
            function (e) { if (restore) root.reporter = undefined; throw e }
        )
    },

    /**
     * Add a test.
     */
    test: function (name, callback) {
        if (typeof name !== "string") {
            throw new TypeError("Expected `name` to be a string")
        }

        if (typeof callback !== "function") {
            throw new TypeError("Expected callback to be a function if passed")
        }

        Tests.addTest(this._.root.current, name, callback)
    },

    /**
     * Skip the current test dynamically
     */
    skip: function () {
        if (this._.root.current === this._.root) {
            throw new TypeError("This should only be called within tests.")
        }

        throw Constants.Skip
    },

    /**
     * Clear all existing tests.
     */
    clearTests: function () {
        if (this._.root !== this._) {
            throw new Error("Tests may only be cleared at the root.")
        }

        if (this._.locked) {
            throw new Error("Can't clear tests while they are running.")
        }

        Tests.clearTests(this._)
    },

    before: function (callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Expected callback to be a function if passed")
        }

        var test = this._.root.current

        test.beforeEach = Common.addHook(test.beforeEach, callback)
    },

    beforeAll: function (callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Expected callback to be a function if passed")
        }

        var test = this._.root.current

        test.beforeAll = Common.addHook(test.beforeAll, callback)
    },

    after: function (callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Expected callback to be a function if passed")
        }

        var test = this._.root.current

        test.afterEach = Common.addHook(test.afterEach, callback)
    },

    afterAll: function (callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Expected callback to be a function if passed")
        }

        var test = this._.root.current

        test.afterAll = Common.addHook(test.afterAll, callback)
    },
})
