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

    hook: function (path, value) {
        return new Reports.Hook(p(path), h(value))
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

},{"../replaced/inspect":39,"../util":27}],15:[function(require,module,exports){
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
function HookReport(path, hookError) {
    Report.call(this, hookError._)
    this.path = path
    this.name = hookError.name
    this.error = hookError.error
}
methods(HookReport, Report, HookMethods, {
    get hookError() { return new HookError(this._, this, this.error) },
})

},{"../methods":19}],18:[function(require,module,exports){
(function (global){
"use strict"

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
            return reporter(new Reports.Hook(path(test), arg1))

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

function invokeHook(list, stage) {
    if (list == null) return Promise.resolve()
    return peach(list, function (hook) {
        try {
            return hook()
        } catch (e) {
            throw new Reports.HookError(stage, hook, e)
        }
    })
}

function invokeBeforeEach(test) {
    if (test.root === test) {
        return invokeHook(test.beforeEach, Types.BeforeEach)
    } else {
        return invokeBeforeEach(test.parent).then(function () {
            return invokeHook(test.beforeEach, Types.BeforeEach)
        })
    }
}

function invokeAfterEach(test) {
    if (test.root === test) {
        return invokeHook(test.afterEach, Types.AfterEach)
    } else {
        return invokeHook(test.afterEach, Types.AfterEach)
        .then(function () { return invokeAfterEach(test.parent) })
    }
}

function runChildTests(test) {
    if (test.tests == null) return undefined

    var ran = false

    function runChild(child) {
        // Only skipped tests have no callback
        if (child.callback == null) {
            return report(child, Types.Skip)
        } else if (!isOnly(child)) {
            return Promise.resolve()
        } else if (ran) {
            return invokeBeforeEach(test)
            .then(function () { return runNormalChild(child) })
            .then(function () { return invokeAfterEach(test) })
        } else {
            ran = true
            return invokeHook(test.beforeAll, Types.BeforeAll)
            .then(function () { return invokeBeforeEach(test) })
            .then(function () { return runNormalChild(child) })
            .then(function () { return invokeAfterEach(test) })
        }
    }

    function runAllChildren() {
        if (test.tests == null) return Promise.resolve()
        return peach(test.tests, function (child) {
            test.root.current = child
            return runChild(child).then(
                function () { test.root.current = test },
                function (e) { test.root.current = test; throw e })
        })
    }

    return runAllChildren()
    .then(function () {
        return ran ? invokeHook(test.afterAll, Types.AfterAll) : undefined
    })
    .catch(function (e) {
        if (!(e instanceof Reports.HookError)) throw e
        return report(test, Types.Hook, e)
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

},{"../util":27,"./only":16,"./reports":17}],19:[function(require,module,exports){
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

    return _.print("    " + Util.color("fail", parts[0].trim()))
    .then(function () {
        return peach(parts.slice(1), function (part) {
            return _.print("      " + Util.color("fail", part.trim()))
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

},{"../methods":19,"../replaced/inspect":39,"../util":27,"./reporter":24,"./util":25}],22:[function(require,module,exports){
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
module.exports = function (methods) {
    return function (opts) {
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

exports.getStack = function (e) {
    if (e instanceof Error) {
        var description = (e.name + ": " + e.message).replace(/^\s+/gm, "")
        var stripped = ""

        if (stackIncludesMessage) {
            var stack = Util.getStack(e)
            var index = stack.indexOf(e.message)

            if (index < 0) return Util.getStack(e).replace(/^\s+/gm, "")

            var re = /\r?\n/g

            re.lastIndex = index + e.message.length
            index = stack.search(re)
            if (index >= 0) {
                // Skip past the carriage return if there is one
                if (stack[index] === "\r") index++
                stripped = stack.slice(index + 1).replace(/^\s+/gm, "")
            }
        } else {
            stripped = Util.getStack(e).replace(/^\s+/gm, "")
        }

        if (stripped !== "") description += Settings.newline() + stripped
        return description
    } else {
        return Util.getStack(e).replace(/^\s+/gm, "")
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

exports.joinPath = function (report) {
    var path = ""

    for (var i = 0; i < report.path.length; i++) {
        path += " " + report.path[i].name
    }

    return path.slice(1)
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
    var path = " (" + report.stage

    return report.name ? path + " ‒ " + report.name + ")" : path + ")"
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

},{}],36:[function(require,module,exports){
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


},{}],37:[function(require,module,exports){
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


},{"./foreach":36,"./isArguments":38}],38:[function(require,module,exports){
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


},{}],39:[function(require,module,exports){

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

},{"array-map":31,"array-reduce":32,"foreach":33,"indexof":34,"isarray":40,"json3":35,"object-keys":37}],40:[function(require,module,exports){
module.exports = Array.isArray || function (arr) {
  return Object.prototype.toString.call(arr) == '[object Array]';
};

},{}],41:[function(require,module,exports){
"use strict"

// This is a reporter that mimics Mocha's `dot` reporter

var R = require("../lib/reporter")

function width() {
    return R.windowWidth() * 4 / 3 | 0
}

function printDot(_, color) {
    if (_.state.counter++ % width() === 0) {
        return _.write(R.newline() + "  ")
        .then(function () { return _.write(R.color(color, R.symbols().Dot)) })
    } else {
        return _.write(R.color(color, R.symbols().Dot))
    }
}

module.exports = R.on({
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

function printReport(_, init) {
    if (_.state.lastIsNested && _.state.level === 1) {
        return _.print().then(function () {
            _.state.lastIsNested = false
            return _.print(indent(_.state.level) + init())
        })
    } else {
        _.state.lastIsNested = false
        return _.print(indent(_.state.level) + init())
    }
}

module.exports = R.on({
    accepts: ["write", "reset", "colors"],
    create: R.consoleReporter,
    before: R.setColor,
    after: R.unsetColor,

    init: function (state) {
        state.level = 1
        state.lastIsNested = false
    },

    report: function (_, report) {
        if (report.isStart) {
            return _.print()
        } else if (report.isEnter) {
            return printReport(_, function () {
                return getName(_.state.level++, report)
            })
        } else if (report.isLeave) {
            _.state.level--
            _.state.lastIsNested = true
            return undefined
        } else if (report.isPass) {
            return printReport(_, function () {
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
            return printReport(_, function () {
                _.pushError(report)
                return c("fail",
                    _.errors.length + ") " + getName(_.state.level, report) +
                    R.formatRest(report))
            })
        } else if (report.isSkip) {
            return printReport(_, function () {
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

module.exports = R.on({
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

},{"../lib/replaced/inspect":39,"../lib/reporter":22,"../lib/util":27}],"thallium":[function(require,module,exports){
"use strict"

module.exports = require("../lib/browser-bundle")

require("../migrate/index")

// Note: both of these are deprecated
module.exports.assertions = require("../assertions")
module.exports.create = require("../migrate/common").deprecate(
    "`tl.create` is deprecated. Please use `tl.root` instead.",
    module.exports.root)

},{"../assertions":2,"../lib/browser-bundle":15,"../migrate/common":29,"../migrate/index":30}]},{},[])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhc3NlcnQuanMiLCJhc3NlcnRpb25zLmpzIiwiaW5kZXguanMiLCJpbnRlcm5hbC5qcyIsImxpYi9hcGkvaG9va3MuanMiLCJsaWIvYXBpL3JlZmxlY3QuanMiLCJsaWIvYXBpL3RoYWxsaXVtLmpzIiwibGliL2Fzc2VydC9lcXVhbC5qcyIsImxpYi9hc3NlcnQvaGFzLWtleXMuanMiLCJsaWIvYXNzZXJ0L2hhcy5qcyIsImxpYi9hc3NlcnQvaW5jbHVkZXMuanMiLCJsaWIvYXNzZXJ0L3Rocm93cy5qcyIsImxpYi9hc3NlcnQvdHlwZS5qcyIsImxpYi9hc3NlcnQvdXRpbC5qcyIsImxpYi9icm93c2VyLWJ1bmRsZS5qcyIsImxpYi9jb3JlL29ubHkuanMiLCJsaWIvY29yZS9yZXBvcnRzLmpzIiwibGliL2NvcmUvdGVzdHMuanMiLCJsaWIvbWV0aG9kcy5qcyIsImxpYi9yZXBsYWNlZC9jb25zb2xlLWJyb3dzZXIuanMiLCJsaWIvcmVwb3J0ZXIvY29uc29sZS1yZXBvcnRlci5qcyIsImxpYi9yZXBvcnRlci9pbmRleC5qcyIsImxpYi9yZXBvcnRlci9vbi5qcyIsImxpYi9yZXBvcnRlci9yZXBvcnRlci5qcyIsImxpYi9yZXBvcnRlci91dGlsLmpzIiwibGliL3NldHRpbmdzLmpzIiwibGliL3V0aWwuanMiLCJtYXRjaC5qcyIsIm1pZ3JhdGUvY29tbW9uLmpzIiwibWlncmF0ZS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9hcnJheS1tYXAvaW5kZXguanMiLCJub2RlX21vZHVsZXMvYXJyYXktcmVkdWNlL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2ZvcmVhY2gvaW5kZXguanMiLCJub2RlX21vZHVsZXMvaW5kZXhvZi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9qc29uMy9saWIvanNvbjMuanMiLCJub2RlX21vZHVsZXMvb2JqZWN0LWtleXMvZm9yZWFjaC5qcyIsIm5vZGVfbW9kdWxlcy9vYmplY3Qta2V5cy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9vYmplY3Qta2V5cy9pc0FyZ3VtZW50cy5qcyIsIm5vZGVfbW9kdWxlcy91dGlsLWluc3BlY3QvaW5kZXguanMiLCJub2RlX21vZHVsZXMvdXRpbC1pbnNwZWN0L25vZGVfbW9kdWxlcy9pc2FycmF5L2luZGV4LmpzIiwici9kb3QuanMiLCJyL2luZGV4LmpzIiwici9zcGVjLmpzIiwici90YXAuanMiLCJtaWdyYXRlL2J1bmRsZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvMkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4V0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNyUUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDemRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9MQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ2htQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNqNEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaGFBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiXCJ1c2Ugc3RyaWN0XCJcblxuLyoqXG4gKiBDb3JlIFRERC1zdHlsZSBhc3NlcnRpb25zLiBUaGVzZSBhcmUgZG9uZSBieSBhIGNvbXBvc2l0aW9uIG9mIERTTHMsIHNpbmNlXG4gKiB0aGVyZSBpcyAqc28qIG11Y2ggcmVwZXRpdGlvbi4gQWxzbywgdGhpcyBpcyBzcGxpdCBpbnRvIHNldmVyYWwgbmFtZXNwYWNlcyB0b1xuICoga2VlcCB0aGUgZmlsZSBzaXplIG1hbmFnZWFibGUuXG4gKi9cblxudmFyIFV0aWwgPSByZXF1aXJlKFwiLi9saWIvYXNzZXJ0L3V0aWxcIilcbnZhciBUeXBlID0gcmVxdWlyZShcIi4vbGliL2Fzc2VydC90eXBlXCIpXG52YXIgRXF1YWwgPSByZXF1aXJlKFwiLi9saWIvYXNzZXJ0L2VxdWFsXCIpXG52YXIgVGhyb3dzID0gcmVxdWlyZShcIi4vbGliL2Fzc2VydC90aHJvd3NcIilcbnZhciBIYXMgPSByZXF1aXJlKFwiLi9saWIvYXNzZXJ0L2hhc1wiKVxudmFyIEluY2x1ZGVzID0gcmVxdWlyZShcIi4vbGliL2Fzc2VydC9pbmNsdWRlc1wiKVxudmFyIEhhc0tleXMgPSByZXF1aXJlKFwiLi9saWIvYXNzZXJ0L2hhcy1rZXlzXCIpXG5cbmV4cG9ydHMuQXNzZXJ0aW9uRXJyb3IgPSBVdGlsLkFzc2VydGlvbkVycm9yXG5leHBvcnRzLmFzc2VydCA9IFV0aWwuYXNzZXJ0XG5leHBvcnRzLmZhaWwgPSBVdGlsLmZhaWxcbmV4cG9ydHMuZm9ybWF0ID0gVXRpbC5mb3JtYXRcbmV4cG9ydHMuZXNjYXBlID0gVXRpbC5lc2NhcGVcblxuZXhwb3J0cy5vayA9IFR5cGUub2tcbmV4cG9ydHMubm90T2sgPSBUeXBlLm5vdE9rXG5leHBvcnRzLmlzQm9vbGVhbiA9IFR5cGUuaXNCb29sZWFuXG5leHBvcnRzLm5vdEJvb2xlYW4gPSBUeXBlLm5vdEJvb2xlYW5cbmV4cG9ydHMuaXNGdW5jdGlvbiA9IFR5cGUuaXNGdW5jdGlvblxuZXhwb3J0cy5ub3RGdW5jdGlvbiA9IFR5cGUubm90RnVuY3Rpb25cbmV4cG9ydHMuaXNOdW1iZXIgPSBUeXBlLmlzTnVtYmVyXG5leHBvcnRzLm5vdE51bWJlciA9IFR5cGUubm90TnVtYmVyXG5leHBvcnRzLmlzT2JqZWN0ID0gVHlwZS5pc09iamVjdFxuZXhwb3J0cy5ub3RPYmplY3QgPSBUeXBlLm5vdE9iamVjdFxuZXhwb3J0cy5pc1N0cmluZyA9IFR5cGUuaXNTdHJpbmdcbmV4cG9ydHMubm90U3RyaW5nID0gVHlwZS5ub3RTdHJpbmdcbmV4cG9ydHMuaXNTeW1ib2wgPSBUeXBlLmlzU3ltYm9sXG5leHBvcnRzLm5vdFN5bWJvbCA9IFR5cGUubm90U3ltYm9sXG5leHBvcnRzLmV4aXN0cyA9IFR5cGUuZXhpc3RzXG5leHBvcnRzLm5vdEV4aXN0cyA9IFR5cGUubm90RXhpc3RzXG5leHBvcnRzLmlzQXJyYXkgPSBUeXBlLmlzQXJyYXlcbmV4cG9ydHMubm90QXJyYXkgPSBUeXBlLm5vdEFycmF5XG5leHBvcnRzLmlzID0gVHlwZS5pc1xuZXhwb3J0cy5ub3QgPSBUeXBlLm5vdFxuXG5leHBvcnRzLmVxdWFsID0gRXF1YWwuZXF1YWxcbmV4cG9ydHMubm90RXF1YWwgPSBFcXVhbC5ub3RFcXVhbFxuZXhwb3J0cy5lcXVhbExvb3NlID0gRXF1YWwuZXF1YWxMb29zZVxuZXhwb3J0cy5ub3RFcXVhbExvb3NlID0gRXF1YWwubm90RXF1YWxMb29zZVxuZXhwb3J0cy5kZWVwRXF1YWwgPSBFcXVhbC5kZWVwRXF1YWxcbmV4cG9ydHMubm90RGVlcEVxdWFsID0gRXF1YWwubm90RGVlcEVxdWFsXG5leHBvcnRzLm1hdGNoID0gRXF1YWwubWF0Y2hcbmV4cG9ydHMubm90TWF0Y2ggPSBFcXVhbC5ub3RNYXRjaFxuZXhwb3J0cy5hdExlYXN0ID0gRXF1YWwuYXRMZWFzdFxuZXhwb3J0cy5hdE1vc3QgPSBFcXVhbC5hdE1vc3RcbmV4cG9ydHMuYWJvdmUgPSBFcXVhbC5hYm92ZVxuZXhwb3J0cy5iZWxvdyA9IEVxdWFsLmJlbG93XG5leHBvcnRzLmJldHdlZW4gPSBFcXVhbC5iZXR3ZWVuXG5leHBvcnRzLmNsb3NlVG8gPSBFcXVhbC5jbG9zZVRvXG5leHBvcnRzLm5vdENsb3NlVG8gPSBFcXVhbC5ub3RDbG9zZVRvXG5cbmV4cG9ydHMudGhyb3dzID0gVGhyb3dzLnRocm93c1xuZXhwb3J0cy50aHJvd3NNYXRjaCA9IFRocm93cy50aHJvd3NNYXRjaFxuXG5leHBvcnRzLmhhc093biA9IEhhcy5oYXNPd25cbmV4cG9ydHMubm90SGFzT3duID0gSGFzLm5vdEhhc093blxuZXhwb3J0cy5oYXNPd25Mb29zZSA9IEhhcy5oYXNPd25Mb29zZVxuZXhwb3J0cy5ub3RIYXNPd25Mb29zZSA9IEhhcy5ub3RIYXNPd25Mb29zZVxuZXhwb3J0cy5oYXNLZXkgPSBIYXMuaGFzS2V5XG5leHBvcnRzLm5vdEhhc0tleSA9IEhhcy5ub3RIYXNLZXlcbmV4cG9ydHMuaGFzS2V5TG9vc2UgPSBIYXMuaGFzS2V5TG9vc2VcbmV4cG9ydHMubm90SGFzS2V5TG9vc2UgPSBIYXMubm90SGFzS2V5TG9vc2VcbmV4cG9ydHMuaGFzID0gSGFzLmhhc1xuZXhwb3J0cy5ub3RIYXMgPSBIYXMubm90SGFzXG5leHBvcnRzLmhhc0xvb3NlID0gSGFzLmhhc0xvb3NlXG5leHBvcnRzLm5vdEhhc0xvb3NlID0gSGFzLm5vdEhhc0xvb3NlXG5cbi8qKlxuICogVGhlcmUncyAyIHNldHMgb2YgMTIgcGVybXV0YXRpb25zIGhlcmUgZm9yIGBpbmNsdWRlc2AgYW5kIGBoYXNLZXlzYCwgaW5zdGVhZFxuICogb2YgTiBzZXRzIG9mIDIgKHdoaWNoIHdvdWxkIGZpdCB0aGUgYGZvb2AvYG5vdEZvb2AgaWRpb20gYmV0dGVyKSwgc28gaXQnc1xuICogZWFzaWVyIHRvIGp1c3QgbWFrZSBhIGNvdXBsZSBzZXBhcmF0ZSBEU0xzIGFuZCB1c2UgdGhhdCB0byBkZWZpbmUgZXZlcnl0aGluZy5cbiAqXG4gKiBIZXJlJ3MgdGhlIHRvcCBsZXZlbDpcbiAqXG4gKiAtIHNoYWxsb3dcbiAqIC0gc3RyaWN0IGRlZXBcbiAqIC0gc3RydWN0dXJhbCBkZWVwXG4gKlxuICogQW5kIHRoZSBzZWNvbmQgbGV2ZWw6XG4gKlxuICogLSBpbmNsdWRlcyBhbGwvbm90IG1pc3Npbmcgc29tZVxuICogLSBpbmNsdWRlcyBzb21lL25vdCBtaXNzaW5nIGFsbFxuICogLSBub3QgaW5jbHVkaW5nIGFsbC9taXNzaW5nIHNvbWVcbiAqIC0gbm90IGluY2x1ZGluZyBzb21lL21pc3NpbmcgYWxsXG4gKlxuICogSGVyZSdzIGFuIGV4YW1wbGUgdXNpbmcgdGhlIG5hbWluZyBzY2hlbWUgZm9yIGBoYXNLZXlzKmBcbiAqXG4gKiAgICAgICAgICAgICAgIHwgICAgIHNoYWxsb3cgICAgIHwgICAgc3RyaWN0IGRlZXAgICAgICB8ICAgc3RydWN0dXJhbCBkZWVwXG4gKiAtLS0tLS0tLS0tLS0tLXwtLS0tLS0tLS0tLS0tLS0tLXwtLS0tLS0tLS0tLS0tLS0tLS0tLS18LS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICogaW5jbHVkZXMgYWxsICB8IGBoYXNLZXlzYCAgICAgICB8IGBoYXNLZXlzRGVlcGAgICAgICAgfCBgaGFzS2V5c01hdGNoYFxuICogaW5jbHVkZXMgc29tZSB8IGBoYXNLZXlzQW55YCAgICB8IGBoYXNLZXlzQW55RGVlcGAgICAgfCBgaGFzS2V5c0FueU1hdGNoYFxuICogbWlzc2luZyBzb21lICB8IGBub3RIYXNLZXlzQWxsYCB8IGBub3RIYXNLZXlzQWxsRGVlcGAgfCBgbm90SGFzS2V5c0FsbE1hdGNoYFxuICogbWlzc2luZyBhbGwgICB8IGBub3RIYXNLZXlzYCAgICB8IGBub3RIYXNLZXlzRGVlcGAgICAgfCBgbm90SGFzS2V5c01hdGNoYFxuICpcbiAqIE5vdGUgdGhhdCB0aGUgYGhhc0tleXNgIHNoYWxsb3cgY29tcGFyaXNvbiB2YXJpYW50cyBhcmUgYWxzbyBvdmVybG9hZGVkIHRvXG4gKiBjb25zdW1lIGVpdGhlciBhbiBhcnJheSAoaW4gd2hpY2ggaXQgc2ltcGx5IGNoZWNrcyBhZ2FpbnN0IGEgbGlzdCBvZiBrZXlzKSBvclxuICogYW4gb2JqZWN0ICh3aGVyZSBpdCBkb2VzIGEgZnVsbCBkZWVwIGNvbXBhcmlzb24pLlxuICovXG5cbmV4cG9ydHMuaW5jbHVkZXMgPSBJbmNsdWRlcy5pbmNsdWRlc1xuZXhwb3J0cy5pbmNsdWRlc0RlZXAgPSBJbmNsdWRlcy5pbmNsdWRlc0RlZXBcbmV4cG9ydHMuaW5jbHVkZXNNYXRjaCA9IEluY2x1ZGVzLmluY2x1ZGVzTWF0Y2hcbmV4cG9ydHMuaW5jbHVkZXNBbnkgPSBJbmNsdWRlcy5pbmNsdWRlc0FueVxuZXhwb3J0cy5pbmNsdWRlc0FueURlZXAgPSBJbmNsdWRlcy5pbmNsdWRlc0FueURlZXBcbmV4cG9ydHMuaW5jbHVkZXNBbnlNYXRjaCA9IEluY2x1ZGVzLmluY2x1ZGVzQW55TWF0Y2hcbmV4cG9ydHMubm90SW5jbHVkZXNBbGwgPSBJbmNsdWRlcy5ub3RJbmNsdWRlc0FsbFxuZXhwb3J0cy5ub3RJbmNsdWRlc0FsbERlZXAgPSBJbmNsdWRlcy5ub3RJbmNsdWRlc0FsbERlZXBcbmV4cG9ydHMubm90SW5jbHVkZXNBbGxNYXRjaCA9IEluY2x1ZGVzLm5vdEluY2x1ZGVzQWxsTWF0Y2hcbmV4cG9ydHMubm90SW5jbHVkZXMgPSBJbmNsdWRlcy5ub3RJbmNsdWRlc1xuZXhwb3J0cy5ub3RJbmNsdWRlc0RlZXAgPSBJbmNsdWRlcy5ub3RJbmNsdWRlc0RlZXBcbmV4cG9ydHMubm90SW5jbHVkZXNNYXRjaCA9IEluY2x1ZGVzLm5vdEluY2x1ZGVzTWF0Y2hcblxuZXhwb3J0cy5oYXNLZXlzID0gSGFzS2V5cy5oYXNLZXlzXG5leHBvcnRzLmhhc0tleXNEZWVwID0gSGFzS2V5cy5oYXNLZXlzRGVlcFxuZXhwb3J0cy5oYXNLZXlzTWF0Y2ggPSBIYXNLZXlzLmhhc0tleXNNYXRjaFxuZXhwb3J0cy5oYXNLZXlzQW55ID0gSGFzS2V5cy5oYXNLZXlzQW55XG5leHBvcnRzLmhhc0tleXNBbnlEZWVwID0gSGFzS2V5cy5oYXNLZXlzQW55RGVlcFxuZXhwb3J0cy5oYXNLZXlzQW55TWF0Y2ggPSBIYXNLZXlzLmhhc0tleXNBbnlNYXRjaFxuZXhwb3J0cy5ub3RIYXNLZXlzQWxsID0gSGFzS2V5cy5ub3RIYXNLZXlzQWxsXG5leHBvcnRzLm5vdEhhc0tleXNBbGxEZWVwID0gSGFzS2V5cy5ub3RIYXNLZXlzQWxsRGVlcFxuZXhwb3J0cy5ub3RIYXNLZXlzQWxsTWF0Y2ggPSBIYXNLZXlzLm5vdEhhc0tleXNBbGxNYXRjaFxuZXhwb3J0cy5ub3RIYXNLZXlzID0gSGFzS2V5cy5ub3RIYXNLZXlzXG5leHBvcnRzLm5vdEhhc0tleXNEZWVwID0gSGFzS2V5cy5ub3RIYXNLZXlzRGVlcFxuZXhwb3J0cy5ub3RIYXNLZXlzTWF0Y2ggPSBIYXNLZXlzLm5vdEhhc0tleXNNYXRjaFxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxuLyoqXG4gKiBDb3JlIFRERC1zdHlsZSBhc3NlcnRpb25zLiBUaGVzZSBhcmUgZG9uZSBieSBhIGNvbXBvc2l0aW9uIG9mIERTTHMsIHNpbmNlXG4gKiB0aGVyZSBpcyAqc28qIG11Y2ggcmVwZXRpdGlvbi5cbiAqL1xuXG52YXIgbWF0Y2ggPSByZXF1aXJlKFwiLi9tYXRjaFwiKVxudmFyIGRlcHJlY2F0ZSA9IHJlcXVpcmUoXCIuL21pZ3JhdGUvY29tbW9uXCIpLmRlcHJlY2F0ZVxuXG52YXIgdG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nXG52YXIgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eVxuXG4vKiBlc2xpbnQtZGlzYWJsZSBuby1zZWxmLWNvbXBhcmUgKi9cbi8vIEZvciBiZXR0ZXIgTmFOIGhhbmRsaW5nXG5mdW5jdGlvbiBzdHJpY3RJcyhhLCBiKSB7XG4gICAgcmV0dXJuIGEgPT09IGIgfHwgYSAhPT0gYSAmJiBiICE9PSBiXG59XG5cbmZ1bmN0aW9uIGxvb3NlSXMoYSwgYikge1xuICAgIHJldHVybiBhID09IGIgfHwgYSAhPT0gYSAmJiBiICE9PSBiIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgZXFlcWVxXG59XG5cbi8qIGVzbGludC1lbmFibGUgbm8tc2VsZi1jb21wYXJlICovXG5cbnZhciBjaGVjayA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gcHJlZml4KHR5cGUpIHtcbiAgICAgICAgcmV0dXJuICgvXlthZWlvdV0vLnRlc3QodHlwZSkgPyBcImFuIFwiIDogXCJhIFwiKSArIHR5cGVcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjaGVjayh2YWx1ZSwgdHlwZSkge1xuICAgICAgICBpZiAodHlwZSA9PT0gXCJhcnJheVwiKSByZXR1cm4gQXJyYXkuaXNBcnJheSh2YWx1ZSlcbiAgICAgICAgaWYgKHR5cGUgPT09IFwicmVnZXhwXCIpIHJldHVybiB0b1N0cmluZy5jYWxsKHZhbHVlKSA9PT0gXCJbb2JqZWN0IFJlZ0V4cF1cIlxuICAgICAgICBpZiAodHlwZSA9PT0gXCJvYmplY3RcIikgcmV0dXJuIHZhbHVlICE9IG51bGwgJiYgdHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiXG4gICAgICAgIGlmICh0eXBlID09PSBcIm51bGxcIikgcmV0dXJuIHZhbHVlID09PSBudWxsXG4gICAgICAgIGlmICh0eXBlID09PSBcIm5vbmVcIikgcmV0dXJuIHZhbHVlID09IG51bGxcbiAgICAgICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gdHlwZVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNoZWNrTGlzdCh2YWx1ZSwgdHlwZXMpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0eXBlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKGNoZWNrKHZhbHVlLCB0eXBlc1tpXSkpIHJldHVybiB0cnVlXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjaGVja1NpbmdsZSh2YWx1ZSwgbmFtZSwgdHlwZSkge1xuICAgICAgICBpZiAoIWNoZWNrKHZhbHVlLCB0eXBlKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBcIiArIG5hbWUgKyBcImAgbXVzdCBiZSBcIiArIHByZWZpeCh0eXBlKSlcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNoZWNrTWFueSh2YWx1ZSwgbmFtZSwgdHlwZXMpIHtcbiAgICAgICAgaWYgKCFjaGVja0xpc3QodmFsdWUsIHR5cGVzKSkge1xuICAgICAgICAgICAgdmFyIHN0ciA9IFwiYFwiICsgbmFtZSArIFwiYCBtdXN0IGJlIGVpdGhlclwiXG5cbiAgICAgICAgICAgIGlmICh0eXBlcy5sZW5ndGggPT09IDIpIHtcbiAgICAgICAgICAgICAgICBzdHIgKz0gcHJlZml4KHR5cGVzWzBdKSArIFwiIG9yIFwiICsgcHJlZml4KHR5cGVzWzFdKVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzdHIgKz0gcHJlZml4KHR5cGVzWzBdKVxuXG4gICAgICAgICAgICAgICAgdmFyIGVuZCA9IHR5cGVzLmxlbmd0aCAtIDFcblxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgZW5kOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgc3RyICs9IFwiLCBcIiArIHByZWZpeCh0eXBlc1tpXSlcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBzdHIgKz0gXCIsIG9yIFwiICsgcHJlZml4KHR5cGVzW2VuZF0pXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3Ioc3RyKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSwgbmFtZSwgdHlwZSkge1xuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkodHlwZSkpIHJldHVybiBjaGVja1NpbmdsZSh2YWx1ZSwgbmFtZSwgdHlwZSlcbiAgICAgICAgaWYgKHR5cGUubGVuZ3RoID09PSAxKSByZXR1cm4gY2hlY2tTaW5nbGUodmFsdWUsIG5hbWUsIHR5cGVbMF0pXG4gICAgICAgIHJldHVybiBjaGVja01hbnkodmFsdWUsIG5hbWUsIHR5cGUpXG4gICAgfVxufSkoKVxuXG5mdW5jdGlvbiBjaGVja1R5cGVPZih2YWx1ZSwgbmFtZSkge1xuICAgIGlmICh2YWx1ZSA9PT0gXCJib29sZWFuXCIgfHwgdmFsdWUgPT09IFwiZnVuY3Rpb25cIikgcmV0dXJuXG4gICAgaWYgKHZhbHVlID09PSBcIm51bWJlclwiIHx8IHZhbHVlID09PSBcIm9iamVjdFwiIHx8IHZhbHVlID09PSBcInN0cmluZ1wiKSByZXR1cm5cbiAgICBpZiAodmFsdWUgPT09IFwic3ltYm9sXCIgfHwgdmFsdWUgPT09IFwidW5kZWZpbmVkXCIpIHJldHVyblxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJgXCIgKyBuYW1lICsgXCJgIG11c3QgYmUgYSB2YWxpZCBgdHlwZW9mYCB2YWx1ZVwiKVxufVxuXG4vLyBUaGlzIGhvbGRzIGV2ZXJ5dGhpbmcgdG8gYmUgYWRkZWQuXG52YXIgbWV0aG9kcyA9IFtdXG52YXIgYWxpYXNlcyA9IFtdXG5cbmZ1bmN0aW9uIGdldEFzc2VydGlvbkRlcHJlY2F0aW9uKG5hbWUpIHtcbiAgICB2YXIgcmVwbGFjZW1lbnQgPSBuYW1lXG5cbiAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICBjYXNlIFwiYm9vbGVhblwiOiByZXBsYWNlbWVudCA9IFwiaXNCb29sZWFuXCI7IGJyZWFrXG4gICAgY2FzZSBcImZ1bmN0aW9uXCI6IHJlcGxhY2VtZW50ID0gXCJpc0Z1bmN0aW9uXCI7IGJyZWFrXG4gICAgY2FzZSBcIm51bWJlclwiOiByZXBsYWNlbWVudCA9IFwiaXNOdW1iZXJcIjsgYnJlYWtcbiAgICBjYXNlIFwib2JqZWN0XCI6IHJlcGxhY2VtZW50ID0gXCJpc09iamVjdFwiOyBicmVha1xuICAgIGNhc2UgXCJzdHJpbmdcIjogcmVwbGFjZW1lbnQgPSBcImlzU3RyaW5nXCI7IGJyZWFrXG4gICAgY2FzZSBcInN5bWJvbFwiOiByZXBsYWNlbWVudCA9IFwiaXNTeW1ib2xcIjsgYnJlYWtcbiAgICBjYXNlIFwiaW5zdGFuY2VvZlwiOiByZXBsYWNlbWVudCA9IFwiaXNcIjsgYnJlYWtcbiAgICBjYXNlIFwibm90SW5zdGFuY2VvZlwiOiByZXBsYWNlbWVudCA9IFwibm90XCI7IGJyZWFrXG4gICAgY2FzZSBcImhhc0xlbmd0aFwiOiByZXBsYWNlbWVudCA9IFwiZXF1YWxcIjsgYnJlYWtcbiAgICBjYXNlIFwibm90TGVuZ3RoXCI6IHJlcGxhY2VtZW50ID0gXCJub3RFcXVhbFwiOyBicmVha1xuICAgIGNhc2UgXCJsZW5ndGhBdExlYXN0XCI6IHJlcGxhY2VtZW50ID0gXCJhdExlYXN0XCI7IGJyZWFrXG4gICAgY2FzZSBcImxlbmd0aEF0TW9zdFwiOiByZXBsYWNlbWVudCA9IFwiYXRNb3N0XCI7IGJyZWFrXG4gICAgY2FzZSBcImxlbmd0aEFib3ZlXCI6IHJlcGxhY2VtZW50ID0gXCJhYm92ZVwiOyBicmVha1xuICAgIGNhc2UgXCJsZW5ndGhCZWxvd1wiOiByZXBsYWNlbWVudCA9IFwiYmVsb3dcIjsgYnJlYWtcbiAgICBjYXNlIFwibm90SW5jbHVkZXNBbGxcIjogcmVwbGFjZW1lbnQgPSBcIm5vdEluY2x1ZGVzQWxsXCI7IGJyZWFrXG4gICAgY2FzZSBcIm5vdEluY2x1ZGVzTG9vc2VBbGxcIjogcmVwbGFjZW1lbnQgPSBcIm5vdEluY2x1ZGVzQWxsXCI7IGJyZWFrXG4gICAgY2FzZSBcIm5vdEluY2x1ZGVzRGVlcEFsbFwiOiByZXBsYWNlbWVudCA9IFwibm90SW5jbHVkZXNBbGxEZWVwXCI7IGJyZWFrXG4gICAgY2FzZSBcIm5vdEluY2x1ZGVzTWF0Y2hBbGxcIjogcmVwbGFjZW1lbnQgPSBcIm5vdEluY2x1ZGVzQWxsTWF0Y2hcIjsgYnJlYWtcbiAgICBjYXNlIFwiaW5jbHVkZXNBbnlcIjogcmVwbGFjZW1lbnQgPSBcImluY2x1ZGVzQW55XCI7IGJyZWFrXG4gICAgY2FzZSBcImluY2x1ZGVzTG9vc2VBbnlcIjogcmVwbGFjZW1lbnQgPSBcImluY2x1ZGVzQW55XCI7IGJyZWFrXG4gICAgY2FzZSBcImluY2x1ZGVzRGVlcEFueVwiOiByZXBsYWNlbWVudCA9IFwiaW5jbHVkZXNBbnlEZWVwXCI7IGJyZWFrXG4gICAgY2FzZSBcImluY2x1ZGVzTWF0Y2hBbnlcIjogcmVwbGFjZW1lbnQgPSBcImluY2x1ZGVzQW55TWF0Y2hcIjsgYnJlYWtcbiAgICBjYXNlIFwidW5kZWZpbmVkXCI6XG4gICAgICAgIHJldHVybiBcImB0LnVuZGVmaW5lZCgpYCBpcyBkZXByZWNhdGVkLiBVc2UgXCIgK1xuICAgICAgICAgICAgXCJgYXNzZXJ0LmVxdWFsKHVuZGVmaW5lZCwgdmFsdWUpYC4gZnJvbSBgdGhhbGxpdW0vYXNzZXJ0YCBpbnN0ZWFkLlwiXG4gICAgY2FzZSBcInR5cGVcIjpcbiAgICAgICAgcmV0dXJuIFwiYHQudHlwZSgpYCBpcyBkZXByZWNhdGVkLiBVc2UgYGFzc2VydC5pc0Jvb2xlYW4oKWAvZXRjLiBmcm9tIFwiICtcbiAgICAgICAgICAgIFwiYHRoYWxsaXVtL2Fzc2VydGAgaW5zdGVhZC5cIlxuICAgIGRlZmF1bHQ6IC8vIGlnbm9yZVxuICAgIH1cblxuICAgIHJldHVybiBcImB0LlwiICsgbmFtZSArIFwiKClgIGlzIGRlcHJlY2F0ZWQuIFVzZSBgYXNzZXJ0LlwiICsgcmVwbGFjZW1lbnQgK1xuICAgICAgICBcIigpYCBmcm9tIGB0aGFsbGl1bS9hc3NlcnRgIGluc3RlYWQuXCJcbn1cblxuLyoqXG4gKiBUaGUgY29yZSBhc3NlcnRpb25zIGV4cG9ydCwgYXMgYSBwbHVnaW4uXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHQpIHtcbiAgICBtZXRob2RzLmZvckVhY2goZnVuY3Rpb24gKG0pIHtcbiAgICAgICAgdC5kZWZpbmUobS5uYW1lLCBkZXByZWNhdGUoZ2V0QXNzZXJ0aW9uRGVwcmVjYXRpb24obS5uYW1lKSwgbS5jYWxsYmFjaykpXG4gICAgfSlcbiAgICBhbGlhc2VzLmZvckVhY2goZnVuY3Rpb24gKGFsaWFzKSB7IHRbYWxpYXMubmFtZV0gPSB0W2FsaWFzLm9yaWdpbmFsXSB9KVxufVxuXG4vLyBMaXR0bGUgaGVscGVycyBzbyB0aGF0IHRoZXNlIGZ1bmN0aW9ucyBvbmx5IG5lZWQgdG8gYmUgY3JlYXRlZCBvbmNlLlxuZnVuY3Rpb24gZGVmaW5lKG5hbWUsIGNhbGxiYWNrKSB7XG4gICAgY2hlY2sobmFtZSwgXCJuYW1lXCIsIFwic3RyaW5nXCIpXG4gICAgY2hlY2soY2FsbGJhY2ssIFwiY2FsbGJhY2tcIiwgXCJmdW5jdGlvblwiKVxuICAgIG1ldGhvZHMucHVzaCh7bmFtZTogbmFtZSwgY2FsbGJhY2s6IGNhbGxiYWNrfSlcbn1cblxuLy8gTXVjaCBlYXNpZXIgdG8gdHlwZVxuZnVuY3Rpb24gbmVnYXRlKG5hbWUpIHtcbiAgICBjaGVjayhuYW1lLCBcIm5hbWVcIiwgXCJzdHJpbmdcIilcbiAgICByZXR1cm4gXCJub3RcIiArIG5hbWVbMF0udG9VcHBlckNhc2UoKSArIG5hbWUuc2xpY2UoMSlcbn1cblxuLy8gVGhlIGJhc2ljIGFzc2VydC4gSXQncyBhbG1vc3QgdGhlcmUgZm9yIGxvb2tzLCBnaXZlbiBob3cgZWFzeSBpdCBpcyB0b1xuLy8gZGVmaW5lIHlvdXIgb3duIGFzc2VydGlvbnMuXG5mdW5jdGlvbiBzYW5pdGl6ZShtZXNzYWdlKSB7XG4gICAgcmV0dXJuIG1lc3NhZ2UgPyBTdHJpbmcobWVzc2FnZSkucmVwbGFjZSgvKFxce1xcdytcXH0pL2csIFwiXFxcXCQxXCIpIDogXCJcIlxufVxuXG5kZWZpbmUoXCJhc3NlcnRcIiwgZnVuY3Rpb24gKHRlc3QsIG1lc3NhZ2UpIHtcbiAgICByZXR1cm4ge3Rlc3Q6IHRlc3QsIG1lc3NhZ2U6IHNhbml0aXplKG1lc3NhZ2UpfVxufSlcblxuZGVmaW5lKFwiZmFpbFwiLCBmdW5jdGlvbiAobWVzc2FnZSkge1xuICAgIHJldHVybiB7dGVzdDogZmFsc2UsIG1lc3NhZ2U6IHNhbml0aXplKG1lc3NhZ2UpfVxufSlcblxuLyoqXG4gKiBUaGVzZSBtYWtlcyBtYW55IG9mIHRoZSBjb21tb24gb3BlcmF0b3JzIG11Y2ggZWFzaWVyIHRvIGRvLlxuICovXG5mdW5jdGlvbiB1bmFyeShuYW1lLCBmdW5jLCBtZXNzYWdlcykge1xuICAgIGRlZmluZShuYW1lLCBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHRlc3Q6IGZ1bmModmFsdWUpLFxuICAgICAgICAgICAgYWN0dWFsOiB2YWx1ZSxcbiAgICAgICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2VzWzBdLFxuICAgICAgICB9XG4gICAgfSlcblxuICAgIGRlZmluZShuZWdhdGUobmFtZSksIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdGVzdDogIWZ1bmModmFsdWUpLFxuICAgICAgICAgICAgYWN0dWFsOiB2YWx1ZSxcbiAgICAgICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2VzWzFdLFxuICAgICAgICB9XG4gICAgfSlcbn1cblxuZnVuY3Rpb24gYmluYXJ5KG5hbWUsIGZ1bmMsIG1lc3NhZ2VzKSB7XG4gICAgZGVmaW5lKG5hbWUsIGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0ZXN0OiBmdW5jKGFjdHVhbCwgZXhwZWN0ZWQpLFxuICAgICAgICAgICAgYWN0dWFsOiBhY3R1YWwsXG4gICAgICAgICAgICBleHBlY3RlZDogZXhwZWN0ZWQsXG4gICAgICAgICAgICBtZXNzYWdlOiBtZXNzYWdlc1swXSxcbiAgICAgICAgfVxuICAgIH0pXG5cbiAgICBkZWZpbmUobmVnYXRlKG5hbWUpLCBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdGVzdDogIWZ1bmMoYWN0dWFsLCBleHBlY3RlZCksXG4gICAgICAgICAgICBhY3R1YWw6IGFjdHVhbCxcbiAgICAgICAgICAgIGV4cGVjdGVkOiBleHBlY3RlZCxcbiAgICAgICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2VzWzFdLFxuICAgICAgICB9XG4gICAgfSlcbn1cblxudW5hcnkoXCJva1wiLCBmdW5jdGlvbiAoeCkgeyByZXR1cm4gISF4IH0sIFtcbiAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGJlIG9rXCIsXG4gICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgYmUgb2tcIixcbl0pXG5cblwiYm9vbGVhbiBmdW5jdGlvbiBudW1iZXIgb2JqZWN0IHN0cmluZyBzeW1ib2xcIi5zcGxpdChcIiBcIilcbi5mb3JFYWNoKGZ1bmN0aW9uICh0eXBlKSB7XG4gICAgdmFyIG5hbWUgPSAodHlwZVswXSA9PT0gXCJvXCIgPyBcImFuIFwiIDogXCJhIFwiKSArIHR5cGVcblxuICAgIHVuYXJ5KHR5cGUsIGZ1bmN0aW9uICh4KSB7IHJldHVybiB0eXBlb2YgeCA9PT0gdHlwZSB9LCBbXG4gICAgICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gYmUgXCIgKyBuYW1lLFxuICAgICAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBiZSBcIiArIG5hbWUsXG4gICAgXSlcbn0pXG5cbjtbdHJ1ZSwgZmFsc2UsIG51bGwsIHVuZGVmaW5lZF0uZm9yRWFjaChmdW5jdGlvbiAodmFsdWUpIHtcbiAgICB1bmFyeSh2YWx1ZSArIFwiXCIsIGZ1bmN0aW9uICh4KSB7IHJldHVybiB4ID09PSB2YWx1ZSB9LCBbXG4gICAgICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gYmUgXCIgKyB2YWx1ZSxcbiAgICAgICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgYmUgXCIgKyB2YWx1ZSxcbiAgICBdKVxufSlcblxudW5hcnkoXCJleGlzdHNcIiwgZnVuY3Rpb24gKHgpIHsgcmV0dXJuIHggIT0gbnVsbCB9LCBbXG4gICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBleGlzdFwiLFxuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGV4aXN0XCIsXG5dKVxuXG51bmFyeShcImFycmF5XCIsIEFycmF5LmlzQXJyYXksIFtcbiAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGJlIGFuIGFycmF5XCIsXG4gICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgYmUgYW4gYXJyYXlcIixcbl0pXG5cbmRlZmluZShcInR5cGVcIiwgZnVuY3Rpb24gKG9iamVjdCwgdHlwZSkge1xuICAgIGNoZWNrVHlwZU9mKHR5cGUsIFwidHlwZVwiKVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgdGVzdDogdHlwZW9mIG9iamVjdCA9PT0gdHlwZSxcbiAgICAgICAgZXhwZWN0ZWQ6IHR5cGUsXG4gICAgICAgIGFjdHVhbDogdHlwZW9mIG9iamVjdCxcbiAgICAgICAgbzogb2JqZWN0LFxuICAgICAgICBtZXNzYWdlOiBcIkV4cGVjdGVkIHR5cGVvZiB7b30gdG8gYmUge2V4cGVjdGVkfSwgYnV0IGZvdW5kIHthY3R1YWx9XCIsXG4gICAgfVxufSlcblxuZGVmaW5lKFwibm90VHlwZVwiLCBmdW5jdGlvbiAob2JqZWN0LCB0eXBlKSB7XG4gICAgY2hlY2tUeXBlT2YodHlwZSwgXCJ0eXBlXCIpXG5cbiAgICByZXR1cm4ge1xuICAgICAgICB0ZXN0OiB0eXBlb2Ygb2JqZWN0ICE9PSB0eXBlLFxuICAgICAgICBleHBlY3RlZDogdHlwZSxcbiAgICAgICAgbzogb2JqZWN0LFxuICAgICAgICBtZXNzYWdlOiBcIkV4cGVjdGVkIHR5cGVvZiB7b30gdG8gbm90IGJlIHtleHBlY3RlZH1cIixcbiAgICB9XG59KVxuXG5kZWZpbmUoXCJpbnN0YW5jZW9mXCIsIGZ1bmN0aW9uIChvYmplY3QsIFR5cGUpIHtcbiAgICBjaGVjayhUeXBlLCBcIlR5cGVcIiwgXCJmdW5jdGlvblwiKVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgdGVzdDogb2JqZWN0IGluc3RhbmNlb2YgVHlwZSxcbiAgICAgICAgZXhwZWN0ZWQ6IFR5cGUsXG4gICAgICAgIGFjdHVhbDogb2JqZWN0LmNvbnN0cnVjdG9yLFxuICAgICAgICBvOiBvYmplY3QsXG4gICAgICAgIG1lc3NhZ2U6IFwiRXhwZWN0ZWQge299IHRvIGJlIGFuIGluc3RhbmNlIG9mIHtleHBlY3RlZH0sIGJ1dCBmb3VuZCB7YWN0dWFsfVwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1sZW5cbiAgICB9XG59KVxuXG5kZWZpbmUoXCJub3RJbnN0YW5jZW9mXCIsIGZ1bmN0aW9uIChvYmplY3QsIFR5cGUpIHtcbiAgICBjaGVjayhUeXBlLCBcIlR5cGVcIiwgXCJmdW5jdGlvblwiKVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgdGVzdDogIShvYmplY3QgaW5zdGFuY2VvZiBUeXBlKSxcbiAgICAgICAgZXhwZWN0ZWQ6IFR5cGUsXG4gICAgICAgIG86IG9iamVjdCxcbiAgICAgICAgbWVzc2FnZTogXCJFeHBlY3RlZCB7b30gdG8gbm90IGJlIGFuIGluc3RhbmNlIG9mIHtleHBlY3RlZH1cIixcbiAgICB9XG59KVxuXG5iaW5hcnkoXCJlcXVhbFwiLCBzdHJpY3RJcywgW1xuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gZXF1YWwge2V4cGVjdGVkfVwiLFxuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGVxdWFsIHtleHBlY3RlZH1cIixcbl0pXG5cbmJpbmFyeShcImVxdWFsTG9vc2VcIiwgbG9vc2VJcywgW1xuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbG9vc2VseSBlcXVhbCB7ZXhwZWN0ZWR9XCIsXG4gICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgbG9vc2VseSBlcXVhbCB7ZXhwZWN0ZWR9XCIsXG5dKVxuXG5mdW5jdGlvbiBjb21wKG5hbWUsIGNvbXBhcmUsIG1lc3NhZ2UpIHtcbiAgICBkZWZpbmUobmFtZSwgZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgICAgICAgY2hlY2soYWN0dWFsLCBcImFjdHVhbFwiLCBcIm51bWJlclwiKVxuICAgICAgICBjaGVjayhleHBlY3RlZCwgXCJleHBlY3RlZFwiLCBcIm51bWJlclwiKVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0ZXN0OiBjb21wYXJlKGFjdHVhbCwgZXhwZWN0ZWQpLFxuICAgICAgICAgICAgYWN0dWFsOiBhY3R1YWwsXG4gICAgICAgICAgICBleHBlY3RlZDogZXhwZWN0ZWQsXG4gICAgICAgICAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgICAgICB9XG4gICAgfSlcbn1cblxuLyogZXNsaW50LWRpc2FibGUgbWF4LWxlbiAqL1xuXG5jb21wKFwiYXRMZWFzdFwiLCBmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYSA+PSBiIH0sIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gYmUgYXQgbGVhc3Qge2V4cGVjdGVkfVwiKVxuY29tcChcImF0TW9zdFwiLCBmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYSA8PSBiIH0sIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gYmUgYXQgbW9zdCB7ZXhwZWN0ZWR9XCIpXG5jb21wKFwiYWJvdmVcIiwgZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGEgPiBiIH0sIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gYmUgYWJvdmUge2V4cGVjdGVkfVwiKVxuY29tcChcImJlbG93XCIsIGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBhIDwgYiB9LCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGJlIGJlbG93IHtleHBlY3RlZH1cIilcblxuZGVmaW5lKFwiYmV0d2VlblwiLCBmdW5jdGlvbiAoYWN0dWFsLCBsb3dlciwgdXBwZXIpIHtcbiAgICBjaGVjayhhY3R1YWwsIFwiYWN0dWFsXCIsIFwibnVtYmVyXCIpXG4gICAgY2hlY2sobG93ZXIsIFwibG93ZXJcIiwgXCJudW1iZXJcIilcbiAgICBjaGVjayh1cHBlciwgXCJ1cHBlclwiLCBcIm51bWJlclwiKVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgdGVzdDogYWN0dWFsID49IGxvd2VyICYmIGFjdHVhbCA8PSB1cHBlcixcbiAgICAgICAgYWN0dWFsOiBhY3R1YWwsXG4gICAgICAgIGxvd2VyOiBsb3dlcixcbiAgICAgICAgdXBwZXI6IHVwcGVyLFxuICAgICAgICBtZXNzYWdlOiBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGJlIGJldHdlZW4ge2xvd2VyfSBhbmQge3VwcGVyfVwiLFxuICAgIH1cbn0pXG5cbi8qIGVzbGludC1lbmFibGUgbWF4LWxlbiAqL1xuXG5iaW5hcnkoXCJkZWVwRXF1YWxcIiwgbWF0Y2guc3RyaWN0LCBbXG4gICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBkZWVwbHkgZXF1YWwge2V4cGVjdGVkfVwiLFxuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGRlZXBseSBlcXVhbCB7ZXhwZWN0ZWR9XCIsXG5dKVxuXG5iaW5hcnkoXCJtYXRjaFwiLCBtYXRjaC5tYXRjaCwgW1xuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbWF0Y2gge2V4cGVjdGVkfVwiLFxuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IG1hdGNoIHtleHBlY3RlZH1cIixcbl0pXG5cbmZ1bmN0aW9uIGhhcyhuYW1lLCBfKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LWxlbiwgbWF4LXBhcmFtc1xuICAgIGlmIChfLmVxdWFscyA9PT0gbG9vc2VJcykge1xuICAgICAgICBkZWZpbmUobmFtZSwgZnVuY3Rpb24gKG9iamVjdCwga2V5LCB2YWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0ZXN0OiBfLmhhcyhvYmplY3QsIGtleSkgJiYgXy5pcyhfLmdldChvYmplY3QsIGtleSksIHZhbHVlKSxcbiAgICAgICAgICAgICAgICBleHBlY3RlZDogdmFsdWUsXG4gICAgICAgICAgICAgICAgYWN0dWFsOiBvYmplY3Rba2V5XSxcbiAgICAgICAgICAgICAgICBrZXk6IGtleSxcbiAgICAgICAgICAgICAgICBvYmplY3Q6IG9iamVjdCxcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBfLm1lc3NhZ2VzWzBdLFxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuXG4gICAgICAgIGRlZmluZShuZWdhdGUobmFtZSksIGZ1bmN0aW9uIChvYmplY3QsIGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdGVzdDogIV8uaGFzKG9iamVjdCwga2V5KSB8fCAhXy5pcyhfLmdldChvYmplY3QsIGtleSksIHZhbHVlKSxcbiAgICAgICAgICAgICAgICBhY3R1YWw6IHZhbHVlLFxuICAgICAgICAgICAgICAgIGtleToga2V5LFxuICAgICAgICAgICAgICAgIG9iamVjdDogb2JqZWN0LFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IF8ubWVzc2FnZXNbMl0sXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfSBlbHNlIHtcbiAgICAgICAgZGVmaW5lKG5hbWUsIGZ1bmN0aW9uIChvYmplY3QsIGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgIHZhciB0ZXN0ID0gXy5oYXMob2JqZWN0LCBrZXkpXG5cbiAgICAgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICB0ZXN0OiB0ZXN0ICYmIF8uaXMoXy5nZXQob2JqZWN0LCBrZXkpLCB2YWx1ZSksXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiB2YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgYWN0dWFsOiBvYmplY3Rba2V5XSxcbiAgICAgICAgICAgICAgICAgICAga2V5OiBrZXksXG4gICAgICAgICAgICAgICAgICAgIG9iamVjdDogb2JqZWN0LFxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBfLm1lc3NhZ2VzWzBdLFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgdGVzdDogdGVzdCxcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IGtleSxcbiAgICAgICAgICAgICAgICAgICAgYWN0dWFsOiBvYmplY3QsXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IF8ubWVzc2FnZXNbMV0sXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuXG4gICAgICAgIGRlZmluZShuZWdhdGUobmFtZSksIGZ1bmN0aW9uIChvYmplY3QsIGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgIHZhciB0ZXN0ID0gIV8uaGFzKG9iamVjdCwga2V5KVxuXG4gICAgICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSAzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgdGVzdDogdGVzdCB8fCAhXy5pcyhfLmdldChvYmplY3QsIGtleSksIHZhbHVlKSxcbiAgICAgICAgICAgICAgICAgICAgYWN0dWFsOiB2YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAga2V5OiBrZXksXG4gICAgICAgICAgICAgICAgICAgIG9iamVjdDogb2JqZWN0LFxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBfLm1lc3NhZ2VzWzJdLFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgdGVzdDogdGVzdCxcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IGtleSxcbiAgICAgICAgICAgICAgICAgICAgYWN0dWFsOiBvYmplY3QsXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IF8ubWVzc2FnZXNbM10sXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH1cbn1cblxuZnVuY3Rpb24gaGFzT3duS2V5KG9iamVjdCwga2V5KSB7IHJldHVybiBoYXNPd24uY2FsbChvYmplY3QsIGtleSkgfVxuZnVuY3Rpb24gaGFzSW5LZXkob2JqZWN0LCBrZXkpIHsgcmV0dXJuIGtleSBpbiBvYmplY3QgfVxuZnVuY3Rpb24gaGFzSW5Db2xsKG9iamVjdCwga2V5KSB7IHJldHVybiBvYmplY3QuaGFzKGtleSkgfVxuZnVuY3Rpb24gaGFzT2JqZWN0R2V0KG9iamVjdCwga2V5KSB7IHJldHVybiBvYmplY3Rba2V5XSB9XG5mdW5jdGlvbiBoYXNDb2xsR2V0KG9iamVjdCwga2V5KSB7IHJldHVybiBvYmplY3QuZ2V0KGtleSkgfVxuXG5oYXMoXCJoYXNPd25cIiwge1xuICAgIGlzOiBzdHJpY3RJcyxcbiAgICBoYXM6IGhhc093bktleSxcbiAgICBnZXQ6IGhhc09iamVjdEdldCxcbiAgICBtZXNzYWdlczogW1xuICAgICAgICBcIkV4cGVjdGVkIHtvYmplY3R9IHRvIGhhdmUgb3duIGtleSB7a2V5fSBlcXVhbCB0byB7ZXhwZWN0ZWR9LCBidXQgZm91bmQge2FjdHVhbH1cIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtbGVuXG4gICAgICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gaGF2ZSBvd24ga2V5IHtleHBlY3RlZH1cIixcbiAgICAgICAgXCJFeHBlY3RlZCB7b2JqZWN0fSB0byBub3QgaGF2ZSBvd24ga2V5IHtrZXl9IGVxdWFsIHRvIHthY3R1YWx9XCIsXG4gICAgICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGhhdmUgb3duIGtleSB7ZXhwZWN0ZWR9XCIsXG4gICAgXSxcbn0pXG5cbmhhcyhcImhhc093bkxvb3NlXCIsIHtcbiAgICBpczogbG9vc2VJcyxcbiAgICBoYXM6IGhhc093bktleSxcbiAgICBnZXQ6IGhhc09iamVjdEdldCxcbiAgICBtZXNzYWdlczogW1xuICAgICAgICBcIkV4cGVjdGVkIHtvYmplY3R9IHRvIGhhdmUgb3duIGtleSB7a2V5fSBsb29zZWx5IGVxdWFsIHRvIHtleHBlY3RlZH0sIGJ1dCBmb3VuZCB7YWN0dWFsfVwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1sZW5cbiAgICAgICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBoYXZlIG93biBrZXkge2V4cGVjdGVkfVwiLFxuICAgICAgICBcIkV4cGVjdGVkIHtvYmplY3R9IHRvIG5vdCBoYXZlIG93biBrZXkge2tleX0gbG9vc2VseSBlcXVhbCB0byB7YWN0dWFsfVwiLFxuICAgICAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBoYXZlIG93biBrZXkge2V4cGVjdGVkfVwiLFxuICAgIF0sXG59KVxuXG5oYXMoXCJoYXNLZXlcIiwge1xuICAgIGlzOiBzdHJpY3RJcyxcbiAgICBoYXM6IGhhc0luS2V5LFxuICAgIGdldDogaGFzT2JqZWN0R2V0LFxuICAgIG1lc3NhZ2VzOiBbXG4gICAgICAgIFwiRXhwZWN0ZWQge29iamVjdH0gdG8gaGF2ZSBrZXkge2tleX0gZXF1YWwgdG8ge2V4cGVjdGVkfSwgYnV0IGZvdW5kIHthY3R1YWx9XCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LWxlblxuICAgICAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGhhdmUga2V5IHtleHBlY3RlZH1cIixcbiAgICAgICAgXCJFeHBlY3RlZCB7b2JqZWN0fSB0byBub3QgaGF2ZSBrZXkge2tleX0gZXF1YWwgdG8ge2FjdHVhbH1cIixcbiAgICAgICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgaGF2ZSBrZXkge2V4cGVjdGVkfVwiLFxuICAgIF0sXG59KVxuXG5oYXMoXCJoYXNLZXlMb29zZVwiLCB7XG4gICAgaXM6IGxvb3NlSXMsXG4gICAgaGFzOiBoYXNJbktleSxcbiAgICBnZXQ6IGhhc09iamVjdEdldCxcbiAgICBtZXNzYWdlczogW1xuICAgICAgICBcIkV4cGVjdGVkIHtvYmplY3R9IHRvIGhhdmUga2V5IHtrZXl9IGxvb3NlbHkgZXF1YWwgdG8ge2V4cGVjdGVkfSwgYnV0IGZvdW5kIHthY3R1YWx9XCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LWxlblxuICAgICAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGhhdmUga2V5IHtleHBlY3RlZH1cIixcbiAgICAgICAgXCJFeHBlY3RlZCB7b2JqZWN0fSB0byBub3QgaGF2ZSBrZXkge2tleX0gbG9vc2VseSBlcXVhbCB0byB7YWN0dWFsfVwiLFxuICAgICAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBoYXZlIGtleSB7ZXhwZWN0ZWR9XCIsXG4gICAgXSxcbn0pXG5cbmhhcyhcImhhc1wiLCB7XG4gICAgaXM6IHN0cmljdElzLFxuICAgIGhhczogaGFzSW5Db2xsLFxuICAgIGdldDogaGFzQ29sbEdldCxcbiAgICBtZXNzYWdlczogW1xuICAgICAgICBcIkV4cGVjdGVkIHtvYmplY3R9IHRvIGhhdmUga2V5IHtrZXl9IGVxdWFsIHRvIHtleHBlY3RlZH0sIGJ1dCBmb3VuZCB7YWN0dWFsfVwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1sZW5cbiAgICAgICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBoYXZlIGtleSB7ZXhwZWN0ZWR9XCIsXG4gICAgICAgIFwiRXhwZWN0ZWQge29iamVjdH0gdG8gbm90IGhhdmUga2V5IHtrZXl9IGVxdWFsIHRvIHthY3R1YWx9XCIsXG4gICAgICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGhhdmUga2V5IHtleHBlY3RlZH1cIixcbiAgICBdLFxufSlcblxuaGFzKFwiaGFzTG9vc2VcIiwge1xuICAgIGlzOiBsb29zZUlzLFxuICAgIGhhczogaGFzSW5Db2xsLFxuICAgIGdldDogaGFzQ29sbEdldCxcbiAgICBtZXNzYWdlczogW1xuICAgICAgICBcIkV4cGVjdGVkIHtvYmplY3R9IHRvIGhhdmUga2V5IHtrZXl9IGVxdWFsIHRvIHtleHBlY3RlZH0sIGJ1dCBmb3VuZCB7YWN0dWFsfVwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1sZW5cbiAgICAgICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBoYXZlIGtleSB7ZXhwZWN0ZWR9XCIsXG4gICAgICAgIFwiRXhwZWN0ZWQge29iamVjdH0gdG8gbm90IGhhdmUga2V5IHtrZXl9IGVxdWFsIHRvIHthY3R1YWx9XCIsXG4gICAgICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGhhdmUga2V5IHtleHBlY3RlZH1cIixcbiAgICBdLFxufSlcblxuZnVuY3Rpb24gZ2V0TmFtZShmdW5jKSB7XG4gICAgaWYgKGZ1bmMubmFtZSAhPSBudWxsKSByZXR1cm4gZnVuYy5uYW1lIHx8IFwiPGFub255bW91cz5cIlxuICAgIGlmIChmdW5jLmRpc3BsYXlOYW1lICE9IG51bGwpIHJldHVybiBmdW5jLmRpc3BsYXlOYW1lIHx8IFwiPGFub255bW91cz5cIlxuICAgIHJldHVybiBcIjxhbm9ueW1vdXM+XCJcbn1cblxuZnVuY3Rpb24gdGhyb3dzKG5hbWUsIF8pIHtcbiAgICBmdW5jdGlvbiBydW4oaW52ZXJ0KSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoZnVuYywgbWF0Y2hlcikge1xuICAgICAgICAgICAgY2hlY2soZnVuYywgXCJmdW5jXCIsIFwiZnVuY3Rpb25cIilcbiAgICAgICAgICAgIF8uY2hlY2sobWF0Y2hlcilcblxuICAgICAgICAgICAgdmFyIHRlc3QsIGVycm9yXG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgZnVuYygpXG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgdGVzdCA9IF8udGVzdChtYXRjaGVyLCBlcnJvciA9IGUpXG5cbiAgICAgICAgICAgICAgICAvLyBSZXRocm93IHVua25vd24gZXJyb3JzIHRoYXQgZG9uJ3QgbWF0Y2ggd2hlbiBhIG1hdGNoZXIgd2FzXG4gICAgICAgICAgICAgICAgLy8gcGFzc2VkIC0gaXQncyBlYXNpZXIgdG8gZGVidWcgdW5leHBlY3RlZCBlcnJvcnMgd2hlbiB5b3UgaGF2ZVxuICAgICAgICAgICAgICAgIC8vIGEgc3RhY2sgdHJhY2UuIERvbid0IHJldGhyb3cgbm9uLWVycm9ycywgdGhvdWdoLlxuICAgICAgICAgICAgICAgIGlmIChfLnJldGhyb3cobWF0Y2hlciwgaW52ZXJ0LCB0ZXN0LCBlKSkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHRlc3Q6ICEhdGVzdCBeIGludmVydCxcbiAgICAgICAgICAgICAgICBleHBlY3RlZDogbWF0Y2hlcixcbiAgICAgICAgICAgICAgICBlcnJvcjogZXJyb3IsXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogXy5tZXNzYWdlKG1hdGNoZXIsIGludmVydCwgdGVzdCksXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBkZWZpbmUobmFtZSwgcnVuKGZhbHNlKSlcbiAgICBkZWZpbmUobmVnYXRlKG5hbWUpLCBydW4odHJ1ZSkpXG59XG5cbnRocm93cyhcInRocm93c1wiLCB7XG4gICAgdGVzdDogZnVuY3Rpb24gKFR5cGUsIGUpIHsgcmV0dXJuIFR5cGUgPT0gbnVsbCB8fCBlIGluc3RhbmNlb2YgVHlwZSB9LFxuICAgIGNoZWNrOiBmdW5jdGlvbiAoVHlwZSkgeyBjaGVjayhUeXBlLCBcIlR5cGVcIiwgW1wibm9uZVwiLCBcImZ1bmN0aW9uXCJdKSB9LFxuXG4gICAgcmV0aHJvdzogZnVuY3Rpb24gKG1hdGNoZXIsIGludmVydCwgdGVzdCwgZSkge1xuICAgICAgICByZXR1cm4gbWF0Y2hlciAhPSBudWxsICYmICFpbnZlcnQgJiYgIXRlc3QgJiYgZSBpbnN0YW5jZW9mIEVycm9yXG4gICAgfSxcblxuICAgIG1lc3NhZ2U6IGZ1bmN0aW9uIChUeXBlLCBpbnZlcnQsIHRlc3QpIHtcbiAgICAgICAgdmFyIHN0ciA9IFwiRXhwZWN0ZWQgY2FsbGJhY2sgdG8gXCJcblxuICAgICAgICBpZiAoaW52ZXJ0KSBzdHIgKz0gXCJub3QgXCJcbiAgICAgICAgc3RyICs9IFwidGhyb3dcIlxuXG4gICAgICAgIGlmIChUeXBlICE9IG51bGwpIHtcbiAgICAgICAgICAgIHN0ciArPSBcIiBhbiBpbnN0YW5jZSBvZiBcIiArIGdldE5hbWUoVHlwZSlcbiAgICAgICAgICAgIGlmICghaW52ZXJ0ICYmIHRlc3QgPT09IGZhbHNlKSBzdHIgKz0gXCIsIGJ1dCBmb3VuZCB7ZXJyb3J9XCJcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzdHJcbiAgICB9LFxufSlcblxudGhyb3dzKFwidGhyb3dzTWF0Y2hcIiwge1xuICAgIHRlc3Q6IGZ1bmN0aW9uIChtYXRjaGVyLCBlKSB7XG4gICAgICAgIGlmICh0eXBlb2YgbWF0Y2hlciA9PT0gXCJzdHJpbmdcIikgcmV0dXJuIGUubWVzc2FnZSA9PT0gbWF0Y2hlclxuICAgICAgICBpZiAodHlwZW9mIG1hdGNoZXIgPT09IFwiZnVuY3Rpb25cIikgcmV0dXJuICEhbWF0Y2hlcihlKVxuICAgICAgICByZXR1cm4gbWF0Y2hlci50ZXN0KGUubWVzc2FnZSlcbiAgICB9LFxuXG4gICAgY2hlY2s6IGZ1bmN0aW9uIChtYXRjaGVyKSB7XG4gICAgICAgIC8vIE5vdCBhY2NlcHRpbmcgb2JqZWN0cyB5ZXQuXG4gICAgICAgIGNoZWNrKG1hdGNoZXIsIFwibWF0Y2hlclwiLCBbXCJzdHJpbmdcIiwgXCJyZWdleHBcIiwgXCJmdW5jdGlvblwiXSlcbiAgICB9LFxuXG4gICAgcmV0aHJvdzogZnVuY3Rpb24gKCkgeyByZXR1cm4gZmFsc2UgfSxcblxuICAgIG1lc3NhZ2U6IGZ1bmN0aW9uIChfLCBpbnZlcnQsIHRlc3QpIHtcbiAgICAgICAgaWYgKGludmVydCkge1xuICAgICAgICAgICAgcmV0dXJuIFwiRXhwZWN0ZWQgY2FsbGJhY2sgdG8gbm90IHRocm93IGFuIGVycm9yIHRoYXQgbWF0Y2hlcyB7ZXhwZWN0ZWR9XCIgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtbGVuXG4gICAgICAgIH0gZWxzZSBpZiAodGVzdCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJFeHBlY3RlZCBjYWxsYmFjayB0byB0aHJvdyBhbiBlcnJvciB0aGF0IG1hdGNoZXMge2V4cGVjdGVkfSwgYnV0IGZvdW5kIG5vIGVycm9yXCIgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtbGVuXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gXCJFeHBlY3RlZCBjYWxsYmFjayB0byB0aHJvdyBhbiBlcnJvciB0aGF0IG1hdGNoZXMge2V4cGVjdGVkfSwgYnV0IGZvdW5kIHtlcnJvcn1cIiAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1sZW5cbiAgICAgICAgfVxuICAgIH0sXG59KVxuXG5mdW5jdGlvbiBsZW4obmFtZSwgY29tcGFyZSwgbWVzc2FnZSkge1xuICAgIGRlZmluZShuYW1lLCBmdW5jdGlvbiAob2JqZWN0LCBsZW5ndGgpIHtcbiAgICAgICAgY2hlY2sob2JqZWN0LCBcIm9iamVjdFwiLCBcIm9iamVjdFwiKVxuICAgICAgICBjaGVjayhsZW5ndGgsIFwibGVuZ3RoXCIsIFwibnVtYmVyXCIpXG5cbiAgICAgICAgdmFyIGxlbiA9IG9iamVjdC5sZW5ndGhcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdGVzdDogbGVuICE9IG51bGwgJiYgY29tcGFyZShsZW4sICtsZW5ndGgpLFxuICAgICAgICAgICAgZXhwZWN0ZWQ6IGxlbmd0aCxcbiAgICAgICAgICAgIGFjdHVhbDogbGVuLFxuICAgICAgICAgICAgb2JqZWN0OiBvYmplY3QsXG4gICAgICAgICAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgICAgICB9XG4gICAgfSlcbn1cblxuLyogZXNsaW50LWRpc2FibGUgbWF4LWxlbiAqL1xuXG4vLyBOb3RlOiB0aGVzZSBhbHdheXMgZmFpbCB3aXRoIE5hTnMuXG5sZW4oXCJsZW5ndGhcIiwgZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGEgPT09IGIgfSwgXCJFeHBlY3RlZCB7b2JqZWN0fSB0byBoYXZlIGxlbmd0aCB7ZXhwZWN0ZWR9LCBidXQgZm91bmQge2FjdHVhbH1cIilcbmxlbihcIm5vdExlbmd0aFwiLCBmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYSAhPT0gYiB9LCBcIkV4cGVjdGVkIHtvYmplY3R9IHRvIG5vdCBoYXZlIGxlbmd0aCB7YWN0dWFsfVwiKVxubGVuKFwibGVuZ3RoQXRMZWFzdFwiLCBmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYSA+PSBiIH0sIFwiRXhwZWN0ZWQge29iamVjdH0gdG8gaGF2ZSBsZW5ndGggYXQgbGVhc3Qge2V4cGVjdGVkfSwgYnV0IGZvdW5kIHthY3R1YWx9XCIpXG5sZW4oXCJsZW5ndGhBdE1vc3RcIiwgZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGEgPD0gYiB9LCBcIkV4cGVjdGVkIHtvYmplY3R9IHRvIGhhdmUgbGVuZ3RoIGF0IG1vc3Qge2V4cGVjdGVkfSwgYnV0IGZvdW5kIHthY3R1YWx9XCIpXG5sZW4oXCJsZW5ndGhBYm92ZVwiLCBmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYSA+IGIgfSwgXCJFeHBlY3RlZCB7b2JqZWN0fSB0byBoYXZlIGxlbmd0aCBhYm92ZSB7ZXhwZWN0ZWR9LCBidXQgZm91bmQge2FjdHVhbH1cIilcbmxlbihcImxlbmd0aEJlbG93XCIsIGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBhIDwgYiB9LCBcIkV4cGVjdGVkIHtvYmplY3R9IHRvIGhhdmUgbGVuZ3RoIGJlbG93IHtleHBlY3RlZH0sIGJ1dCBmb3VuZCB7YWN0dWFsfVwiKVxuXG4vKiBlc2xpbnQtZW5hYmxlIG1heC1sZW4gKi9cblxuLy8gTm90ZTogdGhlc2UgdHdvIGFsd2F5cyBmYWlsIHdoZW4gZGVhbGluZyB3aXRoIE5hTnMuXG5kZWZpbmUoXCJjbG9zZVRvXCIsIGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkLCBkZWx0YSkge1xuICAgIGNoZWNrKGFjdHVhbCwgXCJhY3R1YWxcIiwgXCJudW1iZXJcIilcbiAgICBjaGVjayhleHBlY3RlZCwgXCJleHBlY3RlZFwiLCBcIm51bWJlclwiKVxuICAgIGNoZWNrKGRlbHRhLCBcImRlbHRhXCIsIFwibnVtYmVyXCIpXG5cbiAgICByZXR1cm4ge1xuICAgICAgICB0ZXN0OiBNYXRoLmFicyhhY3R1YWwgLSBleHBlY3RlZCkgPD0gTWF0aC5hYnMoZGVsdGEpLFxuICAgICAgICBhY3R1YWw6IGFjdHVhbCxcbiAgICAgICAgZXhwZWN0ZWQ6IGV4cGVjdGVkLFxuICAgICAgICBkZWx0YTogZGVsdGEsXG4gICAgICAgIG1lc3NhZ2U6IFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gYmUgd2l0aGluIHtkZWx0YX0gb2Yge2V4cGVjdGVkfVwiLFxuICAgIH1cbn0pXG5cbmRlZmluZShcIm5vdENsb3NlVG9cIiwgZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQsIGRlbHRhKSB7XG4gICAgY2hlY2soYWN0dWFsLCBcImFjdHVhbFwiLCBcIm51bWJlclwiKVxuICAgIGNoZWNrKGV4cGVjdGVkLCBcImV4cGVjdGVkXCIsIFwibnVtYmVyXCIpXG4gICAgY2hlY2soZGVsdGEsIFwiZGVsdGFcIiwgXCJudW1iZXJcIilcblxuICAgIHJldHVybiB7XG4gICAgICAgIHRlc3Q6IE1hdGguYWJzKGFjdHVhbCAtIGV4cGVjdGVkKSA+IE1hdGguYWJzKGRlbHRhKSxcbiAgICAgICAgYWN0dWFsOiBhY3R1YWwsXG4gICAgICAgIGV4cGVjdGVkOiBleHBlY3RlZCxcbiAgICAgICAgZGVsdGE6IGRlbHRhLFxuICAgICAgICBtZXNzYWdlOiBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBiZSB3aXRoaW4ge2RlbHRhfSBvZiB7ZXhwZWN0ZWR9XCIsXG4gICAgfVxufSlcblxuLyogZXNsaW50LWRpc2FibGUgbWF4LWxlbiAqL1xuXG4vKipcbiAqIFRoZXJlJ3MgNCBzZXRzIG9mIDQgcGVybXV0YXRpb25zIGhlcmUgZm9yIGBpbmNsdWRlc2AgYW5kIGBoYXNLZXlzYCwgaW5zdGVhZFxuICogb2YgTiBzZXRzIG9mIDIgKHdoaWNoIHdvdWxkIGZpdCB0aGUgYGZvb2AvYG5vdEZvb2AgaWRpb20gYmV0dGVyKSwgc28gaXQnc1xuICogZWFzaWVyIHRvIGp1c3QgbWFrZSBhIGNvdXBsZSBzZXBhcmF0ZSBEU0xzIGFuZCB1c2UgdGhhdCB0byBkZWZpbmUgZXZlcnl0aGluZy5cbiAqXG4gKiBIZXJlJ3MgdGhlIHRvcCBsZXZlbDpcbiAqXG4gKiAtIHN0cmljdCBzaGFsbG93XG4gKiAtIGxvb3NlIHNoYWxsb3dcbiAqIC0gc3RyaWN0IGRlZXBcbiAqIC0gc3RydWN0dXJhbCBkZWVwXG4gKlxuICogQW5kIHRoZSBzZWNvbmQgbGV2ZWw6XG4gKlxuICogLSBpbmNsdWRlcyBhbGwvbm90IG1pc3Npbmcgc29tZVxuICogLSBpbmNsdWRlcyBzb21lL25vdCBtaXNzaW5nIGFsbFxuICogLSBub3QgaW5jbHVkaW5nIGFsbC9taXNzaW5nIHNvbWVcbiAqIC0gbm90IGluY2x1ZGluZyBzb21lL21pc3NpbmcgYWxsXG4gKlxuICogSGVyZSdzIGFuIGV4YW1wbGUgdXNpbmcgdGhlIG5hbWluZyBzY2hlbWUgZm9yIGBoYXNLZXlzYCwgZXRjLlxuICpcbiAqICAgICAgICAgICAgICAgfCBzdHJpY3Qgc2hhbGxvdyAgfCAgICBsb29zZSBzaGFsbG93ICAgICB8ICAgICBzdHJpY3QgZGVlcCAgICAgfCAgICAgc3RydWN0dXJhbCBkZWVwXG4gKiAtLS0tLS0tLS0tLS0tLXwtLS0tLS0tLS0tLS0tLS0tLXwtLS0tLS0tLS0tLS0tLS0tLS0tLS0tfC0tLS0tLS0tLS0tLS0tLS0tLS0tLXwtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gKiBpbmNsdWRlcyBhbGwgIHwgYGhhc0tleXNgICAgICAgIHwgYGhhc0xvb3NlS2V5c2AgICAgICAgfCBgaGFzRGVlcEtleXNgICAgICAgIHwgYGhhc01hdGNoS2V5c2BcbiAqIGluY2x1ZGVzIHNvbWUgfCBgaGFzQW55S2V5c2AgICAgfCBgaGFzTG9vc2VBbnlLZXlzYCAgICB8IGBoYXNEZWVwQW55S2V5c2AgICAgfCBgaGFzTWF0Y2hBbnlLZXlzYFxuICogbWlzc2luZyBzb21lICB8IGBub3RIYXNBbGxLZXlzYCB8IGBub3RIYXNMb29zZUFsbEtleXNgIHwgYG5vdEhhc0RlZXBBbGxLZXlzYCB8IGBub3RIYXNNYXRjaEFsbEtleXNgXG4gKiBtaXNzaW5nIGFsbCAgIHwgYG5vdEhhc0tleXNgICAgIHwgYG5vdEhhc0xvb3NlS2V5c2AgICAgfCBgbm90SGFzRGVlcEtleXNgICAgIHwgYG5vdEhhc01hdGNoS2V5c2BcbiAqXG4gKiBOb3RlIHRoYXQgdGhlIGBoYXNLZXlzYCBzaGFsbG93IGNvbXBhcmlzb24gdmFyaWFudHMgYXJlIGFsc28gb3ZlcmxvYWRlZCB0b1xuICogY29uc3VtZSBlaXRoZXIgYW4gYXJyYXkgKGluIHdoaWNoIGl0IHNpbXBseSBjaGVja3MgYWdhaW5zdCBhIGxpc3Qgb2Yga2V5cykgb3JcbiAqIGFuIG9iamVjdCAod2hlcmUgaXQgZG9lcyBhIGZ1bGwgZGVlcCBjb21wYXJpc29uKS5cbiAqL1xuXG4vKiBlc2xpbnQtZW5hYmxlIG1heC1sZW4gKi9cblxuZnVuY3Rpb24gbWFrZUluY2x1ZGVzKGFsbCwgZnVuYykge1xuICAgIHJldHVybiBmdW5jdGlvbiAoYXJyYXksIGtleXMpIHtcbiAgICAgICAgZnVuY3Rpb24gdGVzdChrZXkpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJyYXkubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoZnVuYyhrZXksIGFycmF5W2ldKSkgcmV0dXJuIHRydWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGFsbCkge1xuICAgICAgICAgICAgaWYgKGFycmF5Lmxlbmd0aCA8IGtleXMubGVuZ3RoKSByZXR1cm4gZmFsc2VcblxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKCF0ZXN0KGtleXNbaV0pKSByZXR1cm4gZmFsc2VcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGtleXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICBpZiAodGVzdChrZXlzW2pdKSkgcmV0dXJuIHRydWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkZWZpbmVJbmNsdWRlcyhuYW1lLCBmdW5jLCBpbnZlcnQsIG1lc3NhZ2UpIHtcbiAgICBmdW5jdGlvbiBiYXNlKGFycmF5LCB2YWx1ZXMpIHtcbiAgICAgICAgLy8gQ2hlYXAgY2FzZXMgZmlyc3RcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGFycmF5KSkgcmV0dXJuIGZhbHNlXG4gICAgICAgIGlmIChhcnJheSA9PT0gdmFsdWVzKSByZXR1cm4gdHJ1ZVxuICAgICAgICByZXR1cm4gZnVuYyhhcnJheSwgdmFsdWVzKVxuICAgIH1cblxuICAgIGRlZmluZShuYW1lLCBmdW5jdGlvbiAoYXJyYXksIHZhbHVlcykge1xuICAgICAgICBjaGVjayhhcnJheSwgXCJhcnJheVwiLCBcImFycmF5XCIpXG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheSh2YWx1ZXMpKSB2YWx1ZXMgPSBbdmFsdWVzXVxuXG4gICAgICAgIC8vIGV4Y2x1c2l2ZSBvciB0byBpbnZlcnQgdGhlIHJlc3VsdCBpZiBgaW52ZXJ0YCBpcyB0cnVlXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0ZXN0OiAhdmFsdWVzLmxlbmd0aCB8fCBpbnZlcnQgXiBiYXNlKGFycmF5LCB2YWx1ZXMpLFxuICAgICAgICAgICAgYWN0dWFsOiBhcnJheSxcbiAgICAgICAgICAgIHZhbHVlczogdmFsdWVzLFxuICAgICAgICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgICAgfVxuICAgIH0pXG59XG5cbnZhciBpbmNsdWRlc0FsbCA9IG1ha2VJbmNsdWRlcyh0cnVlLCBzdHJpY3RJcylcbnZhciBpbmNsdWRlc0FueSA9IG1ha2VJbmNsdWRlcyhmYWxzZSwgc3RyaWN0SXMpXG5cbi8qIGVzbGludC1kaXNhYmxlIG1heC1sZW4gKi9cblxuZGVmaW5lSW5jbHVkZXMoXCJpbmNsdWRlc1wiLCBpbmNsdWRlc0FsbCwgZmFsc2UsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gaGF2ZSBhbGwgdmFsdWVzIGluIHt2YWx1ZXN9XCIpXG5kZWZpbmVJbmNsdWRlcyhcIm5vdEluY2x1ZGVzQWxsXCIsIGluY2x1ZGVzQWxsLCB0cnVlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBoYXZlIGFsbCB2YWx1ZXMgaW4ge3ZhbHVlc31cIilcbmRlZmluZUluY2x1ZGVzKFwiaW5jbHVkZXNBbnlcIiwgaW5jbHVkZXNBbnksIGZhbHNlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGhhdmUgYW55IHZhbHVlIGluIHt2YWx1ZXN9XCIpXG5kZWZpbmVJbmNsdWRlcyhcIm5vdEluY2x1ZGVzXCIsIGluY2x1ZGVzQW55LCB0cnVlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBoYXZlIGFueSB2YWx1ZSBpbiB7dmFsdWVzfVwiKVxuXG52YXIgaW5jbHVkZXNMb29zZUFsbCA9IG1ha2VJbmNsdWRlcyh0cnVlLCBsb29zZUlzKVxudmFyIGluY2x1ZGVzTG9vc2VBbnkgPSBtYWtlSW5jbHVkZXMoZmFsc2UsIGxvb3NlSXMpXG5cbmRlZmluZUluY2x1ZGVzKFwiaW5jbHVkZXNMb29zZVwiLCBpbmNsdWRlc0xvb3NlQWxsLCBmYWxzZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBsb29zZWx5IGhhdmUgYWxsIHZhbHVlcyBpbiB7dmFsdWVzfVwiKVxuZGVmaW5lSW5jbHVkZXMoXCJub3RJbmNsdWRlc0xvb3NlQWxsXCIsIGluY2x1ZGVzTG9vc2VBbGwsIHRydWUsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGxvb3NlbHkgaGF2ZSBhbGwgdmFsdWVzIGluIHt2YWx1ZXN9XCIpXG5kZWZpbmVJbmNsdWRlcyhcImluY2x1ZGVzTG9vc2VBbnlcIiwgaW5jbHVkZXNMb29zZUFueSwgZmFsc2UsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbG9vc2VseSBoYXZlIGFueSB2YWx1ZSBpbiB7dmFsdWVzfVwiKVxuZGVmaW5lSW5jbHVkZXMoXCJub3RJbmNsdWRlc0xvb3NlXCIsIGluY2x1ZGVzTG9vc2VBbnksIHRydWUsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGxvb3NlbHkgaGF2ZSBhbnkgdmFsdWUgaW4ge3ZhbHVlc31cIilcblxudmFyIGluY2x1ZGVzRGVlcEFsbCA9IG1ha2VJbmNsdWRlcyh0cnVlLCBtYXRjaC5zdHJpY3QpXG52YXIgaW5jbHVkZXNEZWVwQW55ID0gbWFrZUluY2x1ZGVzKGZhbHNlLCBtYXRjaC5zdHJpY3QpXG5cbmRlZmluZUluY2x1ZGVzKFwiaW5jbHVkZXNEZWVwXCIsIGluY2x1ZGVzRGVlcEFsbCwgZmFsc2UsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbWF0Y2ggYWxsIHZhbHVlcyBpbiB7dmFsdWVzfVwiKVxuZGVmaW5lSW5jbHVkZXMoXCJub3RJbmNsdWRlc0RlZXBBbGxcIiwgaW5jbHVkZXNEZWVwQWxsLCB0cnVlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBtYXRjaCBhbGwgdmFsdWVzIGluIHt2YWx1ZXN9XCIpXG5kZWZpbmVJbmNsdWRlcyhcImluY2x1ZGVzRGVlcEFueVwiLCBpbmNsdWRlc0RlZXBBbnksIGZhbHNlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG1hdGNoIGFueSB2YWx1ZSBpbiB7dmFsdWVzfVwiKVxuZGVmaW5lSW5jbHVkZXMoXCJub3RJbmNsdWRlc0RlZXBcIiwgaW5jbHVkZXNEZWVwQW55LCB0cnVlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBtYXRjaCBhbnkgdmFsdWUgaW4ge3ZhbHVlc31cIilcblxudmFyIGluY2x1ZGVzTWF0Y2hBbGwgPSBtYWtlSW5jbHVkZXModHJ1ZSwgbWF0Y2gubWF0Y2gpXG52YXIgaW5jbHVkZXNNYXRjaEFueSA9IG1ha2VJbmNsdWRlcyhmYWxzZSwgbWF0Y2gubWF0Y2gpXG5cbmRlZmluZUluY2x1ZGVzKFwiaW5jbHVkZXNNYXRjaFwiLCBpbmNsdWRlc01hdGNoQWxsLCBmYWxzZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBtYXRjaCBhbGwgdmFsdWVzIGluIHt2YWx1ZXN9XCIpXG5kZWZpbmVJbmNsdWRlcyhcIm5vdEluY2x1ZGVzTWF0Y2hBbGxcIiwgaW5jbHVkZXNNYXRjaEFsbCwgdHJ1ZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgbWF0Y2ggYWxsIHZhbHVlcyBpbiB7dmFsdWVzfVwiKVxuZGVmaW5lSW5jbHVkZXMoXCJpbmNsdWRlc01hdGNoQW55XCIsIGluY2x1ZGVzTWF0Y2hBbnksIGZhbHNlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG1hdGNoIGFueSB2YWx1ZSBpbiB7dmFsdWVzfVwiKVxuZGVmaW5lSW5jbHVkZXMoXCJub3RJbmNsdWRlc01hdGNoXCIsIGluY2x1ZGVzTWF0Y2hBbnksIHRydWUsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IG1hdGNoIGFueSB2YWx1ZSBpbiB7dmFsdWVzfVwiKVxuXG4vKiBlc2xpbnQtZW5hYmxlIG1heC1sZW4gKi9cblxuZnVuY3Rpb24gaXNFbXB0eShvYmplY3QpIHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShvYmplY3QpKSByZXR1cm4gb2JqZWN0Lmxlbmd0aCA9PT0gMFxuICAgIGlmICh0eXBlb2Ygb2JqZWN0ICE9PSBcIm9iamVjdFwiIHx8IG9iamVjdCA9PT0gbnVsbCkgcmV0dXJuIHRydWVcbiAgICByZXR1cm4gT2JqZWN0LmtleXMob2JqZWN0KS5sZW5ndGggPT09IDBcbn1cblxuZnVuY3Rpb24gbWFrZUhhc092ZXJsb2FkKG5hbWUsIG1ldGhvZHMsIGludmVydCwgbWVzc2FnZSkge1xuICAgIGZ1bmN0aW9uIGJhc2Uob2JqZWN0LCBrZXlzKSB7XG4gICAgICAgIC8vIENoZWFwIGNhc2UgZmlyc3RcbiAgICAgICAgaWYgKG9iamVjdCA9PT0ga2V5cykgcmV0dXJuIHRydWVcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoa2V5cykpIHJldHVybiBtZXRob2RzLmFycmF5KG9iamVjdCwga2V5cylcbiAgICAgICAgcmV0dXJuIG1ldGhvZHMub2JqZWN0KG9iamVjdCwga2V5cylcbiAgICB9XG5cbiAgICBkZWZpbmUobmFtZSwgZnVuY3Rpb24gKG9iamVjdCwga2V5cykge1xuICAgICAgICBjaGVjayhvYmplY3QsIFwib2JqZWN0XCIsIFwib2JqZWN0XCIpXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAvLyBleGNsdXNpdmUgb3IgdG8gaW52ZXJ0IHRoZSByZXN1bHQgaWYgYGludmVydGAgaXMgdHJ1ZVxuICAgICAgICAgICAgdGVzdDogaXNFbXB0eShrZXlzKSB8fCBpbnZlcnQgXiBiYXNlKG9iamVjdCwga2V5cyksXG4gICAgICAgICAgICBhY3R1YWw6IG9iamVjdCxcbiAgICAgICAgICAgIGtleXM6IGtleXMsXG4gICAgICAgICAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgICAgICB9XG4gICAgfSlcbn1cblxuZnVuY3Rpb24gbWFrZUhhc0tleXMobmFtZSwgZnVuYywgaW52ZXJ0LCBtZXNzYWdlKSB7XG4gICAgZnVuY3Rpb24gYmFzZShvYmplY3QsIGtleXMpIHtcbiAgICAgICAgcmV0dXJuIG9iamVjdCA9PT0ga2V5cyB8fCBmdW5jKG9iamVjdCwga2V5cylcbiAgICB9XG5cbiAgICBkZWZpbmUobmFtZSwgZnVuY3Rpb24gKG9iamVjdCwga2V5cykge1xuICAgICAgICBjaGVjayhvYmplY3QsIFwib2JqZWN0XCIsIFwib2JqZWN0XCIpXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAvLyBleGNsdXNpdmUgb3IgdG8gaW52ZXJ0IHRoZSByZXN1bHQgaWYgYGludmVydGAgaXMgdHJ1ZVxuICAgICAgICAgICAgdGVzdDogaXNFbXB0eShrZXlzKSB8fCBpbnZlcnQgXiBiYXNlKG9iamVjdCwga2V5cyksXG4gICAgICAgICAgICBhY3R1YWw6IG9iamVjdCxcbiAgICAgICAgICAgIGtleXM6IGtleXMsXG4gICAgICAgICAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgICAgICB9XG4gICAgfSlcbn1cblxuZnVuY3Rpb24gaGFzS2V5c1R5cGUoYWxsLCBmdW5jKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChvYmplY3QsIGtleXMpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBrZXlzICE9PSBcIm9iamVjdFwiKSByZXR1cm4gdHJ1ZVxuICAgICAgICBpZiAoa2V5cyA9PT0gbnVsbCkgcmV0dXJuIHRydWVcblxuICAgICAgICBmdW5jdGlvbiBjaGVjayhrZXkpIHtcbiAgICAgICAgICAgIHJldHVybiBoYXNPd24uY2FsbChvYmplY3QsIGtleSkgJiYgZnVuYyhrZXlzW2tleV0sIG9iamVjdFtrZXldKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGFsbCkge1xuICAgICAgICAgICAgZm9yICh2YXIga2V5MSBpbiBrZXlzKSB7XG4gICAgICAgICAgICAgICAgaWYgKGhhc093bi5jYWxsKGtleXMsIGtleTEpICYmICFjaGVjayhrZXkxKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZm9yICh2YXIga2V5MiBpbiBrZXlzKSB7XG4gICAgICAgICAgICAgICAgaWYgKGhhc093bi5jYWxsKGtleXMsIGtleTIpICYmIGNoZWNrKGtleTIpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGhhc092ZXJsb2FkVHlwZShhbGwsIGZ1bmMpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBvYmplY3Q6IGhhc0tleXNUeXBlKGFsbCwgZnVuYyksXG4gICAgICAgIGFycmF5OiBmdW5jdGlvbiAob2JqZWN0LCBrZXlzKSB7XG4gICAgICAgICAgICBpZiAoYWxsKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghaGFzT3duLmNhbGwob2JqZWN0LCBrZXlzW2ldKSkgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwga2V5cy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaGFzT3duLmNhbGwob2JqZWN0LCBrZXlzW2pdKSkgcmV0dXJuIHRydWVcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgfVxufVxuXG4vKiBlc2xpbnQtZGlzYWJsZSBtYXgtbGVuICovXG5cbnZhciBoYXNBbGxLZXlzID0gaGFzT3ZlcmxvYWRUeXBlKHRydWUsIHN0cmljdElzKVxudmFyIGhhc0FueUtleXMgPSBoYXNPdmVybG9hZFR5cGUoZmFsc2UsIHN0cmljdElzKVxuXG5tYWtlSGFzT3ZlcmxvYWQoXCJoYXNLZXlzXCIsIGhhc0FsbEtleXMsIGZhbHNlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGhhdmUgYWxsIGtleXMgaW4ge2tleXN9XCIpXG5tYWtlSGFzT3ZlcmxvYWQoXCJub3RIYXNBbGxLZXlzXCIsIGhhc0FsbEtleXMsIHRydWUsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGhhdmUgYWxsIGtleXMgaW4ge2tleXN9XCIpXG5tYWtlSGFzT3ZlcmxvYWQoXCJoYXNBbnlLZXlzXCIsIGhhc0FueUtleXMsIGZhbHNlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGhhdmUgYW55IGtleSBpbiB7a2V5c31cIilcbm1ha2VIYXNPdmVybG9hZChcIm5vdEhhc0tleXNcIiwgaGFzQW55S2V5cywgdHJ1ZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgaGF2ZSBhbnkga2V5IGluIHtrZXlzfVwiKVxuXG52YXIgaGFzTG9vc2VBbGxLZXlzID0gaGFzT3ZlcmxvYWRUeXBlKHRydWUsIGxvb3NlSXMpXG52YXIgaGFzTG9vc2VBbnlLZXlzID0gaGFzT3ZlcmxvYWRUeXBlKGZhbHNlLCBsb29zZUlzKVxuXG5tYWtlSGFzT3ZlcmxvYWQoXCJoYXNMb29zZUtleXNcIiwgaGFzTG9vc2VBbGxLZXlzLCBmYWxzZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBsb29zZWx5IGhhdmUgYWxsIGtleXMgaW4ge2tleXN9XCIpXG5tYWtlSGFzT3ZlcmxvYWQoXCJub3RIYXNMb29zZUFsbEtleXNcIiwgaGFzTG9vc2VBbGxLZXlzLCB0cnVlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBsb29zZWx5IGhhdmUgYWxsIGtleXMgaW4ge2tleXN9XCIpXG5tYWtlSGFzT3ZlcmxvYWQoXCJoYXNMb29zZUFueUtleXNcIiwgaGFzTG9vc2VBbnlLZXlzLCBmYWxzZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBsb29zZWx5IGhhdmUgYW55IGtleSBpbiB7a2V5c31cIilcbm1ha2VIYXNPdmVybG9hZChcIm5vdEhhc0xvb3NlS2V5c1wiLCBoYXNMb29zZUFueUtleXMsIHRydWUsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGxvb3NlbHkgaGF2ZSBhbnkga2V5IGluIHtrZXlzfVwiKVxuXG52YXIgaGFzRGVlcEFsbEtleXMgPSBoYXNLZXlzVHlwZSh0cnVlLCBtYXRjaC5zdHJpY3QpXG52YXIgaGFzRGVlcEFueUtleXMgPSBoYXNLZXlzVHlwZShmYWxzZSwgbWF0Y2guc3RyaWN0KVxuXG5tYWtlSGFzS2V5cyhcImhhc0RlZXBLZXlzXCIsIGhhc0RlZXBBbGxLZXlzLCBmYWxzZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBoYXZlIGFsbCBrZXlzIGluIHtrZXlzfVwiKVxubWFrZUhhc0tleXMoXCJub3RIYXNEZWVwQWxsS2V5c1wiLCBoYXNEZWVwQWxsS2V5cywgdHJ1ZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgaGF2ZSBhbGwga2V5cyBpbiB7a2V5c31cIilcbm1ha2VIYXNLZXlzKFwiaGFzRGVlcEFueUtleXNcIiwgaGFzRGVlcEFueUtleXMsIGZhbHNlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGhhdmUgYW55IGtleSBpbiB7a2V5c31cIilcbm1ha2VIYXNLZXlzKFwibm90SGFzRGVlcEtleXNcIiwgaGFzRGVlcEFueUtleXMsIHRydWUsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGhhdmUgYW55IGtleSBpbiB7a2V5c31cIilcblxudmFyIGhhc01hdGNoQWxsS2V5cyA9IGhhc0tleXNUeXBlKHRydWUsIG1hdGNoLm1hdGNoKVxudmFyIGhhc01hdGNoQW55S2V5cyA9IGhhc0tleXNUeXBlKGZhbHNlLCBtYXRjaC5tYXRjaClcblxubWFrZUhhc0tleXMoXCJoYXNNYXRjaEtleXNcIiwgaGFzTWF0Y2hBbGxLZXlzLCBmYWxzZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBtYXRjaCBhbGwga2V5cyBpbiB7a2V5c31cIilcbm1ha2VIYXNLZXlzKFwibm90SGFzTWF0Y2hBbGxLZXlzXCIsIGhhc01hdGNoQWxsS2V5cywgdHJ1ZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgbWF0Y2ggYWxsIGtleXMgaW4ge2tleXN9XCIpXG5tYWtlSGFzS2V5cyhcImhhc01hdGNoQW55S2V5c1wiLCBoYXNNYXRjaEFueUtleXMsIGZhbHNlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG1hdGNoIGFueSBrZXkgaW4ge2tleXN9XCIpXG5tYWtlSGFzS2V5cyhcIm5vdEhhc01hdGNoS2V5c1wiLCBoYXNNYXRjaEFueUtleXMsIHRydWUsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IG1hdGNoIGFueSBrZXkgaW4ge2tleXN9XCIpXG4iLCJcInVzZSBzdHJpY3RcIlxuXG4vKipcbiAqIE1haW4gZW50cnkgcG9pbnQsIGZvciB0aG9zZSB3YW50aW5nIHRvIHVzZSB0aGlzIGZyYW1ld29yayB3aXRoIHRoZSBjb3JlXG4gKiBhc3NlcnRpb25zLlxuICovXG52YXIgVGhhbGxpdW0gPSByZXF1aXJlKFwiLi9saWIvYXBpL3RoYWxsaXVtXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gbmV3IFRoYWxsaXVtKClcbiIsIlwidXNlIHN0cmljdFwiXG5cbnZhciBUaGFsbGl1bSA9IHJlcXVpcmUoXCIuL2xpYi9hcGkvdGhhbGxpdW1cIilcbnZhciBSZXBvcnRzID0gcmVxdWlyZShcIi4vbGliL2NvcmUvcmVwb3J0c1wiKVxudmFyIFR5cGVzID0gUmVwb3J0cy5UeXBlc1xuXG5leHBvcnRzLnJvb3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIG5ldyBUaGFsbGl1bSgpXG59XG5cbmZ1bmN0aW9uIGQoZHVyYXRpb24pIHtcbiAgICBpZiAoZHVyYXRpb24gPT0gbnVsbCkgcmV0dXJuIDEwXG4gICAgaWYgKHR5cGVvZiBkdXJhdGlvbiA9PT0gXCJudW1iZXJcIikgcmV0dXJuIGR1cmF0aW9ufDBcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgYGR1cmF0aW9uYCB0byBiZSBhIG51bWJlciBpZiBpdCBleGlzdHNcIilcbn1cblxuZnVuY3Rpb24gcyhzbG93KSB7XG4gICAgaWYgKHNsb3cgPT0gbnVsbCkgcmV0dXJuIDc1XG4gICAgaWYgKHR5cGVvZiBzbG93ID09PSBcIm51bWJlclwiKSByZXR1cm4gc2xvd3wwXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGBzbG93YCB0byBiZSBhIG51bWJlciBpZiBpdCBleGlzdHNcIilcbn1cblxuZnVuY3Rpb24gcChwYXRoKSB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkocGF0aCkpIHJldHVybiBwYXRoXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGBwYXRoYCB0byBiZSBhbiBhcnJheSBvZiBsb2NhdGlvbnNcIilcbn1cblxuZnVuY3Rpb24gaCh2YWx1ZSkge1xuICAgIGlmICh2YWx1ZSAhPSBudWxsICYmIHR5cGVvZiB2YWx1ZS5fID09PSBcIm51bWJlclwiKSByZXR1cm4gdmFsdWVcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgYHZhbHVlYCB0byBiZSBhIGhvb2sgZXJyb3JcIilcbn1cblxuLyoqXG4gKiBDcmVhdGUgYSBuZXcgcmVwb3J0LCBtYWlubHkgZm9yIHRlc3RpbmcgcmVwb3J0ZXJzLlxuICovXG5leHBvcnRzLnJlcG9ydHMgPSB7XG4gICAgc3RhcnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSZXBvcnRzLlN0YXJ0KClcbiAgICB9LFxuXG4gICAgZW50ZXI6IGZ1bmN0aW9uIChwYXRoLCBkdXJhdGlvbiwgc2xvdykge1xuICAgICAgICByZXR1cm4gbmV3IFJlcG9ydHMuRW50ZXIocChwYXRoKSwgZChkdXJhdGlvbiksIHMoc2xvdykpXG4gICAgfSxcblxuICAgIGxlYXZlOiBmdW5jdGlvbiAocGF0aCkge1xuICAgICAgICByZXR1cm4gbmV3IFJlcG9ydHMuTGVhdmUocChwYXRoKSlcbiAgICB9LFxuXG4gICAgcGFzczogZnVuY3Rpb24gKHBhdGgsIGR1cmF0aW9uLCBzbG93KSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVwb3J0cy5QYXNzKHAocGF0aCksIGQoZHVyYXRpb24pLCBzKHNsb3cpKVxuICAgIH0sXG5cbiAgICBmYWlsOiBmdW5jdGlvbiAocGF0aCwgdmFsdWUsIGR1cmF0aW9uLCBzbG93KSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVwb3J0cy5GYWlsKHAocGF0aCksIHZhbHVlLCBkKGR1cmF0aW9uKSwgcyhzbG93KSlcbiAgICB9LFxuXG4gICAgc2tpcDogZnVuY3Rpb24gKHBhdGgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSZXBvcnRzLlNraXAocChwYXRoKSlcbiAgICB9LFxuXG4gICAgZW5kOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVwb3J0cy5FbmQoKVxuICAgIH0sXG5cbiAgICBlcnJvcjogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVwb3J0cy5FcnJvcih2YWx1ZSlcbiAgICB9LFxuXG4gICAgaG9vazogZnVuY3Rpb24gKHBhdGgsIHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVwb3J0cy5Ib29rKHAocGF0aCksIGgodmFsdWUpKVxuICAgIH0sXG59XG5cbi8qKlxuICogQ3JlYXRlIGEgbmV3IGhvb2sgZXJyb3IsIG1haW5seSBmb3IgdGVzdGluZyByZXBvcnRlcnMuXG4gKi9cbmV4cG9ydHMuaG9va0Vycm9ycyA9IHtcbiAgICBiZWZvcmVBbGw6IGZ1bmN0aW9uIChmdW5jLCB2YWx1ZSkge1xuICAgICAgICByZXR1cm4gbmV3IFJlcG9ydHMuSG9va0Vycm9yKFR5cGVzLkJlZm9yZUFsbCwgZnVuYywgdmFsdWUpXG4gICAgfSxcblxuICAgIGJlZm9yZUVhY2g6IGZ1bmN0aW9uIChmdW5jLCB2YWx1ZSkge1xuICAgICAgICByZXR1cm4gbmV3IFJlcG9ydHMuSG9va0Vycm9yKFR5cGVzLkJlZm9yZUVhY2gsIGZ1bmMsIHZhbHVlKVxuICAgIH0sXG5cbiAgICBhZnRlckVhY2g6IGZ1bmN0aW9uIChmdW5jLCB2YWx1ZSkge1xuICAgICAgICByZXR1cm4gbmV3IFJlcG9ydHMuSG9va0Vycm9yKFR5cGVzLkFmdGVyRWFjaCwgZnVuYywgdmFsdWUpXG4gICAgfSxcblxuICAgIGFmdGVyQWxsOiBmdW5jdGlvbiAoZnVuYywgdmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSZXBvcnRzLkhvb2tFcnJvcihUeXBlcy5BZnRlckFsbCwgZnVuYywgdmFsdWUpXG4gICAgfSxcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IGxvY2F0aW9uLCBtYWlubHkgZm9yIHRlc3RpbmcgcmVwb3J0ZXJzLlxuICovXG5leHBvcnRzLmxvY2F0aW9uID0gZnVuY3Rpb24gKG5hbWUsIGluZGV4KSB7XG4gICAgaWYgKHR5cGVvZiBuYW1lICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBgbmFtZWAgdG8gYmUgYSBzdHJpbmdcIilcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGluZGV4ICE9PSBcIm51bWJlclwiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBgaW5kZXhgIHRvIGJlIGEgbnVtYmVyXCIpXG4gICAgfVxuXG4gICAgcmV0dXJuIHtuYW1lOiBuYW1lLCBpbmRleDogaW5kZXh8MH1cbn1cbiIsIlwidXNlIHN0cmljdFwiXG5cbmV4cG9ydHMuYWRkSG9vayA9IGZ1bmN0aW9uIChsaXN0LCBjYWxsYmFjaykge1xuICAgIGlmIChsaXN0ICE9IG51bGwpIHtcbiAgICAgICAgbGlzdC5wdXNoKGNhbGxiYWNrKVxuICAgICAgICByZXR1cm4gbGlzdFxuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBbY2FsbGJhY2tdXG4gICAgfVxufVxuXG5leHBvcnRzLnJlbW92ZUhvb2sgPSBmdW5jdGlvbiAobGlzdCwgY2FsbGJhY2spIHtcbiAgICBpZiAobGlzdCA9PSBudWxsKSByZXR1cm4gdW5kZWZpbmVkXG4gICAgaWYgKGxpc3QubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIGlmIChsaXN0WzBdID09PSBjYWxsYmFjaykgcmV0dXJuIHVuZGVmaW5lZFxuICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBpbmRleCA9IGxpc3QuaW5kZXhPZihjYWxsYmFjaylcblxuICAgICAgICBpZiAoaW5kZXggPj0gMCkgbGlzdC5zcGxpY2UoaW5kZXgsIDEpXG4gICAgfVxuICAgIHJldHVybiBsaXN0XG59XG5cbmV4cG9ydHMuaGFzSG9vayA9IGZ1bmN0aW9uIChsaXN0LCBjYWxsYmFjaykge1xuICAgIGlmIChsaXN0ID09IG51bGwpIHJldHVybiBmYWxzZVxuICAgIGlmIChsaXN0Lmxlbmd0aCA+IDEpIHJldHVybiBsaXN0LmluZGV4T2YoY2FsbGJhY2spID49IDBcbiAgICByZXR1cm4gbGlzdFswXSA9PT0gY2FsbGJhY2tcbn1cbiIsIlwidXNlIHN0cmljdFwiXG5cbnZhciBtZXRob2RzID0gcmVxdWlyZShcIi4uL21ldGhvZHNcIilcbnZhciBUZXN0cyA9IHJlcXVpcmUoXCIuLi9jb3JlL3Rlc3RzXCIpXG52YXIgSG9va3MgPSByZXF1aXJlKFwiLi9ob29rc1wiKVxuXG4vKipcbiAqIFRoaXMgY29udGFpbnMgdGhlIGxvdyBsZXZlbCwgbW9yZSBhcmNhbmUgdGhpbmdzIHRoYXQgYXJlIGdlbmVyYWxseSBub3RcbiAqIGludGVyZXN0aW5nIHRvIGFueW9uZSBvdGhlciB0aGFuIHBsdWdpbiBkZXZlbG9wZXJzLlxuICovXG5tb2R1bGUuZXhwb3J0cyA9IFJlZmxlY3RcbmZ1bmN0aW9uIFJlZmxlY3QodGVzdCkge1xuICAgIHZhciByZWZsZWN0ID0gdGVzdC5yZWZsZWN0XG5cbiAgICBpZiAocmVmbGVjdCAhPSBudWxsKSByZXR1cm4gcmVmbGVjdFxuICAgIGlmICh0ZXN0LnJvb3QgIT09IHRlc3QpIHJldHVybiB0ZXN0LnJlZmxlY3QgPSBuZXcgUmVmbGVjdENoaWxkKHRlc3QpXG4gICAgcmV0dXJuIHRlc3QucmVmbGVjdCA9IG5ldyBSZWZsZWN0Um9vdCh0ZXN0KVxufVxuXG5tZXRob2RzKFJlZmxlY3QsIHtcbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIGN1cnJlbnRseSBleGVjdXRpbmcgdGVzdC5cbiAgICAgKi9cbiAgICBnZXQgY3VycmVudCgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSZWZsZWN0KHRoaXMuXy5yb290LmN1cnJlbnQpXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgcm9vdCB0ZXN0LlxuICAgICAqL1xuICAgIGdldCByb290KCkge1xuICAgICAgICByZXR1cm4gbmV3IFJlZmxlY3QodGhpcy5fLnJvb3QpXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgY3VycmVudCB0b3RhbCB0ZXN0IGNvdW50LlxuICAgICAqL1xuICAgIGdldCBjb3VudCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuXy50ZXN0cyA9PSBudWxsID8gMCA6IHRoaXMuXy50ZXN0cy5sZW5ndGhcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGEgY29weSBvZiB0aGUgY3VycmVudCB0ZXN0IGxpc3QsIGFzIGEgUmVmbGVjdCBjb2xsZWN0aW9uLiBUaGlzIGlzXG4gICAgICogaW50ZW50aW9uYWxseSBhIHNsaWNlLCBzbyB5b3UgY2FuJ3QgbXV0YXRlIHRoZSByZWFsIGNoaWxkcmVuLlxuICAgICAqL1xuICAgIGdldCBjaGlsZHJlbigpIHtcbiAgICAgICAgaWYgKHRoaXMuXy50ZXN0cyA9PSBudWxsKSByZXR1cm4gW11cbiAgICAgICAgcmV0dXJuIHRoaXMuXy50ZXN0cy5tYXAoZnVuY3Rpb24gKHRlc3QpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgUmVmbGVjdENoaWxkKHRlc3QpXG4gICAgICAgIH0pXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIElzIHRoaXMgdGVzdCB0aGUgcm9vdCwgaS5lLiB0b3AgbGV2ZWw/XG4gICAgICovXG4gICAgZ2V0IGlzUm9vdCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuXy5yb290ID09PSB0aGlzLl9cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogSXMgdGhpcyBsb2NrZWQgKGkuZS4gdW5zYWZlIHRvIG1vZGlmeSk/XG4gICAgICovXG4gICAgZ2V0IGlzTG9ja2VkKCkge1xuICAgICAgICByZXR1cm4gISF0aGlzLl8ubG9ja2VkXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgb3duLCBub3QgbmVjZXNzYXJpbHkgYWN0aXZlLCB0aW1lb3V0LiAwIG1lYW5zIGluaGVyaXQgdGhlXG4gICAgICogcGFyZW50J3MsIGFuZCBgSW5maW5pdHlgIG1lYW5zIGl0J3MgZGlzYWJsZWQuXG4gICAgICovXG4gICAgZ2V0IG93blRpbWVvdXQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl8udGltZW91dCB8fCAwXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgYWN0aXZlIHRpbWVvdXQgaW4gbWlsbGlzZWNvbmRzLCBub3QgbmVjZXNzYXJpbHkgb3duLCBvciB0aGVcbiAgICAgKiBmcmFtZXdvcmsgZGVmYXVsdCBvZiAyMDAwLCBpZiBub25lIHdhcyBzZXQuXG4gICAgICovXG4gICAgZ2V0IHRpbWVvdXQoKSB7XG4gICAgICAgIHJldHVybiBUZXN0cy50aW1lb3V0KHRoaXMuXylcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBvd24sIG5vdCBuZWNlc3NhcmlseSBhY3RpdmUsIHNsb3cgdGhyZXNob2xkLiAwIG1lYW5zIGluaGVyaXQgdGhlXG4gICAgICogcGFyZW50J3MsIGFuZCBgSW5maW5pdHlgIG1lYW5zIGl0J3MgZGlzYWJsZWQuXG4gICAgICovXG4gICAgZ2V0IG93blNsb3coKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl8uc2xvdyB8fCAwXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgYWN0aXZlIHNsb3cgdGhyZXNob2xkIGluIG1pbGxpc2Vjb25kcywgbm90IG5lY2Vzc2FyaWx5IG93biwgb3JcbiAgICAgKiB0aGUgZnJhbWV3b3JrIGRlZmF1bHQgb2YgNzUsIGlmIG5vbmUgd2FzIHNldC5cbiAgICAgKi9cbiAgICBnZXQgc2xvdygpIHtcbiAgICAgICAgcmV0dXJuIFRlc3RzLnNsb3codGhpcy5fKVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGQgYSBob29rIHRvIGJlIHJ1biBiZWZvcmUgZWFjaCBzdWJ0ZXN0LCBpbmNsdWRpbmcgdGhlaXIgc3VidGVzdHMgYW5kIHNvXG4gICAgICogb24uXG4gICAgICovXG4gICAgYmVmb3JlOiBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgY2FsbGJhY2sgdG8gYmUgYSBmdW5jdGlvbiBpZiBwYXNzZWRcIilcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuXy5iZWZvcmVFYWNoID0gSG9va3MuYWRkSG9vayh0aGlzLl8uYmVmb3JlRWFjaCwgY2FsbGJhY2spXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBhIGhvb2sgdG8gYmUgcnVuIG9uY2UgYmVmb3JlIGFsbCBzdWJ0ZXN0cyBhcmUgcnVuLlxuICAgICAqL1xuICAgIGJlZm9yZUFsbDogZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIGJlIGEgZnVuY3Rpb24gaWYgcGFzc2VkXCIpXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl8uYmVmb3JlQWxsID0gSG9va3MuYWRkSG9vayh0aGlzLl8uYmVmb3JlQWxsLCBjYWxsYmFjaylcbiAgICB9LFxuXG4gICAvKipcbiAgICAqIEFkZCBhIGhvb2sgdG8gYmUgcnVuIGFmdGVyIGVhY2ggc3VidGVzdCwgaW5jbHVkaW5nIHRoZWlyIHN1YnRlc3RzIGFuZCBzb1xuICAgICogb24uXG4gICAgKi9cbiAgICBhZnRlcjogZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIGJlIGEgZnVuY3Rpb24gaWYgcGFzc2VkXCIpXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl8uYWZ0ZXJFYWNoID0gSG9va3MuYWRkSG9vayh0aGlzLl8uYWZ0ZXJFYWNoLCBjYWxsYmFjaylcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGEgaG9vayB0byBiZSBydW4gb25jZSBhZnRlciBhbGwgc3VidGVzdHMgYXJlIHJ1bi5cbiAgICAgKi9cbiAgICBhZnRlckFsbDogZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIGJlIGEgZnVuY3Rpb24gaWYgcGFzc2VkXCIpXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl8uYWZ0ZXJBbGwgPSBIb29rcy5hZGRIb29rKHRoaXMuXy5hZnRlckFsbCwgY2FsbGJhY2spXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBhIGhvb2sgcHJldmlvdXNseSBhZGRlZCB3aXRoIGB0LmJlZm9yZWAgb3IgYHJlZmxlY3QuYmVmb3JlYC5cbiAgICAgKi9cbiAgICBoYXNCZWZvcmU6IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBjYWxsYmFjayB0byBiZSBhIGZ1bmN0aW9uIGlmIHBhc3NlZFwiKVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIEhvb2tzLmhhc0hvb2sodGhpcy5fLmJlZm9yZUVhY2gsIGNhbGxiYWNrKVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgYSBob29rIHByZXZpb3VzbHkgYWRkZWQgd2l0aCBgdC5iZWZvcmVBbGxgIG9yIGByZWZsZWN0LmJlZm9yZUFsbGAuXG4gICAgICovXG4gICAgaGFzQmVmb3JlQWxsOiBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgY2FsbGJhY2sgdG8gYmUgYSBmdW5jdGlvbiBpZiBwYXNzZWRcIilcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBIb29rcy5oYXNIb29rKHRoaXMuXy5iZWZvcmVBbGwsIGNhbGxiYWNrKVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgYSBob29rIHByZXZpb3VzbHkgYWRkZWQgd2l0aCBgdC5hZnRlcmAgb3JgcmVmbGVjdC5hZnRlcmAuXG4gICAgICovXG4gICAgaGFzQWZ0ZXI6IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBjYWxsYmFjayB0byBiZSBhIGZ1bmN0aW9uIGlmIHBhc3NlZFwiKVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIEhvb2tzLmhhc0hvb2sodGhpcy5fLmFmdGVyRWFjaCwgY2FsbGJhY2spXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBhIGhvb2sgcHJldmlvdXNseSBhZGRlZCB3aXRoIGB0LmFmdGVyQWxsYCBvciBgcmVmbGVjdC5hZnRlckFsbGAuXG4gICAgICovXG4gICAgaGFzQWZ0ZXJBbGw6IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBjYWxsYmFjayB0byBiZSBhIGZ1bmN0aW9uIGlmIHBhc3NlZFwiKVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIEhvb2tzLmhhc0hvb2sodGhpcy5fLmFmdGVyQWxsLCBjYWxsYmFjaylcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGEgaG9vayBwcmV2aW91c2x5IGFkZGVkIHdpdGggYHQuYmVmb3JlYCBvciBgcmVmbGVjdC5iZWZvcmVgLlxuICAgICAqL1xuICAgIHJlbW92ZUJlZm9yZTogZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIGJlIGEgZnVuY3Rpb24gaWYgcGFzc2VkXCIpXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgYmVmb3JlRWFjaCA9IEhvb2tzLnJlbW92ZUhvb2sodGhpcy5fLmJlZm9yZUVhY2gsIGNhbGxiYWNrKVxuXG4gICAgICAgIGlmIChiZWZvcmVFYWNoID09IG51bGwpIGRlbGV0ZSB0aGlzLl8uYmVmb3JlRWFjaFxuICAgICAgICBlbHNlIHRoaXMuXy5iZWZvcmVFYWNoID0gYmVmb3JlRWFjaFxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgYSBob29rIHByZXZpb3VzbHkgYWRkZWQgd2l0aCBgdC5iZWZvcmVBbGxgIG9yIGByZWZsZWN0LmJlZm9yZUFsbGAuXG4gICAgICovXG4gICAgcmVtb3ZlQmVmb3JlQWxsOiBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgY2FsbGJhY2sgdG8gYmUgYSBmdW5jdGlvbiBpZiBwYXNzZWRcIilcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBiZWZvcmVBbGwgPSBIb29rcy5yZW1vdmVIb29rKHRoaXMuXy5iZWZvcmVBbGwsIGNhbGxiYWNrKVxuXG4gICAgICAgIGlmIChiZWZvcmVBbGwgPT0gbnVsbCkgZGVsZXRlIHRoaXMuXy5iZWZvcmVBbGxcbiAgICAgICAgZWxzZSB0aGlzLl8uYmVmb3JlQWxsID0gYmVmb3JlQWxsXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBhIGhvb2sgcHJldmlvdXNseSBhZGRlZCB3aXRoIGB0LmFmdGVyYCBvcmByZWZsZWN0LmFmdGVyYC5cbiAgICAgKi9cbiAgICByZW1vdmVBZnRlcjogZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIGJlIGEgZnVuY3Rpb24gaWYgcGFzc2VkXCIpXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgYWZ0ZXJFYWNoID0gSG9va3MucmVtb3ZlSG9vayh0aGlzLl8uYWZ0ZXJFYWNoLCBjYWxsYmFjaylcblxuICAgICAgICBpZiAoYWZ0ZXJFYWNoID09IG51bGwpIGRlbGV0ZSB0aGlzLl8uYWZ0ZXJFYWNoXG4gICAgICAgIGVsc2UgdGhpcy5fLmFmdGVyRWFjaCA9IGFmdGVyRWFjaFxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgYSBob29rIHByZXZpb3VzbHkgYWRkZWQgd2l0aCBgdC5hZnRlckFsbGAgb3IgYHJlZmxlY3QuYWZ0ZXJBbGxgLlxuICAgICAqL1xuICAgIHJlbW92ZUFmdGVyQWxsOiBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgY2FsbGJhY2sgdG8gYmUgYSBmdW5jdGlvbiBpZiBwYXNzZWRcIilcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBhZnRlckFsbCA9IEhvb2tzLnJlbW92ZUhvb2sodGhpcy5fLmFmdGVyQWxsLCBjYWxsYmFjaylcblxuICAgICAgICBpZiAoYWZ0ZXJBbGwgPT0gbnVsbCkgZGVsZXRlIHRoaXMuXy5hZnRlckFsbFxuICAgICAgICBlbHNlIHRoaXMuXy5hZnRlckFsbCA9IGFmdGVyQWxsXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBhIGJsb2NrIG9yIGlubGluZSB0ZXN0LlxuICAgICAqL1xuICAgIHRlc3Q6IGZ1bmN0aW9uIChuYW1lLCBjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIG5hbWUgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBgbmFtZWAgdG8gYmUgYSBzdHJpbmdcIilcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIGJlIGEgZnVuY3Rpb24gaWYgcGFzc2VkXCIpXG4gICAgICAgIH1cblxuICAgICAgICBUZXN0cy5hZGROb3JtYWwodGhpcy5fLnJvb3QuY3VycmVudCwgbmFtZSwgY2FsbGJhY2spXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBhIHNraXBwZWQgYmxvY2sgb3IgaW5saW5lIHRlc3QuXG4gICAgICovXG4gICAgdGVzdFNraXA6IGZ1bmN0aW9uIChuYW1lLCBjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIG5hbWUgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBgbmFtZWAgdG8gYmUgYSBzdHJpbmdcIilcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIGJlIGEgZnVuY3Rpb24gaWYgcGFzc2VkXCIpXG4gICAgICAgIH1cblxuICAgICAgICBUZXN0cy5hZGRTa2lwcGVkKHRoaXMuXy5yb290LmN1cnJlbnQsIG5hbWUpXG4gICAgfSxcbn0pXG5cbmZ1bmN0aW9uIFJlZmxlY3RSb290KHJvb3QpIHtcbiAgICB0aGlzLl8gPSByb290XG59XG5cbm1ldGhvZHMoUmVmbGVjdFJvb3QsIFJlZmxlY3QsIHtcbiAgICAvKipcbiAgICAgKiBXaGV0aGVyIGEgcmVwb3J0ZXIgd2FzIHJlZ2lzdGVyZWQuXG4gICAgICovXG4gICAgaGFzUmVwb3J0ZXI6IGZ1bmN0aW9uIChyZXBvcnRlcikge1xuICAgICAgICBpZiAodHlwZW9mIHJlcG9ydGVyICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBgcmVwb3J0ZXJgIHRvIGJlIGEgZnVuY3Rpb25cIilcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLl8ucm9vdC5yZXBvcnRlcklkcy5pbmRleE9mKHJlcG9ydGVyKSA+PSAwXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBhIHJlcG9ydGVyLlxuICAgICAqL1xuICAgIHJlcG9ydGVyOiBmdW5jdGlvbiAocmVwb3J0ZXIsIGFyZykge1xuICAgICAgICBpZiAodHlwZW9mIHJlcG9ydGVyICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBgcmVwb3J0ZXJgIHRvIGJlIGEgZnVuY3Rpb25cIilcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciByb290ID0gdGhpcy5fLnJvb3RcblxuICAgICAgICBpZiAocm9vdC5jdXJyZW50ICE9PSByb290KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJSZXBvcnRlcnMgbWF5IG9ubHkgYmUgYWRkZWQgdG8gdGhlIHJvb3RcIilcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChyb290LnJlcG9ydGVySWRzLmluZGV4T2YocmVwb3J0ZXIpIDwgMCkge1xuICAgICAgICAgICAgcm9vdC5yZXBvcnRlcklkcy5wdXNoKHJlcG9ydGVyKVxuICAgICAgICAgICAgcm9vdC5yZXBvcnRlcnMucHVzaChyZXBvcnRlcihhcmcpKVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBhIHJlcG9ydGVyLlxuICAgICAqL1xuICAgIHJlbW92ZVJlcG9ydGVyOiBmdW5jdGlvbiAocmVwb3J0ZXIpIHtcbiAgICAgICAgaWYgKHR5cGVvZiByZXBvcnRlciAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgYHJlcG9ydGVyYCB0byBiZSBhIGZ1bmN0aW9uXCIpXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcm9vdCA9IHRoaXMuXy5yb290XG5cbiAgICAgICAgaWYgKHJvb3QuY3VycmVudCAhPT0gcm9vdCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUmVwb3J0ZXJzIG1heSBvbmx5IGJlIGFkZGVkIHRvIHRoZSByb290XCIpXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgaW5kZXggPSByb290LnJlcG9ydGVySWRzLmluZGV4T2YocmVwb3J0ZXIpXG5cbiAgICAgICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgICAgICAgIHJvb3QucmVwb3J0ZXJJZHMuc3BsaWNlKGluZGV4LCAxKVxuICAgICAgICAgICAgcm9vdC5yZXBvcnRlcnMuc3BsaWNlKGluZGV4LCAxKVxuICAgICAgICB9XG4gICAgfSxcbn0pXG5cbmZ1bmN0aW9uIFJlZmxlY3RDaGlsZChyb290KSB7XG4gICAgdGhpcy5fID0gcm9vdFxufVxuXG5tZXRob2RzKFJlZmxlY3RDaGlsZCwgUmVmbGVjdCwge1xuICAgIC8qKlxuICAgICAqIEdldCB0aGUgdGVzdCBuYW1lLCBvciBgdW5kZWZpbmVkYCBpZiBpdCdzIHRoZSByb290IHRlc3QuXG4gICAgICovXG4gICAgZ2V0IG5hbWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl8ubmFtZVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIHRlc3QgaW5kZXgsIG9yIGAtMWAgaWYgaXQncyB0aGUgcm9vdCB0ZXN0LlxuICAgICAqL1xuICAgIGdldCBpbmRleCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuXy5pbmRleFxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIHBhcmVudCB0ZXN0IGFzIGEgUmVmbGVjdC5cbiAgICAgKi9cbiAgICBnZXQgcGFyZW50KCkge1xuICAgICAgICByZXR1cm4gbmV3IFJlZmxlY3QodGhpcy5fLnBhcmVudClcbiAgICB9LFxufSlcbiIsIlwidXNlIHN0cmljdFwiXG5cbnZhciBtZXRob2RzID0gcmVxdWlyZShcIi4uL21ldGhvZHNcIilcbnZhciBUZXN0cyA9IHJlcXVpcmUoXCIuLi9jb3JlL3Rlc3RzXCIpXG52YXIgb25seUFkZCA9IHJlcXVpcmUoXCIuLi9jb3JlL29ubHlcIikub25seUFkZFxudmFyIGFkZEhvb2sgPSByZXF1aXJlKFwiLi9ob29rc1wiKS5hZGRIb29rXG52YXIgUmVmbGVjdCA9IHJlcXVpcmUoXCIuL3JlZmxlY3RcIilcblxubW9kdWxlLmV4cG9ydHMgPSBUaGFsbGl1bVxuZnVuY3Rpb24gVGhhbGxpdW0oKSB7XG4gICAgdGhpcy5fID0gVGVzdHMuY3JlYXRlUm9vdCh0aGlzKVxuICAgIC8vIEVTNiBtb2R1bGUgdHJhbnNwaWxlciBjb21wYXRpYmlsaXR5LlxuICAgIHRoaXMuZGVmYXVsdCA9IHRoaXNcbn1cblxubWV0aG9kcyhUaGFsbGl1bSwge1xuICAgIC8qKlxuICAgICAqIENhbGwgYSBwbHVnaW4gYW5kIHJldHVybiB0aGUgcmVzdWx0LiBUaGUgcGx1Z2luIGlzIGNhbGxlZCB3aXRoIGEgUmVmbGVjdFxuICAgICAqIGluc3RhbmNlIGZvciBhY2Nlc3MgdG8gcGxlbnR5IG9mIHBvdGVudGlhbGx5IHVzZWZ1bCBpbnRlcm5hbCBkZXRhaWxzLlxuICAgICAqL1xuICAgIGNhbGw6IGZ1bmN0aW9uIChwbHVnaW4sIGFyZykge1xuICAgICAgICB2YXIgcmVmbGVjdCA9IG5ldyBSZWZsZWN0KHRoaXMuXy5yb290LmN1cnJlbnQpXG5cbiAgICAgICAgcmV0dXJuIHBsdWdpbi5jYWxsKHJlZmxlY3QsIHJlZmxlY3QsIGFyZylcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogV2hpdGVsaXN0IHNwZWNpZmljIHRlc3RzLCB1c2luZyBhcnJheS1iYXNlZCBzZWxlY3RvcnMgd2hlcmUgZWFjaCBlbnRyeVxuICAgICAqIGlzIGVpdGhlciBhIHN0cmluZyBvciByZWd1bGFyIGV4cHJlc3Npb24uXG4gICAgICovXG4gICAgb25seTogZnVuY3Rpb24gKC8qIC4uLnNlbGVjdG9ycyAqLykge1xuICAgICAgICBvbmx5QWRkLmFwcGx5KHRoaXMuXy5yb290LmN1cnJlbnQsIGFyZ3VtZW50cylcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGEgcmVwb3J0ZXIuXG4gICAgICovXG4gICAgcmVwb3J0ZXI6IGZ1bmN0aW9uIChyZXBvcnRlciwgYXJnKSB7XG4gICAgICAgIGlmICh0eXBlb2YgcmVwb3J0ZXIgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGByZXBvcnRlcmAgdG8gYmUgYSBmdW5jdGlvbi5cIilcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciByb290ID0gdGhpcy5fLnJvb3RcblxuICAgICAgICBpZiAocm9vdC5jdXJyZW50ICE9PSByb290KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJSZXBvcnRlcnMgbWF5IG9ubHkgYmUgYWRkZWQgdG8gdGhlIHJvb3QuXCIpXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcmVzdWx0ID0gcmVwb3J0ZXIoYXJnKVxuXG4gICAgICAgIC8vIERvbid0IGFzc3VtZSBpdCdzIGEgZnVuY3Rpb24uIFZlcmlmeSBpdCBhY3R1YWxseSBpcywgc28gd2UgZG9uJ3QgaGF2ZVxuICAgICAgICAvLyBpbmV4cGxpY2FibGUgdHlwZSBlcnJvcnMgaW50ZXJuYWxseSBhZnRlciBpdCdzIGludm9rZWQsIGFuZCBzbyB1c2Vyc1xuICAgICAgICAvLyB3b24ndCBnZXQgdG9vIGNvbmZ1c2VkLlxuICAgICAgICBpZiAodHlwZW9mIHJlc3VsdCAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICAgICAgICAgIFwiRXhwZWN0ZWQgYHJlcG9ydGVyYCB0byByZXR1cm4gYSBmdW5jdGlvbi4gQ2hlY2sgd2l0aCB0aGUgXCIgK1xuICAgICAgICAgICAgICAgIFwicmVwb3J0ZXIncyBhdXRob3IsIGFuZCBoYXZlIHRoZW0gZml4IHRoZWlyIHJlcG9ydGVyLlwiKVxuICAgICAgICB9XG5cbiAgICAgICAgcm9vdC5yZXBvcnRlciA9IHJlc3VsdFxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIGN1cnJlbnQgdGltZW91dC4gMCBtZWFucyBpbmhlcml0IHRoZSBwYXJlbnQncywgYW5kIGBJbmZpbml0eWBcbiAgICAgKiBtZWFucyBpdCdzIGRpc2FibGVkLlxuICAgICAqL1xuICAgIGdldCB0aW1lb3V0KCkge1xuICAgICAgICByZXR1cm4gVGVzdHMudGltZW91dCh0aGlzLl8ucm9vdC5jdXJyZW50KVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgdGhlIHRpbWVvdXQgaW4gbWlsbGlzZWNvbmRzLCByb3VuZGluZyBuZWdhdGl2ZXMgdG8gMC4gU2V0dGluZyB0aGVcbiAgICAgKiB0aW1lb3V0IHRvIDAgbWVhbnMgdG8gaW5oZXJpdCB0aGUgcGFyZW50IHRpbWVvdXQsIGFuZCBzZXR0aW5nIGl0IHRvXG4gICAgICogYEluZmluaXR5YCBkaXNhYmxlcyBpdC5cbiAgICAgKi9cbiAgICBzZXQgdGltZW91dCh0aW1lb3V0KSB7XG4gICAgICAgIHZhciBjYWxjdWxhdGVkID0gTWF0aC5mbG9vcihNYXRoLm1heCgrdGltZW91dCwgMCkpXG5cbiAgICAgICAgaWYgKGNhbGN1bGF0ZWQgPT09IDApIGRlbGV0ZSB0aGlzLl8ucm9vdC5jdXJyZW50LnRpbWVvdXRcbiAgICAgICAgZWxzZSB0aGlzLl8ucm9vdC5jdXJyZW50LnRpbWVvdXQgPSBjYWxjdWxhdGVkXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgY3VycmVudCBzbG93IHRocmVzaG9sZC4gMCBtZWFucyBpbmhlcml0IHRoZSBwYXJlbnQncywgYW5kXG4gICAgICogYEluZmluaXR5YCBtZWFucyBpdCdzIGRpc2FibGVkLlxuICAgICAqL1xuICAgIGdldCBzbG93KCkge1xuICAgICAgICByZXR1cm4gVGVzdHMuc2xvdyh0aGlzLl8ucm9vdC5jdXJyZW50KVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgdGhlIHNsb3cgdGhyZXNob2xkIGluIG1pbGxpc2Vjb25kcywgcm91bmRpbmcgbmVnYXRpdmVzIHRvIDAuIFNldHRpbmdcbiAgICAgKiB0aGUgdGltZW91dCB0byAwIG1lYW5zIHRvIGluaGVyaXQgdGhlIHBhcmVudCB0aHJlc2hvbGQsIGFuZCBzZXR0aW5nIGl0IHRvXG4gICAgICogYEluZmluaXR5YCBkaXNhYmxlcyBpdC5cbiAgICAgKi9cbiAgICBzZXQgc2xvdyhzbG93KSB7XG4gICAgICAgIHZhciBjYWxjdWxhdGVkID0gTWF0aC5mbG9vcihNYXRoLm1heCgrc2xvdywgMCkpXG5cbiAgICAgICAgaWYgKGNhbGN1bGF0ZWQgPT09IDApIGRlbGV0ZSB0aGlzLl8ucm9vdC5jdXJyZW50LnNsb3dcbiAgICAgICAgZWxzZSB0aGlzLl8ucm9vdC5jdXJyZW50LnNsb3cgPSBjYWxjdWxhdGVkXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJ1biB0aGUgdGVzdHMgKG9yIHRoZSB0ZXN0J3MgdGVzdHMgaWYgaXQncyBub3QgYSBiYXNlIGluc3RhbmNlKS5cbiAgICAgKi9cbiAgICBydW46IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMuXy5yb290ICE9PSB0aGlzLl8pIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgICBcIk9ubHkgdGhlIHJvb3QgdGVzdCBjYW4gYmUgcnVuIC0gSWYgeW91IG9ubHkgd2FudCB0byBydW4gYSBcIiArXG4gICAgICAgICAgICAgICAgXCJzdWJ0ZXN0LCB1c2UgYHQub25seShbXFxcInNlbGVjdG9yMVxcXCIsIC4uLl0pYCBpbnN0ZWFkLlwiKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuXy5yb290LmxvY2tlZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2FuJ3QgcnVuIHdoaWxlIHRlc3RzIGFyZSBhbHJlYWR5IHJ1bm5pbmcuXCIpXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gVGVzdHMucnVuVGVzdCh0aGlzLl8pXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBhIHRlc3QuXG4gICAgICovXG4gICAgdGVzdDogZnVuY3Rpb24gKG5hbWUsIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgbmFtZSAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGBuYW1lYCB0byBiZSBhIHN0cmluZ1wiKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgY2FsbGJhY2sgdG8gYmUgYSBmdW5jdGlvbiBpZiBwYXNzZWRcIilcbiAgICAgICAgfVxuXG4gICAgICAgIFRlc3RzLmFkZE5vcm1hbCh0aGlzLl8ucm9vdC5jdXJyZW50LCBuYW1lLCBjYWxsYmFjaylcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGEgc2tpcHBlZCB0ZXN0LlxuICAgICAqL1xuICAgIHRlc3RTa2lwOiBmdW5jdGlvbiAobmFtZSwgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBuYW1lICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgYG5hbWVgIHRvIGJlIGEgc3RyaW5nXCIpXG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBjYWxsYmFjayB0byBiZSBhIGZ1bmN0aW9uIGlmIHBhc3NlZFwiKVxuICAgICAgICB9XG5cbiAgICAgICAgVGVzdHMuYWRkU2tpcHBlZCh0aGlzLl8ucm9vdC5jdXJyZW50LCBuYW1lKVxuICAgIH0sXG5cbiAgICBiZWZvcmU6IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBjYWxsYmFjayB0byBiZSBhIGZ1bmN0aW9uIGlmIHBhc3NlZFwiKVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHRlc3QgPSB0aGlzLl8ucm9vdC5jdXJyZW50XG5cbiAgICAgICAgdGVzdC5iZWZvcmVFYWNoID0gYWRkSG9vayh0ZXN0LmJlZm9yZUVhY2gsIGNhbGxiYWNrKVxuICAgIH0sXG5cbiAgICBiZWZvcmVBbGw6IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBjYWxsYmFjayB0byBiZSBhIGZ1bmN0aW9uIGlmIHBhc3NlZFwiKVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHRlc3QgPSB0aGlzLl8ucm9vdC5jdXJyZW50XG5cbiAgICAgICAgdGVzdC5iZWZvcmVBbGwgPSBhZGRIb29rKHRlc3QuYmVmb3JlQWxsLCBjYWxsYmFjaylcbiAgICB9LFxuXG4gICAgYWZ0ZXI6IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBjYWxsYmFjayB0byBiZSBhIGZ1bmN0aW9uIGlmIHBhc3NlZFwiKVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHRlc3QgPSB0aGlzLl8ucm9vdC5jdXJyZW50XG5cbiAgICAgICAgdGVzdC5hZnRlckVhY2ggPSBhZGRIb29rKHRlc3QuYWZ0ZXJFYWNoLCBjYWxsYmFjaylcbiAgICB9LFxuXG4gICAgYWZ0ZXJBbGw6IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBjYWxsYmFjayB0byBiZSBhIGZ1bmN0aW9uIGlmIHBhc3NlZFwiKVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHRlc3QgPSB0aGlzLl8ucm9vdC5jdXJyZW50XG5cbiAgICAgICAgdGVzdC5hZnRlckFsbCA9IGFkZEhvb2sodGVzdC5hZnRlckFsbCwgY2FsbGJhY2spXG4gICAgfSxcbn0pXG4iLCJcInVzZSBzdHJpY3RcIlxuXG52YXIgbWF0Y2ggPSByZXF1aXJlKFwiLi4vLi4vbWF0Y2hcIilcbnZhciBVdGlsID0gcmVxdWlyZShcIi4vdXRpbFwiKVxuXG5mdW5jdGlvbiBiaW5hcnkobnVtZXJpYywgY29tcGFyYXRvciwgbWVzc2FnZSkge1xuICAgIHJldHVybiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgICBpZiAobnVtZXJpYykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBhY3R1YWwgIT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYGFjdHVhbGAgbXVzdCBiZSBhIG51bWJlclwiKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodHlwZW9mIGV4cGVjdGVkICE9PSBcIm51bWJlclwiKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBleHBlY3RlZGAgbXVzdCBiZSBhIG51bWJlclwiKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFjb21wYXJhdG9yKGFjdHVhbCwgZXhwZWN0ZWQpKSB7XG4gICAgICAgICAgICBVdGlsLmZhaWwobWVzc2FnZSwge2FjdHVhbDogYWN0dWFsLCBleHBlY3RlZDogZXhwZWN0ZWR9KVxuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnRzLmVxdWFsID0gYmluYXJ5KGZhbHNlLFxuICAgIGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBVdGlsLnN0cmljdElzKGEsIGIpIH0sXG4gICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBlcXVhbCB7ZXhwZWN0ZWR9XCIpXG5cbmV4cG9ydHMubm90RXF1YWwgPSBiaW5hcnkoZmFsc2UsXG4gICAgZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuICFVdGlsLnN0cmljdElzKGEsIGIpIH0sXG4gICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgZXF1YWwge2V4cGVjdGVkfVwiKVxuXG5leHBvcnRzLmVxdWFsTG9vc2UgPSBiaW5hcnkoZmFsc2UsXG4gICAgZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIFV0aWwubG9vc2VJcyhhLCBiKSB9LFxuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbG9vc2VseSBlcXVhbCB7ZXhwZWN0ZWR9XCIpXG5cbmV4cG9ydHMubm90RXF1YWxMb29zZSA9IGJpbmFyeShmYWxzZSxcbiAgICBmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gIVV0aWwubG9vc2VJcyhhLCBiKSB9LFxuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGxvb3NlbHkgZXF1YWwge2V4cGVjdGVkfVwiKVxuXG5leHBvcnRzLmF0TGVhc3QgPSBiaW5hcnkodHJ1ZSxcbiAgICBmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYSA+PSBiIH0sXG4gICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBiZSBhdCBsZWFzdCB7ZXhwZWN0ZWR9XCIpXG5cbmV4cG9ydHMuYXRNb3N0ID0gYmluYXJ5KHRydWUsXG4gICAgZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGEgPD0gYiB9LFxuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gYmUgYXQgbW9zdCB7ZXhwZWN0ZWR9XCIpXG5cbmV4cG9ydHMuYWJvdmUgPSBiaW5hcnkodHJ1ZSxcbiAgICBmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYSA+IGIgfSxcbiAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGJlIGFib3ZlIHtleHBlY3RlZH1cIilcblxuZXhwb3J0cy5iZWxvdyA9IGJpbmFyeSh0cnVlLFxuICAgIGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBhIDwgYiB9LFxuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gYmUgYmVsb3cge2V4cGVjdGVkfVwiKVxuXG5leHBvcnRzLmJldHdlZW4gPSBmdW5jdGlvbiAoYWN0dWFsLCBsb3dlciwgdXBwZXIpIHtcbiAgICBpZiAodHlwZW9mIGFjdHVhbCAhPT0gXCJudW1iZXJcIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYGFjdHVhbGAgbXVzdCBiZSBhIG51bWJlclwiKVxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgbG93ZXIgIT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBsb3dlcmAgbXVzdCBiZSBhIG51bWJlclwiKVxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgdXBwZXIgIT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImB1cHBlcmAgbXVzdCBiZSBhIG51bWJlclwiKVxuICAgIH1cblxuICAgIC8vIFRoZSBuZWdhdGlvbiBpcyB0byBhZGRyZXNzIE5hTnMgYXMgd2VsbCwgd2l0aG91dCB3cml0aW5nIGEgdG9uIG9mIHNwZWNpYWxcbiAgICAvLyBjYXNlIGJvaWxlcnBsYXRlXG4gICAgaWYgKCEoYWN0dWFsID49IGxvd2VyICYmIGFjdHVhbCA8PSB1cHBlcikpIHtcbiAgICAgICAgVXRpbC5mYWlsKFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gYmUgYmV0d2VlbiB7bG93ZXJ9IGFuZCB7dXBwZXJ9XCIsIHtcbiAgICAgICAgICAgIGFjdHVhbDogYWN0dWFsLFxuICAgICAgICAgICAgbG93ZXI6IGxvd2VyLFxuICAgICAgICAgICAgdXBwZXI6IHVwcGVyLFxuICAgICAgICB9KVxuICAgIH1cbn1cblxuZXhwb3J0cy5kZWVwRXF1YWwgPSBiaW5hcnkoZmFsc2UsXG4gICAgZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIG1hdGNoLnN0cmljdChhLCBiKSB9LFxuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gZGVlcGx5IGVxdWFsIHtleHBlY3RlZH1cIilcblxuZXhwb3J0cy5ub3REZWVwRXF1YWwgPSBiaW5hcnkoZmFsc2UsXG4gICAgZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuICFtYXRjaC5zdHJpY3QoYSwgYikgfSxcbiAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBkZWVwbHkgZXF1YWwge2V4cGVjdGVkfVwiKVxuXG5leHBvcnRzLm1hdGNoID0gYmluYXJ5KGZhbHNlLFxuICAgIGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBtYXRjaC5tYXRjaChhLCBiKSB9LFxuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbWF0Y2gge2V4cGVjdGVkfVwiKVxuXG5leHBvcnRzLm5vdE1hdGNoID0gYmluYXJ5KGZhbHNlLFxuICAgIGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiAhbWF0Y2gubWF0Y2goYSwgYikgfSxcbiAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBtYXRjaCB7ZXhwZWN0ZWR9XCIpXG5cbi8vIFVzZXMgZGl2aXNpb24gdG8gYWxsb3cgZm9yIGEgbW9yZSByb2J1c3QgY29tcGFyaXNvbiBvZiBmbG9hdHMuIEFsc28sIHRoaXNcbi8vIGhhbmRsZXMgbmVhci16ZXJvIGNvbXBhcmlzb25zIGNvcnJlY3RseSwgYXMgd2VsbCBhcyBhIHplcm8gdG9sZXJhbmNlIChpLmUuXG4vLyBleGFjdCBjb21wYXJpc29uKS5cbmZ1bmN0aW9uIGNsb3NlVG8oZXhwZWN0ZWQsIGFjdHVhbCwgdG9sZXJhbmNlKSB7XG4gICAgaWYgKHRvbGVyYW5jZSA9PT0gSW5maW5pdHkgfHwgYWN0dWFsID09PSBleHBlY3RlZCkgcmV0dXJuIHRydWVcbiAgICBpZiAodG9sZXJhbmNlID09PSAwKSByZXR1cm4gZmFsc2VcbiAgICBpZiAoYWN0dWFsID09PSAwKSByZXR1cm4gTWF0aC5hYnMoZXhwZWN0ZWQpIDwgdG9sZXJhbmNlXG4gICAgaWYgKGV4cGVjdGVkID09PSAwKSByZXR1cm4gTWF0aC5hYnMoYWN0dWFsKSA8IHRvbGVyYW5jZVxuICAgIHJldHVybiBNYXRoLmFicyhleHBlY3RlZCAvIGFjdHVhbCAtIDEpIDwgdG9sZXJhbmNlXG59XG5cbi8vIE5vdGU6IHRoZXNlIHR3byBhbHdheXMgZmFpbCB3aGVuIGRlYWxpbmcgd2l0aCBOYU5zLlxuZXhwb3J0cy5jbG9zZVRvID0gZnVuY3Rpb24gKGV4cGVjdGVkLCBhY3R1YWwsIHRvbGVyYW5jZSkge1xuICAgIGlmICh0eXBlb2YgYWN0dWFsICE9PSBcIm51bWJlclwiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJgYWN0dWFsYCBtdXN0IGJlIGEgbnVtYmVyXCIpXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBleHBlY3RlZCAhPT0gXCJudW1iZXJcIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYGV4cGVjdGVkYCBtdXN0IGJlIGEgbnVtYmVyXCIpXG4gICAgfVxuXG4gICAgaWYgKHRvbGVyYW5jZSA9PSBudWxsKSB0b2xlcmFuY2UgPSAxZS0xMFxuXG4gICAgaWYgKHR5cGVvZiB0b2xlcmFuY2UgIT09IFwibnVtYmVyXCIgfHwgdG9sZXJhbmNlIDwgMCkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICAgICAgXCJgdG9sZXJhbmNlYCBtdXN0IGJlIGEgbm9uLW5lZ2F0aXZlIG51bWJlciBpZiBnaXZlblwiKVxuICAgIH1cblxuICAgIGlmIChhY3R1YWwgIT09IGFjdHVhbCB8fCBleHBlY3RlZCAhPT0gZXhwZWN0ZWQgfHwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1zZWxmLWNvbXBhcmUsIG1heC1sZW5cbiAgICAgICAgICAgICFjbG9zZVRvKGV4cGVjdGVkLCBhY3R1YWwsIHRvbGVyYW5jZSkpIHtcbiAgICAgICAgVXRpbC5mYWlsKFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gYmUgY2xvc2UgdG8ge2V4cGVjdGVkfVwiLCB7XG4gICAgICAgICAgICBhY3R1YWw6IGFjdHVhbCxcbiAgICAgICAgICAgIGV4cGVjdGVkOiBleHBlY3RlZCxcbiAgICAgICAgfSlcbiAgICB9XG59XG5cbmV4cG9ydHMubm90Q2xvc2VUbyA9IGZ1bmN0aW9uIChleHBlY3RlZCwgYWN0dWFsLCB0b2xlcmFuY2UpIHtcbiAgICBpZiAodHlwZW9mIGFjdHVhbCAhPT0gXCJudW1iZXJcIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYGFjdHVhbGAgbXVzdCBiZSBhIG51bWJlclwiKVxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgZXhwZWN0ZWQgIT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBleHBlY3RlZGAgbXVzdCBiZSBhIG51bWJlclwiKVxuICAgIH1cblxuICAgIGlmICh0b2xlcmFuY2UgPT0gbnVsbCkgdG9sZXJhbmNlID0gMWUtMTBcblxuICAgIGlmICh0eXBlb2YgdG9sZXJhbmNlICE9PSBcIm51bWJlclwiIHx8IHRvbGVyYW5jZSA8IDApIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICAgICAgIFwiYHRvbGVyYW5jZWAgbXVzdCBiZSBhIG5vbi1uZWdhdGl2ZSBudW1iZXIgaWYgZ2l2ZW5cIilcbiAgICB9XG5cbiAgICBpZiAoZXhwZWN0ZWQgIT09IGV4cGVjdGVkIHx8IGFjdHVhbCAhPT0gYWN0dWFsIHx8IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tc2VsZi1jb21wYXJlLCBtYXgtbGVuXG4gICAgICAgICAgICBjbG9zZVRvKGV4cGVjdGVkLCBhY3R1YWwsIHRvbGVyYW5jZSkpIHtcbiAgICAgICAgVXRpbC5mYWlsKFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGJlIGNsb3NlIHRvIHtleHBlY3RlZH1cIiwge1xuICAgICAgICAgICAgYWN0dWFsOiBhY3R1YWwsXG4gICAgICAgICAgICBleHBlY3RlZDogZXhwZWN0ZWQsXG4gICAgICAgIH0pXG4gICAgfVxufVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxudmFyIG1hdGNoID0gcmVxdWlyZShcIi4uLy4uL21hdGNoXCIpXG52YXIgVXRpbCA9IHJlcXVpcmUoXCIuL3V0aWxcIilcbnZhciBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5XG5cbmZ1bmN0aW9uIGhhc0tleXMoYWxsLCBvYmplY3QsIGtleXMpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHRlc3QgPSBoYXNPd24uY2FsbChvYmplY3QsIGtleXNbaV0pXG5cbiAgICAgICAgaWYgKHRlc3QgIT09IGFsbCkgcmV0dXJuICFhbGxcbiAgICB9XG5cbiAgICByZXR1cm4gYWxsXG59XG5cbmZ1bmN0aW9uIGhhc1ZhbHVlcyhmdW5jLCBhbGwsIG9iamVjdCwga2V5cykge1xuICAgIGlmIChvYmplY3QgPT09IGtleXMpIHJldHVybiB0cnVlXG4gICAgdmFyIGxpc3QgPSBPYmplY3Qua2V5cyhrZXlzKVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBrZXkgPSBsaXN0W2ldXG4gICAgICAgIHZhciB0ZXN0ID0gaGFzT3duLmNhbGwob2JqZWN0LCBrZXkpICYmIGZ1bmMoa2V5c1trZXldLCBvYmplY3Rba2V5XSlcblxuICAgICAgICBpZiAodGVzdCAhPT0gYWxsKSByZXR1cm4gdGVzdFxuICAgIH1cblxuICAgIHJldHVybiBhbGxcbn1cblxuZnVuY3Rpb24gbWFrZUhhc092ZXJsb2FkKGFsbCwgaW52ZXJ0LCBtZXNzYWdlKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChvYmplY3QsIGtleXMpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBvYmplY3QgIT09IFwib2JqZWN0XCIgfHwgb2JqZWN0ID09IG51bGwpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJgb2JqZWN0YCBtdXN0IGJlIGFuIG9iamVjdFwiKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBrZXlzICE9PSBcIm9iamVjdFwiIHx8IGtleXMgPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBrZXlzYCBtdXN0IGJlIGFuIG9iamVjdCBvciBhcnJheVwiKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoa2V5cykpIHtcbiAgICAgICAgICAgIGlmIChrZXlzLmxlbmd0aCAmJiBoYXNLZXlzKGFsbCwgb2JqZWN0LCBrZXlzKSA9PT0gaW52ZXJ0KSB7XG4gICAgICAgICAgICAgICAgVXRpbC5mYWlsKG1lc3NhZ2UsIHthY3R1YWw6IG9iamVjdCwga2V5czoga2V5c30pXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoT2JqZWN0LmtleXMoa2V5cykubGVuZ3RoKSB7XG4gICAgICAgICAgICBpZiAoaGFzVmFsdWVzKFV0aWwuc3RyaWN0SXMsIGFsbCwgb2JqZWN0LCBrZXlzKSA9PT0gaW52ZXJ0KSB7XG4gICAgICAgICAgICAgICAgVXRpbC5mYWlsKG1lc3NhZ2UsIHthY3R1YWw6IG9iamVjdCwga2V5czoga2V5c30pXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIG1ha2VIYXNLZXlzKGZ1bmMsIGFsbCwgaW52ZXJ0LCBtZXNzYWdlKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChvYmplY3QsIGtleXMpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBvYmplY3QgIT09IFwib2JqZWN0XCIgfHwgb2JqZWN0ID09IG51bGwpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJgb2JqZWN0YCBtdXN0IGJlIGFuIG9iamVjdFwiKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBrZXlzICE9PSBcIm9iamVjdFwiIHx8IGtleXMgPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBrZXlzYCBtdXN0IGJlIGFuIG9iamVjdFwiKVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gZXhjbHVzaXZlIG9yIHRvIGludmVydCB0aGUgcmVzdWx0IGlmIGBpbnZlcnRgIGlzIHRydWVcbiAgICAgICAgaWYgKE9iamVjdC5rZXlzKGtleXMpLmxlbmd0aCkge1xuICAgICAgICAgICAgaWYgKGhhc1ZhbHVlcyhmdW5jLCBhbGwsIG9iamVjdCwga2V5cykgPT09IGludmVydCkge1xuICAgICAgICAgICAgICAgIFV0aWwuZmFpbChtZXNzYWdlLCB7YWN0dWFsOiBvYmplY3QsIGtleXM6IGtleXN9KVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG4vKiBlc2xpbnQtZGlzYWJsZSBtYXgtbGVuICovXG5cbmV4cG9ydHMuaGFzS2V5cyA9IG1ha2VIYXNPdmVybG9hZCh0cnVlLCBmYWxzZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBoYXZlIGFsbCBrZXlzIGluIHtrZXlzfVwiKVxuZXhwb3J0cy5oYXNLZXlzRGVlcCA9IG1ha2VIYXNLZXlzKG1hdGNoLnN0cmljdCwgdHJ1ZSwgZmFsc2UsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gaGF2ZSBhbGwga2V5cyBpbiB7a2V5c31cIilcbmV4cG9ydHMuaGFzS2V5c01hdGNoID0gbWFrZUhhc0tleXMobWF0Y2gubWF0Y2gsIHRydWUsIGZhbHNlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG1hdGNoIGFsbCBrZXlzIGluIHtrZXlzfVwiKVxuZXhwb3J0cy5oYXNLZXlzQW55ID0gbWFrZUhhc092ZXJsb2FkKGZhbHNlLCBmYWxzZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBoYXZlIGFueSBrZXkgaW4ge2tleXN9XCIpXG5leHBvcnRzLmhhc0tleXNBbnlEZWVwID0gbWFrZUhhc0tleXMobWF0Y2guc3RyaWN0LCBmYWxzZSwgZmFsc2UsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gaGF2ZSBhbnkga2V5IGluIHtrZXlzfVwiKVxuZXhwb3J0cy5oYXNLZXlzQW55TWF0Y2ggPSBtYWtlSGFzS2V5cyhtYXRjaC5tYXRjaCwgZmFsc2UsIGZhbHNlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG1hdGNoIGFueSBrZXkgaW4ge2tleXN9XCIpXG5leHBvcnRzLm5vdEhhc0tleXNBbGwgPSBtYWtlSGFzT3ZlcmxvYWQodHJ1ZSwgdHJ1ZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgaGF2ZSBhbGwga2V5cyBpbiB7a2V5c31cIilcbmV4cG9ydHMubm90SGFzS2V5c0FsbERlZXAgPSBtYWtlSGFzS2V5cyhtYXRjaC5zdHJpY3QsIHRydWUsIHRydWUsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGhhdmUgYWxsIGtleXMgaW4ge2tleXN9XCIpXG5leHBvcnRzLm5vdEhhc0tleXNBbGxNYXRjaCA9IG1ha2VIYXNLZXlzKG1hdGNoLm1hdGNoLCB0cnVlLCB0cnVlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBtYXRjaCBhbGwga2V5cyBpbiB7a2V5c31cIilcbmV4cG9ydHMubm90SGFzS2V5cyA9IG1ha2VIYXNPdmVybG9hZChmYWxzZSwgdHJ1ZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgaGF2ZSBhbnkga2V5IGluIHtrZXlzfVwiKVxuZXhwb3J0cy5ub3RIYXNLZXlzRGVlcCA9IG1ha2VIYXNLZXlzKG1hdGNoLnN0cmljdCwgZmFsc2UsIHRydWUsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGhhdmUgYW55IGtleSBpbiB7a2V5c31cIilcbmV4cG9ydHMubm90SGFzS2V5c01hdGNoID0gbWFrZUhhc0tleXMobWF0Y2gubWF0Y2gsIGZhbHNlLCB0cnVlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBtYXRjaCBhbnkga2V5IGluIHtrZXlzfVwiKVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxudmFyIFV0aWwgPSByZXF1aXJlKFwiLi91dGlsXCIpXG52YXIgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eVxuXG5mdW5jdGlvbiBoYXMoXykgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1sZW4sIG1heC1wYXJhbXNcbiAgICByZXR1cm4gZnVuY3Rpb24gKG9iamVjdCwga2V5LCB2YWx1ZSkge1xuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSAzKSB7XG4gICAgICAgICAgICBpZiAoIV8uaGFzKG9iamVjdCwga2V5KSB8fFxuICAgICAgICAgICAgICAgICAgICAhVXRpbC5zdHJpY3RJcyhfLmdldChvYmplY3QsIGtleSksIHZhbHVlKSkge1xuICAgICAgICAgICAgICAgIFV0aWwuZmFpbChfLm1lc3NhZ2VzWzBdLCB7XG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiB2YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgYWN0dWFsOiBvYmplY3Rba2V5XSxcbiAgICAgICAgICAgICAgICAgICAga2V5OiBrZXksXG4gICAgICAgICAgICAgICAgICAgIG9iamVjdDogb2JqZWN0LFxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoIV8uaGFzKG9iamVjdCwga2V5KSkge1xuICAgICAgICAgICAgVXRpbC5mYWlsKF8ubWVzc2FnZXNbMV0sIHtcbiAgICAgICAgICAgICAgICBleHBlY3RlZDogdmFsdWUsXG4gICAgICAgICAgICAgICAgYWN0dWFsOiBvYmplY3Rba2V5XSxcbiAgICAgICAgICAgICAgICBrZXk6IGtleSxcbiAgICAgICAgICAgICAgICBvYmplY3Q6IG9iamVjdCxcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGhhc0xvb3NlKF8pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKG9iamVjdCwga2V5LCB2YWx1ZSkge1xuICAgICAgICBpZiAoIV8uaGFzKG9iamVjdCwga2V5KSB8fCAhVXRpbC5sb29zZUlzKF8uZ2V0KG9iamVjdCwga2V5KSwgdmFsdWUpKSB7XG4gICAgICAgICAgICBVdGlsLmZhaWwoXy5tZXNzYWdlc1swXSwge1xuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiB2YWx1ZSxcbiAgICAgICAgICAgICAgICBhY3R1YWw6IG9iamVjdFtrZXldLFxuICAgICAgICAgICAgICAgIGtleToga2V5LFxuICAgICAgICAgICAgICAgIG9iamVjdDogb2JqZWN0LFxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gbm90SGFzKF8pIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtbGVuLCBtYXgtcGFyYW1zXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChvYmplY3QsIGtleSwgdmFsdWUpIHtcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gMykge1xuICAgICAgICAgICAgaWYgKF8uaGFzKG9iamVjdCwga2V5KSAmJlxuICAgICAgICAgICAgICAgICAgICBVdGlsLnN0cmljdElzKF8uZ2V0KG9iamVjdCwga2V5KSwgdmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgVXRpbC5mYWlsKF8ubWVzc2FnZXNbMl0sIHtcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IHZhbHVlLFxuICAgICAgICAgICAgICAgICAgICBhY3R1YWw6IG9iamVjdFtrZXldLFxuICAgICAgICAgICAgICAgICAgICBrZXk6IGtleSxcbiAgICAgICAgICAgICAgICAgICAgb2JqZWN0OiBvYmplY3QsXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChfLmhhcyhvYmplY3QsIGtleSkpIHtcbiAgICAgICAgICAgIFV0aWwuZmFpbChfLm1lc3NhZ2VzWzNdLCB7XG4gICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IHZhbHVlLFxuICAgICAgICAgICAgICAgIGFjdHVhbDogb2JqZWN0W2tleV0sXG4gICAgICAgICAgICAgICAga2V5OiBrZXksXG4gICAgICAgICAgICAgICAgb2JqZWN0OiBvYmplY3QsXG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBub3RIYXNMb29zZShfKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LWxlbiwgbWF4LXBhcmFtc1xuICAgIHJldHVybiBmdW5jdGlvbiAob2JqZWN0LCBrZXksIHZhbHVlKSB7XG4gICAgICAgIGlmIChfLmhhcyhvYmplY3QsIGtleSkgJiYgVXRpbC5sb29zZUlzKF8uZ2V0KG9iamVjdCwga2V5KSwgdmFsdWUpKSB7XG4gICAgICAgICAgICBVdGlsLmZhaWwoXy5tZXNzYWdlc1syXSwge1xuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiB2YWx1ZSxcbiAgICAgICAgICAgICAgICBhY3R1YWw6IG9iamVjdFtrZXldLFxuICAgICAgICAgICAgICAgIGtleToga2V5LFxuICAgICAgICAgICAgICAgIG9iamVjdDogb2JqZWN0LFxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gaGFzT3duS2V5KG9iamVjdCwga2V5KSB7IHJldHVybiBoYXNPd24uY2FsbChvYmplY3QsIGtleSkgfVxuZnVuY3Rpb24gaGFzSW5LZXkob2JqZWN0LCBrZXkpIHsgcmV0dXJuIGtleSBpbiBvYmplY3QgfVxuZnVuY3Rpb24gaGFzSW5Db2xsKG9iamVjdCwga2V5KSB7IHJldHVybiBvYmplY3QuaGFzKGtleSkgfVxuZnVuY3Rpb24gaGFzT2JqZWN0R2V0KG9iamVjdCwga2V5KSB7IHJldHVybiBvYmplY3Rba2V5XSB9XG5mdW5jdGlvbiBoYXNDb2xsR2V0KG9iamVjdCwga2V5KSB7IHJldHVybiBvYmplY3QuZ2V0KGtleSkgfVxuXG5mdW5jdGlvbiBjcmVhdGVIYXMoaGFzLCBnZXQsIG1lc3NhZ2VzKSB7XG4gICAgcmV0dXJuIHtoYXM6IGhhcywgZ2V0OiBnZXQsIG1lc3NhZ2VzOiBtZXNzYWdlc31cbn1cblxudmFyIGhhc093bk1ldGhvZHMgPSBjcmVhdGVIYXMoaGFzT3duS2V5LCBoYXNPYmplY3RHZXQsIFtcbiAgICBcIkV4cGVjdGVkIHtvYmplY3R9IHRvIGhhdmUgb3duIGtleSB7a2V5fSBlcXVhbCB0byB7ZXhwZWN0ZWR9LCBidXQgZm91bmQge2FjdHVhbH1cIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtbGVuXG4gICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBoYXZlIG93biBrZXkge2V4cGVjdGVkfVwiLFxuICAgIFwiRXhwZWN0ZWQge29iamVjdH0gdG8gbm90IGhhdmUgb3duIGtleSB7a2V5fSBlcXVhbCB0byB7YWN0dWFsfVwiLFxuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGhhdmUgb3duIGtleSB7ZXhwZWN0ZWR9XCIsXG5dKVxuXG52YXIgaGFzS2V5TWV0aG9kcyA9IGNyZWF0ZUhhcyhoYXNJbktleSwgaGFzT2JqZWN0R2V0LCBbXG4gICAgXCJFeHBlY3RlZCB7b2JqZWN0fSB0byBoYXZlIGtleSB7a2V5fSBlcXVhbCB0byB7ZXhwZWN0ZWR9LCBidXQgZm91bmQge2FjdHVhbH1cIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtbGVuXG4gICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBoYXZlIGtleSB7ZXhwZWN0ZWR9XCIsXG4gICAgXCJFeHBlY3RlZCB7b2JqZWN0fSB0byBub3QgaGF2ZSBrZXkge2tleX0gZXF1YWwgdG8ge2FjdHVhbH1cIixcbiAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBoYXZlIGtleSB7ZXhwZWN0ZWR9XCIsXG5dKVxuXG52YXIgaGFzTWV0aG9kcyA9IGNyZWF0ZUhhcyhoYXNJbkNvbGwsIGhhc0NvbGxHZXQsIFtcbiAgICBcIkV4cGVjdGVkIHtvYmplY3R9IHRvIGhhdmUga2V5IHtrZXl9IGVxdWFsIHRvIHtleHBlY3RlZH0sIGJ1dCBmb3VuZCB7YWN0dWFsfVwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1sZW5cbiAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGhhdmUga2V5IHtleHBlY3RlZH1cIixcbiAgICBcIkV4cGVjdGVkIHtvYmplY3R9IHRvIG5vdCBoYXZlIGtleSB7a2V5fSBlcXVhbCB0byB7YWN0dWFsfVwiLFxuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGhhdmUga2V5IHtleHBlY3RlZH1cIixcbl0pXG5cbmV4cG9ydHMuaGFzT3duID0gaGFzKGhhc093bk1ldGhvZHMpXG5leHBvcnRzLm5vdEhhc093biA9IG5vdEhhcyhoYXNPd25NZXRob2RzKVxuZXhwb3J0cy5oYXNPd25Mb29zZSA9IGhhc0xvb3NlKGhhc093bk1ldGhvZHMpXG5leHBvcnRzLm5vdEhhc093bkxvb3NlID0gbm90SGFzTG9vc2UoaGFzT3duTWV0aG9kcylcblxuZXhwb3J0cy5oYXNLZXkgPSBoYXMoaGFzS2V5TWV0aG9kcylcbmV4cG9ydHMubm90SGFzS2V5ID0gbm90SGFzKGhhc0tleU1ldGhvZHMpXG5leHBvcnRzLmhhc0tleUxvb3NlID0gaGFzTG9vc2UoaGFzS2V5TWV0aG9kcylcbmV4cG9ydHMubm90SGFzS2V5TG9vc2UgPSBub3RIYXNMb29zZShoYXNLZXlNZXRob2RzKVxuXG5leHBvcnRzLmhhcyA9IGhhcyhoYXNNZXRob2RzKVxuZXhwb3J0cy5ub3RIYXMgPSBub3RIYXMoaGFzTWV0aG9kcylcbmV4cG9ydHMuaGFzTG9vc2UgPSBoYXNMb29zZShoYXNNZXRob2RzKVxuZXhwb3J0cy5ub3RIYXNMb29zZSA9IG5vdEhhc0xvb3NlKGhhc01ldGhvZHMpXG4iLCJcInVzZSBzdHJpY3RcIlxuXG52YXIgVXRpbCA9IHJlcXVpcmUoXCIuL3V0aWxcIilcbnZhciBtYXRjaCA9IHJlcXVpcmUoXCIuLi8uLi9tYXRjaFwiKVxuXG5mdW5jdGlvbiBpbmNsdWRlcyhmdW5jLCBhbGwsIGFycmF5LCB2YWx1ZXMpIHtcbiAgICAvLyBDaGVhcCBjYXNlcyBmaXJzdFxuICAgIGlmICghQXJyYXkuaXNBcnJheShhcnJheSkpIHJldHVybiBmYWxzZVxuICAgIGlmIChhcnJheSA9PT0gdmFsdWVzKSByZXR1cm4gdHJ1ZVxuICAgIGlmIChhbGwgJiYgYXJyYXkubGVuZ3RoIDwgdmFsdWVzLmxlbmd0aCkgcmV0dXJuIGZhbHNlXG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHZhbHVlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgdmFsdWUgPSB2YWx1ZXNbaV1cbiAgICAgICAgdmFyIHRlc3QgPSBmYWxzZVxuXG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgYXJyYXkubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIGlmIChmdW5jKHZhbHVlLCBhcnJheVtqXSkpIHtcbiAgICAgICAgICAgICAgICB0ZXN0ID0gdHJ1ZVxuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGVzdCAhPT0gYWxsKSByZXR1cm4gdGVzdFxuICAgIH1cblxuICAgIHJldHVybiBhbGxcbn1cblxuZnVuY3Rpb24gZGVmaW5lSW5jbHVkZXMoZnVuYywgYWxsLCBpbnZlcnQsIG1lc3NhZ2UpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGFycmF5LCB2YWx1ZXMpIHtcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGFycmF5KSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBhcnJheWAgbXVzdCBiZSBhbiBhcnJheVwiKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHZhbHVlcykpIHZhbHVlcyA9IFt2YWx1ZXNdXG5cbiAgICAgICAgaWYgKHZhbHVlcy5sZW5ndGggJiYgaW5jbHVkZXMoZnVuYywgYWxsLCBhcnJheSwgdmFsdWVzKSA9PT0gaW52ZXJ0KSB7XG4gICAgICAgICAgICBVdGlsLmZhaWwobWVzc2FnZSwge2FjdHVhbDogYXJyYXksIHZhbHVlczogdmFsdWVzfSlcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLyogZXNsaW50LWRpc2FibGUgbWF4LWxlbiAqL1xuXG5leHBvcnRzLmluY2x1ZGVzID0gZGVmaW5lSW5jbHVkZXMoVXRpbC5zdHJpY3RJcywgdHJ1ZSwgZmFsc2UsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gaGF2ZSBhbGwgdmFsdWVzIGluIHt2YWx1ZXN9XCIpXG5leHBvcnRzLmluY2x1ZGVzRGVlcCA9IGRlZmluZUluY2x1ZGVzKG1hdGNoLnN0cmljdCwgdHJ1ZSwgZmFsc2UsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbWF0Y2ggYWxsIHZhbHVlcyBpbiB7dmFsdWVzfVwiKVxuZXhwb3J0cy5pbmNsdWRlc01hdGNoID0gZGVmaW5lSW5jbHVkZXMobWF0Y2gubWF0Y2gsIHRydWUsIGZhbHNlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG1hdGNoIGFsbCB2YWx1ZXMgaW4ge3ZhbHVlc31cIilcbmV4cG9ydHMuaW5jbHVkZXNBbnkgPSBkZWZpbmVJbmNsdWRlcyhVdGlsLnN0cmljdElzLCBmYWxzZSwgZmFsc2UsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gaGF2ZSBhbnkgdmFsdWUgaW4ge3ZhbHVlc31cIilcbmV4cG9ydHMuaW5jbHVkZXNBbnlEZWVwID0gZGVmaW5lSW5jbHVkZXMobWF0Y2guc3RyaWN0LCBmYWxzZSwgZmFsc2UsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbWF0Y2ggYW55IHZhbHVlIGluIHt2YWx1ZXN9XCIpXG5leHBvcnRzLmluY2x1ZGVzQW55TWF0Y2ggPSBkZWZpbmVJbmNsdWRlcyhtYXRjaC5tYXRjaCwgZmFsc2UsIGZhbHNlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG1hdGNoIGFueSB2YWx1ZSBpbiB7dmFsdWVzfVwiKVxuZXhwb3J0cy5ub3RJbmNsdWRlc0FsbCA9IGRlZmluZUluY2x1ZGVzKFV0aWwuc3RyaWN0SXMsIHRydWUsIHRydWUsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGhhdmUgYWxsIHZhbHVlcyBpbiB7dmFsdWVzfVwiKVxuZXhwb3J0cy5ub3RJbmNsdWRlc0FsbERlZXAgPSBkZWZpbmVJbmNsdWRlcyhtYXRjaC5zdHJpY3QsIHRydWUsIHRydWUsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IG1hdGNoIGFsbCB2YWx1ZXMgaW4ge3ZhbHVlc31cIilcbmV4cG9ydHMubm90SW5jbHVkZXNBbGxNYXRjaCA9IGRlZmluZUluY2x1ZGVzKG1hdGNoLm1hdGNoLCB0cnVlLCB0cnVlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBtYXRjaCBhbGwgdmFsdWVzIGluIHt2YWx1ZXN9XCIpXG5leHBvcnRzLm5vdEluY2x1ZGVzID0gZGVmaW5lSW5jbHVkZXMoVXRpbC5zdHJpY3RJcywgZmFsc2UsIHRydWUsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGhhdmUgYW55IHZhbHVlIGluIHt2YWx1ZXN9XCIpXG5leHBvcnRzLm5vdEluY2x1ZGVzRGVlcCA9IGRlZmluZUluY2x1ZGVzKG1hdGNoLnN0cmljdCwgZmFsc2UsIHRydWUsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IG1hdGNoIGFueSB2YWx1ZSBpbiB7dmFsdWVzfVwiKVxuZXhwb3J0cy5ub3RJbmNsdWRlc01hdGNoID0gZGVmaW5lSW5jbHVkZXMobWF0Y2gubWF0Y2gsIGZhbHNlLCB0cnVlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBtYXRjaCBhbnkgdmFsdWUgaW4ge3ZhbHVlc31cIilcbiIsIlwidXNlIHN0cmljdFwiXG5cbnZhciBVdGlsID0gcmVxdWlyZShcIi4vdXRpbFwiKVxuXG5mdW5jdGlvbiBnZXROYW1lKGZ1bmMpIHtcbiAgICB2YXIgbmFtZSA9IGZ1bmMubmFtZVxuXG4gICAgaWYgKG5hbWUgPT0gbnVsbCkgbmFtZSA9IGZ1bmMuZGlzcGxheU5hbWVcbiAgICBpZiAobmFtZSkgcmV0dXJuIFV0aWwuZXNjYXBlKG5hbWUpXG4gICAgcmV0dXJuIFwiPGFub255bW91cz5cIlxufVxuXG5leHBvcnRzLnRocm93cyA9IGZ1bmN0aW9uIChUeXBlLCBjYWxsYmFjaykge1xuICAgIGlmIChjYWxsYmFjayA9PSBudWxsKSB7XG4gICAgICAgIGNhbGxiYWNrID0gVHlwZVxuICAgICAgICBUeXBlID0gbnVsbFxuICAgIH1cblxuICAgIGlmIChUeXBlICE9IG51bGwgJiYgdHlwZW9mIFR5cGUgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYFR5cGVgIG11c3QgYmUgYSBmdW5jdGlvbiBpZiBwYXNzZWRcIilcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBjYWxsYmFja2AgbXVzdCBiZSBhIGZ1bmN0aW9uXCIpXG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgICAgY2FsbGJhY2soKSAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGNhbGxiYWNrLXJldHVyblxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgaWYgKFR5cGUgIT0gbnVsbCAmJiAhKGUgaW5zdGFuY2VvZiBUeXBlKSkge1xuICAgICAgICAgICAgVXRpbC5mYWlsKFxuICAgICAgICAgICAgICAgIFwiRXhwZWN0ZWQgY2FsbGJhY2sgdG8gdGhyb3cgYW4gaW5zdGFuY2Ugb2YgXCIgKyBnZXROYW1lKFR5cGUpICtcbiAgICAgICAgICAgICAgICBcIiwgYnV0IGZvdW5kIHthY3R1YWx9XCIsXG4gICAgICAgICAgICAgICAge2FjdHVhbDogZX0pXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgdGhyb3cgbmV3IFV0aWwuQXNzZXJ0aW9uRXJyb3IoXCJFeHBlY3RlZCBjYWxsYmFjayB0byB0aHJvd1wiKVxufVxuXG5mdW5jdGlvbiB0aHJvd3NNYXRjaFRlc3QobWF0Y2hlciwgZSkge1xuICAgIGlmICh0eXBlb2YgbWF0Y2hlciA9PT0gXCJzdHJpbmdcIikgcmV0dXJuIGUubWVzc2FnZSA9PT0gbWF0Y2hlclxuICAgIGlmICh0eXBlb2YgbWF0Y2hlciA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4gISFtYXRjaGVyKGUpXG4gICAgaWYgKG1hdGNoZXIgaW5zdGFuY2VvZiBSZWdFeHApIHJldHVybiAhIW1hdGNoZXIudGVzdChlLm1lc3NhZ2UpXG5cbiAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKG1hdGNoZXIpXG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGtleSA9IGtleXNbaV1cblxuICAgICAgICBpZiAoIShrZXkgaW4gZSkgfHwgIVV0aWwuc3RyaWN0SXMobWF0Y2hlcltrZXldLCBlW2tleV0pKSByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZVxufVxuXG5mdW5jdGlvbiBpc1BsYWluT2JqZWN0KG9iamVjdCkge1xuICAgIHJldHVybiBvYmplY3QgPT0gbnVsbCB8fCBPYmplY3QuZ2V0UHJvdG90eXBlT2Yob2JqZWN0KSA9PT0gT2JqZWN0LnByb3RvdHlwZVxufVxuXG5leHBvcnRzLnRocm93c01hdGNoID0gZnVuY3Rpb24gKG1hdGNoZXIsIGNhbGxiYWNrKSB7XG4gICAgaWYgKHR5cGVvZiBtYXRjaGVyICE9PSBcInN0cmluZ1wiICYmXG4gICAgICAgICAgICB0eXBlb2YgbWF0Y2hlciAhPT0gXCJmdW5jdGlvblwiICYmXG4gICAgICAgICAgICAhKG1hdGNoZXIgaW5zdGFuY2VvZiBSZWdFeHApICYmXG4gICAgICAgICAgICAhaXNQbGFpbk9iamVjdChtYXRjaGVyKSkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICAgICAgXCJgbWF0Y2hlcmAgbXVzdCBiZSBhIHN0cmluZywgZnVuY3Rpb24sIFJlZ0V4cCwgb3Igb2JqZWN0XCIpXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJgY2FsbGJhY2tgIG11c3QgYmUgYSBmdW5jdGlvblwiKVxuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICAgIGNhbGxiYWNrKCkgLy8gZXNsaW50LWRpc2FibGUtbGluZSBjYWxsYmFjay1yZXR1cm5cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGlmICghdGhyb3dzTWF0Y2hUZXN0KG1hdGNoZXIsIGUpKSB7XG4gICAgICAgICAgICBVdGlsLmZhaWwoXG4gICAgICAgICAgICAgICAgXCJFeHBlY3RlZCBjYWxsYmFjayB0byAgdGhyb3cgYW4gZXJyb3IgdGhhdCBtYXRjaGVzIFwiICtcbiAgICAgICAgICAgICAgICBcIntleHBlY3RlZH0sIGJ1dCBmb3VuZCB7YWN0dWFsfVwiLFxuICAgICAgICAgICAgICAgIHtleHBlY3RlZDogbWF0Y2hlciwgYWN0dWFsOiBlfSlcbiAgICAgICAgfVxuICAgICAgICByZXR1cm5cbiAgICB9XG5cbiAgICB0aHJvdyBuZXcgVXRpbC5Bc3NlcnRpb25FcnJvcihcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIHRocm93LlwiKVxufVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxudmFyIGZhaWwgPSByZXF1aXJlKFwiLi91dGlsXCIpLmZhaWxcblxuZXhwb3J0cy5vayA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKCF4KSBmYWlsKFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gYmUgdHJ1dGh5XCIsIHthY3R1YWw6IHh9KVxufVxuXG5leHBvcnRzLm5vdE9rID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAoeCkgZmFpbChcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGJlIGZhbHN5XCIsIHthY3R1YWw6IHh9KVxufVxuXG5leHBvcnRzLmlzQm9vbGVhbiA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHR5cGVvZiB4ICE9PSBcImJvb2xlYW5cIikge1xuICAgICAgICBmYWlsKFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gYmUgYSBib29sZWFuXCIsIHthY3R1YWw6IHh9KVxuICAgIH1cbn1cblxuZXhwb3J0cy5ub3RCb29sZWFuID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAodHlwZW9mIHggPT09IFwiYm9vbGVhblwiKSB7XG4gICAgICAgIGZhaWwoXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgYmUgYSBib29sZWFuXCIsIHthY3R1YWw6IHh9KVxuICAgIH1cbn1cblxuZXhwb3J0cy5pc0Z1bmN0aW9uID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAodHlwZW9mIHggIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICBmYWlsKFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gYmUgYSBmdW5jdGlvblwiLCB7YWN0dWFsOiB4fSlcbiAgICB9XG59XG5cbmV4cG9ydHMubm90RnVuY3Rpb24gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh0eXBlb2YgeCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIGZhaWwoXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgYmUgYSBmdW5jdGlvblwiLCB7YWN0dWFsOiB4fSlcbiAgICB9XG59XG5cbmV4cG9ydHMuaXNOdW1iZXIgPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh0eXBlb2YgeCAhPT0gXCJudW1iZXJcIikge1xuICAgICAgICBmYWlsKFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gYmUgYSBudW1iZXJcIiwge2FjdHVhbDogeH0pXG4gICAgfVxufVxuXG5leHBvcnRzLm5vdE51bWJlciA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHR5cGVvZiB4ID09PSBcIm51bWJlclwiKSB7XG4gICAgICAgIGZhaWwoXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgYmUgYSBudW1iZXJcIiwge2FjdHVhbDogeH0pXG4gICAgfVxufVxuXG5leHBvcnRzLmlzT2JqZWN0ID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAodHlwZW9mIHggIT09IFwib2JqZWN0XCIgfHwgeCA9PSBudWxsKSB7XG4gICAgICAgIGZhaWwoXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBiZSBhbiBvYmplY3RcIiwge2FjdHVhbDogeH0pXG4gICAgfVxufVxuXG5leHBvcnRzLm5vdE9iamVjdCA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHR5cGVvZiB4ID09PSBcIm9iamVjdFwiICYmIHggIT0gbnVsbCkge1xuICAgICAgICBmYWlsKFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGJlIGFuIG9iamVjdFwiLCB7YWN0dWFsOiB4fSlcbiAgICB9XG59XG5cbmV4cG9ydHMuaXNTdHJpbmcgPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh0eXBlb2YgeCAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICBmYWlsKFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gYmUgYSBzdHJpbmdcIiwge2FjdHVhbDogeH0pXG4gICAgfVxufVxuXG5leHBvcnRzLm5vdFN0cmluZyA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHR5cGVvZiB4ID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIGZhaWwoXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgYmUgYSBzdHJpbmdcIiwge2FjdHVhbDogeH0pXG4gICAgfVxufVxuXG5leHBvcnRzLmlzU3ltYm9sID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAodHlwZW9mIHggIT09IFwic3ltYm9sXCIpIHtcbiAgICAgICAgZmFpbChcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGJlIGEgc3ltYm9sXCIsIHthY3R1YWw6IHh9KVxuICAgIH1cbn1cblxuZXhwb3J0cy5ub3RTeW1ib2wgPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh0eXBlb2YgeCA9PT0gXCJzeW1ib2xcIikge1xuICAgICAgICBmYWlsKFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGJlIGEgc3ltYm9sXCIsIHthY3R1YWw6IHh9KVxuICAgIH1cbn1cblxuZXhwb3J0cy5leGlzdHMgPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh4ID09IG51bGwpIHtcbiAgICAgICAgZmFpbChcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGV4aXN0XCIsIHthY3R1YWw6IHh9KVxuICAgIH1cbn1cblxuZXhwb3J0cy5ub3RFeGlzdHMgPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh4ICE9IG51bGwpIHtcbiAgICAgICAgZmFpbChcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBleGlzdFwiLCB7YWN0dWFsOiB4fSlcbiAgICB9XG59XG5cbmV4cG9ydHMuaXNBcnJheSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KHgpKSB7XG4gICAgICAgIGZhaWwoXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBiZSBhbiBhcnJheVwiLCB7YWN0dWFsOiB4fSlcbiAgICB9XG59XG5cbmV4cG9ydHMubm90QXJyYXkgPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmIChBcnJheS5pc0FycmF5KHgpKSB7XG4gICAgICAgIGZhaWwoXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgYmUgYW4gYXJyYXlcIiwge2FjdHVhbDogeH0pXG4gICAgfVxufVxuXG5leHBvcnRzLmlzID0gZnVuY3Rpb24gKFR5cGUsIG9iamVjdCkge1xuICAgIGlmICh0eXBlb2YgVHlwZSAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJgVHlwZWAgbXVzdCBiZSBhIGZ1bmN0aW9uXCIpXG4gICAgfVxuXG4gICAgaWYgKCEob2JqZWN0IGluc3RhbmNlb2YgVHlwZSkpIHtcbiAgICAgICAgZmFpbChcIkV4cGVjdGVkIHtvYmplY3R9IHRvIGJlIGFuIGluc3RhbmNlIG9mIHtleHBlY3RlZH1cIiwge1xuICAgICAgICAgICAgZXhwZWN0ZWQ6IFR5cGUsXG4gICAgICAgICAgICBhY3R1YWw6IG9iamVjdC5jb25zdHJ1Y3RvcixcbiAgICAgICAgICAgIG9iamVjdDogb2JqZWN0LFxuICAgICAgICB9KVxuICAgIH1cbn1cblxuZXhwb3J0cy5ub3QgPSBmdW5jdGlvbiAoVHlwZSwgb2JqZWN0KSB7XG4gICAgaWYgKHR5cGVvZiBUeXBlICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBUeXBlYCBtdXN0IGJlIGEgZnVuY3Rpb25cIilcbiAgICB9XG5cbiAgICBpZiAob2JqZWN0IGluc3RhbmNlb2YgVHlwZSkge1xuICAgICAgICBmYWlsKFwiRXhwZWN0ZWQge29iamVjdH0gdG8gbm90IGJlIGFuIGluc3RhbmNlIG9mIHtleHBlY3RlZH1cIiwge1xuICAgICAgICAgICAgZXhwZWN0ZWQ6IFR5cGUsXG4gICAgICAgICAgICBvYmplY3Q6IG9iamVjdCxcbiAgICAgICAgfSlcbiAgICB9XG59XG4iLCJcInVzZSBzdHJpY3RcIlxuXG52YXIgaW5zcGVjdCA9IHJlcXVpcmUoXCIuLi9yZXBsYWNlZC9pbnNwZWN0XCIpXG52YXIgZ2V0U3RhY2sgPSByZXF1aXJlKFwiLi4vdXRpbFwiKS5nZXRTdGFja1xudmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHlcbnZhciBBc3NlcnRpb25FcnJvclxuXG50cnkge1xuICAgIEFzc2VydGlvbkVycm9yID0gbmV3IEZ1bmN0aW9uKFsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1uZXctZnVuY1xuICAgICAgICBcIid1c2Ugc3RyaWN0JztcIixcbiAgICAgICAgXCJjbGFzcyBBc3NlcnRpb25FcnJvciBleHRlbmRzIEVycm9yIHtcIixcbiAgICAgICAgXCIgICAgY29uc3RydWN0b3IobWVzc2FnZSwgZXhwZWN0ZWQsIGFjdHVhbCkge1wiLFxuICAgICAgICBcIiAgICAgICAgc3VwZXIobWVzc2FnZSlcIixcbiAgICAgICAgXCIgICAgICAgIHRoaXMuZXhwZWN0ZWQgPSBleHBlY3RlZFwiLFxuICAgICAgICBcIiAgICAgICAgdGhpcy5hY3R1YWwgPSBhY3R1YWxcIixcbiAgICAgICAgXCIgICAgfVwiLFxuICAgICAgICBcIlwiLFxuICAgICAgICBcIiAgICBnZXQgbmFtZSgpIHtcIixcbiAgICAgICAgXCIgICAgICAgIHJldHVybiAnQXNzZXJ0aW9uRXJyb3InXCIsXG4gICAgICAgIFwiICAgIH1cIixcbiAgICAgICAgXCJ9XCIsXG4gICAgICAgIC8vIGNoZWNrIG5hdGl2ZSBzdWJjbGFzc2luZyBzdXBwb3J0XG4gICAgICAgIFwibmV3IEFzc2VydGlvbkVycm9yKCdtZXNzYWdlJywgMSwgMilcIixcbiAgICAgICAgXCJyZXR1cm4gQXNzZXJ0aW9uRXJyb3JcIixcbiAgICBdLmpvaW4oXCJcXG5cIikpKClcbn0gY2F0Y2ggKGUpIHtcbiAgICBBc3NlcnRpb25FcnJvciA9IHR5cGVvZiBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSA9PT0gXCJmdW5jdGlvblwiXG4gICAgICAgID8gZnVuY3Rpb24gQXNzZXJ0aW9uRXJyb3IobWVzc2FnZSwgZXhwZWN0ZWQsIGFjdHVhbCkge1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlID0gbWVzc2FnZSB8fCBcIlwiXG4gICAgICAgICAgICB0aGlzLmV4cGVjdGVkID0gZXhwZWN0ZWRcbiAgICAgICAgICAgIHRoaXMuYWN0dWFsID0gYWN0dWFsXG4gICAgICAgICAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSh0aGlzLCB0aGlzLmNvbnN0cnVjdG9yKVxuICAgICAgICB9XG4gICAgICAgIDogZnVuY3Rpb24gQXNzZXJ0aW9uRXJyb3IobWVzc2FnZSwgZXhwZWN0ZWQsIGFjdHVhbCkge1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlID0gbWVzc2FnZSB8fCBcIlwiXG4gICAgICAgICAgICB0aGlzLmV4cGVjdGVkID0gZXhwZWN0ZWRcbiAgICAgICAgICAgIHRoaXMuYWN0dWFsID0gYWN0dWFsXG4gICAgICAgICAgICB0aGlzLnN0YWNrID0gZ2V0U3RhY2soZSlcbiAgICAgICAgfVxuXG4gICAgQXNzZXJ0aW9uRXJyb3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShFcnJvci5wcm90b3R5cGUpXG5cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoQXNzZXJ0aW9uRXJyb3IucHJvdG90eXBlLCBcImNvbnN0cnVjdG9yXCIsIHtcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgIHZhbHVlOiBBc3NlcnRpb25FcnJvcixcbiAgICB9KVxuXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEFzc2VydGlvbkVycm9yLnByb3RvdHlwZSwgXCJuYW1lXCIsIHtcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgIHZhbHVlOiBcIkFzc2VydGlvbkVycm9yXCIsXG4gICAgfSlcbn1cblxuZXhwb3J0cy5Bc3NlcnRpb25FcnJvciA9IEFzc2VydGlvbkVycm9yXG5cbi8qIGVzbGludC1kaXNhYmxlIG5vLXNlbGYtY29tcGFyZSAqL1xuLy8gRm9yIGJldHRlciBOYU4gaGFuZGxpbmdcbmV4cG9ydHMuc3RyaWN0SXMgPSBmdW5jdGlvbiAoYSwgYikge1xuICAgIHJldHVybiBhID09PSBiIHx8IGEgIT09IGEgJiYgYiAhPT0gYlxufVxuXG5leHBvcnRzLmxvb3NlSXMgPSBmdW5jdGlvbiAoYSwgYikge1xuICAgIHJldHVybiBhID09IGIgfHwgYSAhPT0gYSAmJiBiICE9PSBiIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgZXFlcWVxXG59XG5cbi8qIGVzbGludC1lbmFibGUgbm8tc2VsZi1jb21wYXJlICovXG5cbnZhciB0ZW1wbGF0ZVJlZ2V4cCA9IC8oLj8pXFx7KC4rPylcXH0vZ1xuXG5leHBvcnRzLmVzY2FwZSA9IGZ1bmN0aW9uIChzdHJpbmcpIHtcbiAgICBpZiAodHlwZW9mIHN0cmluZyAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYHN0cmluZ2AgbXVzdCBiZSBhIHN0cmluZ1wiKVxuICAgIH1cblxuICAgIHJldHVybiBzdHJpbmcucmVwbGFjZSh0ZW1wbGF0ZVJlZ2V4cCwgZnVuY3Rpb24gKG0sIHByZSkge1xuICAgICAgICByZXR1cm4gcHJlICsgXCJcXFxcXCIgKyBtLnNsaWNlKDEpXG4gICAgfSlcbn1cblxuLy8gVGhpcyBmb3JtYXRzIHRoZSBhc3NlcnRpb24gZXJyb3IgbWVzc2FnZXMuXG5leHBvcnRzLmZvcm1hdCA9IGZ1bmN0aW9uIChtZXNzYWdlLCBhcmdzLCBwcmV0dGlmeSkge1xuICAgIGlmIChwcmV0dGlmeSA9PSBudWxsKSBwcmV0dGlmeSA9IGluc3BlY3RcblxuICAgIGlmICh0eXBlb2YgbWVzc2FnZSAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYG1lc3NhZ2VgIG11c3QgYmUgYSBzdHJpbmdcIilcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGFyZ3MgIT09IFwib2JqZWN0XCIgfHwgYXJncyA9PT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYGFyZ3NgIG11c3QgYmUgYW4gb2JqZWN0XCIpXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBwcmV0dGlmeSAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJgcHJldHRpZnlgIG11c3QgYmUgYSBmdW5jdGlvbiBpZiBwYXNzZWRcIilcbiAgICB9XG5cbiAgICByZXR1cm4gbWVzc2FnZS5yZXBsYWNlKHRlbXBsYXRlUmVnZXhwLCBmdW5jdGlvbiAobSwgcHJlLCBwcm9wKSB7XG4gICAgICAgIGlmIChwcmUgPT09IFwiXFxcXFwiKSB7XG4gICAgICAgICAgICByZXR1cm4gbS5zbGljZSgxKVxuICAgICAgICB9IGVsc2UgaWYgKGhhc093bi5jYWxsKGFyZ3MsIHByb3ApKSB7XG4gICAgICAgICAgICByZXR1cm4gcHJlICsgcHJldHRpZnkoYXJnc1twcm9wXSwge2RlcHRoOiA1fSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBwcmUgKyBtXG4gICAgICAgIH1cbiAgICB9KVxufVxuXG5leHBvcnRzLmZhaWwgPSBmdW5jdGlvbiAobWVzc2FnZSwgYXJncywgcHJldHRpZnkpIHtcbiAgICBpZiAoYXJncyA9PSBudWxsKSB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IobWVzc2FnZSlcbiAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IoXG4gICAgICAgIGV4cG9ydHMuZm9ybWF0KG1lc3NhZ2UsIGFyZ3MsIHByZXR0aWZ5KSxcbiAgICAgICAgYXJncy5leHBlY3RlZCxcbiAgICAgICAgYXJncy5hY3R1YWwpXG59XG5cbi8vIFRoZSBiYXNpYyBhc3NlcnQsIGxpa2UgYGFzc2VydC5va2AsIGJ1dCBnaXZlcyB5b3UgYW4gb3B0aW9uYWwgbWVzc2FnZS5cbmV4cG9ydHMuYXNzZXJ0ID0gZnVuY3Rpb24gKHRlc3QsIG1lc3NhZ2UpIHtcbiAgICBpZiAoIXRlc3QpIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihtZXNzYWdlKVxufVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxuLyoqXG4gKiBUaGlzIGlzIHRoZSBlbnRyeSBwb2ludCBmb3IgdGhlIEJyb3dzZXJpZnkgYnVuZGxlLiBOb3RlIHRoYXQgaXQgKmFsc28qIHdpbGxcbiAqIHJ1biBhcyBwYXJ0IG9mIHRoZSB0ZXN0cyBpbiBOb2RlICh1bmJ1bmRsZWQpLCBhbmQgaXQgdGhlb3JldGljYWxseSBjb3VsZCBiZVxuICogcnVuIGluIE5vZGUgb3IgYSBydW50aW1lIGxpbWl0ZWQgdG8gb25seSBFUzUgc3VwcG9ydCAoZS5nLiBSaGlubywgTmFzaG9ybiwgb3JcbiAqIGVtYmVkZGVkIFY4KSwgc28gZG8gKm5vdCogYXNzdW1lIGJyb3dzZXIgZ2xvYmFscyBhcmUgcHJlc2VudC5cbiAqL1xuXG5leHBvcnRzLnQgPSByZXF1aXJlKFwiLi4vaW5kZXhcIilcbmV4cG9ydHMuYXNzZXJ0ID0gcmVxdWlyZShcIi4uL2Fzc2VydFwiKVxuZXhwb3J0cy5tYXRjaCA9IHJlcXVpcmUoXCIuLi9tYXRjaFwiKVxuZXhwb3J0cy5yID0gcmVxdWlyZShcIi4uL3JcIilcblxudmFyIEludGVybmFsID0gcmVxdWlyZShcIi4uL2ludGVybmFsXCIpXG5cbmV4cG9ydHMucm9vdCA9IEludGVybmFsLnJvb3RcbmV4cG9ydHMucmVwb3J0cyA9IEludGVybmFsLnJlcG9ydHNcbmV4cG9ydHMuaG9va0Vycm9ycyA9IEludGVybmFsLmhvb2tFcnJvcnNcbmV4cG9ydHMubG9jYXRpb24gPSBJbnRlcm5hbC5sb2NhdGlvblxuXG4vLyBJbiBjYXNlIHRoZSB1c2VyIG5lZWRzIHRvIGFkanVzdCB0aGlzIChlLmcuIE5hc2hvcm4gKyBjb25zb2xlIG91dHB1dCkuXG52YXIgU2V0dGluZ3MgPSByZXF1aXJlKFwiLi9zZXR0aW5nc1wiKVxuXG5leHBvcnRzLnNldHRpbmdzID0ge1xuICAgIHdpbmRvd1dpZHRoOiB7XG4gICAgICAgIGdldDogU2V0dGluZ3Mud2luZG93V2lkdGgsXG4gICAgICAgIHNldDogU2V0dGluZ3Muc2V0V2luZG93V2lkdGgsXG4gICAgfSxcblxuICAgIG5ld2xpbmU6IHtcbiAgICAgICAgZ2V0OiBTZXR0aW5ncy5uZXdsaW5lLFxuICAgICAgICBzZXQ6IFNldHRpbmdzLnNldE5ld2xpbmUsXG4gICAgfSxcblxuICAgIHN5bWJvbHM6IHtcbiAgICAgICAgZ2V0OiBTZXR0aW5ncy5zeW1ib2xzLFxuICAgICAgICBzZXQ6IFNldHRpbmdzLnNldFN5bWJvbHMsXG4gICAgfSxcblxuICAgIGRlZmF1bHRPcHRzOiB7XG4gICAgICAgIGdldDogU2V0dGluZ3MuZGVmYXVsdE9wdHMsXG4gICAgICAgIHNldDogU2V0dGluZ3Muc2V0RGVmYXVsdE9wdHMsXG4gICAgfSxcblxuICAgIGNvbG9yU3VwcG9ydDoge1xuICAgICAgICBnZXQ6IFNldHRpbmdzLkNvbG9ycy5nZXRTdXBwb3J0LFxuICAgICAgICBzZXQ6IFNldHRpbmdzLkNvbG9ycy5zZXRTdXBwb3J0LFxuICAgIH0sXG59XG4iLCJcInVzZSBzdHJpY3RcIlxuXG4vKipcbiAqIFRoZSB3aGl0ZWxpc3QgaXMgYWN0dWFsbHkgc3RvcmVkIGFzIGEgdHJlZSBmb3IgZmFzdGVyIGxvb2t1cCB0aW1lcyB3aGVuIHRoZXJlXG4gKiBhcmUgbXVsdGlwbGUgc2VsZWN0b3JzLiBPYmplY3RzIGNhbid0IGJlIHVzZWQgZm9yIHRoZSBub2Rlcywgd2hlcmUga2V5c1xuICogcmVwcmVzZW50IHZhbHVlcyBhbmQgdmFsdWVzIHJlcHJlc2VudCBjaGlsZHJlbiwgYmVjYXVzZSByZWd1bGFyIGV4cHJlc3Npb25zXG4gKiBhcmVuJ3QgcG9zc2libGUgdG8gdXNlLlxuICovXG5cbmZ1bmN0aW9uIGlzRXF1aXZhbGVudChlbnRyeSwgaXRlbSkge1xuICAgIGlmICh0eXBlb2YgZW50cnkgPT09IFwic3RyaW5nXCIgJiYgdHlwZW9mIGl0ZW0gPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgcmV0dXJuIGVudHJ5ID09PSBpdGVtXG4gICAgfSBlbHNlIGlmIChlbnRyeSBpbnN0YW5jZW9mIFJlZ0V4cCAmJiBpdGVtIGluc3RhbmNlb2YgUmVnRXhwKSB7XG4gICAgICAgIHJldHVybiBlbnRyeS50b1N0cmluZygpID09PSBpdGVtLnRvU3RyaW5nKClcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG59XG5cbmZ1bmN0aW9uIG1hdGNoZXMoZW50cnksIGl0ZW0pIHtcbiAgICBpZiAodHlwZW9mIGVudHJ5ID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIHJldHVybiBlbnRyeSA9PT0gaXRlbVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBlbnRyeS50ZXN0KGl0ZW0pXG4gICAgfVxufVxuXG5mdW5jdGlvbiBPbmx5KHZhbHVlKSB7XG4gICAgdGhpcy52YWx1ZSA9IHZhbHVlXG4gICAgdGhpcy5jaGlsZHJlbiA9IHVuZGVmaW5lZFxufVxuXG5mdW5jdGlvbiBmaW5kRXF1aXZhbGVudChub2RlLCBlbnRyeSkge1xuICAgIGlmIChub2RlLmNoaWxkcmVuID09IG51bGwpIHJldHVybiB1bmRlZmluZWRcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbm9kZS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgY2hpbGQgPSBub2RlLmNoaWxkcmVuW2ldXG5cbiAgICAgICAgaWYgKGlzRXF1aXZhbGVudChjaGlsZC52YWx1ZSwgZW50cnkpKSByZXR1cm4gY2hpbGRcbiAgICB9XG5cbiAgICByZXR1cm4gdW5kZWZpbmVkXG59XG5cbmZ1bmN0aW9uIGZpbmRNYXRjaGVzKG5vZGUsIGVudHJ5KSB7XG4gICAgaWYgKG5vZGUuY2hpbGRyZW4gPT0gbnVsbCkgcmV0dXJuIHVuZGVmaW5lZFxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBub2RlLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBjaGlsZCA9IG5vZGUuY2hpbGRyZW5baV1cblxuICAgICAgICBpZiAobWF0Y2hlcyhjaGlsZC52YWx1ZSwgZW50cnkpKSByZXR1cm4gY2hpbGRcbiAgICB9XG5cbiAgICByZXR1cm4gdW5kZWZpbmVkXG59XG5cbi8qKlxuICogQWRkIGEgbnVtYmVyIG9mIHNlbGVjdG9yc1xuICpcbiAqIEB0aGlzIHtUZXN0fVxuICovXG5leHBvcnRzLm9ubHlBZGQgPSBmdW5jdGlvbiAoLyogLi4uc2VsZWN0b3JzICovKSB7XG4gICAgdGhpcy5vbmx5ID0gbmV3IE9ubHkoKVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHNlbGVjdG9yID0gYXJndW1lbnRzW2ldXG5cbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHNlbGVjdG9yKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICAgICAgICAgICBcIkV4cGVjdGVkIHNlbGVjdG9yIFwiICsgaSArIFwiIHRvIGJlIGFuIGFycmF5XCIpXG4gICAgICAgIH1cblxuICAgICAgICBvbmx5QWRkU2luZ2xlKHRoaXMub25seSwgc2VsZWN0b3IsIGkpXG4gICAgfVxufVxuXG5mdW5jdGlvbiBvbmx5QWRkU2luZ2xlKG5vZGUsIHNlbGVjdG9yLCBpbmRleCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2VsZWN0b3IubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGVudHJ5ID0gc2VsZWN0b3JbaV1cblxuICAgICAgICAvLyBTdHJpbmdzIGFuZCByZWd1bGFyIGV4cHJlc3Npb25zIGFyZSB0aGUgb25seSB0aGluZ3MgYWxsb3dlZC5cbiAgICAgICAgaWYgKHR5cGVvZiBlbnRyeSAhPT0gXCJzdHJpbmdcIiAmJiAhKGVudHJ5IGluc3RhbmNlb2YgUmVnRXhwKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICAgICAgICAgICBcIlNlbGVjdG9yIFwiICsgaW5kZXggKyBcIiBtdXN0IGNvbnNpc3Qgb2Ygb25seSBzdHJpbmdzIGFuZC9vciBcIiArXG4gICAgICAgICAgICAgICAgXCJyZWd1bGFyIGV4cHJlc3Npb25zXCIpXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgY2hpbGQgPSBmaW5kRXF1aXZhbGVudChub2RlLCBlbnRyeSlcblxuICAgICAgICBpZiAoY2hpbGQgPT0gbnVsbCkge1xuICAgICAgICAgICAgY2hpbGQgPSBuZXcgT25seShlbnRyeSlcbiAgICAgICAgICAgIGlmIChub2RlLmNoaWxkcmVuID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBub2RlLmNoaWxkcmVuID0gW2NoaWxkXVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBub2RlLmNoaWxkcmVuLnB1c2goY2hpbGQpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBub2RlID0gY2hpbGRcbiAgICB9XG59XG5cbi8qKlxuICogVGhpcyBjaGVja3MgaWYgdGhlIHRlc3Qgd2FzIHdoaXRlbGlzdGVkIGluIGEgYHQub25seSgpYCBjYWxsLCBvciBmb3JcbiAqIGNvbnZlbmllbmNlLCByZXR1cm5zIGB0cnVlYCBpZiBgdC5vbmx5KClgIHdhcyBuZXZlciBjYWxsZWQuXG4gKi9cbmV4cG9ydHMuaXNPbmx5ID0gZnVuY3Rpb24gKHRlc3QpIHtcbiAgICB2YXIgcGF0aCA9IFtdXG4gICAgdmFyIGkgPSAwXG5cbiAgICB3aGlsZSAodGVzdC5yb290ICE9PSB0ZXN0ICYmIHRlc3Qub25seSA9PSBudWxsKSB7XG4gICAgICAgIHBhdGgucHVzaCh0ZXN0Lm5hbWUpXG4gICAgICAgIHRlc3QgPSB0ZXN0LnBhcmVudFxuICAgICAgICBpKytcbiAgICB9XG5cbiAgICAvLyBJZiB0aGVyZSBpc24ndCBhbnkgYG9ubHlgIGFjdGl2ZSwgdGhlbiBsZXQncyBza2lwIHRoZSBjaGVjayBhbmQgcmV0dXJuXG4gICAgLy8gYHRydWVgIGZvciBjb252ZW5pZW5jZS5cbiAgICB2YXIgb25seSA9IHRlc3Qub25seVxuXG4gICAgaWYgKG9ubHkgIT0gbnVsbCkge1xuICAgICAgICB3aGlsZSAoaSAhPT0gMCkge1xuICAgICAgICAgICAgb25seSA9IGZpbmRNYXRjaGVzKG9ubHksIHBhdGhbLS1pXSlcbiAgICAgICAgICAgIGlmIChvbmx5ID09IG51bGwpIHJldHVybiBmYWxzZVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWVcbn1cbiIsIlwidXNlIHN0cmljdFwiXG5cbnZhciBtZXRob2RzID0gcmVxdWlyZShcIi4uL21ldGhvZHNcIilcblxuLyoqXG4gKiBBbGwgdGhlIHJlcG9ydCB0eXBlcy4gVGhlIG9ubHkgcmVhc29uIHRoZXJlIGFyZSBtb3JlIHRoYW4gdHdvIHR5cGVzIChub3JtYWxcbiAqIGFuZCBob29rKSBpcyBmb3IgdGhlIHVzZXIncyBiZW5lZml0IChkZXYgdG9vbHMsIGB1dGlsLmluc3BlY3RgLCBldGMuKVxuICovXG5cbnZhciBUeXBlcyA9IGV4cG9ydHMuVHlwZXMgPSBPYmplY3QuZnJlZXplKHtcbiAgICBTdGFydDogMCxcbiAgICBFbnRlcjogMSxcbiAgICBMZWF2ZTogMixcbiAgICBQYXNzOiAzLFxuICAgIEZhaWw6IDQsXG4gICAgU2tpcDogNSxcbiAgICBFbmQ6IDYsXG4gICAgRXJyb3I6IDcsXG5cbiAgICAvLyBOb3RlIHRoYXQgYEhvb2tgIGlzIGRlbm90ZWQgYnkgdGhlIDR0aCBiaXQgc2V0LCB0byBzYXZlIHNvbWUgc3BhY2UgKGFuZFxuICAgIC8vIHRvIHNpbXBsaWZ5IHRoZSB0eXBlIHJlcHJlc2VudGF0aW9uKS5cbiAgICBIb29rOiA4LFxuICAgIEJlZm9yZUFsbDogOCB8IDAsXG4gICAgQmVmb3JlRWFjaDogOCB8IDEsXG4gICAgQWZ0ZXJFYWNoOiA4IHwgMixcbiAgICBBZnRlckFsbDogOCB8IDMsXG59KVxuXG5leHBvcnRzLlJlcG9ydCA9IFJlcG9ydFxuZnVuY3Rpb24gUmVwb3J0KHR5cGUpIHtcbiAgICB0aGlzLl8gPSB0eXBlXG59XG5cbi8vIEF2b2lkIGEgcmVjdXJzaXZlIGNhbGwgd2hlbiBgaW5zcGVjdGBpbmcgYSByZXN1bHQgd2hpbGUgc3RpbGwga2VlcGluZyBpdFxuLy8gc3R5bGVkIGxpa2UgaXQgd291bGQgYmUgbm9ybWFsbHkuIEVhY2ggdHlwZSB1c2VzIGEgbmFtZWQgc2luZ2xldG9uIGZhY3RvcnkgdG9cbi8vIGVuc3VyZSBlbmdpbmVzIHNob3cgdGhlIGNvcnJlY3QgYG5hbWVgL2BkaXNwbGF5TmFtZWAgZm9yIHRoZSB0eXBlLlxuZnVuY3Rpb24gaW5pdEluc3BlY3QoaW5zcGVjdCwgcmVwb3J0KSB7XG4gICAgdmFyIHR5cGUgPSByZXBvcnQuX1xuXG4gICAgaWYgKHR5cGUgJiBUeXBlcy5Ib29rKSB7XG4gICAgICAgIGluc3BlY3Quc3RhZ2UgPSByZXBvcnQuc3RhZ2VcbiAgICB9XG5cbiAgICBpZiAodHlwZSAhPT0gVHlwZXMuU3RhcnQgJiZcbiAgICAgICAgICAgIHR5cGUgIT09IFR5cGVzLkVuZCAmJlxuICAgICAgICAgICAgdHlwZSAhPT0gVHlwZXMuRXJyb3IpIHtcbiAgICAgICAgaW5zcGVjdC5wYXRoID0gcmVwb3J0LnBhdGhcbiAgICB9XG5cbiAgICAvLyBPbmx5IGFkZCB0aGUgcmVsZXZhbnQgcHJvcGVydGllc1xuICAgIGlmICh0eXBlID09PSBUeXBlcy5GYWlsIHx8XG4gICAgICAgICAgICB0eXBlID09PSBUeXBlcy5FcnJvciB8fFxuICAgICAgICAgICAgdHlwZSAmIFR5cGVzLkhvb2spIHtcbiAgICAgICAgaW5zcGVjdC52YWx1ZSA9IHJlcG9ydC52YWx1ZVxuICAgIH1cblxuICAgIGlmICh0eXBlID09PSBUeXBlcy5FbnRlciB8fFxuICAgICAgICAgICAgdHlwZSA9PT0gVHlwZXMuUGFzcyB8fFxuICAgICAgICAgICAgdHlwZSA9PT0gVHlwZXMuRmFpbCkge1xuICAgICAgICBpbnNwZWN0LmR1cmF0aW9uID0gcmVwb3J0LmR1cmF0aW9uXG4gICAgICAgIGluc3BlY3Quc2xvdyA9IHJlcG9ydC5zbG93XG4gICAgfVxufVxuXG5tZXRob2RzKFJlcG9ydCwge1xuICAgIC8vIFRoZSByZXBvcnQgdHlwZXNcbiAgICBnZXQgaXNTdGFydCgpIHsgcmV0dXJuIHRoaXMuXyA9PT0gVHlwZXMuU3RhcnQgfSxcbiAgICBnZXQgaXNFbnRlcigpIHsgcmV0dXJuIHRoaXMuXyA9PT0gVHlwZXMuRW50ZXIgfSxcbiAgICBnZXQgaXNMZWF2ZSgpIHsgcmV0dXJuIHRoaXMuXyA9PT0gVHlwZXMuTGVhdmUgfSxcbiAgICBnZXQgaXNQYXNzKCkgeyByZXR1cm4gdGhpcy5fID09PSBUeXBlcy5QYXNzIH0sXG4gICAgZ2V0IGlzRmFpbCgpIHsgcmV0dXJuIHRoaXMuXyA9PT0gVHlwZXMuRmFpbCB9LFxuICAgIGdldCBpc1NraXAoKSB7IHJldHVybiB0aGlzLl8gPT09IFR5cGVzLlNraXAgfSxcbiAgICBnZXQgaXNFbmQoKSB7IHJldHVybiB0aGlzLl8gPT09IFR5cGVzLkVuZCB9LFxuICAgIGdldCBpc0Vycm9yKCkgeyByZXR1cm4gdGhpcy5fID09PSBUeXBlcy5FcnJvciB9LFxuICAgIGdldCBpc0hvb2soKSB7IHJldHVybiAodGhpcy5fICYgVHlwZXMuSG9vaykgIT09IDAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBhIHN0cmluZ2lmaWVkIGRlc2NyaXB0aW9uIG9mIHRoZSB0eXBlLlxuICAgICAqL1xuICAgIGdldCB0eXBlKCkge1xuICAgICAgICBzd2l0Y2ggKHRoaXMuXykge1xuICAgICAgICBjYXNlIFR5cGVzLlN0YXJ0OiByZXR1cm4gXCJzdGFydFwiXG4gICAgICAgIGNhc2UgVHlwZXMuRW50ZXI6IHJldHVybiBcImVudGVyXCJcbiAgICAgICAgY2FzZSBUeXBlcy5MZWF2ZTogcmV0dXJuIFwibGVhdmVcIlxuICAgICAgICBjYXNlIFR5cGVzLlBhc3M6IHJldHVybiBcInBhc3NcIlxuICAgICAgICBjYXNlIFR5cGVzLkZhaWw6IHJldHVybiBcImZhaWxcIlxuICAgICAgICBjYXNlIFR5cGVzLlNraXA6IHJldHVybiBcInNraXBcIlxuICAgICAgICBjYXNlIFR5cGVzLkVuZDogcmV0dXJuIFwiZW5kXCJcbiAgICAgICAgY2FzZSBUeXBlcy5FcnJvcjogcmV0dXJuIFwiZXJyb3JcIlxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgaWYgKHRoaXMuXyAmIFR5cGVzLkhvb2spIHJldHVybiBcImhvb2tcIlxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwidW5yZWFjaGFibGVcIilcbiAgICAgICAgfVxuICAgIH0sXG59KVxuXG5leHBvcnRzLlN0YXJ0ID0gU3RhcnRSZXBvcnRcbmZ1bmN0aW9uIFN0YXJ0UmVwb3J0KCkge1xuICAgIFJlcG9ydC5jYWxsKHRoaXMsIFR5cGVzLlN0YXJ0KVxufVxubWV0aG9kcyhTdGFydFJlcG9ydCwgUmVwb3J0LCB7XG4gICAgaW5zcGVjdDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IGZ1bmN0aW9uIFJlcG9ydChyZXBvcnQpIHtcbiAgICAgICAgICAgIGluaXRJbnNwZWN0KHRoaXMsIHJlcG9ydClcbiAgICAgICAgfSh0aGlzKVxuICAgIH0sXG59KVxuXG5leHBvcnRzLkVudGVyID0gRW50ZXJSZXBvcnRcbmZ1bmN0aW9uIEVudGVyUmVwb3J0KHBhdGgsIGR1cmF0aW9uLCBzbG93KSB7XG4gICAgUmVwb3J0LmNhbGwodGhpcywgVHlwZXMuRW50ZXIpXG4gICAgdGhpcy5wYXRoID0gcGF0aFxuICAgIHRoaXMuZHVyYXRpb24gPSBkdXJhdGlvblxuICAgIHRoaXMuc2xvdyA9IHNsb3dcbn1cbm1ldGhvZHMoRW50ZXJSZXBvcnQsIFJlcG9ydCwge1xuICAgIC8qKlxuICAgICAqIFNvIHV0aWwuaW5zcGVjdCBwcm92aWRlcyBtb3JlIHNlbnNpYmxlIG91dHB1dCBmb3IgdGVzdGluZy9ldGMuXG4gICAgICovXG4gICAgaW5zcGVjdDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IGZ1bmN0aW9uIEVudGVyUmVwb3J0KHJlcG9ydCkge1xuICAgICAgICAgICAgaW5pdEluc3BlY3QodGhpcywgcmVwb3J0KVxuICAgICAgICB9KHRoaXMpXG4gICAgfSxcbn0pXG5cbmV4cG9ydHMuTGVhdmUgPSBMZWF2ZVJlcG9ydFxuZnVuY3Rpb24gTGVhdmVSZXBvcnQocGF0aCkge1xuICAgIFJlcG9ydC5jYWxsKHRoaXMsIFR5cGVzLkxlYXZlKVxuICAgIHRoaXMucGF0aCA9IHBhdGhcbn1cbm1ldGhvZHMoTGVhdmVSZXBvcnQsIFJlcG9ydCwge1xuICAgIC8qKlxuICAgICAqIFNvIHV0aWwuaW5zcGVjdCBwcm92aWRlcyBtb3JlIHNlbnNpYmxlIG91dHB1dCBmb3IgdGVzdGluZy9ldGMuXG4gICAgICovXG4gICAgaW5zcGVjdDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IGZ1bmN0aW9uIExlYXZlUmVwb3J0KHJlcG9ydCkge1xuICAgICAgICAgICAgaW5pdEluc3BlY3QodGhpcywgcmVwb3J0KVxuICAgICAgICB9KHRoaXMpXG4gICAgfSxcbn0pXG5cbmV4cG9ydHMuUGFzcyA9IFBhc3NSZXBvcnRcbmZ1bmN0aW9uIFBhc3NSZXBvcnQocGF0aCwgZHVyYXRpb24sIHNsb3cpIHtcbiAgICBSZXBvcnQuY2FsbCh0aGlzLCBUeXBlcy5QYXNzKVxuICAgIHRoaXMucGF0aCA9IHBhdGhcbiAgICB0aGlzLmR1cmF0aW9uID0gZHVyYXRpb25cbiAgICB0aGlzLnNsb3cgPSBzbG93XG59XG5tZXRob2RzKFBhc3NSZXBvcnQsIFJlcG9ydCwge1xuICAgIC8qKlxuICAgICAqIFNvIHV0aWwuaW5zcGVjdCBwcm92aWRlcyBtb3JlIHNlbnNpYmxlIG91dHB1dCBmb3IgdGVzdGluZy9ldGMuXG4gICAgICovXG4gICAgaW5zcGVjdDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IGZ1bmN0aW9uIFBhc3NSZXBvcnQocmVwb3J0KSB7XG4gICAgICAgICAgICBpbml0SW5zcGVjdCh0aGlzLCByZXBvcnQpXG4gICAgICAgIH0odGhpcylcbiAgICB9LFxufSlcblxuZXhwb3J0cy5GYWlsID0gRmFpbFJlcG9ydFxuZnVuY3Rpb24gRmFpbFJlcG9ydChwYXRoLCBlcnJvciwgZHVyYXRpb24sIHNsb3cpIHtcbiAgICBSZXBvcnQuY2FsbCh0aGlzLCBUeXBlcy5GYWlsKVxuICAgIHRoaXMucGF0aCA9IHBhdGhcbiAgICB0aGlzLmVycm9yID0gZXJyb3JcbiAgICB0aGlzLmR1cmF0aW9uID0gZHVyYXRpb25cbiAgICB0aGlzLnNsb3cgPSBzbG93XG59XG5tZXRob2RzKEZhaWxSZXBvcnQsIFJlcG9ydCwge1xuICAgIC8qKlxuICAgICAqIFNvIHV0aWwuaW5zcGVjdCBwcm92aWRlcyBtb3JlIHNlbnNpYmxlIG91dHB1dCBmb3IgdGVzdGluZy9ldGMuXG4gICAgICovXG4gICAgaW5zcGVjdDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IGZ1bmN0aW9uIEZhaWxSZXBvcnQocmVwb3J0KSB7XG4gICAgICAgICAgICBpbml0SW5zcGVjdCh0aGlzLCByZXBvcnQpXG4gICAgICAgIH0odGhpcylcbiAgICB9LFxufSlcblxuZXhwb3J0cy5Ta2lwID0gU2tpcFJlcG9ydFxuZnVuY3Rpb24gU2tpcFJlcG9ydChwYXRoKSB7XG4gICAgUmVwb3J0LmNhbGwodGhpcywgVHlwZXMuU2tpcClcbiAgICB0aGlzLnBhdGggPSBwYXRoXG59XG5tZXRob2RzKFNraXBSZXBvcnQsIFJlcG9ydCwge1xuICAgIC8qKlxuICAgICAqIFNvIHV0aWwuaW5zcGVjdCBwcm92aWRlcyBtb3JlIHNlbnNpYmxlIG91dHB1dCBmb3IgdGVzdGluZy9ldGMuXG4gICAgICovXG4gICAgaW5zcGVjdDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IGZ1bmN0aW9uIFNraXBSZXBvcnQocmVwb3J0KSB7XG4gICAgICAgICAgICBpbml0SW5zcGVjdCh0aGlzLCByZXBvcnQpXG4gICAgICAgIH0odGhpcylcbiAgICB9LFxufSlcblxuZXhwb3J0cy5FbmQgPSBFbmRSZXBvcnRcbmZ1bmN0aW9uIEVuZFJlcG9ydCgpIHtcbiAgICBSZXBvcnQuY2FsbCh0aGlzLCBUeXBlcy5FbmQpXG59XG5tZXRob2RzKEVuZFJlcG9ydCwgUmVwb3J0LCB7XG4gICAgLyoqXG4gICAgICogU28gdXRpbC5pbnNwZWN0IHByb3ZpZGVzIG1vcmUgc2Vuc2libGUgb3V0cHV0IGZvciB0ZXN0aW5nL2V0Yy5cbiAgICAgKi9cbiAgICBpbnNwZWN0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgZnVuY3Rpb24gRW5kUmVwb3J0KHJlcG9ydCkge1xuICAgICAgICAgICAgaW5pdEluc3BlY3QodGhpcywgcmVwb3J0KVxuICAgICAgICB9KHRoaXMpXG4gICAgfSxcbn0pXG5cbmV4cG9ydHMuRXJyb3IgPSBFcnJvclJlcG9ydFxuZnVuY3Rpb24gRXJyb3JSZXBvcnQoZXJyb3IpIHtcbiAgICBSZXBvcnQuY2FsbCh0aGlzLCBUeXBlcy5FcnJvcilcbiAgICB0aGlzLmVycm9yID0gZXJyb3Jcbn1cbm1ldGhvZHMoRXJyb3JSZXBvcnQsIFJlcG9ydCwge1xuICAgIC8qKlxuICAgICAqIFNvIHV0aWwuaW5zcGVjdCBwcm92aWRlcyBtb3JlIHNlbnNpYmxlIG91dHB1dCBmb3IgdGVzdGluZy9ldGMuXG4gICAgICovXG4gICAgaW5zcGVjdDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IGZ1bmN0aW9uIEVycm9yUmVwb3J0KHJlcG9ydCkge1xuICAgICAgICAgICAgaW5pdEluc3BlY3QodGhpcywgcmVwb3J0KVxuICAgICAgICB9KHRoaXMpXG4gICAgfSxcbn0pXG5cbnZhciBIb29rTWV0aG9kcyA9IHtcbiAgICBnZXQgc3RhZ2UoKSB7XG4gICAgICAgIHN3aXRjaCAodGhpcy5fKSB7XG4gICAgICAgIGNhc2UgVHlwZXMuQmVmb3JlQWxsOiByZXR1cm4gXCJiZWZvcmUgYWxsXCJcbiAgICAgICAgY2FzZSBUeXBlcy5CZWZvcmVFYWNoOiByZXR1cm4gXCJiZWZvcmUgZWFjaFwiXG4gICAgICAgIGNhc2UgVHlwZXMuQWZ0ZXJFYWNoOiByZXR1cm4gXCJhZnRlciBlYWNoXCJcbiAgICAgICAgY2FzZSBUeXBlcy5BZnRlckFsbDogcmV0dXJuIFwiYWZ0ZXIgYWxsXCJcbiAgICAgICAgZGVmYXVsdDogdGhyb3cgbmV3IEVycm9yKFwidW5yZWFjaGFibGVcIilcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBnZXQgaXNCZWZvcmVBbGwoKSB7IHJldHVybiB0aGlzLl8gPT09IFR5cGVzLkJlZm9yZUFsbCB9LFxuICAgIGdldCBpc0JlZm9yZUVhY2goKSB7IHJldHVybiB0aGlzLl8gPT09IFR5cGVzLkJlZm9yZUVhY2ggfSxcbiAgICBnZXQgaXNBZnRlckVhY2goKSB7IHJldHVybiB0aGlzLl8gPT09IFR5cGVzLkFmdGVyRWFjaCB9LFxuICAgIGdldCBpc0FmdGVyQWxsKCkgeyByZXR1cm4gdGhpcy5fID09PSBUeXBlcy5BZnRlckFsbCB9LFxufVxuXG5leHBvcnRzLkhvb2tFcnJvciA9IEhvb2tFcnJvclxuZnVuY3Rpb24gSG9va0Vycm9yKHN0YWdlLCBmdW5jLCBlcnJvcikge1xuICAgIHRoaXMuXyA9IHN0YWdlXG4gICAgdGhpcy5uYW1lID0gZnVuYy5uYW1lIHx8IGZ1bmMuZGlzcGxheU5hbWUgfHwgXCJcIlxuICAgIHRoaXMuZXJyb3IgPSBlcnJvclxufVxubWV0aG9kcyhIb29rRXJyb3IsIEhvb2tNZXRob2RzKVxuXG5leHBvcnRzLkhvb2sgPSBIb29rUmVwb3J0XG5mdW5jdGlvbiBIb29rUmVwb3J0KHBhdGgsIGhvb2tFcnJvcikge1xuICAgIFJlcG9ydC5jYWxsKHRoaXMsIGhvb2tFcnJvci5fKVxuICAgIHRoaXMucGF0aCA9IHBhdGhcbiAgICB0aGlzLm5hbWUgPSBob29rRXJyb3IubmFtZVxuICAgIHRoaXMuZXJyb3IgPSBob29rRXJyb3IuZXJyb3Jcbn1cbm1ldGhvZHMoSG9va1JlcG9ydCwgUmVwb3J0LCBIb29rTWV0aG9kcywge1xuICAgIGdldCBob29rRXJyb3IoKSB7IHJldHVybiBuZXcgSG9va0Vycm9yKHRoaXMuXywgdGhpcywgdGhpcy5lcnJvcikgfSxcbn0pXG4iLCJcInVzZSBzdHJpY3RcIlxuXG52YXIgcGVhY2ggPSByZXF1aXJlKFwiLi4vdXRpbFwiKS5wZWFjaFxudmFyIFJlcG9ydHMgPSByZXF1aXJlKFwiLi9yZXBvcnRzXCIpXG52YXIgaXNPbmx5ID0gcmVxdWlyZShcIi4vb25seVwiKS5pc09ubHlcbnZhciBUeXBlcyA9IFJlcG9ydHMuVHlwZXNcblxuLyoqXG4gKiBUaGUgdGVzdHMgYXJlIGxhaWQgb3V0IGluIGEgdmVyeSBkYXRhLWRyaXZlbiBkZXNpZ24uIFdpdGggZXhjZXB0aW9uIG9mIHRoZVxuICogcmVwb3J0cywgdGhlcmUgaXMgbWluaW1hbCBvYmplY3Qgb3JpZW50YXRpb24gYW5kIHplcm8gdmlydHVhbCBkaXNwYXRjaC5cbiAqIEhlcmUncyBhIHF1aWNrIG92ZXJ2aWV3OlxuICpcbiAqIC0gVGhlIHRlc3QgaGFuZGxpbmcgZGlzcGF0Y2hlcyBiYXNlZCBvbiB2YXJpb3VzIGF0dHJpYnV0ZXMgdGhlIHRlc3QgaGFzLiBGb3JcbiAqICAgZXhhbXBsZSwgcm9vdHMgYXJlIGtub3duIGJ5IGEgY2lyY3VsYXIgcm9vdCByZWZlcmVuY2UsIGFuZCBza2lwcGVkIHRlc3RzXG4gKiAgIGFyZSBrbm93biBieSBub3QgaGF2aW5nIGEgY2FsbGJhY2suXG4gKlxuICogLSBUaGUgdGVzdCBldmFsdWF0aW9uIGlzIHZlcnkgcHJvY2VkdXJhbC4gQWx0aG91Z2ggaXQncyB2ZXJ5IGhpZ2hseVxuICogICBhc3luY2hyb25vdXMsIHRoZSB1c2Ugb2YgcHJvbWlzZXMgbGluZWFyaXplIHRoZSBsb2dpYywgc28gaXQgcmVhZHMgdmVyeVxuICogICBtdWNoIGxpa2UgYSByZWN1cnNpdmUgc2V0IG9mIHN0ZXBzLlxuICpcbiAqIC0gVGhlIGRhdGEgdHlwZXMgYXJlIG1vc3RseSBlaXRoZXIgcGxhaW4gb2JqZWN0cyBvciBjbGFzc2VzIHdpdGggbm8gbWV0aG9kcyxcbiAqICAgdGhlIGxhdHRlciBtb3N0bHkgZm9yIGRlYnVnZ2luZyBoZWxwLiBUaGlzIGFsc28gYXZvaWRzIG1vc3Qgb2YgdGhlXG4gKiAgIGluZGlyZWN0aW9uIHJlcXVpcmVkIHRvIGFjY29tbW9kYXRlIGJyZWFraW5nIGFic3RyYWN0aW9ucywgd2hpY2ggdGhlIEFQSVxuICogICBtZXRob2RzIGZyZXF1ZW50bHkgbmVlZCB0byBkby5cbiAqL1xuXG4vLyBQcmV2ZW50IFNpbm9uIGludGVyZmVyZW5jZSB3aGVuIHRoZXkgaW5zdGFsbCB0aGVpciBtb2Nrc1xudmFyIHNldFRpbWVvdXQgPSBnbG9iYWwuc2V0VGltZW91dFxudmFyIGNsZWFyVGltZW91dCA9IGdsb2JhbC5jbGVhclRpbWVvdXRcbnZhciBub3cgPSBnbG9iYWwuRGF0ZS5ub3dcblxuLyoqXG4gKiBCYXNpYyBkYXRhIHR5cGVzXG4gKi9cbmZ1bmN0aW9uIFJlc3VsdCh0aW1lLCBhdHRlbXB0KSB7XG4gICAgdGhpcy50aW1lID0gdGltZVxuICAgIHRoaXMuY2F1Z2h0ID0gYXR0ZW1wdC5jYXVnaHRcbiAgICB0aGlzLnZhbHVlID0gYXR0ZW1wdC5jYXVnaHQgPyBhdHRlbXB0LnZhbHVlIDogdW5kZWZpbmVkXG59XG5cbi8qKlxuICogT3ZlcnZpZXcgb2YgdGhlIHRlc3QgcHJvcGVydGllczpcbiAqXG4gKiAtIGBtZXRob2RzYCAtIEEgZGVwcmVjYXRlZCByZWZlcmVuY2UgdG8gdGhlIEFQSSBtZXRob2RzXG4gKiAtIGByb290YCAtIFRoZSByb290IHRlc3RcbiAqIC0gYHJlcG9ydGVyc2AgLSBUaGUgbGlzdCBvZiByZXBvcnRlcnNcbiAqIC0gYGN1cnJlbnRgIC0gQSByZWZlcmVuY2UgdG8gdGhlIGN1cnJlbnRseSBhY3RpdmUgdGVzdFxuICogLSBgdGltZW91dGAgLSBUaGUgdGVzdHMncyB0aW1lb3V0LCBvciAwIGlmIGluaGVyaXRlZFxuICogLSBgc2xvd2AgLSBUaGUgdGVzdHMncyBzbG93IHRocmVzaG9sZFxuICogLSBgbmFtZWAgLSBUaGUgdGVzdCdzIG5hbWVcbiAqIC0gYGluZGV4YCAtIFRoZSB0ZXN0J3MgaW5kZXhcbiAqIC0gYHBhcmVudGAgLSBUaGUgdGVzdCdzIHBhcmVudFxuICogLSBgY2FsbGJhY2tgIC0gVGhlIHRlc3QncyBjYWxsYmFja1xuICogLSBgdGVzdHNgIC0gVGhlIHRlc3QncyBjaGlsZCB0ZXN0c1xuICogLSBgYmVmb3JlQWxsYCwgYGJlZm9yZUVhY2hgLCBgYWZ0ZXJFYWNoYCwgYGFmdGVyQWxsYCAtIFRoZSB0ZXN0J3MgdmFyaW91c1xuICogICBzY2hlZHVsZWQgaG9va3NcbiAqXG4gKiBNYW55IG9mIHRoZXNlIHByb3BlcnRpZXMgYXJlbid0IHByZXNlbnQgb24gaW5pdGlhbGl6YXRpb24gdG8gc2F2ZSBtZW1vcnkuXG4gKi9cblxuLy8gVE9ETzogcmVtb3ZlIGB0ZXN0Lm1ldGhvZHNgIGluIDAuNFxuZnVuY3Rpb24gTm9ybWFsKG5hbWUsIGluZGV4LCBwYXJlbnQsIGNhbGxiYWNrKSB7XG4gICAgdmFyIGNoaWxkID0gT2JqZWN0LmNyZWF0ZShwYXJlbnQubWV0aG9kcylcblxuICAgIGNoaWxkLl8gPSB0aGlzXG4gICAgdGhpcy5tZXRob2RzID0gY2hpbGRcbiAgICB0aGlzLmxvY2tlZCA9IHRydWVcbiAgICB0aGlzLnJvb3QgPSBwYXJlbnQucm9vdFxuICAgIHRoaXMubmFtZSA9IG5hbWVcbiAgICB0aGlzLmluZGV4ID0gaW5kZXh8MFxuICAgIHRoaXMucGFyZW50ID0gcGFyZW50XG4gICAgdGhpcy5jYWxsYmFjayA9IGNhbGxiYWNrXG59XG5cbmZ1bmN0aW9uIFNraXBwZWQobmFtZSwgaW5kZXgsIHBhcmVudCkge1xuICAgIHRoaXMubG9ja2VkID0gdHJ1ZVxuICAgIHRoaXMucm9vdCA9IHBhcmVudC5yb290XG4gICAgdGhpcy5uYW1lID0gbmFtZVxuICAgIHRoaXMuaW5kZXggPSBpbmRleHwwXG4gICAgdGhpcy5wYXJlbnQgPSBwYXJlbnRcbn1cblxuLy8gVE9ETzogcmVtb3ZlIGB0ZXN0Lm1ldGhvZHNgIGluIDAuNFxuZnVuY3Rpb24gUm9vdChtZXRob2RzKSB7XG4gICAgdGhpcy5sb2NrZWQgPSBmYWxzZVxuICAgIHRoaXMubWV0aG9kcyA9IG1ldGhvZHNcbiAgICB0aGlzLnJlcG9ydGVySWRzID0gW11cbiAgICB0aGlzLnJlcG9ydGVycyA9IFtdXG4gICAgdGhpcy5jdXJyZW50ID0gdGhpc1xuICAgIHRoaXMucm9vdCA9IHRoaXNcbiAgICB0aGlzLnRpbWVvdXQgPSAwXG4gICAgdGhpcy5zbG93ID0gMFxufVxuXG4vKipcbiAqIEJhc2UgdGVzdHMgKGkuZS4gZGVmYXVsdCBleHBvcnQsIHJlc3VsdCBvZiBgaW50ZXJuYWwucm9vdCgpYCkuXG4gKi9cblxuZXhwb3J0cy5jcmVhdGVSb290ID0gZnVuY3Rpb24gKG1ldGhvZHMpIHtcbiAgICByZXR1cm4gbmV3IFJvb3QobWV0aG9kcylcbn1cblxuLyoqXG4gKiBTZXQgdXAgZWFjaCB0ZXN0IHR5cGUuXG4gKi9cblxuLyoqXG4gKiBBIG5vcm1hbCB0ZXN0IHRocm91Z2ggYHQudGVzdCgpYC5cbiAqL1xuXG5leHBvcnRzLmFkZE5vcm1hbCA9IGZ1bmN0aW9uIChwYXJlbnQsIG5hbWUsIGNhbGxiYWNrKSB7XG4gICAgdmFyIGluZGV4ID0gcGFyZW50LnRlc3RzICE9IG51bGwgPyBwYXJlbnQudGVzdHMubGVuZ3RoIDogMFxuICAgIHZhciBiYXNlID0gbmV3IE5vcm1hbChuYW1lLCBpbmRleCwgcGFyZW50LCBjYWxsYmFjaylcblxuICAgIGlmIChpbmRleCkge1xuICAgICAgICBwYXJlbnQudGVzdHMucHVzaChiYXNlKVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHBhcmVudC50ZXN0cyA9IFtiYXNlXVxuICAgIH1cbn1cblxuLyoqXG4gKiBBIHNraXBwZWQgdGVzdCB0aHJvdWdoIGB0LnRlc3RTa2lwKClgLlxuICovXG5leHBvcnRzLmFkZFNraXBwZWQgPSBmdW5jdGlvbiAocGFyZW50LCBuYW1lKSB7XG4gICAgdmFyIGluZGV4ID0gcGFyZW50LnRlc3RzICE9IG51bGwgPyBwYXJlbnQudGVzdHMubGVuZ3RoIDogMFxuICAgIHZhciBiYXNlID0gbmV3IFNraXBwZWQobmFtZSwgaW5kZXgsIHBhcmVudClcblxuICAgIGlmIChpbmRleCkge1xuICAgICAgICBwYXJlbnQudGVzdHMucHVzaChiYXNlKVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHBhcmVudC50ZXN0cyA9IFtiYXNlXVxuICAgIH1cbn1cblxuLyoqXG4gKiBFeGVjdXRlIHRoZSB0ZXN0c1xuICovXG5cbmZ1bmN0aW9uIHBhdGgodGVzdCkge1xuICAgIHZhciByZXQgPSBbXVxuXG4gICAgd2hpbGUgKHRlc3Qucm9vdCAhPT0gdGVzdCkge1xuICAgICAgICByZXQucHVzaCh7bmFtZTogdGVzdC5uYW1lLCBpbmRleDogdGVzdC5pbmRleHwwfSlcbiAgICAgICAgdGVzdCA9IHRlc3QucGFyZW50XG4gICAgfVxuXG4gICAgcmV0dXJuIHJldC5yZXZlcnNlKClcbn1cblxuLy8gTm90ZSB0aGF0IGEgdGltZW91dCBvZiAwIG1lYW5zIHRvIGluaGVyaXQgdGhlIHBhcmVudC5cbmV4cG9ydHMudGltZW91dCA9IHRpbWVvdXRcbmZ1bmN0aW9uIHRpbWVvdXQodGVzdCkge1xuICAgIHdoaWxlICghdGVzdC50aW1lb3V0ICYmIHRlc3Qucm9vdCAhPT0gdGVzdCkge1xuICAgICAgICB0ZXN0ID0gdGVzdC5wYXJlbnRcbiAgICB9XG5cbiAgICByZXR1cm4gdGVzdC50aW1lb3V0IHx8IDIwMDAgLy8gbXMgLSBkZWZhdWx0IHRpbWVvdXRcbn1cblxuLy8gTm90ZSB0aGF0IGEgc2xvd25lc3MgdGhyZXNob2xkIG9mIDAgbWVhbnMgdG8gaW5oZXJpdCB0aGUgcGFyZW50LlxuZXhwb3J0cy5zbG93ID0gc2xvd1xuZnVuY3Rpb24gc2xvdyh0ZXN0KSB7XG4gICAgd2hpbGUgKCF0ZXN0LnNsb3cgJiYgdGVzdC5yb290ICE9PSB0ZXN0KSB7XG4gICAgICAgIHRlc3QgPSB0ZXN0LnBhcmVudFxuICAgIH1cblxuICAgIHJldHVybiB0ZXN0LnNsb3cgfHwgNzUgLy8gbXMgLSBkZWZhdWx0IHNsb3cgdGhyZXNob2xkXG59XG5cbmZ1bmN0aW9uIHJlcG9ydCh0ZXN0LCB0eXBlLCBhcmcxLCBhcmcyKSB7XG4gICAgZnVuY3Rpb24gaW52b2tlUmVwb3J0ZXIocmVwb3J0ZXIpIHtcbiAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgIGNhc2UgVHlwZXMuU3RhcnQ6XG4gICAgICAgICAgICByZXR1cm4gcmVwb3J0ZXIobmV3IFJlcG9ydHMuU3RhcnQoKSlcblxuICAgICAgICBjYXNlIFR5cGVzLkVudGVyOlxuICAgICAgICAgICAgcmV0dXJuIHJlcG9ydGVyKG5ldyBSZXBvcnRzLkVudGVyKHBhdGgodGVzdCksIGFyZzEsIHNsb3codGVzdCkpKVxuXG4gICAgICAgIGNhc2UgVHlwZXMuTGVhdmU6XG4gICAgICAgICAgICByZXR1cm4gcmVwb3J0ZXIobmV3IFJlcG9ydHMuTGVhdmUocGF0aCh0ZXN0KSkpXG5cbiAgICAgICAgY2FzZSBUeXBlcy5QYXNzOlxuICAgICAgICAgICAgcmV0dXJuIHJlcG9ydGVyKG5ldyBSZXBvcnRzLlBhc3MocGF0aCh0ZXN0KSwgYXJnMSwgc2xvdyh0ZXN0KSkpXG5cbiAgICAgICAgY2FzZSBUeXBlcy5GYWlsOlxuICAgICAgICAgICAgcmV0dXJuIHJlcG9ydGVyKFxuICAgICAgICAgICAgICAgIG5ldyBSZXBvcnRzLkZhaWwocGF0aCh0ZXN0KSwgYXJnMSwgYXJnMiwgc2xvdyh0ZXN0KSkpXG5cbiAgICAgICAgY2FzZSBUeXBlcy5Ta2lwOlxuICAgICAgICAgICAgcmV0dXJuIHJlcG9ydGVyKG5ldyBSZXBvcnRzLlNraXAocGF0aCh0ZXN0KSkpXG5cbiAgICAgICAgY2FzZSBUeXBlcy5FbmQ6XG4gICAgICAgICAgICByZXR1cm4gcmVwb3J0ZXIobmV3IFJlcG9ydHMuRW5kKCkpXG5cbiAgICAgICAgY2FzZSBUeXBlcy5FcnJvcjpcbiAgICAgICAgICAgIHJldHVybiByZXBvcnRlcihuZXcgUmVwb3J0cy5FcnJvcihhcmcxKSlcblxuICAgICAgICBjYXNlIFR5cGVzLkhvb2s6XG4gICAgICAgICAgICByZXR1cm4gcmVwb3J0ZXIobmV3IFJlcG9ydHMuSG9vayhwYXRoKHRlc3QpLCBhcmcxKSlcblxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcInVucmVhY2hhYmxlXCIpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKClcbiAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0ZXN0LnJvb3QucmVwb3J0ZXIgPT0gbnVsbCkgcmV0dXJuIHVuZGVmaW5lZFxuICAgICAgICByZXR1cm4gaW52b2tlUmVwb3J0ZXIodGVzdC5yb290LnJlcG9ydGVyKVxuICAgIH0pXG4gICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgcmVwb3J0ZXJzID0gdGVzdC5yb290LnJlcG9ydGVyc1xuXG4gICAgICAgIC8vIFR3byBlYXN5IGNhc2VzLlxuICAgICAgICBpZiAocmVwb3J0ZXJzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHVuZGVmaW5lZFxuICAgICAgICBpZiAocmVwb3J0ZXJzLmxlbmd0aCA9PT0gMSkgcmV0dXJuIGludm9rZVJlcG9ydGVyKHJlcG9ydGVyc1swXSlcbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHJlcG9ydGVycy5tYXAoaW52b2tlUmVwb3J0ZXIpKVxuICAgIH0pXG59XG5cbi8qKlxuICogTm9ybWFsIHRlc3RzXG4gKi9cblxuLy8gUGhhbnRvbUpTIGFuZCBJRSBkb24ndCBhZGQgdGhlIHN0YWNrIHVudGlsIGl0J3MgdGhyb3duLiBJbiBmYWlsaW5nIGFzeW5jXG4vLyB0ZXN0cywgaXQncyBhbHJlYWR5IHRocm93biBpbiBhIHNlbnNlLCBzbyB0aGlzIHNob3VsZCBiZSBub3JtYWxpemVkIHdpdGhcbi8vIG90aGVyIHRlc3QgdHlwZXMuXG52YXIgbXVzdEFkZFN0YWNrID0gdHlwZW9mIG5ldyBFcnJvcigpLnN0YWNrICE9PSBcInN0cmluZ1wiXG5cbmZ1bmN0aW9uIGFkZFN0YWNrKGUpIHtcbiAgICB0cnkgeyB0aHJvdyBlIH0gZmluYWxseSB7IHJldHVybiBlIH1cbn1cblxuZnVuY3Rpb24gZ2V0VGhlbihyZXMpIHtcbiAgICBpZiAodHlwZW9mIHJlcyA9PT0gXCJvYmplY3RcIiB8fCB0eXBlb2YgcmVzID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgcmV0dXJuIHJlcy50aGVuXG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuICAgIH1cbn1cblxuZnVuY3Rpb24gQXN5bmNTdGF0ZShzdGFydCwgcmVzb2x2ZSkge1xuICAgIHRoaXMuc3RhcnQgPSBzdGFydFxuICAgIHRoaXMucmVzb2x2ZSA9IHJlc29sdmVcbiAgICB0aGlzLnJlc29sdmVkID0gZmFsc2VcbiAgICB0aGlzLnRpbWVyID0gdW5kZWZpbmVkXG59XG5cbmZ1bmN0aW9uIGFzeW5jRmluaXNoKHN0YXRlLCBhdHRlbXB0KSB7XG4gICAgLy8gQ2FwdHVyZSBpbW1lZGlhdGVseS4gV29yc3QgY2FzZSBzY2VuYXJpbywgaXQgZ2V0cyB0aHJvd24gYXdheS5cbiAgICB2YXIgZW5kID0gbm93KClcblxuICAgIGlmIChzdGF0ZS5yZXNvbHZlZCkgcmV0dXJuXG4gICAgaWYgKHN0YXRlLnRpbWVyKSB7XG4gICAgICAgIGNsZWFyVGltZW91dC5jYWxsKGdsb2JhbCwgc3RhdGUudGltZXIpXG4gICAgICAgIHN0YXRlLnRpbWVyID0gdW5kZWZpbmVkXG4gICAgfVxuXG4gICAgc3RhdGUucmVzb2x2ZWQgPSB0cnVlXG4gICAgc3RhdGUucmVzb2x2ZShuZXcgUmVzdWx0KGVuZCAtIHN0YXRlLnN0YXJ0LCBhdHRlbXB0KSlcbn1cblxuLy8gQXZvaWQgYSBjbG9zdXJlIGlmIHBvc3NpYmxlLCBpbiBjYXNlIGl0IGRvZXNuJ3QgcmV0dXJuIGEgdGhlbmFibGUuXG5mdW5jdGlvbiBpbnZva2VJbml0KHRlc3QpIHtcbiAgICB2YXIgc3RhcnQgPSBub3coKVxuICAgIHZhciB0cnlCb2R5ID0gdHJ5MSh0ZXN0LmNhbGxiYWNrLCB0ZXN0Lm1ldGhvZHMsIHRlc3QubWV0aG9kcylcblxuICAgIC8vIE5vdGU6IHN5bmNocm9ub3VzIGZhaWx1cmVzIGFyZSB0ZXN0IGZhaWx1cmVzLCBub3QgZmF0YWwgZXJyb3JzLlxuICAgIGlmICh0cnlCb2R5LmNhdWdodCkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG5ldyBSZXN1bHQobm93KCkgLSBzdGFydCwgdHJ5Qm9keSkpXG4gICAgfVxuXG4gICAgdmFyIHRyeVRoZW4gPSB0cnkxKGdldFRoZW4sIHVuZGVmaW5lZCwgdHJ5Qm9keS52YWx1ZSlcblxuICAgIGlmICh0cnlUaGVuLmNhdWdodCB8fCB0eXBlb2YgdHJ5VGhlbi52YWx1ZSAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobmV3IFJlc3VsdChub3coKSAtIHN0YXJ0LCB0cnlUaGVuKSlcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUpIHtcbiAgICAgICAgdmFyIHN0YXRlID0gbmV3IEFzeW5jU3RhdGUoc3RhcnQsIHJlc29sdmUpXG4gICAgICAgIHZhciByZXN1bHQgPSB0cnkyKHRyeVRoZW4udmFsdWUsIHRyeUJvZHkudmFsdWUsXG4gICAgICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXRlID09IG51bGwpIHJldHVyblxuICAgICAgICAgICAgICAgIGFzeW5jRmluaXNoKHN0YXRlLCB0cnlQYXNzKCkpXG4gICAgICAgICAgICAgICAgc3RhdGUgPSB1bmRlZmluZWRcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgIGlmIChzdGF0ZSA9PSBudWxsKSByZXR1cm5cbiAgICAgICAgICAgICAgICBhc3luY0ZpbmlzaChzdGF0ZSwgdHJ5RmFpbChcbiAgICAgICAgICAgICAgICAgICAgbXVzdEFkZFN0YWNrIHx8IGUgaW5zdGFuY2VvZiBFcnJvciAmJiBlLnN0YWNrID09IG51bGxcbiAgICAgICAgICAgICAgICAgICAgICAgID8gYWRkU3RhY2soZSkgOiBlKSlcbiAgICAgICAgICAgICAgICBzdGF0ZSA9IHVuZGVmaW5lZFxuICAgICAgICAgICAgfSlcblxuICAgICAgICBpZiAocmVzdWx0LmNhdWdodCkge1xuICAgICAgICAgICAgYXN5bmNGaW5pc2goc3RhdGUsIHJlc3VsdClcbiAgICAgICAgICAgIHN0YXRlID0gdW5kZWZpbmVkXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFNldCB0aGUgdGltZW91dCAqYWZ0ZXIqIGluaXRpYWxpemF0aW9uLiBUaGUgdGltZW91dCB3aWxsIGxpa2VseSBiZVxuICAgICAgICAvLyBzcGVjaWZpZWQgZHVyaW5nIGluaXRpYWxpemF0aW9uLlxuICAgICAgICB2YXIgbWF4VGltZW91dCA9IHRpbWVvdXQodGVzdClcblxuICAgICAgICAvLyBTZXR0aW5nIGEgdGltZW91dCBpcyBwb2ludGxlc3MgaWYgaXQncyBpbmZpbml0ZS5cbiAgICAgICAgaWYgKG1heFRpbWVvdXQgIT09IEluZmluaXR5KSB7XG4gICAgICAgICAgICBzdGF0ZS50aW1lciA9IHNldFRpbWVvdXQuY2FsbChnbG9iYWwsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3RhdGUgPT0gbnVsbCkgcmV0dXJuXG4gICAgICAgICAgICAgICAgYXN5bmNGaW5pc2goc3RhdGUsIHRyeUZhaWwoYWRkU3RhY2soXG4gICAgICAgICAgICAgICAgICAgIG5ldyBFcnJvcihcIlRpbWVvdXQgb2YgXCIgKyBtYXhUaW1lb3V0ICsgXCIgcmVhY2hlZFwiKSkpKVxuICAgICAgICAgICAgICAgIHN0YXRlID0gdW5kZWZpbmVkXG4gICAgICAgICAgICB9LCBtYXhUaW1lb3V0KVxuICAgICAgICB9XG4gICAgfSlcbn1cblxuZnVuY3Rpb24gaW52b2tlSG9vayhsaXN0LCBzdGFnZSkge1xuICAgIGlmIChsaXN0ID09IG51bGwpIHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuICAgIHJldHVybiBwZWFjaChsaXN0LCBmdW5jdGlvbiAoaG9vaykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0dXJuIGhvb2soKVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgUmVwb3J0cy5Ib29rRXJyb3Ioc3RhZ2UsIGhvb2ssIGUpXG4gICAgICAgIH1cbiAgICB9KVxufVxuXG5mdW5jdGlvbiBpbnZva2VCZWZvcmVFYWNoKHRlc3QpIHtcbiAgICBpZiAodGVzdC5yb290ID09PSB0ZXN0KSB7XG4gICAgICAgIHJldHVybiBpbnZva2VIb29rKHRlc3QuYmVmb3JlRWFjaCwgVHlwZXMuQmVmb3JlRWFjaClcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gaW52b2tlQmVmb3JlRWFjaCh0ZXN0LnBhcmVudCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gaW52b2tlSG9vayh0ZXN0LmJlZm9yZUVhY2gsIFR5cGVzLkJlZm9yZUVhY2gpXG4gICAgICAgIH0pXG4gICAgfVxufVxuXG5mdW5jdGlvbiBpbnZva2VBZnRlckVhY2godGVzdCkge1xuICAgIGlmICh0ZXN0LnJvb3QgPT09IHRlc3QpIHtcbiAgICAgICAgcmV0dXJuIGludm9rZUhvb2sodGVzdC5hZnRlckVhY2gsIFR5cGVzLkFmdGVyRWFjaClcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gaW52b2tlSG9vayh0ZXN0LmFmdGVyRWFjaCwgVHlwZXMuQWZ0ZXJFYWNoKVxuICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiBpbnZva2VBZnRlckVhY2godGVzdC5wYXJlbnQpIH0pXG4gICAgfVxufVxuXG5mdW5jdGlvbiBydW5DaGlsZFRlc3RzKHRlc3QpIHtcbiAgICBpZiAodGVzdC50ZXN0cyA9PSBudWxsKSByZXR1cm4gdW5kZWZpbmVkXG5cbiAgICB2YXIgcmFuID0gZmFsc2VcblxuICAgIGZ1bmN0aW9uIHJ1bkNoaWxkKGNoaWxkKSB7XG4gICAgICAgIC8vIE9ubHkgc2tpcHBlZCB0ZXN0cyBoYXZlIG5vIGNhbGxiYWNrXG4gICAgICAgIGlmIChjaGlsZC5jYWxsYmFjayA9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVwb3J0KGNoaWxkLCBUeXBlcy5Ta2lwKVxuICAgICAgICB9IGVsc2UgaWYgKCFpc09ubHkoY2hpbGQpKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKClcbiAgICAgICAgfSBlbHNlIGlmIChyYW4pIHtcbiAgICAgICAgICAgIHJldHVybiBpbnZva2VCZWZvcmVFYWNoKHRlc3QpXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiBydW5Ob3JtYWxDaGlsZChjaGlsZCkgfSlcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIGludm9rZUFmdGVyRWFjaCh0ZXN0KSB9KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmFuID0gdHJ1ZVxuICAgICAgICAgICAgcmV0dXJuIGludm9rZUhvb2sodGVzdC5iZWZvcmVBbGwsIFR5cGVzLkJlZm9yZUFsbClcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIGludm9rZUJlZm9yZUVhY2godGVzdCkgfSlcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIHJ1bk5vcm1hbENoaWxkKGNoaWxkKSB9KVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gaW52b2tlQWZ0ZXJFYWNoKHRlc3QpIH0pXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBydW5BbGxDaGlsZHJlbigpIHtcbiAgICAgICAgaWYgKHRlc3QudGVzdHMgPT0gbnVsbCkgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpXG4gICAgICAgIHJldHVybiBwZWFjaCh0ZXN0LnRlc3RzLCBmdW5jdGlvbiAoY2hpbGQpIHtcbiAgICAgICAgICAgIHRlc3Qucm9vdC5jdXJyZW50ID0gY2hpbGRcbiAgICAgICAgICAgIHJldHVybiBydW5DaGlsZChjaGlsZCkudGhlbihcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoKSB7IHRlc3Qucm9vdC5jdXJyZW50ID0gdGVzdCB9LFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChlKSB7IHRlc3Qucm9vdC5jdXJyZW50ID0gdGVzdDsgdGhyb3cgZSB9KVxuICAgICAgICB9KVxuICAgIH1cblxuICAgIHJldHVybiBydW5BbGxDaGlsZHJlbigpXG4gICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gcmFuID8gaW52b2tlSG9vayh0ZXN0LmFmdGVyQWxsLCBUeXBlcy5BZnRlckFsbCkgOiB1bmRlZmluZWRcbiAgICB9KVxuICAgIC5jYXRjaChmdW5jdGlvbiAoZSkge1xuICAgICAgICBpZiAoIShlIGluc3RhbmNlb2YgUmVwb3J0cy5Ib29rRXJyb3IpKSB0aHJvdyBlXG4gICAgICAgIHJldHVybiByZXBvcnQodGVzdCwgVHlwZXMuSG9vaywgZSlcbiAgICB9KVxufVxuXG5mdW5jdGlvbiBjbGVhckNoaWxkcmVuKHRlc3QpIHtcbiAgICBpZiAodGVzdC50ZXN0cyA9PSBudWxsKSByZXR1cm5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRlc3QudGVzdHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgZGVsZXRlIHRlc3QudGVzdHNbaV0udGVzdHNcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHJ1bk5vcm1hbENoaWxkKHRlc3QpIHtcbiAgICB0ZXN0LmxvY2tlZCA9IGZhbHNlXG5cbiAgICByZXR1cm4gaW52b2tlSW5pdCh0ZXN0KVxuICAgIC50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgdGVzdC5sb2NrZWQgPSB0cnVlXG5cbiAgICAgICAgaWYgKHJlc3VsdC5jYXVnaHQpIHtcbiAgICAgICAgICAgIHJldHVybiByZXBvcnQodGVzdCwgVHlwZXMuRmFpbCwgcmVzdWx0LnZhbHVlLCByZXN1bHQudGltZSlcbiAgICAgICAgfSBlbHNlIGlmICh0ZXN0LnRlc3RzICE9IG51bGwpIHtcbiAgICAgICAgICAgIC8vIFJlcG9ydCB0aGlzIGFzIGlmIGl0IHdhcyBhIHBhcmVudCB0ZXN0IGlmIGl0J3MgcGFzc2luZyBhbmQgaGFzXG4gICAgICAgICAgICAvLyBjaGlsZHJlbi5cbiAgICAgICAgICAgIHJldHVybiByZXBvcnQodGVzdCwgVHlwZXMuRW50ZXIsIHJlc3VsdC50aW1lKVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gcnVuQ2hpbGRUZXN0cyh0ZXN0KSB9KVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gcmVwb3J0KHRlc3QsIFR5cGVzLkxlYXZlKSB9KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHJlcG9ydCh0ZXN0LCBUeXBlcy5QYXNzLCByZXN1bHQudGltZSlcbiAgICAgICAgfVxuICAgIH0pXG4gICAgLnRoZW4oXG4gICAgICAgIGZ1bmN0aW9uICgpIHsgY2xlYXJDaGlsZHJlbih0ZXN0KSB9LFxuICAgICAgICBmdW5jdGlvbiAoZSkgeyBjbGVhckNoaWxkcmVuKHRlc3QpOyB0aHJvdyBlIH0pXG59XG5cbi8qKlxuICogVGhpcyBydW5zIHRoZSByb290IHRlc3QgYW5kIHJldHVybnMgYSBwcm9taXNlIHJlc29sdmVkIHdoZW4gaXQncyBkb25lLlxuICovXG5leHBvcnRzLnJ1blRlc3QgPSBmdW5jdGlvbiAodGVzdCkge1xuICAgIHRlc3QubG9ja2VkID0gdHJ1ZVxuXG4gICAgcmV0dXJuIHJlcG9ydCh0ZXN0LCBUeXBlcy5TdGFydClcbiAgICAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiBydW5DaGlsZFRlc3RzKHRlc3QpIH0pXG4gICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gcmVwb3J0KHRlc3QsIFR5cGVzLkVuZCkgfSlcbiAgICAvLyBUZWxsIHRoZSByZXBvcnRlciBzb21ldGhpbmcgaGFwcGVuZWQuIE90aGVyd2lzZSwgaXQnbGwgaGF2ZSB0byB3cmFwIHRoaXNcbiAgICAvLyBtZXRob2QgaW4gYSBwbHVnaW4sIHdoaWNoIHNob3VsZG4ndCBiZSBuZWNlc3NhcnkuXG4gICAgLmNhdGNoKGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHJldHVybiByZXBvcnQodGVzdCwgVHlwZXMuRXJyb3IsIGUpLnRoZW4oZnVuY3Rpb24gKCkgeyB0aHJvdyBlIH0pXG4gICAgfSlcbiAgICAudGhlbihcbiAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY2xlYXJDaGlsZHJlbih0ZXN0KVxuICAgICAgICAgICAgdGVzdC5sb2NrZWQgPSBmYWxzZVxuICAgICAgICB9LFxuICAgICAgICBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgY2xlYXJDaGlsZHJlbih0ZXN0KVxuICAgICAgICAgICAgdGVzdC5sb2NrZWQgPSBmYWxzZVxuICAgICAgICAgICAgdGhyb3cgZVxuICAgICAgICB9KVxufVxuXG4vLyBIZWxwIG9wdGltaXplIGZvciBpbmVmZmljaWVudCBleGNlcHRpb24gaGFuZGxpbmcgaW4gVjhcblxuZnVuY3Rpb24gdHJ5UGFzcyh2YWx1ZSkge1xuICAgIHJldHVybiB7Y2F1Z2h0OiBmYWxzZSwgdmFsdWU6IHZhbHVlfVxufVxuXG5mdW5jdGlvbiB0cnlGYWlsKGUpIHtcbiAgICByZXR1cm4ge2NhdWdodDogdHJ1ZSwgdmFsdWU6IGV9XG59XG5cbmZ1bmN0aW9uIHRyeTEoZiwgaW5zdCwgYXJnMCkge1xuICAgIHRyeSB7XG4gICAgICAgIHJldHVybiB0cnlQYXNzKGYuY2FsbChpbnN0LCBhcmcwKSlcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHJldHVybiB0cnlGYWlsKGUpXG4gICAgfVxufVxuXG5mdW5jdGlvbiB0cnkyKGYsIGluc3QsIGFyZzAsIGFyZzEpIHtcbiAgICB0cnkge1xuICAgICAgICByZXR1cm4gdHJ5UGFzcyhmLmNhbGwoaW5zdCwgYXJnMCwgYXJnMSkpXG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICByZXR1cm4gdHJ5RmFpbChlKVxuICAgIH1cbn1cbiIsIlwidXNlIHN0cmljdFwiXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKEJhc2UsIFN1cGVyKSB7XG4gICAgdmFyIHN0YXJ0ID0gMlxuXG4gICAgaWYgKHR5cGVvZiBTdXBlciA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIEJhc2UucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShTdXBlci5wcm90b3R5cGUpXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShCYXNlLnByb3RvdHlwZSwgXCJjb25zdHJ1Y3RvclwiLCB7XG4gICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICAgICAgdmFsdWU6IEJhc2UsXG4gICAgICAgIH0pXG4gICAgfSBlbHNlIHtcbiAgICAgICAgc3RhcnQgPSAxXG4gICAgfVxuXG4gICAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBtZXRob2RzID0gYXJndW1lbnRzW2ldXG5cbiAgICAgICAgaWYgKG1ldGhvZHMgIT0gbnVsbCkge1xuICAgICAgICAgICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhtZXRob2RzKVxuXG4gICAgICAgICAgICBmb3IgKHZhciBrID0gMDsgayA8IGtleXMubGVuZ3RoOyBrKyspIHtcbiAgICAgICAgICAgICAgICB2YXIga2V5ID0ga2V5c1trXVxuICAgICAgICAgICAgICAgIHZhciBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihtZXRob2RzLCBrZXkpXG5cbiAgICAgICAgICAgICAgICBkZXNjLmVudW1lcmFibGUgPSBmYWxzZVxuICAgICAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShCYXNlLnByb3RvdHlwZSwga2V5LCBkZXNjKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxuLyoqXG4gKiBUaGlzIGNvbnRhaW5zIHRoZSBicm93c2VyIGNvbnNvbGUgc3R1ZmYuXG4gKi9cblxuZXhwb3J0cy5TeW1ib2xzID0gT2JqZWN0LmZyZWV6ZSh7XG4gICAgUGFzczogXCLinJNcIixcbiAgICBGYWlsOiBcIuKcllwiLFxuICAgIERvdDogXCLigKRcIixcbn0pXG5cbmV4cG9ydHMud2luZG93V2lkdGggPSA3NVxuZXhwb3J0cy5uZXdsaW5lID0gXCJcXG5cIlxuXG4vLyBDb2xvciBzdXBwb3J0IGlzIHVuZm9yY2VkIGFuZCB1bnN1cHBvcnRlZCwgc2luY2UgeW91IGNhbiBvbmx5IHNwZWNpZnlcbi8vIGxpbmUtYnktbGluZSBjb2xvcnMgdmlhIENTUywgYW5kIGV2ZW4gdGhhdCBpc24ndCB2ZXJ5IHBvcnRhYmxlLlxuZXhwb3J0cy5jb2xvclN1cHBvcnQgPSAwXG5cbi8qKlxuICogU2luY2UgYnJvd3NlcnMgZG9uJ3QgaGF2ZSB1bmJ1ZmZlcmVkIG91dHB1dCwgdGhpcyBraW5kIG9mIHNpbXVsYXRlcyBpdC5cbiAqL1xuXG52YXIgYWNjID0gXCJcIlxuXG5leHBvcnRzLmRlZmF1bHRPcHRzID0ge1xuICAgIHdyaXRlOiBmdW5jdGlvbiAoc3RyKSB7XG4gICAgICAgIGFjYyArPSBzdHJcblxuICAgICAgICB2YXIgaW5kZXggPSBzdHIuaW5kZXhPZihcIlxcblwiKVxuXG4gICAgICAgIGlmIChpbmRleCA+PSAwKSB7XG4gICAgICAgICAgICB2YXIgbGluZXMgPSBzdHIuc3BsaXQoXCJcXG5cIilcblxuICAgICAgICAgICAgYWNjID0gbGluZXMucG9wKClcblxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaW5lcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGdsb2JhbC5jb25zb2xlLmxvZyhsaW5lc1tpXSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICByZXNldDogZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoYWNjICE9PSBcIlwiKSB7XG4gICAgICAgICAgICBnbG9iYWwuY29uc29sZS5sb2coYWNjKVxuICAgICAgICAgICAgYWNjID0gXCJcIlxuICAgICAgICB9XG4gICAgfSxcbn1cbiIsIlwidXNlIHN0cmljdFwiXG5cbnZhciBtZXRob2RzID0gcmVxdWlyZShcIi4uL21ldGhvZHNcIilcbnZhciBpbnNwZWN0ID0gcmVxdWlyZShcIi4uL3JlcGxhY2VkL2luc3BlY3RcIilcbnZhciBwZWFjaCA9IHJlcXVpcmUoXCIuLi91dGlsXCIpLnBlYWNoXG52YXIgUmVwb3J0ZXIgPSByZXF1aXJlKFwiLi9yZXBvcnRlclwiKVxudmFyIFV0aWwgPSByZXF1aXJlKFwiLi91dGlsXCIpXG5cbmZ1bmN0aW9uIHNpbXBsZUluc3BlY3QodmFsdWUpIHtcbiAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICByZXR1cm4gVXRpbC5nZXRTdGFjayh2YWx1ZSlcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gaW5zcGVjdCh2YWx1ZSlcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHByaW50VGltZShfLCBwLCBzdHIpIHtcbiAgICBpZiAoIV8udGltZVByaW50ZWQpIHtcbiAgICAgICAgXy50aW1lUHJpbnRlZCA9IHRydWVcbiAgICAgICAgc3RyICs9IFV0aWwuY29sb3IoXCJsaWdodFwiLCBcIiAoXCIgKyBVdGlsLmZvcm1hdFRpbWUoXy5kdXJhdGlvbikgKyBcIilcIilcbiAgICB9XG5cbiAgICByZXR1cm4gcC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIF8ucHJpbnQoc3RyKSB9KVxufVxuXG5mdW5jdGlvbiBwcmludEZhaWxMaXN0KF8sIHN0cikge1xuICAgIHZhciBwYXJ0cyA9IHN0ci5zcGxpdCgvXFxyP1xcbi9nKVxuXG4gICAgcmV0dXJuIF8ucHJpbnQoXCIgICAgXCIgKyBVdGlsLmNvbG9yKFwiZmFpbFwiLCBwYXJ0c1swXS50cmltKCkpKVxuICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHBlYWNoKHBhcnRzLnNsaWNlKDEpLCBmdW5jdGlvbiAocGFydCkge1xuICAgICAgICAgICAgcmV0dXJuIF8ucHJpbnQoXCIgICAgICBcIiArIFV0aWwuY29sb3IoXCJmYWlsXCIsIHBhcnQudHJpbSgpKSlcbiAgICAgICAgfSlcbiAgICB9KVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChvcHRzLCBtZXRob2RzKSB7XG4gICAgcmV0dXJuIG5ldyBDb25zb2xlUmVwb3J0ZXIob3B0cywgbWV0aG9kcylcbn1cblxuLyoqXG4gKiBCYXNlIGNsYXNzIGZvciBtb3N0IGNvbnNvbGUgcmVwb3J0ZXJzLlxuICpcbiAqIE5vdGU6IHByaW50aW5nIGlzIGFzeW5jaHJvbm91cywgYmVjYXVzZSBvdGhlcndpc2UsIGlmIGVub3VnaCBlcnJvcnMgZXhpc3QsXG4gKiBOb2RlIHdpbGwgZXZlbnR1YWxseSBzdGFydCBkcm9wcGluZyBsaW5lcyBzZW50IHRvIGl0cyBidWZmZXIsIGVzcGVjaWFsbHkgd2hlblxuICogc3RhY2sgdHJhY2VzIGdldCBpbnZvbHZlZC4gSWYgVGhhbGxpdW0ncyBvdXRwdXQgaXMgcmVkaXJlY3RlZCwgdGhhdCBjYW4gYmUgYVxuICogYmlnIHByb2JsZW0gZm9yIGNvbnN1bWVycywgYXMgdGhleSBvbmx5IGhhdmUgcGFydCBvZiB0aGUgb3V0cHV0LCBhbmQgd29uJ3QgYmVcbiAqIGFibGUgdG8gc2VlIGFsbCB0aGUgZXJyb3JzIGxhdGVyLiBBbHNvLCBpZiBjb25zb2xlIHdhcm5pbmdzIGNvbWUgdXAgZW4tbWFzc2UsXG4gKiB0aGF0IHdvdWxkIGFsc28gY29udHJpYnV0ZS4gU28sIHdlIGhhdmUgdG8gd2FpdCBmb3IgZWFjaCBsaW5lIHRvIGZsdXNoIGJlZm9yZVxuICogd2UgY2FuIGNvbnRpbnVlLCBzbyB0aGUgZnVsbCBvdXRwdXQgbWFrZXMgaXRzIHdheSB0byB0aGUgY29uc29sZS5cbiAqXG4gKiBTb21lIHRlc3QgZnJhbWV3b3JrcyBsaWtlIFRhcGUgbWlzcyB0aGlzLCB0aG91Z2guXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9wdHMgVGhlIG9wdGlvbnMgZm9yIHRoZSByZXBvcnRlci5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IG9wdHMud3JpdGUgVGhlIHVuYnVmZmVycmVkIHdyaXRlciBmb3IgdGhlIHJlcG9ydGVyLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gb3B0cy5yZXNldCBBIHJlc2V0IGZ1bmN0aW9uIGZvciB0aGUgcHJpbnRlciArIHdyaXRlci5cbiAqIEBwYXJhbSB7U3RyaW5nW119IGFjY2VwdHMgVGhlIG9wdGlvbnMgYWNjZXB0ZWQuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBpbml0IFRoZSBpbml0IGZ1bmN0aW9uIGZvciB0aGUgc3ViY2xhc3MgcmVwb3J0ZXInc1xuICogICAgICAgICAgICAgICAgICAgICAgICBpc29sYXRlZCBzdGF0ZSAoY3JlYXRlZCBieSBmYWN0b3J5KS5cbiAqL1xuZnVuY3Rpb24gQ29uc29sZVJlcG9ydGVyKG9wdHMsIG1ldGhvZHMpIHtcbiAgICBSZXBvcnRlci5jYWxsKHRoaXMsIFV0aWwuVHJlZSwgb3B0cywgbWV0aG9kcywgdHJ1ZSlcblxuICAgIGlmICghVXRpbC5Db2xvcnMuZm9yY2VkKCkgJiYgbWV0aG9kcy5hY2NlcHRzLmluZGV4T2YoXCJjb2xvclwiKSA+PSAwKSB7XG4gICAgICAgIHRoaXMub3B0cy5jb2xvciA9IG9wdHMuY29sb3JcbiAgICB9XG5cbiAgICBVdGlsLmRlZmF1bHRpZnkodGhpcywgb3B0cywgXCJ3cml0ZVwiKVxuICAgIHRoaXMucmVzZXQoKVxufVxuXG5tZXRob2RzKENvbnNvbGVSZXBvcnRlciwgUmVwb3J0ZXIsIHtcbiAgICBwcmludDogZnVuY3Rpb24gKHN0cikge1xuICAgICAgICBpZiAoc3RyID09IG51bGwpIHN0ciA9IFwiXCJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLm9wdHMud3JpdGUoc3RyICsgXCJcXG5cIikpXG4gICAgfSxcblxuICAgIHdyaXRlOiBmdW5jdGlvbiAoc3RyKSB7XG4gICAgICAgIGlmIChzdHIgIT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLm9wdHMud3JpdGUoc3RyKSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIHByaW50UmVzdWx0czogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXNcblxuICAgICAgICBpZiAoIXRoaXMudGVzdHMgJiYgIXRoaXMuc2tpcCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucHJpbnQoXG4gICAgICAgICAgICAgICAgVXRpbC5jb2xvcihcInBsYWluXCIsIFwiICAwIHRlc3RzXCIpICtcbiAgICAgICAgICAgICAgICBVdGlsLmNvbG9yKFwibGlnaHRcIiwgXCIgKDBtcylcIikpXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiBzZWxmLnByaW50KCkgfSlcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLnByaW50KCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgcCA9IFByb21pc2UucmVzb2x2ZSgpXG5cbiAgICAgICAgICAgIGlmIChzZWxmLnBhc3MpIHtcbiAgICAgICAgICAgICAgICBwID0gcHJpbnRUaW1lKHNlbGYsIHAsXG4gICAgICAgICAgICAgICAgICAgIFV0aWwuY29sb3IoXCJicmlnaHQgcGFzc1wiLCBcIiAgXCIpICtcbiAgICAgICAgICAgICAgICAgICAgVXRpbC5jb2xvcihcImdyZWVuXCIsIHNlbGYucGFzcyArIFwiIHBhc3NpbmdcIikpXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzZWxmLnNraXApIHtcbiAgICAgICAgICAgICAgICBwID0gcHJpbnRUaW1lKHNlbGYsIHAsXG4gICAgICAgICAgICAgICAgICAgIFV0aWwuY29sb3IoXCJza2lwXCIsIFwiICBcIiArIHNlbGYuc2tpcCArIFwiIHNraXBwZWRcIikpXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzZWxmLmZhaWwpIHtcbiAgICAgICAgICAgICAgICBwID0gcHJpbnRUaW1lKHNlbGYsIHAsXG4gICAgICAgICAgICAgICAgICAgIFV0aWwuY29sb3IoXCJicmlnaHQgZmFpbFwiLCBcIiAgXCIpICtcbiAgICAgICAgICAgICAgICAgICAgVXRpbC5jb2xvcihcImZhaWxcIiwgc2VsZi5mYWlsICsgXCIgZmFpbGluZ1wiKSlcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHBcbiAgICAgICAgfSlcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gc2VsZi5wcmludCgpIH0pXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBwZWFjaChzZWxmLmVycm9ycywgZnVuY3Rpb24gKHJlcG9ydCwgaSkge1xuICAgICAgICAgICAgICAgIHZhciBuYW1lID0gaSArIDEgKyBcIikgXCIgKyBVdGlsLmpvaW5QYXRoKHJlcG9ydCkgK1xuICAgICAgICAgICAgICAgICAgICBVdGlsLmZvcm1hdFJlc3QocmVwb3J0KVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNlbGYucHJpbnQoXCIgIFwiICsgVXRpbC5jb2xvcihcInBsYWluXCIsIG5hbWUgKyBcIjpcIikpXG4gICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcHJpbnRGYWlsTGlzdChzZWxmLCBzaW1wbGVJbnNwZWN0KHJlcG9ydC5lcnJvcikpXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiBzZWxmLnByaW50KCkgfSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pXG4gICAgfSxcblxuICAgIHByaW50RXJyb3I6IGZ1bmN0aW9uIChyZXBvcnQpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgICAgIHZhciBsaW5lcyA9IHNpbXBsZUluc3BlY3QocmVwb3J0LmVycm9yKS5zcGxpdCgvXFxyP1xcbi9nKVxuXG4gICAgICAgIHJldHVybiB0aGlzLnByaW50KCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gcGVhY2gobGluZXMsIGZ1bmN0aW9uIChsaW5lKSB7IHJldHVybiBzZWxmLnByaW50KGxpbmUpIH0pXG4gICAgICAgIH0pXG4gICAgfSxcbn0pXG4iLCJcInVzZSBzdHJpY3RcIlxuXG52YXIgVXRpbCA9IHJlcXVpcmUoXCIuL3V0aWxcIilcblxuZXhwb3J0cy5vbiA9IHJlcXVpcmUoXCIuL29uXCIpXG5leHBvcnRzLmNvbnNvbGVSZXBvcnRlciA9IHJlcXVpcmUoXCIuL2NvbnNvbGUtcmVwb3J0ZXJcIilcbmV4cG9ydHMuUmVwb3J0ZXIgPSByZXF1aXJlKFwiLi9yZXBvcnRlclwiKVxuZXhwb3J0cy5zeW1ib2xzID0gVXRpbC5zeW1ib2xzXG5leHBvcnRzLndpbmRvd1dpZHRoID0gVXRpbC53aW5kb3dXaWR0aFxuZXhwb3J0cy5uZXdsaW5lID0gVXRpbC5uZXdsaW5lXG5leHBvcnRzLnNldENvbG9yID0gVXRpbC5zZXRDb2xvclxuZXhwb3J0cy51bnNldENvbG9yID0gVXRpbC51bnNldENvbG9yXG5leHBvcnRzLnNwZWVkID0gVXRpbC5zcGVlZFxuZXhwb3J0cy5nZXRTdGFjayA9IFV0aWwuZ2V0U3RhY2tcbmV4cG9ydHMuQ29sb3JzID0gVXRpbC5Db2xvcnNcbmV4cG9ydHMuY29sb3IgPSBVdGlsLmNvbG9yXG5leHBvcnRzLmZvcm1hdFJlc3QgPSBVdGlsLmZvcm1hdFJlc3RcbmV4cG9ydHMuam9pblBhdGggPSBVdGlsLmpvaW5QYXRoXG5leHBvcnRzLmZvcm1hdFRpbWUgPSBVdGlsLmZvcm1hdFRpbWVcbiIsIlwidXNlIHN0cmljdFwiXG5cbnZhciBTdGF0dXMgPSByZXF1aXJlKFwiLi91dGlsXCIpLlN0YXR1c1xuXG4vKipcbiAqIEEgbWFjcm8gb2Ygc29ydHMsIHRvIHNpbXBsaWZ5IGNyZWF0aW5nIHJlcG9ydGVycy4gSXQgYWNjZXB0cyBhbiBvYmplY3Qgd2l0aFxuICogdGhlIGZvbGxvd2luZyBwYXJhbWV0ZXJzOlxuICpcbiAqIGBhY2NlcHRzOiBzdHJpbmdbXWAgLSBUaGUgcHJvcGVydGllcyBhY2NlcHRlZC4gRXZlcnl0aGluZyBlbHNlIGlzIGlnbm9yZWQsXG4gKiBhbmQgaXQncyBwYXJ0aWFsbHkgdGhlcmUgZm9yIGRvY3VtZW50YXRpb24uIFRoaXMgcGFyYW1ldGVyIGlzIHJlcXVpcmVkLlxuICpcbiAqIGBjcmVhdGUob3B0cywgbWV0aG9kcylgIC0gQ3JlYXRlIGEgbmV3IHJlcG9ydGVyIGluc3RhbmNlLiAgVGhpcyBwYXJhbWV0ZXIgaXNcbiAqIHJlcXVpcmVkLiBOb3RlIHRoYXQgYG1ldGhvZHNgIHJlZmVycyB0byB0aGUgcGFyYW1ldGVyIG9iamVjdCBpdHNlbGYuXG4gKlxuICogYGluaXQoc3RhdGUsIG9wdHMpYCAtIEluaXRpYWxpemUgZXh0cmEgcmVwb3J0ZXIgc3RhdGUsIGlmIGFwcGxpY2FibGUuXG4gKlxuICogYGJlZm9yZShyZXBvcnRlcilgIC0gRG8gdGhpbmdzIGJlZm9yZSBlYWNoIGV2ZW50LCByZXR1cm5pbmcgYSBwb3NzaWJsZVxuICogdGhlbmFibGUgd2hlbiBkb25lLiBUaGlzIGRlZmF1bHRzIHRvIGEgbm8tb3AuXG4gKlxuICogYGFmdGVyKHJlcG9ydGVyKWAgLSBEbyB0aGluZ3MgYWZ0ZXIgZWFjaCBldmVudCwgcmV0dXJuaW5nIGEgcG9zc2libGVcbiAqIHRoZW5hYmxlIHdoZW4gZG9uZS4gVGhpcyBkZWZhdWx0cyB0byBhIG5vLW9wLlxuICpcbiAqIGByZXBvcnQocmVwb3J0ZXIsIHJlcG9ydClgIC0gSGFuZGxlIGEgdGVzdCByZXBvcnQuIFRoaXMgbWF5IHJldHVybiBhIHBvc3NpYmxlXG4gKiB0aGVuYWJsZSB3aGVuIGRvbmUsIGFuZCBpdCBpcyByZXF1aXJlZC5cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAobWV0aG9kcykge1xuICAgIHJldHVybiBmdW5jdGlvbiAob3B0cykge1xuICAgICAgICAvKipcbiAgICAgICAgICogSW5zdGVhZCBvZiBzaWxlbnRseSBmYWlsaW5nIHRvIHdvcmssIGxldCdzIGVycm9yIG91dCB3aGVuIGEgcmVwb3J0IGlzXG4gICAgICAgICAqIHBhc3NlZCBpbiwgYW5kIGluZm9ybSB0aGUgdXNlciBpdCBuZWVkcyBpbml0aWFsaXplZC4gQ2hhbmNlcyBhcmUsXG4gICAgICAgICAqIHRoZXJlJ3Mgbm8gbGVnaXRpbWF0ZSByZWFzb24gdG8gZXZlbiBwYXNzIGEgcmVwb3J0LCBhbnl3YXlzLlxuICAgICAgICAgKi9cbiAgICAgICAgaWYgKHR5cGVvZiBvcHRzID09PSBcIm9iamVjdFwiICYmIG9wdHMgIT09IG51bGwgJiZcbiAgICAgICAgICAgICAgICB0eXBlb2Ygb3B0cy5fID09PSBcIm51bWJlclwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICAgICAgICAgIFwiT3B0aW9ucyBjYW5ub3QgYmUgYSByZXBvcnQuIERpZCB5b3UgZm9yZ2V0IHRvIGNhbGwgdGhlIFwiICtcbiAgICAgICAgICAgICAgICBcImZhY3RvcnkgZmlyc3Q/XCIpXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgXyA9IG1ldGhvZHMuY3JlYXRlKG9wdHMsIG1ldGhvZHMpXG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChyZXBvcnQpIHtcbiAgICAgICAgICAgIC8vIE9ubHkgc29tZSBldmVudHMgaGF2ZSBjb21tb24gc3RlcHMuXG4gICAgICAgICAgICBpZiAocmVwb3J0LmlzU3RhcnQpIHtcbiAgICAgICAgICAgICAgICBfLnJ1bm5pbmcgPSB0cnVlXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHJlcG9ydC5pc0VudGVyIHx8IHJlcG9ydC5pc1Bhc3MpIHtcbiAgICAgICAgICAgICAgICBfLmdldChyZXBvcnQucGF0aCkuc3RhdHVzID0gU3RhdHVzLlBhc3NpbmdcbiAgICAgICAgICAgICAgICBfLmR1cmF0aW9uICs9IHJlcG9ydC5kdXJhdGlvblxuICAgICAgICAgICAgICAgIF8udGVzdHMrK1xuICAgICAgICAgICAgICAgIF8ucGFzcysrXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHJlcG9ydC5pc0ZhaWwpIHtcbiAgICAgICAgICAgICAgICBfLmdldChyZXBvcnQucGF0aCkuc3RhdHVzID0gU3RhdHVzLkZhaWxpbmdcbiAgICAgICAgICAgICAgICBfLmR1cmF0aW9uICs9IHJlcG9ydC5kdXJhdGlvblxuICAgICAgICAgICAgICAgIF8udGVzdHMrK1xuICAgICAgICAgICAgICAgIF8uZmFpbCsrXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHJlcG9ydC5pc1NraXApIHtcbiAgICAgICAgICAgICAgICBfLmdldChyZXBvcnQucGF0aCkuc3RhdHVzID0gU3RhdHVzLlNraXBwZWRcbiAgICAgICAgICAgICAgICAvLyBTa2lwcGVkIHRlc3RzIGFyZW4ndCBjb3VudGVkIGluIHRoZSB0b3RhbCB0ZXN0IGNvdW50XG4gICAgICAgICAgICAgICAgXy5za2lwKytcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShcbiAgICAgICAgICAgICAgICB0eXBlb2YgbWV0aG9kcy5iZWZvcmUgPT09IFwiZnVuY3Rpb25cIlxuICAgICAgICAgICAgICAgICAgICA/IG1ldGhvZHMuYmVmb3JlKF8pXG4gICAgICAgICAgICAgICAgICAgIDogdW5kZWZpbmVkKVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gbWV0aG9kcy5yZXBvcnQoXywgcmVwb3J0KSB9KVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0eXBlb2YgbWV0aG9kcy5hZnRlciA9PT0gXCJmdW5jdGlvblwiXG4gICAgICAgICAgICAgICAgICAgID8gbWV0aG9kcy5hZnRlcihfKVxuICAgICAgICAgICAgICAgICAgICA6IHVuZGVmaW5lZFxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAocmVwb3J0LmlzRW5kIHx8IHJlcG9ydC5pc0Vycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIF8ucmVzZXQoKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXy5vcHRzLnJlc2V0KClcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgIH1cbn1cbiIsIlwidXNlIHN0cmljdFwiXG5cbnZhciBtZXRob2RzID0gcmVxdWlyZShcIi4uL21ldGhvZHNcIilcbnZhciBkZWZhdWx0aWZ5ID0gcmVxdWlyZShcIi4vdXRpbFwiKS5kZWZhdWx0aWZ5XG52YXIgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eVxuXG5mdW5jdGlvbiBTdGF0ZShyZXBvcnRlcikge1xuICAgIGlmICh0eXBlb2YgcmVwb3J0ZXIubWV0aG9kcy5pbml0ID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgKDAsIHJlcG9ydGVyLm1ldGhvZHMuaW5pdCkodGhpcywgcmVwb3J0ZXIub3B0cylcbiAgICB9XG59XG5cbi8qKlxuICogVGhpcyBoZWxwcyBzcGVlZCB1cCBnZXR0aW5nIHByZXZpb3VzIHRyZWVzLCBzbyBhIHBvdGVudGlhbGx5IGV4cGVuc2l2ZVxuICogdHJlZSBzZWFyY2ggZG9lc24ndCBoYXZlIHRvIGJlIHBlcmZvcm1lZC5cbiAqXG4gKiAoVGhpcyBkb2VzIGFjdHVhbGx5IG1ha2UgYSBzbGlnaHQgcGVyZiBkaWZmZXJlbmNlIGluIHRoZSB0ZXN0cy4pXG4gKi9cbmZ1bmN0aW9uIGlzUmVwZWF0KGNhY2hlLCBwYXRoKSB7XG4gICAgLy8gQ2FuJ3QgYmUgYSByZXBlYXQgdGhlIGZpcnN0IHRpbWUuXG4gICAgaWYgKGNhY2hlLnBhdGggPT0gbnVsbCkgcmV0dXJuIGZhbHNlXG4gICAgaWYgKHBhdGgubGVuZ3RoICE9PSBjYWNoZS5wYXRoLmxlbmd0aCkgcmV0dXJuIGZhbHNlXG4gICAgaWYgKHBhdGggPT09IGNhY2hlLnBhdGgpIHJldHVybiB0cnVlXG5cbiAgICAvLyBJdCdzIHVubGlrZWx5IHRoZSBuZXN0aW5nIHdpbGwgYmUgY29uc2lzdGVudGx5IG1vcmUgdGhhbiBhIGZldyBsZXZlbHNcbiAgICAvLyBkZWVwICg+PSA1KSwgc28gdGhpcyBzaG91bGRuJ3QgYm9nIGFueXRoaW5nIGRvd24uXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXRoLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChwYXRoW2ldICE9PSBjYWNoZS5wYXRoW2ldKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNhY2hlLnBhdGggPSBwYXRoXG4gICAgcmV0dXJuIHRydWVcbn1cblxuLyoqXG4gKiBTdXBlcmNsYXNzIGZvciBhbGwgcmVwb3J0ZXJzLiBUaGlzIGNvdmVycyB0aGUgc3RhdGUgZm9yIHByZXR0eSBtdWNoIGV2ZXJ5XG4gKiByZXBvcnRlci5cbiAqXG4gKiBOb3RlIHRoYXQgaWYgeW91IGRlbGF5IHRoZSBpbml0aWFsIHJlc2V0LCB5b3Ugc3RpbGwgbXVzdCBjYWxsIGl0IGJlZm9yZSB0aGVcbiAqIGNvbnN0cnVjdG9yIGZpbmlzaGVzLlxuICovXG5tb2R1bGUuZXhwb3J0cyA9IFJlcG9ydGVyXG5mdW5jdGlvbiBSZXBvcnRlcihUcmVlLCBvcHRzLCBtZXRob2RzLCBkZWxheSkge1xuICAgIHRoaXMuVHJlZSA9IFRyZWVcbiAgICB0aGlzLm9wdHMgPSB7fVxuICAgIHRoaXMubWV0aG9kcyA9IG1ldGhvZHNcbiAgICBkZWZhdWx0aWZ5KHRoaXMsIG9wdHMsIFwicmVzZXRcIilcbiAgICBpZiAoIWRlbGF5KSB0aGlzLnJlc2V0KClcbn1cblxubWV0aG9kcyhSZXBvcnRlciwge1xuICAgIHJlc2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMucnVubmluZyA9IGZhbHNlXG4gICAgICAgIHRoaXMudGltZVByaW50ZWQgPSBmYWxzZVxuICAgICAgICB0aGlzLnRlc3RzID0gMFxuICAgICAgICB0aGlzLnBhc3MgPSAwXG4gICAgICAgIHRoaXMuZmFpbCA9IDBcbiAgICAgICAgdGhpcy5za2lwID0gMFxuICAgICAgICB0aGlzLmR1cmF0aW9uID0gMFxuICAgICAgICB0aGlzLmVycm9ycyA9IFtdXG4gICAgICAgIHRoaXMuc3RhdGUgPSBuZXcgU3RhdGUodGhpcylcbiAgICAgICAgdGhpcy5iYXNlID0gbmV3IHRoaXMuVHJlZShudWxsKVxuICAgICAgICB0aGlzLmNhY2hlID0ge3BhdGg6IG51bGwsIHJlc3VsdDogbnVsbH1cbiAgICB9LFxuXG4gICAgcHVzaEVycm9yOiBmdW5jdGlvbiAocmVwb3J0KSB7XG4gICAgICAgIHRoaXMuZXJyb3JzLnB1c2gocmVwb3J0KVxuICAgIH0sXG5cbiAgICBnZXQ6IGZ1bmN0aW9uIChwYXRoKSB7XG4gICAgICAgIGlmIChpc1JlcGVhdCh0aGlzLmNhY2hlLCBwYXRoKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY2FjaGUucmVzdWx0XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgY2hpbGQgPSB0aGlzLmJhc2VcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBhdGgubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBlbnRyeSA9IHBhdGhbaV1cblxuICAgICAgICAgICAgaWYgKGhhc093bi5jYWxsKGNoaWxkLmNoaWxkcmVuLCBlbnRyeS5pbmRleCkpIHtcbiAgICAgICAgICAgICAgICBjaGlsZCA9IGNoaWxkLmNoaWxkcmVuW2VudHJ5LmluZGV4XVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjaGlsZCA9IGNoaWxkLmNoaWxkcmVuW2VudHJ5LmluZGV4XSA9IG5ldyB0aGlzLlRyZWUoZW50cnkubmFtZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLmNhY2hlLnJlc3VsdCA9IGNoaWxkXG4gICAgfSxcbn0pXG4iLCJcInVzZSBzdHJpY3RcIlxuXG4vLyBUT0RPOiBhZGQgYGRpZmZgIHN1cHBvcnRcbi8vIHZhciBkaWZmID0gcmVxdWlyZShcImRpZmZcIilcblxudmFyIFV0aWwgPSByZXF1aXJlKFwiLi4vdXRpbFwiKVxudmFyIFNldHRpbmdzID0gcmVxdWlyZShcIi4uL3NldHRpbmdzXCIpXG5cbmV4cG9ydHMuc3ltYm9scyA9IFNldHRpbmdzLnN5bWJvbHNcbmV4cG9ydHMud2luZG93V2lkdGggPSBTZXR0aW5ncy53aW5kb3dXaWR0aFxuZXhwb3J0cy5uZXdsaW5lID0gU2V0dGluZ3MubmV3bGluZVxuXG4vKlxuICogU3RhY2sgbm9ybWFsaXphdGlvblxuICovXG5cbnZhciBzdGFja0luY2x1ZGVzTWVzc2FnZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHN0YWNrID0gVXRpbC5nZXRTdGFjayhuZXcgRXJyb3IoXCJ0ZXN0XCIpKVxuXG4gICAgLy8gICAgIEZpcmVmb3gsIFNhZmFyaSAgICAgICAgICAgICAgICAgQ2hyb21lLCBJRVxuICAgIHJldHVybiAhL14oQCk/XFxTK1xcOlxcZCsvLnRlc3Qoc3RhY2spICYmICEvXlxccyphdC8udGVzdChzdGFjaylcbn0pKClcblxuZXhwb3J0cy5nZXRTdGFjayA9IGZ1bmN0aW9uIChlKSB7XG4gICAgaWYgKGUgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICB2YXIgZGVzY3JpcHRpb24gPSAoZS5uYW1lICsgXCI6IFwiICsgZS5tZXNzYWdlKS5yZXBsYWNlKC9eXFxzKy9nbSwgXCJcIilcbiAgICAgICAgdmFyIHN0cmlwcGVkID0gXCJcIlxuXG4gICAgICAgIGlmIChzdGFja0luY2x1ZGVzTWVzc2FnZSkge1xuICAgICAgICAgICAgdmFyIHN0YWNrID0gVXRpbC5nZXRTdGFjayhlKVxuICAgICAgICAgICAgdmFyIGluZGV4ID0gc3RhY2suaW5kZXhPZihlLm1lc3NhZ2UpXG5cbiAgICAgICAgICAgIGlmIChpbmRleCA8IDApIHJldHVybiBVdGlsLmdldFN0YWNrKGUpLnJlcGxhY2UoL15cXHMrL2dtLCBcIlwiKVxuXG4gICAgICAgICAgICB2YXIgcmUgPSAvXFxyP1xcbi9nXG5cbiAgICAgICAgICAgIHJlLmxhc3RJbmRleCA9IGluZGV4ICsgZS5tZXNzYWdlLmxlbmd0aFxuICAgICAgICAgICAgaW5kZXggPSBzdGFjay5zZWFyY2gocmUpXG4gICAgICAgICAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgICAgICAgICAgIC8vIFNraXAgcGFzdCB0aGUgY2FycmlhZ2UgcmV0dXJuIGlmIHRoZXJlIGlzIG9uZVxuICAgICAgICAgICAgICAgIGlmIChzdGFja1tpbmRleF0gPT09IFwiXFxyXCIpIGluZGV4KytcbiAgICAgICAgICAgICAgICBzdHJpcHBlZCA9IHN0YWNrLnNsaWNlKGluZGV4ICsgMSkucmVwbGFjZSgvXlxccysvZ20sIFwiXCIpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzdHJpcHBlZCA9IFV0aWwuZ2V0U3RhY2soZSkucmVwbGFjZSgvXlxccysvZ20sIFwiXCIpXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc3RyaXBwZWQgIT09IFwiXCIpIGRlc2NyaXB0aW9uICs9IFNldHRpbmdzLm5ld2xpbmUoKSArIHN0cmlwcGVkXG4gICAgICAgIHJldHVybiBkZXNjcmlwdGlvblxuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBVdGlsLmdldFN0YWNrKGUpLnJlcGxhY2UoL15cXHMrL2dtLCBcIlwiKVxuICAgIH1cbn1cblxudmFyIENvbG9ycyA9IGV4cG9ydHMuQ29sb3JzID0gU2V0dGluZ3MuQ29sb3JzXG5cbi8vIENvbG9yIHBhbGV0dGUgcHVsbGVkIGZyb20gTW9jaGFcbmZ1bmN0aW9uIGNvbG9yVG9OdW1iZXIobmFtZSkge1xuICAgIHN3aXRjaCAobmFtZSkge1xuICAgIGNhc2UgXCJwYXNzXCI6IHJldHVybiA5MFxuICAgIGNhc2UgXCJmYWlsXCI6IHJldHVybiAzMVxuXG4gICAgY2FzZSBcImJyaWdodCBwYXNzXCI6IHJldHVybiA5MlxuICAgIGNhc2UgXCJicmlnaHQgZmFpbFwiOiByZXR1cm4gOTFcbiAgICBjYXNlIFwiYnJpZ2h0IHllbGxvd1wiOiByZXR1cm4gOTNcblxuICAgIGNhc2UgXCJza2lwXCI6IHJldHVybiAzNlxuICAgIGNhc2UgXCJzdWl0ZVwiOiByZXR1cm4gMFxuICAgIGNhc2UgXCJwbGFpblwiOiByZXR1cm4gMFxuXG4gICAgY2FzZSBcImVycm9yIHRpdGxlXCI6IHJldHVybiAwXG4gICAgY2FzZSBcImVycm9yIG1lc3NhZ2VcIjogcmV0dXJuIDMxXG4gICAgY2FzZSBcImVycm9yIHN0YWNrXCI6IHJldHVybiA5MFxuXG4gICAgY2FzZSBcImNoZWNrbWFya1wiOiByZXR1cm4gMzJcbiAgICBjYXNlIFwiZmFzdFwiOiByZXR1cm4gOTBcbiAgICBjYXNlIFwibWVkaXVtXCI6IHJldHVybiAzM1xuICAgIGNhc2UgXCJzbG93XCI6IHJldHVybiAzMVxuICAgIGNhc2UgXCJncmVlblwiOiByZXR1cm4gMzJcbiAgICBjYXNlIFwibGlnaHRcIjogcmV0dXJuIDkwXG5cbiAgICBjYXNlIFwiZGlmZiBndXR0ZXJcIjogcmV0dXJuIDkwXG4gICAgY2FzZSBcImRpZmYgYWRkZWRcIjogcmV0dXJuIDMyXG4gICAgY2FzZSBcImRpZmYgcmVtb3ZlZFwiOiByZXR1cm4gMzFcbiAgICBkZWZhdWx0OiB0aHJvdyBuZXcgVHlwZUVycm9yKFwiSW52YWxpZCBuYW1lOiBcXFwiXCIgKyBuYW1lICsgXCJcXFwiXCIpXG4gICAgfVxufVxuXG5leHBvcnRzLmNvbG9yID0gZnVuY3Rpb24gKG5hbWUsIHN0cikge1xuICAgIGlmIChDb2xvcnMuc3VwcG9ydGVkKCkpIHtcbiAgICAgICAgcmV0dXJuIFwiXFx1MDAxYltcIiArIGNvbG9yVG9OdW1iZXIobmFtZSkgKyBcIm1cIiArIHN0ciArIFwiXFx1MDAxYlswbVwiXG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHN0ciArIFwiXCJcbiAgICB9XG59XG5cbmV4cG9ydHMuc2V0Q29sb3IgPSBmdW5jdGlvbiAoXykge1xuICAgIGlmIChfLm9wdHMuY29sb3IgIT0gbnVsbCkgQ29sb3JzLm1heWJlU2V0KF8ub3B0cy5jb2xvcilcbn1cblxuZXhwb3J0cy51bnNldENvbG9yID0gZnVuY3Rpb24gKF8pIHtcbiAgICBpZiAoXy5vcHRzLmNvbG9yICE9IG51bGwpIENvbG9ycy5tYXliZVJlc3RvcmUoKVxufVxuXG52YXIgU3RhdHVzID0gZXhwb3J0cy5TdGF0dXMgPSBPYmplY3QuZnJlZXplKHtcbiAgICBVbmtub3duOiAwLFxuICAgIFNraXBwZWQ6IDEsXG4gICAgUGFzc2luZzogMixcbiAgICBGYWlsaW5nOiAzLFxufSlcblxuZXhwb3J0cy5UcmVlID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgdGhpcy52YWx1ZSA9IHZhbHVlXG4gICAgdGhpcy5zdGF0dXMgPSBTdGF0dXMuVW5rbm93blxuICAgIHRoaXMuY2hpbGRyZW4gPSBPYmplY3QuY3JlYXRlKG51bGwpXG59XG5cbmV4cG9ydHMuZGVmYXVsdGlmeSA9IGZ1bmN0aW9uIChfLCBvcHRzLCBwcm9wKSB7XG4gICAgaWYgKF8ubWV0aG9kcy5hY2NlcHRzLmluZGV4T2YocHJvcCkgPj0gMCkge1xuICAgICAgICB2YXIgdXNlZCA9IG9wdHMgIT0gbnVsbCAmJiB0eXBlb2Ygb3B0c1twcm9wXSA9PT0gXCJmdW5jdGlvblwiXG4gICAgICAgICAgICA/IG9wdHNcbiAgICAgICAgICAgIDogU2V0dGluZ3MuZGVmYXVsdE9wdHMoKVxuXG4gICAgICAgIF8ub3B0c1twcm9wXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodXNlZFtwcm9wXS5hcHBseSh1c2VkLCBhcmd1bWVudHMpKVxuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnRzLmpvaW5QYXRoID0gZnVuY3Rpb24gKHJlcG9ydCkge1xuICAgIHZhciBwYXRoID0gXCJcIlxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZXBvcnQucGF0aC5sZW5ndGg7IGkrKykge1xuICAgICAgICBwYXRoICs9IFwiIFwiICsgcmVwb3J0LnBhdGhbaV0ubmFtZVxuICAgIH1cblxuICAgIHJldHVybiBwYXRoLnNsaWNlKDEpXG59XG5cbmV4cG9ydHMuc3BlZWQgPSBmdW5jdGlvbiAocmVwb3J0KSB7XG4gICAgaWYgKHJlcG9ydC5kdXJhdGlvbiA+PSByZXBvcnQuc2xvdykgcmV0dXJuIFwic2xvd1wiXG4gICAgaWYgKHJlcG9ydC5kdXJhdGlvbiA+PSByZXBvcnQuc2xvdyAvIDIpIHJldHVybiBcIm1lZGl1bVwiXG4gICAgaWYgKHJlcG9ydC5kdXJhdGlvbiA+PSAwKSByZXR1cm4gXCJmYXN0XCJcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcihcIkR1cmF0aW9uIG11c3Qgbm90IGJlIG5lZ2F0aXZlXCIpXG59XG5cbmV4cG9ydHMuZm9ybWF0VGltZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHMgPSAxMDAwIC8qIG1zICovXG4gICAgdmFyIG0gPSA2MCAqIHNcbiAgICB2YXIgaCA9IDYwICogbVxuICAgIHZhciBkID0gMjQgKiBoXG5cbiAgICByZXR1cm4gZnVuY3Rpb24gKG1zKSB7XG4gICAgICAgIGlmIChtcyA+PSBkKSByZXR1cm4gTWF0aC5yb3VuZChtcyAvIGQpICsgXCJkXCJcbiAgICAgICAgaWYgKG1zID49IGgpIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gaCkgKyBcImhcIlxuICAgICAgICBpZiAobXMgPj0gbSkgcmV0dXJuIE1hdGgucm91bmQobXMgLyBtKSArIFwibVwiXG4gICAgICAgIGlmIChtcyA+PSBzKSByZXR1cm4gTWF0aC5yb3VuZChtcyAvIHMpICsgXCJzXCJcbiAgICAgICAgcmV0dXJuIG1zICsgXCJtc1wiXG4gICAgfVxufSkoKVxuXG5leHBvcnRzLmZvcm1hdFJlc3QgPSBmdW5jdGlvbiAocmVwb3J0KSB7XG4gICAgaWYgKCFyZXBvcnQuaXNIb29rKSByZXR1cm4gXCJcIlxuICAgIHZhciBwYXRoID0gXCIgKFwiICsgcmVwb3J0LnN0YWdlXG5cbiAgICByZXR1cm4gcmVwb3J0Lm5hbWUgPyBwYXRoICsgXCIg4oCSIFwiICsgcmVwb3J0Lm5hbWUgKyBcIilcIiA6IHBhdGggKyBcIilcIlxufVxuXG4vLyBleHBvcnRzLnVuaWZpZWREaWZmID0gZnVuY3Rpb24gKGVycikge1xuLy8gICAgIHZhciBtc2cgPSBkaWZmLmNyZWF0ZVBhdGNoKFwic3RyaW5nXCIsIGVyci5hY3R1YWwsIGVyci5leHBlY3RlZClcbi8vICAgICB2YXIgbGluZXMgPSBtc2cuc3BsaXQoU2V0dGluZ3MubmV3bGluZSgpKS5zbGljZSgwLCA0KVxuLy8gICAgIHZhciByZXQgPSBTZXR0aW5ncy5uZXdsaW5lKCkgKyBcIiAgICAgIFwiICtcbi8vICAgICAgICAgY29sb3IoXCJkaWZmIGFkZGVkXCIsIFwiKyBleHBlY3RlZFwiKSArIFwiIFwiICtcbi8vICAgICAgICAgY29sb3IoXCJkaWZmIHJlbW92ZWRcIiwgXCItIGFjdHVhbFwiKSArXG4vLyAgICAgICAgIFNldHRpbmdzLm5ld2xpbmUoKVxuLy9cbi8vICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgaSsrKSB7XG4vLyAgICAgICAgIHZhciBsaW5lID0gbGluZXNbaV1cbi8vXG4vLyAgICAgICAgIGlmIChsaW5lWzBdID09PSBcIitcIikge1xuLy8gICAgICAgICAgICAgcmV0ICs9IFNldHRpbmdzLm5ld2xpbmUoKSArIFwiICAgICAgXCIgKyBjb2xvcihcImRpZmYgYWRkZWRcIiwgbGluZSlcbi8vICAgICAgICAgfSBlbHNlIGlmIChsaW5lWzBdID09PSBcIi1cIikge1xuLy8gICAgICAgICAgICAgcmV0ICs9IFNldHRpbmdzLm5ld2xpbmUoKSArIFwiICAgICAgXCIgK1xuLy8gICAgICAgICAgICAgICAgIGNvbG9yKFwiZGlmZiByZW1vdmVkXCIsIGxpbmUpXG4vLyAgICAgICAgIH0gZWxzZSBpZiAoIS9cXEBcXEB8XFxcXCBObyBuZXdsaW5lLy50ZXN0KGxpbmUpKSB7XG4vLyAgICAgICAgICAgICByZXQgKz0gU2V0dGluZ3MubmV3bGluZSgpICsgXCIgICAgICBcIiArIGxpbmVcbi8vICAgICAgICAgfVxuLy8gICAgIH1cbi8vXG4vLyAgICAgcmV0dXJuIHJldFxuLy8gfVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxuLy8gR2VuZXJhbCBDTEkgYW5kIHJlcG9ydGVyIHNldHRpbmdzLiBJZiBzb21ldGhpbmcgbmVlZHMgdG9cblxudmFyIENvbnNvbGUgPSByZXF1aXJlKFwiLi9yZXBsYWNlZC9jb25zb2xlXCIpXG5cbnZhciB3aW5kb3dXaWR0aCA9IENvbnNvbGUud2luZG93V2lkdGhcbnZhciBuZXdsaW5lID0gQ29uc29sZS5uZXdsaW5lXG52YXIgU3ltYm9scyA9IENvbnNvbGUuU3ltYm9sc1xudmFyIGRlZmF1bHRPcHRzID0gQ29uc29sZS5kZWZhdWx0T3B0c1xuXG5leHBvcnRzLndpbmRvd1dpZHRoID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gd2luZG93V2lkdGggfVxuZXhwb3J0cy5uZXdsaW5lID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gbmV3bGluZSB9XG5leHBvcnRzLnN5bWJvbHMgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBTeW1ib2xzIH1cbmV4cG9ydHMuZGVmYXVsdE9wdHMgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBkZWZhdWx0T3B0cyB9XG5cbmV4cG9ydHMuc2V0V2luZG93V2lkdGggPSBmdW5jdGlvbiAodmFsdWUpIHsgcmV0dXJuIHdpbmRvd1dpZHRoID0gdmFsdWUgfVxuZXhwb3J0cy5zZXROZXdsaW5lID0gZnVuY3Rpb24gKHZhbHVlKSB7IHJldHVybiBuZXdsaW5lID0gdmFsdWUgfVxuZXhwb3J0cy5zZXRTeW1ib2xzID0gZnVuY3Rpb24gKHZhbHVlKSB7IHJldHVybiBTeW1ib2xzID0gdmFsdWUgfVxuZXhwb3J0cy5zZXREZWZhdWx0T3B0cyA9IGZ1bmN0aW9uICh2YWx1ZSkgeyByZXR1cm4gZGVmYXVsdE9wdHMgPSB2YWx1ZSB9XG5cbi8vIENvbnNvbGUuY29sb3JTdXBwb3J0IGlzIGEgbWFzayB3aXRoIHRoZSBmb2xsb3dpbmcgYml0czpcbi8vIDB4MSAtIGlmIHNldCwgY29sb3JzIHN1cHBvcnRlZCBieSBkZWZhdWx0XG4vLyAweDIgLSBpZiBzZXQsIGZvcmNlIGNvbG9yIHN1cHBvcnRcbi8vXG4vLyBUaGlzIGlzIHB1cmVseSBhbiBpbXBsZW1lbnRhdGlvbiBkZXRhaWwsIGFuZCBpcyBpbnZpc2libGUgdG8gdGhlIG91dHNpZGVcbi8vIHdvcmxkLlxudmFyIGNvbG9yU3VwcG9ydCA9IENvbnNvbGUuY29sb3JTdXBwb3J0XG52YXIgbWFzayA9IGNvbG9yU3VwcG9ydFxuXG5leHBvcnRzLkNvbG9ycyA9IHtcbiAgICBzdXBwb3J0ZWQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIChtYXNrICYgMHgxKSAhPT0gMFxuICAgIH0sXG5cbiAgICBmb3JjZWQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIChtYXNrICYgMHgyKSAhPT0gMFxuICAgIH0sXG5cbiAgICBtYXliZVNldDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIGlmICgobWFzayAmIDB4MikgPT09IDApIG1hc2sgPSB2YWx1ZSA/IDB4MSA6IDBcbiAgICB9LFxuXG4gICAgbWF5YmVSZXN0b3JlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICgobWFzayAmIDB4MikgPT09IDApIG1hc2sgPSBjb2xvclN1cHBvcnQgJiAweDFcbiAgICB9LFxuXG4gICAgLy8gT25seSBmb3IgZGVidWdnaW5nXG4gICAgZm9yY2VTZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICBtYXNrID0gdmFsdWUgPyAweDMgOiAweDJcbiAgICB9LFxuXG4gICAgZm9yY2VSZXN0b3JlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIG1hc2sgPSBjb2xvclN1cHBvcnRcbiAgICB9LFxuXG4gICAgZ2V0U3VwcG9ydDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3VwcG9ydGVkOiAoY29sb3JTdXBwb3J0ICYgMHgxKSAhPT0gMCxcbiAgICAgICAgICAgIGZvcmNlZDogKGNvbG9yU3VwcG9ydCAmIDB4MikgIT09IDAsXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgc2V0U3VwcG9ydDogZnVuY3Rpb24gKG9wdHMpIHtcbiAgICAgICAgbWFzayA9IGNvbG9yU3VwcG9ydCA9XG4gICAgICAgICAgICAob3B0cy5zdXBwb3J0ZWQgPyAweDEgOiAwKSB8IChvcHRzLmZvcmNlZCA/IDB4MiA6IDApXG4gICAgfSxcbn1cbiIsIlwidXNlIHN0cmljdFwiXG5cbmV4cG9ydHMuZ2V0VHlwZSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIGlmICh2YWx1ZSA9PSBudWxsKSByZXR1cm4gXCJudWxsXCJcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHJldHVybiBcImFycmF5XCJcbiAgICByZXR1cm4gdHlwZW9mIHZhbHVlXG59XG5cbi8vIFBoYW50b21KUywgSUUsIGFuZCBwb3NzaWJseSBFZGdlIGRvbid0IHNldCB0aGUgc3RhY2sgdHJhY2UgdW50aWwgdGhlIGVycm9yIGlzXG4vLyB0aHJvd24uIE5vdGUgdGhhdCB0aGlzIHByZWZlcnMgYW4gZXhpc3Rpbmcgc3RhY2sgZmlyc3QsIHNpbmNlIG5vbi1uYXRpdmVcbi8vIGVycm9ycyBsaWtlbHkgYWxyZWFkeSBjb250YWluIHRoaXMuIE5vdGUgdGhhdCB0aGlzIGlzbid0IG5lY2Vzc2FyeSBpbiB0aGVcbi8vIENMSSAtIHRoYXQgb25seSB0YXJnZXRzIE5vZGUuXG5leHBvcnRzLmdldFN0YWNrID0gZnVuY3Rpb24gKGUpIHtcbiAgICB2YXIgc3RhY2sgPSBlLnN0YWNrXG5cbiAgICBpZiAoIShlIGluc3RhbmNlb2YgRXJyb3IpIHx8IHN0YWNrICE9IG51bGwpIHJldHVybiBzdGFja1xuXG4gICAgdHJ5IHtcbiAgICAgICAgdGhyb3cgZVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgcmV0dXJuIGUuc3RhY2tcbiAgICB9XG59XG5cbmV4cG9ydHMucGNhbGwgPSBmdW5jdGlvbiAoZnVuYykge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIHJldHVybiBmdW5jKGZ1bmN0aW9uIChlLCB2YWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuIGUgIT0gbnVsbCA/IHJlamVjdChlKSA6IHJlc29sdmUodmFsdWUpXG4gICAgICAgIH0pXG4gICAgfSlcbn1cblxuZXhwb3J0cy5wZWFjaCA9IGZ1bmN0aW9uIChsaXN0LCBmdW5jKSB7XG4gICAgdmFyIGxlbiA9IGxpc3QubGVuZ3RoXG4gICAgdmFyIHAgPSBQcm9taXNlLnJlc29sdmUoKVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICBwID0gcC50aGVuKGZ1bmMuYmluZCh1bmRlZmluZWQsIGxpc3RbaV0sIGkpKVxuICAgIH1cblxuICAgIHJldHVybiBwXG59XG4iLCJcInVzZSBzdHJpY3RcIlxuXG4vKiBnbG9iYWwgU3ltYm9sLCBVaW50OEFycmF5LCBEYXRhVmlldywgQXJyYXlCdWZmZXIsIEFycmF5QnVmZmVyVmlldywgTWFwLFxuICAgIFNldCAqL1xuXG4vKipcbiAqIERlZXAgbWF0Y2hpbmcgYWxnb3JpdGhtIGZvciBgdC5tYXRjaGAgYW5kIGB0LmRlZXBFcXVhbGAsIHdpdGggemVyb1xuICogZGVwZW5kZW5jaWVzLiBOb3RlIHRoZSBmb2xsb3dpbmc6XG4gKlxuICogLSBUaGlzIGlzIHJlbGF0aXZlbHkgcGVyZm9ybWFuY2UtdHVuZWQsIGFsdGhvdWdoIGl0IHByZWZlcnMgaGlnaCBjb3JyZWN0bmVzcy5cbiAqICAgUGF0Y2ggd2l0aCBjYXJlLCBzaW5jZSBwZXJmb3JtYW5jZSBpcyBhIGNvbmNlcm4uXG4gKiAtIFRoaXMgZG9lcyBwYWNrIGEgKmxvdCogb2YgZmVhdHVyZXMuIFRoZXJlJ3MgYSByZWFzb24gd2h5IHRoaXMgaXMgc28gbG9uZy5cbiAqIC0gU29tZSBvZiB0aGUgZHVwbGljYXRpb24gaXMgaW50ZW50aW9uYWwuIEl0J3MgZ2VuZXJhbGx5IGNvbW1lbnRlZCwgYnV0IGl0J3NcbiAqICAgbWFpbmx5IGZvciBwZXJmb3JtYW5jZSwgc2luY2UgdGhlIGVuZ2luZSBuZWVkcyBpdHMgdHlwZSBpbmZvLlxuICogLSBQb2x5ZmlsbGVkIGNvcmUtanMgU3ltYm9scyBmcm9tIGNyb3NzLW9yaWdpbiBjb250ZXh0cyB3aWxsIG5ldmVyIHJlZ2lzdGVyXG4gKiAgIGFzIGJlaW5nIGFjdHVhbCBTeW1ib2xzLlxuICpcbiAqIEFuZCBpbiBjYXNlIHlvdSdyZSB3b25kZXJpbmcgYWJvdXQgdGhlIGxvbmdlciBmdW5jdGlvbnMgYW5kIG9jY2FzaW9uYWxcbiAqIHJlcGV0aXRpb24sIGl0J3MgYmVjYXVzZSBWOCdzIGlubGluZXIgaXNuJ3QgYWx3YXlzIGludGVsbGlnZW50IGVub3VnaCB0byBkZWFsXG4gKiB3aXRoIHRoZSBzdXBlciBoaWdobHkgcG9seW1vcnBoaWMgZGF0YSB0aGlzIG9mdGVuIGRlYWxzIHdpdGgsIGFuZCBKUyBkb2Vzbid0XG4gKiBoYXZlIGNvbXBpbGUtdGltZSBtYWNyb3MuIChBbHNvLCBTd2VldC5qcyBpc24ndCB3b3J0aCB0aGUgaGFzc2xlLilcbiAqL1xuXG52YXIgb2JqZWN0VG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nXG52YXIgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eVxuXG52YXIgc3VwcG9ydHNVbmljb2RlID0gaGFzT3duLmNhbGwoUmVnRXhwLnByb3RvdHlwZSwgXCJ1bmljb2RlXCIpXG52YXIgc3VwcG9ydHNTdGlja3kgPSBoYXNPd24uY2FsbChSZWdFeHAucHJvdG90eXBlLCBcInN0aWNreVwiKVxuXG4vLyBMZWdhY3kgZW5naW5lcyBoYXZlIHNldmVyYWwgaXNzdWVzIHdoZW4gaXQgY29tZXMgdG8gYHR5cGVvZmAuXG52YXIgaXNGdW5jdGlvbiA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gU2xvd0lzRnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgaWYgKHZhbHVlID09IG51bGwpIHJldHVybiBmYWxzZVxuXG4gICAgICAgIHZhciB0YWcgPSBvYmplY3RUb1N0cmluZy5jYWxsKHZhbHVlKVxuXG4gICAgICAgIHJldHVybiB0YWcgPT09IFwiW29iamVjdCBGdW5jdGlvbl1cIiB8fFxuICAgICAgICAgICAgdGFnID09PSBcIltvYmplY3QgR2VuZXJhdG9yRnVuY3Rpb25dXCIgfHxcbiAgICAgICAgICAgIHRhZyA9PT0gXCJbb2JqZWN0IEFzeW5jRnVuY3Rpb25dXCIgfHxcbiAgICAgICAgICAgIHRhZyA9PT0gXCJbb2JqZWN0IFByb3h5XVwiXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNQb2lzb25lZChvYmplY3QpIHtcbiAgICAgICAgcmV0dXJuIG9iamVjdCAhPSBudWxsICYmIHR5cGVvZiBvYmplY3QgIT09IFwiZnVuY3Rpb25cIlxuICAgIH1cblxuICAgIC8vIEluIFNhZmFyaSAxMCwgYHR5cGVvZiBQcm94eSA9PT0gXCJvYmplY3RcImBcbiAgICBpZiAoaXNQb2lzb25lZChnbG9iYWwuUHJveHkpKSByZXR1cm4gU2xvd0lzRnVuY3Rpb25cblxuICAgIC8vIEluIFNhZmFyaSA4LCBzZXZlcmFsIHR5cGVkIGFycmF5IGNvbnN0cnVjdG9ycyBhcmUgYHR5cGVvZiBDID09PSBcIm9iamVjdFwiYFxuICAgIGlmIChpc1BvaXNvbmVkKGdsb2JhbC5JbnQ4QXJyYXkpKSByZXR1cm4gU2xvd0lzRnVuY3Rpb25cblxuICAgIC8vIEluIG9sZCBWOCwgUmVnRXhwcyBhcmUgY2FsbGFibGVcbiAgICBpZiAodHlwZW9mIC94LyA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4gU2xvd0lzRnVuY3Rpb24gLy8gZXNsaW50LWRpc2FibGUtbGluZVxuXG4gICAgLy8gTGVhdmUgdGhpcyBmb3Igbm9ybWFsIHRoaW5ncy4gSXQncyBlYXNpbHkgaW5saW5lZC5cbiAgICByZXR1cm4gZnVuY3Rpb24gaXNGdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSBcImZ1bmN0aW9uXCJcbiAgICB9XG59KSgpXG5cbi8vIFNldCB1cCBvdXIgb3duIGJ1ZmZlciBjaGVjay4gV2Ugc2hvdWxkIGFsd2F5cyBhY2NlcHQgdGhlIHBvbHlmaWxsLCBldmVuIGluXG4vLyBOb2RlLiBOb3RlIHRoYXQgaXQgdXNlcyBgZ2xvYmFsLkJ1ZmZlcmAgdG8gYXZvaWQgaW5jbHVkaW5nIGBidWZmZXJgIGluIHRoZVxuLy8gYnVuZGxlLlxuXG52YXIgQnVmZmVyTmF0aXZlID0gMFxudmFyIEJ1ZmZlclBvbHlmaWxsID0gMVxudmFyIEJ1ZmZlclNhZmFyaSA9IDJcblxudmFyIGJ1ZmZlclN1cHBvcnQgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEZha2VCdWZmZXIoKSB7fVxuICAgIEZha2VCdWZmZXIuaXNCdWZmZXIgPSBmdW5jdGlvbiAoKSB7IHJldHVybiB0cnVlIH1cblxuICAgIC8vIE9ubHkgU2FmYXJpIDUtNyBoYXMgZXZlciBoYWQgdGhpcyBpc3N1ZS5cbiAgICBpZiAobmV3IEZha2VCdWZmZXIoKS5jb25zdHJ1Y3RvciAhPT0gRmFrZUJ1ZmZlcikgcmV0dXJuIEJ1ZmZlclNhZmFyaVxuICAgIGlmICghaXNGdW5jdGlvbihnbG9iYWwuQnVmZmVyKSkgcmV0dXJuIEJ1ZmZlclBvbHlmaWxsXG4gICAgaWYgKCFpc0Z1bmN0aW9uKGdsb2JhbC5CdWZmZXIuaXNCdWZmZXIpKSByZXR1cm4gQnVmZmVyUG9seWZpbGxcbiAgICAvLyBBdm9pZCB0aGUgcG9seWZpbGxcbiAgICBpZiAoZ2xvYmFsLkJ1ZmZlci5pc0J1ZmZlcihuZXcgRmFrZUJ1ZmZlcigpKSkgcmV0dXJuIEJ1ZmZlclBvbHlmaWxsXG4gICAgcmV0dXJuIEJ1ZmZlck5hdGl2ZVxufSkoKVxuXG52YXIgZ2xvYmFsSXNCdWZmZXIgPSBidWZmZXJTdXBwb3J0ID09PSBCdWZmZXJOYXRpdmVcbiAgICA/IGdsb2JhbC5CdWZmZXIuaXNCdWZmZXJcbiAgICA6IHVuZGVmaW5lZFxuXG5mdW5jdGlvbiBpc0J1ZmZlcihvYmplY3QpIHtcbiAgICBpZiAoYnVmZmVyU3VwcG9ydCA9PT0gQnVmZmVyTmF0aXZlICYmIGdsb2JhbElzQnVmZmVyKG9iamVjdCkpIHJldHVybiB0cnVlXG4gICAgaWYgKGJ1ZmZlclN1cHBvcnQgPT09IEJ1ZmZlclNhZmFyaSAmJiBvYmplY3QuX2lzQnVmZmVyKSByZXR1cm4gdHJ1ZVxuXG4gICAgdmFyIEIgPSBvYmplY3QuY29uc3RydWN0b3JcblxuICAgIGlmICghaXNGdW5jdGlvbihCKSkgcmV0dXJuIGZhbHNlXG4gICAgaWYgKCFpc0Z1bmN0aW9uKEIuaXNCdWZmZXIpKSByZXR1cm4gZmFsc2VcbiAgICByZXR1cm4gQi5pc0J1ZmZlcihvYmplY3QpXG59XG5cbi8vIGNvcmUtanMnIHN5bWJvbHMgYXJlIG9iamVjdHMsIGFuZCBzb21lIG9sZCB2ZXJzaW9ucyBvZiBWOCBlcnJvbmVvdXNseSBoYWRcbi8vIGB0eXBlb2YgU3ltYm9sKCkgPT09IFwib2JqZWN0XCJgLlxudmFyIHN5bWJvbHNBcmVPYmplY3RzID0gaXNGdW5jdGlvbihnbG9iYWwuU3ltYm9sKSAmJlxuICAgIHR5cGVvZiBTeW1ib2woKSA9PT0gXCJvYmplY3RcIlxuXG4vLyBgY29udGV4dGAgaXMgYSBiaXQgZmllbGQsIHdpdGggdGhlIGZvbGxvd2luZyBiaXRzLiBUaGlzIGlzIG5vdCBhcyBtdWNoIGZvclxuLy8gcGVyZm9ybWFuY2UgdGhhbiB0byBqdXN0IHJlZHVjZSB0aGUgbnVtYmVyIG9mIHBhcmFtZXRlcnMgSSBuZWVkIHRvIGJlXG4vLyB0aHJvd2luZyBhcm91bmQuXG52YXIgU3RyaWN0ID0gMVxudmFyIEluaXRpYWwgPSAyXG52YXIgU2FtZVByb3RvID0gNFxuXG5leHBvcnRzLm1hdGNoID0gZnVuY3Rpb24gKGEsIGIpIHtcbiAgICByZXR1cm4gbWF0Y2goYSwgYiwgSW5pdGlhbCwgdW5kZWZpbmVkLCB1bmRlZmluZWQpXG59XG5cbmV4cG9ydHMuc3RyaWN0ID0gZnVuY3Rpb24gKGEsIGIpIHtcbiAgICByZXR1cm4gbWF0Y2goYSwgYiwgU3RyaWN0IHwgSW5pdGlhbCwgdW5kZWZpbmVkLCB1bmRlZmluZWQpXG59XG5cbi8vIEZlYXR1cmUtdGVzdCBkZWxheWVkIHN0YWNrIGFkZGl0aW9ucyBhbmQgZXh0cmEga2V5cy4gUGhhbnRvbUpTIGFuZCBJRSBib3RoXG4vLyB3YWl0IHVudGlsIHRoZSBlcnJvciB3YXMgYWN0dWFsbHkgdGhyb3duIGZpcnN0LCBhbmQgYXNzaWduIHRoZW0gYXMgb3duXG4vLyBwcm9wZXJ0aWVzLCB3aGljaCBpcyB1bmhlbHBmdWwgZm9yIGFzc2VydGlvbnMuIFRoaXMgcmV0dXJucyBhIGZ1bmN0aW9uIHRvXG4vLyBzcGVlZCB1cCBjYXNlcyB3aGVyZSBgT2JqZWN0LmtleXNgIGlzIHN1ZmZpY2llbnQgKGUuZy4gaW4gQ2hyb21lL0ZGL05vZGUpLlxuLy9cbi8vIFRoaXMgd291bGRuJ3QgYmUgbmVjZXNzYXJ5IGlmIHRob3NlIGVuZ2luZXMgd291bGQgbWFrZSB0aGUgc3RhY2sgYSBnZXR0ZXIsXG4vLyBhbmQgcmVjb3JkIGl0IHdoZW4gdGhlIGVycm9yIHdhcyBjcmVhdGVkLCBub3Qgd2hlbiBpdCB3YXMgdGhyb3duLiBJdFxuLy8gc3BlY2lmaWNhbGx5IGZpbHRlcnMgb3V0IGVycm9ycyBhbmQgb25seSBjaGVja3MgZXhpc3RpbmcgZGVzY3JpcHRvcnMsIGp1c3QgdG9cbi8vIGtlZXAgdGhlIG1lc3MgZnJvbSBhZmZlY3RpbmcgZXZlcnl0aGluZyAoaXQncyBub3QgZnVsbHkgY29ycmVjdCwgYnV0IGl0J3Ncbi8vIG5lY2Vzc2FyeSkuXG52YXIgcmVxdWlyZXNQcm94eSA9IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHRlc3QgPSBuZXcgRXJyb3IoKVxuICAgIHZhciBvbGQgPSBPYmplY3QuY3JlYXRlKG51bGwpXG5cbiAgICBPYmplY3Qua2V5cyh0ZXN0KS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHsgb2xkW2tleV0gPSB0cnVlIH0pXG5cbiAgICB0cnkge1xuICAgICAgICB0aHJvdyB0ZXN0XG4gICAgfSBjYXRjaCAoXykge1xuICAgICAgICAvLyBpZ25vcmVcbiAgICB9XG5cbiAgICByZXR1cm4gT2JqZWN0LmtleXModGVzdCkuc29tZShmdW5jdGlvbiAoa2V5KSB7IHJldHVybiAhb2xkW2tleV0gfSlcbn0pKClcblxuZnVuY3Rpb24gaXNJZ25vcmVkKG9iamVjdCwga2V5KSB7XG4gICAgc3dpdGNoIChrZXkpIHtcbiAgICBjYXNlIFwibGluZVwiOiBpZiAodHlwZW9mIG9iamVjdFtrZXldICE9PSBcIm51bWJlclwiKSByZXR1cm4gZmFsc2U7IGJyZWFrXG4gICAgY2FzZSBcInNvdXJjZVVSTFwiOiBpZiAodHlwZW9mIG9iamVjdFtrZXldICE9PSBcInN0cmluZ1wiKSByZXR1cm4gZmFsc2U7IGJyZWFrXG4gICAgY2FzZSBcInN0YWNrXCI6IGlmICh0eXBlb2Ygb2JqZWN0W2tleV0gIT09IFwic3RyaW5nXCIpIHJldHVybiBmYWxzZTsgYnJlYWtcbiAgICBkZWZhdWx0OiByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgICB2YXIgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Iob2JqZWN0LCBrZXkpXG5cbiAgICByZXR1cm4gIWRlc2MuY29uZmlndXJhYmxlICYmIGRlc2MuZW51bWVyYWJsZSAmJiAhZGVzYy53cml0YWJsZVxufVxuXG4vLyBUaGlzIGlzIG9ubHkgaW52b2tlZCB3aXRoIGVycm9ycywgc28gaXQncyBub3QgZ29pbmcgdG8gcHJlc2VudCBhIHNpZ25pZmljYW50XG4vLyBzbG93IGRvd24uXG5mdW5jdGlvbiBnZXRLZXlzU3RyaXBwZWQob2JqZWN0KSB7XG4gICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhvYmplY3QpXG4gICAgdmFyIGNvdW50ID0gMFxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICghaXNJZ25vcmVkKG9iamVjdCwga2V5c1tpXSkpIGtleXNbY291bnQrK10gPSBrZXlzW2ldXG4gICAgfVxuXG4gICAga2V5cy5sZW5ndGggPSBjb3VudFxuICAgIHJldHVybiBrZXlzXG59XG5cbi8vIFdheSBmYXN0ZXIsIHNpbmNlIHR5cGVkIGFycmF5IGluZGljZXMgYXJlIGFsd2F5cyBkZW5zZSBhbmQgY29udGFpbiBudW1iZXJzLlxuXG4vLyBTZXR1cCBmb3IgYGlzQnVmZmVyT3JWaWV3YCBhbmQgYGlzVmlld2BcbnZhciBBcnJheUJ1ZmZlck5vbmUgPSAwXG52YXIgQXJyYXlCdWZmZXJMZWdhY3kgPSAxXG52YXIgQXJyYXlCdWZmZXJDdXJyZW50ID0gMlxuXG52YXIgYXJyYXlCdWZmZXJTdXBwb3J0ID0gKGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIWlzRnVuY3Rpb24oZ2xvYmFsLlVpbnQ4QXJyYXkpKSByZXR1cm4gQXJyYXlCdWZmZXJOb25lXG4gICAgaWYgKCFpc0Z1bmN0aW9uKGdsb2JhbC5EYXRhVmlldykpIHJldHVybiBBcnJheUJ1ZmZlck5vbmVcbiAgICBpZiAoIWlzRnVuY3Rpb24oZ2xvYmFsLkFycmF5QnVmZmVyKSkgcmV0dXJuIEFycmF5QnVmZmVyTm9uZVxuICAgIGlmIChpc0Z1bmN0aW9uKGdsb2JhbC5BcnJheUJ1ZmZlci5pc1ZpZXcpKSByZXR1cm4gQXJyYXlCdWZmZXJDdXJyZW50XG4gICAgaWYgKGlzRnVuY3Rpb24oZ2xvYmFsLkFycmF5QnVmZmVyVmlldykpIHJldHVybiBBcnJheUJ1ZmZlckxlZ2FjeVxuICAgIHJldHVybiBBcnJheUJ1ZmZlck5vbmVcbn0pKClcblxuLy8gSWYgdHlwZWQgYXJyYXlzIGFyZW4ndCBzdXBwb3J0ZWQgKHRoZXkgd2VyZW4ndCB0ZWNobmljYWxseSBwYXJ0IG9mXG4vLyBFUzUsIGJ1dCBtYW55IGVuZ2luZXMgaW1wbGVtZW50ZWQgS2hyb25vcycgc3BlYyBiZWZvcmUgRVM2KSwgdGhlblxuLy8ganVzdCBmYWxsIGJhY2sgdG8gZ2VuZXJpYyBidWZmZXIgZGV0ZWN0aW9uLlxuZnVuY3Rpb24gZmxvYXRJcyhhLCBiKSB7XG4gICAgLy8gU28gTmFOcyBhcmUgY29uc2lkZXJlZCBlcXVhbC5cbiAgICByZXR1cm4gYSA9PT0gYiB8fCBhICE9PSBhICYmIGIgIT09IGIgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1zZWxmLWNvbXBhcmVcbn1cblxuZnVuY3Rpb24gbWF0Y2hWaWV3KGEsIGIpIHtcbiAgICB2YXIgY291bnQgPSBhLmxlbmd0aFxuXG4gICAgaWYgKGNvdW50ICE9PSBiLmxlbmd0aCkgcmV0dXJuIGZhbHNlXG5cbiAgICB3aGlsZSAoY291bnQpIHtcbiAgICAgICAgY291bnQtLVxuICAgICAgICBpZiAoIWZsb2F0SXMoYVtjb3VudF0sIGJbY291bnRdKSkgcmV0dXJuIGZhbHNlXG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWVcbn1cblxudmFyIGlzVmlldyA9IChmdW5jdGlvbiAoKSB7XG4gICAgaWYgKGFycmF5QnVmZmVyU3VwcG9ydCA9PT0gQXJyYXlCdWZmZXJOb25lKSByZXR1cm4gdW5kZWZpbmVkXG4gICAgLy8gRVM2IHR5cGVkIGFycmF5c1xuICAgIGlmIChhcnJheUJ1ZmZlclN1cHBvcnQgPT09IEFycmF5QnVmZmVyQ3VycmVudCkgcmV0dXJuIEFycmF5QnVmZmVyLmlzVmlld1xuICAgIC8vIGxlZ2FjeSB0eXBlZCBhcnJheXNcbiAgICByZXR1cm4gZnVuY3Rpb24gaXNWaWV3KG9iamVjdCkge1xuICAgICAgICByZXR1cm4gb2JqZWN0IGluc3RhbmNlb2YgQXJyYXlCdWZmZXJWaWV3XG4gICAgfVxufSkoKVxuXG4vLyBTdXBwb3J0IGNoZWNraW5nIG1hcHMgYW5kIHNldHMgZGVlcGx5LiBUaGV5IGFyZSBvYmplY3QtbGlrZSBlbm91Z2ggdG8gY291bnQsXG4vLyBhbmQgYXJlIHVzZWZ1bCBpbiB0aGVpciBvd24gcmlnaHQuIFRoZSBjb2RlIGlzIHJhdGhlciBtZXNzeSwgYnV0IG1haW5seSB0b1xuLy8ga2VlcCB0aGUgb3JkZXItaW5kZXBlbmRlbnQgY2hlY2tpbmcgZnJvbSBiZWNvbWluZyBpbnNhbmVseSBzbG93LlxudmFyIHN1cHBvcnRzTWFwID0gaXNGdW5jdGlvbihnbG9iYWwuTWFwKVxudmFyIHN1cHBvcnRzU2V0ID0gaXNGdW5jdGlvbihnbG9iYWwuU2V0KVxuXG4vLyBPbmUgb2YgdGhlIHNldHMgYW5kIGJvdGggbWFwcycga2V5cyBhcmUgY29udmVydGVkIHRvIGFycmF5cyBmb3IgZmFzdGVyXG4vLyBoYW5kbGluZy5cbmZ1bmN0aW9uIGtleUxpc3QobWFwKSB7XG4gICAgdmFyIGxpc3QgPSBuZXcgQXJyYXkobWFwLnNpemUpXG4gICAgdmFyIGkgPSAwXG4gICAgdmFyIGl0ZXIgPSBtYXAua2V5cygpXG5cbiAgICBmb3IgKHZhciBuZXh0ID0gaXRlci5uZXh0KCk7ICFuZXh0LmRvbmU7IG5leHQgPSBpdGVyLm5leHQoKSkge1xuICAgICAgICBsaXN0W2krK10gPSBuZXh0LnZhbHVlXG4gICAgfVxuXG4gICAgcmV0dXJuIGxpc3Rcbn1cblxuLy8gVGhlIHBhaXIgb2YgYXJyYXlzIGFyZSBhbGlnbmVkIGluIGEgc2luZ2xlIE8obl4yKSBvcGVyYXRpb24gKG1vZCBkZWVwXG4vLyBtYXRjaGluZyBhbmQgcm90YXRpb24pLCBhZGFwdGluZyB0byBPKG4pIHdoZW4gdGhleSdyZSBhbHJlYWR5IGFsaWduZWQuXG5mdW5jdGlvbiBtYXRjaEtleShjdXJyZW50LCBha2V5cywgc3RhcnQsIGVuZCwgY29udGV4dCwgbGVmdCwgcmlnaHQpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtcGFyYW1zLCBtYXgtbGVuXG4gICAgZm9yICh2YXIgaSA9IHN0YXJ0ICsgMTsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICAgIHZhciBrZXkgPSBha2V5c1tpXVxuXG4gICAgICAgIGlmIChtYXRjaChjdXJyZW50LCBrZXksIGNvbnRleHQsIGxlZnQsIHJpZ2h0KSkge1xuICAgICAgICAgICAgLy8gVE9ETzogb25jZSBlbmdpbmVzIGFjdHVhbGx5IG9wdGltaXplIGBjb3B5V2l0aGluYCwgdXNlIHRoYXRcbiAgICAgICAgICAgIC8vIGluc3RlYWQuIEl0J2xsIGJlIG11Y2ggZmFzdGVyIHRoYW4gdGhpcyBsb29wLlxuICAgICAgICAgICAgd2hpbGUgKGkgPiBzdGFydCkgYWtleXNbaV0gPSBha2V5c1stLWldXG4gICAgICAgICAgICBha2V5c1tpXSA9IGtleVxuICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBmYWxzZVxufVxuXG5mdW5jdGlvbiBtYXRjaFZhbHVlcyhhLCBiLCBha2V5cywgYmtleXMsIGVuZCwgY29udGV4dCwgbGVmdCwgcmlnaHQpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtcGFyYW1zLCBtYXgtbGVuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBlbmQ7IGkrKykge1xuICAgICAgICBpZiAoIW1hdGNoKGEuZ2V0KGFrZXlzW2ldKSwgYi5nZXQoYmtleXNbaV0pLCBjb250ZXh0LCBsZWZ0LCByaWdodCkpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWVcbn1cblxuLy8gUG9zc2libHkgZXhwZW5zaXZlIG9yZGVyLWluZGVwZW5kZW50IGtleS12YWx1ZSBtYXRjaC4gRmlyc3QsIHRyeSB0byBhdm9pZCBpdFxuLy8gYnkgY29uc2VydmF0aXZlbHkgYXNzdW1pbmcgZXZlcnl0aGluZyBpcyBpbiBvcmRlciAtIGEgY2hlYXAgTyhuKSBpcyBhbHdheXNcbi8vIG5pY2VyIHRoYW4gYW4gZXhwZW5zaXZlIE8obl4yKS5cbmZ1bmN0aW9uIG1hdGNoTWFwKGEsIGIsIGNvbnRleHQsIGxlZnQsIHJpZ2h0KSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LXBhcmFtcywgbWF4LWxlblxuICAgIHZhciBlbmQgPSBhLnNpemVcbiAgICB2YXIgYWtleXMgPSBrZXlMaXN0KGEpXG4gICAgdmFyIGJrZXlzID0ga2V5TGlzdChiKVxuICAgIHZhciBpID0gMFxuXG4gICAgd2hpbGUgKGkgIT09IGVuZCAmJiBtYXRjaChha2V5c1tpXSwgYmtleXNbaV0sIGNvbnRleHQsIGxlZnQsIHJpZ2h0KSkge1xuICAgICAgICBpKytcbiAgICB9XG5cbiAgICBpZiAoaSA9PT0gZW5kKSB7XG4gICAgICAgIHJldHVybiBtYXRjaFZhbHVlcyhhLCBiLCBha2V5cywgYmtleXMsIGVuZCwgY29udGV4dCwgbGVmdCwgcmlnaHQpXG4gICAgfVxuXG4gICAgLy8gRG9uJ3QgY29tcGFyZSB0aGUgc2FtZSBrZXkgdHdpY2VcbiAgICBpZiAoIW1hdGNoS2V5KGJrZXlzW2ldLCBha2V5cywgaSwgZW5kLCBjb250ZXh0LCBsZWZ0LCByaWdodCkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuXG4gICAgLy8gSWYgdGhlIGFib3ZlIGZhaWxzLCB3aGlsZSB3ZSdyZSBhdCBpdCwgbGV0J3Mgc29ydCB0aGVtIGFzIHdlIGdvLCBzb1xuICAgIC8vIHRoZSBrZXkgb3JkZXIgbWF0Y2hlcy5cbiAgICB3aGlsZSAoKytpIDwgZW5kKSB7XG4gICAgICAgIHZhciBrZXkgPSBia2V5c1tpXVxuXG4gICAgICAgIC8vIEFkYXB0IGlmIHRoZSBrZXlzIGFyZSBhbHJlYWR5IGluIG9yZGVyLCB3aGljaCBpcyBmcmVxdWVudGx5IHRoZVxuICAgICAgICAvLyBjYXNlLlxuICAgICAgICBpZiAoIW1hdGNoKGtleSwgYWtleXNbaV0sIGNvbnRleHQsIGxlZnQsIHJpZ2h0KSAmJlxuICAgICAgICAgICAgICAgICFtYXRjaEtleShrZXksIGFrZXlzLCBpLCBlbmQsIGNvbnRleHQsIGxlZnQsIHJpZ2h0KSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbWF0Y2hWYWx1ZXMoYSwgYiwgYWtleXMsIGJrZXlzLCBlbmQsIGNvbnRleHQsIGxlZnQsIHJpZ2h0KVxufVxuXG5mdW5jdGlvbiBoYXNBbGxJZGVudGljYWwoYWxpc3QsIGIpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICghYi5oYXMoYWxpc3RbaV0pKSByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZVxufVxuXG4vLyBDb21wYXJlIHRoZSB2YWx1ZXMgc3RydWN0dXJhbGx5LCBhbmQgaW5kZXBlbmRlbnQgb2Ygb3JkZXIuXG5mdW5jdGlvbiBzZWFyY2hGb3IoYXZhbHVlLCBvYmplY3RzLCBjb250ZXh0LCBsZWZ0LCByaWdodCkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1wYXJhbXMsIG1heC1sZW5cbiAgICBmb3IgKHZhciBqIGluIG9iamVjdHMpIHtcbiAgICAgICAgaWYgKGhhc093bi5jYWxsKG9iamVjdHMsIGopKSB7XG4gICAgICAgICAgICBpZiAobWF0Y2goYXZhbHVlLCBvYmplY3RzW2pdLCBjb250ZXh0LCBsZWZ0LCByaWdodCkpIHtcbiAgICAgICAgICAgICAgICBkZWxldGUgb2JqZWN0c1tqXVxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2Vcbn1cblxuZnVuY3Rpb24gaGFzU3RydWN0dXJlKHZhbHVlLCBjb250ZXh0KSB7XG4gICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiAmJiB2YWx1ZSAhPT0gbnVsbCB8fFxuICAgICAgICAgICAgIShjb250ZXh0ICYgU3RyaWN0KSAmJiB0eXBlb2YgdmFsdWUgPT09IFwic3ltYm9sXCJcbn1cblxuLy8gVGhlIHNldCBhbGdvcml0aG0gaXMgc3RydWN0dXJlZCBhIGxpdHRsZSBkaWZmZXJlbnRseS4gSXQgdGFrZXMgb25lIG9mIHRoZVxuLy8gc2V0cyBpbnRvIGFuIGFycmF5LCBkb2VzIGEgY2hlYXAgaWRlbnRpdHkgY2hlY2ssIHRoZW4gZG9lcyB0aGUgZGVlcCBjaGVjay5cbmZ1bmN0aW9uIG1hdGNoU2V0KGEsIGIsIGNvbnRleHQsIGxlZnQsIHJpZ2h0KSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LXBhcmFtcywgbWF4LWxlblxuICAgIC8vIFRoaXMgaXMgdG8gdHJ5IHRvIGF2b2lkIGFuIGV4cGVuc2l2ZSBzdHJ1Y3R1cmFsIG1hdGNoIG9uIHRoZSBrZXlzLiBUZXN0XG4gICAgLy8gZm9yIGlkZW50aXR5IGZpcnN0LlxuICAgIHZhciBhbGlzdCA9IGtleUxpc3QoYSlcblxuICAgIGlmIChoYXNBbGxJZGVudGljYWwoYWxpc3QsIGIpKSByZXR1cm4gdHJ1ZVxuXG4gICAgdmFyIGl0ZXIgPSBiLnZhbHVlcygpXG4gICAgdmFyIGNvdW50ID0gMFxuICAgIHZhciBvYmplY3RzXG5cbiAgICAvLyBHYXRoZXIgYWxsIHRoZSBvYmplY3RzXG4gICAgZm9yICh2YXIgbmV4dCA9IGl0ZXIubmV4dCgpOyAhbmV4dC5kb25lOyBuZXh0ID0gaXRlci5uZXh0KCkpIHtcbiAgICAgICAgdmFyIGJ2YWx1ZSA9IG5leHQudmFsdWVcblxuICAgICAgICBpZiAoaGFzU3RydWN0dXJlKGJ2YWx1ZSwgY29udGV4dCkpIHtcbiAgICAgICAgICAgIC8vIENyZWF0ZSB0aGUgb2JqZWN0cyBtYXAgbGF6aWx5LiBOb3RlIHRoYXQgdGhpcyBhbHNvIGdyYWJzIFN5bWJvbHNcbiAgICAgICAgICAgIC8vIHdoZW4gbm90IHN0cmljdGx5IG1hdGNoaW5nLCBzaW5jZSB0aGVpciBkZXNjcmlwdGlvbiBpcyBjb21wYXJlZC5cbiAgICAgICAgICAgIGlmIChjb3VudCA9PT0gMCkgb2JqZWN0cyA9IE9iamVjdC5jcmVhdGUobnVsbClcbiAgICAgICAgICAgIG9iamVjdHNbY291bnQrK10gPSBidmFsdWVcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIElmIGV2ZXJ5dGhpbmcgaXMgYSBwcmltaXRpdmUsIHRoZW4gYWJvcnQuXG4gICAgaWYgKGNvdW50ID09PSAwKSByZXR1cm4gZmFsc2VcblxuICAgIC8vIEl0ZXJhdGUgdGhlIG9iamVjdCwgcmVtb3ZpbmcgZWFjaCBvbmUgcmVtYWluaW5nIHdoZW4gbWF0Y2hlZCAoYW5kXG4gICAgLy8gYWJvcnRpbmcgaWYgbm9uZSBjYW4gYmUpLlxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xuICAgICAgICB2YXIgYXZhbHVlID0gYWxpc3RbaV1cblxuICAgICAgICBpZiAoaGFzU3RydWN0dXJlKGF2YWx1ZSwgY29udGV4dCkpIHtcbiAgICAgICAgICAgIGlmICghc2VhcmNoRm9yKGF2YWx1ZSwgb2JqZWN0cywgY29udGV4dCwgbGVmdCwgcmlnaHQpKSByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0cnVlXG59XG5cbmZ1bmN0aW9uIG1hdGNoUmVnRXhwKGEsIGIpIHtcbiAgICByZXR1cm4gYS5zb3VyY2UgPT09IGIuc291cmNlICYmXG4gICAgICAgIGEuZ2xvYmFsID09PSBiLmdsb2JhbCAmJlxuICAgICAgICBhLmlnbm9yZUNhc2UgPT09IGIuaWdub3JlQ2FzZSAmJlxuICAgICAgICBhLm11bHRpbGluZSA9PT0gYi5tdWx0aWxpbmUgJiZcbiAgICAgICAgKCFzdXBwb3J0c1VuaWNvZGUgfHwgYS51bmljb2RlID09PSBiLnVuaWNvZGUpICYmXG4gICAgICAgICghc3VwcG9ydHNTdGlja3kgfHwgYS5zdGlja3kgPT09IGIuc3RpY2t5KVxufVxuXG5mdW5jdGlvbiBtYXRjaFByZXBhcmVEZXNjZW5kKGEsIGIsIGNvbnRleHQsIGxlZnQsIHJpZ2h0KSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LXBhcmFtcywgbWF4LWxlblxuICAgIC8vIENoZWNrIGZvciBjaXJjdWxhciByZWZlcmVuY2VzIGFmdGVyIHRoZSBmaXJzdCBsZXZlbCwgd2hlcmUgaXQnc1xuICAgIC8vIHJlZHVuZGFudC4gTm90ZSB0aGF0IHRoZXkgaGF2ZSB0byBwb2ludCB0byB0aGUgc2FtZSBsZXZlbCB0byBhY3R1YWxseVxuICAgIC8vIGJlIGNvbnNpZGVyZWQgZGVlcGx5IGVxdWFsLlxuICAgIGlmICghKGNvbnRleHQgJiBJbml0aWFsKSkge1xuICAgICAgICB2YXIgbGVmdEluZGV4ID0gbGVmdC5pbmRleE9mKGEpXG4gICAgICAgIHZhciByaWdodEluZGV4ID0gcmlnaHQuaW5kZXhPZihiKVxuXG4gICAgICAgIGlmIChsZWZ0SW5kZXggIT09IHJpZ2h0SW5kZXgpIHJldHVybiBmYWxzZVxuICAgICAgICBpZiAobGVmdEluZGV4ID49IDApIHJldHVybiB0cnVlXG5cbiAgICAgICAgbGVmdC5wdXNoKGEpXG4gICAgICAgIHJpZ2h0LnB1c2goYilcblxuICAgICAgICB2YXIgcmVzdWx0ID0gbWF0Y2hJbm5lcihhLCBiLCBjb250ZXh0LCBsZWZ0LCByaWdodClcblxuICAgICAgICBsZWZ0LnBvcCgpXG4gICAgICAgIHJpZ2h0LnBvcCgpXG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdFxuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBtYXRjaElubmVyKGEsIGIsIGNvbnRleHQgJiB+SW5pdGlhbCwgW2FdLCBbYl0pXG4gICAgfVxufVxuXG5mdW5jdGlvbiBtYXRjaFNhbWVQcm90byhhLCBiLCBjb250ZXh0LCBsZWZ0LCByaWdodCkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1wYXJhbXMsIG1heC1sZW5cbiAgICBpZiAoc3ltYm9sc0FyZU9iamVjdHMgJiYgYSBpbnN0YW5jZW9mIFN5bWJvbCkge1xuICAgICAgICByZXR1cm4gIShjb250ZXh0ICYgU3RyaWN0KSAmJiBhLnRvU3RyaW5nKCkgPT09IGIudG9TdHJpbmcoKVxuICAgIH1cblxuICAgIGlmIChhIGluc3RhbmNlb2YgUmVnRXhwKSByZXR1cm4gbWF0Y2hSZWdFeHAoYSwgYilcbiAgICBpZiAoYSBpbnN0YW5jZW9mIERhdGUpIHJldHVybiBhLnZhbHVlT2YoKSA9PT0gYi52YWx1ZU9mKClcbiAgICBpZiAoYXJyYXlCdWZmZXJTdXBwb3J0ICE9PSBBcnJheUJ1ZmZlck5vbmUpIHtcbiAgICAgICAgaWYgKGEgaW5zdGFuY2VvZiBEYXRhVmlldykge1xuICAgICAgICAgICAgcmV0dXJuIG1hdGNoVmlldyhcbiAgICAgICAgICAgICAgICBuZXcgVWludDhBcnJheShhLmJ1ZmZlciwgYS5ieXRlT2Zmc2V0LCBhLmJ5dGVMZW5ndGgpLFxuICAgICAgICAgICAgICAgIG5ldyBVaW50OEFycmF5KGIuYnVmZmVyLCBiLmJ5dGVPZmZzZXQsIGIuYnl0ZUxlbmd0aCkpXG4gICAgICAgIH1cbiAgICAgICAgaWYgKGEgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikge1xuICAgICAgICAgICAgcmV0dXJuIG1hdGNoVmlldyhuZXcgVWludDhBcnJheShhKSwgbmV3IFVpbnQ4QXJyYXkoYikpXG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzVmlldyhhKSkgcmV0dXJuIG1hdGNoVmlldyhhLCBiKVxuICAgIH1cblxuICAgIGlmIChpc0J1ZmZlcihhKSkgcmV0dXJuIG1hdGNoVmlldyhhLCBiKVxuXG4gICAgaWYgKEFycmF5LmlzQXJyYXkoYSkpIHtcbiAgICAgICAgaWYgKGEubGVuZ3RoICE9PSBiLmxlbmd0aCkgcmV0dXJuIGZhbHNlXG4gICAgICAgIGlmIChhLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHRydWVcbiAgICB9IGVsc2UgaWYgKHN1cHBvcnRzTWFwICYmIGEgaW5zdGFuY2VvZiBNYXApIHtcbiAgICAgICAgaWYgKGEuc2l6ZSAhPT0gYi5zaXplKSByZXR1cm4gZmFsc2VcbiAgICAgICAgaWYgKGEuc2l6ZSA9PT0gMCkgcmV0dXJuIHRydWVcbiAgICB9IGVsc2UgaWYgKHN1cHBvcnRzU2V0ICYmIGEgaW5zdGFuY2VvZiBTZXQpIHtcbiAgICAgICAgaWYgKGEuc2l6ZSAhPT0gYi5zaXplKSByZXR1cm4gZmFsc2VcbiAgICAgICAgaWYgKGEuc2l6ZSA9PT0gMCkgcmV0dXJuIHRydWVcbiAgICB9IGVsc2UgaWYgKG9iamVjdFRvU3RyaW5nLmNhbGwoYSkgPT09IFwiW29iamVjdCBBcmd1bWVudHNdXCIpIHtcbiAgICAgICAgaWYgKG9iamVjdFRvU3RyaW5nLmNhbGwoYikgIT09IFwiW29iamVjdCBBcmd1bWVudHNdXCIpIHJldHVybiBmYWxzZVxuICAgICAgICBpZiAoYS5sZW5ndGggIT09IGIubGVuZ3RoKSByZXR1cm4gZmFsc2VcbiAgICAgICAgaWYgKGEubGVuZ3RoID09PSAwKSByZXR1cm4gdHJ1ZVxuICAgIH0gZWxzZSBpZiAob2JqZWN0VG9TdHJpbmcuY2FsbChiKSA9PT0gXCJbb2JqZWN0IEFyZ3VtZW50c11cIikge1xuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgICByZXR1cm4gbWF0Y2hQcmVwYXJlRGVzY2VuZChhLCBiLCBjb250ZXh0LCBsZWZ0LCByaWdodClcbn1cblxuLy8gTW9zdCBzcGVjaWFsIGNhc2VzIHJlcXVpcmUgYm90aCB0eXBlcyB0byBtYXRjaCwgYW5kIGlmIG9ubHkgb25lIG9mIHRoZW0gYXJlLFxuLy8gdGhlIG9iamVjdHMgdGhlbXNlbHZlcyBkb24ndCBtYXRjaC5cbmZ1bmN0aW9uIG1hdGNoRGlmZmVyZW50UHJvdG8oYSwgYiwgY29udGV4dCwgbGVmdCwgcmlnaHQpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtcGFyYW1zLCBtYXgtbGVuXG4gICAgaWYgKHN5bWJvbHNBcmVPYmplY3RzKSB7XG4gICAgICAgIGlmIChhIGluc3RhbmNlb2YgU3ltYm9sIHx8IGIgaW5zdGFuY2VvZiBTeW1ib2wpIHJldHVybiBmYWxzZVxuICAgIH1cbiAgICBpZiAoY29udGV4dCAmIFN0cmljdCkgcmV0dXJuIGZhbHNlXG4gICAgaWYgKGFycmF5QnVmZmVyU3VwcG9ydCAhPT0gQXJyYXlCdWZmZXJOb25lKSB7XG4gICAgICAgIGlmIChhIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIgfHwgYiBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSByZXR1cm4gZmFsc2VcbiAgICAgICAgaWYgKGlzVmlldyhhKSB8fCBpc1ZpZXcoYikpIHJldHVybiBmYWxzZVxuICAgIH1cbiAgICBpZiAoQXJyYXkuaXNBcnJheShhKSB8fCBBcnJheS5pc0FycmF5KGIpKSByZXR1cm4gZmFsc2VcbiAgICBpZiAoc3VwcG9ydHNNYXAgJiYgKGEgaW5zdGFuY2VvZiBNYXAgfHwgYiBpbnN0YW5jZW9mIE1hcCkpIHJldHVybiBmYWxzZVxuICAgIGlmIChzdXBwb3J0c1NldCAmJiAoYSBpbnN0YW5jZW9mIFNldCB8fCBiIGluc3RhbmNlb2YgU2V0KSkgcmV0dXJuIGZhbHNlXG4gICAgaWYgKG9iamVjdFRvU3RyaW5nLmNhbGwoYSkgPT09IFwiW29iamVjdCBBcmd1bWVudHNdXCIpIHtcbiAgICAgICAgaWYgKG9iamVjdFRvU3RyaW5nLmNhbGwoYikgIT09IFwiW29iamVjdCBBcmd1bWVudHNdXCIpIHJldHVybiBmYWxzZVxuICAgICAgICBpZiAoYS5sZW5ndGggIT09IGIubGVuZ3RoKSByZXR1cm4gZmFsc2VcbiAgICAgICAgaWYgKGEubGVuZ3RoID09PSAwKSByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgICBpZiAob2JqZWN0VG9TdHJpbmcuY2FsbChiKSA9PT0gXCJbb2JqZWN0IEFyZ3VtZW50c11cIikgcmV0dXJuIGZhbHNlXG4gICAgcmV0dXJuIG1hdGNoUHJlcGFyZURlc2NlbmQoYSwgYiwgY29udGV4dCwgbGVmdCwgcmlnaHQpXG59XG5cbmZ1bmN0aW9uIG1hdGNoKGEsIGIsIGNvbnRleHQsIGxlZnQsIHJpZ2h0KSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LXBhcmFtc1xuICAgIGlmIChhID09PSBiKSByZXR1cm4gdHJ1ZVxuICAgIC8vIE5hTnMgYXJlIGVxdWFsXG4gICAgaWYgKGEgIT09IGEpIHJldHVybiBiICE9PSBiIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tc2VsZi1jb21wYXJlXG4gICAgaWYgKGEgPT09IG51bGwgfHwgYiA9PT0gbnVsbCkgcmV0dXJuIGZhbHNlXG4gICAgaWYgKHR5cGVvZiBhID09PSBcInN5bWJvbFwiICYmIHR5cGVvZiBiID09PSBcInN5bWJvbFwiKSB7XG4gICAgICAgIHJldHVybiAhKGNvbnRleHQgJiBTdHJpY3QpICYmIGEudG9TdHJpbmcoKSA9PT0gYi50b1N0cmluZygpXG4gICAgfVxuICAgIGlmICh0eXBlb2YgYSAhPT0gXCJvYmplY3RcIiB8fCB0eXBlb2YgYiAhPT0gXCJvYmplY3RcIikgcmV0dXJuIGZhbHNlXG5cbiAgICAvLyBVc3VhbGx5LCBib3RoIG9iamVjdHMgaGF2ZSBpZGVudGljYWwgcHJvdG90eXBlcywgYW5kIHRoYXQgYWxsb3dzIGZvciBoYWxmXG4gICAgLy8gdGhlIHR5cGUgY2hlY2tpbmcuXG4gICAgaWYgKE9iamVjdC5nZXRQcm90b3R5cGVPZihhKSA9PT0gT2JqZWN0LmdldFByb3RvdHlwZU9mKGIpKSB7XG4gICAgICAgIHJldHVybiBtYXRjaFNhbWVQcm90byhhLCBiLCBjb250ZXh0IHwgU2FtZVByb3RvLCBsZWZ0LCByaWdodClcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbWF0Y2hEaWZmZXJlbnRQcm90byhhLCBiLCBjb250ZXh0LCBsZWZ0LCByaWdodClcbiAgICB9XG59XG5cbmZ1bmN0aW9uIG1hdGNoQXJyYXlMaWtlKGEsIGIsIGNvbnRleHQsIGxlZnQsIHJpZ2h0KSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LXBhcmFtcywgbWF4LWxlblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYS5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoIW1hdGNoKGFbaV0sIGJbaV0sIGNvbnRleHQsIGxlZnQsIHJpZ2h0KSkgcmV0dXJuIGZhbHNlXG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWVcbn1cblxuLy8gUGhhbnRvbUpTIGFuZCBTbGltZXJKUyBib3RoIGhhdmUgbXlzdGVyaW91cyBpc3N1ZXMgd2hlcmUgYEVycm9yYCBpcyBzb21ldGltZXNcbi8vIGVycm9uZW91c2x5IG9mIGEgZGlmZmVyZW50IGB3aW5kb3dgLCBhbmQgaXQgc2hvd3MgdXAgaW4gdGhlIHRlc3RzLiBUaGlzIG1lYW5zXG4vLyBJIGhhdmUgdG8gdXNlIGEgbXVjaCBzbG93ZXIgYWxnb3JpdGhtIHRvIGRldGVjdCBFcnJvcnMuXG4vL1xuLy8gUGhhbnRvbUpTOiBodHRwczovL2dpdGh1Yi5jb20vcGV0a2FhbnRvbm92L2JsdWViaXJkL2lzc3Vlcy8xMTQ2XG4vLyBTbGltZXJKUzogaHR0cHM6Ly9naXRodWIuY29tL2xhdXJlbnRqL3NsaW1lcmpzL2lzc3Vlcy80MDBcbi8vXG4vLyAoWWVzLCB0aGUgUGhhbnRvbUpTIGJ1ZyBpcyBkZXRhaWxlZCBpbiB0aGUgQmx1ZWJpcmQgaXNzdWUgdHJhY2tlci4pXG52YXIgY2hlY2tDcm9zc09yaWdpbiA9IChmdW5jdGlvbiAoKSB7XG4gICAgaWYgKGdsb2JhbC53aW5kb3cgPT0gbnVsbCB8fCBnbG9iYWwud2luZG93Lm5hdmlnYXRvciA9PSBudWxsKSByZXR1cm4gZmFsc2VcbiAgICByZXR1cm4gL3NsaW1lcmpzfHBoYW50b21qcy9pLnRlc3QoZ2xvYmFsLndpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50KVxufSkoKVxuXG52YXIgZXJyb3JTdHJpbmdUeXBlcyA9IHtcbiAgICBcIltvYmplY3QgRXJyb3JdXCI6IHRydWUsXG4gICAgXCJbb2JqZWN0IEV2YWxFcnJvcl1cIjogdHJ1ZSxcbiAgICBcIltvYmplY3QgUmFuZ2VFcnJvcl1cIjogdHJ1ZSxcbiAgICBcIltvYmplY3QgUmVmZXJlbmNlRXJyb3JdXCI6IHRydWUsXG4gICAgXCJbb2JqZWN0IFN5bnRheEVycm9yXVwiOiB0cnVlLFxuICAgIFwiW29iamVjdCBUeXBlRXJyb3JdXCI6IHRydWUsXG4gICAgXCJbb2JqZWN0IFVSSUVycm9yXVwiOiB0cnVlLFxufVxuXG5mdW5jdGlvbiBpc1Byb3hpZWRFcnJvcihvYmplY3QpIHtcbiAgICB3aGlsZSAob2JqZWN0ICE9IG51bGwpIHtcbiAgICAgICAgaWYgKGVycm9yU3RyaW5nVHlwZXNbb2JqZWN0VG9TdHJpbmcuY2FsbChvYmplY3QpXSkgcmV0dXJuIHRydWVcbiAgICAgICAgb2JqZWN0ID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKG9iamVjdClcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2Vcbn1cblxuZnVuY3Rpb24gbWF0Y2hJbm5lcihhLCBiLCBjb250ZXh0LCBsZWZ0LCByaWdodCkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1zdGF0ZW1lbnRzLCBtYXgtcGFyYW1zLCBtYXgtbGVuXG4gICAgdmFyIGFrZXlzLCBia2V5c1xuICAgIHZhciBpc1VucHJveGllZEVycm9yID0gZmFsc2VcblxuICAgIGlmIChjb250ZXh0ICYgU2FtZVByb3RvKSB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGEpKSByZXR1cm4gbWF0Y2hBcnJheUxpa2UoYSwgYiwgY29udGV4dCwgbGVmdCwgcmlnaHQpXG5cbiAgICAgICAgaWYgKHN1cHBvcnRzTWFwICYmIGEgaW5zdGFuY2VvZiBNYXApIHtcbiAgICAgICAgICAgIHJldHVybiBtYXRjaE1hcChhLCBiLCBjb250ZXh0LCBsZWZ0LCByaWdodClcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzdXBwb3J0c1NldCAmJiBhIGluc3RhbmNlb2YgU2V0KSB7XG4gICAgICAgICAgICByZXR1cm4gbWF0Y2hTZXQoYSwgYiwgY29udGV4dCwgbGVmdCwgcmlnaHQpXG4gICAgICAgIH1cblxuICAgICAgICBpZiAob2JqZWN0VG9TdHJpbmcuY2FsbChhKSA9PT0gXCJbb2JqZWN0IEFyZ3VtZW50c11cIikge1xuICAgICAgICAgICAgcmV0dXJuIG1hdGNoQXJyYXlMaWtlKGEsIGIsIGNvbnRleHQsIGxlZnQsIHJpZ2h0KVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHJlcXVpcmVzUHJveHkgJiZcbiAgICAgICAgICAgICAgICAoY2hlY2tDcm9zc09yaWdpbiA/IGlzUHJveGllZEVycm9yKGEpIDogYSBpbnN0YW5jZW9mIEVycm9yKSkge1xuICAgICAgICAgICAgYWtleXMgPSBnZXRLZXlzU3RyaXBwZWQoYSlcbiAgICAgICAgICAgIGJrZXlzID0gZ2V0S2V5c1N0cmlwcGVkKGIpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBha2V5cyA9IE9iamVjdC5rZXlzKGEpXG4gICAgICAgICAgICBia2V5cyA9IE9iamVjdC5rZXlzKGIpXG4gICAgICAgICAgICBpc1VucHJveGllZEVycm9yID0gYSBpbnN0YW5jZW9mIEVycm9yXG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBpZiAob2JqZWN0VG9TdHJpbmcuY2FsbChhKSA9PT0gXCJbb2JqZWN0IEFyZ3VtZW50c11cIikge1xuICAgICAgICAgICAgcmV0dXJuIG1hdGNoQXJyYXlMaWtlKGEsIGIsIGNvbnRleHQsIGxlZnQsIHJpZ2h0KVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgd2UgcmVxdWlyZSBhIHByb3h5LCBiZSBwZXJtaXNzaXZlIGFuZCBjaGVjayB0aGUgYHRvU3RyaW5nYCB0eXBlLlxuICAgICAgICAvLyBUaGlzIGlzIHNvIGl0IHdvcmtzIGNyb3NzLW9yaWdpbiBpbiBQaGFudG9tSlMgaW4gcGFydGljdWxhci5cbiAgICAgICAgaWYgKGEgaW5zdGFuY2VvZiBFcnJvcikgcmV0dXJuIGZhbHNlXG4gICAgICAgIGFrZXlzID0gT2JqZWN0LmtleXMoYSlcbiAgICAgICAgYmtleXMgPSBPYmplY3Qua2V5cyhiKVxuICAgIH1cblxuICAgIHZhciBjb3VudCA9IGFrZXlzLmxlbmd0aFxuXG4gICAgaWYgKGNvdW50ICE9PSBia2V5cy5sZW5ndGgpIHJldHVybiBmYWxzZVxuXG4gICAgLy8gU2hvcnRjdXQgaWYgdGhlcmUncyBub3RoaW5nIHRvIG1hdGNoXG4gICAgaWYgKGNvdW50ID09PSAwKSByZXR1cm4gdHJ1ZVxuXG4gICAgdmFyIGlcblxuICAgIGlmIChpc1VucHJveGllZEVycm9yKSB7XG4gICAgICAgIC8vIFNob3J0Y3V0IGlmIHRoZSBwcm9wZXJ0aWVzIGFyZSBkaWZmZXJlbnQuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoYWtleXNbaV0gIT09IFwic3RhY2tcIikge1xuICAgICAgICAgICAgICAgIGlmICghaGFzT3duLmNhbGwoYiwgYWtleXNbaV0pKSByZXR1cm4gZmFsc2VcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFZlcmlmeSB0aGF0IGFsbCB0aGUgYWtleXMnIHZhbHVlcyBtYXRjaGVkLlxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xuICAgICAgICAgICAgaWYgKGFrZXlzW2ldICE9PSBcInN0YWNrXCIpIHtcbiAgICAgICAgICAgICAgICBpZiAoIW1hdGNoKGFbYWtleXNbaV1dLCBiW2FrZXlzW2ldXSwgY29udGV4dCwgbGVmdCwgcmlnaHQpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFNob3J0Y3V0IGlmIHRoZSBwcm9wZXJ0aWVzIGFyZSBkaWZmZXJlbnQuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoIWhhc093bi5jYWxsKGIsIGFrZXlzW2ldKSkgcmV0dXJuIGZhbHNlXG4gICAgICAgIH1cblxuICAgICAgICAvLyBWZXJpZnkgdGhhdCBhbGwgdGhlIGFrZXlzJyB2YWx1ZXMgbWF0Y2hlZC5cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcbiAgICAgICAgICAgIGlmICghbWF0Y2goYVtha2V5c1tpXV0sIGJbYWtleXNbaV1dLCBjb250ZXh0LCBsZWZ0LCByaWdodCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0cnVlXG59XG4iLCJcInVzZSBzdHJpY3RcIlxuXG4vLyBUbyBzdXBwcmVzcyBkZXByZWNhdGlvbiBtZXNzYWdlc1xudmFyIHN1cHByZXNzRGVwcmVjYXRpb24gPSB0cnVlXG5cbmV4cG9ydHMuc2hvd0RlcHJlY2F0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgIHN1cHByZXNzRGVwcmVjYXRpb24gPSBmYWxzZVxufVxuXG5leHBvcnRzLmhpZGVEZXByZWNhdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICBzdXBwcmVzc0RlcHJlY2F0aW9uID0gdHJ1ZVxufVxuXG52YXIgY29uc29sZSA9IGdsb2JhbC5jb25zb2xlXG52YXIgc2hvdWxkUHJpbnQgPSBjb25zb2xlICE9IG51bGwgJiYgdHlwZW9mIGNvbnNvbGUud2FybiA9PT0gXCJmdW5jdGlvblwiICYmXG4gICAgIShnbG9iYWwucHJvY2VzcyAhPSBudWxsICYmIGdsb2JhbC5wcm9jZXNzLmVudiAhPSBudWxsICYmXG4gICAgICAgIGdsb2JhbC5wcm9jZXNzLmVudi5OT19NSUdSQVRFX1dBUk4pXG5cbmV4cG9ydHMud2FybiA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoc2hvdWxkUHJpbnQgJiYgIXN1cHByZXNzRGVwcmVjYXRpb24pIHtcbiAgICAgICAgY29uc29sZS53YXJuLmFwcGx5KGNvbnNvbGUsIGFyZ3VtZW50cylcbiAgICB9XG59XG5cbmV4cG9ydHMuZGVwcmVjYXRlID0gZnVuY3Rpb24gKG1lc3NhZ2UsIGZ1bmMpIHtcbiAgICB2YXIgcHJpbnRlZCA9ICFzaG91bGRQcmludFxuXG4gICAgLyoqIEB0aGlzICovXG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCFzdXBwcmVzc0RlcHJlY2F0aW9uKSB7XG4gICAgICAgICAgICBpZiAoIXByaW50ZWQpIHtcbiAgICAgICAgICAgICAgICBwcmludGVkID0gdHJ1ZVxuICAgICAgICAgICAgICAgIGNvbnNvbGUudHJhY2UoKVxuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihtZXNzYWdlKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBtZXNzYWdlID0gdW5kZWZpbmVkXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZnVuYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gICAgfVxufVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxuLyoqXG4gKiBCYWNrcG9ydCB3cmFwcGVyIHRvIHdhcm4gYWJvdXQgbW9zdCBvZiB0aGUgbWFqb3IgYnJlYWtpbmcgY2hhbmdlcyBmcm9tIHRoZVxuICogbGFzdCBtYWpvciB2ZXJzaW9uLCBhbmQgdG8gaGVscCBtZSBrZWVwIHRyYWNrIG9mIGFsbCB0aGUgY2hhbmdlcy5cbiAqXG4gKiBJdCBjb25zaXN0cyBvZiBzb2xlbHkgaW50ZXJuYWwgbW9ua2V5IHBhdGNoaW5nIHRvIHJldml2ZSBzdXBwb3J0IG9mIHByZXZpb3VzXG4gKiB2ZXJzaW9ucywgYWx0aG91Z2ggSSB0cmllZCB0byBsaW1pdCBob3cgbXVjaCBrbm93bGVkZ2Ugb2YgdGhlIGludGVybmFscyB0aGlzXG4gKiByZXF1aXJlcy5cbiAqL1xuXG52YXIgQ29tbW9uID0gcmVxdWlyZShcIi4vY29tbW9uXCIpXG52YXIgSW50ZXJuYWwgPSByZXF1aXJlKFwiLi4vaW50ZXJuYWxcIilcbnZhciBtZXRob2RzID0gcmVxdWlyZShcIi4uL2xpYi9tZXRob2RzXCIpXG52YXIgUmVwb3J0ID0gcmVxdWlyZShcIi4uL2xpYi9jb3JlL3JlcG9ydHNcIikuUmVwb3J0XG52YXIgUmVmbGVjdCA9IHJlcXVpcmUoXCIuLi9saWIvYXBpL3JlZmxlY3RcIilcbnZhciBUaGFsbGl1bSA9IHJlcXVpcmUoXCIuLi9saWIvYXBpL3RoYWxsaXVtXCIpXG5cbnZhciBhc3NlcnQgPSByZXF1aXJlKFwiLi4vYXNzZXJ0XCIpXG52YXIgQXNzZXJ0aW9uRXJyb3IgPSBhc3NlcnQuQXNzZXJ0aW9uRXJyb3JcbnZhciBmb3JtYXQgPSBhc3NlcnQuZm9ybWF0XG5cbi8qICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKlxuICogLSBgcmVmbGVjdC5jaGVja0luaXQoKWAgaXMgZGVwcmVjYXRlZCBpbiBmYXZvciBvZiBgcmVmbGVjdC5sb2NrZWRgIGFuZCAgICAqXG4gKiAgIGVpdGhlciBjb21wbGFpbmluZyB5b3Vyc2VsZiBvciBqdXN0IHVzaW5nIGByZWZsZWN0LmN1cnJlbnRgIHRvIGFkZCAgICAgICpcbiAqICAgdGhpbmdzLiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqL1xubWV0aG9kcyhSZWZsZWN0LCB7XG4gICAgY2hlY2tJbml0OiBDb21tb24uZGVwcmVjYXRlKFxuICAgICAgICBcImByZWZsZWN0LmNoZWNrSW5pdGAgaXMgZGVwcmVjYXRlZC4gVXNlIGByZWZsZWN0LmN1cnJlbnRgIGZvciB0aGUgXCIgK1xuICAgICAgICBcImN1cnJlbnQgdGVzdCBvciB1c2UgYHJlZmxlY3QubG9ja2VkYCBhbmQgY3JlYXRlIGFuZCB0aHJvdyB0aGUgZXJyb3IgXCIgK1xuICAgICAgICBcInlvdXJzZWxmLlwiLFxuICAgICAgICAvKiogQHRoaXMgKi8gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKHRoaXMubG9ja2VkKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFJlZmVyZW5jZUVycm9yKFwiSXQgaXMgb25seSBzYWZlIHRvIGNhbGwgdGVzdCBcIiArXG4gICAgICAgICAgICAgICAgICAgIFwibWV0aG9kcyBkdXJpbmcgaW5pdGlhbGl6YXRpb25cIilcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSksXG59KVxuXG4vKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICpcbiAqIC0gYHQuYXN5bmNgIC0+IGB0LnRlc3RgLCB3aGljaCBub3cgc3VwcG9ydHMgcHJvbWlzZXMuICAgICAgICAgICAgICAgICAgICAgKlxuICogLSBBbGwgdGVzdHMgYXJlIG5vdyBhc3luYy4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICovXG5cbnZhciB0ZXN0ID0gVGhhbGxpdW0ucHJvdG90eXBlLnRlc3RcblxuZnVuY3Rpb24gcnVuQXN5bmMoY2FsbGJhY2ssIHQsIHJlc29sdmUsIHJlamVjdCkge1xuICAgIHZhciByZXNvbHZlZCA9IGZhbHNlXG4gICAgdmFyIGdlbiA9IGNhbGxiYWNrLmNhbGwodCwgdCwgZnVuY3Rpb24gKGVycikge1xuICAgICAgICBpZiAocmVzb2x2ZWQpIHJldHVyblxuICAgICAgICBDb21tb24ud2FybihcImB0LmFzeW5jYCBpcyBkZXByZWNhdGVkLiBcIiArXG4gICAgICAgICAgICBcIlVzZSBgdC50ZXN0YCBhbmQgcmV0dXJuIGEgcHJvbWlzZSBpbnN0ZWFkLlwiKVxuXG4gICAgICAgIHJlc29sdmVkID0gdHJ1ZVxuICAgICAgICBpZiAoZXJyICE9IG51bGwpIHJlamVjdChlcnIpXG4gICAgICAgIGVsc2UgcmVzb2x2ZSgpXG4gICAgfSlcblxuICAgIGlmIChyZXNvbHZlZCkgcmV0dXJuXG5cbiAgICBpZiAodHlwZW9mIGdlbi5uZXh0ICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgLy8gQWxsb3cgdGhlIG1pZ3JhdGlvbiBwYXRoIHRvIHN0YW5kYXJkIHRoZW5hYmxlcy5cbiAgICAgICAgcmVzb2x2ZShnZW4pXG4gICAgICAgIHJldHVyblxuICAgIH1cblxuICAgIENvbW1vbi53YXJuKFwiYHQuYXN5bmNgIGlzIGRlcHJlY2F0ZWQuIFVzZSBgdC50ZXN0YCBhbmQgZWl0aGVyIHJldHVybiBhIFwiICtcbiAgICAgICAgXCJwcm9taXNlIG9yIHVzZSBgY29gL0VTMjAxNyBhc3luYyBmdW5jdGlvbnMgaW5zdGVhZC5cIilcblxuICAgIC8vIFRoaXMgaXMgYSBtb2RpZmllZCB2ZXJzaW9uIG9mIHRoZSBhc3luYy1hd2FpdCBvZmZpY2lhbCwgbm9uLW5vcm1hdGl2ZVxuICAgIC8vIGRlc3VnYXJpbmcgaGVscGVyLCBmb3IgYmV0dGVyIGVycm9yIGNoZWNraW5nIGFuZCBhZGFwdGVkIHRvIGFjY2VwdCBhblxuICAgIC8vIGFscmVhZHktaW5zdGFudGlhdGVkIGl0ZXJhdG9yIGluc3RlYWQgb2YgYSBnZW5lcmF0b3IuXG4gICAgZnVuY3Rpb24gaXRlcmF0ZShuZXh0KSB7XG4gICAgICAgIC8vIGZpbmlzaGVkIHdpdGggc3VjY2VzcywgcmVzb2x2ZSB0aGUgcHJvbWlzZVxuICAgICAgICBpZiAobmV4dC5kb25lKSByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG5leHQudmFsdWUpXG5cbiAgICAgICAgLy8gbm90IGZpbmlzaGVkLCBjaGFpbiBvZmYgdGhlIHlpZWxkZWQgcHJvbWlzZSBhbmQgc3RlcCBhZ2FpblxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG5leHQudmFsdWUpLnRoZW4oXG4gICAgICAgICAgICBmdW5jdGlvbiAodikgeyByZXR1cm4gaXRlcmF0ZShnZW4ubmV4dCh2KSkgfSxcbiAgICAgICAgICAgIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBnZW4udGhyb3cgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXRlcmF0ZShnZW4udGhyb3coZSkpXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgfVxuXG4gICAgaXRlcmF0ZShnZW4ubmV4dCh1bmRlZmluZWQpKS50aGVuKHJlc29sdmUsIHJlamVjdClcbn1cblxubWV0aG9kcyhUaGFsbGl1bSwge1xuICAgIGFzeW5jOiBmdW5jdGlvbiAobmFtZSwgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAvLyBSZXVzZSB0aGUgbm9ybWFsIGVycm9yIGhhbmRsaW5nLlxuICAgICAgICAgICAgcmV0dXJuIHRlc3QuYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRlc3QuY2FsbCh0aGlzLCBuYW1lLCBmdW5jdGlvbiAodCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBydW5Bc3luYyhjYWxsYmFjaywgdCwgcmVzb2x2ZSwgcmVqZWN0KVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIGFzeW5jU2tpcDogQ29tbW9uLmRlcHJlY2F0ZShcbiAgICAgICAgXCJgdC5hc3luY1NraXBgIGlzIGRlcHJlY2F0ZWQuIFVzZSBgdC50ZXN0U2tpcGAgaW5zdGVhZC5cIixcbiAgICAgICAgVGhhbGxpdW0ucHJvdG90eXBlLnRlc3RTa2lwKSxcbn0pXG5cbm1ldGhvZHMoUmVmbGVjdCwge1xuICAgIGdldCBpc0FzeW5jKCkge1xuICAgICAgICBDb21tb24ud2FybihcIlRlc3RzIGFyZSBub3cgYWx3YXlzIGFzeW5jLiBZb3Ugbm8gbG9uZ2VyIG5lZWQgdG8gXCIgK1xuICAgICAgICAgICAgXCJoYW5kbGUgdGhlIG90aGVyIGNhc2VcIilcbiAgICAgICAgcmV0dXJuIHRydWVcbiAgICB9LFxufSlcblxuLyogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqXG4gKiBgcmVmbGVjdC5kZWZpbmVgLCBgdC5kZWZpbmVgLCBgcmVmbGVjdC53cmFwYCwgYW5kIGByZWZsZWN0LmFkZGAsIGFyZSBhbGwgICpcbiAqIHJlbW92ZWQuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqL1xuXG5mdW5jdGlvbiBpc0xvY2tlZChtZXRob2QpIHtcbiAgICByZXR1cm4gbWV0aG9kID09PSBcIl9cIiB8fFxuICAgICAgICBtZXRob2QgPT09IFwicmVmbGVjdFwiIHx8XG4gICAgICAgIG1ldGhvZCA9PT0gXCJvbmx5XCIgfHxcbiAgICAgICAgbWV0aG9kID09PSBcInVzZVwiIHx8XG4gICAgICAgIG1ldGhvZCA9PT0gXCJyZXBvcnRlclwiIHx8XG4gICAgICAgIG1ldGhvZCA9PT0gXCJkZWZpbmVcIiB8fFxuICAgICAgICBtZXRob2QgPT09IFwidGltZW91dFwiIHx8XG4gICAgICAgIG1ldGhvZCA9PT0gXCJzbG93XCIgfHxcbiAgICAgICAgbWV0aG9kID09PSBcInJ1blwiIHx8XG4gICAgICAgIG1ldGhvZCA9PT0gXCJ0ZXN0XCIgfHxcbiAgICAgICAgbWV0aG9kID09PSBcInRlc3RTa2lwXCIgfHxcbiAgICAgICAgbWV0aG9kID09PSBcImFzeW5jXCIgfHxcbiAgICAgICAgbWV0aG9kID09PSBcImFzeW5jU2tpcFwiXG59XG5cbmZ1bmN0aW9uIGdldEVudW1lcmFibGVTeW1ib2xzKGtleXMsIG9iamVjdCkge1xuICAgIHZhciBzeW1ib2xzID0gT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhvYmplY3QpXG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN5bWJvbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHN5bSA9IHN5bWJvbHNbaV1cblxuICAgICAgICBpZiAoT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihzeW0pLmVudW1lcmFibGUpIGtleXMucHVzaChzeW0pXG4gICAgfVxufVxuXG4vLyBUaGlzIGhhbmRsZXMgbmFtZSArIGZ1bmMgdnMgb2JqZWN0IHdpdGggbWV0aG9kcy5cbmZ1bmN0aW9uIGl0ZXJhdGVTZXR0ZXIodGVzdCwgbmFtZSwgZnVuYywgaXRlcmF0b3IpIHtcbiAgICAvLyBDaGVjayBib3RoIHRoZSBuYW1lIGFuZCBmdW5jdGlvbiwgc28gRVM2IHN5bWJvbCBwb2x5ZmlsbHMgKHdoaWNoIHVzZVxuICAgIC8vIG9iamVjdHMgc2luY2UgaXQncyBpbXBvc3NpYmxlIHRvIGZ1bGx5IHBvbHlmaWxsIHByaW1pdGl2ZXMpIHdvcmsuXG4gICAgaWYgKHR5cGVvZiBuYW1lID09PSBcIm9iamVjdFwiICYmIG5hbWUgIT0gbnVsbCAmJiBmdW5jID09IG51bGwpIHtcbiAgICAgICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhuYW1lKVxuXG4gICAgICAgIGlmICh0eXBlb2YgT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICBnZXRFbnVtZXJhYmxlU3ltYm9scyhrZXlzLCBuYW1lKVxuICAgICAgICB9XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIga2V5ID0ga2V5c1tpXVxuXG4gICAgICAgICAgICBpZiAodHlwZW9mIG5hbWVba2V5XSAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGJvZHkgdG8gYmUgYSBmdW5jdGlvblwiKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0ZXN0Lm1ldGhvZHNba2V5XSA9IGl0ZXJhdG9yKHRlc3QsIGtleSwgbmFtZVtrZXldKVxuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHR5cGVvZiBmdW5jICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBib2R5IHRvIGJlIGEgZnVuY3Rpb25cIilcbiAgICAgICAgfVxuXG4gICAgICAgIHRlc3QubWV0aG9kc1tuYW1lXSA9IGl0ZXJhdG9yKHRlc3QsIG5hbWUsIGZ1bmMpXG4gICAgfVxufVxuXG4vKipcbiAqIEB0aGlzIHtTdGF0ZX1cbiAqIFJ1biBgZnVuY2Agd2l0aCBgLi4uYXJnc2Agd2hlbiBhc3NlcnRpb25zIGFyZSBydW4sIG9ubHkgaWYgdGhlIHRlc3QgaXNuJ3RcbiAqIHNraXBwZWQuIFRoaXMgaXMgaW1tZWRpYXRlbHkgZm9yIGJsb2NrIGFuZCBhc3luYyB0ZXN0cywgYnV0IGRlZmVycmVkIGZvclxuICogaW5saW5lIHRlc3RzLiBJdCdzIHVzZWZ1bCBmb3IgaW5saW5lIGFzc2VydGlvbnMuXG4gKi9cbmZ1bmN0aW9uIGF0dGVtcHQoZnVuYywgYSwgYiwgYy8qICwgLi4uYXJncyAqLykge1xuICAgIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgIGNhc2UgMDogdGhyb3cgbmV3IFR5cGVFcnJvcihcInVucmVhY2hhYmxlXCIpXG4gICAgY2FzZSAxOiBmdW5jKCk7IHJldHVyblxuICAgIGNhc2UgMjogZnVuYyhhKTsgcmV0dXJuXG4gICAgY2FzZSAzOiBmdW5jKGEsIGIpOyByZXR1cm5cbiAgICBjYXNlIDQ6IGZ1bmMoYSwgYiwgYyk7IHJldHVyblxuICAgIGRlZmF1bHQ6XG4gICAgICAgIHZhciBhcmdzID0gW11cblxuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJncy5wdXNoKGFyZ3VtZW50c1tpXSlcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmMuYXBwbHkodW5kZWZpbmVkLCBhcmdzKVxuICAgIH1cbn1cblxuZnVuY3Rpb24gZGVmaW5lQXNzZXJ0aW9uKHRlc3QsIG5hbWUsIGZ1bmMpIHtcbiAgICAvLyBEb24ndCBsZXQgbmF0aXZlIG1ldGhvZHMgZ2V0IG92ZXJyaWRkZW4gYnkgYXNzZXJ0aW9uc1xuICAgIGlmIChpc0xvY2tlZChuYW1lKSkge1xuICAgICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcihcIk1ldGhvZCAnXCIgKyBuYW1lICsgXCInIGlzIGxvY2tlZCFcIilcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBydW4oKSB7XG4gICAgICAgIHZhciByZXMgPSBmdW5jLmFwcGx5KHVuZGVmaW5lZCwgYXJndW1lbnRzKVxuXG4gICAgICAgIGlmICh0eXBlb2YgcmVzICE9PSBcIm9iamVjdFwiIHx8IHJlcyA9PT0gbnVsbCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIHJlc3VsdCB0byBiZSBhbiBvYmplY3RcIilcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghcmVzLnRlc3QpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihcbiAgICAgICAgICAgICAgICBmb3JtYXQocmVzLm1lc3NhZ2UsIHJlcyksXG4gICAgICAgICAgICAgICAgcmVzLmV4cGVjdGVkLCByZXMuYWN0dWFsKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIC8qKiBAdGhpcyAqLyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBhcmdzID0gW3J1bl1cblxuICAgICAgICBhcmdzLnB1c2guYXBwbHkoYXJncywgYXJndW1lbnRzKVxuICAgICAgICBhdHRlbXB0LmFwcGx5KHVuZGVmaW5lZCwgYXJncylcbiAgICAgICAgcmV0dXJuIHRoaXNcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHdyYXBBc3NlcnRpb24odGVzdCwgbmFtZSwgZnVuYykge1xuICAgIC8vIERvbid0IGxldCBgcmVmbGVjdGAgYW5kIGBfYCBjaGFuZ2UuXG4gICAgaWYgKG5hbWUgPT09IFwicmVmbGVjdFwiIHx8IG5hbWUgPT09IFwiX1wiKSB7XG4gICAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKFwiTWV0aG9kICdcIiArIG5hbWUgKyBcIicgaXMgbG9ja2VkIVwiKVxuICAgIH1cblxuICAgIHZhciBvbGQgPSB0ZXN0Lm1ldGhvZHNbbmFtZV1cblxuICAgIGlmICh0eXBlb2Ygb2xkICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICAgICAgIFwiRXhwZWN0ZWQgdC5cIiArIG5hbWUgKyBcIiB0byBhbHJlYWR5IGJlIGEgZnVuY3Rpb25cIilcbiAgICB9XG5cbiAgICAvKiogQHRoaXMgKi9cbiAgICBmdW5jdGlvbiBhcHBseShhLCBiLCBjLCBkKSB7XG4gICAgICAgIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICBjYXNlIDA6IHJldHVybiBmdW5jLmNhbGwodGhpcywgb2xkLmJpbmQodGhpcykpXG4gICAgICAgIGNhc2UgMTogcmV0dXJuIGZ1bmMuY2FsbCh0aGlzLCBvbGQuYmluZCh0aGlzKSwgYSlcbiAgICAgICAgY2FzZSAyOiByZXR1cm4gZnVuYy5jYWxsKHRoaXMsIG9sZC5iaW5kKHRoaXMpLCBhLCBiKVxuICAgICAgICBjYXNlIDM6IHJldHVybiBmdW5jLmNhbGwodGhpcywgb2xkLmJpbmQodGhpcyksIGEsIGIsIGMpXG4gICAgICAgIGNhc2UgNDogcmV0dXJuIGZ1bmMuY2FsbCh0aGlzLCBvbGQuYmluZCh0aGlzKSwgYSwgYiwgYywgZClcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHZhciBhcmdzID0gW29sZC5iaW5kKHRoaXMpXVxuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGFyZ3MucHVzaChhcmd1bWVudHNbaV0pXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBmdW5jLmFwcGx5KHRoaXMsIGFyZ3MpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gLyoqIEB0aGlzICovIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHJldCA9IGFwcGx5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcblxuICAgICAgICByZXR1cm4gcmV0ICE9PSB1bmRlZmluZWQgPyByZXQgOiB0aGlzXG4gICAgfVxufVxuXG5mdW5jdGlvbiBhZGRBc3NlcnRpb24odGVzdCwgbmFtZSwgZnVuYykge1xuICAgIGlmICh0eXBlb2YgdGVzdC5tZXRob2RzW25hbWVdICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJNZXRob2QgJ1wiICsgbmFtZSArIFwiJyBhbHJlYWR5IGV4aXN0cyFcIilcbiAgICB9XG5cbiAgICAvKiogQHRoaXMgKi9cbiAgICBmdW5jdGlvbiBhcHBseShhLCBiLCBjLCBkKSB7XG4gICAgICAgIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICBjYXNlIDA6IHJldHVybiBmdW5jLmNhbGwodGhpcywgdGhpcylcbiAgICAgICAgY2FzZSAxOiByZXR1cm4gZnVuYy5jYWxsKHRoaXMsIHRoaXMsIGEpXG4gICAgICAgIGNhc2UgMjogcmV0dXJuIGZ1bmMuY2FsbCh0aGlzLCB0aGlzLCBhLCBiKVxuICAgICAgICBjYXNlIDM6IHJldHVybiBmdW5jLmNhbGwodGhpcywgdGhpcywgYSwgYiwgYylcbiAgICAgICAgY2FzZSA0OiByZXR1cm4gZnVuYy5jYWxsKHRoaXMsIHRoaXMsIGEsIGIsIGMsIGQpXG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICB2YXIgYXJncyA9IFt0aGlzXVxuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGFyZ3MucHVzaChhcmd1bWVudHNbaV0pXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBmdW5jLmFwcGx5KHRoaXMsIGFyZ3MpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gLyoqIEB0aGlzICovIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHJldCA9IGFwcGx5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcblxuICAgICAgICByZXR1cm4gcmV0ICE9PSB1bmRlZmluZWQgPyByZXQgOiB0aGlzXG4gICAgfVxufVxuXG5tZXRob2RzKFJlZmxlY3QsIHtcbiAgICBkZWZpbmU6IENvbW1vbi5kZXByZWNhdGUoXG4gICAgICAgIFwiYHJlZmxlY3QuZGVmaW5lYCBpcyBkZXByZWNhdGVkLiBVc2UgZXh0ZXJuYWwgbWV0aG9kcyBvciBkaXJlY3QgYXNzaWdubWVudCBpbnN0ZWFkLlwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1sZW5cbiAgICAgICAgLyoqIEB0aGlzICovIGZ1bmN0aW9uIChuYW1lLCBmdW5jKSB7XG4gICAgICAgICAgICBpdGVyYXRlU2V0dGVyKHRoaXMuXy5jdXJyZW50LnZhbHVlLCBuYW1lLCBmdW5jLCBkZWZpbmVBc3NlcnRpb24pXG4gICAgICAgIH0pLFxuXG4gICAgd3JhcDogQ29tbW9uLmRlcHJlY2F0ZShcbiAgICAgICAgXCJgcmVmbGVjdC53cmFwYCBpcyBkZXByZWNhdGVkLiBVc2UgZXh0ZXJuYWwgbWV0aG9kcyBvciBkaXJlY3QgYXNzaWdubWVudCBpbnN0ZWFkLlwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1sZW5cbiAgICAgICAgLyoqIEB0aGlzICovIGZ1bmN0aW9uIChuYW1lLCBmdW5jKSB7XG4gICAgICAgICAgICBpdGVyYXRlU2V0dGVyKHRoaXMuXy5jdXJyZW50LnZhbHVlLCBuYW1lLCBmdW5jLCB3cmFwQXNzZXJ0aW9uKVxuICAgICAgICB9KSxcblxuICAgIGFkZDogQ29tbW9uLmRlcHJlY2F0ZShcbiAgICAgICAgXCJgcmVmbGVjdC5hZGRgIGlzIGRlcHJlY2F0ZWQuIFVzZSBleHRlcm5hbCBtZXRob2RzIG9yIGRpcmVjdCBhc3NpZ25tZW50IGluc3RlYWQuXCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LWxlblxuICAgICAgICAvKiogQHRoaXMgKi8gZnVuY3Rpb24gKG5hbWUsIGZ1bmMpIHtcbiAgICAgICAgICAgIGl0ZXJhdGVTZXR0ZXIodGhpcy5fLmN1cnJlbnQudmFsdWUsIG5hbWUsIGZ1bmMsIGFkZEFzc2VydGlvbilcbiAgICAgICAgfSksXG59KVxuXG5tZXRob2RzKFRoYWxsaXVtLCB7XG4gICAgZGVmaW5lOiBDb21tb24uZGVwcmVjYXRlKFxuICAgICAgICBcImB0LmRlZmluZWAgaXMgZGVwcmVjYXRlZC4gVXNlIGV4dGVybmFsIG1ldGhvZHMgb3IgZGlyZWN0IGFzc2lnbm1lbnQgaW5zdGVhZC5cIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtbGVuXG4gICAgICAgIC8qKiBAdGhpcyAqLyBmdW5jdGlvbiAobmFtZSwgZnVuYykge1xuICAgICAgICAgICAgaXRlcmF0ZVNldHRlcih0aGlzLl8uY3VycmVudC52YWx1ZSwgbmFtZSwgZnVuYywgZGVmaW5lQXNzZXJ0aW9uKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXNcbiAgICAgICAgfSksXG59KVxuXG4vKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICpcbiAqIC0gYHJlZmxlY3QuZG9gIGlzIGRlcHJlY2F0ZWQsIHdpdGggbm8gcmVwbGFjZW1lbnQgKGlubGluZSB0ZXN0cyBhcmUgYWxzbyAgKlxuICogICBkZXByZWNhdGVkKS4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiAtIGByZWZsZWN0LmJhc2VgIC0+IGBpbnRlcm5hbC5yb290YCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqIC0gYHJlZmxlY3QuQXNzZXJ0aW9uRXJyb3JgIC0+IGBhc3NlcnQuQXNzZXJ0aW9uRXJyb3JgLiAgICAgICAgICAgICAgICAgICAgKlxuICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqL1xuXG5tZXRob2RzKFJlZmxlY3QsIHtcbiAgICAvLyBEZXByZWNhdGVkIGFsaWFzZXNcbiAgICBkbzogQ29tbW9uLmRlcHJlY2F0ZShcbiAgICAgICAgXCJgcmVmbGVjdC5kb2AgaXMgZGVwcmVjYXRlZC4gVHJhbnNpdGlvbiB0byBibG9jayB0ZXN0cywgaWYgbmVjZXNzYXJ5LCBhbmQgcnVuIHRoZSBjb2RlIGRpcmVjdGx5LlwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1sZW5cbiAgICAgICAgLyoqIEB0aGlzICovIGZ1bmN0aW9uIChmdW5jKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGZ1bmMgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBjYWxsYmFjayB0byBiZSBhIGZ1bmN0aW9uXCIpXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGF0dGVtcHQuYXBwbHkodW5kZWZpbmVkLCBhcmd1bWVudHMpXG4gICAgICAgICAgICByZXR1cm4gdGhpc1xuICAgICAgICB9KSxcbiAgICBiYXNlOiBDb21tb24uZGVwcmVjYXRlKFxuICAgICAgICBcImByZWZsZWN0LmJhc2VgIGlzIGRlcHJlY2F0ZWQuIFVzZSBgaW50ZXJuYWwucm9vdGAgZnJvbSBgdGhhbGxpdW0vaW50ZXJuYWxgIGluc3RlYWQuXCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LWxlblxuICAgICAgICBJbnRlcm5hbC5yb290KSxcbn0pXG5cbi8vIEVTTGludCBvZGRseSBjYW4ndCB0ZWxsIHRoZXNlIGFyZSBzaGFkb3dlZC5cbi8qIGVzbGludC1kaXNhYmxlIG5vLWV4dGVuZC1uYXRpdmUgKi9cblxuZnVuY3Rpb24gbG9ja0Vycm9yKEFzc2VydGlvbkVycm9yKSB7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFJlZmxlY3QucHJvdG90eXBlLCBcIkFzc2VydGlvbkVycm9yXCIsIHtcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiBBc3NlcnRpb25FcnJvcixcbiAgICB9KVxuICAgIHJldHVybiBBc3NlcnRpb25FcnJvclxufVxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoUmVmbGVjdC5wcm90b3R5cGUsIFwiQXNzZXJ0aW9uRXJyb3JcIiwge1xuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICBnZXQ6IENvbW1vbi5kZXByZWNhdGUoXG4gICAgICAgIFwiYHJlZmxlY3QuQXNzZXJ0aW9uRXJyb3JgIGlzIGRlcHJlY2F0ZWQuIFVzZSBgYXNzZXJ0LkFzc2VydGlvbkVycm9yYCBmcm9tIGB0aGFsbGl1bS9hc3NlcnRgIGluc3RlYWQuXCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LWxlblxuICAgICAgICBmdW5jdGlvbiAoKSB7IHJldHVybiBsb2NrRXJyb3IoQXNzZXJ0aW9uRXJyb3IpIH0pLFxuICAgIHNldDogQ29tbW9uLmRlcHJlY2F0ZShcbiAgICAgICAgXCJgcmVmbGVjdC5Bc3NlcnRpb25FcnJvcmAgaXMgZGVwcmVjYXRlZC4gVXNlIGBhc3NlcnQuQXNzZXJ0aW9uRXJyb3JgIGZyb20gYHRoYWxsaXVtL2Fzc2VydGAgaW5zdGVhZC5cIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtbGVuXG4gICAgICAgIGxvY2tFcnJvciksXG59KVxuXG4vKiBlc2xpbnQtZW5hYmxlIG5vLWV4dGVuZC1uYXRpdmUgKi9cblxubWV0aG9kcyhUaGFsbGl1bSwge1xuICAgIGJhc2U6IENvbW1vbi5kZXByZWNhdGUoXG4gICAgICAgIFwiYHQuYmFzZWAgaXMgZGVwcmVjYXRlZC4gVXNlIGB0LmNyZWF0ZWAgaW5zdGVhZC5cIixcbiAgICAgICAgZnVuY3Rpb24gKCkgeyByZXR1cm4gbmV3IFRoYWxsaXVtKCkgfSksXG59KVxuXG4vKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICpcbiAqIC0gYXNzZXJ0aW9ucyBkZWZpbmVkIG9uIG1haW4gZXhwb3J0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogLSBgdC4qYCBhc3NlcnRpb25zIC0+IGBhc3NlcnQuKmAgKHNvbWUgcmVuYW1lZCkgZnJvbSBgdGhhbGxpdW0vYXNzZXJ0YCAgICAqXG4gKiAtIGB0LnRydWVgL2V0Yy4gYXJlIGdvbmUgKGV4Y2VwdCBgdC51bmRlZmluZWRgIC0+IGBhc3NlcnQudW5kZWZpbmVkYCkgICAgICpcbiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKi9cbkNvbW1vbi5oaWRlRGVwcmVjYXRpb24oKVxucmVxdWlyZShcIi4uL2Fzc2VydGlvbnNcIikocmVxdWlyZShcIi4uL2luZGV4XCIpKVxuQ29tbW9uLnNob3dEZXByZWNhdGlvbigpXG5cbi8qICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKlxuICogYGV4dHJhYCBldmVudHMgYXJlIG5vIGxvbmdlciBhIHRoaW5nLiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICovXG5tZXRob2RzKFJlcG9ydCwge1xuICAgIGdldCBpc0lubGluZSgpIHtcbiAgICAgICAgQ29tbW9uLndhcm4oXCJgZXh0cmFgIGV2ZW50cyBubyBsb25nZXIgZXhpc3QuIFlvdSBubyBsb25nZXIgbmVlZCB0byBcIiArXG4gICAgICAgICAgICBcImhhbmRsZSB0aGVtXCIpXG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgIH0sXG59KVxuXG4vKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICpcbiAqIC0gYHQucmVmbGVjdGAgYW5kIGB0LnVzZWAgLT4gbm9uLWNhY2hpbmcgYHQuY2FsbGAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqL1xudmFyIGNhbGwgPSBUaGFsbGl1bS5wcm90b3R5cGUuY2FsbFxuXG5mdW5jdGlvbiBpZCh4KSB7IHJldHVybiB4IH1cblxubWV0aG9kcyhUaGFsbGl1bSwge1xuICAgIHJlZmxlY3Q6IENvbW1vbi5kZXByZWNhdGUoXG4gICAgICAgIFwiYHQucmVmbGVjdGAgaXMgZGVwcmVjYXRlZC4gVXNlIGB0LmNhbGxgIGluc3RlYWQuXCIsXG4gICAgICAgIC8qKiBAdGhpcyAqLyBmdW5jdGlvbiAoKSB7IHJldHVybiBjYWxsLmNhbGwodGhpcywgaWQpIH0pLFxuXG4gICAgdXNlOiBDb21tb24uZGVwcmVjYXRlKFxuICAgICAgICBcImB0LnVzZWAgaXMgZGVwcmVjYXRlZC4gVXNlIGB0LmNhbGxgIGluc3RlYWQuXCIsXG4gICAgICAgIC8qKiBAdGhpcyAqLyBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgcmVmbGVjdCA9IGNhbGwuY2FsbCh0aGlzLCBpZClcblxuICAgICAgICAgICAgaWYgKCFyZWZsZWN0LnNraXBwZWQpIHtcbiAgICAgICAgICAgICAgICB2YXIgdGVzdCA9IHRoaXMuXy5jdXJyZW50LnZhbHVlXG5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcGx1Z2luID0gYXJndW1lbnRzW2ldXG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBwbHVnaW4gIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIkV4cGVjdGVkIGBwbHVnaW5gIHRvIGJlIGEgZnVuY3Rpb25cIilcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0ZXN0LnBsdWdpbnMgPT0gbnVsbCkgdGVzdC5wbHVnaW5zID0gW11cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRlc3QucGx1Z2lucy5pbmRleE9mKHBsdWdpbikgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBBZGQgcGx1Z2luIGJlZm9yZSBjYWxsaW5nIGl0LlxuICAgICAgICAgICAgICAgICAgICAgICAgdGVzdC5wbHVnaW5zLnB1c2gocGx1Z2luKVxuICAgICAgICAgICAgICAgICAgICAgICAgcGx1Z2luLmNhbGwodGhpcywgdGhpcylcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRoaXNcbiAgICAgICAgfSksXG59KVxuXG4vKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICpcbiAqIC0gYHJlZmxlY3QucmVwb3J0YCAtPiBgaW50ZXJuYWwucmVwb3J0LipgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogLSBgcmVmbGVjdC5sb2NgIC0+IGBpbnRlcm5hbC5sb2NhdGlvbmAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiAtIGByZWZsZWN0LnNjaGVkdWxlcmAgb2Jzb2xldGVkLiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKi9cblxudmFyIHJlcG9ydHMgPSBJbnRlcm5hbC5yZXBvcnRzXG5cbm1ldGhvZHMoUmVmbGVjdCwge1xuICAgIHJlcG9ydDogQ29tbW9uLmRlcHJlY2F0ZShcbiAgICAgICAgXCJgcmVmbGVjdC5yZXBvcnRgIGlzIGRlcHJlY2F0ZWQuIFVzZSBgaW50ZXJuYWwucmVwb3J0LipgIGZyb20gYHRoYWxsaXVtL2ludGVybmFsYCBpbnN0ZWFkLlwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1sZW5cbiAgICAgICAgZnVuY3Rpb24gKHR5cGUsIHBhdGgsIHZhbHVlLCBkdXJhdGlvbiwgc2xvdykgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1wYXJhbXMsIG1heC1sZW5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgdHlwZSAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBgdHlwZWAgdG8gYmUgYSBzdHJpbmdcIilcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgICAgICBjYXNlIFwic3RhcnRcIjogcmV0dXJuIHJlcG9ydHMuc3RhcnQoKVxuICAgICAgICAgICAgY2FzZSBcImVudGVyXCI6IHJldHVybiByZXBvcnRzLmVudGVyKHBhdGgsIGR1cmF0aW9uLCBzbG93KVxuICAgICAgICAgICAgY2FzZSBcImxlYXZlXCI6IHJldHVybiByZXBvcnRzLmxlYXZlKHBhdGgpXG4gICAgICAgICAgICBjYXNlIFwicGFzc1wiOiByZXR1cm4gcmVwb3J0cy5wYXNzKHBhdGgsIGR1cmF0aW9uLCBzbG93KVxuICAgICAgICAgICAgY2FzZSBcImZhaWxcIjogcmV0dXJuIHJlcG9ydHMuZmFpbChwYXRoLCB2YWx1ZSwgZHVyYXRpb24sIHNsb3cpXG4gICAgICAgICAgICBjYXNlIFwic2tpcFwiOiByZXR1cm4gcmVwb3J0cy5za2lwKHBhdGgpXG4gICAgICAgICAgICBjYXNlIFwiZW5kXCI6IHJldHVybiByZXBvcnRzLmVuZCgpXG4gICAgICAgICAgICBjYXNlIFwiZXJyb3JcIjogcmV0dXJuIHJlcG9ydHMuZXJyb3IodmFsdWUpXG4gICAgICAgICAgICBjYXNlIFwiaG9va1wiOiByZXR1cm4gcmVwb3J0cy5ob29rKHBhdGgsIHZhbHVlKVxuICAgICAgICAgICAgZGVmYXVsdDogdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCJVbmtub3duIHJlcG9ydCBgdHlwZWA6IFwiICsgdHlwZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSksXG5cbiAgICBsb2M6IENvbW1vbi5kZXByZWNhdGUoXG4gICAgICAgIFwiYHJlZmxlY3QubG9jYCBpcyBkZXByZWNhdGVkLiBVc2UgYGludGVybmFsLmxvY2F0aW9uYCBmcm9tIGB0aGFsbGl1bS9pbnRlcm5hbGAgaW5zdGVhZC5cIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtbGVuXG4gICAgICAgIEludGVybmFsLmxvY2F0aW9uKSxcblxuICAgIHNjaGVkdWxlcjogQ29tbW9uLmRlcHJlY2F0ZShcbiAgICAgICAgXCJgcmVmbGVjdC5zY2hlZHVsZXJgIGlzIGRlcHJlY2F0ZWQuIEl0IGlzIG5vIGxvbmdlciB1c2VmdWwgdG8gdGhlIGxpYnJhcnksIGFuZCBjYW4gYmUgc2FmZWx5IHJlbW92ZWQuXCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LWxlblxuICAgICAgICBmdW5jdGlvbiAoKSB7fSksXG59KVxuXG4vKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICpcbiAqIElubGluZSB0ZXN0cyBhcmUgZGVwcmVjYXRlZC4gVGhpcyBpcyBcImZpeGVkXCIgYnkganVzdCB0aHJvd2luZywgc2luY2UgaXQncyAqXG4gKiBoYXJkIHRvIHBhdGNoIGJhY2sgaW4gYW5kIGVhc3kgdG8gZml4IG9uIHRoZSB1c2VyJ3MgZW5kLiAgICAgICAgICAgICAgICAgICpcbiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKi9cbm1ldGhvZHMoVGhhbGxpdW0sIHtcbiAgICB0ZXN0OiBmdW5jdGlvbiAobmFtZSwgZnVuYykge1xuICAgICAgICBpZiAoZnVuYyA9PSBudWxsKSB7XG4gICAgICAgICAgICAvLyBDYXRjaCB0aGlzIHBhcnRpY3VsYXIgY2FzZSwgdG8gdGhyb3cgd2l0aCBhIG1vcmUgaW5mb3JtYXRpdmVcbiAgICAgICAgICAgIC8vIG1lc3NzYWdlLlxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICAgICAgICAgICBcIklubGluZSB0ZXN0cyBhcmUgZGVwcmVjYXRlZC4gVXNlIGJsb2NrIHRlc3RzIGluc3RlYWQuXCIpXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGVzdC5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gICAgfSxcbn0pXG5cbm1ldGhvZHMoUmVmbGVjdCwge1xuICAgIGdldCBpc0lubGluZSgpIHtcbiAgICAgICAgQ29tbW9uLndhcm4oXCJUZXN0cyBhcmUgbm93IG5ldmVyIGlubGluZS4gWW91IG5vIGxvbmdlciBuZWVkIHRvIFwiICtcbiAgICAgICAgICAgIFwiaGFuZGxlIHRoaXMgY2FzZVwiKVxuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICB9LFxufSlcblxuLyogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqXG4gKiBgcmVmbGVjdC5tZXRob2RzYCAtPiBgcmVmbGVjdC5jdXJyZW50YCBhbmQgdXNpbmcgbmV3IGByZWZsZWN0YCBtZXRob2RzICAgICpcbiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKi9cbm1ldGhvZHMoUmVmbGVjdCwge1xuICAgIGdldCBtZXRob2RzKCkge1xuICAgICAgICBDb21tb24ud2FybihcImByZWZsZWN0Lm1ldGhvZHNgIGlzIGRlcHJlY2F0ZWQuIFVzZSBgcmVmbGVjdC5jdXJyZW50YCwgXCIgK1xuICAgICAgICAgICAgXCJ0aGUgcmV0dXJuIHZhbHVlIG9mIGB0LmNhbGxgLCBhbmQgdGhlIGFwcHJvcHJpYXRlIG5ldyBgcmVmbGVjdGAgXCIgK1xuICAgICAgICAgICAgXCJtZXRob2RzIGluc3RlYWRcIilcbiAgICAgICAgcmV0dXJuIHRoaXMuXy5tZXRob2RzXG4gICAgfSxcbn0pXG5cbi8qICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKlxuICogYHJlZmxlY3QucmVwb3J0ZXJzYCAtPiBgcmVmbGVjdC5oYXNSZXBvcnRlcmAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICovXG5tZXRob2RzKFJlZmxlY3QsIHtcbiAgICBnZXQgcmVwb3J0ZXJzKCkge1xuICAgICAgICBDb21tb24ud2FybihcImByZWZsZWN0LnJlcG9ydGVyc2AgaXMgZGVwcmVjYXRlZC4gVXNlIFwiICtcbiAgICAgICAgICAgIFwiYHJlZmxlY3QuaGFzUmVwb3J0ZXJgIGluc3RlYWQgdG8gY2hlY2sgZm9yIGV4aXN0ZW5jZSBvZiBhIFwiICtcbiAgICAgICAgICAgIFwicmVwb3J0ZXIuXCIpXG4gICAgICAgIHJldHVybiB0aGlzLl8ubWV0aG9kc1xuICAgIH0sXG59KVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoeHMsIGYpIHtcbiAgICBpZiAoeHMubWFwKSByZXR1cm4geHMubWFwKGYpO1xuICAgIHZhciByZXMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHhzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciB4ID0geHNbaV07XG4gICAgICAgIGlmIChoYXNPd24uY2FsbCh4cywgaSkpIHJlcy5wdXNoKGYoeCwgaSwgeHMpKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbn07XG5cbnZhciBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuIiwidmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHhzLCBmLCBhY2MpIHtcbiAgICB2YXIgaGFzQWNjID0gYXJndW1lbnRzLmxlbmd0aCA+PSAzO1xuICAgIGlmIChoYXNBY2MgJiYgeHMucmVkdWNlKSByZXR1cm4geHMucmVkdWNlKGYsIGFjYyk7XG4gICAgaWYgKHhzLnJlZHVjZSkgcmV0dXJuIHhzLnJlZHVjZShmKTtcbiAgICBcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHhzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICghaGFzT3duLmNhbGwoeHMsIGkpKSBjb250aW51ZTtcbiAgICAgICAgaWYgKCFoYXNBY2MpIHtcbiAgICAgICAgICAgIGFjYyA9IHhzW2ldO1xuICAgICAgICAgICAgaGFzQWNjID0gdHJ1ZTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGFjYyA9IGYoYWNjLCB4c1tpXSwgaSk7XG4gICAgfVxuICAgIHJldHVybiBhY2M7XG59O1xuIiwiXG52YXIgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcbnZhciB0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZm9yRWFjaCAob2JqLCBmbiwgY3R4KSB7XG4gICAgaWYgKHRvU3RyaW5nLmNhbGwoZm4pICE9PSAnW29iamVjdCBGdW5jdGlvbl0nKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ2l0ZXJhdG9yIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuICAgIH1cbiAgICB2YXIgbCA9IG9iai5sZW5ndGg7XG4gICAgaWYgKGwgPT09ICtsKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICBmbi5jYWxsKGN0eCwgb2JqW2ldLCBpLCBvYmopO1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZm9yICh2YXIgayBpbiBvYmopIHtcbiAgICAgICAgICAgIGlmIChoYXNPd24uY2FsbChvYmosIGspKSB7XG4gICAgICAgICAgICAgICAgZm4uY2FsbChjdHgsIG9ialtrXSwgaywgb2JqKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn07XG5cbiIsIlxudmFyIGluZGV4T2YgPSBbXS5pbmRleE9mO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGFyciwgb2JqKXtcbiAgaWYgKGluZGV4T2YpIHJldHVybiBhcnIuaW5kZXhPZihvYmopO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7ICsraSkge1xuICAgIGlmIChhcnJbaV0gPT09IG9iaikgcmV0dXJuIGk7XG4gIH1cbiAgcmV0dXJuIC0xO1xufTsiLCIvKiEgSlNPTiB2My4zLjAgfCBodHRwOi8vYmVzdGllanMuZ2l0aHViLmlvL2pzb24zIHwgQ29weXJpZ2h0IDIwMTItMjAxNCwgS2l0IENhbWJyaWRnZSB8IGh0dHA6Ly9raXQubWl0LWxpY2Vuc2Uub3JnICovXG47KGZ1bmN0aW9uIChyb290KSB7XG4gIC8vIERldGVjdCB0aGUgYGRlZmluZWAgZnVuY3Rpb24gZXhwb3NlZCBieSBhc3luY2hyb25vdXMgbW9kdWxlIGxvYWRlcnMuIFRoZVxuICAvLyBzdHJpY3QgYGRlZmluZWAgY2hlY2sgaXMgbmVjZXNzYXJ5IGZvciBjb21wYXRpYmlsaXR5IHdpdGggYHIuanNgLlxuICB2YXIgaXNMb2FkZXIgPSB0eXBlb2YgZGVmaW5lID09PSBcImZ1bmN0aW9uXCIgJiYgZGVmaW5lLmFtZDtcblxuICAvLyBVc2UgdGhlIGBnbG9iYWxgIG9iamVjdCBleHBvc2VkIGJ5IE5vZGUgKGluY2x1ZGluZyBCcm93c2VyaWZ5IHZpYVxuICAvLyBgaW5zZXJ0LW1vZHVsZS1nbG9iYWxzYCksIE5hcndoYWwsIGFuZCBSaW5nbyBhcyB0aGUgZGVmYXVsdCBjb250ZXh0LlxuICAvLyBSaGlubyBleHBvcnRzIGEgYGdsb2JhbGAgZnVuY3Rpb24gaW5zdGVhZC5cbiAgdmFyIGZyZWVHbG9iYWwgPSB0eXBlb2YgZ2xvYmFsID09IFwib2JqZWN0XCIgJiYgZ2xvYmFsO1xuICBpZiAoZnJlZUdsb2JhbCAmJiAoZnJlZUdsb2JhbFtcImdsb2JhbFwiXSA9PT0gZnJlZUdsb2JhbCB8fCBmcmVlR2xvYmFsW1wid2luZG93XCJdID09PSBmcmVlR2xvYmFsKSkge1xuICAgIHJvb3QgPSBmcmVlR2xvYmFsO1xuICB9XG5cbiAgLy8gUHVibGljOiBJbml0aWFsaXplcyBKU09OIDMgdXNpbmcgdGhlIGdpdmVuIGBjb250ZXh0YCBvYmplY3QsIGF0dGFjaGluZyB0aGVcbiAgLy8gYHN0cmluZ2lmeWAgYW5kIGBwYXJzZWAgZnVuY3Rpb25zIHRvIHRoZSBzcGVjaWZpZWQgYGV4cG9ydHNgIG9iamVjdC5cbiAgZnVuY3Rpb24gcnVuSW5Db250ZXh0KGNvbnRleHQsIGV4cG9ydHMpIHtcbiAgICBjb250ZXh0IHx8IChjb250ZXh0ID0gcm9vdFtcIk9iamVjdFwiXSgpKTtcbiAgICBleHBvcnRzIHx8IChleHBvcnRzID0gcm9vdFtcIk9iamVjdFwiXSgpKTtcblxuICAgIC8vIE5hdGl2ZSBjb25zdHJ1Y3RvciBhbGlhc2VzLlxuICAgIHZhciBOdW1iZXIgPSBjb250ZXh0W1wiTnVtYmVyXCJdIHx8IHJvb3RbXCJOdW1iZXJcIl0sXG4gICAgICAgIFN0cmluZyA9IGNvbnRleHRbXCJTdHJpbmdcIl0gfHwgcm9vdFtcIlN0cmluZ1wiXSxcbiAgICAgICAgT2JqZWN0ID0gY29udGV4dFtcIk9iamVjdFwiXSB8fCByb290W1wiT2JqZWN0XCJdLFxuICAgICAgICBEYXRlID0gY29udGV4dFtcIkRhdGVcIl0gfHwgcm9vdFtcIkRhdGVcIl0sXG4gICAgICAgIFN5bnRheEVycm9yID0gY29udGV4dFtcIlN5bnRheEVycm9yXCJdIHx8IHJvb3RbXCJTeW50YXhFcnJvclwiXSxcbiAgICAgICAgVHlwZUVycm9yID0gY29udGV4dFtcIlR5cGVFcnJvclwiXSB8fCByb290W1wiVHlwZUVycm9yXCJdLFxuICAgICAgICBNYXRoID0gY29udGV4dFtcIk1hdGhcIl0gfHwgcm9vdFtcIk1hdGhcIl0sXG4gICAgICAgIG5hdGl2ZUpTT04gPSBjb250ZXh0W1wiSlNPTlwiXSB8fCByb290W1wiSlNPTlwiXTtcblxuICAgIC8vIERlbGVnYXRlIHRvIHRoZSBuYXRpdmUgYHN0cmluZ2lmeWAgYW5kIGBwYXJzZWAgaW1wbGVtZW50YXRpb25zLlxuICAgIGlmICh0eXBlb2YgbmF0aXZlSlNPTiA9PSBcIm9iamVjdFwiICYmIG5hdGl2ZUpTT04pIHtcbiAgICAgIGV4cG9ydHMuc3RyaW5naWZ5ID0gbmF0aXZlSlNPTi5zdHJpbmdpZnk7XG4gICAgICBleHBvcnRzLnBhcnNlID0gbmF0aXZlSlNPTi5wYXJzZTtcbiAgICB9XG5cbiAgICAvLyBDb252ZW5pZW5jZSBhbGlhc2VzLlxuICAgIHZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGUsXG4gICAgICAgIGdldENsYXNzID0gb2JqZWN0UHJvdG8udG9TdHJpbmcsXG4gICAgICAgIGlzUHJvcGVydHksIGZvckVhY2gsIHVuZGVmO1xuXG4gICAgLy8gVGVzdCB0aGUgYERhdGUjZ2V0VVRDKmAgbWV0aG9kcy4gQmFzZWQgb24gd29yayBieSBAWWFmZmxlLlxuICAgIHZhciBpc0V4dGVuZGVkID0gbmV3IERhdGUoLTM1MDk4MjczMzQ1NzMyOTIpO1xuICAgIHRyeSB7XG4gICAgICAvLyBUaGUgYGdldFVUQ0Z1bGxZZWFyYCwgYE1vbnRoYCwgYW5kIGBEYXRlYCBtZXRob2RzIHJldHVybiBub25zZW5zaWNhbFxuICAgICAgLy8gcmVzdWx0cyBmb3IgY2VydGFpbiBkYXRlcyBpbiBPcGVyYSA+PSAxMC41My5cbiAgICAgIGlzRXh0ZW5kZWQgPSBpc0V4dGVuZGVkLmdldFVUQ0Z1bGxZZWFyKCkgPT0gLTEwOTI1MiAmJiBpc0V4dGVuZGVkLmdldFVUQ01vbnRoKCkgPT09IDAgJiYgaXNFeHRlbmRlZC5nZXRVVENEYXRlKCkgPT09IDEgJiZcbiAgICAgICAgLy8gU2FmYXJpIDwgMi4wLjIgc3RvcmVzIHRoZSBpbnRlcm5hbCBtaWxsaXNlY29uZCB0aW1lIHZhbHVlIGNvcnJlY3RseSxcbiAgICAgICAgLy8gYnV0IGNsaXBzIHRoZSB2YWx1ZXMgcmV0dXJuZWQgYnkgdGhlIGRhdGUgbWV0aG9kcyB0byB0aGUgcmFuZ2Ugb2ZcbiAgICAgICAgLy8gc2lnbmVkIDMyLWJpdCBpbnRlZ2VycyAoWy0yICoqIDMxLCAyICoqIDMxIC0gMV0pLlxuICAgICAgICBpc0V4dGVuZGVkLmdldFVUQ0hvdXJzKCkgPT0gMTAgJiYgaXNFeHRlbmRlZC5nZXRVVENNaW51dGVzKCkgPT0gMzcgJiYgaXNFeHRlbmRlZC5nZXRVVENTZWNvbmRzKCkgPT0gNiAmJiBpc0V4dGVuZGVkLmdldFVUQ01pbGxpc2Vjb25kcygpID09IDcwODtcbiAgICB9IGNhdGNoIChleGNlcHRpb24pIHt9XG5cbiAgICAvLyBJbnRlcm5hbDogRGV0ZXJtaW5lcyB3aGV0aGVyIHRoZSBuYXRpdmUgYEpTT04uc3RyaW5naWZ5YCBhbmQgYHBhcnNlYFxuICAgIC8vIGltcGxlbWVudGF0aW9ucyBhcmUgc3BlYy1jb21wbGlhbnQuIEJhc2VkIG9uIHdvcmsgYnkgS2VuIFNueWRlci5cbiAgICBmdW5jdGlvbiBoYXMobmFtZSkge1xuICAgICAgaWYgKGhhc1tuYW1lXSAhPT0gdW5kZWYpIHtcbiAgICAgICAgLy8gUmV0dXJuIGNhY2hlZCBmZWF0dXJlIHRlc3QgcmVzdWx0LlxuICAgICAgICByZXR1cm4gaGFzW25hbWVdO1xuICAgICAgfVxuICAgICAgdmFyIGlzU3VwcG9ydGVkO1xuICAgICAgaWYgKG5hbWUgPT0gXCJidWctc3RyaW5nLWNoYXItaW5kZXhcIikge1xuICAgICAgICAvLyBJRSA8PSA3IGRvZXNuJ3Qgc3VwcG9ydCBhY2Nlc3Npbmcgc3RyaW5nIGNoYXJhY3RlcnMgdXNpbmcgc3F1YXJlXG4gICAgICAgIC8vIGJyYWNrZXQgbm90YXRpb24uIElFIDggb25seSBzdXBwb3J0cyB0aGlzIGZvciBwcmltaXRpdmVzLlxuICAgICAgICBpc1N1cHBvcnRlZCA9IFwiYVwiWzBdICE9IFwiYVwiO1xuICAgICAgfSBlbHNlIGlmIChuYW1lID09IFwianNvblwiKSB7XG4gICAgICAgIC8vIEluZGljYXRlcyB3aGV0aGVyIGJvdGggYEpTT04uc3RyaW5naWZ5YCBhbmQgYEpTT04ucGFyc2VgIGFyZVxuICAgICAgICAvLyBzdXBwb3J0ZWQuXG4gICAgICAgIGlzU3VwcG9ydGVkID0gaGFzKFwianNvbi1zdHJpbmdpZnlcIikgJiYgaGFzKFwianNvbi1wYXJzZVwiKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciB2YWx1ZSwgc2VyaWFsaXplZCA9ICd7XCJhXCI6WzEsdHJ1ZSxmYWxzZSxudWxsLFwiXFxcXHUwMDAwXFxcXGJcXFxcblxcXFxmXFxcXHJcXFxcdFwiXX0nO1xuICAgICAgICAvLyBUZXN0IGBKU09OLnN0cmluZ2lmeWAuXG4gICAgICAgIGlmIChuYW1lID09IFwianNvbi1zdHJpbmdpZnlcIikge1xuICAgICAgICAgIHZhciBzdHJpbmdpZnkgPSBleHBvcnRzLnN0cmluZ2lmeSwgc3RyaW5naWZ5U3VwcG9ydGVkID0gdHlwZW9mIHN0cmluZ2lmeSA9PSBcImZ1bmN0aW9uXCIgJiYgaXNFeHRlbmRlZDtcbiAgICAgICAgICBpZiAoc3RyaW5naWZ5U3VwcG9ydGVkKSB7XG4gICAgICAgICAgICAvLyBBIHRlc3QgZnVuY3Rpb24gb2JqZWN0IHdpdGggYSBjdXN0b20gYHRvSlNPTmAgbWV0aG9kLlxuICAgICAgICAgICAgKHZhbHVlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgICAgIH0pLnRvSlNPTiA9IHZhbHVlO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgc3RyaW5naWZ5U3VwcG9ydGVkID1cbiAgICAgICAgICAgICAgICAvLyBGaXJlZm94IDMuMWIxIGFuZCBiMiBzZXJpYWxpemUgc3RyaW5nLCBudW1iZXIsIGFuZCBib29sZWFuXG4gICAgICAgICAgICAgICAgLy8gcHJpbWl0aXZlcyBhcyBvYmplY3QgbGl0ZXJhbHMuXG4gICAgICAgICAgICAgICAgc3RyaW5naWZ5KDApID09PSBcIjBcIiAmJlxuICAgICAgICAgICAgICAgIC8vIEZGIDMuMWIxLCBiMiwgYW5kIEpTT04gMiBzZXJpYWxpemUgd3JhcHBlZCBwcmltaXRpdmVzIGFzIG9iamVjdFxuICAgICAgICAgICAgICAgIC8vIGxpdGVyYWxzLlxuICAgICAgICAgICAgICAgIHN0cmluZ2lmeShuZXcgTnVtYmVyKCkpID09PSBcIjBcIiAmJlxuICAgICAgICAgICAgICAgIHN0cmluZ2lmeShuZXcgU3RyaW5nKCkpID09ICdcIlwiJyAmJlxuICAgICAgICAgICAgICAgIC8vIEZGIDMuMWIxLCAyIHRocm93IGFuIGVycm9yIGlmIHRoZSB2YWx1ZSBpcyBgbnVsbGAsIGB1bmRlZmluZWRgLCBvclxuICAgICAgICAgICAgICAgIC8vIGRvZXMgbm90IGRlZmluZSBhIGNhbm9uaWNhbCBKU09OIHJlcHJlc2VudGF0aW9uICh0aGlzIGFwcGxpZXMgdG9cbiAgICAgICAgICAgICAgICAvLyBvYmplY3RzIHdpdGggYHRvSlNPTmAgcHJvcGVydGllcyBhcyB3ZWxsLCAqdW5sZXNzKiB0aGV5IGFyZSBuZXN0ZWRcbiAgICAgICAgICAgICAgICAvLyB3aXRoaW4gYW4gb2JqZWN0IG9yIGFycmF5KS5cbiAgICAgICAgICAgICAgICBzdHJpbmdpZnkoZ2V0Q2xhc3MpID09PSB1bmRlZiAmJlxuICAgICAgICAgICAgICAgIC8vIElFIDggc2VyaWFsaXplcyBgdW5kZWZpbmVkYCBhcyBgXCJ1bmRlZmluZWRcImAuIFNhZmFyaSA8PSA1LjEuNyBhbmRcbiAgICAgICAgICAgICAgICAvLyBGRiAzLjFiMyBwYXNzIHRoaXMgdGVzdC5cbiAgICAgICAgICAgICAgICBzdHJpbmdpZnkodW5kZWYpID09PSB1bmRlZiAmJlxuICAgICAgICAgICAgICAgIC8vIFNhZmFyaSA8PSA1LjEuNyBhbmQgRkYgMy4xYjMgdGhyb3cgYEVycm9yYHMgYW5kIGBUeXBlRXJyb3JgcyxcbiAgICAgICAgICAgICAgICAvLyByZXNwZWN0aXZlbHksIGlmIHRoZSB2YWx1ZSBpcyBvbWl0dGVkIGVudGlyZWx5LlxuICAgICAgICAgICAgICAgIHN0cmluZ2lmeSgpID09PSB1bmRlZiAmJlxuICAgICAgICAgICAgICAgIC8vIEZGIDMuMWIxLCAyIHRocm93IGFuIGVycm9yIGlmIHRoZSBnaXZlbiB2YWx1ZSBpcyBub3QgYSBudW1iZXIsXG4gICAgICAgICAgICAgICAgLy8gc3RyaW5nLCBhcnJheSwgb2JqZWN0LCBCb29sZWFuLCBvciBgbnVsbGAgbGl0ZXJhbC4gVGhpcyBhcHBsaWVzIHRvXG4gICAgICAgICAgICAgICAgLy8gb2JqZWN0cyB3aXRoIGN1c3RvbSBgdG9KU09OYCBtZXRob2RzIGFzIHdlbGwsIHVubGVzcyB0aGV5IGFyZSBuZXN0ZWRcbiAgICAgICAgICAgICAgICAvLyBpbnNpZGUgb2JqZWN0IG9yIGFycmF5IGxpdGVyYWxzLiBZVUkgMy4wLjBiMSBpZ25vcmVzIGN1c3RvbSBgdG9KU09OYFxuICAgICAgICAgICAgICAgIC8vIG1ldGhvZHMgZW50aXJlbHkuXG4gICAgICAgICAgICAgICAgc3RyaW5naWZ5KHZhbHVlKSA9PT0gXCIxXCIgJiZcbiAgICAgICAgICAgICAgICBzdHJpbmdpZnkoW3ZhbHVlXSkgPT0gXCJbMV1cIiAmJlxuICAgICAgICAgICAgICAgIC8vIFByb3RvdHlwZSA8PSAxLjYuMSBzZXJpYWxpemVzIGBbdW5kZWZpbmVkXWAgYXMgYFwiW11cImAgaW5zdGVhZCBvZlxuICAgICAgICAgICAgICAgIC8vIGBcIltudWxsXVwiYC5cbiAgICAgICAgICAgICAgICBzdHJpbmdpZnkoW3VuZGVmXSkgPT0gXCJbbnVsbF1cIiAmJlxuICAgICAgICAgICAgICAgIC8vIFlVSSAzLjAuMGIxIGZhaWxzIHRvIHNlcmlhbGl6ZSBgbnVsbGAgbGl0ZXJhbHMuXG4gICAgICAgICAgICAgICAgc3RyaW5naWZ5KG51bGwpID09IFwibnVsbFwiICYmXG4gICAgICAgICAgICAgICAgLy8gRkYgMy4xYjEsIDIgaGFsdHMgc2VyaWFsaXphdGlvbiBpZiBhbiBhcnJheSBjb250YWlucyBhIGZ1bmN0aW9uOlxuICAgICAgICAgICAgICAgIC8vIGBbMSwgdHJ1ZSwgZ2V0Q2xhc3MsIDFdYCBzZXJpYWxpemVzIGFzIFwiWzEsdHJ1ZSxdLFwiLiBGRiAzLjFiM1xuICAgICAgICAgICAgICAgIC8vIGVsaWRlcyBub24tSlNPTiB2YWx1ZXMgZnJvbSBvYmplY3RzIGFuZCBhcnJheXMsIHVubGVzcyB0aGV5XG4gICAgICAgICAgICAgICAgLy8gZGVmaW5lIGN1c3RvbSBgdG9KU09OYCBtZXRob2RzLlxuICAgICAgICAgICAgICAgIHN0cmluZ2lmeShbdW5kZWYsIGdldENsYXNzLCBudWxsXSkgPT0gXCJbbnVsbCxudWxsLG51bGxdXCIgJiZcbiAgICAgICAgICAgICAgICAvLyBTaW1wbGUgc2VyaWFsaXphdGlvbiB0ZXN0LiBGRiAzLjFiMSB1c2VzIFVuaWNvZGUgZXNjYXBlIHNlcXVlbmNlc1xuICAgICAgICAgICAgICAgIC8vIHdoZXJlIGNoYXJhY3RlciBlc2NhcGUgY29kZXMgYXJlIGV4cGVjdGVkIChlLmcuLCBgXFxiYCA9PiBgXFx1MDAwOGApLlxuICAgICAgICAgICAgICAgIHN0cmluZ2lmeSh7IFwiYVwiOiBbdmFsdWUsIHRydWUsIGZhbHNlLCBudWxsLCBcIlxceDAwXFxiXFxuXFxmXFxyXFx0XCJdIH0pID09IHNlcmlhbGl6ZWQgJiZcbiAgICAgICAgICAgICAgICAvLyBGRiAzLjFiMSBhbmQgYjIgaWdub3JlIHRoZSBgZmlsdGVyYCBhbmQgYHdpZHRoYCBhcmd1bWVudHMuXG4gICAgICAgICAgICAgICAgc3RyaW5naWZ5KG51bGwsIHZhbHVlKSA9PT0gXCIxXCIgJiZcbiAgICAgICAgICAgICAgICBzdHJpbmdpZnkoWzEsIDJdLCBudWxsLCAxKSA9PSBcIltcXG4gMSxcXG4gMlxcbl1cIiAmJlxuICAgICAgICAgICAgICAgIC8vIEpTT04gMiwgUHJvdG90eXBlIDw9IDEuNywgYW5kIG9sZGVyIFdlYktpdCBidWlsZHMgaW5jb3JyZWN0bHlcbiAgICAgICAgICAgICAgICAvLyBzZXJpYWxpemUgZXh0ZW5kZWQgeWVhcnMuXG4gICAgICAgICAgICAgICAgc3RyaW5naWZ5KG5ldyBEYXRlKC04LjY0ZTE1KSkgPT0gJ1wiLTI3MTgyMS0wNC0yMFQwMDowMDowMC4wMDBaXCInICYmXG4gICAgICAgICAgICAgICAgLy8gVGhlIG1pbGxpc2Vjb25kcyBhcmUgb3B0aW9uYWwgaW4gRVMgNSwgYnV0IHJlcXVpcmVkIGluIDUuMS5cbiAgICAgICAgICAgICAgICBzdHJpbmdpZnkobmV3IERhdGUoOC42NGUxNSkpID09ICdcIisyNzU3NjAtMDktMTNUMDA6MDA6MDAuMDAwWlwiJyAmJlxuICAgICAgICAgICAgICAgIC8vIEZpcmVmb3ggPD0gMTEuMCBpbmNvcnJlY3RseSBzZXJpYWxpemVzIHllYXJzIHByaW9yIHRvIDAgYXMgbmVnYXRpdmVcbiAgICAgICAgICAgICAgICAvLyBmb3VyLWRpZ2l0IHllYXJzIGluc3RlYWQgb2Ygc2l4LWRpZ2l0IHllYXJzLiBDcmVkaXRzOiBAWWFmZmxlLlxuICAgICAgICAgICAgICAgIHN0cmluZ2lmeShuZXcgRGF0ZSgtNjIxOTg3NTUyZTUpKSA9PSAnXCItMDAwMDAxLTAxLTAxVDAwOjAwOjAwLjAwMFpcIicgJiZcbiAgICAgICAgICAgICAgICAvLyBTYWZhcmkgPD0gNS4xLjUgYW5kIE9wZXJhID49IDEwLjUzIGluY29ycmVjdGx5IHNlcmlhbGl6ZSBtaWxsaXNlY29uZFxuICAgICAgICAgICAgICAgIC8vIHZhbHVlcyBsZXNzIHRoYW4gMTAwMC4gQ3JlZGl0czogQFlhZmZsZS5cbiAgICAgICAgICAgICAgICBzdHJpbmdpZnkobmV3IERhdGUoLTEpKSA9PSAnXCIxOTY5LTEyLTMxVDIzOjU5OjU5Ljk5OVpcIic7XG4gICAgICAgICAgICB9IGNhdGNoIChleGNlcHRpb24pIHtcbiAgICAgICAgICAgICAgc3RyaW5naWZ5U3VwcG9ydGVkID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlzU3VwcG9ydGVkID0gc3RyaW5naWZ5U3VwcG9ydGVkO1xuICAgICAgICB9XG4gICAgICAgIC8vIFRlc3QgYEpTT04ucGFyc2VgLlxuICAgICAgICBpZiAobmFtZSA9PSBcImpzb24tcGFyc2VcIikge1xuICAgICAgICAgIHZhciBwYXJzZSA9IGV4cG9ydHMucGFyc2U7XG4gICAgICAgICAgaWYgKHR5cGVvZiBwYXJzZSA9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIC8vIEZGIDMuMWIxLCBiMiB3aWxsIHRocm93IGFuIGV4Y2VwdGlvbiBpZiBhIGJhcmUgbGl0ZXJhbCBpcyBwcm92aWRlZC5cbiAgICAgICAgICAgICAgLy8gQ29uZm9ybWluZyBpbXBsZW1lbnRhdGlvbnMgc2hvdWxkIGFsc28gY29lcmNlIHRoZSBpbml0aWFsIGFyZ3VtZW50IHRvXG4gICAgICAgICAgICAgIC8vIGEgc3RyaW5nIHByaW9yIHRvIHBhcnNpbmcuXG4gICAgICAgICAgICAgIGlmIChwYXJzZShcIjBcIikgPT09IDAgJiYgIXBhcnNlKGZhbHNlKSkge1xuICAgICAgICAgICAgICAgIC8vIFNpbXBsZSBwYXJzaW5nIHRlc3QuXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBwYXJzZShzZXJpYWxpemVkKTtcbiAgICAgICAgICAgICAgICB2YXIgcGFyc2VTdXBwb3J0ZWQgPSB2YWx1ZVtcImFcIl0ubGVuZ3RoID09IDUgJiYgdmFsdWVbXCJhXCJdWzBdID09PSAxO1xuICAgICAgICAgICAgICAgIGlmIChwYXJzZVN1cHBvcnRlZCkge1xuICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgLy8gU2FmYXJpIDw9IDUuMS4yIGFuZCBGRiAzLjFiMSBhbGxvdyB1bmVzY2FwZWQgdGFicyBpbiBzdHJpbmdzLlxuICAgICAgICAgICAgICAgICAgICBwYXJzZVN1cHBvcnRlZCA9ICFwYXJzZSgnXCJcXHRcIicpO1xuICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7fVxuICAgICAgICAgICAgICAgICAgaWYgKHBhcnNlU3VwcG9ydGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgLy8gRkYgNC4wIGFuZCA0LjAuMSBhbGxvdyBsZWFkaW5nIGArYCBzaWducyBhbmQgbGVhZGluZ1xuICAgICAgICAgICAgICAgICAgICAgIC8vIGRlY2ltYWwgcG9pbnRzLiBGRiA0LjAsIDQuMC4xLCBhbmQgSUUgOS0xMCBhbHNvIGFsbG93XG4gICAgICAgICAgICAgICAgICAgICAgLy8gY2VydGFpbiBvY3RhbCBsaXRlcmFscy5cbiAgICAgICAgICAgICAgICAgICAgICBwYXJzZVN1cHBvcnRlZCA9IHBhcnNlKFwiMDFcIikgIT09IDE7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge31cbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIGlmIChwYXJzZVN1cHBvcnRlZCkge1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgIC8vIEZGIDQuMCwgNC4wLjEsIGFuZCBSaGlubyAxLjdSMy1SNCBhbGxvdyB0cmFpbGluZyBkZWNpbWFsXG4gICAgICAgICAgICAgICAgICAgICAgLy8gcG9pbnRzLiBUaGVzZSBlbnZpcm9ubWVudHMsIGFsb25nIHdpdGggRkYgMy4xYjEgYW5kIDIsXG4gICAgICAgICAgICAgICAgICAgICAgLy8gYWxzbyBhbGxvdyB0cmFpbGluZyBjb21tYXMgaW4gSlNPTiBvYmplY3RzIGFuZCBhcnJheXMuXG4gICAgICAgICAgICAgICAgICAgICAgcGFyc2VTdXBwb3J0ZWQgPSBwYXJzZShcIjEuXCIpICE9PSAxO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChleGNlcHRpb24pIHt9XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIChleGNlcHRpb24pIHtcbiAgICAgICAgICAgICAgcGFyc2VTdXBwb3J0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaXNTdXBwb3J0ZWQgPSBwYXJzZVN1cHBvcnRlZDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGhhc1tuYW1lXSA9ICEhaXNTdXBwb3J0ZWQ7XG4gICAgfVxuXG4gICAgaWYgKCFoYXMoXCJqc29uXCIpKSB7XG4gICAgICAvLyBDb21tb24gYFtbQ2xhc3NdXWAgbmFtZSBhbGlhc2VzLlxuICAgICAgdmFyIGZ1bmN0aW9uQ2xhc3MgPSBcIltvYmplY3QgRnVuY3Rpb25dXCIsXG4gICAgICAgICAgZGF0ZUNsYXNzID0gXCJbb2JqZWN0IERhdGVdXCIsXG4gICAgICAgICAgbnVtYmVyQ2xhc3MgPSBcIltvYmplY3QgTnVtYmVyXVwiLFxuICAgICAgICAgIHN0cmluZ0NsYXNzID0gXCJbb2JqZWN0IFN0cmluZ11cIixcbiAgICAgICAgICBhcnJheUNsYXNzID0gXCJbb2JqZWN0IEFycmF5XVwiLFxuICAgICAgICAgIGJvb2xlYW5DbGFzcyA9IFwiW29iamVjdCBCb29sZWFuXVwiO1xuXG4gICAgICAvLyBEZXRlY3QgaW5jb21wbGV0ZSBzdXBwb3J0IGZvciBhY2Nlc3Npbmcgc3RyaW5nIGNoYXJhY3RlcnMgYnkgaW5kZXguXG4gICAgICB2YXIgY2hhckluZGV4QnVnZ3kgPSBoYXMoXCJidWctc3RyaW5nLWNoYXItaW5kZXhcIik7XG5cbiAgICAgIC8vIERlZmluZSBhZGRpdGlvbmFsIHV0aWxpdHkgbWV0aG9kcyBpZiB0aGUgYERhdGVgIG1ldGhvZHMgYXJlIGJ1Z2d5LlxuICAgICAgaWYgKCFpc0V4dGVuZGVkKSB7XG4gICAgICAgIHZhciBmbG9vciA9IE1hdGguZmxvb3I7XG4gICAgICAgIC8vIEEgbWFwcGluZyBiZXR3ZWVuIHRoZSBtb250aHMgb2YgdGhlIHllYXIgYW5kIHRoZSBudW1iZXIgb2YgZGF5cyBiZXR3ZWVuXG4gICAgICAgIC8vIEphbnVhcnkgMXN0IGFuZCB0aGUgZmlyc3Qgb2YgdGhlIHJlc3BlY3RpdmUgbW9udGguXG4gICAgICAgIHZhciBNb250aHMgPSBbMCwgMzEsIDU5LCA5MCwgMTIwLCAxNTEsIDE4MSwgMjEyLCAyNDMsIDI3MywgMzA0LCAzMzRdO1xuICAgICAgICAvLyBJbnRlcm5hbDogQ2FsY3VsYXRlcyB0aGUgbnVtYmVyIG9mIGRheXMgYmV0d2VlbiB0aGUgVW5peCBlcG9jaCBhbmQgdGhlXG4gICAgICAgIC8vIGZpcnN0IGRheSBvZiB0aGUgZ2l2ZW4gbW9udGguXG4gICAgICAgIHZhciBnZXREYXkgPSBmdW5jdGlvbiAoeWVhciwgbW9udGgpIHtcbiAgICAgICAgICByZXR1cm4gTW9udGhzW21vbnRoXSArIDM2NSAqICh5ZWFyIC0gMTk3MCkgKyBmbG9vcigoeWVhciAtIDE5NjkgKyAobW9udGggPSArKG1vbnRoID4gMSkpKSAvIDQpIC0gZmxvb3IoKHllYXIgLSAxOTAxICsgbW9udGgpIC8gMTAwKSArIGZsb29yKCh5ZWFyIC0gMTYwMSArIG1vbnRoKSAvIDQwMCk7XG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIC8vIEludGVybmFsOiBEZXRlcm1pbmVzIGlmIGEgcHJvcGVydHkgaXMgYSBkaXJlY3QgcHJvcGVydHkgb2YgdGhlIGdpdmVuXG4gICAgICAvLyBvYmplY3QuIERlbGVnYXRlcyB0byB0aGUgbmF0aXZlIGBPYmplY3QjaGFzT3duUHJvcGVydHlgIG1ldGhvZC5cbiAgICAgIGlmICghKGlzUHJvcGVydHkgPSBvYmplY3RQcm90by5oYXNPd25Qcm9wZXJ0eSkpIHtcbiAgICAgICAgaXNQcm9wZXJ0eSA9IGZ1bmN0aW9uIChwcm9wZXJ0eSkge1xuICAgICAgICAgIHZhciBtZW1iZXJzID0ge30sIGNvbnN0cnVjdG9yO1xuICAgICAgICAgIGlmICgobWVtYmVycy5fX3Byb3RvX18gPSBudWxsLCBtZW1iZXJzLl9fcHJvdG9fXyA9IHtcbiAgICAgICAgICAgIC8vIFRoZSAqcHJvdG8qIHByb3BlcnR5IGNhbm5vdCBiZSBzZXQgbXVsdGlwbGUgdGltZXMgaW4gcmVjZW50XG4gICAgICAgICAgICAvLyB2ZXJzaW9ucyBvZiBGaXJlZm94IGFuZCBTZWFNb25rZXkuXG4gICAgICAgICAgICBcInRvU3RyaW5nXCI6IDFcbiAgICAgICAgICB9LCBtZW1iZXJzKS50b1N0cmluZyAhPSBnZXRDbGFzcykge1xuICAgICAgICAgICAgLy8gU2FmYXJpIDw9IDIuMC4zIGRvZXNuJ3QgaW1wbGVtZW50IGBPYmplY3QjaGFzT3duUHJvcGVydHlgLCBidXRcbiAgICAgICAgICAgIC8vIHN1cHBvcnRzIHRoZSBtdXRhYmxlICpwcm90byogcHJvcGVydHkuXG4gICAgICAgICAgICBpc1Byb3BlcnR5ID0gZnVuY3Rpb24gKHByb3BlcnR5KSB7XG4gICAgICAgICAgICAgIC8vIENhcHR1cmUgYW5kIGJyZWFrIHRoZSBvYmplY3RncyBwcm90b3R5cGUgY2hhaW4gKHNlZSBzZWN0aW9uIDguNi4yXG4gICAgICAgICAgICAgIC8vIG9mIHRoZSBFUyA1LjEgc3BlYykuIFRoZSBwYXJlbnRoZXNpemVkIGV4cHJlc3Npb24gcHJldmVudHMgYW5cbiAgICAgICAgICAgICAgLy8gdW5zYWZlIHRyYW5zZm9ybWF0aW9uIGJ5IHRoZSBDbG9zdXJlIENvbXBpbGVyLlxuICAgICAgICAgICAgICB2YXIgb3JpZ2luYWwgPSB0aGlzLl9fcHJvdG9fXywgcmVzdWx0ID0gcHJvcGVydHkgaW4gKHRoaXMuX19wcm90b19fID0gbnVsbCwgdGhpcyk7XG4gICAgICAgICAgICAgIC8vIFJlc3RvcmUgdGhlIG9yaWdpbmFsIHByb3RvdHlwZSBjaGFpbi5cbiAgICAgICAgICAgICAgdGhpcy5fX3Byb3RvX18gPSBvcmlnaW5hbDtcbiAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIENhcHR1cmUgYSByZWZlcmVuY2UgdG8gdGhlIHRvcC1sZXZlbCBgT2JqZWN0YCBjb25zdHJ1Y3Rvci5cbiAgICAgICAgICAgIGNvbnN0cnVjdG9yID0gbWVtYmVycy5jb25zdHJ1Y3RvcjtcbiAgICAgICAgICAgIC8vIFVzZSB0aGUgYGNvbnN0cnVjdG9yYCBwcm9wZXJ0eSB0byBzaW11bGF0ZSBgT2JqZWN0I2hhc093blByb3BlcnR5YCBpblxuICAgICAgICAgICAgLy8gb3RoZXIgZW52aXJvbm1lbnRzLlxuICAgICAgICAgICAgaXNQcm9wZXJ0eSA9IGZ1bmN0aW9uIChwcm9wZXJ0eSkge1xuICAgICAgICAgICAgICB2YXIgcGFyZW50ID0gKHRoaXMuY29uc3RydWN0b3IgfHwgY29uc3RydWN0b3IpLnByb3RvdHlwZTtcbiAgICAgICAgICAgICAgcmV0dXJuIHByb3BlcnR5IGluIHRoaXMgJiYgIShwcm9wZXJ0eSBpbiBwYXJlbnQgJiYgdGhpc1twcm9wZXJ0eV0gPT09IHBhcmVudFtwcm9wZXJ0eV0pO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9XG4gICAgICAgICAgbWVtYmVycyA9IG51bGw7XG4gICAgICAgICAgcmV0dXJuIGlzUHJvcGVydHkuY2FsbCh0aGlzLCBwcm9wZXJ0eSk7XG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIC8vIEludGVybmFsOiBBIHNldCBvZiBwcmltaXRpdmUgdHlwZXMgdXNlZCBieSBgaXNIb3N0VHlwZWAuXG4gICAgICB2YXIgUHJpbWl0aXZlVHlwZXMgPSB7XG4gICAgICAgIFwiYm9vbGVhblwiOiAxLFxuICAgICAgICBcIm51bWJlclwiOiAxLFxuICAgICAgICBcInN0cmluZ1wiOiAxLFxuICAgICAgICBcInVuZGVmaW5lZFwiOiAxXG4gICAgICB9O1xuXG4gICAgICAvLyBJbnRlcm5hbDogRGV0ZXJtaW5lcyBpZiB0aGUgZ2l2ZW4gb2JqZWN0IGBwcm9wZXJ0eWAgdmFsdWUgaXMgYVxuICAgICAgLy8gbm9uLXByaW1pdGl2ZS5cbiAgICAgIHZhciBpc0hvc3RUeXBlID0gZnVuY3Rpb24gKG9iamVjdCwgcHJvcGVydHkpIHtcbiAgICAgICAgdmFyIHR5cGUgPSB0eXBlb2Ygb2JqZWN0W3Byb3BlcnR5XTtcbiAgICAgICAgcmV0dXJuIHR5cGUgPT0gXCJvYmplY3RcIiA/ICEhb2JqZWN0W3Byb3BlcnR5XSA6ICFQcmltaXRpdmVUeXBlc1t0eXBlXTtcbiAgICAgIH07XG5cbiAgICAgIC8vIEludGVybmFsOiBOb3JtYWxpemVzIHRoZSBgZm9yLi4uaW5gIGl0ZXJhdGlvbiBhbGdvcml0aG0gYWNyb3NzXG4gICAgICAvLyBlbnZpcm9ubWVudHMuIEVhY2ggZW51bWVyYXRlZCBrZXkgaXMgeWllbGRlZCB0byBhIGBjYWxsYmFja2AgZnVuY3Rpb24uXG4gICAgICBmb3JFYWNoID0gZnVuY3Rpb24gKG9iamVjdCwgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIHNpemUgPSAwLCBQcm9wZXJ0aWVzLCBtZW1iZXJzLCBwcm9wZXJ0eTtcblxuICAgICAgICAvLyBUZXN0cyBmb3IgYnVncyBpbiB0aGUgY3VycmVudCBlbnZpcm9ubWVudCdzIGBmb3IuLi5pbmAgYWxnb3JpdGhtLiBUaGVcbiAgICAgICAgLy8gYHZhbHVlT2ZgIHByb3BlcnR5IGluaGVyaXRzIHRoZSBub24tZW51bWVyYWJsZSBmbGFnIGZyb21cbiAgICAgICAgLy8gYE9iamVjdC5wcm90b3R5cGVgIGluIG9sZGVyIHZlcnNpb25zIG9mIElFLCBOZXRzY2FwZSwgYW5kIE1vemlsbGEuXG4gICAgICAgIChQcm9wZXJ0aWVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHRoaXMudmFsdWVPZiA9IDA7XG4gICAgICAgIH0pLnByb3RvdHlwZS52YWx1ZU9mID0gMDtcblxuICAgICAgICAvLyBJdGVyYXRlIG92ZXIgYSBuZXcgaW5zdGFuY2Ugb2YgdGhlIGBQcm9wZXJ0aWVzYCBjbGFzcy5cbiAgICAgICAgbWVtYmVycyA9IG5ldyBQcm9wZXJ0aWVzKCk7XG4gICAgICAgIGZvciAocHJvcGVydHkgaW4gbWVtYmVycykge1xuICAgICAgICAgIC8vIElnbm9yZSBhbGwgcHJvcGVydGllcyBpbmhlcml0ZWQgZnJvbSBgT2JqZWN0LnByb3RvdHlwZWAuXG4gICAgICAgICAgaWYgKGlzUHJvcGVydHkuY2FsbChtZW1iZXJzLCBwcm9wZXJ0eSkpIHtcbiAgICAgICAgICAgIHNpemUrKztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgUHJvcGVydGllcyA9IG1lbWJlcnMgPSBudWxsO1xuXG4gICAgICAgIC8vIE5vcm1hbGl6ZSB0aGUgaXRlcmF0aW9uIGFsZ29yaXRobS5cbiAgICAgICAgaWYgKCFzaXplKSB7XG4gICAgICAgICAgLy8gQSBsaXN0IG9mIG5vbi1lbnVtZXJhYmxlIHByb3BlcnRpZXMgaW5oZXJpdGVkIGZyb20gYE9iamVjdC5wcm90b3R5cGVgLlxuICAgICAgICAgIG1lbWJlcnMgPSBbXCJ2YWx1ZU9mXCIsIFwidG9TdHJpbmdcIiwgXCJ0b0xvY2FsZVN0cmluZ1wiLCBcInByb3BlcnR5SXNFbnVtZXJhYmxlXCIsIFwiaXNQcm90b3R5cGVPZlwiLCBcImhhc093blByb3BlcnR5XCIsIFwiY29uc3RydWN0b3JcIl07XG4gICAgICAgICAgLy8gSUUgPD0gOCwgTW96aWxsYSAxLjAsIGFuZCBOZXRzY2FwZSA2LjIgaWdub3JlIHNoYWRvd2VkIG5vbi1lbnVtZXJhYmxlXG4gICAgICAgICAgLy8gcHJvcGVydGllcy5cbiAgICAgICAgICBmb3JFYWNoID0gZnVuY3Rpb24gKG9iamVjdCwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHZhciBpc0Z1bmN0aW9uID0gZ2V0Q2xhc3MuY2FsbChvYmplY3QpID09IGZ1bmN0aW9uQ2xhc3MsIHByb3BlcnR5LCBsZW5ndGg7XG4gICAgICAgICAgICB2YXIgaGFzUHJvcGVydHkgPSAhaXNGdW5jdGlvbiAmJiB0eXBlb2Ygb2JqZWN0LmNvbnN0cnVjdG9yICE9IFwiZnVuY3Rpb25cIiAmJiBpc0hvc3RUeXBlKG9iamVjdCwgXCJoYXNPd25Qcm9wZXJ0eVwiKSA/IG9iamVjdC5oYXNPd25Qcm9wZXJ0eSA6IGlzUHJvcGVydHk7XG4gICAgICAgICAgICBmb3IgKHByb3BlcnR5IGluIG9iamVjdCkge1xuICAgICAgICAgICAgICAvLyBHZWNrbyA8PSAxLjAgZW51bWVyYXRlcyB0aGUgYHByb3RvdHlwZWAgcHJvcGVydHkgb2YgZnVuY3Rpb25zIHVuZGVyXG4gICAgICAgICAgICAgIC8vIGNlcnRhaW4gY29uZGl0aW9uczsgSUUgZG9lcyBub3QuXG4gICAgICAgICAgICAgIGlmICghKGlzRnVuY3Rpb24gJiYgcHJvcGVydHkgPT0gXCJwcm90b3R5cGVcIikgJiYgaGFzUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3BlcnR5KSkge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKHByb3BlcnR5KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gTWFudWFsbHkgaW52b2tlIHRoZSBjYWxsYmFjayBmb3IgZWFjaCBub24tZW51bWVyYWJsZSBwcm9wZXJ0eS5cbiAgICAgICAgICAgIGZvciAobGVuZ3RoID0gbWVtYmVycy5sZW5ndGg7IHByb3BlcnR5ID0gbWVtYmVyc1stLWxlbmd0aF07IGhhc1Byb3BlcnR5LmNhbGwob2JqZWN0LCBwcm9wZXJ0eSkgJiYgY2FsbGJhY2socHJvcGVydHkpKTtcbiAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2UgaWYgKHNpemUgPT0gMikge1xuICAgICAgICAgIC8vIFNhZmFyaSA8PSAyLjAuNCBlbnVtZXJhdGVzIHNoYWRvd2VkIHByb3BlcnRpZXMgdHdpY2UuXG4gICAgICAgICAgZm9yRWFjaCA9IGZ1bmN0aW9uIChvYmplY3QsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAvLyBDcmVhdGUgYSBzZXQgb2YgaXRlcmF0ZWQgcHJvcGVydGllcy5cbiAgICAgICAgICAgIHZhciBtZW1iZXJzID0ge30sIGlzRnVuY3Rpb24gPSBnZXRDbGFzcy5jYWxsKG9iamVjdCkgPT0gZnVuY3Rpb25DbGFzcywgcHJvcGVydHk7XG4gICAgICAgICAgICBmb3IgKHByb3BlcnR5IGluIG9iamVjdCkge1xuICAgICAgICAgICAgICAvLyBTdG9yZSBlYWNoIHByb3BlcnR5IG5hbWUgdG8gcHJldmVudCBkb3VibGUgZW51bWVyYXRpb24uIFRoZVxuICAgICAgICAgICAgICAvLyBgcHJvdG90eXBlYCBwcm9wZXJ0eSBvZiBmdW5jdGlvbnMgaXMgbm90IGVudW1lcmF0ZWQgZHVlIHRvIGNyb3NzLVxuICAgICAgICAgICAgICAvLyBlbnZpcm9ubWVudCBpbmNvbnNpc3RlbmNpZXMuXG4gICAgICAgICAgICAgIGlmICghKGlzRnVuY3Rpb24gJiYgcHJvcGVydHkgPT0gXCJwcm90b3R5cGVcIikgJiYgIWlzUHJvcGVydHkuY2FsbChtZW1iZXJzLCBwcm9wZXJ0eSkgJiYgKG1lbWJlcnNbcHJvcGVydHldID0gMSkgJiYgaXNQcm9wZXJ0eS5jYWxsKG9iamVjdCwgcHJvcGVydHkpKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2socHJvcGVydHkpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBObyBidWdzIGRldGVjdGVkOyB1c2UgdGhlIHN0YW5kYXJkIGBmb3IuLi5pbmAgYWxnb3JpdGhtLlxuICAgICAgICAgIGZvckVhY2ggPSBmdW5jdGlvbiAob2JqZWN0LCBjYWxsYmFjaykge1xuICAgICAgICAgICAgdmFyIGlzRnVuY3Rpb24gPSBnZXRDbGFzcy5jYWxsKG9iamVjdCkgPT0gZnVuY3Rpb25DbGFzcywgcHJvcGVydHksIGlzQ29uc3RydWN0b3I7XG4gICAgICAgICAgICBmb3IgKHByb3BlcnR5IGluIG9iamVjdCkge1xuICAgICAgICAgICAgICBpZiAoIShpc0Z1bmN0aW9uICYmIHByb3BlcnR5ID09IFwicHJvdG90eXBlXCIpICYmIGlzUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3BlcnR5KSAmJiAhKGlzQ29uc3RydWN0b3IgPSBwcm9wZXJ0eSA9PT0gXCJjb25zdHJ1Y3RvclwiKSkge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKHByb3BlcnR5KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gTWFudWFsbHkgaW52b2tlIHRoZSBjYWxsYmFjayBmb3IgdGhlIGBjb25zdHJ1Y3RvcmAgcHJvcGVydHkgZHVlIHRvXG4gICAgICAgICAgICAvLyBjcm9zcy1lbnZpcm9ubWVudCBpbmNvbnNpc3RlbmNpZXMuXG4gICAgICAgICAgICBpZiAoaXNDb25zdHJ1Y3RvciB8fCBpc1Byb3BlcnR5LmNhbGwob2JqZWN0LCAocHJvcGVydHkgPSBcImNvbnN0cnVjdG9yXCIpKSkge1xuICAgICAgICAgICAgICBjYWxsYmFjayhwcm9wZXJ0eSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZm9yRWFjaChvYmplY3QsIGNhbGxiYWNrKTtcbiAgICAgIH07XG5cbiAgICAgIC8vIFB1YmxpYzogU2VyaWFsaXplcyBhIEphdmFTY3JpcHQgYHZhbHVlYCBhcyBhIEpTT04gc3RyaW5nLiBUaGUgb3B0aW9uYWxcbiAgICAgIC8vIGBmaWx0ZXJgIGFyZ3VtZW50IG1heSBzcGVjaWZ5IGVpdGhlciBhIGZ1bmN0aW9uIHRoYXQgYWx0ZXJzIGhvdyBvYmplY3QgYW5kXG4gICAgICAvLyBhcnJheSBtZW1iZXJzIGFyZSBzZXJpYWxpemVkLCBvciBhbiBhcnJheSBvZiBzdHJpbmdzIGFuZCBudW1iZXJzIHRoYXRcbiAgICAgIC8vIGluZGljYXRlcyB3aGljaCBwcm9wZXJ0aWVzIHNob3VsZCBiZSBzZXJpYWxpemVkLiBUaGUgb3B0aW9uYWwgYHdpZHRoYFxuICAgICAgLy8gYXJndW1lbnQgbWF5IGJlIGVpdGhlciBhIHN0cmluZyBvciBudW1iZXIgdGhhdCBzcGVjaWZpZXMgdGhlIGluZGVudGF0aW9uXG4gICAgICAvLyBsZXZlbCBvZiB0aGUgb3V0cHV0LlxuICAgICAgaWYgKCFoYXMoXCJqc29uLXN0cmluZ2lmeVwiKSkge1xuICAgICAgICAvLyBJbnRlcm5hbDogQSBtYXAgb2YgY29udHJvbCBjaGFyYWN0ZXJzIGFuZCB0aGVpciBlc2NhcGVkIGVxdWl2YWxlbnRzLlxuICAgICAgICB2YXIgRXNjYXBlcyA9IHtcbiAgICAgICAgICA5MjogXCJcXFxcXFxcXFwiLFxuICAgICAgICAgIDM0OiAnXFxcXFwiJyxcbiAgICAgICAgICA4OiBcIlxcXFxiXCIsXG4gICAgICAgICAgMTI6IFwiXFxcXGZcIixcbiAgICAgICAgICAxMDogXCJcXFxcblwiLFxuICAgICAgICAgIDEzOiBcIlxcXFxyXCIsXG4gICAgICAgICAgOTogXCJcXFxcdFwiXG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gSW50ZXJuYWw6IENvbnZlcnRzIGB2YWx1ZWAgaW50byBhIHplcm8tcGFkZGVkIHN0cmluZyBzdWNoIHRoYXQgaXRzXG4gICAgICAgIC8vIGxlbmd0aCBpcyBhdCBsZWFzdCBlcXVhbCB0byBgd2lkdGhgLiBUaGUgYHdpZHRoYCBtdXN0IGJlIDw9IDYuXG4gICAgICAgIHZhciBsZWFkaW5nWmVyb2VzID0gXCIwMDAwMDBcIjtcbiAgICAgICAgdmFyIHRvUGFkZGVkU3RyaW5nID0gZnVuY3Rpb24gKHdpZHRoLCB2YWx1ZSkge1xuICAgICAgICAgIC8vIFRoZSBgfHwgMGAgZXhwcmVzc2lvbiBpcyBuZWNlc3NhcnkgdG8gd29yayBhcm91bmQgYSBidWcgaW5cbiAgICAgICAgICAvLyBPcGVyYSA8PSA3LjU0dTIgd2hlcmUgYDAgPT0gLTBgLCBidXQgYFN0cmluZygtMCkgIT09IFwiMFwiYC5cbiAgICAgICAgICByZXR1cm4gKGxlYWRpbmdaZXJvZXMgKyAodmFsdWUgfHwgMCkpLnNsaWNlKC13aWR0aCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gSW50ZXJuYWw6IERvdWJsZS1xdW90ZXMgYSBzdHJpbmcgYHZhbHVlYCwgcmVwbGFjaW5nIGFsbCBBU0NJSSBjb250cm9sXG4gICAgICAgIC8vIGNoYXJhY3RlcnMgKGNoYXJhY3RlcnMgd2l0aCBjb2RlIHVuaXQgdmFsdWVzIGJldHdlZW4gMCBhbmQgMzEpIHdpdGhcbiAgICAgICAgLy8gdGhlaXIgZXNjYXBlZCBlcXVpdmFsZW50cy4gVGhpcyBpcyBhbiBpbXBsZW1lbnRhdGlvbiBvZiB0aGVcbiAgICAgICAgLy8gYFF1b3RlKHZhbHVlKWAgb3BlcmF0aW9uIGRlZmluZWQgaW4gRVMgNS4xIHNlY3Rpb24gMTUuMTIuMy5cbiAgICAgICAgdmFyIHVuaWNvZGVQcmVmaXggPSBcIlxcXFx1MDBcIjtcbiAgICAgICAgdmFyIHF1b3RlID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgdmFyIHJlc3VsdCA9ICdcIicsIGluZGV4ID0gMCwgbGVuZ3RoID0gdmFsdWUubGVuZ3RoLCB1c2VDaGFySW5kZXggPSAhY2hhckluZGV4QnVnZ3kgfHwgbGVuZ3RoID4gMTA7XG4gICAgICAgICAgdmFyIHN5bWJvbHMgPSB1c2VDaGFySW5kZXggJiYgKGNoYXJJbmRleEJ1Z2d5ID8gdmFsdWUuc3BsaXQoXCJcIikgOiB2YWx1ZSk7XG4gICAgICAgICAgZm9yICg7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgICAgICB2YXIgY2hhckNvZGUgPSB2YWx1ZS5jaGFyQ29kZUF0KGluZGV4KTtcbiAgICAgICAgICAgIC8vIElmIHRoZSBjaGFyYWN0ZXIgaXMgYSBjb250cm9sIGNoYXJhY3RlciwgYXBwZW5kIGl0cyBVbmljb2RlIG9yXG4gICAgICAgICAgICAvLyBzaG9ydGhhbmQgZXNjYXBlIHNlcXVlbmNlOyBvdGhlcndpc2UsIGFwcGVuZCB0aGUgY2hhcmFjdGVyIGFzLWlzLlxuICAgICAgICAgICAgc3dpdGNoIChjaGFyQ29kZSkge1xuICAgICAgICAgICAgICBjYXNlIDg6IGNhc2UgOTogY2FzZSAxMDogY2FzZSAxMjogY2FzZSAxMzogY2FzZSAzNDogY2FzZSA5MjpcbiAgICAgICAgICAgICAgICByZXN1bHQgKz0gRXNjYXBlc1tjaGFyQ29kZV07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgaWYgKGNoYXJDb2RlIDwgMzIpIHtcbiAgICAgICAgICAgICAgICAgIHJlc3VsdCArPSB1bmljb2RlUHJlZml4ICsgdG9QYWRkZWRTdHJpbmcoMiwgY2hhckNvZGUudG9TdHJpbmcoMTYpKTtcbiAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXN1bHQgKz0gdXNlQ2hhckluZGV4ID8gc3ltYm9sc1tpbmRleF0gOiB2YWx1ZS5jaGFyQXQoaW5kZXgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcmVzdWx0ICsgJ1wiJztcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBJbnRlcm5hbDogUmVjdXJzaXZlbHkgc2VyaWFsaXplcyBhbiBvYmplY3QuIEltcGxlbWVudHMgdGhlXG4gICAgICAgIC8vIGBTdHIoa2V5LCBob2xkZXIpYCwgYEpPKHZhbHVlKWAsIGFuZCBgSkEodmFsdWUpYCBvcGVyYXRpb25zLlxuICAgICAgICB2YXIgc2VyaWFsaXplID0gZnVuY3Rpb24gKHByb3BlcnR5LCBvYmplY3QsIGNhbGxiYWNrLCBwcm9wZXJ0aWVzLCB3aGl0ZXNwYWNlLCBpbmRlbnRhdGlvbiwgc3RhY2spIHtcbiAgICAgICAgICB2YXIgdmFsdWUsIGNsYXNzTmFtZSwgeWVhciwgbW9udGgsIGRhdGUsIHRpbWUsIGhvdXJzLCBtaW51dGVzLCBzZWNvbmRzLCBtaWxsaXNlY29uZHMsIHJlc3VsdHMsIGVsZW1lbnQsIGluZGV4LCBsZW5ndGgsIHByZWZpeCwgcmVzdWx0O1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBOZWNlc3NhcnkgZm9yIGhvc3Qgb2JqZWN0IHN1cHBvcnQuXG4gICAgICAgICAgICB2YWx1ZSA9IG9iamVjdFtwcm9wZXJ0eV07XG4gICAgICAgICAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7fVxuICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT0gXCJvYmplY3RcIiAmJiB2YWx1ZSkge1xuICAgICAgICAgICAgY2xhc3NOYW1lID0gZ2V0Q2xhc3MuY2FsbCh2YWx1ZSk7XG4gICAgICAgICAgICBpZiAoY2xhc3NOYW1lID09IGRhdGVDbGFzcyAmJiAhaXNQcm9wZXJ0eS5jYWxsKHZhbHVlLCBcInRvSlNPTlwiKSkge1xuICAgICAgICAgICAgICBpZiAodmFsdWUgPiAtMSAvIDAgJiYgdmFsdWUgPCAxIC8gMCkge1xuICAgICAgICAgICAgICAgIC8vIERhdGVzIGFyZSBzZXJpYWxpemVkIGFjY29yZGluZyB0byB0aGUgYERhdGUjdG9KU09OYCBtZXRob2RcbiAgICAgICAgICAgICAgICAvLyBzcGVjaWZpZWQgaW4gRVMgNS4xIHNlY3Rpb24gMTUuOS41LjQ0LiBTZWUgc2VjdGlvbiAxNS45LjEuMTVcbiAgICAgICAgICAgICAgICAvLyBmb3IgdGhlIElTTyA4NjAxIGRhdGUgdGltZSBzdHJpbmcgZm9ybWF0LlxuICAgICAgICAgICAgICAgIGlmIChnZXREYXkpIHtcbiAgICAgICAgICAgICAgICAgIC8vIE1hbnVhbGx5IGNvbXB1dGUgdGhlIHllYXIsIG1vbnRoLCBkYXRlLCBob3VycywgbWludXRlcyxcbiAgICAgICAgICAgICAgICAgIC8vIHNlY29uZHMsIGFuZCBtaWxsaXNlY29uZHMgaWYgdGhlIGBnZXRVVEMqYCBtZXRob2RzIGFyZVxuICAgICAgICAgICAgICAgICAgLy8gYnVnZ3kuIEFkYXB0ZWQgZnJvbSBAWWFmZmxlJ3MgYGRhdGUtc2hpbWAgcHJvamVjdC5cbiAgICAgICAgICAgICAgICAgIGRhdGUgPSBmbG9vcih2YWx1ZSAvIDg2NGU1KTtcbiAgICAgICAgICAgICAgICAgIGZvciAoeWVhciA9IGZsb29yKGRhdGUgLyAzNjUuMjQyNSkgKyAxOTcwIC0gMTsgZ2V0RGF5KHllYXIgKyAxLCAwKSA8PSBkYXRlOyB5ZWFyKyspO1xuICAgICAgICAgICAgICAgICAgZm9yIChtb250aCA9IGZsb29yKChkYXRlIC0gZ2V0RGF5KHllYXIsIDApKSAvIDMwLjQyKTsgZ2V0RGF5KHllYXIsIG1vbnRoICsgMSkgPD0gZGF0ZTsgbW9udGgrKyk7XG4gICAgICAgICAgICAgICAgICBkYXRlID0gMSArIGRhdGUgLSBnZXREYXkoeWVhciwgbW9udGgpO1xuICAgICAgICAgICAgICAgICAgLy8gVGhlIGB0aW1lYCB2YWx1ZSBzcGVjaWZpZXMgdGhlIHRpbWUgd2l0aGluIHRoZSBkYXkgKHNlZSBFU1xuICAgICAgICAgICAgICAgICAgLy8gNS4xIHNlY3Rpb24gMTUuOS4xLjIpLiBUaGUgZm9ybXVsYSBgKEEgJSBCICsgQikgJSBCYCBpcyB1c2VkXG4gICAgICAgICAgICAgICAgICAvLyB0byBjb21wdXRlIGBBIG1vZHVsbyBCYCwgYXMgdGhlIGAlYCBvcGVyYXRvciBkb2VzIG5vdFxuICAgICAgICAgICAgICAgICAgLy8gY29ycmVzcG9uZCB0byB0aGUgYG1vZHVsb2Agb3BlcmF0aW9uIGZvciBuZWdhdGl2ZSBudW1iZXJzLlxuICAgICAgICAgICAgICAgICAgdGltZSA9ICh2YWx1ZSAlIDg2NGU1ICsgODY0ZTUpICUgODY0ZTU7XG4gICAgICAgICAgICAgICAgICAvLyBUaGUgaG91cnMsIG1pbnV0ZXMsIHNlY29uZHMsIGFuZCBtaWxsaXNlY29uZHMgYXJlIG9idGFpbmVkIGJ5XG4gICAgICAgICAgICAgICAgICAvLyBkZWNvbXBvc2luZyB0aGUgdGltZSB3aXRoaW4gdGhlIGRheS4gU2VlIHNlY3Rpb24gMTUuOS4xLjEwLlxuICAgICAgICAgICAgICAgICAgaG91cnMgPSBmbG9vcih0aW1lIC8gMzZlNSkgJSAyNDtcbiAgICAgICAgICAgICAgICAgIG1pbnV0ZXMgPSBmbG9vcih0aW1lIC8gNmU0KSAlIDYwO1xuICAgICAgICAgICAgICAgICAgc2Vjb25kcyA9IGZsb29yKHRpbWUgLyAxZTMpICUgNjA7XG4gICAgICAgICAgICAgICAgICBtaWxsaXNlY29uZHMgPSB0aW1lICUgMWUzO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICB5ZWFyID0gdmFsdWUuZ2V0VVRDRnVsbFllYXIoKTtcbiAgICAgICAgICAgICAgICAgIG1vbnRoID0gdmFsdWUuZ2V0VVRDTW9udGgoKTtcbiAgICAgICAgICAgICAgICAgIGRhdGUgPSB2YWx1ZS5nZXRVVENEYXRlKCk7XG4gICAgICAgICAgICAgICAgICBob3VycyA9IHZhbHVlLmdldFVUQ0hvdXJzKCk7XG4gICAgICAgICAgICAgICAgICBtaW51dGVzID0gdmFsdWUuZ2V0VVRDTWludXRlcygpO1xuICAgICAgICAgICAgICAgICAgc2Vjb25kcyA9IHZhbHVlLmdldFVUQ1NlY29uZHMoKTtcbiAgICAgICAgICAgICAgICAgIG1pbGxpc2Vjb25kcyA9IHZhbHVlLmdldFVUQ01pbGxpc2Vjb25kcygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBTZXJpYWxpemUgZXh0ZW5kZWQgeWVhcnMgY29ycmVjdGx5LlxuICAgICAgICAgICAgICAgIHZhbHVlID0gKHllYXIgPD0gMCB8fCB5ZWFyID49IDFlNCA/ICh5ZWFyIDwgMCA/IFwiLVwiIDogXCIrXCIpICsgdG9QYWRkZWRTdHJpbmcoNiwgeWVhciA8IDAgPyAteWVhciA6IHllYXIpIDogdG9QYWRkZWRTdHJpbmcoNCwgeWVhcikpICtcbiAgICAgICAgICAgICAgICAgIFwiLVwiICsgdG9QYWRkZWRTdHJpbmcoMiwgbW9udGggKyAxKSArIFwiLVwiICsgdG9QYWRkZWRTdHJpbmcoMiwgZGF0ZSkgK1xuICAgICAgICAgICAgICAgICAgLy8gTW9udGhzLCBkYXRlcywgaG91cnMsIG1pbnV0ZXMsIGFuZCBzZWNvbmRzIHNob3VsZCBoYXZlIHR3b1xuICAgICAgICAgICAgICAgICAgLy8gZGlnaXRzOyBtaWxsaXNlY29uZHMgc2hvdWxkIGhhdmUgdGhyZWUuXG4gICAgICAgICAgICAgICAgICBcIlRcIiArIHRvUGFkZGVkU3RyaW5nKDIsIGhvdXJzKSArIFwiOlwiICsgdG9QYWRkZWRTdHJpbmcoMiwgbWludXRlcykgKyBcIjpcIiArIHRvUGFkZGVkU3RyaW5nKDIsIHNlY29uZHMpICtcbiAgICAgICAgICAgICAgICAgIC8vIE1pbGxpc2Vjb25kcyBhcmUgb3B0aW9uYWwgaW4gRVMgNS4wLCBidXQgcmVxdWlyZWQgaW4gNS4xLlxuICAgICAgICAgICAgICAgICAgXCIuXCIgKyB0b1BhZGRlZFN0cmluZygzLCBtaWxsaXNlY29uZHMpICsgXCJaXCI7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSBudWxsO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiB2YWx1ZS50b0pTT04gPT0gXCJmdW5jdGlvblwiICYmICgoY2xhc3NOYW1lICE9IG51bWJlckNsYXNzICYmIGNsYXNzTmFtZSAhPSBzdHJpbmdDbGFzcyAmJiBjbGFzc05hbWUgIT0gYXJyYXlDbGFzcykgfHwgaXNQcm9wZXJ0eS5jYWxsKHZhbHVlLCBcInRvSlNPTlwiKSkpIHtcbiAgICAgICAgICAgICAgLy8gUHJvdG90eXBlIDw9IDEuNi4xIGFkZHMgbm9uLXN0YW5kYXJkIGB0b0pTT05gIG1ldGhvZHMgdG8gdGhlXG4gICAgICAgICAgICAgIC8vIGBOdW1iZXJgLCBgU3RyaW5nYCwgYERhdGVgLCBhbmQgYEFycmF5YCBwcm90b3R5cGVzLiBKU09OIDNcbiAgICAgICAgICAgICAgLy8gaWdub3JlcyBhbGwgYHRvSlNPTmAgbWV0aG9kcyBvbiB0aGVzZSBvYmplY3RzIHVubGVzcyB0aGV5IGFyZVxuICAgICAgICAgICAgICAvLyBkZWZpbmVkIGRpcmVjdGx5IG9uIGFuIGluc3RhbmNlLlxuICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLnRvSlNPTihwcm9wZXJ0eSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgICAgLy8gSWYgYSByZXBsYWNlbWVudCBmdW5jdGlvbiB3YXMgcHJvdmlkZWQsIGNhbGwgaXQgdG8gb2J0YWluIHRoZSB2YWx1ZVxuICAgICAgICAgICAgLy8gZm9yIHNlcmlhbGl6YXRpb24uXG4gICAgICAgICAgICB2YWx1ZSA9IGNhbGxiYWNrLmNhbGwob2JqZWN0LCBwcm9wZXJ0eSwgdmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAodmFsdWUgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBcIm51bGxcIjtcbiAgICAgICAgICB9XG4gICAgICAgICAgY2xhc3NOYW1lID0gZ2V0Q2xhc3MuY2FsbCh2YWx1ZSk7XG4gICAgICAgICAgaWYgKGNsYXNzTmFtZSA9PSBib29sZWFuQ2xhc3MpIHtcbiAgICAgICAgICAgIC8vIEJvb2xlYW5zIGFyZSByZXByZXNlbnRlZCBsaXRlcmFsbHkuXG4gICAgICAgICAgICByZXR1cm4gXCJcIiArIHZhbHVlO1xuICAgICAgICAgIH0gZWxzZSBpZiAoY2xhc3NOYW1lID09IG51bWJlckNsYXNzKSB7XG4gICAgICAgICAgICAvLyBKU09OIG51bWJlcnMgbXVzdCBiZSBmaW5pdGUuIGBJbmZpbml0eWAgYW5kIGBOYU5gIGFyZSBzZXJpYWxpemVkIGFzXG4gICAgICAgICAgICAvLyBgXCJudWxsXCJgLlxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlID4gLTEgLyAwICYmIHZhbHVlIDwgMSAvIDAgPyBcIlwiICsgdmFsdWUgOiBcIm51bGxcIjtcbiAgICAgICAgICB9IGVsc2UgaWYgKGNsYXNzTmFtZSA9PSBzdHJpbmdDbGFzcykge1xuICAgICAgICAgICAgLy8gU3RyaW5ncyBhcmUgZG91YmxlLXF1b3RlZCBhbmQgZXNjYXBlZC5cbiAgICAgICAgICAgIHJldHVybiBxdW90ZShcIlwiICsgdmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBSZWN1cnNpdmVseSBzZXJpYWxpemUgb2JqZWN0cyBhbmQgYXJyYXlzLlxuICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgLy8gQ2hlY2sgZm9yIGN5Y2xpYyBzdHJ1Y3R1cmVzLiBUaGlzIGlzIGEgbGluZWFyIHNlYXJjaDsgcGVyZm9ybWFuY2VcbiAgICAgICAgICAgIC8vIGlzIGludmVyc2VseSBwcm9wb3J0aW9uYWwgdG8gdGhlIG51bWJlciBvZiB1bmlxdWUgbmVzdGVkIG9iamVjdHMuXG4gICAgICAgICAgICBmb3IgKGxlbmd0aCA9IHN0YWNrLmxlbmd0aDsgbGVuZ3RoLS07KSB7XG4gICAgICAgICAgICAgIGlmIChzdGFja1tsZW5ndGhdID09PSB2YWx1ZSkge1xuICAgICAgICAgICAgICAgIC8vIEN5Y2xpYyBzdHJ1Y3R1cmVzIGNhbm5vdCBiZSBzZXJpYWxpemVkIGJ5IGBKU09OLnN0cmluZ2lmeWAuXG4gICAgICAgICAgICAgICAgdGhyb3cgVHlwZUVycm9yKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIEFkZCB0aGUgb2JqZWN0IHRvIHRoZSBzdGFjayBvZiB0cmF2ZXJzZWQgb2JqZWN0cy5cbiAgICAgICAgICAgIHN0YWNrLnB1c2godmFsdWUpO1xuICAgICAgICAgICAgcmVzdWx0cyA9IFtdO1xuICAgICAgICAgICAgLy8gU2F2ZSB0aGUgY3VycmVudCBpbmRlbnRhdGlvbiBsZXZlbCBhbmQgaW5kZW50IG9uZSBhZGRpdGlvbmFsIGxldmVsLlxuICAgICAgICAgICAgcHJlZml4ID0gaW5kZW50YXRpb247XG4gICAgICAgICAgICBpbmRlbnRhdGlvbiArPSB3aGl0ZXNwYWNlO1xuICAgICAgICAgICAgaWYgKGNsYXNzTmFtZSA9PSBhcnJheUNsYXNzKSB7XG4gICAgICAgICAgICAgIC8vIFJlY3Vyc2l2ZWx5IHNlcmlhbGl6ZSBhcnJheSBlbGVtZW50cy5cbiAgICAgICAgICAgICAgZm9yIChpbmRleCA9IDAsIGxlbmd0aCA9IHZhbHVlLmxlbmd0aDsgaW5kZXggPCBsZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50ID0gc2VyaWFsaXplKGluZGV4LCB2YWx1ZSwgY2FsbGJhY2ssIHByb3BlcnRpZXMsIHdoaXRlc3BhY2UsIGluZGVudGF0aW9uLCBzdGFjayk7XG4gICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKGVsZW1lbnQgPT09IHVuZGVmID8gXCJudWxsXCIgOiBlbGVtZW50KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXN1bHQgPSByZXN1bHRzLmxlbmd0aCA/ICh3aGl0ZXNwYWNlID8gXCJbXFxuXCIgKyBpbmRlbnRhdGlvbiArIHJlc3VsdHMuam9pbihcIixcXG5cIiArIGluZGVudGF0aW9uKSArIFwiXFxuXCIgKyBwcmVmaXggKyBcIl1cIiA6IChcIltcIiArIHJlc3VsdHMuam9pbihcIixcIikgKyBcIl1cIikpIDogXCJbXVwiO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgLy8gUmVjdXJzaXZlbHkgc2VyaWFsaXplIG9iamVjdCBtZW1iZXJzLiBNZW1iZXJzIGFyZSBzZWxlY3RlZCBmcm9tXG4gICAgICAgICAgICAgIC8vIGVpdGhlciBhIHVzZXItc3BlY2lmaWVkIGxpc3Qgb2YgcHJvcGVydHkgbmFtZXMsIG9yIHRoZSBvYmplY3RcbiAgICAgICAgICAgICAgLy8gaXRzZWxmLlxuICAgICAgICAgICAgICBmb3JFYWNoKHByb3BlcnRpZXMgfHwgdmFsdWUsIGZ1bmN0aW9uIChwcm9wZXJ0eSkge1xuICAgICAgICAgICAgICAgIHZhciBlbGVtZW50ID0gc2VyaWFsaXplKHByb3BlcnR5LCB2YWx1ZSwgY2FsbGJhY2ssIHByb3BlcnRpZXMsIHdoaXRlc3BhY2UsIGluZGVudGF0aW9uLCBzdGFjayk7XG4gICAgICAgICAgICAgICAgaWYgKGVsZW1lbnQgIT09IHVuZGVmKSB7XG4gICAgICAgICAgICAgICAgICAvLyBBY2NvcmRpbmcgdG8gRVMgNS4xIHNlY3Rpb24gMTUuMTIuMzogXCJJZiBgZ2FwYCB7d2hpdGVzcGFjZX1cbiAgICAgICAgICAgICAgICAgIC8vIGlzIG5vdCB0aGUgZW1wdHkgc3RyaW5nLCBsZXQgYG1lbWJlcmAge3F1b3RlKHByb3BlcnR5KSArIFwiOlwifVxuICAgICAgICAgICAgICAgICAgLy8gYmUgdGhlIGNvbmNhdGVuYXRpb24gb2YgYG1lbWJlcmAgYW5kIHRoZSBgc3BhY2VgIGNoYXJhY3Rlci5cIlxuICAgICAgICAgICAgICAgICAgLy8gVGhlIFwiYHNwYWNlYCBjaGFyYWN0ZXJcIiByZWZlcnMgdG8gdGhlIGxpdGVyYWwgc3BhY2VcbiAgICAgICAgICAgICAgICAgIC8vIGNoYXJhY3Rlciwgbm90IHRoZSBgc3BhY2VgIHt3aWR0aH0gYXJndW1lbnQgcHJvdmlkZWQgdG9cbiAgICAgICAgICAgICAgICAgIC8vIGBKU09OLnN0cmluZ2lmeWAuXG4gICAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2gocXVvdGUocHJvcGVydHkpICsgXCI6XCIgKyAod2hpdGVzcGFjZSA/IFwiIFwiIDogXCJcIikgKyBlbGVtZW50KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICByZXN1bHQgPSByZXN1bHRzLmxlbmd0aCA/ICh3aGl0ZXNwYWNlID8gXCJ7XFxuXCIgKyBpbmRlbnRhdGlvbiArIHJlc3VsdHMuam9pbihcIixcXG5cIiArIGluZGVudGF0aW9uKSArIFwiXFxuXCIgKyBwcmVmaXggKyBcIn1cIiA6IChcIntcIiArIHJlc3VsdHMuam9pbihcIixcIikgKyBcIn1cIikpIDogXCJ7fVwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gUmVtb3ZlIHRoZSBvYmplY3QgZnJvbSB0aGUgdHJhdmVyc2VkIG9iamVjdCBzdGFjay5cbiAgICAgICAgICAgIHN0YWNrLnBvcCgpO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gUHVibGljOiBgSlNPTi5zdHJpbmdpZnlgLiBTZWUgRVMgNS4xIHNlY3Rpb24gMTUuMTIuMy5cbiAgICAgICAgZXhwb3J0cy5zdHJpbmdpZnkgPSBmdW5jdGlvbiAoc291cmNlLCBmaWx0ZXIsIHdpZHRoKSB7XG4gICAgICAgICAgdmFyIHdoaXRlc3BhY2UsIGNhbGxiYWNrLCBwcm9wZXJ0aWVzLCBjbGFzc05hbWU7XG4gICAgICAgICAgaWYgKHR5cGVvZiBmaWx0ZXIgPT0gXCJmdW5jdGlvblwiIHx8IHR5cGVvZiBmaWx0ZXIgPT0gXCJvYmplY3RcIiAmJiBmaWx0ZXIpIHtcbiAgICAgICAgICAgIGlmICgoY2xhc3NOYW1lID0gZ2V0Q2xhc3MuY2FsbChmaWx0ZXIpKSA9PSBmdW5jdGlvbkNsYXNzKSB7XG4gICAgICAgICAgICAgIGNhbGxiYWNrID0gZmlsdGVyO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChjbGFzc05hbWUgPT0gYXJyYXlDbGFzcykge1xuICAgICAgICAgICAgICAvLyBDb252ZXJ0IHRoZSBwcm9wZXJ0eSBuYW1lcyBhcnJheSBpbnRvIGEgbWFrZXNoaWZ0IHNldC5cbiAgICAgICAgICAgICAgcHJvcGVydGllcyA9IHt9O1xuICAgICAgICAgICAgICBmb3IgKHZhciBpbmRleCA9IDAsIGxlbmd0aCA9IGZpbHRlci5sZW5ndGgsIHZhbHVlOyBpbmRleCA8IGxlbmd0aDsgdmFsdWUgPSBmaWx0ZXJbaW5kZXgrK10sICgoY2xhc3NOYW1lID0gZ2V0Q2xhc3MuY2FsbCh2YWx1ZSkpLCBjbGFzc05hbWUgPT0gc3RyaW5nQ2xhc3MgfHwgY2xhc3NOYW1lID09IG51bWJlckNsYXNzKSAmJiAocHJvcGVydGllc1t2YWx1ZV0gPSAxKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICh3aWR0aCkge1xuICAgICAgICAgICAgaWYgKChjbGFzc05hbWUgPSBnZXRDbGFzcy5jYWxsKHdpZHRoKSkgPT0gbnVtYmVyQ2xhc3MpIHtcbiAgICAgICAgICAgICAgLy8gQ29udmVydCB0aGUgYHdpZHRoYCB0byBhbiBpbnRlZ2VyIGFuZCBjcmVhdGUgYSBzdHJpbmcgY29udGFpbmluZ1xuICAgICAgICAgICAgICAvLyBgd2lkdGhgIG51bWJlciBvZiBzcGFjZSBjaGFyYWN0ZXJzLlxuICAgICAgICAgICAgICBpZiAoKHdpZHRoIC09IHdpZHRoICUgMSkgPiAwKSB7XG4gICAgICAgICAgICAgICAgZm9yICh3aGl0ZXNwYWNlID0gXCJcIiwgd2lkdGggPiAxMCAmJiAod2lkdGggPSAxMCk7IHdoaXRlc3BhY2UubGVuZ3RoIDwgd2lkdGg7IHdoaXRlc3BhY2UgKz0gXCIgXCIpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNsYXNzTmFtZSA9PSBzdHJpbmdDbGFzcykge1xuICAgICAgICAgICAgICB3aGl0ZXNwYWNlID0gd2lkdGgubGVuZ3RoIDw9IDEwID8gd2lkdGggOiB3aWR0aC5zbGljZSgwLCAxMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIE9wZXJhIDw9IDcuNTR1MiBkaXNjYXJkcyB0aGUgdmFsdWVzIGFzc29jaWF0ZWQgd2l0aCBlbXB0eSBzdHJpbmcga2V5c1xuICAgICAgICAgIC8vIChgXCJcImApIG9ubHkgaWYgdGhleSBhcmUgdXNlZCBkaXJlY3RseSB3aXRoaW4gYW4gb2JqZWN0IG1lbWJlciBsaXN0XG4gICAgICAgICAgLy8gKGUuZy4sIGAhKFwiXCIgaW4geyBcIlwiOiAxfSlgKS5cbiAgICAgICAgICByZXR1cm4gc2VyaWFsaXplKFwiXCIsICh2YWx1ZSA9IHt9LCB2YWx1ZVtcIlwiXSA9IHNvdXJjZSwgdmFsdWUpLCBjYWxsYmFjaywgcHJvcGVydGllcywgd2hpdGVzcGFjZSwgXCJcIiwgW10pO1xuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICAvLyBQdWJsaWM6IFBhcnNlcyBhIEpTT04gc291cmNlIHN0cmluZy5cbiAgICAgIGlmICghaGFzKFwianNvbi1wYXJzZVwiKSkge1xuICAgICAgICB2YXIgZnJvbUNoYXJDb2RlID0gU3RyaW5nLmZyb21DaGFyQ29kZTtcblxuICAgICAgICAvLyBJbnRlcm5hbDogQSBtYXAgb2YgZXNjYXBlZCBjb250cm9sIGNoYXJhY3RlcnMgYW5kIHRoZWlyIHVuZXNjYXBlZFxuICAgICAgICAvLyBlcXVpdmFsZW50cy5cbiAgICAgICAgdmFyIFVuZXNjYXBlcyA9IHtcbiAgICAgICAgICA5MjogXCJcXFxcXCIsXG4gICAgICAgICAgMzQ6ICdcIicsXG4gICAgICAgICAgNDc6IFwiL1wiLFxuICAgICAgICAgIDk4OiBcIlxcYlwiLFxuICAgICAgICAgIDExNjogXCJcXHRcIixcbiAgICAgICAgICAxMTA6IFwiXFxuXCIsXG4gICAgICAgICAgMTAyOiBcIlxcZlwiLFxuICAgICAgICAgIDExNDogXCJcXHJcIlxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIEludGVybmFsOiBTdG9yZXMgdGhlIHBhcnNlciBzdGF0ZS5cbiAgICAgICAgdmFyIEluZGV4LCBTb3VyY2U7XG5cbiAgICAgICAgLy8gSW50ZXJuYWw6IFJlc2V0cyB0aGUgcGFyc2VyIHN0YXRlIGFuZCB0aHJvd3MgYSBgU3ludGF4RXJyb3JgLlxuICAgICAgICB2YXIgYWJvcnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgSW5kZXggPSBTb3VyY2UgPSBudWxsO1xuICAgICAgICAgIHRocm93IFN5bnRheEVycm9yKCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gSW50ZXJuYWw6IFJldHVybnMgdGhlIG5leHQgdG9rZW4sIG9yIGBcIiRcImAgaWYgdGhlIHBhcnNlciBoYXMgcmVhY2hlZFxuICAgICAgICAvLyB0aGUgZW5kIG9mIHRoZSBzb3VyY2Ugc3RyaW5nLiBBIHRva2VuIG1heSBiZSBhIHN0cmluZywgbnVtYmVyLCBgbnVsbGBcbiAgICAgICAgLy8gbGl0ZXJhbCwgb3IgQm9vbGVhbiBsaXRlcmFsLlxuICAgICAgICB2YXIgbGV4ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHZhciBzb3VyY2UgPSBTb3VyY2UsIGxlbmd0aCA9IHNvdXJjZS5sZW5ndGgsIHZhbHVlLCBiZWdpbiwgcG9zaXRpb24sIGlzU2lnbmVkLCBjaGFyQ29kZTtcbiAgICAgICAgICB3aGlsZSAoSW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICAgIGNoYXJDb2RlID0gc291cmNlLmNoYXJDb2RlQXQoSW5kZXgpO1xuICAgICAgICAgICAgc3dpdGNoIChjaGFyQ29kZSkge1xuICAgICAgICAgICAgICBjYXNlIDk6IGNhc2UgMTA6IGNhc2UgMTM6IGNhc2UgMzI6XG4gICAgICAgICAgICAgICAgLy8gU2tpcCB3aGl0ZXNwYWNlIHRva2VucywgaW5jbHVkaW5nIHRhYnMsIGNhcnJpYWdlIHJldHVybnMsIGxpbmVcbiAgICAgICAgICAgICAgICAvLyBmZWVkcywgYW5kIHNwYWNlIGNoYXJhY3RlcnMuXG4gICAgICAgICAgICAgICAgSW5kZXgrKztcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSAxMjM6IGNhc2UgMTI1OiBjYXNlIDkxOiBjYXNlIDkzOiBjYXNlIDU4OiBjYXNlIDQ0OlxuICAgICAgICAgICAgICAgIC8vIFBhcnNlIGEgcHVuY3R1YXRvciB0b2tlbiAoYHtgLCBgfWAsIGBbYCwgYF1gLCBgOmAsIG9yIGAsYCkgYXRcbiAgICAgICAgICAgICAgICAvLyB0aGUgY3VycmVudCBwb3NpdGlvbi5cbiAgICAgICAgICAgICAgICB2YWx1ZSA9IGNoYXJJbmRleEJ1Z2d5ID8gc291cmNlLmNoYXJBdChJbmRleCkgOiBzb3VyY2VbSW5kZXhdO1xuICAgICAgICAgICAgICAgIEluZGV4Kys7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICAgICAgICBjYXNlIDM0OlxuICAgICAgICAgICAgICAgIC8vIGBcImAgZGVsaW1pdHMgYSBKU09OIHN0cmluZzsgYWR2YW5jZSB0byB0aGUgbmV4dCBjaGFyYWN0ZXIgYW5kXG4gICAgICAgICAgICAgICAgLy8gYmVnaW4gcGFyc2luZyB0aGUgc3RyaW5nLiBTdHJpbmcgdG9rZW5zIGFyZSBwcmVmaXhlZCB3aXRoIHRoZVxuICAgICAgICAgICAgICAgIC8vIHNlbnRpbmVsIGBAYCBjaGFyYWN0ZXIgdG8gZGlzdGluZ3Vpc2ggdGhlbSBmcm9tIHB1bmN0dWF0b3JzIGFuZFxuICAgICAgICAgICAgICAgIC8vIGVuZC1vZi1zdHJpbmcgdG9rZW5zLlxuICAgICAgICAgICAgICAgIGZvciAodmFsdWUgPSBcIkBcIiwgSW5kZXgrKzsgSW5kZXggPCBsZW5ndGg7KSB7XG4gICAgICAgICAgICAgICAgICBjaGFyQ29kZSA9IHNvdXJjZS5jaGFyQ29kZUF0KEluZGV4KTtcbiAgICAgICAgICAgICAgICAgIGlmIChjaGFyQ29kZSA8IDMyKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFVuZXNjYXBlZCBBU0NJSSBjb250cm9sIGNoYXJhY3RlcnMgKHRob3NlIHdpdGggYSBjb2RlIHVuaXRcbiAgICAgICAgICAgICAgICAgICAgLy8gbGVzcyB0aGFuIHRoZSBzcGFjZSBjaGFyYWN0ZXIpIGFyZSBub3QgcGVybWl0dGVkLlxuICAgICAgICAgICAgICAgICAgICBhYm9ydCgpO1xuICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjaGFyQ29kZSA9PSA5Mikge1xuICAgICAgICAgICAgICAgICAgICAvLyBBIHJldmVyc2Ugc29saWR1cyAoYFxcYCkgbWFya3MgdGhlIGJlZ2lubmluZyBvZiBhbiBlc2NhcGVkXG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnRyb2wgY2hhcmFjdGVyIChpbmNsdWRpbmcgYFwiYCwgYFxcYCwgYW5kIGAvYCkgb3IgVW5pY29kZVxuICAgICAgICAgICAgICAgICAgICAvLyBlc2NhcGUgc2VxdWVuY2UuXG4gICAgICAgICAgICAgICAgICAgIGNoYXJDb2RlID0gc291cmNlLmNoYXJDb2RlQXQoKytJbmRleCk7XG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAoY2hhckNvZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICBjYXNlIDkyOiBjYXNlIDM0OiBjYXNlIDQ3OiBjYXNlIDk4OiBjYXNlIDExNjogY2FzZSAxMTA6IGNhc2UgMTAyOiBjYXNlIDExNDpcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJldml2ZSBlc2NhcGVkIGNvbnRyb2wgY2hhcmFjdGVycy5cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlICs9IFVuZXNjYXBlc1tjaGFyQ29kZV07XG4gICAgICAgICAgICAgICAgICAgICAgICBJbmRleCsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgY2FzZSAxMTc6XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBgXFx1YCBtYXJrcyB0aGUgYmVnaW5uaW5nIG9mIGEgVW5pY29kZSBlc2NhcGUgc2VxdWVuY2UuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBBZHZhbmNlIHRvIHRoZSBmaXJzdCBjaGFyYWN0ZXIgYW5kIHZhbGlkYXRlIHRoZVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZm91ci1kaWdpdCBjb2RlIHBvaW50LlxuICAgICAgICAgICAgICAgICAgICAgICAgYmVnaW4gPSArK0luZGV4O1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChwb3NpdGlvbiA9IEluZGV4ICsgNDsgSW5kZXggPCBwb3NpdGlvbjsgSW5kZXgrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBjaGFyQ29kZSA9IHNvdXJjZS5jaGFyQ29kZUF0KEluZGV4KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQSB2YWxpZCBzZXF1ZW5jZSBjb21wcmlzZXMgZm91ciBoZXhkaWdpdHMgKGNhc2UtXG4gICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGluc2Vuc2l0aXZlKSB0aGF0IGZvcm0gYSBzaW5nbGUgaGV4YWRlY2ltYWwgdmFsdWUuXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghKGNoYXJDb2RlID49IDQ4ICYmIGNoYXJDb2RlIDw9IDU3IHx8IGNoYXJDb2RlID49IDk3ICYmIGNoYXJDb2RlIDw9IDEwMiB8fCBjaGFyQ29kZSA+PSA2NSAmJiBjaGFyQ29kZSA8PSA3MCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJbnZhbGlkIFVuaWNvZGUgZXNjYXBlIHNlcXVlbmNlLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFib3J0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJldml2ZSB0aGUgZXNjYXBlZCBjaGFyYWN0ZXIuXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSArPSBmcm9tQ2hhckNvZGUoXCIweFwiICsgc291cmNlLnNsaWNlKGJlZ2luLCBJbmRleCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEludmFsaWQgZXNjYXBlIHNlcXVlbmNlLlxuICAgICAgICAgICAgICAgICAgICAgICAgYWJvcnQoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNoYXJDb2RlID09IDM0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgLy8gQW4gdW5lc2NhcGVkIGRvdWJsZS1xdW90ZSBjaGFyYWN0ZXIgbWFya3MgdGhlIGVuZCBvZiB0aGVcbiAgICAgICAgICAgICAgICAgICAgICAvLyBzdHJpbmcuXG4gICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY2hhckNvZGUgPSBzb3VyY2UuY2hhckNvZGVBdChJbmRleCk7XG4gICAgICAgICAgICAgICAgICAgIGJlZ2luID0gSW5kZXg7XG4gICAgICAgICAgICAgICAgICAgIC8vIE9wdGltaXplIGZvciB0aGUgY29tbW9uIGNhc2Ugd2hlcmUgYSBzdHJpbmcgaXMgdmFsaWQuXG4gICAgICAgICAgICAgICAgICAgIHdoaWxlIChjaGFyQ29kZSA+PSAzMiAmJiBjaGFyQ29kZSAhPSA5MiAmJiBjaGFyQ29kZSAhPSAzNCkge1xuICAgICAgICAgICAgICAgICAgICAgIGNoYXJDb2RlID0gc291cmNlLmNoYXJDb2RlQXQoKytJbmRleCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLy8gQXBwZW5kIHRoZSBzdHJpbmcgYXMtaXMuXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlICs9IHNvdXJjZS5zbGljZShiZWdpbiwgSW5kZXgpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoc291cmNlLmNoYXJDb2RlQXQoSW5kZXgpID09IDM0KSB7XG4gICAgICAgICAgICAgICAgICAvLyBBZHZhbmNlIHRvIHRoZSBuZXh0IGNoYXJhY3RlciBhbmQgcmV0dXJuIHRoZSByZXZpdmVkIHN0cmluZy5cbiAgICAgICAgICAgICAgICAgIEluZGV4Kys7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIFVudGVybWluYXRlZCBzdHJpbmcuXG4gICAgICAgICAgICAgICAgYWJvcnQoKTtcbiAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAvLyBQYXJzZSBudW1iZXJzIGFuZCBsaXRlcmFscy5cbiAgICAgICAgICAgICAgICBiZWdpbiA9IEluZGV4O1xuICAgICAgICAgICAgICAgIC8vIEFkdmFuY2UgcGFzdCB0aGUgbmVnYXRpdmUgc2lnbiwgaWYgb25lIGlzIHNwZWNpZmllZC5cbiAgICAgICAgICAgICAgICBpZiAoY2hhckNvZGUgPT0gNDUpIHtcbiAgICAgICAgICAgICAgICAgIGlzU2lnbmVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgIGNoYXJDb2RlID0gc291cmNlLmNoYXJDb2RlQXQoKytJbmRleCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIFBhcnNlIGFuIGludGVnZXIgb3IgZmxvYXRpbmctcG9pbnQgdmFsdWUuXG4gICAgICAgICAgICAgICAgaWYgKGNoYXJDb2RlID49IDQ4ICYmIGNoYXJDb2RlIDw9IDU3KSB7XG4gICAgICAgICAgICAgICAgICAvLyBMZWFkaW5nIHplcm9lcyBhcmUgaW50ZXJwcmV0ZWQgYXMgb2N0YWwgbGl0ZXJhbHMuXG4gICAgICAgICAgICAgICAgICBpZiAoY2hhckNvZGUgPT0gNDggJiYgKChjaGFyQ29kZSA9IHNvdXJjZS5jaGFyQ29kZUF0KEluZGV4ICsgMSkpLCBjaGFyQ29kZSA+PSA0OCAmJiBjaGFyQ29kZSA8PSA1NykpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gSWxsZWdhbCBvY3RhbCBsaXRlcmFsLlxuICAgICAgICAgICAgICAgICAgICBhYm9ydCgpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgaXNTaWduZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgIC8vIFBhcnNlIHRoZSBpbnRlZ2VyIGNvbXBvbmVudC5cbiAgICAgICAgICAgICAgICAgIGZvciAoOyBJbmRleCA8IGxlbmd0aCAmJiAoKGNoYXJDb2RlID0gc291cmNlLmNoYXJDb2RlQXQoSW5kZXgpKSwgY2hhckNvZGUgPj0gNDggJiYgY2hhckNvZGUgPD0gNTcpOyBJbmRleCsrKTtcbiAgICAgICAgICAgICAgICAgIC8vIEZsb2F0cyBjYW5ub3QgY29udGFpbiBhIGxlYWRpbmcgZGVjaW1hbCBwb2ludDsgaG93ZXZlciwgdGhpc1xuICAgICAgICAgICAgICAgICAgLy8gY2FzZSBpcyBhbHJlYWR5IGFjY291bnRlZCBmb3IgYnkgdGhlIHBhcnNlci5cbiAgICAgICAgICAgICAgICAgIGlmIChzb3VyY2UuY2hhckNvZGVBdChJbmRleCkgPT0gNDYpIHtcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb24gPSArK0luZGV4O1xuICAgICAgICAgICAgICAgICAgICAvLyBQYXJzZSB0aGUgZGVjaW1hbCBjb21wb25lbnQuXG4gICAgICAgICAgICAgICAgICAgIGZvciAoOyBwb3NpdGlvbiA8IGxlbmd0aCAmJiAoKGNoYXJDb2RlID0gc291cmNlLmNoYXJDb2RlQXQocG9zaXRpb24pKSwgY2hhckNvZGUgPj0gNDggJiYgY2hhckNvZGUgPD0gNTcpOyBwb3NpdGlvbisrKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBvc2l0aW9uID09IEluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgLy8gSWxsZWdhbCB0cmFpbGluZyBkZWNpbWFsLlxuICAgICAgICAgICAgICAgICAgICAgIGFib3J0KCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgSW5kZXggPSBwb3NpdGlvbjtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIC8vIFBhcnNlIGV4cG9uZW50cy4gVGhlIGBlYCBkZW5vdGluZyB0aGUgZXhwb25lbnQgaXNcbiAgICAgICAgICAgICAgICAgIC8vIGNhc2UtaW5zZW5zaXRpdmUuXG4gICAgICAgICAgICAgICAgICBjaGFyQ29kZSA9IHNvdXJjZS5jaGFyQ29kZUF0KEluZGV4KTtcbiAgICAgICAgICAgICAgICAgIGlmIChjaGFyQ29kZSA9PSAxMDEgfHwgY2hhckNvZGUgPT0gNjkpIHtcbiAgICAgICAgICAgICAgICAgICAgY2hhckNvZGUgPSBzb3VyY2UuY2hhckNvZGVBdCgrK0luZGV4KTtcbiAgICAgICAgICAgICAgICAgICAgLy8gU2tpcCBwYXN0IHRoZSBzaWduIGZvbGxvd2luZyB0aGUgZXhwb25lbnQsIGlmIG9uZSBpc1xuICAgICAgICAgICAgICAgICAgICAvLyBzcGVjaWZpZWQuXG4gICAgICAgICAgICAgICAgICAgIGlmIChjaGFyQ29kZSA9PSA0MyB8fCBjaGFyQ29kZSA9PSA0NSkge1xuICAgICAgICAgICAgICAgICAgICAgIEluZGV4Kys7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLy8gUGFyc2UgdGhlIGV4cG9uZW50aWFsIGNvbXBvbmVudC5cbiAgICAgICAgICAgICAgICAgICAgZm9yIChwb3NpdGlvbiA9IEluZGV4OyBwb3NpdGlvbiA8IGxlbmd0aCAmJiAoKGNoYXJDb2RlID0gc291cmNlLmNoYXJDb2RlQXQocG9zaXRpb24pKSwgY2hhckNvZGUgPj0gNDggJiYgY2hhckNvZGUgPD0gNTcpOyBwb3NpdGlvbisrKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBvc2l0aW9uID09IEluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgLy8gSWxsZWdhbCBlbXB0eSBleHBvbmVudC5cbiAgICAgICAgICAgICAgICAgICAgICBhYm9ydCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIEluZGV4ID0gcG9zaXRpb247XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAvLyBDb2VyY2UgdGhlIHBhcnNlZCB2YWx1ZSB0byBhIEphdmFTY3JpcHQgbnVtYmVyLlxuICAgICAgICAgICAgICAgICAgcmV0dXJuICtzb3VyY2Uuc2xpY2UoYmVnaW4sIEluZGV4KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gQSBuZWdhdGl2ZSBzaWduIG1heSBvbmx5IHByZWNlZGUgbnVtYmVycy5cbiAgICAgICAgICAgICAgICBpZiAoaXNTaWduZWQpIHtcbiAgICAgICAgICAgICAgICAgIGFib3J0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIGB0cnVlYCwgYGZhbHNlYCwgYW5kIGBudWxsYCBsaXRlcmFscy5cbiAgICAgICAgICAgICAgICBpZiAoc291cmNlLnNsaWNlKEluZGV4LCBJbmRleCArIDQpID09IFwidHJ1ZVwiKSB7XG4gICAgICAgICAgICAgICAgICBJbmRleCArPSA0O1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzb3VyY2Uuc2xpY2UoSW5kZXgsIEluZGV4ICsgNSkgPT0gXCJmYWxzZVwiKSB7XG4gICAgICAgICAgICAgICAgICBJbmRleCArPSA1O1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc291cmNlLnNsaWNlKEluZGV4LCBJbmRleCArIDQpID09IFwibnVsbFwiKSB7XG4gICAgICAgICAgICAgICAgICBJbmRleCArPSA0O1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIFVucmVjb2duaXplZCB0b2tlbi5cbiAgICAgICAgICAgICAgICBhYm9ydCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBSZXR1cm4gdGhlIHNlbnRpbmVsIGAkYCBjaGFyYWN0ZXIgaWYgdGhlIHBhcnNlciBoYXMgcmVhY2hlZCB0aGUgZW5kXG4gICAgICAgICAgLy8gb2YgdGhlIHNvdXJjZSBzdHJpbmcuXG4gICAgICAgICAgcmV0dXJuIFwiJFwiO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIEludGVybmFsOiBQYXJzZXMgYSBKU09OIGB2YWx1ZWAgdG9rZW4uXG4gICAgICAgIHZhciBnZXQgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICB2YXIgcmVzdWx0cywgaGFzTWVtYmVycztcbiAgICAgICAgICBpZiAodmFsdWUgPT0gXCIkXCIpIHtcbiAgICAgICAgICAgIC8vIFVuZXhwZWN0ZWQgZW5kIG9mIGlucHV0LlxuICAgICAgICAgICAgYWJvcnQoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICBpZiAoKGNoYXJJbmRleEJ1Z2d5ID8gdmFsdWUuY2hhckF0KDApIDogdmFsdWVbMF0pID09IFwiQFwiKSB7XG4gICAgICAgICAgICAgIC8vIFJlbW92ZSB0aGUgc2VudGluZWwgYEBgIGNoYXJhY3Rlci5cbiAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlLnNsaWNlKDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gUGFyc2Ugb2JqZWN0IGFuZCBhcnJheSBsaXRlcmFscy5cbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcIltcIikge1xuICAgICAgICAgICAgICAvLyBQYXJzZXMgYSBKU09OIGFycmF5LCByZXR1cm5pbmcgYSBuZXcgSmF2YVNjcmlwdCBhcnJheS5cbiAgICAgICAgICAgICAgcmVzdWx0cyA9IFtdO1xuICAgICAgICAgICAgICBmb3IgKDs7IGhhc01lbWJlcnMgfHwgKGhhc01lbWJlcnMgPSB0cnVlKSkge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gbGV4KCk7XG4gICAgICAgICAgICAgICAgLy8gQSBjbG9zaW5nIHNxdWFyZSBicmFja2V0IG1hcmtzIHRoZSBlbmQgb2YgdGhlIGFycmF5IGxpdGVyYWwuXG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlID09IFwiXVwiKSB7XG4gICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gSWYgdGhlIGFycmF5IGxpdGVyYWwgY29udGFpbnMgZWxlbWVudHMsIHRoZSBjdXJyZW50IHRva2VuXG4gICAgICAgICAgICAgICAgLy8gc2hvdWxkIGJlIGEgY29tbWEgc2VwYXJhdGluZyB0aGUgcHJldmlvdXMgZWxlbWVudCBmcm9tIHRoZVxuICAgICAgICAgICAgICAgIC8vIG5leHQuXG4gICAgICAgICAgICAgICAgaWYgKGhhc01lbWJlcnMpIHtcbiAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcIixcIikge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IGxleCgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT0gXCJdXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAvLyBVbmV4cGVjdGVkIHRyYWlsaW5nIGAsYCBpbiBhcnJheSBsaXRlcmFsLlxuICAgICAgICAgICAgICAgICAgICAgIGFib3J0KCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEEgYCxgIG11c3Qgc2VwYXJhdGUgZWFjaCBhcnJheSBlbGVtZW50LlxuICAgICAgICAgICAgICAgICAgICBhYm9ydCgpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBFbGlzaW9ucyBhbmQgbGVhZGluZyBjb21tYXMgYXJlIG5vdCBwZXJtaXR0ZWQuXG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlID09IFwiLFwiKSB7XG4gICAgICAgICAgICAgICAgICBhYm9ydCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goZ2V0KHZhbHVlKSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHZhbHVlID09IFwie1wiKSB7XG4gICAgICAgICAgICAgIC8vIFBhcnNlcyBhIEpTT04gb2JqZWN0LCByZXR1cm5pbmcgYSBuZXcgSmF2YVNjcmlwdCBvYmplY3QuXG4gICAgICAgICAgICAgIHJlc3VsdHMgPSB7fTtcbiAgICAgICAgICAgICAgZm9yICg7OyBoYXNNZW1iZXJzIHx8IChoYXNNZW1iZXJzID0gdHJ1ZSkpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IGxleCgpO1xuICAgICAgICAgICAgICAgIC8vIEEgY2xvc2luZyBjdXJseSBicmFjZSBtYXJrcyB0aGUgZW5kIG9mIHRoZSBvYmplY3QgbGl0ZXJhbC5cbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT0gXCJ9XCIpIHtcbiAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBJZiB0aGUgb2JqZWN0IGxpdGVyYWwgY29udGFpbnMgbWVtYmVycywgdGhlIGN1cnJlbnQgdG9rZW5cbiAgICAgICAgICAgICAgICAvLyBzaG91bGQgYmUgYSBjb21tYSBzZXBhcmF0b3IuXG4gICAgICAgICAgICAgICAgaWYgKGhhc01lbWJlcnMpIHtcbiAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcIixcIikge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IGxleCgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT0gXCJ9XCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAvLyBVbmV4cGVjdGVkIHRyYWlsaW5nIGAsYCBpbiBvYmplY3QgbGl0ZXJhbC5cbiAgICAgICAgICAgICAgICAgICAgICBhYm9ydCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBBIGAsYCBtdXN0IHNlcGFyYXRlIGVhY2ggb2JqZWN0IG1lbWJlci5cbiAgICAgICAgICAgICAgICAgICAgYWJvcnQoKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gTGVhZGluZyBjb21tYXMgYXJlIG5vdCBwZXJtaXR0ZWQsIG9iamVjdCBwcm9wZXJ0eSBuYW1lcyBtdXN0IGJlXG4gICAgICAgICAgICAgICAgLy8gZG91YmxlLXF1b3RlZCBzdHJpbmdzLCBhbmQgYSBgOmAgbXVzdCBzZXBhcmF0ZSBlYWNoIHByb3BlcnR5XG4gICAgICAgICAgICAgICAgLy8gbmFtZSBhbmQgdmFsdWUuXG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlID09IFwiLFwiIHx8IHR5cGVvZiB2YWx1ZSAhPSBcInN0cmluZ1wiIHx8IChjaGFySW5kZXhCdWdneSA/IHZhbHVlLmNoYXJBdCgwKSA6IHZhbHVlWzBdKSAhPSBcIkBcIiB8fCBsZXgoKSAhPSBcIjpcIikge1xuICAgICAgICAgICAgICAgICAgYWJvcnQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmVzdWx0c1t2YWx1ZS5zbGljZSgxKV0gPSBnZXQobGV4KCkpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybiByZXN1bHRzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gVW5leHBlY3RlZCB0b2tlbiBlbmNvdW50ZXJlZC5cbiAgICAgICAgICAgIGFib3J0KCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBJbnRlcm5hbDogVXBkYXRlcyBhIHRyYXZlcnNlZCBvYmplY3QgbWVtYmVyLlxuICAgICAgICB2YXIgdXBkYXRlID0gZnVuY3Rpb24gKHNvdXJjZSwgcHJvcGVydHksIGNhbGxiYWNrKSB7XG4gICAgICAgICAgdmFyIGVsZW1lbnQgPSB3YWxrKHNvdXJjZSwgcHJvcGVydHksIGNhbGxiYWNrKTtcbiAgICAgICAgICBpZiAoZWxlbWVudCA9PT0gdW5kZWYpIHtcbiAgICAgICAgICAgIGRlbGV0ZSBzb3VyY2VbcHJvcGVydHldO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzb3VyY2VbcHJvcGVydHldID0gZWxlbWVudDtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gSW50ZXJuYWw6IFJlY3Vyc2l2ZWx5IHRyYXZlcnNlcyBhIHBhcnNlZCBKU09OIG9iamVjdCwgaW52b2tpbmcgdGhlXG4gICAgICAgIC8vIGBjYWxsYmFja2AgZnVuY3Rpb24gZm9yIGVhY2ggdmFsdWUuIFRoaXMgaXMgYW4gaW1wbGVtZW50YXRpb24gb2YgdGhlXG4gICAgICAgIC8vIGBXYWxrKGhvbGRlciwgbmFtZSlgIG9wZXJhdGlvbiBkZWZpbmVkIGluIEVTIDUuMSBzZWN0aW9uIDE1LjEyLjIuXG4gICAgICAgIHZhciB3YWxrID0gZnVuY3Rpb24gKHNvdXJjZSwgcHJvcGVydHksIGNhbGxiYWNrKSB7XG4gICAgICAgICAgdmFyIHZhbHVlID0gc291cmNlW3Byb3BlcnR5XSwgbGVuZ3RoO1xuICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT0gXCJvYmplY3RcIiAmJiB2YWx1ZSkge1xuICAgICAgICAgICAgLy8gYGZvckVhY2hgIGNhbid0IGJlIHVzZWQgdG8gdHJhdmVyc2UgYW4gYXJyYXkgaW4gT3BlcmEgPD0gOC41NFxuICAgICAgICAgICAgLy8gYmVjYXVzZSBpdHMgYE9iamVjdCNoYXNPd25Qcm9wZXJ0eWAgaW1wbGVtZW50YXRpb24gcmV0dXJucyBgZmFsc2VgXG4gICAgICAgICAgICAvLyBmb3IgYXJyYXkgaW5kaWNlcyAoZS5nLiwgYCFbMSwgMiwgM10uaGFzT3duUHJvcGVydHkoXCIwXCIpYCkuXG4gICAgICAgICAgICBpZiAoZ2V0Q2xhc3MuY2FsbCh2YWx1ZSkgPT0gYXJyYXlDbGFzcykge1xuICAgICAgICAgICAgICBmb3IgKGxlbmd0aCA9IHZhbHVlLmxlbmd0aDsgbGVuZ3RoLS07KSB7XG4gICAgICAgICAgICAgICAgdXBkYXRlKHZhbHVlLCBsZW5ndGgsIGNhbGxiYWNrKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgZm9yRWFjaCh2YWx1ZSwgZnVuY3Rpb24gKHByb3BlcnR5KSB7XG4gICAgICAgICAgICAgICAgdXBkYXRlKHZhbHVlLCBwcm9wZXJ0eSwgY2FsbGJhY2spO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGNhbGxiYWNrLmNhbGwoc291cmNlLCBwcm9wZXJ0eSwgdmFsdWUpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIFB1YmxpYzogYEpTT04ucGFyc2VgLiBTZWUgRVMgNS4xIHNlY3Rpb24gMTUuMTIuMi5cbiAgICAgICAgZXhwb3J0cy5wYXJzZSA9IGZ1bmN0aW9uIChzb3VyY2UsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgdmFyIHJlc3VsdCwgdmFsdWU7XG4gICAgICAgICAgSW5kZXggPSAwO1xuICAgICAgICAgIFNvdXJjZSA9IFwiXCIgKyBzb3VyY2U7XG4gICAgICAgICAgcmVzdWx0ID0gZ2V0KGxleCgpKTtcbiAgICAgICAgICAvLyBJZiBhIEpTT04gc3RyaW5nIGNvbnRhaW5zIG11bHRpcGxlIHRva2VucywgaXQgaXMgaW52YWxpZC5cbiAgICAgICAgICBpZiAobGV4KCkgIT0gXCIkXCIpIHtcbiAgICAgICAgICAgIGFib3J0KCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIFJlc2V0IHRoZSBwYXJzZXIgc3RhdGUuXG4gICAgICAgICAgSW5kZXggPSBTb3VyY2UgPSBudWxsO1xuICAgICAgICAgIHJldHVybiBjYWxsYmFjayAmJiBnZXRDbGFzcy5jYWxsKGNhbGxiYWNrKSA9PSBmdW5jdGlvbkNsYXNzID8gd2FsaygodmFsdWUgPSB7fSwgdmFsdWVbXCJcIl0gPSByZXN1bHQsIHZhbHVlKSwgXCJcIiwgY2FsbGJhY2spIDogcmVzdWx0O1xuICAgICAgICB9O1xuICAgICAgfVxuICAgIH1cblxuICAgIGV4cG9ydHNbXCJydW5JbkNvbnRleHRcIl0gPSBydW5JbkNvbnRleHQ7XG4gICAgcmV0dXJuIGV4cG9ydHM7XG4gIH1cblxuICBpZiAodHlwZW9mIGV4cG9ydHMgPT0gXCJvYmplY3RcIiAmJiBleHBvcnRzICYmICFleHBvcnRzLm5vZGVUeXBlICYmICFpc0xvYWRlcikge1xuICAgIC8vIEV4cG9ydCBmb3IgQ29tbW9uSlMgZW52aXJvbm1lbnRzLlxuICAgIHJ1bkluQ29udGV4dChyb290LCBleHBvcnRzKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBFeHBvcnQgZm9yIHdlYiBicm93c2VycyBhbmQgSmF2YVNjcmlwdCBlbmdpbmVzLlxuICAgIHZhciBuYXRpdmVKU09OID0gcm9vdC5KU09OO1xuICAgIHZhciBKU09OMyA9IHJ1bkluQ29udGV4dChyb290LCAocm9vdFtcIkpTT04zXCJdID0ge1xuICAgICAgLy8gUHVibGljOiBSZXN0b3JlcyB0aGUgb3JpZ2luYWwgdmFsdWUgb2YgdGhlIGdsb2JhbCBgSlNPTmAgb2JqZWN0IGFuZFxuICAgICAgLy8gcmV0dXJucyBhIHJlZmVyZW5jZSB0byB0aGUgYEpTT04zYCBvYmplY3QuXG4gICAgICBcIm5vQ29uZmxpY3RcIjogZnVuY3Rpb24gKCkge1xuICAgICAgICByb290LkpTT04gPSBuYXRpdmVKU09OO1xuICAgICAgICByZXR1cm4gSlNPTjM7XG4gICAgICB9XG4gICAgfSkpO1xuXG4gICAgcm9vdC5KU09OID0ge1xuICAgICAgXCJwYXJzZVwiOiBKU09OMy5wYXJzZSxcbiAgICAgIFwic3RyaW5naWZ5XCI6IEpTT04zLnN0cmluZ2lmeVxuICAgIH07XG4gIH1cblxuICAvLyBFeHBvcnQgZm9yIGFzeW5jaHJvbm91cyBtb2R1bGUgbG9hZGVycy5cbiAgaWYgKGlzTG9hZGVyKSB7XG4gICAgZGVmaW5lKGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBKU09OMztcbiAgICB9KTtcbiAgfVxufSh0aGlzKSk7XG4iLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG52YXIgdG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuXG52YXIgaXNGdW5jdGlvbiA9IGZ1bmN0aW9uIChmbikge1xuXHRyZXR1cm4gKHR5cGVvZiBmbiA9PT0gJ2Z1bmN0aW9uJyAmJiAhKGZuIGluc3RhbmNlb2YgUmVnRXhwKSkgfHwgdG9TdHJpbmcuY2FsbChmbikgPT09ICdbb2JqZWN0IEZ1bmN0aW9uXSc7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGZvckVhY2gob2JqLCBmbikge1xuXHRpZiAoIWlzRnVuY3Rpb24oZm4pKSB7XG5cdFx0dGhyb3cgbmV3IFR5cGVFcnJvcignaXRlcmF0b3IgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cdH1cblx0dmFyIGksIGssXG5cdFx0aXNTdHJpbmcgPSB0eXBlb2Ygb2JqID09PSAnc3RyaW5nJyxcblx0XHRsID0gb2JqLmxlbmd0aCxcblx0XHRjb250ZXh0ID0gYXJndW1lbnRzLmxlbmd0aCA+IDIgPyBhcmd1bWVudHNbMl0gOiBudWxsO1xuXHRpZiAobCA9PT0gK2wpIHtcblx0XHRmb3IgKGkgPSAwOyBpIDwgbDsgaSsrKSB7XG5cdFx0XHRpZiAoY29udGV4dCA9PT0gbnVsbCkge1xuXHRcdFx0XHRmbihpc1N0cmluZyA/IG9iai5jaGFyQXQoaSkgOiBvYmpbaV0sIGksIG9iaik7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRmbi5jYWxsKGNvbnRleHQsIGlzU3RyaW5nID8gb2JqLmNoYXJBdChpKSA6IG9ialtpXSwgaSwgb2JqKTtcblx0XHRcdH1cblx0XHR9XG5cdH0gZWxzZSB7XG5cdFx0Zm9yIChrIGluIG9iaikge1xuXHRcdFx0aWYgKGhhc093bi5jYWxsKG9iaiwgaykpIHtcblx0XHRcdFx0aWYgKGNvbnRleHQgPT09IG51bGwpIHtcblx0XHRcdFx0XHRmbihvYmpba10sIGssIG9iaik7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Zm4uY2FsbChjb250ZXh0LCBvYmpba10sIGssIG9iaik7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cbn07XG5cbiIsIlwidXNlIHN0cmljdFwiO1xuXG4vLyBtb2RpZmllZCBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9lcy1zaGltcy9lczUtc2hpbVxudmFyIGhhcyA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHksXG5cdHRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZyxcblx0Zm9yRWFjaCA9IHJlcXVpcmUoJy4vZm9yZWFjaCcpLFxuXHRpc0FyZ3MgPSByZXF1aXJlKCcuL2lzQXJndW1lbnRzJyksXG5cdGhhc0RvbnRFbnVtQnVnID0gISh7J3RvU3RyaW5nJzogbnVsbH0pLnByb3BlcnR5SXNFbnVtZXJhYmxlKCd0b1N0cmluZycpLFxuXHRoYXNQcm90b0VudW1CdWcgPSAoZnVuY3Rpb24gKCkge30pLnByb3BlcnR5SXNFbnVtZXJhYmxlKCdwcm90b3R5cGUnKSxcblx0ZG9udEVudW1zID0gW1xuXHRcdFwidG9TdHJpbmdcIixcblx0XHRcInRvTG9jYWxlU3RyaW5nXCIsXG5cdFx0XCJ2YWx1ZU9mXCIsXG5cdFx0XCJoYXNPd25Qcm9wZXJ0eVwiLFxuXHRcdFwiaXNQcm90b3R5cGVPZlwiLFxuXHRcdFwicHJvcGVydHlJc0VudW1lcmFibGVcIixcblx0XHRcImNvbnN0cnVjdG9yXCJcblx0XTtcblxudmFyIGtleXNTaGltID0gZnVuY3Rpb24ga2V5cyhvYmplY3QpIHtcblx0dmFyIGlzT2JqZWN0ID0gb2JqZWN0ICE9PSBudWxsICYmIHR5cGVvZiBvYmplY3QgPT09ICdvYmplY3QnLFxuXHRcdGlzRnVuY3Rpb24gPSB0b1N0cmluZy5jYWxsKG9iamVjdCkgPT09ICdbb2JqZWN0IEZ1bmN0aW9uXScsXG5cdFx0aXNBcmd1bWVudHMgPSBpc0FyZ3Mob2JqZWN0KSxcblx0XHR0aGVLZXlzID0gW107XG5cblx0aWYgKCFpc09iamVjdCAmJiAhaXNGdW5jdGlvbiAmJiAhaXNBcmd1bWVudHMpIHtcblx0XHR0aHJvdyBuZXcgVHlwZUVycm9yKFwiT2JqZWN0LmtleXMgY2FsbGVkIG9uIGEgbm9uLW9iamVjdFwiKTtcblx0fVxuXG5cdGlmIChpc0FyZ3VtZW50cykge1xuXHRcdGZvckVhY2gob2JqZWN0LCBmdW5jdGlvbiAodmFsdWUsIGluZGV4KSB7XG5cdFx0XHR0aGVLZXlzLnB1c2goaW5kZXgpO1xuXHRcdH0pO1xuXHR9IGVsc2Uge1xuXHRcdHZhciBuYW1lLFxuXHRcdFx0c2tpcFByb3RvID0gaGFzUHJvdG9FbnVtQnVnICYmIGlzRnVuY3Rpb247XG5cblx0XHRmb3IgKG5hbWUgaW4gb2JqZWN0KSB7XG5cdFx0XHRpZiAoIShza2lwUHJvdG8gJiYgbmFtZSA9PT0gJ3Byb3RvdHlwZScpICYmIGhhcy5jYWxsKG9iamVjdCwgbmFtZSkpIHtcblx0XHRcdFx0dGhlS2V5cy5wdXNoKG5hbWUpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGlmIChoYXNEb250RW51bUJ1Zykge1xuXHRcdHZhciBjdG9yID0gb2JqZWN0LmNvbnN0cnVjdG9yLFxuXHRcdFx0c2tpcENvbnN0cnVjdG9yID0gY3RvciAmJiBjdG9yLnByb3RvdHlwZSA9PT0gb2JqZWN0O1xuXG5cdFx0Zm9yRWFjaChkb250RW51bXMsIGZ1bmN0aW9uIChkb250RW51bSkge1xuXHRcdFx0aWYgKCEoc2tpcENvbnN0cnVjdG9yICYmIGRvbnRFbnVtID09PSAnY29uc3RydWN0b3InKSAmJiBoYXMuY2FsbChvYmplY3QsIGRvbnRFbnVtKSkge1xuXHRcdFx0XHR0aGVLZXlzLnB1c2goZG9udEVudW0pO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG5cdHJldHVybiB0aGVLZXlzO1xufTtcblxua2V5c1NoaW0uc2hpbSA9IGZ1bmN0aW9uIHNoaW1PYmplY3RLZXlzKCkge1xuXHRpZiAoIU9iamVjdC5rZXlzKSB7XG5cdFx0T2JqZWN0LmtleXMgPSBrZXlzU2hpbTtcblx0fVxuXHRyZXR1cm4gT2JqZWN0LmtleXMgfHwga2V5c1NoaW07XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGtleXNTaGltO1xuXG4iLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIHRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc0FyZ3VtZW50cyh2YWx1ZSkge1xuXHR2YXIgc3RyID0gdG9TdHJpbmcuY2FsbCh2YWx1ZSk7XG5cdHZhciBpc0FyZ3VtZW50cyA9IHN0ciA9PT0gJ1tvYmplY3QgQXJndW1lbnRzXSc7XG5cdGlmICghaXNBcmd1bWVudHMpIHtcblx0XHRpc0FyZ3VtZW50cyA9IHN0ciAhPT0gJ1tvYmplY3QgQXJyYXldJ1xuXHRcdFx0JiYgdmFsdWUgIT09IG51bGxcblx0XHRcdCYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCdcblx0XHRcdCYmIHR5cGVvZiB2YWx1ZS5sZW5ndGggPT09ICdudW1iZXInXG5cdFx0XHQmJiB2YWx1ZS5sZW5ndGggPj0gMFxuXHRcdFx0JiYgdG9TdHJpbmcuY2FsbCh2YWx1ZS5jYWxsZWUpID09PSAnW29iamVjdCBGdW5jdGlvbl0nO1xuXHR9XG5cdHJldHVybiBpc0FyZ3VtZW50cztcbn07XG5cbiIsIlxuLyoqXG4gKiBNb2R1bGUgZGVwZW5kZW5jaWVzLlxuICovXG5cbnZhciBtYXAgPSByZXF1aXJlKCdhcnJheS1tYXAnKTtcbnZhciBpbmRleE9mID0gcmVxdWlyZSgnaW5kZXhvZicpO1xudmFyIGlzQXJyYXkgPSByZXF1aXJlKCdpc2FycmF5Jyk7XG52YXIgZm9yRWFjaCA9IHJlcXVpcmUoJ2ZvcmVhY2gnKTtcbnZhciByZWR1Y2UgPSByZXF1aXJlKCdhcnJheS1yZWR1Y2UnKTtcbnZhciBnZXRPYmplY3RLZXlzID0gcmVxdWlyZSgnb2JqZWN0LWtleXMnKTtcbnZhciBKU09OID0gcmVxdWlyZSgnanNvbjMnKTtcblxuLyoqXG4gKiBNYWtlIHN1cmUgYE9iamVjdC5rZXlzYCB3b3JrIGZvciBgdW5kZWZpbmVkYFxuICogdmFsdWVzIHRoYXQgYXJlIHN0aWxsIHRoZXJlLCBsaWtlIGBkb2N1bWVudC5hbGxgLlxuICogaHR0cDovL2xpc3RzLnczLm9yZy9BcmNoaXZlcy9QdWJsaWMvcHVibGljLWh0bWwvMjAwOUp1bi8wNTQ2Lmh0bWxcbiAqXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBvYmplY3RLZXlzKHZhbCl7XG4gIGlmIChPYmplY3Qua2V5cykgcmV0dXJuIE9iamVjdC5rZXlzKHZhbCk7XG4gIHJldHVybiBnZXRPYmplY3RLZXlzKHZhbCk7XG59XG5cbi8qKlxuICogTW9kdWxlIGV4cG9ydHMuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBpbnNwZWN0O1xuXG4vKipcbiAqIEVjaG9zIHRoZSB2YWx1ZSBvZiBhIHZhbHVlLiBUcnlzIHRvIHByaW50IHRoZSB2YWx1ZSBvdXRcbiAqIGluIHRoZSBiZXN0IHdheSBwb3NzaWJsZSBnaXZlbiB0aGUgZGlmZmVyZW50IHR5cGVzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmogVGhlIG9iamVjdCB0byBwcmludCBvdXQuXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0cyBPcHRpb25hbCBvcHRpb25zIG9iamVjdCB0aGF0IGFsdGVycyB0aGUgb3V0cHV0LlxuICogQGxpY2Vuc2UgTUlUICjCqSBKb3llbnQpXG4gKi9cbi8qIGxlZ2FjeTogb2JqLCBzaG93SGlkZGVuLCBkZXB0aCwgY29sb3JzKi9cblxuZnVuY3Rpb24gaW5zcGVjdChvYmosIG9wdHMpIHtcbiAgLy8gZGVmYXVsdCBvcHRpb25zXG4gIHZhciBjdHggPSB7XG4gICAgc2VlbjogW10sXG4gICAgc3R5bGl6ZTogc3R5bGl6ZU5vQ29sb3JcbiAgfTtcbiAgLy8gbGVnYWN5Li4uXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDMpIGN0eC5kZXB0aCA9IGFyZ3VtZW50c1syXTtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gNCkgY3R4LmNvbG9ycyA9IGFyZ3VtZW50c1szXTtcbiAgaWYgKGlzQm9vbGVhbihvcHRzKSkge1xuICAgIC8vIGxlZ2FjeS4uLlxuICAgIGN0eC5zaG93SGlkZGVuID0gb3B0cztcbiAgfSBlbHNlIGlmIChvcHRzKSB7XG4gICAgLy8gZ290IGFuIFwib3B0aW9uc1wiIG9iamVjdFxuICAgIF9leHRlbmQoY3R4LCBvcHRzKTtcbiAgfVxuICAvLyBzZXQgZGVmYXVsdCBvcHRpb25zXG4gIGlmIChpc1VuZGVmaW5lZChjdHguc2hvd0hpZGRlbikpIGN0eC5zaG93SGlkZGVuID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguZGVwdGgpKSBjdHguZGVwdGggPSAyO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmNvbG9ycykpIGN0eC5jb2xvcnMgPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jdXN0b21JbnNwZWN0KSkgY3R4LmN1c3RvbUluc3BlY3QgPSB0cnVlO1xuICBpZiAoY3R4LmNvbG9ycykgY3R4LnN0eWxpemUgPSBzdHlsaXplV2l0aENvbG9yO1xuICByZXR1cm4gZm9ybWF0VmFsdWUoY3R4LCBvYmosIGN0eC5kZXB0aCk7XG59XG5cbi8vIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQU5TSV9lc2NhcGVfY29kZSNncmFwaGljc1xuaW5zcGVjdC5jb2xvcnMgPSB7XG4gICdib2xkJyA6IFsxLCAyMl0sXG4gICdpdGFsaWMnIDogWzMsIDIzXSxcbiAgJ3VuZGVybGluZScgOiBbNCwgMjRdLFxuICAnaW52ZXJzZScgOiBbNywgMjddLFxuICAnd2hpdGUnIDogWzM3LCAzOV0sXG4gICdncmV5JyA6IFs5MCwgMzldLFxuICAnYmxhY2snIDogWzMwLCAzOV0sXG4gICdibHVlJyA6IFszNCwgMzldLFxuICAnY3lhbicgOiBbMzYsIDM5XSxcbiAgJ2dyZWVuJyA6IFszMiwgMzldLFxuICAnbWFnZW50YScgOiBbMzUsIDM5XSxcbiAgJ3JlZCcgOiBbMzEsIDM5XSxcbiAgJ3llbGxvdycgOiBbMzMsIDM5XVxufTtcblxuLy8gRG9uJ3QgdXNlICdibHVlJyBub3QgdmlzaWJsZSBvbiBjbWQuZXhlXG5pbnNwZWN0LnN0eWxlcyA9IHtcbiAgJ3NwZWNpYWwnOiAnY3lhbicsXG4gICdudW1iZXInOiAneWVsbG93JyxcbiAgJ2Jvb2xlYW4nOiAneWVsbG93JyxcbiAgJ3VuZGVmaW5lZCc6ICdncmV5JyxcbiAgJ251bGwnOiAnYm9sZCcsXG4gICdzdHJpbmcnOiAnZ3JlZW4nLFxuICAnZGF0ZSc6ICdtYWdlbnRhJyxcbiAgLy8gXCJuYW1lXCI6IGludGVudGlvbmFsbHkgbm90IHN0eWxpbmdcbiAgJ3JlZ2V4cCc6ICdyZWQnXG59O1xuXG5mdW5jdGlvbiBzdHlsaXplTm9Db2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICByZXR1cm4gc3RyO1xufVxuXG5mdW5jdGlvbiBpc0Jvb2xlYW4oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnYm9vbGVhbic7XG59XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG5cbmZ1bmN0aW9uIHN0eWxpemVXaXRoQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgdmFyIHN0eWxlID0gaW5zcGVjdC5zdHlsZXNbc3R5bGVUeXBlXTtcblxuICBpZiAoc3R5bGUpIHtcbiAgICByZXR1cm4gJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVswXSArICdtJyArIHN0ciArXG4gICAgICAgICAgICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMV0gKyAnbSc7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHN0cjtcbiAgfVxufVxuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gaXNTdHJpbmcoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnc3RyaW5nJztcbn1cblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cblxuZnVuY3Rpb24gaXNOdWxsKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsO1xufVxuXG5mdW5jdGlvbiBoYXNPd24ob2JqLCBwcm9wKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKTtcbn1cblxuZnVuY3Rpb24gaXNSZWdFeHAocmUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KHJlKSAmJiBvYmplY3RUb1N0cmluZyhyZSkgPT09ICdbb2JqZWN0IFJlZ0V4cF0nO1xufVxuXG5mdW5jdGlvbiBpc09iamVjdChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGFyZyAhPT0gbnVsbDtcbn1cblxuZnVuY3Rpb24gaXNFcnJvcihlKSB7XG4gIHJldHVybiBpc09iamVjdChlKSAmJlxuICAgICAgKG9iamVjdFRvU3RyaW5nKGUpID09PSAnW29iamVjdCBFcnJvcl0nIHx8IGUgaW5zdGFuY2VvZiBFcnJvcik7XG59XG5cbmZ1bmN0aW9uIGlzRGF0ZShkKSB7XG4gIHJldHVybiBpc09iamVjdChkKSAmJiBvYmplY3RUb1N0cmluZyhkKSA9PT0gJ1tvYmplY3QgRGF0ZV0nO1xufVxuXG5mdW5jdGlvbiBvYmplY3RUb1N0cmluZyhvKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwobyk7XG59XG5cbmZ1bmN0aW9uIGFycmF5VG9IYXNoKGFycmF5KSB7XG4gIHZhciBoYXNoID0ge307XG5cbiAgZm9yRWFjaChhcnJheSwgZnVuY3Rpb24odmFsLCBpZHgpIHtcbiAgICBoYXNoW3ZhbF0gPSB0cnVlO1xuICB9KTtcblxuICByZXR1cm4gaGFzaDtcbn1cblxuZnVuY3Rpb24gZm9ybWF0QXJyYXkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5cykge1xuICB2YXIgb3V0cHV0ID0gW107XG4gIGZvciAodmFyIGkgPSAwLCBsID0gdmFsdWUubGVuZ3RoOyBpIDwgbDsgKytpKSB7XG4gICAgaWYgKGhhc093bih2YWx1ZSwgU3RyaW5nKGkpKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBTdHJpbmcoaSksIHRydWUpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3V0cHV0LnB1c2goJycpO1xuICAgIH1cbiAgfVxuICBmb3JFYWNoKGtleXMsIGZ1bmN0aW9uKGtleSkge1xuICAgIGlmICgha2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBrZXksIHRydWUpKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb3V0cHV0O1xufVxuXG5mdW5jdGlvbiBmb3JtYXRFcnJvcih2YWx1ZSkge1xuICByZXR1cm4gJ1snICsgRXJyb3IucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpICsgJ10nO1xufVxuXG5mdW5jdGlvbiBmb3JtYXRWYWx1ZShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMpIHtcbiAgLy8gUHJvdmlkZSBhIGhvb2sgZm9yIHVzZXItc3BlY2lmaWVkIGluc3BlY3QgZnVuY3Rpb25zLlxuICAvLyBDaGVjayB0aGF0IHZhbHVlIGlzIGFuIG9iamVjdCB3aXRoIGFuIGluc3BlY3QgZnVuY3Rpb24gb24gaXRcbiAgaWYgKGN0eC5jdXN0b21JbnNwZWN0ICYmXG4gICAgICB2YWx1ZSAmJlxuICAgICAgaXNGdW5jdGlvbih2YWx1ZS5pbnNwZWN0KSAmJlxuICAgICAgLy8gRmlsdGVyIG91dCB0aGUgdXRpbCBtb2R1bGUsIGl0J3MgaW5zcGVjdCBmdW5jdGlvbiBpcyBzcGVjaWFsXG4gICAgICB2YWx1ZS5pbnNwZWN0ICE9PSBpbnNwZWN0ICYmXG4gICAgICAvLyBBbHNvIGZpbHRlciBvdXQgYW55IHByb3RvdHlwZSBvYmplY3RzIHVzaW5nIHRoZSBjaXJjdWxhciBjaGVjay5cbiAgICAgICEodmFsdWUuY29uc3RydWN0b3IgJiYgdmFsdWUuY29uc3RydWN0b3IucHJvdG90eXBlID09PSB2YWx1ZSkpIHtcbiAgICB2YXIgcmV0ID0gdmFsdWUuaW5zcGVjdChyZWN1cnNlVGltZXMsIGN0eCk7XG4gICAgaWYgKCFpc1N0cmluZyhyZXQpKSB7XG4gICAgICByZXQgPSBmb3JtYXRWYWx1ZShjdHgsIHJldCwgcmVjdXJzZVRpbWVzKTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbiAgfVxuXG4gIC8vIFByaW1pdGl2ZSB0eXBlcyBjYW5ub3QgaGF2ZSBwcm9wZXJ0aWVzXG4gIHZhciBwcmltaXRpdmUgPSBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSk7XG4gIGlmIChwcmltaXRpdmUpIHtcbiAgICByZXR1cm4gcHJpbWl0aXZlO1xuICB9XG5cbiAgLy8gTG9vayB1cCB0aGUga2V5cyBvZiB0aGUgb2JqZWN0LlxuICB2YXIga2V5cyA9IG9iamVjdEtleXModmFsdWUpO1xuICB2YXIgdmlzaWJsZUtleXMgPSBhcnJheVRvSGFzaChrZXlzKTtcblxuICBpZiAoY3R4LnNob3dIaWRkZW4gJiYgT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMpIHtcbiAgICBrZXlzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModmFsdWUpO1xuICB9XG5cbiAgLy8gSUUgZG9lc24ndCBtYWtlIGVycm9yIGZpZWxkcyBub24tZW51bWVyYWJsZVxuICAvLyBodHRwOi8vbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvaWUvZHd3NTJzYnQodj12cy45NCkuYXNweFxuICBpZiAoaXNFcnJvcih2YWx1ZSlcbiAgICAgICYmIChpbmRleE9mKGtleXMsICdtZXNzYWdlJykgPj0gMCB8fCBpbmRleE9mKGtleXMsICdkZXNjcmlwdGlvbicpID49IDApKSB7XG4gICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIC8vIFNvbWUgdHlwZSBvZiBvYmplY3Qgd2l0aG91dCBwcm9wZXJ0aWVzIGNhbiBiZSBzaG9ydGN1dHRlZC5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgICB2YXIgbmFtZSA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbRnVuY3Rpb24nICsgbmFtZSArICddJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9XG4gICAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShEYXRlLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ2RhdGUnKTtcbiAgICB9XG4gICAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIHZhciBiYXNlID0gJycsIGFycmF5ID0gZmFsc2UsIGJyYWNlcyA9IFsneycsICd9J107XG5cbiAgLy8gTWFrZSBBcnJheSBzYXkgdGhhdCB0aGV5IGFyZSBBcnJheVxuICBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcbiAgICBhcnJheSA9IHRydWU7XG4gICAgYnJhY2VzID0gWydbJywgJ10nXTtcbiAgfVxuXG4gIC8vIE1ha2UgZnVuY3Rpb25zIHNheSB0aGF0IHRoZXkgYXJlIGZ1bmN0aW9uc1xuICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICB2YXIgbiA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgIGJhc2UgPSAnIFtGdW5jdGlvbicgKyBuICsgJ10nO1xuICB9XG5cbiAgLy8gTWFrZSBSZWdFeHBzIHNheSB0aGF0IHRoZXkgYXJlIFJlZ0V4cHNcbiAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBkYXRlcyB3aXRoIHByb3BlcnRpZXMgZmlyc3Qgc2F5IHRoZSBkYXRlXG4gIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIERhdGUucHJvdG90eXBlLnRvVVRDU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBlcnJvciB3aXRoIG1lc3NhZ2UgZmlyc3Qgc2F5IHRoZSBlcnJvclxuICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwICYmICghYXJyYXkgfHwgdmFsdWUubGVuZ3RoID09IDApKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyBicmFjZXNbMV07XG4gIH1cblxuICBpZiAocmVjdXJzZVRpbWVzIDwgMCkge1xuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW09iamVjdF0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuXG4gIGN0eC5zZWVuLnB1c2godmFsdWUpO1xuXG4gIHZhciBvdXRwdXQ7XG4gIGlmIChhcnJheSkge1xuICAgIG91dHB1dCA9IGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpO1xuICB9IGVsc2Uge1xuICAgIG91dHB1dCA9IG1hcChrZXlzLCBmdW5jdGlvbihrZXkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KTtcbiAgICB9KTtcbiAgfVxuXG4gIGN0eC5zZWVuLnBvcCgpO1xuXG4gIHJldHVybiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcyk7XG59XG5cbmZ1bmN0aW9uIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpIHtcbiAgdmFyIG5hbWUsIHN0ciwgZGVzYztcbiAgZGVzYyA9IHsgdmFsdWU6IHZhbHVlW2tleV0gfTtcbiAgaWYgKE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IpIHtcbiAgICBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih2YWx1ZSwga2V5KSB8fCBkZXNjO1xuICB9XG4gIGlmIChkZXNjLmdldCkge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXIvU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tTZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKCFoYXNPd24odmlzaWJsZUtleXMsIGtleSkpIHtcbiAgICBuYW1lID0gJ1snICsga2V5ICsgJ10nO1xuICB9XG4gIGlmICghc3RyKSB7XG4gICAgaWYgKGluZGV4T2YoY3R4LnNlZW4sIGRlc2MudmFsdWUpIDwgMCkge1xuICAgICAgaWYgKGlzTnVsbChyZWN1cnNlVGltZXMpKSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgbnVsbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIHJlY3Vyc2VUaW1lcyAtIDEpO1xuICAgICAgfVxuICAgICAgaWYgKHN0ci5pbmRleE9mKCdcXG4nKSA+IC0xKSB7XG4gICAgICAgIGlmIChhcnJheSkge1xuICAgICAgICAgIHN0ciA9IG1hcChzdHIuc3BsaXQoJ1xcbicpLCBmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJykuc3Vic3RyKDIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0ciA9ICdcXG4nICsgbWFwKHN0ci5zcGxpdCgnXFxuJyksIGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tDaXJjdWxhcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoaXNVbmRlZmluZWQobmFtZSkpIHtcbiAgICBpZiAoYXJyYXkgJiYga2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG4gICAgbmFtZSA9IEpTT04uc3RyaW5naWZ5KCcnICsga2V5KTtcbiAgICBpZiAobmFtZS5tYXRjaCgvXlwiKFthLXpBLVpfXVthLXpBLVpfMC05XSopXCIkLykpIHtcbiAgICAgIG5hbWUgPSBuYW1lLnN1YnN0cigxLCBuYW1lLmxlbmd0aCAtIDIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICduYW1lJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hbWUgPSBuYW1lLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8oXlwifFwiJCkvZywgXCInXCIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICdzdHJpbmcnKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbmFtZSArICc6ICcgKyBzdHI7XG59XG5cbmZ1bmN0aW9uIGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKSB7XG4gIGlmIChpc1VuZGVmaW5lZCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCd1bmRlZmluZWQnLCAndW5kZWZpbmVkJyk7XG4gIGlmIChpc1N0cmluZyh2YWx1ZSkpIHtcbiAgICB2YXIgc2ltcGxlID0gJ1xcJycgKyBKU09OLnN0cmluZ2lmeSh2YWx1ZSkucmVwbGFjZSgvXlwifFwiJC9nLCAnJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJykgKyAnXFwnJztcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoc2ltcGxlLCAnc3RyaW5nJyk7XG4gIH1cbiAgaWYgKGlzTnVtYmVyKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJycgKyB2YWx1ZSwgJ251bWJlcicpO1xuICBpZiAoaXNCb29sZWFuKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJycgKyB2YWx1ZSwgJ2Jvb2xlYW4nKTtcbiAgLy8gRm9yIHNvbWUgcmVhc29uIHR5cGVvZiBudWxsIGlzIFwib2JqZWN0XCIsIHNvIHNwZWNpYWwgY2FzZSBoZXJlLlxuICBpZiAoaXNOdWxsKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ251bGwnLCAnbnVsbCcpO1xufVxuXG5mdW5jdGlvbiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcykge1xuICB2YXIgbnVtTGluZXNFc3QgPSAwO1xuICB2YXIgbGVuZ3RoID0gcmVkdWNlKG91dHB1dCwgZnVuY3Rpb24ocHJldiwgY3VyKSB7XG4gICAgbnVtTGluZXNFc3QrKztcbiAgICBpZiAoY3VyLmluZGV4T2YoJ1xcbicpID49IDApIG51bUxpbmVzRXN0Kys7XG4gICAgcmV0dXJuIHByZXYgKyBjdXIucmVwbGFjZSgvXFx1MDAxYlxcW1xcZFxcZD9tL2csICcnKS5sZW5ndGggKyAxO1xuICB9LCAwKTtcblxuICBpZiAobGVuZ3RoID4gNjApIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICtcbiAgICAgICAgICAgKGJhc2UgPT09ICcnID8gJycgOiBiYXNlICsgJ1xcbiAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIG91dHB1dC5qb2luKCcsXFxuICAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIGJyYWNlc1sxXTtcbiAgfVxuXG4gIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgJyAnICsgb3V0cHV0LmpvaW4oJywgJykgKyAnICcgKyBicmFjZXNbMV07XG59XG5cbmZ1bmN0aW9uIF9leHRlbmQob3JpZ2luLCBhZGQpIHtcbiAgLy8gRG9uJ3QgZG8gYW55dGhpbmcgaWYgYWRkIGlzbid0IGFuIG9iamVjdFxuICBpZiAoIWFkZCB8fCAhaXNPYmplY3QoYWRkKSkgcmV0dXJuIG9yaWdpbjtcblxuICB2YXIga2V5cyA9IG9iamVjdEtleXMoYWRkKTtcbiAgdmFyIGkgPSBrZXlzLmxlbmd0aDtcbiAgd2hpbGUgKGktLSkge1xuICAgIG9yaWdpbltrZXlzW2ldXSA9IGFkZFtrZXlzW2ldXTtcbiAgfVxuICByZXR1cm4gb3JpZ2luO1xufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uIChhcnIpIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChhcnIpID09ICdbb2JqZWN0IEFycmF5XSc7XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCJcblxuLy8gVGhpcyBpcyBhIHJlcG9ydGVyIHRoYXQgbWltaWNzIE1vY2hhJ3MgYGRvdGAgcmVwb3J0ZXJcblxudmFyIFIgPSByZXF1aXJlKFwiLi4vbGliL3JlcG9ydGVyXCIpXG5cbmZ1bmN0aW9uIHdpZHRoKCkge1xuICAgIHJldHVybiBSLndpbmRvd1dpZHRoKCkgKiA0IC8gMyB8IDBcbn1cblxuZnVuY3Rpb24gcHJpbnREb3QoXywgY29sb3IpIHtcbiAgICBpZiAoXy5zdGF0ZS5jb3VudGVyKysgJSB3aWR0aCgpID09PSAwKSB7XG4gICAgICAgIHJldHVybiBfLndyaXRlKFIubmV3bGluZSgpICsgXCIgIFwiKVxuICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiBfLndyaXRlKFIuY29sb3IoY29sb3IsIFIuc3ltYm9scygpLkRvdCkpIH0pXG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIF8ud3JpdGUoUi5jb2xvcihjb2xvciwgUi5zeW1ib2xzKCkuRG90KSlcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUi5vbih7XG4gICAgYWNjZXB0czogW1wid3JpdGVcIiwgXCJyZXNldFwiLCBcImNvbG9yc1wiXSxcbiAgICBjcmVhdGU6IFIuY29uc29sZVJlcG9ydGVyLFxuICAgIGJlZm9yZTogUi5zZXRDb2xvcixcbiAgICBhZnRlcjogUi51bnNldENvbG9yLFxuICAgIGluaXQ6IGZ1bmN0aW9uIChzdGF0ZSkgeyBzdGF0ZS5jb3VudGVyID0gMCB9LFxuXG4gICAgcmVwb3J0OiBmdW5jdGlvbiAoXywgcmVwb3J0KSB7XG4gICAgICAgIGlmIChyZXBvcnQuaXNFbnRlciB8fCByZXBvcnQuaXNQYXNzKSB7XG4gICAgICAgICAgICByZXR1cm4gcHJpbnREb3QoXywgUi5zcGVlZChyZXBvcnQpKVxuICAgICAgICB9IGVsc2UgaWYgKHJlcG9ydC5pc0hvb2sgfHwgcmVwb3J0LmlzRmFpbCkge1xuICAgICAgICAgICAgXy5wdXNoRXJyb3IocmVwb3J0KVxuICAgICAgICAgICAgcmV0dXJuIHByaW50RG90KF8sIFwiZmFpbFwiKVxuICAgICAgICB9IGVsc2UgaWYgKHJlcG9ydC5pc1NraXApIHtcbiAgICAgICAgICAgIHJldHVybiBwcmludERvdChfLCBcInNraXBcIilcbiAgICAgICAgfSBlbHNlIGlmIChyZXBvcnQuaXNFbmQpIHtcbiAgICAgICAgICAgIHJldHVybiBfLnByaW50KCkudGhlbihfLnByaW50UmVzdWx0cy5iaW5kKF8pKVxuICAgICAgICB9IGVsc2UgaWYgKHJlcG9ydC5pc0Vycm9yKSB7XG4gICAgICAgICAgICBpZiAoXy5zdGF0ZS5jb3VudGVyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF8ucHJpbnQoKS50aGVuKF8ucHJpbnRFcnJvci5iaW5kKF8sIHJlcG9ydCkpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBfLnByaW50RXJyb3IocmVwb3J0KVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuICAgICAgICB9XG4gICAgfSxcbn0pXG4iLCJcInVzZSBzdHJpY3RcIlxuXG4vLyBleHBvcnRzLmRvbSA9IHJlcXVpcmUoXCIuL2RvbVwiKVxuZXhwb3J0cy5kb3QgPSByZXF1aXJlKFwiLi9kb3RcIilcbmV4cG9ydHMuc3BlYyA9IHJlcXVpcmUoXCIuL3NwZWNcIilcbmV4cG9ydHMudGFwID0gcmVxdWlyZShcIi4vdGFwXCIpXG4iLCJcInVzZSBzdHJpY3RcIlxuXG4vLyBUaGlzIGlzIGEgcmVwb3J0ZXIgdGhhdCBtaW1pY3MgTW9jaGEncyBgc3BlY2AgcmVwb3J0ZXIuXG5cbnZhciBSID0gcmVxdWlyZShcIi4uL2xpYi9yZXBvcnRlclwiKVxudmFyIGMgPSBSLmNvbG9yXG5cbmZ1bmN0aW9uIGluZGVudChsZXZlbCkge1xuICAgIHZhciByZXQgPSBcIlwiXG5cbiAgICB3aGlsZSAobGV2ZWwtLSkgcmV0ICs9IFwiICBcIlxuICAgIHJldHVybiByZXRcbn1cblxuZnVuY3Rpb24gZ2V0TmFtZShsZXZlbCwgcmVwb3J0KSB7XG4gICAgcmV0dXJuIHJlcG9ydC5wYXRoW2xldmVsIC0gMV0ubmFtZVxufVxuXG5mdW5jdGlvbiBwcmludFJlcG9ydChfLCBpbml0KSB7XG4gICAgaWYgKF8uc3RhdGUubGFzdElzTmVzdGVkICYmIF8uc3RhdGUubGV2ZWwgPT09IDEpIHtcbiAgICAgICAgcmV0dXJuIF8ucHJpbnQoKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIF8uc3RhdGUubGFzdElzTmVzdGVkID0gZmFsc2VcbiAgICAgICAgICAgIHJldHVybiBfLnByaW50KGluZGVudChfLnN0YXRlLmxldmVsKSArIGluaXQoKSlcbiAgICAgICAgfSlcbiAgICB9IGVsc2Uge1xuICAgICAgICBfLnN0YXRlLmxhc3RJc05lc3RlZCA9IGZhbHNlXG4gICAgICAgIHJldHVybiBfLnByaW50KGluZGVudChfLnN0YXRlLmxldmVsKSArIGluaXQoKSlcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUi5vbih7XG4gICAgYWNjZXB0czogW1wid3JpdGVcIiwgXCJyZXNldFwiLCBcImNvbG9yc1wiXSxcbiAgICBjcmVhdGU6IFIuY29uc29sZVJlcG9ydGVyLFxuICAgIGJlZm9yZTogUi5zZXRDb2xvcixcbiAgICBhZnRlcjogUi51bnNldENvbG9yLFxuXG4gICAgaW5pdDogZnVuY3Rpb24gKHN0YXRlKSB7XG4gICAgICAgIHN0YXRlLmxldmVsID0gMVxuICAgICAgICBzdGF0ZS5sYXN0SXNOZXN0ZWQgPSBmYWxzZVxuICAgIH0sXG5cbiAgICByZXBvcnQ6IGZ1bmN0aW9uIChfLCByZXBvcnQpIHtcbiAgICAgICAgaWYgKHJlcG9ydC5pc1N0YXJ0KSB7XG4gICAgICAgICAgICByZXR1cm4gXy5wcmludCgpXG4gICAgICAgIH0gZWxzZSBpZiAocmVwb3J0LmlzRW50ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBwcmludFJlcG9ydChfLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGdldE5hbWUoXy5zdGF0ZS5sZXZlbCsrLCByZXBvcnQpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9IGVsc2UgaWYgKHJlcG9ydC5pc0xlYXZlKSB7XG4gICAgICAgICAgICBfLnN0YXRlLmxldmVsLS1cbiAgICAgICAgICAgIF8uc3RhdGUubGFzdElzTmVzdGVkID0gdHJ1ZVxuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuICAgICAgICB9IGVsc2UgaWYgKHJlcG9ydC5pc1Bhc3MpIHtcbiAgICAgICAgICAgIHJldHVybiBwcmludFJlcG9ydChfLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN0ciA9XG4gICAgICAgICAgICAgICAgICAgIGMoXCJjaGVja21hcmtcIiwgUi5zeW1ib2xzKCkuUGFzcyArIFwiIFwiKSArXG4gICAgICAgICAgICAgICAgICAgIGMoXCJwYXNzXCIsIGdldE5hbWUoXy5zdGF0ZS5sZXZlbCwgcmVwb3J0KSlcblxuICAgICAgICAgICAgICAgIHZhciBzcGVlZCA9IFIuc3BlZWQocmVwb3J0KVxuXG4gICAgICAgICAgICAgICAgaWYgKHNwZWVkICE9PSBcImZhc3RcIikge1xuICAgICAgICAgICAgICAgICAgICBzdHIgKz0gYyhzcGVlZCwgXCIgKFwiICsgcmVwb3J0LmR1cmF0aW9uICsgXCJtcylcIilcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gc3RyXG4gICAgICAgICAgICB9KVxuICAgICAgICB9IGVsc2UgaWYgKHJlcG9ydC5pc0hvb2sgfHwgcmVwb3J0LmlzRmFpbCkge1xuICAgICAgICAgICAgcmV0dXJuIHByaW50UmVwb3J0KF8sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBfLnB1c2hFcnJvcihyZXBvcnQpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGMoXCJmYWlsXCIsXG4gICAgICAgICAgICAgICAgICAgIF8uZXJyb3JzLmxlbmd0aCArIFwiKSBcIiArIGdldE5hbWUoXy5zdGF0ZS5sZXZlbCwgcmVwb3J0KSArXG4gICAgICAgICAgICAgICAgICAgIFIuZm9ybWF0UmVzdChyZXBvcnQpKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSBlbHNlIGlmIChyZXBvcnQuaXNTa2lwKSB7XG4gICAgICAgICAgICByZXR1cm4gcHJpbnRSZXBvcnQoXywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjKFwic2tpcFwiLCBcIi0gXCIgKyBnZXROYW1lKF8uc3RhdGUubGV2ZWwsIHJlcG9ydCkpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHJlcG9ydC5pc0VuZCkgcmV0dXJuIF8ucHJpbnRSZXN1bHRzKClcbiAgICAgICAgaWYgKHJlcG9ydC5pc0Vycm9yKSByZXR1cm4gXy5wcmludEVycm9yKHJlcG9ydClcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuICAgIH0sXG59KVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxuLy8gVGhpcyBpcyBhIGJhc2ljIFRBUC1nZW5lcmF0aW5nIHJlcG9ydGVyLlxuXG52YXIgcGVhY2ggPSByZXF1aXJlKFwiLi4vbGliL3V0aWxcIikucGVhY2hcbnZhciBSID0gcmVxdWlyZShcIi4uL2xpYi9yZXBvcnRlclwiKVxudmFyIGluc3BlY3QgPSByZXF1aXJlKFwiLi4vbGliL3JlcGxhY2VkL2luc3BlY3RcIilcblxuZnVuY3Rpb24gc2hvdWxkQnJlYWsobWluTGVuZ3RoLCBzdHIpIHtcbiAgICByZXR1cm4gc3RyLmxlbmd0aCA+IFIud2luZG93V2lkdGgoKSAtIG1pbkxlbmd0aCB8fCAvXFxyP1xcbnxbOj8tXS8udGVzdChzdHIpXG59XG5cbmZ1bmN0aW9uIHRlbXBsYXRlKF8sIHJlcG9ydCwgdG1wbCwgc2tpcCkge1xuICAgIGlmICghc2tpcCkgXy5zdGF0ZS5jb3VudGVyKytcbiAgICB2YXIgcGF0aCA9IFIuam9pblBhdGgocmVwb3J0KS5yZXBsYWNlKC9cXCQvZywgXCIkJCQkXCIpXG5cbiAgICByZXR1cm4gXy5wcmludChcbiAgICAgICAgdG1wbC5yZXBsYWNlKC8lYy9nLCBfLnN0YXRlLmNvdW50ZXIpXG4gICAgICAgICAgICAucmVwbGFjZSgvJXAvZywgcGF0aCArIFIuZm9ybWF0UmVzdChyZXBvcnQpKSlcbn1cblxuZnVuY3Rpb24gcHJpbnRMaW5lcyhfLCB2YWx1ZSwgc2tpcEZpcnN0KSB7XG4gICAgdmFyIGxpbmVzID0gdmFsdWUuc3BsaXQoL1xccj9cXG4vZylcblxuICAgIGlmIChza2lwRmlyc3QpIGxpbmVzLnNoaWZ0KClcbiAgICByZXR1cm4gcGVhY2gobGluZXMsIGZ1bmN0aW9uIChsaW5lKSB7IHJldHVybiBfLnByaW50KFwiICAgIFwiICsgbGluZSkgfSlcbn1cblxuZnVuY3Rpb24gcHJpbnRSYXcoXywga2V5LCBzdHIpIHtcbiAgICBpZiAoc2hvdWxkQnJlYWsoa2V5Lmxlbmd0aCwgc3RyKSkge1xuICAgICAgICByZXR1cm4gXy5wcmludChcIiAgXCIgKyBrZXkgKyBcIjogfC1cIilcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gcHJpbnRMaW5lcyhfLCBzdHIsIGZhbHNlKSB9KVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBfLnByaW50KFwiICBcIiArIGtleSArIFwiOiBcIiArIHN0cilcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHByaW50VmFsdWUoXywga2V5LCB2YWx1ZSkge1xuICAgIHJldHVybiBwcmludFJhdyhfLCBrZXksIGluc3BlY3QodmFsdWUpKVxufVxuXG5mdW5jdGlvbiBwcmludExpbmUocCwgXywgbGluZSkge1xuICAgIHJldHVybiBwLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gXy5wcmludChsaW5lKSB9KVxufVxuXG5mdW5jdGlvbiBwcmludEVycm9yKF8sIHJlcG9ydCkge1xuICAgIHZhciBlcnIgPSByZXBvcnQuZXJyb3JcblxuICAgIGlmICghKGVyciBpbnN0YW5jZW9mIEVycm9yKSkge1xuICAgICAgICByZXR1cm4gcHJpbnRWYWx1ZShfLCBcInZhbHVlXCIsIGVycilcbiAgICB9XG5cbiAgICAvLyBMZXQncyAqbm90KiBkZXBlbmQgb24gdGhlIGNvbnN0cnVjdG9yIGJlaW5nIFRoYWxsaXVtJ3MuLi5cbiAgICBpZiAoZXJyLm5hbWUgIT09IFwiQXNzZXJ0aW9uRXJyb3JcIikge1xuICAgICAgICByZXR1cm4gXy5wcmludChcIiAgc3RhY2s6IHwtXCIpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHByaW50TGluZXMoXywgUi5nZXRTdGFjayhlcnIpLCBmYWxzZSlcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICByZXR1cm4gcHJpbnRWYWx1ZShfLCBcImV4cGVjdGVkXCIsIGVyci5leHBlY3RlZClcbiAgICAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiBwcmludFZhbHVlKF8sIFwiYWN0dWFsXCIsIGVyci5hY3R1YWwpIH0pXG4gICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gcHJpbnRSYXcoXywgXCJtZXNzYWdlXCIsIGVyci5tZXNzYWdlKSB9KVxuICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIF8ucHJpbnQoXCIgIHN0YWNrOiB8LVwiKSB9KVxuICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG1lc3NhZ2UgPSBlcnIubWVzc2FnZVxuXG4gICAgICAgIGVyci5tZXNzYWdlID0gXCJcIlxuICAgICAgICByZXR1cm4gcHJpbnRMaW5lcyhfLCBSLmdldFN0YWNrKGVyciksIHRydWUpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgZXJyLm1lc3NhZ2UgPSBtZXNzYWdlIH0pXG4gICAgfSlcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBSLm9uKHtcbiAgICBhY2NlcHRzOiBbXCJ3cml0ZVwiLCBcInJlc2V0XCJdLFxuICAgIGNyZWF0ZTogUi5jb25zb2xlUmVwb3J0ZXIsXG4gICAgaW5pdDogZnVuY3Rpb24gKHN0YXRlKSB7IHN0YXRlLmNvdW50ZXIgPSAwIH0sXG5cbiAgICByZXBvcnQ6IGZ1bmN0aW9uIChfLCByZXBvcnQpIHtcbiAgICAgICAgaWYgKHJlcG9ydC5pc1N0YXJ0KSB7XG4gICAgICAgICAgICByZXR1cm4gXy5wcmludChcIlRBUCB2ZXJzaW9uIDEzXCIpXG4gICAgICAgIH0gZWxzZSBpZiAocmVwb3J0LmlzRW50ZXIpIHtcbiAgICAgICAgICAgIC8vIFByaW50IGEgbGVhZGluZyBjb21tZW50LCB0byBtYWtlIHNvbWUgVEFQIGZvcm1hdHRlcnMgcHJldHRpZXIuXG4gICAgICAgICAgICByZXR1cm4gdGVtcGxhdGUoXywgcmVwb3J0LCBcIiMgJXBcIiwgdHJ1ZSlcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRlbXBsYXRlKF8sIHJlcG9ydCwgXCJvayAlY1wiKSB9KVxuICAgICAgICB9IGVsc2UgaWYgKHJlcG9ydC5pc1Bhc3MpIHtcbiAgICAgICAgICAgIHJldHVybiB0ZW1wbGF0ZShfLCByZXBvcnQsIFwib2sgJWMgJXBcIilcbiAgICAgICAgfSBlbHNlIGlmIChyZXBvcnQuaXNGYWlsIHx8IHJlcG9ydC5pc0hvb2spIHtcbiAgICAgICAgICAgIHJldHVybiB0ZW1wbGF0ZShfLCByZXBvcnQsIFwibm90IG9rICVjICVwXCIpXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiBfLnByaW50KFwiICAtLS1cIikgfSlcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIHByaW50RXJyb3IoXywgcmVwb3J0KSB9KVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gXy5wcmludChcIiAgLi4uXCIpIH0pXG4gICAgICAgIH0gZWxzZSBpZiAocmVwb3J0LmlzU2tpcCkge1xuICAgICAgICAgICAgcmV0dXJuIHRlbXBsYXRlKF8sIHJlcG9ydCwgXCJvayAlYyAjIHNraXAgJXBcIilcbiAgICAgICAgfSBlbHNlIGlmIChyZXBvcnQuaXNFbmQpIHtcbiAgICAgICAgICAgIHZhciBwID0gXy5wcmludChcIjEuLlwiICsgXy5zdGF0ZS5jb3VudGVyKVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gXy5wcmludChcIiMgdGVzdHMgXCIgKyBfLnRlc3RzKSB9KVxuXG4gICAgICAgICAgICBpZiAoXy5wYXNzKSBwID0gcHJpbnRMaW5lKHAsIF8sIFwiIyBwYXNzIFwiICsgXy5wYXNzKVxuICAgICAgICAgICAgaWYgKF8uZmFpbCkgcCA9IHByaW50TGluZShwLCBfLCBcIiMgZmFpbCBcIiArIF8uZmFpbClcbiAgICAgICAgICAgIGlmIChfLnNraXApIHAgPSBwcmludExpbmUocCwgXywgXCIjIHNraXAgXCIgKyBfLnNraXApXG4gICAgICAgICAgICByZXR1cm4gcHJpbnRMaW5lKHAsIF8sIFwiIyBkdXJhdGlvbiBcIiArIFIuZm9ybWF0VGltZShfLmR1cmF0aW9uKSlcbiAgICAgICAgfSBlbHNlIGlmIChyZXBvcnQuaXNFcnJvcikge1xuICAgICAgICAgICAgcmV0dXJuIF8ucHJpbnQoXCJCYWlsIG91dCFcIilcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIF8ucHJpbnQoXCIgIC0tLVwiKSB9KVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gcHJpbnRFcnJvcihfLCByZXBvcnQpIH0pXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiBfLnByaW50KFwiICAuLi5cIikgfSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWRcbiAgICAgICAgfVxuICAgIH0sXG59KVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi4vbGliL2Jyb3dzZXItYnVuZGxlXCIpXG5cbnJlcXVpcmUoXCIuLi9taWdyYXRlL2luZGV4XCIpXG5cbi8vIE5vdGU6IGJvdGggb2YgdGhlc2UgYXJlIGRlcHJlY2F0ZWRcbm1vZHVsZS5leHBvcnRzLmFzc2VydGlvbnMgPSByZXF1aXJlKFwiLi4vYXNzZXJ0aW9uc1wiKVxubW9kdWxlLmV4cG9ydHMuY3JlYXRlID0gcmVxdWlyZShcIi4uL21pZ3JhdGUvY29tbW9uXCIpLmRlcHJlY2F0ZShcbiAgICBcImB0bC5jcmVhdGVgIGlzIGRlcHJlY2F0ZWQuIFBsZWFzZSB1c2UgYHRsLnJvb3RgIGluc3RlYWQuXCIsXG4gICAgbW9kdWxlLmV4cG9ydHMucm9vdClcbiJdfQ==
