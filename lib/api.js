"use strict"

var methods = require("./methods.js")
var Tests = require("./tests.js")
var Flags = Tests.Flags

function addReporter(test, reporter, blocking) {
    if (test.reporters.indexOf(reporter) < 0) {
        test.reporters.push(reporter)
        test.blocking.push(blocking)
    }
}

function removeReporter(test, reporter) {
    var index = test.reporters.indexOf(reporter)

    if (index >= 0) {
        test.reporters.splice(index, 1)
        test.blocking.splice(index, 1)
    }
}

function addHook(list, callback) {
    if (list != null) {
        list.push(callback)
        return list
    } else {
        return [callback]
    }
}

function removeHook(list, callback) {
    if (list == null) return undefined
    if (list.length === 1) {
        if (list[0] === callback) return undefined
    } else {
        var index = list.indexOf(callback)

        if (index >= 0) list.splice(index, 1)
    }
    return list
}

function current(test) {
    return test.current.value
}

function getReflect(test) {
    var reflect = test.reflect

    if (reflect != null) return reflect
    if (test.status & Flags.Root) return test.reflect = new ReflectRoot(test)
    return test.reflect = new ReflectChild(test)
}

/**
 * This contains the low level, more arcane things that are generally not
 * interesting to anyone other than plugin developers.
 */
exports.Reflect = Reflect
function Reflect(test) {
    this._ = test
}

methods(Reflect, {
    /**
     * Get the currently executing test.
     */
    get current() {
        return getReflect(current(this._))
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
            list[i] = getReflect(this._.tests[i])
        }

        return list
    },

    /**
     * Is this test the root, i.e. top level?
     */
    get isRoot() {
        return !!(this._.status & Flags.Root)
    },

    /**
     * Is this locked (i.e. unsafe to modify)?
     */
    get isLocked() {
        return !!(this._.status & Flags.Locked)
    },

    /**
     * Get the own, not necessarily active, timeout. 0 means inherit the
     * parent's, and `Infinity` means it's disabled.
     */
    get ownTimeout() {
        return this._.timeout
    },

    /**
     * Get the active timeout in milliseconds, not necessarily own, or the
     * framework default of 2000, if none was set.
     */
    get timeout() {
        return Tests.timeout(this._)
    },

    /**
     * Get the own, not necessarily active, slow threshold. 0 means inherit the
     * parent's, and `Infinity` means it's disabled.
     */
    get ownSlow() {
        return this._.slow
    },

    /**
     * Get the active slow threshold in milliseconds, not necessarily own, or
     * the framework default of 75, if none was set.
     */
    get slow() {
        return Tests.slow(this._)
    },

    /**
     * Before/after hooks, for initialization and cleanup.
     */

    /**
     * Add a hook to be run before each subtest, including their subtests and so
     * on.
     */
    addBeforeEach: function (callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Expected callback to be a function if passed")
        }

        this._.beforeEach = addHook(this._.beforeEach, callback)
    },

    /**
     * Add a hook to be run once before all subtests are run.
     */
    addBeforeAll: function (callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Expected callback to be a function if passed")
        }

        this._.beforeAll = addHook(this._.beforeAll, callback)
    },

   /**
    * Add a hook to be run after each subtest, including their subtests and so
    * on.
    */
    addAfterEach: function (callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Expected callback to be a function if passed")
        }

        this._.afterEach = addHook(this._.afterEach, callback)
    },

    /**
     * Add a hook to be run once after all subtests are run.
     */
    addAfterAll: function (callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Expected callback to be a function if passed")
        }

        this._.afterAll = addHook(this._.afterAll, callback)
    },

    /**
     * Remove a hook previously added with `t.before` or
     * `reflect.addBeforeEach`.
     */
    removeBeforeEach: function (callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Expected callback to be a function if passed")
        }

        this._.beforeEach = removeHook(this._.beforeEach, callback)
    },

    /**
     * Remove a hook previously added with `t.beforeAll` or
     * `reflect.addBeforeAll`.
     */
    removeBeforeAll: function (callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Expected callback to be a function if passed")
        }

        this._.beforeAll = removeHook(this._.beforeAll, callback)
    },

    /**
     * Remove a hook previously added with `t.after` or`reflect.addAfterEach`.
     */
    removeAfterEach: function (callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Expected callback to be a function if passed")
        }

        this._.afterEach = removeHook(this._.afterEach, callback)
    },

    /**
     * Remove a hook previously added with `t.afterAll` or
     * `reflect.addAfterAll`.
     */
    removeAfterAll: function (callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Expected callback to be a function if passed")
        }

        this._.afterAll = removeHook(this._.afterAll, callback)
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

        if (!(current(this._).status & Flags.Root)) {
            throw new Error("Reporters may only be added to the root")
        }

        addReporter(current(this._), reporter, !!blocking)
    },

    /**
     * Remove a reporter.
     */
    removeReporter: function (reporter) {
        if (typeof reporter !== "function") {
            throw new TypeError("Expected `reporter` to be a function")
        }

        if (!(current(this._).status & Flags.Root)) {
            throw new Error("Reporters may only be added to the root")
        }

        removeReporter(current(this._), reporter)
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

        Tests.addNormal(current(this._), name, callback)
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

        Tests.addSkipped(current(this._), name)
    },
})

