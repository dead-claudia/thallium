"use strict"

/**
 * Core TDD-style assertions. These are done by a composition of DSLs, since
 * there is *so* much repetition.
 */

var match = require("./match.js")
var inspect = require("./lib/replaced/inspect.js")
var Errors = require("./lib/errors.js")

var hasOwn = Object.prototype.hasOwnProperty

/* eslint-disable no-self-compare */
// For better NaN handling
function strictIs(a, b) {
    return a === b || a !== a && b !== b
}

function looseIs(a, b) {
    return a == b || a !== a && b !== b // eslint-disable-line eqeqeq
}

/* eslint-enable no-self-compare */

var templateRegexp = /(.?)\{(.+?)\}/g

exports.escape = escapeFormat
function escapeFormat(string) {
    return string.replace(templateRegexp, function (m, pre) {
        return pre + "\\" + m.slice(1)
    })
}

// This formats the assertion error messages.
exports.format = format
function format(message, object) {
    return message.replace(templateRegexp, function (m, pre, prop) {
        if (pre === "\\") {
            return m.slice(1)
        } else if (hasOwn.call(object, prop)) {
            return pre + inspect(object[prop], {depth: null})
        } else {
            return pre + m
        }
    })
}

var AssertionError = exports.AssertionError = Errors.defineError([
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

function fail(message, args) {
    throw new AssertionError(format(message, args), args.expected, args.actual)
}

// The basic assert. It's almost there for looks, given how easy it is to
// define your own assertions.
exports.assert = function (test, message) {
    if (!test) throw new AssertionError(message, undefined, undefined)
}

exports.fail = function (message, expected, actual) {
    throw new AssertionError(message || "unspecified", expected, actual)
}

exports.failFormat = fail

exports.ok = function (x) {
    if (!x) fail("Expected {actual} to be truthy", {actual: x})
}

exports.notOk = function (x) {
    if (x) fail("Expected {actual} to be falsy", {actual: x})
}

exports.boolean = function (x) {
    if (typeof x !== "boolean") {
        fail("Expected {actual} to be a boolean", {actual: x})
    }
}

exports.notBoolean = function (x) {
    if (typeof x === "boolean") {
        fail("Expected {actual} to not be a boolean", {actual: x})
    }
}

exports.function = function (x) {
    if (typeof x !== "function") {
        fail("Expected {actual} to be a function", {actual: x})
    }
}

exports.notFunction = function (x) {
    if (typeof x === "function") {
        fail("Expected {actual} to not be a function", {actual: x})
    }
}

exports.number = function (x) {
    if (typeof x !== "number") {
        fail("Expected {actual} to be a number", {actual: x})
    }
}

exports.notNumber = function (x) {
    if (typeof x === "number") {
        fail("Expected {actual} to not be a number", {actual: x})
    }
}

exports.object = function (x) {
    if (typeof x !== "object" || x == null) {
        fail("Expected {actual} to be an object", {actual: x})
    }
}

exports.notObject = function (x) {
    if (typeof x === "object" && x != null) {
        fail("Expected {actual} to not be an object", {actual: x})
    }
}

exports.objectOrNull = function (x) {
    if (typeof x !== "object") {
        fail("Expected {actual} to be an object or `null`", {actual: x})
    }
}

exports.notObjectOrNull = function (x) {
    if (typeof x === "object") {
        fail("Expected {actual} to not be an object or `null`", {actual: x})
    }
}

exports.string = function (x) {
    if (typeof x !== "string") {
        fail("Expected {actual} to be a string", {actual: x})
    }
}

exports.notString = function (x) {
    if (typeof x === "string") {
        fail("Expected {actual} to not be a string", {actual: x})
    }
}

exports.symbol = function (x) {
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

exports.array = function (x) {
    if (!Array.isArray(x)) {
        fail("Expected {actual} to be an array", {actual: x})
    }
}

exports.notArray = function (x) {
    if (Array.isArray(x)) {
        fail("Expected {actual} to not be an array", {actual: x})
    }
}

function isTypeof(value) {
    return value === "boolean" || value === "function" || value === "number" ||
        value === "object" || value === "string" || value === "symbol" ||
        value === "undefined"
}

exports.type = function (object, type) {
    if (!isTypeof(type)) {
        throw new TypeError("`type` must be a valid `typeof` operand")
    }

    if (typeof object !== type) {
        fail("Expected typeof {object} to be {expected}", {
            object: object,
            expected: type,
            actual: typeof object,
        })
    }
}

exports.notType = function (object, type) {
    if (!isTypeof(type)) {
        throw new TypeError("`type` must be a valid `typeof` operand")
    }

    if (typeof object === type) {
        fail("Expected typeof {object} to not be {expected}", {
            object: object,
            expected: type,
        })
    }
}

exports.inherits = function (object, Type) {
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

exports.notInherits = function (object, Type) {
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
            fail(message, {actual: actual, expected: expected})
        }
    }
}

exports.equal = binary(false,
    function (a, b) { return strictIs(a, b) },
    "Expected {actual} to equal {expected}")

exports.notEqual = binary(false,
    function (a, b) { return !strictIs(a, b) },
    "Expected {actual} to not equal {expected}")

exports.equalLoose = binary(false,
    function (a, b) { return looseIs(a, b) },
    "Expected {actual} to loosely equal {expected}")

exports.notEqualLoose = binary(false,
    function (a, b) { return !looseIs(a, b) },
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
        fail("Expected {actual} to be between {lower} and {upper}", {
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

function has(_) { // eslint-disable-line max-len, max-params
    return function (object, key, value) {
        if (arguments.length >= 3) {
            if (!_.has(object, key) || !strictIs(_.get(object, key), value)) {
                fail(_.messages[0], {
                    expected: value,
                    actual: object[key],
                    key: key,
                    object: object,
                })
            }
        } else if (!_.has(object, key)) {
            fail(_.messages[1], {
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
        if (!_.has(object, key) || !looseIs(_.get(object, key), value)) {
            fail(_.messages[0], {
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
            if (_.has(object, key) && strictIs(_.get(object, key), value)) {
                fail(_.messages[2], {
                    expected: value,
                    actual: object[key],
                    key: key,
                    object: object,
                })
            }
        } else if (_.has(object, key)) {
            fail(_.messages[3], {
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
        if (_.has(object, key) && looseIs(_.get(object, key), value)) {
            fail(_.messages[2], {
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

function getName(func) {
    var name = func.name

    if (name == null) name = func.displayName
    if (name) return escapeFormat(name)
    return "<anonymous>"
}

exports.throws = function (callback, Type) {
    if (typeof callback !== "function") {
        throw new TypeError("`callback` must be a function")
    }

    if (Type != null && typeof Type !== "function") {
        throw new TypeError("`Type` must be a function if it exists")
    }

    try {
        callback() // eslint-disable-line callback-return
    } catch (e) {
        if (Type != null && !(e instanceof Type)) {
            fail(
                "Expected callback to throw an instance of " + getName(Type) +
                ", but found {actual}",
                {actual: e})
        }
        return
    }

    throw new AssertionError("Expected callback to throw", undefined, undefined)
}

exports.notThrows = function (callback, Type) {
    if (typeof callback !== "function") {
        throw new TypeError("`callback` must be a function")
    }

    // Actually be useful.
    if (Type == null) {
        throw new TypeError(
            "`Type` must be a function. If you just intend to verify no " +
            "error is thrown, regardless of type, just call the callback " +
            "directly, etc.")
    }

    if (typeof Type !== "function") {
        throw new TypeError("`Type` must be a function")
    }

    try {
        callback() // eslint-disable-line callback-return
    } catch (e) {
        if (e instanceof Type) {
            fail(
                "Expected callback to not throw an instance of " +
                getName(Type) + ", but found {actual}",
                {actual: e})
        }
    }
}

function throwsMatchTest(matcher, e) {
    if (typeof matcher === "string") return e.message === matcher
    if (typeof matcher === "function") return !!matcher(e)
    return !!matcher.test(e.message)
}

function throwsMatch(callback, matcher, invert) {
    if (typeof callback !== "function") {
        throw new TypeError("`callback` must be a function")
    }

    // Not accepting objects yet.
    if (typeof matcher !== "string" &&
            typeof matcher !== "function" &&
            !(matcher instanceof RegExp)) {
        throw new TypeError("`matcher` must be a string, RegExp, or function")
    }

    try {
        callback() // eslint-disable-line callback-return
    } catch (e) {
        if (invert === throwsMatchTest(matcher, e)) {
            fail(
                "Expected callback to " + (invert ? "not" : "") + " throw an " +
                "error that matches {expected}, but found {actual}",
                {expected: matcher, actual: e})
        }
        return
    }

    if (!invert) {
        throw new AssertionError(
            "Expected callback to throw",
            undefined, undefined)
    }
}

exports.throwsMatch = function (callback, matcher) {
    return throwsMatch(callback, matcher, false)
}

exports.notThrowsMatch = function (callback, matcher) {
    return throwsMatch(callback, matcher, true)
}

function len(compare, message) {
    return function (object, length) {
        if (typeof length !== "number") {
            throw new TypeError("`length` must be a number")
        }

        var found = object.length

        if (!compare(+found, length)) {
            fail(message, {
                expected: length,
                actual: found,
                object: object,
            })
        }
    }
}

// Note: these always fail with NaNs.
exports.length = len(
    function (a, b) { return a === b },
    "Expected {object} to have length {expected}, but found {actual}")

exports.notLength = len(
    function (a, b) { return a !== b && a === a && b === b }, // eslint-disable-line max-len, no-self-compare
    "Expected {object} to not have length {actual}")

exports.lengthAtLeast = len(
    function (a, b) { return a >= b },
    "Expected {object} to have length at least {expected}, but found {actual}")

exports.lengthAtMost = len(
    function (a, b) { return a <= b },
    "Expected {object} to have length at most {expected}, but found {actual}")

exports.lengthAbove = len(
    function (a, b) { return a > b },
    "Expected {object} to have length above {expected}, but found {actual}")

exports.lengthBelow = len(
    function (a, b) { return a < b },
    "Expected {object} to have length below {expected}, but found {actual}")

// Note: these two always fail when dealing with NaNs.
exports.closeTo = function (actual, expected, delta) {
    if (typeof actual !== "number") {
        throw new TypeError("`actual` must be a number")
    }

    if (typeof expected !== "number") {
        throw new TypeError("`expected` must be a number")
    }

    if (typeof delta !== "number") {
        throw new TypeError("`delta` must be a number")
    }

    // The negation is to address NaNs as well, without writing a ton of special
    // case boilerplate
    if (!(Math.abs(actual - expected) <= Math.abs(delta))) {
        fail("Expected {actual} to be within {delta} of {expected}", {
            actual: actual,
            expected: expected,
            delta: delta,
        })
    }
}

exports.notCloseTo = function (actual, expected, delta) {
    if (typeof actual !== "number") {
        throw new TypeError("`actual` must be a number")
    }

    if (typeof expected !== "number") {
        throw new TypeError("`expected` must be a number")
    }

    if (typeof delta !== "number") {
        throw new TypeError("`delta` must be a number")
    }

    // The negation is to address NaNs as well, without writing a ton of special
    // case boilerplate
    if (!(Math.abs(actual - expected) > Math.abs(delta))) {
        fail("Expected {actual} to not be within {delta} of {expected}", {
            actual: actual,
            expected: expected,
            delta: delta,
        })
    }
}

/* eslint-disable max-len */

/**
 * There's 4 sets of 4 permutations here for `includes` and `hasKeys`, instead
 * of N sets of 2 (which would fit the `foo`/`notFoo` idiom better), so it's
 * easier to just make a couple separate DSLs and use that to define everything.
 *
 * Here's the top level:
 *
 * - strict shallow
 * - loose shallow
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
 * Here's an example using the naming scheme for `hasKeys`, etc.
 *
 *               | strict shallow  |    loose shallow     |     strict deep     |     structural deep
 * --------------|-----------------|----------------------|---------------------|-------------------------
 * includes all  | `hasKeys`       | `hasLooseKeys`       | `hasDeepKeys`       | `hasMatchKeys`
 * includes some | `hasAnyKeys`    | `hasLooseAnyKeys`    | `hasDeepAnyKeys`    | `hasMatchKeys`
 * missing some  | `notHasAllKeys` | `notHasLooseAllKeys` | `notHasDeepAllKeys` | `notHasMatchAllKeys`
 * missing all   | `notHasKeys`    | `notHasLooseKeys`    | `notHasDeepKeys`    | `notHasMatchKeys`
 *
 * Note that the `hasKeys` shallow comparison variants are also overloaded to
 * consume either an array (in which it simply checks against a list of keys) or
 * an object (where it does a full deep comparison).
 */

/* eslint-enable max-len */

function makeIncludes(all, func) {
    return function (array, keys) {
        function test(key) {
            for (var i = 0; i < array.length; i++) {
                if (func(key, array[i])) return true
            }
            return false
        }

        if (all) {
            if (array.length < keys.length) return false

            for (var i = 0; i < keys.length; i++) {
                if (!test(keys[i])) return false
            }
            return true
        } else {
            for (var j = 0; j < keys.length; j++) {
                if (test(keys[j])) return true
            }
            return false
        }
    }
}

function defineIncludes(func, invert, message) {
    function base(array, values) {
        // Cheap cases first
        if (!Array.isArray(array)) return false
        if (array === values) return true
        return func(array, values)
    }

    return function (array, values) {
        if (!Array.isArray(array)) {
            throw new TypeError("`array` must be an array")
        }

        if (!Array.isArray(values)) values = [values]

        // exclusive or to invert the result if `invert` is true
        if (values.length && invert ^ !base(array, values)) {
            fail(message, {actual: array, values: values})
        }
    }
}

var includesAll = makeIncludes(true, strictIs)
var includesAny = makeIncludes(false, strictIs)

/* eslint-disable max-len */

exports.includes = defineIncludes(includesAll, false, "Expected {actual} to have all values in {values}")
exports.notIncludesAll = defineIncludes(includesAll, true, "Expected {actual} to not have all values in {values}")
exports.includesAny = defineIncludes(includesAny, false, "Expected {actual} to have any value in {values}")
exports.notIncludes = defineIncludes(includesAny, true, "Expected {actual} to not have any value in {values}")

var includesLooseAll = makeIncludes(true, looseIs)
var includesLooseAny = makeIncludes(false, looseIs)

exports.includesLoose = defineIncludes(includesLooseAll, false, "Expected {actual} to loosely have all values in {values}")
exports.notIncludesLooseAll = defineIncludes(includesLooseAll, true, "Expected {actual} to not loosely have all values in {values}")
exports.includesLooseAny = defineIncludes(includesLooseAny, false, "Expected {actual} to loosely have any value in {values}")
exports.notIncludesLoose = defineIncludes(includesLooseAny, true, "Expected {actual} to not loosely have any value in {values}")

var includesDeepAll = makeIncludes(true, match.strict)
var includesDeepAny = makeIncludes(false, match.strict)

exports.includesDeep = defineIncludes(includesDeepAll, false, "Expected {actual} to match all values in {values}")
exports.notIncludesDeepAll = defineIncludes(includesDeepAll, true, "Expected {actual} to not match all values in {values}")
exports.includesDeepAny = defineIncludes(includesDeepAny, false, "Expected {actual} to match any value in {values}")
exports.notIncludesDeep = defineIncludes(includesDeepAny, true, "Expected {actual} to not match any value in {values}")

var includesMatchAll = makeIncludes(true, match.match)
var includesMatchAny = makeIncludes(false, match.match)

exports.includesMatch = defineIncludes(includesMatchAll, false, "Expected {actual} to match all values in {values}")
exports.notIncludesMatchAll = defineIncludes(includesMatchAll, true, "Expected {actual} to not match all values in {values}")
exports.includesMatchAny = defineIncludes(includesMatchAny, false, "Expected {actual} to match any value in {values}")
exports.notIncludesMatch = defineIncludes(includesMatchAny, true, "Expected {actual} to not match any value in {values}")

/* eslint-enable max-len */

function isEmpty(object) {
    if (Array.isArray(object)) return object.length === 0
    if (typeof object !== "object" || object === null) return true
    return Object.keys(object).length === 0
}

function makeHasOverload(methods, invert, message) {
    function base(object, keys) {
        // Cheap case first
        if (object === keys) return true
        if (Array.isArray(keys)) return methods.array(object, keys)
        return methods.object(object, keys)
    }

    if (invert) {
        return function (object, keys) {
            if (typeof object !== "object" || object == null) {
                throw new TypeError("`object` must be a number")
            }

            if (!isEmpty(keys) && base(object, keys)) {
                fail(message, {actual: object, keys: keys})
            }
        }
    } else {
        return function (object, keys) {
            if (typeof object !== "object" || object == null) {
                throw new TypeError("`object` must be a number")
            }

            if (!isEmpty(keys) && !base(object, keys)) {
                fail(message, {actual: object, keys: keys})
            }
        }
    }
}

function makeHasKeys(func, invert, message) {
    if (invert) {
        return function (object, keys) {
            if (typeof object !== "object" || object == null) {
                throw new TypeError("`object` must be a number")
            }

            // exclusive or to invert the result if `invert` is true
            if (!isEmpty(keys) && (object === keys || func(object, keys))) {
                fail(message, {actual: object, keys: keys})
            }
        }
    } else {
        return function (object, keys) {
            if (typeof object !== "object" || object == null) {
                throw new TypeError("`object` must be a number")
            }

            // exclusive or to invert the result if `invert` is true
            if (!isEmpty(keys) && object !== keys && !func(object, keys)) {
                fail(message, {actual: object, keys: keys})
            }
        }
    }
}

function hasKeysType(all, func) {
    return function (object, keys) {
        if (typeof keys !== "object") return true
        if (keys === null) return true

        function check(key) {
            return hasOwn.call(object, key) && func(keys[key], object[key])
        }

        if (all) {
            for (var key1 in keys) {
                if (hasOwn.call(keys, key1) && !check(key1)) {
                    return false
                }
            }
            return true
        } else {
            for (var key2 in keys) {
                if (hasOwn.call(keys, key2) && check(key2)) {
                    return true
                }
            }
            return false
        }
    }
}

function hasOverloadType(all, func) {
    return {
        object: hasKeysType(all, func),
        array: function (object, keys) {
            if (all) {
                for (var i = 0; i < keys.length; i++) {
                    if (!hasOwn.call(object, keys[i])) return false
                }
                return true
            } else {
                for (var j = 0; j < keys.length; j++) {
                    if (hasOwn.call(object, keys[j])) return true
                }
                return false
            }
        },
    }
}

/* eslint-disable max-len */

var hasAllKeys = hasOverloadType(true, strictIs)
var hasAnyKeys = hasOverloadType(false, strictIs)

exports.hasKeys = makeHasOverload(hasAllKeys, false, "Expected {actual} to have all keys in {keys}")
exports.notHasAllKeys = makeHasOverload(hasAllKeys, true, "Expected {actual} to not have all keys in {keys}")
exports.hasAnyKeys = makeHasOverload(hasAnyKeys, false, "Expected {actual} to have any key in {keys}")
exports.notHasKeys = makeHasOverload(hasAnyKeys, true, "Expected {actual} to not have any key in {keys}")

var hasLooseAllKeys = hasOverloadType(true, looseIs)
var hasLooseAnyKeys = hasOverloadType(false, looseIs)

exports.hasLooseKeys = makeHasOverload(hasLooseAllKeys, false, "Expected {actual} to loosely have all keys in {keys}")
exports.notHasLooseAllKeys = makeHasOverload(hasLooseAllKeys, true, "Expected {actual} to not loosely have all keys in {keys}")
exports.hasLooseAnyKeys = makeHasOverload(hasLooseAnyKeys, false, "Expected {actual} to loosely have any key in {keys}")
exports.notHasLooseKeys = makeHasOverload(hasLooseAnyKeys, true, "Expected {actual} to not loosely have any key in {keys}")

var hasDeepAllKeys = hasKeysType(true, match.strict)
var hasDeepAnyKeys = hasKeysType(false, match.strict)

exports.hasDeepKeys = makeHasKeys(hasDeepAllKeys, false, "Expected {actual} to have all keys in {keys}")
exports.notHasDeepAllKeys = makeHasKeys(hasDeepAllKeys, true, "Expected {actual} to not have all keys in {keys}")
exports.hasDeepAnyKeys = makeHasKeys(hasDeepAnyKeys, false, "Expected {actual} to have any key in {keys}")
exports.notHasDeepKeys = makeHasKeys(hasDeepAnyKeys, true, "Expected {actual} to not have any key in {keys}")

var hasMatchAllKeys = hasKeysType(true, match.match)
var hasMatchAnyKeys = hasKeysType(false, match.match)

exports.hasMatchKeys = makeHasKeys(hasMatchAllKeys, false, "Expected {actual} to match all keys in {keys}")
exports.notHasMatchAllKeys = makeHasKeys(hasMatchAllKeys, true, "Expected {actual} to not match all keys in {keys}")
exports.hasMatchAnyKeys = makeHasKeys(hasMatchAnyKeys, false, "Expected {actual} to match any key in {keys}")
exports.notHasMatchKeys = makeHasKeys(hasMatchAnyKeys, true, "Expected {actual} to not match any key in {keys}")
