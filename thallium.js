require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict"

/**
 * Core TDD-style assertions. These are done by a composition of DSLs, since
 * there is *so* much repetition. Also, this is split into several namespaces to
 * keep the file size manageable.
 */

var Util = require("./lib/assert/util")
var Type = require("./lib/assert/type")
var Equal = require("./lib/assert/equal")
var Throws = require("./lib/assert/throws")
var Has = require("./lib/assert/has")
var Includes = require("./lib/assert/includes")
var HasKeys = require("./lib/assert/has-keys")

exports.AssertionError = Util.AssertionError
exports.assert = Util.assert
exports.fail = Util.fail
exports.format = Util.format
exports.escape = Util.escape

exports.ok = Type.ok
exports.notOk = Type.notOk
exports.isBoolean = Type.isBoolean
exports.notBoolean = Type.notBoolean
exports.isFunction = Type.isFunction
exports.notFunction = Type.notFunction
exports.isNumber = Type.isNumber
exports.notNumber = Type.notNumber
exports.isObject = Type.isObject
exports.notObject = Type.notObject
exports.isString = Type.isString
exports.notString = Type.notString
exports.isSymbol = Type.isSymbol
exports.notSymbol = Type.notSymbol
exports.exists = Type.exists
exports.notExists = Type.notExists
exports.isArray = Type.isArray
exports.notArray = Type.notArray
exports.is = Type.is
exports.not = Type.not

exports.equal = Equal.equal
exports.notEqual = Equal.notEqual
exports.equalLoose = Equal.equalLoose
exports.notEqualLoose = Equal.notEqualLoose
exports.deepEqual = Equal.deepEqual
exports.notDeepEqual = Equal.notDeepEqual
exports.match = Equal.match
exports.notMatch = Equal.notMatch
exports.atLeast = Equal.atLeast
exports.atMost = Equal.atMost
exports.above = Equal.above
exports.below = Equal.below
exports.between = Equal.between
exports.closeTo = Equal.closeTo
exports.notCloseTo = Equal.notCloseTo

exports.throws = Throws.throws
exports.throwsMatch = Throws.throwsMatch

exports.hasOwn = Has.hasOwn
exports.notHasOwn = Has.notHasOwn
exports.hasOwnLoose = Has.hasOwnLoose
exports.notHasOwnLoose = Has.notHasOwnLoose
exports.hasKey = Has.hasKey
exports.notHasKey = Has.notHasKey
exports.hasKeyLoose = Has.hasKeyLoose
exports.notHasKeyLoose = Has.notHasKeyLoose
exports.has = Has.has
exports.notHas = Has.notHas
exports.hasLoose = Has.hasLoose
exports.notHasLoose = Has.notHasLoose

/**
 * There's 2 sets of 12 permutations here for `includes` and `hasKeys`, instead
 * of N sets of 2 (which would fit the `foo`/`notFoo` idiom better), so it's
 * easier to just make a couple separate DSLs and use that to define everything.
 *
 * Here's the top level:
 *
 * - shallow
 * - strict deep
 * - structural deep
 *
 * And the second level:
 *
 * - includes all/not missing some
 * - includes some/not missing all
 * - not including all/missing some
 * - not including some/missing all
 *
 * Here's an example using the naming scheme for `hasKeys*`
 *
 *               |     shallow     |    strict deep      |   structural deep
 * --------------|-----------------|---------------------|----------------------
 * includes all  | `hasKeys`       | `hasKeysDeep`       | `hasKeysMatch`
 * includes some | `hasKeysAny`    | `hasKeysAnyDeep`    | `hasKeysAnyMatch`
 * missing some  | `notHasKeysAll` | `notHasKeysAllDeep` | `notHasKeysAllMatch`
 * missing all   | `notHasKeys`    | `notHasKeysDeep`    | `notHasKeysMatch`
 *
 * Note that the `hasKeys` shallow comparison variants are also overloaded to
 * consume either an array (in which it simply checks against a list of keys) or
 * an object (where it does a full deep comparison).
 */

exports.includes = Includes.includes
exports.includesDeep = Includes.includesDeep
exports.includesMatch = Includes.includesMatch
exports.includesAny = Includes.includesAny
exports.includesAnyDeep = Includes.includesAnyDeep
exports.includesAnyMatch = Includes.includesAnyMatch
exports.notIncludesAll = Includes.notIncludesAll
exports.notIncludesAllDeep = Includes.notIncludesAllDeep
exports.notIncludesAllMatch = Includes.notIncludesAllMatch
exports.notIncludes = Includes.notIncludes
exports.notIncludesDeep = Includes.notIncludesDeep
exports.notIncludesMatch = Includes.notIncludesMatch

exports.hasKeys = HasKeys.hasKeys
exports.hasKeysDeep = HasKeys.hasKeysDeep
exports.hasKeysMatch = HasKeys.hasKeysMatch
exports.hasKeysAny = HasKeys.hasKeysAny
exports.hasKeysAnyDeep = HasKeys.hasKeysAnyDeep
exports.hasKeysAnyMatch = HasKeys.hasKeysAnyMatch
exports.notHasKeysAll = HasKeys.notHasKeysAll
exports.notHasKeysAllDeep = HasKeys.notHasKeysAllDeep
exports.notHasKeysAllMatch = HasKeys.notHasKeysAllMatch
exports.notHasKeys = HasKeys.notHasKeys
exports.notHasKeysDeep = HasKeys.notHasKeysDeep
exports.notHasKeysMatch = HasKeys.notHasKeysMatch

},{"./lib/assert/equal":7,"./lib/assert/has":9,"./lib/assert/has-keys":8,"./lib/assert/includes":10,"./lib/assert/throws":11,"./lib/assert/type":12,"./lib/assert/util":13}],2:[function(require,module,exports){
"use strict"

/**
 * Main entry point, for those wanting to use this framework with the core
 * assertions.
 */
var Thallium = require("./lib/api/thallium")

module.exports = new Thallium()

},{"./lib/api/thallium":6}],3:[function(require,module,exports){
"use strict"

var Thallium = require("./lib/api/thallium")
var Reports = require("./lib/core/reports")
var Types = Reports.Types

exports.root = function () {
    return new Thallium()
}

function d(duration) {
    if (duration == null) return 10
    if (typeof duration === "number") return duration|0
    throw new TypeError("Expected `duration` to be a number if it exists")
}

function s(slow) {
    if (slow == null) return 75
    if (typeof slow === "number") return slow|0
    throw new TypeError("Expected `slow` to be a number if it exists")
}

function p(path) {
    if (Array.isArray(path)) return path
    throw new TypeError("Expected `path` to be an array of locations")
}

function h(value) {
    if (value != null && typeof value._ === "number") return value
    throw new TypeError("Expected `value` to be a hook error")
}

/**
 * Create a new report, mainly for testing reporters.
 */
exports.reports = {
    start: function () {
        return new Reports.Start()
    },

    enter: function (path, duration, slow) {
        return new Reports.Enter(p(path), d(duration), s(slow))
    },

    leave: function (path) {
        return new Reports.Leave(p(path))
    },

    pass: function (path, duration, slow) {
        return new Reports.Pass(p(path), d(duration), s(slow))
    },

    fail: function (path, value, duration, slow) {
        return new Reports.Fail(p(path), value, d(duration), s(slow))
    },

    skip: function (path) {
        return new Reports.Skip(p(path))
    },

    end: function () {
        return new Reports.End()
    },

    error: function (value) {
        return new Reports.Error(value)
    },

    hook: function (path, rootPath, value) {
        return new Reports.Hook(p(path), p(rootPath), h(value))
    },
}

/**
 * Create a new hook error, mainly for testing reporters.
 */
exports.hookErrors = {
    beforeAll: function (func, value) {
        return new Reports.HookError(Types.BeforeAll, func, value)
    },

    beforeEach: function (func, value) {
        return new Reports.HookError(Types.BeforeEach, func, value)
    },

    afterEach: function (func, value) {
        return new Reports.HookError(Types.AfterEach, func, value)
    },

    afterAll: function (func, value) {
        return new Reports.HookError(Types.AfterAll, func, value)
    },
}

/**
 * Creates a new location, mainly for testing reporters.
 */
exports.location = function (name, index) {
    if (typeof name !== "string") {
        throw new TypeError("Expected `name` to be a string")
    }

    if (typeof index !== "number") {
        throw new TypeError("Expected `index` to be a number")
    }

    return {name: name, index: index|0}
}

},{"./lib/api/thallium":6,"./lib/core/reports":15}],4:[function(require,module,exports){
"use strict"

exports.addHook = function (list, callback) {
    if (list != null) {
        list.push(callback)
        return list
    } else {
        return [callback]
    }
}

exports.removeHook = function (list, callback) {
    if (list == null) return undefined
    if (list.length === 1) {
        if (list[0] === callback) return undefined
    } else {
        var index = list.indexOf(callback)

        if (index >= 0) list.splice(index, 1)
    }
    return list
}

exports.hasHook = function (list, callback) {
    if (list == null) return false
    if (list.length > 1) return list.indexOf(callback) >= 0
    return list[0] === callback
}

},{}],5:[function(require,module,exports){
"use strict"

var methods = require("../methods")
var Tests = require("../core/tests")
var Hooks = require("./hooks")

/**
 * This contains the low level, more arcane things that are generally not
 * interesting to anyone other than plugin developers.
 */
module.exports = Reflect
function Reflect(test) {
    var reflect = test.reflect

    if (reflect != null) return reflect
    if (test.root !== test) return test.reflect = new ReflectChild(test)
    return test.reflect = new ReflectRoot(test)
}

methods(Reflect, {
    /**
     * Get the currently executing test.
     */
    get current() {
        return new Reflect(this._.root.current)
    },

    /**
     * Get the root test.
     */
    get root() {
        return new Reflect(this._.root)
    },

    /**
     * Get the current total test count.
     */
    get count() {
        return this._.tests == null ? 0 : this._.tests.length
    },

    /**
     * Get a copy of the current test list, as a Reflect collection. This is
     * intentionally a slice, so you can't mutate the real children.
     */
    get children() {
        if (this._.tests == null) return []
        return this._.tests.map(function (test) {
            return new ReflectChild(test)
        })
    },

    /**
     * Is this test the root, i.e. top level?
     */
    get isRoot() {
        return this._.root === this._
    },

    /**
     * Is this locked (i.e. unsafe to modify)?
     */
    get isLocked() {
        return !!this._.locked
    },

    /**
     * Get the own, not necessarily active, timeout. 0 means inherit the
     * parent's, and `Infinity` means it's disabled.
     */
    get ownTimeout() {
        return this._.timeout || 0
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
        return this._.slow || 0
    },

    /**
     * Get the active slow threshold in milliseconds, not necessarily own, or
     * the framework default of 75, if none was set.
     */
    get slow() {
        return Tests.slow(this._)
    },

    /**
     * Add a hook to be run before each subtest, including their subtests and so
     * on.
     */
    before: function (callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Expected callback to be a function if passed")
        }

        this._.beforeEach = Hooks.addHook(this._.beforeEach, callback)
    },

    /**
     * Add a hook to be run once before all subtests are run.
     */
    beforeAll: function (callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Expected callback to be a function if passed")
        }

        this._.beforeAll = Hooks.addHook(this._.beforeAll, callback)
    },

   /**
    * Add a hook to be run after each subtest, including their subtests and so
    * on.
    */
    after: function (callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Expected callback to be a function if passed")
        }

        this._.afterEach = Hooks.addHook(this._.afterEach, callback)
    },

    /**
     * Add a hook to be run once after all subtests are run.
     */
    afterAll: function (callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Expected callback to be a function if passed")
        }

        this._.afterAll = Hooks.addHook(this._.afterAll, callback)
    },

    /**
     * Remove a hook previously added with `t.before` or `reflect.before`.
     */
    hasBefore: function (callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Expected callback to be a function if passed")
        }

        return Hooks.hasHook(this._.beforeEach, callback)
    },

    /**
     * Remove a hook previously added with `t.beforeAll` or `reflect.beforeAll`.
     */
    hasBeforeAll: function (callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Expected callback to be a function if passed")
        }

        return Hooks.hasHook(this._.beforeAll, callback)
    },

    /**
     * Remove a hook previously added with `t.after` or`reflect.after`.
     */
    hasAfter: function (callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Expected callback to be a function if passed")
        }

        return Hooks.hasHook(this._.afterEach, callback)
    },

    /**
     * Remove a hook previously added with `t.afterAll` or `reflect.afterAll`.
     */
    hasAfterAll: function (callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Expected callback to be a function if passed")
        }

        return Hooks.hasHook(this._.afterAll, callback)
    },

    /**
     * Remove a hook previously added with `t.before` or `reflect.before`.
     */
    removeBefore: function (callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Expected callback to be a function if passed")
        }

        var beforeEach = Hooks.removeHook(this._.beforeEach, callback)

        if (beforeEach == null) delete this._.beforeEach
        else this._.beforeEach = beforeEach
    },

    /**
     * Remove a hook previously added with `t.beforeAll` or `reflect.beforeAll`.
     */
    removeBeforeAll: function (callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Expected callback to be a function if passed")
        }

        var beforeAll = Hooks.removeHook(this._.beforeAll, callback)

        if (beforeAll == null) delete this._.beforeAll
        else this._.beforeAll = beforeAll
    },

    /**
     * Remove a hook previously added with `t.after` or`reflect.after`.
     */
    removeAfter: function (callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Expected callback to be a function if passed")
        }

        var afterEach = Hooks.removeHook(this._.afterEach, callback)

        if (afterEach == null) delete this._.afterEach
        else this._.afterEach = afterEach
    },

    /**
     * Remove a hook previously added with `t.afterAll` or `reflect.afterAll`.
     */
    removeAfterAll: function (callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Expected callback to be a function if passed")
        }

        var afterAll = Hooks.removeHook(this._.afterAll, callback)

        if (afterAll == null) delete this._.afterAll
        else this._.afterAll = afterAll
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

        Tests.addNormal(this._.root.current, name, callback)
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

        Tests.addSkipped(this._.root.current, name)
    },
})

function ReflectRoot(root) {
    this._ = root
}

methods(ReflectRoot, Reflect, {
    /**
     * Whether a reporter was registered.
     */
    hasReporter: function (reporter) {
        if (typeof reporter !== "function") {
            throw new TypeError("Expected `reporter` to be a function")
        }

        return this._.root.reporterIds.indexOf(reporter) >= 0
    },

    /**
     * Add a reporter.
     */
    reporter: function (reporter, arg) {
        if (typeof reporter !== "function") {
            throw new TypeError("Expected `reporter` to be a function")
        }

        var root = this._.root

        if (root.current !== root) {
            throw new Error("Reporters may only be added to the root")
        }

        if (root.reporterIds.indexOf(reporter) < 0) {
            root.reporterIds.push(reporter)
            root.reporters.push(reporter(arg))
        }
    },

    /**
     * Remove a reporter.
     */
    removeReporter: function (reporter) {
        if (typeof reporter !== "function") {
            throw new TypeError("Expected `reporter` to be a function")
        }

        var root = this._.root

        if (root.current !== root) {
            throw new Error("Reporters may only be added to the root")
        }

        var index = root.reporterIds.indexOf(reporter)

        if (index >= 0) {
            root.reporterIds.splice(index, 1)
            root.reporters.splice(index, 1)
        }
    },
})

function ReflectChild(root) {
    this._ = root
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
        return new Reflect(this._.parent)
    },
})

},{"../core/tests":16,"../methods":17,"./hooks":4}],6:[function(require,module,exports){
"use strict"

var methods = require("../methods")
var Tests = require("../core/tests")
var onlyAdd = require("../core/only").onlyAdd
var addHook = require("./hooks").addHook
var Reflect = require("./reflect")

module.exports = Thallium
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
    call: function (plugin, arg) {
        var reflect = new Reflect(this._.root.current)

        return plugin.call(reflect, reflect, arg)
    },

    /**
     * Whitelist specific tests, using array-based selectors where each entry
     * is either a string or regular expression.
     */
    only: function (/* ...selectors */) {
        onlyAdd.apply(this._.root.current, arguments)
    },

    /**
     * Add a reporter.
     */
    reporter: function (reporter, arg) {
        if (typeof reporter !== "function") {
            throw new TypeError("Expected `reporter` to be a function.")
        }

        var root = this._.root

        if (root.current !== root) {
            throw new Error("Reporters may only be added to the root.")
        }

        var result = reporter(arg)

        // Don't assume it's a function. Verify it actually is, so we don't have
        // inexplicable type errors internally after it's invoked, and so users
        // won't get too confused.
        if (typeof result !== "function") {
            throw new TypeError(
                "Expected `reporter` to return a function. Check with the " +
                "reporter's author, and have them fix their reporter.")
        }

        root.reporter = result
    },

    /**
     * Get the current timeout. 0 means inherit the parent's, and `Infinity`
     * means it's disabled.
     */
    get timeout() {
        return Tests.timeout(this._.root.current)
    },

    /**
     * Set the timeout in milliseconds, rounding negatives to 0. Setting the
     * timeout to 0 means to inherit the parent timeout, and setting it to
     * `Infinity` disables it.
     */
    set timeout(timeout) {
        var calculated = Math.floor(Math.max(+timeout, 0))

        if (calculated === 0) delete this._.root.current.timeout
        else this._.root.current.timeout = calculated
    },

    /**
     * Get the current slow threshold. 0 means inherit the parent's, and
     * `Infinity` means it's disabled.
     */
    get slow() {
        return Tests.slow(this._.root.current)
    },

    /**
     * Set the slow threshold in milliseconds, rounding negatives to 0. Setting
     * the timeout to 0 means to inherit the parent threshold, and setting it to
     * `Infinity` disables it.
     */
    set slow(slow) {
        var calculated = Math.floor(Math.max(+slow, 0))

        if (calculated === 0) delete this._.root.current.slow
        else this._.root.current.slow = calculated
    },

    /**
     * Run the tests (or the test's tests if it's not a base instance).
     */
    run: function () {
        if (this._.root !== this._) {
            throw new Error(
                "Only the root test can be run - If you only want to run a " +
                "subtest, use `t.only([\"selector1\", ...])` instead.")
        }

        if (this._.root.locked) {
            throw new Error("Can't run while tests are already running.")
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

        Tests.addNormal(this._.root.current, name, callback)
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

        Tests.addSkipped(this._.root.current, name)
    },

    before: function (callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Expected callback to be a function if passed")
        }

        var test = this._.root.current

        test.beforeEach = addHook(test.beforeEach, callback)
    },

    beforeAll: function (callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Expected callback to be a function if passed")
        }

        var test = this._.root.current

        test.beforeAll = addHook(test.beforeAll, callback)
    },

    after: function (callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Expected callback to be a function if passed")
        }

        var test = this._.root.current

        test.afterEach = addHook(test.afterEach, callback)
    },

    afterAll: function (callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Expected callback to be a function if passed")
        }

        var test = this._.root.current

        test.afterAll = addHook(test.afterAll, callback)
    },
})

},{"../core/only":14,"../core/tests":16,"../methods":17,"./hooks":4,"./reflect":5}],7:[function(require,module,exports){
"use strict"

var match = require("../../match")
var Util = require("./util")

function binary(numeric, comparator, message) {
    return function (actual, expected) {
        if (numeric) {
            if (typeof actual !== "number") {
                throw new TypeError("`actual` must be a number")
            }

            if (typeof expected !== "number") {
                throw new TypeError("`expected` must be a number")
            }
        }

        if (!comparator(actual, expected)) {
            Util.fail(message, {actual: actual, expected: expected})
        }
    }
}

exports.equal = binary(false,
    function (a, b) { return Util.strictIs(a, b) },
    "Expected {actual} to equal {expected}")

exports.notEqual = binary(false,
    function (a, b) { return !Util.strictIs(a, b) },
    "Expected {actual} to not equal {expected}")

exports.equalLoose = binary(false,
    function (a, b) { return Util.looseIs(a, b) },
    "Expected {actual} to loosely equal {expected}")

exports.notEqualLoose = binary(false,
    function (a, b) { return !Util.looseIs(a, b) },
    "Expected {actual} to not loosely equal {expected}")

exports.atLeast = binary(true,
    function (a, b) { return a >= b },
    "Expected {actual} to be at least {expected}")

exports.atMost = binary(true,
    function (a, b) { return a <= b },
    "Expected {actual} to be at most {expected}")

exports.above = binary(true,
    function (a, b) { return a > b },
    "Expected {actual} to be above {expected}")

exports.below = binary(true,
    function (a, b) { return a < b },
    "Expected {actual} to be below {expected}")

exports.between = function (actual, lower, upper) {
    if (typeof actual !== "number") {
        throw new TypeError("`actual` must be a number")
    }

    if (typeof lower !== "number") {
        throw new TypeError("`lower` must be a number")
    }

    if (typeof upper !== "number") {
        throw new TypeError("`upper` must be a number")
    }

    // The negation is to address NaNs as well, without writing a ton of special
    // case boilerplate
    if (!(actual >= lower && actual <= upper)) {
        Util.fail("Expected {actual} to be between {lower} and {upper}", {
            actual: actual,
            lower: lower,
            upper: upper,
        })
    }
}

exports.deepEqual = binary(false,
    function (a, b) { return match.strict(a, b) },
    "Expected {actual} to deeply equal {expected}")

exports.notDeepEqual = binary(false,
    function (a, b) { return !match.strict(a, b) },
    "Expected {actual} to not deeply equal {expected}")

exports.match = binary(false,
    function (a, b) { return match.match(a, b) },
    "Expected {actual} to match {expected}")

exports.notMatch = binary(false,
    function (a, b) { return !match.match(a, b) },
    "Expected {actual} to not match {expected}")

// Uses division to allow for a more robust comparison of floats. Also, this
// handles near-zero comparisons correctly, as well as a zero tolerance (i.e.
// exact comparison).
function closeTo(expected, actual, tolerance) {
    if (tolerance === Infinity || actual === expected) return true
    if (tolerance === 0) return false
    if (actual === 0) return Math.abs(expected) < tolerance
    if (expected === 0) return Math.abs(actual) < tolerance
    return Math.abs(expected / actual - 1) < tolerance
}

// Note: these two always fail when dealing with NaNs.
exports.closeTo = function (expected, actual, tolerance) {
    if (typeof actual !== "number") {
        throw new TypeError("`actual` must be a number")
    }

    if (typeof expected !== "number") {
        throw new TypeError("`expected` must be a number")
    }

    if (tolerance == null) tolerance = 1e-10

    if (typeof tolerance !== "number" || tolerance < 0) {
        throw new TypeError(
            "`tolerance` must be a non-negative number if given")
    }

    if (actual !== actual || expected !== expected || // eslint-disable-line no-self-compare, max-len
            !closeTo(expected, actual, tolerance)) {
        Util.fail("Expected {actual} to be close to {expected}", {
            actual: actual,
            expected: expected,
        })
    }
}

exports.notCloseTo = function (expected, actual, tolerance) {
    if (typeof actual !== "number") {
        throw new TypeError("`actual` must be a number")
    }

    if (typeof expected !== "number") {
        throw new TypeError("`expected` must be a number")
    }

    if (tolerance == null) tolerance = 1e-10

    if (typeof tolerance !== "number" || tolerance < 0) {
        throw new TypeError(
            "`tolerance` must be a non-negative number if given")
    }

    if (expected !== expected || actual !== actual || // eslint-disable-line no-self-compare, max-len
            closeTo(expected, actual, tolerance)) {
        Util.fail("Expected {actual} to not be close to {expected}", {
            actual: actual,
            expected: expected,
        })
    }
}

},{"../../match":26,"./util":13}],8:[function(require,module,exports){
"use strict"

var match = require("../../match")
var Util = require("./util")
var hasOwn = Object.prototype.hasOwnProperty

function hasKeys(all, object, keys) {
    for (var i = 0; i < keys.length; i++) {
        var test = hasOwn.call(object, keys[i])

        if (test !== all) return !all
    }

    return all
}

function hasValues(func, all, object, keys) {
    if (object === keys) return true
    var list = Object.keys(keys)

    for (var i = 0; i < list.length; i++) {
        var key = list[i]
        var test = hasOwn.call(object, key) && func(keys[key], object[key])

        if (test !== all) return test
    }

    return all
}

function makeHasOverload(all, invert, message) {
    return function (object, keys) {
        if (typeof object !== "object" || object == null) {
            throw new TypeError("`object` must be an object")
        }

        if (typeof keys !== "object" || keys == null) {
            throw new TypeError("`keys` must be an object or array")
        }

        if (Array.isArray(keys)) {
            if (keys.length && hasKeys(all, object, keys) === invert) {
                Util.fail(message, {actual: object, keys: keys})
            }
        } else if (Object.keys(keys).length) {
            if (hasValues(Util.strictIs, all, object, keys) === invert) {
                Util.fail(message, {actual: object, keys: keys})
            }
        }
    }
}

function makeHasKeys(func, all, invert, message) {
    return function (object, keys) {
        if (typeof object !== "object" || object == null) {
            throw new TypeError("`object` must be an object")
        }

        if (typeof keys !== "object" || keys == null) {
            throw new TypeError("`keys` must be an object")
        }

        // exclusive or to invert the result if `invert` is true
        if (Object.keys(keys).length) {
            if (hasValues(func, all, object, keys) === invert) {
                Util.fail(message, {actual: object, keys: keys})
            }
        }
    }
}

/* eslint-disable max-len */

exports.hasKeys = makeHasOverload(true, false, "Expected {actual} to have all keys in {keys}")
exports.hasKeysDeep = makeHasKeys(match.strict, true, false, "Expected {actual} to have all keys in {keys}")
exports.hasKeysMatch = makeHasKeys(match.match, true, false, "Expected {actual} to match all keys in {keys}")
exports.hasKeysAny = makeHasOverload(false, false, "Expected {actual} to have any key in {keys}")
exports.hasKeysAnyDeep = makeHasKeys(match.strict, false, false, "Expected {actual} to have any key in {keys}")
exports.hasKeysAnyMatch = makeHasKeys(match.match, false, false, "Expected {actual} to match any key in {keys}")
exports.notHasKeysAll = makeHasOverload(true, true, "Expected {actual} to not have all keys in {keys}")
exports.notHasKeysAllDeep = makeHasKeys(match.strict, true, true, "Expected {actual} to not have all keys in {keys}")
exports.notHasKeysAllMatch = makeHasKeys(match.match, true, true, "Expected {actual} to not match all keys in {keys}")
exports.notHasKeys = makeHasOverload(false, true, "Expected {actual} to not have any key in {keys}")
exports.notHasKeysDeep = makeHasKeys(match.strict, false, true, "Expected {actual} to not have any key in {keys}")
exports.notHasKeysMatch = makeHasKeys(match.match, false, true, "Expected {actual} to not match any key in {keys}")

},{"../../match":26,"./util":13}],9:[function(require,module,exports){
"use strict"

var Util = require("./util")
var hasOwn = Object.prototype.hasOwnProperty

function has(_) { // eslint-disable-line max-len, max-params
    return function (object, key, value) {
        if (arguments.length >= 3) {
            if (!_.has(object, key) ||
                    !Util.strictIs(_.get(object, key), value)) {
                Util.fail(_.messages[0], {
                    expected: value,
                    actual: object[key],
                    key: key,
                    object: object,
                })
            }
        } else if (!_.has(object, key)) {
            Util.fail(_.messages[1], {
                expected: value,
                actual: object[key],
                key: key,
                object: object,
            })
        }
    }
}

function hasLoose(_) {
    return function (object, key, value) {
        if (!_.has(object, key) || !Util.looseIs(_.get(object, key), value)) {
            Util.fail(_.messages[0], {
                expected: value,
                actual: object[key],
                key: key,
                object: object,
            })
        }
    }
}

function notHas(_) { // eslint-disable-line max-len, max-params
    return function (object, key, value) {
        if (arguments.length >= 3) {
            if (_.has(object, key) &&
                    Util.strictIs(_.get(object, key), value)) {
                Util.fail(_.messages[2], {
                    expected: value,
                    actual: object[key],
                    key: key,
                    object: object,
                })
            }
        } else if (_.has(object, key)) {
            Util.fail(_.messages[3], {
                expected: value,
                actual: object[key],
                key: key,
                object: object,
            })
        }
    }
}

function notHasLoose(_) { // eslint-disable-line max-len, max-params
    return function (object, key, value) {
        if (_.has(object, key) && Util.looseIs(_.get(object, key), value)) {
            Util.fail(_.messages[2], {
                expected: value,
                actual: object[key],
                key: key,
                object: object,
            })
        }
    }
}

function hasOwnKey(object, key) { return hasOwn.call(object, key) }
function hasInKey(object, key) { return key in object }
function hasInColl(object, key) { return object.has(key) }
function hasObjectGet(object, key) { return object[key] }
function hasCollGet(object, key) { return object.get(key) }

function createHas(has, get, messages) {
    return {has: has, get: get, messages: messages}
}

var hasOwnMethods = createHas(hasOwnKey, hasObjectGet, [
    "Expected {object} to have own key {key} equal to {expected}, but found {actual}", // eslint-disable-line max-len
    "Expected {actual} to have own key {expected}",
    "Expected {object} to not have own key {key} equal to {actual}",
    "Expected {actual} to not have own key {expected}",
])

var hasKeyMethods = createHas(hasInKey, hasObjectGet, [
    "Expected {object} to have key {key} equal to {expected}, but found {actual}", // eslint-disable-line max-len
    "Expected {actual} to have key {expected}",
    "Expected {object} to not have key {key} equal to {actual}",
    "Expected {actual} to not have key {expected}",
])

var hasMethods = createHas(hasInColl, hasCollGet, [
    "Expected {object} to have key {key} equal to {expected}, but found {actual}", // eslint-disable-line max-len
    "Expected {actual} to have key {expected}",
    "Expected {object} to not have key {key} equal to {actual}",
    "Expected {actual} to not have key {expected}",
])

exports.hasOwn = has(hasOwnMethods)
exports.notHasOwn = notHas(hasOwnMethods)
exports.hasOwnLoose = hasLoose(hasOwnMethods)
exports.notHasOwnLoose = notHasLoose(hasOwnMethods)

exports.hasKey = has(hasKeyMethods)
exports.notHasKey = notHas(hasKeyMethods)
exports.hasKeyLoose = hasLoose(hasKeyMethods)
exports.notHasKeyLoose = notHasLoose(hasKeyMethods)

exports.has = has(hasMethods)
exports.notHas = notHas(hasMethods)
exports.hasLoose = hasLoose(hasMethods)
exports.notHasLoose = notHasLoose(hasMethods)

},{"./util":13}],10:[function(require,module,exports){
"use strict"

var Util = require("./util")
var match = require("../../match")

function includes(func, all, array, values) {
    // Cheap cases first
    if (!Array.isArray(array)) return false
    if (array === values) return true
    if (all && array.length < values.length) return false

    for (var i = 0; i < values.length; i++) {
        var value = values[i]
        var test = false

        for (var j = 0; j < array.length; j++) {
            if (func(value, array[j])) {
                test = true
                break
            }
        }

        if (test !== all) return test
    }

    return all
}

function defineIncludes(func, all, invert, message) {
    return function (array, values) {
        if (!Array.isArray(array)) {
            throw new TypeError("`array` must be an array")
        }

        if (!Array.isArray(values)) values = [values]

        if (values.length && includes(func, all, array, values) === invert) {
            Util.fail(message, {actual: array, values: values})
        }
    }
}

/* eslint-disable max-len */

exports.includes = defineIncludes(Util.strictIs, true, false, "Expected {actual} to have all values in {values}")
exports.includesDeep = defineIncludes(match.strict, true, false, "Expected {actual} to match all values in {values}")
exports.includesMatch = defineIncludes(match.match, true, false, "Expected {actual} to match all values in {values}")
exports.includesAny = defineIncludes(Util.strictIs, false, false, "Expected {actual} to have any value in {values}")
exports.includesAnyDeep = defineIncludes(match.strict, false, false, "Expected {actual} to match any value in {values}")
exports.includesAnyMatch = defineIncludes(match.match, false, false, "Expected {actual} to match any value in {values}")
exports.notIncludesAll = defineIncludes(Util.strictIs, true, true, "Expected {actual} to not have all values in {values}")
exports.notIncludesAllDeep = defineIncludes(match.strict, true, true, "Expected {actual} to not match all values in {values}")
exports.notIncludesAllMatch = defineIncludes(match.match, true, true, "Expected {actual} to not match all values in {values}")
exports.notIncludes = defineIncludes(Util.strictIs, false, true, "Expected {actual} to not have any value in {values}")
exports.notIncludesDeep = defineIncludes(match.strict, false, true, "Expected {actual} to not match any value in {values}")
exports.notIncludesMatch = defineIncludes(match.match, false, true, "Expected {actual} to not match any value in {values}")

},{"../../match":26,"./util":13}],11:[function(require,module,exports){
"use strict"

var Util = require("./util")

function getName(func) {
    var name = func.name

    if (name == null) name = func.displayName
    if (name) return Util.escape(name)
    return "<anonymous>"
}

exports.throws = function (Type, callback) {
    if (callback == null) {
        callback = Type
        Type = null
    }

    if (Type != null && typeof Type !== "function") {
        throw new TypeError("`Type` must be a function if passed")
    }

    if (typeof callback !== "function") {
        throw new TypeError("`callback` must be a function")
    }

    try {
        callback() // eslint-disable-line callback-return
    } catch (e) {
        if (Type != null && !(e instanceof Type)) {
            Util.fail(
                "Expected callback to throw an instance of " + getName(Type) +
                ", but found {actual}",
                {actual: e})
        }
        return
    }

    throw new Util.AssertionError("Expected callback to throw")
}

function throwsMatchTest(matcher, e) {
    if (typeof matcher === "string") return e.message === matcher
    if (typeof matcher === "function") return !!matcher(e)
    if (matcher instanceof RegExp) return !!matcher.test(e.message)

    var keys = Object.keys(matcher)

    for (var i = 0; i < keys.length; i++) {
        var key = keys[i]

        if (!(key in e) || !Util.strictIs(matcher[key], e[key])) return false
    }

    return true
}

function isPlainObject(object) {
    return object == null || Object.getPrototypeOf(object) === Object.prototype
}

exports.throwsMatch = function (matcher, callback) {
    if (typeof matcher !== "string" &&
            typeof matcher !== "function" &&
            !(matcher instanceof RegExp) &&
            !isPlainObject(matcher)) {
        throw new TypeError(
            "`matcher` must be a string, function, RegExp, or object")
    }

    if (typeof callback !== "function") {
        throw new TypeError("`callback` must be a function")
    }

    try {
        callback() // eslint-disable-line callback-return
    } catch (e) {
        if (!throwsMatchTest(matcher, e)) {
            Util.fail(
                "Expected callback to  throw an error that matches " +
                "{expected}, but found {actual}",
                {expected: matcher, actual: e})
        }
        return
    }

    throw new Util.AssertionError("Expected callback to throw.")
}

},{"./util":13}],12:[function(require,module,exports){
"use strict"

var fail = require("./util").fail

exports.ok = function (x) {
    if (!x) fail("Expected {actual} to be truthy", {actual: x})
}

exports.notOk = function (x) {
    if (x) fail("Expected {actual} to be falsy", {actual: x})
}

exports.isBoolean = function (x) {
    if (typeof x !== "boolean") {
        fail("Expected {actual} to be a boolean", {actual: x})
    }
}

exports.notBoolean = function (x) {
    if (typeof x === "boolean") {
        fail("Expected {actual} to not be a boolean", {actual: x})
    }
}

exports.isFunction = function (x) {
    if (typeof x !== "function") {
        fail("Expected {actual} to be a function", {actual: x})
    }
}

exports.notFunction = function (x) {
    if (typeof x === "function") {
        fail("Expected {actual} to not be a function", {actual: x})
    }
}

exports.isNumber = function (x) {
    if (typeof x !== "number") {
        fail("Expected {actual} to be a number", {actual: x})
    }
}

exports.notNumber = function (x) {
    if (typeof x === "number") {
        fail("Expected {actual} to not be a number", {actual: x})
    }
}

exports.isObject = function (x) {
    if (typeof x !== "object" || x == null) {
        fail("Expected {actual} to be an object", {actual: x})
    }
}

exports.notObject = function (x) {
    if (typeof x === "object" && x != null) {
        fail("Expected {actual} to not be an object", {actual: x})
    }
}

exports.isString = function (x) {
    if (typeof x !== "string") {
        fail("Expected {actual} to be a string", {actual: x})
    }
}

exports.notString = function (x) {
    if (typeof x === "string") {
        fail("Expected {actual} to not be a string", {actual: x})
    }
}

exports.isSymbol = function (x) {
    if (typeof x !== "symbol") {
        fail("Expected {actual} to be a symbol", {actual: x})
    }
}

exports.notSymbol = function (x) {
    if (typeof x === "symbol") {
        fail("Expected {actual} to not be a symbol", {actual: x})
    }
}

exports.exists = function (x) {
    if (x == null) {
        fail("Expected {actual} to exist", {actual: x})
    }
}

exports.notExists = function (x) {
    if (x != null) {
        fail("Expected {actual} to not exist", {actual: x})
    }
}

exports.isArray = function (x) {
    if (!Array.isArray(x)) {
        fail("Expected {actual} to be an array", {actual: x})
    }
}

exports.notArray = function (x) {
    if (Array.isArray(x)) {
        fail("Expected {actual} to not be an array", {actual: x})
    }
}

exports.is = function (Type, object) {
    if (typeof Type !== "function") {
        throw new TypeError("`Type` must be a function")
    }

    if (!(object instanceof Type)) {
        fail("Expected {object} to be an instance of {expected}", {
            expected: Type,
            actual: object.constructor,
            object: object,
        })
    }
}

exports.not = function (Type, object) {
    if (typeof Type !== "function") {
        throw new TypeError("`Type` must be a function")
    }

    if (object instanceof Type) {
        fail("Expected {object} to not be an instance of {expected}", {
            expected: Type,
            object: object,
        })
    }
}

},{"./util":13}],13:[function(require,module,exports){
"use strict"

var inspect = require("../replaced/inspect")
var getStack = require("../util").getStack
var hasOwn = Object.prototype.hasOwnProperty
var AssertionError

try {
    AssertionError = new Function([ // eslint-disable-line no-new-func
        "'use strict';",
        "class AssertionError extends Error {",
        "    constructor(message, expected, actual) {",
        "        super(message)",
        "        this.expected = expected",
        "        this.actual = actual",
        "    }",
        "",
        "    get name() {",
        "        return 'AssertionError'",
        "    }",
        "}",
        // check native subclassing support
        "new AssertionError('message', 1, 2)",
        "return AssertionError",
    ].join("\n"))()
} catch (e) {
    AssertionError = typeof Error.captureStackTrace === "function"
        ? function AssertionError(message, expected, actual) {
            this.message = message || ""
            this.expected = expected
            this.actual = actual
            Error.captureStackTrace(this, this.constructor)
        }
        : function AssertionError(message, expected, actual) {
            this.message = message || ""
            this.expected = expected
            this.actual = actual
            this.stack = getStack(e)
        }

    AssertionError.prototype = Object.create(Error.prototype)

    Object.defineProperty(AssertionError.prototype, "constructor", {
        configurable: true,
        writable: true,
        enumerable: false,
        value: AssertionError,
    })

    Object.defineProperty(AssertionError.prototype, "name", {
        configurable: true,
        writable: true,
        enumerable: false,
        value: "AssertionError",
    })
}

exports.AssertionError = AssertionError

/* eslint-disable no-self-compare */
// For better NaN handling
exports.strictIs = function (a, b) {
    return a === b || a !== a && b !== b
}

exports.looseIs = function (a, b) {
    return a == b || a !== a && b !== b // eslint-disable-line eqeqeq
}

/* eslint-enable no-self-compare */

var templateRegexp = /(.?)\{(.+?)\}/g

exports.escape = function (string) {
    if (typeof string !== "string") {
        throw new TypeError("`string` must be a string")
    }

    return string.replace(templateRegexp, function (m, pre) {
        return pre + "\\" + m.slice(1)
    })
}

// This formats the assertion error messages.
exports.format = function (message, args, prettify) {
    if (prettify == null) prettify = inspect

    if (typeof message !== "string") {
        throw new TypeError("`message` must be a string")
    }

    if (typeof args !== "object" || args === null) {
        throw new TypeError("`args` must be an object")
    }

    if (typeof prettify !== "function") {
        throw new TypeError("`prettify` must be a function if passed")
    }

    return message.replace(templateRegexp, function (m, pre, prop) {
        if (pre === "\\") {
            return m.slice(1)
        } else if (hasOwn.call(args, prop)) {
            return pre + prettify(args[prop], {depth: 5})
        } else {
            return pre + m
        }
    })
}

exports.fail = function (message, args, prettify) {
    if (args == null) throw new AssertionError(message)
    throw new AssertionError(
        exports.format(message, args, prettify),
        args.expected,
        args.actual)
}

// The basic assert, like `assert.ok`, but gives you an optional message.
exports.assert = function (test, message) {
    if (!test) throw new AssertionError(message)
}

},{"../replaced/inspect":36,"../util":25}],14:[function(require,module,exports){
"use strict"

/**
 * The whitelist is actually stored as a tree for faster lookup times when there
 * are multiple selectors. Objects can't be used for the nodes, where keys
 * represent values and values represent children, because regular expressions
 * aren't possible to use.
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
    this.children = undefined
}

function findEquivalent(node, entry) {
    if (node.children == null) return undefined

    for (var i = 0; i < node.children.length; i++) {
        var child = node.children[i]

        if (isEquivalent(child.value, entry)) return child
    }

    return undefined
}

function findMatches(node, entry) {
    if (node.children == null) return undefined

    for (var i = 0; i < node.children.length; i++) {
        var child = node.children[i]

        if (matches(child.value, entry)) return child
    }

    return undefined
}

/**
 * Add a number of selectors
 *
 * @this {Test}
 */
exports.onlyAdd = function (/* ...selectors */) {
    this.only = new Only()

    for (var i = 0; i < arguments.length; i++) {
        var selector = arguments[i]

        if (!Array.isArray(selector)) {
            throw new TypeError(
                "Expected selector " + i + " to be an array")
        }

        onlyAddSingle(this.only, selector, i)
    }
}

function onlyAddSingle(node, selector, index) {
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
            if (node.children == null) {
                node.children = [child]
            } else {
                node.children.push(child)
            }
        }

        node = child
    }
}

/**
 * This checks if the test was whitelisted in a `t.only()` call, or for
 * convenience, returns `true` if `t.only()` was never called.
 */
exports.isOnly = function (test) {
    var path = []
    var i = 0

    while (test.root !== test && test.only == null) {
        path.push(test.name)
        test = test.parent
        i++
    }

    // If there isn't any `only` active, then let's skip the check and return
    // `true` for convenience.
    var only = test.only

    if (only != null) {
        while (i !== 0) {
            only = findMatches(only, path[--i])
            if (only == null) return false
        }
    }

    return true
}

},{}],15:[function(require,module,exports){
"use strict"

var methods = require("../methods")

/**
 * All the report types. The only reason there are more than two types (normal
 * and hook) is for the user's benefit (dev tools, `util.inspect`, etc.)
 */

var Types = exports.Types = Object.freeze({
    Start: 0,
    Enter: 1,
    Leave: 2,
    Pass: 3,
    Fail: 4,
    Skip: 5,
    End: 6,
    Error: 7,

    // Note that `Hook` is denoted by the 4th bit set, to save some space (and
    // to simplify the type representation).
    Hook: 8,
    BeforeAll: 8 | 0,
    BeforeEach: 8 | 1,
    AfterEach: 8 | 2,
    AfterAll: 8 | 3,
})

exports.Report = Report
function Report(type) {
    this._ = type
}

// Avoid a recursive call when `inspect`ing a result while still keeping it
// styled like it would be normally. Each type uses a named singleton factory to
// ensure engines show the correct `name`/`displayName` for the type.
function initInspect(inspect, report) {
    var type = report._

    if (type & Types.Hook) {
        inspect.stage = report.stage
    }

    if (type !== Types.Start &&
            type !== Types.End &&
            type !== Types.Error) {
        inspect.path = report.path
    }

    if (type & Types.Hook) {
        inspect.rootPath = report.rootPath
    }

    // Only add the relevant properties
    if (type === Types.Fail ||
            type === Types.Error ||
            type & Types.Hook) {
        inspect.value = report.value
    }

    if (type === Types.Enter ||
            type === Types.Pass ||
            type === Types.Fail) {
        inspect.duration = report.duration
        inspect.slow = report.slow
    }
}

methods(Report, {
    // The report types
    get isStart() { return this._ === Types.Start },
    get isEnter() { return this._ === Types.Enter },
    get isLeave() { return this._ === Types.Leave },
    get isPass() { return this._ === Types.Pass },
    get isFail() { return this._ === Types.Fail },
    get isSkip() { return this._ === Types.Skip },
    get isEnd() { return this._ === Types.End },
    get isError() { return this._ === Types.Error },
    get isHook() { return (this._ & Types.Hook) !== 0 },

    /**
     * Get a stringified description of the type.
     */
    get type() {
        switch (this._) {
        case Types.Start: return "start"
        case Types.Enter: return "enter"
        case Types.Leave: return "leave"
        case Types.Pass: return "pass"
        case Types.Fail: return "fail"
        case Types.Skip: return "skip"
        case Types.End: return "end"
        case Types.Error: return "error"
        default:
            if (this._ & Types.Hook) return "hook"
            throw new Error("unreachable")
        }
    },
})

exports.Start = StartReport
function StartReport() {
    Report.call(this, Types.Start)
}
methods(StartReport, Report, {
    inspect: function () {
        return new function Report(report) {
            initInspect(this, report)
        }(this)
    },
})

exports.Enter = EnterReport
function EnterReport(path, duration, slow) {
    Report.call(this, Types.Enter)
    this.path = path
    this.duration = duration
    this.slow = slow
}
methods(EnterReport, Report, {
    /**
     * So util.inspect provides more sensible output for testing/etc.
     */
    inspect: function () {
        return new function EnterReport(report) {
            initInspect(this, report)
        }(this)
    },
})

exports.Leave = LeaveReport
function LeaveReport(path) {
    Report.call(this, Types.Leave)
    this.path = path
}
methods(LeaveReport, Report, {
    /**
     * So util.inspect provides more sensible output for testing/etc.
     */
    inspect: function () {
        return new function LeaveReport(report) {
            initInspect(this, report)
        }(this)
    },
})

exports.Pass = PassReport
function PassReport(path, duration, slow) {
    Report.call(this, Types.Pass)
    this.path = path
    this.duration = duration
    this.slow = slow
}
methods(PassReport, Report, {
    /**
     * So util.inspect provides more sensible output for testing/etc.
     */
    inspect: function () {
        return new function PassReport(report) {
            initInspect(this, report)
        }(this)
    },
})

exports.Fail = FailReport
function FailReport(path, error, duration, slow) {
    Report.call(this, Types.Fail)
    this.path = path
    this.error = error
    this.duration = duration
    this.slow = slow
}
methods(FailReport, Report, {
    /**
     * So util.inspect provides more sensible output for testing/etc.
     */
    inspect: function () {
        return new function FailReport(report) {
            initInspect(this, report)
        }(this)
    },
})

exports.Skip = SkipReport
function SkipReport(path) {
    Report.call(this, Types.Skip)
    this.path = path
}
methods(SkipReport, Report, {
    /**
     * So util.inspect provides more sensible output for testing/etc.
     */
    inspect: function () {
        return new function SkipReport(report) {
            initInspect(this, report)
        }(this)
    },
})

exports.End = EndReport
function EndReport() {
    Report.call(this, Types.End)
}
methods(EndReport, Report, {
    /**
     * So util.inspect provides more sensible output for testing/etc.
     */
    inspect: function () {
        return new function EndReport(report) {
            initInspect(this, report)
        }(this)
    },
})

exports.Error = ErrorReport
function ErrorReport(error) {
    Report.call(this, Types.Error)
    this.error = error
}
methods(ErrorReport, Report, {
    /**
     * So util.inspect provides more sensible output for testing/etc.
     */
    inspect: function () {
        return new function ErrorReport(report) {
            initInspect(this, report)
        }(this)
    },
})

var HookMethods = {
    get stage() {
        switch (this._) {
        case Types.BeforeAll: return "before all"
        case Types.BeforeEach: return "before each"
        case Types.AfterEach: return "after each"
        case Types.AfterAll: return "after all"
        default: throw new Error("unreachable")
        }
    },

    get isBeforeAll() { return this._ === Types.BeforeAll },
    get isBeforeEach() { return this._ === Types.BeforeEach },
    get isAfterEach() { return this._ === Types.AfterEach },
    get isAfterAll() { return this._ === Types.AfterAll },
}

exports.HookError = HookError
function HookError(stage, func, error) {
    this._ = stage
    this.name = func.name || func.displayName || ""
    this.error = error
}
methods(HookError, HookMethods)

exports.Hook = HookReport
function HookReport(path, rootPath, hookError) {
    Report.call(this, hookError._)
    this.path = path
    this.rootPath = rootPath
    this.name = hookError.name
    this.error = hookError.error
}
methods(HookReport, Report, HookMethods, {
    get hookError() { return new HookError(this._, this, this.error) },
})

},{"../methods":17}],16:[function(require,module,exports){
(function (global){
"use strict"

var methods = require("../methods")
var peach = require("../util").peach
var Reports = require("./reports")
var isOnly = require("./only").isOnly
var Types = Reports.Types

/**
 * The tests are laid out in a very data-driven design. With exception of the
 * reports, there is minimal object orientation and zero virtual dispatch.
 * Here's a quick overview:
 *
 * - The test handling dispatches based on various attributes the test has. For
 *   example, roots are known by a circular root reference, and skipped tests
 *   are known by not having a callback.
 *
 * - The test evaluation is very procedural. Although it's very highly
 *   asynchronous, the use of promises linearize the logic, so it reads very
 *   much like a recursive set of steps.
 *
 * - The data types are mostly either plain objects or classes with no methods,
 *   the latter mostly for debugging help. This also avoids most of the
 *   indirection required to accommodate breaking abstractions, which the API
 *   methods frequently need to do.
 */

// Prevent Sinon interference when they install their mocks
var setTimeout = global.setTimeout
var clearTimeout = global.clearTimeout
var now = global.Date.now

/**
 * Basic data types
 */
function Result(time, attempt) {
    this.time = time
    this.caught = attempt.caught
    this.value = attempt.caught ? attempt.value : undefined
}

/**
 * Overview of the test properties:
 *
 * - `methods` - A deprecated reference to the API methods
 * - `root` - The root test
 * - `reporters` - The list of reporters
 * - `current` - A reference to the currently active test
 * - `timeout` - The tests's timeout, or 0 if inherited
 * - `slow` - The tests's slow threshold
 * - `name` - The test's name
 * - `index` - The test's index
 * - `parent` - The test's parent
 * - `callback` - The test's callback
 * - `tests` - The test's child tests
 * - `beforeAll`, `beforeEach`, `afterEach`, `afterAll` - The test's various
 *   scheduled hooks
 *
 * Many of these properties aren't present on initialization to save memory.
 */

// TODO: remove `test.methods` in 0.4
function Normal(name, index, parent, callback) {
    var child = Object.create(parent.methods)

    child._ = this
    this.methods = child
    this.locked = true
    this.root = parent.root
    this.name = name
    this.index = index|0
    this.parent = parent
    this.callback = callback
}

function Skipped(name, index, parent) {
    this.locked = true
    this.root = parent.root
    this.name = name
    this.index = index|0
    this.parent = parent
}

// TODO: remove `test.methods` in 0.4
function Root(methods) {
    this.locked = false
    this.methods = methods
    this.reporterIds = []
    this.reporters = []
    this.current = this
    this.root = this
    this.timeout = 0
    this.slow = 0
}

/**
 * Base tests (i.e. default export, result of `internal.root()`).
 */

exports.createRoot = function (methods) {
    return new Root(methods)
}

/**
 * Set up each test type.
 */

/**
 * A normal test through `t.test()`.
 */

exports.addNormal = function (parent, name, callback) {
    var index = parent.tests != null ? parent.tests.length : 0
    var base = new Normal(name, index, parent, callback)

    if (index) {
        parent.tests.push(base)
    } else {
        parent.tests = [base]
    }
}

/**
 * A skipped test through `t.testSkip()`.
 */
exports.addSkipped = function (parent, name) {
    var index = parent.tests != null ? parent.tests.length : 0
    var base = new Skipped(name, index, parent)

    if (index) {
        parent.tests.push(base)
    } else {
        parent.tests = [base]
    }
}

/**
 * Execute the tests
 */

function path(test) {
    var ret = []

    while (test.root !== test) {
        ret.push({name: test.name, index: test.index|0})
        test = test.parent
    }

    return ret.reverse()
}

// Note that a timeout of 0 means to inherit the parent.
exports.timeout = timeout
function timeout(test) {
    while (!test.timeout && test.root !== test) {
        test = test.parent
    }

    return test.timeout || 2000 // ms - default timeout
}

// Note that a slowness threshold of 0 means to inherit the parent.
exports.slow = slow
function slow(test) {
    while (!test.slow && test.root !== test) {
        test = test.parent
    }

    return test.slow || 75 // ms - default slow threshold
}

function report(test, type, arg1, arg2) {
    function invokeReporter(reporter) {
        switch (type) {
        case Types.Start:
            return reporter(new Reports.Start())

        case Types.Enter:
            return reporter(new Reports.Enter(path(test), arg1, slow(test)))

        case Types.Leave:
            return reporter(new Reports.Leave(path(test)))

        case Types.Pass:
            return reporter(new Reports.Pass(path(test), arg1, slow(test)))

        case Types.Fail:
            return reporter(
                new Reports.Fail(path(test), arg1, arg2, slow(test)))

        case Types.Skip:
            return reporter(new Reports.Skip(path(test)))

        case Types.End:
            return reporter(new Reports.End())

        case Types.Error:
            return reporter(new Reports.Error(arg1))

        case Types.Hook:
            return reporter(new Reports.Hook(path(test), path(arg1), arg2))

        default:
            throw new TypeError("unreachable")
        }
    }

    return Promise.resolve()
    .then(function () {
        if (test.root.reporter == null) return undefined
        return invokeReporter(test.root.reporter)
    })
    .then(function () {
        var reporters = test.root.reporters

        // Two easy cases.
        if (reporters.length === 0) return undefined
        if (reporters.length === 1) return invokeReporter(reporters[0])
        return Promise.all(reporters.map(invokeReporter))
    })
}

/**
 * Normal tests
 */

// PhantomJS and IE don't add the stack until it's thrown. In failing async
// tests, it's already thrown in a sense, so this should be normalized with
// other test types.
var mustAddStack = typeof new Error().stack !== "string"

function addStack(e) {
    try { throw e } finally { return e }
}

function getThen(res) {
    if (typeof res === "object" || typeof res === "function") {
        return res.then
    } else {
        return undefined
    }
}

function AsyncState(start, resolve) {
    this.start = start
    this.resolve = resolve
    this.resolved = false
    this.timer = undefined
}

function asyncFinish(state, attempt) {
    // Capture immediately. Worst case scenario, it gets thrown away.
    var end = now()

    if (state.resolved) return
    if (state.timer) {
        clearTimeout.call(global, state.timer)
        state.timer = undefined
    }

    state.resolved = true
    state.resolve(new Result(end - state.start, attempt))
}

// Avoid a closure if possible, in case it doesn't return a thenable.
function invokeInit(test) {
    var start = now()
    var tryBody = try1(test.callback, test.methods, test.methods)

    // Note: synchronous failures are test failures, not fatal errors.
    if (tryBody.caught) {
        return Promise.resolve(new Result(now() - start, tryBody))
    }

    var tryThen = try1(getThen, undefined, tryBody.value)

    if (tryThen.caught || typeof tryThen.value !== "function") {
        return Promise.resolve(new Result(now() - start, tryThen))
    }

    return new Promise(function (resolve) {
        var state = new AsyncState(start, resolve)
        var result = try2(tryThen.value, tryBody.value,
            function () {
                if (state == null) return
                asyncFinish(state, tryPass())
                state = undefined
            },
            function (e) {
                if (state == null) return
                asyncFinish(state, tryFail(
                    mustAddStack || e instanceof Error && e.stack == null
                        ? addStack(e) : e))
                state = undefined
            })

        if (result.caught) {
            asyncFinish(state, result)
            state = undefined
            return
        }

        // Set the timeout *after* initialization. The timeout will likely be
        // specified during initialization.
        var maxTimeout = timeout(test)

        // Setting a timeout is pointless if it's infinite.
        if (maxTimeout !== Infinity) {
            state.timer = setTimeout.call(global, function () {
                if (state == null) return
                asyncFinish(state, tryFail(addStack(
                    new Error("Timeout of " + maxTimeout + " reached"))))
                state = undefined
            }, maxTimeout)
        }
    })
}

function ErrorWrap(test, error) {
    this.test = test
    this.error = error
}
methods(ErrorWrap, Error, {name: "ErrorWrap"})

function invokeHook(test, list, stage) {
    if (list == null) return Promise.resolve()
    return peach(list, function (hook) {
        try {
            return hook()
        } catch (e) {
            throw new ErrorWrap(test, new Reports.HookError(stage, hook, e))
        }
    })
}

function invokeBeforeEach(test) {
    if (test.root === test) {
        return invokeHook(test, test.beforeEach, Types.BeforeEach)
    } else {
        return invokeBeforeEach(test.parent).then(function () {
            return invokeHook(test, test.beforeEach, Types.BeforeEach)
        })
    }
}

function invokeAfterEach(test) {
    if (test.root === test) {
        return invokeHook(test, test.afterEach, Types.AfterEach)
    } else {
        return invokeHook(test, test.afterEach, Types.AfterEach)
        .then(function () { return invokeAfterEach(test.parent) })
    }
}

function runChildTests(test) {
    if (test.tests == null) return undefined

    function runChild(child) {
        return invokeBeforeEach(test)
        .then(function () { return runNormalChild(child) })
        .then(function () { return invokeAfterEach(test) })
        .then(
            function () { test.root.current = test },
            function (e) {
                test.root.current = test
                if (!(e instanceof ErrorWrap)) throw e
                return report(child, Types.Hook, e.test, e.error)
            })
    }

    var ran = false

    function maybeRunChild(child) {
        // Only skipped tests have no callback
        if (child.callback == null) {
            return report(child, Types.Skip)
        } else if (!isOnly(child)) {
            return Promise.resolve()
        } else if (ran) {
            return runChild(child)
        } else {
            ran = true
            return invokeHook(test, test.beforeAll, Types.BeforeAll)
            .then(function () { return runChild(child) })
        }
    }

    return peach(test.tests, function (child) {
        test.root.current = child
        return maybeRunChild(child).then(
            function () { test.root.current = test },
            function (e) { test.root.current = test; throw e })
    })
    .then(function () {
        return ran ? invokeHook(test, test.afterAll, Types.AfterAll) : undefined
    })
}

function clearChildren(test) {
    if (test.tests == null) return
    for (var i = 0; i < test.tests.length; i++) {
        delete test.tests[i].tests
    }
}

function runNormalChild(test) {
    test.locked = false

    return invokeInit(test)
    .then(function (result) {
        test.locked = true

        if (result.caught) {
            return report(test, Types.Fail, result.value, result.time)
        } else if (test.tests != null) {
            // Report this as if it was a parent test if it's passing and has
            // children.
            return report(test, Types.Enter, result.time)
            .then(function () { return runChildTests(test) })
            .then(function () { return report(test, Types.Leave) })
            .catch(function (e) {
                if (!(e instanceof ErrorWrap)) throw e
                return report(test, Types.Leave).then(function () {
                    return report(test, Types.Hook, e.test, e.error)
                })
            })
        } else {
            return report(test, Types.Pass, result.time)
        }
    })
    .then(
        function () { clearChildren(test) },
        function (e) { clearChildren(test); throw e })
}

/**
 * This runs the root test and returns a promise resolved when it's done.
 */
exports.runTest = function (test) {
    test.locked = true

    return report(test, Types.Start)
    .then(function () { return runChildTests(test) })
    .catch(function (e) {
        if (!(e instanceof ErrorWrap)) throw e
        return report(test, Types.Hook, e.test, e.error)
    })
    .then(function () { return report(test, Types.End) })
    // Tell the reporter something happened. Otherwise, it'll have to wrap this
    // method in a plugin, which shouldn't be necessary.
    .catch(function (e) {
        return report(test, Types.Error, e).then(function () { throw e })
    })
    .then(
        function () {
            clearChildren(test)
            test.locked = false
        },
        function (e) {
            clearChildren(test)
            test.locked = false
            throw e
        })
}

// Help optimize for inefficient exception handling in V8

function tryPass(value) {
    return {caught: false, value: value}
}

function tryFail(e) {
    return {caught: true, value: e}
}

function try1(f, inst, arg0) {
    try {
        return tryPass(f.call(inst, arg0))
    } catch (e) {
        return tryFail(e)
    }
}

function try2(f, inst, arg0, arg1) {
    try {
        return tryPass(f.call(inst, arg0, arg1))
    } catch (e) {
        return tryFail(e)
    }
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../methods":17,"../util":25,"./only":14,"./reports":15}],17:[function(require,module,exports){
"use strict"

module.exports = function (Base, Super) {
    var start = 2

    if (typeof Super === "function") {
        Base.prototype = Object.create(Super.prototype)
        Object.defineProperty(Base.prototype, "constructor", {
            configurable: true,
            writable: true,
            enumerable: false,
            value: Base,
        })
    } else {
        start = 1
    }

    for (var i = start; i < arguments.length; i++) {
        var methods = arguments[i]

        if (methods != null) {
            var keys = Object.keys(methods)

            for (var k = 0; k < keys.length; k++) {
                var key = keys[k]
                var desc = Object.getOwnPropertyDescriptor(methods, key)

                desc.enumerable = false
                Object.defineProperty(Base.prototype, key, desc)
            }
        }
    }
}

},{}],18:[function(require,module,exports){
(function (global){
"use strict"

/**
 * This contains the browser console stuff.
 */

exports.Symbols = Object.freeze({
    Pass: "✓",
    Fail: "✖",
    Dot: "․",
    DotFail: "!",
})

exports.windowWidth = 75
exports.newline = "\n"

// Color support is unforced and unsupported, since you can only specify
// line-by-line colors via CSS, and even that isn't very portable.
exports.colorSupport = 0

/**
 * Since browsers don't have unbuffered output, this kind of simulates it.
 */

var acc = ""

exports.defaultOpts = {
    write: function (str) {
        acc += str

        var index = str.indexOf("\n")

        if (index >= 0) {
            var lines = str.split("\n")

            acc = lines.pop()

            for (var i = 0; i < lines.length; i++) {
                global.console.log(lines[i])
            }
        }
    },

    reset: function () {
        if (acc !== "") {
            global.console.log(acc)
            acc = ""
        }
    },
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],19:[function(require,module,exports){
"use strict"

var methods = require("../methods")
var inspect = require("../replaced/inspect")
var peach = require("../util").peach
var Reporter = require("./reporter")
var Util = require("./util")

function simpleInspect(value) {
    if (value instanceof Error) {
        return Util.getStack(value)
    } else {
        return inspect(value)
    }
}

function printTime(_, p, str) {
    if (!_.timePrinted) {
        _.timePrinted = true
        str += Util.color("light", " (" + Util.formatTime(_.duration) + ")")
    }

    return p.then(function () { return _.print(str) })
}

function printFailList(_, str) {
    var parts = str.split(/\r?\n/g)

    return _.print("    " + Util.color("fail", parts[0]))
    .then(function () {
        return peach(parts.slice(1), function (part) {
            return _.print("      " + Util.color("fail", part))
        })
    })
}

module.exports = function (opts, methods) {
    return new ConsoleReporter(opts, methods)
}

/**
 * Base class for most console reporters.
 *
 * Note: printing is asynchronous, because otherwise, if enough errors exist,
 * Node will eventually start dropping lines sent to its buffer, especially when
 * stack traces get involved. If Thallium's output is redirected, that can be a
 * big problem for consumers, as they only have part of the output, and won't be
 * able to see all the errors later. Also, if console warnings come up en-masse,
 * that would also contribute. So, we have to wait for each line to flush before
 * we can continue, so the full output makes its way to the console.
 *
 * Some test frameworks like Tape miss this, though.
 *
 * @param {Object} opts The options for the reporter.
 * @param {Function} opts.write The unbufferred writer for the reporter.
 * @param {Function} opts.reset A reset function for the printer + writer.
 * @param {String[]} accepts The options accepted.
 * @param {Function} init The init function for the subclass reporter's
 *                        isolated state (created by factory).
 */
function ConsoleReporter(opts, methods) {
    Reporter.call(this, Util.Tree, opts, methods, true)

    if (!Util.Colors.forced() && methods.accepts.indexOf("color") >= 0) {
        this.opts.color = opts.color
    }

    Util.defaultify(this, opts, "write")
    this.reset()
}

methods(ConsoleReporter, Reporter, {
    print: function (str) {
        if (str == null) str = ""
        return Promise.resolve(this.opts.write(str + "\n"))
    },

    write: function (str) {
        if (str != null) {
            return Promise.resolve(this.opts.write(str))
        } else {
            return Promise.resolve()
        }
    },

    printResults: function () {
        var self = this

        if (!this.tests && !this.skip) {
            return this.print(
                Util.color("plain", "  0 tests") +
                Util.color("light", " (0ms)"))
            .then(function () { return self.print() })
        }

        return this.print().then(function () {
            var p = Promise.resolve()

            if (self.pass) {
                p = printTime(self, p,
                    Util.color("bright pass", "  ") +
                    Util.color("green", self.pass + " passing"))
            }

            if (self.skip) {
                p = printTime(self, p,
                    Util.color("skip", "  " + self.skip + " skipped"))
            }

            if (self.fail) {
                p = printTime(self, p,
                    Util.color("bright fail", "  ") +
                    Util.color("fail", self.fail + " failing"))
            }

            return p
        })
        .then(function () { return self.print() })
        .then(function () {
            return peach(self.errors, function (report, i) {
                var name = i + 1 + ") " + Util.joinPath(report) +
                    Util.formatRest(report)

                return self.print("  " + Util.color("plain", name + ":"))
                .then(function () {
                    return printFailList(self, simpleInspect(report.error))
                })
                .then(function () { return self.print() })
            })
        })
    },

    printError: function (report) {
        var self = this
        var lines = simpleInspect(report.error).split(/\r?\n/g)

        return this.print().then(function () {
            return peach(lines, function (line) { return self.print(line) })
        })
    },
})

},{"../methods":17,"../replaced/inspect":36,"../util":25,"./reporter":22,"./util":23}],20:[function(require,module,exports){
"use strict"

var Util = require("./util")

exports.on = require("./on")
exports.consoleReporter = require("./console-reporter")
exports.Reporter = require("./reporter")
exports.symbols = Util.symbols
exports.windowWidth = Util.windowWidth
exports.newline = Util.newline
exports.setColor = Util.setColor
exports.unsetColor = Util.unsetColor
exports.speed = Util.speed
exports.getStack = Util.getStack
exports.Colors = Util.Colors
exports.color = Util.color
exports.formatRest = Util.formatRest
exports.joinPath = Util.joinPath
exports.formatTime = Util.formatTime

},{"./console-reporter":19,"./on":21,"./reporter":22,"./util":23}],21:[function(require,module,exports){
"use strict"

var Status = require("./util").Status

/**
 * A macro of sorts, to simplify creating reporters. It accepts an object with
 * the following parameters:
 *
 * `accepts: string[]` - The properties accepted. Everything else is ignored,
 * and it's partially there for documentation. This parameter is required.
 *
 * `create(opts, methods)` - Create a new reporter instance.  This parameter is
 * required. Note that `methods` refers to the parameter object itself.
 *
 * `init(state, opts)` - Initialize extra reporter state, if applicable.
 *
 * `before(reporter)` - Do things before each event, returning a possible
 * thenable when done. This defaults to a no-op.
 *
 * `after(reporter)` - Do things after each event, returning a possible
 * thenable when done. This defaults to a no-op.
 *
 * `report(reporter, report)` - Handle a test report. This may return a possible
 * thenable when done, and it is required.
 */
module.exports = function (name, methods) {
    Object.defineProperty(reporter, "name", {value: name})
    reporter[name] = reporter
    return reporter
    function reporter(opts) {
        /**
         * Instead of silently failing to work, let's error out when a report is
         * passed in, and inform the user it needs initialized. Chances are,
         * there's no legitimate reason to even pass a report, anyways.
         */
        if (typeof opts === "object" && opts !== null &&
                typeof opts._ === "number") {
            throw new TypeError(
                "Options cannot be a report. Did you forget to call the " +
                "factory first?")
        }

        var _ = methods.create(opts, methods)

        return function (report) {
            // Only some events have common steps.
            if (report.isStart) {
                _.running = true
            } else if (report.isEnter || report.isPass) {
                _.get(report.path).status = Status.Passing
                _.duration += report.duration
                _.tests++
                _.pass++
            } else if (report.isFail) {
                _.get(report.path).status = Status.Failing
                _.duration += report.duration
                _.tests++
                _.fail++
            } else if (report.isHook) {
                _.get(report.path).status = Status.Failing
                _.get(report.rootPath).status = Status.Failing
                _.fail++
            } else if (report.isSkip) {
                _.get(report.path).status = Status.Skipped
                // Skipped tests aren't counted in the total test count
                _.skip++
            }

            return Promise.resolve(
                typeof methods.before === "function"
                    ? methods.before(_)
                    : undefined)
            .then(function () { return methods.report(_, report) })
            .then(function () {
                return typeof methods.after === "function"
                    ? methods.after(_)
                    : undefined
            })
            .then(function () {
                if (report.isEnd || report.isError) {
                    _.reset()
                    return _.opts.reset()
                } else {
                    return undefined
                }
            })
        }
    }
}

},{"./util":23}],22:[function(require,module,exports){
"use strict"

var methods = require("../methods")
var defaultify = require("./util").defaultify
var hasOwn = Object.prototype.hasOwnProperty

function State(reporter) {
    if (typeof reporter.methods.init === "function") {
        (0, reporter.methods.init)(this, reporter.opts)
    }
}

/**
 * This helps speed up getting previous trees, so a potentially expensive
 * tree search doesn't have to be performed.
 *
 * (This does actually make a slight perf difference in the tests.)
 */
function isRepeat(cache, path) {
    // Can't be a repeat the first time.
    if (cache.path == null) return false
    if (path.length !== cache.path.length) return false
    if (path === cache.path) return true

    // It's unlikely the nesting will be consistently more than a few levels
    // deep (>= 5), so this shouldn't bog anything down.
    for (var i = 0; i < path.length; i++) {
        if (path[i] !== cache.path[i]) {
            return false
        }
    }

    cache.path = path
    return true
}

/**
 * Superclass for all reporters. This covers the state for pretty much every
 * reporter.
 *
 * Note that if you delay the initial reset, you still must call it before the
 * constructor finishes.
 */
module.exports = Reporter
function Reporter(Tree, opts, methods, delay) {
    this.Tree = Tree
    this.opts = {}
    this.methods = methods
    defaultify(this, opts, "reset")
    if (!delay) this.reset()
}

methods(Reporter, {
    reset: function () {
        this.running = false
        this.timePrinted = false
        this.tests = 0
        this.pass = 0
        this.fail = 0
        this.skip = 0
        this.duration = 0
        this.errors = []
        this.state = new State(this)
        this.base = new this.Tree(null)
        this.cache = {path: null, result: null}
    },

    pushError: function (report) {
        this.errors.push(report)
    },

    get: function (path) {
        if (isRepeat(this.cache, path)) {
            return this.cache.result
        }

        var child = this.base

        for (var i = 0; i < path.length; i++) {
            var entry = path[i]

            if (hasOwn.call(child.children, entry.index)) {
                child = child.children[entry.index]
            } else {
                child = child.children[entry.index] = new this.Tree(entry.name)
            }
        }

        return this.cache.result = child
    },
})

},{"../methods":17,"./util":23}],23:[function(require,module,exports){
"use strict"

// TODO: add `diff` support
// var diff = require("diff")

var Util = require("../util")
var Settings = require("../settings")

exports.symbols = Settings.symbols
exports.windowWidth = Settings.windowWidth
exports.newline = Settings.newline

/*
 * Stack normalization
 */

var stackIncludesMessage = (function () {
    var stack = Util.getStack(new Error("test"))

    //     Firefox, Safari                 Chrome, IE
    return !/^(@)?\S+\:\d+/.test(stack) && !/^\s*at/.test(stack)
})()

function formatLineBreaks(lead, str) {
    return str
        .replace(/^\s+/gm, lead)
        .replace(/\r?\n|\r/g, Settings.newline())
}

exports.getStack = function (e) {
    if (e instanceof Error) {
        var description = formatLineBreaks("    ", e.name + ": " + e.message)
        var stripped = ""

        if (stackIncludesMessage) {
            var stack = Util.getStack(e)
            var index = stack.indexOf(e.message)

            if (index < 0) return formatLineBreaks("", Util.getStack(e))

            var re = /\r?\n/g

            re.lastIndex = index + e.message.length
            if (re.test(stack)) {
                stripped = formatLineBreaks("", stack.slice(re.lastIndex))
            }
        } else {
            stripped = formatLineBreaks("", Util.getStack(e))
        }

        if (stripped !== "") description += Settings.newline() + stripped
        return description
    } else {
        return formatLineBreaks("", Util.getStack(e))
    }
}

var Colors = exports.Colors = Settings.Colors

// Color palette pulled from Mocha
function colorToNumber(name) {
    switch (name) {
    case "pass": return 90
    case "fail": return 31

    case "bright pass": return 92
    case "bright fail": return 91
    case "bright yellow": return 93

    case "skip": return 36
    case "suite": return 0
    case "plain": return 0

    case "error title": return 0
    case "error message": return 31
    case "error stack": return 90

    case "checkmark": return 32
    case "fast": return 90
    case "medium": return 33
    case "slow": return 31
    case "green": return 32
    case "light": return 90

    case "diff gutter": return 90
    case "diff added": return 32
    case "diff removed": return 31
    default: throw new TypeError("Invalid name: \"" + name + "\"")
    }
}

exports.color = function (name, str) {
    if (Colors.supported()) {
        return "\u001b[" + colorToNumber(name) + "m" + str + "\u001b[0m"
    } else {
        return str + ""
    }
}

exports.setColor = function (_) {
    if (_.opts.color != null) Colors.maybeSet(_.opts.color)
}

exports.unsetColor = function (_) {
    if (_.opts.color != null) Colors.maybeRestore()
}

var Status = exports.Status = Object.freeze({
    Unknown: 0,
    Skipped: 1,
    Passing: 2,
    Failing: 3,
})

exports.Tree = function (value) {
    this.value = value
    this.status = Status.Unknown
    this.children = Object.create(null)
}

exports.defaultify = function (_, opts, prop) {
    if (_.methods.accepts.indexOf(prop) >= 0) {
        var used = opts != null && typeof opts[prop] === "function"
            ? opts
            : Settings.defaultOpts()

        _.opts[prop] = function () {
            return Promise.resolve(used[prop].apply(used, arguments))
        }
    }
}

function joinPath(reportPath) {
    var path = ""

    for (var i = 0; i < reportPath.length; i++) {
        path += " " + reportPath[i].name
    }

    return path.slice(1)
}

exports.joinPath = function (report) {
    return joinPath(report.path)
}

exports.speed = function (report) {
    if (report.duration >= report.slow) return "slow"
    if (report.duration >= report.slow / 2) return "medium"
    if (report.duration >= 0) return "fast"
    throw new RangeError("Duration must not be negative")
}

exports.formatTime = (function () {
    var s = 1000 /* ms */
    var m = 60 * s
    var h = 60 * m
    var d = 24 * h

    return function (ms) {
        if (ms >= d) return Math.round(ms / d) + "d"
        if (ms >= h) return Math.round(ms / h) + "h"
        if (ms >= m) return Math.round(ms / m) + "m"
        if (ms >= s) return Math.round(ms / s) + "s"
        return ms + "ms"
    }
})()

exports.formatRest = function (report) {
    if (!report.isHook) return ""
    var path = " ("

    if (report.rootPath.length) {
        path += report.stage
        if (report.name) path += " ‒ " + report.name
        if (report.path.length > report.rootPath.length + 1) {
            path += ", in " + joinPath(report.rootPath)
        }
    } else {
        path += "global " + report.stage
        if (report.name) path += " ‒ " + report.name
    }

    return path + ")"
}

// exports.unifiedDiff = function (err) {
//     var msg = diff.createPatch("string", err.actual, err.expected)
//     var lines = msg.split(Settings.newline()).slice(0, 4)
//     var ret = Settings.newline() + "      " +
//         color("diff added", "+ expected") + " " +
//         color("diff removed", "- actual") +
//         Settings.newline()
//
//     for (var i = 0; i < lines.length; i++) {
//         var line = lines[i]
//
//         if (line[0] === "+") {
//             ret += Settings.newline() + "      " + color("diff added", line)
//         } else if (line[0] === "-") {
//             ret += Settings.newline() + "      " +
//                 color("diff removed", line)
//         } else if (!/\@\@|\\ No newline/.test(line)) {
//             ret += Settings.newline() + "      " + line
//         }
//     }
//
//     return ret
// }

},{"../settings":24,"../util":25}],24:[function(require,module,exports){
"use strict"

// General CLI and reporter settings. If something needs to

var Console = require("./replaced/console")

var windowWidth = Console.windowWidth
var newline = Console.newline
var Symbols = Console.Symbols
var defaultOpts = Console.defaultOpts

exports.windowWidth = function () { return windowWidth }
exports.newline = function () { return newline }
exports.symbols = function () { return Symbols }
exports.defaultOpts = function () { return defaultOpts }

exports.setWindowWidth = function (value) { return windowWidth = value }
exports.setNewline = function (value) { return newline = value }
exports.setSymbols = function (value) { return Symbols = value }
exports.setDefaultOpts = function (value) { return defaultOpts = value }

// Console.colorSupport is a mask with the following bits:
// 0x1 - if set, colors supported by default
// 0x2 - if set, force color support
//
// This is purely an implementation detail, and is invisible to the outside
// world.
var colorSupport = Console.colorSupport
var mask = colorSupport

exports.Colors = {
    supported: function () {
        return (mask & 0x1) !== 0
    },

    forced: function () {
        return (mask & 0x2) !== 0
    },

    maybeSet: function (value) {
        if ((mask & 0x2) === 0) mask = value ? 0x1 : 0
    },

    maybeRestore: function () {
        if ((mask & 0x2) === 0) mask = colorSupport & 0x1
    },

    // Only for debugging
    forceSet: function (value) {
        mask = value ? 0x3 : 0x2
    },

    forceRestore: function () {
        mask = colorSupport
    },

    getSupport: function () {
        return {
            supported: (colorSupport & 0x1) !== 0,
            forced: (colorSupport & 0x2) !== 0,
        }
    },

    setSupport: function (opts) {
        mask = colorSupport =
            (opts.supported ? 0x1 : 0) | (opts.forced ? 0x2 : 0)
    },
}

},{"./replaced/console":18}],25:[function(require,module,exports){
"use strict"

exports.getType = function (value) {
    if (value == null) return "null"
    if (Array.isArray(value)) return "array"
    return typeof value
}

// PhantomJS, IE, and possibly Edge don't set the stack trace until the error is
// thrown. Note that this prefers an existing stack first, since non-native
// errors likely already contain this. Note that this isn't necessary in the
// CLI - that only targets Node.
exports.getStack = function (e) {
    var stack = e.stack

    if (!(e instanceof Error) || stack != null) return stack

    try {
        throw e
    } catch (e) {
        return e.stack
    }
}

exports.pcall = function (func) {
    return new Promise(function (resolve, reject) {
        return func(function (e, value) {
            return e != null ? reject(e) : resolve(value)
        })
    })
}

exports.peach = function (list, func) {
    var len = list.length
    var p = Promise.resolve()

    for (var i = 0; i < len; i++) {
        p = p.then(func.bind(undefined, list[i], i))
    }

    return p
}

},{}],26:[function(require,module,exports){
(function (global){
"use strict"

/* global Symbol, Uint8Array, DataView, ArrayBuffer, ArrayBufferView, Map,
    Set */

/**
 * Deep matching algorithm for `t.match` and `t.deepEqual`, with zero
 * dependencies. Note the following:
 *
 * - This is relatively performance-tuned, although it prefers high correctness.
 *   Patch with care, since performance is a concern.
 * - This does pack a *lot* of features. There's a reason why this is so long.
 * - Some of the duplication is intentional. It's generally commented, but it's
 *   mainly for performance, since the engine needs its type info.
 * - Polyfilled core-js Symbols from cross-origin contexts will never register
 *   as being actual Symbols.
 *
 * And in case you're wondering about the longer functions and occasional
 * repetition, it's because V8's inliner isn't always intelligent enough to deal
 * with the super highly polymorphic data this often deals with, and JS doesn't
 * have compile-time macros. (Also, Sweet.js isn't worth the hassle.)
 */

var objectToString = Object.prototype.toString
var hasOwn = Object.prototype.hasOwnProperty

var supportsUnicode = hasOwn.call(RegExp.prototype, "unicode")
var supportsSticky = hasOwn.call(RegExp.prototype, "sticky")

// Legacy engines have several issues when it comes to `typeof`.
var isFunction = (function () {
    function SlowIsFunction(value) {
        if (value == null) return false

        var tag = objectToString.call(value)

        return tag === "[object Function]" ||
            tag === "[object GeneratorFunction]" ||
            tag === "[object AsyncFunction]" ||
            tag === "[object Proxy]"
    }

    function isPoisoned(object) {
        return object != null && typeof object !== "function"
    }

    // In Safari 10, `typeof Proxy === "object"`
    if (isPoisoned(global.Proxy)) return SlowIsFunction

    // In Safari 8, several typed array constructors are `typeof C === "object"`
    if (isPoisoned(global.Int8Array)) return SlowIsFunction

    // In old V8, RegExps are callable
    if (typeof /x/ === "function") return SlowIsFunction // eslint-disable-line

    // Leave this for normal things. It's easily inlined.
    return function isFunction(value) {
        return typeof value === "function"
    }
})()

// Set up our own buffer check. We should always accept the polyfill, even in
// Node. Note that it uses `global.Buffer` to avoid including `buffer` in the
// bundle.

var BufferNative = 0
var BufferPolyfill = 1
var BufferSafari = 2

var bufferSupport = (function () {
    function FakeBuffer() {}
    FakeBuffer.isBuffer = function () { return true }

    // Only Safari 5-7 has ever had this issue.
    if (new FakeBuffer().constructor !== FakeBuffer) return BufferSafari
    if (!isFunction(global.Buffer)) return BufferPolyfill
    if (!isFunction(global.Buffer.isBuffer)) return BufferPolyfill
    // Avoid the polyfill
    if (global.Buffer.isBuffer(new FakeBuffer())) return BufferPolyfill
    return BufferNative
})()

var globalIsBuffer = bufferSupport === BufferNative
    ? global.Buffer.isBuffer
    : undefined

function isBuffer(object) {
    if (bufferSupport === BufferNative && globalIsBuffer(object)) return true
    if (bufferSupport === BufferSafari && object._isBuffer) return true

    var B = object.constructor

    if (!isFunction(B)) return false
    if (!isFunction(B.isBuffer)) return false
    return B.isBuffer(object)
}

// core-js' symbols are objects, and some old versions of V8 erroneously had
// `typeof Symbol() === "object"`.
var symbolsAreObjects = isFunction(global.Symbol) &&
    typeof Symbol() === "object"

// `context` is a bit field, with the following bits. This is not as much for
// performance than to just reduce the number of parameters I need to be
// throwing around.
var Strict = 1
var Initial = 2
var SameProto = 4

exports.match = function (a, b) {
    return match(a, b, Initial, undefined, undefined)
}

exports.strict = function (a, b) {
    return match(a, b, Strict | Initial, undefined, undefined)
}

// Feature-test delayed stack additions and extra keys. PhantomJS and IE both
// wait until the error was actually thrown first, and assign them as own
// properties, which is unhelpful for assertions. This returns a function to
// speed up cases where `Object.keys` is sufficient (e.g. in Chrome/FF/Node).
//
// This wouldn't be necessary if those engines would make the stack a getter,
// and record it when the error was created, not when it was thrown. It
// specifically filters out errors and only checks existing descriptors, just to
// keep the mess from affecting everything (it's not fully correct, but it's
// necessary).
var requiresProxy = (function () {
    var test = new Error()
    var old = Object.create(null)

    Object.keys(test).forEach(function (key) { old[key] = true })

    try {
        throw test
    } catch (_) {
        // ignore
    }

    return Object.keys(test).some(function (key) { return !old[key] })
})()

function isIgnored(object, key) {
    switch (key) {
    case "line": if (typeof object[key] !== "number") return false; break
    case "sourceURL": if (typeof object[key] !== "string") return false; break
    case "stack": if (typeof object[key] !== "string") return false; break
    default: return false
    }

    var desc = Object.getOwnPropertyDescriptor(object, key)

    return !desc.configurable && desc.enumerable && !desc.writable
}

// This is only invoked with errors, so it's not going to present a significant
// slow down.
function getKeysStripped(object) {
    var keys = Object.keys(object)
    var count = 0

    for (var i = 0; i < keys.length; i++) {
        if (!isIgnored(object, keys[i])) keys[count++] = keys[i]
    }

    keys.length = count
    return keys
}

// Way faster, since typed array indices are always dense and contain numbers.

// Setup for `isBufferOrView` and `isView`
var ArrayBufferNone = 0
var ArrayBufferLegacy = 1
var ArrayBufferCurrent = 2

var arrayBufferSupport = (function () {
    if (!isFunction(global.Uint8Array)) return ArrayBufferNone
    if (!isFunction(global.DataView)) return ArrayBufferNone
    if (!isFunction(global.ArrayBuffer)) return ArrayBufferNone
    if (isFunction(global.ArrayBuffer.isView)) return ArrayBufferCurrent
    if (isFunction(global.ArrayBufferView)) return ArrayBufferLegacy
    return ArrayBufferNone
})()

// If typed arrays aren't supported (they weren't technically part of
// ES5, but many engines implemented Khronos' spec before ES6), then
// just fall back to generic buffer detection.
function floatIs(a, b) {
    // So NaNs are considered equal.
    return a === b || a !== a && b !== b // eslint-disable-line no-self-compare
}

function matchView(a, b) {
    var count = a.length

    if (count !== b.length) return false

    while (count) {
        count--
        if (!floatIs(a[count], b[count])) return false
    }

    return true
}

var isView = (function () {
    if (arrayBufferSupport === ArrayBufferNone) return undefined
    // ES6 typed arrays
    if (arrayBufferSupport === ArrayBufferCurrent) return ArrayBuffer.isView
    // legacy typed arrays
    return function isView(object) {
        return object instanceof ArrayBufferView
    }
})()

// Support checking maps and sets deeply. They are object-like enough to count,
// and are useful in their own right. The code is rather messy, but mainly to
// keep the order-independent checking from becoming insanely slow.
var supportsMap = isFunction(global.Map)
var supportsSet = isFunction(global.Set)

// One of the sets and both maps' keys are converted to arrays for faster
// handling.
function keyList(map) {
    var list = new Array(map.size)
    var i = 0
    var iter = map.keys()

    for (var next = iter.next(); !next.done; next = iter.next()) {
        list[i++] = next.value
    }

    return list
}

// The pair of arrays are aligned in a single O(n^2) operation (mod deep
// matching and rotation), adapting to O(n) when they're already aligned.
function matchKey(current, akeys, start, end, context, left, right) { // eslint-disable-line max-params, max-len
    for (var i = start + 1; i < end; i++) {
        var key = akeys[i]

        if (match(current, key, context, left, right)) {
            // TODO: once engines actually optimize `copyWithin`, use that
            // instead. It'll be much faster than this loop.
            while (i > start) akeys[i] = akeys[--i]
            akeys[i] = key
            return true
        }
    }

    return false
}

function matchValues(a, b, akeys, bkeys, end, context, left, right) { // eslint-disable-line max-params, max-len
    for (var i = 0; i < end; i++) {
        if (!match(a.get(akeys[i]), b.get(bkeys[i]), context, left, right)) {
            return false
        }
    }

    return true
}

// Possibly expensive order-independent key-value match. First, try to avoid it
// by conservatively assuming everything is in order - a cheap O(n) is always
// nicer than an expensive O(n^2).
function matchMap(a, b, context, left, right) { // eslint-disable-line max-params, max-len
    var end = a.size
    var akeys = keyList(a)
    var bkeys = keyList(b)
    var i = 0

    while (i !== end && match(akeys[i], bkeys[i], context, left, right)) {
        i++
    }

    if (i === end) {
        return matchValues(a, b, akeys, bkeys, end, context, left, right)
    }

    // Don't compare the same key twice
    if (!matchKey(bkeys[i], akeys, i, end, context, left, right)) {
        return false
    }

    // If the above fails, while we're at it, let's sort them as we go, so
    // the key order matches.
    while (++i < end) {
        var key = bkeys[i]

        // Adapt if the keys are already in order, which is frequently the
        // case.
        if (!match(key, akeys[i], context, left, right) &&
                !matchKey(key, akeys, i, end, context, left, right)) {
            return false
        }
    }

    return matchValues(a, b, akeys, bkeys, end, context, left, right)
}

function hasAllIdentical(alist, b) {
    for (var i = 0; i < alist.length; i++) {
        if (!b.has(alist[i])) return false
    }

    return true
}

// Compare the values structurally, and independent of order.
function searchFor(avalue, objects, context, left, right) { // eslint-disable-line max-params, max-len
    for (var j in objects) {
        if (hasOwn.call(objects, j)) {
            if (match(avalue, objects[j], context, left, right)) {
                delete objects[j]
                return true
            }
        }
    }

    return false
}

function hasStructure(value, context) {
    return typeof value === "object" && value !== null ||
            !(context & Strict) && typeof value === "symbol"
}

// The set algorithm is structured a little differently. It takes one of the
// sets into an array, does a cheap identity check, then does the deep check.
function matchSet(a, b, context, left, right) { // eslint-disable-line max-params, max-len
    // This is to try to avoid an expensive structural match on the keys. Test
    // for identity first.
    var alist = keyList(a)

    if (hasAllIdentical(alist, b)) return true

    var iter = b.values()
    var count = 0
    var objects

    // Gather all the objects
    for (var next = iter.next(); !next.done; next = iter.next()) {
        var bvalue = next.value

        if (hasStructure(bvalue, context)) {
            // Create the objects map lazily. Note that this also grabs Symbols
            // when not strictly matching, since their description is compared.
            if (count === 0) objects = Object.create(null)
            objects[count++] = bvalue
        }
    }

    // If everything is a primitive, then abort.
    if (count === 0) return false

    // Iterate the object, removing each one remaining when matched (and
    // aborting if none can be).
    for (var i = 0; i < count; i++) {
        var avalue = alist[i]

        if (hasStructure(avalue, context)) {
            if (!searchFor(avalue, objects, context, left, right)) return false
        }
    }

    return true
}

function matchRegExp(a, b) {
    return a.source === b.source &&
        a.global === b.global &&
        a.ignoreCase === b.ignoreCase &&
        a.multiline === b.multiline &&
        (!supportsUnicode || a.unicode === b.unicode) &&
        (!supportsSticky || a.sticky === b.sticky)
}

function matchPrepareDescend(a, b, context, left, right) { // eslint-disable-line max-params, max-len
    // Check for circular references after the first level, where it's
    // redundant. Note that they have to point to the same level to actually
    // be considered deeply equal.
    if (!(context & Initial)) {
        var leftIndex = left.indexOf(a)
        var rightIndex = right.indexOf(b)

        if (leftIndex !== rightIndex) return false
        if (leftIndex >= 0) return true

        left.push(a)
        right.push(b)

        var result = matchInner(a, b, context, left, right)

        left.pop()
        right.pop()

        return result
    } else {
        return matchInner(a, b, context & ~Initial, [a], [b])
    }
}

function matchSameProto(a, b, context, left, right) { // eslint-disable-line max-params, max-len
    if (symbolsAreObjects && a instanceof Symbol) {
        return !(context & Strict) && a.toString() === b.toString()
    }

    if (a instanceof RegExp) return matchRegExp(a, b)
    if (a instanceof Date) return a.valueOf() === b.valueOf()
    if (arrayBufferSupport !== ArrayBufferNone) {
        if (a instanceof DataView) {
            return matchView(
                new Uint8Array(a.buffer, a.byteOffset, a.byteLength),
                new Uint8Array(b.buffer, b.byteOffset, b.byteLength))
        }
        if (a instanceof ArrayBuffer) {
            return matchView(new Uint8Array(a), new Uint8Array(b))
        }
        if (isView(a)) return matchView(a, b)
    }

    if (isBuffer(a)) return matchView(a, b)

    if (Array.isArray(a)) {
        if (a.length !== b.length) return false
        if (a.length === 0) return true
    } else if (supportsMap && a instanceof Map) {
        if (a.size !== b.size) return false
        if (a.size === 0) return true
    } else if (supportsSet && a instanceof Set) {
        if (a.size !== b.size) return false
        if (a.size === 0) return true
    } else if (objectToString.call(a) === "[object Arguments]") {
        if (objectToString.call(b) !== "[object Arguments]") return false
        if (a.length !== b.length) return false
        if (a.length === 0) return true
    } else if (objectToString.call(b) === "[object Arguments]") {
        return false
    }

    return matchPrepareDescend(a, b, context, left, right)
}

// Most special cases require both types to match, and if only one of them are,
// the objects themselves don't match.
function matchDifferentProto(a, b, context, left, right) { // eslint-disable-line max-params, max-len
    if (symbolsAreObjects) {
        if (a instanceof Symbol || b instanceof Symbol) return false
    }
    if (context & Strict) return false
    if (arrayBufferSupport !== ArrayBufferNone) {
        if (a instanceof ArrayBuffer || b instanceof ArrayBuffer) return false
        if (isView(a) || isView(b)) return false
    }
    if (Array.isArray(a) || Array.isArray(b)) return false
    if (supportsMap && (a instanceof Map || b instanceof Map)) return false
    if (supportsSet && (a instanceof Set || b instanceof Set)) return false
    if (objectToString.call(a) === "[object Arguments]") {
        if (objectToString.call(b) !== "[object Arguments]") return false
        if (a.length !== b.length) return false
        if (a.length === 0) return true
    }
    if (objectToString.call(b) === "[object Arguments]") return false
    return matchPrepareDescend(a, b, context, left, right)
}

function match(a, b, context, left, right) { // eslint-disable-line max-params
    if (a === b) return true
    // NaNs are equal
    if (a !== a) return b !== b // eslint-disable-line no-self-compare
    if (a === null || b === null) return false
    if (typeof a === "symbol" && typeof b === "symbol") {
        return !(context & Strict) && a.toString() === b.toString()
    }
    if (typeof a !== "object" || typeof b !== "object") return false

    // Usually, both objects have identical prototypes, and that allows for half
    // the type checking.
    if (Object.getPrototypeOf(a) === Object.getPrototypeOf(b)) {
        return matchSameProto(a, b, context | SameProto, left, right)
    } else {
        return matchDifferentProto(a, b, context, left, right)
    }
}

function matchArrayLike(a, b, context, left, right) { // eslint-disable-line max-params, max-len
    for (var i = 0; i < a.length; i++) {
        if (!match(a[i], b[i], context, left, right)) return false
    }

    return true
}

// PhantomJS and SlimerJS both have mysterious issues where `Error` is sometimes
// erroneously of a different `window`, and it shows up in the tests. This means
// I have to use a much slower algorithm to detect Errors.
//
// PhantomJS: https://github.com/petkaantonov/bluebird/issues/1146
// SlimerJS: https://github.com/laurentj/slimerjs/issues/400
//
// (Yes, the PhantomJS bug is detailed in the Bluebird issue tracker.)
var checkCrossOrigin = (function () {
    if (global.window == null || global.window.navigator == null) return false
    return /slimerjs|phantomjs/i.test(global.window.navigator.userAgent)
})()

var errorStringTypes = {
    "[object Error]": true,
    "[object EvalError]": true,
    "[object RangeError]": true,
    "[object ReferenceError]": true,
    "[object SyntaxError]": true,
    "[object TypeError]": true,
    "[object URIError]": true,
}

function isProxiedError(object) {
    while (object != null) {
        if (errorStringTypes[objectToString.call(object)]) return true
        object = Object.getPrototypeOf(object)
    }

    return false
}

function matchInner(a, b, context, left, right) { // eslint-disable-line max-statements, max-params, max-len
    var akeys, bkeys
    var isUnproxiedError = false

    if (context & SameProto) {
        if (Array.isArray(a)) return matchArrayLike(a, b, context, left, right)

        if (supportsMap && a instanceof Map) {
            return matchMap(a, b, context, left, right)
        }

        if (supportsSet && a instanceof Set) {
            return matchSet(a, b, context, left, right)
        }

        if (objectToString.call(a) === "[object Arguments]") {
            return matchArrayLike(a, b, context, left, right)
        }

        if (requiresProxy &&
                (checkCrossOrigin ? isProxiedError(a) : a instanceof Error)) {
            akeys = getKeysStripped(a)
            bkeys = getKeysStripped(b)
        } else {
            akeys = Object.keys(a)
            bkeys = Object.keys(b)
            isUnproxiedError = a instanceof Error
        }
    } else {
        if (objectToString.call(a) === "[object Arguments]") {
            return matchArrayLike(a, b, context, left, right)
        }

        // If we require a proxy, be permissive and check the `toString` type.
        // This is so it works cross-origin in PhantomJS in particular.
        if (a instanceof Error) return false
        akeys = Object.keys(a)
        bkeys = Object.keys(b)
    }

    var count = akeys.length

    if (count !== bkeys.length) return false

    // Shortcut if there's nothing to match
    if (count === 0) return true

    var i

    if (isUnproxiedError) {
        // Shortcut if the properties are different.
        for (i = 0; i < count; i++) {
            if (akeys[i] !== "stack") {
                if (!hasOwn.call(b, akeys[i])) return false
            }
        }

        // Verify that all the akeys' values matched.
        for (i = 0; i < count; i++) {
            if (akeys[i] !== "stack") {
                if (!match(a[akeys[i]], b[akeys[i]], context, left, right)) {
                    return false
                }
            }
        }
    } else {
        // Shortcut if the properties are different.
        for (i = 0; i < count; i++) {
            if (!hasOwn.call(b, akeys[i])) return false
        }

        // Verify that all the akeys' values matched.
        for (i = 0; i < count; i++) {
            if (!match(a[akeys[i]], b[akeys[i]], context, left, right)) {
                return false
            }
        }
    }

    return true
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],27:[function(require,module,exports){
module.exports = function (xs, f) {
    if (xs.map) return xs.map(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        var x = xs[i];
        if (hasOwn.call(xs, i)) res.push(f(x, i, xs));
    }
    return res;
};

var hasOwn = Object.prototype.hasOwnProperty;

},{}],28:[function(require,module,exports){
var hasOwn = Object.prototype.hasOwnProperty;

module.exports = function (xs, f, acc) {
    var hasAcc = arguments.length >= 3;
    if (hasAcc && xs.reduce) return xs.reduce(f, acc);
    if (xs.reduce) return xs.reduce(f);
    
    for (var i = 0; i < xs.length; i++) {
        if (!hasOwn.call(xs, i)) continue;
        if (!hasAcc) {
            acc = xs[i];
            hasAcc = true;
            continue;
        }
        acc = f(acc, xs[i], i);
    }
    return acc;
};

},{}],29:[function(require,module,exports){

var hasOwn = Object.prototype.hasOwnProperty;
var toString = Object.prototype.toString;

module.exports = function forEach (obj, fn, ctx) {
    if (toString.call(fn) !== '[object Function]') {
        throw new TypeError('iterator must be a function');
    }
    var l = obj.length;
    if (l === +l) {
        for (var i = 0; i < l; i++) {
            fn.call(ctx, obj[i], i, obj);
        }
    } else {
        for (var k in obj) {
            if (hasOwn.call(obj, k)) {
                fn.call(ctx, obj[k], k, obj);
            }
        }
    }
};


},{}],30:[function(require,module,exports){

var indexOf = [].indexOf;

module.exports = function(arr, obj){
  if (indexOf) return arr.indexOf(obj);
  for (var i = 0; i < arr.length; ++i) {
    if (arr[i] === obj) return i;
  }
  return -1;
};
},{}],31:[function(require,module,exports){
module.exports = Array.isArray || function (arr) {
  return Object.prototype.toString.call(arr) == '[object Array]';
};

},{}],32:[function(require,module,exports){
(function (global){
/*! JSON v3.3.0 | http://bestiejs.github.io/json3 | Copyright 2012-2014, Kit Cambridge | http://kit.mit-license.org */
;(function (root) {
  // Detect the `define` function exposed by asynchronous module loaders. The
  // strict `define` check is necessary for compatibility with `r.js`.
  var isLoader = typeof define === "function" && define.amd;

  // Use the `global` object exposed by Node (including Browserify via
  // `insert-module-globals`), Narwhal, and Ringo as the default context.
  // Rhino exports a `global` function instead.
  var freeGlobal = typeof global == "object" && global;
  if (freeGlobal && (freeGlobal["global"] === freeGlobal || freeGlobal["window"] === freeGlobal)) {
    root = freeGlobal;
  }

  // Public: Initializes JSON 3 using the given `context` object, attaching the
  // `stringify` and `parse` functions to the specified `exports` object.
  function runInContext(context, exports) {
    context || (context = root["Object"]());
    exports || (exports = root["Object"]());

    // Native constructor aliases.
    var Number = context["Number"] || root["Number"],
        String = context["String"] || root["String"],
        Object = context["Object"] || root["Object"],
        Date = context["Date"] || root["Date"],
        SyntaxError = context["SyntaxError"] || root["SyntaxError"],
        TypeError = context["TypeError"] || root["TypeError"],
        Math = context["Math"] || root["Math"],
        nativeJSON = context["JSON"] || root["JSON"];

    // Delegate to the native `stringify` and `parse` implementations.
    if (typeof nativeJSON == "object" && nativeJSON) {
      exports.stringify = nativeJSON.stringify;
      exports.parse = nativeJSON.parse;
    }

    // Convenience aliases.
    var objectProto = Object.prototype,
        getClass = objectProto.toString,
        isProperty, forEach, undef;

    // Test the `Date#getUTC*` methods. Based on work by @Yaffle.
    var isExtended = new Date(-3509827334573292);
    try {
      // The `getUTCFullYear`, `Month`, and `Date` methods return nonsensical
      // results for certain dates in Opera >= 10.53.
      isExtended = isExtended.getUTCFullYear() == -109252 && isExtended.getUTCMonth() === 0 && isExtended.getUTCDate() === 1 &&
        // Safari < 2.0.2 stores the internal millisecond time value correctly,
        // but clips the values returned by the date methods to the range of
        // signed 32-bit integers ([-2 ** 31, 2 ** 31 - 1]).
        isExtended.getUTCHours() == 10 && isExtended.getUTCMinutes() == 37 && isExtended.getUTCSeconds() == 6 && isExtended.getUTCMilliseconds() == 708;
    } catch (exception) {}

    // Internal: Determines whether the native `JSON.stringify` and `parse`
    // implementations are spec-compliant. Based on work by Ken Snyder.
    function has(name) {
      if (has[name] !== undef) {
        // Return cached feature test result.
        return has[name];
      }
      var isSupported;
      if (name == "bug-string-char-index") {
        // IE <= 7 doesn't support accessing string characters using square
        // bracket notation. IE 8 only supports this for primitives.
        isSupported = "a"[0] != "a";
      } else if (name == "json") {
        // Indicates whether both `JSON.stringify` and `JSON.parse` are
        // supported.
        isSupported = has("json-stringify") && has("json-parse");
      } else {
        var value, serialized = '{"a":[1,true,false,null,"\\u0000\\b\\n\\f\\r\\t"]}';
        // Test `JSON.stringify`.
        if (name == "json-stringify") {
          var stringify = exports.stringify, stringifySupported = typeof stringify == "function" && isExtended;
          if (stringifySupported) {
            // A test function object with a custom `toJSON` method.
            (value = function () {
              return 1;
            }).toJSON = value;
            try {
              stringifySupported =
                // Firefox 3.1b1 and b2 serialize string, number, and boolean
                // primitives as object literals.
                stringify(0) === "0" &&
                // FF 3.1b1, b2, and JSON 2 serialize wrapped primitives as object
                // literals.
                stringify(new Number()) === "0" &&
                stringify(new String()) == '""' &&
                // FF 3.1b1, 2 throw an error if the value is `null`, `undefined`, or
                // does not define a canonical JSON representation (this applies to
                // objects with `toJSON` properties as well, *unless* they are nested
                // within an object or array).
                stringify(getClass) === undef &&
                // IE 8 serializes `undefined` as `"undefined"`. Safari <= 5.1.7 and
                // FF 3.1b3 pass this test.
                stringify(undef) === undef &&
                // Safari <= 5.1.7 and FF 3.1b3 throw `Error`s and `TypeError`s,
                // respectively, if the value is omitted entirely.
                stringify() === undef &&
                // FF 3.1b1, 2 throw an error if the given value is not a number,
                // string, array, object, Boolean, or `null` literal. This applies to
                // objects with custom `toJSON` methods as well, unless they are nested
                // inside object or array literals. YUI 3.0.0b1 ignores custom `toJSON`
                // methods entirely.
                stringify(value) === "1" &&
                stringify([value]) == "[1]" &&
                // Prototype <= 1.6.1 serializes `[undefined]` as `"[]"` instead of
                // `"[null]"`.
                stringify([undef]) == "[null]" &&
                // YUI 3.0.0b1 fails to serialize `null` literals.
                stringify(null) == "null" &&
                // FF 3.1b1, 2 halts serialization if an array contains a function:
                // `[1, true, getClass, 1]` serializes as "[1,true,],". FF 3.1b3
                // elides non-JSON values from objects and arrays, unless they
                // define custom `toJSON` methods.
                stringify([undef, getClass, null]) == "[null,null,null]" &&
                // Simple serialization test. FF 3.1b1 uses Unicode escape sequences
                // where character escape codes are expected (e.g., `\b` => `\u0008`).
                stringify({ "a": [value, true, false, null, "\x00\b\n\f\r\t"] }) == serialized &&
                // FF 3.1b1 and b2 ignore the `filter` and `width` arguments.
                stringify(null, value) === "1" &&
                stringify([1, 2], null, 1) == "[\n 1,\n 2\n]" &&
                // JSON 2, Prototype <= 1.7, and older WebKit builds incorrectly
                // serialize extended years.
                stringify(new Date(-8.64e15)) == '"-271821-04-20T00:00:00.000Z"' &&
                // The milliseconds are optional in ES 5, but required in 5.1.
                stringify(new Date(8.64e15)) == '"+275760-09-13T00:00:00.000Z"' &&
                // Firefox <= 11.0 incorrectly serializes years prior to 0 as negative
                // four-digit years instead of six-digit years. Credits: @Yaffle.
                stringify(new Date(-621987552e5)) == '"-000001-01-01T00:00:00.000Z"' &&
                // Safari <= 5.1.5 and Opera >= 10.53 incorrectly serialize millisecond
                // values less than 1000. Credits: @Yaffle.
                stringify(new Date(-1)) == '"1969-12-31T23:59:59.999Z"';
            } catch (exception) {
              stringifySupported = false;
            }
          }
          isSupported = stringifySupported;
        }
        // Test `JSON.parse`.
        if (name == "json-parse") {
          var parse = exports.parse;
          if (typeof parse == "function") {
            try {
              // FF 3.1b1, b2 will throw an exception if a bare literal is provided.
              // Conforming implementations should also coerce the initial argument to
              // a string prior to parsing.
              if (parse("0") === 0 && !parse(false)) {
                // Simple parsing test.
                value = parse(serialized);
                var parseSupported = value["a"].length == 5 && value["a"][0] === 1;
                if (parseSupported) {
                  try {
                    // Safari <= 5.1.2 and FF 3.1b1 allow unescaped tabs in strings.
                    parseSupported = !parse('"\t"');
                  } catch (exception) {}
                  if (parseSupported) {
                    try {
                      // FF 4.0 and 4.0.1 allow leading `+` signs and leading
                      // decimal points. FF 4.0, 4.0.1, and IE 9-10 also allow
                      // certain octal literals.
                      parseSupported = parse("01") !== 1;
                    } catch (exception) {}
                  }
                  if (parseSupported) {
                    try {
                      // FF 4.0, 4.0.1, and Rhino 1.7R3-R4 allow trailing decimal
                      // points. These environments, along with FF 3.1b1 and 2,
                      // also allow trailing commas in JSON objects and arrays.
                      parseSupported = parse("1.") !== 1;
                    } catch (exception) {}
                  }
                }
              }
            } catch (exception) {
              parseSupported = false;
            }
          }
          isSupported = parseSupported;
        }
      }
      return has[name] = !!isSupported;
    }

    if (!has("json")) {
      // Common `[[Class]]` name aliases.
      var functionClass = "[object Function]",
          dateClass = "[object Date]",
          numberClass = "[object Number]",
          stringClass = "[object String]",
          arrayClass = "[object Array]",
          booleanClass = "[object Boolean]";

      // Detect incomplete support for accessing string characters by index.
      var charIndexBuggy = has("bug-string-char-index");

      // Define additional utility methods if the `Date` methods are buggy.
      if (!isExtended) {
        var floor = Math.floor;
        // A mapping between the months of the year and the number of days between
        // January 1st and the first of the respective month.
        var Months = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
        // Internal: Calculates the number of days between the Unix epoch and the
        // first day of the given month.
        var getDay = function (year, month) {
          return Months[month] + 365 * (year - 1970) + floor((year - 1969 + (month = +(month > 1))) / 4) - floor((year - 1901 + month) / 100) + floor((year - 1601 + month) / 400);
        };
      }

      // Internal: Determines if a property is a direct property of the given
      // object. Delegates to the native `Object#hasOwnProperty` method.
      if (!(isProperty = objectProto.hasOwnProperty)) {
        isProperty = function (property) {
          var members = {}, constructor;
          if ((members.__proto__ = null, members.__proto__ = {
            // The *proto* property cannot be set multiple times in recent
            // versions of Firefox and SeaMonkey.
            "toString": 1
          }, members).toString != getClass) {
            // Safari <= 2.0.3 doesn't implement `Object#hasOwnProperty`, but
            // supports the mutable *proto* property.
            isProperty = function (property) {
              // Capture and break the objectgs prototype chain (see section 8.6.2
              // of the ES 5.1 spec). The parenthesized expression prevents an
              // unsafe transformation by the Closure Compiler.
              var original = this.__proto__, result = property in (this.__proto__ = null, this);
              // Restore the original prototype chain.
              this.__proto__ = original;
              return result;
            };
          } else {
            // Capture a reference to the top-level `Object` constructor.
            constructor = members.constructor;
            // Use the `constructor` property to simulate `Object#hasOwnProperty` in
            // other environments.
            isProperty = function (property) {
              var parent = (this.constructor || constructor).prototype;
              return property in this && !(property in parent && this[property] === parent[property]);
            };
          }
          members = null;
          return isProperty.call(this, property);
        };
      }

      // Internal: A set of primitive types used by `isHostType`.
      var PrimitiveTypes = {
        "boolean": 1,
        "number": 1,
        "string": 1,
        "undefined": 1
      };

      // Internal: Determines if the given object `property` value is a
      // non-primitive.
      var isHostType = function (object, property) {
        var type = typeof object[property];
        return type == "object" ? !!object[property] : !PrimitiveTypes[type];
      };

      // Internal: Normalizes the `for...in` iteration algorithm across
      // environments. Each enumerated key is yielded to a `callback` function.
      forEach = function (object, callback) {
        var size = 0, Properties, members, property;

        // Tests for bugs in the current environment's `for...in` algorithm. The
        // `valueOf` property inherits the non-enumerable flag from
        // `Object.prototype` in older versions of IE, Netscape, and Mozilla.
        (Properties = function () {
          this.valueOf = 0;
        }).prototype.valueOf = 0;

        // Iterate over a new instance of the `Properties` class.
        members = new Properties();
        for (property in members) {
          // Ignore all properties inherited from `Object.prototype`.
          if (isProperty.call(members, property)) {
            size++;
          }
        }
        Properties = members = null;

        // Normalize the iteration algorithm.
        if (!size) {
          // A list of non-enumerable properties inherited from `Object.prototype`.
          members = ["valueOf", "toString", "toLocaleString", "propertyIsEnumerable", "isPrototypeOf", "hasOwnProperty", "constructor"];
          // IE <= 8, Mozilla 1.0, and Netscape 6.2 ignore shadowed non-enumerable
          // properties.
          forEach = function (object, callback) {
            var isFunction = getClass.call(object) == functionClass, property, length;
            var hasProperty = !isFunction && typeof object.constructor != "function" && isHostType(object, "hasOwnProperty") ? object.hasOwnProperty : isProperty;
            for (property in object) {
              // Gecko <= 1.0 enumerates the `prototype` property of functions under
              // certain conditions; IE does not.
              if (!(isFunction && property == "prototype") && hasProperty.call(object, property)) {
                callback(property);
              }
            }
            // Manually invoke the callback for each non-enumerable property.
            for (length = members.length; property = members[--length]; hasProperty.call(object, property) && callback(property));
          };
        } else if (size == 2) {
          // Safari <= 2.0.4 enumerates shadowed properties twice.
          forEach = function (object, callback) {
            // Create a set of iterated properties.
            var members = {}, isFunction = getClass.call(object) == functionClass, property;
            for (property in object) {
              // Store each property name to prevent double enumeration. The
              // `prototype` property of functions is not enumerated due to cross-
              // environment inconsistencies.
              if (!(isFunction && property == "prototype") && !isProperty.call(members, property) && (members[property] = 1) && isProperty.call(object, property)) {
                callback(property);
              }
            }
          };
        } else {
          // No bugs detected; use the standard `for...in` algorithm.
          forEach = function (object, callback) {
            var isFunction = getClass.call(object) == functionClass, property, isConstructor;
            for (property in object) {
              if (!(isFunction && property == "prototype") && isProperty.call(object, property) && !(isConstructor = property === "constructor")) {
                callback(property);
              }
            }
            // Manually invoke the callback for the `constructor` property due to
            // cross-environment inconsistencies.
            if (isConstructor || isProperty.call(object, (property = "constructor"))) {
              callback(property);
            }
          };
        }
        return forEach(object, callback);
      };

      // Public: Serializes a JavaScript `value` as a JSON string. The optional
      // `filter` argument may specify either a function that alters how object and
      // array members are serialized, or an array of strings and numbers that
      // indicates which properties should be serialized. The optional `width`
      // argument may be either a string or number that specifies the indentation
      // level of the output.
      if (!has("json-stringify")) {
        // Internal: A map of control characters and their escaped equivalents.
        var Escapes = {
          92: "\\\\",
          34: '\\"',
          8: "\\b",
          12: "\\f",
          10: "\\n",
          13: "\\r",
          9: "\\t"
        };

        // Internal: Converts `value` into a zero-padded string such that its
        // length is at least equal to `width`. The `width` must be <= 6.
        var leadingZeroes = "000000";
        var toPaddedString = function (width, value) {
          // The `|| 0` expression is necessary to work around a bug in
          // Opera <= 7.54u2 where `0 == -0`, but `String(-0) !== "0"`.
          return (leadingZeroes + (value || 0)).slice(-width);
        };

        // Internal: Double-quotes a string `value`, replacing all ASCII control
        // characters (characters with code unit values between 0 and 31) with
        // their escaped equivalents. This is an implementation of the
        // `Quote(value)` operation defined in ES 5.1 section 15.12.3.
        var unicodePrefix = "\\u00";
        var quote = function (value) {
          var result = '"', index = 0, length = value.length, useCharIndex = !charIndexBuggy || length > 10;
          var symbols = useCharIndex && (charIndexBuggy ? value.split("") : value);
          for (; index < length; index++) {
            var charCode = value.charCodeAt(index);
            // If the character is a control character, append its Unicode or
            // shorthand escape sequence; otherwise, append the character as-is.
            switch (charCode) {
              case 8: case 9: case 10: case 12: case 13: case 34: case 92:
                result += Escapes[charCode];
                break;
              default:
                if (charCode < 32) {
                  result += unicodePrefix + toPaddedString(2, charCode.toString(16));
                  break;
                }
                result += useCharIndex ? symbols[index] : value.charAt(index);
            }
          }
          return result + '"';
        };

        // Internal: Recursively serializes an object. Implements the
        // `Str(key, holder)`, `JO(value)`, and `JA(value)` operations.
        var serialize = function (property, object, callback, properties, whitespace, indentation, stack) {
          var value, className, year, month, date, time, hours, minutes, seconds, milliseconds, results, element, index, length, prefix, result;
          try {
            // Necessary for host object support.
            value = object[property];
          } catch (exception) {}
          if (typeof value == "object" && value) {
            className = getClass.call(value);
            if (className == dateClass && !isProperty.call(value, "toJSON")) {
              if (value > -1 / 0 && value < 1 / 0) {
                // Dates are serialized according to the `Date#toJSON` method
                // specified in ES 5.1 section 15.9.5.44. See section 15.9.1.15
                // for the ISO 8601 date time string format.
                if (getDay) {
                  // Manually compute the year, month, date, hours, minutes,
                  // seconds, and milliseconds if the `getUTC*` methods are
                  // buggy. Adapted from @Yaffle's `date-shim` project.
                  date = floor(value / 864e5);
                  for (year = floor(date / 365.2425) + 1970 - 1; getDay(year + 1, 0) <= date; year++);
                  for (month = floor((date - getDay(year, 0)) / 30.42); getDay(year, month + 1) <= date; month++);
                  date = 1 + date - getDay(year, month);
                  // The `time` value specifies the time within the day (see ES
                  // 5.1 section 15.9.1.2). The formula `(A % B + B) % B` is used
                  // to compute `A modulo B`, as the `%` operator does not
                  // correspond to the `modulo` operation for negative numbers.
                  time = (value % 864e5 + 864e5) % 864e5;
                  // The hours, minutes, seconds, and milliseconds are obtained by
                  // decomposing the time within the day. See section 15.9.1.10.
                  hours = floor(time / 36e5) % 24;
                  minutes = floor(time / 6e4) % 60;
                  seconds = floor(time / 1e3) % 60;
                  milliseconds = time % 1e3;
                } else {
                  year = value.getUTCFullYear();
                  month = value.getUTCMonth();
                  date = value.getUTCDate();
                  hours = value.getUTCHours();
                  minutes = value.getUTCMinutes();
                  seconds = value.getUTCSeconds();
                  milliseconds = value.getUTCMilliseconds();
                }
                // Serialize extended years correctly.
                value = (year <= 0 || year >= 1e4 ? (year < 0 ? "-" : "+") + toPaddedString(6, year < 0 ? -year : year) : toPaddedString(4, year)) +
                  "-" + toPaddedString(2, month + 1) + "-" + toPaddedString(2, date) +
                  // Months, dates, hours, minutes, and seconds should have two
                  // digits; milliseconds should have three.
                  "T" + toPaddedString(2, hours) + ":" + toPaddedString(2, minutes) + ":" + toPaddedString(2, seconds) +
                  // Milliseconds are optional in ES 5.0, but required in 5.1.
                  "." + toPaddedString(3, milliseconds) + "Z";
              } else {
                value = null;
              }
            } else if (typeof value.toJSON == "function" && ((className != numberClass && className != stringClass && className != arrayClass) || isProperty.call(value, "toJSON"))) {
              // Prototype <= 1.6.1 adds non-standard `toJSON` methods to the
              // `Number`, `String`, `Date`, and `Array` prototypes. JSON 3
              // ignores all `toJSON` methods on these objects unless they are
              // defined directly on an instance.
              value = value.toJSON(property);
            }
          }
          if (callback) {
            // If a replacement function was provided, call it to obtain the value
            // for serialization.
            value = callback.call(object, property, value);
          }
          if (value === null) {
            return "null";
          }
          className = getClass.call(value);
          if (className == booleanClass) {
            // Booleans are represented literally.
            return "" + value;
          } else if (className == numberClass) {
            // JSON numbers must be finite. `Infinity` and `NaN` are serialized as
            // `"null"`.
            return value > -1 / 0 && value < 1 / 0 ? "" + value : "null";
          } else if (className == stringClass) {
            // Strings are double-quoted and escaped.
            return quote("" + value);
          }
          // Recursively serialize objects and arrays.
          if (typeof value == "object") {
            // Check for cyclic structures. This is a linear search; performance
            // is inversely proportional to the number of unique nested objects.
            for (length = stack.length; length--;) {
              if (stack[length] === value) {
                // Cyclic structures cannot be serialized by `JSON.stringify`.
                throw TypeError();
              }
            }
            // Add the object to the stack of traversed objects.
            stack.push(value);
            results = [];
            // Save the current indentation level and indent one additional level.
            prefix = indentation;
            indentation += whitespace;
            if (className == arrayClass) {
              // Recursively serialize array elements.
              for (index = 0, length = value.length; index < length; index++) {
                element = serialize(index, value, callback, properties, whitespace, indentation, stack);
                results.push(element === undef ? "null" : element);
              }
              result = results.length ? (whitespace ? "[\n" + indentation + results.join(",\n" + indentation) + "\n" + prefix + "]" : ("[" + results.join(",") + "]")) : "[]";
            } else {
              // Recursively serialize object members. Members are selected from
              // either a user-specified list of property names, or the object
              // itself.
              forEach(properties || value, function (property) {
                var element = serialize(property, value, callback, properties, whitespace, indentation, stack);
                if (element !== undef) {
                  // According to ES 5.1 section 15.12.3: "If `gap` {whitespace}
                  // is not the empty string, let `member` {quote(property) + ":"}
                  // be the concatenation of `member` and the `space` character."
                  // The "`space` character" refers to the literal space
                  // character, not the `space` {width} argument provided to
                  // `JSON.stringify`.
                  results.push(quote(property) + ":" + (whitespace ? " " : "") + element);
                }
              });
              result = results.length ? (whitespace ? "{\n" + indentation + results.join(",\n" + indentation) + "\n" + prefix + "}" : ("{" + results.join(",") + "}")) : "{}";
            }
            // Remove the object from the traversed object stack.
            stack.pop();
            return result;
          }
        };

        // Public: `JSON.stringify`. See ES 5.1 section 15.12.3.
        exports.stringify = function (source, filter, width) {
          var whitespace, callback, properties, className;
          if (typeof filter == "function" || typeof filter == "object" && filter) {
            if ((className = getClass.call(filter)) == functionClass) {
              callback = filter;
            } else if (className == arrayClass) {
              // Convert the property names array into a makeshift set.
              properties = {};
              for (var index = 0, length = filter.length, value; index < length; value = filter[index++], ((className = getClass.call(value)), className == stringClass || className == numberClass) && (properties[value] = 1));
            }
          }
          if (width) {
            if ((className = getClass.call(width)) == numberClass) {
              // Convert the `width` to an integer and create a string containing
              // `width` number of space characters.
              if ((width -= width % 1) > 0) {
                for (whitespace = "", width > 10 && (width = 10); whitespace.length < width; whitespace += " ");
              }
            } else if (className == stringClass) {
              whitespace = width.length <= 10 ? width : width.slice(0, 10);
            }
          }
          // Opera <= 7.54u2 discards the values associated with empty string keys
          // (`""`) only if they are used directly within an object member list
          // (e.g., `!("" in { "": 1})`).
          return serialize("", (value = {}, value[""] = source, value), callback, properties, whitespace, "", []);
        };
      }

      // Public: Parses a JSON source string.
      if (!has("json-parse")) {
        var fromCharCode = String.fromCharCode;

        // Internal: A map of escaped control characters and their unescaped
        // equivalents.
        var Unescapes = {
          92: "\\",
          34: '"',
          47: "/",
          98: "\b",
          116: "\t",
          110: "\n",
          102: "\f",
          114: "\r"
        };

        // Internal: Stores the parser state.
        var Index, Source;

        // Internal: Resets the parser state and throws a `SyntaxError`.
        var abort = function () {
          Index = Source = null;
          throw SyntaxError();
        };

        // Internal: Returns the next token, or `"$"` if the parser has reached
        // the end of the source string. A token may be a string, number, `null`
        // literal, or Boolean literal.
        var lex = function () {
          var source = Source, length = source.length, value, begin, position, isSigned, charCode;
          while (Index < length) {
            charCode = source.charCodeAt(Index);
            switch (charCode) {
              case 9: case 10: case 13: case 32:
                // Skip whitespace tokens, including tabs, carriage returns, line
                // feeds, and space characters.
                Index++;
                break;
              case 123: case 125: case 91: case 93: case 58: case 44:
                // Parse a punctuator token (`{`, `}`, `[`, `]`, `:`, or `,`) at
                // the current position.
                value = charIndexBuggy ? source.charAt(Index) : source[Index];
                Index++;
                return value;
              case 34:
                // `"` delimits a JSON string; advance to the next character and
                // begin parsing the string. String tokens are prefixed with the
                // sentinel `@` character to distinguish them from punctuators and
                // end-of-string tokens.
                for (value = "@", Index++; Index < length;) {
                  charCode = source.charCodeAt(Index);
                  if (charCode < 32) {
                    // Unescaped ASCII control characters (those with a code unit
                    // less than the space character) are not permitted.
                    abort();
                  } else if (charCode == 92) {
                    // A reverse solidus (`\`) marks the beginning of an escaped
                    // control character (including `"`, `\`, and `/`) or Unicode
                    // escape sequence.
                    charCode = source.charCodeAt(++Index);
                    switch (charCode) {
                      case 92: case 34: case 47: case 98: case 116: case 110: case 102: case 114:
                        // Revive escaped control characters.
                        value += Unescapes[charCode];
                        Index++;
                        break;
                      case 117:
                        // `\u` marks the beginning of a Unicode escape sequence.
                        // Advance to the first character and validate the
                        // four-digit code point.
                        begin = ++Index;
                        for (position = Index + 4; Index < position; Index++) {
                          charCode = source.charCodeAt(Index);
                          // A valid sequence comprises four hexdigits (case-
                          // insensitive) that form a single hexadecimal value.
                          if (!(charCode >= 48 && charCode <= 57 || charCode >= 97 && charCode <= 102 || charCode >= 65 && charCode <= 70)) {
                            // Invalid Unicode escape sequence.
                            abort();
                          }
                        }
                        // Revive the escaped character.
                        value += fromCharCode("0x" + source.slice(begin, Index));
                        break;
                      default:
                        // Invalid escape sequence.
                        abort();
                    }
                  } else {
                    if (charCode == 34) {
                      // An unescaped double-quote character marks the end of the
                      // string.
                      break;
                    }
                    charCode = source.charCodeAt(Index);
                    begin = Index;
                    // Optimize for the common case where a string is valid.
                    while (charCode >= 32 && charCode != 92 && charCode != 34) {
                      charCode = source.charCodeAt(++Index);
                    }
                    // Append the string as-is.
                    value += source.slice(begin, Index);
                  }
                }
                if (source.charCodeAt(Index) == 34) {
                  // Advance to the next character and return the revived string.
                  Index++;
                  return value;
                }
                // Unterminated string.
                abort();
              default:
                // Parse numbers and literals.
                begin = Index;
                // Advance past the negative sign, if one is specified.
                if (charCode == 45) {
                  isSigned = true;
                  charCode = source.charCodeAt(++Index);
                }
                // Parse an integer or floating-point value.
                if (charCode >= 48 && charCode <= 57) {
                  // Leading zeroes are interpreted as octal literals.
                  if (charCode == 48 && ((charCode = source.charCodeAt(Index + 1)), charCode >= 48 && charCode <= 57)) {
                    // Illegal octal literal.
                    abort();
                  }
                  isSigned = false;
                  // Parse the integer component.
                  for (; Index < length && ((charCode = source.charCodeAt(Index)), charCode >= 48 && charCode <= 57); Index++);
                  // Floats cannot contain a leading decimal point; however, this
                  // case is already accounted for by the parser.
                  if (source.charCodeAt(Index) == 46) {
                    position = ++Index;
                    // Parse the decimal component.
                    for (; position < length && ((charCode = source.charCodeAt(position)), charCode >= 48 && charCode <= 57); position++);
                    if (position == Index) {
                      // Illegal trailing decimal.
                      abort();
                    }
                    Index = position;
                  }
                  // Parse exponents. The `e` denoting the exponent is
                  // case-insensitive.
                  charCode = source.charCodeAt(Index);
                  if (charCode == 101 || charCode == 69) {
                    charCode = source.charCodeAt(++Index);
                    // Skip past the sign following the exponent, if one is
                    // specified.
                    if (charCode == 43 || charCode == 45) {
                      Index++;
                    }
                    // Parse the exponential component.
                    for (position = Index; position < length && ((charCode = source.charCodeAt(position)), charCode >= 48 && charCode <= 57); position++);
                    if (position == Index) {
                      // Illegal empty exponent.
                      abort();
                    }
                    Index = position;
                  }
                  // Coerce the parsed value to a JavaScript number.
                  return +source.slice(begin, Index);
                }
                // A negative sign may only precede numbers.
                if (isSigned) {
                  abort();
                }
                // `true`, `false`, and `null` literals.
                if (source.slice(Index, Index + 4) == "true") {
                  Index += 4;
                  return true;
                } else if (source.slice(Index, Index + 5) == "false") {
                  Index += 5;
                  return false;
                } else if (source.slice(Index, Index + 4) == "null") {
                  Index += 4;
                  return null;
                }
                // Unrecognized token.
                abort();
            }
          }
          // Return the sentinel `$` character if the parser has reached the end
          // of the source string.
          return "$";
        };

        // Internal: Parses a JSON `value` token.
        var get = function (value) {
          var results, hasMembers;
          if (value == "$") {
            // Unexpected end of input.
            abort();
          }
          if (typeof value == "string") {
            if ((charIndexBuggy ? value.charAt(0) : value[0]) == "@") {
              // Remove the sentinel `@` character.
              return value.slice(1);
            }
            // Parse object and array literals.
            if (value == "[") {
              // Parses a JSON array, returning a new JavaScript array.
              results = [];
              for (;; hasMembers || (hasMembers = true)) {
                value = lex();
                // A closing square bracket marks the end of the array literal.
                if (value == "]") {
                  break;
                }
                // If the array literal contains elements, the current token
                // should be a comma separating the previous element from the
                // next.
                if (hasMembers) {
                  if (value == ",") {
                    value = lex();
                    if (value == "]") {
                      // Unexpected trailing `,` in array literal.
                      abort();
                    }
                  } else {
                    // A `,` must separate each array element.
                    abort();
                  }
                }
                // Elisions and leading commas are not permitted.
                if (value == ",") {
                  abort();
                }
                results.push(get(value));
              }
              return results;
            } else if (value == "{") {
              // Parses a JSON object, returning a new JavaScript object.
              results = {};
              for (;; hasMembers || (hasMembers = true)) {
                value = lex();
                // A closing curly brace marks the end of the object literal.
                if (value == "}") {
                  break;
                }
                // If the object literal contains members, the current token
                // should be a comma separator.
                if (hasMembers) {
                  if (value == ",") {
                    value = lex();
                    if (value == "}") {
                      // Unexpected trailing `,` in object literal.
                      abort();
                    }
                  } else {
                    // A `,` must separate each object member.
                    abort();
                  }
                }
                // Leading commas are not permitted, object property names must be
                // double-quoted strings, and a `:` must separate each property
                // name and value.
                if (value == "," || typeof value != "string" || (charIndexBuggy ? value.charAt(0) : value[0]) != "@" || lex() != ":") {
                  abort();
                }
                results[value.slice(1)] = get(lex());
              }
              return results;
            }
            // Unexpected token encountered.
            abort();
          }
          return value;
        };

        // Internal: Updates a traversed object member.
        var update = function (source, property, callback) {
          var element = walk(source, property, callback);
          if (element === undef) {
            delete source[property];
          } else {
            source[property] = element;
          }
        };

        // Internal: Recursively traverses a parsed JSON object, invoking the
        // `callback` function for each value. This is an implementation of the
        // `Walk(holder, name)` operation defined in ES 5.1 section 15.12.2.
        var walk = function (source, property, callback) {
          var value = source[property], length;
          if (typeof value == "object" && value) {
            // `forEach` can't be used to traverse an array in Opera <= 8.54
            // because its `Object#hasOwnProperty` implementation returns `false`
            // for array indices (e.g., `![1, 2, 3].hasOwnProperty("0")`).
            if (getClass.call(value) == arrayClass) {
              for (length = value.length; length--;) {
                update(value, length, callback);
              }
            } else {
              forEach(value, function (property) {
                update(value, property, callback);
              });
            }
          }
          return callback.call(source, property, value);
        };

        // Public: `JSON.parse`. See ES 5.1 section 15.12.2.
        exports.parse = function (source, callback) {
          var result, value;
          Index = 0;
          Source = "" + source;
          result = get(lex());
          // If a JSON string contains multiple tokens, it is invalid.
          if (lex() != "$") {
            abort();
          }
          // Reset the parser state.
          Index = Source = null;
          return callback && getClass.call(callback) == functionClass ? walk((value = {}, value[""] = result, value), "", callback) : result;
        };
      }
    }

    exports["runInContext"] = runInContext;
    return exports;
  }

  if (typeof exports == "object" && exports && !exports.nodeType && !isLoader) {
    // Export for CommonJS environments.
    runInContext(root, exports);
  } else {
    // Export for web browsers and JavaScript engines.
    var nativeJSON = root.JSON;
    var JSON3 = runInContext(root, (root["JSON3"] = {
      // Public: Restores the original value of the global `JSON` object and
      // returns a reference to the `JSON3` object.
      "noConflict": function () {
        root.JSON = nativeJSON;
        return JSON3;
      }
    }));

    root.JSON = {
      "parse": JSON3.parse,
      "stringify": JSON3.stringify
    };
  }

  // Export for asynchronous module loaders.
  if (isLoader) {
    define(function () {
      return JSON3;
    });
  }
}(this));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],33:[function(require,module,exports){
"use strict";

var hasOwn = Object.prototype.hasOwnProperty;
var toString = Object.prototype.toString;

var isFunction = function (fn) {
	return (typeof fn === 'function' && !(fn instanceof RegExp)) || toString.call(fn) === '[object Function]';
};

module.exports = function forEach(obj, fn) {
	if (!isFunction(fn)) {
		throw new TypeError('iterator must be a function');
	}
	var i, k,
		isString = typeof obj === 'string',
		l = obj.length,
		context = arguments.length > 2 ? arguments[2] : null;
	if (l === +l) {
		for (i = 0; i < l; i++) {
			if (context === null) {
				fn(isString ? obj.charAt(i) : obj[i], i, obj);
			} else {
				fn.call(context, isString ? obj.charAt(i) : obj[i], i, obj);
			}
		}
	} else {
		for (k in obj) {
			if (hasOwn.call(obj, k)) {
				if (context === null) {
					fn(obj[k], k, obj);
				} else {
					fn.call(context, obj[k], k, obj);
				}
			}
		}
	}
};


},{}],34:[function(require,module,exports){
"use strict";

// modified from https://github.com/es-shims/es5-shim
var has = Object.prototype.hasOwnProperty,
	toString = Object.prototype.toString,
	forEach = require('./foreach'),
	isArgs = require('./isArguments'),
	hasDontEnumBug = !({'toString': null}).propertyIsEnumerable('toString'),
	hasProtoEnumBug = (function () {}).propertyIsEnumerable('prototype'),
	dontEnums = [
		"toString",
		"toLocaleString",
		"valueOf",
		"hasOwnProperty",
		"isPrototypeOf",
		"propertyIsEnumerable",
		"constructor"
	];

var keysShim = function keys(object) {
	var isObject = object !== null && typeof object === 'object',
		isFunction = toString.call(object) === '[object Function]',
		isArguments = isArgs(object),
		theKeys = [];

	if (!isObject && !isFunction && !isArguments) {
		throw new TypeError("Object.keys called on a non-object");
	}

	if (isArguments) {
		forEach(object, function (value, index) {
			theKeys.push(index);
		});
	} else {
		var name,
			skipProto = hasProtoEnumBug && isFunction;

		for (name in object) {
			if (!(skipProto && name === 'prototype') && has.call(object, name)) {
				theKeys.push(name);
			}
		}
	}

	if (hasDontEnumBug) {
		var ctor = object.constructor,
			skipConstructor = ctor && ctor.prototype === object;

		forEach(dontEnums, function (dontEnum) {
			if (!(skipConstructor && dontEnum === 'constructor') && has.call(object, dontEnum)) {
				theKeys.push(dontEnum);
			}
		});
	}
	return theKeys;
};

keysShim.shim = function shimObjectKeys() {
	if (!Object.keys) {
		Object.keys = keysShim;
	}
	return Object.keys || keysShim;
};

module.exports = keysShim;


},{"./foreach":33,"./isArguments":35}],35:[function(require,module,exports){
"use strict";

var toString = Object.prototype.toString;

module.exports = function isArguments(value) {
	var str = toString.call(value);
	var isArguments = str === '[object Arguments]';
	if (!isArguments) {
		isArguments = str !== '[object Array]'
			&& value !== null
			&& typeof value === 'object'
			&& typeof value.length === 'number'
			&& value.length >= 0
			&& toString.call(value.callee) === '[object Function]';
	}
	return isArguments;
};


},{}],36:[function(require,module,exports){

/**
 * Module dependencies.
 */

var map = require('array-map');
var indexOf = require('indexof');
var isArray = require('isarray');
var forEach = require('foreach');
var reduce = require('array-reduce');
var getObjectKeys = require('object-keys');
var JSON = require('json3');

/**
 * Make sure `Object.keys` work for `undefined`
 * values that are still there, like `document.all`.
 * http://lists.w3.org/Archives/Public/public-html/2009Jun/0546.html
 *
 * @api private
 */

function objectKeys(val){
  if (Object.keys) return Object.keys(val);
  return getObjectKeys(val);
}

/**
 * Module exports.
 */

module.exports = inspect;

/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 * @license MIT (© Joyent)
 */
/* legacy: obj, showHidden, depth, colors*/

function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    _extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}

// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};

function stylizeNoColor(str, styleType) {
  return str;
}

function isBoolean(arg) {
  return typeof arg === 'boolean';
}

function isUndefined(arg) {
  return arg === void 0;
}

function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}

function isFunction(arg) {
  return typeof arg === 'function';
}

function isString(arg) {
  return typeof arg === 'string';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isNull(arg) {
  return arg === null;
}

function hasOwn(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}

function objectToString(o) {
  return Object.prototype.toString.call(o);
}

function arrayToHash(array) {
  var hash = {};

  forEach(array, function(val, idx) {
    hash[val] = true;
  });

  return hash;
}

function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwn(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  forEach(keys, function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}

function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}

function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = objectKeys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden && Object.getOwnPropertyNames) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (indexOf(keys, 'message') >= 0 || indexOf(keys, 'description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = map(keys, function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}

function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = { value: value[key] };
  if (Object.getOwnPropertyDescriptor) {
    desc = Object.getOwnPropertyDescriptor(value, key) || desc;
  }
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwn(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (indexOf(ctx.seen, desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = map(str.split('\n'), function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + map(str.split('\n'), function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}

function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}

function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = reduce(output, function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}

function _extend(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = objectKeys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
}

},{"array-map":27,"array-reduce":28,"foreach":29,"indexof":30,"isarray":31,"json3":32,"object-keys":34}],37:[function(require,module,exports){
"use strict"

// This is a reporter that mimics Mocha's `dot` reporter

var R = require("../lib/reporter")

function width() {
    return R.windowWidth() * 4 / 3 | 0
}

function printDot(_, color) {
    function emit() {
        return _.write(R.color(color,
            color === "fail" ? R.symbols().DotFail : R.symbols().Dot))
    }

    if (_.state.counter++ % width() === 0) {
        return _.write(R.newline() + "  ").then(emit)
    } else {
        return emit()
    }
}

module.exports = R.on("dot", {
    accepts: ["write", "reset", "colors"],
    create: R.consoleReporter,
    before: R.setColor,
    after: R.unsetColor,
    init: function (state) { state.counter = 0 },

    report: function (_, report) {
        if (report.isEnter || report.isPass) {
            return printDot(_, R.speed(report))
        } else if (report.isHook || report.isFail) {
            _.pushError(report)
            // Print a dot regardless of hook success
            return printDot(_, "fail")
        } else if (report.isSkip) {
            return printDot(_, "skip")
        } else if (report.isEnd) {
            return _.print().then(_.printResults.bind(_))
        } else if (report.isError) {
            if (_.state.counter) {
                return _.print().then(_.printError.bind(_, report))
            } else {
                return _.printError(report)
            }
        } else {
            return undefined
        }
    },
})

},{"../lib/reporter":20}],38:[function(require,module,exports){
"use strict"

// exports.dom = require("./dom")
exports.dot = require("./dot")
exports.spec = require("./spec")
exports.tap = require("./tap")

},{"./dot":37,"./spec":39,"./tap":40}],39:[function(require,module,exports){
"use strict"

// This is a reporter that mimics Mocha's `spec` reporter.

var R = require("../lib/reporter")
var c = R.color

function indent(level) {
    var ret = ""

    while (level--) ret += "  "
    return ret
}

function getName(level, report) {
    return report.path[level - 1].name
}

function printReport(_, report, init) {
    if (_.state.leaving) {
        _.state.leaving = false
        return _.print().then(function () {
            return _.print(indent(_.state.level) + init())
        })
    } else {
        return _.print(indent(_.state.level) + init())
    }
}

module.exports = R.on("spec", {
    accepts: ["write", "reset", "colors"],
    create: R.consoleReporter,
    before: R.setColor,
    after: R.unsetColor,

    init: function (state) {
        state.level = 1
        state.leaving = false
    },

    report: function (_, report) {
        if (report.isStart) {
            return _.print()
        } else if (report.isEnter) {
            var level = _.state.level++
            var last = report.path[level - 1]

            _.state.leaving = false
            if (last.index) {
                return _.print().then(function () {
                    return _.print(indent(level) + last.name)
                })
            } else {
                return _.print(indent(level) + last.name)
            }
        } else if (report.isLeave) {
            _.state.level--
            _.state.leaving = true
            return undefined
        } else if (report.isPass) {
            return printReport(_, report, function () {
                var str =
                    c("checkmark", R.symbols().Pass + " ") +
                    c("pass", getName(_.state.level, report))

                var speed = R.speed(report)

                if (speed !== "fast") {
                    str += c(speed, " (" + report.duration + "ms)")
                }

                return str
            })
        } else if (report.isHook || report.isFail) {
            _.pushError(report)

            // Don't print the description line on cumulative hooks
            if (report.isHook && (report.isBeforeAll || report.isAfterAll)) {
                return undefined
            }

            return printReport(_, report, function () {
                return c("fail",
                    _.errors.length + ") " + getName(_.state.level, report) +
                    R.formatRest(report))
            })
        } else if (report.isSkip) {
            return printReport(_, report, function () {
                return c("skip", "- " + getName(_.state.level, report))
            })
        }

        if (report.isEnd) return _.printResults()
        if (report.isError) return _.printError(report)
        return undefined
    },
})

},{"../lib/reporter":20}],40:[function(require,module,exports){
"use strict"

// This is a basic TAP-generating reporter.

var peach = require("../lib/util").peach
var R = require("../lib/reporter")
var inspect = require("../lib/replaced/inspect")

function shouldBreak(minLength, str) {
    return str.length > R.windowWidth() - minLength || /\r?\n|[:?-]/.test(str)
}

function template(_, report, tmpl, skip) {
    if (!skip) _.state.counter++
    var path = R.joinPath(report).replace(/\$/g, "$$$$")

    return _.print(
        tmpl.replace(/%c/g, _.state.counter)
            .replace(/%p/g, path + R.formatRest(report)))
}

function printLines(_, value, skipFirst) {
    var lines = value.split(/\r?\n/g)

    if (skipFirst) lines.shift()
    return peach(lines, function (line) { return _.print("    " + line) })
}

function printRaw(_, key, str) {
    if (shouldBreak(key.length, str)) {
        return _.print("  " + key + ": |-")
        .then(function () { return printLines(_, str, false) })
    } else {
        return _.print("  " + key + ": " + str)
    }
}

function printValue(_, key, value) {
    return printRaw(_, key, inspect(value))
}

function printLine(p, _, line) {
    return p.then(function () { return _.print(line) })
}

function printError(_, report) {
    var err = report.error

    if (!(err instanceof Error)) {
        return printValue(_, "value", err)
    }

    // Let's *not* depend on the constructor being Thallium's...
    if (err.name !== "AssertionError") {
        return _.print("  stack: |-").then(function () {
            return printLines(_, R.getStack(err), false)
        })
    }

    return printValue(_, "expected", err.expected)
    .then(function () { return printValue(_, "actual", err.actual) })
    .then(function () { return printRaw(_, "message", err.message) })
    .then(function () { return _.print("  stack: |-") })
    .then(function () {
        var message = err.message

        err.message = ""
        return printLines(_, R.getStack(err), true)
        .then(function () { err.message = message })
    })
}

module.exports = R.on("tap", {
    accepts: ["write", "reset"],
    create: R.consoleReporter,
    init: function (state) { state.counter = 0 },

    report: function (_, report) {
        if (report.isStart) {
            return _.print("TAP version 13")
        } else if (report.isEnter) {
            // Print a leading comment, to make some TAP formatters prettier.
            return template(_, report, "# %p", true)
            .then(function () { return template(_, report, "ok %c") })
        } else if (report.isPass) {
            return template(_, report, "ok %c %p")
        } else if (report.isFail || report.isHook) {
            return template(_, report, "not ok %c %p")
            .then(function () { return _.print("  ---") })
            .then(function () { return printError(_, report) })
            .then(function () { return _.print("  ...") })
        } else if (report.isSkip) {
            return template(_, report, "ok %c # skip %p")
        } else if (report.isEnd) {
            var p = _.print("1.." + _.state.counter)
            .then(function () { return _.print("# tests " + _.tests) })

            if (_.pass) p = printLine(p, _, "# pass " + _.pass)
            if (_.fail) p = printLine(p, _, "# fail " + _.fail)
            if (_.skip) p = printLine(p, _, "# skip " + _.skip)
            return printLine(p, _, "# duration " + R.formatTime(_.duration))
        } else if (report.isError) {
            return _.print("Bail out!")
            .then(function () { return _.print("  ---") })
            .then(function () { return printError(_, report) })
            .then(function () { return _.print("  ...") })
        } else {
            return undefined
        }
    },
})

},{"../lib/replaced/inspect":36,"../lib/reporter":20,"../lib/util":25}],"thallium":[function(require,module,exports){
"use strict"

/**
 * This is the entry point for the Browserify bundle. Note that it *also* will
 * run as part of the tests in Node (unbundled), and it theoretically could be
 * run in Node or a runtime limited to only ES5 support (e.g. Rhino, Nashorn, or
 * embedded V8), so do *not* assume browser globals are present.
 */

exports.t = require("../index")
exports.assert = require("../assert")
exports.match = require("../match")
exports.r = require("../r")

var Internal = require("../internal")

exports.root = Internal.root
exports.reports = Internal.reports
exports.hookErrors = Internal.hookErrors
exports.location = Internal.location

// In case the user needs to adjust this (e.g. Nashorn + console output).
var Settings = require("./settings")

exports.settings = {
    windowWidth: {
        get: Settings.windowWidth,
        set: Settings.setWindowWidth,
    },

    newline: {
        get: Settings.newline,
        set: Settings.setNewline,
    },

    symbols: {
        get: Settings.symbols,
        set: Settings.setSymbols,
    },

    defaultOpts: {
        get: Settings.defaultOpts,
        set: Settings.setDefaultOpts,
    },

    colorSupport: {
        get: Settings.Colors.getSupport,
        set: Settings.Colors.setSupport,
    },
}

},{"../assert":1,"../index":2,"../internal":3,"../match":26,"../r":38,"./settings":24}]},{},[])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhc3NlcnQuanMiLCJpbmRleC5qcyIsImludGVybmFsLmpzIiwibGliL2FwaS9ob29rcy5qcyIsImxpYi9hcGkvcmVmbGVjdC5qcyIsImxpYi9hcGkvdGhhbGxpdW0uanMiLCJsaWIvYXNzZXJ0L2VxdWFsLmpzIiwibGliL2Fzc2VydC9oYXMta2V5cy5qcyIsImxpYi9hc3NlcnQvaGFzLmpzIiwibGliL2Fzc2VydC9pbmNsdWRlcy5qcyIsImxpYi9hc3NlcnQvdGhyb3dzLmpzIiwibGliL2Fzc2VydC90eXBlLmpzIiwibGliL2Fzc2VydC91dGlsLmpzIiwibGliL2NvcmUvb25seS5qcyIsImxpYi9jb3JlL3JlcG9ydHMuanMiLCJsaWIvY29yZS90ZXN0cy5qcyIsImxpYi9tZXRob2RzLmpzIiwibGliL3JlcGxhY2VkL2NvbnNvbGUtYnJvd3Nlci5qcyIsImxpYi9yZXBvcnRlci9jb25zb2xlLXJlcG9ydGVyLmpzIiwibGliL3JlcG9ydGVyL2luZGV4LmpzIiwibGliL3JlcG9ydGVyL29uLmpzIiwibGliL3JlcG9ydGVyL3JlcG9ydGVyLmpzIiwibGliL3JlcG9ydGVyL3V0aWwuanMiLCJsaWIvc2V0dGluZ3MuanMiLCJsaWIvdXRpbC5qcyIsIm1hdGNoLmpzIiwibm9kZV9tb2R1bGVzL2FycmF5LW1hcC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9hcnJheS1yZWR1Y2UvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZm9yZWFjaC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9pbmRleG9mL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2lzYXJyYXkvaW5kZXguanMiLCJub2RlX21vZHVsZXMvanNvbjMvbGliL2pzb24zLmpzIiwibm9kZV9tb2R1bGVzL29iamVjdC1rZXlzL2ZvcmVhY2guanMiLCJub2RlX21vZHVsZXMvb2JqZWN0LWtleXMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvb2JqZWN0LWtleXMvaXNBcmd1bWVudHMuanMiLCJub2RlX21vZHVsZXMvdXRpbC1pbnNwZWN0L2luZGV4LmpzIiwici9kb3QuanMiLCJyL2luZGV4LmpzIiwici9zcGVjLmpzIiwici90YXAuanMiLCJsaWIvYnJvd3Nlci1idW5kbGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hXQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDMVFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMxZUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNsREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDaG1CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBOzs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2o0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoYUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcInVzZSBzdHJpY3RcIlxuXG4vKipcbiAqIENvcmUgVERELXN0eWxlIGFzc2VydGlvbnMuIFRoZXNlIGFyZSBkb25lIGJ5IGEgY29tcG9zaXRpb24gb2YgRFNMcywgc2luY2VcbiAqIHRoZXJlIGlzICpzbyogbXVjaCByZXBldGl0aW9uLiBBbHNvLCB0aGlzIGlzIHNwbGl0IGludG8gc2V2ZXJhbCBuYW1lc3BhY2VzIHRvXG4gKiBrZWVwIHRoZSBmaWxlIHNpemUgbWFuYWdlYWJsZS5cbiAqL1xuXG52YXIgVXRpbCA9IHJlcXVpcmUoXCIuL2xpYi9hc3NlcnQvdXRpbFwiKVxudmFyIFR5cGUgPSByZXF1aXJlKFwiLi9saWIvYXNzZXJ0L3R5cGVcIilcbnZhciBFcXVhbCA9IHJlcXVpcmUoXCIuL2xpYi9hc3NlcnQvZXF1YWxcIilcbnZhciBUaHJvd3MgPSByZXF1aXJlKFwiLi9saWIvYXNzZXJ0L3Rocm93c1wiKVxudmFyIEhhcyA9IHJlcXVpcmUoXCIuL2xpYi9hc3NlcnQvaGFzXCIpXG52YXIgSW5jbHVkZXMgPSByZXF1aXJlKFwiLi9saWIvYXNzZXJ0L2luY2x1ZGVzXCIpXG52YXIgSGFzS2V5cyA9IHJlcXVpcmUoXCIuL2xpYi9hc3NlcnQvaGFzLWtleXNcIilcblxuZXhwb3J0cy5Bc3NlcnRpb25FcnJvciA9IFV0aWwuQXNzZXJ0aW9uRXJyb3JcbmV4cG9ydHMuYXNzZXJ0ID0gVXRpbC5hc3NlcnRcbmV4cG9ydHMuZmFpbCA9IFV0aWwuZmFpbFxuZXhwb3J0cy5mb3JtYXQgPSBVdGlsLmZvcm1hdFxuZXhwb3J0cy5lc2NhcGUgPSBVdGlsLmVzY2FwZVxuXG5leHBvcnRzLm9rID0gVHlwZS5va1xuZXhwb3J0cy5ub3RPayA9IFR5cGUubm90T2tcbmV4cG9ydHMuaXNCb29sZWFuID0gVHlwZS5pc0Jvb2xlYW5cbmV4cG9ydHMubm90Qm9vbGVhbiA9IFR5cGUubm90Qm9vbGVhblxuZXhwb3J0cy5pc0Z1bmN0aW9uID0gVHlwZS5pc0Z1bmN0aW9uXG5leHBvcnRzLm5vdEZ1bmN0aW9uID0gVHlwZS5ub3RGdW5jdGlvblxuZXhwb3J0cy5pc051bWJlciA9IFR5cGUuaXNOdW1iZXJcbmV4cG9ydHMubm90TnVtYmVyID0gVHlwZS5ub3ROdW1iZXJcbmV4cG9ydHMuaXNPYmplY3QgPSBUeXBlLmlzT2JqZWN0XG5leHBvcnRzLm5vdE9iamVjdCA9IFR5cGUubm90T2JqZWN0XG5leHBvcnRzLmlzU3RyaW5nID0gVHlwZS5pc1N0cmluZ1xuZXhwb3J0cy5ub3RTdHJpbmcgPSBUeXBlLm5vdFN0cmluZ1xuZXhwb3J0cy5pc1N5bWJvbCA9IFR5cGUuaXNTeW1ib2xcbmV4cG9ydHMubm90U3ltYm9sID0gVHlwZS5ub3RTeW1ib2xcbmV4cG9ydHMuZXhpc3RzID0gVHlwZS5leGlzdHNcbmV4cG9ydHMubm90RXhpc3RzID0gVHlwZS5ub3RFeGlzdHNcbmV4cG9ydHMuaXNBcnJheSA9IFR5cGUuaXNBcnJheVxuZXhwb3J0cy5ub3RBcnJheSA9IFR5cGUubm90QXJyYXlcbmV4cG9ydHMuaXMgPSBUeXBlLmlzXG5leHBvcnRzLm5vdCA9IFR5cGUubm90XG5cbmV4cG9ydHMuZXF1YWwgPSBFcXVhbC5lcXVhbFxuZXhwb3J0cy5ub3RFcXVhbCA9IEVxdWFsLm5vdEVxdWFsXG5leHBvcnRzLmVxdWFsTG9vc2UgPSBFcXVhbC5lcXVhbExvb3NlXG5leHBvcnRzLm5vdEVxdWFsTG9vc2UgPSBFcXVhbC5ub3RFcXVhbExvb3NlXG5leHBvcnRzLmRlZXBFcXVhbCA9IEVxdWFsLmRlZXBFcXVhbFxuZXhwb3J0cy5ub3REZWVwRXF1YWwgPSBFcXVhbC5ub3REZWVwRXF1YWxcbmV4cG9ydHMubWF0Y2ggPSBFcXVhbC5tYXRjaFxuZXhwb3J0cy5ub3RNYXRjaCA9IEVxdWFsLm5vdE1hdGNoXG5leHBvcnRzLmF0TGVhc3QgPSBFcXVhbC5hdExlYXN0XG5leHBvcnRzLmF0TW9zdCA9IEVxdWFsLmF0TW9zdFxuZXhwb3J0cy5hYm92ZSA9IEVxdWFsLmFib3ZlXG5leHBvcnRzLmJlbG93ID0gRXF1YWwuYmVsb3dcbmV4cG9ydHMuYmV0d2VlbiA9IEVxdWFsLmJldHdlZW5cbmV4cG9ydHMuY2xvc2VUbyA9IEVxdWFsLmNsb3NlVG9cbmV4cG9ydHMubm90Q2xvc2VUbyA9IEVxdWFsLm5vdENsb3NlVG9cblxuZXhwb3J0cy50aHJvd3MgPSBUaHJvd3MudGhyb3dzXG5leHBvcnRzLnRocm93c01hdGNoID0gVGhyb3dzLnRocm93c01hdGNoXG5cbmV4cG9ydHMuaGFzT3duID0gSGFzLmhhc093blxuZXhwb3J0cy5ub3RIYXNPd24gPSBIYXMubm90SGFzT3duXG5leHBvcnRzLmhhc093bkxvb3NlID0gSGFzLmhhc093bkxvb3NlXG5leHBvcnRzLm5vdEhhc093bkxvb3NlID0gSGFzLm5vdEhhc093bkxvb3NlXG5leHBvcnRzLmhhc0tleSA9IEhhcy5oYXNLZXlcbmV4cG9ydHMubm90SGFzS2V5ID0gSGFzLm5vdEhhc0tleVxuZXhwb3J0cy5oYXNLZXlMb29zZSA9IEhhcy5oYXNLZXlMb29zZVxuZXhwb3J0cy5ub3RIYXNLZXlMb29zZSA9IEhhcy5ub3RIYXNLZXlMb29zZVxuZXhwb3J0cy5oYXMgPSBIYXMuaGFzXG5leHBvcnRzLm5vdEhhcyA9IEhhcy5ub3RIYXNcbmV4cG9ydHMuaGFzTG9vc2UgPSBIYXMuaGFzTG9vc2VcbmV4cG9ydHMubm90SGFzTG9vc2UgPSBIYXMubm90SGFzTG9vc2VcblxuLyoqXG4gKiBUaGVyZSdzIDIgc2V0cyBvZiAxMiBwZXJtdXRhdGlvbnMgaGVyZSBmb3IgYGluY2x1ZGVzYCBhbmQgYGhhc0tleXNgLCBpbnN0ZWFkXG4gKiBvZiBOIHNldHMgb2YgMiAod2hpY2ggd291bGQgZml0IHRoZSBgZm9vYC9gbm90Rm9vYCBpZGlvbSBiZXR0ZXIpLCBzbyBpdCdzXG4gKiBlYXNpZXIgdG8ganVzdCBtYWtlIGEgY291cGxlIHNlcGFyYXRlIERTTHMgYW5kIHVzZSB0aGF0IHRvIGRlZmluZSBldmVyeXRoaW5nLlxuICpcbiAqIEhlcmUncyB0aGUgdG9wIGxldmVsOlxuICpcbiAqIC0gc2hhbGxvd1xuICogLSBzdHJpY3QgZGVlcFxuICogLSBzdHJ1Y3R1cmFsIGRlZXBcbiAqXG4gKiBBbmQgdGhlIHNlY29uZCBsZXZlbDpcbiAqXG4gKiAtIGluY2x1ZGVzIGFsbC9ub3QgbWlzc2luZyBzb21lXG4gKiAtIGluY2x1ZGVzIHNvbWUvbm90IG1pc3NpbmcgYWxsXG4gKiAtIG5vdCBpbmNsdWRpbmcgYWxsL21pc3Npbmcgc29tZVxuICogLSBub3QgaW5jbHVkaW5nIHNvbWUvbWlzc2luZyBhbGxcbiAqXG4gKiBIZXJlJ3MgYW4gZXhhbXBsZSB1c2luZyB0aGUgbmFtaW5nIHNjaGVtZSBmb3IgYGhhc0tleXMqYFxuICpcbiAqICAgICAgICAgICAgICAgfCAgICAgc2hhbGxvdyAgICAgfCAgICBzdHJpY3QgZGVlcCAgICAgIHwgICBzdHJ1Y3R1cmFsIGRlZXBcbiAqIC0tLS0tLS0tLS0tLS0tfC0tLS0tLS0tLS0tLS0tLS0tfC0tLS0tLS0tLS0tLS0tLS0tLS0tLXwtLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gKiBpbmNsdWRlcyBhbGwgIHwgYGhhc0tleXNgICAgICAgIHwgYGhhc0tleXNEZWVwYCAgICAgICB8IGBoYXNLZXlzTWF0Y2hgXG4gKiBpbmNsdWRlcyBzb21lIHwgYGhhc0tleXNBbnlgICAgIHwgYGhhc0tleXNBbnlEZWVwYCAgICB8IGBoYXNLZXlzQW55TWF0Y2hgXG4gKiBtaXNzaW5nIHNvbWUgIHwgYG5vdEhhc0tleXNBbGxgIHwgYG5vdEhhc0tleXNBbGxEZWVwYCB8IGBub3RIYXNLZXlzQWxsTWF0Y2hgXG4gKiBtaXNzaW5nIGFsbCAgIHwgYG5vdEhhc0tleXNgICAgIHwgYG5vdEhhc0tleXNEZWVwYCAgICB8IGBub3RIYXNLZXlzTWF0Y2hgXG4gKlxuICogTm90ZSB0aGF0IHRoZSBgaGFzS2V5c2Agc2hhbGxvdyBjb21wYXJpc29uIHZhcmlhbnRzIGFyZSBhbHNvIG92ZXJsb2FkZWQgdG9cbiAqIGNvbnN1bWUgZWl0aGVyIGFuIGFycmF5IChpbiB3aGljaCBpdCBzaW1wbHkgY2hlY2tzIGFnYWluc3QgYSBsaXN0IG9mIGtleXMpIG9yXG4gKiBhbiBvYmplY3QgKHdoZXJlIGl0IGRvZXMgYSBmdWxsIGRlZXAgY29tcGFyaXNvbikuXG4gKi9cblxuZXhwb3J0cy5pbmNsdWRlcyA9IEluY2x1ZGVzLmluY2x1ZGVzXG5leHBvcnRzLmluY2x1ZGVzRGVlcCA9IEluY2x1ZGVzLmluY2x1ZGVzRGVlcFxuZXhwb3J0cy5pbmNsdWRlc01hdGNoID0gSW5jbHVkZXMuaW5jbHVkZXNNYXRjaFxuZXhwb3J0cy5pbmNsdWRlc0FueSA9IEluY2x1ZGVzLmluY2x1ZGVzQW55XG5leHBvcnRzLmluY2x1ZGVzQW55RGVlcCA9IEluY2x1ZGVzLmluY2x1ZGVzQW55RGVlcFxuZXhwb3J0cy5pbmNsdWRlc0FueU1hdGNoID0gSW5jbHVkZXMuaW5jbHVkZXNBbnlNYXRjaFxuZXhwb3J0cy5ub3RJbmNsdWRlc0FsbCA9IEluY2x1ZGVzLm5vdEluY2x1ZGVzQWxsXG5leHBvcnRzLm5vdEluY2x1ZGVzQWxsRGVlcCA9IEluY2x1ZGVzLm5vdEluY2x1ZGVzQWxsRGVlcFxuZXhwb3J0cy5ub3RJbmNsdWRlc0FsbE1hdGNoID0gSW5jbHVkZXMubm90SW5jbHVkZXNBbGxNYXRjaFxuZXhwb3J0cy5ub3RJbmNsdWRlcyA9IEluY2x1ZGVzLm5vdEluY2x1ZGVzXG5leHBvcnRzLm5vdEluY2x1ZGVzRGVlcCA9IEluY2x1ZGVzLm5vdEluY2x1ZGVzRGVlcFxuZXhwb3J0cy5ub3RJbmNsdWRlc01hdGNoID0gSW5jbHVkZXMubm90SW5jbHVkZXNNYXRjaFxuXG5leHBvcnRzLmhhc0tleXMgPSBIYXNLZXlzLmhhc0tleXNcbmV4cG9ydHMuaGFzS2V5c0RlZXAgPSBIYXNLZXlzLmhhc0tleXNEZWVwXG5leHBvcnRzLmhhc0tleXNNYXRjaCA9IEhhc0tleXMuaGFzS2V5c01hdGNoXG5leHBvcnRzLmhhc0tleXNBbnkgPSBIYXNLZXlzLmhhc0tleXNBbnlcbmV4cG9ydHMuaGFzS2V5c0FueURlZXAgPSBIYXNLZXlzLmhhc0tleXNBbnlEZWVwXG5leHBvcnRzLmhhc0tleXNBbnlNYXRjaCA9IEhhc0tleXMuaGFzS2V5c0FueU1hdGNoXG5leHBvcnRzLm5vdEhhc0tleXNBbGwgPSBIYXNLZXlzLm5vdEhhc0tleXNBbGxcbmV4cG9ydHMubm90SGFzS2V5c0FsbERlZXAgPSBIYXNLZXlzLm5vdEhhc0tleXNBbGxEZWVwXG5leHBvcnRzLm5vdEhhc0tleXNBbGxNYXRjaCA9IEhhc0tleXMubm90SGFzS2V5c0FsbE1hdGNoXG5leHBvcnRzLm5vdEhhc0tleXMgPSBIYXNLZXlzLm5vdEhhc0tleXNcbmV4cG9ydHMubm90SGFzS2V5c0RlZXAgPSBIYXNLZXlzLm5vdEhhc0tleXNEZWVwXG5leHBvcnRzLm5vdEhhc0tleXNNYXRjaCA9IEhhc0tleXMubm90SGFzS2V5c01hdGNoXG4iLCJcInVzZSBzdHJpY3RcIlxuXG4vKipcbiAqIE1haW4gZW50cnkgcG9pbnQsIGZvciB0aG9zZSB3YW50aW5nIHRvIHVzZSB0aGlzIGZyYW1ld29yayB3aXRoIHRoZSBjb3JlXG4gKiBhc3NlcnRpb25zLlxuICovXG52YXIgVGhhbGxpdW0gPSByZXF1aXJlKFwiLi9saWIvYXBpL3RoYWxsaXVtXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gbmV3IFRoYWxsaXVtKClcbiIsIlwidXNlIHN0cmljdFwiXG5cbnZhciBUaGFsbGl1bSA9IHJlcXVpcmUoXCIuL2xpYi9hcGkvdGhhbGxpdW1cIilcbnZhciBSZXBvcnRzID0gcmVxdWlyZShcIi4vbGliL2NvcmUvcmVwb3J0c1wiKVxudmFyIFR5cGVzID0gUmVwb3J0cy5UeXBlc1xuXG5leHBvcnRzLnJvb3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIG5ldyBUaGFsbGl1bSgpXG59XG5cbmZ1bmN0aW9uIGQoZHVyYXRpb24pIHtcbiAgICBpZiAoZHVyYXRpb24gPT0gbnVsbCkgcmV0dXJuIDEwXG4gICAgaWYgKHR5cGVvZiBkdXJhdGlvbiA9PT0gXCJudW1iZXJcIikgcmV0dXJuIGR1cmF0aW9ufDBcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgYGR1cmF0aW9uYCB0byBiZSBhIG51bWJlciBpZiBpdCBleGlzdHNcIilcbn1cblxuZnVuY3Rpb24gcyhzbG93KSB7XG4gICAgaWYgKHNsb3cgPT0gbnVsbCkgcmV0dXJuIDc1XG4gICAgaWYgKHR5cGVvZiBzbG93ID09PSBcIm51bWJlclwiKSByZXR1cm4gc2xvd3wwXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGBzbG93YCB0byBiZSBhIG51bWJlciBpZiBpdCBleGlzdHNcIilcbn1cblxuZnVuY3Rpb24gcChwYXRoKSB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkocGF0aCkpIHJldHVybiBwYXRoXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGBwYXRoYCB0byBiZSBhbiBhcnJheSBvZiBsb2NhdGlvbnNcIilcbn1cblxuZnVuY3Rpb24gaCh2YWx1ZSkge1xuICAgIGlmICh2YWx1ZSAhPSBudWxsICYmIHR5cGVvZiB2YWx1ZS5fID09PSBcIm51bWJlclwiKSByZXR1cm4gdmFsdWVcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgYHZhbHVlYCB0byBiZSBhIGhvb2sgZXJyb3JcIilcbn1cblxuLyoqXG4gKiBDcmVhdGUgYSBuZXcgcmVwb3J0LCBtYWlubHkgZm9yIHRlc3RpbmcgcmVwb3J0ZXJzLlxuICovXG5leHBvcnRzLnJlcG9ydHMgPSB7XG4gICAgc3RhcnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSZXBvcnRzLlN0YXJ0KClcbiAgICB9LFxuXG4gICAgZW50ZXI6IGZ1bmN0aW9uIChwYXRoLCBkdXJhdGlvbiwgc2xvdykge1xuICAgICAgICByZXR1cm4gbmV3IFJlcG9ydHMuRW50ZXIocChwYXRoKSwgZChkdXJhdGlvbiksIHMoc2xvdykpXG4gICAgfSxcblxuICAgIGxlYXZlOiBmdW5jdGlvbiAocGF0aCkge1xuICAgICAgICByZXR1cm4gbmV3IFJlcG9ydHMuTGVhdmUocChwYXRoKSlcbiAgICB9LFxuXG4gICAgcGFzczogZnVuY3Rpb24gKHBhdGgsIGR1cmF0aW9uLCBzbG93KSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVwb3J0cy5QYXNzKHAocGF0aCksIGQoZHVyYXRpb24pLCBzKHNsb3cpKVxuICAgIH0sXG5cbiAgICBmYWlsOiBmdW5jdGlvbiAocGF0aCwgdmFsdWUsIGR1cmF0aW9uLCBzbG93KSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVwb3J0cy5GYWlsKHAocGF0aCksIHZhbHVlLCBkKGR1cmF0aW9uKSwgcyhzbG93KSlcbiAgICB9LFxuXG4gICAgc2tpcDogZnVuY3Rpb24gKHBhdGgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSZXBvcnRzLlNraXAocChwYXRoKSlcbiAgICB9LFxuXG4gICAgZW5kOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVwb3J0cy5FbmQoKVxuICAgIH0sXG5cbiAgICBlcnJvcjogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVwb3J0cy5FcnJvcih2YWx1ZSlcbiAgICB9LFxuXG4gICAgaG9vazogZnVuY3Rpb24gKHBhdGgsIHJvb3RQYXRoLCB2YWx1ZSkge1xuICAgICAgICByZXR1cm4gbmV3IFJlcG9ydHMuSG9vayhwKHBhdGgpLCBwKHJvb3RQYXRoKSwgaCh2YWx1ZSkpXG4gICAgfSxcbn1cblxuLyoqXG4gKiBDcmVhdGUgYSBuZXcgaG9vayBlcnJvciwgbWFpbmx5IGZvciB0ZXN0aW5nIHJlcG9ydGVycy5cbiAqL1xuZXhwb3J0cy5ob29rRXJyb3JzID0ge1xuICAgIGJlZm9yZUFsbDogZnVuY3Rpb24gKGZ1bmMsIHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVwb3J0cy5Ib29rRXJyb3IoVHlwZXMuQmVmb3JlQWxsLCBmdW5jLCB2YWx1ZSlcbiAgICB9LFxuXG4gICAgYmVmb3JlRWFjaDogZnVuY3Rpb24gKGZ1bmMsIHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVwb3J0cy5Ib29rRXJyb3IoVHlwZXMuQmVmb3JlRWFjaCwgZnVuYywgdmFsdWUpXG4gICAgfSxcblxuICAgIGFmdGVyRWFjaDogZnVuY3Rpb24gKGZ1bmMsIHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVwb3J0cy5Ib29rRXJyb3IoVHlwZXMuQWZ0ZXJFYWNoLCBmdW5jLCB2YWx1ZSlcbiAgICB9LFxuXG4gICAgYWZ0ZXJBbGw6IGZ1bmN0aW9uIChmdW5jLCB2YWx1ZSkge1xuICAgICAgICByZXR1cm4gbmV3IFJlcG9ydHMuSG9va0Vycm9yKFR5cGVzLkFmdGVyQWxsLCBmdW5jLCB2YWx1ZSlcbiAgICB9LFxufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgbG9jYXRpb24sIG1haW5seSBmb3IgdGVzdGluZyByZXBvcnRlcnMuXG4gKi9cbmV4cG9ydHMubG9jYXRpb24gPSBmdW5jdGlvbiAobmFtZSwgaW5kZXgpIHtcbiAgICBpZiAodHlwZW9mIG5hbWUgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGBuYW1lYCB0byBiZSBhIHN0cmluZ1wiKVxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgaW5kZXggIT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGBpbmRleGAgdG8gYmUgYSBudW1iZXJcIilcbiAgICB9XG5cbiAgICByZXR1cm4ge25hbWU6IG5hbWUsIGluZGV4OiBpbmRleHwwfVxufVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxuZXhwb3J0cy5hZGRIb29rID0gZnVuY3Rpb24gKGxpc3QsIGNhbGxiYWNrKSB7XG4gICAgaWYgKGxpc3QgIT0gbnVsbCkge1xuICAgICAgICBsaXN0LnB1c2goY2FsbGJhY2spXG4gICAgICAgIHJldHVybiBsaXN0XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIFtjYWxsYmFja11cbiAgICB9XG59XG5cbmV4cG9ydHMucmVtb3ZlSG9vayA9IGZ1bmN0aW9uIChsaXN0LCBjYWxsYmFjaykge1xuICAgIGlmIChsaXN0ID09IG51bGwpIHJldHVybiB1bmRlZmluZWRcbiAgICBpZiAobGlzdC5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgaWYgKGxpc3RbMF0gPT09IGNhbGxiYWNrKSByZXR1cm4gdW5kZWZpbmVkXG4gICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGluZGV4ID0gbGlzdC5pbmRleE9mKGNhbGxiYWNrKVxuXG4gICAgICAgIGlmIChpbmRleCA+PSAwKSBsaXN0LnNwbGljZShpbmRleCwgMSlcbiAgICB9XG4gICAgcmV0dXJuIGxpc3Rcbn1cblxuZXhwb3J0cy5oYXNIb29rID0gZnVuY3Rpb24gKGxpc3QsIGNhbGxiYWNrKSB7XG4gICAgaWYgKGxpc3QgPT0gbnVsbCkgcmV0dXJuIGZhbHNlXG4gICAgaWYgKGxpc3QubGVuZ3RoID4gMSkgcmV0dXJuIGxpc3QuaW5kZXhPZihjYWxsYmFjaykgPj0gMFxuICAgIHJldHVybiBsaXN0WzBdID09PSBjYWxsYmFja1xufVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxudmFyIG1ldGhvZHMgPSByZXF1aXJlKFwiLi4vbWV0aG9kc1wiKVxudmFyIFRlc3RzID0gcmVxdWlyZShcIi4uL2NvcmUvdGVzdHNcIilcbnZhciBIb29rcyA9IHJlcXVpcmUoXCIuL2hvb2tzXCIpXG5cbi8qKlxuICogVGhpcyBjb250YWlucyB0aGUgbG93IGxldmVsLCBtb3JlIGFyY2FuZSB0aGluZ3MgdGhhdCBhcmUgZ2VuZXJhbGx5IG5vdFxuICogaW50ZXJlc3RpbmcgdG8gYW55b25lIG90aGVyIHRoYW4gcGx1Z2luIGRldmVsb3BlcnMuXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gUmVmbGVjdFxuZnVuY3Rpb24gUmVmbGVjdCh0ZXN0KSB7XG4gICAgdmFyIHJlZmxlY3QgPSB0ZXN0LnJlZmxlY3RcblxuICAgIGlmIChyZWZsZWN0ICE9IG51bGwpIHJldHVybiByZWZsZWN0XG4gICAgaWYgKHRlc3Qucm9vdCAhPT0gdGVzdCkgcmV0dXJuIHRlc3QucmVmbGVjdCA9IG5ldyBSZWZsZWN0Q2hpbGQodGVzdClcbiAgICByZXR1cm4gdGVzdC5yZWZsZWN0ID0gbmV3IFJlZmxlY3RSb290KHRlc3QpXG59XG5cbm1ldGhvZHMoUmVmbGVjdCwge1xuICAgIC8qKlxuICAgICAqIEdldCB0aGUgY3VycmVudGx5IGV4ZWN1dGluZyB0ZXN0LlxuICAgICAqL1xuICAgIGdldCBjdXJyZW50KCkge1xuICAgICAgICByZXR1cm4gbmV3IFJlZmxlY3QodGhpcy5fLnJvb3QuY3VycmVudClcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSByb290IHRlc3QuXG4gICAgICovXG4gICAgZ2V0IHJvb3QoKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVmbGVjdCh0aGlzLl8ucm9vdClcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBjdXJyZW50IHRvdGFsIHRlc3QgY291bnQuXG4gICAgICovXG4gICAgZ2V0IGNvdW50KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fLnRlc3RzID09IG51bGwgPyAwIDogdGhpcy5fLnRlc3RzLmxlbmd0aFxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgYSBjb3B5IG9mIHRoZSBjdXJyZW50IHRlc3QgbGlzdCwgYXMgYSBSZWZsZWN0IGNvbGxlY3Rpb24uIFRoaXMgaXNcbiAgICAgKiBpbnRlbnRpb25hbGx5IGEgc2xpY2UsIHNvIHlvdSBjYW4ndCBtdXRhdGUgdGhlIHJlYWwgY2hpbGRyZW4uXG4gICAgICovXG4gICAgZ2V0IGNoaWxkcmVuKCkge1xuICAgICAgICBpZiAodGhpcy5fLnRlc3RzID09IG51bGwpIHJldHVybiBbXVxuICAgICAgICByZXR1cm4gdGhpcy5fLnRlc3RzLm1hcChmdW5jdGlvbiAodGVzdCkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBSZWZsZWN0Q2hpbGQodGVzdClcbiAgICAgICAgfSlcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogSXMgdGhpcyB0ZXN0IHRoZSByb290LCBpLmUuIHRvcCBsZXZlbD9cbiAgICAgKi9cbiAgICBnZXQgaXNSb290KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fLnJvb3QgPT09IHRoaXMuX1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBJcyB0aGlzIGxvY2tlZCAoaS5lLiB1bnNhZmUgdG8gbW9kaWZ5KT9cbiAgICAgKi9cbiAgICBnZXQgaXNMb2NrZWQoKSB7XG4gICAgICAgIHJldHVybiAhIXRoaXMuXy5sb2NrZWRcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBvd24sIG5vdCBuZWNlc3NhcmlseSBhY3RpdmUsIHRpbWVvdXQuIDAgbWVhbnMgaW5oZXJpdCB0aGVcbiAgICAgKiBwYXJlbnQncywgYW5kIGBJbmZpbml0eWAgbWVhbnMgaXQncyBkaXNhYmxlZC5cbiAgICAgKi9cbiAgICBnZXQgb3duVGltZW91dCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuXy50aW1lb3V0IHx8IDBcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBhY3RpdmUgdGltZW91dCBpbiBtaWxsaXNlY29uZHMsIG5vdCBuZWNlc3NhcmlseSBvd24sIG9yIHRoZVxuICAgICAqIGZyYW1ld29yayBkZWZhdWx0IG9mIDIwMDAsIGlmIG5vbmUgd2FzIHNldC5cbiAgICAgKi9cbiAgICBnZXQgdGltZW91dCgpIHtcbiAgICAgICAgcmV0dXJuIFRlc3RzLnRpbWVvdXQodGhpcy5fKVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIG93biwgbm90IG5lY2Vzc2FyaWx5IGFjdGl2ZSwgc2xvdyB0aHJlc2hvbGQuIDAgbWVhbnMgaW5oZXJpdCB0aGVcbiAgICAgKiBwYXJlbnQncywgYW5kIGBJbmZpbml0eWAgbWVhbnMgaXQncyBkaXNhYmxlZC5cbiAgICAgKi9cbiAgICBnZXQgb3duU2xvdygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuXy5zbG93IHx8IDBcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBhY3RpdmUgc2xvdyB0aHJlc2hvbGQgaW4gbWlsbGlzZWNvbmRzLCBub3QgbmVjZXNzYXJpbHkgb3duLCBvclxuICAgICAqIHRoZSBmcmFtZXdvcmsgZGVmYXVsdCBvZiA3NSwgaWYgbm9uZSB3YXMgc2V0LlxuICAgICAqL1xuICAgIGdldCBzbG93KCkge1xuICAgICAgICByZXR1cm4gVGVzdHMuc2xvdyh0aGlzLl8pXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBhIGhvb2sgdG8gYmUgcnVuIGJlZm9yZSBlYWNoIHN1YnRlc3QsIGluY2x1ZGluZyB0aGVpciBzdWJ0ZXN0cyBhbmQgc29cbiAgICAgKiBvbi5cbiAgICAgKi9cbiAgICBiZWZvcmU6IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBjYWxsYmFjayB0byBiZSBhIGZ1bmN0aW9uIGlmIHBhc3NlZFwiKVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fLmJlZm9yZUVhY2ggPSBIb29rcy5hZGRIb29rKHRoaXMuXy5iZWZvcmVFYWNoLCBjYWxsYmFjaylcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGEgaG9vayB0byBiZSBydW4gb25jZSBiZWZvcmUgYWxsIHN1YnRlc3RzIGFyZSBydW4uXG4gICAgICovXG4gICAgYmVmb3JlQWxsOiBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgY2FsbGJhY2sgdG8gYmUgYSBmdW5jdGlvbiBpZiBwYXNzZWRcIilcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuXy5iZWZvcmVBbGwgPSBIb29rcy5hZGRIb29rKHRoaXMuXy5iZWZvcmVBbGwsIGNhbGxiYWNrKVxuICAgIH0sXG5cbiAgIC8qKlxuICAgICogQWRkIGEgaG9vayB0byBiZSBydW4gYWZ0ZXIgZWFjaCBzdWJ0ZXN0LCBpbmNsdWRpbmcgdGhlaXIgc3VidGVzdHMgYW5kIHNvXG4gICAgKiBvbi5cbiAgICAqL1xuICAgIGFmdGVyOiBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgY2FsbGJhY2sgdG8gYmUgYSBmdW5jdGlvbiBpZiBwYXNzZWRcIilcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuXy5hZnRlckVhY2ggPSBIb29rcy5hZGRIb29rKHRoaXMuXy5hZnRlckVhY2gsIGNhbGxiYWNrKVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGQgYSBob29rIHRvIGJlIHJ1biBvbmNlIGFmdGVyIGFsbCBzdWJ0ZXN0cyBhcmUgcnVuLlxuICAgICAqL1xuICAgIGFmdGVyQWxsOiBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgY2FsbGJhY2sgdG8gYmUgYSBmdW5jdGlvbiBpZiBwYXNzZWRcIilcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuXy5hZnRlckFsbCA9IEhvb2tzLmFkZEhvb2sodGhpcy5fLmFmdGVyQWxsLCBjYWxsYmFjaylcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGEgaG9vayBwcmV2aW91c2x5IGFkZGVkIHdpdGggYHQuYmVmb3JlYCBvciBgcmVmbGVjdC5iZWZvcmVgLlxuICAgICAqL1xuICAgIGhhc0JlZm9yZTogZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIGJlIGEgZnVuY3Rpb24gaWYgcGFzc2VkXCIpXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gSG9va3MuaGFzSG9vayh0aGlzLl8uYmVmb3JlRWFjaCwgY2FsbGJhY2spXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBhIGhvb2sgcHJldmlvdXNseSBhZGRlZCB3aXRoIGB0LmJlZm9yZUFsbGAgb3IgYHJlZmxlY3QuYmVmb3JlQWxsYC5cbiAgICAgKi9cbiAgICBoYXNCZWZvcmVBbGw6IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBjYWxsYmFjayB0byBiZSBhIGZ1bmN0aW9uIGlmIHBhc3NlZFwiKVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIEhvb2tzLmhhc0hvb2sodGhpcy5fLmJlZm9yZUFsbCwgY2FsbGJhY2spXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBhIGhvb2sgcHJldmlvdXNseSBhZGRlZCB3aXRoIGB0LmFmdGVyYCBvcmByZWZsZWN0LmFmdGVyYC5cbiAgICAgKi9cbiAgICBoYXNBZnRlcjogZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIGJlIGEgZnVuY3Rpb24gaWYgcGFzc2VkXCIpXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gSG9va3MuaGFzSG9vayh0aGlzLl8uYWZ0ZXJFYWNoLCBjYWxsYmFjaylcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGEgaG9vayBwcmV2aW91c2x5IGFkZGVkIHdpdGggYHQuYWZ0ZXJBbGxgIG9yIGByZWZsZWN0LmFmdGVyQWxsYC5cbiAgICAgKi9cbiAgICBoYXNBZnRlckFsbDogZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIGJlIGEgZnVuY3Rpb24gaWYgcGFzc2VkXCIpXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gSG9va3MuaGFzSG9vayh0aGlzLl8uYWZ0ZXJBbGwsIGNhbGxiYWNrKVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgYSBob29rIHByZXZpb3VzbHkgYWRkZWQgd2l0aCBgdC5iZWZvcmVgIG9yIGByZWZsZWN0LmJlZm9yZWAuXG4gICAgICovXG4gICAgcmVtb3ZlQmVmb3JlOiBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgY2FsbGJhY2sgdG8gYmUgYSBmdW5jdGlvbiBpZiBwYXNzZWRcIilcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBiZWZvcmVFYWNoID0gSG9va3MucmVtb3ZlSG9vayh0aGlzLl8uYmVmb3JlRWFjaCwgY2FsbGJhY2spXG5cbiAgICAgICAgaWYgKGJlZm9yZUVhY2ggPT0gbnVsbCkgZGVsZXRlIHRoaXMuXy5iZWZvcmVFYWNoXG4gICAgICAgIGVsc2UgdGhpcy5fLmJlZm9yZUVhY2ggPSBiZWZvcmVFYWNoXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBhIGhvb2sgcHJldmlvdXNseSBhZGRlZCB3aXRoIGB0LmJlZm9yZUFsbGAgb3IgYHJlZmxlY3QuYmVmb3JlQWxsYC5cbiAgICAgKi9cbiAgICByZW1vdmVCZWZvcmVBbGw6IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBjYWxsYmFjayB0byBiZSBhIGZ1bmN0aW9uIGlmIHBhc3NlZFwiKVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGJlZm9yZUFsbCA9IEhvb2tzLnJlbW92ZUhvb2sodGhpcy5fLmJlZm9yZUFsbCwgY2FsbGJhY2spXG5cbiAgICAgICAgaWYgKGJlZm9yZUFsbCA9PSBudWxsKSBkZWxldGUgdGhpcy5fLmJlZm9yZUFsbFxuICAgICAgICBlbHNlIHRoaXMuXy5iZWZvcmVBbGwgPSBiZWZvcmVBbGxcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGEgaG9vayBwcmV2aW91c2x5IGFkZGVkIHdpdGggYHQuYWZ0ZXJgIG9yYHJlZmxlY3QuYWZ0ZXJgLlxuICAgICAqL1xuICAgIHJlbW92ZUFmdGVyOiBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgY2FsbGJhY2sgdG8gYmUgYSBmdW5jdGlvbiBpZiBwYXNzZWRcIilcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBhZnRlckVhY2ggPSBIb29rcy5yZW1vdmVIb29rKHRoaXMuXy5hZnRlckVhY2gsIGNhbGxiYWNrKVxuXG4gICAgICAgIGlmIChhZnRlckVhY2ggPT0gbnVsbCkgZGVsZXRlIHRoaXMuXy5hZnRlckVhY2hcbiAgICAgICAgZWxzZSB0aGlzLl8uYWZ0ZXJFYWNoID0gYWZ0ZXJFYWNoXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBhIGhvb2sgcHJldmlvdXNseSBhZGRlZCB3aXRoIGB0LmFmdGVyQWxsYCBvciBgcmVmbGVjdC5hZnRlckFsbGAuXG4gICAgICovXG4gICAgcmVtb3ZlQWZ0ZXJBbGw6IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBjYWxsYmFjayB0byBiZSBhIGZ1bmN0aW9uIGlmIHBhc3NlZFwiKVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGFmdGVyQWxsID0gSG9va3MucmVtb3ZlSG9vayh0aGlzLl8uYWZ0ZXJBbGwsIGNhbGxiYWNrKVxuXG4gICAgICAgIGlmIChhZnRlckFsbCA9PSBudWxsKSBkZWxldGUgdGhpcy5fLmFmdGVyQWxsXG4gICAgICAgIGVsc2UgdGhpcy5fLmFmdGVyQWxsID0gYWZ0ZXJBbGxcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGEgYmxvY2sgb3IgaW5saW5lIHRlc3QuXG4gICAgICovXG4gICAgdGVzdDogZnVuY3Rpb24gKG5hbWUsIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgbmFtZSAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGBuYW1lYCB0byBiZSBhIHN0cmluZ1wiKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgY2FsbGJhY2sgdG8gYmUgYSBmdW5jdGlvbiBpZiBwYXNzZWRcIilcbiAgICAgICAgfVxuXG4gICAgICAgIFRlc3RzLmFkZE5vcm1hbCh0aGlzLl8ucm9vdC5jdXJyZW50LCBuYW1lLCBjYWxsYmFjaylcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGEgc2tpcHBlZCBibG9jayBvciBpbmxpbmUgdGVzdC5cbiAgICAgKi9cbiAgICB0ZXN0U2tpcDogZnVuY3Rpb24gKG5hbWUsIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgbmFtZSAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGBuYW1lYCB0byBiZSBhIHN0cmluZ1wiKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgY2FsbGJhY2sgdG8gYmUgYSBmdW5jdGlvbiBpZiBwYXNzZWRcIilcbiAgICAgICAgfVxuXG4gICAgICAgIFRlc3RzLmFkZFNraXBwZWQodGhpcy5fLnJvb3QuY3VycmVudCwgbmFtZSlcbiAgICB9LFxufSlcblxuZnVuY3Rpb24gUmVmbGVjdFJvb3Qocm9vdCkge1xuICAgIHRoaXMuXyA9IHJvb3Rcbn1cblxubWV0aG9kcyhSZWZsZWN0Um9vdCwgUmVmbGVjdCwge1xuICAgIC8qKlxuICAgICAqIFdoZXRoZXIgYSByZXBvcnRlciB3YXMgcmVnaXN0ZXJlZC5cbiAgICAgKi9cbiAgICBoYXNSZXBvcnRlcjogZnVuY3Rpb24gKHJlcG9ydGVyKSB7XG4gICAgICAgIGlmICh0eXBlb2YgcmVwb3J0ZXIgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGByZXBvcnRlcmAgdG8gYmUgYSBmdW5jdGlvblwiKVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuXy5yb290LnJlcG9ydGVySWRzLmluZGV4T2YocmVwb3J0ZXIpID49IDBcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGEgcmVwb3J0ZXIuXG4gICAgICovXG4gICAgcmVwb3J0ZXI6IGZ1bmN0aW9uIChyZXBvcnRlciwgYXJnKSB7XG4gICAgICAgIGlmICh0eXBlb2YgcmVwb3J0ZXIgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGByZXBvcnRlcmAgdG8gYmUgYSBmdW5jdGlvblwiKVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHJvb3QgPSB0aGlzLl8ucm9vdFxuXG4gICAgICAgIGlmIChyb290LmN1cnJlbnQgIT09IHJvb3QpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlJlcG9ydGVycyBtYXkgb25seSBiZSBhZGRlZCB0byB0aGUgcm9vdFwiKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHJvb3QucmVwb3J0ZXJJZHMuaW5kZXhPZihyZXBvcnRlcikgPCAwKSB7XG4gICAgICAgICAgICByb290LnJlcG9ydGVySWRzLnB1c2gocmVwb3J0ZXIpXG4gICAgICAgICAgICByb290LnJlcG9ydGVycy5wdXNoKHJlcG9ydGVyKGFyZykpXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGEgcmVwb3J0ZXIuXG4gICAgICovXG4gICAgcmVtb3ZlUmVwb3J0ZXI6IGZ1bmN0aW9uIChyZXBvcnRlcikge1xuICAgICAgICBpZiAodHlwZW9mIHJlcG9ydGVyICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBgcmVwb3J0ZXJgIHRvIGJlIGEgZnVuY3Rpb25cIilcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciByb290ID0gdGhpcy5fLnJvb3RcblxuICAgICAgICBpZiAocm9vdC5jdXJyZW50ICE9PSByb290KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJSZXBvcnRlcnMgbWF5IG9ubHkgYmUgYWRkZWQgdG8gdGhlIHJvb3RcIilcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBpbmRleCA9IHJvb3QucmVwb3J0ZXJJZHMuaW5kZXhPZihyZXBvcnRlcilcblxuICAgICAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgICAgICAgcm9vdC5yZXBvcnRlcklkcy5zcGxpY2UoaW5kZXgsIDEpXG4gICAgICAgICAgICByb290LnJlcG9ydGVycy5zcGxpY2UoaW5kZXgsIDEpXG4gICAgICAgIH1cbiAgICB9LFxufSlcblxuZnVuY3Rpb24gUmVmbGVjdENoaWxkKHJvb3QpIHtcbiAgICB0aGlzLl8gPSByb290XG59XG5cbm1ldGhvZHMoUmVmbGVjdENoaWxkLCBSZWZsZWN0LCB7XG4gICAgLyoqXG4gICAgICogR2V0IHRoZSB0ZXN0IG5hbWUsIG9yIGB1bmRlZmluZWRgIGlmIGl0J3MgdGhlIHJvb3QgdGVzdC5cbiAgICAgKi9cbiAgICBnZXQgbmFtZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuXy5uYW1lXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgdGVzdCBpbmRleCwgb3IgYC0xYCBpZiBpdCdzIHRoZSByb290IHRlc3QuXG4gICAgICovXG4gICAgZ2V0IGluZGV4KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fLmluZGV4XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgcGFyZW50IHRlc3QgYXMgYSBSZWZsZWN0LlxuICAgICAqL1xuICAgIGdldCBwYXJlbnQoKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVmbGVjdCh0aGlzLl8ucGFyZW50KVxuICAgIH0sXG59KVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxudmFyIG1ldGhvZHMgPSByZXF1aXJlKFwiLi4vbWV0aG9kc1wiKVxudmFyIFRlc3RzID0gcmVxdWlyZShcIi4uL2NvcmUvdGVzdHNcIilcbnZhciBvbmx5QWRkID0gcmVxdWlyZShcIi4uL2NvcmUvb25seVwiKS5vbmx5QWRkXG52YXIgYWRkSG9vayA9IHJlcXVpcmUoXCIuL2hvb2tzXCIpLmFkZEhvb2tcbnZhciBSZWZsZWN0ID0gcmVxdWlyZShcIi4vcmVmbGVjdFwiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IFRoYWxsaXVtXG5mdW5jdGlvbiBUaGFsbGl1bSgpIHtcbiAgICB0aGlzLl8gPSBUZXN0cy5jcmVhdGVSb290KHRoaXMpXG4gICAgLy8gRVM2IG1vZHVsZSB0cmFuc3BpbGVyIGNvbXBhdGliaWxpdHkuXG4gICAgdGhpcy5kZWZhdWx0ID0gdGhpc1xufVxuXG5tZXRob2RzKFRoYWxsaXVtLCB7XG4gICAgLyoqXG4gICAgICogQ2FsbCBhIHBsdWdpbiBhbmQgcmV0dXJuIHRoZSByZXN1bHQuIFRoZSBwbHVnaW4gaXMgY2FsbGVkIHdpdGggYSBSZWZsZWN0XG4gICAgICogaW5zdGFuY2UgZm9yIGFjY2VzcyB0byBwbGVudHkgb2YgcG90ZW50aWFsbHkgdXNlZnVsIGludGVybmFsIGRldGFpbHMuXG4gICAgICovXG4gICAgY2FsbDogZnVuY3Rpb24gKHBsdWdpbiwgYXJnKSB7XG4gICAgICAgIHZhciByZWZsZWN0ID0gbmV3IFJlZmxlY3QodGhpcy5fLnJvb3QuY3VycmVudClcblxuICAgICAgICByZXR1cm4gcGx1Z2luLmNhbGwocmVmbGVjdCwgcmVmbGVjdCwgYXJnKVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBXaGl0ZWxpc3Qgc3BlY2lmaWMgdGVzdHMsIHVzaW5nIGFycmF5LWJhc2VkIHNlbGVjdG9ycyB3aGVyZSBlYWNoIGVudHJ5XG4gICAgICogaXMgZWl0aGVyIGEgc3RyaW5nIG9yIHJlZ3VsYXIgZXhwcmVzc2lvbi5cbiAgICAgKi9cbiAgICBvbmx5OiBmdW5jdGlvbiAoLyogLi4uc2VsZWN0b3JzICovKSB7XG4gICAgICAgIG9ubHlBZGQuYXBwbHkodGhpcy5fLnJvb3QuY3VycmVudCwgYXJndW1lbnRzKVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGQgYSByZXBvcnRlci5cbiAgICAgKi9cbiAgICByZXBvcnRlcjogZnVuY3Rpb24gKHJlcG9ydGVyLCBhcmcpIHtcbiAgICAgICAgaWYgKHR5cGVvZiByZXBvcnRlciAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgYHJlcG9ydGVyYCB0byBiZSBhIGZ1bmN0aW9uLlwiKVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHJvb3QgPSB0aGlzLl8ucm9vdFxuXG4gICAgICAgIGlmIChyb290LmN1cnJlbnQgIT09IHJvb3QpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlJlcG9ydGVycyBtYXkgb25seSBiZSBhZGRlZCB0byB0aGUgcm9vdC5cIilcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciByZXN1bHQgPSByZXBvcnRlcihhcmcpXG5cbiAgICAgICAgLy8gRG9uJ3QgYXNzdW1lIGl0J3MgYSBmdW5jdGlvbi4gVmVyaWZ5IGl0IGFjdHVhbGx5IGlzLCBzbyB3ZSBkb24ndCBoYXZlXG4gICAgICAgIC8vIGluZXhwbGljYWJsZSB0eXBlIGVycm9ycyBpbnRlcm5hbGx5IGFmdGVyIGl0J3MgaW52b2tlZCwgYW5kIHNvIHVzZXJzXG4gICAgICAgIC8vIHdvbid0IGdldCB0b28gY29uZnVzZWQuXG4gICAgICAgIGlmICh0eXBlb2YgcmVzdWx0ICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgICAgICAgICAgXCJFeHBlY3RlZCBgcmVwb3J0ZXJgIHRvIHJldHVybiBhIGZ1bmN0aW9uLiBDaGVjayB3aXRoIHRoZSBcIiArXG4gICAgICAgICAgICAgICAgXCJyZXBvcnRlcidzIGF1dGhvciwgYW5kIGhhdmUgdGhlbSBmaXggdGhlaXIgcmVwb3J0ZXIuXCIpXG4gICAgICAgIH1cblxuICAgICAgICByb290LnJlcG9ydGVyID0gcmVzdWx0XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgY3VycmVudCB0aW1lb3V0LiAwIG1lYW5zIGluaGVyaXQgdGhlIHBhcmVudCdzLCBhbmQgYEluZmluaXR5YFxuICAgICAqIG1lYW5zIGl0J3MgZGlzYWJsZWQuXG4gICAgICovXG4gICAgZ2V0IHRpbWVvdXQoKSB7XG4gICAgICAgIHJldHVybiBUZXN0cy50aW1lb3V0KHRoaXMuXy5yb290LmN1cnJlbnQpXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCB0aGUgdGltZW91dCBpbiBtaWxsaXNlY29uZHMsIHJvdW5kaW5nIG5lZ2F0aXZlcyB0byAwLiBTZXR0aW5nIHRoZVxuICAgICAqIHRpbWVvdXQgdG8gMCBtZWFucyB0byBpbmhlcml0IHRoZSBwYXJlbnQgdGltZW91dCwgYW5kIHNldHRpbmcgaXQgdG9cbiAgICAgKiBgSW5maW5pdHlgIGRpc2FibGVzIGl0LlxuICAgICAqL1xuICAgIHNldCB0aW1lb3V0KHRpbWVvdXQpIHtcbiAgICAgICAgdmFyIGNhbGN1bGF0ZWQgPSBNYXRoLmZsb29yKE1hdGgubWF4KCt0aW1lb3V0LCAwKSlcblxuICAgICAgICBpZiAoY2FsY3VsYXRlZCA9PT0gMCkgZGVsZXRlIHRoaXMuXy5yb290LmN1cnJlbnQudGltZW91dFxuICAgICAgICBlbHNlIHRoaXMuXy5yb290LmN1cnJlbnQudGltZW91dCA9IGNhbGN1bGF0ZWRcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBjdXJyZW50IHNsb3cgdGhyZXNob2xkLiAwIG1lYW5zIGluaGVyaXQgdGhlIHBhcmVudCdzLCBhbmRcbiAgICAgKiBgSW5maW5pdHlgIG1lYW5zIGl0J3MgZGlzYWJsZWQuXG4gICAgICovXG4gICAgZ2V0IHNsb3coKSB7XG4gICAgICAgIHJldHVybiBUZXN0cy5zbG93KHRoaXMuXy5yb290LmN1cnJlbnQpXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCB0aGUgc2xvdyB0aHJlc2hvbGQgaW4gbWlsbGlzZWNvbmRzLCByb3VuZGluZyBuZWdhdGl2ZXMgdG8gMC4gU2V0dGluZ1xuICAgICAqIHRoZSB0aW1lb3V0IHRvIDAgbWVhbnMgdG8gaW5oZXJpdCB0aGUgcGFyZW50IHRocmVzaG9sZCwgYW5kIHNldHRpbmcgaXQgdG9cbiAgICAgKiBgSW5maW5pdHlgIGRpc2FibGVzIGl0LlxuICAgICAqL1xuICAgIHNldCBzbG93KHNsb3cpIHtcbiAgICAgICAgdmFyIGNhbGN1bGF0ZWQgPSBNYXRoLmZsb29yKE1hdGgubWF4KCtzbG93LCAwKSlcblxuICAgICAgICBpZiAoY2FsY3VsYXRlZCA9PT0gMCkgZGVsZXRlIHRoaXMuXy5yb290LmN1cnJlbnQuc2xvd1xuICAgICAgICBlbHNlIHRoaXMuXy5yb290LmN1cnJlbnQuc2xvdyA9IGNhbGN1bGF0ZWRcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUnVuIHRoZSB0ZXN0cyAob3IgdGhlIHRlc3QncyB0ZXN0cyBpZiBpdCdzIG5vdCBhIGJhc2UgaW5zdGFuY2UpLlxuICAgICAqL1xuICAgIHJ1bjogZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5fLnJvb3QgIT09IHRoaXMuXykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgICAgIFwiT25seSB0aGUgcm9vdCB0ZXN0IGNhbiBiZSBydW4gLSBJZiB5b3Ugb25seSB3YW50IHRvIHJ1biBhIFwiICtcbiAgICAgICAgICAgICAgICBcInN1YnRlc3QsIHVzZSBgdC5vbmx5KFtcXFwic2VsZWN0b3IxXFxcIiwgLi4uXSlgIGluc3RlYWQuXCIpXG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5fLnJvb3QubG9ja2VkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW4ndCBydW4gd2hpbGUgdGVzdHMgYXJlIGFscmVhZHkgcnVubmluZy5cIilcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBUZXN0cy5ydW5UZXN0KHRoaXMuXylcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGEgdGVzdC5cbiAgICAgKi9cbiAgICB0ZXN0OiBmdW5jdGlvbiAobmFtZSwgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBuYW1lICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgYG5hbWVgIHRvIGJlIGEgc3RyaW5nXCIpXG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBjYWxsYmFjayB0byBiZSBhIGZ1bmN0aW9uIGlmIHBhc3NlZFwiKVxuICAgICAgICB9XG5cbiAgICAgICAgVGVzdHMuYWRkTm9ybWFsKHRoaXMuXy5yb290LmN1cnJlbnQsIG5hbWUsIGNhbGxiYWNrKVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGQgYSBza2lwcGVkIHRlc3QuXG4gICAgICovXG4gICAgdGVzdFNraXA6IGZ1bmN0aW9uIChuYW1lLCBjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIG5hbWUgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBgbmFtZWAgdG8gYmUgYSBzdHJpbmdcIilcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIGJlIGEgZnVuY3Rpb24gaWYgcGFzc2VkXCIpXG4gICAgICAgIH1cblxuICAgICAgICBUZXN0cy5hZGRTa2lwcGVkKHRoaXMuXy5yb290LmN1cnJlbnQsIG5hbWUpXG4gICAgfSxcblxuICAgIGJlZm9yZTogZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIGJlIGEgZnVuY3Rpb24gaWYgcGFzc2VkXCIpXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgdGVzdCA9IHRoaXMuXy5yb290LmN1cnJlbnRcblxuICAgICAgICB0ZXN0LmJlZm9yZUVhY2ggPSBhZGRIb29rKHRlc3QuYmVmb3JlRWFjaCwgY2FsbGJhY2spXG4gICAgfSxcblxuICAgIGJlZm9yZUFsbDogZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIGJlIGEgZnVuY3Rpb24gaWYgcGFzc2VkXCIpXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgdGVzdCA9IHRoaXMuXy5yb290LmN1cnJlbnRcblxuICAgICAgICB0ZXN0LmJlZm9yZUFsbCA9IGFkZEhvb2sodGVzdC5iZWZvcmVBbGwsIGNhbGxiYWNrKVxuICAgIH0sXG5cbiAgICBhZnRlcjogZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIGJlIGEgZnVuY3Rpb24gaWYgcGFzc2VkXCIpXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgdGVzdCA9IHRoaXMuXy5yb290LmN1cnJlbnRcblxuICAgICAgICB0ZXN0LmFmdGVyRWFjaCA9IGFkZEhvb2sodGVzdC5hZnRlckVhY2gsIGNhbGxiYWNrKVxuICAgIH0sXG5cbiAgICBhZnRlckFsbDogZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIGJlIGEgZnVuY3Rpb24gaWYgcGFzc2VkXCIpXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgdGVzdCA9IHRoaXMuXy5yb290LmN1cnJlbnRcblxuICAgICAgICB0ZXN0LmFmdGVyQWxsID0gYWRkSG9vayh0ZXN0LmFmdGVyQWxsLCBjYWxsYmFjaylcbiAgICB9LFxufSlcbiIsIlwidXNlIHN0cmljdFwiXG5cbnZhciBtYXRjaCA9IHJlcXVpcmUoXCIuLi8uLi9tYXRjaFwiKVxudmFyIFV0aWwgPSByZXF1aXJlKFwiLi91dGlsXCIpXG5cbmZ1bmN0aW9uIGJpbmFyeShudW1lcmljLCBjb21wYXJhdG9yLCBtZXNzYWdlKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gICAgICAgIGlmIChudW1lcmljKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGFjdHVhbCAhPT0gXCJudW1iZXJcIikge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJgYWN0dWFsYCBtdXN0IGJlIGEgbnVtYmVyXCIpXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgZXhwZWN0ZWQgIT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYGV4cGVjdGVkYCBtdXN0IGJlIGEgbnVtYmVyXCIpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWNvbXBhcmF0b3IoYWN0dWFsLCBleHBlY3RlZCkpIHtcbiAgICAgICAgICAgIFV0aWwuZmFpbChtZXNzYWdlLCB7YWN0dWFsOiBhY3R1YWwsIGV4cGVjdGVkOiBleHBlY3RlZH0pXG4gICAgICAgIH1cbiAgICB9XG59XG5cbmV4cG9ydHMuZXF1YWwgPSBiaW5hcnkoZmFsc2UsXG4gICAgZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIFV0aWwuc3RyaWN0SXMoYSwgYikgfSxcbiAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGVxdWFsIHtleHBlY3RlZH1cIilcblxuZXhwb3J0cy5ub3RFcXVhbCA9IGJpbmFyeShmYWxzZSxcbiAgICBmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gIVV0aWwuc3RyaWN0SXMoYSwgYikgfSxcbiAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBlcXVhbCB7ZXhwZWN0ZWR9XCIpXG5cbmV4cG9ydHMuZXF1YWxMb29zZSA9IGJpbmFyeShmYWxzZSxcbiAgICBmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gVXRpbC5sb29zZUlzKGEsIGIpIH0sXG4gICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBsb29zZWx5IGVxdWFsIHtleHBlY3RlZH1cIilcblxuZXhwb3J0cy5ub3RFcXVhbExvb3NlID0gYmluYXJ5KGZhbHNlLFxuICAgIGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiAhVXRpbC5sb29zZUlzKGEsIGIpIH0sXG4gICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgbG9vc2VseSBlcXVhbCB7ZXhwZWN0ZWR9XCIpXG5cbmV4cG9ydHMuYXRMZWFzdCA9IGJpbmFyeSh0cnVlLFxuICAgIGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBhID49IGIgfSxcbiAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGJlIGF0IGxlYXN0IHtleHBlY3RlZH1cIilcblxuZXhwb3J0cy5hdE1vc3QgPSBiaW5hcnkodHJ1ZSxcbiAgICBmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYSA8PSBiIH0sXG4gICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBiZSBhdCBtb3N0IHtleHBlY3RlZH1cIilcblxuZXhwb3J0cy5hYm92ZSA9IGJpbmFyeSh0cnVlLFxuICAgIGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBhID4gYiB9LFxuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gYmUgYWJvdmUge2V4cGVjdGVkfVwiKVxuXG5leHBvcnRzLmJlbG93ID0gYmluYXJ5KHRydWUsXG4gICAgZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGEgPCBiIH0sXG4gICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBiZSBiZWxvdyB7ZXhwZWN0ZWR9XCIpXG5cbmV4cG9ydHMuYmV0d2VlbiA9IGZ1bmN0aW9uIChhY3R1YWwsIGxvd2VyLCB1cHBlcikge1xuICAgIGlmICh0eXBlb2YgYWN0dWFsICE9PSBcIm51bWJlclwiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJgYWN0dWFsYCBtdXN0IGJlIGEgbnVtYmVyXCIpXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBsb3dlciAhPT0gXCJudW1iZXJcIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYGxvd2VyYCBtdXN0IGJlIGEgbnVtYmVyXCIpXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiB1cHBlciAhPT0gXCJudW1iZXJcIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYHVwcGVyYCBtdXN0IGJlIGEgbnVtYmVyXCIpXG4gICAgfVxuXG4gICAgLy8gVGhlIG5lZ2F0aW9uIGlzIHRvIGFkZHJlc3MgTmFOcyBhcyB3ZWxsLCB3aXRob3V0IHdyaXRpbmcgYSB0b24gb2Ygc3BlY2lhbFxuICAgIC8vIGNhc2UgYm9pbGVycGxhdGVcbiAgICBpZiAoIShhY3R1YWwgPj0gbG93ZXIgJiYgYWN0dWFsIDw9IHVwcGVyKSkge1xuICAgICAgICBVdGlsLmZhaWwoXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBiZSBiZXR3ZWVuIHtsb3dlcn0gYW5kIHt1cHBlcn1cIiwge1xuICAgICAgICAgICAgYWN0dWFsOiBhY3R1YWwsXG4gICAgICAgICAgICBsb3dlcjogbG93ZXIsXG4gICAgICAgICAgICB1cHBlcjogdXBwZXIsXG4gICAgICAgIH0pXG4gICAgfVxufVxuXG5leHBvcnRzLmRlZXBFcXVhbCA9IGJpbmFyeShmYWxzZSxcbiAgICBmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gbWF0Y2guc3RyaWN0KGEsIGIpIH0sXG4gICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBkZWVwbHkgZXF1YWwge2V4cGVjdGVkfVwiKVxuXG5leHBvcnRzLm5vdERlZXBFcXVhbCA9IGJpbmFyeShmYWxzZSxcbiAgICBmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gIW1hdGNoLnN0cmljdChhLCBiKSB9LFxuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGRlZXBseSBlcXVhbCB7ZXhwZWN0ZWR9XCIpXG5cbmV4cG9ydHMubWF0Y2ggPSBiaW5hcnkoZmFsc2UsXG4gICAgZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIG1hdGNoLm1hdGNoKGEsIGIpIH0sXG4gICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBtYXRjaCB7ZXhwZWN0ZWR9XCIpXG5cbmV4cG9ydHMubm90TWF0Y2ggPSBiaW5hcnkoZmFsc2UsXG4gICAgZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuICFtYXRjaC5tYXRjaChhLCBiKSB9LFxuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IG1hdGNoIHtleHBlY3RlZH1cIilcblxuLy8gVXNlcyBkaXZpc2lvbiB0byBhbGxvdyBmb3IgYSBtb3JlIHJvYnVzdCBjb21wYXJpc29uIG9mIGZsb2F0cy4gQWxzbywgdGhpc1xuLy8gaGFuZGxlcyBuZWFyLXplcm8gY29tcGFyaXNvbnMgY29ycmVjdGx5LCBhcyB3ZWxsIGFzIGEgemVybyB0b2xlcmFuY2UgKGkuZS5cbi8vIGV4YWN0IGNvbXBhcmlzb24pLlxuZnVuY3Rpb24gY2xvc2VUbyhleHBlY3RlZCwgYWN0dWFsLCB0b2xlcmFuY2UpIHtcbiAgICBpZiAodG9sZXJhbmNlID09PSBJbmZpbml0eSB8fCBhY3R1YWwgPT09IGV4cGVjdGVkKSByZXR1cm4gdHJ1ZVxuICAgIGlmICh0b2xlcmFuY2UgPT09IDApIHJldHVybiBmYWxzZVxuICAgIGlmIChhY3R1YWwgPT09IDApIHJldHVybiBNYXRoLmFicyhleHBlY3RlZCkgPCB0b2xlcmFuY2VcbiAgICBpZiAoZXhwZWN0ZWQgPT09IDApIHJldHVybiBNYXRoLmFicyhhY3R1YWwpIDwgdG9sZXJhbmNlXG4gICAgcmV0dXJuIE1hdGguYWJzKGV4cGVjdGVkIC8gYWN0dWFsIC0gMSkgPCB0b2xlcmFuY2Vcbn1cblxuLy8gTm90ZTogdGhlc2UgdHdvIGFsd2F5cyBmYWlsIHdoZW4gZGVhbGluZyB3aXRoIE5hTnMuXG5leHBvcnRzLmNsb3NlVG8gPSBmdW5jdGlvbiAoZXhwZWN0ZWQsIGFjdHVhbCwgdG9sZXJhbmNlKSB7XG4gICAgaWYgKHR5cGVvZiBhY3R1YWwgIT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBhY3R1YWxgIG11c3QgYmUgYSBudW1iZXJcIilcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGV4cGVjdGVkICE9PSBcIm51bWJlclwiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJgZXhwZWN0ZWRgIG11c3QgYmUgYSBudW1iZXJcIilcbiAgICB9XG5cbiAgICBpZiAodG9sZXJhbmNlID09IG51bGwpIHRvbGVyYW5jZSA9IDFlLTEwXG5cbiAgICBpZiAodHlwZW9mIHRvbGVyYW5jZSAhPT0gXCJudW1iZXJcIiB8fCB0b2xlcmFuY2UgPCAwKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgICAgICBcImB0b2xlcmFuY2VgIG11c3QgYmUgYSBub24tbmVnYXRpdmUgbnVtYmVyIGlmIGdpdmVuXCIpXG4gICAgfVxuXG4gICAgaWYgKGFjdHVhbCAhPT0gYWN0dWFsIHx8IGV4cGVjdGVkICE9PSBleHBlY3RlZCB8fCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXNlbGYtY29tcGFyZSwgbWF4LWxlblxuICAgICAgICAgICAgIWNsb3NlVG8oZXhwZWN0ZWQsIGFjdHVhbCwgdG9sZXJhbmNlKSkge1xuICAgICAgICBVdGlsLmZhaWwoXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBiZSBjbG9zZSB0byB7ZXhwZWN0ZWR9XCIsIHtcbiAgICAgICAgICAgIGFjdHVhbDogYWN0dWFsLFxuICAgICAgICAgICAgZXhwZWN0ZWQ6IGV4cGVjdGVkLFxuICAgICAgICB9KVxuICAgIH1cbn1cblxuZXhwb3J0cy5ub3RDbG9zZVRvID0gZnVuY3Rpb24gKGV4cGVjdGVkLCBhY3R1YWwsIHRvbGVyYW5jZSkge1xuICAgIGlmICh0eXBlb2YgYWN0dWFsICE9PSBcIm51bWJlclwiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJgYWN0dWFsYCBtdXN0IGJlIGEgbnVtYmVyXCIpXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBleHBlY3RlZCAhPT0gXCJudW1iZXJcIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYGV4cGVjdGVkYCBtdXN0IGJlIGEgbnVtYmVyXCIpXG4gICAgfVxuXG4gICAgaWYgKHRvbGVyYW5jZSA9PSBudWxsKSB0b2xlcmFuY2UgPSAxZS0xMFxuXG4gICAgaWYgKHR5cGVvZiB0b2xlcmFuY2UgIT09IFwibnVtYmVyXCIgfHwgdG9sZXJhbmNlIDwgMCkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICAgICAgXCJgdG9sZXJhbmNlYCBtdXN0IGJlIGEgbm9uLW5lZ2F0aXZlIG51bWJlciBpZiBnaXZlblwiKVxuICAgIH1cblxuICAgIGlmIChleHBlY3RlZCAhPT0gZXhwZWN0ZWQgfHwgYWN0dWFsICE9PSBhY3R1YWwgfHwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1zZWxmLWNvbXBhcmUsIG1heC1sZW5cbiAgICAgICAgICAgIGNsb3NlVG8oZXhwZWN0ZWQsIGFjdHVhbCwgdG9sZXJhbmNlKSkge1xuICAgICAgICBVdGlsLmZhaWwoXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgYmUgY2xvc2UgdG8ge2V4cGVjdGVkfVwiLCB7XG4gICAgICAgICAgICBhY3R1YWw6IGFjdHVhbCxcbiAgICAgICAgICAgIGV4cGVjdGVkOiBleHBlY3RlZCxcbiAgICAgICAgfSlcbiAgICB9XG59XG4iLCJcInVzZSBzdHJpY3RcIlxuXG52YXIgbWF0Y2ggPSByZXF1aXJlKFwiLi4vLi4vbWF0Y2hcIilcbnZhciBVdGlsID0gcmVxdWlyZShcIi4vdXRpbFwiKVxudmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHlcblxuZnVuY3Rpb24gaGFzS2V5cyhhbGwsIG9iamVjdCwga2V5cykge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgdGVzdCA9IGhhc093bi5jYWxsKG9iamVjdCwga2V5c1tpXSlcblxuICAgICAgICBpZiAodGVzdCAhPT0gYWxsKSByZXR1cm4gIWFsbFxuICAgIH1cblxuICAgIHJldHVybiBhbGxcbn1cblxuZnVuY3Rpb24gaGFzVmFsdWVzKGZ1bmMsIGFsbCwgb2JqZWN0LCBrZXlzKSB7XG4gICAgaWYgKG9iamVjdCA9PT0ga2V5cykgcmV0dXJuIHRydWVcbiAgICB2YXIgbGlzdCA9IE9iamVjdC5rZXlzKGtleXMpXG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGtleSA9IGxpc3RbaV1cbiAgICAgICAgdmFyIHRlc3QgPSBoYXNPd24uY2FsbChvYmplY3QsIGtleSkgJiYgZnVuYyhrZXlzW2tleV0sIG9iamVjdFtrZXldKVxuXG4gICAgICAgIGlmICh0ZXN0ICE9PSBhbGwpIHJldHVybiB0ZXN0XG4gICAgfVxuXG4gICAgcmV0dXJuIGFsbFxufVxuXG5mdW5jdGlvbiBtYWtlSGFzT3ZlcmxvYWQoYWxsLCBpbnZlcnQsIG1lc3NhZ2UpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKG9iamVjdCwga2V5cykge1xuICAgICAgICBpZiAodHlwZW9mIG9iamVjdCAhPT0gXCJvYmplY3RcIiB8fCBvYmplY3QgPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBvYmplY3RgIG11c3QgYmUgYW4gb2JqZWN0XCIpXG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIGtleXMgIT09IFwib2JqZWN0XCIgfHwga2V5cyA9PSBudWxsKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYGtleXNgIG11c3QgYmUgYW4gb2JqZWN0IG9yIGFycmF5XCIpXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShrZXlzKSkge1xuICAgICAgICAgICAgaWYgKGtleXMubGVuZ3RoICYmIGhhc0tleXMoYWxsLCBvYmplY3QsIGtleXMpID09PSBpbnZlcnQpIHtcbiAgICAgICAgICAgICAgICBVdGlsLmZhaWwobWVzc2FnZSwge2FjdHVhbDogb2JqZWN0LCBrZXlzOiBrZXlzfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChPYmplY3Qua2V5cyhrZXlzKS5sZW5ndGgpIHtcbiAgICAgICAgICAgIGlmIChoYXNWYWx1ZXMoVXRpbC5zdHJpY3RJcywgYWxsLCBvYmplY3QsIGtleXMpID09PSBpbnZlcnQpIHtcbiAgICAgICAgICAgICAgICBVdGlsLmZhaWwobWVzc2FnZSwge2FjdHVhbDogb2JqZWN0LCBrZXlzOiBrZXlzfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gbWFrZUhhc0tleXMoZnVuYywgYWxsLCBpbnZlcnQsIG1lc3NhZ2UpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKG9iamVjdCwga2V5cykge1xuICAgICAgICBpZiAodHlwZW9mIG9iamVjdCAhPT0gXCJvYmplY3RcIiB8fCBvYmplY3QgPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBvYmplY3RgIG11c3QgYmUgYW4gb2JqZWN0XCIpXG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIGtleXMgIT09IFwib2JqZWN0XCIgfHwga2V5cyA9PSBudWxsKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYGtleXNgIG11c3QgYmUgYW4gb2JqZWN0XCIpXG4gICAgICAgIH1cblxuICAgICAgICAvLyBleGNsdXNpdmUgb3IgdG8gaW52ZXJ0IHRoZSByZXN1bHQgaWYgYGludmVydGAgaXMgdHJ1ZVxuICAgICAgICBpZiAoT2JqZWN0LmtleXMoa2V5cykubGVuZ3RoKSB7XG4gICAgICAgICAgICBpZiAoaGFzVmFsdWVzKGZ1bmMsIGFsbCwgb2JqZWN0LCBrZXlzKSA9PT0gaW52ZXJ0KSB7XG4gICAgICAgICAgICAgICAgVXRpbC5mYWlsKG1lc3NhZ2UsIHthY3R1YWw6IG9iamVjdCwga2V5czoga2V5c30pXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8qIGVzbGludC1kaXNhYmxlIG1heC1sZW4gKi9cblxuZXhwb3J0cy5oYXNLZXlzID0gbWFrZUhhc092ZXJsb2FkKHRydWUsIGZhbHNlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGhhdmUgYWxsIGtleXMgaW4ge2tleXN9XCIpXG5leHBvcnRzLmhhc0tleXNEZWVwID0gbWFrZUhhc0tleXMobWF0Y2guc3RyaWN0LCB0cnVlLCBmYWxzZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBoYXZlIGFsbCBrZXlzIGluIHtrZXlzfVwiKVxuZXhwb3J0cy5oYXNLZXlzTWF0Y2ggPSBtYWtlSGFzS2V5cyhtYXRjaC5tYXRjaCwgdHJ1ZSwgZmFsc2UsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbWF0Y2ggYWxsIGtleXMgaW4ge2tleXN9XCIpXG5leHBvcnRzLmhhc0tleXNBbnkgPSBtYWtlSGFzT3ZlcmxvYWQoZmFsc2UsIGZhbHNlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGhhdmUgYW55IGtleSBpbiB7a2V5c31cIilcbmV4cG9ydHMuaGFzS2V5c0FueURlZXAgPSBtYWtlSGFzS2V5cyhtYXRjaC5zdHJpY3QsIGZhbHNlLCBmYWxzZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBoYXZlIGFueSBrZXkgaW4ge2tleXN9XCIpXG5leHBvcnRzLmhhc0tleXNBbnlNYXRjaCA9IG1ha2VIYXNLZXlzKG1hdGNoLm1hdGNoLCBmYWxzZSwgZmFsc2UsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbWF0Y2ggYW55IGtleSBpbiB7a2V5c31cIilcbmV4cG9ydHMubm90SGFzS2V5c0FsbCA9IG1ha2VIYXNPdmVybG9hZCh0cnVlLCB0cnVlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBoYXZlIGFsbCBrZXlzIGluIHtrZXlzfVwiKVxuZXhwb3J0cy5ub3RIYXNLZXlzQWxsRGVlcCA9IG1ha2VIYXNLZXlzKG1hdGNoLnN0cmljdCwgdHJ1ZSwgdHJ1ZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgaGF2ZSBhbGwga2V5cyBpbiB7a2V5c31cIilcbmV4cG9ydHMubm90SGFzS2V5c0FsbE1hdGNoID0gbWFrZUhhc0tleXMobWF0Y2gubWF0Y2gsIHRydWUsIHRydWUsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IG1hdGNoIGFsbCBrZXlzIGluIHtrZXlzfVwiKVxuZXhwb3J0cy5ub3RIYXNLZXlzID0gbWFrZUhhc092ZXJsb2FkKGZhbHNlLCB0cnVlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBoYXZlIGFueSBrZXkgaW4ge2tleXN9XCIpXG5leHBvcnRzLm5vdEhhc0tleXNEZWVwID0gbWFrZUhhc0tleXMobWF0Y2guc3RyaWN0LCBmYWxzZSwgdHJ1ZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgaGF2ZSBhbnkga2V5IGluIHtrZXlzfVwiKVxuZXhwb3J0cy5ub3RIYXNLZXlzTWF0Y2ggPSBtYWtlSGFzS2V5cyhtYXRjaC5tYXRjaCwgZmFsc2UsIHRydWUsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IG1hdGNoIGFueSBrZXkgaW4ge2tleXN9XCIpXG4iLCJcInVzZSBzdHJpY3RcIlxuXG52YXIgVXRpbCA9IHJlcXVpcmUoXCIuL3V0aWxcIilcbnZhciBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5XG5cbmZ1bmN0aW9uIGhhcyhfKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LWxlbiwgbWF4LXBhcmFtc1xuICAgIHJldHVybiBmdW5jdGlvbiAob2JqZWN0LCBrZXksIHZhbHVlKSB7XG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDMpIHtcbiAgICAgICAgICAgIGlmICghXy5oYXMob2JqZWN0LCBrZXkpIHx8XG4gICAgICAgICAgICAgICAgICAgICFVdGlsLnN0cmljdElzKF8uZ2V0KG9iamVjdCwga2V5KSwgdmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgVXRpbC5mYWlsKF8ubWVzc2FnZXNbMF0sIHtcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IHZhbHVlLFxuICAgICAgICAgICAgICAgICAgICBhY3R1YWw6IG9iamVjdFtrZXldLFxuICAgICAgICAgICAgICAgICAgICBrZXk6IGtleSxcbiAgICAgICAgICAgICAgICAgICAgb2JqZWN0OiBvYmplY3QsXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICghXy5oYXMob2JqZWN0LCBrZXkpKSB7XG4gICAgICAgICAgICBVdGlsLmZhaWwoXy5tZXNzYWdlc1sxXSwge1xuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiB2YWx1ZSxcbiAgICAgICAgICAgICAgICBhY3R1YWw6IG9iamVjdFtrZXldLFxuICAgICAgICAgICAgICAgIGtleToga2V5LFxuICAgICAgICAgICAgICAgIG9iamVjdDogb2JqZWN0LFxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gaGFzTG9vc2UoXykge1xuICAgIHJldHVybiBmdW5jdGlvbiAob2JqZWN0LCBrZXksIHZhbHVlKSB7XG4gICAgICAgIGlmICghXy5oYXMob2JqZWN0LCBrZXkpIHx8ICFVdGlsLmxvb3NlSXMoXy5nZXQob2JqZWN0LCBrZXkpLCB2YWx1ZSkpIHtcbiAgICAgICAgICAgIFV0aWwuZmFpbChfLm1lc3NhZ2VzWzBdLCB7XG4gICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IHZhbHVlLFxuICAgICAgICAgICAgICAgIGFjdHVhbDogb2JqZWN0W2tleV0sXG4gICAgICAgICAgICAgICAga2V5OiBrZXksXG4gICAgICAgICAgICAgICAgb2JqZWN0OiBvYmplY3QsXG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBub3RIYXMoXykgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1sZW4sIG1heC1wYXJhbXNcbiAgICByZXR1cm4gZnVuY3Rpb24gKG9iamVjdCwga2V5LCB2YWx1ZSkge1xuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSAzKSB7XG4gICAgICAgICAgICBpZiAoXy5oYXMob2JqZWN0LCBrZXkpICYmXG4gICAgICAgICAgICAgICAgICAgIFV0aWwuc3RyaWN0SXMoXy5nZXQob2JqZWN0LCBrZXkpLCB2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICBVdGlsLmZhaWwoXy5tZXNzYWdlc1syXSwge1xuICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogdmFsdWUsXG4gICAgICAgICAgICAgICAgICAgIGFjdHVhbDogb2JqZWN0W2tleV0sXG4gICAgICAgICAgICAgICAgICAgIGtleToga2V5LFxuICAgICAgICAgICAgICAgICAgICBvYmplY3Q6IG9iamVjdCxcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKF8uaGFzKG9iamVjdCwga2V5KSkge1xuICAgICAgICAgICAgVXRpbC5mYWlsKF8ubWVzc2FnZXNbM10sIHtcbiAgICAgICAgICAgICAgICBleHBlY3RlZDogdmFsdWUsXG4gICAgICAgICAgICAgICAgYWN0dWFsOiBvYmplY3Rba2V5XSxcbiAgICAgICAgICAgICAgICBrZXk6IGtleSxcbiAgICAgICAgICAgICAgICBvYmplY3Q6IG9iamVjdCxcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIG5vdEhhc0xvb3NlKF8pIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtbGVuLCBtYXgtcGFyYW1zXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChvYmplY3QsIGtleSwgdmFsdWUpIHtcbiAgICAgICAgaWYgKF8uaGFzKG9iamVjdCwga2V5KSAmJiBVdGlsLmxvb3NlSXMoXy5nZXQob2JqZWN0LCBrZXkpLCB2YWx1ZSkpIHtcbiAgICAgICAgICAgIFV0aWwuZmFpbChfLm1lc3NhZ2VzWzJdLCB7XG4gICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IHZhbHVlLFxuICAgICAgICAgICAgICAgIGFjdHVhbDogb2JqZWN0W2tleV0sXG4gICAgICAgICAgICAgICAga2V5OiBrZXksXG4gICAgICAgICAgICAgICAgb2JqZWN0OiBvYmplY3QsXG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBoYXNPd25LZXkob2JqZWN0LCBrZXkpIHsgcmV0dXJuIGhhc093bi5jYWxsKG9iamVjdCwga2V5KSB9XG5mdW5jdGlvbiBoYXNJbktleShvYmplY3QsIGtleSkgeyByZXR1cm4ga2V5IGluIG9iamVjdCB9XG5mdW5jdGlvbiBoYXNJbkNvbGwob2JqZWN0LCBrZXkpIHsgcmV0dXJuIG9iamVjdC5oYXMoa2V5KSB9XG5mdW5jdGlvbiBoYXNPYmplY3RHZXQob2JqZWN0LCBrZXkpIHsgcmV0dXJuIG9iamVjdFtrZXldIH1cbmZ1bmN0aW9uIGhhc0NvbGxHZXQob2JqZWN0LCBrZXkpIHsgcmV0dXJuIG9iamVjdC5nZXQoa2V5KSB9XG5cbmZ1bmN0aW9uIGNyZWF0ZUhhcyhoYXMsIGdldCwgbWVzc2FnZXMpIHtcbiAgICByZXR1cm4ge2hhczogaGFzLCBnZXQ6IGdldCwgbWVzc2FnZXM6IG1lc3NhZ2VzfVxufVxuXG52YXIgaGFzT3duTWV0aG9kcyA9IGNyZWF0ZUhhcyhoYXNPd25LZXksIGhhc09iamVjdEdldCwgW1xuICAgIFwiRXhwZWN0ZWQge29iamVjdH0gdG8gaGF2ZSBvd24ga2V5IHtrZXl9IGVxdWFsIHRvIHtleHBlY3RlZH0sIGJ1dCBmb3VuZCB7YWN0dWFsfVwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1sZW5cbiAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGhhdmUgb3duIGtleSB7ZXhwZWN0ZWR9XCIsXG4gICAgXCJFeHBlY3RlZCB7b2JqZWN0fSB0byBub3QgaGF2ZSBvd24ga2V5IHtrZXl9IGVxdWFsIHRvIHthY3R1YWx9XCIsXG4gICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgaGF2ZSBvd24ga2V5IHtleHBlY3RlZH1cIixcbl0pXG5cbnZhciBoYXNLZXlNZXRob2RzID0gY3JlYXRlSGFzKGhhc0luS2V5LCBoYXNPYmplY3RHZXQsIFtcbiAgICBcIkV4cGVjdGVkIHtvYmplY3R9IHRvIGhhdmUga2V5IHtrZXl9IGVxdWFsIHRvIHtleHBlY3RlZH0sIGJ1dCBmb3VuZCB7YWN0dWFsfVwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1sZW5cbiAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGhhdmUga2V5IHtleHBlY3RlZH1cIixcbiAgICBcIkV4cGVjdGVkIHtvYmplY3R9IHRvIG5vdCBoYXZlIGtleSB7a2V5fSBlcXVhbCB0byB7YWN0dWFsfVwiLFxuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGhhdmUga2V5IHtleHBlY3RlZH1cIixcbl0pXG5cbnZhciBoYXNNZXRob2RzID0gY3JlYXRlSGFzKGhhc0luQ29sbCwgaGFzQ29sbEdldCwgW1xuICAgIFwiRXhwZWN0ZWQge29iamVjdH0gdG8gaGF2ZSBrZXkge2tleX0gZXF1YWwgdG8ge2V4cGVjdGVkfSwgYnV0IGZvdW5kIHthY3R1YWx9XCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LWxlblxuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gaGF2ZSBrZXkge2V4cGVjdGVkfVwiLFxuICAgIFwiRXhwZWN0ZWQge29iamVjdH0gdG8gbm90IGhhdmUga2V5IHtrZXl9IGVxdWFsIHRvIHthY3R1YWx9XCIsXG4gICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgaGF2ZSBrZXkge2V4cGVjdGVkfVwiLFxuXSlcblxuZXhwb3J0cy5oYXNPd24gPSBoYXMoaGFzT3duTWV0aG9kcylcbmV4cG9ydHMubm90SGFzT3duID0gbm90SGFzKGhhc093bk1ldGhvZHMpXG5leHBvcnRzLmhhc093bkxvb3NlID0gaGFzTG9vc2UoaGFzT3duTWV0aG9kcylcbmV4cG9ydHMubm90SGFzT3duTG9vc2UgPSBub3RIYXNMb29zZShoYXNPd25NZXRob2RzKVxuXG5leHBvcnRzLmhhc0tleSA9IGhhcyhoYXNLZXlNZXRob2RzKVxuZXhwb3J0cy5ub3RIYXNLZXkgPSBub3RIYXMoaGFzS2V5TWV0aG9kcylcbmV4cG9ydHMuaGFzS2V5TG9vc2UgPSBoYXNMb29zZShoYXNLZXlNZXRob2RzKVxuZXhwb3J0cy5ub3RIYXNLZXlMb29zZSA9IG5vdEhhc0xvb3NlKGhhc0tleU1ldGhvZHMpXG5cbmV4cG9ydHMuaGFzID0gaGFzKGhhc01ldGhvZHMpXG5leHBvcnRzLm5vdEhhcyA9IG5vdEhhcyhoYXNNZXRob2RzKVxuZXhwb3J0cy5oYXNMb29zZSA9IGhhc0xvb3NlKGhhc01ldGhvZHMpXG5leHBvcnRzLm5vdEhhc0xvb3NlID0gbm90SGFzTG9vc2UoaGFzTWV0aG9kcylcbiIsIlwidXNlIHN0cmljdFwiXG5cbnZhciBVdGlsID0gcmVxdWlyZShcIi4vdXRpbFwiKVxudmFyIG1hdGNoID0gcmVxdWlyZShcIi4uLy4uL21hdGNoXCIpXG5cbmZ1bmN0aW9uIGluY2x1ZGVzKGZ1bmMsIGFsbCwgYXJyYXksIHZhbHVlcykge1xuICAgIC8vIENoZWFwIGNhc2VzIGZpcnN0XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KGFycmF5KSkgcmV0dXJuIGZhbHNlXG4gICAgaWYgKGFycmF5ID09PSB2YWx1ZXMpIHJldHVybiB0cnVlXG4gICAgaWYgKGFsbCAmJiBhcnJheS5sZW5ndGggPCB2YWx1ZXMubGVuZ3RoKSByZXR1cm4gZmFsc2VcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdmFsdWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciB2YWx1ZSA9IHZhbHVlc1tpXVxuICAgICAgICB2YXIgdGVzdCA9IGZhbHNlXG5cbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBhcnJheS5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgaWYgKGZ1bmModmFsdWUsIGFycmF5W2pdKSkge1xuICAgICAgICAgICAgICAgIHRlc3QgPSB0cnVlXG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0ZXN0ICE9PSBhbGwpIHJldHVybiB0ZXN0XG4gICAgfVxuXG4gICAgcmV0dXJuIGFsbFxufVxuXG5mdW5jdGlvbiBkZWZpbmVJbmNsdWRlcyhmdW5jLCBhbGwsIGludmVydCwgbWVzc2FnZSkge1xuICAgIHJldHVybiBmdW5jdGlvbiAoYXJyYXksIHZhbHVlcykge1xuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkoYXJyYXkpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYGFycmF5YCBtdXN0IGJlIGFuIGFycmF5XCIpXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkodmFsdWVzKSkgdmFsdWVzID0gW3ZhbHVlc11cblxuICAgICAgICBpZiAodmFsdWVzLmxlbmd0aCAmJiBpbmNsdWRlcyhmdW5jLCBhbGwsIGFycmF5LCB2YWx1ZXMpID09PSBpbnZlcnQpIHtcbiAgICAgICAgICAgIFV0aWwuZmFpbChtZXNzYWdlLCB7YWN0dWFsOiBhcnJheSwgdmFsdWVzOiB2YWx1ZXN9KVxuICAgICAgICB9XG4gICAgfVxufVxuXG4vKiBlc2xpbnQtZGlzYWJsZSBtYXgtbGVuICovXG5cbmV4cG9ydHMuaW5jbHVkZXMgPSBkZWZpbmVJbmNsdWRlcyhVdGlsLnN0cmljdElzLCB0cnVlLCBmYWxzZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBoYXZlIGFsbCB2YWx1ZXMgaW4ge3ZhbHVlc31cIilcbmV4cG9ydHMuaW5jbHVkZXNEZWVwID0gZGVmaW5lSW5jbHVkZXMobWF0Y2guc3RyaWN0LCB0cnVlLCBmYWxzZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBtYXRjaCBhbGwgdmFsdWVzIGluIHt2YWx1ZXN9XCIpXG5leHBvcnRzLmluY2x1ZGVzTWF0Y2ggPSBkZWZpbmVJbmNsdWRlcyhtYXRjaC5tYXRjaCwgdHJ1ZSwgZmFsc2UsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbWF0Y2ggYWxsIHZhbHVlcyBpbiB7dmFsdWVzfVwiKVxuZXhwb3J0cy5pbmNsdWRlc0FueSA9IGRlZmluZUluY2x1ZGVzKFV0aWwuc3RyaWN0SXMsIGZhbHNlLCBmYWxzZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBoYXZlIGFueSB2YWx1ZSBpbiB7dmFsdWVzfVwiKVxuZXhwb3J0cy5pbmNsdWRlc0FueURlZXAgPSBkZWZpbmVJbmNsdWRlcyhtYXRjaC5zdHJpY3QsIGZhbHNlLCBmYWxzZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBtYXRjaCBhbnkgdmFsdWUgaW4ge3ZhbHVlc31cIilcbmV4cG9ydHMuaW5jbHVkZXNBbnlNYXRjaCA9IGRlZmluZUluY2x1ZGVzKG1hdGNoLm1hdGNoLCBmYWxzZSwgZmFsc2UsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbWF0Y2ggYW55IHZhbHVlIGluIHt2YWx1ZXN9XCIpXG5leHBvcnRzLm5vdEluY2x1ZGVzQWxsID0gZGVmaW5lSW5jbHVkZXMoVXRpbC5zdHJpY3RJcywgdHJ1ZSwgdHJ1ZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgaGF2ZSBhbGwgdmFsdWVzIGluIHt2YWx1ZXN9XCIpXG5leHBvcnRzLm5vdEluY2x1ZGVzQWxsRGVlcCA9IGRlZmluZUluY2x1ZGVzKG1hdGNoLnN0cmljdCwgdHJ1ZSwgdHJ1ZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgbWF0Y2ggYWxsIHZhbHVlcyBpbiB7dmFsdWVzfVwiKVxuZXhwb3J0cy5ub3RJbmNsdWRlc0FsbE1hdGNoID0gZGVmaW5lSW5jbHVkZXMobWF0Y2gubWF0Y2gsIHRydWUsIHRydWUsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IG1hdGNoIGFsbCB2YWx1ZXMgaW4ge3ZhbHVlc31cIilcbmV4cG9ydHMubm90SW5jbHVkZXMgPSBkZWZpbmVJbmNsdWRlcyhVdGlsLnN0cmljdElzLCBmYWxzZSwgdHJ1ZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgaGF2ZSBhbnkgdmFsdWUgaW4ge3ZhbHVlc31cIilcbmV4cG9ydHMubm90SW5jbHVkZXNEZWVwID0gZGVmaW5lSW5jbHVkZXMobWF0Y2guc3RyaWN0LCBmYWxzZSwgdHJ1ZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgbWF0Y2ggYW55IHZhbHVlIGluIHt2YWx1ZXN9XCIpXG5leHBvcnRzLm5vdEluY2x1ZGVzTWF0Y2ggPSBkZWZpbmVJbmNsdWRlcyhtYXRjaC5tYXRjaCwgZmFsc2UsIHRydWUsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IG1hdGNoIGFueSB2YWx1ZSBpbiB7dmFsdWVzfVwiKVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxudmFyIFV0aWwgPSByZXF1aXJlKFwiLi91dGlsXCIpXG5cbmZ1bmN0aW9uIGdldE5hbWUoZnVuYykge1xuICAgIHZhciBuYW1lID0gZnVuYy5uYW1lXG5cbiAgICBpZiAobmFtZSA9PSBudWxsKSBuYW1lID0gZnVuYy5kaXNwbGF5TmFtZVxuICAgIGlmIChuYW1lKSByZXR1cm4gVXRpbC5lc2NhcGUobmFtZSlcbiAgICByZXR1cm4gXCI8YW5vbnltb3VzPlwiXG59XG5cbmV4cG9ydHMudGhyb3dzID0gZnVuY3Rpb24gKFR5cGUsIGNhbGxiYWNrKSB7XG4gICAgaWYgKGNhbGxiYWNrID09IG51bGwpIHtcbiAgICAgICAgY2FsbGJhY2sgPSBUeXBlXG4gICAgICAgIFR5cGUgPSBudWxsXG4gICAgfVxuXG4gICAgaWYgKFR5cGUgIT0gbnVsbCAmJiB0eXBlb2YgVHlwZSAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJgVHlwZWAgbXVzdCBiZSBhIGZ1bmN0aW9uIGlmIHBhc3NlZFwiKVxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYGNhbGxiYWNrYCBtdXN0IGJlIGEgZnVuY3Rpb25cIilcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgICBjYWxsYmFjaygpIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgY2FsbGJhY2stcmV0dXJuXG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBpZiAoVHlwZSAhPSBudWxsICYmICEoZSBpbnN0YW5jZW9mIFR5cGUpKSB7XG4gICAgICAgICAgICBVdGlsLmZhaWwoXG4gICAgICAgICAgICAgICAgXCJFeHBlY3RlZCBjYWxsYmFjayB0byB0aHJvdyBhbiBpbnN0YW5jZSBvZiBcIiArIGdldE5hbWUoVHlwZSkgK1xuICAgICAgICAgICAgICAgIFwiLCBidXQgZm91bmQge2FjdHVhbH1cIixcbiAgICAgICAgICAgICAgICB7YWN0dWFsOiBlfSlcbiAgICAgICAgfVxuICAgICAgICByZXR1cm5cbiAgICB9XG5cbiAgICB0aHJvdyBuZXcgVXRpbC5Bc3NlcnRpb25FcnJvcihcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIHRocm93XCIpXG59XG5cbmZ1bmN0aW9uIHRocm93c01hdGNoVGVzdChtYXRjaGVyLCBlKSB7XG4gICAgaWYgKHR5cGVvZiBtYXRjaGVyID09PSBcInN0cmluZ1wiKSByZXR1cm4gZS5tZXNzYWdlID09PSBtYXRjaGVyXG4gICAgaWYgKHR5cGVvZiBtYXRjaGVyID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiAhIW1hdGNoZXIoZSlcbiAgICBpZiAobWF0Y2hlciBpbnN0YW5jZW9mIFJlZ0V4cCkgcmV0dXJuICEhbWF0Y2hlci50ZXN0KGUubWVzc2FnZSlcblxuICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMobWF0Y2hlcilcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIga2V5ID0ga2V5c1tpXVxuXG4gICAgICAgIGlmICghKGtleSBpbiBlKSB8fCAhVXRpbC5zdHJpY3RJcyhtYXRjaGVyW2tleV0sIGVba2V5XSkpIHJldHVybiBmYWxzZVxuICAgIH1cblxuICAgIHJldHVybiB0cnVlXG59XG5cbmZ1bmN0aW9uIGlzUGxhaW5PYmplY3Qob2JqZWN0KSB7XG4gICAgcmV0dXJuIG9iamVjdCA9PSBudWxsIHx8IE9iamVjdC5nZXRQcm90b3R5cGVPZihvYmplY3QpID09PSBPYmplY3QucHJvdG90eXBlXG59XG5cbmV4cG9ydHMudGhyb3dzTWF0Y2ggPSBmdW5jdGlvbiAobWF0Y2hlciwgY2FsbGJhY2spIHtcbiAgICBpZiAodHlwZW9mIG1hdGNoZXIgIT09IFwic3RyaW5nXCIgJiZcbiAgICAgICAgICAgIHR5cGVvZiBtYXRjaGVyICE9PSBcImZ1bmN0aW9uXCIgJiZcbiAgICAgICAgICAgICEobWF0Y2hlciBpbnN0YW5jZW9mIFJlZ0V4cCkgJiZcbiAgICAgICAgICAgICFpc1BsYWluT2JqZWN0KG1hdGNoZXIpKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgICAgICBcImBtYXRjaGVyYCBtdXN0IGJlIGEgc3RyaW5nLCBmdW5jdGlvbiwgUmVnRXhwLCBvciBvYmplY3RcIilcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBjYWxsYmFja2AgbXVzdCBiZSBhIGZ1bmN0aW9uXCIpXG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgICAgY2FsbGJhY2soKSAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGNhbGxiYWNrLXJldHVyblxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgaWYgKCF0aHJvd3NNYXRjaFRlc3QobWF0Y2hlciwgZSkpIHtcbiAgICAgICAgICAgIFV0aWwuZmFpbChcbiAgICAgICAgICAgICAgICBcIkV4cGVjdGVkIGNhbGxiYWNrIHRvICB0aHJvdyBhbiBlcnJvciB0aGF0IG1hdGNoZXMgXCIgK1xuICAgICAgICAgICAgICAgIFwie2V4cGVjdGVkfSwgYnV0IGZvdW5kIHthY3R1YWx9XCIsXG4gICAgICAgICAgICAgICAge2V4cGVjdGVkOiBtYXRjaGVyLCBhY3R1YWw6IGV9KVxuICAgICAgICB9XG4gICAgICAgIHJldHVyblxuICAgIH1cblxuICAgIHRocm93IG5ldyBVdGlsLkFzc2VydGlvbkVycm9yKFwiRXhwZWN0ZWQgY2FsbGJhY2sgdG8gdGhyb3cuXCIpXG59XG4iLCJcInVzZSBzdHJpY3RcIlxuXG52YXIgZmFpbCA9IHJlcXVpcmUoXCIuL3V0aWxcIikuZmFpbFxuXG5leHBvcnRzLm9rID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAoIXgpIGZhaWwoXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBiZSB0cnV0aHlcIiwge2FjdHVhbDogeH0pXG59XG5cbmV4cG9ydHMubm90T2sgPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh4KSBmYWlsKFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gYmUgZmFsc3lcIiwge2FjdHVhbDogeH0pXG59XG5cbmV4cG9ydHMuaXNCb29sZWFuID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAodHlwZW9mIHggIT09IFwiYm9vbGVhblwiKSB7XG4gICAgICAgIGZhaWwoXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBiZSBhIGJvb2xlYW5cIiwge2FjdHVhbDogeH0pXG4gICAgfVxufVxuXG5leHBvcnRzLm5vdEJvb2xlYW4gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh0eXBlb2YgeCA9PT0gXCJib29sZWFuXCIpIHtcbiAgICAgICAgZmFpbChcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBiZSBhIGJvb2xlYW5cIiwge2FjdHVhbDogeH0pXG4gICAgfVxufVxuXG5leHBvcnRzLmlzRnVuY3Rpb24gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh0eXBlb2YgeCAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIGZhaWwoXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBiZSBhIGZ1bmN0aW9uXCIsIHthY3R1YWw6IHh9KVxuICAgIH1cbn1cblxuZXhwb3J0cy5ub3RGdW5jdGlvbiA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHR5cGVvZiB4ID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgZmFpbChcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBiZSBhIGZ1bmN0aW9uXCIsIHthY3R1YWw6IHh9KVxuICAgIH1cbn1cblxuZXhwb3J0cy5pc051bWJlciA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHR5cGVvZiB4ICE9PSBcIm51bWJlclwiKSB7XG4gICAgICAgIGZhaWwoXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBiZSBhIG51bWJlclwiLCB7YWN0dWFsOiB4fSlcbiAgICB9XG59XG5cbmV4cG9ydHMubm90TnVtYmVyID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAodHlwZW9mIHggPT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgZmFpbChcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBiZSBhIG51bWJlclwiLCB7YWN0dWFsOiB4fSlcbiAgICB9XG59XG5cbmV4cG9ydHMuaXNPYmplY3QgPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh0eXBlb2YgeCAhPT0gXCJvYmplY3RcIiB8fCB4ID09IG51bGwpIHtcbiAgICAgICAgZmFpbChcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGJlIGFuIG9iamVjdFwiLCB7YWN0dWFsOiB4fSlcbiAgICB9XG59XG5cbmV4cG9ydHMubm90T2JqZWN0ID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAodHlwZW9mIHggPT09IFwib2JqZWN0XCIgJiYgeCAhPSBudWxsKSB7XG4gICAgICAgIGZhaWwoXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgYmUgYW4gb2JqZWN0XCIsIHthY3R1YWw6IHh9KVxuICAgIH1cbn1cblxuZXhwb3J0cy5pc1N0cmluZyA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHR5cGVvZiB4ICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIGZhaWwoXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBiZSBhIHN0cmluZ1wiLCB7YWN0dWFsOiB4fSlcbiAgICB9XG59XG5cbmV4cG9ydHMubm90U3RyaW5nID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAodHlwZW9mIHggPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgZmFpbChcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBiZSBhIHN0cmluZ1wiLCB7YWN0dWFsOiB4fSlcbiAgICB9XG59XG5cbmV4cG9ydHMuaXNTeW1ib2wgPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh0eXBlb2YgeCAhPT0gXCJzeW1ib2xcIikge1xuICAgICAgICBmYWlsKFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gYmUgYSBzeW1ib2xcIiwge2FjdHVhbDogeH0pXG4gICAgfVxufVxuXG5leHBvcnRzLm5vdFN5bWJvbCA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHR5cGVvZiB4ID09PSBcInN5bWJvbFwiKSB7XG4gICAgICAgIGZhaWwoXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgYmUgYSBzeW1ib2xcIiwge2FjdHVhbDogeH0pXG4gICAgfVxufVxuXG5leHBvcnRzLmV4aXN0cyA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHggPT0gbnVsbCkge1xuICAgICAgICBmYWlsKFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gZXhpc3RcIiwge2FjdHVhbDogeH0pXG4gICAgfVxufVxuXG5leHBvcnRzLm5vdEV4aXN0cyA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHggIT0gbnVsbCkge1xuICAgICAgICBmYWlsKFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGV4aXN0XCIsIHthY3R1YWw6IHh9KVxuICAgIH1cbn1cblxuZXhwb3J0cy5pc0FycmF5ID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkoeCkpIHtcbiAgICAgICAgZmFpbChcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGJlIGFuIGFycmF5XCIsIHthY3R1YWw6IHh9KVxuICAgIH1cbn1cblxuZXhwb3J0cy5ub3RBcnJheSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoeCkpIHtcbiAgICAgICAgZmFpbChcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBiZSBhbiBhcnJheVwiLCB7YWN0dWFsOiB4fSlcbiAgICB9XG59XG5cbmV4cG9ydHMuaXMgPSBmdW5jdGlvbiAoVHlwZSwgb2JqZWN0KSB7XG4gICAgaWYgKHR5cGVvZiBUeXBlICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBUeXBlYCBtdXN0IGJlIGEgZnVuY3Rpb25cIilcbiAgICB9XG5cbiAgICBpZiAoIShvYmplY3QgaW5zdGFuY2VvZiBUeXBlKSkge1xuICAgICAgICBmYWlsKFwiRXhwZWN0ZWQge29iamVjdH0gdG8gYmUgYW4gaW5zdGFuY2Ugb2Yge2V4cGVjdGVkfVwiLCB7XG4gICAgICAgICAgICBleHBlY3RlZDogVHlwZSxcbiAgICAgICAgICAgIGFjdHVhbDogb2JqZWN0LmNvbnN0cnVjdG9yLFxuICAgICAgICAgICAgb2JqZWN0OiBvYmplY3QsXG4gICAgICAgIH0pXG4gICAgfVxufVxuXG5leHBvcnRzLm5vdCA9IGZ1bmN0aW9uIChUeXBlLCBvYmplY3QpIHtcbiAgICBpZiAodHlwZW9mIFR5cGUgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYFR5cGVgIG11c3QgYmUgYSBmdW5jdGlvblwiKVxuICAgIH1cblxuICAgIGlmIChvYmplY3QgaW5zdGFuY2VvZiBUeXBlKSB7XG4gICAgICAgIGZhaWwoXCJFeHBlY3RlZCB7b2JqZWN0fSB0byBub3QgYmUgYW4gaW5zdGFuY2Ugb2Yge2V4cGVjdGVkfVwiLCB7XG4gICAgICAgICAgICBleHBlY3RlZDogVHlwZSxcbiAgICAgICAgICAgIG9iamVjdDogb2JqZWN0LFxuICAgICAgICB9KVxuICAgIH1cbn1cbiIsIlwidXNlIHN0cmljdFwiXG5cbnZhciBpbnNwZWN0ID0gcmVxdWlyZShcIi4uL3JlcGxhY2VkL2luc3BlY3RcIilcbnZhciBnZXRTdGFjayA9IHJlcXVpcmUoXCIuLi91dGlsXCIpLmdldFN0YWNrXG52YXIgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eVxudmFyIEFzc2VydGlvbkVycm9yXG5cbnRyeSB7XG4gICAgQXNzZXJ0aW9uRXJyb3IgPSBuZXcgRnVuY3Rpb24oWyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLW5ldy1mdW5jXG4gICAgICAgIFwiJ3VzZSBzdHJpY3QnO1wiLFxuICAgICAgICBcImNsYXNzIEFzc2VydGlvbkVycm9yIGV4dGVuZHMgRXJyb3Ige1wiLFxuICAgICAgICBcIiAgICBjb25zdHJ1Y3RvcihtZXNzYWdlLCBleHBlY3RlZCwgYWN0dWFsKSB7XCIsXG4gICAgICAgIFwiICAgICAgICBzdXBlcihtZXNzYWdlKVwiLFxuICAgICAgICBcIiAgICAgICAgdGhpcy5leHBlY3RlZCA9IGV4cGVjdGVkXCIsXG4gICAgICAgIFwiICAgICAgICB0aGlzLmFjdHVhbCA9IGFjdHVhbFwiLFxuICAgICAgICBcIiAgICB9XCIsXG4gICAgICAgIFwiXCIsXG4gICAgICAgIFwiICAgIGdldCBuYW1lKCkge1wiLFxuICAgICAgICBcIiAgICAgICAgcmV0dXJuICdBc3NlcnRpb25FcnJvcidcIixcbiAgICAgICAgXCIgICAgfVwiLFxuICAgICAgICBcIn1cIixcbiAgICAgICAgLy8gY2hlY2sgbmF0aXZlIHN1YmNsYXNzaW5nIHN1cHBvcnRcbiAgICAgICAgXCJuZXcgQXNzZXJ0aW9uRXJyb3IoJ21lc3NhZ2UnLCAxLCAyKVwiLFxuICAgICAgICBcInJldHVybiBBc3NlcnRpb25FcnJvclwiLFxuICAgIF0uam9pbihcIlxcblwiKSkoKVxufSBjYXRjaCAoZSkge1xuICAgIEFzc2VydGlvbkVycm9yID0gdHlwZW9mIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlID09PSBcImZ1bmN0aW9uXCJcbiAgICAgICAgPyBmdW5jdGlvbiBBc3NlcnRpb25FcnJvcihtZXNzYWdlLCBleHBlY3RlZCwgYWN0dWFsKSB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2UgPSBtZXNzYWdlIHx8IFwiXCJcbiAgICAgICAgICAgIHRoaXMuZXhwZWN0ZWQgPSBleHBlY3RlZFxuICAgICAgICAgICAgdGhpcy5hY3R1YWwgPSBhY3R1YWxcbiAgICAgICAgICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIHRoaXMuY29uc3RydWN0b3IpXG4gICAgICAgIH1cbiAgICAgICAgOiBmdW5jdGlvbiBBc3NlcnRpb25FcnJvcihtZXNzYWdlLCBleHBlY3RlZCwgYWN0dWFsKSB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2UgPSBtZXNzYWdlIHx8IFwiXCJcbiAgICAgICAgICAgIHRoaXMuZXhwZWN0ZWQgPSBleHBlY3RlZFxuICAgICAgICAgICAgdGhpcy5hY3R1YWwgPSBhY3R1YWxcbiAgICAgICAgICAgIHRoaXMuc3RhY2sgPSBnZXRTdGFjayhlKVxuICAgICAgICB9XG5cbiAgICBBc3NlcnRpb25FcnJvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEVycm9yLnByb3RvdHlwZSlcblxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShBc3NlcnRpb25FcnJvci5wcm90b3R5cGUsIFwiY29uc3RydWN0b3JcIiwge1xuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgdmFsdWU6IEFzc2VydGlvbkVycm9yLFxuICAgIH0pXG5cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoQXNzZXJ0aW9uRXJyb3IucHJvdG90eXBlLCBcIm5hbWVcIiwge1xuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgdmFsdWU6IFwiQXNzZXJ0aW9uRXJyb3JcIixcbiAgICB9KVxufVxuXG5leHBvcnRzLkFzc2VydGlvbkVycm9yID0gQXNzZXJ0aW9uRXJyb3JcblxuLyogZXNsaW50LWRpc2FibGUgbm8tc2VsZi1jb21wYXJlICovXG4vLyBGb3IgYmV0dGVyIE5hTiBoYW5kbGluZ1xuZXhwb3J0cy5zdHJpY3RJcyA9IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgcmV0dXJuIGEgPT09IGIgfHwgYSAhPT0gYSAmJiBiICE9PSBiXG59XG5cbmV4cG9ydHMubG9vc2VJcyA9IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgcmV0dXJuIGEgPT0gYiB8fCBhICE9PSBhICYmIGIgIT09IGIgLy8gZXNsaW50LWRpc2FibGUtbGluZSBlcWVxZXFcbn1cblxuLyogZXNsaW50LWVuYWJsZSBuby1zZWxmLWNvbXBhcmUgKi9cblxudmFyIHRlbXBsYXRlUmVnZXhwID0gLyguPylcXHsoLis/KVxcfS9nXG5cbmV4cG9ydHMuZXNjYXBlID0gZnVuY3Rpb24gKHN0cmluZykge1xuICAgIGlmICh0eXBlb2Ygc3RyaW5nICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJgc3RyaW5nYCBtdXN0IGJlIGEgc3RyaW5nXCIpXG4gICAgfVxuXG4gICAgcmV0dXJuIHN0cmluZy5yZXBsYWNlKHRlbXBsYXRlUmVnZXhwLCBmdW5jdGlvbiAobSwgcHJlKSB7XG4gICAgICAgIHJldHVybiBwcmUgKyBcIlxcXFxcIiArIG0uc2xpY2UoMSlcbiAgICB9KVxufVxuXG4vLyBUaGlzIGZvcm1hdHMgdGhlIGFzc2VydGlvbiBlcnJvciBtZXNzYWdlcy5cbmV4cG9ydHMuZm9ybWF0ID0gZnVuY3Rpb24gKG1lc3NhZ2UsIGFyZ3MsIHByZXR0aWZ5KSB7XG4gICAgaWYgKHByZXR0aWZ5ID09IG51bGwpIHByZXR0aWZ5ID0gaW5zcGVjdFxuXG4gICAgaWYgKHR5cGVvZiBtZXNzYWdlICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJgbWVzc2FnZWAgbXVzdCBiZSBhIHN0cmluZ1wiKVxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgYXJncyAhPT0gXCJvYmplY3RcIiB8fCBhcmdzID09PSBudWxsKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJgYXJnc2AgbXVzdCBiZSBhbiBvYmplY3RcIilcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIHByZXR0aWZ5ICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBwcmV0dGlmeWAgbXVzdCBiZSBhIGZ1bmN0aW9uIGlmIHBhc3NlZFwiKVxuICAgIH1cblxuICAgIHJldHVybiBtZXNzYWdlLnJlcGxhY2UodGVtcGxhdGVSZWdleHAsIGZ1bmN0aW9uIChtLCBwcmUsIHByb3ApIHtcbiAgICAgICAgaWYgKHByZSA9PT0gXCJcXFxcXCIpIHtcbiAgICAgICAgICAgIHJldHVybiBtLnNsaWNlKDEpXG4gICAgICAgIH0gZWxzZSBpZiAoaGFzT3duLmNhbGwoYXJncywgcHJvcCkpIHtcbiAgICAgICAgICAgIHJldHVybiBwcmUgKyBwcmV0dGlmeShhcmdzW3Byb3BdLCB7ZGVwdGg6IDV9KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHByZSArIG1cbiAgICAgICAgfVxuICAgIH0pXG59XG5cbmV4cG9ydHMuZmFpbCA9IGZ1bmN0aW9uIChtZXNzYWdlLCBhcmdzLCBwcmV0dGlmeSkge1xuICAgIGlmIChhcmdzID09IG51bGwpIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihtZXNzYWdlKVxuICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihcbiAgICAgICAgZXhwb3J0cy5mb3JtYXQobWVzc2FnZSwgYXJncywgcHJldHRpZnkpLFxuICAgICAgICBhcmdzLmV4cGVjdGVkLFxuICAgICAgICBhcmdzLmFjdHVhbClcbn1cblxuLy8gVGhlIGJhc2ljIGFzc2VydCwgbGlrZSBgYXNzZXJ0Lm9rYCwgYnV0IGdpdmVzIHlvdSBhbiBvcHRpb25hbCBtZXNzYWdlLlxuZXhwb3J0cy5hc3NlcnQgPSBmdW5jdGlvbiAodGVzdCwgbWVzc2FnZSkge1xuICAgIGlmICghdGVzdCkgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKG1lc3NhZ2UpXG59XG4iLCJcInVzZSBzdHJpY3RcIlxuXG4vKipcbiAqIFRoZSB3aGl0ZWxpc3QgaXMgYWN0dWFsbHkgc3RvcmVkIGFzIGEgdHJlZSBmb3IgZmFzdGVyIGxvb2t1cCB0aW1lcyB3aGVuIHRoZXJlXG4gKiBhcmUgbXVsdGlwbGUgc2VsZWN0b3JzLiBPYmplY3RzIGNhbid0IGJlIHVzZWQgZm9yIHRoZSBub2Rlcywgd2hlcmUga2V5c1xuICogcmVwcmVzZW50IHZhbHVlcyBhbmQgdmFsdWVzIHJlcHJlc2VudCBjaGlsZHJlbiwgYmVjYXVzZSByZWd1bGFyIGV4cHJlc3Npb25zXG4gKiBhcmVuJ3QgcG9zc2libGUgdG8gdXNlLlxuICovXG5cbmZ1bmN0aW9uIGlzRXF1aXZhbGVudChlbnRyeSwgaXRlbSkge1xuICAgIGlmICh0eXBlb2YgZW50cnkgPT09IFwic3RyaW5nXCIgJiYgdHlwZW9mIGl0ZW0gPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgcmV0dXJuIGVudHJ5ID09PSBpdGVtXG4gICAgfSBlbHNlIGlmIChlbnRyeSBpbnN0YW5jZW9mIFJlZ0V4cCAmJiBpdGVtIGluc3RhbmNlb2YgUmVnRXhwKSB7XG4gICAgICAgIHJldHVybiBlbnRyeS50b1N0cmluZygpID09PSBpdGVtLnRvU3RyaW5nKClcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG59XG5cbmZ1bmN0aW9uIG1hdGNoZXMoZW50cnksIGl0ZW0pIHtcbiAgICBpZiAodHlwZW9mIGVudHJ5ID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIHJldHVybiBlbnRyeSA9PT0gaXRlbVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBlbnRyeS50ZXN0KGl0ZW0pXG4gICAgfVxufVxuXG5mdW5jdGlvbiBPbmx5KHZhbHVlKSB7XG4gICAgdGhpcy52YWx1ZSA9IHZhbHVlXG4gICAgdGhpcy5jaGlsZHJlbiA9IHVuZGVmaW5lZFxufVxuXG5mdW5jdGlvbiBmaW5kRXF1aXZhbGVudChub2RlLCBlbnRyeSkge1xuICAgIGlmIChub2RlLmNoaWxkcmVuID09IG51bGwpIHJldHVybiB1bmRlZmluZWRcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbm9kZS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgY2hpbGQgPSBub2RlLmNoaWxkcmVuW2ldXG5cbiAgICAgICAgaWYgKGlzRXF1aXZhbGVudChjaGlsZC52YWx1ZSwgZW50cnkpKSByZXR1cm4gY2hpbGRcbiAgICB9XG5cbiAgICByZXR1cm4gdW5kZWZpbmVkXG59XG5cbmZ1bmN0aW9uIGZpbmRNYXRjaGVzKG5vZGUsIGVudHJ5KSB7XG4gICAgaWYgKG5vZGUuY2hpbGRyZW4gPT0gbnVsbCkgcmV0dXJuIHVuZGVmaW5lZFxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBub2RlLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBjaGlsZCA9IG5vZGUuY2hpbGRyZW5baV1cblxuICAgICAgICBpZiAobWF0Y2hlcyhjaGlsZC52YWx1ZSwgZW50cnkpKSByZXR1cm4gY2hpbGRcbiAgICB9XG5cbiAgICByZXR1cm4gdW5kZWZpbmVkXG59XG5cbi8qKlxuICogQWRkIGEgbnVtYmVyIG9mIHNlbGVjdG9yc1xuICpcbiAqIEB0aGlzIHtUZXN0fVxuICovXG5leHBvcnRzLm9ubHlBZGQgPSBmdW5jdGlvbiAoLyogLi4uc2VsZWN0b3JzICovKSB7XG4gICAgdGhpcy5vbmx5ID0gbmV3IE9ubHkoKVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHNlbGVjdG9yID0gYXJndW1lbnRzW2ldXG5cbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHNlbGVjdG9yKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICAgICAgICAgICBcIkV4cGVjdGVkIHNlbGVjdG9yIFwiICsgaSArIFwiIHRvIGJlIGFuIGFycmF5XCIpXG4gICAgICAgIH1cblxuICAgICAgICBvbmx5QWRkU2luZ2xlKHRoaXMub25seSwgc2VsZWN0b3IsIGkpXG4gICAgfVxufVxuXG5mdW5jdGlvbiBvbmx5QWRkU2luZ2xlKG5vZGUsIHNlbGVjdG9yLCBpbmRleCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2VsZWN0b3IubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGVudHJ5ID0gc2VsZWN0b3JbaV1cblxuICAgICAgICAvLyBTdHJpbmdzIGFuZCByZWd1bGFyIGV4cHJlc3Npb25zIGFyZSB0aGUgb25seSB0aGluZ3MgYWxsb3dlZC5cbiAgICAgICAgaWYgKHR5cGVvZiBlbnRyeSAhPT0gXCJzdHJpbmdcIiAmJiAhKGVudHJ5IGluc3RhbmNlb2YgUmVnRXhwKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICAgICAgICAgICBcIlNlbGVjdG9yIFwiICsgaW5kZXggKyBcIiBtdXN0IGNvbnNpc3Qgb2Ygb25seSBzdHJpbmdzIGFuZC9vciBcIiArXG4gICAgICAgICAgICAgICAgXCJyZWd1bGFyIGV4cHJlc3Npb25zXCIpXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgY2hpbGQgPSBmaW5kRXF1aXZhbGVudChub2RlLCBlbnRyeSlcblxuICAgICAgICBpZiAoY2hpbGQgPT0gbnVsbCkge1xuICAgICAgICAgICAgY2hpbGQgPSBuZXcgT25seShlbnRyeSlcbiAgICAgICAgICAgIGlmIChub2RlLmNoaWxkcmVuID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBub2RlLmNoaWxkcmVuID0gW2NoaWxkXVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBub2RlLmNoaWxkcmVuLnB1c2goY2hpbGQpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBub2RlID0gY2hpbGRcbiAgICB9XG59XG5cbi8qKlxuICogVGhpcyBjaGVja3MgaWYgdGhlIHRlc3Qgd2FzIHdoaXRlbGlzdGVkIGluIGEgYHQub25seSgpYCBjYWxsLCBvciBmb3JcbiAqIGNvbnZlbmllbmNlLCByZXR1cm5zIGB0cnVlYCBpZiBgdC5vbmx5KClgIHdhcyBuZXZlciBjYWxsZWQuXG4gKi9cbmV4cG9ydHMuaXNPbmx5ID0gZnVuY3Rpb24gKHRlc3QpIHtcbiAgICB2YXIgcGF0aCA9IFtdXG4gICAgdmFyIGkgPSAwXG5cbiAgICB3aGlsZSAodGVzdC5yb290ICE9PSB0ZXN0ICYmIHRlc3Qub25seSA9PSBudWxsKSB7XG4gICAgICAgIHBhdGgucHVzaCh0ZXN0Lm5hbWUpXG4gICAgICAgIHRlc3QgPSB0ZXN0LnBhcmVudFxuICAgICAgICBpKytcbiAgICB9XG5cbiAgICAvLyBJZiB0aGVyZSBpc24ndCBhbnkgYG9ubHlgIGFjdGl2ZSwgdGhlbiBsZXQncyBza2lwIHRoZSBjaGVjayBhbmQgcmV0dXJuXG4gICAgLy8gYHRydWVgIGZvciBjb252ZW5pZW5jZS5cbiAgICB2YXIgb25seSA9IHRlc3Qub25seVxuXG4gICAgaWYgKG9ubHkgIT0gbnVsbCkge1xuICAgICAgICB3aGlsZSAoaSAhPT0gMCkge1xuICAgICAgICAgICAgb25seSA9IGZpbmRNYXRjaGVzKG9ubHksIHBhdGhbLS1pXSlcbiAgICAgICAgICAgIGlmIChvbmx5ID09IG51bGwpIHJldHVybiBmYWxzZVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWVcbn1cbiIsIlwidXNlIHN0cmljdFwiXG5cbnZhciBtZXRob2RzID0gcmVxdWlyZShcIi4uL21ldGhvZHNcIilcblxuLyoqXG4gKiBBbGwgdGhlIHJlcG9ydCB0eXBlcy4gVGhlIG9ubHkgcmVhc29uIHRoZXJlIGFyZSBtb3JlIHRoYW4gdHdvIHR5cGVzIChub3JtYWxcbiAqIGFuZCBob29rKSBpcyBmb3IgdGhlIHVzZXIncyBiZW5lZml0IChkZXYgdG9vbHMsIGB1dGlsLmluc3BlY3RgLCBldGMuKVxuICovXG5cbnZhciBUeXBlcyA9IGV4cG9ydHMuVHlwZXMgPSBPYmplY3QuZnJlZXplKHtcbiAgICBTdGFydDogMCxcbiAgICBFbnRlcjogMSxcbiAgICBMZWF2ZTogMixcbiAgICBQYXNzOiAzLFxuICAgIEZhaWw6IDQsXG4gICAgU2tpcDogNSxcbiAgICBFbmQ6IDYsXG4gICAgRXJyb3I6IDcsXG5cbiAgICAvLyBOb3RlIHRoYXQgYEhvb2tgIGlzIGRlbm90ZWQgYnkgdGhlIDR0aCBiaXQgc2V0LCB0byBzYXZlIHNvbWUgc3BhY2UgKGFuZFxuICAgIC8vIHRvIHNpbXBsaWZ5IHRoZSB0eXBlIHJlcHJlc2VudGF0aW9uKS5cbiAgICBIb29rOiA4LFxuICAgIEJlZm9yZUFsbDogOCB8IDAsXG4gICAgQmVmb3JlRWFjaDogOCB8IDEsXG4gICAgQWZ0ZXJFYWNoOiA4IHwgMixcbiAgICBBZnRlckFsbDogOCB8IDMsXG59KVxuXG5leHBvcnRzLlJlcG9ydCA9IFJlcG9ydFxuZnVuY3Rpb24gUmVwb3J0KHR5cGUpIHtcbiAgICB0aGlzLl8gPSB0eXBlXG59XG5cbi8vIEF2b2lkIGEgcmVjdXJzaXZlIGNhbGwgd2hlbiBgaW5zcGVjdGBpbmcgYSByZXN1bHQgd2hpbGUgc3RpbGwga2VlcGluZyBpdFxuLy8gc3R5bGVkIGxpa2UgaXQgd291bGQgYmUgbm9ybWFsbHkuIEVhY2ggdHlwZSB1c2VzIGEgbmFtZWQgc2luZ2xldG9uIGZhY3RvcnkgdG9cbi8vIGVuc3VyZSBlbmdpbmVzIHNob3cgdGhlIGNvcnJlY3QgYG5hbWVgL2BkaXNwbGF5TmFtZWAgZm9yIHRoZSB0eXBlLlxuZnVuY3Rpb24gaW5pdEluc3BlY3QoaW5zcGVjdCwgcmVwb3J0KSB7XG4gICAgdmFyIHR5cGUgPSByZXBvcnQuX1xuXG4gICAgaWYgKHR5cGUgJiBUeXBlcy5Ib29rKSB7XG4gICAgICAgIGluc3BlY3Quc3RhZ2UgPSByZXBvcnQuc3RhZ2VcbiAgICB9XG5cbiAgICBpZiAodHlwZSAhPT0gVHlwZXMuU3RhcnQgJiZcbiAgICAgICAgICAgIHR5cGUgIT09IFR5cGVzLkVuZCAmJlxuICAgICAgICAgICAgdHlwZSAhPT0gVHlwZXMuRXJyb3IpIHtcbiAgICAgICAgaW5zcGVjdC5wYXRoID0gcmVwb3J0LnBhdGhcbiAgICB9XG5cbiAgICBpZiAodHlwZSAmIFR5cGVzLkhvb2spIHtcbiAgICAgICAgaW5zcGVjdC5yb290UGF0aCA9IHJlcG9ydC5yb290UGF0aFxuICAgIH1cblxuICAgIC8vIE9ubHkgYWRkIHRoZSByZWxldmFudCBwcm9wZXJ0aWVzXG4gICAgaWYgKHR5cGUgPT09IFR5cGVzLkZhaWwgfHxcbiAgICAgICAgICAgIHR5cGUgPT09IFR5cGVzLkVycm9yIHx8XG4gICAgICAgICAgICB0eXBlICYgVHlwZXMuSG9vaykge1xuICAgICAgICBpbnNwZWN0LnZhbHVlID0gcmVwb3J0LnZhbHVlXG4gICAgfVxuXG4gICAgaWYgKHR5cGUgPT09IFR5cGVzLkVudGVyIHx8XG4gICAgICAgICAgICB0eXBlID09PSBUeXBlcy5QYXNzIHx8XG4gICAgICAgICAgICB0eXBlID09PSBUeXBlcy5GYWlsKSB7XG4gICAgICAgIGluc3BlY3QuZHVyYXRpb24gPSByZXBvcnQuZHVyYXRpb25cbiAgICAgICAgaW5zcGVjdC5zbG93ID0gcmVwb3J0LnNsb3dcbiAgICB9XG59XG5cbm1ldGhvZHMoUmVwb3J0LCB7XG4gICAgLy8gVGhlIHJlcG9ydCB0eXBlc1xuICAgIGdldCBpc1N0YXJ0KCkgeyByZXR1cm4gdGhpcy5fID09PSBUeXBlcy5TdGFydCB9LFxuICAgIGdldCBpc0VudGVyKCkgeyByZXR1cm4gdGhpcy5fID09PSBUeXBlcy5FbnRlciB9LFxuICAgIGdldCBpc0xlYXZlKCkgeyByZXR1cm4gdGhpcy5fID09PSBUeXBlcy5MZWF2ZSB9LFxuICAgIGdldCBpc1Bhc3MoKSB7IHJldHVybiB0aGlzLl8gPT09IFR5cGVzLlBhc3MgfSxcbiAgICBnZXQgaXNGYWlsKCkgeyByZXR1cm4gdGhpcy5fID09PSBUeXBlcy5GYWlsIH0sXG4gICAgZ2V0IGlzU2tpcCgpIHsgcmV0dXJuIHRoaXMuXyA9PT0gVHlwZXMuU2tpcCB9LFxuICAgIGdldCBpc0VuZCgpIHsgcmV0dXJuIHRoaXMuXyA9PT0gVHlwZXMuRW5kIH0sXG4gICAgZ2V0IGlzRXJyb3IoKSB7IHJldHVybiB0aGlzLl8gPT09IFR5cGVzLkVycm9yIH0sXG4gICAgZ2V0IGlzSG9vaygpIHsgcmV0dXJuICh0aGlzLl8gJiBUeXBlcy5Ib29rKSAhPT0gMCB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGEgc3RyaW5naWZpZWQgZGVzY3JpcHRpb24gb2YgdGhlIHR5cGUuXG4gICAgICovXG4gICAgZ2V0IHR5cGUoKSB7XG4gICAgICAgIHN3aXRjaCAodGhpcy5fKSB7XG4gICAgICAgIGNhc2UgVHlwZXMuU3RhcnQ6IHJldHVybiBcInN0YXJ0XCJcbiAgICAgICAgY2FzZSBUeXBlcy5FbnRlcjogcmV0dXJuIFwiZW50ZXJcIlxuICAgICAgICBjYXNlIFR5cGVzLkxlYXZlOiByZXR1cm4gXCJsZWF2ZVwiXG4gICAgICAgIGNhc2UgVHlwZXMuUGFzczogcmV0dXJuIFwicGFzc1wiXG4gICAgICAgIGNhc2UgVHlwZXMuRmFpbDogcmV0dXJuIFwiZmFpbFwiXG4gICAgICAgIGNhc2UgVHlwZXMuU2tpcDogcmV0dXJuIFwic2tpcFwiXG4gICAgICAgIGNhc2UgVHlwZXMuRW5kOiByZXR1cm4gXCJlbmRcIlxuICAgICAgICBjYXNlIFR5cGVzLkVycm9yOiByZXR1cm4gXCJlcnJvclwiXG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBpZiAodGhpcy5fICYgVHlwZXMuSG9vaykgcmV0dXJuIFwiaG9va1wiXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJ1bnJlYWNoYWJsZVwiKVxuICAgICAgICB9XG4gICAgfSxcbn0pXG5cbmV4cG9ydHMuU3RhcnQgPSBTdGFydFJlcG9ydFxuZnVuY3Rpb24gU3RhcnRSZXBvcnQoKSB7XG4gICAgUmVwb3J0LmNhbGwodGhpcywgVHlwZXMuU3RhcnQpXG59XG5tZXRob2RzKFN0YXJ0UmVwb3J0LCBSZXBvcnQsIHtcbiAgICBpbnNwZWN0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgZnVuY3Rpb24gUmVwb3J0KHJlcG9ydCkge1xuICAgICAgICAgICAgaW5pdEluc3BlY3QodGhpcywgcmVwb3J0KVxuICAgICAgICB9KHRoaXMpXG4gICAgfSxcbn0pXG5cbmV4cG9ydHMuRW50ZXIgPSBFbnRlclJlcG9ydFxuZnVuY3Rpb24gRW50ZXJSZXBvcnQocGF0aCwgZHVyYXRpb24sIHNsb3cpIHtcbiAgICBSZXBvcnQuY2FsbCh0aGlzLCBUeXBlcy5FbnRlcilcbiAgICB0aGlzLnBhdGggPSBwYXRoXG4gICAgdGhpcy5kdXJhdGlvbiA9IGR1cmF0aW9uXG4gICAgdGhpcy5zbG93ID0gc2xvd1xufVxubWV0aG9kcyhFbnRlclJlcG9ydCwgUmVwb3J0LCB7XG4gICAgLyoqXG4gICAgICogU28gdXRpbC5pbnNwZWN0IHByb3ZpZGVzIG1vcmUgc2Vuc2libGUgb3V0cHV0IGZvciB0ZXN0aW5nL2V0Yy5cbiAgICAgKi9cbiAgICBpbnNwZWN0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgZnVuY3Rpb24gRW50ZXJSZXBvcnQocmVwb3J0KSB7XG4gICAgICAgICAgICBpbml0SW5zcGVjdCh0aGlzLCByZXBvcnQpXG4gICAgICAgIH0odGhpcylcbiAgICB9LFxufSlcblxuZXhwb3J0cy5MZWF2ZSA9IExlYXZlUmVwb3J0XG5mdW5jdGlvbiBMZWF2ZVJlcG9ydChwYXRoKSB7XG4gICAgUmVwb3J0LmNhbGwodGhpcywgVHlwZXMuTGVhdmUpXG4gICAgdGhpcy5wYXRoID0gcGF0aFxufVxubWV0aG9kcyhMZWF2ZVJlcG9ydCwgUmVwb3J0LCB7XG4gICAgLyoqXG4gICAgICogU28gdXRpbC5pbnNwZWN0IHByb3ZpZGVzIG1vcmUgc2Vuc2libGUgb3V0cHV0IGZvciB0ZXN0aW5nL2V0Yy5cbiAgICAgKi9cbiAgICBpbnNwZWN0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgZnVuY3Rpb24gTGVhdmVSZXBvcnQocmVwb3J0KSB7XG4gICAgICAgICAgICBpbml0SW5zcGVjdCh0aGlzLCByZXBvcnQpXG4gICAgICAgIH0odGhpcylcbiAgICB9LFxufSlcblxuZXhwb3J0cy5QYXNzID0gUGFzc1JlcG9ydFxuZnVuY3Rpb24gUGFzc1JlcG9ydChwYXRoLCBkdXJhdGlvbiwgc2xvdykge1xuICAgIFJlcG9ydC5jYWxsKHRoaXMsIFR5cGVzLlBhc3MpXG4gICAgdGhpcy5wYXRoID0gcGF0aFxuICAgIHRoaXMuZHVyYXRpb24gPSBkdXJhdGlvblxuICAgIHRoaXMuc2xvdyA9IHNsb3dcbn1cbm1ldGhvZHMoUGFzc1JlcG9ydCwgUmVwb3J0LCB7XG4gICAgLyoqXG4gICAgICogU28gdXRpbC5pbnNwZWN0IHByb3ZpZGVzIG1vcmUgc2Vuc2libGUgb3V0cHV0IGZvciB0ZXN0aW5nL2V0Yy5cbiAgICAgKi9cbiAgICBpbnNwZWN0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgZnVuY3Rpb24gUGFzc1JlcG9ydChyZXBvcnQpIHtcbiAgICAgICAgICAgIGluaXRJbnNwZWN0KHRoaXMsIHJlcG9ydClcbiAgICAgICAgfSh0aGlzKVxuICAgIH0sXG59KVxuXG5leHBvcnRzLkZhaWwgPSBGYWlsUmVwb3J0XG5mdW5jdGlvbiBGYWlsUmVwb3J0KHBhdGgsIGVycm9yLCBkdXJhdGlvbiwgc2xvdykge1xuICAgIFJlcG9ydC5jYWxsKHRoaXMsIFR5cGVzLkZhaWwpXG4gICAgdGhpcy5wYXRoID0gcGF0aFxuICAgIHRoaXMuZXJyb3IgPSBlcnJvclxuICAgIHRoaXMuZHVyYXRpb24gPSBkdXJhdGlvblxuICAgIHRoaXMuc2xvdyA9IHNsb3dcbn1cbm1ldGhvZHMoRmFpbFJlcG9ydCwgUmVwb3J0LCB7XG4gICAgLyoqXG4gICAgICogU28gdXRpbC5pbnNwZWN0IHByb3ZpZGVzIG1vcmUgc2Vuc2libGUgb3V0cHV0IGZvciB0ZXN0aW5nL2V0Yy5cbiAgICAgKi9cbiAgICBpbnNwZWN0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgZnVuY3Rpb24gRmFpbFJlcG9ydChyZXBvcnQpIHtcbiAgICAgICAgICAgIGluaXRJbnNwZWN0KHRoaXMsIHJlcG9ydClcbiAgICAgICAgfSh0aGlzKVxuICAgIH0sXG59KVxuXG5leHBvcnRzLlNraXAgPSBTa2lwUmVwb3J0XG5mdW5jdGlvbiBTa2lwUmVwb3J0KHBhdGgpIHtcbiAgICBSZXBvcnQuY2FsbCh0aGlzLCBUeXBlcy5Ta2lwKVxuICAgIHRoaXMucGF0aCA9IHBhdGhcbn1cbm1ldGhvZHMoU2tpcFJlcG9ydCwgUmVwb3J0LCB7XG4gICAgLyoqXG4gICAgICogU28gdXRpbC5pbnNwZWN0IHByb3ZpZGVzIG1vcmUgc2Vuc2libGUgb3V0cHV0IGZvciB0ZXN0aW5nL2V0Yy5cbiAgICAgKi9cbiAgICBpbnNwZWN0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgZnVuY3Rpb24gU2tpcFJlcG9ydChyZXBvcnQpIHtcbiAgICAgICAgICAgIGluaXRJbnNwZWN0KHRoaXMsIHJlcG9ydClcbiAgICAgICAgfSh0aGlzKVxuICAgIH0sXG59KVxuXG5leHBvcnRzLkVuZCA9IEVuZFJlcG9ydFxuZnVuY3Rpb24gRW5kUmVwb3J0KCkge1xuICAgIFJlcG9ydC5jYWxsKHRoaXMsIFR5cGVzLkVuZClcbn1cbm1ldGhvZHMoRW5kUmVwb3J0LCBSZXBvcnQsIHtcbiAgICAvKipcbiAgICAgKiBTbyB1dGlsLmluc3BlY3QgcHJvdmlkZXMgbW9yZSBzZW5zaWJsZSBvdXRwdXQgZm9yIHRlc3RpbmcvZXRjLlxuICAgICAqL1xuICAgIGluc3BlY3Q6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBmdW5jdGlvbiBFbmRSZXBvcnQocmVwb3J0KSB7XG4gICAgICAgICAgICBpbml0SW5zcGVjdCh0aGlzLCByZXBvcnQpXG4gICAgICAgIH0odGhpcylcbiAgICB9LFxufSlcblxuZXhwb3J0cy5FcnJvciA9IEVycm9yUmVwb3J0XG5mdW5jdGlvbiBFcnJvclJlcG9ydChlcnJvcikge1xuICAgIFJlcG9ydC5jYWxsKHRoaXMsIFR5cGVzLkVycm9yKVxuICAgIHRoaXMuZXJyb3IgPSBlcnJvclxufVxubWV0aG9kcyhFcnJvclJlcG9ydCwgUmVwb3J0LCB7XG4gICAgLyoqXG4gICAgICogU28gdXRpbC5pbnNwZWN0IHByb3ZpZGVzIG1vcmUgc2Vuc2libGUgb3V0cHV0IGZvciB0ZXN0aW5nL2V0Yy5cbiAgICAgKi9cbiAgICBpbnNwZWN0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgZnVuY3Rpb24gRXJyb3JSZXBvcnQocmVwb3J0KSB7XG4gICAgICAgICAgICBpbml0SW5zcGVjdCh0aGlzLCByZXBvcnQpXG4gICAgICAgIH0odGhpcylcbiAgICB9LFxufSlcblxudmFyIEhvb2tNZXRob2RzID0ge1xuICAgIGdldCBzdGFnZSgpIHtcbiAgICAgICAgc3dpdGNoICh0aGlzLl8pIHtcbiAgICAgICAgY2FzZSBUeXBlcy5CZWZvcmVBbGw6IHJldHVybiBcImJlZm9yZSBhbGxcIlxuICAgICAgICBjYXNlIFR5cGVzLkJlZm9yZUVhY2g6IHJldHVybiBcImJlZm9yZSBlYWNoXCJcbiAgICAgICAgY2FzZSBUeXBlcy5BZnRlckVhY2g6IHJldHVybiBcImFmdGVyIGVhY2hcIlxuICAgICAgICBjYXNlIFR5cGVzLkFmdGVyQWxsOiByZXR1cm4gXCJhZnRlciBhbGxcIlxuICAgICAgICBkZWZhdWx0OiB0aHJvdyBuZXcgRXJyb3IoXCJ1bnJlYWNoYWJsZVwiKVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIGdldCBpc0JlZm9yZUFsbCgpIHsgcmV0dXJuIHRoaXMuXyA9PT0gVHlwZXMuQmVmb3JlQWxsIH0sXG4gICAgZ2V0IGlzQmVmb3JlRWFjaCgpIHsgcmV0dXJuIHRoaXMuXyA9PT0gVHlwZXMuQmVmb3JlRWFjaCB9LFxuICAgIGdldCBpc0FmdGVyRWFjaCgpIHsgcmV0dXJuIHRoaXMuXyA9PT0gVHlwZXMuQWZ0ZXJFYWNoIH0sXG4gICAgZ2V0IGlzQWZ0ZXJBbGwoKSB7IHJldHVybiB0aGlzLl8gPT09IFR5cGVzLkFmdGVyQWxsIH0sXG59XG5cbmV4cG9ydHMuSG9va0Vycm9yID0gSG9va0Vycm9yXG5mdW5jdGlvbiBIb29rRXJyb3Ioc3RhZ2UsIGZ1bmMsIGVycm9yKSB7XG4gICAgdGhpcy5fID0gc3RhZ2VcbiAgICB0aGlzLm5hbWUgPSBmdW5jLm5hbWUgfHwgZnVuYy5kaXNwbGF5TmFtZSB8fCBcIlwiXG4gICAgdGhpcy5lcnJvciA9IGVycm9yXG59XG5tZXRob2RzKEhvb2tFcnJvciwgSG9va01ldGhvZHMpXG5cbmV4cG9ydHMuSG9vayA9IEhvb2tSZXBvcnRcbmZ1bmN0aW9uIEhvb2tSZXBvcnQocGF0aCwgcm9vdFBhdGgsIGhvb2tFcnJvcikge1xuICAgIFJlcG9ydC5jYWxsKHRoaXMsIGhvb2tFcnJvci5fKVxuICAgIHRoaXMucGF0aCA9IHBhdGhcbiAgICB0aGlzLnJvb3RQYXRoID0gcm9vdFBhdGhcbiAgICB0aGlzLm5hbWUgPSBob29rRXJyb3IubmFtZVxuICAgIHRoaXMuZXJyb3IgPSBob29rRXJyb3IuZXJyb3Jcbn1cbm1ldGhvZHMoSG9va1JlcG9ydCwgUmVwb3J0LCBIb29rTWV0aG9kcywge1xuICAgIGdldCBob29rRXJyb3IoKSB7IHJldHVybiBuZXcgSG9va0Vycm9yKHRoaXMuXywgdGhpcywgdGhpcy5lcnJvcikgfSxcbn0pXG4iLCJcInVzZSBzdHJpY3RcIlxuXG52YXIgbWV0aG9kcyA9IHJlcXVpcmUoXCIuLi9tZXRob2RzXCIpXG52YXIgcGVhY2ggPSByZXF1aXJlKFwiLi4vdXRpbFwiKS5wZWFjaFxudmFyIFJlcG9ydHMgPSByZXF1aXJlKFwiLi9yZXBvcnRzXCIpXG52YXIgaXNPbmx5ID0gcmVxdWlyZShcIi4vb25seVwiKS5pc09ubHlcbnZhciBUeXBlcyA9IFJlcG9ydHMuVHlwZXNcblxuLyoqXG4gKiBUaGUgdGVzdHMgYXJlIGxhaWQgb3V0IGluIGEgdmVyeSBkYXRhLWRyaXZlbiBkZXNpZ24uIFdpdGggZXhjZXB0aW9uIG9mIHRoZVxuICogcmVwb3J0cywgdGhlcmUgaXMgbWluaW1hbCBvYmplY3Qgb3JpZW50YXRpb24gYW5kIHplcm8gdmlydHVhbCBkaXNwYXRjaC5cbiAqIEhlcmUncyBhIHF1aWNrIG92ZXJ2aWV3OlxuICpcbiAqIC0gVGhlIHRlc3QgaGFuZGxpbmcgZGlzcGF0Y2hlcyBiYXNlZCBvbiB2YXJpb3VzIGF0dHJpYnV0ZXMgdGhlIHRlc3QgaGFzLiBGb3JcbiAqICAgZXhhbXBsZSwgcm9vdHMgYXJlIGtub3duIGJ5IGEgY2lyY3VsYXIgcm9vdCByZWZlcmVuY2UsIGFuZCBza2lwcGVkIHRlc3RzXG4gKiAgIGFyZSBrbm93biBieSBub3QgaGF2aW5nIGEgY2FsbGJhY2suXG4gKlxuICogLSBUaGUgdGVzdCBldmFsdWF0aW9uIGlzIHZlcnkgcHJvY2VkdXJhbC4gQWx0aG91Z2ggaXQncyB2ZXJ5IGhpZ2hseVxuICogICBhc3luY2hyb25vdXMsIHRoZSB1c2Ugb2YgcHJvbWlzZXMgbGluZWFyaXplIHRoZSBsb2dpYywgc28gaXQgcmVhZHMgdmVyeVxuICogICBtdWNoIGxpa2UgYSByZWN1cnNpdmUgc2V0IG9mIHN0ZXBzLlxuICpcbiAqIC0gVGhlIGRhdGEgdHlwZXMgYXJlIG1vc3RseSBlaXRoZXIgcGxhaW4gb2JqZWN0cyBvciBjbGFzc2VzIHdpdGggbm8gbWV0aG9kcyxcbiAqICAgdGhlIGxhdHRlciBtb3N0bHkgZm9yIGRlYnVnZ2luZyBoZWxwLiBUaGlzIGFsc28gYXZvaWRzIG1vc3Qgb2YgdGhlXG4gKiAgIGluZGlyZWN0aW9uIHJlcXVpcmVkIHRvIGFjY29tbW9kYXRlIGJyZWFraW5nIGFic3RyYWN0aW9ucywgd2hpY2ggdGhlIEFQSVxuICogICBtZXRob2RzIGZyZXF1ZW50bHkgbmVlZCB0byBkby5cbiAqL1xuXG4vLyBQcmV2ZW50IFNpbm9uIGludGVyZmVyZW5jZSB3aGVuIHRoZXkgaW5zdGFsbCB0aGVpciBtb2Nrc1xudmFyIHNldFRpbWVvdXQgPSBnbG9iYWwuc2V0VGltZW91dFxudmFyIGNsZWFyVGltZW91dCA9IGdsb2JhbC5jbGVhclRpbWVvdXRcbnZhciBub3cgPSBnbG9iYWwuRGF0ZS5ub3dcblxuLyoqXG4gKiBCYXNpYyBkYXRhIHR5cGVzXG4gKi9cbmZ1bmN0aW9uIFJlc3VsdCh0aW1lLCBhdHRlbXB0KSB7XG4gICAgdGhpcy50aW1lID0gdGltZVxuICAgIHRoaXMuY2F1Z2h0ID0gYXR0ZW1wdC5jYXVnaHRcbiAgICB0aGlzLnZhbHVlID0gYXR0ZW1wdC5jYXVnaHQgPyBhdHRlbXB0LnZhbHVlIDogdW5kZWZpbmVkXG59XG5cbi8qKlxuICogT3ZlcnZpZXcgb2YgdGhlIHRlc3QgcHJvcGVydGllczpcbiAqXG4gKiAtIGBtZXRob2RzYCAtIEEgZGVwcmVjYXRlZCByZWZlcmVuY2UgdG8gdGhlIEFQSSBtZXRob2RzXG4gKiAtIGByb290YCAtIFRoZSByb290IHRlc3RcbiAqIC0gYHJlcG9ydGVyc2AgLSBUaGUgbGlzdCBvZiByZXBvcnRlcnNcbiAqIC0gYGN1cnJlbnRgIC0gQSByZWZlcmVuY2UgdG8gdGhlIGN1cnJlbnRseSBhY3RpdmUgdGVzdFxuICogLSBgdGltZW91dGAgLSBUaGUgdGVzdHMncyB0aW1lb3V0LCBvciAwIGlmIGluaGVyaXRlZFxuICogLSBgc2xvd2AgLSBUaGUgdGVzdHMncyBzbG93IHRocmVzaG9sZFxuICogLSBgbmFtZWAgLSBUaGUgdGVzdCdzIG5hbWVcbiAqIC0gYGluZGV4YCAtIFRoZSB0ZXN0J3MgaW5kZXhcbiAqIC0gYHBhcmVudGAgLSBUaGUgdGVzdCdzIHBhcmVudFxuICogLSBgY2FsbGJhY2tgIC0gVGhlIHRlc3QncyBjYWxsYmFja1xuICogLSBgdGVzdHNgIC0gVGhlIHRlc3QncyBjaGlsZCB0ZXN0c1xuICogLSBgYmVmb3JlQWxsYCwgYGJlZm9yZUVhY2hgLCBgYWZ0ZXJFYWNoYCwgYGFmdGVyQWxsYCAtIFRoZSB0ZXN0J3MgdmFyaW91c1xuICogICBzY2hlZHVsZWQgaG9va3NcbiAqXG4gKiBNYW55IG9mIHRoZXNlIHByb3BlcnRpZXMgYXJlbid0IHByZXNlbnQgb24gaW5pdGlhbGl6YXRpb24gdG8gc2F2ZSBtZW1vcnkuXG4gKi9cblxuLy8gVE9ETzogcmVtb3ZlIGB0ZXN0Lm1ldGhvZHNgIGluIDAuNFxuZnVuY3Rpb24gTm9ybWFsKG5hbWUsIGluZGV4LCBwYXJlbnQsIGNhbGxiYWNrKSB7XG4gICAgdmFyIGNoaWxkID0gT2JqZWN0LmNyZWF0ZShwYXJlbnQubWV0aG9kcylcblxuICAgIGNoaWxkLl8gPSB0aGlzXG4gICAgdGhpcy5tZXRob2RzID0gY2hpbGRcbiAgICB0aGlzLmxvY2tlZCA9IHRydWVcbiAgICB0aGlzLnJvb3QgPSBwYXJlbnQucm9vdFxuICAgIHRoaXMubmFtZSA9IG5hbWVcbiAgICB0aGlzLmluZGV4ID0gaW5kZXh8MFxuICAgIHRoaXMucGFyZW50ID0gcGFyZW50XG4gICAgdGhpcy5jYWxsYmFjayA9IGNhbGxiYWNrXG59XG5cbmZ1bmN0aW9uIFNraXBwZWQobmFtZSwgaW5kZXgsIHBhcmVudCkge1xuICAgIHRoaXMubG9ja2VkID0gdHJ1ZVxuICAgIHRoaXMucm9vdCA9IHBhcmVudC5yb290XG4gICAgdGhpcy5uYW1lID0gbmFtZVxuICAgIHRoaXMuaW5kZXggPSBpbmRleHwwXG4gICAgdGhpcy5wYXJlbnQgPSBwYXJlbnRcbn1cblxuLy8gVE9ETzogcmVtb3ZlIGB0ZXN0Lm1ldGhvZHNgIGluIDAuNFxuZnVuY3Rpb24gUm9vdChtZXRob2RzKSB7XG4gICAgdGhpcy5sb2NrZWQgPSBmYWxzZVxuICAgIHRoaXMubWV0aG9kcyA9IG1ldGhvZHNcbiAgICB0aGlzLnJlcG9ydGVySWRzID0gW11cbiAgICB0aGlzLnJlcG9ydGVycyA9IFtdXG4gICAgdGhpcy5jdXJyZW50ID0gdGhpc1xuICAgIHRoaXMucm9vdCA9IHRoaXNcbiAgICB0aGlzLnRpbWVvdXQgPSAwXG4gICAgdGhpcy5zbG93ID0gMFxufVxuXG4vKipcbiAqIEJhc2UgdGVzdHMgKGkuZS4gZGVmYXVsdCBleHBvcnQsIHJlc3VsdCBvZiBgaW50ZXJuYWwucm9vdCgpYCkuXG4gKi9cblxuZXhwb3J0cy5jcmVhdGVSb290ID0gZnVuY3Rpb24gKG1ldGhvZHMpIHtcbiAgICByZXR1cm4gbmV3IFJvb3QobWV0aG9kcylcbn1cblxuLyoqXG4gKiBTZXQgdXAgZWFjaCB0ZXN0IHR5cGUuXG4gKi9cblxuLyoqXG4gKiBBIG5vcm1hbCB0ZXN0IHRocm91Z2ggYHQudGVzdCgpYC5cbiAqL1xuXG5leHBvcnRzLmFkZE5vcm1hbCA9IGZ1bmN0aW9uIChwYXJlbnQsIG5hbWUsIGNhbGxiYWNrKSB7XG4gICAgdmFyIGluZGV4ID0gcGFyZW50LnRlc3RzICE9IG51bGwgPyBwYXJlbnQudGVzdHMubGVuZ3RoIDogMFxuICAgIHZhciBiYXNlID0gbmV3IE5vcm1hbChuYW1lLCBpbmRleCwgcGFyZW50LCBjYWxsYmFjaylcblxuICAgIGlmIChpbmRleCkge1xuICAgICAgICBwYXJlbnQudGVzdHMucHVzaChiYXNlKVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHBhcmVudC50ZXN0cyA9IFtiYXNlXVxuICAgIH1cbn1cblxuLyoqXG4gKiBBIHNraXBwZWQgdGVzdCB0aHJvdWdoIGB0LnRlc3RTa2lwKClgLlxuICovXG5leHBvcnRzLmFkZFNraXBwZWQgPSBmdW5jdGlvbiAocGFyZW50LCBuYW1lKSB7XG4gICAgdmFyIGluZGV4ID0gcGFyZW50LnRlc3RzICE9IG51bGwgPyBwYXJlbnQudGVzdHMubGVuZ3RoIDogMFxuICAgIHZhciBiYXNlID0gbmV3IFNraXBwZWQobmFtZSwgaW5kZXgsIHBhcmVudClcblxuICAgIGlmIChpbmRleCkge1xuICAgICAgICBwYXJlbnQudGVzdHMucHVzaChiYXNlKVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHBhcmVudC50ZXN0cyA9IFtiYXNlXVxuICAgIH1cbn1cblxuLyoqXG4gKiBFeGVjdXRlIHRoZSB0ZXN0c1xuICovXG5cbmZ1bmN0aW9uIHBhdGgodGVzdCkge1xuICAgIHZhciByZXQgPSBbXVxuXG4gICAgd2hpbGUgKHRlc3Qucm9vdCAhPT0gdGVzdCkge1xuICAgICAgICByZXQucHVzaCh7bmFtZTogdGVzdC5uYW1lLCBpbmRleDogdGVzdC5pbmRleHwwfSlcbiAgICAgICAgdGVzdCA9IHRlc3QucGFyZW50XG4gICAgfVxuXG4gICAgcmV0dXJuIHJldC5yZXZlcnNlKClcbn1cblxuLy8gTm90ZSB0aGF0IGEgdGltZW91dCBvZiAwIG1lYW5zIHRvIGluaGVyaXQgdGhlIHBhcmVudC5cbmV4cG9ydHMudGltZW91dCA9IHRpbWVvdXRcbmZ1bmN0aW9uIHRpbWVvdXQodGVzdCkge1xuICAgIHdoaWxlICghdGVzdC50aW1lb3V0ICYmIHRlc3Qucm9vdCAhPT0gdGVzdCkge1xuICAgICAgICB0ZXN0ID0gdGVzdC5wYXJlbnRcbiAgICB9XG5cbiAgICByZXR1cm4gdGVzdC50aW1lb3V0IHx8IDIwMDAgLy8gbXMgLSBkZWZhdWx0IHRpbWVvdXRcbn1cblxuLy8gTm90ZSB0aGF0IGEgc2xvd25lc3MgdGhyZXNob2xkIG9mIDAgbWVhbnMgdG8gaW5oZXJpdCB0aGUgcGFyZW50LlxuZXhwb3J0cy5zbG93ID0gc2xvd1xuZnVuY3Rpb24gc2xvdyh0ZXN0KSB7XG4gICAgd2hpbGUgKCF0ZXN0LnNsb3cgJiYgdGVzdC5yb290ICE9PSB0ZXN0KSB7XG4gICAgICAgIHRlc3QgPSB0ZXN0LnBhcmVudFxuICAgIH1cblxuICAgIHJldHVybiB0ZXN0LnNsb3cgfHwgNzUgLy8gbXMgLSBkZWZhdWx0IHNsb3cgdGhyZXNob2xkXG59XG5cbmZ1bmN0aW9uIHJlcG9ydCh0ZXN0LCB0eXBlLCBhcmcxLCBhcmcyKSB7XG4gICAgZnVuY3Rpb24gaW52b2tlUmVwb3J0ZXIocmVwb3J0ZXIpIHtcbiAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgIGNhc2UgVHlwZXMuU3RhcnQ6XG4gICAgICAgICAgICByZXR1cm4gcmVwb3J0ZXIobmV3IFJlcG9ydHMuU3RhcnQoKSlcblxuICAgICAgICBjYXNlIFR5cGVzLkVudGVyOlxuICAgICAgICAgICAgcmV0dXJuIHJlcG9ydGVyKG5ldyBSZXBvcnRzLkVudGVyKHBhdGgodGVzdCksIGFyZzEsIHNsb3codGVzdCkpKVxuXG4gICAgICAgIGNhc2UgVHlwZXMuTGVhdmU6XG4gICAgICAgICAgICByZXR1cm4gcmVwb3J0ZXIobmV3IFJlcG9ydHMuTGVhdmUocGF0aCh0ZXN0KSkpXG5cbiAgICAgICAgY2FzZSBUeXBlcy5QYXNzOlxuICAgICAgICAgICAgcmV0dXJuIHJlcG9ydGVyKG5ldyBSZXBvcnRzLlBhc3MocGF0aCh0ZXN0KSwgYXJnMSwgc2xvdyh0ZXN0KSkpXG5cbiAgICAgICAgY2FzZSBUeXBlcy5GYWlsOlxuICAgICAgICAgICAgcmV0dXJuIHJlcG9ydGVyKFxuICAgICAgICAgICAgICAgIG5ldyBSZXBvcnRzLkZhaWwocGF0aCh0ZXN0KSwgYXJnMSwgYXJnMiwgc2xvdyh0ZXN0KSkpXG5cbiAgICAgICAgY2FzZSBUeXBlcy5Ta2lwOlxuICAgICAgICAgICAgcmV0dXJuIHJlcG9ydGVyKG5ldyBSZXBvcnRzLlNraXAocGF0aCh0ZXN0KSkpXG5cbiAgICAgICAgY2FzZSBUeXBlcy5FbmQ6XG4gICAgICAgICAgICByZXR1cm4gcmVwb3J0ZXIobmV3IFJlcG9ydHMuRW5kKCkpXG5cbiAgICAgICAgY2FzZSBUeXBlcy5FcnJvcjpcbiAgICAgICAgICAgIHJldHVybiByZXBvcnRlcihuZXcgUmVwb3J0cy5FcnJvcihhcmcxKSlcblxuICAgICAgICBjYXNlIFR5cGVzLkhvb2s6XG4gICAgICAgICAgICByZXR1cm4gcmVwb3J0ZXIobmV3IFJlcG9ydHMuSG9vayhwYXRoKHRlc3QpLCBwYXRoKGFyZzEpLCBhcmcyKSlcblxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcInVucmVhY2hhYmxlXCIpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKClcbiAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0ZXN0LnJvb3QucmVwb3J0ZXIgPT0gbnVsbCkgcmV0dXJuIHVuZGVmaW5lZFxuICAgICAgICByZXR1cm4gaW52b2tlUmVwb3J0ZXIodGVzdC5yb290LnJlcG9ydGVyKVxuICAgIH0pXG4gICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgcmVwb3J0ZXJzID0gdGVzdC5yb290LnJlcG9ydGVyc1xuXG4gICAgICAgIC8vIFR3byBlYXN5IGNhc2VzLlxuICAgICAgICBpZiAocmVwb3J0ZXJzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHVuZGVmaW5lZFxuICAgICAgICBpZiAocmVwb3J0ZXJzLmxlbmd0aCA9PT0gMSkgcmV0dXJuIGludm9rZVJlcG9ydGVyKHJlcG9ydGVyc1swXSlcbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHJlcG9ydGVycy5tYXAoaW52b2tlUmVwb3J0ZXIpKVxuICAgIH0pXG59XG5cbi8qKlxuICogTm9ybWFsIHRlc3RzXG4gKi9cblxuLy8gUGhhbnRvbUpTIGFuZCBJRSBkb24ndCBhZGQgdGhlIHN0YWNrIHVudGlsIGl0J3MgdGhyb3duLiBJbiBmYWlsaW5nIGFzeW5jXG4vLyB0ZXN0cywgaXQncyBhbHJlYWR5IHRocm93biBpbiBhIHNlbnNlLCBzbyB0aGlzIHNob3VsZCBiZSBub3JtYWxpemVkIHdpdGhcbi8vIG90aGVyIHRlc3QgdHlwZXMuXG52YXIgbXVzdEFkZFN0YWNrID0gdHlwZW9mIG5ldyBFcnJvcigpLnN0YWNrICE9PSBcInN0cmluZ1wiXG5cbmZ1bmN0aW9uIGFkZFN0YWNrKGUpIHtcbiAgICB0cnkgeyB0aHJvdyBlIH0gZmluYWxseSB7IHJldHVybiBlIH1cbn1cblxuZnVuY3Rpb24gZ2V0VGhlbihyZXMpIHtcbiAgICBpZiAodHlwZW9mIHJlcyA9PT0gXCJvYmplY3RcIiB8fCB0eXBlb2YgcmVzID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgcmV0dXJuIHJlcy50aGVuXG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuICAgIH1cbn1cblxuZnVuY3Rpb24gQXN5bmNTdGF0ZShzdGFydCwgcmVzb2x2ZSkge1xuICAgIHRoaXMuc3RhcnQgPSBzdGFydFxuICAgIHRoaXMucmVzb2x2ZSA9IHJlc29sdmVcbiAgICB0aGlzLnJlc29sdmVkID0gZmFsc2VcbiAgICB0aGlzLnRpbWVyID0gdW5kZWZpbmVkXG59XG5cbmZ1bmN0aW9uIGFzeW5jRmluaXNoKHN0YXRlLCBhdHRlbXB0KSB7XG4gICAgLy8gQ2FwdHVyZSBpbW1lZGlhdGVseS4gV29yc3QgY2FzZSBzY2VuYXJpbywgaXQgZ2V0cyB0aHJvd24gYXdheS5cbiAgICB2YXIgZW5kID0gbm93KClcblxuICAgIGlmIChzdGF0ZS5yZXNvbHZlZCkgcmV0dXJuXG4gICAgaWYgKHN0YXRlLnRpbWVyKSB7XG4gICAgICAgIGNsZWFyVGltZW91dC5jYWxsKGdsb2JhbCwgc3RhdGUudGltZXIpXG4gICAgICAgIHN0YXRlLnRpbWVyID0gdW5kZWZpbmVkXG4gICAgfVxuXG4gICAgc3RhdGUucmVzb2x2ZWQgPSB0cnVlXG4gICAgc3RhdGUucmVzb2x2ZShuZXcgUmVzdWx0KGVuZCAtIHN0YXRlLnN0YXJ0LCBhdHRlbXB0KSlcbn1cblxuLy8gQXZvaWQgYSBjbG9zdXJlIGlmIHBvc3NpYmxlLCBpbiBjYXNlIGl0IGRvZXNuJ3QgcmV0dXJuIGEgdGhlbmFibGUuXG5mdW5jdGlvbiBpbnZva2VJbml0KHRlc3QpIHtcbiAgICB2YXIgc3RhcnQgPSBub3coKVxuICAgIHZhciB0cnlCb2R5ID0gdHJ5MSh0ZXN0LmNhbGxiYWNrLCB0ZXN0Lm1ldGhvZHMsIHRlc3QubWV0aG9kcylcblxuICAgIC8vIE5vdGU6IHN5bmNocm9ub3VzIGZhaWx1cmVzIGFyZSB0ZXN0IGZhaWx1cmVzLCBub3QgZmF0YWwgZXJyb3JzLlxuICAgIGlmICh0cnlCb2R5LmNhdWdodCkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG5ldyBSZXN1bHQobm93KCkgLSBzdGFydCwgdHJ5Qm9keSkpXG4gICAgfVxuXG4gICAgdmFyIHRyeVRoZW4gPSB0cnkxKGdldFRoZW4sIHVuZGVmaW5lZCwgdHJ5Qm9keS52YWx1ZSlcblxuICAgIGlmICh0cnlUaGVuLmNhdWdodCB8fCB0eXBlb2YgdHJ5VGhlbi52YWx1ZSAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobmV3IFJlc3VsdChub3coKSAtIHN0YXJ0LCB0cnlUaGVuKSlcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUpIHtcbiAgICAgICAgdmFyIHN0YXRlID0gbmV3IEFzeW5jU3RhdGUoc3RhcnQsIHJlc29sdmUpXG4gICAgICAgIHZhciByZXN1bHQgPSB0cnkyKHRyeVRoZW4udmFsdWUsIHRyeUJvZHkudmFsdWUsXG4gICAgICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXRlID09IG51bGwpIHJldHVyblxuICAgICAgICAgICAgICAgIGFzeW5jRmluaXNoKHN0YXRlLCB0cnlQYXNzKCkpXG4gICAgICAgICAgICAgICAgc3RhdGUgPSB1bmRlZmluZWRcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgIGlmIChzdGF0ZSA9PSBudWxsKSByZXR1cm5cbiAgICAgICAgICAgICAgICBhc3luY0ZpbmlzaChzdGF0ZSwgdHJ5RmFpbChcbiAgICAgICAgICAgICAgICAgICAgbXVzdEFkZFN0YWNrIHx8IGUgaW5zdGFuY2VvZiBFcnJvciAmJiBlLnN0YWNrID09IG51bGxcbiAgICAgICAgICAgICAgICAgICAgICAgID8gYWRkU3RhY2soZSkgOiBlKSlcbiAgICAgICAgICAgICAgICBzdGF0ZSA9IHVuZGVmaW5lZFxuICAgICAgICAgICAgfSlcblxuICAgICAgICBpZiAocmVzdWx0LmNhdWdodCkge1xuICAgICAgICAgICAgYXN5bmNGaW5pc2goc3RhdGUsIHJlc3VsdClcbiAgICAgICAgICAgIHN0YXRlID0gdW5kZWZpbmVkXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFNldCB0aGUgdGltZW91dCAqYWZ0ZXIqIGluaXRpYWxpemF0aW9uLiBUaGUgdGltZW91dCB3aWxsIGxpa2VseSBiZVxuICAgICAgICAvLyBzcGVjaWZpZWQgZHVyaW5nIGluaXRpYWxpemF0aW9uLlxuICAgICAgICB2YXIgbWF4VGltZW91dCA9IHRpbWVvdXQodGVzdClcblxuICAgICAgICAvLyBTZXR0aW5nIGEgdGltZW91dCBpcyBwb2ludGxlc3MgaWYgaXQncyBpbmZpbml0ZS5cbiAgICAgICAgaWYgKG1heFRpbWVvdXQgIT09IEluZmluaXR5KSB7XG4gICAgICAgICAgICBzdGF0ZS50aW1lciA9IHNldFRpbWVvdXQuY2FsbChnbG9iYWwsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3RhdGUgPT0gbnVsbCkgcmV0dXJuXG4gICAgICAgICAgICAgICAgYXN5bmNGaW5pc2goc3RhdGUsIHRyeUZhaWwoYWRkU3RhY2soXG4gICAgICAgICAgICAgICAgICAgIG5ldyBFcnJvcihcIlRpbWVvdXQgb2YgXCIgKyBtYXhUaW1lb3V0ICsgXCIgcmVhY2hlZFwiKSkpKVxuICAgICAgICAgICAgICAgIHN0YXRlID0gdW5kZWZpbmVkXG4gICAgICAgICAgICB9LCBtYXhUaW1lb3V0KVxuICAgICAgICB9XG4gICAgfSlcbn1cblxuZnVuY3Rpb24gRXJyb3JXcmFwKHRlc3QsIGVycm9yKSB7XG4gICAgdGhpcy50ZXN0ID0gdGVzdFxuICAgIHRoaXMuZXJyb3IgPSBlcnJvclxufVxubWV0aG9kcyhFcnJvcldyYXAsIEVycm9yLCB7bmFtZTogXCJFcnJvcldyYXBcIn0pXG5cbmZ1bmN0aW9uIGludm9rZUhvb2sodGVzdCwgbGlzdCwgc3RhZ2UpIHtcbiAgICBpZiAobGlzdCA9PSBudWxsKSByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKClcbiAgICByZXR1cm4gcGVhY2gobGlzdCwgZnVuY3Rpb24gKGhvb2spIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiBob29rKClcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yV3JhcCh0ZXN0LCBuZXcgUmVwb3J0cy5Ib29rRXJyb3Ioc3RhZ2UsIGhvb2ssIGUpKVxuICAgICAgICB9XG4gICAgfSlcbn1cblxuZnVuY3Rpb24gaW52b2tlQmVmb3JlRWFjaCh0ZXN0KSB7XG4gICAgaWYgKHRlc3Qucm9vdCA9PT0gdGVzdCkge1xuICAgICAgICByZXR1cm4gaW52b2tlSG9vayh0ZXN0LCB0ZXN0LmJlZm9yZUVhY2gsIFR5cGVzLkJlZm9yZUVhY2gpXG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGludm9rZUJlZm9yZUVhY2godGVzdC5wYXJlbnQpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGludm9rZUhvb2sodGVzdCwgdGVzdC5iZWZvcmVFYWNoLCBUeXBlcy5CZWZvcmVFYWNoKVxuICAgICAgICB9KVxuICAgIH1cbn1cblxuZnVuY3Rpb24gaW52b2tlQWZ0ZXJFYWNoKHRlc3QpIHtcbiAgICBpZiAodGVzdC5yb290ID09PSB0ZXN0KSB7XG4gICAgICAgIHJldHVybiBpbnZva2VIb29rKHRlc3QsIHRlc3QuYWZ0ZXJFYWNoLCBUeXBlcy5BZnRlckVhY2gpXG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGludm9rZUhvb2sodGVzdCwgdGVzdC5hZnRlckVhY2gsIFR5cGVzLkFmdGVyRWFjaClcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gaW52b2tlQWZ0ZXJFYWNoKHRlc3QucGFyZW50KSB9KVxuICAgIH1cbn1cblxuZnVuY3Rpb24gcnVuQ2hpbGRUZXN0cyh0ZXN0KSB7XG4gICAgaWYgKHRlc3QudGVzdHMgPT0gbnVsbCkgcmV0dXJuIHVuZGVmaW5lZFxuXG4gICAgZnVuY3Rpb24gcnVuQ2hpbGQoY2hpbGQpIHtcbiAgICAgICAgcmV0dXJuIGludm9rZUJlZm9yZUVhY2godGVzdClcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gcnVuTm9ybWFsQ2hpbGQoY2hpbGQpIH0pXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIGludm9rZUFmdGVyRWFjaCh0ZXN0KSB9KVxuICAgICAgICAudGhlbihcbiAgICAgICAgICAgIGZ1bmN0aW9uICgpIHsgdGVzdC5yb290LmN1cnJlbnQgPSB0ZXN0IH0sXG4gICAgICAgICAgICBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgIHRlc3Qucm9vdC5jdXJyZW50ID0gdGVzdFxuICAgICAgICAgICAgICAgIGlmICghKGUgaW5zdGFuY2VvZiBFcnJvcldyYXApKSB0aHJvdyBlXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcG9ydChjaGlsZCwgVHlwZXMuSG9vaywgZS50ZXN0LCBlLmVycm9yKVxuICAgICAgICAgICAgfSlcbiAgICB9XG5cbiAgICB2YXIgcmFuID0gZmFsc2VcblxuICAgIGZ1bmN0aW9uIG1heWJlUnVuQ2hpbGQoY2hpbGQpIHtcbiAgICAgICAgLy8gT25seSBza2lwcGVkIHRlc3RzIGhhdmUgbm8gY2FsbGJhY2tcbiAgICAgICAgaWYgKGNoaWxkLmNhbGxiYWNrID09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiByZXBvcnQoY2hpbGQsIFR5cGVzLlNraXApXG4gICAgICAgIH0gZWxzZSBpZiAoIWlzT25seShjaGlsZCkpIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuICAgICAgICB9IGVsc2UgaWYgKHJhbikge1xuICAgICAgICAgICAgcmV0dXJuIHJ1bkNoaWxkKGNoaWxkKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmFuID0gdHJ1ZVxuICAgICAgICAgICAgcmV0dXJuIGludm9rZUhvb2sodGVzdCwgdGVzdC5iZWZvcmVBbGwsIFR5cGVzLkJlZm9yZUFsbClcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIHJ1bkNoaWxkKGNoaWxkKSB9KVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHBlYWNoKHRlc3QudGVzdHMsIGZ1bmN0aW9uIChjaGlsZCkge1xuICAgICAgICB0ZXN0LnJvb3QuY3VycmVudCA9IGNoaWxkXG4gICAgICAgIHJldHVybiBtYXliZVJ1bkNoaWxkKGNoaWxkKS50aGVuKFxuICAgICAgICAgICAgZnVuY3Rpb24gKCkgeyB0ZXN0LnJvb3QuY3VycmVudCA9IHRlc3QgfSxcbiAgICAgICAgICAgIGZ1bmN0aW9uIChlKSB7IHRlc3Qucm9vdC5jdXJyZW50ID0gdGVzdDsgdGhyb3cgZSB9KVxuICAgIH0pXG4gICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gcmFuID8gaW52b2tlSG9vayh0ZXN0LCB0ZXN0LmFmdGVyQWxsLCBUeXBlcy5BZnRlckFsbCkgOiB1bmRlZmluZWRcbiAgICB9KVxufVxuXG5mdW5jdGlvbiBjbGVhckNoaWxkcmVuKHRlc3QpIHtcbiAgICBpZiAodGVzdC50ZXN0cyA9PSBudWxsKSByZXR1cm5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRlc3QudGVzdHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgZGVsZXRlIHRlc3QudGVzdHNbaV0udGVzdHNcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHJ1bk5vcm1hbENoaWxkKHRlc3QpIHtcbiAgICB0ZXN0LmxvY2tlZCA9IGZhbHNlXG5cbiAgICByZXR1cm4gaW52b2tlSW5pdCh0ZXN0KVxuICAgIC50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgdGVzdC5sb2NrZWQgPSB0cnVlXG5cbiAgICAgICAgaWYgKHJlc3VsdC5jYXVnaHQpIHtcbiAgICAgICAgICAgIHJldHVybiByZXBvcnQodGVzdCwgVHlwZXMuRmFpbCwgcmVzdWx0LnZhbHVlLCByZXN1bHQudGltZSlcbiAgICAgICAgfSBlbHNlIGlmICh0ZXN0LnRlc3RzICE9IG51bGwpIHtcbiAgICAgICAgICAgIC8vIFJlcG9ydCB0aGlzIGFzIGlmIGl0IHdhcyBhIHBhcmVudCB0ZXN0IGlmIGl0J3MgcGFzc2luZyBhbmQgaGFzXG4gICAgICAgICAgICAvLyBjaGlsZHJlbi5cbiAgICAgICAgICAgIHJldHVybiByZXBvcnQodGVzdCwgVHlwZXMuRW50ZXIsIHJlc3VsdC50aW1lKVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gcnVuQ2hpbGRUZXN0cyh0ZXN0KSB9KVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gcmVwb3J0KHRlc3QsIFR5cGVzLkxlYXZlKSB9KVxuICAgICAgICAgICAgLmNhdGNoKGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgaWYgKCEoZSBpbnN0YW5jZW9mIEVycm9yV3JhcCkpIHRocm93IGVcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVwb3J0KHRlc3QsIFR5cGVzLkxlYXZlKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcG9ydCh0ZXN0LCBUeXBlcy5Ib29rLCBlLnRlc3QsIGUuZXJyb3IpXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gcmVwb3J0KHRlc3QsIFR5cGVzLlBhc3MsIHJlc3VsdC50aW1lKVxuICAgICAgICB9XG4gICAgfSlcbiAgICAudGhlbihcbiAgICAgICAgZnVuY3Rpb24gKCkgeyBjbGVhckNoaWxkcmVuKHRlc3QpIH0sXG4gICAgICAgIGZ1bmN0aW9uIChlKSB7IGNsZWFyQ2hpbGRyZW4odGVzdCk7IHRocm93IGUgfSlcbn1cblxuLyoqXG4gKiBUaGlzIHJ1bnMgdGhlIHJvb3QgdGVzdCBhbmQgcmV0dXJucyBhIHByb21pc2UgcmVzb2x2ZWQgd2hlbiBpdCdzIGRvbmUuXG4gKi9cbmV4cG9ydHMucnVuVGVzdCA9IGZ1bmN0aW9uICh0ZXN0KSB7XG4gICAgdGVzdC5sb2NrZWQgPSB0cnVlXG5cbiAgICByZXR1cm4gcmVwb3J0KHRlc3QsIFR5cGVzLlN0YXJ0KVxuICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIHJ1bkNoaWxkVGVzdHModGVzdCkgfSlcbiAgICAuY2F0Y2goZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgaWYgKCEoZSBpbnN0YW5jZW9mIEVycm9yV3JhcCkpIHRocm93IGVcbiAgICAgICAgcmV0dXJuIHJlcG9ydCh0ZXN0LCBUeXBlcy5Ib29rLCBlLnRlc3QsIGUuZXJyb3IpXG4gICAgfSlcbiAgICAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiByZXBvcnQodGVzdCwgVHlwZXMuRW5kKSB9KVxuICAgIC8vIFRlbGwgdGhlIHJlcG9ydGVyIHNvbWV0aGluZyBoYXBwZW5lZC4gT3RoZXJ3aXNlLCBpdCdsbCBoYXZlIHRvIHdyYXAgdGhpc1xuICAgIC8vIG1ldGhvZCBpbiBhIHBsdWdpbiwgd2hpY2ggc2hvdWxkbid0IGJlIG5lY2Vzc2FyeS5cbiAgICAuY2F0Y2goZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgcmV0dXJuIHJlcG9ydCh0ZXN0LCBUeXBlcy5FcnJvciwgZSkudGhlbihmdW5jdGlvbiAoKSB7IHRocm93IGUgfSlcbiAgICB9KVxuICAgIC50aGVuKFxuICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjbGVhckNoaWxkcmVuKHRlc3QpXG4gICAgICAgICAgICB0ZXN0LmxvY2tlZCA9IGZhbHNlXG4gICAgICAgIH0sXG4gICAgICAgIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICBjbGVhckNoaWxkcmVuKHRlc3QpXG4gICAgICAgICAgICB0ZXN0LmxvY2tlZCA9IGZhbHNlXG4gICAgICAgICAgICB0aHJvdyBlXG4gICAgICAgIH0pXG59XG5cbi8vIEhlbHAgb3B0aW1pemUgZm9yIGluZWZmaWNpZW50IGV4Y2VwdGlvbiBoYW5kbGluZyBpbiBWOFxuXG5mdW5jdGlvbiB0cnlQYXNzKHZhbHVlKSB7XG4gICAgcmV0dXJuIHtjYXVnaHQ6IGZhbHNlLCB2YWx1ZTogdmFsdWV9XG59XG5cbmZ1bmN0aW9uIHRyeUZhaWwoZSkge1xuICAgIHJldHVybiB7Y2F1Z2h0OiB0cnVlLCB2YWx1ZTogZX1cbn1cblxuZnVuY3Rpb24gdHJ5MShmLCBpbnN0LCBhcmcwKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIHRyeVBhc3MoZi5jYWxsKGluc3QsIGFyZzApKVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgcmV0dXJuIHRyeUZhaWwoZSlcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHRyeTIoZiwgaW5zdCwgYXJnMCwgYXJnMSkge1xuICAgIHRyeSB7XG4gICAgICAgIHJldHVybiB0cnlQYXNzKGYuY2FsbChpbnN0LCBhcmcwLCBhcmcxKSlcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHJldHVybiB0cnlGYWlsKGUpXG4gICAgfVxufVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoQmFzZSwgU3VwZXIpIHtcbiAgICB2YXIgc3RhcnQgPSAyXG5cbiAgICBpZiAodHlwZW9mIFN1cGVyID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgQmFzZS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFN1cGVyLnByb3RvdHlwZSlcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEJhc2UucHJvdG90eXBlLCBcImNvbnN0cnVjdG9yXCIsIHtcbiAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgICAgICB2YWx1ZTogQmFzZSxcbiAgICAgICAgfSlcbiAgICB9IGVsc2Uge1xuICAgICAgICBzdGFydCA9IDFcbiAgICB9XG5cbiAgICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIG1ldGhvZHMgPSBhcmd1bWVudHNbaV1cblxuICAgICAgICBpZiAobWV0aG9kcyAhPSBudWxsKSB7XG4gICAgICAgICAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKG1ldGhvZHMpXG5cbiAgICAgICAgICAgIGZvciAodmFyIGsgPSAwOyBrIDwga2V5cy5sZW5ndGg7IGsrKykge1xuICAgICAgICAgICAgICAgIHZhciBrZXkgPSBrZXlzW2tdXG4gICAgICAgICAgICAgICAgdmFyIGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKG1ldGhvZHMsIGtleSlcblxuICAgICAgICAgICAgICAgIGRlc2MuZW51bWVyYWJsZSA9IGZhbHNlXG4gICAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEJhc2UucHJvdG90eXBlLCBrZXksIGRlc2MpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCJcInVzZSBzdHJpY3RcIlxuXG4vKipcbiAqIFRoaXMgY29udGFpbnMgdGhlIGJyb3dzZXIgY29uc29sZSBzdHVmZi5cbiAqL1xuXG5leHBvcnRzLlN5bWJvbHMgPSBPYmplY3QuZnJlZXplKHtcbiAgICBQYXNzOiBcIuKck1wiLFxuICAgIEZhaWw6IFwi4pyWXCIsXG4gICAgRG90OiBcIuKApFwiLFxuICAgIERvdEZhaWw6IFwiIVwiLFxufSlcblxuZXhwb3J0cy53aW5kb3dXaWR0aCA9IDc1XG5leHBvcnRzLm5ld2xpbmUgPSBcIlxcblwiXG5cbi8vIENvbG9yIHN1cHBvcnQgaXMgdW5mb3JjZWQgYW5kIHVuc3VwcG9ydGVkLCBzaW5jZSB5b3UgY2FuIG9ubHkgc3BlY2lmeVxuLy8gbGluZS1ieS1saW5lIGNvbG9ycyB2aWEgQ1NTLCBhbmQgZXZlbiB0aGF0IGlzbid0IHZlcnkgcG9ydGFibGUuXG5leHBvcnRzLmNvbG9yU3VwcG9ydCA9IDBcblxuLyoqXG4gKiBTaW5jZSBicm93c2VycyBkb24ndCBoYXZlIHVuYnVmZmVyZWQgb3V0cHV0LCB0aGlzIGtpbmQgb2Ygc2ltdWxhdGVzIGl0LlxuICovXG5cbnZhciBhY2MgPSBcIlwiXG5cbmV4cG9ydHMuZGVmYXVsdE9wdHMgPSB7XG4gICAgd3JpdGU6IGZ1bmN0aW9uIChzdHIpIHtcbiAgICAgICAgYWNjICs9IHN0clxuXG4gICAgICAgIHZhciBpbmRleCA9IHN0ci5pbmRleE9mKFwiXFxuXCIpXG5cbiAgICAgICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgICAgICAgIHZhciBsaW5lcyA9IHN0ci5zcGxpdChcIlxcblwiKVxuXG4gICAgICAgICAgICBhY2MgPSBsaW5lcy5wb3AoKVxuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgZ2xvYmFsLmNvbnNvbGUubG9nKGxpbmVzW2ldKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIHJlc2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmIChhY2MgIT09IFwiXCIpIHtcbiAgICAgICAgICAgIGdsb2JhbC5jb25zb2xlLmxvZyhhY2MpXG4gICAgICAgICAgICBhY2MgPSBcIlwiXG4gICAgICAgIH1cbiAgICB9LFxufVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxudmFyIG1ldGhvZHMgPSByZXF1aXJlKFwiLi4vbWV0aG9kc1wiKVxudmFyIGluc3BlY3QgPSByZXF1aXJlKFwiLi4vcmVwbGFjZWQvaW5zcGVjdFwiKVxudmFyIHBlYWNoID0gcmVxdWlyZShcIi4uL3V0aWxcIikucGVhY2hcbnZhciBSZXBvcnRlciA9IHJlcXVpcmUoXCIuL3JlcG9ydGVyXCIpXG52YXIgVXRpbCA9IHJlcXVpcmUoXCIuL3V0aWxcIilcblxuZnVuY3Rpb24gc2ltcGxlSW5zcGVjdCh2YWx1ZSkge1xuICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHJldHVybiBVdGlsLmdldFN0YWNrKHZhbHVlKVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBpbnNwZWN0KHZhbHVlKVxuICAgIH1cbn1cblxuZnVuY3Rpb24gcHJpbnRUaW1lKF8sIHAsIHN0cikge1xuICAgIGlmICghXy50aW1lUHJpbnRlZCkge1xuICAgICAgICBfLnRpbWVQcmludGVkID0gdHJ1ZVxuICAgICAgICBzdHIgKz0gVXRpbC5jb2xvcihcImxpZ2h0XCIsIFwiIChcIiArIFV0aWwuZm9ybWF0VGltZShfLmR1cmF0aW9uKSArIFwiKVwiKVxuICAgIH1cblxuICAgIHJldHVybiBwLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gXy5wcmludChzdHIpIH0pXG59XG5cbmZ1bmN0aW9uIHByaW50RmFpbExpc3QoXywgc3RyKSB7XG4gICAgdmFyIHBhcnRzID0gc3RyLnNwbGl0KC9cXHI/XFxuL2cpXG5cbiAgICByZXR1cm4gXy5wcmludChcIiAgICBcIiArIFV0aWwuY29sb3IoXCJmYWlsXCIsIHBhcnRzWzBdKSlcbiAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBwZWFjaChwYXJ0cy5zbGljZSgxKSwgZnVuY3Rpb24gKHBhcnQpIHtcbiAgICAgICAgICAgIHJldHVybiBfLnByaW50KFwiICAgICAgXCIgKyBVdGlsLmNvbG9yKFwiZmFpbFwiLCBwYXJ0KSlcbiAgICAgICAgfSlcbiAgICB9KVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChvcHRzLCBtZXRob2RzKSB7XG4gICAgcmV0dXJuIG5ldyBDb25zb2xlUmVwb3J0ZXIob3B0cywgbWV0aG9kcylcbn1cblxuLyoqXG4gKiBCYXNlIGNsYXNzIGZvciBtb3N0IGNvbnNvbGUgcmVwb3J0ZXJzLlxuICpcbiAqIE5vdGU6IHByaW50aW5nIGlzIGFzeW5jaHJvbm91cywgYmVjYXVzZSBvdGhlcndpc2UsIGlmIGVub3VnaCBlcnJvcnMgZXhpc3QsXG4gKiBOb2RlIHdpbGwgZXZlbnR1YWxseSBzdGFydCBkcm9wcGluZyBsaW5lcyBzZW50IHRvIGl0cyBidWZmZXIsIGVzcGVjaWFsbHkgd2hlblxuICogc3RhY2sgdHJhY2VzIGdldCBpbnZvbHZlZC4gSWYgVGhhbGxpdW0ncyBvdXRwdXQgaXMgcmVkaXJlY3RlZCwgdGhhdCBjYW4gYmUgYVxuICogYmlnIHByb2JsZW0gZm9yIGNvbnN1bWVycywgYXMgdGhleSBvbmx5IGhhdmUgcGFydCBvZiB0aGUgb3V0cHV0LCBhbmQgd29uJ3QgYmVcbiAqIGFibGUgdG8gc2VlIGFsbCB0aGUgZXJyb3JzIGxhdGVyLiBBbHNvLCBpZiBjb25zb2xlIHdhcm5pbmdzIGNvbWUgdXAgZW4tbWFzc2UsXG4gKiB0aGF0IHdvdWxkIGFsc28gY29udHJpYnV0ZS4gU28sIHdlIGhhdmUgdG8gd2FpdCBmb3IgZWFjaCBsaW5lIHRvIGZsdXNoIGJlZm9yZVxuICogd2UgY2FuIGNvbnRpbnVlLCBzbyB0aGUgZnVsbCBvdXRwdXQgbWFrZXMgaXRzIHdheSB0byB0aGUgY29uc29sZS5cbiAqXG4gKiBTb21lIHRlc3QgZnJhbWV3b3JrcyBsaWtlIFRhcGUgbWlzcyB0aGlzLCB0aG91Z2guXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9wdHMgVGhlIG9wdGlvbnMgZm9yIHRoZSByZXBvcnRlci5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IG9wdHMud3JpdGUgVGhlIHVuYnVmZmVycmVkIHdyaXRlciBmb3IgdGhlIHJlcG9ydGVyLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gb3B0cy5yZXNldCBBIHJlc2V0IGZ1bmN0aW9uIGZvciB0aGUgcHJpbnRlciArIHdyaXRlci5cbiAqIEBwYXJhbSB7U3RyaW5nW119IGFjY2VwdHMgVGhlIG9wdGlvbnMgYWNjZXB0ZWQuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBpbml0IFRoZSBpbml0IGZ1bmN0aW9uIGZvciB0aGUgc3ViY2xhc3MgcmVwb3J0ZXInc1xuICogICAgICAgICAgICAgICAgICAgICAgICBpc29sYXRlZCBzdGF0ZSAoY3JlYXRlZCBieSBmYWN0b3J5KS5cbiAqL1xuZnVuY3Rpb24gQ29uc29sZVJlcG9ydGVyKG9wdHMsIG1ldGhvZHMpIHtcbiAgICBSZXBvcnRlci5jYWxsKHRoaXMsIFV0aWwuVHJlZSwgb3B0cywgbWV0aG9kcywgdHJ1ZSlcblxuICAgIGlmICghVXRpbC5Db2xvcnMuZm9yY2VkKCkgJiYgbWV0aG9kcy5hY2NlcHRzLmluZGV4T2YoXCJjb2xvclwiKSA+PSAwKSB7XG4gICAgICAgIHRoaXMub3B0cy5jb2xvciA9IG9wdHMuY29sb3JcbiAgICB9XG5cbiAgICBVdGlsLmRlZmF1bHRpZnkodGhpcywgb3B0cywgXCJ3cml0ZVwiKVxuICAgIHRoaXMucmVzZXQoKVxufVxuXG5tZXRob2RzKENvbnNvbGVSZXBvcnRlciwgUmVwb3J0ZXIsIHtcbiAgICBwcmludDogZnVuY3Rpb24gKHN0cikge1xuICAgICAgICBpZiAoc3RyID09IG51bGwpIHN0ciA9IFwiXCJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLm9wdHMud3JpdGUoc3RyICsgXCJcXG5cIikpXG4gICAgfSxcblxuICAgIHdyaXRlOiBmdW5jdGlvbiAoc3RyKSB7XG4gICAgICAgIGlmIChzdHIgIT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLm9wdHMud3JpdGUoc3RyKSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIHByaW50UmVzdWx0czogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXNcblxuICAgICAgICBpZiAoIXRoaXMudGVzdHMgJiYgIXRoaXMuc2tpcCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucHJpbnQoXG4gICAgICAgICAgICAgICAgVXRpbC5jb2xvcihcInBsYWluXCIsIFwiICAwIHRlc3RzXCIpICtcbiAgICAgICAgICAgICAgICBVdGlsLmNvbG9yKFwibGlnaHRcIiwgXCIgKDBtcylcIikpXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiBzZWxmLnByaW50KCkgfSlcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLnByaW50KCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgcCA9IFByb21pc2UucmVzb2x2ZSgpXG5cbiAgICAgICAgICAgIGlmIChzZWxmLnBhc3MpIHtcbiAgICAgICAgICAgICAgICBwID0gcHJpbnRUaW1lKHNlbGYsIHAsXG4gICAgICAgICAgICAgICAgICAgIFV0aWwuY29sb3IoXCJicmlnaHQgcGFzc1wiLCBcIiAgXCIpICtcbiAgICAgICAgICAgICAgICAgICAgVXRpbC5jb2xvcihcImdyZWVuXCIsIHNlbGYucGFzcyArIFwiIHBhc3NpbmdcIikpXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzZWxmLnNraXApIHtcbiAgICAgICAgICAgICAgICBwID0gcHJpbnRUaW1lKHNlbGYsIHAsXG4gICAgICAgICAgICAgICAgICAgIFV0aWwuY29sb3IoXCJza2lwXCIsIFwiICBcIiArIHNlbGYuc2tpcCArIFwiIHNraXBwZWRcIikpXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzZWxmLmZhaWwpIHtcbiAgICAgICAgICAgICAgICBwID0gcHJpbnRUaW1lKHNlbGYsIHAsXG4gICAgICAgICAgICAgICAgICAgIFV0aWwuY29sb3IoXCJicmlnaHQgZmFpbFwiLCBcIiAgXCIpICtcbiAgICAgICAgICAgICAgICAgICAgVXRpbC5jb2xvcihcImZhaWxcIiwgc2VsZi5mYWlsICsgXCIgZmFpbGluZ1wiKSlcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHBcbiAgICAgICAgfSlcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gc2VsZi5wcmludCgpIH0pXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBwZWFjaChzZWxmLmVycm9ycywgZnVuY3Rpb24gKHJlcG9ydCwgaSkge1xuICAgICAgICAgICAgICAgIHZhciBuYW1lID0gaSArIDEgKyBcIikgXCIgKyBVdGlsLmpvaW5QYXRoKHJlcG9ydCkgK1xuICAgICAgICAgICAgICAgICAgICBVdGlsLmZvcm1hdFJlc3QocmVwb3J0KVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNlbGYucHJpbnQoXCIgIFwiICsgVXRpbC5jb2xvcihcInBsYWluXCIsIG5hbWUgKyBcIjpcIikpXG4gICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcHJpbnRGYWlsTGlzdChzZWxmLCBzaW1wbGVJbnNwZWN0KHJlcG9ydC5lcnJvcikpXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiBzZWxmLnByaW50KCkgfSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pXG4gICAgfSxcblxuICAgIHByaW50RXJyb3I6IGZ1bmN0aW9uIChyZXBvcnQpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgICAgIHZhciBsaW5lcyA9IHNpbXBsZUluc3BlY3QocmVwb3J0LmVycm9yKS5zcGxpdCgvXFxyP1xcbi9nKVxuXG4gICAgICAgIHJldHVybiB0aGlzLnByaW50KCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gcGVhY2gobGluZXMsIGZ1bmN0aW9uIChsaW5lKSB7IHJldHVybiBzZWxmLnByaW50KGxpbmUpIH0pXG4gICAgICAgIH0pXG4gICAgfSxcbn0pXG4iLCJcInVzZSBzdHJpY3RcIlxuXG52YXIgVXRpbCA9IHJlcXVpcmUoXCIuL3V0aWxcIilcblxuZXhwb3J0cy5vbiA9IHJlcXVpcmUoXCIuL29uXCIpXG5leHBvcnRzLmNvbnNvbGVSZXBvcnRlciA9IHJlcXVpcmUoXCIuL2NvbnNvbGUtcmVwb3J0ZXJcIilcbmV4cG9ydHMuUmVwb3J0ZXIgPSByZXF1aXJlKFwiLi9yZXBvcnRlclwiKVxuZXhwb3J0cy5zeW1ib2xzID0gVXRpbC5zeW1ib2xzXG5leHBvcnRzLndpbmRvd1dpZHRoID0gVXRpbC53aW5kb3dXaWR0aFxuZXhwb3J0cy5uZXdsaW5lID0gVXRpbC5uZXdsaW5lXG5leHBvcnRzLnNldENvbG9yID0gVXRpbC5zZXRDb2xvclxuZXhwb3J0cy51bnNldENvbG9yID0gVXRpbC51bnNldENvbG9yXG5leHBvcnRzLnNwZWVkID0gVXRpbC5zcGVlZFxuZXhwb3J0cy5nZXRTdGFjayA9IFV0aWwuZ2V0U3RhY2tcbmV4cG9ydHMuQ29sb3JzID0gVXRpbC5Db2xvcnNcbmV4cG9ydHMuY29sb3IgPSBVdGlsLmNvbG9yXG5leHBvcnRzLmZvcm1hdFJlc3QgPSBVdGlsLmZvcm1hdFJlc3RcbmV4cG9ydHMuam9pblBhdGggPSBVdGlsLmpvaW5QYXRoXG5leHBvcnRzLmZvcm1hdFRpbWUgPSBVdGlsLmZvcm1hdFRpbWVcbiIsIlwidXNlIHN0cmljdFwiXG5cbnZhciBTdGF0dXMgPSByZXF1aXJlKFwiLi91dGlsXCIpLlN0YXR1c1xuXG4vKipcbiAqIEEgbWFjcm8gb2Ygc29ydHMsIHRvIHNpbXBsaWZ5IGNyZWF0aW5nIHJlcG9ydGVycy4gSXQgYWNjZXB0cyBhbiBvYmplY3Qgd2l0aFxuICogdGhlIGZvbGxvd2luZyBwYXJhbWV0ZXJzOlxuICpcbiAqIGBhY2NlcHRzOiBzdHJpbmdbXWAgLSBUaGUgcHJvcGVydGllcyBhY2NlcHRlZC4gRXZlcnl0aGluZyBlbHNlIGlzIGlnbm9yZWQsXG4gKiBhbmQgaXQncyBwYXJ0aWFsbHkgdGhlcmUgZm9yIGRvY3VtZW50YXRpb24uIFRoaXMgcGFyYW1ldGVyIGlzIHJlcXVpcmVkLlxuICpcbiAqIGBjcmVhdGUob3B0cywgbWV0aG9kcylgIC0gQ3JlYXRlIGEgbmV3IHJlcG9ydGVyIGluc3RhbmNlLiAgVGhpcyBwYXJhbWV0ZXIgaXNcbiAqIHJlcXVpcmVkLiBOb3RlIHRoYXQgYG1ldGhvZHNgIHJlZmVycyB0byB0aGUgcGFyYW1ldGVyIG9iamVjdCBpdHNlbGYuXG4gKlxuICogYGluaXQoc3RhdGUsIG9wdHMpYCAtIEluaXRpYWxpemUgZXh0cmEgcmVwb3J0ZXIgc3RhdGUsIGlmIGFwcGxpY2FibGUuXG4gKlxuICogYGJlZm9yZShyZXBvcnRlcilgIC0gRG8gdGhpbmdzIGJlZm9yZSBlYWNoIGV2ZW50LCByZXR1cm5pbmcgYSBwb3NzaWJsZVxuICogdGhlbmFibGUgd2hlbiBkb25lLiBUaGlzIGRlZmF1bHRzIHRvIGEgbm8tb3AuXG4gKlxuICogYGFmdGVyKHJlcG9ydGVyKWAgLSBEbyB0aGluZ3MgYWZ0ZXIgZWFjaCBldmVudCwgcmV0dXJuaW5nIGEgcG9zc2libGVcbiAqIHRoZW5hYmxlIHdoZW4gZG9uZS4gVGhpcyBkZWZhdWx0cyB0byBhIG5vLW9wLlxuICpcbiAqIGByZXBvcnQocmVwb3J0ZXIsIHJlcG9ydClgIC0gSGFuZGxlIGEgdGVzdCByZXBvcnQuIFRoaXMgbWF5IHJldHVybiBhIHBvc3NpYmxlXG4gKiB0aGVuYWJsZSB3aGVuIGRvbmUsIGFuZCBpdCBpcyByZXF1aXJlZC5cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAobmFtZSwgbWV0aG9kcykge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShyZXBvcnRlciwgXCJuYW1lXCIsIHt2YWx1ZTogbmFtZX0pXG4gICAgcmVwb3J0ZXJbbmFtZV0gPSByZXBvcnRlclxuICAgIHJldHVybiByZXBvcnRlclxuICAgIGZ1bmN0aW9uIHJlcG9ydGVyKG9wdHMpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEluc3RlYWQgb2Ygc2lsZW50bHkgZmFpbGluZyB0byB3b3JrLCBsZXQncyBlcnJvciBvdXQgd2hlbiBhIHJlcG9ydCBpc1xuICAgICAgICAgKiBwYXNzZWQgaW4sIGFuZCBpbmZvcm0gdGhlIHVzZXIgaXQgbmVlZHMgaW5pdGlhbGl6ZWQuIENoYW5jZXMgYXJlLFxuICAgICAgICAgKiB0aGVyZSdzIG5vIGxlZ2l0aW1hdGUgcmVhc29uIHRvIGV2ZW4gcGFzcyBhIHJlcG9ydCwgYW55d2F5cy5cbiAgICAgICAgICovXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0cyA9PT0gXCJvYmplY3RcIiAmJiBvcHRzICE9PSBudWxsICYmXG4gICAgICAgICAgICAgICAgdHlwZW9mIG9wdHMuXyA9PT0gXCJudW1iZXJcIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICAgICAgICAgICBcIk9wdGlvbnMgY2Fubm90IGJlIGEgcmVwb3J0LiBEaWQgeW91IGZvcmdldCB0byBjYWxsIHRoZSBcIiArXG4gICAgICAgICAgICAgICAgXCJmYWN0b3J5IGZpcnN0P1wiKVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIF8gPSBtZXRob2RzLmNyZWF0ZShvcHRzLCBtZXRob2RzKVxuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAocmVwb3J0KSB7XG4gICAgICAgICAgICAvLyBPbmx5IHNvbWUgZXZlbnRzIGhhdmUgY29tbW9uIHN0ZXBzLlxuICAgICAgICAgICAgaWYgKHJlcG9ydC5pc1N0YXJ0KSB7XG4gICAgICAgICAgICAgICAgXy5ydW5uaW5nID0gdHJ1ZVxuICAgICAgICAgICAgfSBlbHNlIGlmIChyZXBvcnQuaXNFbnRlciB8fCByZXBvcnQuaXNQYXNzKSB7XG4gICAgICAgICAgICAgICAgXy5nZXQocmVwb3J0LnBhdGgpLnN0YXR1cyA9IFN0YXR1cy5QYXNzaW5nXG4gICAgICAgICAgICAgICAgXy5kdXJhdGlvbiArPSByZXBvcnQuZHVyYXRpb25cbiAgICAgICAgICAgICAgICBfLnRlc3RzKytcbiAgICAgICAgICAgICAgICBfLnBhc3MrK1xuICAgICAgICAgICAgfSBlbHNlIGlmIChyZXBvcnQuaXNGYWlsKSB7XG4gICAgICAgICAgICAgICAgXy5nZXQocmVwb3J0LnBhdGgpLnN0YXR1cyA9IFN0YXR1cy5GYWlsaW5nXG4gICAgICAgICAgICAgICAgXy5kdXJhdGlvbiArPSByZXBvcnQuZHVyYXRpb25cbiAgICAgICAgICAgICAgICBfLnRlc3RzKytcbiAgICAgICAgICAgICAgICBfLmZhaWwrK1xuICAgICAgICAgICAgfSBlbHNlIGlmIChyZXBvcnQuaXNIb29rKSB7XG4gICAgICAgICAgICAgICAgXy5nZXQocmVwb3J0LnBhdGgpLnN0YXR1cyA9IFN0YXR1cy5GYWlsaW5nXG4gICAgICAgICAgICAgICAgXy5nZXQocmVwb3J0LnJvb3RQYXRoKS5zdGF0dXMgPSBTdGF0dXMuRmFpbGluZ1xuICAgICAgICAgICAgICAgIF8uZmFpbCsrXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHJlcG9ydC5pc1NraXApIHtcbiAgICAgICAgICAgICAgICBfLmdldChyZXBvcnQucGF0aCkuc3RhdHVzID0gU3RhdHVzLlNraXBwZWRcbiAgICAgICAgICAgICAgICAvLyBTa2lwcGVkIHRlc3RzIGFyZW4ndCBjb3VudGVkIGluIHRoZSB0b3RhbCB0ZXN0IGNvdW50XG4gICAgICAgICAgICAgICAgXy5za2lwKytcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShcbiAgICAgICAgICAgICAgICB0eXBlb2YgbWV0aG9kcy5iZWZvcmUgPT09IFwiZnVuY3Rpb25cIlxuICAgICAgICAgICAgICAgICAgICA/IG1ldGhvZHMuYmVmb3JlKF8pXG4gICAgICAgICAgICAgICAgICAgIDogdW5kZWZpbmVkKVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gbWV0aG9kcy5yZXBvcnQoXywgcmVwb3J0KSB9KVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0eXBlb2YgbWV0aG9kcy5hZnRlciA9PT0gXCJmdW5jdGlvblwiXG4gICAgICAgICAgICAgICAgICAgID8gbWV0aG9kcy5hZnRlcihfKVxuICAgICAgICAgICAgICAgICAgICA6IHVuZGVmaW5lZFxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAocmVwb3J0LmlzRW5kIHx8IHJlcG9ydC5pc0Vycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIF8ucmVzZXQoKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXy5vcHRzLnJlc2V0KClcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgIH1cbn1cbiIsIlwidXNlIHN0cmljdFwiXG5cbnZhciBtZXRob2RzID0gcmVxdWlyZShcIi4uL21ldGhvZHNcIilcbnZhciBkZWZhdWx0aWZ5ID0gcmVxdWlyZShcIi4vdXRpbFwiKS5kZWZhdWx0aWZ5XG52YXIgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eVxuXG5mdW5jdGlvbiBTdGF0ZShyZXBvcnRlcikge1xuICAgIGlmICh0eXBlb2YgcmVwb3J0ZXIubWV0aG9kcy5pbml0ID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgKDAsIHJlcG9ydGVyLm1ldGhvZHMuaW5pdCkodGhpcywgcmVwb3J0ZXIub3B0cylcbiAgICB9XG59XG5cbi8qKlxuICogVGhpcyBoZWxwcyBzcGVlZCB1cCBnZXR0aW5nIHByZXZpb3VzIHRyZWVzLCBzbyBhIHBvdGVudGlhbGx5IGV4cGVuc2l2ZVxuICogdHJlZSBzZWFyY2ggZG9lc24ndCBoYXZlIHRvIGJlIHBlcmZvcm1lZC5cbiAqXG4gKiAoVGhpcyBkb2VzIGFjdHVhbGx5IG1ha2UgYSBzbGlnaHQgcGVyZiBkaWZmZXJlbmNlIGluIHRoZSB0ZXN0cy4pXG4gKi9cbmZ1bmN0aW9uIGlzUmVwZWF0KGNhY2hlLCBwYXRoKSB7XG4gICAgLy8gQ2FuJ3QgYmUgYSByZXBlYXQgdGhlIGZpcnN0IHRpbWUuXG4gICAgaWYgKGNhY2hlLnBhdGggPT0gbnVsbCkgcmV0dXJuIGZhbHNlXG4gICAgaWYgKHBhdGgubGVuZ3RoICE9PSBjYWNoZS5wYXRoLmxlbmd0aCkgcmV0dXJuIGZhbHNlXG4gICAgaWYgKHBhdGggPT09IGNhY2hlLnBhdGgpIHJldHVybiB0cnVlXG5cbiAgICAvLyBJdCdzIHVubGlrZWx5IHRoZSBuZXN0aW5nIHdpbGwgYmUgY29uc2lzdGVudGx5IG1vcmUgdGhhbiBhIGZldyBsZXZlbHNcbiAgICAvLyBkZWVwICg+PSA1KSwgc28gdGhpcyBzaG91bGRuJ3QgYm9nIGFueXRoaW5nIGRvd24uXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXRoLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChwYXRoW2ldICE9PSBjYWNoZS5wYXRoW2ldKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNhY2hlLnBhdGggPSBwYXRoXG4gICAgcmV0dXJuIHRydWVcbn1cblxuLyoqXG4gKiBTdXBlcmNsYXNzIGZvciBhbGwgcmVwb3J0ZXJzLiBUaGlzIGNvdmVycyB0aGUgc3RhdGUgZm9yIHByZXR0eSBtdWNoIGV2ZXJ5XG4gKiByZXBvcnRlci5cbiAqXG4gKiBOb3RlIHRoYXQgaWYgeW91IGRlbGF5IHRoZSBpbml0aWFsIHJlc2V0LCB5b3Ugc3RpbGwgbXVzdCBjYWxsIGl0IGJlZm9yZSB0aGVcbiAqIGNvbnN0cnVjdG9yIGZpbmlzaGVzLlxuICovXG5tb2R1bGUuZXhwb3J0cyA9IFJlcG9ydGVyXG5mdW5jdGlvbiBSZXBvcnRlcihUcmVlLCBvcHRzLCBtZXRob2RzLCBkZWxheSkge1xuICAgIHRoaXMuVHJlZSA9IFRyZWVcbiAgICB0aGlzLm9wdHMgPSB7fVxuICAgIHRoaXMubWV0aG9kcyA9IG1ldGhvZHNcbiAgICBkZWZhdWx0aWZ5KHRoaXMsIG9wdHMsIFwicmVzZXRcIilcbiAgICBpZiAoIWRlbGF5KSB0aGlzLnJlc2V0KClcbn1cblxubWV0aG9kcyhSZXBvcnRlciwge1xuICAgIHJlc2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMucnVubmluZyA9IGZhbHNlXG4gICAgICAgIHRoaXMudGltZVByaW50ZWQgPSBmYWxzZVxuICAgICAgICB0aGlzLnRlc3RzID0gMFxuICAgICAgICB0aGlzLnBhc3MgPSAwXG4gICAgICAgIHRoaXMuZmFpbCA9IDBcbiAgICAgICAgdGhpcy5za2lwID0gMFxuICAgICAgICB0aGlzLmR1cmF0aW9uID0gMFxuICAgICAgICB0aGlzLmVycm9ycyA9IFtdXG4gICAgICAgIHRoaXMuc3RhdGUgPSBuZXcgU3RhdGUodGhpcylcbiAgICAgICAgdGhpcy5iYXNlID0gbmV3IHRoaXMuVHJlZShudWxsKVxuICAgICAgICB0aGlzLmNhY2hlID0ge3BhdGg6IG51bGwsIHJlc3VsdDogbnVsbH1cbiAgICB9LFxuXG4gICAgcHVzaEVycm9yOiBmdW5jdGlvbiAocmVwb3J0KSB7XG4gICAgICAgIHRoaXMuZXJyb3JzLnB1c2gocmVwb3J0KVxuICAgIH0sXG5cbiAgICBnZXQ6IGZ1bmN0aW9uIChwYXRoKSB7XG4gICAgICAgIGlmIChpc1JlcGVhdCh0aGlzLmNhY2hlLCBwYXRoKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY2FjaGUucmVzdWx0XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgY2hpbGQgPSB0aGlzLmJhc2VcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBhdGgubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBlbnRyeSA9IHBhdGhbaV1cblxuICAgICAgICAgICAgaWYgKGhhc093bi5jYWxsKGNoaWxkLmNoaWxkcmVuLCBlbnRyeS5pbmRleCkpIHtcbiAgICAgICAgICAgICAgICBjaGlsZCA9IGNoaWxkLmNoaWxkcmVuW2VudHJ5LmluZGV4XVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjaGlsZCA9IGNoaWxkLmNoaWxkcmVuW2VudHJ5LmluZGV4XSA9IG5ldyB0aGlzLlRyZWUoZW50cnkubmFtZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLmNhY2hlLnJlc3VsdCA9IGNoaWxkXG4gICAgfSxcbn0pXG4iLCJcInVzZSBzdHJpY3RcIlxuXG4vLyBUT0RPOiBhZGQgYGRpZmZgIHN1cHBvcnRcbi8vIHZhciBkaWZmID0gcmVxdWlyZShcImRpZmZcIilcblxudmFyIFV0aWwgPSByZXF1aXJlKFwiLi4vdXRpbFwiKVxudmFyIFNldHRpbmdzID0gcmVxdWlyZShcIi4uL3NldHRpbmdzXCIpXG5cbmV4cG9ydHMuc3ltYm9scyA9IFNldHRpbmdzLnN5bWJvbHNcbmV4cG9ydHMud2luZG93V2lkdGggPSBTZXR0aW5ncy53aW5kb3dXaWR0aFxuZXhwb3J0cy5uZXdsaW5lID0gU2V0dGluZ3MubmV3bGluZVxuXG4vKlxuICogU3RhY2sgbm9ybWFsaXphdGlvblxuICovXG5cbnZhciBzdGFja0luY2x1ZGVzTWVzc2FnZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHN0YWNrID0gVXRpbC5nZXRTdGFjayhuZXcgRXJyb3IoXCJ0ZXN0XCIpKVxuXG4gICAgLy8gICAgIEZpcmVmb3gsIFNhZmFyaSAgICAgICAgICAgICAgICAgQ2hyb21lLCBJRVxuICAgIHJldHVybiAhL14oQCk/XFxTK1xcOlxcZCsvLnRlc3Qoc3RhY2spICYmICEvXlxccyphdC8udGVzdChzdGFjaylcbn0pKClcblxuZnVuY3Rpb24gZm9ybWF0TGluZUJyZWFrcyhsZWFkLCBzdHIpIHtcbiAgICByZXR1cm4gc3RyXG4gICAgICAgIC5yZXBsYWNlKC9eXFxzKy9nbSwgbGVhZClcbiAgICAgICAgLnJlcGxhY2UoL1xccj9cXG58XFxyL2csIFNldHRpbmdzLm5ld2xpbmUoKSlcbn1cblxuZXhwb3J0cy5nZXRTdGFjayA9IGZ1bmN0aW9uIChlKSB7XG4gICAgaWYgKGUgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICB2YXIgZGVzY3JpcHRpb24gPSBmb3JtYXRMaW5lQnJlYWtzKFwiICAgIFwiLCBlLm5hbWUgKyBcIjogXCIgKyBlLm1lc3NhZ2UpXG4gICAgICAgIHZhciBzdHJpcHBlZCA9IFwiXCJcblxuICAgICAgICBpZiAoc3RhY2tJbmNsdWRlc01lc3NhZ2UpIHtcbiAgICAgICAgICAgIHZhciBzdGFjayA9IFV0aWwuZ2V0U3RhY2soZSlcbiAgICAgICAgICAgIHZhciBpbmRleCA9IHN0YWNrLmluZGV4T2YoZS5tZXNzYWdlKVxuXG4gICAgICAgICAgICBpZiAoaW5kZXggPCAwKSByZXR1cm4gZm9ybWF0TGluZUJyZWFrcyhcIlwiLCBVdGlsLmdldFN0YWNrKGUpKVxuXG4gICAgICAgICAgICB2YXIgcmUgPSAvXFxyP1xcbi9nXG5cbiAgICAgICAgICAgIHJlLmxhc3RJbmRleCA9IGluZGV4ICsgZS5tZXNzYWdlLmxlbmd0aFxuICAgICAgICAgICAgaWYgKHJlLnRlc3Qoc3RhY2spKSB7XG4gICAgICAgICAgICAgICAgc3RyaXBwZWQgPSBmb3JtYXRMaW5lQnJlYWtzKFwiXCIsIHN0YWNrLnNsaWNlKHJlLmxhc3RJbmRleCkpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzdHJpcHBlZCA9IGZvcm1hdExpbmVCcmVha3MoXCJcIiwgVXRpbC5nZXRTdGFjayhlKSlcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzdHJpcHBlZCAhPT0gXCJcIikgZGVzY3JpcHRpb24gKz0gU2V0dGluZ3MubmV3bGluZSgpICsgc3RyaXBwZWRcbiAgICAgICAgcmV0dXJuIGRlc2NyaXB0aW9uXG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGZvcm1hdExpbmVCcmVha3MoXCJcIiwgVXRpbC5nZXRTdGFjayhlKSlcbiAgICB9XG59XG5cbnZhciBDb2xvcnMgPSBleHBvcnRzLkNvbG9ycyA9IFNldHRpbmdzLkNvbG9yc1xuXG4vLyBDb2xvciBwYWxldHRlIHB1bGxlZCBmcm9tIE1vY2hhXG5mdW5jdGlvbiBjb2xvclRvTnVtYmVyKG5hbWUpIHtcbiAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICBjYXNlIFwicGFzc1wiOiByZXR1cm4gOTBcbiAgICBjYXNlIFwiZmFpbFwiOiByZXR1cm4gMzFcblxuICAgIGNhc2UgXCJicmlnaHQgcGFzc1wiOiByZXR1cm4gOTJcbiAgICBjYXNlIFwiYnJpZ2h0IGZhaWxcIjogcmV0dXJuIDkxXG4gICAgY2FzZSBcImJyaWdodCB5ZWxsb3dcIjogcmV0dXJuIDkzXG5cbiAgICBjYXNlIFwic2tpcFwiOiByZXR1cm4gMzZcbiAgICBjYXNlIFwic3VpdGVcIjogcmV0dXJuIDBcbiAgICBjYXNlIFwicGxhaW5cIjogcmV0dXJuIDBcblxuICAgIGNhc2UgXCJlcnJvciB0aXRsZVwiOiByZXR1cm4gMFxuICAgIGNhc2UgXCJlcnJvciBtZXNzYWdlXCI6IHJldHVybiAzMVxuICAgIGNhc2UgXCJlcnJvciBzdGFja1wiOiByZXR1cm4gOTBcblxuICAgIGNhc2UgXCJjaGVja21hcmtcIjogcmV0dXJuIDMyXG4gICAgY2FzZSBcImZhc3RcIjogcmV0dXJuIDkwXG4gICAgY2FzZSBcIm1lZGl1bVwiOiByZXR1cm4gMzNcbiAgICBjYXNlIFwic2xvd1wiOiByZXR1cm4gMzFcbiAgICBjYXNlIFwiZ3JlZW5cIjogcmV0dXJuIDMyXG4gICAgY2FzZSBcImxpZ2h0XCI6IHJldHVybiA5MFxuXG4gICAgY2FzZSBcImRpZmYgZ3V0dGVyXCI6IHJldHVybiA5MFxuICAgIGNhc2UgXCJkaWZmIGFkZGVkXCI6IHJldHVybiAzMlxuICAgIGNhc2UgXCJkaWZmIHJlbW92ZWRcIjogcmV0dXJuIDMxXG4gICAgZGVmYXVsdDogdGhyb3cgbmV3IFR5cGVFcnJvcihcIkludmFsaWQgbmFtZTogXFxcIlwiICsgbmFtZSArIFwiXFxcIlwiKVxuICAgIH1cbn1cblxuZXhwb3J0cy5jb2xvciA9IGZ1bmN0aW9uIChuYW1lLCBzdHIpIHtcbiAgICBpZiAoQ29sb3JzLnN1cHBvcnRlZCgpKSB7XG4gICAgICAgIHJldHVybiBcIlxcdTAwMWJbXCIgKyBjb2xvclRvTnVtYmVyKG5hbWUpICsgXCJtXCIgKyBzdHIgKyBcIlxcdTAwMWJbMG1cIlxuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBzdHIgKyBcIlwiXG4gICAgfVxufVxuXG5leHBvcnRzLnNldENvbG9yID0gZnVuY3Rpb24gKF8pIHtcbiAgICBpZiAoXy5vcHRzLmNvbG9yICE9IG51bGwpIENvbG9ycy5tYXliZVNldChfLm9wdHMuY29sb3IpXG59XG5cbmV4cG9ydHMudW5zZXRDb2xvciA9IGZ1bmN0aW9uIChfKSB7XG4gICAgaWYgKF8ub3B0cy5jb2xvciAhPSBudWxsKSBDb2xvcnMubWF5YmVSZXN0b3JlKClcbn1cblxudmFyIFN0YXR1cyA9IGV4cG9ydHMuU3RhdHVzID0gT2JqZWN0LmZyZWV6ZSh7XG4gICAgVW5rbm93bjogMCxcbiAgICBTa2lwcGVkOiAxLFxuICAgIFBhc3Npbmc6IDIsXG4gICAgRmFpbGluZzogMyxcbn0pXG5cbmV4cG9ydHMuVHJlZSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHRoaXMudmFsdWUgPSB2YWx1ZVxuICAgIHRoaXMuc3RhdHVzID0gU3RhdHVzLlVua25vd25cbiAgICB0aGlzLmNoaWxkcmVuID0gT2JqZWN0LmNyZWF0ZShudWxsKVxufVxuXG5leHBvcnRzLmRlZmF1bHRpZnkgPSBmdW5jdGlvbiAoXywgb3B0cywgcHJvcCkge1xuICAgIGlmIChfLm1ldGhvZHMuYWNjZXB0cy5pbmRleE9mKHByb3ApID49IDApIHtcbiAgICAgICAgdmFyIHVzZWQgPSBvcHRzICE9IG51bGwgJiYgdHlwZW9mIG9wdHNbcHJvcF0gPT09IFwiZnVuY3Rpb25cIlxuICAgICAgICAgICAgPyBvcHRzXG4gICAgICAgICAgICA6IFNldHRpbmdzLmRlZmF1bHRPcHRzKClcblxuICAgICAgICBfLm9wdHNbcHJvcF0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVzZWRbcHJvcF0uYXBwbHkodXNlZCwgYXJndW1lbnRzKSlcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gam9pblBhdGgocmVwb3J0UGF0aCkge1xuICAgIHZhciBwYXRoID0gXCJcIlxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZXBvcnRQYXRoLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHBhdGggKz0gXCIgXCIgKyByZXBvcnRQYXRoW2ldLm5hbWVcbiAgICB9XG5cbiAgICByZXR1cm4gcGF0aC5zbGljZSgxKVxufVxuXG5leHBvcnRzLmpvaW5QYXRoID0gZnVuY3Rpb24gKHJlcG9ydCkge1xuICAgIHJldHVybiBqb2luUGF0aChyZXBvcnQucGF0aClcbn1cblxuZXhwb3J0cy5zcGVlZCA9IGZ1bmN0aW9uIChyZXBvcnQpIHtcbiAgICBpZiAocmVwb3J0LmR1cmF0aW9uID49IHJlcG9ydC5zbG93KSByZXR1cm4gXCJzbG93XCJcbiAgICBpZiAocmVwb3J0LmR1cmF0aW9uID49IHJlcG9ydC5zbG93IC8gMikgcmV0dXJuIFwibWVkaXVtXCJcbiAgICBpZiAocmVwb3J0LmR1cmF0aW9uID49IDApIHJldHVybiBcImZhc3RcIlxuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKFwiRHVyYXRpb24gbXVzdCBub3QgYmUgbmVnYXRpdmVcIilcbn1cblxuZXhwb3J0cy5mb3JtYXRUaW1lID0gKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcyA9IDEwMDAgLyogbXMgKi9cbiAgICB2YXIgbSA9IDYwICogc1xuICAgIHZhciBoID0gNjAgKiBtXG4gICAgdmFyIGQgPSAyNCAqIGhcblxuICAgIHJldHVybiBmdW5jdGlvbiAobXMpIHtcbiAgICAgICAgaWYgKG1zID49IGQpIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gZCkgKyBcImRcIlxuICAgICAgICBpZiAobXMgPj0gaCkgcmV0dXJuIE1hdGgucm91bmQobXMgLyBoKSArIFwiaFwiXG4gICAgICAgIGlmIChtcyA+PSBtKSByZXR1cm4gTWF0aC5yb3VuZChtcyAvIG0pICsgXCJtXCJcbiAgICAgICAgaWYgKG1zID49IHMpIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gcykgKyBcInNcIlxuICAgICAgICByZXR1cm4gbXMgKyBcIm1zXCJcbiAgICB9XG59KSgpXG5cbmV4cG9ydHMuZm9ybWF0UmVzdCA9IGZ1bmN0aW9uIChyZXBvcnQpIHtcbiAgICBpZiAoIXJlcG9ydC5pc0hvb2spIHJldHVybiBcIlwiXG4gICAgdmFyIHBhdGggPSBcIiAoXCJcblxuICAgIGlmIChyZXBvcnQucm9vdFBhdGgubGVuZ3RoKSB7XG4gICAgICAgIHBhdGggKz0gcmVwb3J0LnN0YWdlXG4gICAgICAgIGlmIChyZXBvcnQubmFtZSkgcGF0aCArPSBcIiDigJIgXCIgKyByZXBvcnQubmFtZVxuICAgICAgICBpZiAocmVwb3J0LnBhdGgubGVuZ3RoID4gcmVwb3J0LnJvb3RQYXRoLmxlbmd0aCArIDEpIHtcbiAgICAgICAgICAgIHBhdGggKz0gXCIsIGluIFwiICsgam9pblBhdGgocmVwb3J0LnJvb3RQYXRoKVxuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcGF0aCArPSBcImdsb2JhbCBcIiArIHJlcG9ydC5zdGFnZVxuICAgICAgICBpZiAocmVwb3J0Lm5hbWUpIHBhdGggKz0gXCIg4oCSIFwiICsgcmVwb3J0Lm5hbWVcbiAgICB9XG5cbiAgICByZXR1cm4gcGF0aCArIFwiKVwiXG59XG5cbi8vIGV4cG9ydHMudW5pZmllZERpZmYgPSBmdW5jdGlvbiAoZXJyKSB7XG4vLyAgICAgdmFyIG1zZyA9IGRpZmYuY3JlYXRlUGF0Y2goXCJzdHJpbmdcIiwgZXJyLmFjdHVhbCwgZXJyLmV4cGVjdGVkKVxuLy8gICAgIHZhciBsaW5lcyA9IG1zZy5zcGxpdChTZXR0aW5ncy5uZXdsaW5lKCkpLnNsaWNlKDAsIDQpXG4vLyAgICAgdmFyIHJldCA9IFNldHRpbmdzLm5ld2xpbmUoKSArIFwiICAgICAgXCIgK1xuLy8gICAgICAgICBjb2xvcihcImRpZmYgYWRkZWRcIiwgXCIrIGV4cGVjdGVkXCIpICsgXCIgXCIgK1xuLy8gICAgICAgICBjb2xvcihcImRpZmYgcmVtb3ZlZFwiLCBcIi0gYWN0dWFsXCIpICtcbi8vICAgICAgICAgU2V0dGluZ3MubmV3bGluZSgpXG4vL1xuLy8gICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGluZXMubGVuZ3RoOyBpKyspIHtcbi8vICAgICAgICAgdmFyIGxpbmUgPSBsaW5lc1tpXVxuLy9cbi8vICAgICAgICAgaWYgKGxpbmVbMF0gPT09IFwiK1wiKSB7XG4vLyAgICAgICAgICAgICByZXQgKz0gU2V0dGluZ3MubmV3bGluZSgpICsgXCIgICAgICBcIiArIGNvbG9yKFwiZGlmZiBhZGRlZFwiLCBsaW5lKVxuLy8gICAgICAgICB9IGVsc2UgaWYgKGxpbmVbMF0gPT09IFwiLVwiKSB7XG4vLyAgICAgICAgICAgICByZXQgKz0gU2V0dGluZ3MubmV3bGluZSgpICsgXCIgICAgICBcIiArXG4vLyAgICAgICAgICAgICAgICAgY29sb3IoXCJkaWZmIHJlbW92ZWRcIiwgbGluZSlcbi8vICAgICAgICAgfSBlbHNlIGlmICghL1xcQFxcQHxcXFxcIE5vIG5ld2xpbmUvLnRlc3QobGluZSkpIHtcbi8vICAgICAgICAgICAgIHJldCArPSBTZXR0aW5ncy5uZXdsaW5lKCkgKyBcIiAgICAgIFwiICsgbGluZVxuLy8gICAgICAgICB9XG4vLyAgICAgfVxuLy9cbi8vICAgICByZXR1cm4gcmV0XG4vLyB9XG4iLCJcInVzZSBzdHJpY3RcIlxuXG4vLyBHZW5lcmFsIENMSSBhbmQgcmVwb3J0ZXIgc2V0dGluZ3MuIElmIHNvbWV0aGluZyBuZWVkcyB0b1xuXG52YXIgQ29uc29sZSA9IHJlcXVpcmUoXCIuL3JlcGxhY2VkL2NvbnNvbGVcIilcblxudmFyIHdpbmRvd1dpZHRoID0gQ29uc29sZS53aW5kb3dXaWR0aFxudmFyIG5ld2xpbmUgPSBDb25zb2xlLm5ld2xpbmVcbnZhciBTeW1ib2xzID0gQ29uc29sZS5TeW1ib2xzXG52YXIgZGVmYXVsdE9wdHMgPSBDb25zb2xlLmRlZmF1bHRPcHRzXG5cbmV4cG9ydHMud2luZG93V2lkdGggPSBmdW5jdGlvbiAoKSB7IHJldHVybiB3aW5kb3dXaWR0aCB9XG5leHBvcnRzLm5ld2xpbmUgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBuZXdsaW5lIH1cbmV4cG9ydHMuc3ltYm9scyA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIFN5bWJvbHMgfVxuZXhwb3J0cy5kZWZhdWx0T3B0cyA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIGRlZmF1bHRPcHRzIH1cblxuZXhwb3J0cy5zZXRXaW5kb3dXaWR0aCA9IGZ1bmN0aW9uICh2YWx1ZSkgeyByZXR1cm4gd2luZG93V2lkdGggPSB2YWx1ZSB9XG5leHBvcnRzLnNldE5ld2xpbmUgPSBmdW5jdGlvbiAodmFsdWUpIHsgcmV0dXJuIG5ld2xpbmUgPSB2YWx1ZSB9XG5leHBvcnRzLnNldFN5bWJvbHMgPSBmdW5jdGlvbiAodmFsdWUpIHsgcmV0dXJuIFN5bWJvbHMgPSB2YWx1ZSB9XG5leHBvcnRzLnNldERlZmF1bHRPcHRzID0gZnVuY3Rpb24gKHZhbHVlKSB7IHJldHVybiBkZWZhdWx0T3B0cyA9IHZhbHVlIH1cblxuLy8gQ29uc29sZS5jb2xvclN1cHBvcnQgaXMgYSBtYXNrIHdpdGggdGhlIGZvbGxvd2luZyBiaXRzOlxuLy8gMHgxIC0gaWYgc2V0LCBjb2xvcnMgc3VwcG9ydGVkIGJ5IGRlZmF1bHRcbi8vIDB4MiAtIGlmIHNldCwgZm9yY2UgY29sb3Igc3VwcG9ydFxuLy9cbi8vIFRoaXMgaXMgcHVyZWx5IGFuIGltcGxlbWVudGF0aW9uIGRldGFpbCwgYW5kIGlzIGludmlzaWJsZSB0byB0aGUgb3V0c2lkZVxuLy8gd29ybGQuXG52YXIgY29sb3JTdXBwb3J0ID0gQ29uc29sZS5jb2xvclN1cHBvcnRcbnZhciBtYXNrID0gY29sb3JTdXBwb3J0XG5cbmV4cG9ydHMuQ29sb3JzID0ge1xuICAgIHN1cHBvcnRlZDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gKG1hc2sgJiAweDEpICE9PSAwXG4gICAgfSxcblxuICAgIGZvcmNlZDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gKG1hc2sgJiAweDIpICE9PSAwXG4gICAgfSxcblxuICAgIG1heWJlU2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgaWYgKChtYXNrICYgMHgyKSA9PT0gMCkgbWFzayA9IHZhbHVlID8gMHgxIDogMFxuICAgIH0sXG5cbiAgICBtYXliZVJlc3RvcmU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKChtYXNrICYgMHgyKSA9PT0gMCkgbWFzayA9IGNvbG9yU3VwcG9ydCAmIDB4MVxuICAgIH0sXG5cbiAgICAvLyBPbmx5IGZvciBkZWJ1Z2dpbmdcbiAgICBmb3JjZVNldDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIG1hc2sgPSB2YWx1ZSA/IDB4MyA6IDB4MlxuICAgIH0sXG5cbiAgICBmb3JjZVJlc3RvcmU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbWFzayA9IGNvbG9yU3VwcG9ydFxuICAgIH0sXG5cbiAgICBnZXRTdXBwb3J0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzdXBwb3J0ZWQ6IChjb2xvclN1cHBvcnQgJiAweDEpICE9PSAwLFxuICAgICAgICAgICAgZm9yY2VkOiAoY29sb3JTdXBwb3J0ICYgMHgyKSAhPT0gMCxcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBzZXRTdXBwb3J0OiBmdW5jdGlvbiAob3B0cykge1xuICAgICAgICBtYXNrID0gY29sb3JTdXBwb3J0ID1cbiAgICAgICAgICAgIChvcHRzLnN1cHBvcnRlZCA/IDB4MSA6IDApIHwgKG9wdHMuZm9yY2VkID8gMHgyIDogMClcbiAgICB9LFxufVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxuZXhwb3J0cy5nZXRUeXBlID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgaWYgKHZhbHVlID09IG51bGwpIHJldHVybiBcIm51bGxcIlxuICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkgcmV0dXJuIFwiYXJyYXlcIlxuICAgIHJldHVybiB0eXBlb2YgdmFsdWVcbn1cblxuLy8gUGhhbnRvbUpTLCBJRSwgYW5kIHBvc3NpYmx5IEVkZ2UgZG9uJ3Qgc2V0IHRoZSBzdGFjayB0cmFjZSB1bnRpbCB0aGUgZXJyb3IgaXNcbi8vIHRocm93bi4gTm90ZSB0aGF0IHRoaXMgcHJlZmVycyBhbiBleGlzdGluZyBzdGFjayBmaXJzdCwgc2luY2Ugbm9uLW5hdGl2ZVxuLy8gZXJyb3JzIGxpa2VseSBhbHJlYWR5IGNvbnRhaW4gdGhpcy4gTm90ZSB0aGF0IHRoaXMgaXNuJ3QgbmVjZXNzYXJ5IGluIHRoZVxuLy8gQ0xJIC0gdGhhdCBvbmx5IHRhcmdldHMgTm9kZS5cbmV4cG9ydHMuZ2V0U3RhY2sgPSBmdW5jdGlvbiAoZSkge1xuICAgIHZhciBzdGFjayA9IGUuc3RhY2tcblxuICAgIGlmICghKGUgaW5zdGFuY2VvZiBFcnJvcikgfHwgc3RhY2sgIT0gbnVsbCkgcmV0dXJuIHN0YWNrXG5cbiAgICB0cnkge1xuICAgICAgICB0aHJvdyBlXG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICByZXR1cm4gZS5zdGFja1xuICAgIH1cbn1cblxuZXhwb3J0cy5wY2FsbCA9IGZ1bmN0aW9uIChmdW5jKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmMoZnVuY3Rpb24gKGUsIHZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4gZSAhPSBudWxsID8gcmVqZWN0KGUpIDogcmVzb2x2ZSh2YWx1ZSlcbiAgICAgICAgfSlcbiAgICB9KVxufVxuXG5leHBvcnRzLnBlYWNoID0gZnVuY3Rpb24gKGxpc3QsIGZ1bmMpIHtcbiAgICB2YXIgbGVuID0gbGlzdC5sZW5ndGhcbiAgICB2YXIgcCA9IFByb21pc2UucmVzb2x2ZSgpXG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIHAgPSBwLnRoZW4oZnVuYy5iaW5kKHVuZGVmaW5lZCwgbGlzdFtpXSwgaSkpXG4gICAgfVxuXG4gICAgcmV0dXJuIHBcbn1cbiIsIlwidXNlIHN0cmljdFwiXG5cbi8qIGdsb2JhbCBTeW1ib2wsIFVpbnQ4QXJyYXksIERhdGFWaWV3LCBBcnJheUJ1ZmZlciwgQXJyYXlCdWZmZXJWaWV3LCBNYXAsXG4gICAgU2V0ICovXG5cbi8qKlxuICogRGVlcCBtYXRjaGluZyBhbGdvcml0aG0gZm9yIGB0Lm1hdGNoYCBhbmQgYHQuZGVlcEVxdWFsYCwgd2l0aCB6ZXJvXG4gKiBkZXBlbmRlbmNpZXMuIE5vdGUgdGhlIGZvbGxvd2luZzpcbiAqXG4gKiAtIFRoaXMgaXMgcmVsYXRpdmVseSBwZXJmb3JtYW5jZS10dW5lZCwgYWx0aG91Z2ggaXQgcHJlZmVycyBoaWdoIGNvcnJlY3RuZXNzLlxuICogICBQYXRjaCB3aXRoIGNhcmUsIHNpbmNlIHBlcmZvcm1hbmNlIGlzIGEgY29uY2Vybi5cbiAqIC0gVGhpcyBkb2VzIHBhY2sgYSAqbG90KiBvZiBmZWF0dXJlcy4gVGhlcmUncyBhIHJlYXNvbiB3aHkgdGhpcyBpcyBzbyBsb25nLlxuICogLSBTb21lIG9mIHRoZSBkdXBsaWNhdGlvbiBpcyBpbnRlbnRpb25hbC4gSXQncyBnZW5lcmFsbHkgY29tbWVudGVkLCBidXQgaXQnc1xuICogICBtYWlubHkgZm9yIHBlcmZvcm1hbmNlLCBzaW5jZSB0aGUgZW5naW5lIG5lZWRzIGl0cyB0eXBlIGluZm8uXG4gKiAtIFBvbHlmaWxsZWQgY29yZS1qcyBTeW1ib2xzIGZyb20gY3Jvc3Mtb3JpZ2luIGNvbnRleHRzIHdpbGwgbmV2ZXIgcmVnaXN0ZXJcbiAqICAgYXMgYmVpbmcgYWN0dWFsIFN5bWJvbHMuXG4gKlxuICogQW5kIGluIGNhc2UgeW91J3JlIHdvbmRlcmluZyBhYm91dCB0aGUgbG9uZ2VyIGZ1bmN0aW9ucyBhbmQgb2NjYXNpb25hbFxuICogcmVwZXRpdGlvbiwgaXQncyBiZWNhdXNlIFY4J3MgaW5saW5lciBpc24ndCBhbHdheXMgaW50ZWxsaWdlbnQgZW5vdWdoIHRvIGRlYWxcbiAqIHdpdGggdGhlIHN1cGVyIGhpZ2hseSBwb2x5bW9ycGhpYyBkYXRhIHRoaXMgb2Z0ZW4gZGVhbHMgd2l0aCwgYW5kIEpTIGRvZXNuJ3RcbiAqIGhhdmUgY29tcGlsZS10aW1lIG1hY3Jvcy4gKEFsc28sIFN3ZWV0LmpzIGlzbid0IHdvcnRoIHRoZSBoYXNzbGUuKVxuICovXG5cbnZhciBvYmplY3RUb1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmdcbnZhciBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5XG5cbnZhciBzdXBwb3J0c1VuaWNvZGUgPSBoYXNPd24uY2FsbChSZWdFeHAucHJvdG90eXBlLCBcInVuaWNvZGVcIilcbnZhciBzdXBwb3J0c1N0aWNreSA9IGhhc093bi5jYWxsKFJlZ0V4cC5wcm90b3R5cGUsIFwic3RpY2t5XCIpXG5cbi8vIExlZ2FjeSBlbmdpbmVzIGhhdmUgc2V2ZXJhbCBpc3N1ZXMgd2hlbiBpdCBjb21lcyB0byBgdHlwZW9mYC5cbnZhciBpc0Z1bmN0aW9uID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBTbG93SXNGdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICBpZiAodmFsdWUgPT0gbnVsbCkgcmV0dXJuIGZhbHNlXG5cbiAgICAgICAgdmFyIHRhZyA9IG9iamVjdFRvU3RyaW5nLmNhbGwodmFsdWUpXG5cbiAgICAgICAgcmV0dXJuIHRhZyA9PT0gXCJbb2JqZWN0IEZ1bmN0aW9uXVwiIHx8XG4gICAgICAgICAgICB0YWcgPT09IFwiW29iamVjdCBHZW5lcmF0b3JGdW5jdGlvbl1cIiB8fFxuICAgICAgICAgICAgdGFnID09PSBcIltvYmplY3QgQXN5bmNGdW5jdGlvbl1cIiB8fFxuICAgICAgICAgICAgdGFnID09PSBcIltvYmplY3QgUHJveHldXCJcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc1BvaXNvbmVkKG9iamVjdCkge1xuICAgICAgICByZXR1cm4gb2JqZWN0ICE9IG51bGwgJiYgdHlwZW9mIG9iamVjdCAhPT0gXCJmdW5jdGlvblwiXG4gICAgfVxuXG4gICAgLy8gSW4gU2FmYXJpIDEwLCBgdHlwZW9mIFByb3h5ID09PSBcIm9iamVjdFwiYFxuICAgIGlmIChpc1BvaXNvbmVkKGdsb2JhbC5Qcm94eSkpIHJldHVybiBTbG93SXNGdW5jdGlvblxuXG4gICAgLy8gSW4gU2FmYXJpIDgsIHNldmVyYWwgdHlwZWQgYXJyYXkgY29uc3RydWN0b3JzIGFyZSBgdHlwZW9mIEMgPT09IFwib2JqZWN0XCJgXG4gICAgaWYgKGlzUG9pc29uZWQoZ2xvYmFsLkludDhBcnJheSkpIHJldHVybiBTbG93SXNGdW5jdGlvblxuXG4gICAgLy8gSW4gb2xkIFY4LCBSZWdFeHBzIGFyZSBjYWxsYWJsZVxuICAgIGlmICh0eXBlb2YgL3gvID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiBTbG93SXNGdW5jdGlvbiAvLyBlc2xpbnQtZGlzYWJsZS1saW5lXG5cbiAgICAvLyBMZWF2ZSB0aGlzIGZvciBub3JtYWwgdGhpbmdzLiBJdCdzIGVhc2lseSBpbmxpbmVkLlxuICAgIHJldHVybiBmdW5jdGlvbiBpc0Z1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT09IFwiZnVuY3Rpb25cIlxuICAgIH1cbn0pKClcblxuLy8gU2V0IHVwIG91ciBvd24gYnVmZmVyIGNoZWNrLiBXZSBzaG91bGQgYWx3YXlzIGFjY2VwdCB0aGUgcG9seWZpbGwsIGV2ZW4gaW5cbi8vIE5vZGUuIE5vdGUgdGhhdCBpdCB1c2VzIGBnbG9iYWwuQnVmZmVyYCB0byBhdm9pZCBpbmNsdWRpbmcgYGJ1ZmZlcmAgaW4gdGhlXG4vLyBidW5kbGUuXG5cbnZhciBCdWZmZXJOYXRpdmUgPSAwXG52YXIgQnVmZmVyUG9seWZpbGwgPSAxXG52YXIgQnVmZmVyU2FmYXJpID0gMlxuXG52YXIgYnVmZmVyU3VwcG9ydCA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gRmFrZUJ1ZmZlcigpIHt9XG4gICAgRmFrZUJ1ZmZlci5pc0J1ZmZlciA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRydWUgfVxuXG4gICAgLy8gT25seSBTYWZhcmkgNS03IGhhcyBldmVyIGhhZCB0aGlzIGlzc3VlLlxuICAgIGlmIChuZXcgRmFrZUJ1ZmZlcigpLmNvbnN0cnVjdG9yICE9PSBGYWtlQnVmZmVyKSByZXR1cm4gQnVmZmVyU2FmYXJpXG4gICAgaWYgKCFpc0Z1bmN0aW9uKGdsb2JhbC5CdWZmZXIpKSByZXR1cm4gQnVmZmVyUG9seWZpbGxcbiAgICBpZiAoIWlzRnVuY3Rpb24oZ2xvYmFsLkJ1ZmZlci5pc0J1ZmZlcikpIHJldHVybiBCdWZmZXJQb2x5ZmlsbFxuICAgIC8vIEF2b2lkIHRoZSBwb2x5ZmlsbFxuICAgIGlmIChnbG9iYWwuQnVmZmVyLmlzQnVmZmVyKG5ldyBGYWtlQnVmZmVyKCkpKSByZXR1cm4gQnVmZmVyUG9seWZpbGxcbiAgICByZXR1cm4gQnVmZmVyTmF0aXZlXG59KSgpXG5cbnZhciBnbG9iYWxJc0J1ZmZlciA9IGJ1ZmZlclN1cHBvcnQgPT09IEJ1ZmZlck5hdGl2ZVxuICAgID8gZ2xvYmFsLkJ1ZmZlci5pc0J1ZmZlclxuICAgIDogdW5kZWZpbmVkXG5cbmZ1bmN0aW9uIGlzQnVmZmVyKG9iamVjdCkge1xuICAgIGlmIChidWZmZXJTdXBwb3J0ID09PSBCdWZmZXJOYXRpdmUgJiYgZ2xvYmFsSXNCdWZmZXIob2JqZWN0KSkgcmV0dXJuIHRydWVcbiAgICBpZiAoYnVmZmVyU3VwcG9ydCA9PT0gQnVmZmVyU2FmYXJpICYmIG9iamVjdC5faXNCdWZmZXIpIHJldHVybiB0cnVlXG5cbiAgICB2YXIgQiA9IG9iamVjdC5jb25zdHJ1Y3RvclxuXG4gICAgaWYgKCFpc0Z1bmN0aW9uKEIpKSByZXR1cm4gZmFsc2VcbiAgICBpZiAoIWlzRnVuY3Rpb24oQi5pc0J1ZmZlcikpIHJldHVybiBmYWxzZVxuICAgIHJldHVybiBCLmlzQnVmZmVyKG9iamVjdClcbn1cblxuLy8gY29yZS1qcycgc3ltYm9scyBhcmUgb2JqZWN0cywgYW5kIHNvbWUgb2xkIHZlcnNpb25zIG9mIFY4IGVycm9uZW91c2x5IGhhZFxuLy8gYHR5cGVvZiBTeW1ib2woKSA9PT0gXCJvYmplY3RcImAuXG52YXIgc3ltYm9sc0FyZU9iamVjdHMgPSBpc0Z1bmN0aW9uKGdsb2JhbC5TeW1ib2wpICYmXG4gICAgdHlwZW9mIFN5bWJvbCgpID09PSBcIm9iamVjdFwiXG5cbi8vIGBjb250ZXh0YCBpcyBhIGJpdCBmaWVsZCwgd2l0aCB0aGUgZm9sbG93aW5nIGJpdHMuIFRoaXMgaXMgbm90IGFzIG11Y2ggZm9yXG4vLyBwZXJmb3JtYW5jZSB0aGFuIHRvIGp1c3QgcmVkdWNlIHRoZSBudW1iZXIgb2YgcGFyYW1ldGVycyBJIG5lZWQgdG8gYmVcbi8vIHRocm93aW5nIGFyb3VuZC5cbnZhciBTdHJpY3QgPSAxXG52YXIgSW5pdGlhbCA9IDJcbnZhciBTYW1lUHJvdG8gPSA0XG5cbmV4cG9ydHMubWF0Y2ggPSBmdW5jdGlvbiAoYSwgYikge1xuICAgIHJldHVybiBtYXRjaChhLCBiLCBJbml0aWFsLCB1bmRlZmluZWQsIHVuZGVmaW5lZClcbn1cblxuZXhwb3J0cy5zdHJpY3QgPSBmdW5jdGlvbiAoYSwgYikge1xuICAgIHJldHVybiBtYXRjaChhLCBiLCBTdHJpY3QgfCBJbml0aWFsLCB1bmRlZmluZWQsIHVuZGVmaW5lZClcbn1cblxuLy8gRmVhdHVyZS10ZXN0IGRlbGF5ZWQgc3RhY2sgYWRkaXRpb25zIGFuZCBleHRyYSBrZXlzLiBQaGFudG9tSlMgYW5kIElFIGJvdGhcbi8vIHdhaXQgdW50aWwgdGhlIGVycm9yIHdhcyBhY3R1YWxseSB0aHJvd24gZmlyc3QsIGFuZCBhc3NpZ24gdGhlbSBhcyBvd25cbi8vIHByb3BlcnRpZXMsIHdoaWNoIGlzIHVuaGVscGZ1bCBmb3IgYXNzZXJ0aW9ucy4gVGhpcyByZXR1cm5zIGEgZnVuY3Rpb24gdG9cbi8vIHNwZWVkIHVwIGNhc2VzIHdoZXJlIGBPYmplY3Qua2V5c2AgaXMgc3VmZmljaWVudCAoZS5nLiBpbiBDaHJvbWUvRkYvTm9kZSkuXG4vL1xuLy8gVGhpcyB3b3VsZG4ndCBiZSBuZWNlc3NhcnkgaWYgdGhvc2UgZW5naW5lcyB3b3VsZCBtYWtlIHRoZSBzdGFjayBhIGdldHRlcixcbi8vIGFuZCByZWNvcmQgaXQgd2hlbiB0aGUgZXJyb3Igd2FzIGNyZWF0ZWQsIG5vdCB3aGVuIGl0IHdhcyB0aHJvd24uIEl0XG4vLyBzcGVjaWZpY2FsbHkgZmlsdGVycyBvdXQgZXJyb3JzIGFuZCBvbmx5IGNoZWNrcyBleGlzdGluZyBkZXNjcmlwdG9ycywganVzdCB0b1xuLy8ga2VlcCB0aGUgbWVzcyBmcm9tIGFmZmVjdGluZyBldmVyeXRoaW5nIChpdCdzIG5vdCBmdWxseSBjb3JyZWN0LCBidXQgaXQnc1xuLy8gbmVjZXNzYXJ5KS5cbnZhciByZXF1aXJlc1Byb3h5ID0gKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgdGVzdCA9IG5ldyBFcnJvcigpXG4gICAgdmFyIG9sZCA9IE9iamVjdC5jcmVhdGUobnVsbClcblxuICAgIE9iamVjdC5rZXlzKHRlc3QpLmZvckVhY2goZnVuY3Rpb24gKGtleSkgeyBvbGRba2V5XSA9IHRydWUgfSlcblxuICAgIHRyeSB7XG4gICAgICAgIHRocm93IHRlc3RcbiAgICB9IGNhdGNoIChfKSB7XG4gICAgICAgIC8vIGlnbm9yZVxuICAgIH1cblxuICAgIHJldHVybiBPYmplY3Qua2V5cyh0ZXN0KS5zb21lKGZ1bmN0aW9uIChrZXkpIHsgcmV0dXJuICFvbGRba2V5XSB9KVxufSkoKVxuXG5mdW5jdGlvbiBpc0lnbm9yZWQob2JqZWN0LCBrZXkpIHtcbiAgICBzd2l0Y2ggKGtleSkge1xuICAgIGNhc2UgXCJsaW5lXCI6IGlmICh0eXBlb2Ygb2JqZWN0W2tleV0gIT09IFwibnVtYmVyXCIpIHJldHVybiBmYWxzZTsgYnJlYWtcbiAgICBjYXNlIFwic291cmNlVVJMXCI6IGlmICh0eXBlb2Ygb2JqZWN0W2tleV0gIT09IFwic3RyaW5nXCIpIHJldHVybiBmYWxzZTsgYnJlYWtcbiAgICBjYXNlIFwic3RhY2tcIjogaWYgKHR5cGVvZiBvYmplY3Rba2V5XSAhPT0gXCJzdHJpbmdcIikgcmV0dXJuIGZhbHNlOyBicmVha1xuICAgIGRlZmF1bHQ6IHJldHVybiBmYWxzZVxuICAgIH1cblxuICAgIHZhciBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihvYmplY3QsIGtleSlcblxuICAgIHJldHVybiAhZGVzYy5jb25maWd1cmFibGUgJiYgZGVzYy5lbnVtZXJhYmxlICYmICFkZXNjLndyaXRhYmxlXG59XG5cbi8vIFRoaXMgaXMgb25seSBpbnZva2VkIHdpdGggZXJyb3JzLCBzbyBpdCdzIG5vdCBnb2luZyB0byBwcmVzZW50IGEgc2lnbmlmaWNhbnRcbi8vIHNsb3cgZG93bi5cbmZ1bmN0aW9uIGdldEtleXNTdHJpcHBlZChvYmplY3QpIHtcbiAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKG9iamVjdClcbiAgICB2YXIgY291bnQgPSAwXG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKCFpc0lnbm9yZWQob2JqZWN0LCBrZXlzW2ldKSkga2V5c1tjb3VudCsrXSA9IGtleXNbaV1cbiAgICB9XG5cbiAgICBrZXlzLmxlbmd0aCA9IGNvdW50XG4gICAgcmV0dXJuIGtleXNcbn1cblxuLy8gV2F5IGZhc3Rlciwgc2luY2UgdHlwZWQgYXJyYXkgaW5kaWNlcyBhcmUgYWx3YXlzIGRlbnNlIGFuZCBjb250YWluIG51bWJlcnMuXG5cbi8vIFNldHVwIGZvciBgaXNCdWZmZXJPclZpZXdgIGFuZCBgaXNWaWV3YFxudmFyIEFycmF5QnVmZmVyTm9uZSA9IDBcbnZhciBBcnJheUJ1ZmZlckxlZ2FjeSA9IDFcbnZhciBBcnJheUJ1ZmZlckN1cnJlbnQgPSAyXG5cbnZhciBhcnJheUJ1ZmZlclN1cHBvcnQgPSAoZnVuY3Rpb24gKCkge1xuICAgIGlmICghaXNGdW5jdGlvbihnbG9iYWwuVWludDhBcnJheSkpIHJldHVybiBBcnJheUJ1ZmZlck5vbmVcbiAgICBpZiAoIWlzRnVuY3Rpb24oZ2xvYmFsLkRhdGFWaWV3KSkgcmV0dXJuIEFycmF5QnVmZmVyTm9uZVxuICAgIGlmICghaXNGdW5jdGlvbihnbG9iYWwuQXJyYXlCdWZmZXIpKSByZXR1cm4gQXJyYXlCdWZmZXJOb25lXG4gICAgaWYgKGlzRnVuY3Rpb24oZ2xvYmFsLkFycmF5QnVmZmVyLmlzVmlldykpIHJldHVybiBBcnJheUJ1ZmZlckN1cnJlbnRcbiAgICBpZiAoaXNGdW5jdGlvbihnbG9iYWwuQXJyYXlCdWZmZXJWaWV3KSkgcmV0dXJuIEFycmF5QnVmZmVyTGVnYWN5XG4gICAgcmV0dXJuIEFycmF5QnVmZmVyTm9uZVxufSkoKVxuXG4vLyBJZiB0eXBlZCBhcnJheXMgYXJlbid0IHN1cHBvcnRlZCAodGhleSB3ZXJlbid0IHRlY2huaWNhbGx5IHBhcnQgb2Zcbi8vIEVTNSwgYnV0IG1hbnkgZW5naW5lcyBpbXBsZW1lbnRlZCBLaHJvbm9zJyBzcGVjIGJlZm9yZSBFUzYpLCB0aGVuXG4vLyBqdXN0IGZhbGwgYmFjayB0byBnZW5lcmljIGJ1ZmZlciBkZXRlY3Rpb24uXG5mdW5jdGlvbiBmbG9hdElzKGEsIGIpIHtcbiAgICAvLyBTbyBOYU5zIGFyZSBjb25zaWRlcmVkIGVxdWFsLlxuICAgIHJldHVybiBhID09PSBiIHx8IGEgIT09IGEgJiYgYiAhPT0gYiAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXNlbGYtY29tcGFyZVxufVxuXG5mdW5jdGlvbiBtYXRjaFZpZXcoYSwgYikge1xuICAgIHZhciBjb3VudCA9IGEubGVuZ3RoXG5cbiAgICBpZiAoY291bnQgIT09IGIubGVuZ3RoKSByZXR1cm4gZmFsc2VcblxuICAgIHdoaWxlIChjb3VudCkge1xuICAgICAgICBjb3VudC0tXG4gICAgICAgIGlmICghZmxvYXRJcyhhW2NvdW50XSwgYltjb3VudF0pKSByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZVxufVxuXG52YXIgaXNWaWV3ID0gKGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoYXJyYXlCdWZmZXJTdXBwb3J0ID09PSBBcnJheUJ1ZmZlck5vbmUpIHJldHVybiB1bmRlZmluZWRcbiAgICAvLyBFUzYgdHlwZWQgYXJyYXlzXG4gICAgaWYgKGFycmF5QnVmZmVyU3VwcG9ydCA9PT0gQXJyYXlCdWZmZXJDdXJyZW50KSByZXR1cm4gQXJyYXlCdWZmZXIuaXNWaWV3XG4gICAgLy8gbGVnYWN5IHR5cGVkIGFycmF5c1xuICAgIHJldHVybiBmdW5jdGlvbiBpc1ZpZXcob2JqZWN0KSB7XG4gICAgICAgIHJldHVybiBvYmplY3QgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlclZpZXdcbiAgICB9XG59KSgpXG5cbi8vIFN1cHBvcnQgY2hlY2tpbmcgbWFwcyBhbmQgc2V0cyBkZWVwbHkuIFRoZXkgYXJlIG9iamVjdC1saWtlIGVub3VnaCB0byBjb3VudCxcbi8vIGFuZCBhcmUgdXNlZnVsIGluIHRoZWlyIG93biByaWdodC4gVGhlIGNvZGUgaXMgcmF0aGVyIG1lc3N5LCBidXQgbWFpbmx5IHRvXG4vLyBrZWVwIHRoZSBvcmRlci1pbmRlcGVuZGVudCBjaGVja2luZyBmcm9tIGJlY29taW5nIGluc2FuZWx5IHNsb3cuXG52YXIgc3VwcG9ydHNNYXAgPSBpc0Z1bmN0aW9uKGdsb2JhbC5NYXApXG52YXIgc3VwcG9ydHNTZXQgPSBpc0Z1bmN0aW9uKGdsb2JhbC5TZXQpXG5cbi8vIE9uZSBvZiB0aGUgc2V0cyBhbmQgYm90aCBtYXBzJyBrZXlzIGFyZSBjb252ZXJ0ZWQgdG8gYXJyYXlzIGZvciBmYXN0ZXJcbi8vIGhhbmRsaW5nLlxuZnVuY3Rpb24ga2V5TGlzdChtYXApIHtcbiAgICB2YXIgbGlzdCA9IG5ldyBBcnJheShtYXAuc2l6ZSlcbiAgICB2YXIgaSA9IDBcbiAgICB2YXIgaXRlciA9IG1hcC5rZXlzKClcblxuICAgIGZvciAodmFyIG5leHQgPSBpdGVyLm5leHQoKTsgIW5leHQuZG9uZTsgbmV4dCA9IGl0ZXIubmV4dCgpKSB7XG4gICAgICAgIGxpc3RbaSsrXSA9IG5leHQudmFsdWVcbiAgICB9XG5cbiAgICByZXR1cm4gbGlzdFxufVxuXG4vLyBUaGUgcGFpciBvZiBhcnJheXMgYXJlIGFsaWduZWQgaW4gYSBzaW5nbGUgTyhuXjIpIG9wZXJhdGlvbiAobW9kIGRlZXBcbi8vIG1hdGNoaW5nIGFuZCByb3RhdGlvbiksIGFkYXB0aW5nIHRvIE8obikgd2hlbiB0aGV5J3JlIGFscmVhZHkgYWxpZ25lZC5cbmZ1bmN0aW9uIG1hdGNoS2V5KGN1cnJlbnQsIGFrZXlzLCBzdGFydCwgZW5kLCBjb250ZXh0LCBsZWZ0LCByaWdodCkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1wYXJhbXMsIG1heC1sZW5cbiAgICBmb3IgKHZhciBpID0gc3RhcnQgKyAxOyBpIDwgZW5kOyBpKyspIHtcbiAgICAgICAgdmFyIGtleSA9IGFrZXlzW2ldXG5cbiAgICAgICAgaWYgKG1hdGNoKGN1cnJlbnQsIGtleSwgY29udGV4dCwgbGVmdCwgcmlnaHQpKSB7XG4gICAgICAgICAgICAvLyBUT0RPOiBvbmNlIGVuZ2luZXMgYWN0dWFsbHkgb3B0aW1pemUgYGNvcHlXaXRoaW5gLCB1c2UgdGhhdFxuICAgICAgICAgICAgLy8gaW5zdGVhZC4gSXQnbGwgYmUgbXVjaCBmYXN0ZXIgdGhhbiB0aGlzIGxvb3AuXG4gICAgICAgICAgICB3aGlsZSAoaSA+IHN0YXJ0KSBha2V5c1tpXSA9IGFrZXlzWy0taV1cbiAgICAgICAgICAgIGFrZXlzW2ldID0ga2V5XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlXG59XG5cbmZ1bmN0aW9uIG1hdGNoVmFsdWVzKGEsIGIsIGFrZXlzLCBia2V5cywgZW5kLCBjb250ZXh0LCBsZWZ0LCByaWdodCkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1wYXJhbXMsIG1heC1sZW5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICAgIGlmICghbWF0Y2goYS5nZXQoYWtleXNbaV0pLCBiLmdldChia2V5c1tpXSksIGNvbnRleHQsIGxlZnQsIHJpZ2h0KSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZVxufVxuXG4vLyBQb3NzaWJseSBleHBlbnNpdmUgb3JkZXItaW5kZXBlbmRlbnQga2V5LXZhbHVlIG1hdGNoLiBGaXJzdCwgdHJ5IHRvIGF2b2lkIGl0XG4vLyBieSBjb25zZXJ2YXRpdmVseSBhc3N1bWluZyBldmVyeXRoaW5nIGlzIGluIG9yZGVyIC0gYSBjaGVhcCBPKG4pIGlzIGFsd2F5c1xuLy8gbmljZXIgdGhhbiBhbiBleHBlbnNpdmUgTyhuXjIpLlxuZnVuY3Rpb24gbWF0Y2hNYXAoYSwgYiwgY29udGV4dCwgbGVmdCwgcmlnaHQpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtcGFyYW1zLCBtYXgtbGVuXG4gICAgdmFyIGVuZCA9IGEuc2l6ZVxuICAgIHZhciBha2V5cyA9IGtleUxpc3QoYSlcbiAgICB2YXIgYmtleXMgPSBrZXlMaXN0KGIpXG4gICAgdmFyIGkgPSAwXG5cbiAgICB3aGlsZSAoaSAhPT0gZW5kICYmIG1hdGNoKGFrZXlzW2ldLCBia2V5c1tpXSwgY29udGV4dCwgbGVmdCwgcmlnaHQpKSB7XG4gICAgICAgIGkrK1xuICAgIH1cblxuICAgIGlmIChpID09PSBlbmQpIHtcbiAgICAgICAgcmV0dXJuIG1hdGNoVmFsdWVzKGEsIGIsIGFrZXlzLCBia2V5cywgZW5kLCBjb250ZXh0LCBsZWZ0LCByaWdodClcbiAgICB9XG5cbiAgICAvLyBEb24ndCBjb21wYXJlIHRoZSBzYW1lIGtleSB0d2ljZVxuICAgIGlmICghbWF0Y2hLZXkoYmtleXNbaV0sIGFrZXlzLCBpLCBlbmQsIGNvbnRleHQsIGxlZnQsIHJpZ2h0KSkge1xuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgICAvLyBJZiB0aGUgYWJvdmUgZmFpbHMsIHdoaWxlIHdlJ3JlIGF0IGl0LCBsZXQncyBzb3J0IHRoZW0gYXMgd2UgZ28sIHNvXG4gICAgLy8gdGhlIGtleSBvcmRlciBtYXRjaGVzLlxuICAgIHdoaWxlICgrK2kgPCBlbmQpIHtcbiAgICAgICAgdmFyIGtleSA9IGJrZXlzW2ldXG5cbiAgICAgICAgLy8gQWRhcHQgaWYgdGhlIGtleXMgYXJlIGFscmVhZHkgaW4gb3JkZXIsIHdoaWNoIGlzIGZyZXF1ZW50bHkgdGhlXG4gICAgICAgIC8vIGNhc2UuXG4gICAgICAgIGlmICghbWF0Y2goa2V5LCBha2V5c1tpXSwgY29udGV4dCwgbGVmdCwgcmlnaHQpICYmXG4gICAgICAgICAgICAgICAgIW1hdGNoS2V5KGtleSwgYWtleXMsIGksIGVuZCwgY29udGV4dCwgbGVmdCwgcmlnaHQpKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBtYXRjaFZhbHVlcyhhLCBiLCBha2V5cywgYmtleXMsIGVuZCwgY29udGV4dCwgbGVmdCwgcmlnaHQpXG59XG5cbmZ1bmN0aW9uIGhhc0FsbElkZW50aWNhbChhbGlzdCwgYikge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYWxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKCFiLmhhcyhhbGlzdFtpXSkpIHJldHVybiBmYWxzZVxuICAgIH1cblxuICAgIHJldHVybiB0cnVlXG59XG5cbi8vIENvbXBhcmUgdGhlIHZhbHVlcyBzdHJ1Y3R1cmFsbHksIGFuZCBpbmRlcGVuZGVudCBvZiBvcmRlci5cbmZ1bmN0aW9uIHNlYXJjaEZvcihhdmFsdWUsIG9iamVjdHMsIGNvbnRleHQsIGxlZnQsIHJpZ2h0KSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LXBhcmFtcywgbWF4LWxlblxuICAgIGZvciAodmFyIGogaW4gb2JqZWN0cykge1xuICAgICAgICBpZiAoaGFzT3duLmNhbGwob2JqZWN0cywgaikpIHtcbiAgICAgICAgICAgIGlmIChtYXRjaChhdmFsdWUsIG9iamVjdHNbal0sIGNvbnRleHQsIGxlZnQsIHJpZ2h0KSkge1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBvYmplY3RzW2pdXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBmYWxzZVxufVxuXG5mdW5jdGlvbiBoYXNTdHJ1Y3R1cmUodmFsdWUsIGNvbnRleHQpIHtcbiAgICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiICYmIHZhbHVlICE9PSBudWxsIHx8XG4gICAgICAgICAgICAhKGNvbnRleHQgJiBTdHJpY3QpICYmIHR5cGVvZiB2YWx1ZSA9PT0gXCJzeW1ib2xcIlxufVxuXG4vLyBUaGUgc2V0IGFsZ29yaXRobSBpcyBzdHJ1Y3R1cmVkIGEgbGl0dGxlIGRpZmZlcmVudGx5LiBJdCB0YWtlcyBvbmUgb2YgdGhlXG4vLyBzZXRzIGludG8gYW4gYXJyYXksIGRvZXMgYSBjaGVhcCBpZGVudGl0eSBjaGVjaywgdGhlbiBkb2VzIHRoZSBkZWVwIGNoZWNrLlxuZnVuY3Rpb24gbWF0Y2hTZXQoYSwgYiwgY29udGV4dCwgbGVmdCwgcmlnaHQpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtcGFyYW1zLCBtYXgtbGVuXG4gICAgLy8gVGhpcyBpcyB0byB0cnkgdG8gYXZvaWQgYW4gZXhwZW5zaXZlIHN0cnVjdHVyYWwgbWF0Y2ggb24gdGhlIGtleXMuIFRlc3RcbiAgICAvLyBmb3IgaWRlbnRpdHkgZmlyc3QuXG4gICAgdmFyIGFsaXN0ID0ga2V5TGlzdChhKVxuXG4gICAgaWYgKGhhc0FsbElkZW50aWNhbChhbGlzdCwgYikpIHJldHVybiB0cnVlXG5cbiAgICB2YXIgaXRlciA9IGIudmFsdWVzKClcbiAgICB2YXIgY291bnQgPSAwXG4gICAgdmFyIG9iamVjdHNcblxuICAgIC8vIEdhdGhlciBhbGwgdGhlIG9iamVjdHNcbiAgICBmb3IgKHZhciBuZXh0ID0gaXRlci5uZXh0KCk7ICFuZXh0LmRvbmU7IG5leHQgPSBpdGVyLm5leHQoKSkge1xuICAgICAgICB2YXIgYnZhbHVlID0gbmV4dC52YWx1ZVxuXG4gICAgICAgIGlmIChoYXNTdHJ1Y3R1cmUoYnZhbHVlLCBjb250ZXh0KSkge1xuICAgICAgICAgICAgLy8gQ3JlYXRlIHRoZSBvYmplY3RzIG1hcCBsYXppbHkuIE5vdGUgdGhhdCB0aGlzIGFsc28gZ3JhYnMgU3ltYm9sc1xuICAgICAgICAgICAgLy8gd2hlbiBub3Qgc3RyaWN0bHkgbWF0Y2hpbmcsIHNpbmNlIHRoZWlyIGRlc2NyaXB0aW9uIGlzIGNvbXBhcmVkLlxuICAgICAgICAgICAgaWYgKGNvdW50ID09PSAwKSBvYmplY3RzID0gT2JqZWN0LmNyZWF0ZShudWxsKVxuICAgICAgICAgICAgb2JqZWN0c1tjb3VudCsrXSA9IGJ2YWx1ZVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gSWYgZXZlcnl0aGluZyBpcyBhIHByaW1pdGl2ZSwgdGhlbiBhYm9ydC5cbiAgICBpZiAoY291bnQgPT09IDApIHJldHVybiBmYWxzZVxuXG4gICAgLy8gSXRlcmF0ZSB0aGUgb2JqZWN0LCByZW1vdmluZyBlYWNoIG9uZSByZW1haW5pbmcgd2hlbiBtYXRjaGVkIChhbmRcbiAgICAvLyBhYm9ydGluZyBpZiBub25lIGNhbiBiZSkuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XG4gICAgICAgIHZhciBhdmFsdWUgPSBhbGlzdFtpXVxuXG4gICAgICAgIGlmIChoYXNTdHJ1Y3R1cmUoYXZhbHVlLCBjb250ZXh0KSkge1xuICAgICAgICAgICAgaWYgKCFzZWFyY2hGb3IoYXZhbHVlLCBvYmplY3RzLCBjb250ZXh0LCBsZWZ0LCByaWdodCkpIHJldHVybiBmYWxzZVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWVcbn1cblxuZnVuY3Rpb24gbWF0Y2hSZWdFeHAoYSwgYikge1xuICAgIHJldHVybiBhLnNvdXJjZSA9PT0gYi5zb3VyY2UgJiZcbiAgICAgICAgYS5nbG9iYWwgPT09IGIuZ2xvYmFsICYmXG4gICAgICAgIGEuaWdub3JlQ2FzZSA9PT0gYi5pZ25vcmVDYXNlICYmXG4gICAgICAgIGEubXVsdGlsaW5lID09PSBiLm11bHRpbGluZSAmJlxuICAgICAgICAoIXN1cHBvcnRzVW5pY29kZSB8fCBhLnVuaWNvZGUgPT09IGIudW5pY29kZSkgJiZcbiAgICAgICAgKCFzdXBwb3J0c1N0aWNreSB8fCBhLnN0aWNreSA9PT0gYi5zdGlja3kpXG59XG5cbmZ1bmN0aW9uIG1hdGNoUHJlcGFyZURlc2NlbmQoYSwgYiwgY29udGV4dCwgbGVmdCwgcmlnaHQpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtcGFyYW1zLCBtYXgtbGVuXG4gICAgLy8gQ2hlY2sgZm9yIGNpcmN1bGFyIHJlZmVyZW5jZXMgYWZ0ZXIgdGhlIGZpcnN0IGxldmVsLCB3aGVyZSBpdCdzXG4gICAgLy8gcmVkdW5kYW50LiBOb3RlIHRoYXQgdGhleSBoYXZlIHRvIHBvaW50IHRvIHRoZSBzYW1lIGxldmVsIHRvIGFjdHVhbGx5XG4gICAgLy8gYmUgY29uc2lkZXJlZCBkZWVwbHkgZXF1YWwuXG4gICAgaWYgKCEoY29udGV4dCAmIEluaXRpYWwpKSB7XG4gICAgICAgIHZhciBsZWZ0SW5kZXggPSBsZWZ0LmluZGV4T2YoYSlcbiAgICAgICAgdmFyIHJpZ2h0SW5kZXggPSByaWdodC5pbmRleE9mKGIpXG5cbiAgICAgICAgaWYgKGxlZnRJbmRleCAhPT0gcmlnaHRJbmRleCkgcmV0dXJuIGZhbHNlXG4gICAgICAgIGlmIChsZWZ0SW5kZXggPj0gMCkgcmV0dXJuIHRydWVcblxuICAgICAgICBsZWZ0LnB1c2goYSlcbiAgICAgICAgcmlnaHQucHVzaChiKVxuXG4gICAgICAgIHZhciByZXN1bHQgPSBtYXRjaElubmVyKGEsIGIsIGNvbnRleHQsIGxlZnQsIHJpZ2h0KVxuXG4gICAgICAgIGxlZnQucG9wKClcbiAgICAgICAgcmlnaHQucG9wKClcblxuICAgICAgICByZXR1cm4gcmVzdWx0XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG1hdGNoSW5uZXIoYSwgYiwgY29udGV4dCAmIH5Jbml0aWFsLCBbYV0sIFtiXSlcbiAgICB9XG59XG5cbmZ1bmN0aW9uIG1hdGNoU2FtZVByb3RvKGEsIGIsIGNvbnRleHQsIGxlZnQsIHJpZ2h0KSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LXBhcmFtcywgbWF4LWxlblxuICAgIGlmIChzeW1ib2xzQXJlT2JqZWN0cyAmJiBhIGluc3RhbmNlb2YgU3ltYm9sKSB7XG4gICAgICAgIHJldHVybiAhKGNvbnRleHQgJiBTdHJpY3QpICYmIGEudG9TdHJpbmcoKSA9PT0gYi50b1N0cmluZygpXG4gICAgfVxuXG4gICAgaWYgKGEgaW5zdGFuY2VvZiBSZWdFeHApIHJldHVybiBtYXRjaFJlZ0V4cChhLCBiKVxuICAgIGlmIChhIGluc3RhbmNlb2YgRGF0ZSkgcmV0dXJuIGEudmFsdWVPZigpID09PSBiLnZhbHVlT2YoKVxuICAgIGlmIChhcnJheUJ1ZmZlclN1cHBvcnQgIT09IEFycmF5QnVmZmVyTm9uZSkge1xuICAgICAgICBpZiAoYSBpbnN0YW5jZW9mIERhdGFWaWV3KSB7XG4gICAgICAgICAgICByZXR1cm4gbWF0Y2hWaWV3KFxuICAgICAgICAgICAgICAgIG5ldyBVaW50OEFycmF5KGEuYnVmZmVyLCBhLmJ5dGVPZmZzZXQsIGEuYnl0ZUxlbmd0aCksXG4gICAgICAgICAgICAgICAgbmV3IFVpbnQ4QXJyYXkoYi5idWZmZXIsIGIuYnl0ZU9mZnNldCwgYi5ieXRlTGVuZ3RoKSlcbiAgICAgICAgfVxuICAgICAgICBpZiAoYSBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSB7XG4gICAgICAgICAgICByZXR1cm4gbWF0Y2hWaWV3KG5ldyBVaW50OEFycmF5KGEpLCBuZXcgVWludDhBcnJheShiKSlcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNWaWV3KGEpKSByZXR1cm4gbWF0Y2hWaWV3KGEsIGIpXG4gICAgfVxuXG4gICAgaWYgKGlzQnVmZmVyKGEpKSByZXR1cm4gbWF0Y2hWaWV3KGEsIGIpXG5cbiAgICBpZiAoQXJyYXkuaXNBcnJheShhKSkge1xuICAgICAgICBpZiAoYS5sZW5ndGggIT09IGIubGVuZ3RoKSByZXR1cm4gZmFsc2VcbiAgICAgICAgaWYgKGEubGVuZ3RoID09PSAwKSByZXR1cm4gdHJ1ZVxuICAgIH0gZWxzZSBpZiAoc3VwcG9ydHNNYXAgJiYgYSBpbnN0YW5jZW9mIE1hcCkge1xuICAgICAgICBpZiAoYS5zaXplICE9PSBiLnNpemUpIHJldHVybiBmYWxzZVxuICAgICAgICBpZiAoYS5zaXplID09PSAwKSByZXR1cm4gdHJ1ZVxuICAgIH0gZWxzZSBpZiAoc3VwcG9ydHNTZXQgJiYgYSBpbnN0YW5jZW9mIFNldCkge1xuICAgICAgICBpZiAoYS5zaXplICE9PSBiLnNpemUpIHJldHVybiBmYWxzZVxuICAgICAgICBpZiAoYS5zaXplID09PSAwKSByZXR1cm4gdHJ1ZVxuICAgIH0gZWxzZSBpZiAob2JqZWN0VG9TdHJpbmcuY2FsbChhKSA9PT0gXCJbb2JqZWN0IEFyZ3VtZW50c11cIikge1xuICAgICAgICBpZiAob2JqZWN0VG9TdHJpbmcuY2FsbChiKSAhPT0gXCJbb2JqZWN0IEFyZ3VtZW50c11cIikgcmV0dXJuIGZhbHNlXG4gICAgICAgIGlmIChhLmxlbmd0aCAhPT0gYi5sZW5ndGgpIHJldHVybiBmYWxzZVxuICAgICAgICBpZiAoYS5sZW5ndGggPT09IDApIHJldHVybiB0cnVlXG4gICAgfSBlbHNlIGlmIChvYmplY3RUb1N0cmluZy5jYWxsKGIpID09PSBcIltvYmplY3QgQXJndW1lbnRzXVwiKSB7XG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cblxuICAgIHJldHVybiBtYXRjaFByZXBhcmVEZXNjZW5kKGEsIGIsIGNvbnRleHQsIGxlZnQsIHJpZ2h0KVxufVxuXG4vLyBNb3N0IHNwZWNpYWwgY2FzZXMgcmVxdWlyZSBib3RoIHR5cGVzIHRvIG1hdGNoLCBhbmQgaWYgb25seSBvbmUgb2YgdGhlbSBhcmUsXG4vLyB0aGUgb2JqZWN0cyB0aGVtc2VsdmVzIGRvbid0IG1hdGNoLlxuZnVuY3Rpb24gbWF0Y2hEaWZmZXJlbnRQcm90byhhLCBiLCBjb250ZXh0LCBsZWZ0LCByaWdodCkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1wYXJhbXMsIG1heC1sZW5cbiAgICBpZiAoc3ltYm9sc0FyZU9iamVjdHMpIHtcbiAgICAgICAgaWYgKGEgaW5zdGFuY2VvZiBTeW1ib2wgfHwgYiBpbnN0YW5jZW9mIFN5bWJvbCkgcmV0dXJuIGZhbHNlXG4gICAgfVxuICAgIGlmIChjb250ZXh0ICYgU3RyaWN0KSByZXR1cm4gZmFsc2VcbiAgICBpZiAoYXJyYXlCdWZmZXJTdXBwb3J0ICE9PSBBcnJheUJ1ZmZlck5vbmUpIHtcbiAgICAgICAgaWYgKGEgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlciB8fCBiIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHJldHVybiBmYWxzZVxuICAgICAgICBpZiAoaXNWaWV3KGEpIHx8IGlzVmlldyhiKSkgcmV0dXJuIGZhbHNlXG4gICAgfVxuICAgIGlmIChBcnJheS5pc0FycmF5KGEpIHx8IEFycmF5LmlzQXJyYXkoYikpIHJldHVybiBmYWxzZVxuICAgIGlmIChzdXBwb3J0c01hcCAmJiAoYSBpbnN0YW5jZW9mIE1hcCB8fCBiIGluc3RhbmNlb2YgTWFwKSkgcmV0dXJuIGZhbHNlXG4gICAgaWYgKHN1cHBvcnRzU2V0ICYmIChhIGluc3RhbmNlb2YgU2V0IHx8IGIgaW5zdGFuY2VvZiBTZXQpKSByZXR1cm4gZmFsc2VcbiAgICBpZiAob2JqZWN0VG9TdHJpbmcuY2FsbChhKSA9PT0gXCJbb2JqZWN0IEFyZ3VtZW50c11cIikge1xuICAgICAgICBpZiAob2JqZWN0VG9TdHJpbmcuY2FsbChiKSAhPT0gXCJbb2JqZWN0IEFyZ3VtZW50c11cIikgcmV0dXJuIGZhbHNlXG4gICAgICAgIGlmIChhLmxlbmd0aCAhPT0gYi5sZW5ndGgpIHJldHVybiBmYWxzZVxuICAgICAgICBpZiAoYS5sZW5ndGggPT09IDApIHJldHVybiB0cnVlXG4gICAgfVxuICAgIGlmIChvYmplY3RUb1N0cmluZy5jYWxsKGIpID09PSBcIltvYmplY3QgQXJndW1lbnRzXVwiKSByZXR1cm4gZmFsc2VcbiAgICByZXR1cm4gbWF0Y2hQcmVwYXJlRGVzY2VuZChhLCBiLCBjb250ZXh0LCBsZWZ0LCByaWdodClcbn1cblxuZnVuY3Rpb24gbWF0Y2goYSwgYiwgY29udGV4dCwgbGVmdCwgcmlnaHQpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtcGFyYW1zXG4gICAgaWYgKGEgPT09IGIpIHJldHVybiB0cnVlXG4gICAgLy8gTmFOcyBhcmUgZXF1YWxcbiAgICBpZiAoYSAhPT0gYSkgcmV0dXJuIGIgIT09IGIgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1zZWxmLWNvbXBhcmVcbiAgICBpZiAoYSA9PT0gbnVsbCB8fCBiID09PSBudWxsKSByZXR1cm4gZmFsc2VcbiAgICBpZiAodHlwZW9mIGEgPT09IFwic3ltYm9sXCIgJiYgdHlwZW9mIGIgPT09IFwic3ltYm9sXCIpIHtcbiAgICAgICAgcmV0dXJuICEoY29udGV4dCAmIFN0cmljdCkgJiYgYS50b1N0cmluZygpID09PSBiLnRvU3RyaW5nKClcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBhICE9PSBcIm9iamVjdFwiIHx8IHR5cGVvZiBiICE9PSBcIm9iamVjdFwiKSByZXR1cm4gZmFsc2VcblxuICAgIC8vIFVzdWFsbHksIGJvdGggb2JqZWN0cyBoYXZlIGlkZW50aWNhbCBwcm90b3R5cGVzLCBhbmQgdGhhdCBhbGxvd3MgZm9yIGhhbGZcbiAgICAvLyB0aGUgdHlwZSBjaGVja2luZy5cbiAgICBpZiAoT2JqZWN0LmdldFByb3RvdHlwZU9mKGEpID09PSBPYmplY3QuZ2V0UHJvdG90eXBlT2YoYikpIHtcbiAgICAgICAgcmV0dXJuIG1hdGNoU2FtZVByb3RvKGEsIGIsIGNvbnRleHQgfCBTYW1lUHJvdG8sIGxlZnQsIHJpZ2h0KVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBtYXRjaERpZmZlcmVudFByb3RvKGEsIGIsIGNvbnRleHQsIGxlZnQsIHJpZ2h0KVxuICAgIH1cbn1cblxuZnVuY3Rpb24gbWF0Y2hBcnJheUxpa2UoYSwgYiwgY29udGV4dCwgbGVmdCwgcmlnaHQpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtcGFyYW1zLCBtYXgtbGVuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICghbWF0Y2goYVtpXSwgYltpXSwgY29udGV4dCwgbGVmdCwgcmlnaHQpKSByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZVxufVxuXG4vLyBQaGFudG9tSlMgYW5kIFNsaW1lckpTIGJvdGggaGF2ZSBteXN0ZXJpb3VzIGlzc3VlcyB3aGVyZSBgRXJyb3JgIGlzIHNvbWV0aW1lc1xuLy8gZXJyb25lb3VzbHkgb2YgYSBkaWZmZXJlbnQgYHdpbmRvd2AsIGFuZCBpdCBzaG93cyB1cCBpbiB0aGUgdGVzdHMuIFRoaXMgbWVhbnNcbi8vIEkgaGF2ZSB0byB1c2UgYSBtdWNoIHNsb3dlciBhbGdvcml0aG0gdG8gZGV0ZWN0IEVycm9ycy5cbi8vXG4vLyBQaGFudG9tSlM6IGh0dHBzOi8vZ2l0aHViLmNvbS9wZXRrYWFudG9ub3YvYmx1ZWJpcmQvaXNzdWVzLzExNDZcbi8vIFNsaW1lckpTOiBodHRwczovL2dpdGh1Yi5jb20vbGF1cmVudGovc2xpbWVyanMvaXNzdWVzLzQwMFxuLy9cbi8vIChZZXMsIHRoZSBQaGFudG9tSlMgYnVnIGlzIGRldGFpbGVkIGluIHRoZSBCbHVlYmlyZCBpc3N1ZSB0cmFja2VyLilcbnZhciBjaGVja0Nyb3NzT3JpZ2luID0gKGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoZ2xvYmFsLndpbmRvdyA9PSBudWxsIHx8IGdsb2JhbC53aW5kb3cubmF2aWdhdG9yID09IG51bGwpIHJldHVybiBmYWxzZVxuICAgIHJldHVybiAvc2xpbWVyanN8cGhhbnRvbWpzL2kudGVzdChnbG9iYWwud2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQpXG59KSgpXG5cbnZhciBlcnJvclN0cmluZ1R5cGVzID0ge1xuICAgIFwiW29iamVjdCBFcnJvcl1cIjogdHJ1ZSxcbiAgICBcIltvYmplY3QgRXZhbEVycm9yXVwiOiB0cnVlLFxuICAgIFwiW29iamVjdCBSYW5nZUVycm9yXVwiOiB0cnVlLFxuICAgIFwiW29iamVjdCBSZWZlcmVuY2VFcnJvcl1cIjogdHJ1ZSxcbiAgICBcIltvYmplY3QgU3ludGF4RXJyb3JdXCI6IHRydWUsXG4gICAgXCJbb2JqZWN0IFR5cGVFcnJvcl1cIjogdHJ1ZSxcbiAgICBcIltvYmplY3QgVVJJRXJyb3JdXCI6IHRydWUsXG59XG5cbmZ1bmN0aW9uIGlzUHJveGllZEVycm9yKG9iamVjdCkge1xuICAgIHdoaWxlIChvYmplY3QgIT0gbnVsbCkge1xuICAgICAgICBpZiAoZXJyb3JTdHJpbmdUeXBlc1tvYmplY3RUb1N0cmluZy5jYWxsKG9iamVjdCldKSByZXR1cm4gdHJ1ZVxuICAgICAgICBvYmplY3QgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2Yob2JqZWN0KVxuICAgIH1cblxuICAgIHJldHVybiBmYWxzZVxufVxuXG5mdW5jdGlvbiBtYXRjaElubmVyKGEsIGIsIGNvbnRleHQsIGxlZnQsIHJpZ2h0KSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LXN0YXRlbWVudHMsIG1heC1wYXJhbXMsIG1heC1sZW5cbiAgICB2YXIgYWtleXMsIGJrZXlzXG4gICAgdmFyIGlzVW5wcm94aWVkRXJyb3IgPSBmYWxzZVxuXG4gICAgaWYgKGNvbnRleHQgJiBTYW1lUHJvdG8pIHtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoYSkpIHJldHVybiBtYXRjaEFycmF5TGlrZShhLCBiLCBjb250ZXh0LCBsZWZ0LCByaWdodClcblxuICAgICAgICBpZiAoc3VwcG9ydHNNYXAgJiYgYSBpbnN0YW5jZW9mIE1hcCkge1xuICAgICAgICAgICAgcmV0dXJuIG1hdGNoTWFwKGEsIGIsIGNvbnRleHQsIGxlZnQsIHJpZ2h0KVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHN1cHBvcnRzU2V0ICYmIGEgaW5zdGFuY2VvZiBTZXQpIHtcbiAgICAgICAgICAgIHJldHVybiBtYXRjaFNldChhLCBiLCBjb250ZXh0LCBsZWZ0LCByaWdodClcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChvYmplY3RUb1N0cmluZy5jYWxsKGEpID09PSBcIltvYmplY3QgQXJndW1lbnRzXVwiKSB7XG4gICAgICAgICAgICByZXR1cm4gbWF0Y2hBcnJheUxpa2UoYSwgYiwgY29udGV4dCwgbGVmdCwgcmlnaHQpXG4gICAgICAgIH1cblxuICAgICAgICBpZiAocmVxdWlyZXNQcm94eSAmJlxuICAgICAgICAgICAgICAgIChjaGVja0Nyb3NzT3JpZ2luID8gaXNQcm94aWVkRXJyb3IoYSkgOiBhIGluc3RhbmNlb2YgRXJyb3IpKSB7XG4gICAgICAgICAgICBha2V5cyA9IGdldEtleXNTdHJpcHBlZChhKVxuICAgICAgICAgICAgYmtleXMgPSBnZXRLZXlzU3RyaXBwZWQoYilcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGFrZXlzID0gT2JqZWN0LmtleXMoYSlcbiAgICAgICAgICAgIGJrZXlzID0gT2JqZWN0LmtleXMoYilcbiAgICAgICAgICAgIGlzVW5wcm94aWVkRXJyb3IgPSBhIGluc3RhbmNlb2YgRXJyb3JcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChvYmplY3RUb1N0cmluZy5jYWxsKGEpID09PSBcIltvYmplY3QgQXJndW1lbnRzXVwiKSB7XG4gICAgICAgICAgICByZXR1cm4gbWF0Y2hBcnJheUxpa2UoYSwgYiwgY29udGV4dCwgbGVmdCwgcmlnaHQpXG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiB3ZSByZXF1aXJlIGEgcHJveHksIGJlIHBlcm1pc3NpdmUgYW5kIGNoZWNrIHRoZSBgdG9TdHJpbmdgIHR5cGUuXG4gICAgICAgIC8vIFRoaXMgaXMgc28gaXQgd29ya3MgY3Jvc3Mtb3JpZ2luIGluIFBoYW50b21KUyBpbiBwYXJ0aWN1bGFyLlxuICAgICAgICBpZiAoYSBpbnN0YW5jZW9mIEVycm9yKSByZXR1cm4gZmFsc2VcbiAgICAgICAgYWtleXMgPSBPYmplY3Qua2V5cyhhKVxuICAgICAgICBia2V5cyA9IE9iamVjdC5rZXlzKGIpXG4gICAgfVxuXG4gICAgdmFyIGNvdW50ID0gYWtleXMubGVuZ3RoXG5cbiAgICBpZiAoY291bnQgIT09IGJrZXlzLmxlbmd0aCkgcmV0dXJuIGZhbHNlXG5cbiAgICAvLyBTaG9ydGN1dCBpZiB0aGVyZSdzIG5vdGhpbmcgdG8gbWF0Y2hcbiAgICBpZiAoY291bnQgPT09IDApIHJldHVybiB0cnVlXG5cbiAgICB2YXIgaVxuXG4gICAgaWYgKGlzVW5wcm94aWVkRXJyb3IpIHtcbiAgICAgICAgLy8gU2hvcnRjdXQgaWYgdGhlIHByb3BlcnRpZXMgYXJlIGRpZmZlcmVudC5cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcbiAgICAgICAgICAgIGlmIChha2V5c1tpXSAhPT0gXCJzdGFja1wiKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFoYXNPd24uY2FsbChiLCBha2V5c1tpXSkpIHJldHVybiBmYWxzZVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gVmVyaWZ5IHRoYXQgYWxsIHRoZSBha2V5cycgdmFsdWVzIG1hdGNoZWQuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoYWtleXNbaV0gIT09IFwic3RhY2tcIikge1xuICAgICAgICAgICAgICAgIGlmICghbWF0Y2goYVtha2V5c1tpXV0sIGJbYWtleXNbaV1dLCBjb250ZXh0LCBsZWZ0LCByaWdodCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gU2hvcnRjdXQgaWYgdGhlIHByb3BlcnRpZXMgYXJlIGRpZmZlcmVudC5cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcbiAgICAgICAgICAgIGlmICghaGFzT3duLmNhbGwoYiwgYWtleXNbaV0pKSByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFZlcmlmeSB0aGF0IGFsbCB0aGUgYWtleXMnIHZhbHVlcyBtYXRjaGVkLlxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xuICAgICAgICAgICAgaWYgKCFtYXRjaChhW2FrZXlzW2ldXSwgYltha2V5c1tpXV0sIGNvbnRleHQsIGxlZnQsIHJpZ2h0KSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWVcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHhzLCBmKSB7XG4gICAgaWYgKHhzLm1hcCkgcmV0dXJuIHhzLm1hcChmKTtcbiAgICB2YXIgcmVzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB4cy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgeCA9IHhzW2ldO1xuICAgICAgICBpZiAoaGFzT3duLmNhbGwoeHMsIGkpKSByZXMucHVzaChmKHgsIGksIHhzKSk7XG4gICAgfVxuICAgIHJldHVybiByZXM7XG59O1xuXG52YXIgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcbiIsInZhciBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICh4cywgZiwgYWNjKSB7XG4gICAgdmFyIGhhc0FjYyA9IGFyZ3VtZW50cy5sZW5ndGggPj0gMztcbiAgICBpZiAoaGFzQWNjICYmIHhzLnJlZHVjZSkgcmV0dXJuIHhzLnJlZHVjZShmLCBhY2MpO1xuICAgIGlmICh4cy5yZWR1Y2UpIHJldHVybiB4cy5yZWR1Y2UoZik7XG4gICAgXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB4cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoIWhhc093bi5jYWxsKHhzLCBpKSkgY29udGludWU7XG4gICAgICAgIGlmICghaGFzQWNjKSB7XG4gICAgICAgICAgICBhY2MgPSB4c1tpXTtcbiAgICAgICAgICAgIGhhc0FjYyA9IHRydWU7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBhY2MgPSBmKGFjYywgeHNbaV0sIGkpO1xuICAgIH1cbiAgICByZXR1cm4gYWNjO1xufTtcbiIsIlxudmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG52YXIgdG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGZvckVhY2ggKG9iaiwgZm4sIGN0eCkge1xuICAgIGlmICh0b1N0cmluZy5jYWxsKGZuKSAhPT0gJ1tvYmplY3QgRnVuY3Rpb25dJykge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdpdGVyYXRvciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcbiAgICB9XG4gICAgdmFyIGwgPSBvYmoubGVuZ3RoO1xuICAgIGlmIChsID09PSArbCkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgZm4uY2FsbChjdHgsIG9ialtpXSwgaSwgb2JqKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAodmFyIGsgaW4gb2JqKSB7XG4gICAgICAgICAgICBpZiAoaGFzT3duLmNhbGwob2JqLCBrKSkge1xuICAgICAgICAgICAgICAgIGZuLmNhbGwoY3R4LCBvYmpba10sIGssIG9iaik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG4iLCJcbnZhciBpbmRleE9mID0gW10uaW5kZXhPZjtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihhcnIsIG9iail7XG4gIGlmIChpbmRleE9mKSByZXR1cm4gYXJyLmluZGV4T2Yob2JqKTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyArK2kpIHtcbiAgICBpZiAoYXJyW2ldID09PSBvYmopIHJldHVybiBpO1xuICB9XG4gIHJldHVybiAtMTtcbn07IiwibW9kdWxlLmV4cG9ydHMgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uIChhcnIpIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChhcnIpID09ICdbb2JqZWN0IEFycmF5XSc7XG59O1xuIiwiLyohIEpTT04gdjMuMy4wIHwgaHR0cDovL2Jlc3RpZWpzLmdpdGh1Yi5pby9qc29uMyB8IENvcHlyaWdodCAyMDEyLTIwMTQsIEtpdCBDYW1icmlkZ2UgfCBodHRwOi8va2l0Lm1pdC1saWNlbnNlLm9yZyAqL1xuOyhmdW5jdGlvbiAocm9vdCkge1xuICAvLyBEZXRlY3QgdGhlIGBkZWZpbmVgIGZ1bmN0aW9uIGV4cG9zZWQgYnkgYXN5bmNocm9ub3VzIG1vZHVsZSBsb2FkZXJzLiBUaGVcbiAgLy8gc3RyaWN0IGBkZWZpbmVgIGNoZWNrIGlzIG5lY2Vzc2FyeSBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIGByLmpzYC5cbiAgdmFyIGlzTG9hZGVyID0gdHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiICYmIGRlZmluZS5hbWQ7XG5cbiAgLy8gVXNlIHRoZSBgZ2xvYmFsYCBvYmplY3QgZXhwb3NlZCBieSBOb2RlIChpbmNsdWRpbmcgQnJvd3NlcmlmeSB2aWFcbiAgLy8gYGluc2VydC1tb2R1bGUtZ2xvYmFsc2ApLCBOYXJ3aGFsLCBhbmQgUmluZ28gYXMgdGhlIGRlZmF1bHQgY29udGV4dC5cbiAgLy8gUmhpbm8gZXhwb3J0cyBhIGBnbG9iYWxgIGZ1bmN0aW9uIGluc3RlYWQuXG4gIHZhciBmcmVlR2xvYmFsID0gdHlwZW9mIGdsb2JhbCA9PSBcIm9iamVjdFwiICYmIGdsb2JhbDtcbiAgaWYgKGZyZWVHbG9iYWwgJiYgKGZyZWVHbG9iYWxbXCJnbG9iYWxcIl0gPT09IGZyZWVHbG9iYWwgfHwgZnJlZUdsb2JhbFtcIndpbmRvd1wiXSA9PT0gZnJlZUdsb2JhbCkpIHtcbiAgICByb290ID0gZnJlZUdsb2JhbDtcbiAgfVxuXG4gIC8vIFB1YmxpYzogSW5pdGlhbGl6ZXMgSlNPTiAzIHVzaW5nIHRoZSBnaXZlbiBgY29udGV4dGAgb2JqZWN0LCBhdHRhY2hpbmcgdGhlXG4gIC8vIGBzdHJpbmdpZnlgIGFuZCBgcGFyc2VgIGZ1bmN0aW9ucyB0byB0aGUgc3BlY2lmaWVkIGBleHBvcnRzYCBvYmplY3QuXG4gIGZ1bmN0aW9uIHJ1bkluQ29udGV4dChjb250ZXh0LCBleHBvcnRzKSB7XG4gICAgY29udGV4dCB8fCAoY29udGV4dCA9IHJvb3RbXCJPYmplY3RcIl0oKSk7XG4gICAgZXhwb3J0cyB8fCAoZXhwb3J0cyA9IHJvb3RbXCJPYmplY3RcIl0oKSk7XG5cbiAgICAvLyBOYXRpdmUgY29uc3RydWN0b3IgYWxpYXNlcy5cbiAgICB2YXIgTnVtYmVyID0gY29udGV4dFtcIk51bWJlclwiXSB8fCByb290W1wiTnVtYmVyXCJdLFxuICAgICAgICBTdHJpbmcgPSBjb250ZXh0W1wiU3RyaW5nXCJdIHx8IHJvb3RbXCJTdHJpbmdcIl0sXG4gICAgICAgIE9iamVjdCA9IGNvbnRleHRbXCJPYmplY3RcIl0gfHwgcm9vdFtcIk9iamVjdFwiXSxcbiAgICAgICAgRGF0ZSA9IGNvbnRleHRbXCJEYXRlXCJdIHx8IHJvb3RbXCJEYXRlXCJdLFxuICAgICAgICBTeW50YXhFcnJvciA9IGNvbnRleHRbXCJTeW50YXhFcnJvclwiXSB8fCByb290W1wiU3ludGF4RXJyb3JcIl0sXG4gICAgICAgIFR5cGVFcnJvciA9IGNvbnRleHRbXCJUeXBlRXJyb3JcIl0gfHwgcm9vdFtcIlR5cGVFcnJvclwiXSxcbiAgICAgICAgTWF0aCA9IGNvbnRleHRbXCJNYXRoXCJdIHx8IHJvb3RbXCJNYXRoXCJdLFxuICAgICAgICBuYXRpdmVKU09OID0gY29udGV4dFtcIkpTT05cIl0gfHwgcm9vdFtcIkpTT05cIl07XG5cbiAgICAvLyBEZWxlZ2F0ZSB0byB0aGUgbmF0aXZlIGBzdHJpbmdpZnlgIGFuZCBgcGFyc2VgIGltcGxlbWVudGF0aW9ucy5cbiAgICBpZiAodHlwZW9mIG5hdGl2ZUpTT04gPT0gXCJvYmplY3RcIiAmJiBuYXRpdmVKU09OKSB7XG4gICAgICBleHBvcnRzLnN0cmluZ2lmeSA9IG5hdGl2ZUpTT04uc3RyaW5naWZ5O1xuICAgICAgZXhwb3J0cy5wYXJzZSA9IG5hdGl2ZUpTT04ucGFyc2U7XG4gICAgfVxuXG4gICAgLy8gQ29udmVuaWVuY2UgYWxpYXNlcy5cbiAgICB2YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlLFxuICAgICAgICBnZXRDbGFzcyA9IG9iamVjdFByb3RvLnRvU3RyaW5nLFxuICAgICAgICBpc1Byb3BlcnR5LCBmb3JFYWNoLCB1bmRlZjtcblxuICAgIC8vIFRlc3QgdGhlIGBEYXRlI2dldFVUQypgIG1ldGhvZHMuIEJhc2VkIG9uIHdvcmsgYnkgQFlhZmZsZS5cbiAgICB2YXIgaXNFeHRlbmRlZCA9IG5ldyBEYXRlKC0zNTA5ODI3MzM0NTczMjkyKTtcbiAgICB0cnkge1xuICAgICAgLy8gVGhlIGBnZXRVVENGdWxsWWVhcmAsIGBNb250aGAsIGFuZCBgRGF0ZWAgbWV0aG9kcyByZXR1cm4gbm9uc2Vuc2ljYWxcbiAgICAgIC8vIHJlc3VsdHMgZm9yIGNlcnRhaW4gZGF0ZXMgaW4gT3BlcmEgPj0gMTAuNTMuXG4gICAgICBpc0V4dGVuZGVkID0gaXNFeHRlbmRlZC5nZXRVVENGdWxsWWVhcigpID09IC0xMDkyNTIgJiYgaXNFeHRlbmRlZC5nZXRVVENNb250aCgpID09PSAwICYmIGlzRXh0ZW5kZWQuZ2V0VVRDRGF0ZSgpID09PSAxICYmXG4gICAgICAgIC8vIFNhZmFyaSA8IDIuMC4yIHN0b3JlcyB0aGUgaW50ZXJuYWwgbWlsbGlzZWNvbmQgdGltZSB2YWx1ZSBjb3JyZWN0bHksXG4gICAgICAgIC8vIGJ1dCBjbGlwcyB0aGUgdmFsdWVzIHJldHVybmVkIGJ5IHRoZSBkYXRlIG1ldGhvZHMgdG8gdGhlIHJhbmdlIG9mXG4gICAgICAgIC8vIHNpZ25lZCAzMi1iaXQgaW50ZWdlcnMgKFstMiAqKiAzMSwgMiAqKiAzMSAtIDFdKS5cbiAgICAgICAgaXNFeHRlbmRlZC5nZXRVVENIb3VycygpID09IDEwICYmIGlzRXh0ZW5kZWQuZ2V0VVRDTWludXRlcygpID09IDM3ICYmIGlzRXh0ZW5kZWQuZ2V0VVRDU2Vjb25kcygpID09IDYgJiYgaXNFeHRlbmRlZC5nZXRVVENNaWxsaXNlY29uZHMoKSA9PSA3MDg7XG4gICAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7fVxuXG4gICAgLy8gSW50ZXJuYWw6IERldGVybWluZXMgd2hldGhlciB0aGUgbmF0aXZlIGBKU09OLnN0cmluZ2lmeWAgYW5kIGBwYXJzZWBcbiAgICAvLyBpbXBsZW1lbnRhdGlvbnMgYXJlIHNwZWMtY29tcGxpYW50LiBCYXNlZCBvbiB3b3JrIGJ5IEtlbiBTbnlkZXIuXG4gICAgZnVuY3Rpb24gaGFzKG5hbWUpIHtcbiAgICAgIGlmIChoYXNbbmFtZV0gIT09IHVuZGVmKSB7XG4gICAgICAgIC8vIFJldHVybiBjYWNoZWQgZmVhdHVyZSB0ZXN0IHJlc3VsdC5cbiAgICAgICAgcmV0dXJuIGhhc1tuYW1lXTtcbiAgICAgIH1cbiAgICAgIHZhciBpc1N1cHBvcnRlZDtcbiAgICAgIGlmIChuYW1lID09IFwiYnVnLXN0cmluZy1jaGFyLWluZGV4XCIpIHtcbiAgICAgICAgLy8gSUUgPD0gNyBkb2Vzbid0IHN1cHBvcnQgYWNjZXNzaW5nIHN0cmluZyBjaGFyYWN0ZXJzIHVzaW5nIHNxdWFyZVxuICAgICAgICAvLyBicmFja2V0IG5vdGF0aW9uLiBJRSA4IG9ubHkgc3VwcG9ydHMgdGhpcyBmb3IgcHJpbWl0aXZlcy5cbiAgICAgICAgaXNTdXBwb3J0ZWQgPSBcImFcIlswXSAhPSBcImFcIjtcbiAgICAgIH0gZWxzZSBpZiAobmFtZSA9PSBcImpzb25cIikge1xuICAgICAgICAvLyBJbmRpY2F0ZXMgd2hldGhlciBib3RoIGBKU09OLnN0cmluZ2lmeWAgYW5kIGBKU09OLnBhcnNlYCBhcmVcbiAgICAgICAgLy8gc3VwcG9ydGVkLlxuICAgICAgICBpc1N1cHBvcnRlZCA9IGhhcyhcImpzb24tc3RyaW5naWZ5XCIpICYmIGhhcyhcImpzb24tcGFyc2VcIik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgdmFsdWUsIHNlcmlhbGl6ZWQgPSAne1wiYVwiOlsxLHRydWUsZmFsc2UsbnVsbCxcIlxcXFx1MDAwMFxcXFxiXFxcXG5cXFxcZlxcXFxyXFxcXHRcIl19JztcbiAgICAgICAgLy8gVGVzdCBgSlNPTi5zdHJpbmdpZnlgLlxuICAgICAgICBpZiAobmFtZSA9PSBcImpzb24tc3RyaW5naWZ5XCIpIHtcbiAgICAgICAgICB2YXIgc3RyaW5naWZ5ID0gZXhwb3J0cy5zdHJpbmdpZnksIHN0cmluZ2lmeVN1cHBvcnRlZCA9IHR5cGVvZiBzdHJpbmdpZnkgPT0gXCJmdW5jdGlvblwiICYmIGlzRXh0ZW5kZWQ7XG4gICAgICAgICAgaWYgKHN0cmluZ2lmeVN1cHBvcnRlZCkge1xuICAgICAgICAgICAgLy8gQSB0ZXN0IGZ1bmN0aW9uIG9iamVjdCB3aXRoIGEgY3VzdG9tIGB0b0pTT05gIG1ldGhvZC5cbiAgICAgICAgICAgICh2YWx1ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgICAgICB9KS50b0pTT04gPSB2YWx1ZTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIHN0cmluZ2lmeVN1cHBvcnRlZCA9XG4gICAgICAgICAgICAgICAgLy8gRmlyZWZveCAzLjFiMSBhbmQgYjIgc2VyaWFsaXplIHN0cmluZywgbnVtYmVyLCBhbmQgYm9vbGVhblxuICAgICAgICAgICAgICAgIC8vIHByaW1pdGl2ZXMgYXMgb2JqZWN0IGxpdGVyYWxzLlxuICAgICAgICAgICAgICAgIHN0cmluZ2lmeSgwKSA9PT0gXCIwXCIgJiZcbiAgICAgICAgICAgICAgICAvLyBGRiAzLjFiMSwgYjIsIGFuZCBKU09OIDIgc2VyaWFsaXplIHdyYXBwZWQgcHJpbWl0aXZlcyBhcyBvYmplY3RcbiAgICAgICAgICAgICAgICAvLyBsaXRlcmFscy5cbiAgICAgICAgICAgICAgICBzdHJpbmdpZnkobmV3IE51bWJlcigpKSA9PT0gXCIwXCIgJiZcbiAgICAgICAgICAgICAgICBzdHJpbmdpZnkobmV3IFN0cmluZygpKSA9PSAnXCJcIicgJiZcbiAgICAgICAgICAgICAgICAvLyBGRiAzLjFiMSwgMiB0aHJvdyBhbiBlcnJvciBpZiB0aGUgdmFsdWUgaXMgYG51bGxgLCBgdW5kZWZpbmVkYCwgb3JcbiAgICAgICAgICAgICAgICAvLyBkb2VzIG5vdCBkZWZpbmUgYSBjYW5vbmljYWwgSlNPTiByZXByZXNlbnRhdGlvbiAodGhpcyBhcHBsaWVzIHRvXG4gICAgICAgICAgICAgICAgLy8gb2JqZWN0cyB3aXRoIGB0b0pTT05gIHByb3BlcnRpZXMgYXMgd2VsbCwgKnVubGVzcyogdGhleSBhcmUgbmVzdGVkXG4gICAgICAgICAgICAgICAgLy8gd2l0aGluIGFuIG9iamVjdCBvciBhcnJheSkuXG4gICAgICAgICAgICAgICAgc3RyaW5naWZ5KGdldENsYXNzKSA9PT0gdW5kZWYgJiZcbiAgICAgICAgICAgICAgICAvLyBJRSA4IHNlcmlhbGl6ZXMgYHVuZGVmaW5lZGAgYXMgYFwidW5kZWZpbmVkXCJgLiBTYWZhcmkgPD0gNS4xLjcgYW5kXG4gICAgICAgICAgICAgICAgLy8gRkYgMy4xYjMgcGFzcyB0aGlzIHRlc3QuXG4gICAgICAgICAgICAgICAgc3RyaW5naWZ5KHVuZGVmKSA9PT0gdW5kZWYgJiZcbiAgICAgICAgICAgICAgICAvLyBTYWZhcmkgPD0gNS4xLjcgYW5kIEZGIDMuMWIzIHRocm93IGBFcnJvcmBzIGFuZCBgVHlwZUVycm9yYHMsXG4gICAgICAgICAgICAgICAgLy8gcmVzcGVjdGl2ZWx5LCBpZiB0aGUgdmFsdWUgaXMgb21pdHRlZCBlbnRpcmVseS5cbiAgICAgICAgICAgICAgICBzdHJpbmdpZnkoKSA9PT0gdW5kZWYgJiZcbiAgICAgICAgICAgICAgICAvLyBGRiAzLjFiMSwgMiB0aHJvdyBhbiBlcnJvciBpZiB0aGUgZ2l2ZW4gdmFsdWUgaXMgbm90IGEgbnVtYmVyLFxuICAgICAgICAgICAgICAgIC8vIHN0cmluZywgYXJyYXksIG9iamVjdCwgQm9vbGVhbiwgb3IgYG51bGxgIGxpdGVyYWwuIFRoaXMgYXBwbGllcyB0b1xuICAgICAgICAgICAgICAgIC8vIG9iamVjdHMgd2l0aCBjdXN0b20gYHRvSlNPTmAgbWV0aG9kcyBhcyB3ZWxsLCB1bmxlc3MgdGhleSBhcmUgbmVzdGVkXG4gICAgICAgICAgICAgICAgLy8gaW5zaWRlIG9iamVjdCBvciBhcnJheSBsaXRlcmFscy4gWVVJIDMuMC4wYjEgaWdub3JlcyBjdXN0b20gYHRvSlNPTmBcbiAgICAgICAgICAgICAgICAvLyBtZXRob2RzIGVudGlyZWx5LlxuICAgICAgICAgICAgICAgIHN0cmluZ2lmeSh2YWx1ZSkgPT09IFwiMVwiICYmXG4gICAgICAgICAgICAgICAgc3RyaW5naWZ5KFt2YWx1ZV0pID09IFwiWzFdXCIgJiZcbiAgICAgICAgICAgICAgICAvLyBQcm90b3R5cGUgPD0gMS42LjEgc2VyaWFsaXplcyBgW3VuZGVmaW5lZF1gIGFzIGBcIltdXCJgIGluc3RlYWQgb2ZcbiAgICAgICAgICAgICAgICAvLyBgXCJbbnVsbF1cImAuXG4gICAgICAgICAgICAgICAgc3RyaW5naWZ5KFt1bmRlZl0pID09IFwiW251bGxdXCIgJiZcbiAgICAgICAgICAgICAgICAvLyBZVUkgMy4wLjBiMSBmYWlscyB0byBzZXJpYWxpemUgYG51bGxgIGxpdGVyYWxzLlxuICAgICAgICAgICAgICAgIHN0cmluZ2lmeShudWxsKSA9PSBcIm51bGxcIiAmJlxuICAgICAgICAgICAgICAgIC8vIEZGIDMuMWIxLCAyIGhhbHRzIHNlcmlhbGl6YXRpb24gaWYgYW4gYXJyYXkgY29udGFpbnMgYSBmdW5jdGlvbjpcbiAgICAgICAgICAgICAgICAvLyBgWzEsIHRydWUsIGdldENsYXNzLCAxXWAgc2VyaWFsaXplcyBhcyBcIlsxLHRydWUsXSxcIi4gRkYgMy4xYjNcbiAgICAgICAgICAgICAgICAvLyBlbGlkZXMgbm9uLUpTT04gdmFsdWVzIGZyb20gb2JqZWN0cyBhbmQgYXJyYXlzLCB1bmxlc3MgdGhleVxuICAgICAgICAgICAgICAgIC8vIGRlZmluZSBjdXN0b20gYHRvSlNPTmAgbWV0aG9kcy5cbiAgICAgICAgICAgICAgICBzdHJpbmdpZnkoW3VuZGVmLCBnZXRDbGFzcywgbnVsbF0pID09IFwiW251bGwsbnVsbCxudWxsXVwiICYmXG4gICAgICAgICAgICAgICAgLy8gU2ltcGxlIHNlcmlhbGl6YXRpb24gdGVzdC4gRkYgMy4xYjEgdXNlcyBVbmljb2RlIGVzY2FwZSBzZXF1ZW5jZXNcbiAgICAgICAgICAgICAgICAvLyB3aGVyZSBjaGFyYWN0ZXIgZXNjYXBlIGNvZGVzIGFyZSBleHBlY3RlZCAoZS5nLiwgYFxcYmAgPT4gYFxcdTAwMDhgKS5cbiAgICAgICAgICAgICAgICBzdHJpbmdpZnkoeyBcImFcIjogW3ZhbHVlLCB0cnVlLCBmYWxzZSwgbnVsbCwgXCJcXHgwMFxcYlxcblxcZlxcclxcdFwiXSB9KSA9PSBzZXJpYWxpemVkICYmXG4gICAgICAgICAgICAgICAgLy8gRkYgMy4xYjEgYW5kIGIyIGlnbm9yZSB0aGUgYGZpbHRlcmAgYW5kIGB3aWR0aGAgYXJndW1lbnRzLlxuICAgICAgICAgICAgICAgIHN0cmluZ2lmeShudWxsLCB2YWx1ZSkgPT09IFwiMVwiICYmXG4gICAgICAgICAgICAgICAgc3RyaW5naWZ5KFsxLCAyXSwgbnVsbCwgMSkgPT0gXCJbXFxuIDEsXFxuIDJcXG5dXCIgJiZcbiAgICAgICAgICAgICAgICAvLyBKU09OIDIsIFByb3RvdHlwZSA8PSAxLjcsIGFuZCBvbGRlciBXZWJLaXQgYnVpbGRzIGluY29ycmVjdGx5XG4gICAgICAgICAgICAgICAgLy8gc2VyaWFsaXplIGV4dGVuZGVkIHllYXJzLlxuICAgICAgICAgICAgICAgIHN0cmluZ2lmeShuZXcgRGF0ZSgtOC42NGUxNSkpID09ICdcIi0yNzE4MjEtMDQtMjBUMDA6MDA6MDAuMDAwWlwiJyAmJlxuICAgICAgICAgICAgICAgIC8vIFRoZSBtaWxsaXNlY29uZHMgYXJlIG9wdGlvbmFsIGluIEVTIDUsIGJ1dCByZXF1aXJlZCBpbiA1LjEuXG4gICAgICAgICAgICAgICAgc3RyaW5naWZ5KG5ldyBEYXRlKDguNjRlMTUpKSA9PSAnXCIrMjc1NzYwLTA5LTEzVDAwOjAwOjAwLjAwMFpcIicgJiZcbiAgICAgICAgICAgICAgICAvLyBGaXJlZm94IDw9IDExLjAgaW5jb3JyZWN0bHkgc2VyaWFsaXplcyB5ZWFycyBwcmlvciB0byAwIGFzIG5lZ2F0aXZlXG4gICAgICAgICAgICAgICAgLy8gZm91ci1kaWdpdCB5ZWFycyBpbnN0ZWFkIG9mIHNpeC1kaWdpdCB5ZWFycy4gQ3JlZGl0czogQFlhZmZsZS5cbiAgICAgICAgICAgICAgICBzdHJpbmdpZnkobmV3IERhdGUoLTYyMTk4NzU1MmU1KSkgPT0gJ1wiLTAwMDAwMS0wMS0wMVQwMDowMDowMC4wMDBaXCInICYmXG4gICAgICAgICAgICAgICAgLy8gU2FmYXJpIDw9IDUuMS41IGFuZCBPcGVyYSA+PSAxMC41MyBpbmNvcnJlY3RseSBzZXJpYWxpemUgbWlsbGlzZWNvbmRcbiAgICAgICAgICAgICAgICAvLyB2YWx1ZXMgbGVzcyB0aGFuIDEwMDAuIENyZWRpdHM6IEBZYWZmbGUuXG4gICAgICAgICAgICAgICAgc3RyaW5naWZ5KG5ldyBEYXRlKC0xKSkgPT0gJ1wiMTk2OS0xMi0zMVQyMzo1OTo1OS45OTlaXCInO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7XG4gICAgICAgICAgICAgIHN0cmluZ2lmeVN1cHBvcnRlZCA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpc1N1cHBvcnRlZCA9IHN0cmluZ2lmeVN1cHBvcnRlZDtcbiAgICAgICAgfVxuICAgICAgICAvLyBUZXN0IGBKU09OLnBhcnNlYC5cbiAgICAgICAgaWYgKG5hbWUgPT0gXCJqc29uLXBhcnNlXCIpIHtcbiAgICAgICAgICB2YXIgcGFyc2UgPSBleHBvcnRzLnBhcnNlO1xuICAgICAgICAgIGlmICh0eXBlb2YgcGFyc2UgPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAvLyBGRiAzLjFiMSwgYjIgd2lsbCB0aHJvdyBhbiBleGNlcHRpb24gaWYgYSBiYXJlIGxpdGVyYWwgaXMgcHJvdmlkZWQuXG4gICAgICAgICAgICAgIC8vIENvbmZvcm1pbmcgaW1wbGVtZW50YXRpb25zIHNob3VsZCBhbHNvIGNvZXJjZSB0aGUgaW5pdGlhbCBhcmd1bWVudCB0b1xuICAgICAgICAgICAgICAvLyBhIHN0cmluZyBwcmlvciB0byBwYXJzaW5nLlxuICAgICAgICAgICAgICBpZiAocGFyc2UoXCIwXCIpID09PSAwICYmICFwYXJzZShmYWxzZSkpIHtcbiAgICAgICAgICAgICAgICAvLyBTaW1wbGUgcGFyc2luZyB0ZXN0LlxuICAgICAgICAgICAgICAgIHZhbHVlID0gcGFyc2Uoc2VyaWFsaXplZCk7XG4gICAgICAgICAgICAgICAgdmFyIHBhcnNlU3VwcG9ydGVkID0gdmFsdWVbXCJhXCJdLmxlbmd0aCA9PSA1ICYmIHZhbHVlW1wiYVwiXVswXSA9PT0gMTtcbiAgICAgICAgICAgICAgICBpZiAocGFyc2VTdXBwb3J0ZWQpIHtcbiAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFNhZmFyaSA8PSA1LjEuMiBhbmQgRkYgMy4xYjEgYWxsb3cgdW5lc2NhcGVkIHRhYnMgaW4gc3RyaW5ncy5cbiAgICAgICAgICAgICAgICAgICAgcGFyc2VTdXBwb3J0ZWQgPSAhcGFyc2UoJ1wiXFx0XCInKTtcbiAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge31cbiAgICAgICAgICAgICAgICAgIGlmIChwYXJzZVN1cHBvcnRlZCkge1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgIC8vIEZGIDQuMCBhbmQgNC4wLjEgYWxsb3cgbGVhZGluZyBgK2Agc2lnbnMgYW5kIGxlYWRpbmdcbiAgICAgICAgICAgICAgICAgICAgICAvLyBkZWNpbWFsIHBvaW50cy4gRkYgNC4wLCA0LjAuMSwgYW5kIElFIDktMTAgYWxzbyBhbGxvd1xuICAgICAgICAgICAgICAgICAgICAgIC8vIGNlcnRhaW4gb2N0YWwgbGl0ZXJhbHMuXG4gICAgICAgICAgICAgICAgICAgICAgcGFyc2VTdXBwb3J0ZWQgPSBwYXJzZShcIjAxXCIpICE9PSAxO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChleGNlcHRpb24pIHt9XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICBpZiAocGFyc2VTdXBwb3J0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAvLyBGRiA0LjAsIDQuMC4xLCBhbmQgUmhpbm8gMS43UjMtUjQgYWxsb3cgdHJhaWxpbmcgZGVjaW1hbFxuICAgICAgICAgICAgICAgICAgICAgIC8vIHBvaW50cy4gVGhlc2UgZW52aXJvbm1lbnRzLCBhbG9uZyB3aXRoIEZGIDMuMWIxIGFuZCAyLFxuICAgICAgICAgICAgICAgICAgICAgIC8vIGFsc28gYWxsb3cgdHJhaWxpbmcgY29tbWFzIGluIEpTT04gb2JqZWN0cyBhbmQgYXJyYXlzLlxuICAgICAgICAgICAgICAgICAgICAgIHBhcnNlU3VwcG9ydGVkID0gcGFyc2UoXCIxLlwiKSAhPT0gMTtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7fVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7XG4gICAgICAgICAgICAgIHBhcnNlU3VwcG9ydGVkID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlzU3VwcG9ydGVkID0gcGFyc2VTdXBwb3J0ZWQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBoYXNbbmFtZV0gPSAhIWlzU3VwcG9ydGVkO1xuICAgIH1cblxuICAgIGlmICghaGFzKFwianNvblwiKSkge1xuICAgICAgLy8gQ29tbW9uIGBbW0NsYXNzXV1gIG5hbWUgYWxpYXNlcy5cbiAgICAgIHZhciBmdW5jdGlvbkNsYXNzID0gXCJbb2JqZWN0IEZ1bmN0aW9uXVwiLFxuICAgICAgICAgIGRhdGVDbGFzcyA9IFwiW29iamVjdCBEYXRlXVwiLFxuICAgICAgICAgIG51bWJlckNsYXNzID0gXCJbb2JqZWN0IE51bWJlcl1cIixcbiAgICAgICAgICBzdHJpbmdDbGFzcyA9IFwiW29iamVjdCBTdHJpbmddXCIsXG4gICAgICAgICAgYXJyYXlDbGFzcyA9IFwiW29iamVjdCBBcnJheV1cIixcbiAgICAgICAgICBib29sZWFuQ2xhc3MgPSBcIltvYmplY3QgQm9vbGVhbl1cIjtcblxuICAgICAgLy8gRGV0ZWN0IGluY29tcGxldGUgc3VwcG9ydCBmb3IgYWNjZXNzaW5nIHN0cmluZyBjaGFyYWN0ZXJzIGJ5IGluZGV4LlxuICAgICAgdmFyIGNoYXJJbmRleEJ1Z2d5ID0gaGFzKFwiYnVnLXN0cmluZy1jaGFyLWluZGV4XCIpO1xuXG4gICAgICAvLyBEZWZpbmUgYWRkaXRpb25hbCB1dGlsaXR5IG1ldGhvZHMgaWYgdGhlIGBEYXRlYCBtZXRob2RzIGFyZSBidWdneS5cbiAgICAgIGlmICghaXNFeHRlbmRlZCkge1xuICAgICAgICB2YXIgZmxvb3IgPSBNYXRoLmZsb29yO1xuICAgICAgICAvLyBBIG1hcHBpbmcgYmV0d2VlbiB0aGUgbW9udGhzIG9mIHRoZSB5ZWFyIGFuZCB0aGUgbnVtYmVyIG9mIGRheXMgYmV0d2VlblxuICAgICAgICAvLyBKYW51YXJ5IDFzdCBhbmQgdGhlIGZpcnN0IG9mIHRoZSByZXNwZWN0aXZlIG1vbnRoLlxuICAgICAgICB2YXIgTW9udGhzID0gWzAsIDMxLCA1OSwgOTAsIDEyMCwgMTUxLCAxODEsIDIxMiwgMjQzLCAyNzMsIDMwNCwgMzM0XTtcbiAgICAgICAgLy8gSW50ZXJuYWw6IENhbGN1bGF0ZXMgdGhlIG51bWJlciBvZiBkYXlzIGJldHdlZW4gdGhlIFVuaXggZXBvY2ggYW5kIHRoZVxuICAgICAgICAvLyBmaXJzdCBkYXkgb2YgdGhlIGdpdmVuIG1vbnRoLlxuICAgICAgICB2YXIgZ2V0RGF5ID0gZnVuY3Rpb24gKHllYXIsIG1vbnRoKSB7XG4gICAgICAgICAgcmV0dXJuIE1vbnRoc1ttb250aF0gKyAzNjUgKiAoeWVhciAtIDE5NzApICsgZmxvb3IoKHllYXIgLSAxOTY5ICsgKG1vbnRoID0gKyhtb250aCA+IDEpKSkgLyA0KSAtIGZsb29yKCh5ZWFyIC0gMTkwMSArIG1vbnRoKSAvIDEwMCkgKyBmbG9vcigoeWVhciAtIDE2MDEgKyBtb250aCkgLyA0MDApO1xuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICAvLyBJbnRlcm5hbDogRGV0ZXJtaW5lcyBpZiBhIHByb3BlcnR5IGlzIGEgZGlyZWN0IHByb3BlcnR5IG9mIHRoZSBnaXZlblxuICAgICAgLy8gb2JqZWN0LiBEZWxlZ2F0ZXMgdG8gdGhlIG5hdGl2ZSBgT2JqZWN0I2hhc093blByb3BlcnR5YCBtZXRob2QuXG4gICAgICBpZiAoIShpc1Byb3BlcnR5ID0gb2JqZWN0UHJvdG8uaGFzT3duUHJvcGVydHkpKSB7XG4gICAgICAgIGlzUHJvcGVydHkgPSBmdW5jdGlvbiAocHJvcGVydHkpIHtcbiAgICAgICAgICB2YXIgbWVtYmVycyA9IHt9LCBjb25zdHJ1Y3RvcjtcbiAgICAgICAgICBpZiAoKG1lbWJlcnMuX19wcm90b19fID0gbnVsbCwgbWVtYmVycy5fX3Byb3RvX18gPSB7XG4gICAgICAgICAgICAvLyBUaGUgKnByb3RvKiBwcm9wZXJ0eSBjYW5ub3QgYmUgc2V0IG11bHRpcGxlIHRpbWVzIGluIHJlY2VudFxuICAgICAgICAgICAgLy8gdmVyc2lvbnMgb2YgRmlyZWZveCBhbmQgU2VhTW9ua2V5LlxuICAgICAgICAgICAgXCJ0b1N0cmluZ1wiOiAxXG4gICAgICAgICAgfSwgbWVtYmVycykudG9TdHJpbmcgIT0gZ2V0Q2xhc3MpIHtcbiAgICAgICAgICAgIC8vIFNhZmFyaSA8PSAyLjAuMyBkb2Vzbid0IGltcGxlbWVudCBgT2JqZWN0I2hhc093blByb3BlcnR5YCwgYnV0XG4gICAgICAgICAgICAvLyBzdXBwb3J0cyB0aGUgbXV0YWJsZSAqcHJvdG8qIHByb3BlcnR5LlxuICAgICAgICAgICAgaXNQcm9wZXJ0eSA9IGZ1bmN0aW9uIChwcm9wZXJ0eSkge1xuICAgICAgICAgICAgICAvLyBDYXB0dXJlIGFuZCBicmVhayB0aGUgb2JqZWN0Z3MgcHJvdG90eXBlIGNoYWluIChzZWUgc2VjdGlvbiA4LjYuMlxuICAgICAgICAgICAgICAvLyBvZiB0aGUgRVMgNS4xIHNwZWMpLiBUaGUgcGFyZW50aGVzaXplZCBleHByZXNzaW9uIHByZXZlbnRzIGFuXG4gICAgICAgICAgICAgIC8vIHVuc2FmZSB0cmFuc2Zvcm1hdGlvbiBieSB0aGUgQ2xvc3VyZSBDb21waWxlci5cbiAgICAgICAgICAgICAgdmFyIG9yaWdpbmFsID0gdGhpcy5fX3Byb3RvX18sIHJlc3VsdCA9IHByb3BlcnR5IGluICh0aGlzLl9fcHJvdG9fXyA9IG51bGwsIHRoaXMpO1xuICAgICAgICAgICAgICAvLyBSZXN0b3JlIHRoZSBvcmlnaW5hbCBwcm90b3R5cGUgY2hhaW4uXG4gICAgICAgICAgICAgIHRoaXMuX19wcm90b19fID0gb3JpZ2luYWw7XG4gICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBDYXB0dXJlIGEgcmVmZXJlbmNlIHRvIHRoZSB0b3AtbGV2ZWwgYE9iamVjdGAgY29uc3RydWN0b3IuXG4gICAgICAgICAgICBjb25zdHJ1Y3RvciA9IG1lbWJlcnMuY29uc3RydWN0b3I7XG4gICAgICAgICAgICAvLyBVc2UgdGhlIGBjb25zdHJ1Y3RvcmAgcHJvcGVydHkgdG8gc2ltdWxhdGUgYE9iamVjdCNoYXNPd25Qcm9wZXJ0eWAgaW5cbiAgICAgICAgICAgIC8vIG90aGVyIGVudmlyb25tZW50cy5cbiAgICAgICAgICAgIGlzUHJvcGVydHkgPSBmdW5jdGlvbiAocHJvcGVydHkpIHtcbiAgICAgICAgICAgICAgdmFyIHBhcmVudCA9ICh0aGlzLmNvbnN0cnVjdG9yIHx8IGNvbnN0cnVjdG9yKS5wcm90b3R5cGU7XG4gICAgICAgICAgICAgIHJldHVybiBwcm9wZXJ0eSBpbiB0aGlzICYmICEocHJvcGVydHkgaW4gcGFyZW50ICYmIHRoaXNbcHJvcGVydHldID09PSBwYXJlbnRbcHJvcGVydHldKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfVxuICAgICAgICAgIG1lbWJlcnMgPSBudWxsO1xuICAgICAgICAgIHJldHVybiBpc1Byb3BlcnR5LmNhbGwodGhpcywgcHJvcGVydHkpO1xuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICAvLyBJbnRlcm5hbDogQSBzZXQgb2YgcHJpbWl0aXZlIHR5cGVzIHVzZWQgYnkgYGlzSG9zdFR5cGVgLlxuICAgICAgdmFyIFByaW1pdGl2ZVR5cGVzID0ge1xuICAgICAgICBcImJvb2xlYW5cIjogMSxcbiAgICAgICAgXCJudW1iZXJcIjogMSxcbiAgICAgICAgXCJzdHJpbmdcIjogMSxcbiAgICAgICAgXCJ1bmRlZmluZWRcIjogMVxuICAgICAgfTtcblxuICAgICAgLy8gSW50ZXJuYWw6IERldGVybWluZXMgaWYgdGhlIGdpdmVuIG9iamVjdCBgcHJvcGVydHlgIHZhbHVlIGlzIGFcbiAgICAgIC8vIG5vbi1wcmltaXRpdmUuXG4gICAgICB2YXIgaXNIb3N0VHlwZSA9IGZ1bmN0aW9uIChvYmplY3QsIHByb3BlcnR5KSB7XG4gICAgICAgIHZhciB0eXBlID0gdHlwZW9mIG9iamVjdFtwcm9wZXJ0eV07XG4gICAgICAgIHJldHVybiB0eXBlID09IFwib2JqZWN0XCIgPyAhIW9iamVjdFtwcm9wZXJ0eV0gOiAhUHJpbWl0aXZlVHlwZXNbdHlwZV07XG4gICAgICB9O1xuXG4gICAgICAvLyBJbnRlcm5hbDogTm9ybWFsaXplcyB0aGUgYGZvci4uLmluYCBpdGVyYXRpb24gYWxnb3JpdGhtIGFjcm9zc1xuICAgICAgLy8gZW52aXJvbm1lbnRzLiBFYWNoIGVudW1lcmF0ZWQga2V5IGlzIHlpZWxkZWQgdG8gYSBgY2FsbGJhY2tgIGZ1bmN0aW9uLlxuICAgICAgZm9yRWFjaCA9IGZ1bmN0aW9uIChvYmplY3QsIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBzaXplID0gMCwgUHJvcGVydGllcywgbWVtYmVycywgcHJvcGVydHk7XG5cbiAgICAgICAgLy8gVGVzdHMgZm9yIGJ1Z3MgaW4gdGhlIGN1cnJlbnQgZW52aXJvbm1lbnQncyBgZm9yLi4uaW5gIGFsZ29yaXRobS4gVGhlXG4gICAgICAgIC8vIGB2YWx1ZU9mYCBwcm9wZXJ0eSBpbmhlcml0cyB0aGUgbm9uLWVudW1lcmFibGUgZmxhZyBmcm9tXG4gICAgICAgIC8vIGBPYmplY3QucHJvdG90eXBlYCBpbiBvbGRlciB2ZXJzaW9ucyBvZiBJRSwgTmV0c2NhcGUsIGFuZCBNb3ppbGxhLlxuICAgICAgICAoUHJvcGVydGllcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICB0aGlzLnZhbHVlT2YgPSAwO1xuICAgICAgICB9KS5wcm90b3R5cGUudmFsdWVPZiA9IDA7XG5cbiAgICAgICAgLy8gSXRlcmF0ZSBvdmVyIGEgbmV3IGluc3RhbmNlIG9mIHRoZSBgUHJvcGVydGllc2AgY2xhc3MuXG4gICAgICAgIG1lbWJlcnMgPSBuZXcgUHJvcGVydGllcygpO1xuICAgICAgICBmb3IgKHByb3BlcnR5IGluIG1lbWJlcnMpIHtcbiAgICAgICAgICAvLyBJZ25vcmUgYWxsIHByb3BlcnRpZXMgaW5oZXJpdGVkIGZyb20gYE9iamVjdC5wcm90b3R5cGVgLlxuICAgICAgICAgIGlmIChpc1Byb3BlcnR5LmNhbGwobWVtYmVycywgcHJvcGVydHkpKSB7XG4gICAgICAgICAgICBzaXplKys7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFByb3BlcnRpZXMgPSBtZW1iZXJzID0gbnVsbDtcblxuICAgICAgICAvLyBOb3JtYWxpemUgdGhlIGl0ZXJhdGlvbiBhbGdvcml0aG0uXG4gICAgICAgIGlmICghc2l6ZSkge1xuICAgICAgICAgIC8vIEEgbGlzdCBvZiBub24tZW51bWVyYWJsZSBwcm9wZXJ0aWVzIGluaGVyaXRlZCBmcm9tIGBPYmplY3QucHJvdG90eXBlYC5cbiAgICAgICAgICBtZW1iZXJzID0gW1widmFsdWVPZlwiLCBcInRvU3RyaW5nXCIsIFwidG9Mb2NhbGVTdHJpbmdcIiwgXCJwcm9wZXJ0eUlzRW51bWVyYWJsZVwiLCBcImlzUHJvdG90eXBlT2ZcIiwgXCJoYXNPd25Qcm9wZXJ0eVwiLCBcImNvbnN0cnVjdG9yXCJdO1xuICAgICAgICAgIC8vIElFIDw9IDgsIE1vemlsbGEgMS4wLCBhbmQgTmV0c2NhcGUgNi4yIGlnbm9yZSBzaGFkb3dlZCBub24tZW51bWVyYWJsZVxuICAgICAgICAgIC8vIHByb3BlcnRpZXMuXG4gICAgICAgICAgZm9yRWFjaCA9IGZ1bmN0aW9uIChvYmplY3QsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICB2YXIgaXNGdW5jdGlvbiA9IGdldENsYXNzLmNhbGwob2JqZWN0KSA9PSBmdW5jdGlvbkNsYXNzLCBwcm9wZXJ0eSwgbGVuZ3RoO1xuICAgICAgICAgICAgdmFyIGhhc1Byb3BlcnR5ID0gIWlzRnVuY3Rpb24gJiYgdHlwZW9mIG9iamVjdC5jb25zdHJ1Y3RvciAhPSBcImZ1bmN0aW9uXCIgJiYgaXNIb3N0VHlwZShvYmplY3QsIFwiaGFzT3duUHJvcGVydHlcIikgPyBvYmplY3QuaGFzT3duUHJvcGVydHkgOiBpc1Byb3BlcnR5O1xuICAgICAgICAgICAgZm9yIChwcm9wZXJ0eSBpbiBvYmplY3QpIHtcbiAgICAgICAgICAgICAgLy8gR2Vja28gPD0gMS4wIGVudW1lcmF0ZXMgdGhlIGBwcm90b3R5cGVgIHByb3BlcnR5IG9mIGZ1bmN0aW9ucyB1bmRlclxuICAgICAgICAgICAgICAvLyBjZXJ0YWluIGNvbmRpdGlvbnM7IElFIGRvZXMgbm90LlxuICAgICAgICAgICAgICBpZiAoIShpc0Z1bmN0aW9uICYmIHByb3BlcnR5ID09IFwicHJvdG90eXBlXCIpICYmIGhhc1Byb3BlcnR5LmNhbGwob2JqZWN0LCBwcm9wZXJ0eSkpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhwcm9wZXJ0eSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIE1hbnVhbGx5IGludm9rZSB0aGUgY2FsbGJhY2sgZm9yIGVhY2ggbm9uLWVudW1lcmFibGUgcHJvcGVydHkuXG4gICAgICAgICAgICBmb3IgKGxlbmd0aCA9IG1lbWJlcnMubGVuZ3RoOyBwcm9wZXJ0eSA9IG1lbWJlcnNbLS1sZW5ndGhdOyBoYXNQcm9wZXJ0eS5jYWxsKG9iamVjdCwgcHJvcGVydHkpICYmIGNhbGxiYWNrKHByb3BlcnR5KSk7XG4gICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIGlmIChzaXplID09IDIpIHtcbiAgICAgICAgICAvLyBTYWZhcmkgPD0gMi4wLjQgZW51bWVyYXRlcyBzaGFkb3dlZCBwcm9wZXJ0aWVzIHR3aWNlLlxuICAgICAgICAgIGZvckVhY2ggPSBmdW5jdGlvbiAob2JqZWN0LCBjYWxsYmFjaykge1xuICAgICAgICAgICAgLy8gQ3JlYXRlIGEgc2V0IG9mIGl0ZXJhdGVkIHByb3BlcnRpZXMuXG4gICAgICAgICAgICB2YXIgbWVtYmVycyA9IHt9LCBpc0Z1bmN0aW9uID0gZ2V0Q2xhc3MuY2FsbChvYmplY3QpID09IGZ1bmN0aW9uQ2xhc3MsIHByb3BlcnR5O1xuICAgICAgICAgICAgZm9yIChwcm9wZXJ0eSBpbiBvYmplY3QpIHtcbiAgICAgICAgICAgICAgLy8gU3RvcmUgZWFjaCBwcm9wZXJ0eSBuYW1lIHRvIHByZXZlbnQgZG91YmxlIGVudW1lcmF0aW9uLiBUaGVcbiAgICAgICAgICAgICAgLy8gYHByb3RvdHlwZWAgcHJvcGVydHkgb2YgZnVuY3Rpb25zIGlzIG5vdCBlbnVtZXJhdGVkIGR1ZSB0byBjcm9zcy1cbiAgICAgICAgICAgICAgLy8gZW52aXJvbm1lbnQgaW5jb25zaXN0ZW5jaWVzLlxuICAgICAgICAgICAgICBpZiAoIShpc0Z1bmN0aW9uICYmIHByb3BlcnR5ID09IFwicHJvdG90eXBlXCIpICYmICFpc1Byb3BlcnR5LmNhbGwobWVtYmVycywgcHJvcGVydHkpICYmIChtZW1iZXJzW3Byb3BlcnR5XSA9IDEpICYmIGlzUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3BlcnR5KSkge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKHByb3BlcnR5KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gTm8gYnVncyBkZXRlY3RlZDsgdXNlIHRoZSBzdGFuZGFyZCBgZm9yLi4uaW5gIGFsZ29yaXRobS5cbiAgICAgICAgICBmb3JFYWNoID0gZnVuY3Rpb24gKG9iamVjdCwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHZhciBpc0Z1bmN0aW9uID0gZ2V0Q2xhc3MuY2FsbChvYmplY3QpID09IGZ1bmN0aW9uQ2xhc3MsIHByb3BlcnR5LCBpc0NvbnN0cnVjdG9yO1xuICAgICAgICAgICAgZm9yIChwcm9wZXJ0eSBpbiBvYmplY3QpIHtcbiAgICAgICAgICAgICAgaWYgKCEoaXNGdW5jdGlvbiAmJiBwcm9wZXJ0eSA9PSBcInByb3RvdHlwZVwiKSAmJiBpc1Byb3BlcnR5LmNhbGwob2JqZWN0LCBwcm9wZXJ0eSkgJiYgIShpc0NvbnN0cnVjdG9yID0gcHJvcGVydHkgPT09IFwiY29uc3RydWN0b3JcIikpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhwcm9wZXJ0eSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIE1hbnVhbGx5IGludm9rZSB0aGUgY2FsbGJhY2sgZm9yIHRoZSBgY29uc3RydWN0b3JgIHByb3BlcnR5IGR1ZSB0b1xuICAgICAgICAgICAgLy8gY3Jvc3MtZW52aXJvbm1lbnQgaW5jb25zaXN0ZW5jaWVzLlxuICAgICAgICAgICAgaWYgKGlzQ29uc3RydWN0b3IgfHwgaXNQcm9wZXJ0eS5jYWxsKG9iamVjdCwgKHByb3BlcnR5ID0gXCJjb25zdHJ1Y3RvclwiKSkpIHtcbiAgICAgICAgICAgICAgY2FsbGJhY2socHJvcGVydHkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZvckVhY2gob2JqZWN0LCBjYWxsYmFjayk7XG4gICAgICB9O1xuXG4gICAgICAvLyBQdWJsaWM6IFNlcmlhbGl6ZXMgYSBKYXZhU2NyaXB0IGB2YWx1ZWAgYXMgYSBKU09OIHN0cmluZy4gVGhlIG9wdGlvbmFsXG4gICAgICAvLyBgZmlsdGVyYCBhcmd1bWVudCBtYXkgc3BlY2lmeSBlaXRoZXIgYSBmdW5jdGlvbiB0aGF0IGFsdGVycyBob3cgb2JqZWN0IGFuZFxuICAgICAgLy8gYXJyYXkgbWVtYmVycyBhcmUgc2VyaWFsaXplZCwgb3IgYW4gYXJyYXkgb2Ygc3RyaW5ncyBhbmQgbnVtYmVycyB0aGF0XG4gICAgICAvLyBpbmRpY2F0ZXMgd2hpY2ggcHJvcGVydGllcyBzaG91bGQgYmUgc2VyaWFsaXplZC4gVGhlIG9wdGlvbmFsIGB3aWR0aGBcbiAgICAgIC8vIGFyZ3VtZW50IG1heSBiZSBlaXRoZXIgYSBzdHJpbmcgb3IgbnVtYmVyIHRoYXQgc3BlY2lmaWVzIHRoZSBpbmRlbnRhdGlvblxuICAgICAgLy8gbGV2ZWwgb2YgdGhlIG91dHB1dC5cbiAgICAgIGlmICghaGFzKFwianNvbi1zdHJpbmdpZnlcIikpIHtcbiAgICAgICAgLy8gSW50ZXJuYWw6IEEgbWFwIG9mIGNvbnRyb2wgY2hhcmFjdGVycyBhbmQgdGhlaXIgZXNjYXBlZCBlcXVpdmFsZW50cy5cbiAgICAgICAgdmFyIEVzY2FwZXMgPSB7XG4gICAgICAgICAgOTI6IFwiXFxcXFxcXFxcIixcbiAgICAgICAgICAzNDogJ1xcXFxcIicsXG4gICAgICAgICAgODogXCJcXFxcYlwiLFxuICAgICAgICAgIDEyOiBcIlxcXFxmXCIsXG4gICAgICAgICAgMTA6IFwiXFxcXG5cIixcbiAgICAgICAgICAxMzogXCJcXFxcclwiLFxuICAgICAgICAgIDk6IFwiXFxcXHRcIlxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIEludGVybmFsOiBDb252ZXJ0cyBgdmFsdWVgIGludG8gYSB6ZXJvLXBhZGRlZCBzdHJpbmcgc3VjaCB0aGF0IGl0c1xuICAgICAgICAvLyBsZW5ndGggaXMgYXQgbGVhc3QgZXF1YWwgdG8gYHdpZHRoYC4gVGhlIGB3aWR0aGAgbXVzdCBiZSA8PSA2LlxuICAgICAgICB2YXIgbGVhZGluZ1plcm9lcyA9IFwiMDAwMDAwXCI7XG4gICAgICAgIHZhciB0b1BhZGRlZFN0cmluZyA9IGZ1bmN0aW9uICh3aWR0aCwgdmFsdWUpIHtcbiAgICAgICAgICAvLyBUaGUgYHx8IDBgIGV4cHJlc3Npb24gaXMgbmVjZXNzYXJ5IHRvIHdvcmsgYXJvdW5kIGEgYnVnIGluXG4gICAgICAgICAgLy8gT3BlcmEgPD0gNy41NHUyIHdoZXJlIGAwID09IC0wYCwgYnV0IGBTdHJpbmcoLTApICE9PSBcIjBcImAuXG4gICAgICAgICAgcmV0dXJuIChsZWFkaW5nWmVyb2VzICsgKHZhbHVlIHx8IDApKS5zbGljZSgtd2lkdGgpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIEludGVybmFsOiBEb3VibGUtcXVvdGVzIGEgc3RyaW5nIGB2YWx1ZWAsIHJlcGxhY2luZyBhbGwgQVNDSUkgY29udHJvbFxuICAgICAgICAvLyBjaGFyYWN0ZXJzIChjaGFyYWN0ZXJzIHdpdGggY29kZSB1bml0IHZhbHVlcyBiZXR3ZWVuIDAgYW5kIDMxKSB3aXRoXG4gICAgICAgIC8vIHRoZWlyIGVzY2FwZWQgZXF1aXZhbGVudHMuIFRoaXMgaXMgYW4gaW1wbGVtZW50YXRpb24gb2YgdGhlXG4gICAgICAgIC8vIGBRdW90ZSh2YWx1ZSlgIG9wZXJhdGlvbiBkZWZpbmVkIGluIEVTIDUuMSBzZWN0aW9uIDE1LjEyLjMuXG4gICAgICAgIHZhciB1bmljb2RlUHJlZml4ID0gXCJcXFxcdTAwXCI7XG4gICAgICAgIHZhciBxdW90ZSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgIHZhciByZXN1bHQgPSAnXCInLCBpbmRleCA9IDAsIGxlbmd0aCA9IHZhbHVlLmxlbmd0aCwgdXNlQ2hhckluZGV4ID0gIWNoYXJJbmRleEJ1Z2d5IHx8IGxlbmd0aCA+IDEwO1xuICAgICAgICAgIHZhciBzeW1ib2xzID0gdXNlQ2hhckluZGV4ICYmIChjaGFySW5kZXhCdWdneSA/IHZhbHVlLnNwbGl0KFwiXCIpIDogdmFsdWUpO1xuICAgICAgICAgIGZvciAoOyBpbmRleCA8IGxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICAgICAgdmFyIGNoYXJDb2RlID0gdmFsdWUuY2hhckNvZGVBdChpbmRleCk7XG4gICAgICAgICAgICAvLyBJZiB0aGUgY2hhcmFjdGVyIGlzIGEgY29udHJvbCBjaGFyYWN0ZXIsIGFwcGVuZCBpdHMgVW5pY29kZSBvclxuICAgICAgICAgICAgLy8gc2hvcnRoYW5kIGVzY2FwZSBzZXF1ZW5jZTsgb3RoZXJ3aXNlLCBhcHBlbmQgdGhlIGNoYXJhY3RlciBhcy1pcy5cbiAgICAgICAgICAgIHN3aXRjaCAoY2hhckNvZGUpIHtcbiAgICAgICAgICAgICAgY2FzZSA4OiBjYXNlIDk6IGNhc2UgMTA6IGNhc2UgMTI6IGNhc2UgMTM6IGNhc2UgMzQ6IGNhc2UgOTI6XG4gICAgICAgICAgICAgICAgcmVzdWx0ICs9IEVzY2FwZXNbY2hhckNvZGVdO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIGlmIChjaGFyQ29kZSA8IDMyKSB7XG4gICAgICAgICAgICAgICAgICByZXN1bHQgKz0gdW5pY29kZVByZWZpeCArIHRvUGFkZGVkU3RyaW5nKDIsIGNoYXJDb2RlLnRvU3RyaW5nKDE2KSk7XG4gICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmVzdWx0ICs9IHVzZUNoYXJJbmRleCA/IHN5bWJvbHNbaW5kZXhdIDogdmFsdWUuY2hhckF0KGluZGV4KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHJlc3VsdCArICdcIic7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gSW50ZXJuYWw6IFJlY3Vyc2l2ZWx5IHNlcmlhbGl6ZXMgYW4gb2JqZWN0LiBJbXBsZW1lbnRzIHRoZVxuICAgICAgICAvLyBgU3RyKGtleSwgaG9sZGVyKWAsIGBKTyh2YWx1ZSlgLCBhbmQgYEpBKHZhbHVlKWAgb3BlcmF0aW9ucy5cbiAgICAgICAgdmFyIHNlcmlhbGl6ZSA9IGZ1bmN0aW9uIChwcm9wZXJ0eSwgb2JqZWN0LCBjYWxsYmFjaywgcHJvcGVydGllcywgd2hpdGVzcGFjZSwgaW5kZW50YXRpb24sIHN0YWNrKSB7XG4gICAgICAgICAgdmFyIHZhbHVlLCBjbGFzc05hbWUsIHllYXIsIG1vbnRoLCBkYXRlLCB0aW1lLCBob3VycywgbWludXRlcywgc2Vjb25kcywgbWlsbGlzZWNvbmRzLCByZXN1bHRzLCBlbGVtZW50LCBpbmRleCwgbGVuZ3RoLCBwcmVmaXgsIHJlc3VsdDtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gTmVjZXNzYXJ5IGZvciBob3N0IG9iamVjdCBzdXBwb3J0LlxuICAgICAgICAgICAgdmFsdWUgPSBvYmplY3RbcHJvcGVydHldO1xuICAgICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge31cbiAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09IFwib2JqZWN0XCIgJiYgdmFsdWUpIHtcbiAgICAgICAgICAgIGNsYXNzTmFtZSA9IGdldENsYXNzLmNhbGwodmFsdWUpO1xuICAgICAgICAgICAgaWYgKGNsYXNzTmFtZSA9PSBkYXRlQ2xhc3MgJiYgIWlzUHJvcGVydHkuY2FsbCh2YWx1ZSwgXCJ0b0pTT05cIikpIHtcbiAgICAgICAgICAgICAgaWYgKHZhbHVlID4gLTEgLyAwICYmIHZhbHVlIDwgMSAvIDApIHtcbiAgICAgICAgICAgICAgICAvLyBEYXRlcyBhcmUgc2VyaWFsaXplZCBhY2NvcmRpbmcgdG8gdGhlIGBEYXRlI3RvSlNPTmAgbWV0aG9kXG4gICAgICAgICAgICAgICAgLy8gc3BlY2lmaWVkIGluIEVTIDUuMSBzZWN0aW9uIDE1LjkuNS40NC4gU2VlIHNlY3Rpb24gMTUuOS4xLjE1XG4gICAgICAgICAgICAgICAgLy8gZm9yIHRoZSBJU08gODYwMSBkYXRlIHRpbWUgc3RyaW5nIGZvcm1hdC5cbiAgICAgICAgICAgICAgICBpZiAoZ2V0RGF5KSB7XG4gICAgICAgICAgICAgICAgICAvLyBNYW51YWxseSBjb21wdXRlIHRoZSB5ZWFyLCBtb250aCwgZGF0ZSwgaG91cnMsIG1pbnV0ZXMsXG4gICAgICAgICAgICAgICAgICAvLyBzZWNvbmRzLCBhbmQgbWlsbGlzZWNvbmRzIGlmIHRoZSBgZ2V0VVRDKmAgbWV0aG9kcyBhcmVcbiAgICAgICAgICAgICAgICAgIC8vIGJ1Z2d5LiBBZGFwdGVkIGZyb20gQFlhZmZsZSdzIGBkYXRlLXNoaW1gIHByb2plY3QuXG4gICAgICAgICAgICAgICAgICBkYXRlID0gZmxvb3IodmFsdWUgLyA4NjRlNSk7XG4gICAgICAgICAgICAgICAgICBmb3IgKHllYXIgPSBmbG9vcihkYXRlIC8gMzY1LjI0MjUpICsgMTk3MCAtIDE7IGdldERheSh5ZWFyICsgMSwgMCkgPD0gZGF0ZTsgeWVhcisrKTtcbiAgICAgICAgICAgICAgICAgIGZvciAobW9udGggPSBmbG9vcigoZGF0ZSAtIGdldERheSh5ZWFyLCAwKSkgLyAzMC40Mik7IGdldERheSh5ZWFyLCBtb250aCArIDEpIDw9IGRhdGU7IG1vbnRoKyspO1xuICAgICAgICAgICAgICAgICAgZGF0ZSA9IDEgKyBkYXRlIC0gZ2V0RGF5KHllYXIsIG1vbnRoKTtcbiAgICAgICAgICAgICAgICAgIC8vIFRoZSBgdGltZWAgdmFsdWUgc3BlY2lmaWVzIHRoZSB0aW1lIHdpdGhpbiB0aGUgZGF5IChzZWUgRVNcbiAgICAgICAgICAgICAgICAgIC8vIDUuMSBzZWN0aW9uIDE1LjkuMS4yKS4gVGhlIGZvcm11bGEgYChBICUgQiArIEIpICUgQmAgaXMgdXNlZFxuICAgICAgICAgICAgICAgICAgLy8gdG8gY29tcHV0ZSBgQSBtb2R1bG8gQmAsIGFzIHRoZSBgJWAgb3BlcmF0b3IgZG9lcyBub3RcbiAgICAgICAgICAgICAgICAgIC8vIGNvcnJlc3BvbmQgdG8gdGhlIGBtb2R1bG9gIG9wZXJhdGlvbiBmb3IgbmVnYXRpdmUgbnVtYmVycy5cbiAgICAgICAgICAgICAgICAgIHRpbWUgPSAodmFsdWUgJSA4NjRlNSArIDg2NGU1KSAlIDg2NGU1O1xuICAgICAgICAgICAgICAgICAgLy8gVGhlIGhvdXJzLCBtaW51dGVzLCBzZWNvbmRzLCBhbmQgbWlsbGlzZWNvbmRzIGFyZSBvYnRhaW5lZCBieVxuICAgICAgICAgICAgICAgICAgLy8gZGVjb21wb3NpbmcgdGhlIHRpbWUgd2l0aGluIHRoZSBkYXkuIFNlZSBzZWN0aW9uIDE1LjkuMS4xMC5cbiAgICAgICAgICAgICAgICAgIGhvdXJzID0gZmxvb3IodGltZSAvIDM2ZTUpICUgMjQ7XG4gICAgICAgICAgICAgICAgICBtaW51dGVzID0gZmxvb3IodGltZSAvIDZlNCkgJSA2MDtcbiAgICAgICAgICAgICAgICAgIHNlY29uZHMgPSBmbG9vcih0aW1lIC8gMWUzKSAlIDYwO1xuICAgICAgICAgICAgICAgICAgbWlsbGlzZWNvbmRzID0gdGltZSAlIDFlMztcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgeWVhciA9IHZhbHVlLmdldFVUQ0Z1bGxZZWFyKCk7XG4gICAgICAgICAgICAgICAgICBtb250aCA9IHZhbHVlLmdldFVUQ01vbnRoKCk7XG4gICAgICAgICAgICAgICAgICBkYXRlID0gdmFsdWUuZ2V0VVRDRGF0ZSgpO1xuICAgICAgICAgICAgICAgICAgaG91cnMgPSB2YWx1ZS5nZXRVVENIb3VycygpO1xuICAgICAgICAgICAgICAgICAgbWludXRlcyA9IHZhbHVlLmdldFVUQ01pbnV0ZXMoKTtcbiAgICAgICAgICAgICAgICAgIHNlY29uZHMgPSB2YWx1ZS5nZXRVVENTZWNvbmRzKCk7XG4gICAgICAgICAgICAgICAgICBtaWxsaXNlY29uZHMgPSB2YWx1ZS5nZXRVVENNaWxsaXNlY29uZHMoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gU2VyaWFsaXplIGV4dGVuZGVkIHllYXJzIGNvcnJlY3RseS5cbiAgICAgICAgICAgICAgICB2YWx1ZSA9ICh5ZWFyIDw9IDAgfHwgeWVhciA+PSAxZTQgPyAoeWVhciA8IDAgPyBcIi1cIiA6IFwiK1wiKSArIHRvUGFkZGVkU3RyaW5nKDYsIHllYXIgPCAwID8gLXllYXIgOiB5ZWFyKSA6IHRvUGFkZGVkU3RyaW5nKDQsIHllYXIpKSArXG4gICAgICAgICAgICAgICAgICBcIi1cIiArIHRvUGFkZGVkU3RyaW5nKDIsIG1vbnRoICsgMSkgKyBcIi1cIiArIHRvUGFkZGVkU3RyaW5nKDIsIGRhdGUpICtcbiAgICAgICAgICAgICAgICAgIC8vIE1vbnRocywgZGF0ZXMsIGhvdXJzLCBtaW51dGVzLCBhbmQgc2Vjb25kcyBzaG91bGQgaGF2ZSB0d29cbiAgICAgICAgICAgICAgICAgIC8vIGRpZ2l0czsgbWlsbGlzZWNvbmRzIHNob3VsZCBoYXZlIHRocmVlLlxuICAgICAgICAgICAgICAgICAgXCJUXCIgKyB0b1BhZGRlZFN0cmluZygyLCBob3VycykgKyBcIjpcIiArIHRvUGFkZGVkU3RyaW5nKDIsIG1pbnV0ZXMpICsgXCI6XCIgKyB0b1BhZGRlZFN0cmluZygyLCBzZWNvbmRzKSArXG4gICAgICAgICAgICAgICAgICAvLyBNaWxsaXNlY29uZHMgYXJlIG9wdGlvbmFsIGluIEVTIDUuMCwgYnV0IHJlcXVpcmVkIGluIDUuMS5cbiAgICAgICAgICAgICAgICAgIFwiLlwiICsgdG9QYWRkZWRTdHJpbmcoMywgbWlsbGlzZWNvbmRzKSArIFwiWlwiO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gbnVsbDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdmFsdWUudG9KU09OID09IFwiZnVuY3Rpb25cIiAmJiAoKGNsYXNzTmFtZSAhPSBudW1iZXJDbGFzcyAmJiBjbGFzc05hbWUgIT0gc3RyaW5nQ2xhc3MgJiYgY2xhc3NOYW1lICE9IGFycmF5Q2xhc3MpIHx8IGlzUHJvcGVydHkuY2FsbCh2YWx1ZSwgXCJ0b0pTT05cIikpKSB7XG4gICAgICAgICAgICAgIC8vIFByb3RvdHlwZSA8PSAxLjYuMSBhZGRzIG5vbi1zdGFuZGFyZCBgdG9KU09OYCBtZXRob2RzIHRvIHRoZVxuICAgICAgICAgICAgICAvLyBgTnVtYmVyYCwgYFN0cmluZ2AsIGBEYXRlYCwgYW5kIGBBcnJheWAgcHJvdG90eXBlcy4gSlNPTiAzXG4gICAgICAgICAgICAgIC8vIGlnbm9yZXMgYWxsIGB0b0pTT05gIG1ldGhvZHMgb24gdGhlc2Ugb2JqZWN0cyB1bmxlc3MgdGhleSBhcmVcbiAgICAgICAgICAgICAgLy8gZGVmaW5lZCBkaXJlY3RseSBvbiBhbiBpbnN0YW5jZS5cbiAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS50b0pTT04ocHJvcGVydHkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgIC8vIElmIGEgcmVwbGFjZW1lbnQgZnVuY3Rpb24gd2FzIHByb3ZpZGVkLCBjYWxsIGl0IHRvIG9idGFpbiB0aGUgdmFsdWVcbiAgICAgICAgICAgIC8vIGZvciBzZXJpYWxpemF0aW9uLlxuICAgICAgICAgICAgdmFsdWUgPSBjYWxsYmFjay5jYWxsKG9iamVjdCwgcHJvcGVydHksIHZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHZhbHVlID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJudWxsXCI7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNsYXNzTmFtZSA9IGdldENsYXNzLmNhbGwodmFsdWUpO1xuICAgICAgICAgIGlmIChjbGFzc05hbWUgPT0gYm9vbGVhbkNsYXNzKSB7XG4gICAgICAgICAgICAvLyBCb29sZWFucyBhcmUgcmVwcmVzZW50ZWQgbGl0ZXJhbGx5LlxuICAgICAgICAgICAgcmV0dXJuIFwiXCIgKyB2YWx1ZTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGNsYXNzTmFtZSA9PSBudW1iZXJDbGFzcykge1xuICAgICAgICAgICAgLy8gSlNPTiBudW1iZXJzIG11c3QgYmUgZmluaXRlLiBgSW5maW5pdHlgIGFuZCBgTmFOYCBhcmUgc2VyaWFsaXplZCBhc1xuICAgICAgICAgICAgLy8gYFwibnVsbFwiYC5cbiAgICAgICAgICAgIHJldHVybiB2YWx1ZSA+IC0xIC8gMCAmJiB2YWx1ZSA8IDEgLyAwID8gXCJcIiArIHZhbHVlIDogXCJudWxsXCI7XG4gICAgICAgICAgfSBlbHNlIGlmIChjbGFzc05hbWUgPT0gc3RyaW5nQ2xhc3MpIHtcbiAgICAgICAgICAgIC8vIFN0cmluZ3MgYXJlIGRvdWJsZS1xdW90ZWQgYW5kIGVzY2FwZWQuXG4gICAgICAgICAgICByZXR1cm4gcXVvdGUoXCJcIiArIHZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gUmVjdXJzaXZlbHkgc2VyaWFsaXplIG9iamVjdHMgYW5kIGFycmF5cy5cbiAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgIC8vIENoZWNrIGZvciBjeWNsaWMgc3RydWN0dXJlcy4gVGhpcyBpcyBhIGxpbmVhciBzZWFyY2g7IHBlcmZvcm1hbmNlXG4gICAgICAgICAgICAvLyBpcyBpbnZlcnNlbHkgcHJvcG9ydGlvbmFsIHRvIHRoZSBudW1iZXIgb2YgdW5pcXVlIG5lc3RlZCBvYmplY3RzLlxuICAgICAgICAgICAgZm9yIChsZW5ndGggPSBzdGFjay5sZW5ndGg7IGxlbmd0aC0tOykge1xuICAgICAgICAgICAgICBpZiAoc3RhY2tbbGVuZ3RoXSA9PT0gdmFsdWUpIHtcbiAgICAgICAgICAgICAgICAvLyBDeWNsaWMgc3RydWN0dXJlcyBjYW5ub3QgYmUgc2VyaWFsaXplZCBieSBgSlNPTi5zdHJpbmdpZnlgLlxuICAgICAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcigpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBBZGQgdGhlIG9iamVjdCB0byB0aGUgc3RhY2sgb2YgdHJhdmVyc2VkIG9iamVjdHMuXG4gICAgICAgICAgICBzdGFjay5wdXNoKHZhbHVlKTtcbiAgICAgICAgICAgIHJlc3VsdHMgPSBbXTtcbiAgICAgICAgICAgIC8vIFNhdmUgdGhlIGN1cnJlbnQgaW5kZW50YXRpb24gbGV2ZWwgYW5kIGluZGVudCBvbmUgYWRkaXRpb25hbCBsZXZlbC5cbiAgICAgICAgICAgIHByZWZpeCA9IGluZGVudGF0aW9uO1xuICAgICAgICAgICAgaW5kZW50YXRpb24gKz0gd2hpdGVzcGFjZTtcbiAgICAgICAgICAgIGlmIChjbGFzc05hbWUgPT0gYXJyYXlDbGFzcykge1xuICAgICAgICAgICAgICAvLyBSZWN1cnNpdmVseSBzZXJpYWxpemUgYXJyYXkgZWxlbWVudHMuXG4gICAgICAgICAgICAgIGZvciAoaW5kZXggPSAwLCBsZW5ndGggPSB2YWx1ZS5sZW5ndGg7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgICAgICAgICAgZWxlbWVudCA9IHNlcmlhbGl6ZShpbmRleCwgdmFsdWUsIGNhbGxiYWNrLCBwcm9wZXJ0aWVzLCB3aGl0ZXNwYWNlLCBpbmRlbnRhdGlvbiwgc3RhY2spO1xuICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChlbGVtZW50ID09PSB1bmRlZiA/IFwibnVsbFwiIDogZWxlbWVudCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0cy5sZW5ndGggPyAod2hpdGVzcGFjZSA/IFwiW1xcblwiICsgaW5kZW50YXRpb24gKyByZXN1bHRzLmpvaW4oXCIsXFxuXCIgKyBpbmRlbnRhdGlvbikgKyBcIlxcblwiICsgcHJlZml4ICsgXCJdXCIgOiAoXCJbXCIgKyByZXN1bHRzLmpvaW4oXCIsXCIpICsgXCJdXCIpKSA6IFwiW11cIjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIC8vIFJlY3Vyc2l2ZWx5IHNlcmlhbGl6ZSBvYmplY3QgbWVtYmVycy4gTWVtYmVycyBhcmUgc2VsZWN0ZWQgZnJvbVxuICAgICAgICAgICAgICAvLyBlaXRoZXIgYSB1c2VyLXNwZWNpZmllZCBsaXN0IG9mIHByb3BlcnR5IG5hbWVzLCBvciB0aGUgb2JqZWN0XG4gICAgICAgICAgICAgIC8vIGl0c2VsZi5cbiAgICAgICAgICAgICAgZm9yRWFjaChwcm9wZXJ0aWVzIHx8IHZhbHVlLCBmdW5jdGlvbiAocHJvcGVydHkpIHtcbiAgICAgICAgICAgICAgICB2YXIgZWxlbWVudCA9IHNlcmlhbGl6ZShwcm9wZXJ0eSwgdmFsdWUsIGNhbGxiYWNrLCBwcm9wZXJ0aWVzLCB3aGl0ZXNwYWNlLCBpbmRlbnRhdGlvbiwgc3RhY2spO1xuICAgICAgICAgICAgICAgIGlmIChlbGVtZW50ICE9PSB1bmRlZikge1xuICAgICAgICAgICAgICAgICAgLy8gQWNjb3JkaW5nIHRvIEVTIDUuMSBzZWN0aW9uIDE1LjEyLjM6IFwiSWYgYGdhcGAge3doaXRlc3BhY2V9XG4gICAgICAgICAgICAgICAgICAvLyBpcyBub3QgdGhlIGVtcHR5IHN0cmluZywgbGV0IGBtZW1iZXJgIHtxdW90ZShwcm9wZXJ0eSkgKyBcIjpcIn1cbiAgICAgICAgICAgICAgICAgIC8vIGJlIHRoZSBjb25jYXRlbmF0aW9uIG9mIGBtZW1iZXJgIGFuZCB0aGUgYHNwYWNlYCBjaGFyYWN0ZXIuXCJcbiAgICAgICAgICAgICAgICAgIC8vIFRoZSBcImBzcGFjZWAgY2hhcmFjdGVyXCIgcmVmZXJzIHRvIHRoZSBsaXRlcmFsIHNwYWNlXG4gICAgICAgICAgICAgICAgICAvLyBjaGFyYWN0ZXIsIG5vdCB0aGUgYHNwYWNlYCB7d2lkdGh9IGFyZ3VtZW50IHByb3ZpZGVkIHRvXG4gICAgICAgICAgICAgICAgICAvLyBgSlNPTi5zdHJpbmdpZnlgLlxuICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHF1b3RlKHByb3BlcnR5KSArIFwiOlwiICsgKHdoaXRlc3BhY2UgPyBcIiBcIiA6IFwiXCIpICsgZWxlbWVudCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0cy5sZW5ndGggPyAod2hpdGVzcGFjZSA/IFwie1xcblwiICsgaW5kZW50YXRpb24gKyByZXN1bHRzLmpvaW4oXCIsXFxuXCIgKyBpbmRlbnRhdGlvbikgKyBcIlxcblwiICsgcHJlZml4ICsgXCJ9XCIgOiAoXCJ7XCIgKyByZXN1bHRzLmpvaW4oXCIsXCIpICsgXCJ9XCIpKSA6IFwie31cIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIFJlbW92ZSB0aGUgb2JqZWN0IGZyb20gdGhlIHRyYXZlcnNlZCBvYmplY3Qgc3RhY2suXG4gICAgICAgICAgICBzdGFjay5wb3AoKTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIFB1YmxpYzogYEpTT04uc3RyaW5naWZ5YC4gU2VlIEVTIDUuMSBzZWN0aW9uIDE1LjEyLjMuXG4gICAgICAgIGV4cG9ydHMuc3RyaW5naWZ5ID0gZnVuY3Rpb24gKHNvdXJjZSwgZmlsdGVyLCB3aWR0aCkge1xuICAgICAgICAgIHZhciB3aGl0ZXNwYWNlLCBjYWxsYmFjaywgcHJvcGVydGllcywgY2xhc3NOYW1lO1xuICAgICAgICAgIGlmICh0eXBlb2YgZmlsdGVyID09IFwiZnVuY3Rpb25cIiB8fCB0eXBlb2YgZmlsdGVyID09IFwib2JqZWN0XCIgJiYgZmlsdGVyKSB7XG4gICAgICAgICAgICBpZiAoKGNsYXNzTmFtZSA9IGdldENsYXNzLmNhbGwoZmlsdGVyKSkgPT0gZnVuY3Rpb25DbGFzcykge1xuICAgICAgICAgICAgICBjYWxsYmFjayA9IGZpbHRlcjtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY2xhc3NOYW1lID09IGFycmF5Q2xhc3MpIHtcbiAgICAgICAgICAgICAgLy8gQ29udmVydCB0aGUgcHJvcGVydHkgbmFtZXMgYXJyYXkgaW50byBhIG1ha2VzaGlmdCBzZXQuXG4gICAgICAgICAgICAgIHByb3BlcnRpZXMgPSB7fTtcbiAgICAgICAgICAgICAgZm9yICh2YXIgaW5kZXggPSAwLCBsZW5ndGggPSBmaWx0ZXIubGVuZ3RoLCB2YWx1ZTsgaW5kZXggPCBsZW5ndGg7IHZhbHVlID0gZmlsdGVyW2luZGV4KytdLCAoKGNsYXNzTmFtZSA9IGdldENsYXNzLmNhbGwodmFsdWUpKSwgY2xhc3NOYW1lID09IHN0cmluZ0NsYXNzIHx8IGNsYXNzTmFtZSA9PSBudW1iZXJDbGFzcykgJiYgKHByb3BlcnRpZXNbdmFsdWVdID0gMSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAod2lkdGgpIHtcbiAgICAgICAgICAgIGlmICgoY2xhc3NOYW1lID0gZ2V0Q2xhc3MuY2FsbCh3aWR0aCkpID09IG51bWJlckNsYXNzKSB7XG4gICAgICAgICAgICAgIC8vIENvbnZlcnQgdGhlIGB3aWR0aGAgdG8gYW4gaW50ZWdlciBhbmQgY3JlYXRlIGEgc3RyaW5nIGNvbnRhaW5pbmdcbiAgICAgICAgICAgICAgLy8gYHdpZHRoYCBudW1iZXIgb2Ygc3BhY2UgY2hhcmFjdGVycy5cbiAgICAgICAgICAgICAgaWYgKCh3aWR0aCAtPSB3aWR0aCAlIDEpID4gMCkge1xuICAgICAgICAgICAgICAgIGZvciAod2hpdGVzcGFjZSA9IFwiXCIsIHdpZHRoID4gMTAgJiYgKHdpZHRoID0gMTApOyB3aGl0ZXNwYWNlLmxlbmd0aCA8IHdpZHRoOyB3aGl0ZXNwYWNlICs9IFwiIFwiKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChjbGFzc05hbWUgPT0gc3RyaW5nQ2xhc3MpIHtcbiAgICAgICAgICAgICAgd2hpdGVzcGFjZSA9IHdpZHRoLmxlbmd0aCA8PSAxMCA/IHdpZHRoIDogd2lkdGguc2xpY2UoMCwgMTApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBPcGVyYSA8PSA3LjU0dTIgZGlzY2FyZHMgdGhlIHZhbHVlcyBhc3NvY2lhdGVkIHdpdGggZW1wdHkgc3RyaW5nIGtleXNcbiAgICAgICAgICAvLyAoYFwiXCJgKSBvbmx5IGlmIHRoZXkgYXJlIHVzZWQgZGlyZWN0bHkgd2l0aGluIGFuIG9iamVjdCBtZW1iZXIgbGlzdFxuICAgICAgICAgIC8vIChlLmcuLCBgIShcIlwiIGluIHsgXCJcIjogMX0pYCkuXG4gICAgICAgICAgcmV0dXJuIHNlcmlhbGl6ZShcIlwiLCAodmFsdWUgPSB7fSwgdmFsdWVbXCJcIl0gPSBzb3VyY2UsIHZhbHVlKSwgY2FsbGJhY2ssIHByb3BlcnRpZXMsIHdoaXRlc3BhY2UsIFwiXCIsIFtdKTtcbiAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgLy8gUHVibGljOiBQYXJzZXMgYSBKU09OIHNvdXJjZSBzdHJpbmcuXG4gICAgICBpZiAoIWhhcyhcImpzb24tcGFyc2VcIikpIHtcbiAgICAgICAgdmFyIGZyb21DaGFyQ29kZSA9IFN0cmluZy5mcm9tQ2hhckNvZGU7XG5cbiAgICAgICAgLy8gSW50ZXJuYWw6IEEgbWFwIG9mIGVzY2FwZWQgY29udHJvbCBjaGFyYWN0ZXJzIGFuZCB0aGVpciB1bmVzY2FwZWRcbiAgICAgICAgLy8gZXF1aXZhbGVudHMuXG4gICAgICAgIHZhciBVbmVzY2FwZXMgPSB7XG4gICAgICAgICAgOTI6IFwiXFxcXFwiLFxuICAgICAgICAgIDM0OiAnXCInLFxuICAgICAgICAgIDQ3OiBcIi9cIixcbiAgICAgICAgICA5ODogXCJcXGJcIixcbiAgICAgICAgICAxMTY6IFwiXFx0XCIsXG4gICAgICAgICAgMTEwOiBcIlxcblwiLFxuICAgICAgICAgIDEwMjogXCJcXGZcIixcbiAgICAgICAgICAxMTQ6IFwiXFxyXCJcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBJbnRlcm5hbDogU3RvcmVzIHRoZSBwYXJzZXIgc3RhdGUuXG4gICAgICAgIHZhciBJbmRleCwgU291cmNlO1xuXG4gICAgICAgIC8vIEludGVybmFsOiBSZXNldHMgdGhlIHBhcnNlciBzdGF0ZSBhbmQgdGhyb3dzIGEgYFN5bnRheEVycm9yYC5cbiAgICAgICAgdmFyIGFib3J0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgIEluZGV4ID0gU291cmNlID0gbnVsbDtcbiAgICAgICAgICB0aHJvdyBTeW50YXhFcnJvcigpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIEludGVybmFsOiBSZXR1cm5zIHRoZSBuZXh0IHRva2VuLCBvciBgXCIkXCJgIGlmIHRoZSBwYXJzZXIgaGFzIHJlYWNoZWRcbiAgICAgICAgLy8gdGhlIGVuZCBvZiB0aGUgc291cmNlIHN0cmluZy4gQSB0b2tlbiBtYXkgYmUgYSBzdHJpbmcsIG51bWJlciwgYG51bGxgXG4gICAgICAgIC8vIGxpdGVyYWwsIG9yIEJvb2xlYW4gbGl0ZXJhbC5cbiAgICAgICAgdmFyIGxleCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICB2YXIgc291cmNlID0gU291cmNlLCBsZW5ndGggPSBzb3VyY2UubGVuZ3RoLCB2YWx1ZSwgYmVnaW4sIHBvc2l0aW9uLCBpc1NpZ25lZCwgY2hhckNvZGU7XG4gICAgICAgICAgd2hpbGUgKEluZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgICAgICBjaGFyQ29kZSA9IHNvdXJjZS5jaGFyQ29kZUF0KEluZGV4KTtcbiAgICAgICAgICAgIHN3aXRjaCAoY2hhckNvZGUpIHtcbiAgICAgICAgICAgICAgY2FzZSA5OiBjYXNlIDEwOiBjYXNlIDEzOiBjYXNlIDMyOlxuICAgICAgICAgICAgICAgIC8vIFNraXAgd2hpdGVzcGFjZSB0b2tlbnMsIGluY2x1ZGluZyB0YWJzLCBjYXJyaWFnZSByZXR1cm5zLCBsaW5lXG4gICAgICAgICAgICAgICAgLy8gZmVlZHMsIGFuZCBzcGFjZSBjaGFyYWN0ZXJzLlxuICAgICAgICAgICAgICAgIEluZGV4Kys7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgMTIzOiBjYXNlIDEyNTogY2FzZSA5MTogY2FzZSA5MzogY2FzZSA1ODogY2FzZSA0NDpcbiAgICAgICAgICAgICAgICAvLyBQYXJzZSBhIHB1bmN0dWF0b3IgdG9rZW4gKGB7YCwgYH1gLCBgW2AsIGBdYCwgYDpgLCBvciBgLGApIGF0XG4gICAgICAgICAgICAgICAgLy8gdGhlIGN1cnJlbnQgcG9zaXRpb24uXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBjaGFySW5kZXhCdWdneSA/IHNvdXJjZS5jaGFyQXQoSW5kZXgpIDogc291cmNlW0luZGV4XTtcbiAgICAgICAgICAgICAgICBJbmRleCsrO1xuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgICAgICAgY2FzZSAzNDpcbiAgICAgICAgICAgICAgICAvLyBgXCJgIGRlbGltaXRzIGEgSlNPTiBzdHJpbmc7IGFkdmFuY2UgdG8gdGhlIG5leHQgY2hhcmFjdGVyIGFuZFxuICAgICAgICAgICAgICAgIC8vIGJlZ2luIHBhcnNpbmcgdGhlIHN0cmluZy4gU3RyaW5nIHRva2VucyBhcmUgcHJlZml4ZWQgd2l0aCB0aGVcbiAgICAgICAgICAgICAgICAvLyBzZW50aW5lbCBgQGAgY2hhcmFjdGVyIHRvIGRpc3Rpbmd1aXNoIHRoZW0gZnJvbSBwdW5jdHVhdG9ycyBhbmRcbiAgICAgICAgICAgICAgICAvLyBlbmQtb2Ytc3RyaW5nIHRva2Vucy5cbiAgICAgICAgICAgICAgICBmb3IgKHZhbHVlID0gXCJAXCIsIEluZGV4Kys7IEluZGV4IDwgbGVuZ3RoOykge1xuICAgICAgICAgICAgICAgICAgY2hhckNvZGUgPSBzb3VyY2UuY2hhckNvZGVBdChJbmRleCk7XG4gICAgICAgICAgICAgICAgICBpZiAoY2hhckNvZGUgPCAzMikge1xuICAgICAgICAgICAgICAgICAgICAvLyBVbmVzY2FwZWQgQVNDSUkgY29udHJvbCBjaGFyYWN0ZXJzICh0aG9zZSB3aXRoIGEgY29kZSB1bml0XG4gICAgICAgICAgICAgICAgICAgIC8vIGxlc3MgdGhhbiB0aGUgc3BhY2UgY2hhcmFjdGVyKSBhcmUgbm90IHBlcm1pdHRlZC5cbiAgICAgICAgICAgICAgICAgICAgYWJvcnQoKTtcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY2hhckNvZGUgPT0gOTIpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQSByZXZlcnNlIHNvbGlkdXMgKGBcXGApIG1hcmtzIHRoZSBiZWdpbm5pbmcgb2YgYW4gZXNjYXBlZFxuICAgICAgICAgICAgICAgICAgICAvLyBjb250cm9sIGNoYXJhY3RlciAoaW5jbHVkaW5nIGBcImAsIGBcXGAsIGFuZCBgL2ApIG9yIFVuaWNvZGVcbiAgICAgICAgICAgICAgICAgICAgLy8gZXNjYXBlIHNlcXVlbmNlLlxuICAgICAgICAgICAgICAgICAgICBjaGFyQ29kZSA9IHNvdXJjZS5jaGFyQ29kZUF0KCsrSW5kZXgpO1xuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKGNoYXJDb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgY2FzZSA5MjogY2FzZSAzNDogY2FzZSA0NzogY2FzZSA5ODogY2FzZSAxMTY6IGNhc2UgMTEwOiBjYXNlIDEwMjogY2FzZSAxMTQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBSZXZpdmUgZXNjYXBlZCBjb250cm9sIGNoYXJhY3RlcnMuXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSArPSBVbmVzY2FwZXNbY2hhckNvZGVdO1xuICAgICAgICAgICAgICAgICAgICAgICAgSW5kZXgrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgIGNhc2UgMTE3OlxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gYFxcdWAgbWFya3MgdGhlIGJlZ2lubmluZyBvZiBhIFVuaWNvZGUgZXNjYXBlIHNlcXVlbmNlLlxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWR2YW5jZSB0byB0aGUgZmlyc3QgY2hhcmFjdGVyIGFuZCB2YWxpZGF0ZSB0aGVcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGZvdXItZGlnaXQgY29kZSBwb2ludC5cbiAgICAgICAgICAgICAgICAgICAgICAgIGJlZ2luID0gKytJbmRleDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAocG9zaXRpb24gPSBJbmRleCArIDQ7IEluZGV4IDwgcG9zaXRpb247IEluZGV4KyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY2hhckNvZGUgPSBzb3VyY2UuY2hhckNvZGVBdChJbmRleCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEEgdmFsaWQgc2VxdWVuY2UgY29tcHJpc2VzIGZvdXIgaGV4ZGlnaXRzIChjYXNlLVxuICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpbnNlbnNpdGl2ZSkgdGhhdCBmb3JtIGEgc2luZ2xlIGhleGFkZWNpbWFsIHZhbHVlLlxuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIShjaGFyQ29kZSA+PSA0OCAmJiBjaGFyQ29kZSA8PSA1NyB8fCBjaGFyQ29kZSA+PSA5NyAmJiBjaGFyQ29kZSA8PSAxMDIgfHwgY2hhckNvZGUgPj0gNjUgJiYgY2hhckNvZGUgPD0gNzApKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSW52YWxpZCBVbmljb2RlIGVzY2FwZSBzZXF1ZW5jZS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhYm9ydCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBSZXZpdmUgdGhlIGVzY2FwZWQgY2hhcmFjdGVyLlxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgKz0gZnJvbUNoYXJDb2RlKFwiMHhcIiArIHNvdXJjZS5zbGljZShiZWdpbiwgSW5kZXgpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBJbnZhbGlkIGVzY2FwZSBzZXF1ZW5jZS5cbiAgICAgICAgICAgICAgICAgICAgICAgIGFib3J0KCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjaGFyQ29kZSA9PSAzNCkge1xuICAgICAgICAgICAgICAgICAgICAgIC8vIEFuIHVuZXNjYXBlZCBkb3VibGUtcXVvdGUgY2hhcmFjdGVyIG1hcmtzIHRoZSBlbmQgb2YgdGhlXG4gICAgICAgICAgICAgICAgICAgICAgLy8gc3RyaW5nLlxuICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNoYXJDb2RlID0gc291cmNlLmNoYXJDb2RlQXQoSW5kZXgpO1xuICAgICAgICAgICAgICAgICAgICBiZWdpbiA9IEluZGV4O1xuICAgICAgICAgICAgICAgICAgICAvLyBPcHRpbWl6ZSBmb3IgdGhlIGNvbW1vbiBjYXNlIHdoZXJlIGEgc3RyaW5nIGlzIHZhbGlkLlxuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoY2hhckNvZGUgPj0gMzIgJiYgY2hhckNvZGUgIT0gOTIgJiYgY2hhckNvZGUgIT0gMzQpIHtcbiAgICAgICAgICAgICAgICAgICAgICBjaGFyQ29kZSA9IHNvdXJjZS5jaGFyQ29kZUF0KCsrSW5kZXgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vIEFwcGVuZCB0aGUgc3RyaW5nIGFzLWlzLlxuICAgICAgICAgICAgICAgICAgICB2YWx1ZSArPSBzb3VyY2Uuc2xpY2UoYmVnaW4sIEluZGV4KTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHNvdXJjZS5jaGFyQ29kZUF0KEluZGV4KSA9PSAzNCkge1xuICAgICAgICAgICAgICAgICAgLy8gQWR2YW5jZSB0byB0aGUgbmV4dCBjaGFyYWN0ZXIgYW5kIHJldHVybiB0aGUgcmV2aXZlZCBzdHJpbmcuXG4gICAgICAgICAgICAgICAgICBJbmRleCsrO1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBVbnRlcm1pbmF0ZWQgc3RyaW5nLlxuICAgICAgICAgICAgICAgIGFib3J0KCk7XG4gICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgLy8gUGFyc2UgbnVtYmVycyBhbmQgbGl0ZXJhbHMuXG4gICAgICAgICAgICAgICAgYmVnaW4gPSBJbmRleDtcbiAgICAgICAgICAgICAgICAvLyBBZHZhbmNlIHBhc3QgdGhlIG5lZ2F0aXZlIHNpZ24sIGlmIG9uZSBpcyBzcGVjaWZpZWQuXG4gICAgICAgICAgICAgICAgaWYgKGNoYXJDb2RlID09IDQ1KSB7XG4gICAgICAgICAgICAgICAgICBpc1NpZ25lZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICBjaGFyQ29kZSA9IHNvdXJjZS5jaGFyQ29kZUF0KCsrSW5kZXgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBQYXJzZSBhbiBpbnRlZ2VyIG9yIGZsb2F0aW5nLXBvaW50IHZhbHVlLlxuICAgICAgICAgICAgICAgIGlmIChjaGFyQ29kZSA+PSA0OCAmJiBjaGFyQ29kZSA8PSA1Nykge1xuICAgICAgICAgICAgICAgICAgLy8gTGVhZGluZyB6ZXJvZXMgYXJlIGludGVycHJldGVkIGFzIG9jdGFsIGxpdGVyYWxzLlxuICAgICAgICAgICAgICAgICAgaWYgKGNoYXJDb2RlID09IDQ4ICYmICgoY2hhckNvZGUgPSBzb3VyY2UuY2hhckNvZGVBdChJbmRleCArIDEpKSwgY2hhckNvZGUgPj0gNDggJiYgY2hhckNvZGUgPD0gNTcpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIElsbGVnYWwgb2N0YWwgbGl0ZXJhbC5cbiAgICAgICAgICAgICAgICAgICAgYWJvcnQoKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIGlzU2lnbmVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAvLyBQYXJzZSB0aGUgaW50ZWdlciBjb21wb25lbnQuXG4gICAgICAgICAgICAgICAgICBmb3IgKDsgSW5kZXggPCBsZW5ndGggJiYgKChjaGFyQ29kZSA9IHNvdXJjZS5jaGFyQ29kZUF0KEluZGV4KSksIGNoYXJDb2RlID49IDQ4ICYmIGNoYXJDb2RlIDw9IDU3KTsgSW5kZXgrKyk7XG4gICAgICAgICAgICAgICAgICAvLyBGbG9hdHMgY2Fubm90IGNvbnRhaW4gYSBsZWFkaW5nIGRlY2ltYWwgcG9pbnQ7IGhvd2V2ZXIsIHRoaXNcbiAgICAgICAgICAgICAgICAgIC8vIGNhc2UgaXMgYWxyZWFkeSBhY2NvdW50ZWQgZm9yIGJ5IHRoZSBwYXJzZXIuXG4gICAgICAgICAgICAgICAgICBpZiAoc291cmNlLmNoYXJDb2RlQXQoSW5kZXgpID09IDQ2KSB7XG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uID0gKytJbmRleDtcbiAgICAgICAgICAgICAgICAgICAgLy8gUGFyc2UgdGhlIGRlY2ltYWwgY29tcG9uZW50LlxuICAgICAgICAgICAgICAgICAgICBmb3IgKDsgcG9zaXRpb24gPCBsZW5ndGggJiYgKChjaGFyQ29kZSA9IHNvdXJjZS5jaGFyQ29kZUF0KHBvc2l0aW9uKSksIGNoYXJDb2RlID49IDQ4ICYmIGNoYXJDb2RlIDw9IDU3KTsgcG9zaXRpb24rKyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwb3NpdGlvbiA9PSBJbmRleCkge1xuICAgICAgICAgICAgICAgICAgICAgIC8vIElsbGVnYWwgdHJhaWxpbmcgZGVjaW1hbC5cbiAgICAgICAgICAgICAgICAgICAgICBhYm9ydCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIEluZGV4ID0gcG9zaXRpb247XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAvLyBQYXJzZSBleHBvbmVudHMuIFRoZSBgZWAgZGVub3RpbmcgdGhlIGV4cG9uZW50IGlzXG4gICAgICAgICAgICAgICAgICAvLyBjYXNlLWluc2Vuc2l0aXZlLlxuICAgICAgICAgICAgICAgICAgY2hhckNvZGUgPSBzb3VyY2UuY2hhckNvZGVBdChJbmRleCk7XG4gICAgICAgICAgICAgICAgICBpZiAoY2hhckNvZGUgPT0gMTAxIHx8IGNoYXJDb2RlID09IDY5KSB7XG4gICAgICAgICAgICAgICAgICAgIGNoYXJDb2RlID0gc291cmNlLmNoYXJDb2RlQXQoKytJbmRleCk7XG4gICAgICAgICAgICAgICAgICAgIC8vIFNraXAgcGFzdCB0aGUgc2lnbiBmb2xsb3dpbmcgdGhlIGV4cG9uZW50LCBpZiBvbmUgaXNcbiAgICAgICAgICAgICAgICAgICAgLy8gc3BlY2lmaWVkLlxuICAgICAgICAgICAgICAgICAgICBpZiAoY2hhckNvZGUgPT0gNDMgfHwgY2hhckNvZGUgPT0gNDUpIHtcbiAgICAgICAgICAgICAgICAgICAgICBJbmRleCsrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vIFBhcnNlIHRoZSBleHBvbmVudGlhbCBjb21wb25lbnQuXG4gICAgICAgICAgICAgICAgICAgIGZvciAocG9zaXRpb24gPSBJbmRleDsgcG9zaXRpb24gPCBsZW5ndGggJiYgKChjaGFyQ29kZSA9IHNvdXJjZS5jaGFyQ29kZUF0KHBvc2l0aW9uKSksIGNoYXJDb2RlID49IDQ4ICYmIGNoYXJDb2RlIDw9IDU3KTsgcG9zaXRpb24rKyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwb3NpdGlvbiA9PSBJbmRleCkge1xuICAgICAgICAgICAgICAgICAgICAgIC8vIElsbGVnYWwgZW1wdHkgZXhwb25lbnQuXG4gICAgICAgICAgICAgICAgICAgICAgYWJvcnQoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBJbmRleCA9IHBvc2l0aW9uO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgLy8gQ29lcmNlIHRoZSBwYXJzZWQgdmFsdWUgdG8gYSBKYXZhU2NyaXB0IG51bWJlci5cbiAgICAgICAgICAgICAgICAgIHJldHVybiArc291cmNlLnNsaWNlKGJlZ2luLCBJbmRleCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIEEgbmVnYXRpdmUgc2lnbiBtYXkgb25seSBwcmVjZWRlIG51bWJlcnMuXG4gICAgICAgICAgICAgICAgaWYgKGlzU2lnbmVkKSB7XG4gICAgICAgICAgICAgICAgICBhYm9ydCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBgdHJ1ZWAsIGBmYWxzZWAsIGFuZCBgbnVsbGAgbGl0ZXJhbHMuXG4gICAgICAgICAgICAgICAgaWYgKHNvdXJjZS5zbGljZShJbmRleCwgSW5kZXggKyA0KSA9PSBcInRydWVcIikge1xuICAgICAgICAgICAgICAgICAgSW5kZXggKz0gNDtcbiAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc291cmNlLnNsaWNlKEluZGV4LCBJbmRleCArIDUpID09IFwiZmFsc2VcIikge1xuICAgICAgICAgICAgICAgICAgSW5kZXggKz0gNTtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHNvdXJjZS5zbGljZShJbmRleCwgSW5kZXggKyA0KSA9PSBcIm51bGxcIikge1xuICAgICAgICAgICAgICAgICAgSW5kZXggKz0gNDtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBVbnJlY29nbml6ZWQgdG9rZW4uXG4gICAgICAgICAgICAgICAgYWJvcnQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gUmV0dXJuIHRoZSBzZW50aW5lbCBgJGAgY2hhcmFjdGVyIGlmIHRoZSBwYXJzZXIgaGFzIHJlYWNoZWQgdGhlIGVuZFxuICAgICAgICAgIC8vIG9mIHRoZSBzb3VyY2Ugc3RyaW5nLlxuICAgICAgICAgIHJldHVybiBcIiRcIjtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBJbnRlcm5hbDogUGFyc2VzIGEgSlNPTiBgdmFsdWVgIHRva2VuLlxuICAgICAgICB2YXIgZ2V0ID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgdmFyIHJlc3VsdHMsIGhhc01lbWJlcnM7XG4gICAgICAgICAgaWYgKHZhbHVlID09IFwiJFwiKSB7XG4gICAgICAgICAgICAvLyBVbmV4cGVjdGVkIGVuZCBvZiBpbnB1dC5cbiAgICAgICAgICAgIGFib3J0KCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgaWYgKChjaGFySW5kZXhCdWdneSA/IHZhbHVlLmNoYXJBdCgwKSA6IHZhbHVlWzBdKSA9PSBcIkBcIikge1xuICAgICAgICAgICAgICAvLyBSZW1vdmUgdGhlIHNlbnRpbmVsIGBAYCBjaGFyYWN0ZXIuXG4gICAgICAgICAgICAgIHJldHVybiB2YWx1ZS5zbGljZSgxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIFBhcnNlIG9iamVjdCBhbmQgYXJyYXkgbGl0ZXJhbHMuXG4gICAgICAgICAgICBpZiAodmFsdWUgPT0gXCJbXCIpIHtcbiAgICAgICAgICAgICAgLy8gUGFyc2VzIGEgSlNPTiBhcnJheSwgcmV0dXJuaW5nIGEgbmV3IEphdmFTY3JpcHQgYXJyYXkuXG4gICAgICAgICAgICAgIHJlc3VsdHMgPSBbXTtcbiAgICAgICAgICAgICAgZm9yICg7OyBoYXNNZW1iZXJzIHx8IChoYXNNZW1iZXJzID0gdHJ1ZSkpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IGxleCgpO1xuICAgICAgICAgICAgICAgIC8vIEEgY2xvc2luZyBzcXVhcmUgYnJhY2tldCBtYXJrcyB0aGUgZW5kIG9mIHRoZSBhcnJheSBsaXRlcmFsLlxuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcIl1cIikge1xuICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIElmIHRoZSBhcnJheSBsaXRlcmFsIGNvbnRhaW5zIGVsZW1lbnRzLCB0aGUgY3VycmVudCB0b2tlblxuICAgICAgICAgICAgICAgIC8vIHNob3VsZCBiZSBhIGNvbW1hIHNlcGFyYXRpbmcgdGhlIHByZXZpb3VzIGVsZW1lbnQgZnJvbSB0aGVcbiAgICAgICAgICAgICAgICAvLyBuZXh0LlxuICAgICAgICAgICAgICAgIGlmIChoYXNNZW1iZXJzKSB7XG4gICAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT0gXCIsXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBsZXgoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlID09IFwiXVwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgLy8gVW5leHBlY3RlZCB0cmFpbGluZyBgLGAgaW4gYXJyYXkgbGl0ZXJhbC5cbiAgICAgICAgICAgICAgICAgICAgICBhYm9ydCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBBIGAsYCBtdXN0IHNlcGFyYXRlIGVhY2ggYXJyYXkgZWxlbWVudC5cbiAgICAgICAgICAgICAgICAgICAgYWJvcnQoKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gRWxpc2lvbnMgYW5kIGxlYWRpbmcgY29tbWFzIGFyZSBub3QgcGVybWl0dGVkLlxuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcIixcIikge1xuICAgICAgICAgICAgICAgICAgYWJvcnQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKGdldCh2YWx1ZSkpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybiByZXN1bHRzO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh2YWx1ZSA9PSBcIntcIikge1xuICAgICAgICAgICAgICAvLyBQYXJzZXMgYSBKU09OIG9iamVjdCwgcmV0dXJuaW5nIGEgbmV3IEphdmFTY3JpcHQgb2JqZWN0LlxuICAgICAgICAgICAgICByZXN1bHRzID0ge307XG4gICAgICAgICAgICAgIGZvciAoOzsgaGFzTWVtYmVycyB8fCAoaGFzTWVtYmVycyA9IHRydWUpKSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSBsZXgoKTtcbiAgICAgICAgICAgICAgICAvLyBBIGNsb3NpbmcgY3VybHkgYnJhY2UgbWFya3MgdGhlIGVuZCBvZiB0aGUgb2JqZWN0IGxpdGVyYWwuXG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlID09IFwifVwiKSB7XG4gICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gSWYgdGhlIG9iamVjdCBsaXRlcmFsIGNvbnRhaW5zIG1lbWJlcnMsIHRoZSBjdXJyZW50IHRva2VuXG4gICAgICAgICAgICAgICAgLy8gc2hvdWxkIGJlIGEgY29tbWEgc2VwYXJhdG9yLlxuICAgICAgICAgICAgICAgIGlmIChoYXNNZW1iZXJzKSB7XG4gICAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT0gXCIsXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBsZXgoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlID09IFwifVwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgLy8gVW5leHBlY3RlZCB0cmFpbGluZyBgLGAgaW4gb2JqZWN0IGxpdGVyYWwuXG4gICAgICAgICAgICAgICAgICAgICAgYWJvcnQoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQSBgLGAgbXVzdCBzZXBhcmF0ZSBlYWNoIG9iamVjdCBtZW1iZXIuXG4gICAgICAgICAgICAgICAgICAgIGFib3J0KCk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIExlYWRpbmcgY29tbWFzIGFyZSBub3QgcGVybWl0dGVkLCBvYmplY3QgcHJvcGVydHkgbmFtZXMgbXVzdCBiZVxuICAgICAgICAgICAgICAgIC8vIGRvdWJsZS1xdW90ZWQgc3RyaW5ncywgYW5kIGEgYDpgIG11c3Qgc2VwYXJhdGUgZWFjaCBwcm9wZXJ0eVxuICAgICAgICAgICAgICAgIC8vIG5hbWUgYW5kIHZhbHVlLlxuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcIixcIiB8fCB0eXBlb2YgdmFsdWUgIT0gXCJzdHJpbmdcIiB8fCAoY2hhckluZGV4QnVnZ3kgPyB2YWx1ZS5jaGFyQXQoMCkgOiB2YWx1ZVswXSkgIT0gXCJAXCIgfHwgbGV4KCkgIT0gXCI6XCIpIHtcbiAgICAgICAgICAgICAgICAgIGFib3J0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlc3VsdHNbdmFsdWUuc2xpY2UoMSldID0gZ2V0KGxleCgpKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0cztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIFVuZXhwZWN0ZWQgdG9rZW4gZW5jb3VudGVyZWQuXG4gICAgICAgICAgICBhYm9ydCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gSW50ZXJuYWw6IFVwZGF0ZXMgYSB0cmF2ZXJzZWQgb2JqZWN0IG1lbWJlci5cbiAgICAgICAgdmFyIHVwZGF0ZSA9IGZ1bmN0aW9uIChzb3VyY2UsIHByb3BlcnR5LCBjYWxsYmFjaykge1xuICAgICAgICAgIHZhciBlbGVtZW50ID0gd2Fsayhzb3VyY2UsIHByb3BlcnR5LCBjYWxsYmFjayk7XG4gICAgICAgICAgaWYgKGVsZW1lbnQgPT09IHVuZGVmKSB7XG4gICAgICAgICAgICBkZWxldGUgc291cmNlW3Byb3BlcnR5XTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc291cmNlW3Byb3BlcnR5XSA9IGVsZW1lbnQ7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIEludGVybmFsOiBSZWN1cnNpdmVseSB0cmF2ZXJzZXMgYSBwYXJzZWQgSlNPTiBvYmplY3QsIGludm9raW5nIHRoZVxuICAgICAgICAvLyBgY2FsbGJhY2tgIGZ1bmN0aW9uIGZvciBlYWNoIHZhbHVlLiBUaGlzIGlzIGFuIGltcGxlbWVudGF0aW9uIG9mIHRoZVxuICAgICAgICAvLyBgV2Fsayhob2xkZXIsIG5hbWUpYCBvcGVyYXRpb24gZGVmaW5lZCBpbiBFUyA1LjEgc2VjdGlvbiAxNS4xMi4yLlxuICAgICAgICB2YXIgd2FsayA9IGZ1bmN0aW9uIChzb3VyY2UsIHByb3BlcnR5LCBjYWxsYmFjaykge1xuICAgICAgICAgIHZhciB2YWx1ZSA9IHNvdXJjZVtwcm9wZXJ0eV0sIGxlbmd0aDtcbiAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09IFwib2JqZWN0XCIgJiYgdmFsdWUpIHtcbiAgICAgICAgICAgIC8vIGBmb3JFYWNoYCBjYW4ndCBiZSB1c2VkIHRvIHRyYXZlcnNlIGFuIGFycmF5IGluIE9wZXJhIDw9IDguNTRcbiAgICAgICAgICAgIC8vIGJlY2F1c2UgaXRzIGBPYmplY3QjaGFzT3duUHJvcGVydHlgIGltcGxlbWVudGF0aW9uIHJldHVybnMgYGZhbHNlYFxuICAgICAgICAgICAgLy8gZm9yIGFycmF5IGluZGljZXMgKGUuZy4sIGAhWzEsIDIsIDNdLmhhc093blByb3BlcnR5KFwiMFwiKWApLlxuICAgICAgICAgICAgaWYgKGdldENsYXNzLmNhbGwodmFsdWUpID09IGFycmF5Q2xhc3MpIHtcbiAgICAgICAgICAgICAgZm9yIChsZW5ndGggPSB2YWx1ZS5sZW5ndGg7IGxlbmd0aC0tOykge1xuICAgICAgICAgICAgICAgIHVwZGF0ZSh2YWx1ZSwgbGVuZ3RoLCBjYWxsYmFjayk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGZvckVhY2godmFsdWUsIGZ1bmN0aW9uIChwcm9wZXJ0eSkge1xuICAgICAgICAgICAgICAgIHVwZGF0ZSh2YWx1ZSwgcHJvcGVydHksIGNhbGxiYWNrKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBjYWxsYmFjay5jYWxsKHNvdXJjZSwgcHJvcGVydHksIHZhbHVlKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBQdWJsaWM6IGBKU09OLnBhcnNlYC4gU2VlIEVTIDUuMSBzZWN0aW9uIDE1LjEyLjIuXG4gICAgICAgIGV4cG9ydHMucGFyc2UgPSBmdW5jdGlvbiAoc291cmNlLCBjYWxsYmFjaykge1xuICAgICAgICAgIHZhciByZXN1bHQsIHZhbHVlO1xuICAgICAgICAgIEluZGV4ID0gMDtcbiAgICAgICAgICBTb3VyY2UgPSBcIlwiICsgc291cmNlO1xuICAgICAgICAgIHJlc3VsdCA9IGdldChsZXgoKSk7XG4gICAgICAgICAgLy8gSWYgYSBKU09OIHN0cmluZyBjb250YWlucyBtdWx0aXBsZSB0b2tlbnMsIGl0IGlzIGludmFsaWQuXG4gICAgICAgICAgaWYgKGxleCgpICE9IFwiJFwiKSB7XG4gICAgICAgICAgICBhYm9ydCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBSZXNldCB0aGUgcGFyc2VyIHN0YXRlLlxuICAgICAgICAgIEluZGV4ID0gU291cmNlID0gbnVsbDtcbiAgICAgICAgICByZXR1cm4gY2FsbGJhY2sgJiYgZ2V0Q2xhc3MuY2FsbChjYWxsYmFjaykgPT0gZnVuY3Rpb25DbGFzcyA/IHdhbGsoKHZhbHVlID0ge30sIHZhbHVlW1wiXCJdID0gcmVzdWx0LCB2YWx1ZSksIFwiXCIsIGNhbGxiYWNrKSA6IHJlc3VsdDtcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBleHBvcnRzW1wicnVuSW5Db250ZXh0XCJdID0gcnVuSW5Db250ZXh0O1xuICAgIHJldHVybiBleHBvcnRzO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBleHBvcnRzID09IFwib2JqZWN0XCIgJiYgZXhwb3J0cyAmJiAhZXhwb3J0cy5ub2RlVHlwZSAmJiAhaXNMb2FkZXIpIHtcbiAgICAvLyBFeHBvcnQgZm9yIENvbW1vbkpTIGVudmlyb25tZW50cy5cbiAgICBydW5JbkNvbnRleHQocm9vdCwgZXhwb3J0cyk7XG4gIH0gZWxzZSB7XG4gICAgLy8gRXhwb3J0IGZvciB3ZWIgYnJvd3NlcnMgYW5kIEphdmFTY3JpcHQgZW5naW5lcy5cbiAgICB2YXIgbmF0aXZlSlNPTiA9IHJvb3QuSlNPTjtcbiAgICB2YXIgSlNPTjMgPSBydW5JbkNvbnRleHQocm9vdCwgKHJvb3RbXCJKU09OM1wiXSA9IHtcbiAgICAgIC8vIFB1YmxpYzogUmVzdG9yZXMgdGhlIG9yaWdpbmFsIHZhbHVlIG9mIHRoZSBnbG9iYWwgYEpTT05gIG9iamVjdCBhbmRcbiAgICAgIC8vIHJldHVybnMgYSByZWZlcmVuY2UgdG8gdGhlIGBKU09OM2Agb2JqZWN0LlxuICAgICAgXCJub0NvbmZsaWN0XCI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcm9vdC5KU09OID0gbmF0aXZlSlNPTjtcbiAgICAgICAgcmV0dXJuIEpTT04zO1xuICAgICAgfVxuICAgIH0pKTtcblxuICAgIHJvb3QuSlNPTiA9IHtcbiAgICAgIFwicGFyc2VcIjogSlNPTjMucGFyc2UsXG4gICAgICBcInN0cmluZ2lmeVwiOiBKU09OMy5zdHJpbmdpZnlcbiAgICB9O1xuICB9XG5cbiAgLy8gRXhwb3J0IGZvciBhc3luY2hyb25vdXMgbW9kdWxlIGxvYWRlcnMuXG4gIGlmIChpc0xvYWRlcikge1xuICAgIGRlZmluZShmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gSlNPTjM7XG4gICAgfSk7XG4gIH1cbn0odGhpcykpO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xudmFyIHRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcblxudmFyIGlzRnVuY3Rpb24gPSBmdW5jdGlvbiAoZm4pIHtcblx0cmV0dXJuICh0eXBlb2YgZm4gPT09ICdmdW5jdGlvbicgJiYgIShmbiBpbnN0YW5jZW9mIFJlZ0V4cCkpIHx8IHRvU3RyaW5nLmNhbGwoZm4pID09PSAnW29iamVjdCBGdW5jdGlvbl0nO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBmb3JFYWNoKG9iaiwgZm4pIHtcblx0aWYgKCFpc0Z1bmN0aW9uKGZuKSkge1xuXHRcdHRocm93IG5ldyBUeXBlRXJyb3IoJ2l0ZXJhdG9yIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXHR9XG5cdHZhciBpLCBrLFxuXHRcdGlzU3RyaW5nID0gdHlwZW9mIG9iaiA9PT0gJ3N0cmluZycsXG5cdFx0bCA9IG9iai5sZW5ndGgsXG5cdFx0Y29udGV4dCA9IGFyZ3VtZW50cy5sZW5ndGggPiAyID8gYXJndW1lbnRzWzJdIDogbnVsbDtcblx0aWYgKGwgPT09ICtsKSB7XG5cdFx0Zm9yIChpID0gMDsgaSA8IGw7IGkrKykge1xuXHRcdFx0aWYgKGNvbnRleHQgPT09IG51bGwpIHtcblx0XHRcdFx0Zm4oaXNTdHJpbmcgPyBvYmouY2hhckF0KGkpIDogb2JqW2ldLCBpLCBvYmopO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Zm4uY2FsbChjb250ZXh0LCBpc1N0cmluZyA/IG9iai5jaGFyQXQoaSkgOiBvYmpbaV0sIGksIG9iaik7XG5cdFx0XHR9XG5cdFx0fVxuXHR9IGVsc2Uge1xuXHRcdGZvciAoayBpbiBvYmopIHtcblx0XHRcdGlmIChoYXNPd24uY2FsbChvYmosIGspKSB7XG5cdFx0XHRcdGlmIChjb250ZXh0ID09PSBudWxsKSB7XG5cdFx0XHRcdFx0Zm4ob2JqW2tdLCBrLCBvYmopO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGZuLmNhbGwoY29udGV4dCwgb2JqW2tdLCBrLCBvYmopO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG59O1xuXG4iLCJcInVzZSBzdHJpY3RcIjtcblxuLy8gbW9kaWZpZWQgZnJvbSBodHRwczovL2dpdGh1Yi5jb20vZXMtc2hpbXMvZXM1LXNoaW1cbnZhciBoYXMgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LFxuXHR0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcsXG5cdGZvckVhY2ggPSByZXF1aXJlKCcuL2ZvcmVhY2gnKSxcblx0aXNBcmdzID0gcmVxdWlyZSgnLi9pc0FyZ3VtZW50cycpLFxuXHRoYXNEb250RW51bUJ1ZyA9ICEoeyd0b1N0cmluZyc6IG51bGx9KS5wcm9wZXJ0eUlzRW51bWVyYWJsZSgndG9TdHJpbmcnKSxcblx0aGFzUHJvdG9FbnVtQnVnID0gKGZ1bmN0aW9uICgpIHt9KS5wcm9wZXJ0eUlzRW51bWVyYWJsZSgncHJvdG90eXBlJyksXG5cdGRvbnRFbnVtcyA9IFtcblx0XHRcInRvU3RyaW5nXCIsXG5cdFx0XCJ0b0xvY2FsZVN0cmluZ1wiLFxuXHRcdFwidmFsdWVPZlwiLFxuXHRcdFwiaGFzT3duUHJvcGVydHlcIixcblx0XHRcImlzUHJvdG90eXBlT2ZcIixcblx0XHRcInByb3BlcnR5SXNFbnVtZXJhYmxlXCIsXG5cdFx0XCJjb25zdHJ1Y3RvclwiXG5cdF07XG5cbnZhciBrZXlzU2hpbSA9IGZ1bmN0aW9uIGtleXMob2JqZWN0KSB7XG5cdHZhciBpc09iamVjdCA9IG9iamVjdCAhPT0gbnVsbCAmJiB0eXBlb2Ygb2JqZWN0ID09PSAnb2JqZWN0Jyxcblx0XHRpc0Z1bmN0aW9uID0gdG9TdHJpbmcuY2FsbChvYmplY3QpID09PSAnW29iamVjdCBGdW5jdGlvbl0nLFxuXHRcdGlzQXJndW1lbnRzID0gaXNBcmdzKG9iamVjdCksXG5cdFx0dGhlS2V5cyA9IFtdO1xuXG5cdGlmICghaXNPYmplY3QgJiYgIWlzRnVuY3Rpb24gJiYgIWlzQXJndW1lbnRzKSB7XG5cdFx0dGhyb3cgbmV3IFR5cGVFcnJvcihcIk9iamVjdC5rZXlzIGNhbGxlZCBvbiBhIG5vbi1vYmplY3RcIik7XG5cdH1cblxuXHRpZiAoaXNBcmd1bWVudHMpIHtcblx0XHRmb3JFYWNoKG9iamVjdCwgZnVuY3Rpb24gKHZhbHVlLCBpbmRleCkge1xuXHRcdFx0dGhlS2V5cy5wdXNoKGluZGV4KTtcblx0XHR9KTtcblx0fSBlbHNlIHtcblx0XHR2YXIgbmFtZSxcblx0XHRcdHNraXBQcm90byA9IGhhc1Byb3RvRW51bUJ1ZyAmJiBpc0Z1bmN0aW9uO1xuXG5cdFx0Zm9yIChuYW1lIGluIG9iamVjdCkge1xuXHRcdFx0aWYgKCEoc2tpcFByb3RvICYmIG5hbWUgPT09ICdwcm90b3R5cGUnKSAmJiBoYXMuY2FsbChvYmplY3QsIG5hbWUpKSB7XG5cdFx0XHRcdHRoZUtleXMucHVzaChuYW1lKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRpZiAoaGFzRG9udEVudW1CdWcpIHtcblx0XHR2YXIgY3RvciA9IG9iamVjdC5jb25zdHJ1Y3Rvcixcblx0XHRcdHNraXBDb25zdHJ1Y3RvciA9IGN0b3IgJiYgY3Rvci5wcm90b3R5cGUgPT09IG9iamVjdDtcblxuXHRcdGZvckVhY2goZG9udEVudW1zLCBmdW5jdGlvbiAoZG9udEVudW0pIHtcblx0XHRcdGlmICghKHNraXBDb25zdHJ1Y3RvciAmJiBkb250RW51bSA9PT0gJ2NvbnN0cnVjdG9yJykgJiYgaGFzLmNhbGwob2JqZWN0LCBkb250RW51bSkpIHtcblx0XHRcdFx0dGhlS2V5cy5wdXNoKGRvbnRFbnVtKTtcblx0XHRcdH1cblx0XHR9KTtcblx0fVxuXHRyZXR1cm4gdGhlS2V5cztcbn07XG5cbmtleXNTaGltLnNoaW0gPSBmdW5jdGlvbiBzaGltT2JqZWN0S2V5cygpIHtcblx0aWYgKCFPYmplY3Qua2V5cykge1xuXHRcdE9iamVjdC5rZXlzID0ga2V5c1NoaW07XG5cdH1cblx0cmV0dXJuIE9iamVjdC5rZXlzIHx8IGtleXNTaGltO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBrZXlzU2hpbTtcblxuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciB0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNBcmd1bWVudHModmFsdWUpIHtcblx0dmFyIHN0ciA9IHRvU3RyaW5nLmNhbGwodmFsdWUpO1xuXHR2YXIgaXNBcmd1bWVudHMgPSBzdHIgPT09ICdbb2JqZWN0IEFyZ3VtZW50c10nO1xuXHRpZiAoIWlzQXJndW1lbnRzKSB7XG5cdFx0aXNBcmd1bWVudHMgPSBzdHIgIT09ICdbb2JqZWN0IEFycmF5XSdcblx0XHRcdCYmIHZhbHVlICE9PSBudWxsXG5cdFx0XHQmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnXG5cdFx0XHQmJiB0eXBlb2YgdmFsdWUubGVuZ3RoID09PSAnbnVtYmVyJ1xuXHRcdFx0JiYgdmFsdWUubGVuZ3RoID49IDBcblx0XHRcdCYmIHRvU3RyaW5nLmNhbGwodmFsdWUuY2FsbGVlKSA9PT0gJ1tvYmplY3QgRnVuY3Rpb25dJztcblx0fVxuXHRyZXR1cm4gaXNBcmd1bWVudHM7XG59O1xuXG4iLCJcbi8qKlxuICogTW9kdWxlIGRlcGVuZGVuY2llcy5cbiAqL1xuXG52YXIgbWFwID0gcmVxdWlyZSgnYXJyYXktbWFwJyk7XG52YXIgaW5kZXhPZiA9IHJlcXVpcmUoJ2luZGV4b2YnKTtcbnZhciBpc0FycmF5ID0gcmVxdWlyZSgnaXNhcnJheScpO1xudmFyIGZvckVhY2ggPSByZXF1aXJlKCdmb3JlYWNoJyk7XG52YXIgcmVkdWNlID0gcmVxdWlyZSgnYXJyYXktcmVkdWNlJyk7XG52YXIgZ2V0T2JqZWN0S2V5cyA9IHJlcXVpcmUoJ29iamVjdC1rZXlzJyk7XG52YXIgSlNPTiA9IHJlcXVpcmUoJ2pzb24zJyk7XG5cbi8qKlxuICogTWFrZSBzdXJlIGBPYmplY3Qua2V5c2Agd29yayBmb3IgYHVuZGVmaW5lZGBcbiAqIHZhbHVlcyB0aGF0IGFyZSBzdGlsbCB0aGVyZSwgbGlrZSBgZG9jdW1lbnQuYWxsYC5cbiAqIGh0dHA6Ly9saXN0cy53My5vcmcvQXJjaGl2ZXMvUHVibGljL3B1YmxpYy1odG1sLzIwMDlKdW4vMDU0Ni5odG1sXG4gKlxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gb2JqZWN0S2V5cyh2YWwpe1xuICBpZiAoT2JqZWN0LmtleXMpIHJldHVybiBPYmplY3Qua2V5cyh2YWwpO1xuICByZXR1cm4gZ2V0T2JqZWN0S2V5cyh2YWwpO1xufVxuXG4vKipcbiAqIE1vZHVsZSBleHBvcnRzLlxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gaW5zcGVjdDtcblxuLyoqXG4gKiBFY2hvcyB0aGUgdmFsdWUgb2YgYSB2YWx1ZS4gVHJ5cyB0byBwcmludCB0aGUgdmFsdWUgb3V0XG4gKiBpbiB0aGUgYmVzdCB3YXkgcG9zc2libGUgZ2l2ZW4gdGhlIGRpZmZlcmVudCB0eXBlcy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqIFRoZSBvYmplY3QgdG8gcHJpbnQgb3V0LlxuICogQHBhcmFtIHtPYmplY3R9IG9wdHMgT3B0aW9uYWwgb3B0aW9ucyBvYmplY3QgdGhhdCBhbHRlcnMgdGhlIG91dHB1dC5cbiAqIEBsaWNlbnNlIE1JVCAowqkgSm95ZW50KVxuICovXG4vKiBsZWdhY3k6IG9iaiwgc2hvd0hpZGRlbiwgZGVwdGgsIGNvbG9ycyovXG5cbmZ1bmN0aW9uIGluc3BlY3Qob2JqLCBvcHRzKSB7XG4gIC8vIGRlZmF1bHQgb3B0aW9uc1xuICB2YXIgY3R4ID0ge1xuICAgIHNlZW46IFtdLFxuICAgIHN0eWxpemU6IHN0eWxpemVOb0NvbG9yXG4gIH07XG4gIC8vIGxlZ2FjeS4uLlxuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSAzKSBjdHguZGVwdGggPSBhcmd1bWVudHNbMl07XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDQpIGN0eC5jb2xvcnMgPSBhcmd1bWVudHNbM107XG4gIGlmIChpc0Jvb2xlYW4ob3B0cykpIHtcbiAgICAvLyBsZWdhY3kuLi5cbiAgICBjdHguc2hvd0hpZGRlbiA9IG9wdHM7XG4gIH0gZWxzZSBpZiAob3B0cykge1xuICAgIC8vIGdvdCBhbiBcIm9wdGlvbnNcIiBvYmplY3RcbiAgICBfZXh0ZW5kKGN0eCwgb3B0cyk7XG4gIH1cbiAgLy8gc2V0IGRlZmF1bHQgb3B0aW9uc1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LnNob3dIaWRkZW4pKSBjdHguc2hvd0hpZGRlbiA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmRlcHRoKSkgY3R4LmRlcHRoID0gMjtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jb2xvcnMpKSBjdHguY29sb3JzID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY3VzdG9tSW5zcGVjdCkpIGN0eC5jdXN0b21JbnNwZWN0ID0gdHJ1ZTtcbiAgaWYgKGN0eC5jb2xvcnMpIGN0eC5zdHlsaXplID0gc3R5bGl6ZVdpdGhDb2xvcjtcbiAgcmV0dXJuIGZvcm1hdFZhbHVlKGN0eCwgb2JqLCBjdHguZGVwdGgpO1xufVxuXG4vLyBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0FOU0lfZXNjYXBlX2NvZGUjZ3JhcGhpY3Ncbmluc3BlY3QuY29sb3JzID0ge1xuICAnYm9sZCcgOiBbMSwgMjJdLFxuICAnaXRhbGljJyA6IFszLCAyM10sXG4gICd1bmRlcmxpbmUnIDogWzQsIDI0XSxcbiAgJ2ludmVyc2UnIDogWzcsIDI3XSxcbiAgJ3doaXRlJyA6IFszNywgMzldLFxuICAnZ3JleScgOiBbOTAsIDM5XSxcbiAgJ2JsYWNrJyA6IFszMCwgMzldLFxuICAnYmx1ZScgOiBbMzQsIDM5XSxcbiAgJ2N5YW4nIDogWzM2LCAzOV0sXG4gICdncmVlbicgOiBbMzIsIDM5XSxcbiAgJ21hZ2VudGEnIDogWzM1LCAzOV0sXG4gICdyZWQnIDogWzMxLCAzOV0sXG4gICd5ZWxsb3cnIDogWzMzLCAzOV1cbn07XG5cbi8vIERvbid0IHVzZSAnYmx1ZScgbm90IHZpc2libGUgb24gY21kLmV4ZVxuaW5zcGVjdC5zdHlsZXMgPSB7XG4gICdzcGVjaWFsJzogJ2N5YW4nLFxuICAnbnVtYmVyJzogJ3llbGxvdycsXG4gICdib29sZWFuJzogJ3llbGxvdycsXG4gICd1bmRlZmluZWQnOiAnZ3JleScsXG4gICdudWxsJzogJ2JvbGQnLFxuICAnc3RyaW5nJzogJ2dyZWVuJyxcbiAgJ2RhdGUnOiAnbWFnZW50YScsXG4gIC8vIFwibmFtZVwiOiBpbnRlbnRpb25hbGx5IG5vdCBzdHlsaW5nXG4gICdyZWdleHAnOiAncmVkJ1xufTtcblxuZnVuY3Rpb24gc3R5bGl6ZU5vQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgcmV0dXJuIHN0cjtcbn1cblxuZnVuY3Rpb24gaXNCb29sZWFuKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nO1xufVxuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuXG5mdW5jdGlvbiBzdHlsaXplV2l0aENvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHZhciBzdHlsZSA9IGluc3BlY3Quc3R5bGVzW3N0eWxlVHlwZV07XG5cbiAgaWYgKHN0eWxlKSB7XG4gICAgcmV0dXJuICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMF0gKyAnbScgKyBzdHIgK1xuICAgICAgICAgICAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzFdICsgJ20nO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBzdHI7XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbic7XG59XG5cbmZ1bmN0aW9uIGlzU3RyaW5nKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N0cmluZyc7XG59XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ251bWJlcic7XG59XG5cbmZ1bmN0aW9uIGlzTnVsbChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbDtcbn1cblxuZnVuY3Rpb24gaGFzT3duKG9iaiwgcHJvcCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCk7XG59XG5cbmZ1bmN0aW9uIGlzUmVnRXhwKHJlKSB7XG4gIHJldHVybiBpc09iamVjdChyZSkgJiYgb2JqZWN0VG9TdHJpbmcocmUpID09PSAnW29iamVjdCBSZWdFeHBdJztcbn1cblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5cbmZ1bmN0aW9uIGlzRXJyb3IoZSkge1xuICByZXR1cm4gaXNPYmplY3QoZSkgJiZcbiAgICAgIChvYmplY3RUb1N0cmluZyhlKSA9PT0gJ1tvYmplY3QgRXJyb3JdJyB8fCBlIGluc3RhbmNlb2YgRXJyb3IpO1xufVxuXG5mdW5jdGlvbiBpc0RhdGUoZCkge1xuICByZXR1cm4gaXNPYmplY3QoZCkgJiYgb2JqZWN0VG9TdHJpbmcoZCkgPT09ICdbb2JqZWN0IERhdGVdJztcbn1cblxuZnVuY3Rpb24gb2JqZWN0VG9TdHJpbmcobykge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG8pO1xufVxuXG5mdW5jdGlvbiBhcnJheVRvSGFzaChhcnJheSkge1xuICB2YXIgaGFzaCA9IHt9O1xuXG4gIGZvckVhY2goYXJyYXksIGZ1bmN0aW9uKHZhbCwgaWR4KSB7XG4gICAgaGFzaFt2YWxdID0gdHJ1ZTtcbiAgfSk7XG5cbiAgcmV0dXJuIGhhc2g7XG59XG5cbmZ1bmN0aW9uIGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpIHtcbiAgdmFyIG91dHB1dCA9IFtdO1xuICBmb3IgKHZhciBpID0gMCwgbCA9IHZhbHVlLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgIGlmIChoYXNPd24odmFsdWUsIFN0cmluZyhpKSkpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAgU3RyaW5nKGkpLCB0cnVlKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dHB1dC5wdXNoKCcnKTtcbiAgICB9XG4gIH1cbiAgZm9yRWFjaChrZXlzLCBmdW5jdGlvbihrZXkpIHtcbiAgICBpZiAoIWtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAga2V5LCB0cnVlKSk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIG91dHB1dDtcbn1cblxuZnVuY3Rpb24gZm9ybWF0RXJyb3IodmFsdWUpIHtcbiAgcmV0dXJuICdbJyArIEVycm9yLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSArICddJztcbn1cblxuZnVuY3Rpb24gZm9ybWF0VmFsdWUoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzKSB7XG4gIC8vIFByb3ZpZGUgYSBob29rIGZvciB1c2VyLXNwZWNpZmllZCBpbnNwZWN0IGZ1bmN0aW9ucy5cbiAgLy8gQ2hlY2sgdGhhdCB2YWx1ZSBpcyBhbiBvYmplY3Qgd2l0aCBhbiBpbnNwZWN0IGZ1bmN0aW9uIG9uIGl0XG4gIGlmIChjdHguY3VzdG9tSW5zcGVjdCAmJlxuICAgICAgdmFsdWUgJiZcbiAgICAgIGlzRnVuY3Rpb24odmFsdWUuaW5zcGVjdCkgJiZcbiAgICAgIC8vIEZpbHRlciBvdXQgdGhlIHV0aWwgbW9kdWxlLCBpdCdzIGluc3BlY3QgZnVuY3Rpb24gaXMgc3BlY2lhbFxuICAgICAgdmFsdWUuaW5zcGVjdCAhPT0gaW5zcGVjdCAmJlxuICAgICAgLy8gQWxzbyBmaWx0ZXIgb3V0IGFueSBwcm90b3R5cGUgb2JqZWN0cyB1c2luZyB0aGUgY2lyY3VsYXIgY2hlY2suXG4gICAgICAhKHZhbHVlLmNvbnN0cnVjdG9yICYmIHZhbHVlLmNvbnN0cnVjdG9yLnByb3RvdHlwZSA9PT0gdmFsdWUpKSB7XG4gICAgdmFyIHJldCA9IHZhbHVlLmluc3BlY3QocmVjdXJzZVRpbWVzLCBjdHgpO1xuICAgIGlmICghaXNTdHJpbmcocmV0KSkge1xuICAgICAgcmV0ID0gZm9ybWF0VmFsdWUoY3R4LCByZXQsIHJlY3Vyc2VUaW1lcyk7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG4gIH1cblxuICAvLyBQcmltaXRpdmUgdHlwZXMgY2Fubm90IGhhdmUgcHJvcGVydGllc1xuICB2YXIgcHJpbWl0aXZlID0gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpO1xuICBpZiAocHJpbWl0aXZlKSB7XG4gICAgcmV0dXJuIHByaW1pdGl2ZTtcbiAgfVxuXG4gIC8vIExvb2sgdXAgdGhlIGtleXMgb2YgdGhlIG9iamVjdC5cbiAgdmFyIGtleXMgPSBvYmplY3RLZXlzKHZhbHVlKTtcbiAgdmFyIHZpc2libGVLZXlzID0gYXJyYXlUb0hhc2goa2V5cyk7XG5cbiAgaWYgKGN0eC5zaG93SGlkZGVuICYmIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKSB7XG4gICAga2V5cyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHZhbHVlKTtcbiAgfVxuXG4gIC8vIElFIGRvZXNuJ3QgbWFrZSBlcnJvciBmaWVsZHMgbm9uLWVudW1lcmFibGVcbiAgLy8gaHR0cDovL21zZG4ubWljcm9zb2Z0LmNvbS9lbi11cy9saWJyYXJ5L2llL2R3dzUyc2J0KHY9dnMuOTQpLmFzcHhcbiAgaWYgKGlzRXJyb3IodmFsdWUpXG4gICAgICAmJiAoaW5kZXhPZihrZXlzLCAnbWVzc2FnZScpID49IDAgfHwgaW5kZXhPZihrZXlzLCAnZGVzY3JpcHRpb24nKSA+PSAwKSkge1xuICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICAvLyBTb21lIHR5cGUgb2Ygb2JqZWN0IHdpdGhvdXQgcHJvcGVydGllcyBjYW4gYmUgc2hvcnRjdXR0ZWQuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgdmFyIG5hbWUgPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW0Z1bmN0aW9uJyArIG5hbWUgKyAnXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfVxuICAgIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoRGF0ZS5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdkYXRlJyk7XG4gICAgfVxuICAgIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICB2YXIgYmFzZSA9ICcnLCBhcnJheSA9IGZhbHNlLCBicmFjZXMgPSBbJ3snLCAnfSddO1xuXG4gIC8vIE1ha2UgQXJyYXkgc2F5IHRoYXQgdGhleSBhcmUgQXJyYXlcbiAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgYXJyYXkgPSB0cnVlO1xuICAgIGJyYWNlcyA9IFsnWycsICddJ107XG4gIH1cblxuICAvLyBNYWtlIGZ1bmN0aW9ucyBzYXkgdGhhdCB0aGV5IGFyZSBmdW5jdGlvbnNcbiAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgdmFyIG4gPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICBiYXNlID0gJyBbRnVuY3Rpb24nICsgbiArICddJztcbiAgfVxuXG4gIC8vIE1ha2UgUmVnRXhwcyBzYXkgdGhhdCB0aGV5IGFyZSBSZWdFeHBzXG4gIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZGF0ZXMgd2l0aCBwcm9wZXJ0aWVzIGZpcnN0IHNheSB0aGUgZGF0ZVxuICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBEYXRlLnByb3RvdHlwZS50b1VUQ1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZXJyb3Igd2l0aCBtZXNzYWdlIGZpcnN0IHNheSB0aGUgZXJyb3JcbiAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCAmJiAoIWFycmF5IHx8IHZhbHVlLmxlbmd0aCA9PSAwKSkge1xuICAgIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgYnJhY2VzWzFdO1xuICB9XG5cbiAgaWYgKHJlY3Vyc2VUaW1lcyA8IDApIHtcbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tPYmplY3RdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cblxuICBjdHguc2Vlbi5wdXNoKHZhbHVlKTtcblxuICB2YXIgb3V0cHV0O1xuICBpZiAoYXJyYXkpIHtcbiAgICBvdXRwdXQgPSBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKTtcbiAgfSBlbHNlIHtcbiAgICBvdXRwdXQgPSBtYXAoa2V5cywgZnVuY3Rpb24oa2V5KSB7XG4gICAgICByZXR1cm4gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSk7XG4gICAgfSk7XG4gIH1cblxuICBjdHguc2Vlbi5wb3AoKTtcblxuICByZXR1cm4gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpO1xufVxuXG5mdW5jdGlvbiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KSB7XG4gIHZhciBuYW1lLCBzdHIsIGRlc2M7XG4gIGRlc2MgPSB7IHZhbHVlOiB2YWx1ZVtrZXldIH07XG4gIGlmIChPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKSB7XG4gICAgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodmFsdWUsIGtleSkgfHwgZGVzYztcbiAgfVxuICBpZiAoZGVzYy5nZXQpIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyL1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmICghaGFzT3duKHZpc2libGVLZXlzLCBrZXkpKSB7XG4gICAgbmFtZSA9ICdbJyArIGtleSArICddJztcbiAgfVxuICBpZiAoIXN0cikge1xuICAgIGlmIChpbmRleE9mKGN0eC5zZWVuLCBkZXNjLnZhbHVlKSA8IDApIHtcbiAgICAgIGlmIChpc051bGwocmVjdXJzZVRpbWVzKSkge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIG51bGwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCByZWN1cnNlVGltZXMgLSAxKTtcbiAgICAgIH1cbiAgICAgIGlmIChzdHIuaW5kZXhPZignXFxuJykgPiAtMSkge1xuICAgICAgICBpZiAoYXJyYXkpIHtcbiAgICAgICAgICBzdHIgPSBtYXAoc3RyLnNwbGl0KCdcXG4nKSwgZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpLnN1YnN0cigyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHIgPSAnXFxuJyArIG1hcChzdHIuc3BsaXQoJ1xcbicpLCBmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbQ2lyY3VsYXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKGlzVW5kZWZpbmVkKG5hbWUpKSB7XG4gICAgaWYgKGFycmF5ICYmIGtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIHJldHVybiBzdHI7XG4gICAgfVxuICAgIG5hbWUgPSBKU09OLnN0cmluZ2lmeSgnJyArIGtleSk7XG4gICAgaWYgKG5hbWUubWF0Y2goL15cIihbYS16QS1aX11bYS16QS1aXzAtOV0qKVwiJC8pKSB7XG4gICAgICBuYW1lID0gbmFtZS5zdWJzdHIoMSwgbmFtZS5sZW5ndGggLSAyKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnbmFtZScpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuYW1lID0gbmFtZS5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvKF5cInxcIiQpL2csIFwiJ1wiKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnc3RyaW5nJyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5hbWUgKyAnOiAnICsgc3RyO1xufVxuXG5mdW5jdGlvbiBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSkge1xuICBpZiAoaXNVbmRlZmluZWQodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgndW5kZWZpbmVkJywgJ3VuZGVmaW5lZCcpO1xuICBpZiAoaXNTdHJpbmcodmFsdWUpKSB7XG4gICAgdmFyIHNpbXBsZSA9ICdcXCcnICsgSlNPTi5zdHJpbmdpZnkodmFsdWUpLnJlcGxhY2UoL15cInxcIiQvZywgJycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpICsgJ1xcJyc7XG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKHNpbXBsZSwgJ3N0cmluZycpO1xuICB9XG4gIGlmIChpc051bWJlcih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdudW1iZXInKTtcbiAgaWYgKGlzQm9vbGVhbih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdib29sZWFuJyk7XG4gIC8vIEZvciBzb21lIHJlYXNvbiB0eXBlb2YgbnVsbCBpcyBcIm9iamVjdFwiLCBzbyBzcGVjaWFsIGNhc2UgaGVyZS5cbiAgaWYgKGlzTnVsbCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCdudWxsJywgJ251bGwnKTtcbn1cblxuZnVuY3Rpb24gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpIHtcbiAgdmFyIG51bUxpbmVzRXN0ID0gMDtcbiAgdmFyIGxlbmd0aCA9IHJlZHVjZShvdXRwdXQsIGZ1bmN0aW9uKHByZXYsIGN1cikge1xuICAgIG51bUxpbmVzRXN0Kys7XG4gICAgaWYgKGN1ci5pbmRleE9mKCdcXG4nKSA+PSAwKSBudW1MaW5lc0VzdCsrO1xuICAgIHJldHVybiBwcmV2ICsgY3VyLnJlcGxhY2UoL1xcdTAwMWJcXFtcXGRcXGQ/bS9nLCAnJykubGVuZ3RoICsgMTtcbiAgfSwgMCk7XG5cbiAgaWYgKGxlbmd0aCA+IDYwKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArXG4gICAgICAgICAgIChiYXNlID09PSAnJyA/ICcnIDogYmFzZSArICdcXG4gJykgK1xuICAgICAgICAgICAnICcgK1xuICAgICAgICAgICBvdXRwdXQuam9pbignLFxcbiAgJykgK1xuICAgICAgICAgICAnICcgK1xuICAgICAgICAgICBicmFjZXNbMV07XG4gIH1cblxuICByZXR1cm4gYnJhY2VzWzBdICsgYmFzZSArICcgJyArIG91dHB1dC5qb2luKCcsICcpICsgJyAnICsgYnJhY2VzWzFdO1xufVxuXG5mdW5jdGlvbiBfZXh0ZW5kKG9yaWdpbiwgYWRkKSB7XG4gIC8vIERvbid0IGRvIGFueXRoaW5nIGlmIGFkZCBpc24ndCBhbiBvYmplY3RcbiAgaWYgKCFhZGQgfHwgIWlzT2JqZWN0KGFkZCkpIHJldHVybiBvcmlnaW47XG5cbiAgdmFyIGtleXMgPSBvYmplY3RLZXlzKGFkZCk7XG4gIHZhciBpID0ga2V5cy5sZW5ndGg7XG4gIHdoaWxlIChpLS0pIHtcbiAgICBvcmlnaW5ba2V5c1tpXV0gPSBhZGRba2V5c1tpXV07XG4gIH1cbiAgcmV0dXJuIG9yaWdpbjtcbn1cbiIsIlwidXNlIHN0cmljdFwiXG5cbi8vIFRoaXMgaXMgYSByZXBvcnRlciB0aGF0IG1pbWljcyBNb2NoYSdzIGBkb3RgIHJlcG9ydGVyXG5cbnZhciBSID0gcmVxdWlyZShcIi4uL2xpYi9yZXBvcnRlclwiKVxuXG5mdW5jdGlvbiB3aWR0aCgpIHtcbiAgICByZXR1cm4gUi53aW5kb3dXaWR0aCgpICogNCAvIDMgfCAwXG59XG5cbmZ1bmN0aW9uIHByaW50RG90KF8sIGNvbG9yKSB7XG4gICAgZnVuY3Rpb24gZW1pdCgpIHtcbiAgICAgICAgcmV0dXJuIF8ud3JpdGUoUi5jb2xvcihjb2xvcixcbiAgICAgICAgICAgIGNvbG9yID09PSBcImZhaWxcIiA/IFIuc3ltYm9scygpLkRvdEZhaWwgOiBSLnN5bWJvbHMoKS5Eb3QpKVxuICAgIH1cblxuICAgIGlmIChfLnN0YXRlLmNvdW50ZXIrKyAlIHdpZHRoKCkgPT09IDApIHtcbiAgICAgICAgcmV0dXJuIF8ud3JpdGUoUi5uZXdsaW5lKCkgKyBcIiAgXCIpLnRoZW4oZW1pdClcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZW1pdCgpXG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFIub24oXCJkb3RcIiwge1xuICAgIGFjY2VwdHM6IFtcIndyaXRlXCIsIFwicmVzZXRcIiwgXCJjb2xvcnNcIl0sXG4gICAgY3JlYXRlOiBSLmNvbnNvbGVSZXBvcnRlcixcbiAgICBiZWZvcmU6IFIuc2V0Q29sb3IsXG4gICAgYWZ0ZXI6IFIudW5zZXRDb2xvcixcbiAgICBpbml0OiBmdW5jdGlvbiAoc3RhdGUpIHsgc3RhdGUuY291bnRlciA9IDAgfSxcblxuICAgIHJlcG9ydDogZnVuY3Rpb24gKF8sIHJlcG9ydCkge1xuICAgICAgICBpZiAocmVwb3J0LmlzRW50ZXIgfHwgcmVwb3J0LmlzUGFzcykge1xuICAgICAgICAgICAgcmV0dXJuIHByaW50RG90KF8sIFIuc3BlZWQocmVwb3J0KSlcbiAgICAgICAgfSBlbHNlIGlmIChyZXBvcnQuaXNIb29rIHx8IHJlcG9ydC5pc0ZhaWwpIHtcbiAgICAgICAgICAgIF8ucHVzaEVycm9yKHJlcG9ydClcbiAgICAgICAgICAgIC8vIFByaW50IGEgZG90IHJlZ2FyZGxlc3Mgb2YgaG9vayBzdWNjZXNzXG4gICAgICAgICAgICByZXR1cm4gcHJpbnREb3QoXywgXCJmYWlsXCIpXG4gICAgICAgIH0gZWxzZSBpZiAocmVwb3J0LmlzU2tpcCkge1xuICAgICAgICAgICAgcmV0dXJuIHByaW50RG90KF8sIFwic2tpcFwiKVxuICAgICAgICB9IGVsc2UgaWYgKHJlcG9ydC5pc0VuZCkge1xuICAgICAgICAgICAgcmV0dXJuIF8ucHJpbnQoKS50aGVuKF8ucHJpbnRSZXN1bHRzLmJpbmQoXykpXG4gICAgICAgIH0gZWxzZSBpZiAocmVwb3J0LmlzRXJyb3IpIHtcbiAgICAgICAgICAgIGlmIChfLnN0YXRlLmNvdW50ZXIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gXy5wcmludCgpLnRoZW4oXy5wcmludEVycm9yLmJpbmQoXywgcmVwb3J0KSlcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF8ucHJpbnRFcnJvcihyZXBvcnQpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgICAgIH1cbiAgICB9LFxufSlcbiIsIlwidXNlIHN0cmljdFwiXG5cbi8vIGV4cG9ydHMuZG9tID0gcmVxdWlyZShcIi4vZG9tXCIpXG5leHBvcnRzLmRvdCA9IHJlcXVpcmUoXCIuL2RvdFwiKVxuZXhwb3J0cy5zcGVjID0gcmVxdWlyZShcIi4vc3BlY1wiKVxuZXhwb3J0cy50YXAgPSByZXF1aXJlKFwiLi90YXBcIilcbiIsIlwidXNlIHN0cmljdFwiXG5cbi8vIFRoaXMgaXMgYSByZXBvcnRlciB0aGF0IG1pbWljcyBNb2NoYSdzIGBzcGVjYCByZXBvcnRlci5cblxudmFyIFIgPSByZXF1aXJlKFwiLi4vbGliL3JlcG9ydGVyXCIpXG52YXIgYyA9IFIuY29sb3JcblxuZnVuY3Rpb24gaW5kZW50KGxldmVsKSB7XG4gICAgdmFyIHJldCA9IFwiXCJcblxuICAgIHdoaWxlIChsZXZlbC0tKSByZXQgKz0gXCIgIFwiXG4gICAgcmV0dXJuIHJldFxufVxuXG5mdW5jdGlvbiBnZXROYW1lKGxldmVsLCByZXBvcnQpIHtcbiAgICByZXR1cm4gcmVwb3J0LnBhdGhbbGV2ZWwgLSAxXS5uYW1lXG59XG5cbmZ1bmN0aW9uIHByaW50UmVwb3J0KF8sIHJlcG9ydCwgaW5pdCkge1xuICAgIGlmIChfLnN0YXRlLmxlYXZpbmcpIHtcbiAgICAgICAgXy5zdGF0ZS5sZWF2aW5nID0gZmFsc2VcbiAgICAgICAgcmV0dXJuIF8ucHJpbnQoKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBfLnByaW50KGluZGVudChfLnN0YXRlLmxldmVsKSArIGluaXQoKSlcbiAgICAgICAgfSlcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gXy5wcmludChpbmRlbnQoXy5zdGF0ZS5sZXZlbCkgKyBpbml0KCkpXG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFIub24oXCJzcGVjXCIsIHtcbiAgICBhY2NlcHRzOiBbXCJ3cml0ZVwiLCBcInJlc2V0XCIsIFwiY29sb3JzXCJdLFxuICAgIGNyZWF0ZTogUi5jb25zb2xlUmVwb3J0ZXIsXG4gICAgYmVmb3JlOiBSLnNldENvbG9yLFxuICAgIGFmdGVyOiBSLnVuc2V0Q29sb3IsXG5cbiAgICBpbml0OiBmdW5jdGlvbiAoc3RhdGUpIHtcbiAgICAgICAgc3RhdGUubGV2ZWwgPSAxXG4gICAgICAgIHN0YXRlLmxlYXZpbmcgPSBmYWxzZVxuICAgIH0sXG5cbiAgICByZXBvcnQ6IGZ1bmN0aW9uIChfLCByZXBvcnQpIHtcbiAgICAgICAgaWYgKHJlcG9ydC5pc1N0YXJ0KSB7XG4gICAgICAgICAgICByZXR1cm4gXy5wcmludCgpXG4gICAgICAgIH0gZWxzZSBpZiAocmVwb3J0LmlzRW50ZXIpIHtcbiAgICAgICAgICAgIHZhciBsZXZlbCA9IF8uc3RhdGUubGV2ZWwrK1xuICAgICAgICAgICAgdmFyIGxhc3QgPSByZXBvcnQucGF0aFtsZXZlbCAtIDFdXG5cbiAgICAgICAgICAgIF8uc3RhdGUubGVhdmluZyA9IGZhbHNlXG4gICAgICAgICAgICBpZiAobGFzdC5pbmRleCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBfLnByaW50KCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBfLnByaW50KGluZGVudChsZXZlbCkgKyBsYXN0Lm5hbWUpXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF8ucHJpbnQoaW5kZW50KGxldmVsKSArIGxhc3QubmFtZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChyZXBvcnQuaXNMZWF2ZSkge1xuICAgICAgICAgICAgXy5zdGF0ZS5sZXZlbC0tXG4gICAgICAgICAgICBfLnN0YXRlLmxlYXZpbmcgPSB0cnVlXG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgICAgIH0gZWxzZSBpZiAocmVwb3J0LmlzUGFzcykge1xuICAgICAgICAgICAgcmV0dXJuIHByaW50UmVwb3J0KF8sIHJlcG9ydCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBzdHIgPVxuICAgICAgICAgICAgICAgICAgICBjKFwiY2hlY2ttYXJrXCIsIFIuc3ltYm9scygpLlBhc3MgKyBcIiBcIikgK1xuICAgICAgICAgICAgICAgICAgICBjKFwicGFzc1wiLCBnZXROYW1lKF8uc3RhdGUubGV2ZWwsIHJlcG9ydCkpXG5cbiAgICAgICAgICAgICAgICB2YXIgc3BlZWQgPSBSLnNwZWVkKHJlcG9ydClcblxuICAgICAgICAgICAgICAgIGlmIChzcGVlZCAhPT0gXCJmYXN0XCIpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RyICs9IGMoc3BlZWQsIFwiIChcIiArIHJlcG9ydC5kdXJhdGlvbiArIFwibXMpXCIpXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0clxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSBlbHNlIGlmIChyZXBvcnQuaXNIb29rIHx8IHJlcG9ydC5pc0ZhaWwpIHtcbiAgICAgICAgICAgIF8ucHVzaEVycm9yKHJlcG9ydClcblxuICAgICAgICAgICAgLy8gRG9uJ3QgcHJpbnQgdGhlIGRlc2NyaXB0aW9uIGxpbmUgb24gY3VtdWxhdGl2ZSBob29rc1xuICAgICAgICAgICAgaWYgKHJlcG9ydC5pc0hvb2sgJiYgKHJlcG9ydC5pc0JlZm9yZUFsbCB8fCByZXBvcnQuaXNBZnRlckFsbCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBwcmludFJlcG9ydChfLCByZXBvcnQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYyhcImZhaWxcIixcbiAgICAgICAgICAgICAgICAgICAgXy5lcnJvcnMubGVuZ3RoICsgXCIpIFwiICsgZ2V0TmFtZShfLnN0YXRlLmxldmVsLCByZXBvcnQpICtcbiAgICAgICAgICAgICAgICAgICAgUi5mb3JtYXRSZXN0KHJlcG9ydCkpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9IGVsc2UgaWYgKHJlcG9ydC5pc1NraXApIHtcbiAgICAgICAgICAgIHJldHVybiBwcmludFJlcG9ydChfLCByZXBvcnQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYyhcInNraXBcIiwgXCItIFwiICsgZ2V0TmFtZShfLnN0YXRlLmxldmVsLCByZXBvcnQpKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChyZXBvcnQuaXNFbmQpIHJldHVybiBfLnByaW50UmVzdWx0cygpXG4gICAgICAgIGlmIChyZXBvcnQuaXNFcnJvcikgcmV0dXJuIF8ucHJpbnRFcnJvcihyZXBvcnQpXG4gICAgICAgIHJldHVybiB1bmRlZmluZWRcbiAgICB9LFxufSlcbiIsIlwidXNlIHN0cmljdFwiXG5cbi8vIFRoaXMgaXMgYSBiYXNpYyBUQVAtZ2VuZXJhdGluZyByZXBvcnRlci5cblxudmFyIHBlYWNoID0gcmVxdWlyZShcIi4uL2xpYi91dGlsXCIpLnBlYWNoXG52YXIgUiA9IHJlcXVpcmUoXCIuLi9saWIvcmVwb3J0ZXJcIilcbnZhciBpbnNwZWN0ID0gcmVxdWlyZShcIi4uL2xpYi9yZXBsYWNlZC9pbnNwZWN0XCIpXG5cbmZ1bmN0aW9uIHNob3VsZEJyZWFrKG1pbkxlbmd0aCwgc3RyKSB7XG4gICAgcmV0dXJuIHN0ci5sZW5ndGggPiBSLndpbmRvd1dpZHRoKCkgLSBtaW5MZW5ndGggfHwgL1xccj9cXG58Wzo/LV0vLnRlc3Qoc3RyKVxufVxuXG5mdW5jdGlvbiB0ZW1wbGF0ZShfLCByZXBvcnQsIHRtcGwsIHNraXApIHtcbiAgICBpZiAoIXNraXApIF8uc3RhdGUuY291bnRlcisrXG4gICAgdmFyIHBhdGggPSBSLmpvaW5QYXRoKHJlcG9ydCkucmVwbGFjZSgvXFwkL2csIFwiJCQkJFwiKVxuXG4gICAgcmV0dXJuIF8ucHJpbnQoXG4gICAgICAgIHRtcGwucmVwbGFjZSgvJWMvZywgXy5zdGF0ZS5jb3VudGVyKVxuICAgICAgICAgICAgLnJlcGxhY2UoLyVwL2csIHBhdGggKyBSLmZvcm1hdFJlc3QocmVwb3J0KSkpXG59XG5cbmZ1bmN0aW9uIHByaW50TGluZXMoXywgdmFsdWUsIHNraXBGaXJzdCkge1xuICAgIHZhciBsaW5lcyA9IHZhbHVlLnNwbGl0KC9cXHI/XFxuL2cpXG5cbiAgICBpZiAoc2tpcEZpcnN0KSBsaW5lcy5zaGlmdCgpXG4gICAgcmV0dXJuIHBlYWNoKGxpbmVzLCBmdW5jdGlvbiAobGluZSkgeyByZXR1cm4gXy5wcmludChcIiAgICBcIiArIGxpbmUpIH0pXG59XG5cbmZ1bmN0aW9uIHByaW50UmF3KF8sIGtleSwgc3RyKSB7XG4gICAgaWYgKHNob3VsZEJyZWFrKGtleS5sZW5ndGgsIHN0cikpIHtcbiAgICAgICAgcmV0dXJuIF8ucHJpbnQoXCIgIFwiICsga2V5ICsgXCI6IHwtXCIpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIHByaW50TGluZXMoXywgc3RyLCBmYWxzZSkgfSlcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gXy5wcmludChcIiAgXCIgKyBrZXkgKyBcIjogXCIgKyBzdHIpXG4gICAgfVxufVxuXG5mdW5jdGlvbiBwcmludFZhbHVlKF8sIGtleSwgdmFsdWUpIHtcbiAgICByZXR1cm4gcHJpbnRSYXcoXywga2V5LCBpbnNwZWN0KHZhbHVlKSlcbn1cblxuZnVuY3Rpb24gcHJpbnRMaW5lKHAsIF8sIGxpbmUpIHtcbiAgICByZXR1cm4gcC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIF8ucHJpbnQobGluZSkgfSlcbn1cblxuZnVuY3Rpb24gcHJpbnRFcnJvcihfLCByZXBvcnQpIHtcbiAgICB2YXIgZXJyID0gcmVwb3J0LmVycm9yXG5cbiAgICBpZiAoIShlcnIgaW5zdGFuY2VvZiBFcnJvcikpIHtcbiAgICAgICAgcmV0dXJuIHByaW50VmFsdWUoXywgXCJ2YWx1ZVwiLCBlcnIpXG4gICAgfVxuXG4gICAgLy8gTGV0J3MgKm5vdCogZGVwZW5kIG9uIHRoZSBjb25zdHJ1Y3RvciBiZWluZyBUaGFsbGl1bSdzLi4uXG4gICAgaWYgKGVyci5uYW1lICE9PSBcIkFzc2VydGlvbkVycm9yXCIpIHtcbiAgICAgICAgcmV0dXJuIF8ucHJpbnQoXCIgIHN0YWNrOiB8LVwiKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBwcmludExpbmVzKF8sIFIuZ2V0U3RhY2soZXJyKSwgZmFsc2UpXG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgcmV0dXJuIHByaW50VmFsdWUoXywgXCJleHBlY3RlZFwiLCBlcnIuZXhwZWN0ZWQpXG4gICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gcHJpbnRWYWx1ZShfLCBcImFjdHVhbFwiLCBlcnIuYWN0dWFsKSB9KVxuICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIHByaW50UmF3KF8sIFwibWVzc2FnZVwiLCBlcnIubWVzc2FnZSkgfSlcbiAgICAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiBfLnByaW50KFwiICBzdGFjazogfC1cIikgfSlcbiAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBtZXNzYWdlID0gZXJyLm1lc3NhZ2VcblxuICAgICAgICBlcnIubWVzc2FnZSA9IFwiXCJcbiAgICAgICAgcmV0dXJuIHByaW50TGluZXMoXywgUi5nZXRTdGFjayhlcnIpLCB0cnVlKVxuICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7IGVyci5tZXNzYWdlID0gbWVzc2FnZSB9KVxuICAgIH0pXG59XG5cbm1vZHVsZS5leHBvcnRzID0gUi5vbihcInRhcFwiLCB7XG4gICAgYWNjZXB0czogW1wid3JpdGVcIiwgXCJyZXNldFwiXSxcbiAgICBjcmVhdGU6IFIuY29uc29sZVJlcG9ydGVyLFxuICAgIGluaXQ6IGZ1bmN0aW9uIChzdGF0ZSkgeyBzdGF0ZS5jb3VudGVyID0gMCB9LFxuXG4gICAgcmVwb3J0OiBmdW5jdGlvbiAoXywgcmVwb3J0KSB7XG4gICAgICAgIGlmIChyZXBvcnQuaXNTdGFydCkge1xuICAgICAgICAgICAgcmV0dXJuIF8ucHJpbnQoXCJUQVAgdmVyc2lvbiAxM1wiKVxuICAgICAgICB9IGVsc2UgaWYgKHJlcG9ydC5pc0VudGVyKSB7XG4gICAgICAgICAgICAvLyBQcmludCBhIGxlYWRpbmcgY29tbWVudCwgdG8gbWFrZSBzb21lIFRBUCBmb3JtYXR0ZXJzIHByZXR0aWVyLlxuICAgICAgICAgICAgcmV0dXJuIHRlbXBsYXRlKF8sIHJlcG9ydCwgXCIjICVwXCIsIHRydWUpXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiB0ZW1wbGF0ZShfLCByZXBvcnQsIFwib2sgJWNcIikgfSlcbiAgICAgICAgfSBlbHNlIGlmIChyZXBvcnQuaXNQYXNzKSB7XG4gICAgICAgICAgICByZXR1cm4gdGVtcGxhdGUoXywgcmVwb3J0LCBcIm9rICVjICVwXCIpXG4gICAgICAgIH0gZWxzZSBpZiAocmVwb3J0LmlzRmFpbCB8fCByZXBvcnQuaXNIb29rKSB7XG4gICAgICAgICAgICByZXR1cm4gdGVtcGxhdGUoXywgcmVwb3J0LCBcIm5vdCBvayAlYyAlcFwiKVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gXy5wcmludChcIiAgLS0tXCIpIH0pXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiBwcmludEVycm9yKF8sIHJlcG9ydCkgfSlcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIF8ucHJpbnQoXCIgIC4uLlwiKSB9KVxuICAgICAgICB9IGVsc2UgaWYgKHJlcG9ydC5pc1NraXApIHtcbiAgICAgICAgICAgIHJldHVybiB0ZW1wbGF0ZShfLCByZXBvcnQsIFwib2sgJWMgIyBza2lwICVwXCIpXG4gICAgICAgIH0gZWxzZSBpZiAocmVwb3J0LmlzRW5kKSB7XG4gICAgICAgICAgICB2YXIgcCA9IF8ucHJpbnQoXCIxLi5cIiArIF8uc3RhdGUuY291bnRlcilcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIF8ucHJpbnQoXCIjIHRlc3RzIFwiICsgXy50ZXN0cykgfSlcblxuICAgICAgICAgICAgaWYgKF8ucGFzcykgcCA9IHByaW50TGluZShwLCBfLCBcIiMgcGFzcyBcIiArIF8ucGFzcylcbiAgICAgICAgICAgIGlmIChfLmZhaWwpIHAgPSBwcmludExpbmUocCwgXywgXCIjIGZhaWwgXCIgKyBfLmZhaWwpXG4gICAgICAgICAgICBpZiAoXy5za2lwKSBwID0gcHJpbnRMaW5lKHAsIF8sIFwiIyBza2lwIFwiICsgXy5za2lwKVxuICAgICAgICAgICAgcmV0dXJuIHByaW50TGluZShwLCBfLCBcIiMgZHVyYXRpb24gXCIgKyBSLmZvcm1hdFRpbWUoXy5kdXJhdGlvbikpXG4gICAgICAgIH0gZWxzZSBpZiAocmVwb3J0LmlzRXJyb3IpIHtcbiAgICAgICAgICAgIHJldHVybiBfLnByaW50KFwiQmFpbCBvdXQhXCIpXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiBfLnByaW50KFwiICAtLS1cIikgfSlcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIHByaW50RXJyb3IoXywgcmVwb3J0KSB9KVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gXy5wcmludChcIiAgLi4uXCIpIH0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgICAgIH1cbiAgICB9LFxufSlcbiIsIlwidXNlIHN0cmljdFwiXG5cbi8qKlxuICogVGhpcyBpcyB0aGUgZW50cnkgcG9pbnQgZm9yIHRoZSBCcm93c2VyaWZ5IGJ1bmRsZS4gTm90ZSB0aGF0IGl0ICphbHNvKiB3aWxsXG4gKiBydW4gYXMgcGFydCBvZiB0aGUgdGVzdHMgaW4gTm9kZSAodW5idW5kbGVkKSwgYW5kIGl0IHRoZW9yZXRpY2FsbHkgY291bGQgYmVcbiAqIHJ1biBpbiBOb2RlIG9yIGEgcnVudGltZSBsaW1pdGVkIHRvIG9ubHkgRVM1IHN1cHBvcnQgKGUuZy4gUmhpbm8sIE5hc2hvcm4sIG9yXG4gKiBlbWJlZGRlZCBWOCksIHNvIGRvICpub3QqIGFzc3VtZSBicm93c2VyIGdsb2JhbHMgYXJlIHByZXNlbnQuXG4gKi9cblxuZXhwb3J0cy50ID0gcmVxdWlyZShcIi4uL2luZGV4XCIpXG5leHBvcnRzLmFzc2VydCA9IHJlcXVpcmUoXCIuLi9hc3NlcnRcIilcbmV4cG9ydHMubWF0Y2ggPSByZXF1aXJlKFwiLi4vbWF0Y2hcIilcbmV4cG9ydHMuciA9IHJlcXVpcmUoXCIuLi9yXCIpXG5cbnZhciBJbnRlcm5hbCA9IHJlcXVpcmUoXCIuLi9pbnRlcm5hbFwiKVxuXG5leHBvcnRzLnJvb3QgPSBJbnRlcm5hbC5yb290XG5leHBvcnRzLnJlcG9ydHMgPSBJbnRlcm5hbC5yZXBvcnRzXG5leHBvcnRzLmhvb2tFcnJvcnMgPSBJbnRlcm5hbC5ob29rRXJyb3JzXG5leHBvcnRzLmxvY2F0aW9uID0gSW50ZXJuYWwubG9jYXRpb25cblxuLy8gSW4gY2FzZSB0aGUgdXNlciBuZWVkcyB0byBhZGp1c3QgdGhpcyAoZS5nLiBOYXNob3JuICsgY29uc29sZSBvdXRwdXQpLlxudmFyIFNldHRpbmdzID0gcmVxdWlyZShcIi4vc2V0dGluZ3NcIilcblxuZXhwb3J0cy5zZXR0aW5ncyA9IHtcbiAgICB3aW5kb3dXaWR0aDoge1xuICAgICAgICBnZXQ6IFNldHRpbmdzLndpbmRvd1dpZHRoLFxuICAgICAgICBzZXQ6IFNldHRpbmdzLnNldFdpbmRvd1dpZHRoLFxuICAgIH0sXG5cbiAgICBuZXdsaW5lOiB7XG4gICAgICAgIGdldDogU2V0dGluZ3MubmV3bGluZSxcbiAgICAgICAgc2V0OiBTZXR0aW5ncy5zZXROZXdsaW5lLFxuICAgIH0sXG5cbiAgICBzeW1ib2xzOiB7XG4gICAgICAgIGdldDogU2V0dGluZ3Muc3ltYm9scyxcbiAgICAgICAgc2V0OiBTZXR0aW5ncy5zZXRTeW1ib2xzLFxuICAgIH0sXG5cbiAgICBkZWZhdWx0T3B0czoge1xuICAgICAgICBnZXQ6IFNldHRpbmdzLmRlZmF1bHRPcHRzLFxuICAgICAgICBzZXQ6IFNldHRpbmdzLnNldERlZmF1bHRPcHRzLFxuICAgIH0sXG5cbiAgICBjb2xvclN1cHBvcnQ6IHtcbiAgICAgICAgZ2V0OiBTZXR0aW5ncy5Db2xvcnMuZ2V0U3VwcG9ydCxcbiAgICAgICAgc2V0OiBTZXR0aW5ncy5Db2xvcnMuc2V0U3VwcG9ydCxcbiAgICB9LFxufVxuIl19