function ReflectRoot(root) {
    Reflect.call(this, root)
}

methods(ReflectRoot, Reflect, {
    /**
     * Get a list of all reporters. If none were added, an empty list is
     * returned.
     */
    get reporters() {
        if (this._.status & Flags.Root) {
            return this._.reporters.slice()
        } else {
            return undefined
        }
    },

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

        addReporter(current(this._), reporter, !!blocking)
    },

    /**
     * Remove a reporter.
     */
    removeReporter: function (reporter) {
        if (typeof reporter !== "function") {
            throw new TypeError("Expected `reporter` to be a function")
        }

        removeReporter(current(this._), reporter)
    },
})

function ReflectChild(root) {
    Reflect.call(this, root)
}

methods(ReflectChild, Reflect, {
    /**
     * Get the test name, or `undefined` if it's the root test.
     */
    get name() {
        return this._.name
    },

    /**
     * Get the test index, or `-1` if it's the root test.
     */
    get index() {
        return this._.index
    },

    /**
     * Get the parent test as a Reflect.
     */
    get parent() {
        return getReflect(this._.parent)
    },
})

exports.Thallium = Thallium
function Thallium() {
    this._ = Tests.createRoot(this)
    // ES6 module transpiler compatibility.
    this.default = this
}

methods(Thallium, {
    /**
     * Call a plugin and return the result. The plugin is called with a Reflect
     * instance for access to plenty of potentially useful internal details.
     */
    call: function (plugin) {
        var reflect = getReflect(current(this._))

        return plugin.call(reflect, reflect)
    },

    /**
     * Whitelist specific tests, using array-based selectors where each entry
     * is either a string or regular expression.
     */
    only: function (/* ...selectors */) {
        Tests.onlyAdd.apply(current(this._), arguments)
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

        if (!(current(this._).status & Flags.Root)) {
            throw new Error("Reporters may only be added to the root")
        }

        addReporter(current(this._), reporter, !!blocking)
    },

    /**
     * Get the current timeout. 0 means inherit the parent's, and `Infinity`
     * means it's disabled.
     */
    get timeout() {
        return Tests.timeout(current(this._))
    },

    /**
     * Set the timeout in milliseconds, rounding negatives to 0. Setting the
     * timeout to 0 means to inherit the parent timeout, and setting it to
     * `Infinity` disables it.
     */
    set timeout(timeout) {
        current(this._).timeout = Math.max(+timeout, 0)
    },

    /**
     * Get the current slow threshold. 0 means inherit the parent's, and
     * `Infinity` means it's disabled.
     */
    get slow() {
        return Tests.slow(current(this._))
    },

    /**
     * Set the slow threshold in milliseconds, rounding negatives to 0. Setting
     * the timeout to 0 means to inherit the parent threshold, and setting it to
     * `Infinity` disables it.
     */
    set slow(slow) {
        current(this._).slow = Math.max(+slow, 0)
    },

    /**
     * Run the tests (or the test's tests if it's not a base instance).
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
     * Add a test.
     */
    test: function (name, callback) {
        if (typeof name !== "string") {
            throw new TypeError("Expected `name` to be a string")
        }

        if (typeof callback !== "function") {
            throw new TypeError("Expected callback to be a function if passed")
        }

        Tests.addNormal(current(this._), name, callback)
    },

    /**
     * Add a skipped test.
     */
    testSkip: function (name, callback) {
        if (typeof name !== "string") {
            throw new TypeError("Expected `name` to be a string")
        }

        if (typeof callback !== "function") {
            throw new TypeError("Expected callback to be a function if passed")
        }

        Tests.addSkipped(current(this._), name)
    },

    before: function (callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Expected callback to be a function if passed")
        }

        current(this._).beforeEach.push(callback)
    },

    beforeAll: function (callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Expected callback to be a function if passed")
        }

        current(this._).beforeAll.push(callback)
    },

    after: function (callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Expected callback to be a function if passed")
        }

        current(this._).afterEach.push(callback)
    },

    afterAll: function (callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Expected callback to be a function if passed")
        }

        current(this._).afterAll.push(callback)
    },
})
