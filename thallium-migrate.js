require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict"

module.exports = require("clean-assert")

},{"clean-assert":34}],2:[function(require,module,exports){
"use strict"

/**
 * Core TDD-style assertions. These are done by a composition of DSLs, since
 * there is *so* much repetition.
 */

var match = require("clean-match")
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

binary("match", match.loose, [
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

var includesMatchAll = makeIncludes(true, match.loose)
var includesMatchAny = makeIncludes(false, match.loose)

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

var hasMatchAllKeys = hasKeysType(true, match.loose)
var hasMatchAnyKeys = hasKeysType(false, match.loose)

makeHasKeys("hasMatchKeys", hasMatchAllKeys, false, "Expected {actual} to match all keys in {keys}")
makeHasKeys("notHasMatchAllKeys", hasMatchAllKeys, true, "Expected {actual} to not match all keys in {keys}")
makeHasKeys("hasMatchAnyKeys", hasMatchAnyKeys, false, "Expected {actual} to match any key in {keys}")
makeHasKeys("notHasMatchKeys", hasMatchAnyKeys, true, "Expected {actual} to not match any key in {keys}")

},{"./migrate/common":28,"clean-match":41}],3:[function(require,module,exports){
"use strict"

module.exports = require("./lib/dom")

},{"./lib/dom":13}],4:[function(require,module,exports){
"use strict"

/**
 * Main entry point, for those wanting to use this framework with the core
 * assertions.
 */
var Thallium = require("./lib/api/thallium")

module.exports = new Thallium()

},{"./lib/api/thallium":8}],5:[function(require,module,exports){
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

},{"./lib/api/thallium":8,"./lib/core/reports":11}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){
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

},{"../core/tests":12,"../methods":19,"./hooks":6}],8:[function(require,module,exports){
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
     * Check if this has a reporter.
     */
    get hasReporter() {
        return this._.root.reporter != null
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

        if (this._.locked) {
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

},{"../core/only":10,"../core/tests":12,"../methods":19,"./hooks":6,"./reflect":7}],9:[function(require,module,exports){
"use strict"

/**
 * This is the entry point for the Browserify bundle. Note that it *also* will
 * run as part of the tests in Node (unbundled), and it theoretically could be
 * run in Node or a runtime limited to only ES5 support (e.g. Rhino, Nashorn, or
 * embedded V8), so do *not* assume browser globals are present.
 */

exports.t = require("../index")
exports.assert = require("../assert")
exports.r = require("../r")
var dom = require("../dom")

exports.dom = dom.create
// if (global.document != null && global.document.currentScript != null) {
//     dom.autoload(global.document.currentScript)
// }

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

},{"../assert":1,"../dom":3,"../index":4,"../internal":5,"../r":67,"./settings":26}],10:[function(require,module,exports){
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

},{}],11:[function(require,module,exports){
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

},{"../methods":19}],12:[function(require,module,exports){
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
 * Clear the tests in place.
 */
exports.clearTests = function (parent) {
    parent.tests = null
}

/**
 * Execute the tests
 */

function path(test) {
    var ret = []

    while (test.root !== test) {
        ret.push({name: test.name, index: test.index})
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
var addStack = typeof new Error().stack !== "string"
    ? function addStack(e) {
        try {
            if (e instanceof Error && e.stack == null) throw e
        } finally {
            return e
        }
    }
    : function (e) { return e }

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
                asyncFinish(state, tryFail(addStack(e)))
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
    .then(
        function (result) { test.locked = true; return result },
        function (error) { test.locked = true; throw error })
    .then(function (result) {
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

},{"../methods":19,"../util":27,"./only":10,"./reports":11}],13:[function(require,module,exports){
"use strict"

/**
 * The DOM reporter and loader entry point. See the README.md for more details.
 */

var initialize = require("./initialize")
// var t = require("../../index")
// var assert = require("../../assert")

exports.create = function (opts) {
    if (opts == null) return initialize({})
    if (Array.isArray(opts)) return initialize({files: opts})
    if (typeof opts === "object") return initialize(opts)
    throw new TypeError("`opts` must be an object or array of files if passed")
}

// Currently broken, because this isn't autoloaded yet.
// exports.autoload = function (script) {
//     var files = script.getAttribute("data-files")
//
//     if (!files) return
//
//     function set(opts, attr, transform) {
//         var value = script.getAttribute("data-" + attr)
//
//         if (value) opts[attr] = transform(value)
//     }
//
//     var opts = {files: files.trim().split(/\s+/g)}
//
//     set(opts, "timeout", Number)
//     set(opts, "preload", Function)
//     set(opts, "prerun", Function)
//     set(opts, "postrun", Function)
//     set(opts, "error", function (attr) {
//         return new Function("err", attr) // eslint-disable-line
//     })
//
//     // Convenience.
//     global.t = t
//     global.assert = assert
//
//     if (global.document.readyState !== "loading") {
//         initialize(opts).run()
//     } else {
//         global.document.addEventListener("DOMContentLoaded", function () {
//             initialize(opts).run()
//         })
//     }
// }

},{"./initialize":14}],14:[function(require,module,exports){
"use strict"

/**
 * The reporter and test initialization sequence, and script loading. This
 * doesn't understand anything view-wise.
 */

var defaultT = require("../../index")
var R = require("../reporter")
var D = require("./inject")
var runTests = require("./run-tests")
var injectStyles = require("./inject-styles")
var View = require("./view")
var methods = require("../methods")

function Tree(name) {
    this.name = name
    this.status = R.Status.Unknown
    this.node = null
    this.children = Object.create(null)
}

var reporter = R.on("dom", {
    accepts: [],
    create: function (opts, methods) {
        var reporter = new R.Reporter(Tree, undefined, methods)

        reporter.opts = opts
        return reporter
    },

    // Give the browser a chance to repaint before continuing (microtasks
    // normally block rendering).
    after: function () {
        return new Promise(View.nextFrame)
    },

    report: function (_, report) {
        return View.report(_, report)
    },
})

function noop() {}

function setDefaultsChecked(opts) {
    if (opts.title == null) opts.title = "Thallium tests"
    if (opts.timeout == null) opts.timeout = 5000
    if (opts.files == null) opts.files = []
    if (opts.preload == null) opts.preload = noop
    if (opts.prerun == null) opts.prerun = noop
    if (opts.postrun == null) opts.postrun = noop
    if (opts.error == null) opts.error = noop
    if (opts.thallium == null) opts.thallium = defaultT

    if (typeof opts.title !== "string") {
        throw new TypeError("`opts.title` must be a string if passed")
    }

    if (typeof opts.timeout !== "number") {
        throw new TypeError("`opts.timeout` must be a number if passed")
    }

    if (!Array.isArray(opts.files)) {
        throw new TypeError("`opts.files` must be an array if passed")
    }

    if (typeof opts.preload !== "function") {
        throw new TypeError("`opts.preload` must be a function if passed")
    }

    if (typeof opts.prerun !== "function") {
        throw new TypeError("`opts.prerun` must be a function if passed")
    }

    if (typeof opts.postrun !== "function") {
        throw new TypeError("`opts.postrun` must be a function if passed")
    }

    if (typeof opts.error !== "function") {
        throw new TypeError("`opts.error` must be a function if passed")
    }

    if (typeof opts.thallium !== "object") {
        throw new TypeError(
            "`opts.thallium` must be a Thallium instance if passed")
    }
}

function onReady(init) {
    if (D.document.body != null) return Promise.resolve(init())
    return new Promise(function (resolve) {
        D.document.addEventListener("DOMContentLoaded", function () {
            resolve(init())
        }, false)
    })
}

function DOM(opts) {
    this._opts = opts
    this._destroyPromise = undefined
    this._data = onReady(function () {
        setDefaultsChecked(opts)
        if (!D.document.title) D.document.title = opts.title
        injectStyles()
        var data = View.init(opts)

        opts.thallium.reporter(reporter, data.state)
        return data
    })
}

methods(DOM, {
    run: function () {
        if (this._destroyPromise != null) {
            return Promise.reject(new Error(
                "The test suite must not be run after the view has been " +
                "detached."
            ))
        }

        var opts = this._opts

        return this._data.then(function (data) {
            return runTests(opts, data.state)
        })
    },

    detach: function () {
        if (this._destroyPromise != null) return this._destroyPromise
        var self = this

        return this._destroyPromise = self._data.then(function (data) {
            data.state.locked = true
            if (data.state.currentPromise == null) return data
            return data.state.currentPromise.then(function () { return data })
        })
        .then(function (data) {
            self._opts = undefined
            self._data = self._destroyPromise

            while (data.root.firstChild) {
                data.root.removeChild(data.root.firstChild)
            }
        })
    },
})

module.exports = function (opts) {
    return new DOM(opts)
}

},{"../../index":4,"../methods":19,"../reporter":22,"./inject":16,"./inject-styles":15,"./run-tests":17,"./view":18}],15:[function(require,module,exports){
"use strict"

var Util = require("../util")
var D = require("./inject")

/**
 * The reporter stylesheet. Here's the format:
 *
 * // Single item
 * ".selector": {
 *     // props...
 * }
 *
 * // Duplicate entries
 * ".selector": {
 *     "prop": [
 *         // values...
 *     ],
 * }
 *
 * // Duplicate selectors
 * ".selector": [
 *     // values...
 * ]
 *
 * // Media query
 * "@media screen": {
 *     // selectors...
 * }
 *
 * Note that CSS strings *must* be quoted inside the value.
 */

var styles = Util.lazy(function () {
    var hasOwn = Object.prototype.hasOwnProperty

    /**
     * Partially taken and adapted from normalize.css (licensed under the MIT
     * License).
     * https://github.com/necolas/normalize.css
     */
    var styleObject = {
        "#tl": {
            "font-family": "sans-serif",
            "line-height": "1.15",
            "-ms-text-size-adjust": "100%",
            "-webkit-text-size-adjust": "100%",
        },

        "#tl button": {
            "font-family": "sans-serif",
            "line-height": "1.15",
            "overflow": "visible",
            "font-size": "100%",
            "margin": "0",
            "text-transform": "none",
            "-webkit-appearance": "button",
        },

        "#tl h1": {
            "font-size": "2em",
            "margin": "0.67em 0",
        },

        "#tl a": {
            "background-color": "transparent",
            "-webkit-text-decoration-skip": "objects",
        },

        "#tl a:active, #tl a:hover": {
            "outline-width": "0",
        },

        "#tl button::-moz-focus-inner": {
            "border-style": "none",
            "padding": "0",
        },

        "#tl button:-moz-focusring": {
            outline: "1px dotted ButtonText",
        },

        /**
         * Base styles. Note that this CSS is designed to intentionally override
         * most things that could propagate.
         */
        "#tl *": [
            {"text-align": "left"},
            {"text-align": "start"},
        ],

        "#tl .tl-report, #tl .tl-report ul": {
            "list-style-type": "none",
        },

        "#tl li ~ .tl-suite": {
            "padding-top": "1em",
        },

        "#tl .tl-suite > h2": {
            "color": "black",
            "font-size": "1.5em",
            "font-weight": "bold",
            "margin-bottom": "0.5em",
        },

        "#tl .tl-suite .tl-suite > h2": {
            "font-size": "1.2em",
            "margin-bottom": "0.3em",
        },

        "#tl .tl-suite .tl-suite .tl-suite > h2": {
            "font-size": "1.2em",
            "margin-bottom": "0.2em",
            "font-weight": "normal",
        },

        "#tl .tl-test > h2": {
            "color": "black",
            "font-size": "1em",
            "font-weight": "normal",
            "margin": "0",
        },

        "#tl .tl-test > :first-child::before": {
            "display": "inline-block",
            "font-weight": "bold",
            "width": "1.2em",
            "text-align": "center",
            "font-family": "sans-serif",
            "text-shadow": "0 3px 2px #969696",
        },

        "#tl .tl-test.tl-fail > h2, #tl .tl-test.tl-error > h2": {
            color: "#c00",
        },

        "#tl .tl-test.tl-skip > h2": {
            color: "#08c",
        },

        "#tl .tl-test.tl-pass > :first-child::before": {
            content: "'✓'",
            color: "#0c0",
        },

        "#tl .tl-test.tl-fail > :first-child::before": {
            content: "'✖'",
        },

        "#tl .tl-test.tl-error > :first-child::before": {
            content: "'!'",
        },

        "#tl .tl-test.tl-skip > :first-child::before": {
            content: "'−'",
        },

        "#tl .tl-pre, #tl .tl-diff-header": {
            // normalize.css: Correct the inheritance and scaling of font size
            // in all browsers
            "font-family": "monospace, monospace",
            "background": "#f0f0f0",
            "white-space": "pre",
            "font-size": "0.85em",
        },

        "#tl .tl-pre": {
          "min-width": "100%",
          "float": "left",
          "clear": "left",
        },

        "#tl .tl-line": {
            "display": "block",
            "margin": "0 0.25em",
            "width": "99%", // Because Firefox sucks
        },

        "#tl .tl-diff-header > *": {
            padding: "0.25em",
        },

        "#tl .tl-diff-header": {
            "padding": "0.25em",
            "margin-bottom": "0.5em",
            "display": "inline-block",
        },

        "#tl .tl-line:first-child, #tl .tl-diff-header ~ .tl-line": {
            "padding-top": "0.25em",
        },

        "#tl .tl-line:last-child": {
            "padding-bottom": "0.25em",
        },

        "#tl .tl-fail .tl-display": {
            margin: "0.5em",
        },

        "#tl .tl-display > *": {
            overflow: "auto",
        },

        "#tl .tl-display > :not(:last-child)": {
            "margin-bottom": "0.5em",
        },

        "#tl .tl-diff-added": {
            "color": "#0c0",
            "font-weight": "bold",
        },

        "#tl .tl-diff-removed": {
            "color": "#c00",
            "font-weight": "bold",
        },

        "#tl .tl-stack .tl-line": {
            color: "#800",
        },

        "#tl .tl-diff::before, #tl .tl-stack::before": {
            "font-weight": "normal",
            "margin": "0.25em 0.25em 0.25em 0",
            "display": "block",
            "font-style": "italic",
        },

        "#tl .tl-diff::before": {
            content: "'Diff:'",
        },

        "#tl .tl-stack::before": {
            content: "'Stack:'",
        },

        "#tl .tl-header": {
            "text-align": "right",
        },

        "#tl .tl-header > *": {
            "display": "inline-block",
            "text-align": "center",
            "padding": "0.5em 0.75em",
            "border": "2px solid #00c",
            "border-radius": "1em",
            "background-color": "transparent",
            "margin": "0.25em 0.5em",
        },

        "#tl .tl-header > :focus": {
            outline: "none",
        },

        "#tl .tl-run": {
            "border-color": "#080",
            "background-color": "#0c0",
            "color": "white",
            "width": "6em",
        },

        "#tl .tl-run:hover": {
            "background-color": "#8c8",
            "color": "white",
        },

        "#tl .tl-toggle.tl-pass": {
            "border-color": "#0c0",
        },

        "#tl .tl-toggle.tl-fail": {
            "border-color": "#c00",
        },

        "#tl .tl-toggle.tl-skip": {
            "border-color": "#08c",
        },

        "#tl .tl-toggle.tl-pass.tl-active, #tl .tl-toggle.tl-pass:active": {
            "border-color": "#080",
            "background-color": "#0c0",
        },

        "#tl .tl-toggle.tl-fail.tl-active, #tl .tl-toggle.tl-fail:active": {
            "border-color": "#800",
            "background-color": "#c00",
        },

        "#tl .tl-toggle.tl-skip.tl-active, #tl .tl-toggle.tl-skip:active": {
            "border-color": "#058",
            "background-color": "#08c",
        },

        "#tl .tl-toggle.tl-pass:hover": {
            "border-color": "#0c0",
            "background-color": "#afa",
        },

        "#tl .tl-toggle.tl-fail:hover": {
            "border-color": "#c00",
            "background-color": "#faa",
        },

        "#tl .tl-toggle.tl-skip:hover": {
            "border-color": "#08c",
            "background-color": "#bdf",
        },

        "#tl .tl-report.tl-pass .tl-test:not(.tl-pass)": {
            display: "none",
        },

        "#tl .tl-report.tl-fail .tl-test:not(.tl-fail)": {
            display: "none",
        },

        "#tl .tl-report.tl-skip .tl-test:not(.tl-skip)": {
            display: "none",
        },
    }

    var css = ""

    function appendBase(selector, props) {
        css += selector + "{"

        if (Array.isArray(props)) {
            for (var i = 0; i < props.length; i++) {
                appendProps(props[i])
            }
        } else {
            appendProps(props)
        }

        css += "}"
    }

    function appendProps(props) {
        for (var key in props) {
            if (hasOwn.call(props, key)) {
                if (typeof props[key] === "object") {
                    appendBase(key, props[key])
                } else {
                    css += key + ":" + props[key] + ";"
                }
            }
        }
    }

    for (var selector in styleObject) {
        if (hasOwn.call(styleObject, selector)) {
            appendBase(selector, styleObject[selector])
        }
    }

    return css.concat() // Hint to flatten.
})

module.exports = function () {
    if (D.document.head.querySelector("style[data-tl-style]") == null) {
        var style = D.document.createElement("style")

        style.type = "text/css"
        style.setAttribute("data-tl-style", "")
        if (style.styleSheet) {
            style.styleSheet.cssText = styles()
        } else {
            style.appendChild(D.document.createTextNode(styles()))
        }

        D.document.head.appendChild(style)
    }
}

},{"../util":27,"./inject":16}],16:[function(require,module,exports){
(function (global){
"use strict"

/**
 * The global injections for the DOM. Mainly for debugging.
 */

exports.document = global.document
exports.window = global.window

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],17:[function(require,module,exports){
(function (global){
"use strict"

var Util = require("../util")
var D = require("./inject")
var now = Date.now // Avoid Sinon's mock
var hasOwn = Object.prototype.hasOwnProperty

/**
 * Test runner and script loader
 */

function uncached(file) {
    if (file.indexOf("?") < 0) {
        return file + "?loaded=" + now()
    } else {
        return file + "&loaded=" + now()
    }
}

function loadScript(file, timeout) {
    return new Promise(function (resolve, reject) {
        var script = D.document.createElement("script")
        var timer = global.setTimeout(function () {
            clear()
            reject(new Error("Timeout exceeded loading '" + file + "'"))
        }, timeout)

        function clear(ev) {
            if (ev != null) ev.preventDefault()
            if (ev != null) ev.stopPropagation()
            global.clearTimeout(timer)
            script.onload = undefined
            script.onerror = undefined
            D.document.head.removeChild(script)
        }

        script.src = uncached(file)
        script.async = true
        script.defer = true
        script.onload = function (ev) {
            clear(ev)
            resolve()
        }

        script.onerror = function (ev) {
            clear(ev)
            reject(ev)
        }

        D.document.head.appendChild(script)
    })
}

function tryDelete(key) {
    try {
        delete global[key]
    } catch (_) {
        // ignore
    }
}

function descriptorChanged(a, b) {
    // Note: if the descriptor was removed, it would've been deleted, anyways.
    if (a == null) return false
    if (a.configurable !== b.configurable) return true
    if (a.enumerable !== b.enumerable) return true
    if (a.writable !== b.writable) return true
    if (a.get !== b.get) return true
    if (a.set !== b.set) return true
    if (a.value !== b.value) return true
    return false
}

// These fire deprecation warnings, and thus should be avoided.
var blacklist = Object.freeze({
    webkitStorageInfo: true,
    webkitIndexedDB: true,
})

function findGlobals() {
    var found = Object.keys(global)
    var globals = Object.create(null)

    for (var i = 0; i < found.length; i++) {
        var key = found[i]

        if (!hasOwn.call(blacklist, key)) {
            globals[key] = Object.getOwnPropertyDescriptor(global, key)
        }
    }

    return globals
}

module.exports = function (opts, state) {
    if (state.locked) {
        return Promise.reject(new Error(
            "The test suite must not be run after the view has been detached."
        ))
    }

    if (state.currentPromise != null) return state.currentPromise

    opts.thallium.clearTests()

    // Detect and remove globals created by loaded scripts.
    var globals = findGlobals()

    function cleanup() {
        var found = Object.keys(global)

        for (var i = 0; i < found.length; i++) {
            var key = found[i]

            if (!hasOwn.call(globals, key)) {
                tryDelete(key)
            } else if (descriptorChanged(
                Object.getOwnPropertyDescriptor(global, key),
                globals[key]
            )) {
                tryDelete(key)
            }
        }

        state.currentPromise = undefined
    }

    return state.currentPromise = Promise.resolve()
    .then(function () {
        state.pass.textContent = "0"
        state.fail.textContent = "0"
        state.skip.textContent = "0"
        return opts.preload()
    })
    .then(function () {
        return Util.peach(opts.files, function (file) {
            return loadScript(file, opts.timeout)
        })
    })
    .then(function () { return opts.prerun() })
    .then(function () { return opts.thallium.run() })
    .then(function () { return opts.postrun() })
    .catch(function (e) {
        return Promise.resolve(opts.error(e)).then(function () { throw e })
    })
    .then(
        function () { cleanup() },
        function (e) { cleanup(); throw e })
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../util":27,"./inject":16}],18:[function(require,module,exports){
(function (global){
"use strict"

var diff = require("diff")
var R = require("../reporter")
var D = require("./inject")
var runTests = require("./run-tests")
var inspect = require("clean-assert-util").inspect

/**
 * View logic
 */

function t(text) {
    return D.document.createTextNode(text)
}

function h(type, attrs, children) {
    var parts = type.split(/\s+/g)

    if (Array.isArray(attrs)) {
        children = attrs
        attrs = undefined
    }

    if (attrs == null) attrs = {}
    if (children == null) children = []

    type = parts[0]
    attrs.className = parts.slice(1).join(" ")

    var elem = D.document.createElement(type)

    Object.keys(attrs).forEach(function (attr) {
        elem[attr] = attrs[attr]
    })

    children.forEach(function (child) {
        if (child != null) elem.appendChild(child)
    })

    return elem
}

function unifiedDiff(err) {
    var actual = inspect(err.actual)
    var expected = inspect(err.expected)
    var msg = diff.createPatch("string", actual, expected)
        .split(/\r?\n|\r/g).slice(4)
        .filter(function (line) { return !/^\@\@|^\\ No newline/.test(line) })
    var end = msg.length

    while (end !== 0 && /^\s*$/g.test(msg[end - 1])) end--
    return h("div tl-diff", [
        h("div tl-diff-header", [
            h("span tl-diff-added", [t("+ expected")]),
            h("span tl-diff-removed", [t("- actual")]),
        ]),
        h("div tl-pre", !end
            ? [h("span tl-line tl-diff-added", [t(" (none)")])]
            : msg.slice(0, end)
            .map(function (line) { return line.trimRight() })
            .map(function (line) {
                if (line[0] === "+") {
                    return h("span tl-line tl-diff-added", [t(line)])
                } else if (line[0] === "-") {
                    return h("span tl-line tl-diff-removed", [t(line)])
                } else {
                    return h("span tl-line tl-diff-none", [t(line)])
                }
            })
        ),
    ])
}

function toLines(str) {
    return h("div tl-pre", str.split(/\r?\n|\r/g).map(function (line) {
        return h("span tl-line", [t(line.trimRight())])
    }))
}

function formatError(e, showDiff) {
    var stack = R.readStack(e)

    return h("div tl-display", [
        h("div tl-message", [toLines(e.name + ": " + e.message)]),
        showDiff ? unifiedDiff(e) : undefined,
        stack ? h("div tl-stack", [toLines(stack)]) : undefined,
    ])
}

function showTest(_, report, className, child) {
    var end = report.path.length - 1
    var name = report.path[end].name
    var parent = _.get(report.path, end)
    var speed = R.speed(report)

    if (speed === "fast") {
        parent.node.appendChild(h("li " + className + " tl-fast", [
            h("h2", [t(name)]),
            child,
        ]))
    } else {
        parent.node.appendChild(h("li " + className + " tl-" + speed, [
            h("h2", [
                t(name + " ("),
                h("span tl-duration", [t(R.formatTime(report.duration))]),
                t(")"),
            ]),
            child,
        ]))
    }

    _.opts.duration.textContent = R.formatTime(_.duration)
}

function showSkip(_, report) {
    var end = report.path.length - 1
    var name = report.path[end].name
    var parent = _.get(report.path, end)

    parent.node.appendChild(h("li tl-test tl-skip", [
        h("h2", [t(name)]),
    ]))
}

exports.nextFrame = nextFrame
function nextFrame(func) {
    if (D.window.requestAnimationFrame) {
        D.window.requestAnimationFrame(func)
    } else {
        global.setTimeout(func, 0)
    }
}

exports.report = function (_, report) {
    if (report.isStart) {
        return new Promise(function (resolve) {
            // Clear the element first, just in case.
            while (_.opts.report.firstChild) {
                _.opts.report.removeChild(_.opts.report.firstChild)
            }

            // Defer the next frame, so the current changes can be sent, in case
            // it's clearing old test results from a large suite. (Chrome does
            // better batching this way, at least.)
            nextFrame(function () {
                _.get(undefined, 0).node = _.opts.report
                _.opts.duration.textContent = R.formatTime(0)
                _.opts.pass.textContent = "0"
                _.opts.fail.textContent = "0"
                _.opts.skip.textContent = "0"
                resolve()
            })
        })
    } else if (report.isEnter) {
        var child = h("ul")

        _.get(report.path).node = child
        showTest(_, report, "tl-suite tl-pass", child)
        _.opts.pass.textContent = _.pass
    } else if (report.isPass) {
        showTest(_, report, "tl-test tl-pass")
        _.opts.pass.textContent = _.pass
    } else if (report.isFail) {
        showTest(_, report, "tl-test tl-fail", formatError(report.error,
            report.error.name === "AssertionError" &&
                report.error.showDiff !== false))
        _.opts.fail.textContent = _.fail
    } else if (report.isSkip) {
        showSkip(_, report, "tl-test tl-skip")
        _.opts.skip.textContent = _.skip
    } else if (report.isError) {
        _.opts.report.appendChild(h("li tl-error", [
            h("h2", [t("Internal error")]),
            formatError(report.error, false),
        ]))
    }

    return undefined
}

function makeCounter(state, child, label, name) {
    return h("button tl-toggle " + name, {
        onclick: function (ev) {
            ev.preventDefault()
            ev.stopPropagation()

            if (/\btl-active\b/.test(this.className)) {
                this.className = this.className
                    .replace(/\btl-active\b/g, "")
                    .replace(/\s+/g, " ")
                    .trim()
                state.report.className = state.report.className
                    .replace(new RegExp("\\b" + name + "\\b", "g"), "")
                    .replace(/\s+/g, " ")
                    .trim()
                state.active = undefined
            } else {
                if (state.active != null) {
                    state.active.className = state.active.className
                        .replace(/\btl-active\b/g, "")
                        .replace(/\s+/g, " ")
                        .trim()
                }

                state.active = this
                this.className += " tl-active"
                state.report.className = state.report.className
                    .replace(/\btl-(pass|fail|skip)\b/g, "")
                    .replace(/\s+/g, " ")
                    .trim() + " " + name
            }
        },
    }, [t(label), child])
}

exports.init = function (opts) {
    var state = {
        currentPromise: undefined,
        locked: false,
        duration: h("em", [t(R.formatTime(0))]),
        pass: h("em", [t("0")]),
        fail: h("em", [t("0")]),
        skip: h("em", [t("0")]),
        report: h("ul tl-report"),
        active: undefined,
    }

    var header = h("div tl-header", [
        h("div tl-duration", [t("Duration: "), state.duration]),
        makeCounter(state, state.pass, "Passes: ", "tl-pass"),
        makeCounter(state, state.fail, "Failures: ", "tl-fail"),
        makeCounter(state, state.skip, "Skipped: ", "tl-skip"),
        h("button tl-run", {
            onclick: function (ev) {
                ev.preventDefault()
                ev.stopPropagation()
                runTests(opts, state)
            },
        }, [t("Run")]),
    ])

    var root = D.document.getElementById("tl")

    if (root == null) {
        D.document.body.appendChild(root = h("div", {id: "tl"}, [
            header,
            state.report,
        ]))
    } else {
        // Clear the element first, just in case.
        while (root.firstChild) root.removeChild(root.firstChild)
        root.appendChild(header)
        root.appendChild(state.report)
    }

    return {
        root: root,
        state: state,
    }
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../reporter":22,"./inject":16,"./run-tests":17,"clean-assert-util":33,"diff":52}],19:[function(require,module,exports){
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

var diff = require("diff")

var methods = require("../methods")
var inspect = require("clean-assert-util").inspect
var peach = require("../util").peach
var Reporter = require("./reporter")
var Util = require("./util")
var Settings = require("../settings")

function printTime(_, p, str) {
    if (!_.timePrinted) {
        _.timePrinted = true
        str += Util.color("light", " (" + Util.formatTime(_.duration) + ")")
    }

    return p.then(function () { return _.print(str) })
}

function unifiedDiff(err) {
    var actual = inspect(err.actual)
    var expected = inspect(err.expected)
    var msg = diff.createPatch("string", actual, expected)
    var header = Settings.newline() +
        Util.color("diff added", "+ expected") + " " +
        Util.color("diff removed", "- actual") +
        Settings.newline()

    return header + msg.split(/\r?\n|\r/g).slice(4)
    .filter(function (line) { return !/^\@\@|^\\ No newline/.test(line) })
    .map(function (line) {
        if (line[0] === "+") return Util.color("diff added", line)
        if (line[0] === "-") return Util.color("diff removed", line)
        return line
    })
    .map(function (line) { return Settings.newline() + line })
    .map(function (line) { return line.trimRight() })
    .join("")
}

function getDiffStack(e) {
    var description = (e.name + ": " + e.message)
        .replace(/\s+$/gm, "")
        .replace(/^(.*)$/gm, Util.color("fail", "$1"))

    if (e.name === "AssertionError" && e.showDiff !== false) {
        description += Settings.newline() + unifiedDiff(e) + Settings.newline()
    }

    var stripped = Util.readStack(e)
        .replace(/^(.*)$/gm, Util.color("fail", "$1"))

    if (stripped === "") return description
    return description + Settings.newline() + stripped
}

function printFailList(_, err) {
    var str = err instanceof Error ? getDiffStack(err) : inspect(err)
    var parts = str.split(/\r?\n/g)

    return _.print("    " + parts[0])
    .then(function () {
        return peach(parts.slice(1), function (part) {
            return _.print(part ? "      " + part : "")
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
                    return printFailList(self, report.error)
                })
                .then(function () { return self.print() })
            })
        })
    },

    printError: function (report) {
        var self = this
        var lines = report.error instanceof Error
            ? Util.getStack(report.error)
            : inspect(report.error)

        return this.print().then(function () {
            return peach(lines.split(/\r?\n/g), function (line) {
                return self.print(line)
            })
        })
    },
})

},{"../methods":19,"../settings":26,"../util":27,"./reporter":24,"./util":25,"clean-assert-util":33,"diff":52}],22:[function(require,module,exports){
"use strict"

var Util = require("./util")

exports.on = require("./on")
exports.consoleReporter = require("./console-reporter")
exports.Reporter = require("./reporter")
exports.color = Util.color
exports.Colors = Util.Colors
exports.formatRest = Util.formatRest
exports.formatTime = Util.formatTime
exports.getStack = Util.getStack
exports.joinPath = Util.joinPath
exports.newline = Util.newline
exports.readStack = Util.readStack
exports.setColor = Util.setColor
exports.speed = Util.speed
exports.Status = Util.Status
exports.symbols = Util.symbols
exports.unsetColor = Util.unsetColor
exports.windowWidth = Util.windowWidth

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
                    if (typeof _.opts.reset === "function") {
                        return _.opts.reset()
                    }
                }
                return undefined
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
        this.base = new this.Tree(undefined)
        this.cache = {path: undefined, result: undefined, end: 0}
    },

    pushError: function (report) {
        this.errors.push(report)
    },

    get: function (path, end) {
        if (end == null) end = path.length
        if (end === 0) return this.base
        if (isRepeat(this.cache, path, end)) {
            return this.cache.result
        }

        var child = this.base

        for (var i = 0; i < end; i++) {
            var entry = path[i]

            if (hasOwn.call(child.children, entry.index)) {
                child = child.children[entry.index]
            } else {
                child = child.children[entry.index] = new this.Tree(entry.name)
            }
        }

        this.cache.end = end
        return this.cache.result = child
    },
})

},{"../methods":19,"./util":25}],25:[function(require,module,exports){
"use strict"

var Util = require("../util")
var Settings = require("../settings")

exports.symbols = Settings.symbols
exports.windowWidth = Settings.windowWidth
exports.newline = Settings.newline

/*
 * Stack normalization
 */

// Exported for debugging
exports.readStack = readStack
function readStack(e) {
    var stack = Util.getStack(e)

    // If it doesn't start with the message, just return the stack.
    //  Firefox, Safari                Chrome, IE
    if (/^(@)?\S+\:\d+/.test(stack) || /^\s*at/.test(stack)) {
        return formatLineBreaks("", stack)
    }

    var index = stack.indexOf(e.message)

    if (index < 0) return formatLineBreaks("", Util.getStack(e))
    var re = /\r?\n/g

    re.lastIndex = index + e.message.length
    if (!re.test(stack)) return ""
    return formatLineBreaks("", stack.slice(re.lastIndex))
}

function formatLineBreaks(lead, str) {
    return str
        .replace(/\s+$/gm, "")
        .replace(/^\s+/gm, lead)
        .replace(/\r?\n|\r/g, Settings.newline())
}

exports.getStack = function (e) {
    if (!(e instanceof Error)) return formatLineBreaks("", Util.getStack(e))
    var description = (e.name + ": " + e.message).replace(/\s+$/gm, "")
    var stripped = readStack(e)

    if (stripped === "") return description
    return description + Settings.newline() + stripped
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

exports.color = color
function color(name, str) {
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

var methods = require("./methods")

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

/**
 * A lazy accessor, complete with thrown error memoization and a decent amount
 * of optimization, since it's used in a lot of code.
 *
 * Note that this uses reference indirection and direct mutation to keep only
 * just the computation non-constant, so engines can avoid closure allocation.
 * Also, `create` is intentionally kept *out* of any closure, so it can be more
 * easily collected.
 */
function Lazy(create) {
    this.value = create
    this.get = this.init
}

methods(Lazy, {
    recursive: function () {
        throw new TypeError("Lazy functions must not be called recursively!")
    },

    return: function () {
        return this.value
    },

    throw: function () {
        throw this.value
    },

    init: function () {
        this.get = this.recursive

        try {
            this.value = (0, this.value)()
            this.get = this.return
            return this.value
        } catch (e) {
            this.value = e
            this.get = this.throw
            throw this.value
        }
    },
})

exports.lazy = function (create) {
    var ref = new Lazy(create)

    return function () {
        return ref.get()
    }
}

},{"./methods":19}],28:[function(require,module,exports){
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

},{}],29:[function(require,module,exports){
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

var assert = require("clean-assert")

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
            assert.fail(res.message, res)
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
        function () { return lockError(assert.AssertionError) }),
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
 * - `t.true`/etc. are gone (except `t.undefined` -> `assert.isUndefined`)   *
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

},{"../assertions":2,"../index":4,"../internal":5,"../lib/api/reflect":7,"../lib/api/thallium":8,"../lib/core/reports":11,"../lib/methods":19,"./common":28,"clean-assert":34}],30:[function(require,module,exports){
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

},{}],31:[function(require,module,exports){
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

},{}],32:[function(require,module,exports){
"use strict"

// See https://github.com/substack/node-browserify/issues/1674

module.exports = require("util-inspect")

},{"util-inspect":65}],33:[function(require,module,exports){
"use strict"

var inspect = exports.inspect = require("./inspect")
var hasOwn = Object.prototype.hasOwnProperty
var AssertionError

// PhantomJS, IE, and possibly Edge don't set the stack trace until the error is
// thrown. Note that this prefers an existing stack first, since non-native
// errors likely already contain this.
function getStack(e) {
    var stack = e.stack

    if (!(e instanceof Error) || stack != null) return stack

    try {
        throw e
    } catch (e) {
        return e.stack
    }
}

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
            var e = new Error(message)

            e.name = "AssertionError"
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

},{"./inspect":32}],34:[function(require,module,exports){
"use strict"

/**
 * Core TDD-style assertions. These are done by a composition of DSLs, since
 * there is *so* much repetition. Also, this is split into several namespaces to
 * keep the file size manageable.
 */

var util = require("clean-assert-util")
var type = require("./lib/type")
var equal = require("./lib/equal")
var throws = require("./lib/throws")
var has = require("./lib/has")
var includes = require("./lib/includes")
var hasKeys = require("./lib/has-keys")

exports.AssertionError = util.AssertionError
exports.assert = util.assert
exports.fail = util.fail

exports.ok = type.ok
exports.notOk = type.notOk
exports.isBoolean = type.isBoolean
exports.notBoolean = type.notBoolean
exports.isFunction = type.isFunction
exports.notFunction = type.notFunction
exports.isNumber = type.isNumber
exports.notNumber = type.notNumber
exports.isObject = type.isObject
exports.notObject = type.notObject
exports.isString = type.isString
exports.notString = type.notString
exports.isSymbol = type.isSymbol
exports.notSymbol = type.notSymbol
exports.exists = type.exists
exports.notExists = type.notExists
exports.isArray = type.isArray
exports.notArray = type.notArray
exports.is = type.is
exports.not = type.not

exports.equal = equal.equal
exports.notEqual = equal.notEqual
exports.equalLoose = equal.equalLoose
exports.notEqualLoose = equal.notEqualLoose
exports.deepEqual = equal.deepEqual
exports.notDeepEqual = equal.notDeepEqual
exports.match = equal.match
exports.notMatch = equal.notMatch
exports.atLeast = equal.atLeast
exports.atMost = equal.atMost
exports.above = equal.above
exports.below = equal.below
exports.between = equal.between
exports.closeTo = equal.closeTo
exports.notCloseTo = equal.notCloseTo

exports.throws = throws.throws
exports.throwsMatch = throws.throwsMatch

exports.hasOwn = has.hasOwn
exports.notHasOwn = has.notHasOwn
exports.hasOwnLoose = has.hasOwnLoose
exports.notHasOwnLoose = has.notHasOwnLoose
exports.hasKey = has.hasKey
exports.notHasKey = has.notHasKey
exports.hasKeyLoose = has.hasKeyLoose
exports.notHasKeyLoose = has.notHasKeyLoose
exports.has = has.has
exports.notHas = has.notHas
exports.hasLoose = has.hasLoose
exports.notHasLoose = has.notHasLoose

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

exports.includes = includes.includes
exports.includesDeep = includes.includesDeep
exports.includesMatch = includes.includesMatch
exports.includesAny = includes.includesAny
exports.includesAnyDeep = includes.includesAnyDeep
exports.includesAnyMatch = includes.includesAnyMatch
exports.notIncludesAll = includes.notIncludesAll
exports.notIncludesAllDeep = includes.notIncludesAllDeep
exports.notIncludesAllMatch = includes.notIncludesAllMatch
exports.notIncludes = includes.notIncludes
exports.notIncludesDeep = includes.notIncludesDeep
exports.notIncludesMatch = includes.notIncludesMatch

exports.hasKeys = hasKeys.hasKeys
exports.hasKeysDeep = hasKeys.hasKeysDeep
exports.hasKeysMatch = hasKeys.hasKeysMatch
exports.hasKeysAny = hasKeys.hasKeysAny
exports.hasKeysAnyDeep = hasKeys.hasKeysAnyDeep
exports.hasKeysAnyMatch = hasKeys.hasKeysAnyMatch
exports.notHasKeysAll = hasKeys.notHasKeysAll
exports.notHasKeysAllDeep = hasKeys.notHasKeysAllDeep
exports.notHasKeysAllMatch = hasKeys.notHasKeysAllMatch
exports.notHasKeys = hasKeys.notHasKeys
exports.notHasKeysDeep = hasKeys.notHasKeysDeep
exports.notHasKeysMatch = hasKeys.notHasKeysMatch

},{"./lib/equal":35,"./lib/has":37,"./lib/has-keys":36,"./lib/includes":38,"./lib/throws":39,"./lib/type":40,"clean-assert-util":33}],35:[function(require,module,exports){
"use strict"

var match = require("clean-match")
var util = require("clean-assert-util")

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
            util.fail(message, {actual: actual, expected: expected})
        }
    }
}

exports.equal = binary(false,
    function (a, b) { return util.strictIs(a, b) },
    "Expected {actual} to equal {expected}")

exports.notEqual = binary(false,
    function (a, b) { return !util.strictIs(a, b) },
    "Expected {actual} to not equal {expected}")

exports.equalLoose = binary(false,
    function (a, b) { return util.looseIs(a, b) },
    "Expected {actual} to loosely equal {expected}")

exports.notEqualLoose = binary(false,
    function (a, b) { return !util.looseIs(a, b) },
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
        util.fail("Expected {actual} to be between {lower} and {upper}", {
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
    function (a, b) { return match.loose(a, b) },
    "Expected {actual} to match {expected}")

exports.notMatch = binary(false,
    function (a, b) { return !match.loose(a, b) },
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
        util.fail("Expected {actual} to be close to {expected}", {
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
        util.fail("Expected {actual} to not be close to {expected}", {
            actual: actual,
            expected: expected,
        })
    }
}

},{"clean-assert-util":33,"clean-match":41}],36:[function(require,module,exports){
"use strict"

var match = require("clean-match")
var util = require("clean-assert-util")
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
                util.fail(message, {actual: object, keys: keys})
            }
        } else if (Object.keys(keys).length) {
            if (hasValues(util.strictIs, all, object, keys) === invert) {
                util.fail(message, {actual: object, keys: keys})
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
                util.fail(message, {actual: object, keys: keys})
            }
        }
    }
}

/* eslint-disable max-len */

exports.hasKeys = makeHasOverload(true, false, "Expected {actual} to have all keys in {keys}")
exports.hasKeysDeep = makeHasKeys(match.strict, true, false, "Expected {actual} to have all keys in {keys}")
exports.hasKeysMatch = makeHasKeys(match.loose, true, false, "Expected {actual} to match all keys in {keys}")
exports.hasKeysAny = makeHasOverload(false, false, "Expected {actual} to have any key in {keys}")
exports.hasKeysAnyDeep = makeHasKeys(match.strict, false, false, "Expected {actual} to have any key in {keys}")
exports.hasKeysAnyMatch = makeHasKeys(match.loose, false, false, "Expected {actual} to match any key in {keys}")
exports.notHasKeysAll = makeHasOverload(true, true, "Expected {actual} to not have all keys in {keys}")
exports.notHasKeysAllDeep = makeHasKeys(match.strict, true, true, "Expected {actual} to not have all keys in {keys}")
exports.notHasKeysAllMatch = makeHasKeys(match.loose, true, true, "Expected {actual} to not match all keys in {keys}")
exports.notHasKeys = makeHasOverload(false, true, "Expected {actual} to not have any key in {keys}")
exports.notHasKeysDeep = makeHasKeys(match.strict, false, true, "Expected {actual} to not have any key in {keys}")
exports.notHasKeysMatch = makeHasKeys(match.loose, false, true, "Expected {actual} to not match any key in {keys}")

},{"clean-assert-util":33,"clean-match":41}],37:[function(require,module,exports){
"use strict"

var util = require("clean-assert-util")
var hasOwn = Object.prototype.hasOwnProperty

function has(_) { // eslint-disable-line max-len, max-params
    return function (object, key, value) {
        if (arguments.length >= 3) {
            if (!_.has(object, key) ||
                    !util.strictIs(_.get(object, key), value)) {
                util.fail(_.messages[0], {
                    expected: value,
                    actual: object[key],
                    key: key,
                    object: object,
                })
            }
        } else if (!_.has(object, key)) {
            util.fail(_.messages[1], {
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
        if (!_.has(object, key) || !util.looseIs(_.get(object, key), value)) {
            util.fail(_.messages[0], {
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
                    util.strictIs(_.get(object, key), value)) {
                util.fail(_.messages[2], {
                    expected: value,
                    actual: object[key],
                    key: key,
                    object: object,
                })
            }
        } else if (_.has(object, key)) {
            util.fail(_.messages[3], {
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
        if (_.has(object, key) && util.looseIs(_.get(object, key), value)) {
            util.fail(_.messages[2], {
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

},{"clean-assert-util":33}],38:[function(require,module,exports){
"use strict"

var match = require("clean-match")
var util = require("clean-assert-util")

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
            util.fail(message, {actual: array, values: values})
        }
    }
}

/* eslint-disable max-len */

exports.includes = defineIncludes(util.strictIs, true, false, "Expected {actual} to have all values in {values}")
exports.includesDeep = defineIncludes(match.strict, true, false, "Expected {actual} to match all values in {values}")
exports.includesMatch = defineIncludes(match.loose, true, false, "Expected {actual} to match all values in {values}")
exports.includesAny = defineIncludes(util.strictIs, false, false, "Expected {actual} to have any value in {values}")
exports.includesAnyDeep = defineIncludes(match.strict, false, false, "Expected {actual} to match any value in {values}")
exports.includesAnyMatch = defineIncludes(match.loose, false, false, "Expected {actual} to match any value in {values}")
exports.notIncludesAll = defineIncludes(util.strictIs, true, true, "Expected {actual} to not have all values in {values}")
exports.notIncludesAllDeep = defineIncludes(match.strict, true, true, "Expected {actual} to not match all values in {values}")
exports.notIncludesAllMatch = defineIncludes(match.loose, true, true, "Expected {actual} to not match all values in {values}")
exports.notIncludes = defineIncludes(util.strictIs, false, true, "Expected {actual} to not have any value in {values}")
exports.notIncludesDeep = defineIncludes(match.strict, false, true, "Expected {actual} to not match any value in {values}")
exports.notIncludesMatch = defineIncludes(match.loose, false, true, "Expected {actual} to not match any value in {values}")

},{"clean-assert-util":33,"clean-match":41}],39:[function(require,module,exports){
"use strict"

var util = require("clean-assert-util")

function getName(func) {
    var name = func.name

    if (name == null) name = func.displayName
    if (name) return util.escape(name)
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
            util.fail(
                "Expected callback to throw an instance of " + getName(Type) +
                ", but found {actual}",
                {actual: e})
        }
        return
    }

    throw new util.AssertionError("Expected callback to throw")
}

function throwsMatchTest(matcher, e) {
    if (typeof matcher === "string") return e.message === matcher
    if (typeof matcher === "function") return !!matcher(e)
    if (matcher instanceof RegExp) return !!matcher.test(e.message)

    var keys = Object.keys(matcher)

    for (var i = 0; i < keys.length; i++) {
        var key = keys[i]

        if (!(key in e) || !util.strictIs(matcher[key], e[key])) return false
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
            util.fail(
                "Expected callback to  throw an error that matches " +
                "{expected}, but found {actual}",
                {expected: matcher, actual: e})
        }
        return
    }

    throw new util.AssertionError("Expected callback to throw.")
}

},{"clean-assert-util":33}],40:[function(require,module,exports){
"use strict"

var util = require("clean-assert-util")

exports.ok = function (x) {
    if (!x) util.fail("Expected {actual} to be truthy", {actual: x})
}

exports.notOk = function (x) {
    if (x) util.fail("Expected {actual} to be falsy", {actual: x})
}

exports.isBoolean = function (x) {
    if (typeof x !== "boolean") {
        util.fail("Expected {actual} to be a boolean", {actual: x})
    }
}

exports.notBoolean = function (x) {
    if (typeof x === "boolean") {
        util.fail("Expected {actual} to not be a boolean", {actual: x})
    }
}

exports.isFunction = function (x) {
    if (typeof x !== "function") {
        util.fail("Expected {actual} to be a function", {actual: x})
    }
}

exports.notFunction = function (x) {
    if (typeof x === "function") {
        util.fail("Expected {actual} to not be a function", {actual: x})
    }
}

exports.isNumber = function (x) {
    if (typeof x !== "number") {
        util.fail("Expected {actual} to be a number", {actual: x})
    }
}

exports.notNumber = function (x) {
    if (typeof x === "number") {
        util.fail("Expected {actual} to not be a number", {actual: x})
    }
}

exports.isObject = function (x) {
    if (typeof x !== "object" || x == null) {
        util.fail("Expected {actual} to be an object", {actual: x})
    }
}

exports.notObject = function (x) {
    if (typeof x === "object" && x != null) {
        util.fail("Expected {actual} to not be an object", {actual: x})
    }
}

exports.isString = function (x) {
    if (typeof x !== "string") {
        util.fail("Expected {actual} to be a string", {actual: x})
    }
}

exports.notString = function (x) {
    if (typeof x === "string") {
        util.fail("Expected {actual} to not be a string", {actual: x})
    }
}

exports.isSymbol = function (x) {
    if (typeof x !== "symbol") {
        util.fail("Expected {actual} to be a symbol", {actual: x})
    }
}

exports.notSymbol = function (x) {
    if (typeof x === "symbol") {
        util.fail("Expected {actual} to not be a symbol", {actual: x})
    }
}

exports.exists = function (x) {
    if (x == null) {
        util.fail("Expected {actual} to exist", {actual: x})
    }
}

exports.notExists = function (x) {
    if (x != null) {
        util.fail("Expected {actual} to not exist", {actual: x})
    }
}

exports.isArray = function (x) {
    if (!Array.isArray(x)) {
        util.fail("Expected {actual} to be an array", {actual: x})
    }
}

exports.notArray = function (x) {
    if (Array.isArray(x)) {
        util.fail("Expected {actual} to not be an array", {actual: x})
    }
}

exports.is = function (Type, object) {
    if (typeof Type !== "function") {
        throw new TypeError("`Type` must be a function")
    }

    if (!(object instanceof Type)) {
        util.fail("Expected {object} to be an instance of {expected}", {
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
        util.fail("Expected {object} to not be an instance of {expected}", {
            expected: Type,
            object: object,
        })
    }
}

},{"clean-assert-util":33}],41:[function(require,module,exports){
(function (global){
/**
 * @license
 * clean-match
 *
 * A simple, fast ES2015+ aware deep matching utility.
 *
 * Copyright (c) 2016 and later, Isiah Meadows <me@isiahmeadows.com>.
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 * REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 * AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 * INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 * LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
 * OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 * PERFORMANCE OF THIS SOFTWARE.
 */

/* eslint-disable */
;(function (global, factory) {
    if (typeof exports === "object" && exports != null) {
        factory(global, exports)
    } else if (typeof define === "function") {
        define("clean-match", ["exports"], function (exports) {
            factory(global, exports)
        })
    } else {
        factory(global, global.match = {})
    }
})(typeof global === "object" && global !== null ? global
    : typeof self === "object" && self !== null ? self
    : typeof window === "object" && window !== null ? window
    : this,
function (global, exports) {
    /* eslint-enable */
    "use strict"

    /* global Symbol, Uint8Array, DataView, ArrayBuffer, ArrayBufferView, Map,
    Set */

    /**
     * Deep matching algorithm, with zero dependencies. Note the following:
     *
     * - This is relatively performance-tuned, although it prefers high
     *   correctness. Patch with care, since performance is a concern.
     * - This does pack a *lot* of features, which should explain the length.
     * - Some of the duplication is intentional. It's generally commented, but
     *   it's mainly for performance, since the engine needs its type info.
     * - Polyfilled core-js Symbols from cross-origin contexts will never
     *   register as being actual Symbols.
     *
     * And in case you're wondering about the longer functions and occasional
     * repetition, it's because V8's inliner isn't always intelligent enough to
     * deal with the super highly polymorphic data this often deals with, and JS
     * doesn't have compile-time macros.
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

        // In Safari 8, several typed array constructors are
        // `typeof C === "object"`
        if (isPoisoned(global.Int8Array)) return SlowIsFunction

        // In old V8, RegExps are callable
        if (typeof /x/ === "function") return SlowIsFunction // eslint-disable-line

        // Leave this for normal things. It's easily inlined.
        return function isFunction(value) {
            return typeof value === "function"
        }
    })()

    // Set up our own buffer check. We should always accept the polyfill, even
    // in Node. Note that it uses `global.Buffer` to avoid including `buffer` in
    // the bundle.

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
        // Avoid global polyfills
        if (global.Buffer.isBuffer(new FakeBuffer())) return BufferPolyfill
        return BufferNative
    })()

    var globalIsBuffer = bufferSupport === BufferNative
        ? global.Buffer.isBuffer
        : undefined

    function isBuffer(object) {
        if (bufferSupport === BufferNative && globalIsBuffer(object)) {
            return true
        } else if (bufferSupport === BufferSafari && object._isBuffer) {
            return true
        }

        var B = object.constructor

        if (!isFunction(B)) return false
        if (!isFunction(B.isBuffer)) return false
        return B.isBuffer(object)
    }

    // core-js' symbols are objects, and some old versions of V8 erroneously had
    // `typeof Symbol() === "object"`.
    var symbolsAreObjects = isFunction(global.Symbol) &&
        typeof Symbol() === "object"

    // `context` is a bit field, with the following bits. This is not as much
    // for performance than to just reduce the number of parameters I need to be
    // throwing around.
    var Strict = 1
    var Initial = 2
    var SameProto = 4

    exports.loose = function (a, b) {
        return match(a, b, Initial, undefined, undefined)
    }

    exports.strict = function (a, b) {
        return match(a, b, Strict | Initial, undefined, undefined)
    }

    // Feature-test delayed stack additions and extra keys. PhantomJS and IE
    // both wait until the error was actually thrown first, and assign them as
    // own properties, which is unhelpful for assertions. This returns a
    // function to speed up cases where `Object.keys` is sufficient (e.g. in
    // Chrome/FF/Node).
    //
    // This wouldn't be necessary if those engines would make the stack a
    // getter, and record it when the error was created, not when it was thrown.
    // It specifically filters out errors and only checks existing descriptors,
    // just to keep the mess from affecting everything (it's not fully correct,
    // but it's necessary).
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
        case "line": if (typeof object.line !== "number") return false; break
        case "sourceURL":
            if (typeof object.sourceURL !== "string") return false; break
        case "stack": if (typeof object.stack !== "string") return false; break
        default: return false
        }

        var desc = Object.getOwnPropertyDescriptor(object, key)

        return !desc.configurable && desc.enumerable && !desc.writable
    }

    // This is only invoked with errors, so it's not going to present a
    // significant slow down.
    function getKeysStripped(object) {
        var keys = Object.keys(object)
        var count = 0

        for (var i = 0; i < keys.length; i++) {
            if (!isIgnored(object, keys[i])) keys[count++] = keys[i]
        }

        keys.length = count
        return keys
    }

    // Way faster, since typed array indices are always dense and contain
    // numbers.

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
        return a === b || a !== a && b !== b // eslint-disable-line no-self-compare, max-len
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

    // Support checking maps and sets deeply. They are object-like enough to
    // count, and are useful in their own right. The code is rather messy, but
    // mainly to keep the order-independent checking from becoming insanely
    // slow.
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
            if (!match(a.get(akeys[i]), b.get(bkeys[i]),
                    context, left, right)) {
                return false
            }
        }

        return true
    }

    // Possibly expensive order-independent key-value match. First, try to avoid
    // it by conservatively assuming everything is in order - a cheap O(n) is
    // always nicer than an expensive O(n^2).
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
    // sets into an array, does a cheap identity check, then does the deep
    // check.
    function matchSet(a, b, context, left, right) { // eslint-disable-line max-params, max-len
        // This is to try to avoid an expensive structural match on the keys.
        // Test for identity first.
        var alist = keyList(a)

        if (hasAllIdentical(alist, b)) return true

        var iter = b.values()
        var count = 0
        var objects

        // Gather all the objects
        for (var next = iter.next(); !next.done; next = iter.next()) {
            var bvalue = next.value

            if (hasStructure(bvalue, context)) {
                // Create the objects map lazily. Note that this also grabs
                // Symbols when not strictly matching, since their description
                // is compared.
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

            if (hasStructure(avalue, context) &&
                    !searchFor(avalue, objects, context, left, right)) {
                return false
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

    // Most special cases require both types to match, and if only one of them
    // are, the objects themselves don't match.
    function matchDifferentProto(a, b, context, left, right) { // eslint-disable-line max-params, max-len
        if (symbolsAreObjects) {
            if (a instanceof Symbol || b instanceof Symbol) return false
        }
        if (context & Strict) return false
        if (arrayBufferSupport !== ArrayBufferNone) {
            if (a instanceof ArrayBuffer || b instanceof ArrayBuffer) {
                return false
            }
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

    function match(a, b, context, left, right) { // eslint-disable-line max-params, max-len
        if (a === b) return true
        // NaNs are equal
        if (a !== a) return b !== b // eslint-disable-line no-self-compare
        if (a === null || b === null) return false
        if (typeof a === "symbol" && typeof b === "symbol") {
            return !(context & Strict) && a.toString() === b.toString()
        }
        if (typeof a !== "object" || typeof b !== "object") return false

        // Usually, both objects have identical prototypes, and that allows for
        // half the type checking.
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

    // PhantomJS and SlimerJS both have mysterious issues where `Error` is
    // sometimes erroneously of a different `window`, and it shows up in the
    // tests. This means I have to use a much slower algorithm to detect Errors.
    //
    // PhantomJS: https://github.com/petkaantonov/bluebird/issues/1146
    // SlimerJS: https://github.com/laurentj/slimerjs/issues/400
    //
    // (Yes, the PhantomJS bug is detailed in the Bluebird issue tracker.)
    var checkCrossOrigin = (function () {
        if (global.window == null || global.window.navigator == null) {
            return false
        }
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
            if (Array.isArray(a)) {
                return matchArrayLike(a, b, context, left, right)
            }

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
                    (checkCrossOrigin ? isProxiedError(a)
                        : a instanceof Error)) {
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

            // If we require a proxy, be permissive and check the `toString`
            // type. This is so it works cross-origin in PhantomJS in
            // particular.
            if (checkCrossOrigin ? isProxiedError(a) : a instanceof Error) {
                return false
            }
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
                if (akeys[i] !== "stack" &&
                        !match(a[akeys[i]], b[akeys[i]],
                            context, left, right)) {
                    return false
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
}); // eslint-disable-line semi

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],42:[function(require,module,exports){
/*istanbul ignore start*/"use strict";

exports.__esModule = true;
exports. /*istanbul ignore end*/convertChangesToDMP = convertChangesToDMP;
// See: http://code.google.com/p/google-diff-match-patch/wiki/API
function convertChangesToDMP(changes) {
  var ret = [],
      change = /*istanbul ignore start*/void 0 /*istanbul ignore end*/,
      operation = /*istanbul ignore start*/void 0 /*istanbul ignore end*/;
  for (var i = 0; i < changes.length; i++) {
    change = changes[i];
    if (change.added) {
      operation = 1;
    } else if (change.removed) {
      operation = -1;
    } else {
      operation = 0;
    }

    ret.push([operation, change.value]);
  }
  return ret;
}


},{}],43:[function(require,module,exports){
/*istanbul ignore start*/'use strict';

exports.__esModule = true;
exports. /*istanbul ignore end*/convertChangesToXML = convertChangesToXML;
function convertChangesToXML(changes) {
  var ret = [];
  for (var i = 0; i < changes.length; i++) {
    var change = changes[i];
    if (change.added) {
      ret.push('<ins>');
    } else if (change.removed) {
      ret.push('<del>');
    }

    ret.push(escapeHTML(change.value));

    if (change.added) {
      ret.push('</ins>');
    } else if (change.removed) {
      ret.push('</del>');
    }
  }
  return ret.join('');
}

function escapeHTML(s) {
  var n = s;
  n = n.replace(/&/g, '&amp;');
  n = n.replace(/</g, '&lt;');
  n = n.replace(/>/g, '&gt;');
  n = n.replace(/"/g, '&quot;');

  return n;
}


},{}],44:[function(require,module,exports){
/*istanbul ignore start*/'use strict';

exports.__esModule = true;
exports.arrayDiff = undefined;
exports. /*istanbul ignore end*/diffArrays = diffArrays;

var /*istanbul ignore start*/_base = require('./base') /*istanbul ignore end*/;

/*istanbul ignore start*/
var _base2 = _interopRequireDefault(_base);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/*istanbul ignore end*/var arrayDiff = /*istanbul ignore start*/exports. /*istanbul ignore end*/arrayDiff = new /*istanbul ignore start*/_base2['default']() /*istanbul ignore end*/;
arrayDiff.tokenize = arrayDiff.join = function (value) {
  return value.slice();
};

function diffArrays(oldArr, newArr, callback) {
  return arrayDiff.diff(oldArr, newArr, callback);
}


},{"./base":45}],45:[function(require,module,exports){
/*istanbul ignore start*/'use strict';

exports.__esModule = true;
exports['default'] = /*istanbul ignore end*/Diff;
function Diff() {}

Diff.prototype = { /*istanbul ignore start*/
  /*istanbul ignore end*/diff: function diff(oldString, newString) {
    /*istanbul ignore start*/var /*istanbul ignore end*/options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

    var callback = options.callback;
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    this.options = options;

    var self = this;

    function done(value) {
      if (callback) {
        setTimeout(function () {
          callback(undefined, value);
        }, 0);
        return true;
      } else {
        return value;
      }
    }

    // Allow subclasses to massage the input prior to running
    oldString = this.castInput(oldString);
    newString = this.castInput(newString);

    oldString = this.removeEmpty(this.tokenize(oldString));
    newString = this.removeEmpty(this.tokenize(newString));

    var newLen = newString.length,
        oldLen = oldString.length;
    var editLength = 1;
    var maxEditLength = newLen + oldLen;
    var bestPath = [{ newPos: -1, components: [] }];

    // Seed editLength = 0, i.e. the content starts with the same values
    var oldPos = this.extractCommon(bestPath[0], newString, oldString, 0);
    if (bestPath[0].newPos + 1 >= newLen && oldPos + 1 >= oldLen) {
      // Identity per the equality and tokenizer
      return done([{ value: this.join(newString), count: newString.length }]);
    }

    // Main worker method. checks all permutations of a given edit length for acceptance.
    function execEditLength() {
      for (var diagonalPath = -1 * editLength; diagonalPath <= editLength; diagonalPath += 2) {
        var basePath = /*istanbul ignore start*/void 0 /*istanbul ignore end*/;
        var addPath = bestPath[diagonalPath - 1],
            removePath = bestPath[diagonalPath + 1],
            _oldPos = (removePath ? removePath.newPos : 0) - diagonalPath;
        if (addPath) {
          // No one else is going to attempt to use this value, clear it
          bestPath[diagonalPath - 1] = undefined;
        }

        var canAdd = addPath && addPath.newPos + 1 < newLen,
            canRemove = removePath && 0 <= _oldPos && _oldPos < oldLen;
        if (!canAdd && !canRemove) {
          // If this path is a terminal then prune
          bestPath[diagonalPath] = undefined;
          continue;
        }

        // Select the diagonal that we want to branch from. We select the prior
        // path whose position in the new string is the farthest from the origin
        // and does not pass the bounds of the diff graph
        if (!canAdd || canRemove && addPath.newPos < removePath.newPos) {
          basePath = clonePath(removePath);
          self.pushComponent(basePath.components, undefined, true);
        } else {
          basePath = addPath; // No need to clone, we've pulled it from the list
          basePath.newPos++;
          self.pushComponent(basePath.components, true, undefined);
        }

        _oldPos = self.extractCommon(basePath, newString, oldString, diagonalPath);

        // If we have hit the end of both strings, then we are done
        if (basePath.newPos + 1 >= newLen && _oldPos + 1 >= oldLen) {
          return done(buildValues(self, basePath.components, newString, oldString, self.useLongestToken));
        } else {
          // Otherwise track this path as a potential candidate and continue.
          bestPath[diagonalPath] = basePath;
        }
      }

      editLength++;
    }

    // Performs the length of edit iteration. Is a bit fugly as this has to support the
    // sync and async mode which is never fun. Loops over execEditLength until a value
    // is produced.
    if (callback) {
      (function exec() {
        setTimeout(function () {
          // This should not happen, but we want to be safe.
          /* istanbul ignore next */
          if (editLength > maxEditLength) {
            return callback();
          }

          if (!execEditLength()) {
            exec();
          }
        }, 0);
      })();
    } else {
      while (editLength <= maxEditLength) {
        var ret = execEditLength();
        if (ret) {
          return ret;
        }
      }
    }
  },
  /*istanbul ignore start*/ /*istanbul ignore end*/pushComponent: function pushComponent(components, added, removed) {
    var last = components[components.length - 1];
    if (last && last.added === added && last.removed === removed) {
      // We need to clone here as the component clone operation is just
      // as shallow array clone
      components[components.length - 1] = { count: last.count + 1, added: added, removed: removed };
    } else {
      components.push({ count: 1, added: added, removed: removed });
    }
  },
  /*istanbul ignore start*/ /*istanbul ignore end*/extractCommon: function extractCommon(basePath, newString, oldString, diagonalPath) {
    var newLen = newString.length,
        oldLen = oldString.length,
        newPos = basePath.newPos,
        oldPos = newPos - diagonalPath,
        commonCount = 0;
    while (newPos + 1 < newLen && oldPos + 1 < oldLen && this.equals(newString[newPos + 1], oldString[oldPos + 1])) {
      newPos++;
      oldPos++;
      commonCount++;
    }

    if (commonCount) {
      basePath.components.push({ count: commonCount });
    }

    basePath.newPos = newPos;
    return oldPos;
  },
  /*istanbul ignore start*/ /*istanbul ignore end*/equals: function equals(left, right) {
    return left === right;
  },
  /*istanbul ignore start*/ /*istanbul ignore end*/removeEmpty: function removeEmpty(array) {
    var ret = [];
    for (var i = 0; i < array.length; i++) {
      if (array[i]) {
        ret.push(array[i]);
      }
    }
    return ret;
  },
  /*istanbul ignore start*/ /*istanbul ignore end*/castInput: function castInput(value) {
    return value;
  },
  /*istanbul ignore start*/ /*istanbul ignore end*/tokenize: function tokenize(value) {
    return value.split('');
  },
  /*istanbul ignore start*/ /*istanbul ignore end*/join: function join(chars) {
    return chars.join('');
  }
};

function buildValues(diff, components, newString, oldString, useLongestToken) {
  var componentPos = 0,
      componentLen = components.length,
      newPos = 0,
      oldPos = 0;

  for (; componentPos < componentLen; componentPos++) {
    var component = components[componentPos];
    if (!component.removed) {
      if (!component.added && useLongestToken) {
        var value = newString.slice(newPos, newPos + component.count);
        value = value.map(function (value, i) {
          var oldValue = oldString[oldPos + i];
          return oldValue.length > value.length ? oldValue : value;
        });

        component.value = diff.join(value);
      } else {
        component.value = diff.join(newString.slice(newPos, newPos + component.count));
      }
      newPos += component.count;

      // Common case
      if (!component.added) {
        oldPos += component.count;
      }
    } else {
      component.value = diff.join(oldString.slice(oldPos, oldPos + component.count));
      oldPos += component.count;

      // Reverse add and remove so removes are output first to match common convention
      // The diffing algorithm is tied to add then remove output and this is the simplest
      // route to get the desired output with minimal overhead.
      if (componentPos && components[componentPos - 1].added) {
        var tmp = components[componentPos - 1];
        components[componentPos - 1] = components[componentPos];
        components[componentPos] = tmp;
      }
    }
  }

  // Special case handle for when one terminal is ignored. For this case we merge the
  // terminal into the prior string and drop the change.
  var lastComponent = components[componentLen - 1];
  if (componentLen > 1 && (lastComponent.added || lastComponent.removed) && diff.equals('', lastComponent.value)) {
    components[componentLen - 2].value += lastComponent.value;
    components.pop();
  }

  return components;
}

function clonePath(path) {
  return { newPos: path.newPos, components: path.components.slice(0) };
}


},{}],46:[function(require,module,exports){
/*istanbul ignore start*/'use strict';

exports.__esModule = true;
exports.characterDiff = undefined;
exports. /*istanbul ignore end*/diffChars = diffChars;

var /*istanbul ignore start*/_base = require('./base') /*istanbul ignore end*/;

/*istanbul ignore start*/
var _base2 = _interopRequireDefault(_base);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/*istanbul ignore end*/var characterDiff = /*istanbul ignore start*/exports. /*istanbul ignore end*/characterDiff = new /*istanbul ignore start*/_base2['default']() /*istanbul ignore end*/;
function diffChars(oldStr, newStr, callback) {
  return characterDiff.diff(oldStr, newStr, callback);
}


},{"./base":45}],47:[function(require,module,exports){
/*istanbul ignore start*/'use strict';

exports.__esModule = true;
exports.cssDiff = undefined;
exports. /*istanbul ignore end*/diffCss = diffCss;

var /*istanbul ignore start*/_base = require('./base') /*istanbul ignore end*/;

/*istanbul ignore start*/
var _base2 = _interopRequireDefault(_base);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/*istanbul ignore end*/var cssDiff = /*istanbul ignore start*/exports. /*istanbul ignore end*/cssDiff = new /*istanbul ignore start*/_base2['default']() /*istanbul ignore end*/;
cssDiff.tokenize = function (value) {
  return value.split(/([{}:;,]|\s+)/);
};

function diffCss(oldStr, newStr, callback) {
  return cssDiff.diff(oldStr, newStr, callback);
}


},{"./base":45}],48:[function(require,module,exports){
/*istanbul ignore start*/'use strict';

exports.__esModule = true;
exports.jsonDiff = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

exports. /*istanbul ignore end*/diffJson = diffJson;
/*istanbul ignore start*/exports. /*istanbul ignore end*/canonicalize = canonicalize;

var /*istanbul ignore start*/_base = require('./base') /*istanbul ignore end*/;

/*istanbul ignore start*/
var _base2 = _interopRequireDefault(_base);

/*istanbul ignore end*/
var /*istanbul ignore start*/_line = require('./line') /*istanbul ignore end*/;

/*istanbul ignore start*/
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/*istanbul ignore end*/

var objectPrototypeToString = Object.prototype.toString;

var jsonDiff = /*istanbul ignore start*/exports. /*istanbul ignore end*/jsonDiff = new /*istanbul ignore start*/_base2['default']() /*istanbul ignore end*/;
// Discriminate between two lines of pretty-printed, serialized JSON where one of them has a
// dangling comma and the other doesn't. Turns out including the dangling comma yields the nicest output:
jsonDiff.useLongestToken = true;

jsonDiff.tokenize = /*istanbul ignore start*/_line.lineDiff. /*istanbul ignore end*/tokenize;
jsonDiff.castInput = function (value) {
  /*istanbul ignore start*/var /*istanbul ignore end*/undefinedReplacement = this.options.undefinedReplacement;


  return typeof value === 'string' ? value : JSON.stringify(canonicalize(value), function (k, v) {
    if (typeof v === 'undefined') {
      return undefinedReplacement;
    }

    return v;
  }, '  ');
};
jsonDiff.equals = function (left, right) {
  return (/*istanbul ignore start*/_base2['default']. /*istanbul ignore end*/prototype.equals(left.replace(/,([\r\n])/g, '$1'), right.replace(/,([\r\n])/g, '$1'))
  );
};

function diffJson(oldObj, newObj, options) {
  return jsonDiff.diff(oldObj, newObj, options);
}

// This function handles the presence of circular references by bailing out when encountering an
// object that is already on the "stack" of items being processed.
function canonicalize(obj, stack, replacementStack) {
  stack = stack || [];
  replacementStack = replacementStack || [];

  var i = /*istanbul ignore start*/void 0 /*istanbul ignore end*/;

  for (i = 0; i < stack.length; i += 1) {
    if (stack[i] === obj) {
      return replacementStack[i];
    }
  }

  var canonicalizedObj = /*istanbul ignore start*/void 0 /*istanbul ignore end*/;

  if ('[object Array]' === objectPrototypeToString.call(obj)) {
    stack.push(obj);
    canonicalizedObj = new Array(obj.length);
    replacementStack.push(canonicalizedObj);
    for (i = 0; i < obj.length; i += 1) {
      canonicalizedObj[i] = canonicalize(obj[i], stack, replacementStack);
    }
    stack.pop();
    replacementStack.pop();
    return canonicalizedObj;
  }

  if (obj && obj.toJSON) {
    obj = obj.toJSON();
  }

  if ( /*istanbul ignore start*/(typeof /*istanbul ignore end*/obj === 'undefined' ? 'undefined' : _typeof(obj)) === 'object' && obj !== null) {
    stack.push(obj);
    canonicalizedObj = {};
    replacementStack.push(canonicalizedObj);
    var sortedKeys = [],
        key = /*istanbul ignore start*/void 0 /*istanbul ignore end*/;
    for (key in obj) {
      /* istanbul ignore else */
      if (obj.hasOwnProperty(key)) {
        sortedKeys.push(key);
      }
    }
    sortedKeys.sort();
    for (i = 0; i < sortedKeys.length; i += 1) {
      key = sortedKeys[i];
      canonicalizedObj[key] = canonicalize(obj[key], stack, replacementStack);
    }
    stack.pop();
    replacementStack.pop();
  } else {
    canonicalizedObj = obj;
  }
  return canonicalizedObj;
}


},{"./base":45,"./line":49}],49:[function(require,module,exports){
/*istanbul ignore start*/'use strict';

exports.__esModule = true;
exports.lineDiff = undefined;
exports. /*istanbul ignore end*/diffLines = diffLines;
/*istanbul ignore start*/exports. /*istanbul ignore end*/diffTrimmedLines = diffTrimmedLines;

var /*istanbul ignore start*/_base = require('./base') /*istanbul ignore end*/;

/*istanbul ignore start*/
var _base2 = _interopRequireDefault(_base);

/*istanbul ignore end*/
var /*istanbul ignore start*/_params = require('../util/params') /*istanbul ignore end*/;

/*istanbul ignore start*/
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/*istanbul ignore end*/var lineDiff = /*istanbul ignore start*/exports. /*istanbul ignore end*/lineDiff = new /*istanbul ignore start*/_base2['default']() /*istanbul ignore end*/;
lineDiff.tokenize = function (value) {
  var retLines = [],
      linesAndNewlines = value.split(/(\n|\r\n)/);

  // Ignore the final empty token that occurs if the string ends with a new line
  if (!linesAndNewlines[linesAndNewlines.length - 1]) {
    linesAndNewlines.pop();
  }

  // Merge the content and line separators into single tokens
  for (var i = 0; i < linesAndNewlines.length; i++) {
    var line = linesAndNewlines[i];

    if (i % 2 && !this.options.newlineIsToken) {
      retLines[retLines.length - 1] += line;
    } else {
      if (this.options.ignoreWhitespace) {
        line = line.trim();
      }
      retLines.push(line);
    }
  }

  return retLines;
};

function diffLines(oldStr, newStr, callback) {
  return lineDiff.diff(oldStr, newStr, callback);
}
function diffTrimmedLines(oldStr, newStr, callback) {
  var options = /*istanbul ignore start*/(0, _params.generateOptions) /*istanbul ignore end*/(callback, { ignoreWhitespace: true });
  return lineDiff.diff(oldStr, newStr, options);
}


},{"../util/params":57,"./base":45}],50:[function(require,module,exports){
/*istanbul ignore start*/'use strict';

exports.__esModule = true;
exports.sentenceDiff = undefined;
exports. /*istanbul ignore end*/diffSentences = diffSentences;

var /*istanbul ignore start*/_base = require('./base') /*istanbul ignore end*/;

/*istanbul ignore start*/
var _base2 = _interopRequireDefault(_base);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/*istanbul ignore end*/var sentenceDiff = /*istanbul ignore start*/exports. /*istanbul ignore end*/sentenceDiff = new /*istanbul ignore start*/_base2['default']() /*istanbul ignore end*/;
sentenceDiff.tokenize = function (value) {
  return value.split(/(\S.+?[.!?])(?=\s+|$)/);
};

function diffSentences(oldStr, newStr, callback) {
  return sentenceDiff.diff(oldStr, newStr, callback);
}


},{"./base":45}],51:[function(require,module,exports){
/*istanbul ignore start*/'use strict';

exports.__esModule = true;
exports.wordDiff = undefined;
exports. /*istanbul ignore end*/diffWords = diffWords;
/*istanbul ignore start*/exports. /*istanbul ignore end*/diffWordsWithSpace = diffWordsWithSpace;

var /*istanbul ignore start*/_base = require('./base') /*istanbul ignore end*/;

/*istanbul ignore start*/
var _base2 = _interopRequireDefault(_base);

/*istanbul ignore end*/
var /*istanbul ignore start*/_params = require('../util/params') /*istanbul ignore end*/;

/*istanbul ignore start*/
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/*istanbul ignore end*/

// Based on https://en.wikipedia.org/wiki/Latin_script_in_Unicode
//
// Ranges and exceptions:
// Latin-1 Supplement, 0080–00FF
//  - U+00D7  × Multiplication sign
//  - U+00F7  ÷ Division sign
// Latin Extended-A, 0100–017F
// Latin Extended-B, 0180–024F
// IPA Extensions, 0250–02AF
// Spacing Modifier Letters, 02B0–02FF
//  - U+02C7  ˇ &#711;  Caron
//  - U+02D8  ˘ &#728;  Breve
//  - U+02D9  ˙ &#729;  Dot Above
//  - U+02DA  ˚ &#730;  Ring Above
//  - U+02DB  ˛ &#731;  Ogonek
//  - U+02DC  ˜ &#732;  Small Tilde
//  - U+02DD  ˝ &#733;  Double Acute Accent
// Latin Extended Additional, 1E00–1EFF
var extendedWordChars = /^[A-Za-z\xC0-\u02C6\u02C8-\u02D7\u02DE-\u02FF\u1E00-\u1EFF]+$/;

var reWhitespace = /\S/;

var wordDiff = /*istanbul ignore start*/exports. /*istanbul ignore end*/wordDiff = new /*istanbul ignore start*/_base2['default']() /*istanbul ignore end*/;
wordDiff.equals = function (left, right) {
  return left === right || this.options.ignoreWhitespace && !reWhitespace.test(left) && !reWhitespace.test(right);
};
wordDiff.tokenize = function (value) {
  var tokens = value.split(/(\s+|\b)/);

  // Join the boundary splits that we do not consider to be boundaries. This is primarily the extended Latin character set.
  for (var i = 0; i < tokens.length - 1; i++) {
    // If we have an empty string in the next field and we have only word chars before and after, merge
    if (!tokens[i + 1] && tokens[i + 2] && extendedWordChars.test(tokens[i]) && extendedWordChars.test(tokens[i + 2])) {
      tokens[i] += tokens[i + 2];
      tokens.splice(i + 1, 2);
      i--;
    }
  }

  return tokens;
};

function diffWords(oldStr, newStr, callback) {
  var options = /*istanbul ignore start*/(0, _params.generateOptions) /*istanbul ignore end*/(callback, { ignoreWhitespace: true });
  return wordDiff.diff(oldStr, newStr, options);
}
function diffWordsWithSpace(oldStr, newStr, callback) {
  return wordDiff.diff(oldStr, newStr, callback);
}


},{"../util/params":57,"./base":45}],52:[function(require,module,exports){
/*istanbul ignore start*/'use strict';

exports.__esModule = true;
exports.canonicalize = exports.convertChangesToXML = exports.convertChangesToDMP = exports.parsePatch = exports.applyPatches = exports.applyPatch = exports.createPatch = exports.createTwoFilesPatch = exports.structuredPatch = exports.diffArrays = exports.diffJson = exports.diffCss = exports.diffSentences = exports.diffTrimmedLines = exports.diffLines = exports.diffWordsWithSpace = exports.diffWords = exports.diffChars = exports.Diff = undefined;
/*istanbul ignore end*/
var /*istanbul ignore start*/_base = require('./diff/base') /*istanbul ignore end*/;

/*istanbul ignore start*/
var _base2 = _interopRequireDefault(_base);

/*istanbul ignore end*/
var /*istanbul ignore start*/_character = require('./diff/character') /*istanbul ignore end*/;

var /*istanbul ignore start*/_word = require('./diff/word') /*istanbul ignore end*/;

var /*istanbul ignore start*/_line = require('./diff/line') /*istanbul ignore end*/;

var /*istanbul ignore start*/_sentence = require('./diff/sentence') /*istanbul ignore end*/;

var /*istanbul ignore start*/_css = require('./diff/css') /*istanbul ignore end*/;

var /*istanbul ignore start*/_json = require('./diff/json') /*istanbul ignore end*/;

var /*istanbul ignore start*/_array = require('./diff/array') /*istanbul ignore end*/;

var /*istanbul ignore start*/_apply = require('./patch/apply') /*istanbul ignore end*/;

var /*istanbul ignore start*/_parse = require('./patch/parse') /*istanbul ignore end*/;

var /*istanbul ignore start*/_create = require('./patch/create') /*istanbul ignore end*/;

var /*istanbul ignore start*/_dmp = require('./convert/dmp') /*istanbul ignore end*/;

var /*istanbul ignore start*/_xml = require('./convert/xml') /*istanbul ignore end*/;

/*istanbul ignore start*/
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

exports. /*istanbul ignore end*/Diff = _base2['default'];
/*istanbul ignore start*/exports. /*istanbul ignore end*/diffChars = _character.diffChars;
/*istanbul ignore start*/exports. /*istanbul ignore end*/diffWords = _word.diffWords;
/*istanbul ignore start*/exports. /*istanbul ignore end*/diffWordsWithSpace = _word.diffWordsWithSpace;
/*istanbul ignore start*/exports. /*istanbul ignore end*/diffLines = _line.diffLines;
/*istanbul ignore start*/exports. /*istanbul ignore end*/diffTrimmedLines = _line.diffTrimmedLines;
/*istanbul ignore start*/exports. /*istanbul ignore end*/diffSentences = _sentence.diffSentences;
/*istanbul ignore start*/exports. /*istanbul ignore end*/diffCss = _css.diffCss;
/*istanbul ignore start*/exports. /*istanbul ignore end*/diffJson = _json.diffJson;
/*istanbul ignore start*/exports. /*istanbul ignore end*/diffArrays = _array.diffArrays;
/*istanbul ignore start*/exports. /*istanbul ignore end*/structuredPatch = _create.structuredPatch;
/*istanbul ignore start*/exports. /*istanbul ignore end*/createTwoFilesPatch = _create.createTwoFilesPatch;
/*istanbul ignore start*/exports. /*istanbul ignore end*/createPatch = _create.createPatch;
/*istanbul ignore start*/exports. /*istanbul ignore end*/applyPatch = _apply.applyPatch;
/*istanbul ignore start*/exports. /*istanbul ignore end*/applyPatches = _apply.applyPatches;
/*istanbul ignore start*/exports. /*istanbul ignore end*/parsePatch = _parse.parsePatch;
/*istanbul ignore start*/exports. /*istanbul ignore end*/convertChangesToDMP = _dmp.convertChangesToDMP;
/*istanbul ignore start*/exports. /*istanbul ignore end*/convertChangesToXML = _xml.convertChangesToXML;
/*istanbul ignore start*/exports. /*istanbul ignore end*/canonicalize = _json.canonicalize; /* See LICENSE file for terms of use */

/*
 * Text diff implementation.
 *
 * This library supports the following APIS:
 * JsDiff.diffChars: Character by character diff
 * JsDiff.diffWords: Word (as defined by \b regex) diff which ignores whitespace
 * JsDiff.diffLines: Line based diff
 *
 * JsDiff.diffCss: Diff targeted at CSS content
 *
 * These methods are based on the implementation proposed in
 * "An O(ND) Difference Algorithm and its Variations" (Myers, 1986).
 * http://citeseerx.ist.psu.edu/viewdoc/summary?doi=10.1.1.4.6927
 */


},{"./convert/dmp":42,"./convert/xml":43,"./diff/array":44,"./diff/base":45,"./diff/character":46,"./diff/css":47,"./diff/json":48,"./diff/line":49,"./diff/sentence":50,"./diff/word":51,"./patch/apply":53,"./patch/create":54,"./patch/parse":55}],53:[function(require,module,exports){
/*istanbul ignore start*/'use strict';

exports.__esModule = true;
exports. /*istanbul ignore end*/applyPatch = applyPatch;
/*istanbul ignore start*/exports. /*istanbul ignore end*/applyPatches = applyPatches;

var /*istanbul ignore start*/_parse = require('./parse') /*istanbul ignore end*/;

var /*istanbul ignore start*/_distanceIterator = require('../util/distance-iterator') /*istanbul ignore end*/;

/*istanbul ignore start*/
var _distanceIterator2 = _interopRequireDefault(_distanceIterator);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/*istanbul ignore end*/function applyPatch(source, uniDiff) {
  /*istanbul ignore start*/var /*istanbul ignore end*/options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

  if (typeof uniDiff === 'string') {
    uniDiff = /*istanbul ignore start*/(0, _parse.parsePatch) /*istanbul ignore end*/(uniDiff);
  }

  if (Array.isArray(uniDiff)) {
    if (uniDiff.length > 1) {
      throw new Error('applyPatch only works with a single input.');
    }

    uniDiff = uniDiff[0];
  }

  // Apply the diff to the input
  var lines = source.split(/\r\n|[\n\v\f\r\x85]/),
      delimiters = source.match(/\r\n|[\n\v\f\r\x85]/g) || [],
      hunks = uniDiff.hunks,
      compareLine = options.compareLine || function (lineNumber, line, operation, patchContent) /*istanbul ignore start*/{
    return (/*istanbul ignore end*/line === patchContent
    );
  },
      errorCount = 0,
      fuzzFactor = options.fuzzFactor || 0,
      minLine = 0,
      offset = 0,
      removeEOFNL = /*istanbul ignore start*/void 0 /*istanbul ignore end*/,
      addEOFNL = /*istanbul ignore start*/void 0 /*istanbul ignore end*/;

  /**
   * Checks if the hunk exactly fits on the provided location
   */
  function hunkFits(hunk, toPos) {
    for (var j = 0; j < hunk.lines.length; j++) {
      var line = hunk.lines[j],
          operation = line[0],
          content = line.substr(1);

      if (operation === ' ' || operation === '-') {
        // Context sanity check
        if (!compareLine(toPos + 1, lines[toPos], operation, content)) {
          errorCount++;

          if (errorCount > fuzzFactor) {
            return false;
          }
        }
        toPos++;
      }
    }

    return true;
  }

  // Search best fit offsets for each hunk based on the previous ones
  for (var i = 0; i < hunks.length; i++) {
    var hunk = hunks[i],
        maxLine = lines.length - hunk.oldLines,
        localOffset = 0,
        toPos = offset + hunk.oldStart - 1;

    var iterator = /*istanbul ignore start*/(0, _distanceIterator2['default']) /*istanbul ignore end*/(toPos, minLine, maxLine);

    for (; localOffset !== undefined; localOffset = iterator()) {
      if (hunkFits(hunk, toPos + localOffset)) {
        hunk.offset = offset += localOffset;
        break;
      }
    }

    if (localOffset === undefined) {
      return false;
    }

    // Set lower text limit to end of the current hunk, so next ones don't try
    // to fit over already patched text
    minLine = hunk.offset + hunk.oldStart + hunk.oldLines;
  }

  // Apply patch hunks
  for (var _i = 0; _i < hunks.length; _i++) {
    var _hunk = hunks[_i],
        _toPos = _hunk.offset + _hunk.newStart - 1;
    if (_hunk.newLines == 0) {
      _toPos++;
    }

    for (var j = 0; j < _hunk.lines.length; j++) {
      var line = _hunk.lines[j],
          operation = line[0],
          content = line.substr(1),
          delimiter = _hunk.linedelimiters[j];

      if (operation === ' ') {
        _toPos++;
      } else if (operation === '-') {
        lines.splice(_toPos, 1);
        delimiters.splice(_toPos, 1);
        /* istanbul ignore else */
      } else if (operation === '+') {
          lines.splice(_toPos, 0, content);
          delimiters.splice(_toPos, 0, delimiter);
          _toPos++;
        } else if (operation === '\\') {
          var previousOperation = _hunk.lines[j - 1] ? _hunk.lines[j - 1][0] : null;
          if (previousOperation === '+') {
            removeEOFNL = true;
          } else if (previousOperation === '-') {
            addEOFNL = true;
          }
        }
    }
  }

  // Handle EOFNL insertion/removal
  if (removeEOFNL) {
    while (!lines[lines.length - 1]) {
      lines.pop();
      delimiters.pop();
    }
  } else if (addEOFNL) {
    lines.push('');
    delimiters.push('\n');
  }
  for (var _k = 0; _k < lines.length - 1; _k++) {
    lines[_k] = lines[_k] + delimiters[_k];
  }
  return lines.join('');
}

// Wrapper that supports multiple file patches via callbacks.
function applyPatches(uniDiff, options) {
  if (typeof uniDiff === 'string') {
    uniDiff = /*istanbul ignore start*/(0, _parse.parsePatch) /*istanbul ignore end*/(uniDiff);
  }

  var currentIndex = 0;
  function processIndex() {
    var index = uniDiff[currentIndex++];
    if (!index) {
      return options.complete();
    }

    options.loadFile(index, function (err, data) {
      if (err) {
        return options.complete(err);
      }

      var updatedContent = applyPatch(data, index, options);
      options.patched(index, updatedContent, function (err) {
        if (err) {
          return options.complete(err);
        }

        processIndex();
      });
    });
  }
  processIndex();
}


},{"../util/distance-iterator":56,"./parse":55}],54:[function(require,module,exports){
/*istanbul ignore start*/'use strict';

exports.__esModule = true;
exports. /*istanbul ignore end*/structuredPatch = structuredPatch;
/*istanbul ignore start*/exports. /*istanbul ignore end*/createTwoFilesPatch = createTwoFilesPatch;
/*istanbul ignore start*/exports. /*istanbul ignore end*/createPatch = createPatch;

var /*istanbul ignore start*/_line = require('../diff/line') /*istanbul ignore end*/;

/*istanbul ignore start*/
function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

/*istanbul ignore end*/function structuredPatch(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader, options) {
  if (!options) {
    options = {};
  }
  if (typeof options.context === 'undefined') {
    options.context = 4;
  }

  var diff = /*istanbul ignore start*/(0, _line.diffLines) /*istanbul ignore end*/(oldStr, newStr, options);
  diff.push({ value: '', lines: [] }); // Append an empty value to make cleanup easier

  function contextLines(lines) {
    return lines.map(function (entry) {
      return ' ' + entry;
    });
  }

  var hunks = [];
  var oldRangeStart = 0,
      newRangeStart = 0,
      curRange = [],
      oldLine = 1,
      newLine = 1;
  /*istanbul ignore start*/
  var _loop = function _loop( /*istanbul ignore end*/i) {
    var current = diff[i],
        lines = current.lines || current.value.replace(/\n$/, '').split('\n');
    current.lines = lines;

    if (current.added || current.removed) {
      /*istanbul ignore start*/
      var _curRange;

      /*istanbul ignore end*/
      // If we have previous context, start with that
      if (!oldRangeStart) {
        var prev = diff[i - 1];
        oldRangeStart = oldLine;
        newRangeStart = newLine;

        if (prev) {
          curRange = options.context > 0 ? contextLines(prev.lines.slice(-options.context)) : [];
          oldRangeStart -= curRange.length;
          newRangeStart -= curRange.length;
        }
      }

      // Output our changes
      /*istanbul ignore start*/(_curRange = /*istanbul ignore end*/curRange).push. /*istanbul ignore start*/apply /*istanbul ignore end*/( /*istanbul ignore start*/_curRange /*istanbul ignore end*/, /*istanbul ignore start*/_toConsumableArray( /*istanbul ignore end*/lines.map(function (entry) {
        return (current.added ? '+' : '-') + entry;
      })));

      // Track the updated file position
      if (current.added) {
        newLine += lines.length;
      } else {
        oldLine += lines.length;
      }
    } else {
      // Identical context lines. Track line changes
      if (oldRangeStart) {
        // Close out any changes that have been output (or join overlapping)
        if (lines.length <= options.context * 2 && i < diff.length - 2) {
          /*istanbul ignore start*/
          var _curRange2;

          /*istanbul ignore end*/
          // Overlapping
          /*istanbul ignore start*/(_curRange2 = /*istanbul ignore end*/curRange).push. /*istanbul ignore start*/apply /*istanbul ignore end*/( /*istanbul ignore start*/_curRange2 /*istanbul ignore end*/, /*istanbul ignore start*/_toConsumableArray( /*istanbul ignore end*/contextLines(lines)));
        } else {
          /*istanbul ignore start*/
          var _curRange3;

          /*istanbul ignore end*/
          // end the range and output
          var contextSize = Math.min(lines.length, options.context);
          /*istanbul ignore start*/(_curRange3 = /*istanbul ignore end*/curRange).push. /*istanbul ignore start*/apply /*istanbul ignore end*/( /*istanbul ignore start*/_curRange3 /*istanbul ignore end*/, /*istanbul ignore start*/_toConsumableArray( /*istanbul ignore end*/contextLines(lines.slice(0, contextSize))));

          var hunk = {
            oldStart: oldRangeStart,
            oldLines: oldLine - oldRangeStart + contextSize,
            newStart: newRangeStart,
            newLines: newLine - newRangeStart + contextSize,
            lines: curRange
          };
          if (i >= diff.length - 2 && lines.length <= options.context) {
            // EOF is inside this hunk
            var oldEOFNewline = /\n$/.test(oldStr);
            var newEOFNewline = /\n$/.test(newStr);
            if (lines.length == 0 && !oldEOFNewline) {
              // special case: old has no eol and no trailing context; no-nl can end up before adds
              curRange.splice(hunk.oldLines, 0, '\\ No newline at end of file');
            } else if (!oldEOFNewline || !newEOFNewline) {
              curRange.push('\\ No newline at end of file');
            }
          }
          hunks.push(hunk);

          oldRangeStart = 0;
          newRangeStart = 0;
          curRange = [];
        }
      }
      oldLine += lines.length;
      newLine += lines.length;
    }
  };

  for (var i = 0; i < diff.length; i++) {
    /*istanbul ignore start*/
    _loop( /*istanbul ignore end*/i);
  }

  return {
    oldFileName: oldFileName, newFileName: newFileName,
    oldHeader: oldHeader, newHeader: newHeader,
    hunks: hunks
  };
}

function createTwoFilesPatch(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader, options) {
  var diff = structuredPatch(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader, options);

  var ret = [];
  if (oldFileName == newFileName) {
    ret.push('Index: ' + oldFileName);
  }
  ret.push('===================================================================');
  ret.push('--- ' + diff.oldFileName + (typeof diff.oldHeader === 'undefined' ? '' : '\t' + diff.oldHeader));
  ret.push('+++ ' + diff.newFileName + (typeof diff.newHeader === 'undefined' ? '' : '\t' + diff.newHeader));

  for (var i = 0; i < diff.hunks.length; i++) {
    var hunk = diff.hunks[i];
    ret.push('@@ -' + hunk.oldStart + ',' + hunk.oldLines + ' +' + hunk.newStart + ',' + hunk.newLines + ' @@');
    ret.push.apply(ret, hunk.lines);
  }

  return ret.join('\n') + '\n';
}

function createPatch(fileName, oldStr, newStr, oldHeader, newHeader, options) {
  return createTwoFilesPatch(fileName, fileName, oldStr, newStr, oldHeader, newHeader, options);
}


},{"../diff/line":49}],55:[function(require,module,exports){
/*istanbul ignore start*/'use strict';

exports.__esModule = true;
exports. /*istanbul ignore end*/parsePatch = parsePatch;
function parsePatch(uniDiff) {
  /*istanbul ignore start*/var /*istanbul ignore end*/options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  var diffstr = uniDiff.split(/\r\n|[\n\v\f\r\x85]/),
      delimiters = uniDiff.match(/\r\n|[\n\v\f\r\x85]/g) || [],
      list = [],
      i = 0;

  function parseIndex() {
    var index = {};
    list.push(index);

    // Parse diff metadata
    while (i < diffstr.length) {
      var line = diffstr[i];

      // File header found, end parsing diff metadata
      if (/^(\-\-\-|\+\+\+|@@)\s/.test(line)) {
        break;
      }

      // Diff index
      var header = /^(?:Index:|diff(?: -r \w+)+)\s+(.+?)\s*$/.exec(line);
      if (header) {
        index.index = header[1];
      }

      i++;
    }

    // Parse file headers if they are defined. Unified diff requires them, but
    // there's no technical issues to have an isolated hunk without file header
    parseFileHeader(index);
    parseFileHeader(index);

    // Parse hunks
    index.hunks = [];

    while (i < diffstr.length) {
      var _line = diffstr[i];

      if (/^(Index:|diff|\-\-\-|\+\+\+)\s/.test(_line)) {
        break;
      } else if (/^@@/.test(_line)) {
        index.hunks.push(parseHunk());
      } else if (_line && options.strict) {
        // Ignore unexpected content unless in strict mode
        throw new Error('Unknown line ' + (i + 1) + ' ' + JSON.stringify(_line));
      } else {
        i++;
      }
    }
  }

  // Parses the --- and +++ headers, if none are found, no lines
  // are consumed.
  function parseFileHeader(index) {
    var headerPattern = /^(---|\+\+\+)\s+([\S ]*)(?:\t(.*?)\s*)?$/;
    var fileHeader = headerPattern.exec(diffstr[i]);
    if (fileHeader) {
      var keyPrefix = fileHeader[1] === '---' ? 'old' : 'new';
      index[keyPrefix + 'FileName'] = fileHeader[2];
      index[keyPrefix + 'Header'] = fileHeader[3];

      i++;
    }
  }

  // Parses a hunk
  // This assumes that we are at the start of a hunk.
  function parseHunk() {
    var chunkHeaderIndex = i,
        chunkHeaderLine = diffstr[i++],
        chunkHeader = chunkHeaderLine.split(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);

    var hunk = {
      oldStart: +chunkHeader[1],
      oldLines: +chunkHeader[2] || 1,
      newStart: +chunkHeader[3],
      newLines: +chunkHeader[4] || 1,
      lines: [],
      linedelimiters: []
    };

    var addCount = 0,
        removeCount = 0;
    for (; i < diffstr.length; i++) {
      // Lines starting with '---' could be mistaken for the "remove line" operation
      // But they could be the header for the next file. Therefore prune such cases out.
      if (diffstr[i].indexOf('--- ') === 0 && i + 2 < diffstr.length && diffstr[i + 1].indexOf('+++ ') === 0 && diffstr[i + 2].indexOf('@@') === 0) {
        break;
      }
      var operation = diffstr[i][0];

      if (operation === '+' || operation === '-' || operation === ' ' || operation === '\\') {
        hunk.lines.push(diffstr[i]);
        hunk.linedelimiters.push(delimiters[i] || '\n');

        if (operation === '+') {
          addCount++;
        } else if (operation === '-') {
          removeCount++;
        } else if (operation === ' ') {
          addCount++;
          removeCount++;
        }
      } else {
        break;
      }
    }

    // Handle the empty block count case
    if (!addCount && hunk.newLines === 1) {
      hunk.newLines = 0;
    }
    if (!removeCount && hunk.oldLines === 1) {
      hunk.oldLines = 0;
    }

    // Perform optional sanity checking
    if (options.strict) {
      if (addCount !== hunk.newLines) {
        throw new Error('Added line count did not match for hunk at line ' + (chunkHeaderIndex + 1));
      }
      if (removeCount !== hunk.oldLines) {
        throw new Error('Removed line count did not match for hunk at line ' + (chunkHeaderIndex + 1));
      }
    }

    return hunk;
  }

  while (i < diffstr.length) {
    parseIndex();
  }

  return list;
}


},{}],56:[function(require,module,exports){
/*istanbul ignore start*/"use strict";

exports.__esModule = true;

exports["default"] = /*istanbul ignore end*/function (start, minLine, maxLine) {
  var wantForward = true,
      backwardExhausted = false,
      forwardExhausted = false,
      localOffset = 1;

  return function iterator() {
    if (wantForward && !forwardExhausted) {
      if (backwardExhausted) {
        localOffset++;
      } else {
        wantForward = false;
      }

      // Check if trying to fit beyond text length, and if not, check it fits
      // after offset location (or desired location on first iteration)
      if (start + localOffset <= maxLine) {
        return localOffset;
      }

      forwardExhausted = true;
    }

    if (!backwardExhausted) {
      if (!forwardExhausted) {
        wantForward = true;
      }

      // Check if trying to fit before text beginning, and if not, check it fits
      // before offset location
      if (minLine <= start - localOffset) {
        return -localOffset++;
      }

      backwardExhausted = true;
      return iterator();
    }

    // We tried to fit hunk before text beginning and beyond text lenght, then
    // hunk can't fit on the text. Return undefined
  };
};


},{}],57:[function(require,module,exports){
/*istanbul ignore start*/'use strict';

exports.__esModule = true;
exports. /*istanbul ignore end*/generateOptions = generateOptions;
function generateOptions(options, defaults) {
  if (typeof options === 'function') {
    defaults.callback = options;
  } else if (options) {
    for (var name in options) {
      /* istanbul ignore else */
      if (options.hasOwnProperty(name)) {
        defaults[name] = options[name];
      }
    }
  }
  return defaults;
}


},{}],58:[function(require,module,exports){

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


},{}],59:[function(require,module,exports){

var indexOf = [].indexOf;

module.exports = function(arr, obj){
  if (indexOf) return arr.indexOf(obj);
  for (var i = 0; i < arr.length; ++i) {
    if (arr[i] === obj) return i;
  }
  return -1;
};
},{}],60:[function(require,module,exports){
module.exports = Array.isArray || function (arr) {
  return Object.prototype.toString.call(arr) == '[object Array]';
};

},{}],61:[function(require,module,exports){
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

},{}],62:[function(require,module,exports){
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


},{}],63:[function(require,module,exports){
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


},{"./foreach":62,"./isArguments":64}],64:[function(require,module,exports){
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


},{}],65:[function(require,module,exports){

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

},{"array-map":30,"array-reduce":31,"foreach":58,"indexof":59,"isarray":60,"json3":61,"object-keys":63}],66:[function(require,module,exports){
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

},{"../lib/reporter":22}],67:[function(require,module,exports){
"use strict"

exports.dot = require("./dot")
exports.spec = require("./spec")
exports.tap = require("./tap")

},{"./dot":66,"./spec":68,"./tap":69}],68:[function(require,module,exports){
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

},{"../lib/reporter":22}],69:[function(require,module,exports){
"use strict"

// This is a basic TAP-generating reporter.

var peach = require("../lib/util").peach
var R = require("../lib/reporter")
var inspect = require("clean-assert-util").inspect

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

},{"../lib/reporter":22,"../lib/util":27,"clean-assert-util":33}],"thallium":[function(require,module,exports){
"use strict"

module.exports = require("../lib/browser-bundle")

require("../migrate/index")

// Note: both of these are deprecated
module.exports.assertions = require("../assertions")
module.exports.create = require("../migrate/common").deprecate(
    "`tl.create` is deprecated. Please use `tl.root` instead.",
    module.exports.root)

},{"../assertions":2,"../lib/browser-bundle":9,"../migrate/common":28,"../migrate/index":29}]},{},[])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhc3NlcnQuanMiLCJhc3NlcnRpb25zLmpzIiwiZG9tLmpzIiwiaW5kZXguanMiLCJpbnRlcm5hbC5qcyIsImxpYi9hcGkvaG9va3MuanMiLCJsaWIvYXBpL3JlZmxlY3QuanMiLCJsaWIvYXBpL3RoYWxsaXVtLmpzIiwibGliL2Jyb3dzZXItYnVuZGxlLmpzIiwibGliL2NvcmUvb25seS5qcyIsImxpYi9jb3JlL3JlcG9ydHMuanMiLCJsaWIvY29yZS90ZXN0cy5qcyIsImxpYi9kb20vaW5kZXguanMiLCJsaWIvZG9tL2luaXRpYWxpemUuanMiLCJsaWIvZG9tL2luamVjdC1zdHlsZXMuanMiLCJsaWIvZG9tL2luamVjdC5qcyIsImxpYi9kb20vcnVuLXRlc3RzLmpzIiwibGliL2RvbS92aWV3LmpzIiwibGliL21ldGhvZHMuanMiLCJsaWIvcmVwbGFjZWQvY29uc29sZS1icm93c2VyLmpzIiwibGliL3JlcG9ydGVyL2NvbnNvbGUtcmVwb3J0ZXIuanMiLCJsaWIvcmVwb3J0ZXIvaW5kZXguanMiLCJsaWIvcmVwb3J0ZXIvb24uanMiLCJsaWIvcmVwb3J0ZXIvcmVwb3J0ZXIuanMiLCJsaWIvcmVwb3J0ZXIvdXRpbC5qcyIsImxpYi9zZXR0aW5ncy5qcyIsImxpYi91dGlsLmpzIiwibWlncmF0ZS9jb21tb24uanMiLCJtaWdyYXRlL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2FycmF5LW1hcC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9hcnJheS1yZWR1Y2UvaW5kZXguanMiLCJub2RlX21vZHVsZXMvY2xlYW4tYXNzZXJ0LXV0aWwvYnJvd3Nlci1pbnNwZWN0LmpzIiwibm9kZV9tb2R1bGVzL2NsZWFuLWFzc2VydC11dGlsL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2NsZWFuLWFzc2VydC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9jbGVhbi1hc3NlcnQvbGliL2VxdWFsLmpzIiwibm9kZV9tb2R1bGVzL2NsZWFuLWFzc2VydC9saWIvaGFzLWtleXMuanMiLCJub2RlX21vZHVsZXMvY2xlYW4tYXNzZXJ0L2xpYi9oYXMuanMiLCJub2RlX21vZHVsZXMvY2xlYW4tYXNzZXJ0L2xpYi9pbmNsdWRlcy5qcyIsIm5vZGVfbW9kdWxlcy9jbGVhbi1hc3NlcnQvbGliL3Rocm93cy5qcyIsIm5vZGVfbW9kdWxlcy9jbGVhbi1hc3NlcnQvbGliL3R5cGUuanMiLCJub2RlX21vZHVsZXMvY2xlYW4tbWF0Y2gvY2xlYW4tbWF0Y2guanMiLCJub2RlX21vZHVsZXMvZGlmZi9zcmMvY29udmVydC9kbXAuanMiLCJub2RlX21vZHVsZXMvZGlmZi9zcmMvY29udmVydC94bWwuanMiLCJub2RlX21vZHVsZXMvZGlmZi9zcmMvZGlmZi9hcnJheS5qcyIsIm5vZGVfbW9kdWxlcy9kaWZmL3NyYy9kaWZmL2Jhc2UuanMiLCJub2RlX21vZHVsZXMvZGlmZi9zcmMvZGlmZi9jaGFyYWN0ZXIuanMiLCJub2RlX21vZHVsZXMvZGlmZi9zcmMvZGlmZi9jc3MuanMiLCJub2RlX21vZHVsZXMvZGlmZi9zcmMvZGlmZi9qc29uLmpzIiwibm9kZV9tb2R1bGVzL2RpZmYvc3JjL2RpZmYvbGluZS5qcyIsIm5vZGVfbW9kdWxlcy9kaWZmL3NyYy9kaWZmL3NlbnRlbmNlLmpzIiwibm9kZV9tb2R1bGVzL2RpZmYvc3JjL2RpZmYvd29yZC5qcyIsIm5vZGVfbW9kdWxlcy9kaWZmL3NyYy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9kaWZmL3NyYy9wYXRjaC9hcHBseS5qcyIsIm5vZGVfbW9kdWxlcy9kaWZmL3NyYy9wYXRjaC9jcmVhdGUuanMiLCJub2RlX21vZHVsZXMvZGlmZi9zcmMvcGF0Y2gvcGFyc2UuanMiLCJub2RlX21vZHVsZXMvZGlmZi9zcmMvdXRpbC9kaXN0YW5jZS1pdGVyYXRvci5qcyIsIm5vZGVfbW9kdWxlcy9kaWZmL3NyYy91dGlsL3BhcmFtcy5qcyIsIm5vZGVfbW9kdWxlcy9mb3JlYWNoL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2luZGV4b2YvaW5kZXguanMiLCJub2RlX21vZHVsZXMvaXNhcnJheS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9qc29uMy9saWIvanNvbjMuanMiLCJub2RlX21vZHVsZXMvb2JqZWN0LWtleXMvZm9yZWFjaC5qcyIsIm5vZGVfbW9kdWxlcy9vYmplY3Qta2V5cy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9vYmplY3Qta2V5cy9pc0FyZ3VtZW50cy5qcyIsIm5vZGVfbW9kdWxlcy91dGlsLWluc3BlY3QvaW5kZXguanMiLCJyL2RvdC5qcyIsInIvaW5kZXguanMiLCJyL3NwZWMuanMiLCJyL3RhcC5qcyIsIm1pZ3JhdGUvYnVuZGxlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDLzJCQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeFdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbk5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzFRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNwZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDdlhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDckpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDclFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDbERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25MQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzlGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2poQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3RJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7OztnQ0M1cEJnQixtQixHQUFBLG1COztBQUFULFNBQVMsbUJBQVQsQ0FBNkIsT0FBN0IsRUFBc0M7QUFDM0MsTUFBSSxNQUFNLEVBQVY7QUFBQSxNQUNJLFMseUJBQUEsTSx3QkFESjtBQUFBLE1BRUksWSx5QkFBQSxNLHdCQUZKO0FBR0EsT0FBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLFFBQVEsTUFBNUIsRUFBb0MsR0FBcEMsRUFBeUM7QUFDdkMsYUFBUyxRQUFRLENBQVIsQ0FBVDtBQUNBLFFBQUksT0FBTyxLQUFYLEVBQWtCO0FBQ2hCLGtCQUFZLENBQVo7QUFDRCxLQUZELE1BRU8sSUFBSSxPQUFPLE9BQVgsRUFBb0I7QUFDekIsa0JBQVksQ0FBQyxDQUFiO0FBQ0QsS0FGTSxNQUVBO0FBQ0wsa0JBQVksQ0FBWjtBQUNEOztBQUVELFFBQUksSUFBSixDQUFTLENBQUMsU0FBRCxFQUFZLE9BQU8sS0FBbkIsQ0FBVDtBQUNEO0FBQ0QsU0FBTyxHQUFQO0FBQ0Q7Ozs7Ozs7Z0NDbEJlLG1CLEdBQUEsbUI7QUFBVCxTQUFTLG1CQUFULENBQTZCLE9BQTdCLEVBQXNDO0FBQzNDLE1BQUksTUFBTSxFQUFWO0FBQ0EsT0FBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLFFBQVEsTUFBNUIsRUFBb0MsR0FBcEMsRUFBeUM7QUFDdkMsUUFBSSxTQUFTLFFBQVEsQ0FBUixDQUFiO0FBQ0EsUUFBSSxPQUFPLEtBQVgsRUFBa0I7QUFDaEIsVUFBSSxJQUFKLENBQVMsT0FBVDtBQUNELEtBRkQsTUFFTyxJQUFJLE9BQU8sT0FBWCxFQUFvQjtBQUN6QixVQUFJLElBQUosQ0FBUyxPQUFUO0FBQ0Q7O0FBRUQsUUFBSSxJQUFKLENBQVMsV0FBVyxPQUFPLEtBQWxCLENBQVQ7O0FBRUEsUUFBSSxPQUFPLEtBQVgsRUFBa0I7QUFDaEIsVUFBSSxJQUFKLENBQVMsUUFBVDtBQUNELEtBRkQsTUFFTyxJQUFJLE9BQU8sT0FBWCxFQUFvQjtBQUN6QixVQUFJLElBQUosQ0FBUyxRQUFUO0FBQ0Q7QUFDRjtBQUNELFNBQU8sSUFBSSxJQUFKLENBQVMsRUFBVCxDQUFQO0FBQ0Q7O0FBRUQsU0FBUyxVQUFULENBQW9CLENBQXBCLEVBQXVCO0FBQ3JCLE1BQUksSUFBSSxDQUFSO0FBQ0EsTUFBSSxFQUFFLE9BQUYsQ0FBVSxJQUFWLEVBQWdCLE9BQWhCLENBQUo7QUFDQSxNQUFJLEVBQUUsT0FBRixDQUFVLElBQVYsRUFBZ0IsTUFBaEIsQ0FBSjtBQUNBLE1BQUksRUFBRSxPQUFGLENBQVUsSUFBVixFQUFnQixNQUFoQixDQUFKO0FBQ0EsTUFBSSxFQUFFLE9BQUYsQ0FBVSxJQUFWLEVBQWdCLFFBQWhCLENBQUo7O0FBRUEsU0FBTyxDQUFQO0FBQ0Q7Ozs7Ozs7O2dDQ3RCZSxVLEdBQUEsVTs7QUFQaEIsSSx5QkFBQSx5Qix3QkFBQTs7Ozs7Ozt1QkFFTyxJQUFNLFkseUJBQUEsUSx3QkFBQSxZQUFZLEkseUJBQUEsbUIsd0JBQWxCO0FBQ1AsVUFBVSxRQUFWLEdBQXFCLFVBQVUsSUFBVixHQUFpQixVQUFTLEtBQVQsRUFBZ0I7QUFDcEQsU0FBTyxNQUFNLEtBQU4sRUFBUDtBQUNELENBRkQ7O0FBSU8sU0FBUyxVQUFULENBQW9CLE1BQXBCLEVBQTRCLE1BQTVCLEVBQW9DLFFBQXBDLEVBQThDO0FBQUUsU0FBTyxVQUFVLElBQVYsQ0FBZSxNQUFmLEVBQXVCLE1BQXZCLEVBQStCLFFBQS9CLENBQVA7QUFBa0Q7Ozs7Ozs7NENDUGpGLEk7QUFBVCxTQUFTLElBQVQsR0FBZ0IsQ0FBRTs7QUFFakMsS0FBSyxTQUFMLEdBQWlCLEU7eUJBQ2YsSUFEZSxnQkFDVixTQURVLEVBQ0MsU0FERCxFQUMwQjs2QkFBQSxJLHVCQUFkLE9BQWMseURBQUosRUFBSTs7QUFDdkMsUUFBSSxXQUFXLFFBQVEsUUFBdkI7QUFDQSxRQUFJLE9BQU8sT0FBUCxLQUFtQixVQUF2QixFQUFtQztBQUNqQyxpQkFBVyxPQUFYO0FBQ0EsZ0JBQVUsRUFBVjtBQUNEO0FBQ0QsU0FBSyxPQUFMLEdBQWUsT0FBZjs7QUFFQSxRQUFJLE9BQU8sSUFBWDs7QUFFQSxhQUFTLElBQVQsQ0FBYyxLQUFkLEVBQXFCO0FBQ25CLFVBQUksUUFBSixFQUFjO0FBQ1osbUJBQVcsWUFBVztBQUFFLG1CQUFTLFNBQVQsRUFBb0IsS0FBcEI7QUFBNkIsU0FBckQsRUFBdUQsQ0FBdkQ7QUFDQSxlQUFPLElBQVA7QUFDRCxPQUhELE1BR087QUFDTCxlQUFPLEtBQVA7QUFDRDtBQUNGOzs7QUFHRCxnQkFBWSxLQUFLLFNBQUwsQ0FBZSxTQUFmLENBQVo7QUFDQSxnQkFBWSxLQUFLLFNBQUwsQ0FBZSxTQUFmLENBQVo7O0FBRUEsZ0JBQVksS0FBSyxXQUFMLENBQWlCLEtBQUssUUFBTCxDQUFjLFNBQWQsQ0FBakIsQ0FBWjtBQUNBLGdCQUFZLEtBQUssV0FBTCxDQUFpQixLQUFLLFFBQUwsQ0FBYyxTQUFkLENBQWpCLENBQVo7O0FBRUEsUUFBSSxTQUFTLFVBQVUsTUFBdkI7QUFBQSxRQUErQixTQUFTLFVBQVUsTUFBbEQ7QUFDQSxRQUFJLGFBQWEsQ0FBakI7QUFDQSxRQUFJLGdCQUFnQixTQUFTLE1BQTdCO0FBQ0EsUUFBSSxXQUFXLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBWCxFQUFjLFlBQVksRUFBMUIsRUFBRCxDQUFmOzs7QUFHQSxRQUFJLFNBQVMsS0FBSyxhQUFMLENBQW1CLFNBQVMsQ0FBVCxDQUFuQixFQUFnQyxTQUFoQyxFQUEyQyxTQUEzQyxFQUFzRCxDQUF0RCxDQUFiO0FBQ0EsUUFBSSxTQUFTLENBQVQsRUFBWSxNQUFaLEdBQXFCLENBQXJCLElBQTBCLE1BQTFCLElBQW9DLFNBQVMsQ0FBVCxJQUFjLE1BQXRELEVBQThEOztBQUU1RCxhQUFPLEtBQUssQ0FBQyxFQUFDLE9BQU8sS0FBSyxJQUFMLENBQVUsU0FBVixDQUFSLEVBQThCLE9BQU8sVUFBVSxNQUEvQyxFQUFELENBQUwsQ0FBUDtBQUNEOzs7QUFHRCxhQUFTLGNBQVQsR0FBMEI7QUFDeEIsV0FBSyxJQUFJLGVBQWUsQ0FBQyxDQUFELEdBQUssVUFBN0IsRUFBeUMsZ0JBQWdCLFVBQXpELEVBQXFFLGdCQUFnQixDQUFyRixFQUF3RjtBQUN0RixZQUFJLFcseUJBQUEsTSx3QkFBSjtBQUNBLFlBQUksVUFBVSxTQUFTLGVBQWUsQ0FBeEIsQ0FBZDtBQUFBLFlBQ0ksYUFBYSxTQUFTLGVBQWUsQ0FBeEIsQ0FEakI7QUFBQSxZQUVJLFVBQVMsQ0FBQyxhQUFhLFdBQVcsTUFBeEIsR0FBaUMsQ0FBbEMsSUFBdUMsWUFGcEQ7QUFHQSxZQUFJLE9BQUosRUFBYTs7QUFFWCxtQkFBUyxlQUFlLENBQXhCLElBQTZCLFNBQTdCO0FBQ0Q7O0FBRUQsWUFBSSxTQUFTLFdBQVcsUUFBUSxNQUFSLEdBQWlCLENBQWpCLEdBQXFCLE1BQTdDO0FBQUEsWUFDSSxZQUFZLGNBQWMsS0FBSyxPQUFuQixJQUE2QixVQUFTLE1BRHREO0FBRUEsWUFBSSxDQUFDLE1BQUQsSUFBVyxDQUFDLFNBQWhCLEVBQTJCOztBQUV6QixtQkFBUyxZQUFULElBQXlCLFNBQXpCO0FBQ0E7QUFDRDs7Ozs7QUFLRCxZQUFJLENBQUMsTUFBRCxJQUFZLGFBQWEsUUFBUSxNQUFSLEdBQWlCLFdBQVcsTUFBekQsRUFBa0U7QUFDaEUscUJBQVcsVUFBVSxVQUFWLENBQVg7QUFDQSxlQUFLLGFBQUwsQ0FBbUIsU0FBUyxVQUE1QixFQUF3QyxTQUF4QyxFQUFtRCxJQUFuRDtBQUNELFNBSEQsTUFHTztBQUNMLHFCQUFXLE9BQVgsQztBQUNBLG1CQUFTLE1BQVQ7QUFDQSxlQUFLLGFBQUwsQ0FBbUIsU0FBUyxVQUE1QixFQUF3QyxJQUF4QyxFQUE4QyxTQUE5QztBQUNEOztBQUVELGtCQUFTLEtBQUssYUFBTCxDQUFtQixRQUFuQixFQUE2QixTQUE3QixFQUF3QyxTQUF4QyxFQUFtRCxZQUFuRCxDQUFUOzs7QUFHQSxZQUFJLFNBQVMsTUFBVCxHQUFrQixDQUFsQixJQUF1QixNQUF2QixJQUFpQyxVQUFTLENBQVQsSUFBYyxNQUFuRCxFQUEyRDtBQUN6RCxpQkFBTyxLQUFLLFlBQVksSUFBWixFQUFrQixTQUFTLFVBQTNCLEVBQXVDLFNBQXZDLEVBQWtELFNBQWxELEVBQTZELEtBQUssZUFBbEUsQ0FBTCxDQUFQO0FBQ0QsU0FGRCxNQUVPOztBQUVMLG1CQUFTLFlBQVQsSUFBeUIsUUFBekI7QUFDRDtBQUNGOztBQUVEO0FBQ0Q7Ozs7O0FBS0QsUUFBSSxRQUFKLEVBQWM7QUFDWCxnQkFBUyxJQUFULEdBQWdCO0FBQ2YsbUJBQVcsWUFBVzs7O0FBR3BCLGNBQUksYUFBYSxhQUFqQixFQUFnQztBQUM5QixtQkFBTyxVQUFQO0FBQ0Q7O0FBRUQsY0FBSSxDQUFDLGdCQUFMLEVBQXVCO0FBQ3JCO0FBQ0Q7QUFDRixTQVZELEVBVUcsQ0FWSDtBQVdELE9BWkEsR0FBRDtBQWFELEtBZEQsTUFjTztBQUNMLGFBQU8sY0FBYyxhQUFyQixFQUFvQztBQUNsQyxZQUFJLE1BQU0sZ0JBQVY7QUFDQSxZQUFJLEdBQUosRUFBUztBQUNQLGlCQUFPLEdBQVA7QUFDRDtBQUNGO0FBQ0Y7QUFDRixHQTlHYzttREFnSGYsYUFoSGUseUJBZ0hELFVBaEhDLEVBZ0hXLEtBaEhYLEVBZ0hrQixPQWhIbEIsRUFnSDJCO0FBQ3hDLFFBQUksT0FBTyxXQUFXLFdBQVcsTUFBWCxHQUFvQixDQUEvQixDQUFYO0FBQ0EsUUFBSSxRQUFRLEtBQUssS0FBTCxLQUFlLEtBQXZCLElBQWdDLEtBQUssT0FBTCxLQUFpQixPQUFyRCxFQUE4RDs7O0FBRzVELGlCQUFXLFdBQVcsTUFBWCxHQUFvQixDQUEvQixJQUFvQyxFQUFDLE9BQU8sS0FBSyxLQUFMLEdBQWEsQ0FBckIsRUFBd0IsT0FBTyxLQUEvQixFQUFzQyxTQUFTLE9BQS9DLEVBQXBDO0FBQ0QsS0FKRCxNQUlPO0FBQ0wsaUJBQVcsSUFBWCxDQUFnQixFQUFDLE9BQU8sQ0FBUixFQUFXLE9BQU8sS0FBbEIsRUFBeUIsU0FBUyxPQUFsQyxFQUFoQjtBQUNEO0FBQ0YsR0F6SGM7bURBMEhmLGFBMUhlLHlCQTBIRCxRQTFIQyxFQTBIUyxTQTFIVCxFQTBIb0IsU0ExSHBCLEVBMEgrQixZQTFIL0IsRUEwSDZDO0FBQzFELFFBQUksU0FBUyxVQUFVLE1BQXZCO0FBQUEsUUFDSSxTQUFTLFVBQVUsTUFEdkI7QUFBQSxRQUVJLFNBQVMsU0FBUyxNQUZ0QjtBQUFBLFFBR0ksU0FBUyxTQUFTLFlBSHRCO0FBQUEsUUFLSSxjQUFjLENBTGxCO0FBTUEsV0FBTyxTQUFTLENBQVQsR0FBYSxNQUFiLElBQXVCLFNBQVMsQ0FBVCxHQUFhLE1BQXBDLElBQThDLEtBQUssTUFBTCxDQUFZLFVBQVUsU0FBUyxDQUFuQixDQUFaLEVBQW1DLFVBQVUsU0FBUyxDQUFuQixDQUFuQyxDQUFyRCxFQUFnSDtBQUM5RztBQUNBO0FBQ0E7QUFDRDs7QUFFRCxRQUFJLFdBQUosRUFBaUI7QUFDZixlQUFTLFVBQVQsQ0FBb0IsSUFBcEIsQ0FBeUIsRUFBQyxPQUFPLFdBQVIsRUFBekI7QUFDRDs7QUFFRCxhQUFTLE1BQVQsR0FBa0IsTUFBbEI7QUFDQSxXQUFPLE1BQVA7QUFDRCxHQTdJYzttREErSWYsTUEvSWUsa0JBK0lSLElBL0lRLEVBK0lGLEtBL0lFLEVBK0lLO0FBQ2xCLFdBQU8sU0FBUyxLQUFoQjtBQUNELEdBakpjO21EQWtKZixXQWxKZSx1QkFrSkgsS0FsSkcsRUFrSkk7QUFDakIsUUFBSSxNQUFNLEVBQVY7QUFDQSxTQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLElBQUksTUFBTSxNQUExQixFQUFrQyxHQUFsQyxFQUF1QztBQUNyQyxVQUFJLE1BQU0sQ0FBTixDQUFKLEVBQWM7QUFDWixZQUFJLElBQUosQ0FBUyxNQUFNLENBQU4sQ0FBVDtBQUNEO0FBQ0Y7QUFDRCxXQUFPLEdBQVA7QUFDRCxHQTFKYzttREEySmYsU0EzSmUscUJBMkpMLEtBM0pLLEVBMkpFO0FBQ2YsV0FBTyxLQUFQO0FBQ0QsR0E3SmM7bURBOEpmLFFBOUplLG9CQThKTixLQTlKTSxFQThKQztBQUNkLFdBQU8sTUFBTSxLQUFOLENBQVksRUFBWixDQUFQO0FBQ0QsR0FoS2M7bURBaUtmLElBaktlLGdCQWlLVixLQWpLVSxFQWlLSDtBQUNWLFdBQU8sTUFBTSxJQUFOLENBQVcsRUFBWCxDQUFQO0FBQ0Q7QUFuS2MsQ0FBakI7O0FBc0tBLFNBQVMsV0FBVCxDQUFxQixJQUFyQixFQUEyQixVQUEzQixFQUF1QyxTQUF2QyxFQUFrRCxTQUFsRCxFQUE2RCxlQUE3RCxFQUE4RTtBQUM1RSxNQUFJLGVBQWUsQ0FBbkI7QUFBQSxNQUNJLGVBQWUsV0FBVyxNQUQ5QjtBQUFBLE1BRUksU0FBUyxDQUZiO0FBQUEsTUFHSSxTQUFTLENBSGI7O0FBS0EsU0FBTyxlQUFlLFlBQXRCLEVBQW9DLGNBQXBDLEVBQW9EO0FBQ2xELFFBQUksWUFBWSxXQUFXLFlBQVgsQ0FBaEI7QUFDQSxRQUFJLENBQUMsVUFBVSxPQUFmLEVBQXdCO0FBQ3RCLFVBQUksQ0FBQyxVQUFVLEtBQVgsSUFBb0IsZUFBeEIsRUFBeUM7QUFDdkMsWUFBSSxRQUFRLFVBQVUsS0FBVixDQUFnQixNQUFoQixFQUF3QixTQUFTLFVBQVUsS0FBM0MsQ0FBWjtBQUNBLGdCQUFRLE1BQU0sR0FBTixDQUFVLFVBQVMsS0FBVCxFQUFnQixDQUFoQixFQUFtQjtBQUNuQyxjQUFJLFdBQVcsVUFBVSxTQUFTLENBQW5CLENBQWY7QUFDQSxpQkFBTyxTQUFTLE1BQVQsR0FBa0IsTUFBTSxNQUF4QixHQUFpQyxRQUFqQyxHQUE0QyxLQUFuRDtBQUNELFNBSE8sQ0FBUjs7QUFLQSxrQkFBVSxLQUFWLEdBQWtCLEtBQUssSUFBTCxDQUFVLEtBQVYsQ0FBbEI7QUFDRCxPQVJELE1BUU87QUFDTCxrQkFBVSxLQUFWLEdBQWtCLEtBQUssSUFBTCxDQUFVLFVBQVUsS0FBVixDQUFnQixNQUFoQixFQUF3QixTQUFTLFVBQVUsS0FBM0MsQ0FBVixDQUFsQjtBQUNEO0FBQ0QsZ0JBQVUsVUFBVSxLQUFwQjs7O0FBR0EsVUFBSSxDQUFDLFVBQVUsS0FBZixFQUFzQjtBQUNwQixrQkFBVSxVQUFVLEtBQXBCO0FBQ0Q7QUFDRixLQWxCRCxNQWtCTztBQUNMLGdCQUFVLEtBQVYsR0FBa0IsS0FBSyxJQUFMLENBQVUsVUFBVSxLQUFWLENBQWdCLE1BQWhCLEVBQXdCLFNBQVMsVUFBVSxLQUEzQyxDQUFWLENBQWxCO0FBQ0EsZ0JBQVUsVUFBVSxLQUFwQjs7Ozs7QUFLQSxVQUFJLGdCQUFnQixXQUFXLGVBQWUsQ0FBMUIsRUFBNkIsS0FBakQsRUFBd0Q7QUFDdEQsWUFBSSxNQUFNLFdBQVcsZUFBZSxDQUExQixDQUFWO0FBQ0EsbUJBQVcsZUFBZSxDQUExQixJQUErQixXQUFXLFlBQVgsQ0FBL0I7QUFDQSxtQkFBVyxZQUFYLElBQTJCLEdBQTNCO0FBQ0Q7QUFDRjtBQUNGOzs7O0FBSUQsTUFBSSxnQkFBZ0IsV0FBVyxlQUFlLENBQTFCLENBQXBCO0FBQ0EsTUFBSSxlQUFlLENBQWYsS0FDSSxjQUFjLEtBQWQsSUFBdUIsY0FBYyxPQUR6QyxLQUVHLEtBQUssTUFBTCxDQUFZLEVBQVosRUFBZ0IsY0FBYyxLQUE5QixDQUZQLEVBRTZDO0FBQzNDLGVBQVcsZUFBZSxDQUExQixFQUE2QixLQUE3QixJQUFzQyxjQUFjLEtBQXBEO0FBQ0EsZUFBVyxHQUFYO0FBQ0Q7O0FBRUQsU0FBTyxVQUFQO0FBQ0Q7O0FBRUQsU0FBUyxTQUFULENBQW1CLElBQW5CLEVBQXlCO0FBQ3ZCLFNBQU8sRUFBRSxRQUFRLEtBQUssTUFBZixFQUF1QixZQUFZLEtBQUssVUFBTCxDQUFnQixLQUFoQixDQUFzQixDQUF0QixDQUFuQyxFQUFQO0FBQ0Q7Ozs7Ozs7O2dDQzdOZSxTLEdBQUEsUzs7QUFIaEIsSSx5QkFBQSx5Qix3QkFBQTs7Ozs7Ozt1QkFFTyxJQUFNLGdCLHlCQUFBLFEsd0JBQUEsZ0JBQWdCLEkseUJBQUEsbUIsd0JBQXRCO0FBQ0EsU0FBUyxTQUFULENBQW1CLE1BQW5CLEVBQTJCLE1BQTNCLEVBQW1DLFFBQW5DLEVBQTZDO0FBQUUsU0FBTyxjQUFjLElBQWQsQ0FBbUIsTUFBbkIsRUFBMkIsTUFBM0IsRUFBbUMsUUFBbkMsQ0FBUDtBQUFzRDs7Ozs7Ozs7Z0NDSTVGLE8sR0FBQSxPOztBQVBoQixJLHlCQUFBLHlCLHdCQUFBOzs7Ozs7O3VCQUVPLElBQU0sVSx5QkFBQSxRLHdCQUFBLFVBQVUsSSx5QkFBQSxtQix3QkFBaEI7QUFDUCxRQUFRLFFBQVIsR0FBbUIsVUFBUyxLQUFULEVBQWdCO0FBQ2pDLFNBQU8sTUFBTSxLQUFOLENBQVksZUFBWixDQUFQO0FBQ0QsQ0FGRDs7QUFJTyxTQUFTLE9BQVQsQ0FBaUIsTUFBakIsRUFBeUIsTUFBekIsRUFBaUMsUUFBakMsRUFBMkM7QUFBRSxTQUFPLFFBQVEsSUFBUixDQUFhLE1BQWIsRUFBcUIsTUFBckIsRUFBNkIsUUFBN0IsQ0FBUDtBQUFnRDs7Ozs7Ozs7Ozs7Z0NDb0JwRixRLEdBQUEsUTt5REFJQSxZLEdBQUEsWTs7QUEvQmhCLEkseUJBQUEseUIsd0JBQUE7Ozs7OztBQUNBLEkseUJBQUEseUIsd0JBQUE7Ozs7Ozs7QUFFQSxJQUFNLDBCQUEwQixPQUFPLFNBQVAsQ0FBaUIsUUFBakQ7O0FBR08sSUFBTSxXLHlCQUFBLFEsd0JBQUEsV0FBVyxJLHlCQUFBLG1CLHdCQUFqQjs7O0FBR1AsU0FBUyxlQUFULEdBQTJCLElBQTNCOztBQUVBLFNBQVMsUUFBVCxHLHlCQUFvQixlLHdCQUFTLFFBQTdCO0FBQ0EsU0FBUyxTQUFULEdBQXFCLFVBQVMsS0FBVCxFQUFnQjsyQkFBQSxJLHVCQUM1QixvQkFENEIsR0FDSixLQUFLLE9BREQsQ0FDNUIsb0JBRDRCOzs7QUFHbkMsU0FBTyxPQUFPLEtBQVAsS0FBaUIsUUFBakIsR0FBNEIsS0FBNUIsR0FBb0MsS0FBSyxTQUFMLENBQWUsYUFBYSxLQUFiLENBQWYsRUFBb0MsVUFBUyxDQUFULEVBQVksQ0FBWixFQUFlO0FBQzVGLFFBQUksT0FBTyxDQUFQLEtBQWEsV0FBakIsRUFBOEI7QUFDNUIsYUFBTyxvQkFBUDtBQUNEOztBQUVELFdBQU8sQ0FBUDtBQUNELEdBTjBDLEVBTXhDLElBTndDLENBQTNDO0FBT0QsQ0FWRDtBQVdBLFNBQVMsTUFBVCxHQUFrQixVQUFTLElBQVQsRUFBZSxLQUFmLEVBQXNCO0FBQ3RDLFMsMEJBQU8sa0Isd0JBQUssU0FBTCxDQUFlLE1BQWYsQ0FBc0IsS0FBSyxPQUFMLENBQWEsWUFBYixFQUEyQixJQUEzQixDQUF0QixFQUF3RCxNQUFNLE9BQU4sQ0FBYyxZQUFkLEVBQTRCLElBQTVCLENBQXhEO0FBQVA7QUFDRCxDQUZEOztBQUlPLFNBQVMsUUFBVCxDQUFrQixNQUFsQixFQUEwQixNQUExQixFQUFrQyxPQUFsQyxFQUEyQztBQUFFLFNBQU8sU0FBUyxJQUFULENBQWMsTUFBZCxFQUFzQixNQUF0QixFQUE4QixPQUE5QixDQUFQO0FBQWdEOzs7O0FBSTdGLFNBQVMsWUFBVCxDQUFzQixHQUF0QixFQUEyQixLQUEzQixFQUFrQyxnQkFBbEMsRUFBb0Q7QUFDekQsVUFBUSxTQUFTLEVBQWpCO0FBQ0EscUJBQW1CLG9CQUFvQixFQUF2Qzs7QUFFQSxNQUFJLEkseUJBQUEsTSx3QkFBSjs7QUFFQSxPQUFLLElBQUksQ0FBVCxFQUFZLElBQUksTUFBTSxNQUF0QixFQUE4QixLQUFLLENBQW5DLEVBQXNDO0FBQ3BDLFFBQUksTUFBTSxDQUFOLE1BQWEsR0FBakIsRUFBc0I7QUFDcEIsYUFBTyxpQkFBaUIsQ0FBakIsQ0FBUDtBQUNEO0FBQ0Y7O0FBRUQsTUFBSSxtQix5QkFBQSxNLHdCQUFKOztBQUVBLE1BQUkscUJBQXFCLHdCQUF3QixJQUF4QixDQUE2QixHQUE3QixDQUF6QixFQUE0RDtBQUMxRCxVQUFNLElBQU4sQ0FBVyxHQUFYO0FBQ0EsdUJBQW1CLElBQUksS0FBSixDQUFVLElBQUksTUFBZCxDQUFuQjtBQUNBLHFCQUFpQixJQUFqQixDQUFzQixnQkFBdEI7QUFDQSxTQUFLLElBQUksQ0FBVCxFQUFZLElBQUksSUFBSSxNQUFwQixFQUE0QixLQUFLLENBQWpDLEVBQW9DO0FBQ2xDLHVCQUFpQixDQUFqQixJQUFzQixhQUFhLElBQUksQ0FBSixDQUFiLEVBQXFCLEtBQXJCLEVBQTRCLGdCQUE1QixDQUF0QjtBQUNEO0FBQ0QsVUFBTSxHQUFOO0FBQ0EscUJBQWlCLEdBQWpCO0FBQ0EsV0FBTyxnQkFBUDtBQUNEOztBQUVELE1BQUksT0FBTyxJQUFJLE1BQWYsRUFBdUI7QUFDckIsVUFBTSxJQUFJLE1BQUosRUFBTjtBQUNEOztBQUVELE0sMEJBQUksUSx1QkFBTyxHQUFQLHlDQUFPLEdBQVAsT0FBZSxRQUFmLElBQTJCLFFBQVEsSUFBdkMsRUFBNkM7QUFDM0MsVUFBTSxJQUFOLENBQVcsR0FBWDtBQUNBLHVCQUFtQixFQUFuQjtBQUNBLHFCQUFpQixJQUFqQixDQUFzQixnQkFBdEI7QUFDQSxRQUFJLGFBQWEsRUFBakI7QUFBQSxRQUNJLE0seUJBQUEsTSx3QkFESjtBQUVBLFNBQUssR0FBTCxJQUFZLEdBQVosRUFBaUI7O0FBRWYsVUFBSSxJQUFJLGNBQUosQ0FBbUIsR0FBbkIsQ0FBSixFQUE2QjtBQUMzQixtQkFBVyxJQUFYLENBQWdCLEdBQWhCO0FBQ0Q7QUFDRjtBQUNELGVBQVcsSUFBWDtBQUNBLFNBQUssSUFBSSxDQUFULEVBQVksSUFBSSxXQUFXLE1BQTNCLEVBQW1DLEtBQUssQ0FBeEMsRUFBMkM7QUFDekMsWUFBTSxXQUFXLENBQVgsQ0FBTjtBQUNBLHVCQUFpQixHQUFqQixJQUF3QixhQUFhLElBQUksR0FBSixDQUFiLEVBQXVCLEtBQXZCLEVBQThCLGdCQUE5QixDQUF4QjtBQUNEO0FBQ0QsVUFBTSxHQUFOO0FBQ0EscUJBQWlCLEdBQWpCO0FBQ0QsR0FuQkQsTUFtQk87QUFDTCx1QkFBbUIsR0FBbkI7QUFDRDtBQUNELFNBQU8sZ0JBQVA7QUFDRDs7Ozs7Ozs7Z0NDdERlLFMsR0FBQSxTO3lEQUNBLGdCLEdBQUEsZ0I7O0FBL0JoQixJLHlCQUFBLHlCLHdCQUFBOzs7Ozs7QUFDQSxJLHlCQUFBLG1DLHdCQUFBOzs7Ozt1QkFFTyxJQUFNLFcseUJBQUEsUSx3QkFBQSxXQUFXLEkseUJBQUEsbUIsd0JBQWpCO0FBQ1AsU0FBUyxRQUFULEdBQW9CLFVBQVMsS0FBVCxFQUFnQjtBQUNsQyxNQUFJLFdBQVcsRUFBZjtBQUFBLE1BQ0ksbUJBQW1CLE1BQU0sS0FBTixDQUFZLFdBQVosQ0FEdkI7OztBQUlBLE1BQUksQ0FBQyxpQkFBaUIsaUJBQWlCLE1BQWpCLEdBQTBCLENBQTNDLENBQUwsRUFBb0Q7QUFDbEQscUJBQWlCLEdBQWpCO0FBQ0Q7OztBQUdELE9BQUssSUFBSSxJQUFJLENBQWIsRUFBZ0IsSUFBSSxpQkFBaUIsTUFBckMsRUFBNkMsR0FBN0MsRUFBa0Q7QUFDaEQsUUFBSSxPQUFPLGlCQUFpQixDQUFqQixDQUFYOztBQUVBLFFBQUksSUFBSSxDQUFKLElBQVMsQ0FBQyxLQUFLLE9BQUwsQ0FBYSxjQUEzQixFQUEyQztBQUN6QyxlQUFTLFNBQVMsTUFBVCxHQUFrQixDQUEzQixLQUFpQyxJQUFqQztBQUNELEtBRkQsTUFFTztBQUNMLFVBQUksS0FBSyxPQUFMLENBQWEsZ0JBQWpCLEVBQW1DO0FBQ2pDLGVBQU8sS0FBSyxJQUFMLEVBQVA7QUFDRDtBQUNELGVBQVMsSUFBVCxDQUFjLElBQWQ7QUFDRDtBQUNGOztBQUVELFNBQU8sUUFBUDtBQUNELENBeEJEOztBQTBCTyxTQUFTLFNBQVQsQ0FBbUIsTUFBbkIsRUFBMkIsTUFBM0IsRUFBbUMsUUFBbkMsRUFBNkM7QUFBRSxTQUFPLFNBQVMsSUFBVCxDQUFjLE1BQWQsRUFBc0IsTUFBdEIsRUFBOEIsUUFBOUIsQ0FBUDtBQUFpRDtBQUNoRyxTQUFTLGdCQUFULENBQTBCLE1BQTFCLEVBQWtDLE1BQWxDLEVBQTBDLFFBQTFDLEVBQW9EO0FBQ3pELE1BQUksVSx5QkFBVSw0Qix3QkFBQSxDQUFnQixRQUFoQixFQUEwQixFQUFDLGtCQUFrQixJQUFuQixFQUExQixDQUFkO0FBQ0EsU0FBTyxTQUFTLElBQVQsQ0FBYyxNQUFkLEVBQXNCLE1BQXRCLEVBQThCLE9BQTlCLENBQVA7QUFDRDs7Ozs7Ozs7Z0NDMUJlLGEsR0FBQSxhOztBQVJoQixJLHlCQUFBLHlCLHdCQUFBOzs7Ozs7O3VCQUdPLElBQU0sZSx5QkFBQSxRLHdCQUFBLGVBQWUsSSx5QkFBQSxtQix3QkFBckI7QUFDUCxhQUFhLFFBQWIsR0FBd0IsVUFBUyxLQUFULEVBQWdCO0FBQ3RDLFNBQU8sTUFBTSxLQUFOLENBQVksdUJBQVosQ0FBUDtBQUNELENBRkQ7O0FBSU8sU0FBUyxhQUFULENBQXVCLE1BQXZCLEVBQStCLE1BQS9CLEVBQXVDLFFBQXZDLEVBQWlEO0FBQUUsU0FBTyxhQUFhLElBQWIsQ0FBa0IsTUFBbEIsRUFBMEIsTUFBMUIsRUFBa0MsUUFBbEMsQ0FBUDtBQUFxRDs7Ozs7Ozs7Z0NDdUMvRixTLEdBQUEsUzt5REFJQSxrQixHQUFBLGtCOztBQW5EaEIsSSx5QkFBQSx5Qix3QkFBQTs7Ozs7O0FBQ0EsSSx5QkFBQSxtQyx3QkFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQW9CQSxJQUFNLG9CQUFvQiwrREFBMUI7O0FBRUEsSUFBTSxlQUFlLElBQXJCOztBQUVPLElBQU0sVyx5QkFBQSxRLHdCQUFBLFdBQVcsSSx5QkFBQSxtQix3QkFBakI7QUFDUCxTQUFTLE1BQVQsR0FBa0IsVUFBUyxJQUFULEVBQWUsS0FBZixFQUFzQjtBQUN0QyxTQUFPLFNBQVMsS0FBVCxJQUFtQixLQUFLLE9BQUwsQ0FBYSxnQkFBYixJQUFpQyxDQUFDLGFBQWEsSUFBYixDQUFrQixJQUFsQixDQUFsQyxJQUE2RCxDQUFDLGFBQWEsSUFBYixDQUFrQixLQUFsQixDQUF4RjtBQUNELENBRkQ7QUFHQSxTQUFTLFFBQVQsR0FBb0IsVUFBUyxLQUFULEVBQWdCO0FBQ2xDLE1BQUksU0FBUyxNQUFNLEtBQU4sQ0FBWSxVQUFaLENBQWI7OztBQUdBLE9BQUssSUFBSSxJQUFJLENBQWIsRUFBZ0IsSUFBSSxPQUFPLE1BQVAsR0FBZ0IsQ0FBcEMsRUFBdUMsR0FBdkMsRUFBNEM7O0FBRTFDLFFBQUksQ0FBQyxPQUFPLElBQUksQ0FBWCxDQUFELElBQWtCLE9BQU8sSUFBSSxDQUFYLENBQWxCLElBQ0ssa0JBQWtCLElBQWxCLENBQXVCLE9BQU8sQ0FBUCxDQUF2QixDQURMLElBRUssa0JBQWtCLElBQWxCLENBQXVCLE9BQU8sSUFBSSxDQUFYLENBQXZCLENBRlQsRUFFZ0Q7QUFDOUMsYUFBTyxDQUFQLEtBQWEsT0FBTyxJQUFJLENBQVgsQ0FBYjtBQUNBLGFBQU8sTUFBUCxDQUFjLElBQUksQ0FBbEIsRUFBcUIsQ0FBckI7QUFDQTtBQUNEO0FBQ0Y7O0FBRUQsU0FBTyxNQUFQO0FBQ0QsQ0FoQkQ7O0FBa0JPLFNBQVMsU0FBVCxDQUFtQixNQUFuQixFQUEyQixNQUEzQixFQUFtQyxRQUFuQyxFQUE2QztBQUNsRCxNQUFJLFUseUJBQVUsNEIsd0JBQUEsQ0FBZ0IsUUFBaEIsRUFBMEIsRUFBQyxrQkFBa0IsSUFBbkIsRUFBMUIsQ0FBZDtBQUNBLFNBQU8sU0FBUyxJQUFULENBQWMsTUFBZCxFQUFzQixNQUF0QixFQUE4QixPQUE5QixDQUFQO0FBQ0Q7QUFDTSxTQUFTLGtCQUFULENBQTRCLE1BQTVCLEVBQW9DLE1BQXBDLEVBQTRDLFFBQTVDLEVBQXNEO0FBQzNELFNBQU8sU0FBUyxJQUFULENBQWMsTUFBZCxFQUFzQixNQUF0QixFQUE4QixRQUE5QixDQUFQO0FBQ0Q7Ozs7Ozs7OztBQ3JDRCxJLHlCQUFBLDhCLHdCQUFBOzs7Ozs7QUFDQSxJLHlCQUFBLHdDLHdCQUFBOztBQUNBLEkseUJBQUEsOEIsd0JBQUE7O0FBQ0EsSSx5QkFBQSw4Qix3QkFBQTs7QUFDQSxJLHlCQUFBLHNDLHdCQUFBOztBQUVBLEkseUJBQUEsNEIsd0JBQUE7O0FBQ0EsSSx5QkFBQSw4Qix3QkFBQTs7QUFFQSxJLHlCQUFBLGdDLHdCQUFBOztBQUVBLEkseUJBQUEsaUMsd0JBQUE7O0FBQ0EsSSx5QkFBQSxpQyx3QkFBQTs7QUFDQSxJLHlCQUFBLG1DLHdCQUFBOztBQUVBLEkseUJBQUEsK0Isd0JBQUE7O0FBQ0EsSSx5QkFBQSwrQix3QkFBQTs7Ozs7Z0NBR0UsSTt5REFFQSxTO3lEQUNBLFM7eURBQ0Esa0I7eURBQ0EsUzt5REFDQSxnQjt5REFDQSxhO3lEQUVBLE87eURBQ0EsUTt5REFFQSxVO3lEQUVBLGU7eURBQ0EsbUI7eURBQ0EsVzt5REFDQSxVO3lEQUNBLFk7eURBQ0EsVTt5REFDQSxtQjt5REFDQSxtQjt5REFDQSxZOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O2dDQ3REYyxVLEdBQUEsVTt5REErSEEsWSxHQUFBLFk7O0FBbEloQixJLHlCQUFBLDJCLHdCQUFBOztBQUNBLEkseUJBQUEsd0Qsd0JBQUE7Ozs7Ozs7dUJBRU8sU0FBUyxVQUFULENBQW9CLE1BQXBCLEVBQTRCLE9BQTVCLEVBQW1EOzJCQUFBLEksdUJBQWQsT0FBYyx5REFBSixFQUFJOztBQUN4RCxNQUFJLE9BQU8sT0FBUCxLQUFtQixRQUF2QixFQUFpQztBQUMvQixjLHlCQUFVLHNCLHdCQUFBLENBQVcsT0FBWCxDQUFWO0FBQ0Q7O0FBRUQsTUFBSSxNQUFNLE9BQU4sQ0FBYyxPQUFkLENBQUosRUFBNEI7QUFDMUIsUUFBSSxRQUFRLE1BQVIsR0FBaUIsQ0FBckIsRUFBd0I7QUFDdEIsWUFBTSxJQUFJLEtBQUosQ0FBVSw0Q0FBVixDQUFOO0FBQ0Q7O0FBRUQsY0FBVSxRQUFRLENBQVIsQ0FBVjtBQUNEOzs7QUFHRCxNQUFJLFFBQVEsT0FBTyxLQUFQLENBQWEscUJBQWIsQ0FBWjtBQUFBLE1BQ0ksYUFBYSxPQUFPLEtBQVAsQ0FBYSxzQkFBYixLQUF3QyxFQUR6RDtBQUFBLE1BRUksUUFBUSxRQUFRLEtBRnBCO0FBQUEsTUFJSSxjQUFjLFFBQVEsV0FBUixJQUF3QixVQUFDLFVBQUQsRUFBYSxJQUFiLEVBQW1CLFNBQW5CLEVBQThCLFlBQTlCLEUseUJBQUE7QUFBQSxXLHdCQUErQyxTQUFTO0FBQXhEO0FBQUEsR0FKMUM7QUFBQSxNQUtJLGFBQWEsQ0FMakI7QUFBQSxNQU1JLGFBQWEsUUFBUSxVQUFSLElBQXNCLENBTnZDO0FBQUEsTUFPSSxVQUFVLENBUGQ7QUFBQSxNQVFJLFNBQVMsQ0FSYjtBQUFBLE1BVUksYyx5QkFBQSxNLHdCQVZKO0FBQUEsTUFXSSxXLHlCQUFBLE0sd0JBWEo7Ozs7O0FBZ0JBLFdBQVMsUUFBVCxDQUFrQixJQUFsQixFQUF3QixLQUF4QixFQUErQjtBQUM3QixTQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLElBQUksS0FBSyxLQUFMLENBQVcsTUFBL0IsRUFBdUMsR0FBdkMsRUFBNEM7QUFDMUMsVUFBSSxPQUFPLEtBQUssS0FBTCxDQUFXLENBQVgsQ0FBWDtBQUFBLFVBQ0ksWUFBWSxLQUFLLENBQUwsQ0FEaEI7QUFBQSxVQUVJLFVBQVUsS0FBSyxNQUFMLENBQVksQ0FBWixDQUZkOztBQUlBLFVBQUksY0FBYyxHQUFkLElBQXFCLGNBQWMsR0FBdkMsRUFBNEM7O0FBRTFDLFlBQUksQ0FBQyxZQUFZLFFBQVEsQ0FBcEIsRUFBdUIsTUFBTSxLQUFOLENBQXZCLEVBQXFDLFNBQXJDLEVBQWdELE9BQWhELENBQUwsRUFBK0Q7QUFDN0Q7O0FBRUEsY0FBSSxhQUFhLFVBQWpCLEVBQTZCO0FBQzNCLG1CQUFPLEtBQVA7QUFDRDtBQUNGO0FBQ0Q7QUFDRDtBQUNGOztBQUVELFdBQU8sSUFBUDtBQUNEOzs7QUFHRCxPQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLElBQUksTUFBTSxNQUExQixFQUFrQyxHQUFsQyxFQUF1QztBQUNyQyxRQUFJLE9BQU8sTUFBTSxDQUFOLENBQVg7QUFBQSxRQUNJLFVBQVUsTUFBTSxNQUFOLEdBQWUsS0FBSyxRQURsQztBQUFBLFFBRUksY0FBYyxDQUZsQjtBQUFBLFFBR0ksUUFBUSxTQUFTLEtBQUssUUFBZCxHQUF5QixDQUhyQzs7QUFLQSxRQUFJLFcseUJBQVcsa0Msd0JBQUEsQ0FBaUIsS0FBakIsRUFBd0IsT0FBeEIsRUFBaUMsT0FBakMsQ0FBZjs7QUFFQSxXQUFPLGdCQUFnQixTQUF2QixFQUFrQyxjQUFjLFVBQWhELEVBQTREO0FBQzFELFVBQUksU0FBUyxJQUFULEVBQWUsUUFBUSxXQUF2QixDQUFKLEVBQXlDO0FBQ3ZDLGFBQUssTUFBTCxHQUFjLFVBQVUsV0FBeEI7QUFDQTtBQUNEO0FBQ0Y7O0FBRUQsUUFBSSxnQkFBZ0IsU0FBcEIsRUFBK0I7QUFDN0IsYUFBTyxLQUFQO0FBQ0Q7Ozs7QUFJRCxjQUFVLEtBQUssTUFBTCxHQUFjLEtBQUssUUFBbkIsR0FBOEIsS0FBSyxRQUE3QztBQUNEOzs7QUFHRCxPQUFLLElBQUksS0FBSSxDQUFiLEVBQWdCLEtBQUksTUFBTSxNQUExQixFQUFrQyxJQUFsQyxFQUF1QztBQUNyQyxRQUFJLFFBQU8sTUFBTSxFQUFOLENBQVg7QUFBQSxRQUNJLFNBQVEsTUFBSyxNQUFMLEdBQWMsTUFBSyxRQUFuQixHQUE4QixDQUQxQztBQUVBLFFBQUksTUFBSyxRQUFMLElBQWlCLENBQXJCLEVBQXdCO0FBQUU7QUFBVTs7QUFFcEMsU0FBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLE1BQUssS0FBTCxDQUFXLE1BQS9CLEVBQXVDLEdBQXZDLEVBQTRDO0FBQzFDLFVBQUksT0FBTyxNQUFLLEtBQUwsQ0FBVyxDQUFYLENBQVg7QUFBQSxVQUNJLFlBQVksS0FBSyxDQUFMLENBRGhCO0FBQUEsVUFFSSxVQUFVLEtBQUssTUFBTCxDQUFZLENBQVosQ0FGZDtBQUFBLFVBR0ksWUFBWSxNQUFLLGNBQUwsQ0FBb0IsQ0FBcEIsQ0FIaEI7O0FBS0EsVUFBSSxjQUFjLEdBQWxCLEVBQXVCO0FBQ3JCO0FBQ0QsT0FGRCxNQUVPLElBQUksY0FBYyxHQUFsQixFQUF1QjtBQUM1QixjQUFNLE1BQU4sQ0FBYSxNQUFiLEVBQW9CLENBQXBCO0FBQ0EsbUJBQVcsTUFBWCxDQUFrQixNQUFsQixFQUF5QixDQUF6Qjs7QUFFRCxPQUpNLE1BSUEsSUFBSSxjQUFjLEdBQWxCLEVBQXVCO0FBQzVCLGdCQUFNLE1BQU4sQ0FBYSxNQUFiLEVBQW9CLENBQXBCLEVBQXVCLE9BQXZCO0FBQ0EscUJBQVcsTUFBWCxDQUFrQixNQUFsQixFQUF5QixDQUF6QixFQUE0QixTQUE1QjtBQUNBO0FBQ0QsU0FKTSxNQUlBLElBQUksY0FBYyxJQUFsQixFQUF3QjtBQUM3QixjQUFJLG9CQUFvQixNQUFLLEtBQUwsQ0FBVyxJQUFJLENBQWYsSUFBb0IsTUFBSyxLQUFMLENBQVcsSUFBSSxDQUFmLEVBQWtCLENBQWxCLENBQXBCLEdBQTJDLElBQW5FO0FBQ0EsY0FBSSxzQkFBc0IsR0FBMUIsRUFBK0I7QUFDN0IsMEJBQWMsSUFBZDtBQUNELFdBRkQsTUFFTyxJQUFJLHNCQUFzQixHQUExQixFQUErQjtBQUNwQyx1QkFBVyxJQUFYO0FBQ0Q7QUFDRjtBQUNGO0FBQ0Y7OztBQUdELE1BQUksV0FBSixFQUFpQjtBQUNmLFdBQU8sQ0FBQyxNQUFNLE1BQU0sTUFBTixHQUFlLENBQXJCLENBQVIsRUFBaUM7QUFDL0IsWUFBTSxHQUFOO0FBQ0EsaUJBQVcsR0FBWDtBQUNEO0FBQ0YsR0FMRCxNQUtPLElBQUksUUFBSixFQUFjO0FBQ25CLFVBQU0sSUFBTixDQUFXLEVBQVg7QUFDQSxlQUFXLElBQVgsQ0FBZ0IsSUFBaEI7QUFDRDtBQUNELE9BQUssSUFBSSxLQUFLLENBQWQsRUFBaUIsS0FBSyxNQUFNLE1BQU4sR0FBZSxDQUFyQyxFQUF3QyxJQUF4QyxFQUE4QztBQUM1QyxVQUFNLEVBQU4sSUFBWSxNQUFNLEVBQU4sSUFBWSxXQUFXLEVBQVgsQ0FBeEI7QUFDRDtBQUNELFNBQU8sTUFBTSxJQUFOLENBQVcsRUFBWCxDQUFQO0FBQ0Q7OztBQUdNLFNBQVMsWUFBVCxDQUFzQixPQUF0QixFQUErQixPQUEvQixFQUF3QztBQUM3QyxNQUFJLE9BQU8sT0FBUCxLQUFtQixRQUF2QixFQUFpQztBQUMvQixjLHlCQUFVLHNCLHdCQUFBLENBQVcsT0FBWCxDQUFWO0FBQ0Q7O0FBRUQsTUFBSSxlQUFlLENBQW5CO0FBQ0EsV0FBUyxZQUFULEdBQXdCO0FBQ3RCLFFBQUksUUFBUSxRQUFRLGNBQVIsQ0FBWjtBQUNBLFFBQUksQ0FBQyxLQUFMLEVBQVk7QUFDVixhQUFPLFFBQVEsUUFBUixFQUFQO0FBQ0Q7O0FBRUQsWUFBUSxRQUFSLENBQWlCLEtBQWpCLEVBQXdCLFVBQVMsR0FBVCxFQUFjLElBQWQsRUFBb0I7QUFDMUMsVUFBSSxHQUFKLEVBQVM7QUFDUCxlQUFPLFFBQVEsUUFBUixDQUFpQixHQUFqQixDQUFQO0FBQ0Q7O0FBRUQsVUFBSSxpQkFBaUIsV0FBVyxJQUFYLEVBQWlCLEtBQWpCLEVBQXdCLE9BQXhCLENBQXJCO0FBQ0EsY0FBUSxPQUFSLENBQWdCLEtBQWhCLEVBQXVCLGNBQXZCLEVBQXVDLFVBQVMsR0FBVCxFQUFjO0FBQ25ELFlBQUksR0FBSixFQUFTO0FBQ1AsaUJBQU8sUUFBUSxRQUFSLENBQWlCLEdBQWpCLENBQVA7QUFDRDs7QUFFRDtBQUNELE9BTkQ7QUFPRCxLQWJEO0FBY0Q7QUFDRDtBQUNEOzs7Ozs7O2dDQzVKZSxlLEdBQUEsZTt5REFpR0EsbUIsR0FBQSxtQjt5REF3QkEsVyxHQUFBLFc7O0FBM0hoQixJLHlCQUFBLCtCLHdCQUFBOzs7Ozt1QkFFTyxTQUFTLGVBQVQsQ0FBeUIsV0FBekIsRUFBc0MsV0FBdEMsRUFBbUQsTUFBbkQsRUFBMkQsTUFBM0QsRUFBbUUsU0FBbkUsRUFBOEUsU0FBOUUsRUFBeUYsT0FBekYsRUFBa0c7QUFDdkcsTUFBSSxDQUFDLE9BQUwsRUFBYztBQUNaLGNBQVUsRUFBVjtBQUNEO0FBQ0QsTUFBSSxPQUFPLFFBQVEsT0FBZixLQUEyQixXQUEvQixFQUE0QztBQUMxQyxZQUFRLE9BQVIsR0FBa0IsQ0FBbEI7QUFDRDs7QUFFRCxNQUFNLE8seUJBQU8sb0Isd0JBQUEsQ0FBVSxNQUFWLEVBQWtCLE1BQWxCLEVBQTBCLE9BQTFCLENBQWI7QUFDQSxPQUFLLElBQUwsQ0FBVSxFQUFDLE9BQU8sRUFBUixFQUFZLE9BQU8sRUFBbkIsRUFBVixFOztBQUVBLFdBQVMsWUFBVCxDQUFzQixLQUF0QixFQUE2QjtBQUMzQixXQUFPLE1BQU0sR0FBTixDQUFVLFVBQVMsS0FBVCxFQUFnQjtBQUFFLGFBQU8sTUFBTSxLQUFiO0FBQXFCLEtBQWpELENBQVA7QUFDRDs7QUFFRCxNQUFJLFFBQVEsRUFBWjtBQUNBLE1BQUksZ0JBQWdCLENBQXBCO0FBQUEsTUFBdUIsZ0JBQWdCLENBQXZDO0FBQUEsTUFBMEMsV0FBVyxFQUFyRDtBQUFBLE1BQ0ksVUFBVSxDQURkO0FBQUEsTUFDaUIsVUFBVSxDQUQzQjs7QUFoQnVHLDZCLHdCQWtCOUYsQ0FsQjhGO0FBbUJyRyxRQUFNLFVBQVUsS0FBSyxDQUFMLENBQWhCO0FBQUEsUUFDTSxRQUFRLFFBQVEsS0FBUixJQUFpQixRQUFRLEtBQVIsQ0FBYyxPQUFkLENBQXNCLEtBQXRCLEVBQTZCLEVBQTdCLEVBQWlDLEtBQWpDLENBQXVDLElBQXZDLENBRC9CO0FBRUEsWUFBUSxLQUFSLEdBQWdCLEtBQWhCOztBQUVBLFFBQUksUUFBUSxLQUFSLElBQWlCLFFBQVEsT0FBN0IsRUFBc0M7O0FBQUE7Ozs7QUFFcEMsVUFBSSxDQUFDLGFBQUwsRUFBb0I7QUFDbEIsWUFBTSxPQUFPLEtBQUssSUFBSSxDQUFULENBQWI7QUFDQSx3QkFBZ0IsT0FBaEI7QUFDQSx3QkFBZ0IsT0FBaEI7O0FBRUEsWUFBSSxJQUFKLEVBQVU7QUFDUixxQkFBVyxRQUFRLE9BQVIsR0FBa0IsQ0FBbEIsR0FBc0IsYUFBYSxLQUFLLEtBQUwsQ0FBVyxLQUFYLENBQWlCLENBQUMsUUFBUSxPQUExQixDQUFiLENBQXRCLEdBQXlFLEVBQXBGO0FBQ0EsMkJBQWlCLFNBQVMsTUFBMUI7QUFDQSwyQkFBaUIsU0FBUyxNQUExQjtBQUNEO0FBQ0Y7OzsrQkFHRCxhLHVCQUFBLFVBQVMsSUFBVCxDLDBCQUFBLEssd0JBQUEsQywwQkFBQSxTLHdCQUFBLEUseUJBQUEsbUIsd0JBQWtCLE1BQU0sR0FBTixDQUFVLFVBQVMsS0FBVCxFQUFnQjtBQUMxQyxlQUFPLENBQUMsUUFBUSxLQUFSLEdBQWdCLEdBQWhCLEdBQXNCLEdBQXZCLElBQThCLEtBQXJDO0FBQ0QsT0FGaUIsQ0FBbEI7OztBQUtBLFVBQUksUUFBUSxLQUFaLEVBQW1CO0FBQ2pCLG1CQUFXLE1BQU0sTUFBakI7QUFDRCxPQUZELE1BRU87QUFDTCxtQkFBVyxNQUFNLE1BQWpCO0FBQ0Q7QUFDRixLQXpCRCxNQXlCTzs7QUFFTCxVQUFJLGFBQUosRUFBbUI7O0FBRWpCLFlBQUksTUFBTSxNQUFOLElBQWdCLFFBQVEsT0FBUixHQUFrQixDQUFsQyxJQUF1QyxJQUFJLEtBQUssTUFBTCxHQUFjLENBQTdELEVBQWdFOztBQUFBOzs7O21DQUU5RCxjLHVCQUFBLFVBQVMsSUFBVCxDLDBCQUFBLEssd0JBQUEsQywwQkFBQSxVLHdCQUFBLEUseUJBQUEsbUIsd0JBQWtCLGFBQWEsS0FBYixDQUFsQjtBQUNELFNBSEQsTUFHTzs7QUFBQTs7OztBQUVMLGNBQUksY0FBYyxLQUFLLEdBQUwsQ0FBUyxNQUFNLE1BQWYsRUFBdUIsUUFBUSxPQUEvQixDQUFsQjttQ0FDQSxjLHVCQUFBLFVBQVMsSUFBVCxDLDBCQUFBLEssd0JBQUEsQywwQkFBQSxVLHdCQUFBLEUseUJBQUEsbUIsd0JBQWtCLGFBQWEsTUFBTSxLQUFOLENBQVksQ0FBWixFQUFlLFdBQWYsQ0FBYixDQUFsQjs7QUFFQSxjQUFJLE9BQU87QUFDVCxzQkFBVSxhQUREO0FBRVQsc0JBQVcsVUFBVSxhQUFWLEdBQTBCLFdBRjVCO0FBR1Qsc0JBQVUsYUFIRDtBQUlULHNCQUFXLFVBQVUsYUFBVixHQUEwQixXQUo1QjtBQUtULG1CQUFPO0FBTEUsV0FBWDtBQU9BLGNBQUksS0FBSyxLQUFLLE1BQUwsR0FBYyxDQUFuQixJQUF3QixNQUFNLE1BQU4sSUFBZ0IsUUFBUSxPQUFwRCxFQUE2RDs7QUFFM0QsZ0JBQUksZ0JBQWlCLE1BQU0sSUFBTixDQUFXLE1BQVgsQ0FBckI7QUFDQSxnQkFBSSxnQkFBaUIsTUFBTSxJQUFOLENBQVcsTUFBWCxDQUFyQjtBQUNBLGdCQUFJLE1BQU0sTUFBTixJQUFnQixDQUFoQixJQUFxQixDQUFDLGFBQTFCLEVBQXlDOztBQUV2Qyx1QkFBUyxNQUFULENBQWdCLEtBQUssUUFBckIsRUFBK0IsQ0FBL0IsRUFBa0MsOEJBQWxDO0FBQ0QsYUFIRCxNQUdPLElBQUksQ0FBQyxhQUFELElBQWtCLENBQUMsYUFBdkIsRUFBc0M7QUFDM0MsdUJBQVMsSUFBVCxDQUFjLDhCQUFkO0FBQ0Q7QUFDRjtBQUNELGdCQUFNLElBQU4sQ0FBVyxJQUFYOztBQUVBLDBCQUFnQixDQUFoQjtBQUNBLDBCQUFnQixDQUFoQjtBQUNBLHFCQUFXLEVBQVg7QUFDRDtBQUNGO0FBQ0QsaUJBQVcsTUFBTSxNQUFqQjtBQUNBLGlCQUFXLE1BQU0sTUFBakI7QUFDRDtBQXZGb0c7O0FBa0J2RyxPQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLElBQUksS0FBSyxNQUF6QixFQUFpQyxHQUFqQyxFQUFzQzs7QUFBQSxVLHdCQUE3QixDQUE2QjtBQXNFckM7O0FBRUQsU0FBTztBQUNMLGlCQUFhLFdBRFIsRUFDcUIsYUFBYSxXQURsQztBQUVMLGVBQVcsU0FGTixFQUVpQixXQUFXLFNBRjVCO0FBR0wsV0FBTztBQUhGLEdBQVA7QUFLRDs7QUFFTSxTQUFTLG1CQUFULENBQTZCLFdBQTdCLEVBQTBDLFdBQTFDLEVBQXVELE1BQXZELEVBQStELE1BQS9ELEVBQXVFLFNBQXZFLEVBQWtGLFNBQWxGLEVBQTZGLE9BQTdGLEVBQXNHO0FBQzNHLE1BQU0sT0FBTyxnQkFBZ0IsV0FBaEIsRUFBNkIsV0FBN0IsRUFBMEMsTUFBMUMsRUFBa0QsTUFBbEQsRUFBMEQsU0FBMUQsRUFBcUUsU0FBckUsRUFBZ0YsT0FBaEYsQ0FBYjs7QUFFQSxNQUFNLE1BQU0sRUFBWjtBQUNBLE1BQUksZUFBZSxXQUFuQixFQUFnQztBQUM5QixRQUFJLElBQUosQ0FBUyxZQUFZLFdBQXJCO0FBQ0Q7QUFDRCxNQUFJLElBQUosQ0FBUyxxRUFBVDtBQUNBLE1BQUksSUFBSixDQUFTLFNBQVMsS0FBSyxXQUFkLElBQTZCLE9BQU8sS0FBSyxTQUFaLEtBQTBCLFdBQTFCLEdBQXdDLEVBQXhDLEdBQTZDLE9BQU8sS0FBSyxTQUF0RixDQUFUO0FBQ0EsTUFBSSxJQUFKLENBQVMsU0FBUyxLQUFLLFdBQWQsSUFBNkIsT0FBTyxLQUFLLFNBQVosS0FBMEIsV0FBMUIsR0FBd0MsRUFBeEMsR0FBNkMsT0FBTyxLQUFLLFNBQXRGLENBQVQ7O0FBRUEsT0FBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLEtBQUssS0FBTCxDQUFXLE1BQS9CLEVBQXVDLEdBQXZDLEVBQTRDO0FBQzFDLFFBQU0sT0FBTyxLQUFLLEtBQUwsQ0FBVyxDQUFYLENBQWI7QUFDQSxRQUFJLElBQUosQ0FDRSxTQUFTLEtBQUssUUFBZCxHQUF5QixHQUF6QixHQUErQixLQUFLLFFBQXBDLEdBQ0UsSUFERixHQUNTLEtBQUssUUFEZCxHQUN5QixHQUR6QixHQUMrQixLQUFLLFFBRHBDLEdBRUUsS0FISjtBQUtBLFFBQUksSUFBSixDQUFTLEtBQVQsQ0FBZSxHQUFmLEVBQW9CLEtBQUssS0FBekI7QUFDRDs7QUFFRCxTQUFPLElBQUksSUFBSixDQUFTLElBQVQsSUFBaUIsSUFBeEI7QUFDRDs7QUFFTSxTQUFTLFdBQVQsQ0FBcUIsUUFBckIsRUFBK0IsTUFBL0IsRUFBdUMsTUFBdkMsRUFBK0MsU0FBL0MsRUFBMEQsU0FBMUQsRUFBcUUsT0FBckUsRUFBOEU7QUFDbkYsU0FBTyxvQkFBb0IsUUFBcEIsRUFBOEIsUUFBOUIsRUFBd0MsTUFBeEMsRUFBZ0QsTUFBaEQsRUFBd0QsU0FBeEQsRUFBbUUsU0FBbkUsRUFBOEUsT0FBOUUsQ0FBUDtBQUNEOzs7Ozs7O2dDQzdIZSxVLEdBQUEsVTtBQUFULFNBQVMsVUFBVCxDQUFvQixPQUFwQixFQUEyQzsyQkFBQSxJLHVCQUFkLE9BQWMseURBQUosRUFBSTs7QUFDaEQsTUFBSSxVQUFVLFFBQVEsS0FBUixDQUFjLHFCQUFkLENBQWQ7QUFBQSxNQUNJLGFBQWEsUUFBUSxLQUFSLENBQWMsc0JBQWQsS0FBeUMsRUFEMUQ7QUFBQSxNQUVJLE9BQU8sRUFGWDtBQUFBLE1BR0ksSUFBSSxDQUhSOztBQUtBLFdBQVMsVUFBVCxHQUFzQjtBQUNwQixRQUFJLFFBQVEsRUFBWjtBQUNBLFNBQUssSUFBTCxDQUFVLEtBQVY7OztBQUdBLFdBQU8sSUFBSSxRQUFRLE1BQW5CLEVBQTJCO0FBQ3pCLFVBQUksT0FBTyxRQUFRLENBQVIsQ0FBWDs7O0FBR0EsVUFBSSx3QkFBd0IsSUFBeEIsQ0FBNkIsSUFBN0IsQ0FBSixFQUF3QztBQUN0QztBQUNEOzs7QUFHRCxVQUFJLFNBQVUsMENBQUQsQ0FBNkMsSUFBN0MsQ0FBa0QsSUFBbEQsQ0FBYjtBQUNBLFVBQUksTUFBSixFQUFZO0FBQ1YsY0FBTSxLQUFOLEdBQWMsT0FBTyxDQUFQLENBQWQ7QUFDRDs7QUFFRDtBQUNEOzs7O0FBSUQsb0JBQWdCLEtBQWhCO0FBQ0Esb0JBQWdCLEtBQWhCOzs7QUFHQSxVQUFNLEtBQU4sR0FBYyxFQUFkOztBQUVBLFdBQU8sSUFBSSxRQUFRLE1BQW5CLEVBQTJCO0FBQ3pCLFVBQUksUUFBTyxRQUFRLENBQVIsQ0FBWDs7QUFFQSxVQUFJLGlDQUFpQyxJQUFqQyxDQUFzQyxLQUF0QyxDQUFKLEVBQWlEO0FBQy9DO0FBQ0QsT0FGRCxNQUVPLElBQUksTUFBTSxJQUFOLENBQVcsS0FBWCxDQUFKLEVBQXNCO0FBQzNCLGNBQU0sS0FBTixDQUFZLElBQVosQ0FBaUIsV0FBakI7QUFDRCxPQUZNLE1BRUEsSUFBSSxTQUFRLFFBQVEsTUFBcEIsRUFBNEI7O0FBRWpDLGNBQU0sSUFBSSxLQUFKLENBQVUsbUJBQW1CLElBQUksQ0FBdkIsSUFBNEIsR0FBNUIsR0FBa0MsS0FBSyxTQUFMLENBQWUsS0FBZixDQUE1QyxDQUFOO0FBQ0QsT0FITSxNQUdBO0FBQ0w7QUFDRDtBQUNGO0FBQ0Y7Ozs7QUFJRCxXQUFTLGVBQVQsQ0FBeUIsS0FBekIsRUFBZ0M7QUFDOUIsUUFBTSxnQkFBZ0IsMENBQXRCO0FBQ0EsUUFBTSxhQUFhLGNBQWMsSUFBZCxDQUFtQixRQUFRLENBQVIsQ0FBbkIsQ0FBbkI7QUFDQSxRQUFJLFVBQUosRUFBZ0I7QUFDZCxVQUFJLFlBQVksV0FBVyxDQUFYLE1BQWtCLEtBQWxCLEdBQTBCLEtBQTFCLEdBQWtDLEtBQWxEO0FBQ0EsWUFBTSxZQUFZLFVBQWxCLElBQWdDLFdBQVcsQ0FBWCxDQUFoQztBQUNBLFlBQU0sWUFBWSxRQUFsQixJQUE4QixXQUFXLENBQVgsQ0FBOUI7O0FBRUE7QUFDRDtBQUNGOzs7O0FBSUQsV0FBUyxTQUFULEdBQXFCO0FBQ25CLFFBQUksbUJBQW1CLENBQXZCO0FBQUEsUUFDSSxrQkFBa0IsUUFBUSxHQUFSLENBRHRCO0FBQUEsUUFFSSxjQUFjLGdCQUFnQixLQUFoQixDQUFzQiw0Q0FBdEIsQ0FGbEI7O0FBSUEsUUFBSSxPQUFPO0FBQ1QsZ0JBQVUsQ0FBQyxZQUFZLENBQVosQ0FERjtBQUVULGdCQUFVLENBQUMsWUFBWSxDQUFaLENBQUQsSUFBbUIsQ0FGcEI7QUFHVCxnQkFBVSxDQUFDLFlBQVksQ0FBWixDQUhGO0FBSVQsZ0JBQVUsQ0FBQyxZQUFZLENBQVosQ0FBRCxJQUFtQixDQUpwQjtBQUtULGFBQU8sRUFMRTtBQU1ULHNCQUFnQjtBQU5QLEtBQVg7O0FBU0EsUUFBSSxXQUFXLENBQWY7QUFBQSxRQUNJLGNBQWMsQ0FEbEI7QUFFQSxXQUFPLElBQUksUUFBUSxNQUFuQixFQUEyQixHQUEzQixFQUFnQzs7O0FBRzlCLFVBQUksUUFBUSxDQUFSLEVBQVcsT0FBWCxDQUFtQixNQUFuQixNQUErQixDQUEvQixJQUNNLElBQUksQ0FBSixHQUFRLFFBQVEsTUFEdEIsSUFFSyxRQUFRLElBQUksQ0FBWixFQUFlLE9BQWYsQ0FBdUIsTUFBdkIsTUFBbUMsQ0FGeEMsSUFHSyxRQUFRLElBQUksQ0FBWixFQUFlLE9BQWYsQ0FBdUIsSUFBdkIsTUFBaUMsQ0FIMUMsRUFHNkM7QUFDekM7QUFDSDtBQUNELFVBQUksWUFBWSxRQUFRLENBQVIsRUFBVyxDQUFYLENBQWhCOztBQUVBLFVBQUksY0FBYyxHQUFkLElBQXFCLGNBQWMsR0FBbkMsSUFBMEMsY0FBYyxHQUF4RCxJQUErRCxjQUFjLElBQWpGLEVBQXVGO0FBQ3JGLGFBQUssS0FBTCxDQUFXLElBQVgsQ0FBZ0IsUUFBUSxDQUFSLENBQWhCO0FBQ0EsYUFBSyxjQUFMLENBQW9CLElBQXBCLENBQXlCLFdBQVcsQ0FBWCxLQUFpQixJQUExQzs7QUFFQSxZQUFJLGNBQWMsR0FBbEIsRUFBdUI7QUFDckI7QUFDRCxTQUZELE1BRU8sSUFBSSxjQUFjLEdBQWxCLEVBQXVCO0FBQzVCO0FBQ0QsU0FGTSxNQUVBLElBQUksY0FBYyxHQUFsQixFQUF1QjtBQUM1QjtBQUNBO0FBQ0Q7QUFDRixPQVpELE1BWU87QUFDTDtBQUNEO0FBQ0Y7OztBQUdELFFBQUksQ0FBQyxRQUFELElBQWEsS0FBSyxRQUFMLEtBQWtCLENBQW5DLEVBQXNDO0FBQ3BDLFdBQUssUUFBTCxHQUFnQixDQUFoQjtBQUNEO0FBQ0QsUUFBSSxDQUFDLFdBQUQsSUFBZ0IsS0FBSyxRQUFMLEtBQWtCLENBQXRDLEVBQXlDO0FBQ3ZDLFdBQUssUUFBTCxHQUFnQixDQUFoQjtBQUNEOzs7QUFHRCxRQUFJLFFBQVEsTUFBWixFQUFvQjtBQUNsQixVQUFJLGFBQWEsS0FBSyxRQUF0QixFQUFnQztBQUM5QixjQUFNLElBQUksS0FBSixDQUFVLHNEQUFzRCxtQkFBbUIsQ0FBekUsQ0FBVixDQUFOO0FBQ0Q7QUFDRCxVQUFJLGdCQUFnQixLQUFLLFFBQXpCLEVBQW1DO0FBQ2pDLGNBQU0sSUFBSSxLQUFKLENBQVUsd0RBQXdELG1CQUFtQixDQUEzRSxDQUFWLENBQU47QUFDRDtBQUNGOztBQUVELFdBQU8sSUFBUDtBQUNEOztBQUVELFNBQU8sSUFBSSxRQUFRLE1BQW5CLEVBQTJCO0FBQ3pCO0FBQ0Q7O0FBRUQsU0FBTyxJQUFQO0FBQ0Q7Ozs7Ozs7OzRDQ3ZJYyxVQUFTLEtBQVQsRUFBZ0IsT0FBaEIsRUFBeUIsT0FBekIsRUFBa0M7QUFDL0MsTUFBSSxjQUFjLElBQWxCO0FBQUEsTUFDSSxvQkFBb0IsS0FEeEI7QUFBQSxNQUVJLG1CQUFtQixLQUZ2QjtBQUFBLE1BR0ksY0FBYyxDQUhsQjs7QUFLQSxTQUFPLFNBQVMsUUFBVCxHQUFvQjtBQUN6QixRQUFJLGVBQWUsQ0FBQyxnQkFBcEIsRUFBc0M7QUFDcEMsVUFBSSxpQkFBSixFQUF1QjtBQUNyQjtBQUNELE9BRkQsTUFFTztBQUNMLHNCQUFjLEtBQWQ7QUFDRDs7OztBQUlELFVBQUksUUFBUSxXQUFSLElBQXVCLE9BQTNCLEVBQW9DO0FBQ2xDLGVBQU8sV0FBUDtBQUNEOztBQUVELHlCQUFtQixJQUFuQjtBQUNEOztBQUVELFFBQUksQ0FBQyxpQkFBTCxFQUF3QjtBQUN0QixVQUFJLENBQUMsZ0JBQUwsRUFBdUI7QUFDckIsc0JBQWMsSUFBZDtBQUNEOzs7O0FBSUQsVUFBSSxXQUFXLFFBQVEsV0FBdkIsRUFBb0M7QUFDbEMsZUFBTyxDQUFDLGFBQVI7QUFDRDs7QUFFRCwwQkFBb0IsSUFBcEI7QUFDQSxhQUFPLFVBQVA7QUFDRDs7OztBQUlGLEdBbENEO0FBbUNELEM7Ozs7Ozs7Z0NDNUNlLGUsR0FBQSxlO0FBQVQsU0FBUyxlQUFULENBQXlCLE9BQXpCLEVBQWtDLFFBQWxDLEVBQTRDO0FBQ2pELE1BQUksT0FBTyxPQUFQLEtBQW1CLFVBQXZCLEVBQW1DO0FBQ2pDLGFBQVMsUUFBVCxHQUFvQixPQUFwQjtBQUNELEdBRkQsTUFFTyxJQUFJLE9BQUosRUFBYTtBQUNsQixTQUFLLElBQUksSUFBVCxJQUFpQixPQUFqQixFQUEwQjs7QUFFeEIsVUFBSSxRQUFRLGNBQVIsQ0FBdUIsSUFBdkIsQ0FBSixFQUFrQztBQUNoQyxpQkFBUyxJQUFULElBQWlCLFFBQVEsSUFBUixDQUFqQjtBQUNEO0FBQ0Y7QUFDRjtBQUNELFNBQU8sUUFBUDtBQUNEOzs7O0FDWkQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7OztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDajRCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hhQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcInVzZSBzdHJpY3RcIlxuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCJjbGVhbi1hc3NlcnRcIilcbiIsIlwidXNlIHN0cmljdFwiXG5cbi8qKlxuICogQ29yZSBUREQtc3R5bGUgYXNzZXJ0aW9ucy4gVGhlc2UgYXJlIGRvbmUgYnkgYSBjb21wb3NpdGlvbiBvZiBEU0xzLCBzaW5jZVxuICogdGhlcmUgaXMgKnNvKiBtdWNoIHJlcGV0aXRpb24uXG4gKi9cblxudmFyIG1hdGNoID0gcmVxdWlyZShcImNsZWFuLW1hdGNoXCIpXG52YXIgZGVwcmVjYXRlID0gcmVxdWlyZShcIi4vbWlncmF0ZS9jb21tb25cIikuZGVwcmVjYXRlXG5cbnZhciB0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmdcbnZhciBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5XG5cbi8qIGVzbGludC1kaXNhYmxlIG5vLXNlbGYtY29tcGFyZSAqL1xuLy8gRm9yIGJldHRlciBOYU4gaGFuZGxpbmdcbmZ1bmN0aW9uIHN0cmljdElzKGEsIGIpIHtcbiAgICByZXR1cm4gYSA9PT0gYiB8fCBhICE9PSBhICYmIGIgIT09IGJcbn1cblxuZnVuY3Rpb24gbG9vc2VJcyhhLCBiKSB7XG4gICAgcmV0dXJuIGEgPT0gYiB8fCBhICE9PSBhICYmIGIgIT09IGIgLy8gZXNsaW50LWRpc2FibGUtbGluZSBlcWVxZXFcbn1cblxuLyogZXNsaW50LWVuYWJsZSBuby1zZWxmLWNvbXBhcmUgKi9cblxudmFyIGNoZWNrID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBwcmVmaXgodHlwZSkge1xuICAgICAgICByZXR1cm4gKC9eW2FlaW91XS8udGVzdCh0eXBlKSA/IFwiYW4gXCIgOiBcImEgXCIpICsgdHlwZVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNoZWNrKHZhbHVlLCB0eXBlKSB7XG4gICAgICAgIGlmICh0eXBlID09PSBcImFycmF5XCIpIHJldHVybiBBcnJheS5pc0FycmF5KHZhbHVlKVxuICAgICAgICBpZiAodHlwZSA9PT0gXCJyZWdleHBcIikgcmV0dXJuIHRvU3RyaW5nLmNhbGwodmFsdWUpID09PSBcIltvYmplY3QgUmVnRXhwXVwiXG4gICAgICAgIGlmICh0eXBlID09PSBcIm9iamVjdFwiKSByZXR1cm4gdmFsdWUgIT0gbnVsbCAmJiB0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCJcbiAgICAgICAgaWYgKHR5cGUgPT09IFwibnVsbFwiKSByZXR1cm4gdmFsdWUgPT09IG51bGxcbiAgICAgICAgaWYgKHR5cGUgPT09IFwibm9uZVwiKSByZXR1cm4gdmFsdWUgPT0gbnVsbFxuICAgICAgICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSB0eXBlXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY2hlY2tMaXN0KHZhbHVlLCB0eXBlcykge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHR5cGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoY2hlY2sodmFsdWUsIHR5cGVzW2ldKSkgcmV0dXJuIHRydWVcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNoZWNrU2luZ2xlKHZhbHVlLCBuYW1lLCB0eXBlKSB7XG4gICAgICAgIGlmICghY2hlY2sodmFsdWUsIHR5cGUpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYFwiICsgbmFtZSArIFwiYCBtdXN0IGJlIFwiICsgcHJlZml4KHR5cGUpKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY2hlY2tNYW55KHZhbHVlLCBuYW1lLCB0eXBlcykge1xuICAgICAgICBpZiAoIWNoZWNrTGlzdCh2YWx1ZSwgdHlwZXMpKSB7XG4gICAgICAgICAgICB2YXIgc3RyID0gXCJgXCIgKyBuYW1lICsgXCJgIG11c3QgYmUgZWl0aGVyXCJcblxuICAgICAgICAgICAgaWYgKHR5cGVzLmxlbmd0aCA9PT0gMikge1xuICAgICAgICAgICAgICAgIHN0ciArPSBwcmVmaXgodHlwZXNbMF0pICsgXCIgb3IgXCIgKyBwcmVmaXgodHlwZXNbMV0pXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHN0ciArPSBwcmVmaXgodHlwZXNbMF0pXG5cbiAgICAgICAgICAgICAgICB2YXIgZW5kID0gdHlwZXMubGVuZ3RoIC0gMVxuXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBlbmQ7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBzdHIgKz0gXCIsIFwiICsgcHJlZml4KHR5cGVzW2ldKVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHN0ciArPSBcIiwgb3IgXCIgKyBwcmVmaXgodHlwZXNbZW5kXSlcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihzdHIpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlLCBuYW1lLCB0eXBlKSB7XG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheSh0eXBlKSkgcmV0dXJuIGNoZWNrU2luZ2xlKHZhbHVlLCBuYW1lLCB0eXBlKVxuICAgICAgICBpZiAodHlwZS5sZW5ndGggPT09IDEpIHJldHVybiBjaGVja1NpbmdsZSh2YWx1ZSwgbmFtZSwgdHlwZVswXSlcbiAgICAgICAgcmV0dXJuIGNoZWNrTWFueSh2YWx1ZSwgbmFtZSwgdHlwZSlcbiAgICB9XG59KSgpXG5cbmZ1bmN0aW9uIGNoZWNrVHlwZU9mKHZhbHVlLCBuYW1lKSB7XG4gICAgaWYgKHZhbHVlID09PSBcImJvb2xlYW5cIiB8fCB2YWx1ZSA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm5cbiAgICBpZiAodmFsdWUgPT09IFwibnVtYmVyXCIgfHwgdmFsdWUgPT09IFwib2JqZWN0XCIgfHwgdmFsdWUgPT09IFwic3RyaW5nXCIpIHJldHVyblxuICAgIGlmICh2YWx1ZSA9PT0gXCJzeW1ib2xcIiB8fCB2YWx1ZSA9PT0gXCJ1bmRlZmluZWRcIikgcmV0dXJuXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBcIiArIG5hbWUgKyBcImAgbXVzdCBiZSBhIHZhbGlkIGB0eXBlb2ZgIHZhbHVlXCIpXG59XG5cbi8vIFRoaXMgaG9sZHMgZXZlcnl0aGluZyB0byBiZSBhZGRlZC5cbnZhciBtZXRob2RzID0gW11cbnZhciBhbGlhc2VzID0gW11cblxuZnVuY3Rpb24gZ2V0QXNzZXJ0aW9uRGVwcmVjYXRpb24obmFtZSkge1xuICAgIHZhciByZXBsYWNlbWVudCA9IG5hbWVcblxuICAgIHN3aXRjaCAobmFtZSkge1xuICAgIGNhc2UgXCJib29sZWFuXCI6IHJlcGxhY2VtZW50ID0gXCJpc0Jvb2xlYW5cIjsgYnJlYWtcbiAgICBjYXNlIFwiZnVuY3Rpb25cIjogcmVwbGFjZW1lbnQgPSBcImlzRnVuY3Rpb25cIjsgYnJlYWtcbiAgICBjYXNlIFwibnVtYmVyXCI6IHJlcGxhY2VtZW50ID0gXCJpc051bWJlclwiOyBicmVha1xuICAgIGNhc2UgXCJvYmplY3RcIjogcmVwbGFjZW1lbnQgPSBcImlzT2JqZWN0XCI7IGJyZWFrXG4gICAgY2FzZSBcInN0cmluZ1wiOiByZXBsYWNlbWVudCA9IFwiaXNTdHJpbmdcIjsgYnJlYWtcbiAgICBjYXNlIFwic3ltYm9sXCI6IHJlcGxhY2VtZW50ID0gXCJpc1N5bWJvbFwiOyBicmVha1xuICAgIGNhc2UgXCJpbnN0YW5jZW9mXCI6IHJlcGxhY2VtZW50ID0gXCJpc1wiOyBicmVha1xuICAgIGNhc2UgXCJub3RJbnN0YW5jZW9mXCI6IHJlcGxhY2VtZW50ID0gXCJub3RcIjsgYnJlYWtcbiAgICBjYXNlIFwiaGFzTGVuZ3RoXCI6IHJlcGxhY2VtZW50ID0gXCJlcXVhbFwiOyBicmVha1xuICAgIGNhc2UgXCJub3RMZW5ndGhcIjogcmVwbGFjZW1lbnQgPSBcIm5vdEVxdWFsXCI7IGJyZWFrXG4gICAgY2FzZSBcImxlbmd0aEF0TGVhc3RcIjogcmVwbGFjZW1lbnQgPSBcImF0TGVhc3RcIjsgYnJlYWtcbiAgICBjYXNlIFwibGVuZ3RoQXRNb3N0XCI6IHJlcGxhY2VtZW50ID0gXCJhdE1vc3RcIjsgYnJlYWtcbiAgICBjYXNlIFwibGVuZ3RoQWJvdmVcIjogcmVwbGFjZW1lbnQgPSBcImFib3ZlXCI7IGJyZWFrXG4gICAgY2FzZSBcImxlbmd0aEJlbG93XCI6IHJlcGxhY2VtZW50ID0gXCJiZWxvd1wiOyBicmVha1xuICAgIGNhc2UgXCJub3RJbmNsdWRlc0FsbFwiOiByZXBsYWNlbWVudCA9IFwibm90SW5jbHVkZXNBbGxcIjsgYnJlYWtcbiAgICBjYXNlIFwibm90SW5jbHVkZXNMb29zZUFsbFwiOiByZXBsYWNlbWVudCA9IFwibm90SW5jbHVkZXNBbGxcIjsgYnJlYWtcbiAgICBjYXNlIFwibm90SW5jbHVkZXNEZWVwQWxsXCI6IHJlcGxhY2VtZW50ID0gXCJub3RJbmNsdWRlc0FsbERlZXBcIjsgYnJlYWtcbiAgICBjYXNlIFwibm90SW5jbHVkZXNNYXRjaEFsbFwiOiByZXBsYWNlbWVudCA9IFwibm90SW5jbHVkZXNBbGxNYXRjaFwiOyBicmVha1xuICAgIGNhc2UgXCJpbmNsdWRlc0FueVwiOiByZXBsYWNlbWVudCA9IFwiaW5jbHVkZXNBbnlcIjsgYnJlYWtcbiAgICBjYXNlIFwiaW5jbHVkZXNMb29zZUFueVwiOiByZXBsYWNlbWVudCA9IFwiaW5jbHVkZXNBbnlcIjsgYnJlYWtcbiAgICBjYXNlIFwiaW5jbHVkZXNEZWVwQW55XCI6IHJlcGxhY2VtZW50ID0gXCJpbmNsdWRlc0FueURlZXBcIjsgYnJlYWtcbiAgICBjYXNlIFwiaW5jbHVkZXNNYXRjaEFueVwiOiByZXBsYWNlbWVudCA9IFwiaW5jbHVkZXNBbnlNYXRjaFwiOyBicmVha1xuICAgIGNhc2UgXCJ1bmRlZmluZWRcIjpcbiAgICAgICAgcmV0dXJuIFwiYHQudW5kZWZpbmVkKClgIGlzIGRlcHJlY2F0ZWQuIFVzZSBcIiArXG4gICAgICAgICAgICBcImBhc3NlcnQuZXF1YWwodW5kZWZpbmVkLCB2YWx1ZSlgLiBmcm9tIGB0aGFsbGl1bS9hc3NlcnRgIGluc3RlYWQuXCJcbiAgICBjYXNlIFwidHlwZVwiOlxuICAgICAgICByZXR1cm4gXCJgdC50eXBlKClgIGlzIGRlcHJlY2F0ZWQuIFVzZSBgYXNzZXJ0LmlzQm9vbGVhbigpYC9ldGMuIGZyb20gXCIgK1xuICAgICAgICAgICAgXCJgdGhhbGxpdW0vYXNzZXJ0YCBpbnN0ZWFkLlwiXG4gICAgZGVmYXVsdDogLy8gaWdub3JlXG4gICAgfVxuXG4gICAgcmV0dXJuIFwiYHQuXCIgKyBuYW1lICsgXCIoKWAgaXMgZGVwcmVjYXRlZC4gVXNlIGBhc3NlcnQuXCIgKyByZXBsYWNlbWVudCArXG4gICAgICAgIFwiKClgIGZyb20gYHRoYWxsaXVtL2Fzc2VydGAgaW5zdGVhZC5cIlxufVxuXG4vKipcbiAqIFRoZSBjb3JlIGFzc2VydGlvbnMgZXhwb3J0LCBhcyBhIHBsdWdpbi5cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAodCkge1xuICAgIG1ldGhvZHMuZm9yRWFjaChmdW5jdGlvbiAobSkge1xuICAgICAgICB0LmRlZmluZShtLm5hbWUsIGRlcHJlY2F0ZShnZXRBc3NlcnRpb25EZXByZWNhdGlvbihtLm5hbWUpLCBtLmNhbGxiYWNrKSlcbiAgICB9KVxuICAgIGFsaWFzZXMuZm9yRWFjaChmdW5jdGlvbiAoYWxpYXMpIHsgdFthbGlhcy5uYW1lXSA9IHRbYWxpYXMub3JpZ2luYWxdIH0pXG59XG5cbi8vIExpdHRsZSBoZWxwZXJzIHNvIHRoYXQgdGhlc2UgZnVuY3Rpb25zIG9ubHkgbmVlZCB0byBiZSBjcmVhdGVkIG9uY2UuXG5mdW5jdGlvbiBkZWZpbmUobmFtZSwgY2FsbGJhY2spIHtcbiAgICBjaGVjayhuYW1lLCBcIm5hbWVcIiwgXCJzdHJpbmdcIilcbiAgICBjaGVjayhjYWxsYmFjaywgXCJjYWxsYmFja1wiLCBcImZ1bmN0aW9uXCIpXG4gICAgbWV0aG9kcy5wdXNoKHtuYW1lOiBuYW1lLCBjYWxsYmFjazogY2FsbGJhY2t9KVxufVxuXG4vLyBNdWNoIGVhc2llciB0byB0eXBlXG5mdW5jdGlvbiBuZWdhdGUobmFtZSkge1xuICAgIGNoZWNrKG5hbWUsIFwibmFtZVwiLCBcInN0cmluZ1wiKVxuICAgIHJldHVybiBcIm5vdFwiICsgbmFtZVswXS50b1VwcGVyQ2FzZSgpICsgbmFtZS5zbGljZSgxKVxufVxuXG4vLyBUaGUgYmFzaWMgYXNzZXJ0LiBJdCdzIGFsbW9zdCB0aGVyZSBmb3IgbG9va3MsIGdpdmVuIGhvdyBlYXN5IGl0IGlzIHRvXG4vLyBkZWZpbmUgeW91ciBvd24gYXNzZXJ0aW9ucy5cbmZ1bmN0aW9uIHNhbml0aXplKG1lc3NhZ2UpIHtcbiAgICByZXR1cm4gbWVzc2FnZSA/IFN0cmluZyhtZXNzYWdlKS5yZXBsYWNlKC8oXFx7XFx3K1xcfSkvZywgXCJcXFxcJDFcIikgOiBcIlwiXG59XG5cbmRlZmluZShcImFzc2VydFwiLCBmdW5jdGlvbiAodGVzdCwgbWVzc2FnZSkge1xuICAgIHJldHVybiB7dGVzdDogdGVzdCwgbWVzc2FnZTogc2FuaXRpemUobWVzc2FnZSl9XG59KVxuXG5kZWZpbmUoXCJmYWlsXCIsIGZ1bmN0aW9uIChtZXNzYWdlKSB7XG4gICAgcmV0dXJuIHt0ZXN0OiBmYWxzZSwgbWVzc2FnZTogc2FuaXRpemUobWVzc2FnZSl9XG59KVxuXG4vKipcbiAqIFRoZXNlIG1ha2VzIG1hbnkgb2YgdGhlIGNvbW1vbiBvcGVyYXRvcnMgbXVjaCBlYXNpZXIgdG8gZG8uXG4gKi9cbmZ1bmN0aW9uIHVuYXJ5KG5hbWUsIGZ1bmMsIG1lc3NhZ2VzKSB7XG4gICAgZGVmaW5lKG5hbWUsIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdGVzdDogZnVuYyh2YWx1ZSksXG4gICAgICAgICAgICBhY3R1YWw6IHZhbHVlLFxuICAgICAgICAgICAgbWVzc2FnZTogbWVzc2FnZXNbMF0sXG4gICAgICAgIH1cbiAgICB9KVxuXG4gICAgZGVmaW5lKG5lZ2F0ZShuYW1lKSwgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0ZXN0OiAhZnVuYyh2YWx1ZSksXG4gICAgICAgICAgICBhY3R1YWw6IHZhbHVlLFxuICAgICAgICAgICAgbWVzc2FnZTogbWVzc2FnZXNbMV0sXG4gICAgICAgIH1cbiAgICB9KVxufVxuXG5mdW5jdGlvbiBiaW5hcnkobmFtZSwgZnVuYywgbWVzc2FnZXMpIHtcbiAgICBkZWZpbmUobmFtZSwgZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHRlc3Q6IGZ1bmMoYWN0dWFsLCBleHBlY3RlZCksXG4gICAgICAgICAgICBhY3R1YWw6IGFjdHVhbCxcbiAgICAgICAgICAgIGV4cGVjdGVkOiBleHBlY3RlZCxcbiAgICAgICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2VzWzBdLFxuICAgICAgICB9XG4gICAgfSlcblxuICAgIGRlZmluZShuZWdhdGUobmFtZSksIGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0ZXN0OiAhZnVuYyhhY3R1YWwsIGV4cGVjdGVkKSxcbiAgICAgICAgICAgIGFjdHVhbDogYWN0dWFsLFxuICAgICAgICAgICAgZXhwZWN0ZWQ6IGV4cGVjdGVkLFxuICAgICAgICAgICAgbWVzc2FnZTogbWVzc2FnZXNbMV0sXG4gICAgICAgIH1cbiAgICB9KVxufVxuXG51bmFyeShcIm9rXCIsIGZ1bmN0aW9uICh4KSB7IHJldHVybiAhIXggfSwgW1xuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gYmUgb2tcIixcbiAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBiZSBva1wiLFxuXSlcblxuXCJib29sZWFuIGZ1bmN0aW9uIG51bWJlciBvYmplY3Qgc3RyaW5nIHN5bWJvbFwiLnNwbGl0KFwiIFwiKVxuLmZvckVhY2goZnVuY3Rpb24gKHR5cGUpIHtcbiAgICB2YXIgbmFtZSA9ICh0eXBlWzBdID09PSBcIm9cIiA/IFwiYW4gXCIgOiBcImEgXCIpICsgdHlwZVxuXG4gICAgdW5hcnkodHlwZSwgZnVuY3Rpb24gKHgpIHsgcmV0dXJuIHR5cGVvZiB4ID09PSB0eXBlIH0sIFtcbiAgICAgICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBiZSBcIiArIG5hbWUsXG4gICAgICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGJlIFwiICsgbmFtZSxcbiAgICBdKVxufSlcblxuO1t0cnVlLCBmYWxzZSwgbnVsbCwgdW5kZWZpbmVkXS5mb3JFYWNoKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHVuYXJ5KHZhbHVlICsgXCJcIiwgZnVuY3Rpb24gKHgpIHsgcmV0dXJuIHggPT09IHZhbHVlIH0sIFtcbiAgICAgICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBiZSBcIiArIHZhbHVlLFxuICAgICAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBiZSBcIiArIHZhbHVlLFxuICAgIF0pXG59KVxuXG51bmFyeShcImV4aXN0c1wiLCBmdW5jdGlvbiAoeCkgeyByZXR1cm4geCAhPSBudWxsIH0sIFtcbiAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGV4aXN0XCIsXG4gICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgZXhpc3RcIixcbl0pXG5cbnVuYXJ5KFwiYXJyYXlcIiwgQXJyYXkuaXNBcnJheSwgW1xuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gYmUgYW4gYXJyYXlcIixcbiAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBiZSBhbiBhcnJheVwiLFxuXSlcblxuZGVmaW5lKFwidHlwZVwiLCBmdW5jdGlvbiAob2JqZWN0LCB0eXBlKSB7XG4gICAgY2hlY2tUeXBlT2YodHlwZSwgXCJ0eXBlXCIpXG5cbiAgICByZXR1cm4ge1xuICAgICAgICB0ZXN0OiB0eXBlb2Ygb2JqZWN0ID09PSB0eXBlLFxuICAgICAgICBleHBlY3RlZDogdHlwZSxcbiAgICAgICAgYWN0dWFsOiB0eXBlb2Ygb2JqZWN0LFxuICAgICAgICBvOiBvYmplY3QsXG4gICAgICAgIG1lc3NhZ2U6IFwiRXhwZWN0ZWQgdHlwZW9mIHtvfSB0byBiZSB7ZXhwZWN0ZWR9LCBidXQgZm91bmQge2FjdHVhbH1cIixcbiAgICB9XG59KVxuXG5kZWZpbmUoXCJub3RUeXBlXCIsIGZ1bmN0aW9uIChvYmplY3QsIHR5cGUpIHtcbiAgICBjaGVja1R5cGVPZih0eXBlLCBcInR5cGVcIilcblxuICAgIHJldHVybiB7XG4gICAgICAgIHRlc3Q6IHR5cGVvZiBvYmplY3QgIT09IHR5cGUsXG4gICAgICAgIGV4cGVjdGVkOiB0eXBlLFxuICAgICAgICBvOiBvYmplY3QsXG4gICAgICAgIG1lc3NhZ2U6IFwiRXhwZWN0ZWQgdHlwZW9mIHtvfSB0byBub3QgYmUge2V4cGVjdGVkfVwiLFxuICAgIH1cbn0pXG5cbmRlZmluZShcImluc3RhbmNlb2ZcIiwgZnVuY3Rpb24gKG9iamVjdCwgVHlwZSkge1xuICAgIGNoZWNrKFR5cGUsIFwiVHlwZVwiLCBcImZ1bmN0aW9uXCIpXG5cbiAgICByZXR1cm4ge1xuICAgICAgICB0ZXN0OiBvYmplY3QgaW5zdGFuY2VvZiBUeXBlLFxuICAgICAgICBleHBlY3RlZDogVHlwZSxcbiAgICAgICAgYWN0dWFsOiBvYmplY3QuY29uc3RydWN0b3IsXG4gICAgICAgIG86IG9iamVjdCxcbiAgICAgICAgbWVzc2FnZTogXCJFeHBlY3RlZCB7b30gdG8gYmUgYW4gaW5zdGFuY2Ugb2Yge2V4cGVjdGVkfSwgYnV0IGZvdW5kIHthY3R1YWx9XCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LWxlblxuICAgIH1cbn0pXG5cbmRlZmluZShcIm5vdEluc3RhbmNlb2ZcIiwgZnVuY3Rpb24gKG9iamVjdCwgVHlwZSkge1xuICAgIGNoZWNrKFR5cGUsIFwiVHlwZVwiLCBcImZ1bmN0aW9uXCIpXG5cbiAgICByZXR1cm4ge1xuICAgICAgICB0ZXN0OiAhKG9iamVjdCBpbnN0YW5jZW9mIFR5cGUpLFxuICAgICAgICBleHBlY3RlZDogVHlwZSxcbiAgICAgICAgbzogb2JqZWN0LFxuICAgICAgICBtZXNzYWdlOiBcIkV4cGVjdGVkIHtvfSB0byBub3QgYmUgYW4gaW5zdGFuY2Ugb2Yge2V4cGVjdGVkfVwiLFxuICAgIH1cbn0pXG5cbmJpbmFyeShcImVxdWFsXCIsIHN0cmljdElzLCBbXG4gICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBlcXVhbCB7ZXhwZWN0ZWR9XCIsXG4gICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgZXF1YWwge2V4cGVjdGVkfVwiLFxuXSlcblxuYmluYXJ5KFwiZXF1YWxMb29zZVwiLCBsb29zZUlzLCBbXG4gICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBsb29zZWx5IGVxdWFsIHtleHBlY3RlZH1cIixcbiAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBsb29zZWx5IGVxdWFsIHtleHBlY3RlZH1cIixcbl0pXG5cbmZ1bmN0aW9uIGNvbXAobmFtZSwgY29tcGFyZSwgbWVzc2FnZSkge1xuICAgIGRlZmluZShuYW1lLCBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgICBjaGVjayhhY3R1YWwsIFwiYWN0dWFsXCIsIFwibnVtYmVyXCIpXG4gICAgICAgIGNoZWNrKGV4cGVjdGVkLCBcImV4cGVjdGVkXCIsIFwibnVtYmVyXCIpXG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHRlc3Q6IGNvbXBhcmUoYWN0dWFsLCBleHBlY3RlZCksXG4gICAgICAgICAgICBhY3R1YWw6IGFjdHVhbCxcbiAgICAgICAgICAgIGV4cGVjdGVkOiBleHBlY3RlZCxcbiAgICAgICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgICAgIH1cbiAgICB9KVxufVxuXG4vKiBlc2xpbnQtZGlzYWJsZSBtYXgtbGVuICovXG5cbmNvbXAoXCJhdExlYXN0XCIsIGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBhID49IGIgfSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBiZSBhdCBsZWFzdCB7ZXhwZWN0ZWR9XCIpXG5jb21wKFwiYXRNb3N0XCIsIGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBhIDw9IGIgfSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBiZSBhdCBtb3N0IHtleHBlY3RlZH1cIilcbmNvbXAoXCJhYm92ZVwiLCBmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYSA+IGIgfSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBiZSBhYm92ZSB7ZXhwZWN0ZWR9XCIpXG5jb21wKFwiYmVsb3dcIiwgZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGEgPCBiIH0sIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gYmUgYmVsb3cge2V4cGVjdGVkfVwiKVxuXG5kZWZpbmUoXCJiZXR3ZWVuXCIsIGZ1bmN0aW9uIChhY3R1YWwsIGxvd2VyLCB1cHBlcikge1xuICAgIGNoZWNrKGFjdHVhbCwgXCJhY3R1YWxcIiwgXCJudW1iZXJcIilcbiAgICBjaGVjayhsb3dlciwgXCJsb3dlclwiLCBcIm51bWJlclwiKVxuICAgIGNoZWNrKHVwcGVyLCBcInVwcGVyXCIsIFwibnVtYmVyXCIpXG5cbiAgICByZXR1cm4ge1xuICAgICAgICB0ZXN0OiBhY3R1YWwgPj0gbG93ZXIgJiYgYWN0dWFsIDw9IHVwcGVyLFxuICAgICAgICBhY3R1YWw6IGFjdHVhbCxcbiAgICAgICAgbG93ZXI6IGxvd2VyLFxuICAgICAgICB1cHBlcjogdXBwZXIsXG4gICAgICAgIG1lc3NhZ2U6IFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gYmUgYmV0d2VlbiB7bG93ZXJ9IGFuZCB7dXBwZXJ9XCIsXG4gICAgfVxufSlcblxuLyogZXNsaW50LWVuYWJsZSBtYXgtbGVuICovXG5cbmJpbmFyeShcImRlZXBFcXVhbFwiLCBtYXRjaC5zdHJpY3QsIFtcbiAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGRlZXBseSBlcXVhbCB7ZXhwZWN0ZWR9XCIsXG4gICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgZGVlcGx5IGVxdWFsIHtleHBlY3RlZH1cIixcbl0pXG5cbmJpbmFyeShcIm1hdGNoXCIsIG1hdGNoLmxvb3NlLCBbXG4gICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBtYXRjaCB7ZXhwZWN0ZWR9XCIsXG4gICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgbWF0Y2gge2V4cGVjdGVkfVwiLFxuXSlcblxuZnVuY3Rpb24gaGFzKG5hbWUsIF8pIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtbGVuLCBtYXgtcGFyYW1zXG4gICAgaWYgKF8uZXF1YWxzID09PSBsb29zZUlzKSB7XG4gICAgICAgIGRlZmluZShuYW1lLCBmdW5jdGlvbiAob2JqZWN0LCBrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHRlc3Q6IF8uaGFzKG9iamVjdCwga2V5KSAmJiBfLmlzKF8uZ2V0KG9iamVjdCwga2V5KSwgdmFsdWUpLFxuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiB2YWx1ZSxcbiAgICAgICAgICAgICAgICBhY3R1YWw6IG9iamVjdFtrZXldLFxuICAgICAgICAgICAgICAgIGtleToga2V5LFxuICAgICAgICAgICAgICAgIG9iamVjdDogb2JqZWN0LFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IF8ubWVzc2FnZXNbMF0sXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG5cbiAgICAgICAgZGVmaW5lKG5lZ2F0ZShuYW1lKSwgZnVuY3Rpb24gKG9iamVjdCwga2V5LCB2YWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0ZXN0OiAhXy5oYXMob2JqZWN0LCBrZXkpIHx8ICFfLmlzKF8uZ2V0KG9iamVjdCwga2V5KSwgdmFsdWUpLFxuICAgICAgICAgICAgICAgIGFjdHVhbDogdmFsdWUsXG4gICAgICAgICAgICAgICAga2V5OiBrZXksXG4gICAgICAgICAgICAgICAgb2JqZWN0OiBvYmplY3QsXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogXy5tZXNzYWdlc1syXSxcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9IGVsc2Uge1xuICAgICAgICBkZWZpbmUobmFtZSwgZnVuY3Rpb24gKG9iamVjdCwga2V5LCB2YWx1ZSkge1xuICAgICAgICAgICAgdmFyIHRlc3QgPSBfLmhhcyhvYmplY3QsIGtleSlcblxuICAgICAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gMykge1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIHRlc3Q6IHRlc3QgJiYgXy5pcyhfLmdldChvYmplY3QsIGtleSksIHZhbHVlKSxcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IHZhbHVlLFxuICAgICAgICAgICAgICAgICAgICBhY3R1YWw6IG9iamVjdFtrZXldLFxuICAgICAgICAgICAgICAgICAgICBrZXk6IGtleSxcbiAgICAgICAgICAgICAgICAgICAgb2JqZWN0OiBvYmplY3QsXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IF8ubWVzc2FnZXNbMF0sXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICB0ZXN0OiB0ZXN0LFxuICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDoga2V5LFxuICAgICAgICAgICAgICAgICAgICBhY3R1YWw6IG9iamVjdCxcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogXy5tZXNzYWdlc1sxXSxcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG5cbiAgICAgICAgZGVmaW5lKG5lZ2F0ZShuYW1lKSwgZnVuY3Rpb24gKG9iamVjdCwga2V5LCB2YWx1ZSkge1xuICAgICAgICAgICAgdmFyIHRlc3QgPSAhXy5oYXMob2JqZWN0LCBrZXkpXG5cbiAgICAgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICB0ZXN0OiB0ZXN0IHx8ICFfLmlzKF8uZ2V0KG9iamVjdCwga2V5KSwgdmFsdWUpLFxuICAgICAgICAgICAgICAgICAgICBhY3R1YWw6IHZhbHVlLFxuICAgICAgICAgICAgICAgICAgICBrZXk6IGtleSxcbiAgICAgICAgICAgICAgICAgICAgb2JqZWN0OiBvYmplY3QsXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IF8ubWVzc2FnZXNbMl0sXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICB0ZXN0OiB0ZXN0LFxuICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDoga2V5LFxuICAgICAgICAgICAgICAgICAgICBhY3R1YWw6IG9iamVjdCxcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogXy5tZXNzYWdlc1szXSxcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfVxufVxuXG5mdW5jdGlvbiBoYXNPd25LZXkob2JqZWN0LCBrZXkpIHsgcmV0dXJuIGhhc093bi5jYWxsKG9iamVjdCwga2V5KSB9XG5mdW5jdGlvbiBoYXNJbktleShvYmplY3QsIGtleSkgeyByZXR1cm4ga2V5IGluIG9iamVjdCB9XG5mdW5jdGlvbiBoYXNJbkNvbGwob2JqZWN0LCBrZXkpIHsgcmV0dXJuIG9iamVjdC5oYXMoa2V5KSB9XG5mdW5jdGlvbiBoYXNPYmplY3RHZXQob2JqZWN0LCBrZXkpIHsgcmV0dXJuIG9iamVjdFtrZXldIH1cbmZ1bmN0aW9uIGhhc0NvbGxHZXQob2JqZWN0LCBrZXkpIHsgcmV0dXJuIG9iamVjdC5nZXQoa2V5KSB9XG5cbmhhcyhcImhhc093blwiLCB7XG4gICAgaXM6IHN0cmljdElzLFxuICAgIGhhczogaGFzT3duS2V5LFxuICAgIGdldDogaGFzT2JqZWN0R2V0LFxuICAgIG1lc3NhZ2VzOiBbXG4gICAgICAgIFwiRXhwZWN0ZWQge29iamVjdH0gdG8gaGF2ZSBvd24ga2V5IHtrZXl9IGVxdWFsIHRvIHtleHBlY3RlZH0sIGJ1dCBmb3VuZCB7YWN0dWFsfVwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1sZW5cbiAgICAgICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBoYXZlIG93biBrZXkge2V4cGVjdGVkfVwiLFxuICAgICAgICBcIkV4cGVjdGVkIHtvYmplY3R9IHRvIG5vdCBoYXZlIG93biBrZXkge2tleX0gZXF1YWwgdG8ge2FjdHVhbH1cIixcbiAgICAgICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgaGF2ZSBvd24ga2V5IHtleHBlY3RlZH1cIixcbiAgICBdLFxufSlcblxuaGFzKFwiaGFzT3duTG9vc2VcIiwge1xuICAgIGlzOiBsb29zZUlzLFxuICAgIGhhczogaGFzT3duS2V5LFxuICAgIGdldDogaGFzT2JqZWN0R2V0LFxuICAgIG1lc3NhZ2VzOiBbXG4gICAgICAgIFwiRXhwZWN0ZWQge29iamVjdH0gdG8gaGF2ZSBvd24ga2V5IHtrZXl9IGxvb3NlbHkgZXF1YWwgdG8ge2V4cGVjdGVkfSwgYnV0IGZvdW5kIHthY3R1YWx9XCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LWxlblxuICAgICAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGhhdmUgb3duIGtleSB7ZXhwZWN0ZWR9XCIsXG4gICAgICAgIFwiRXhwZWN0ZWQge29iamVjdH0gdG8gbm90IGhhdmUgb3duIGtleSB7a2V5fSBsb29zZWx5IGVxdWFsIHRvIHthY3R1YWx9XCIsXG4gICAgICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGhhdmUgb3duIGtleSB7ZXhwZWN0ZWR9XCIsXG4gICAgXSxcbn0pXG5cbmhhcyhcImhhc0tleVwiLCB7XG4gICAgaXM6IHN0cmljdElzLFxuICAgIGhhczogaGFzSW5LZXksXG4gICAgZ2V0OiBoYXNPYmplY3RHZXQsXG4gICAgbWVzc2FnZXM6IFtcbiAgICAgICAgXCJFeHBlY3RlZCB7b2JqZWN0fSB0byBoYXZlIGtleSB7a2V5fSBlcXVhbCB0byB7ZXhwZWN0ZWR9LCBidXQgZm91bmQge2FjdHVhbH1cIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtbGVuXG4gICAgICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gaGF2ZSBrZXkge2V4cGVjdGVkfVwiLFxuICAgICAgICBcIkV4cGVjdGVkIHtvYmplY3R9IHRvIG5vdCBoYXZlIGtleSB7a2V5fSBlcXVhbCB0byB7YWN0dWFsfVwiLFxuICAgICAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBoYXZlIGtleSB7ZXhwZWN0ZWR9XCIsXG4gICAgXSxcbn0pXG5cbmhhcyhcImhhc0tleUxvb3NlXCIsIHtcbiAgICBpczogbG9vc2VJcyxcbiAgICBoYXM6IGhhc0luS2V5LFxuICAgIGdldDogaGFzT2JqZWN0R2V0LFxuICAgIG1lc3NhZ2VzOiBbXG4gICAgICAgIFwiRXhwZWN0ZWQge29iamVjdH0gdG8gaGF2ZSBrZXkge2tleX0gbG9vc2VseSBlcXVhbCB0byB7ZXhwZWN0ZWR9LCBidXQgZm91bmQge2FjdHVhbH1cIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtbGVuXG4gICAgICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gaGF2ZSBrZXkge2V4cGVjdGVkfVwiLFxuICAgICAgICBcIkV4cGVjdGVkIHtvYmplY3R9IHRvIG5vdCBoYXZlIGtleSB7a2V5fSBsb29zZWx5IGVxdWFsIHRvIHthY3R1YWx9XCIsXG4gICAgICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGhhdmUga2V5IHtleHBlY3RlZH1cIixcbiAgICBdLFxufSlcblxuaGFzKFwiaGFzXCIsIHtcbiAgICBpczogc3RyaWN0SXMsXG4gICAgaGFzOiBoYXNJbkNvbGwsXG4gICAgZ2V0OiBoYXNDb2xsR2V0LFxuICAgIG1lc3NhZ2VzOiBbXG4gICAgICAgIFwiRXhwZWN0ZWQge29iamVjdH0gdG8gaGF2ZSBrZXkge2tleX0gZXF1YWwgdG8ge2V4cGVjdGVkfSwgYnV0IGZvdW5kIHthY3R1YWx9XCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LWxlblxuICAgICAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGhhdmUga2V5IHtleHBlY3RlZH1cIixcbiAgICAgICAgXCJFeHBlY3RlZCB7b2JqZWN0fSB0byBub3QgaGF2ZSBrZXkge2tleX0gZXF1YWwgdG8ge2FjdHVhbH1cIixcbiAgICAgICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgaGF2ZSBrZXkge2V4cGVjdGVkfVwiLFxuICAgIF0sXG59KVxuXG5oYXMoXCJoYXNMb29zZVwiLCB7XG4gICAgaXM6IGxvb3NlSXMsXG4gICAgaGFzOiBoYXNJbkNvbGwsXG4gICAgZ2V0OiBoYXNDb2xsR2V0LFxuICAgIG1lc3NhZ2VzOiBbXG4gICAgICAgIFwiRXhwZWN0ZWQge29iamVjdH0gdG8gaGF2ZSBrZXkge2tleX0gZXF1YWwgdG8ge2V4cGVjdGVkfSwgYnV0IGZvdW5kIHthY3R1YWx9XCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LWxlblxuICAgICAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGhhdmUga2V5IHtleHBlY3RlZH1cIixcbiAgICAgICAgXCJFeHBlY3RlZCB7b2JqZWN0fSB0byBub3QgaGF2ZSBrZXkge2tleX0gZXF1YWwgdG8ge2FjdHVhbH1cIixcbiAgICAgICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgaGF2ZSBrZXkge2V4cGVjdGVkfVwiLFxuICAgIF0sXG59KVxuXG5mdW5jdGlvbiBnZXROYW1lKGZ1bmMpIHtcbiAgICBpZiAoZnVuYy5uYW1lICE9IG51bGwpIHJldHVybiBmdW5jLm5hbWUgfHwgXCI8YW5vbnltb3VzPlwiXG4gICAgaWYgKGZ1bmMuZGlzcGxheU5hbWUgIT0gbnVsbCkgcmV0dXJuIGZ1bmMuZGlzcGxheU5hbWUgfHwgXCI8YW5vbnltb3VzPlwiXG4gICAgcmV0dXJuIFwiPGFub255bW91cz5cIlxufVxuXG5mdW5jdGlvbiB0aHJvd3MobmFtZSwgXykge1xuICAgIGZ1bmN0aW9uIHJ1bihpbnZlcnQpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChmdW5jLCBtYXRjaGVyKSB7XG4gICAgICAgICAgICBjaGVjayhmdW5jLCBcImZ1bmNcIiwgXCJmdW5jdGlvblwiKVxuICAgICAgICAgICAgXy5jaGVjayhtYXRjaGVyKVxuXG4gICAgICAgICAgICB2YXIgdGVzdCwgZXJyb3JcblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBmdW5jKClcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICB0ZXN0ID0gXy50ZXN0KG1hdGNoZXIsIGVycm9yID0gZSlcblxuICAgICAgICAgICAgICAgIC8vIFJldGhyb3cgdW5rbm93biBlcnJvcnMgdGhhdCBkb24ndCBtYXRjaCB3aGVuIGEgbWF0Y2hlciB3YXNcbiAgICAgICAgICAgICAgICAvLyBwYXNzZWQgLSBpdCdzIGVhc2llciB0byBkZWJ1ZyB1bmV4cGVjdGVkIGVycm9ycyB3aGVuIHlvdSBoYXZlXG4gICAgICAgICAgICAgICAgLy8gYSBzdGFjayB0cmFjZS4gRG9uJ3QgcmV0aHJvdyBub24tZXJyb3JzLCB0aG91Z2guXG4gICAgICAgICAgICAgICAgaWYgKF8ucmV0aHJvdyhtYXRjaGVyLCBpbnZlcnQsIHRlc3QsIGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IGVcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdGVzdDogISF0ZXN0IF4gaW52ZXJ0LFxuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBtYXRjaGVyLFxuICAgICAgICAgICAgICAgIGVycm9yOiBlcnJvcixcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBfLm1lc3NhZ2UobWF0Y2hlciwgaW52ZXJ0LCB0ZXN0KSxcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGRlZmluZShuYW1lLCBydW4oZmFsc2UpKVxuICAgIGRlZmluZShuZWdhdGUobmFtZSksIHJ1bih0cnVlKSlcbn1cblxudGhyb3dzKFwidGhyb3dzXCIsIHtcbiAgICB0ZXN0OiBmdW5jdGlvbiAoVHlwZSwgZSkgeyByZXR1cm4gVHlwZSA9PSBudWxsIHx8IGUgaW5zdGFuY2VvZiBUeXBlIH0sXG4gICAgY2hlY2s6IGZ1bmN0aW9uIChUeXBlKSB7IGNoZWNrKFR5cGUsIFwiVHlwZVwiLCBbXCJub25lXCIsIFwiZnVuY3Rpb25cIl0pIH0sXG5cbiAgICByZXRocm93OiBmdW5jdGlvbiAobWF0Y2hlciwgaW52ZXJ0LCB0ZXN0LCBlKSB7XG4gICAgICAgIHJldHVybiBtYXRjaGVyICE9IG51bGwgJiYgIWludmVydCAmJiAhdGVzdCAmJiBlIGluc3RhbmNlb2YgRXJyb3JcbiAgICB9LFxuXG4gICAgbWVzc2FnZTogZnVuY3Rpb24gKFR5cGUsIGludmVydCwgdGVzdCkge1xuICAgICAgICB2YXIgc3RyID0gXCJFeHBlY3RlZCBjYWxsYmFjayB0byBcIlxuXG4gICAgICAgIGlmIChpbnZlcnQpIHN0ciArPSBcIm5vdCBcIlxuICAgICAgICBzdHIgKz0gXCJ0aHJvd1wiXG5cbiAgICAgICAgaWYgKFR5cGUgIT0gbnVsbCkge1xuICAgICAgICAgICAgc3RyICs9IFwiIGFuIGluc3RhbmNlIG9mIFwiICsgZ2V0TmFtZShUeXBlKVxuICAgICAgICAgICAgaWYgKCFpbnZlcnQgJiYgdGVzdCA9PT0gZmFsc2UpIHN0ciArPSBcIiwgYnV0IGZvdW5kIHtlcnJvcn1cIlxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHN0clxuICAgIH0sXG59KVxuXG50aHJvd3MoXCJ0aHJvd3NNYXRjaFwiLCB7XG4gICAgdGVzdDogZnVuY3Rpb24gKG1hdGNoZXIsIGUpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBtYXRjaGVyID09PSBcInN0cmluZ1wiKSByZXR1cm4gZS5tZXNzYWdlID09PSBtYXRjaGVyXG4gICAgICAgIGlmICh0eXBlb2YgbWF0Y2hlciA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4gISFtYXRjaGVyKGUpXG4gICAgICAgIHJldHVybiBtYXRjaGVyLnRlc3QoZS5tZXNzYWdlKVxuICAgIH0sXG5cbiAgICBjaGVjazogZnVuY3Rpb24gKG1hdGNoZXIpIHtcbiAgICAgICAgLy8gTm90IGFjY2VwdGluZyBvYmplY3RzIHlldC5cbiAgICAgICAgY2hlY2sobWF0Y2hlciwgXCJtYXRjaGVyXCIsIFtcInN0cmluZ1wiLCBcInJlZ2V4cFwiLCBcImZ1bmN0aW9uXCJdKVxuICAgIH0sXG5cbiAgICByZXRocm93OiBmdW5jdGlvbiAoKSB7IHJldHVybiBmYWxzZSB9LFxuXG4gICAgbWVzc2FnZTogZnVuY3Rpb24gKF8sIGludmVydCwgdGVzdCkge1xuICAgICAgICBpZiAoaW52ZXJ0KSB7XG4gICAgICAgICAgICByZXR1cm4gXCJFeHBlY3RlZCBjYWxsYmFjayB0byBub3QgdGhyb3cgYW4gZXJyb3IgdGhhdCBtYXRjaGVzIHtleHBlY3RlZH1cIiAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1sZW5cbiAgICAgICAgfSBlbHNlIGlmICh0ZXN0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIHRocm93IGFuIGVycm9yIHRoYXQgbWF0Y2hlcyB7ZXhwZWN0ZWR9LCBidXQgZm91bmQgbm8gZXJyb3JcIiAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1sZW5cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIHRocm93IGFuIGVycm9yIHRoYXQgbWF0Y2hlcyB7ZXhwZWN0ZWR9LCBidXQgZm91bmQge2Vycm9yfVwiIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LWxlblxuICAgICAgICB9XG4gICAgfSxcbn0pXG5cbmZ1bmN0aW9uIGxlbihuYW1lLCBjb21wYXJlLCBtZXNzYWdlKSB7XG4gICAgZGVmaW5lKG5hbWUsIGZ1bmN0aW9uIChvYmplY3QsIGxlbmd0aCkge1xuICAgICAgICBjaGVjayhvYmplY3QsIFwib2JqZWN0XCIsIFwib2JqZWN0XCIpXG4gICAgICAgIGNoZWNrKGxlbmd0aCwgXCJsZW5ndGhcIiwgXCJudW1iZXJcIilcblxuICAgICAgICB2YXIgbGVuID0gb2JqZWN0Lmxlbmd0aFxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0ZXN0OiBsZW4gIT0gbnVsbCAmJiBjb21wYXJlKGxlbiwgK2xlbmd0aCksXG4gICAgICAgICAgICBleHBlY3RlZDogbGVuZ3RoLFxuICAgICAgICAgICAgYWN0dWFsOiBsZW4sXG4gICAgICAgICAgICBvYmplY3Q6IG9iamVjdCxcbiAgICAgICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgICAgIH1cbiAgICB9KVxufVxuXG4vKiBlc2xpbnQtZGlzYWJsZSBtYXgtbGVuICovXG5cbi8vIE5vdGU6IHRoZXNlIGFsd2F5cyBmYWlsIHdpdGggTmFOcy5cbmxlbihcImxlbmd0aFwiLCBmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYSA9PT0gYiB9LCBcIkV4cGVjdGVkIHtvYmplY3R9IHRvIGhhdmUgbGVuZ3RoIHtleHBlY3RlZH0sIGJ1dCBmb3VuZCB7YWN0dWFsfVwiKVxubGVuKFwibm90TGVuZ3RoXCIsIGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBhICE9PSBiIH0sIFwiRXhwZWN0ZWQge29iamVjdH0gdG8gbm90IGhhdmUgbGVuZ3RoIHthY3R1YWx9XCIpXG5sZW4oXCJsZW5ndGhBdExlYXN0XCIsIGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBhID49IGIgfSwgXCJFeHBlY3RlZCB7b2JqZWN0fSB0byBoYXZlIGxlbmd0aCBhdCBsZWFzdCB7ZXhwZWN0ZWR9LCBidXQgZm91bmQge2FjdHVhbH1cIilcbmxlbihcImxlbmd0aEF0TW9zdFwiLCBmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYSA8PSBiIH0sIFwiRXhwZWN0ZWQge29iamVjdH0gdG8gaGF2ZSBsZW5ndGggYXQgbW9zdCB7ZXhwZWN0ZWR9LCBidXQgZm91bmQge2FjdHVhbH1cIilcbmxlbihcImxlbmd0aEFib3ZlXCIsIGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBhID4gYiB9LCBcIkV4cGVjdGVkIHtvYmplY3R9IHRvIGhhdmUgbGVuZ3RoIGFib3ZlIHtleHBlY3RlZH0sIGJ1dCBmb3VuZCB7YWN0dWFsfVwiKVxubGVuKFwibGVuZ3RoQmVsb3dcIiwgZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGEgPCBiIH0sIFwiRXhwZWN0ZWQge29iamVjdH0gdG8gaGF2ZSBsZW5ndGggYmVsb3cge2V4cGVjdGVkfSwgYnV0IGZvdW5kIHthY3R1YWx9XCIpXG5cbi8qIGVzbGludC1lbmFibGUgbWF4LWxlbiAqL1xuXG4vLyBOb3RlOiB0aGVzZSB0d28gYWx3YXlzIGZhaWwgd2hlbiBkZWFsaW5nIHdpdGggTmFOcy5cbmRlZmluZShcImNsb3NlVG9cIiwgZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQsIGRlbHRhKSB7XG4gICAgY2hlY2soYWN0dWFsLCBcImFjdHVhbFwiLCBcIm51bWJlclwiKVxuICAgIGNoZWNrKGV4cGVjdGVkLCBcImV4cGVjdGVkXCIsIFwibnVtYmVyXCIpXG4gICAgY2hlY2soZGVsdGEsIFwiZGVsdGFcIiwgXCJudW1iZXJcIilcblxuICAgIHJldHVybiB7XG4gICAgICAgIHRlc3Q6IE1hdGguYWJzKGFjdHVhbCAtIGV4cGVjdGVkKSA8PSBNYXRoLmFicyhkZWx0YSksXG4gICAgICAgIGFjdHVhbDogYWN0dWFsLFxuICAgICAgICBleHBlY3RlZDogZXhwZWN0ZWQsXG4gICAgICAgIGRlbHRhOiBkZWx0YSxcbiAgICAgICAgbWVzc2FnZTogXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBiZSB3aXRoaW4ge2RlbHRhfSBvZiB7ZXhwZWN0ZWR9XCIsXG4gICAgfVxufSlcblxuZGVmaW5lKFwibm90Q2xvc2VUb1wiLCBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCwgZGVsdGEpIHtcbiAgICBjaGVjayhhY3R1YWwsIFwiYWN0dWFsXCIsIFwibnVtYmVyXCIpXG4gICAgY2hlY2soZXhwZWN0ZWQsIFwiZXhwZWN0ZWRcIiwgXCJudW1iZXJcIilcbiAgICBjaGVjayhkZWx0YSwgXCJkZWx0YVwiLCBcIm51bWJlclwiKVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgdGVzdDogTWF0aC5hYnMoYWN0dWFsIC0gZXhwZWN0ZWQpID4gTWF0aC5hYnMoZGVsdGEpLFxuICAgICAgICBhY3R1YWw6IGFjdHVhbCxcbiAgICAgICAgZXhwZWN0ZWQ6IGV4cGVjdGVkLFxuICAgICAgICBkZWx0YTogZGVsdGEsXG4gICAgICAgIG1lc3NhZ2U6IFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGJlIHdpdGhpbiB7ZGVsdGF9IG9mIHtleHBlY3RlZH1cIixcbiAgICB9XG59KVxuXG4vKiBlc2xpbnQtZGlzYWJsZSBtYXgtbGVuICovXG5cbi8qKlxuICogVGhlcmUncyA0IHNldHMgb2YgNCBwZXJtdXRhdGlvbnMgaGVyZSBmb3IgYGluY2x1ZGVzYCBhbmQgYGhhc0tleXNgLCBpbnN0ZWFkXG4gKiBvZiBOIHNldHMgb2YgMiAod2hpY2ggd291bGQgZml0IHRoZSBgZm9vYC9gbm90Rm9vYCBpZGlvbSBiZXR0ZXIpLCBzbyBpdCdzXG4gKiBlYXNpZXIgdG8ganVzdCBtYWtlIGEgY291cGxlIHNlcGFyYXRlIERTTHMgYW5kIHVzZSB0aGF0IHRvIGRlZmluZSBldmVyeXRoaW5nLlxuICpcbiAqIEhlcmUncyB0aGUgdG9wIGxldmVsOlxuICpcbiAqIC0gc3RyaWN0IHNoYWxsb3dcbiAqIC0gbG9vc2Ugc2hhbGxvd1xuICogLSBzdHJpY3QgZGVlcFxuICogLSBzdHJ1Y3R1cmFsIGRlZXBcbiAqXG4gKiBBbmQgdGhlIHNlY29uZCBsZXZlbDpcbiAqXG4gKiAtIGluY2x1ZGVzIGFsbC9ub3QgbWlzc2luZyBzb21lXG4gKiAtIGluY2x1ZGVzIHNvbWUvbm90IG1pc3NpbmcgYWxsXG4gKiAtIG5vdCBpbmNsdWRpbmcgYWxsL21pc3Npbmcgc29tZVxuICogLSBub3QgaW5jbHVkaW5nIHNvbWUvbWlzc2luZyBhbGxcbiAqXG4gKiBIZXJlJ3MgYW4gZXhhbXBsZSB1c2luZyB0aGUgbmFtaW5nIHNjaGVtZSBmb3IgYGhhc0tleXNgLCBldGMuXG4gKlxuICogICAgICAgICAgICAgICB8IHN0cmljdCBzaGFsbG93ICB8ICAgIGxvb3NlIHNoYWxsb3cgICAgIHwgICAgIHN0cmljdCBkZWVwICAgICB8ICAgICBzdHJ1Y3R1cmFsIGRlZXBcbiAqIC0tLS0tLS0tLS0tLS0tfC0tLS0tLS0tLS0tLS0tLS0tfC0tLS0tLS0tLS0tLS0tLS0tLS0tLS18LS0tLS0tLS0tLS0tLS0tLS0tLS0tfC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAqIGluY2x1ZGVzIGFsbCAgfCBgaGFzS2V5c2AgICAgICAgfCBgaGFzTG9vc2VLZXlzYCAgICAgICB8IGBoYXNEZWVwS2V5c2AgICAgICAgfCBgaGFzTWF0Y2hLZXlzYFxuICogaW5jbHVkZXMgc29tZSB8IGBoYXNBbnlLZXlzYCAgICB8IGBoYXNMb29zZUFueUtleXNgICAgIHwgYGhhc0RlZXBBbnlLZXlzYCAgICB8IGBoYXNNYXRjaEFueUtleXNgXG4gKiBtaXNzaW5nIHNvbWUgIHwgYG5vdEhhc0FsbEtleXNgIHwgYG5vdEhhc0xvb3NlQWxsS2V5c2AgfCBgbm90SGFzRGVlcEFsbEtleXNgIHwgYG5vdEhhc01hdGNoQWxsS2V5c2BcbiAqIG1pc3NpbmcgYWxsICAgfCBgbm90SGFzS2V5c2AgICAgfCBgbm90SGFzTG9vc2VLZXlzYCAgICB8IGBub3RIYXNEZWVwS2V5c2AgICAgfCBgbm90SGFzTWF0Y2hLZXlzYFxuICpcbiAqIE5vdGUgdGhhdCB0aGUgYGhhc0tleXNgIHNoYWxsb3cgY29tcGFyaXNvbiB2YXJpYW50cyBhcmUgYWxzbyBvdmVybG9hZGVkIHRvXG4gKiBjb25zdW1lIGVpdGhlciBhbiBhcnJheSAoaW4gd2hpY2ggaXQgc2ltcGx5IGNoZWNrcyBhZ2FpbnN0IGEgbGlzdCBvZiBrZXlzKSBvclxuICogYW4gb2JqZWN0ICh3aGVyZSBpdCBkb2VzIGEgZnVsbCBkZWVwIGNvbXBhcmlzb24pLlxuICovXG5cbi8qIGVzbGludC1lbmFibGUgbWF4LWxlbiAqL1xuXG5mdW5jdGlvbiBtYWtlSW5jbHVkZXMoYWxsLCBmdW5jKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChhcnJheSwga2V5cykge1xuICAgICAgICBmdW5jdGlvbiB0ZXN0KGtleSkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcnJheS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChmdW5jKGtleSwgYXJyYXlbaV0pKSByZXR1cm4gdHJ1ZVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoYWxsKSB7XG4gICAgICAgICAgICBpZiAoYXJyYXkubGVuZ3RoIDwga2V5cy5sZW5ndGgpIHJldHVybiBmYWxzZVxuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoIXRlc3Qoa2V5c1tpXSkpIHJldHVybiBmYWxzZVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwga2V5cy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgIGlmICh0ZXN0KGtleXNbal0pKSByZXR1cm4gdHJ1ZVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRlZmluZUluY2x1ZGVzKG5hbWUsIGZ1bmMsIGludmVydCwgbWVzc2FnZSkge1xuICAgIGZ1bmN0aW9uIGJhc2UoYXJyYXksIHZhbHVlcykge1xuICAgICAgICAvLyBDaGVhcCBjYXNlcyBmaXJzdFxuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkoYXJyYXkpKSByZXR1cm4gZmFsc2VcbiAgICAgICAgaWYgKGFycmF5ID09PSB2YWx1ZXMpIHJldHVybiB0cnVlXG4gICAgICAgIHJldHVybiBmdW5jKGFycmF5LCB2YWx1ZXMpXG4gICAgfVxuXG4gICAgZGVmaW5lKG5hbWUsIGZ1bmN0aW9uIChhcnJheSwgdmFsdWVzKSB7XG4gICAgICAgIGNoZWNrKGFycmF5LCBcImFycmF5XCIsIFwiYXJyYXlcIilcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHZhbHVlcykpIHZhbHVlcyA9IFt2YWx1ZXNdXG5cbiAgICAgICAgLy8gZXhjbHVzaXZlIG9yIHRvIGludmVydCB0aGUgcmVzdWx0IGlmIGBpbnZlcnRgIGlzIHRydWVcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHRlc3Q6ICF2YWx1ZXMubGVuZ3RoIHx8IGludmVydCBeIGJhc2UoYXJyYXksIHZhbHVlcyksXG4gICAgICAgICAgICBhY3R1YWw6IGFycmF5LFxuICAgICAgICAgICAgdmFsdWVzOiB2YWx1ZXMsXG4gICAgICAgICAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgICAgICB9XG4gICAgfSlcbn1cblxudmFyIGluY2x1ZGVzQWxsID0gbWFrZUluY2x1ZGVzKHRydWUsIHN0cmljdElzKVxudmFyIGluY2x1ZGVzQW55ID0gbWFrZUluY2x1ZGVzKGZhbHNlLCBzdHJpY3RJcylcblxuLyogZXNsaW50LWRpc2FibGUgbWF4LWxlbiAqL1xuXG5kZWZpbmVJbmNsdWRlcyhcImluY2x1ZGVzXCIsIGluY2x1ZGVzQWxsLCBmYWxzZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBoYXZlIGFsbCB2YWx1ZXMgaW4ge3ZhbHVlc31cIilcbmRlZmluZUluY2x1ZGVzKFwibm90SW5jbHVkZXNBbGxcIiwgaW5jbHVkZXNBbGwsIHRydWUsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGhhdmUgYWxsIHZhbHVlcyBpbiB7dmFsdWVzfVwiKVxuZGVmaW5lSW5jbHVkZXMoXCJpbmNsdWRlc0FueVwiLCBpbmNsdWRlc0FueSwgZmFsc2UsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gaGF2ZSBhbnkgdmFsdWUgaW4ge3ZhbHVlc31cIilcbmRlZmluZUluY2x1ZGVzKFwibm90SW5jbHVkZXNcIiwgaW5jbHVkZXNBbnksIHRydWUsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGhhdmUgYW55IHZhbHVlIGluIHt2YWx1ZXN9XCIpXG5cbnZhciBpbmNsdWRlc0xvb3NlQWxsID0gbWFrZUluY2x1ZGVzKHRydWUsIGxvb3NlSXMpXG52YXIgaW5jbHVkZXNMb29zZUFueSA9IG1ha2VJbmNsdWRlcyhmYWxzZSwgbG9vc2VJcylcblxuZGVmaW5lSW5jbHVkZXMoXCJpbmNsdWRlc0xvb3NlXCIsIGluY2x1ZGVzTG9vc2VBbGwsIGZhbHNlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGxvb3NlbHkgaGF2ZSBhbGwgdmFsdWVzIGluIHt2YWx1ZXN9XCIpXG5kZWZpbmVJbmNsdWRlcyhcIm5vdEluY2x1ZGVzTG9vc2VBbGxcIiwgaW5jbHVkZXNMb29zZUFsbCwgdHJ1ZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgbG9vc2VseSBoYXZlIGFsbCB2YWx1ZXMgaW4ge3ZhbHVlc31cIilcbmRlZmluZUluY2x1ZGVzKFwiaW5jbHVkZXNMb29zZUFueVwiLCBpbmNsdWRlc0xvb3NlQW55LCBmYWxzZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBsb29zZWx5IGhhdmUgYW55IHZhbHVlIGluIHt2YWx1ZXN9XCIpXG5kZWZpbmVJbmNsdWRlcyhcIm5vdEluY2x1ZGVzTG9vc2VcIiwgaW5jbHVkZXNMb29zZUFueSwgdHJ1ZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgbG9vc2VseSBoYXZlIGFueSB2YWx1ZSBpbiB7dmFsdWVzfVwiKVxuXG52YXIgaW5jbHVkZXNEZWVwQWxsID0gbWFrZUluY2x1ZGVzKHRydWUsIG1hdGNoLnN0cmljdClcbnZhciBpbmNsdWRlc0RlZXBBbnkgPSBtYWtlSW5jbHVkZXMoZmFsc2UsIG1hdGNoLnN0cmljdClcblxuZGVmaW5lSW5jbHVkZXMoXCJpbmNsdWRlc0RlZXBcIiwgaW5jbHVkZXNEZWVwQWxsLCBmYWxzZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBtYXRjaCBhbGwgdmFsdWVzIGluIHt2YWx1ZXN9XCIpXG5kZWZpbmVJbmNsdWRlcyhcIm5vdEluY2x1ZGVzRGVlcEFsbFwiLCBpbmNsdWRlc0RlZXBBbGwsIHRydWUsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IG1hdGNoIGFsbCB2YWx1ZXMgaW4ge3ZhbHVlc31cIilcbmRlZmluZUluY2x1ZGVzKFwiaW5jbHVkZXNEZWVwQW55XCIsIGluY2x1ZGVzRGVlcEFueSwgZmFsc2UsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbWF0Y2ggYW55IHZhbHVlIGluIHt2YWx1ZXN9XCIpXG5kZWZpbmVJbmNsdWRlcyhcIm5vdEluY2x1ZGVzRGVlcFwiLCBpbmNsdWRlc0RlZXBBbnksIHRydWUsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IG1hdGNoIGFueSB2YWx1ZSBpbiB7dmFsdWVzfVwiKVxuXG52YXIgaW5jbHVkZXNNYXRjaEFsbCA9IG1ha2VJbmNsdWRlcyh0cnVlLCBtYXRjaC5sb29zZSlcbnZhciBpbmNsdWRlc01hdGNoQW55ID0gbWFrZUluY2x1ZGVzKGZhbHNlLCBtYXRjaC5sb29zZSlcblxuZGVmaW5lSW5jbHVkZXMoXCJpbmNsdWRlc01hdGNoXCIsIGluY2x1ZGVzTWF0Y2hBbGwsIGZhbHNlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG1hdGNoIGFsbCB2YWx1ZXMgaW4ge3ZhbHVlc31cIilcbmRlZmluZUluY2x1ZGVzKFwibm90SW5jbHVkZXNNYXRjaEFsbFwiLCBpbmNsdWRlc01hdGNoQWxsLCB0cnVlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBtYXRjaCBhbGwgdmFsdWVzIGluIHt2YWx1ZXN9XCIpXG5kZWZpbmVJbmNsdWRlcyhcImluY2x1ZGVzTWF0Y2hBbnlcIiwgaW5jbHVkZXNNYXRjaEFueSwgZmFsc2UsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbWF0Y2ggYW55IHZhbHVlIGluIHt2YWx1ZXN9XCIpXG5kZWZpbmVJbmNsdWRlcyhcIm5vdEluY2x1ZGVzTWF0Y2hcIiwgaW5jbHVkZXNNYXRjaEFueSwgdHJ1ZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgbWF0Y2ggYW55IHZhbHVlIGluIHt2YWx1ZXN9XCIpXG5cbi8qIGVzbGludC1lbmFibGUgbWF4LWxlbiAqL1xuXG5mdW5jdGlvbiBpc0VtcHR5KG9iamVjdCkge1xuICAgIGlmIChBcnJheS5pc0FycmF5KG9iamVjdCkpIHJldHVybiBvYmplY3QubGVuZ3RoID09PSAwXG4gICAgaWYgKHR5cGVvZiBvYmplY3QgIT09IFwib2JqZWN0XCIgfHwgb2JqZWN0ID09PSBudWxsKSByZXR1cm4gdHJ1ZVxuICAgIHJldHVybiBPYmplY3Qua2V5cyhvYmplY3QpLmxlbmd0aCA9PT0gMFxufVxuXG5mdW5jdGlvbiBtYWtlSGFzT3ZlcmxvYWQobmFtZSwgbWV0aG9kcywgaW52ZXJ0LCBtZXNzYWdlKSB7XG4gICAgZnVuY3Rpb24gYmFzZShvYmplY3QsIGtleXMpIHtcbiAgICAgICAgLy8gQ2hlYXAgY2FzZSBmaXJzdFxuICAgICAgICBpZiAob2JqZWN0ID09PSBrZXlzKSByZXR1cm4gdHJ1ZVxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShrZXlzKSkgcmV0dXJuIG1ldGhvZHMuYXJyYXkob2JqZWN0LCBrZXlzKVxuICAgICAgICByZXR1cm4gbWV0aG9kcy5vYmplY3Qob2JqZWN0LCBrZXlzKVxuICAgIH1cblxuICAgIGRlZmluZShuYW1lLCBmdW5jdGlvbiAob2JqZWN0LCBrZXlzKSB7XG4gICAgICAgIGNoZWNrKG9iamVjdCwgXCJvYmplY3RcIiwgXCJvYmplY3RcIilcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC8vIGV4Y2x1c2l2ZSBvciB0byBpbnZlcnQgdGhlIHJlc3VsdCBpZiBgaW52ZXJ0YCBpcyB0cnVlXG4gICAgICAgICAgICB0ZXN0OiBpc0VtcHR5KGtleXMpIHx8IGludmVydCBeIGJhc2Uob2JqZWN0LCBrZXlzKSxcbiAgICAgICAgICAgIGFjdHVhbDogb2JqZWN0LFxuICAgICAgICAgICAga2V5czoga2V5cyxcbiAgICAgICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgICAgIH1cbiAgICB9KVxufVxuXG5mdW5jdGlvbiBtYWtlSGFzS2V5cyhuYW1lLCBmdW5jLCBpbnZlcnQsIG1lc3NhZ2UpIHtcbiAgICBmdW5jdGlvbiBiYXNlKG9iamVjdCwga2V5cykge1xuICAgICAgICByZXR1cm4gb2JqZWN0ID09PSBrZXlzIHx8IGZ1bmMob2JqZWN0LCBrZXlzKVxuICAgIH1cblxuICAgIGRlZmluZShuYW1lLCBmdW5jdGlvbiAob2JqZWN0LCBrZXlzKSB7XG4gICAgICAgIGNoZWNrKG9iamVjdCwgXCJvYmplY3RcIiwgXCJvYmplY3RcIilcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC8vIGV4Y2x1c2l2ZSBvciB0byBpbnZlcnQgdGhlIHJlc3VsdCBpZiBgaW52ZXJ0YCBpcyB0cnVlXG4gICAgICAgICAgICB0ZXN0OiBpc0VtcHR5KGtleXMpIHx8IGludmVydCBeIGJhc2Uob2JqZWN0LCBrZXlzKSxcbiAgICAgICAgICAgIGFjdHVhbDogb2JqZWN0LFxuICAgICAgICAgICAga2V5czoga2V5cyxcbiAgICAgICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgICAgIH1cbiAgICB9KVxufVxuXG5mdW5jdGlvbiBoYXNLZXlzVHlwZShhbGwsIGZ1bmMpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKG9iamVjdCwga2V5cykge1xuICAgICAgICBpZiAodHlwZW9mIGtleXMgIT09IFwib2JqZWN0XCIpIHJldHVybiB0cnVlXG4gICAgICAgIGlmIChrZXlzID09PSBudWxsKSByZXR1cm4gdHJ1ZVxuXG4gICAgICAgIGZ1bmN0aW9uIGNoZWNrKGtleSkge1xuICAgICAgICAgICAgcmV0dXJuIGhhc093bi5jYWxsKG9iamVjdCwga2V5KSAmJiBmdW5jKGtleXNba2V5XSwgb2JqZWN0W2tleV0pXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoYWxsKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBrZXkxIGluIGtleXMpIHtcbiAgICAgICAgICAgICAgICBpZiAoaGFzT3duLmNhbGwoa2V5cywga2V5MSkgJiYgIWNoZWNrKGtleTEpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmb3IgKHZhciBrZXkyIGluIGtleXMpIHtcbiAgICAgICAgICAgICAgICBpZiAoaGFzT3duLmNhbGwoa2V5cywga2V5MikgJiYgY2hlY2soa2V5MikpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gaGFzT3ZlcmxvYWRUeXBlKGFsbCwgZnVuYykge1xuICAgIHJldHVybiB7XG4gICAgICAgIG9iamVjdDogaGFzS2V5c1R5cGUoYWxsLCBmdW5jKSxcbiAgICAgICAgYXJyYXk6IGZ1bmN0aW9uIChvYmplY3QsIGtleXMpIHtcbiAgICAgICAgICAgIGlmIChhbGwpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFoYXNPd24uY2FsbChvYmplY3QsIGtleXNbaV0pKSByZXR1cm4gZmFsc2VcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBrZXlzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChoYXNPd24uY2FsbChvYmplY3QsIGtleXNbal0pKSByZXR1cm4gdHJ1ZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICB9XG59XG5cbi8qIGVzbGludC1kaXNhYmxlIG1heC1sZW4gKi9cblxudmFyIGhhc0FsbEtleXMgPSBoYXNPdmVybG9hZFR5cGUodHJ1ZSwgc3RyaWN0SXMpXG52YXIgaGFzQW55S2V5cyA9IGhhc092ZXJsb2FkVHlwZShmYWxzZSwgc3RyaWN0SXMpXG5cbm1ha2VIYXNPdmVybG9hZChcImhhc0tleXNcIiwgaGFzQWxsS2V5cywgZmFsc2UsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gaGF2ZSBhbGwga2V5cyBpbiB7a2V5c31cIilcbm1ha2VIYXNPdmVybG9hZChcIm5vdEhhc0FsbEtleXNcIiwgaGFzQWxsS2V5cywgdHJ1ZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgaGF2ZSBhbGwga2V5cyBpbiB7a2V5c31cIilcbm1ha2VIYXNPdmVybG9hZChcImhhc0FueUtleXNcIiwgaGFzQW55S2V5cywgZmFsc2UsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gaGF2ZSBhbnkga2V5IGluIHtrZXlzfVwiKVxubWFrZUhhc092ZXJsb2FkKFwibm90SGFzS2V5c1wiLCBoYXNBbnlLZXlzLCB0cnVlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBoYXZlIGFueSBrZXkgaW4ge2tleXN9XCIpXG5cbnZhciBoYXNMb29zZUFsbEtleXMgPSBoYXNPdmVybG9hZFR5cGUodHJ1ZSwgbG9vc2VJcylcbnZhciBoYXNMb29zZUFueUtleXMgPSBoYXNPdmVybG9hZFR5cGUoZmFsc2UsIGxvb3NlSXMpXG5cbm1ha2VIYXNPdmVybG9hZChcImhhc0xvb3NlS2V5c1wiLCBoYXNMb29zZUFsbEtleXMsIGZhbHNlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGxvb3NlbHkgaGF2ZSBhbGwga2V5cyBpbiB7a2V5c31cIilcbm1ha2VIYXNPdmVybG9hZChcIm5vdEhhc0xvb3NlQWxsS2V5c1wiLCBoYXNMb29zZUFsbEtleXMsIHRydWUsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGxvb3NlbHkgaGF2ZSBhbGwga2V5cyBpbiB7a2V5c31cIilcbm1ha2VIYXNPdmVybG9hZChcImhhc0xvb3NlQW55S2V5c1wiLCBoYXNMb29zZUFueUtleXMsIGZhbHNlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGxvb3NlbHkgaGF2ZSBhbnkga2V5IGluIHtrZXlzfVwiKVxubWFrZUhhc092ZXJsb2FkKFwibm90SGFzTG9vc2VLZXlzXCIsIGhhc0xvb3NlQW55S2V5cywgdHJ1ZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgbG9vc2VseSBoYXZlIGFueSBrZXkgaW4ge2tleXN9XCIpXG5cbnZhciBoYXNEZWVwQWxsS2V5cyA9IGhhc0tleXNUeXBlKHRydWUsIG1hdGNoLnN0cmljdClcbnZhciBoYXNEZWVwQW55S2V5cyA9IGhhc0tleXNUeXBlKGZhbHNlLCBtYXRjaC5zdHJpY3QpXG5cbm1ha2VIYXNLZXlzKFwiaGFzRGVlcEtleXNcIiwgaGFzRGVlcEFsbEtleXMsIGZhbHNlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGhhdmUgYWxsIGtleXMgaW4ge2tleXN9XCIpXG5tYWtlSGFzS2V5cyhcIm5vdEhhc0RlZXBBbGxLZXlzXCIsIGhhc0RlZXBBbGxLZXlzLCB0cnVlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBoYXZlIGFsbCBrZXlzIGluIHtrZXlzfVwiKVxubWFrZUhhc0tleXMoXCJoYXNEZWVwQW55S2V5c1wiLCBoYXNEZWVwQW55S2V5cywgZmFsc2UsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gaGF2ZSBhbnkga2V5IGluIHtrZXlzfVwiKVxubWFrZUhhc0tleXMoXCJub3RIYXNEZWVwS2V5c1wiLCBoYXNEZWVwQW55S2V5cywgdHJ1ZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgaGF2ZSBhbnkga2V5IGluIHtrZXlzfVwiKVxuXG52YXIgaGFzTWF0Y2hBbGxLZXlzID0gaGFzS2V5c1R5cGUodHJ1ZSwgbWF0Y2gubG9vc2UpXG52YXIgaGFzTWF0Y2hBbnlLZXlzID0gaGFzS2V5c1R5cGUoZmFsc2UsIG1hdGNoLmxvb3NlKVxuXG5tYWtlSGFzS2V5cyhcImhhc01hdGNoS2V5c1wiLCBoYXNNYXRjaEFsbEtleXMsIGZhbHNlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG1hdGNoIGFsbCBrZXlzIGluIHtrZXlzfVwiKVxubWFrZUhhc0tleXMoXCJub3RIYXNNYXRjaEFsbEtleXNcIiwgaGFzTWF0Y2hBbGxLZXlzLCB0cnVlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBtYXRjaCBhbGwga2V5cyBpbiB7a2V5c31cIilcbm1ha2VIYXNLZXlzKFwiaGFzTWF0Y2hBbnlLZXlzXCIsIGhhc01hdGNoQW55S2V5cywgZmFsc2UsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbWF0Y2ggYW55IGtleSBpbiB7a2V5c31cIilcbm1ha2VIYXNLZXlzKFwibm90SGFzTWF0Y2hLZXlzXCIsIGhhc01hdGNoQW55S2V5cywgdHJ1ZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgbWF0Y2ggYW55IGtleSBpbiB7a2V5c31cIilcbiIsIlwidXNlIHN0cmljdFwiXG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vbGliL2RvbVwiKVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxuLyoqXG4gKiBNYWluIGVudHJ5IHBvaW50LCBmb3IgdGhvc2Ugd2FudGluZyB0byB1c2UgdGhpcyBmcmFtZXdvcmsgd2l0aCB0aGUgY29yZVxuICogYXNzZXJ0aW9ucy5cbiAqL1xudmFyIFRoYWxsaXVtID0gcmVxdWlyZShcIi4vbGliL2FwaS90aGFsbGl1bVwiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBUaGFsbGl1bSgpXG4iLCJcInVzZSBzdHJpY3RcIlxuXG52YXIgVGhhbGxpdW0gPSByZXF1aXJlKFwiLi9saWIvYXBpL3RoYWxsaXVtXCIpXG52YXIgUmVwb3J0cyA9IHJlcXVpcmUoXCIuL2xpYi9jb3JlL3JlcG9ydHNcIilcbnZhciBUeXBlcyA9IFJlcG9ydHMuVHlwZXNcblxuZXhwb3J0cy5yb290ID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBuZXcgVGhhbGxpdW0oKVxufVxuXG5mdW5jdGlvbiBkKGR1cmF0aW9uKSB7XG4gICAgaWYgKGR1cmF0aW9uID09IG51bGwpIHJldHVybiAxMFxuICAgIGlmICh0eXBlb2YgZHVyYXRpb24gPT09IFwibnVtYmVyXCIpIHJldHVybiBkdXJhdGlvbnwwXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGBkdXJhdGlvbmAgdG8gYmUgYSBudW1iZXIgaWYgaXQgZXhpc3RzXCIpXG59XG5cbmZ1bmN0aW9uIHMoc2xvdykge1xuICAgIGlmIChzbG93ID09IG51bGwpIHJldHVybiA3NVxuICAgIGlmICh0eXBlb2Ygc2xvdyA9PT0gXCJudW1iZXJcIikgcmV0dXJuIHNsb3d8MFxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBgc2xvd2AgdG8gYmUgYSBudW1iZXIgaWYgaXQgZXhpc3RzXCIpXG59XG5cbmZ1bmN0aW9uIHAocGF0aCkge1xuICAgIGlmIChBcnJheS5pc0FycmF5KHBhdGgpKSByZXR1cm4gcGF0aFxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBgcGF0aGAgdG8gYmUgYW4gYXJyYXkgb2YgbG9jYXRpb25zXCIpXG59XG5cbmZ1bmN0aW9uIGgodmFsdWUpIHtcbiAgICBpZiAodmFsdWUgIT0gbnVsbCAmJiB0eXBlb2YgdmFsdWUuXyA9PT0gXCJudW1iZXJcIikgcmV0dXJuIHZhbHVlXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGB2YWx1ZWAgdG8gYmUgYSBob29rIGVycm9yXCIpXG59XG5cbi8qKlxuICogQ3JlYXRlIGEgbmV3IHJlcG9ydCwgbWFpbmx5IGZvciB0ZXN0aW5nIHJlcG9ydGVycy5cbiAqL1xuZXhwb3J0cy5yZXBvcnRzID0ge1xuICAgIHN0YXJ0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVwb3J0cy5TdGFydCgpXG4gICAgfSxcblxuICAgIGVudGVyOiBmdW5jdGlvbiAocGF0aCwgZHVyYXRpb24sIHNsb3cpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSZXBvcnRzLkVudGVyKHAocGF0aCksIGQoZHVyYXRpb24pLCBzKHNsb3cpKVxuICAgIH0sXG5cbiAgICBsZWF2ZTogZnVuY3Rpb24gKHBhdGgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSZXBvcnRzLkxlYXZlKHAocGF0aCkpXG4gICAgfSxcblxuICAgIHBhc3M6IGZ1bmN0aW9uIChwYXRoLCBkdXJhdGlvbiwgc2xvdykge1xuICAgICAgICByZXR1cm4gbmV3IFJlcG9ydHMuUGFzcyhwKHBhdGgpLCBkKGR1cmF0aW9uKSwgcyhzbG93KSlcbiAgICB9LFxuXG4gICAgZmFpbDogZnVuY3Rpb24gKHBhdGgsIHZhbHVlLCBkdXJhdGlvbiwgc2xvdykge1xuICAgICAgICByZXR1cm4gbmV3IFJlcG9ydHMuRmFpbChwKHBhdGgpLCB2YWx1ZSwgZChkdXJhdGlvbiksIHMoc2xvdykpXG4gICAgfSxcblxuICAgIHNraXA6IGZ1bmN0aW9uIChwYXRoKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVwb3J0cy5Ta2lwKHAocGF0aCkpXG4gICAgfSxcblxuICAgIGVuZDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IFJlcG9ydHMuRW5kKClcbiAgICB9LFxuXG4gICAgZXJyb3I6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICByZXR1cm4gbmV3IFJlcG9ydHMuRXJyb3IodmFsdWUpXG4gICAgfSxcblxuICAgIGhvb2s6IGZ1bmN0aW9uIChwYXRoLCByb290UGF0aCwgdmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSZXBvcnRzLkhvb2socChwYXRoKSwgcChyb290UGF0aCksIGgodmFsdWUpKVxuICAgIH0sXG59XG5cbi8qKlxuICogQ3JlYXRlIGEgbmV3IGhvb2sgZXJyb3IsIG1haW5seSBmb3IgdGVzdGluZyByZXBvcnRlcnMuXG4gKi9cbmV4cG9ydHMuaG9va0Vycm9ycyA9IHtcbiAgICBiZWZvcmVBbGw6IGZ1bmN0aW9uIChmdW5jLCB2YWx1ZSkge1xuICAgICAgICByZXR1cm4gbmV3IFJlcG9ydHMuSG9va0Vycm9yKFR5cGVzLkJlZm9yZUFsbCwgZnVuYywgdmFsdWUpXG4gICAgfSxcblxuICAgIGJlZm9yZUVhY2g6IGZ1bmN0aW9uIChmdW5jLCB2YWx1ZSkge1xuICAgICAgICByZXR1cm4gbmV3IFJlcG9ydHMuSG9va0Vycm9yKFR5cGVzLkJlZm9yZUVhY2gsIGZ1bmMsIHZhbHVlKVxuICAgIH0sXG5cbiAgICBhZnRlckVhY2g6IGZ1bmN0aW9uIChmdW5jLCB2YWx1ZSkge1xuICAgICAgICByZXR1cm4gbmV3IFJlcG9ydHMuSG9va0Vycm9yKFR5cGVzLkFmdGVyRWFjaCwgZnVuYywgdmFsdWUpXG4gICAgfSxcblxuICAgIGFmdGVyQWxsOiBmdW5jdGlvbiAoZnVuYywgdmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSZXBvcnRzLkhvb2tFcnJvcihUeXBlcy5BZnRlckFsbCwgZnVuYywgdmFsdWUpXG4gICAgfSxcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IGxvY2F0aW9uLCBtYWlubHkgZm9yIHRlc3RpbmcgcmVwb3J0ZXJzLlxuICovXG5leHBvcnRzLmxvY2F0aW9uID0gZnVuY3Rpb24gKG5hbWUsIGluZGV4KSB7XG4gICAgaWYgKHR5cGVvZiBuYW1lICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBgbmFtZWAgdG8gYmUgYSBzdHJpbmdcIilcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGluZGV4ICE9PSBcIm51bWJlclwiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBgaW5kZXhgIHRvIGJlIGEgbnVtYmVyXCIpXG4gICAgfVxuXG4gICAgcmV0dXJuIHtuYW1lOiBuYW1lLCBpbmRleDogaW5kZXh8MH1cbn1cbiIsIlwidXNlIHN0cmljdFwiXG5cbmV4cG9ydHMuYWRkSG9vayA9IGZ1bmN0aW9uIChsaXN0LCBjYWxsYmFjaykge1xuICAgIGlmIChsaXN0ICE9IG51bGwpIHtcbiAgICAgICAgbGlzdC5wdXNoKGNhbGxiYWNrKVxuICAgICAgICByZXR1cm4gbGlzdFxuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBbY2FsbGJhY2tdXG4gICAgfVxufVxuXG5leHBvcnRzLnJlbW92ZUhvb2sgPSBmdW5jdGlvbiAobGlzdCwgY2FsbGJhY2spIHtcbiAgICBpZiAobGlzdCA9PSBudWxsKSByZXR1cm4gdW5kZWZpbmVkXG4gICAgaWYgKGxpc3QubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIGlmIChsaXN0WzBdID09PSBjYWxsYmFjaykgcmV0dXJuIHVuZGVmaW5lZFxuICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBpbmRleCA9IGxpc3QuaW5kZXhPZihjYWxsYmFjaylcblxuICAgICAgICBpZiAoaW5kZXggPj0gMCkgbGlzdC5zcGxpY2UoaW5kZXgsIDEpXG4gICAgfVxuICAgIHJldHVybiBsaXN0XG59XG5cbmV4cG9ydHMuaGFzSG9vayA9IGZ1bmN0aW9uIChsaXN0LCBjYWxsYmFjaykge1xuICAgIGlmIChsaXN0ID09IG51bGwpIHJldHVybiBmYWxzZVxuICAgIGlmIChsaXN0Lmxlbmd0aCA+IDEpIHJldHVybiBsaXN0LmluZGV4T2YoY2FsbGJhY2spID49IDBcbiAgICByZXR1cm4gbGlzdFswXSA9PT0gY2FsbGJhY2tcbn1cbiIsIlwidXNlIHN0cmljdFwiXG5cbnZhciBtZXRob2RzID0gcmVxdWlyZShcIi4uL21ldGhvZHNcIilcbnZhciBUZXN0cyA9IHJlcXVpcmUoXCIuLi9jb3JlL3Rlc3RzXCIpXG52YXIgSG9va3MgPSByZXF1aXJlKFwiLi9ob29rc1wiKVxuXG4vKipcbiAqIFRoaXMgY29udGFpbnMgdGhlIGxvdyBsZXZlbCwgbW9yZSBhcmNhbmUgdGhpbmdzIHRoYXQgYXJlIGdlbmVyYWxseSBub3RcbiAqIGludGVyZXN0aW5nIHRvIGFueW9uZSBvdGhlciB0aGFuIHBsdWdpbiBkZXZlbG9wZXJzLlxuICovXG5tb2R1bGUuZXhwb3J0cyA9IFJlZmxlY3RcbmZ1bmN0aW9uIFJlZmxlY3QodGVzdCkge1xuICAgIHZhciByZWZsZWN0ID0gdGVzdC5yZWZsZWN0XG5cbiAgICBpZiAocmVmbGVjdCAhPSBudWxsKSByZXR1cm4gcmVmbGVjdFxuICAgIGlmICh0ZXN0LnJvb3QgIT09IHRlc3QpIHJldHVybiB0ZXN0LnJlZmxlY3QgPSBuZXcgUmVmbGVjdENoaWxkKHRlc3QpXG4gICAgcmV0dXJuIHRlc3QucmVmbGVjdCA9IG5ldyBSZWZsZWN0Um9vdCh0ZXN0KVxufVxuXG5tZXRob2RzKFJlZmxlY3QsIHtcbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIGN1cnJlbnRseSBleGVjdXRpbmcgdGVzdC5cbiAgICAgKi9cbiAgICBnZXQgY3VycmVudCgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSZWZsZWN0KHRoaXMuXy5yb290LmN1cnJlbnQpXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgcm9vdCB0ZXN0LlxuICAgICAqL1xuICAgIGdldCByb290KCkge1xuICAgICAgICByZXR1cm4gbmV3IFJlZmxlY3QodGhpcy5fLnJvb3QpXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgY3VycmVudCB0b3RhbCB0ZXN0IGNvdW50LlxuICAgICAqL1xuICAgIGdldCBjb3VudCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuXy50ZXN0cyA9PSBudWxsID8gMCA6IHRoaXMuXy50ZXN0cy5sZW5ndGhcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGEgY29weSBvZiB0aGUgY3VycmVudCB0ZXN0IGxpc3QsIGFzIGEgUmVmbGVjdCBjb2xsZWN0aW9uLiBUaGlzIGlzXG4gICAgICogaW50ZW50aW9uYWxseSBhIHNsaWNlLCBzbyB5b3UgY2FuJ3QgbXV0YXRlIHRoZSByZWFsIGNoaWxkcmVuLlxuICAgICAqL1xuICAgIGdldCBjaGlsZHJlbigpIHtcbiAgICAgICAgaWYgKHRoaXMuXy50ZXN0cyA9PSBudWxsKSByZXR1cm4gW11cbiAgICAgICAgcmV0dXJuIHRoaXMuXy50ZXN0cy5tYXAoZnVuY3Rpb24gKHRlc3QpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgUmVmbGVjdENoaWxkKHRlc3QpXG4gICAgICAgIH0pXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIElzIHRoaXMgdGVzdCB0aGUgcm9vdCwgaS5lLiB0b3AgbGV2ZWw/XG4gICAgICovXG4gICAgZ2V0IGlzUm9vdCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuXy5yb290ID09PSB0aGlzLl9cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogSXMgdGhpcyBsb2NrZWQgKGkuZS4gdW5zYWZlIHRvIG1vZGlmeSk/XG4gICAgICovXG4gICAgZ2V0IGlzTG9ja2VkKCkge1xuICAgICAgICByZXR1cm4gISF0aGlzLl8ubG9ja2VkXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgb3duLCBub3QgbmVjZXNzYXJpbHkgYWN0aXZlLCB0aW1lb3V0LiAwIG1lYW5zIGluaGVyaXQgdGhlXG4gICAgICogcGFyZW50J3MsIGFuZCBgSW5maW5pdHlgIG1lYW5zIGl0J3MgZGlzYWJsZWQuXG4gICAgICovXG4gICAgZ2V0IG93blRpbWVvdXQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl8udGltZW91dCB8fCAwXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgYWN0aXZlIHRpbWVvdXQgaW4gbWlsbGlzZWNvbmRzLCBub3QgbmVjZXNzYXJpbHkgb3duLCBvciB0aGVcbiAgICAgKiBmcmFtZXdvcmsgZGVmYXVsdCBvZiAyMDAwLCBpZiBub25lIHdhcyBzZXQuXG4gICAgICovXG4gICAgZ2V0IHRpbWVvdXQoKSB7XG4gICAgICAgIHJldHVybiBUZXN0cy50aW1lb3V0KHRoaXMuXylcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBvd24sIG5vdCBuZWNlc3NhcmlseSBhY3RpdmUsIHNsb3cgdGhyZXNob2xkLiAwIG1lYW5zIGluaGVyaXQgdGhlXG4gICAgICogcGFyZW50J3MsIGFuZCBgSW5maW5pdHlgIG1lYW5zIGl0J3MgZGlzYWJsZWQuXG4gICAgICovXG4gICAgZ2V0IG93blNsb3coKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl8uc2xvdyB8fCAwXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgYWN0aXZlIHNsb3cgdGhyZXNob2xkIGluIG1pbGxpc2Vjb25kcywgbm90IG5lY2Vzc2FyaWx5IG93biwgb3JcbiAgICAgKiB0aGUgZnJhbWV3b3JrIGRlZmF1bHQgb2YgNzUsIGlmIG5vbmUgd2FzIHNldC5cbiAgICAgKi9cbiAgICBnZXQgc2xvdygpIHtcbiAgICAgICAgcmV0dXJuIFRlc3RzLnNsb3codGhpcy5fKVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGQgYSBob29rIHRvIGJlIHJ1biBiZWZvcmUgZWFjaCBzdWJ0ZXN0LCBpbmNsdWRpbmcgdGhlaXIgc3VidGVzdHMgYW5kIHNvXG4gICAgICogb24uXG4gICAgICovXG4gICAgYmVmb3JlOiBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgY2FsbGJhY2sgdG8gYmUgYSBmdW5jdGlvbiBpZiBwYXNzZWRcIilcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuXy5iZWZvcmVFYWNoID0gSG9va3MuYWRkSG9vayh0aGlzLl8uYmVmb3JlRWFjaCwgY2FsbGJhY2spXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBhIGhvb2sgdG8gYmUgcnVuIG9uY2UgYmVmb3JlIGFsbCBzdWJ0ZXN0cyBhcmUgcnVuLlxuICAgICAqL1xuICAgIGJlZm9yZUFsbDogZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIGJlIGEgZnVuY3Rpb24gaWYgcGFzc2VkXCIpXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl8uYmVmb3JlQWxsID0gSG9va3MuYWRkSG9vayh0aGlzLl8uYmVmb3JlQWxsLCBjYWxsYmFjaylcbiAgICB9LFxuXG4gICAvKipcbiAgICAqIEFkZCBhIGhvb2sgdG8gYmUgcnVuIGFmdGVyIGVhY2ggc3VidGVzdCwgaW5jbHVkaW5nIHRoZWlyIHN1YnRlc3RzIGFuZCBzb1xuICAgICogb24uXG4gICAgKi9cbiAgICBhZnRlcjogZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIGJlIGEgZnVuY3Rpb24gaWYgcGFzc2VkXCIpXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl8uYWZ0ZXJFYWNoID0gSG9va3MuYWRkSG9vayh0aGlzLl8uYWZ0ZXJFYWNoLCBjYWxsYmFjaylcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGEgaG9vayB0byBiZSBydW4gb25jZSBhZnRlciBhbGwgc3VidGVzdHMgYXJlIHJ1bi5cbiAgICAgKi9cbiAgICBhZnRlckFsbDogZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIGJlIGEgZnVuY3Rpb24gaWYgcGFzc2VkXCIpXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl8uYWZ0ZXJBbGwgPSBIb29rcy5hZGRIb29rKHRoaXMuXy5hZnRlckFsbCwgY2FsbGJhY2spXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBhIGhvb2sgcHJldmlvdXNseSBhZGRlZCB3aXRoIGB0LmJlZm9yZWAgb3IgYHJlZmxlY3QuYmVmb3JlYC5cbiAgICAgKi9cbiAgICBoYXNCZWZvcmU6IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBjYWxsYmFjayB0byBiZSBhIGZ1bmN0aW9uIGlmIHBhc3NlZFwiKVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIEhvb2tzLmhhc0hvb2sodGhpcy5fLmJlZm9yZUVhY2gsIGNhbGxiYWNrKVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgYSBob29rIHByZXZpb3VzbHkgYWRkZWQgd2l0aCBgdC5iZWZvcmVBbGxgIG9yIGByZWZsZWN0LmJlZm9yZUFsbGAuXG4gICAgICovXG4gICAgaGFzQmVmb3JlQWxsOiBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgY2FsbGJhY2sgdG8gYmUgYSBmdW5jdGlvbiBpZiBwYXNzZWRcIilcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBIb29rcy5oYXNIb29rKHRoaXMuXy5iZWZvcmVBbGwsIGNhbGxiYWNrKVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgYSBob29rIHByZXZpb3VzbHkgYWRkZWQgd2l0aCBgdC5hZnRlcmAgb3JgcmVmbGVjdC5hZnRlcmAuXG4gICAgICovXG4gICAgaGFzQWZ0ZXI6IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBjYWxsYmFjayB0byBiZSBhIGZ1bmN0aW9uIGlmIHBhc3NlZFwiKVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIEhvb2tzLmhhc0hvb2sodGhpcy5fLmFmdGVyRWFjaCwgY2FsbGJhY2spXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBhIGhvb2sgcHJldmlvdXNseSBhZGRlZCB3aXRoIGB0LmFmdGVyQWxsYCBvciBgcmVmbGVjdC5hZnRlckFsbGAuXG4gICAgICovXG4gICAgaGFzQWZ0ZXJBbGw6IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBjYWxsYmFjayB0byBiZSBhIGZ1bmN0aW9uIGlmIHBhc3NlZFwiKVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIEhvb2tzLmhhc0hvb2sodGhpcy5fLmFmdGVyQWxsLCBjYWxsYmFjaylcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGEgaG9vayBwcmV2aW91c2x5IGFkZGVkIHdpdGggYHQuYmVmb3JlYCBvciBgcmVmbGVjdC5iZWZvcmVgLlxuICAgICAqL1xuICAgIHJlbW92ZUJlZm9yZTogZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIGJlIGEgZnVuY3Rpb24gaWYgcGFzc2VkXCIpXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgYmVmb3JlRWFjaCA9IEhvb2tzLnJlbW92ZUhvb2sodGhpcy5fLmJlZm9yZUVhY2gsIGNhbGxiYWNrKVxuXG4gICAgICAgIGlmIChiZWZvcmVFYWNoID09IG51bGwpIGRlbGV0ZSB0aGlzLl8uYmVmb3JlRWFjaFxuICAgICAgICBlbHNlIHRoaXMuXy5iZWZvcmVFYWNoID0gYmVmb3JlRWFjaFxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgYSBob29rIHByZXZpb3VzbHkgYWRkZWQgd2l0aCBgdC5iZWZvcmVBbGxgIG9yIGByZWZsZWN0LmJlZm9yZUFsbGAuXG4gICAgICovXG4gICAgcmVtb3ZlQmVmb3JlQWxsOiBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgY2FsbGJhY2sgdG8gYmUgYSBmdW5jdGlvbiBpZiBwYXNzZWRcIilcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBiZWZvcmVBbGwgPSBIb29rcy5yZW1vdmVIb29rKHRoaXMuXy5iZWZvcmVBbGwsIGNhbGxiYWNrKVxuXG4gICAgICAgIGlmIChiZWZvcmVBbGwgPT0gbnVsbCkgZGVsZXRlIHRoaXMuXy5iZWZvcmVBbGxcbiAgICAgICAgZWxzZSB0aGlzLl8uYmVmb3JlQWxsID0gYmVmb3JlQWxsXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBhIGhvb2sgcHJldmlvdXNseSBhZGRlZCB3aXRoIGB0LmFmdGVyYCBvcmByZWZsZWN0LmFmdGVyYC5cbiAgICAgKi9cbiAgICByZW1vdmVBZnRlcjogZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIGJlIGEgZnVuY3Rpb24gaWYgcGFzc2VkXCIpXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgYWZ0ZXJFYWNoID0gSG9va3MucmVtb3ZlSG9vayh0aGlzLl8uYWZ0ZXJFYWNoLCBjYWxsYmFjaylcblxuICAgICAgICBpZiAoYWZ0ZXJFYWNoID09IG51bGwpIGRlbGV0ZSB0aGlzLl8uYWZ0ZXJFYWNoXG4gICAgICAgIGVsc2UgdGhpcy5fLmFmdGVyRWFjaCA9IGFmdGVyRWFjaFxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgYSBob29rIHByZXZpb3VzbHkgYWRkZWQgd2l0aCBgdC5hZnRlckFsbGAgb3IgYHJlZmxlY3QuYWZ0ZXJBbGxgLlxuICAgICAqL1xuICAgIHJlbW92ZUFmdGVyQWxsOiBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgY2FsbGJhY2sgdG8gYmUgYSBmdW5jdGlvbiBpZiBwYXNzZWRcIilcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBhZnRlckFsbCA9IEhvb2tzLnJlbW92ZUhvb2sodGhpcy5fLmFmdGVyQWxsLCBjYWxsYmFjaylcblxuICAgICAgICBpZiAoYWZ0ZXJBbGwgPT0gbnVsbCkgZGVsZXRlIHRoaXMuXy5hZnRlckFsbFxuICAgICAgICBlbHNlIHRoaXMuXy5hZnRlckFsbCA9IGFmdGVyQWxsXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBhIGJsb2NrIG9yIGlubGluZSB0ZXN0LlxuICAgICAqL1xuICAgIHRlc3Q6IGZ1bmN0aW9uIChuYW1lLCBjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIG5hbWUgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBgbmFtZWAgdG8gYmUgYSBzdHJpbmdcIilcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIGJlIGEgZnVuY3Rpb24gaWYgcGFzc2VkXCIpXG4gICAgICAgIH1cblxuICAgICAgICBUZXN0cy5hZGROb3JtYWwodGhpcy5fLnJvb3QuY3VycmVudCwgbmFtZSwgY2FsbGJhY2spXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBhIHNraXBwZWQgYmxvY2sgb3IgaW5saW5lIHRlc3QuXG4gICAgICovXG4gICAgdGVzdFNraXA6IGZ1bmN0aW9uIChuYW1lLCBjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIG5hbWUgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBgbmFtZWAgdG8gYmUgYSBzdHJpbmdcIilcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIGJlIGEgZnVuY3Rpb24gaWYgcGFzc2VkXCIpXG4gICAgICAgIH1cblxuICAgICAgICBUZXN0cy5hZGRTa2lwcGVkKHRoaXMuXy5yb290LmN1cnJlbnQsIG5hbWUpXG4gICAgfSxcbn0pXG5cbmZ1bmN0aW9uIFJlZmxlY3RSb290KHJvb3QpIHtcbiAgICB0aGlzLl8gPSByb290XG59XG5cbm1ldGhvZHMoUmVmbGVjdFJvb3QsIFJlZmxlY3QsIHtcbiAgICAvKipcbiAgICAgKiBXaGV0aGVyIGEgcmVwb3J0ZXIgd2FzIHJlZ2lzdGVyZWQuXG4gICAgICovXG4gICAgaGFzUmVwb3J0ZXI6IGZ1bmN0aW9uIChyZXBvcnRlcikge1xuICAgICAgICBpZiAodHlwZW9mIHJlcG9ydGVyICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBgcmVwb3J0ZXJgIHRvIGJlIGEgZnVuY3Rpb25cIilcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLl8ucm9vdC5yZXBvcnRlcklkcy5pbmRleE9mKHJlcG9ydGVyKSA+PSAwXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBhIHJlcG9ydGVyLlxuICAgICAqL1xuICAgIHJlcG9ydGVyOiBmdW5jdGlvbiAocmVwb3J0ZXIsIGFyZykge1xuICAgICAgICBpZiAodHlwZW9mIHJlcG9ydGVyICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBgcmVwb3J0ZXJgIHRvIGJlIGEgZnVuY3Rpb25cIilcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciByb290ID0gdGhpcy5fLnJvb3RcblxuICAgICAgICBpZiAocm9vdC5jdXJyZW50ICE9PSByb290KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJSZXBvcnRlcnMgbWF5IG9ubHkgYmUgYWRkZWQgdG8gdGhlIHJvb3RcIilcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChyb290LnJlcG9ydGVySWRzLmluZGV4T2YocmVwb3J0ZXIpIDwgMCkge1xuICAgICAgICAgICAgcm9vdC5yZXBvcnRlcklkcy5wdXNoKHJlcG9ydGVyKVxuICAgICAgICAgICAgcm9vdC5yZXBvcnRlcnMucHVzaChyZXBvcnRlcihhcmcpKVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBhIHJlcG9ydGVyLlxuICAgICAqL1xuICAgIHJlbW92ZVJlcG9ydGVyOiBmdW5jdGlvbiAocmVwb3J0ZXIpIHtcbiAgICAgICAgaWYgKHR5cGVvZiByZXBvcnRlciAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgYHJlcG9ydGVyYCB0byBiZSBhIGZ1bmN0aW9uXCIpXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcm9vdCA9IHRoaXMuXy5yb290XG5cbiAgICAgICAgaWYgKHJvb3QuY3VycmVudCAhPT0gcm9vdCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUmVwb3J0ZXJzIG1heSBvbmx5IGJlIGFkZGVkIHRvIHRoZSByb290XCIpXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgaW5kZXggPSByb290LnJlcG9ydGVySWRzLmluZGV4T2YocmVwb3J0ZXIpXG5cbiAgICAgICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgICAgICAgIHJvb3QucmVwb3J0ZXJJZHMuc3BsaWNlKGluZGV4LCAxKVxuICAgICAgICAgICAgcm9vdC5yZXBvcnRlcnMuc3BsaWNlKGluZGV4LCAxKVxuICAgICAgICB9XG4gICAgfSxcbn0pXG5cbmZ1bmN0aW9uIFJlZmxlY3RDaGlsZChyb290KSB7XG4gICAgdGhpcy5fID0gcm9vdFxufVxuXG5tZXRob2RzKFJlZmxlY3RDaGlsZCwgUmVmbGVjdCwge1xuICAgIC8qKlxuICAgICAqIEdldCB0aGUgdGVzdCBuYW1lLCBvciBgdW5kZWZpbmVkYCBpZiBpdCdzIHRoZSByb290IHRlc3QuXG4gICAgICovXG4gICAgZ2V0IG5hbWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl8ubmFtZVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIHRlc3QgaW5kZXgsIG9yIGAtMWAgaWYgaXQncyB0aGUgcm9vdCB0ZXN0LlxuICAgICAqL1xuICAgIGdldCBpbmRleCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuXy5pbmRleFxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIHBhcmVudCB0ZXN0IGFzIGEgUmVmbGVjdC5cbiAgICAgKi9cbiAgICBnZXQgcGFyZW50KCkge1xuICAgICAgICByZXR1cm4gbmV3IFJlZmxlY3QodGhpcy5fLnBhcmVudClcbiAgICB9LFxufSlcbiIsIlwidXNlIHN0cmljdFwiXG5cbnZhciBtZXRob2RzID0gcmVxdWlyZShcIi4uL21ldGhvZHNcIilcbnZhciBUZXN0cyA9IHJlcXVpcmUoXCIuLi9jb3JlL3Rlc3RzXCIpXG52YXIgb25seUFkZCA9IHJlcXVpcmUoXCIuLi9jb3JlL29ubHlcIikub25seUFkZFxudmFyIGFkZEhvb2sgPSByZXF1aXJlKFwiLi9ob29rc1wiKS5hZGRIb29rXG52YXIgUmVmbGVjdCA9IHJlcXVpcmUoXCIuL3JlZmxlY3RcIilcblxubW9kdWxlLmV4cG9ydHMgPSBUaGFsbGl1bVxuZnVuY3Rpb24gVGhhbGxpdW0oKSB7XG4gICAgdGhpcy5fID0gVGVzdHMuY3JlYXRlUm9vdCh0aGlzKVxuICAgIC8vIEVTNiBtb2R1bGUgdHJhbnNwaWxlciBjb21wYXRpYmlsaXR5LlxuICAgIHRoaXMuZGVmYXVsdCA9IHRoaXNcbn1cblxubWV0aG9kcyhUaGFsbGl1bSwge1xuICAgIC8qKlxuICAgICAqIENhbGwgYSBwbHVnaW4gYW5kIHJldHVybiB0aGUgcmVzdWx0LiBUaGUgcGx1Z2luIGlzIGNhbGxlZCB3aXRoIGEgUmVmbGVjdFxuICAgICAqIGluc3RhbmNlIGZvciBhY2Nlc3MgdG8gcGxlbnR5IG9mIHBvdGVudGlhbGx5IHVzZWZ1bCBpbnRlcm5hbCBkZXRhaWxzLlxuICAgICAqL1xuICAgIGNhbGw6IGZ1bmN0aW9uIChwbHVnaW4sIGFyZykge1xuICAgICAgICB2YXIgcmVmbGVjdCA9IG5ldyBSZWZsZWN0KHRoaXMuXy5yb290LmN1cnJlbnQpXG5cbiAgICAgICAgcmV0dXJuIHBsdWdpbi5jYWxsKHJlZmxlY3QsIHJlZmxlY3QsIGFyZylcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogV2hpdGVsaXN0IHNwZWNpZmljIHRlc3RzLCB1c2luZyBhcnJheS1iYXNlZCBzZWxlY3RvcnMgd2hlcmUgZWFjaCBlbnRyeVxuICAgICAqIGlzIGVpdGhlciBhIHN0cmluZyBvciByZWd1bGFyIGV4cHJlc3Npb24uXG4gICAgICovXG4gICAgb25seTogZnVuY3Rpb24gKC8qIC4uLnNlbGVjdG9ycyAqLykge1xuICAgICAgICBvbmx5QWRkLmFwcGx5KHRoaXMuXy5yb290LmN1cnJlbnQsIGFyZ3VtZW50cylcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGEgcmVwb3J0ZXIuXG4gICAgICovXG4gICAgcmVwb3J0ZXI6IGZ1bmN0aW9uIChyZXBvcnRlciwgYXJnKSB7XG4gICAgICAgIGlmICh0eXBlb2YgcmVwb3J0ZXIgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGByZXBvcnRlcmAgdG8gYmUgYSBmdW5jdGlvbi5cIilcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciByb290ID0gdGhpcy5fLnJvb3RcblxuICAgICAgICBpZiAocm9vdC5jdXJyZW50ICE9PSByb290KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJSZXBvcnRlcnMgbWF5IG9ubHkgYmUgYWRkZWQgdG8gdGhlIHJvb3QuXCIpXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcmVzdWx0ID0gcmVwb3J0ZXIoYXJnKVxuXG4gICAgICAgIC8vIERvbid0IGFzc3VtZSBpdCdzIGEgZnVuY3Rpb24uIFZlcmlmeSBpdCBhY3R1YWxseSBpcywgc28gd2UgZG9uJ3QgaGF2ZVxuICAgICAgICAvLyBpbmV4cGxpY2FibGUgdHlwZSBlcnJvcnMgaW50ZXJuYWxseSBhZnRlciBpdCdzIGludm9rZWQsIGFuZCBzbyB1c2Vyc1xuICAgICAgICAvLyB3b24ndCBnZXQgdG9vIGNvbmZ1c2VkLlxuICAgICAgICBpZiAodHlwZW9mIHJlc3VsdCAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICAgICAgICAgIFwiRXhwZWN0ZWQgYHJlcG9ydGVyYCB0byByZXR1cm4gYSBmdW5jdGlvbi4gQ2hlY2sgd2l0aCB0aGUgXCIgK1xuICAgICAgICAgICAgICAgIFwicmVwb3J0ZXIncyBhdXRob3IsIGFuZCBoYXZlIHRoZW0gZml4IHRoZWlyIHJlcG9ydGVyLlwiKVxuICAgICAgICB9XG5cbiAgICAgICAgcm9vdC5yZXBvcnRlciA9IHJlc3VsdFxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDaGVjayBpZiB0aGlzIGhhcyBhIHJlcG9ydGVyLlxuICAgICAqL1xuICAgIGdldCBoYXNSZXBvcnRlcigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuXy5yb290LnJlcG9ydGVyICE9IG51bGxcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBjdXJyZW50IHRpbWVvdXQuIDAgbWVhbnMgaW5oZXJpdCB0aGUgcGFyZW50J3MsIGFuZCBgSW5maW5pdHlgXG4gICAgICogbWVhbnMgaXQncyBkaXNhYmxlZC5cbiAgICAgKi9cbiAgICBnZXQgdGltZW91dCgpIHtcbiAgICAgICAgcmV0dXJuIFRlc3RzLnRpbWVvdXQodGhpcy5fLnJvb3QuY3VycmVudClcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IHRoZSB0aW1lb3V0IGluIG1pbGxpc2Vjb25kcywgcm91bmRpbmcgbmVnYXRpdmVzIHRvIDAuIFNldHRpbmcgdGhlXG4gICAgICogdGltZW91dCB0byAwIG1lYW5zIHRvIGluaGVyaXQgdGhlIHBhcmVudCB0aW1lb3V0LCBhbmQgc2V0dGluZyBpdCB0b1xuICAgICAqIGBJbmZpbml0eWAgZGlzYWJsZXMgaXQuXG4gICAgICovXG4gICAgc2V0IHRpbWVvdXQodGltZW91dCkge1xuICAgICAgICB2YXIgY2FsY3VsYXRlZCA9IE1hdGguZmxvb3IoTWF0aC5tYXgoK3RpbWVvdXQsIDApKVxuXG4gICAgICAgIGlmIChjYWxjdWxhdGVkID09PSAwKSBkZWxldGUgdGhpcy5fLnJvb3QuY3VycmVudC50aW1lb3V0XG4gICAgICAgIGVsc2UgdGhpcy5fLnJvb3QuY3VycmVudC50aW1lb3V0ID0gY2FsY3VsYXRlZFxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIGN1cnJlbnQgc2xvdyB0aHJlc2hvbGQuIDAgbWVhbnMgaW5oZXJpdCB0aGUgcGFyZW50J3MsIGFuZFxuICAgICAqIGBJbmZpbml0eWAgbWVhbnMgaXQncyBkaXNhYmxlZC5cbiAgICAgKi9cbiAgICBnZXQgc2xvdygpIHtcbiAgICAgICAgcmV0dXJuIFRlc3RzLnNsb3codGhpcy5fLnJvb3QuY3VycmVudClcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IHRoZSBzbG93IHRocmVzaG9sZCBpbiBtaWxsaXNlY29uZHMsIHJvdW5kaW5nIG5lZ2F0aXZlcyB0byAwLiBTZXR0aW5nXG4gICAgICogdGhlIHRpbWVvdXQgdG8gMCBtZWFucyB0byBpbmhlcml0IHRoZSBwYXJlbnQgdGhyZXNob2xkLCBhbmQgc2V0dGluZyBpdCB0b1xuICAgICAqIGBJbmZpbml0eWAgZGlzYWJsZXMgaXQuXG4gICAgICovXG4gICAgc2V0IHNsb3coc2xvdykge1xuICAgICAgICB2YXIgY2FsY3VsYXRlZCA9IE1hdGguZmxvb3IoTWF0aC5tYXgoK3Nsb3csIDApKVxuXG4gICAgICAgIGlmIChjYWxjdWxhdGVkID09PSAwKSBkZWxldGUgdGhpcy5fLnJvb3QuY3VycmVudC5zbG93XG4gICAgICAgIGVsc2UgdGhpcy5fLnJvb3QuY3VycmVudC5zbG93ID0gY2FsY3VsYXRlZFxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSdW4gdGhlIHRlc3RzIChvciB0aGUgdGVzdCdzIHRlc3RzIGlmIGl0J3Mgbm90IGEgYmFzZSBpbnN0YW5jZSkuXG4gICAgICovXG4gICAgcnVuOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLl8ucm9vdCAhPT0gdGhpcy5fKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICAgICAgXCJPbmx5IHRoZSByb290IHRlc3QgY2FuIGJlIHJ1biAtIElmIHlvdSBvbmx5IHdhbnQgdG8gcnVuIGEgXCIgK1xuICAgICAgICAgICAgICAgIFwic3VidGVzdCwgdXNlIGB0Lm9ubHkoW1xcXCJzZWxlY3RvcjFcXFwiLCAuLi5dKWAgaW5zdGVhZC5cIilcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLl8ubG9ja2VkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW4ndCBydW4gd2hpbGUgdGVzdHMgYXJlIGFscmVhZHkgcnVubmluZy5cIilcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBUZXN0cy5ydW5UZXN0KHRoaXMuXylcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGEgdGVzdC5cbiAgICAgKi9cbiAgICB0ZXN0OiBmdW5jdGlvbiAobmFtZSwgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBuYW1lICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgYG5hbWVgIHRvIGJlIGEgc3RyaW5nXCIpXG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBjYWxsYmFjayB0byBiZSBhIGZ1bmN0aW9uIGlmIHBhc3NlZFwiKVxuICAgICAgICB9XG5cbiAgICAgICAgVGVzdHMuYWRkTm9ybWFsKHRoaXMuXy5yb290LmN1cnJlbnQsIG5hbWUsIGNhbGxiYWNrKVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGQgYSBza2lwcGVkIHRlc3QuXG4gICAgICovXG4gICAgdGVzdFNraXA6IGZ1bmN0aW9uIChuYW1lLCBjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIG5hbWUgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBgbmFtZWAgdG8gYmUgYSBzdHJpbmdcIilcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIGJlIGEgZnVuY3Rpb24gaWYgcGFzc2VkXCIpXG4gICAgICAgIH1cblxuICAgICAgICBUZXN0cy5hZGRTa2lwcGVkKHRoaXMuXy5yb290LmN1cnJlbnQsIG5hbWUpXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENsZWFyIGFsbCBleGlzdGluZyB0ZXN0cy5cbiAgICAgKi9cbiAgICBjbGVhclRlc3RzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLl8ucm9vdCAhPT0gdGhpcy5fKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUZXN0cyBtYXkgb25seSBiZSBjbGVhcmVkIGF0IHRoZSByb290LlwiKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuXy5sb2NrZWQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbid0IGNsZWFyIHRlc3RzIHdoaWxlIHRoZXkgYXJlIHJ1bm5pbmcuXCIpXG4gICAgICAgIH1cblxuICAgICAgICBUZXN0cy5jbGVhclRlc3RzKHRoaXMuXylcbiAgICB9LFxuXG4gICAgYmVmb3JlOiBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgY2FsbGJhY2sgdG8gYmUgYSBmdW5jdGlvbiBpZiBwYXNzZWRcIilcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB0ZXN0ID0gdGhpcy5fLnJvb3QuY3VycmVudFxuXG4gICAgICAgIHRlc3QuYmVmb3JlRWFjaCA9IGFkZEhvb2sodGVzdC5iZWZvcmVFYWNoLCBjYWxsYmFjaylcbiAgICB9LFxuXG4gICAgYmVmb3JlQWxsOiBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgY2FsbGJhY2sgdG8gYmUgYSBmdW5jdGlvbiBpZiBwYXNzZWRcIilcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB0ZXN0ID0gdGhpcy5fLnJvb3QuY3VycmVudFxuXG4gICAgICAgIHRlc3QuYmVmb3JlQWxsID0gYWRkSG9vayh0ZXN0LmJlZm9yZUFsbCwgY2FsbGJhY2spXG4gICAgfSxcblxuICAgIGFmdGVyOiBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgY2FsbGJhY2sgdG8gYmUgYSBmdW5jdGlvbiBpZiBwYXNzZWRcIilcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB0ZXN0ID0gdGhpcy5fLnJvb3QuY3VycmVudFxuXG4gICAgICAgIHRlc3QuYWZ0ZXJFYWNoID0gYWRkSG9vayh0ZXN0LmFmdGVyRWFjaCwgY2FsbGJhY2spXG4gICAgfSxcblxuICAgIGFmdGVyQWxsOiBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgY2FsbGJhY2sgdG8gYmUgYSBmdW5jdGlvbiBpZiBwYXNzZWRcIilcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB0ZXN0ID0gdGhpcy5fLnJvb3QuY3VycmVudFxuXG4gICAgICAgIHRlc3QuYWZ0ZXJBbGwgPSBhZGRIb29rKHRlc3QuYWZ0ZXJBbGwsIGNhbGxiYWNrKVxuICAgIH0sXG59KVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxuLyoqXG4gKiBUaGlzIGlzIHRoZSBlbnRyeSBwb2ludCBmb3IgdGhlIEJyb3dzZXJpZnkgYnVuZGxlLiBOb3RlIHRoYXQgaXQgKmFsc28qIHdpbGxcbiAqIHJ1biBhcyBwYXJ0IG9mIHRoZSB0ZXN0cyBpbiBOb2RlICh1bmJ1bmRsZWQpLCBhbmQgaXQgdGhlb3JldGljYWxseSBjb3VsZCBiZVxuICogcnVuIGluIE5vZGUgb3IgYSBydW50aW1lIGxpbWl0ZWQgdG8gb25seSBFUzUgc3VwcG9ydCAoZS5nLiBSaGlubywgTmFzaG9ybiwgb3JcbiAqIGVtYmVkZGVkIFY4KSwgc28gZG8gKm5vdCogYXNzdW1lIGJyb3dzZXIgZ2xvYmFscyBhcmUgcHJlc2VudC5cbiAqL1xuXG5leHBvcnRzLnQgPSByZXF1aXJlKFwiLi4vaW5kZXhcIilcbmV4cG9ydHMuYXNzZXJ0ID0gcmVxdWlyZShcIi4uL2Fzc2VydFwiKVxuZXhwb3J0cy5yID0gcmVxdWlyZShcIi4uL3JcIilcbnZhciBkb20gPSByZXF1aXJlKFwiLi4vZG9tXCIpXG5cbmV4cG9ydHMuZG9tID0gZG9tLmNyZWF0ZVxuLy8gaWYgKGdsb2JhbC5kb2N1bWVudCAhPSBudWxsICYmIGdsb2JhbC5kb2N1bWVudC5jdXJyZW50U2NyaXB0ICE9IG51bGwpIHtcbi8vICAgICBkb20uYXV0b2xvYWQoZ2xvYmFsLmRvY3VtZW50LmN1cnJlbnRTY3JpcHQpXG4vLyB9XG5cbnZhciBJbnRlcm5hbCA9IHJlcXVpcmUoXCIuLi9pbnRlcm5hbFwiKVxuXG5leHBvcnRzLnJvb3QgPSBJbnRlcm5hbC5yb290XG5leHBvcnRzLnJlcG9ydHMgPSBJbnRlcm5hbC5yZXBvcnRzXG5leHBvcnRzLmhvb2tFcnJvcnMgPSBJbnRlcm5hbC5ob29rRXJyb3JzXG5leHBvcnRzLmxvY2F0aW9uID0gSW50ZXJuYWwubG9jYXRpb25cblxuLy8gSW4gY2FzZSB0aGUgdXNlciBuZWVkcyB0byBhZGp1c3QgdGhpcyAoZS5nLiBOYXNob3JuICsgY29uc29sZSBvdXRwdXQpLlxudmFyIFNldHRpbmdzID0gcmVxdWlyZShcIi4vc2V0dGluZ3NcIilcblxuZXhwb3J0cy5zZXR0aW5ncyA9IHtcbiAgICB3aW5kb3dXaWR0aDoge1xuICAgICAgICBnZXQ6IFNldHRpbmdzLndpbmRvd1dpZHRoLFxuICAgICAgICBzZXQ6IFNldHRpbmdzLnNldFdpbmRvd1dpZHRoLFxuICAgIH0sXG5cbiAgICBuZXdsaW5lOiB7XG4gICAgICAgIGdldDogU2V0dGluZ3MubmV3bGluZSxcbiAgICAgICAgc2V0OiBTZXR0aW5ncy5zZXROZXdsaW5lLFxuICAgIH0sXG5cbiAgICBzeW1ib2xzOiB7XG4gICAgICAgIGdldDogU2V0dGluZ3Muc3ltYm9scyxcbiAgICAgICAgc2V0OiBTZXR0aW5ncy5zZXRTeW1ib2xzLFxuICAgIH0sXG5cbiAgICBkZWZhdWx0T3B0czoge1xuICAgICAgICBnZXQ6IFNldHRpbmdzLmRlZmF1bHRPcHRzLFxuICAgICAgICBzZXQ6IFNldHRpbmdzLnNldERlZmF1bHRPcHRzLFxuICAgIH0sXG5cbiAgICBjb2xvclN1cHBvcnQ6IHtcbiAgICAgICAgZ2V0OiBTZXR0aW5ncy5Db2xvcnMuZ2V0U3VwcG9ydCxcbiAgICAgICAgc2V0OiBTZXR0aW5ncy5Db2xvcnMuc2V0U3VwcG9ydCxcbiAgICB9LFxufVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxuLyoqXG4gKiBUaGUgd2hpdGVsaXN0IGlzIGFjdHVhbGx5IHN0b3JlZCBhcyBhIHRyZWUgZm9yIGZhc3RlciBsb29rdXAgdGltZXMgd2hlbiB0aGVyZVxuICogYXJlIG11bHRpcGxlIHNlbGVjdG9ycy4gT2JqZWN0cyBjYW4ndCBiZSB1c2VkIGZvciB0aGUgbm9kZXMsIHdoZXJlIGtleXNcbiAqIHJlcHJlc2VudCB2YWx1ZXMgYW5kIHZhbHVlcyByZXByZXNlbnQgY2hpbGRyZW4sIGJlY2F1c2UgcmVndWxhciBleHByZXNzaW9uc1xuICogYXJlbid0IHBvc3NpYmxlIHRvIHVzZS5cbiAqL1xuXG5mdW5jdGlvbiBpc0VxdWl2YWxlbnQoZW50cnksIGl0ZW0pIHtcbiAgICBpZiAodHlwZW9mIGVudHJ5ID09PSBcInN0cmluZ1wiICYmIHR5cGVvZiBpdGVtID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIHJldHVybiBlbnRyeSA9PT0gaXRlbVxuICAgIH0gZWxzZSBpZiAoZW50cnkgaW5zdGFuY2VvZiBSZWdFeHAgJiYgaXRlbSBpbnN0YW5jZW9mIFJlZ0V4cCkge1xuICAgICAgICByZXR1cm4gZW50cnkudG9TdHJpbmcoKSA9PT0gaXRlbS50b1N0cmluZygpXG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxufVxuXG5mdW5jdGlvbiBtYXRjaGVzKGVudHJ5LCBpdGVtKSB7XG4gICAgaWYgKHR5cGVvZiBlbnRyeSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICByZXR1cm4gZW50cnkgPT09IGl0ZW1cbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZW50cnkudGVzdChpdGVtKVxuICAgIH1cbn1cblxuZnVuY3Rpb24gT25seSh2YWx1ZSkge1xuICAgIHRoaXMudmFsdWUgPSB2YWx1ZVxuICAgIHRoaXMuY2hpbGRyZW4gPSB1bmRlZmluZWRcbn1cblxuZnVuY3Rpb24gZmluZEVxdWl2YWxlbnQobm9kZSwgZW50cnkpIHtcbiAgICBpZiAobm9kZS5jaGlsZHJlbiA9PSBudWxsKSByZXR1cm4gdW5kZWZpbmVkXG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5vZGUuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGNoaWxkID0gbm9kZS5jaGlsZHJlbltpXVxuXG4gICAgICAgIGlmIChpc0VxdWl2YWxlbnQoY2hpbGQudmFsdWUsIGVudHJ5KSkgcmV0dXJuIGNoaWxkXG4gICAgfVxuXG4gICAgcmV0dXJuIHVuZGVmaW5lZFxufVxuXG5mdW5jdGlvbiBmaW5kTWF0Y2hlcyhub2RlLCBlbnRyeSkge1xuICAgIGlmIChub2RlLmNoaWxkcmVuID09IG51bGwpIHJldHVybiB1bmRlZmluZWRcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbm9kZS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgY2hpbGQgPSBub2RlLmNoaWxkcmVuW2ldXG5cbiAgICAgICAgaWYgKG1hdGNoZXMoY2hpbGQudmFsdWUsIGVudHJ5KSkgcmV0dXJuIGNoaWxkXG4gICAgfVxuXG4gICAgcmV0dXJuIHVuZGVmaW5lZFxufVxuXG4vKipcbiAqIEFkZCBhIG51bWJlciBvZiBzZWxlY3RvcnNcbiAqXG4gKiBAdGhpcyB7VGVzdH1cbiAqL1xuZXhwb3J0cy5vbmx5QWRkID0gZnVuY3Rpb24gKC8qIC4uLnNlbGVjdG9ycyAqLykge1xuICAgIHRoaXMub25seSA9IG5ldyBPbmx5KClcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBzZWxlY3RvciA9IGFyZ3VtZW50c1tpXVxuXG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheShzZWxlY3RvcikpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgICAgICAgICAgXCJFeHBlY3RlZCBzZWxlY3RvciBcIiArIGkgKyBcIiB0byBiZSBhbiBhcnJheVwiKVxuICAgICAgICB9XG5cbiAgICAgICAgb25seUFkZFNpbmdsZSh0aGlzLm9ubHksIHNlbGVjdG9yLCBpKVxuICAgIH1cbn1cblxuZnVuY3Rpb24gb25seUFkZFNpbmdsZShub2RlLCBzZWxlY3RvciwgaW5kZXgpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNlbGVjdG9yLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBlbnRyeSA9IHNlbGVjdG9yW2ldXG5cbiAgICAgICAgLy8gU3RyaW5ncyBhbmQgcmVndWxhciBleHByZXNzaW9ucyBhcmUgdGhlIG9ubHkgdGhpbmdzIGFsbG93ZWQuXG4gICAgICAgIGlmICh0eXBlb2YgZW50cnkgIT09IFwic3RyaW5nXCIgJiYgIShlbnRyeSBpbnN0YW5jZW9mIFJlZ0V4cCkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgICAgICAgICAgXCJTZWxlY3RvciBcIiArIGluZGV4ICsgXCIgbXVzdCBjb25zaXN0IG9mIG9ubHkgc3RyaW5ncyBhbmQvb3IgXCIgK1xuICAgICAgICAgICAgICAgIFwicmVndWxhciBleHByZXNzaW9uc1wiKVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGNoaWxkID0gZmluZEVxdWl2YWxlbnQobm9kZSwgZW50cnkpXG5cbiAgICAgICAgaWYgKGNoaWxkID09IG51bGwpIHtcbiAgICAgICAgICAgIGNoaWxkID0gbmV3IE9ubHkoZW50cnkpXG4gICAgICAgICAgICBpZiAobm9kZS5jaGlsZHJlbiA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgbm9kZS5jaGlsZHJlbiA9IFtjaGlsZF1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbm9kZS5jaGlsZHJlbi5wdXNoKGNoaWxkKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgbm9kZSA9IGNoaWxkXG4gICAgfVxufVxuXG4vKipcbiAqIFRoaXMgY2hlY2tzIGlmIHRoZSB0ZXN0IHdhcyB3aGl0ZWxpc3RlZCBpbiBhIGB0Lm9ubHkoKWAgY2FsbCwgb3IgZm9yXG4gKiBjb252ZW5pZW5jZSwgcmV0dXJucyBgdHJ1ZWAgaWYgYHQub25seSgpYCB3YXMgbmV2ZXIgY2FsbGVkLlxuICovXG5leHBvcnRzLmlzT25seSA9IGZ1bmN0aW9uICh0ZXN0KSB7XG4gICAgdmFyIHBhdGggPSBbXVxuICAgIHZhciBpID0gMFxuXG4gICAgd2hpbGUgKHRlc3Qucm9vdCAhPT0gdGVzdCAmJiB0ZXN0Lm9ubHkgPT0gbnVsbCkge1xuICAgICAgICBwYXRoLnB1c2godGVzdC5uYW1lKVxuICAgICAgICB0ZXN0ID0gdGVzdC5wYXJlbnRcbiAgICAgICAgaSsrXG4gICAgfVxuXG4gICAgLy8gSWYgdGhlcmUgaXNuJ3QgYW55IGBvbmx5YCBhY3RpdmUsIHRoZW4gbGV0J3Mgc2tpcCB0aGUgY2hlY2sgYW5kIHJldHVyblxuICAgIC8vIGB0cnVlYCBmb3IgY29udmVuaWVuY2UuXG4gICAgdmFyIG9ubHkgPSB0ZXN0Lm9ubHlcblxuICAgIGlmIChvbmx5ICE9IG51bGwpIHtcbiAgICAgICAgd2hpbGUgKGkgIT09IDApIHtcbiAgICAgICAgICAgIG9ubHkgPSBmaW5kTWF0Y2hlcyhvbmx5LCBwYXRoWy0taV0pXG4gICAgICAgICAgICBpZiAob25seSA9PSBudWxsKSByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0cnVlXG59XG4iLCJcInVzZSBzdHJpY3RcIlxuXG52YXIgbWV0aG9kcyA9IHJlcXVpcmUoXCIuLi9tZXRob2RzXCIpXG5cbi8qKlxuICogQWxsIHRoZSByZXBvcnQgdHlwZXMuIFRoZSBvbmx5IHJlYXNvbiB0aGVyZSBhcmUgbW9yZSB0aGFuIHR3byB0eXBlcyAobm9ybWFsXG4gKiBhbmQgaG9vaykgaXMgZm9yIHRoZSB1c2VyJ3MgYmVuZWZpdCAoZGV2IHRvb2xzLCBgdXRpbC5pbnNwZWN0YCwgZXRjLilcbiAqL1xuXG52YXIgVHlwZXMgPSBleHBvcnRzLlR5cGVzID0gT2JqZWN0LmZyZWV6ZSh7XG4gICAgU3RhcnQ6IDAsXG4gICAgRW50ZXI6IDEsXG4gICAgTGVhdmU6IDIsXG4gICAgUGFzczogMyxcbiAgICBGYWlsOiA0LFxuICAgIFNraXA6IDUsXG4gICAgRW5kOiA2LFxuICAgIEVycm9yOiA3LFxuXG4gICAgLy8gTm90ZSB0aGF0IGBIb29rYCBpcyBkZW5vdGVkIGJ5IHRoZSA0dGggYml0IHNldCwgdG8gc2F2ZSBzb21lIHNwYWNlIChhbmRcbiAgICAvLyB0byBzaW1wbGlmeSB0aGUgdHlwZSByZXByZXNlbnRhdGlvbikuXG4gICAgSG9vazogOCxcbiAgICBCZWZvcmVBbGw6IDggfCAwLFxuICAgIEJlZm9yZUVhY2g6IDggfCAxLFxuICAgIEFmdGVyRWFjaDogOCB8IDIsXG4gICAgQWZ0ZXJBbGw6IDggfCAzLFxufSlcblxuZXhwb3J0cy5SZXBvcnQgPSBSZXBvcnRcbmZ1bmN0aW9uIFJlcG9ydCh0eXBlKSB7XG4gICAgdGhpcy5fID0gdHlwZVxufVxuXG4vLyBBdm9pZCBhIHJlY3Vyc2l2ZSBjYWxsIHdoZW4gYGluc3BlY3RgaW5nIGEgcmVzdWx0IHdoaWxlIHN0aWxsIGtlZXBpbmcgaXRcbi8vIHN0eWxlZCBsaWtlIGl0IHdvdWxkIGJlIG5vcm1hbGx5LiBFYWNoIHR5cGUgdXNlcyBhIG5hbWVkIHNpbmdsZXRvbiBmYWN0b3J5IHRvXG4vLyBlbnN1cmUgZW5naW5lcyBzaG93IHRoZSBjb3JyZWN0IGBuYW1lYC9gZGlzcGxheU5hbWVgIGZvciB0aGUgdHlwZS5cbmZ1bmN0aW9uIGluaXRJbnNwZWN0KGluc3BlY3QsIHJlcG9ydCkge1xuICAgIHZhciB0eXBlID0gcmVwb3J0Ll9cblxuICAgIGlmICh0eXBlICYgVHlwZXMuSG9vaykge1xuICAgICAgICBpbnNwZWN0LnN0YWdlID0gcmVwb3J0LnN0YWdlXG4gICAgfVxuXG4gICAgaWYgKHR5cGUgIT09IFR5cGVzLlN0YXJ0ICYmXG4gICAgICAgICAgICB0eXBlICE9PSBUeXBlcy5FbmQgJiZcbiAgICAgICAgICAgIHR5cGUgIT09IFR5cGVzLkVycm9yKSB7XG4gICAgICAgIGluc3BlY3QucGF0aCA9IHJlcG9ydC5wYXRoXG4gICAgfVxuXG4gICAgaWYgKHR5cGUgJiBUeXBlcy5Ib29rKSB7XG4gICAgICAgIGluc3BlY3Qucm9vdFBhdGggPSByZXBvcnQucm9vdFBhdGhcbiAgICB9XG5cbiAgICAvLyBPbmx5IGFkZCB0aGUgcmVsZXZhbnQgcHJvcGVydGllc1xuICAgIGlmICh0eXBlID09PSBUeXBlcy5GYWlsIHx8XG4gICAgICAgICAgICB0eXBlID09PSBUeXBlcy5FcnJvciB8fFxuICAgICAgICAgICAgdHlwZSAmIFR5cGVzLkhvb2spIHtcbiAgICAgICAgaW5zcGVjdC52YWx1ZSA9IHJlcG9ydC52YWx1ZVxuICAgIH1cblxuICAgIGlmICh0eXBlID09PSBUeXBlcy5FbnRlciB8fFxuICAgICAgICAgICAgdHlwZSA9PT0gVHlwZXMuUGFzcyB8fFxuICAgICAgICAgICAgdHlwZSA9PT0gVHlwZXMuRmFpbCkge1xuICAgICAgICBpbnNwZWN0LmR1cmF0aW9uID0gcmVwb3J0LmR1cmF0aW9uXG4gICAgICAgIGluc3BlY3Quc2xvdyA9IHJlcG9ydC5zbG93XG4gICAgfVxufVxuXG5tZXRob2RzKFJlcG9ydCwge1xuICAgIC8vIFRoZSByZXBvcnQgdHlwZXNcbiAgICBnZXQgaXNTdGFydCgpIHsgcmV0dXJuIHRoaXMuXyA9PT0gVHlwZXMuU3RhcnQgfSxcbiAgICBnZXQgaXNFbnRlcigpIHsgcmV0dXJuIHRoaXMuXyA9PT0gVHlwZXMuRW50ZXIgfSxcbiAgICBnZXQgaXNMZWF2ZSgpIHsgcmV0dXJuIHRoaXMuXyA9PT0gVHlwZXMuTGVhdmUgfSxcbiAgICBnZXQgaXNQYXNzKCkgeyByZXR1cm4gdGhpcy5fID09PSBUeXBlcy5QYXNzIH0sXG4gICAgZ2V0IGlzRmFpbCgpIHsgcmV0dXJuIHRoaXMuXyA9PT0gVHlwZXMuRmFpbCB9LFxuICAgIGdldCBpc1NraXAoKSB7IHJldHVybiB0aGlzLl8gPT09IFR5cGVzLlNraXAgfSxcbiAgICBnZXQgaXNFbmQoKSB7IHJldHVybiB0aGlzLl8gPT09IFR5cGVzLkVuZCB9LFxuICAgIGdldCBpc0Vycm9yKCkgeyByZXR1cm4gdGhpcy5fID09PSBUeXBlcy5FcnJvciB9LFxuICAgIGdldCBpc0hvb2soKSB7IHJldHVybiAodGhpcy5fICYgVHlwZXMuSG9vaykgIT09IDAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBhIHN0cmluZ2lmaWVkIGRlc2NyaXB0aW9uIG9mIHRoZSB0eXBlLlxuICAgICAqL1xuICAgIGdldCB0eXBlKCkge1xuICAgICAgICBzd2l0Y2ggKHRoaXMuXykge1xuICAgICAgICBjYXNlIFR5cGVzLlN0YXJ0OiByZXR1cm4gXCJzdGFydFwiXG4gICAgICAgIGNhc2UgVHlwZXMuRW50ZXI6IHJldHVybiBcImVudGVyXCJcbiAgICAgICAgY2FzZSBUeXBlcy5MZWF2ZTogcmV0dXJuIFwibGVhdmVcIlxuICAgICAgICBjYXNlIFR5cGVzLlBhc3M6IHJldHVybiBcInBhc3NcIlxuICAgICAgICBjYXNlIFR5cGVzLkZhaWw6IHJldHVybiBcImZhaWxcIlxuICAgICAgICBjYXNlIFR5cGVzLlNraXA6IHJldHVybiBcInNraXBcIlxuICAgICAgICBjYXNlIFR5cGVzLkVuZDogcmV0dXJuIFwiZW5kXCJcbiAgICAgICAgY2FzZSBUeXBlcy5FcnJvcjogcmV0dXJuIFwiZXJyb3JcIlxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgaWYgKHRoaXMuXyAmIFR5cGVzLkhvb2spIHJldHVybiBcImhvb2tcIlxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwidW5yZWFjaGFibGVcIilcbiAgICAgICAgfVxuICAgIH0sXG59KVxuXG5leHBvcnRzLlN0YXJ0ID0gU3RhcnRSZXBvcnRcbmZ1bmN0aW9uIFN0YXJ0UmVwb3J0KCkge1xuICAgIFJlcG9ydC5jYWxsKHRoaXMsIFR5cGVzLlN0YXJ0KVxufVxubWV0aG9kcyhTdGFydFJlcG9ydCwgUmVwb3J0LCB7XG4gICAgaW5zcGVjdDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IGZ1bmN0aW9uIFJlcG9ydChyZXBvcnQpIHtcbiAgICAgICAgICAgIGluaXRJbnNwZWN0KHRoaXMsIHJlcG9ydClcbiAgICAgICAgfSh0aGlzKVxuICAgIH0sXG59KVxuXG5leHBvcnRzLkVudGVyID0gRW50ZXJSZXBvcnRcbmZ1bmN0aW9uIEVudGVyUmVwb3J0KHBhdGgsIGR1cmF0aW9uLCBzbG93KSB7XG4gICAgUmVwb3J0LmNhbGwodGhpcywgVHlwZXMuRW50ZXIpXG4gICAgdGhpcy5wYXRoID0gcGF0aFxuICAgIHRoaXMuZHVyYXRpb24gPSBkdXJhdGlvblxuICAgIHRoaXMuc2xvdyA9IHNsb3dcbn1cbm1ldGhvZHMoRW50ZXJSZXBvcnQsIFJlcG9ydCwge1xuICAgIC8qKlxuICAgICAqIFNvIHV0aWwuaW5zcGVjdCBwcm92aWRlcyBtb3JlIHNlbnNpYmxlIG91dHB1dCBmb3IgdGVzdGluZy9ldGMuXG4gICAgICovXG4gICAgaW5zcGVjdDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IGZ1bmN0aW9uIEVudGVyUmVwb3J0KHJlcG9ydCkge1xuICAgICAgICAgICAgaW5pdEluc3BlY3QodGhpcywgcmVwb3J0KVxuICAgICAgICB9KHRoaXMpXG4gICAgfSxcbn0pXG5cbmV4cG9ydHMuTGVhdmUgPSBMZWF2ZVJlcG9ydFxuZnVuY3Rpb24gTGVhdmVSZXBvcnQocGF0aCkge1xuICAgIFJlcG9ydC5jYWxsKHRoaXMsIFR5cGVzLkxlYXZlKVxuICAgIHRoaXMucGF0aCA9IHBhdGhcbn1cbm1ldGhvZHMoTGVhdmVSZXBvcnQsIFJlcG9ydCwge1xuICAgIC8qKlxuICAgICAqIFNvIHV0aWwuaW5zcGVjdCBwcm92aWRlcyBtb3JlIHNlbnNpYmxlIG91dHB1dCBmb3IgdGVzdGluZy9ldGMuXG4gICAgICovXG4gICAgaW5zcGVjdDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IGZ1bmN0aW9uIExlYXZlUmVwb3J0KHJlcG9ydCkge1xuICAgICAgICAgICAgaW5pdEluc3BlY3QodGhpcywgcmVwb3J0KVxuICAgICAgICB9KHRoaXMpXG4gICAgfSxcbn0pXG5cbmV4cG9ydHMuUGFzcyA9IFBhc3NSZXBvcnRcbmZ1bmN0aW9uIFBhc3NSZXBvcnQocGF0aCwgZHVyYXRpb24sIHNsb3cpIHtcbiAgICBSZXBvcnQuY2FsbCh0aGlzLCBUeXBlcy5QYXNzKVxuICAgIHRoaXMucGF0aCA9IHBhdGhcbiAgICB0aGlzLmR1cmF0aW9uID0gZHVyYXRpb25cbiAgICB0aGlzLnNsb3cgPSBzbG93XG59XG5tZXRob2RzKFBhc3NSZXBvcnQsIFJlcG9ydCwge1xuICAgIC8qKlxuICAgICAqIFNvIHV0aWwuaW5zcGVjdCBwcm92aWRlcyBtb3JlIHNlbnNpYmxlIG91dHB1dCBmb3IgdGVzdGluZy9ldGMuXG4gICAgICovXG4gICAgaW5zcGVjdDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IGZ1bmN0aW9uIFBhc3NSZXBvcnQocmVwb3J0KSB7XG4gICAgICAgICAgICBpbml0SW5zcGVjdCh0aGlzLCByZXBvcnQpXG4gICAgICAgIH0odGhpcylcbiAgICB9LFxufSlcblxuZXhwb3J0cy5GYWlsID0gRmFpbFJlcG9ydFxuZnVuY3Rpb24gRmFpbFJlcG9ydChwYXRoLCBlcnJvciwgZHVyYXRpb24sIHNsb3cpIHtcbiAgICBSZXBvcnQuY2FsbCh0aGlzLCBUeXBlcy5GYWlsKVxuICAgIHRoaXMucGF0aCA9IHBhdGhcbiAgICB0aGlzLmVycm9yID0gZXJyb3JcbiAgICB0aGlzLmR1cmF0aW9uID0gZHVyYXRpb25cbiAgICB0aGlzLnNsb3cgPSBzbG93XG59XG5tZXRob2RzKEZhaWxSZXBvcnQsIFJlcG9ydCwge1xuICAgIC8qKlxuICAgICAqIFNvIHV0aWwuaW5zcGVjdCBwcm92aWRlcyBtb3JlIHNlbnNpYmxlIG91dHB1dCBmb3IgdGVzdGluZy9ldGMuXG4gICAgICovXG4gICAgaW5zcGVjdDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IGZ1bmN0aW9uIEZhaWxSZXBvcnQocmVwb3J0KSB7XG4gICAgICAgICAgICBpbml0SW5zcGVjdCh0aGlzLCByZXBvcnQpXG4gICAgICAgIH0odGhpcylcbiAgICB9LFxufSlcblxuZXhwb3J0cy5Ta2lwID0gU2tpcFJlcG9ydFxuZnVuY3Rpb24gU2tpcFJlcG9ydChwYXRoKSB7XG4gICAgUmVwb3J0LmNhbGwodGhpcywgVHlwZXMuU2tpcClcbiAgICB0aGlzLnBhdGggPSBwYXRoXG59XG5tZXRob2RzKFNraXBSZXBvcnQsIFJlcG9ydCwge1xuICAgIC8qKlxuICAgICAqIFNvIHV0aWwuaW5zcGVjdCBwcm92aWRlcyBtb3JlIHNlbnNpYmxlIG91dHB1dCBmb3IgdGVzdGluZy9ldGMuXG4gICAgICovXG4gICAgaW5zcGVjdDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IGZ1bmN0aW9uIFNraXBSZXBvcnQocmVwb3J0KSB7XG4gICAgICAgICAgICBpbml0SW5zcGVjdCh0aGlzLCByZXBvcnQpXG4gICAgICAgIH0odGhpcylcbiAgICB9LFxufSlcblxuZXhwb3J0cy5FbmQgPSBFbmRSZXBvcnRcbmZ1bmN0aW9uIEVuZFJlcG9ydCgpIHtcbiAgICBSZXBvcnQuY2FsbCh0aGlzLCBUeXBlcy5FbmQpXG59XG5tZXRob2RzKEVuZFJlcG9ydCwgUmVwb3J0LCB7XG4gICAgLyoqXG4gICAgICogU28gdXRpbC5pbnNwZWN0IHByb3ZpZGVzIG1vcmUgc2Vuc2libGUgb3V0cHV0IGZvciB0ZXN0aW5nL2V0Yy5cbiAgICAgKi9cbiAgICBpbnNwZWN0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgZnVuY3Rpb24gRW5kUmVwb3J0KHJlcG9ydCkge1xuICAgICAgICAgICAgaW5pdEluc3BlY3QodGhpcywgcmVwb3J0KVxuICAgICAgICB9KHRoaXMpXG4gICAgfSxcbn0pXG5cbmV4cG9ydHMuRXJyb3IgPSBFcnJvclJlcG9ydFxuZnVuY3Rpb24gRXJyb3JSZXBvcnQoZXJyb3IpIHtcbiAgICBSZXBvcnQuY2FsbCh0aGlzLCBUeXBlcy5FcnJvcilcbiAgICB0aGlzLmVycm9yID0gZXJyb3Jcbn1cbm1ldGhvZHMoRXJyb3JSZXBvcnQsIFJlcG9ydCwge1xuICAgIC8qKlxuICAgICAqIFNvIHV0aWwuaW5zcGVjdCBwcm92aWRlcyBtb3JlIHNlbnNpYmxlIG91dHB1dCBmb3IgdGVzdGluZy9ldGMuXG4gICAgICovXG4gICAgaW5zcGVjdDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IGZ1bmN0aW9uIEVycm9yUmVwb3J0KHJlcG9ydCkge1xuICAgICAgICAgICAgaW5pdEluc3BlY3QodGhpcywgcmVwb3J0KVxuICAgICAgICB9KHRoaXMpXG4gICAgfSxcbn0pXG5cbnZhciBIb29rTWV0aG9kcyA9IHtcbiAgICBnZXQgc3RhZ2UoKSB7XG4gICAgICAgIHN3aXRjaCAodGhpcy5fKSB7XG4gICAgICAgIGNhc2UgVHlwZXMuQmVmb3JlQWxsOiByZXR1cm4gXCJiZWZvcmUgYWxsXCJcbiAgICAgICAgY2FzZSBUeXBlcy5CZWZvcmVFYWNoOiByZXR1cm4gXCJiZWZvcmUgZWFjaFwiXG4gICAgICAgIGNhc2UgVHlwZXMuQWZ0ZXJFYWNoOiByZXR1cm4gXCJhZnRlciBlYWNoXCJcbiAgICAgICAgY2FzZSBUeXBlcy5BZnRlckFsbDogcmV0dXJuIFwiYWZ0ZXIgYWxsXCJcbiAgICAgICAgZGVmYXVsdDogdGhyb3cgbmV3IEVycm9yKFwidW5yZWFjaGFibGVcIilcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBnZXQgaXNCZWZvcmVBbGwoKSB7IHJldHVybiB0aGlzLl8gPT09IFR5cGVzLkJlZm9yZUFsbCB9LFxuICAgIGdldCBpc0JlZm9yZUVhY2goKSB7IHJldHVybiB0aGlzLl8gPT09IFR5cGVzLkJlZm9yZUVhY2ggfSxcbiAgICBnZXQgaXNBZnRlckVhY2goKSB7IHJldHVybiB0aGlzLl8gPT09IFR5cGVzLkFmdGVyRWFjaCB9LFxuICAgIGdldCBpc0FmdGVyQWxsKCkgeyByZXR1cm4gdGhpcy5fID09PSBUeXBlcy5BZnRlckFsbCB9LFxufVxuXG5leHBvcnRzLkhvb2tFcnJvciA9IEhvb2tFcnJvclxuZnVuY3Rpb24gSG9va0Vycm9yKHN0YWdlLCBmdW5jLCBlcnJvcikge1xuICAgIHRoaXMuXyA9IHN0YWdlXG4gICAgdGhpcy5uYW1lID0gZnVuYy5uYW1lIHx8IGZ1bmMuZGlzcGxheU5hbWUgfHwgXCJcIlxuICAgIHRoaXMuZXJyb3IgPSBlcnJvclxufVxubWV0aG9kcyhIb29rRXJyb3IsIEhvb2tNZXRob2RzKVxuXG5leHBvcnRzLkhvb2sgPSBIb29rUmVwb3J0XG5mdW5jdGlvbiBIb29rUmVwb3J0KHBhdGgsIHJvb3RQYXRoLCBob29rRXJyb3IpIHtcbiAgICBSZXBvcnQuY2FsbCh0aGlzLCBob29rRXJyb3IuXylcbiAgICB0aGlzLnBhdGggPSBwYXRoXG4gICAgdGhpcy5yb290UGF0aCA9IHJvb3RQYXRoXG4gICAgdGhpcy5uYW1lID0gaG9va0Vycm9yLm5hbWVcbiAgICB0aGlzLmVycm9yID0gaG9va0Vycm9yLmVycm9yXG59XG5tZXRob2RzKEhvb2tSZXBvcnQsIFJlcG9ydCwgSG9va01ldGhvZHMsIHtcbiAgICBnZXQgaG9va0Vycm9yKCkgeyByZXR1cm4gbmV3IEhvb2tFcnJvcih0aGlzLl8sIHRoaXMsIHRoaXMuZXJyb3IpIH0sXG59KVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxudmFyIG1ldGhvZHMgPSByZXF1aXJlKFwiLi4vbWV0aG9kc1wiKVxudmFyIHBlYWNoID0gcmVxdWlyZShcIi4uL3V0aWxcIikucGVhY2hcbnZhciBSZXBvcnRzID0gcmVxdWlyZShcIi4vcmVwb3J0c1wiKVxudmFyIGlzT25seSA9IHJlcXVpcmUoXCIuL29ubHlcIikuaXNPbmx5XG52YXIgVHlwZXMgPSBSZXBvcnRzLlR5cGVzXG5cbi8qKlxuICogVGhlIHRlc3RzIGFyZSBsYWlkIG91dCBpbiBhIHZlcnkgZGF0YS1kcml2ZW4gZGVzaWduLiBXaXRoIGV4Y2VwdGlvbiBvZiB0aGVcbiAqIHJlcG9ydHMsIHRoZXJlIGlzIG1pbmltYWwgb2JqZWN0IG9yaWVudGF0aW9uIGFuZCB6ZXJvIHZpcnR1YWwgZGlzcGF0Y2guXG4gKiBIZXJlJ3MgYSBxdWljayBvdmVydmlldzpcbiAqXG4gKiAtIFRoZSB0ZXN0IGhhbmRsaW5nIGRpc3BhdGNoZXMgYmFzZWQgb24gdmFyaW91cyBhdHRyaWJ1dGVzIHRoZSB0ZXN0IGhhcy4gRm9yXG4gKiAgIGV4YW1wbGUsIHJvb3RzIGFyZSBrbm93biBieSBhIGNpcmN1bGFyIHJvb3QgcmVmZXJlbmNlLCBhbmQgc2tpcHBlZCB0ZXN0c1xuICogICBhcmUga25vd24gYnkgbm90IGhhdmluZyBhIGNhbGxiYWNrLlxuICpcbiAqIC0gVGhlIHRlc3QgZXZhbHVhdGlvbiBpcyB2ZXJ5IHByb2NlZHVyYWwuIEFsdGhvdWdoIGl0J3MgdmVyeSBoaWdobHlcbiAqICAgYXN5bmNocm9ub3VzLCB0aGUgdXNlIG9mIHByb21pc2VzIGxpbmVhcml6ZSB0aGUgbG9naWMsIHNvIGl0IHJlYWRzIHZlcnlcbiAqICAgbXVjaCBsaWtlIGEgcmVjdXJzaXZlIHNldCBvZiBzdGVwcy5cbiAqXG4gKiAtIFRoZSBkYXRhIHR5cGVzIGFyZSBtb3N0bHkgZWl0aGVyIHBsYWluIG9iamVjdHMgb3IgY2xhc3NlcyB3aXRoIG5vIG1ldGhvZHMsXG4gKiAgIHRoZSBsYXR0ZXIgbW9zdGx5IGZvciBkZWJ1Z2dpbmcgaGVscC4gVGhpcyBhbHNvIGF2b2lkcyBtb3N0IG9mIHRoZVxuICogICBpbmRpcmVjdGlvbiByZXF1aXJlZCB0byBhY2NvbW1vZGF0ZSBicmVha2luZyBhYnN0cmFjdGlvbnMsIHdoaWNoIHRoZSBBUElcbiAqICAgbWV0aG9kcyBmcmVxdWVudGx5IG5lZWQgdG8gZG8uXG4gKi9cblxuLy8gUHJldmVudCBTaW5vbiBpbnRlcmZlcmVuY2Ugd2hlbiB0aGV5IGluc3RhbGwgdGhlaXIgbW9ja3NcbnZhciBzZXRUaW1lb3V0ID0gZ2xvYmFsLnNldFRpbWVvdXRcbnZhciBjbGVhclRpbWVvdXQgPSBnbG9iYWwuY2xlYXJUaW1lb3V0XG52YXIgbm93ID0gZ2xvYmFsLkRhdGUubm93XG5cbi8qKlxuICogQmFzaWMgZGF0YSB0eXBlc1xuICovXG5mdW5jdGlvbiBSZXN1bHQodGltZSwgYXR0ZW1wdCkge1xuICAgIHRoaXMudGltZSA9IHRpbWVcbiAgICB0aGlzLmNhdWdodCA9IGF0dGVtcHQuY2F1Z2h0XG4gICAgdGhpcy52YWx1ZSA9IGF0dGVtcHQuY2F1Z2h0ID8gYXR0ZW1wdC52YWx1ZSA6IHVuZGVmaW5lZFxufVxuXG4vKipcbiAqIE92ZXJ2aWV3IG9mIHRoZSB0ZXN0IHByb3BlcnRpZXM6XG4gKlxuICogLSBgbWV0aG9kc2AgLSBBIGRlcHJlY2F0ZWQgcmVmZXJlbmNlIHRvIHRoZSBBUEkgbWV0aG9kc1xuICogLSBgcm9vdGAgLSBUaGUgcm9vdCB0ZXN0XG4gKiAtIGByZXBvcnRlcnNgIC0gVGhlIGxpc3Qgb2YgcmVwb3J0ZXJzXG4gKiAtIGBjdXJyZW50YCAtIEEgcmVmZXJlbmNlIHRvIHRoZSBjdXJyZW50bHkgYWN0aXZlIHRlc3RcbiAqIC0gYHRpbWVvdXRgIC0gVGhlIHRlc3RzJ3MgdGltZW91dCwgb3IgMCBpZiBpbmhlcml0ZWRcbiAqIC0gYHNsb3dgIC0gVGhlIHRlc3RzJ3Mgc2xvdyB0aHJlc2hvbGRcbiAqIC0gYG5hbWVgIC0gVGhlIHRlc3QncyBuYW1lXG4gKiAtIGBpbmRleGAgLSBUaGUgdGVzdCdzIGluZGV4XG4gKiAtIGBwYXJlbnRgIC0gVGhlIHRlc3QncyBwYXJlbnRcbiAqIC0gYGNhbGxiYWNrYCAtIFRoZSB0ZXN0J3MgY2FsbGJhY2tcbiAqIC0gYHRlc3RzYCAtIFRoZSB0ZXN0J3MgY2hpbGQgdGVzdHNcbiAqIC0gYGJlZm9yZUFsbGAsIGBiZWZvcmVFYWNoYCwgYGFmdGVyRWFjaGAsIGBhZnRlckFsbGAgLSBUaGUgdGVzdCdzIHZhcmlvdXNcbiAqICAgc2NoZWR1bGVkIGhvb2tzXG4gKlxuICogTWFueSBvZiB0aGVzZSBwcm9wZXJ0aWVzIGFyZW4ndCBwcmVzZW50IG9uIGluaXRpYWxpemF0aW9uIHRvIHNhdmUgbWVtb3J5LlxuICovXG5cbi8vIFRPRE86IHJlbW92ZSBgdGVzdC5tZXRob2RzYCBpbiAwLjRcbmZ1bmN0aW9uIE5vcm1hbChuYW1lLCBpbmRleCwgcGFyZW50LCBjYWxsYmFjaykge1xuICAgIHZhciBjaGlsZCA9IE9iamVjdC5jcmVhdGUocGFyZW50Lm1ldGhvZHMpXG5cbiAgICBjaGlsZC5fID0gdGhpc1xuICAgIHRoaXMubWV0aG9kcyA9IGNoaWxkXG4gICAgdGhpcy5sb2NrZWQgPSB0cnVlXG4gICAgdGhpcy5yb290ID0gcGFyZW50LnJvb3RcbiAgICB0aGlzLm5hbWUgPSBuYW1lXG4gICAgdGhpcy5pbmRleCA9IGluZGV4fDBcbiAgICB0aGlzLnBhcmVudCA9IHBhcmVudFxuICAgIHRoaXMuY2FsbGJhY2sgPSBjYWxsYmFja1xufVxuXG5mdW5jdGlvbiBTa2lwcGVkKG5hbWUsIGluZGV4LCBwYXJlbnQpIHtcbiAgICB0aGlzLmxvY2tlZCA9IHRydWVcbiAgICB0aGlzLnJvb3QgPSBwYXJlbnQucm9vdFxuICAgIHRoaXMubmFtZSA9IG5hbWVcbiAgICB0aGlzLmluZGV4ID0gaW5kZXh8MFxuICAgIHRoaXMucGFyZW50ID0gcGFyZW50XG59XG5cbi8vIFRPRE86IHJlbW92ZSBgdGVzdC5tZXRob2RzYCBpbiAwLjRcbmZ1bmN0aW9uIFJvb3QobWV0aG9kcykge1xuICAgIHRoaXMubG9ja2VkID0gZmFsc2VcbiAgICB0aGlzLm1ldGhvZHMgPSBtZXRob2RzXG4gICAgdGhpcy5yZXBvcnRlcklkcyA9IFtdXG4gICAgdGhpcy5yZXBvcnRlcnMgPSBbXVxuICAgIHRoaXMuY3VycmVudCA9IHRoaXNcbiAgICB0aGlzLnJvb3QgPSB0aGlzXG4gICAgdGhpcy50aW1lb3V0ID0gMFxuICAgIHRoaXMuc2xvdyA9IDBcbn1cblxuLyoqXG4gKiBCYXNlIHRlc3RzIChpLmUuIGRlZmF1bHQgZXhwb3J0LCByZXN1bHQgb2YgYGludGVybmFsLnJvb3QoKWApLlxuICovXG5cbmV4cG9ydHMuY3JlYXRlUm9vdCA9IGZ1bmN0aW9uIChtZXRob2RzKSB7XG4gICAgcmV0dXJuIG5ldyBSb290KG1ldGhvZHMpXG59XG5cbi8qKlxuICogU2V0IHVwIGVhY2ggdGVzdCB0eXBlLlxuICovXG5cbi8qKlxuICogQSBub3JtYWwgdGVzdCB0aHJvdWdoIGB0LnRlc3QoKWAuXG4gKi9cblxuZXhwb3J0cy5hZGROb3JtYWwgPSBmdW5jdGlvbiAocGFyZW50LCBuYW1lLCBjYWxsYmFjaykge1xuICAgIHZhciBpbmRleCA9IHBhcmVudC50ZXN0cyAhPSBudWxsID8gcGFyZW50LnRlc3RzLmxlbmd0aCA6IDBcbiAgICB2YXIgYmFzZSA9IG5ldyBOb3JtYWwobmFtZSwgaW5kZXgsIHBhcmVudCwgY2FsbGJhY2spXG5cbiAgICBpZiAoaW5kZXgpIHtcbiAgICAgICAgcGFyZW50LnRlc3RzLnB1c2goYmFzZSlcbiAgICB9IGVsc2Uge1xuICAgICAgICBwYXJlbnQudGVzdHMgPSBbYmFzZV1cbiAgICB9XG59XG5cbi8qKlxuICogQSBza2lwcGVkIHRlc3QgdGhyb3VnaCBgdC50ZXN0U2tpcCgpYC5cbiAqL1xuZXhwb3J0cy5hZGRTa2lwcGVkID0gZnVuY3Rpb24gKHBhcmVudCwgbmFtZSkge1xuICAgIHZhciBpbmRleCA9IHBhcmVudC50ZXN0cyAhPSBudWxsID8gcGFyZW50LnRlc3RzLmxlbmd0aCA6IDBcbiAgICB2YXIgYmFzZSA9IG5ldyBTa2lwcGVkKG5hbWUsIGluZGV4LCBwYXJlbnQpXG5cbiAgICBpZiAoaW5kZXgpIHtcbiAgICAgICAgcGFyZW50LnRlc3RzLnB1c2goYmFzZSlcbiAgICB9IGVsc2Uge1xuICAgICAgICBwYXJlbnQudGVzdHMgPSBbYmFzZV1cbiAgICB9XG59XG5cbi8qKlxuICogQ2xlYXIgdGhlIHRlc3RzIGluIHBsYWNlLlxuICovXG5leHBvcnRzLmNsZWFyVGVzdHMgPSBmdW5jdGlvbiAocGFyZW50KSB7XG4gICAgcGFyZW50LnRlc3RzID0gbnVsbFxufVxuXG4vKipcbiAqIEV4ZWN1dGUgdGhlIHRlc3RzXG4gKi9cblxuZnVuY3Rpb24gcGF0aCh0ZXN0KSB7XG4gICAgdmFyIHJldCA9IFtdXG5cbiAgICB3aGlsZSAodGVzdC5yb290ICE9PSB0ZXN0KSB7XG4gICAgICAgIHJldC5wdXNoKHtuYW1lOiB0ZXN0Lm5hbWUsIGluZGV4OiB0ZXN0LmluZGV4fSlcbiAgICAgICAgdGVzdCA9IHRlc3QucGFyZW50XG4gICAgfVxuXG4gICAgcmV0dXJuIHJldC5yZXZlcnNlKClcbn1cblxuLy8gTm90ZSB0aGF0IGEgdGltZW91dCBvZiAwIG1lYW5zIHRvIGluaGVyaXQgdGhlIHBhcmVudC5cbmV4cG9ydHMudGltZW91dCA9IHRpbWVvdXRcbmZ1bmN0aW9uIHRpbWVvdXQodGVzdCkge1xuICAgIHdoaWxlICghdGVzdC50aW1lb3V0ICYmIHRlc3Qucm9vdCAhPT0gdGVzdCkge1xuICAgICAgICB0ZXN0ID0gdGVzdC5wYXJlbnRcbiAgICB9XG5cbiAgICByZXR1cm4gdGVzdC50aW1lb3V0IHx8IDIwMDAgLy8gbXMgLSBkZWZhdWx0IHRpbWVvdXRcbn1cblxuLy8gTm90ZSB0aGF0IGEgc2xvd25lc3MgdGhyZXNob2xkIG9mIDAgbWVhbnMgdG8gaW5oZXJpdCB0aGUgcGFyZW50LlxuZXhwb3J0cy5zbG93ID0gc2xvd1xuZnVuY3Rpb24gc2xvdyh0ZXN0KSB7XG4gICAgd2hpbGUgKCF0ZXN0LnNsb3cgJiYgdGVzdC5yb290ICE9PSB0ZXN0KSB7XG4gICAgICAgIHRlc3QgPSB0ZXN0LnBhcmVudFxuICAgIH1cblxuICAgIHJldHVybiB0ZXN0LnNsb3cgfHwgNzUgLy8gbXMgLSBkZWZhdWx0IHNsb3cgdGhyZXNob2xkXG59XG5cbmZ1bmN0aW9uIHJlcG9ydCh0ZXN0LCB0eXBlLCBhcmcxLCBhcmcyKSB7XG4gICAgZnVuY3Rpb24gaW52b2tlUmVwb3J0ZXIocmVwb3J0ZXIpIHtcbiAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgIGNhc2UgVHlwZXMuU3RhcnQ6XG4gICAgICAgICAgICByZXR1cm4gcmVwb3J0ZXIobmV3IFJlcG9ydHMuU3RhcnQoKSlcblxuICAgICAgICBjYXNlIFR5cGVzLkVudGVyOlxuICAgICAgICAgICAgcmV0dXJuIHJlcG9ydGVyKG5ldyBSZXBvcnRzLkVudGVyKHBhdGgodGVzdCksIGFyZzEsIHNsb3codGVzdCkpKVxuXG4gICAgICAgIGNhc2UgVHlwZXMuTGVhdmU6XG4gICAgICAgICAgICByZXR1cm4gcmVwb3J0ZXIobmV3IFJlcG9ydHMuTGVhdmUocGF0aCh0ZXN0KSkpXG5cbiAgICAgICAgY2FzZSBUeXBlcy5QYXNzOlxuICAgICAgICAgICAgcmV0dXJuIHJlcG9ydGVyKG5ldyBSZXBvcnRzLlBhc3MocGF0aCh0ZXN0KSwgYXJnMSwgc2xvdyh0ZXN0KSkpXG5cbiAgICAgICAgY2FzZSBUeXBlcy5GYWlsOlxuICAgICAgICAgICAgcmV0dXJuIHJlcG9ydGVyKFxuICAgICAgICAgICAgICAgIG5ldyBSZXBvcnRzLkZhaWwocGF0aCh0ZXN0KSwgYXJnMSwgYXJnMiwgc2xvdyh0ZXN0KSkpXG5cbiAgICAgICAgY2FzZSBUeXBlcy5Ta2lwOlxuICAgICAgICAgICAgcmV0dXJuIHJlcG9ydGVyKG5ldyBSZXBvcnRzLlNraXAocGF0aCh0ZXN0KSkpXG5cbiAgICAgICAgY2FzZSBUeXBlcy5FbmQ6XG4gICAgICAgICAgICByZXR1cm4gcmVwb3J0ZXIobmV3IFJlcG9ydHMuRW5kKCkpXG5cbiAgICAgICAgY2FzZSBUeXBlcy5FcnJvcjpcbiAgICAgICAgICAgIHJldHVybiByZXBvcnRlcihuZXcgUmVwb3J0cy5FcnJvcihhcmcxKSlcblxuICAgICAgICBjYXNlIFR5cGVzLkhvb2s6XG4gICAgICAgICAgICByZXR1cm4gcmVwb3J0ZXIobmV3IFJlcG9ydHMuSG9vayhwYXRoKHRlc3QpLCBwYXRoKGFyZzEpLCBhcmcyKSlcblxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcInVucmVhY2hhYmxlXCIpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKClcbiAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0ZXN0LnJvb3QucmVwb3J0ZXIgPT0gbnVsbCkgcmV0dXJuIHVuZGVmaW5lZFxuICAgICAgICByZXR1cm4gaW52b2tlUmVwb3J0ZXIodGVzdC5yb290LnJlcG9ydGVyKVxuICAgIH0pXG4gICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgcmVwb3J0ZXJzID0gdGVzdC5yb290LnJlcG9ydGVyc1xuXG4gICAgICAgIC8vIFR3byBlYXN5IGNhc2VzLlxuICAgICAgICBpZiAocmVwb3J0ZXJzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHVuZGVmaW5lZFxuICAgICAgICBpZiAocmVwb3J0ZXJzLmxlbmd0aCA9PT0gMSkgcmV0dXJuIGludm9rZVJlcG9ydGVyKHJlcG9ydGVyc1swXSlcbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHJlcG9ydGVycy5tYXAoaW52b2tlUmVwb3J0ZXIpKVxuICAgIH0pXG59XG5cbi8qKlxuICogTm9ybWFsIHRlc3RzXG4gKi9cblxuLy8gUGhhbnRvbUpTIGFuZCBJRSBkb24ndCBhZGQgdGhlIHN0YWNrIHVudGlsIGl0J3MgdGhyb3duLiBJbiBmYWlsaW5nIGFzeW5jXG4vLyB0ZXN0cywgaXQncyBhbHJlYWR5IHRocm93biBpbiBhIHNlbnNlLCBzbyB0aGlzIHNob3VsZCBiZSBub3JtYWxpemVkIHdpdGhcbi8vIG90aGVyIHRlc3QgdHlwZXMuXG52YXIgYWRkU3RhY2sgPSB0eXBlb2YgbmV3IEVycm9yKCkuc3RhY2sgIT09IFwic3RyaW5nXCJcbiAgICA/IGZ1bmN0aW9uIGFkZFN0YWNrKGUpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmIChlIGluc3RhbmNlb2YgRXJyb3IgJiYgZS5zdGFjayA9PSBudWxsKSB0aHJvdyBlXG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICByZXR1cm4gZVxuICAgICAgICB9XG4gICAgfVxuICAgIDogZnVuY3Rpb24gKGUpIHsgcmV0dXJuIGUgfVxuXG5mdW5jdGlvbiBnZXRUaGVuKHJlcykge1xuICAgIGlmICh0eXBlb2YgcmVzID09PSBcIm9iamVjdFwiIHx8IHR5cGVvZiByZXMgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICByZXR1cm4gcmVzLnRoZW5cbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgfVxufVxuXG5mdW5jdGlvbiBBc3luY1N0YXRlKHN0YXJ0LCByZXNvbHZlKSB7XG4gICAgdGhpcy5zdGFydCA9IHN0YXJ0XG4gICAgdGhpcy5yZXNvbHZlID0gcmVzb2x2ZVxuICAgIHRoaXMucmVzb2x2ZWQgPSBmYWxzZVxuICAgIHRoaXMudGltZXIgPSB1bmRlZmluZWRcbn1cblxuZnVuY3Rpb24gYXN5bmNGaW5pc2goc3RhdGUsIGF0dGVtcHQpIHtcbiAgICAvLyBDYXB0dXJlIGltbWVkaWF0ZWx5LiBXb3JzdCBjYXNlIHNjZW5hcmlvLCBpdCBnZXRzIHRocm93biBhd2F5LlxuICAgIHZhciBlbmQgPSBub3coKVxuXG4gICAgaWYgKHN0YXRlLnJlc29sdmVkKSByZXR1cm5cbiAgICBpZiAoc3RhdGUudGltZXIpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0LmNhbGwoZ2xvYmFsLCBzdGF0ZS50aW1lcilcbiAgICAgICAgc3RhdGUudGltZXIgPSB1bmRlZmluZWRcbiAgICB9XG5cbiAgICBzdGF0ZS5yZXNvbHZlZCA9IHRydWVcbiAgICBzdGF0ZS5yZXNvbHZlKG5ldyBSZXN1bHQoZW5kIC0gc3RhdGUuc3RhcnQsIGF0dGVtcHQpKVxufVxuXG4vLyBBdm9pZCBhIGNsb3N1cmUgaWYgcG9zc2libGUsIGluIGNhc2UgaXQgZG9lc24ndCByZXR1cm4gYSB0aGVuYWJsZS5cbmZ1bmN0aW9uIGludm9rZUluaXQodGVzdCkge1xuICAgIHZhciBzdGFydCA9IG5vdygpXG4gICAgdmFyIHRyeUJvZHkgPSB0cnkxKHRlc3QuY2FsbGJhY2ssIHRlc3QubWV0aG9kcywgdGVzdC5tZXRob2RzKVxuXG4gICAgLy8gTm90ZTogc3luY2hyb25vdXMgZmFpbHVyZXMgYXJlIHRlc3QgZmFpbHVyZXMsIG5vdCBmYXRhbCBlcnJvcnMuXG4gICAgaWYgKHRyeUJvZHkuY2F1Z2h0KSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobmV3IFJlc3VsdChub3coKSAtIHN0YXJ0LCB0cnlCb2R5KSlcbiAgICB9XG5cbiAgICB2YXIgdHJ5VGhlbiA9IHRyeTEoZ2V0VGhlbiwgdW5kZWZpbmVkLCB0cnlCb2R5LnZhbHVlKVxuXG4gICAgaWYgKHRyeVRoZW4uY2F1Z2h0IHx8IHR5cGVvZiB0cnlUaGVuLnZhbHVlICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShuZXcgUmVzdWx0KG5vdygpIC0gc3RhcnQsIHRyeVRoZW4pKVxuICAgIH1cblxuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSkge1xuICAgICAgICB2YXIgc3RhdGUgPSBuZXcgQXN5bmNTdGF0ZShzdGFydCwgcmVzb2x2ZSlcbiAgICAgICAgdmFyIHJlc3VsdCA9IHRyeTIodHJ5VGhlbi52YWx1ZSwgdHJ5Qm9keS52YWx1ZSxcbiAgICAgICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3RhdGUgPT0gbnVsbCkgcmV0dXJuXG4gICAgICAgICAgICAgICAgYXN5bmNGaW5pc2goc3RhdGUsIHRyeVBhc3MoKSlcbiAgICAgICAgICAgICAgICBzdGF0ZSA9IHVuZGVmaW5lZFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXRlID09IG51bGwpIHJldHVyblxuICAgICAgICAgICAgICAgIGFzeW5jRmluaXNoKHN0YXRlLCB0cnlGYWlsKGFkZFN0YWNrKGUpKSlcbiAgICAgICAgICAgICAgICBzdGF0ZSA9IHVuZGVmaW5lZFxuICAgICAgICAgICAgfSlcblxuICAgICAgICBpZiAocmVzdWx0LmNhdWdodCkge1xuICAgICAgICAgICAgYXN5bmNGaW5pc2goc3RhdGUsIHJlc3VsdClcbiAgICAgICAgICAgIHN0YXRlID0gdW5kZWZpbmVkXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFNldCB0aGUgdGltZW91dCAqYWZ0ZXIqIGluaXRpYWxpemF0aW9uLiBUaGUgdGltZW91dCB3aWxsIGxpa2VseSBiZVxuICAgICAgICAvLyBzcGVjaWZpZWQgZHVyaW5nIGluaXRpYWxpemF0aW9uLlxuICAgICAgICB2YXIgbWF4VGltZW91dCA9IHRpbWVvdXQodGVzdClcblxuICAgICAgICAvLyBTZXR0aW5nIGEgdGltZW91dCBpcyBwb2ludGxlc3MgaWYgaXQncyBpbmZpbml0ZS5cbiAgICAgICAgaWYgKG1heFRpbWVvdXQgIT09IEluZmluaXR5KSB7XG4gICAgICAgICAgICBzdGF0ZS50aW1lciA9IHNldFRpbWVvdXQuY2FsbChnbG9iYWwsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3RhdGUgPT0gbnVsbCkgcmV0dXJuXG4gICAgICAgICAgICAgICAgYXN5bmNGaW5pc2goc3RhdGUsIHRyeUZhaWwoYWRkU3RhY2soXG4gICAgICAgICAgICAgICAgICAgIG5ldyBFcnJvcihcIlRpbWVvdXQgb2YgXCIgKyBtYXhUaW1lb3V0ICsgXCIgcmVhY2hlZFwiKSkpKVxuICAgICAgICAgICAgICAgIHN0YXRlID0gdW5kZWZpbmVkXG4gICAgICAgICAgICB9LCBtYXhUaW1lb3V0KVxuICAgICAgICB9XG4gICAgfSlcbn1cblxuZnVuY3Rpb24gRXJyb3JXcmFwKHRlc3QsIGVycm9yKSB7XG4gICAgdGhpcy50ZXN0ID0gdGVzdFxuICAgIHRoaXMuZXJyb3IgPSBlcnJvclxufVxubWV0aG9kcyhFcnJvcldyYXAsIEVycm9yLCB7bmFtZTogXCJFcnJvcldyYXBcIn0pXG5cbmZ1bmN0aW9uIGludm9rZUhvb2sodGVzdCwgbGlzdCwgc3RhZ2UpIHtcbiAgICBpZiAobGlzdCA9PSBudWxsKSByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKClcbiAgICByZXR1cm4gcGVhY2gobGlzdCwgZnVuY3Rpb24gKGhvb2spIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiBob29rKClcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yV3JhcCh0ZXN0LCBuZXcgUmVwb3J0cy5Ib29rRXJyb3Ioc3RhZ2UsIGhvb2ssIGUpKVxuICAgICAgICB9XG4gICAgfSlcbn1cblxuZnVuY3Rpb24gaW52b2tlQmVmb3JlRWFjaCh0ZXN0KSB7XG4gICAgaWYgKHRlc3Qucm9vdCA9PT0gdGVzdCkge1xuICAgICAgICByZXR1cm4gaW52b2tlSG9vayh0ZXN0LCB0ZXN0LmJlZm9yZUVhY2gsIFR5cGVzLkJlZm9yZUVhY2gpXG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGludm9rZUJlZm9yZUVhY2godGVzdC5wYXJlbnQpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGludm9rZUhvb2sodGVzdCwgdGVzdC5iZWZvcmVFYWNoLCBUeXBlcy5CZWZvcmVFYWNoKVxuICAgICAgICB9KVxuICAgIH1cbn1cblxuZnVuY3Rpb24gaW52b2tlQWZ0ZXJFYWNoKHRlc3QpIHtcbiAgICBpZiAodGVzdC5yb290ID09PSB0ZXN0KSB7XG4gICAgICAgIHJldHVybiBpbnZva2VIb29rKHRlc3QsIHRlc3QuYWZ0ZXJFYWNoLCBUeXBlcy5BZnRlckVhY2gpXG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGludm9rZUhvb2sodGVzdCwgdGVzdC5hZnRlckVhY2gsIFR5cGVzLkFmdGVyRWFjaClcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gaW52b2tlQWZ0ZXJFYWNoKHRlc3QucGFyZW50KSB9KVxuICAgIH1cbn1cblxuZnVuY3Rpb24gcnVuQ2hpbGRUZXN0cyh0ZXN0KSB7XG4gICAgaWYgKHRlc3QudGVzdHMgPT0gbnVsbCkgcmV0dXJuIHVuZGVmaW5lZFxuXG4gICAgZnVuY3Rpb24gcnVuQ2hpbGQoY2hpbGQpIHtcbiAgICAgICAgcmV0dXJuIGludm9rZUJlZm9yZUVhY2godGVzdClcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gcnVuTm9ybWFsQ2hpbGQoY2hpbGQpIH0pXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIGludm9rZUFmdGVyRWFjaCh0ZXN0KSB9KVxuICAgICAgICAudGhlbihcbiAgICAgICAgICAgIGZ1bmN0aW9uICgpIHsgdGVzdC5yb290LmN1cnJlbnQgPSB0ZXN0IH0sXG4gICAgICAgICAgICBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgIHRlc3Qucm9vdC5jdXJyZW50ID0gdGVzdFxuICAgICAgICAgICAgICAgIGlmICghKGUgaW5zdGFuY2VvZiBFcnJvcldyYXApKSB0aHJvdyBlXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcG9ydChjaGlsZCwgVHlwZXMuSG9vaywgZS50ZXN0LCBlLmVycm9yKVxuICAgICAgICAgICAgfSlcbiAgICB9XG5cbiAgICB2YXIgcmFuID0gZmFsc2VcblxuICAgIGZ1bmN0aW9uIG1heWJlUnVuQ2hpbGQoY2hpbGQpIHtcbiAgICAgICAgLy8gT25seSBza2lwcGVkIHRlc3RzIGhhdmUgbm8gY2FsbGJhY2tcbiAgICAgICAgaWYgKGNoaWxkLmNhbGxiYWNrID09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiByZXBvcnQoY2hpbGQsIFR5cGVzLlNraXApXG4gICAgICAgIH0gZWxzZSBpZiAoIWlzT25seShjaGlsZCkpIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuICAgICAgICB9IGVsc2UgaWYgKHJhbikge1xuICAgICAgICAgICAgcmV0dXJuIHJ1bkNoaWxkKGNoaWxkKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmFuID0gdHJ1ZVxuICAgICAgICAgICAgcmV0dXJuIGludm9rZUhvb2sodGVzdCwgdGVzdC5iZWZvcmVBbGwsIFR5cGVzLkJlZm9yZUFsbClcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIHJ1bkNoaWxkKGNoaWxkKSB9KVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHBlYWNoKHRlc3QudGVzdHMsIGZ1bmN0aW9uIChjaGlsZCkge1xuICAgICAgICB0ZXN0LnJvb3QuY3VycmVudCA9IGNoaWxkXG4gICAgICAgIHJldHVybiBtYXliZVJ1bkNoaWxkKGNoaWxkKS50aGVuKFxuICAgICAgICAgICAgZnVuY3Rpb24gKCkgeyB0ZXN0LnJvb3QuY3VycmVudCA9IHRlc3QgfSxcbiAgICAgICAgICAgIGZ1bmN0aW9uIChlKSB7IHRlc3Qucm9vdC5jdXJyZW50ID0gdGVzdDsgdGhyb3cgZSB9KVxuICAgIH0pXG4gICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gcmFuID8gaW52b2tlSG9vayh0ZXN0LCB0ZXN0LmFmdGVyQWxsLCBUeXBlcy5BZnRlckFsbCkgOiB1bmRlZmluZWRcbiAgICB9KVxufVxuXG5mdW5jdGlvbiBjbGVhckNoaWxkcmVuKHRlc3QpIHtcbiAgICBpZiAodGVzdC50ZXN0cyA9PSBudWxsKSByZXR1cm5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRlc3QudGVzdHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgZGVsZXRlIHRlc3QudGVzdHNbaV0udGVzdHNcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHJ1bk5vcm1hbENoaWxkKHRlc3QpIHtcbiAgICB0ZXN0LmxvY2tlZCA9IGZhbHNlXG5cbiAgICByZXR1cm4gaW52b2tlSW5pdCh0ZXN0KVxuICAgIC50aGVuKFxuICAgICAgICBmdW5jdGlvbiAocmVzdWx0KSB7IHRlc3QubG9ja2VkID0gdHJ1ZTsgcmV0dXJuIHJlc3VsdCB9LFxuICAgICAgICBmdW5jdGlvbiAoZXJyb3IpIHsgdGVzdC5sb2NrZWQgPSB0cnVlOyB0aHJvdyBlcnJvciB9KVxuICAgIC50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgaWYgKHJlc3VsdC5jYXVnaHQpIHtcbiAgICAgICAgICAgIHJldHVybiByZXBvcnQodGVzdCwgVHlwZXMuRmFpbCwgcmVzdWx0LnZhbHVlLCByZXN1bHQudGltZSlcbiAgICAgICAgfSBlbHNlIGlmICh0ZXN0LnRlc3RzICE9IG51bGwpIHtcbiAgICAgICAgICAgIC8vIFJlcG9ydCB0aGlzIGFzIGlmIGl0IHdhcyBhIHBhcmVudCB0ZXN0IGlmIGl0J3MgcGFzc2luZyBhbmQgaGFzXG4gICAgICAgICAgICAvLyBjaGlsZHJlbi5cbiAgICAgICAgICAgIHJldHVybiByZXBvcnQodGVzdCwgVHlwZXMuRW50ZXIsIHJlc3VsdC50aW1lKVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gcnVuQ2hpbGRUZXN0cyh0ZXN0KSB9KVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gcmVwb3J0KHRlc3QsIFR5cGVzLkxlYXZlKSB9KVxuICAgICAgICAgICAgLmNhdGNoKGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgaWYgKCEoZSBpbnN0YW5jZW9mIEVycm9yV3JhcCkpIHRocm93IGVcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVwb3J0KHRlc3QsIFR5cGVzLkxlYXZlKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcG9ydCh0ZXN0LCBUeXBlcy5Ib29rLCBlLnRlc3QsIGUuZXJyb3IpXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gcmVwb3J0KHRlc3QsIFR5cGVzLlBhc3MsIHJlc3VsdC50aW1lKVxuICAgICAgICB9XG4gICAgfSlcbiAgICAudGhlbihcbiAgICAgICAgZnVuY3Rpb24gKCkgeyBjbGVhckNoaWxkcmVuKHRlc3QpIH0sXG4gICAgICAgIGZ1bmN0aW9uIChlKSB7IGNsZWFyQ2hpbGRyZW4odGVzdCk7IHRocm93IGUgfSlcbn1cblxuLyoqXG4gKiBUaGlzIHJ1bnMgdGhlIHJvb3QgdGVzdCBhbmQgcmV0dXJucyBhIHByb21pc2UgcmVzb2x2ZWQgd2hlbiBpdCdzIGRvbmUuXG4gKi9cbmV4cG9ydHMucnVuVGVzdCA9IGZ1bmN0aW9uICh0ZXN0KSB7XG4gICAgdGVzdC5sb2NrZWQgPSB0cnVlXG5cbiAgICByZXR1cm4gcmVwb3J0KHRlc3QsIFR5cGVzLlN0YXJ0KVxuICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIHJ1bkNoaWxkVGVzdHModGVzdCkgfSlcbiAgICAuY2F0Y2goZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgaWYgKCEoZSBpbnN0YW5jZW9mIEVycm9yV3JhcCkpIHRocm93IGVcbiAgICAgICAgcmV0dXJuIHJlcG9ydCh0ZXN0LCBUeXBlcy5Ib29rLCBlLnRlc3QsIGUuZXJyb3IpXG4gICAgfSlcbiAgICAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiByZXBvcnQodGVzdCwgVHlwZXMuRW5kKSB9KVxuICAgIC8vIFRlbGwgdGhlIHJlcG9ydGVyIHNvbWV0aGluZyBoYXBwZW5lZC4gT3RoZXJ3aXNlLCBpdCdsbCBoYXZlIHRvIHdyYXAgdGhpc1xuICAgIC8vIG1ldGhvZCBpbiBhIHBsdWdpbiwgd2hpY2ggc2hvdWxkbid0IGJlIG5lY2Vzc2FyeS5cbiAgICAuY2F0Y2goZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgcmV0dXJuIHJlcG9ydCh0ZXN0LCBUeXBlcy5FcnJvciwgZSkudGhlbihmdW5jdGlvbiAoKSB7IHRocm93IGUgfSlcbiAgICB9KVxuICAgIC50aGVuKFxuICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjbGVhckNoaWxkcmVuKHRlc3QpXG4gICAgICAgICAgICB0ZXN0LmxvY2tlZCA9IGZhbHNlXG4gICAgICAgIH0sXG4gICAgICAgIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICBjbGVhckNoaWxkcmVuKHRlc3QpXG4gICAgICAgICAgICB0ZXN0LmxvY2tlZCA9IGZhbHNlXG4gICAgICAgICAgICB0aHJvdyBlXG4gICAgICAgIH0pXG59XG5cbi8vIEhlbHAgb3B0aW1pemUgZm9yIGluZWZmaWNpZW50IGV4Y2VwdGlvbiBoYW5kbGluZyBpbiBWOFxuXG5mdW5jdGlvbiB0cnlQYXNzKHZhbHVlKSB7XG4gICAgcmV0dXJuIHtjYXVnaHQ6IGZhbHNlLCB2YWx1ZTogdmFsdWV9XG59XG5cbmZ1bmN0aW9uIHRyeUZhaWwoZSkge1xuICAgIHJldHVybiB7Y2F1Z2h0OiB0cnVlLCB2YWx1ZTogZX1cbn1cblxuZnVuY3Rpb24gdHJ5MShmLCBpbnN0LCBhcmcwKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIHRyeVBhc3MoZi5jYWxsKGluc3QsIGFyZzApKVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgcmV0dXJuIHRyeUZhaWwoZSlcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHRyeTIoZiwgaW5zdCwgYXJnMCwgYXJnMSkge1xuICAgIHRyeSB7XG4gICAgICAgIHJldHVybiB0cnlQYXNzKGYuY2FsbChpbnN0LCBhcmcwLCBhcmcxKSlcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHJldHVybiB0cnlGYWlsKGUpXG4gICAgfVxufVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxuLyoqXG4gKiBUaGUgRE9NIHJlcG9ydGVyIGFuZCBsb2FkZXIgZW50cnkgcG9pbnQuIFNlZSB0aGUgUkVBRE1FLm1kIGZvciBtb3JlIGRldGFpbHMuXG4gKi9cblxudmFyIGluaXRpYWxpemUgPSByZXF1aXJlKFwiLi9pbml0aWFsaXplXCIpXG4vLyB2YXIgdCA9IHJlcXVpcmUoXCIuLi8uLi9pbmRleFwiKVxuLy8gdmFyIGFzc2VydCA9IHJlcXVpcmUoXCIuLi8uLi9hc3NlcnRcIilcblxuZXhwb3J0cy5jcmVhdGUgPSBmdW5jdGlvbiAob3B0cykge1xuICAgIGlmIChvcHRzID09IG51bGwpIHJldHVybiBpbml0aWFsaXplKHt9KVxuICAgIGlmIChBcnJheS5pc0FycmF5KG9wdHMpKSByZXR1cm4gaW5pdGlhbGl6ZSh7ZmlsZXM6IG9wdHN9KVxuICAgIGlmICh0eXBlb2Ygb3B0cyA9PT0gXCJvYmplY3RcIikgcmV0dXJuIGluaXRpYWxpemUob3B0cylcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYG9wdHNgIG11c3QgYmUgYW4gb2JqZWN0IG9yIGFycmF5IG9mIGZpbGVzIGlmIHBhc3NlZFwiKVxufVxuXG4vLyBDdXJyZW50bHkgYnJva2VuLCBiZWNhdXNlIHRoaXMgaXNuJ3QgYXV0b2xvYWRlZCB5ZXQuXG4vLyBleHBvcnRzLmF1dG9sb2FkID0gZnVuY3Rpb24gKHNjcmlwdCkge1xuLy8gICAgIHZhciBmaWxlcyA9IHNjcmlwdC5nZXRBdHRyaWJ1dGUoXCJkYXRhLWZpbGVzXCIpXG4vL1xuLy8gICAgIGlmICghZmlsZXMpIHJldHVyblxuLy9cbi8vICAgICBmdW5jdGlvbiBzZXQob3B0cywgYXR0ciwgdHJhbnNmb3JtKSB7XG4vLyAgICAgICAgIHZhciB2YWx1ZSA9IHNjcmlwdC5nZXRBdHRyaWJ1dGUoXCJkYXRhLVwiICsgYXR0cilcbi8vXG4vLyAgICAgICAgIGlmICh2YWx1ZSkgb3B0c1thdHRyXSA9IHRyYW5zZm9ybSh2YWx1ZSlcbi8vICAgICB9XG4vL1xuLy8gICAgIHZhciBvcHRzID0ge2ZpbGVzOiBmaWxlcy50cmltKCkuc3BsaXQoL1xccysvZyl9XG4vL1xuLy8gICAgIHNldChvcHRzLCBcInRpbWVvdXRcIiwgTnVtYmVyKVxuLy8gICAgIHNldChvcHRzLCBcInByZWxvYWRcIiwgRnVuY3Rpb24pXG4vLyAgICAgc2V0KG9wdHMsIFwicHJlcnVuXCIsIEZ1bmN0aW9uKVxuLy8gICAgIHNldChvcHRzLCBcInBvc3RydW5cIiwgRnVuY3Rpb24pXG4vLyAgICAgc2V0KG9wdHMsIFwiZXJyb3JcIiwgZnVuY3Rpb24gKGF0dHIpIHtcbi8vICAgICAgICAgcmV0dXJuIG5ldyBGdW5jdGlvbihcImVyclwiLCBhdHRyKSAvLyBlc2xpbnQtZGlzYWJsZS1saW5lXG4vLyAgICAgfSlcbi8vXG4vLyAgICAgLy8gQ29udmVuaWVuY2UuXG4vLyAgICAgZ2xvYmFsLnQgPSB0XG4vLyAgICAgZ2xvYmFsLmFzc2VydCA9IGFzc2VydFxuLy9cbi8vICAgICBpZiAoZ2xvYmFsLmRvY3VtZW50LnJlYWR5U3RhdGUgIT09IFwibG9hZGluZ1wiKSB7XG4vLyAgICAgICAgIGluaXRpYWxpemUob3B0cykucnVuKClcbi8vICAgICB9IGVsc2Uge1xuLy8gICAgICAgICBnbG9iYWwuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIkRPTUNvbnRlbnRMb2FkZWRcIiwgZnVuY3Rpb24gKCkge1xuLy8gICAgICAgICAgICAgaW5pdGlhbGl6ZShvcHRzKS5ydW4oKVxuLy8gICAgICAgICB9KVxuLy8gICAgIH1cbi8vIH1cbiIsIlwidXNlIHN0cmljdFwiXG5cbi8qKlxuICogVGhlIHJlcG9ydGVyIGFuZCB0ZXN0IGluaXRpYWxpemF0aW9uIHNlcXVlbmNlLCBhbmQgc2NyaXB0IGxvYWRpbmcuIFRoaXNcbiAqIGRvZXNuJ3QgdW5kZXJzdGFuZCBhbnl0aGluZyB2aWV3LXdpc2UuXG4gKi9cblxudmFyIGRlZmF1bHRUID0gcmVxdWlyZShcIi4uLy4uL2luZGV4XCIpXG52YXIgUiA9IHJlcXVpcmUoXCIuLi9yZXBvcnRlclwiKVxudmFyIEQgPSByZXF1aXJlKFwiLi9pbmplY3RcIilcbnZhciBydW5UZXN0cyA9IHJlcXVpcmUoXCIuL3J1bi10ZXN0c1wiKVxudmFyIGluamVjdFN0eWxlcyA9IHJlcXVpcmUoXCIuL2luamVjdC1zdHlsZXNcIilcbnZhciBWaWV3ID0gcmVxdWlyZShcIi4vdmlld1wiKVxudmFyIG1ldGhvZHMgPSByZXF1aXJlKFwiLi4vbWV0aG9kc1wiKVxuXG5mdW5jdGlvbiBUcmVlKG5hbWUpIHtcbiAgICB0aGlzLm5hbWUgPSBuYW1lXG4gICAgdGhpcy5zdGF0dXMgPSBSLlN0YXR1cy5Vbmtub3duXG4gICAgdGhpcy5ub2RlID0gbnVsbFxuICAgIHRoaXMuY2hpbGRyZW4gPSBPYmplY3QuY3JlYXRlKG51bGwpXG59XG5cbnZhciByZXBvcnRlciA9IFIub24oXCJkb21cIiwge1xuICAgIGFjY2VwdHM6IFtdLFxuICAgIGNyZWF0ZTogZnVuY3Rpb24gKG9wdHMsIG1ldGhvZHMpIHtcbiAgICAgICAgdmFyIHJlcG9ydGVyID0gbmV3IFIuUmVwb3J0ZXIoVHJlZSwgdW5kZWZpbmVkLCBtZXRob2RzKVxuXG4gICAgICAgIHJlcG9ydGVyLm9wdHMgPSBvcHRzXG4gICAgICAgIHJldHVybiByZXBvcnRlclxuICAgIH0sXG5cbiAgICAvLyBHaXZlIHRoZSBicm93c2VyIGEgY2hhbmNlIHRvIHJlcGFpbnQgYmVmb3JlIGNvbnRpbnVpbmcgKG1pY3JvdGFza3NcbiAgICAvLyBub3JtYWxseSBibG9jayByZW5kZXJpbmcpLlxuICAgIGFmdGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShWaWV3Lm5leHRGcmFtZSlcbiAgICB9LFxuXG4gICAgcmVwb3J0OiBmdW5jdGlvbiAoXywgcmVwb3J0KSB7XG4gICAgICAgIHJldHVybiBWaWV3LnJlcG9ydChfLCByZXBvcnQpXG4gICAgfSxcbn0pXG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5mdW5jdGlvbiBzZXREZWZhdWx0c0NoZWNrZWQob3B0cykge1xuICAgIGlmIChvcHRzLnRpdGxlID09IG51bGwpIG9wdHMudGl0bGUgPSBcIlRoYWxsaXVtIHRlc3RzXCJcbiAgICBpZiAob3B0cy50aW1lb3V0ID09IG51bGwpIG9wdHMudGltZW91dCA9IDUwMDBcbiAgICBpZiAob3B0cy5maWxlcyA9PSBudWxsKSBvcHRzLmZpbGVzID0gW11cbiAgICBpZiAob3B0cy5wcmVsb2FkID09IG51bGwpIG9wdHMucHJlbG9hZCA9IG5vb3BcbiAgICBpZiAob3B0cy5wcmVydW4gPT0gbnVsbCkgb3B0cy5wcmVydW4gPSBub29wXG4gICAgaWYgKG9wdHMucG9zdHJ1biA9PSBudWxsKSBvcHRzLnBvc3RydW4gPSBub29wXG4gICAgaWYgKG9wdHMuZXJyb3IgPT0gbnVsbCkgb3B0cy5lcnJvciA9IG5vb3BcbiAgICBpZiAob3B0cy50aGFsbGl1bSA9PSBudWxsKSBvcHRzLnRoYWxsaXVtID0gZGVmYXVsdFRcblxuICAgIGlmICh0eXBlb2Ygb3B0cy50aXRsZSAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYG9wdHMudGl0bGVgIG11c3QgYmUgYSBzdHJpbmcgaWYgcGFzc2VkXCIpXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBvcHRzLnRpbWVvdXQgIT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBvcHRzLnRpbWVvdXRgIG11c3QgYmUgYSBudW1iZXIgaWYgcGFzc2VkXCIpXG4gICAgfVxuXG4gICAgaWYgKCFBcnJheS5pc0FycmF5KG9wdHMuZmlsZXMpKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJgb3B0cy5maWxlc2AgbXVzdCBiZSBhbiBhcnJheSBpZiBwYXNzZWRcIilcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIG9wdHMucHJlbG9hZCAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJgb3B0cy5wcmVsb2FkYCBtdXN0IGJlIGEgZnVuY3Rpb24gaWYgcGFzc2VkXCIpXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBvcHRzLnByZXJ1biAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJgb3B0cy5wcmVydW5gIG11c3QgYmUgYSBmdW5jdGlvbiBpZiBwYXNzZWRcIilcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIG9wdHMucG9zdHJ1biAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJgb3B0cy5wb3N0cnVuYCBtdXN0IGJlIGEgZnVuY3Rpb24gaWYgcGFzc2VkXCIpXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBvcHRzLmVycm9yICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBvcHRzLmVycm9yYCBtdXN0IGJlIGEgZnVuY3Rpb24gaWYgcGFzc2VkXCIpXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBvcHRzLnRoYWxsaXVtICE9PSBcIm9iamVjdFwiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgICAgICBcImBvcHRzLnRoYWxsaXVtYCBtdXN0IGJlIGEgVGhhbGxpdW0gaW5zdGFuY2UgaWYgcGFzc2VkXCIpXG4gICAgfVxufVxuXG5mdW5jdGlvbiBvblJlYWR5KGluaXQpIHtcbiAgICBpZiAoRC5kb2N1bWVudC5ib2R5ICE9IG51bGwpIHJldHVybiBQcm9taXNlLnJlc29sdmUoaW5pdCgpKVxuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSkge1xuICAgICAgICBELmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJET01Db250ZW50TG9hZGVkXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJlc29sdmUoaW5pdCgpKVxuICAgICAgICB9LCBmYWxzZSlcbiAgICB9KVxufVxuXG5mdW5jdGlvbiBET00ob3B0cykge1xuICAgIHRoaXMuX29wdHMgPSBvcHRzXG4gICAgdGhpcy5fZGVzdHJveVByb21pc2UgPSB1bmRlZmluZWRcbiAgICB0aGlzLl9kYXRhID0gb25SZWFkeShmdW5jdGlvbiAoKSB7XG4gICAgICAgIHNldERlZmF1bHRzQ2hlY2tlZChvcHRzKVxuICAgICAgICBpZiAoIUQuZG9jdW1lbnQudGl0bGUpIEQuZG9jdW1lbnQudGl0bGUgPSBvcHRzLnRpdGxlXG4gICAgICAgIGluamVjdFN0eWxlcygpXG4gICAgICAgIHZhciBkYXRhID0gVmlldy5pbml0KG9wdHMpXG5cbiAgICAgICAgb3B0cy50aGFsbGl1bS5yZXBvcnRlcihyZXBvcnRlciwgZGF0YS5zdGF0ZSlcbiAgICAgICAgcmV0dXJuIGRhdGFcbiAgICB9KVxufVxuXG5tZXRob2RzKERPTSwge1xuICAgIHJ1bjogZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5fZGVzdHJveVByb21pc2UgIT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgICBcIlRoZSB0ZXN0IHN1aXRlIG11c3Qgbm90IGJlIHJ1biBhZnRlciB0aGUgdmlldyBoYXMgYmVlbiBcIiArXG4gICAgICAgICAgICAgICAgXCJkZXRhY2hlZC5cIlxuICAgICAgICAgICAgKSlcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBvcHRzID0gdGhpcy5fb3B0c1xuXG4gICAgICAgIHJldHVybiB0aGlzLl9kYXRhLnRoZW4oZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICAgIHJldHVybiBydW5UZXN0cyhvcHRzLCBkYXRhLnN0YXRlKVxuICAgICAgICB9KVxuICAgIH0sXG5cbiAgICBkZXRhY2g6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMuX2Rlc3Ryb3lQcm9taXNlICE9IG51bGwpIHJldHVybiB0aGlzLl9kZXN0cm95UHJvbWlzZVxuICAgICAgICB2YXIgc2VsZiA9IHRoaXNcblxuICAgICAgICByZXR1cm4gdGhpcy5fZGVzdHJveVByb21pc2UgPSBzZWxmLl9kYXRhLnRoZW4oZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICAgIGRhdGEuc3RhdGUubG9ja2VkID0gdHJ1ZVxuICAgICAgICAgICAgaWYgKGRhdGEuc3RhdGUuY3VycmVudFByb21pc2UgPT0gbnVsbCkgcmV0dXJuIGRhdGFcbiAgICAgICAgICAgIHJldHVybiBkYXRhLnN0YXRlLmN1cnJlbnRQcm9taXNlLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gZGF0YSB9KVxuICAgICAgICB9KVxuICAgICAgICAudGhlbihmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgICAgc2VsZi5fb3B0cyA9IHVuZGVmaW5lZFxuICAgICAgICAgICAgc2VsZi5fZGF0YSA9IHNlbGYuX2Rlc3Ryb3lQcm9taXNlXG5cbiAgICAgICAgICAgIHdoaWxlIChkYXRhLnJvb3QuZmlyc3RDaGlsZCkge1xuICAgICAgICAgICAgICAgIGRhdGEucm9vdC5yZW1vdmVDaGlsZChkYXRhLnJvb3QuZmlyc3RDaGlsZClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9LFxufSlcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAob3B0cykge1xuICAgIHJldHVybiBuZXcgRE9NKG9wdHMpXG59XG4iLCJcInVzZSBzdHJpY3RcIlxuXG52YXIgVXRpbCA9IHJlcXVpcmUoXCIuLi91dGlsXCIpXG52YXIgRCA9IHJlcXVpcmUoXCIuL2luamVjdFwiKVxuXG4vKipcbiAqIFRoZSByZXBvcnRlciBzdHlsZXNoZWV0LiBIZXJlJ3MgdGhlIGZvcm1hdDpcbiAqXG4gKiAvLyBTaW5nbGUgaXRlbVxuICogXCIuc2VsZWN0b3JcIjoge1xuICogICAgIC8vIHByb3BzLi4uXG4gKiB9XG4gKlxuICogLy8gRHVwbGljYXRlIGVudHJpZXNcbiAqIFwiLnNlbGVjdG9yXCI6IHtcbiAqICAgICBcInByb3BcIjogW1xuICogICAgICAgICAvLyB2YWx1ZXMuLi5cbiAqICAgICBdLFxuICogfVxuICpcbiAqIC8vIER1cGxpY2F0ZSBzZWxlY3RvcnNcbiAqIFwiLnNlbGVjdG9yXCI6IFtcbiAqICAgICAvLyB2YWx1ZXMuLi5cbiAqIF1cbiAqXG4gKiAvLyBNZWRpYSBxdWVyeVxuICogXCJAbWVkaWEgc2NyZWVuXCI6IHtcbiAqICAgICAvLyBzZWxlY3RvcnMuLi5cbiAqIH1cbiAqXG4gKiBOb3RlIHRoYXQgQ1NTIHN0cmluZ3MgKm11c3QqIGJlIHF1b3RlZCBpbnNpZGUgdGhlIHZhbHVlLlxuICovXG5cbnZhciBzdHlsZXMgPSBVdGlsLmxhenkoZnVuY3Rpb24gKCkge1xuICAgIHZhciBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5XG5cbiAgICAvKipcbiAgICAgKiBQYXJ0aWFsbHkgdGFrZW4gYW5kIGFkYXB0ZWQgZnJvbSBub3JtYWxpemUuY3NzIChsaWNlbnNlZCB1bmRlciB0aGUgTUlUXG4gICAgICogTGljZW5zZSkuXG4gICAgICogaHR0cHM6Ly9naXRodWIuY29tL25lY29sYXMvbm9ybWFsaXplLmNzc1xuICAgICAqL1xuICAgIHZhciBzdHlsZU9iamVjdCA9IHtcbiAgICAgICAgXCIjdGxcIjoge1xuICAgICAgICAgICAgXCJmb250LWZhbWlseVwiOiBcInNhbnMtc2VyaWZcIixcbiAgICAgICAgICAgIFwibGluZS1oZWlnaHRcIjogXCIxLjE1XCIsXG4gICAgICAgICAgICBcIi1tcy10ZXh0LXNpemUtYWRqdXN0XCI6IFwiMTAwJVwiLFxuICAgICAgICAgICAgXCItd2Via2l0LXRleHQtc2l6ZS1hZGp1c3RcIjogXCIxMDAlXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgYnV0dG9uXCI6IHtcbiAgICAgICAgICAgIFwiZm9udC1mYW1pbHlcIjogXCJzYW5zLXNlcmlmXCIsXG4gICAgICAgICAgICBcImxpbmUtaGVpZ2h0XCI6IFwiMS4xNVwiLFxuICAgICAgICAgICAgXCJvdmVyZmxvd1wiOiBcInZpc2libGVcIixcbiAgICAgICAgICAgIFwiZm9udC1zaXplXCI6IFwiMTAwJVwiLFxuICAgICAgICAgICAgXCJtYXJnaW5cIjogXCIwXCIsXG4gICAgICAgICAgICBcInRleHQtdHJhbnNmb3JtXCI6IFwibm9uZVwiLFxuICAgICAgICAgICAgXCItd2Via2l0LWFwcGVhcmFuY2VcIjogXCJidXR0b25cIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCBoMVwiOiB7XG4gICAgICAgICAgICBcImZvbnQtc2l6ZVwiOiBcIjJlbVwiLFxuICAgICAgICAgICAgXCJtYXJnaW5cIjogXCIwLjY3ZW0gMFwiLFxuICAgICAgICB9LFxuXG4gICAgICAgIFwiI3RsIGFcIjoge1xuICAgICAgICAgICAgXCJiYWNrZ3JvdW5kLWNvbG9yXCI6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgICAgICAgIFwiLXdlYmtpdC10ZXh0LWRlY29yYXRpb24tc2tpcFwiOiBcIm9iamVjdHNcIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCBhOmFjdGl2ZSwgI3RsIGE6aG92ZXJcIjoge1xuICAgICAgICAgICAgXCJvdXRsaW5lLXdpZHRoXCI6IFwiMFwiLFxuICAgICAgICB9LFxuXG4gICAgICAgIFwiI3RsIGJ1dHRvbjo6LW1vei1mb2N1cy1pbm5lclwiOiB7XG4gICAgICAgICAgICBcImJvcmRlci1zdHlsZVwiOiBcIm5vbmVcIixcbiAgICAgICAgICAgIFwicGFkZGluZ1wiOiBcIjBcIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCBidXR0b246LW1vei1mb2N1c3JpbmdcIjoge1xuICAgICAgICAgICAgb3V0bGluZTogXCIxcHggZG90dGVkIEJ1dHRvblRleHRcIixcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQmFzZSBzdHlsZXMuIE5vdGUgdGhhdCB0aGlzIENTUyBpcyBkZXNpZ25lZCB0byBpbnRlbnRpb25hbGx5IG92ZXJyaWRlXG4gICAgICAgICAqIG1vc3QgdGhpbmdzIHRoYXQgY291bGQgcHJvcGFnYXRlLlxuICAgICAgICAgKi9cbiAgICAgICAgXCIjdGwgKlwiOiBbXG4gICAgICAgICAgICB7XCJ0ZXh0LWFsaWduXCI6IFwibGVmdFwifSxcbiAgICAgICAgICAgIHtcInRleHQtYWxpZ25cIjogXCJzdGFydFwifSxcbiAgICAgICAgXSxcblxuICAgICAgICBcIiN0bCAudGwtcmVwb3J0LCAjdGwgLnRsLXJlcG9ydCB1bFwiOiB7XG4gICAgICAgICAgICBcImxpc3Qtc3R5bGUtdHlwZVwiOiBcIm5vbmVcIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCBsaSB+IC50bC1zdWl0ZVwiOiB7XG4gICAgICAgICAgICBcInBhZGRpbmctdG9wXCI6IFwiMWVtXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLXN1aXRlID4gaDJcIjoge1xuICAgICAgICAgICAgXCJjb2xvclwiOiBcImJsYWNrXCIsXG4gICAgICAgICAgICBcImZvbnQtc2l6ZVwiOiBcIjEuNWVtXCIsXG4gICAgICAgICAgICBcImZvbnQtd2VpZ2h0XCI6IFwiYm9sZFwiLFxuICAgICAgICAgICAgXCJtYXJnaW4tYm90dG9tXCI6IFwiMC41ZW1cIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCAudGwtc3VpdGUgLnRsLXN1aXRlID4gaDJcIjoge1xuICAgICAgICAgICAgXCJmb250LXNpemVcIjogXCIxLjJlbVwiLFxuICAgICAgICAgICAgXCJtYXJnaW4tYm90dG9tXCI6IFwiMC4zZW1cIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCAudGwtc3VpdGUgLnRsLXN1aXRlIC50bC1zdWl0ZSA+IGgyXCI6IHtcbiAgICAgICAgICAgIFwiZm9udC1zaXplXCI6IFwiMS4yZW1cIixcbiAgICAgICAgICAgIFwibWFyZ2luLWJvdHRvbVwiOiBcIjAuMmVtXCIsXG4gICAgICAgICAgICBcImZvbnQtd2VpZ2h0XCI6IFwibm9ybWFsXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLXRlc3QgPiBoMlwiOiB7XG4gICAgICAgICAgICBcImNvbG9yXCI6IFwiYmxhY2tcIixcbiAgICAgICAgICAgIFwiZm9udC1zaXplXCI6IFwiMWVtXCIsXG4gICAgICAgICAgICBcImZvbnQtd2VpZ2h0XCI6IFwibm9ybWFsXCIsXG4gICAgICAgICAgICBcIm1hcmdpblwiOiBcIjBcIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCAudGwtdGVzdCA+IDpmaXJzdC1jaGlsZDo6YmVmb3JlXCI6IHtcbiAgICAgICAgICAgIFwiZGlzcGxheVwiOiBcImlubGluZS1ibG9ja1wiLFxuICAgICAgICAgICAgXCJmb250LXdlaWdodFwiOiBcImJvbGRcIixcbiAgICAgICAgICAgIFwid2lkdGhcIjogXCIxLjJlbVwiLFxuICAgICAgICAgICAgXCJ0ZXh0LWFsaWduXCI6IFwiY2VudGVyXCIsXG4gICAgICAgICAgICBcImZvbnQtZmFtaWx5XCI6IFwic2Fucy1zZXJpZlwiLFxuICAgICAgICAgICAgXCJ0ZXh0LXNoYWRvd1wiOiBcIjAgM3B4IDJweCAjOTY5Njk2XCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLXRlc3QudGwtZmFpbCA+IGgyLCAjdGwgLnRsLXRlc3QudGwtZXJyb3IgPiBoMlwiOiB7XG4gICAgICAgICAgICBjb2xvcjogXCIjYzAwXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLXRlc3QudGwtc2tpcCA+IGgyXCI6IHtcbiAgICAgICAgICAgIGNvbG9yOiBcIiMwOGNcIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCAudGwtdGVzdC50bC1wYXNzID4gOmZpcnN0LWNoaWxkOjpiZWZvcmVcIjoge1xuICAgICAgICAgICAgY29udGVudDogXCIn4pyTJ1wiLFxuICAgICAgICAgICAgY29sb3I6IFwiIzBjMFwiLFxuICAgICAgICB9LFxuXG4gICAgICAgIFwiI3RsIC50bC10ZXN0LnRsLWZhaWwgPiA6Zmlyc3QtY2hpbGQ6OmJlZm9yZVwiOiB7XG4gICAgICAgICAgICBjb250ZW50OiBcIifinJYnXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLXRlc3QudGwtZXJyb3IgPiA6Zmlyc3QtY2hpbGQ6OmJlZm9yZVwiOiB7XG4gICAgICAgICAgICBjb250ZW50OiBcIichJ1wiLFxuICAgICAgICB9LFxuXG4gICAgICAgIFwiI3RsIC50bC10ZXN0LnRsLXNraXAgPiA6Zmlyc3QtY2hpbGQ6OmJlZm9yZVwiOiB7XG4gICAgICAgICAgICBjb250ZW50OiBcIifiiJInXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLXByZSwgI3RsIC50bC1kaWZmLWhlYWRlclwiOiB7XG4gICAgICAgICAgICAvLyBub3JtYWxpemUuY3NzOiBDb3JyZWN0IHRoZSBpbmhlcml0YW5jZSBhbmQgc2NhbGluZyBvZiBmb250IHNpemVcbiAgICAgICAgICAgIC8vIGluIGFsbCBicm93c2Vyc1xuICAgICAgICAgICAgXCJmb250LWZhbWlseVwiOiBcIm1vbm9zcGFjZSwgbW9ub3NwYWNlXCIsXG4gICAgICAgICAgICBcImJhY2tncm91bmRcIjogXCIjZjBmMGYwXCIsXG4gICAgICAgICAgICBcIndoaXRlLXNwYWNlXCI6IFwicHJlXCIsXG4gICAgICAgICAgICBcImZvbnQtc2l6ZVwiOiBcIjAuODVlbVwiLFxuICAgICAgICB9LFxuXG4gICAgICAgIFwiI3RsIC50bC1wcmVcIjoge1xuICAgICAgICAgIFwibWluLXdpZHRoXCI6IFwiMTAwJVwiLFxuICAgICAgICAgIFwiZmxvYXRcIjogXCJsZWZ0XCIsXG4gICAgICAgICAgXCJjbGVhclwiOiBcImxlZnRcIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCAudGwtbGluZVwiOiB7XG4gICAgICAgICAgICBcImRpc3BsYXlcIjogXCJibG9ja1wiLFxuICAgICAgICAgICAgXCJtYXJnaW5cIjogXCIwIDAuMjVlbVwiLFxuICAgICAgICAgICAgXCJ3aWR0aFwiOiBcIjk5JVwiLCAvLyBCZWNhdXNlIEZpcmVmb3ggc3Vja3NcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCAudGwtZGlmZi1oZWFkZXIgPiAqXCI6IHtcbiAgICAgICAgICAgIHBhZGRpbmc6IFwiMC4yNWVtXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLWRpZmYtaGVhZGVyXCI6IHtcbiAgICAgICAgICAgIFwicGFkZGluZ1wiOiBcIjAuMjVlbVwiLFxuICAgICAgICAgICAgXCJtYXJnaW4tYm90dG9tXCI6IFwiMC41ZW1cIixcbiAgICAgICAgICAgIFwiZGlzcGxheVwiOiBcImlubGluZS1ibG9ja1wiLFxuICAgICAgICB9LFxuXG4gICAgICAgIFwiI3RsIC50bC1saW5lOmZpcnN0LWNoaWxkLCAjdGwgLnRsLWRpZmYtaGVhZGVyIH4gLnRsLWxpbmVcIjoge1xuICAgICAgICAgICAgXCJwYWRkaW5nLXRvcFwiOiBcIjAuMjVlbVwiLFxuICAgICAgICB9LFxuXG4gICAgICAgIFwiI3RsIC50bC1saW5lOmxhc3QtY2hpbGRcIjoge1xuICAgICAgICAgICAgXCJwYWRkaW5nLWJvdHRvbVwiOiBcIjAuMjVlbVwiLFxuICAgICAgICB9LFxuXG4gICAgICAgIFwiI3RsIC50bC1mYWlsIC50bC1kaXNwbGF5XCI6IHtcbiAgICAgICAgICAgIG1hcmdpbjogXCIwLjVlbVwiLFxuICAgICAgICB9LFxuXG4gICAgICAgIFwiI3RsIC50bC1kaXNwbGF5ID4gKlwiOiB7XG4gICAgICAgICAgICBvdmVyZmxvdzogXCJhdXRvXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLWRpc3BsYXkgPiA6bm90KDpsYXN0LWNoaWxkKVwiOiB7XG4gICAgICAgICAgICBcIm1hcmdpbi1ib3R0b21cIjogXCIwLjVlbVwiLFxuICAgICAgICB9LFxuXG4gICAgICAgIFwiI3RsIC50bC1kaWZmLWFkZGVkXCI6IHtcbiAgICAgICAgICAgIFwiY29sb3JcIjogXCIjMGMwXCIsXG4gICAgICAgICAgICBcImZvbnQtd2VpZ2h0XCI6IFwiYm9sZFwiLFxuICAgICAgICB9LFxuXG4gICAgICAgIFwiI3RsIC50bC1kaWZmLXJlbW92ZWRcIjoge1xuICAgICAgICAgICAgXCJjb2xvclwiOiBcIiNjMDBcIixcbiAgICAgICAgICAgIFwiZm9udC13ZWlnaHRcIjogXCJib2xkXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLXN0YWNrIC50bC1saW5lXCI6IHtcbiAgICAgICAgICAgIGNvbG9yOiBcIiM4MDBcIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCAudGwtZGlmZjo6YmVmb3JlLCAjdGwgLnRsLXN0YWNrOjpiZWZvcmVcIjoge1xuICAgICAgICAgICAgXCJmb250LXdlaWdodFwiOiBcIm5vcm1hbFwiLFxuICAgICAgICAgICAgXCJtYXJnaW5cIjogXCIwLjI1ZW0gMC4yNWVtIDAuMjVlbSAwXCIsXG4gICAgICAgICAgICBcImRpc3BsYXlcIjogXCJibG9ja1wiLFxuICAgICAgICAgICAgXCJmb250LXN0eWxlXCI6IFwiaXRhbGljXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLWRpZmY6OmJlZm9yZVwiOiB7XG4gICAgICAgICAgICBjb250ZW50OiBcIidEaWZmOidcIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCAudGwtc3RhY2s6OmJlZm9yZVwiOiB7XG4gICAgICAgICAgICBjb250ZW50OiBcIidTdGFjazonXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLWhlYWRlclwiOiB7XG4gICAgICAgICAgICBcInRleHQtYWxpZ25cIjogXCJyaWdodFwiLFxuICAgICAgICB9LFxuXG4gICAgICAgIFwiI3RsIC50bC1oZWFkZXIgPiAqXCI6IHtcbiAgICAgICAgICAgIFwiZGlzcGxheVwiOiBcImlubGluZS1ibG9ja1wiLFxuICAgICAgICAgICAgXCJ0ZXh0LWFsaWduXCI6IFwiY2VudGVyXCIsXG4gICAgICAgICAgICBcInBhZGRpbmdcIjogXCIwLjVlbSAwLjc1ZW1cIixcbiAgICAgICAgICAgIFwiYm9yZGVyXCI6IFwiMnB4IHNvbGlkICMwMGNcIixcbiAgICAgICAgICAgIFwiYm9yZGVyLXJhZGl1c1wiOiBcIjFlbVwiLFxuICAgICAgICAgICAgXCJiYWNrZ3JvdW5kLWNvbG9yXCI6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgICAgICAgIFwibWFyZ2luXCI6IFwiMC4yNWVtIDAuNWVtXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLWhlYWRlciA+IDpmb2N1c1wiOiB7XG4gICAgICAgICAgICBvdXRsaW5lOiBcIm5vbmVcIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCAudGwtcnVuXCI6IHtcbiAgICAgICAgICAgIFwiYm9yZGVyLWNvbG9yXCI6IFwiIzA4MFwiLFxuICAgICAgICAgICAgXCJiYWNrZ3JvdW5kLWNvbG9yXCI6IFwiIzBjMFwiLFxuICAgICAgICAgICAgXCJjb2xvclwiOiBcIndoaXRlXCIsXG4gICAgICAgICAgICBcIndpZHRoXCI6IFwiNmVtXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLXJ1bjpob3ZlclwiOiB7XG4gICAgICAgICAgICBcImJhY2tncm91bmQtY29sb3JcIjogXCIjOGM4XCIsXG4gICAgICAgICAgICBcImNvbG9yXCI6IFwid2hpdGVcIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCAudGwtdG9nZ2xlLnRsLXBhc3NcIjoge1xuICAgICAgICAgICAgXCJib3JkZXItY29sb3JcIjogXCIjMGMwXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLXRvZ2dsZS50bC1mYWlsXCI6IHtcbiAgICAgICAgICAgIFwiYm9yZGVyLWNvbG9yXCI6IFwiI2MwMFwiLFxuICAgICAgICB9LFxuXG4gICAgICAgIFwiI3RsIC50bC10b2dnbGUudGwtc2tpcFwiOiB7XG4gICAgICAgICAgICBcImJvcmRlci1jb2xvclwiOiBcIiMwOGNcIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCAudGwtdG9nZ2xlLnRsLXBhc3MudGwtYWN0aXZlLCAjdGwgLnRsLXRvZ2dsZS50bC1wYXNzOmFjdGl2ZVwiOiB7XG4gICAgICAgICAgICBcImJvcmRlci1jb2xvclwiOiBcIiMwODBcIixcbiAgICAgICAgICAgIFwiYmFja2dyb3VuZC1jb2xvclwiOiBcIiMwYzBcIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCAudGwtdG9nZ2xlLnRsLWZhaWwudGwtYWN0aXZlLCAjdGwgLnRsLXRvZ2dsZS50bC1mYWlsOmFjdGl2ZVwiOiB7XG4gICAgICAgICAgICBcImJvcmRlci1jb2xvclwiOiBcIiM4MDBcIixcbiAgICAgICAgICAgIFwiYmFja2dyb3VuZC1jb2xvclwiOiBcIiNjMDBcIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCAudGwtdG9nZ2xlLnRsLXNraXAudGwtYWN0aXZlLCAjdGwgLnRsLXRvZ2dsZS50bC1za2lwOmFjdGl2ZVwiOiB7XG4gICAgICAgICAgICBcImJvcmRlci1jb2xvclwiOiBcIiMwNThcIixcbiAgICAgICAgICAgIFwiYmFja2dyb3VuZC1jb2xvclwiOiBcIiMwOGNcIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCAudGwtdG9nZ2xlLnRsLXBhc3M6aG92ZXJcIjoge1xuICAgICAgICAgICAgXCJib3JkZXItY29sb3JcIjogXCIjMGMwXCIsXG4gICAgICAgICAgICBcImJhY2tncm91bmQtY29sb3JcIjogXCIjYWZhXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLXRvZ2dsZS50bC1mYWlsOmhvdmVyXCI6IHtcbiAgICAgICAgICAgIFwiYm9yZGVyLWNvbG9yXCI6IFwiI2MwMFwiLFxuICAgICAgICAgICAgXCJiYWNrZ3JvdW5kLWNvbG9yXCI6IFwiI2ZhYVwiLFxuICAgICAgICB9LFxuXG4gICAgICAgIFwiI3RsIC50bC10b2dnbGUudGwtc2tpcDpob3ZlclwiOiB7XG4gICAgICAgICAgICBcImJvcmRlci1jb2xvclwiOiBcIiMwOGNcIixcbiAgICAgICAgICAgIFwiYmFja2dyb3VuZC1jb2xvclwiOiBcIiNiZGZcIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCAudGwtcmVwb3J0LnRsLXBhc3MgLnRsLXRlc3Q6bm90KC50bC1wYXNzKVwiOiB7XG4gICAgICAgICAgICBkaXNwbGF5OiBcIm5vbmVcIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCAudGwtcmVwb3J0LnRsLWZhaWwgLnRsLXRlc3Q6bm90KC50bC1mYWlsKVwiOiB7XG4gICAgICAgICAgICBkaXNwbGF5OiBcIm5vbmVcIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCAudGwtcmVwb3J0LnRsLXNraXAgLnRsLXRlc3Q6bm90KC50bC1za2lwKVwiOiB7XG4gICAgICAgICAgICBkaXNwbGF5OiBcIm5vbmVcIixcbiAgICAgICAgfSxcbiAgICB9XG5cbiAgICB2YXIgY3NzID0gXCJcIlxuXG4gICAgZnVuY3Rpb24gYXBwZW5kQmFzZShzZWxlY3RvciwgcHJvcHMpIHtcbiAgICAgICAgY3NzICs9IHNlbGVjdG9yICsgXCJ7XCJcblxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShwcm9wcykpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBhcHBlbmRQcm9wcyhwcm9wc1tpXSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGFwcGVuZFByb3BzKHByb3BzKVxuICAgICAgICB9XG5cbiAgICAgICAgY3NzICs9IFwifVwiXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYXBwZW5kUHJvcHMocHJvcHMpIHtcbiAgICAgICAgZm9yICh2YXIga2V5IGluIHByb3BzKSB7XG4gICAgICAgICAgICBpZiAoaGFzT3duLmNhbGwocHJvcHMsIGtleSkpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHByb3BzW2tleV0gPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgICAgICAgICAgYXBwZW5kQmFzZShrZXksIHByb3BzW2tleV0pXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY3NzICs9IGtleSArIFwiOlwiICsgcHJvcHNba2V5XSArIFwiO1wiXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZm9yICh2YXIgc2VsZWN0b3IgaW4gc3R5bGVPYmplY3QpIHtcbiAgICAgICAgaWYgKGhhc093bi5jYWxsKHN0eWxlT2JqZWN0LCBzZWxlY3RvcikpIHtcbiAgICAgICAgICAgIGFwcGVuZEJhc2Uoc2VsZWN0b3IsIHN0eWxlT2JqZWN0W3NlbGVjdG9yXSlcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBjc3MuY29uY2F0KCkgLy8gSGludCB0byBmbGF0dGVuLlxufSlcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKEQuZG9jdW1lbnQuaGVhZC5xdWVyeVNlbGVjdG9yKFwic3R5bGVbZGF0YS10bC1zdHlsZV1cIikgPT0gbnVsbCkge1xuICAgICAgICB2YXIgc3R5bGUgPSBELmRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzdHlsZVwiKVxuXG4gICAgICAgIHN0eWxlLnR5cGUgPSBcInRleHQvY3NzXCJcbiAgICAgICAgc3R5bGUuc2V0QXR0cmlidXRlKFwiZGF0YS10bC1zdHlsZVwiLCBcIlwiKVxuICAgICAgICBpZiAoc3R5bGUuc3R5bGVTaGVldCkge1xuICAgICAgICAgICAgc3R5bGUuc3R5bGVTaGVldC5jc3NUZXh0ID0gc3R5bGVzKClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHN0eWxlLmFwcGVuZENoaWxkKEQuZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoc3R5bGVzKCkpKVxuICAgICAgICB9XG5cbiAgICAgICAgRC5kb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHN0eWxlKVxuICAgIH1cbn1cbiIsIlwidXNlIHN0cmljdFwiXG5cbi8qKlxuICogVGhlIGdsb2JhbCBpbmplY3Rpb25zIGZvciB0aGUgRE9NLiBNYWlubHkgZm9yIGRlYnVnZ2luZy5cbiAqL1xuXG5leHBvcnRzLmRvY3VtZW50ID0gZ2xvYmFsLmRvY3VtZW50XG5leHBvcnRzLndpbmRvdyA9IGdsb2JhbC53aW5kb3dcbiIsIlwidXNlIHN0cmljdFwiXG5cbnZhciBVdGlsID0gcmVxdWlyZShcIi4uL3V0aWxcIilcbnZhciBEID0gcmVxdWlyZShcIi4vaW5qZWN0XCIpXG52YXIgbm93ID0gRGF0ZS5ub3cgLy8gQXZvaWQgU2lub24ncyBtb2NrXG52YXIgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eVxuXG4vKipcbiAqIFRlc3QgcnVubmVyIGFuZCBzY3JpcHQgbG9hZGVyXG4gKi9cblxuZnVuY3Rpb24gdW5jYWNoZWQoZmlsZSkge1xuICAgIGlmIChmaWxlLmluZGV4T2YoXCI/XCIpIDwgMCkge1xuICAgICAgICByZXR1cm4gZmlsZSArIFwiP2xvYWRlZD1cIiArIG5vdygpXG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGZpbGUgKyBcIiZsb2FkZWQ9XCIgKyBub3coKVxuICAgIH1cbn1cblxuZnVuY3Rpb24gbG9hZFNjcmlwdChmaWxlLCB0aW1lb3V0KSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgdmFyIHNjcmlwdCA9IEQuZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNjcmlwdFwiKVxuICAgICAgICB2YXIgdGltZXIgPSBnbG9iYWwuc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjbGVhcigpXG4gICAgICAgICAgICByZWplY3QobmV3IEVycm9yKFwiVGltZW91dCBleGNlZWRlZCBsb2FkaW5nICdcIiArIGZpbGUgKyBcIidcIikpXG4gICAgICAgIH0sIHRpbWVvdXQpXG5cbiAgICAgICAgZnVuY3Rpb24gY2xlYXIoZXYpIHtcbiAgICAgICAgICAgIGlmIChldiAhPSBudWxsKSBldi5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICAgICAgICBpZiAoZXYgIT0gbnVsbCkgZXYuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgICAgICAgIGdsb2JhbC5jbGVhclRpbWVvdXQodGltZXIpXG4gICAgICAgICAgICBzY3JpcHQub25sb2FkID0gdW5kZWZpbmVkXG4gICAgICAgICAgICBzY3JpcHQub25lcnJvciA9IHVuZGVmaW5lZFxuICAgICAgICAgICAgRC5kb2N1bWVudC5oZWFkLnJlbW92ZUNoaWxkKHNjcmlwdClcbiAgICAgICAgfVxuXG4gICAgICAgIHNjcmlwdC5zcmMgPSB1bmNhY2hlZChmaWxlKVxuICAgICAgICBzY3JpcHQuYXN5bmMgPSB0cnVlXG4gICAgICAgIHNjcmlwdC5kZWZlciA9IHRydWVcbiAgICAgICAgc2NyaXB0Lm9ubG9hZCA9IGZ1bmN0aW9uIChldikge1xuICAgICAgICAgICAgY2xlYXIoZXYpXG4gICAgICAgICAgICByZXNvbHZlKClcbiAgICAgICAgfVxuXG4gICAgICAgIHNjcmlwdC5vbmVycm9yID0gZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgICAgICBjbGVhcihldilcbiAgICAgICAgICAgIHJlamVjdChldilcbiAgICAgICAgfVxuXG4gICAgICAgIEQuZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzY3JpcHQpXG4gICAgfSlcbn1cblxuZnVuY3Rpb24gdHJ5RGVsZXRlKGtleSkge1xuICAgIHRyeSB7XG4gICAgICAgIGRlbGV0ZSBnbG9iYWxba2V5XVxuICAgIH0gY2F0Y2ggKF8pIHtcbiAgICAgICAgLy8gaWdub3JlXG4gICAgfVxufVxuXG5mdW5jdGlvbiBkZXNjcmlwdG9yQ2hhbmdlZChhLCBiKSB7XG4gICAgLy8gTm90ZTogaWYgdGhlIGRlc2NyaXB0b3Igd2FzIHJlbW92ZWQsIGl0IHdvdWxkJ3ZlIGJlZW4gZGVsZXRlZCwgYW55d2F5cy5cbiAgICBpZiAoYSA9PSBudWxsKSByZXR1cm4gZmFsc2VcbiAgICBpZiAoYS5jb25maWd1cmFibGUgIT09IGIuY29uZmlndXJhYmxlKSByZXR1cm4gdHJ1ZVxuICAgIGlmIChhLmVudW1lcmFibGUgIT09IGIuZW51bWVyYWJsZSkgcmV0dXJuIHRydWVcbiAgICBpZiAoYS53cml0YWJsZSAhPT0gYi53cml0YWJsZSkgcmV0dXJuIHRydWVcbiAgICBpZiAoYS5nZXQgIT09IGIuZ2V0KSByZXR1cm4gdHJ1ZVxuICAgIGlmIChhLnNldCAhPT0gYi5zZXQpIHJldHVybiB0cnVlXG4gICAgaWYgKGEudmFsdWUgIT09IGIudmFsdWUpIHJldHVybiB0cnVlXG4gICAgcmV0dXJuIGZhbHNlXG59XG5cbi8vIFRoZXNlIGZpcmUgZGVwcmVjYXRpb24gd2FybmluZ3MsIGFuZCB0aHVzIHNob3VsZCBiZSBhdm9pZGVkLlxudmFyIGJsYWNrbGlzdCA9IE9iamVjdC5mcmVlemUoe1xuICAgIHdlYmtpdFN0b3JhZ2VJbmZvOiB0cnVlLFxuICAgIHdlYmtpdEluZGV4ZWREQjogdHJ1ZSxcbn0pXG5cbmZ1bmN0aW9uIGZpbmRHbG9iYWxzKCkge1xuICAgIHZhciBmb3VuZCA9IE9iamVjdC5rZXlzKGdsb2JhbClcbiAgICB2YXIgZ2xvYmFscyA9IE9iamVjdC5jcmVhdGUobnVsbClcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZm91bmQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGtleSA9IGZvdW5kW2ldXG5cbiAgICAgICAgaWYgKCFoYXNPd24uY2FsbChibGFja2xpc3QsIGtleSkpIHtcbiAgICAgICAgICAgIGdsb2JhbHNba2V5XSA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IoZ2xvYmFsLCBrZXkpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZ2xvYmFsc1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChvcHRzLCBzdGF0ZSkge1xuICAgIGlmIChzdGF0ZS5sb2NrZWQpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcihcbiAgICAgICAgICAgIFwiVGhlIHRlc3Qgc3VpdGUgbXVzdCBub3QgYmUgcnVuIGFmdGVyIHRoZSB2aWV3IGhhcyBiZWVuIGRldGFjaGVkLlwiXG4gICAgICAgICkpXG4gICAgfVxuXG4gICAgaWYgKHN0YXRlLmN1cnJlbnRQcm9taXNlICE9IG51bGwpIHJldHVybiBzdGF0ZS5jdXJyZW50UHJvbWlzZVxuXG4gICAgb3B0cy50aGFsbGl1bS5jbGVhclRlc3RzKClcblxuICAgIC8vIERldGVjdCBhbmQgcmVtb3ZlIGdsb2JhbHMgY3JlYXRlZCBieSBsb2FkZWQgc2NyaXB0cy5cbiAgICB2YXIgZ2xvYmFscyA9IGZpbmRHbG9iYWxzKClcblxuICAgIGZ1bmN0aW9uIGNsZWFudXAoKSB7XG4gICAgICAgIHZhciBmb3VuZCA9IE9iamVjdC5rZXlzKGdsb2JhbClcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGZvdW5kLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIga2V5ID0gZm91bmRbaV1cblxuICAgICAgICAgICAgaWYgKCFoYXNPd24uY2FsbChnbG9iYWxzLCBrZXkpKSB7XG4gICAgICAgICAgICAgICAgdHJ5RGVsZXRlKGtleSlcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZGVzY3JpcHRvckNoYW5nZWQoXG4gICAgICAgICAgICAgICAgT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihnbG9iYWwsIGtleSksXG4gICAgICAgICAgICAgICAgZ2xvYmFsc1trZXldXG4gICAgICAgICAgICApKSB7XG4gICAgICAgICAgICAgICAgdHJ5RGVsZXRlKGtleSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHN0YXRlLmN1cnJlbnRQcm9taXNlID0gdW5kZWZpbmVkXG4gICAgfVxuXG4gICAgcmV0dXJuIHN0YXRlLmN1cnJlbnRQcm9taXNlID0gUHJvbWlzZS5yZXNvbHZlKClcbiAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgIHN0YXRlLnBhc3MudGV4dENvbnRlbnQgPSBcIjBcIlxuICAgICAgICBzdGF0ZS5mYWlsLnRleHRDb250ZW50ID0gXCIwXCJcbiAgICAgICAgc3RhdGUuc2tpcC50ZXh0Q29udGVudCA9IFwiMFwiXG4gICAgICAgIHJldHVybiBvcHRzLnByZWxvYWQoKVxuICAgIH0pXG4gICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gVXRpbC5wZWFjaChvcHRzLmZpbGVzLCBmdW5jdGlvbiAoZmlsZSkge1xuICAgICAgICAgICAgcmV0dXJuIGxvYWRTY3JpcHQoZmlsZSwgb3B0cy50aW1lb3V0KVxuICAgICAgICB9KVxuICAgIH0pXG4gICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gb3B0cy5wcmVydW4oKSB9KVxuICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIG9wdHMudGhhbGxpdW0ucnVuKCkgfSlcbiAgICAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiBvcHRzLnBvc3RydW4oKSB9KVxuICAgIC5jYXRjaChmdW5jdGlvbiAoZSkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG9wdHMuZXJyb3IoZSkpLnRoZW4oZnVuY3Rpb24gKCkgeyB0aHJvdyBlIH0pXG4gICAgfSlcbiAgICAudGhlbihcbiAgICAgICAgZnVuY3Rpb24gKCkgeyBjbGVhbnVwKCkgfSxcbiAgICAgICAgZnVuY3Rpb24gKGUpIHsgY2xlYW51cCgpOyB0aHJvdyBlIH0pXG59XG4iLCJcInVzZSBzdHJpY3RcIlxuXG52YXIgZGlmZiA9IHJlcXVpcmUoXCJkaWZmXCIpXG52YXIgUiA9IHJlcXVpcmUoXCIuLi9yZXBvcnRlclwiKVxudmFyIEQgPSByZXF1aXJlKFwiLi9pbmplY3RcIilcbnZhciBydW5UZXN0cyA9IHJlcXVpcmUoXCIuL3J1bi10ZXN0c1wiKVxudmFyIGluc3BlY3QgPSByZXF1aXJlKFwiY2xlYW4tYXNzZXJ0LXV0aWxcIikuaW5zcGVjdFxuXG4vKipcbiAqIFZpZXcgbG9naWNcbiAqL1xuXG5mdW5jdGlvbiB0KHRleHQpIHtcbiAgICByZXR1cm4gRC5kb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh0ZXh0KVxufVxuXG5mdW5jdGlvbiBoKHR5cGUsIGF0dHJzLCBjaGlsZHJlbikge1xuICAgIHZhciBwYXJ0cyA9IHR5cGUuc3BsaXQoL1xccysvZylcblxuICAgIGlmIChBcnJheS5pc0FycmF5KGF0dHJzKSkge1xuICAgICAgICBjaGlsZHJlbiA9IGF0dHJzXG4gICAgICAgIGF0dHJzID0gdW5kZWZpbmVkXG4gICAgfVxuXG4gICAgaWYgKGF0dHJzID09IG51bGwpIGF0dHJzID0ge31cbiAgICBpZiAoY2hpbGRyZW4gPT0gbnVsbCkgY2hpbGRyZW4gPSBbXVxuXG4gICAgdHlwZSA9IHBhcnRzWzBdXG4gICAgYXR0cnMuY2xhc3NOYW1lID0gcGFydHMuc2xpY2UoMSkuam9pbihcIiBcIilcblxuICAgIHZhciBlbGVtID0gRC5kb2N1bWVudC5jcmVhdGVFbGVtZW50KHR5cGUpXG5cbiAgICBPYmplY3Qua2V5cyhhdHRycykuZm9yRWFjaChmdW5jdGlvbiAoYXR0cikge1xuICAgICAgICBlbGVtW2F0dHJdID0gYXR0cnNbYXR0cl1cbiAgICB9KVxuXG4gICAgY2hpbGRyZW4uZm9yRWFjaChmdW5jdGlvbiAoY2hpbGQpIHtcbiAgICAgICAgaWYgKGNoaWxkICE9IG51bGwpIGVsZW0uYXBwZW5kQ2hpbGQoY2hpbGQpXG4gICAgfSlcblxuICAgIHJldHVybiBlbGVtXG59XG5cbmZ1bmN0aW9uIHVuaWZpZWREaWZmKGVycikge1xuICAgIHZhciBhY3R1YWwgPSBpbnNwZWN0KGVyci5hY3R1YWwpXG4gICAgdmFyIGV4cGVjdGVkID0gaW5zcGVjdChlcnIuZXhwZWN0ZWQpXG4gICAgdmFyIG1zZyA9IGRpZmYuY3JlYXRlUGF0Y2goXCJzdHJpbmdcIiwgYWN0dWFsLCBleHBlY3RlZClcbiAgICAgICAgLnNwbGl0KC9cXHI/XFxufFxcci9nKS5zbGljZSg0KVxuICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChsaW5lKSB7IHJldHVybiAhL15cXEBcXEB8XlxcXFwgTm8gbmV3bGluZS8udGVzdChsaW5lKSB9KVxuICAgIHZhciBlbmQgPSBtc2cubGVuZ3RoXG5cbiAgICB3aGlsZSAoZW5kICE9PSAwICYmIC9eXFxzKiQvZy50ZXN0KG1zZ1tlbmQgLSAxXSkpIGVuZC0tXG4gICAgcmV0dXJuIGgoXCJkaXYgdGwtZGlmZlwiLCBbXG4gICAgICAgIGgoXCJkaXYgdGwtZGlmZi1oZWFkZXJcIiwgW1xuICAgICAgICAgICAgaChcInNwYW4gdGwtZGlmZi1hZGRlZFwiLCBbdChcIisgZXhwZWN0ZWRcIildKSxcbiAgICAgICAgICAgIGgoXCJzcGFuIHRsLWRpZmYtcmVtb3ZlZFwiLCBbdChcIi0gYWN0dWFsXCIpXSksXG4gICAgICAgIF0pLFxuICAgICAgICBoKFwiZGl2IHRsLXByZVwiLCAhZW5kXG4gICAgICAgICAgICA/IFtoKFwic3BhbiB0bC1saW5lIHRsLWRpZmYtYWRkZWRcIiwgW3QoXCIgKG5vbmUpXCIpXSldXG4gICAgICAgICAgICA6IG1zZy5zbGljZSgwLCBlbmQpXG4gICAgICAgICAgICAubWFwKGZ1bmN0aW9uIChsaW5lKSB7IHJldHVybiBsaW5lLnRyaW1SaWdodCgpIH0pXG4gICAgICAgICAgICAubWFwKGZ1bmN0aW9uIChsaW5lKSB7XG4gICAgICAgICAgICAgICAgaWYgKGxpbmVbMF0gPT09IFwiK1wiKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBoKFwic3BhbiB0bC1saW5lIHRsLWRpZmYtYWRkZWRcIiwgW3QobGluZSldKVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobGluZVswXSA9PT0gXCItXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGgoXCJzcGFuIHRsLWxpbmUgdGwtZGlmZi1yZW1vdmVkXCIsIFt0KGxpbmUpXSlcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaChcInNwYW4gdGwtbGluZSB0bC1kaWZmLW5vbmVcIiwgW3QobGluZSldKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICksXG4gICAgXSlcbn1cblxuZnVuY3Rpb24gdG9MaW5lcyhzdHIpIHtcbiAgICByZXR1cm4gaChcImRpdiB0bC1wcmVcIiwgc3RyLnNwbGl0KC9cXHI/XFxufFxcci9nKS5tYXAoZnVuY3Rpb24gKGxpbmUpIHtcbiAgICAgICAgcmV0dXJuIGgoXCJzcGFuIHRsLWxpbmVcIiwgW3QobGluZS50cmltUmlnaHQoKSldKVxuICAgIH0pKVxufVxuXG5mdW5jdGlvbiBmb3JtYXRFcnJvcihlLCBzaG93RGlmZikge1xuICAgIHZhciBzdGFjayA9IFIucmVhZFN0YWNrKGUpXG5cbiAgICByZXR1cm4gaChcImRpdiB0bC1kaXNwbGF5XCIsIFtcbiAgICAgICAgaChcImRpdiB0bC1tZXNzYWdlXCIsIFt0b0xpbmVzKGUubmFtZSArIFwiOiBcIiArIGUubWVzc2FnZSldKSxcbiAgICAgICAgc2hvd0RpZmYgPyB1bmlmaWVkRGlmZihlKSA6IHVuZGVmaW5lZCxcbiAgICAgICAgc3RhY2sgPyBoKFwiZGl2IHRsLXN0YWNrXCIsIFt0b0xpbmVzKHN0YWNrKV0pIDogdW5kZWZpbmVkLFxuICAgIF0pXG59XG5cbmZ1bmN0aW9uIHNob3dUZXN0KF8sIHJlcG9ydCwgY2xhc3NOYW1lLCBjaGlsZCkge1xuICAgIHZhciBlbmQgPSByZXBvcnQucGF0aC5sZW5ndGggLSAxXG4gICAgdmFyIG5hbWUgPSByZXBvcnQucGF0aFtlbmRdLm5hbWVcbiAgICB2YXIgcGFyZW50ID0gXy5nZXQocmVwb3J0LnBhdGgsIGVuZClcbiAgICB2YXIgc3BlZWQgPSBSLnNwZWVkKHJlcG9ydClcblxuICAgIGlmIChzcGVlZCA9PT0gXCJmYXN0XCIpIHtcbiAgICAgICAgcGFyZW50Lm5vZGUuYXBwZW5kQ2hpbGQoaChcImxpIFwiICsgY2xhc3NOYW1lICsgXCIgdGwtZmFzdFwiLCBbXG4gICAgICAgICAgICBoKFwiaDJcIiwgW3QobmFtZSldKSxcbiAgICAgICAgICAgIGNoaWxkLFxuICAgICAgICBdKSlcbiAgICB9IGVsc2Uge1xuICAgICAgICBwYXJlbnQubm9kZS5hcHBlbmRDaGlsZChoKFwibGkgXCIgKyBjbGFzc05hbWUgKyBcIiB0bC1cIiArIHNwZWVkLCBbXG4gICAgICAgICAgICBoKFwiaDJcIiwgW1xuICAgICAgICAgICAgICAgIHQobmFtZSArIFwiIChcIiksXG4gICAgICAgICAgICAgICAgaChcInNwYW4gdGwtZHVyYXRpb25cIiwgW3QoUi5mb3JtYXRUaW1lKHJlcG9ydC5kdXJhdGlvbikpXSksXG4gICAgICAgICAgICAgICAgdChcIilcIiksXG4gICAgICAgICAgICBdKSxcbiAgICAgICAgICAgIGNoaWxkLFxuICAgICAgICBdKSlcbiAgICB9XG5cbiAgICBfLm9wdHMuZHVyYXRpb24udGV4dENvbnRlbnQgPSBSLmZvcm1hdFRpbWUoXy5kdXJhdGlvbilcbn1cblxuZnVuY3Rpb24gc2hvd1NraXAoXywgcmVwb3J0KSB7XG4gICAgdmFyIGVuZCA9IHJlcG9ydC5wYXRoLmxlbmd0aCAtIDFcbiAgICB2YXIgbmFtZSA9IHJlcG9ydC5wYXRoW2VuZF0ubmFtZVxuICAgIHZhciBwYXJlbnQgPSBfLmdldChyZXBvcnQucGF0aCwgZW5kKVxuXG4gICAgcGFyZW50Lm5vZGUuYXBwZW5kQ2hpbGQoaChcImxpIHRsLXRlc3QgdGwtc2tpcFwiLCBbXG4gICAgICAgIGgoXCJoMlwiLCBbdChuYW1lKV0pLFxuICAgIF0pKVxufVxuXG5leHBvcnRzLm5leHRGcmFtZSA9IG5leHRGcmFtZVxuZnVuY3Rpb24gbmV4dEZyYW1lKGZ1bmMpIHtcbiAgICBpZiAoRC53aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKSB7XG4gICAgICAgIEQud2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShmdW5jKVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGdsb2JhbC5zZXRUaW1lb3V0KGZ1bmMsIDApXG4gICAgfVxufVxuXG5leHBvcnRzLnJlcG9ydCA9IGZ1bmN0aW9uIChfLCByZXBvcnQpIHtcbiAgICBpZiAocmVwb3J0LmlzU3RhcnQpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlKSB7XG4gICAgICAgICAgICAvLyBDbGVhciB0aGUgZWxlbWVudCBmaXJzdCwganVzdCBpbiBjYXNlLlxuICAgICAgICAgICAgd2hpbGUgKF8ub3B0cy5yZXBvcnQuZmlyc3RDaGlsZCkge1xuICAgICAgICAgICAgICAgIF8ub3B0cy5yZXBvcnQucmVtb3ZlQ2hpbGQoXy5vcHRzLnJlcG9ydC5maXJzdENoaWxkKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBEZWZlciB0aGUgbmV4dCBmcmFtZSwgc28gdGhlIGN1cnJlbnQgY2hhbmdlcyBjYW4gYmUgc2VudCwgaW4gY2FzZVxuICAgICAgICAgICAgLy8gaXQncyBjbGVhcmluZyBvbGQgdGVzdCByZXN1bHRzIGZyb20gYSBsYXJnZSBzdWl0ZS4gKENocm9tZSBkb2VzXG4gICAgICAgICAgICAvLyBiZXR0ZXIgYmF0Y2hpbmcgdGhpcyB3YXksIGF0IGxlYXN0LilcbiAgICAgICAgICAgIG5leHRGcmFtZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgXy5nZXQodW5kZWZpbmVkLCAwKS5ub2RlID0gXy5vcHRzLnJlcG9ydFxuICAgICAgICAgICAgICAgIF8ub3B0cy5kdXJhdGlvbi50ZXh0Q29udGVudCA9IFIuZm9ybWF0VGltZSgwKVxuICAgICAgICAgICAgICAgIF8ub3B0cy5wYXNzLnRleHRDb250ZW50ID0gXCIwXCJcbiAgICAgICAgICAgICAgICBfLm9wdHMuZmFpbC50ZXh0Q29udGVudCA9IFwiMFwiXG4gICAgICAgICAgICAgICAgXy5vcHRzLnNraXAudGV4dENvbnRlbnQgPSBcIjBcIlxuICAgICAgICAgICAgICAgIHJlc29sdmUoKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSlcbiAgICB9IGVsc2UgaWYgKHJlcG9ydC5pc0VudGVyKSB7XG4gICAgICAgIHZhciBjaGlsZCA9IGgoXCJ1bFwiKVxuXG4gICAgICAgIF8uZ2V0KHJlcG9ydC5wYXRoKS5ub2RlID0gY2hpbGRcbiAgICAgICAgc2hvd1Rlc3QoXywgcmVwb3J0LCBcInRsLXN1aXRlIHRsLXBhc3NcIiwgY2hpbGQpXG4gICAgICAgIF8ub3B0cy5wYXNzLnRleHRDb250ZW50ID0gXy5wYXNzXG4gICAgfSBlbHNlIGlmIChyZXBvcnQuaXNQYXNzKSB7XG4gICAgICAgIHNob3dUZXN0KF8sIHJlcG9ydCwgXCJ0bC10ZXN0IHRsLXBhc3NcIilcbiAgICAgICAgXy5vcHRzLnBhc3MudGV4dENvbnRlbnQgPSBfLnBhc3NcbiAgICB9IGVsc2UgaWYgKHJlcG9ydC5pc0ZhaWwpIHtcbiAgICAgICAgc2hvd1Rlc3QoXywgcmVwb3J0LCBcInRsLXRlc3QgdGwtZmFpbFwiLCBmb3JtYXRFcnJvcihyZXBvcnQuZXJyb3IsXG4gICAgICAgICAgICByZXBvcnQuZXJyb3IubmFtZSA9PT0gXCJBc3NlcnRpb25FcnJvclwiICYmXG4gICAgICAgICAgICAgICAgcmVwb3J0LmVycm9yLnNob3dEaWZmICE9PSBmYWxzZSkpXG4gICAgICAgIF8ub3B0cy5mYWlsLnRleHRDb250ZW50ID0gXy5mYWlsXG4gICAgfSBlbHNlIGlmIChyZXBvcnQuaXNTa2lwKSB7XG4gICAgICAgIHNob3dTa2lwKF8sIHJlcG9ydCwgXCJ0bC10ZXN0IHRsLXNraXBcIilcbiAgICAgICAgXy5vcHRzLnNraXAudGV4dENvbnRlbnQgPSBfLnNraXBcbiAgICB9IGVsc2UgaWYgKHJlcG9ydC5pc0Vycm9yKSB7XG4gICAgICAgIF8ub3B0cy5yZXBvcnQuYXBwZW5kQ2hpbGQoaChcImxpIHRsLWVycm9yXCIsIFtcbiAgICAgICAgICAgIGgoXCJoMlwiLCBbdChcIkludGVybmFsIGVycm9yXCIpXSksXG4gICAgICAgICAgICBmb3JtYXRFcnJvcihyZXBvcnQuZXJyb3IsIGZhbHNlKSxcbiAgICAgICAgXSkpXG4gICAgfVxuXG4gICAgcmV0dXJuIHVuZGVmaW5lZFxufVxuXG5mdW5jdGlvbiBtYWtlQ291bnRlcihzdGF0ZSwgY2hpbGQsIGxhYmVsLCBuYW1lKSB7XG4gICAgcmV0dXJuIGgoXCJidXR0b24gdGwtdG9nZ2xlIFwiICsgbmFtZSwge1xuICAgICAgICBvbmNsaWNrOiBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgICAgIGV2LnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgICAgIGV2LnN0b3BQcm9wYWdhdGlvbigpXG5cbiAgICAgICAgICAgIGlmICgvXFxidGwtYWN0aXZlXFxiLy50ZXN0KHRoaXMuY2xhc3NOYW1lKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuY2xhc3NOYW1lID0gdGhpcy5jbGFzc05hbWVcbiAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcYnRsLWFjdGl2ZVxcYi9nLCBcIlwiKVxuICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxzKy9nLCBcIiBcIilcbiAgICAgICAgICAgICAgICAgICAgLnRyaW0oKVxuICAgICAgICAgICAgICAgIHN0YXRlLnJlcG9ydC5jbGFzc05hbWUgPSBzdGF0ZS5yZXBvcnQuY2xhc3NOYW1lXG4gICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKG5ldyBSZWdFeHAoXCJcXFxcYlwiICsgbmFtZSArIFwiXFxcXGJcIiwgXCJnXCIpLCBcIlwiKVxuICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxzKy9nLCBcIiBcIilcbiAgICAgICAgICAgICAgICAgICAgLnRyaW0oKVxuICAgICAgICAgICAgICAgIHN0YXRlLmFjdGl2ZSA9IHVuZGVmaW5lZFxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoc3RhdGUuYWN0aXZlICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RhdGUuYWN0aXZlLmNsYXNzTmFtZSA9IHN0YXRlLmFjdGl2ZS5jbGFzc05hbWVcbiAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXGJ0bC1hY3RpdmVcXGIvZywgXCJcIilcbiAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgLnRyaW0oKVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHN0YXRlLmFjdGl2ZSA9IHRoaXNcbiAgICAgICAgICAgICAgICB0aGlzLmNsYXNzTmFtZSArPSBcIiB0bC1hY3RpdmVcIlxuICAgICAgICAgICAgICAgIHN0YXRlLnJlcG9ydC5jbGFzc05hbWUgPSBzdGF0ZS5yZXBvcnQuY2xhc3NOYW1lXG4gICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXGJ0bC0ocGFzc3xmYWlsfHNraXApXFxiL2csIFwiXCIpXG4gICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKVxuICAgICAgICAgICAgICAgICAgICAudHJpbSgpICsgXCIgXCIgKyBuYW1lXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgfSwgW3QobGFiZWwpLCBjaGlsZF0pXG59XG5cbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIChvcHRzKSB7XG4gICAgdmFyIHN0YXRlID0ge1xuICAgICAgICBjdXJyZW50UHJvbWlzZTogdW5kZWZpbmVkLFxuICAgICAgICBsb2NrZWQ6IGZhbHNlLFxuICAgICAgICBkdXJhdGlvbjogaChcImVtXCIsIFt0KFIuZm9ybWF0VGltZSgwKSldKSxcbiAgICAgICAgcGFzczogaChcImVtXCIsIFt0KFwiMFwiKV0pLFxuICAgICAgICBmYWlsOiBoKFwiZW1cIiwgW3QoXCIwXCIpXSksXG4gICAgICAgIHNraXA6IGgoXCJlbVwiLCBbdChcIjBcIildKSxcbiAgICAgICAgcmVwb3J0OiBoKFwidWwgdGwtcmVwb3J0XCIpLFxuICAgICAgICBhY3RpdmU6IHVuZGVmaW5lZCxcbiAgICB9XG5cbiAgICB2YXIgaGVhZGVyID0gaChcImRpdiB0bC1oZWFkZXJcIiwgW1xuICAgICAgICBoKFwiZGl2IHRsLWR1cmF0aW9uXCIsIFt0KFwiRHVyYXRpb246IFwiKSwgc3RhdGUuZHVyYXRpb25dKSxcbiAgICAgICAgbWFrZUNvdW50ZXIoc3RhdGUsIHN0YXRlLnBhc3MsIFwiUGFzc2VzOiBcIiwgXCJ0bC1wYXNzXCIpLFxuICAgICAgICBtYWtlQ291bnRlcihzdGF0ZSwgc3RhdGUuZmFpbCwgXCJGYWlsdXJlczogXCIsIFwidGwtZmFpbFwiKSxcbiAgICAgICAgbWFrZUNvdW50ZXIoc3RhdGUsIHN0YXRlLnNraXAsIFwiU2tpcHBlZDogXCIsIFwidGwtc2tpcFwiKSxcbiAgICAgICAgaChcImJ1dHRvbiB0bC1ydW5cIiwge1xuICAgICAgICAgICAgb25jbGljazogZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgICAgICAgICAgZXYucHJldmVudERlZmF1bHQoKVxuICAgICAgICAgICAgICAgIGV2LnN0b3BQcm9wYWdhdGlvbigpXG4gICAgICAgICAgICAgICAgcnVuVGVzdHMob3B0cywgc3RhdGUpXG4gICAgICAgICAgICB9LFxuICAgICAgICB9LCBbdChcIlJ1blwiKV0pLFxuICAgIF0pXG5cbiAgICB2YXIgcm9vdCA9IEQuZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ0bFwiKVxuXG4gICAgaWYgKHJvb3QgPT0gbnVsbCkge1xuICAgICAgICBELmRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQocm9vdCA9IGgoXCJkaXZcIiwge2lkOiBcInRsXCJ9LCBbXG4gICAgICAgICAgICBoZWFkZXIsXG4gICAgICAgICAgICBzdGF0ZS5yZXBvcnQsXG4gICAgICAgIF0pKVxuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIENsZWFyIHRoZSBlbGVtZW50IGZpcnN0LCBqdXN0IGluIGNhc2UuXG4gICAgICAgIHdoaWxlIChyb290LmZpcnN0Q2hpbGQpIHJvb3QucmVtb3ZlQ2hpbGQocm9vdC5maXJzdENoaWxkKVxuICAgICAgICByb290LmFwcGVuZENoaWxkKGhlYWRlcilcbiAgICAgICAgcm9vdC5hcHBlbmRDaGlsZChzdGF0ZS5yZXBvcnQpXG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcm9vdDogcm9vdCxcbiAgICAgICAgc3RhdGU6IHN0YXRlLFxuICAgIH1cbn1cbiIsIlwidXNlIHN0cmljdFwiXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKEJhc2UsIFN1cGVyKSB7XG4gICAgdmFyIHN0YXJ0ID0gMlxuXG4gICAgaWYgKHR5cGVvZiBTdXBlciA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIEJhc2UucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShTdXBlci5wcm90b3R5cGUpXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShCYXNlLnByb3RvdHlwZSwgXCJjb25zdHJ1Y3RvclwiLCB7XG4gICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICAgICAgdmFsdWU6IEJhc2UsXG4gICAgICAgIH0pXG4gICAgfSBlbHNlIHtcbiAgICAgICAgc3RhcnQgPSAxXG4gICAgfVxuXG4gICAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBtZXRob2RzID0gYXJndW1lbnRzW2ldXG5cbiAgICAgICAgaWYgKG1ldGhvZHMgIT0gbnVsbCkge1xuICAgICAgICAgICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhtZXRob2RzKVxuXG4gICAgICAgICAgICBmb3IgKHZhciBrID0gMDsgayA8IGtleXMubGVuZ3RoOyBrKyspIHtcbiAgICAgICAgICAgICAgICB2YXIga2V5ID0ga2V5c1trXVxuICAgICAgICAgICAgICAgIHZhciBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihtZXRob2RzLCBrZXkpXG5cbiAgICAgICAgICAgICAgICBkZXNjLmVudW1lcmFibGUgPSBmYWxzZVxuICAgICAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShCYXNlLnByb3RvdHlwZSwga2V5LCBkZXNjKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxuLyoqXG4gKiBUaGlzIGNvbnRhaW5zIHRoZSBicm93c2VyIGNvbnNvbGUgc3R1ZmYuXG4gKi9cblxuZXhwb3J0cy5TeW1ib2xzID0gT2JqZWN0LmZyZWV6ZSh7XG4gICAgUGFzczogXCLinJNcIixcbiAgICBGYWlsOiBcIuKcllwiLFxuICAgIERvdDogXCLigKRcIixcbiAgICBEb3RGYWlsOiBcIiFcIixcbn0pXG5cbmV4cG9ydHMud2luZG93V2lkdGggPSA3NVxuZXhwb3J0cy5uZXdsaW5lID0gXCJcXG5cIlxuXG4vLyBDb2xvciBzdXBwb3J0IGlzIHVuZm9yY2VkIGFuZCB1bnN1cHBvcnRlZCwgc2luY2UgeW91IGNhbiBvbmx5IHNwZWNpZnlcbi8vIGxpbmUtYnktbGluZSBjb2xvcnMgdmlhIENTUywgYW5kIGV2ZW4gdGhhdCBpc24ndCB2ZXJ5IHBvcnRhYmxlLlxuZXhwb3J0cy5jb2xvclN1cHBvcnQgPSAwXG5cbi8qKlxuICogU2luY2UgYnJvd3NlcnMgZG9uJ3QgaGF2ZSB1bmJ1ZmZlcmVkIG91dHB1dCwgdGhpcyBraW5kIG9mIHNpbXVsYXRlcyBpdC5cbiAqL1xuXG52YXIgYWNjID0gXCJcIlxuXG5leHBvcnRzLmRlZmF1bHRPcHRzID0ge1xuICAgIHdyaXRlOiBmdW5jdGlvbiAoc3RyKSB7XG4gICAgICAgIGFjYyArPSBzdHJcblxuICAgICAgICB2YXIgaW5kZXggPSBzdHIuaW5kZXhPZihcIlxcblwiKVxuXG4gICAgICAgIGlmIChpbmRleCA+PSAwKSB7XG4gICAgICAgICAgICB2YXIgbGluZXMgPSBzdHIuc3BsaXQoXCJcXG5cIilcblxuICAgICAgICAgICAgYWNjID0gbGluZXMucG9wKClcblxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaW5lcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGdsb2JhbC5jb25zb2xlLmxvZyhsaW5lc1tpXSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICByZXNldDogZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoYWNjICE9PSBcIlwiKSB7XG4gICAgICAgICAgICBnbG9iYWwuY29uc29sZS5sb2coYWNjKVxuICAgICAgICAgICAgYWNjID0gXCJcIlxuICAgICAgICB9XG4gICAgfSxcbn1cbiIsIlwidXNlIHN0cmljdFwiXG5cbnZhciBkaWZmID0gcmVxdWlyZShcImRpZmZcIilcblxudmFyIG1ldGhvZHMgPSByZXF1aXJlKFwiLi4vbWV0aG9kc1wiKVxudmFyIGluc3BlY3QgPSByZXF1aXJlKFwiY2xlYW4tYXNzZXJ0LXV0aWxcIikuaW5zcGVjdFxudmFyIHBlYWNoID0gcmVxdWlyZShcIi4uL3V0aWxcIikucGVhY2hcbnZhciBSZXBvcnRlciA9IHJlcXVpcmUoXCIuL3JlcG9ydGVyXCIpXG52YXIgVXRpbCA9IHJlcXVpcmUoXCIuL3V0aWxcIilcbnZhciBTZXR0aW5ncyA9IHJlcXVpcmUoXCIuLi9zZXR0aW5nc1wiKVxuXG5mdW5jdGlvbiBwcmludFRpbWUoXywgcCwgc3RyKSB7XG4gICAgaWYgKCFfLnRpbWVQcmludGVkKSB7XG4gICAgICAgIF8udGltZVByaW50ZWQgPSB0cnVlXG4gICAgICAgIHN0ciArPSBVdGlsLmNvbG9yKFwibGlnaHRcIiwgXCIgKFwiICsgVXRpbC5mb3JtYXRUaW1lKF8uZHVyYXRpb24pICsgXCIpXCIpXG4gICAgfVxuXG4gICAgcmV0dXJuIHAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiBfLnByaW50KHN0cikgfSlcbn1cblxuZnVuY3Rpb24gdW5pZmllZERpZmYoZXJyKSB7XG4gICAgdmFyIGFjdHVhbCA9IGluc3BlY3QoZXJyLmFjdHVhbClcbiAgICB2YXIgZXhwZWN0ZWQgPSBpbnNwZWN0KGVyci5leHBlY3RlZClcbiAgICB2YXIgbXNnID0gZGlmZi5jcmVhdGVQYXRjaChcInN0cmluZ1wiLCBhY3R1YWwsIGV4cGVjdGVkKVxuICAgIHZhciBoZWFkZXIgPSBTZXR0aW5ncy5uZXdsaW5lKCkgK1xuICAgICAgICBVdGlsLmNvbG9yKFwiZGlmZiBhZGRlZFwiLCBcIisgZXhwZWN0ZWRcIikgKyBcIiBcIiArXG4gICAgICAgIFV0aWwuY29sb3IoXCJkaWZmIHJlbW92ZWRcIiwgXCItIGFjdHVhbFwiKSArXG4gICAgICAgIFNldHRpbmdzLm5ld2xpbmUoKVxuXG4gICAgcmV0dXJuIGhlYWRlciArIG1zZy5zcGxpdCgvXFxyP1xcbnxcXHIvZykuc2xpY2UoNClcbiAgICAuZmlsdGVyKGZ1bmN0aW9uIChsaW5lKSB7IHJldHVybiAhL15cXEBcXEB8XlxcXFwgTm8gbmV3bGluZS8udGVzdChsaW5lKSB9KVxuICAgIC5tYXAoZnVuY3Rpb24gKGxpbmUpIHtcbiAgICAgICAgaWYgKGxpbmVbMF0gPT09IFwiK1wiKSByZXR1cm4gVXRpbC5jb2xvcihcImRpZmYgYWRkZWRcIiwgbGluZSlcbiAgICAgICAgaWYgKGxpbmVbMF0gPT09IFwiLVwiKSByZXR1cm4gVXRpbC5jb2xvcihcImRpZmYgcmVtb3ZlZFwiLCBsaW5lKVxuICAgICAgICByZXR1cm4gbGluZVxuICAgIH0pXG4gICAgLm1hcChmdW5jdGlvbiAobGluZSkgeyByZXR1cm4gU2V0dGluZ3MubmV3bGluZSgpICsgbGluZSB9KVxuICAgIC5tYXAoZnVuY3Rpb24gKGxpbmUpIHsgcmV0dXJuIGxpbmUudHJpbVJpZ2h0KCkgfSlcbiAgICAuam9pbihcIlwiKVxufVxuXG5mdW5jdGlvbiBnZXREaWZmU3RhY2soZSkge1xuICAgIHZhciBkZXNjcmlwdGlvbiA9IChlLm5hbWUgKyBcIjogXCIgKyBlLm1lc3NhZ2UpXG4gICAgICAgIC5yZXBsYWNlKC9cXHMrJC9nbSwgXCJcIilcbiAgICAgICAgLnJlcGxhY2UoL14oLiopJC9nbSwgVXRpbC5jb2xvcihcImZhaWxcIiwgXCIkMVwiKSlcblxuICAgIGlmIChlLm5hbWUgPT09IFwiQXNzZXJ0aW9uRXJyb3JcIiAmJiBlLnNob3dEaWZmICE9PSBmYWxzZSkge1xuICAgICAgICBkZXNjcmlwdGlvbiArPSBTZXR0aW5ncy5uZXdsaW5lKCkgKyB1bmlmaWVkRGlmZihlKSArIFNldHRpbmdzLm5ld2xpbmUoKVxuICAgIH1cblxuICAgIHZhciBzdHJpcHBlZCA9IFV0aWwucmVhZFN0YWNrKGUpXG4gICAgICAgIC5yZXBsYWNlKC9eKC4qKSQvZ20sIFV0aWwuY29sb3IoXCJmYWlsXCIsIFwiJDFcIikpXG5cbiAgICBpZiAoc3RyaXBwZWQgPT09IFwiXCIpIHJldHVybiBkZXNjcmlwdGlvblxuICAgIHJldHVybiBkZXNjcmlwdGlvbiArIFNldHRpbmdzLm5ld2xpbmUoKSArIHN0cmlwcGVkXG59XG5cbmZ1bmN0aW9uIHByaW50RmFpbExpc3QoXywgZXJyKSB7XG4gICAgdmFyIHN0ciA9IGVyciBpbnN0YW5jZW9mIEVycm9yID8gZ2V0RGlmZlN0YWNrKGVycikgOiBpbnNwZWN0KGVycilcbiAgICB2YXIgcGFydHMgPSBzdHIuc3BsaXQoL1xccj9cXG4vZylcblxuICAgIHJldHVybiBfLnByaW50KFwiICAgIFwiICsgcGFydHNbMF0pXG4gICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gcGVhY2gocGFydHMuc2xpY2UoMSksIGZ1bmN0aW9uIChwYXJ0KSB7XG4gICAgICAgICAgICByZXR1cm4gXy5wcmludChwYXJ0ID8gXCIgICAgICBcIiArIHBhcnQgOiBcIlwiKVxuICAgICAgICB9KVxuICAgIH0pXG59XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKG9wdHMsIG1ldGhvZHMpIHtcbiAgICByZXR1cm4gbmV3IENvbnNvbGVSZXBvcnRlcihvcHRzLCBtZXRob2RzKVxufVxuXG4vKipcbiAqIEJhc2UgY2xhc3MgZm9yIG1vc3QgY29uc29sZSByZXBvcnRlcnMuXG4gKlxuICogTm90ZTogcHJpbnRpbmcgaXMgYXN5bmNocm9ub3VzLCBiZWNhdXNlIG90aGVyd2lzZSwgaWYgZW5vdWdoIGVycm9ycyBleGlzdCxcbiAqIE5vZGUgd2lsbCBldmVudHVhbGx5IHN0YXJ0IGRyb3BwaW5nIGxpbmVzIHNlbnQgdG8gaXRzIGJ1ZmZlciwgZXNwZWNpYWxseSB3aGVuXG4gKiBzdGFjayB0cmFjZXMgZ2V0IGludm9sdmVkLiBJZiBUaGFsbGl1bSdzIG91dHB1dCBpcyByZWRpcmVjdGVkLCB0aGF0IGNhbiBiZSBhXG4gKiBiaWcgcHJvYmxlbSBmb3IgY29uc3VtZXJzLCBhcyB0aGV5IG9ubHkgaGF2ZSBwYXJ0IG9mIHRoZSBvdXRwdXQsIGFuZCB3b24ndCBiZVxuICogYWJsZSB0byBzZWUgYWxsIHRoZSBlcnJvcnMgbGF0ZXIuIEFsc28sIGlmIGNvbnNvbGUgd2FybmluZ3MgY29tZSB1cCBlbi1tYXNzZSxcbiAqIHRoYXQgd291bGQgYWxzbyBjb250cmlidXRlLiBTbywgd2UgaGF2ZSB0byB3YWl0IGZvciBlYWNoIGxpbmUgdG8gZmx1c2ggYmVmb3JlXG4gKiB3ZSBjYW4gY29udGludWUsIHNvIHRoZSBmdWxsIG91dHB1dCBtYWtlcyBpdHMgd2F5IHRvIHRoZSBjb25zb2xlLlxuICpcbiAqIFNvbWUgdGVzdCBmcmFtZXdvcmtzIGxpa2UgVGFwZSBtaXNzIHRoaXMsIHRob3VnaC5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0cyBUaGUgb3B0aW9ucyBmb3IgdGhlIHJlcG9ydGVyLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gb3B0cy53cml0ZSBUaGUgdW5idWZmZXJyZWQgd3JpdGVyIGZvciB0aGUgcmVwb3J0ZXIuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBvcHRzLnJlc2V0IEEgcmVzZXQgZnVuY3Rpb24gZm9yIHRoZSBwcmludGVyICsgd3JpdGVyLlxuICogQHBhcmFtIHtTdHJpbmdbXX0gYWNjZXB0cyBUaGUgb3B0aW9ucyBhY2NlcHRlZC5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGluaXQgVGhlIGluaXQgZnVuY3Rpb24gZm9yIHRoZSBzdWJjbGFzcyByZXBvcnRlcidzXG4gKiAgICAgICAgICAgICAgICAgICAgICAgIGlzb2xhdGVkIHN0YXRlIChjcmVhdGVkIGJ5IGZhY3RvcnkpLlxuICovXG5mdW5jdGlvbiBDb25zb2xlUmVwb3J0ZXIob3B0cywgbWV0aG9kcykge1xuICAgIFJlcG9ydGVyLmNhbGwodGhpcywgVXRpbC5UcmVlLCBvcHRzLCBtZXRob2RzLCB0cnVlKVxuXG4gICAgaWYgKCFVdGlsLkNvbG9ycy5mb3JjZWQoKSAmJiBtZXRob2RzLmFjY2VwdHMuaW5kZXhPZihcImNvbG9yXCIpID49IDApIHtcbiAgICAgICAgdGhpcy5vcHRzLmNvbG9yID0gb3B0cy5jb2xvclxuICAgIH1cblxuICAgIFV0aWwuZGVmYXVsdGlmeSh0aGlzLCBvcHRzLCBcIndyaXRlXCIpXG4gICAgdGhpcy5yZXNldCgpXG59XG5cbm1ldGhvZHMoQ29uc29sZVJlcG9ydGVyLCBSZXBvcnRlciwge1xuICAgIHByaW50OiBmdW5jdGlvbiAoc3RyKSB7XG4gICAgICAgIGlmIChzdHIgPT0gbnVsbCkgc3RyID0gXCJcIlxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXMub3B0cy53cml0ZShzdHIgKyBcIlxcblwiKSlcbiAgICB9LFxuXG4gICAgd3JpdGU6IGZ1bmN0aW9uIChzdHIpIHtcbiAgICAgICAgaWYgKHN0ciAhPSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXMub3B0cy53cml0ZShzdHIpKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgcHJpbnRSZXN1bHRzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpc1xuXG4gICAgICAgIGlmICghdGhpcy50ZXN0cyAmJiAhdGhpcy5za2lwKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5wcmludChcbiAgICAgICAgICAgICAgICBVdGlsLmNvbG9yKFwicGxhaW5cIiwgXCIgIDAgdGVzdHNcIikgK1xuICAgICAgICAgICAgICAgIFV0aWwuY29sb3IoXCJsaWdodFwiLCBcIiAoMG1zKVwiKSlcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIHNlbGYucHJpbnQoKSB9KVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMucHJpbnQoKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBwID0gUHJvbWlzZS5yZXNvbHZlKClcblxuICAgICAgICAgICAgaWYgKHNlbGYucGFzcykge1xuICAgICAgICAgICAgICAgIHAgPSBwcmludFRpbWUoc2VsZiwgcCxcbiAgICAgICAgICAgICAgICAgICAgVXRpbC5jb2xvcihcImJyaWdodCBwYXNzXCIsIFwiICBcIikgK1xuICAgICAgICAgICAgICAgICAgICBVdGlsLmNvbG9yKFwiZ3JlZW5cIiwgc2VsZi5wYXNzICsgXCIgcGFzc2luZ1wiKSlcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHNlbGYuc2tpcCkge1xuICAgICAgICAgICAgICAgIHAgPSBwcmludFRpbWUoc2VsZiwgcCxcbiAgICAgICAgICAgICAgICAgICAgVXRpbC5jb2xvcihcInNraXBcIiwgXCIgIFwiICsgc2VsZi5za2lwICsgXCIgc2tpcHBlZFwiKSlcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHNlbGYuZmFpbCkge1xuICAgICAgICAgICAgICAgIHAgPSBwcmludFRpbWUoc2VsZiwgcCxcbiAgICAgICAgICAgICAgICAgICAgVXRpbC5jb2xvcihcImJyaWdodCBmYWlsXCIsIFwiICBcIikgK1xuICAgICAgICAgICAgICAgICAgICBVdGlsLmNvbG9yKFwiZmFpbFwiLCBzZWxmLmZhaWwgKyBcIiBmYWlsaW5nXCIpKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gcFxuICAgICAgICB9KVxuICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiBzZWxmLnByaW50KCkgfSlcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHBlYWNoKHNlbGYuZXJyb3JzLCBmdW5jdGlvbiAocmVwb3J0LCBpKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5hbWUgPSBpICsgMSArIFwiKSBcIiArIFV0aWwuam9pblBhdGgocmVwb3J0KSArXG4gICAgICAgICAgICAgICAgICAgIFV0aWwuZm9ybWF0UmVzdChyZXBvcnQpXG5cbiAgICAgICAgICAgICAgICByZXR1cm4gc2VsZi5wcmludChcIiAgXCIgKyBVdGlsLmNvbG9yKFwicGxhaW5cIiwgbmFtZSArIFwiOlwiKSlcbiAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwcmludEZhaWxMaXN0KHNlbGYsIHJlcG9ydC5lcnJvcilcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIHNlbGYucHJpbnQoKSB9KVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSlcbiAgICB9LFxuXG4gICAgcHJpbnRFcnJvcjogZnVuY3Rpb24gKHJlcG9ydCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXNcbiAgICAgICAgdmFyIGxpbmVzID0gcmVwb3J0LmVycm9yIGluc3RhbmNlb2YgRXJyb3JcbiAgICAgICAgICAgID8gVXRpbC5nZXRTdGFjayhyZXBvcnQuZXJyb3IpXG4gICAgICAgICAgICA6IGluc3BlY3QocmVwb3J0LmVycm9yKVxuXG4gICAgICAgIHJldHVybiB0aGlzLnByaW50KCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gcGVhY2gobGluZXMuc3BsaXQoL1xccj9cXG4vZyksIGZ1bmN0aW9uIChsaW5lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNlbGYucHJpbnQobGluZSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pXG4gICAgfSxcbn0pXG4iLCJcInVzZSBzdHJpY3RcIlxuXG52YXIgVXRpbCA9IHJlcXVpcmUoXCIuL3V0aWxcIilcblxuZXhwb3J0cy5vbiA9IHJlcXVpcmUoXCIuL29uXCIpXG5leHBvcnRzLmNvbnNvbGVSZXBvcnRlciA9IHJlcXVpcmUoXCIuL2NvbnNvbGUtcmVwb3J0ZXJcIilcbmV4cG9ydHMuUmVwb3J0ZXIgPSByZXF1aXJlKFwiLi9yZXBvcnRlclwiKVxuZXhwb3J0cy5jb2xvciA9IFV0aWwuY29sb3JcbmV4cG9ydHMuQ29sb3JzID0gVXRpbC5Db2xvcnNcbmV4cG9ydHMuZm9ybWF0UmVzdCA9IFV0aWwuZm9ybWF0UmVzdFxuZXhwb3J0cy5mb3JtYXRUaW1lID0gVXRpbC5mb3JtYXRUaW1lXG5leHBvcnRzLmdldFN0YWNrID0gVXRpbC5nZXRTdGFja1xuZXhwb3J0cy5qb2luUGF0aCA9IFV0aWwuam9pblBhdGhcbmV4cG9ydHMubmV3bGluZSA9IFV0aWwubmV3bGluZVxuZXhwb3J0cy5yZWFkU3RhY2sgPSBVdGlsLnJlYWRTdGFja1xuZXhwb3J0cy5zZXRDb2xvciA9IFV0aWwuc2V0Q29sb3JcbmV4cG9ydHMuc3BlZWQgPSBVdGlsLnNwZWVkXG5leHBvcnRzLlN0YXR1cyA9IFV0aWwuU3RhdHVzXG5leHBvcnRzLnN5bWJvbHMgPSBVdGlsLnN5bWJvbHNcbmV4cG9ydHMudW5zZXRDb2xvciA9IFV0aWwudW5zZXRDb2xvclxuZXhwb3J0cy53aW5kb3dXaWR0aCA9IFV0aWwud2luZG93V2lkdGhcbiIsIlwidXNlIHN0cmljdFwiXG5cbnZhciBTdGF0dXMgPSByZXF1aXJlKFwiLi91dGlsXCIpLlN0YXR1c1xuXG4vLyBCZWNhdXNlIEVTNSBzdWNrcy4gKEFuZCwgaXQncyBicmVha2luZyBteSBQaGFudG9tSlMgYnVpbGRzKVxuZnVuY3Rpb24gc2V0TmFtZShyZXBvcnRlciwgbmFtZSkge1xuICAgIHRyeSB7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShyZXBvcnRlciwgXCJuYW1lXCIsIHt2YWx1ZTogbmFtZX0pXG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAvLyBpZ25vcmVcbiAgICB9XG59XG5cbi8qKlxuICogQSBtYWNybyBvZiBzb3J0cywgdG8gc2ltcGxpZnkgY3JlYXRpbmcgcmVwb3J0ZXJzLiBJdCBhY2NlcHRzIGFuIG9iamVjdCB3aXRoXG4gKiB0aGUgZm9sbG93aW5nIHBhcmFtZXRlcnM6XG4gKlxuICogYGFjY2VwdHM6IHN0cmluZ1tdYCAtIFRoZSBwcm9wZXJ0aWVzIGFjY2VwdGVkLiBFdmVyeXRoaW5nIGVsc2UgaXMgaWdub3JlZCxcbiAqIGFuZCBpdCdzIHBhcnRpYWxseSB0aGVyZSBmb3IgZG9jdW1lbnRhdGlvbi4gVGhpcyBwYXJhbWV0ZXIgaXMgcmVxdWlyZWQuXG4gKlxuICogYGNyZWF0ZShvcHRzLCBtZXRob2RzKWAgLSBDcmVhdGUgYSBuZXcgcmVwb3J0ZXIgaW5zdGFuY2UuICBUaGlzIHBhcmFtZXRlciBpc1xuICogcmVxdWlyZWQuIE5vdGUgdGhhdCBgbWV0aG9kc2AgcmVmZXJzIHRvIHRoZSBwYXJhbWV0ZXIgb2JqZWN0IGl0c2VsZi5cbiAqXG4gKiBgaW5pdChzdGF0ZSwgb3B0cylgIC0gSW5pdGlhbGl6ZSBleHRyYSByZXBvcnRlciBzdGF0ZSwgaWYgYXBwbGljYWJsZS5cbiAqXG4gKiBgYmVmb3JlKHJlcG9ydGVyKWAgLSBEbyB0aGluZ3MgYmVmb3JlIGVhY2ggZXZlbnQsIHJldHVybmluZyBhIHBvc3NpYmxlXG4gKiB0aGVuYWJsZSB3aGVuIGRvbmUuIFRoaXMgZGVmYXVsdHMgdG8gYSBuby1vcC5cbiAqXG4gKiBgYWZ0ZXIocmVwb3J0ZXIpYCAtIERvIHRoaW5ncyBhZnRlciBlYWNoIGV2ZW50LCByZXR1cm5pbmcgYSBwb3NzaWJsZVxuICogdGhlbmFibGUgd2hlbiBkb25lLiBUaGlzIGRlZmF1bHRzIHRvIGEgbm8tb3AuXG4gKlxuICogYHJlcG9ydChyZXBvcnRlciwgcmVwb3J0KWAgLSBIYW5kbGUgYSB0ZXN0IHJlcG9ydC4gVGhpcyBtYXkgcmV0dXJuIGEgcG9zc2libGVcbiAqIHRoZW5hYmxlIHdoZW4gZG9uZSwgYW5kIGl0IGlzIHJlcXVpcmVkLlxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChuYW1lLCBtZXRob2RzKSB7XG4gICAgc2V0TmFtZShyZXBvcnRlciwgbmFtZSlcbiAgICByZXBvcnRlcltuYW1lXSA9IHJlcG9ydGVyXG4gICAgcmV0dXJuIHJlcG9ydGVyXG4gICAgZnVuY3Rpb24gcmVwb3J0ZXIob3B0cykge1xuICAgICAgICAvKipcbiAgICAgICAgICogSW5zdGVhZCBvZiBzaWxlbnRseSBmYWlsaW5nIHRvIHdvcmssIGxldCdzIGVycm9yIG91dCB3aGVuIGEgcmVwb3J0IGlzXG4gICAgICAgICAqIHBhc3NlZCBpbiwgYW5kIGluZm9ybSB0aGUgdXNlciBpdCBuZWVkcyBpbml0aWFsaXplZC4gQ2hhbmNlcyBhcmUsXG4gICAgICAgICAqIHRoZXJlJ3Mgbm8gbGVnaXRpbWF0ZSByZWFzb24gdG8gZXZlbiBwYXNzIGEgcmVwb3J0LCBhbnl3YXlzLlxuICAgICAgICAgKi9cbiAgICAgICAgaWYgKHR5cGVvZiBvcHRzID09PSBcIm9iamVjdFwiICYmIG9wdHMgIT09IG51bGwgJiZcbiAgICAgICAgICAgICAgICB0eXBlb2Ygb3B0cy5fID09PSBcIm51bWJlclwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICAgICAgICAgIFwiT3B0aW9ucyBjYW5ub3QgYmUgYSByZXBvcnQuIERpZCB5b3UgZm9yZ2V0IHRvIGNhbGwgdGhlIFwiICtcbiAgICAgICAgICAgICAgICBcImZhY3RvcnkgZmlyc3Q/XCIpXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgXyA9IG1ldGhvZHMuY3JlYXRlKG9wdHMsIG1ldGhvZHMpXG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChyZXBvcnQpIHtcbiAgICAgICAgICAgIC8vIE9ubHkgc29tZSBldmVudHMgaGF2ZSBjb21tb24gc3RlcHMuXG4gICAgICAgICAgICBpZiAocmVwb3J0LmlzU3RhcnQpIHtcbiAgICAgICAgICAgICAgICBfLnJ1bm5pbmcgPSB0cnVlXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHJlcG9ydC5pc0VudGVyIHx8IHJlcG9ydC5pc1Bhc3MpIHtcbiAgICAgICAgICAgICAgICBfLmdldChyZXBvcnQucGF0aCkuc3RhdHVzID0gU3RhdHVzLlBhc3NpbmdcbiAgICAgICAgICAgICAgICBfLmR1cmF0aW9uICs9IHJlcG9ydC5kdXJhdGlvblxuICAgICAgICAgICAgICAgIF8udGVzdHMrK1xuICAgICAgICAgICAgICAgIF8ucGFzcysrXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHJlcG9ydC5pc0ZhaWwpIHtcbiAgICAgICAgICAgICAgICBfLmdldChyZXBvcnQucGF0aCkuc3RhdHVzID0gU3RhdHVzLkZhaWxpbmdcbiAgICAgICAgICAgICAgICBfLmR1cmF0aW9uICs9IHJlcG9ydC5kdXJhdGlvblxuICAgICAgICAgICAgICAgIF8udGVzdHMrK1xuICAgICAgICAgICAgICAgIF8uZmFpbCsrXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHJlcG9ydC5pc0hvb2spIHtcbiAgICAgICAgICAgICAgICBfLmdldChyZXBvcnQucGF0aCkuc3RhdHVzID0gU3RhdHVzLkZhaWxpbmdcbiAgICAgICAgICAgICAgICBfLmdldChyZXBvcnQucm9vdFBhdGgpLnN0YXR1cyA9IFN0YXR1cy5GYWlsaW5nXG4gICAgICAgICAgICAgICAgXy5mYWlsKytcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocmVwb3J0LmlzU2tpcCkge1xuICAgICAgICAgICAgICAgIF8uZ2V0KHJlcG9ydC5wYXRoKS5zdGF0dXMgPSBTdGF0dXMuU2tpcHBlZFxuICAgICAgICAgICAgICAgIC8vIFNraXBwZWQgdGVzdHMgYXJlbid0IGNvdW50ZWQgaW4gdGhlIHRvdGFsIHRlc3QgY291bnRcbiAgICAgICAgICAgICAgICBfLnNraXArK1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFxuICAgICAgICAgICAgICAgIHR5cGVvZiBtZXRob2RzLmJlZm9yZSA9PT0gXCJmdW5jdGlvblwiXG4gICAgICAgICAgICAgICAgICAgID8gbWV0aG9kcy5iZWZvcmUoXylcbiAgICAgICAgICAgICAgICAgICAgOiB1bmRlZmluZWQpXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiBtZXRob2RzLnJlcG9ydChfLCByZXBvcnQpIH0pXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiBtZXRob2RzLmFmdGVyID09PSBcImZ1bmN0aW9uXCJcbiAgICAgICAgICAgICAgICAgICAgPyBtZXRob2RzLmFmdGVyKF8pXG4gICAgICAgICAgICAgICAgICAgIDogdW5kZWZpbmVkXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmIChyZXBvcnQuaXNFbmQgfHwgcmVwb3J0LmlzRXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgXy5yZXNldCgpXG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgXy5vcHRzLnJlc2V0ID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBfLm9wdHMucmVzZXQoKVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWRcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICB9XG59XG4iLCJcInVzZSBzdHJpY3RcIlxuXG52YXIgbWV0aG9kcyA9IHJlcXVpcmUoXCIuLi9tZXRob2RzXCIpXG52YXIgZGVmYXVsdGlmeSA9IHJlcXVpcmUoXCIuL3V0aWxcIikuZGVmYXVsdGlmeVxudmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHlcblxuZnVuY3Rpb24gU3RhdGUocmVwb3J0ZXIpIHtcbiAgICBpZiAodHlwZW9mIHJlcG9ydGVyLm1ldGhvZHMuaW5pdCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICgwLCByZXBvcnRlci5tZXRob2RzLmluaXQpKHRoaXMsIHJlcG9ydGVyLm9wdHMpXG4gICAgfVxufVxuXG4vKipcbiAqIFRoaXMgaGVscHMgc3BlZWQgdXAgZ2V0dGluZyBwcmV2aW91cyB0cmVlcywgc28gYSBwb3RlbnRpYWxseSBleHBlbnNpdmVcbiAqIHRyZWUgc2VhcmNoIGRvZXNuJ3QgaGF2ZSB0byBiZSBwZXJmb3JtZWQuXG4gKlxuICogKFRoaXMgZG9lcyBhY3R1YWxseSBtYWtlIGEgc2xpZ2h0IHBlcmYgZGlmZmVyZW5jZSBpbiB0aGUgdGVzdHMuKVxuICovXG5mdW5jdGlvbiBpc1JlcGVhdChjYWNoZSwgcGF0aCkge1xuICAgIC8vIENhbid0IGJlIGEgcmVwZWF0IHRoZSBmaXJzdCB0aW1lLlxuICAgIGlmIChjYWNoZS5wYXRoID09IG51bGwpIHJldHVybiBmYWxzZVxuICAgIGlmIChwYXRoLmxlbmd0aCAhPT0gY2FjaGUucGF0aC5sZW5ndGgpIHJldHVybiBmYWxzZVxuICAgIGlmIChwYXRoID09PSBjYWNoZS5wYXRoKSByZXR1cm4gdHJ1ZVxuXG4gICAgLy8gSXQncyB1bmxpa2VseSB0aGUgbmVzdGluZyB3aWxsIGJlIGNvbnNpc3RlbnRseSBtb3JlIHRoYW4gYSBmZXcgbGV2ZWxzXG4gICAgLy8gZGVlcCAoPj0gNSksIHNvIHRoaXMgc2hvdWxkbid0IGJvZyBhbnl0aGluZyBkb3duLlxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGF0aC5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAocGF0aFtpXSAhPT0gY2FjaGUucGF0aFtpXSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjYWNoZS5wYXRoID0gcGF0aFxuICAgIHJldHVybiB0cnVlXG59XG5cbi8qKlxuICogU3VwZXJjbGFzcyBmb3IgYWxsIHJlcG9ydGVycy4gVGhpcyBjb3ZlcnMgdGhlIHN0YXRlIGZvciBwcmV0dHkgbXVjaCBldmVyeVxuICogcmVwb3J0ZXIuXG4gKlxuICogTm90ZSB0aGF0IGlmIHlvdSBkZWxheSB0aGUgaW5pdGlhbCByZXNldCwgeW91IHN0aWxsIG11c3QgY2FsbCBpdCBiZWZvcmUgdGhlXG4gKiBjb25zdHJ1Y3RvciBmaW5pc2hlcy5cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBSZXBvcnRlclxuZnVuY3Rpb24gUmVwb3J0ZXIoVHJlZSwgb3B0cywgbWV0aG9kcywgZGVsYXkpIHtcbiAgICB0aGlzLlRyZWUgPSBUcmVlXG4gICAgdGhpcy5vcHRzID0ge31cbiAgICB0aGlzLm1ldGhvZHMgPSBtZXRob2RzXG4gICAgZGVmYXVsdGlmeSh0aGlzLCBvcHRzLCBcInJlc2V0XCIpXG4gICAgaWYgKCFkZWxheSkgdGhpcy5yZXNldCgpXG59XG5cbm1ldGhvZHMoUmVwb3J0ZXIsIHtcbiAgICByZXNldDogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnJ1bm5pbmcgPSBmYWxzZVxuICAgICAgICB0aGlzLnRpbWVQcmludGVkID0gZmFsc2VcbiAgICAgICAgdGhpcy50ZXN0cyA9IDBcbiAgICAgICAgdGhpcy5wYXNzID0gMFxuICAgICAgICB0aGlzLmZhaWwgPSAwXG4gICAgICAgIHRoaXMuc2tpcCA9IDBcbiAgICAgICAgdGhpcy5kdXJhdGlvbiA9IDBcbiAgICAgICAgdGhpcy5lcnJvcnMgPSBbXVxuICAgICAgICB0aGlzLnN0YXRlID0gbmV3IFN0YXRlKHRoaXMpXG4gICAgICAgIHRoaXMuYmFzZSA9IG5ldyB0aGlzLlRyZWUodW5kZWZpbmVkKVxuICAgICAgICB0aGlzLmNhY2hlID0ge3BhdGg6IHVuZGVmaW5lZCwgcmVzdWx0OiB1bmRlZmluZWQsIGVuZDogMH1cbiAgICB9LFxuXG4gICAgcHVzaEVycm9yOiBmdW5jdGlvbiAocmVwb3J0KSB7XG4gICAgICAgIHRoaXMuZXJyb3JzLnB1c2gocmVwb3J0KVxuICAgIH0sXG5cbiAgICBnZXQ6IGZ1bmN0aW9uIChwYXRoLCBlbmQpIHtcbiAgICAgICAgaWYgKGVuZCA9PSBudWxsKSBlbmQgPSBwYXRoLmxlbmd0aFxuICAgICAgICBpZiAoZW5kID09PSAwKSByZXR1cm4gdGhpcy5iYXNlXG4gICAgICAgIGlmIChpc1JlcGVhdCh0aGlzLmNhY2hlLCBwYXRoLCBlbmQpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jYWNoZS5yZXN1bHRcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBjaGlsZCA9IHRoaXMuYmFzZVxuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZW5kOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBlbnRyeSA9IHBhdGhbaV1cblxuICAgICAgICAgICAgaWYgKGhhc093bi5jYWxsKGNoaWxkLmNoaWxkcmVuLCBlbnRyeS5pbmRleCkpIHtcbiAgICAgICAgICAgICAgICBjaGlsZCA9IGNoaWxkLmNoaWxkcmVuW2VudHJ5LmluZGV4XVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjaGlsZCA9IGNoaWxkLmNoaWxkcmVuW2VudHJ5LmluZGV4XSA9IG5ldyB0aGlzLlRyZWUoZW50cnkubmFtZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY2FjaGUuZW5kID0gZW5kXG4gICAgICAgIHJldHVybiB0aGlzLmNhY2hlLnJlc3VsdCA9IGNoaWxkXG4gICAgfSxcbn0pXG4iLCJcInVzZSBzdHJpY3RcIlxuXG52YXIgVXRpbCA9IHJlcXVpcmUoXCIuLi91dGlsXCIpXG52YXIgU2V0dGluZ3MgPSByZXF1aXJlKFwiLi4vc2V0dGluZ3NcIilcblxuZXhwb3J0cy5zeW1ib2xzID0gU2V0dGluZ3Muc3ltYm9sc1xuZXhwb3J0cy53aW5kb3dXaWR0aCA9IFNldHRpbmdzLndpbmRvd1dpZHRoXG5leHBvcnRzLm5ld2xpbmUgPSBTZXR0aW5ncy5uZXdsaW5lXG5cbi8qXG4gKiBTdGFjayBub3JtYWxpemF0aW9uXG4gKi9cblxuLy8gRXhwb3J0ZWQgZm9yIGRlYnVnZ2luZ1xuZXhwb3J0cy5yZWFkU3RhY2sgPSByZWFkU3RhY2tcbmZ1bmN0aW9uIHJlYWRTdGFjayhlKSB7XG4gICAgdmFyIHN0YWNrID0gVXRpbC5nZXRTdGFjayhlKVxuXG4gICAgLy8gSWYgaXQgZG9lc24ndCBzdGFydCB3aXRoIHRoZSBtZXNzYWdlLCBqdXN0IHJldHVybiB0aGUgc3RhY2suXG4gICAgLy8gIEZpcmVmb3gsIFNhZmFyaSAgICAgICAgICAgICAgICBDaHJvbWUsIElFXG4gICAgaWYgKC9eKEApP1xcUytcXDpcXGQrLy50ZXN0KHN0YWNrKSB8fCAvXlxccyphdC8udGVzdChzdGFjaykpIHtcbiAgICAgICAgcmV0dXJuIGZvcm1hdExpbmVCcmVha3MoXCJcIiwgc3RhY2spXG4gICAgfVxuXG4gICAgdmFyIGluZGV4ID0gc3RhY2suaW5kZXhPZihlLm1lc3NhZ2UpXG5cbiAgICBpZiAoaW5kZXggPCAwKSByZXR1cm4gZm9ybWF0TGluZUJyZWFrcyhcIlwiLCBVdGlsLmdldFN0YWNrKGUpKVxuICAgIHZhciByZSA9IC9cXHI/XFxuL2dcblxuICAgIHJlLmxhc3RJbmRleCA9IGluZGV4ICsgZS5tZXNzYWdlLmxlbmd0aFxuICAgIGlmICghcmUudGVzdChzdGFjaykpIHJldHVybiBcIlwiXG4gICAgcmV0dXJuIGZvcm1hdExpbmVCcmVha3MoXCJcIiwgc3RhY2suc2xpY2UocmUubGFzdEluZGV4KSlcbn1cblxuZnVuY3Rpb24gZm9ybWF0TGluZUJyZWFrcyhsZWFkLCBzdHIpIHtcbiAgICByZXR1cm4gc3RyXG4gICAgICAgIC5yZXBsYWNlKC9cXHMrJC9nbSwgXCJcIilcbiAgICAgICAgLnJlcGxhY2UoL15cXHMrL2dtLCBsZWFkKVxuICAgICAgICAucmVwbGFjZSgvXFxyP1xcbnxcXHIvZywgU2V0dGluZ3MubmV3bGluZSgpKVxufVxuXG5leHBvcnRzLmdldFN0YWNrID0gZnVuY3Rpb24gKGUpIHtcbiAgICBpZiAoIShlIGluc3RhbmNlb2YgRXJyb3IpKSByZXR1cm4gZm9ybWF0TGluZUJyZWFrcyhcIlwiLCBVdGlsLmdldFN0YWNrKGUpKVxuICAgIHZhciBkZXNjcmlwdGlvbiA9IChlLm5hbWUgKyBcIjogXCIgKyBlLm1lc3NhZ2UpLnJlcGxhY2UoL1xccyskL2dtLCBcIlwiKVxuICAgIHZhciBzdHJpcHBlZCA9IHJlYWRTdGFjayhlKVxuXG4gICAgaWYgKHN0cmlwcGVkID09PSBcIlwiKSByZXR1cm4gZGVzY3JpcHRpb25cbiAgICByZXR1cm4gZGVzY3JpcHRpb24gKyBTZXR0aW5ncy5uZXdsaW5lKCkgKyBzdHJpcHBlZFxufVxuXG52YXIgQ29sb3JzID0gZXhwb3J0cy5Db2xvcnMgPSBTZXR0aW5ncy5Db2xvcnNcblxuLy8gQ29sb3IgcGFsZXR0ZSBwdWxsZWQgZnJvbSBNb2NoYVxuZnVuY3Rpb24gY29sb3JUb051bWJlcihuYW1lKSB7XG4gICAgc3dpdGNoIChuYW1lKSB7XG4gICAgY2FzZSBcInBhc3NcIjogcmV0dXJuIDkwXG4gICAgY2FzZSBcImZhaWxcIjogcmV0dXJuIDMxXG5cbiAgICBjYXNlIFwiYnJpZ2h0IHBhc3NcIjogcmV0dXJuIDkyXG4gICAgY2FzZSBcImJyaWdodCBmYWlsXCI6IHJldHVybiA5MVxuICAgIGNhc2UgXCJicmlnaHQgeWVsbG93XCI6IHJldHVybiA5M1xuXG4gICAgY2FzZSBcInNraXBcIjogcmV0dXJuIDM2XG4gICAgY2FzZSBcInN1aXRlXCI6IHJldHVybiAwXG4gICAgY2FzZSBcInBsYWluXCI6IHJldHVybiAwXG5cbiAgICBjYXNlIFwiZXJyb3IgdGl0bGVcIjogcmV0dXJuIDBcbiAgICBjYXNlIFwiZXJyb3IgbWVzc2FnZVwiOiByZXR1cm4gMzFcbiAgICBjYXNlIFwiZXJyb3Igc3RhY2tcIjogcmV0dXJuIDkwXG5cbiAgICBjYXNlIFwiY2hlY2ttYXJrXCI6IHJldHVybiAzMlxuICAgIGNhc2UgXCJmYXN0XCI6IHJldHVybiA5MFxuICAgIGNhc2UgXCJtZWRpdW1cIjogcmV0dXJuIDMzXG4gICAgY2FzZSBcInNsb3dcIjogcmV0dXJuIDMxXG4gICAgY2FzZSBcImdyZWVuXCI6IHJldHVybiAzMlxuICAgIGNhc2UgXCJsaWdodFwiOiByZXR1cm4gOTBcblxuICAgIGNhc2UgXCJkaWZmIGd1dHRlclwiOiByZXR1cm4gOTBcbiAgICBjYXNlIFwiZGlmZiBhZGRlZFwiOiByZXR1cm4gMzJcbiAgICBjYXNlIFwiZGlmZiByZW1vdmVkXCI6IHJldHVybiAzMVxuICAgIGRlZmF1bHQ6IHRocm93IG5ldyBUeXBlRXJyb3IoXCJJbnZhbGlkIG5hbWU6IFxcXCJcIiArIG5hbWUgKyBcIlxcXCJcIilcbiAgICB9XG59XG5cbmV4cG9ydHMuY29sb3IgPSBjb2xvclxuZnVuY3Rpb24gY29sb3IobmFtZSwgc3RyKSB7XG4gICAgaWYgKENvbG9ycy5zdXBwb3J0ZWQoKSkge1xuICAgICAgICByZXR1cm4gXCJcXHUwMDFiW1wiICsgY29sb3JUb051bWJlcihuYW1lKSArIFwibVwiICsgc3RyICsgXCJcXHUwMDFiWzBtXCJcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gc3RyICsgXCJcIlxuICAgIH1cbn1cblxuZXhwb3J0cy5zZXRDb2xvciA9IGZ1bmN0aW9uIChfKSB7XG4gICAgaWYgKF8ub3B0cy5jb2xvciAhPSBudWxsKSBDb2xvcnMubWF5YmVTZXQoXy5vcHRzLmNvbG9yKVxufVxuXG5leHBvcnRzLnVuc2V0Q29sb3IgPSBmdW5jdGlvbiAoXykge1xuICAgIGlmIChfLm9wdHMuY29sb3IgIT0gbnVsbCkgQ29sb3JzLm1heWJlUmVzdG9yZSgpXG59XG5cbnZhciBTdGF0dXMgPSBleHBvcnRzLlN0YXR1cyA9IE9iamVjdC5mcmVlemUoe1xuICAgIFVua25vd246IDAsXG4gICAgU2tpcHBlZDogMSxcbiAgICBQYXNzaW5nOiAyLFxuICAgIEZhaWxpbmc6IDMsXG59KVxuXG5leHBvcnRzLlRyZWUgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICB0aGlzLnZhbHVlID0gdmFsdWVcbiAgICB0aGlzLnN0YXR1cyA9IFN0YXR1cy5Vbmtub3duXG4gICAgdGhpcy5jaGlsZHJlbiA9IE9iamVjdC5jcmVhdGUobnVsbClcbn1cblxuZXhwb3J0cy5kZWZhdWx0aWZ5ID0gZnVuY3Rpb24gKF8sIG9wdHMsIHByb3ApIHtcbiAgICBpZiAoXy5tZXRob2RzLmFjY2VwdHMuaW5kZXhPZihwcm9wKSA+PSAwKSB7XG4gICAgICAgIHZhciB1c2VkID0gb3B0cyAhPSBudWxsICYmIHR5cGVvZiBvcHRzW3Byb3BdID09PSBcImZ1bmN0aW9uXCJcbiAgICAgICAgICAgID8gb3B0c1xuICAgICAgICAgICAgOiBTZXR0aW5ncy5kZWZhdWx0T3B0cygpXG5cbiAgICAgICAgXy5vcHRzW3Byb3BdID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1c2VkW3Byb3BdLmFwcGx5KHVzZWQsIGFyZ3VtZW50cykpXG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGpvaW5QYXRoKHJlcG9ydFBhdGgpIHtcbiAgICB2YXIgcGF0aCA9IFwiXCJcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVwb3J0UGF0aC5sZW5ndGg7IGkrKykge1xuICAgICAgICBwYXRoICs9IFwiIFwiICsgcmVwb3J0UGF0aFtpXS5uYW1lXG4gICAgfVxuXG4gICAgcmV0dXJuIHBhdGguc2xpY2UoMSlcbn1cblxuZXhwb3J0cy5qb2luUGF0aCA9IGZ1bmN0aW9uIChyZXBvcnQpIHtcbiAgICByZXR1cm4gam9pblBhdGgocmVwb3J0LnBhdGgpXG59XG5cbmV4cG9ydHMuc3BlZWQgPSBmdW5jdGlvbiAocmVwb3J0KSB7XG4gICAgaWYgKHJlcG9ydC5kdXJhdGlvbiA+PSByZXBvcnQuc2xvdykgcmV0dXJuIFwic2xvd1wiXG4gICAgaWYgKHJlcG9ydC5kdXJhdGlvbiA+PSByZXBvcnQuc2xvdyAvIDIpIHJldHVybiBcIm1lZGl1bVwiXG4gICAgaWYgKHJlcG9ydC5kdXJhdGlvbiA+PSAwKSByZXR1cm4gXCJmYXN0XCJcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcihcIkR1cmF0aW9uIG11c3Qgbm90IGJlIG5lZ2F0aXZlXCIpXG59XG5cbmV4cG9ydHMuZm9ybWF0VGltZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHMgPSAxMDAwIC8qIG1zICovXG4gICAgdmFyIG0gPSA2MCAqIHNcbiAgICB2YXIgaCA9IDYwICogbVxuICAgIHZhciBkID0gMjQgKiBoXG5cbiAgICByZXR1cm4gZnVuY3Rpb24gKG1zKSB7XG4gICAgICAgIGlmIChtcyA+PSBkKSByZXR1cm4gTWF0aC5yb3VuZChtcyAvIGQpICsgXCJkXCJcbiAgICAgICAgaWYgKG1zID49IGgpIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gaCkgKyBcImhcIlxuICAgICAgICBpZiAobXMgPj0gbSkgcmV0dXJuIE1hdGgucm91bmQobXMgLyBtKSArIFwibVwiXG4gICAgICAgIGlmIChtcyA+PSBzKSByZXR1cm4gTWF0aC5yb3VuZChtcyAvIHMpICsgXCJzXCJcbiAgICAgICAgcmV0dXJuIG1zICsgXCJtc1wiXG4gICAgfVxufSkoKVxuXG5leHBvcnRzLmZvcm1hdFJlc3QgPSBmdW5jdGlvbiAocmVwb3J0KSB7XG4gICAgaWYgKCFyZXBvcnQuaXNIb29rKSByZXR1cm4gXCJcIlxuICAgIHZhciBwYXRoID0gXCIgKFwiXG5cbiAgICBpZiAocmVwb3J0LnJvb3RQYXRoLmxlbmd0aCkge1xuICAgICAgICBwYXRoICs9IHJlcG9ydC5zdGFnZVxuICAgICAgICBpZiAocmVwb3J0Lm5hbWUpIHBhdGggKz0gXCIg4oCSIFwiICsgcmVwb3J0Lm5hbWVcbiAgICAgICAgaWYgKHJlcG9ydC5wYXRoLmxlbmd0aCA+IHJlcG9ydC5yb290UGF0aC5sZW5ndGggKyAxKSB7XG4gICAgICAgICAgICBwYXRoICs9IFwiLCBpbiBcIiArIGpvaW5QYXRoKHJlcG9ydC5yb290UGF0aClcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHBhdGggKz0gXCJnbG9iYWwgXCIgKyByZXBvcnQuc3RhZ2VcbiAgICAgICAgaWYgKHJlcG9ydC5uYW1lKSBwYXRoICs9IFwiIOKAkiBcIiArIHJlcG9ydC5uYW1lXG4gICAgfVxuXG4gICAgcmV0dXJuIHBhdGggKyBcIilcIlxufVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxuLy8gR2VuZXJhbCBDTEkgYW5kIHJlcG9ydGVyIHNldHRpbmdzLiBJZiBzb21ldGhpbmcgbmVlZHMgdG9cblxudmFyIENvbnNvbGUgPSByZXF1aXJlKFwiLi9yZXBsYWNlZC9jb25zb2xlXCIpXG5cbnZhciB3aW5kb3dXaWR0aCA9IENvbnNvbGUud2luZG93V2lkdGhcbnZhciBuZXdsaW5lID0gQ29uc29sZS5uZXdsaW5lXG52YXIgU3ltYm9scyA9IENvbnNvbGUuU3ltYm9sc1xudmFyIGRlZmF1bHRPcHRzID0gQ29uc29sZS5kZWZhdWx0T3B0c1xuXG5leHBvcnRzLndpbmRvd1dpZHRoID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gd2luZG93V2lkdGggfVxuZXhwb3J0cy5uZXdsaW5lID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gbmV3bGluZSB9XG5leHBvcnRzLnN5bWJvbHMgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBTeW1ib2xzIH1cbmV4cG9ydHMuZGVmYXVsdE9wdHMgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBkZWZhdWx0T3B0cyB9XG5cbmV4cG9ydHMuc2V0V2luZG93V2lkdGggPSBmdW5jdGlvbiAodmFsdWUpIHsgcmV0dXJuIHdpbmRvd1dpZHRoID0gdmFsdWUgfVxuZXhwb3J0cy5zZXROZXdsaW5lID0gZnVuY3Rpb24gKHZhbHVlKSB7IHJldHVybiBuZXdsaW5lID0gdmFsdWUgfVxuZXhwb3J0cy5zZXRTeW1ib2xzID0gZnVuY3Rpb24gKHZhbHVlKSB7IHJldHVybiBTeW1ib2xzID0gdmFsdWUgfVxuZXhwb3J0cy5zZXREZWZhdWx0T3B0cyA9IGZ1bmN0aW9uICh2YWx1ZSkgeyByZXR1cm4gZGVmYXVsdE9wdHMgPSB2YWx1ZSB9XG5cbi8vIENvbnNvbGUuY29sb3JTdXBwb3J0IGlzIGEgbWFzayB3aXRoIHRoZSBmb2xsb3dpbmcgYml0czpcbi8vIDB4MSAtIGlmIHNldCwgY29sb3JzIHN1cHBvcnRlZCBieSBkZWZhdWx0XG4vLyAweDIgLSBpZiBzZXQsIGZvcmNlIGNvbG9yIHN1cHBvcnRcbi8vXG4vLyBUaGlzIGlzIHB1cmVseSBhbiBpbXBsZW1lbnRhdGlvbiBkZXRhaWwsIGFuZCBpcyBpbnZpc2libGUgdG8gdGhlIG91dHNpZGVcbi8vIHdvcmxkLlxudmFyIGNvbG9yU3VwcG9ydCA9IENvbnNvbGUuY29sb3JTdXBwb3J0XG52YXIgbWFzayA9IGNvbG9yU3VwcG9ydFxuXG5leHBvcnRzLkNvbG9ycyA9IHtcbiAgICBzdXBwb3J0ZWQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIChtYXNrICYgMHgxKSAhPT0gMFxuICAgIH0sXG5cbiAgICBmb3JjZWQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIChtYXNrICYgMHgyKSAhPT0gMFxuICAgIH0sXG5cbiAgICBtYXliZVNldDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIGlmICgobWFzayAmIDB4MikgPT09IDApIG1hc2sgPSB2YWx1ZSA/IDB4MSA6IDBcbiAgICB9LFxuXG4gICAgbWF5YmVSZXN0b3JlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICgobWFzayAmIDB4MikgPT09IDApIG1hc2sgPSBjb2xvclN1cHBvcnQgJiAweDFcbiAgICB9LFxuXG4gICAgLy8gT25seSBmb3IgZGVidWdnaW5nXG4gICAgZm9yY2VTZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICBtYXNrID0gdmFsdWUgPyAweDMgOiAweDJcbiAgICB9LFxuXG4gICAgZm9yY2VSZXN0b3JlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIG1hc2sgPSBjb2xvclN1cHBvcnRcbiAgICB9LFxuXG4gICAgZ2V0U3VwcG9ydDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3VwcG9ydGVkOiAoY29sb3JTdXBwb3J0ICYgMHgxKSAhPT0gMCxcbiAgICAgICAgICAgIGZvcmNlZDogKGNvbG9yU3VwcG9ydCAmIDB4MikgIT09IDAsXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgc2V0U3VwcG9ydDogZnVuY3Rpb24gKG9wdHMpIHtcbiAgICAgICAgbWFzayA9IGNvbG9yU3VwcG9ydCA9XG4gICAgICAgICAgICAob3B0cy5zdXBwb3J0ZWQgPyAweDEgOiAwKSB8IChvcHRzLmZvcmNlZCA/IDB4MiA6IDApXG4gICAgfSxcbn1cbiIsIlwidXNlIHN0cmljdFwiXG5cbnZhciBtZXRob2RzID0gcmVxdWlyZShcIi4vbWV0aG9kc1wiKVxuXG5leHBvcnRzLmdldFR5cGUgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICBpZiAodmFsdWUgPT0gbnVsbCkgcmV0dXJuIFwibnVsbFwiXG4gICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSByZXR1cm4gXCJhcnJheVwiXG4gICAgcmV0dXJuIHR5cGVvZiB2YWx1ZVxufVxuXG4vLyBQaGFudG9tSlMsIElFLCBhbmQgcG9zc2libHkgRWRnZSBkb24ndCBzZXQgdGhlIHN0YWNrIHRyYWNlIHVudGlsIHRoZSBlcnJvciBpc1xuLy8gdGhyb3duLiBOb3RlIHRoYXQgdGhpcyBwcmVmZXJzIGFuIGV4aXN0aW5nIHN0YWNrIGZpcnN0LCBzaW5jZSBub24tbmF0aXZlXG4vLyBlcnJvcnMgbGlrZWx5IGFscmVhZHkgY29udGFpbiB0aGlzLiBOb3RlIHRoYXQgdGhpcyBpc24ndCBuZWNlc3NhcnkgaW4gdGhlXG4vLyBDTEkgLSB0aGF0IG9ubHkgdGFyZ2V0cyBOb2RlLlxuZXhwb3J0cy5nZXRTdGFjayA9IGZ1bmN0aW9uIChlKSB7XG4gICAgdmFyIHN0YWNrID0gZS5zdGFja1xuXG4gICAgaWYgKCEoZSBpbnN0YW5jZW9mIEVycm9yKSB8fCBzdGFjayAhPSBudWxsKSByZXR1cm4gc3RhY2tcblxuICAgIHRyeSB7XG4gICAgICAgIHRocm93IGVcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHJldHVybiBlLnN0YWNrXG4gICAgfVxufVxuXG5leHBvcnRzLnBjYWxsID0gZnVuY3Rpb24gKGZ1bmMpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICByZXR1cm4gZnVuYyhmdW5jdGlvbiAoZSwgdmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybiBlICE9IG51bGwgPyByZWplY3QoZSkgOiByZXNvbHZlKHZhbHVlKVxuICAgICAgICB9KVxuICAgIH0pXG59XG5cbmV4cG9ydHMucGVhY2ggPSBmdW5jdGlvbiAobGlzdCwgZnVuYykge1xuICAgIHZhciBsZW4gPSBsaXN0Lmxlbmd0aFxuICAgIHZhciBwID0gUHJvbWlzZS5yZXNvbHZlKClcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgcCA9IHAudGhlbihmdW5jLmJpbmQodW5kZWZpbmVkLCBsaXN0W2ldLCBpKSlcbiAgICB9XG5cbiAgICByZXR1cm4gcFxufVxuXG4vKipcbiAqIEEgbGF6eSBhY2Nlc3NvciwgY29tcGxldGUgd2l0aCB0aHJvd24gZXJyb3IgbWVtb2l6YXRpb24gYW5kIGEgZGVjZW50IGFtb3VudFxuICogb2Ygb3B0aW1pemF0aW9uLCBzaW5jZSBpdCdzIHVzZWQgaW4gYSBsb3Qgb2YgY29kZS5cbiAqXG4gKiBOb3RlIHRoYXQgdGhpcyB1c2VzIHJlZmVyZW5jZSBpbmRpcmVjdGlvbiBhbmQgZGlyZWN0IG11dGF0aW9uIHRvIGtlZXAgb25seVxuICoganVzdCB0aGUgY29tcHV0YXRpb24gbm9uLWNvbnN0YW50LCBzbyBlbmdpbmVzIGNhbiBhdm9pZCBjbG9zdXJlIGFsbG9jYXRpb24uXG4gKiBBbHNvLCBgY3JlYXRlYCBpcyBpbnRlbnRpb25hbGx5IGtlcHQgKm91dCogb2YgYW55IGNsb3N1cmUsIHNvIGl0IGNhbiBiZSBtb3JlXG4gKiBlYXNpbHkgY29sbGVjdGVkLlxuICovXG5mdW5jdGlvbiBMYXp5KGNyZWF0ZSkge1xuICAgIHRoaXMudmFsdWUgPSBjcmVhdGVcbiAgICB0aGlzLmdldCA9IHRoaXMuaW5pdFxufVxuXG5tZXRob2RzKExhenksIHtcbiAgICByZWN1cnNpdmU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkxhenkgZnVuY3Rpb25zIG11c3Qgbm90IGJlIGNhbGxlZCByZWN1cnNpdmVseSFcIilcbiAgICB9LFxuXG4gICAgcmV0dXJuOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlXG4gICAgfSxcblxuICAgIHRocm93OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRocm93IHRoaXMudmFsdWVcbiAgICB9LFxuXG4gICAgaW5pdDogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmdldCA9IHRoaXMucmVjdXJzaXZlXG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRoaXMudmFsdWUgPSAoMCwgdGhpcy52YWx1ZSkoKVxuICAgICAgICAgICAgdGhpcy5nZXQgPSB0aGlzLnJldHVyblxuICAgICAgICAgICAgcmV0dXJuIHRoaXMudmFsdWVcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgdGhpcy52YWx1ZSA9IGVcbiAgICAgICAgICAgIHRoaXMuZ2V0ID0gdGhpcy50aHJvd1xuICAgICAgICAgICAgdGhyb3cgdGhpcy52YWx1ZVxuICAgICAgICB9XG4gICAgfSxcbn0pXG5cbmV4cG9ydHMubGF6eSA9IGZ1bmN0aW9uIChjcmVhdGUpIHtcbiAgICB2YXIgcmVmID0gbmV3IExhenkoY3JlYXRlKVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHJlZi5nZXQoKVxuICAgIH1cbn1cbiIsIlwidXNlIHN0cmljdFwiXG5cbi8vIFRvIHN1cHByZXNzIGRlcHJlY2F0aW9uIG1lc3NhZ2VzXG52YXIgc3VwcHJlc3NEZXByZWNhdGlvbiA9IHRydWVcblxuZXhwb3J0cy5zaG93RGVwcmVjYXRpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgc3VwcHJlc3NEZXByZWNhdGlvbiA9IGZhbHNlXG59XG5cbmV4cG9ydHMuaGlkZURlcHJlY2F0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgIHN1cHByZXNzRGVwcmVjYXRpb24gPSB0cnVlXG59XG5cbnZhciBjb25zb2xlID0gZ2xvYmFsLmNvbnNvbGVcbnZhciBzaG91bGRQcmludCA9IGNvbnNvbGUgIT0gbnVsbCAmJiB0eXBlb2YgY29uc29sZS53YXJuID09PSBcImZ1bmN0aW9uXCIgJiZcbiAgICAhKGdsb2JhbC5wcm9jZXNzICE9IG51bGwgJiYgZ2xvYmFsLnByb2Nlc3MuZW52ICE9IG51bGwgJiZcbiAgICAgICAgZ2xvYmFsLnByb2Nlc3MuZW52Lk5PX01JR1JBVEVfV0FSTilcblxuZXhwb3J0cy53YXJuID0gZnVuY3Rpb24gKCkge1xuICAgIGlmIChzaG91bGRQcmludCAmJiAhc3VwcHJlc3NEZXByZWNhdGlvbikge1xuICAgICAgICBjb25zb2xlLndhcm4uYXBwbHkoY29uc29sZSwgYXJndW1lbnRzKVxuICAgIH1cbn1cblxuZXhwb3J0cy5kZXByZWNhdGUgPSBmdW5jdGlvbiAobWVzc2FnZSwgZnVuYykge1xuICAgIHZhciBwcmludGVkID0gIXNob3VsZFByaW50XG5cbiAgICAvKiogQHRoaXMgKi9cbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIXN1cHByZXNzRGVwcmVjYXRpb24pIHtcbiAgICAgICAgICAgIGlmICghcHJpbnRlZCkge1xuICAgICAgICAgICAgICAgIHByaW50ZWQgPSB0cnVlXG4gICAgICAgICAgICAgICAgY29uc29sZS50cmFjZSgpXG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKG1lc3NhZ2UpXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG1lc3NhZ2UgPSB1bmRlZmluZWRcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmdW5jLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgICB9XG59XG4iLCJcInVzZSBzdHJpY3RcIlxuXG4vKipcbiAqIEJhY2twb3J0IHdyYXBwZXIgdG8gd2FybiBhYm91dCBtb3N0IG9mIHRoZSBtYWpvciBicmVha2luZyBjaGFuZ2VzIGZyb20gdGhlXG4gKiBsYXN0IG1ham9yIHZlcnNpb24sIGFuZCB0byBoZWxwIG1lIGtlZXAgdHJhY2sgb2YgYWxsIHRoZSBjaGFuZ2VzLlxuICpcbiAqIEl0IGNvbnNpc3RzIG9mIHNvbGVseSBpbnRlcm5hbCBtb25rZXkgcGF0Y2hpbmcgdG8gcmV2aXZlIHN1cHBvcnQgb2YgcHJldmlvdXNcbiAqIHZlcnNpb25zLCBhbHRob3VnaCBJIHRyaWVkIHRvIGxpbWl0IGhvdyBtdWNoIGtub3dsZWRnZSBvZiB0aGUgaW50ZXJuYWxzIHRoaXNcbiAqIHJlcXVpcmVzLlxuICovXG5cbnZhciBDb21tb24gPSByZXF1aXJlKFwiLi9jb21tb25cIilcbnZhciBJbnRlcm5hbCA9IHJlcXVpcmUoXCIuLi9pbnRlcm5hbFwiKVxudmFyIG1ldGhvZHMgPSByZXF1aXJlKFwiLi4vbGliL21ldGhvZHNcIilcbnZhciBSZXBvcnQgPSByZXF1aXJlKFwiLi4vbGliL2NvcmUvcmVwb3J0c1wiKS5SZXBvcnRcbnZhciBSZWZsZWN0ID0gcmVxdWlyZShcIi4uL2xpYi9hcGkvcmVmbGVjdFwiKVxudmFyIFRoYWxsaXVtID0gcmVxdWlyZShcIi4uL2xpYi9hcGkvdGhhbGxpdW1cIilcblxudmFyIGFzc2VydCA9IHJlcXVpcmUoXCJjbGVhbi1hc3NlcnRcIilcblxuLyogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqXG4gKiAtIGByZWZsZWN0LmNoZWNrSW5pdCgpYCBpcyBkZXByZWNhdGVkIGluIGZhdm9yIG9mIGByZWZsZWN0LmxvY2tlZGAgYW5kICAgICpcbiAqICAgZWl0aGVyIGNvbXBsYWluaW5nIHlvdXJzZWxmIG9yIGp1c3QgdXNpbmcgYHJlZmxlY3QuY3VycmVudGAgdG8gYWRkICAgICAgKlxuICogICB0aGluZ3MuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICovXG5tZXRob2RzKFJlZmxlY3QsIHtcbiAgICBjaGVja0luaXQ6IENvbW1vbi5kZXByZWNhdGUoXG4gICAgICAgIFwiYHJlZmxlY3QuY2hlY2tJbml0YCBpcyBkZXByZWNhdGVkLiBVc2UgYHJlZmxlY3QuY3VycmVudGAgZm9yIHRoZSBcIiArXG4gICAgICAgIFwiY3VycmVudCB0ZXN0IG9yIHVzZSBgcmVmbGVjdC5sb2NrZWRgIGFuZCBjcmVhdGUgYW5kIHRocm93IHRoZSBlcnJvciBcIiArXG4gICAgICAgIFwieW91cnNlbGYuXCIsXG4gICAgICAgIC8qKiBAdGhpcyAqLyBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5sb2NrZWQpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgUmVmZXJlbmNlRXJyb3IoXCJJdCBpcyBvbmx5IHNhZmUgdG8gY2FsbCB0ZXN0IFwiICtcbiAgICAgICAgICAgICAgICAgICAgXCJtZXRob2RzIGR1cmluZyBpbml0aWFsaXphdGlvblwiKVxuICAgICAgICAgICAgfVxuICAgICAgICB9KSxcbn0pXG5cbi8qICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKlxuICogLSBgdC5hc3luY2AgLT4gYHQudGVzdGAsIHdoaWNoIG5vdyBzdXBwb3J0cyBwcm9taXNlcy4gICAgICAgICAgICAgICAgICAgICAqXG4gKiAtIEFsbCB0ZXN0cyBhcmUgbm93IGFzeW5jLiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKi9cblxudmFyIHRlc3QgPSBUaGFsbGl1bS5wcm90b3R5cGUudGVzdFxuXG5mdW5jdGlvbiBydW5Bc3luYyhjYWxsYmFjaywgdCwgcmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgdmFyIHJlc29sdmVkID0gZmFsc2VcbiAgICB2YXIgZ2VuID0gY2FsbGJhY2suY2FsbCh0LCB0LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIGlmIChyZXNvbHZlZCkgcmV0dXJuXG4gICAgICAgIENvbW1vbi53YXJuKFwiYHQuYXN5bmNgIGlzIGRlcHJlY2F0ZWQuIFwiICtcbiAgICAgICAgICAgIFwiVXNlIGB0LnRlc3RgIGFuZCByZXR1cm4gYSBwcm9taXNlIGluc3RlYWQuXCIpXG5cbiAgICAgICAgcmVzb2x2ZWQgPSB0cnVlXG4gICAgICAgIGlmIChlcnIgIT0gbnVsbCkgcmVqZWN0KGVycilcbiAgICAgICAgZWxzZSByZXNvbHZlKClcbiAgICB9KVxuXG4gICAgaWYgKHJlc29sdmVkKSByZXR1cm5cblxuICAgIGlmICh0eXBlb2YgZ2VuLm5leHQgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAvLyBBbGxvdyB0aGUgbWlncmF0aW9uIHBhdGggdG8gc3RhbmRhcmQgdGhlbmFibGVzLlxuICAgICAgICByZXNvbHZlKGdlbilcbiAgICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgQ29tbW9uLndhcm4oXCJgdC5hc3luY2AgaXMgZGVwcmVjYXRlZC4gVXNlIGB0LnRlc3RgIGFuZCBlaXRoZXIgcmV0dXJuIGEgXCIgK1xuICAgICAgICBcInByb21pc2Ugb3IgdXNlIGBjb2AvRVMyMDE3IGFzeW5jIGZ1bmN0aW9ucyBpbnN0ZWFkLlwiKVxuXG4gICAgLy8gVGhpcyBpcyBhIG1vZGlmaWVkIHZlcnNpb24gb2YgdGhlIGFzeW5jLWF3YWl0IG9mZmljaWFsLCBub24tbm9ybWF0aXZlXG4gICAgLy8gZGVzdWdhcmluZyBoZWxwZXIsIGZvciBiZXR0ZXIgZXJyb3IgY2hlY2tpbmcgYW5kIGFkYXB0ZWQgdG8gYWNjZXB0IGFuXG4gICAgLy8gYWxyZWFkeS1pbnN0YW50aWF0ZWQgaXRlcmF0b3IgaW5zdGVhZCBvZiBhIGdlbmVyYXRvci5cbiAgICBmdW5jdGlvbiBpdGVyYXRlKG5leHQpIHtcbiAgICAgICAgLy8gZmluaXNoZWQgd2l0aCBzdWNjZXNzLCByZXNvbHZlIHRoZSBwcm9taXNlXG4gICAgICAgIGlmIChuZXh0LmRvbmUpIHJldHVybiBQcm9taXNlLnJlc29sdmUobmV4dC52YWx1ZSlcblxuICAgICAgICAvLyBub3QgZmluaXNoZWQsIGNoYWluIG9mZiB0aGUgeWllbGRlZCBwcm9taXNlIGFuZCBzdGVwIGFnYWluXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobmV4dC52YWx1ZSkudGhlbihcbiAgICAgICAgICAgIGZ1bmN0aW9uICh2KSB7IHJldHVybiBpdGVyYXRlKGdlbi5uZXh0KHYpKSB9LFxuICAgICAgICAgICAgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGdlbi50aHJvdyA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpdGVyYXRlKGdlbi50aHJvdyhlKSlcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICB9XG5cbiAgICBpdGVyYXRlKGdlbi5uZXh0KHVuZGVmaW5lZCkpLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KVxufVxuXG5tZXRob2RzKFRoYWxsaXVtLCB7XG4gICAgYXN5bmM6IGZ1bmN0aW9uIChuYW1lLCBjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIC8vIFJldXNlIHRoZSBub3JtYWwgZXJyb3IgaGFuZGxpbmcuXG4gICAgICAgICAgICByZXR1cm4gdGVzdC5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGVzdC5jYWxsKHRoaXMsIG5hbWUsIGZ1bmN0aW9uICh0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJ1bkFzeW5jKGNhbGxiYWNrLCB0LCByZXNvbHZlLCByZWplY3QpXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgYXN5bmNTa2lwOiBDb21tb24uZGVwcmVjYXRlKFxuICAgICAgICBcImB0LmFzeW5jU2tpcGAgaXMgZGVwcmVjYXRlZC4gVXNlIGB0LnRlc3RTa2lwYCBpbnN0ZWFkLlwiLFxuICAgICAgICBUaGFsbGl1bS5wcm90b3R5cGUudGVzdFNraXApLFxufSlcblxubWV0aG9kcyhSZWZsZWN0LCB7XG4gICAgZ2V0IGlzQXN5bmMoKSB7XG4gICAgICAgIENvbW1vbi53YXJuKFwiVGVzdHMgYXJlIG5vdyBhbHdheXMgYXN5bmMuIFlvdSBubyBsb25nZXIgbmVlZCB0byBcIiArXG4gICAgICAgICAgICBcImhhbmRsZSB0aGUgb3RoZXIgY2FzZVwiKVxuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgIH0sXG59KVxuXG4vKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICpcbiAqIGByZWZsZWN0LmRlZmluZWAsIGB0LmRlZmluZWAsIGByZWZsZWN0LndyYXBgLCBhbmQgYHJlZmxlY3QuYWRkYCwgYXJlIGFsbCAgKlxuICogcmVtb3ZlZC4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICovXG5cbmZ1bmN0aW9uIGlzTG9ja2VkKG1ldGhvZCkge1xuICAgIHJldHVybiBtZXRob2QgPT09IFwiX1wiIHx8XG4gICAgICAgIG1ldGhvZCA9PT0gXCJyZWZsZWN0XCIgfHxcbiAgICAgICAgbWV0aG9kID09PSBcIm9ubHlcIiB8fFxuICAgICAgICBtZXRob2QgPT09IFwidXNlXCIgfHxcbiAgICAgICAgbWV0aG9kID09PSBcInJlcG9ydGVyXCIgfHxcbiAgICAgICAgbWV0aG9kID09PSBcImRlZmluZVwiIHx8XG4gICAgICAgIG1ldGhvZCA9PT0gXCJ0aW1lb3V0XCIgfHxcbiAgICAgICAgbWV0aG9kID09PSBcInNsb3dcIiB8fFxuICAgICAgICBtZXRob2QgPT09IFwicnVuXCIgfHxcbiAgICAgICAgbWV0aG9kID09PSBcInRlc3RcIiB8fFxuICAgICAgICBtZXRob2QgPT09IFwidGVzdFNraXBcIiB8fFxuICAgICAgICBtZXRob2QgPT09IFwiYXN5bmNcIiB8fFxuICAgICAgICBtZXRob2QgPT09IFwiYXN5bmNTa2lwXCJcbn1cblxuZnVuY3Rpb24gZ2V0RW51bWVyYWJsZVN5bWJvbHMoa2V5cywgb2JqZWN0KSB7XG4gICAgdmFyIHN5bWJvbHMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKG9iamVjdClcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3ltYm9scy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgc3ltID0gc3ltYm9sc1tpXVxuXG4gICAgICAgIGlmIChPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHN5bSkuZW51bWVyYWJsZSkga2V5cy5wdXNoKHN5bSlcbiAgICB9XG59XG5cbi8vIFRoaXMgaGFuZGxlcyBuYW1lICsgZnVuYyB2cyBvYmplY3Qgd2l0aCBtZXRob2RzLlxuZnVuY3Rpb24gaXRlcmF0ZVNldHRlcih0ZXN0LCBuYW1lLCBmdW5jLCBpdGVyYXRvcikge1xuICAgIC8vIENoZWNrIGJvdGggdGhlIG5hbWUgYW5kIGZ1bmN0aW9uLCBzbyBFUzYgc3ltYm9sIHBvbHlmaWxscyAod2hpY2ggdXNlXG4gICAgLy8gb2JqZWN0cyBzaW5jZSBpdCdzIGltcG9zc2libGUgdG8gZnVsbHkgcG9seWZpbGwgcHJpbWl0aXZlcykgd29yay5cbiAgICBpZiAodHlwZW9mIG5hbWUgPT09IFwib2JqZWN0XCIgJiYgbmFtZSAhPSBudWxsICYmIGZ1bmMgPT0gbnVsbCkge1xuICAgICAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKG5hbWUpXG5cbiAgICAgICAgaWYgKHR5cGVvZiBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIGdldEVudW1lcmFibGVTeW1ib2xzKGtleXMsIG5hbWUpXG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBrZXkgPSBrZXlzW2ldXG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgbmFtZVtrZXldICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgYm9keSB0byBiZSBhIGZ1bmN0aW9uXCIpXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRlc3QubWV0aG9kc1trZXldID0gaXRlcmF0b3IodGVzdCwga2V5LCBuYW1lW2tleV0pXG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBpZiAodHlwZW9mIGZ1bmMgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGJvZHkgdG8gYmUgYSBmdW5jdGlvblwiKVxuICAgICAgICB9XG5cbiAgICAgICAgdGVzdC5tZXRob2RzW25hbWVdID0gaXRlcmF0b3IodGVzdCwgbmFtZSwgZnVuYylcbiAgICB9XG59XG5cbi8qKlxuICogQHRoaXMge1N0YXRlfVxuICogUnVuIGBmdW5jYCB3aXRoIGAuLi5hcmdzYCB3aGVuIGFzc2VydGlvbnMgYXJlIHJ1biwgb25seSBpZiB0aGUgdGVzdCBpc24ndFxuICogc2tpcHBlZC4gVGhpcyBpcyBpbW1lZGlhdGVseSBmb3IgYmxvY2sgYW5kIGFzeW5jIHRlc3RzLCBidXQgZGVmZXJyZWQgZm9yXG4gKiBpbmxpbmUgdGVzdHMuIEl0J3MgdXNlZnVsIGZvciBpbmxpbmUgYXNzZXJ0aW9ucy5cbiAqL1xuZnVuY3Rpb24gYXR0ZW1wdChmdW5jLCBhLCBiLCBjLyogLCAuLi5hcmdzICovKSB7XG4gICAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgY2FzZSAwOiB0aHJvdyBuZXcgVHlwZUVycm9yKFwidW5yZWFjaGFibGVcIilcbiAgICBjYXNlIDE6IGZ1bmMoKTsgcmV0dXJuXG4gICAgY2FzZSAyOiBmdW5jKGEpOyByZXR1cm5cbiAgICBjYXNlIDM6IGZ1bmMoYSwgYik7IHJldHVyblxuICAgIGNhc2UgNDogZnVuYyhhLCBiLCBjKTsgcmV0dXJuXG4gICAgZGVmYXVsdDpcbiAgICAgICAgdmFyIGFyZ3MgPSBbXVxuXG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzLnB1c2goYXJndW1lbnRzW2ldKVxuICAgICAgICB9XG5cbiAgICAgICAgZnVuYy5hcHBseSh1bmRlZmluZWQsIGFyZ3MpXG4gICAgfVxufVxuXG5mdW5jdGlvbiBkZWZpbmVBc3NlcnRpb24odGVzdCwgbmFtZSwgZnVuYykge1xuICAgIC8vIERvbid0IGxldCBuYXRpdmUgbWV0aG9kcyBnZXQgb3ZlcnJpZGRlbiBieSBhc3NlcnRpb25zXG4gICAgaWYgKGlzTG9ja2VkKG5hbWUpKSB7XG4gICAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKFwiTWV0aG9kICdcIiArIG5hbWUgKyBcIicgaXMgbG9ja2VkIVwiKVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJ1bigpIHtcbiAgICAgICAgdmFyIHJlcyA9IGZ1bmMuYXBwbHkodW5kZWZpbmVkLCBhcmd1bWVudHMpXG5cbiAgICAgICAgaWYgKHR5cGVvZiByZXMgIT09IFwib2JqZWN0XCIgfHwgcmVzID09PSBudWxsKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgcmVzdWx0IHRvIGJlIGFuIG9iamVjdFwiKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFyZXMudGVzdCkge1xuICAgICAgICAgICAgYXNzZXJ0LmZhaWwocmVzLm1lc3NhZ2UsIHJlcylcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiAvKiogQHRoaXMgKi8gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgYXJncyA9IFtydW5dXG5cbiAgICAgICAgYXJncy5wdXNoLmFwcGx5KGFyZ3MsIGFyZ3VtZW50cylcbiAgICAgICAgYXR0ZW1wdC5hcHBseSh1bmRlZmluZWQsIGFyZ3MpXG4gICAgICAgIHJldHVybiB0aGlzXG4gICAgfVxufVxuXG5mdW5jdGlvbiB3cmFwQXNzZXJ0aW9uKHRlc3QsIG5hbWUsIGZ1bmMpIHtcbiAgICAvLyBEb24ndCBsZXQgYHJlZmxlY3RgIGFuZCBgX2AgY2hhbmdlLlxuICAgIGlmIChuYW1lID09PSBcInJlZmxlY3RcIiB8fCBuYW1lID09PSBcIl9cIikge1xuICAgICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcihcIk1ldGhvZCAnXCIgKyBuYW1lICsgXCInIGlzIGxvY2tlZCFcIilcbiAgICB9XG5cbiAgICB2YXIgb2xkID0gdGVzdC5tZXRob2RzW25hbWVdXG5cbiAgICBpZiAodHlwZW9mIG9sZCAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgICAgICBcIkV4cGVjdGVkIHQuXCIgKyBuYW1lICsgXCIgdG8gYWxyZWFkeSBiZSBhIGZ1bmN0aW9uXCIpXG4gICAgfVxuXG4gICAgLyoqIEB0aGlzICovXG4gICAgZnVuY3Rpb24gYXBwbHkoYSwgYiwgYywgZCkge1xuICAgICAgICBzd2l0Y2ggKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgY2FzZSAwOiByZXR1cm4gZnVuYy5jYWxsKHRoaXMsIG9sZC5iaW5kKHRoaXMpKVxuICAgICAgICBjYXNlIDE6IHJldHVybiBmdW5jLmNhbGwodGhpcywgb2xkLmJpbmQodGhpcyksIGEpXG4gICAgICAgIGNhc2UgMjogcmV0dXJuIGZ1bmMuY2FsbCh0aGlzLCBvbGQuYmluZCh0aGlzKSwgYSwgYilcbiAgICAgICAgY2FzZSAzOiByZXR1cm4gZnVuYy5jYWxsKHRoaXMsIG9sZC5iaW5kKHRoaXMpLCBhLCBiLCBjKVxuICAgICAgICBjYXNlIDQ6IHJldHVybiBmdW5jLmNhbGwodGhpcywgb2xkLmJpbmQodGhpcyksIGEsIGIsIGMsIGQpXG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICB2YXIgYXJncyA9IFtvbGQuYmluZCh0aGlzKV1cblxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBhcmdzLnB1c2goYXJndW1lbnRzW2ldKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gZnVuYy5hcHBseSh0aGlzLCBhcmdzKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIC8qKiBAdGhpcyAqLyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciByZXQgPSBhcHBseS5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG5cbiAgICAgICAgcmV0dXJuIHJldCAhPT0gdW5kZWZpbmVkID8gcmV0IDogdGhpc1xuICAgIH1cbn1cblxuZnVuY3Rpb24gYWRkQXNzZXJ0aW9uKHRlc3QsIG5hbWUsIGZ1bmMpIHtcbiAgICBpZiAodHlwZW9mIHRlc3QubWV0aG9kc1tuYW1lXSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiTWV0aG9kICdcIiArIG5hbWUgKyBcIicgYWxyZWFkeSBleGlzdHMhXCIpXG4gICAgfVxuXG4gICAgLyoqIEB0aGlzICovXG4gICAgZnVuY3Rpb24gYXBwbHkoYSwgYiwgYywgZCkge1xuICAgICAgICBzd2l0Y2ggKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgY2FzZSAwOiByZXR1cm4gZnVuYy5jYWxsKHRoaXMsIHRoaXMpXG4gICAgICAgIGNhc2UgMTogcmV0dXJuIGZ1bmMuY2FsbCh0aGlzLCB0aGlzLCBhKVxuICAgICAgICBjYXNlIDI6IHJldHVybiBmdW5jLmNhbGwodGhpcywgdGhpcywgYSwgYilcbiAgICAgICAgY2FzZSAzOiByZXR1cm4gZnVuYy5jYWxsKHRoaXMsIHRoaXMsIGEsIGIsIGMpXG4gICAgICAgIGNhc2UgNDogcmV0dXJuIGZ1bmMuY2FsbCh0aGlzLCB0aGlzLCBhLCBiLCBjLCBkKVxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgdmFyIGFyZ3MgPSBbdGhpc11cblxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBhcmdzLnB1c2goYXJndW1lbnRzW2ldKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gZnVuYy5hcHBseSh0aGlzLCBhcmdzKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIC8qKiBAdGhpcyAqLyBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciByZXQgPSBhcHBseS5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG5cbiAgICAgICAgcmV0dXJuIHJldCAhPT0gdW5kZWZpbmVkID8gcmV0IDogdGhpc1xuICAgIH1cbn1cblxubWV0aG9kcyhSZWZsZWN0LCB7XG4gICAgZGVmaW5lOiBDb21tb24uZGVwcmVjYXRlKFxuICAgICAgICBcImByZWZsZWN0LmRlZmluZWAgaXMgZGVwcmVjYXRlZC4gVXNlIGV4dGVybmFsIG1ldGhvZHMgb3IgZGlyZWN0IGFzc2lnbm1lbnQgaW5zdGVhZC5cIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtbGVuXG4gICAgICAgIC8qKiBAdGhpcyAqLyBmdW5jdGlvbiAobmFtZSwgZnVuYykge1xuICAgICAgICAgICAgaXRlcmF0ZVNldHRlcih0aGlzLl8uY3VycmVudC52YWx1ZSwgbmFtZSwgZnVuYywgZGVmaW5lQXNzZXJ0aW9uKVxuICAgICAgICB9KSxcblxuICAgIHdyYXA6IENvbW1vbi5kZXByZWNhdGUoXG4gICAgICAgIFwiYHJlZmxlY3Qud3JhcGAgaXMgZGVwcmVjYXRlZC4gVXNlIGV4dGVybmFsIG1ldGhvZHMgb3IgZGlyZWN0IGFzc2lnbm1lbnQgaW5zdGVhZC5cIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtbGVuXG4gICAgICAgIC8qKiBAdGhpcyAqLyBmdW5jdGlvbiAobmFtZSwgZnVuYykge1xuICAgICAgICAgICAgaXRlcmF0ZVNldHRlcih0aGlzLl8uY3VycmVudC52YWx1ZSwgbmFtZSwgZnVuYywgd3JhcEFzc2VydGlvbilcbiAgICAgICAgfSksXG5cbiAgICBhZGQ6IENvbW1vbi5kZXByZWNhdGUoXG4gICAgICAgIFwiYHJlZmxlY3QuYWRkYCBpcyBkZXByZWNhdGVkLiBVc2UgZXh0ZXJuYWwgbWV0aG9kcyBvciBkaXJlY3QgYXNzaWdubWVudCBpbnN0ZWFkLlwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1sZW5cbiAgICAgICAgLyoqIEB0aGlzICovIGZ1bmN0aW9uIChuYW1lLCBmdW5jKSB7XG4gICAgICAgICAgICBpdGVyYXRlU2V0dGVyKHRoaXMuXy5jdXJyZW50LnZhbHVlLCBuYW1lLCBmdW5jLCBhZGRBc3NlcnRpb24pXG4gICAgICAgIH0pLFxufSlcblxubWV0aG9kcyhUaGFsbGl1bSwge1xuICAgIGRlZmluZTogQ29tbW9uLmRlcHJlY2F0ZShcbiAgICAgICAgXCJgdC5kZWZpbmVgIGlzIGRlcHJlY2F0ZWQuIFVzZSBleHRlcm5hbCBtZXRob2RzIG9yIGRpcmVjdCBhc3NpZ25tZW50IGluc3RlYWQuXCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LWxlblxuICAgICAgICAvKiogQHRoaXMgKi8gZnVuY3Rpb24gKG5hbWUsIGZ1bmMpIHtcbiAgICAgICAgICAgIGl0ZXJhdGVTZXR0ZXIodGhpcy5fLmN1cnJlbnQudmFsdWUsIG5hbWUsIGZ1bmMsIGRlZmluZUFzc2VydGlvbilcbiAgICAgICAgICAgIHJldHVybiB0aGlzXG4gICAgICAgIH0pLFxufSlcblxuLyogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqXG4gKiAtIGByZWZsZWN0LmRvYCBpcyBkZXByZWNhdGVkLCB3aXRoIG5vIHJlcGxhY2VtZW50IChpbmxpbmUgdGVzdHMgYXJlIGFsc28gICpcbiAqICAgZGVwcmVjYXRlZCkuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogLSBgcmVmbGVjdC5iYXNlYCAtPiBgaW50ZXJuYWwucm9vdGAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiAtIGByZWZsZWN0LkFzc2VydGlvbkVycm9yYCAtPiBgYXNzZXJ0LkFzc2VydGlvbkVycm9yYC4gICAgICAgICAgICAgICAgICAgICpcbiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKi9cblxubWV0aG9kcyhSZWZsZWN0LCB7XG4gICAgLy8gRGVwcmVjYXRlZCBhbGlhc2VzXG4gICAgZG86IENvbW1vbi5kZXByZWNhdGUoXG4gICAgICAgIFwiYHJlZmxlY3QuZG9gIGlzIGRlcHJlY2F0ZWQuIFRyYW5zaXRpb24gdG8gYmxvY2sgdGVzdHMsIGlmIG5lY2Vzc2FyeSwgYW5kIHJ1biB0aGUgY29kZSBkaXJlY3RseS5cIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtbGVuXG4gICAgICAgIC8qKiBAdGhpcyAqLyBmdW5jdGlvbiAoZnVuYykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBmdW5jICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgY2FsbGJhY2sgdG8gYmUgYSBmdW5jdGlvblwiKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBhdHRlbXB0LmFwcGx5KHVuZGVmaW5lZCwgYXJndW1lbnRzKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXNcbiAgICAgICAgfSksXG4gICAgYmFzZTogQ29tbW9uLmRlcHJlY2F0ZShcbiAgICAgICAgXCJgcmVmbGVjdC5iYXNlYCBpcyBkZXByZWNhdGVkLiBVc2UgYGludGVybmFsLnJvb3RgIGZyb20gYHRoYWxsaXVtL2ludGVybmFsYCBpbnN0ZWFkLlwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1sZW5cbiAgICAgICAgSW50ZXJuYWwucm9vdCksXG59KVxuXG4vLyBFU0xpbnQgb2RkbHkgY2FuJ3QgdGVsbCB0aGVzZSBhcmUgc2hhZG93ZWQuXG4vKiBlc2xpbnQtZGlzYWJsZSBuby1leHRlbmQtbmF0aXZlICovXG5cbmZ1bmN0aW9uIGxvY2tFcnJvcihBc3NlcnRpb25FcnJvcikge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShSZWZsZWN0LnByb3RvdHlwZSwgXCJBc3NlcnRpb25FcnJvclwiLCB7XG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogQXNzZXJ0aW9uRXJyb3IsXG4gICAgfSlcbiAgICByZXR1cm4gQXNzZXJ0aW9uRXJyb3Jcbn1cblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KFJlZmxlY3QucHJvdG90eXBlLCBcIkFzc2VydGlvbkVycm9yXCIsIHtcbiAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgZ2V0OiBDb21tb24uZGVwcmVjYXRlKFxuICAgICAgICBcImByZWZsZWN0LkFzc2VydGlvbkVycm9yYCBpcyBkZXByZWNhdGVkLiBVc2UgYGFzc2VydC5Bc3NlcnRpb25FcnJvcmAgZnJvbSBgdGhhbGxpdW0vYXNzZXJ0YCBpbnN0ZWFkLlwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1sZW5cbiAgICAgICAgZnVuY3Rpb24gKCkgeyByZXR1cm4gbG9ja0Vycm9yKGFzc2VydC5Bc3NlcnRpb25FcnJvcikgfSksXG4gICAgc2V0OiBDb21tb24uZGVwcmVjYXRlKFxuICAgICAgICBcImByZWZsZWN0LkFzc2VydGlvbkVycm9yYCBpcyBkZXByZWNhdGVkLiBVc2UgYGFzc2VydC5Bc3NlcnRpb25FcnJvcmAgZnJvbSBgdGhhbGxpdW0vYXNzZXJ0YCBpbnN0ZWFkLlwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1sZW5cbiAgICAgICAgbG9ja0Vycm9yKSxcbn0pXG5cbi8qIGVzbGludC1lbmFibGUgbm8tZXh0ZW5kLW5hdGl2ZSAqL1xuXG5tZXRob2RzKFRoYWxsaXVtLCB7XG4gICAgYmFzZTogQ29tbW9uLmRlcHJlY2F0ZShcbiAgICAgICAgXCJgdC5iYXNlYCBpcyBkZXByZWNhdGVkLiBVc2UgYHQuY3JlYXRlYCBpbnN0ZWFkLlwiLFxuICAgICAgICBmdW5jdGlvbiAoKSB7IHJldHVybiBuZXcgVGhhbGxpdW0oKSB9KSxcbn0pXG5cbi8qICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKlxuICogLSBhc3NlcnRpb25zIGRlZmluZWQgb24gbWFpbiBleHBvcnQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiAtIGB0LipgIGFzc2VydGlvbnMgLT4gYGFzc2VydC4qYCAoc29tZSByZW5hbWVkKSBmcm9tIGB0aGFsbGl1bS9hc3NlcnRgICAgICpcbiAqIC0gYHQudHJ1ZWAvZXRjLiBhcmUgZ29uZSAoZXhjZXB0IGB0LnVuZGVmaW5lZGAgLT4gYGFzc2VydC5pc1VuZGVmaW5lZGApICAgKlxuICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqL1xuQ29tbW9uLmhpZGVEZXByZWNhdGlvbigpXG5yZXF1aXJlKFwiLi4vYXNzZXJ0aW9uc1wiKShyZXF1aXJlKFwiLi4vaW5kZXhcIikpXG5Db21tb24uc2hvd0RlcHJlY2F0aW9uKClcblxuLyogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqXG4gKiBgZXh0cmFgIGV2ZW50cyBhcmUgbm8gbG9uZ2VyIGEgdGhpbmcuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKi9cbm1ldGhvZHMoUmVwb3J0LCB7XG4gICAgZ2V0IGlzSW5saW5lKCkge1xuICAgICAgICBDb21tb24ud2FybihcImBleHRyYWAgZXZlbnRzIG5vIGxvbmdlciBleGlzdC4gWW91IG5vIGxvbmdlciBuZWVkIHRvIFwiICtcbiAgICAgICAgICAgIFwiaGFuZGxlIHRoZW1cIilcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfSxcbn0pXG5cbi8qICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKlxuICogLSBgdC5yZWZsZWN0YCBhbmQgYHQudXNlYCAtPiBub24tY2FjaGluZyBgdC5jYWxsYCAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICovXG52YXIgY2FsbCA9IFRoYWxsaXVtLnByb3RvdHlwZS5jYWxsXG5cbmZ1bmN0aW9uIGlkKHgpIHsgcmV0dXJuIHggfVxuXG5tZXRob2RzKFRoYWxsaXVtLCB7XG4gICAgcmVmbGVjdDogQ29tbW9uLmRlcHJlY2F0ZShcbiAgICAgICAgXCJgdC5yZWZsZWN0YCBpcyBkZXByZWNhdGVkLiBVc2UgYHQuY2FsbGAgaW5zdGVhZC5cIixcbiAgICAgICAgLyoqIEB0aGlzICovIGZ1bmN0aW9uICgpIHsgcmV0dXJuIGNhbGwuY2FsbCh0aGlzLCBpZCkgfSksXG5cbiAgICB1c2U6IENvbW1vbi5kZXByZWNhdGUoXG4gICAgICAgIFwiYHQudXNlYCBpcyBkZXByZWNhdGVkLiBVc2UgYHQuY2FsbGAgaW5zdGVhZC5cIixcbiAgICAgICAgLyoqIEB0aGlzICovIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciByZWZsZWN0ID0gY2FsbC5jYWxsKHRoaXMsIGlkKVxuXG4gICAgICAgICAgICBpZiAoIXJlZmxlY3Quc2tpcHBlZCkge1xuICAgICAgICAgICAgICAgIHZhciB0ZXN0ID0gdGhpcy5fLmN1cnJlbnQudmFsdWVcblxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwbHVnaW4gPSBhcmd1bWVudHNbaV1cblxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHBsdWdpbiAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiRXhwZWN0ZWQgYHBsdWdpbmAgdG8gYmUgYSBmdW5jdGlvblwiKVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRlc3QucGx1Z2lucyA9PSBudWxsKSB0ZXN0LnBsdWdpbnMgPSBbXVxuICAgICAgICAgICAgICAgICAgICBpZiAodGVzdC5wbHVnaW5zLmluZGV4T2YocGx1Z2luKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFkZCBwbHVnaW4gYmVmb3JlIGNhbGxpbmcgaXQuXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXN0LnBsdWdpbnMucHVzaChwbHVnaW4pXG4gICAgICAgICAgICAgICAgICAgICAgICBwbHVnaW4uY2FsbCh0aGlzLCB0aGlzKVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdGhpc1xuICAgICAgICB9KSxcbn0pXG5cbi8qICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKlxuICogLSBgcmVmbGVjdC5yZXBvcnRgIC0+IGBpbnRlcm5hbC5yZXBvcnQuKmAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiAtIGByZWZsZWN0LmxvY2AgLT4gYGludGVybmFsLmxvY2F0aW9uYCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqIC0gYHJlZmxlY3Quc2NoZWR1bGVyYCBvYnNvbGV0ZWQuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqL1xuXG52YXIgcmVwb3J0cyA9IEludGVybmFsLnJlcG9ydHNcblxubWV0aG9kcyhSZWZsZWN0LCB7XG4gICAgcmVwb3J0OiBDb21tb24uZGVwcmVjYXRlKFxuICAgICAgICBcImByZWZsZWN0LnJlcG9ydGAgaXMgZGVwcmVjYXRlZC4gVXNlIGBpbnRlcm5hbC5yZXBvcnQuKmAgZnJvbSBgdGhhbGxpdW0vaW50ZXJuYWxgIGluc3RlYWQuXCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LWxlblxuICAgICAgICBmdW5jdGlvbiAodHlwZSwgcGF0aCwgdmFsdWUsIGR1cmF0aW9uLCBzbG93KSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LXBhcmFtcywgbWF4LWxlblxuICAgICAgICAgICAgaWYgKHR5cGVvZiB0eXBlICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGB0eXBlYCB0byBiZSBhIHN0cmluZ1wiKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJzdGFydFwiOiByZXR1cm4gcmVwb3J0cy5zdGFydCgpXG4gICAgICAgICAgICBjYXNlIFwiZW50ZXJcIjogcmV0dXJuIHJlcG9ydHMuZW50ZXIocGF0aCwgZHVyYXRpb24sIHNsb3cpXG4gICAgICAgICAgICBjYXNlIFwibGVhdmVcIjogcmV0dXJuIHJlcG9ydHMubGVhdmUocGF0aClcbiAgICAgICAgICAgIGNhc2UgXCJwYXNzXCI6IHJldHVybiByZXBvcnRzLnBhc3MocGF0aCwgZHVyYXRpb24sIHNsb3cpXG4gICAgICAgICAgICBjYXNlIFwiZmFpbFwiOiByZXR1cm4gcmVwb3J0cy5mYWlsKHBhdGgsIHZhbHVlLCBkdXJhdGlvbiwgc2xvdylcbiAgICAgICAgICAgIGNhc2UgXCJza2lwXCI6IHJldHVybiByZXBvcnRzLnNraXAocGF0aClcbiAgICAgICAgICAgIGNhc2UgXCJlbmRcIjogcmV0dXJuIHJlcG9ydHMuZW5kKClcbiAgICAgICAgICAgIGNhc2UgXCJlcnJvclwiOiByZXR1cm4gcmVwb3J0cy5lcnJvcih2YWx1ZSlcbiAgICAgICAgICAgIGNhc2UgXCJob29rXCI6IHJldHVybiByZXBvcnRzLmhvb2socGF0aCwgdmFsdWUpXG4gICAgICAgICAgICBkZWZhdWx0OiB0aHJvdyBuZXcgUmFuZ2VFcnJvcihcIlVua25vd24gcmVwb3J0IGB0eXBlYDogXCIgKyB0eXBlKVxuICAgICAgICAgICAgfVxuICAgICAgICB9KSxcblxuICAgIGxvYzogQ29tbW9uLmRlcHJlY2F0ZShcbiAgICAgICAgXCJgcmVmbGVjdC5sb2NgIGlzIGRlcHJlY2F0ZWQuIFVzZSBgaW50ZXJuYWwubG9jYXRpb25gIGZyb20gYHRoYWxsaXVtL2ludGVybmFsYCBpbnN0ZWFkLlwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1sZW5cbiAgICAgICAgSW50ZXJuYWwubG9jYXRpb24pLFxuXG4gICAgc2NoZWR1bGVyOiBDb21tb24uZGVwcmVjYXRlKFxuICAgICAgICBcImByZWZsZWN0LnNjaGVkdWxlcmAgaXMgZGVwcmVjYXRlZC4gSXQgaXMgbm8gbG9uZ2VyIHVzZWZ1bCB0byB0aGUgbGlicmFyeSwgYW5kIGNhbiBiZSBzYWZlbHkgcmVtb3ZlZC5cIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtbGVuXG4gICAgICAgIGZ1bmN0aW9uICgpIHt9KSxcbn0pXG5cbi8qICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKlxuICogSW5saW5lIHRlc3RzIGFyZSBkZXByZWNhdGVkLiBUaGlzIGlzIFwiZml4ZWRcIiBieSBqdXN0IHRocm93aW5nLCBzaW5jZSBpdCdzICpcbiAqIGhhcmQgdG8gcGF0Y2ggYmFjayBpbiBhbmQgZWFzeSB0byBmaXggb24gdGhlIHVzZXIncyBlbmQuICAgICAgICAgICAgICAgICAgKlxuICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqL1xubWV0aG9kcyhUaGFsbGl1bSwge1xuICAgIHRlc3Q6IGZ1bmN0aW9uIChuYW1lLCBmdW5jKSB7XG4gICAgICAgIGlmIChmdW5jID09IG51bGwpIHtcbiAgICAgICAgICAgIC8vIENhdGNoIHRoaXMgcGFydGljdWxhciBjYXNlLCB0byB0aHJvdyB3aXRoIGEgbW9yZSBpbmZvcm1hdGl2ZVxuICAgICAgICAgICAgLy8gbWVzc3NhZ2UuXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICAgICAgICAgIFwiSW5saW5lIHRlc3RzIGFyZSBkZXByZWNhdGVkLiBVc2UgYmxvY2sgdGVzdHMgaW5zdGVhZC5cIilcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0ZXN0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgICB9LFxufSlcblxubWV0aG9kcyhSZWZsZWN0LCB7XG4gICAgZ2V0IGlzSW5saW5lKCkge1xuICAgICAgICBDb21tb24ud2FybihcIlRlc3RzIGFyZSBub3cgbmV2ZXIgaW5saW5lLiBZb3Ugbm8gbG9uZ2VyIG5lZWQgdG8gXCIgK1xuICAgICAgICAgICAgXCJoYW5kbGUgdGhpcyBjYXNlXCIpXG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgIH0sXG59KVxuXG4vKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICpcbiAqIGByZWZsZWN0Lm1ldGhvZHNgIC0+IGByZWZsZWN0LmN1cnJlbnRgIGFuZCB1c2luZyBuZXcgYHJlZmxlY3RgIG1ldGhvZHMgICAgKlxuICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqL1xubWV0aG9kcyhSZWZsZWN0LCB7XG4gICAgZ2V0IG1ldGhvZHMoKSB7XG4gICAgICAgIENvbW1vbi53YXJuKFwiYHJlZmxlY3QubWV0aG9kc2AgaXMgZGVwcmVjYXRlZC4gVXNlIGByZWZsZWN0LmN1cnJlbnRgLCBcIiArXG4gICAgICAgICAgICBcInRoZSByZXR1cm4gdmFsdWUgb2YgYHQuY2FsbGAsIGFuZCB0aGUgYXBwcm9wcmlhdGUgbmV3IGByZWZsZWN0YCBcIiArXG4gICAgICAgICAgICBcIm1ldGhvZHMgaW5zdGVhZFwiKVxuICAgICAgICByZXR1cm4gdGhpcy5fLm1ldGhvZHNcbiAgICB9LFxufSlcblxuLyogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqXG4gKiBgcmVmbGVjdC5yZXBvcnRlcnNgIC0+IGByZWZsZWN0Lmhhc1JlcG9ydGVyYCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKi9cbm1ldGhvZHMoUmVmbGVjdCwge1xuICAgIGdldCByZXBvcnRlcnMoKSB7XG4gICAgICAgIENvbW1vbi53YXJuKFwiYHJlZmxlY3QucmVwb3J0ZXJzYCBpcyBkZXByZWNhdGVkLiBVc2UgXCIgK1xuICAgICAgICAgICAgXCJgcmVmbGVjdC5oYXNSZXBvcnRlcmAgaW5zdGVhZCB0byBjaGVjayBmb3IgZXhpc3RlbmNlIG9mIGEgXCIgK1xuICAgICAgICAgICAgXCJyZXBvcnRlci5cIilcbiAgICAgICAgcmV0dXJuIHRoaXMuXy5tZXRob2RzXG4gICAgfSxcbn0pXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICh4cywgZikge1xuICAgIGlmICh4cy5tYXApIHJldHVybiB4cy5tYXAoZik7XG4gICAgdmFyIHJlcyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgeHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHggPSB4c1tpXTtcbiAgICAgICAgaWYgKGhhc093bi5jYWxsKHhzLCBpKSkgcmVzLnB1c2goZih4LCBpLCB4cykpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xufTtcblxudmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG4iLCJ2YXIgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoeHMsIGYsIGFjYykge1xuICAgIHZhciBoYXNBY2MgPSBhcmd1bWVudHMubGVuZ3RoID49IDM7XG4gICAgaWYgKGhhc0FjYyAmJiB4cy5yZWR1Y2UpIHJldHVybiB4cy5yZWR1Y2UoZiwgYWNjKTtcbiAgICBpZiAoeHMucmVkdWNlKSByZXR1cm4geHMucmVkdWNlKGYpO1xuICAgIFxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgeHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKCFoYXNPd24uY2FsbCh4cywgaSkpIGNvbnRpbnVlO1xuICAgICAgICBpZiAoIWhhc0FjYykge1xuICAgICAgICAgICAgYWNjID0geHNbaV07XG4gICAgICAgICAgICBoYXNBY2MgPSB0cnVlO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgYWNjID0gZihhY2MsIHhzW2ldLCBpKTtcbiAgICB9XG4gICAgcmV0dXJuIGFjYztcbn07XG4iLCJcInVzZSBzdHJpY3RcIlxuXG4vLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3N1YnN0YWNrL25vZGUtYnJvd3NlcmlmeS9pc3N1ZXMvMTY3NFxuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCJ1dGlsLWluc3BlY3RcIilcbiIsIlwidXNlIHN0cmljdFwiXG5cbnZhciBpbnNwZWN0ID0gZXhwb3J0cy5pbnNwZWN0ID0gcmVxdWlyZShcIi4vaW5zcGVjdFwiKVxudmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHlcbnZhciBBc3NlcnRpb25FcnJvclxuXG4vLyBQaGFudG9tSlMsIElFLCBhbmQgcG9zc2libHkgRWRnZSBkb24ndCBzZXQgdGhlIHN0YWNrIHRyYWNlIHVudGlsIHRoZSBlcnJvciBpc1xuLy8gdGhyb3duLiBOb3RlIHRoYXQgdGhpcyBwcmVmZXJzIGFuIGV4aXN0aW5nIHN0YWNrIGZpcnN0LCBzaW5jZSBub24tbmF0aXZlXG4vLyBlcnJvcnMgbGlrZWx5IGFscmVhZHkgY29udGFpbiB0aGlzLlxuZnVuY3Rpb24gZ2V0U3RhY2soZSkge1xuICAgIHZhciBzdGFjayA9IGUuc3RhY2tcblxuICAgIGlmICghKGUgaW5zdGFuY2VvZiBFcnJvcikgfHwgc3RhY2sgIT0gbnVsbCkgcmV0dXJuIHN0YWNrXG5cbiAgICB0cnkge1xuICAgICAgICB0aHJvdyBlXG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICByZXR1cm4gZS5zdGFja1xuICAgIH1cbn1cblxudHJ5IHtcbiAgICBBc3NlcnRpb25FcnJvciA9IG5ldyBGdW5jdGlvbihbIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tbmV3LWZ1bmNcbiAgICAgICAgXCIndXNlIHN0cmljdCc7XCIsXG4gICAgICAgIFwiY2xhc3MgQXNzZXJ0aW9uRXJyb3IgZXh0ZW5kcyBFcnJvciB7XCIsXG4gICAgICAgIFwiICAgIGNvbnN0cnVjdG9yKG1lc3NhZ2UsIGV4cGVjdGVkLCBhY3R1YWwpIHtcIixcbiAgICAgICAgXCIgICAgICAgIHN1cGVyKG1lc3NhZ2UpXCIsXG4gICAgICAgIFwiICAgICAgICB0aGlzLmV4cGVjdGVkID0gZXhwZWN0ZWRcIixcbiAgICAgICAgXCIgICAgICAgIHRoaXMuYWN0dWFsID0gYWN0dWFsXCIsXG4gICAgICAgIFwiICAgIH1cIixcbiAgICAgICAgXCJcIixcbiAgICAgICAgXCIgICAgZ2V0IG5hbWUoKSB7XCIsXG4gICAgICAgIFwiICAgICAgICByZXR1cm4gJ0Fzc2VydGlvbkVycm9yJ1wiLFxuICAgICAgICBcIiAgICB9XCIsXG4gICAgICAgIFwifVwiLFxuICAgICAgICAvLyBjaGVjayBuYXRpdmUgc3ViY2xhc3Npbmcgc3VwcG9ydFxuICAgICAgICBcIm5ldyBBc3NlcnRpb25FcnJvcignbWVzc2FnZScsIDEsIDIpXCIsXG4gICAgICAgIFwicmV0dXJuIEFzc2VydGlvbkVycm9yXCIsXG4gICAgXS5qb2luKFwiXFxuXCIpKSgpXG59IGNhdGNoIChlKSB7XG4gICAgQXNzZXJ0aW9uRXJyb3IgPSB0eXBlb2YgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UgPT09IFwiZnVuY3Rpb25cIlxuICAgICAgICA/IGZ1bmN0aW9uIEFzc2VydGlvbkVycm9yKG1lc3NhZ2UsIGV4cGVjdGVkLCBhY3R1YWwpIHtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZSA9IG1lc3NhZ2UgfHwgXCJcIlxuICAgICAgICAgICAgdGhpcy5leHBlY3RlZCA9IGV4cGVjdGVkXG4gICAgICAgICAgICB0aGlzLmFjdHVhbCA9IGFjdHVhbFxuICAgICAgICAgICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgdGhpcy5jb25zdHJ1Y3RvcilcbiAgICAgICAgfVxuICAgICAgICA6IGZ1bmN0aW9uIEFzc2VydGlvbkVycm9yKG1lc3NhZ2UsIGV4cGVjdGVkLCBhY3R1YWwpIHtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZSA9IG1lc3NhZ2UgfHwgXCJcIlxuICAgICAgICAgICAgdGhpcy5leHBlY3RlZCA9IGV4cGVjdGVkXG4gICAgICAgICAgICB0aGlzLmFjdHVhbCA9IGFjdHVhbFxuICAgICAgICAgICAgdmFyIGUgPSBuZXcgRXJyb3IobWVzc2FnZSlcblxuICAgICAgICAgICAgZS5uYW1lID0gXCJBc3NlcnRpb25FcnJvclwiXG4gICAgICAgICAgICB0aGlzLnN0YWNrID0gZ2V0U3RhY2soZSlcbiAgICAgICAgfVxuXG4gICAgQXNzZXJ0aW9uRXJyb3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShFcnJvci5wcm90b3R5cGUpXG5cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoQXNzZXJ0aW9uRXJyb3IucHJvdG90eXBlLCBcImNvbnN0cnVjdG9yXCIsIHtcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgIHZhbHVlOiBBc3NlcnRpb25FcnJvcixcbiAgICB9KVxuXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEFzc2VydGlvbkVycm9yLnByb3RvdHlwZSwgXCJuYW1lXCIsIHtcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgIHZhbHVlOiBcIkFzc2VydGlvbkVycm9yXCIsXG4gICAgfSlcbn1cblxuZXhwb3J0cy5Bc3NlcnRpb25FcnJvciA9IEFzc2VydGlvbkVycm9yXG5cbi8qIGVzbGludC1kaXNhYmxlIG5vLXNlbGYtY29tcGFyZSAqL1xuLy8gRm9yIGJldHRlciBOYU4gaGFuZGxpbmdcbmV4cG9ydHMuc3RyaWN0SXMgPSBmdW5jdGlvbiAoYSwgYikge1xuICAgIHJldHVybiBhID09PSBiIHx8IGEgIT09IGEgJiYgYiAhPT0gYlxufVxuXG5leHBvcnRzLmxvb3NlSXMgPSBmdW5jdGlvbiAoYSwgYikge1xuICAgIHJldHVybiBhID09IGIgfHwgYSAhPT0gYSAmJiBiICE9PSBiIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgZXFlcWVxXG59XG5cbi8qIGVzbGludC1lbmFibGUgbm8tc2VsZi1jb21wYXJlICovXG5cbnZhciB0ZW1wbGF0ZVJlZ2V4cCA9IC8oLj8pXFx7KC4rPylcXH0vZ1xuXG5leHBvcnRzLmVzY2FwZSA9IGZ1bmN0aW9uIChzdHJpbmcpIHtcbiAgICBpZiAodHlwZW9mIHN0cmluZyAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYHN0cmluZ2AgbXVzdCBiZSBhIHN0cmluZ1wiKVxuICAgIH1cblxuICAgIHJldHVybiBzdHJpbmcucmVwbGFjZSh0ZW1wbGF0ZVJlZ2V4cCwgZnVuY3Rpb24gKG0sIHByZSkge1xuICAgICAgICByZXR1cm4gcHJlICsgXCJcXFxcXCIgKyBtLnNsaWNlKDEpXG4gICAgfSlcbn1cblxuLy8gVGhpcyBmb3JtYXRzIHRoZSBhc3NlcnRpb24gZXJyb3IgbWVzc2FnZXMuXG5leHBvcnRzLmZvcm1hdCA9IGZ1bmN0aW9uIChtZXNzYWdlLCBhcmdzLCBwcmV0dGlmeSkge1xuICAgIGlmIChwcmV0dGlmeSA9PSBudWxsKSBwcmV0dGlmeSA9IGluc3BlY3RcblxuICAgIGlmICh0eXBlb2YgbWVzc2FnZSAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYG1lc3NhZ2VgIG11c3QgYmUgYSBzdHJpbmdcIilcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGFyZ3MgIT09IFwib2JqZWN0XCIgfHwgYXJncyA9PT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYGFyZ3NgIG11c3QgYmUgYW4gb2JqZWN0XCIpXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBwcmV0dGlmeSAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJgcHJldHRpZnlgIG11c3QgYmUgYSBmdW5jdGlvbiBpZiBwYXNzZWRcIilcbiAgICB9XG5cbiAgICByZXR1cm4gbWVzc2FnZS5yZXBsYWNlKHRlbXBsYXRlUmVnZXhwLCBmdW5jdGlvbiAobSwgcHJlLCBwcm9wKSB7XG4gICAgICAgIGlmIChwcmUgPT09IFwiXFxcXFwiKSB7XG4gICAgICAgICAgICByZXR1cm4gbS5zbGljZSgxKVxuICAgICAgICB9IGVsc2UgaWYgKGhhc093bi5jYWxsKGFyZ3MsIHByb3ApKSB7XG4gICAgICAgICAgICByZXR1cm4gcHJlICsgcHJldHRpZnkoYXJnc1twcm9wXSwge2RlcHRoOiA1fSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBwcmUgKyBtXG4gICAgICAgIH1cbiAgICB9KVxufVxuXG5leHBvcnRzLmZhaWwgPSBmdW5jdGlvbiAobWVzc2FnZSwgYXJncywgcHJldHRpZnkpIHtcbiAgICBpZiAoYXJncyA9PSBudWxsKSB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IobWVzc2FnZSlcbiAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IoXG4gICAgICAgIGV4cG9ydHMuZm9ybWF0KG1lc3NhZ2UsIGFyZ3MsIHByZXR0aWZ5KSxcbiAgICAgICAgYXJncy5leHBlY3RlZCxcbiAgICAgICAgYXJncy5hY3R1YWwpXG59XG5cbi8vIFRoZSBiYXNpYyBhc3NlcnQsIGxpa2UgYGFzc2VydC5va2AsIGJ1dCBnaXZlcyB5b3UgYW4gb3B0aW9uYWwgbWVzc2FnZS5cbmV4cG9ydHMuYXNzZXJ0ID0gZnVuY3Rpb24gKHRlc3QsIG1lc3NhZ2UpIHtcbiAgICBpZiAoIXRlc3QpIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihtZXNzYWdlKVxufVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxuLyoqXG4gKiBDb3JlIFRERC1zdHlsZSBhc3NlcnRpb25zLiBUaGVzZSBhcmUgZG9uZSBieSBhIGNvbXBvc2l0aW9uIG9mIERTTHMsIHNpbmNlXG4gKiB0aGVyZSBpcyAqc28qIG11Y2ggcmVwZXRpdGlvbi4gQWxzbywgdGhpcyBpcyBzcGxpdCBpbnRvIHNldmVyYWwgbmFtZXNwYWNlcyB0b1xuICoga2VlcCB0aGUgZmlsZSBzaXplIG1hbmFnZWFibGUuXG4gKi9cblxudmFyIHV0aWwgPSByZXF1aXJlKFwiY2xlYW4tYXNzZXJ0LXV0aWxcIilcbnZhciB0eXBlID0gcmVxdWlyZShcIi4vbGliL3R5cGVcIilcbnZhciBlcXVhbCA9IHJlcXVpcmUoXCIuL2xpYi9lcXVhbFwiKVxudmFyIHRocm93cyA9IHJlcXVpcmUoXCIuL2xpYi90aHJvd3NcIilcbnZhciBoYXMgPSByZXF1aXJlKFwiLi9saWIvaGFzXCIpXG52YXIgaW5jbHVkZXMgPSByZXF1aXJlKFwiLi9saWIvaW5jbHVkZXNcIilcbnZhciBoYXNLZXlzID0gcmVxdWlyZShcIi4vbGliL2hhcy1rZXlzXCIpXG5cbmV4cG9ydHMuQXNzZXJ0aW9uRXJyb3IgPSB1dGlsLkFzc2VydGlvbkVycm9yXG5leHBvcnRzLmFzc2VydCA9IHV0aWwuYXNzZXJ0XG5leHBvcnRzLmZhaWwgPSB1dGlsLmZhaWxcblxuZXhwb3J0cy5vayA9IHR5cGUub2tcbmV4cG9ydHMubm90T2sgPSB0eXBlLm5vdE9rXG5leHBvcnRzLmlzQm9vbGVhbiA9IHR5cGUuaXNCb29sZWFuXG5leHBvcnRzLm5vdEJvb2xlYW4gPSB0eXBlLm5vdEJvb2xlYW5cbmV4cG9ydHMuaXNGdW5jdGlvbiA9IHR5cGUuaXNGdW5jdGlvblxuZXhwb3J0cy5ub3RGdW5jdGlvbiA9IHR5cGUubm90RnVuY3Rpb25cbmV4cG9ydHMuaXNOdW1iZXIgPSB0eXBlLmlzTnVtYmVyXG5leHBvcnRzLm5vdE51bWJlciA9IHR5cGUubm90TnVtYmVyXG5leHBvcnRzLmlzT2JqZWN0ID0gdHlwZS5pc09iamVjdFxuZXhwb3J0cy5ub3RPYmplY3QgPSB0eXBlLm5vdE9iamVjdFxuZXhwb3J0cy5pc1N0cmluZyA9IHR5cGUuaXNTdHJpbmdcbmV4cG9ydHMubm90U3RyaW5nID0gdHlwZS5ub3RTdHJpbmdcbmV4cG9ydHMuaXNTeW1ib2wgPSB0eXBlLmlzU3ltYm9sXG5leHBvcnRzLm5vdFN5bWJvbCA9IHR5cGUubm90U3ltYm9sXG5leHBvcnRzLmV4aXN0cyA9IHR5cGUuZXhpc3RzXG5leHBvcnRzLm5vdEV4aXN0cyA9IHR5cGUubm90RXhpc3RzXG5leHBvcnRzLmlzQXJyYXkgPSB0eXBlLmlzQXJyYXlcbmV4cG9ydHMubm90QXJyYXkgPSB0eXBlLm5vdEFycmF5XG5leHBvcnRzLmlzID0gdHlwZS5pc1xuZXhwb3J0cy5ub3QgPSB0eXBlLm5vdFxuXG5leHBvcnRzLmVxdWFsID0gZXF1YWwuZXF1YWxcbmV4cG9ydHMubm90RXF1YWwgPSBlcXVhbC5ub3RFcXVhbFxuZXhwb3J0cy5lcXVhbExvb3NlID0gZXF1YWwuZXF1YWxMb29zZVxuZXhwb3J0cy5ub3RFcXVhbExvb3NlID0gZXF1YWwubm90RXF1YWxMb29zZVxuZXhwb3J0cy5kZWVwRXF1YWwgPSBlcXVhbC5kZWVwRXF1YWxcbmV4cG9ydHMubm90RGVlcEVxdWFsID0gZXF1YWwubm90RGVlcEVxdWFsXG5leHBvcnRzLm1hdGNoID0gZXF1YWwubWF0Y2hcbmV4cG9ydHMubm90TWF0Y2ggPSBlcXVhbC5ub3RNYXRjaFxuZXhwb3J0cy5hdExlYXN0ID0gZXF1YWwuYXRMZWFzdFxuZXhwb3J0cy5hdE1vc3QgPSBlcXVhbC5hdE1vc3RcbmV4cG9ydHMuYWJvdmUgPSBlcXVhbC5hYm92ZVxuZXhwb3J0cy5iZWxvdyA9IGVxdWFsLmJlbG93XG5leHBvcnRzLmJldHdlZW4gPSBlcXVhbC5iZXR3ZWVuXG5leHBvcnRzLmNsb3NlVG8gPSBlcXVhbC5jbG9zZVRvXG5leHBvcnRzLm5vdENsb3NlVG8gPSBlcXVhbC5ub3RDbG9zZVRvXG5cbmV4cG9ydHMudGhyb3dzID0gdGhyb3dzLnRocm93c1xuZXhwb3J0cy50aHJvd3NNYXRjaCA9IHRocm93cy50aHJvd3NNYXRjaFxuXG5leHBvcnRzLmhhc093biA9IGhhcy5oYXNPd25cbmV4cG9ydHMubm90SGFzT3duID0gaGFzLm5vdEhhc093blxuZXhwb3J0cy5oYXNPd25Mb29zZSA9IGhhcy5oYXNPd25Mb29zZVxuZXhwb3J0cy5ub3RIYXNPd25Mb29zZSA9IGhhcy5ub3RIYXNPd25Mb29zZVxuZXhwb3J0cy5oYXNLZXkgPSBoYXMuaGFzS2V5XG5leHBvcnRzLm5vdEhhc0tleSA9IGhhcy5ub3RIYXNLZXlcbmV4cG9ydHMuaGFzS2V5TG9vc2UgPSBoYXMuaGFzS2V5TG9vc2VcbmV4cG9ydHMubm90SGFzS2V5TG9vc2UgPSBoYXMubm90SGFzS2V5TG9vc2VcbmV4cG9ydHMuaGFzID0gaGFzLmhhc1xuZXhwb3J0cy5ub3RIYXMgPSBoYXMubm90SGFzXG5leHBvcnRzLmhhc0xvb3NlID0gaGFzLmhhc0xvb3NlXG5leHBvcnRzLm5vdEhhc0xvb3NlID0gaGFzLm5vdEhhc0xvb3NlXG5cbi8qKlxuICogVGhlcmUncyAyIHNldHMgb2YgMTIgcGVybXV0YXRpb25zIGhlcmUgZm9yIGBpbmNsdWRlc2AgYW5kIGBoYXNLZXlzYCwgaW5zdGVhZFxuICogb2YgTiBzZXRzIG9mIDIgKHdoaWNoIHdvdWxkIGZpdCB0aGUgYGZvb2AvYG5vdEZvb2AgaWRpb20gYmV0dGVyKSwgc28gaXQnc1xuICogZWFzaWVyIHRvIGp1c3QgbWFrZSBhIGNvdXBsZSBzZXBhcmF0ZSBEU0xzIGFuZCB1c2UgdGhhdCB0byBkZWZpbmUgZXZlcnl0aGluZy5cbiAqXG4gKiBIZXJlJ3MgdGhlIHRvcCBsZXZlbDpcbiAqXG4gKiAtIHNoYWxsb3dcbiAqIC0gc3RyaWN0IGRlZXBcbiAqIC0gc3RydWN0dXJhbCBkZWVwXG4gKlxuICogQW5kIHRoZSBzZWNvbmQgbGV2ZWw6XG4gKlxuICogLSBpbmNsdWRlcyBhbGwvbm90IG1pc3Npbmcgc29tZVxuICogLSBpbmNsdWRlcyBzb21lL25vdCBtaXNzaW5nIGFsbFxuICogLSBub3QgaW5jbHVkaW5nIGFsbC9taXNzaW5nIHNvbWVcbiAqIC0gbm90IGluY2x1ZGluZyBzb21lL21pc3NpbmcgYWxsXG4gKlxuICogSGVyZSdzIGFuIGV4YW1wbGUgdXNpbmcgdGhlIG5hbWluZyBzY2hlbWUgZm9yIGBoYXNLZXlzKmBcbiAqXG4gKiAgICAgICAgICAgICAgIHwgICAgIHNoYWxsb3cgICAgIHwgICAgc3RyaWN0IGRlZXAgICAgICB8ICAgc3RydWN0dXJhbCBkZWVwXG4gKiAtLS0tLS0tLS0tLS0tLXwtLS0tLS0tLS0tLS0tLS0tLXwtLS0tLS0tLS0tLS0tLS0tLS0tLS18LS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICogaW5jbHVkZXMgYWxsICB8IGBoYXNLZXlzYCAgICAgICB8IGBoYXNLZXlzRGVlcGAgICAgICAgfCBgaGFzS2V5c01hdGNoYFxuICogaW5jbHVkZXMgc29tZSB8IGBoYXNLZXlzQW55YCAgICB8IGBoYXNLZXlzQW55RGVlcGAgICAgfCBgaGFzS2V5c0FueU1hdGNoYFxuICogbWlzc2luZyBzb21lICB8IGBub3RIYXNLZXlzQWxsYCB8IGBub3RIYXNLZXlzQWxsRGVlcGAgfCBgbm90SGFzS2V5c0FsbE1hdGNoYFxuICogbWlzc2luZyBhbGwgICB8IGBub3RIYXNLZXlzYCAgICB8IGBub3RIYXNLZXlzRGVlcGAgICAgfCBgbm90SGFzS2V5c01hdGNoYFxuICpcbiAqIE5vdGUgdGhhdCB0aGUgYGhhc0tleXNgIHNoYWxsb3cgY29tcGFyaXNvbiB2YXJpYW50cyBhcmUgYWxzbyBvdmVybG9hZGVkIHRvXG4gKiBjb25zdW1lIGVpdGhlciBhbiBhcnJheSAoaW4gd2hpY2ggaXQgc2ltcGx5IGNoZWNrcyBhZ2FpbnN0IGEgbGlzdCBvZiBrZXlzKSBvclxuICogYW4gb2JqZWN0ICh3aGVyZSBpdCBkb2VzIGEgZnVsbCBkZWVwIGNvbXBhcmlzb24pLlxuICovXG5cbmV4cG9ydHMuaW5jbHVkZXMgPSBpbmNsdWRlcy5pbmNsdWRlc1xuZXhwb3J0cy5pbmNsdWRlc0RlZXAgPSBpbmNsdWRlcy5pbmNsdWRlc0RlZXBcbmV4cG9ydHMuaW5jbHVkZXNNYXRjaCA9IGluY2x1ZGVzLmluY2x1ZGVzTWF0Y2hcbmV4cG9ydHMuaW5jbHVkZXNBbnkgPSBpbmNsdWRlcy5pbmNsdWRlc0FueVxuZXhwb3J0cy5pbmNsdWRlc0FueURlZXAgPSBpbmNsdWRlcy5pbmNsdWRlc0FueURlZXBcbmV4cG9ydHMuaW5jbHVkZXNBbnlNYXRjaCA9IGluY2x1ZGVzLmluY2x1ZGVzQW55TWF0Y2hcbmV4cG9ydHMubm90SW5jbHVkZXNBbGwgPSBpbmNsdWRlcy5ub3RJbmNsdWRlc0FsbFxuZXhwb3J0cy5ub3RJbmNsdWRlc0FsbERlZXAgPSBpbmNsdWRlcy5ub3RJbmNsdWRlc0FsbERlZXBcbmV4cG9ydHMubm90SW5jbHVkZXNBbGxNYXRjaCA9IGluY2x1ZGVzLm5vdEluY2x1ZGVzQWxsTWF0Y2hcbmV4cG9ydHMubm90SW5jbHVkZXMgPSBpbmNsdWRlcy5ub3RJbmNsdWRlc1xuZXhwb3J0cy5ub3RJbmNsdWRlc0RlZXAgPSBpbmNsdWRlcy5ub3RJbmNsdWRlc0RlZXBcbmV4cG9ydHMubm90SW5jbHVkZXNNYXRjaCA9IGluY2x1ZGVzLm5vdEluY2x1ZGVzTWF0Y2hcblxuZXhwb3J0cy5oYXNLZXlzID0gaGFzS2V5cy5oYXNLZXlzXG5leHBvcnRzLmhhc0tleXNEZWVwID0gaGFzS2V5cy5oYXNLZXlzRGVlcFxuZXhwb3J0cy5oYXNLZXlzTWF0Y2ggPSBoYXNLZXlzLmhhc0tleXNNYXRjaFxuZXhwb3J0cy5oYXNLZXlzQW55ID0gaGFzS2V5cy5oYXNLZXlzQW55XG5leHBvcnRzLmhhc0tleXNBbnlEZWVwID0gaGFzS2V5cy5oYXNLZXlzQW55RGVlcFxuZXhwb3J0cy5oYXNLZXlzQW55TWF0Y2ggPSBoYXNLZXlzLmhhc0tleXNBbnlNYXRjaFxuZXhwb3J0cy5ub3RIYXNLZXlzQWxsID0gaGFzS2V5cy5ub3RIYXNLZXlzQWxsXG5leHBvcnRzLm5vdEhhc0tleXNBbGxEZWVwID0gaGFzS2V5cy5ub3RIYXNLZXlzQWxsRGVlcFxuZXhwb3J0cy5ub3RIYXNLZXlzQWxsTWF0Y2ggPSBoYXNLZXlzLm5vdEhhc0tleXNBbGxNYXRjaFxuZXhwb3J0cy5ub3RIYXNLZXlzID0gaGFzS2V5cy5ub3RIYXNLZXlzXG5leHBvcnRzLm5vdEhhc0tleXNEZWVwID0gaGFzS2V5cy5ub3RIYXNLZXlzRGVlcFxuZXhwb3J0cy5ub3RIYXNLZXlzTWF0Y2ggPSBoYXNLZXlzLm5vdEhhc0tleXNNYXRjaFxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxudmFyIG1hdGNoID0gcmVxdWlyZShcImNsZWFuLW1hdGNoXCIpXG52YXIgdXRpbCA9IHJlcXVpcmUoXCJjbGVhbi1hc3NlcnQtdXRpbFwiKVxuXG5mdW5jdGlvbiBiaW5hcnkobnVtZXJpYywgY29tcGFyYXRvciwgbWVzc2FnZSkge1xuICAgIHJldHVybiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgICBpZiAobnVtZXJpYykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBhY3R1YWwgIT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYGFjdHVhbGAgbXVzdCBiZSBhIG51bWJlclwiKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodHlwZW9mIGV4cGVjdGVkICE9PSBcIm51bWJlclwiKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBleHBlY3RlZGAgbXVzdCBiZSBhIG51bWJlclwiKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFjb21wYXJhdG9yKGFjdHVhbCwgZXhwZWN0ZWQpKSB7XG4gICAgICAgICAgICB1dGlsLmZhaWwobWVzc2FnZSwge2FjdHVhbDogYWN0dWFsLCBleHBlY3RlZDogZXhwZWN0ZWR9KVxuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnRzLmVxdWFsID0gYmluYXJ5KGZhbHNlLFxuICAgIGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiB1dGlsLnN0cmljdElzKGEsIGIpIH0sXG4gICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBlcXVhbCB7ZXhwZWN0ZWR9XCIpXG5cbmV4cG9ydHMubm90RXF1YWwgPSBiaW5hcnkoZmFsc2UsXG4gICAgZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuICF1dGlsLnN0cmljdElzKGEsIGIpIH0sXG4gICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgZXF1YWwge2V4cGVjdGVkfVwiKVxuXG5leHBvcnRzLmVxdWFsTG9vc2UgPSBiaW5hcnkoZmFsc2UsXG4gICAgZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIHV0aWwubG9vc2VJcyhhLCBiKSB9LFxuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbG9vc2VseSBlcXVhbCB7ZXhwZWN0ZWR9XCIpXG5cbmV4cG9ydHMubm90RXF1YWxMb29zZSA9IGJpbmFyeShmYWxzZSxcbiAgICBmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gIXV0aWwubG9vc2VJcyhhLCBiKSB9LFxuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGxvb3NlbHkgZXF1YWwge2V4cGVjdGVkfVwiKVxuXG5leHBvcnRzLmF0TGVhc3QgPSBiaW5hcnkodHJ1ZSxcbiAgICBmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYSA+PSBiIH0sXG4gICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBiZSBhdCBsZWFzdCB7ZXhwZWN0ZWR9XCIpXG5cbmV4cG9ydHMuYXRNb3N0ID0gYmluYXJ5KHRydWUsXG4gICAgZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGEgPD0gYiB9LFxuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gYmUgYXQgbW9zdCB7ZXhwZWN0ZWR9XCIpXG5cbmV4cG9ydHMuYWJvdmUgPSBiaW5hcnkodHJ1ZSxcbiAgICBmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYSA+IGIgfSxcbiAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGJlIGFib3ZlIHtleHBlY3RlZH1cIilcblxuZXhwb3J0cy5iZWxvdyA9IGJpbmFyeSh0cnVlLFxuICAgIGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBhIDwgYiB9LFxuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gYmUgYmVsb3cge2V4cGVjdGVkfVwiKVxuXG5leHBvcnRzLmJldHdlZW4gPSBmdW5jdGlvbiAoYWN0dWFsLCBsb3dlciwgdXBwZXIpIHtcbiAgICBpZiAodHlwZW9mIGFjdHVhbCAhPT0gXCJudW1iZXJcIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYGFjdHVhbGAgbXVzdCBiZSBhIG51bWJlclwiKVxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgbG93ZXIgIT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBsb3dlcmAgbXVzdCBiZSBhIG51bWJlclwiKVxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgdXBwZXIgIT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImB1cHBlcmAgbXVzdCBiZSBhIG51bWJlclwiKVxuICAgIH1cblxuICAgIC8vIFRoZSBuZWdhdGlvbiBpcyB0byBhZGRyZXNzIE5hTnMgYXMgd2VsbCwgd2l0aG91dCB3cml0aW5nIGEgdG9uIG9mIHNwZWNpYWxcbiAgICAvLyBjYXNlIGJvaWxlcnBsYXRlXG4gICAgaWYgKCEoYWN0dWFsID49IGxvd2VyICYmIGFjdHVhbCA8PSB1cHBlcikpIHtcbiAgICAgICAgdXRpbC5mYWlsKFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gYmUgYmV0d2VlbiB7bG93ZXJ9IGFuZCB7dXBwZXJ9XCIsIHtcbiAgICAgICAgICAgIGFjdHVhbDogYWN0dWFsLFxuICAgICAgICAgICAgbG93ZXI6IGxvd2VyLFxuICAgICAgICAgICAgdXBwZXI6IHVwcGVyLFxuICAgICAgICB9KVxuICAgIH1cbn1cblxuZXhwb3J0cy5kZWVwRXF1YWwgPSBiaW5hcnkoZmFsc2UsXG4gICAgZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIG1hdGNoLnN0cmljdChhLCBiKSB9LFxuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gZGVlcGx5IGVxdWFsIHtleHBlY3RlZH1cIilcblxuZXhwb3J0cy5ub3REZWVwRXF1YWwgPSBiaW5hcnkoZmFsc2UsXG4gICAgZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuICFtYXRjaC5zdHJpY3QoYSwgYikgfSxcbiAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBkZWVwbHkgZXF1YWwge2V4cGVjdGVkfVwiKVxuXG5leHBvcnRzLm1hdGNoID0gYmluYXJ5KGZhbHNlLFxuICAgIGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBtYXRjaC5sb29zZShhLCBiKSB9LFxuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbWF0Y2gge2V4cGVjdGVkfVwiKVxuXG5leHBvcnRzLm5vdE1hdGNoID0gYmluYXJ5KGZhbHNlLFxuICAgIGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiAhbWF0Y2gubG9vc2UoYSwgYikgfSxcbiAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBtYXRjaCB7ZXhwZWN0ZWR9XCIpXG5cbi8vIFVzZXMgZGl2aXNpb24gdG8gYWxsb3cgZm9yIGEgbW9yZSByb2J1c3QgY29tcGFyaXNvbiBvZiBmbG9hdHMuIEFsc28sIHRoaXNcbi8vIGhhbmRsZXMgbmVhci16ZXJvIGNvbXBhcmlzb25zIGNvcnJlY3RseSwgYXMgd2VsbCBhcyBhIHplcm8gdG9sZXJhbmNlIChpLmUuXG4vLyBleGFjdCBjb21wYXJpc29uKS5cbmZ1bmN0aW9uIGNsb3NlVG8oZXhwZWN0ZWQsIGFjdHVhbCwgdG9sZXJhbmNlKSB7XG4gICAgaWYgKHRvbGVyYW5jZSA9PT0gSW5maW5pdHkgfHwgYWN0dWFsID09PSBleHBlY3RlZCkgcmV0dXJuIHRydWVcbiAgICBpZiAodG9sZXJhbmNlID09PSAwKSByZXR1cm4gZmFsc2VcbiAgICBpZiAoYWN0dWFsID09PSAwKSByZXR1cm4gTWF0aC5hYnMoZXhwZWN0ZWQpIDwgdG9sZXJhbmNlXG4gICAgaWYgKGV4cGVjdGVkID09PSAwKSByZXR1cm4gTWF0aC5hYnMoYWN0dWFsKSA8IHRvbGVyYW5jZVxuICAgIHJldHVybiBNYXRoLmFicyhleHBlY3RlZCAvIGFjdHVhbCAtIDEpIDwgdG9sZXJhbmNlXG59XG5cbi8vIE5vdGU6IHRoZXNlIHR3byBhbHdheXMgZmFpbCB3aGVuIGRlYWxpbmcgd2l0aCBOYU5zLlxuZXhwb3J0cy5jbG9zZVRvID0gZnVuY3Rpb24gKGV4cGVjdGVkLCBhY3R1YWwsIHRvbGVyYW5jZSkge1xuICAgIGlmICh0eXBlb2YgYWN0dWFsICE9PSBcIm51bWJlclwiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJgYWN0dWFsYCBtdXN0IGJlIGEgbnVtYmVyXCIpXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBleHBlY3RlZCAhPT0gXCJudW1iZXJcIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYGV4cGVjdGVkYCBtdXN0IGJlIGEgbnVtYmVyXCIpXG4gICAgfVxuXG4gICAgaWYgKHRvbGVyYW5jZSA9PSBudWxsKSB0b2xlcmFuY2UgPSAxZS0xMFxuXG4gICAgaWYgKHR5cGVvZiB0b2xlcmFuY2UgIT09IFwibnVtYmVyXCIgfHwgdG9sZXJhbmNlIDwgMCkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICAgICAgXCJgdG9sZXJhbmNlYCBtdXN0IGJlIGEgbm9uLW5lZ2F0aXZlIG51bWJlciBpZiBnaXZlblwiKVxuICAgIH1cblxuICAgIGlmIChhY3R1YWwgIT09IGFjdHVhbCB8fCBleHBlY3RlZCAhPT0gZXhwZWN0ZWQgfHwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1zZWxmLWNvbXBhcmUsIG1heC1sZW5cbiAgICAgICAgICAgICFjbG9zZVRvKGV4cGVjdGVkLCBhY3R1YWwsIHRvbGVyYW5jZSkpIHtcbiAgICAgICAgdXRpbC5mYWlsKFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gYmUgY2xvc2UgdG8ge2V4cGVjdGVkfVwiLCB7XG4gICAgICAgICAgICBhY3R1YWw6IGFjdHVhbCxcbiAgICAgICAgICAgIGV4cGVjdGVkOiBleHBlY3RlZCxcbiAgICAgICAgfSlcbiAgICB9XG59XG5cbmV4cG9ydHMubm90Q2xvc2VUbyA9IGZ1bmN0aW9uIChleHBlY3RlZCwgYWN0dWFsLCB0b2xlcmFuY2UpIHtcbiAgICBpZiAodHlwZW9mIGFjdHVhbCAhPT0gXCJudW1iZXJcIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYGFjdHVhbGAgbXVzdCBiZSBhIG51bWJlclwiKVxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgZXhwZWN0ZWQgIT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBleHBlY3RlZGAgbXVzdCBiZSBhIG51bWJlclwiKVxuICAgIH1cblxuICAgIGlmICh0b2xlcmFuY2UgPT0gbnVsbCkgdG9sZXJhbmNlID0gMWUtMTBcblxuICAgIGlmICh0eXBlb2YgdG9sZXJhbmNlICE9PSBcIm51bWJlclwiIHx8IHRvbGVyYW5jZSA8IDApIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICAgICAgIFwiYHRvbGVyYW5jZWAgbXVzdCBiZSBhIG5vbi1uZWdhdGl2ZSBudW1iZXIgaWYgZ2l2ZW5cIilcbiAgICB9XG5cbiAgICBpZiAoZXhwZWN0ZWQgIT09IGV4cGVjdGVkIHx8IGFjdHVhbCAhPT0gYWN0dWFsIHx8IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tc2VsZi1jb21wYXJlLCBtYXgtbGVuXG4gICAgICAgICAgICBjbG9zZVRvKGV4cGVjdGVkLCBhY3R1YWwsIHRvbGVyYW5jZSkpIHtcbiAgICAgICAgdXRpbC5mYWlsKFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGJlIGNsb3NlIHRvIHtleHBlY3RlZH1cIiwge1xuICAgICAgICAgICAgYWN0dWFsOiBhY3R1YWwsXG4gICAgICAgICAgICBleHBlY3RlZDogZXhwZWN0ZWQsXG4gICAgICAgIH0pXG4gICAgfVxufVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxudmFyIG1hdGNoID0gcmVxdWlyZShcImNsZWFuLW1hdGNoXCIpXG52YXIgdXRpbCA9IHJlcXVpcmUoXCJjbGVhbi1hc3NlcnQtdXRpbFwiKVxudmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHlcblxuZnVuY3Rpb24gaGFzS2V5cyhhbGwsIG9iamVjdCwga2V5cykge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgdGVzdCA9IGhhc093bi5jYWxsKG9iamVjdCwga2V5c1tpXSlcblxuICAgICAgICBpZiAodGVzdCAhPT0gYWxsKSByZXR1cm4gIWFsbFxuICAgIH1cblxuICAgIHJldHVybiBhbGxcbn1cblxuZnVuY3Rpb24gaGFzVmFsdWVzKGZ1bmMsIGFsbCwgb2JqZWN0LCBrZXlzKSB7XG4gICAgaWYgKG9iamVjdCA9PT0ga2V5cykgcmV0dXJuIHRydWVcbiAgICB2YXIgbGlzdCA9IE9iamVjdC5rZXlzKGtleXMpXG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGtleSA9IGxpc3RbaV1cbiAgICAgICAgdmFyIHRlc3QgPSBoYXNPd24uY2FsbChvYmplY3QsIGtleSkgJiYgZnVuYyhrZXlzW2tleV0sIG9iamVjdFtrZXldKVxuXG4gICAgICAgIGlmICh0ZXN0ICE9PSBhbGwpIHJldHVybiB0ZXN0XG4gICAgfVxuXG4gICAgcmV0dXJuIGFsbFxufVxuXG5mdW5jdGlvbiBtYWtlSGFzT3ZlcmxvYWQoYWxsLCBpbnZlcnQsIG1lc3NhZ2UpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKG9iamVjdCwga2V5cykge1xuICAgICAgICBpZiAodHlwZW9mIG9iamVjdCAhPT0gXCJvYmplY3RcIiB8fCBvYmplY3QgPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBvYmplY3RgIG11c3QgYmUgYW4gb2JqZWN0XCIpXG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIGtleXMgIT09IFwib2JqZWN0XCIgfHwga2V5cyA9PSBudWxsKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYGtleXNgIG11c3QgYmUgYW4gb2JqZWN0IG9yIGFycmF5XCIpXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShrZXlzKSkge1xuICAgICAgICAgICAgaWYgKGtleXMubGVuZ3RoICYmIGhhc0tleXMoYWxsLCBvYmplY3QsIGtleXMpID09PSBpbnZlcnQpIHtcbiAgICAgICAgICAgICAgICB1dGlsLmZhaWwobWVzc2FnZSwge2FjdHVhbDogb2JqZWN0LCBrZXlzOiBrZXlzfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChPYmplY3Qua2V5cyhrZXlzKS5sZW5ndGgpIHtcbiAgICAgICAgICAgIGlmIChoYXNWYWx1ZXModXRpbC5zdHJpY3RJcywgYWxsLCBvYmplY3QsIGtleXMpID09PSBpbnZlcnQpIHtcbiAgICAgICAgICAgICAgICB1dGlsLmZhaWwobWVzc2FnZSwge2FjdHVhbDogb2JqZWN0LCBrZXlzOiBrZXlzfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gbWFrZUhhc0tleXMoZnVuYywgYWxsLCBpbnZlcnQsIG1lc3NhZ2UpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKG9iamVjdCwga2V5cykge1xuICAgICAgICBpZiAodHlwZW9mIG9iamVjdCAhPT0gXCJvYmplY3RcIiB8fCBvYmplY3QgPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBvYmplY3RgIG11c3QgYmUgYW4gb2JqZWN0XCIpXG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIGtleXMgIT09IFwib2JqZWN0XCIgfHwga2V5cyA9PSBudWxsKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYGtleXNgIG11c3QgYmUgYW4gb2JqZWN0XCIpXG4gICAgICAgIH1cblxuICAgICAgICAvLyBleGNsdXNpdmUgb3IgdG8gaW52ZXJ0IHRoZSByZXN1bHQgaWYgYGludmVydGAgaXMgdHJ1ZVxuICAgICAgICBpZiAoT2JqZWN0LmtleXMoa2V5cykubGVuZ3RoKSB7XG4gICAgICAgICAgICBpZiAoaGFzVmFsdWVzKGZ1bmMsIGFsbCwgb2JqZWN0LCBrZXlzKSA9PT0gaW52ZXJ0KSB7XG4gICAgICAgICAgICAgICAgdXRpbC5mYWlsKG1lc3NhZ2UsIHthY3R1YWw6IG9iamVjdCwga2V5czoga2V5c30pXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8qIGVzbGludC1kaXNhYmxlIG1heC1sZW4gKi9cblxuZXhwb3J0cy5oYXNLZXlzID0gbWFrZUhhc092ZXJsb2FkKHRydWUsIGZhbHNlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGhhdmUgYWxsIGtleXMgaW4ge2tleXN9XCIpXG5leHBvcnRzLmhhc0tleXNEZWVwID0gbWFrZUhhc0tleXMobWF0Y2guc3RyaWN0LCB0cnVlLCBmYWxzZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBoYXZlIGFsbCBrZXlzIGluIHtrZXlzfVwiKVxuZXhwb3J0cy5oYXNLZXlzTWF0Y2ggPSBtYWtlSGFzS2V5cyhtYXRjaC5sb29zZSwgdHJ1ZSwgZmFsc2UsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbWF0Y2ggYWxsIGtleXMgaW4ge2tleXN9XCIpXG5leHBvcnRzLmhhc0tleXNBbnkgPSBtYWtlSGFzT3ZlcmxvYWQoZmFsc2UsIGZhbHNlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGhhdmUgYW55IGtleSBpbiB7a2V5c31cIilcbmV4cG9ydHMuaGFzS2V5c0FueURlZXAgPSBtYWtlSGFzS2V5cyhtYXRjaC5zdHJpY3QsIGZhbHNlLCBmYWxzZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBoYXZlIGFueSBrZXkgaW4ge2tleXN9XCIpXG5leHBvcnRzLmhhc0tleXNBbnlNYXRjaCA9IG1ha2VIYXNLZXlzKG1hdGNoLmxvb3NlLCBmYWxzZSwgZmFsc2UsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbWF0Y2ggYW55IGtleSBpbiB7a2V5c31cIilcbmV4cG9ydHMubm90SGFzS2V5c0FsbCA9IG1ha2VIYXNPdmVybG9hZCh0cnVlLCB0cnVlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBoYXZlIGFsbCBrZXlzIGluIHtrZXlzfVwiKVxuZXhwb3J0cy5ub3RIYXNLZXlzQWxsRGVlcCA9IG1ha2VIYXNLZXlzKG1hdGNoLnN0cmljdCwgdHJ1ZSwgdHJ1ZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgaGF2ZSBhbGwga2V5cyBpbiB7a2V5c31cIilcbmV4cG9ydHMubm90SGFzS2V5c0FsbE1hdGNoID0gbWFrZUhhc0tleXMobWF0Y2gubG9vc2UsIHRydWUsIHRydWUsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IG1hdGNoIGFsbCBrZXlzIGluIHtrZXlzfVwiKVxuZXhwb3J0cy5ub3RIYXNLZXlzID0gbWFrZUhhc092ZXJsb2FkKGZhbHNlLCB0cnVlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBoYXZlIGFueSBrZXkgaW4ge2tleXN9XCIpXG5leHBvcnRzLm5vdEhhc0tleXNEZWVwID0gbWFrZUhhc0tleXMobWF0Y2guc3RyaWN0LCBmYWxzZSwgdHJ1ZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgaGF2ZSBhbnkga2V5IGluIHtrZXlzfVwiKVxuZXhwb3J0cy5ub3RIYXNLZXlzTWF0Y2ggPSBtYWtlSGFzS2V5cyhtYXRjaC5sb29zZSwgZmFsc2UsIHRydWUsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IG1hdGNoIGFueSBrZXkgaW4ge2tleXN9XCIpXG4iLCJcInVzZSBzdHJpY3RcIlxuXG52YXIgdXRpbCA9IHJlcXVpcmUoXCJjbGVhbi1hc3NlcnQtdXRpbFwiKVxudmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHlcblxuZnVuY3Rpb24gaGFzKF8pIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtbGVuLCBtYXgtcGFyYW1zXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChvYmplY3QsIGtleSwgdmFsdWUpIHtcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gMykge1xuICAgICAgICAgICAgaWYgKCFfLmhhcyhvYmplY3QsIGtleSkgfHxcbiAgICAgICAgICAgICAgICAgICAgIXV0aWwuc3RyaWN0SXMoXy5nZXQob2JqZWN0LCBrZXkpLCB2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICB1dGlsLmZhaWwoXy5tZXNzYWdlc1swXSwge1xuICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogdmFsdWUsXG4gICAgICAgICAgICAgICAgICAgIGFjdHVhbDogb2JqZWN0W2tleV0sXG4gICAgICAgICAgICAgICAgICAgIGtleToga2V5LFxuICAgICAgICAgICAgICAgICAgICBvYmplY3Q6IG9iamVjdCxcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKCFfLmhhcyhvYmplY3QsIGtleSkpIHtcbiAgICAgICAgICAgIHV0aWwuZmFpbChfLm1lc3NhZ2VzWzFdLCB7XG4gICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IHZhbHVlLFxuICAgICAgICAgICAgICAgIGFjdHVhbDogb2JqZWN0W2tleV0sXG4gICAgICAgICAgICAgICAga2V5OiBrZXksXG4gICAgICAgICAgICAgICAgb2JqZWN0OiBvYmplY3QsXG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBoYXNMb29zZShfKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChvYmplY3QsIGtleSwgdmFsdWUpIHtcbiAgICAgICAgaWYgKCFfLmhhcyhvYmplY3QsIGtleSkgfHwgIXV0aWwubG9vc2VJcyhfLmdldChvYmplY3QsIGtleSksIHZhbHVlKSkge1xuICAgICAgICAgICAgdXRpbC5mYWlsKF8ubWVzc2FnZXNbMF0sIHtcbiAgICAgICAgICAgICAgICBleHBlY3RlZDogdmFsdWUsXG4gICAgICAgICAgICAgICAgYWN0dWFsOiBvYmplY3Rba2V5XSxcbiAgICAgICAgICAgICAgICBrZXk6IGtleSxcbiAgICAgICAgICAgICAgICBvYmplY3Q6IG9iamVjdCxcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIG5vdEhhcyhfKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LWxlbiwgbWF4LXBhcmFtc1xuICAgIHJldHVybiBmdW5jdGlvbiAob2JqZWN0LCBrZXksIHZhbHVlKSB7XG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDMpIHtcbiAgICAgICAgICAgIGlmIChfLmhhcyhvYmplY3QsIGtleSkgJiZcbiAgICAgICAgICAgICAgICAgICAgdXRpbC5zdHJpY3RJcyhfLmdldChvYmplY3QsIGtleSksIHZhbHVlKSkge1xuICAgICAgICAgICAgICAgIHV0aWwuZmFpbChfLm1lc3NhZ2VzWzJdLCB7XG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiB2YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgYWN0dWFsOiBvYmplY3Rba2V5XSxcbiAgICAgICAgICAgICAgICAgICAga2V5OiBrZXksXG4gICAgICAgICAgICAgICAgICAgIG9iamVjdDogb2JqZWN0LFxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoXy5oYXMob2JqZWN0LCBrZXkpKSB7XG4gICAgICAgICAgICB1dGlsLmZhaWwoXy5tZXNzYWdlc1szXSwge1xuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiB2YWx1ZSxcbiAgICAgICAgICAgICAgICBhY3R1YWw6IG9iamVjdFtrZXldLFxuICAgICAgICAgICAgICAgIGtleToga2V5LFxuICAgICAgICAgICAgICAgIG9iamVjdDogb2JqZWN0LFxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gbm90SGFzTG9vc2UoXykgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1sZW4sIG1heC1wYXJhbXNcbiAgICByZXR1cm4gZnVuY3Rpb24gKG9iamVjdCwga2V5LCB2YWx1ZSkge1xuICAgICAgICBpZiAoXy5oYXMob2JqZWN0LCBrZXkpICYmIHV0aWwubG9vc2VJcyhfLmdldChvYmplY3QsIGtleSksIHZhbHVlKSkge1xuICAgICAgICAgICAgdXRpbC5mYWlsKF8ubWVzc2FnZXNbMl0sIHtcbiAgICAgICAgICAgICAgICBleHBlY3RlZDogdmFsdWUsXG4gICAgICAgICAgICAgICAgYWN0dWFsOiBvYmplY3Rba2V5XSxcbiAgICAgICAgICAgICAgICBrZXk6IGtleSxcbiAgICAgICAgICAgICAgICBvYmplY3Q6IG9iamVjdCxcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGhhc093bktleShvYmplY3QsIGtleSkgeyByZXR1cm4gaGFzT3duLmNhbGwob2JqZWN0LCBrZXkpIH1cbmZ1bmN0aW9uIGhhc0luS2V5KG9iamVjdCwga2V5KSB7IHJldHVybiBrZXkgaW4gb2JqZWN0IH1cbmZ1bmN0aW9uIGhhc0luQ29sbChvYmplY3QsIGtleSkgeyByZXR1cm4gb2JqZWN0LmhhcyhrZXkpIH1cbmZ1bmN0aW9uIGhhc09iamVjdEdldChvYmplY3QsIGtleSkgeyByZXR1cm4gb2JqZWN0W2tleV0gfVxuZnVuY3Rpb24gaGFzQ29sbEdldChvYmplY3QsIGtleSkgeyByZXR1cm4gb2JqZWN0LmdldChrZXkpIH1cblxuZnVuY3Rpb24gY3JlYXRlSGFzKGhhcywgZ2V0LCBtZXNzYWdlcykge1xuICAgIHJldHVybiB7aGFzOiBoYXMsIGdldDogZ2V0LCBtZXNzYWdlczogbWVzc2FnZXN9XG59XG5cbnZhciBoYXNPd25NZXRob2RzID0gY3JlYXRlSGFzKGhhc093bktleSwgaGFzT2JqZWN0R2V0LCBbXG4gICAgXCJFeHBlY3RlZCB7b2JqZWN0fSB0byBoYXZlIG93biBrZXkge2tleX0gZXF1YWwgdG8ge2V4cGVjdGVkfSwgYnV0IGZvdW5kIHthY3R1YWx9XCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LWxlblxuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gaGF2ZSBvd24ga2V5IHtleHBlY3RlZH1cIixcbiAgICBcIkV4cGVjdGVkIHtvYmplY3R9IHRvIG5vdCBoYXZlIG93biBrZXkge2tleX0gZXF1YWwgdG8ge2FjdHVhbH1cIixcbiAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBoYXZlIG93biBrZXkge2V4cGVjdGVkfVwiLFxuXSlcblxudmFyIGhhc0tleU1ldGhvZHMgPSBjcmVhdGVIYXMoaGFzSW5LZXksIGhhc09iamVjdEdldCwgW1xuICAgIFwiRXhwZWN0ZWQge29iamVjdH0gdG8gaGF2ZSBrZXkge2tleX0gZXF1YWwgdG8ge2V4cGVjdGVkfSwgYnV0IGZvdW5kIHthY3R1YWx9XCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LWxlblxuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gaGF2ZSBrZXkge2V4cGVjdGVkfVwiLFxuICAgIFwiRXhwZWN0ZWQge29iamVjdH0gdG8gbm90IGhhdmUga2V5IHtrZXl9IGVxdWFsIHRvIHthY3R1YWx9XCIsXG4gICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgaGF2ZSBrZXkge2V4cGVjdGVkfVwiLFxuXSlcblxudmFyIGhhc01ldGhvZHMgPSBjcmVhdGVIYXMoaGFzSW5Db2xsLCBoYXNDb2xsR2V0LCBbXG4gICAgXCJFeHBlY3RlZCB7b2JqZWN0fSB0byBoYXZlIGtleSB7a2V5fSBlcXVhbCB0byB7ZXhwZWN0ZWR9LCBidXQgZm91bmQge2FjdHVhbH1cIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtbGVuXG4gICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBoYXZlIGtleSB7ZXhwZWN0ZWR9XCIsXG4gICAgXCJFeHBlY3RlZCB7b2JqZWN0fSB0byBub3QgaGF2ZSBrZXkge2tleX0gZXF1YWwgdG8ge2FjdHVhbH1cIixcbiAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBoYXZlIGtleSB7ZXhwZWN0ZWR9XCIsXG5dKVxuXG5leHBvcnRzLmhhc093biA9IGhhcyhoYXNPd25NZXRob2RzKVxuZXhwb3J0cy5ub3RIYXNPd24gPSBub3RIYXMoaGFzT3duTWV0aG9kcylcbmV4cG9ydHMuaGFzT3duTG9vc2UgPSBoYXNMb29zZShoYXNPd25NZXRob2RzKVxuZXhwb3J0cy5ub3RIYXNPd25Mb29zZSA9IG5vdEhhc0xvb3NlKGhhc093bk1ldGhvZHMpXG5cbmV4cG9ydHMuaGFzS2V5ID0gaGFzKGhhc0tleU1ldGhvZHMpXG5leHBvcnRzLm5vdEhhc0tleSA9IG5vdEhhcyhoYXNLZXlNZXRob2RzKVxuZXhwb3J0cy5oYXNLZXlMb29zZSA9IGhhc0xvb3NlKGhhc0tleU1ldGhvZHMpXG5leHBvcnRzLm5vdEhhc0tleUxvb3NlID0gbm90SGFzTG9vc2UoaGFzS2V5TWV0aG9kcylcblxuZXhwb3J0cy5oYXMgPSBoYXMoaGFzTWV0aG9kcylcbmV4cG9ydHMubm90SGFzID0gbm90SGFzKGhhc01ldGhvZHMpXG5leHBvcnRzLmhhc0xvb3NlID0gaGFzTG9vc2UoaGFzTWV0aG9kcylcbmV4cG9ydHMubm90SGFzTG9vc2UgPSBub3RIYXNMb29zZShoYXNNZXRob2RzKVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxudmFyIG1hdGNoID0gcmVxdWlyZShcImNsZWFuLW1hdGNoXCIpXG52YXIgdXRpbCA9IHJlcXVpcmUoXCJjbGVhbi1hc3NlcnQtdXRpbFwiKVxuXG5mdW5jdGlvbiBpbmNsdWRlcyhmdW5jLCBhbGwsIGFycmF5LCB2YWx1ZXMpIHtcbiAgICAvLyBDaGVhcCBjYXNlcyBmaXJzdFxuICAgIGlmICghQXJyYXkuaXNBcnJheShhcnJheSkpIHJldHVybiBmYWxzZVxuICAgIGlmIChhcnJheSA9PT0gdmFsdWVzKSByZXR1cm4gdHJ1ZVxuICAgIGlmIChhbGwgJiYgYXJyYXkubGVuZ3RoIDwgdmFsdWVzLmxlbmd0aCkgcmV0dXJuIGZhbHNlXG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHZhbHVlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgdmFsdWUgPSB2YWx1ZXNbaV1cbiAgICAgICAgdmFyIHRlc3QgPSBmYWxzZVxuXG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgYXJyYXkubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIGlmIChmdW5jKHZhbHVlLCBhcnJheVtqXSkpIHtcbiAgICAgICAgICAgICAgICB0ZXN0ID0gdHJ1ZVxuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGVzdCAhPT0gYWxsKSByZXR1cm4gdGVzdFxuICAgIH1cblxuICAgIHJldHVybiBhbGxcbn1cblxuZnVuY3Rpb24gZGVmaW5lSW5jbHVkZXMoZnVuYywgYWxsLCBpbnZlcnQsIG1lc3NhZ2UpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGFycmF5LCB2YWx1ZXMpIHtcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGFycmF5KSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBhcnJheWAgbXVzdCBiZSBhbiBhcnJheVwiKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHZhbHVlcykpIHZhbHVlcyA9IFt2YWx1ZXNdXG5cbiAgICAgICAgaWYgKHZhbHVlcy5sZW5ndGggJiYgaW5jbHVkZXMoZnVuYywgYWxsLCBhcnJheSwgdmFsdWVzKSA9PT0gaW52ZXJ0KSB7XG4gICAgICAgICAgICB1dGlsLmZhaWwobWVzc2FnZSwge2FjdHVhbDogYXJyYXksIHZhbHVlczogdmFsdWVzfSlcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLyogZXNsaW50LWRpc2FibGUgbWF4LWxlbiAqL1xuXG5leHBvcnRzLmluY2x1ZGVzID0gZGVmaW5lSW5jbHVkZXModXRpbC5zdHJpY3RJcywgdHJ1ZSwgZmFsc2UsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gaGF2ZSBhbGwgdmFsdWVzIGluIHt2YWx1ZXN9XCIpXG5leHBvcnRzLmluY2x1ZGVzRGVlcCA9IGRlZmluZUluY2x1ZGVzKG1hdGNoLnN0cmljdCwgdHJ1ZSwgZmFsc2UsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbWF0Y2ggYWxsIHZhbHVlcyBpbiB7dmFsdWVzfVwiKVxuZXhwb3J0cy5pbmNsdWRlc01hdGNoID0gZGVmaW5lSW5jbHVkZXMobWF0Y2gubG9vc2UsIHRydWUsIGZhbHNlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG1hdGNoIGFsbCB2YWx1ZXMgaW4ge3ZhbHVlc31cIilcbmV4cG9ydHMuaW5jbHVkZXNBbnkgPSBkZWZpbmVJbmNsdWRlcyh1dGlsLnN0cmljdElzLCBmYWxzZSwgZmFsc2UsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gaGF2ZSBhbnkgdmFsdWUgaW4ge3ZhbHVlc31cIilcbmV4cG9ydHMuaW5jbHVkZXNBbnlEZWVwID0gZGVmaW5lSW5jbHVkZXMobWF0Y2guc3RyaWN0LCBmYWxzZSwgZmFsc2UsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbWF0Y2ggYW55IHZhbHVlIGluIHt2YWx1ZXN9XCIpXG5leHBvcnRzLmluY2x1ZGVzQW55TWF0Y2ggPSBkZWZpbmVJbmNsdWRlcyhtYXRjaC5sb29zZSwgZmFsc2UsIGZhbHNlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG1hdGNoIGFueSB2YWx1ZSBpbiB7dmFsdWVzfVwiKVxuZXhwb3J0cy5ub3RJbmNsdWRlc0FsbCA9IGRlZmluZUluY2x1ZGVzKHV0aWwuc3RyaWN0SXMsIHRydWUsIHRydWUsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGhhdmUgYWxsIHZhbHVlcyBpbiB7dmFsdWVzfVwiKVxuZXhwb3J0cy5ub3RJbmNsdWRlc0FsbERlZXAgPSBkZWZpbmVJbmNsdWRlcyhtYXRjaC5zdHJpY3QsIHRydWUsIHRydWUsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IG1hdGNoIGFsbCB2YWx1ZXMgaW4ge3ZhbHVlc31cIilcbmV4cG9ydHMubm90SW5jbHVkZXNBbGxNYXRjaCA9IGRlZmluZUluY2x1ZGVzKG1hdGNoLmxvb3NlLCB0cnVlLCB0cnVlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBtYXRjaCBhbGwgdmFsdWVzIGluIHt2YWx1ZXN9XCIpXG5leHBvcnRzLm5vdEluY2x1ZGVzID0gZGVmaW5lSW5jbHVkZXModXRpbC5zdHJpY3RJcywgZmFsc2UsIHRydWUsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGhhdmUgYW55IHZhbHVlIGluIHt2YWx1ZXN9XCIpXG5leHBvcnRzLm5vdEluY2x1ZGVzRGVlcCA9IGRlZmluZUluY2x1ZGVzKG1hdGNoLnN0cmljdCwgZmFsc2UsIHRydWUsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IG1hdGNoIGFueSB2YWx1ZSBpbiB7dmFsdWVzfVwiKVxuZXhwb3J0cy5ub3RJbmNsdWRlc01hdGNoID0gZGVmaW5lSW5jbHVkZXMobWF0Y2gubG9vc2UsIGZhbHNlLCB0cnVlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBtYXRjaCBhbnkgdmFsdWUgaW4ge3ZhbHVlc31cIilcbiIsIlwidXNlIHN0cmljdFwiXG5cbnZhciB1dGlsID0gcmVxdWlyZShcImNsZWFuLWFzc2VydC11dGlsXCIpXG5cbmZ1bmN0aW9uIGdldE5hbWUoZnVuYykge1xuICAgIHZhciBuYW1lID0gZnVuYy5uYW1lXG5cbiAgICBpZiAobmFtZSA9PSBudWxsKSBuYW1lID0gZnVuYy5kaXNwbGF5TmFtZVxuICAgIGlmIChuYW1lKSByZXR1cm4gdXRpbC5lc2NhcGUobmFtZSlcbiAgICByZXR1cm4gXCI8YW5vbnltb3VzPlwiXG59XG5cbmV4cG9ydHMudGhyb3dzID0gZnVuY3Rpb24gKFR5cGUsIGNhbGxiYWNrKSB7XG4gICAgaWYgKGNhbGxiYWNrID09IG51bGwpIHtcbiAgICAgICAgY2FsbGJhY2sgPSBUeXBlXG4gICAgICAgIFR5cGUgPSBudWxsXG4gICAgfVxuXG4gICAgaWYgKFR5cGUgIT0gbnVsbCAmJiB0eXBlb2YgVHlwZSAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJgVHlwZWAgbXVzdCBiZSBhIGZ1bmN0aW9uIGlmIHBhc3NlZFwiKVxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYGNhbGxiYWNrYCBtdXN0IGJlIGEgZnVuY3Rpb25cIilcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgICBjYWxsYmFjaygpIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgY2FsbGJhY2stcmV0dXJuXG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBpZiAoVHlwZSAhPSBudWxsICYmICEoZSBpbnN0YW5jZW9mIFR5cGUpKSB7XG4gICAgICAgICAgICB1dGlsLmZhaWwoXG4gICAgICAgICAgICAgICAgXCJFeHBlY3RlZCBjYWxsYmFjayB0byB0aHJvdyBhbiBpbnN0YW5jZSBvZiBcIiArIGdldE5hbWUoVHlwZSkgK1xuICAgICAgICAgICAgICAgIFwiLCBidXQgZm91bmQge2FjdHVhbH1cIixcbiAgICAgICAgICAgICAgICB7YWN0dWFsOiBlfSlcbiAgICAgICAgfVxuICAgICAgICByZXR1cm5cbiAgICB9XG5cbiAgICB0aHJvdyBuZXcgdXRpbC5Bc3NlcnRpb25FcnJvcihcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIHRocm93XCIpXG59XG5cbmZ1bmN0aW9uIHRocm93c01hdGNoVGVzdChtYXRjaGVyLCBlKSB7XG4gICAgaWYgKHR5cGVvZiBtYXRjaGVyID09PSBcInN0cmluZ1wiKSByZXR1cm4gZS5tZXNzYWdlID09PSBtYXRjaGVyXG4gICAgaWYgKHR5cGVvZiBtYXRjaGVyID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiAhIW1hdGNoZXIoZSlcbiAgICBpZiAobWF0Y2hlciBpbnN0YW5jZW9mIFJlZ0V4cCkgcmV0dXJuICEhbWF0Y2hlci50ZXN0KGUubWVzc2FnZSlcblxuICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMobWF0Y2hlcilcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIga2V5ID0ga2V5c1tpXVxuXG4gICAgICAgIGlmICghKGtleSBpbiBlKSB8fCAhdXRpbC5zdHJpY3RJcyhtYXRjaGVyW2tleV0sIGVba2V5XSkpIHJldHVybiBmYWxzZVxuICAgIH1cblxuICAgIHJldHVybiB0cnVlXG59XG5cbmZ1bmN0aW9uIGlzUGxhaW5PYmplY3Qob2JqZWN0KSB7XG4gICAgcmV0dXJuIG9iamVjdCA9PSBudWxsIHx8IE9iamVjdC5nZXRQcm90b3R5cGVPZihvYmplY3QpID09PSBPYmplY3QucHJvdG90eXBlXG59XG5cbmV4cG9ydHMudGhyb3dzTWF0Y2ggPSBmdW5jdGlvbiAobWF0Y2hlciwgY2FsbGJhY2spIHtcbiAgICBpZiAodHlwZW9mIG1hdGNoZXIgIT09IFwic3RyaW5nXCIgJiZcbiAgICAgICAgICAgIHR5cGVvZiBtYXRjaGVyICE9PSBcImZ1bmN0aW9uXCIgJiZcbiAgICAgICAgICAgICEobWF0Y2hlciBpbnN0YW5jZW9mIFJlZ0V4cCkgJiZcbiAgICAgICAgICAgICFpc1BsYWluT2JqZWN0KG1hdGNoZXIpKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgICAgICBcImBtYXRjaGVyYCBtdXN0IGJlIGEgc3RyaW5nLCBmdW5jdGlvbiwgUmVnRXhwLCBvciBvYmplY3RcIilcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBjYWxsYmFja2AgbXVzdCBiZSBhIGZ1bmN0aW9uXCIpXG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgICAgY2FsbGJhY2soKSAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGNhbGxiYWNrLXJldHVyblxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgaWYgKCF0aHJvd3NNYXRjaFRlc3QobWF0Y2hlciwgZSkpIHtcbiAgICAgICAgICAgIHV0aWwuZmFpbChcbiAgICAgICAgICAgICAgICBcIkV4cGVjdGVkIGNhbGxiYWNrIHRvICB0aHJvdyBhbiBlcnJvciB0aGF0IG1hdGNoZXMgXCIgK1xuICAgICAgICAgICAgICAgIFwie2V4cGVjdGVkfSwgYnV0IGZvdW5kIHthY3R1YWx9XCIsXG4gICAgICAgICAgICAgICAge2V4cGVjdGVkOiBtYXRjaGVyLCBhY3R1YWw6IGV9KVxuICAgICAgICB9XG4gICAgICAgIHJldHVyblxuICAgIH1cblxuICAgIHRocm93IG5ldyB1dGlsLkFzc2VydGlvbkVycm9yKFwiRXhwZWN0ZWQgY2FsbGJhY2sgdG8gdGhyb3cuXCIpXG59XG4iLCJcInVzZSBzdHJpY3RcIlxuXG52YXIgdXRpbCA9IHJlcXVpcmUoXCJjbGVhbi1hc3NlcnQtdXRpbFwiKVxuXG5leHBvcnRzLm9rID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAoIXgpIHV0aWwuZmFpbChcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGJlIHRydXRoeVwiLCB7YWN0dWFsOiB4fSlcbn1cblxuZXhwb3J0cy5ub3RPayA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHgpIHV0aWwuZmFpbChcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGJlIGZhbHN5XCIsIHthY3R1YWw6IHh9KVxufVxuXG5leHBvcnRzLmlzQm9vbGVhbiA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHR5cGVvZiB4ICE9PSBcImJvb2xlYW5cIikge1xuICAgICAgICB1dGlsLmZhaWwoXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBiZSBhIGJvb2xlYW5cIiwge2FjdHVhbDogeH0pXG4gICAgfVxufVxuXG5leHBvcnRzLm5vdEJvb2xlYW4gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh0eXBlb2YgeCA9PT0gXCJib29sZWFuXCIpIHtcbiAgICAgICAgdXRpbC5mYWlsKFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGJlIGEgYm9vbGVhblwiLCB7YWN0dWFsOiB4fSlcbiAgICB9XG59XG5cbmV4cG9ydHMuaXNGdW5jdGlvbiA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHR5cGVvZiB4ICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdXRpbC5mYWlsKFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gYmUgYSBmdW5jdGlvblwiLCB7YWN0dWFsOiB4fSlcbiAgICB9XG59XG5cbmV4cG9ydHMubm90RnVuY3Rpb24gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh0eXBlb2YgeCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHV0aWwuZmFpbChcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBiZSBhIGZ1bmN0aW9uXCIsIHthY3R1YWw6IHh9KVxuICAgIH1cbn1cblxuZXhwb3J0cy5pc051bWJlciA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHR5cGVvZiB4ICE9PSBcIm51bWJlclwiKSB7XG4gICAgICAgIHV0aWwuZmFpbChcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGJlIGEgbnVtYmVyXCIsIHthY3R1YWw6IHh9KVxuICAgIH1cbn1cblxuZXhwb3J0cy5ub3ROdW1iZXIgPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh0eXBlb2YgeCA9PT0gXCJudW1iZXJcIikge1xuICAgICAgICB1dGlsLmZhaWwoXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgYmUgYSBudW1iZXJcIiwge2FjdHVhbDogeH0pXG4gICAgfVxufVxuXG5leHBvcnRzLmlzT2JqZWN0ID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAodHlwZW9mIHggIT09IFwib2JqZWN0XCIgfHwgeCA9PSBudWxsKSB7XG4gICAgICAgIHV0aWwuZmFpbChcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGJlIGFuIG9iamVjdFwiLCB7YWN0dWFsOiB4fSlcbiAgICB9XG59XG5cbmV4cG9ydHMubm90T2JqZWN0ID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAodHlwZW9mIHggPT09IFwib2JqZWN0XCIgJiYgeCAhPSBudWxsKSB7XG4gICAgICAgIHV0aWwuZmFpbChcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBiZSBhbiBvYmplY3RcIiwge2FjdHVhbDogeH0pXG4gICAgfVxufVxuXG5leHBvcnRzLmlzU3RyaW5nID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAodHlwZW9mIHggIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgdXRpbC5mYWlsKFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gYmUgYSBzdHJpbmdcIiwge2FjdHVhbDogeH0pXG4gICAgfVxufVxuXG5leHBvcnRzLm5vdFN0cmluZyA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHR5cGVvZiB4ID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIHV0aWwuZmFpbChcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBiZSBhIHN0cmluZ1wiLCB7YWN0dWFsOiB4fSlcbiAgICB9XG59XG5cbmV4cG9ydHMuaXNTeW1ib2wgPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh0eXBlb2YgeCAhPT0gXCJzeW1ib2xcIikge1xuICAgICAgICB1dGlsLmZhaWwoXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBiZSBhIHN5bWJvbFwiLCB7YWN0dWFsOiB4fSlcbiAgICB9XG59XG5cbmV4cG9ydHMubm90U3ltYm9sID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAodHlwZW9mIHggPT09IFwic3ltYm9sXCIpIHtcbiAgICAgICAgdXRpbC5mYWlsKFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGJlIGEgc3ltYm9sXCIsIHthY3R1YWw6IHh9KVxuICAgIH1cbn1cblxuZXhwb3J0cy5leGlzdHMgPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh4ID09IG51bGwpIHtcbiAgICAgICAgdXRpbC5mYWlsKFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gZXhpc3RcIiwge2FjdHVhbDogeH0pXG4gICAgfVxufVxuXG5leHBvcnRzLm5vdEV4aXN0cyA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHggIT0gbnVsbCkge1xuICAgICAgICB1dGlsLmZhaWwoXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgZXhpc3RcIiwge2FjdHVhbDogeH0pXG4gICAgfVxufVxuXG5leHBvcnRzLmlzQXJyYXkgPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICghQXJyYXkuaXNBcnJheSh4KSkge1xuICAgICAgICB1dGlsLmZhaWwoXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBiZSBhbiBhcnJheVwiLCB7YWN0dWFsOiB4fSlcbiAgICB9XG59XG5cbmV4cG9ydHMubm90QXJyYXkgPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmIChBcnJheS5pc0FycmF5KHgpKSB7XG4gICAgICAgIHV0aWwuZmFpbChcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBiZSBhbiBhcnJheVwiLCB7YWN0dWFsOiB4fSlcbiAgICB9XG59XG5cbmV4cG9ydHMuaXMgPSBmdW5jdGlvbiAoVHlwZSwgb2JqZWN0KSB7XG4gICAgaWYgKHR5cGVvZiBUeXBlICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBUeXBlYCBtdXN0IGJlIGEgZnVuY3Rpb25cIilcbiAgICB9XG5cbiAgICBpZiAoIShvYmplY3QgaW5zdGFuY2VvZiBUeXBlKSkge1xuICAgICAgICB1dGlsLmZhaWwoXCJFeHBlY3RlZCB7b2JqZWN0fSB0byBiZSBhbiBpbnN0YW5jZSBvZiB7ZXhwZWN0ZWR9XCIsIHtcbiAgICAgICAgICAgIGV4cGVjdGVkOiBUeXBlLFxuICAgICAgICAgICAgYWN0dWFsOiBvYmplY3QuY29uc3RydWN0b3IsXG4gICAgICAgICAgICBvYmplY3Q6IG9iamVjdCxcbiAgICAgICAgfSlcbiAgICB9XG59XG5cbmV4cG9ydHMubm90ID0gZnVuY3Rpb24gKFR5cGUsIG9iamVjdCkge1xuICAgIGlmICh0eXBlb2YgVHlwZSAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJgVHlwZWAgbXVzdCBiZSBhIGZ1bmN0aW9uXCIpXG4gICAgfVxuXG4gICAgaWYgKG9iamVjdCBpbnN0YW5jZW9mIFR5cGUpIHtcbiAgICAgICAgdXRpbC5mYWlsKFwiRXhwZWN0ZWQge29iamVjdH0gdG8gbm90IGJlIGFuIGluc3RhbmNlIG9mIHtleHBlY3RlZH1cIiwge1xuICAgICAgICAgICAgZXhwZWN0ZWQ6IFR5cGUsXG4gICAgICAgICAgICBvYmplY3Q6IG9iamVjdCxcbiAgICAgICAgfSlcbiAgICB9XG59XG4iLCIvKipcbiAqIEBsaWNlbnNlXG4gKiBjbGVhbi1tYXRjaFxuICpcbiAqIEEgc2ltcGxlLCBmYXN0IEVTMjAxNSsgYXdhcmUgZGVlcCBtYXRjaGluZyB1dGlsaXR5LlxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNiBhbmQgbGF0ZXIsIElzaWFoIE1lYWRvd3MgPG1lQGlzaWFobWVhZG93cy5jb20+LlxuICpcbiAqIFBlcm1pc3Npb24gdG8gdXNlLCBjb3B5LCBtb2RpZnksIGFuZC9vciBkaXN0cmlidXRlIHRoaXMgc29mdHdhcmUgZm9yIGFueVxuICogcHVycG9zZSB3aXRoIG9yIHdpdGhvdXQgZmVlIGlzIGhlcmVieSBncmFudGVkLCBwcm92aWRlZCB0aGF0IHRoZSBhYm92ZVxuICogY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBhcHBlYXIgaW4gYWxsIGNvcGllcy5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiIEFORCBUSEUgQVVUSE9SIERJU0NMQUlNUyBBTEwgV0FSUkFOVElFUyBXSVRIXG4gKiBSRUdBUkQgVE8gVEhJUyBTT0ZUV0FSRSBJTkNMVURJTkcgQUxMIElNUExJRUQgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFlcbiAqIEFORCBGSVRORVNTLiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SIEJFIExJQUJMRSBGT1IgQU5ZIFNQRUNJQUwsIERJUkVDVCxcbiAqIElORElSRUNULCBPUiBDT05TRVFVRU5USUFMIERBTUFHRVMgT1IgQU5ZIERBTUFHRVMgV0hBVFNPRVZFUiBSRVNVTFRJTkcgRlJPTVxuICogTE9TUyBPRiBVU0UsIERBVEEgT1IgUFJPRklUUywgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIE5FR0xJR0VOQ0UgT1JcbiAqIE9USEVSIFRPUlRJT1VTIEFDVElPTiwgQVJJU0lORyBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBVU0UgT1JcbiAqIFBFUkZPUk1BTkNFIE9GIFRISVMgU09GVFdBUkUuXG4gKi9cblxuLyogZXNsaW50LWRpc2FibGUgKi9cbjsoZnVuY3Rpb24gKGdsb2JhbCwgZmFjdG9yeSkge1xuICAgIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gXCJvYmplY3RcIiAmJiBleHBvcnRzICE9IG51bGwpIHtcbiAgICAgICAgZmFjdG9yeShnbG9iYWwsIGV4cG9ydHMpXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgZGVmaW5lKFwiY2xlYW4tbWF0Y2hcIiwgW1wiZXhwb3J0c1wiXSwgZnVuY3Rpb24gKGV4cG9ydHMpIHtcbiAgICAgICAgICAgIGZhY3RvcnkoZ2xvYmFsLCBleHBvcnRzKVxuICAgICAgICB9KVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGZhY3RvcnkoZ2xvYmFsLCBnbG9iYWwubWF0Y2ggPSB7fSlcbiAgICB9XG59KSh0eXBlb2YgZ2xvYmFsID09PSBcIm9iamVjdFwiICYmIGdsb2JhbCAhPT0gbnVsbCA/IGdsb2JhbFxuICAgIDogdHlwZW9mIHNlbGYgPT09IFwib2JqZWN0XCIgJiYgc2VsZiAhPT0gbnVsbCA/IHNlbGZcbiAgICA6IHR5cGVvZiB3aW5kb3cgPT09IFwib2JqZWN0XCIgJiYgd2luZG93ICE9PSBudWxsID8gd2luZG93XG4gICAgOiB0aGlzLFxuZnVuY3Rpb24gKGdsb2JhbCwgZXhwb3J0cykge1xuICAgIC8qIGVzbGludC1lbmFibGUgKi9cbiAgICBcInVzZSBzdHJpY3RcIlxuXG4gICAgLyogZ2xvYmFsIFN5bWJvbCwgVWludDhBcnJheSwgRGF0YVZpZXcsIEFycmF5QnVmZmVyLCBBcnJheUJ1ZmZlclZpZXcsIE1hcCxcbiAgICBTZXQgKi9cblxuICAgIC8qKlxuICAgICAqIERlZXAgbWF0Y2hpbmcgYWxnb3JpdGhtLCB3aXRoIHplcm8gZGVwZW5kZW5jaWVzLiBOb3RlIHRoZSBmb2xsb3dpbmc6XG4gICAgICpcbiAgICAgKiAtIFRoaXMgaXMgcmVsYXRpdmVseSBwZXJmb3JtYW5jZS10dW5lZCwgYWx0aG91Z2ggaXQgcHJlZmVycyBoaWdoXG4gICAgICogICBjb3JyZWN0bmVzcy4gUGF0Y2ggd2l0aCBjYXJlLCBzaW5jZSBwZXJmb3JtYW5jZSBpcyBhIGNvbmNlcm4uXG4gICAgICogLSBUaGlzIGRvZXMgcGFjayBhICpsb3QqIG9mIGZlYXR1cmVzLCB3aGljaCBzaG91bGQgZXhwbGFpbiB0aGUgbGVuZ3RoLlxuICAgICAqIC0gU29tZSBvZiB0aGUgZHVwbGljYXRpb24gaXMgaW50ZW50aW9uYWwuIEl0J3MgZ2VuZXJhbGx5IGNvbW1lbnRlZCwgYnV0XG4gICAgICogICBpdCdzIG1haW5seSBmb3IgcGVyZm9ybWFuY2UsIHNpbmNlIHRoZSBlbmdpbmUgbmVlZHMgaXRzIHR5cGUgaW5mby5cbiAgICAgKiAtIFBvbHlmaWxsZWQgY29yZS1qcyBTeW1ib2xzIGZyb20gY3Jvc3Mtb3JpZ2luIGNvbnRleHRzIHdpbGwgbmV2ZXJcbiAgICAgKiAgIHJlZ2lzdGVyIGFzIGJlaW5nIGFjdHVhbCBTeW1ib2xzLlxuICAgICAqXG4gICAgICogQW5kIGluIGNhc2UgeW91J3JlIHdvbmRlcmluZyBhYm91dCB0aGUgbG9uZ2VyIGZ1bmN0aW9ucyBhbmQgb2NjYXNpb25hbFxuICAgICAqIHJlcGV0aXRpb24sIGl0J3MgYmVjYXVzZSBWOCdzIGlubGluZXIgaXNuJ3QgYWx3YXlzIGludGVsbGlnZW50IGVub3VnaCB0b1xuICAgICAqIGRlYWwgd2l0aCB0aGUgc3VwZXIgaGlnaGx5IHBvbHltb3JwaGljIGRhdGEgdGhpcyBvZnRlbiBkZWFscyB3aXRoLCBhbmQgSlNcbiAgICAgKiBkb2Vzbid0IGhhdmUgY29tcGlsZS10aW1lIG1hY3Jvcy5cbiAgICAgKi9cblxuICAgIHZhciBvYmplY3RUb1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmdcbiAgICB2YXIgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eVxuXG4gICAgdmFyIHN1cHBvcnRzVW5pY29kZSA9IGhhc093bi5jYWxsKFJlZ0V4cC5wcm90b3R5cGUsIFwidW5pY29kZVwiKVxuICAgIHZhciBzdXBwb3J0c1N0aWNreSA9IGhhc093bi5jYWxsKFJlZ0V4cC5wcm90b3R5cGUsIFwic3RpY2t5XCIpXG5cbiAgICAvLyBMZWdhY3kgZW5naW5lcyBoYXZlIHNldmVyYWwgaXNzdWVzIHdoZW4gaXQgY29tZXMgdG8gYHR5cGVvZmAuXG4gICAgdmFyIGlzRnVuY3Rpb24gPSAoZnVuY3Rpb24gKCkge1xuICAgICAgICBmdW5jdGlvbiBTbG93SXNGdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKHZhbHVlID09IG51bGwpIHJldHVybiBmYWxzZVxuXG4gICAgICAgICAgICB2YXIgdGFnID0gb2JqZWN0VG9TdHJpbmcuY2FsbCh2YWx1ZSlcblxuICAgICAgICAgICAgcmV0dXJuIHRhZyA9PT0gXCJbb2JqZWN0IEZ1bmN0aW9uXVwiIHx8XG4gICAgICAgICAgICAgICAgdGFnID09PSBcIltvYmplY3QgR2VuZXJhdG9yRnVuY3Rpb25dXCIgfHxcbiAgICAgICAgICAgICAgICB0YWcgPT09IFwiW29iamVjdCBBc3luY0Z1bmN0aW9uXVwiIHx8XG4gICAgICAgICAgICAgICAgdGFnID09PSBcIltvYmplY3QgUHJveHldXCJcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGlzUG9pc29uZWQob2JqZWN0KSB7XG4gICAgICAgICAgICByZXR1cm4gb2JqZWN0ICE9IG51bGwgJiYgdHlwZW9mIG9iamVjdCAhPT0gXCJmdW5jdGlvblwiXG4gICAgICAgIH1cblxuICAgICAgICAvLyBJbiBTYWZhcmkgMTAsIGB0eXBlb2YgUHJveHkgPT09IFwib2JqZWN0XCJgXG4gICAgICAgIGlmIChpc1BvaXNvbmVkKGdsb2JhbC5Qcm94eSkpIHJldHVybiBTbG93SXNGdW5jdGlvblxuXG4gICAgICAgIC8vIEluIFNhZmFyaSA4LCBzZXZlcmFsIHR5cGVkIGFycmF5IGNvbnN0cnVjdG9ycyBhcmVcbiAgICAgICAgLy8gYHR5cGVvZiBDID09PSBcIm9iamVjdFwiYFxuICAgICAgICBpZiAoaXNQb2lzb25lZChnbG9iYWwuSW50OEFycmF5KSkgcmV0dXJuIFNsb3dJc0Z1bmN0aW9uXG5cbiAgICAgICAgLy8gSW4gb2xkIFY4LCBSZWdFeHBzIGFyZSBjYWxsYWJsZVxuICAgICAgICBpZiAodHlwZW9mIC94LyA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4gU2xvd0lzRnVuY3Rpb24gLy8gZXNsaW50LWRpc2FibGUtbGluZVxuXG4gICAgICAgIC8vIExlYXZlIHRoaXMgZm9yIG5vcm1hbCB0aGluZ3MuIEl0J3MgZWFzaWx5IGlubGluZWQuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBpc0Z1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSBcImZ1bmN0aW9uXCJcbiAgICAgICAgfVxuICAgIH0pKClcblxuICAgIC8vIFNldCB1cCBvdXIgb3duIGJ1ZmZlciBjaGVjay4gV2Ugc2hvdWxkIGFsd2F5cyBhY2NlcHQgdGhlIHBvbHlmaWxsLCBldmVuXG4gICAgLy8gaW4gTm9kZS4gTm90ZSB0aGF0IGl0IHVzZXMgYGdsb2JhbC5CdWZmZXJgIHRvIGF2b2lkIGluY2x1ZGluZyBgYnVmZmVyYCBpblxuICAgIC8vIHRoZSBidW5kbGUuXG5cbiAgICB2YXIgQnVmZmVyTmF0aXZlID0gMFxuICAgIHZhciBCdWZmZXJQb2x5ZmlsbCA9IDFcbiAgICB2YXIgQnVmZmVyU2FmYXJpID0gMlxuXG4gICAgdmFyIGJ1ZmZlclN1cHBvcnQgPSAoZnVuY3Rpb24gKCkge1xuICAgICAgICBmdW5jdGlvbiBGYWtlQnVmZmVyKCkge31cbiAgICAgICAgRmFrZUJ1ZmZlci5pc0J1ZmZlciA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRydWUgfVxuXG4gICAgICAgIC8vIE9ubHkgU2FmYXJpIDUtNyBoYXMgZXZlciBoYWQgdGhpcyBpc3N1ZS5cbiAgICAgICAgaWYgKG5ldyBGYWtlQnVmZmVyKCkuY29uc3RydWN0b3IgIT09IEZha2VCdWZmZXIpIHJldHVybiBCdWZmZXJTYWZhcmlcbiAgICAgICAgaWYgKCFpc0Z1bmN0aW9uKGdsb2JhbC5CdWZmZXIpKSByZXR1cm4gQnVmZmVyUG9seWZpbGxcbiAgICAgICAgaWYgKCFpc0Z1bmN0aW9uKGdsb2JhbC5CdWZmZXIuaXNCdWZmZXIpKSByZXR1cm4gQnVmZmVyUG9seWZpbGxcbiAgICAgICAgLy8gQXZvaWQgZ2xvYmFsIHBvbHlmaWxsc1xuICAgICAgICBpZiAoZ2xvYmFsLkJ1ZmZlci5pc0J1ZmZlcihuZXcgRmFrZUJ1ZmZlcigpKSkgcmV0dXJuIEJ1ZmZlclBvbHlmaWxsXG4gICAgICAgIHJldHVybiBCdWZmZXJOYXRpdmVcbiAgICB9KSgpXG5cbiAgICB2YXIgZ2xvYmFsSXNCdWZmZXIgPSBidWZmZXJTdXBwb3J0ID09PSBCdWZmZXJOYXRpdmVcbiAgICAgICAgPyBnbG9iYWwuQnVmZmVyLmlzQnVmZmVyXG4gICAgICAgIDogdW5kZWZpbmVkXG5cbiAgICBmdW5jdGlvbiBpc0J1ZmZlcihvYmplY3QpIHtcbiAgICAgICAgaWYgKGJ1ZmZlclN1cHBvcnQgPT09IEJ1ZmZlck5hdGl2ZSAmJiBnbG9iYWxJc0J1ZmZlcihvYmplY3QpKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICB9IGVsc2UgaWYgKGJ1ZmZlclN1cHBvcnQgPT09IEJ1ZmZlclNhZmFyaSAmJiBvYmplY3QuX2lzQnVmZmVyKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIEIgPSBvYmplY3QuY29uc3RydWN0b3JcblxuICAgICAgICBpZiAoIWlzRnVuY3Rpb24oQikpIHJldHVybiBmYWxzZVxuICAgICAgICBpZiAoIWlzRnVuY3Rpb24oQi5pc0J1ZmZlcikpIHJldHVybiBmYWxzZVxuICAgICAgICByZXR1cm4gQi5pc0J1ZmZlcihvYmplY3QpXG4gICAgfVxuXG4gICAgLy8gY29yZS1qcycgc3ltYm9scyBhcmUgb2JqZWN0cywgYW5kIHNvbWUgb2xkIHZlcnNpb25zIG9mIFY4IGVycm9uZW91c2x5IGhhZFxuICAgIC8vIGB0eXBlb2YgU3ltYm9sKCkgPT09IFwib2JqZWN0XCJgLlxuICAgIHZhciBzeW1ib2xzQXJlT2JqZWN0cyA9IGlzRnVuY3Rpb24oZ2xvYmFsLlN5bWJvbCkgJiZcbiAgICAgICAgdHlwZW9mIFN5bWJvbCgpID09PSBcIm9iamVjdFwiXG5cbiAgICAvLyBgY29udGV4dGAgaXMgYSBiaXQgZmllbGQsIHdpdGggdGhlIGZvbGxvd2luZyBiaXRzLiBUaGlzIGlzIG5vdCBhcyBtdWNoXG4gICAgLy8gZm9yIHBlcmZvcm1hbmNlIHRoYW4gdG8ganVzdCByZWR1Y2UgdGhlIG51bWJlciBvZiBwYXJhbWV0ZXJzIEkgbmVlZCB0byBiZVxuICAgIC8vIHRocm93aW5nIGFyb3VuZC5cbiAgICB2YXIgU3RyaWN0ID0gMVxuICAgIHZhciBJbml0aWFsID0gMlxuICAgIHZhciBTYW1lUHJvdG8gPSA0XG5cbiAgICBleHBvcnRzLmxvb3NlID0gZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgcmV0dXJuIG1hdGNoKGEsIGIsIEluaXRpYWwsIHVuZGVmaW5lZCwgdW5kZWZpbmVkKVxuICAgIH1cblxuICAgIGV4cG9ydHMuc3RyaWN0ID0gZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgcmV0dXJuIG1hdGNoKGEsIGIsIFN0cmljdCB8IEluaXRpYWwsIHVuZGVmaW5lZCwgdW5kZWZpbmVkKVxuICAgIH1cblxuICAgIC8vIEZlYXR1cmUtdGVzdCBkZWxheWVkIHN0YWNrIGFkZGl0aW9ucyBhbmQgZXh0cmEga2V5cy4gUGhhbnRvbUpTIGFuZCBJRVxuICAgIC8vIGJvdGggd2FpdCB1bnRpbCB0aGUgZXJyb3Igd2FzIGFjdHVhbGx5IHRocm93biBmaXJzdCwgYW5kIGFzc2lnbiB0aGVtIGFzXG4gICAgLy8gb3duIHByb3BlcnRpZXMsIHdoaWNoIGlzIHVuaGVscGZ1bCBmb3IgYXNzZXJ0aW9ucy4gVGhpcyByZXR1cm5zIGFcbiAgICAvLyBmdW5jdGlvbiB0byBzcGVlZCB1cCBjYXNlcyB3aGVyZSBgT2JqZWN0LmtleXNgIGlzIHN1ZmZpY2llbnQgKGUuZy4gaW5cbiAgICAvLyBDaHJvbWUvRkYvTm9kZSkuXG4gICAgLy9cbiAgICAvLyBUaGlzIHdvdWxkbid0IGJlIG5lY2Vzc2FyeSBpZiB0aG9zZSBlbmdpbmVzIHdvdWxkIG1ha2UgdGhlIHN0YWNrIGFcbiAgICAvLyBnZXR0ZXIsIGFuZCByZWNvcmQgaXQgd2hlbiB0aGUgZXJyb3Igd2FzIGNyZWF0ZWQsIG5vdCB3aGVuIGl0IHdhcyB0aHJvd24uXG4gICAgLy8gSXQgc3BlY2lmaWNhbGx5IGZpbHRlcnMgb3V0IGVycm9ycyBhbmQgb25seSBjaGVja3MgZXhpc3RpbmcgZGVzY3JpcHRvcnMsXG4gICAgLy8ganVzdCB0byBrZWVwIHRoZSBtZXNzIGZyb20gYWZmZWN0aW5nIGV2ZXJ5dGhpbmcgKGl0J3Mgbm90IGZ1bGx5IGNvcnJlY3QsXG4gICAgLy8gYnV0IGl0J3MgbmVjZXNzYXJ5KS5cbiAgICB2YXIgcmVxdWlyZXNQcm94eSA9IChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB0ZXN0ID0gbmV3IEVycm9yKClcbiAgICAgICAgdmFyIG9sZCA9IE9iamVjdC5jcmVhdGUobnVsbClcblxuICAgICAgICBPYmplY3Qua2V5cyh0ZXN0KS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHsgb2xkW2tleV0gPSB0cnVlIH0pXG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRocm93IHRlc3RcbiAgICAgICAgfSBjYXRjaCAoXykge1xuICAgICAgICAgICAgLy8gaWdub3JlXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gT2JqZWN0LmtleXModGVzdCkuc29tZShmdW5jdGlvbiAoa2V5KSB7IHJldHVybiAhb2xkW2tleV0gfSlcbiAgICB9KSgpXG5cbiAgICBmdW5jdGlvbiBpc0lnbm9yZWQob2JqZWN0LCBrZXkpIHtcbiAgICAgICAgc3dpdGNoIChrZXkpIHtcbiAgICAgICAgY2FzZSBcImxpbmVcIjogaWYgKHR5cGVvZiBvYmplY3QubGluZSAhPT0gXCJudW1iZXJcIikgcmV0dXJuIGZhbHNlOyBicmVha1xuICAgICAgICBjYXNlIFwic291cmNlVVJMXCI6XG4gICAgICAgICAgICBpZiAodHlwZW9mIG9iamVjdC5zb3VyY2VVUkwgIT09IFwic3RyaW5nXCIpIHJldHVybiBmYWxzZTsgYnJlYWtcbiAgICAgICAgY2FzZSBcInN0YWNrXCI6IGlmICh0eXBlb2Ygb2JqZWN0LnN0YWNrICE9PSBcInN0cmluZ1wiKSByZXR1cm4gZmFsc2U7IGJyZWFrXG4gICAgICAgIGRlZmF1bHQ6IHJldHVybiBmYWxzZVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKG9iamVjdCwga2V5KVxuXG4gICAgICAgIHJldHVybiAhZGVzYy5jb25maWd1cmFibGUgJiYgZGVzYy5lbnVtZXJhYmxlICYmICFkZXNjLndyaXRhYmxlXG4gICAgfVxuXG4gICAgLy8gVGhpcyBpcyBvbmx5IGludm9rZWQgd2l0aCBlcnJvcnMsIHNvIGl0J3Mgbm90IGdvaW5nIHRvIHByZXNlbnQgYVxuICAgIC8vIHNpZ25pZmljYW50IHNsb3cgZG93bi5cbiAgICBmdW5jdGlvbiBnZXRLZXlzU3RyaXBwZWQob2JqZWN0KSB7XG4gICAgICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMob2JqZWN0KVxuICAgICAgICB2YXIgY291bnQgPSAwXG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoIWlzSWdub3JlZChvYmplY3QsIGtleXNbaV0pKSBrZXlzW2NvdW50KytdID0ga2V5c1tpXVxuICAgICAgICB9XG5cbiAgICAgICAga2V5cy5sZW5ndGggPSBjb3VudFxuICAgICAgICByZXR1cm4ga2V5c1xuICAgIH1cblxuICAgIC8vIFdheSBmYXN0ZXIsIHNpbmNlIHR5cGVkIGFycmF5IGluZGljZXMgYXJlIGFsd2F5cyBkZW5zZSBhbmQgY29udGFpblxuICAgIC8vIG51bWJlcnMuXG5cbiAgICAvLyBTZXR1cCBmb3IgYGlzQnVmZmVyT3JWaWV3YCBhbmQgYGlzVmlld2BcbiAgICB2YXIgQXJyYXlCdWZmZXJOb25lID0gMFxuICAgIHZhciBBcnJheUJ1ZmZlckxlZ2FjeSA9IDFcbiAgICB2YXIgQXJyYXlCdWZmZXJDdXJyZW50ID0gMlxuXG4gICAgdmFyIGFycmF5QnVmZmVyU3VwcG9ydCA9IChmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghaXNGdW5jdGlvbihnbG9iYWwuVWludDhBcnJheSkpIHJldHVybiBBcnJheUJ1ZmZlck5vbmVcbiAgICAgICAgaWYgKCFpc0Z1bmN0aW9uKGdsb2JhbC5EYXRhVmlldykpIHJldHVybiBBcnJheUJ1ZmZlck5vbmVcbiAgICAgICAgaWYgKCFpc0Z1bmN0aW9uKGdsb2JhbC5BcnJheUJ1ZmZlcikpIHJldHVybiBBcnJheUJ1ZmZlck5vbmVcbiAgICAgICAgaWYgKGlzRnVuY3Rpb24oZ2xvYmFsLkFycmF5QnVmZmVyLmlzVmlldykpIHJldHVybiBBcnJheUJ1ZmZlckN1cnJlbnRcbiAgICAgICAgaWYgKGlzRnVuY3Rpb24oZ2xvYmFsLkFycmF5QnVmZmVyVmlldykpIHJldHVybiBBcnJheUJ1ZmZlckxlZ2FjeVxuICAgICAgICByZXR1cm4gQXJyYXlCdWZmZXJOb25lXG4gICAgfSkoKVxuXG4gICAgLy8gSWYgdHlwZWQgYXJyYXlzIGFyZW4ndCBzdXBwb3J0ZWQgKHRoZXkgd2VyZW4ndCB0ZWNobmljYWxseSBwYXJ0IG9mXG4gICAgLy8gRVM1LCBidXQgbWFueSBlbmdpbmVzIGltcGxlbWVudGVkIEtocm9ub3MnIHNwZWMgYmVmb3JlIEVTNiksIHRoZW5cbiAgICAvLyBqdXN0IGZhbGwgYmFjayB0byBnZW5lcmljIGJ1ZmZlciBkZXRlY3Rpb24uXG5cbiAgICBmdW5jdGlvbiBmbG9hdElzKGEsIGIpIHtcbiAgICAgICAgLy8gU28gTmFOcyBhcmUgY29uc2lkZXJlZCBlcXVhbC5cbiAgICAgICAgcmV0dXJuIGEgPT09IGIgfHwgYSAhPT0gYSAmJiBiICE9PSBiIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tc2VsZi1jb21wYXJlLCBtYXgtbGVuXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWF0Y2hWaWV3KGEsIGIpIHtcbiAgICAgICAgdmFyIGNvdW50ID0gYS5sZW5ndGhcblxuICAgICAgICBpZiAoY291bnQgIT09IGIubGVuZ3RoKSByZXR1cm4gZmFsc2VcblxuICAgICAgICB3aGlsZSAoY291bnQpIHtcbiAgICAgICAgICAgIGNvdW50LS1cbiAgICAgICAgICAgIGlmICghZmxvYXRJcyhhW2NvdW50XSwgYltjb3VudF0pKSByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuXG4gICAgdmFyIGlzVmlldyA9IChmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmIChhcnJheUJ1ZmZlclN1cHBvcnQgPT09IEFycmF5QnVmZmVyTm9uZSkgcmV0dXJuIHVuZGVmaW5lZFxuICAgICAgICAvLyBFUzYgdHlwZWQgYXJyYXlzXG4gICAgICAgIGlmIChhcnJheUJ1ZmZlclN1cHBvcnQgPT09IEFycmF5QnVmZmVyQ3VycmVudCkgcmV0dXJuIEFycmF5QnVmZmVyLmlzVmlld1xuICAgICAgICAvLyBsZWdhY3kgdHlwZWQgYXJyYXlzXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBpc1ZpZXcob2JqZWN0KSB7XG4gICAgICAgICAgICByZXR1cm4gb2JqZWN0IGluc3RhbmNlb2YgQXJyYXlCdWZmZXJWaWV3XG4gICAgICAgIH1cbiAgICB9KSgpXG5cbiAgICAvLyBTdXBwb3J0IGNoZWNraW5nIG1hcHMgYW5kIHNldHMgZGVlcGx5LiBUaGV5IGFyZSBvYmplY3QtbGlrZSBlbm91Z2ggdG9cbiAgICAvLyBjb3VudCwgYW5kIGFyZSB1c2VmdWwgaW4gdGhlaXIgb3duIHJpZ2h0LiBUaGUgY29kZSBpcyByYXRoZXIgbWVzc3ksIGJ1dFxuICAgIC8vIG1haW5seSB0byBrZWVwIHRoZSBvcmRlci1pbmRlcGVuZGVudCBjaGVja2luZyBmcm9tIGJlY29taW5nIGluc2FuZWx5XG4gICAgLy8gc2xvdy5cbiAgICB2YXIgc3VwcG9ydHNNYXAgPSBpc0Z1bmN0aW9uKGdsb2JhbC5NYXApXG4gICAgdmFyIHN1cHBvcnRzU2V0ID0gaXNGdW5jdGlvbihnbG9iYWwuU2V0KVxuXG4gICAgLy8gT25lIG9mIHRoZSBzZXRzIGFuZCBib3RoIG1hcHMnIGtleXMgYXJlIGNvbnZlcnRlZCB0byBhcnJheXMgZm9yIGZhc3RlclxuICAgIC8vIGhhbmRsaW5nLlxuICAgIGZ1bmN0aW9uIGtleUxpc3QobWFwKSB7XG4gICAgICAgIHZhciBsaXN0ID0gbmV3IEFycmF5KG1hcC5zaXplKVxuICAgICAgICB2YXIgaSA9IDBcbiAgICAgICAgdmFyIGl0ZXIgPSBtYXAua2V5cygpXG5cbiAgICAgICAgZm9yICh2YXIgbmV4dCA9IGl0ZXIubmV4dCgpOyAhbmV4dC5kb25lOyBuZXh0ID0gaXRlci5uZXh0KCkpIHtcbiAgICAgICAgICAgIGxpc3RbaSsrXSA9IG5leHQudmFsdWVcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBsaXN0XG4gICAgfVxuXG4gICAgLy8gVGhlIHBhaXIgb2YgYXJyYXlzIGFyZSBhbGlnbmVkIGluIGEgc2luZ2xlIE8obl4yKSBvcGVyYXRpb24gKG1vZCBkZWVwXG4gICAgLy8gbWF0Y2hpbmcgYW5kIHJvdGF0aW9uKSwgYWRhcHRpbmcgdG8gTyhuKSB3aGVuIHRoZXkncmUgYWxyZWFkeSBhbGlnbmVkLlxuICAgIGZ1bmN0aW9uIG1hdGNoS2V5KGN1cnJlbnQsIGFrZXlzLCBzdGFydCwgZW5kLCBjb250ZXh0LCBsZWZ0LCByaWdodCkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1wYXJhbXMsIG1heC1sZW5cbiAgICAgICAgZm9yICh2YXIgaSA9IHN0YXJ0ICsgMTsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIga2V5ID0gYWtleXNbaV1cblxuICAgICAgICAgICAgaWYgKG1hdGNoKGN1cnJlbnQsIGtleSwgY29udGV4dCwgbGVmdCwgcmlnaHQpKSB7XG4gICAgICAgICAgICAgICAgLy8gVE9ETzogb25jZSBlbmdpbmVzIGFjdHVhbGx5IG9wdGltaXplIGBjb3B5V2l0aGluYCwgdXNlIHRoYXRcbiAgICAgICAgICAgICAgICAvLyBpbnN0ZWFkLiBJdCdsbCBiZSBtdWNoIGZhc3RlciB0aGFuIHRoaXMgbG9vcC5cbiAgICAgICAgICAgICAgICB3aGlsZSAoaSA+IHN0YXJ0KSBha2V5c1tpXSA9IGFrZXlzWy0taV1cbiAgICAgICAgICAgICAgICBha2V5c1tpXSA9IGtleVxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtYXRjaFZhbHVlcyhhLCBiLCBha2V5cywgYmtleXMsIGVuZCwgY29udGV4dCwgbGVmdCwgcmlnaHQpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtcGFyYW1zLCBtYXgtbGVuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZW5kOyBpKyspIHtcbiAgICAgICAgICAgIGlmICghbWF0Y2goYS5nZXQoYWtleXNbaV0pLCBiLmdldChia2V5c1tpXSksXG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQsIGxlZnQsIHJpZ2h0KSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG5cbiAgICAvLyBQb3NzaWJseSBleHBlbnNpdmUgb3JkZXItaW5kZXBlbmRlbnQga2V5LXZhbHVlIG1hdGNoLiBGaXJzdCwgdHJ5IHRvIGF2b2lkXG4gICAgLy8gaXQgYnkgY29uc2VydmF0aXZlbHkgYXNzdW1pbmcgZXZlcnl0aGluZyBpcyBpbiBvcmRlciAtIGEgY2hlYXAgTyhuKSBpc1xuICAgIC8vIGFsd2F5cyBuaWNlciB0aGFuIGFuIGV4cGVuc2l2ZSBPKG5eMikuXG4gICAgZnVuY3Rpb24gbWF0Y2hNYXAoYSwgYiwgY29udGV4dCwgbGVmdCwgcmlnaHQpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtcGFyYW1zLCBtYXgtbGVuXG4gICAgICAgIHZhciBlbmQgPSBhLnNpemVcbiAgICAgICAgdmFyIGFrZXlzID0ga2V5TGlzdChhKVxuICAgICAgICB2YXIgYmtleXMgPSBrZXlMaXN0KGIpXG4gICAgICAgIHZhciBpID0gMFxuXG4gICAgICAgIHdoaWxlIChpICE9PSBlbmQgJiYgbWF0Y2goYWtleXNbaV0sIGJrZXlzW2ldLCBjb250ZXh0LCBsZWZ0LCByaWdodCkpIHtcbiAgICAgICAgICAgIGkrK1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGkgPT09IGVuZCkge1xuICAgICAgICAgICAgcmV0dXJuIG1hdGNoVmFsdWVzKGEsIGIsIGFrZXlzLCBia2V5cywgZW5kLCBjb250ZXh0LCBsZWZ0LCByaWdodClcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIERvbid0IGNvbXBhcmUgdGhlIHNhbWUga2V5IHR3aWNlXG4gICAgICAgIGlmICghbWF0Y2hLZXkoYmtleXNbaV0sIGFrZXlzLCBpLCBlbmQsIGNvbnRleHQsIGxlZnQsIHJpZ2h0KSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiB0aGUgYWJvdmUgZmFpbHMsIHdoaWxlIHdlJ3JlIGF0IGl0LCBsZXQncyBzb3J0IHRoZW0gYXMgd2UgZ28sIHNvXG4gICAgICAgIC8vIHRoZSBrZXkgb3JkZXIgbWF0Y2hlcy5cbiAgICAgICAgd2hpbGUgKCsraSA8IGVuZCkge1xuICAgICAgICAgICAgdmFyIGtleSA9IGJrZXlzW2ldXG5cbiAgICAgICAgICAgIC8vIEFkYXB0IGlmIHRoZSBrZXlzIGFyZSBhbHJlYWR5IGluIG9yZGVyLCB3aGljaCBpcyBmcmVxdWVudGx5IHRoZVxuICAgICAgICAgICAgLy8gY2FzZS5cbiAgICAgICAgICAgIGlmICghbWF0Y2goa2V5LCBha2V5c1tpXSwgY29udGV4dCwgbGVmdCwgcmlnaHQpICYmXG4gICAgICAgICAgICAgICAgICAgICFtYXRjaEtleShrZXksIGFrZXlzLCBpLCBlbmQsIGNvbnRleHQsIGxlZnQsIHJpZ2h0KSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG1hdGNoVmFsdWVzKGEsIGIsIGFrZXlzLCBia2V5cywgZW5kLCBjb250ZXh0LCBsZWZ0LCByaWdodClcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBoYXNBbGxJZGVudGljYWwoYWxpc3QsIGIpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhbGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKCFiLmhhcyhhbGlzdFtpXSkpIHJldHVybiBmYWxzZVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG5cbiAgICAvLyBDb21wYXJlIHRoZSB2YWx1ZXMgc3RydWN0dXJhbGx5LCBhbmQgaW5kZXBlbmRlbnQgb2Ygb3JkZXIuXG4gICAgZnVuY3Rpb24gc2VhcmNoRm9yKGF2YWx1ZSwgb2JqZWN0cywgY29udGV4dCwgbGVmdCwgcmlnaHQpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtcGFyYW1zLCBtYXgtbGVuXG4gICAgICAgIGZvciAodmFyIGogaW4gb2JqZWN0cykge1xuICAgICAgICAgICAgaWYgKGhhc093bi5jYWxsKG9iamVjdHMsIGopKSB7XG4gICAgICAgICAgICAgICAgaWYgKG1hdGNoKGF2YWx1ZSwgb2JqZWN0c1tqXSwgY29udGV4dCwgbGVmdCwgcmlnaHQpKSB7XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBvYmplY3RzW2pdXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaGFzU3RydWN0dXJlKHZhbHVlLCBjb250ZXh0KSB7XG4gICAgICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIgJiYgdmFsdWUgIT09IG51bGwgfHxcbiAgICAgICAgICAgICAgICAhKGNvbnRleHQgJiBTdHJpY3QpICYmIHR5cGVvZiB2YWx1ZSA9PT0gXCJzeW1ib2xcIlxuICAgIH1cblxuICAgIC8vIFRoZSBzZXQgYWxnb3JpdGhtIGlzIHN0cnVjdHVyZWQgYSBsaXR0bGUgZGlmZmVyZW50bHkuIEl0IHRha2VzIG9uZSBvZiB0aGVcbiAgICAvLyBzZXRzIGludG8gYW4gYXJyYXksIGRvZXMgYSBjaGVhcCBpZGVudGl0eSBjaGVjaywgdGhlbiBkb2VzIHRoZSBkZWVwXG4gICAgLy8gY2hlY2suXG4gICAgZnVuY3Rpb24gbWF0Y2hTZXQoYSwgYiwgY29udGV4dCwgbGVmdCwgcmlnaHQpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtcGFyYW1zLCBtYXgtbGVuXG4gICAgICAgIC8vIFRoaXMgaXMgdG8gdHJ5IHRvIGF2b2lkIGFuIGV4cGVuc2l2ZSBzdHJ1Y3R1cmFsIG1hdGNoIG9uIHRoZSBrZXlzLlxuICAgICAgICAvLyBUZXN0IGZvciBpZGVudGl0eSBmaXJzdC5cbiAgICAgICAgdmFyIGFsaXN0ID0ga2V5TGlzdChhKVxuXG4gICAgICAgIGlmIChoYXNBbGxJZGVudGljYWwoYWxpc3QsIGIpKSByZXR1cm4gdHJ1ZVxuXG4gICAgICAgIHZhciBpdGVyID0gYi52YWx1ZXMoKVxuICAgICAgICB2YXIgY291bnQgPSAwXG4gICAgICAgIHZhciBvYmplY3RzXG5cbiAgICAgICAgLy8gR2F0aGVyIGFsbCB0aGUgb2JqZWN0c1xuICAgICAgICBmb3IgKHZhciBuZXh0ID0gaXRlci5uZXh0KCk7ICFuZXh0LmRvbmU7IG5leHQgPSBpdGVyLm5leHQoKSkge1xuICAgICAgICAgICAgdmFyIGJ2YWx1ZSA9IG5leHQudmFsdWVcblxuICAgICAgICAgICAgaWYgKGhhc1N0cnVjdHVyZShidmFsdWUsIGNvbnRleHQpKSB7XG4gICAgICAgICAgICAgICAgLy8gQ3JlYXRlIHRoZSBvYmplY3RzIG1hcCBsYXppbHkuIE5vdGUgdGhhdCB0aGlzIGFsc28gZ3JhYnNcbiAgICAgICAgICAgICAgICAvLyBTeW1ib2xzIHdoZW4gbm90IHN0cmljdGx5IG1hdGNoaW5nLCBzaW5jZSB0aGVpciBkZXNjcmlwdGlvblxuICAgICAgICAgICAgICAgIC8vIGlzIGNvbXBhcmVkLlxuICAgICAgICAgICAgICAgIGlmIChjb3VudCA9PT0gMCkgb2JqZWN0cyA9IE9iamVjdC5jcmVhdGUobnVsbClcbiAgICAgICAgICAgICAgICBvYmplY3RzW2NvdW50KytdID0gYnZhbHVlXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiBldmVyeXRoaW5nIGlzIGEgcHJpbWl0aXZlLCB0aGVuIGFib3J0LlxuICAgICAgICBpZiAoY291bnQgPT09IDApIHJldHVybiBmYWxzZVxuXG4gICAgICAgIC8vIEl0ZXJhdGUgdGhlIG9iamVjdCwgcmVtb3ZpbmcgZWFjaCBvbmUgcmVtYWluaW5nIHdoZW4gbWF0Y2hlZCAoYW5kXG4gICAgICAgIC8vIGFib3J0aW5nIGlmIG5vbmUgY2FuIGJlKS5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgYXZhbHVlID0gYWxpc3RbaV1cblxuICAgICAgICAgICAgaWYgKGhhc1N0cnVjdHVyZShhdmFsdWUsIGNvbnRleHQpICYmXG4gICAgICAgICAgICAgICAgICAgICFzZWFyY2hGb3IoYXZhbHVlLCBvYmplY3RzLCBjb250ZXh0LCBsZWZ0LCByaWdodCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWF0Y2hSZWdFeHAoYSwgYikge1xuICAgICAgICByZXR1cm4gYS5zb3VyY2UgPT09IGIuc291cmNlICYmXG4gICAgICAgICAgICBhLmdsb2JhbCA9PT0gYi5nbG9iYWwgJiZcbiAgICAgICAgICAgIGEuaWdub3JlQ2FzZSA9PT0gYi5pZ25vcmVDYXNlICYmXG4gICAgICAgICAgICBhLm11bHRpbGluZSA9PT0gYi5tdWx0aWxpbmUgJiZcbiAgICAgICAgICAgICghc3VwcG9ydHNVbmljb2RlIHx8IGEudW5pY29kZSA9PT0gYi51bmljb2RlKSAmJlxuICAgICAgICAgICAgKCFzdXBwb3J0c1N0aWNreSB8fCBhLnN0aWNreSA9PT0gYi5zdGlja3kpXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWF0Y2hQcmVwYXJlRGVzY2VuZChhLCBiLCBjb250ZXh0LCBsZWZ0LCByaWdodCkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1wYXJhbXMsIG1heC1sZW5cbiAgICAgICAgLy8gQ2hlY2sgZm9yIGNpcmN1bGFyIHJlZmVyZW5jZXMgYWZ0ZXIgdGhlIGZpcnN0IGxldmVsLCB3aGVyZSBpdCdzXG4gICAgICAgIC8vIHJlZHVuZGFudC4gTm90ZSB0aGF0IHRoZXkgaGF2ZSB0byBwb2ludCB0byB0aGUgc2FtZSBsZXZlbCB0byBhY3R1YWxseVxuICAgICAgICAvLyBiZSBjb25zaWRlcmVkIGRlZXBseSBlcXVhbC5cbiAgICAgICAgaWYgKCEoY29udGV4dCAmIEluaXRpYWwpKSB7XG4gICAgICAgICAgICB2YXIgbGVmdEluZGV4ID0gbGVmdC5pbmRleE9mKGEpXG4gICAgICAgICAgICB2YXIgcmlnaHRJbmRleCA9IHJpZ2h0LmluZGV4T2YoYilcblxuICAgICAgICAgICAgaWYgKGxlZnRJbmRleCAhPT0gcmlnaHRJbmRleCkgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgICBpZiAobGVmdEluZGV4ID49IDApIHJldHVybiB0cnVlXG5cbiAgICAgICAgICAgIGxlZnQucHVzaChhKVxuICAgICAgICAgICAgcmlnaHQucHVzaChiKVxuXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gbWF0Y2hJbm5lcihhLCBiLCBjb250ZXh0LCBsZWZ0LCByaWdodClcblxuICAgICAgICAgICAgbGVmdC5wb3AoKVxuICAgICAgICAgICAgcmlnaHQucG9wKClcblxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdFxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG1hdGNoSW5uZXIoYSwgYiwgY29udGV4dCAmIH5Jbml0aWFsLCBbYV0sIFtiXSlcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1hdGNoU2FtZVByb3RvKGEsIGIsIGNvbnRleHQsIGxlZnQsIHJpZ2h0KSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LXBhcmFtcywgbWF4LWxlblxuICAgICAgICBpZiAoc3ltYm9sc0FyZU9iamVjdHMgJiYgYSBpbnN0YW5jZW9mIFN5bWJvbCkge1xuICAgICAgICAgICAgcmV0dXJuICEoY29udGV4dCAmIFN0cmljdCkgJiYgYS50b1N0cmluZygpID09PSBiLnRvU3RyaW5nKClcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChhIGluc3RhbmNlb2YgUmVnRXhwKSByZXR1cm4gbWF0Y2hSZWdFeHAoYSwgYilcbiAgICAgICAgaWYgKGEgaW5zdGFuY2VvZiBEYXRlKSByZXR1cm4gYS52YWx1ZU9mKCkgPT09IGIudmFsdWVPZigpXG4gICAgICAgIGlmIChhcnJheUJ1ZmZlclN1cHBvcnQgIT09IEFycmF5QnVmZmVyTm9uZSkge1xuICAgICAgICAgICAgaWYgKGEgaW5zdGFuY2VvZiBEYXRhVmlldykge1xuICAgICAgICAgICAgICAgIHJldHVybiBtYXRjaFZpZXcoXG4gICAgICAgICAgICAgICAgICAgIG5ldyBVaW50OEFycmF5KGEuYnVmZmVyLCBhLmJ5dGVPZmZzZXQsIGEuYnl0ZUxlbmd0aCksXG4gICAgICAgICAgICAgICAgICAgIG5ldyBVaW50OEFycmF5KGIuYnVmZmVyLCBiLmJ5dGVPZmZzZXQsIGIuYnl0ZUxlbmd0aCkpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoYSBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1hdGNoVmlldyhuZXcgVWludDhBcnJheShhKSwgbmV3IFVpbnQ4QXJyYXkoYikpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaXNWaWV3KGEpKSByZXR1cm4gbWF0Y2hWaWV3KGEsIGIpXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaXNCdWZmZXIoYSkpIHJldHVybiBtYXRjaFZpZXcoYSwgYilcblxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShhKSkge1xuICAgICAgICAgICAgaWYgKGEubGVuZ3RoICE9PSBiLmxlbmd0aCkgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgICBpZiAoYS5sZW5ndGggPT09IDApIHJldHVybiB0cnVlXG4gICAgICAgIH0gZWxzZSBpZiAoc3VwcG9ydHNNYXAgJiYgYSBpbnN0YW5jZW9mIE1hcCkge1xuICAgICAgICAgICAgaWYgKGEuc2l6ZSAhPT0gYi5zaXplKSByZXR1cm4gZmFsc2VcbiAgICAgICAgICAgIGlmIChhLnNpemUgPT09IDApIHJldHVybiB0cnVlXG4gICAgICAgIH0gZWxzZSBpZiAoc3VwcG9ydHNTZXQgJiYgYSBpbnN0YW5jZW9mIFNldCkge1xuICAgICAgICAgICAgaWYgKGEuc2l6ZSAhPT0gYi5zaXplKSByZXR1cm4gZmFsc2VcbiAgICAgICAgICAgIGlmIChhLnNpemUgPT09IDApIHJldHVybiB0cnVlXG4gICAgICAgIH0gZWxzZSBpZiAob2JqZWN0VG9TdHJpbmcuY2FsbChhKSA9PT0gXCJbb2JqZWN0IEFyZ3VtZW50c11cIikge1xuICAgICAgICAgICAgaWYgKG9iamVjdFRvU3RyaW5nLmNhbGwoYikgIT09IFwiW29iamVjdCBBcmd1bWVudHNdXCIpIHJldHVybiBmYWxzZVxuICAgICAgICAgICAgaWYgKGEubGVuZ3RoICE9PSBiLmxlbmd0aCkgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgICBpZiAoYS5sZW5ndGggPT09IDApIHJldHVybiB0cnVlXG4gICAgICAgIH0gZWxzZSBpZiAob2JqZWN0VG9TdHJpbmcuY2FsbChiKSA9PT0gXCJbb2JqZWN0IEFyZ3VtZW50c11cIikge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbWF0Y2hQcmVwYXJlRGVzY2VuZChhLCBiLCBjb250ZXh0LCBsZWZ0LCByaWdodClcbiAgICB9XG5cbiAgICAvLyBNb3N0IHNwZWNpYWwgY2FzZXMgcmVxdWlyZSBib3RoIHR5cGVzIHRvIG1hdGNoLCBhbmQgaWYgb25seSBvbmUgb2YgdGhlbVxuICAgIC8vIGFyZSwgdGhlIG9iamVjdHMgdGhlbXNlbHZlcyBkb24ndCBtYXRjaC5cbiAgICBmdW5jdGlvbiBtYXRjaERpZmZlcmVudFByb3RvKGEsIGIsIGNvbnRleHQsIGxlZnQsIHJpZ2h0KSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LXBhcmFtcywgbWF4LWxlblxuICAgICAgICBpZiAoc3ltYm9sc0FyZU9iamVjdHMpIHtcbiAgICAgICAgICAgIGlmIChhIGluc3RhbmNlb2YgU3ltYm9sIHx8IGIgaW5zdGFuY2VvZiBTeW1ib2wpIHJldHVybiBmYWxzZVxuICAgICAgICB9XG4gICAgICAgIGlmIChjb250ZXh0ICYgU3RyaWN0KSByZXR1cm4gZmFsc2VcbiAgICAgICAgaWYgKGFycmF5QnVmZmVyU3VwcG9ydCAhPT0gQXJyYXlCdWZmZXJOb25lKSB7XG4gICAgICAgICAgICBpZiAoYSBpbnN0YW5jZW9mIEFycmF5QnVmZmVyIHx8IGIgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlzVmlldyhhKSB8fCBpc1ZpZXcoYikpIHJldHVybiBmYWxzZVxuICAgICAgICB9XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGEpIHx8IEFycmF5LmlzQXJyYXkoYikpIHJldHVybiBmYWxzZVxuICAgICAgICBpZiAoc3VwcG9ydHNNYXAgJiYgKGEgaW5zdGFuY2VvZiBNYXAgfHwgYiBpbnN0YW5jZW9mIE1hcCkpIHJldHVybiBmYWxzZVxuICAgICAgICBpZiAoc3VwcG9ydHNTZXQgJiYgKGEgaW5zdGFuY2VvZiBTZXQgfHwgYiBpbnN0YW5jZW9mIFNldCkpIHJldHVybiBmYWxzZVxuICAgICAgICBpZiAob2JqZWN0VG9TdHJpbmcuY2FsbChhKSA9PT0gXCJbb2JqZWN0IEFyZ3VtZW50c11cIikge1xuICAgICAgICAgICAgaWYgKG9iamVjdFRvU3RyaW5nLmNhbGwoYikgIT09IFwiW29iamVjdCBBcmd1bWVudHNdXCIpIHJldHVybiBmYWxzZVxuICAgICAgICAgICAgaWYgKGEubGVuZ3RoICE9PSBiLmxlbmd0aCkgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgICBpZiAoYS5sZW5ndGggPT09IDApIHJldHVybiB0cnVlXG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iamVjdFRvU3RyaW5nLmNhbGwoYikgPT09IFwiW29iamVjdCBBcmd1bWVudHNdXCIpIHJldHVybiBmYWxzZVxuICAgICAgICByZXR1cm4gbWF0Y2hQcmVwYXJlRGVzY2VuZChhLCBiLCBjb250ZXh0LCBsZWZ0LCByaWdodClcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtYXRjaChhLCBiLCBjb250ZXh0LCBsZWZ0LCByaWdodCkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1wYXJhbXMsIG1heC1sZW5cbiAgICAgICAgaWYgKGEgPT09IGIpIHJldHVybiB0cnVlXG4gICAgICAgIC8vIE5hTnMgYXJlIGVxdWFsXG4gICAgICAgIGlmIChhICE9PSBhKSByZXR1cm4gYiAhPT0gYiAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXNlbGYtY29tcGFyZVxuICAgICAgICBpZiAoYSA9PT0gbnVsbCB8fCBiID09PSBudWxsKSByZXR1cm4gZmFsc2VcbiAgICAgICAgaWYgKHR5cGVvZiBhID09PSBcInN5bWJvbFwiICYmIHR5cGVvZiBiID09PSBcInN5bWJvbFwiKSB7XG4gICAgICAgICAgICByZXR1cm4gIShjb250ZXh0ICYgU3RyaWN0KSAmJiBhLnRvU3RyaW5nKCkgPT09IGIudG9TdHJpbmcoKVxuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgYSAhPT0gXCJvYmplY3RcIiB8fCB0eXBlb2YgYiAhPT0gXCJvYmplY3RcIikgcmV0dXJuIGZhbHNlXG5cbiAgICAgICAgLy8gVXN1YWxseSwgYm90aCBvYmplY3RzIGhhdmUgaWRlbnRpY2FsIHByb3RvdHlwZXMsIGFuZCB0aGF0IGFsbG93cyBmb3JcbiAgICAgICAgLy8gaGFsZiB0aGUgdHlwZSBjaGVja2luZy5cbiAgICAgICAgaWYgKE9iamVjdC5nZXRQcm90b3R5cGVPZihhKSA9PT0gT2JqZWN0LmdldFByb3RvdHlwZU9mKGIpKSB7XG4gICAgICAgICAgICByZXR1cm4gbWF0Y2hTYW1lUHJvdG8oYSwgYiwgY29udGV4dCB8IFNhbWVQcm90bywgbGVmdCwgcmlnaHQpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbWF0Y2hEaWZmZXJlbnRQcm90byhhLCBiLCBjb250ZXh0LCBsZWZ0LCByaWdodClcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1hdGNoQXJyYXlMaWtlKGEsIGIsIGNvbnRleHQsIGxlZnQsIHJpZ2h0KSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LXBhcmFtcywgbWF4LWxlblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmICghbWF0Y2goYVtpXSwgYltpXSwgY29udGV4dCwgbGVmdCwgcmlnaHQpKSByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuXG4gICAgLy8gUGhhbnRvbUpTIGFuZCBTbGltZXJKUyBib3RoIGhhdmUgbXlzdGVyaW91cyBpc3N1ZXMgd2hlcmUgYEVycm9yYCBpc1xuICAgIC8vIHNvbWV0aW1lcyBlcnJvbmVvdXNseSBvZiBhIGRpZmZlcmVudCBgd2luZG93YCwgYW5kIGl0IHNob3dzIHVwIGluIHRoZVxuICAgIC8vIHRlc3RzLiBUaGlzIG1lYW5zIEkgaGF2ZSB0byB1c2UgYSBtdWNoIHNsb3dlciBhbGdvcml0aG0gdG8gZGV0ZWN0IEVycm9ycy5cbiAgICAvL1xuICAgIC8vIFBoYW50b21KUzogaHR0cHM6Ly9naXRodWIuY29tL3BldGthYW50b25vdi9ibHVlYmlyZC9pc3N1ZXMvMTE0NlxuICAgIC8vIFNsaW1lckpTOiBodHRwczovL2dpdGh1Yi5jb20vbGF1cmVudGovc2xpbWVyanMvaXNzdWVzLzQwMFxuICAgIC8vXG4gICAgLy8gKFllcywgdGhlIFBoYW50b21KUyBidWcgaXMgZGV0YWlsZWQgaW4gdGhlIEJsdWViaXJkIGlzc3VlIHRyYWNrZXIuKVxuICAgIHZhciBjaGVja0Nyb3NzT3JpZ2luID0gKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKGdsb2JhbC53aW5kb3cgPT0gbnVsbCB8fCBnbG9iYWwud2luZG93Lm5hdmlnYXRvciA9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gL3NsaW1lcmpzfHBoYW50b21qcy9pLnRlc3QoZ2xvYmFsLndpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50KVxuICAgIH0pKClcblxuICAgIHZhciBlcnJvclN0cmluZ1R5cGVzID0ge1xuICAgICAgICBcIltvYmplY3QgRXJyb3JdXCI6IHRydWUsXG4gICAgICAgIFwiW29iamVjdCBFdmFsRXJyb3JdXCI6IHRydWUsXG4gICAgICAgIFwiW29iamVjdCBSYW5nZUVycm9yXVwiOiB0cnVlLFxuICAgICAgICBcIltvYmplY3QgUmVmZXJlbmNlRXJyb3JdXCI6IHRydWUsXG4gICAgICAgIFwiW29iamVjdCBTeW50YXhFcnJvcl1cIjogdHJ1ZSxcbiAgICAgICAgXCJbb2JqZWN0IFR5cGVFcnJvcl1cIjogdHJ1ZSxcbiAgICAgICAgXCJbb2JqZWN0IFVSSUVycm9yXVwiOiB0cnVlLFxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzUHJveGllZEVycm9yKG9iamVjdCkge1xuICAgICAgICB3aGlsZSAob2JqZWN0ICE9IG51bGwpIHtcbiAgICAgICAgICAgIGlmIChlcnJvclN0cmluZ1R5cGVzW29iamVjdFRvU3RyaW5nLmNhbGwob2JqZWN0KV0pIHJldHVybiB0cnVlXG4gICAgICAgICAgICBvYmplY3QgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2Yob2JqZWN0KVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWF0Y2hJbm5lcihhLCBiLCBjb250ZXh0LCBsZWZ0LCByaWdodCkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1zdGF0ZW1lbnRzLCBtYXgtcGFyYW1zLCBtYXgtbGVuXG4gICAgICAgIHZhciBha2V5cywgYmtleXNcbiAgICAgICAgdmFyIGlzVW5wcm94aWVkRXJyb3IgPSBmYWxzZVxuXG4gICAgICAgIGlmIChjb250ZXh0ICYgU2FtZVByb3RvKSB7XG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShhKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBtYXRjaEFycmF5TGlrZShhLCBiLCBjb250ZXh0LCBsZWZ0LCByaWdodClcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHN1cHBvcnRzTWFwICYmIGEgaW5zdGFuY2VvZiBNYXApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbWF0Y2hNYXAoYSwgYiwgY29udGV4dCwgbGVmdCwgcmlnaHQpXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzdXBwb3J0c1NldCAmJiBhIGluc3RhbmNlb2YgU2V0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1hdGNoU2V0KGEsIGIsIGNvbnRleHQsIGxlZnQsIHJpZ2h0KVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAob2JqZWN0VG9TdHJpbmcuY2FsbChhKSA9PT0gXCJbb2JqZWN0IEFyZ3VtZW50c11cIikge1xuICAgICAgICAgICAgICAgIHJldHVybiBtYXRjaEFycmF5TGlrZShhLCBiLCBjb250ZXh0LCBsZWZ0LCByaWdodClcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHJlcXVpcmVzUHJveHkgJiZcbiAgICAgICAgICAgICAgICAgICAgKGNoZWNrQ3Jvc3NPcmlnaW4gPyBpc1Byb3hpZWRFcnJvcihhKVxuICAgICAgICAgICAgICAgICAgICAgICAgOiBhIGluc3RhbmNlb2YgRXJyb3IpKSB7XG4gICAgICAgICAgICAgICAgYWtleXMgPSBnZXRLZXlzU3RyaXBwZWQoYSlcbiAgICAgICAgICAgICAgICBia2V5cyA9IGdldEtleXNTdHJpcHBlZChiKVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBha2V5cyA9IE9iamVjdC5rZXlzKGEpXG4gICAgICAgICAgICAgICAgYmtleXMgPSBPYmplY3Qua2V5cyhiKVxuICAgICAgICAgICAgICAgIGlzVW5wcm94aWVkRXJyb3IgPSBhIGluc3RhbmNlb2YgRXJyb3JcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChvYmplY3RUb1N0cmluZy5jYWxsKGEpID09PSBcIltvYmplY3QgQXJndW1lbnRzXVwiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1hdGNoQXJyYXlMaWtlKGEsIGIsIGNvbnRleHQsIGxlZnQsIHJpZ2h0KVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBJZiB3ZSByZXF1aXJlIGEgcHJveHksIGJlIHBlcm1pc3NpdmUgYW5kIGNoZWNrIHRoZSBgdG9TdHJpbmdgXG4gICAgICAgICAgICAvLyB0eXBlLiBUaGlzIGlzIHNvIGl0IHdvcmtzIGNyb3NzLW9yaWdpbiBpbiBQaGFudG9tSlMgaW5cbiAgICAgICAgICAgIC8vIHBhcnRpY3VsYXIuXG4gICAgICAgICAgICBpZiAoY2hlY2tDcm9zc09yaWdpbiA/IGlzUHJveGllZEVycm9yKGEpIDogYSBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBha2V5cyA9IE9iamVjdC5rZXlzKGEpXG4gICAgICAgICAgICBia2V5cyA9IE9iamVjdC5rZXlzKGIpXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgY291bnQgPSBha2V5cy5sZW5ndGhcblxuICAgICAgICBpZiAoY291bnQgIT09IGJrZXlzLmxlbmd0aCkgcmV0dXJuIGZhbHNlXG5cbiAgICAgICAgLy8gU2hvcnRjdXQgaWYgdGhlcmUncyBub3RoaW5nIHRvIG1hdGNoXG4gICAgICAgIGlmIChjb3VudCA9PT0gMCkgcmV0dXJuIHRydWVcblxuICAgICAgICB2YXIgaVxuXG4gICAgICAgIGlmIChpc1VucHJveGllZEVycm9yKSB7XG4gICAgICAgICAgICAvLyBTaG9ydGN1dCBpZiB0aGUgcHJvcGVydGllcyBhcmUgZGlmZmVyZW50LlxuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoYWtleXNbaV0gIT09IFwic3RhY2tcIikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWhhc093bi5jYWxsKGIsIGFrZXlzW2ldKSkgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBWZXJpZnkgdGhhdCBhbGwgdGhlIGFrZXlzJyB2YWx1ZXMgbWF0Y2hlZC5cbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKGFrZXlzW2ldICE9PSBcInN0YWNrXCIgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICFtYXRjaChhW2FrZXlzW2ldXSwgYltha2V5c1tpXV0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dCwgbGVmdCwgcmlnaHQpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIFNob3J0Y3V0IGlmIHRoZSBwcm9wZXJ0aWVzIGFyZSBkaWZmZXJlbnQuXG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmICghaGFzT3duLmNhbGwoYiwgYWtleXNbaV0pKSByZXR1cm4gZmFsc2VcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gVmVyaWZ5IHRoYXQgYWxsIHRoZSBha2V5cycgdmFsdWVzIG1hdGNoZWQuXG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmICghbWF0Y2goYVtha2V5c1tpXV0sIGJbYWtleXNbaV1dLCBjb250ZXh0LCBsZWZ0LCByaWdodCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG59KTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBzZW1pXG4iLCIvLyBTZWU6IGh0dHA6Ly9jb2RlLmdvb2dsZS5jb20vcC9nb29nbGUtZGlmZi1tYXRjaC1wYXRjaC93aWtpL0FQSVxuZXhwb3J0IGZ1bmN0aW9uIGNvbnZlcnRDaGFuZ2VzVG9ETVAoY2hhbmdlcykge1xuICBsZXQgcmV0ID0gW10sXG4gICAgICBjaGFuZ2UsXG4gICAgICBvcGVyYXRpb247XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgY2hhbmdlcy5sZW5ndGg7IGkrKykge1xuICAgIGNoYW5nZSA9IGNoYW5nZXNbaV07XG4gICAgaWYgKGNoYW5nZS5hZGRlZCkge1xuICAgICAgb3BlcmF0aW9uID0gMTtcbiAgICB9IGVsc2UgaWYgKGNoYW5nZS5yZW1vdmVkKSB7XG4gICAgICBvcGVyYXRpb24gPSAtMTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3BlcmF0aW9uID0gMDtcbiAgICB9XG5cbiAgICByZXQucHVzaChbb3BlcmF0aW9uLCBjaGFuZ2UudmFsdWVdKTtcbiAgfVxuICByZXR1cm4gcmV0O1xufVxuIiwiZXhwb3J0IGZ1bmN0aW9uIGNvbnZlcnRDaGFuZ2VzVG9YTUwoY2hhbmdlcykge1xuICBsZXQgcmV0ID0gW107XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgY2hhbmdlcy5sZW5ndGg7IGkrKykge1xuICAgIGxldCBjaGFuZ2UgPSBjaGFuZ2VzW2ldO1xuICAgIGlmIChjaGFuZ2UuYWRkZWQpIHtcbiAgICAgIHJldC5wdXNoKCc8aW5zPicpO1xuICAgIH0gZWxzZSBpZiAoY2hhbmdlLnJlbW92ZWQpIHtcbiAgICAgIHJldC5wdXNoKCc8ZGVsPicpO1xuICAgIH1cblxuICAgIHJldC5wdXNoKGVzY2FwZUhUTUwoY2hhbmdlLnZhbHVlKSk7XG5cbiAgICBpZiAoY2hhbmdlLmFkZGVkKSB7XG4gICAgICByZXQucHVzaCgnPC9pbnM+Jyk7XG4gICAgfSBlbHNlIGlmIChjaGFuZ2UucmVtb3ZlZCkge1xuICAgICAgcmV0LnB1c2goJzwvZGVsPicpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmV0LmpvaW4oJycpO1xufVxuXG5mdW5jdGlvbiBlc2NhcGVIVE1MKHMpIHtcbiAgbGV0IG4gPSBzO1xuICBuID0gbi5yZXBsYWNlKC8mL2csICcmYW1wOycpO1xuICBuID0gbi5yZXBsYWNlKC88L2csICcmbHQ7Jyk7XG4gIG4gPSBuLnJlcGxhY2UoLz4vZywgJyZndDsnKTtcbiAgbiA9IG4ucmVwbGFjZSgvXCIvZywgJyZxdW90OycpO1xuXG4gIHJldHVybiBuO1xufVxuIiwiaW1wb3J0IERpZmYgZnJvbSAnLi9iYXNlJztcblxuZXhwb3J0IGNvbnN0IGFycmF5RGlmZiA9IG5ldyBEaWZmKCk7XG5hcnJheURpZmYudG9rZW5pemUgPSBhcnJheURpZmYuam9pbiA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZS5zbGljZSgpO1xufTtcblxuZXhwb3J0IGZ1bmN0aW9uIGRpZmZBcnJheXMob2xkQXJyLCBuZXdBcnIsIGNhbGxiYWNrKSB7IHJldHVybiBhcnJheURpZmYuZGlmZihvbGRBcnIsIG5ld0FyciwgY2FsbGJhY2spOyB9XG4iLCJleHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBEaWZmKCkge31cblxuRGlmZi5wcm90b3R5cGUgPSB7XG4gIGRpZmYob2xkU3RyaW5nLCBuZXdTdHJpbmcsIG9wdGlvbnMgPSB7fSkge1xuICAgIGxldCBjYWxsYmFjayA9IG9wdGlvbnMuY2FsbGJhY2s7XG4gICAgaWYgKHR5cGVvZiBvcHRpb25zID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBjYWxsYmFjayA9IG9wdGlvbnM7XG4gICAgICBvcHRpb25zID0ge307XG4gICAgfVxuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG5cbiAgICBsZXQgc2VsZiA9IHRoaXM7XG5cbiAgICBmdW5jdGlvbiBkb25lKHZhbHVlKSB7XG4gICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgY2FsbGJhY2sodW5kZWZpbmVkLCB2YWx1ZSk7IH0sIDApO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBBbGxvdyBzdWJjbGFzc2VzIHRvIG1hc3NhZ2UgdGhlIGlucHV0IHByaW9yIHRvIHJ1bm5pbmdcbiAgICBvbGRTdHJpbmcgPSB0aGlzLmNhc3RJbnB1dChvbGRTdHJpbmcpO1xuICAgIG5ld1N0cmluZyA9IHRoaXMuY2FzdElucHV0KG5ld1N0cmluZyk7XG5cbiAgICBvbGRTdHJpbmcgPSB0aGlzLnJlbW92ZUVtcHR5KHRoaXMudG9rZW5pemUob2xkU3RyaW5nKSk7XG4gICAgbmV3U3RyaW5nID0gdGhpcy5yZW1vdmVFbXB0eSh0aGlzLnRva2VuaXplKG5ld1N0cmluZykpO1xuXG4gICAgbGV0IG5ld0xlbiA9IG5ld1N0cmluZy5sZW5ndGgsIG9sZExlbiA9IG9sZFN0cmluZy5sZW5ndGg7XG4gICAgbGV0IGVkaXRMZW5ndGggPSAxO1xuICAgIGxldCBtYXhFZGl0TGVuZ3RoID0gbmV3TGVuICsgb2xkTGVuO1xuICAgIGxldCBiZXN0UGF0aCA9IFt7IG5ld1BvczogLTEsIGNvbXBvbmVudHM6IFtdIH1dO1xuXG4gICAgLy8gU2VlZCBlZGl0TGVuZ3RoID0gMCwgaS5lLiB0aGUgY29udGVudCBzdGFydHMgd2l0aCB0aGUgc2FtZSB2YWx1ZXNcbiAgICBsZXQgb2xkUG9zID0gdGhpcy5leHRyYWN0Q29tbW9uKGJlc3RQYXRoWzBdLCBuZXdTdHJpbmcsIG9sZFN0cmluZywgMCk7XG4gICAgaWYgKGJlc3RQYXRoWzBdLm5ld1BvcyArIDEgPj0gbmV3TGVuICYmIG9sZFBvcyArIDEgPj0gb2xkTGVuKSB7XG4gICAgICAvLyBJZGVudGl0eSBwZXIgdGhlIGVxdWFsaXR5IGFuZCB0b2tlbml6ZXJcbiAgICAgIHJldHVybiBkb25lKFt7dmFsdWU6IHRoaXMuam9pbihuZXdTdHJpbmcpLCBjb3VudDogbmV3U3RyaW5nLmxlbmd0aH1dKTtcbiAgICB9XG5cbiAgICAvLyBNYWluIHdvcmtlciBtZXRob2QuIGNoZWNrcyBhbGwgcGVybXV0YXRpb25zIG9mIGEgZ2l2ZW4gZWRpdCBsZW5ndGggZm9yIGFjY2VwdGFuY2UuXG4gICAgZnVuY3Rpb24gZXhlY0VkaXRMZW5ndGgoKSB7XG4gICAgICBmb3IgKGxldCBkaWFnb25hbFBhdGggPSAtMSAqIGVkaXRMZW5ndGg7IGRpYWdvbmFsUGF0aCA8PSBlZGl0TGVuZ3RoOyBkaWFnb25hbFBhdGggKz0gMikge1xuICAgICAgICBsZXQgYmFzZVBhdGg7XG4gICAgICAgIGxldCBhZGRQYXRoID0gYmVzdFBhdGhbZGlhZ29uYWxQYXRoIC0gMV0sXG4gICAgICAgICAgICByZW1vdmVQYXRoID0gYmVzdFBhdGhbZGlhZ29uYWxQYXRoICsgMV0sXG4gICAgICAgICAgICBvbGRQb3MgPSAocmVtb3ZlUGF0aCA/IHJlbW92ZVBhdGgubmV3UG9zIDogMCkgLSBkaWFnb25hbFBhdGg7XG4gICAgICAgIGlmIChhZGRQYXRoKSB7XG4gICAgICAgICAgLy8gTm8gb25lIGVsc2UgaXMgZ29pbmcgdG8gYXR0ZW1wdCB0byB1c2UgdGhpcyB2YWx1ZSwgY2xlYXIgaXRcbiAgICAgICAgICBiZXN0UGF0aFtkaWFnb25hbFBhdGggLSAxXSA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBjYW5BZGQgPSBhZGRQYXRoICYmIGFkZFBhdGgubmV3UG9zICsgMSA8IG5ld0xlbixcbiAgICAgICAgICAgIGNhblJlbW92ZSA9IHJlbW92ZVBhdGggJiYgMCA8PSBvbGRQb3MgJiYgb2xkUG9zIDwgb2xkTGVuO1xuICAgICAgICBpZiAoIWNhbkFkZCAmJiAhY2FuUmVtb3ZlKSB7XG4gICAgICAgICAgLy8gSWYgdGhpcyBwYXRoIGlzIGEgdGVybWluYWwgdGhlbiBwcnVuZVxuICAgICAgICAgIGJlc3RQYXRoW2RpYWdvbmFsUGF0aF0gPSB1bmRlZmluZWQ7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBTZWxlY3QgdGhlIGRpYWdvbmFsIHRoYXQgd2Ugd2FudCB0byBicmFuY2ggZnJvbS4gV2Ugc2VsZWN0IHRoZSBwcmlvclxuICAgICAgICAvLyBwYXRoIHdob3NlIHBvc2l0aW9uIGluIHRoZSBuZXcgc3RyaW5nIGlzIHRoZSBmYXJ0aGVzdCBmcm9tIHRoZSBvcmlnaW5cbiAgICAgICAgLy8gYW5kIGRvZXMgbm90IHBhc3MgdGhlIGJvdW5kcyBvZiB0aGUgZGlmZiBncmFwaFxuICAgICAgICBpZiAoIWNhbkFkZCB8fCAoY2FuUmVtb3ZlICYmIGFkZFBhdGgubmV3UG9zIDwgcmVtb3ZlUGF0aC5uZXdQb3MpKSB7XG4gICAgICAgICAgYmFzZVBhdGggPSBjbG9uZVBhdGgocmVtb3ZlUGF0aCk7XG4gICAgICAgICAgc2VsZi5wdXNoQ29tcG9uZW50KGJhc2VQYXRoLmNvbXBvbmVudHMsIHVuZGVmaW5lZCwgdHJ1ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYmFzZVBhdGggPSBhZGRQYXRoOyAgIC8vIE5vIG5lZWQgdG8gY2xvbmUsIHdlJ3ZlIHB1bGxlZCBpdCBmcm9tIHRoZSBsaXN0XG4gICAgICAgICAgYmFzZVBhdGgubmV3UG9zKys7XG4gICAgICAgICAgc2VsZi5wdXNoQ29tcG9uZW50KGJhc2VQYXRoLmNvbXBvbmVudHMsIHRydWUsIHVuZGVmaW5lZCk7XG4gICAgICAgIH1cblxuICAgICAgICBvbGRQb3MgPSBzZWxmLmV4dHJhY3RDb21tb24oYmFzZVBhdGgsIG5ld1N0cmluZywgb2xkU3RyaW5nLCBkaWFnb25hbFBhdGgpO1xuXG4gICAgICAgIC8vIElmIHdlIGhhdmUgaGl0IHRoZSBlbmQgb2YgYm90aCBzdHJpbmdzLCB0aGVuIHdlIGFyZSBkb25lXG4gICAgICAgIGlmIChiYXNlUGF0aC5uZXdQb3MgKyAxID49IG5ld0xlbiAmJiBvbGRQb3MgKyAxID49IG9sZExlbikge1xuICAgICAgICAgIHJldHVybiBkb25lKGJ1aWxkVmFsdWVzKHNlbGYsIGJhc2VQYXRoLmNvbXBvbmVudHMsIG5ld1N0cmluZywgb2xkU3RyaW5nLCBzZWxmLnVzZUxvbmdlc3RUb2tlbikpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIE90aGVyd2lzZSB0cmFjayB0aGlzIHBhdGggYXMgYSBwb3RlbnRpYWwgY2FuZGlkYXRlIGFuZCBjb250aW51ZS5cbiAgICAgICAgICBiZXN0UGF0aFtkaWFnb25hbFBhdGhdID0gYmFzZVBhdGg7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZWRpdExlbmd0aCsrO1xuICAgIH1cblxuICAgIC8vIFBlcmZvcm1zIHRoZSBsZW5ndGggb2YgZWRpdCBpdGVyYXRpb24uIElzIGEgYml0IGZ1Z2x5IGFzIHRoaXMgaGFzIHRvIHN1cHBvcnQgdGhlXG4gICAgLy8gc3luYyBhbmQgYXN5bmMgbW9kZSB3aGljaCBpcyBuZXZlciBmdW4uIExvb3BzIG92ZXIgZXhlY0VkaXRMZW5ndGggdW50aWwgYSB2YWx1ZVxuICAgIC8vIGlzIHByb2R1Y2VkLlxuICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgKGZ1bmN0aW9uIGV4ZWMoKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgLy8gVGhpcyBzaG91bGQgbm90IGhhcHBlbiwgYnV0IHdlIHdhbnQgdG8gYmUgc2FmZS5cbiAgICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgICAgIGlmIChlZGl0TGVuZ3RoID4gbWF4RWRpdExlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCFleGVjRWRpdExlbmd0aCgpKSB7XG4gICAgICAgICAgICBleGVjKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9LCAwKTtcbiAgICAgIH0oKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHdoaWxlIChlZGl0TGVuZ3RoIDw9IG1heEVkaXRMZW5ndGgpIHtcbiAgICAgICAgbGV0IHJldCA9IGV4ZWNFZGl0TGVuZ3RoKCk7XG4gICAgICAgIGlmIChyZXQpIHtcbiAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIHB1c2hDb21wb25lbnQoY29tcG9uZW50cywgYWRkZWQsIHJlbW92ZWQpIHtcbiAgICBsZXQgbGFzdCA9IGNvbXBvbmVudHNbY29tcG9uZW50cy5sZW5ndGggLSAxXTtcbiAgICBpZiAobGFzdCAmJiBsYXN0LmFkZGVkID09PSBhZGRlZCAmJiBsYXN0LnJlbW92ZWQgPT09IHJlbW92ZWQpIHtcbiAgICAgIC8vIFdlIG5lZWQgdG8gY2xvbmUgaGVyZSBhcyB0aGUgY29tcG9uZW50IGNsb25lIG9wZXJhdGlvbiBpcyBqdXN0XG4gICAgICAvLyBhcyBzaGFsbG93IGFycmF5IGNsb25lXG4gICAgICBjb21wb25lbnRzW2NvbXBvbmVudHMubGVuZ3RoIC0gMV0gPSB7Y291bnQ6IGxhc3QuY291bnQgKyAxLCBhZGRlZDogYWRkZWQsIHJlbW92ZWQ6IHJlbW92ZWQgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29tcG9uZW50cy5wdXNoKHtjb3VudDogMSwgYWRkZWQ6IGFkZGVkLCByZW1vdmVkOiByZW1vdmVkIH0pO1xuICAgIH1cbiAgfSxcbiAgZXh0cmFjdENvbW1vbihiYXNlUGF0aCwgbmV3U3RyaW5nLCBvbGRTdHJpbmcsIGRpYWdvbmFsUGF0aCkge1xuICAgIGxldCBuZXdMZW4gPSBuZXdTdHJpbmcubGVuZ3RoLFxuICAgICAgICBvbGRMZW4gPSBvbGRTdHJpbmcubGVuZ3RoLFxuICAgICAgICBuZXdQb3MgPSBiYXNlUGF0aC5uZXdQb3MsXG4gICAgICAgIG9sZFBvcyA9IG5ld1BvcyAtIGRpYWdvbmFsUGF0aCxcblxuICAgICAgICBjb21tb25Db3VudCA9IDA7XG4gICAgd2hpbGUgKG5ld1BvcyArIDEgPCBuZXdMZW4gJiYgb2xkUG9zICsgMSA8IG9sZExlbiAmJiB0aGlzLmVxdWFscyhuZXdTdHJpbmdbbmV3UG9zICsgMV0sIG9sZFN0cmluZ1tvbGRQb3MgKyAxXSkpIHtcbiAgICAgIG5ld1BvcysrO1xuICAgICAgb2xkUG9zKys7XG4gICAgICBjb21tb25Db3VudCsrO1xuICAgIH1cblxuICAgIGlmIChjb21tb25Db3VudCkge1xuICAgICAgYmFzZVBhdGguY29tcG9uZW50cy5wdXNoKHtjb3VudDogY29tbW9uQ291bnR9KTtcbiAgICB9XG5cbiAgICBiYXNlUGF0aC5uZXdQb3MgPSBuZXdQb3M7XG4gICAgcmV0dXJuIG9sZFBvcztcbiAgfSxcblxuICBlcXVhbHMobGVmdCwgcmlnaHQpIHtcbiAgICByZXR1cm4gbGVmdCA9PT0gcmlnaHQ7XG4gIH0sXG4gIHJlbW92ZUVtcHR5KGFycmF5KSB7XG4gICAgbGV0IHJldCA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXJyYXkubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChhcnJheVtpXSkge1xuICAgICAgICByZXQucHVzaChhcnJheVtpXSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG4gIH0sXG4gIGNhc3RJbnB1dCh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfSxcbiAgdG9rZW5pemUodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUuc3BsaXQoJycpO1xuICB9LFxuICBqb2luKGNoYXJzKSB7XG4gICAgcmV0dXJuIGNoYXJzLmpvaW4oJycpO1xuICB9XG59O1xuXG5mdW5jdGlvbiBidWlsZFZhbHVlcyhkaWZmLCBjb21wb25lbnRzLCBuZXdTdHJpbmcsIG9sZFN0cmluZywgdXNlTG9uZ2VzdFRva2VuKSB7XG4gIGxldCBjb21wb25lbnRQb3MgPSAwLFxuICAgICAgY29tcG9uZW50TGVuID0gY29tcG9uZW50cy5sZW5ndGgsXG4gICAgICBuZXdQb3MgPSAwLFxuICAgICAgb2xkUG9zID0gMDtcblxuICBmb3IgKDsgY29tcG9uZW50UG9zIDwgY29tcG9uZW50TGVuOyBjb21wb25lbnRQb3MrKykge1xuICAgIGxldCBjb21wb25lbnQgPSBjb21wb25lbnRzW2NvbXBvbmVudFBvc107XG4gICAgaWYgKCFjb21wb25lbnQucmVtb3ZlZCkge1xuICAgICAgaWYgKCFjb21wb25lbnQuYWRkZWQgJiYgdXNlTG9uZ2VzdFRva2VuKSB7XG4gICAgICAgIGxldCB2YWx1ZSA9IG5ld1N0cmluZy5zbGljZShuZXdQb3MsIG5ld1BvcyArIGNvbXBvbmVudC5jb3VudCk7XG4gICAgICAgIHZhbHVlID0gdmFsdWUubWFwKGZ1bmN0aW9uKHZhbHVlLCBpKSB7XG4gICAgICAgICAgbGV0IG9sZFZhbHVlID0gb2xkU3RyaW5nW29sZFBvcyArIGldO1xuICAgICAgICAgIHJldHVybiBvbGRWYWx1ZS5sZW5ndGggPiB2YWx1ZS5sZW5ndGggPyBvbGRWYWx1ZSA6IHZhbHVlO1xuICAgICAgICB9KTtcblxuICAgICAgICBjb21wb25lbnQudmFsdWUgPSBkaWZmLmpvaW4odmFsdWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29tcG9uZW50LnZhbHVlID0gZGlmZi5qb2luKG5ld1N0cmluZy5zbGljZShuZXdQb3MsIG5ld1BvcyArIGNvbXBvbmVudC5jb3VudCkpO1xuICAgICAgfVxuICAgICAgbmV3UG9zICs9IGNvbXBvbmVudC5jb3VudDtcblxuICAgICAgLy8gQ29tbW9uIGNhc2VcbiAgICAgIGlmICghY29tcG9uZW50LmFkZGVkKSB7XG4gICAgICAgIG9sZFBvcyArPSBjb21wb25lbnQuY291bnQ7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbXBvbmVudC52YWx1ZSA9IGRpZmYuam9pbihvbGRTdHJpbmcuc2xpY2Uob2xkUG9zLCBvbGRQb3MgKyBjb21wb25lbnQuY291bnQpKTtcbiAgICAgIG9sZFBvcyArPSBjb21wb25lbnQuY291bnQ7XG5cbiAgICAgIC8vIFJldmVyc2UgYWRkIGFuZCByZW1vdmUgc28gcmVtb3ZlcyBhcmUgb3V0cHV0IGZpcnN0IHRvIG1hdGNoIGNvbW1vbiBjb252ZW50aW9uXG4gICAgICAvLyBUaGUgZGlmZmluZyBhbGdvcml0aG0gaXMgdGllZCB0byBhZGQgdGhlbiByZW1vdmUgb3V0cHV0IGFuZCB0aGlzIGlzIHRoZSBzaW1wbGVzdFxuICAgICAgLy8gcm91dGUgdG8gZ2V0IHRoZSBkZXNpcmVkIG91dHB1dCB3aXRoIG1pbmltYWwgb3ZlcmhlYWQuXG4gICAgICBpZiAoY29tcG9uZW50UG9zICYmIGNvbXBvbmVudHNbY29tcG9uZW50UG9zIC0gMV0uYWRkZWQpIHtcbiAgICAgICAgbGV0IHRtcCA9IGNvbXBvbmVudHNbY29tcG9uZW50UG9zIC0gMV07XG4gICAgICAgIGNvbXBvbmVudHNbY29tcG9uZW50UG9zIC0gMV0gPSBjb21wb25lbnRzW2NvbXBvbmVudFBvc107XG4gICAgICAgIGNvbXBvbmVudHNbY29tcG9uZW50UG9zXSA9IHRtcDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBTcGVjaWFsIGNhc2UgaGFuZGxlIGZvciB3aGVuIG9uZSB0ZXJtaW5hbCBpcyBpZ25vcmVkLiBGb3IgdGhpcyBjYXNlIHdlIG1lcmdlIHRoZVxuICAvLyB0ZXJtaW5hbCBpbnRvIHRoZSBwcmlvciBzdHJpbmcgYW5kIGRyb3AgdGhlIGNoYW5nZS5cbiAgbGV0IGxhc3RDb21wb25lbnQgPSBjb21wb25lbnRzW2NvbXBvbmVudExlbiAtIDFdO1xuICBpZiAoY29tcG9uZW50TGVuID4gMVxuICAgICAgJiYgKGxhc3RDb21wb25lbnQuYWRkZWQgfHwgbGFzdENvbXBvbmVudC5yZW1vdmVkKVxuICAgICAgJiYgZGlmZi5lcXVhbHMoJycsIGxhc3RDb21wb25lbnQudmFsdWUpKSB7XG4gICAgY29tcG9uZW50c1tjb21wb25lbnRMZW4gLSAyXS52YWx1ZSArPSBsYXN0Q29tcG9uZW50LnZhbHVlO1xuICAgIGNvbXBvbmVudHMucG9wKCk7XG4gIH1cblxuICByZXR1cm4gY29tcG9uZW50cztcbn1cblxuZnVuY3Rpb24gY2xvbmVQYXRoKHBhdGgpIHtcbiAgcmV0dXJuIHsgbmV3UG9zOiBwYXRoLm5ld1BvcywgY29tcG9uZW50czogcGF0aC5jb21wb25lbnRzLnNsaWNlKDApIH07XG59XG4iLCJpbXBvcnQgRGlmZiBmcm9tICcuL2Jhc2UnO1xuXG5leHBvcnQgY29uc3QgY2hhcmFjdGVyRGlmZiA9IG5ldyBEaWZmKCk7XG5leHBvcnQgZnVuY3Rpb24gZGlmZkNoYXJzKG9sZFN0ciwgbmV3U3RyLCBjYWxsYmFjaykgeyByZXR1cm4gY2hhcmFjdGVyRGlmZi5kaWZmKG9sZFN0ciwgbmV3U3RyLCBjYWxsYmFjayk7IH1cbiIsImltcG9ydCBEaWZmIGZyb20gJy4vYmFzZSc7XG5cbmV4cG9ydCBjb25zdCBjc3NEaWZmID0gbmV3IERpZmYoKTtcbmNzc0RpZmYudG9rZW5pemUgPSBmdW5jdGlvbih2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUuc3BsaXQoLyhbe306OyxdfFxccyspLyk7XG59O1xuXG5leHBvcnQgZnVuY3Rpb24gZGlmZkNzcyhvbGRTdHIsIG5ld1N0ciwgY2FsbGJhY2spIHsgcmV0dXJuIGNzc0RpZmYuZGlmZihvbGRTdHIsIG5ld1N0ciwgY2FsbGJhY2spOyB9XG4iLCJpbXBvcnQgRGlmZiBmcm9tICcuL2Jhc2UnO1xuaW1wb3J0IHtsaW5lRGlmZn0gZnJvbSAnLi9saW5lJztcblxuY29uc3Qgb2JqZWN0UHJvdG90eXBlVG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuXG5cbmV4cG9ydCBjb25zdCBqc29uRGlmZiA9IG5ldyBEaWZmKCk7XG4vLyBEaXNjcmltaW5hdGUgYmV0d2VlbiB0d28gbGluZXMgb2YgcHJldHR5LXByaW50ZWQsIHNlcmlhbGl6ZWQgSlNPTiB3aGVyZSBvbmUgb2YgdGhlbSBoYXMgYVxuLy8gZGFuZ2xpbmcgY29tbWEgYW5kIHRoZSBvdGhlciBkb2Vzbid0LiBUdXJucyBvdXQgaW5jbHVkaW5nIHRoZSBkYW5nbGluZyBjb21tYSB5aWVsZHMgdGhlIG5pY2VzdCBvdXRwdXQ6XG5qc29uRGlmZi51c2VMb25nZXN0VG9rZW4gPSB0cnVlO1xuXG5qc29uRGlmZi50b2tlbml6ZSA9IGxpbmVEaWZmLnRva2VuaXplO1xuanNvbkRpZmYuY2FzdElucHV0ID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgY29uc3Qge3VuZGVmaW5lZFJlcGxhY2VtZW50fSA9IHRoaXMub3B0aW9ucztcblxuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyA/IHZhbHVlIDogSlNPTi5zdHJpbmdpZnkoY2Fub25pY2FsaXplKHZhbHVlKSwgZnVuY3Rpb24oaywgdikge1xuICAgIGlmICh0eXBlb2YgdiA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWRSZXBsYWNlbWVudDtcbiAgICB9XG5cbiAgICByZXR1cm4gdjtcbiAgfSwgJyAgJyk7XG59O1xuanNvbkRpZmYuZXF1YWxzID0gZnVuY3Rpb24obGVmdCwgcmlnaHQpIHtcbiAgcmV0dXJuIERpZmYucHJvdG90eXBlLmVxdWFscyhsZWZ0LnJlcGxhY2UoLywoW1xcclxcbl0pL2csICckMScpLCByaWdodC5yZXBsYWNlKC8sKFtcXHJcXG5dKS9nLCAnJDEnKSk7XG59O1xuXG5leHBvcnQgZnVuY3Rpb24gZGlmZkpzb24ob2xkT2JqLCBuZXdPYmosIG9wdGlvbnMpIHsgcmV0dXJuIGpzb25EaWZmLmRpZmYob2xkT2JqLCBuZXdPYmosIG9wdGlvbnMpOyB9XG5cbi8vIFRoaXMgZnVuY3Rpb24gaGFuZGxlcyB0aGUgcHJlc2VuY2Ugb2YgY2lyY3VsYXIgcmVmZXJlbmNlcyBieSBiYWlsaW5nIG91dCB3aGVuIGVuY291bnRlcmluZyBhblxuLy8gb2JqZWN0IHRoYXQgaXMgYWxyZWFkeSBvbiB0aGUgXCJzdGFja1wiIG9mIGl0ZW1zIGJlaW5nIHByb2Nlc3NlZC5cbmV4cG9ydCBmdW5jdGlvbiBjYW5vbmljYWxpemUob2JqLCBzdGFjaywgcmVwbGFjZW1lbnRTdGFjaykge1xuICBzdGFjayA9IHN0YWNrIHx8IFtdO1xuICByZXBsYWNlbWVudFN0YWNrID0gcmVwbGFjZW1lbnRTdGFjayB8fCBbXTtcblxuICBsZXQgaTtcblxuICBmb3IgKGkgPSAwOyBpIDwgc3RhY2subGVuZ3RoOyBpICs9IDEpIHtcbiAgICBpZiAoc3RhY2tbaV0gPT09IG9iaikge1xuICAgICAgcmV0dXJuIHJlcGxhY2VtZW50U3RhY2tbaV07XG4gICAgfVxuICB9XG5cbiAgbGV0IGNhbm9uaWNhbGl6ZWRPYmo7XG5cbiAgaWYgKCdbb2JqZWN0IEFycmF5XScgPT09IG9iamVjdFByb3RvdHlwZVRvU3RyaW5nLmNhbGwob2JqKSkge1xuICAgIHN0YWNrLnB1c2gob2JqKTtcbiAgICBjYW5vbmljYWxpemVkT2JqID0gbmV3IEFycmF5KG9iai5sZW5ndGgpO1xuICAgIHJlcGxhY2VtZW50U3RhY2sucHVzaChjYW5vbmljYWxpemVkT2JqKTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgb2JqLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICBjYW5vbmljYWxpemVkT2JqW2ldID0gY2Fub25pY2FsaXplKG9ialtpXSwgc3RhY2ssIHJlcGxhY2VtZW50U3RhY2spO1xuICAgIH1cbiAgICBzdGFjay5wb3AoKTtcbiAgICByZXBsYWNlbWVudFN0YWNrLnBvcCgpO1xuICAgIHJldHVybiBjYW5vbmljYWxpemVkT2JqO1xuICB9XG5cbiAgaWYgKG9iaiAmJiBvYmoudG9KU09OKSB7XG4gICAgb2JqID0gb2JqLnRvSlNPTigpO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBvYmogPT09ICdvYmplY3QnICYmIG9iaiAhPT0gbnVsbCkge1xuICAgIHN0YWNrLnB1c2gob2JqKTtcbiAgICBjYW5vbmljYWxpemVkT2JqID0ge307XG4gICAgcmVwbGFjZW1lbnRTdGFjay5wdXNoKGNhbm9uaWNhbGl6ZWRPYmopO1xuICAgIGxldCBzb3J0ZWRLZXlzID0gW10sXG4gICAgICAgIGtleTtcbiAgICBmb3IgKGtleSBpbiBvYmopIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBlbHNlICovXG4gICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgc29ydGVkS2V5cy5wdXNoKGtleSk7XG4gICAgICB9XG4gICAgfVxuICAgIHNvcnRlZEtleXMuc29ydCgpO1xuICAgIGZvciAoaSA9IDA7IGkgPCBzb3J0ZWRLZXlzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICBrZXkgPSBzb3J0ZWRLZXlzW2ldO1xuICAgICAgY2Fub25pY2FsaXplZE9ialtrZXldID0gY2Fub25pY2FsaXplKG9ialtrZXldLCBzdGFjaywgcmVwbGFjZW1lbnRTdGFjayk7XG4gICAgfVxuICAgIHN0YWNrLnBvcCgpO1xuICAgIHJlcGxhY2VtZW50U3RhY2sucG9wKCk7XG4gIH0gZWxzZSB7XG4gICAgY2Fub25pY2FsaXplZE9iaiA9IG9iajtcbiAgfVxuICByZXR1cm4gY2Fub25pY2FsaXplZE9iajtcbn1cbiIsImltcG9ydCBEaWZmIGZyb20gJy4vYmFzZSc7XG5pbXBvcnQge2dlbmVyYXRlT3B0aW9uc30gZnJvbSAnLi4vdXRpbC9wYXJhbXMnO1xuXG5leHBvcnQgY29uc3QgbGluZURpZmYgPSBuZXcgRGlmZigpO1xubGluZURpZmYudG9rZW5pemUgPSBmdW5jdGlvbih2YWx1ZSkge1xuICBsZXQgcmV0TGluZXMgPSBbXSxcbiAgICAgIGxpbmVzQW5kTmV3bGluZXMgPSB2YWx1ZS5zcGxpdCgvKFxcbnxcXHJcXG4pLyk7XG5cbiAgLy8gSWdub3JlIHRoZSBmaW5hbCBlbXB0eSB0b2tlbiB0aGF0IG9jY3VycyBpZiB0aGUgc3RyaW5nIGVuZHMgd2l0aCBhIG5ldyBsaW5lXG4gIGlmICghbGluZXNBbmROZXdsaW5lc1tsaW5lc0FuZE5ld2xpbmVzLmxlbmd0aCAtIDFdKSB7XG4gICAgbGluZXNBbmROZXdsaW5lcy5wb3AoKTtcbiAgfVxuXG4gIC8vIE1lcmdlIHRoZSBjb250ZW50IGFuZCBsaW5lIHNlcGFyYXRvcnMgaW50byBzaW5nbGUgdG9rZW5zXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbGluZXNBbmROZXdsaW5lcy5sZW5ndGg7IGkrKykge1xuICAgIGxldCBsaW5lID0gbGluZXNBbmROZXdsaW5lc1tpXTtcblxuICAgIGlmIChpICUgMiAmJiAhdGhpcy5vcHRpb25zLm5ld2xpbmVJc1Rva2VuKSB7XG4gICAgICByZXRMaW5lc1tyZXRMaW5lcy5sZW5ndGggLSAxXSArPSBsaW5lO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLmlnbm9yZVdoaXRlc3BhY2UpIHtcbiAgICAgICAgbGluZSA9IGxpbmUudHJpbSgpO1xuICAgICAgfVxuICAgICAgcmV0TGluZXMucHVzaChsaW5lKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmV0TGluZXM7XG59O1xuXG5leHBvcnQgZnVuY3Rpb24gZGlmZkxpbmVzKG9sZFN0ciwgbmV3U3RyLCBjYWxsYmFjaykgeyByZXR1cm4gbGluZURpZmYuZGlmZihvbGRTdHIsIG5ld1N0ciwgY2FsbGJhY2spOyB9XG5leHBvcnQgZnVuY3Rpb24gZGlmZlRyaW1tZWRMaW5lcyhvbGRTdHIsIG5ld1N0ciwgY2FsbGJhY2spIHtcbiAgbGV0IG9wdGlvbnMgPSBnZW5lcmF0ZU9wdGlvbnMoY2FsbGJhY2ssIHtpZ25vcmVXaGl0ZXNwYWNlOiB0cnVlfSk7XG4gIHJldHVybiBsaW5lRGlmZi5kaWZmKG9sZFN0ciwgbmV3U3RyLCBvcHRpb25zKTtcbn1cbiIsImltcG9ydCBEaWZmIGZyb20gJy4vYmFzZSc7XG5cblxuZXhwb3J0IGNvbnN0IHNlbnRlbmNlRGlmZiA9IG5ldyBEaWZmKCk7XG5zZW50ZW5jZURpZmYudG9rZW5pemUgPSBmdW5jdGlvbih2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUuc3BsaXQoLyhcXFMuKz9bLiE/XSkoPz1cXHMrfCQpLyk7XG59O1xuXG5leHBvcnQgZnVuY3Rpb24gZGlmZlNlbnRlbmNlcyhvbGRTdHIsIG5ld1N0ciwgY2FsbGJhY2spIHsgcmV0dXJuIHNlbnRlbmNlRGlmZi5kaWZmKG9sZFN0ciwgbmV3U3RyLCBjYWxsYmFjayk7IH1cbiIsImltcG9ydCBEaWZmIGZyb20gJy4vYmFzZSc7XG5pbXBvcnQge2dlbmVyYXRlT3B0aW9uc30gZnJvbSAnLi4vdXRpbC9wYXJhbXMnO1xuXG4vLyBCYXNlZCBvbiBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9MYXRpbl9zY3JpcHRfaW5fVW5pY29kZVxuLy9cbi8vIFJhbmdlcyBhbmQgZXhjZXB0aW9uczpcbi8vIExhdGluLTEgU3VwcGxlbWVudCwgMDA4MOKAkzAwRkZcbi8vICAtIFUrMDBENyAgw5cgTXVsdGlwbGljYXRpb24gc2lnblxuLy8gIC0gVSswMEY3ICDDtyBEaXZpc2lvbiBzaWduXG4vLyBMYXRpbiBFeHRlbmRlZC1BLCAwMTAw4oCTMDE3RlxuLy8gTGF0aW4gRXh0ZW5kZWQtQiwgMDE4MOKAkzAyNEZcbi8vIElQQSBFeHRlbnNpb25zLCAwMjUw4oCTMDJBRlxuLy8gU3BhY2luZyBNb2RpZmllciBMZXR0ZXJzLCAwMkIw4oCTMDJGRlxuLy8gIC0gVSswMkM3ICDLhyAmIzcxMTsgIENhcm9uXG4vLyAgLSBVKzAyRDggIMuYICYjNzI4OyAgQnJldmVcbi8vICAtIFUrMDJEOSAgy5kgJiM3Mjk7ICBEb3QgQWJvdmVcbi8vICAtIFUrMDJEQSAgy5ogJiM3MzA7ICBSaW5nIEFib3ZlXG4vLyAgLSBVKzAyREIgIMubICYjNzMxOyAgT2dvbmVrXG4vLyAgLSBVKzAyREMgIMucICYjNzMyOyAgU21hbGwgVGlsZGVcbi8vICAtIFUrMDJERCAgy50gJiM3MzM7ICBEb3VibGUgQWN1dGUgQWNjZW50XG4vLyBMYXRpbiBFeHRlbmRlZCBBZGRpdGlvbmFsLCAxRTAw4oCTMUVGRlxuY29uc3QgZXh0ZW5kZWRXb3JkQ2hhcnMgPSAvXlthLXpBLVpcXHV7QzB9LVxcdXtGRn1cXHV7RDh9LVxcdXtGNn1cXHV7Rjh9LVxcdXsyQzZ9XFx1ezJDOH0tXFx1ezJEN31cXHV7MkRFfS1cXHV7MkZGfVxcdXsxRTAwfS1cXHV7MUVGRn1dKyQvdTtcblxuY29uc3QgcmVXaGl0ZXNwYWNlID0gL1xcUy87XG5cbmV4cG9ydCBjb25zdCB3b3JkRGlmZiA9IG5ldyBEaWZmKCk7XG53b3JkRGlmZi5lcXVhbHMgPSBmdW5jdGlvbihsZWZ0LCByaWdodCkge1xuICByZXR1cm4gbGVmdCA9PT0gcmlnaHQgfHwgKHRoaXMub3B0aW9ucy5pZ25vcmVXaGl0ZXNwYWNlICYmICFyZVdoaXRlc3BhY2UudGVzdChsZWZ0KSAmJiAhcmVXaGl0ZXNwYWNlLnRlc3QocmlnaHQpKTtcbn07XG53b3JkRGlmZi50b2tlbml6ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gIGxldCB0b2tlbnMgPSB2YWx1ZS5zcGxpdCgvKFxccyt8XFxiKS8pO1xuXG4gIC8vIEpvaW4gdGhlIGJvdW5kYXJ5IHNwbGl0cyB0aGF0IHdlIGRvIG5vdCBjb25zaWRlciB0byBiZSBib3VuZGFyaWVzLiBUaGlzIGlzIHByaW1hcmlseSB0aGUgZXh0ZW5kZWQgTGF0aW4gY2hhcmFjdGVyIHNldC5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0b2tlbnMubGVuZ3RoIC0gMTsgaSsrKSB7XG4gICAgLy8gSWYgd2UgaGF2ZSBhbiBlbXB0eSBzdHJpbmcgaW4gdGhlIG5leHQgZmllbGQgYW5kIHdlIGhhdmUgb25seSB3b3JkIGNoYXJzIGJlZm9yZSBhbmQgYWZ0ZXIsIG1lcmdlXG4gICAgaWYgKCF0b2tlbnNbaSArIDFdICYmIHRva2Vuc1tpICsgMl1cbiAgICAgICAgICAmJiBleHRlbmRlZFdvcmRDaGFycy50ZXN0KHRva2Vuc1tpXSlcbiAgICAgICAgICAmJiBleHRlbmRlZFdvcmRDaGFycy50ZXN0KHRva2Vuc1tpICsgMl0pKSB7XG4gICAgICB0b2tlbnNbaV0gKz0gdG9rZW5zW2kgKyAyXTtcbiAgICAgIHRva2Vucy5zcGxpY2UoaSArIDEsIDIpO1xuICAgICAgaS0tO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0b2tlbnM7XG59O1xuXG5leHBvcnQgZnVuY3Rpb24gZGlmZldvcmRzKG9sZFN0ciwgbmV3U3RyLCBjYWxsYmFjaykge1xuICBsZXQgb3B0aW9ucyA9IGdlbmVyYXRlT3B0aW9ucyhjYWxsYmFjaywge2lnbm9yZVdoaXRlc3BhY2U6IHRydWV9KTtcbiAgcmV0dXJuIHdvcmREaWZmLmRpZmYob2xkU3RyLCBuZXdTdHIsIG9wdGlvbnMpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGRpZmZXb3Jkc1dpdGhTcGFjZShvbGRTdHIsIG5ld1N0ciwgY2FsbGJhY2spIHtcbiAgcmV0dXJuIHdvcmREaWZmLmRpZmYob2xkU3RyLCBuZXdTdHIsIGNhbGxiYWNrKTtcbn1cbiIsIi8qIFNlZSBMSUNFTlNFIGZpbGUgZm9yIHRlcm1zIG9mIHVzZSAqL1xuXG4vKlxuICogVGV4dCBkaWZmIGltcGxlbWVudGF0aW9uLlxuICpcbiAqIFRoaXMgbGlicmFyeSBzdXBwb3J0cyB0aGUgZm9sbG93aW5nIEFQSVM6XG4gKiBKc0RpZmYuZGlmZkNoYXJzOiBDaGFyYWN0ZXIgYnkgY2hhcmFjdGVyIGRpZmZcbiAqIEpzRGlmZi5kaWZmV29yZHM6IFdvcmQgKGFzIGRlZmluZWQgYnkgXFxiIHJlZ2V4KSBkaWZmIHdoaWNoIGlnbm9yZXMgd2hpdGVzcGFjZVxuICogSnNEaWZmLmRpZmZMaW5lczogTGluZSBiYXNlZCBkaWZmXG4gKlxuICogSnNEaWZmLmRpZmZDc3M6IERpZmYgdGFyZ2V0ZWQgYXQgQ1NTIGNvbnRlbnRcbiAqXG4gKiBUaGVzZSBtZXRob2RzIGFyZSBiYXNlZCBvbiB0aGUgaW1wbGVtZW50YXRpb24gcHJvcG9zZWQgaW5cbiAqIFwiQW4gTyhORCkgRGlmZmVyZW5jZSBBbGdvcml0aG0gYW5kIGl0cyBWYXJpYXRpb25zXCIgKE15ZXJzLCAxOTg2KS5cbiAqIGh0dHA6Ly9jaXRlc2VlcnguaXN0LnBzdS5lZHUvdmlld2RvYy9zdW1tYXJ5P2RvaT0xMC4xLjEuNC42OTI3XG4gKi9cbmltcG9ydCBEaWZmIGZyb20gJy4vZGlmZi9iYXNlJztcbmltcG9ydCB7ZGlmZkNoYXJzfSBmcm9tICcuL2RpZmYvY2hhcmFjdGVyJztcbmltcG9ydCB7ZGlmZldvcmRzLCBkaWZmV29yZHNXaXRoU3BhY2V9IGZyb20gJy4vZGlmZi93b3JkJztcbmltcG9ydCB7ZGlmZkxpbmVzLCBkaWZmVHJpbW1lZExpbmVzfSBmcm9tICcuL2RpZmYvbGluZSc7XG5pbXBvcnQge2RpZmZTZW50ZW5jZXN9IGZyb20gJy4vZGlmZi9zZW50ZW5jZSc7XG5cbmltcG9ydCB7ZGlmZkNzc30gZnJvbSAnLi9kaWZmL2Nzcyc7XG5pbXBvcnQge2RpZmZKc29uLCBjYW5vbmljYWxpemV9IGZyb20gJy4vZGlmZi9qc29uJztcblxuaW1wb3J0IHtkaWZmQXJyYXlzfSBmcm9tICcuL2RpZmYvYXJyYXknO1xuXG5pbXBvcnQge2FwcGx5UGF0Y2gsIGFwcGx5UGF0Y2hlc30gZnJvbSAnLi9wYXRjaC9hcHBseSc7XG5pbXBvcnQge3BhcnNlUGF0Y2h9IGZyb20gJy4vcGF0Y2gvcGFyc2UnO1xuaW1wb3J0IHtzdHJ1Y3R1cmVkUGF0Y2gsIGNyZWF0ZVR3b0ZpbGVzUGF0Y2gsIGNyZWF0ZVBhdGNofSBmcm9tICcuL3BhdGNoL2NyZWF0ZSc7XG5cbmltcG9ydCB7Y29udmVydENoYW5nZXNUb0RNUH0gZnJvbSAnLi9jb252ZXJ0L2RtcCc7XG5pbXBvcnQge2NvbnZlcnRDaGFuZ2VzVG9YTUx9IGZyb20gJy4vY29udmVydC94bWwnO1xuXG5leHBvcnQge1xuICBEaWZmLFxuXG4gIGRpZmZDaGFycyxcbiAgZGlmZldvcmRzLFxuICBkaWZmV29yZHNXaXRoU3BhY2UsXG4gIGRpZmZMaW5lcyxcbiAgZGlmZlRyaW1tZWRMaW5lcyxcbiAgZGlmZlNlbnRlbmNlcyxcblxuICBkaWZmQ3NzLFxuICBkaWZmSnNvbixcblxuICBkaWZmQXJyYXlzLFxuXG4gIHN0cnVjdHVyZWRQYXRjaCxcbiAgY3JlYXRlVHdvRmlsZXNQYXRjaCxcbiAgY3JlYXRlUGF0Y2gsXG4gIGFwcGx5UGF0Y2gsXG4gIGFwcGx5UGF0Y2hlcyxcbiAgcGFyc2VQYXRjaCxcbiAgY29udmVydENoYW5nZXNUb0RNUCxcbiAgY29udmVydENoYW5nZXNUb1hNTCxcbiAgY2Fub25pY2FsaXplXG59O1xuIiwiaW1wb3J0IHtwYXJzZVBhdGNofSBmcm9tICcuL3BhcnNlJztcbmltcG9ydCBkaXN0YW5jZUl0ZXJhdG9yIGZyb20gJy4uL3V0aWwvZGlzdGFuY2UtaXRlcmF0b3InO1xuXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlQYXRjaChzb3VyY2UsIHVuaURpZmYsIG9wdGlvbnMgPSB7fSkge1xuICBpZiAodHlwZW9mIHVuaURpZmYgPT09ICdzdHJpbmcnKSB7XG4gICAgdW5pRGlmZiA9IHBhcnNlUGF0Y2godW5pRGlmZik7XG4gIH1cblxuICBpZiAoQXJyYXkuaXNBcnJheSh1bmlEaWZmKSkge1xuICAgIGlmICh1bmlEaWZmLmxlbmd0aCA+IDEpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignYXBwbHlQYXRjaCBvbmx5IHdvcmtzIHdpdGggYSBzaW5nbGUgaW5wdXQuJyk7XG4gICAgfVxuXG4gICAgdW5pRGlmZiA9IHVuaURpZmZbMF07XG4gIH1cblxuICAvLyBBcHBseSB0aGUgZGlmZiB0byB0aGUgaW5wdXRcbiAgbGV0IGxpbmVzID0gc291cmNlLnNwbGl0KC9cXHJcXG58W1xcblxcdlxcZlxcclxceDg1XS8pLFxuICAgICAgZGVsaW1pdGVycyA9IHNvdXJjZS5tYXRjaCgvXFxyXFxufFtcXG5cXHZcXGZcXHJcXHg4NV0vZykgfHwgW10sXG4gICAgICBodW5rcyA9IHVuaURpZmYuaHVua3MsXG5cbiAgICAgIGNvbXBhcmVMaW5lID0gb3B0aW9ucy5jb21wYXJlTGluZSB8fCAoKGxpbmVOdW1iZXIsIGxpbmUsIG9wZXJhdGlvbiwgcGF0Y2hDb250ZW50KSA9PiBsaW5lID09PSBwYXRjaENvbnRlbnQpLFxuICAgICAgZXJyb3JDb3VudCA9IDAsXG4gICAgICBmdXp6RmFjdG9yID0gb3B0aW9ucy5mdXp6RmFjdG9yIHx8IDAsXG4gICAgICBtaW5MaW5lID0gMCxcbiAgICAgIG9mZnNldCA9IDAsXG5cbiAgICAgIHJlbW92ZUVPRk5MLFxuICAgICAgYWRkRU9GTkw7XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGUgaHVuayBleGFjdGx5IGZpdHMgb24gdGhlIHByb3ZpZGVkIGxvY2F0aW9uXG4gICAqL1xuICBmdW5jdGlvbiBodW5rRml0cyhodW5rLCB0b1Bvcykge1xuICAgIGZvciAobGV0IGogPSAwOyBqIDwgaHVuay5saW5lcy5sZW5ndGg7IGorKykge1xuICAgICAgbGV0IGxpbmUgPSBodW5rLmxpbmVzW2pdLFxuICAgICAgICAgIG9wZXJhdGlvbiA9IGxpbmVbMF0sXG4gICAgICAgICAgY29udGVudCA9IGxpbmUuc3Vic3RyKDEpO1xuXG4gICAgICBpZiAob3BlcmF0aW9uID09PSAnICcgfHwgb3BlcmF0aW9uID09PSAnLScpIHtcbiAgICAgICAgLy8gQ29udGV4dCBzYW5pdHkgY2hlY2tcbiAgICAgICAgaWYgKCFjb21wYXJlTGluZSh0b1BvcyArIDEsIGxpbmVzW3RvUG9zXSwgb3BlcmF0aW9uLCBjb250ZW50KSkge1xuICAgICAgICAgIGVycm9yQ291bnQrKztcblxuICAgICAgICAgIGlmIChlcnJvckNvdW50ID4gZnV6ekZhY3Rvcikge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0b1BvcysrO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLy8gU2VhcmNoIGJlc3QgZml0IG9mZnNldHMgZm9yIGVhY2ggaHVuayBiYXNlZCBvbiB0aGUgcHJldmlvdXMgb25lc1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGh1bmtzLmxlbmd0aDsgaSsrKSB7XG4gICAgbGV0IGh1bmsgPSBodW5rc1tpXSxcbiAgICAgICAgbWF4TGluZSA9IGxpbmVzLmxlbmd0aCAtIGh1bmsub2xkTGluZXMsXG4gICAgICAgIGxvY2FsT2Zmc2V0ID0gMCxcbiAgICAgICAgdG9Qb3MgPSBvZmZzZXQgKyBodW5rLm9sZFN0YXJ0IC0gMTtcblxuICAgIGxldCBpdGVyYXRvciA9IGRpc3RhbmNlSXRlcmF0b3IodG9Qb3MsIG1pbkxpbmUsIG1heExpbmUpO1xuXG4gICAgZm9yICg7IGxvY2FsT2Zmc2V0ICE9PSB1bmRlZmluZWQ7IGxvY2FsT2Zmc2V0ID0gaXRlcmF0b3IoKSkge1xuICAgICAgaWYgKGh1bmtGaXRzKGh1bmssIHRvUG9zICsgbG9jYWxPZmZzZXQpKSB7XG4gICAgICAgIGh1bmsub2Zmc2V0ID0gb2Zmc2V0ICs9IGxvY2FsT2Zmc2V0O1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAobG9jYWxPZmZzZXQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8vIFNldCBsb3dlciB0ZXh0IGxpbWl0IHRvIGVuZCBvZiB0aGUgY3VycmVudCBodW5rLCBzbyBuZXh0IG9uZXMgZG9uJ3QgdHJ5XG4gICAgLy8gdG8gZml0IG92ZXIgYWxyZWFkeSBwYXRjaGVkIHRleHRcbiAgICBtaW5MaW5lID0gaHVuay5vZmZzZXQgKyBodW5rLm9sZFN0YXJ0ICsgaHVuay5vbGRMaW5lcztcbiAgfVxuXG4gIC8vIEFwcGx5IHBhdGNoIGh1bmtzXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaHVua3MubGVuZ3RoOyBpKyspIHtcbiAgICBsZXQgaHVuayA9IGh1bmtzW2ldLFxuICAgICAgICB0b1BvcyA9IGh1bmsub2Zmc2V0ICsgaHVuay5uZXdTdGFydCAtIDE7XG4gICAgaWYgKGh1bmsubmV3TGluZXMgPT0gMCkgeyB0b1BvcysrOyB9XG5cbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IGh1bmsubGluZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgIGxldCBsaW5lID0gaHVuay5saW5lc1tqXSxcbiAgICAgICAgICBvcGVyYXRpb24gPSBsaW5lWzBdLFxuICAgICAgICAgIGNvbnRlbnQgPSBsaW5lLnN1YnN0cigxKSxcbiAgICAgICAgICBkZWxpbWl0ZXIgPSBodW5rLmxpbmVkZWxpbWl0ZXJzW2pdO1xuXG4gICAgICBpZiAob3BlcmF0aW9uID09PSAnICcpIHtcbiAgICAgICAgdG9Qb3MrKztcbiAgICAgIH0gZWxzZSBpZiAob3BlcmF0aW9uID09PSAnLScpIHtcbiAgICAgICAgbGluZXMuc3BsaWNlKHRvUG9zLCAxKTtcbiAgICAgICAgZGVsaW1pdGVycy5zcGxpY2UodG9Qb3MsIDEpO1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIGVsc2UgKi9cbiAgICAgIH0gZWxzZSBpZiAob3BlcmF0aW9uID09PSAnKycpIHtcbiAgICAgICAgbGluZXMuc3BsaWNlKHRvUG9zLCAwLCBjb250ZW50KTtcbiAgICAgICAgZGVsaW1pdGVycy5zcGxpY2UodG9Qb3MsIDAsIGRlbGltaXRlcik7XG4gICAgICAgIHRvUG9zKys7XG4gICAgICB9IGVsc2UgaWYgKG9wZXJhdGlvbiA9PT0gJ1xcXFwnKSB7XG4gICAgICAgIGxldCBwcmV2aW91c09wZXJhdGlvbiA9IGh1bmsubGluZXNbaiAtIDFdID8gaHVuay5saW5lc1tqIC0gMV1bMF0gOiBudWxsO1xuICAgICAgICBpZiAocHJldmlvdXNPcGVyYXRpb24gPT09ICcrJykge1xuICAgICAgICAgIHJlbW92ZUVPRk5MID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIGlmIChwcmV2aW91c09wZXJhdGlvbiA9PT0gJy0nKSB7XG4gICAgICAgICAgYWRkRU9GTkwgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gSGFuZGxlIEVPRk5MIGluc2VydGlvbi9yZW1vdmFsXG4gIGlmIChyZW1vdmVFT0ZOTCkge1xuICAgIHdoaWxlICghbGluZXNbbGluZXMubGVuZ3RoIC0gMV0pIHtcbiAgICAgIGxpbmVzLnBvcCgpO1xuICAgICAgZGVsaW1pdGVycy5wb3AoKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoYWRkRU9GTkwpIHtcbiAgICBsaW5lcy5wdXNoKCcnKTtcbiAgICBkZWxpbWl0ZXJzLnB1c2goJ1xcbicpO1xuICB9XG4gIGZvciAobGV0IF9rID0gMDsgX2sgPCBsaW5lcy5sZW5ndGggLSAxOyBfaysrKSB7XG4gICAgbGluZXNbX2tdID0gbGluZXNbX2tdICsgZGVsaW1pdGVyc1tfa107XG4gIH1cbiAgcmV0dXJuIGxpbmVzLmpvaW4oJycpO1xufVxuXG4vLyBXcmFwcGVyIHRoYXQgc3VwcG9ydHMgbXVsdGlwbGUgZmlsZSBwYXRjaGVzIHZpYSBjYWxsYmFja3MuXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlQYXRjaGVzKHVuaURpZmYsIG9wdGlvbnMpIHtcbiAgaWYgKHR5cGVvZiB1bmlEaWZmID09PSAnc3RyaW5nJykge1xuICAgIHVuaURpZmYgPSBwYXJzZVBhdGNoKHVuaURpZmYpO1xuICB9XG5cbiAgbGV0IGN1cnJlbnRJbmRleCA9IDA7XG4gIGZ1bmN0aW9uIHByb2Nlc3NJbmRleCgpIHtcbiAgICBsZXQgaW5kZXggPSB1bmlEaWZmW2N1cnJlbnRJbmRleCsrXTtcbiAgICBpZiAoIWluZGV4KSB7XG4gICAgICByZXR1cm4gb3B0aW9ucy5jb21wbGV0ZSgpO1xuICAgIH1cblxuICAgIG9wdGlvbnMubG9hZEZpbGUoaW5kZXgsIGZ1bmN0aW9uKGVyciwgZGF0YSkge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICByZXR1cm4gb3B0aW9ucy5jb21wbGV0ZShlcnIpO1xuICAgICAgfVxuXG4gICAgICBsZXQgdXBkYXRlZENvbnRlbnQgPSBhcHBseVBhdGNoKGRhdGEsIGluZGV4LCBvcHRpb25zKTtcbiAgICAgIG9wdGlvbnMucGF0Y2hlZChpbmRleCwgdXBkYXRlZENvbnRlbnQsIGZ1bmN0aW9uKGVycikge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgcmV0dXJuIG9wdGlvbnMuY29tcGxldGUoZXJyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHByb2Nlc3NJbmRleCgpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgcHJvY2Vzc0luZGV4KCk7XG59XG4iLCJpbXBvcnQge2RpZmZMaW5lc30gZnJvbSAnLi4vZGlmZi9saW5lJztcblxuZXhwb3J0IGZ1bmN0aW9uIHN0cnVjdHVyZWRQYXRjaChvbGRGaWxlTmFtZSwgbmV3RmlsZU5hbWUsIG9sZFN0ciwgbmV3U3RyLCBvbGRIZWFkZXIsIG5ld0hlYWRlciwgb3B0aW9ucykge1xuICBpZiAoIW9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0ge307XG4gIH1cbiAgaWYgKHR5cGVvZiBvcHRpb25zLmNvbnRleHQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgb3B0aW9ucy5jb250ZXh0ID0gNDtcbiAgfVxuXG4gIGNvbnN0IGRpZmYgPSBkaWZmTGluZXMob2xkU3RyLCBuZXdTdHIsIG9wdGlvbnMpO1xuICBkaWZmLnB1c2goe3ZhbHVlOiAnJywgbGluZXM6IFtdfSk7ICAgLy8gQXBwZW5kIGFuIGVtcHR5IHZhbHVlIHRvIG1ha2UgY2xlYW51cCBlYXNpZXJcblxuICBmdW5jdGlvbiBjb250ZXh0TGluZXMobGluZXMpIHtcbiAgICByZXR1cm4gbGluZXMubWFwKGZ1bmN0aW9uKGVudHJ5KSB7IHJldHVybiAnICcgKyBlbnRyeTsgfSk7XG4gIH1cblxuICBsZXQgaHVua3MgPSBbXTtcbiAgbGV0IG9sZFJhbmdlU3RhcnQgPSAwLCBuZXdSYW5nZVN0YXJ0ID0gMCwgY3VyUmFuZ2UgPSBbXSxcbiAgICAgIG9sZExpbmUgPSAxLCBuZXdMaW5lID0gMTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBkaWZmLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgY3VycmVudCA9IGRpZmZbaV0sXG4gICAgICAgICAgbGluZXMgPSBjdXJyZW50LmxpbmVzIHx8IGN1cnJlbnQudmFsdWUucmVwbGFjZSgvXFxuJC8sICcnKS5zcGxpdCgnXFxuJyk7XG4gICAgY3VycmVudC5saW5lcyA9IGxpbmVzO1xuXG4gICAgaWYgKGN1cnJlbnQuYWRkZWQgfHwgY3VycmVudC5yZW1vdmVkKSB7XG4gICAgICAvLyBJZiB3ZSBoYXZlIHByZXZpb3VzIGNvbnRleHQsIHN0YXJ0IHdpdGggdGhhdFxuICAgICAgaWYgKCFvbGRSYW5nZVN0YXJ0KSB7XG4gICAgICAgIGNvbnN0IHByZXYgPSBkaWZmW2kgLSAxXTtcbiAgICAgICAgb2xkUmFuZ2VTdGFydCA9IG9sZExpbmU7XG4gICAgICAgIG5ld1JhbmdlU3RhcnQgPSBuZXdMaW5lO1xuXG4gICAgICAgIGlmIChwcmV2KSB7XG4gICAgICAgICAgY3VyUmFuZ2UgPSBvcHRpb25zLmNvbnRleHQgPiAwID8gY29udGV4dExpbmVzKHByZXYubGluZXMuc2xpY2UoLW9wdGlvbnMuY29udGV4dCkpIDogW107XG4gICAgICAgICAgb2xkUmFuZ2VTdGFydCAtPSBjdXJSYW5nZS5sZW5ndGg7XG4gICAgICAgICAgbmV3UmFuZ2VTdGFydCAtPSBjdXJSYW5nZS5sZW5ndGg7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gT3V0cHV0IG91ciBjaGFuZ2VzXG4gICAgICBjdXJSYW5nZS5wdXNoKC4uLiBsaW5lcy5tYXAoZnVuY3Rpb24oZW50cnkpIHtcbiAgICAgICAgcmV0dXJuIChjdXJyZW50LmFkZGVkID8gJysnIDogJy0nKSArIGVudHJ5O1xuICAgICAgfSkpO1xuXG4gICAgICAvLyBUcmFjayB0aGUgdXBkYXRlZCBmaWxlIHBvc2l0aW9uXG4gICAgICBpZiAoY3VycmVudC5hZGRlZCkge1xuICAgICAgICBuZXdMaW5lICs9IGxpbmVzLmxlbmd0aDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG9sZExpbmUgKz0gbGluZXMubGVuZ3RoO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBJZGVudGljYWwgY29udGV4dCBsaW5lcy4gVHJhY2sgbGluZSBjaGFuZ2VzXG4gICAgICBpZiAob2xkUmFuZ2VTdGFydCkge1xuICAgICAgICAvLyBDbG9zZSBvdXQgYW55IGNoYW5nZXMgdGhhdCBoYXZlIGJlZW4gb3V0cHV0IChvciBqb2luIG92ZXJsYXBwaW5nKVxuICAgICAgICBpZiAobGluZXMubGVuZ3RoIDw9IG9wdGlvbnMuY29udGV4dCAqIDIgJiYgaSA8IGRpZmYubGVuZ3RoIC0gMikge1xuICAgICAgICAgIC8vIE92ZXJsYXBwaW5nXG4gICAgICAgICAgY3VyUmFuZ2UucHVzaCguLi4gY29udGV4dExpbmVzKGxpbmVzKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gZW5kIHRoZSByYW5nZSBhbmQgb3V0cHV0XG4gICAgICAgICAgbGV0IGNvbnRleHRTaXplID0gTWF0aC5taW4obGluZXMubGVuZ3RoLCBvcHRpb25zLmNvbnRleHQpO1xuICAgICAgICAgIGN1clJhbmdlLnB1c2goLi4uIGNvbnRleHRMaW5lcyhsaW5lcy5zbGljZSgwLCBjb250ZXh0U2l6ZSkpKTtcblxuICAgICAgICAgIGxldCBodW5rID0ge1xuICAgICAgICAgICAgb2xkU3RhcnQ6IG9sZFJhbmdlU3RhcnQsXG4gICAgICAgICAgICBvbGRMaW5lczogKG9sZExpbmUgLSBvbGRSYW5nZVN0YXJ0ICsgY29udGV4dFNpemUpLFxuICAgICAgICAgICAgbmV3U3RhcnQ6IG5ld1JhbmdlU3RhcnQsXG4gICAgICAgICAgICBuZXdMaW5lczogKG5ld0xpbmUgLSBuZXdSYW5nZVN0YXJ0ICsgY29udGV4dFNpemUpLFxuICAgICAgICAgICAgbGluZXM6IGN1clJhbmdlXG4gICAgICAgICAgfTtcbiAgICAgICAgICBpZiAoaSA+PSBkaWZmLmxlbmd0aCAtIDIgJiYgbGluZXMubGVuZ3RoIDw9IG9wdGlvbnMuY29udGV4dCkge1xuICAgICAgICAgICAgLy8gRU9GIGlzIGluc2lkZSB0aGlzIGh1bmtcbiAgICAgICAgICAgIGxldCBvbGRFT0ZOZXdsaW5lID0gKC9cXG4kLy50ZXN0KG9sZFN0cikpO1xuICAgICAgICAgICAgbGV0IG5ld0VPRk5ld2xpbmUgPSAoL1xcbiQvLnRlc3QobmV3U3RyKSk7XG4gICAgICAgICAgICBpZiAobGluZXMubGVuZ3RoID09IDAgJiYgIW9sZEVPRk5ld2xpbmUpIHtcbiAgICAgICAgICAgICAgLy8gc3BlY2lhbCBjYXNlOiBvbGQgaGFzIG5vIGVvbCBhbmQgbm8gdHJhaWxpbmcgY29udGV4dDsgbm8tbmwgY2FuIGVuZCB1cCBiZWZvcmUgYWRkc1xuICAgICAgICAgICAgICBjdXJSYW5nZS5zcGxpY2UoaHVuay5vbGRMaW5lcywgMCwgJ1xcXFwgTm8gbmV3bGluZSBhdCBlbmQgb2YgZmlsZScpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICghb2xkRU9GTmV3bGluZSB8fCAhbmV3RU9GTmV3bGluZSkge1xuICAgICAgICAgICAgICBjdXJSYW5nZS5wdXNoKCdcXFxcIE5vIG5ld2xpbmUgYXQgZW5kIG9mIGZpbGUnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaHVua3MucHVzaChodW5rKTtcblxuICAgICAgICAgIG9sZFJhbmdlU3RhcnQgPSAwO1xuICAgICAgICAgIG5ld1JhbmdlU3RhcnQgPSAwO1xuICAgICAgICAgIGN1clJhbmdlID0gW107XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIG9sZExpbmUgKz0gbGluZXMubGVuZ3RoO1xuICAgICAgbmV3TGluZSArPSBsaW5lcy5sZW5ndGg7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBvbGRGaWxlTmFtZTogb2xkRmlsZU5hbWUsIG5ld0ZpbGVOYW1lOiBuZXdGaWxlTmFtZSxcbiAgICBvbGRIZWFkZXI6IG9sZEhlYWRlciwgbmV3SGVhZGVyOiBuZXdIZWFkZXIsXG4gICAgaHVua3M6IGh1bmtzXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUd29GaWxlc1BhdGNoKG9sZEZpbGVOYW1lLCBuZXdGaWxlTmFtZSwgb2xkU3RyLCBuZXdTdHIsIG9sZEhlYWRlciwgbmV3SGVhZGVyLCBvcHRpb25zKSB7XG4gIGNvbnN0IGRpZmYgPSBzdHJ1Y3R1cmVkUGF0Y2gob2xkRmlsZU5hbWUsIG5ld0ZpbGVOYW1lLCBvbGRTdHIsIG5ld1N0ciwgb2xkSGVhZGVyLCBuZXdIZWFkZXIsIG9wdGlvbnMpO1xuXG4gIGNvbnN0IHJldCA9IFtdO1xuICBpZiAob2xkRmlsZU5hbWUgPT0gbmV3RmlsZU5hbWUpIHtcbiAgICByZXQucHVzaCgnSW5kZXg6ICcgKyBvbGRGaWxlTmFtZSk7XG4gIH1cbiAgcmV0LnB1c2goJz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0nKTtcbiAgcmV0LnB1c2goJy0tLSAnICsgZGlmZi5vbGRGaWxlTmFtZSArICh0eXBlb2YgZGlmZi5vbGRIZWFkZXIgPT09ICd1bmRlZmluZWQnID8gJycgOiAnXFx0JyArIGRpZmYub2xkSGVhZGVyKSk7XG4gIHJldC5wdXNoKCcrKysgJyArIGRpZmYubmV3RmlsZU5hbWUgKyAodHlwZW9mIGRpZmYubmV3SGVhZGVyID09PSAndW5kZWZpbmVkJyA/ICcnIDogJ1xcdCcgKyBkaWZmLm5ld0hlYWRlcikpO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZGlmZi5odW5rcy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGh1bmsgPSBkaWZmLmh1bmtzW2ldO1xuICAgIHJldC5wdXNoKFxuICAgICAgJ0BAIC0nICsgaHVuay5vbGRTdGFydCArICcsJyArIGh1bmsub2xkTGluZXNcbiAgICAgICsgJyArJyArIGh1bmsubmV3U3RhcnQgKyAnLCcgKyBodW5rLm5ld0xpbmVzXG4gICAgICArICcgQEAnXG4gICAgKTtcbiAgICByZXQucHVzaC5hcHBseShyZXQsIGh1bmsubGluZXMpO1xuICB9XG5cbiAgcmV0dXJuIHJldC5qb2luKCdcXG4nKSArICdcXG4nO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUGF0Y2goZmlsZU5hbWUsIG9sZFN0ciwgbmV3U3RyLCBvbGRIZWFkZXIsIG5ld0hlYWRlciwgb3B0aW9ucykge1xuICByZXR1cm4gY3JlYXRlVHdvRmlsZXNQYXRjaChmaWxlTmFtZSwgZmlsZU5hbWUsIG9sZFN0ciwgbmV3U3RyLCBvbGRIZWFkZXIsIG5ld0hlYWRlciwgb3B0aW9ucyk7XG59XG4iLCJleHBvcnQgZnVuY3Rpb24gcGFyc2VQYXRjaCh1bmlEaWZmLCBvcHRpb25zID0ge30pIHtcbiAgbGV0IGRpZmZzdHIgPSB1bmlEaWZmLnNwbGl0KC9cXHJcXG58W1xcblxcdlxcZlxcclxceDg1XS8pLFxuICAgICAgZGVsaW1pdGVycyA9IHVuaURpZmYubWF0Y2goL1xcclxcbnxbXFxuXFx2XFxmXFxyXFx4ODVdL2cpIHx8IFtdLFxuICAgICAgbGlzdCA9IFtdLFxuICAgICAgaSA9IDA7XG5cbiAgZnVuY3Rpb24gcGFyc2VJbmRleCgpIHtcbiAgICBsZXQgaW5kZXggPSB7fTtcbiAgICBsaXN0LnB1c2goaW5kZXgpO1xuXG4gICAgLy8gUGFyc2UgZGlmZiBtZXRhZGF0YVxuICAgIHdoaWxlIChpIDwgZGlmZnN0ci5sZW5ndGgpIHtcbiAgICAgIGxldCBsaW5lID0gZGlmZnN0cltpXTtcblxuICAgICAgLy8gRmlsZSBoZWFkZXIgZm91bmQsIGVuZCBwYXJzaW5nIGRpZmYgbWV0YWRhdGFcbiAgICAgIGlmICgvXihcXC1cXC1cXC18XFwrXFwrXFwrfEBAKVxccy8udGVzdChsaW5lKSkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgLy8gRGlmZiBpbmRleFxuICAgICAgbGV0IGhlYWRlciA9ICgvXig/OkluZGV4OnxkaWZmKD86IC1yIFxcdyspKylcXHMrKC4rPylcXHMqJC8pLmV4ZWMobGluZSk7XG4gICAgICBpZiAoaGVhZGVyKSB7XG4gICAgICAgIGluZGV4LmluZGV4ID0gaGVhZGVyWzFdO1xuICAgICAgfVxuXG4gICAgICBpKys7XG4gICAgfVxuXG4gICAgLy8gUGFyc2UgZmlsZSBoZWFkZXJzIGlmIHRoZXkgYXJlIGRlZmluZWQuIFVuaWZpZWQgZGlmZiByZXF1aXJlcyB0aGVtLCBidXRcbiAgICAvLyB0aGVyZSdzIG5vIHRlY2huaWNhbCBpc3N1ZXMgdG8gaGF2ZSBhbiBpc29sYXRlZCBodW5rIHdpdGhvdXQgZmlsZSBoZWFkZXJcbiAgICBwYXJzZUZpbGVIZWFkZXIoaW5kZXgpO1xuICAgIHBhcnNlRmlsZUhlYWRlcihpbmRleCk7XG5cbiAgICAvLyBQYXJzZSBodW5rc1xuICAgIGluZGV4Lmh1bmtzID0gW107XG5cbiAgICB3aGlsZSAoaSA8IGRpZmZzdHIubGVuZ3RoKSB7XG4gICAgICBsZXQgbGluZSA9IGRpZmZzdHJbaV07XG5cbiAgICAgIGlmICgvXihJbmRleDp8ZGlmZnxcXC1cXC1cXC18XFwrXFwrXFwrKVxccy8udGVzdChsaW5lKSkge1xuICAgICAgICBicmVhaztcbiAgICAgIH0gZWxzZSBpZiAoL15AQC8udGVzdChsaW5lKSkge1xuICAgICAgICBpbmRleC5odW5rcy5wdXNoKHBhcnNlSHVuaygpKTtcbiAgICAgIH0gZWxzZSBpZiAobGluZSAmJiBvcHRpb25zLnN0cmljdCkge1xuICAgICAgICAvLyBJZ25vcmUgdW5leHBlY3RlZCBjb250ZW50IHVubGVzcyBpbiBzdHJpY3QgbW9kZVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vua25vd24gbGluZSAnICsgKGkgKyAxKSArICcgJyArIEpTT04uc3RyaW5naWZ5KGxpbmUpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGkrKztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBQYXJzZXMgdGhlIC0tLSBhbmQgKysrIGhlYWRlcnMsIGlmIG5vbmUgYXJlIGZvdW5kLCBubyBsaW5lc1xuICAvLyBhcmUgY29uc3VtZWQuXG4gIGZ1bmN0aW9uIHBhcnNlRmlsZUhlYWRlcihpbmRleCkge1xuICAgIGNvbnN0IGhlYWRlclBhdHRlcm4gPSAvXigtLS18XFwrXFwrXFwrKVxccysoW1xcUyBdKikoPzpcXHQoLio/KVxccyopPyQvO1xuICAgIGNvbnN0IGZpbGVIZWFkZXIgPSBoZWFkZXJQYXR0ZXJuLmV4ZWMoZGlmZnN0cltpXSk7XG4gICAgaWYgKGZpbGVIZWFkZXIpIHtcbiAgICAgIGxldCBrZXlQcmVmaXggPSBmaWxlSGVhZGVyWzFdID09PSAnLS0tJyA/ICdvbGQnIDogJ25ldyc7XG4gICAgICBpbmRleFtrZXlQcmVmaXggKyAnRmlsZU5hbWUnXSA9IGZpbGVIZWFkZXJbMl07XG4gICAgICBpbmRleFtrZXlQcmVmaXggKyAnSGVhZGVyJ10gPSBmaWxlSGVhZGVyWzNdO1xuXG4gICAgICBpKys7XG4gICAgfVxuICB9XG5cbiAgLy8gUGFyc2VzIGEgaHVua1xuICAvLyBUaGlzIGFzc3VtZXMgdGhhdCB3ZSBhcmUgYXQgdGhlIHN0YXJ0IG9mIGEgaHVuay5cbiAgZnVuY3Rpb24gcGFyc2VIdW5rKCkge1xuICAgIGxldCBjaHVua0hlYWRlckluZGV4ID0gaSxcbiAgICAgICAgY2h1bmtIZWFkZXJMaW5lID0gZGlmZnN0cltpKytdLFxuICAgICAgICBjaHVua0hlYWRlciA9IGNodW5rSGVhZGVyTGluZS5zcGxpdCgvQEAgLShcXGQrKSg/OiwoXFxkKykpPyBcXCsoXFxkKykoPzosKFxcZCspKT8gQEAvKTtcblxuICAgIGxldCBodW5rID0ge1xuICAgICAgb2xkU3RhcnQ6ICtjaHVua0hlYWRlclsxXSxcbiAgICAgIG9sZExpbmVzOiArY2h1bmtIZWFkZXJbMl0gfHwgMSxcbiAgICAgIG5ld1N0YXJ0OiArY2h1bmtIZWFkZXJbM10sXG4gICAgICBuZXdMaW5lczogK2NodW5rSGVhZGVyWzRdIHx8IDEsXG4gICAgICBsaW5lczogW10sXG4gICAgICBsaW5lZGVsaW1pdGVyczogW11cbiAgICB9O1xuXG4gICAgbGV0IGFkZENvdW50ID0gMCxcbiAgICAgICAgcmVtb3ZlQ291bnQgPSAwO1xuICAgIGZvciAoOyBpIDwgZGlmZnN0ci5sZW5ndGg7IGkrKykge1xuICAgICAgLy8gTGluZXMgc3RhcnRpbmcgd2l0aCAnLS0tJyBjb3VsZCBiZSBtaXN0YWtlbiBmb3IgdGhlIFwicmVtb3ZlIGxpbmVcIiBvcGVyYXRpb25cbiAgICAgIC8vIEJ1dCB0aGV5IGNvdWxkIGJlIHRoZSBoZWFkZXIgZm9yIHRoZSBuZXh0IGZpbGUuIFRoZXJlZm9yZSBwcnVuZSBzdWNoIGNhc2VzIG91dC5cbiAgICAgIGlmIChkaWZmc3RyW2ldLmluZGV4T2YoJy0tLSAnKSA9PT0gMFxuICAgICAgICAgICAgJiYgKGkgKyAyIDwgZGlmZnN0ci5sZW5ndGgpXG4gICAgICAgICAgICAmJiBkaWZmc3RyW2kgKyAxXS5pbmRleE9mKCcrKysgJykgPT09IDBcbiAgICAgICAgICAgICYmIGRpZmZzdHJbaSArIDJdLmluZGV4T2YoJ0BAJykgPT09IDApIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGxldCBvcGVyYXRpb24gPSBkaWZmc3RyW2ldWzBdO1xuXG4gICAgICBpZiAob3BlcmF0aW9uID09PSAnKycgfHwgb3BlcmF0aW9uID09PSAnLScgfHwgb3BlcmF0aW9uID09PSAnICcgfHwgb3BlcmF0aW9uID09PSAnXFxcXCcpIHtcbiAgICAgICAgaHVuay5saW5lcy5wdXNoKGRpZmZzdHJbaV0pO1xuICAgICAgICBodW5rLmxpbmVkZWxpbWl0ZXJzLnB1c2goZGVsaW1pdGVyc1tpXSB8fCAnXFxuJyk7XG5cbiAgICAgICAgaWYgKG9wZXJhdGlvbiA9PT0gJysnKSB7XG4gICAgICAgICAgYWRkQ291bnQrKztcbiAgICAgICAgfSBlbHNlIGlmIChvcGVyYXRpb24gPT09ICctJykge1xuICAgICAgICAgIHJlbW92ZUNvdW50Kys7XG4gICAgICAgIH0gZWxzZSBpZiAob3BlcmF0aW9uID09PSAnICcpIHtcbiAgICAgICAgICBhZGRDb3VudCsrO1xuICAgICAgICAgIHJlbW92ZUNvdW50Kys7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEhhbmRsZSB0aGUgZW1wdHkgYmxvY2sgY291bnQgY2FzZVxuICAgIGlmICghYWRkQ291bnQgJiYgaHVuay5uZXdMaW5lcyA9PT0gMSkge1xuICAgICAgaHVuay5uZXdMaW5lcyA9IDA7XG4gICAgfVxuICAgIGlmICghcmVtb3ZlQ291bnQgJiYgaHVuay5vbGRMaW5lcyA9PT0gMSkge1xuICAgICAgaHVuay5vbGRMaW5lcyA9IDA7XG4gICAgfVxuXG4gICAgLy8gUGVyZm9ybSBvcHRpb25hbCBzYW5pdHkgY2hlY2tpbmdcbiAgICBpZiAob3B0aW9ucy5zdHJpY3QpIHtcbiAgICAgIGlmIChhZGRDb3VudCAhPT0gaHVuay5uZXdMaW5lcykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0FkZGVkIGxpbmUgY291bnQgZGlkIG5vdCBtYXRjaCBmb3IgaHVuayBhdCBsaW5lICcgKyAoY2h1bmtIZWFkZXJJbmRleCArIDEpKTtcbiAgICAgIH1cbiAgICAgIGlmIChyZW1vdmVDb3VudCAhPT0gaHVuay5vbGRMaW5lcykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1JlbW92ZWQgbGluZSBjb3VudCBkaWQgbm90IG1hdGNoIGZvciBodW5rIGF0IGxpbmUgJyArIChjaHVua0hlYWRlckluZGV4ICsgMSkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBodW5rO1xuICB9XG5cbiAgd2hpbGUgKGkgPCBkaWZmc3RyLmxlbmd0aCkge1xuICAgIHBhcnNlSW5kZXgoKTtcbiAgfVxuXG4gIHJldHVybiBsaXN0O1xufVxuIiwiLy8gSXRlcmF0b3IgdGhhdCB0cmF2ZXJzZXMgaW4gdGhlIHJhbmdlIG9mIFttaW4sIG1heF0sIHN0ZXBwaW5nXG4vLyBieSBkaXN0YW5jZSBmcm9tIGEgZ2l2ZW4gc3RhcnQgcG9zaXRpb24uIEkuZS4gZm9yIFswLCA0XSwgd2l0aFxuLy8gc3RhcnQgb2YgMiwgdGhpcyB3aWxsIGl0ZXJhdGUgMiwgMywgMSwgNCwgMC5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKHN0YXJ0LCBtaW5MaW5lLCBtYXhMaW5lKSB7XG4gIGxldCB3YW50Rm9yd2FyZCA9IHRydWUsXG4gICAgICBiYWNrd2FyZEV4aGF1c3RlZCA9IGZhbHNlLFxuICAgICAgZm9yd2FyZEV4aGF1c3RlZCA9IGZhbHNlLFxuICAgICAgbG9jYWxPZmZzZXQgPSAxO1xuXG4gIHJldHVybiBmdW5jdGlvbiBpdGVyYXRvcigpIHtcbiAgICBpZiAod2FudEZvcndhcmQgJiYgIWZvcndhcmRFeGhhdXN0ZWQpIHtcbiAgICAgIGlmIChiYWNrd2FyZEV4aGF1c3RlZCkge1xuICAgICAgICBsb2NhbE9mZnNldCsrO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgd2FudEZvcndhcmQgPSBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgLy8gQ2hlY2sgaWYgdHJ5aW5nIHRvIGZpdCBiZXlvbmQgdGV4dCBsZW5ndGgsIGFuZCBpZiBub3QsIGNoZWNrIGl0IGZpdHNcbiAgICAgIC8vIGFmdGVyIG9mZnNldCBsb2NhdGlvbiAob3IgZGVzaXJlZCBsb2NhdGlvbiBvbiBmaXJzdCBpdGVyYXRpb24pXG4gICAgICBpZiAoc3RhcnQgKyBsb2NhbE9mZnNldCA8PSBtYXhMaW5lKSB7XG4gICAgICAgIHJldHVybiBsb2NhbE9mZnNldDtcbiAgICAgIH1cblxuICAgICAgZm9yd2FyZEV4aGF1c3RlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKCFiYWNrd2FyZEV4aGF1c3RlZCkge1xuICAgICAgaWYgKCFmb3J3YXJkRXhoYXVzdGVkKSB7XG4gICAgICAgIHdhbnRGb3J3YXJkID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgLy8gQ2hlY2sgaWYgdHJ5aW5nIHRvIGZpdCBiZWZvcmUgdGV4dCBiZWdpbm5pbmcsIGFuZCBpZiBub3QsIGNoZWNrIGl0IGZpdHNcbiAgICAgIC8vIGJlZm9yZSBvZmZzZXQgbG9jYXRpb25cbiAgICAgIGlmIChtaW5MaW5lIDw9IHN0YXJ0IC0gbG9jYWxPZmZzZXQpIHtcbiAgICAgICAgcmV0dXJuIC1sb2NhbE9mZnNldCsrO1xuICAgICAgfVxuXG4gICAgICBiYWNrd2FyZEV4aGF1c3RlZCA9IHRydWU7XG4gICAgICByZXR1cm4gaXRlcmF0b3IoKTtcbiAgICB9XG5cbiAgICAvLyBXZSB0cmllZCB0byBmaXQgaHVuayBiZWZvcmUgdGV4dCBiZWdpbm5pbmcgYW5kIGJleW9uZCB0ZXh0IGxlbmdodCwgdGhlblxuICAgIC8vIGh1bmsgY2FuJ3QgZml0IG9uIHRoZSB0ZXh0LiBSZXR1cm4gdW5kZWZpbmVkXG4gIH07XG59XG4iLCJleHBvcnQgZnVuY3Rpb24gZ2VuZXJhdGVPcHRpb25zKG9wdGlvbnMsIGRlZmF1bHRzKSB7XG4gIGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGRlZmF1bHRzLmNhbGxiYWNrID0gb3B0aW9ucztcbiAgfSBlbHNlIGlmIChvcHRpb25zKSB7XG4gICAgZm9yIChsZXQgbmFtZSBpbiBvcHRpb25zKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgZWxzZSAqL1xuICAgICAgaWYgKG9wdGlvbnMuaGFzT3duUHJvcGVydHkobmFtZSkpIHtcbiAgICAgICAgZGVmYXVsdHNbbmFtZV0gPSBvcHRpb25zW25hbWVdO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gZGVmYXVsdHM7XG59XG4iLCJcbnZhciBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xudmFyIHRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBmb3JFYWNoIChvYmosIGZuLCBjdHgpIHtcbiAgICBpZiAodG9TdHJpbmcuY2FsbChmbikgIT09ICdbb2JqZWN0IEZ1bmN0aW9uXScpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignaXRlcmF0b3IgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG4gICAgfVxuICAgIHZhciBsID0gb2JqLmxlbmd0aDtcbiAgICBpZiAobCA9PT0gK2wpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgIGZuLmNhbGwoY3R4LCBvYmpbaV0sIGksIG9iaik7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBmb3IgKHZhciBrIGluIG9iaikge1xuICAgICAgICAgICAgaWYgKGhhc093bi5jYWxsKG9iaiwgaykpIHtcbiAgICAgICAgICAgICAgICBmbi5jYWxsKGN0eCwgb2JqW2tdLCBrLCBvYmopO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufTtcblxuIiwiXG52YXIgaW5kZXhPZiA9IFtdLmluZGV4T2Y7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oYXJyLCBvYmope1xuICBpZiAoaW5kZXhPZikgcmV0dXJuIGFyci5pbmRleE9mKG9iaik7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgKytpKSB7XG4gICAgaWYgKGFycltpXSA9PT0gb2JqKSByZXR1cm4gaTtcbiAgfVxuICByZXR1cm4gLTE7XG59OyIsIm1vZHVsZS5leHBvcnRzID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbiAoYXJyKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoYXJyKSA9PSAnW29iamVjdCBBcnJheV0nO1xufTtcbiIsIi8qISBKU09OIHYzLjMuMCB8IGh0dHA6Ly9iZXN0aWVqcy5naXRodWIuaW8vanNvbjMgfCBDb3B5cmlnaHQgMjAxMi0yMDE0LCBLaXQgQ2FtYnJpZGdlIHwgaHR0cDovL2tpdC5taXQtbGljZW5zZS5vcmcgKi9cbjsoZnVuY3Rpb24gKHJvb3QpIHtcbiAgLy8gRGV0ZWN0IHRoZSBgZGVmaW5lYCBmdW5jdGlvbiBleHBvc2VkIGJ5IGFzeW5jaHJvbm91cyBtb2R1bGUgbG9hZGVycy4gVGhlXG4gIC8vIHN0cmljdCBgZGVmaW5lYCBjaGVjayBpcyBuZWNlc3NhcnkgZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBgci5qc2AuXG4gIHZhciBpc0xvYWRlciA9IHR5cGVvZiBkZWZpbmUgPT09IFwiZnVuY3Rpb25cIiAmJiBkZWZpbmUuYW1kO1xuXG4gIC8vIFVzZSB0aGUgYGdsb2JhbGAgb2JqZWN0IGV4cG9zZWQgYnkgTm9kZSAoaW5jbHVkaW5nIEJyb3dzZXJpZnkgdmlhXG4gIC8vIGBpbnNlcnQtbW9kdWxlLWdsb2JhbHNgKSwgTmFyd2hhbCwgYW5kIFJpbmdvIGFzIHRoZSBkZWZhdWx0IGNvbnRleHQuXG4gIC8vIFJoaW5vIGV4cG9ydHMgYSBgZ2xvYmFsYCBmdW5jdGlvbiBpbnN0ZWFkLlxuICB2YXIgZnJlZUdsb2JhbCA9IHR5cGVvZiBnbG9iYWwgPT0gXCJvYmplY3RcIiAmJiBnbG9iYWw7XG4gIGlmIChmcmVlR2xvYmFsICYmIChmcmVlR2xvYmFsW1wiZ2xvYmFsXCJdID09PSBmcmVlR2xvYmFsIHx8IGZyZWVHbG9iYWxbXCJ3aW5kb3dcIl0gPT09IGZyZWVHbG9iYWwpKSB7XG4gICAgcm9vdCA9IGZyZWVHbG9iYWw7XG4gIH1cblxuICAvLyBQdWJsaWM6IEluaXRpYWxpemVzIEpTT04gMyB1c2luZyB0aGUgZ2l2ZW4gYGNvbnRleHRgIG9iamVjdCwgYXR0YWNoaW5nIHRoZVxuICAvLyBgc3RyaW5naWZ5YCBhbmQgYHBhcnNlYCBmdW5jdGlvbnMgdG8gdGhlIHNwZWNpZmllZCBgZXhwb3J0c2Agb2JqZWN0LlxuICBmdW5jdGlvbiBydW5JbkNvbnRleHQoY29udGV4dCwgZXhwb3J0cykge1xuICAgIGNvbnRleHQgfHwgKGNvbnRleHQgPSByb290W1wiT2JqZWN0XCJdKCkpO1xuICAgIGV4cG9ydHMgfHwgKGV4cG9ydHMgPSByb290W1wiT2JqZWN0XCJdKCkpO1xuXG4gICAgLy8gTmF0aXZlIGNvbnN0cnVjdG9yIGFsaWFzZXMuXG4gICAgdmFyIE51bWJlciA9IGNvbnRleHRbXCJOdW1iZXJcIl0gfHwgcm9vdFtcIk51bWJlclwiXSxcbiAgICAgICAgU3RyaW5nID0gY29udGV4dFtcIlN0cmluZ1wiXSB8fCByb290W1wiU3RyaW5nXCJdLFxuICAgICAgICBPYmplY3QgPSBjb250ZXh0W1wiT2JqZWN0XCJdIHx8IHJvb3RbXCJPYmplY3RcIl0sXG4gICAgICAgIERhdGUgPSBjb250ZXh0W1wiRGF0ZVwiXSB8fCByb290W1wiRGF0ZVwiXSxcbiAgICAgICAgU3ludGF4RXJyb3IgPSBjb250ZXh0W1wiU3ludGF4RXJyb3JcIl0gfHwgcm9vdFtcIlN5bnRheEVycm9yXCJdLFxuICAgICAgICBUeXBlRXJyb3IgPSBjb250ZXh0W1wiVHlwZUVycm9yXCJdIHx8IHJvb3RbXCJUeXBlRXJyb3JcIl0sXG4gICAgICAgIE1hdGggPSBjb250ZXh0W1wiTWF0aFwiXSB8fCByb290W1wiTWF0aFwiXSxcbiAgICAgICAgbmF0aXZlSlNPTiA9IGNvbnRleHRbXCJKU09OXCJdIHx8IHJvb3RbXCJKU09OXCJdO1xuXG4gICAgLy8gRGVsZWdhdGUgdG8gdGhlIG5hdGl2ZSBgc3RyaW5naWZ5YCBhbmQgYHBhcnNlYCBpbXBsZW1lbnRhdGlvbnMuXG4gICAgaWYgKHR5cGVvZiBuYXRpdmVKU09OID09IFwib2JqZWN0XCIgJiYgbmF0aXZlSlNPTikge1xuICAgICAgZXhwb3J0cy5zdHJpbmdpZnkgPSBuYXRpdmVKU09OLnN0cmluZ2lmeTtcbiAgICAgIGV4cG9ydHMucGFyc2UgPSBuYXRpdmVKU09OLnBhcnNlO1xuICAgIH1cblxuICAgIC8vIENvbnZlbmllbmNlIGFsaWFzZXMuXG4gICAgdmFyIG9iamVjdFByb3RvID0gT2JqZWN0LnByb3RvdHlwZSxcbiAgICAgICAgZ2V0Q2xhc3MgPSBvYmplY3RQcm90by50b1N0cmluZyxcbiAgICAgICAgaXNQcm9wZXJ0eSwgZm9yRWFjaCwgdW5kZWY7XG5cbiAgICAvLyBUZXN0IHRoZSBgRGF0ZSNnZXRVVEMqYCBtZXRob2RzLiBCYXNlZCBvbiB3b3JrIGJ5IEBZYWZmbGUuXG4gICAgdmFyIGlzRXh0ZW5kZWQgPSBuZXcgRGF0ZSgtMzUwOTgyNzMzNDU3MzI5Mik7XG4gICAgdHJ5IHtcbiAgICAgIC8vIFRoZSBgZ2V0VVRDRnVsbFllYXJgLCBgTW9udGhgLCBhbmQgYERhdGVgIG1ldGhvZHMgcmV0dXJuIG5vbnNlbnNpY2FsXG4gICAgICAvLyByZXN1bHRzIGZvciBjZXJ0YWluIGRhdGVzIGluIE9wZXJhID49IDEwLjUzLlxuICAgICAgaXNFeHRlbmRlZCA9IGlzRXh0ZW5kZWQuZ2V0VVRDRnVsbFllYXIoKSA9PSAtMTA5MjUyICYmIGlzRXh0ZW5kZWQuZ2V0VVRDTW9udGgoKSA9PT0gMCAmJiBpc0V4dGVuZGVkLmdldFVUQ0RhdGUoKSA9PT0gMSAmJlxuICAgICAgICAvLyBTYWZhcmkgPCAyLjAuMiBzdG9yZXMgdGhlIGludGVybmFsIG1pbGxpc2Vjb25kIHRpbWUgdmFsdWUgY29ycmVjdGx5LFxuICAgICAgICAvLyBidXQgY2xpcHMgdGhlIHZhbHVlcyByZXR1cm5lZCBieSB0aGUgZGF0ZSBtZXRob2RzIHRvIHRoZSByYW5nZSBvZlxuICAgICAgICAvLyBzaWduZWQgMzItYml0IGludGVnZXJzIChbLTIgKiogMzEsIDIgKiogMzEgLSAxXSkuXG4gICAgICAgIGlzRXh0ZW5kZWQuZ2V0VVRDSG91cnMoKSA9PSAxMCAmJiBpc0V4dGVuZGVkLmdldFVUQ01pbnV0ZXMoKSA9PSAzNyAmJiBpc0V4dGVuZGVkLmdldFVUQ1NlY29uZHMoKSA9PSA2ICYmIGlzRXh0ZW5kZWQuZ2V0VVRDTWlsbGlzZWNvbmRzKCkgPT0gNzA4O1xuICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge31cblxuICAgIC8vIEludGVybmFsOiBEZXRlcm1pbmVzIHdoZXRoZXIgdGhlIG5hdGl2ZSBgSlNPTi5zdHJpbmdpZnlgIGFuZCBgcGFyc2VgXG4gICAgLy8gaW1wbGVtZW50YXRpb25zIGFyZSBzcGVjLWNvbXBsaWFudC4gQmFzZWQgb24gd29yayBieSBLZW4gU255ZGVyLlxuICAgIGZ1bmN0aW9uIGhhcyhuYW1lKSB7XG4gICAgICBpZiAoaGFzW25hbWVdICE9PSB1bmRlZikge1xuICAgICAgICAvLyBSZXR1cm4gY2FjaGVkIGZlYXR1cmUgdGVzdCByZXN1bHQuXG4gICAgICAgIHJldHVybiBoYXNbbmFtZV07XG4gICAgICB9XG4gICAgICB2YXIgaXNTdXBwb3J0ZWQ7XG4gICAgICBpZiAobmFtZSA9PSBcImJ1Zy1zdHJpbmctY2hhci1pbmRleFwiKSB7XG4gICAgICAgIC8vIElFIDw9IDcgZG9lc24ndCBzdXBwb3J0IGFjY2Vzc2luZyBzdHJpbmcgY2hhcmFjdGVycyB1c2luZyBzcXVhcmVcbiAgICAgICAgLy8gYnJhY2tldCBub3RhdGlvbi4gSUUgOCBvbmx5IHN1cHBvcnRzIHRoaXMgZm9yIHByaW1pdGl2ZXMuXG4gICAgICAgIGlzU3VwcG9ydGVkID0gXCJhXCJbMF0gIT0gXCJhXCI7XG4gICAgICB9IGVsc2UgaWYgKG5hbWUgPT0gXCJqc29uXCIpIHtcbiAgICAgICAgLy8gSW5kaWNhdGVzIHdoZXRoZXIgYm90aCBgSlNPTi5zdHJpbmdpZnlgIGFuZCBgSlNPTi5wYXJzZWAgYXJlXG4gICAgICAgIC8vIHN1cHBvcnRlZC5cbiAgICAgICAgaXNTdXBwb3J0ZWQgPSBoYXMoXCJqc29uLXN0cmluZ2lmeVwiKSAmJiBoYXMoXCJqc29uLXBhcnNlXCIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIHZhbHVlLCBzZXJpYWxpemVkID0gJ3tcImFcIjpbMSx0cnVlLGZhbHNlLG51bGwsXCJcXFxcdTAwMDBcXFxcYlxcXFxuXFxcXGZcXFxcclxcXFx0XCJdfSc7XG4gICAgICAgIC8vIFRlc3QgYEpTT04uc3RyaW5naWZ5YC5cbiAgICAgICAgaWYgKG5hbWUgPT0gXCJqc29uLXN0cmluZ2lmeVwiKSB7XG4gICAgICAgICAgdmFyIHN0cmluZ2lmeSA9IGV4cG9ydHMuc3RyaW5naWZ5LCBzdHJpbmdpZnlTdXBwb3J0ZWQgPSB0eXBlb2Ygc3RyaW5naWZ5ID09IFwiZnVuY3Rpb25cIiAmJiBpc0V4dGVuZGVkO1xuICAgICAgICAgIGlmIChzdHJpbmdpZnlTdXBwb3J0ZWQpIHtcbiAgICAgICAgICAgIC8vIEEgdGVzdCBmdW5jdGlvbiBvYmplY3Qgd2l0aCBhIGN1c3RvbSBgdG9KU09OYCBtZXRob2QuXG4gICAgICAgICAgICAodmFsdWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICAgICAgfSkudG9KU09OID0gdmFsdWU7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBzdHJpbmdpZnlTdXBwb3J0ZWQgPVxuICAgICAgICAgICAgICAgIC8vIEZpcmVmb3ggMy4xYjEgYW5kIGIyIHNlcmlhbGl6ZSBzdHJpbmcsIG51bWJlciwgYW5kIGJvb2xlYW5cbiAgICAgICAgICAgICAgICAvLyBwcmltaXRpdmVzIGFzIG9iamVjdCBsaXRlcmFscy5cbiAgICAgICAgICAgICAgICBzdHJpbmdpZnkoMCkgPT09IFwiMFwiICYmXG4gICAgICAgICAgICAgICAgLy8gRkYgMy4xYjEsIGIyLCBhbmQgSlNPTiAyIHNlcmlhbGl6ZSB3cmFwcGVkIHByaW1pdGl2ZXMgYXMgb2JqZWN0XG4gICAgICAgICAgICAgICAgLy8gbGl0ZXJhbHMuXG4gICAgICAgICAgICAgICAgc3RyaW5naWZ5KG5ldyBOdW1iZXIoKSkgPT09IFwiMFwiICYmXG4gICAgICAgICAgICAgICAgc3RyaW5naWZ5KG5ldyBTdHJpbmcoKSkgPT0gJ1wiXCInICYmXG4gICAgICAgICAgICAgICAgLy8gRkYgMy4xYjEsIDIgdGhyb3cgYW4gZXJyb3IgaWYgdGhlIHZhbHVlIGlzIGBudWxsYCwgYHVuZGVmaW5lZGAsIG9yXG4gICAgICAgICAgICAgICAgLy8gZG9lcyBub3QgZGVmaW5lIGEgY2Fub25pY2FsIEpTT04gcmVwcmVzZW50YXRpb24gKHRoaXMgYXBwbGllcyB0b1xuICAgICAgICAgICAgICAgIC8vIG9iamVjdHMgd2l0aCBgdG9KU09OYCBwcm9wZXJ0aWVzIGFzIHdlbGwsICp1bmxlc3MqIHRoZXkgYXJlIG5lc3RlZFxuICAgICAgICAgICAgICAgIC8vIHdpdGhpbiBhbiBvYmplY3Qgb3IgYXJyYXkpLlxuICAgICAgICAgICAgICAgIHN0cmluZ2lmeShnZXRDbGFzcykgPT09IHVuZGVmICYmXG4gICAgICAgICAgICAgICAgLy8gSUUgOCBzZXJpYWxpemVzIGB1bmRlZmluZWRgIGFzIGBcInVuZGVmaW5lZFwiYC4gU2FmYXJpIDw9IDUuMS43IGFuZFxuICAgICAgICAgICAgICAgIC8vIEZGIDMuMWIzIHBhc3MgdGhpcyB0ZXN0LlxuICAgICAgICAgICAgICAgIHN0cmluZ2lmeSh1bmRlZikgPT09IHVuZGVmICYmXG4gICAgICAgICAgICAgICAgLy8gU2FmYXJpIDw9IDUuMS43IGFuZCBGRiAzLjFiMyB0aHJvdyBgRXJyb3JgcyBhbmQgYFR5cGVFcnJvcmBzLFxuICAgICAgICAgICAgICAgIC8vIHJlc3BlY3RpdmVseSwgaWYgdGhlIHZhbHVlIGlzIG9taXR0ZWQgZW50aXJlbHkuXG4gICAgICAgICAgICAgICAgc3RyaW5naWZ5KCkgPT09IHVuZGVmICYmXG4gICAgICAgICAgICAgICAgLy8gRkYgMy4xYjEsIDIgdGhyb3cgYW4gZXJyb3IgaWYgdGhlIGdpdmVuIHZhbHVlIGlzIG5vdCBhIG51bWJlcixcbiAgICAgICAgICAgICAgICAvLyBzdHJpbmcsIGFycmF5LCBvYmplY3QsIEJvb2xlYW4sIG9yIGBudWxsYCBsaXRlcmFsLiBUaGlzIGFwcGxpZXMgdG9cbiAgICAgICAgICAgICAgICAvLyBvYmplY3RzIHdpdGggY3VzdG9tIGB0b0pTT05gIG1ldGhvZHMgYXMgd2VsbCwgdW5sZXNzIHRoZXkgYXJlIG5lc3RlZFxuICAgICAgICAgICAgICAgIC8vIGluc2lkZSBvYmplY3Qgb3IgYXJyYXkgbGl0ZXJhbHMuIFlVSSAzLjAuMGIxIGlnbm9yZXMgY3VzdG9tIGB0b0pTT05gXG4gICAgICAgICAgICAgICAgLy8gbWV0aG9kcyBlbnRpcmVseS5cbiAgICAgICAgICAgICAgICBzdHJpbmdpZnkodmFsdWUpID09PSBcIjFcIiAmJlxuICAgICAgICAgICAgICAgIHN0cmluZ2lmeShbdmFsdWVdKSA9PSBcIlsxXVwiICYmXG4gICAgICAgICAgICAgICAgLy8gUHJvdG90eXBlIDw9IDEuNi4xIHNlcmlhbGl6ZXMgYFt1bmRlZmluZWRdYCBhcyBgXCJbXVwiYCBpbnN0ZWFkIG9mXG4gICAgICAgICAgICAgICAgLy8gYFwiW251bGxdXCJgLlxuICAgICAgICAgICAgICAgIHN0cmluZ2lmeShbdW5kZWZdKSA9PSBcIltudWxsXVwiICYmXG4gICAgICAgICAgICAgICAgLy8gWVVJIDMuMC4wYjEgZmFpbHMgdG8gc2VyaWFsaXplIGBudWxsYCBsaXRlcmFscy5cbiAgICAgICAgICAgICAgICBzdHJpbmdpZnkobnVsbCkgPT0gXCJudWxsXCIgJiZcbiAgICAgICAgICAgICAgICAvLyBGRiAzLjFiMSwgMiBoYWx0cyBzZXJpYWxpemF0aW9uIGlmIGFuIGFycmF5IGNvbnRhaW5zIGEgZnVuY3Rpb246XG4gICAgICAgICAgICAgICAgLy8gYFsxLCB0cnVlLCBnZXRDbGFzcywgMV1gIHNlcmlhbGl6ZXMgYXMgXCJbMSx0cnVlLF0sXCIuIEZGIDMuMWIzXG4gICAgICAgICAgICAgICAgLy8gZWxpZGVzIG5vbi1KU09OIHZhbHVlcyBmcm9tIG9iamVjdHMgYW5kIGFycmF5cywgdW5sZXNzIHRoZXlcbiAgICAgICAgICAgICAgICAvLyBkZWZpbmUgY3VzdG9tIGB0b0pTT05gIG1ldGhvZHMuXG4gICAgICAgICAgICAgICAgc3RyaW5naWZ5KFt1bmRlZiwgZ2V0Q2xhc3MsIG51bGxdKSA9PSBcIltudWxsLG51bGwsbnVsbF1cIiAmJlxuICAgICAgICAgICAgICAgIC8vIFNpbXBsZSBzZXJpYWxpemF0aW9uIHRlc3QuIEZGIDMuMWIxIHVzZXMgVW5pY29kZSBlc2NhcGUgc2VxdWVuY2VzXG4gICAgICAgICAgICAgICAgLy8gd2hlcmUgY2hhcmFjdGVyIGVzY2FwZSBjb2RlcyBhcmUgZXhwZWN0ZWQgKGUuZy4sIGBcXGJgID0+IGBcXHUwMDA4YCkuXG4gICAgICAgICAgICAgICAgc3RyaW5naWZ5KHsgXCJhXCI6IFt2YWx1ZSwgdHJ1ZSwgZmFsc2UsIG51bGwsIFwiXFx4MDBcXGJcXG5cXGZcXHJcXHRcIl0gfSkgPT0gc2VyaWFsaXplZCAmJlxuICAgICAgICAgICAgICAgIC8vIEZGIDMuMWIxIGFuZCBiMiBpZ25vcmUgdGhlIGBmaWx0ZXJgIGFuZCBgd2lkdGhgIGFyZ3VtZW50cy5cbiAgICAgICAgICAgICAgICBzdHJpbmdpZnkobnVsbCwgdmFsdWUpID09PSBcIjFcIiAmJlxuICAgICAgICAgICAgICAgIHN0cmluZ2lmeShbMSwgMl0sIG51bGwsIDEpID09IFwiW1xcbiAxLFxcbiAyXFxuXVwiICYmXG4gICAgICAgICAgICAgICAgLy8gSlNPTiAyLCBQcm90b3R5cGUgPD0gMS43LCBhbmQgb2xkZXIgV2ViS2l0IGJ1aWxkcyBpbmNvcnJlY3RseVxuICAgICAgICAgICAgICAgIC8vIHNlcmlhbGl6ZSBleHRlbmRlZCB5ZWFycy5cbiAgICAgICAgICAgICAgICBzdHJpbmdpZnkobmV3IERhdGUoLTguNjRlMTUpKSA9PSAnXCItMjcxODIxLTA0LTIwVDAwOjAwOjAwLjAwMFpcIicgJiZcbiAgICAgICAgICAgICAgICAvLyBUaGUgbWlsbGlzZWNvbmRzIGFyZSBvcHRpb25hbCBpbiBFUyA1LCBidXQgcmVxdWlyZWQgaW4gNS4xLlxuICAgICAgICAgICAgICAgIHN0cmluZ2lmeShuZXcgRGF0ZSg4LjY0ZTE1KSkgPT0gJ1wiKzI3NTc2MC0wOS0xM1QwMDowMDowMC4wMDBaXCInICYmXG4gICAgICAgICAgICAgICAgLy8gRmlyZWZveCA8PSAxMS4wIGluY29ycmVjdGx5IHNlcmlhbGl6ZXMgeWVhcnMgcHJpb3IgdG8gMCBhcyBuZWdhdGl2ZVxuICAgICAgICAgICAgICAgIC8vIGZvdXItZGlnaXQgeWVhcnMgaW5zdGVhZCBvZiBzaXgtZGlnaXQgeWVhcnMuIENyZWRpdHM6IEBZYWZmbGUuXG4gICAgICAgICAgICAgICAgc3RyaW5naWZ5KG5ldyBEYXRlKC02MjE5ODc1NTJlNSkpID09ICdcIi0wMDAwMDEtMDEtMDFUMDA6MDA6MDAuMDAwWlwiJyAmJlxuICAgICAgICAgICAgICAgIC8vIFNhZmFyaSA8PSA1LjEuNSBhbmQgT3BlcmEgPj0gMTAuNTMgaW5jb3JyZWN0bHkgc2VyaWFsaXplIG1pbGxpc2Vjb25kXG4gICAgICAgICAgICAgICAgLy8gdmFsdWVzIGxlc3MgdGhhbiAxMDAwLiBDcmVkaXRzOiBAWWFmZmxlLlxuICAgICAgICAgICAgICAgIHN0cmluZ2lmeShuZXcgRGF0ZSgtMSkpID09ICdcIjE5NjktMTItMzFUMjM6NTk6NTkuOTk5WlwiJztcbiAgICAgICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge1xuICAgICAgICAgICAgICBzdHJpbmdpZnlTdXBwb3J0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaXNTdXBwb3J0ZWQgPSBzdHJpbmdpZnlTdXBwb3J0ZWQ7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVGVzdCBgSlNPTi5wYXJzZWAuXG4gICAgICAgIGlmIChuYW1lID09IFwianNvbi1wYXJzZVwiKSB7XG4gICAgICAgICAgdmFyIHBhcnNlID0gZXhwb3J0cy5wYXJzZTtcbiAgICAgICAgICBpZiAodHlwZW9mIHBhcnNlID09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgLy8gRkYgMy4xYjEsIGIyIHdpbGwgdGhyb3cgYW4gZXhjZXB0aW9uIGlmIGEgYmFyZSBsaXRlcmFsIGlzIHByb3ZpZGVkLlxuICAgICAgICAgICAgICAvLyBDb25mb3JtaW5nIGltcGxlbWVudGF0aW9ucyBzaG91bGQgYWxzbyBjb2VyY2UgdGhlIGluaXRpYWwgYXJndW1lbnQgdG9cbiAgICAgICAgICAgICAgLy8gYSBzdHJpbmcgcHJpb3IgdG8gcGFyc2luZy5cbiAgICAgICAgICAgICAgaWYgKHBhcnNlKFwiMFwiKSA9PT0gMCAmJiAhcGFyc2UoZmFsc2UpKSB7XG4gICAgICAgICAgICAgICAgLy8gU2ltcGxlIHBhcnNpbmcgdGVzdC5cbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHBhcnNlKHNlcmlhbGl6ZWQpO1xuICAgICAgICAgICAgICAgIHZhciBwYXJzZVN1cHBvcnRlZCA9IHZhbHVlW1wiYVwiXS5sZW5ndGggPT0gNSAmJiB2YWx1ZVtcImFcIl1bMF0gPT09IDE7XG4gICAgICAgICAgICAgICAgaWYgKHBhcnNlU3VwcG9ydGVkKSB7XG4gICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAvLyBTYWZhcmkgPD0gNS4xLjIgYW5kIEZGIDMuMWIxIGFsbG93IHVuZXNjYXBlZCB0YWJzIGluIHN0cmluZ3MuXG4gICAgICAgICAgICAgICAgICAgIHBhcnNlU3VwcG9ydGVkID0gIXBhcnNlKCdcIlxcdFwiJyk7XG4gICAgICAgICAgICAgICAgICB9IGNhdGNoIChleGNlcHRpb24pIHt9XG4gICAgICAgICAgICAgICAgICBpZiAocGFyc2VTdXBwb3J0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAvLyBGRiA0LjAgYW5kIDQuMC4xIGFsbG93IGxlYWRpbmcgYCtgIHNpZ25zIGFuZCBsZWFkaW5nXG4gICAgICAgICAgICAgICAgICAgICAgLy8gZGVjaW1hbCBwb2ludHMuIEZGIDQuMCwgNC4wLjEsIGFuZCBJRSA5LTEwIGFsc28gYWxsb3dcbiAgICAgICAgICAgICAgICAgICAgICAvLyBjZXJ0YWluIG9jdGFsIGxpdGVyYWxzLlxuICAgICAgICAgICAgICAgICAgICAgIHBhcnNlU3VwcG9ydGVkID0gcGFyc2UoXCIwMVwiKSAhPT0gMTtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7fVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgaWYgKHBhcnNlU3VwcG9ydGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgLy8gRkYgNC4wLCA0LjAuMSwgYW5kIFJoaW5vIDEuN1IzLVI0IGFsbG93IHRyYWlsaW5nIGRlY2ltYWxcbiAgICAgICAgICAgICAgICAgICAgICAvLyBwb2ludHMuIFRoZXNlIGVudmlyb25tZW50cywgYWxvbmcgd2l0aCBGRiAzLjFiMSBhbmQgMixcbiAgICAgICAgICAgICAgICAgICAgICAvLyBhbHNvIGFsbG93IHRyYWlsaW5nIGNvbW1hcyBpbiBKU09OIG9iamVjdHMgYW5kIGFycmF5cy5cbiAgICAgICAgICAgICAgICAgICAgICBwYXJzZVN1cHBvcnRlZCA9IHBhcnNlKFwiMS5cIikgIT09IDE7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge31cbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge1xuICAgICAgICAgICAgICBwYXJzZVN1cHBvcnRlZCA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpc1N1cHBvcnRlZCA9IHBhcnNlU3VwcG9ydGVkO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gaGFzW25hbWVdID0gISFpc1N1cHBvcnRlZDtcbiAgICB9XG5cbiAgICBpZiAoIWhhcyhcImpzb25cIikpIHtcbiAgICAgIC8vIENvbW1vbiBgW1tDbGFzc11dYCBuYW1lIGFsaWFzZXMuXG4gICAgICB2YXIgZnVuY3Rpb25DbGFzcyA9IFwiW29iamVjdCBGdW5jdGlvbl1cIixcbiAgICAgICAgICBkYXRlQ2xhc3MgPSBcIltvYmplY3QgRGF0ZV1cIixcbiAgICAgICAgICBudW1iZXJDbGFzcyA9IFwiW29iamVjdCBOdW1iZXJdXCIsXG4gICAgICAgICAgc3RyaW5nQ2xhc3MgPSBcIltvYmplY3QgU3RyaW5nXVwiLFxuICAgICAgICAgIGFycmF5Q2xhc3MgPSBcIltvYmplY3QgQXJyYXldXCIsXG4gICAgICAgICAgYm9vbGVhbkNsYXNzID0gXCJbb2JqZWN0IEJvb2xlYW5dXCI7XG5cbiAgICAgIC8vIERldGVjdCBpbmNvbXBsZXRlIHN1cHBvcnQgZm9yIGFjY2Vzc2luZyBzdHJpbmcgY2hhcmFjdGVycyBieSBpbmRleC5cbiAgICAgIHZhciBjaGFySW5kZXhCdWdneSA9IGhhcyhcImJ1Zy1zdHJpbmctY2hhci1pbmRleFwiKTtcblxuICAgICAgLy8gRGVmaW5lIGFkZGl0aW9uYWwgdXRpbGl0eSBtZXRob2RzIGlmIHRoZSBgRGF0ZWAgbWV0aG9kcyBhcmUgYnVnZ3kuXG4gICAgICBpZiAoIWlzRXh0ZW5kZWQpIHtcbiAgICAgICAgdmFyIGZsb29yID0gTWF0aC5mbG9vcjtcbiAgICAgICAgLy8gQSBtYXBwaW5nIGJldHdlZW4gdGhlIG1vbnRocyBvZiB0aGUgeWVhciBhbmQgdGhlIG51bWJlciBvZiBkYXlzIGJldHdlZW5cbiAgICAgICAgLy8gSmFudWFyeSAxc3QgYW5kIHRoZSBmaXJzdCBvZiB0aGUgcmVzcGVjdGl2ZSBtb250aC5cbiAgICAgICAgdmFyIE1vbnRocyA9IFswLCAzMSwgNTksIDkwLCAxMjAsIDE1MSwgMTgxLCAyMTIsIDI0MywgMjczLCAzMDQsIDMzNF07XG4gICAgICAgIC8vIEludGVybmFsOiBDYWxjdWxhdGVzIHRoZSBudW1iZXIgb2YgZGF5cyBiZXR3ZWVuIHRoZSBVbml4IGVwb2NoIGFuZCB0aGVcbiAgICAgICAgLy8gZmlyc3QgZGF5IG9mIHRoZSBnaXZlbiBtb250aC5cbiAgICAgICAgdmFyIGdldERheSA9IGZ1bmN0aW9uICh5ZWFyLCBtb250aCkge1xuICAgICAgICAgIHJldHVybiBNb250aHNbbW9udGhdICsgMzY1ICogKHllYXIgLSAxOTcwKSArIGZsb29yKCh5ZWFyIC0gMTk2OSArIChtb250aCA9ICsobW9udGggPiAxKSkpIC8gNCkgLSBmbG9vcigoeWVhciAtIDE5MDEgKyBtb250aCkgLyAxMDApICsgZmxvb3IoKHllYXIgLSAxNjAxICsgbW9udGgpIC8gNDAwKTtcbiAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgLy8gSW50ZXJuYWw6IERldGVybWluZXMgaWYgYSBwcm9wZXJ0eSBpcyBhIGRpcmVjdCBwcm9wZXJ0eSBvZiB0aGUgZ2l2ZW5cbiAgICAgIC8vIG9iamVjdC4gRGVsZWdhdGVzIHRvIHRoZSBuYXRpdmUgYE9iamVjdCNoYXNPd25Qcm9wZXJ0eWAgbWV0aG9kLlxuICAgICAgaWYgKCEoaXNQcm9wZXJ0eSA9IG9iamVjdFByb3RvLmhhc093blByb3BlcnR5KSkge1xuICAgICAgICBpc1Byb3BlcnR5ID0gZnVuY3Rpb24gKHByb3BlcnR5KSB7XG4gICAgICAgICAgdmFyIG1lbWJlcnMgPSB7fSwgY29uc3RydWN0b3I7XG4gICAgICAgICAgaWYgKChtZW1iZXJzLl9fcHJvdG9fXyA9IG51bGwsIG1lbWJlcnMuX19wcm90b19fID0ge1xuICAgICAgICAgICAgLy8gVGhlICpwcm90byogcHJvcGVydHkgY2Fubm90IGJlIHNldCBtdWx0aXBsZSB0aW1lcyBpbiByZWNlbnRcbiAgICAgICAgICAgIC8vIHZlcnNpb25zIG9mIEZpcmVmb3ggYW5kIFNlYU1vbmtleS5cbiAgICAgICAgICAgIFwidG9TdHJpbmdcIjogMVxuICAgICAgICAgIH0sIG1lbWJlcnMpLnRvU3RyaW5nICE9IGdldENsYXNzKSB7XG4gICAgICAgICAgICAvLyBTYWZhcmkgPD0gMi4wLjMgZG9lc24ndCBpbXBsZW1lbnQgYE9iamVjdCNoYXNPd25Qcm9wZXJ0eWAsIGJ1dFxuICAgICAgICAgICAgLy8gc3VwcG9ydHMgdGhlIG11dGFibGUgKnByb3RvKiBwcm9wZXJ0eS5cbiAgICAgICAgICAgIGlzUHJvcGVydHkgPSBmdW5jdGlvbiAocHJvcGVydHkpIHtcbiAgICAgICAgICAgICAgLy8gQ2FwdHVyZSBhbmQgYnJlYWsgdGhlIG9iamVjdGdzIHByb3RvdHlwZSBjaGFpbiAoc2VlIHNlY3Rpb24gOC42LjJcbiAgICAgICAgICAgICAgLy8gb2YgdGhlIEVTIDUuMSBzcGVjKS4gVGhlIHBhcmVudGhlc2l6ZWQgZXhwcmVzc2lvbiBwcmV2ZW50cyBhblxuICAgICAgICAgICAgICAvLyB1bnNhZmUgdHJhbnNmb3JtYXRpb24gYnkgdGhlIENsb3N1cmUgQ29tcGlsZXIuXG4gICAgICAgICAgICAgIHZhciBvcmlnaW5hbCA9IHRoaXMuX19wcm90b19fLCByZXN1bHQgPSBwcm9wZXJ0eSBpbiAodGhpcy5fX3Byb3RvX18gPSBudWxsLCB0aGlzKTtcbiAgICAgICAgICAgICAgLy8gUmVzdG9yZSB0aGUgb3JpZ2luYWwgcHJvdG90eXBlIGNoYWluLlxuICAgICAgICAgICAgICB0aGlzLl9fcHJvdG9fXyA9IG9yaWdpbmFsO1xuICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gQ2FwdHVyZSBhIHJlZmVyZW5jZSB0byB0aGUgdG9wLWxldmVsIGBPYmplY3RgIGNvbnN0cnVjdG9yLlxuICAgICAgICAgICAgY29uc3RydWN0b3IgPSBtZW1iZXJzLmNvbnN0cnVjdG9yO1xuICAgICAgICAgICAgLy8gVXNlIHRoZSBgY29uc3RydWN0b3JgIHByb3BlcnR5IHRvIHNpbXVsYXRlIGBPYmplY3QjaGFzT3duUHJvcGVydHlgIGluXG4gICAgICAgICAgICAvLyBvdGhlciBlbnZpcm9ubWVudHMuXG4gICAgICAgICAgICBpc1Byb3BlcnR5ID0gZnVuY3Rpb24gKHByb3BlcnR5KSB7XG4gICAgICAgICAgICAgIHZhciBwYXJlbnQgPSAodGhpcy5jb25zdHJ1Y3RvciB8fCBjb25zdHJ1Y3RvcikucHJvdG90eXBlO1xuICAgICAgICAgICAgICByZXR1cm4gcHJvcGVydHkgaW4gdGhpcyAmJiAhKHByb3BlcnR5IGluIHBhcmVudCAmJiB0aGlzW3Byb3BlcnR5XSA9PT0gcGFyZW50W3Byb3BlcnR5XSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH1cbiAgICAgICAgICBtZW1iZXJzID0gbnVsbDtcbiAgICAgICAgICByZXR1cm4gaXNQcm9wZXJ0eS5jYWxsKHRoaXMsIHByb3BlcnR5KTtcbiAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgLy8gSW50ZXJuYWw6IEEgc2V0IG9mIHByaW1pdGl2ZSB0eXBlcyB1c2VkIGJ5IGBpc0hvc3RUeXBlYC5cbiAgICAgIHZhciBQcmltaXRpdmVUeXBlcyA9IHtcbiAgICAgICAgXCJib29sZWFuXCI6IDEsXG4gICAgICAgIFwibnVtYmVyXCI6IDEsXG4gICAgICAgIFwic3RyaW5nXCI6IDEsXG4gICAgICAgIFwidW5kZWZpbmVkXCI6IDFcbiAgICAgIH07XG5cbiAgICAgIC8vIEludGVybmFsOiBEZXRlcm1pbmVzIGlmIHRoZSBnaXZlbiBvYmplY3QgYHByb3BlcnR5YCB2YWx1ZSBpcyBhXG4gICAgICAvLyBub24tcHJpbWl0aXZlLlxuICAgICAgdmFyIGlzSG9zdFR5cGUgPSBmdW5jdGlvbiAob2JqZWN0LCBwcm9wZXJ0eSkge1xuICAgICAgICB2YXIgdHlwZSA9IHR5cGVvZiBvYmplY3RbcHJvcGVydHldO1xuICAgICAgICByZXR1cm4gdHlwZSA9PSBcIm9iamVjdFwiID8gISFvYmplY3RbcHJvcGVydHldIDogIVByaW1pdGl2ZVR5cGVzW3R5cGVdO1xuICAgICAgfTtcblxuICAgICAgLy8gSW50ZXJuYWw6IE5vcm1hbGl6ZXMgdGhlIGBmb3IuLi5pbmAgaXRlcmF0aW9uIGFsZ29yaXRobSBhY3Jvc3NcbiAgICAgIC8vIGVudmlyb25tZW50cy4gRWFjaCBlbnVtZXJhdGVkIGtleSBpcyB5aWVsZGVkIHRvIGEgYGNhbGxiYWNrYCBmdW5jdGlvbi5cbiAgICAgIGZvckVhY2ggPSBmdW5jdGlvbiAob2JqZWN0LCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgc2l6ZSA9IDAsIFByb3BlcnRpZXMsIG1lbWJlcnMsIHByb3BlcnR5O1xuXG4gICAgICAgIC8vIFRlc3RzIGZvciBidWdzIGluIHRoZSBjdXJyZW50IGVudmlyb25tZW50J3MgYGZvci4uLmluYCBhbGdvcml0aG0uIFRoZVxuICAgICAgICAvLyBgdmFsdWVPZmAgcHJvcGVydHkgaW5oZXJpdHMgdGhlIG5vbi1lbnVtZXJhYmxlIGZsYWcgZnJvbVxuICAgICAgICAvLyBgT2JqZWN0LnByb3RvdHlwZWAgaW4gb2xkZXIgdmVyc2lvbnMgb2YgSUUsIE5ldHNjYXBlLCBhbmQgTW96aWxsYS5cbiAgICAgICAgKFByb3BlcnRpZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgdGhpcy52YWx1ZU9mID0gMDtcbiAgICAgICAgfSkucHJvdG90eXBlLnZhbHVlT2YgPSAwO1xuXG4gICAgICAgIC8vIEl0ZXJhdGUgb3ZlciBhIG5ldyBpbnN0YW5jZSBvZiB0aGUgYFByb3BlcnRpZXNgIGNsYXNzLlxuICAgICAgICBtZW1iZXJzID0gbmV3IFByb3BlcnRpZXMoKTtcbiAgICAgICAgZm9yIChwcm9wZXJ0eSBpbiBtZW1iZXJzKSB7XG4gICAgICAgICAgLy8gSWdub3JlIGFsbCBwcm9wZXJ0aWVzIGluaGVyaXRlZCBmcm9tIGBPYmplY3QucHJvdG90eXBlYC5cbiAgICAgICAgICBpZiAoaXNQcm9wZXJ0eS5jYWxsKG1lbWJlcnMsIHByb3BlcnR5KSkge1xuICAgICAgICAgICAgc2l6ZSsrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBQcm9wZXJ0aWVzID0gbWVtYmVycyA9IG51bGw7XG5cbiAgICAgICAgLy8gTm9ybWFsaXplIHRoZSBpdGVyYXRpb24gYWxnb3JpdGhtLlxuICAgICAgICBpZiAoIXNpemUpIHtcbiAgICAgICAgICAvLyBBIGxpc3Qgb2Ygbm9uLWVudW1lcmFibGUgcHJvcGVydGllcyBpbmhlcml0ZWQgZnJvbSBgT2JqZWN0LnByb3RvdHlwZWAuXG4gICAgICAgICAgbWVtYmVycyA9IFtcInZhbHVlT2ZcIiwgXCJ0b1N0cmluZ1wiLCBcInRvTG9jYWxlU3RyaW5nXCIsIFwicHJvcGVydHlJc0VudW1lcmFibGVcIiwgXCJpc1Byb3RvdHlwZU9mXCIsIFwiaGFzT3duUHJvcGVydHlcIiwgXCJjb25zdHJ1Y3RvclwiXTtcbiAgICAgICAgICAvLyBJRSA8PSA4LCBNb3ppbGxhIDEuMCwgYW5kIE5ldHNjYXBlIDYuMiBpZ25vcmUgc2hhZG93ZWQgbm9uLWVudW1lcmFibGVcbiAgICAgICAgICAvLyBwcm9wZXJ0aWVzLlxuICAgICAgICAgIGZvckVhY2ggPSBmdW5jdGlvbiAob2JqZWN0LCBjYWxsYmFjaykge1xuICAgICAgICAgICAgdmFyIGlzRnVuY3Rpb24gPSBnZXRDbGFzcy5jYWxsKG9iamVjdCkgPT0gZnVuY3Rpb25DbGFzcywgcHJvcGVydHksIGxlbmd0aDtcbiAgICAgICAgICAgIHZhciBoYXNQcm9wZXJ0eSA9ICFpc0Z1bmN0aW9uICYmIHR5cGVvZiBvYmplY3QuY29uc3RydWN0b3IgIT0gXCJmdW5jdGlvblwiICYmIGlzSG9zdFR5cGUob2JqZWN0LCBcImhhc093blByb3BlcnR5XCIpID8gb2JqZWN0Lmhhc093blByb3BlcnR5IDogaXNQcm9wZXJ0eTtcbiAgICAgICAgICAgIGZvciAocHJvcGVydHkgaW4gb2JqZWN0KSB7XG4gICAgICAgICAgICAgIC8vIEdlY2tvIDw9IDEuMCBlbnVtZXJhdGVzIHRoZSBgcHJvdG90eXBlYCBwcm9wZXJ0eSBvZiBmdW5jdGlvbnMgdW5kZXJcbiAgICAgICAgICAgICAgLy8gY2VydGFpbiBjb25kaXRpb25zOyBJRSBkb2VzIG5vdC5cbiAgICAgICAgICAgICAgaWYgKCEoaXNGdW5jdGlvbiAmJiBwcm9wZXJ0eSA9PSBcInByb3RvdHlwZVwiKSAmJiBoYXNQcm9wZXJ0eS5jYWxsKG9iamVjdCwgcHJvcGVydHkpKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2socHJvcGVydHkpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBNYW51YWxseSBpbnZva2UgdGhlIGNhbGxiYWNrIGZvciBlYWNoIG5vbi1lbnVtZXJhYmxlIHByb3BlcnR5LlxuICAgICAgICAgICAgZm9yIChsZW5ndGggPSBtZW1iZXJzLmxlbmd0aDsgcHJvcGVydHkgPSBtZW1iZXJzWy0tbGVuZ3RoXTsgaGFzUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3BlcnR5KSAmJiBjYWxsYmFjayhwcm9wZXJ0eSkpO1xuICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSBpZiAoc2l6ZSA9PSAyKSB7XG4gICAgICAgICAgLy8gU2FmYXJpIDw9IDIuMC40IGVudW1lcmF0ZXMgc2hhZG93ZWQgcHJvcGVydGllcyB0d2ljZS5cbiAgICAgICAgICBmb3JFYWNoID0gZnVuY3Rpb24gKG9iamVjdCwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIC8vIENyZWF0ZSBhIHNldCBvZiBpdGVyYXRlZCBwcm9wZXJ0aWVzLlxuICAgICAgICAgICAgdmFyIG1lbWJlcnMgPSB7fSwgaXNGdW5jdGlvbiA9IGdldENsYXNzLmNhbGwob2JqZWN0KSA9PSBmdW5jdGlvbkNsYXNzLCBwcm9wZXJ0eTtcbiAgICAgICAgICAgIGZvciAocHJvcGVydHkgaW4gb2JqZWN0KSB7XG4gICAgICAgICAgICAgIC8vIFN0b3JlIGVhY2ggcHJvcGVydHkgbmFtZSB0byBwcmV2ZW50IGRvdWJsZSBlbnVtZXJhdGlvbi4gVGhlXG4gICAgICAgICAgICAgIC8vIGBwcm90b3R5cGVgIHByb3BlcnR5IG9mIGZ1bmN0aW9ucyBpcyBub3QgZW51bWVyYXRlZCBkdWUgdG8gY3Jvc3MtXG4gICAgICAgICAgICAgIC8vIGVudmlyb25tZW50IGluY29uc2lzdGVuY2llcy5cbiAgICAgICAgICAgICAgaWYgKCEoaXNGdW5jdGlvbiAmJiBwcm9wZXJ0eSA9PSBcInByb3RvdHlwZVwiKSAmJiAhaXNQcm9wZXJ0eS5jYWxsKG1lbWJlcnMsIHByb3BlcnR5KSAmJiAobWVtYmVyc1twcm9wZXJ0eV0gPSAxKSAmJiBpc1Byb3BlcnR5LmNhbGwob2JqZWN0LCBwcm9wZXJ0eSkpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhwcm9wZXJ0eSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIE5vIGJ1Z3MgZGV0ZWN0ZWQ7IHVzZSB0aGUgc3RhbmRhcmQgYGZvci4uLmluYCBhbGdvcml0aG0uXG4gICAgICAgICAgZm9yRWFjaCA9IGZ1bmN0aW9uIChvYmplY3QsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICB2YXIgaXNGdW5jdGlvbiA9IGdldENsYXNzLmNhbGwob2JqZWN0KSA9PSBmdW5jdGlvbkNsYXNzLCBwcm9wZXJ0eSwgaXNDb25zdHJ1Y3RvcjtcbiAgICAgICAgICAgIGZvciAocHJvcGVydHkgaW4gb2JqZWN0KSB7XG4gICAgICAgICAgICAgIGlmICghKGlzRnVuY3Rpb24gJiYgcHJvcGVydHkgPT0gXCJwcm90b3R5cGVcIikgJiYgaXNQcm9wZXJ0eS5jYWxsKG9iamVjdCwgcHJvcGVydHkpICYmICEoaXNDb25zdHJ1Y3RvciA9IHByb3BlcnR5ID09PSBcImNvbnN0cnVjdG9yXCIpKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2socHJvcGVydHkpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBNYW51YWxseSBpbnZva2UgdGhlIGNhbGxiYWNrIGZvciB0aGUgYGNvbnN0cnVjdG9yYCBwcm9wZXJ0eSBkdWUgdG9cbiAgICAgICAgICAgIC8vIGNyb3NzLWVudmlyb25tZW50IGluY29uc2lzdGVuY2llcy5cbiAgICAgICAgICAgIGlmIChpc0NvbnN0cnVjdG9yIHx8IGlzUHJvcGVydHkuY2FsbChvYmplY3QsIChwcm9wZXJ0eSA9IFwiY29uc3RydWN0b3JcIikpKSB7XG4gICAgICAgICAgICAgIGNhbGxiYWNrKHByb3BlcnR5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmb3JFYWNoKG9iamVjdCwgY2FsbGJhY2spO1xuICAgICAgfTtcblxuICAgICAgLy8gUHVibGljOiBTZXJpYWxpemVzIGEgSmF2YVNjcmlwdCBgdmFsdWVgIGFzIGEgSlNPTiBzdHJpbmcuIFRoZSBvcHRpb25hbFxuICAgICAgLy8gYGZpbHRlcmAgYXJndW1lbnQgbWF5IHNwZWNpZnkgZWl0aGVyIGEgZnVuY3Rpb24gdGhhdCBhbHRlcnMgaG93IG9iamVjdCBhbmRcbiAgICAgIC8vIGFycmF5IG1lbWJlcnMgYXJlIHNlcmlhbGl6ZWQsIG9yIGFuIGFycmF5IG9mIHN0cmluZ3MgYW5kIG51bWJlcnMgdGhhdFxuICAgICAgLy8gaW5kaWNhdGVzIHdoaWNoIHByb3BlcnRpZXMgc2hvdWxkIGJlIHNlcmlhbGl6ZWQuIFRoZSBvcHRpb25hbCBgd2lkdGhgXG4gICAgICAvLyBhcmd1bWVudCBtYXkgYmUgZWl0aGVyIGEgc3RyaW5nIG9yIG51bWJlciB0aGF0IHNwZWNpZmllcyB0aGUgaW5kZW50YXRpb25cbiAgICAgIC8vIGxldmVsIG9mIHRoZSBvdXRwdXQuXG4gICAgICBpZiAoIWhhcyhcImpzb24tc3RyaW5naWZ5XCIpKSB7XG4gICAgICAgIC8vIEludGVybmFsOiBBIG1hcCBvZiBjb250cm9sIGNoYXJhY3RlcnMgYW5kIHRoZWlyIGVzY2FwZWQgZXF1aXZhbGVudHMuXG4gICAgICAgIHZhciBFc2NhcGVzID0ge1xuICAgICAgICAgIDkyOiBcIlxcXFxcXFxcXCIsXG4gICAgICAgICAgMzQ6ICdcXFxcXCInLFxuICAgICAgICAgIDg6IFwiXFxcXGJcIixcbiAgICAgICAgICAxMjogXCJcXFxcZlwiLFxuICAgICAgICAgIDEwOiBcIlxcXFxuXCIsXG4gICAgICAgICAgMTM6IFwiXFxcXHJcIixcbiAgICAgICAgICA5OiBcIlxcXFx0XCJcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBJbnRlcm5hbDogQ29udmVydHMgYHZhbHVlYCBpbnRvIGEgemVyby1wYWRkZWQgc3RyaW5nIHN1Y2ggdGhhdCBpdHNcbiAgICAgICAgLy8gbGVuZ3RoIGlzIGF0IGxlYXN0IGVxdWFsIHRvIGB3aWR0aGAuIFRoZSBgd2lkdGhgIG11c3QgYmUgPD0gNi5cbiAgICAgICAgdmFyIGxlYWRpbmdaZXJvZXMgPSBcIjAwMDAwMFwiO1xuICAgICAgICB2YXIgdG9QYWRkZWRTdHJpbmcgPSBmdW5jdGlvbiAod2lkdGgsIHZhbHVlKSB7XG4gICAgICAgICAgLy8gVGhlIGB8fCAwYCBleHByZXNzaW9uIGlzIG5lY2Vzc2FyeSB0byB3b3JrIGFyb3VuZCBhIGJ1ZyBpblxuICAgICAgICAgIC8vIE9wZXJhIDw9IDcuNTR1MiB3aGVyZSBgMCA9PSAtMGAsIGJ1dCBgU3RyaW5nKC0wKSAhPT0gXCIwXCJgLlxuICAgICAgICAgIHJldHVybiAobGVhZGluZ1plcm9lcyArICh2YWx1ZSB8fCAwKSkuc2xpY2UoLXdpZHRoKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBJbnRlcm5hbDogRG91YmxlLXF1b3RlcyBhIHN0cmluZyBgdmFsdWVgLCByZXBsYWNpbmcgYWxsIEFTQ0lJIGNvbnRyb2xcbiAgICAgICAgLy8gY2hhcmFjdGVycyAoY2hhcmFjdGVycyB3aXRoIGNvZGUgdW5pdCB2YWx1ZXMgYmV0d2VlbiAwIGFuZCAzMSkgd2l0aFxuICAgICAgICAvLyB0aGVpciBlc2NhcGVkIGVxdWl2YWxlbnRzLiBUaGlzIGlzIGFuIGltcGxlbWVudGF0aW9uIG9mIHRoZVxuICAgICAgICAvLyBgUXVvdGUodmFsdWUpYCBvcGVyYXRpb24gZGVmaW5lZCBpbiBFUyA1LjEgc2VjdGlvbiAxNS4xMi4zLlxuICAgICAgICB2YXIgdW5pY29kZVByZWZpeCA9IFwiXFxcXHUwMFwiO1xuICAgICAgICB2YXIgcXVvdGUgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICB2YXIgcmVzdWx0ID0gJ1wiJywgaW5kZXggPSAwLCBsZW5ndGggPSB2YWx1ZS5sZW5ndGgsIHVzZUNoYXJJbmRleCA9ICFjaGFySW5kZXhCdWdneSB8fCBsZW5ndGggPiAxMDtcbiAgICAgICAgICB2YXIgc3ltYm9scyA9IHVzZUNoYXJJbmRleCAmJiAoY2hhckluZGV4QnVnZ3kgPyB2YWx1ZS5zcGxpdChcIlwiKSA6IHZhbHVlKTtcbiAgICAgICAgICBmb3IgKDsgaW5kZXggPCBsZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgICAgIHZhciBjaGFyQ29kZSA9IHZhbHVlLmNoYXJDb2RlQXQoaW5kZXgpO1xuICAgICAgICAgICAgLy8gSWYgdGhlIGNoYXJhY3RlciBpcyBhIGNvbnRyb2wgY2hhcmFjdGVyLCBhcHBlbmQgaXRzIFVuaWNvZGUgb3JcbiAgICAgICAgICAgIC8vIHNob3J0aGFuZCBlc2NhcGUgc2VxdWVuY2U7IG90aGVyd2lzZSwgYXBwZW5kIHRoZSBjaGFyYWN0ZXIgYXMtaXMuXG4gICAgICAgICAgICBzd2l0Y2ggKGNoYXJDb2RlKSB7XG4gICAgICAgICAgICAgIGNhc2UgODogY2FzZSA5OiBjYXNlIDEwOiBjYXNlIDEyOiBjYXNlIDEzOiBjYXNlIDM0OiBjYXNlIDkyOlxuICAgICAgICAgICAgICAgIHJlc3VsdCArPSBFc2NhcGVzW2NoYXJDb2RlXTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICBpZiAoY2hhckNvZGUgPCAzMikge1xuICAgICAgICAgICAgICAgICAgcmVzdWx0ICs9IHVuaWNvZGVQcmVmaXggKyB0b1BhZGRlZFN0cmluZygyLCBjaGFyQ29kZS50b1N0cmluZygxNikpO1xuICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlc3VsdCArPSB1c2VDaGFySW5kZXggPyBzeW1ib2xzW2luZGV4XSA6IHZhbHVlLmNoYXJBdChpbmRleCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiByZXN1bHQgKyAnXCInO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIEludGVybmFsOiBSZWN1cnNpdmVseSBzZXJpYWxpemVzIGFuIG9iamVjdC4gSW1wbGVtZW50cyB0aGVcbiAgICAgICAgLy8gYFN0cihrZXksIGhvbGRlcilgLCBgSk8odmFsdWUpYCwgYW5kIGBKQSh2YWx1ZSlgIG9wZXJhdGlvbnMuXG4gICAgICAgIHZhciBzZXJpYWxpemUgPSBmdW5jdGlvbiAocHJvcGVydHksIG9iamVjdCwgY2FsbGJhY2ssIHByb3BlcnRpZXMsIHdoaXRlc3BhY2UsIGluZGVudGF0aW9uLCBzdGFjaykge1xuICAgICAgICAgIHZhciB2YWx1ZSwgY2xhc3NOYW1lLCB5ZWFyLCBtb250aCwgZGF0ZSwgdGltZSwgaG91cnMsIG1pbnV0ZXMsIHNlY29uZHMsIG1pbGxpc2Vjb25kcywgcmVzdWx0cywgZWxlbWVudCwgaW5kZXgsIGxlbmd0aCwgcHJlZml4LCByZXN1bHQ7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIE5lY2Vzc2FyeSBmb3IgaG9zdCBvYmplY3Qgc3VwcG9ydC5cbiAgICAgICAgICAgIHZhbHVlID0gb2JqZWN0W3Byb3BlcnR5XTtcbiAgICAgICAgICB9IGNhdGNoIChleGNlcHRpb24pIHt9XG4gICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PSBcIm9iamVjdFwiICYmIHZhbHVlKSB7XG4gICAgICAgICAgICBjbGFzc05hbWUgPSBnZXRDbGFzcy5jYWxsKHZhbHVlKTtcbiAgICAgICAgICAgIGlmIChjbGFzc05hbWUgPT0gZGF0ZUNsYXNzICYmICFpc1Byb3BlcnR5LmNhbGwodmFsdWUsIFwidG9KU09OXCIpKSB7XG4gICAgICAgICAgICAgIGlmICh2YWx1ZSA+IC0xIC8gMCAmJiB2YWx1ZSA8IDEgLyAwKSB7XG4gICAgICAgICAgICAgICAgLy8gRGF0ZXMgYXJlIHNlcmlhbGl6ZWQgYWNjb3JkaW5nIHRvIHRoZSBgRGF0ZSN0b0pTT05gIG1ldGhvZFxuICAgICAgICAgICAgICAgIC8vIHNwZWNpZmllZCBpbiBFUyA1LjEgc2VjdGlvbiAxNS45LjUuNDQuIFNlZSBzZWN0aW9uIDE1LjkuMS4xNVxuICAgICAgICAgICAgICAgIC8vIGZvciB0aGUgSVNPIDg2MDEgZGF0ZSB0aW1lIHN0cmluZyBmb3JtYXQuXG4gICAgICAgICAgICAgICAgaWYgKGdldERheSkge1xuICAgICAgICAgICAgICAgICAgLy8gTWFudWFsbHkgY29tcHV0ZSB0aGUgeWVhciwgbW9udGgsIGRhdGUsIGhvdXJzLCBtaW51dGVzLFxuICAgICAgICAgICAgICAgICAgLy8gc2Vjb25kcywgYW5kIG1pbGxpc2Vjb25kcyBpZiB0aGUgYGdldFVUQypgIG1ldGhvZHMgYXJlXG4gICAgICAgICAgICAgICAgICAvLyBidWdneS4gQWRhcHRlZCBmcm9tIEBZYWZmbGUncyBgZGF0ZS1zaGltYCBwcm9qZWN0LlxuICAgICAgICAgICAgICAgICAgZGF0ZSA9IGZsb29yKHZhbHVlIC8gODY0ZTUpO1xuICAgICAgICAgICAgICAgICAgZm9yICh5ZWFyID0gZmxvb3IoZGF0ZSAvIDM2NS4yNDI1KSArIDE5NzAgLSAxOyBnZXREYXkoeWVhciArIDEsIDApIDw9IGRhdGU7IHllYXIrKyk7XG4gICAgICAgICAgICAgICAgICBmb3IgKG1vbnRoID0gZmxvb3IoKGRhdGUgLSBnZXREYXkoeWVhciwgMCkpIC8gMzAuNDIpOyBnZXREYXkoeWVhciwgbW9udGggKyAxKSA8PSBkYXRlOyBtb250aCsrKTtcbiAgICAgICAgICAgICAgICAgIGRhdGUgPSAxICsgZGF0ZSAtIGdldERheSh5ZWFyLCBtb250aCk7XG4gICAgICAgICAgICAgICAgICAvLyBUaGUgYHRpbWVgIHZhbHVlIHNwZWNpZmllcyB0aGUgdGltZSB3aXRoaW4gdGhlIGRheSAoc2VlIEVTXG4gICAgICAgICAgICAgICAgICAvLyA1LjEgc2VjdGlvbiAxNS45LjEuMikuIFRoZSBmb3JtdWxhIGAoQSAlIEIgKyBCKSAlIEJgIGlzIHVzZWRcbiAgICAgICAgICAgICAgICAgIC8vIHRvIGNvbXB1dGUgYEEgbW9kdWxvIEJgLCBhcyB0aGUgYCVgIG9wZXJhdG9yIGRvZXMgbm90XG4gICAgICAgICAgICAgICAgICAvLyBjb3JyZXNwb25kIHRvIHRoZSBgbW9kdWxvYCBvcGVyYXRpb24gZm9yIG5lZ2F0aXZlIG51bWJlcnMuXG4gICAgICAgICAgICAgICAgICB0aW1lID0gKHZhbHVlICUgODY0ZTUgKyA4NjRlNSkgJSA4NjRlNTtcbiAgICAgICAgICAgICAgICAgIC8vIFRoZSBob3VycywgbWludXRlcywgc2Vjb25kcywgYW5kIG1pbGxpc2Vjb25kcyBhcmUgb2J0YWluZWQgYnlcbiAgICAgICAgICAgICAgICAgIC8vIGRlY29tcG9zaW5nIHRoZSB0aW1lIHdpdGhpbiB0aGUgZGF5LiBTZWUgc2VjdGlvbiAxNS45LjEuMTAuXG4gICAgICAgICAgICAgICAgICBob3VycyA9IGZsb29yKHRpbWUgLyAzNmU1KSAlIDI0O1xuICAgICAgICAgICAgICAgICAgbWludXRlcyA9IGZsb29yKHRpbWUgLyA2ZTQpICUgNjA7XG4gICAgICAgICAgICAgICAgICBzZWNvbmRzID0gZmxvb3IodGltZSAvIDFlMykgJSA2MDtcbiAgICAgICAgICAgICAgICAgIG1pbGxpc2Vjb25kcyA9IHRpbWUgJSAxZTM7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIHllYXIgPSB2YWx1ZS5nZXRVVENGdWxsWWVhcigpO1xuICAgICAgICAgICAgICAgICAgbW9udGggPSB2YWx1ZS5nZXRVVENNb250aCgpO1xuICAgICAgICAgICAgICAgICAgZGF0ZSA9IHZhbHVlLmdldFVUQ0RhdGUoKTtcbiAgICAgICAgICAgICAgICAgIGhvdXJzID0gdmFsdWUuZ2V0VVRDSG91cnMoKTtcbiAgICAgICAgICAgICAgICAgIG1pbnV0ZXMgPSB2YWx1ZS5nZXRVVENNaW51dGVzKCk7XG4gICAgICAgICAgICAgICAgICBzZWNvbmRzID0gdmFsdWUuZ2V0VVRDU2Vjb25kcygpO1xuICAgICAgICAgICAgICAgICAgbWlsbGlzZWNvbmRzID0gdmFsdWUuZ2V0VVRDTWlsbGlzZWNvbmRzKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIFNlcmlhbGl6ZSBleHRlbmRlZCB5ZWFycyBjb3JyZWN0bHkuXG4gICAgICAgICAgICAgICAgdmFsdWUgPSAoeWVhciA8PSAwIHx8IHllYXIgPj0gMWU0ID8gKHllYXIgPCAwID8gXCItXCIgOiBcIitcIikgKyB0b1BhZGRlZFN0cmluZyg2LCB5ZWFyIDwgMCA/IC15ZWFyIDogeWVhcikgOiB0b1BhZGRlZFN0cmluZyg0LCB5ZWFyKSkgK1xuICAgICAgICAgICAgICAgICAgXCItXCIgKyB0b1BhZGRlZFN0cmluZygyLCBtb250aCArIDEpICsgXCItXCIgKyB0b1BhZGRlZFN0cmluZygyLCBkYXRlKSArXG4gICAgICAgICAgICAgICAgICAvLyBNb250aHMsIGRhdGVzLCBob3VycywgbWludXRlcywgYW5kIHNlY29uZHMgc2hvdWxkIGhhdmUgdHdvXG4gICAgICAgICAgICAgICAgICAvLyBkaWdpdHM7IG1pbGxpc2Vjb25kcyBzaG91bGQgaGF2ZSB0aHJlZS5cbiAgICAgICAgICAgICAgICAgIFwiVFwiICsgdG9QYWRkZWRTdHJpbmcoMiwgaG91cnMpICsgXCI6XCIgKyB0b1BhZGRlZFN0cmluZygyLCBtaW51dGVzKSArIFwiOlwiICsgdG9QYWRkZWRTdHJpbmcoMiwgc2Vjb25kcykgK1xuICAgICAgICAgICAgICAgICAgLy8gTWlsbGlzZWNvbmRzIGFyZSBvcHRpb25hbCBpbiBFUyA1LjAsIGJ1dCByZXF1aXJlZCBpbiA1LjEuXG4gICAgICAgICAgICAgICAgICBcIi5cIiArIHRvUGFkZGVkU3RyaW5nKDMsIG1pbGxpc2Vjb25kcykgKyBcIlpcIjtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IG51bGw7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHZhbHVlLnRvSlNPTiA9PSBcImZ1bmN0aW9uXCIgJiYgKChjbGFzc05hbWUgIT0gbnVtYmVyQ2xhc3MgJiYgY2xhc3NOYW1lICE9IHN0cmluZ0NsYXNzICYmIGNsYXNzTmFtZSAhPSBhcnJheUNsYXNzKSB8fCBpc1Byb3BlcnR5LmNhbGwodmFsdWUsIFwidG9KU09OXCIpKSkge1xuICAgICAgICAgICAgICAvLyBQcm90b3R5cGUgPD0gMS42LjEgYWRkcyBub24tc3RhbmRhcmQgYHRvSlNPTmAgbWV0aG9kcyB0byB0aGVcbiAgICAgICAgICAgICAgLy8gYE51bWJlcmAsIGBTdHJpbmdgLCBgRGF0ZWAsIGFuZCBgQXJyYXlgIHByb3RvdHlwZXMuIEpTT04gM1xuICAgICAgICAgICAgICAvLyBpZ25vcmVzIGFsbCBgdG9KU09OYCBtZXRob2RzIG9uIHRoZXNlIG9iamVjdHMgdW5sZXNzIHRoZXkgYXJlXG4gICAgICAgICAgICAgIC8vIGRlZmluZWQgZGlyZWN0bHkgb24gYW4gaW5zdGFuY2UuXG4gICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUudG9KU09OKHByb3BlcnR5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAvLyBJZiBhIHJlcGxhY2VtZW50IGZ1bmN0aW9uIHdhcyBwcm92aWRlZCwgY2FsbCBpdCB0byBvYnRhaW4gdGhlIHZhbHVlXG4gICAgICAgICAgICAvLyBmb3Igc2VyaWFsaXphdGlvbi5cbiAgICAgICAgICAgIHZhbHVlID0gY2FsbGJhY2suY2FsbChvYmplY3QsIHByb3BlcnR5LCB2YWx1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICh2YWx1ZSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIFwibnVsbFwiO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjbGFzc05hbWUgPSBnZXRDbGFzcy5jYWxsKHZhbHVlKTtcbiAgICAgICAgICBpZiAoY2xhc3NOYW1lID09IGJvb2xlYW5DbGFzcykge1xuICAgICAgICAgICAgLy8gQm9vbGVhbnMgYXJlIHJlcHJlc2VudGVkIGxpdGVyYWxseS5cbiAgICAgICAgICAgIHJldHVybiBcIlwiICsgdmFsdWU7XG4gICAgICAgICAgfSBlbHNlIGlmIChjbGFzc05hbWUgPT0gbnVtYmVyQ2xhc3MpIHtcbiAgICAgICAgICAgIC8vIEpTT04gbnVtYmVycyBtdXN0IGJlIGZpbml0ZS4gYEluZmluaXR5YCBhbmQgYE5hTmAgYXJlIHNlcmlhbGl6ZWQgYXNcbiAgICAgICAgICAgIC8vIGBcIm51bGxcImAuXG4gICAgICAgICAgICByZXR1cm4gdmFsdWUgPiAtMSAvIDAgJiYgdmFsdWUgPCAxIC8gMCA/IFwiXCIgKyB2YWx1ZSA6IFwibnVsbFwiO1xuICAgICAgICAgIH0gZWxzZSBpZiAoY2xhc3NOYW1lID09IHN0cmluZ0NsYXNzKSB7XG4gICAgICAgICAgICAvLyBTdHJpbmdzIGFyZSBkb3VibGUtcXVvdGVkIGFuZCBlc2NhcGVkLlxuICAgICAgICAgICAgcmV0dXJuIHF1b3RlKFwiXCIgKyB2YWx1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIFJlY3Vyc2l2ZWx5IHNlcmlhbGl6ZSBvYmplY3RzIGFuZCBhcnJheXMuXG4gICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgICAvLyBDaGVjayBmb3IgY3ljbGljIHN0cnVjdHVyZXMuIFRoaXMgaXMgYSBsaW5lYXIgc2VhcmNoOyBwZXJmb3JtYW5jZVxuICAgICAgICAgICAgLy8gaXMgaW52ZXJzZWx5IHByb3BvcnRpb25hbCB0byB0aGUgbnVtYmVyIG9mIHVuaXF1ZSBuZXN0ZWQgb2JqZWN0cy5cbiAgICAgICAgICAgIGZvciAobGVuZ3RoID0gc3RhY2subGVuZ3RoOyBsZW5ndGgtLTspIHtcbiAgICAgICAgICAgICAgaWYgKHN0YWNrW2xlbmd0aF0gPT09IHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgLy8gQ3ljbGljIHN0cnVjdHVyZXMgY2Fubm90IGJlIHNlcmlhbGl6ZWQgYnkgYEpTT04uc3RyaW5naWZ5YC5cbiAgICAgICAgICAgICAgICB0aHJvdyBUeXBlRXJyb3IoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gQWRkIHRoZSBvYmplY3QgdG8gdGhlIHN0YWNrIG9mIHRyYXZlcnNlZCBvYmplY3RzLlxuICAgICAgICAgICAgc3RhY2sucHVzaCh2YWx1ZSk7XG4gICAgICAgICAgICByZXN1bHRzID0gW107XG4gICAgICAgICAgICAvLyBTYXZlIHRoZSBjdXJyZW50IGluZGVudGF0aW9uIGxldmVsIGFuZCBpbmRlbnQgb25lIGFkZGl0aW9uYWwgbGV2ZWwuXG4gICAgICAgICAgICBwcmVmaXggPSBpbmRlbnRhdGlvbjtcbiAgICAgICAgICAgIGluZGVudGF0aW9uICs9IHdoaXRlc3BhY2U7XG4gICAgICAgICAgICBpZiAoY2xhc3NOYW1lID09IGFycmF5Q2xhc3MpIHtcbiAgICAgICAgICAgICAgLy8gUmVjdXJzaXZlbHkgc2VyaWFsaXplIGFycmF5IGVsZW1lbnRzLlxuICAgICAgICAgICAgICBmb3IgKGluZGV4ID0gMCwgbGVuZ3RoID0gdmFsdWUubGVuZ3RoOyBpbmRleCA8IGxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICAgICAgICAgIGVsZW1lbnQgPSBzZXJpYWxpemUoaW5kZXgsIHZhbHVlLCBjYWxsYmFjaywgcHJvcGVydGllcywgd2hpdGVzcGFjZSwgaW5kZW50YXRpb24sIHN0YWNrKTtcbiAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goZWxlbWVudCA9PT0gdW5kZWYgPyBcIm51bGxcIiA6IGVsZW1lbnQpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdHMubGVuZ3RoID8gKHdoaXRlc3BhY2UgPyBcIltcXG5cIiArIGluZGVudGF0aW9uICsgcmVzdWx0cy5qb2luKFwiLFxcblwiICsgaW5kZW50YXRpb24pICsgXCJcXG5cIiArIHByZWZpeCArIFwiXVwiIDogKFwiW1wiICsgcmVzdWx0cy5qb2luKFwiLFwiKSArIFwiXVwiKSkgOiBcIltdXCI7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAvLyBSZWN1cnNpdmVseSBzZXJpYWxpemUgb2JqZWN0IG1lbWJlcnMuIE1lbWJlcnMgYXJlIHNlbGVjdGVkIGZyb21cbiAgICAgICAgICAgICAgLy8gZWl0aGVyIGEgdXNlci1zcGVjaWZpZWQgbGlzdCBvZiBwcm9wZXJ0eSBuYW1lcywgb3IgdGhlIG9iamVjdFxuICAgICAgICAgICAgICAvLyBpdHNlbGYuXG4gICAgICAgICAgICAgIGZvckVhY2gocHJvcGVydGllcyB8fCB2YWx1ZSwgZnVuY3Rpb24gKHByb3BlcnR5KSB7XG4gICAgICAgICAgICAgICAgdmFyIGVsZW1lbnQgPSBzZXJpYWxpemUocHJvcGVydHksIHZhbHVlLCBjYWxsYmFjaywgcHJvcGVydGllcywgd2hpdGVzcGFjZSwgaW5kZW50YXRpb24sIHN0YWNrKTtcbiAgICAgICAgICAgICAgICBpZiAoZWxlbWVudCAhPT0gdW5kZWYpIHtcbiAgICAgICAgICAgICAgICAgIC8vIEFjY29yZGluZyB0byBFUyA1LjEgc2VjdGlvbiAxNS4xMi4zOiBcIklmIGBnYXBgIHt3aGl0ZXNwYWNlfVxuICAgICAgICAgICAgICAgICAgLy8gaXMgbm90IHRoZSBlbXB0eSBzdHJpbmcsIGxldCBgbWVtYmVyYCB7cXVvdGUocHJvcGVydHkpICsgXCI6XCJ9XG4gICAgICAgICAgICAgICAgICAvLyBiZSB0aGUgY29uY2F0ZW5hdGlvbiBvZiBgbWVtYmVyYCBhbmQgdGhlIGBzcGFjZWAgY2hhcmFjdGVyLlwiXG4gICAgICAgICAgICAgICAgICAvLyBUaGUgXCJgc3BhY2VgIGNoYXJhY3RlclwiIHJlZmVycyB0byB0aGUgbGl0ZXJhbCBzcGFjZVxuICAgICAgICAgICAgICAgICAgLy8gY2hhcmFjdGVyLCBub3QgdGhlIGBzcGFjZWAge3dpZHRofSBhcmd1bWVudCBwcm92aWRlZCB0b1xuICAgICAgICAgICAgICAgICAgLy8gYEpTT04uc3RyaW5naWZ5YC5cbiAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChxdW90ZShwcm9wZXJ0eSkgKyBcIjpcIiArICh3aGl0ZXNwYWNlID8gXCIgXCIgOiBcIlwiKSArIGVsZW1lbnQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdHMubGVuZ3RoID8gKHdoaXRlc3BhY2UgPyBcIntcXG5cIiArIGluZGVudGF0aW9uICsgcmVzdWx0cy5qb2luKFwiLFxcblwiICsgaW5kZW50YXRpb24pICsgXCJcXG5cIiArIHByZWZpeCArIFwifVwiIDogKFwie1wiICsgcmVzdWx0cy5qb2luKFwiLFwiKSArIFwifVwiKSkgOiBcInt9XCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBSZW1vdmUgdGhlIG9iamVjdCBmcm9tIHRoZSB0cmF2ZXJzZWQgb2JqZWN0IHN0YWNrLlxuICAgICAgICAgICAgc3RhY2sucG9wKCk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAvLyBQdWJsaWM6IGBKU09OLnN0cmluZ2lmeWAuIFNlZSBFUyA1LjEgc2VjdGlvbiAxNS4xMi4zLlxuICAgICAgICBleHBvcnRzLnN0cmluZ2lmeSA9IGZ1bmN0aW9uIChzb3VyY2UsIGZpbHRlciwgd2lkdGgpIHtcbiAgICAgICAgICB2YXIgd2hpdGVzcGFjZSwgY2FsbGJhY2ssIHByb3BlcnRpZXMsIGNsYXNzTmFtZTtcbiAgICAgICAgICBpZiAodHlwZW9mIGZpbHRlciA9PSBcImZ1bmN0aW9uXCIgfHwgdHlwZW9mIGZpbHRlciA9PSBcIm9iamVjdFwiICYmIGZpbHRlcikge1xuICAgICAgICAgICAgaWYgKChjbGFzc05hbWUgPSBnZXRDbGFzcy5jYWxsKGZpbHRlcikpID09IGZ1bmN0aW9uQ2xhc3MpIHtcbiAgICAgICAgICAgICAgY2FsbGJhY2sgPSBmaWx0ZXI7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNsYXNzTmFtZSA9PSBhcnJheUNsYXNzKSB7XG4gICAgICAgICAgICAgIC8vIENvbnZlcnQgdGhlIHByb3BlcnR5IG5hbWVzIGFycmF5IGludG8gYSBtYWtlc2hpZnQgc2V0LlxuICAgICAgICAgICAgICBwcm9wZXJ0aWVzID0ge307XG4gICAgICAgICAgICAgIGZvciAodmFyIGluZGV4ID0gMCwgbGVuZ3RoID0gZmlsdGVyLmxlbmd0aCwgdmFsdWU7IGluZGV4IDwgbGVuZ3RoOyB2YWx1ZSA9IGZpbHRlcltpbmRleCsrXSwgKChjbGFzc05hbWUgPSBnZXRDbGFzcy5jYWxsKHZhbHVlKSksIGNsYXNzTmFtZSA9PSBzdHJpbmdDbGFzcyB8fCBjbGFzc05hbWUgPT0gbnVtYmVyQ2xhc3MpICYmIChwcm9wZXJ0aWVzW3ZhbHVlXSA9IDEpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHdpZHRoKSB7XG4gICAgICAgICAgICBpZiAoKGNsYXNzTmFtZSA9IGdldENsYXNzLmNhbGwod2lkdGgpKSA9PSBudW1iZXJDbGFzcykge1xuICAgICAgICAgICAgICAvLyBDb252ZXJ0IHRoZSBgd2lkdGhgIHRvIGFuIGludGVnZXIgYW5kIGNyZWF0ZSBhIHN0cmluZyBjb250YWluaW5nXG4gICAgICAgICAgICAgIC8vIGB3aWR0aGAgbnVtYmVyIG9mIHNwYWNlIGNoYXJhY3RlcnMuXG4gICAgICAgICAgICAgIGlmICgod2lkdGggLT0gd2lkdGggJSAxKSA+IDApIHtcbiAgICAgICAgICAgICAgICBmb3IgKHdoaXRlc3BhY2UgPSBcIlwiLCB3aWR0aCA+IDEwICYmICh3aWR0aCA9IDEwKTsgd2hpdGVzcGFjZS5sZW5ndGggPCB3aWR0aDsgd2hpdGVzcGFjZSArPSBcIiBcIik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY2xhc3NOYW1lID09IHN0cmluZ0NsYXNzKSB7XG4gICAgICAgICAgICAgIHdoaXRlc3BhY2UgPSB3aWR0aC5sZW5ndGggPD0gMTAgPyB3aWR0aCA6IHdpZHRoLnNsaWNlKDAsIDEwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gT3BlcmEgPD0gNy41NHUyIGRpc2NhcmRzIHRoZSB2YWx1ZXMgYXNzb2NpYXRlZCB3aXRoIGVtcHR5IHN0cmluZyBrZXlzXG4gICAgICAgICAgLy8gKGBcIlwiYCkgb25seSBpZiB0aGV5IGFyZSB1c2VkIGRpcmVjdGx5IHdpdGhpbiBhbiBvYmplY3QgbWVtYmVyIGxpc3RcbiAgICAgICAgICAvLyAoZS5nLiwgYCEoXCJcIiBpbiB7IFwiXCI6IDF9KWApLlxuICAgICAgICAgIHJldHVybiBzZXJpYWxpemUoXCJcIiwgKHZhbHVlID0ge30sIHZhbHVlW1wiXCJdID0gc291cmNlLCB2YWx1ZSksIGNhbGxiYWNrLCBwcm9wZXJ0aWVzLCB3aGl0ZXNwYWNlLCBcIlwiLCBbXSk7XG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIC8vIFB1YmxpYzogUGFyc2VzIGEgSlNPTiBzb3VyY2Ugc3RyaW5nLlxuICAgICAgaWYgKCFoYXMoXCJqc29uLXBhcnNlXCIpKSB7XG4gICAgICAgIHZhciBmcm9tQ2hhckNvZGUgPSBTdHJpbmcuZnJvbUNoYXJDb2RlO1xuXG4gICAgICAgIC8vIEludGVybmFsOiBBIG1hcCBvZiBlc2NhcGVkIGNvbnRyb2wgY2hhcmFjdGVycyBhbmQgdGhlaXIgdW5lc2NhcGVkXG4gICAgICAgIC8vIGVxdWl2YWxlbnRzLlxuICAgICAgICB2YXIgVW5lc2NhcGVzID0ge1xuICAgICAgICAgIDkyOiBcIlxcXFxcIixcbiAgICAgICAgICAzNDogJ1wiJyxcbiAgICAgICAgICA0NzogXCIvXCIsXG4gICAgICAgICAgOTg6IFwiXFxiXCIsXG4gICAgICAgICAgMTE2OiBcIlxcdFwiLFxuICAgICAgICAgIDExMDogXCJcXG5cIixcbiAgICAgICAgICAxMDI6IFwiXFxmXCIsXG4gICAgICAgICAgMTE0OiBcIlxcclwiXG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gSW50ZXJuYWw6IFN0b3JlcyB0aGUgcGFyc2VyIHN0YXRlLlxuICAgICAgICB2YXIgSW5kZXgsIFNvdXJjZTtcblxuICAgICAgICAvLyBJbnRlcm5hbDogUmVzZXRzIHRoZSBwYXJzZXIgc3RhdGUgYW5kIHRocm93cyBhIGBTeW50YXhFcnJvcmAuXG4gICAgICAgIHZhciBhYm9ydCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBJbmRleCA9IFNvdXJjZSA9IG51bGw7XG4gICAgICAgICAgdGhyb3cgU3ludGF4RXJyb3IoKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBJbnRlcm5hbDogUmV0dXJucyB0aGUgbmV4dCB0b2tlbiwgb3IgYFwiJFwiYCBpZiB0aGUgcGFyc2VyIGhhcyByZWFjaGVkXG4gICAgICAgIC8vIHRoZSBlbmQgb2YgdGhlIHNvdXJjZSBzdHJpbmcuIEEgdG9rZW4gbWF5IGJlIGEgc3RyaW5nLCBudW1iZXIsIGBudWxsYFxuICAgICAgICAvLyBsaXRlcmFsLCBvciBCb29sZWFuIGxpdGVyYWwuXG4gICAgICAgIHZhciBsZXggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgdmFyIHNvdXJjZSA9IFNvdXJjZSwgbGVuZ3RoID0gc291cmNlLmxlbmd0aCwgdmFsdWUsIGJlZ2luLCBwb3NpdGlvbiwgaXNTaWduZWQsIGNoYXJDb2RlO1xuICAgICAgICAgIHdoaWxlIChJbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgICAgY2hhckNvZGUgPSBzb3VyY2UuY2hhckNvZGVBdChJbmRleCk7XG4gICAgICAgICAgICBzd2l0Y2ggKGNoYXJDb2RlKSB7XG4gICAgICAgICAgICAgIGNhc2UgOTogY2FzZSAxMDogY2FzZSAxMzogY2FzZSAzMjpcbiAgICAgICAgICAgICAgICAvLyBTa2lwIHdoaXRlc3BhY2UgdG9rZW5zLCBpbmNsdWRpbmcgdGFicywgY2FycmlhZ2UgcmV0dXJucywgbGluZVxuICAgICAgICAgICAgICAgIC8vIGZlZWRzLCBhbmQgc3BhY2UgY2hhcmFjdGVycy5cbiAgICAgICAgICAgICAgICBJbmRleCsrO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICBjYXNlIDEyMzogY2FzZSAxMjU6IGNhc2UgOTE6IGNhc2UgOTM6IGNhc2UgNTg6IGNhc2UgNDQ6XG4gICAgICAgICAgICAgICAgLy8gUGFyc2UgYSBwdW5jdHVhdG9yIHRva2VuIChge2AsIGB9YCwgYFtgLCBgXWAsIGA6YCwgb3IgYCxgKSBhdFxuICAgICAgICAgICAgICAgIC8vIHRoZSBjdXJyZW50IHBvc2l0aW9uLlxuICAgICAgICAgICAgICAgIHZhbHVlID0gY2hhckluZGV4QnVnZ3kgPyBzb3VyY2UuY2hhckF0KEluZGV4KSA6IHNvdXJjZVtJbmRleF07XG4gICAgICAgICAgICAgICAgSW5kZXgrKztcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgICAgICAgIGNhc2UgMzQ6XG4gICAgICAgICAgICAgICAgLy8gYFwiYCBkZWxpbWl0cyBhIEpTT04gc3RyaW5nOyBhZHZhbmNlIHRvIHRoZSBuZXh0IGNoYXJhY3RlciBhbmRcbiAgICAgICAgICAgICAgICAvLyBiZWdpbiBwYXJzaW5nIHRoZSBzdHJpbmcuIFN0cmluZyB0b2tlbnMgYXJlIHByZWZpeGVkIHdpdGggdGhlXG4gICAgICAgICAgICAgICAgLy8gc2VudGluZWwgYEBgIGNoYXJhY3RlciB0byBkaXN0aW5ndWlzaCB0aGVtIGZyb20gcHVuY3R1YXRvcnMgYW5kXG4gICAgICAgICAgICAgICAgLy8gZW5kLW9mLXN0cmluZyB0b2tlbnMuXG4gICAgICAgICAgICAgICAgZm9yICh2YWx1ZSA9IFwiQFwiLCBJbmRleCsrOyBJbmRleCA8IGxlbmd0aDspIHtcbiAgICAgICAgICAgICAgICAgIGNoYXJDb2RlID0gc291cmNlLmNoYXJDb2RlQXQoSW5kZXgpO1xuICAgICAgICAgICAgICAgICAgaWYgKGNoYXJDb2RlIDwgMzIpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVW5lc2NhcGVkIEFTQ0lJIGNvbnRyb2wgY2hhcmFjdGVycyAodGhvc2Ugd2l0aCBhIGNvZGUgdW5pdFxuICAgICAgICAgICAgICAgICAgICAvLyBsZXNzIHRoYW4gdGhlIHNwYWNlIGNoYXJhY3RlcikgYXJlIG5vdCBwZXJtaXR0ZWQuXG4gICAgICAgICAgICAgICAgICAgIGFib3J0KCk7XG4gICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGNoYXJDb2RlID09IDkyKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEEgcmV2ZXJzZSBzb2xpZHVzIChgXFxgKSBtYXJrcyB0aGUgYmVnaW5uaW5nIG9mIGFuIGVzY2FwZWRcbiAgICAgICAgICAgICAgICAgICAgLy8gY29udHJvbCBjaGFyYWN0ZXIgKGluY2x1ZGluZyBgXCJgLCBgXFxgLCBhbmQgYC9gKSBvciBVbmljb2RlXG4gICAgICAgICAgICAgICAgICAgIC8vIGVzY2FwZSBzZXF1ZW5jZS5cbiAgICAgICAgICAgICAgICAgICAgY2hhckNvZGUgPSBzb3VyY2UuY2hhckNvZGVBdCgrK0luZGV4KTtcbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChjaGFyQ29kZSkge1xuICAgICAgICAgICAgICAgICAgICAgIGNhc2UgOTI6IGNhc2UgMzQ6IGNhc2UgNDc6IGNhc2UgOTg6IGNhc2UgMTE2OiBjYXNlIDExMDogY2FzZSAxMDI6IGNhc2UgMTE0OlxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gUmV2aXZlIGVzY2FwZWQgY29udHJvbCBjaGFyYWN0ZXJzLlxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgKz0gVW5lc2NhcGVzW2NoYXJDb2RlXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIEluZGV4Kys7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICBjYXNlIDExNzpcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGBcXHVgIG1hcmtzIHRoZSBiZWdpbm5pbmcgb2YgYSBVbmljb2RlIGVzY2FwZSBzZXF1ZW5jZS5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFkdmFuY2UgdG8gdGhlIGZpcnN0IGNoYXJhY3RlciBhbmQgdmFsaWRhdGUgdGhlXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBmb3VyLWRpZ2l0IGNvZGUgcG9pbnQuXG4gICAgICAgICAgICAgICAgICAgICAgICBiZWdpbiA9ICsrSW5kZXg7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHBvc2l0aW9uID0gSW5kZXggKyA0OyBJbmRleCA8IHBvc2l0aW9uOyBJbmRleCsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNoYXJDb2RlID0gc291cmNlLmNoYXJDb2RlQXQoSW5kZXgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBIHZhbGlkIHNlcXVlbmNlIGNvbXByaXNlcyBmb3VyIGhleGRpZ2l0cyAoY2FzZS1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaW5zZW5zaXRpdmUpIHRoYXQgZm9ybSBhIHNpbmdsZSBoZXhhZGVjaW1hbCB2YWx1ZS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEoY2hhckNvZGUgPj0gNDggJiYgY2hhckNvZGUgPD0gNTcgfHwgY2hhckNvZGUgPj0gOTcgJiYgY2hhckNvZGUgPD0gMTAyIHx8IGNoYXJDb2RlID49IDY1ICYmIGNoYXJDb2RlIDw9IDcwKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEludmFsaWQgVW5pY29kZSBlc2NhcGUgc2VxdWVuY2UuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWJvcnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gUmV2aXZlIHRoZSBlc2NhcGVkIGNoYXJhY3Rlci5cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlICs9IGZyb21DaGFyQ29kZShcIjB4XCIgKyBzb3VyY2Uuc2xpY2UoYmVnaW4sIEluZGV4KSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSW52YWxpZCBlc2NhcGUgc2VxdWVuY2UuXG4gICAgICAgICAgICAgICAgICAgICAgICBhYm9ydCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2hhckNvZGUgPT0gMzQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAvLyBBbiB1bmVzY2FwZWQgZG91YmxlLXF1b3RlIGNoYXJhY3RlciBtYXJrcyB0aGUgZW5kIG9mIHRoZVxuICAgICAgICAgICAgICAgICAgICAgIC8vIHN0cmluZy5cbiAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjaGFyQ29kZSA9IHNvdXJjZS5jaGFyQ29kZUF0KEluZGV4KTtcbiAgICAgICAgICAgICAgICAgICAgYmVnaW4gPSBJbmRleDtcbiAgICAgICAgICAgICAgICAgICAgLy8gT3B0aW1pemUgZm9yIHRoZSBjb21tb24gY2FzZSB3aGVyZSBhIHN0cmluZyBpcyB2YWxpZC5cbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGNoYXJDb2RlID49IDMyICYmIGNoYXJDb2RlICE9IDkyICYmIGNoYXJDb2RlICE9IDM0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgY2hhckNvZGUgPSBzb3VyY2UuY2hhckNvZGVBdCgrK0luZGV4KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyBBcHBlbmQgdGhlIHN0cmluZyBhcy1pcy5cbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgKz0gc291cmNlLnNsaWNlKGJlZ2luLCBJbmRleCk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChzb3VyY2UuY2hhckNvZGVBdChJbmRleCkgPT0gMzQpIHtcbiAgICAgICAgICAgICAgICAgIC8vIEFkdmFuY2UgdG8gdGhlIG5leHQgY2hhcmFjdGVyIGFuZCByZXR1cm4gdGhlIHJldml2ZWQgc3RyaW5nLlxuICAgICAgICAgICAgICAgICAgSW5kZXgrKztcbiAgICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gVW50ZXJtaW5hdGVkIHN0cmluZy5cbiAgICAgICAgICAgICAgICBhYm9ydCgpO1xuICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIC8vIFBhcnNlIG51bWJlcnMgYW5kIGxpdGVyYWxzLlxuICAgICAgICAgICAgICAgIGJlZ2luID0gSW5kZXg7XG4gICAgICAgICAgICAgICAgLy8gQWR2YW5jZSBwYXN0IHRoZSBuZWdhdGl2ZSBzaWduLCBpZiBvbmUgaXMgc3BlY2lmaWVkLlxuICAgICAgICAgICAgICAgIGlmIChjaGFyQ29kZSA9PSA0NSkge1xuICAgICAgICAgICAgICAgICAgaXNTaWduZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgY2hhckNvZGUgPSBzb3VyY2UuY2hhckNvZGVBdCgrK0luZGV4KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gUGFyc2UgYW4gaW50ZWdlciBvciBmbG9hdGluZy1wb2ludCB2YWx1ZS5cbiAgICAgICAgICAgICAgICBpZiAoY2hhckNvZGUgPj0gNDggJiYgY2hhckNvZGUgPD0gNTcpIHtcbiAgICAgICAgICAgICAgICAgIC8vIExlYWRpbmcgemVyb2VzIGFyZSBpbnRlcnByZXRlZCBhcyBvY3RhbCBsaXRlcmFscy5cbiAgICAgICAgICAgICAgICAgIGlmIChjaGFyQ29kZSA9PSA0OCAmJiAoKGNoYXJDb2RlID0gc291cmNlLmNoYXJDb2RlQXQoSW5kZXggKyAxKSksIGNoYXJDb2RlID49IDQ4ICYmIGNoYXJDb2RlIDw9IDU3KSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBJbGxlZ2FsIG9jdGFsIGxpdGVyYWwuXG4gICAgICAgICAgICAgICAgICAgIGFib3J0KCk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICBpc1NpZ25lZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgLy8gUGFyc2UgdGhlIGludGVnZXIgY29tcG9uZW50LlxuICAgICAgICAgICAgICAgICAgZm9yICg7IEluZGV4IDwgbGVuZ3RoICYmICgoY2hhckNvZGUgPSBzb3VyY2UuY2hhckNvZGVBdChJbmRleCkpLCBjaGFyQ29kZSA+PSA0OCAmJiBjaGFyQ29kZSA8PSA1Nyk7IEluZGV4KyspO1xuICAgICAgICAgICAgICAgICAgLy8gRmxvYXRzIGNhbm5vdCBjb250YWluIGEgbGVhZGluZyBkZWNpbWFsIHBvaW50OyBob3dldmVyLCB0aGlzXG4gICAgICAgICAgICAgICAgICAvLyBjYXNlIGlzIGFscmVhZHkgYWNjb3VudGVkIGZvciBieSB0aGUgcGFyc2VyLlxuICAgICAgICAgICAgICAgICAgaWYgKHNvdXJjZS5jaGFyQ29kZUF0KEluZGV4KSA9PSA0Nikge1xuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbiA9ICsrSW5kZXg7XG4gICAgICAgICAgICAgICAgICAgIC8vIFBhcnNlIHRoZSBkZWNpbWFsIGNvbXBvbmVudC5cbiAgICAgICAgICAgICAgICAgICAgZm9yICg7IHBvc2l0aW9uIDwgbGVuZ3RoICYmICgoY2hhckNvZGUgPSBzb3VyY2UuY2hhckNvZGVBdChwb3NpdGlvbikpLCBjaGFyQ29kZSA+PSA0OCAmJiBjaGFyQ29kZSA8PSA1Nyk7IHBvc2l0aW9uKyspO1xuICAgICAgICAgICAgICAgICAgICBpZiAocG9zaXRpb24gPT0gSW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAvLyBJbGxlZ2FsIHRyYWlsaW5nIGRlY2ltYWwuXG4gICAgICAgICAgICAgICAgICAgICAgYWJvcnQoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBJbmRleCA9IHBvc2l0aW9uO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgLy8gUGFyc2UgZXhwb25lbnRzLiBUaGUgYGVgIGRlbm90aW5nIHRoZSBleHBvbmVudCBpc1xuICAgICAgICAgICAgICAgICAgLy8gY2FzZS1pbnNlbnNpdGl2ZS5cbiAgICAgICAgICAgICAgICAgIGNoYXJDb2RlID0gc291cmNlLmNoYXJDb2RlQXQoSW5kZXgpO1xuICAgICAgICAgICAgICAgICAgaWYgKGNoYXJDb2RlID09IDEwMSB8fCBjaGFyQ29kZSA9PSA2OSkge1xuICAgICAgICAgICAgICAgICAgICBjaGFyQ29kZSA9IHNvdXJjZS5jaGFyQ29kZUF0KCsrSW5kZXgpO1xuICAgICAgICAgICAgICAgICAgICAvLyBTa2lwIHBhc3QgdGhlIHNpZ24gZm9sbG93aW5nIHRoZSBleHBvbmVudCwgaWYgb25lIGlzXG4gICAgICAgICAgICAgICAgICAgIC8vIHNwZWNpZmllZC5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGNoYXJDb2RlID09IDQzIHx8IGNoYXJDb2RlID09IDQ1KSB7XG4gICAgICAgICAgICAgICAgICAgICAgSW5kZXgrKztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyBQYXJzZSB0aGUgZXhwb25lbnRpYWwgY29tcG9uZW50LlxuICAgICAgICAgICAgICAgICAgICBmb3IgKHBvc2l0aW9uID0gSW5kZXg7IHBvc2l0aW9uIDwgbGVuZ3RoICYmICgoY2hhckNvZGUgPSBzb3VyY2UuY2hhckNvZGVBdChwb3NpdGlvbikpLCBjaGFyQ29kZSA+PSA0OCAmJiBjaGFyQ29kZSA8PSA1Nyk7IHBvc2l0aW9uKyspO1xuICAgICAgICAgICAgICAgICAgICBpZiAocG9zaXRpb24gPT0gSW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAvLyBJbGxlZ2FsIGVtcHR5IGV4cG9uZW50LlxuICAgICAgICAgICAgICAgICAgICAgIGFib3J0KCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgSW5kZXggPSBwb3NpdGlvbjtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIC8vIENvZXJjZSB0aGUgcGFyc2VkIHZhbHVlIHRvIGEgSmF2YVNjcmlwdCBudW1iZXIuXG4gICAgICAgICAgICAgICAgICByZXR1cm4gK3NvdXJjZS5zbGljZShiZWdpbiwgSW5kZXgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBBIG5lZ2F0aXZlIHNpZ24gbWF5IG9ubHkgcHJlY2VkZSBudW1iZXJzLlxuICAgICAgICAgICAgICAgIGlmIChpc1NpZ25lZCkge1xuICAgICAgICAgICAgICAgICAgYWJvcnQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gYHRydWVgLCBgZmFsc2VgLCBhbmQgYG51bGxgIGxpdGVyYWxzLlxuICAgICAgICAgICAgICAgIGlmIChzb3VyY2Uuc2xpY2UoSW5kZXgsIEluZGV4ICsgNCkgPT0gXCJ0cnVlXCIpIHtcbiAgICAgICAgICAgICAgICAgIEluZGV4ICs9IDQ7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHNvdXJjZS5zbGljZShJbmRleCwgSW5kZXggKyA1KSA9PSBcImZhbHNlXCIpIHtcbiAgICAgICAgICAgICAgICAgIEluZGV4ICs9IDU7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzb3VyY2Uuc2xpY2UoSW5kZXgsIEluZGV4ICsgNCkgPT0gXCJudWxsXCIpIHtcbiAgICAgICAgICAgICAgICAgIEluZGV4ICs9IDQ7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gVW5yZWNvZ25pemVkIHRva2VuLlxuICAgICAgICAgICAgICAgIGFib3J0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIFJldHVybiB0aGUgc2VudGluZWwgYCRgIGNoYXJhY3RlciBpZiB0aGUgcGFyc2VyIGhhcyByZWFjaGVkIHRoZSBlbmRcbiAgICAgICAgICAvLyBvZiB0aGUgc291cmNlIHN0cmluZy5cbiAgICAgICAgICByZXR1cm4gXCIkXCI7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gSW50ZXJuYWw6IFBhcnNlcyBhIEpTT04gYHZhbHVlYCB0b2tlbi5cbiAgICAgICAgdmFyIGdldCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgIHZhciByZXN1bHRzLCBoYXNNZW1iZXJzO1xuICAgICAgICAgIGlmICh2YWx1ZSA9PSBcIiRcIikge1xuICAgICAgICAgICAgLy8gVW5leHBlY3RlZCBlbmQgb2YgaW5wdXQuXG4gICAgICAgICAgICBhYm9ydCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIGlmICgoY2hhckluZGV4QnVnZ3kgPyB2YWx1ZS5jaGFyQXQoMCkgOiB2YWx1ZVswXSkgPT0gXCJAXCIpIHtcbiAgICAgICAgICAgICAgLy8gUmVtb3ZlIHRoZSBzZW50aW5lbCBgQGAgY2hhcmFjdGVyLlxuICAgICAgICAgICAgICByZXR1cm4gdmFsdWUuc2xpY2UoMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBQYXJzZSBvYmplY3QgYW5kIGFycmF5IGxpdGVyYWxzLlxuICAgICAgICAgICAgaWYgKHZhbHVlID09IFwiW1wiKSB7XG4gICAgICAgICAgICAgIC8vIFBhcnNlcyBhIEpTT04gYXJyYXksIHJldHVybmluZyBhIG5ldyBKYXZhU2NyaXB0IGFycmF5LlxuICAgICAgICAgICAgICByZXN1bHRzID0gW107XG4gICAgICAgICAgICAgIGZvciAoOzsgaGFzTWVtYmVycyB8fCAoaGFzTWVtYmVycyA9IHRydWUpKSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSBsZXgoKTtcbiAgICAgICAgICAgICAgICAvLyBBIGNsb3Npbmcgc3F1YXJlIGJyYWNrZXQgbWFya3MgdGhlIGVuZCBvZiB0aGUgYXJyYXkgbGl0ZXJhbC5cbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT0gXCJdXCIpIHtcbiAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBJZiB0aGUgYXJyYXkgbGl0ZXJhbCBjb250YWlucyBlbGVtZW50cywgdGhlIGN1cnJlbnQgdG9rZW5cbiAgICAgICAgICAgICAgICAvLyBzaG91bGQgYmUgYSBjb21tYSBzZXBhcmF0aW5nIHRoZSBwcmV2aW91cyBlbGVtZW50IGZyb20gdGhlXG4gICAgICAgICAgICAgICAgLy8gbmV4dC5cbiAgICAgICAgICAgICAgICBpZiAoaGFzTWVtYmVycykge1xuICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlID09IFwiLFwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gbGV4KCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcIl1cIikge1xuICAgICAgICAgICAgICAgICAgICAgIC8vIFVuZXhwZWN0ZWQgdHJhaWxpbmcgYCxgIGluIGFycmF5IGxpdGVyYWwuXG4gICAgICAgICAgICAgICAgICAgICAgYWJvcnQoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQSBgLGAgbXVzdCBzZXBhcmF0ZSBlYWNoIGFycmF5IGVsZW1lbnQuXG4gICAgICAgICAgICAgICAgICAgIGFib3J0KCk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIEVsaXNpb25zIGFuZCBsZWFkaW5nIGNvbW1hcyBhcmUgbm90IHBlcm1pdHRlZC5cbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT0gXCIsXCIpIHtcbiAgICAgICAgICAgICAgICAgIGFib3J0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChnZXQodmFsdWUpKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0cztcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodmFsdWUgPT0gXCJ7XCIpIHtcbiAgICAgICAgICAgICAgLy8gUGFyc2VzIGEgSlNPTiBvYmplY3QsIHJldHVybmluZyBhIG5ldyBKYXZhU2NyaXB0IG9iamVjdC5cbiAgICAgICAgICAgICAgcmVzdWx0cyA9IHt9O1xuICAgICAgICAgICAgICBmb3IgKDs7IGhhc01lbWJlcnMgfHwgKGhhc01lbWJlcnMgPSB0cnVlKSkge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gbGV4KCk7XG4gICAgICAgICAgICAgICAgLy8gQSBjbG9zaW5nIGN1cmx5IGJyYWNlIG1hcmtzIHRoZSBlbmQgb2YgdGhlIG9iamVjdCBsaXRlcmFsLlxuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcIn1cIikge1xuICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIElmIHRoZSBvYmplY3QgbGl0ZXJhbCBjb250YWlucyBtZW1iZXJzLCB0aGUgY3VycmVudCB0b2tlblxuICAgICAgICAgICAgICAgIC8vIHNob3VsZCBiZSBhIGNvbW1hIHNlcGFyYXRvci5cbiAgICAgICAgICAgICAgICBpZiAoaGFzTWVtYmVycykge1xuICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlID09IFwiLFwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gbGV4KCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcIn1cIikge1xuICAgICAgICAgICAgICAgICAgICAgIC8vIFVuZXhwZWN0ZWQgdHJhaWxpbmcgYCxgIGluIG9iamVjdCBsaXRlcmFsLlxuICAgICAgICAgICAgICAgICAgICAgIGFib3J0KCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEEgYCxgIG11c3Qgc2VwYXJhdGUgZWFjaCBvYmplY3QgbWVtYmVyLlxuICAgICAgICAgICAgICAgICAgICBhYm9ydCgpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBMZWFkaW5nIGNvbW1hcyBhcmUgbm90IHBlcm1pdHRlZCwgb2JqZWN0IHByb3BlcnR5IG5hbWVzIG11c3QgYmVcbiAgICAgICAgICAgICAgICAvLyBkb3VibGUtcXVvdGVkIHN0cmluZ3MsIGFuZCBhIGA6YCBtdXN0IHNlcGFyYXRlIGVhY2ggcHJvcGVydHlcbiAgICAgICAgICAgICAgICAvLyBuYW1lIGFuZCB2YWx1ZS5cbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT0gXCIsXCIgfHwgdHlwZW9mIHZhbHVlICE9IFwic3RyaW5nXCIgfHwgKGNoYXJJbmRleEJ1Z2d5ID8gdmFsdWUuY2hhckF0KDApIDogdmFsdWVbMF0pICE9IFwiQFwiIHx8IGxleCgpICE9IFwiOlwiKSB7XG4gICAgICAgICAgICAgICAgICBhYm9ydCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXN1bHRzW3ZhbHVlLnNsaWNlKDEpXSA9IGdldChsZXgoKSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBVbmV4cGVjdGVkIHRva2VuIGVuY291bnRlcmVkLlxuICAgICAgICAgICAgYWJvcnQoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIEludGVybmFsOiBVcGRhdGVzIGEgdHJhdmVyc2VkIG9iamVjdCBtZW1iZXIuXG4gICAgICAgIHZhciB1cGRhdGUgPSBmdW5jdGlvbiAoc291cmNlLCBwcm9wZXJ0eSwgY2FsbGJhY2spIHtcbiAgICAgICAgICB2YXIgZWxlbWVudCA9IHdhbGsoc291cmNlLCBwcm9wZXJ0eSwgY2FsbGJhY2spO1xuICAgICAgICAgIGlmIChlbGVtZW50ID09PSB1bmRlZikge1xuICAgICAgICAgICAgZGVsZXRlIHNvdXJjZVtwcm9wZXJ0eV07XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNvdXJjZVtwcm9wZXJ0eV0gPSBlbGVtZW50O1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAvLyBJbnRlcm5hbDogUmVjdXJzaXZlbHkgdHJhdmVyc2VzIGEgcGFyc2VkIEpTT04gb2JqZWN0LCBpbnZva2luZyB0aGVcbiAgICAgICAgLy8gYGNhbGxiYWNrYCBmdW5jdGlvbiBmb3IgZWFjaCB2YWx1ZS4gVGhpcyBpcyBhbiBpbXBsZW1lbnRhdGlvbiBvZiB0aGVcbiAgICAgICAgLy8gYFdhbGsoaG9sZGVyLCBuYW1lKWAgb3BlcmF0aW9uIGRlZmluZWQgaW4gRVMgNS4xIHNlY3Rpb24gMTUuMTIuMi5cbiAgICAgICAgdmFyIHdhbGsgPSBmdW5jdGlvbiAoc291cmNlLCBwcm9wZXJ0eSwgY2FsbGJhY2spIHtcbiAgICAgICAgICB2YXIgdmFsdWUgPSBzb3VyY2VbcHJvcGVydHldLCBsZW5ndGg7XG4gICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PSBcIm9iamVjdFwiICYmIHZhbHVlKSB7XG4gICAgICAgICAgICAvLyBgZm9yRWFjaGAgY2FuJ3QgYmUgdXNlZCB0byB0cmF2ZXJzZSBhbiBhcnJheSBpbiBPcGVyYSA8PSA4LjU0XG4gICAgICAgICAgICAvLyBiZWNhdXNlIGl0cyBgT2JqZWN0I2hhc093blByb3BlcnR5YCBpbXBsZW1lbnRhdGlvbiByZXR1cm5zIGBmYWxzZWBcbiAgICAgICAgICAgIC8vIGZvciBhcnJheSBpbmRpY2VzIChlLmcuLCBgIVsxLCAyLCAzXS5oYXNPd25Qcm9wZXJ0eShcIjBcIilgKS5cbiAgICAgICAgICAgIGlmIChnZXRDbGFzcy5jYWxsKHZhbHVlKSA9PSBhcnJheUNsYXNzKSB7XG4gICAgICAgICAgICAgIGZvciAobGVuZ3RoID0gdmFsdWUubGVuZ3RoOyBsZW5ndGgtLTspIHtcbiAgICAgICAgICAgICAgICB1cGRhdGUodmFsdWUsIGxlbmd0aCwgY2FsbGJhY2spO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBmb3JFYWNoKHZhbHVlLCBmdW5jdGlvbiAocHJvcGVydHkpIHtcbiAgICAgICAgICAgICAgICB1cGRhdGUodmFsdWUsIHByb3BlcnR5LCBjYWxsYmFjayk7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gY2FsbGJhY2suY2FsbChzb3VyY2UsIHByb3BlcnR5LCB2YWx1ZSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gUHVibGljOiBgSlNPTi5wYXJzZWAuIFNlZSBFUyA1LjEgc2VjdGlvbiAxNS4xMi4yLlxuICAgICAgICBleHBvcnRzLnBhcnNlID0gZnVuY3Rpb24gKHNvdXJjZSwgY2FsbGJhY2spIHtcbiAgICAgICAgICB2YXIgcmVzdWx0LCB2YWx1ZTtcbiAgICAgICAgICBJbmRleCA9IDA7XG4gICAgICAgICAgU291cmNlID0gXCJcIiArIHNvdXJjZTtcbiAgICAgICAgICByZXN1bHQgPSBnZXQobGV4KCkpO1xuICAgICAgICAgIC8vIElmIGEgSlNPTiBzdHJpbmcgY29udGFpbnMgbXVsdGlwbGUgdG9rZW5zLCBpdCBpcyBpbnZhbGlkLlxuICAgICAgICAgIGlmIChsZXgoKSAhPSBcIiRcIikge1xuICAgICAgICAgICAgYWJvcnQoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gUmVzZXQgdGhlIHBhcnNlciBzdGF0ZS5cbiAgICAgICAgICBJbmRleCA9IFNvdXJjZSA9IG51bGw7XG4gICAgICAgICAgcmV0dXJuIGNhbGxiYWNrICYmIGdldENsYXNzLmNhbGwoY2FsbGJhY2spID09IGZ1bmN0aW9uQ2xhc3MgPyB3YWxrKCh2YWx1ZSA9IHt9LCB2YWx1ZVtcIlwiXSA9IHJlc3VsdCwgdmFsdWUpLCBcIlwiLCBjYWxsYmFjaykgOiByZXN1bHQ7XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfVxuXG4gICAgZXhwb3J0c1tcInJ1bkluQ29udGV4dFwiXSA9IHJ1bkluQ29udGV4dDtcbiAgICByZXR1cm4gZXhwb3J0cztcbiAgfVxuXG4gIGlmICh0eXBlb2YgZXhwb3J0cyA9PSBcIm9iamVjdFwiICYmIGV4cG9ydHMgJiYgIWV4cG9ydHMubm9kZVR5cGUgJiYgIWlzTG9hZGVyKSB7XG4gICAgLy8gRXhwb3J0IGZvciBDb21tb25KUyBlbnZpcm9ubWVudHMuXG4gICAgcnVuSW5Db250ZXh0KHJvb3QsIGV4cG9ydHMpO1xuICB9IGVsc2Uge1xuICAgIC8vIEV4cG9ydCBmb3Igd2ViIGJyb3dzZXJzIGFuZCBKYXZhU2NyaXB0IGVuZ2luZXMuXG4gICAgdmFyIG5hdGl2ZUpTT04gPSByb290LkpTT047XG4gICAgdmFyIEpTT04zID0gcnVuSW5Db250ZXh0KHJvb3QsIChyb290W1wiSlNPTjNcIl0gPSB7XG4gICAgICAvLyBQdWJsaWM6IFJlc3RvcmVzIHRoZSBvcmlnaW5hbCB2YWx1ZSBvZiB0aGUgZ2xvYmFsIGBKU09OYCBvYmplY3QgYW5kXG4gICAgICAvLyByZXR1cm5zIGEgcmVmZXJlbmNlIHRvIHRoZSBgSlNPTjNgIG9iamVjdC5cbiAgICAgIFwibm9Db25mbGljdFwiOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJvb3QuSlNPTiA9IG5hdGl2ZUpTT047XG4gICAgICAgIHJldHVybiBKU09OMztcbiAgICAgIH1cbiAgICB9KSk7XG5cbiAgICByb290LkpTT04gPSB7XG4gICAgICBcInBhcnNlXCI6IEpTT04zLnBhcnNlLFxuICAgICAgXCJzdHJpbmdpZnlcIjogSlNPTjMuc3RyaW5naWZ5XG4gICAgfTtcbiAgfVxuXG4gIC8vIEV4cG9ydCBmb3IgYXN5bmNocm9ub3VzIG1vZHVsZSBsb2FkZXJzLlxuICBpZiAoaXNMb2FkZXIpIHtcbiAgICBkZWZpbmUoZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIEpTT04zO1xuICAgIH0pO1xuICB9XG59KHRoaXMpKTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcbnZhciB0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5cbnZhciBpc0Z1bmN0aW9uID0gZnVuY3Rpb24gKGZuKSB7XG5cdHJldHVybiAodHlwZW9mIGZuID09PSAnZnVuY3Rpb24nICYmICEoZm4gaW5zdGFuY2VvZiBSZWdFeHApKSB8fCB0b1N0cmluZy5jYWxsKGZuKSA9PT0gJ1tvYmplY3QgRnVuY3Rpb25dJztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZm9yRWFjaChvYmosIGZuKSB7XG5cdGlmICghaXNGdW5jdGlvbihmbikpIHtcblx0XHR0aHJvdyBuZXcgVHlwZUVycm9yKCdpdGVyYXRvciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblx0fVxuXHR2YXIgaSwgayxcblx0XHRpc1N0cmluZyA9IHR5cGVvZiBvYmogPT09ICdzdHJpbmcnLFxuXHRcdGwgPSBvYmoubGVuZ3RoLFxuXHRcdGNvbnRleHQgPSBhcmd1bWVudHMubGVuZ3RoID4gMiA/IGFyZ3VtZW50c1syXSA6IG51bGw7XG5cdGlmIChsID09PSArbCkge1xuXHRcdGZvciAoaSA9IDA7IGkgPCBsOyBpKyspIHtcblx0XHRcdGlmIChjb250ZXh0ID09PSBudWxsKSB7XG5cdFx0XHRcdGZuKGlzU3RyaW5nID8gb2JqLmNoYXJBdChpKSA6IG9ialtpXSwgaSwgb2JqKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGZuLmNhbGwoY29udGV4dCwgaXNTdHJpbmcgPyBvYmouY2hhckF0KGkpIDogb2JqW2ldLCBpLCBvYmopO1xuXHRcdFx0fVxuXHRcdH1cblx0fSBlbHNlIHtcblx0XHRmb3IgKGsgaW4gb2JqKSB7XG5cdFx0XHRpZiAoaGFzT3duLmNhbGwob2JqLCBrKSkge1xuXHRcdFx0XHRpZiAoY29udGV4dCA9PT0gbnVsbCkge1xuXHRcdFx0XHRcdGZuKG9ialtrXSwgaywgb2JqKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRmbi5jYWxsKGNvbnRleHQsIG9ialtrXSwgaywgb2JqKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxufTtcblxuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbi8vIG1vZGlmaWVkIGZyb20gaHR0cHM6Ly9naXRodWIuY29tL2VzLXNoaW1zL2VzNS1zaGltXG52YXIgaGFzID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eSxcblx0dG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLFxuXHRmb3JFYWNoID0gcmVxdWlyZSgnLi9mb3JlYWNoJyksXG5cdGlzQXJncyA9IHJlcXVpcmUoJy4vaXNBcmd1bWVudHMnKSxcblx0aGFzRG9udEVudW1CdWcgPSAhKHsndG9TdHJpbmcnOiBudWxsfSkucHJvcGVydHlJc0VudW1lcmFibGUoJ3RvU3RyaW5nJyksXG5cdGhhc1Byb3RvRW51bUJ1ZyA9IChmdW5jdGlvbiAoKSB7fSkucHJvcGVydHlJc0VudW1lcmFibGUoJ3Byb3RvdHlwZScpLFxuXHRkb250RW51bXMgPSBbXG5cdFx0XCJ0b1N0cmluZ1wiLFxuXHRcdFwidG9Mb2NhbGVTdHJpbmdcIixcblx0XHRcInZhbHVlT2ZcIixcblx0XHRcImhhc093blByb3BlcnR5XCIsXG5cdFx0XCJpc1Byb3RvdHlwZU9mXCIsXG5cdFx0XCJwcm9wZXJ0eUlzRW51bWVyYWJsZVwiLFxuXHRcdFwiY29uc3RydWN0b3JcIlxuXHRdO1xuXG52YXIga2V5c1NoaW0gPSBmdW5jdGlvbiBrZXlzKG9iamVjdCkge1xuXHR2YXIgaXNPYmplY3QgPSBvYmplY3QgIT09IG51bGwgJiYgdHlwZW9mIG9iamVjdCA9PT0gJ29iamVjdCcsXG5cdFx0aXNGdW5jdGlvbiA9IHRvU3RyaW5nLmNhbGwob2JqZWN0KSA9PT0gJ1tvYmplY3QgRnVuY3Rpb25dJyxcblx0XHRpc0FyZ3VtZW50cyA9IGlzQXJncyhvYmplY3QpLFxuXHRcdHRoZUtleXMgPSBbXTtcblxuXHRpZiAoIWlzT2JqZWN0ICYmICFpc0Z1bmN0aW9uICYmICFpc0FyZ3VtZW50cykge1xuXHRcdHRocm93IG5ldyBUeXBlRXJyb3IoXCJPYmplY3Qua2V5cyBjYWxsZWQgb24gYSBub24tb2JqZWN0XCIpO1xuXHR9XG5cblx0aWYgKGlzQXJndW1lbnRzKSB7XG5cdFx0Zm9yRWFjaChvYmplY3QsIGZ1bmN0aW9uICh2YWx1ZSwgaW5kZXgpIHtcblx0XHRcdHRoZUtleXMucHVzaChpbmRleCk7XG5cdFx0fSk7XG5cdH0gZWxzZSB7XG5cdFx0dmFyIG5hbWUsXG5cdFx0XHRza2lwUHJvdG8gPSBoYXNQcm90b0VudW1CdWcgJiYgaXNGdW5jdGlvbjtcblxuXHRcdGZvciAobmFtZSBpbiBvYmplY3QpIHtcblx0XHRcdGlmICghKHNraXBQcm90byAmJiBuYW1lID09PSAncHJvdG90eXBlJykgJiYgaGFzLmNhbGwob2JqZWN0LCBuYW1lKSkge1xuXHRcdFx0XHR0aGVLZXlzLnB1c2gobmFtZSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0aWYgKGhhc0RvbnRFbnVtQnVnKSB7XG5cdFx0dmFyIGN0b3IgPSBvYmplY3QuY29uc3RydWN0b3IsXG5cdFx0XHRza2lwQ29uc3RydWN0b3IgPSBjdG9yICYmIGN0b3IucHJvdG90eXBlID09PSBvYmplY3Q7XG5cblx0XHRmb3JFYWNoKGRvbnRFbnVtcywgZnVuY3Rpb24gKGRvbnRFbnVtKSB7XG5cdFx0XHRpZiAoIShza2lwQ29uc3RydWN0b3IgJiYgZG9udEVudW0gPT09ICdjb25zdHJ1Y3RvcicpICYmIGhhcy5jYWxsKG9iamVjdCwgZG9udEVudW0pKSB7XG5cdFx0XHRcdHRoZUtleXMucHVzaChkb250RW51bSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cblx0cmV0dXJuIHRoZUtleXM7XG59O1xuXG5rZXlzU2hpbS5zaGltID0gZnVuY3Rpb24gc2hpbU9iamVjdEtleXMoKSB7XG5cdGlmICghT2JqZWN0LmtleXMpIHtcblx0XHRPYmplY3Qua2V5cyA9IGtleXNTaGltO1xuXHR9XG5cdHJldHVybiBPYmplY3Qua2V5cyB8fCBrZXlzU2hpbTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0ga2V5c1NoaW07XG5cbiIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgdG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzQXJndW1lbnRzKHZhbHVlKSB7XG5cdHZhciBzdHIgPSB0b1N0cmluZy5jYWxsKHZhbHVlKTtcblx0dmFyIGlzQXJndW1lbnRzID0gc3RyID09PSAnW29iamVjdCBBcmd1bWVudHNdJztcblx0aWYgKCFpc0FyZ3VtZW50cykge1xuXHRcdGlzQXJndW1lbnRzID0gc3RyICE9PSAnW29iamVjdCBBcnJheV0nXG5cdFx0XHQmJiB2YWx1ZSAhPT0gbnVsbFxuXHRcdFx0JiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0J1xuXHRcdFx0JiYgdHlwZW9mIHZhbHVlLmxlbmd0aCA9PT0gJ251bWJlcidcblx0XHRcdCYmIHZhbHVlLmxlbmd0aCA+PSAwXG5cdFx0XHQmJiB0b1N0cmluZy5jYWxsKHZhbHVlLmNhbGxlZSkgPT09ICdbb2JqZWN0IEZ1bmN0aW9uXSc7XG5cdH1cblx0cmV0dXJuIGlzQXJndW1lbnRzO1xufTtcblxuIiwiXG4vKipcbiAqIE1vZHVsZSBkZXBlbmRlbmNpZXMuXG4gKi9cblxudmFyIG1hcCA9IHJlcXVpcmUoJ2FycmF5LW1hcCcpO1xudmFyIGluZGV4T2YgPSByZXF1aXJlKCdpbmRleG9mJyk7XG52YXIgaXNBcnJheSA9IHJlcXVpcmUoJ2lzYXJyYXknKTtcbnZhciBmb3JFYWNoID0gcmVxdWlyZSgnZm9yZWFjaCcpO1xudmFyIHJlZHVjZSA9IHJlcXVpcmUoJ2FycmF5LXJlZHVjZScpO1xudmFyIGdldE9iamVjdEtleXMgPSByZXF1aXJlKCdvYmplY3Qta2V5cycpO1xudmFyIEpTT04gPSByZXF1aXJlKCdqc29uMycpO1xuXG4vKipcbiAqIE1ha2Ugc3VyZSBgT2JqZWN0LmtleXNgIHdvcmsgZm9yIGB1bmRlZmluZWRgXG4gKiB2YWx1ZXMgdGhhdCBhcmUgc3RpbGwgdGhlcmUsIGxpa2UgYGRvY3VtZW50LmFsbGAuXG4gKiBodHRwOi8vbGlzdHMudzMub3JnL0FyY2hpdmVzL1B1YmxpYy9wdWJsaWMtaHRtbC8yMDA5SnVuLzA1NDYuaHRtbFxuICpcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIG9iamVjdEtleXModmFsKXtcbiAgaWYgKE9iamVjdC5rZXlzKSByZXR1cm4gT2JqZWN0LmtleXModmFsKTtcbiAgcmV0dXJuIGdldE9iamVjdEtleXModmFsKTtcbn1cblxuLyoqXG4gKiBNb2R1bGUgZXhwb3J0cy5cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGluc3BlY3Q7XG5cbi8qKlxuICogRWNob3MgdGhlIHZhbHVlIG9mIGEgdmFsdWUuIFRyeXMgdG8gcHJpbnQgdGhlIHZhbHVlIG91dFxuICogaW4gdGhlIGJlc3Qgd2F5IHBvc3NpYmxlIGdpdmVuIHRoZSBkaWZmZXJlbnQgdHlwZXMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9iaiBUaGUgb2JqZWN0IHRvIHByaW50IG91dC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIE9wdGlvbmFsIG9wdGlvbnMgb2JqZWN0IHRoYXQgYWx0ZXJzIHRoZSBvdXRwdXQuXG4gKiBAbGljZW5zZSBNSVQgKMKpIEpveWVudClcbiAqL1xuLyogbGVnYWN5OiBvYmosIHNob3dIaWRkZW4sIGRlcHRoLCBjb2xvcnMqL1xuXG5mdW5jdGlvbiBpbnNwZWN0KG9iaiwgb3B0cykge1xuICAvLyBkZWZhdWx0IG9wdGlvbnNcbiAgdmFyIGN0eCA9IHtcbiAgICBzZWVuOiBbXSxcbiAgICBzdHlsaXplOiBzdHlsaXplTm9Db2xvclxuICB9O1xuICAvLyBsZWdhY3kuLi5cbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gMykgY3R4LmRlcHRoID0gYXJndW1lbnRzWzJdO1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSA0KSBjdHguY29sb3JzID0gYXJndW1lbnRzWzNdO1xuICBpZiAoaXNCb29sZWFuKG9wdHMpKSB7XG4gICAgLy8gbGVnYWN5Li4uXG4gICAgY3R4LnNob3dIaWRkZW4gPSBvcHRzO1xuICB9IGVsc2UgaWYgKG9wdHMpIHtcbiAgICAvLyBnb3QgYW4gXCJvcHRpb25zXCIgb2JqZWN0XG4gICAgX2V4dGVuZChjdHgsIG9wdHMpO1xuICB9XG4gIC8vIHNldCBkZWZhdWx0IG9wdGlvbnNcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5zaG93SGlkZGVuKSkgY3R4LnNob3dIaWRkZW4gPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5kZXB0aCkpIGN0eC5kZXB0aCA9IDI7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY29sb3JzKSkgY3R4LmNvbG9ycyA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmN1c3RvbUluc3BlY3QpKSBjdHguY3VzdG9tSW5zcGVjdCA9IHRydWU7XG4gIGlmIChjdHguY29sb3JzKSBjdHguc3R5bGl6ZSA9IHN0eWxpemVXaXRoQ29sb3I7XG4gIHJldHVybiBmb3JtYXRWYWx1ZShjdHgsIG9iaiwgY3R4LmRlcHRoKTtcbn1cblxuLy8gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9BTlNJX2VzY2FwZV9jb2RlI2dyYXBoaWNzXG5pbnNwZWN0LmNvbG9ycyA9IHtcbiAgJ2JvbGQnIDogWzEsIDIyXSxcbiAgJ2l0YWxpYycgOiBbMywgMjNdLFxuICAndW5kZXJsaW5lJyA6IFs0LCAyNF0sXG4gICdpbnZlcnNlJyA6IFs3LCAyN10sXG4gICd3aGl0ZScgOiBbMzcsIDM5XSxcbiAgJ2dyZXknIDogWzkwLCAzOV0sXG4gICdibGFjaycgOiBbMzAsIDM5XSxcbiAgJ2JsdWUnIDogWzM0LCAzOV0sXG4gICdjeWFuJyA6IFszNiwgMzldLFxuICAnZ3JlZW4nIDogWzMyLCAzOV0sXG4gICdtYWdlbnRhJyA6IFszNSwgMzldLFxuICAncmVkJyA6IFszMSwgMzldLFxuICAneWVsbG93JyA6IFszMywgMzldXG59O1xuXG4vLyBEb24ndCB1c2UgJ2JsdWUnIG5vdCB2aXNpYmxlIG9uIGNtZC5leGVcbmluc3BlY3Quc3R5bGVzID0ge1xuICAnc3BlY2lhbCc6ICdjeWFuJyxcbiAgJ251bWJlcic6ICd5ZWxsb3cnLFxuICAnYm9vbGVhbic6ICd5ZWxsb3cnLFxuICAndW5kZWZpbmVkJzogJ2dyZXknLFxuICAnbnVsbCc6ICdib2xkJyxcbiAgJ3N0cmluZyc6ICdncmVlbicsXG4gICdkYXRlJzogJ21hZ2VudGEnLFxuICAvLyBcIm5hbWVcIjogaW50ZW50aW9uYWxseSBub3Qgc3R5bGluZ1xuICAncmVnZXhwJzogJ3JlZCdcbn07XG5cbmZ1bmN0aW9uIHN0eWxpemVOb0NvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHJldHVybiBzdHI7XG59XG5cbmZ1bmN0aW9uIGlzQm9vbGVhbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJztcbn1cblxuZnVuY3Rpb24gaXNVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IHZvaWQgMDtcbn1cblxuZnVuY3Rpb24gc3R5bGl6ZVdpdGhDb2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICB2YXIgc3R5bGUgPSBpbnNwZWN0LnN0eWxlc1tzdHlsZVR5cGVdO1xuXG4gIGlmIChzdHlsZSkge1xuICAgIHJldHVybiAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzBdICsgJ20nICsgc3RyICtcbiAgICAgICAgICAgJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVsxXSArICdtJztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gc3RyO1xuICB9XG59XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuXG5mdW5jdGlvbiBpc1N0cmluZyhhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnO1xufVxuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuXG5mdW5jdGlvbiBpc051bGwoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGw7XG59XG5cbmZ1bmN0aW9uIGhhc093bihvYmosIHByb3ApIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApO1xufVxuXG5mdW5jdGlvbiBpc1JlZ0V4cChyZSkge1xuICByZXR1cm4gaXNPYmplY3QocmUpICYmIG9iamVjdFRvU3RyaW5nKHJlKSA9PT0gJ1tvYmplY3QgUmVnRXhwXSc7XG59XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuXG5mdW5jdGlvbiBpc0Vycm9yKGUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGUpICYmXG4gICAgICAob2JqZWN0VG9TdHJpbmcoZSkgPT09ICdbb2JqZWN0IEVycm9yXScgfHwgZSBpbnN0YW5jZW9mIEVycm9yKTtcbn1cblxuZnVuY3Rpb24gaXNEYXRlKGQpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGQpICYmIG9iamVjdFRvU3RyaW5nKGQpID09PSAnW29iamVjdCBEYXRlXSc7XG59XG5cbmZ1bmN0aW9uIG9iamVjdFRvU3RyaW5nKG8pIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvKTtcbn1cblxuZnVuY3Rpb24gYXJyYXlUb0hhc2goYXJyYXkpIHtcbiAgdmFyIGhhc2ggPSB7fTtcblxuICBmb3JFYWNoKGFycmF5LCBmdW5jdGlvbih2YWwsIGlkeCkge1xuICAgIGhhc2hbdmFsXSA9IHRydWU7XG4gIH0pO1xuXG4gIHJldHVybiBoYXNoO1xufVxuXG5mdW5jdGlvbiBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKSB7XG4gIHZhciBvdXRwdXQgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSB2YWx1ZS5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICBpZiAoaGFzT3duKHZhbHVlLCBTdHJpbmcoaSkpKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIFN0cmluZyhpKSwgdHJ1ZSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBvdXRwdXQucHVzaCgnJyk7XG4gICAgfVxuICB9XG4gIGZvckVhY2goa2V5cywgZnVuY3Rpb24oa2V5KSB7XG4gICAgaWYgKCFrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIGtleSwgdHJ1ZSkpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBvdXRwdXQ7XG59XG5cbmZ1bmN0aW9uIGZvcm1hdEVycm9yKHZhbHVlKSB7XG4gIHJldHVybiAnWycgKyBFcnJvci5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSkgKyAnXSc7XG59XG5cbmZ1bmN0aW9uIGZvcm1hdFZhbHVlKGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcykge1xuICAvLyBQcm92aWRlIGEgaG9vayBmb3IgdXNlci1zcGVjaWZpZWQgaW5zcGVjdCBmdW5jdGlvbnMuXG4gIC8vIENoZWNrIHRoYXQgdmFsdWUgaXMgYW4gb2JqZWN0IHdpdGggYW4gaW5zcGVjdCBmdW5jdGlvbiBvbiBpdFxuICBpZiAoY3R4LmN1c3RvbUluc3BlY3QgJiZcbiAgICAgIHZhbHVlICYmXG4gICAgICBpc0Z1bmN0aW9uKHZhbHVlLmluc3BlY3QpICYmXG4gICAgICAvLyBGaWx0ZXIgb3V0IHRoZSB1dGlsIG1vZHVsZSwgaXQncyBpbnNwZWN0IGZ1bmN0aW9uIGlzIHNwZWNpYWxcbiAgICAgIHZhbHVlLmluc3BlY3QgIT09IGluc3BlY3QgJiZcbiAgICAgIC8vIEFsc28gZmlsdGVyIG91dCBhbnkgcHJvdG90eXBlIG9iamVjdHMgdXNpbmcgdGhlIGNpcmN1bGFyIGNoZWNrLlxuICAgICAgISh2YWx1ZS5jb25zdHJ1Y3RvciAmJiB2YWx1ZS5jb25zdHJ1Y3Rvci5wcm90b3R5cGUgPT09IHZhbHVlKSkge1xuICAgIHZhciByZXQgPSB2YWx1ZS5pbnNwZWN0KHJlY3Vyc2VUaW1lcywgY3R4KTtcbiAgICBpZiAoIWlzU3RyaW5nKHJldCkpIHtcbiAgICAgIHJldCA9IGZvcm1hdFZhbHVlKGN0eCwgcmV0LCByZWN1cnNlVGltZXMpO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xuICB9XG5cbiAgLy8gUHJpbWl0aXZlIHR5cGVzIGNhbm5vdCBoYXZlIHByb3BlcnRpZXNcbiAgdmFyIHByaW1pdGl2ZSA9IGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKTtcbiAgaWYgKHByaW1pdGl2ZSkge1xuICAgIHJldHVybiBwcmltaXRpdmU7XG4gIH1cblxuICAvLyBMb29rIHVwIHRoZSBrZXlzIG9mIHRoZSBvYmplY3QuXG4gIHZhciBrZXlzID0gb2JqZWN0S2V5cyh2YWx1ZSk7XG4gIHZhciB2aXNpYmxlS2V5cyA9IGFycmF5VG9IYXNoKGtleXMpO1xuXG4gIGlmIChjdHguc2hvd0hpZGRlbiAmJiBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcykge1xuICAgIGtleXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh2YWx1ZSk7XG4gIH1cblxuICAvLyBJRSBkb2Vzbid0IG1ha2UgZXJyb3IgZmllbGRzIG5vbi1lbnVtZXJhYmxlXG4gIC8vIGh0dHA6Ly9tc2RuLm1pY3Jvc29mdC5jb20vZW4tdXMvbGlicmFyeS9pZS9kd3c1MnNidCh2PXZzLjk0KS5hc3B4XG4gIGlmIChpc0Vycm9yKHZhbHVlKVxuICAgICAgJiYgKGluZGV4T2Yoa2V5cywgJ21lc3NhZ2UnKSA+PSAwIHx8IGluZGV4T2Yoa2V5cywgJ2Rlc2NyaXB0aW9uJykgPj0gMCkpIHtcbiAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgLy8gU29tZSB0eXBlIG9mIG9iamVjdCB3aXRob3V0IHByb3BlcnRpZXMgY2FuIGJlIHNob3J0Y3V0dGVkLlxuICBpZiAoa2V5cy5sZW5ndGggPT09IDApIHtcbiAgICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICAgIHZhciBuYW1lID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tGdW5jdGlvbicgKyBuYW1lICsgJ10nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH1cbiAgICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKERhdGUucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAnZGF0ZScpO1xuICAgIH1cbiAgICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgdmFyIGJhc2UgPSAnJywgYXJyYXkgPSBmYWxzZSwgYnJhY2VzID0gWyd7JywgJ30nXTtcblxuICAvLyBNYWtlIEFycmF5IHNheSB0aGF0IHRoZXkgYXJlIEFycmF5XG4gIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgIGFycmF5ID0gdHJ1ZTtcbiAgICBicmFjZXMgPSBbJ1snLCAnXSddO1xuICB9XG5cbiAgLy8gTWFrZSBmdW5jdGlvbnMgc2F5IHRoYXQgdGhleSBhcmUgZnVuY3Rpb25zXG4gIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgIHZhciBuID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgYmFzZSA9ICcgW0Z1bmN0aW9uJyArIG4gKyAnXSc7XG4gIH1cblxuICAvLyBNYWtlIFJlZ0V4cHMgc2F5IHRoYXQgdGhleSBhcmUgUmVnRXhwc1xuICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIH1cblxuICAvLyBNYWtlIGRhdGVzIHdpdGggcHJvcGVydGllcyBmaXJzdCBzYXkgdGhlIGRhdGVcbiAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgRGF0ZS5wcm90b3R5cGUudG9VVENTdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIH1cblxuICAvLyBNYWtlIGVycm9yIHdpdGggbWVzc2FnZSBmaXJzdCBzYXkgdGhlIGVycm9yXG4gIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICBpZiAoa2V5cy5sZW5ndGggPT09IDAgJiYgKCFhcnJheSB8fCB2YWx1ZS5sZW5ndGggPT0gMCkpIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICsgYmFzZSArIGJyYWNlc1sxXTtcbiAgfVxuXG4gIGlmIChyZWN1cnNlVGltZXMgPCAwKSB7XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbT2JqZWN0XScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG5cbiAgY3R4LnNlZW4ucHVzaCh2YWx1ZSk7XG5cbiAgdmFyIG91dHB1dDtcbiAgaWYgKGFycmF5KSB7XG4gICAgb3V0cHV0ID0gZm9ybWF0QXJyYXkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5cyk7XG4gIH0gZWxzZSB7XG4gICAgb3V0cHV0ID0gbWFwKGtleXMsIGZ1bmN0aW9uKGtleSkge1xuICAgICAgcmV0dXJuIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpO1xuICAgIH0pO1xuICB9XG5cbiAgY3R4LnNlZW4ucG9wKCk7XG5cbiAgcmV0dXJuIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKTtcbn1cblxuZnVuY3Rpb24gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSkge1xuICB2YXIgbmFtZSwgc3RyLCBkZXNjO1xuICBkZXNjID0geyB2YWx1ZTogdmFsdWVba2V5XSB9O1xuICBpZiAoT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcikge1xuICAgIGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHZhbHVlLCBrZXkpIHx8IGRlc2M7XG4gIH1cbiAgaWYgKGRlc2MuZ2V0KSB7XG4gICAgaWYgKGRlc2Muc2V0KSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlci9TZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKGRlc2Muc2V0KSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoIWhhc093bih2aXNpYmxlS2V5cywga2V5KSkge1xuICAgIG5hbWUgPSAnWycgKyBrZXkgKyAnXSc7XG4gIH1cbiAgaWYgKCFzdHIpIHtcbiAgICBpZiAoaW5kZXhPZihjdHguc2VlbiwgZGVzYy52YWx1ZSkgPCAwKSB7XG4gICAgICBpZiAoaXNOdWxsKHJlY3Vyc2VUaW1lcykpIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCBudWxsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgcmVjdXJzZVRpbWVzIC0gMSk7XG4gICAgICB9XG4gICAgICBpZiAoc3RyLmluZGV4T2YoJ1xcbicpID4gLTEpIHtcbiAgICAgICAgaWYgKGFycmF5KSB7XG4gICAgICAgICAgc3RyID0gbWFwKHN0ci5zcGxpdCgnXFxuJyksIGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKS5zdWJzdHIoMik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3RyID0gJ1xcbicgKyBtYXAoc3RyLnNwbGl0KCdcXG4nKSwgZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0NpcmN1bGFyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmIChpc1VuZGVmaW5lZChuYW1lKSkge1xuICAgIGlmIChhcnJheSAmJiBrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICByZXR1cm4gc3RyO1xuICAgIH1cbiAgICBuYW1lID0gSlNPTi5zdHJpbmdpZnkoJycgKyBrZXkpO1xuICAgIGlmIChuYW1lLm1hdGNoKC9eXCIoW2EtekEtWl9dW2EtekEtWl8wLTldKilcIiQvKSkge1xuICAgICAgbmFtZSA9IG5hbWUuc3Vic3RyKDEsIG5hbWUubGVuZ3RoIC0gMik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ25hbWUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmFtZSA9IG5hbWUucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJylcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyheXCJ8XCIkKS9nLCBcIidcIik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ3N0cmluZycpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBuYW1lICsgJzogJyArIHN0cjtcbn1cblxuZnVuY3Rpb24gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ3VuZGVmaW5lZCcsICd1bmRlZmluZWQnKTtcbiAgaWYgKGlzU3RyaW5nKHZhbHVlKSkge1xuICAgIHZhciBzaW1wbGUgPSAnXFwnJyArIEpTT04uc3RyaW5naWZ5KHZhbHVlKS5yZXBsYWNlKC9eXCJ8XCIkL2csICcnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKSArICdcXCcnO1xuICAgIHJldHVybiBjdHguc3R5bGl6ZShzaW1wbGUsICdzdHJpbmcnKTtcbiAgfVxuICBpZiAoaXNOdW1iZXIodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnbnVtYmVyJyk7XG4gIGlmIChpc0Jvb2xlYW4odmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnYm9vbGVhbicpO1xuICAvLyBGb3Igc29tZSByZWFzb24gdHlwZW9mIG51bGwgaXMgXCJvYmplY3RcIiwgc28gc3BlY2lhbCBjYXNlIGhlcmUuXG4gIGlmIChpc051bGwodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnbnVsbCcsICdudWxsJyk7XG59XG5cbmZ1bmN0aW9uIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKSB7XG4gIHZhciBudW1MaW5lc0VzdCA9IDA7XG4gIHZhciBsZW5ndGggPSByZWR1Y2Uob3V0cHV0LCBmdW5jdGlvbihwcmV2LCBjdXIpIHtcbiAgICBudW1MaW5lc0VzdCsrO1xuICAgIGlmIChjdXIuaW5kZXhPZignXFxuJykgPj0gMCkgbnVtTGluZXNFc3QrKztcbiAgICByZXR1cm4gcHJldiArIGN1ci5yZXBsYWNlKC9cXHUwMDFiXFxbXFxkXFxkP20vZywgJycpLmxlbmd0aCArIDE7XG4gIH0sIDApO1xuXG4gIGlmIChsZW5ndGggPiA2MCkge1xuICAgIHJldHVybiBicmFjZXNbMF0gK1xuICAgICAgICAgICAoYmFzZSA9PT0gJycgPyAnJyA6IGJhc2UgKyAnXFxuICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgb3V0cHV0LmpvaW4oJyxcXG4gICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgYnJhY2VzWzFdO1xuICB9XG5cbiAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyAnICcgKyBvdXRwdXQuam9pbignLCAnKSArICcgJyArIGJyYWNlc1sxXTtcbn1cblxuZnVuY3Rpb24gX2V4dGVuZChvcmlnaW4sIGFkZCkge1xuICAvLyBEb24ndCBkbyBhbnl0aGluZyBpZiBhZGQgaXNuJ3QgYW4gb2JqZWN0XG4gIGlmICghYWRkIHx8ICFpc09iamVjdChhZGQpKSByZXR1cm4gb3JpZ2luO1xuXG4gIHZhciBrZXlzID0gb2JqZWN0S2V5cyhhZGQpO1xuICB2YXIgaSA9IGtleXMubGVuZ3RoO1xuICB3aGlsZSAoaS0tKSB7XG4gICAgb3JpZ2luW2tleXNbaV1dID0gYWRkW2tleXNbaV1dO1xuICB9XG4gIHJldHVybiBvcmlnaW47XG59XG4iLCJcInVzZSBzdHJpY3RcIlxuXG4vLyBUaGlzIGlzIGEgcmVwb3J0ZXIgdGhhdCBtaW1pY3MgTW9jaGEncyBgZG90YCByZXBvcnRlclxuXG52YXIgUiA9IHJlcXVpcmUoXCIuLi9saWIvcmVwb3J0ZXJcIilcblxuZnVuY3Rpb24gd2lkdGgoKSB7XG4gICAgcmV0dXJuIFIud2luZG93V2lkdGgoKSAqIDQgLyAzIHwgMFxufVxuXG5mdW5jdGlvbiBwcmludERvdChfLCBjb2xvcikge1xuICAgIGZ1bmN0aW9uIGVtaXQoKSB7XG4gICAgICAgIHJldHVybiBfLndyaXRlKFIuY29sb3IoY29sb3IsXG4gICAgICAgICAgICBjb2xvciA9PT0gXCJmYWlsXCIgPyBSLnN5bWJvbHMoKS5Eb3RGYWlsIDogUi5zeW1ib2xzKCkuRG90KSlcbiAgICB9XG5cbiAgICBpZiAoXy5zdGF0ZS5jb3VudGVyKysgJSB3aWR0aCgpID09PSAwKSB7XG4gICAgICAgIHJldHVybiBfLndyaXRlKFIubmV3bGluZSgpICsgXCIgIFwiKS50aGVuKGVtaXQpXG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGVtaXQoKVxuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBSLm9uKFwiZG90XCIsIHtcbiAgICBhY2NlcHRzOiBbXCJ3cml0ZVwiLCBcInJlc2V0XCIsIFwiY29sb3JzXCJdLFxuICAgIGNyZWF0ZTogUi5jb25zb2xlUmVwb3J0ZXIsXG4gICAgYmVmb3JlOiBSLnNldENvbG9yLFxuICAgIGFmdGVyOiBSLnVuc2V0Q29sb3IsXG4gICAgaW5pdDogZnVuY3Rpb24gKHN0YXRlKSB7IHN0YXRlLmNvdW50ZXIgPSAwIH0sXG5cbiAgICByZXBvcnQ6IGZ1bmN0aW9uIChfLCByZXBvcnQpIHtcbiAgICAgICAgaWYgKHJlcG9ydC5pc0VudGVyIHx8IHJlcG9ydC5pc1Bhc3MpIHtcbiAgICAgICAgICAgIHJldHVybiBwcmludERvdChfLCBSLnNwZWVkKHJlcG9ydCkpXG4gICAgICAgIH0gZWxzZSBpZiAocmVwb3J0LmlzSG9vayB8fCByZXBvcnQuaXNGYWlsKSB7XG4gICAgICAgICAgICBfLnB1c2hFcnJvcihyZXBvcnQpXG4gICAgICAgICAgICAvLyBQcmludCBhIGRvdCByZWdhcmRsZXNzIG9mIGhvb2sgc3VjY2Vzc1xuICAgICAgICAgICAgcmV0dXJuIHByaW50RG90KF8sIFwiZmFpbFwiKVxuICAgICAgICB9IGVsc2UgaWYgKHJlcG9ydC5pc1NraXApIHtcbiAgICAgICAgICAgIHJldHVybiBwcmludERvdChfLCBcInNraXBcIilcbiAgICAgICAgfSBlbHNlIGlmIChyZXBvcnQuaXNFbmQpIHtcbiAgICAgICAgICAgIHJldHVybiBfLnByaW50KCkudGhlbihfLnByaW50UmVzdWx0cy5iaW5kKF8pKVxuICAgICAgICB9IGVsc2UgaWYgKHJlcG9ydC5pc0Vycm9yKSB7XG4gICAgICAgICAgICBpZiAoXy5zdGF0ZS5jb3VudGVyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF8ucHJpbnQoKS50aGVuKF8ucHJpbnRFcnJvci5iaW5kKF8sIHJlcG9ydCkpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBfLnByaW50RXJyb3IocmVwb3J0KVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuICAgICAgICB9XG4gICAgfSxcbn0pXG4iLCJcInVzZSBzdHJpY3RcIlxuXG5leHBvcnRzLmRvdCA9IHJlcXVpcmUoXCIuL2RvdFwiKVxuZXhwb3J0cy5zcGVjID0gcmVxdWlyZShcIi4vc3BlY1wiKVxuZXhwb3J0cy50YXAgPSByZXF1aXJlKFwiLi90YXBcIilcbiIsIlwidXNlIHN0cmljdFwiXG5cbi8vIFRoaXMgaXMgYSByZXBvcnRlciB0aGF0IG1pbWljcyBNb2NoYSdzIGBzcGVjYCByZXBvcnRlci5cblxudmFyIFIgPSByZXF1aXJlKFwiLi4vbGliL3JlcG9ydGVyXCIpXG52YXIgYyA9IFIuY29sb3JcblxuZnVuY3Rpb24gaW5kZW50KGxldmVsKSB7XG4gICAgdmFyIHJldCA9IFwiXCJcblxuICAgIHdoaWxlIChsZXZlbC0tKSByZXQgKz0gXCIgIFwiXG4gICAgcmV0dXJuIHJldFxufVxuXG5mdW5jdGlvbiBnZXROYW1lKGxldmVsLCByZXBvcnQpIHtcbiAgICByZXR1cm4gcmVwb3J0LnBhdGhbbGV2ZWwgLSAxXS5uYW1lXG59XG5cbmZ1bmN0aW9uIHByaW50UmVwb3J0KF8sIHJlcG9ydCwgaW5pdCkge1xuICAgIGlmIChfLnN0YXRlLmxlYXZpbmcpIHtcbiAgICAgICAgXy5zdGF0ZS5sZWF2aW5nID0gZmFsc2VcbiAgICAgICAgcmV0dXJuIF8ucHJpbnQoKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBfLnByaW50KGluZGVudChfLnN0YXRlLmxldmVsKSArIGluaXQoKSlcbiAgICAgICAgfSlcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gXy5wcmludChpbmRlbnQoXy5zdGF0ZS5sZXZlbCkgKyBpbml0KCkpXG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFIub24oXCJzcGVjXCIsIHtcbiAgICBhY2NlcHRzOiBbXCJ3cml0ZVwiLCBcInJlc2V0XCIsIFwiY29sb3JzXCJdLFxuICAgIGNyZWF0ZTogUi5jb25zb2xlUmVwb3J0ZXIsXG4gICAgYmVmb3JlOiBSLnNldENvbG9yLFxuICAgIGFmdGVyOiBSLnVuc2V0Q29sb3IsXG5cbiAgICBpbml0OiBmdW5jdGlvbiAoc3RhdGUpIHtcbiAgICAgICAgc3RhdGUubGV2ZWwgPSAxXG4gICAgICAgIHN0YXRlLmxlYXZpbmcgPSBmYWxzZVxuICAgIH0sXG5cbiAgICByZXBvcnQ6IGZ1bmN0aW9uIChfLCByZXBvcnQpIHtcbiAgICAgICAgaWYgKHJlcG9ydC5pc1N0YXJ0KSB7XG4gICAgICAgICAgICByZXR1cm4gXy5wcmludCgpXG4gICAgICAgIH0gZWxzZSBpZiAocmVwb3J0LmlzRW50ZXIpIHtcbiAgICAgICAgICAgIHZhciBsZXZlbCA9IF8uc3RhdGUubGV2ZWwrK1xuICAgICAgICAgICAgdmFyIGxhc3QgPSByZXBvcnQucGF0aFtsZXZlbCAtIDFdXG5cbiAgICAgICAgICAgIF8uc3RhdGUubGVhdmluZyA9IGZhbHNlXG4gICAgICAgICAgICBpZiAobGFzdC5pbmRleCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBfLnByaW50KCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBfLnByaW50KGluZGVudChsZXZlbCkgKyBsYXN0Lm5hbWUpXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF8ucHJpbnQoaW5kZW50KGxldmVsKSArIGxhc3QubmFtZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChyZXBvcnQuaXNMZWF2ZSkge1xuICAgICAgICAgICAgXy5zdGF0ZS5sZXZlbC0tXG4gICAgICAgICAgICBfLnN0YXRlLmxlYXZpbmcgPSB0cnVlXG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgICAgIH0gZWxzZSBpZiAocmVwb3J0LmlzUGFzcykge1xuICAgICAgICAgICAgcmV0dXJuIHByaW50UmVwb3J0KF8sIHJlcG9ydCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBzdHIgPVxuICAgICAgICAgICAgICAgICAgICBjKFwiY2hlY2ttYXJrXCIsIFIuc3ltYm9scygpLlBhc3MgKyBcIiBcIikgK1xuICAgICAgICAgICAgICAgICAgICBjKFwicGFzc1wiLCBnZXROYW1lKF8uc3RhdGUubGV2ZWwsIHJlcG9ydCkpXG5cbiAgICAgICAgICAgICAgICB2YXIgc3BlZWQgPSBSLnNwZWVkKHJlcG9ydClcblxuICAgICAgICAgICAgICAgIGlmIChzcGVlZCAhPT0gXCJmYXN0XCIpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RyICs9IGMoc3BlZWQsIFwiIChcIiArIHJlcG9ydC5kdXJhdGlvbiArIFwibXMpXCIpXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0clxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSBlbHNlIGlmIChyZXBvcnQuaXNIb29rIHx8IHJlcG9ydC5pc0ZhaWwpIHtcbiAgICAgICAgICAgIF8ucHVzaEVycm9yKHJlcG9ydClcblxuICAgICAgICAgICAgLy8gRG9uJ3QgcHJpbnQgdGhlIGRlc2NyaXB0aW9uIGxpbmUgb24gY3VtdWxhdGl2ZSBob29rc1xuICAgICAgICAgICAgaWYgKHJlcG9ydC5pc0hvb2sgJiYgKHJlcG9ydC5pc0JlZm9yZUFsbCB8fCByZXBvcnQuaXNBZnRlckFsbCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBwcmludFJlcG9ydChfLCByZXBvcnQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYyhcImZhaWxcIixcbiAgICAgICAgICAgICAgICAgICAgXy5lcnJvcnMubGVuZ3RoICsgXCIpIFwiICsgZ2V0TmFtZShfLnN0YXRlLmxldmVsLCByZXBvcnQpICtcbiAgICAgICAgICAgICAgICAgICAgUi5mb3JtYXRSZXN0KHJlcG9ydCkpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9IGVsc2UgaWYgKHJlcG9ydC5pc1NraXApIHtcbiAgICAgICAgICAgIHJldHVybiBwcmludFJlcG9ydChfLCByZXBvcnQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYyhcInNraXBcIiwgXCItIFwiICsgZ2V0TmFtZShfLnN0YXRlLmxldmVsLCByZXBvcnQpKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChyZXBvcnQuaXNFbmQpIHJldHVybiBfLnByaW50UmVzdWx0cygpXG4gICAgICAgIGlmIChyZXBvcnQuaXNFcnJvcikgcmV0dXJuIF8ucHJpbnRFcnJvcihyZXBvcnQpXG4gICAgICAgIHJldHVybiB1bmRlZmluZWRcbiAgICB9LFxufSlcbiIsIlwidXNlIHN0cmljdFwiXG5cbi8vIFRoaXMgaXMgYSBiYXNpYyBUQVAtZ2VuZXJhdGluZyByZXBvcnRlci5cblxudmFyIHBlYWNoID0gcmVxdWlyZShcIi4uL2xpYi91dGlsXCIpLnBlYWNoXG52YXIgUiA9IHJlcXVpcmUoXCIuLi9saWIvcmVwb3J0ZXJcIilcbnZhciBpbnNwZWN0ID0gcmVxdWlyZShcImNsZWFuLWFzc2VydC11dGlsXCIpLmluc3BlY3RcblxuZnVuY3Rpb24gc2hvdWxkQnJlYWsobWluTGVuZ3RoLCBzdHIpIHtcbiAgICByZXR1cm4gc3RyLmxlbmd0aCA+IFIud2luZG93V2lkdGgoKSAtIG1pbkxlbmd0aCB8fCAvXFxyP1xcbnxbOj8tXS8udGVzdChzdHIpXG59XG5cbmZ1bmN0aW9uIHRlbXBsYXRlKF8sIHJlcG9ydCwgdG1wbCwgc2tpcCkge1xuICAgIGlmICghc2tpcCkgXy5zdGF0ZS5jb3VudGVyKytcbiAgICB2YXIgcGF0aCA9IFIuam9pblBhdGgocmVwb3J0KS5yZXBsYWNlKC9cXCQvZywgXCIkJCQkXCIpXG5cbiAgICByZXR1cm4gXy5wcmludChcbiAgICAgICAgdG1wbC5yZXBsYWNlKC8lYy9nLCBfLnN0YXRlLmNvdW50ZXIpXG4gICAgICAgICAgICAucmVwbGFjZSgvJXAvZywgcGF0aCArIFIuZm9ybWF0UmVzdChyZXBvcnQpKSlcbn1cblxuZnVuY3Rpb24gcHJpbnRMaW5lcyhfLCB2YWx1ZSwgc2tpcEZpcnN0KSB7XG4gICAgdmFyIGxpbmVzID0gdmFsdWUuc3BsaXQoL1xccj9cXG4vZylcblxuICAgIGlmIChza2lwRmlyc3QpIGxpbmVzLnNoaWZ0KClcbiAgICByZXR1cm4gcGVhY2gobGluZXMsIGZ1bmN0aW9uIChsaW5lKSB7IHJldHVybiBfLnByaW50KFwiICAgIFwiICsgbGluZSkgfSlcbn1cblxuZnVuY3Rpb24gcHJpbnRSYXcoXywga2V5LCBzdHIpIHtcbiAgICBpZiAoc2hvdWxkQnJlYWsoa2V5Lmxlbmd0aCwgc3RyKSkge1xuICAgICAgICByZXR1cm4gXy5wcmludChcIiAgXCIgKyBrZXkgKyBcIjogfC1cIilcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gcHJpbnRMaW5lcyhfLCBzdHIsIGZhbHNlKSB9KVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBfLnByaW50KFwiICBcIiArIGtleSArIFwiOiBcIiArIHN0cilcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHByaW50VmFsdWUoXywga2V5LCB2YWx1ZSkge1xuICAgIHJldHVybiBwcmludFJhdyhfLCBrZXksIGluc3BlY3QodmFsdWUpKVxufVxuXG5mdW5jdGlvbiBwcmludExpbmUocCwgXywgbGluZSkge1xuICAgIHJldHVybiBwLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gXy5wcmludChsaW5lKSB9KVxufVxuXG5mdW5jdGlvbiBwcmludEVycm9yKF8sIHJlcG9ydCkge1xuICAgIHZhciBlcnIgPSByZXBvcnQuZXJyb3JcblxuICAgIGlmICghKGVyciBpbnN0YW5jZW9mIEVycm9yKSkge1xuICAgICAgICByZXR1cm4gcHJpbnRWYWx1ZShfLCBcInZhbHVlXCIsIGVycilcbiAgICB9XG5cbiAgICAvLyBMZXQncyAqbm90KiBkZXBlbmQgb24gdGhlIGNvbnN0cnVjdG9yIGJlaW5nIFRoYWxsaXVtJ3MuLi5cbiAgICBpZiAoZXJyLm5hbWUgIT09IFwiQXNzZXJ0aW9uRXJyb3JcIikge1xuICAgICAgICByZXR1cm4gXy5wcmludChcIiAgc3RhY2s6IHwtXCIpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHByaW50TGluZXMoXywgUi5nZXRTdGFjayhlcnIpLCBmYWxzZSlcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICByZXR1cm4gcHJpbnRWYWx1ZShfLCBcImV4cGVjdGVkXCIsIGVyci5leHBlY3RlZClcbiAgICAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiBwcmludFZhbHVlKF8sIFwiYWN0dWFsXCIsIGVyci5hY3R1YWwpIH0pXG4gICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gcHJpbnRSYXcoXywgXCJtZXNzYWdlXCIsIGVyci5tZXNzYWdlKSB9KVxuICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIF8ucHJpbnQoXCIgIHN0YWNrOiB8LVwiKSB9KVxuICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG1lc3NhZ2UgPSBlcnIubWVzc2FnZVxuXG4gICAgICAgIGVyci5tZXNzYWdlID0gXCJcIlxuICAgICAgICByZXR1cm4gcHJpbnRMaW5lcyhfLCBSLmdldFN0YWNrKGVyciksIHRydWUpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgZXJyLm1lc3NhZ2UgPSBtZXNzYWdlIH0pXG4gICAgfSlcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBSLm9uKFwidGFwXCIsIHtcbiAgICBhY2NlcHRzOiBbXCJ3cml0ZVwiLCBcInJlc2V0XCJdLFxuICAgIGNyZWF0ZTogUi5jb25zb2xlUmVwb3J0ZXIsXG4gICAgaW5pdDogZnVuY3Rpb24gKHN0YXRlKSB7IHN0YXRlLmNvdW50ZXIgPSAwIH0sXG5cbiAgICByZXBvcnQ6IGZ1bmN0aW9uIChfLCByZXBvcnQpIHtcbiAgICAgICAgaWYgKHJlcG9ydC5pc1N0YXJ0KSB7XG4gICAgICAgICAgICByZXR1cm4gXy5wcmludChcIlRBUCB2ZXJzaW9uIDEzXCIpXG4gICAgICAgIH0gZWxzZSBpZiAocmVwb3J0LmlzRW50ZXIpIHtcbiAgICAgICAgICAgIC8vIFByaW50IGEgbGVhZGluZyBjb21tZW50LCB0byBtYWtlIHNvbWUgVEFQIGZvcm1hdHRlcnMgcHJldHRpZXIuXG4gICAgICAgICAgICByZXR1cm4gdGVtcGxhdGUoXywgcmVwb3J0LCBcIiMgJXBcIiwgdHJ1ZSlcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRlbXBsYXRlKF8sIHJlcG9ydCwgXCJvayAlY1wiKSB9KVxuICAgICAgICB9IGVsc2UgaWYgKHJlcG9ydC5pc1Bhc3MpIHtcbiAgICAgICAgICAgIHJldHVybiB0ZW1wbGF0ZShfLCByZXBvcnQsIFwib2sgJWMgJXBcIilcbiAgICAgICAgfSBlbHNlIGlmIChyZXBvcnQuaXNGYWlsIHx8IHJlcG9ydC5pc0hvb2spIHtcbiAgICAgICAgICAgIHJldHVybiB0ZW1wbGF0ZShfLCByZXBvcnQsIFwibm90IG9rICVjICVwXCIpXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiBfLnByaW50KFwiICAtLS1cIikgfSlcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIHByaW50RXJyb3IoXywgcmVwb3J0KSB9KVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gXy5wcmludChcIiAgLi4uXCIpIH0pXG4gICAgICAgIH0gZWxzZSBpZiAocmVwb3J0LmlzU2tpcCkge1xuICAgICAgICAgICAgcmV0dXJuIHRlbXBsYXRlKF8sIHJlcG9ydCwgXCJvayAlYyAjIHNraXAgJXBcIilcbiAgICAgICAgfSBlbHNlIGlmIChyZXBvcnQuaXNFbmQpIHtcbiAgICAgICAgICAgIHZhciBwID0gXy5wcmludChcIjEuLlwiICsgXy5zdGF0ZS5jb3VudGVyKVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gXy5wcmludChcIiMgdGVzdHMgXCIgKyBfLnRlc3RzKSB9KVxuXG4gICAgICAgICAgICBpZiAoXy5wYXNzKSBwID0gcHJpbnRMaW5lKHAsIF8sIFwiIyBwYXNzIFwiICsgXy5wYXNzKVxuICAgICAgICAgICAgaWYgKF8uZmFpbCkgcCA9IHByaW50TGluZShwLCBfLCBcIiMgZmFpbCBcIiArIF8uZmFpbClcbiAgICAgICAgICAgIGlmIChfLnNraXApIHAgPSBwcmludExpbmUocCwgXywgXCIjIHNraXAgXCIgKyBfLnNraXApXG4gICAgICAgICAgICByZXR1cm4gcHJpbnRMaW5lKHAsIF8sIFwiIyBkdXJhdGlvbiBcIiArIFIuZm9ybWF0VGltZShfLmR1cmF0aW9uKSlcbiAgICAgICAgfSBlbHNlIGlmIChyZXBvcnQuaXNFcnJvcikge1xuICAgICAgICAgICAgcmV0dXJuIF8ucHJpbnQoXCJCYWlsIG91dCFcIilcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIF8ucHJpbnQoXCIgIC0tLVwiKSB9KVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gcHJpbnRFcnJvcihfLCByZXBvcnQpIH0pXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiBfLnByaW50KFwiICAuLi5cIikgfSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWRcbiAgICAgICAgfVxuICAgIH0sXG59KVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi4vbGliL2Jyb3dzZXItYnVuZGxlXCIpXG5cbnJlcXVpcmUoXCIuLi9taWdyYXRlL2luZGV4XCIpXG5cbi8vIE5vdGU6IGJvdGggb2YgdGhlc2UgYXJlIGRlcHJlY2F0ZWRcbm1vZHVsZS5leHBvcnRzLmFzc2VydGlvbnMgPSByZXF1aXJlKFwiLi4vYXNzZXJ0aW9uc1wiKVxubW9kdWxlLmV4cG9ydHMuY3JlYXRlID0gcmVxdWlyZShcIi4uL21pZ3JhdGUvY29tbW9uXCIpLmRlcHJlY2F0ZShcbiAgICBcImB0bC5jcmVhdGVgIGlzIGRlcHJlY2F0ZWQuIFBsZWFzZSB1c2UgYHRsLnJvb3RgIGluc3RlYWQuXCIsXG4gICAgbW9kdWxlLmV4cG9ydHMucm9vdClcbiJdfQ==
