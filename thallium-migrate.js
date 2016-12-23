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

},{"./lib/assert/equal":8,"./lib/assert/has":10,"./lib/assert/has-keys":9,"./lib/assert/includes":11,"./lib/assert/throws":12,"./lib/assert/type":13,"./lib/assert/util":14}],2:[function(require,module,exports){
"use strict"

/**
 * Core TDD-style assertions. These are done by a composition of DSLs, since
 * there is *so* much repetition.
 */

var match = require("./match")
var deprecate = require("./migrate/common").deprecate

var toString = Object.prototype.toString
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

var check = (function () {
    function prefix(type) {
        return (/^[aeiou]/.test(type) ? "an " : "a ") + type
    }

    function check(value, type) {
        if (type === "array") return Array.isArray(value)
        if (type === "regexp") return toString.call(value) === "[object RegExp]"
        if (type === "object") return value != null && typeof value === "object"
        if (type === "null") return value === null
        if (type === "none") return value == null
        return typeof value === type
    }

    function checkList(value, types) {
        for (var i = 0; i < types.length; i++) {
            if (check(value, types[i])) return true
        }

        return false
    }

    function checkSingle(value, name, type) {
        if (!check(value, type)) {
            throw new TypeError("`" + name + "` must be " + prefix(type))
        }
    }

    function checkMany(value, name, types) {
        if (!checkList(value, types)) {
            var str = "`" + name + "` must be either"

            if (types.length === 2) {
                str += prefix(types[0]) + " or " + prefix(types[1])
            } else {
                str += prefix(types[0])

                var end = types.length - 1

                for (var i = 1; i < end; i++) {
                    str += ", " + prefix(types[i])
                }

                str += ", or " + prefix(types[end])
            }

            throw new TypeError(str)
        }
    }

    return function (value, name, type) {
        if (!Array.isArray(type)) return checkSingle(value, name, type)
        if (type.length === 1) return checkSingle(value, name, type[0])
        return checkMany(value, name, type)
    }
})()

function checkTypeOf(value, name) {
    if (value === "boolean" || value === "function") return
    if (value === "number" || value === "object" || value === "string") return
    if (value === "symbol" || value === "undefined") return
    throw new TypeError("`" + name + "` must be a valid `typeof` value")
}

// This holds everything to be added.
var methods = []
var aliases = []

function getAssertionDeprecation(name) {
    var replacement = name

    switch (name) {
    case "boolean": replacement = "isBoolean"; break
    case "function": replacement = "isFunction"; break
    case "number": replacement = "isNumber"; break
    case "object": replacement = "isObject"; break
    case "string": replacement = "isString"; break
    case "symbol": replacement = "isSymbol"; break
    case "instanceof": replacement = "is"; break
    case "notInstanceof": replacement = "not"; break
    case "hasLength": replacement = "equal"; break
    case "notLength": replacement = "notEqual"; break
    case "lengthAtLeast": replacement = "atLeast"; break
    case "lengthAtMost": replacement = "atMost"; break
    case "lengthAbove": replacement = "above"; break
    case "lengthBelow": replacement = "below"; break
    case "notIncludesAll": replacement = "notIncludesAll"; break
    case "notIncludesLooseAll": replacement = "notIncludesAll"; break
    case "notIncludesDeepAll": replacement = "notIncludesAllDeep"; break
    case "notIncludesMatchAll": replacement = "notIncludesAllMatch"; break
    case "includesAny": replacement = "includesAny"; break
    case "includesLooseAny": replacement = "includesAny"; break
    case "includesDeepAny": replacement = "includesAnyDeep"; break
    case "includesMatchAny": replacement = "includesAnyMatch"; break
    case "undefined":
        return "`t.undefined()` is deprecated. Use " +
            "`assert.equal(undefined, value)`. from `thallium/assert` instead."
    case "type":
        return "`t.type()` is deprecated. Use `assert.isBoolean()`/etc. from " +
            "`thallium/assert` instead."
    default: // ignore
    }

    return "`t." + name + "()` is deprecated. Use `assert." + replacement +
        "()` from `thallium/assert` instead."
}

/**
 * The core assertions export, as a plugin.
 */
module.exports = function (t) {
    methods.forEach(function (m) {
        t.define(m.name, deprecate(getAssertionDeprecation(m.name), m.callback))
    })
    aliases.forEach(function (alias) { t[alias.name] = t[alias.original] })
}

// Little helpers so that these functions only need to be created once.
function define(name, callback) {
    check(name, "name", "string")
    check(callback, "callback", "function")
    methods.push({name: name, callback: callback})
}

// Much easier to type
function negate(name) {
    check(name, "name", "string")
    return "not" + name[0].toUpperCase() + name.slice(1)
}

// The basic assert. It's almost there for looks, given how easy it is to
// define your own assertions.
function sanitize(message) {
    return message ? String(message).replace(/(\{\w+\})/g, "\\$1") : ""
}

define("assert", function (test, message) {
    return {test: test, message: sanitize(message)}
})

define("fail", function (message) {
    return {test: false, message: sanitize(message)}
})

/**
 * These makes many of the common operators much easier to do.
 */
function unary(name, func, messages) {
    define(name, function (value) {
        return {
            test: func(value),
            actual: value,
            message: messages[0],
        }
    })

    define(negate(name), function (value) {
        return {
            test: !func(value),
            actual: value,
            message: messages[1],
        }
    })
}

function binary(name, func, messages) {
    define(name, function (actual, expected) {
        return {
            test: func(actual, expected),
            actual: actual,
            expected: expected,
            message: messages[0],
        }
    })

    define(negate(name), function (actual, expected) {
        return {
            test: !func(actual, expected),
            actual: actual,
            expected: expected,
            message: messages[1],
        }
    })
}

unary("ok", function (x) { return !!x }, [
    "Expected {actual} to be ok",
    "Expected {actual} to not be ok",
])

"boolean function number object string symbol".split(" ")
.forEach(function (type) {
    var name = (type[0] === "o" ? "an " : "a ") + type

    unary(type, function (x) { return typeof x === type }, [
        "Expected {actual} to be " + name,
        "Expected {actual} to not be " + name,
    ])
})

;[true, false, null, undefined].forEach(function (value) {
    unary(value + "", function (x) { return x === value }, [
        "Expected {actual} to be " + value,
        "Expected {actual} to not be " + value,
    ])
})

unary("exists", function (x) { return x != null }, [
    "Expected {actual} to exist",
    "Expected {actual} to not exist",
])

unary("array", Array.isArray, [
    "Expected {actual} to be an array",
    "Expected {actual} to not be an array",
])

define("type", function (object, type) {
    checkTypeOf(type, "type")

    return {
        test: typeof object === type,
        expected: type,
        actual: typeof object,
        o: object,
        message: "Expected typeof {o} to be {expected}, but found {actual}",
    }
})

define("notType", function (object, type) {
    checkTypeOf(type, "type")

    return {
        test: typeof object !== type,
        expected: type,
        o: object,
        message: "Expected typeof {o} to not be {expected}",
    }
})

define("instanceof", function (object, Type) {
    check(Type, "Type", "function")

    return {
        test: object instanceof Type,
        expected: Type,
        actual: object.constructor,
        o: object,
        message: "Expected {o} to be an instance of {expected}, but found {actual}", // eslint-disable-line max-len
    }
})

define("notInstanceof", function (object, Type) {
    check(Type, "Type", "function")

    return {
        test: !(object instanceof Type),
        expected: Type,
        o: object,
        message: "Expected {o} to not be an instance of {expected}",
    }
})

binary("equal", strictIs, [
    "Expected {actual} to equal {expected}",
    "Expected {actual} to not equal {expected}",
])

binary("equalLoose", looseIs, [
    "Expected {actual} to loosely equal {expected}",
    "Expected {actual} to not loosely equal {expected}",
])

function comp(name, compare, message) {
    define(name, function (actual, expected) {
        check(actual, "actual", "number")
        check(expected, "expected", "number")

        return {
            test: compare(actual, expected),
            actual: actual,
            expected: expected,
            message: message,
        }
    })
}

/* eslint-disable max-len */

comp("atLeast", function (a, b) { return a >= b }, "Expected {actual} to be at least {expected}")
comp("atMost", function (a, b) { return a <= b }, "Expected {actual} to be at most {expected}")
comp("above", function (a, b) { return a > b }, "Expected {actual} to be above {expected}")
comp("below", function (a, b) { return a < b }, "Expected {actual} to be below {expected}")

define("between", function (actual, lower, upper) {
    check(actual, "actual", "number")
    check(lower, "lower", "number")
    check(upper, "upper", "number")

    return {
        test: actual >= lower && actual <= upper,
        actual: actual,
        lower: lower,
        upper: upper,
        message: "Expected {actual} to be between {lower} and {upper}",
    }
})

/* eslint-enable max-len */

binary("deepEqual", match.strict, [
    "Expected {actual} to deeply equal {expected}",
    "Expected {actual} to not deeply equal {expected}",
])

binary("match", match.match, [
    "Expected {actual} to match {expected}",
    "Expected {actual} to not match {expected}",
])

function has(name, _) { // eslint-disable-line max-len, max-params
    if (_.equals === looseIs) {
        define(name, function (object, key, value) {
            return {
                test: _.has(object, key) && _.is(_.get(object, key), value),
                expected: value,
                actual: object[key],
                key: key,
                object: object,
                message: _.messages[0],
            }
        })

        define(negate(name), function (object, key, value) {
            return {
                test: !_.has(object, key) || !_.is(_.get(object, key), value),
                actual: value,
                key: key,
                object: object,
                message: _.messages[2],
            }
        })
    } else {
        define(name, function (object, key, value) {
            var test = _.has(object, key)

            if (arguments.length >= 3) {
                return {
                    test: test && _.is(_.get(object, key), value),
                    expected: value,
                    actual: object[key],
                    key: key,
                    object: object,
                    message: _.messages[0],
                }
            } else {
                return {
                    test: test,
                    expected: key,
                    actual: object,
                    message: _.messages[1],
                }
            }
        })

        define(negate(name), function (object, key, value) {
            var test = !_.has(object, key)

            if (arguments.length >= 3) {
                return {
                    test: test || !_.is(_.get(object, key), value),
                    actual: value,
                    key: key,
                    object: object,
                    message: _.messages[2],
                }
            } else {
                return {
                    test: test,
                    expected: key,
                    actual: object,
                    message: _.messages[3],
                }
            }
        })
    }
}

function hasOwnKey(object, key) { return hasOwn.call(object, key) }
function hasInKey(object, key) { return key in object }
function hasInColl(object, key) { return object.has(key) }
function hasObjectGet(object, key) { return object[key] }
function hasCollGet(object, key) { return object.get(key) }

has("hasOwn", {
    is: strictIs,
    has: hasOwnKey,
    get: hasObjectGet,
    messages: [
        "Expected {object} to have own key {key} equal to {expected}, but found {actual}", // eslint-disable-line max-len
        "Expected {actual} to have own key {expected}",
        "Expected {object} to not have own key {key} equal to {actual}",
        "Expected {actual} to not have own key {expected}",
    ],
})

has("hasOwnLoose", {
    is: looseIs,
    has: hasOwnKey,
    get: hasObjectGet,
    messages: [
        "Expected {object} to have own key {key} loosely equal to {expected}, but found {actual}", // eslint-disable-line max-len
        "Expected {actual} to have own key {expected}",
        "Expected {object} to not have own key {key} loosely equal to {actual}",
        "Expected {actual} to not have own key {expected}",
    ],
})

has("hasKey", {
    is: strictIs,
    has: hasInKey,
    get: hasObjectGet,
    messages: [
        "Expected {object} to have key {key} equal to {expected}, but found {actual}", // eslint-disable-line max-len
        "Expected {actual} to have key {expected}",
        "Expected {object} to not have key {key} equal to {actual}",
        "Expected {actual} to not have key {expected}",
    ],
})

has("hasKeyLoose", {
    is: looseIs,
    has: hasInKey,
    get: hasObjectGet,
    messages: [
        "Expected {object} to have key {key} loosely equal to {expected}, but found {actual}", // eslint-disable-line max-len
        "Expected {actual} to have key {expected}",
        "Expected {object} to not have key {key} loosely equal to {actual}",
        "Expected {actual} to not have key {expected}",
    ],
})

has("has", {
    is: strictIs,
    has: hasInColl,
    get: hasCollGet,
    messages: [
        "Expected {object} to have key {key} equal to {expected}, but found {actual}", // eslint-disable-line max-len
        "Expected {actual} to have key {expected}",
        "Expected {object} to not have key {key} equal to {actual}",
        "Expected {actual} to not have key {expected}",
    ],
})

has("hasLoose", {
    is: looseIs,
    has: hasInColl,
    get: hasCollGet,
    messages: [
        "Expected {object} to have key {key} equal to {expected}, but found {actual}", // eslint-disable-line max-len
        "Expected {actual} to have key {expected}",
        "Expected {object} to not have key {key} equal to {actual}",
        "Expected {actual} to not have key {expected}",
    ],
})

function getName(func) {
    if (func.name != null) return func.name || "<anonymous>"
    if (func.displayName != null) return func.displayName || "<anonymous>"
    return "<anonymous>"
}

function throws(name, _) {
    function run(invert) {
        return function (func, matcher) {
            check(func, "func", "function")
            _.check(matcher)

            var test, error

            try {
                func()
            } catch (e) {
                test = _.test(matcher, error = e)

                // Rethrow unknown errors that don't match when a matcher was
                // passed - it's easier to debug unexpected errors when you have
                // a stack trace. Don't rethrow non-errors, though.
                if (_.rethrow(matcher, invert, test, e)) {
                    throw e
                }
            }

            return {
                test: !!test ^ invert,
                expected: matcher,
                error: error,
                message: _.message(matcher, invert, test),
            }
        }
    }

    define(name, run(false))
    define(negate(name), run(true))
}

throws("throws", {
    test: function (Type, e) { return Type == null || e instanceof Type },
    check: function (Type) { check(Type, "Type", ["none", "function"]) },

    rethrow: function (matcher, invert, test, e) {
        return matcher != null && !invert && !test && e instanceof Error
    },

    message: function (Type, invert, test) {
        var str = "Expected callback to "

        if (invert) str += "not "
        str += "throw"

        if (Type != null) {
            str += " an instance of " + getName(Type)
            if (!invert && test === false) str += ", but found {error}"
        }

        return str
    },
})

throws("throwsMatch", {
    test: function (matcher, e) {
        if (typeof matcher === "string") return e.message === matcher
        if (typeof matcher === "function") return !!matcher(e)
        return matcher.test(e.message)
    },

    check: function (matcher) {
        // Not accepting objects yet.
        check(matcher, "matcher", ["string", "regexp", "function"])
    },

    rethrow: function () { return false },

    message: function (_, invert, test) {
        if (invert) {
            return "Expected callback to not throw an error that matches {expected}" // eslint-disable-line max-len
        } else if (test === undefined) {
            return "Expected callback to throw an error that matches {expected}, but found no error" // eslint-disable-line max-len
        } else {
            return "Expected callback to throw an error that matches {expected}, but found {error}" // eslint-disable-line max-len
        }
    },
})

function len(name, compare, message) {
    define(name, function (object, length) {
        check(object, "object", "object")
        check(length, "length", "number")

        var len = object.length

        return {
            test: len != null && compare(len, +length),
            expected: length,
            actual: len,
            object: object,
            message: message,
        }
    })
}

/* eslint-disable max-len */

// Note: these always fail with NaNs.
len("length", function (a, b) { return a === b }, "Expected {object} to have length {expected}, but found {actual}")
len("notLength", function (a, b) { return a !== b }, "Expected {object} to not have length {actual}")
len("lengthAtLeast", function (a, b) { return a >= b }, "Expected {object} to have length at least {expected}, but found {actual}")
len("lengthAtMost", function (a, b) { return a <= b }, "Expected {object} to have length at most {expected}, but found {actual}")
len("lengthAbove", function (a, b) { return a > b }, "Expected {object} to have length above {expected}, but found {actual}")
len("lengthBelow", function (a, b) { return a < b }, "Expected {object} to have length below {expected}, but found {actual}")

/* eslint-enable max-len */

// Note: these two always fail when dealing with NaNs.
define("closeTo", function (actual, expected, delta) {
    check(actual, "actual", "number")
    check(expected, "expected", "number")
    check(delta, "delta", "number")

    return {
        test: Math.abs(actual - expected) <= Math.abs(delta),
        actual: actual,
        expected: expected,
        delta: delta,
        message: "Expected {actual} to be within {delta} of {expected}",
    }
})

define("notCloseTo", function (actual, expected, delta) {
    check(actual, "actual", "number")
    check(expected, "expected", "number")
    check(delta, "delta", "number")

    return {
        test: Math.abs(actual - expected) > Math.abs(delta),
        actual: actual,
        expected: expected,
        delta: delta,
        message: "Expected {actual} to not be within {delta} of {expected}",
    }
})

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
 * includes some | `hasAnyKeys`    | `hasLooseAnyKeys`    | `hasDeepAnyKeys`    | `hasMatchAnyKeys`
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

function defineIncludes(name, func, invert, message) {
    function base(array, values) {
        // Cheap cases first
        if (!Array.isArray(array)) return false
        if (array === values) return true
        return func(array, values)
    }

    define(name, function (array, values) {
        check(array, "array", "array")
        if (!Array.isArray(values)) values = [values]

        // exclusive or to invert the result if `invert` is true
        return {
            test: !values.length || invert ^ base(array, values),
            actual: array,
            values: values,
            message: message,
        }
    })
}

var includesAll = makeIncludes(true, strictIs)
var includesAny = makeIncludes(false, strictIs)

/* eslint-disable max-len */

defineIncludes("includes", includesAll, false, "Expected {actual} to have all values in {values}")
defineIncludes("notIncludesAll", includesAll, true, "Expected {actual} to not have all values in {values}")
defineIncludes("includesAny", includesAny, false, "Expected {actual} to have any value in {values}")
defineIncludes("notIncludes", includesAny, true, "Expected {actual} to not have any value in {values}")

var includesLooseAll = makeIncludes(true, looseIs)
var includesLooseAny = makeIncludes(false, looseIs)

defineIncludes("includesLoose", includesLooseAll, false, "Expected {actual} to loosely have all values in {values}")
defineIncludes("notIncludesLooseAll", includesLooseAll, true, "Expected {actual} to not loosely have all values in {values}")
defineIncludes("includesLooseAny", includesLooseAny, false, "Expected {actual} to loosely have any value in {values}")
defineIncludes("notIncludesLoose", includesLooseAny, true, "Expected {actual} to not loosely have any value in {values}")

var includesDeepAll = makeIncludes(true, match.strict)
var includesDeepAny = makeIncludes(false, match.strict)

defineIncludes("includesDeep", includesDeepAll, false, "Expected {actual} to match all values in {values}")
defineIncludes("notIncludesDeepAll", includesDeepAll, true, "Expected {actual} to not match all values in {values}")
defineIncludes("includesDeepAny", includesDeepAny, false, "Expected {actual} to match any value in {values}")
defineIncludes("notIncludesDeep", includesDeepAny, true, "Expected {actual} to not match any value in {values}")

var includesMatchAll = makeIncludes(true, match.match)
var includesMatchAny = makeIncludes(false, match.match)

defineIncludes("includesMatch", includesMatchAll, false, "Expected {actual} to match all values in {values}")
defineIncludes("notIncludesMatchAll", includesMatchAll, true, "Expected {actual} to not match all values in {values}")
defineIncludes("includesMatchAny", includesMatchAny, false, "Expected {actual} to match any value in {values}")
defineIncludes("notIncludesMatch", includesMatchAny, true, "Expected {actual} to not match any value in {values}")

/* eslint-enable max-len */

function isEmpty(object) {
    if (Array.isArray(object)) return object.length === 0
    if (typeof object !== "object" || object === null) return true
    return Object.keys(object).length === 0
}

function makeHasOverload(name, methods, invert, message) {
    function base(object, keys) {
        // Cheap case first
        if (object === keys) return true
        if (Array.isArray(keys)) return methods.array(object, keys)
        return methods.object(object, keys)
    }

    define(name, function (object, keys) {
        check(object, "object", "object")
        return {
            // exclusive or to invert the result if `invert` is true
            test: isEmpty(keys) || invert ^ base(object, keys),
            actual: object,
            keys: keys,
            message: message,
        }
    })
}

function makeHasKeys(name, func, invert, message) {
    function base(object, keys) {
        return object === keys || func(object, keys)
    }

    define(name, function (object, keys) {
        check(object, "object", "object")
        return {
            // exclusive or to invert the result if `invert` is true
            test: isEmpty(keys) || invert ^ base(object, keys),
            actual: object,
            keys: keys,
            message: message,
        }
    })
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

makeHasOverload("hasKeys", hasAllKeys, false, "Expected {actual} to have all keys in {keys}")
makeHasOverload("notHasAllKeys", hasAllKeys, true, "Expected {actual} to not have all keys in {keys}")
makeHasOverload("hasAnyKeys", hasAnyKeys, false, "Expected {actual} to have any key in {keys}")
makeHasOverload("notHasKeys", hasAnyKeys, true, "Expected {actual} to not have any key in {keys}")

var hasLooseAllKeys = hasOverloadType(true, looseIs)
var hasLooseAnyKeys = hasOverloadType(false, looseIs)

makeHasOverload("hasLooseKeys", hasLooseAllKeys, false, "Expected {actual} to loosely have all keys in {keys}")
makeHasOverload("notHasLooseAllKeys", hasLooseAllKeys, true, "Expected {actual} to not loosely have all keys in {keys}")
makeHasOverload("hasLooseAnyKeys", hasLooseAnyKeys, false, "Expected {actual} to loosely have any key in {keys}")
makeHasOverload("notHasLooseKeys", hasLooseAnyKeys, true, "Expected {actual} to not loosely have any key in {keys}")

var hasDeepAllKeys = hasKeysType(true, match.strict)
var hasDeepAnyKeys = hasKeysType(false, match.strict)

makeHasKeys("hasDeepKeys", hasDeepAllKeys, false, "Expected {actual} to have all keys in {keys}")
makeHasKeys("notHasDeepAllKeys", hasDeepAllKeys, true, "Expected {actual} to not have all keys in {keys}")
makeHasKeys("hasDeepAnyKeys", hasDeepAnyKeys, false, "Expected {actual} to have any key in {keys}")
makeHasKeys("notHasDeepKeys", hasDeepAnyKeys, true, "Expected {actual} to not have any key in {keys}")

var hasMatchAllKeys = hasKeysType(true, match.match)
var hasMatchAnyKeys = hasKeysType(false, match.match)

makeHasKeys("hasMatchKeys", hasMatchAllKeys, false, "Expected {actual} to match all keys in {keys}")
makeHasKeys("notHasMatchAllKeys", hasMatchAllKeys, true, "Expected {actual} to not match all keys in {keys}")
makeHasKeys("hasMatchAnyKeys", hasMatchAnyKeys, false, "Expected {actual} to match any key in {keys}")
makeHasKeys("notHasMatchKeys", hasMatchAnyKeys, true, "Expected {actual} to not match any key in {keys}")

},{"./match":28,"./migrate/common":29}],3:[function(require,module,exports){
"use strict"

/**
 * Main entry point, for those wanting to use this framework with the core
 * assertions.
 */
var Thallium = require("./lib/api/thallium")

module.exports = new Thallium()

},{"./lib/api/thallium":7}],4:[function(require,module,exports){
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

},{"./lib/api/thallium":7,"./lib/core/reports":17}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
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

},{"../core/tests":18,"../methods":19,"./hooks":5}],7:[function(require,module,exports){
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

},{"../core/only":16,"../core/tests":18,"../methods":19,"./hooks":5,"./reflect":6}],8:[function(require,module,exports){
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

},{"../../match":28,"./util":14}],9:[function(require,module,exports){
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

},{"../../match":28,"./util":14}],10:[function(require,module,exports){
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

},{"./util":14}],11:[function(require,module,exports){
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

},{"../../match":28,"./util":14}],12:[function(require,module,exports){
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

},{"./util":14}],13:[function(require,module,exports){
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

},{"./util":14}],14:[function(require,module,exports){
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

},{"../replaced/inspect":40,"../util":27}],15:[function(require,module,exports){
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

},{"../assert":1,"../index":3,"../internal":4,"../match":28,"../r":42,"./settings":26}],16:[function(require,module,exports){
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

},{}],17:[function(require,module,exports){
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

},{"../methods":19}],18:[function(require,module,exports){
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

},{"../methods":19,"../util":27,"./only":16,"./reports":17}],19:[function(require,module,exports){
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

},{}],20:[function(require,module,exports){
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

},{}],21:[function(require,module,exports){
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

},{"../methods":19,"../replaced/inspect":40,"../util":27,"./reporter":24,"./util":25}],22:[function(require,module,exports){
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

},{"./console-reporter":21,"./on":23,"./reporter":24,"./util":25}],23:[function(require,module,exports){
"use strict"

var Status = require("./util").Status

// Because ES5 sucks. (And, it's breaking my PhantomJS builds)
function setName(reporter, name) {
    try {
        Object.defineProperty(reporter, "name", {value: name})
    } catch (e) {
        // ignore
    }
}

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
    setName(reporter, name)
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

},{"./util":25}],24:[function(require,module,exports){
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

},{"../methods":19,"./util":25}],25:[function(require,module,exports){
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

},{"../settings":26,"../util":27}],26:[function(require,module,exports){
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

},{"./replaced/console":20}],27:[function(require,module,exports){
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

},{}],28:[function(require,module,exports){
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

},{}],29:[function(require,module,exports){
(function (global){
"use strict"

// To suppress deprecation messages
var suppressDeprecation = true

exports.showDeprecation = function () {
    suppressDeprecation = false
}

exports.hideDeprecation = function () {
    suppressDeprecation = true
}

var console = global.console
var shouldPrint = console != null && typeof console.warn === "function" &&
    !(global.process != null && global.process.env != null &&
        global.process.env.NO_MIGRATE_WARN)

exports.warn = function () {
    if (shouldPrint && !suppressDeprecation) {
        console.warn.apply(console, arguments)
    }
}

exports.deprecate = function (message, func) {
    var printed = !shouldPrint

    /** @this */
    return function () {
        if (!suppressDeprecation) {
            if (!printed) {
                printed = true
                console.trace()
                console.warn(message)
            }

            message = undefined
        }

        return func.apply(this, arguments)
    }
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],30:[function(require,module,exports){
"use strict"

/**
 * Backport wrapper to warn about most of the major breaking changes from the
 * last major version, and to help me keep track of all the changes.
 *
 * It consists of solely internal monkey patching to revive support of previous
 * versions, although I tried to limit how much knowledge of the internals this
 * requires.
 */

var Common = require("./common")
var Internal = require("../internal")
var methods = require("../lib/methods")
var Report = require("../lib/core/reports").Report
var Reflect = require("../lib/api/reflect")
var Thallium = require("../lib/api/thallium")

var assert = require("../assert")
var AssertionError = assert.AssertionError
var format = assert.format

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * - `reflect.checkInit()` is deprecated in favor of `reflect.locked` and    *
 *   either complaining yourself or just using `reflect.current` to add      *
 *   things.                                                                 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
methods(Reflect, {
    checkInit: Common.deprecate(
        "`reflect.checkInit` is deprecated. Use `reflect.current` for the " +
        "current test or use `reflect.locked` and create and throw the error " +
        "yourself.",
        /** @this */ function () {
            if (this.locked) {
                throw new ReferenceError("It is only safe to call test " +
                    "methods during initialization")
            }
        }),
})

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * - `t.async` -> `t.test`, which now supports promises.                     *
 * - All tests are now async.                                                *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

var test = Thallium.prototype.test

function runAsync(callback, t, resolve, reject) {
    var resolved = false
    var gen = callback.call(t, t, function (err) {
        if (resolved) return
        Common.warn("`t.async` is deprecated. " +
            "Use `t.test` and return a promise instead.")

        resolved = true
        if (err != null) reject(err)
        else resolve()
    })

    if (resolved) return

    if (typeof gen.next !== "function") {
        // Allow the migration path to standard thenables.
        resolve(gen)
        return
    }

    Common.warn("`t.async` is deprecated. Use `t.test` and either return a " +
        "promise or use `co`/ES2017 async functions instead.")

    // This is a modified version of the async-await official, non-normative
    // desugaring helper, for better error checking and adapted to accept an
    // already-instantiated iterator instead of a generator.
    function iterate(next) {
        // finished with success, resolve the promise
        if (next.done) return Promise.resolve(next.value)

        // not finished, chain off the yielded promise and step again
        return Promise.resolve(next.value).then(
            function (v) { return iterate(gen.next(v)) },
            function (e) {
                if (typeof gen.throw === "function") {
                    return iterate(gen.throw(e))
                } else {
                    throw e
                }
            })
    }

    iterate(gen.next(undefined)).then(resolve, reject)
}

methods(Thallium, {
    async: function (name, callback) {
        if (typeof callback !== "function") {
            // Reuse the normal error handling.
            return test.apply(this, arguments)
        } else {
            return test.call(this, name, function (t) {
                return new Promise(function (resolve, reject) {
                    return runAsync(callback, t, resolve, reject)
                })
            })
        }
    },

    asyncSkip: Common.deprecate(
        "`t.asyncSkip` is deprecated. Use `t.testSkip` instead.",
        Thallium.prototype.testSkip),
})

methods(Reflect, {
    get isAsync() {
        Common.warn("Tests are now always async. You no longer need to " +
            "handle the other case")
        return true
    },
})

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * `reflect.define`, `t.define`, `reflect.wrap`, and `reflect.add`, are all  *
 * removed.                                                                  *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

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
                throw new TypeError("Expected body to be a function")
            }

            test.methods[key] = iterator(test, key, name[key])
        }
    } else {
        if (typeof func !== "function") {
            throw new TypeError("Expected body to be a function")
        }

        test.methods[name] = iterator(test, name, func)
    }
}

/**
 * @this {State}
 * Run `func` with `...args` when assertions are run, only if the test isn't
 * skipped. This is immediately for block and async tests, but deferred for
 * inline tests. It's useful for inline assertions.
 */
function attempt(func, a, b, c/* , ...args */) {
    switch (arguments.length) {
    case 0: throw new TypeError("unreachable")
    case 1: func(); return
    case 2: func(a); return
    case 3: func(a, b); return
    case 4: func(a, b, c); return
    default:
        var args = []

        for (var i = 1; i < arguments.length; i++) {
            args.push(arguments[i])
        }

        func.apply(undefined, args)
    }
}

function defineAssertion(test, name, func) {
    // Don't let native methods get overridden by assertions
    if (isLocked(name)) {
        throw new RangeError("Method '" + name + "' is locked!")
    }

    function run() {
        var res = func.apply(undefined, arguments)

        if (typeof res !== "object" || res === null) {
            throw new TypeError("Expected result to be an object")
        }

        if (!res.test) {
            throw new AssertionError(
                format(res.message, res),
                res.expected, res.actual)
        }
    }

    return /** @this */ function () {
        var args = [run]

        args.push.apply(args, arguments)
        attempt.apply(undefined, args)
        return this
    }
}

function wrapAssertion(test, name, func) {
    // Don't let `reflect` and `_` change.
    if (name === "reflect" || name === "_") {
        throw new RangeError("Method '" + name + "' is locked!")
    }

    var old = test.methods[name]

    if (typeof old !== "function") {
        throw new TypeError(
            "Expected t." + name + " to already be a function")
    }

    /** @this */
    function apply(a, b, c, d) {
        switch (arguments.length) {
        case 0: return func.call(this, old.bind(this))
        case 1: return func.call(this, old.bind(this), a)
        case 2: return func.call(this, old.bind(this), a, b)
        case 3: return func.call(this, old.bind(this), a, b, c)
        case 4: return func.call(this, old.bind(this), a, b, c, d)
        default:
            var args = [old.bind(this)]

            for (var i = 0; i < arguments.length; i++) {
                args.push(arguments[i])
            }

            return func.apply(this, args)
        }
    }

    return /** @this */ function () {
        var ret = apply.apply(this, arguments)

        return ret !== undefined ? ret : this
    }
}

function addAssertion(test, name, func) {
    if (typeof test.methods[name] !== "undefined") {
        throw new TypeError("Method '" + name + "' already exists!")
    }

    /** @this */
    function apply(a, b, c, d) {
        switch (arguments.length) {
        case 0: return func.call(this, this)
        case 1: return func.call(this, this, a)
        case 2: return func.call(this, this, a, b)
        case 3: return func.call(this, this, a, b, c)
        case 4: return func.call(this, this, a, b, c, d)
        default:
            var args = [this]

            for (var i = 0; i < arguments.length; i++) {
                args.push(arguments[i])
            }

            return func.apply(this, args)
        }
    }

    return /** @this */ function () {
        var ret = apply.apply(this, arguments)

        return ret !== undefined ? ret : this
    }
}

methods(Reflect, {
    define: Common.deprecate(
        "`reflect.define` is deprecated. Use external methods or direct assignment instead.", // eslint-disable-line max-len
        /** @this */ function (name, func) {
            iterateSetter(this._.current.value, name, func, defineAssertion)
        }),

    wrap: Common.deprecate(
        "`reflect.wrap` is deprecated. Use external methods or direct assignment instead.", // eslint-disable-line max-len
        /** @this */ function (name, func) {
            iterateSetter(this._.current.value, name, func, wrapAssertion)
        }),

    add: Common.deprecate(
        "`reflect.add` is deprecated. Use external methods or direct assignment instead.", // eslint-disable-line max-len
        /** @this */ function (name, func) {
            iterateSetter(this._.current.value, name, func, addAssertion)
        }),
})

methods(Thallium, {
    define: Common.deprecate(
        "`t.define` is deprecated. Use external methods or direct assignment instead.", // eslint-disable-line max-len
        /** @this */ function (name, func) {
            iterateSetter(this._.current.value, name, func, defineAssertion)
            return this
        }),
})

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * - `reflect.do` is deprecated, with no replacement (inline tests are also  *
 *   deprecated).                                                            *
 * - `reflect.base` -> `internal.root`                                       *
 * - `reflect.AssertionError` -> `assert.AssertionError`.                    *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

methods(Reflect, {
    // Deprecated aliases
    do: Common.deprecate(
        "`reflect.do` is deprecated. Transition to block tests, if necessary, and run the code directly.", // eslint-disable-line max-len
        /** @this */ function (func) {
            if (typeof func !== "function") {
                throw new TypeError("Expected callback to be a function")
            }

            attempt.apply(undefined, arguments)
            return this
        }),
    base: Common.deprecate(
        "`reflect.base` is deprecated. Use `internal.root` from `thallium/internal` instead.", // eslint-disable-line max-len
        Internal.root),
})

// ESLint oddly can't tell these are shadowed.
/* eslint-disable no-extend-native */

function lockError(AssertionError) {
    Object.defineProperty(Reflect.prototype, "AssertionError", {
        writable: true,
        value: AssertionError,
    })
    return AssertionError
}

Object.defineProperty(Reflect.prototype, "AssertionError", {
    configurable: true,
    enumerable: false,
    get: Common.deprecate(
        "`reflect.AssertionError` is deprecated. Use `assert.AssertionError` from `thallium/assert` instead.", // eslint-disable-line max-len
        function () { return lockError(AssertionError) }),
    set: Common.deprecate(
        "`reflect.AssertionError` is deprecated. Use `assert.AssertionError` from `thallium/assert` instead.", // eslint-disable-line max-len
        lockError),
})

/* eslint-enable no-extend-native */

methods(Thallium, {
    base: Common.deprecate(
        "`t.base` is deprecated. Use `t.create` instead.",
        function () { return new Thallium() }),
})

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * - assertions defined on main export                                       *
 * - `t.*` assertions -> `assert.*` (some renamed) from `thallium/assert`    *
 * - `t.true`/etc. are gone (except `t.undefined` -> `assert.undefined`)     *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
Common.hideDeprecation()
require("../assertions")(require("../index"))
Common.showDeprecation()

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * `extra` events are no longer a thing.                                     *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
methods(Report, {
    get isInline() {
        Common.warn("`extra` events no longer exist. You no longer need to " +
            "handle them")
        return false
    },
})

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * - `t.reflect` and `t.use` -> non-caching `t.call`                         *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
var call = Thallium.prototype.call

function id(x) { return x }

methods(Thallium, {
    reflect: Common.deprecate(
        "`t.reflect` is deprecated. Use `t.call` instead.",
        /** @this */ function () { return call.call(this, id) }),

    use: Common.deprecate(
        "`t.use` is deprecated. Use `t.call` instead.",
        /** @this */ function () {
            var reflect = call.call(this, id)

            if (!reflect.skipped) {
                var test = this._.current.value

                for (var i = 0; i < arguments.length; i++) {
                    var plugin = arguments[i]

                    if (typeof plugin !== "function") {
                        throw new TypeError(
                            "Expected `plugin` to be a function")
                    }

                    if (test.plugins == null) test.plugins = []
                    if (test.plugins.indexOf(plugin) === -1) {
                        // Add plugin before calling it.
                        test.plugins.push(plugin)
                        plugin.call(this, this)
                    }
                }
            }

            return this
        }),
})

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * - `reflect.report` -> `internal.report.*`                                 *
 * - `reflect.loc` -> `internal.location`                                    *
 * - `reflect.scheduler` obsoleted.                                          *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

var reports = Internal.reports

methods(Reflect, {
    report: Common.deprecate(
        "`reflect.report` is deprecated. Use `internal.report.*` from `thallium/internal` instead.", // eslint-disable-line max-len
        function (type, path, value, duration, slow) { // eslint-disable-line max-params, max-len
            if (typeof type !== "string") {
                throw new TypeError("Expected `type` to be a string")
            }

            switch (type) {
            case "start": return reports.start()
            case "enter": return reports.enter(path, duration, slow)
            case "leave": return reports.leave(path)
            case "pass": return reports.pass(path, duration, slow)
            case "fail": return reports.fail(path, value, duration, slow)
            case "skip": return reports.skip(path)
            case "end": return reports.end()
            case "error": return reports.error(value)
            case "hook": return reports.hook(path, value)
            default: throw new RangeError("Unknown report `type`: " + type)
            }
        }),

    loc: Common.deprecate(
        "`reflect.loc` is deprecated. Use `internal.location` from `thallium/internal` instead.", // eslint-disable-line max-len
        Internal.location),

    scheduler: Common.deprecate(
        "`reflect.scheduler` is deprecated. It is no longer useful to the library, and can be safely removed.", // eslint-disable-line max-len
        function () {}),
})

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Inline tests are deprecated. This is "fixed" by just throwing, since it's *
 * hard to patch back in and easy to fix on the user's end.                  *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
methods(Thallium, {
    test: function (name, func) {
        if (func == null) {
            // Catch this particular case, to throw with a more informative
            // messsage.
            throw new TypeError(
                "Inline tests are deprecated. Use block tests instead.")
        }

        return test.apply(this, arguments)
    },
})

methods(Reflect, {
    get isInline() {
        Common.warn("Tests are now never inline. You no longer need to " +
            "handle this case")
        return false
    },
})

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * `reflect.methods` -> `reflect.current` and using new `reflect` methods    *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
methods(Reflect, {
    get methods() {
        Common.warn("`reflect.methods` is deprecated. Use `reflect.current`, " +
            "the return value of `t.call`, and the appropriate new `reflect` " +
            "methods instead")
        return this._.methods
    },
})

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * `reflect.reporters` -> `reflect.hasReporter`                              *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
methods(Reflect, {
    get reporters() {
        Common.warn("`reflect.reporters` is deprecated. Use " +
            "`reflect.hasReporter` instead to check for existence of a " +
            "reporter.")
        return this._.methods
    },
})

},{"../assert":1,"../assertions":2,"../index":3,"../internal":4,"../lib/api/reflect":6,"../lib/api/thallium":7,"../lib/core/reports":17,"../lib/methods":19,"./common":29}],31:[function(require,module,exports){
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

},{}],32:[function(require,module,exports){
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

},{}],33:[function(require,module,exports){

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


},{}],34:[function(require,module,exports){

var indexOf = [].indexOf;

module.exports = function(arr, obj){
  if (indexOf) return arr.indexOf(obj);
  for (var i = 0; i < arr.length; ++i) {
    if (arr[i] === obj) return i;
  }
  return -1;
};
},{}],35:[function(require,module,exports){
module.exports = Array.isArray || function (arr) {
  return Object.prototype.toString.call(arr) == '[object Array]';
};

},{}],36:[function(require,module,exports){
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

},{}],37:[function(require,module,exports){
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


},{}],38:[function(require,module,exports){
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


},{"./foreach":37,"./isArguments":39}],39:[function(require,module,exports){
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


},{}],40:[function(require,module,exports){

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

},{"array-map":31,"array-reduce":32,"foreach":33,"indexof":34,"isarray":35,"json3":36,"object-keys":38}],41:[function(require,module,exports){
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

},{"../lib/reporter":22}],42:[function(require,module,exports){
"use strict"

// exports.dom = require("./dom")
exports.dot = require("./dot")
exports.spec = require("./spec")
exports.tap = require("./tap")

},{"./dot":41,"./spec":43,"./tap":44}],43:[function(require,module,exports){
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

},{"../lib/reporter":22}],44:[function(require,module,exports){
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

},{"../lib/replaced/inspect":40,"../lib/reporter":22,"../lib/util":27}],"thallium":[function(require,module,exports){
"use strict"

module.exports = require("../lib/browser-bundle")

require("../migrate/index")

// Note: both of these are deprecated
module.exports.assertions = require("../assertions")
module.exports.create = require("../migrate/common").deprecate(
    "`tl.create` is deprecated. Please use `tl.root` instead.",
    module.exports.root)

},{"../assertions":2,"../lib/browser-bundle":15,"../migrate/common":29,"../migrate/index":30}]},{},[])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhc3NlcnQuanMiLCJhc3NlcnRpb25zLmpzIiwiaW5kZXguanMiLCJpbnRlcm5hbC5qcyIsImxpYi9hcGkvaG9va3MuanMiLCJsaWIvYXBpL3JlZmxlY3QuanMiLCJsaWIvYXBpL3RoYWxsaXVtLmpzIiwibGliL2Fzc2VydC9lcXVhbC5qcyIsImxpYi9hc3NlcnQvaGFzLWtleXMuanMiLCJsaWIvYXNzZXJ0L2hhcy5qcyIsImxpYi9hc3NlcnQvaW5jbHVkZXMuanMiLCJsaWIvYXNzZXJ0L3Rocm93cy5qcyIsImxpYi9hc3NlcnQvdHlwZS5qcyIsImxpYi9hc3NlcnQvdXRpbC5qcyIsImxpYi9icm93c2VyLWJ1bmRsZS5qcyIsImxpYi9jb3JlL29ubHkuanMiLCJsaWIvY29yZS9yZXBvcnRzLmpzIiwibGliL2NvcmUvdGVzdHMuanMiLCJsaWIvbWV0aG9kcy5qcyIsImxpYi9yZXBsYWNlZC9jb25zb2xlLWJyb3dzZXIuanMiLCJsaWIvcmVwb3J0ZXIvY29uc29sZS1yZXBvcnRlci5qcyIsImxpYi9yZXBvcnRlci9pbmRleC5qcyIsImxpYi9yZXBvcnRlci9vbi5qcyIsImxpYi9yZXBvcnRlci9yZXBvcnRlci5qcyIsImxpYi9yZXBvcnRlci91dGlsLmpzIiwibGliL3NldHRpbmdzLmpzIiwibGliL3V0aWwuanMiLCJtYXRjaC5qcyIsIm1pZ3JhdGUvY29tbW9uLmpzIiwibWlncmF0ZS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9hcnJheS1tYXAvaW5kZXguanMiLCJub2RlX21vZHVsZXMvYXJyYXktcmVkdWNlL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2ZvcmVhY2gvaW5kZXguanMiLCJub2RlX21vZHVsZXMvaW5kZXhvZi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9pc2FycmF5L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2pzb24zL2xpYi9qc29uMy5qcyIsIm5vZGVfbW9kdWxlcy9vYmplY3Qta2V5cy9mb3JlYWNoLmpzIiwibm9kZV9tb2R1bGVzL29iamVjdC1rZXlzL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL29iamVjdC1rZXlzL2lzQXJndW1lbnRzLmpzIiwibm9kZV9tb2R1bGVzL3V0aWwtaW5zcGVjdC9pbmRleC5qcyIsInIvZG90LmpzIiwici9pbmRleC5qcyIsInIvc3BlYy5qcyIsInIvdGFwLmpzIiwibWlncmF0ZS9idW5kbGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDLzJCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeFdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzFRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDMWVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDbERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUNobUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7OztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDajRCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hhQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlwidXNlIHN0cmljdFwiXG5cbi8qKlxuICogQ29yZSBUREQtc3R5bGUgYXNzZXJ0aW9ucy4gVGhlc2UgYXJlIGRvbmUgYnkgYSBjb21wb3NpdGlvbiBvZiBEU0xzLCBzaW5jZVxuICogdGhlcmUgaXMgKnNvKiBtdWNoIHJlcGV0aXRpb24uIEFsc28sIHRoaXMgaXMgc3BsaXQgaW50byBzZXZlcmFsIG5hbWVzcGFjZXMgdG9cbiAqIGtlZXAgdGhlIGZpbGUgc2l6ZSBtYW5hZ2VhYmxlLlxuICovXG5cbnZhciBVdGlsID0gcmVxdWlyZShcIi4vbGliL2Fzc2VydC91dGlsXCIpXG52YXIgVHlwZSA9IHJlcXVpcmUoXCIuL2xpYi9hc3NlcnQvdHlwZVwiKVxudmFyIEVxdWFsID0gcmVxdWlyZShcIi4vbGliL2Fzc2VydC9lcXVhbFwiKVxudmFyIFRocm93cyA9IHJlcXVpcmUoXCIuL2xpYi9hc3NlcnQvdGhyb3dzXCIpXG52YXIgSGFzID0gcmVxdWlyZShcIi4vbGliL2Fzc2VydC9oYXNcIilcbnZhciBJbmNsdWRlcyA9IHJlcXVpcmUoXCIuL2xpYi9hc3NlcnQvaW5jbHVkZXNcIilcbnZhciBIYXNLZXlzID0gcmVxdWlyZShcIi4vbGliL2Fzc2VydC9oYXMta2V5c1wiKVxuXG5leHBvcnRzLkFzc2VydGlvbkVycm9yID0gVXRpbC5Bc3NlcnRpb25FcnJvclxuZXhwb3J0cy5hc3NlcnQgPSBVdGlsLmFzc2VydFxuZXhwb3J0cy5mYWlsID0gVXRpbC5mYWlsXG5leHBvcnRzLmZvcm1hdCA9IFV0aWwuZm9ybWF0XG5leHBvcnRzLmVzY2FwZSA9IFV0aWwuZXNjYXBlXG5cbmV4cG9ydHMub2sgPSBUeXBlLm9rXG5leHBvcnRzLm5vdE9rID0gVHlwZS5ub3RPa1xuZXhwb3J0cy5pc0Jvb2xlYW4gPSBUeXBlLmlzQm9vbGVhblxuZXhwb3J0cy5ub3RCb29sZWFuID0gVHlwZS5ub3RCb29sZWFuXG5leHBvcnRzLmlzRnVuY3Rpb24gPSBUeXBlLmlzRnVuY3Rpb25cbmV4cG9ydHMubm90RnVuY3Rpb24gPSBUeXBlLm5vdEZ1bmN0aW9uXG5leHBvcnRzLmlzTnVtYmVyID0gVHlwZS5pc051bWJlclxuZXhwb3J0cy5ub3ROdW1iZXIgPSBUeXBlLm5vdE51bWJlclxuZXhwb3J0cy5pc09iamVjdCA9IFR5cGUuaXNPYmplY3RcbmV4cG9ydHMubm90T2JqZWN0ID0gVHlwZS5ub3RPYmplY3RcbmV4cG9ydHMuaXNTdHJpbmcgPSBUeXBlLmlzU3RyaW5nXG5leHBvcnRzLm5vdFN0cmluZyA9IFR5cGUubm90U3RyaW5nXG5leHBvcnRzLmlzU3ltYm9sID0gVHlwZS5pc1N5bWJvbFxuZXhwb3J0cy5ub3RTeW1ib2wgPSBUeXBlLm5vdFN5bWJvbFxuZXhwb3J0cy5leGlzdHMgPSBUeXBlLmV4aXN0c1xuZXhwb3J0cy5ub3RFeGlzdHMgPSBUeXBlLm5vdEV4aXN0c1xuZXhwb3J0cy5pc0FycmF5ID0gVHlwZS5pc0FycmF5XG5leHBvcnRzLm5vdEFycmF5ID0gVHlwZS5ub3RBcnJheVxuZXhwb3J0cy5pcyA9IFR5cGUuaXNcbmV4cG9ydHMubm90ID0gVHlwZS5ub3RcblxuZXhwb3J0cy5lcXVhbCA9IEVxdWFsLmVxdWFsXG5leHBvcnRzLm5vdEVxdWFsID0gRXF1YWwubm90RXF1YWxcbmV4cG9ydHMuZXF1YWxMb29zZSA9IEVxdWFsLmVxdWFsTG9vc2VcbmV4cG9ydHMubm90RXF1YWxMb29zZSA9IEVxdWFsLm5vdEVxdWFsTG9vc2VcbmV4cG9ydHMuZGVlcEVxdWFsID0gRXF1YWwuZGVlcEVxdWFsXG5leHBvcnRzLm5vdERlZXBFcXVhbCA9IEVxdWFsLm5vdERlZXBFcXVhbFxuZXhwb3J0cy5tYXRjaCA9IEVxdWFsLm1hdGNoXG5leHBvcnRzLm5vdE1hdGNoID0gRXF1YWwubm90TWF0Y2hcbmV4cG9ydHMuYXRMZWFzdCA9IEVxdWFsLmF0TGVhc3RcbmV4cG9ydHMuYXRNb3N0ID0gRXF1YWwuYXRNb3N0XG5leHBvcnRzLmFib3ZlID0gRXF1YWwuYWJvdmVcbmV4cG9ydHMuYmVsb3cgPSBFcXVhbC5iZWxvd1xuZXhwb3J0cy5iZXR3ZWVuID0gRXF1YWwuYmV0d2VlblxuZXhwb3J0cy5jbG9zZVRvID0gRXF1YWwuY2xvc2VUb1xuZXhwb3J0cy5ub3RDbG9zZVRvID0gRXF1YWwubm90Q2xvc2VUb1xuXG5leHBvcnRzLnRocm93cyA9IFRocm93cy50aHJvd3NcbmV4cG9ydHMudGhyb3dzTWF0Y2ggPSBUaHJvd3MudGhyb3dzTWF0Y2hcblxuZXhwb3J0cy5oYXNPd24gPSBIYXMuaGFzT3duXG5leHBvcnRzLm5vdEhhc093biA9IEhhcy5ub3RIYXNPd25cbmV4cG9ydHMuaGFzT3duTG9vc2UgPSBIYXMuaGFzT3duTG9vc2VcbmV4cG9ydHMubm90SGFzT3duTG9vc2UgPSBIYXMubm90SGFzT3duTG9vc2VcbmV4cG9ydHMuaGFzS2V5ID0gSGFzLmhhc0tleVxuZXhwb3J0cy5ub3RIYXNLZXkgPSBIYXMubm90SGFzS2V5XG5leHBvcnRzLmhhc0tleUxvb3NlID0gSGFzLmhhc0tleUxvb3NlXG5leHBvcnRzLm5vdEhhc0tleUxvb3NlID0gSGFzLm5vdEhhc0tleUxvb3NlXG5leHBvcnRzLmhhcyA9IEhhcy5oYXNcbmV4cG9ydHMubm90SGFzID0gSGFzLm5vdEhhc1xuZXhwb3J0cy5oYXNMb29zZSA9IEhhcy5oYXNMb29zZVxuZXhwb3J0cy5ub3RIYXNMb29zZSA9IEhhcy5ub3RIYXNMb29zZVxuXG4vKipcbiAqIFRoZXJlJ3MgMiBzZXRzIG9mIDEyIHBlcm11dGF0aW9ucyBoZXJlIGZvciBgaW5jbHVkZXNgIGFuZCBgaGFzS2V5c2AsIGluc3RlYWRcbiAqIG9mIE4gc2V0cyBvZiAyICh3aGljaCB3b3VsZCBmaXQgdGhlIGBmb29gL2Bub3RGb29gIGlkaW9tIGJldHRlciksIHNvIGl0J3NcbiAqIGVhc2llciB0byBqdXN0IG1ha2UgYSBjb3VwbGUgc2VwYXJhdGUgRFNMcyBhbmQgdXNlIHRoYXQgdG8gZGVmaW5lIGV2ZXJ5dGhpbmcuXG4gKlxuICogSGVyZSdzIHRoZSB0b3AgbGV2ZWw6XG4gKlxuICogLSBzaGFsbG93XG4gKiAtIHN0cmljdCBkZWVwXG4gKiAtIHN0cnVjdHVyYWwgZGVlcFxuICpcbiAqIEFuZCB0aGUgc2Vjb25kIGxldmVsOlxuICpcbiAqIC0gaW5jbHVkZXMgYWxsL25vdCBtaXNzaW5nIHNvbWVcbiAqIC0gaW5jbHVkZXMgc29tZS9ub3QgbWlzc2luZyBhbGxcbiAqIC0gbm90IGluY2x1ZGluZyBhbGwvbWlzc2luZyBzb21lXG4gKiAtIG5vdCBpbmNsdWRpbmcgc29tZS9taXNzaW5nIGFsbFxuICpcbiAqIEhlcmUncyBhbiBleGFtcGxlIHVzaW5nIHRoZSBuYW1pbmcgc2NoZW1lIGZvciBgaGFzS2V5cypgXG4gKlxuICogICAgICAgICAgICAgICB8ICAgICBzaGFsbG93ICAgICB8ICAgIHN0cmljdCBkZWVwICAgICAgfCAgIHN0cnVjdHVyYWwgZGVlcFxuICogLS0tLS0tLS0tLS0tLS18LS0tLS0tLS0tLS0tLS0tLS18LS0tLS0tLS0tLS0tLS0tLS0tLS0tfC0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAqIGluY2x1ZGVzIGFsbCAgfCBgaGFzS2V5c2AgICAgICAgfCBgaGFzS2V5c0RlZXBgICAgICAgIHwgYGhhc0tleXNNYXRjaGBcbiAqIGluY2x1ZGVzIHNvbWUgfCBgaGFzS2V5c0FueWAgICAgfCBgaGFzS2V5c0FueURlZXBgICAgIHwgYGhhc0tleXNBbnlNYXRjaGBcbiAqIG1pc3Npbmcgc29tZSAgfCBgbm90SGFzS2V5c0FsbGAgfCBgbm90SGFzS2V5c0FsbERlZXBgIHwgYG5vdEhhc0tleXNBbGxNYXRjaGBcbiAqIG1pc3NpbmcgYWxsICAgfCBgbm90SGFzS2V5c2AgICAgfCBgbm90SGFzS2V5c0RlZXBgICAgIHwgYG5vdEhhc0tleXNNYXRjaGBcbiAqXG4gKiBOb3RlIHRoYXQgdGhlIGBoYXNLZXlzYCBzaGFsbG93IGNvbXBhcmlzb24gdmFyaWFudHMgYXJlIGFsc28gb3ZlcmxvYWRlZCB0b1xuICogY29uc3VtZSBlaXRoZXIgYW4gYXJyYXkgKGluIHdoaWNoIGl0IHNpbXBseSBjaGVja3MgYWdhaW5zdCBhIGxpc3Qgb2Yga2V5cykgb3JcbiAqIGFuIG9iamVjdCAod2hlcmUgaXQgZG9lcyBhIGZ1bGwgZGVlcCBjb21wYXJpc29uKS5cbiAqL1xuXG5leHBvcnRzLmluY2x1ZGVzID0gSW5jbHVkZXMuaW5jbHVkZXNcbmV4cG9ydHMuaW5jbHVkZXNEZWVwID0gSW5jbHVkZXMuaW5jbHVkZXNEZWVwXG5leHBvcnRzLmluY2x1ZGVzTWF0Y2ggPSBJbmNsdWRlcy5pbmNsdWRlc01hdGNoXG5leHBvcnRzLmluY2x1ZGVzQW55ID0gSW5jbHVkZXMuaW5jbHVkZXNBbnlcbmV4cG9ydHMuaW5jbHVkZXNBbnlEZWVwID0gSW5jbHVkZXMuaW5jbHVkZXNBbnlEZWVwXG5leHBvcnRzLmluY2x1ZGVzQW55TWF0Y2ggPSBJbmNsdWRlcy5pbmNsdWRlc0FueU1hdGNoXG5leHBvcnRzLm5vdEluY2x1ZGVzQWxsID0gSW5jbHVkZXMubm90SW5jbHVkZXNBbGxcbmV4cG9ydHMubm90SW5jbHVkZXNBbGxEZWVwID0gSW5jbHVkZXMubm90SW5jbHVkZXNBbGxEZWVwXG5leHBvcnRzLm5vdEluY2x1ZGVzQWxsTWF0Y2ggPSBJbmNsdWRlcy5ub3RJbmNsdWRlc0FsbE1hdGNoXG5leHBvcnRzLm5vdEluY2x1ZGVzID0gSW5jbHVkZXMubm90SW5jbHVkZXNcbmV4cG9ydHMubm90SW5jbHVkZXNEZWVwID0gSW5jbHVkZXMubm90SW5jbHVkZXNEZWVwXG5leHBvcnRzLm5vdEluY2x1ZGVzTWF0Y2ggPSBJbmNsdWRlcy5ub3RJbmNsdWRlc01hdGNoXG5cbmV4cG9ydHMuaGFzS2V5cyA9IEhhc0tleXMuaGFzS2V5c1xuZXhwb3J0cy5oYXNLZXlzRGVlcCA9IEhhc0tleXMuaGFzS2V5c0RlZXBcbmV4cG9ydHMuaGFzS2V5c01hdGNoID0gSGFzS2V5cy5oYXNLZXlzTWF0Y2hcbmV4cG9ydHMuaGFzS2V5c0FueSA9IEhhc0tleXMuaGFzS2V5c0FueVxuZXhwb3J0cy5oYXNLZXlzQW55RGVlcCA9IEhhc0tleXMuaGFzS2V5c0FueURlZXBcbmV4cG9ydHMuaGFzS2V5c0FueU1hdGNoID0gSGFzS2V5cy5oYXNLZXlzQW55TWF0Y2hcbmV4cG9ydHMubm90SGFzS2V5c0FsbCA9IEhhc0tleXMubm90SGFzS2V5c0FsbFxuZXhwb3J0cy5ub3RIYXNLZXlzQWxsRGVlcCA9IEhhc0tleXMubm90SGFzS2V5c0FsbERlZXBcbmV4cG9ydHMubm90SGFzS2V5c0FsbE1hdGNoID0gSGFzS2V5cy5ub3RIYXNLZXlzQWxsTWF0Y2hcbmV4cG9ydHMubm90SGFzS2V5cyA9IEhhc0tleXMubm90SGFzS2V5c1xuZXhwb3J0cy5ub3RIYXNLZXlzRGVlcCA9IEhhc0tleXMubm90SGFzS2V5c0RlZXBcbmV4cG9ydHMubm90SGFzS2V5c01hdGNoID0gSGFzS2V5cy5ub3RIYXNLZXlzTWF0Y2hcbiIsIlwidXNlIHN0cmljdFwiXG5cbi8qKlxuICogQ29yZSBUREQtc3R5bGUgYXNzZXJ0aW9ucy4gVGhlc2UgYXJlIGRvbmUgYnkgYSBjb21wb3NpdGlvbiBvZiBEU0xzLCBzaW5jZVxuICogdGhlcmUgaXMgKnNvKiBtdWNoIHJlcGV0aXRpb24uXG4gKi9cblxudmFyIG1hdGNoID0gcmVxdWlyZShcIi4vbWF0Y2hcIilcbnZhciBkZXByZWNhdGUgPSByZXF1aXJlKFwiLi9taWdyYXRlL2NvbW1vblwiKS5kZXByZWNhdGVcblxudmFyIHRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZ1xudmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHlcblxuLyogZXNsaW50LWRpc2FibGUgbm8tc2VsZi1jb21wYXJlICovXG4vLyBGb3IgYmV0dGVyIE5hTiBoYW5kbGluZ1xuZnVuY3Rpb24gc3RyaWN0SXMoYSwgYikge1xuICAgIHJldHVybiBhID09PSBiIHx8IGEgIT09IGEgJiYgYiAhPT0gYlxufVxuXG5mdW5jdGlvbiBsb29zZUlzKGEsIGIpIHtcbiAgICByZXR1cm4gYSA9PSBiIHx8IGEgIT09IGEgJiYgYiAhPT0gYiAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGVxZXFlcVxufVxuXG4vKiBlc2xpbnQtZW5hYmxlIG5vLXNlbGYtY29tcGFyZSAqL1xuXG52YXIgY2hlY2sgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIHByZWZpeCh0eXBlKSB7XG4gICAgICAgIHJldHVybiAoL15bYWVpb3VdLy50ZXN0KHR5cGUpID8gXCJhbiBcIiA6IFwiYSBcIikgKyB0eXBlXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY2hlY2sodmFsdWUsIHR5cGUpIHtcbiAgICAgICAgaWYgKHR5cGUgPT09IFwiYXJyYXlcIikgcmV0dXJuIEFycmF5LmlzQXJyYXkodmFsdWUpXG4gICAgICAgIGlmICh0eXBlID09PSBcInJlZ2V4cFwiKSByZXR1cm4gdG9TdHJpbmcuY2FsbCh2YWx1ZSkgPT09IFwiW29iamVjdCBSZWdFeHBdXCJcbiAgICAgICAgaWYgKHR5cGUgPT09IFwib2JqZWN0XCIpIHJldHVybiB2YWx1ZSAhPSBudWxsICYmIHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIlxuICAgICAgICBpZiAodHlwZSA9PT0gXCJudWxsXCIpIHJldHVybiB2YWx1ZSA9PT0gbnVsbFxuICAgICAgICBpZiAodHlwZSA9PT0gXCJub25lXCIpIHJldHVybiB2YWx1ZSA9PSBudWxsXG4gICAgICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT09IHR5cGVcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjaGVja0xpc3QodmFsdWUsIHR5cGVzKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdHlwZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChjaGVjayh2YWx1ZSwgdHlwZXNbaV0pKSByZXR1cm4gdHJ1ZVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY2hlY2tTaW5nbGUodmFsdWUsIG5hbWUsIHR5cGUpIHtcbiAgICAgICAgaWYgKCFjaGVjayh2YWx1ZSwgdHlwZSkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJgXCIgKyBuYW1lICsgXCJgIG11c3QgYmUgXCIgKyBwcmVmaXgodHlwZSkpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjaGVja01hbnkodmFsdWUsIG5hbWUsIHR5cGVzKSB7XG4gICAgICAgIGlmICghY2hlY2tMaXN0KHZhbHVlLCB0eXBlcykpIHtcbiAgICAgICAgICAgIHZhciBzdHIgPSBcImBcIiArIG5hbWUgKyBcImAgbXVzdCBiZSBlaXRoZXJcIlxuXG4gICAgICAgICAgICBpZiAodHlwZXMubGVuZ3RoID09PSAyKSB7XG4gICAgICAgICAgICAgICAgc3RyICs9IHByZWZpeCh0eXBlc1swXSkgKyBcIiBvciBcIiArIHByZWZpeCh0eXBlc1sxXSlcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc3RyICs9IHByZWZpeCh0eXBlc1swXSlcblxuICAgICAgICAgICAgICAgIHZhciBlbmQgPSB0eXBlcy5sZW5ndGggLSAxXG5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0ciArPSBcIiwgXCIgKyBwcmVmaXgodHlwZXNbaV0pXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgc3RyICs9IFwiLCBvciBcIiArIHByZWZpeCh0eXBlc1tlbmRdKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKHN0cilcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUsIG5hbWUsIHR5cGUpIHtcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHR5cGUpKSByZXR1cm4gY2hlY2tTaW5nbGUodmFsdWUsIG5hbWUsIHR5cGUpXG4gICAgICAgIGlmICh0eXBlLmxlbmd0aCA9PT0gMSkgcmV0dXJuIGNoZWNrU2luZ2xlKHZhbHVlLCBuYW1lLCB0eXBlWzBdKVxuICAgICAgICByZXR1cm4gY2hlY2tNYW55KHZhbHVlLCBuYW1lLCB0eXBlKVxuICAgIH1cbn0pKClcblxuZnVuY3Rpb24gY2hlY2tUeXBlT2YodmFsdWUsIG5hbWUpIHtcbiAgICBpZiAodmFsdWUgPT09IFwiYm9vbGVhblwiIHx8IHZhbHVlID09PSBcImZ1bmN0aW9uXCIpIHJldHVyblxuICAgIGlmICh2YWx1ZSA9PT0gXCJudW1iZXJcIiB8fCB2YWx1ZSA9PT0gXCJvYmplY3RcIiB8fCB2YWx1ZSA9PT0gXCJzdHJpbmdcIikgcmV0dXJuXG4gICAgaWYgKHZhbHVlID09PSBcInN5bWJvbFwiIHx8IHZhbHVlID09PSBcInVuZGVmaW5lZFwiKSByZXR1cm5cbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYFwiICsgbmFtZSArIFwiYCBtdXN0IGJlIGEgdmFsaWQgYHR5cGVvZmAgdmFsdWVcIilcbn1cblxuLy8gVGhpcyBob2xkcyBldmVyeXRoaW5nIHRvIGJlIGFkZGVkLlxudmFyIG1ldGhvZHMgPSBbXVxudmFyIGFsaWFzZXMgPSBbXVxuXG5mdW5jdGlvbiBnZXRBc3NlcnRpb25EZXByZWNhdGlvbihuYW1lKSB7XG4gICAgdmFyIHJlcGxhY2VtZW50ID0gbmFtZVxuXG4gICAgc3dpdGNoIChuYW1lKSB7XG4gICAgY2FzZSBcImJvb2xlYW5cIjogcmVwbGFjZW1lbnQgPSBcImlzQm9vbGVhblwiOyBicmVha1xuICAgIGNhc2UgXCJmdW5jdGlvblwiOiByZXBsYWNlbWVudCA9IFwiaXNGdW5jdGlvblwiOyBicmVha1xuICAgIGNhc2UgXCJudW1iZXJcIjogcmVwbGFjZW1lbnQgPSBcImlzTnVtYmVyXCI7IGJyZWFrXG4gICAgY2FzZSBcIm9iamVjdFwiOiByZXBsYWNlbWVudCA9IFwiaXNPYmplY3RcIjsgYnJlYWtcbiAgICBjYXNlIFwic3RyaW5nXCI6IHJlcGxhY2VtZW50ID0gXCJpc1N0cmluZ1wiOyBicmVha1xuICAgIGNhc2UgXCJzeW1ib2xcIjogcmVwbGFjZW1lbnQgPSBcImlzU3ltYm9sXCI7IGJyZWFrXG4gICAgY2FzZSBcImluc3RhbmNlb2ZcIjogcmVwbGFjZW1lbnQgPSBcImlzXCI7IGJyZWFrXG4gICAgY2FzZSBcIm5vdEluc3RhbmNlb2ZcIjogcmVwbGFjZW1lbnQgPSBcIm5vdFwiOyBicmVha1xuICAgIGNhc2UgXCJoYXNMZW5ndGhcIjogcmVwbGFjZW1lbnQgPSBcImVxdWFsXCI7IGJyZWFrXG4gICAgY2FzZSBcIm5vdExlbmd0aFwiOiByZXBsYWNlbWVudCA9IFwibm90RXF1YWxcIjsgYnJlYWtcbiAgICBjYXNlIFwibGVuZ3RoQXRMZWFzdFwiOiByZXBsYWNlbWVudCA9IFwiYXRMZWFzdFwiOyBicmVha1xuICAgIGNhc2UgXCJsZW5ndGhBdE1vc3RcIjogcmVwbGFjZW1lbnQgPSBcImF0TW9zdFwiOyBicmVha1xuICAgIGNhc2UgXCJsZW5ndGhBYm92ZVwiOiByZXBsYWNlbWVudCA9IFwiYWJvdmVcIjsgYnJlYWtcbiAgICBjYXNlIFwibGVuZ3RoQmVsb3dcIjogcmVwbGFjZW1lbnQgPSBcImJlbG93XCI7IGJyZWFrXG4gICAgY2FzZSBcIm5vdEluY2x1ZGVzQWxsXCI6IHJlcGxhY2VtZW50ID0gXCJub3RJbmNsdWRlc0FsbFwiOyBicmVha1xuICAgIGNhc2UgXCJub3RJbmNsdWRlc0xvb3NlQWxsXCI6IHJlcGxhY2VtZW50ID0gXCJub3RJbmNsdWRlc0FsbFwiOyBicmVha1xuICAgIGNhc2UgXCJub3RJbmNsdWRlc0RlZXBBbGxcIjogcmVwbGFjZW1lbnQgPSBcIm5vdEluY2x1ZGVzQWxsRGVlcFwiOyBicmVha1xuICAgIGNhc2UgXCJub3RJbmNsdWRlc01hdGNoQWxsXCI6IHJlcGxhY2VtZW50ID0gXCJub3RJbmNsdWRlc0FsbE1hdGNoXCI7IGJyZWFrXG4gICAgY2FzZSBcImluY2x1ZGVzQW55XCI6IHJlcGxhY2VtZW50ID0gXCJpbmNsdWRlc0FueVwiOyBicmVha1xuICAgIGNhc2UgXCJpbmNsdWRlc0xvb3NlQW55XCI6IHJlcGxhY2VtZW50ID0gXCJpbmNsdWRlc0FueVwiOyBicmVha1xuICAgIGNhc2UgXCJpbmNsdWRlc0RlZXBBbnlcIjogcmVwbGFjZW1lbnQgPSBcImluY2x1ZGVzQW55RGVlcFwiOyBicmVha1xuICAgIGNhc2UgXCJpbmNsdWRlc01hdGNoQW55XCI6IHJlcGxhY2VtZW50ID0gXCJpbmNsdWRlc0FueU1hdGNoXCI7IGJyZWFrXG4gICAgY2FzZSBcInVuZGVmaW5lZFwiOlxuICAgICAgICByZXR1cm4gXCJgdC51bmRlZmluZWQoKWAgaXMgZGVwcmVjYXRlZC4gVXNlIFwiICtcbiAgICAgICAgICAgIFwiYGFzc2VydC5lcXVhbCh1bmRlZmluZWQsIHZhbHVlKWAuIGZyb20gYHRoYWxsaXVtL2Fzc2VydGAgaW5zdGVhZC5cIlxuICAgIGNhc2UgXCJ0eXBlXCI6XG4gICAgICAgIHJldHVybiBcImB0LnR5cGUoKWAgaXMgZGVwcmVjYXRlZC4gVXNlIGBhc3NlcnQuaXNCb29sZWFuKClgL2V0Yy4gZnJvbSBcIiArXG4gICAgICAgICAgICBcImB0aGFsbGl1bS9hc3NlcnRgIGluc3RlYWQuXCJcbiAgICBkZWZhdWx0OiAvLyBpZ25vcmVcbiAgICB9XG5cbiAgICByZXR1cm4gXCJgdC5cIiArIG5hbWUgKyBcIigpYCBpcyBkZXByZWNhdGVkLiBVc2UgYGFzc2VydC5cIiArIHJlcGxhY2VtZW50ICtcbiAgICAgICAgXCIoKWAgZnJvbSBgdGhhbGxpdW0vYXNzZXJ0YCBpbnN0ZWFkLlwiXG59XG5cbi8qKlxuICogVGhlIGNvcmUgYXNzZXJ0aW9ucyBleHBvcnQsIGFzIGEgcGx1Z2luLlxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICh0KSB7XG4gICAgbWV0aG9kcy5mb3JFYWNoKGZ1bmN0aW9uIChtKSB7XG4gICAgICAgIHQuZGVmaW5lKG0ubmFtZSwgZGVwcmVjYXRlKGdldEFzc2VydGlvbkRlcHJlY2F0aW9uKG0ubmFtZSksIG0uY2FsbGJhY2spKVxuICAgIH0pXG4gICAgYWxpYXNlcy5mb3JFYWNoKGZ1bmN0aW9uIChhbGlhcykgeyB0W2FsaWFzLm5hbWVdID0gdFthbGlhcy5vcmlnaW5hbF0gfSlcbn1cblxuLy8gTGl0dGxlIGhlbHBlcnMgc28gdGhhdCB0aGVzZSBmdW5jdGlvbnMgb25seSBuZWVkIHRvIGJlIGNyZWF0ZWQgb25jZS5cbmZ1bmN0aW9uIGRlZmluZShuYW1lLCBjYWxsYmFjaykge1xuICAgIGNoZWNrKG5hbWUsIFwibmFtZVwiLCBcInN0cmluZ1wiKVxuICAgIGNoZWNrKGNhbGxiYWNrLCBcImNhbGxiYWNrXCIsIFwiZnVuY3Rpb25cIilcbiAgICBtZXRob2RzLnB1c2goe25hbWU6IG5hbWUsIGNhbGxiYWNrOiBjYWxsYmFja30pXG59XG5cbi8vIE11Y2ggZWFzaWVyIHRvIHR5cGVcbmZ1bmN0aW9uIG5lZ2F0ZShuYW1lKSB7XG4gICAgY2hlY2sobmFtZSwgXCJuYW1lXCIsIFwic3RyaW5nXCIpXG4gICAgcmV0dXJuIFwibm90XCIgKyBuYW1lWzBdLnRvVXBwZXJDYXNlKCkgKyBuYW1lLnNsaWNlKDEpXG59XG5cbi8vIFRoZSBiYXNpYyBhc3NlcnQuIEl0J3MgYWxtb3N0IHRoZXJlIGZvciBsb29rcywgZ2l2ZW4gaG93IGVhc3kgaXQgaXMgdG9cbi8vIGRlZmluZSB5b3VyIG93biBhc3NlcnRpb25zLlxuZnVuY3Rpb24gc2FuaXRpemUobWVzc2FnZSkge1xuICAgIHJldHVybiBtZXNzYWdlID8gU3RyaW5nKG1lc3NhZ2UpLnJlcGxhY2UoLyhcXHtcXHcrXFx9KS9nLCBcIlxcXFwkMVwiKSA6IFwiXCJcbn1cblxuZGVmaW5lKFwiYXNzZXJ0XCIsIGZ1bmN0aW9uICh0ZXN0LCBtZXNzYWdlKSB7XG4gICAgcmV0dXJuIHt0ZXN0OiB0ZXN0LCBtZXNzYWdlOiBzYW5pdGl6ZShtZXNzYWdlKX1cbn0pXG5cbmRlZmluZShcImZhaWxcIiwgZnVuY3Rpb24gKG1lc3NhZ2UpIHtcbiAgICByZXR1cm4ge3Rlc3Q6IGZhbHNlLCBtZXNzYWdlOiBzYW5pdGl6ZShtZXNzYWdlKX1cbn0pXG5cbi8qKlxuICogVGhlc2UgbWFrZXMgbWFueSBvZiB0aGUgY29tbW9uIG9wZXJhdG9ycyBtdWNoIGVhc2llciB0byBkby5cbiAqL1xuZnVuY3Rpb24gdW5hcnkobmFtZSwgZnVuYywgbWVzc2FnZXMpIHtcbiAgICBkZWZpbmUobmFtZSwgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0ZXN0OiBmdW5jKHZhbHVlKSxcbiAgICAgICAgICAgIGFjdHVhbDogdmFsdWUsXG4gICAgICAgICAgICBtZXNzYWdlOiBtZXNzYWdlc1swXSxcbiAgICAgICAgfVxuICAgIH0pXG5cbiAgICBkZWZpbmUobmVnYXRlKG5hbWUpLCBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHRlc3Q6ICFmdW5jKHZhbHVlKSxcbiAgICAgICAgICAgIGFjdHVhbDogdmFsdWUsXG4gICAgICAgICAgICBtZXNzYWdlOiBtZXNzYWdlc1sxXSxcbiAgICAgICAgfVxuICAgIH0pXG59XG5cbmZ1bmN0aW9uIGJpbmFyeShuYW1lLCBmdW5jLCBtZXNzYWdlcykge1xuICAgIGRlZmluZShuYW1lLCBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdGVzdDogZnVuYyhhY3R1YWwsIGV4cGVjdGVkKSxcbiAgICAgICAgICAgIGFjdHVhbDogYWN0dWFsLFxuICAgICAgICAgICAgZXhwZWN0ZWQ6IGV4cGVjdGVkLFxuICAgICAgICAgICAgbWVzc2FnZTogbWVzc2FnZXNbMF0sXG4gICAgICAgIH1cbiAgICB9KVxuXG4gICAgZGVmaW5lKG5lZ2F0ZShuYW1lKSwgZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHRlc3Q6ICFmdW5jKGFjdHVhbCwgZXhwZWN0ZWQpLFxuICAgICAgICAgICAgYWN0dWFsOiBhY3R1YWwsXG4gICAgICAgICAgICBleHBlY3RlZDogZXhwZWN0ZWQsXG4gICAgICAgICAgICBtZXNzYWdlOiBtZXNzYWdlc1sxXSxcbiAgICAgICAgfVxuICAgIH0pXG59XG5cbnVuYXJ5KFwib2tcIiwgZnVuY3Rpb24gKHgpIHsgcmV0dXJuICEheCB9LCBbXG4gICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBiZSBva1wiLFxuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGJlIG9rXCIsXG5dKVxuXG5cImJvb2xlYW4gZnVuY3Rpb24gbnVtYmVyIG9iamVjdCBzdHJpbmcgc3ltYm9sXCIuc3BsaXQoXCIgXCIpXG4uZm9yRWFjaChmdW5jdGlvbiAodHlwZSkge1xuICAgIHZhciBuYW1lID0gKHR5cGVbMF0gPT09IFwib1wiID8gXCJhbiBcIiA6IFwiYSBcIikgKyB0eXBlXG5cbiAgICB1bmFyeSh0eXBlLCBmdW5jdGlvbiAoeCkgeyByZXR1cm4gdHlwZW9mIHggPT09IHR5cGUgfSwgW1xuICAgICAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGJlIFwiICsgbmFtZSxcbiAgICAgICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgYmUgXCIgKyBuYW1lLFxuICAgIF0pXG59KVxuXG47W3RydWUsIGZhbHNlLCBudWxsLCB1bmRlZmluZWRdLmZvckVhY2goZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgdW5hcnkodmFsdWUgKyBcIlwiLCBmdW5jdGlvbiAoeCkgeyByZXR1cm4geCA9PT0gdmFsdWUgfSwgW1xuICAgICAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGJlIFwiICsgdmFsdWUsXG4gICAgICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGJlIFwiICsgdmFsdWUsXG4gICAgXSlcbn0pXG5cbnVuYXJ5KFwiZXhpc3RzXCIsIGZ1bmN0aW9uICh4KSB7IHJldHVybiB4ICE9IG51bGwgfSwgW1xuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gZXhpc3RcIixcbiAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBleGlzdFwiLFxuXSlcblxudW5hcnkoXCJhcnJheVwiLCBBcnJheS5pc0FycmF5LCBbXG4gICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBiZSBhbiBhcnJheVwiLFxuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGJlIGFuIGFycmF5XCIsXG5dKVxuXG5kZWZpbmUoXCJ0eXBlXCIsIGZ1bmN0aW9uIChvYmplY3QsIHR5cGUpIHtcbiAgICBjaGVja1R5cGVPZih0eXBlLCBcInR5cGVcIilcblxuICAgIHJldHVybiB7XG4gICAgICAgIHRlc3Q6IHR5cGVvZiBvYmplY3QgPT09IHR5cGUsXG4gICAgICAgIGV4cGVjdGVkOiB0eXBlLFxuICAgICAgICBhY3R1YWw6IHR5cGVvZiBvYmplY3QsXG4gICAgICAgIG86IG9iamVjdCxcbiAgICAgICAgbWVzc2FnZTogXCJFeHBlY3RlZCB0eXBlb2Yge299IHRvIGJlIHtleHBlY3RlZH0sIGJ1dCBmb3VuZCB7YWN0dWFsfVwiLFxuICAgIH1cbn0pXG5cbmRlZmluZShcIm5vdFR5cGVcIiwgZnVuY3Rpb24gKG9iamVjdCwgdHlwZSkge1xuICAgIGNoZWNrVHlwZU9mKHR5cGUsIFwidHlwZVwiKVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgdGVzdDogdHlwZW9mIG9iamVjdCAhPT0gdHlwZSxcbiAgICAgICAgZXhwZWN0ZWQ6IHR5cGUsXG4gICAgICAgIG86IG9iamVjdCxcbiAgICAgICAgbWVzc2FnZTogXCJFeHBlY3RlZCB0eXBlb2Yge299IHRvIG5vdCBiZSB7ZXhwZWN0ZWR9XCIsXG4gICAgfVxufSlcblxuZGVmaW5lKFwiaW5zdGFuY2VvZlwiLCBmdW5jdGlvbiAob2JqZWN0LCBUeXBlKSB7XG4gICAgY2hlY2soVHlwZSwgXCJUeXBlXCIsIFwiZnVuY3Rpb25cIilcblxuICAgIHJldHVybiB7XG4gICAgICAgIHRlc3Q6IG9iamVjdCBpbnN0YW5jZW9mIFR5cGUsXG4gICAgICAgIGV4cGVjdGVkOiBUeXBlLFxuICAgICAgICBhY3R1YWw6IG9iamVjdC5jb25zdHJ1Y3RvcixcbiAgICAgICAgbzogb2JqZWN0LFxuICAgICAgICBtZXNzYWdlOiBcIkV4cGVjdGVkIHtvfSB0byBiZSBhbiBpbnN0YW5jZSBvZiB7ZXhwZWN0ZWR9LCBidXQgZm91bmQge2FjdHVhbH1cIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtbGVuXG4gICAgfVxufSlcblxuZGVmaW5lKFwibm90SW5zdGFuY2VvZlwiLCBmdW5jdGlvbiAob2JqZWN0LCBUeXBlKSB7XG4gICAgY2hlY2soVHlwZSwgXCJUeXBlXCIsIFwiZnVuY3Rpb25cIilcblxuICAgIHJldHVybiB7XG4gICAgICAgIHRlc3Q6ICEob2JqZWN0IGluc3RhbmNlb2YgVHlwZSksXG4gICAgICAgIGV4cGVjdGVkOiBUeXBlLFxuICAgICAgICBvOiBvYmplY3QsXG4gICAgICAgIG1lc3NhZ2U6IFwiRXhwZWN0ZWQge299IHRvIG5vdCBiZSBhbiBpbnN0YW5jZSBvZiB7ZXhwZWN0ZWR9XCIsXG4gICAgfVxufSlcblxuYmluYXJ5KFwiZXF1YWxcIiwgc3RyaWN0SXMsIFtcbiAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGVxdWFsIHtleHBlY3RlZH1cIixcbiAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBlcXVhbCB7ZXhwZWN0ZWR9XCIsXG5dKVxuXG5iaW5hcnkoXCJlcXVhbExvb3NlXCIsIGxvb3NlSXMsIFtcbiAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGxvb3NlbHkgZXF1YWwge2V4cGVjdGVkfVwiLFxuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGxvb3NlbHkgZXF1YWwge2V4cGVjdGVkfVwiLFxuXSlcblxuZnVuY3Rpb24gY29tcChuYW1lLCBjb21wYXJlLCBtZXNzYWdlKSB7XG4gICAgZGVmaW5lKG5hbWUsIGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gICAgICAgIGNoZWNrKGFjdHVhbCwgXCJhY3R1YWxcIiwgXCJudW1iZXJcIilcbiAgICAgICAgY2hlY2soZXhwZWN0ZWQsIFwiZXhwZWN0ZWRcIiwgXCJudW1iZXJcIilcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdGVzdDogY29tcGFyZShhY3R1YWwsIGV4cGVjdGVkKSxcbiAgICAgICAgICAgIGFjdHVhbDogYWN0dWFsLFxuICAgICAgICAgICAgZXhwZWN0ZWQ6IGV4cGVjdGVkLFxuICAgICAgICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgICAgfVxuICAgIH0pXG59XG5cbi8qIGVzbGludC1kaXNhYmxlIG1heC1sZW4gKi9cblxuY29tcChcImF0TGVhc3RcIiwgZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGEgPj0gYiB9LCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGJlIGF0IGxlYXN0IHtleHBlY3RlZH1cIilcbmNvbXAoXCJhdE1vc3RcIiwgZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGEgPD0gYiB9LCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGJlIGF0IG1vc3Qge2V4cGVjdGVkfVwiKVxuY29tcChcImFib3ZlXCIsIGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBhID4gYiB9LCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGJlIGFib3ZlIHtleHBlY3RlZH1cIilcbmNvbXAoXCJiZWxvd1wiLCBmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYSA8IGIgfSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBiZSBiZWxvdyB7ZXhwZWN0ZWR9XCIpXG5cbmRlZmluZShcImJldHdlZW5cIiwgZnVuY3Rpb24gKGFjdHVhbCwgbG93ZXIsIHVwcGVyKSB7XG4gICAgY2hlY2soYWN0dWFsLCBcImFjdHVhbFwiLCBcIm51bWJlclwiKVxuICAgIGNoZWNrKGxvd2VyLCBcImxvd2VyXCIsIFwibnVtYmVyXCIpXG4gICAgY2hlY2sodXBwZXIsIFwidXBwZXJcIiwgXCJudW1iZXJcIilcblxuICAgIHJldHVybiB7XG4gICAgICAgIHRlc3Q6IGFjdHVhbCA+PSBsb3dlciAmJiBhY3R1YWwgPD0gdXBwZXIsXG4gICAgICAgIGFjdHVhbDogYWN0dWFsLFxuICAgICAgICBsb3dlcjogbG93ZXIsXG4gICAgICAgIHVwcGVyOiB1cHBlcixcbiAgICAgICAgbWVzc2FnZTogXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBiZSBiZXR3ZWVuIHtsb3dlcn0gYW5kIHt1cHBlcn1cIixcbiAgICB9XG59KVxuXG4vKiBlc2xpbnQtZW5hYmxlIG1heC1sZW4gKi9cblxuYmluYXJ5KFwiZGVlcEVxdWFsXCIsIG1hdGNoLnN0cmljdCwgW1xuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gZGVlcGx5IGVxdWFsIHtleHBlY3RlZH1cIixcbiAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBkZWVwbHkgZXF1YWwge2V4cGVjdGVkfVwiLFxuXSlcblxuYmluYXJ5KFwibWF0Y2hcIiwgbWF0Y2gubWF0Y2gsIFtcbiAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG1hdGNoIHtleHBlY3RlZH1cIixcbiAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBtYXRjaCB7ZXhwZWN0ZWR9XCIsXG5dKVxuXG5mdW5jdGlvbiBoYXMobmFtZSwgXykgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1sZW4sIG1heC1wYXJhbXNcbiAgICBpZiAoXy5lcXVhbHMgPT09IGxvb3NlSXMpIHtcbiAgICAgICAgZGVmaW5lKG5hbWUsIGZ1bmN0aW9uIChvYmplY3QsIGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdGVzdDogXy5oYXMob2JqZWN0LCBrZXkpICYmIF8uaXMoXy5nZXQob2JqZWN0LCBrZXkpLCB2YWx1ZSksXG4gICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IHZhbHVlLFxuICAgICAgICAgICAgICAgIGFjdHVhbDogb2JqZWN0W2tleV0sXG4gICAgICAgICAgICAgICAga2V5OiBrZXksXG4gICAgICAgICAgICAgICAgb2JqZWN0OiBvYmplY3QsXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogXy5tZXNzYWdlc1swXSxcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcblxuICAgICAgICBkZWZpbmUobmVnYXRlKG5hbWUpLCBmdW5jdGlvbiAob2JqZWN0LCBrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHRlc3Q6ICFfLmhhcyhvYmplY3QsIGtleSkgfHwgIV8uaXMoXy5nZXQob2JqZWN0LCBrZXkpLCB2YWx1ZSksXG4gICAgICAgICAgICAgICAgYWN0dWFsOiB2YWx1ZSxcbiAgICAgICAgICAgICAgICBrZXk6IGtleSxcbiAgICAgICAgICAgICAgICBvYmplY3Q6IG9iamVjdCxcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBfLm1lc3NhZ2VzWzJdLFxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGRlZmluZShuYW1lLCBmdW5jdGlvbiAob2JqZWN0LCBrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICB2YXIgdGVzdCA9IF8uaGFzKG9iamVjdCwga2V5KVxuXG4gICAgICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSAzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgdGVzdDogdGVzdCAmJiBfLmlzKF8uZ2V0KG9iamVjdCwga2V5KSwgdmFsdWUpLFxuICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogdmFsdWUsXG4gICAgICAgICAgICAgICAgICAgIGFjdHVhbDogb2JqZWN0W2tleV0sXG4gICAgICAgICAgICAgICAgICAgIGtleToga2V5LFxuICAgICAgICAgICAgICAgICAgICBvYmplY3Q6IG9iamVjdCxcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogXy5tZXNzYWdlc1swXSxcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIHRlc3Q6IHRlc3QsXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBrZXksXG4gICAgICAgICAgICAgICAgICAgIGFjdHVhbDogb2JqZWN0LFxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBfLm1lc3NhZ2VzWzFdLFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcblxuICAgICAgICBkZWZpbmUobmVnYXRlKG5hbWUpLCBmdW5jdGlvbiAob2JqZWN0LCBrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICB2YXIgdGVzdCA9ICFfLmhhcyhvYmplY3QsIGtleSlcblxuICAgICAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gMykge1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIHRlc3Q6IHRlc3QgfHwgIV8uaXMoXy5nZXQob2JqZWN0LCBrZXkpLCB2YWx1ZSksXG4gICAgICAgICAgICAgICAgICAgIGFjdHVhbDogdmFsdWUsXG4gICAgICAgICAgICAgICAgICAgIGtleToga2V5LFxuICAgICAgICAgICAgICAgICAgICBvYmplY3Q6IG9iamVjdCxcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogXy5tZXNzYWdlc1syXSxcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIHRlc3Q6IHRlc3QsXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBrZXksXG4gICAgICAgICAgICAgICAgICAgIGFjdHVhbDogb2JqZWN0LFxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBfLm1lc3NhZ2VzWzNdLFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGhhc093bktleShvYmplY3QsIGtleSkgeyByZXR1cm4gaGFzT3duLmNhbGwob2JqZWN0LCBrZXkpIH1cbmZ1bmN0aW9uIGhhc0luS2V5KG9iamVjdCwga2V5KSB7IHJldHVybiBrZXkgaW4gb2JqZWN0IH1cbmZ1bmN0aW9uIGhhc0luQ29sbChvYmplY3QsIGtleSkgeyByZXR1cm4gb2JqZWN0LmhhcyhrZXkpIH1cbmZ1bmN0aW9uIGhhc09iamVjdEdldChvYmplY3QsIGtleSkgeyByZXR1cm4gb2JqZWN0W2tleV0gfVxuZnVuY3Rpb24gaGFzQ29sbEdldChvYmplY3QsIGtleSkgeyByZXR1cm4gb2JqZWN0LmdldChrZXkpIH1cblxuaGFzKFwiaGFzT3duXCIsIHtcbiAgICBpczogc3RyaWN0SXMsXG4gICAgaGFzOiBoYXNPd25LZXksXG4gICAgZ2V0OiBoYXNPYmplY3RHZXQsXG4gICAgbWVzc2FnZXM6IFtcbiAgICAgICAgXCJFeHBlY3RlZCB7b2JqZWN0fSB0byBoYXZlIG93biBrZXkge2tleX0gZXF1YWwgdG8ge2V4cGVjdGVkfSwgYnV0IGZvdW5kIHthY3R1YWx9XCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LWxlblxuICAgICAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGhhdmUgb3duIGtleSB7ZXhwZWN0ZWR9XCIsXG4gICAgICAgIFwiRXhwZWN0ZWQge29iamVjdH0gdG8gbm90IGhhdmUgb3duIGtleSB7a2V5fSBlcXVhbCB0byB7YWN0dWFsfVwiLFxuICAgICAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBoYXZlIG93biBrZXkge2V4cGVjdGVkfVwiLFxuICAgIF0sXG59KVxuXG5oYXMoXCJoYXNPd25Mb29zZVwiLCB7XG4gICAgaXM6IGxvb3NlSXMsXG4gICAgaGFzOiBoYXNPd25LZXksXG4gICAgZ2V0OiBoYXNPYmplY3RHZXQsXG4gICAgbWVzc2FnZXM6IFtcbiAgICAgICAgXCJFeHBlY3RlZCB7b2JqZWN0fSB0byBoYXZlIG93biBrZXkge2tleX0gbG9vc2VseSBlcXVhbCB0byB7ZXhwZWN0ZWR9LCBidXQgZm91bmQge2FjdHVhbH1cIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtbGVuXG4gICAgICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gaGF2ZSBvd24ga2V5IHtleHBlY3RlZH1cIixcbiAgICAgICAgXCJFeHBlY3RlZCB7b2JqZWN0fSB0byBub3QgaGF2ZSBvd24ga2V5IHtrZXl9IGxvb3NlbHkgZXF1YWwgdG8ge2FjdHVhbH1cIixcbiAgICAgICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgaGF2ZSBvd24ga2V5IHtleHBlY3RlZH1cIixcbiAgICBdLFxufSlcblxuaGFzKFwiaGFzS2V5XCIsIHtcbiAgICBpczogc3RyaWN0SXMsXG4gICAgaGFzOiBoYXNJbktleSxcbiAgICBnZXQ6IGhhc09iamVjdEdldCxcbiAgICBtZXNzYWdlczogW1xuICAgICAgICBcIkV4cGVjdGVkIHtvYmplY3R9IHRvIGhhdmUga2V5IHtrZXl9IGVxdWFsIHRvIHtleHBlY3RlZH0sIGJ1dCBmb3VuZCB7YWN0dWFsfVwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1sZW5cbiAgICAgICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBoYXZlIGtleSB7ZXhwZWN0ZWR9XCIsXG4gICAgICAgIFwiRXhwZWN0ZWQge29iamVjdH0gdG8gbm90IGhhdmUga2V5IHtrZXl9IGVxdWFsIHRvIHthY3R1YWx9XCIsXG4gICAgICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGhhdmUga2V5IHtleHBlY3RlZH1cIixcbiAgICBdLFxufSlcblxuaGFzKFwiaGFzS2V5TG9vc2VcIiwge1xuICAgIGlzOiBsb29zZUlzLFxuICAgIGhhczogaGFzSW5LZXksXG4gICAgZ2V0OiBoYXNPYmplY3RHZXQsXG4gICAgbWVzc2FnZXM6IFtcbiAgICAgICAgXCJFeHBlY3RlZCB7b2JqZWN0fSB0byBoYXZlIGtleSB7a2V5fSBsb29zZWx5IGVxdWFsIHRvIHtleHBlY3RlZH0sIGJ1dCBmb3VuZCB7YWN0dWFsfVwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1sZW5cbiAgICAgICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBoYXZlIGtleSB7ZXhwZWN0ZWR9XCIsXG4gICAgICAgIFwiRXhwZWN0ZWQge29iamVjdH0gdG8gbm90IGhhdmUga2V5IHtrZXl9IGxvb3NlbHkgZXF1YWwgdG8ge2FjdHVhbH1cIixcbiAgICAgICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgaGF2ZSBrZXkge2V4cGVjdGVkfVwiLFxuICAgIF0sXG59KVxuXG5oYXMoXCJoYXNcIiwge1xuICAgIGlzOiBzdHJpY3RJcyxcbiAgICBoYXM6IGhhc0luQ29sbCxcbiAgICBnZXQ6IGhhc0NvbGxHZXQsXG4gICAgbWVzc2FnZXM6IFtcbiAgICAgICAgXCJFeHBlY3RlZCB7b2JqZWN0fSB0byBoYXZlIGtleSB7a2V5fSBlcXVhbCB0byB7ZXhwZWN0ZWR9LCBidXQgZm91bmQge2FjdHVhbH1cIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtbGVuXG4gICAgICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gaGF2ZSBrZXkge2V4cGVjdGVkfVwiLFxuICAgICAgICBcIkV4cGVjdGVkIHtvYmplY3R9IHRvIG5vdCBoYXZlIGtleSB7a2V5fSBlcXVhbCB0byB7YWN0dWFsfVwiLFxuICAgICAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBoYXZlIGtleSB7ZXhwZWN0ZWR9XCIsXG4gICAgXSxcbn0pXG5cbmhhcyhcImhhc0xvb3NlXCIsIHtcbiAgICBpczogbG9vc2VJcyxcbiAgICBoYXM6IGhhc0luQ29sbCxcbiAgICBnZXQ6IGhhc0NvbGxHZXQsXG4gICAgbWVzc2FnZXM6IFtcbiAgICAgICAgXCJFeHBlY3RlZCB7b2JqZWN0fSB0byBoYXZlIGtleSB7a2V5fSBlcXVhbCB0byB7ZXhwZWN0ZWR9LCBidXQgZm91bmQge2FjdHVhbH1cIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtbGVuXG4gICAgICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gaGF2ZSBrZXkge2V4cGVjdGVkfVwiLFxuICAgICAgICBcIkV4cGVjdGVkIHtvYmplY3R9IHRvIG5vdCBoYXZlIGtleSB7a2V5fSBlcXVhbCB0byB7YWN0dWFsfVwiLFxuICAgICAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBoYXZlIGtleSB7ZXhwZWN0ZWR9XCIsXG4gICAgXSxcbn0pXG5cbmZ1bmN0aW9uIGdldE5hbWUoZnVuYykge1xuICAgIGlmIChmdW5jLm5hbWUgIT0gbnVsbCkgcmV0dXJuIGZ1bmMubmFtZSB8fCBcIjxhbm9ueW1vdXM+XCJcbiAgICBpZiAoZnVuYy5kaXNwbGF5TmFtZSAhPSBudWxsKSByZXR1cm4gZnVuYy5kaXNwbGF5TmFtZSB8fCBcIjxhbm9ueW1vdXM+XCJcbiAgICByZXR1cm4gXCI8YW5vbnltb3VzPlwiXG59XG5cbmZ1bmN0aW9uIHRocm93cyhuYW1lLCBfKSB7XG4gICAgZnVuY3Rpb24gcnVuKGludmVydCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGZ1bmMsIG1hdGNoZXIpIHtcbiAgICAgICAgICAgIGNoZWNrKGZ1bmMsIFwiZnVuY1wiLCBcImZ1bmN0aW9uXCIpXG4gICAgICAgICAgICBfLmNoZWNrKG1hdGNoZXIpXG5cbiAgICAgICAgICAgIHZhciB0ZXN0LCBlcnJvclxuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGZ1bmMoKVxuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIHRlc3QgPSBfLnRlc3QobWF0Y2hlciwgZXJyb3IgPSBlKVxuXG4gICAgICAgICAgICAgICAgLy8gUmV0aHJvdyB1bmtub3duIGVycm9ycyB0aGF0IGRvbid0IG1hdGNoIHdoZW4gYSBtYXRjaGVyIHdhc1xuICAgICAgICAgICAgICAgIC8vIHBhc3NlZCAtIGl0J3MgZWFzaWVyIHRvIGRlYnVnIHVuZXhwZWN0ZWQgZXJyb3JzIHdoZW4geW91IGhhdmVcbiAgICAgICAgICAgICAgICAvLyBhIHN0YWNrIHRyYWNlLiBEb24ndCByZXRocm93IG5vbi1lcnJvcnMsIHRob3VnaC5cbiAgICAgICAgICAgICAgICBpZiAoXy5yZXRocm93KG1hdGNoZXIsIGludmVydCwgdGVzdCwgZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0ZXN0OiAhIXRlc3QgXiBpbnZlcnQsXG4gICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IG1hdGNoZXIsXG4gICAgICAgICAgICAgICAgZXJyb3I6IGVycm9yLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IF8ubWVzc2FnZShtYXRjaGVyLCBpbnZlcnQsIHRlc3QpLFxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZGVmaW5lKG5hbWUsIHJ1bihmYWxzZSkpXG4gICAgZGVmaW5lKG5lZ2F0ZShuYW1lKSwgcnVuKHRydWUpKVxufVxuXG50aHJvd3MoXCJ0aHJvd3NcIiwge1xuICAgIHRlc3Q6IGZ1bmN0aW9uIChUeXBlLCBlKSB7IHJldHVybiBUeXBlID09IG51bGwgfHwgZSBpbnN0YW5jZW9mIFR5cGUgfSxcbiAgICBjaGVjazogZnVuY3Rpb24gKFR5cGUpIHsgY2hlY2soVHlwZSwgXCJUeXBlXCIsIFtcIm5vbmVcIiwgXCJmdW5jdGlvblwiXSkgfSxcblxuICAgIHJldGhyb3c6IGZ1bmN0aW9uIChtYXRjaGVyLCBpbnZlcnQsIHRlc3QsIGUpIHtcbiAgICAgICAgcmV0dXJuIG1hdGNoZXIgIT0gbnVsbCAmJiAhaW52ZXJ0ICYmICF0ZXN0ICYmIGUgaW5zdGFuY2VvZiBFcnJvclxuICAgIH0sXG5cbiAgICBtZXNzYWdlOiBmdW5jdGlvbiAoVHlwZSwgaW52ZXJ0LCB0ZXN0KSB7XG4gICAgICAgIHZhciBzdHIgPSBcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIFwiXG5cbiAgICAgICAgaWYgKGludmVydCkgc3RyICs9IFwibm90IFwiXG4gICAgICAgIHN0ciArPSBcInRocm93XCJcblxuICAgICAgICBpZiAoVHlwZSAhPSBudWxsKSB7XG4gICAgICAgICAgICBzdHIgKz0gXCIgYW4gaW5zdGFuY2Ugb2YgXCIgKyBnZXROYW1lKFR5cGUpXG4gICAgICAgICAgICBpZiAoIWludmVydCAmJiB0ZXN0ID09PSBmYWxzZSkgc3RyICs9IFwiLCBidXQgZm91bmQge2Vycm9yfVwiXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc3RyXG4gICAgfSxcbn0pXG5cbnRocm93cyhcInRocm93c01hdGNoXCIsIHtcbiAgICB0ZXN0OiBmdW5jdGlvbiAobWF0Y2hlciwgZSkge1xuICAgICAgICBpZiAodHlwZW9mIG1hdGNoZXIgPT09IFwic3RyaW5nXCIpIHJldHVybiBlLm1lc3NhZ2UgPT09IG1hdGNoZXJcbiAgICAgICAgaWYgKHR5cGVvZiBtYXRjaGVyID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiAhIW1hdGNoZXIoZSlcbiAgICAgICAgcmV0dXJuIG1hdGNoZXIudGVzdChlLm1lc3NhZ2UpXG4gICAgfSxcblxuICAgIGNoZWNrOiBmdW5jdGlvbiAobWF0Y2hlcikge1xuICAgICAgICAvLyBOb3QgYWNjZXB0aW5nIG9iamVjdHMgeWV0LlxuICAgICAgICBjaGVjayhtYXRjaGVyLCBcIm1hdGNoZXJcIiwgW1wic3RyaW5nXCIsIFwicmVnZXhwXCIsIFwiZnVuY3Rpb25cIl0pXG4gICAgfSxcblxuICAgIHJldGhyb3c6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIGZhbHNlIH0sXG5cbiAgICBtZXNzYWdlOiBmdW5jdGlvbiAoXywgaW52ZXJ0LCB0ZXN0KSB7XG4gICAgICAgIGlmIChpbnZlcnQpIHtcbiAgICAgICAgICAgIHJldHVybiBcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIG5vdCB0aHJvdyBhbiBlcnJvciB0aGF0IG1hdGNoZXMge2V4cGVjdGVkfVwiIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LWxlblxuICAgICAgICB9IGVsc2UgaWYgKHRlc3QgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIFwiRXhwZWN0ZWQgY2FsbGJhY2sgdG8gdGhyb3cgYW4gZXJyb3IgdGhhdCBtYXRjaGVzIHtleHBlY3RlZH0sIGJ1dCBmb3VuZCBubyBlcnJvclwiIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LWxlblxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIFwiRXhwZWN0ZWQgY2FsbGJhY2sgdG8gdGhyb3cgYW4gZXJyb3IgdGhhdCBtYXRjaGVzIHtleHBlY3RlZH0sIGJ1dCBmb3VuZCB7ZXJyb3J9XCIgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtbGVuXG4gICAgICAgIH1cbiAgICB9LFxufSlcblxuZnVuY3Rpb24gbGVuKG5hbWUsIGNvbXBhcmUsIG1lc3NhZ2UpIHtcbiAgICBkZWZpbmUobmFtZSwgZnVuY3Rpb24gKG9iamVjdCwgbGVuZ3RoKSB7XG4gICAgICAgIGNoZWNrKG9iamVjdCwgXCJvYmplY3RcIiwgXCJvYmplY3RcIilcbiAgICAgICAgY2hlY2sobGVuZ3RoLCBcImxlbmd0aFwiLCBcIm51bWJlclwiKVxuXG4gICAgICAgIHZhciBsZW4gPSBvYmplY3QubGVuZ3RoXG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHRlc3Q6IGxlbiAhPSBudWxsICYmIGNvbXBhcmUobGVuLCArbGVuZ3RoKSxcbiAgICAgICAgICAgIGV4cGVjdGVkOiBsZW5ndGgsXG4gICAgICAgICAgICBhY3R1YWw6IGxlbixcbiAgICAgICAgICAgIG9iamVjdDogb2JqZWN0LFxuICAgICAgICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgICAgfVxuICAgIH0pXG59XG5cbi8qIGVzbGludC1kaXNhYmxlIG1heC1sZW4gKi9cblxuLy8gTm90ZTogdGhlc2UgYWx3YXlzIGZhaWwgd2l0aCBOYU5zLlxubGVuKFwibGVuZ3RoXCIsIGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBhID09PSBiIH0sIFwiRXhwZWN0ZWQge29iamVjdH0gdG8gaGF2ZSBsZW5ndGgge2V4cGVjdGVkfSwgYnV0IGZvdW5kIHthY3R1YWx9XCIpXG5sZW4oXCJub3RMZW5ndGhcIiwgZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGEgIT09IGIgfSwgXCJFeHBlY3RlZCB7b2JqZWN0fSB0byBub3QgaGF2ZSBsZW5ndGgge2FjdHVhbH1cIilcbmxlbihcImxlbmd0aEF0TGVhc3RcIiwgZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGEgPj0gYiB9LCBcIkV4cGVjdGVkIHtvYmplY3R9IHRvIGhhdmUgbGVuZ3RoIGF0IGxlYXN0IHtleHBlY3RlZH0sIGJ1dCBmb3VuZCB7YWN0dWFsfVwiKVxubGVuKFwibGVuZ3RoQXRNb3N0XCIsIGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBhIDw9IGIgfSwgXCJFeHBlY3RlZCB7b2JqZWN0fSB0byBoYXZlIGxlbmd0aCBhdCBtb3N0IHtleHBlY3RlZH0sIGJ1dCBmb3VuZCB7YWN0dWFsfVwiKVxubGVuKFwibGVuZ3RoQWJvdmVcIiwgZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGEgPiBiIH0sIFwiRXhwZWN0ZWQge29iamVjdH0gdG8gaGF2ZSBsZW5ndGggYWJvdmUge2V4cGVjdGVkfSwgYnV0IGZvdW5kIHthY3R1YWx9XCIpXG5sZW4oXCJsZW5ndGhCZWxvd1wiLCBmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYSA8IGIgfSwgXCJFeHBlY3RlZCB7b2JqZWN0fSB0byBoYXZlIGxlbmd0aCBiZWxvdyB7ZXhwZWN0ZWR9LCBidXQgZm91bmQge2FjdHVhbH1cIilcblxuLyogZXNsaW50LWVuYWJsZSBtYXgtbGVuICovXG5cbi8vIE5vdGU6IHRoZXNlIHR3byBhbHdheXMgZmFpbCB3aGVuIGRlYWxpbmcgd2l0aCBOYU5zLlxuZGVmaW5lKFwiY2xvc2VUb1wiLCBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCwgZGVsdGEpIHtcbiAgICBjaGVjayhhY3R1YWwsIFwiYWN0dWFsXCIsIFwibnVtYmVyXCIpXG4gICAgY2hlY2soZXhwZWN0ZWQsIFwiZXhwZWN0ZWRcIiwgXCJudW1iZXJcIilcbiAgICBjaGVjayhkZWx0YSwgXCJkZWx0YVwiLCBcIm51bWJlclwiKVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgdGVzdDogTWF0aC5hYnMoYWN0dWFsIC0gZXhwZWN0ZWQpIDw9IE1hdGguYWJzKGRlbHRhKSxcbiAgICAgICAgYWN0dWFsOiBhY3R1YWwsXG4gICAgICAgIGV4cGVjdGVkOiBleHBlY3RlZCxcbiAgICAgICAgZGVsdGE6IGRlbHRhLFxuICAgICAgICBtZXNzYWdlOiBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGJlIHdpdGhpbiB7ZGVsdGF9IG9mIHtleHBlY3RlZH1cIixcbiAgICB9XG59KVxuXG5kZWZpbmUoXCJub3RDbG9zZVRvXCIsIGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkLCBkZWx0YSkge1xuICAgIGNoZWNrKGFjdHVhbCwgXCJhY3R1YWxcIiwgXCJudW1iZXJcIilcbiAgICBjaGVjayhleHBlY3RlZCwgXCJleHBlY3RlZFwiLCBcIm51bWJlclwiKVxuICAgIGNoZWNrKGRlbHRhLCBcImRlbHRhXCIsIFwibnVtYmVyXCIpXG5cbiAgICByZXR1cm4ge1xuICAgICAgICB0ZXN0OiBNYXRoLmFicyhhY3R1YWwgLSBleHBlY3RlZCkgPiBNYXRoLmFicyhkZWx0YSksXG4gICAgICAgIGFjdHVhbDogYWN0dWFsLFxuICAgICAgICBleHBlY3RlZDogZXhwZWN0ZWQsXG4gICAgICAgIGRlbHRhOiBkZWx0YSxcbiAgICAgICAgbWVzc2FnZTogXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgYmUgd2l0aGluIHtkZWx0YX0gb2Yge2V4cGVjdGVkfVwiLFxuICAgIH1cbn0pXG5cbi8qIGVzbGludC1kaXNhYmxlIG1heC1sZW4gKi9cblxuLyoqXG4gKiBUaGVyZSdzIDQgc2V0cyBvZiA0IHBlcm11dGF0aW9ucyBoZXJlIGZvciBgaW5jbHVkZXNgIGFuZCBgaGFzS2V5c2AsIGluc3RlYWRcbiAqIG9mIE4gc2V0cyBvZiAyICh3aGljaCB3b3VsZCBmaXQgdGhlIGBmb29gL2Bub3RGb29gIGlkaW9tIGJldHRlciksIHNvIGl0J3NcbiAqIGVhc2llciB0byBqdXN0IG1ha2UgYSBjb3VwbGUgc2VwYXJhdGUgRFNMcyBhbmQgdXNlIHRoYXQgdG8gZGVmaW5lIGV2ZXJ5dGhpbmcuXG4gKlxuICogSGVyZSdzIHRoZSB0b3AgbGV2ZWw6XG4gKlxuICogLSBzdHJpY3Qgc2hhbGxvd1xuICogLSBsb29zZSBzaGFsbG93XG4gKiAtIHN0cmljdCBkZWVwXG4gKiAtIHN0cnVjdHVyYWwgZGVlcFxuICpcbiAqIEFuZCB0aGUgc2Vjb25kIGxldmVsOlxuICpcbiAqIC0gaW5jbHVkZXMgYWxsL25vdCBtaXNzaW5nIHNvbWVcbiAqIC0gaW5jbHVkZXMgc29tZS9ub3QgbWlzc2luZyBhbGxcbiAqIC0gbm90IGluY2x1ZGluZyBhbGwvbWlzc2luZyBzb21lXG4gKiAtIG5vdCBpbmNsdWRpbmcgc29tZS9taXNzaW5nIGFsbFxuICpcbiAqIEhlcmUncyBhbiBleGFtcGxlIHVzaW5nIHRoZSBuYW1pbmcgc2NoZW1lIGZvciBgaGFzS2V5c2AsIGV0Yy5cbiAqXG4gKiAgICAgICAgICAgICAgIHwgc3RyaWN0IHNoYWxsb3cgIHwgICAgbG9vc2Ugc2hhbGxvdyAgICAgfCAgICAgc3RyaWN0IGRlZXAgICAgIHwgICAgIHN0cnVjdHVyYWwgZGVlcFxuICogLS0tLS0tLS0tLS0tLS18LS0tLS0tLS0tLS0tLS0tLS18LS0tLS0tLS0tLS0tLS0tLS0tLS0tLXwtLS0tLS0tLS0tLS0tLS0tLS0tLS18LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICogaW5jbHVkZXMgYWxsICB8IGBoYXNLZXlzYCAgICAgICB8IGBoYXNMb29zZUtleXNgICAgICAgIHwgYGhhc0RlZXBLZXlzYCAgICAgICB8IGBoYXNNYXRjaEtleXNgXG4gKiBpbmNsdWRlcyBzb21lIHwgYGhhc0FueUtleXNgICAgIHwgYGhhc0xvb3NlQW55S2V5c2AgICAgfCBgaGFzRGVlcEFueUtleXNgICAgIHwgYGhhc01hdGNoQW55S2V5c2BcbiAqIG1pc3Npbmcgc29tZSAgfCBgbm90SGFzQWxsS2V5c2AgfCBgbm90SGFzTG9vc2VBbGxLZXlzYCB8IGBub3RIYXNEZWVwQWxsS2V5c2AgfCBgbm90SGFzTWF0Y2hBbGxLZXlzYFxuICogbWlzc2luZyBhbGwgICB8IGBub3RIYXNLZXlzYCAgICB8IGBub3RIYXNMb29zZUtleXNgICAgIHwgYG5vdEhhc0RlZXBLZXlzYCAgICB8IGBub3RIYXNNYXRjaEtleXNgXG4gKlxuICogTm90ZSB0aGF0IHRoZSBgaGFzS2V5c2Agc2hhbGxvdyBjb21wYXJpc29uIHZhcmlhbnRzIGFyZSBhbHNvIG92ZXJsb2FkZWQgdG9cbiAqIGNvbnN1bWUgZWl0aGVyIGFuIGFycmF5IChpbiB3aGljaCBpdCBzaW1wbHkgY2hlY2tzIGFnYWluc3QgYSBsaXN0IG9mIGtleXMpIG9yXG4gKiBhbiBvYmplY3QgKHdoZXJlIGl0IGRvZXMgYSBmdWxsIGRlZXAgY29tcGFyaXNvbikuXG4gKi9cblxuLyogZXNsaW50LWVuYWJsZSBtYXgtbGVuICovXG5cbmZ1bmN0aW9uIG1ha2VJbmNsdWRlcyhhbGwsIGZ1bmMpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGFycmF5LCBrZXlzKSB7XG4gICAgICAgIGZ1bmN0aW9uIHRlc3Qoa2V5KSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKGZ1bmMoa2V5LCBhcnJheVtpXSkpIHJldHVybiB0cnVlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChhbGwpIHtcbiAgICAgICAgICAgIGlmIChhcnJheS5sZW5ndGggPCBrZXlzLmxlbmd0aCkgcmV0dXJuIGZhbHNlXG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmICghdGVzdChrZXlzW2ldKSkgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBrZXlzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRlc3Qoa2V5c1tqXSkpIHJldHVybiB0cnVlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gZGVmaW5lSW5jbHVkZXMobmFtZSwgZnVuYywgaW52ZXJ0LCBtZXNzYWdlKSB7XG4gICAgZnVuY3Rpb24gYmFzZShhcnJheSwgdmFsdWVzKSB7XG4gICAgICAgIC8vIENoZWFwIGNhc2VzIGZpcnN0XG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheShhcnJheSkpIHJldHVybiBmYWxzZVxuICAgICAgICBpZiAoYXJyYXkgPT09IHZhbHVlcykgcmV0dXJuIHRydWVcbiAgICAgICAgcmV0dXJuIGZ1bmMoYXJyYXksIHZhbHVlcylcbiAgICB9XG5cbiAgICBkZWZpbmUobmFtZSwgZnVuY3Rpb24gKGFycmF5LCB2YWx1ZXMpIHtcbiAgICAgICAgY2hlY2soYXJyYXksIFwiYXJyYXlcIiwgXCJhcnJheVwiKVxuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkodmFsdWVzKSkgdmFsdWVzID0gW3ZhbHVlc11cblxuICAgICAgICAvLyBleGNsdXNpdmUgb3IgdG8gaW52ZXJ0IHRoZSByZXN1bHQgaWYgYGludmVydGAgaXMgdHJ1ZVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdGVzdDogIXZhbHVlcy5sZW5ndGggfHwgaW52ZXJ0IF4gYmFzZShhcnJheSwgdmFsdWVzKSxcbiAgICAgICAgICAgIGFjdHVhbDogYXJyYXksXG4gICAgICAgICAgICB2YWx1ZXM6IHZhbHVlcyxcbiAgICAgICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgICAgIH1cbiAgICB9KVxufVxuXG52YXIgaW5jbHVkZXNBbGwgPSBtYWtlSW5jbHVkZXModHJ1ZSwgc3RyaWN0SXMpXG52YXIgaW5jbHVkZXNBbnkgPSBtYWtlSW5jbHVkZXMoZmFsc2UsIHN0cmljdElzKVxuXG4vKiBlc2xpbnQtZGlzYWJsZSBtYXgtbGVuICovXG5cbmRlZmluZUluY2x1ZGVzKFwiaW5jbHVkZXNcIiwgaW5jbHVkZXNBbGwsIGZhbHNlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGhhdmUgYWxsIHZhbHVlcyBpbiB7dmFsdWVzfVwiKVxuZGVmaW5lSW5jbHVkZXMoXCJub3RJbmNsdWRlc0FsbFwiLCBpbmNsdWRlc0FsbCwgdHJ1ZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgaGF2ZSBhbGwgdmFsdWVzIGluIHt2YWx1ZXN9XCIpXG5kZWZpbmVJbmNsdWRlcyhcImluY2x1ZGVzQW55XCIsIGluY2x1ZGVzQW55LCBmYWxzZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBoYXZlIGFueSB2YWx1ZSBpbiB7dmFsdWVzfVwiKVxuZGVmaW5lSW5jbHVkZXMoXCJub3RJbmNsdWRlc1wiLCBpbmNsdWRlc0FueSwgdHJ1ZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgaGF2ZSBhbnkgdmFsdWUgaW4ge3ZhbHVlc31cIilcblxudmFyIGluY2x1ZGVzTG9vc2VBbGwgPSBtYWtlSW5jbHVkZXModHJ1ZSwgbG9vc2VJcylcbnZhciBpbmNsdWRlc0xvb3NlQW55ID0gbWFrZUluY2x1ZGVzKGZhbHNlLCBsb29zZUlzKVxuXG5kZWZpbmVJbmNsdWRlcyhcImluY2x1ZGVzTG9vc2VcIiwgaW5jbHVkZXNMb29zZUFsbCwgZmFsc2UsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbG9vc2VseSBoYXZlIGFsbCB2YWx1ZXMgaW4ge3ZhbHVlc31cIilcbmRlZmluZUluY2x1ZGVzKFwibm90SW5jbHVkZXNMb29zZUFsbFwiLCBpbmNsdWRlc0xvb3NlQWxsLCB0cnVlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBsb29zZWx5IGhhdmUgYWxsIHZhbHVlcyBpbiB7dmFsdWVzfVwiKVxuZGVmaW5lSW5jbHVkZXMoXCJpbmNsdWRlc0xvb3NlQW55XCIsIGluY2x1ZGVzTG9vc2VBbnksIGZhbHNlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGxvb3NlbHkgaGF2ZSBhbnkgdmFsdWUgaW4ge3ZhbHVlc31cIilcbmRlZmluZUluY2x1ZGVzKFwibm90SW5jbHVkZXNMb29zZVwiLCBpbmNsdWRlc0xvb3NlQW55LCB0cnVlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBsb29zZWx5IGhhdmUgYW55IHZhbHVlIGluIHt2YWx1ZXN9XCIpXG5cbnZhciBpbmNsdWRlc0RlZXBBbGwgPSBtYWtlSW5jbHVkZXModHJ1ZSwgbWF0Y2guc3RyaWN0KVxudmFyIGluY2x1ZGVzRGVlcEFueSA9IG1ha2VJbmNsdWRlcyhmYWxzZSwgbWF0Y2guc3RyaWN0KVxuXG5kZWZpbmVJbmNsdWRlcyhcImluY2x1ZGVzRGVlcFwiLCBpbmNsdWRlc0RlZXBBbGwsIGZhbHNlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG1hdGNoIGFsbCB2YWx1ZXMgaW4ge3ZhbHVlc31cIilcbmRlZmluZUluY2x1ZGVzKFwibm90SW5jbHVkZXNEZWVwQWxsXCIsIGluY2x1ZGVzRGVlcEFsbCwgdHJ1ZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgbWF0Y2ggYWxsIHZhbHVlcyBpbiB7dmFsdWVzfVwiKVxuZGVmaW5lSW5jbHVkZXMoXCJpbmNsdWRlc0RlZXBBbnlcIiwgaW5jbHVkZXNEZWVwQW55LCBmYWxzZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBtYXRjaCBhbnkgdmFsdWUgaW4ge3ZhbHVlc31cIilcbmRlZmluZUluY2x1ZGVzKFwibm90SW5jbHVkZXNEZWVwXCIsIGluY2x1ZGVzRGVlcEFueSwgdHJ1ZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgbWF0Y2ggYW55IHZhbHVlIGluIHt2YWx1ZXN9XCIpXG5cbnZhciBpbmNsdWRlc01hdGNoQWxsID0gbWFrZUluY2x1ZGVzKHRydWUsIG1hdGNoLm1hdGNoKVxudmFyIGluY2x1ZGVzTWF0Y2hBbnkgPSBtYWtlSW5jbHVkZXMoZmFsc2UsIG1hdGNoLm1hdGNoKVxuXG5kZWZpbmVJbmNsdWRlcyhcImluY2x1ZGVzTWF0Y2hcIiwgaW5jbHVkZXNNYXRjaEFsbCwgZmFsc2UsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbWF0Y2ggYWxsIHZhbHVlcyBpbiB7dmFsdWVzfVwiKVxuZGVmaW5lSW5jbHVkZXMoXCJub3RJbmNsdWRlc01hdGNoQWxsXCIsIGluY2x1ZGVzTWF0Y2hBbGwsIHRydWUsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IG1hdGNoIGFsbCB2YWx1ZXMgaW4ge3ZhbHVlc31cIilcbmRlZmluZUluY2x1ZGVzKFwiaW5jbHVkZXNNYXRjaEFueVwiLCBpbmNsdWRlc01hdGNoQW55LCBmYWxzZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBtYXRjaCBhbnkgdmFsdWUgaW4ge3ZhbHVlc31cIilcbmRlZmluZUluY2x1ZGVzKFwibm90SW5jbHVkZXNNYXRjaFwiLCBpbmNsdWRlc01hdGNoQW55LCB0cnVlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBtYXRjaCBhbnkgdmFsdWUgaW4ge3ZhbHVlc31cIilcblxuLyogZXNsaW50LWVuYWJsZSBtYXgtbGVuICovXG5cbmZ1bmN0aW9uIGlzRW1wdHkob2JqZWN0KSB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkob2JqZWN0KSkgcmV0dXJuIG9iamVjdC5sZW5ndGggPT09IDBcbiAgICBpZiAodHlwZW9mIG9iamVjdCAhPT0gXCJvYmplY3RcIiB8fCBvYmplY3QgPT09IG51bGwpIHJldHVybiB0cnVlXG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKG9iamVjdCkubGVuZ3RoID09PSAwXG59XG5cbmZ1bmN0aW9uIG1ha2VIYXNPdmVybG9hZChuYW1lLCBtZXRob2RzLCBpbnZlcnQsIG1lc3NhZ2UpIHtcbiAgICBmdW5jdGlvbiBiYXNlKG9iamVjdCwga2V5cykge1xuICAgICAgICAvLyBDaGVhcCBjYXNlIGZpcnN0XG4gICAgICAgIGlmIChvYmplY3QgPT09IGtleXMpIHJldHVybiB0cnVlXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGtleXMpKSByZXR1cm4gbWV0aG9kcy5hcnJheShvYmplY3QsIGtleXMpXG4gICAgICAgIHJldHVybiBtZXRob2RzLm9iamVjdChvYmplY3QsIGtleXMpXG4gICAgfVxuXG4gICAgZGVmaW5lKG5hbWUsIGZ1bmN0aW9uIChvYmplY3QsIGtleXMpIHtcbiAgICAgICAgY2hlY2sob2JqZWN0LCBcIm9iamVjdFwiLCBcIm9iamVjdFwiKVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLy8gZXhjbHVzaXZlIG9yIHRvIGludmVydCB0aGUgcmVzdWx0IGlmIGBpbnZlcnRgIGlzIHRydWVcbiAgICAgICAgICAgIHRlc3Q6IGlzRW1wdHkoa2V5cykgfHwgaW52ZXJ0IF4gYmFzZShvYmplY3QsIGtleXMpLFxuICAgICAgICAgICAgYWN0dWFsOiBvYmplY3QsXG4gICAgICAgICAgICBrZXlzOiBrZXlzLFxuICAgICAgICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgICAgfVxuICAgIH0pXG59XG5cbmZ1bmN0aW9uIG1ha2VIYXNLZXlzKG5hbWUsIGZ1bmMsIGludmVydCwgbWVzc2FnZSkge1xuICAgIGZ1bmN0aW9uIGJhc2Uob2JqZWN0LCBrZXlzKSB7XG4gICAgICAgIHJldHVybiBvYmplY3QgPT09IGtleXMgfHwgZnVuYyhvYmplY3QsIGtleXMpXG4gICAgfVxuXG4gICAgZGVmaW5lKG5hbWUsIGZ1bmN0aW9uIChvYmplY3QsIGtleXMpIHtcbiAgICAgICAgY2hlY2sob2JqZWN0LCBcIm9iamVjdFwiLCBcIm9iamVjdFwiKVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLy8gZXhjbHVzaXZlIG9yIHRvIGludmVydCB0aGUgcmVzdWx0IGlmIGBpbnZlcnRgIGlzIHRydWVcbiAgICAgICAgICAgIHRlc3Q6IGlzRW1wdHkoa2V5cykgfHwgaW52ZXJ0IF4gYmFzZShvYmplY3QsIGtleXMpLFxuICAgICAgICAgICAgYWN0dWFsOiBvYmplY3QsXG4gICAgICAgICAgICBrZXlzOiBrZXlzLFxuICAgICAgICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgICAgfVxuICAgIH0pXG59XG5cbmZ1bmN0aW9uIGhhc0tleXNUeXBlKGFsbCwgZnVuYykge1xuICAgIHJldHVybiBmdW5jdGlvbiAob2JqZWN0LCBrZXlzKSB7XG4gICAgICAgIGlmICh0eXBlb2Yga2V5cyAhPT0gXCJvYmplY3RcIikgcmV0dXJuIHRydWVcbiAgICAgICAgaWYgKGtleXMgPT09IG51bGwpIHJldHVybiB0cnVlXG5cbiAgICAgICAgZnVuY3Rpb24gY2hlY2soa2V5KSB7XG4gICAgICAgICAgICByZXR1cm4gaGFzT3duLmNhbGwob2JqZWN0LCBrZXkpICYmIGZ1bmMoa2V5c1trZXldLCBvYmplY3Rba2V5XSlcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChhbGwpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGtleTEgaW4ga2V5cykge1xuICAgICAgICAgICAgICAgIGlmIChoYXNPd24uY2FsbChrZXlzLCBrZXkxKSAmJiAhY2hlY2soa2V5MSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZvciAodmFyIGtleTIgaW4ga2V5cykge1xuICAgICAgICAgICAgICAgIGlmIChoYXNPd24uY2FsbChrZXlzLCBrZXkyKSAmJiBjaGVjayhrZXkyKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBoYXNPdmVybG9hZFR5cGUoYWxsLCBmdW5jKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgb2JqZWN0OiBoYXNLZXlzVHlwZShhbGwsIGZ1bmMpLFxuICAgICAgICBhcnJheTogZnVuY3Rpb24gKG9iamVjdCwga2V5cykge1xuICAgICAgICAgICAgaWYgKGFsbCkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWhhc093bi5jYWxsKG9iamVjdCwga2V5c1tpXSkpIHJldHVybiBmYWxzZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGtleXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGhhc093bi5jYWxsKG9iamVjdCwga2V5c1tqXSkpIHJldHVybiB0cnVlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgIH1cbn1cblxuLyogZXNsaW50LWRpc2FibGUgbWF4LWxlbiAqL1xuXG52YXIgaGFzQWxsS2V5cyA9IGhhc092ZXJsb2FkVHlwZSh0cnVlLCBzdHJpY3RJcylcbnZhciBoYXNBbnlLZXlzID0gaGFzT3ZlcmxvYWRUeXBlKGZhbHNlLCBzdHJpY3RJcylcblxubWFrZUhhc092ZXJsb2FkKFwiaGFzS2V5c1wiLCBoYXNBbGxLZXlzLCBmYWxzZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBoYXZlIGFsbCBrZXlzIGluIHtrZXlzfVwiKVxubWFrZUhhc092ZXJsb2FkKFwibm90SGFzQWxsS2V5c1wiLCBoYXNBbGxLZXlzLCB0cnVlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBoYXZlIGFsbCBrZXlzIGluIHtrZXlzfVwiKVxubWFrZUhhc092ZXJsb2FkKFwiaGFzQW55S2V5c1wiLCBoYXNBbnlLZXlzLCBmYWxzZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBoYXZlIGFueSBrZXkgaW4ge2tleXN9XCIpXG5tYWtlSGFzT3ZlcmxvYWQoXCJub3RIYXNLZXlzXCIsIGhhc0FueUtleXMsIHRydWUsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGhhdmUgYW55IGtleSBpbiB7a2V5c31cIilcblxudmFyIGhhc0xvb3NlQWxsS2V5cyA9IGhhc092ZXJsb2FkVHlwZSh0cnVlLCBsb29zZUlzKVxudmFyIGhhc0xvb3NlQW55S2V5cyA9IGhhc092ZXJsb2FkVHlwZShmYWxzZSwgbG9vc2VJcylcblxubWFrZUhhc092ZXJsb2FkKFwiaGFzTG9vc2VLZXlzXCIsIGhhc0xvb3NlQWxsS2V5cywgZmFsc2UsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbG9vc2VseSBoYXZlIGFsbCBrZXlzIGluIHtrZXlzfVwiKVxubWFrZUhhc092ZXJsb2FkKFwibm90SGFzTG9vc2VBbGxLZXlzXCIsIGhhc0xvb3NlQWxsS2V5cywgdHJ1ZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgbG9vc2VseSBoYXZlIGFsbCBrZXlzIGluIHtrZXlzfVwiKVxubWFrZUhhc092ZXJsb2FkKFwiaGFzTG9vc2VBbnlLZXlzXCIsIGhhc0xvb3NlQW55S2V5cywgZmFsc2UsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbG9vc2VseSBoYXZlIGFueSBrZXkgaW4ge2tleXN9XCIpXG5tYWtlSGFzT3ZlcmxvYWQoXCJub3RIYXNMb29zZUtleXNcIiwgaGFzTG9vc2VBbnlLZXlzLCB0cnVlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBsb29zZWx5IGhhdmUgYW55IGtleSBpbiB7a2V5c31cIilcblxudmFyIGhhc0RlZXBBbGxLZXlzID0gaGFzS2V5c1R5cGUodHJ1ZSwgbWF0Y2guc3RyaWN0KVxudmFyIGhhc0RlZXBBbnlLZXlzID0gaGFzS2V5c1R5cGUoZmFsc2UsIG1hdGNoLnN0cmljdClcblxubWFrZUhhc0tleXMoXCJoYXNEZWVwS2V5c1wiLCBoYXNEZWVwQWxsS2V5cywgZmFsc2UsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gaGF2ZSBhbGwga2V5cyBpbiB7a2V5c31cIilcbm1ha2VIYXNLZXlzKFwibm90SGFzRGVlcEFsbEtleXNcIiwgaGFzRGVlcEFsbEtleXMsIHRydWUsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGhhdmUgYWxsIGtleXMgaW4ge2tleXN9XCIpXG5tYWtlSGFzS2V5cyhcImhhc0RlZXBBbnlLZXlzXCIsIGhhc0RlZXBBbnlLZXlzLCBmYWxzZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBoYXZlIGFueSBrZXkgaW4ge2tleXN9XCIpXG5tYWtlSGFzS2V5cyhcIm5vdEhhc0RlZXBLZXlzXCIsIGhhc0RlZXBBbnlLZXlzLCB0cnVlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBoYXZlIGFueSBrZXkgaW4ge2tleXN9XCIpXG5cbnZhciBoYXNNYXRjaEFsbEtleXMgPSBoYXNLZXlzVHlwZSh0cnVlLCBtYXRjaC5tYXRjaClcbnZhciBoYXNNYXRjaEFueUtleXMgPSBoYXNLZXlzVHlwZShmYWxzZSwgbWF0Y2gubWF0Y2gpXG5cbm1ha2VIYXNLZXlzKFwiaGFzTWF0Y2hLZXlzXCIsIGhhc01hdGNoQWxsS2V5cywgZmFsc2UsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbWF0Y2ggYWxsIGtleXMgaW4ge2tleXN9XCIpXG5tYWtlSGFzS2V5cyhcIm5vdEhhc01hdGNoQWxsS2V5c1wiLCBoYXNNYXRjaEFsbEtleXMsIHRydWUsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IG1hdGNoIGFsbCBrZXlzIGluIHtrZXlzfVwiKVxubWFrZUhhc0tleXMoXCJoYXNNYXRjaEFueUtleXNcIiwgaGFzTWF0Y2hBbnlLZXlzLCBmYWxzZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBtYXRjaCBhbnkga2V5IGluIHtrZXlzfVwiKVxubWFrZUhhc0tleXMoXCJub3RIYXNNYXRjaEtleXNcIiwgaGFzTWF0Y2hBbnlLZXlzLCB0cnVlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBtYXRjaCBhbnkga2V5IGluIHtrZXlzfVwiKVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxuLyoqXG4gKiBNYWluIGVudHJ5IHBvaW50LCBmb3IgdGhvc2Ugd2FudGluZyB0byB1c2UgdGhpcyBmcmFtZXdvcmsgd2l0aCB0aGUgY29yZVxuICogYXNzZXJ0aW9ucy5cbiAqL1xudmFyIFRoYWxsaXVtID0gcmVxdWlyZShcIi4vbGliL2FwaS90aGFsbGl1bVwiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBUaGFsbGl1bSgpXG4iLCJcInVzZSBzdHJpY3RcIlxuXG52YXIgVGhhbGxpdW0gPSByZXF1aXJlKFwiLi9saWIvYXBpL3RoYWxsaXVtXCIpXG52YXIgUmVwb3J0cyA9IHJlcXVpcmUoXCIuL2xpYi9jb3JlL3JlcG9ydHNcIilcbnZhciBUeXBlcyA9IFJlcG9ydHMuVHlwZXNcblxuZXhwb3J0cy5yb290ID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBuZXcgVGhhbGxpdW0oKVxufVxuXG5mdW5jdGlvbiBkKGR1cmF0aW9uKSB7XG4gICAgaWYgKGR1cmF0aW9uID09IG51bGwpIHJldHVybiAxMFxuICAgIGlmICh0eXBlb2YgZHVyYXRpb24gPT09IFwibnVtYmVyXCIpIHJldHVybiBkdXJhdGlvbnwwXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGBkdXJhdGlvbmAgdG8gYmUgYSBudW1iZXIgaWYgaXQgZXhpc3RzXCIpXG59XG5cbmZ1bmN0aW9uIHMoc2xvdykge1xuICAgIGlmIChzbG93ID09IG51bGwpIHJldHVybiA3NVxuICAgIGlmICh0eXBlb2Ygc2xvdyA9PT0gXCJudW1iZXJcIikgcmV0dXJuIHNsb3d8MFxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBgc2xvd2AgdG8gYmUgYSBudW1iZXIgaWYgaXQgZXhpc3RzXCIpXG59XG5cbmZ1bmN0aW9uIHAocGF0aCkge1xuICAgIGlmIChBcnJheS5pc0FycmF5KHBhdGgpKSByZXR1cm4gcGF0aFxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBgcGF0aGAgdG8gYmUgYW4gYXJyYXkgb2YgbG9jYXRpb25zXCIpXG59XG5cbmZ1bmN0aW9uIGgodmFsdWUpIHtcbiAgICBpZiAodmFsdWUgIT0gbnVsbCAmJiB0eXBlb2YgdmFsdWUuXyA9PT0gXCJudW1iZXJcIikgcmV0dXJuIHZhbHVlXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGB2YWx1ZWAgdG8gYmUgYSBob29rIGVycm9yXCIpXG59XG5cbi8qKlxuICogQ3JlYXRlIGEgbmV3IHJlcG9ydCwgbWFpbmx5IGZvciB0ZXN0aW5nIHJlcG9ydGVycy5cbiAqL1xuZXhwb3J0cy5yZXBvcnRzID0ge1xuICAgIHN0YXJ0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVwb3J0cy5TdGFydCgpXG4gICAgfSxcblxuICAgIGVudGVyOiBmdW5jdGlvbiAocGF0aCwgZHVyYXRpb24sIHNsb3cpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSZXBvcnRzLkVudGVyKHAocGF0aCksIGQoZHVyYXRpb24pLCBzKHNsb3cpKVxuICAgIH0sXG5cbiAgICBsZWF2ZTogZnVuY3Rpb24gKHBhdGgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSZXBvcnRzLkxlYXZlKHAocGF0aCkpXG4gICAgfSxcblxuICAgIHBhc3M6IGZ1bmN0aW9uIChwYXRoLCBkdXJhdGlvbiwgc2xvdykge1xuICAgICAgICByZXR1cm4gbmV3IFJlcG9ydHMuUGFzcyhwKHBhdGgpLCBkKGR1cmF0aW9uKSwgcyhzbG93KSlcbiAgICB9LFxuXG4gICAgZmFpbDogZnVuY3Rpb24gKHBhdGgsIHZhbHVlLCBkdXJhdGlvbiwgc2xvdykge1xuICAgICAgICByZXR1cm4gbmV3IFJlcG9ydHMuRmFpbChwKHBhdGgpLCB2YWx1ZSwgZChkdXJhdGlvbiksIHMoc2xvdykpXG4gICAgfSxcblxuICAgIHNraXA6IGZ1bmN0aW9uIChwYXRoKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVwb3J0cy5Ta2lwKHAocGF0aCkpXG4gICAgfSxcblxuICAgIGVuZDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IFJlcG9ydHMuRW5kKClcbiAgICB9LFxuXG4gICAgZXJyb3I6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICByZXR1cm4gbmV3IFJlcG9ydHMuRXJyb3IodmFsdWUpXG4gICAgfSxcblxuICAgIGhvb2s6IGZ1bmN0aW9uIChwYXRoLCByb290UGF0aCwgdmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSZXBvcnRzLkhvb2socChwYXRoKSwgcChyb290UGF0aCksIGgodmFsdWUpKVxuICAgIH0sXG59XG5cbi8qKlxuICogQ3JlYXRlIGEgbmV3IGhvb2sgZXJyb3IsIG1haW5seSBmb3IgdGVzdGluZyByZXBvcnRlcnMuXG4gKi9cbmV4cG9ydHMuaG9va0Vycm9ycyA9IHtcbiAgICBiZWZvcmVBbGw6IGZ1bmN0aW9uIChmdW5jLCB2YWx1ZSkge1xuICAgICAgICByZXR1cm4gbmV3IFJlcG9ydHMuSG9va0Vycm9yKFR5cGVzLkJlZm9yZUFsbCwgZnVuYywgdmFsdWUpXG4gICAgfSxcblxuICAgIGJlZm9yZUVhY2g6IGZ1bmN0aW9uIChmdW5jLCB2YWx1ZSkge1xuICAgICAgICByZXR1cm4gbmV3IFJlcG9ydHMuSG9va0Vycm9yKFR5cGVzLkJlZm9yZUVhY2gsIGZ1bmMsIHZhbHVlKVxuICAgIH0sXG5cbiAgICBhZnRlckVhY2g6IGZ1bmN0aW9uIChmdW5jLCB2YWx1ZSkge1xuICAgICAgICByZXR1cm4gbmV3IFJlcG9ydHMuSG9va0Vycm9yKFR5cGVzLkFmdGVyRWFjaCwgZnVuYywgdmFsdWUpXG4gICAgfSxcblxuICAgIGFmdGVyQWxsOiBmdW5jdGlvbiAoZnVuYywgdmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSZXBvcnRzLkhvb2tFcnJvcihUeXBlcy5BZnRlckFsbCwgZnVuYywgdmFsdWUpXG4gICAgfSxcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IGxvY2F0aW9uLCBtYWlubHkgZm9yIHRlc3RpbmcgcmVwb3J0ZXJzLlxuICovXG5leHBvcnRzLmxvY2F0aW9uID0gZnVuY3Rpb24gKG5hbWUsIGluZGV4KSB7XG4gICAgaWYgKHR5cGVvZiBuYW1lICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBgbmFtZWAgdG8gYmUgYSBzdHJpbmdcIilcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGluZGV4ICE9PSBcIm51bWJlclwiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBgaW5kZXhgIHRvIGJlIGEgbnVtYmVyXCIpXG4gICAgfVxuXG4gICAgcmV0dXJuIHtuYW1lOiBuYW1lLCBpbmRleDogaW5kZXh8MH1cbn1cbiIsIlwidXNlIHN0cmljdFwiXG5cbmV4cG9ydHMuYWRkSG9vayA9IGZ1bmN0aW9uIChsaXN0LCBjYWxsYmFjaykge1xuICAgIGlmIChsaXN0ICE9IG51bGwpIHtcbiAgICAgICAgbGlzdC5wdXNoKGNhbGxiYWNrKVxuICAgICAgICByZXR1cm4gbGlzdFxuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBbY2FsbGJhY2tdXG4gICAgfVxufVxuXG5leHBvcnRzLnJlbW92ZUhvb2sgPSBmdW5jdGlvbiAobGlzdCwgY2FsbGJhY2spIHtcbiAgICBpZiAobGlzdCA9PSBudWxsKSByZXR1cm4gdW5kZWZpbmVkXG4gICAgaWYgKGxpc3QubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIGlmIChsaXN0WzBdID09PSBjYWxsYmFjaykgcmV0dXJuIHVuZGVmaW5lZFxuICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBpbmRleCA9IGxpc3QuaW5kZXhPZihjYWxsYmFjaylcblxuICAgICAgICBpZiAoaW5kZXggPj0gMCkgbGlzdC5zcGxpY2UoaW5kZXgsIDEpXG4gICAgfVxuICAgIHJldHVybiBsaXN0XG59XG5cbmV4cG9ydHMuaGFzSG9vayA9IGZ1bmN0aW9uIChsaXN0LCBjYWxsYmFjaykge1xuICAgIGlmIChsaXN0ID09IG51bGwpIHJldHVybiBmYWxzZVxuICAgIGlmIChsaXN0Lmxlbmd0aCA+IDEpIHJldHVybiBsaXN0LmluZGV4T2YoY2FsbGJhY2spID49IDBcbiAgICByZXR1cm4gbGlzdFswXSA9PT0gY2FsbGJhY2tcbn1cbiIsIlwidXNlIHN0cmljdFwiXG5cbnZhciBtZXRob2RzID0gcmVxdWlyZShcIi4uL21ldGhvZHNcIilcbnZhciBUZXN0cyA9IHJlcXVpcmUoXCIuLi9jb3JlL3Rlc3RzXCIpXG52YXIgSG9va3MgPSByZXF1aXJlKFwiLi9ob29rc1wiKVxuXG4vKipcbiAqIFRoaXMgY29udGFpbnMgdGhlIGxvdyBsZXZlbCwgbW9yZSBhcmNhbmUgdGhpbmdzIHRoYXQgYXJlIGdlbmVyYWxseSBub3RcbiAqIGludGVyZXN0aW5nIHRvIGFueW9uZSBvdGhlciB0aGFuIHBsdWdpbiBkZXZlbG9wZXJzLlxuICovXG5tb2R1bGUuZXhwb3J0cyA9IFJlZmxlY3RcbmZ1bmN0aW9uIFJlZmxlY3QodGVzdCkge1xuICAgIHZhciByZWZsZWN0ID0gdGVzdC5yZWZsZWN0XG5cbiAgICBpZiAocmVmbGVjdCAhPSBudWxsKSByZXR1cm4gcmVmbGVjdFxuICAgIGlmICh0ZXN0LnJvb3QgIT09IHRlc3QpIHJldHVybiB0ZXN0LnJlZmxlY3QgPSBuZXcgUmVmbGVjdENoaWxkKHRlc3QpXG4gICAgcmV0dXJuIHRlc3QucmVmbGVjdCA9IG5ldyBSZWZsZWN0Um9vdCh0ZXN0KVxufVxuXG5tZXRob2RzKFJlZmxlY3QsIHtcbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIGN1cnJlbnRseSBleGVjdXRpbmcgdGVzdC5cbiAgICAgKi9cbiAgICBnZXQgY3VycmVudCgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSZWZsZWN0KHRoaXMuXy5yb290LmN1cnJlbnQpXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgcm9vdCB0ZXN0LlxuICAgICAqL1xuICAgIGdldCByb290KCkge1xuICAgICAgICByZXR1cm4gbmV3IFJlZmxlY3QodGhpcy5fLnJvb3QpXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgY3VycmVudCB0b3RhbCB0ZXN0IGNvdW50LlxuICAgICAqL1xuICAgIGdldCBjb3VudCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuXy50ZXN0cyA9PSBudWxsID8gMCA6IHRoaXMuXy50ZXN0cy5sZW5ndGhcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGEgY29weSBvZiB0aGUgY3VycmVudCB0ZXN0IGxpc3QsIGFzIGEgUmVmbGVjdCBjb2xsZWN0aW9uLiBUaGlzIGlzXG4gICAgICogaW50ZW50aW9uYWxseSBhIHNsaWNlLCBzbyB5b3UgY2FuJ3QgbXV0YXRlIHRoZSByZWFsIGNoaWxkcmVuLlxuICAgICAqL1xuICAgIGdldCBjaGlsZHJlbigpIHtcbiAgICAgICAgaWYgKHRoaXMuXy50ZXN0cyA9PSBudWxsKSByZXR1cm4gW11cbiAgICAgICAgcmV0dXJuIHRoaXMuXy50ZXN0cy5tYXAoZnVuY3Rpb24gKHRlc3QpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgUmVmbGVjdENoaWxkKHRlc3QpXG4gICAgICAgIH0pXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIElzIHRoaXMgdGVzdCB0aGUgcm9vdCwgaS5lLiB0b3AgbGV2ZWw/XG4gICAgICovXG4gICAgZ2V0IGlzUm9vdCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuXy5yb290ID09PSB0aGlzLl9cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogSXMgdGhpcyBsb2NrZWQgKGkuZS4gdW5zYWZlIHRvIG1vZGlmeSk/XG4gICAgICovXG4gICAgZ2V0IGlzTG9ja2VkKCkge1xuICAgICAgICByZXR1cm4gISF0aGlzLl8ubG9ja2VkXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgb3duLCBub3QgbmVjZXNzYXJpbHkgYWN0aXZlLCB0aW1lb3V0LiAwIG1lYW5zIGluaGVyaXQgdGhlXG4gICAgICogcGFyZW50J3MsIGFuZCBgSW5maW5pdHlgIG1lYW5zIGl0J3MgZGlzYWJsZWQuXG4gICAgICovXG4gICAgZ2V0IG93blRpbWVvdXQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl8udGltZW91dCB8fCAwXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgYWN0aXZlIHRpbWVvdXQgaW4gbWlsbGlzZWNvbmRzLCBub3QgbmVjZXNzYXJpbHkgb3duLCBvciB0aGVcbiAgICAgKiBmcmFtZXdvcmsgZGVmYXVsdCBvZiAyMDAwLCBpZiBub25lIHdhcyBzZXQuXG4gICAgICovXG4gICAgZ2V0IHRpbWVvdXQoKSB7XG4gICAgICAgIHJldHVybiBUZXN0cy50aW1lb3V0KHRoaXMuXylcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBvd24sIG5vdCBuZWNlc3NhcmlseSBhY3RpdmUsIHNsb3cgdGhyZXNob2xkLiAwIG1lYW5zIGluaGVyaXQgdGhlXG4gICAgICogcGFyZW50J3MsIGFuZCBgSW5maW5pdHlgIG1lYW5zIGl0J3MgZGlzYWJsZWQuXG4gICAgICovXG4gICAgZ2V0IG93blNsb3coKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl8uc2xvdyB8fCAwXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgYWN0aXZlIHNsb3cgdGhyZXNob2xkIGluIG1pbGxpc2Vjb25kcywgbm90IG5lY2Vzc2FyaWx5IG93biwgb3JcbiAgICAgKiB0aGUgZnJhbWV3b3JrIGRlZmF1bHQgb2YgNzUsIGlmIG5vbmUgd2FzIHNldC5cbiAgICAgKi9cbiAgICBnZXQgc2xvdygpIHtcbiAgICAgICAgcmV0dXJuIFRlc3RzLnNsb3codGhpcy5fKVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGQgYSBob29rIHRvIGJlIHJ1biBiZWZvcmUgZWFjaCBzdWJ0ZXN0LCBpbmNsdWRpbmcgdGhlaXIgc3VidGVzdHMgYW5kIHNvXG4gICAgICogb24uXG4gICAgICovXG4gICAgYmVmb3JlOiBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgY2FsbGJhY2sgdG8gYmUgYSBmdW5jdGlvbiBpZiBwYXNzZWRcIilcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuXy5iZWZvcmVFYWNoID0gSG9va3MuYWRkSG9vayh0aGlzLl8uYmVmb3JlRWFjaCwgY2FsbGJhY2spXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBhIGhvb2sgdG8gYmUgcnVuIG9uY2UgYmVmb3JlIGFsbCBzdWJ0ZXN0cyBhcmUgcnVuLlxuICAgICAqL1xuICAgIGJlZm9yZUFsbDogZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIGJlIGEgZnVuY3Rpb24gaWYgcGFzc2VkXCIpXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl8uYmVmb3JlQWxsID0gSG9va3MuYWRkSG9vayh0aGlzLl8uYmVmb3JlQWxsLCBjYWxsYmFjaylcbiAgICB9LFxuXG4gICAvKipcbiAgICAqIEFkZCBhIGhvb2sgdG8gYmUgcnVuIGFmdGVyIGVhY2ggc3VidGVzdCwgaW5jbHVkaW5nIHRoZWlyIHN1YnRlc3RzIGFuZCBzb1xuICAgICogb24uXG4gICAgKi9cbiAgICBhZnRlcjogZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIGJlIGEgZnVuY3Rpb24gaWYgcGFzc2VkXCIpXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl8uYWZ0ZXJFYWNoID0gSG9va3MuYWRkSG9vayh0aGlzLl8uYWZ0ZXJFYWNoLCBjYWxsYmFjaylcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGEgaG9vayB0byBiZSBydW4gb25jZSBhZnRlciBhbGwgc3VidGVzdHMgYXJlIHJ1bi5cbiAgICAgKi9cbiAgICBhZnRlckFsbDogZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIGJlIGEgZnVuY3Rpb24gaWYgcGFzc2VkXCIpXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl8uYWZ0ZXJBbGwgPSBIb29rcy5hZGRIb29rKHRoaXMuXy5hZnRlckFsbCwgY2FsbGJhY2spXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBhIGhvb2sgcHJldmlvdXNseSBhZGRlZCB3aXRoIGB0LmJlZm9yZWAgb3IgYHJlZmxlY3QuYmVmb3JlYC5cbiAgICAgKi9cbiAgICBoYXNCZWZvcmU6IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBjYWxsYmFjayB0byBiZSBhIGZ1bmN0aW9uIGlmIHBhc3NlZFwiKVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIEhvb2tzLmhhc0hvb2sodGhpcy5fLmJlZm9yZUVhY2gsIGNhbGxiYWNrKVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgYSBob29rIHByZXZpb3VzbHkgYWRkZWQgd2l0aCBgdC5iZWZvcmVBbGxgIG9yIGByZWZsZWN0LmJlZm9yZUFsbGAuXG4gICAgICovXG4gICAgaGFzQmVmb3JlQWxsOiBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgY2FsbGJhY2sgdG8gYmUgYSBmdW5jdGlvbiBpZiBwYXNzZWRcIilcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBIb29rcy5oYXNIb29rKHRoaXMuXy5iZWZvcmVBbGwsIGNhbGxiYWNrKVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgYSBob29rIHByZXZpb3VzbHkgYWRkZWQgd2l0aCBgdC5hZnRlcmAgb3JgcmVmbGVjdC5hZnRlcmAuXG4gICAgICovXG4gICAgaGFzQWZ0ZXI6IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBjYWxsYmFjayB0byBiZSBhIGZ1bmN0aW9uIGlmIHBhc3NlZFwiKVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIEhvb2tzLmhhc0hvb2sodGhpcy5fLmFmdGVyRWFjaCwgY2FsbGJhY2spXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBhIGhvb2sgcHJldmlvdXNseSBhZGRlZCB3aXRoIGB0LmFmdGVyQWxsYCBvciBgcmVmbGVjdC5hZnRlckFsbGAuXG4gICAgICovXG4gICAgaGFzQWZ0ZXJBbGw6IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBjYWxsYmFjayB0byBiZSBhIGZ1bmN0aW9uIGlmIHBhc3NlZFwiKVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIEhvb2tzLmhhc0hvb2sodGhpcy5fLmFmdGVyQWxsLCBjYWxsYmFjaylcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGEgaG9vayBwcmV2aW91c2x5IGFkZGVkIHdpdGggYHQuYmVmb3JlYCBvciBgcmVmbGVjdC5iZWZvcmVgLlxuICAgICAqL1xuICAgIHJlbW92ZUJlZm9yZTogZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIGJlIGEgZnVuY3Rpb24gaWYgcGFzc2VkXCIpXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgYmVmb3JlRWFjaCA9IEhvb2tzLnJlbW92ZUhvb2sodGhpcy5fLmJlZm9yZUVhY2gsIGNhbGxiYWNrKVxuXG4gICAgICAgIGlmIChiZWZvcmVFYWNoID09IG51bGwpIGRlbGV0ZSB0aGlzLl8uYmVmb3JlRWFjaFxuICAgICAgICBlbHNlIHRoaXMuXy5iZWZvcmVFYWNoID0gYmVmb3JlRWFjaFxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgYSBob29rIHByZXZpb3VzbHkgYWRkZWQgd2l0aCBgdC5iZWZvcmVBbGxgIG9yIGByZWZsZWN0LmJlZm9yZUFsbGAuXG4gICAgICovXG4gICAgcmVtb3ZlQmVmb3JlQWxsOiBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgY2FsbGJhY2sgdG8gYmUgYSBmdW5jdGlvbiBpZiBwYXNzZWRcIilcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBiZWZvcmVBbGwgPSBIb29rcy5yZW1vdmVIb29rKHRoaXMuXy5iZWZvcmVBbGwsIGNhbGxiYWNrKVxuXG4gICAgICAgIGlmIChiZWZvcmVBbGwgPT0gbnVsbCkgZGVsZXRlIHRoaXMuXy5iZWZvcmVBbGxcbiAgICAgICAgZWxzZSB0aGlzLl8uYmVmb3JlQWxsID0gYmVmb3JlQWxsXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBhIGhvb2sgcHJldmlvdXNseSBhZGRlZCB3aXRoIGB0LmFmdGVyYCBvcmByZWZsZWN0LmFmdGVyYC5cbiAgICAgKi9cbiAgICByZW1vdmVBZnRlcjogZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIGJlIGEgZnVuY3Rpb24gaWYgcGFzc2VkXCIpXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgYWZ0ZXJFYWNoID0gSG9va3MucmVtb3ZlSG9vayh0aGlzLl8uYWZ0ZXJFYWNoLCBjYWxsYmFjaylcblxuICAgICAgICBpZiAoYWZ0ZXJFYWNoID09IG51bGwpIGRlbGV0ZSB0aGlzLl8uYWZ0ZXJFYWNoXG4gICAgICAgIGVsc2UgdGhpcy5fLmFmdGVyRWFjaCA9IGFmdGVyRWFjaFxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgYSBob29rIHByZXZpb3VzbHkgYWRkZWQgd2l0aCBgdC5hZnRlckFsbGAgb3IgYHJlZmxlY3QuYWZ0ZXJBbGxgLlxuICAgICAqL1xuICAgIHJlbW92ZUFmdGVyQWxsOiBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgY2FsbGJhY2sgdG8gYmUgYSBmdW5jdGlvbiBpZiBwYXNzZWRcIilcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBhZnRlckFsbCA9IEhvb2tzLnJlbW92ZUhvb2sodGhpcy5fLmFmdGVyQWxsLCBjYWxsYmFjaylcblxuICAgICAgICBpZiAoYWZ0ZXJBbGwgPT0gbnVsbCkgZGVsZXRlIHRoaXMuXy5hZnRlckFsbFxuICAgICAgICBlbHNlIHRoaXMuXy5hZnRlckFsbCA9IGFmdGVyQWxsXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBhIGJsb2NrIG9yIGlubGluZSB0ZXN0LlxuICAgICAqL1xuICAgIHRlc3Q6IGZ1bmN0aW9uIChuYW1lLCBjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIG5hbWUgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBgbmFtZWAgdG8gYmUgYSBzdHJpbmdcIilcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIGJlIGEgZnVuY3Rpb24gaWYgcGFzc2VkXCIpXG4gICAgICAgIH1cblxuICAgICAgICBUZXN0cy5hZGROb3JtYWwodGhpcy5fLnJvb3QuY3VycmVudCwgbmFtZSwgY2FsbGJhY2spXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBhIHNraXBwZWQgYmxvY2sgb3IgaW5saW5lIHRlc3QuXG4gICAgICovXG4gICAgdGVzdFNraXA6IGZ1bmN0aW9uIChuYW1lLCBjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIG5hbWUgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBgbmFtZWAgdG8gYmUgYSBzdHJpbmdcIilcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIGJlIGEgZnVuY3Rpb24gaWYgcGFzc2VkXCIpXG4gICAgICAgIH1cblxuICAgICAgICBUZXN0cy5hZGRTa2lwcGVkKHRoaXMuXy5yb290LmN1cnJlbnQsIG5hbWUpXG4gICAgfSxcbn0pXG5cbmZ1bmN0aW9uIFJlZmxlY3RSb290KHJvb3QpIHtcbiAgICB0aGlzLl8gPSByb290XG59XG5cbm1ldGhvZHMoUmVmbGVjdFJvb3QsIFJlZmxlY3QsIHtcbiAgICAvKipcbiAgICAgKiBXaGV0aGVyIGEgcmVwb3J0ZXIgd2FzIHJlZ2lzdGVyZWQuXG4gICAgICovXG4gICAgaGFzUmVwb3J0ZXI6IGZ1bmN0aW9uIChyZXBvcnRlcikge1xuICAgICAgICBpZiAodHlwZW9mIHJlcG9ydGVyICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBgcmVwb3J0ZXJgIHRvIGJlIGEgZnVuY3Rpb25cIilcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLl8ucm9vdC5yZXBvcnRlcklkcy5pbmRleE9mKHJlcG9ydGVyKSA+PSAwXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBhIHJlcG9ydGVyLlxuICAgICAqL1xuICAgIHJlcG9ydGVyOiBmdW5jdGlvbiAocmVwb3J0ZXIsIGFyZykge1xuICAgICAgICBpZiAodHlwZW9mIHJlcG9ydGVyICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBgcmVwb3J0ZXJgIHRvIGJlIGEgZnVuY3Rpb25cIilcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciByb290ID0gdGhpcy5fLnJvb3RcblxuICAgICAgICBpZiAocm9vdC5jdXJyZW50ICE9PSByb290KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJSZXBvcnRlcnMgbWF5IG9ubHkgYmUgYWRkZWQgdG8gdGhlIHJvb3RcIilcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChyb290LnJlcG9ydGVySWRzLmluZGV4T2YocmVwb3J0ZXIpIDwgMCkge1xuICAgICAgICAgICAgcm9vdC5yZXBvcnRlcklkcy5wdXNoKHJlcG9ydGVyKVxuICAgICAgICAgICAgcm9vdC5yZXBvcnRlcnMucHVzaChyZXBvcnRlcihhcmcpKVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBhIHJlcG9ydGVyLlxuICAgICAqL1xuICAgIHJlbW92ZVJlcG9ydGVyOiBmdW5jdGlvbiAocmVwb3J0ZXIpIHtcbiAgICAgICAgaWYgKHR5cGVvZiByZXBvcnRlciAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgYHJlcG9ydGVyYCB0byBiZSBhIGZ1bmN0aW9uXCIpXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcm9vdCA9IHRoaXMuXy5yb290XG5cbiAgICAgICAgaWYgKHJvb3QuY3VycmVudCAhPT0gcm9vdCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUmVwb3J0ZXJzIG1heSBvbmx5IGJlIGFkZGVkIHRvIHRoZSByb290XCIpXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgaW5kZXggPSByb290LnJlcG9ydGVySWRzLmluZGV4T2YocmVwb3J0ZXIpXG5cbiAgICAgICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgICAgICAgIHJvb3QucmVwb3J0ZXJJZHMuc3BsaWNlKGluZGV4LCAxKVxuICAgICAgICAgICAgcm9vdC5yZXBvcnRlcnMuc3BsaWNlKGluZGV4LCAxKVxuICAgICAgICB9XG4gICAgfSxcbn0pXG5cbmZ1bmN0aW9uIFJlZmxlY3RDaGlsZChyb290KSB7XG4gICAgdGhpcy5fID0gcm9vdFxufVxuXG5tZXRob2RzKFJlZmxlY3RDaGlsZCwgUmVmbGVjdCwge1xuICAgIC8qKlxuICAgICAqIEdldCB0aGUgdGVzdCBuYW1lLCBvciBgdW5kZWZpbmVkYCBpZiBpdCdzIHRoZSByb290IHRlc3QuXG4gICAgICovXG4gICAgZ2V0IG5hbWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl8ubmFtZVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIHRlc3QgaW5kZXgsIG9yIGAtMWAgaWYgaXQncyB0aGUgcm9vdCB0ZXN0LlxuICAgICAqL1xuICAgIGdldCBpbmRleCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuXy5pbmRleFxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIHBhcmVudCB0ZXN0IGFzIGEgUmVmbGVjdC5cbiAgICAgKi9cbiAgICBnZXQgcGFyZW50KCkge1xuICAgICAgICByZXR1cm4gbmV3IFJlZmxlY3QodGhpcy5fLnBhcmVudClcbiAgICB9LFxufSlcbiIsIlwidXNlIHN0cmljdFwiXG5cbnZhciBtZXRob2RzID0gcmVxdWlyZShcIi4uL21ldGhvZHNcIilcbnZhciBUZXN0cyA9IHJlcXVpcmUoXCIuLi9jb3JlL3Rlc3RzXCIpXG52YXIgb25seUFkZCA9IHJlcXVpcmUoXCIuLi9jb3JlL29ubHlcIikub25seUFkZFxudmFyIGFkZEhvb2sgPSByZXF1aXJlKFwiLi9ob29rc1wiKS5hZGRIb29rXG52YXIgUmVmbGVjdCA9IHJlcXVpcmUoXCIuL3JlZmxlY3RcIilcblxubW9kdWxlLmV4cG9ydHMgPSBUaGFsbGl1bVxuZnVuY3Rpb24gVGhhbGxpdW0oKSB7XG4gICAgdGhpcy5fID0gVGVzdHMuY3JlYXRlUm9vdCh0aGlzKVxuICAgIC8vIEVTNiBtb2R1bGUgdHJhbnNwaWxlciBjb21wYXRpYmlsaXR5LlxuICAgIHRoaXMuZGVmYXVsdCA9IHRoaXNcbn1cblxubWV0aG9kcyhUaGFsbGl1bSwge1xuICAgIC8qKlxuICAgICAqIENhbGwgYSBwbHVnaW4gYW5kIHJldHVybiB0aGUgcmVzdWx0LiBUaGUgcGx1Z2luIGlzIGNhbGxlZCB3aXRoIGEgUmVmbGVjdFxuICAgICAqIGluc3RhbmNlIGZvciBhY2Nlc3MgdG8gcGxlbnR5IG9mIHBvdGVudGlhbGx5IHVzZWZ1bCBpbnRlcm5hbCBkZXRhaWxzLlxuICAgICAqL1xuICAgIGNhbGw6IGZ1bmN0aW9uIChwbHVnaW4sIGFyZykge1xuICAgICAgICB2YXIgcmVmbGVjdCA9IG5ldyBSZWZsZWN0KHRoaXMuXy5yb290LmN1cnJlbnQpXG5cbiAgICAgICAgcmV0dXJuIHBsdWdpbi5jYWxsKHJlZmxlY3QsIHJlZmxlY3QsIGFyZylcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogV2hpdGVsaXN0IHNwZWNpZmljIHRlc3RzLCB1c2luZyBhcnJheS1iYXNlZCBzZWxlY3RvcnMgd2hlcmUgZWFjaCBlbnRyeVxuICAgICAqIGlzIGVpdGhlciBhIHN0cmluZyBvciByZWd1bGFyIGV4cHJlc3Npb24uXG4gICAgICovXG4gICAgb25seTogZnVuY3Rpb24gKC8qIC4uLnNlbGVjdG9ycyAqLykge1xuICAgICAgICBvbmx5QWRkLmFwcGx5KHRoaXMuXy5yb290LmN1cnJlbnQsIGFyZ3VtZW50cylcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGEgcmVwb3J0ZXIuXG4gICAgICovXG4gICAgcmVwb3J0ZXI6IGZ1bmN0aW9uIChyZXBvcnRlciwgYXJnKSB7XG4gICAgICAgIGlmICh0eXBlb2YgcmVwb3J0ZXIgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGByZXBvcnRlcmAgdG8gYmUgYSBmdW5jdGlvbi5cIilcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciByb290ID0gdGhpcy5fLnJvb3RcblxuICAgICAgICBpZiAocm9vdC5jdXJyZW50ICE9PSByb290KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJSZXBvcnRlcnMgbWF5IG9ubHkgYmUgYWRkZWQgdG8gdGhlIHJvb3QuXCIpXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcmVzdWx0ID0gcmVwb3J0ZXIoYXJnKVxuXG4gICAgICAgIC8vIERvbid0IGFzc3VtZSBpdCdzIGEgZnVuY3Rpb24uIFZlcmlmeSBpdCBhY3R1YWxseSBpcywgc28gd2UgZG9uJ3QgaGF2ZVxuICAgICAgICAvLyBpbmV4cGxpY2FibGUgdHlwZSBlcnJvcnMgaW50ZXJuYWxseSBhZnRlciBpdCdzIGludm9rZWQsIGFuZCBzbyB1c2Vyc1xuICAgICAgICAvLyB3b24ndCBnZXQgdG9vIGNvbmZ1c2VkLlxuICAgICAgICBpZiAodHlwZW9mIHJlc3VsdCAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICAgICAgICAgIFwiRXhwZWN0ZWQgYHJlcG9ydGVyYCB0byByZXR1cm4gYSBmdW5jdGlvbi4gQ2hlY2sgd2l0aCB0aGUgXCIgK1xuICAgICAgICAgICAgICAgIFwicmVwb3J0ZXIncyBhdXRob3IsIGFuZCBoYXZlIHRoZW0gZml4IHRoZWlyIHJlcG9ydGVyLlwiKVxuICAgICAgICB9XG5cbiAgICAgICAgcm9vdC5yZXBvcnRlciA9IHJlc3VsdFxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIGN1cnJlbnQgdGltZW91dC4gMCBtZWFucyBpbmhlcml0IHRoZSBwYXJlbnQncywgYW5kIGBJbmZpbml0eWBcbiAgICAgKiBtZWFucyBpdCdzIGRpc2FibGVkLlxuICAgICAqL1xuICAgIGdldCB0aW1lb3V0KCkge1xuICAgICAgICByZXR1cm4gVGVzdHMudGltZW91dCh0aGlzLl8ucm9vdC5jdXJyZW50KVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgdGhlIHRpbWVvdXQgaW4gbWlsbGlzZWNvbmRzLCByb3VuZGluZyBuZWdhdGl2ZXMgdG8gMC4gU2V0dGluZyB0aGVcbiAgICAgKiB0aW1lb3V0IHRvIDAgbWVhbnMgdG8gaW5oZXJpdCB0aGUgcGFyZW50IHRpbWVvdXQsIGFuZCBzZXR0aW5nIGl0IHRvXG4gICAgICogYEluZmluaXR5YCBkaXNhYmxlcyBpdC5cbiAgICAgKi9cbiAgICBzZXQgdGltZW91dCh0aW1lb3V0KSB7XG4gICAgICAgIHZhciBjYWxjdWxhdGVkID0gTWF0aC5mbG9vcihNYXRoLm1heCgrdGltZW91dCwgMCkpXG5cbiAgICAgICAgaWYgKGNhbGN1bGF0ZWQgPT09IDApIGRlbGV0ZSB0aGlzLl8ucm9vdC5jdXJyZW50LnRpbWVvdXRcbiAgICAgICAgZWxzZSB0aGlzLl8ucm9vdC5jdXJyZW50LnRpbWVvdXQgPSBjYWxjdWxhdGVkXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgY3VycmVudCBzbG93IHRocmVzaG9sZC4gMCBtZWFucyBpbmhlcml0IHRoZSBwYXJlbnQncywgYW5kXG4gICAgICogYEluZmluaXR5YCBtZWFucyBpdCdzIGRpc2FibGVkLlxuICAgICAqL1xuICAgIGdldCBzbG93KCkge1xuICAgICAgICByZXR1cm4gVGVzdHMuc2xvdyh0aGlzLl8ucm9vdC5jdXJyZW50KVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgdGhlIHNsb3cgdGhyZXNob2xkIGluIG1pbGxpc2Vjb25kcywgcm91bmRpbmcgbmVnYXRpdmVzIHRvIDAuIFNldHRpbmdcbiAgICAgKiB0aGUgdGltZW91dCB0byAwIG1lYW5zIHRvIGluaGVyaXQgdGhlIHBhcmVudCB0aHJlc2hvbGQsIGFuZCBzZXR0aW5nIGl0IHRvXG4gICAgICogYEluZmluaXR5YCBkaXNhYmxlcyBpdC5cbiAgICAgKi9cbiAgICBzZXQgc2xvdyhzbG93KSB7XG4gICAgICAgIHZhciBjYWxjdWxhdGVkID0gTWF0aC5mbG9vcihNYXRoLm1heCgrc2xvdywgMCkpXG5cbiAgICAgICAgaWYgKGNhbGN1bGF0ZWQgPT09IDApIGRlbGV0ZSB0aGlzLl8ucm9vdC5jdXJyZW50LnNsb3dcbiAgICAgICAgZWxzZSB0aGlzLl8ucm9vdC5jdXJyZW50LnNsb3cgPSBjYWxjdWxhdGVkXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJ1biB0aGUgdGVzdHMgKG9yIHRoZSB0ZXN0J3MgdGVzdHMgaWYgaXQncyBub3QgYSBiYXNlIGluc3RhbmNlKS5cbiAgICAgKi9cbiAgICBydW46IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMuXy5yb290ICE9PSB0aGlzLl8pIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgICBcIk9ubHkgdGhlIHJvb3QgdGVzdCBjYW4gYmUgcnVuIC0gSWYgeW91IG9ubHkgd2FudCB0byBydW4gYSBcIiArXG4gICAgICAgICAgICAgICAgXCJzdWJ0ZXN0LCB1c2UgYHQub25seShbXFxcInNlbGVjdG9yMVxcXCIsIC4uLl0pYCBpbnN0ZWFkLlwiKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuXy5yb290LmxvY2tlZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2FuJ3QgcnVuIHdoaWxlIHRlc3RzIGFyZSBhbHJlYWR5IHJ1bm5pbmcuXCIpXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gVGVzdHMucnVuVGVzdCh0aGlzLl8pXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBhIHRlc3QuXG4gICAgICovXG4gICAgdGVzdDogZnVuY3Rpb24gKG5hbWUsIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgbmFtZSAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGBuYW1lYCB0byBiZSBhIHN0cmluZ1wiKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgY2FsbGJhY2sgdG8gYmUgYSBmdW5jdGlvbiBpZiBwYXNzZWRcIilcbiAgICAgICAgfVxuXG4gICAgICAgIFRlc3RzLmFkZE5vcm1hbCh0aGlzLl8ucm9vdC5jdXJyZW50LCBuYW1lLCBjYWxsYmFjaylcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGEgc2tpcHBlZCB0ZXN0LlxuICAgICAqL1xuICAgIHRlc3RTa2lwOiBmdW5jdGlvbiAobmFtZSwgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBuYW1lICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgYG5hbWVgIHRvIGJlIGEgc3RyaW5nXCIpXG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBjYWxsYmFjayB0byBiZSBhIGZ1bmN0aW9uIGlmIHBhc3NlZFwiKVxuICAgICAgICB9XG5cbiAgICAgICAgVGVzdHMuYWRkU2tpcHBlZCh0aGlzLl8ucm9vdC5jdXJyZW50LCBuYW1lKVxuICAgIH0sXG5cbiAgICBiZWZvcmU6IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBjYWxsYmFjayB0byBiZSBhIGZ1bmN0aW9uIGlmIHBhc3NlZFwiKVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHRlc3QgPSB0aGlzLl8ucm9vdC5jdXJyZW50XG5cbiAgICAgICAgdGVzdC5iZWZvcmVFYWNoID0gYWRkSG9vayh0ZXN0LmJlZm9yZUVhY2gsIGNhbGxiYWNrKVxuICAgIH0sXG5cbiAgICBiZWZvcmVBbGw6IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBjYWxsYmFjayB0byBiZSBhIGZ1bmN0aW9uIGlmIHBhc3NlZFwiKVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHRlc3QgPSB0aGlzLl8ucm9vdC5jdXJyZW50XG5cbiAgICAgICAgdGVzdC5iZWZvcmVBbGwgPSBhZGRIb29rKHRlc3QuYmVmb3JlQWxsLCBjYWxsYmFjaylcbiAgICB9LFxuXG4gICAgYWZ0ZXI6IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBjYWxsYmFjayB0byBiZSBhIGZ1bmN0aW9uIGlmIHBhc3NlZFwiKVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHRlc3QgPSB0aGlzLl8ucm9vdC5jdXJyZW50XG5cbiAgICAgICAgdGVzdC5hZnRlckVhY2ggPSBhZGRIb29rKHRlc3QuYWZ0ZXJFYWNoLCBjYWxsYmFjaylcbiAgICB9LFxuXG4gICAgYWZ0ZXJBbGw6IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBjYWxsYmFjayB0byBiZSBhIGZ1bmN0aW9uIGlmIHBhc3NlZFwiKVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHRlc3QgPSB0aGlzLl8ucm9vdC5jdXJyZW50XG5cbiAgICAgICAgdGVzdC5hZnRlckFsbCA9IGFkZEhvb2sodGVzdC5hZnRlckFsbCwgY2FsbGJhY2spXG4gICAgfSxcbn0pXG4iLCJcInVzZSBzdHJpY3RcIlxuXG52YXIgbWF0Y2ggPSByZXF1aXJlKFwiLi4vLi4vbWF0Y2hcIilcbnZhciBVdGlsID0gcmVxdWlyZShcIi4vdXRpbFwiKVxuXG5mdW5jdGlvbiBiaW5hcnkobnVtZXJpYywgY29tcGFyYXRvciwgbWVzc2FnZSkge1xuICAgIHJldHVybiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgICBpZiAobnVtZXJpYykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBhY3R1YWwgIT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYGFjdHVhbGAgbXVzdCBiZSBhIG51bWJlclwiKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodHlwZW9mIGV4cGVjdGVkICE9PSBcIm51bWJlclwiKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBleHBlY3RlZGAgbXVzdCBiZSBhIG51bWJlclwiKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFjb21wYXJhdG9yKGFjdHVhbCwgZXhwZWN0ZWQpKSB7XG4gICAgICAgICAgICBVdGlsLmZhaWwobWVzc2FnZSwge2FjdHVhbDogYWN0dWFsLCBleHBlY3RlZDogZXhwZWN0ZWR9KVxuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnRzLmVxdWFsID0gYmluYXJ5KGZhbHNlLFxuICAgIGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBVdGlsLnN0cmljdElzKGEsIGIpIH0sXG4gICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBlcXVhbCB7ZXhwZWN0ZWR9XCIpXG5cbmV4cG9ydHMubm90RXF1YWwgPSBiaW5hcnkoZmFsc2UsXG4gICAgZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuICFVdGlsLnN0cmljdElzKGEsIGIpIH0sXG4gICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgZXF1YWwge2V4cGVjdGVkfVwiKVxuXG5leHBvcnRzLmVxdWFsTG9vc2UgPSBiaW5hcnkoZmFsc2UsXG4gICAgZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIFV0aWwubG9vc2VJcyhhLCBiKSB9LFxuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbG9vc2VseSBlcXVhbCB7ZXhwZWN0ZWR9XCIpXG5cbmV4cG9ydHMubm90RXF1YWxMb29zZSA9IGJpbmFyeShmYWxzZSxcbiAgICBmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gIVV0aWwubG9vc2VJcyhhLCBiKSB9LFxuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGxvb3NlbHkgZXF1YWwge2V4cGVjdGVkfVwiKVxuXG5leHBvcnRzLmF0TGVhc3QgPSBiaW5hcnkodHJ1ZSxcbiAgICBmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYSA+PSBiIH0sXG4gICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBiZSBhdCBsZWFzdCB7ZXhwZWN0ZWR9XCIpXG5cbmV4cG9ydHMuYXRNb3N0ID0gYmluYXJ5KHRydWUsXG4gICAgZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGEgPD0gYiB9LFxuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gYmUgYXQgbW9zdCB7ZXhwZWN0ZWR9XCIpXG5cbmV4cG9ydHMuYWJvdmUgPSBiaW5hcnkodHJ1ZSxcbiAgICBmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYSA+IGIgfSxcbiAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGJlIGFib3ZlIHtleHBlY3RlZH1cIilcblxuZXhwb3J0cy5iZWxvdyA9IGJpbmFyeSh0cnVlLFxuICAgIGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBhIDwgYiB9LFxuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gYmUgYmVsb3cge2V4cGVjdGVkfVwiKVxuXG5leHBvcnRzLmJldHdlZW4gPSBmdW5jdGlvbiAoYWN0dWFsLCBsb3dlciwgdXBwZXIpIHtcbiAgICBpZiAodHlwZW9mIGFjdHVhbCAhPT0gXCJudW1iZXJcIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYGFjdHVhbGAgbXVzdCBiZSBhIG51bWJlclwiKVxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgbG93ZXIgIT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBsb3dlcmAgbXVzdCBiZSBhIG51bWJlclwiKVxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgdXBwZXIgIT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImB1cHBlcmAgbXVzdCBiZSBhIG51bWJlclwiKVxuICAgIH1cblxuICAgIC8vIFRoZSBuZWdhdGlvbiBpcyB0byBhZGRyZXNzIE5hTnMgYXMgd2VsbCwgd2l0aG91dCB3cml0aW5nIGEgdG9uIG9mIHNwZWNpYWxcbiAgICAvLyBjYXNlIGJvaWxlcnBsYXRlXG4gICAgaWYgKCEoYWN0dWFsID49IGxvd2VyICYmIGFjdHVhbCA8PSB1cHBlcikpIHtcbiAgICAgICAgVXRpbC5mYWlsKFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gYmUgYmV0d2VlbiB7bG93ZXJ9IGFuZCB7dXBwZXJ9XCIsIHtcbiAgICAgICAgICAgIGFjdHVhbDogYWN0dWFsLFxuICAgICAgICAgICAgbG93ZXI6IGxvd2VyLFxuICAgICAgICAgICAgdXBwZXI6IHVwcGVyLFxuICAgICAgICB9KVxuICAgIH1cbn1cblxuZXhwb3J0cy5kZWVwRXF1YWwgPSBiaW5hcnkoZmFsc2UsXG4gICAgZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIG1hdGNoLnN0cmljdChhLCBiKSB9LFxuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gZGVlcGx5IGVxdWFsIHtleHBlY3RlZH1cIilcblxuZXhwb3J0cy5ub3REZWVwRXF1YWwgPSBiaW5hcnkoZmFsc2UsXG4gICAgZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuICFtYXRjaC5zdHJpY3QoYSwgYikgfSxcbiAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBkZWVwbHkgZXF1YWwge2V4cGVjdGVkfVwiKVxuXG5leHBvcnRzLm1hdGNoID0gYmluYXJ5KGZhbHNlLFxuICAgIGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBtYXRjaC5tYXRjaChhLCBiKSB9LFxuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbWF0Y2gge2V4cGVjdGVkfVwiKVxuXG5leHBvcnRzLm5vdE1hdGNoID0gYmluYXJ5KGZhbHNlLFxuICAgIGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiAhbWF0Y2gubWF0Y2goYSwgYikgfSxcbiAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBtYXRjaCB7ZXhwZWN0ZWR9XCIpXG5cbi8vIFVzZXMgZGl2aXNpb24gdG8gYWxsb3cgZm9yIGEgbW9yZSByb2J1c3QgY29tcGFyaXNvbiBvZiBmbG9hdHMuIEFsc28sIHRoaXNcbi8vIGhhbmRsZXMgbmVhci16ZXJvIGNvbXBhcmlzb25zIGNvcnJlY3RseSwgYXMgd2VsbCBhcyBhIHplcm8gdG9sZXJhbmNlIChpLmUuXG4vLyBleGFjdCBjb21wYXJpc29uKS5cbmZ1bmN0aW9uIGNsb3NlVG8oZXhwZWN0ZWQsIGFjdHVhbCwgdG9sZXJhbmNlKSB7XG4gICAgaWYgKHRvbGVyYW5jZSA9PT0gSW5maW5pdHkgfHwgYWN0dWFsID09PSBleHBlY3RlZCkgcmV0dXJuIHRydWVcbiAgICBpZiAodG9sZXJhbmNlID09PSAwKSByZXR1cm4gZmFsc2VcbiAgICBpZiAoYWN0dWFsID09PSAwKSByZXR1cm4gTWF0aC5hYnMoZXhwZWN0ZWQpIDwgdG9sZXJhbmNlXG4gICAgaWYgKGV4cGVjdGVkID09PSAwKSByZXR1cm4gTWF0aC5hYnMoYWN0dWFsKSA8IHRvbGVyYW5jZVxuICAgIHJldHVybiBNYXRoLmFicyhleHBlY3RlZCAvIGFjdHVhbCAtIDEpIDwgdG9sZXJhbmNlXG59XG5cbi8vIE5vdGU6IHRoZXNlIHR3byBhbHdheXMgZmFpbCB3aGVuIGRlYWxpbmcgd2l0aCBOYU5zLlxuZXhwb3J0cy5jbG9zZVRvID0gZnVuY3Rpb24gKGV4cGVjdGVkLCBhY3R1YWwsIHRvbGVyYW5jZSkge1xuICAgIGlmICh0eXBlb2YgYWN0dWFsICE9PSBcIm51bWJlclwiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJgYWN0dWFsYCBtdXN0IGJlIGEgbnVtYmVyXCIpXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBleHBlY3RlZCAhPT0gXCJudW1iZXJcIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYGV4cGVjdGVkYCBtdXN0IGJlIGEgbnVtYmVyXCIpXG4gICAgfVxuXG4gICAgaWYgKHRvbGVyYW5jZSA9PSBudWxsKSB0b2xlcmFuY2UgPSAxZS0xMFxuXG4gICAgaWYgKHR5cGVvZiB0b2xlcmFuY2UgIT09IFwibnVtYmVyXCIgfHwgdG9sZXJhbmNlIDwgMCkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICAgICAgXCJgdG9sZXJhbmNlYCBtdXN0IGJlIGEgbm9uLW5lZ2F0aXZlIG51bWJlciBpZiBnaXZlblwiKVxuICAgIH1cblxuICAgIGlmIChhY3R1YWwgIT09IGFjdHVhbCB8fCBleHBlY3RlZCAhPT0gZXhwZWN0ZWQgfHwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1zZWxmLWNvbXBhcmUsIG1heC1sZW5cbiAgICAgICAgICAgICFjbG9zZVRvKGV4cGVjdGVkLCBhY3R1YWwsIHRvbGVyYW5jZSkpIHtcbiAgICAgICAgVXRpbC5mYWlsKFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gYmUgY2xvc2UgdG8ge2V4cGVjdGVkfVwiLCB7XG4gICAgICAgICAgICBhY3R1YWw6IGFjdHVhbCxcbiAgICAgICAgICAgIGV4cGVjdGVkOiBleHBlY3RlZCxcbiAgICAgICAgfSlcbiAgICB9XG59XG5cbmV4cG9ydHMubm90Q2xvc2VUbyA9IGZ1bmN0aW9uIChleHBlY3RlZCwgYWN0dWFsLCB0b2xlcmFuY2UpIHtcbiAgICBpZiAodHlwZW9mIGFjdHVhbCAhPT0gXCJudW1iZXJcIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYGFjdHVhbGAgbXVzdCBiZSBhIG51bWJlclwiKVxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgZXhwZWN0ZWQgIT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBleHBlY3RlZGAgbXVzdCBiZSBhIG51bWJlclwiKVxuICAgIH1cblxuICAgIGlmICh0b2xlcmFuY2UgPT0gbnVsbCkgdG9sZXJhbmNlID0gMWUtMTBcblxuICAgIGlmICh0eXBlb2YgdG9sZXJhbmNlICE9PSBcIm51bWJlclwiIHx8IHRvbGVyYW5jZSA8IDApIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICAgICAgIFwiYHRvbGVyYW5jZWAgbXVzdCBiZSBhIG5vbi1uZWdhdGl2ZSBudW1iZXIgaWYgZ2l2ZW5cIilcbiAgICB9XG5cbiAgICBpZiAoZXhwZWN0ZWQgIT09IGV4cGVjdGVkIHx8IGFjdHVhbCAhPT0gYWN0dWFsIHx8IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tc2VsZi1jb21wYXJlLCBtYXgtbGVuXG4gICAgICAgICAgICBjbG9zZVRvKGV4cGVjdGVkLCBhY3R1YWwsIHRvbGVyYW5jZSkpIHtcbiAgICAgICAgVXRpbC5mYWlsKFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGJlIGNsb3NlIHRvIHtleHBlY3RlZH1cIiwge1xuICAgICAgICAgICAgYWN0dWFsOiBhY3R1YWwsXG4gICAgICAgICAgICBleHBlY3RlZDogZXhwZWN0ZWQsXG4gICAgICAgIH0pXG4gICAgfVxufVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxudmFyIG1hdGNoID0gcmVxdWlyZShcIi4uLy4uL21hdGNoXCIpXG52YXIgVXRpbCA9IHJlcXVpcmUoXCIuL3V0aWxcIilcbnZhciBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5XG5cbmZ1bmN0aW9uIGhhc0tleXMoYWxsLCBvYmplY3QsIGtleXMpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHRlc3QgPSBoYXNPd24uY2FsbChvYmplY3QsIGtleXNbaV0pXG5cbiAgICAgICAgaWYgKHRlc3QgIT09IGFsbCkgcmV0dXJuICFhbGxcbiAgICB9XG5cbiAgICByZXR1cm4gYWxsXG59XG5cbmZ1bmN0aW9uIGhhc1ZhbHVlcyhmdW5jLCBhbGwsIG9iamVjdCwga2V5cykge1xuICAgIGlmIChvYmplY3QgPT09IGtleXMpIHJldHVybiB0cnVlXG4gICAgdmFyIGxpc3QgPSBPYmplY3Qua2V5cyhrZXlzKVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBrZXkgPSBsaXN0W2ldXG4gICAgICAgIHZhciB0ZXN0ID0gaGFzT3duLmNhbGwob2JqZWN0LCBrZXkpICYmIGZ1bmMoa2V5c1trZXldLCBvYmplY3Rba2V5XSlcblxuICAgICAgICBpZiAodGVzdCAhPT0gYWxsKSByZXR1cm4gdGVzdFxuICAgIH1cblxuICAgIHJldHVybiBhbGxcbn1cblxuZnVuY3Rpb24gbWFrZUhhc092ZXJsb2FkKGFsbCwgaW52ZXJ0LCBtZXNzYWdlKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChvYmplY3QsIGtleXMpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBvYmplY3QgIT09IFwib2JqZWN0XCIgfHwgb2JqZWN0ID09IG51bGwpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJgb2JqZWN0YCBtdXN0IGJlIGFuIG9iamVjdFwiKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBrZXlzICE9PSBcIm9iamVjdFwiIHx8IGtleXMgPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBrZXlzYCBtdXN0IGJlIGFuIG9iamVjdCBvciBhcnJheVwiKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoa2V5cykpIHtcbiAgICAgICAgICAgIGlmIChrZXlzLmxlbmd0aCAmJiBoYXNLZXlzKGFsbCwgb2JqZWN0LCBrZXlzKSA9PT0gaW52ZXJ0KSB7XG4gICAgICAgICAgICAgICAgVXRpbC5mYWlsKG1lc3NhZ2UsIHthY3R1YWw6IG9iamVjdCwga2V5czoga2V5c30pXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoT2JqZWN0LmtleXMoa2V5cykubGVuZ3RoKSB7XG4gICAgICAgICAgICBpZiAoaGFzVmFsdWVzKFV0aWwuc3RyaWN0SXMsIGFsbCwgb2JqZWN0LCBrZXlzKSA9PT0gaW52ZXJ0KSB7XG4gICAgICAgICAgICAgICAgVXRpbC5mYWlsKG1lc3NhZ2UsIHthY3R1YWw6IG9iamVjdCwga2V5czoga2V5c30pXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIG1ha2VIYXNLZXlzKGZ1bmMsIGFsbCwgaW52ZXJ0LCBtZXNzYWdlKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChvYmplY3QsIGtleXMpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBvYmplY3QgIT09IFwib2JqZWN0XCIgfHwgb2JqZWN0ID09IG51bGwpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJgb2JqZWN0YCBtdXN0IGJlIGFuIG9iamVjdFwiKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBrZXlzICE9PSBcIm9iamVjdFwiIHx8IGtleXMgPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBrZXlzYCBtdXN0IGJlIGFuIG9iamVjdFwiKVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gZXhjbHVzaXZlIG9yIHRvIGludmVydCB0aGUgcmVzdWx0IGlmIGBpbnZlcnRgIGlzIHRydWVcbiAgICAgICAgaWYgKE9iamVjdC5rZXlzKGtleXMpLmxlbmd0aCkge1xuICAgICAgICAgICAgaWYgKGhhc1ZhbHVlcyhmdW5jLCBhbGwsIG9iamVjdCwga2V5cykgPT09IGludmVydCkge1xuICAgICAgICAgICAgICAgIFV0aWwuZmFpbChtZXNzYWdlLCB7YWN0dWFsOiBvYmplY3QsIGtleXM6IGtleXN9KVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG4vKiBlc2xpbnQtZGlzYWJsZSBtYXgtbGVuICovXG5cbmV4cG9ydHMuaGFzS2V5cyA9IG1ha2VIYXNPdmVybG9hZCh0cnVlLCBmYWxzZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBoYXZlIGFsbCBrZXlzIGluIHtrZXlzfVwiKVxuZXhwb3J0cy5oYXNLZXlzRGVlcCA9IG1ha2VIYXNLZXlzKG1hdGNoLnN0cmljdCwgdHJ1ZSwgZmFsc2UsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gaGF2ZSBhbGwga2V5cyBpbiB7a2V5c31cIilcbmV4cG9ydHMuaGFzS2V5c01hdGNoID0gbWFrZUhhc0tleXMobWF0Y2gubWF0Y2gsIHRydWUsIGZhbHNlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG1hdGNoIGFsbCBrZXlzIGluIHtrZXlzfVwiKVxuZXhwb3J0cy5oYXNLZXlzQW55ID0gbWFrZUhhc092ZXJsb2FkKGZhbHNlLCBmYWxzZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBoYXZlIGFueSBrZXkgaW4ge2tleXN9XCIpXG5leHBvcnRzLmhhc0tleXNBbnlEZWVwID0gbWFrZUhhc0tleXMobWF0Y2guc3RyaWN0LCBmYWxzZSwgZmFsc2UsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gaGF2ZSBhbnkga2V5IGluIHtrZXlzfVwiKVxuZXhwb3J0cy5oYXNLZXlzQW55TWF0Y2ggPSBtYWtlSGFzS2V5cyhtYXRjaC5tYXRjaCwgZmFsc2UsIGZhbHNlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG1hdGNoIGFueSBrZXkgaW4ge2tleXN9XCIpXG5leHBvcnRzLm5vdEhhc0tleXNBbGwgPSBtYWtlSGFzT3ZlcmxvYWQodHJ1ZSwgdHJ1ZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgaGF2ZSBhbGwga2V5cyBpbiB7a2V5c31cIilcbmV4cG9ydHMubm90SGFzS2V5c0FsbERlZXAgPSBtYWtlSGFzS2V5cyhtYXRjaC5zdHJpY3QsIHRydWUsIHRydWUsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGhhdmUgYWxsIGtleXMgaW4ge2tleXN9XCIpXG5leHBvcnRzLm5vdEhhc0tleXNBbGxNYXRjaCA9IG1ha2VIYXNLZXlzKG1hdGNoLm1hdGNoLCB0cnVlLCB0cnVlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBtYXRjaCBhbGwga2V5cyBpbiB7a2V5c31cIilcbmV4cG9ydHMubm90SGFzS2V5cyA9IG1ha2VIYXNPdmVybG9hZChmYWxzZSwgdHJ1ZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgaGF2ZSBhbnkga2V5IGluIHtrZXlzfVwiKVxuZXhwb3J0cy5ub3RIYXNLZXlzRGVlcCA9IG1ha2VIYXNLZXlzKG1hdGNoLnN0cmljdCwgZmFsc2UsIHRydWUsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGhhdmUgYW55IGtleSBpbiB7a2V5c31cIilcbmV4cG9ydHMubm90SGFzS2V5c01hdGNoID0gbWFrZUhhc0tleXMobWF0Y2gubWF0Y2gsIGZhbHNlLCB0cnVlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBtYXRjaCBhbnkga2V5IGluIHtrZXlzfVwiKVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxudmFyIFV0aWwgPSByZXF1aXJlKFwiLi91dGlsXCIpXG52YXIgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eVxuXG5mdW5jdGlvbiBoYXMoXykgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1sZW4sIG1heC1wYXJhbXNcbiAgICByZXR1cm4gZnVuY3Rpb24gKG9iamVjdCwga2V5LCB2YWx1ZSkge1xuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSAzKSB7XG4gICAgICAgICAgICBpZiAoIV8uaGFzKG9iamVjdCwga2V5KSB8fFxuICAgICAgICAgICAgICAgICAgICAhVXRpbC5zdHJpY3RJcyhfLmdldChvYmplY3QsIGtleSksIHZhbHVlKSkge1xuICAgICAgICAgICAgICAgIFV0aWwuZmFpbChfLm1lc3NhZ2VzWzBdLCB7XG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiB2YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgYWN0dWFsOiBvYmplY3Rba2V5XSxcbiAgICAgICAgICAgICAgICAgICAga2V5OiBrZXksXG4gICAgICAgICAgICAgICAgICAgIG9iamVjdDogb2JqZWN0LFxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoIV8uaGFzKG9iamVjdCwga2V5KSkge1xuICAgICAgICAgICAgVXRpbC5mYWlsKF8ubWVzc2FnZXNbMV0sIHtcbiAgICAgICAgICAgICAgICBleHBlY3RlZDogdmFsdWUsXG4gICAgICAgICAgICAgICAgYWN0dWFsOiBvYmplY3Rba2V5XSxcbiAgICAgICAgICAgICAgICBrZXk6IGtleSxcbiAgICAgICAgICAgICAgICBvYmplY3Q6IG9iamVjdCxcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGhhc0xvb3NlKF8pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKG9iamVjdCwga2V5LCB2YWx1ZSkge1xuICAgICAgICBpZiAoIV8uaGFzKG9iamVjdCwga2V5KSB8fCAhVXRpbC5sb29zZUlzKF8uZ2V0KG9iamVjdCwga2V5KSwgdmFsdWUpKSB7XG4gICAgICAgICAgICBVdGlsLmZhaWwoXy5tZXNzYWdlc1swXSwge1xuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiB2YWx1ZSxcbiAgICAgICAgICAgICAgICBhY3R1YWw6IG9iamVjdFtrZXldLFxuICAgICAgICAgICAgICAgIGtleToga2V5LFxuICAgICAgICAgICAgICAgIG9iamVjdDogb2JqZWN0LFxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gbm90SGFzKF8pIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtbGVuLCBtYXgtcGFyYW1zXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChvYmplY3QsIGtleSwgdmFsdWUpIHtcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gMykge1xuICAgICAgICAgICAgaWYgKF8uaGFzKG9iamVjdCwga2V5KSAmJlxuICAgICAgICAgICAgICAgICAgICBVdGlsLnN0cmljdElzKF8uZ2V0KG9iamVjdCwga2V5KSwgdmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgVXRpbC5mYWlsKF8ubWVzc2FnZXNbMl0sIHtcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IHZhbHVlLFxuICAgICAgICAgICAgICAgICAgICBhY3R1YWw6IG9iamVjdFtrZXldLFxuICAgICAgICAgICAgICAgICAgICBrZXk6IGtleSxcbiAgICAgICAgICAgICAgICAgICAgb2JqZWN0OiBvYmplY3QsXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChfLmhhcyhvYmplY3QsIGtleSkpIHtcbiAgICAgICAgICAgIFV0aWwuZmFpbChfLm1lc3NhZ2VzWzNdLCB7XG4gICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IHZhbHVlLFxuICAgICAgICAgICAgICAgIGFjdHVhbDogb2JqZWN0W2tleV0sXG4gICAgICAgICAgICAgICAga2V5OiBrZXksXG4gICAgICAgICAgICAgICAgb2JqZWN0OiBvYmplY3QsXG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBub3RIYXNMb29zZShfKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LWxlbiwgbWF4LXBhcmFtc1xuICAgIHJldHVybiBmdW5jdGlvbiAob2JqZWN0LCBrZXksIHZhbHVlKSB7XG4gICAgICAgIGlmIChfLmhhcyhvYmplY3QsIGtleSkgJiYgVXRpbC5sb29zZUlzKF8uZ2V0KG9iamVjdCwga2V5KSwgdmFsdWUpKSB7XG4gICAgICAgICAgICBVdGlsLmZhaWwoXy5tZXNzYWdlc1syXSwge1xuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiB2YWx1ZSxcbiAgICAgICAgICAgICAgICBhY3R1YWw6IG9iamVjdFtrZXldLFxuICAgICAgICAgICAgICAgIGtleToga2V5LFxuICAgICAgICAgICAgICAgIG9iamVjdDogb2JqZWN0LFxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gaGFzT3duS2V5KG9iamVjdCwga2V5KSB7IHJldHVybiBoYXNPd24uY2FsbChvYmplY3QsIGtleSkgfVxuZnVuY3Rpb24gaGFzSW5LZXkob2JqZWN0LCBrZXkpIHsgcmV0dXJuIGtleSBpbiBvYmplY3QgfVxuZnVuY3Rpb24gaGFzSW5Db2xsKG9iamVjdCwga2V5KSB7IHJldHVybiBvYmplY3QuaGFzKGtleSkgfVxuZnVuY3Rpb24gaGFzT2JqZWN0R2V0KG9iamVjdCwga2V5KSB7IHJldHVybiBvYmplY3Rba2V5XSB9XG5mdW5jdGlvbiBoYXNDb2xsR2V0KG9iamVjdCwga2V5KSB7IHJldHVybiBvYmplY3QuZ2V0KGtleSkgfVxuXG5mdW5jdGlvbiBjcmVhdGVIYXMoaGFzLCBnZXQsIG1lc3NhZ2VzKSB7XG4gICAgcmV0dXJuIHtoYXM6IGhhcywgZ2V0OiBnZXQsIG1lc3NhZ2VzOiBtZXNzYWdlc31cbn1cblxudmFyIGhhc093bk1ldGhvZHMgPSBjcmVhdGVIYXMoaGFzT3duS2V5LCBoYXNPYmplY3RHZXQsIFtcbiAgICBcIkV4cGVjdGVkIHtvYmplY3R9IHRvIGhhdmUgb3duIGtleSB7a2V5fSBlcXVhbCB0byB7ZXhwZWN0ZWR9LCBidXQgZm91bmQge2FjdHVhbH1cIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtbGVuXG4gICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBoYXZlIG93biBrZXkge2V4cGVjdGVkfVwiLFxuICAgIFwiRXhwZWN0ZWQge29iamVjdH0gdG8gbm90IGhhdmUgb3duIGtleSB7a2V5fSBlcXVhbCB0byB7YWN0dWFsfVwiLFxuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGhhdmUgb3duIGtleSB7ZXhwZWN0ZWR9XCIsXG5dKVxuXG52YXIgaGFzS2V5TWV0aG9kcyA9IGNyZWF0ZUhhcyhoYXNJbktleSwgaGFzT2JqZWN0R2V0LCBbXG4gICAgXCJFeHBlY3RlZCB7b2JqZWN0fSB0byBoYXZlIGtleSB7a2V5fSBlcXVhbCB0byB7ZXhwZWN0ZWR9LCBidXQgZm91bmQge2FjdHVhbH1cIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtbGVuXG4gICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBoYXZlIGtleSB7ZXhwZWN0ZWR9XCIsXG4gICAgXCJFeHBlY3RlZCB7b2JqZWN0fSB0byBub3QgaGF2ZSBrZXkge2tleX0gZXF1YWwgdG8ge2FjdHVhbH1cIixcbiAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBoYXZlIGtleSB7ZXhwZWN0ZWR9XCIsXG5dKVxuXG52YXIgaGFzTWV0aG9kcyA9IGNyZWF0ZUhhcyhoYXNJbkNvbGwsIGhhc0NvbGxHZXQsIFtcbiAgICBcIkV4cGVjdGVkIHtvYmplY3R9IHRvIGhhdmUga2V5IHtrZXl9IGVxdWFsIHRvIHtleHBlY3RlZH0sIGJ1dCBmb3VuZCB7YWN0dWFsfVwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1sZW5cbiAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGhhdmUga2V5IHtleHBlY3RlZH1cIixcbiAgICBcIkV4cGVjdGVkIHtvYmplY3R9IHRvIG5vdCBoYXZlIGtleSB7a2V5fSBlcXVhbCB0byB7YWN0dWFsfVwiLFxuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGhhdmUga2V5IHtleHBlY3RlZH1cIixcbl0pXG5cbmV4cG9ydHMuaGFzT3duID0gaGFzKGhhc093bk1ldGhvZHMpXG5leHBvcnRzLm5vdEhhc093biA9IG5vdEhhcyhoYXNPd25NZXRob2RzKVxuZXhwb3J0cy5oYXNPd25Mb29zZSA9IGhhc0xvb3NlKGhhc093bk1ldGhvZHMpXG5leHBvcnRzLm5vdEhhc093bkxvb3NlID0gbm90SGFzTG9vc2UoaGFzT3duTWV0aG9kcylcblxuZXhwb3J0cy5oYXNLZXkgPSBoYXMoaGFzS2V5TWV0aG9kcylcbmV4cG9ydHMubm90SGFzS2V5ID0gbm90SGFzKGhhc0tleU1ldGhvZHMpXG5leHBvcnRzLmhhc0tleUxvb3NlID0gaGFzTG9vc2UoaGFzS2V5TWV0aG9kcylcbmV4cG9ydHMubm90SGFzS2V5TG9vc2UgPSBub3RIYXNMb29zZShoYXNLZXlNZXRob2RzKVxuXG5leHBvcnRzLmhhcyA9IGhhcyhoYXNNZXRob2RzKVxuZXhwb3J0cy5ub3RIYXMgPSBub3RIYXMoaGFzTWV0aG9kcylcbmV4cG9ydHMuaGFzTG9vc2UgPSBoYXNMb29zZShoYXNNZXRob2RzKVxuZXhwb3J0cy5ub3RIYXNMb29zZSA9IG5vdEhhc0xvb3NlKGhhc01ldGhvZHMpXG4iLCJcInVzZSBzdHJpY3RcIlxuXG52YXIgVXRpbCA9IHJlcXVpcmUoXCIuL3V0aWxcIilcbnZhciBtYXRjaCA9IHJlcXVpcmUoXCIuLi8uLi9tYXRjaFwiKVxuXG5mdW5jdGlvbiBpbmNsdWRlcyhmdW5jLCBhbGwsIGFycmF5LCB2YWx1ZXMpIHtcbiAgICAvLyBDaGVhcCBjYXNlcyBmaXJzdFxuICAgIGlmICghQXJyYXkuaXNBcnJheShhcnJheSkpIHJldHVybiBmYWxzZVxuICAgIGlmIChhcnJheSA9PT0gdmFsdWVzKSByZXR1cm4gdHJ1ZVxuICAgIGlmIChhbGwgJiYgYXJyYXkubGVuZ3RoIDwgdmFsdWVzLmxlbmd0aCkgcmV0dXJuIGZhbHNlXG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHZhbHVlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgdmFsdWUgPSB2YWx1ZXNbaV1cbiAgICAgICAgdmFyIHRlc3QgPSBmYWxzZVxuXG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgYXJyYXkubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIGlmIChmdW5jKHZhbHVlLCBhcnJheVtqXSkpIHtcbiAgICAgICAgICAgICAgICB0ZXN0ID0gdHJ1ZVxuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGVzdCAhPT0gYWxsKSByZXR1cm4gdGVzdFxuICAgIH1cblxuICAgIHJldHVybiBhbGxcbn1cblxuZnVuY3Rpb24gZGVmaW5lSW5jbHVkZXMoZnVuYywgYWxsLCBpbnZlcnQsIG1lc3NhZ2UpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGFycmF5LCB2YWx1ZXMpIHtcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGFycmF5KSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBhcnJheWAgbXVzdCBiZSBhbiBhcnJheVwiKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHZhbHVlcykpIHZhbHVlcyA9IFt2YWx1ZXNdXG5cbiAgICAgICAgaWYgKHZhbHVlcy5sZW5ndGggJiYgaW5jbHVkZXMoZnVuYywgYWxsLCBhcnJheSwgdmFsdWVzKSA9PT0gaW52ZXJ0KSB7XG4gICAgICAgICAgICBVdGlsLmZhaWwobWVzc2FnZSwge2FjdHVhbDogYXJyYXksIHZhbHVlczogdmFsdWVzfSlcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLyogZXNsaW50LWRpc2FibGUgbWF4LWxlbiAqL1xuXG5leHBvcnRzLmluY2x1ZGVzID0gZGVmaW5lSW5jbHVkZXMoVXRpbC5zdHJpY3RJcywgdHJ1ZSwgZmFsc2UsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gaGF2ZSBhbGwgdmFsdWVzIGluIHt2YWx1ZXN9XCIpXG5leHBvcnRzLmluY2x1ZGVzRGVlcCA9IGRlZmluZUluY2x1ZGVzKG1hdGNoLnN0cmljdCwgdHJ1ZSwgZmFsc2UsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbWF0Y2ggYWxsIHZhbHVlcyBpbiB7dmFsdWVzfVwiKVxuZXhwb3J0cy5pbmNsdWRlc01hdGNoID0gZGVmaW5lSW5jbHVkZXMobWF0Y2gubWF0Y2gsIHRydWUsIGZhbHNlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG1hdGNoIGFsbCB2YWx1ZXMgaW4ge3ZhbHVlc31cIilcbmV4cG9ydHMuaW5jbHVkZXNBbnkgPSBkZWZpbmVJbmNsdWRlcyhVdGlsLnN0cmljdElzLCBmYWxzZSwgZmFsc2UsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gaGF2ZSBhbnkgdmFsdWUgaW4ge3ZhbHVlc31cIilcbmV4cG9ydHMuaW5jbHVkZXNBbnlEZWVwID0gZGVmaW5lSW5jbHVkZXMobWF0Y2guc3RyaWN0LCBmYWxzZSwgZmFsc2UsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbWF0Y2ggYW55IHZhbHVlIGluIHt2YWx1ZXN9XCIpXG5leHBvcnRzLmluY2x1ZGVzQW55TWF0Y2ggPSBkZWZpbmVJbmNsdWRlcyhtYXRjaC5tYXRjaCwgZmFsc2UsIGZhbHNlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG1hdGNoIGFueSB2YWx1ZSBpbiB7dmFsdWVzfVwiKVxuZXhwb3J0cy5ub3RJbmNsdWRlc0FsbCA9IGRlZmluZUluY2x1ZGVzKFV0aWwuc3RyaWN0SXMsIHRydWUsIHRydWUsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGhhdmUgYWxsIHZhbHVlcyBpbiB7dmFsdWVzfVwiKVxuZXhwb3J0cy5ub3RJbmNsdWRlc0FsbERlZXAgPSBkZWZpbmVJbmNsdWRlcyhtYXRjaC5zdHJpY3QsIHRydWUsIHRydWUsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IG1hdGNoIGFsbCB2YWx1ZXMgaW4ge3ZhbHVlc31cIilcbmV4cG9ydHMubm90SW5jbHVkZXNBbGxNYXRjaCA9IGRlZmluZUluY2x1ZGVzKG1hdGNoLm1hdGNoLCB0cnVlLCB0cnVlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBtYXRjaCBhbGwgdmFsdWVzIGluIHt2YWx1ZXN9XCIpXG5leHBvcnRzLm5vdEluY2x1ZGVzID0gZGVmaW5lSW5jbHVkZXMoVXRpbC5zdHJpY3RJcywgZmFsc2UsIHRydWUsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGhhdmUgYW55IHZhbHVlIGluIHt2YWx1ZXN9XCIpXG5leHBvcnRzLm5vdEluY2x1ZGVzRGVlcCA9IGRlZmluZUluY2x1ZGVzKG1hdGNoLnN0cmljdCwgZmFsc2UsIHRydWUsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IG1hdGNoIGFueSB2YWx1ZSBpbiB7dmFsdWVzfVwiKVxuZXhwb3J0cy5ub3RJbmNsdWRlc01hdGNoID0gZGVmaW5lSW5jbHVkZXMobWF0Y2gubWF0Y2gsIGZhbHNlLCB0cnVlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBtYXRjaCBhbnkgdmFsdWUgaW4ge3ZhbHVlc31cIilcbiIsIlwidXNlIHN0cmljdFwiXG5cbnZhciBVdGlsID0gcmVxdWlyZShcIi4vdXRpbFwiKVxuXG5mdW5jdGlvbiBnZXROYW1lKGZ1bmMpIHtcbiAgICB2YXIgbmFtZSA9IGZ1bmMubmFtZVxuXG4gICAgaWYgKG5hbWUgPT0gbnVsbCkgbmFtZSA9IGZ1bmMuZGlzcGxheU5hbWVcbiAgICBpZiAobmFtZSkgcmV0dXJuIFV0aWwuZXNjYXBlKG5hbWUpXG4gICAgcmV0dXJuIFwiPGFub255bW91cz5cIlxufVxuXG5leHBvcnRzLnRocm93cyA9IGZ1bmN0aW9uIChUeXBlLCBjYWxsYmFjaykge1xuICAgIGlmIChjYWxsYmFjayA9PSBudWxsKSB7XG4gICAgICAgIGNhbGxiYWNrID0gVHlwZVxuICAgICAgICBUeXBlID0gbnVsbFxuICAgIH1cblxuICAgIGlmIChUeXBlICE9IG51bGwgJiYgdHlwZW9mIFR5cGUgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYFR5cGVgIG11c3QgYmUgYSBmdW5jdGlvbiBpZiBwYXNzZWRcIilcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBjYWxsYmFja2AgbXVzdCBiZSBhIGZ1bmN0aW9uXCIpXG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgICAgY2FsbGJhY2soKSAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGNhbGxiYWNrLXJldHVyblxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgaWYgKFR5cGUgIT0gbnVsbCAmJiAhKGUgaW5zdGFuY2VvZiBUeXBlKSkge1xuICAgICAgICAgICAgVXRpbC5mYWlsKFxuICAgICAgICAgICAgICAgIFwiRXhwZWN0ZWQgY2FsbGJhY2sgdG8gdGhyb3cgYW4gaW5zdGFuY2Ugb2YgXCIgKyBnZXROYW1lKFR5cGUpICtcbiAgICAgICAgICAgICAgICBcIiwgYnV0IGZvdW5kIHthY3R1YWx9XCIsXG4gICAgICAgICAgICAgICAge2FjdHVhbDogZX0pXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgdGhyb3cgbmV3IFV0aWwuQXNzZXJ0aW9uRXJyb3IoXCJFeHBlY3RlZCBjYWxsYmFjayB0byB0aHJvd1wiKVxufVxuXG5mdW5jdGlvbiB0aHJvd3NNYXRjaFRlc3QobWF0Y2hlciwgZSkge1xuICAgIGlmICh0eXBlb2YgbWF0Y2hlciA9PT0gXCJzdHJpbmdcIikgcmV0dXJuIGUubWVzc2FnZSA9PT0gbWF0Y2hlclxuICAgIGlmICh0eXBlb2YgbWF0Y2hlciA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4gISFtYXRjaGVyKGUpXG4gICAgaWYgKG1hdGNoZXIgaW5zdGFuY2VvZiBSZWdFeHApIHJldHVybiAhIW1hdGNoZXIudGVzdChlLm1lc3NhZ2UpXG5cbiAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKG1hdGNoZXIpXG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGtleSA9IGtleXNbaV1cblxuICAgICAgICBpZiAoIShrZXkgaW4gZSkgfHwgIVV0aWwuc3RyaWN0SXMobWF0Y2hlcltrZXldLCBlW2tleV0pKSByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZVxufVxuXG5mdW5jdGlvbiBpc1BsYWluT2JqZWN0KG9iamVjdCkge1xuICAgIHJldHVybiBvYmplY3QgPT0gbnVsbCB8fCBPYmplY3QuZ2V0UHJvdG90eXBlT2Yob2JqZWN0KSA9PT0gT2JqZWN0LnByb3RvdHlwZVxufVxuXG5leHBvcnRzLnRocm93c01hdGNoID0gZnVuY3Rpb24gKG1hdGNoZXIsIGNhbGxiYWNrKSB7XG4gICAgaWYgKHR5cGVvZiBtYXRjaGVyICE9PSBcInN0cmluZ1wiICYmXG4gICAgICAgICAgICB0eXBlb2YgbWF0Y2hlciAhPT0gXCJmdW5jdGlvblwiICYmXG4gICAgICAgICAgICAhKG1hdGNoZXIgaW5zdGFuY2VvZiBSZWdFeHApICYmXG4gICAgICAgICAgICAhaXNQbGFpbk9iamVjdChtYXRjaGVyKSkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICAgICAgXCJgbWF0Y2hlcmAgbXVzdCBiZSBhIHN0cmluZywgZnVuY3Rpb24sIFJlZ0V4cCwgb3Igb2JqZWN0XCIpXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJgY2FsbGJhY2tgIG11c3QgYmUgYSBmdW5jdGlvblwiKVxuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICAgIGNhbGxiYWNrKCkgLy8gZXNsaW50LWRpc2FibGUtbGluZSBjYWxsYmFjay1yZXR1cm5cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGlmICghdGhyb3dzTWF0Y2hUZXN0KG1hdGNoZXIsIGUpKSB7XG4gICAgICAgICAgICBVdGlsLmZhaWwoXG4gICAgICAgICAgICAgICAgXCJFeHBlY3RlZCBjYWxsYmFjayB0byAgdGhyb3cgYW4gZXJyb3IgdGhhdCBtYXRjaGVzIFwiICtcbiAgICAgICAgICAgICAgICBcIntleHBlY3RlZH0sIGJ1dCBmb3VuZCB7YWN0dWFsfVwiLFxuICAgICAgICAgICAgICAgIHtleHBlY3RlZDogbWF0Y2hlciwgYWN0dWFsOiBlfSlcbiAgICAgICAgfVxuICAgICAgICByZXR1cm5cbiAgICB9XG5cbiAgICB0aHJvdyBuZXcgVXRpbC5Bc3NlcnRpb25FcnJvcihcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIHRocm93LlwiKVxufVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxudmFyIGZhaWwgPSByZXF1aXJlKFwiLi91dGlsXCIpLmZhaWxcblxuZXhwb3J0cy5vayA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKCF4KSBmYWlsKFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gYmUgdHJ1dGh5XCIsIHthY3R1YWw6IHh9KVxufVxuXG5leHBvcnRzLm5vdE9rID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAoeCkgZmFpbChcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGJlIGZhbHN5XCIsIHthY3R1YWw6IHh9KVxufVxuXG5leHBvcnRzLmlzQm9vbGVhbiA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHR5cGVvZiB4ICE9PSBcImJvb2xlYW5cIikge1xuICAgICAgICBmYWlsKFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gYmUgYSBib29sZWFuXCIsIHthY3R1YWw6IHh9KVxuICAgIH1cbn1cblxuZXhwb3J0cy5ub3RCb29sZWFuID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAodHlwZW9mIHggPT09IFwiYm9vbGVhblwiKSB7XG4gICAgICAgIGZhaWwoXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgYmUgYSBib29sZWFuXCIsIHthY3R1YWw6IHh9KVxuICAgIH1cbn1cblxuZXhwb3J0cy5pc0Z1bmN0aW9uID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAodHlwZW9mIHggIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICBmYWlsKFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gYmUgYSBmdW5jdGlvblwiLCB7YWN0dWFsOiB4fSlcbiAgICB9XG59XG5cbmV4cG9ydHMubm90RnVuY3Rpb24gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh0eXBlb2YgeCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIGZhaWwoXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgYmUgYSBmdW5jdGlvblwiLCB7YWN0dWFsOiB4fSlcbiAgICB9XG59XG5cbmV4cG9ydHMuaXNOdW1iZXIgPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh0eXBlb2YgeCAhPT0gXCJudW1iZXJcIikge1xuICAgICAgICBmYWlsKFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gYmUgYSBudW1iZXJcIiwge2FjdHVhbDogeH0pXG4gICAgfVxufVxuXG5leHBvcnRzLm5vdE51bWJlciA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHR5cGVvZiB4ID09PSBcIm51bWJlclwiKSB7XG4gICAgICAgIGZhaWwoXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgYmUgYSBudW1iZXJcIiwge2FjdHVhbDogeH0pXG4gICAgfVxufVxuXG5leHBvcnRzLmlzT2JqZWN0ID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAodHlwZW9mIHggIT09IFwib2JqZWN0XCIgfHwgeCA9PSBudWxsKSB7XG4gICAgICAgIGZhaWwoXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBiZSBhbiBvYmplY3RcIiwge2FjdHVhbDogeH0pXG4gICAgfVxufVxuXG5leHBvcnRzLm5vdE9iamVjdCA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHR5cGVvZiB4ID09PSBcIm9iamVjdFwiICYmIHggIT0gbnVsbCkge1xuICAgICAgICBmYWlsKFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGJlIGFuIG9iamVjdFwiLCB7YWN0dWFsOiB4fSlcbiAgICB9XG59XG5cbmV4cG9ydHMuaXNTdHJpbmcgPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh0eXBlb2YgeCAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICBmYWlsKFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gYmUgYSBzdHJpbmdcIiwge2FjdHVhbDogeH0pXG4gICAgfVxufVxuXG5leHBvcnRzLm5vdFN0cmluZyA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHR5cGVvZiB4ID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIGZhaWwoXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgYmUgYSBzdHJpbmdcIiwge2FjdHVhbDogeH0pXG4gICAgfVxufVxuXG5leHBvcnRzLmlzU3ltYm9sID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAodHlwZW9mIHggIT09IFwic3ltYm9sXCIpIHtcbiAgICAgICAgZmFpbChcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGJlIGEgc3ltYm9sXCIsIHthY3R1YWw6IHh9KVxuICAgIH1cbn1cblxuZXhwb3J0cy5ub3RTeW1ib2wgPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh0eXBlb2YgeCA9PT0gXCJzeW1ib2xcIikge1xuICAgICAgICBmYWlsKFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGJlIGEgc3ltYm9sXCIsIHthY3R1YWw6IHh9KVxuICAgIH1cbn1cblxuZXhwb3J0cy5leGlzdHMgPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh4ID09IG51bGwpIHtcbiAgICAgICAgZmFpbChcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGV4aXN0XCIsIHthY3R1YWw6IHh9KVxuICAgIH1cbn1cblxuZXhwb3J0cy5ub3RFeGlzdHMgPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh4ICE9IG51bGwpIHtcbiAgICAgICAgZmFpbChcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBleGlzdFwiLCB7YWN0dWFsOiB4fSlcbiAgICB9XG59XG5cbmV4cG9ydHMuaXNBcnJheSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KHgpKSB7XG4gICAgICAgIGZhaWwoXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBiZSBhbiBhcnJheVwiLCB7YWN0dWFsOiB4fSlcbiAgICB9XG59XG5cbmV4cG9ydHMubm90QXJyYXkgPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmIChBcnJheS5pc0FycmF5KHgpKSB7XG4gICAgICAgIGZhaWwoXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgYmUgYW4gYXJyYXlcIiwge2FjdHVhbDogeH0pXG4gICAgfVxufVxuXG5leHBvcnRzLmlzID0gZnVuY3Rpb24gKFR5cGUsIG9iamVjdCkge1xuICAgIGlmICh0eXBlb2YgVHlwZSAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJgVHlwZWAgbXVzdCBiZSBhIGZ1bmN0aW9uXCIpXG4gICAgfVxuXG4gICAgaWYgKCEob2JqZWN0IGluc3RhbmNlb2YgVHlwZSkpIHtcbiAgICAgICAgZmFpbChcIkV4cGVjdGVkIHtvYmplY3R9IHRvIGJlIGFuIGluc3RhbmNlIG9mIHtleHBlY3RlZH1cIiwge1xuICAgICAgICAgICAgZXhwZWN0ZWQ6IFR5cGUsXG4gICAgICAgICAgICBhY3R1YWw6IG9iamVjdC5jb25zdHJ1Y3RvcixcbiAgICAgICAgICAgIG9iamVjdDogb2JqZWN0LFxuICAgICAgICB9KVxuICAgIH1cbn1cblxuZXhwb3J0cy5ub3QgPSBmdW5jdGlvbiAoVHlwZSwgb2JqZWN0KSB7XG4gICAgaWYgKHR5cGVvZiBUeXBlICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBUeXBlYCBtdXN0IGJlIGEgZnVuY3Rpb25cIilcbiAgICB9XG5cbiAgICBpZiAob2JqZWN0IGluc3RhbmNlb2YgVHlwZSkge1xuICAgICAgICBmYWlsKFwiRXhwZWN0ZWQge29iamVjdH0gdG8gbm90IGJlIGFuIGluc3RhbmNlIG9mIHtleHBlY3RlZH1cIiwge1xuICAgICAgICAgICAgZXhwZWN0ZWQ6IFR5cGUsXG4gICAgICAgICAgICBvYmplY3Q6IG9iamVjdCxcbiAgICAgICAgfSlcbiAgICB9XG59XG4iLCJcInVzZSBzdHJpY3RcIlxuXG52YXIgaW5zcGVjdCA9IHJlcXVpcmUoXCIuLi9yZXBsYWNlZC9pbnNwZWN0XCIpXG52YXIgZ2V0U3RhY2sgPSByZXF1aXJlKFwiLi4vdXRpbFwiKS5nZXRTdGFja1xudmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHlcbnZhciBBc3NlcnRpb25FcnJvclxuXG50cnkge1xuICAgIEFzc2VydGlvbkVycm9yID0gbmV3IEZ1bmN0aW9uKFsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1uZXctZnVuY1xuICAgICAgICBcIid1c2Ugc3RyaWN0JztcIixcbiAgICAgICAgXCJjbGFzcyBBc3NlcnRpb25FcnJvciBleHRlbmRzIEVycm9yIHtcIixcbiAgICAgICAgXCIgICAgY29uc3RydWN0b3IobWVzc2FnZSwgZXhwZWN0ZWQsIGFjdHVhbCkge1wiLFxuICAgICAgICBcIiAgICAgICAgc3VwZXIobWVzc2FnZSlcIixcbiAgICAgICAgXCIgICAgICAgIHRoaXMuZXhwZWN0ZWQgPSBleHBlY3RlZFwiLFxuICAgICAgICBcIiAgICAgICAgdGhpcy5hY3R1YWwgPSBhY3R1YWxcIixcbiAgICAgICAgXCIgICAgfVwiLFxuICAgICAgICBcIlwiLFxuICAgICAgICBcIiAgICBnZXQgbmFtZSgpIHtcIixcbiAgICAgICAgXCIgICAgICAgIHJldHVybiAnQXNzZXJ0aW9uRXJyb3InXCIsXG4gICAgICAgIFwiICAgIH1cIixcbiAgICAgICAgXCJ9XCIsXG4gICAgICAgIC8vIGNoZWNrIG5hdGl2ZSBzdWJjbGFzc2luZyBzdXBwb3J0XG4gICAgICAgIFwibmV3IEFzc2VydGlvbkVycm9yKCdtZXNzYWdlJywgMSwgMilcIixcbiAgICAgICAgXCJyZXR1cm4gQXNzZXJ0aW9uRXJyb3JcIixcbiAgICBdLmpvaW4oXCJcXG5cIikpKClcbn0gY2F0Y2ggKGUpIHtcbiAgICBBc3NlcnRpb25FcnJvciA9IHR5cGVvZiBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSA9PT0gXCJmdW5jdGlvblwiXG4gICAgICAgID8gZnVuY3Rpb24gQXNzZXJ0aW9uRXJyb3IobWVzc2FnZSwgZXhwZWN0ZWQsIGFjdHVhbCkge1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlID0gbWVzc2FnZSB8fCBcIlwiXG4gICAgICAgICAgICB0aGlzLmV4cGVjdGVkID0gZXhwZWN0ZWRcbiAgICAgICAgICAgIHRoaXMuYWN0dWFsID0gYWN0dWFsXG4gICAgICAgICAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSh0aGlzLCB0aGlzLmNvbnN0cnVjdG9yKVxuICAgICAgICB9XG4gICAgICAgIDogZnVuY3Rpb24gQXNzZXJ0aW9uRXJyb3IobWVzc2FnZSwgZXhwZWN0ZWQsIGFjdHVhbCkge1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlID0gbWVzc2FnZSB8fCBcIlwiXG4gICAgICAgICAgICB0aGlzLmV4cGVjdGVkID0gZXhwZWN0ZWRcbiAgICAgICAgICAgIHRoaXMuYWN0dWFsID0gYWN0dWFsXG4gICAgICAgICAgICB0aGlzLnN0YWNrID0gZ2V0U3RhY2soZSlcbiAgICAgICAgfVxuXG4gICAgQXNzZXJ0aW9uRXJyb3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShFcnJvci5wcm90b3R5cGUpXG5cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoQXNzZXJ0aW9uRXJyb3IucHJvdG90eXBlLCBcImNvbnN0cnVjdG9yXCIsIHtcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgIHZhbHVlOiBBc3NlcnRpb25FcnJvcixcbiAgICB9KVxuXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEFzc2VydGlvbkVycm9yLnByb3RvdHlwZSwgXCJuYW1lXCIsIHtcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgIHZhbHVlOiBcIkFzc2VydGlvbkVycm9yXCIsXG4gICAgfSlcbn1cblxuZXhwb3J0cy5Bc3NlcnRpb25FcnJvciA9IEFzc2VydGlvbkVycm9yXG5cbi8qIGVzbGludC1kaXNhYmxlIG5vLXNlbGYtY29tcGFyZSAqL1xuLy8gRm9yIGJldHRlciBOYU4gaGFuZGxpbmdcbmV4cG9ydHMuc3RyaWN0SXMgPSBmdW5jdGlvbiAoYSwgYikge1xuICAgIHJldHVybiBhID09PSBiIHx8IGEgIT09IGEgJiYgYiAhPT0gYlxufVxuXG5leHBvcnRzLmxvb3NlSXMgPSBmdW5jdGlvbiAoYSwgYikge1xuICAgIHJldHVybiBhID09IGIgfHwgYSAhPT0gYSAmJiBiICE9PSBiIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgZXFlcWVxXG59XG5cbi8qIGVzbGludC1lbmFibGUgbm8tc2VsZi1jb21wYXJlICovXG5cbnZhciB0ZW1wbGF0ZVJlZ2V4cCA9IC8oLj8pXFx7KC4rPylcXH0vZ1xuXG5leHBvcnRzLmVzY2FwZSA9IGZ1bmN0aW9uIChzdHJpbmcpIHtcbiAgICBpZiAodHlwZW9mIHN0cmluZyAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYHN0cmluZ2AgbXVzdCBiZSBhIHN0cmluZ1wiKVxuICAgIH1cblxuICAgIHJldHVybiBzdHJpbmcucmVwbGFjZSh0ZW1wbGF0ZVJlZ2V4cCwgZnVuY3Rpb24gKG0sIHByZSkge1xuICAgICAgICByZXR1cm4gcHJlICsgXCJcXFxcXCIgKyBtLnNsaWNlKDEpXG4gICAgfSlcbn1cblxuLy8gVGhpcyBmb3JtYXRzIHRoZSBhc3NlcnRpb24gZXJyb3IgbWVzc2FnZXMuXG5leHBvcnRzLmZvcm1hdCA9IGZ1bmN0aW9uIChtZXNzYWdlLCBhcmdzLCBwcmV0dGlmeSkge1xuICAgIGlmIChwcmV0dGlmeSA9PSBudWxsKSBwcmV0dGlmeSA9IGluc3BlY3RcblxuICAgIGlmICh0eXBlb2YgbWVzc2FnZSAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYG1lc3NhZ2VgIG11c3QgYmUgYSBzdHJpbmdcIilcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGFyZ3MgIT09IFwib2JqZWN0XCIgfHwgYXJncyA9PT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYGFyZ3NgIG11c3QgYmUgYW4gb2JqZWN0XCIpXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBwcmV0dGlmeSAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJgcHJldHRpZnlgIG11c3QgYmUgYSBmdW5jdGlvbiBpZiBwYXNzZWRcIilcbiAgICB9XG5cbiAgICByZXR1cm4gbWVzc2FnZS5yZXBsYWNlKHRlbXBsYXRlUmVnZXhwLCBmdW5jdGlvbiAobSwgcHJlLCBwcm9wKSB7XG4gICAgICAgIGlmIChwcmUgPT09IFwiXFxcXFwiKSB7XG4gICAgICAgICAgICByZXR1cm4gbS5zbGljZSgxKVxuICAgICAgICB9IGVsc2UgaWYgKGhhc093bi5jYWxsKGFyZ3MsIHByb3ApKSB7XG4gICAgICAgICAgICByZXR1cm4gcHJlICsgcHJldHRpZnkoYXJnc1twcm9wXSwge2RlcHRoOiA1fSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBwcmUgKyBtXG4gICAgICAgIH1cbiAgICB9KVxufVxuXG5leHBvcnRzLmZhaWwgPSBmdW5jdGlvbiAobWVzc2FnZSwgYXJncywgcHJldHRpZnkpIHtcbiAgICBpZiAoYXJncyA9PSBudWxsKSB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IobWVzc2FnZSlcbiAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IoXG4gICAgICAgIGV4cG9ydHMuZm9ybWF0KG1lc3NhZ2UsIGFyZ3MsIHByZXR0aWZ5KSxcbiAgICAgICAgYXJncy5leHBlY3RlZCxcbiAgICAgICAgYXJncy5hY3R1YWwpXG59XG5cbi8vIFRoZSBiYXNpYyBhc3NlcnQsIGxpa2UgYGFzc2VydC5va2AsIGJ1dCBnaXZlcyB5b3UgYW4gb3B0aW9uYWwgbWVzc2FnZS5cbmV4cG9ydHMuYXNzZXJ0ID0gZnVuY3Rpb24gKHRlc3QsIG1lc3NhZ2UpIHtcbiAgICBpZiAoIXRlc3QpIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihtZXNzYWdlKVxufVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxuLyoqXG4gKiBUaGlzIGlzIHRoZSBlbnRyeSBwb2ludCBmb3IgdGhlIEJyb3dzZXJpZnkgYnVuZGxlLiBOb3RlIHRoYXQgaXQgKmFsc28qIHdpbGxcbiAqIHJ1biBhcyBwYXJ0IG9mIHRoZSB0ZXN0cyBpbiBOb2RlICh1bmJ1bmRsZWQpLCBhbmQgaXQgdGhlb3JldGljYWxseSBjb3VsZCBiZVxuICogcnVuIGluIE5vZGUgb3IgYSBydW50aW1lIGxpbWl0ZWQgdG8gb25seSBFUzUgc3VwcG9ydCAoZS5nLiBSaGlubywgTmFzaG9ybiwgb3JcbiAqIGVtYmVkZGVkIFY4KSwgc28gZG8gKm5vdCogYXNzdW1lIGJyb3dzZXIgZ2xvYmFscyBhcmUgcHJlc2VudC5cbiAqL1xuXG5leHBvcnRzLnQgPSByZXF1aXJlKFwiLi4vaW5kZXhcIilcbmV4cG9ydHMuYXNzZXJ0ID0gcmVxdWlyZShcIi4uL2Fzc2VydFwiKVxuZXhwb3J0cy5tYXRjaCA9IHJlcXVpcmUoXCIuLi9tYXRjaFwiKVxuZXhwb3J0cy5yID0gcmVxdWlyZShcIi4uL3JcIilcblxudmFyIEludGVybmFsID0gcmVxdWlyZShcIi4uL2ludGVybmFsXCIpXG5cbmV4cG9ydHMucm9vdCA9IEludGVybmFsLnJvb3RcbmV4cG9ydHMucmVwb3J0cyA9IEludGVybmFsLnJlcG9ydHNcbmV4cG9ydHMuaG9va0Vycm9ycyA9IEludGVybmFsLmhvb2tFcnJvcnNcbmV4cG9ydHMubG9jYXRpb24gPSBJbnRlcm5hbC5sb2NhdGlvblxuXG4vLyBJbiBjYXNlIHRoZSB1c2VyIG5lZWRzIHRvIGFkanVzdCB0aGlzIChlLmcuIE5hc2hvcm4gKyBjb25zb2xlIG91dHB1dCkuXG52YXIgU2V0dGluZ3MgPSByZXF1aXJlKFwiLi9zZXR0aW5nc1wiKVxuXG5leHBvcnRzLnNldHRpbmdzID0ge1xuICAgIHdpbmRvd1dpZHRoOiB7XG4gICAgICAgIGdldDogU2V0dGluZ3Mud2luZG93V2lkdGgsXG4gICAgICAgIHNldDogU2V0dGluZ3Muc2V0V2luZG93V2lkdGgsXG4gICAgfSxcblxuICAgIG5ld2xpbmU6IHtcbiAgICAgICAgZ2V0OiBTZXR0aW5ncy5uZXdsaW5lLFxuICAgICAgICBzZXQ6IFNldHRpbmdzLnNldE5ld2xpbmUsXG4gICAgfSxcblxuICAgIHN5bWJvbHM6IHtcbiAgICAgICAgZ2V0OiBTZXR0aW5ncy5zeW1ib2xzLFxuICAgICAgICBzZXQ6IFNldHRpbmdzLnNldFN5bWJvbHMsXG4gICAgfSxcblxuICAgIGRlZmF1bHRPcHRzOiB7XG4gICAgICAgIGdldDogU2V0dGluZ3MuZGVmYXVsdE9wdHMsXG4gICAgICAgIHNldDogU2V0dGluZ3Muc2V0RGVmYXVsdE9wdHMsXG4gICAgfSxcblxuICAgIGNvbG9yU3VwcG9ydDoge1xuICAgICAgICBnZXQ6IFNldHRpbmdzLkNvbG9ycy5nZXRTdXBwb3J0LFxuICAgICAgICBzZXQ6IFNldHRpbmdzLkNvbG9ycy5zZXRTdXBwb3J0LFxuICAgIH0sXG59XG4iLCJcInVzZSBzdHJpY3RcIlxuXG4vKipcbiAqIFRoZSB3aGl0ZWxpc3QgaXMgYWN0dWFsbHkgc3RvcmVkIGFzIGEgdHJlZSBmb3IgZmFzdGVyIGxvb2t1cCB0aW1lcyB3aGVuIHRoZXJlXG4gKiBhcmUgbXVsdGlwbGUgc2VsZWN0b3JzLiBPYmplY3RzIGNhbid0IGJlIHVzZWQgZm9yIHRoZSBub2Rlcywgd2hlcmUga2V5c1xuICogcmVwcmVzZW50IHZhbHVlcyBhbmQgdmFsdWVzIHJlcHJlc2VudCBjaGlsZHJlbiwgYmVjYXVzZSByZWd1bGFyIGV4cHJlc3Npb25zXG4gKiBhcmVuJ3QgcG9zc2libGUgdG8gdXNlLlxuICovXG5cbmZ1bmN0aW9uIGlzRXF1aXZhbGVudChlbnRyeSwgaXRlbSkge1xuICAgIGlmICh0eXBlb2YgZW50cnkgPT09IFwic3RyaW5nXCIgJiYgdHlwZW9mIGl0ZW0gPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgcmV0dXJuIGVudHJ5ID09PSBpdGVtXG4gICAgfSBlbHNlIGlmIChlbnRyeSBpbnN0YW5jZW9mIFJlZ0V4cCAmJiBpdGVtIGluc3RhbmNlb2YgUmVnRXhwKSB7XG4gICAgICAgIHJldHVybiBlbnRyeS50b1N0cmluZygpID09PSBpdGVtLnRvU3RyaW5nKClcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG59XG5cbmZ1bmN0aW9uIG1hdGNoZXMoZW50cnksIGl0ZW0pIHtcbiAgICBpZiAodHlwZW9mIGVudHJ5ID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIHJldHVybiBlbnRyeSA9PT0gaXRlbVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBlbnRyeS50ZXN0KGl0ZW0pXG4gICAgfVxufVxuXG5mdW5jdGlvbiBPbmx5KHZhbHVlKSB7XG4gICAgdGhpcy52YWx1ZSA9IHZhbHVlXG4gICAgdGhpcy5jaGlsZHJlbiA9IHVuZGVmaW5lZFxufVxuXG5mdW5jdGlvbiBmaW5kRXF1aXZhbGVudChub2RlLCBlbnRyeSkge1xuICAgIGlmIChub2RlLmNoaWxkcmVuID09IG51bGwpIHJldHVybiB1bmRlZmluZWRcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbm9kZS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgY2hpbGQgPSBub2RlLmNoaWxkcmVuW2ldXG5cbiAgICAgICAgaWYgKGlzRXF1aXZhbGVudChjaGlsZC52YWx1ZSwgZW50cnkpKSByZXR1cm4gY2hpbGRcbiAgICB9XG5cbiAgICByZXR1cm4gdW5kZWZpbmVkXG59XG5cbmZ1bmN0aW9uIGZpbmRNYXRjaGVzKG5vZGUsIGVudHJ5KSB7XG4gICAgaWYgKG5vZGUuY2hpbGRyZW4gPT0gbnVsbCkgcmV0dXJuIHVuZGVmaW5lZFxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBub2RlLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBjaGlsZCA9IG5vZGUuY2hpbGRyZW5baV1cblxuICAgICAgICBpZiAobWF0Y2hlcyhjaGlsZC52YWx1ZSwgZW50cnkpKSByZXR1cm4gY2hpbGRcbiAgICB9XG5cbiAgICByZXR1cm4gdW5kZWZpbmVkXG59XG5cbi8qKlxuICogQWRkIGEgbnVtYmVyIG9mIHNlbGVjdG9yc1xuICpcbiAqIEB0aGlzIHtUZXN0fVxuICovXG5leHBvcnRzLm9ubHlBZGQgPSBmdW5jdGlvbiAoLyogLi4uc2VsZWN0b3JzICovKSB7XG4gICAgdGhpcy5vbmx5ID0gbmV3IE9ubHkoKVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHNlbGVjdG9yID0gYXJndW1lbnRzW2ldXG5cbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHNlbGVjdG9yKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICAgICAgICAgICBcIkV4cGVjdGVkIHNlbGVjdG9yIFwiICsgaSArIFwiIHRvIGJlIGFuIGFycmF5XCIpXG4gICAgICAgIH1cblxuICAgICAgICBvbmx5QWRkU2luZ2xlKHRoaXMub25seSwgc2VsZWN0b3IsIGkpXG4gICAgfVxufVxuXG5mdW5jdGlvbiBvbmx5QWRkU2luZ2xlKG5vZGUsIHNlbGVjdG9yLCBpbmRleCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2VsZWN0b3IubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGVudHJ5ID0gc2VsZWN0b3JbaV1cblxuICAgICAgICAvLyBTdHJpbmdzIGFuZCByZWd1bGFyIGV4cHJlc3Npb25zIGFyZSB0aGUgb25seSB0aGluZ3MgYWxsb3dlZC5cbiAgICAgICAgaWYgKHR5cGVvZiBlbnRyeSAhPT0gXCJzdHJpbmdcIiAmJiAhKGVudHJ5IGluc3RhbmNlb2YgUmVnRXhwKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICAgICAgICAgICBcIlNlbGVjdG9yIFwiICsgaW5kZXggKyBcIiBtdXN0IGNvbnNpc3Qgb2Ygb25seSBzdHJpbmdzIGFuZC9vciBcIiArXG4gICAgICAgICAgICAgICAgXCJyZWd1bGFyIGV4cHJlc3Npb25zXCIpXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgY2hpbGQgPSBmaW5kRXF1aXZhbGVudChub2RlLCBlbnRyeSlcblxuICAgICAgICBpZiAoY2hpbGQgPT0gbnVsbCkge1xuICAgICAgICAgICAgY2hpbGQgPSBuZXcgT25seShlbnRyeSlcbiAgICAgICAgICAgIGlmIChub2RlLmNoaWxkcmVuID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBub2RlLmNoaWxkcmVuID0gW2NoaWxkXVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBub2RlLmNoaWxkcmVuLnB1c2goY2hpbGQpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBub2RlID0gY2hpbGRcbiAgICB9XG59XG5cbi8qKlxuICogVGhpcyBjaGVja3MgaWYgdGhlIHRlc3Qgd2FzIHdoaXRlbGlzdGVkIGluIGEgYHQub25seSgpYCBjYWxsLCBvciBmb3JcbiAqIGNvbnZlbmllbmNlLCByZXR1cm5zIGB0cnVlYCBpZiBgdC5vbmx5KClgIHdhcyBuZXZlciBjYWxsZWQuXG4gKi9cbmV4cG9ydHMuaXNPbmx5ID0gZnVuY3Rpb24gKHRlc3QpIHtcbiAgICB2YXIgcGF0aCA9IFtdXG4gICAgdmFyIGkgPSAwXG5cbiAgICB3aGlsZSAodGVzdC5yb290ICE9PSB0ZXN0ICYmIHRlc3Qub25seSA9PSBudWxsKSB7XG4gICAgICAgIHBhdGgucHVzaCh0ZXN0Lm5hbWUpXG4gICAgICAgIHRlc3QgPSB0ZXN0LnBhcmVudFxuICAgICAgICBpKytcbiAgICB9XG5cbiAgICAvLyBJZiB0aGVyZSBpc24ndCBhbnkgYG9ubHlgIGFjdGl2ZSwgdGhlbiBsZXQncyBza2lwIHRoZSBjaGVjayBhbmQgcmV0dXJuXG4gICAgLy8gYHRydWVgIGZvciBjb252ZW5pZW5jZS5cbiAgICB2YXIgb25seSA9IHRlc3Qub25seVxuXG4gICAgaWYgKG9ubHkgIT0gbnVsbCkge1xuICAgICAgICB3aGlsZSAoaSAhPT0gMCkge1xuICAgICAgICAgICAgb25seSA9IGZpbmRNYXRjaGVzKG9ubHksIHBhdGhbLS1pXSlcbiAgICAgICAgICAgIGlmIChvbmx5ID09IG51bGwpIHJldHVybiBmYWxzZVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWVcbn1cbiIsIlwidXNlIHN0cmljdFwiXG5cbnZhciBtZXRob2RzID0gcmVxdWlyZShcIi4uL21ldGhvZHNcIilcblxuLyoqXG4gKiBBbGwgdGhlIHJlcG9ydCB0eXBlcy4gVGhlIG9ubHkgcmVhc29uIHRoZXJlIGFyZSBtb3JlIHRoYW4gdHdvIHR5cGVzIChub3JtYWxcbiAqIGFuZCBob29rKSBpcyBmb3IgdGhlIHVzZXIncyBiZW5lZml0IChkZXYgdG9vbHMsIGB1dGlsLmluc3BlY3RgLCBldGMuKVxuICovXG5cbnZhciBUeXBlcyA9IGV4cG9ydHMuVHlwZXMgPSBPYmplY3QuZnJlZXplKHtcbiAgICBTdGFydDogMCxcbiAgICBFbnRlcjogMSxcbiAgICBMZWF2ZTogMixcbiAgICBQYXNzOiAzLFxuICAgIEZhaWw6IDQsXG4gICAgU2tpcDogNSxcbiAgICBFbmQ6IDYsXG4gICAgRXJyb3I6IDcsXG5cbiAgICAvLyBOb3RlIHRoYXQgYEhvb2tgIGlzIGRlbm90ZWQgYnkgdGhlIDR0aCBiaXQgc2V0LCB0byBzYXZlIHNvbWUgc3BhY2UgKGFuZFxuICAgIC8vIHRvIHNpbXBsaWZ5IHRoZSB0eXBlIHJlcHJlc2VudGF0aW9uKS5cbiAgICBIb29rOiA4LFxuICAgIEJlZm9yZUFsbDogOCB8IDAsXG4gICAgQmVmb3JlRWFjaDogOCB8IDEsXG4gICAgQWZ0ZXJFYWNoOiA4IHwgMixcbiAgICBBZnRlckFsbDogOCB8IDMsXG59KVxuXG5leHBvcnRzLlJlcG9ydCA9IFJlcG9ydFxuZnVuY3Rpb24gUmVwb3J0KHR5cGUpIHtcbiAgICB0aGlzLl8gPSB0eXBlXG59XG5cbi8vIEF2b2lkIGEgcmVjdXJzaXZlIGNhbGwgd2hlbiBgaW5zcGVjdGBpbmcgYSByZXN1bHQgd2hpbGUgc3RpbGwga2VlcGluZyBpdFxuLy8gc3R5bGVkIGxpa2UgaXQgd291bGQgYmUgbm9ybWFsbHkuIEVhY2ggdHlwZSB1c2VzIGEgbmFtZWQgc2luZ2xldG9uIGZhY3RvcnkgdG9cbi8vIGVuc3VyZSBlbmdpbmVzIHNob3cgdGhlIGNvcnJlY3QgYG5hbWVgL2BkaXNwbGF5TmFtZWAgZm9yIHRoZSB0eXBlLlxuZnVuY3Rpb24gaW5pdEluc3BlY3QoaW5zcGVjdCwgcmVwb3J0KSB7XG4gICAgdmFyIHR5cGUgPSByZXBvcnQuX1xuXG4gICAgaWYgKHR5cGUgJiBUeXBlcy5Ib29rKSB7XG4gICAgICAgIGluc3BlY3Quc3RhZ2UgPSByZXBvcnQuc3RhZ2VcbiAgICB9XG5cbiAgICBpZiAodHlwZSAhPT0gVHlwZXMuU3RhcnQgJiZcbiAgICAgICAgICAgIHR5cGUgIT09IFR5cGVzLkVuZCAmJlxuICAgICAgICAgICAgdHlwZSAhPT0gVHlwZXMuRXJyb3IpIHtcbiAgICAgICAgaW5zcGVjdC5wYXRoID0gcmVwb3J0LnBhdGhcbiAgICB9XG5cbiAgICBpZiAodHlwZSAmIFR5cGVzLkhvb2spIHtcbiAgICAgICAgaW5zcGVjdC5yb290UGF0aCA9IHJlcG9ydC5yb290UGF0aFxuICAgIH1cblxuICAgIC8vIE9ubHkgYWRkIHRoZSByZWxldmFudCBwcm9wZXJ0aWVzXG4gICAgaWYgKHR5cGUgPT09IFR5cGVzLkZhaWwgfHxcbiAgICAgICAgICAgIHR5cGUgPT09IFR5cGVzLkVycm9yIHx8XG4gICAgICAgICAgICB0eXBlICYgVHlwZXMuSG9vaykge1xuICAgICAgICBpbnNwZWN0LnZhbHVlID0gcmVwb3J0LnZhbHVlXG4gICAgfVxuXG4gICAgaWYgKHR5cGUgPT09IFR5cGVzLkVudGVyIHx8XG4gICAgICAgICAgICB0eXBlID09PSBUeXBlcy5QYXNzIHx8XG4gICAgICAgICAgICB0eXBlID09PSBUeXBlcy5GYWlsKSB7XG4gICAgICAgIGluc3BlY3QuZHVyYXRpb24gPSByZXBvcnQuZHVyYXRpb25cbiAgICAgICAgaW5zcGVjdC5zbG93ID0gcmVwb3J0LnNsb3dcbiAgICB9XG59XG5cbm1ldGhvZHMoUmVwb3J0LCB7XG4gICAgLy8gVGhlIHJlcG9ydCB0eXBlc1xuICAgIGdldCBpc1N0YXJ0KCkgeyByZXR1cm4gdGhpcy5fID09PSBUeXBlcy5TdGFydCB9LFxuICAgIGdldCBpc0VudGVyKCkgeyByZXR1cm4gdGhpcy5fID09PSBUeXBlcy5FbnRlciB9LFxuICAgIGdldCBpc0xlYXZlKCkgeyByZXR1cm4gdGhpcy5fID09PSBUeXBlcy5MZWF2ZSB9LFxuICAgIGdldCBpc1Bhc3MoKSB7IHJldHVybiB0aGlzLl8gPT09IFR5cGVzLlBhc3MgfSxcbiAgICBnZXQgaXNGYWlsKCkgeyByZXR1cm4gdGhpcy5fID09PSBUeXBlcy5GYWlsIH0sXG4gICAgZ2V0IGlzU2tpcCgpIHsgcmV0dXJuIHRoaXMuXyA9PT0gVHlwZXMuU2tpcCB9LFxuICAgIGdldCBpc0VuZCgpIHsgcmV0dXJuIHRoaXMuXyA9PT0gVHlwZXMuRW5kIH0sXG4gICAgZ2V0IGlzRXJyb3IoKSB7IHJldHVybiB0aGlzLl8gPT09IFR5cGVzLkVycm9yIH0sXG4gICAgZ2V0IGlzSG9vaygpIHsgcmV0dXJuICh0aGlzLl8gJiBUeXBlcy5Ib29rKSAhPT0gMCB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGEgc3RyaW5naWZpZWQgZGVzY3JpcHRpb24gb2YgdGhlIHR5cGUuXG4gICAgICovXG4gICAgZ2V0IHR5cGUoKSB7XG4gICAgICAgIHN3aXRjaCAodGhpcy5fKSB7XG4gICAgICAgIGNhc2UgVHlwZXMuU3RhcnQ6IHJldHVybiBcInN0YXJ0XCJcbiAgICAgICAgY2FzZSBUeXBlcy5FbnRlcjogcmV0dXJuIFwiZW50ZXJcIlxuICAgICAgICBjYXNlIFR5cGVzLkxlYXZlOiByZXR1cm4gXCJsZWF2ZVwiXG4gICAgICAgIGNhc2UgVHlwZXMuUGFzczogcmV0dXJuIFwicGFzc1wiXG4gICAgICAgIGNhc2UgVHlwZXMuRmFpbDogcmV0dXJuIFwiZmFpbFwiXG4gICAgICAgIGNhc2UgVHlwZXMuU2tpcDogcmV0dXJuIFwic2tpcFwiXG4gICAgICAgIGNhc2UgVHlwZXMuRW5kOiByZXR1cm4gXCJlbmRcIlxuICAgICAgICBjYXNlIFR5cGVzLkVycm9yOiByZXR1cm4gXCJlcnJvclwiXG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBpZiAodGhpcy5fICYgVHlwZXMuSG9vaykgcmV0dXJuIFwiaG9va1wiXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJ1bnJlYWNoYWJsZVwiKVxuICAgICAgICB9XG4gICAgfSxcbn0pXG5cbmV4cG9ydHMuU3RhcnQgPSBTdGFydFJlcG9ydFxuZnVuY3Rpb24gU3RhcnRSZXBvcnQoKSB7XG4gICAgUmVwb3J0LmNhbGwodGhpcywgVHlwZXMuU3RhcnQpXG59XG5tZXRob2RzKFN0YXJ0UmVwb3J0LCBSZXBvcnQsIHtcbiAgICBpbnNwZWN0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgZnVuY3Rpb24gUmVwb3J0KHJlcG9ydCkge1xuICAgICAgICAgICAgaW5pdEluc3BlY3QodGhpcywgcmVwb3J0KVxuICAgICAgICB9KHRoaXMpXG4gICAgfSxcbn0pXG5cbmV4cG9ydHMuRW50ZXIgPSBFbnRlclJlcG9ydFxuZnVuY3Rpb24gRW50ZXJSZXBvcnQocGF0aCwgZHVyYXRpb24sIHNsb3cpIHtcbiAgICBSZXBvcnQuY2FsbCh0aGlzLCBUeXBlcy5FbnRlcilcbiAgICB0aGlzLnBhdGggPSBwYXRoXG4gICAgdGhpcy5kdXJhdGlvbiA9IGR1cmF0aW9uXG4gICAgdGhpcy5zbG93ID0gc2xvd1xufVxubWV0aG9kcyhFbnRlclJlcG9ydCwgUmVwb3J0LCB7XG4gICAgLyoqXG4gICAgICogU28gdXRpbC5pbnNwZWN0IHByb3ZpZGVzIG1vcmUgc2Vuc2libGUgb3V0cHV0IGZvciB0ZXN0aW5nL2V0Yy5cbiAgICAgKi9cbiAgICBpbnNwZWN0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgZnVuY3Rpb24gRW50ZXJSZXBvcnQocmVwb3J0KSB7XG4gICAgICAgICAgICBpbml0SW5zcGVjdCh0aGlzLCByZXBvcnQpXG4gICAgICAgIH0odGhpcylcbiAgICB9LFxufSlcblxuZXhwb3J0cy5MZWF2ZSA9IExlYXZlUmVwb3J0XG5mdW5jdGlvbiBMZWF2ZVJlcG9ydChwYXRoKSB7XG4gICAgUmVwb3J0LmNhbGwodGhpcywgVHlwZXMuTGVhdmUpXG4gICAgdGhpcy5wYXRoID0gcGF0aFxufVxubWV0aG9kcyhMZWF2ZVJlcG9ydCwgUmVwb3J0LCB7XG4gICAgLyoqXG4gICAgICogU28gdXRpbC5pbnNwZWN0IHByb3ZpZGVzIG1vcmUgc2Vuc2libGUgb3V0cHV0IGZvciB0ZXN0aW5nL2V0Yy5cbiAgICAgKi9cbiAgICBpbnNwZWN0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgZnVuY3Rpb24gTGVhdmVSZXBvcnQocmVwb3J0KSB7XG4gICAgICAgICAgICBpbml0SW5zcGVjdCh0aGlzLCByZXBvcnQpXG4gICAgICAgIH0odGhpcylcbiAgICB9LFxufSlcblxuZXhwb3J0cy5QYXNzID0gUGFzc1JlcG9ydFxuZnVuY3Rpb24gUGFzc1JlcG9ydChwYXRoLCBkdXJhdGlvbiwgc2xvdykge1xuICAgIFJlcG9ydC5jYWxsKHRoaXMsIFR5cGVzLlBhc3MpXG4gICAgdGhpcy5wYXRoID0gcGF0aFxuICAgIHRoaXMuZHVyYXRpb24gPSBkdXJhdGlvblxuICAgIHRoaXMuc2xvdyA9IHNsb3dcbn1cbm1ldGhvZHMoUGFzc1JlcG9ydCwgUmVwb3J0LCB7XG4gICAgLyoqXG4gICAgICogU28gdXRpbC5pbnNwZWN0IHByb3ZpZGVzIG1vcmUgc2Vuc2libGUgb3V0cHV0IGZvciB0ZXN0aW5nL2V0Yy5cbiAgICAgKi9cbiAgICBpbnNwZWN0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgZnVuY3Rpb24gUGFzc1JlcG9ydChyZXBvcnQpIHtcbiAgICAgICAgICAgIGluaXRJbnNwZWN0KHRoaXMsIHJlcG9ydClcbiAgICAgICAgfSh0aGlzKVxuICAgIH0sXG59KVxuXG5leHBvcnRzLkZhaWwgPSBGYWlsUmVwb3J0XG5mdW5jdGlvbiBGYWlsUmVwb3J0KHBhdGgsIGVycm9yLCBkdXJhdGlvbiwgc2xvdykge1xuICAgIFJlcG9ydC5jYWxsKHRoaXMsIFR5cGVzLkZhaWwpXG4gICAgdGhpcy5wYXRoID0gcGF0aFxuICAgIHRoaXMuZXJyb3IgPSBlcnJvclxuICAgIHRoaXMuZHVyYXRpb24gPSBkdXJhdGlvblxuICAgIHRoaXMuc2xvdyA9IHNsb3dcbn1cbm1ldGhvZHMoRmFpbFJlcG9ydCwgUmVwb3J0LCB7XG4gICAgLyoqXG4gICAgICogU28gdXRpbC5pbnNwZWN0IHByb3ZpZGVzIG1vcmUgc2Vuc2libGUgb3V0cHV0IGZvciB0ZXN0aW5nL2V0Yy5cbiAgICAgKi9cbiAgICBpbnNwZWN0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgZnVuY3Rpb24gRmFpbFJlcG9ydChyZXBvcnQpIHtcbiAgICAgICAgICAgIGluaXRJbnNwZWN0KHRoaXMsIHJlcG9ydClcbiAgICAgICAgfSh0aGlzKVxuICAgIH0sXG59KVxuXG5leHBvcnRzLlNraXAgPSBTa2lwUmVwb3J0XG5mdW5jdGlvbiBTa2lwUmVwb3J0KHBhdGgpIHtcbiAgICBSZXBvcnQuY2FsbCh0aGlzLCBUeXBlcy5Ta2lwKVxuICAgIHRoaXMucGF0aCA9IHBhdGhcbn1cbm1ldGhvZHMoU2tpcFJlcG9ydCwgUmVwb3J0LCB7XG4gICAgLyoqXG4gICAgICogU28gdXRpbC5pbnNwZWN0IHByb3ZpZGVzIG1vcmUgc2Vuc2libGUgb3V0cHV0IGZvciB0ZXN0aW5nL2V0Yy5cbiAgICAgKi9cbiAgICBpbnNwZWN0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgZnVuY3Rpb24gU2tpcFJlcG9ydChyZXBvcnQpIHtcbiAgICAgICAgICAgIGluaXRJbnNwZWN0KHRoaXMsIHJlcG9ydClcbiAgICAgICAgfSh0aGlzKVxuICAgIH0sXG59KVxuXG5leHBvcnRzLkVuZCA9IEVuZFJlcG9ydFxuZnVuY3Rpb24gRW5kUmVwb3J0KCkge1xuICAgIFJlcG9ydC5jYWxsKHRoaXMsIFR5cGVzLkVuZClcbn1cbm1ldGhvZHMoRW5kUmVwb3J0LCBSZXBvcnQsIHtcbiAgICAvKipcbiAgICAgKiBTbyB1dGlsLmluc3BlY3QgcHJvdmlkZXMgbW9yZSBzZW5zaWJsZSBvdXRwdXQgZm9yIHRlc3RpbmcvZXRjLlxuICAgICAqL1xuICAgIGluc3BlY3Q6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBmdW5jdGlvbiBFbmRSZXBvcnQocmVwb3J0KSB7XG4gICAgICAgICAgICBpbml0SW5zcGVjdCh0aGlzLCByZXBvcnQpXG4gICAgICAgIH0odGhpcylcbiAgICB9LFxufSlcblxuZXhwb3J0cy5FcnJvciA9IEVycm9yUmVwb3J0XG5mdW5jdGlvbiBFcnJvclJlcG9ydChlcnJvcikge1xuICAgIFJlcG9ydC5jYWxsKHRoaXMsIFR5cGVzLkVycm9yKVxuICAgIHRoaXMuZXJyb3IgPSBlcnJvclxufVxubWV0aG9kcyhFcnJvclJlcG9ydCwgUmVwb3J0LCB7XG4gICAgLyoqXG4gICAgICogU28gdXRpbC5pbnNwZWN0IHByb3ZpZGVzIG1vcmUgc2Vuc2libGUgb3V0cHV0IGZvciB0ZXN0aW5nL2V0Yy5cbiAgICAgKi9cbiAgICBpbnNwZWN0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgZnVuY3Rpb24gRXJyb3JSZXBvcnQocmVwb3J0KSB7XG4gICAgICAgICAgICBpbml0SW5zcGVjdCh0aGlzLCByZXBvcnQpXG4gICAgICAgIH0odGhpcylcbiAgICB9LFxufSlcblxudmFyIEhvb2tNZXRob2RzID0ge1xuICAgIGdldCBzdGFnZSgpIHtcbiAgICAgICAgc3dpdGNoICh0aGlzLl8pIHtcbiAgICAgICAgY2FzZSBUeXBlcy5CZWZvcmVBbGw6IHJldHVybiBcImJlZm9yZSBhbGxcIlxuICAgICAgICBjYXNlIFR5cGVzLkJlZm9yZUVhY2g6IHJldHVybiBcImJlZm9yZSBlYWNoXCJcbiAgICAgICAgY2FzZSBUeXBlcy5BZnRlckVhY2g6IHJldHVybiBcImFmdGVyIGVhY2hcIlxuICAgICAgICBjYXNlIFR5cGVzLkFmdGVyQWxsOiByZXR1cm4gXCJhZnRlciBhbGxcIlxuICAgICAgICBkZWZhdWx0OiB0aHJvdyBuZXcgRXJyb3IoXCJ1bnJlYWNoYWJsZVwiKVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIGdldCBpc0JlZm9yZUFsbCgpIHsgcmV0dXJuIHRoaXMuXyA9PT0gVHlwZXMuQmVmb3JlQWxsIH0sXG4gICAgZ2V0IGlzQmVmb3JlRWFjaCgpIHsgcmV0dXJuIHRoaXMuXyA9PT0gVHlwZXMuQmVmb3JlRWFjaCB9LFxuICAgIGdldCBpc0FmdGVyRWFjaCgpIHsgcmV0dXJuIHRoaXMuXyA9PT0gVHlwZXMuQWZ0ZXJFYWNoIH0sXG4gICAgZ2V0IGlzQWZ0ZXJBbGwoKSB7IHJldHVybiB0aGlzLl8gPT09IFR5cGVzLkFmdGVyQWxsIH0sXG59XG5cbmV4cG9ydHMuSG9va0Vycm9yID0gSG9va0Vycm9yXG5mdW5jdGlvbiBIb29rRXJyb3Ioc3RhZ2UsIGZ1bmMsIGVycm9yKSB7XG4gICAgdGhpcy5fID0gc3RhZ2VcbiAgICB0aGlzLm5hbWUgPSBmdW5jLm5hbWUgfHwgZnVuYy5kaXNwbGF5TmFtZSB8fCBcIlwiXG4gICAgdGhpcy5lcnJvciA9IGVycm9yXG59XG5tZXRob2RzKEhvb2tFcnJvciwgSG9va01ldGhvZHMpXG5cbmV4cG9ydHMuSG9vayA9IEhvb2tSZXBvcnRcbmZ1bmN0aW9uIEhvb2tSZXBvcnQocGF0aCwgcm9vdFBhdGgsIGhvb2tFcnJvcikge1xuICAgIFJlcG9ydC5jYWxsKHRoaXMsIGhvb2tFcnJvci5fKVxuICAgIHRoaXMucGF0aCA9IHBhdGhcbiAgICB0aGlzLnJvb3RQYXRoID0gcm9vdFBhdGhcbiAgICB0aGlzLm5hbWUgPSBob29rRXJyb3IubmFtZVxuICAgIHRoaXMuZXJyb3IgPSBob29rRXJyb3IuZXJyb3Jcbn1cbm1ldGhvZHMoSG9va1JlcG9ydCwgUmVwb3J0LCBIb29rTWV0aG9kcywge1xuICAgIGdldCBob29rRXJyb3IoKSB7IHJldHVybiBuZXcgSG9va0Vycm9yKHRoaXMuXywgdGhpcywgdGhpcy5lcnJvcikgfSxcbn0pXG4iLCJcInVzZSBzdHJpY3RcIlxuXG52YXIgbWV0aG9kcyA9IHJlcXVpcmUoXCIuLi9tZXRob2RzXCIpXG52YXIgcGVhY2ggPSByZXF1aXJlKFwiLi4vdXRpbFwiKS5wZWFjaFxudmFyIFJlcG9ydHMgPSByZXF1aXJlKFwiLi9yZXBvcnRzXCIpXG52YXIgaXNPbmx5ID0gcmVxdWlyZShcIi4vb25seVwiKS5pc09ubHlcbnZhciBUeXBlcyA9IFJlcG9ydHMuVHlwZXNcblxuLyoqXG4gKiBUaGUgdGVzdHMgYXJlIGxhaWQgb3V0IGluIGEgdmVyeSBkYXRhLWRyaXZlbiBkZXNpZ24uIFdpdGggZXhjZXB0aW9uIG9mIHRoZVxuICogcmVwb3J0cywgdGhlcmUgaXMgbWluaW1hbCBvYmplY3Qgb3JpZW50YXRpb24gYW5kIHplcm8gdmlydHVhbCBkaXNwYXRjaC5cbiAqIEhlcmUncyBhIHF1aWNrIG92ZXJ2aWV3OlxuICpcbiAqIC0gVGhlIHRlc3QgaGFuZGxpbmcgZGlzcGF0Y2hlcyBiYXNlZCBvbiB2YXJpb3VzIGF0dHJpYnV0ZXMgdGhlIHRlc3QgaGFzLiBGb3JcbiAqICAgZXhhbXBsZSwgcm9vdHMgYXJlIGtub3duIGJ5IGEgY2lyY3VsYXIgcm9vdCByZWZlcmVuY2UsIGFuZCBza2lwcGVkIHRlc3RzXG4gKiAgIGFyZSBrbm93biBieSBub3QgaGF2aW5nIGEgY2FsbGJhY2suXG4gKlxuICogLSBUaGUgdGVzdCBldmFsdWF0aW9uIGlzIHZlcnkgcHJvY2VkdXJhbC4gQWx0aG91Z2ggaXQncyB2ZXJ5IGhpZ2hseVxuICogICBhc3luY2hyb25vdXMsIHRoZSB1c2Ugb2YgcHJvbWlzZXMgbGluZWFyaXplIHRoZSBsb2dpYywgc28gaXQgcmVhZHMgdmVyeVxuICogICBtdWNoIGxpa2UgYSByZWN1cnNpdmUgc2V0IG9mIHN0ZXBzLlxuICpcbiAqIC0gVGhlIGRhdGEgdHlwZXMgYXJlIG1vc3RseSBlaXRoZXIgcGxhaW4gb2JqZWN0cyBvciBjbGFzc2VzIHdpdGggbm8gbWV0aG9kcyxcbiAqICAgdGhlIGxhdHRlciBtb3N0bHkgZm9yIGRlYnVnZ2luZyBoZWxwLiBUaGlzIGFsc28gYXZvaWRzIG1vc3Qgb2YgdGhlXG4gKiAgIGluZGlyZWN0aW9uIHJlcXVpcmVkIHRvIGFjY29tbW9kYXRlIGJyZWFraW5nIGFic3RyYWN0aW9ucywgd2hpY2ggdGhlIEFQSVxuICogICBtZXRob2RzIGZyZXF1ZW50bHkgbmVlZCB0byBkby5cbiAqL1xuXG4vLyBQcmV2ZW50IFNpbm9uIGludGVyZmVyZW5jZSB3aGVuIHRoZXkgaW5zdGFsbCB0aGVpciBtb2Nrc1xudmFyIHNldFRpbWVvdXQgPSBnbG9iYWwuc2V0VGltZW91dFxudmFyIGNsZWFyVGltZW91dCA9IGdsb2JhbC5jbGVhclRpbWVvdXRcbnZhciBub3cgPSBnbG9iYWwuRGF0ZS5ub3dcblxuLyoqXG4gKiBCYXNpYyBkYXRhIHR5cGVzXG4gKi9cbmZ1bmN0aW9uIFJlc3VsdCh0aW1lLCBhdHRlbXB0KSB7XG4gICAgdGhpcy50aW1lID0gdGltZVxuICAgIHRoaXMuY2F1Z2h0ID0gYXR0ZW1wdC5jYXVnaHRcbiAgICB0aGlzLnZhbHVlID0gYXR0ZW1wdC5jYXVnaHQgPyBhdHRlbXB0LnZhbHVlIDogdW5kZWZpbmVkXG59XG5cbi8qKlxuICogT3ZlcnZpZXcgb2YgdGhlIHRlc3QgcHJvcGVydGllczpcbiAqXG4gKiAtIGBtZXRob2RzYCAtIEEgZGVwcmVjYXRlZCByZWZlcmVuY2UgdG8gdGhlIEFQSSBtZXRob2RzXG4gKiAtIGByb290YCAtIFRoZSByb290IHRlc3RcbiAqIC0gYHJlcG9ydGVyc2AgLSBUaGUgbGlzdCBvZiByZXBvcnRlcnNcbiAqIC0gYGN1cnJlbnRgIC0gQSByZWZlcmVuY2UgdG8gdGhlIGN1cnJlbnRseSBhY3RpdmUgdGVzdFxuICogLSBgdGltZW91dGAgLSBUaGUgdGVzdHMncyB0aW1lb3V0LCBvciAwIGlmIGluaGVyaXRlZFxuICogLSBgc2xvd2AgLSBUaGUgdGVzdHMncyBzbG93IHRocmVzaG9sZFxuICogLSBgbmFtZWAgLSBUaGUgdGVzdCdzIG5hbWVcbiAqIC0gYGluZGV4YCAtIFRoZSB0ZXN0J3MgaW5kZXhcbiAqIC0gYHBhcmVudGAgLSBUaGUgdGVzdCdzIHBhcmVudFxuICogLSBgY2FsbGJhY2tgIC0gVGhlIHRlc3QncyBjYWxsYmFja1xuICogLSBgdGVzdHNgIC0gVGhlIHRlc3QncyBjaGlsZCB0ZXN0c1xuICogLSBgYmVmb3JlQWxsYCwgYGJlZm9yZUVhY2hgLCBgYWZ0ZXJFYWNoYCwgYGFmdGVyQWxsYCAtIFRoZSB0ZXN0J3MgdmFyaW91c1xuICogICBzY2hlZHVsZWQgaG9va3NcbiAqXG4gKiBNYW55IG9mIHRoZXNlIHByb3BlcnRpZXMgYXJlbid0IHByZXNlbnQgb24gaW5pdGlhbGl6YXRpb24gdG8gc2F2ZSBtZW1vcnkuXG4gKi9cblxuLy8gVE9ETzogcmVtb3ZlIGB0ZXN0Lm1ldGhvZHNgIGluIDAuNFxuZnVuY3Rpb24gTm9ybWFsKG5hbWUsIGluZGV4LCBwYXJlbnQsIGNhbGxiYWNrKSB7XG4gICAgdmFyIGNoaWxkID0gT2JqZWN0LmNyZWF0ZShwYXJlbnQubWV0aG9kcylcblxuICAgIGNoaWxkLl8gPSB0aGlzXG4gICAgdGhpcy5tZXRob2RzID0gY2hpbGRcbiAgICB0aGlzLmxvY2tlZCA9IHRydWVcbiAgICB0aGlzLnJvb3QgPSBwYXJlbnQucm9vdFxuICAgIHRoaXMubmFtZSA9IG5hbWVcbiAgICB0aGlzLmluZGV4ID0gaW5kZXh8MFxuICAgIHRoaXMucGFyZW50ID0gcGFyZW50XG4gICAgdGhpcy5jYWxsYmFjayA9IGNhbGxiYWNrXG59XG5cbmZ1bmN0aW9uIFNraXBwZWQobmFtZSwgaW5kZXgsIHBhcmVudCkge1xuICAgIHRoaXMubG9ja2VkID0gdHJ1ZVxuICAgIHRoaXMucm9vdCA9IHBhcmVudC5yb290XG4gICAgdGhpcy5uYW1lID0gbmFtZVxuICAgIHRoaXMuaW5kZXggPSBpbmRleHwwXG4gICAgdGhpcy5wYXJlbnQgPSBwYXJlbnRcbn1cblxuLy8gVE9ETzogcmVtb3ZlIGB0ZXN0Lm1ldGhvZHNgIGluIDAuNFxuZnVuY3Rpb24gUm9vdChtZXRob2RzKSB7XG4gICAgdGhpcy5sb2NrZWQgPSBmYWxzZVxuICAgIHRoaXMubWV0aG9kcyA9IG1ldGhvZHNcbiAgICB0aGlzLnJlcG9ydGVySWRzID0gW11cbiAgICB0aGlzLnJlcG9ydGVycyA9IFtdXG4gICAgdGhpcy5jdXJyZW50ID0gdGhpc1xuICAgIHRoaXMucm9vdCA9IHRoaXNcbiAgICB0aGlzLnRpbWVvdXQgPSAwXG4gICAgdGhpcy5zbG93ID0gMFxufVxuXG4vKipcbiAqIEJhc2UgdGVzdHMgKGkuZS4gZGVmYXVsdCBleHBvcnQsIHJlc3VsdCBvZiBgaW50ZXJuYWwucm9vdCgpYCkuXG4gKi9cblxuZXhwb3J0cy5jcmVhdGVSb290ID0gZnVuY3Rpb24gKG1ldGhvZHMpIHtcbiAgICByZXR1cm4gbmV3IFJvb3QobWV0aG9kcylcbn1cblxuLyoqXG4gKiBTZXQgdXAgZWFjaCB0ZXN0IHR5cGUuXG4gKi9cblxuLyoqXG4gKiBBIG5vcm1hbCB0ZXN0IHRocm91Z2ggYHQudGVzdCgpYC5cbiAqL1xuXG5leHBvcnRzLmFkZE5vcm1hbCA9IGZ1bmN0aW9uIChwYXJlbnQsIG5hbWUsIGNhbGxiYWNrKSB7XG4gICAgdmFyIGluZGV4ID0gcGFyZW50LnRlc3RzICE9IG51bGwgPyBwYXJlbnQudGVzdHMubGVuZ3RoIDogMFxuICAgIHZhciBiYXNlID0gbmV3IE5vcm1hbChuYW1lLCBpbmRleCwgcGFyZW50LCBjYWxsYmFjaylcblxuICAgIGlmIChpbmRleCkge1xuICAgICAgICBwYXJlbnQudGVzdHMucHVzaChiYXNlKVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHBhcmVudC50ZXN0cyA9IFtiYXNlXVxuICAgIH1cbn1cblxuLyoqXG4gKiBBIHNraXBwZWQgdGVzdCB0aHJvdWdoIGB0LnRlc3RTa2lwKClgLlxuICovXG5leHBvcnRzLmFkZFNraXBwZWQgPSBmdW5jdGlvbiAocGFyZW50LCBuYW1lKSB7XG4gICAgdmFyIGluZGV4ID0gcGFyZW50LnRlc3RzICE9IG51bGwgPyBwYXJlbnQudGVzdHMubGVuZ3RoIDogMFxuICAgIHZhciBiYXNlID0gbmV3IFNraXBwZWQobmFtZSwgaW5kZXgsIHBhcmVudClcblxuICAgIGlmIChpbmRleCkge1xuICAgICAgICBwYXJlbnQudGVzdHMucHVzaChiYXNlKVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHBhcmVudC50ZXN0cyA9IFtiYXNlXVxuICAgIH1cbn1cblxuLyoqXG4gKiBFeGVjdXRlIHRoZSB0ZXN0c1xuICovXG5cbmZ1bmN0aW9uIHBhdGgodGVzdCkge1xuICAgIHZhciByZXQgPSBbXVxuXG4gICAgd2hpbGUgKHRlc3Qucm9vdCAhPT0gdGVzdCkge1xuICAgICAgICByZXQucHVzaCh7bmFtZTogdGVzdC5uYW1lLCBpbmRleDogdGVzdC5pbmRleHwwfSlcbiAgICAgICAgdGVzdCA9IHRlc3QucGFyZW50XG4gICAgfVxuXG4gICAgcmV0dXJuIHJldC5yZXZlcnNlKClcbn1cblxuLy8gTm90ZSB0aGF0IGEgdGltZW91dCBvZiAwIG1lYW5zIHRvIGluaGVyaXQgdGhlIHBhcmVudC5cbmV4cG9ydHMudGltZW91dCA9IHRpbWVvdXRcbmZ1bmN0aW9uIHRpbWVvdXQodGVzdCkge1xuICAgIHdoaWxlICghdGVzdC50aW1lb3V0ICYmIHRlc3Qucm9vdCAhPT0gdGVzdCkge1xuICAgICAgICB0ZXN0ID0gdGVzdC5wYXJlbnRcbiAgICB9XG5cbiAgICByZXR1cm4gdGVzdC50aW1lb3V0IHx8IDIwMDAgLy8gbXMgLSBkZWZhdWx0IHRpbWVvdXRcbn1cblxuLy8gTm90ZSB0aGF0IGEgc2xvd25lc3MgdGhyZXNob2xkIG9mIDAgbWVhbnMgdG8gaW5oZXJpdCB0aGUgcGFyZW50LlxuZXhwb3J0cy5zbG93ID0gc2xvd1xuZnVuY3Rpb24gc2xvdyh0ZXN0KSB7XG4gICAgd2hpbGUgKCF0ZXN0LnNsb3cgJiYgdGVzdC5yb290ICE9PSB0ZXN0KSB7XG4gICAgICAgIHRlc3QgPSB0ZXN0LnBhcmVudFxuICAgIH1cblxuICAgIHJldHVybiB0ZXN0LnNsb3cgfHwgNzUgLy8gbXMgLSBkZWZhdWx0IHNsb3cgdGhyZXNob2xkXG59XG5cbmZ1bmN0aW9uIHJlcG9ydCh0ZXN0LCB0eXBlLCBhcmcxLCBhcmcyKSB7XG4gICAgZnVuY3Rpb24gaW52b2tlUmVwb3J0ZXIocmVwb3J0ZXIpIHtcbiAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgIGNhc2UgVHlwZXMuU3RhcnQ6XG4gICAgICAgICAgICByZXR1cm4gcmVwb3J0ZXIobmV3IFJlcG9ydHMuU3RhcnQoKSlcblxuICAgICAgICBjYXNlIFR5cGVzLkVudGVyOlxuICAgICAgICAgICAgcmV0dXJuIHJlcG9ydGVyKG5ldyBSZXBvcnRzLkVudGVyKHBhdGgodGVzdCksIGFyZzEsIHNsb3codGVzdCkpKVxuXG4gICAgICAgIGNhc2UgVHlwZXMuTGVhdmU6XG4gICAgICAgICAgICByZXR1cm4gcmVwb3J0ZXIobmV3IFJlcG9ydHMuTGVhdmUocGF0aCh0ZXN0KSkpXG5cbiAgICAgICAgY2FzZSBUeXBlcy5QYXNzOlxuICAgICAgICAgICAgcmV0dXJuIHJlcG9ydGVyKG5ldyBSZXBvcnRzLlBhc3MocGF0aCh0ZXN0KSwgYXJnMSwgc2xvdyh0ZXN0KSkpXG5cbiAgICAgICAgY2FzZSBUeXBlcy5GYWlsOlxuICAgICAgICAgICAgcmV0dXJuIHJlcG9ydGVyKFxuICAgICAgICAgICAgICAgIG5ldyBSZXBvcnRzLkZhaWwocGF0aCh0ZXN0KSwgYXJnMSwgYXJnMiwgc2xvdyh0ZXN0KSkpXG5cbiAgICAgICAgY2FzZSBUeXBlcy5Ta2lwOlxuICAgICAgICAgICAgcmV0dXJuIHJlcG9ydGVyKG5ldyBSZXBvcnRzLlNraXAocGF0aCh0ZXN0KSkpXG5cbiAgICAgICAgY2FzZSBUeXBlcy5FbmQ6XG4gICAgICAgICAgICByZXR1cm4gcmVwb3J0ZXIobmV3IFJlcG9ydHMuRW5kKCkpXG5cbiAgICAgICAgY2FzZSBUeXBlcy5FcnJvcjpcbiAgICAgICAgICAgIHJldHVybiByZXBvcnRlcihuZXcgUmVwb3J0cy5FcnJvcihhcmcxKSlcblxuICAgICAgICBjYXNlIFR5cGVzLkhvb2s6XG4gICAgICAgICAgICByZXR1cm4gcmVwb3J0ZXIobmV3IFJlcG9ydHMuSG9vayhwYXRoKHRlc3QpLCBwYXRoKGFyZzEpLCBhcmcyKSlcblxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcInVucmVhY2hhYmxlXCIpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKClcbiAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0ZXN0LnJvb3QucmVwb3J0ZXIgPT0gbnVsbCkgcmV0dXJuIHVuZGVmaW5lZFxuICAgICAgICByZXR1cm4gaW52b2tlUmVwb3J0ZXIodGVzdC5yb290LnJlcG9ydGVyKVxuICAgIH0pXG4gICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgcmVwb3J0ZXJzID0gdGVzdC5yb290LnJlcG9ydGVyc1xuXG4gICAgICAgIC8vIFR3byBlYXN5IGNhc2VzLlxuICAgICAgICBpZiAocmVwb3J0ZXJzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHVuZGVmaW5lZFxuICAgICAgICBpZiAocmVwb3J0ZXJzLmxlbmd0aCA9PT0gMSkgcmV0dXJuIGludm9rZVJlcG9ydGVyKHJlcG9ydGVyc1swXSlcbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHJlcG9ydGVycy5tYXAoaW52b2tlUmVwb3J0ZXIpKVxuICAgIH0pXG59XG5cbi8qKlxuICogTm9ybWFsIHRlc3RzXG4gKi9cblxuLy8gUGhhbnRvbUpTIGFuZCBJRSBkb24ndCBhZGQgdGhlIHN0YWNrIHVudGlsIGl0J3MgdGhyb3duLiBJbiBmYWlsaW5nIGFzeW5jXG4vLyB0ZXN0cywgaXQncyBhbHJlYWR5IHRocm93biBpbiBhIHNlbnNlLCBzbyB0aGlzIHNob3VsZCBiZSBub3JtYWxpemVkIHdpdGhcbi8vIG90aGVyIHRlc3QgdHlwZXMuXG52YXIgbXVzdEFkZFN0YWNrID0gdHlwZW9mIG5ldyBFcnJvcigpLnN0YWNrICE9PSBcInN0cmluZ1wiXG5cbmZ1bmN0aW9uIGFkZFN0YWNrKGUpIHtcbiAgICB0cnkgeyB0aHJvdyBlIH0gZmluYWxseSB7IHJldHVybiBlIH1cbn1cblxuZnVuY3Rpb24gZ2V0VGhlbihyZXMpIHtcbiAgICBpZiAodHlwZW9mIHJlcyA9PT0gXCJvYmplY3RcIiB8fCB0eXBlb2YgcmVzID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgcmV0dXJuIHJlcy50aGVuXG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuICAgIH1cbn1cblxuZnVuY3Rpb24gQXN5bmNTdGF0ZShzdGFydCwgcmVzb2x2ZSkge1xuICAgIHRoaXMuc3RhcnQgPSBzdGFydFxuICAgIHRoaXMucmVzb2x2ZSA9IHJlc29sdmVcbiAgICB0aGlzLnJlc29sdmVkID0gZmFsc2VcbiAgICB0aGlzLnRpbWVyID0gdW5kZWZpbmVkXG59XG5cbmZ1bmN0aW9uIGFzeW5jRmluaXNoKHN0YXRlLCBhdHRlbXB0KSB7XG4gICAgLy8gQ2FwdHVyZSBpbW1lZGlhdGVseS4gV29yc3QgY2FzZSBzY2VuYXJpbywgaXQgZ2V0cyB0aHJvd24gYXdheS5cbiAgICB2YXIgZW5kID0gbm93KClcblxuICAgIGlmIChzdGF0ZS5yZXNvbHZlZCkgcmV0dXJuXG4gICAgaWYgKHN0YXRlLnRpbWVyKSB7XG4gICAgICAgIGNsZWFyVGltZW91dC5jYWxsKGdsb2JhbCwgc3RhdGUudGltZXIpXG4gICAgICAgIHN0YXRlLnRpbWVyID0gdW5kZWZpbmVkXG4gICAgfVxuXG4gICAgc3RhdGUucmVzb2x2ZWQgPSB0cnVlXG4gICAgc3RhdGUucmVzb2x2ZShuZXcgUmVzdWx0KGVuZCAtIHN0YXRlLnN0YXJ0LCBhdHRlbXB0KSlcbn1cblxuLy8gQXZvaWQgYSBjbG9zdXJlIGlmIHBvc3NpYmxlLCBpbiBjYXNlIGl0IGRvZXNuJ3QgcmV0dXJuIGEgdGhlbmFibGUuXG5mdW5jdGlvbiBpbnZva2VJbml0KHRlc3QpIHtcbiAgICB2YXIgc3RhcnQgPSBub3coKVxuICAgIHZhciB0cnlCb2R5ID0gdHJ5MSh0ZXN0LmNhbGxiYWNrLCB0ZXN0Lm1ldGhvZHMsIHRlc3QubWV0aG9kcylcblxuICAgIC8vIE5vdGU6IHN5bmNocm9ub3VzIGZhaWx1cmVzIGFyZSB0ZXN0IGZhaWx1cmVzLCBub3QgZmF0YWwgZXJyb3JzLlxuICAgIGlmICh0cnlCb2R5LmNhdWdodCkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG5ldyBSZXN1bHQobm93KCkgLSBzdGFydCwgdHJ5Qm9keSkpXG4gICAgfVxuXG4gICAgdmFyIHRyeVRoZW4gPSB0cnkxKGdldFRoZW4sIHVuZGVmaW5lZCwgdHJ5Qm9keS52YWx1ZSlcblxuICAgIGlmICh0cnlUaGVuLmNhdWdodCB8fCB0eXBlb2YgdHJ5VGhlbi52YWx1ZSAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobmV3IFJlc3VsdChub3coKSAtIHN0YXJ0LCB0cnlUaGVuKSlcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUpIHtcbiAgICAgICAgdmFyIHN0YXRlID0gbmV3IEFzeW5jU3RhdGUoc3RhcnQsIHJlc29sdmUpXG4gICAgICAgIHZhciByZXN1bHQgPSB0cnkyKHRyeVRoZW4udmFsdWUsIHRyeUJvZHkudmFsdWUsXG4gICAgICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXRlID09IG51bGwpIHJldHVyblxuICAgICAgICAgICAgICAgIGFzeW5jRmluaXNoKHN0YXRlLCB0cnlQYXNzKCkpXG4gICAgICAgICAgICAgICAgc3RhdGUgPSB1bmRlZmluZWRcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgIGlmIChzdGF0ZSA9PSBudWxsKSByZXR1cm5cbiAgICAgICAgICAgICAgICBhc3luY0ZpbmlzaChzdGF0ZSwgdHJ5RmFpbChcbiAgICAgICAgICAgICAgICAgICAgbXVzdEFkZFN0YWNrIHx8IGUgaW5zdGFuY2VvZiBFcnJvciAmJiBlLnN0YWNrID09IG51bGxcbiAgICAgICAgICAgICAgICAgICAgICAgID8gYWRkU3RhY2soZSkgOiBlKSlcbiAgICAgICAgICAgICAgICBzdGF0ZSA9IHVuZGVmaW5lZFxuICAgICAgICAgICAgfSlcblxuICAgICAgICBpZiAocmVzdWx0LmNhdWdodCkge1xuICAgICAgICAgICAgYXN5bmNGaW5pc2goc3RhdGUsIHJlc3VsdClcbiAgICAgICAgICAgIHN0YXRlID0gdW5kZWZpbmVkXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFNldCB0aGUgdGltZW91dCAqYWZ0ZXIqIGluaXRpYWxpemF0aW9uLiBUaGUgdGltZW91dCB3aWxsIGxpa2VseSBiZVxuICAgICAgICAvLyBzcGVjaWZpZWQgZHVyaW5nIGluaXRpYWxpemF0aW9uLlxuICAgICAgICB2YXIgbWF4VGltZW91dCA9IHRpbWVvdXQodGVzdClcblxuICAgICAgICAvLyBTZXR0aW5nIGEgdGltZW91dCBpcyBwb2ludGxlc3MgaWYgaXQncyBpbmZpbml0ZS5cbiAgICAgICAgaWYgKG1heFRpbWVvdXQgIT09IEluZmluaXR5KSB7XG4gICAgICAgICAgICBzdGF0ZS50aW1lciA9IHNldFRpbWVvdXQuY2FsbChnbG9iYWwsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3RhdGUgPT0gbnVsbCkgcmV0dXJuXG4gICAgICAgICAgICAgICAgYXN5bmNGaW5pc2goc3RhdGUsIHRyeUZhaWwoYWRkU3RhY2soXG4gICAgICAgICAgICAgICAgICAgIG5ldyBFcnJvcihcIlRpbWVvdXQgb2YgXCIgKyBtYXhUaW1lb3V0ICsgXCIgcmVhY2hlZFwiKSkpKVxuICAgICAgICAgICAgICAgIHN0YXRlID0gdW5kZWZpbmVkXG4gICAgICAgICAgICB9LCBtYXhUaW1lb3V0KVxuICAgICAgICB9XG4gICAgfSlcbn1cblxuZnVuY3Rpb24gRXJyb3JXcmFwKHRlc3QsIGVycm9yKSB7XG4gICAgdGhpcy50ZXN0ID0gdGVzdFxuICAgIHRoaXMuZXJyb3IgPSBlcnJvclxufVxubWV0aG9kcyhFcnJvcldyYXAsIEVycm9yLCB7bmFtZTogXCJFcnJvcldyYXBcIn0pXG5cbmZ1bmN0aW9uIGludm9rZUhvb2sodGVzdCwgbGlzdCwgc3RhZ2UpIHtcbiAgICBpZiAobGlzdCA9PSBudWxsKSByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKClcbiAgICByZXR1cm4gcGVhY2gobGlzdCwgZnVuY3Rpb24gKGhvb2spIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiBob29rKClcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yV3JhcCh0ZXN0LCBuZXcgUmVwb3J0cy5Ib29rRXJyb3Ioc3RhZ2UsIGhvb2ssIGUpKVxuICAgICAgICB9XG4gICAgfSlcbn1cblxuZnVuY3Rpb24gaW52b2tlQmVmb3JlRWFjaCh0ZXN0KSB7XG4gICAgaWYgKHRlc3Qucm9vdCA9PT0gdGVzdCkge1xuICAgICAgICByZXR1cm4gaW52b2tlSG9vayh0ZXN0LCB0ZXN0LmJlZm9yZUVhY2gsIFR5cGVzLkJlZm9yZUVhY2gpXG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGludm9rZUJlZm9yZUVhY2godGVzdC5wYXJlbnQpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGludm9rZUhvb2sodGVzdCwgdGVzdC5iZWZvcmVFYWNoLCBUeXBlcy5CZWZvcmVFYWNoKVxuICAgICAgICB9KVxuICAgIH1cbn1cblxuZnVuY3Rpb24gaW52b2tlQWZ0ZXJFYWNoKHRlc3QpIHtcbiAgICBpZiAodGVzdC5yb290ID09PSB0ZXN0KSB7XG4gICAgICAgIHJldHVybiBpbnZva2VIb29rKHRlc3QsIHRlc3QuYWZ0ZXJFYWNoLCBUeXBlcy5BZnRlckVhY2gpXG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGludm9rZUhvb2sodGVzdCwgdGVzdC5hZnRlckVhY2gsIFR5cGVzLkFmdGVyRWFjaClcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gaW52b2tlQWZ0ZXJFYWNoKHRlc3QucGFyZW50KSB9KVxuICAgIH1cbn1cblxuZnVuY3Rpb24gcnVuQ2hpbGRUZXN0cyh0ZXN0KSB7XG4gICAgaWYgKHRlc3QudGVzdHMgPT0gbnVsbCkgcmV0dXJuIHVuZGVmaW5lZFxuXG4gICAgZnVuY3Rpb24gcnVuQ2hpbGQoY2hpbGQpIHtcbiAgICAgICAgcmV0dXJuIGludm9rZUJlZm9yZUVhY2godGVzdClcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gcnVuTm9ybWFsQ2hpbGQoY2hpbGQpIH0pXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIGludm9rZUFmdGVyRWFjaCh0ZXN0KSB9KVxuICAgICAgICAudGhlbihcbiAgICAgICAgICAgIGZ1bmN0aW9uICgpIHsgdGVzdC5yb290LmN1cnJlbnQgPSB0ZXN0IH0sXG4gICAgICAgICAgICBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgIHRlc3Qucm9vdC5jdXJyZW50ID0gdGVzdFxuICAgICAgICAgICAgICAgIGlmICghKGUgaW5zdGFuY2VvZiBFcnJvcldyYXApKSB0aHJvdyBlXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcG9ydChjaGlsZCwgVHlwZXMuSG9vaywgZS50ZXN0LCBlLmVycm9yKVxuICAgICAgICAgICAgfSlcbiAgICB9XG5cbiAgICB2YXIgcmFuID0gZmFsc2VcblxuICAgIGZ1bmN0aW9uIG1heWJlUnVuQ2hpbGQoY2hpbGQpIHtcbiAgICAgICAgLy8gT25seSBza2lwcGVkIHRlc3RzIGhhdmUgbm8gY2FsbGJhY2tcbiAgICAgICAgaWYgKGNoaWxkLmNhbGxiYWNrID09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiByZXBvcnQoY2hpbGQsIFR5cGVzLlNraXApXG4gICAgICAgIH0gZWxzZSBpZiAoIWlzT25seShjaGlsZCkpIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuICAgICAgICB9IGVsc2UgaWYgKHJhbikge1xuICAgICAgICAgICAgcmV0dXJuIHJ1bkNoaWxkKGNoaWxkKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmFuID0gdHJ1ZVxuICAgICAgICAgICAgcmV0dXJuIGludm9rZUhvb2sodGVzdCwgdGVzdC5iZWZvcmVBbGwsIFR5cGVzLkJlZm9yZUFsbClcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIHJ1bkNoaWxkKGNoaWxkKSB9KVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHBlYWNoKHRlc3QudGVzdHMsIGZ1bmN0aW9uIChjaGlsZCkge1xuICAgICAgICB0ZXN0LnJvb3QuY3VycmVudCA9IGNoaWxkXG4gICAgICAgIHJldHVybiBtYXliZVJ1bkNoaWxkKGNoaWxkKS50aGVuKFxuICAgICAgICAgICAgZnVuY3Rpb24gKCkgeyB0ZXN0LnJvb3QuY3VycmVudCA9IHRlc3QgfSxcbiAgICAgICAgICAgIGZ1bmN0aW9uIChlKSB7IHRlc3Qucm9vdC5jdXJyZW50ID0gdGVzdDsgdGhyb3cgZSB9KVxuICAgIH0pXG4gICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gcmFuID8gaW52b2tlSG9vayh0ZXN0LCB0ZXN0LmFmdGVyQWxsLCBUeXBlcy5BZnRlckFsbCkgOiB1bmRlZmluZWRcbiAgICB9KVxufVxuXG5mdW5jdGlvbiBjbGVhckNoaWxkcmVuKHRlc3QpIHtcbiAgICBpZiAodGVzdC50ZXN0cyA9PSBudWxsKSByZXR1cm5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRlc3QudGVzdHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgZGVsZXRlIHRlc3QudGVzdHNbaV0udGVzdHNcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHJ1bk5vcm1hbENoaWxkKHRlc3QpIHtcbiAgICB0ZXN0LmxvY2tlZCA9IGZhbHNlXG5cbiAgICByZXR1cm4gaW52b2tlSW5pdCh0ZXN0KVxuICAgIC50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgdGVzdC5sb2NrZWQgPSB0cnVlXG5cbiAgICAgICAgaWYgKHJlc3VsdC5jYXVnaHQpIHtcbiAgICAgICAgICAgIHJldHVybiByZXBvcnQodGVzdCwgVHlwZXMuRmFpbCwgcmVzdWx0LnZhbHVlLCByZXN1bHQudGltZSlcbiAgICAgICAgfSBlbHNlIGlmICh0ZXN0LnRlc3RzICE9IG51bGwpIHtcbiAgICAgICAgICAgIC8vIFJlcG9ydCB0aGlzIGFzIGlmIGl0IHdhcyBhIHBhcmVudCB0ZXN0IGlmIGl0J3MgcGFzc2luZyBhbmQgaGFzXG4gICAgICAgICAgICAvLyBjaGlsZHJlbi5cbiAgICAgICAgICAgIHJldHVybiByZXBvcnQodGVzdCwgVHlwZXMuRW50ZXIsIHJlc3VsdC50aW1lKVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gcnVuQ2hpbGRUZXN0cyh0ZXN0KSB9KVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gcmVwb3J0KHRlc3QsIFR5cGVzLkxlYXZlKSB9KVxuICAgICAgICAgICAgLmNhdGNoKGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgaWYgKCEoZSBpbnN0YW5jZW9mIEVycm9yV3JhcCkpIHRocm93IGVcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVwb3J0KHRlc3QsIFR5cGVzLkxlYXZlKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcG9ydCh0ZXN0LCBUeXBlcy5Ib29rLCBlLnRlc3QsIGUuZXJyb3IpXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gcmVwb3J0KHRlc3QsIFR5cGVzLlBhc3MsIHJlc3VsdC50aW1lKVxuICAgICAgICB9XG4gICAgfSlcbiAgICAudGhlbihcbiAgICAgICAgZnVuY3Rpb24gKCkgeyBjbGVhckNoaWxkcmVuKHRlc3QpIH0sXG4gICAgICAgIGZ1bmN0aW9uIChlKSB7IGNsZWFyQ2hpbGRyZW4odGVzdCk7IHRocm93IGUgfSlcbn1cblxuLyoqXG4gKiBUaGlzIHJ1bnMgdGhlIHJvb3QgdGVzdCBhbmQgcmV0dXJucyBhIHByb21pc2UgcmVzb2x2ZWQgd2hlbiBpdCdzIGRvbmUuXG4gKi9cbmV4cG9ydHMucnVuVGVzdCA9IGZ1bmN0aW9uICh0ZXN0KSB7XG4gICAgdGVzdC5sb2NrZWQgPSB0cnVlXG5cbiAgICByZXR1cm4gcmVwb3J0KHRlc3QsIFR5cGVzLlN0YXJ0KVxuICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIHJ1bkNoaWxkVGVzdHModGVzdCkgfSlcbiAgICAuY2F0Y2goZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgaWYgKCEoZSBpbnN0YW5jZW9mIEVycm9yV3JhcCkpIHRocm93IGVcbiAgICAgICAgcmV0dXJuIHJlcG9ydCh0ZXN0LCBUeXBlcy5Ib29rLCBlLnRlc3QsIGUuZXJyb3IpXG4gICAgfSlcbiAgICAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiByZXBvcnQodGVzdCwgVHlwZXMuRW5kKSB9KVxuICAgIC8vIFRlbGwgdGhlIHJlcG9ydGVyIHNvbWV0aGluZyBoYXBwZW5lZC4gT3RoZXJ3aXNlLCBpdCdsbCBoYXZlIHRvIHdyYXAgdGhpc1xuICAgIC8vIG1ldGhvZCBpbiBhIHBsdWdpbiwgd2hpY2ggc2hvdWxkbid0IGJlIG5lY2Vzc2FyeS5cbiAgICAuY2F0Y2goZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgcmV0dXJuIHJlcG9ydCh0ZXN0LCBUeXBlcy5FcnJvciwgZSkudGhlbihmdW5jdGlvbiAoKSB7IHRocm93IGUgfSlcbiAgICB9KVxuICAgIC50aGVuKFxuICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjbGVhckNoaWxkcmVuKHRlc3QpXG4gICAgICAgICAgICB0ZXN0LmxvY2tlZCA9IGZhbHNlXG4gICAgICAgIH0sXG4gICAgICAgIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICBjbGVhckNoaWxkcmVuKHRlc3QpXG4gICAgICAgICAgICB0ZXN0LmxvY2tlZCA9IGZhbHNlXG4gICAgICAgICAgICB0aHJvdyBlXG4gICAgICAgIH0pXG59XG5cbi8vIEhlbHAgb3B0aW1pemUgZm9yIGluZWZmaWNpZW50IGV4Y2VwdGlvbiBoYW5kbGluZyBpbiBWOFxuXG5mdW5jdGlvbiB0cnlQYXNzKHZhbHVlKSB7XG4gICAgcmV0dXJuIHtjYXVnaHQ6IGZhbHNlLCB2YWx1ZTogdmFsdWV9XG59XG5cbmZ1bmN0aW9uIHRyeUZhaWwoZSkge1xuICAgIHJldHVybiB7Y2F1Z2h0OiB0cnVlLCB2YWx1ZTogZX1cbn1cblxuZnVuY3Rpb24gdHJ5MShmLCBpbnN0LCBhcmcwKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIHRyeVBhc3MoZi5jYWxsKGluc3QsIGFyZzApKVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgcmV0dXJuIHRyeUZhaWwoZSlcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHRyeTIoZiwgaW5zdCwgYXJnMCwgYXJnMSkge1xuICAgIHRyeSB7XG4gICAgICAgIHJldHVybiB0cnlQYXNzKGYuY2FsbChpbnN0LCBhcmcwLCBhcmcxKSlcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHJldHVybiB0cnlGYWlsKGUpXG4gICAgfVxufVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoQmFzZSwgU3VwZXIpIHtcbiAgICB2YXIgc3RhcnQgPSAyXG5cbiAgICBpZiAodHlwZW9mIFN1cGVyID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgQmFzZS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFN1cGVyLnByb3RvdHlwZSlcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEJhc2UucHJvdG90eXBlLCBcImNvbnN0cnVjdG9yXCIsIHtcbiAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgICAgICB2YWx1ZTogQmFzZSxcbiAgICAgICAgfSlcbiAgICB9IGVsc2Uge1xuICAgICAgICBzdGFydCA9IDFcbiAgICB9XG5cbiAgICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIG1ldGhvZHMgPSBhcmd1bWVudHNbaV1cblxuICAgICAgICBpZiAobWV0aG9kcyAhPSBudWxsKSB7XG4gICAgICAgICAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKG1ldGhvZHMpXG5cbiAgICAgICAgICAgIGZvciAodmFyIGsgPSAwOyBrIDwga2V5cy5sZW5ndGg7IGsrKykge1xuICAgICAgICAgICAgICAgIHZhciBrZXkgPSBrZXlzW2tdXG4gICAgICAgICAgICAgICAgdmFyIGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKG1ldGhvZHMsIGtleSlcblxuICAgICAgICAgICAgICAgIGRlc2MuZW51bWVyYWJsZSA9IGZhbHNlXG4gICAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEJhc2UucHJvdG90eXBlLCBrZXksIGRlc2MpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCJcInVzZSBzdHJpY3RcIlxuXG4vKipcbiAqIFRoaXMgY29udGFpbnMgdGhlIGJyb3dzZXIgY29uc29sZSBzdHVmZi5cbiAqL1xuXG5leHBvcnRzLlN5bWJvbHMgPSBPYmplY3QuZnJlZXplKHtcbiAgICBQYXNzOiBcIuKck1wiLFxuICAgIEZhaWw6IFwi4pyWXCIsXG4gICAgRG90OiBcIuKApFwiLFxuICAgIERvdEZhaWw6IFwiIVwiLFxufSlcblxuZXhwb3J0cy53aW5kb3dXaWR0aCA9IDc1XG5leHBvcnRzLm5ld2xpbmUgPSBcIlxcblwiXG5cbi8vIENvbG9yIHN1cHBvcnQgaXMgdW5mb3JjZWQgYW5kIHVuc3VwcG9ydGVkLCBzaW5jZSB5b3UgY2FuIG9ubHkgc3BlY2lmeVxuLy8gbGluZS1ieS1saW5lIGNvbG9ycyB2aWEgQ1NTLCBhbmQgZXZlbiB0aGF0IGlzbid0IHZlcnkgcG9ydGFibGUuXG5leHBvcnRzLmNvbG9yU3VwcG9ydCA9IDBcblxuLyoqXG4gKiBTaW5jZSBicm93c2VycyBkb24ndCBoYXZlIHVuYnVmZmVyZWQgb3V0cHV0LCB0aGlzIGtpbmQgb2Ygc2ltdWxhdGVzIGl0LlxuICovXG5cbnZhciBhY2MgPSBcIlwiXG5cbmV4cG9ydHMuZGVmYXVsdE9wdHMgPSB7XG4gICAgd3JpdGU6IGZ1bmN0aW9uIChzdHIpIHtcbiAgICAgICAgYWNjICs9IHN0clxuXG4gICAgICAgIHZhciBpbmRleCA9IHN0ci5pbmRleE9mKFwiXFxuXCIpXG5cbiAgICAgICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgICAgICAgIHZhciBsaW5lcyA9IHN0ci5zcGxpdChcIlxcblwiKVxuXG4gICAgICAgICAgICBhY2MgPSBsaW5lcy5wb3AoKVxuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgZ2xvYmFsLmNvbnNvbGUubG9nKGxpbmVzW2ldKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIHJlc2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmIChhY2MgIT09IFwiXCIpIHtcbiAgICAgICAgICAgIGdsb2JhbC5jb25zb2xlLmxvZyhhY2MpXG4gICAgICAgICAgICBhY2MgPSBcIlwiXG4gICAgICAgIH1cbiAgICB9LFxufVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxudmFyIG1ldGhvZHMgPSByZXF1aXJlKFwiLi4vbWV0aG9kc1wiKVxudmFyIGluc3BlY3QgPSByZXF1aXJlKFwiLi4vcmVwbGFjZWQvaW5zcGVjdFwiKVxudmFyIHBlYWNoID0gcmVxdWlyZShcIi4uL3V0aWxcIikucGVhY2hcbnZhciBSZXBvcnRlciA9IHJlcXVpcmUoXCIuL3JlcG9ydGVyXCIpXG52YXIgVXRpbCA9IHJlcXVpcmUoXCIuL3V0aWxcIilcblxuZnVuY3Rpb24gc2ltcGxlSW5zcGVjdCh2YWx1ZSkge1xuICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHJldHVybiBVdGlsLmdldFN0YWNrKHZhbHVlKVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBpbnNwZWN0KHZhbHVlKVxuICAgIH1cbn1cblxuZnVuY3Rpb24gcHJpbnRUaW1lKF8sIHAsIHN0cikge1xuICAgIGlmICghXy50aW1lUHJpbnRlZCkge1xuICAgICAgICBfLnRpbWVQcmludGVkID0gdHJ1ZVxuICAgICAgICBzdHIgKz0gVXRpbC5jb2xvcihcImxpZ2h0XCIsIFwiIChcIiArIFV0aWwuZm9ybWF0VGltZShfLmR1cmF0aW9uKSArIFwiKVwiKVxuICAgIH1cblxuICAgIHJldHVybiBwLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gXy5wcmludChzdHIpIH0pXG59XG5cbmZ1bmN0aW9uIHByaW50RmFpbExpc3QoXywgc3RyKSB7XG4gICAgdmFyIHBhcnRzID0gc3RyLnNwbGl0KC9cXHI/XFxuL2cpXG5cbiAgICByZXR1cm4gXy5wcmludChcIiAgICBcIiArIFV0aWwuY29sb3IoXCJmYWlsXCIsIHBhcnRzWzBdKSlcbiAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBwZWFjaChwYXJ0cy5zbGljZSgxKSwgZnVuY3Rpb24gKHBhcnQpIHtcbiAgICAgICAgICAgIHJldHVybiBfLnByaW50KFwiICAgICAgXCIgKyBVdGlsLmNvbG9yKFwiZmFpbFwiLCBwYXJ0KSlcbiAgICAgICAgfSlcbiAgICB9KVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChvcHRzLCBtZXRob2RzKSB7XG4gICAgcmV0dXJuIG5ldyBDb25zb2xlUmVwb3J0ZXIob3B0cywgbWV0aG9kcylcbn1cblxuLyoqXG4gKiBCYXNlIGNsYXNzIGZvciBtb3N0IGNvbnNvbGUgcmVwb3J0ZXJzLlxuICpcbiAqIE5vdGU6IHByaW50aW5nIGlzIGFzeW5jaHJvbm91cywgYmVjYXVzZSBvdGhlcndpc2UsIGlmIGVub3VnaCBlcnJvcnMgZXhpc3QsXG4gKiBOb2RlIHdpbGwgZXZlbnR1YWxseSBzdGFydCBkcm9wcGluZyBsaW5lcyBzZW50IHRvIGl0cyBidWZmZXIsIGVzcGVjaWFsbHkgd2hlblxuICogc3RhY2sgdHJhY2VzIGdldCBpbnZvbHZlZC4gSWYgVGhhbGxpdW0ncyBvdXRwdXQgaXMgcmVkaXJlY3RlZCwgdGhhdCBjYW4gYmUgYVxuICogYmlnIHByb2JsZW0gZm9yIGNvbnN1bWVycywgYXMgdGhleSBvbmx5IGhhdmUgcGFydCBvZiB0aGUgb3V0cHV0LCBhbmQgd29uJ3QgYmVcbiAqIGFibGUgdG8gc2VlIGFsbCB0aGUgZXJyb3JzIGxhdGVyLiBBbHNvLCBpZiBjb25zb2xlIHdhcm5pbmdzIGNvbWUgdXAgZW4tbWFzc2UsXG4gKiB0aGF0IHdvdWxkIGFsc28gY29udHJpYnV0ZS4gU28sIHdlIGhhdmUgdG8gd2FpdCBmb3IgZWFjaCBsaW5lIHRvIGZsdXNoIGJlZm9yZVxuICogd2UgY2FuIGNvbnRpbnVlLCBzbyB0aGUgZnVsbCBvdXRwdXQgbWFrZXMgaXRzIHdheSB0byB0aGUgY29uc29sZS5cbiAqXG4gKiBTb21lIHRlc3QgZnJhbWV3b3JrcyBsaWtlIFRhcGUgbWlzcyB0aGlzLCB0aG91Z2guXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9wdHMgVGhlIG9wdGlvbnMgZm9yIHRoZSByZXBvcnRlci5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IG9wdHMud3JpdGUgVGhlIHVuYnVmZmVycmVkIHdyaXRlciBmb3IgdGhlIHJlcG9ydGVyLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gb3B0cy5yZXNldCBBIHJlc2V0IGZ1bmN0aW9uIGZvciB0aGUgcHJpbnRlciArIHdyaXRlci5cbiAqIEBwYXJhbSB7U3RyaW5nW119IGFjY2VwdHMgVGhlIG9wdGlvbnMgYWNjZXB0ZWQuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBpbml0IFRoZSBpbml0IGZ1bmN0aW9uIGZvciB0aGUgc3ViY2xhc3MgcmVwb3J0ZXInc1xuICogICAgICAgICAgICAgICAgICAgICAgICBpc29sYXRlZCBzdGF0ZSAoY3JlYXRlZCBieSBmYWN0b3J5KS5cbiAqL1xuZnVuY3Rpb24gQ29uc29sZVJlcG9ydGVyKG9wdHMsIG1ldGhvZHMpIHtcbiAgICBSZXBvcnRlci5jYWxsKHRoaXMsIFV0aWwuVHJlZSwgb3B0cywgbWV0aG9kcywgdHJ1ZSlcblxuICAgIGlmICghVXRpbC5Db2xvcnMuZm9yY2VkKCkgJiYgbWV0aG9kcy5hY2NlcHRzLmluZGV4T2YoXCJjb2xvclwiKSA+PSAwKSB7XG4gICAgICAgIHRoaXMub3B0cy5jb2xvciA9IG9wdHMuY29sb3JcbiAgICB9XG5cbiAgICBVdGlsLmRlZmF1bHRpZnkodGhpcywgb3B0cywgXCJ3cml0ZVwiKVxuICAgIHRoaXMucmVzZXQoKVxufVxuXG5tZXRob2RzKENvbnNvbGVSZXBvcnRlciwgUmVwb3J0ZXIsIHtcbiAgICBwcmludDogZnVuY3Rpb24gKHN0cikge1xuICAgICAgICBpZiAoc3RyID09IG51bGwpIHN0ciA9IFwiXCJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLm9wdHMud3JpdGUoc3RyICsgXCJcXG5cIikpXG4gICAgfSxcblxuICAgIHdyaXRlOiBmdW5jdGlvbiAoc3RyKSB7XG4gICAgICAgIGlmIChzdHIgIT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLm9wdHMud3JpdGUoc3RyKSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIHByaW50UmVzdWx0czogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXNcblxuICAgICAgICBpZiAoIXRoaXMudGVzdHMgJiYgIXRoaXMuc2tpcCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucHJpbnQoXG4gICAgICAgICAgICAgICAgVXRpbC5jb2xvcihcInBsYWluXCIsIFwiICAwIHRlc3RzXCIpICtcbiAgICAgICAgICAgICAgICBVdGlsLmNvbG9yKFwibGlnaHRcIiwgXCIgKDBtcylcIikpXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiBzZWxmLnByaW50KCkgfSlcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLnByaW50KCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgcCA9IFByb21pc2UucmVzb2x2ZSgpXG5cbiAgICAgICAgICAgIGlmIChzZWxmLnBhc3MpIHtcbiAgICAgICAgICAgICAgICBwID0gcHJpbnRUaW1lKHNlbGYsIHAsXG4gICAgICAgICAgICAgICAgICAgIFV0aWwuY29sb3IoXCJicmlnaHQgcGFzc1wiLCBcIiAgXCIpICtcbiAgICAgICAgICAgICAgICAgICAgVXRpbC5jb2xvcihcImdyZWVuXCIsIHNlbGYucGFzcyArIFwiIHBhc3NpbmdcIikpXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzZWxmLnNraXApIHtcbiAgICAgICAgICAgICAgICBwID0gcHJpbnRUaW1lKHNlbGYsIHAsXG4gICAgICAgICAgICAgICAgICAgIFV0aWwuY29sb3IoXCJza2lwXCIsIFwiICBcIiArIHNlbGYuc2tpcCArIFwiIHNraXBwZWRcIikpXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzZWxmLmZhaWwpIHtcbiAgICAgICAgICAgICAgICBwID0gcHJpbnRUaW1lKHNlbGYsIHAsXG4gICAgICAgICAgICAgICAgICAgIFV0aWwuY29sb3IoXCJicmlnaHQgZmFpbFwiLCBcIiAgXCIpICtcbiAgICAgICAgICAgICAgICAgICAgVXRpbC5jb2xvcihcImZhaWxcIiwgc2VsZi5mYWlsICsgXCIgZmFpbGluZ1wiKSlcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHBcbiAgICAgICAgfSlcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gc2VsZi5wcmludCgpIH0pXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBwZWFjaChzZWxmLmVycm9ycywgZnVuY3Rpb24gKHJlcG9ydCwgaSkge1xuICAgICAgICAgICAgICAgIHZhciBuYW1lID0gaSArIDEgKyBcIikgXCIgKyBVdGlsLmpvaW5QYXRoKHJlcG9ydCkgK1xuICAgICAgICAgICAgICAgICAgICBVdGlsLmZvcm1hdFJlc3QocmVwb3J0KVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNlbGYucHJpbnQoXCIgIFwiICsgVXRpbC5jb2xvcihcInBsYWluXCIsIG5hbWUgKyBcIjpcIikpXG4gICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcHJpbnRGYWlsTGlzdChzZWxmLCBzaW1wbGVJbnNwZWN0KHJlcG9ydC5lcnJvcikpXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiBzZWxmLnByaW50KCkgfSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pXG4gICAgfSxcblxuICAgIHByaW50RXJyb3I6IGZ1bmN0aW9uIChyZXBvcnQpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgICAgIHZhciBsaW5lcyA9IHNpbXBsZUluc3BlY3QocmVwb3J0LmVycm9yKS5zcGxpdCgvXFxyP1xcbi9nKVxuXG4gICAgICAgIHJldHVybiB0aGlzLnByaW50KCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gcGVhY2gobGluZXMsIGZ1bmN0aW9uIChsaW5lKSB7IHJldHVybiBzZWxmLnByaW50KGxpbmUpIH0pXG4gICAgICAgIH0pXG4gICAgfSxcbn0pXG4iLCJcInVzZSBzdHJpY3RcIlxuXG52YXIgVXRpbCA9IHJlcXVpcmUoXCIuL3V0aWxcIilcblxuZXhwb3J0cy5vbiA9IHJlcXVpcmUoXCIuL29uXCIpXG5leHBvcnRzLmNvbnNvbGVSZXBvcnRlciA9IHJlcXVpcmUoXCIuL2NvbnNvbGUtcmVwb3J0ZXJcIilcbmV4cG9ydHMuUmVwb3J0ZXIgPSByZXF1aXJlKFwiLi9yZXBvcnRlclwiKVxuZXhwb3J0cy5zeW1ib2xzID0gVXRpbC5zeW1ib2xzXG5leHBvcnRzLndpbmRvd1dpZHRoID0gVXRpbC53aW5kb3dXaWR0aFxuZXhwb3J0cy5uZXdsaW5lID0gVXRpbC5uZXdsaW5lXG5leHBvcnRzLnNldENvbG9yID0gVXRpbC5zZXRDb2xvclxuZXhwb3J0cy51bnNldENvbG9yID0gVXRpbC51bnNldENvbG9yXG5leHBvcnRzLnNwZWVkID0gVXRpbC5zcGVlZFxuZXhwb3J0cy5nZXRTdGFjayA9IFV0aWwuZ2V0U3RhY2tcbmV4cG9ydHMuQ29sb3JzID0gVXRpbC5Db2xvcnNcbmV4cG9ydHMuY29sb3IgPSBVdGlsLmNvbG9yXG5leHBvcnRzLmZvcm1hdFJlc3QgPSBVdGlsLmZvcm1hdFJlc3RcbmV4cG9ydHMuam9pblBhdGggPSBVdGlsLmpvaW5QYXRoXG5leHBvcnRzLmZvcm1hdFRpbWUgPSBVdGlsLmZvcm1hdFRpbWVcbiIsIlwidXNlIHN0cmljdFwiXG5cbnZhciBTdGF0dXMgPSByZXF1aXJlKFwiLi91dGlsXCIpLlN0YXR1c1xuXG4vLyBCZWNhdXNlIEVTNSBzdWNrcy4gKEFuZCwgaXQncyBicmVha2luZyBteSBQaGFudG9tSlMgYnVpbGRzKVxuZnVuY3Rpb24gc2V0TmFtZShyZXBvcnRlciwgbmFtZSkge1xuICAgIHRyeSB7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShyZXBvcnRlciwgXCJuYW1lXCIsIHt2YWx1ZTogbmFtZX0pXG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAvLyBpZ25vcmVcbiAgICB9XG59XG5cbi8qKlxuICogQSBtYWNybyBvZiBzb3J0cywgdG8gc2ltcGxpZnkgY3JlYXRpbmcgcmVwb3J0ZXJzLiBJdCBhY2NlcHRzIGFuIG9iamVjdCB3aXRoXG4gKiB0aGUgZm9sbG93aW5nIHBhcmFtZXRlcnM6XG4gKlxuICogYGFjY2VwdHM6IHN0cmluZ1tdYCAtIFRoZSBwcm9wZXJ0aWVzIGFjY2VwdGVkLiBFdmVyeXRoaW5nIGVsc2UgaXMgaWdub3JlZCxcbiAqIGFuZCBpdCdzIHBhcnRpYWxseSB0aGVyZSBmb3IgZG9jdW1lbnRhdGlvbi4gVGhpcyBwYXJhbWV0ZXIgaXMgcmVxdWlyZWQuXG4gKlxuICogYGNyZWF0ZShvcHRzLCBtZXRob2RzKWAgLSBDcmVhdGUgYSBuZXcgcmVwb3J0ZXIgaW5zdGFuY2UuICBUaGlzIHBhcmFtZXRlciBpc1xuICogcmVxdWlyZWQuIE5vdGUgdGhhdCBgbWV0aG9kc2AgcmVmZXJzIHRvIHRoZSBwYXJhbWV0ZXIgb2JqZWN0IGl0c2VsZi5cbiAqXG4gKiBgaW5pdChzdGF0ZSwgb3B0cylgIC0gSW5pdGlhbGl6ZSBleHRyYSByZXBvcnRlciBzdGF0ZSwgaWYgYXBwbGljYWJsZS5cbiAqXG4gKiBgYmVmb3JlKHJlcG9ydGVyKWAgLSBEbyB0aGluZ3MgYmVmb3JlIGVhY2ggZXZlbnQsIHJldHVybmluZyBhIHBvc3NpYmxlXG4gKiB0aGVuYWJsZSB3aGVuIGRvbmUuIFRoaXMgZGVmYXVsdHMgdG8gYSBuby1vcC5cbiAqXG4gKiBgYWZ0ZXIocmVwb3J0ZXIpYCAtIERvIHRoaW5ncyBhZnRlciBlYWNoIGV2ZW50LCByZXR1cm5pbmcgYSBwb3NzaWJsZVxuICogdGhlbmFibGUgd2hlbiBkb25lLiBUaGlzIGRlZmF1bHRzIHRvIGEgbm8tb3AuXG4gKlxuICogYHJlcG9ydChyZXBvcnRlciwgcmVwb3J0KWAgLSBIYW5kbGUgYSB0ZXN0IHJlcG9ydC4gVGhpcyBtYXkgcmV0dXJuIGEgcG9zc2libGVcbiAqIHRoZW5hYmxlIHdoZW4gZG9uZSwgYW5kIGl0IGlzIHJlcXVpcmVkLlxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChuYW1lLCBtZXRob2RzKSB7XG4gICAgc2V0TmFtZShyZXBvcnRlciwgbmFtZSlcbiAgICByZXBvcnRlcltuYW1lXSA9IHJlcG9ydGVyXG4gICAgcmV0dXJuIHJlcG9ydGVyXG4gICAgZnVuY3Rpb24gcmVwb3J0ZXIob3B0cykge1xuICAgICAgICAvKipcbiAgICAgICAgICogSW5zdGVhZCBvZiBzaWxlbnRseSBmYWlsaW5nIHRvIHdvcmssIGxldCdzIGVycm9yIG91dCB3aGVuIGEgcmVwb3J0IGlzXG4gICAgICAgICAqIHBhc3NlZCBpbiwgYW5kIGluZm9ybSB0aGUgdXNlciBpdCBuZWVkcyBpbml0aWFsaXplZC4gQ2hhbmNlcyBhcmUsXG4gICAgICAgICAqIHRoZXJlJ3Mgbm8gbGVnaXRpbWF0ZSByZWFzb24gdG8gZXZlbiBwYXNzIGEgcmVwb3J0LCBhbnl3YXlzLlxuICAgICAgICAgKi9cbiAgICAgICAgaWYgKHR5cGVvZiBvcHRzID09PSBcIm9iamVjdFwiICYmIG9wdHMgIT09IG51bGwgJiZcbiAgICAgICAgICAgICAgICB0eXBlb2Ygb3B0cy5fID09PSBcIm51bWJlclwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICAgICAgICAgIFwiT3B0aW9ucyBjYW5ub3QgYmUgYSByZXBvcnQuIERpZCB5b3UgZm9yZ2V0IHRvIGNhbGwgdGhlIFwiICtcbiAgICAgICAgICAgICAgICBcImZhY3RvcnkgZmlyc3Q/XCIpXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgXyA9IG1ldGhvZHMuY3JlYXRlKG9wdHMsIG1ldGhvZHMpXG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChyZXBvcnQpIHtcbiAgICAgICAgICAgIC8vIE9ubHkgc29tZSBldmVudHMgaGF2ZSBjb21tb24gc3RlcHMuXG4gICAgICAgICAgICBpZiAocmVwb3J0LmlzU3RhcnQpIHtcbiAgICAgICAgICAgICAgICBfLnJ1bm5pbmcgPSB0cnVlXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHJlcG9ydC5pc0VudGVyIHx8IHJlcG9ydC5pc1Bhc3MpIHtcbiAgICAgICAgICAgICAgICBfLmdldChyZXBvcnQucGF0aCkuc3RhdHVzID0gU3RhdHVzLlBhc3NpbmdcbiAgICAgICAgICAgICAgICBfLmR1cmF0aW9uICs9IHJlcG9ydC5kdXJhdGlvblxuICAgICAgICAgICAgICAgIF8udGVzdHMrK1xuICAgICAgICAgICAgICAgIF8ucGFzcysrXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHJlcG9ydC5pc0ZhaWwpIHtcbiAgICAgICAgICAgICAgICBfLmdldChyZXBvcnQucGF0aCkuc3RhdHVzID0gU3RhdHVzLkZhaWxpbmdcbiAgICAgICAgICAgICAgICBfLmR1cmF0aW9uICs9IHJlcG9ydC5kdXJhdGlvblxuICAgICAgICAgICAgICAgIF8udGVzdHMrK1xuICAgICAgICAgICAgICAgIF8uZmFpbCsrXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHJlcG9ydC5pc0hvb2spIHtcbiAgICAgICAgICAgICAgICBfLmdldChyZXBvcnQucGF0aCkuc3RhdHVzID0gU3RhdHVzLkZhaWxpbmdcbiAgICAgICAgICAgICAgICBfLmdldChyZXBvcnQucm9vdFBhdGgpLnN0YXR1cyA9IFN0YXR1cy5GYWlsaW5nXG4gICAgICAgICAgICAgICAgXy5mYWlsKytcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocmVwb3J0LmlzU2tpcCkge1xuICAgICAgICAgICAgICAgIF8uZ2V0KHJlcG9ydC5wYXRoKS5zdGF0dXMgPSBTdGF0dXMuU2tpcHBlZFxuICAgICAgICAgICAgICAgIC8vIFNraXBwZWQgdGVzdHMgYXJlbid0IGNvdW50ZWQgaW4gdGhlIHRvdGFsIHRlc3QgY291bnRcbiAgICAgICAgICAgICAgICBfLnNraXArK1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFxuICAgICAgICAgICAgICAgIHR5cGVvZiBtZXRob2RzLmJlZm9yZSA9PT0gXCJmdW5jdGlvblwiXG4gICAgICAgICAgICAgICAgICAgID8gbWV0aG9kcy5iZWZvcmUoXylcbiAgICAgICAgICAgICAgICAgICAgOiB1bmRlZmluZWQpXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiBtZXRob2RzLnJlcG9ydChfLCByZXBvcnQpIH0pXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiBtZXRob2RzLmFmdGVyID09PSBcImZ1bmN0aW9uXCJcbiAgICAgICAgICAgICAgICAgICAgPyBtZXRob2RzLmFmdGVyKF8pXG4gICAgICAgICAgICAgICAgICAgIDogdW5kZWZpbmVkXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmIChyZXBvcnQuaXNFbmQgfHwgcmVwb3J0LmlzRXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgXy5yZXNldCgpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBfLm9wdHMucmVzZXQoKVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWRcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgfVxufVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxudmFyIG1ldGhvZHMgPSByZXF1aXJlKFwiLi4vbWV0aG9kc1wiKVxudmFyIGRlZmF1bHRpZnkgPSByZXF1aXJlKFwiLi91dGlsXCIpLmRlZmF1bHRpZnlcbnZhciBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5XG5cbmZ1bmN0aW9uIFN0YXRlKHJlcG9ydGVyKSB7XG4gICAgaWYgKHR5cGVvZiByZXBvcnRlci5tZXRob2RzLmluaXQgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAoMCwgcmVwb3J0ZXIubWV0aG9kcy5pbml0KSh0aGlzLCByZXBvcnRlci5vcHRzKVxuICAgIH1cbn1cblxuLyoqXG4gKiBUaGlzIGhlbHBzIHNwZWVkIHVwIGdldHRpbmcgcHJldmlvdXMgdHJlZXMsIHNvIGEgcG90ZW50aWFsbHkgZXhwZW5zaXZlXG4gKiB0cmVlIHNlYXJjaCBkb2Vzbid0IGhhdmUgdG8gYmUgcGVyZm9ybWVkLlxuICpcbiAqIChUaGlzIGRvZXMgYWN0dWFsbHkgbWFrZSBhIHNsaWdodCBwZXJmIGRpZmZlcmVuY2UgaW4gdGhlIHRlc3RzLilcbiAqL1xuZnVuY3Rpb24gaXNSZXBlYXQoY2FjaGUsIHBhdGgpIHtcbiAgICAvLyBDYW4ndCBiZSBhIHJlcGVhdCB0aGUgZmlyc3QgdGltZS5cbiAgICBpZiAoY2FjaGUucGF0aCA9PSBudWxsKSByZXR1cm4gZmFsc2VcbiAgICBpZiAocGF0aC5sZW5ndGggIT09IGNhY2hlLnBhdGgubGVuZ3RoKSByZXR1cm4gZmFsc2VcbiAgICBpZiAocGF0aCA9PT0gY2FjaGUucGF0aCkgcmV0dXJuIHRydWVcblxuICAgIC8vIEl0J3MgdW5saWtlbHkgdGhlIG5lc3Rpbmcgd2lsbCBiZSBjb25zaXN0ZW50bHkgbW9yZSB0aGFuIGEgZmV3IGxldmVsc1xuICAgIC8vIGRlZXAgKD49IDUpLCBzbyB0aGlzIHNob3VsZG4ndCBib2cgYW55dGhpbmcgZG93bi5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBhdGgubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKHBhdGhbaV0gIT09IGNhY2hlLnBhdGhbaV0pIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgY2FjaGUucGF0aCA9IHBhdGhcbiAgICByZXR1cm4gdHJ1ZVxufVxuXG4vKipcbiAqIFN1cGVyY2xhc3MgZm9yIGFsbCByZXBvcnRlcnMuIFRoaXMgY292ZXJzIHRoZSBzdGF0ZSBmb3IgcHJldHR5IG11Y2ggZXZlcnlcbiAqIHJlcG9ydGVyLlxuICpcbiAqIE5vdGUgdGhhdCBpZiB5b3UgZGVsYXkgdGhlIGluaXRpYWwgcmVzZXQsIHlvdSBzdGlsbCBtdXN0IGNhbGwgaXQgYmVmb3JlIHRoZVxuICogY29uc3RydWN0b3IgZmluaXNoZXMuXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gUmVwb3J0ZXJcbmZ1bmN0aW9uIFJlcG9ydGVyKFRyZWUsIG9wdHMsIG1ldGhvZHMsIGRlbGF5KSB7XG4gICAgdGhpcy5UcmVlID0gVHJlZVxuICAgIHRoaXMub3B0cyA9IHt9XG4gICAgdGhpcy5tZXRob2RzID0gbWV0aG9kc1xuICAgIGRlZmF1bHRpZnkodGhpcywgb3B0cywgXCJyZXNldFwiKVxuICAgIGlmICghZGVsYXkpIHRoaXMucmVzZXQoKVxufVxuXG5tZXRob2RzKFJlcG9ydGVyLCB7XG4gICAgcmVzZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5ydW5uaW5nID0gZmFsc2VcbiAgICAgICAgdGhpcy50aW1lUHJpbnRlZCA9IGZhbHNlXG4gICAgICAgIHRoaXMudGVzdHMgPSAwXG4gICAgICAgIHRoaXMucGFzcyA9IDBcbiAgICAgICAgdGhpcy5mYWlsID0gMFxuICAgICAgICB0aGlzLnNraXAgPSAwXG4gICAgICAgIHRoaXMuZHVyYXRpb24gPSAwXG4gICAgICAgIHRoaXMuZXJyb3JzID0gW11cbiAgICAgICAgdGhpcy5zdGF0ZSA9IG5ldyBTdGF0ZSh0aGlzKVxuICAgICAgICB0aGlzLmJhc2UgPSBuZXcgdGhpcy5UcmVlKG51bGwpXG4gICAgICAgIHRoaXMuY2FjaGUgPSB7cGF0aDogbnVsbCwgcmVzdWx0OiBudWxsfVxuICAgIH0sXG5cbiAgICBwdXNoRXJyb3I6IGZ1bmN0aW9uIChyZXBvcnQpIHtcbiAgICAgICAgdGhpcy5lcnJvcnMucHVzaChyZXBvcnQpXG4gICAgfSxcblxuICAgIGdldDogZnVuY3Rpb24gKHBhdGgpIHtcbiAgICAgICAgaWYgKGlzUmVwZWF0KHRoaXMuY2FjaGUsIHBhdGgpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jYWNoZS5yZXN1bHRcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBjaGlsZCA9IHRoaXMuYmFzZVxuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGF0aC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGVudHJ5ID0gcGF0aFtpXVxuXG4gICAgICAgICAgICBpZiAoaGFzT3duLmNhbGwoY2hpbGQuY2hpbGRyZW4sIGVudHJ5LmluZGV4KSkge1xuICAgICAgICAgICAgICAgIGNoaWxkID0gY2hpbGQuY2hpbGRyZW5bZW50cnkuaW5kZXhdXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNoaWxkID0gY2hpbGQuY2hpbGRyZW5bZW50cnkuaW5kZXhdID0gbmV3IHRoaXMuVHJlZShlbnRyeS5uYW1lKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuY2FjaGUucmVzdWx0ID0gY2hpbGRcbiAgICB9LFxufSlcbiIsIlwidXNlIHN0cmljdFwiXG5cbi8vIFRPRE86IGFkZCBgZGlmZmAgc3VwcG9ydFxuLy8gdmFyIGRpZmYgPSByZXF1aXJlKFwiZGlmZlwiKVxuXG52YXIgVXRpbCA9IHJlcXVpcmUoXCIuLi91dGlsXCIpXG52YXIgU2V0dGluZ3MgPSByZXF1aXJlKFwiLi4vc2V0dGluZ3NcIilcblxuZXhwb3J0cy5zeW1ib2xzID0gU2V0dGluZ3Muc3ltYm9sc1xuZXhwb3J0cy53aW5kb3dXaWR0aCA9IFNldHRpbmdzLndpbmRvd1dpZHRoXG5leHBvcnRzLm5ld2xpbmUgPSBTZXR0aW5ncy5uZXdsaW5lXG5cbi8qXG4gKiBTdGFjayBub3JtYWxpemF0aW9uXG4gKi9cblxudmFyIHN0YWNrSW5jbHVkZXNNZXNzYWdlID0gKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc3RhY2sgPSBVdGlsLmdldFN0YWNrKG5ldyBFcnJvcihcInRlc3RcIikpXG5cbiAgICAvLyAgICAgRmlyZWZveCwgU2FmYXJpICAgICAgICAgICAgICAgICBDaHJvbWUsIElFXG4gICAgcmV0dXJuICEvXihAKT9cXFMrXFw6XFxkKy8udGVzdChzdGFjaykgJiYgIS9eXFxzKmF0Ly50ZXN0KHN0YWNrKVxufSkoKVxuXG5mdW5jdGlvbiBmb3JtYXRMaW5lQnJlYWtzKGxlYWQsIHN0cikge1xuICAgIHJldHVybiBzdHJcbiAgICAgICAgLnJlcGxhY2UoL15cXHMrL2dtLCBsZWFkKVxuICAgICAgICAucmVwbGFjZSgvXFxyP1xcbnxcXHIvZywgU2V0dGluZ3MubmV3bGluZSgpKVxufVxuXG5leHBvcnRzLmdldFN0YWNrID0gZnVuY3Rpb24gKGUpIHtcbiAgICBpZiAoZSBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHZhciBkZXNjcmlwdGlvbiA9IGZvcm1hdExpbmVCcmVha3MoXCIgICAgXCIsIGUubmFtZSArIFwiOiBcIiArIGUubWVzc2FnZSlcbiAgICAgICAgdmFyIHN0cmlwcGVkID0gXCJcIlxuXG4gICAgICAgIGlmIChzdGFja0luY2x1ZGVzTWVzc2FnZSkge1xuICAgICAgICAgICAgdmFyIHN0YWNrID0gVXRpbC5nZXRTdGFjayhlKVxuICAgICAgICAgICAgdmFyIGluZGV4ID0gc3RhY2suaW5kZXhPZihlLm1lc3NhZ2UpXG5cbiAgICAgICAgICAgIGlmIChpbmRleCA8IDApIHJldHVybiBmb3JtYXRMaW5lQnJlYWtzKFwiXCIsIFV0aWwuZ2V0U3RhY2soZSkpXG5cbiAgICAgICAgICAgIHZhciByZSA9IC9cXHI/XFxuL2dcblxuICAgICAgICAgICAgcmUubGFzdEluZGV4ID0gaW5kZXggKyBlLm1lc3NhZ2UubGVuZ3RoXG4gICAgICAgICAgICBpZiAocmUudGVzdChzdGFjaykpIHtcbiAgICAgICAgICAgICAgICBzdHJpcHBlZCA9IGZvcm1hdExpbmVCcmVha3MoXCJcIiwgc3RhY2suc2xpY2UocmUubGFzdEluZGV4KSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHN0cmlwcGVkID0gZm9ybWF0TGluZUJyZWFrcyhcIlwiLCBVdGlsLmdldFN0YWNrKGUpKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHN0cmlwcGVkICE9PSBcIlwiKSBkZXNjcmlwdGlvbiArPSBTZXR0aW5ncy5uZXdsaW5lKCkgKyBzdHJpcHBlZFxuICAgICAgICByZXR1cm4gZGVzY3JpcHRpb25cbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZm9ybWF0TGluZUJyZWFrcyhcIlwiLCBVdGlsLmdldFN0YWNrKGUpKVxuICAgIH1cbn1cblxudmFyIENvbG9ycyA9IGV4cG9ydHMuQ29sb3JzID0gU2V0dGluZ3MuQ29sb3JzXG5cbi8vIENvbG9yIHBhbGV0dGUgcHVsbGVkIGZyb20gTW9jaGFcbmZ1bmN0aW9uIGNvbG9yVG9OdW1iZXIobmFtZSkge1xuICAgIHN3aXRjaCAobmFtZSkge1xuICAgIGNhc2UgXCJwYXNzXCI6IHJldHVybiA5MFxuICAgIGNhc2UgXCJmYWlsXCI6IHJldHVybiAzMVxuXG4gICAgY2FzZSBcImJyaWdodCBwYXNzXCI6IHJldHVybiA5MlxuICAgIGNhc2UgXCJicmlnaHQgZmFpbFwiOiByZXR1cm4gOTFcbiAgICBjYXNlIFwiYnJpZ2h0IHllbGxvd1wiOiByZXR1cm4gOTNcblxuICAgIGNhc2UgXCJza2lwXCI6IHJldHVybiAzNlxuICAgIGNhc2UgXCJzdWl0ZVwiOiByZXR1cm4gMFxuICAgIGNhc2UgXCJwbGFpblwiOiByZXR1cm4gMFxuXG4gICAgY2FzZSBcImVycm9yIHRpdGxlXCI6IHJldHVybiAwXG4gICAgY2FzZSBcImVycm9yIG1lc3NhZ2VcIjogcmV0dXJuIDMxXG4gICAgY2FzZSBcImVycm9yIHN0YWNrXCI6IHJldHVybiA5MFxuXG4gICAgY2FzZSBcImNoZWNrbWFya1wiOiByZXR1cm4gMzJcbiAgICBjYXNlIFwiZmFzdFwiOiByZXR1cm4gOTBcbiAgICBjYXNlIFwibWVkaXVtXCI6IHJldHVybiAzM1xuICAgIGNhc2UgXCJzbG93XCI6IHJldHVybiAzMVxuICAgIGNhc2UgXCJncmVlblwiOiByZXR1cm4gMzJcbiAgICBjYXNlIFwibGlnaHRcIjogcmV0dXJuIDkwXG5cbiAgICBjYXNlIFwiZGlmZiBndXR0ZXJcIjogcmV0dXJuIDkwXG4gICAgY2FzZSBcImRpZmYgYWRkZWRcIjogcmV0dXJuIDMyXG4gICAgY2FzZSBcImRpZmYgcmVtb3ZlZFwiOiByZXR1cm4gMzFcbiAgICBkZWZhdWx0OiB0aHJvdyBuZXcgVHlwZUVycm9yKFwiSW52YWxpZCBuYW1lOiBcXFwiXCIgKyBuYW1lICsgXCJcXFwiXCIpXG4gICAgfVxufVxuXG5leHBvcnRzLmNvbG9yID0gZnVuY3Rpb24gKG5hbWUsIHN0cikge1xuICAgIGlmIChDb2xvcnMuc3VwcG9ydGVkKCkpIHtcbiAgICAgICAgcmV0dXJuIFwiXFx1MDAxYltcIiArIGNvbG9yVG9OdW1iZXIobmFtZSkgKyBcIm1cIiArIHN0ciArIFwiXFx1MDAxYlswbVwiXG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHN0ciArIFwiXCJcbiAgICB9XG59XG5cbmV4cG9ydHMuc2V0Q29sb3IgPSBmdW5jdGlvbiAoXykge1xuICAgIGlmIChfLm9wdHMuY29sb3IgIT0gbnVsbCkgQ29sb3JzLm1heWJlU2V0KF8ub3B0cy5jb2xvcilcbn1cblxuZXhwb3J0cy51bnNldENvbG9yID0gZnVuY3Rpb24gKF8pIHtcbiAgICBpZiAoXy5vcHRzLmNvbG9yICE9IG51bGwpIENvbG9ycy5tYXliZVJlc3RvcmUoKVxufVxuXG52YXIgU3RhdHVzID0gZXhwb3J0cy5TdGF0dXMgPSBPYmplY3QuZnJlZXplKHtcbiAgICBVbmtub3duOiAwLFxuICAgIFNraXBwZWQ6IDEsXG4gICAgUGFzc2luZzogMixcbiAgICBGYWlsaW5nOiAzLFxufSlcblxuZXhwb3J0cy5UcmVlID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgdGhpcy52YWx1ZSA9IHZhbHVlXG4gICAgdGhpcy5zdGF0dXMgPSBTdGF0dXMuVW5rbm93blxuICAgIHRoaXMuY2hpbGRyZW4gPSBPYmplY3QuY3JlYXRlKG51bGwpXG59XG5cbmV4cG9ydHMuZGVmYXVsdGlmeSA9IGZ1bmN0aW9uIChfLCBvcHRzLCBwcm9wKSB7XG4gICAgaWYgKF8ubWV0aG9kcy5hY2NlcHRzLmluZGV4T2YocHJvcCkgPj0gMCkge1xuICAgICAgICB2YXIgdXNlZCA9IG9wdHMgIT0gbnVsbCAmJiB0eXBlb2Ygb3B0c1twcm9wXSA9PT0gXCJmdW5jdGlvblwiXG4gICAgICAgICAgICA/IG9wdHNcbiAgICAgICAgICAgIDogU2V0dGluZ3MuZGVmYXVsdE9wdHMoKVxuXG4gICAgICAgIF8ub3B0c1twcm9wXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodXNlZFtwcm9wXS5hcHBseSh1c2VkLCBhcmd1bWVudHMpKVxuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBqb2luUGF0aChyZXBvcnRQYXRoKSB7XG4gICAgdmFyIHBhdGggPSBcIlwiXG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlcG9ydFBhdGgubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgcGF0aCArPSBcIiBcIiArIHJlcG9ydFBhdGhbaV0ubmFtZVxuICAgIH1cblxuICAgIHJldHVybiBwYXRoLnNsaWNlKDEpXG59XG5cbmV4cG9ydHMuam9pblBhdGggPSBmdW5jdGlvbiAocmVwb3J0KSB7XG4gICAgcmV0dXJuIGpvaW5QYXRoKHJlcG9ydC5wYXRoKVxufVxuXG5leHBvcnRzLnNwZWVkID0gZnVuY3Rpb24gKHJlcG9ydCkge1xuICAgIGlmIChyZXBvcnQuZHVyYXRpb24gPj0gcmVwb3J0LnNsb3cpIHJldHVybiBcInNsb3dcIlxuICAgIGlmIChyZXBvcnQuZHVyYXRpb24gPj0gcmVwb3J0LnNsb3cgLyAyKSByZXR1cm4gXCJtZWRpdW1cIlxuICAgIGlmIChyZXBvcnQuZHVyYXRpb24gPj0gMCkgcmV0dXJuIFwiZmFzdFwiXG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCJEdXJhdGlvbiBtdXN0IG5vdCBiZSBuZWdhdGl2ZVwiKVxufVxuXG5leHBvcnRzLmZvcm1hdFRpbWUgPSAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBzID0gMTAwMCAvKiBtcyAqL1xuICAgIHZhciBtID0gNjAgKiBzXG4gICAgdmFyIGggPSA2MCAqIG1cbiAgICB2YXIgZCA9IDI0ICogaFxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChtcykge1xuICAgICAgICBpZiAobXMgPj0gZCkgcmV0dXJuIE1hdGgucm91bmQobXMgLyBkKSArIFwiZFwiXG4gICAgICAgIGlmIChtcyA+PSBoKSByZXR1cm4gTWF0aC5yb3VuZChtcyAvIGgpICsgXCJoXCJcbiAgICAgICAgaWYgKG1zID49IG0pIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gbSkgKyBcIm1cIlxuICAgICAgICBpZiAobXMgPj0gcykgcmV0dXJuIE1hdGgucm91bmQobXMgLyBzKSArIFwic1wiXG4gICAgICAgIHJldHVybiBtcyArIFwibXNcIlxuICAgIH1cbn0pKClcblxuZXhwb3J0cy5mb3JtYXRSZXN0ID0gZnVuY3Rpb24gKHJlcG9ydCkge1xuICAgIGlmICghcmVwb3J0LmlzSG9vaykgcmV0dXJuIFwiXCJcbiAgICB2YXIgcGF0aCA9IFwiIChcIlxuXG4gICAgaWYgKHJlcG9ydC5yb290UGF0aC5sZW5ndGgpIHtcbiAgICAgICAgcGF0aCArPSByZXBvcnQuc3RhZ2VcbiAgICAgICAgaWYgKHJlcG9ydC5uYW1lKSBwYXRoICs9IFwiIOKAkiBcIiArIHJlcG9ydC5uYW1lXG4gICAgICAgIGlmIChyZXBvcnQucGF0aC5sZW5ndGggPiByZXBvcnQucm9vdFBhdGgubGVuZ3RoICsgMSkge1xuICAgICAgICAgICAgcGF0aCArPSBcIiwgaW4gXCIgKyBqb2luUGF0aChyZXBvcnQucm9vdFBhdGgpXG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBwYXRoICs9IFwiZ2xvYmFsIFwiICsgcmVwb3J0LnN0YWdlXG4gICAgICAgIGlmIChyZXBvcnQubmFtZSkgcGF0aCArPSBcIiDigJIgXCIgKyByZXBvcnQubmFtZVxuICAgIH1cblxuICAgIHJldHVybiBwYXRoICsgXCIpXCJcbn1cblxuLy8gZXhwb3J0cy51bmlmaWVkRGlmZiA9IGZ1bmN0aW9uIChlcnIpIHtcbi8vICAgICB2YXIgbXNnID0gZGlmZi5jcmVhdGVQYXRjaChcInN0cmluZ1wiLCBlcnIuYWN0dWFsLCBlcnIuZXhwZWN0ZWQpXG4vLyAgICAgdmFyIGxpbmVzID0gbXNnLnNwbGl0KFNldHRpbmdzLm5ld2xpbmUoKSkuc2xpY2UoMCwgNClcbi8vICAgICB2YXIgcmV0ID0gU2V0dGluZ3MubmV3bGluZSgpICsgXCIgICAgICBcIiArXG4vLyAgICAgICAgIGNvbG9yKFwiZGlmZiBhZGRlZFwiLCBcIisgZXhwZWN0ZWRcIikgKyBcIiBcIiArXG4vLyAgICAgICAgIGNvbG9yKFwiZGlmZiByZW1vdmVkXCIsIFwiLSBhY3R1YWxcIikgK1xuLy8gICAgICAgICBTZXR0aW5ncy5uZXdsaW5lKClcbi8vXG4vLyAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaW5lcy5sZW5ndGg7IGkrKykge1xuLy8gICAgICAgICB2YXIgbGluZSA9IGxpbmVzW2ldXG4vL1xuLy8gICAgICAgICBpZiAobGluZVswXSA9PT0gXCIrXCIpIHtcbi8vICAgICAgICAgICAgIHJldCArPSBTZXR0aW5ncy5uZXdsaW5lKCkgKyBcIiAgICAgIFwiICsgY29sb3IoXCJkaWZmIGFkZGVkXCIsIGxpbmUpXG4vLyAgICAgICAgIH0gZWxzZSBpZiAobGluZVswXSA9PT0gXCItXCIpIHtcbi8vICAgICAgICAgICAgIHJldCArPSBTZXR0aW5ncy5uZXdsaW5lKCkgKyBcIiAgICAgIFwiICtcbi8vICAgICAgICAgICAgICAgICBjb2xvcihcImRpZmYgcmVtb3ZlZFwiLCBsaW5lKVxuLy8gICAgICAgICB9IGVsc2UgaWYgKCEvXFxAXFxAfFxcXFwgTm8gbmV3bGluZS8udGVzdChsaW5lKSkge1xuLy8gICAgICAgICAgICAgcmV0ICs9IFNldHRpbmdzLm5ld2xpbmUoKSArIFwiICAgICAgXCIgKyBsaW5lXG4vLyAgICAgICAgIH1cbi8vICAgICB9XG4vL1xuLy8gICAgIHJldHVybiByZXRcbi8vIH1cbiIsIlwidXNlIHN0cmljdFwiXG5cbi8vIEdlbmVyYWwgQ0xJIGFuZCByZXBvcnRlciBzZXR0aW5ncy4gSWYgc29tZXRoaW5nIG5lZWRzIHRvXG5cbnZhciBDb25zb2xlID0gcmVxdWlyZShcIi4vcmVwbGFjZWQvY29uc29sZVwiKVxuXG52YXIgd2luZG93V2lkdGggPSBDb25zb2xlLndpbmRvd1dpZHRoXG52YXIgbmV3bGluZSA9IENvbnNvbGUubmV3bGluZVxudmFyIFN5bWJvbHMgPSBDb25zb2xlLlN5bWJvbHNcbnZhciBkZWZhdWx0T3B0cyA9IENvbnNvbGUuZGVmYXVsdE9wdHNcblxuZXhwb3J0cy53aW5kb3dXaWR0aCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHdpbmRvd1dpZHRoIH1cbmV4cG9ydHMubmV3bGluZSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIG5ld2xpbmUgfVxuZXhwb3J0cy5zeW1ib2xzID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gU3ltYm9scyB9XG5leHBvcnRzLmRlZmF1bHRPcHRzID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gZGVmYXVsdE9wdHMgfVxuXG5leHBvcnRzLnNldFdpbmRvd1dpZHRoID0gZnVuY3Rpb24gKHZhbHVlKSB7IHJldHVybiB3aW5kb3dXaWR0aCA9IHZhbHVlIH1cbmV4cG9ydHMuc2V0TmV3bGluZSA9IGZ1bmN0aW9uICh2YWx1ZSkgeyByZXR1cm4gbmV3bGluZSA9IHZhbHVlIH1cbmV4cG9ydHMuc2V0U3ltYm9scyA9IGZ1bmN0aW9uICh2YWx1ZSkgeyByZXR1cm4gU3ltYm9scyA9IHZhbHVlIH1cbmV4cG9ydHMuc2V0RGVmYXVsdE9wdHMgPSBmdW5jdGlvbiAodmFsdWUpIHsgcmV0dXJuIGRlZmF1bHRPcHRzID0gdmFsdWUgfVxuXG4vLyBDb25zb2xlLmNvbG9yU3VwcG9ydCBpcyBhIG1hc2sgd2l0aCB0aGUgZm9sbG93aW5nIGJpdHM6XG4vLyAweDEgLSBpZiBzZXQsIGNvbG9ycyBzdXBwb3J0ZWQgYnkgZGVmYXVsdFxuLy8gMHgyIC0gaWYgc2V0LCBmb3JjZSBjb2xvciBzdXBwb3J0XG4vL1xuLy8gVGhpcyBpcyBwdXJlbHkgYW4gaW1wbGVtZW50YXRpb24gZGV0YWlsLCBhbmQgaXMgaW52aXNpYmxlIHRvIHRoZSBvdXRzaWRlXG4vLyB3b3JsZC5cbnZhciBjb2xvclN1cHBvcnQgPSBDb25zb2xlLmNvbG9yU3VwcG9ydFxudmFyIG1hc2sgPSBjb2xvclN1cHBvcnRcblxuZXhwb3J0cy5Db2xvcnMgPSB7XG4gICAgc3VwcG9ydGVkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiAobWFzayAmIDB4MSkgIT09IDBcbiAgICB9LFxuXG4gICAgZm9yY2VkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiAobWFzayAmIDB4MikgIT09IDBcbiAgICB9LFxuXG4gICAgbWF5YmVTZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICBpZiAoKG1hc2sgJiAweDIpID09PSAwKSBtYXNrID0gdmFsdWUgPyAweDEgOiAwXG4gICAgfSxcblxuICAgIG1heWJlUmVzdG9yZTogZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoKG1hc2sgJiAweDIpID09PSAwKSBtYXNrID0gY29sb3JTdXBwb3J0ICYgMHgxXG4gICAgfSxcblxuICAgIC8vIE9ubHkgZm9yIGRlYnVnZ2luZ1xuICAgIGZvcmNlU2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgbWFzayA9IHZhbHVlID8gMHgzIDogMHgyXG4gICAgfSxcblxuICAgIGZvcmNlUmVzdG9yZTogZnVuY3Rpb24gKCkge1xuICAgICAgICBtYXNrID0gY29sb3JTdXBwb3J0XG4gICAgfSxcblxuICAgIGdldFN1cHBvcnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN1cHBvcnRlZDogKGNvbG9yU3VwcG9ydCAmIDB4MSkgIT09IDAsXG4gICAgICAgICAgICBmb3JjZWQ6IChjb2xvclN1cHBvcnQgJiAweDIpICE9PSAwLFxuICAgICAgICB9XG4gICAgfSxcblxuICAgIHNldFN1cHBvcnQ6IGZ1bmN0aW9uIChvcHRzKSB7XG4gICAgICAgIG1hc2sgPSBjb2xvclN1cHBvcnQgPVxuICAgICAgICAgICAgKG9wdHMuc3VwcG9ydGVkID8gMHgxIDogMCkgfCAob3B0cy5mb3JjZWQgPyAweDIgOiAwKVxuICAgIH0sXG59XG4iLCJcInVzZSBzdHJpY3RcIlxuXG5leHBvcnRzLmdldFR5cGUgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICBpZiAodmFsdWUgPT0gbnVsbCkgcmV0dXJuIFwibnVsbFwiXG4gICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSByZXR1cm4gXCJhcnJheVwiXG4gICAgcmV0dXJuIHR5cGVvZiB2YWx1ZVxufVxuXG4vLyBQaGFudG9tSlMsIElFLCBhbmQgcG9zc2libHkgRWRnZSBkb24ndCBzZXQgdGhlIHN0YWNrIHRyYWNlIHVudGlsIHRoZSBlcnJvciBpc1xuLy8gdGhyb3duLiBOb3RlIHRoYXQgdGhpcyBwcmVmZXJzIGFuIGV4aXN0aW5nIHN0YWNrIGZpcnN0LCBzaW5jZSBub24tbmF0aXZlXG4vLyBlcnJvcnMgbGlrZWx5IGFscmVhZHkgY29udGFpbiB0aGlzLiBOb3RlIHRoYXQgdGhpcyBpc24ndCBuZWNlc3NhcnkgaW4gdGhlXG4vLyBDTEkgLSB0aGF0IG9ubHkgdGFyZ2V0cyBOb2RlLlxuZXhwb3J0cy5nZXRTdGFjayA9IGZ1bmN0aW9uIChlKSB7XG4gICAgdmFyIHN0YWNrID0gZS5zdGFja1xuXG4gICAgaWYgKCEoZSBpbnN0YW5jZW9mIEVycm9yKSB8fCBzdGFjayAhPSBudWxsKSByZXR1cm4gc3RhY2tcblxuICAgIHRyeSB7XG4gICAgICAgIHRocm93IGVcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHJldHVybiBlLnN0YWNrXG4gICAgfVxufVxuXG5leHBvcnRzLnBjYWxsID0gZnVuY3Rpb24gKGZ1bmMpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICByZXR1cm4gZnVuYyhmdW5jdGlvbiAoZSwgdmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybiBlICE9IG51bGwgPyByZWplY3QoZSkgOiByZXNvbHZlKHZhbHVlKVxuICAgICAgICB9KVxuICAgIH0pXG59XG5cbmV4cG9ydHMucGVhY2ggPSBmdW5jdGlvbiAobGlzdCwgZnVuYykge1xuICAgIHZhciBsZW4gPSBsaXN0Lmxlbmd0aFxuICAgIHZhciBwID0gUHJvbWlzZS5yZXNvbHZlKClcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgcCA9IHAudGhlbihmdW5jLmJpbmQodW5kZWZpbmVkLCBsaXN0W2ldLCBpKSlcbiAgICB9XG5cbiAgICByZXR1cm4gcFxufVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxuLyogZ2xvYmFsIFN5bWJvbCwgVWludDhBcnJheSwgRGF0YVZpZXcsIEFycmF5QnVmZmVyLCBBcnJheUJ1ZmZlclZpZXcsIE1hcCxcbiAgICBTZXQgKi9cblxuLyoqXG4gKiBEZWVwIG1hdGNoaW5nIGFsZ29yaXRobSBmb3IgYHQubWF0Y2hgIGFuZCBgdC5kZWVwRXF1YWxgLCB3aXRoIHplcm9cbiAqIGRlcGVuZGVuY2llcy4gTm90ZSB0aGUgZm9sbG93aW5nOlxuICpcbiAqIC0gVGhpcyBpcyByZWxhdGl2ZWx5IHBlcmZvcm1hbmNlLXR1bmVkLCBhbHRob3VnaCBpdCBwcmVmZXJzIGhpZ2ggY29ycmVjdG5lc3MuXG4gKiAgIFBhdGNoIHdpdGggY2FyZSwgc2luY2UgcGVyZm9ybWFuY2UgaXMgYSBjb25jZXJuLlxuICogLSBUaGlzIGRvZXMgcGFjayBhICpsb3QqIG9mIGZlYXR1cmVzLiBUaGVyZSdzIGEgcmVhc29uIHdoeSB0aGlzIGlzIHNvIGxvbmcuXG4gKiAtIFNvbWUgb2YgdGhlIGR1cGxpY2F0aW9uIGlzIGludGVudGlvbmFsLiBJdCdzIGdlbmVyYWxseSBjb21tZW50ZWQsIGJ1dCBpdCdzXG4gKiAgIG1haW5seSBmb3IgcGVyZm9ybWFuY2UsIHNpbmNlIHRoZSBlbmdpbmUgbmVlZHMgaXRzIHR5cGUgaW5mby5cbiAqIC0gUG9seWZpbGxlZCBjb3JlLWpzIFN5bWJvbHMgZnJvbSBjcm9zcy1vcmlnaW4gY29udGV4dHMgd2lsbCBuZXZlciByZWdpc3RlclxuICogICBhcyBiZWluZyBhY3R1YWwgU3ltYm9scy5cbiAqXG4gKiBBbmQgaW4gY2FzZSB5b3UncmUgd29uZGVyaW5nIGFib3V0IHRoZSBsb25nZXIgZnVuY3Rpb25zIGFuZCBvY2Nhc2lvbmFsXG4gKiByZXBldGl0aW9uLCBpdCdzIGJlY2F1c2UgVjgncyBpbmxpbmVyIGlzbid0IGFsd2F5cyBpbnRlbGxpZ2VudCBlbm91Z2ggdG8gZGVhbFxuICogd2l0aCB0aGUgc3VwZXIgaGlnaGx5IHBvbHltb3JwaGljIGRhdGEgdGhpcyBvZnRlbiBkZWFscyB3aXRoLCBhbmQgSlMgZG9lc24ndFxuICogaGF2ZSBjb21waWxlLXRpbWUgbWFjcm9zLiAoQWxzbywgU3dlZXQuanMgaXNuJ3Qgd29ydGggdGhlIGhhc3NsZS4pXG4gKi9cblxudmFyIG9iamVjdFRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZ1xudmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHlcblxudmFyIHN1cHBvcnRzVW5pY29kZSA9IGhhc093bi5jYWxsKFJlZ0V4cC5wcm90b3R5cGUsIFwidW5pY29kZVwiKVxudmFyIHN1cHBvcnRzU3RpY2t5ID0gaGFzT3duLmNhbGwoUmVnRXhwLnByb3RvdHlwZSwgXCJzdGlja3lcIilcblxuLy8gTGVnYWN5IGVuZ2luZXMgaGF2ZSBzZXZlcmFsIGlzc3VlcyB3aGVuIGl0IGNvbWVzIHRvIGB0eXBlb2ZgLlxudmFyIGlzRnVuY3Rpb24gPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFNsb3dJc0Z1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIGlmICh2YWx1ZSA9PSBudWxsKSByZXR1cm4gZmFsc2VcblxuICAgICAgICB2YXIgdGFnID0gb2JqZWN0VG9TdHJpbmcuY2FsbCh2YWx1ZSlcblxuICAgICAgICByZXR1cm4gdGFnID09PSBcIltvYmplY3QgRnVuY3Rpb25dXCIgfHxcbiAgICAgICAgICAgIHRhZyA9PT0gXCJbb2JqZWN0IEdlbmVyYXRvckZ1bmN0aW9uXVwiIHx8XG4gICAgICAgICAgICB0YWcgPT09IFwiW29iamVjdCBBc3luY0Z1bmN0aW9uXVwiIHx8XG4gICAgICAgICAgICB0YWcgPT09IFwiW29iamVjdCBQcm94eV1cIlxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzUG9pc29uZWQob2JqZWN0KSB7XG4gICAgICAgIHJldHVybiBvYmplY3QgIT0gbnVsbCAmJiB0eXBlb2Ygb2JqZWN0ICE9PSBcImZ1bmN0aW9uXCJcbiAgICB9XG5cbiAgICAvLyBJbiBTYWZhcmkgMTAsIGB0eXBlb2YgUHJveHkgPT09IFwib2JqZWN0XCJgXG4gICAgaWYgKGlzUG9pc29uZWQoZ2xvYmFsLlByb3h5KSkgcmV0dXJuIFNsb3dJc0Z1bmN0aW9uXG5cbiAgICAvLyBJbiBTYWZhcmkgOCwgc2V2ZXJhbCB0eXBlZCBhcnJheSBjb25zdHJ1Y3RvcnMgYXJlIGB0eXBlb2YgQyA9PT0gXCJvYmplY3RcImBcbiAgICBpZiAoaXNQb2lzb25lZChnbG9iYWwuSW50OEFycmF5KSkgcmV0dXJuIFNsb3dJc0Z1bmN0aW9uXG5cbiAgICAvLyBJbiBvbGQgVjgsIFJlZ0V4cHMgYXJlIGNhbGxhYmxlXG4gICAgaWYgKHR5cGVvZiAveC8gPT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIFNsb3dJc0Z1bmN0aW9uIC8vIGVzbGludC1kaXNhYmxlLWxpbmVcblxuICAgIC8vIExlYXZlIHRoaXMgZm9yIG5vcm1hbCB0aGluZ3MuIEl0J3MgZWFzaWx5IGlubGluZWQuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIGlzRnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gXCJmdW5jdGlvblwiXG4gICAgfVxufSkoKVxuXG4vLyBTZXQgdXAgb3VyIG93biBidWZmZXIgY2hlY2suIFdlIHNob3VsZCBhbHdheXMgYWNjZXB0IHRoZSBwb2x5ZmlsbCwgZXZlbiBpblxuLy8gTm9kZS4gTm90ZSB0aGF0IGl0IHVzZXMgYGdsb2JhbC5CdWZmZXJgIHRvIGF2b2lkIGluY2x1ZGluZyBgYnVmZmVyYCBpbiB0aGVcbi8vIGJ1bmRsZS5cblxudmFyIEJ1ZmZlck5hdGl2ZSA9IDBcbnZhciBCdWZmZXJQb2x5ZmlsbCA9IDFcbnZhciBCdWZmZXJTYWZhcmkgPSAyXG5cbnZhciBidWZmZXJTdXBwb3J0ID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBGYWtlQnVmZmVyKCkge31cbiAgICBGYWtlQnVmZmVyLmlzQnVmZmVyID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdHJ1ZSB9XG5cbiAgICAvLyBPbmx5IFNhZmFyaSA1LTcgaGFzIGV2ZXIgaGFkIHRoaXMgaXNzdWUuXG4gICAgaWYgKG5ldyBGYWtlQnVmZmVyKCkuY29uc3RydWN0b3IgIT09IEZha2VCdWZmZXIpIHJldHVybiBCdWZmZXJTYWZhcmlcbiAgICBpZiAoIWlzRnVuY3Rpb24oZ2xvYmFsLkJ1ZmZlcikpIHJldHVybiBCdWZmZXJQb2x5ZmlsbFxuICAgIGlmICghaXNGdW5jdGlvbihnbG9iYWwuQnVmZmVyLmlzQnVmZmVyKSkgcmV0dXJuIEJ1ZmZlclBvbHlmaWxsXG4gICAgLy8gQXZvaWQgdGhlIHBvbHlmaWxsXG4gICAgaWYgKGdsb2JhbC5CdWZmZXIuaXNCdWZmZXIobmV3IEZha2VCdWZmZXIoKSkpIHJldHVybiBCdWZmZXJQb2x5ZmlsbFxuICAgIHJldHVybiBCdWZmZXJOYXRpdmVcbn0pKClcblxudmFyIGdsb2JhbElzQnVmZmVyID0gYnVmZmVyU3VwcG9ydCA9PT0gQnVmZmVyTmF0aXZlXG4gICAgPyBnbG9iYWwuQnVmZmVyLmlzQnVmZmVyXG4gICAgOiB1bmRlZmluZWRcblxuZnVuY3Rpb24gaXNCdWZmZXIob2JqZWN0KSB7XG4gICAgaWYgKGJ1ZmZlclN1cHBvcnQgPT09IEJ1ZmZlck5hdGl2ZSAmJiBnbG9iYWxJc0J1ZmZlcihvYmplY3QpKSByZXR1cm4gdHJ1ZVxuICAgIGlmIChidWZmZXJTdXBwb3J0ID09PSBCdWZmZXJTYWZhcmkgJiYgb2JqZWN0Ll9pc0J1ZmZlcikgcmV0dXJuIHRydWVcblxuICAgIHZhciBCID0gb2JqZWN0LmNvbnN0cnVjdG9yXG5cbiAgICBpZiAoIWlzRnVuY3Rpb24oQikpIHJldHVybiBmYWxzZVxuICAgIGlmICghaXNGdW5jdGlvbihCLmlzQnVmZmVyKSkgcmV0dXJuIGZhbHNlXG4gICAgcmV0dXJuIEIuaXNCdWZmZXIob2JqZWN0KVxufVxuXG4vLyBjb3JlLWpzJyBzeW1ib2xzIGFyZSBvYmplY3RzLCBhbmQgc29tZSBvbGQgdmVyc2lvbnMgb2YgVjggZXJyb25lb3VzbHkgaGFkXG4vLyBgdHlwZW9mIFN5bWJvbCgpID09PSBcIm9iamVjdFwiYC5cbnZhciBzeW1ib2xzQXJlT2JqZWN0cyA9IGlzRnVuY3Rpb24oZ2xvYmFsLlN5bWJvbCkgJiZcbiAgICB0eXBlb2YgU3ltYm9sKCkgPT09IFwib2JqZWN0XCJcblxuLy8gYGNvbnRleHRgIGlzIGEgYml0IGZpZWxkLCB3aXRoIHRoZSBmb2xsb3dpbmcgYml0cy4gVGhpcyBpcyBub3QgYXMgbXVjaCBmb3Jcbi8vIHBlcmZvcm1hbmNlIHRoYW4gdG8ganVzdCByZWR1Y2UgdGhlIG51bWJlciBvZiBwYXJhbWV0ZXJzIEkgbmVlZCB0byBiZVxuLy8gdGhyb3dpbmcgYXJvdW5kLlxudmFyIFN0cmljdCA9IDFcbnZhciBJbml0aWFsID0gMlxudmFyIFNhbWVQcm90byA9IDRcblxuZXhwb3J0cy5tYXRjaCA9IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgcmV0dXJuIG1hdGNoKGEsIGIsIEluaXRpYWwsIHVuZGVmaW5lZCwgdW5kZWZpbmVkKVxufVxuXG5leHBvcnRzLnN0cmljdCA9IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgcmV0dXJuIG1hdGNoKGEsIGIsIFN0cmljdCB8IEluaXRpYWwsIHVuZGVmaW5lZCwgdW5kZWZpbmVkKVxufVxuXG4vLyBGZWF0dXJlLXRlc3QgZGVsYXllZCBzdGFjayBhZGRpdGlvbnMgYW5kIGV4dHJhIGtleXMuIFBoYW50b21KUyBhbmQgSUUgYm90aFxuLy8gd2FpdCB1bnRpbCB0aGUgZXJyb3Igd2FzIGFjdHVhbGx5IHRocm93biBmaXJzdCwgYW5kIGFzc2lnbiB0aGVtIGFzIG93blxuLy8gcHJvcGVydGllcywgd2hpY2ggaXMgdW5oZWxwZnVsIGZvciBhc3NlcnRpb25zLiBUaGlzIHJldHVybnMgYSBmdW5jdGlvbiB0b1xuLy8gc3BlZWQgdXAgY2FzZXMgd2hlcmUgYE9iamVjdC5rZXlzYCBpcyBzdWZmaWNpZW50IChlLmcuIGluIENocm9tZS9GRi9Ob2RlKS5cbi8vXG4vLyBUaGlzIHdvdWxkbid0IGJlIG5lY2Vzc2FyeSBpZiB0aG9zZSBlbmdpbmVzIHdvdWxkIG1ha2UgdGhlIHN0YWNrIGEgZ2V0dGVyLFxuLy8gYW5kIHJlY29yZCBpdCB3aGVuIHRoZSBlcnJvciB3YXMgY3JlYXRlZCwgbm90IHdoZW4gaXQgd2FzIHRocm93bi4gSXRcbi8vIHNwZWNpZmljYWxseSBmaWx0ZXJzIG91dCBlcnJvcnMgYW5kIG9ubHkgY2hlY2tzIGV4aXN0aW5nIGRlc2NyaXB0b3JzLCBqdXN0IHRvXG4vLyBrZWVwIHRoZSBtZXNzIGZyb20gYWZmZWN0aW5nIGV2ZXJ5dGhpbmcgKGl0J3Mgbm90IGZ1bGx5IGNvcnJlY3QsIGJ1dCBpdCdzXG4vLyBuZWNlc3NhcnkpLlxudmFyIHJlcXVpcmVzUHJveHkgPSAoZnVuY3Rpb24gKCkge1xuICAgIHZhciB0ZXN0ID0gbmV3IEVycm9yKClcbiAgICB2YXIgb2xkID0gT2JqZWN0LmNyZWF0ZShudWxsKVxuXG4gICAgT2JqZWN0LmtleXModGVzdCkuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7IG9sZFtrZXldID0gdHJ1ZSB9KVxuXG4gICAgdHJ5IHtcbiAgICAgICAgdGhyb3cgdGVzdFxuICAgIH0gY2F0Y2ggKF8pIHtcbiAgICAgICAgLy8gaWdub3JlXG4gICAgfVxuXG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKHRlc3QpLnNvbWUoZnVuY3Rpb24gKGtleSkgeyByZXR1cm4gIW9sZFtrZXldIH0pXG59KSgpXG5cbmZ1bmN0aW9uIGlzSWdub3JlZChvYmplY3QsIGtleSkge1xuICAgIHN3aXRjaCAoa2V5KSB7XG4gICAgY2FzZSBcImxpbmVcIjogaWYgKHR5cGVvZiBvYmplY3Rba2V5XSAhPT0gXCJudW1iZXJcIikgcmV0dXJuIGZhbHNlOyBicmVha1xuICAgIGNhc2UgXCJzb3VyY2VVUkxcIjogaWYgKHR5cGVvZiBvYmplY3Rba2V5XSAhPT0gXCJzdHJpbmdcIikgcmV0dXJuIGZhbHNlOyBicmVha1xuICAgIGNhc2UgXCJzdGFja1wiOiBpZiAodHlwZW9mIG9iamVjdFtrZXldICE9PSBcInN0cmluZ1wiKSByZXR1cm4gZmFsc2U7IGJyZWFrXG4gICAgZGVmYXVsdDogcmV0dXJuIGZhbHNlXG4gICAgfVxuXG4gICAgdmFyIGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKG9iamVjdCwga2V5KVxuXG4gICAgcmV0dXJuICFkZXNjLmNvbmZpZ3VyYWJsZSAmJiBkZXNjLmVudW1lcmFibGUgJiYgIWRlc2Mud3JpdGFibGVcbn1cblxuLy8gVGhpcyBpcyBvbmx5IGludm9rZWQgd2l0aCBlcnJvcnMsIHNvIGl0J3Mgbm90IGdvaW5nIHRvIHByZXNlbnQgYSBzaWduaWZpY2FudFxuLy8gc2xvdyBkb3duLlxuZnVuY3Rpb24gZ2V0S2V5c1N0cmlwcGVkKG9iamVjdCkge1xuICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMob2JqZWN0KVxuICAgIHZhciBjb3VudCA9IDBcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoIWlzSWdub3JlZChvYmplY3QsIGtleXNbaV0pKSBrZXlzW2NvdW50KytdID0ga2V5c1tpXVxuICAgIH1cblxuICAgIGtleXMubGVuZ3RoID0gY291bnRcbiAgICByZXR1cm4ga2V5c1xufVxuXG4vLyBXYXkgZmFzdGVyLCBzaW5jZSB0eXBlZCBhcnJheSBpbmRpY2VzIGFyZSBhbHdheXMgZGVuc2UgYW5kIGNvbnRhaW4gbnVtYmVycy5cblxuLy8gU2V0dXAgZm9yIGBpc0J1ZmZlck9yVmlld2AgYW5kIGBpc1ZpZXdgXG52YXIgQXJyYXlCdWZmZXJOb25lID0gMFxudmFyIEFycmF5QnVmZmVyTGVnYWN5ID0gMVxudmFyIEFycmF5QnVmZmVyQ3VycmVudCA9IDJcblxudmFyIGFycmF5QnVmZmVyU3VwcG9ydCA9IChmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCFpc0Z1bmN0aW9uKGdsb2JhbC5VaW50OEFycmF5KSkgcmV0dXJuIEFycmF5QnVmZmVyTm9uZVxuICAgIGlmICghaXNGdW5jdGlvbihnbG9iYWwuRGF0YVZpZXcpKSByZXR1cm4gQXJyYXlCdWZmZXJOb25lXG4gICAgaWYgKCFpc0Z1bmN0aW9uKGdsb2JhbC5BcnJheUJ1ZmZlcikpIHJldHVybiBBcnJheUJ1ZmZlck5vbmVcbiAgICBpZiAoaXNGdW5jdGlvbihnbG9iYWwuQXJyYXlCdWZmZXIuaXNWaWV3KSkgcmV0dXJuIEFycmF5QnVmZmVyQ3VycmVudFxuICAgIGlmIChpc0Z1bmN0aW9uKGdsb2JhbC5BcnJheUJ1ZmZlclZpZXcpKSByZXR1cm4gQXJyYXlCdWZmZXJMZWdhY3lcbiAgICByZXR1cm4gQXJyYXlCdWZmZXJOb25lXG59KSgpXG5cbi8vIElmIHR5cGVkIGFycmF5cyBhcmVuJ3Qgc3VwcG9ydGVkICh0aGV5IHdlcmVuJ3QgdGVjaG5pY2FsbHkgcGFydCBvZlxuLy8gRVM1LCBidXQgbWFueSBlbmdpbmVzIGltcGxlbWVudGVkIEtocm9ub3MnIHNwZWMgYmVmb3JlIEVTNiksIHRoZW5cbi8vIGp1c3QgZmFsbCBiYWNrIHRvIGdlbmVyaWMgYnVmZmVyIGRldGVjdGlvbi5cbmZ1bmN0aW9uIGZsb2F0SXMoYSwgYikge1xuICAgIC8vIFNvIE5hTnMgYXJlIGNvbnNpZGVyZWQgZXF1YWwuXG4gICAgcmV0dXJuIGEgPT09IGIgfHwgYSAhPT0gYSAmJiBiICE9PSBiIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tc2VsZi1jb21wYXJlXG59XG5cbmZ1bmN0aW9uIG1hdGNoVmlldyhhLCBiKSB7XG4gICAgdmFyIGNvdW50ID0gYS5sZW5ndGhcblxuICAgIGlmIChjb3VudCAhPT0gYi5sZW5ndGgpIHJldHVybiBmYWxzZVxuXG4gICAgd2hpbGUgKGNvdW50KSB7XG4gICAgICAgIGNvdW50LS1cbiAgICAgICAgaWYgKCFmbG9hdElzKGFbY291bnRdLCBiW2NvdW50XSkpIHJldHVybiBmYWxzZVxuICAgIH1cblxuICAgIHJldHVybiB0cnVlXG59XG5cbnZhciBpc1ZpZXcgPSAoZnVuY3Rpb24gKCkge1xuICAgIGlmIChhcnJheUJ1ZmZlclN1cHBvcnQgPT09IEFycmF5QnVmZmVyTm9uZSkgcmV0dXJuIHVuZGVmaW5lZFxuICAgIC8vIEVTNiB0eXBlZCBhcnJheXNcbiAgICBpZiAoYXJyYXlCdWZmZXJTdXBwb3J0ID09PSBBcnJheUJ1ZmZlckN1cnJlbnQpIHJldHVybiBBcnJheUJ1ZmZlci5pc1ZpZXdcbiAgICAvLyBsZWdhY3kgdHlwZWQgYXJyYXlzXG4gICAgcmV0dXJuIGZ1bmN0aW9uIGlzVmlldyhvYmplY3QpIHtcbiAgICAgICAgcmV0dXJuIG9iamVjdCBpbnN0YW5jZW9mIEFycmF5QnVmZmVyVmlld1xuICAgIH1cbn0pKClcblxuLy8gU3VwcG9ydCBjaGVja2luZyBtYXBzIGFuZCBzZXRzIGRlZXBseS4gVGhleSBhcmUgb2JqZWN0LWxpa2UgZW5vdWdoIHRvIGNvdW50LFxuLy8gYW5kIGFyZSB1c2VmdWwgaW4gdGhlaXIgb3duIHJpZ2h0LiBUaGUgY29kZSBpcyByYXRoZXIgbWVzc3ksIGJ1dCBtYWlubHkgdG9cbi8vIGtlZXAgdGhlIG9yZGVyLWluZGVwZW5kZW50IGNoZWNraW5nIGZyb20gYmVjb21pbmcgaW5zYW5lbHkgc2xvdy5cbnZhciBzdXBwb3J0c01hcCA9IGlzRnVuY3Rpb24oZ2xvYmFsLk1hcClcbnZhciBzdXBwb3J0c1NldCA9IGlzRnVuY3Rpb24oZ2xvYmFsLlNldClcblxuLy8gT25lIG9mIHRoZSBzZXRzIGFuZCBib3RoIG1hcHMnIGtleXMgYXJlIGNvbnZlcnRlZCB0byBhcnJheXMgZm9yIGZhc3RlclxuLy8gaGFuZGxpbmcuXG5mdW5jdGlvbiBrZXlMaXN0KG1hcCkge1xuICAgIHZhciBsaXN0ID0gbmV3IEFycmF5KG1hcC5zaXplKVxuICAgIHZhciBpID0gMFxuICAgIHZhciBpdGVyID0gbWFwLmtleXMoKVxuXG4gICAgZm9yICh2YXIgbmV4dCA9IGl0ZXIubmV4dCgpOyAhbmV4dC5kb25lOyBuZXh0ID0gaXRlci5uZXh0KCkpIHtcbiAgICAgICAgbGlzdFtpKytdID0gbmV4dC52YWx1ZVxuICAgIH1cblxuICAgIHJldHVybiBsaXN0XG59XG5cbi8vIFRoZSBwYWlyIG9mIGFycmF5cyBhcmUgYWxpZ25lZCBpbiBhIHNpbmdsZSBPKG5eMikgb3BlcmF0aW9uIChtb2QgZGVlcFxuLy8gbWF0Y2hpbmcgYW5kIHJvdGF0aW9uKSwgYWRhcHRpbmcgdG8gTyhuKSB3aGVuIHRoZXkncmUgYWxyZWFkeSBhbGlnbmVkLlxuZnVuY3Rpb24gbWF0Y2hLZXkoY3VycmVudCwgYWtleXMsIHN0YXJ0LCBlbmQsIGNvbnRleHQsIGxlZnQsIHJpZ2h0KSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LXBhcmFtcywgbWF4LWxlblxuICAgIGZvciAodmFyIGkgPSBzdGFydCArIDE7IGkgPCBlbmQ7IGkrKykge1xuICAgICAgICB2YXIga2V5ID0gYWtleXNbaV1cblxuICAgICAgICBpZiAobWF0Y2goY3VycmVudCwga2V5LCBjb250ZXh0LCBsZWZ0LCByaWdodCkpIHtcbiAgICAgICAgICAgIC8vIFRPRE86IG9uY2UgZW5naW5lcyBhY3R1YWxseSBvcHRpbWl6ZSBgY29weVdpdGhpbmAsIHVzZSB0aGF0XG4gICAgICAgICAgICAvLyBpbnN0ZWFkLiBJdCdsbCBiZSBtdWNoIGZhc3RlciB0aGFuIHRoaXMgbG9vcC5cbiAgICAgICAgICAgIHdoaWxlIChpID4gc3RhcnQpIGFrZXlzW2ldID0gYWtleXNbLS1pXVxuICAgICAgICAgICAgYWtleXNbaV0gPSBrZXlcbiAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2Vcbn1cblxuZnVuY3Rpb24gbWF0Y2hWYWx1ZXMoYSwgYiwgYWtleXMsIGJrZXlzLCBlbmQsIGNvbnRleHQsIGxlZnQsIHJpZ2h0KSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LXBhcmFtcywgbWF4LWxlblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZW5kOyBpKyspIHtcbiAgICAgICAgaWYgKCFtYXRjaChhLmdldChha2V5c1tpXSksIGIuZ2V0KGJrZXlzW2ldKSwgY29udGV4dCwgbGVmdCwgcmlnaHQpKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0cnVlXG59XG5cbi8vIFBvc3NpYmx5IGV4cGVuc2l2ZSBvcmRlci1pbmRlcGVuZGVudCBrZXktdmFsdWUgbWF0Y2guIEZpcnN0LCB0cnkgdG8gYXZvaWQgaXRcbi8vIGJ5IGNvbnNlcnZhdGl2ZWx5IGFzc3VtaW5nIGV2ZXJ5dGhpbmcgaXMgaW4gb3JkZXIgLSBhIGNoZWFwIE8obikgaXMgYWx3YXlzXG4vLyBuaWNlciB0aGFuIGFuIGV4cGVuc2l2ZSBPKG5eMikuXG5mdW5jdGlvbiBtYXRjaE1hcChhLCBiLCBjb250ZXh0LCBsZWZ0LCByaWdodCkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1wYXJhbXMsIG1heC1sZW5cbiAgICB2YXIgZW5kID0gYS5zaXplXG4gICAgdmFyIGFrZXlzID0ga2V5TGlzdChhKVxuICAgIHZhciBia2V5cyA9IGtleUxpc3QoYilcbiAgICB2YXIgaSA9IDBcblxuICAgIHdoaWxlIChpICE9PSBlbmQgJiYgbWF0Y2goYWtleXNbaV0sIGJrZXlzW2ldLCBjb250ZXh0LCBsZWZ0LCByaWdodCkpIHtcbiAgICAgICAgaSsrXG4gICAgfVxuXG4gICAgaWYgKGkgPT09IGVuZCkge1xuICAgICAgICByZXR1cm4gbWF0Y2hWYWx1ZXMoYSwgYiwgYWtleXMsIGJrZXlzLCBlbmQsIGNvbnRleHQsIGxlZnQsIHJpZ2h0KVxuICAgIH1cblxuICAgIC8vIERvbid0IGNvbXBhcmUgdGhlIHNhbWUga2V5IHR3aWNlXG4gICAgaWYgKCFtYXRjaEtleShia2V5c1tpXSwgYWtleXMsIGksIGVuZCwgY29udGV4dCwgbGVmdCwgcmlnaHQpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cblxuICAgIC8vIElmIHRoZSBhYm92ZSBmYWlscywgd2hpbGUgd2UncmUgYXQgaXQsIGxldCdzIHNvcnQgdGhlbSBhcyB3ZSBnbywgc29cbiAgICAvLyB0aGUga2V5IG9yZGVyIG1hdGNoZXMuXG4gICAgd2hpbGUgKCsraSA8IGVuZCkge1xuICAgICAgICB2YXIga2V5ID0gYmtleXNbaV1cblxuICAgICAgICAvLyBBZGFwdCBpZiB0aGUga2V5cyBhcmUgYWxyZWFkeSBpbiBvcmRlciwgd2hpY2ggaXMgZnJlcXVlbnRseSB0aGVcbiAgICAgICAgLy8gY2FzZS5cbiAgICAgICAgaWYgKCFtYXRjaChrZXksIGFrZXlzW2ldLCBjb250ZXh0LCBsZWZ0LCByaWdodCkgJiZcbiAgICAgICAgICAgICAgICAhbWF0Y2hLZXkoa2V5LCBha2V5cywgaSwgZW5kLCBjb250ZXh0LCBsZWZ0LCByaWdodCkpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG1hdGNoVmFsdWVzKGEsIGIsIGFrZXlzLCBia2V5cywgZW5kLCBjb250ZXh0LCBsZWZ0LCByaWdodClcbn1cblxuZnVuY3Rpb24gaGFzQWxsSWRlbnRpY2FsKGFsaXN0LCBiKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhbGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoIWIuaGFzKGFsaXN0W2ldKSkgcmV0dXJuIGZhbHNlXG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWVcbn1cblxuLy8gQ29tcGFyZSB0aGUgdmFsdWVzIHN0cnVjdHVyYWxseSwgYW5kIGluZGVwZW5kZW50IG9mIG9yZGVyLlxuZnVuY3Rpb24gc2VhcmNoRm9yKGF2YWx1ZSwgb2JqZWN0cywgY29udGV4dCwgbGVmdCwgcmlnaHQpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtcGFyYW1zLCBtYXgtbGVuXG4gICAgZm9yICh2YXIgaiBpbiBvYmplY3RzKSB7XG4gICAgICAgIGlmIChoYXNPd24uY2FsbChvYmplY3RzLCBqKSkge1xuICAgICAgICAgICAgaWYgKG1hdGNoKGF2YWx1ZSwgb2JqZWN0c1tqXSwgY29udGV4dCwgbGVmdCwgcmlnaHQpKSB7XG4gICAgICAgICAgICAgICAgZGVsZXRlIG9iamVjdHNbal1cbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlXG59XG5cbmZ1bmN0aW9uIGhhc1N0cnVjdHVyZSh2YWx1ZSwgY29udGV4dCkge1xuICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIgJiYgdmFsdWUgIT09IG51bGwgfHxcbiAgICAgICAgICAgICEoY29udGV4dCAmIFN0cmljdCkgJiYgdHlwZW9mIHZhbHVlID09PSBcInN5bWJvbFwiXG59XG5cbi8vIFRoZSBzZXQgYWxnb3JpdGhtIGlzIHN0cnVjdHVyZWQgYSBsaXR0bGUgZGlmZmVyZW50bHkuIEl0IHRha2VzIG9uZSBvZiB0aGVcbi8vIHNldHMgaW50byBhbiBhcnJheSwgZG9lcyBhIGNoZWFwIGlkZW50aXR5IGNoZWNrLCB0aGVuIGRvZXMgdGhlIGRlZXAgY2hlY2suXG5mdW5jdGlvbiBtYXRjaFNldChhLCBiLCBjb250ZXh0LCBsZWZ0LCByaWdodCkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1wYXJhbXMsIG1heC1sZW5cbiAgICAvLyBUaGlzIGlzIHRvIHRyeSB0byBhdm9pZCBhbiBleHBlbnNpdmUgc3RydWN0dXJhbCBtYXRjaCBvbiB0aGUga2V5cy4gVGVzdFxuICAgIC8vIGZvciBpZGVudGl0eSBmaXJzdC5cbiAgICB2YXIgYWxpc3QgPSBrZXlMaXN0KGEpXG5cbiAgICBpZiAoaGFzQWxsSWRlbnRpY2FsKGFsaXN0LCBiKSkgcmV0dXJuIHRydWVcblxuICAgIHZhciBpdGVyID0gYi52YWx1ZXMoKVxuICAgIHZhciBjb3VudCA9IDBcbiAgICB2YXIgb2JqZWN0c1xuXG4gICAgLy8gR2F0aGVyIGFsbCB0aGUgb2JqZWN0c1xuICAgIGZvciAodmFyIG5leHQgPSBpdGVyLm5leHQoKTsgIW5leHQuZG9uZTsgbmV4dCA9IGl0ZXIubmV4dCgpKSB7XG4gICAgICAgIHZhciBidmFsdWUgPSBuZXh0LnZhbHVlXG5cbiAgICAgICAgaWYgKGhhc1N0cnVjdHVyZShidmFsdWUsIGNvbnRleHQpKSB7XG4gICAgICAgICAgICAvLyBDcmVhdGUgdGhlIG9iamVjdHMgbWFwIGxhemlseS4gTm90ZSB0aGF0IHRoaXMgYWxzbyBncmFicyBTeW1ib2xzXG4gICAgICAgICAgICAvLyB3aGVuIG5vdCBzdHJpY3RseSBtYXRjaGluZywgc2luY2UgdGhlaXIgZGVzY3JpcHRpb24gaXMgY29tcGFyZWQuXG4gICAgICAgICAgICBpZiAoY291bnQgPT09IDApIG9iamVjdHMgPSBPYmplY3QuY3JlYXRlKG51bGwpXG4gICAgICAgICAgICBvYmplY3RzW2NvdW50KytdID0gYnZhbHVlXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBJZiBldmVyeXRoaW5nIGlzIGEgcHJpbWl0aXZlLCB0aGVuIGFib3J0LlxuICAgIGlmIChjb3VudCA9PT0gMCkgcmV0dXJuIGZhbHNlXG5cbiAgICAvLyBJdGVyYXRlIHRoZSBvYmplY3QsIHJlbW92aW5nIGVhY2ggb25lIHJlbWFpbmluZyB3aGVuIG1hdGNoZWQgKGFuZFxuICAgIC8vIGFib3J0aW5nIGlmIG5vbmUgY2FuIGJlKS5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcbiAgICAgICAgdmFyIGF2YWx1ZSA9IGFsaXN0W2ldXG5cbiAgICAgICAgaWYgKGhhc1N0cnVjdHVyZShhdmFsdWUsIGNvbnRleHQpKSB7XG4gICAgICAgICAgICBpZiAoIXNlYXJjaEZvcihhdmFsdWUsIG9iamVjdHMsIGNvbnRleHQsIGxlZnQsIHJpZ2h0KSkgcmV0dXJuIGZhbHNlXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZVxufVxuXG5mdW5jdGlvbiBtYXRjaFJlZ0V4cChhLCBiKSB7XG4gICAgcmV0dXJuIGEuc291cmNlID09PSBiLnNvdXJjZSAmJlxuICAgICAgICBhLmdsb2JhbCA9PT0gYi5nbG9iYWwgJiZcbiAgICAgICAgYS5pZ25vcmVDYXNlID09PSBiLmlnbm9yZUNhc2UgJiZcbiAgICAgICAgYS5tdWx0aWxpbmUgPT09IGIubXVsdGlsaW5lICYmXG4gICAgICAgICghc3VwcG9ydHNVbmljb2RlIHx8IGEudW5pY29kZSA9PT0gYi51bmljb2RlKSAmJlxuICAgICAgICAoIXN1cHBvcnRzU3RpY2t5IHx8IGEuc3RpY2t5ID09PSBiLnN0aWNreSlcbn1cblxuZnVuY3Rpb24gbWF0Y2hQcmVwYXJlRGVzY2VuZChhLCBiLCBjb250ZXh0LCBsZWZ0LCByaWdodCkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1wYXJhbXMsIG1heC1sZW5cbiAgICAvLyBDaGVjayBmb3IgY2lyY3VsYXIgcmVmZXJlbmNlcyBhZnRlciB0aGUgZmlyc3QgbGV2ZWwsIHdoZXJlIGl0J3NcbiAgICAvLyByZWR1bmRhbnQuIE5vdGUgdGhhdCB0aGV5IGhhdmUgdG8gcG9pbnQgdG8gdGhlIHNhbWUgbGV2ZWwgdG8gYWN0dWFsbHlcbiAgICAvLyBiZSBjb25zaWRlcmVkIGRlZXBseSBlcXVhbC5cbiAgICBpZiAoIShjb250ZXh0ICYgSW5pdGlhbCkpIHtcbiAgICAgICAgdmFyIGxlZnRJbmRleCA9IGxlZnQuaW5kZXhPZihhKVxuICAgICAgICB2YXIgcmlnaHRJbmRleCA9IHJpZ2h0LmluZGV4T2YoYilcblxuICAgICAgICBpZiAobGVmdEluZGV4ICE9PSByaWdodEluZGV4KSByZXR1cm4gZmFsc2VcbiAgICAgICAgaWYgKGxlZnRJbmRleCA+PSAwKSByZXR1cm4gdHJ1ZVxuXG4gICAgICAgIGxlZnQucHVzaChhKVxuICAgICAgICByaWdodC5wdXNoKGIpXG5cbiAgICAgICAgdmFyIHJlc3VsdCA9IG1hdGNoSW5uZXIoYSwgYiwgY29udGV4dCwgbGVmdCwgcmlnaHQpXG5cbiAgICAgICAgbGVmdC5wb3AoKVxuICAgICAgICByaWdodC5wb3AoKVxuXG4gICAgICAgIHJldHVybiByZXN1bHRcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbWF0Y2hJbm5lcihhLCBiLCBjb250ZXh0ICYgfkluaXRpYWwsIFthXSwgW2JdKVxuICAgIH1cbn1cblxuZnVuY3Rpb24gbWF0Y2hTYW1lUHJvdG8oYSwgYiwgY29udGV4dCwgbGVmdCwgcmlnaHQpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtcGFyYW1zLCBtYXgtbGVuXG4gICAgaWYgKHN5bWJvbHNBcmVPYmplY3RzICYmIGEgaW5zdGFuY2VvZiBTeW1ib2wpIHtcbiAgICAgICAgcmV0dXJuICEoY29udGV4dCAmIFN0cmljdCkgJiYgYS50b1N0cmluZygpID09PSBiLnRvU3RyaW5nKClcbiAgICB9XG5cbiAgICBpZiAoYSBpbnN0YW5jZW9mIFJlZ0V4cCkgcmV0dXJuIG1hdGNoUmVnRXhwKGEsIGIpXG4gICAgaWYgKGEgaW5zdGFuY2VvZiBEYXRlKSByZXR1cm4gYS52YWx1ZU9mKCkgPT09IGIudmFsdWVPZigpXG4gICAgaWYgKGFycmF5QnVmZmVyU3VwcG9ydCAhPT0gQXJyYXlCdWZmZXJOb25lKSB7XG4gICAgICAgIGlmIChhIGluc3RhbmNlb2YgRGF0YVZpZXcpIHtcbiAgICAgICAgICAgIHJldHVybiBtYXRjaFZpZXcoXG4gICAgICAgICAgICAgICAgbmV3IFVpbnQ4QXJyYXkoYS5idWZmZXIsIGEuYnl0ZU9mZnNldCwgYS5ieXRlTGVuZ3RoKSxcbiAgICAgICAgICAgICAgICBuZXcgVWludDhBcnJheShiLmJ1ZmZlciwgYi5ieXRlT2Zmc2V0LCBiLmJ5dGVMZW5ndGgpKVxuICAgICAgICB9XG4gICAgICAgIGlmIChhIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBtYXRjaFZpZXcobmV3IFVpbnQ4QXJyYXkoYSksIG5ldyBVaW50OEFycmF5KGIpKVxuICAgICAgICB9XG4gICAgICAgIGlmIChpc1ZpZXcoYSkpIHJldHVybiBtYXRjaFZpZXcoYSwgYilcbiAgICB9XG5cbiAgICBpZiAoaXNCdWZmZXIoYSkpIHJldHVybiBtYXRjaFZpZXcoYSwgYilcblxuICAgIGlmIChBcnJheS5pc0FycmF5KGEpKSB7XG4gICAgICAgIGlmIChhLmxlbmd0aCAhPT0gYi5sZW5ndGgpIHJldHVybiBmYWxzZVxuICAgICAgICBpZiAoYS5sZW5ndGggPT09IDApIHJldHVybiB0cnVlXG4gICAgfSBlbHNlIGlmIChzdXBwb3J0c01hcCAmJiBhIGluc3RhbmNlb2YgTWFwKSB7XG4gICAgICAgIGlmIChhLnNpemUgIT09IGIuc2l6ZSkgcmV0dXJuIGZhbHNlXG4gICAgICAgIGlmIChhLnNpemUgPT09IDApIHJldHVybiB0cnVlXG4gICAgfSBlbHNlIGlmIChzdXBwb3J0c1NldCAmJiBhIGluc3RhbmNlb2YgU2V0KSB7XG4gICAgICAgIGlmIChhLnNpemUgIT09IGIuc2l6ZSkgcmV0dXJuIGZhbHNlXG4gICAgICAgIGlmIChhLnNpemUgPT09IDApIHJldHVybiB0cnVlXG4gICAgfSBlbHNlIGlmIChvYmplY3RUb1N0cmluZy5jYWxsKGEpID09PSBcIltvYmplY3QgQXJndW1lbnRzXVwiKSB7XG4gICAgICAgIGlmIChvYmplY3RUb1N0cmluZy5jYWxsKGIpICE9PSBcIltvYmplY3QgQXJndW1lbnRzXVwiKSByZXR1cm4gZmFsc2VcbiAgICAgICAgaWYgKGEubGVuZ3RoICE9PSBiLmxlbmd0aCkgcmV0dXJuIGZhbHNlXG4gICAgICAgIGlmIChhLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHRydWVcbiAgICB9IGVsc2UgaWYgKG9iamVjdFRvU3RyaW5nLmNhbGwoYikgPT09IFwiW29iamVjdCBBcmd1bWVudHNdXCIpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuXG4gICAgcmV0dXJuIG1hdGNoUHJlcGFyZURlc2NlbmQoYSwgYiwgY29udGV4dCwgbGVmdCwgcmlnaHQpXG59XG5cbi8vIE1vc3Qgc3BlY2lhbCBjYXNlcyByZXF1aXJlIGJvdGggdHlwZXMgdG8gbWF0Y2gsIGFuZCBpZiBvbmx5IG9uZSBvZiB0aGVtIGFyZSxcbi8vIHRoZSBvYmplY3RzIHRoZW1zZWx2ZXMgZG9uJ3QgbWF0Y2guXG5mdW5jdGlvbiBtYXRjaERpZmZlcmVudFByb3RvKGEsIGIsIGNvbnRleHQsIGxlZnQsIHJpZ2h0KSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LXBhcmFtcywgbWF4LWxlblxuICAgIGlmIChzeW1ib2xzQXJlT2JqZWN0cykge1xuICAgICAgICBpZiAoYSBpbnN0YW5jZW9mIFN5bWJvbCB8fCBiIGluc3RhbmNlb2YgU3ltYm9sKSByZXR1cm4gZmFsc2VcbiAgICB9XG4gICAgaWYgKGNvbnRleHQgJiBTdHJpY3QpIHJldHVybiBmYWxzZVxuICAgIGlmIChhcnJheUJ1ZmZlclN1cHBvcnQgIT09IEFycmF5QnVmZmVyTm9uZSkge1xuICAgICAgICBpZiAoYSBpbnN0YW5jZW9mIEFycmF5QnVmZmVyIHx8IGIgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikgcmV0dXJuIGZhbHNlXG4gICAgICAgIGlmIChpc1ZpZXcoYSkgfHwgaXNWaWV3KGIpKSByZXR1cm4gZmFsc2VcbiAgICB9XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoYSkgfHwgQXJyYXkuaXNBcnJheShiKSkgcmV0dXJuIGZhbHNlXG4gICAgaWYgKHN1cHBvcnRzTWFwICYmIChhIGluc3RhbmNlb2YgTWFwIHx8IGIgaW5zdGFuY2VvZiBNYXApKSByZXR1cm4gZmFsc2VcbiAgICBpZiAoc3VwcG9ydHNTZXQgJiYgKGEgaW5zdGFuY2VvZiBTZXQgfHwgYiBpbnN0YW5jZW9mIFNldCkpIHJldHVybiBmYWxzZVxuICAgIGlmIChvYmplY3RUb1N0cmluZy5jYWxsKGEpID09PSBcIltvYmplY3QgQXJndW1lbnRzXVwiKSB7XG4gICAgICAgIGlmIChvYmplY3RUb1N0cmluZy5jYWxsKGIpICE9PSBcIltvYmplY3QgQXJndW1lbnRzXVwiKSByZXR1cm4gZmFsc2VcbiAgICAgICAgaWYgKGEubGVuZ3RoICE9PSBiLmxlbmd0aCkgcmV0dXJuIGZhbHNlXG4gICAgICAgIGlmIChhLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHRydWVcbiAgICB9XG4gICAgaWYgKG9iamVjdFRvU3RyaW5nLmNhbGwoYikgPT09IFwiW29iamVjdCBBcmd1bWVudHNdXCIpIHJldHVybiBmYWxzZVxuICAgIHJldHVybiBtYXRjaFByZXBhcmVEZXNjZW5kKGEsIGIsIGNvbnRleHQsIGxlZnQsIHJpZ2h0KVxufVxuXG5mdW5jdGlvbiBtYXRjaChhLCBiLCBjb250ZXh0LCBsZWZ0LCByaWdodCkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1wYXJhbXNcbiAgICBpZiAoYSA9PT0gYikgcmV0dXJuIHRydWVcbiAgICAvLyBOYU5zIGFyZSBlcXVhbFxuICAgIGlmIChhICE9PSBhKSByZXR1cm4gYiAhPT0gYiAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXNlbGYtY29tcGFyZVxuICAgIGlmIChhID09PSBudWxsIHx8IGIgPT09IG51bGwpIHJldHVybiBmYWxzZVxuICAgIGlmICh0eXBlb2YgYSA9PT0gXCJzeW1ib2xcIiAmJiB0eXBlb2YgYiA9PT0gXCJzeW1ib2xcIikge1xuICAgICAgICByZXR1cm4gIShjb250ZXh0ICYgU3RyaWN0KSAmJiBhLnRvU3RyaW5nKCkgPT09IGIudG9TdHJpbmcoKVxuICAgIH1cbiAgICBpZiAodHlwZW9mIGEgIT09IFwib2JqZWN0XCIgfHwgdHlwZW9mIGIgIT09IFwib2JqZWN0XCIpIHJldHVybiBmYWxzZVxuXG4gICAgLy8gVXN1YWxseSwgYm90aCBvYmplY3RzIGhhdmUgaWRlbnRpY2FsIHByb3RvdHlwZXMsIGFuZCB0aGF0IGFsbG93cyBmb3IgaGFsZlxuICAgIC8vIHRoZSB0eXBlIGNoZWNraW5nLlxuICAgIGlmIChPYmplY3QuZ2V0UHJvdG90eXBlT2YoYSkgPT09IE9iamVjdC5nZXRQcm90b3R5cGVPZihiKSkge1xuICAgICAgICByZXR1cm4gbWF0Y2hTYW1lUHJvdG8oYSwgYiwgY29udGV4dCB8IFNhbWVQcm90bywgbGVmdCwgcmlnaHQpXG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG1hdGNoRGlmZmVyZW50UHJvdG8oYSwgYiwgY29udGV4dCwgbGVmdCwgcmlnaHQpXG4gICAgfVxufVxuXG5mdW5jdGlvbiBtYXRjaEFycmF5TGlrZShhLCBiLCBjb250ZXh0LCBsZWZ0LCByaWdodCkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1wYXJhbXMsIG1heC1sZW5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKCFtYXRjaChhW2ldLCBiW2ldLCBjb250ZXh0LCBsZWZ0LCByaWdodCkpIHJldHVybiBmYWxzZVxuICAgIH1cblxuICAgIHJldHVybiB0cnVlXG59XG5cbi8vIFBoYW50b21KUyBhbmQgU2xpbWVySlMgYm90aCBoYXZlIG15c3RlcmlvdXMgaXNzdWVzIHdoZXJlIGBFcnJvcmAgaXMgc29tZXRpbWVzXG4vLyBlcnJvbmVvdXNseSBvZiBhIGRpZmZlcmVudCBgd2luZG93YCwgYW5kIGl0IHNob3dzIHVwIGluIHRoZSB0ZXN0cy4gVGhpcyBtZWFuc1xuLy8gSSBoYXZlIHRvIHVzZSBhIG11Y2ggc2xvd2VyIGFsZ29yaXRobSB0byBkZXRlY3QgRXJyb3JzLlxuLy9cbi8vIFBoYW50b21KUzogaHR0cHM6Ly9naXRodWIuY29tL3BldGthYW50b25vdi9ibHVlYmlyZC9pc3N1ZXMvMTE0NlxuLy8gU2xpbWVySlM6IGh0dHBzOi8vZ2l0aHViLmNvbS9sYXVyZW50ai9zbGltZXJqcy9pc3N1ZXMvNDAwXG4vL1xuLy8gKFllcywgdGhlIFBoYW50b21KUyBidWcgaXMgZGV0YWlsZWQgaW4gdGhlIEJsdWViaXJkIGlzc3VlIHRyYWNrZXIuKVxudmFyIGNoZWNrQ3Jvc3NPcmlnaW4gPSAoZnVuY3Rpb24gKCkge1xuICAgIGlmIChnbG9iYWwud2luZG93ID09IG51bGwgfHwgZ2xvYmFsLndpbmRvdy5uYXZpZ2F0b3IgPT0gbnVsbCkgcmV0dXJuIGZhbHNlXG4gICAgcmV0dXJuIC9zbGltZXJqc3xwaGFudG9tanMvaS50ZXN0KGdsb2JhbC53aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudClcbn0pKClcblxudmFyIGVycm9yU3RyaW5nVHlwZXMgPSB7XG4gICAgXCJbb2JqZWN0IEVycm9yXVwiOiB0cnVlLFxuICAgIFwiW29iamVjdCBFdmFsRXJyb3JdXCI6IHRydWUsXG4gICAgXCJbb2JqZWN0IFJhbmdlRXJyb3JdXCI6IHRydWUsXG4gICAgXCJbb2JqZWN0IFJlZmVyZW5jZUVycm9yXVwiOiB0cnVlLFxuICAgIFwiW29iamVjdCBTeW50YXhFcnJvcl1cIjogdHJ1ZSxcbiAgICBcIltvYmplY3QgVHlwZUVycm9yXVwiOiB0cnVlLFxuICAgIFwiW29iamVjdCBVUklFcnJvcl1cIjogdHJ1ZSxcbn1cblxuZnVuY3Rpb24gaXNQcm94aWVkRXJyb3Iob2JqZWN0KSB7XG4gICAgd2hpbGUgKG9iamVjdCAhPSBudWxsKSB7XG4gICAgICAgIGlmIChlcnJvclN0cmluZ1R5cGVzW29iamVjdFRvU3RyaW5nLmNhbGwob2JqZWN0KV0pIHJldHVybiB0cnVlXG4gICAgICAgIG9iamVjdCA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihvYmplY3QpXG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlXG59XG5cbmZ1bmN0aW9uIG1hdGNoSW5uZXIoYSwgYiwgY29udGV4dCwgbGVmdCwgcmlnaHQpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtc3RhdGVtZW50cywgbWF4LXBhcmFtcywgbWF4LWxlblxuICAgIHZhciBha2V5cywgYmtleXNcbiAgICB2YXIgaXNVbnByb3hpZWRFcnJvciA9IGZhbHNlXG5cbiAgICBpZiAoY29udGV4dCAmIFNhbWVQcm90bykge1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShhKSkgcmV0dXJuIG1hdGNoQXJyYXlMaWtlKGEsIGIsIGNvbnRleHQsIGxlZnQsIHJpZ2h0KVxuXG4gICAgICAgIGlmIChzdXBwb3J0c01hcCAmJiBhIGluc3RhbmNlb2YgTWFwKSB7XG4gICAgICAgICAgICByZXR1cm4gbWF0Y2hNYXAoYSwgYiwgY29udGV4dCwgbGVmdCwgcmlnaHQpXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc3VwcG9ydHNTZXQgJiYgYSBpbnN0YW5jZW9mIFNldCkge1xuICAgICAgICAgICAgcmV0dXJuIG1hdGNoU2V0KGEsIGIsIGNvbnRleHQsIGxlZnQsIHJpZ2h0KVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG9iamVjdFRvU3RyaW5nLmNhbGwoYSkgPT09IFwiW29iamVjdCBBcmd1bWVudHNdXCIpIHtcbiAgICAgICAgICAgIHJldHVybiBtYXRjaEFycmF5TGlrZShhLCBiLCBjb250ZXh0LCBsZWZ0LCByaWdodClcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChyZXF1aXJlc1Byb3h5ICYmXG4gICAgICAgICAgICAgICAgKGNoZWNrQ3Jvc3NPcmlnaW4gPyBpc1Byb3hpZWRFcnJvcihhKSA6IGEgaW5zdGFuY2VvZiBFcnJvcikpIHtcbiAgICAgICAgICAgIGFrZXlzID0gZ2V0S2V5c1N0cmlwcGVkKGEpXG4gICAgICAgICAgICBia2V5cyA9IGdldEtleXNTdHJpcHBlZChiKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYWtleXMgPSBPYmplY3Qua2V5cyhhKVxuICAgICAgICAgICAgYmtleXMgPSBPYmplY3Qua2V5cyhiKVxuICAgICAgICAgICAgaXNVbnByb3hpZWRFcnJvciA9IGEgaW5zdGFuY2VvZiBFcnJvclxuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKG9iamVjdFRvU3RyaW5nLmNhbGwoYSkgPT09IFwiW29iamVjdCBBcmd1bWVudHNdXCIpIHtcbiAgICAgICAgICAgIHJldHVybiBtYXRjaEFycmF5TGlrZShhLCBiLCBjb250ZXh0LCBsZWZ0LCByaWdodClcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIHdlIHJlcXVpcmUgYSBwcm94eSwgYmUgcGVybWlzc2l2ZSBhbmQgY2hlY2sgdGhlIGB0b1N0cmluZ2AgdHlwZS5cbiAgICAgICAgLy8gVGhpcyBpcyBzbyBpdCB3b3JrcyBjcm9zcy1vcmlnaW4gaW4gUGhhbnRvbUpTIGluIHBhcnRpY3VsYXIuXG4gICAgICAgIGlmIChhIGluc3RhbmNlb2YgRXJyb3IpIHJldHVybiBmYWxzZVxuICAgICAgICBha2V5cyA9IE9iamVjdC5rZXlzKGEpXG4gICAgICAgIGJrZXlzID0gT2JqZWN0LmtleXMoYilcbiAgICB9XG5cbiAgICB2YXIgY291bnQgPSBha2V5cy5sZW5ndGhcblxuICAgIGlmIChjb3VudCAhPT0gYmtleXMubGVuZ3RoKSByZXR1cm4gZmFsc2VcblxuICAgIC8vIFNob3J0Y3V0IGlmIHRoZXJlJ3Mgbm90aGluZyB0byBtYXRjaFxuICAgIGlmIChjb3VudCA9PT0gMCkgcmV0dXJuIHRydWVcblxuICAgIHZhciBpXG5cbiAgICBpZiAoaXNVbnByb3hpZWRFcnJvcikge1xuICAgICAgICAvLyBTaG9ydGN1dCBpZiB0aGUgcHJvcGVydGllcyBhcmUgZGlmZmVyZW50LlxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xuICAgICAgICAgICAgaWYgKGFrZXlzW2ldICE9PSBcInN0YWNrXCIpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWhhc093bi5jYWxsKGIsIGFrZXlzW2ldKSkgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBWZXJpZnkgdGhhdCBhbGwgdGhlIGFrZXlzJyB2YWx1ZXMgbWF0Y2hlZC5cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcbiAgICAgICAgICAgIGlmIChha2V5c1tpXSAhPT0gXCJzdGFja1wiKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFtYXRjaChhW2FrZXlzW2ldXSwgYltha2V5c1tpXV0sIGNvbnRleHQsIGxlZnQsIHJpZ2h0KSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBTaG9ydGN1dCBpZiB0aGUgcHJvcGVydGllcyBhcmUgZGlmZmVyZW50LlxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xuICAgICAgICAgICAgaWYgKCFoYXNPd24uY2FsbChiLCBha2V5c1tpXSkpIHJldHVybiBmYWxzZVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gVmVyaWZ5IHRoYXQgYWxsIHRoZSBha2V5cycgdmFsdWVzIG1hdGNoZWQuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoIW1hdGNoKGFbYWtleXNbaV1dLCBiW2FrZXlzW2ldXSwgY29udGV4dCwgbGVmdCwgcmlnaHQpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZVxufVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxuLy8gVG8gc3VwcHJlc3MgZGVwcmVjYXRpb24gbWVzc2FnZXNcbnZhciBzdXBwcmVzc0RlcHJlY2F0aW9uID0gdHJ1ZVxuXG5leHBvcnRzLnNob3dEZXByZWNhdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICBzdXBwcmVzc0RlcHJlY2F0aW9uID0gZmFsc2Vcbn1cblxuZXhwb3J0cy5oaWRlRGVwcmVjYXRpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgc3VwcHJlc3NEZXByZWNhdGlvbiA9IHRydWVcbn1cblxudmFyIGNvbnNvbGUgPSBnbG9iYWwuY29uc29sZVxudmFyIHNob3VsZFByaW50ID0gY29uc29sZSAhPSBudWxsICYmIHR5cGVvZiBjb25zb2xlLndhcm4gPT09IFwiZnVuY3Rpb25cIiAmJlxuICAgICEoZ2xvYmFsLnByb2Nlc3MgIT0gbnVsbCAmJiBnbG9iYWwucHJvY2Vzcy5lbnYgIT0gbnVsbCAmJlxuICAgICAgICBnbG9iYWwucHJvY2Vzcy5lbnYuTk9fTUlHUkFURV9XQVJOKVxuXG5leHBvcnRzLndhcm4gPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHNob3VsZFByaW50ICYmICFzdXBwcmVzc0RlcHJlY2F0aW9uKSB7XG4gICAgICAgIGNvbnNvbGUud2Fybi5hcHBseShjb25zb2xlLCBhcmd1bWVudHMpXG4gICAgfVxufVxuXG5leHBvcnRzLmRlcHJlY2F0ZSA9IGZ1bmN0aW9uIChtZXNzYWdlLCBmdW5jKSB7XG4gICAgdmFyIHByaW50ZWQgPSAhc2hvdWxkUHJpbnRcblxuICAgIC8qKiBAdGhpcyAqL1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghc3VwcHJlc3NEZXByZWNhdGlvbikge1xuICAgICAgICAgICAgaWYgKCFwcmludGVkKSB7XG4gICAgICAgICAgICAgICAgcHJpbnRlZCA9IHRydWVcbiAgICAgICAgICAgICAgICBjb25zb2xlLnRyYWNlKClcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4obWVzc2FnZSlcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbWVzc2FnZSA9IHVuZGVmaW5lZFxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZ1bmMuYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICAgIH1cbn1cbiIsIlwidXNlIHN0cmljdFwiXG5cbi8qKlxuICogQmFja3BvcnQgd3JhcHBlciB0byB3YXJuIGFib3V0IG1vc3Qgb2YgdGhlIG1ham9yIGJyZWFraW5nIGNoYW5nZXMgZnJvbSB0aGVcbiAqIGxhc3QgbWFqb3IgdmVyc2lvbiwgYW5kIHRvIGhlbHAgbWUga2VlcCB0cmFjayBvZiBhbGwgdGhlIGNoYW5nZXMuXG4gKlxuICogSXQgY29uc2lzdHMgb2Ygc29sZWx5IGludGVybmFsIG1vbmtleSBwYXRjaGluZyB0byByZXZpdmUgc3VwcG9ydCBvZiBwcmV2aW91c1xuICogdmVyc2lvbnMsIGFsdGhvdWdoIEkgdHJpZWQgdG8gbGltaXQgaG93IG11Y2gga25vd2xlZGdlIG9mIHRoZSBpbnRlcm5hbHMgdGhpc1xuICogcmVxdWlyZXMuXG4gKi9cblxudmFyIENvbW1vbiA9IHJlcXVpcmUoXCIuL2NvbW1vblwiKVxudmFyIEludGVybmFsID0gcmVxdWlyZShcIi4uL2ludGVybmFsXCIpXG52YXIgbWV0aG9kcyA9IHJlcXVpcmUoXCIuLi9saWIvbWV0aG9kc1wiKVxudmFyIFJlcG9ydCA9IHJlcXVpcmUoXCIuLi9saWIvY29yZS9yZXBvcnRzXCIpLlJlcG9ydFxudmFyIFJlZmxlY3QgPSByZXF1aXJlKFwiLi4vbGliL2FwaS9yZWZsZWN0XCIpXG52YXIgVGhhbGxpdW0gPSByZXF1aXJlKFwiLi4vbGliL2FwaS90aGFsbGl1bVwiKVxuXG52YXIgYXNzZXJ0ID0gcmVxdWlyZShcIi4uL2Fzc2VydFwiKVxudmFyIEFzc2VydGlvbkVycm9yID0gYXNzZXJ0LkFzc2VydGlvbkVycm9yXG52YXIgZm9ybWF0ID0gYXNzZXJ0LmZvcm1hdFxuXG4vKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICpcbiAqIC0gYHJlZmxlY3QuY2hlY2tJbml0KClgIGlzIGRlcHJlY2F0ZWQgaW4gZmF2b3Igb2YgYHJlZmxlY3QubG9ja2VkYCBhbmQgICAgKlxuICogICBlaXRoZXIgY29tcGxhaW5pbmcgeW91cnNlbGYgb3IganVzdCB1c2luZyBgcmVmbGVjdC5jdXJyZW50YCB0byBhZGQgICAgICAqXG4gKiAgIHRoaW5ncy4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKi9cbm1ldGhvZHMoUmVmbGVjdCwge1xuICAgIGNoZWNrSW5pdDogQ29tbW9uLmRlcHJlY2F0ZShcbiAgICAgICAgXCJgcmVmbGVjdC5jaGVja0luaXRgIGlzIGRlcHJlY2F0ZWQuIFVzZSBgcmVmbGVjdC5jdXJyZW50YCBmb3IgdGhlIFwiICtcbiAgICAgICAgXCJjdXJyZW50IHRlc3Qgb3IgdXNlIGByZWZsZWN0LmxvY2tlZGAgYW5kIGNyZWF0ZSBhbmQgdGhyb3cgdGhlIGVycm9yIFwiICtcbiAgICAgICAgXCJ5b3Vyc2VsZi5cIixcbiAgICAgICAgLyoqIEB0aGlzICovIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmxvY2tlZCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBSZWZlcmVuY2VFcnJvcihcIkl0IGlzIG9ubHkgc2FmZSB0byBjYWxsIHRlc3QgXCIgK1xuICAgICAgICAgICAgICAgICAgICBcIm1ldGhvZHMgZHVyaW5nIGluaXRpYWxpemF0aW9uXCIpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pLFxufSlcblxuLyogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqXG4gKiAtIGB0LmFzeW5jYCAtPiBgdC50ZXN0YCwgd2hpY2ggbm93IHN1cHBvcnRzIHByb21pc2VzLiAgICAgICAgICAgICAgICAgICAgICpcbiAqIC0gQWxsIHRlc3RzIGFyZSBub3cgYXN5bmMuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqL1xuXG52YXIgdGVzdCA9IFRoYWxsaXVtLnByb3RvdHlwZS50ZXN0XG5cbmZ1bmN0aW9uIHJ1bkFzeW5jKGNhbGxiYWNrLCB0LCByZXNvbHZlLCByZWplY3QpIHtcbiAgICB2YXIgcmVzb2x2ZWQgPSBmYWxzZVxuICAgIHZhciBnZW4gPSBjYWxsYmFjay5jYWxsKHQsIHQsIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgaWYgKHJlc29sdmVkKSByZXR1cm5cbiAgICAgICAgQ29tbW9uLndhcm4oXCJgdC5hc3luY2AgaXMgZGVwcmVjYXRlZC4gXCIgK1xuICAgICAgICAgICAgXCJVc2UgYHQudGVzdGAgYW5kIHJldHVybiBhIHByb21pc2UgaW5zdGVhZC5cIilcblxuICAgICAgICByZXNvbHZlZCA9IHRydWVcbiAgICAgICAgaWYgKGVyciAhPSBudWxsKSByZWplY3QoZXJyKVxuICAgICAgICBlbHNlIHJlc29sdmUoKVxuICAgIH0pXG5cbiAgICBpZiAocmVzb2x2ZWQpIHJldHVyblxuXG4gICAgaWYgKHR5cGVvZiBnZW4ubmV4dCAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIC8vIEFsbG93IHRoZSBtaWdyYXRpb24gcGF0aCB0byBzdGFuZGFyZCB0aGVuYWJsZXMuXG4gICAgICAgIHJlc29sdmUoZ2VuKVxuICAgICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBDb21tb24ud2FybihcImB0LmFzeW5jYCBpcyBkZXByZWNhdGVkLiBVc2UgYHQudGVzdGAgYW5kIGVpdGhlciByZXR1cm4gYSBcIiArXG4gICAgICAgIFwicHJvbWlzZSBvciB1c2UgYGNvYC9FUzIwMTcgYXN5bmMgZnVuY3Rpb25zIGluc3RlYWQuXCIpXG5cbiAgICAvLyBUaGlzIGlzIGEgbW9kaWZpZWQgdmVyc2lvbiBvZiB0aGUgYXN5bmMtYXdhaXQgb2ZmaWNpYWwsIG5vbi1ub3JtYXRpdmVcbiAgICAvLyBkZXN1Z2FyaW5nIGhlbHBlciwgZm9yIGJldHRlciBlcnJvciBjaGVja2luZyBhbmQgYWRhcHRlZCB0byBhY2NlcHQgYW5cbiAgICAvLyBhbHJlYWR5LWluc3RhbnRpYXRlZCBpdGVyYXRvciBpbnN0ZWFkIG9mIGEgZ2VuZXJhdG9yLlxuICAgIGZ1bmN0aW9uIGl0ZXJhdGUobmV4dCkge1xuICAgICAgICAvLyBmaW5pc2hlZCB3aXRoIHN1Y2Nlc3MsIHJlc29sdmUgdGhlIHByb21pc2VcbiAgICAgICAgaWYgKG5leHQuZG9uZSkgcmV0dXJuIFByb21pc2UucmVzb2x2ZShuZXh0LnZhbHVlKVxuXG4gICAgICAgIC8vIG5vdCBmaW5pc2hlZCwgY2hhaW4gb2ZmIHRoZSB5aWVsZGVkIHByb21pc2UgYW5kIHN0ZXAgYWdhaW5cbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShuZXh0LnZhbHVlKS50aGVuKFxuICAgICAgICAgICAgZnVuY3Rpb24gKHYpIHsgcmV0dXJuIGl0ZXJhdGUoZ2VuLm5leHQodikpIH0sXG4gICAgICAgICAgICBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZ2VuLnRocm93ID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGl0ZXJhdGUoZ2VuLnRocm93KGUpKVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IGVcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgIH1cblxuICAgIGl0ZXJhdGUoZ2VuLm5leHQodW5kZWZpbmVkKSkudGhlbihyZXNvbHZlLCByZWplY3QpXG59XG5cbm1ldGhvZHMoVGhhbGxpdW0sIHtcbiAgICBhc3luYzogZnVuY3Rpb24gKG5hbWUsIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgLy8gUmV1c2UgdGhlIG5vcm1hbCBlcnJvciBoYW5kbGluZy5cbiAgICAgICAgICAgIHJldHVybiB0ZXN0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0ZXN0LmNhbGwodGhpcywgbmFtZSwgZnVuY3Rpb24gKHQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcnVuQXN5bmMoY2FsbGJhY2ssIHQsIHJlc29sdmUsIHJlamVjdClcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBhc3luY1NraXA6IENvbW1vbi5kZXByZWNhdGUoXG4gICAgICAgIFwiYHQuYXN5bmNTa2lwYCBpcyBkZXByZWNhdGVkLiBVc2UgYHQudGVzdFNraXBgIGluc3RlYWQuXCIsXG4gICAgICAgIFRoYWxsaXVtLnByb3RvdHlwZS50ZXN0U2tpcCksXG59KVxuXG5tZXRob2RzKFJlZmxlY3QsIHtcbiAgICBnZXQgaXNBc3luYygpIHtcbiAgICAgICAgQ29tbW9uLndhcm4oXCJUZXN0cyBhcmUgbm93IGFsd2F5cyBhc3luYy4gWW91IG5vIGxvbmdlciBuZWVkIHRvIFwiICtcbiAgICAgICAgICAgIFwiaGFuZGxlIHRoZSBvdGhlciBjYXNlXCIpXG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgfSxcbn0pXG5cbi8qICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKlxuICogYHJlZmxlY3QuZGVmaW5lYCwgYHQuZGVmaW5lYCwgYHJlZmxlY3Qud3JhcGAsIGFuZCBgcmVmbGVjdC5hZGRgLCBhcmUgYWxsICAqXG4gKiByZW1vdmVkLiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKi9cblxuZnVuY3Rpb24gaXNMb2NrZWQobWV0aG9kKSB7XG4gICAgcmV0dXJuIG1ldGhvZCA9PT0gXCJfXCIgfHxcbiAgICAgICAgbWV0aG9kID09PSBcInJlZmxlY3RcIiB8fFxuICAgICAgICBtZXRob2QgPT09IFwib25seVwiIHx8XG4gICAgICAgIG1ldGhvZCA9PT0gXCJ1c2VcIiB8fFxuICAgICAgICBtZXRob2QgPT09IFwicmVwb3J0ZXJcIiB8fFxuICAgICAgICBtZXRob2QgPT09IFwiZGVmaW5lXCIgfHxcbiAgICAgICAgbWV0aG9kID09PSBcInRpbWVvdXRcIiB8fFxuICAgICAgICBtZXRob2QgPT09IFwic2xvd1wiIHx8XG4gICAgICAgIG1ldGhvZCA9PT0gXCJydW5cIiB8fFxuICAgICAgICBtZXRob2QgPT09IFwidGVzdFwiIHx8XG4gICAgICAgIG1ldGhvZCA9PT0gXCJ0ZXN0U2tpcFwiIHx8XG4gICAgICAgIG1ldGhvZCA9PT0gXCJhc3luY1wiIHx8XG4gICAgICAgIG1ldGhvZCA9PT0gXCJhc3luY1NraXBcIlxufVxuXG5mdW5jdGlvbiBnZXRFbnVtZXJhYmxlU3ltYm9scyhrZXlzLCBvYmplY3QpIHtcbiAgICB2YXIgc3ltYm9scyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMob2JqZWN0KVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzeW1ib2xzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBzeW0gPSBzeW1ib2xzW2ldXG5cbiAgICAgICAgaWYgKE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Ioc3ltKS5lbnVtZXJhYmxlKSBrZXlzLnB1c2goc3ltKVxuICAgIH1cbn1cblxuLy8gVGhpcyBoYW5kbGVzIG5hbWUgKyBmdW5jIHZzIG9iamVjdCB3aXRoIG1ldGhvZHMuXG5mdW5jdGlvbiBpdGVyYXRlU2V0dGVyKHRlc3QsIG5hbWUsIGZ1bmMsIGl0ZXJhdG9yKSB7XG4gICAgLy8gQ2hlY2sgYm90aCB0aGUgbmFtZSBhbmQgZnVuY3Rpb24sIHNvIEVTNiBzeW1ib2wgcG9seWZpbGxzICh3aGljaCB1c2VcbiAgICAvLyBvYmplY3RzIHNpbmNlIGl0J3MgaW1wb3NzaWJsZSB0byBmdWxseSBwb2x5ZmlsbCBwcmltaXRpdmVzKSB3b3JrLlxuICAgIGlmICh0eXBlb2YgbmFtZSA9PT0gXCJvYmplY3RcIiAmJiBuYW1lICE9IG51bGwgJiYgZnVuYyA9PSBudWxsKSB7XG4gICAgICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMobmFtZSlcblxuICAgICAgICBpZiAodHlwZW9mIE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgZ2V0RW51bWVyYWJsZVN5bWJvbHMoa2V5cywgbmFtZSlcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGtleSA9IGtleXNbaV1cblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBuYW1lW2tleV0gIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBib2R5IHRvIGJlIGEgZnVuY3Rpb25cIilcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGVzdC5tZXRob2RzW2tleV0gPSBpdGVyYXRvcih0ZXN0LCBrZXksIG5hbWVba2V5XSlcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh0eXBlb2YgZnVuYyAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgYm9keSB0byBiZSBhIGZ1bmN0aW9uXCIpXG4gICAgICAgIH1cblxuICAgICAgICB0ZXN0Lm1ldGhvZHNbbmFtZV0gPSBpdGVyYXRvcih0ZXN0LCBuYW1lLCBmdW5jKVxuICAgIH1cbn1cblxuLyoqXG4gKiBAdGhpcyB7U3RhdGV9XG4gKiBSdW4gYGZ1bmNgIHdpdGggYC4uLmFyZ3NgIHdoZW4gYXNzZXJ0aW9ucyBhcmUgcnVuLCBvbmx5IGlmIHRoZSB0ZXN0IGlzbid0XG4gKiBza2lwcGVkLiBUaGlzIGlzIGltbWVkaWF0ZWx5IGZvciBibG9jayBhbmQgYXN5bmMgdGVzdHMsIGJ1dCBkZWZlcnJlZCBmb3JcbiAqIGlubGluZSB0ZXN0cy4gSXQncyB1c2VmdWwgZm9yIGlubGluZSBhc3NlcnRpb25zLlxuICovXG5mdW5jdGlvbiBhdHRlbXB0KGZ1bmMsIGEsIGIsIGMvKiAsIC4uLmFyZ3MgKi8pIHtcbiAgICBzd2l0Y2ggKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICBjYXNlIDA6IHRocm93IG5ldyBUeXBlRXJyb3IoXCJ1bnJlYWNoYWJsZVwiKVxuICAgIGNhc2UgMTogZnVuYygpOyByZXR1cm5cbiAgICBjYXNlIDI6IGZ1bmMoYSk7IHJldHVyblxuICAgIGNhc2UgMzogZnVuYyhhLCBiKTsgcmV0dXJuXG4gICAgY2FzZSA0OiBmdW5jKGEsIGIsIGMpOyByZXR1cm5cbiAgICBkZWZhdWx0OlxuICAgICAgICB2YXIgYXJncyA9IFtdXG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFyZ3MucHVzaChhcmd1bWVudHNbaV0pXG4gICAgICAgIH1cblxuICAgICAgICBmdW5jLmFwcGx5KHVuZGVmaW5lZCwgYXJncylcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRlZmluZUFzc2VydGlvbih0ZXN0LCBuYW1lLCBmdW5jKSB7XG4gICAgLy8gRG9uJ3QgbGV0IG5hdGl2ZSBtZXRob2RzIGdldCBvdmVycmlkZGVuIGJ5IGFzc2VydGlvbnNcbiAgICBpZiAoaXNMb2NrZWQobmFtZSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCJNZXRob2QgJ1wiICsgbmFtZSArIFwiJyBpcyBsb2NrZWQhXCIpXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcnVuKCkge1xuICAgICAgICB2YXIgcmVzID0gZnVuYy5hcHBseSh1bmRlZmluZWQsIGFyZ3VtZW50cylcblxuICAgICAgICBpZiAodHlwZW9mIHJlcyAhPT0gXCJvYmplY3RcIiB8fCByZXMgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCByZXN1bHQgdG8gYmUgYW4gb2JqZWN0XCIpXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXJlcy50ZXN0KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IoXG4gICAgICAgICAgICAgICAgZm9ybWF0KHJlcy5tZXNzYWdlLCByZXMpLFxuICAgICAgICAgICAgICAgIHJlcy5leHBlY3RlZCwgcmVzLmFjdHVhbClcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiAvKiogQHRoaXMgKi8gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgYXJncyA9IFtydW5dXG5cbiAgICAgICAgYXJncy5wdXNoLmFwcGx5KGFyZ3MsIGFyZ3VtZW50cylcbiAgICAgICAgYXR0ZW1wdC5hcHBseSh1bmRlZmluZWQsIGFyZ3MpXG4gICAgICAgIHJldHVybiB0aGlzXG4gICAgfVxufVxuXG5mdW5jdGlvbiB3cmFwQXNzZXJ0aW9uKHRlc3QsIG5hbWUsIGZ1bmMpIHtcbiAgICAvLyBEb24ndCBsZXQgYHJlZmxlY3RgIGFuZCBgX2AgY2hhbmdlLlxuICAgIGlmIChuYW1lID09PSBcInJlZmxlY3RcIiB8fCBuYW1lID09PSBcIl9cIikge1xuICAgICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcihcIk1ldGhvZCAnXCIgKyBuYW1lICsgXCInIGlzIGxvY2tlZCFcIilcbiAgICB9XG5cbiAgICB2YXIgb2xkID0gdGVzdC5tZXRob2RzW25hbWVdXG5cbiAgICBpZiAodHlwZW9mIG9sZCAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgICAgICBcIkV4cGVjdGVkIHQuXCIgKyBuYW1lICsgXCIgdG8gYWxyZWFkeSBiZSBhIGZ1bmN0aW9uXCIpXG4gICAgfVxuXG4gICAgLyoqIEB0aGlzICovXG4gICAgZnVuY3Rpb24gYXBwbHkoYSwgYiwgYywgZCkge1xuICAgICAgICBzd2l0Y2ggKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgY2FzZSAwOiByZXR1cm4gZnVuYy5jYWxsKHRoaXMsIG9sZC5iaW5kKHRoaXMpKVxuICAgICAgICBjYXNlIDE6IHJldHVybiBmdW5jLmNhbGwodGhpcywgb2xkLmJpbmQodGhpcyksIGEpXG4gICAgICAgIGNhc2UgMjogcmV0dXJuIGZ1bmMuY2FsbCh0aGlzLCBvbGQuYmluZCh0aGlzKSwgYSwgYilcbiAgICAgICAgY2FzZSAzOiByZXR1cm4gZnVuYy5jYWxsKHRoaXMsIG9sZC5iaW5kKHRoaXMpLCBhLCBiLCBjKVxuICAgICAgICBjYXNlIDQ6IHJldHVybiBmdW5jLmNhbGwodGhpcywgb2xkLmJpbmQodGhpcyksIGEsIGIsIGMsIGQpXG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICB2YXIgYXJncyA9IFtvbGQuYmluZCh0aGlzKV1cblxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBhcmdzLnB1c2goYXJndW1lbnRzW2ldKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gZnVuYy5hcHBseSh0aGlzLCBhcmdzKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIC8qKiBAdGhpcyAqLyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciByZXQgPSBhcHBseS5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG5cbiAgICAgICAgcmV0dXJuIHJldCAhPT0gdW5kZWZpbmVkID8gcmV0IDogdGhpc1xuICAgIH1cbn1cblxuZnVuY3Rpb24gYWRkQXNzZXJ0aW9uKHRlc3QsIG5hbWUsIGZ1bmMpIHtcbiAgICBpZiAodHlwZW9mIHRlc3QubWV0aG9kc1tuYW1lXSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiTWV0aG9kICdcIiArIG5hbWUgKyBcIicgYWxyZWFkeSBleGlzdHMhXCIpXG4gICAgfVxuXG4gICAgLyoqIEB0aGlzICovXG4gICAgZnVuY3Rpb24gYXBwbHkoYSwgYiwgYywgZCkge1xuICAgICAgICBzd2l0Y2ggKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgY2FzZSAwOiByZXR1cm4gZnVuYy5jYWxsKHRoaXMsIHRoaXMpXG4gICAgICAgIGNhc2UgMTogcmV0dXJuIGZ1bmMuY2FsbCh0aGlzLCB0aGlzLCBhKVxuICAgICAgICBjYXNlIDI6IHJldHVybiBmdW5jLmNhbGwodGhpcywgdGhpcywgYSwgYilcbiAgICAgICAgY2FzZSAzOiByZXR1cm4gZnVuYy5jYWxsKHRoaXMsIHRoaXMsIGEsIGIsIGMpXG4gICAgICAgIGNhc2UgNDogcmV0dXJuIGZ1bmMuY2FsbCh0aGlzLCB0aGlzLCBhLCBiLCBjLCBkKVxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgdmFyIGFyZ3MgPSBbdGhpc11cblxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBhcmdzLnB1c2goYXJndW1lbnRzW2ldKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gZnVuYy5hcHBseSh0aGlzLCBhcmdzKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIC8qKiBAdGhpcyAqLyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciByZXQgPSBhcHBseS5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG5cbiAgICAgICAgcmV0dXJuIHJldCAhPT0gdW5kZWZpbmVkID8gcmV0IDogdGhpc1xuICAgIH1cbn1cblxubWV0aG9kcyhSZWZsZWN0LCB7XG4gICAgZGVmaW5lOiBDb21tb24uZGVwcmVjYXRlKFxuICAgICAgICBcImByZWZsZWN0LmRlZmluZWAgaXMgZGVwcmVjYXRlZC4gVXNlIGV4dGVybmFsIG1ldGhvZHMgb3IgZGlyZWN0IGFzc2lnbm1lbnQgaW5zdGVhZC5cIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtbGVuXG4gICAgICAgIC8qKiBAdGhpcyAqLyBmdW5jdGlvbiAobmFtZSwgZnVuYykge1xuICAgICAgICAgICAgaXRlcmF0ZVNldHRlcih0aGlzLl8uY3VycmVudC52YWx1ZSwgbmFtZSwgZnVuYywgZGVmaW5lQXNzZXJ0aW9uKVxuICAgICAgICB9KSxcblxuICAgIHdyYXA6IENvbW1vbi5kZXByZWNhdGUoXG4gICAgICAgIFwiYHJlZmxlY3Qud3JhcGAgaXMgZGVwcmVjYXRlZC4gVXNlIGV4dGVybmFsIG1ldGhvZHMgb3IgZGlyZWN0IGFzc2lnbm1lbnQgaW5zdGVhZC5cIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtbGVuXG4gICAgICAgIC8qKiBAdGhpcyAqLyBmdW5jdGlvbiAobmFtZSwgZnVuYykge1xuICAgICAgICAgICAgaXRlcmF0ZVNldHRlcih0aGlzLl8uY3VycmVudC52YWx1ZSwgbmFtZSwgZnVuYywgd3JhcEFzc2VydGlvbilcbiAgICAgICAgfSksXG5cbiAgICBhZGQ6IENvbW1vbi5kZXByZWNhdGUoXG4gICAgICAgIFwiYHJlZmxlY3QuYWRkYCBpcyBkZXByZWNhdGVkLiBVc2UgZXh0ZXJuYWwgbWV0aG9kcyBvciBkaXJlY3QgYXNzaWdubWVudCBpbnN0ZWFkLlwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1sZW5cbiAgICAgICAgLyoqIEB0aGlzICovIGZ1bmN0aW9uIChuYW1lLCBmdW5jKSB7XG4gICAgICAgICAgICBpdGVyYXRlU2V0dGVyKHRoaXMuXy5jdXJyZW50LnZhbHVlLCBuYW1lLCBmdW5jLCBhZGRBc3NlcnRpb24pXG4gICAgICAgIH0pLFxufSlcblxubWV0aG9kcyhUaGFsbGl1bSwge1xuICAgIGRlZmluZTogQ29tbW9uLmRlcHJlY2F0ZShcbiAgICAgICAgXCJgdC5kZWZpbmVgIGlzIGRlcHJlY2F0ZWQuIFVzZSBleHRlcm5hbCBtZXRob2RzIG9yIGRpcmVjdCBhc3NpZ25tZW50IGluc3RlYWQuXCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LWxlblxuICAgICAgICAvKiogQHRoaXMgKi8gZnVuY3Rpb24gKG5hbWUsIGZ1bmMpIHtcbiAgICAgICAgICAgIGl0ZXJhdGVTZXR0ZXIodGhpcy5fLmN1cnJlbnQudmFsdWUsIG5hbWUsIGZ1bmMsIGRlZmluZUFzc2VydGlvbilcbiAgICAgICAgICAgIHJldHVybiB0aGlzXG4gICAgICAgIH0pLFxufSlcblxuLyogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqXG4gKiAtIGByZWZsZWN0LmRvYCBpcyBkZXByZWNhdGVkLCB3aXRoIG5vIHJlcGxhY2VtZW50IChpbmxpbmUgdGVzdHMgYXJlIGFsc28gICpcbiAqICAgZGVwcmVjYXRlZCkuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogLSBgcmVmbGVjdC5iYXNlYCAtPiBgaW50ZXJuYWwucm9vdGAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiAtIGByZWZsZWN0LkFzc2VydGlvbkVycm9yYCAtPiBgYXNzZXJ0LkFzc2VydGlvbkVycm9yYC4gICAgICAgICAgICAgICAgICAgICpcbiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKi9cblxubWV0aG9kcyhSZWZsZWN0LCB7XG4gICAgLy8gRGVwcmVjYXRlZCBhbGlhc2VzXG4gICAgZG86IENvbW1vbi5kZXByZWNhdGUoXG4gICAgICAgIFwiYHJlZmxlY3QuZG9gIGlzIGRlcHJlY2F0ZWQuIFRyYW5zaXRpb24gdG8gYmxvY2sgdGVzdHMsIGlmIG5lY2Vzc2FyeSwgYW5kIHJ1biB0aGUgY29kZSBkaXJlY3RseS5cIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtbGVuXG4gICAgICAgIC8qKiBAdGhpcyAqLyBmdW5jdGlvbiAoZnVuYykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBmdW5jICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgY2FsbGJhY2sgdG8gYmUgYSBmdW5jdGlvblwiKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBhdHRlbXB0LmFwcGx5KHVuZGVmaW5lZCwgYXJndW1lbnRzKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXNcbiAgICAgICAgfSksXG4gICAgYmFzZTogQ29tbW9uLmRlcHJlY2F0ZShcbiAgICAgICAgXCJgcmVmbGVjdC5iYXNlYCBpcyBkZXByZWNhdGVkLiBVc2UgYGludGVybmFsLnJvb3RgIGZyb20gYHRoYWxsaXVtL2ludGVybmFsYCBpbnN0ZWFkLlwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1sZW5cbiAgICAgICAgSW50ZXJuYWwucm9vdCksXG59KVxuXG4vLyBFU0xpbnQgb2RkbHkgY2FuJ3QgdGVsbCB0aGVzZSBhcmUgc2hhZG93ZWQuXG4vKiBlc2xpbnQtZGlzYWJsZSBuby1leHRlbmQtbmF0aXZlICovXG5cbmZ1bmN0aW9uIGxvY2tFcnJvcihBc3NlcnRpb25FcnJvcikge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShSZWZsZWN0LnByb3RvdHlwZSwgXCJBc3NlcnRpb25FcnJvclwiLCB7XG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogQXNzZXJ0aW9uRXJyb3IsXG4gICAgfSlcbiAgICByZXR1cm4gQXNzZXJ0aW9uRXJyb3Jcbn1cblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KFJlZmxlY3QucHJvdG90eXBlLCBcIkFzc2VydGlvbkVycm9yXCIsIHtcbiAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgZ2V0OiBDb21tb24uZGVwcmVjYXRlKFxuICAgICAgICBcImByZWZsZWN0LkFzc2VydGlvbkVycm9yYCBpcyBkZXByZWNhdGVkLiBVc2UgYGFzc2VydC5Bc3NlcnRpb25FcnJvcmAgZnJvbSBgdGhhbGxpdW0vYXNzZXJ0YCBpbnN0ZWFkLlwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1sZW5cbiAgICAgICAgZnVuY3Rpb24gKCkgeyByZXR1cm4gbG9ja0Vycm9yKEFzc2VydGlvbkVycm9yKSB9KSxcbiAgICBzZXQ6IENvbW1vbi5kZXByZWNhdGUoXG4gICAgICAgIFwiYHJlZmxlY3QuQXNzZXJ0aW9uRXJyb3JgIGlzIGRlcHJlY2F0ZWQuIFVzZSBgYXNzZXJ0LkFzc2VydGlvbkVycm9yYCBmcm9tIGB0aGFsbGl1bS9hc3NlcnRgIGluc3RlYWQuXCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LWxlblxuICAgICAgICBsb2NrRXJyb3IpLFxufSlcblxuLyogZXNsaW50LWVuYWJsZSBuby1leHRlbmQtbmF0aXZlICovXG5cbm1ldGhvZHMoVGhhbGxpdW0sIHtcbiAgICBiYXNlOiBDb21tb24uZGVwcmVjYXRlKFxuICAgICAgICBcImB0LmJhc2VgIGlzIGRlcHJlY2F0ZWQuIFVzZSBgdC5jcmVhdGVgIGluc3RlYWQuXCIsXG4gICAgICAgIGZ1bmN0aW9uICgpIHsgcmV0dXJuIG5ldyBUaGFsbGl1bSgpIH0pLFxufSlcblxuLyogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqXG4gKiAtIGFzc2VydGlvbnMgZGVmaW5lZCBvbiBtYWluIGV4cG9ydCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqIC0gYHQuKmAgYXNzZXJ0aW9ucyAtPiBgYXNzZXJ0LipgIChzb21lIHJlbmFtZWQpIGZyb20gYHRoYWxsaXVtL2Fzc2VydGAgICAgKlxuICogLSBgdC50cnVlYC9ldGMuIGFyZSBnb25lIChleGNlcHQgYHQudW5kZWZpbmVkYCAtPiBgYXNzZXJ0LnVuZGVmaW5lZGApICAgICAqXG4gKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICovXG5Db21tb24uaGlkZURlcHJlY2F0aW9uKClcbnJlcXVpcmUoXCIuLi9hc3NlcnRpb25zXCIpKHJlcXVpcmUoXCIuLi9pbmRleFwiKSlcbkNvbW1vbi5zaG93RGVwcmVjYXRpb24oKVxuXG4vKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICpcbiAqIGBleHRyYWAgZXZlbnRzIGFyZSBubyBsb25nZXIgYSB0aGluZy4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqL1xubWV0aG9kcyhSZXBvcnQsIHtcbiAgICBnZXQgaXNJbmxpbmUoKSB7XG4gICAgICAgIENvbW1vbi53YXJuKFwiYGV4dHJhYCBldmVudHMgbm8gbG9uZ2VyIGV4aXN0LiBZb3Ugbm8gbG9uZ2VyIG5lZWQgdG8gXCIgK1xuICAgICAgICAgICAgXCJoYW5kbGUgdGhlbVwiKVxuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICB9LFxufSlcblxuLyogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqXG4gKiAtIGB0LnJlZmxlY3RgIGFuZCBgdC51c2VgIC0+IG5vbi1jYWNoaW5nIGB0LmNhbGxgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKi9cbnZhciBjYWxsID0gVGhhbGxpdW0ucHJvdG90eXBlLmNhbGxcblxuZnVuY3Rpb24gaWQoeCkgeyByZXR1cm4geCB9XG5cbm1ldGhvZHMoVGhhbGxpdW0sIHtcbiAgICByZWZsZWN0OiBDb21tb24uZGVwcmVjYXRlKFxuICAgICAgICBcImB0LnJlZmxlY3RgIGlzIGRlcHJlY2F0ZWQuIFVzZSBgdC5jYWxsYCBpbnN0ZWFkLlwiLFxuICAgICAgICAvKiogQHRoaXMgKi8gZnVuY3Rpb24gKCkgeyByZXR1cm4gY2FsbC5jYWxsKHRoaXMsIGlkKSB9KSxcblxuICAgIHVzZTogQ29tbW9uLmRlcHJlY2F0ZShcbiAgICAgICAgXCJgdC51c2VgIGlzIGRlcHJlY2F0ZWQuIFVzZSBgdC5jYWxsYCBpbnN0ZWFkLlwiLFxuICAgICAgICAvKiogQHRoaXMgKi8gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHJlZmxlY3QgPSBjYWxsLmNhbGwodGhpcywgaWQpXG5cbiAgICAgICAgICAgIGlmICghcmVmbGVjdC5za2lwcGVkKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRlc3QgPSB0aGlzLl8uY3VycmVudC52YWx1ZVxuXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBsdWdpbiA9IGFyZ3VtZW50c1tpXVxuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgcGx1Z2luICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJFeHBlY3RlZCBgcGx1Z2luYCB0byBiZSBhIGZ1bmN0aW9uXCIpXG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAodGVzdC5wbHVnaW5zID09IG51bGwpIHRlc3QucGx1Z2lucyA9IFtdXG4gICAgICAgICAgICAgICAgICAgIGlmICh0ZXN0LnBsdWdpbnMuaW5kZXhPZihwbHVnaW4pID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWRkIHBsdWdpbiBiZWZvcmUgY2FsbGluZyBpdC5cbiAgICAgICAgICAgICAgICAgICAgICAgIHRlc3QucGx1Z2lucy5wdXNoKHBsdWdpbilcbiAgICAgICAgICAgICAgICAgICAgICAgIHBsdWdpbi5jYWxsKHRoaXMsIHRoaXMpXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzXG4gICAgICAgIH0pLFxufSlcblxuLyogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqXG4gKiAtIGByZWZsZWN0LnJlcG9ydGAgLT4gYGludGVybmFsLnJlcG9ydC4qYCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqIC0gYHJlZmxlY3QubG9jYCAtPiBgaW50ZXJuYWwubG9jYXRpb25gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogLSBgcmVmbGVjdC5zY2hlZHVsZXJgIG9ic29sZXRlZC4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICovXG5cbnZhciByZXBvcnRzID0gSW50ZXJuYWwucmVwb3J0c1xuXG5tZXRob2RzKFJlZmxlY3QsIHtcbiAgICByZXBvcnQ6IENvbW1vbi5kZXByZWNhdGUoXG4gICAgICAgIFwiYHJlZmxlY3QucmVwb3J0YCBpcyBkZXByZWNhdGVkLiBVc2UgYGludGVybmFsLnJlcG9ydC4qYCBmcm9tIGB0aGFsbGl1bS9pbnRlcm5hbGAgaW5zdGVhZC5cIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtbGVuXG4gICAgICAgIGZ1bmN0aW9uICh0eXBlLCBwYXRoLCB2YWx1ZSwgZHVyYXRpb24sIHNsb3cpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtcGFyYW1zLCBtYXgtbGVuXG4gICAgICAgICAgICBpZiAodHlwZW9mIHR5cGUgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgYHR5cGVgIHRvIGJlIGEgc3RyaW5nXCIpXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgICAgY2FzZSBcInN0YXJ0XCI6IHJldHVybiByZXBvcnRzLnN0YXJ0KClcbiAgICAgICAgICAgIGNhc2UgXCJlbnRlclwiOiByZXR1cm4gcmVwb3J0cy5lbnRlcihwYXRoLCBkdXJhdGlvbiwgc2xvdylcbiAgICAgICAgICAgIGNhc2UgXCJsZWF2ZVwiOiByZXR1cm4gcmVwb3J0cy5sZWF2ZShwYXRoKVxuICAgICAgICAgICAgY2FzZSBcInBhc3NcIjogcmV0dXJuIHJlcG9ydHMucGFzcyhwYXRoLCBkdXJhdGlvbiwgc2xvdylcbiAgICAgICAgICAgIGNhc2UgXCJmYWlsXCI6IHJldHVybiByZXBvcnRzLmZhaWwocGF0aCwgdmFsdWUsIGR1cmF0aW9uLCBzbG93KVxuICAgICAgICAgICAgY2FzZSBcInNraXBcIjogcmV0dXJuIHJlcG9ydHMuc2tpcChwYXRoKVxuICAgICAgICAgICAgY2FzZSBcImVuZFwiOiByZXR1cm4gcmVwb3J0cy5lbmQoKVxuICAgICAgICAgICAgY2FzZSBcImVycm9yXCI6IHJldHVybiByZXBvcnRzLmVycm9yKHZhbHVlKVxuICAgICAgICAgICAgY2FzZSBcImhvb2tcIjogcmV0dXJuIHJlcG9ydHMuaG9vayhwYXRoLCB2YWx1ZSlcbiAgICAgICAgICAgIGRlZmF1bHQ6IHRocm93IG5ldyBSYW5nZUVycm9yKFwiVW5rbm93biByZXBvcnQgYHR5cGVgOiBcIiArIHR5cGUpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pLFxuXG4gICAgbG9jOiBDb21tb24uZGVwcmVjYXRlKFxuICAgICAgICBcImByZWZsZWN0LmxvY2AgaXMgZGVwcmVjYXRlZC4gVXNlIGBpbnRlcm5hbC5sb2NhdGlvbmAgZnJvbSBgdGhhbGxpdW0vaW50ZXJuYWxgIGluc3RlYWQuXCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LWxlblxuICAgICAgICBJbnRlcm5hbC5sb2NhdGlvbiksXG5cbiAgICBzY2hlZHVsZXI6IENvbW1vbi5kZXByZWNhdGUoXG4gICAgICAgIFwiYHJlZmxlY3Quc2NoZWR1bGVyYCBpcyBkZXByZWNhdGVkLiBJdCBpcyBubyBsb25nZXIgdXNlZnVsIHRvIHRoZSBsaWJyYXJ5LCBhbmQgY2FuIGJlIHNhZmVseSByZW1vdmVkLlwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1sZW5cbiAgICAgICAgZnVuY3Rpb24gKCkge30pLFxufSlcblxuLyogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqXG4gKiBJbmxpbmUgdGVzdHMgYXJlIGRlcHJlY2F0ZWQuIFRoaXMgaXMgXCJmaXhlZFwiIGJ5IGp1c3QgdGhyb3dpbmcsIHNpbmNlIGl0J3MgKlxuICogaGFyZCB0byBwYXRjaCBiYWNrIGluIGFuZCBlYXN5IHRvIGZpeCBvbiB0aGUgdXNlcidzIGVuZC4gICAgICAgICAgICAgICAgICAqXG4gKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICovXG5tZXRob2RzKFRoYWxsaXVtLCB7XG4gICAgdGVzdDogZnVuY3Rpb24gKG5hbWUsIGZ1bmMpIHtcbiAgICAgICAgaWYgKGZ1bmMgPT0gbnVsbCkge1xuICAgICAgICAgICAgLy8gQ2F0Y2ggdGhpcyBwYXJ0aWN1bGFyIGNhc2UsIHRvIHRocm93IHdpdGggYSBtb3JlIGluZm9ybWF0aXZlXG4gICAgICAgICAgICAvLyBtZXNzc2FnZS5cbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgICAgICAgICAgXCJJbmxpbmUgdGVzdHMgYXJlIGRlcHJlY2F0ZWQuIFVzZSBibG9jayB0ZXN0cyBpbnN0ZWFkLlwiKVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRlc3QuYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICAgIH0sXG59KVxuXG5tZXRob2RzKFJlZmxlY3QsIHtcbiAgICBnZXQgaXNJbmxpbmUoKSB7XG4gICAgICAgIENvbW1vbi53YXJuKFwiVGVzdHMgYXJlIG5vdyBuZXZlciBpbmxpbmUuIFlvdSBubyBsb25nZXIgbmVlZCB0byBcIiArXG4gICAgICAgICAgICBcImhhbmRsZSB0aGlzIGNhc2VcIilcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfSxcbn0pXG5cbi8qICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKlxuICogYHJlZmxlY3QubWV0aG9kc2AgLT4gYHJlZmxlY3QuY3VycmVudGAgYW5kIHVzaW5nIG5ldyBgcmVmbGVjdGAgbWV0aG9kcyAgICAqXG4gKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICovXG5tZXRob2RzKFJlZmxlY3QsIHtcbiAgICBnZXQgbWV0aG9kcygpIHtcbiAgICAgICAgQ29tbW9uLndhcm4oXCJgcmVmbGVjdC5tZXRob2RzYCBpcyBkZXByZWNhdGVkLiBVc2UgYHJlZmxlY3QuY3VycmVudGAsIFwiICtcbiAgICAgICAgICAgIFwidGhlIHJldHVybiB2YWx1ZSBvZiBgdC5jYWxsYCwgYW5kIHRoZSBhcHByb3ByaWF0ZSBuZXcgYHJlZmxlY3RgIFwiICtcbiAgICAgICAgICAgIFwibWV0aG9kcyBpbnN0ZWFkXCIpXG4gICAgICAgIHJldHVybiB0aGlzLl8ubWV0aG9kc1xuICAgIH0sXG59KVxuXG4vKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICpcbiAqIGByZWZsZWN0LnJlcG9ydGVyc2AgLT4gYHJlZmxlY3QuaGFzUmVwb3J0ZXJgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqL1xubWV0aG9kcyhSZWZsZWN0LCB7XG4gICAgZ2V0IHJlcG9ydGVycygpIHtcbiAgICAgICAgQ29tbW9uLndhcm4oXCJgcmVmbGVjdC5yZXBvcnRlcnNgIGlzIGRlcHJlY2F0ZWQuIFVzZSBcIiArXG4gICAgICAgICAgICBcImByZWZsZWN0Lmhhc1JlcG9ydGVyYCBpbnN0ZWFkIHRvIGNoZWNrIGZvciBleGlzdGVuY2Ugb2YgYSBcIiArXG4gICAgICAgICAgICBcInJlcG9ydGVyLlwiKVxuICAgICAgICByZXR1cm4gdGhpcy5fLm1ldGhvZHNcbiAgICB9LFxufSlcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHhzLCBmKSB7XG4gICAgaWYgKHhzLm1hcCkgcmV0dXJuIHhzLm1hcChmKTtcbiAgICB2YXIgcmVzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB4cy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgeCA9IHhzW2ldO1xuICAgICAgICBpZiAoaGFzT3duLmNhbGwoeHMsIGkpKSByZXMucHVzaChmKHgsIGksIHhzKSk7XG4gICAgfVxuICAgIHJldHVybiByZXM7XG59O1xuXG52YXIgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcbiIsInZhciBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICh4cywgZiwgYWNjKSB7XG4gICAgdmFyIGhhc0FjYyA9IGFyZ3VtZW50cy5sZW5ndGggPj0gMztcbiAgICBpZiAoaGFzQWNjICYmIHhzLnJlZHVjZSkgcmV0dXJuIHhzLnJlZHVjZShmLCBhY2MpO1xuICAgIGlmICh4cy5yZWR1Y2UpIHJldHVybiB4cy5yZWR1Y2UoZik7XG4gICAgXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB4cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoIWhhc093bi5jYWxsKHhzLCBpKSkgY29udGludWU7XG4gICAgICAgIGlmICghaGFzQWNjKSB7XG4gICAgICAgICAgICBhY2MgPSB4c1tpXTtcbiAgICAgICAgICAgIGhhc0FjYyA9IHRydWU7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBhY2MgPSBmKGFjYywgeHNbaV0sIGkpO1xuICAgIH1cbiAgICByZXR1cm4gYWNjO1xufTtcbiIsIlxudmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG52YXIgdG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGZvckVhY2ggKG9iaiwgZm4sIGN0eCkge1xuICAgIGlmICh0b1N0cmluZy5jYWxsKGZuKSAhPT0gJ1tvYmplY3QgRnVuY3Rpb25dJykge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdpdGVyYXRvciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcbiAgICB9XG4gICAgdmFyIGwgPSBvYmoubGVuZ3RoO1xuICAgIGlmIChsID09PSArbCkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgZm4uY2FsbChjdHgsIG9ialtpXSwgaSwgb2JqKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAodmFyIGsgaW4gb2JqKSB7XG4gICAgICAgICAgICBpZiAoaGFzT3duLmNhbGwob2JqLCBrKSkge1xuICAgICAgICAgICAgICAgIGZuLmNhbGwoY3R4LCBvYmpba10sIGssIG9iaik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG4iLCJcbnZhciBpbmRleE9mID0gW10uaW5kZXhPZjtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihhcnIsIG9iail7XG4gIGlmIChpbmRleE9mKSByZXR1cm4gYXJyLmluZGV4T2Yob2JqKTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyArK2kpIHtcbiAgICBpZiAoYXJyW2ldID09PSBvYmopIHJldHVybiBpO1xuICB9XG4gIHJldHVybiAtMTtcbn07IiwibW9kdWxlLmV4cG9ydHMgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uIChhcnIpIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChhcnIpID09ICdbb2JqZWN0IEFycmF5XSc7XG59O1xuIiwiLyohIEpTT04gdjMuMy4wIHwgaHR0cDovL2Jlc3RpZWpzLmdpdGh1Yi5pby9qc29uMyB8IENvcHlyaWdodCAyMDEyLTIwMTQsIEtpdCBDYW1icmlkZ2UgfCBodHRwOi8va2l0Lm1pdC1saWNlbnNlLm9yZyAqL1xuOyhmdW5jdGlvbiAocm9vdCkge1xuICAvLyBEZXRlY3QgdGhlIGBkZWZpbmVgIGZ1bmN0aW9uIGV4cG9zZWQgYnkgYXN5bmNocm9ub3VzIG1vZHVsZSBsb2FkZXJzLiBUaGVcbiAgLy8gc3RyaWN0IGBkZWZpbmVgIGNoZWNrIGlzIG5lY2Vzc2FyeSBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIGByLmpzYC5cbiAgdmFyIGlzTG9hZGVyID0gdHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiICYmIGRlZmluZS5hbWQ7XG5cbiAgLy8gVXNlIHRoZSBgZ2xvYmFsYCBvYmplY3QgZXhwb3NlZCBieSBOb2RlIChpbmNsdWRpbmcgQnJvd3NlcmlmeSB2aWFcbiAgLy8gYGluc2VydC1tb2R1bGUtZ2xvYmFsc2ApLCBOYXJ3aGFsLCBhbmQgUmluZ28gYXMgdGhlIGRlZmF1bHQgY29udGV4dC5cbiAgLy8gUmhpbm8gZXhwb3J0cyBhIGBnbG9iYWxgIGZ1bmN0aW9uIGluc3RlYWQuXG4gIHZhciBmcmVlR2xvYmFsID0gdHlwZW9mIGdsb2JhbCA9PSBcIm9iamVjdFwiICYmIGdsb2JhbDtcbiAgaWYgKGZyZWVHbG9iYWwgJiYgKGZyZWVHbG9iYWxbXCJnbG9iYWxcIl0gPT09IGZyZWVHbG9iYWwgfHwgZnJlZUdsb2JhbFtcIndpbmRvd1wiXSA9PT0gZnJlZUdsb2JhbCkpIHtcbiAgICByb290ID0gZnJlZUdsb2JhbDtcbiAgfVxuXG4gIC8vIFB1YmxpYzogSW5pdGlhbGl6ZXMgSlNPTiAzIHVzaW5nIHRoZSBnaXZlbiBgY29udGV4dGAgb2JqZWN0LCBhdHRhY2hpbmcgdGhlXG4gIC8vIGBzdHJpbmdpZnlgIGFuZCBgcGFyc2VgIGZ1bmN0aW9ucyB0byB0aGUgc3BlY2lmaWVkIGBleHBvcnRzYCBvYmplY3QuXG4gIGZ1bmN0aW9uIHJ1bkluQ29udGV4dChjb250ZXh0LCBleHBvcnRzKSB7XG4gICAgY29udGV4dCB8fCAoY29udGV4dCA9IHJvb3RbXCJPYmplY3RcIl0oKSk7XG4gICAgZXhwb3J0cyB8fCAoZXhwb3J0cyA9IHJvb3RbXCJPYmplY3RcIl0oKSk7XG5cbiAgICAvLyBOYXRpdmUgY29uc3RydWN0b3IgYWxpYXNlcy5cbiAgICB2YXIgTnVtYmVyID0gY29udGV4dFtcIk51bWJlclwiXSB8fCByb290W1wiTnVtYmVyXCJdLFxuICAgICAgICBTdHJpbmcgPSBjb250ZXh0W1wiU3RyaW5nXCJdIHx8IHJvb3RbXCJTdHJpbmdcIl0sXG4gICAgICAgIE9iamVjdCA9IGNvbnRleHRbXCJPYmplY3RcIl0gfHwgcm9vdFtcIk9iamVjdFwiXSxcbiAgICAgICAgRGF0ZSA9IGNvbnRleHRbXCJEYXRlXCJdIHx8IHJvb3RbXCJEYXRlXCJdLFxuICAgICAgICBTeW50YXhFcnJvciA9IGNvbnRleHRbXCJTeW50YXhFcnJvclwiXSB8fCByb290W1wiU3ludGF4RXJyb3JcIl0sXG4gICAgICAgIFR5cGVFcnJvciA9IGNvbnRleHRbXCJUeXBlRXJyb3JcIl0gfHwgcm9vdFtcIlR5cGVFcnJvclwiXSxcbiAgICAgICAgTWF0aCA9IGNvbnRleHRbXCJNYXRoXCJdIHx8IHJvb3RbXCJNYXRoXCJdLFxuICAgICAgICBuYXRpdmVKU09OID0gY29udGV4dFtcIkpTT05cIl0gfHwgcm9vdFtcIkpTT05cIl07XG5cbiAgICAvLyBEZWxlZ2F0ZSB0byB0aGUgbmF0aXZlIGBzdHJpbmdpZnlgIGFuZCBgcGFyc2VgIGltcGxlbWVudGF0aW9ucy5cbiAgICBpZiAodHlwZW9mIG5hdGl2ZUpTT04gPT0gXCJvYmplY3RcIiAmJiBuYXRpdmVKU09OKSB7XG4gICAgICBleHBvcnRzLnN0cmluZ2lmeSA9IG5hdGl2ZUpTT04uc3RyaW5naWZ5O1xuICAgICAgZXhwb3J0cy5wYXJzZSA9IG5hdGl2ZUpTT04ucGFyc2U7XG4gICAgfVxuXG4gICAgLy8gQ29udmVuaWVuY2UgYWxpYXNlcy5cbiAgICB2YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlLFxuICAgICAgICBnZXRDbGFzcyA9IG9iamVjdFByb3RvLnRvU3RyaW5nLFxuICAgICAgICBpc1Byb3BlcnR5LCBmb3JFYWNoLCB1bmRlZjtcblxuICAgIC8vIFRlc3QgdGhlIGBEYXRlI2dldFVUQypgIG1ldGhvZHMuIEJhc2VkIG9uIHdvcmsgYnkgQFlhZmZsZS5cbiAgICB2YXIgaXNFeHRlbmRlZCA9IG5ldyBEYXRlKC0zNTA5ODI3MzM0NTczMjkyKTtcbiAgICB0cnkge1xuICAgICAgLy8gVGhlIGBnZXRVVENGdWxsWWVhcmAsIGBNb250aGAsIGFuZCBgRGF0ZWAgbWV0aG9kcyByZXR1cm4gbm9uc2Vuc2ljYWxcbiAgICAgIC8vIHJlc3VsdHMgZm9yIGNlcnRhaW4gZGF0ZXMgaW4gT3BlcmEgPj0gMTAuNTMuXG4gICAgICBpc0V4dGVuZGVkID0gaXNFeHRlbmRlZC5nZXRVVENGdWxsWWVhcigpID09IC0xMDkyNTIgJiYgaXNFeHRlbmRlZC5nZXRVVENNb250aCgpID09PSAwICYmIGlzRXh0ZW5kZWQuZ2V0VVRDRGF0ZSgpID09PSAxICYmXG4gICAgICAgIC8vIFNhZmFyaSA8IDIuMC4yIHN0b3JlcyB0aGUgaW50ZXJuYWwgbWlsbGlzZWNvbmQgdGltZSB2YWx1ZSBjb3JyZWN0bHksXG4gICAgICAgIC8vIGJ1dCBjbGlwcyB0aGUgdmFsdWVzIHJldHVybmVkIGJ5IHRoZSBkYXRlIG1ldGhvZHMgdG8gdGhlIHJhbmdlIG9mXG4gICAgICAgIC8vIHNpZ25lZCAzMi1iaXQgaW50ZWdlcnMgKFstMiAqKiAzMSwgMiAqKiAzMSAtIDFdKS5cbiAgICAgICAgaXNFeHRlbmRlZC5nZXRVVENIb3VycygpID09IDEwICYmIGlzRXh0ZW5kZWQuZ2V0VVRDTWludXRlcygpID09IDM3ICYmIGlzRXh0ZW5kZWQuZ2V0VVRDU2Vjb25kcygpID09IDYgJiYgaXNFeHRlbmRlZC5nZXRVVENNaWxsaXNlY29uZHMoKSA9PSA3MDg7XG4gICAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7fVxuXG4gICAgLy8gSW50ZXJuYWw6IERldGVybWluZXMgd2hldGhlciB0aGUgbmF0aXZlIGBKU09OLnN0cmluZ2lmeWAgYW5kIGBwYXJzZWBcbiAgICAvLyBpbXBsZW1lbnRhdGlvbnMgYXJlIHNwZWMtY29tcGxpYW50LiBCYXNlZCBvbiB3b3JrIGJ5IEtlbiBTbnlkZXIuXG4gICAgZnVuY3Rpb24gaGFzKG5hbWUpIHtcbiAgICAgIGlmIChoYXNbbmFtZV0gIT09IHVuZGVmKSB7XG4gICAgICAgIC8vIFJldHVybiBjYWNoZWQgZmVhdHVyZSB0ZXN0IHJlc3VsdC5cbiAgICAgICAgcmV0dXJuIGhhc1tuYW1lXTtcbiAgICAgIH1cbiAgICAgIHZhciBpc1N1cHBvcnRlZDtcbiAgICAgIGlmIChuYW1lID09IFwiYnVnLXN0cmluZy1jaGFyLWluZGV4XCIpIHtcbiAgICAgICAgLy8gSUUgPD0gNyBkb2Vzbid0IHN1cHBvcnQgYWNjZXNzaW5nIHN0cmluZyBjaGFyYWN0ZXJzIHVzaW5nIHNxdWFyZVxuICAgICAgICAvLyBicmFja2V0IG5vdGF0aW9uLiBJRSA4IG9ubHkgc3VwcG9ydHMgdGhpcyBmb3IgcHJpbWl0aXZlcy5cbiAgICAgICAgaXNTdXBwb3J0ZWQgPSBcImFcIlswXSAhPSBcImFcIjtcbiAgICAgIH0gZWxzZSBpZiAobmFtZSA9PSBcImpzb25cIikge1xuICAgICAgICAvLyBJbmRpY2F0ZXMgd2hldGhlciBib3RoIGBKU09OLnN0cmluZ2lmeWAgYW5kIGBKU09OLnBhcnNlYCBhcmVcbiAgICAgICAgLy8gc3VwcG9ydGVkLlxuICAgICAgICBpc1N1cHBvcnRlZCA9IGhhcyhcImpzb24tc3RyaW5naWZ5XCIpICYmIGhhcyhcImpzb24tcGFyc2VcIik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgdmFsdWUsIHNlcmlhbGl6ZWQgPSAne1wiYVwiOlsxLHRydWUsZmFsc2UsbnVsbCxcIlxcXFx1MDAwMFxcXFxiXFxcXG5cXFxcZlxcXFxyXFxcXHRcIl19JztcbiAgICAgICAgLy8gVGVzdCBgSlNPTi5zdHJpbmdpZnlgLlxuICAgICAgICBpZiAobmFtZSA9PSBcImpzb24tc3RyaW5naWZ5XCIpIHtcbiAgICAgICAgICB2YXIgc3RyaW5naWZ5ID0gZXhwb3J0cy5zdHJpbmdpZnksIHN0cmluZ2lmeVN1cHBvcnRlZCA9IHR5cGVvZiBzdHJpbmdpZnkgPT0gXCJmdW5jdGlvblwiICYmIGlzRXh0ZW5kZWQ7XG4gICAgICAgICAgaWYgKHN0cmluZ2lmeVN1cHBvcnRlZCkge1xuICAgICAgICAgICAgLy8gQSB0ZXN0IGZ1bmN0aW9uIG9iamVjdCB3aXRoIGEgY3VzdG9tIGB0b0pTT05gIG1ldGhvZC5cbiAgICAgICAgICAgICh2YWx1ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgICAgICB9KS50b0pTT04gPSB2YWx1ZTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIHN0cmluZ2lmeVN1cHBvcnRlZCA9XG4gICAgICAgICAgICAgICAgLy8gRmlyZWZveCAzLjFiMSBhbmQgYjIgc2VyaWFsaXplIHN0cmluZywgbnVtYmVyLCBhbmQgYm9vbGVhblxuICAgICAgICAgICAgICAgIC8vIHByaW1pdGl2ZXMgYXMgb2JqZWN0IGxpdGVyYWxzLlxuICAgICAgICAgICAgICAgIHN0cmluZ2lmeSgwKSA9PT0gXCIwXCIgJiZcbiAgICAgICAgICAgICAgICAvLyBGRiAzLjFiMSwgYjIsIGFuZCBKU09OIDIgc2VyaWFsaXplIHdyYXBwZWQgcHJpbWl0aXZlcyBhcyBvYmplY3RcbiAgICAgICAgICAgICAgICAvLyBsaXRlcmFscy5cbiAgICAgICAgICAgICAgICBzdHJpbmdpZnkobmV3IE51bWJlcigpKSA9PT0gXCIwXCIgJiZcbiAgICAgICAgICAgICAgICBzdHJpbmdpZnkobmV3IFN0cmluZygpKSA9PSAnXCJcIicgJiZcbiAgICAgICAgICAgICAgICAvLyBGRiAzLjFiMSwgMiB0aHJvdyBhbiBlcnJvciBpZiB0aGUgdmFsdWUgaXMgYG51bGxgLCBgdW5kZWZpbmVkYCwgb3JcbiAgICAgICAgICAgICAgICAvLyBkb2VzIG5vdCBkZWZpbmUgYSBjYW5vbmljYWwgSlNPTiByZXByZXNlbnRhdGlvbiAodGhpcyBhcHBsaWVzIHRvXG4gICAgICAgICAgICAgICAgLy8gb2JqZWN0cyB3aXRoIGB0b0pTT05gIHByb3BlcnRpZXMgYXMgd2VsbCwgKnVubGVzcyogdGhleSBhcmUgbmVzdGVkXG4gICAgICAgICAgICAgICAgLy8gd2l0aGluIGFuIG9iamVjdCBvciBhcnJheSkuXG4gICAgICAgICAgICAgICAgc3RyaW5naWZ5KGdldENsYXNzKSA9PT0gdW5kZWYgJiZcbiAgICAgICAgICAgICAgICAvLyBJRSA4IHNlcmlhbGl6ZXMgYHVuZGVmaW5lZGAgYXMgYFwidW5kZWZpbmVkXCJgLiBTYWZhcmkgPD0gNS4xLjcgYW5kXG4gICAgICAgICAgICAgICAgLy8gRkYgMy4xYjMgcGFzcyB0aGlzIHRlc3QuXG4gICAgICAgICAgICAgICAgc3RyaW5naWZ5KHVuZGVmKSA9PT0gdW5kZWYgJiZcbiAgICAgICAgICAgICAgICAvLyBTYWZhcmkgPD0gNS4xLjcgYW5kIEZGIDMuMWIzIHRocm93IGBFcnJvcmBzIGFuZCBgVHlwZUVycm9yYHMsXG4gICAgICAgICAgICAgICAgLy8gcmVzcGVjdGl2ZWx5LCBpZiB0aGUgdmFsdWUgaXMgb21pdHRlZCBlbnRpcmVseS5cbiAgICAgICAgICAgICAgICBzdHJpbmdpZnkoKSA9PT0gdW5kZWYgJiZcbiAgICAgICAgICAgICAgICAvLyBGRiAzLjFiMSwgMiB0aHJvdyBhbiBlcnJvciBpZiB0aGUgZ2l2ZW4gdmFsdWUgaXMgbm90IGEgbnVtYmVyLFxuICAgICAgICAgICAgICAgIC8vIHN0cmluZywgYXJyYXksIG9iamVjdCwgQm9vbGVhbiwgb3IgYG51bGxgIGxpdGVyYWwuIFRoaXMgYXBwbGllcyB0b1xuICAgICAgICAgICAgICAgIC8vIG9iamVjdHMgd2l0aCBjdXN0b20gYHRvSlNPTmAgbWV0aG9kcyBhcyB3ZWxsLCB1bmxlc3MgdGhleSBhcmUgbmVzdGVkXG4gICAgICAgICAgICAgICAgLy8gaW5zaWRlIG9iamVjdCBvciBhcnJheSBsaXRlcmFscy4gWVVJIDMuMC4wYjEgaWdub3JlcyBjdXN0b20gYHRvSlNPTmBcbiAgICAgICAgICAgICAgICAvLyBtZXRob2RzIGVudGlyZWx5LlxuICAgICAgICAgICAgICAgIHN0cmluZ2lmeSh2YWx1ZSkgPT09IFwiMVwiICYmXG4gICAgICAgICAgICAgICAgc3RyaW5naWZ5KFt2YWx1ZV0pID09IFwiWzFdXCIgJiZcbiAgICAgICAgICAgICAgICAvLyBQcm90b3R5cGUgPD0gMS42LjEgc2VyaWFsaXplcyBgW3VuZGVmaW5lZF1gIGFzIGBcIltdXCJgIGluc3RlYWQgb2ZcbiAgICAgICAgICAgICAgICAvLyBgXCJbbnVsbF1cImAuXG4gICAgICAgICAgICAgICAgc3RyaW5naWZ5KFt1bmRlZl0pID09IFwiW251bGxdXCIgJiZcbiAgICAgICAgICAgICAgICAvLyBZVUkgMy4wLjBiMSBmYWlscyB0byBzZXJpYWxpemUgYG51bGxgIGxpdGVyYWxzLlxuICAgICAgICAgICAgICAgIHN0cmluZ2lmeShudWxsKSA9PSBcIm51bGxcIiAmJlxuICAgICAgICAgICAgICAgIC8vIEZGIDMuMWIxLCAyIGhhbHRzIHNlcmlhbGl6YXRpb24gaWYgYW4gYXJyYXkgY29udGFpbnMgYSBmdW5jdGlvbjpcbiAgICAgICAgICAgICAgICAvLyBgWzEsIHRydWUsIGdldENsYXNzLCAxXWAgc2VyaWFsaXplcyBhcyBcIlsxLHRydWUsXSxcIi4gRkYgMy4xYjNcbiAgICAgICAgICAgICAgICAvLyBlbGlkZXMgbm9uLUpTT04gdmFsdWVzIGZyb20gb2JqZWN0cyBhbmQgYXJyYXlzLCB1bmxlc3MgdGhleVxuICAgICAgICAgICAgICAgIC8vIGRlZmluZSBjdXN0b20gYHRvSlNPTmAgbWV0aG9kcy5cbiAgICAgICAgICAgICAgICBzdHJpbmdpZnkoW3VuZGVmLCBnZXRDbGFzcywgbnVsbF0pID09IFwiW251bGwsbnVsbCxudWxsXVwiICYmXG4gICAgICAgICAgICAgICAgLy8gU2ltcGxlIHNlcmlhbGl6YXRpb24gdGVzdC4gRkYgMy4xYjEgdXNlcyBVbmljb2RlIGVzY2FwZSBzZXF1ZW5jZXNcbiAgICAgICAgICAgICAgICAvLyB3aGVyZSBjaGFyYWN0ZXIgZXNjYXBlIGNvZGVzIGFyZSBleHBlY3RlZCAoZS5nLiwgYFxcYmAgPT4gYFxcdTAwMDhgKS5cbiAgICAgICAgICAgICAgICBzdHJpbmdpZnkoeyBcImFcIjogW3ZhbHVlLCB0cnVlLCBmYWxzZSwgbnVsbCwgXCJcXHgwMFxcYlxcblxcZlxcclxcdFwiXSB9KSA9PSBzZXJpYWxpemVkICYmXG4gICAgICAgICAgICAgICAgLy8gRkYgMy4xYjEgYW5kIGIyIGlnbm9yZSB0aGUgYGZpbHRlcmAgYW5kIGB3aWR0aGAgYXJndW1lbnRzLlxuICAgICAgICAgICAgICAgIHN0cmluZ2lmeShudWxsLCB2YWx1ZSkgPT09IFwiMVwiICYmXG4gICAgICAgICAgICAgICAgc3RyaW5naWZ5KFsxLCAyXSwgbnVsbCwgMSkgPT0gXCJbXFxuIDEsXFxuIDJcXG5dXCIgJiZcbiAgICAgICAgICAgICAgICAvLyBKU09OIDIsIFByb3RvdHlwZSA8PSAxLjcsIGFuZCBvbGRlciBXZWJLaXQgYnVpbGRzIGluY29ycmVjdGx5XG4gICAgICAgICAgICAgICAgLy8gc2VyaWFsaXplIGV4dGVuZGVkIHllYXJzLlxuICAgICAgICAgICAgICAgIHN0cmluZ2lmeShuZXcgRGF0ZSgtOC42NGUxNSkpID09ICdcIi0yNzE4MjEtMDQtMjBUMDA6MDA6MDAuMDAwWlwiJyAmJlxuICAgICAgICAgICAgICAgIC8vIFRoZSBtaWxsaXNlY29uZHMgYXJlIG9wdGlvbmFsIGluIEVTIDUsIGJ1dCByZXF1aXJlZCBpbiA1LjEuXG4gICAgICAgICAgICAgICAgc3RyaW5naWZ5KG5ldyBEYXRlKDguNjRlMTUpKSA9PSAnXCIrMjc1NzYwLTA5LTEzVDAwOjAwOjAwLjAwMFpcIicgJiZcbiAgICAgICAgICAgICAgICAvLyBGaXJlZm94IDw9IDExLjAgaW5jb3JyZWN0bHkgc2VyaWFsaXplcyB5ZWFycyBwcmlvciB0byAwIGFzIG5lZ2F0aXZlXG4gICAgICAgICAgICAgICAgLy8gZm91ci1kaWdpdCB5ZWFycyBpbnN0ZWFkIG9mIHNpeC1kaWdpdCB5ZWFycy4gQ3JlZGl0czogQFlhZmZsZS5cbiAgICAgICAgICAgICAgICBzdHJpbmdpZnkobmV3IERhdGUoLTYyMTk4NzU1MmU1KSkgPT0gJ1wiLTAwMDAwMS0wMS0wMVQwMDowMDowMC4wMDBaXCInICYmXG4gICAgICAgICAgICAgICAgLy8gU2FmYXJpIDw9IDUuMS41IGFuZCBPcGVyYSA+PSAxMC41MyBpbmNvcnJlY3RseSBzZXJpYWxpemUgbWlsbGlzZWNvbmRcbiAgICAgICAgICAgICAgICAvLyB2YWx1ZXMgbGVzcyB0aGFuIDEwMDAuIENyZWRpdHM6IEBZYWZmbGUuXG4gICAgICAgICAgICAgICAgc3RyaW5naWZ5KG5ldyBEYXRlKC0xKSkgPT0gJ1wiMTk2OS0xMi0zMVQyMzo1OTo1OS45OTlaXCInO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7XG4gICAgICAgICAgICAgIHN0cmluZ2lmeVN1cHBvcnRlZCA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpc1N1cHBvcnRlZCA9IHN0cmluZ2lmeVN1cHBvcnRlZDtcbiAgICAgICAgfVxuICAgICAgICAvLyBUZXN0IGBKU09OLnBhcnNlYC5cbiAgICAgICAgaWYgKG5hbWUgPT0gXCJqc29uLXBhcnNlXCIpIHtcbiAgICAgICAgICB2YXIgcGFyc2UgPSBleHBvcnRzLnBhcnNlO1xuICAgICAgICAgIGlmICh0eXBlb2YgcGFyc2UgPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAvLyBGRiAzLjFiMSwgYjIgd2lsbCB0aHJvdyBhbiBleGNlcHRpb24gaWYgYSBiYXJlIGxpdGVyYWwgaXMgcHJvdmlkZWQuXG4gICAgICAgICAgICAgIC8vIENvbmZvcm1pbmcgaW1wbGVtZW50YXRpb25zIHNob3VsZCBhbHNvIGNvZXJjZSB0aGUgaW5pdGlhbCBhcmd1bWVudCB0b1xuICAgICAgICAgICAgICAvLyBhIHN0cmluZyBwcmlvciB0byBwYXJzaW5nLlxuICAgICAgICAgICAgICBpZiAocGFyc2UoXCIwXCIpID09PSAwICYmICFwYXJzZShmYWxzZSkpIHtcbiAgICAgICAgICAgICAgICAvLyBTaW1wbGUgcGFyc2luZyB0ZXN0LlxuICAgICAgICAgICAgICAgIHZhbHVlID0gcGFyc2Uoc2VyaWFsaXplZCk7XG4gICAgICAgICAgICAgICAgdmFyIHBhcnNlU3VwcG9ydGVkID0gdmFsdWVbXCJhXCJdLmxlbmd0aCA9PSA1ICYmIHZhbHVlW1wiYVwiXVswXSA9PT0gMTtcbiAgICAgICAgICAgICAgICBpZiAocGFyc2VTdXBwb3J0ZWQpIHtcbiAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFNhZmFyaSA8PSA1LjEuMiBhbmQgRkYgMy4xYjEgYWxsb3cgdW5lc2NhcGVkIHRhYnMgaW4gc3RyaW5ncy5cbiAgICAgICAgICAgICAgICAgICAgcGFyc2VTdXBwb3J0ZWQgPSAhcGFyc2UoJ1wiXFx0XCInKTtcbiAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge31cbiAgICAgICAgICAgICAgICAgIGlmIChwYXJzZVN1cHBvcnRlZCkge1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgIC8vIEZGIDQuMCBhbmQgNC4wLjEgYWxsb3cgbGVhZGluZyBgK2Agc2lnbnMgYW5kIGxlYWRpbmdcbiAgICAgICAgICAgICAgICAgICAgICAvLyBkZWNpbWFsIHBvaW50cy4gRkYgNC4wLCA0LjAuMSwgYW5kIElFIDktMTAgYWxzbyBhbGxvd1xuICAgICAgICAgICAgICAgICAgICAgIC8vIGNlcnRhaW4gb2N0YWwgbGl0ZXJhbHMuXG4gICAgICAgICAgICAgICAgICAgICAgcGFyc2VTdXBwb3J0ZWQgPSBwYXJzZShcIjAxXCIpICE9PSAxO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChleGNlcHRpb24pIHt9XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICBpZiAocGFyc2VTdXBwb3J0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAvLyBGRiA0LjAsIDQuMC4xLCBhbmQgUmhpbm8gMS43UjMtUjQgYWxsb3cgdHJhaWxpbmcgZGVjaW1hbFxuICAgICAgICAgICAgICAgICAgICAgIC8vIHBvaW50cy4gVGhlc2UgZW52aXJvbm1lbnRzLCBhbG9uZyB3aXRoIEZGIDMuMWIxIGFuZCAyLFxuICAgICAgICAgICAgICAgICAgICAgIC8vIGFsc28gYWxsb3cgdHJhaWxpbmcgY29tbWFzIGluIEpTT04gb2JqZWN0cyBhbmQgYXJyYXlzLlxuICAgICAgICAgICAgICAgICAgICAgIHBhcnNlU3VwcG9ydGVkID0gcGFyc2UoXCIxLlwiKSAhPT0gMTtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7fVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7XG4gICAgICAgICAgICAgIHBhcnNlU3VwcG9ydGVkID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlzU3VwcG9ydGVkID0gcGFyc2VTdXBwb3J0ZWQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBoYXNbbmFtZV0gPSAhIWlzU3VwcG9ydGVkO1xuICAgIH1cblxuICAgIGlmICghaGFzKFwianNvblwiKSkge1xuICAgICAgLy8gQ29tbW9uIGBbW0NsYXNzXV1gIG5hbWUgYWxpYXNlcy5cbiAgICAgIHZhciBmdW5jdGlvbkNsYXNzID0gXCJbb2JqZWN0IEZ1bmN0aW9uXVwiLFxuICAgICAgICAgIGRhdGVDbGFzcyA9IFwiW29iamVjdCBEYXRlXVwiLFxuICAgICAgICAgIG51bWJlckNsYXNzID0gXCJbb2JqZWN0IE51bWJlcl1cIixcbiAgICAgICAgICBzdHJpbmdDbGFzcyA9IFwiW29iamVjdCBTdHJpbmddXCIsXG4gICAgICAgICAgYXJyYXlDbGFzcyA9IFwiW29iamVjdCBBcnJheV1cIixcbiAgICAgICAgICBib29sZWFuQ2xhc3MgPSBcIltvYmplY3QgQm9vbGVhbl1cIjtcblxuICAgICAgLy8gRGV0ZWN0IGluY29tcGxldGUgc3VwcG9ydCBmb3IgYWNjZXNzaW5nIHN0cmluZyBjaGFyYWN0ZXJzIGJ5IGluZGV4LlxuICAgICAgdmFyIGNoYXJJbmRleEJ1Z2d5ID0gaGFzKFwiYnVnLXN0cmluZy1jaGFyLWluZGV4XCIpO1xuXG4gICAgICAvLyBEZWZpbmUgYWRkaXRpb25hbCB1dGlsaXR5IG1ldGhvZHMgaWYgdGhlIGBEYXRlYCBtZXRob2RzIGFyZSBidWdneS5cbiAgICAgIGlmICghaXNFeHRlbmRlZCkge1xuICAgICAgICB2YXIgZmxvb3IgPSBNYXRoLmZsb29yO1xuICAgICAgICAvLyBBIG1hcHBpbmcgYmV0d2VlbiB0aGUgbW9udGhzIG9mIHRoZSB5ZWFyIGFuZCB0aGUgbnVtYmVyIG9mIGRheXMgYmV0d2VlblxuICAgICAgICAvLyBKYW51YXJ5IDFzdCBhbmQgdGhlIGZpcnN0IG9mIHRoZSByZXNwZWN0aXZlIG1vbnRoLlxuICAgICAgICB2YXIgTW9udGhzID0gWzAsIDMxLCA1OSwgOTAsIDEyMCwgMTUxLCAxODEsIDIxMiwgMjQzLCAyNzMsIDMwNCwgMzM0XTtcbiAgICAgICAgLy8gSW50ZXJuYWw6IENhbGN1bGF0ZXMgdGhlIG51bWJlciBvZiBkYXlzIGJldHdlZW4gdGhlIFVuaXggZXBvY2ggYW5kIHRoZVxuICAgICAgICAvLyBmaXJzdCBkYXkgb2YgdGhlIGdpdmVuIG1vbnRoLlxuICAgICAgICB2YXIgZ2V0RGF5ID0gZnVuY3Rpb24gKHllYXIsIG1vbnRoKSB7XG4gICAgICAgICAgcmV0dXJuIE1vbnRoc1ttb250aF0gKyAzNjUgKiAoeWVhciAtIDE5NzApICsgZmxvb3IoKHllYXIgLSAxOTY5ICsgKG1vbnRoID0gKyhtb250aCA+IDEpKSkgLyA0KSAtIGZsb29yKCh5ZWFyIC0gMTkwMSArIG1vbnRoKSAvIDEwMCkgKyBmbG9vcigoeWVhciAtIDE2MDEgKyBtb250aCkgLyA0MDApO1xuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICAvLyBJbnRlcm5hbDogRGV0ZXJtaW5lcyBpZiBhIHByb3BlcnR5IGlzIGEgZGlyZWN0IHByb3BlcnR5IG9mIHRoZSBnaXZlblxuICAgICAgLy8gb2JqZWN0LiBEZWxlZ2F0ZXMgdG8gdGhlIG5hdGl2ZSBgT2JqZWN0I2hhc093blByb3BlcnR5YCBtZXRob2QuXG4gICAgICBpZiAoIShpc1Byb3BlcnR5ID0gb2JqZWN0UHJvdG8uaGFzT3duUHJvcGVydHkpKSB7XG4gICAgICAgIGlzUHJvcGVydHkgPSBmdW5jdGlvbiAocHJvcGVydHkpIHtcbiAgICAgICAgICB2YXIgbWVtYmVycyA9IHt9LCBjb25zdHJ1Y3RvcjtcbiAgICAgICAgICBpZiAoKG1lbWJlcnMuX19wcm90b19fID0gbnVsbCwgbWVtYmVycy5fX3Byb3RvX18gPSB7XG4gICAgICAgICAgICAvLyBUaGUgKnByb3RvKiBwcm9wZXJ0eSBjYW5ub3QgYmUgc2V0IG11bHRpcGxlIHRpbWVzIGluIHJlY2VudFxuICAgICAgICAgICAgLy8gdmVyc2lvbnMgb2YgRmlyZWZveCBhbmQgU2VhTW9ua2V5LlxuICAgICAgICAgICAgXCJ0b1N0cmluZ1wiOiAxXG4gICAgICAgICAgfSwgbWVtYmVycykudG9TdHJpbmcgIT0gZ2V0Q2xhc3MpIHtcbiAgICAgICAgICAgIC8vIFNhZmFyaSA8PSAyLjAuMyBkb2Vzbid0IGltcGxlbWVudCBgT2JqZWN0I2hhc093blByb3BlcnR5YCwgYnV0XG4gICAgICAgICAgICAvLyBzdXBwb3J0cyB0aGUgbXV0YWJsZSAqcHJvdG8qIHByb3BlcnR5LlxuICAgICAgICAgICAgaXNQcm9wZXJ0eSA9IGZ1bmN0aW9uIChwcm9wZXJ0eSkge1xuICAgICAgICAgICAgICAvLyBDYXB0dXJlIGFuZCBicmVhayB0aGUgb2JqZWN0Z3MgcHJvdG90eXBlIGNoYWluIChzZWUgc2VjdGlvbiA4LjYuMlxuICAgICAgICAgICAgICAvLyBvZiB0aGUgRVMgNS4xIHNwZWMpLiBUaGUgcGFyZW50aGVzaXplZCBleHByZXNzaW9uIHByZXZlbnRzIGFuXG4gICAgICAgICAgICAgIC8vIHVuc2FmZSB0cmFuc2Zvcm1hdGlvbiBieSB0aGUgQ2xvc3VyZSBDb21waWxlci5cbiAgICAgICAgICAgICAgdmFyIG9yaWdpbmFsID0gdGhpcy5fX3Byb3RvX18sIHJlc3VsdCA9IHByb3BlcnR5IGluICh0aGlzLl9fcHJvdG9fXyA9IG51bGwsIHRoaXMpO1xuICAgICAgICAgICAgICAvLyBSZXN0b3JlIHRoZSBvcmlnaW5hbCBwcm90b3R5cGUgY2hhaW4uXG4gICAgICAgICAgICAgIHRoaXMuX19wcm90b19fID0gb3JpZ2luYWw7XG4gICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBDYXB0dXJlIGEgcmVmZXJlbmNlIHRvIHRoZSB0b3AtbGV2ZWwgYE9iamVjdGAgY29uc3RydWN0b3IuXG4gICAgICAgICAgICBjb25zdHJ1Y3RvciA9IG1lbWJlcnMuY29uc3RydWN0b3I7XG4gICAgICAgICAgICAvLyBVc2UgdGhlIGBjb25zdHJ1Y3RvcmAgcHJvcGVydHkgdG8gc2ltdWxhdGUgYE9iamVjdCNoYXNPd25Qcm9wZXJ0eWAgaW5cbiAgICAgICAgICAgIC8vIG90aGVyIGVudmlyb25tZW50cy5cbiAgICAgICAgICAgIGlzUHJvcGVydHkgPSBmdW5jdGlvbiAocHJvcGVydHkpIHtcbiAgICAgICAgICAgICAgdmFyIHBhcmVudCA9ICh0aGlzLmNvbnN0cnVjdG9yIHx8IGNvbnN0cnVjdG9yKS5wcm90b3R5cGU7XG4gICAgICAgICAgICAgIHJldHVybiBwcm9wZXJ0eSBpbiB0aGlzICYmICEocHJvcGVydHkgaW4gcGFyZW50ICYmIHRoaXNbcHJvcGVydHldID09PSBwYXJlbnRbcHJvcGVydHldKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfVxuICAgICAgICAgIG1lbWJlcnMgPSBudWxsO1xuICAgICAgICAgIHJldHVybiBpc1Byb3BlcnR5LmNhbGwodGhpcywgcHJvcGVydHkpO1xuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICAvLyBJbnRlcm5hbDogQSBzZXQgb2YgcHJpbWl0aXZlIHR5cGVzIHVzZWQgYnkgYGlzSG9zdFR5cGVgLlxuICAgICAgdmFyIFByaW1pdGl2ZVR5cGVzID0ge1xuICAgICAgICBcImJvb2xlYW5cIjogMSxcbiAgICAgICAgXCJudW1iZXJcIjogMSxcbiAgICAgICAgXCJzdHJpbmdcIjogMSxcbiAgICAgICAgXCJ1bmRlZmluZWRcIjogMVxuICAgICAgfTtcblxuICAgICAgLy8gSW50ZXJuYWw6IERldGVybWluZXMgaWYgdGhlIGdpdmVuIG9iamVjdCBgcHJvcGVydHlgIHZhbHVlIGlzIGFcbiAgICAgIC8vIG5vbi1wcmltaXRpdmUuXG4gICAgICB2YXIgaXNIb3N0VHlwZSA9IGZ1bmN0aW9uIChvYmplY3QsIHByb3BlcnR5KSB7XG4gICAgICAgIHZhciB0eXBlID0gdHlwZW9mIG9iamVjdFtwcm9wZXJ0eV07XG4gICAgICAgIHJldHVybiB0eXBlID09IFwib2JqZWN0XCIgPyAhIW9iamVjdFtwcm9wZXJ0eV0gOiAhUHJpbWl0aXZlVHlwZXNbdHlwZV07XG4gICAgICB9O1xuXG4gICAgICAvLyBJbnRlcm5hbDogTm9ybWFsaXplcyB0aGUgYGZvci4uLmluYCBpdGVyYXRpb24gYWxnb3JpdGhtIGFjcm9zc1xuICAgICAgLy8gZW52aXJvbm1lbnRzLiBFYWNoIGVudW1lcmF0ZWQga2V5IGlzIHlpZWxkZWQgdG8gYSBgY2FsbGJhY2tgIGZ1bmN0aW9uLlxuICAgICAgZm9yRWFjaCA9IGZ1bmN0aW9uIChvYmplY3QsIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBzaXplID0gMCwgUHJvcGVydGllcywgbWVtYmVycywgcHJvcGVydHk7XG5cbiAgICAgICAgLy8gVGVzdHMgZm9yIGJ1Z3MgaW4gdGhlIGN1cnJlbnQgZW52aXJvbm1lbnQncyBgZm9yLi4uaW5gIGFsZ29yaXRobS4gVGhlXG4gICAgICAgIC8vIGB2YWx1ZU9mYCBwcm9wZXJ0eSBpbmhlcml0cyB0aGUgbm9uLWVudW1lcmFibGUgZmxhZyBmcm9tXG4gICAgICAgIC8vIGBPYmplY3QucHJvdG90eXBlYCBpbiBvbGRlciB2ZXJzaW9ucyBvZiBJRSwgTmV0c2NhcGUsIGFuZCBNb3ppbGxhLlxuICAgICAgICAoUHJvcGVydGllcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICB0aGlzLnZhbHVlT2YgPSAwO1xuICAgICAgICB9KS5wcm90b3R5cGUudmFsdWVPZiA9IDA7XG5cbiAgICAgICAgLy8gSXRlcmF0ZSBvdmVyIGEgbmV3IGluc3RhbmNlIG9mIHRoZSBgUHJvcGVydGllc2AgY2xhc3MuXG4gICAgICAgIG1lbWJlcnMgPSBuZXcgUHJvcGVydGllcygpO1xuICAgICAgICBmb3IgKHByb3BlcnR5IGluIG1lbWJlcnMpIHtcbiAgICAgICAgICAvLyBJZ25vcmUgYWxsIHByb3BlcnRpZXMgaW5oZXJpdGVkIGZyb20gYE9iamVjdC5wcm90b3R5cGVgLlxuICAgICAgICAgIGlmIChpc1Byb3BlcnR5LmNhbGwobWVtYmVycywgcHJvcGVydHkpKSB7XG4gICAgICAgICAgICBzaXplKys7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFByb3BlcnRpZXMgPSBtZW1iZXJzID0gbnVsbDtcblxuICAgICAgICAvLyBOb3JtYWxpemUgdGhlIGl0ZXJhdGlvbiBhbGdvcml0aG0uXG4gICAgICAgIGlmICghc2l6ZSkge1xuICAgICAgICAgIC8vIEEgbGlzdCBvZiBub24tZW51bWVyYWJsZSBwcm9wZXJ0aWVzIGluaGVyaXRlZCBmcm9tIGBPYmplY3QucHJvdG90eXBlYC5cbiAgICAgICAgICBtZW1iZXJzID0gW1widmFsdWVPZlwiLCBcInRvU3RyaW5nXCIsIFwidG9Mb2NhbGVTdHJpbmdcIiwgXCJwcm9wZXJ0eUlzRW51bWVyYWJsZVwiLCBcImlzUHJvdG90eXBlT2ZcIiwgXCJoYXNPd25Qcm9wZXJ0eVwiLCBcImNvbnN0cnVjdG9yXCJdO1xuICAgICAgICAgIC8vIElFIDw9IDgsIE1vemlsbGEgMS4wLCBhbmQgTmV0c2NhcGUgNi4yIGlnbm9yZSBzaGFkb3dlZCBub24tZW51bWVyYWJsZVxuICAgICAgICAgIC8vIHByb3BlcnRpZXMuXG4gICAgICAgICAgZm9yRWFjaCA9IGZ1bmN0aW9uIChvYmplY3QsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICB2YXIgaXNGdW5jdGlvbiA9IGdldENsYXNzLmNhbGwob2JqZWN0KSA9PSBmdW5jdGlvbkNsYXNzLCBwcm9wZXJ0eSwgbGVuZ3RoO1xuICAgICAgICAgICAgdmFyIGhhc1Byb3BlcnR5ID0gIWlzRnVuY3Rpb24gJiYgdHlwZW9mIG9iamVjdC5jb25zdHJ1Y3RvciAhPSBcImZ1bmN0aW9uXCIgJiYgaXNIb3N0VHlwZShvYmplY3QsIFwiaGFzT3duUHJvcGVydHlcIikgPyBvYmplY3QuaGFzT3duUHJvcGVydHkgOiBpc1Byb3BlcnR5O1xuICAgICAgICAgICAgZm9yIChwcm9wZXJ0eSBpbiBvYmplY3QpIHtcbiAgICAgICAgICAgICAgLy8gR2Vja28gPD0gMS4wIGVudW1lcmF0ZXMgdGhlIGBwcm90b3R5cGVgIHByb3BlcnR5IG9mIGZ1bmN0aW9ucyB1bmRlclxuICAgICAgICAgICAgICAvLyBjZXJ0YWluIGNvbmRpdGlvbnM7IElFIGRvZXMgbm90LlxuICAgICAgICAgICAgICBpZiAoIShpc0Z1bmN0aW9uICYmIHByb3BlcnR5ID09IFwicHJvdG90eXBlXCIpICYmIGhhc1Byb3BlcnR5LmNhbGwob2JqZWN0LCBwcm9wZXJ0eSkpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhwcm9wZXJ0eSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIE1hbnVhbGx5IGludm9rZSB0aGUgY2FsbGJhY2sgZm9yIGVhY2ggbm9uLWVudW1lcmFibGUgcHJvcGVydHkuXG4gICAgICAgICAgICBmb3IgKGxlbmd0aCA9IG1lbWJlcnMubGVuZ3RoOyBwcm9wZXJ0eSA9IG1lbWJlcnNbLS1sZW5ndGhdOyBoYXNQcm9wZXJ0eS5jYWxsKG9iamVjdCwgcHJvcGVydHkpICYmIGNhbGxiYWNrKHByb3BlcnR5KSk7XG4gICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIGlmIChzaXplID09IDIpIHtcbiAgICAgICAgICAvLyBTYWZhcmkgPD0gMi4wLjQgZW51bWVyYXRlcyBzaGFkb3dlZCBwcm9wZXJ0aWVzIHR3aWNlLlxuICAgICAgICAgIGZvckVhY2ggPSBmdW5jdGlvbiAob2JqZWN0LCBjYWxsYmFjaykge1xuICAgICAgICAgICAgLy8gQ3JlYXRlIGEgc2V0IG9mIGl0ZXJhdGVkIHByb3BlcnRpZXMuXG4gICAgICAgICAgICB2YXIgbWVtYmVycyA9IHt9LCBpc0Z1bmN0aW9uID0gZ2V0Q2xhc3MuY2FsbChvYmplY3QpID09IGZ1bmN0aW9uQ2xhc3MsIHByb3BlcnR5O1xuICAgICAgICAgICAgZm9yIChwcm9wZXJ0eSBpbiBvYmplY3QpIHtcbiAgICAgICAgICAgICAgLy8gU3RvcmUgZWFjaCBwcm9wZXJ0eSBuYW1lIHRvIHByZXZlbnQgZG91YmxlIGVudW1lcmF0aW9uLiBUaGVcbiAgICAgICAgICAgICAgLy8gYHByb3RvdHlwZWAgcHJvcGVydHkgb2YgZnVuY3Rpb25zIGlzIG5vdCBlbnVtZXJhdGVkIGR1ZSB0byBjcm9zcy1cbiAgICAgICAgICAgICAgLy8gZW52aXJvbm1lbnQgaW5jb25zaXN0ZW5jaWVzLlxuICAgICAgICAgICAgICBpZiAoIShpc0Z1bmN0aW9uICYmIHByb3BlcnR5ID09IFwicHJvdG90eXBlXCIpICYmICFpc1Byb3BlcnR5LmNhbGwobWVtYmVycywgcHJvcGVydHkpICYmIChtZW1iZXJzW3Byb3BlcnR5XSA9IDEpICYmIGlzUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3BlcnR5KSkge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKHByb3BlcnR5KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gTm8gYnVncyBkZXRlY3RlZDsgdXNlIHRoZSBzdGFuZGFyZCBgZm9yLi4uaW5gIGFsZ29yaXRobS5cbiAgICAgICAgICBmb3JFYWNoID0gZnVuY3Rpb24gKG9iamVjdCwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHZhciBpc0Z1bmN0aW9uID0gZ2V0Q2xhc3MuY2FsbChvYmplY3QpID09IGZ1bmN0aW9uQ2xhc3MsIHByb3BlcnR5LCBpc0NvbnN0cnVjdG9yO1xuICAgICAgICAgICAgZm9yIChwcm9wZXJ0eSBpbiBvYmplY3QpIHtcbiAgICAgICAgICAgICAgaWYgKCEoaXNGdW5jdGlvbiAmJiBwcm9wZXJ0eSA9PSBcInByb3RvdHlwZVwiKSAmJiBpc1Byb3BlcnR5LmNhbGwob2JqZWN0LCBwcm9wZXJ0eSkgJiYgIShpc0NvbnN0cnVjdG9yID0gcHJvcGVydHkgPT09IFwiY29uc3RydWN0b3JcIikpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhwcm9wZXJ0eSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIE1hbnVhbGx5IGludm9rZSB0aGUgY2FsbGJhY2sgZm9yIHRoZSBgY29uc3RydWN0b3JgIHByb3BlcnR5IGR1ZSB0b1xuICAgICAgICAgICAgLy8gY3Jvc3MtZW52aXJvbm1lbnQgaW5jb25zaXN0ZW5jaWVzLlxuICAgICAgICAgICAgaWYgKGlzQ29uc3RydWN0b3IgfHwgaXNQcm9wZXJ0eS5jYWxsKG9iamVjdCwgKHByb3BlcnR5ID0gXCJjb25zdHJ1Y3RvclwiKSkpIHtcbiAgICAgICAgICAgICAgY2FsbGJhY2socHJvcGVydHkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZvckVhY2gob2JqZWN0LCBjYWxsYmFjayk7XG4gICAgICB9O1xuXG4gICAgICAvLyBQdWJsaWM6IFNlcmlhbGl6ZXMgYSBKYXZhU2NyaXB0IGB2YWx1ZWAgYXMgYSBKU09OIHN0cmluZy4gVGhlIG9wdGlvbmFsXG4gICAgICAvLyBgZmlsdGVyYCBhcmd1bWVudCBtYXkgc3BlY2lmeSBlaXRoZXIgYSBmdW5jdGlvbiB0aGF0IGFsdGVycyBob3cgb2JqZWN0IGFuZFxuICAgICAgLy8gYXJyYXkgbWVtYmVycyBhcmUgc2VyaWFsaXplZCwgb3IgYW4gYXJyYXkgb2Ygc3RyaW5ncyBhbmQgbnVtYmVycyB0aGF0XG4gICAgICAvLyBpbmRpY2F0ZXMgd2hpY2ggcHJvcGVydGllcyBzaG91bGQgYmUgc2VyaWFsaXplZC4gVGhlIG9wdGlvbmFsIGB3aWR0aGBcbiAgICAgIC8vIGFyZ3VtZW50IG1heSBiZSBlaXRoZXIgYSBzdHJpbmcgb3IgbnVtYmVyIHRoYXQgc3BlY2lmaWVzIHRoZSBpbmRlbnRhdGlvblxuICAgICAgLy8gbGV2ZWwgb2YgdGhlIG91dHB1dC5cbiAgICAgIGlmICghaGFzKFwianNvbi1zdHJpbmdpZnlcIikpIHtcbiAgICAgICAgLy8gSW50ZXJuYWw6IEEgbWFwIG9mIGNvbnRyb2wgY2hhcmFjdGVycyBhbmQgdGhlaXIgZXNjYXBlZCBlcXVpdmFsZW50cy5cbiAgICAgICAgdmFyIEVzY2FwZXMgPSB7XG4gICAgICAgICAgOTI6IFwiXFxcXFxcXFxcIixcbiAgICAgICAgICAzNDogJ1xcXFxcIicsXG4gICAgICAgICAgODogXCJcXFxcYlwiLFxuICAgICAgICAgIDEyOiBcIlxcXFxmXCIsXG4gICAgICAgICAgMTA6IFwiXFxcXG5cIixcbiAgICAgICAgICAxMzogXCJcXFxcclwiLFxuICAgICAgICAgIDk6IFwiXFxcXHRcIlxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIEludGVybmFsOiBDb252ZXJ0cyBgdmFsdWVgIGludG8gYSB6ZXJvLXBhZGRlZCBzdHJpbmcgc3VjaCB0aGF0IGl0c1xuICAgICAgICAvLyBsZW5ndGggaXMgYXQgbGVhc3QgZXF1YWwgdG8gYHdpZHRoYC4gVGhlIGB3aWR0aGAgbXVzdCBiZSA8PSA2LlxuICAgICAgICB2YXIgbGVhZGluZ1plcm9lcyA9IFwiMDAwMDAwXCI7XG4gICAgICAgIHZhciB0b1BhZGRlZFN0cmluZyA9IGZ1bmN0aW9uICh3aWR0aCwgdmFsdWUpIHtcbiAgICAgICAgICAvLyBUaGUgYHx8IDBgIGV4cHJlc3Npb24gaXMgbmVjZXNzYXJ5IHRvIHdvcmsgYXJvdW5kIGEgYnVnIGluXG4gICAgICAgICAgLy8gT3BlcmEgPD0gNy41NHUyIHdoZXJlIGAwID09IC0wYCwgYnV0IGBTdHJpbmcoLTApICE9PSBcIjBcImAuXG4gICAgICAgICAgcmV0dXJuIChsZWFkaW5nWmVyb2VzICsgKHZhbHVlIHx8IDApKS5zbGljZSgtd2lkdGgpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIEludGVybmFsOiBEb3VibGUtcXVvdGVzIGEgc3RyaW5nIGB2YWx1ZWAsIHJlcGxhY2luZyBhbGwgQVNDSUkgY29udHJvbFxuICAgICAgICAvLyBjaGFyYWN0ZXJzIChjaGFyYWN0ZXJzIHdpdGggY29kZSB1bml0IHZhbHVlcyBiZXR3ZWVuIDAgYW5kIDMxKSB3aXRoXG4gICAgICAgIC8vIHRoZWlyIGVzY2FwZWQgZXF1aXZhbGVudHMuIFRoaXMgaXMgYW4gaW1wbGVtZW50YXRpb24gb2YgdGhlXG4gICAgICAgIC8vIGBRdW90ZSh2YWx1ZSlgIG9wZXJhdGlvbiBkZWZpbmVkIGluIEVTIDUuMSBzZWN0aW9uIDE1LjEyLjMuXG4gICAgICAgIHZhciB1bmljb2RlUHJlZml4ID0gXCJcXFxcdTAwXCI7XG4gICAgICAgIHZhciBxdW90ZSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgIHZhciByZXN1bHQgPSAnXCInLCBpbmRleCA9IDAsIGxlbmd0aCA9IHZhbHVlLmxlbmd0aCwgdXNlQ2hhckluZGV4ID0gIWNoYXJJbmRleEJ1Z2d5IHx8IGxlbmd0aCA+IDEwO1xuICAgICAgICAgIHZhciBzeW1ib2xzID0gdXNlQ2hhckluZGV4ICYmIChjaGFySW5kZXhCdWdneSA/IHZhbHVlLnNwbGl0KFwiXCIpIDogdmFsdWUpO1xuICAgICAgICAgIGZvciAoOyBpbmRleCA8IGxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICAgICAgdmFyIGNoYXJDb2RlID0gdmFsdWUuY2hhckNvZGVBdChpbmRleCk7XG4gICAgICAgICAgICAvLyBJZiB0aGUgY2hhcmFjdGVyIGlzIGEgY29udHJvbCBjaGFyYWN0ZXIsIGFwcGVuZCBpdHMgVW5pY29kZSBvclxuICAgICAgICAgICAgLy8gc2hvcnRoYW5kIGVzY2FwZSBzZXF1ZW5jZTsgb3RoZXJ3aXNlLCBhcHBlbmQgdGhlIGNoYXJhY3RlciBhcy1pcy5cbiAgICAgICAgICAgIHN3aXRjaCAoY2hhckNvZGUpIHtcbiAgICAgICAgICAgICAgY2FzZSA4OiBjYXNlIDk6IGNhc2UgMTA6IGNhc2UgMTI6IGNhc2UgMTM6IGNhc2UgMzQ6IGNhc2UgOTI6XG4gICAgICAgICAgICAgICAgcmVzdWx0ICs9IEVzY2FwZXNbY2hhckNvZGVdO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIGlmIChjaGFyQ29kZSA8IDMyKSB7XG4gICAgICAgICAgICAgICAgICByZXN1bHQgKz0gdW5pY29kZVByZWZpeCArIHRvUGFkZGVkU3RyaW5nKDIsIGNoYXJDb2RlLnRvU3RyaW5nKDE2KSk7XG4gICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmVzdWx0ICs9IHVzZUNoYXJJbmRleCA/IHN5bWJvbHNbaW5kZXhdIDogdmFsdWUuY2hhckF0KGluZGV4KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHJlc3VsdCArICdcIic7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gSW50ZXJuYWw6IFJlY3Vyc2l2ZWx5IHNlcmlhbGl6ZXMgYW4gb2JqZWN0LiBJbXBsZW1lbnRzIHRoZVxuICAgICAgICAvLyBgU3RyKGtleSwgaG9sZGVyKWAsIGBKTyh2YWx1ZSlgLCBhbmQgYEpBKHZhbHVlKWAgb3BlcmF0aW9ucy5cbiAgICAgICAgdmFyIHNlcmlhbGl6ZSA9IGZ1bmN0aW9uIChwcm9wZXJ0eSwgb2JqZWN0LCBjYWxsYmFjaywgcHJvcGVydGllcywgd2hpdGVzcGFjZSwgaW5kZW50YXRpb24sIHN0YWNrKSB7XG4gICAgICAgICAgdmFyIHZhbHVlLCBjbGFzc05hbWUsIHllYXIsIG1vbnRoLCBkYXRlLCB0aW1lLCBob3VycywgbWludXRlcywgc2Vjb25kcywgbWlsbGlzZWNvbmRzLCByZXN1bHRzLCBlbGVtZW50LCBpbmRleCwgbGVuZ3RoLCBwcmVmaXgsIHJlc3VsdDtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gTmVjZXNzYXJ5IGZvciBob3N0IG9iamVjdCBzdXBwb3J0LlxuICAgICAgICAgICAgdmFsdWUgPSBvYmplY3RbcHJvcGVydHldO1xuICAgICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge31cbiAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09IFwib2JqZWN0XCIgJiYgdmFsdWUpIHtcbiAgICAgICAgICAgIGNsYXNzTmFtZSA9IGdldENsYXNzLmNhbGwodmFsdWUpO1xuICAgICAgICAgICAgaWYgKGNsYXNzTmFtZSA9PSBkYXRlQ2xhc3MgJiYgIWlzUHJvcGVydHkuY2FsbCh2YWx1ZSwgXCJ0b0pTT05cIikpIHtcbiAgICAgICAgICAgICAgaWYgKHZhbHVlID4gLTEgLyAwICYmIHZhbHVlIDwgMSAvIDApIHtcbiAgICAgICAgICAgICAgICAvLyBEYXRlcyBhcmUgc2VyaWFsaXplZCBhY2NvcmRpbmcgdG8gdGhlIGBEYXRlI3RvSlNPTmAgbWV0aG9kXG4gICAgICAgICAgICAgICAgLy8gc3BlY2lmaWVkIGluIEVTIDUuMSBzZWN0aW9uIDE1LjkuNS40NC4gU2VlIHNlY3Rpb24gMTUuOS4xLjE1XG4gICAgICAgICAgICAgICAgLy8gZm9yIHRoZSBJU08gODYwMSBkYXRlIHRpbWUgc3RyaW5nIGZvcm1hdC5cbiAgICAgICAgICAgICAgICBpZiAoZ2V0RGF5KSB7XG4gICAgICAgICAgICAgICAgICAvLyBNYW51YWxseSBjb21wdXRlIHRoZSB5ZWFyLCBtb250aCwgZGF0ZSwgaG91cnMsIG1pbnV0ZXMsXG4gICAgICAgICAgICAgICAgICAvLyBzZWNvbmRzLCBhbmQgbWlsbGlzZWNvbmRzIGlmIHRoZSBgZ2V0VVRDKmAgbWV0aG9kcyBhcmVcbiAgICAgICAgICAgICAgICAgIC8vIGJ1Z2d5LiBBZGFwdGVkIGZyb20gQFlhZmZsZSdzIGBkYXRlLXNoaW1gIHByb2plY3QuXG4gICAgICAgICAgICAgICAgICBkYXRlID0gZmxvb3IodmFsdWUgLyA4NjRlNSk7XG4gICAgICAgICAgICAgICAgICBmb3IgKHllYXIgPSBmbG9vcihkYXRlIC8gMzY1LjI0MjUpICsgMTk3MCAtIDE7IGdldERheSh5ZWFyICsgMSwgMCkgPD0gZGF0ZTsgeWVhcisrKTtcbiAgICAgICAgICAgICAgICAgIGZvciAobW9udGggPSBmbG9vcigoZGF0ZSAtIGdldERheSh5ZWFyLCAwKSkgLyAzMC40Mik7IGdldERheSh5ZWFyLCBtb250aCArIDEpIDw9IGRhdGU7IG1vbnRoKyspO1xuICAgICAgICAgICAgICAgICAgZGF0ZSA9IDEgKyBkYXRlIC0gZ2V0RGF5KHllYXIsIG1vbnRoKTtcbiAgICAgICAgICAgICAgICAgIC8vIFRoZSBgdGltZWAgdmFsdWUgc3BlY2lmaWVzIHRoZSB0aW1lIHdpdGhpbiB0aGUgZGF5IChzZWUgRVNcbiAgICAgICAgICAgICAgICAgIC8vIDUuMSBzZWN0aW9uIDE1LjkuMS4yKS4gVGhlIGZvcm11bGEgYChBICUgQiArIEIpICUgQmAgaXMgdXNlZFxuICAgICAgICAgICAgICAgICAgLy8gdG8gY29tcHV0ZSBgQSBtb2R1bG8gQmAsIGFzIHRoZSBgJWAgb3BlcmF0b3IgZG9lcyBub3RcbiAgICAgICAgICAgICAgICAgIC8vIGNvcnJlc3BvbmQgdG8gdGhlIGBtb2R1bG9gIG9wZXJhdGlvbiBmb3IgbmVnYXRpdmUgbnVtYmVycy5cbiAgICAgICAgICAgICAgICAgIHRpbWUgPSAodmFsdWUgJSA4NjRlNSArIDg2NGU1KSAlIDg2NGU1O1xuICAgICAgICAgICAgICAgICAgLy8gVGhlIGhvdXJzLCBtaW51dGVzLCBzZWNvbmRzLCBhbmQgbWlsbGlzZWNvbmRzIGFyZSBvYnRhaW5lZCBieVxuICAgICAgICAgICAgICAgICAgLy8gZGVjb21wb3NpbmcgdGhlIHRpbWUgd2l0aGluIHRoZSBkYXkuIFNlZSBzZWN0aW9uIDE1LjkuMS4xMC5cbiAgICAgICAgICAgICAgICAgIGhvdXJzID0gZmxvb3IodGltZSAvIDM2ZTUpICUgMjQ7XG4gICAgICAgICAgICAgICAgICBtaW51dGVzID0gZmxvb3IodGltZSAvIDZlNCkgJSA2MDtcbiAgICAgICAgICAgICAgICAgIHNlY29uZHMgPSBmbG9vcih0aW1lIC8gMWUzKSAlIDYwO1xuICAgICAgICAgICAgICAgICAgbWlsbGlzZWNvbmRzID0gdGltZSAlIDFlMztcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgeWVhciA9IHZhbHVlLmdldFVUQ0Z1bGxZZWFyKCk7XG4gICAgICAgICAgICAgICAgICBtb250aCA9IHZhbHVlLmdldFVUQ01vbnRoKCk7XG4gICAgICAgICAgICAgICAgICBkYXRlID0gdmFsdWUuZ2V0VVRDRGF0ZSgpO1xuICAgICAgICAgICAgICAgICAgaG91cnMgPSB2YWx1ZS5nZXRVVENIb3VycygpO1xuICAgICAgICAgICAgICAgICAgbWludXRlcyA9IHZhbHVlLmdldFVUQ01pbnV0ZXMoKTtcbiAgICAgICAgICAgICAgICAgIHNlY29uZHMgPSB2YWx1ZS5nZXRVVENTZWNvbmRzKCk7XG4gICAgICAgICAgICAgICAgICBtaWxsaXNlY29uZHMgPSB2YWx1ZS5nZXRVVENNaWxsaXNlY29uZHMoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gU2VyaWFsaXplIGV4dGVuZGVkIHllYXJzIGNvcnJlY3RseS5cbiAgICAgICAgICAgICAgICB2YWx1ZSA9ICh5ZWFyIDw9IDAgfHwgeWVhciA+PSAxZTQgPyAoeWVhciA8IDAgPyBcIi1cIiA6IFwiK1wiKSArIHRvUGFkZGVkU3RyaW5nKDYsIHllYXIgPCAwID8gLXllYXIgOiB5ZWFyKSA6IHRvUGFkZGVkU3RyaW5nKDQsIHllYXIpKSArXG4gICAgICAgICAgICAgICAgICBcIi1cIiArIHRvUGFkZGVkU3RyaW5nKDIsIG1vbnRoICsgMSkgKyBcIi1cIiArIHRvUGFkZGVkU3RyaW5nKDIsIGRhdGUpICtcbiAgICAgICAgICAgICAgICAgIC8vIE1vbnRocywgZGF0ZXMsIGhvdXJzLCBtaW51dGVzLCBhbmQgc2Vjb25kcyBzaG91bGQgaGF2ZSB0d29cbiAgICAgICAgICAgICAgICAgIC8vIGRpZ2l0czsgbWlsbGlzZWNvbmRzIHNob3VsZCBoYXZlIHRocmVlLlxuICAgICAgICAgICAgICAgICAgXCJUXCIgKyB0b1BhZGRlZFN0cmluZygyLCBob3VycykgKyBcIjpcIiArIHRvUGFkZGVkU3RyaW5nKDIsIG1pbnV0ZXMpICsgXCI6XCIgKyB0b1BhZGRlZFN0cmluZygyLCBzZWNvbmRzKSArXG4gICAgICAgICAgICAgICAgICAvLyBNaWxsaXNlY29uZHMgYXJlIG9wdGlvbmFsIGluIEVTIDUuMCwgYnV0IHJlcXVpcmVkIGluIDUuMS5cbiAgICAgICAgICAgICAgICAgIFwiLlwiICsgdG9QYWRkZWRTdHJpbmcoMywgbWlsbGlzZWNvbmRzKSArIFwiWlwiO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gbnVsbDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdmFsdWUudG9KU09OID09IFwiZnVuY3Rpb25cIiAmJiAoKGNsYXNzTmFtZSAhPSBudW1iZXJDbGFzcyAmJiBjbGFzc05hbWUgIT0gc3RyaW5nQ2xhc3MgJiYgY2xhc3NOYW1lICE9IGFycmF5Q2xhc3MpIHx8IGlzUHJvcGVydHkuY2FsbCh2YWx1ZSwgXCJ0b0pTT05cIikpKSB7XG4gICAgICAgICAgICAgIC8vIFByb3RvdHlwZSA8PSAxLjYuMSBhZGRzIG5vbi1zdGFuZGFyZCBgdG9KU09OYCBtZXRob2RzIHRvIHRoZVxuICAgICAgICAgICAgICAvLyBgTnVtYmVyYCwgYFN0cmluZ2AsIGBEYXRlYCwgYW5kIGBBcnJheWAgcHJvdG90eXBlcy4gSlNPTiAzXG4gICAgICAgICAgICAgIC8vIGlnbm9yZXMgYWxsIGB0b0pTT05gIG1ldGhvZHMgb24gdGhlc2Ugb2JqZWN0cyB1bmxlc3MgdGhleSBhcmVcbiAgICAgICAgICAgICAgLy8gZGVmaW5lZCBkaXJlY3RseSBvbiBhbiBpbnN0YW5jZS5cbiAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS50b0pTT04ocHJvcGVydHkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgIC8vIElmIGEgcmVwbGFjZW1lbnQgZnVuY3Rpb24gd2FzIHByb3ZpZGVkLCBjYWxsIGl0IHRvIG9idGFpbiB0aGUgdmFsdWVcbiAgICAgICAgICAgIC8vIGZvciBzZXJpYWxpemF0aW9uLlxuICAgICAgICAgICAgdmFsdWUgPSBjYWxsYmFjay5jYWxsKG9iamVjdCwgcHJvcGVydHksIHZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHZhbHVlID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJudWxsXCI7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNsYXNzTmFtZSA9IGdldENsYXNzLmNhbGwodmFsdWUpO1xuICAgICAgICAgIGlmIChjbGFzc05hbWUgPT0gYm9vbGVhbkNsYXNzKSB7XG4gICAgICAgICAgICAvLyBCb29sZWFucyBhcmUgcmVwcmVzZW50ZWQgbGl0ZXJhbGx5LlxuICAgICAgICAgICAgcmV0dXJuIFwiXCIgKyB2YWx1ZTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGNsYXNzTmFtZSA9PSBudW1iZXJDbGFzcykge1xuICAgICAgICAgICAgLy8gSlNPTiBudW1iZXJzIG11c3QgYmUgZmluaXRlLiBgSW5maW5pdHlgIGFuZCBgTmFOYCBhcmUgc2VyaWFsaXplZCBhc1xuICAgICAgICAgICAgLy8gYFwibnVsbFwiYC5cbiAgICAgICAgICAgIHJldHVybiB2YWx1ZSA+IC0xIC8gMCAmJiB2YWx1ZSA8IDEgLyAwID8gXCJcIiArIHZhbHVlIDogXCJudWxsXCI7XG4gICAgICAgICAgfSBlbHNlIGlmIChjbGFzc05hbWUgPT0gc3RyaW5nQ2xhc3MpIHtcbiAgICAgICAgICAgIC8vIFN0cmluZ3MgYXJlIGRvdWJsZS1xdW90ZWQgYW5kIGVzY2FwZWQuXG4gICAgICAgICAgICByZXR1cm4gcXVvdGUoXCJcIiArIHZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gUmVjdXJzaXZlbHkgc2VyaWFsaXplIG9iamVjdHMgYW5kIGFycmF5cy5cbiAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgIC8vIENoZWNrIGZvciBjeWNsaWMgc3RydWN0dXJlcy4gVGhpcyBpcyBhIGxpbmVhciBzZWFyY2g7IHBlcmZvcm1hbmNlXG4gICAgICAgICAgICAvLyBpcyBpbnZlcnNlbHkgcHJvcG9ydGlvbmFsIHRvIHRoZSBudW1iZXIgb2YgdW5pcXVlIG5lc3RlZCBvYmplY3RzLlxuICAgICAgICAgICAgZm9yIChsZW5ndGggPSBzdGFjay5sZW5ndGg7IGxlbmd0aC0tOykge1xuICAgICAgICAgICAgICBpZiAoc3RhY2tbbGVuZ3RoXSA9PT0gdmFsdWUpIHtcbiAgICAgICAgICAgICAgICAvLyBDeWNsaWMgc3RydWN0dXJlcyBjYW5ub3QgYmUgc2VyaWFsaXplZCBieSBgSlNPTi5zdHJpbmdpZnlgLlxuICAgICAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcigpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBBZGQgdGhlIG9iamVjdCB0byB0aGUgc3RhY2sgb2YgdHJhdmVyc2VkIG9iamVjdHMuXG4gICAgICAgICAgICBzdGFjay5wdXNoKHZhbHVlKTtcbiAgICAgICAgICAgIHJlc3VsdHMgPSBbXTtcbiAgICAgICAgICAgIC8vIFNhdmUgdGhlIGN1cnJlbnQgaW5kZW50YXRpb24gbGV2ZWwgYW5kIGluZGVudCBvbmUgYWRkaXRpb25hbCBsZXZlbC5cbiAgICAgICAgICAgIHByZWZpeCA9IGluZGVudGF0aW9uO1xuICAgICAgICAgICAgaW5kZW50YXRpb24gKz0gd2hpdGVzcGFjZTtcbiAgICAgICAgICAgIGlmIChjbGFzc05hbWUgPT0gYXJyYXlDbGFzcykge1xuICAgICAgICAgICAgICAvLyBSZWN1cnNpdmVseSBzZXJpYWxpemUgYXJyYXkgZWxlbWVudHMuXG4gICAgICAgICAgICAgIGZvciAoaW5kZXggPSAwLCBsZW5ndGggPSB2YWx1ZS5sZW5ndGg7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgICAgICAgICAgZWxlbWVudCA9IHNlcmlhbGl6ZShpbmRleCwgdmFsdWUsIGNhbGxiYWNrLCBwcm9wZXJ0aWVzLCB3aGl0ZXNwYWNlLCBpbmRlbnRhdGlvbiwgc3RhY2spO1xuICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChlbGVtZW50ID09PSB1bmRlZiA/IFwibnVsbFwiIDogZWxlbWVudCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0cy5sZW5ndGggPyAod2hpdGVzcGFjZSA/IFwiW1xcblwiICsgaW5kZW50YXRpb24gKyByZXN1bHRzLmpvaW4oXCIsXFxuXCIgKyBpbmRlbnRhdGlvbikgKyBcIlxcblwiICsgcHJlZml4ICsgXCJdXCIgOiAoXCJbXCIgKyByZXN1bHRzLmpvaW4oXCIsXCIpICsgXCJdXCIpKSA6IFwiW11cIjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIC8vIFJlY3Vyc2l2ZWx5IHNlcmlhbGl6ZSBvYmplY3QgbWVtYmVycy4gTWVtYmVycyBhcmUgc2VsZWN0ZWQgZnJvbVxuICAgICAgICAgICAgICAvLyBlaXRoZXIgYSB1c2VyLXNwZWNpZmllZCBsaXN0IG9mIHByb3BlcnR5IG5hbWVzLCBvciB0aGUgb2JqZWN0XG4gICAgICAgICAgICAgIC8vIGl0c2VsZi5cbiAgICAgICAgICAgICAgZm9yRWFjaChwcm9wZXJ0aWVzIHx8IHZhbHVlLCBmdW5jdGlvbiAocHJvcGVydHkpIHtcbiAgICAgICAgICAgICAgICB2YXIgZWxlbWVudCA9IHNlcmlhbGl6ZShwcm9wZXJ0eSwgdmFsdWUsIGNhbGxiYWNrLCBwcm9wZXJ0aWVzLCB3aGl0ZXNwYWNlLCBpbmRlbnRhdGlvbiwgc3RhY2spO1xuICAgICAgICAgICAgICAgIGlmIChlbGVtZW50ICE9PSB1bmRlZikge1xuICAgICAgICAgICAgICAgICAgLy8gQWNjb3JkaW5nIHRvIEVTIDUuMSBzZWN0aW9uIDE1LjEyLjM6IFwiSWYgYGdhcGAge3doaXRlc3BhY2V9XG4gICAgICAgICAgICAgICAgICAvLyBpcyBub3QgdGhlIGVtcHR5IHN0cmluZywgbGV0IGBtZW1iZXJgIHtxdW90ZShwcm9wZXJ0eSkgKyBcIjpcIn1cbiAgICAgICAgICAgICAgICAgIC8vIGJlIHRoZSBjb25jYXRlbmF0aW9uIG9mIGBtZW1iZXJgIGFuZCB0aGUgYHNwYWNlYCBjaGFyYWN0ZXIuXCJcbiAgICAgICAgICAgICAgICAgIC8vIFRoZSBcImBzcGFjZWAgY2hhcmFjdGVyXCIgcmVmZXJzIHRvIHRoZSBsaXRlcmFsIHNwYWNlXG4gICAgICAgICAgICAgICAgICAvLyBjaGFyYWN0ZXIsIG5vdCB0aGUgYHNwYWNlYCB7d2lkdGh9IGFyZ3VtZW50IHByb3ZpZGVkIHRvXG4gICAgICAgICAgICAgICAgICAvLyBgSlNPTi5zdHJpbmdpZnlgLlxuICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHF1b3RlKHByb3BlcnR5KSArIFwiOlwiICsgKHdoaXRlc3BhY2UgPyBcIiBcIiA6IFwiXCIpICsgZWxlbWVudCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0cy5sZW5ndGggPyAod2hpdGVzcGFjZSA/IFwie1xcblwiICsgaW5kZW50YXRpb24gKyByZXN1bHRzLmpvaW4oXCIsXFxuXCIgKyBpbmRlbnRhdGlvbikgKyBcIlxcblwiICsgcHJlZml4ICsgXCJ9XCIgOiAoXCJ7XCIgKyByZXN1bHRzLmpvaW4oXCIsXCIpICsgXCJ9XCIpKSA6IFwie31cIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIFJlbW92ZSB0aGUgb2JqZWN0IGZyb20gdGhlIHRyYXZlcnNlZCBvYmplY3Qgc3RhY2suXG4gICAgICAgICAgICBzdGFjay5wb3AoKTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIFB1YmxpYzogYEpTT04uc3RyaW5naWZ5YC4gU2VlIEVTIDUuMSBzZWN0aW9uIDE1LjEyLjMuXG4gICAgICAgIGV4cG9ydHMuc3RyaW5naWZ5ID0gZnVuY3Rpb24gKHNvdXJjZSwgZmlsdGVyLCB3aWR0aCkge1xuICAgICAgICAgIHZhciB3aGl0ZXNwYWNlLCBjYWxsYmFjaywgcHJvcGVydGllcywgY2xhc3NOYW1lO1xuICAgICAgICAgIGlmICh0eXBlb2YgZmlsdGVyID09IFwiZnVuY3Rpb25cIiB8fCB0eXBlb2YgZmlsdGVyID09IFwib2JqZWN0XCIgJiYgZmlsdGVyKSB7XG4gICAgICAgICAgICBpZiAoKGNsYXNzTmFtZSA9IGdldENsYXNzLmNhbGwoZmlsdGVyKSkgPT0gZnVuY3Rpb25DbGFzcykge1xuICAgICAgICAgICAgICBjYWxsYmFjayA9IGZpbHRlcjtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY2xhc3NOYW1lID09IGFycmF5Q2xhc3MpIHtcbiAgICAgICAgICAgICAgLy8gQ29udmVydCB0aGUgcHJvcGVydHkgbmFtZXMgYXJyYXkgaW50byBhIG1ha2VzaGlmdCBzZXQuXG4gICAgICAgICAgICAgIHByb3BlcnRpZXMgPSB7fTtcbiAgICAgICAgICAgICAgZm9yICh2YXIgaW5kZXggPSAwLCBsZW5ndGggPSBmaWx0ZXIubGVuZ3RoLCB2YWx1ZTsgaW5kZXggPCBsZW5ndGg7IHZhbHVlID0gZmlsdGVyW2luZGV4KytdLCAoKGNsYXNzTmFtZSA9IGdldENsYXNzLmNhbGwodmFsdWUpKSwgY2xhc3NOYW1lID09IHN0cmluZ0NsYXNzIHx8IGNsYXNzTmFtZSA9PSBudW1iZXJDbGFzcykgJiYgKHByb3BlcnRpZXNbdmFsdWVdID0gMSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAod2lkdGgpIHtcbiAgICAgICAgICAgIGlmICgoY2xhc3NOYW1lID0gZ2V0Q2xhc3MuY2FsbCh3aWR0aCkpID09IG51bWJlckNsYXNzKSB7XG4gICAgICAgICAgICAgIC8vIENvbnZlcnQgdGhlIGB3aWR0aGAgdG8gYW4gaW50ZWdlciBhbmQgY3JlYXRlIGEgc3RyaW5nIGNvbnRhaW5pbmdcbiAgICAgICAgICAgICAgLy8gYHdpZHRoYCBudW1iZXIgb2Ygc3BhY2UgY2hhcmFjdGVycy5cbiAgICAgICAgICAgICAgaWYgKCh3aWR0aCAtPSB3aWR0aCAlIDEpID4gMCkge1xuICAgICAgICAgICAgICAgIGZvciAod2hpdGVzcGFjZSA9IFwiXCIsIHdpZHRoID4gMTAgJiYgKHdpZHRoID0gMTApOyB3aGl0ZXNwYWNlLmxlbmd0aCA8IHdpZHRoOyB3aGl0ZXNwYWNlICs9IFwiIFwiKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChjbGFzc05hbWUgPT0gc3RyaW5nQ2xhc3MpIHtcbiAgICAgICAgICAgICAgd2hpdGVzcGFjZSA9IHdpZHRoLmxlbmd0aCA8PSAxMCA/IHdpZHRoIDogd2lkdGguc2xpY2UoMCwgMTApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBPcGVyYSA8PSA3LjU0dTIgZGlzY2FyZHMgdGhlIHZhbHVlcyBhc3NvY2lhdGVkIHdpdGggZW1wdHkgc3RyaW5nIGtleXNcbiAgICAgICAgICAvLyAoYFwiXCJgKSBvbmx5IGlmIHRoZXkgYXJlIHVzZWQgZGlyZWN0bHkgd2l0aGluIGFuIG9iamVjdCBtZW1iZXIgbGlzdFxuICAgICAgICAgIC8vIChlLmcuLCBgIShcIlwiIGluIHsgXCJcIjogMX0pYCkuXG4gICAgICAgICAgcmV0dXJuIHNlcmlhbGl6ZShcIlwiLCAodmFsdWUgPSB7fSwgdmFsdWVbXCJcIl0gPSBzb3VyY2UsIHZhbHVlKSwgY2FsbGJhY2ssIHByb3BlcnRpZXMsIHdoaXRlc3BhY2UsIFwiXCIsIFtdKTtcbiAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgLy8gUHVibGljOiBQYXJzZXMgYSBKU09OIHNvdXJjZSBzdHJpbmcuXG4gICAgICBpZiAoIWhhcyhcImpzb24tcGFyc2VcIikpIHtcbiAgICAgICAgdmFyIGZyb21DaGFyQ29kZSA9IFN0cmluZy5mcm9tQ2hhckNvZGU7XG5cbiAgICAgICAgLy8gSW50ZXJuYWw6IEEgbWFwIG9mIGVzY2FwZWQgY29udHJvbCBjaGFyYWN0ZXJzIGFuZCB0aGVpciB1bmVzY2FwZWRcbiAgICAgICAgLy8gZXF1aXZhbGVudHMuXG4gICAgICAgIHZhciBVbmVzY2FwZXMgPSB7XG4gICAgICAgICAgOTI6IFwiXFxcXFwiLFxuICAgICAgICAgIDM0OiAnXCInLFxuICAgICAgICAgIDQ3OiBcIi9cIixcbiAgICAgICAgICA5ODogXCJcXGJcIixcbiAgICAgICAgICAxMTY6IFwiXFx0XCIsXG4gICAgICAgICAgMTEwOiBcIlxcblwiLFxuICAgICAgICAgIDEwMjogXCJcXGZcIixcbiAgICAgICAgICAxMTQ6IFwiXFxyXCJcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBJbnRlcm5hbDogU3RvcmVzIHRoZSBwYXJzZXIgc3RhdGUuXG4gICAgICAgIHZhciBJbmRleCwgU291cmNlO1xuXG4gICAgICAgIC8vIEludGVybmFsOiBSZXNldHMgdGhlIHBhcnNlciBzdGF0ZSBhbmQgdGhyb3dzIGEgYFN5bnRheEVycm9yYC5cbiAgICAgICAgdmFyIGFib3J0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgIEluZGV4ID0gU291cmNlID0gbnVsbDtcbiAgICAgICAgICB0aHJvdyBTeW50YXhFcnJvcigpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIEludGVybmFsOiBSZXR1cm5zIHRoZSBuZXh0IHRva2VuLCBvciBgXCIkXCJgIGlmIHRoZSBwYXJzZXIgaGFzIHJlYWNoZWRcbiAgICAgICAgLy8gdGhlIGVuZCBvZiB0aGUgc291cmNlIHN0cmluZy4gQSB0b2tlbiBtYXkgYmUgYSBzdHJpbmcsIG51bWJlciwgYG51bGxgXG4gICAgICAgIC8vIGxpdGVyYWwsIG9yIEJvb2xlYW4gbGl0ZXJhbC5cbiAgICAgICAgdmFyIGxleCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICB2YXIgc291cmNlID0gU291cmNlLCBsZW5ndGggPSBzb3VyY2UubGVuZ3RoLCB2YWx1ZSwgYmVnaW4sIHBvc2l0aW9uLCBpc1NpZ25lZCwgY2hhckNvZGU7XG4gICAgICAgICAgd2hpbGUgKEluZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgICAgICBjaGFyQ29kZSA9IHNvdXJjZS5jaGFyQ29kZUF0KEluZGV4KTtcbiAgICAgICAgICAgIHN3aXRjaCAoY2hhckNvZGUpIHtcbiAgICAgICAgICAgICAgY2FzZSA5OiBjYXNlIDEwOiBjYXNlIDEzOiBjYXNlIDMyOlxuICAgICAgICAgICAgICAgIC8vIFNraXAgd2hpdGVzcGFjZSB0b2tlbnMsIGluY2x1ZGluZyB0YWJzLCBjYXJyaWFnZSByZXR1cm5zLCBsaW5lXG4gICAgICAgICAgICAgICAgLy8gZmVlZHMsIGFuZCBzcGFjZSBjaGFyYWN0ZXJzLlxuICAgICAgICAgICAgICAgIEluZGV4Kys7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgMTIzOiBjYXNlIDEyNTogY2FzZSA5MTogY2FzZSA5MzogY2FzZSA1ODogY2FzZSA0NDpcbiAgICAgICAgICAgICAgICAvLyBQYXJzZSBhIHB1bmN0dWF0b3IgdG9rZW4gKGB7YCwgYH1gLCBgW2AsIGBdYCwgYDpgLCBvciBgLGApIGF0XG4gICAgICAgICAgICAgICAgLy8gdGhlIGN1cnJlbnQgcG9zaXRpb24uXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBjaGFySW5kZXhCdWdneSA/IHNvdXJjZS5jaGFyQXQoSW5kZXgpIDogc291cmNlW0luZGV4XTtcbiAgICAgICAgICAgICAgICBJbmRleCsrO1xuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgICAgICAgY2FzZSAzNDpcbiAgICAgICAgICAgICAgICAvLyBgXCJgIGRlbGltaXRzIGEgSlNPTiBzdHJpbmc7IGFkdmFuY2UgdG8gdGhlIG5leHQgY2hhcmFjdGVyIGFuZFxuICAgICAgICAgICAgICAgIC8vIGJlZ2luIHBhcnNpbmcgdGhlIHN0cmluZy4gU3RyaW5nIHRva2VucyBhcmUgcHJlZml4ZWQgd2l0aCB0aGVcbiAgICAgICAgICAgICAgICAvLyBzZW50aW5lbCBgQGAgY2hhcmFjdGVyIHRvIGRpc3Rpbmd1aXNoIHRoZW0gZnJvbSBwdW5jdHVhdG9ycyBhbmRcbiAgICAgICAgICAgICAgICAvLyBlbmQtb2Ytc3RyaW5nIHRva2Vucy5cbiAgICAgICAgICAgICAgICBmb3IgKHZhbHVlID0gXCJAXCIsIEluZGV4Kys7IEluZGV4IDwgbGVuZ3RoOykge1xuICAgICAgICAgICAgICAgICAgY2hhckNvZGUgPSBzb3VyY2UuY2hhckNvZGVBdChJbmRleCk7XG4gICAgICAgICAgICAgICAgICBpZiAoY2hhckNvZGUgPCAzMikge1xuICAgICAgICAgICAgICAgICAgICAvLyBVbmVzY2FwZWQgQVNDSUkgY29udHJvbCBjaGFyYWN0ZXJzICh0aG9zZSB3aXRoIGEgY29kZSB1bml0XG4gICAgICAgICAgICAgICAgICAgIC8vIGxlc3MgdGhhbiB0aGUgc3BhY2UgY2hhcmFjdGVyKSBhcmUgbm90IHBlcm1pdHRlZC5cbiAgICAgICAgICAgICAgICAgICAgYWJvcnQoKTtcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY2hhckNvZGUgPT0gOTIpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQSByZXZlcnNlIHNvbGlkdXMgKGBcXGApIG1hcmtzIHRoZSBiZWdpbm5pbmcgb2YgYW4gZXNjYXBlZFxuICAgICAgICAgICAgICAgICAgICAvLyBjb250cm9sIGNoYXJhY3RlciAoaW5jbHVkaW5nIGBcImAsIGBcXGAsIGFuZCBgL2ApIG9yIFVuaWNvZGVcbiAgICAgICAgICAgICAgICAgICAgLy8gZXNjYXBlIHNlcXVlbmNlLlxuICAgICAgICAgICAgICAgICAgICBjaGFyQ29kZSA9IHNvdXJjZS5jaGFyQ29kZUF0KCsrSW5kZXgpO1xuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKGNoYXJDb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgY2FzZSA5MjogY2FzZSAzNDogY2FzZSA0NzogY2FzZSA5ODogY2FzZSAxMTY6IGNhc2UgMTEwOiBjYXNlIDEwMjogY2FzZSAxMTQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBSZXZpdmUgZXNjYXBlZCBjb250cm9sIGNoYXJhY3RlcnMuXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSArPSBVbmVzY2FwZXNbY2hhckNvZGVdO1xuICAgICAgICAgICAgICAgICAgICAgICAgSW5kZXgrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgIGNhc2UgMTE3OlxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gYFxcdWAgbWFya3MgdGhlIGJlZ2lubmluZyBvZiBhIFVuaWNvZGUgZXNjYXBlIHNlcXVlbmNlLlxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWR2YW5jZSB0byB0aGUgZmlyc3QgY2hhcmFjdGVyIGFuZCB2YWxpZGF0ZSB0aGVcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGZvdXItZGlnaXQgY29kZSBwb2ludC5cbiAgICAgICAgICAgICAgICAgICAgICAgIGJlZ2luID0gKytJbmRleDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAocG9zaXRpb24gPSBJbmRleCArIDQ7IEluZGV4IDwgcG9zaXRpb247IEluZGV4KyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY2hhckNvZGUgPSBzb3VyY2UuY2hhckNvZGVBdChJbmRleCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEEgdmFsaWQgc2VxdWVuY2UgY29tcHJpc2VzIGZvdXIgaGV4ZGlnaXRzIChjYXNlLVxuICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpbnNlbnNpdGl2ZSkgdGhhdCBmb3JtIGEgc2luZ2xlIGhleGFkZWNpbWFsIHZhbHVlLlxuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIShjaGFyQ29kZSA+PSA0OCAmJiBjaGFyQ29kZSA8PSA1NyB8fCBjaGFyQ29kZSA+PSA5NyAmJiBjaGFyQ29kZSA8PSAxMDIgfHwgY2hhckNvZGUgPj0gNjUgJiYgY2hhckNvZGUgPD0gNzApKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSW52YWxpZCBVbmljb2RlIGVzY2FwZSBzZXF1ZW5jZS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhYm9ydCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBSZXZpdmUgdGhlIGVzY2FwZWQgY2hhcmFjdGVyLlxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgKz0gZnJvbUNoYXJDb2RlKFwiMHhcIiArIHNvdXJjZS5zbGljZShiZWdpbiwgSW5kZXgpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBJbnZhbGlkIGVzY2FwZSBzZXF1ZW5jZS5cbiAgICAgICAgICAgICAgICAgICAgICAgIGFib3J0KCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjaGFyQ29kZSA9PSAzNCkge1xuICAgICAgICAgICAgICAgICAgICAgIC8vIEFuIHVuZXNjYXBlZCBkb3VibGUtcXVvdGUgY2hhcmFjdGVyIG1hcmtzIHRoZSBlbmQgb2YgdGhlXG4gICAgICAgICAgICAgICAgICAgICAgLy8gc3RyaW5nLlxuICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNoYXJDb2RlID0gc291cmNlLmNoYXJDb2RlQXQoSW5kZXgpO1xuICAgICAgICAgICAgICAgICAgICBiZWdpbiA9IEluZGV4O1xuICAgICAgICAgICAgICAgICAgICAvLyBPcHRpbWl6ZSBmb3IgdGhlIGNvbW1vbiBjYXNlIHdoZXJlIGEgc3RyaW5nIGlzIHZhbGlkLlxuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoY2hhckNvZGUgPj0gMzIgJiYgY2hhckNvZGUgIT0gOTIgJiYgY2hhckNvZGUgIT0gMzQpIHtcbiAgICAgICAgICAgICAgICAgICAgICBjaGFyQ29kZSA9IHNvdXJjZS5jaGFyQ29kZUF0KCsrSW5kZXgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vIEFwcGVuZCB0aGUgc3RyaW5nIGFzLWlzLlxuICAgICAgICAgICAgICAgICAgICB2YWx1ZSArPSBzb3VyY2Uuc2xpY2UoYmVnaW4sIEluZGV4KTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHNvdXJjZS5jaGFyQ29kZUF0KEluZGV4KSA9PSAzNCkge1xuICAgICAgICAgICAgICAgICAgLy8gQWR2YW5jZSB0byB0aGUgbmV4dCBjaGFyYWN0ZXIgYW5kIHJldHVybiB0aGUgcmV2aXZlZCBzdHJpbmcuXG4gICAgICAgICAgICAgICAgICBJbmRleCsrO1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBVbnRlcm1pbmF0ZWQgc3RyaW5nLlxuICAgICAgICAgICAgICAgIGFib3J0KCk7XG4gICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgLy8gUGFyc2UgbnVtYmVycyBhbmQgbGl0ZXJhbHMuXG4gICAgICAgICAgICAgICAgYmVnaW4gPSBJbmRleDtcbiAgICAgICAgICAgICAgICAvLyBBZHZhbmNlIHBhc3QgdGhlIG5lZ2F0aXZlIHNpZ24sIGlmIG9uZSBpcyBzcGVjaWZpZWQuXG4gICAgICAgICAgICAgICAgaWYgKGNoYXJDb2RlID09IDQ1KSB7XG4gICAgICAgICAgICAgICAgICBpc1NpZ25lZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICBjaGFyQ29kZSA9IHNvdXJjZS5jaGFyQ29kZUF0KCsrSW5kZXgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBQYXJzZSBhbiBpbnRlZ2VyIG9yIGZsb2F0aW5nLXBvaW50IHZhbHVlLlxuICAgICAgICAgICAgICAgIGlmIChjaGFyQ29kZSA+PSA0OCAmJiBjaGFyQ29kZSA8PSA1Nykge1xuICAgICAgICAgICAgICAgICAgLy8gTGVhZGluZyB6ZXJvZXMgYXJlIGludGVycHJldGVkIGFzIG9jdGFsIGxpdGVyYWxzLlxuICAgICAgICAgICAgICAgICAgaWYgKGNoYXJDb2RlID09IDQ4ICYmICgoY2hhckNvZGUgPSBzb3VyY2UuY2hhckNvZGVBdChJbmRleCArIDEpKSwgY2hhckNvZGUgPj0gNDggJiYgY2hhckNvZGUgPD0gNTcpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIElsbGVnYWwgb2N0YWwgbGl0ZXJhbC5cbiAgICAgICAgICAgICAgICAgICAgYWJvcnQoKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIGlzU2lnbmVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAvLyBQYXJzZSB0aGUgaW50ZWdlciBjb21wb25lbnQuXG4gICAgICAgICAgICAgICAgICBmb3IgKDsgSW5kZXggPCBsZW5ndGggJiYgKChjaGFyQ29kZSA9IHNvdXJjZS5jaGFyQ29kZUF0KEluZGV4KSksIGNoYXJDb2RlID49IDQ4ICYmIGNoYXJDb2RlIDw9IDU3KTsgSW5kZXgrKyk7XG4gICAgICAgICAgICAgICAgICAvLyBGbG9hdHMgY2Fubm90IGNvbnRhaW4gYSBsZWFkaW5nIGRlY2ltYWwgcG9pbnQ7IGhvd2V2ZXIsIHRoaXNcbiAgICAgICAgICAgICAgICAgIC8vIGNhc2UgaXMgYWxyZWFkeSBhY2NvdW50ZWQgZm9yIGJ5IHRoZSBwYXJzZXIuXG4gICAgICAgICAgICAgICAgICBpZiAoc291cmNlLmNoYXJDb2RlQXQoSW5kZXgpID09IDQ2KSB7XG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uID0gKytJbmRleDtcbiAgICAgICAgICAgICAgICAgICAgLy8gUGFyc2UgdGhlIGRlY2ltYWwgY29tcG9uZW50LlxuICAgICAgICAgICAgICAgICAgICBmb3IgKDsgcG9zaXRpb24gPCBsZW5ndGggJiYgKChjaGFyQ29kZSA9IHNvdXJjZS5jaGFyQ29kZUF0KHBvc2l0aW9uKSksIGNoYXJDb2RlID49IDQ4ICYmIGNoYXJDb2RlIDw9IDU3KTsgcG9zaXRpb24rKyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwb3NpdGlvbiA9PSBJbmRleCkge1xuICAgICAgICAgICAgICAgICAgICAgIC8vIElsbGVnYWwgdHJhaWxpbmcgZGVjaW1hbC5cbiAgICAgICAgICAgICAgICAgICAgICBhYm9ydCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIEluZGV4ID0gcG9zaXRpb247XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAvLyBQYXJzZSBleHBvbmVudHMuIFRoZSBgZWAgZGVub3RpbmcgdGhlIGV4cG9uZW50IGlzXG4gICAgICAgICAgICAgICAgICAvLyBjYXNlLWluc2Vuc2l0aXZlLlxuICAgICAgICAgICAgICAgICAgY2hhckNvZGUgPSBzb3VyY2UuY2hhckNvZGVBdChJbmRleCk7XG4gICAgICAgICAgICAgICAgICBpZiAoY2hhckNvZGUgPT0gMTAxIHx8IGNoYXJDb2RlID09IDY5KSB7XG4gICAgICAgICAgICAgICAgICAgIGNoYXJDb2RlID0gc291cmNlLmNoYXJDb2RlQXQoKytJbmRleCk7XG4gICAgICAgICAgICAgICAgICAgIC8vIFNraXAgcGFzdCB0aGUgc2lnbiBmb2xsb3dpbmcgdGhlIGV4cG9uZW50LCBpZiBvbmUgaXNcbiAgICAgICAgICAgICAgICAgICAgLy8gc3BlY2lmaWVkLlxuICAgICAgICAgICAgICAgICAgICBpZiAoY2hhckNvZGUgPT0gNDMgfHwgY2hhckNvZGUgPT0gNDUpIHtcbiAgICAgICAgICAgICAgICAgICAgICBJbmRleCsrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vIFBhcnNlIHRoZSBleHBvbmVudGlhbCBjb21wb25lbnQuXG4gICAgICAgICAgICAgICAgICAgIGZvciAocG9zaXRpb24gPSBJbmRleDsgcG9zaXRpb24gPCBsZW5ndGggJiYgKChjaGFyQ29kZSA9IHNvdXJjZS5jaGFyQ29kZUF0KHBvc2l0aW9uKSksIGNoYXJDb2RlID49IDQ4ICYmIGNoYXJDb2RlIDw9IDU3KTsgcG9zaXRpb24rKyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwb3NpdGlvbiA9PSBJbmRleCkge1xuICAgICAgICAgICAgICAgICAgICAgIC8vIElsbGVnYWwgZW1wdHkgZXhwb25lbnQuXG4gICAgICAgICAgICAgICAgICAgICAgYWJvcnQoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBJbmRleCA9IHBvc2l0aW9uO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgLy8gQ29lcmNlIHRoZSBwYXJzZWQgdmFsdWUgdG8gYSBKYXZhU2NyaXB0IG51bWJlci5cbiAgICAgICAgICAgICAgICAgIHJldHVybiArc291cmNlLnNsaWNlKGJlZ2luLCBJbmRleCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIEEgbmVnYXRpdmUgc2lnbiBtYXkgb25seSBwcmVjZWRlIG51bWJlcnMuXG4gICAgICAgICAgICAgICAgaWYgKGlzU2lnbmVkKSB7XG4gICAgICAgICAgICAgICAgICBhYm9ydCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBgdHJ1ZWAsIGBmYWxzZWAsIGFuZCBgbnVsbGAgbGl0ZXJhbHMuXG4gICAgICAgICAgICAgICAgaWYgKHNvdXJjZS5zbGljZShJbmRleCwgSW5kZXggKyA0KSA9PSBcInRydWVcIikge1xuICAgICAgICAgICAgICAgICAgSW5kZXggKz0gNDtcbiAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc291cmNlLnNsaWNlKEluZGV4LCBJbmRleCArIDUpID09IFwiZmFsc2VcIikge1xuICAgICAgICAgICAgICAgICAgSW5kZXggKz0gNTtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHNvdXJjZS5zbGljZShJbmRleCwgSW5kZXggKyA0KSA9PSBcIm51bGxcIikge1xuICAgICAgICAgICAgICAgICAgSW5kZXggKz0gNDtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBVbnJlY29nbml6ZWQgdG9rZW4uXG4gICAgICAgICAgICAgICAgYWJvcnQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gUmV0dXJuIHRoZSBzZW50aW5lbCBgJGAgY2hhcmFjdGVyIGlmIHRoZSBwYXJzZXIgaGFzIHJlYWNoZWQgdGhlIGVuZFxuICAgICAgICAgIC8vIG9mIHRoZSBzb3VyY2Ugc3RyaW5nLlxuICAgICAgICAgIHJldHVybiBcIiRcIjtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBJbnRlcm5hbDogUGFyc2VzIGEgSlNPTiBgdmFsdWVgIHRva2VuLlxuICAgICAgICB2YXIgZ2V0ID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgdmFyIHJlc3VsdHMsIGhhc01lbWJlcnM7XG4gICAgICAgICAgaWYgKHZhbHVlID09IFwiJFwiKSB7XG4gICAgICAgICAgICAvLyBVbmV4cGVjdGVkIGVuZCBvZiBpbnB1dC5cbiAgICAgICAgICAgIGFib3J0KCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgaWYgKChjaGFySW5kZXhCdWdneSA/IHZhbHVlLmNoYXJBdCgwKSA6IHZhbHVlWzBdKSA9PSBcIkBcIikge1xuICAgICAgICAgICAgICAvLyBSZW1vdmUgdGhlIHNlbnRpbmVsIGBAYCBjaGFyYWN0ZXIuXG4gICAgICAgICAgICAgIHJldHVybiB2YWx1ZS5zbGljZSgxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIFBhcnNlIG9iamVjdCBhbmQgYXJyYXkgbGl0ZXJhbHMuXG4gICAgICAgICAgICBpZiAodmFsdWUgPT0gXCJbXCIpIHtcbiAgICAgICAgICAgICAgLy8gUGFyc2VzIGEgSlNPTiBhcnJheSwgcmV0dXJuaW5nIGEgbmV3IEphdmFTY3JpcHQgYXJyYXkuXG4gICAgICAgICAgICAgIHJlc3VsdHMgPSBbXTtcbiAgICAgICAgICAgICAgZm9yICg7OyBoYXNNZW1iZXJzIHx8IChoYXNNZW1iZXJzID0gdHJ1ZSkpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IGxleCgpO1xuICAgICAgICAgICAgICAgIC8vIEEgY2xvc2luZyBzcXVhcmUgYnJhY2tldCBtYXJrcyB0aGUgZW5kIG9mIHRoZSBhcnJheSBsaXRlcmFsLlxuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcIl1cIikge1xuICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIElmIHRoZSBhcnJheSBsaXRlcmFsIGNvbnRhaW5zIGVsZW1lbnRzLCB0aGUgY3VycmVudCB0b2tlblxuICAgICAgICAgICAgICAgIC8vIHNob3VsZCBiZSBhIGNvbW1hIHNlcGFyYXRpbmcgdGhlIHByZXZpb3VzIGVsZW1lbnQgZnJvbSB0aGVcbiAgICAgICAgICAgICAgICAvLyBuZXh0LlxuICAgICAgICAgICAgICAgIGlmIChoYXNNZW1iZXJzKSB7XG4gICAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT0gXCIsXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBsZXgoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlID09IFwiXVwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgLy8gVW5leHBlY3RlZCB0cmFpbGluZyBgLGAgaW4gYXJyYXkgbGl0ZXJhbC5cbiAgICAgICAgICAgICAgICAgICAgICBhYm9ydCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBBIGAsYCBtdXN0IHNlcGFyYXRlIGVhY2ggYXJyYXkgZWxlbWVudC5cbiAgICAgICAgICAgICAgICAgICAgYWJvcnQoKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gRWxpc2lvbnMgYW5kIGxlYWRpbmcgY29tbWFzIGFyZSBub3QgcGVybWl0dGVkLlxuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcIixcIikge1xuICAgICAgICAgICAgICAgICAgYWJvcnQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKGdldCh2YWx1ZSkpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybiByZXN1bHRzO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh2YWx1ZSA9PSBcIntcIikge1xuICAgICAgICAgICAgICAvLyBQYXJzZXMgYSBKU09OIG9iamVjdCwgcmV0dXJuaW5nIGEgbmV3IEphdmFTY3JpcHQgb2JqZWN0LlxuICAgICAgICAgICAgICByZXN1bHRzID0ge307XG4gICAgICAgICAgICAgIGZvciAoOzsgaGFzTWVtYmVycyB8fCAoaGFzTWVtYmVycyA9IHRydWUpKSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSBsZXgoKTtcbiAgICAgICAgICAgICAgICAvLyBBIGNsb3NpbmcgY3VybHkgYnJhY2UgbWFya3MgdGhlIGVuZCBvZiB0aGUgb2JqZWN0IGxpdGVyYWwuXG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlID09IFwifVwiKSB7XG4gICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gSWYgdGhlIG9iamVjdCBsaXRlcmFsIGNvbnRhaW5zIG1lbWJlcnMsIHRoZSBjdXJyZW50IHRva2VuXG4gICAgICAgICAgICAgICAgLy8gc2hvdWxkIGJlIGEgY29tbWEgc2VwYXJhdG9yLlxuICAgICAgICAgICAgICAgIGlmIChoYXNNZW1iZXJzKSB7XG4gICAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT0gXCIsXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBsZXgoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlID09IFwifVwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgLy8gVW5leHBlY3RlZCB0cmFpbGluZyBgLGAgaW4gb2JqZWN0IGxpdGVyYWwuXG4gICAgICAgICAgICAgICAgICAgICAgYWJvcnQoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQSBgLGAgbXVzdCBzZXBhcmF0ZSBlYWNoIG9iamVjdCBtZW1iZXIuXG4gICAgICAgICAgICAgICAgICAgIGFib3J0KCk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIExlYWRpbmcgY29tbWFzIGFyZSBub3QgcGVybWl0dGVkLCBvYmplY3QgcHJvcGVydHkgbmFtZXMgbXVzdCBiZVxuICAgICAgICAgICAgICAgIC8vIGRvdWJsZS1xdW90ZWQgc3RyaW5ncywgYW5kIGEgYDpgIG11c3Qgc2VwYXJhdGUgZWFjaCBwcm9wZXJ0eVxuICAgICAgICAgICAgICAgIC8vIG5hbWUgYW5kIHZhbHVlLlxuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcIixcIiB8fCB0eXBlb2YgdmFsdWUgIT0gXCJzdHJpbmdcIiB8fCAoY2hhckluZGV4QnVnZ3kgPyB2YWx1ZS5jaGFyQXQoMCkgOiB2YWx1ZVswXSkgIT0gXCJAXCIgfHwgbGV4KCkgIT0gXCI6XCIpIHtcbiAgICAgICAgICAgICAgICAgIGFib3J0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlc3VsdHNbdmFsdWUuc2xpY2UoMSldID0gZ2V0KGxleCgpKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0cztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIFVuZXhwZWN0ZWQgdG9rZW4gZW5jb3VudGVyZWQuXG4gICAgICAgICAgICBhYm9ydCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gSW50ZXJuYWw6IFVwZGF0ZXMgYSB0cmF2ZXJzZWQgb2JqZWN0IG1lbWJlci5cbiAgICAgICAgdmFyIHVwZGF0ZSA9IGZ1bmN0aW9uIChzb3VyY2UsIHByb3BlcnR5LCBjYWxsYmFjaykge1xuICAgICAgICAgIHZhciBlbGVtZW50ID0gd2Fsayhzb3VyY2UsIHByb3BlcnR5LCBjYWxsYmFjayk7XG4gICAgICAgICAgaWYgKGVsZW1lbnQgPT09IHVuZGVmKSB7XG4gICAgICAgICAgICBkZWxldGUgc291cmNlW3Byb3BlcnR5XTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc291cmNlW3Byb3BlcnR5XSA9IGVsZW1lbnQ7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIEludGVybmFsOiBSZWN1cnNpdmVseSB0cmF2ZXJzZXMgYSBwYXJzZWQgSlNPTiBvYmplY3QsIGludm9raW5nIHRoZVxuICAgICAgICAvLyBgY2FsbGJhY2tgIGZ1bmN0aW9uIGZvciBlYWNoIHZhbHVlLiBUaGlzIGlzIGFuIGltcGxlbWVudGF0aW9uIG9mIHRoZVxuICAgICAgICAvLyBgV2Fsayhob2xkZXIsIG5hbWUpYCBvcGVyYXRpb24gZGVmaW5lZCBpbiBFUyA1LjEgc2VjdGlvbiAxNS4xMi4yLlxuICAgICAgICB2YXIgd2FsayA9IGZ1bmN0aW9uIChzb3VyY2UsIHByb3BlcnR5LCBjYWxsYmFjaykge1xuICAgICAgICAgIHZhciB2YWx1ZSA9IHNvdXJjZVtwcm9wZXJ0eV0sIGxlbmd0aDtcbiAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09IFwib2JqZWN0XCIgJiYgdmFsdWUpIHtcbiAgICAgICAgICAgIC8vIGBmb3JFYWNoYCBjYW4ndCBiZSB1c2VkIHRvIHRyYXZlcnNlIGFuIGFycmF5IGluIE9wZXJhIDw9IDguNTRcbiAgICAgICAgICAgIC8vIGJlY2F1c2UgaXRzIGBPYmplY3QjaGFzT3duUHJvcGVydHlgIGltcGxlbWVudGF0aW9uIHJldHVybnMgYGZhbHNlYFxuICAgICAgICAgICAgLy8gZm9yIGFycmF5IGluZGljZXMgKGUuZy4sIGAhWzEsIDIsIDNdLmhhc093blByb3BlcnR5KFwiMFwiKWApLlxuICAgICAgICAgICAgaWYgKGdldENsYXNzLmNhbGwodmFsdWUpID09IGFycmF5Q2xhc3MpIHtcbiAgICAgICAgICAgICAgZm9yIChsZW5ndGggPSB2YWx1ZS5sZW5ndGg7IGxlbmd0aC0tOykge1xuICAgICAgICAgICAgICAgIHVwZGF0ZSh2YWx1ZSwgbGVuZ3RoLCBjYWxsYmFjayk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGZvckVhY2godmFsdWUsIGZ1bmN0aW9uIChwcm9wZXJ0eSkge1xuICAgICAgICAgICAgICAgIHVwZGF0ZSh2YWx1ZSwgcHJvcGVydHksIGNhbGxiYWNrKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBjYWxsYmFjay5jYWxsKHNvdXJjZSwgcHJvcGVydHksIHZhbHVlKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBQdWJsaWM6IGBKU09OLnBhcnNlYC4gU2VlIEVTIDUuMSBzZWN0aW9uIDE1LjEyLjIuXG4gICAgICAgIGV4cG9ydHMucGFyc2UgPSBmdW5jdGlvbiAoc291cmNlLCBjYWxsYmFjaykge1xuICAgICAgICAgIHZhciByZXN1bHQsIHZhbHVlO1xuICAgICAgICAgIEluZGV4ID0gMDtcbiAgICAgICAgICBTb3VyY2UgPSBcIlwiICsgc291cmNlO1xuICAgICAgICAgIHJlc3VsdCA9IGdldChsZXgoKSk7XG4gICAgICAgICAgLy8gSWYgYSBKU09OIHN0cmluZyBjb250YWlucyBtdWx0aXBsZSB0b2tlbnMsIGl0IGlzIGludmFsaWQuXG4gICAgICAgICAgaWYgKGxleCgpICE9IFwiJFwiKSB7XG4gICAgICAgICAgICBhYm9ydCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBSZXNldCB0aGUgcGFyc2VyIHN0YXRlLlxuICAgICAgICAgIEluZGV4ID0gU291cmNlID0gbnVsbDtcbiAgICAgICAgICByZXR1cm4gY2FsbGJhY2sgJiYgZ2V0Q2xhc3MuY2FsbChjYWxsYmFjaykgPT0gZnVuY3Rpb25DbGFzcyA/IHdhbGsoKHZhbHVlID0ge30sIHZhbHVlW1wiXCJdID0gcmVzdWx0LCB2YWx1ZSksIFwiXCIsIGNhbGxiYWNrKSA6IHJlc3VsdDtcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBleHBvcnRzW1wicnVuSW5Db250ZXh0XCJdID0gcnVuSW5Db250ZXh0O1xuICAgIHJldHVybiBleHBvcnRzO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBleHBvcnRzID09IFwib2JqZWN0XCIgJiYgZXhwb3J0cyAmJiAhZXhwb3J0cy5ub2RlVHlwZSAmJiAhaXNMb2FkZXIpIHtcbiAgICAvLyBFeHBvcnQgZm9yIENvbW1vbkpTIGVudmlyb25tZW50cy5cbiAgICBydW5JbkNvbnRleHQocm9vdCwgZXhwb3J0cyk7XG4gIH0gZWxzZSB7XG4gICAgLy8gRXhwb3J0IGZvciB3ZWIgYnJvd3NlcnMgYW5kIEphdmFTY3JpcHQgZW5naW5lcy5cbiAgICB2YXIgbmF0aXZlSlNPTiA9IHJvb3QuSlNPTjtcbiAgICB2YXIgSlNPTjMgPSBydW5JbkNvbnRleHQocm9vdCwgKHJvb3RbXCJKU09OM1wiXSA9IHtcbiAgICAgIC8vIFB1YmxpYzogUmVzdG9yZXMgdGhlIG9yaWdpbmFsIHZhbHVlIG9mIHRoZSBnbG9iYWwgYEpTT05gIG9iamVjdCBhbmRcbiAgICAgIC8vIHJldHVybnMgYSByZWZlcmVuY2UgdG8gdGhlIGBKU09OM2Agb2JqZWN0LlxuICAgICAgXCJub0NvbmZsaWN0XCI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcm9vdC5KU09OID0gbmF0aXZlSlNPTjtcbiAgICAgICAgcmV0dXJuIEpTT04zO1xuICAgICAgfVxuICAgIH0pKTtcblxuICAgIHJvb3QuSlNPTiA9IHtcbiAgICAgIFwicGFyc2VcIjogSlNPTjMucGFyc2UsXG4gICAgICBcInN0cmluZ2lmeVwiOiBKU09OMy5zdHJpbmdpZnlcbiAgICB9O1xuICB9XG5cbiAgLy8gRXhwb3J0IGZvciBhc3luY2hyb25vdXMgbW9kdWxlIGxvYWRlcnMuXG4gIGlmIChpc0xvYWRlcikge1xuICAgIGRlZmluZShmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gSlNPTjM7XG4gICAgfSk7XG4gIH1cbn0odGhpcykpO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xudmFyIHRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcblxudmFyIGlzRnVuY3Rpb24gPSBmdW5jdGlvbiAoZm4pIHtcblx0cmV0dXJuICh0eXBlb2YgZm4gPT09ICdmdW5jdGlvbicgJiYgIShmbiBpbnN0YW5jZW9mIFJlZ0V4cCkpIHx8IHRvU3RyaW5nLmNhbGwoZm4pID09PSAnW29iamVjdCBGdW5jdGlvbl0nO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBmb3JFYWNoKG9iaiwgZm4pIHtcblx0aWYgKCFpc0Z1bmN0aW9uKGZuKSkge1xuXHRcdHRocm93IG5ldyBUeXBlRXJyb3IoJ2l0ZXJhdG9yIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXHR9XG5cdHZhciBpLCBrLFxuXHRcdGlzU3RyaW5nID0gdHlwZW9mIG9iaiA9PT0gJ3N0cmluZycsXG5cdFx0bCA9IG9iai5sZW5ndGgsXG5cdFx0Y29udGV4dCA9IGFyZ3VtZW50cy5sZW5ndGggPiAyID8gYXJndW1lbnRzWzJdIDogbnVsbDtcblx0aWYgKGwgPT09ICtsKSB7XG5cdFx0Zm9yIChpID0gMDsgaSA8IGw7IGkrKykge1xuXHRcdFx0aWYgKGNvbnRleHQgPT09IG51bGwpIHtcblx0XHRcdFx0Zm4oaXNTdHJpbmcgPyBvYmouY2hhckF0KGkpIDogb2JqW2ldLCBpLCBvYmopO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Zm4uY2FsbChjb250ZXh0LCBpc1N0cmluZyA/IG9iai5jaGFyQXQoaSkgOiBvYmpbaV0sIGksIG9iaik7XG5cdFx0XHR9XG5cdFx0fVxuXHR9IGVsc2Uge1xuXHRcdGZvciAoayBpbiBvYmopIHtcblx0XHRcdGlmIChoYXNPd24uY2FsbChvYmosIGspKSB7XG5cdFx0XHRcdGlmIChjb250ZXh0ID09PSBudWxsKSB7XG5cdFx0XHRcdFx0Zm4ob2JqW2tdLCBrLCBvYmopO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGZuLmNhbGwoY29udGV4dCwgb2JqW2tdLCBrLCBvYmopO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG59O1xuXG4iLCJcInVzZSBzdHJpY3RcIjtcblxuLy8gbW9kaWZpZWQgZnJvbSBodHRwczovL2dpdGh1Yi5jb20vZXMtc2hpbXMvZXM1LXNoaW1cbnZhciBoYXMgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LFxuXHR0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcsXG5cdGZvckVhY2ggPSByZXF1aXJlKCcuL2ZvcmVhY2gnKSxcblx0aXNBcmdzID0gcmVxdWlyZSgnLi9pc0FyZ3VtZW50cycpLFxuXHRoYXNEb250RW51bUJ1ZyA9ICEoeyd0b1N0cmluZyc6IG51bGx9KS5wcm9wZXJ0eUlzRW51bWVyYWJsZSgndG9TdHJpbmcnKSxcblx0aGFzUHJvdG9FbnVtQnVnID0gKGZ1bmN0aW9uICgpIHt9KS5wcm9wZXJ0eUlzRW51bWVyYWJsZSgncHJvdG90eXBlJyksXG5cdGRvbnRFbnVtcyA9IFtcblx0XHRcInRvU3RyaW5nXCIsXG5cdFx0XCJ0b0xvY2FsZVN0cmluZ1wiLFxuXHRcdFwidmFsdWVPZlwiLFxuXHRcdFwiaGFzT3duUHJvcGVydHlcIixcblx0XHRcImlzUHJvdG90eXBlT2ZcIixcblx0XHRcInByb3BlcnR5SXNFbnVtZXJhYmxlXCIsXG5cdFx0XCJjb25zdHJ1Y3RvclwiXG5cdF07XG5cbnZhciBrZXlzU2hpbSA9IGZ1bmN0aW9uIGtleXMob2JqZWN0KSB7XG5cdHZhciBpc09iamVjdCA9IG9iamVjdCAhPT0gbnVsbCAmJiB0eXBlb2Ygb2JqZWN0ID09PSAnb2JqZWN0Jyxcblx0XHRpc0Z1bmN0aW9uID0gdG9TdHJpbmcuY2FsbChvYmplY3QpID09PSAnW29iamVjdCBGdW5jdGlvbl0nLFxuXHRcdGlzQXJndW1lbnRzID0gaXNBcmdzKG9iamVjdCksXG5cdFx0dGhlS2V5cyA9IFtdO1xuXG5cdGlmICghaXNPYmplY3QgJiYgIWlzRnVuY3Rpb24gJiYgIWlzQXJndW1lbnRzKSB7XG5cdFx0dGhyb3cgbmV3IFR5cGVFcnJvcihcIk9iamVjdC5rZXlzIGNhbGxlZCBvbiBhIG5vbi1vYmplY3RcIik7XG5cdH1cblxuXHRpZiAoaXNBcmd1bWVudHMpIHtcblx0XHRmb3JFYWNoKG9iamVjdCwgZnVuY3Rpb24gKHZhbHVlLCBpbmRleCkge1xuXHRcdFx0dGhlS2V5cy5wdXNoKGluZGV4KTtcblx0XHR9KTtcblx0fSBlbHNlIHtcblx0XHR2YXIgbmFtZSxcblx0XHRcdHNraXBQcm90byA9IGhhc1Byb3RvRW51bUJ1ZyAmJiBpc0Z1bmN0aW9uO1xuXG5cdFx0Zm9yIChuYW1lIGluIG9iamVjdCkge1xuXHRcdFx0aWYgKCEoc2tpcFByb3RvICYmIG5hbWUgPT09ICdwcm90b3R5cGUnKSAmJiBoYXMuY2FsbChvYmplY3QsIG5hbWUpKSB7XG5cdFx0XHRcdHRoZUtleXMucHVzaChuYW1lKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRpZiAoaGFzRG9udEVudW1CdWcpIHtcblx0XHR2YXIgY3RvciA9IG9iamVjdC5jb25zdHJ1Y3Rvcixcblx0XHRcdHNraXBDb25zdHJ1Y3RvciA9IGN0b3IgJiYgY3Rvci5wcm90b3R5cGUgPT09IG9iamVjdDtcblxuXHRcdGZvckVhY2goZG9udEVudW1zLCBmdW5jdGlvbiAoZG9udEVudW0pIHtcblx0XHRcdGlmICghKHNraXBDb25zdHJ1Y3RvciAmJiBkb250RW51bSA9PT0gJ2NvbnN0cnVjdG9yJykgJiYgaGFzLmNhbGwob2JqZWN0LCBkb250RW51bSkpIHtcblx0XHRcdFx0dGhlS2V5cy5wdXNoKGRvbnRFbnVtKTtcblx0XHRcdH1cblx0XHR9KTtcblx0fVxuXHRyZXR1cm4gdGhlS2V5cztcbn07XG5cbmtleXNTaGltLnNoaW0gPSBmdW5jdGlvbiBzaGltT2JqZWN0S2V5cygpIHtcblx0aWYgKCFPYmplY3Qua2V5cykge1xuXHRcdE9iamVjdC5rZXlzID0ga2V5c1NoaW07XG5cdH1cblx0cmV0dXJuIE9iamVjdC5rZXlzIHx8IGtleXNTaGltO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBrZXlzU2hpbTtcblxuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciB0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNBcmd1bWVudHModmFsdWUpIHtcblx0dmFyIHN0ciA9IHRvU3RyaW5nLmNhbGwodmFsdWUpO1xuXHR2YXIgaXNBcmd1bWVudHMgPSBzdHIgPT09ICdbb2JqZWN0IEFyZ3VtZW50c10nO1xuXHRpZiAoIWlzQXJndW1lbnRzKSB7XG5cdFx0aXNBcmd1bWVudHMgPSBzdHIgIT09ICdbb2JqZWN0IEFycmF5XSdcblx0XHRcdCYmIHZhbHVlICE9PSBudWxsXG5cdFx0XHQmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnXG5cdFx0XHQmJiB0eXBlb2YgdmFsdWUubGVuZ3RoID09PSAnbnVtYmVyJ1xuXHRcdFx0JiYgdmFsdWUubGVuZ3RoID49IDBcblx0XHRcdCYmIHRvU3RyaW5nLmNhbGwodmFsdWUuY2FsbGVlKSA9PT0gJ1tvYmplY3QgRnVuY3Rpb25dJztcblx0fVxuXHRyZXR1cm4gaXNBcmd1bWVudHM7XG59O1xuXG4iLCJcbi8qKlxuICogTW9kdWxlIGRlcGVuZGVuY2llcy5cbiAqL1xuXG52YXIgbWFwID0gcmVxdWlyZSgnYXJyYXktbWFwJyk7XG52YXIgaW5kZXhPZiA9IHJlcXVpcmUoJ2luZGV4b2YnKTtcbnZhciBpc0FycmF5ID0gcmVxdWlyZSgnaXNhcnJheScpO1xudmFyIGZvckVhY2ggPSByZXF1aXJlKCdmb3JlYWNoJyk7XG52YXIgcmVkdWNlID0gcmVxdWlyZSgnYXJyYXktcmVkdWNlJyk7XG52YXIgZ2V0T2JqZWN0S2V5cyA9IHJlcXVpcmUoJ29iamVjdC1rZXlzJyk7XG52YXIgSlNPTiA9IHJlcXVpcmUoJ2pzb24zJyk7XG5cbi8qKlxuICogTWFrZSBzdXJlIGBPYmplY3Qua2V5c2Agd29yayBmb3IgYHVuZGVmaW5lZGBcbiAqIHZhbHVlcyB0aGF0IGFyZSBzdGlsbCB0aGVyZSwgbGlrZSBgZG9jdW1lbnQuYWxsYC5cbiAqIGh0dHA6Ly9saXN0cy53My5vcmcvQXJjaGl2ZXMvUHVibGljL3B1YmxpYy1odG1sLzIwMDlKdW4vMDU0Ni5odG1sXG4gKlxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gb2JqZWN0S2V5cyh2YWwpe1xuICBpZiAoT2JqZWN0LmtleXMpIHJldHVybiBPYmplY3Qua2V5cyh2YWwpO1xuICByZXR1cm4gZ2V0T2JqZWN0S2V5cyh2YWwpO1xufVxuXG4vKipcbiAqIE1vZHVsZSBleHBvcnRzLlxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gaW5zcGVjdDtcblxuLyoqXG4gKiBFY2hvcyB0aGUgdmFsdWUgb2YgYSB2YWx1ZS4gVHJ5cyB0byBwcmludCB0aGUgdmFsdWUgb3V0XG4gKiBpbiB0aGUgYmVzdCB3YXkgcG9zc2libGUgZ2l2ZW4gdGhlIGRpZmZlcmVudCB0eXBlcy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqIFRoZSBvYmplY3QgdG8gcHJpbnQgb3V0LlxuICogQHBhcmFtIHtPYmplY3R9IG9wdHMgT3B0aW9uYWwgb3B0aW9ucyBvYmplY3QgdGhhdCBhbHRlcnMgdGhlIG91dHB1dC5cbiAqIEBsaWNlbnNlIE1JVCAowqkgSm95ZW50KVxuICovXG4vKiBsZWdhY3k6IG9iaiwgc2hvd0hpZGRlbiwgZGVwdGgsIGNvbG9ycyovXG5cbmZ1bmN0aW9uIGluc3BlY3Qob2JqLCBvcHRzKSB7XG4gIC8vIGRlZmF1bHQgb3B0aW9uc1xuICB2YXIgY3R4ID0ge1xuICAgIHNlZW46IFtdLFxuICAgIHN0eWxpemU6IHN0eWxpemVOb0NvbG9yXG4gIH07XG4gIC8vIGxlZ2FjeS4uLlxuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSAzKSBjdHguZGVwdGggPSBhcmd1bWVudHNbMl07XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDQpIGN0eC5jb2xvcnMgPSBhcmd1bWVudHNbM107XG4gIGlmIChpc0Jvb2xlYW4ob3B0cykpIHtcbiAgICAvLyBsZWdhY3kuLi5cbiAgICBjdHguc2hvd0hpZGRlbiA9IG9wdHM7XG4gIH0gZWxzZSBpZiAob3B0cykge1xuICAgIC8vIGdvdCBhbiBcIm9wdGlvbnNcIiBvYmplY3RcbiAgICBfZXh0ZW5kKGN0eCwgb3B0cyk7XG4gIH1cbiAgLy8gc2V0IGRlZmF1bHQgb3B0aW9uc1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LnNob3dIaWRkZW4pKSBjdHguc2hvd0hpZGRlbiA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmRlcHRoKSkgY3R4LmRlcHRoID0gMjtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jb2xvcnMpKSBjdHguY29sb3JzID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY3VzdG9tSW5zcGVjdCkpIGN0eC5jdXN0b21JbnNwZWN0ID0gdHJ1ZTtcbiAgaWYgKGN0eC5jb2xvcnMpIGN0eC5zdHlsaXplID0gc3R5bGl6ZVdpdGhDb2xvcjtcbiAgcmV0dXJuIGZvcm1hdFZhbHVlKGN0eCwgb2JqLCBjdHguZGVwdGgpO1xufVxuXG4vLyBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0FOU0lfZXNjYXBlX2NvZGUjZ3JhcGhpY3Ncbmluc3BlY3QuY29sb3JzID0ge1xuICAnYm9sZCcgOiBbMSwgMjJdLFxuICAnaXRhbGljJyA6IFszLCAyM10sXG4gICd1bmRlcmxpbmUnIDogWzQsIDI0XSxcbiAgJ2ludmVyc2UnIDogWzcsIDI3XSxcbiAgJ3doaXRlJyA6IFszNywgMzldLFxuICAnZ3JleScgOiBbOTAsIDM5XSxcbiAgJ2JsYWNrJyA6IFszMCwgMzldLFxuICAnYmx1ZScgOiBbMzQsIDM5XSxcbiAgJ2N5YW4nIDogWzM2LCAzOV0sXG4gICdncmVlbicgOiBbMzIsIDM5XSxcbiAgJ21hZ2VudGEnIDogWzM1LCAzOV0sXG4gICdyZWQnIDogWzMxLCAzOV0sXG4gICd5ZWxsb3cnIDogWzMzLCAzOV1cbn07XG5cbi8vIERvbid0IHVzZSAnYmx1ZScgbm90IHZpc2libGUgb24gY21kLmV4ZVxuaW5zcGVjdC5zdHlsZXMgPSB7XG4gICdzcGVjaWFsJzogJ2N5YW4nLFxuICAnbnVtYmVyJzogJ3llbGxvdycsXG4gICdib29sZWFuJzogJ3llbGxvdycsXG4gICd1bmRlZmluZWQnOiAnZ3JleScsXG4gICdudWxsJzogJ2JvbGQnLFxuICAnc3RyaW5nJzogJ2dyZWVuJyxcbiAgJ2RhdGUnOiAnbWFnZW50YScsXG4gIC8vIFwibmFtZVwiOiBpbnRlbnRpb25hbGx5IG5vdCBzdHlsaW5nXG4gICdyZWdleHAnOiAncmVkJ1xufTtcblxuZnVuY3Rpb24gc3R5bGl6ZU5vQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgcmV0dXJuIHN0cjtcbn1cblxuZnVuY3Rpb24gaXNCb29sZWFuKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nO1xufVxuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuXG5mdW5jdGlvbiBzdHlsaXplV2l0aENvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHZhciBzdHlsZSA9IGluc3BlY3Quc3R5bGVzW3N0eWxlVHlwZV07XG5cbiAgaWYgKHN0eWxlKSB7XG4gICAgcmV0dXJuICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMF0gKyAnbScgKyBzdHIgK1xuICAgICAgICAgICAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzFdICsgJ20nO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBzdHI7XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbic7XG59XG5cbmZ1bmN0aW9uIGlzU3RyaW5nKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N0cmluZyc7XG59XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ251bWJlcic7XG59XG5cbmZ1bmN0aW9uIGlzTnVsbChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbDtcbn1cblxuZnVuY3Rpb24gaGFzT3duKG9iaiwgcHJvcCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCk7XG59XG5cbmZ1bmN0aW9uIGlzUmVnRXhwKHJlKSB7XG4gIHJldHVybiBpc09iamVjdChyZSkgJiYgb2JqZWN0VG9TdHJpbmcocmUpID09PSAnW29iamVjdCBSZWdFeHBdJztcbn1cblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5cbmZ1bmN0aW9uIGlzRXJyb3IoZSkge1xuICByZXR1cm4gaXNPYmplY3QoZSkgJiZcbiAgICAgIChvYmplY3RUb1N0cmluZyhlKSA9PT0gJ1tvYmplY3QgRXJyb3JdJyB8fCBlIGluc3RhbmNlb2YgRXJyb3IpO1xufVxuXG5mdW5jdGlvbiBpc0RhdGUoZCkge1xuICByZXR1cm4gaXNPYmplY3QoZCkgJiYgb2JqZWN0VG9TdHJpbmcoZCkgPT09ICdbb2JqZWN0IERhdGVdJztcbn1cblxuZnVuY3Rpb24gb2JqZWN0VG9TdHJpbmcobykge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG8pO1xufVxuXG5mdW5jdGlvbiBhcnJheVRvSGFzaChhcnJheSkge1xuICB2YXIgaGFzaCA9IHt9O1xuXG4gIGZvckVhY2goYXJyYXksIGZ1bmN0aW9uKHZhbCwgaWR4KSB7XG4gICAgaGFzaFt2YWxdID0gdHJ1ZTtcbiAgfSk7XG5cbiAgcmV0dXJuIGhhc2g7XG59XG5cbmZ1bmN0aW9uIGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpIHtcbiAgdmFyIG91dHB1dCA9IFtdO1xuICBmb3IgKHZhciBpID0gMCwgbCA9IHZhbHVlLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgIGlmIChoYXNPd24odmFsdWUsIFN0cmluZyhpKSkpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAgU3RyaW5nKGkpLCB0cnVlKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dHB1dC5wdXNoKCcnKTtcbiAgICB9XG4gIH1cbiAgZm9yRWFjaChrZXlzLCBmdW5jdGlvbihrZXkpIHtcbiAgICBpZiAoIWtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAga2V5LCB0cnVlKSk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIG91dHB1dDtcbn1cblxuZnVuY3Rpb24gZm9ybWF0RXJyb3IodmFsdWUpIHtcbiAgcmV0dXJuICdbJyArIEVycm9yLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSArICddJztcbn1cblxuZnVuY3Rpb24gZm9ybWF0VmFsdWUoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzKSB7XG4gIC8vIFByb3ZpZGUgYSBob29rIGZvciB1c2VyLXNwZWNpZmllZCBpbnNwZWN0IGZ1bmN0aW9ucy5cbiAgLy8gQ2hlY2sgdGhhdCB2YWx1ZSBpcyBhbiBvYmplY3Qgd2l0aCBhbiBpbnNwZWN0IGZ1bmN0aW9uIG9uIGl0XG4gIGlmIChjdHguY3VzdG9tSW5zcGVjdCAmJlxuICAgICAgdmFsdWUgJiZcbiAgICAgIGlzRnVuY3Rpb24odmFsdWUuaW5zcGVjdCkgJiZcbiAgICAgIC8vIEZpbHRlciBvdXQgdGhlIHV0aWwgbW9kdWxlLCBpdCdzIGluc3BlY3QgZnVuY3Rpb24gaXMgc3BlY2lhbFxuICAgICAgdmFsdWUuaW5zcGVjdCAhPT0gaW5zcGVjdCAmJlxuICAgICAgLy8gQWxzbyBmaWx0ZXIgb3V0IGFueSBwcm90b3R5cGUgb2JqZWN0cyB1c2luZyB0aGUgY2lyY3VsYXIgY2hlY2suXG4gICAgICAhKHZhbHVlLmNvbnN0cnVjdG9yICYmIHZhbHVlLmNvbnN0cnVjdG9yLnByb3RvdHlwZSA9PT0gdmFsdWUpKSB7XG4gICAgdmFyIHJldCA9IHZhbHVlLmluc3BlY3QocmVjdXJzZVRpbWVzLCBjdHgpO1xuICAgIGlmICghaXNTdHJpbmcocmV0KSkge1xuICAgICAgcmV0ID0gZm9ybWF0VmFsdWUoY3R4LCByZXQsIHJlY3Vyc2VUaW1lcyk7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG4gIH1cblxuICAvLyBQcmltaXRpdmUgdHlwZXMgY2Fubm90IGhhdmUgcHJvcGVydGllc1xuICB2YXIgcHJpbWl0aXZlID0gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpO1xuICBpZiAocHJpbWl0aXZlKSB7XG4gICAgcmV0dXJuIHByaW1pdGl2ZTtcbiAgfVxuXG4gIC8vIExvb2sgdXAgdGhlIGtleXMgb2YgdGhlIG9iamVjdC5cbiAgdmFyIGtleXMgPSBvYmplY3RLZXlzKHZhbHVlKTtcbiAgdmFyIHZpc2libGVLZXlzID0gYXJyYXlUb0hhc2goa2V5cyk7XG5cbiAgaWYgKGN0eC5zaG93SGlkZGVuICYmIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKSB7XG4gICAga2V5cyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHZhbHVlKTtcbiAgfVxuXG4gIC8vIElFIGRvZXNuJ3QgbWFrZSBlcnJvciBmaWVsZHMgbm9uLWVudW1lcmFibGVcbiAgLy8gaHR0cDovL21zZG4ubWljcm9zb2Z0LmNvbS9lbi11cy9saWJyYXJ5L2llL2R3dzUyc2J0KHY9dnMuOTQpLmFzcHhcbiAgaWYgKGlzRXJyb3IodmFsdWUpXG4gICAgICAmJiAoaW5kZXhPZihrZXlzLCAnbWVzc2FnZScpID49IDAgfHwgaW5kZXhPZihrZXlzLCAnZGVzY3JpcHRpb24nKSA+PSAwKSkge1xuICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICAvLyBTb21lIHR5cGUgb2Ygb2JqZWN0IHdpdGhvdXQgcHJvcGVydGllcyBjYW4gYmUgc2hvcnRjdXR0ZWQuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgdmFyIG5hbWUgPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW0Z1bmN0aW9uJyArIG5hbWUgKyAnXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfVxuICAgIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoRGF0ZS5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdkYXRlJyk7XG4gICAgfVxuICAgIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICB2YXIgYmFzZSA9ICcnLCBhcnJheSA9IGZhbHNlLCBicmFjZXMgPSBbJ3snLCAnfSddO1xuXG4gIC8vIE1ha2UgQXJyYXkgc2F5IHRoYXQgdGhleSBhcmUgQXJyYXlcbiAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgYXJyYXkgPSB0cnVlO1xuICAgIGJyYWNlcyA9IFsnWycsICddJ107XG4gIH1cblxuICAvLyBNYWtlIGZ1bmN0aW9ucyBzYXkgdGhhdCB0aGV5IGFyZSBmdW5jdGlvbnNcbiAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgdmFyIG4gPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICBiYXNlID0gJyBbRnVuY3Rpb24nICsgbiArICddJztcbiAgfVxuXG4gIC8vIE1ha2UgUmVnRXhwcyBzYXkgdGhhdCB0aGV5IGFyZSBSZWdFeHBzXG4gIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZGF0ZXMgd2l0aCBwcm9wZXJ0aWVzIGZpcnN0IHNheSB0aGUgZGF0ZVxuICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBEYXRlLnByb3RvdHlwZS50b1VUQ1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZXJyb3Igd2l0aCBtZXNzYWdlIGZpcnN0IHNheSB0aGUgZXJyb3JcbiAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCAmJiAoIWFycmF5IHx8IHZhbHVlLmxlbmd0aCA9PSAwKSkge1xuICAgIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgYnJhY2VzWzFdO1xuICB9XG5cbiAgaWYgKHJlY3Vyc2VUaW1lcyA8IDApIHtcbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tPYmplY3RdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cblxuICBjdHguc2Vlbi5wdXNoKHZhbHVlKTtcblxuICB2YXIgb3V0cHV0O1xuICBpZiAoYXJyYXkpIHtcbiAgICBvdXRwdXQgPSBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKTtcbiAgfSBlbHNlIHtcbiAgICBvdXRwdXQgPSBtYXAoa2V5cywgZnVuY3Rpb24oa2V5KSB7XG4gICAgICByZXR1cm4gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSk7XG4gICAgfSk7XG4gIH1cblxuICBjdHguc2Vlbi5wb3AoKTtcblxuICByZXR1cm4gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpO1xufVxuXG5mdW5jdGlvbiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KSB7XG4gIHZhciBuYW1lLCBzdHIsIGRlc2M7XG4gIGRlc2MgPSB7IHZhbHVlOiB2YWx1ZVtrZXldIH07XG4gIGlmIChPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKSB7XG4gICAgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodmFsdWUsIGtleSkgfHwgZGVzYztcbiAgfVxuICBpZiAoZGVzYy5nZXQpIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyL1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmICghaGFzT3duKHZpc2libGVLZXlzLCBrZXkpKSB7XG4gICAgbmFtZSA9ICdbJyArIGtleSArICddJztcbiAgfVxuICBpZiAoIXN0cikge1xuICAgIGlmIChpbmRleE9mKGN0eC5zZWVuLCBkZXNjLnZhbHVlKSA8IDApIHtcbiAgICAgIGlmIChpc051bGwocmVjdXJzZVRpbWVzKSkge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIG51bGwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCByZWN1cnNlVGltZXMgLSAxKTtcbiAgICAgIH1cbiAgICAgIGlmIChzdHIuaW5kZXhPZignXFxuJykgPiAtMSkge1xuICAgICAgICBpZiAoYXJyYXkpIHtcbiAgICAgICAgICBzdHIgPSBtYXAoc3RyLnNwbGl0KCdcXG4nKSwgZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpLnN1YnN0cigyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHIgPSAnXFxuJyArIG1hcChzdHIuc3BsaXQoJ1xcbicpLCBmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbQ2lyY3VsYXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKGlzVW5kZWZpbmVkKG5hbWUpKSB7XG4gICAgaWYgKGFycmF5ICYmIGtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIHJldHVybiBzdHI7XG4gICAgfVxuICAgIG5hbWUgPSBKU09OLnN0cmluZ2lmeSgnJyArIGtleSk7XG4gICAgaWYgKG5hbWUubWF0Y2goL15cIihbYS16QS1aX11bYS16QS1aXzAtOV0qKVwiJC8pKSB7XG4gICAgICBuYW1lID0gbmFtZS5zdWJzdHIoMSwgbmFtZS5sZW5ndGggLSAyKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnbmFtZScpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuYW1lID0gbmFtZS5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvKF5cInxcIiQpL2csIFwiJ1wiKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnc3RyaW5nJyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5hbWUgKyAnOiAnICsgc3RyO1xufVxuXG5mdW5jdGlvbiBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSkge1xuICBpZiAoaXNVbmRlZmluZWQodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgndW5kZWZpbmVkJywgJ3VuZGVmaW5lZCcpO1xuICBpZiAoaXNTdHJpbmcodmFsdWUpKSB7XG4gICAgdmFyIHNpbXBsZSA9ICdcXCcnICsgSlNPTi5zdHJpbmdpZnkodmFsdWUpLnJlcGxhY2UoL15cInxcIiQvZywgJycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpICsgJ1xcJyc7XG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKHNpbXBsZSwgJ3N0cmluZycpO1xuICB9XG4gIGlmIChpc051bWJlcih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdudW1iZXInKTtcbiAgaWYgKGlzQm9vbGVhbih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdib29sZWFuJyk7XG4gIC8vIEZvciBzb21lIHJlYXNvbiB0eXBlb2YgbnVsbCBpcyBcIm9iamVjdFwiLCBzbyBzcGVjaWFsIGNhc2UgaGVyZS5cbiAgaWYgKGlzTnVsbCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCdudWxsJywgJ251bGwnKTtcbn1cblxuZnVuY3Rpb24gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpIHtcbiAgdmFyIG51bUxpbmVzRXN0ID0gMDtcbiAgdmFyIGxlbmd0aCA9IHJlZHVjZShvdXRwdXQsIGZ1bmN0aW9uKHByZXYsIGN1cikge1xuICAgIG51bUxpbmVzRXN0Kys7XG4gICAgaWYgKGN1ci5pbmRleE9mKCdcXG4nKSA+PSAwKSBudW1MaW5lc0VzdCsrO1xuICAgIHJldHVybiBwcmV2ICsgY3VyLnJlcGxhY2UoL1xcdTAwMWJcXFtcXGRcXGQ/bS9nLCAnJykubGVuZ3RoICsgMTtcbiAgfSwgMCk7XG5cbiAgaWYgKGxlbmd0aCA+IDYwKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArXG4gICAgICAgICAgIChiYXNlID09PSAnJyA/ICcnIDogYmFzZSArICdcXG4gJykgK1xuICAgICAgICAgICAnICcgK1xuICAgICAgICAgICBvdXRwdXQuam9pbignLFxcbiAgJykgK1xuICAgICAgICAgICAnICcgK1xuICAgICAgICAgICBicmFjZXNbMV07XG4gIH1cblxuICByZXR1cm4gYnJhY2VzWzBdICsgYmFzZSArICcgJyArIG91dHB1dC5qb2luKCcsICcpICsgJyAnICsgYnJhY2VzWzFdO1xufVxuXG5mdW5jdGlvbiBfZXh0ZW5kKG9yaWdpbiwgYWRkKSB7XG4gIC8vIERvbid0IGRvIGFueXRoaW5nIGlmIGFkZCBpc24ndCBhbiBvYmplY3RcbiAgaWYgKCFhZGQgfHwgIWlzT2JqZWN0KGFkZCkpIHJldHVybiBvcmlnaW47XG5cbiAgdmFyIGtleXMgPSBvYmplY3RLZXlzKGFkZCk7XG4gIHZhciBpID0ga2V5cy5sZW5ndGg7XG4gIHdoaWxlIChpLS0pIHtcbiAgICBvcmlnaW5ba2V5c1tpXV0gPSBhZGRba2V5c1tpXV07XG4gIH1cbiAgcmV0dXJuIG9yaWdpbjtcbn1cbiIsIlwidXNlIHN0cmljdFwiXG5cbi8vIFRoaXMgaXMgYSByZXBvcnRlciB0aGF0IG1pbWljcyBNb2NoYSdzIGBkb3RgIHJlcG9ydGVyXG5cbnZhciBSID0gcmVxdWlyZShcIi4uL2xpYi9yZXBvcnRlclwiKVxuXG5mdW5jdGlvbiB3aWR0aCgpIHtcbiAgICByZXR1cm4gUi53aW5kb3dXaWR0aCgpICogNCAvIDMgfCAwXG59XG5cbmZ1bmN0aW9uIHByaW50RG90KF8sIGNvbG9yKSB7XG4gICAgZnVuY3Rpb24gZW1pdCgpIHtcbiAgICAgICAgcmV0dXJuIF8ud3JpdGUoUi5jb2xvcihjb2xvcixcbiAgICAgICAgICAgIGNvbG9yID09PSBcImZhaWxcIiA/IFIuc3ltYm9scygpLkRvdEZhaWwgOiBSLnN5bWJvbHMoKS5Eb3QpKVxuICAgIH1cblxuICAgIGlmIChfLnN0YXRlLmNvdW50ZXIrKyAlIHdpZHRoKCkgPT09IDApIHtcbiAgICAgICAgcmV0dXJuIF8ud3JpdGUoUi5uZXdsaW5lKCkgKyBcIiAgXCIpLnRoZW4oZW1pdClcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZW1pdCgpXG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFIub24oXCJkb3RcIiwge1xuICAgIGFjY2VwdHM6IFtcIndyaXRlXCIsIFwicmVzZXRcIiwgXCJjb2xvcnNcIl0sXG4gICAgY3JlYXRlOiBSLmNvbnNvbGVSZXBvcnRlcixcbiAgICBiZWZvcmU6IFIuc2V0Q29sb3IsXG4gICAgYWZ0ZXI6IFIudW5zZXRDb2xvcixcbiAgICBpbml0OiBmdW5jdGlvbiAoc3RhdGUpIHsgc3RhdGUuY291bnRlciA9IDAgfSxcblxuICAgIHJlcG9ydDogZnVuY3Rpb24gKF8sIHJlcG9ydCkge1xuICAgICAgICBpZiAocmVwb3J0LmlzRW50ZXIgfHwgcmVwb3J0LmlzUGFzcykge1xuICAgICAgICAgICAgcmV0dXJuIHByaW50RG90KF8sIFIuc3BlZWQocmVwb3J0KSlcbiAgICAgICAgfSBlbHNlIGlmIChyZXBvcnQuaXNIb29rIHx8IHJlcG9ydC5pc0ZhaWwpIHtcbiAgICAgICAgICAgIF8ucHVzaEVycm9yKHJlcG9ydClcbiAgICAgICAgICAgIC8vIFByaW50IGEgZG90IHJlZ2FyZGxlc3Mgb2YgaG9vayBzdWNjZXNzXG4gICAgICAgICAgICByZXR1cm4gcHJpbnREb3QoXywgXCJmYWlsXCIpXG4gICAgICAgIH0gZWxzZSBpZiAocmVwb3J0LmlzU2tpcCkge1xuICAgICAgICAgICAgcmV0dXJuIHByaW50RG90KF8sIFwic2tpcFwiKVxuICAgICAgICB9IGVsc2UgaWYgKHJlcG9ydC5pc0VuZCkge1xuICAgICAgICAgICAgcmV0dXJuIF8ucHJpbnQoKS50aGVuKF8ucHJpbnRSZXN1bHRzLmJpbmQoXykpXG4gICAgICAgIH0gZWxzZSBpZiAocmVwb3J0LmlzRXJyb3IpIHtcbiAgICAgICAgICAgIGlmIChfLnN0YXRlLmNvdW50ZXIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gXy5wcmludCgpLnRoZW4oXy5wcmludEVycm9yLmJpbmQoXywgcmVwb3J0KSlcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF8ucHJpbnRFcnJvcihyZXBvcnQpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgICAgIH1cbiAgICB9LFxufSlcbiIsIlwidXNlIHN0cmljdFwiXG5cbi8vIGV4cG9ydHMuZG9tID0gcmVxdWlyZShcIi4vZG9tXCIpXG5leHBvcnRzLmRvdCA9IHJlcXVpcmUoXCIuL2RvdFwiKVxuZXhwb3J0cy5zcGVjID0gcmVxdWlyZShcIi4vc3BlY1wiKVxuZXhwb3J0cy50YXAgPSByZXF1aXJlKFwiLi90YXBcIilcbiIsIlwidXNlIHN0cmljdFwiXG5cbi8vIFRoaXMgaXMgYSByZXBvcnRlciB0aGF0IG1pbWljcyBNb2NoYSdzIGBzcGVjYCByZXBvcnRlci5cblxudmFyIFIgPSByZXF1aXJlKFwiLi4vbGliL3JlcG9ydGVyXCIpXG52YXIgYyA9IFIuY29sb3JcblxuZnVuY3Rpb24gaW5kZW50KGxldmVsKSB7XG4gICAgdmFyIHJldCA9IFwiXCJcblxuICAgIHdoaWxlIChsZXZlbC0tKSByZXQgKz0gXCIgIFwiXG4gICAgcmV0dXJuIHJldFxufVxuXG5mdW5jdGlvbiBnZXROYW1lKGxldmVsLCByZXBvcnQpIHtcbiAgICByZXR1cm4gcmVwb3J0LnBhdGhbbGV2ZWwgLSAxXS5uYW1lXG59XG5cbmZ1bmN0aW9uIHByaW50UmVwb3J0KF8sIHJlcG9ydCwgaW5pdCkge1xuICAgIGlmIChfLnN0YXRlLmxlYXZpbmcpIHtcbiAgICAgICAgXy5zdGF0ZS5sZWF2aW5nID0gZmFsc2VcbiAgICAgICAgcmV0dXJuIF8ucHJpbnQoKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBfLnByaW50KGluZGVudChfLnN0YXRlLmxldmVsKSArIGluaXQoKSlcbiAgICAgICAgfSlcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gXy5wcmludChpbmRlbnQoXy5zdGF0ZS5sZXZlbCkgKyBpbml0KCkpXG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFIub24oXCJzcGVjXCIsIHtcbiAgICBhY2NlcHRzOiBbXCJ3cml0ZVwiLCBcInJlc2V0XCIsIFwiY29sb3JzXCJdLFxuICAgIGNyZWF0ZTogUi5jb25zb2xlUmVwb3J0ZXIsXG4gICAgYmVmb3JlOiBSLnNldENvbG9yLFxuICAgIGFmdGVyOiBSLnVuc2V0Q29sb3IsXG5cbiAgICBpbml0OiBmdW5jdGlvbiAoc3RhdGUpIHtcbiAgICAgICAgc3RhdGUubGV2ZWwgPSAxXG4gICAgICAgIHN0YXRlLmxlYXZpbmcgPSBmYWxzZVxuICAgIH0sXG5cbiAgICByZXBvcnQ6IGZ1bmN0aW9uIChfLCByZXBvcnQpIHtcbiAgICAgICAgaWYgKHJlcG9ydC5pc1N0YXJ0KSB7XG4gICAgICAgICAgICByZXR1cm4gXy5wcmludCgpXG4gICAgICAgIH0gZWxzZSBpZiAocmVwb3J0LmlzRW50ZXIpIHtcbiAgICAgICAgICAgIHZhciBsZXZlbCA9IF8uc3RhdGUubGV2ZWwrK1xuICAgICAgICAgICAgdmFyIGxhc3QgPSByZXBvcnQucGF0aFtsZXZlbCAtIDFdXG5cbiAgICAgICAgICAgIF8uc3RhdGUubGVhdmluZyA9IGZhbHNlXG4gICAgICAgICAgICBpZiAobGFzdC5pbmRleCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBfLnByaW50KCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBfLnByaW50KGluZGVudChsZXZlbCkgKyBsYXN0Lm5hbWUpXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF8ucHJpbnQoaW5kZW50KGxldmVsKSArIGxhc3QubmFtZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChyZXBvcnQuaXNMZWF2ZSkge1xuICAgICAgICAgICAgXy5zdGF0ZS5sZXZlbC0tXG4gICAgICAgICAgICBfLnN0YXRlLmxlYXZpbmcgPSB0cnVlXG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgICAgIH0gZWxzZSBpZiAocmVwb3J0LmlzUGFzcykge1xuICAgICAgICAgICAgcmV0dXJuIHByaW50UmVwb3J0KF8sIHJlcG9ydCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBzdHIgPVxuICAgICAgICAgICAgICAgICAgICBjKFwiY2hlY2ttYXJrXCIsIFIuc3ltYm9scygpLlBhc3MgKyBcIiBcIikgK1xuICAgICAgICAgICAgICAgICAgICBjKFwicGFzc1wiLCBnZXROYW1lKF8uc3RhdGUubGV2ZWwsIHJlcG9ydCkpXG5cbiAgICAgICAgICAgICAgICB2YXIgc3BlZWQgPSBSLnNwZWVkKHJlcG9ydClcblxuICAgICAgICAgICAgICAgIGlmIChzcGVlZCAhPT0gXCJmYXN0XCIpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RyICs9IGMoc3BlZWQsIFwiIChcIiArIHJlcG9ydC5kdXJhdGlvbiArIFwibXMpXCIpXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0clxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSBlbHNlIGlmIChyZXBvcnQuaXNIb29rIHx8IHJlcG9ydC5pc0ZhaWwpIHtcbiAgICAgICAgICAgIF8ucHVzaEVycm9yKHJlcG9ydClcblxuICAgICAgICAgICAgLy8gRG9uJ3QgcHJpbnQgdGhlIGRlc2NyaXB0aW9uIGxpbmUgb24gY3VtdWxhdGl2ZSBob29rc1xuICAgICAgICAgICAgaWYgKHJlcG9ydC5pc0hvb2sgJiYgKHJlcG9ydC5pc0JlZm9yZUFsbCB8fCByZXBvcnQuaXNBZnRlckFsbCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBwcmludFJlcG9ydChfLCByZXBvcnQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYyhcImZhaWxcIixcbiAgICAgICAgICAgICAgICAgICAgXy5lcnJvcnMubGVuZ3RoICsgXCIpIFwiICsgZ2V0TmFtZShfLnN0YXRlLmxldmVsLCByZXBvcnQpICtcbiAgICAgICAgICAgICAgICAgICAgUi5mb3JtYXRSZXN0KHJlcG9ydCkpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9IGVsc2UgaWYgKHJlcG9ydC5pc1NraXApIHtcbiAgICAgICAgICAgIHJldHVybiBwcmludFJlcG9ydChfLCByZXBvcnQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYyhcInNraXBcIiwgXCItIFwiICsgZ2V0TmFtZShfLnN0YXRlLmxldmVsLCByZXBvcnQpKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChyZXBvcnQuaXNFbmQpIHJldHVybiBfLnByaW50UmVzdWx0cygpXG4gICAgICAgIGlmIChyZXBvcnQuaXNFcnJvcikgcmV0dXJuIF8ucHJpbnRFcnJvcihyZXBvcnQpXG4gICAgICAgIHJldHVybiB1bmRlZmluZWRcbiAgICB9LFxufSlcbiIsIlwidXNlIHN0cmljdFwiXG5cbi8vIFRoaXMgaXMgYSBiYXNpYyBUQVAtZ2VuZXJhdGluZyByZXBvcnRlci5cblxudmFyIHBlYWNoID0gcmVxdWlyZShcIi4uL2xpYi91dGlsXCIpLnBlYWNoXG52YXIgUiA9IHJlcXVpcmUoXCIuLi9saWIvcmVwb3J0ZXJcIilcbnZhciBpbnNwZWN0ID0gcmVxdWlyZShcIi4uL2xpYi9yZXBsYWNlZC9pbnNwZWN0XCIpXG5cbmZ1bmN0aW9uIHNob3VsZEJyZWFrKG1pbkxlbmd0aCwgc3RyKSB7XG4gICAgcmV0dXJuIHN0ci5sZW5ndGggPiBSLndpbmRvd1dpZHRoKCkgLSBtaW5MZW5ndGggfHwgL1xccj9cXG58Wzo/LV0vLnRlc3Qoc3RyKVxufVxuXG5mdW5jdGlvbiB0ZW1wbGF0ZShfLCByZXBvcnQsIHRtcGwsIHNraXApIHtcbiAgICBpZiAoIXNraXApIF8uc3RhdGUuY291bnRlcisrXG4gICAgdmFyIHBhdGggPSBSLmpvaW5QYXRoKHJlcG9ydCkucmVwbGFjZSgvXFwkL2csIFwiJCQkJFwiKVxuXG4gICAgcmV0dXJuIF8ucHJpbnQoXG4gICAgICAgIHRtcGwucmVwbGFjZSgvJWMvZywgXy5zdGF0ZS5jb3VudGVyKVxuICAgICAgICAgICAgLnJlcGxhY2UoLyVwL2csIHBhdGggKyBSLmZvcm1hdFJlc3QocmVwb3J0KSkpXG59XG5cbmZ1bmN0aW9uIHByaW50TGluZXMoXywgdmFsdWUsIHNraXBGaXJzdCkge1xuICAgIHZhciBsaW5lcyA9IHZhbHVlLnNwbGl0KC9cXHI/XFxuL2cpXG5cbiAgICBpZiAoc2tpcEZpcnN0KSBsaW5lcy5zaGlmdCgpXG4gICAgcmV0dXJuIHBlYWNoKGxpbmVzLCBmdW5jdGlvbiAobGluZSkgeyByZXR1cm4gXy5wcmludChcIiAgICBcIiArIGxpbmUpIH0pXG59XG5cbmZ1bmN0aW9uIHByaW50UmF3KF8sIGtleSwgc3RyKSB7XG4gICAgaWYgKHNob3VsZEJyZWFrKGtleS5sZW5ndGgsIHN0cikpIHtcbiAgICAgICAgcmV0dXJuIF8ucHJpbnQoXCIgIFwiICsga2V5ICsgXCI6IHwtXCIpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIHByaW50TGluZXMoXywgc3RyLCBmYWxzZSkgfSlcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gXy5wcmludChcIiAgXCIgKyBrZXkgKyBcIjogXCIgKyBzdHIpXG4gICAgfVxufVxuXG5mdW5jdGlvbiBwcmludFZhbHVlKF8sIGtleSwgdmFsdWUpIHtcbiAgICByZXR1cm4gcHJpbnRSYXcoXywga2V5LCBpbnNwZWN0KHZhbHVlKSlcbn1cblxuZnVuY3Rpb24gcHJpbnRMaW5lKHAsIF8sIGxpbmUpIHtcbiAgICByZXR1cm4gcC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIF8ucHJpbnQobGluZSkgfSlcbn1cblxuZnVuY3Rpb24gcHJpbnRFcnJvcihfLCByZXBvcnQpIHtcbiAgICB2YXIgZXJyID0gcmVwb3J0LmVycm9yXG5cbiAgICBpZiAoIShlcnIgaW5zdGFuY2VvZiBFcnJvcikpIHtcbiAgICAgICAgcmV0dXJuIHByaW50VmFsdWUoXywgXCJ2YWx1ZVwiLCBlcnIpXG4gICAgfVxuXG4gICAgLy8gTGV0J3MgKm5vdCogZGVwZW5kIG9uIHRoZSBjb25zdHJ1Y3RvciBiZWluZyBUaGFsbGl1bSdzLi4uXG4gICAgaWYgKGVyci5uYW1lICE9PSBcIkFzc2VydGlvbkVycm9yXCIpIHtcbiAgICAgICAgcmV0dXJuIF8ucHJpbnQoXCIgIHN0YWNrOiB8LVwiKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBwcmludExpbmVzKF8sIFIuZ2V0U3RhY2soZXJyKSwgZmFsc2UpXG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgcmV0dXJuIHByaW50VmFsdWUoXywgXCJleHBlY3RlZFwiLCBlcnIuZXhwZWN0ZWQpXG4gICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gcHJpbnRWYWx1ZShfLCBcImFjdHVhbFwiLCBlcnIuYWN0dWFsKSB9KVxuICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIHByaW50UmF3KF8sIFwibWVzc2FnZVwiLCBlcnIubWVzc2FnZSkgfSlcbiAgICAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiBfLnByaW50KFwiICBzdGFjazogfC1cIikgfSlcbiAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBtZXNzYWdlID0gZXJyLm1lc3NhZ2VcblxuICAgICAgICBlcnIubWVzc2FnZSA9IFwiXCJcbiAgICAgICAgcmV0dXJuIHByaW50TGluZXMoXywgUi5nZXRTdGFjayhlcnIpLCB0cnVlKVxuICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7IGVyci5tZXNzYWdlID0gbWVzc2FnZSB9KVxuICAgIH0pXG59XG5cbm1vZHVsZS5leHBvcnRzID0gUi5vbihcInRhcFwiLCB7XG4gICAgYWNjZXB0czogW1wid3JpdGVcIiwgXCJyZXNldFwiXSxcbiAgICBjcmVhdGU6IFIuY29uc29sZVJlcG9ydGVyLFxuICAgIGluaXQ6IGZ1bmN0aW9uIChzdGF0ZSkgeyBzdGF0ZS5jb3VudGVyID0gMCB9LFxuXG4gICAgcmVwb3J0OiBmdW5jdGlvbiAoXywgcmVwb3J0KSB7XG4gICAgICAgIGlmIChyZXBvcnQuaXNTdGFydCkge1xuICAgICAgICAgICAgcmV0dXJuIF8ucHJpbnQoXCJUQVAgdmVyc2lvbiAxM1wiKVxuICAgICAgICB9IGVsc2UgaWYgKHJlcG9ydC5pc0VudGVyKSB7XG4gICAgICAgICAgICAvLyBQcmludCBhIGxlYWRpbmcgY29tbWVudCwgdG8gbWFrZSBzb21lIFRBUCBmb3JtYXR0ZXJzIHByZXR0aWVyLlxuICAgICAgICAgICAgcmV0dXJuIHRlbXBsYXRlKF8sIHJlcG9ydCwgXCIjICVwXCIsIHRydWUpXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiB0ZW1wbGF0ZShfLCByZXBvcnQsIFwib2sgJWNcIikgfSlcbiAgICAgICAgfSBlbHNlIGlmIChyZXBvcnQuaXNQYXNzKSB7XG4gICAgICAgICAgICByZXR1cm4gdGVtcGxhdGUoXywgcmVwb3J0LCBcIm9rICVjICVwXCIpXG4gICAgICAgIH0gZWxzZSBpZiAocmVwb3J0LmlzRmFpbCB8fCByZXBvcnQuaXNIb29rKSB7XG4gICAgICAgICAgICByZXR1cm4gdGVtcGxhdGUoXywgcmVwb3J0LCBcIm5vdCBvayAlYyAlcFwiKVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gXy5wcmludChcIiAgLS0tXCIpIH0pXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiBwcmludEVycm9yKF8sIHJlcG9ydCkgfSlcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIF8ucHJpbnQoXCIgIC4uLlwiKSB9KVxuICAgICAgICB9IGVsc2UgaWYgKHJlcG9ydC5pc1NraXApIHtcbiAgICAgICAgICAgIHJldHVybiB0ZW1wbGF0ZShfLCByZXBvcnQsIFwib2sgJWMgIyBza2lwICVwXCIpXG4gICAgICAgIH0gZWxzZSBpZiAocmVwb3J0LmlzRW5kKSB7XG4gICAgICAgICAgICB2YXIgcCA9IF8ucHJpbnQoXCIxLi5cIiArIF8uc3RhdGUuY291bnRlcilcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIF8ucHJpbnQoXCIjIHRlc3RzIFwiICsgXy50ZXN0cykgfSlcblxuICAgICAgICAgICAgaWYgKF8ucGFzcykgcCA9IHByaW50TGluZShwLCBfLCBcIiMgcGFzcyBcIiArIF8ucGFzcylcbiAgICAgICAgICAgIGlmIChfLmZhaWwpIHAgPSBwcmludExpbmUocCwgXywgXCIjIGZhaWwgXCIgKyBfLmZhaWwpXG4gICAgICAgICAgICBpZiAoXy5za2lwKSBwID0gcHJpbnRMaW5lKHAsIF8sIFwiIyBza2lwIFwiICsgXy5za2lwKVxuICAgICAgICAgICAgcmV0dXJuIHByaW50TGluZShwLCBfLCBcIiMgZHVyYXRpb24gXCIgKyBSLmZvcm1hdFRpbWUoXy5kdXJhdGlvbikpXG4gICAgICAgIH0gZWxzZSBpZiAocmVwb3J0LmlzRXJyb3IpIHtcbiAgICAgICAgICAgIHJldHVybiBfLnByaW50KFwiQmFpbCBvdXQhXCIpXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiBfLnByaW50KFwiICAtLS1cIikgfSlcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIHByaW50RXJyb3IoXywgcmVwb3J0KSB9KVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gXy5wcmludChcIiAgLi4uXCIpIH0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgICAgIH1cbiAgICB9LFxufSlcbiIsIlwidXNlIHN0cmljdFwiXG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4uL2xpYi9icm93c2VyLWJ1bmRsZVwiKVxuXG5yZXF1aXJlKFwiLi4vbWlncmF0ZS9pbmRleFwiKVxuXG4vLyBOb3RlOiBib3RoIG9mIHRoZXNlIGFyZSBkZXByZWNhdGVkXG5tb2R1bGUuZXhwb3J0cy5hc3NlcnRpb25zID0gcmVxdWlyZShcIi4uL2Fzc2VydGlvbnNcIilcbm1vZHVsZS5leHBvcnRzLmNyZWF0ZSA9IHJlcXVpcmUoXCIuLi9taWdyYXRlL2NvbW1vblwiKS5kZXByZWNhdGUoXG4gICAgXCJgdGwuY3JlYXRlYCBpcyBkZXByZWNhdGVkLiBQbGVhc2UgdXNlIGB0bC5yb290YCBpbnN0ZWFkLlwiLFxuICAgIG1vZHVsZS5leHBvcnRzLnJvb3QpXG4iXX0=
