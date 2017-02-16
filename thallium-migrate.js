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

    fail: function (path, value, duration, slow, isFailable) { // eslint-disable-line max-params, max-len
        return new Reports.Fail(
            p(path), value, d(duration), s(slow),
            !!isFailable)
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
     * Get the test's own max attempt count. Note that this is parasitically
     * inherited from its parent, not delegated.
     */
    get attempts() {
        return this._.attempts
    },

    /**
     * Get whether this test is failable. Note that this is parasitically
     * inherited from its parent, not delegated.
     */
    get isFailable() {
        return this._.isFailable
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

    if (type === Types.Fail) {
        inspect.isFailable = report.isFailable
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
function FailReport(path, error, duration, slow, isFailable) { // eslint-disable-line max-params, max-len
    Report.call(this, Types.Fail)
    this.path = path
    this.error = error
    this.duration = duration
    this.slow = slow
    this.isFailable = isFailable
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
    this.isFailable = parent.isFailable
    this.attempts = parent.attempts
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
    this.attempts = 1
    this.isFailable = false
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

// TODO: cache and remove these traversals for 0.4.
// Note that a timeout of 0 means to inherit the parent.
exports.timeout = function (test) {
    while (!test.timeout && test.root !== test) {
        test = test.parent
    }

    return test.timeout || 2000 // ms - default timeout
}

// Note that a slowness threshold of 0 means to inherit the parent.
exports.slow = function (test) {
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
            return reporter(
                new Reports.Enter(path(test), arg1, exports.slow(test)))

        case Types.Leave:
            return reporter(new Reports.Leave(path(test)))

        case Types.Pass:
            return reporter(
                new Reports.Pass(path(test), arg1, exports.slow(test)))

        case Types.Fail:
            return reporter(
                new Reports.Fail(
                    path(test), arg1, arg2,
                    exports.slow(test),
                    !!test.isFailable))

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

function AsyncState(start, resolve, count, test) {
    this.start = start
    this.resolve = resolve
    this.count = count
    this.test = test
    this.timer = undefined
}

var p = Promise.resolve()

function asyncFinish(state, attempt) {
    // Capture immediately. Worst case scenario, it gets thrown away.
    var end = now()

    if (state.timer) {
        clearTimeout.call(global, state.timer)
        state.timer = undefined
    }

    if (attempt.caught && state.count < state.test.attempts) {
        // Don't recurse synchronously, since it may be resolved synchronously
        state.resolve(p.then(function () {
            return invokeInit(state.test, state.count + 1)
        }))
    } else {
        state.resolve(new Result(end - state.start, attempt))
    }
}

// Avoid creating a closure if possible, in case it doesn't return a thenable.
function invokeInit(test, count) {
    var start = now()
    var tryBody = try1(test.callback, test.methods, test.methods)
    var syncEnd = now()

    // Note: synchronous failures are test failures, not fatal errors.
    if (tryBody.caught) {
        if (count < test.attempts) return invokeInit(test, count + 1)
        return Promise.resolve(new Result(syncEnd - start, tryBody))
    }

    var tryThen = try1(getThen, undefined, tryBody.value)

    if (tryThen.caught) {
        if (count < test.attempts) return invokeInit(test, count + 1)
        return Promise.resolve(new Result(syncEnd - start, tryThen))
    }

    if (typeof tryThen.value !== "function") {
        return Promise.resolve(new Result(syncEnd - start, tryThen))
    }

    return new Promise(function (resolve) {
        var state = new AsyncState(start, resolve, count, test)
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

        if (state == null) return
        if (result.caught) {
            asyncFinish(state, result)
            state = undefined
            return
        }

        // Set the timeout *after* initialization. The timeout will likely be
        // specified during initialization.
        var maxTimeout = exports.timeout(test)

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

    return invokeInit(test, 1)
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
            display: "block",
            margin: "0 0.25em",
            width: "99%", // Because Firefox sucks
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhc3NlcnQuanMiLCJhc3NlcnRpb25zLmpzIiwiZG9tLmpzIiwiaW5kZXguanMiLCJpbnRlcm5hbC5qcyIsImxpYi9hcGkvaG9va3MuanMiLCJsaWIvYXBpL3JlZmxlY3QuanMiLCJsaWIvYXBpL3RoYWxsaXVtLmpzIiwibGliL2Jyb3dzZXItYnVuZGxlLmpzIiwibGliL2NvcmUvb25seS5qcyIsImxpYi9jb3JlL3JlcG9ydHMuanMiLCJsaWIvY29yZS90ZXN0cy5qcyIsImxpYi9kb20vaW5kZXguanMiLCJsaWIvZG9tL2luaXRpYWxpemUuanMiLCJsaWIvZG9tL2luamVjdC1zdHlsZXMuanMiLCJsaWIvZG9tL2luamVjdC5qcyIsImxpYi9kb20vcnVuLXRlc3RzLmpzIiwibGliL2RvbS92aWV3LmpzIiwibGliL21ldGhvZHMuanMiLCJsaWIvcmVwbGFjZWQvY29uc29sZS1icm93c2VyLmpzIiwibGliL3JlcG9ydGVyL2NvbnNvbGUtcmVwb3J0ZXIuanMiLCJsaWIvcmVwb3J0ZXIvaW5kZXguanMiLCJsaWIvcmVwb3J0ZXIvb24uanMiLCJsaWIvcmVwb3J0ZXIvcmVwb3J0ZXIuanMiLCJsaWIvcmVwb3J0ZXIvdXRpbC5qcyIsImxpYi9zZXR0aW5ncy5qcyIsImxpYi91dGlsLmpzIiwibWlncmF0ZS9jb21tb24uanMiLCJtaWdyYXRlL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2FycmF5LW1hcC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9hcnJheS1yZWR1Y2UvaW5kZXguanMiLCJub2RlX21vZHVsZXMvY2xlYW4tYXNzZXJ0LXV0aWwvYnJvd3Nlci1pbnNwZWN0LmpzIiwibm9kZV9tb2R1bGVzL2NsZWFuLWFzc2VydC11dGlsL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2NsZWFuLWFzc2VydC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9jbGVhbi1hc3NlcnQvbGliL2VxdWFsLmpzIiwibm9kZV9tb2R1bGVzL2NsZWFuLWFzc2VydC9saWIvaGFzLWtleXMuanMiLCJub2RlX21vZHVsZXMvY2xlYW4tYXNzZXJ0L2xpYi9oYXMuanMiLCJub2RlX21vZHVsZXMvY2xlYW4tYXNzZXJ0L2xpYi9pbmNsdWRlcy5qcyIsIm5vZGVfbW9kdWxlcy9jbGVhbi1hc3NlcnQvbGliL3Rocm93cy5qcyIsIm5vZGVfbW9kdWxlcy9jbGVhbi1hc3NlcnQvbGliL3R5cGUuanMiLCJub2RlX21vZHVsZXMvY2xlYW4tbWF0Y2gvY2xlYW4tbWF0Y2guanMiLCJub2RlX21vZHVsZXMvZGlmZi9zcmMvY29udmVydC9kbXAuanMiLCJub2RlX21vZHVsZXMvZGlmZi9zcmMvY29udmVydC94bWwuanMiLCJub2RlX21vZHVsZXMvZGlmZi9zcmMvZGlmZi9hcnJheS5qcyIsIm5vZGVfbW9kdWxlcy9kaWZmL3NyYy9kaWZmL2Jhc2UuanMiLCJub2RlX21vZHVsZXMvZGlmZi9zcmMvZGlmZi9jaGFyYWN0ZXIuanMiLCJub2RlX21vZHVsZXMvZGlmZi9zcmMvZGlmZi9jc3MuanMiLCJub2RlX21vZHVsZXMvZGlmZi9zcmMvZGlmZi9qc29uLmpzIiwibm9kZV9tb2R1bGVzL2RpZmYvc3JjL2RpZmYvbGluZS5qcyIsIm5vZGVfbW9kdWxlcy9kaWZmL3NyYy9kaWZmL3NlbnRlbmNlLmpzIiwibm9kZV9tb2R1bGVzL2RpZmYvc3JjL2RpZmYvd29yZC5qcyIsIm5vZGVfbW9kdWxlcy9kaWZmL3NyYy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9kaWZmL3NyYy9wYXRjaC9hcHBseS5qcyIsIm5vZGVfbW9kdWxlcy9kaWZmL3NyYy9wYXRjaC9jcmVhdGUuanMiLCJub2RlX21vZHVsZXMvZGlmZi9zcmMvcGF0Y2gvcGFyc2UuanMiLCJub2RlX21vZHVsZXMvZGlmZi9zcmMvdXRpbC9kaXN0YW5jZS1pdGVyYXRvci5qcyIsIm5vZGVfbW9kdWxlcy9kaWZmL3NyYy91dGlsL3BhcmFtcy5qcyIsIm5vZGVfbW9kdWxlcy9mb3JlYWNoL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2luZGV4b2YvaW5kZXguanMiLCJub2RlX21vZHVsZXMvaXNhcnJheS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9qc29uMy9saWIvanNvbjMuanMiLCJub2RlX21vZHVsZXMvb2JqZWN0LWtleXMvZm9yZWFjaC5qcyIsIm5vZGVfbW9kdWxlcy9vYmplY3Qta2V5cy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9vYmplY3Qta2V5cy9pc0FyZ3VtZW50cy5qcyIsIm5vZGVfbW9kdWxlcy91dGlsLWluc3BlY3QvaW5kZXguanMiLCJyL2RvdC5qcyIsInIvaW5kZXguanMiLCJyL3NwZWMuanMiLCJyL3RhcC5qcyIsIm1pZ3JhdGUvYnVuZGxlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDLzJCQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeFhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcFBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUMvUUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDNWdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN2WEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUNySkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNyUUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNsREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDOUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDamhCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDdElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7O2dDQzVwQmdCLG1CLEdBQUEsbUI7O0FBQVQsU0FBUyxtQkFBVCxDQUE2QixPQUE3QixFQUFzQztBQUMzQyxNQUFJLE1BQU0sRUFBVjtBQUFBLE1BQ0ksUyx5QkFBQSxNLHdCQURKO0FBQUEsTUFFSSxZLHlCQUFBLE0sd0JBRko7QUFHQSxPQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLElBQUksUUFBUSxNQUE1QixFQUFvQyxHQUFwQyxFQUF5QztBQUN2QyxhQUFTLFFBQVEsQ0FBUixDQUFUO0FBQ0EsUUFBSSxPQUFPLEtBQVgsRUFBa0I7QUFDaEIsa0JBQVksQ0FBWjtBQUNELEtBRkQsTUFFTyxJQUFJLE9BQU8sT0FBWCxFQUFvQjtBQUN6QixrQkFBWSxDQUFDLENBQWI7QUFDRCxLQUZNLE1BRUE7QUFDTCxrQkFBWSxDQUFaO0FBQ0Q7O0FBRUQsUUFBSSxJQUFKLENBQVMsQ0FBQyxTQUFELEVBQVksT0FBTyxLQUFuQixDQUFUO0FBQ0Q7QUFDRCxTQUFPLEdBQVA7QUFDRDs7Ozs7OztnQ0NsQmUsbUIsR0FBQSxtQjtBQUFULFNBQVMsbUJBQVQsQ0FBNkIsT0FBN0IsRUFBc0M7QUFDM0MsTUFBSSxNQUFNLEVBQVY7QUFDQSxPQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLElBQUksUUFBUSxNQUE1QixFQUFvQyxHQUFwQyxFQUF5QztBQUN2QyxRQUFJLFNBQVMsUUFBUSxDQUFSLENBQWI7QUFDQSxRQUFJLE9BQU8sS0FBWCxFQUFrQjtBQUNoQixVQUFJLElBQUosQ0FBUyxPQUFUO0FBQ0QsS0FGRCxNQUVPLElBQUksT0FBTyxPQUFYLEVBQW9CO0FBQ3pCLFVBQUksSUFBSixDQUFTLE9BQVQ7QUFDRDs7QUFFRCxRQUFJLElBQUosQ0FBUyxXQUFXLE9BQU8sS0FBbEIsQ0FBVDs7QUFFQSxRQUFJLE9BQU8sS0FBWCxFQUFrQjtBQUNoQixVQUFJLElBQUosQ0FBUyxRQUFUO0FBQ0QsS0FGRCxNQUVPLElBQUksT0FBTyxPQUFYLEVBQW9CO0FBQ3pCLFVBQUksSUFBSixDQUFTLFFBQVQ7QUFDRDtBQUNGO0FBQ0QsU0FBTyxJQUFJLElBQUosQ0FBUyxFQUFULENBQVA7QUFDRDs7QUFFRCxTQUFTLFVBQVQsQ0FBb0IsQ0FBcEIsRUFBdUI7QUFDckIsTUFBSSxJQUFJLENBQVI7QUFDQSxNQUFJLEVBQUUsT0FBRixDQUFVLElBQVYsRUFBZ0IsT0FBaEIsQ0FBSjtBQUNBLE1BQUksRUFBRSxPQUFGLENBQVUsSUFBVixFQUFnQixNQUFoQixDQUFKO0FBQ0EsTUFBSSxFQUFFLE9BQUYsQ0FBVSxJQUFWLEVBQWdCLE1BQWhCLENBQUo7QUFDQSxNQUFJLEVBQUUsT0FBRixDQUFVLElBQVYsRUFBZ0IsUUFBaEIsQ0FBSjs7QUFFQSxTQUFPLENBQVA7QUFDRDs7Ozs7Ozs7Z0NDdEJlLFUsR0FBQSxVOztBQVBoQixJLHlCQUFBLHlCLHdCQUFBOzs7Ozs7O3VCQUVPLElBQU0sWSx5QkFBQSxRLHdCQUFBLFlBQVksSSx5QkFBQSxtQix3QkFBbEI7QUFDUCxVQUFVLFFBQVYsR0FBcUIsVUFBVSxJQUFWLEdBQWlCLFVBQVMsS0FBVCxFQUFnQjtBQUNwRCxTQUFPLE1BQU0sS0FBTixFQUFQO0FBQ0QsQ0FGRDs7QUFJTyxTQUFTLFVBQVQsQ0FBb0IsTUFBcEIsRUFBNEIsTUFBNUIsRUFBb0MsUUFBcEMsRUFBOEM7QUFBRSxTQUFPLFVBQVUsSUFBVixDQUFlLE1BQWYsRUFBdUIsTUFBdkIsRUFBK0IsUUFBL0IsQ0FBUDtBQUFrRDs7Ozs7Ozs0Q0NQakYsSTtBQUFULFNBQVMsSUFBVCxHQUFnQixDQUFFOztBQUVqQyxLQUFLLFNBQUwsR0FBaUIsRTt5QkFDZixJQURlLGdCQUNWLFNBRFUsRUFDQyxTQURELEVBQzBCOzZCQUFBLEksdUJBQWQsT0FBYyx5REFBSixFQUFJOztBQUN2QyxRQUFJLFdBQVcsUUFBUSxRQUF2QjtBQUNBLFFBQUksT0FBTyxPQUFQLEtBQW1CLFVBQXZCLEVBQW1DO0FBQ2pDLGlCQUFXLE9BQVg7QUFDQSxnQkFBVSxFQUFWO0FBQ0Q7QUFDRCxTQUFLLE9BQUwsR0FBZSxPQUFmOztBQUVBLFFBQUksT0FBTyxJQUFYOztBQUVBLGFBQVMsSUFBVCxDQUFjLEtBQWQsRUFBcUI7QUFDbkIsVUFBSSxRQUFKLEVBQWM7QUFDWixtQkFBVyxZQUFXO0FBQUUsbUJBQVMsU0FBVCxFQUFvQixLQUFwQjtBQUE2QixTQUFyRCxFQUF1RCxDQUF2RDtBQUNBLGVBQU8sSUFBUDtBQUNELE9BSEQsTUFHTztBQUNMLGVBQU8sS0FBUDtBQUNEO0FBQ0Y7OztBQUdELGdCQUFZLEtBQUssU0FBTCxDQUFlLFNBQWYsQ0FBWjtBQUNBLGdCQUFZLEtBQUssU0FBTCxDQUFlLFNBQWYsQ0FBWjs7QUFFQSxnQkFBWSxLQUFLLFdBQUwsQ0FBaUIsS0FBSyxRQUFMLENBQWMsU0FBZCxDQUFqQixDQUFaO0FBQ0EsZ0JBQVksS0FBSyxXQUFMLENBQWlCLEtBQUssUUFBTCxDQUFjLFNBQWQsQ0FBakIsQ0FBWjs7QUFFQSxRQUFJLFNBQVMsVUFBVSxNQUF2QjtBQUFBLFFBQStCLFNBQVMsVUFBVSxNQUFsRDtBQUNBLFFBQUksYUFBYSxDQUFqQjtBQUNBLFFBQUksZ0JBQWdCLFNBQVMsTUFBN0I7QUFDQSxRQUFJLFdBQVcsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFYLEVBQWMsWUFBWSxFQUExQixFQUFELENBQWY7OztBQUdBLFFBQUksU0FBUyxLQUFLLGFBQUwsQ0FBbUIsU0FBUyxDQUFULENBQW5CLEVBQWdDLFNBQWhDLEVBQTJDLFNBQTNDLEVBQXNELENBQXRELENBQWI7QUFDQSxRQUFJLFNBQVMsQ0FBVCxFQUFZLE1BQVosR0FBcUIsQ0FBckIsSUFBMEIsTUFBMUIsSUFBb0MsU0FBUyxDQUFULElBQWMsTUFBdEQsRUFBOEQ7O0FBRTVELGFBQU8sS0FBSyxDQUFDLEVBQUMsT0FBTyxLQUFLLElBQUwsQ0FBVSxTQUFWLENBQVIsRUFBOEIsT0FBTyxVQUFVLE1BQS9DLEVBQUQsQ0FBTCxDQUFQO0FBQ0Q7OztBQUdELGFBQVMsY0FBVCxHQUEwQjtBQUN4QixXQUFLLElBQUksZUFBZSxDQUFDLENBQUQsR0FBSyxVQUE3QixFQUF5QyxnQkFBZ0IsVUFBekQsRUFBcUUsZ0JBQWdCLENBQXJGLEVBQXdGO0FBQ3RGLFlBQUksVyx5QkFBQSxNLHdCQUFKO0FBQ0EsWUFBSSxVQUFVLFNBQVMsZUFBZSxDQUF4QixDQUFkO0FBQUEsWUFDSSxhQUFhLFNBQVMsZUFBZSxDQUF4QixDQURqQjtBQUFBLFlBRUksVUFBUyxDQUFDLGFBQWEsV0FBVyxNQUF4QixHQUFpQyxDQUFsQyxJQUF1QyxZQUZwRDtBQUdBLFlBQUksT0FBSixFQUFhOztBQUVYLG1CQUFTLGVBQWUsQ0FBeEIsSUFBNkIsU0FBN0I7QUFDRDs7QUFFRCxZQUFJLFNBQVMsV0FBVyxRQUFRLE1BQVIsR0FBaUIsQ0FBakIsR0FBcUIsTUFBN0M7QUFBQSxZQUNJLFlBQVksY0FBYyxLQUFLLE9BQW5CLElBQTZCLFVBQVMsTUFEdEQ7QUFFQSxZQUFJLENBQUMsTUFBRCxJQUFXLENBQUMsU0FBaEIsRUFBMkI7O0FBRXpCLG1CQUFTLFlBQVQsSUFBeUIsU0FBekI7QUFDQTtBQUNEOzs7OztBQUtELFlBQUksQ0FBQyxNQUFELElBQVksYUFBYSxRQUFRLE1BQVIsR0FBaUIsV0FBVyxNQUF6RCxFQUFrRTtBQUNoRSxxQkFBVyxVQUFVLFVBQVYsQ0FBWDtBQUNBLGVBQUssYUFBTCxDQUFtQixTQUFTLFVBQTVCLEVBQXdDLFNBQXhDLEVBQW1ELElBQW5EO0FBQ0QsU0FIRCxNQUdPO0FBQ0wscUJBQVcsT0FBWCxDO0FBQ0EsbUJBQVMsTUFBVDtBQUNBLGVBQUssYUFBTCxDQUFtQixTQUFTLFVBQTVCLEVBQXdDLElBQXhDLEVBQThDLFNBQTlDO0FBQ0Q7O0FBRUQsa0JBQVMsS0FBSyxhQUFMLENBQW1CLFFBQW5CLEVBQTZCLFNBQTdCLEVBQXdDLFNBQXhDLEVBQW1ELFlBQW5ELENBQVQ7OztBQUdBLFlBQUksU0FBUyxNQUFULEdBQWtCLENBQWxCLElBQXVCLE1BQXZCLElBQWlDLFVBQVMsQ0FBVCxJQUFjLE1BQW5ELEVBQTJEO0FBQ3pELGlCQUFPLEtBQUssWUFBWSxJQUFaLEVBQWtCLFNBQVMsVUFBM0IsRUFBdUMsU0FBdkMsRUFBa0QsU0FBbEQsRUFBNkQsS0FBSyxlQUFsRSxDQUFMLENBQVA7QUFDRCxTQUZELE1BRU87O0FBRUwsbUJBQVMsWUFBVCxJQUF5QixRQUF6QjtBQUNEO0FBQ0Y7O0FBRUQ7QUFDRDs7Ozs7QUFLRCxRQUFJLFFBQUosRUFBYztBQUNYLGdCQUFTLElBQVQsR0FBZ0I7QUFDZixtQkFBVyxZQUFXOzs7QUFHcEIsY0FBSSxhQUFhLGFBQWpCLEVBQWdDO0FBQzlCLG1CQUFPLFVBQVA7QUFDRDs7QUFFRCxjQUFJLENBQUMsZ0JBQUwsRUFBdUI7QUFDckI7QUFDRDtBQUNGLFNBVkQsRUFVRyxDQVZIO0FBV0QsT0FaQSxHQUFEO0FBYUQsS0FkRCxNQWNPO0FBQ0wsYUFBTyxjQUFjLGFBQXJCLEVBQW9DO0FBQ2xDLFlBQUksTUFBTSxnQkFBVjtBQUNBLFlBQUksR0FBSixFQUFTO0FBQ1AsaUJBQU8sR0FBUDtBQUNEO0FBQ0Y7QUFDRjtBQUNGLEdBOUdjO21EQWdIZixhQWhIZSx5QkFnSEQsVUFoSEMsRUFnSFcsS0FoSFgsRUFnSGtCLE9BaEhsQixFQWdIMkI7QUFDeEMsUUFBSSxPQUFPLFdBQVcsV0FBVyxNQUFYLEdBQW9CLENBQS9CLENBQVg7QUFDQSxRQUFJLFFBQVEsS0FBSyxLQUFMLEtBQWUsS0FBdkIsSUFBZ0MsS0FBSyxPQUFMLEtBQWlCLE9BQXJELEVBQThEOzs7QUFHNUQsaUJBQVcsV0FBVyxNQUFYLEdBQW9CLENBQS9CLElBQW9DLEVBQUMsT0FBTyxLQUFLLEtBQUwsR0FBYSxDQUFyQixFQUF3QixPQUFPLEtBQS9CLEVBQXNDLFNBQVMsT0FBL0MsRUFBcEM7QUFDRCxLQUpELE1BSU87QUFDTCxpQkFBVyxJQUFYLENBQWdCLEVBQUMsT0FBTyxDQUFSLEVBQVcsT0FBTyxLQUFsQixFQUF5QixTQUFTLE9BQWxDLEVBQWhCO0FBQ0Q7QUFDRixHQXpIYzttREEwSGYsYUExSGUseUJBMEhELFFBMUhDLEVBMEhTLFNBMUhULEVBMEhvQixTQTFIcEIsRUEwSCtCLFlBMUgvQixFQTBINkM7QUFDMUQsUUFBSSxTQUFTLFVBQVUsTUFBdkI7QUFBQSxRQUNJLFNBQVMsVUFBVSxNQUR2QjtBQUFBLFFBRUksU0FBUyxTQUFTLE1BRnRCO0FBQUEsUUFHSSxTQUFTLFNBQVMsWUFIdEI7QUFBQSxRQUtJLGNBQWMsQ0FMbEI7QUFNQSxXQUFPLFNBQVMsQ0FBVCxHQUFhLE1BQWIsSUFBdUIsU0FBUyxDQUFULEdBQWEsTUFBcEMsSUFBOEMsS0FBSyxNQUFMLENBQVksVUFBVSxTQUFTLENBQW5CLENBQVosRUFBbUMsVUFBVSxTQUFTLENBQW5CLENBQW5DLENBQXJELEVBQWdIO0FBQzlHO0FBQ0E7QUFDQTtBQUNEOztBQUVELFFBQUksV0FBSixFQUFpQjtBQUNmLGVBQVMsVUFBVCxDQUFvQixJQUFwQixDQUF5QixFQUFDLE9BQU8sV0FBUixFQUF6QjtBQUNEOztBQUVELGFBQVMsTUFBVCxHQUFrQixNQUFsQjtBQUNBLFdBQU8sTUFBUDtBQUNELEdBN0ljO21EQStJZixNQS9JZSxrQkErSVIsSUEvSVEsRUErSUYsS0EvSUUsRUErSUs7QUFDbEIsV0FBTyxTQUFTLEtBQWhCO0FBQ0QsR0FqSmM7bURBa0pmLFdBbEplLHVCQWtKSCxLQWxKRyxFQWtKSTtBQUNqQixRQUFJLE1BQU0sRUFBVjtBQUNBLFNBQUssSUFBSSxJQUFJLENBQWIsRUFBZ0IsSUFBSSxNQUFNLE1BQTFCLEVBQWtDLEdBQWxDLEVBQXVDO0FBQ3JDLFVBQUksTUFBTSxDQUFOLENBQUosRUFBYztBQUNaLFlBQUksSUFBSixDQUFTLE1BQU0sQ0FBTixDQUFUO0FBQ0Q7QUFDRjtBQUNELFdBQU8sR0FBUDtBQUNELEdBMUpjO21EQTJKZixTQTNKZSxxQkEySkwsS0EzSkssRUEySkU7QUFDZixXQUFPLEtBQVA7QUFDRCxHQTdKYzttREE4SmYsUUE5SmUsb0JBOEpOLEtBOUpNLEVBOEpDO0FBQ2QsV0FBTyxNQUFNLEtBQU4sQ0FBWSxFQUFaLENBQVA7QUFDRCxHQWhLYzttREFpS2YsSUFqS2UsZ0JBaUtWLEtBaktVLEVBaUtIO0FBQ1YsV0FBTyxNQUFNLElBQU4sQ0FBVyxFQUFYLENBQVA7QUFDRDtBQW5LYyxDQUFqQjs7QUFzS0EsU0FBUyxXQUFULENBQXFCLElBQXJCLEVBQTJCLFVBQTNCLEVBQXVDLFNBQXZDLEVBQWtELFNBQWxELEVBQTZELGVBQTdELEVBQThFO0FBQzVFLE1BQUksZUFBZSxDQUFuQjtBQUFBLE1BQ0ksZUFBZSxXQUFXLE1BRDlCO0FBQUEsTUFFSSxTQUFTLENBRmI7QUFBQSxNQUdJLFNBQVMsQ0FIYjs7QUFLQSxTQUFPLGVBQWUsWUFBdEIsRUFBb0MsY0FBcEMsRUFBb0Q7QUFDbEQsUUFBSSxZQUFZLFdBQVcsWUFBWCxDQUFoQjtBQUNBLFFBQUksQ0FBQyxVQUFVLE9BQWYsRUFBd0I7QUFDdEIsVUFBSSxDQUFDLFVBQVUsS0FBWCxJQUFvQixlQUF4QixFQUF5QztBQUN2QyxZQUFJLFFBQVEsVUFBVSxLQUFWLENBQWdCLE1BQWhCLEVBQXdCLFNBQVMsVUFBVSxLQUEzQyxDQUFaO0FBQ0EsZ0JBQVEsTUFBTSxHQUFOLENBQVUsVUFBUyxLQUFULEVBQWdCLENBQWhCLEVBQW1CO0FBQ25DLGNBQUksV0FBVyxVQUFVLFNBQVMsQ0FBbkIsQ0FBZjtBQUNBLGlCQUFPLFNBQVMsTUFBVCxHQUFrQixNQUFNLE1BQXhCLEdBQWlDLFFBQWpDLEdBQTRDLEtBQW5EO0FBQ0QsU0FITyxDQUFSOztBQUtBLGtCQUFVLEtBQVYsR0FBa0IsS0FBSyxJQUFMLENBQVUsS0FBVixDQUFsQjtBQUNELE9BUkQsTUFRTztBQUNMLGtCQUFVLEtBQVYsR0FBa0IsS0FBSyxJQUFMLENBQVUsVUFBVSxLQUFWLENBQWdCLE1BQWhCLEVBQXdCLFNBQVMsVUFBVSxLQUEzQyxDQUFWLENBQWxCO0FBQ0Q7QUFDRCxnQkFBVSxVQUFVLEtBQXBCOzs7QUFHQSxVQUFJLENBQUMsVUFBVSxLQUFmLEVBQXNCO0FBQ3BCLGtCQUFVLFVBQVUsS0FBcEI7QUFDRDtBQUNGLEtBbEJELE1Ba0JPO0FBQ0wsZ0JBQVUsS0FBVixHQUFrQixLQUFLLElBQUwsQ0FBVSxVQUFVLEtBQVYsQ0FBZ0IsTUFBaEIsRUFBd0IsU0FBUyxVQUFVLEtBQTNDLENBQVYsQ0FBbEI7QUFDQSxnQkFBVSxVQUFVLEtBQXBCOzs7OztBQUtBLFVBQUksZ0JBQWdCLFdBQVcsZUFBZSxDQUExQixFQUE2QixLQUFqRCxFQUF3RDtBQUN0RCxZQUFJLE1BQU0sV0FBVyxlQUFlLENBQTFCLENBQVY7QUFDQSxtQkFBVyxlQUFlLENBQTFCLElBQStCLFdBQVcsWUFBWCxDQUEvQjtBQUNBLG1CQUFXLFlBQVgsSUFBMkIsR0FBM0I7QUFDRDtBQUNGO0FBQ0Y7Ozs7QUFJRCxNQUFJLGdCQUFnQixXQUFXLGVBQWUsQ0FBMUIsQ0FBcEI7QUFDQSxNQUFJLGVBQWUsQ0FBZixLQUNJLGNBQWMsS0FBZCxJQUF1QixjQUFjLE9BRHpDLEtBRUcsS0FBSyxNQUFMLENBQVksRUFBWixFQUFnQixjQUFjLEtBQTlCLENBRlAsRUFFNkM7QUFDM0MsZUFBVyxlQUFlLENBQTFCLEVBQTZCLEtBQTdCLElBQXNDLGNBQWMsS0FBcEQ7QUFDQSxlQUFXLEdBQVg7QUFDRDs7QUFFRCxTQUFPLFVBQVA7QUFDRDs7QUFFRCxTQUFTLFNBQVQsQ0FBbUIsSUFBbkIsRUFBeUI7QUFDdkIsU0FBTyxFQUFFLFFBQVEsS0FBSyxNQUFmLEVBQXVCLFlBQVksS0FBSyxVQUFMLENBQWdCLEtBQWhCLENBQXNCLENBQXRCLENBQW5DLEVBQVA7QUFDRDs7Ozs7Ozs7Z0NDN05lLFMsR0FBQSxTOztBQUhoQixJLHlCQUFBLHlCLHdCQUFBOzs7Ozs7O3VCQUVPLElBQU0sZ0IseUJBQUEsUSx3QkFBQSxnQkFBZ0IsSSx5QkFBQSxtQix3QkFBdEI7QUFDQSxTQUFTLFNBQVQsQ0FBbUIsTUFBbkIsRUFBMkIsTUFBM0IsRUFBbUMsUUFBbkMsRUFBNkM7QUFBRSxTQUFPLGNBQWMsSUFBZCxDQUFtQixNQUFuQixFQUEyQixNQUEzQixFQUFtQyxRQUFuQyxDQUFQO0FBQXNEOzs7Ozs7OztnQ0NJNUYsTyxHQUFBLE87O0FBUGhCLEkseUJBQUEseUIsd0JBQUE7Ozs7Ozs7dUJBRU8sSUFBTSxVLHlCQUFBLFEsd0JBQUEsVUFBVSxJLHlCQUFBLG1CLHdCQUFoQjtBQUNQLFFBQVEsUUFBUixHQUFtQixVQUFTLEtBQVQsRUFBZ0I7QUFDakMsU0FBTyxNQUFNLEtBQU4sQ0FBWSxlQUFaLENBQVA7QUFDRCxDQUZEOztBQUlPLFNBQVMsT0FBVCxDQUFpQixNQUFqQixFQUF5QixNQUF6QixFQUFpQyxRQUFqQyxFQUEyQztBQUFFLFNBQU8sUUFBUSxJQUFSLENBQWEsTUFBYixFQUFxQixNQUFyQixFQUE2QixRQUE3QixDQUFQO0FBQWdEOzs7Ozs7Ozs7OztnQ0NvQnBGLFEsR0FBQSxRO3lEQUlBLFksR0FBQSxZOztBQS9CaEIsSSx5QkFBQSx5Qix3QkFBQTs7Ozs7O0FBQ0EsSSx5QkFBQSx5Qix3QkFBQTs7Ozs7OztBQUVBLElBQU0sMEJBQTBCLE9BQU8sU0FBUCxDQUFpQixRQUFqRDs7QUFHTyxJQUFNLFcseUJBQUEsUSx3QkFBQSxXQUFXLEkseUJBQUEsbUIsd0JBQWpCOzs7QUFHUCxTQUFTLGVBQVQsR0FBMkIsSUFBM0I7O0FBRUEsU0FBUyxRQUFULEcseUJBQW9CLGUsd0JBQVMsUUFBN0I7QUFDQSxTQUFTLFNBQVQsR0FBcUIsVUFBUyxLQUFULEVBQWdCOzJCQUFBLEksdUJBQzVCLG9CQUQ0QixHQUNKLEtBQUssT0FERCxDQUM1QixvQkFENEI7OztBQUduQyxTQUFPLE9BQU8sS0FBUCxLQUFpQixRQUFqQixHQUE0QixLQUE1QixHQUFvQyxLQUFLLFNBQUwsQ0FBZSxhQUFhLEtBQWIsQ0FBZixFQUFvQyxVQUFTLENBQVQsRUFBWSxDQUFaLEVBQWU7QUFDNUYsUUFBSSxPQUFPLENBQVAsS0FBYSxXQUFqQixFQUE4QjtBQUM1QixhQUFPLG9CQUFQO0FBQ0Q7O0FBRUQsV0FBTyxDQUFQO0FBQ0QsR0FOMEMsRUFNeEMsSUFOd0MsQ0FBM0M7QUFPRCxDQVZEO0FBV0EsU0FBUyxNQUFULEdBQWtCLFVBQVMsSUFBVCxFQUFlLEtBQWYsRUFBc0I7QUFDdEMsUywwQkFBTyxrQix3QkFBSyxTQUFMLENBQWUsTUFBZixDQUFzQixLQUFLLE9BQUwsQ0FBYSxZQUFiLEVBQTJCLElBQTNCLENBQXRCLEVBQXdELE1BQU0sT0FBTixDQUFjLFlBQWQsRUFBNEIsSUFBNUIsQ0FBeEQ7QUFBUDtBQUNELENBRkQ7O0FBSU8sU0FBUyxRQUFULENBQWtCLE1BQWxCLEVBQTBCLE1BQTFCLEVBQWtDLE9BQWxDLEVBQTJDO0FBQUUsU0FBTyxTQUFTLElBQVQsQ0FBYyxNQUFkLEVBQXNCLE1BQXRCLEVBQThCLE9BQTlCLENBQVA7QUFBZ0Q7Ozs7QUFJN0YsU0FBUyxZQUFULENBQXNCLEdBQXRCLEVBQTJCLEtBQTNCLEVBQWtDLGdCQUFsQyxFQUFvRDtBQUN6RCxVQUFRLFNBQVMsRUFBakI7QUFDQSxxQkFBbUIsb0JBQW9CLEVBQXZDOztBQUVBLE1BQUksSSx5QkFBQSxNLHdCQUFKOztBQUVBLE9BQUssSUFBSSxDQUFULEVBQVksSUFBSSxNQUFNLE1BQXRCLEVBQThCLEtBQUssQ0FBbkMsRUFBc0M7QUFDcEMsUUFBSSxNQUFNLENBQU4sTUFBYSxHQUFqQixFQUFzQjtBQUNwQixhQUFPLGlCQUFpQixDQUFqQixDQUFQO0FBQ0Q7QUFDRjs7QUFFRCxNQUFJLG1CLHlCQUFBLE0sd0JBQUo7O0FBRUEsTUFBSSxxQkFBcUIsd0JBQXdCLElBQXhCLENBQTZCLEdBQTdCLENBQXpCLEVBQTREO0FBQzFELFVBQU0sSUFBTixDQUFXLEdBQVg7QUFDQSx1QkFBbUIsSUFBSSxLQUFKLENBQVUsSUFBSSxNQUFkLENBQW5CO0FBQ0EscUJBQWlCLElBQWpCLENBQXNCLGdCQUF0QjtBQUNBLFNBQUssSUFBSSxDQUFULEVBQVksSUFBSSxJQUFJLE1BQXBCLEVBQTRCLEtBQUssQ0FBakMsRUFBb0M7QUFDbEMsdUJBQWlCLENBQWpCLElBQXNCLGFBQWEsSUFBSSxDQUFKLENBQWIsRUFBcUIsS0FBckIsRUFBNEIsZ0JBQTVCLENBQXRCO0FBQ0Q7QUFDRCxVQUFNLEdBQU47QUFDQSxxQkFBaUIsR0FBakI7QUFDQSxXQUFPLGdCQUFQO0FBQ0Q7O0FBRUQsTUFBSSxPQUFPLElBQUksTUFBZixFQUF1QjtBQUNyQixVQUFNLElBQUksTUFBSixFQUFOO0FBQ0Q7O0FBRUQsTSwwQkFBSSxRLHVCQUFPLEdBQVAseUNBQU8sR0FBUCxPQUFlLFFBQWYsSUFBMkIsUUFBUSxJQUF2QyxFQUE2QztBQUMzQyxVQUFNLElBQU4sQ0FBVyxHQUFYO0FBQ0EsdUJBQW1CLEVBQW5CO0FBQ0EscUJBQWlCLElBQWpCLENBQXNCLGdCQUF0QjtBQUNBLFFBQUksYUFBYSxFQUFqQjtBQUFBLFFBQ0ksTSx5QkFBQSxNLHdCQURKO0FBRUEsU0FBSyxHQUFMLElBQVksR0FBWixFQUFpQjs7QUFFZixVQUFJLElBQUksY0FBSixDQUFtQixHQUFuQixDQUFKLEVBQTZCO0FBQzNCLG1CQUFXLElBQVgsQ0FBZ0IsR0FBaEI7QUFDRDtBQUNGO0FBQ0QsZUFBVyxJQUFYO0FBQ0EsU0FBSyxJQUFJLENBQVQsRUFBWSxJQUFJLFdBQVcsTUFBM0IsRUFBbUMsS0FBSyxDQUF4QyxFQUEyQztBQUN6QyxZQUFNLFdBQVcsQ0FBWCxDQUFOO0FBQ0EsdUJBQWlCLEdBQWpCLElBQXdCLGFBQWEsSUFBSSxHQUFKLENBQWIsRUFBdUIsS0FBdkIsRUFBOEIsZ0JBQTlCLENBQXhCO0FBQ0Q7QUFDRCxVQUFNLEdBQU47QUFDQSxxQkFBaUIsR0FBakI7QUFDRCxHQW5CRCxNQW1CTztBQUNMLHVCQUFtQixHQUFuQjtBQUNEO0FBQ0QsU0FBTyxnQkFBUDtBQUNEOzs7Ozs7OztnQ0N0RGUsUyxHQUFBLFM7eURBQ0EsZ0IsR0FBQSxnQjs7QUEvQmhCLEkseUJBQUEseUIsd0JBQUE7Ozs7OztBQUNBLEkseUJBQUEsbUMsd0JBQUE7Ozs7O3VCQUVPLElBQU0sVyx5QkFBQSxRLHdCQUFBLFdBQVcsSSx5QkFBQSxtQix3QkFBakI7QUFDUCxTQUFTLFFBQVQsR0FBb0IsVUFBUyxLQUFULEVBQWdCO0FBQ2xDLE1BQUksV0FBVyxFQUFmO0FBQUEsTUFDSSxtQkFBbUIsTUFBTSxLQUFOLENBQVksV0FBWixDQUR2Qjs7O0FBSUEsTUFBSSxDQUFDLGlCQUFpQixpQkFBaUIsTUFBakIsR0FBMEIsQ0FBM0MsQ0FBTCxFQUFvRDtBQUNsRCxxQkFBaUIsR0FBakI7QUFDRDs7O0FBR0QsT0FBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLGlCQUFpQixNQUFyQyxFQUE2QyxHQUE3QyxFQUFrRDtBQUNoRCxRQUFJLE9BQU8saUJBQWlCLENBQWpCLENBQVg7O0FBRUEsUUFBSSxJQUFJLENBQUosSUFBUyxDQUFDLEtBQUssT0FBTCxDQUFhLGNBQTNCLEVBQTJDO0FBQ3pDLGVBQVMsU0FBUyxNQUFULEdBQWtCLENBQTNCLEtBQWlDLElBQWpDO0FBQ0QsS0FGRCxNQUVPO0FBQ0wsVUFBSSxLQUFLLE9BQUwsQ0FBYSxnQkFBakIsRUFBbUM7QUFDakMsZUFBTyxLQUFLLElBQUwsRUFBUDtBQUNEO0FBQ0QsZUFBUyxJQUFULENBQWMsSUFBZDtBQUNEO0FBQ0Y7O0FBRUQsU0FBTyxRQUFQO0FBQ0QsQ0F4QkQ7O0FBMEJPLFNBQVMsU0FBVCxDQUFtQixNQUFuQixFQUEyQixNQUEzQixFQUFtQyxRQUFuQyxFQUE2QztBQUFFLFNBQU8sU0FBUyxJQUFULENBQWMsTUFBZCxFQUFzQixNQUF0QixFQUE4QixRQUE5QixDQUFQO0FBQWlEO0FBQ2hHLFNBQVMsZ0JBQVQsQ0FBMEIsTUFBMUIsRUFBa0MsTUFBbEMsRUFBMEMsUUFBMUMsRUFBb0Q7QUFDekQsTUFBSSxVLHlCQUFVLDRCLHdCQUFBLENBQWdCLFFBQWhCLEVBQTBCLEVBQUMsa0JBQWtCLElBQW5CLEVBQTFCLENBQWQ7QUFDQSxTQUFPLFNBQVMsSUFBVCxDQUFjLE1BQWQsRUFBc0IsTUFBdEIsRUFBOEIsT0FBOUIsQ0FBUDtBQUNEOzs7Ozs7OztnQ0MxQmUsYSxHQUFBLGE7O0FBUmhCLEkseUJBQUEseUIsd0JBQUE7Ozs7Ozs7dUJBR08sSUFBTSxlLHlCQUFBLFEsd0JBQUEsZUFBZSxJLHlCQUFBLG1CLHdCQUFyQjtBQUNQLGFBQWEsUUFBYixHQUF3QixVQUFTLEtBQVQsRUFBZ0I7QUFDdEMsU0FBTyxNQUFNLEtBQU4sQ0FBWSx1QkFBWixDQUFQO0FBQ0QsQ0FGRDs7QUFJTyxTQUFTLGFBQVQsQ0FBdUIsTUFBdkIsRUFBK0IsTUFBL0IsRUFBdUMsUUFBdkMsRUFBaUQ7QUFBRSxTQUFPLGFBQWEsSUFBYixDQUFrQixNQUFsQixFQUEwQixNQUExQixFQUFrQyxRQUFsQyxDQUFQO0FBQXFEOzs7Ozs7OztnQ0N1Qy9GLFMsR0FBQSxTO3lEQUlBLGtCLEdBQUEsa0I7O0FBbkRoQixJLHlCQUFBLHlCLHdCQUFBOzs7Ozs7QUFDQSxJLHlCQUFBLG1DLHdCQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBb0JBLElBQU0sb0JBQW9CLCtEQUExQjs7QUFFQSxJQUFNLGVBQWUsSUFBckI7O0FBRU8sSUFBTSxXLHlCQUFBLFEsd0JBQUEsV0FBVyxJLHlCQUFBLG1CLHdCQUFqQjtBQUNQLFNBQVMsTUFBVCxHQUFrQixVQUFTLElBQVQsRUFBZSxLQUFmLEVBQXNCO0FBQ3RDLFNBQU8sU0FBUyxLQUFULElBQW1CLEtBQUssT0FBTCxDQUFhLGdCQUFiLElBQWlDLENBQUMsYUFBYSxJQUFiLENBQWtCLElBQWxCLENBQWxDLElBQTZELENBQUMsYUFBYSxJQUFiLENBQWtCLEtBQWxCLENBQXhGO0FBQ0QsQ0FGRDtBQUdBLFNBQVMsUUFBVCxHQUFvQixVQUFTLEtBQVQsRUFBZ0I7QUFDbEMsTUFBSSxTQUFTLE1BQU0sS0FBTixDQUFZLFVBQVosQ0FBYjs7O0FBR0EsT0FBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLE9BQU8sTUFBUCxHQUFnQixDQUFwQyxFQUF1QyxHQUF2QyxFQUE0Qzs7QUFFMUMsUUFBSSxDQUFDLE9BQU8sSUFBSSxDQUFYLENBQUQsSUFBa0IsT0FBTyxJQUFJLENBQVgsQ0FBbEIsSUFDSyxrQkFBa0IsSUFBbEIsQ0FBdUIsT0FBTyxDQUFQLENBQXZCLENBREwsSUFFSyxrQkFBa0IsSUFBbEIsQ0FBdUIsT0FBTyxJQUFJLENBQVgsQ0FBdkIsQ0FGVCxFQUVnRDtBQUM5QyxhQUFPLENBQVAsS0FBYSxPQUFPLElBQUksQ0FBWCxDQUFiO0FBQ0EsYUFBTyxNQUFQLENBQWMsSUFBSSxDQUFsQixFQUFxQixDQUFyQjtBQUNBO0FBQ0Q7QUFDRjs7QUFFRCxTQUFPLE1BQVA7QUFDRCxDQWhCRDs7QUFrQk8sU0FBUyxTQUFULENBQW1CLE1BQW5CLEVBQTJCLE1BQTNCLEVBQW1DLFFBQW5DLEVBQTZDO0FBQ2xELE1BQUksVSx5QkFBVSw0Qix3QkFBQSxDQUFnQixRQUFoQixFQUEwQixFQUFDLGtCQUFrQixJQUFuQixFQUExQixDQUFkO0FBQ0EsU0FBTyxTQUFTLElBQVQsQ0FBYyxNQUFkLEVBQXNCLE1BQXRCLEVBQThCLE9BQTlCLENBQVA7QUFDRDtBQUNNLFNBQVMsa0JBQVQsQ0FBNEIsTUFBNUIsRUFBb0MsTUFBcEMsRUFBNEMsUUFBNUMsRUFBc0Q7QUFDM0QsU0FBTyxTQUFTLElBQVQsQ0FBYyxNQUFkLEVBQXNCLE1BQXRCLEVBQThCLFFBQTlCLENBQVA7QUFDRDs7Ozs7Ozs7O0FDckNELEkseUJBQUEsOEIsd0JBQUE7Ozs7OztBQUNBLEkseUJBQUEsd0Msd0JBQUE7O0FBQ0EsSSx5QkFBQSw4Qix3QkFBQTs7QUFDQSxJLHlCQUFBLDhCLHdCQUFBOztBQUNBLEkseUJBQUEsc0Msd0JBQUE7O0FBRUEsSSx5QkFBQSw0Qix3QkFBQTs7QUFDQSxJLHlCQUFBLDhCLHdCQUFBOztBQUVBLEkseUJBQUEsZ0Msd0JBQUE7O0FBRUEsSSx5QkFBQSxpQyx3QkFBQTs7QUFDQSxJLHlCQUFBLGlDLHdCQUFBOztBQUNBLEkseUJBQUEsbUMsd0JBQUE7O0FBRUEsSSx5QkFBQSwrQix3QkFBQTs7QUFDQSxJLHlCQUFBLCtCLHdCQUFBOzs7OztnQ0FHRSxJO3lEQUVBLFM7eURBQ0EsUzt5REFDQSxrQjt5REFDQSxTO3lEQUNBLGdCO3lEQUNBLGE7eURBRUEsTzt5REFDQSxRO3lEQUVBLFU7eURBRUEsZTt5REFDQSxtQjt5REFDQSxXO3lEQUNBLFU7eURBQ0EsWTt5REFDQSxVO3lEQUNBLG1CO3lEQUNBLG1CO3lEQUNBLFk7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Z0NDdERjLFUsR0FBQSxVO3lEQStIQSxZLEdBQUEsWTs7QUFsSWhCLEkseUJBQUEsMkIsd0JBQUE7O0FBQ0EsSSx5QkFBQSx3RCx3QkFBQTs7Ozs7Ozt1QkFFTyxTQUFTLFVBQVQsQ0FBb0IsTUFBcEIsRUFBNEIsT0FBNUIsRUFBbUQ7MkJBQUEsSSx1QkFBZCxPQUFjLHlEQUFKLEVBQUk7O0FBQ3hELE1BQUksT0FBTyxPQUFQLEtBQW1CLFFBQXZCLEVBQWlDO0FBQy9CLGMseUJBQVUsc0Isd0JBQUEsQ0FBVyxPQUFYLENBQVY7QUFDRDs7QUFFRCxNQUFJLE1BQU0sT0FBTixDQUFjLE9BQWQsQ0FBSixFQUE0QjtBQUMxQixRQUFJLFFBQVEsTUFBUixHQUFpQixDQUFyQixFQUF3QjtBQUN0QixZQUFNLElBQUksS0FBSixDQUFVLDRDQUFWLENBQU47QUFDRDs7QUFFRCxjQUFVLFFBQVEsQ0FBUixDQUFWO0FBQ0Q7OztBQUdELE1BQUksUUFBUSxPQUFPLEtBQVAsQ0FBYSxxQkFBYixDQUFaO0FBQUEsTUFDSSxhQUFhLE9BQU8sS0FBUCxDQUFhLHNCQUFiLEtBQXdDLEVBRHpEO0FBQUEsTUFFSSxRQUFRLFFBQVEsS0FGcEI7QUFBQSxNQUlJLGNBQWMsUUFBUSxXQUFSLElBQXdCLFVBQUMsVUFBRCxFQUFhLElBQWIsRUFBbUIsU0FBbkIsRUFBOEIsWUFBOUIsRSx5QkFBQTtBQUFBLFcsd0JBQStDLFNBQVM7QUFBeEQ7QUFBQSxHQUoxQztBQUFBLE1BS0ksYUFBYSxDQUxqQjtBQUFBLE1BTUksYUFBYSxRQUFRLFVBQVIsSUFBc0IsQ0FOdkM7QUFBQSxNQU9JLFVBQVUsQ0FQZDtBQUFBLE1BUUksU0FBUyxDQVJiO0FBQUEsTUFVSSxjLHlCQUFBLE0sd0JBVko7QUFBQSxNQVdJLFcseUJBQUEsTSx3QkFYSjs7Ozs7QUFnQkEsV0FBUyxRQUFULENBQWtCLElBQWxCLEVBQXdCLEtBQXhCLEVBQStCO0FBQzdCLFNBQUssSUFBSSxJQUFJLENBQWIsRUFBZ0IsSUFBSSxLQUFLLEtBQUwsQ0FBVyxNQUEvQixFQUF1QyxHQUF2QyxFQUE0QztBQUMxQyxVQUFJLE9BQU8sS0FBSyxLQUFMLENBQVcsQ0FBWCxDQUFYO0FBQUEsVUFDSSxZQUFZLEtBQUssQ0FBTCxDQURoQjtBQUFBLFVBRUksVUFBVSxLQUFLLE1BQUwsQ0FBWSxDQUFaLENBRmQ7O0FBSUEsVUFBSSxjQUFjLEdBQWQsSUFBcUIsY0FBYyxHQUF2QyxFQUE0Qzs7QUFFMUMsWUFBSSxDQUFDLFlBQVksUUFBUSxDQUFwQixFQUF1QixNQUFNLEtBQU4sQ0FBdkIsRUFBcUMsU0FBckMsRUFBZ0QsT0FBaEQsQ0FBTCxFQUErRDtBQUM3RDs7QUFFQSxjQUFJLGFBQWEsVUFBakIsRUFBNkI7QUFDM0IsbUJBQU8sS0FBUDtBQUNEO0FBQ0Y7QUFDRDtBQUNEO0FBQ0Y7O0FBRUQsV0FBTyxJQUFQO0FBQ0Q7OztBQUdELE9BQUssSUFBSSxJQUFJLENBQWIsRUFBZ0IsSUFBSSxNQUFNLE1BQTFCLEVBQWtDLEdBQWxDLEVBQXVDO0FBQ3JDLFFBQUksT0FBTyxNQUFNLENBQU4sQ0FBWDtBQUFBLFFBQ0ksVUFBVSxNQUFNLE1BQU4sR0FBZSxLQUFLLFFBRGxDO0FBQUEsUUFFSSxjQUFjLENBRmxCO0FBQUEsUUFHSSxRQUFRLFNBQVMsS0FBSyxRQUFkLEdBQXlCLENBSHJDOztBQUtBLFFBQUksVyx5QkFBVyxrQyx3QkFBQSxDQUFpQixLQUFqQixFQUF3QixPQUF4QixFQUFpQyxPQUFqQyxDQUFmOztBQUVBLFdBQU8sZ0JBQWdCLFNBQXZCLEVBQWtDLGNBQWMsVUFBaEQsRUFBNEQ7QUFDMUQsVUFBSSxTQUFTLElBQVQsRUFBZSxRQUFRLFdBQXZCLENBQUosRUFBeUM7QUFDdkMsYUFBSyxNQUFMLEdBQWMsVUFBVSxXQUF4QjtBQUNBO0FBQ0Q7QUFDRjs7QUFFRCxRQUFJLGdCQUFnQixTQUFwQixFQUErQjtBQUM3QixhQUFPLEtBQVA7QUFDRDs7OztBQUlELGNBQVUsS0FBSyxNQUFMLEdBQWMsS0FBSyxRQUFuQixHQUE4QixLQUFLLFFBQTdDO0FBQ0Q7OztBQUdELE9BQUssSUFBSSxLQUFJLENBQWIsRUFBZ0IsS0FBSSxNQUFNLE1BQTFCLEVBQWtDLElBQWxDLEVBQXVDO0FBQ3JDLFFBQUksUUFBTyxNQUFNLEVBQU4sQ0FBWDtBQUFBLFFBQ0ksU0FBUSxNQUFLLE1BQUwsR0FBYyxNQUFLLFFBQW5CLEdBQThCLENBRDFDO0FBRUEsUUFBSSxNQUFLLFFBQUwsSUFBaUIsQ0FBckIsRUFBd0I7QUFBRTtBQUFVOztBQUVwQyxTQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLElBQUksTUFBSyxLQUFMLENBQVcsTUFBL0IsRUFBdUMsR0FBdkMsRUFBNEM7QUFDMUMsVUFBSSxPQUFPLE1BQUssS0FBTCxDQUFXLENBQVgsQ0FBWDtBQUFBLFVBQ0ksWUFBWSxLQUFLLENBQUwsQ0FEaEI7QUFBQSxVQUVJLFVBQVUsS0FBSyxNQUFMLENBQVksQ0FBWixDQUZkO0FBQUEsVUFHSSxZQUFZLE1BQUssY0FBTCxDQUFvQixDQUFwQixDQUhoQjs7QUFLQSxVQUFJLGNBQWMsR0FBbEIsRUFBdUI7QUFDckI7QUFDRCxPQUZELE1BRU8sSUFBSSxjQUFjLEdBQWxCLEVBQXVCO0FBQzVCLGNBQU0sTUFBTixDQUFhLE1BQWIsRUFBb0IsQ0FBcEI7QUFDQSxtQkFBVyxNQUFYLENBQWtCLE1BQWxCLEVBQXlCLENBQXpCOztBQUVELE9BSk0sTUFJQSxJQUFJLGNBQWMsR0FBbEIsRUFBdUI7QUFDNUIsZ0JBQU0sTUFBTixDQUFhLE1BQWIsRUFBb0IsQ0FBcEIsRUFBdUIsT0FBdkI7QUFDQSxxQkFBVyxNQUFYLENBQWtCLE1BQWxCLEVBQXlCLENBQXpCLEVBQTRCLFNBQTVCO0FBQ0E7QUFDRCxTQUpNLE1BSUEsSUFBSSxjQUFjLElBQWxCLEVBQXdCO0FBQzdCLGNBQUksb0JBQW9CLE1BQUssS0FBTCxDQUFXLElBQUksQ0FBZixJQUFvQixNQUFLLEtBQUwsQ0FBVyxJQUFJLENBQWYsRUFBa0IsQ0FBbEIsQ0FBcEIsR0FBMkMsSUFBbkU7QUFDQSxjQUFJLHNCQUFzQixHQUExQixFQUErQjtBQUM3QiwwQkFBYyxJQUFkO0FBQ0QsV0FGRCxNQUVPLElBQUksc0JBQXNCLEdBQTFCLEVBQStCO0FBQ3BDLHVCQUFXLElBQVg7QUFDRDtBQUNGO0FBQ0Y7QUFDRjs7O0FBR0QsTUFBSSxXQUFKLEVBQWlCO0FBQ2YsV0FBTyxDQUFDLE1BQU0sTUFBTSxNQUFOLEdBQWUsQ0FBckIsQ0FBUixFQUFpQztBQUMvQixZQUFNLEdBQU47QUFDQSxpQkFBVyxHQUFYO0FBQ0Q7QUFDRixHQUxELE1BS08sSUFBSSxRQUFKLEVBQWM7QUFDbkIsVUFBTSxJQUFOLENBQVcsRUFBWDtBQUNBLGVBQVcsSUFBWCxDQUFnQixJQUFoQjtBQUNEO0FBQ0QsT0FBSyxJQUFJLEtBQUssQ0FBZCxFQUFpQixLQUFLLE1BQU0sTUFBTixHQUFlLENBQXJDLEVBQXdDLElBQXhDLEVBQThDO0FBQzVDLFVBQU0sRUFBTixJQUFZLE1BQU0sRUFBTixJQUFZLFdBQVcsRUFBWCxDQUF4QjtBQUNEO0FBQ0QsU0FBTyxNQUFNLElBQU4sQ0FBVyxFQUFYLENBQVA7QUFDRDs7O0FBR00sU0FBUyxZQUFULENBQXNCLE9BQXRCLEVBQStCLE9BQS9CLEVBQXdDO0FBQzdDLE1BQUksT0FBTyxPQUFQLEtBQW1CLFFBQXZCLEVBQWlDO0FBQy9CLGMseUJBQVUsc0Isd0JBQUEsQ0FBVyxPQUFYLENBQVY7QUFDRDs7QUFFRCxNQUFJLGVBQWUsQ0FBbkI7QUFDQSxXQUFTLFlBQVQsR0FBd0I7QUFDdEIsUUFBSSxRQUFRLFFBQVEsY0FBUixDQUFaO0FBQ0EsUUFBSSxDQUFDLEtBQUwsRUFBWTtBQUNWLGFBQU8sUUFBUSxRQUFSLEVBQVA7QUFDRDs7QUFFRCxZQUFRLFFBQVIsQ0FBaUIsS0FBakIsRUFBd0IsVUFBUyxHQUFULEVBQWMsSUFBZCxFQUFvQjtBQUMxQyxVQUFJLEdBQUosRUFBUztBQUNQLGVBQU8sUUFBUSxRQUFSLENBQWlCLEdBQWpCLENBQVA7QUFDRDs7QUFFRCxVQUFJLGlCQUFpQixXQUFXLElBQVgsRUFBaUIsS0FBakIsRUFBd0IsT0FBeEIsQ0FBckI7QUFDQSxjQUFRLE9BQVIsQ0FBZ0IsS0FBaEIsRUFBdUIsY0FBdkIsRUFBdUMsVUFBUyxHQUFULEVBQWM7QUFDbkQsWUFBSSxHQUFKLEVBQVM7QUFDUCxpQkFBTyxRQUFRLFFBQVIsQ0FBaUIsR0FBakIsQ0FBUDtBQUNEOztBQUVEO0FBQ0QsT0FORDtBQU9ELEtBYkQ7QUFjRDtBQUNEO0FBQ0Q7Ozs7Ozs7Z0NDNUplLGUsR0FBQSxlO3lEQWlHQSxtQixHQUFBLG1CO3lEQXdCQSxXLEdBQUEsVzs7QUEzSGhCLEkseUJBQUEsK0Isd0JBQUE7Ozs7O3VCQUVPLFNBQVMsZUFBVCxDQUF5QixXQUF6QixFQUFzQyxXQUF0QyxFQUFtRCxNQUFuRCxFQUEyRCxNQUEzRCxFQUFtRSxTQUFuRSxFQUE4RSxTQUE5RSxFQUF5RixPQUF6RixFQUFrRztBQUN2RyxNQUFJLENBQUMsT0FBTCxFQUFjO0FBQ1osY0FBVSxFQUFWO0FBQ0Q7QUFDRCxNQUFJLE9BQU8sUUFBUSxPQUFmLEtBQTJCLFdBQS9CLEVBQTRDO0FBQzFDLFlBQVEsT0FBUixHQUFrQixDQUFsQjtBQUNEOztBQUVELE1BQU0sTyx5QkFBTyxvQix3QkFBQSxDQUFVLE1BQVYsRUFBa0IsTUFBbEIsRUFBMEIsT0FBMUIsQ0FBYjtBQUNBLE9BQUssSUFBTCxDQUFVLEVBQUMsT0FBTyxFQUFSLEVBQVksT0FBTyxFQUFuQixFQUFWLEU7O0FBRUEsV0FBUyxZQUFULENBQXNCLEtBQXRCLEVBQTZCO0FBQzNCLFdBQU8sTUFBTSxHQUFOLENBQVUsVUFBUyxLQUFULEVBQWdCO0FBQUUsYUFBTyxNQUFNLEtBQWI7QUFBcUIsS0FBakQsQ0FBUDtBQUNEOztBQUVELE1BQUksUUFBUSxFQUFaO0FBQ0EsTUFBSSxnQkFBZ0IsQ0FBcEI7QUFBQSxNQUF1QixnQkFBZ0IsQ0FBdkM7QUFBQSxNQUEwQyxXQUFXLEVBQXJEO0FBQUEsTUFDSSxVQUFVLENBRGQ7QUFBQSxNQUNpQixVQUFVLENBRDNCOztBQWhCdUcsNkIsd0JBa0I5RixDQWxCOEY7QUFtQnJHLFFBQU0sVUFBVSxLQUFLLENBQUwsQ0FBaEI7QUFBQSxRQUNNLFFBQVEsUUFBUSxLQUFSLElBQWlCLFFBQVEsS0FBUixDQUFjLE9BQWQsQ0FBc0IsS0FBdEIsRUFBNkIsRUFBN0IsRUFBaUMsS0FBakMsQ0FBdUMsSUFBdkMsQ0FEL0I7QUFFQSxZQUFRLEtBQVIsR0FBZ0IsS0FBaEI7O0FBRUEsUUFBSSxRQUFRLEtBQVIsSUFBaUIsUUFBUSxPQUE3QixFQUFzQzs7QUFBQTs7OztBQUVwQyxVQUFJLENBQUMsYUFBTCxFQUFvQjtBQUNsQixZQUFNLE9BQU8sS0FBSyxJQUFJLENBQVQsQ0FBYjtBQUNBLHdCQUFnQixPQUFoQjtBQUNBLHdCQUFnQixPQUFoQjs7QUFFQSxZQUFJLElBQUosRUFBVTtBQUNSLHFCQUFXLFFBQVEsT0FBUixHQUFrQixDQUFsQixHQUFzQixhQUFhLEtBQUssS0FBTCxDQUFXLEtBQVgsQ0FBaUIsQ0FBQyxRQUFRLE9BQTFCLENBQWIsQ0FBdEIsR0FBeUUsRUFBcEY7QUFDQSwyQkFBaUIsU0FBUyxNQUExQjtBQUNBLDJCQUFpQixTQUFTLE1BQTFCO0FBQ0Q7QUFDRjs7OytCQUdELGEsdUJBQUEsVUFBUyxJQUFULEMsMEJBQUEsSyx3QkFBQSxDLDBCQUFBLFMsd0JBQUEsRSx5QkFBQSxtQix3QkFBa0IsTUFBTSxHQUFOLENBQVUsVUFBUyxLQUFULEVBQWdCO0FBQzFDLGVBQU8sQ0FBQyxRQUFRLEtBQVIsR0FBZ0IsR0FBaEIsR0FBc0IsR0FBdkIsSUFBOEIsS0FBckM7QUFDRCxPQUZpQixDQUFsQjs7O0FBS0EsVUFBSSxRQUFRLEtBQVosRUFBbUI7QUFDakIsbUJBQVcsTUFBTSxNQUFqQjtBQUNELE9BRkQsTUFFTztBQUNMLG1CQUFXLE1BQU0sTUFBakI7QUFDRDtBQUNGLEtBekJELE1BeUJPOztBQUVMLFVBQUksYUFBSixFQUFtQjs7QUFFakIsWUFBSSxNQUFNLE1BQU4sSUFBZ0IsUUFBUSxPQUFSLEdBQWtCLENBQWxDLElBQXVDLElBQUksS0FBSyxNQUFMLEdBQWMsQ0FBN0QsRUFBZ0U7O0FBQUE7Ozs7bUNBRTlELGMsdUJBQUEsVUFBUyxJQUFULEMsMEJBQUEsSyx3QkFBQSxDLDBCQUFBLFUsd0JBQUEsRSx5QkFBQSxtQix3QkFBa0IsYUFBYSxLQUFiLENBQWxCO0FBQ0QsU0FIRCxNQUdPOztBQUFBOzs7O0FBRUwsY0FBSSxjQUFjLEtBQUssR0FBTCxDQUFTLE1BQU0sTUFBZixFQUF1QixRQUFRLE9BQS9CLENBQWxCO21DQUNBLGMsdUJBQUEsVUFBUyxJQUFULEMsMEJBQUEsSyx3QkFBQSxDLDBCQUFBLFUsd0JBQUEsRSx5QkFBQSxtQix3QkFBa0IsYUFBYSxNQUFNLEtBQU4sQ0FBWSxDQUFaLEVBQWUsV0FBZixDQUFiLENBQWxCOztBQUVBLGNBQUksT0FBTztBQUNULHNCQUFVLGFBREQ7QUFFVCxzQkFBVyxVQUFVLGFBQVYsR0FBMEIsV0FGNUI7QUFHVCxzQkFBVSxhQUhEO0FBSVQsc0JBQVcsVUFBVSxhQUFWLEdBQTBCLFdBSjVCO0FBS1QsbUJBQU87QUFMRSxXQUFYO0FBT0EsY0FBSSxLQUFLLEtBQUssTUFBTCxHQUFjLENBQW5CLElBQXdCLE1BQU0sTUFBTixJQUFnQixRQUFRLE9BQXBELEVBQTZEOztBQUUzRCxnQkFBSSxnQkFBaUIsTUFBTSxJQUFOLENBQVcsTUFBWCxDQUFyQjtBQUNBLGdCQUFJLGdCQUFpQixNQUFNLElBQU4sQ0FBVyxNQUFYLENBQXJCO0FBQ0EsZ0JBQUksTUFBTSxNQUFOLElBQWdCLENBQWhCLElBQXFCLENBQUMsYUFBMUIsRUFBeUM7O0FBRXZDLHVCQUFTLE1BQVQsQ0FBZ0IsS0FBSyxRQUFyQixFQUErQixDQUEvQixFQUFrQyw4QkFBbEM7QUFDRCxhQUhELE1BR08sSUFBSSxDQUFDLGFBQUQsSUFBa0IsQ0FBQyxhQUF2QixFQUFzQztBQUMzQyx1QkFBUyxJQUFULENBQWMsOEJBQWQ7QUFDRDtBQUNGO0FBQ0QsZ0JBQU0sSUFBTixDQUFXLElBQVg7O0FBRUEsMEJBQWdCLENBQWhCO0FBQ0EsMEJBQWdCLENBQWhCO0FBQ0EscUJBQVcsRUFBWDtBQUNEO0FBQ0Y7QUFDRCxpQkFBVyxNQUFNLE1BQWpCO0FBQ0EsaUJBQVcsTUFBTSxNQUFqQjtBQUNEO0FBdkZvRzs7QUFrQnZHLE9BQUssSUFBSSxJQUFJLENBQWIsRUFBZ0IsSUFBSSxLQUFLLE1BQXpCLEVBQWlDLEdBQWpDLEVBQXNDOztBQUFBLFUsd0JBQTdCLENBQTZCO0FBc0VyQzs7QUFFRCxTQUFPO0FBQ0wsaUJBQWEsV0FEUixFQUNxQixhQUFhLFdBRGxDO0FBRUwsZUFBVyxTQUZOLEVBRWlCLFdBQVcsU0FGNUI7QUFHTCxXQUFPO0FBSEYsR0FBUDtBQUtEOztBQUVNLFNBQVMsbUJBQVQsQ0FBNkIsV0FBN0IsRUFBMEMsV0FBMUMsRUFBdUQsTUFBdkQsRUFBK0QsTUFBL0QsRUFBdUUsU0FBdkUsRUFBa0YsU0FBbEYsRUFBNkYsT0FBN0YsRUFBc0c7QUFDM0csTUFBTSxPQUFPLGdCQUFnQixXQUFoQixFQUE2QixXQUE3QixFQUEwQyxNQUExQyxFQUFrRCxNQUFsRCxFQUEwRCxTQUExRCxFQUFxRSxTQUFyRSxFQUFnRixPQUFoRixDQUFiOztBQUVBLE1BQU0sTUFBTSxFQUFaO0FBQ0EsTUFBSSxlQUFlLFdBQW5CLEVBQWdDO0FBQzlCLFFBQUksSUFBSixDQUFTLFlBQVksV0FBckI7QUFDRDtBQUNELE1BQUksSUFBSixDQUFTLHFFQUFUO0FBQ0EsTUFBSSxJQUFKLENBQVMsU0FBUyxLQUFLLFdBQWQsSUFBNkIsT0FBTyxLQUFLLFNBQVosS0FBMEIsV0FBMUIsR0FBd0MsRUFBeEMsR0FBNkMsT0FBTyxLQUFLLFNBQXRGLENBQVQ7QUFDQSxNQUFJLElBQUosQ0FBUyxTQUFTLEtBQUssV0FBZCxJQUE2QixPQUFPLEtBQUssU0FBWixLQUEwQixXQUExQixHQUF3QyxFQUF4QyxHQUE2QyxPQUFPLEtBQUssU0FBdEYsQ0FBVDs7QUFFQSxPQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLElBQUksS0FBSyxLQUFMLENBQVcsTUFBL0IsRUFBdUMsR0FBdkMsRUFBNEM7QUFDMUMsUUFBTSxPQUFPLEtBQUssS0FBTCxDQUFXLENBQVgsQ0FBYjtBQUNBLFFBQUksSUFBSixDQUNFLFNBQVMsS0FBSyxRQUFkLEdBQXlCLEdBQXpCLEdBQStCLEtBQUssUUFBcEMsR0FDRSxJQURGLEdBQ1MsS0FBSyxRQURkLEdBQ3lCLEdBRHpCLEdBQytCLEtBQUssUUFEcEMsR0FFRSxLQUhKO0FBS0EsUUFBSSxJQUFKLENBQVMsS0FBVCxDQUFlLEdBQWYsRUFBb0IsS0FBSyxLQUF6QjtBQUNEOztBQUVELFNBQU8sSUFBSSxJQUFKLENBQVMsSUFBVCxJQUFpQixJQUF4QjtBQUNEOztBQUVNLFNBQVMsV0FBVCxDQUFxQixRQUFyQixFQUErQixNQUEvQixFQUF1QyxNQUF2QyxFQUErQyxTQUEvQyxFQUEwRCxTQUExRCxFQUFxRSxPQUFyRSxFQUE4RTtBQUNuRixTQUFPLG9CQUFvQixRQUFwQixFQUE4QixRQUE5QixFQUF3QyxNQUF4QyxFQUFnRCxNQUFoRCxFQUF3RCxTQUF4RCxFQUFtRSxTQUFuRSxFQUE4RSxPQUE5RSxDQUFQO0FBQ0Q7Ozs7Ozs7Z0NDN0hlLFUsR0FBQSxVO0FBQVQsU0FBUyxVQUFULENBQW9CLE9BQXBCLEVBQTJDOzJCQUFBLEksdUJBQWQsT0FBYyx5REFBSixFQUFJOztBQUNoRCxNQUFJLFVBQVUsUUFBUSxLQUFSLENBQWMscUJBQWQsQ0FBZDtBQUFBLE1BQ0ksYUFBYSxRQUFRLEtBQVIsQ0FBYyxzQkFBZCxLQUF5QyxFQUQxRDtBQUFBLE1BRUksT0FBTyxFQUZYO0FBQUEsTUFHSSxJQUFJLENBSFI7O0FBS0EsV0FBUyxVQUFULEdBQXNCO0FBQ3BCLFFBQUksUUFBUSxFQUFaO0FBQ0EsU0FBSyxJQUFMLENBQVUsS0FBVjs7O0FBR0EsV0FBTyxJQUFJLFFBQVEsTUFBbkIsRUFBMkI7QUFDekIsVUFBSSxPQUFPLFFBQVEsQ0FBUixDQUFYOzs7QUFHQSxVQUFJLHdCQUF3QixJQUF4QixDQUE2QixJQUE3QixDQUFKLEVBQXdDO0FBQ3RDO0FBQ0Q7OztBQUdELFVBQUksU0FBVSwwQ0FBRCxDQUE2QyxJQUE3QyxDQUFrRCxJQUFsRCxDQUFiO0FBQ0EsVUFBSSxNQUFKLEVBQVk7QUFDVixjQUFNLEtBQU4sR0FBYyxPQUFPLENBQVAsQ0FBZDtBQUNEOztBQUVEO0FBQ0Q7Ozs7QUFJRCxvQkFBZ0IsS0FBaEI7QUFDQSxvQkFBZ0IsS0FBaEI7OztBQUdBLFVBQU0sS0FBTixHQUFjLEVBQWQ7O0FBRUEsV0FBTyxJQUFJLFFBQVEsTUFBbkIsRUFBMkI7QUFDekIsVUFBSSxRQUFPLFFBQVEsQ0FBUixDQUFYOztBQUVBLFVBQUksaUNBQWlDLElBQWpDLENBQXNDLEtBQXRDLENBQUosRUFBaUQ7QUFDL0M7QUFDRCxPQUZELE1BRU8sSUFBSSxNQUFNLElBQU4sQ0FBVyxLQUFYLENBQUosRUFBc0I7QUFDM0IsY0FBTSxLQUFOLENBQVksSUFBWixDQUFpQixXQUFqQjtBQUNELE9BRk0sTUFFQSxJQUFJLFNBQVEsUUFBUSxNQUFwQixFQUE0Qjs7QUFFakMsY0FBTSxJQUFJLEtBQUosQ0FBVSxtQkFBbUIsSUFBSSxDQUF2QixJQUE0QixHQUE1QixHQUFrQyxLQUFLLFNBQUwsQ0FBZSxLQUFmLENBQTVDLENBQU47QUFDRCxPQUhNLE1BR0E7QUFDTDtBQUNEO0FBQ0Y7QUFDRjs7OztBQUlELFdBQVMsZUFBVCxDQUF5QixLQUF6QixFQUFnQztBQUM5QixRQUFNLGdCQUFnQiwwQ0FBdEI7QUFDQSxRQUFNLGFBQWEsY0FBYyxJQUFkLENBQW1CLFFBQVEsQ0FBUixDQUFuQixDQUFuQjtBQUNBLFFBQUksVUFBSixFQUFnQjtBQUNkLFVBQUksWUFBWSxXQUFXLENBQVgsTUFBa0IsS0FBbEIsR0FBMEIsS0FBMUIsR0FBa0MsS0FBbEQ7QUFDQSxZQUFNLFlBQVksVUFBbEIsSUFBZ0MsV0FBVyxDQUFYLENBQWhDO0FBQ0EsWUFBTSxZQUFZLFFBQWxCLElBQThCLFdBQVcsQ0FBWCxDQUE5Qjs7QUFFQTtBQUNEO0FBQ0Y7Ozs7QUFJRCxXQUFTLFNBQVQsR0FBcUI7QUFDbkIsUUFBSSxtQkFBbUIsQ0FBdkI7QUFBQSxRQUNJLGtCQUFrQixRQUFRLEdBQVIsQ0FEdEI7QUFBQSxRQUVJLGNBQWMsZ0JBQWdCLEtBQWhCLENBQXNCLDRDQUF0QixDQUZsQjs7QUFJQSxRQUFJLE9BQU87QUFDVCxnQkFBVSxDQUFDLFlBQVksQ0FBWixDQURGO0FBRVQsZ0JBQVUsQ0FBQyxZQUFZLENBQVosQ0FBRCxJQUFtQixDQUZwQjtBQUdULGdCQUFVLENBQUMsWUFBWSxDQUFaLENBSEY7QUFJVCxnQkFBVSxDQUFDLFlBQVksQ0FBWixDQUFELElBQW1CLENBSnBCO0FBS1QsYUFBTyxFQUxFO0FBTVQsc0JBQWdCO0FBTlAsS0FBWDs7QUFTQSxRQUFJLFdBQVcsQ0FBZjtBQUFBLFFBQ0ksY0FBYyxDQURsQjtBQUVBLFdBQU8sSUFBSSxRQUFRLE1BQW5CLEVBQTJCLEdBQTNCLEVBQWdDOzs7QUFHOUIsVUFBSSxRQUFRLENBQVIsRUFBVyxPQUFYLENBQW1CLE1BQW5CLE1BQStCLENBQS9CLElBQ00sSUFBSSxDQUFKLEdBQVEsUUFBUSxNQUR0QixJQUVLLFFBQVEsSUFBSSxDQUFaLEVBQWUsT0FBZixDQUF1QixNQUF2QixNQUFtQyxDQUZ4QyxJQUdLLFFBQVEsSUFBSSxDQUFaLEVBQWUsT0FBZixDQUF1QixJQUF2QixNQUFpQyxDQUgxQyxFQUc2QztBQUN6QztBQUNIO0FBQ0QsVUFBSSxZQUFZLFFBQVEsQ0FBUixFQUFXLENBQVgsQ0FBaEI7O0FBRUEsVUFBSSxjQUFjLEdBQWQsSUFBcUIsY0FBYyxHQUFuQyxJQUEwQyxjQUFjLEdBQXhELElBQStELGNBQWMsSUFBakYsRUFBdUY7QUFDckYsYUFBSyxLQUFMLENBQVcsSUFBWCxDQUFnQixRQUFRLENBQVIsQ0FBaEI7QUFDQSxhQUFLLGNBQUwsQ0FBb0IsSUFBcEIsQ0FBeUIsV0FBVyxDQUFYLEtBQWlCLElBQTFDOztBQUVBLFlBQUksY0FBYyxHQUFsQixFQUF1QjtBQUNyQjtBQUNELFNBRkQsTUFFTyxJQUFJLGNBQWMsR0FBbEIsRUFBdUI7QUFDNUI7QUFDRCxTQUZNLE1BRUEsSUFBSSxjQUFjLEdBQWxCLEVBQXVCO0FBQzVCO0FBQ0E7QUFDRDtBQUNGLE9BWkQsTUFZTztBQUNMO0FBQ0Q7QUFDRjs7O0FBR0QsUUFBSSxDQUFDLFFBQUQsSUFBYSxLQUFLLFFBQUwsS0FBa0IsQ0FBbkMsRUFBc0M7QUFDcEMsV0FBSyxRQUFMLEdBQWdCLENBQWhCO0FBQ0Q7QUFDRCxRQUFJLENBQUMsV0FBRCxJQUFnQixLQUFLLFFBQUwsS0FBa0IsQ0FBdEMsRUFBeUM7QUFDdkMsV0FBSyxRQUFMLEdBQWdCLENBQWhCO0FBQ0Q7OztBQUdELFFBQUksUUFBUSxNQUFaLEVBQW9CO0FBQ2xCLFVBQUksYUFBYSxLQUFLLFFBQXRCLEVBQWdDO0FBQzlCLGNBQU0sSUFBSSxLQUFKLENBQVUsc0RBQXNELG1CQUFtQixDQUF6RSxDQUFWLENBQU47QUFDRDtBQUNELFVBQUksZ0JBQWdCLEtBQUssUUFBekIsRUFBbUM7QUFDakMsY0FBTSxJQUFJLEtBQUosQ0FBVSx3REFBd0QsbUJBQW1CLENBQTNFLENBQVYsQ0FBTjtBQUNEO0FBQ0Y7O0FBRUQsV0FBTyxJQUFQO0FBQ0Q7O0FBRUQsU0FBTyxJQUFJLFFBQVEsTUFBbkIsRUFBMkI7QUFDekI7QUFDRDs7QUFFRCxTQUFPLElBQVA7QUFDRDs7Ozs7Ozs7NENDdkljLFVBQVMsS0FBVCxFQUFnQixPQUFoQixFQUF5QixPQUF6QixFQUFrQztBQUMvQyxNQUFJLGNBQWMsSUFBbEI7QUFBQSxNQUNJLG9CQUFvQixLQUR4QjtBQUFBLE1BRUksbUJBQW1CLEtBRnZCO0FBQUEsTUFHSSxjQUFjLENBSGxCOztBQUtBLFNBQU8sU0FBUyxRQUFULEdBQW9CO0FBQ3pCLFFBQUksZUFBZSxDQUFDLGdCQUFwQixFQUFzQztBQUNwQyxVQUFJLGlCQUFKLEVBQXVCO0FBQ3JCO0FBQ0QsT0FGRCxNQUVPO0FBQ0wsc0JBQWMsS0FBZDtBQUNEOzs7O0FBSUQsVUFBSSxRQUFRLFdBQVIsSUFBdUIsT0FBM0IsRUFBb0M7QUFDbEMsZUFBTyxXQUFQO0FBQ0Q7O0FBRUQseUJBQW1CLElBQW5CO0FBQ0Q7O0FBRUQsUUFBSSxDQUFDLGlCQUFMLEVBQXdCO0FBQ3RCLFVBQUksQ0FBQyxnQkFBTCxFQUF1QjtBQUNyQixzQkFBYyxJQUFkO0FBQ0Q7Ozs7QUFJRCxVQUFJLFdBQVcsUUFBUSxXQUF2QixFQUFvQztBQUNsQyxlQUFPLENBQUMsYUFBUjtBQUNEOztBQUVELDBCQUFvQixJQUFwQjtBQUNBLGFBQU8sVUFBUDtBQUNEOzs7O0FBSUYsR0FsQ0Q7QUFtQ0QsQzs7Ozs7OztnQ0M1Q2UsZSxHQUFBLGU7QUFBVCxTQUFTLGVBQVQsQ0FBeUIsT0FBekIsRUFBa0MsUUFBbEMsRUFBNEM7QUFDakQsTUFBSSxPQUFPLE9BQVAsS0FBbUIsVUFBdkIsRUFBbUM7QUFDakMsYUFBUyxRQUFULEdBQW9CLE9BQXBCO0FBQ0QsR0FGRCxNQUVPLElBQUksT0FBSixFQUFhO0FBQ2xCLFNBQUssSUFBSSxJQUFULElBQWlCLE9BQWpCLEVBQTBCOztBQUV4QixVQUFJLFFBQVEsY0FBUixDQUF1QixJQUF2QixDQUFKLEVBQWtDO0FBQ2hDLGlCQUFTLElBQVQsSUFBaUIsUUFBUSxJQUFSLENBQWpCO0FBQ0Q7QUFDRjtBQUNGO0FBQ0QsU0FBTyxRQUFQO0FBQ0Q7Ozs7QUNaRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTs7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNqNEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaGFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlwidXNlIHN0cmljdFwiXG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcImNsZWFuLWFzc2VydFwiKVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxuLyoqXG4gKiBDb3JlIFRERC1zdHlsZSBhc3NlcnRpb25zLiBUaGVzZSBhcmUgZG9uZSBieSBhIGNvbXBvc2l0aW9uIG9mIERTTHMsIHNpbmNlXG4gKiB0aGVyZSBpcyAqc28qIG11Y2ggcmVwZXRpdGlvbi5cbiAqL1xuXG52YXIgbWF0Y2ggPSByZXF1aXJlKFwiY2xlYW4tbWF0Y2hcIilcbnZhciBkZXByZWNhdGUgPSByZXF1aXJlKFwiLi9taWdyYXRlL2NvbW1vblwiKS5kZXByZWNhdGVcblxudmFyIHRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZ1xudmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHlcblxuLyogZXNsaW50LWRpc2FibGUgbm8tc2VsZi1jb21wYXJlICovXG4vLyBGb3IgYmV0dGVyIE5hTiBoYW5kbGluZ1xuZnVuY3Rpb24gc3RyaWN0SXMoYSwgYikge1xuICAgIHJldHVybiBhID09PSBiIHx8IGEgIT09IGEgJiYgYiAhPT0gYlxufVxuXG5mdW5jdGlvbiBsb29zZUlzKGEsIGIpIHtcbiAgICByZXR1cm4gYSA9PSBiIHx8IGEgIT09IGEgJiYgYiAhPT0gYiAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGVxZXFlcVxufVxuXG4vKiBlc2xpbnQtZW5hYmxlIG5vLXNlbGYtY29tcGFyZSAqL1xuXG52YXIgY2hlY2sgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIHByZWZpeCh0eXBlKSB7XG4gICAgICAgIHJldHVybiAoL15bYWVpb3VdLy50ZXN0KHR5cGUpID8gXCJhbiBcIiA6IFwiYSBcIikgKyB0eXBlXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY2hlY2sodmFsdWUsIHR5cGUpIHtcbiAgICAgICAgaWYgKHR5cGUgPT09IFwiYXJyYXlcIikgcmV0dXJuIEFycmF5LmlzQXJyYXkodmFsdWUpXG4gICAgICAgIGlmICh0eXBlID09PSBcInJlZ2V4cFwiKSByZXR1cm4gdG9TdHJpbmcuY2FsbCh2YWx1ZSkgPT09IFwiW29iamVjdCBSZWdFeHBdXCJcbiAgICAgICAgaWYgKHR5cGUgPT09IFwib2JqZWN0XCIpIHJldHVybiB2YWx1ZSAhPSBudWxsICYmIHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIlxuICAgICAgICBpZiAodHlwZSA9PT0gXCJudWxsXCIpIHJldHVybiB2YWx1ZSA9PT0gbnVsbFxuICAgICAgICBpZiAodHlwZSA9PT0gXCJub25lXCIpIHJldHVybiB2YWx1ZSA9PSBudWxsXG4gICAgICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT09IHR5cGVcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjaGVja0xpc3QodmFsdWUsIHR5cGVzKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdHlwZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChjaGVjayh2YWx1ZSwgdHlwZXNbaV0pKSByZXR1cm4gdHJ1ZVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY2hlY2tTaW5nbGUodmFsdWUsIG5hbWUsIHR5cGUpIHtcbiAgICAgICAgaWYgKCFjaGVjayh2YWx1ZSwgdHlwZSkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJgXCIgKyBuYW1lICsgXCJgIG11c3QgYmUgXCIgKyBwcmVmaXgodHlwZSkpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjaGVja01hbnkodmFsdWUsIG5hbWUsIHR5cGVzKSB7XG4gICAgICAgIGlmICghY2hlY2tMaXN0KHZhbHVlLCB0eXBlcykpIHtcbiAgICAgICAgICAgIHZhciBzdHIgPSBcImBcIiArIG5hbWUgKyBcImAgbXVzdCBiZSBlaXRoZXJcIlxuXG4gICAgICAgICAgICBpZiAodHlwZXMubGVuZ3RoID09PSAyKSB7XG4gICAgICAgICAgICAgICAgc3RyICs9IHByZWZpeCh0eXBlc1swXSkgKyBcIiBvciBcIiArIHByZWZpeCh0eXBlc1sxXSlcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc3RyICs9IHByZWZpeCh0eXBlc1swXSlcblxuICAgICAgICAgICAgICAgIHZhciBlbmQgPSB0eXBlcy5sZW5ndGggLSAxXG5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0ciArPSBcIiwgXCIgKyBwcmVmaXgodHlwZXNbaV0pXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgc3RyICs9IFwiLCBvciBcIiArIHByZWZpeCh0eXBlc1tlbmRdKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKHN0cilcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUsIG5hbWUsIHR5cGUpIHtcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHR5cGUpKSByZXR1cm4gY2hlY2tTaW5nbGUodmFsdWUsIG5hbWUsIHR5cGUpXG4gICAgICAgIGlmICh0eXBlLmxlbmd0aCA9PT0gMSkgcmV0dXJuIGNoZWNrU2luZ2xlKHZhbHVlLCBuYW1lLCB0eXBlWzBdKVxuICAgICAgICByZXR1cm4gY2hlY2tNYW55KHZhbHVlLCBuYW1lLCB0eXBlKVxuICAgIH1cbn0pKClcblxuZnVuY3Rpb24gY2hlY2tUeXBlT2YodmFsdWUsIG5hbWUpIHtcbiAgICBpZiAodmFsdWUgPT09IFwiYm9vbGVhblwiIHx8IHZhbHVlID09PSBcImZ1bmN0aW9uXCIpIHJldHVyblxuICAgIGlmICh2YWx1ZSA9PT0gXCJudW1iZXJcIiB8fCB2YWx1ZSA9PT0gXCJvYmplY3RcIiB8fCB2YWx1ZSA9PT0gXCJzdHJpbmdcIikgcmV0dXJuXG4gICAgaWYgKHZhbHVlID09PSBcInN5bWJvbFwiIHx8IHZhbHVlID09PSBcInVuZGVmaW5lZFwiKSByZXR1cm5cbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYFwiICsgbmFtZSArIFwiYCBtdXN0IGJlIGEgdmFsaWQgYHR5cGVvZmAgdmFsdWVcIilcbn1cblxuLy8gVGhpcyBob2xkcyBldmVyeXRoaW5nIHRvIGJlIGFkZGVkLlxudmFyIG1ldGhvZHMgPSBbXVxudmFyIGFsaWFzZXMgPSBbXVxuXG5mdW5jdGlvbiBnZXRBc3NlcnRpb25EZXByZWNhdGlvbihuYW1lKSB7XG4gICAgdmFyIHJlcGxhY2VtZW50ID0gbmFtZVxuXG4gICAgc3dpdGNoIChuYW1lKSB7XG4gICAgY2FzZSBcImJvb2xlYW5cIjogcmVwbGFjZW1lbnQgPSBcImlzQm9vbGVhblwiOyBicmVha1xuICAgIGNhc2UgXCJmdW5jdGlvblwiOiByZXBsYWNlbWVudCA9IFwiaXNGdW5jdGlvblwiOyBicmVha1xuICAgIGNhc2UgXCJudW1iZXJcIjogcmVwbGFjZW1lbnQgPSBcImlzTnVtYmVyXCI7IGJyZWFrXG4gICAgY2FzZSBcIm9iamVjdFwiOiByZXBsYWNlbWVudCA9IFwiaXNPYmplY3RcIjsgYnJlYWtcbiAgICBjYXNlIFwic3RyaW5nXCI6IHJlcGxhY2VtZW50ID0gXCJpc1N0cmluZ1wiOyBicmVha1xuICAgIGNhc2UgXCJzeW1ib2xcIjogcmVwbGFjZW1lbnQgPSBcImlzU3ltYm9sXCI7IGJyZWFrXG4gICAgY2FzZSBcImluc3RhbmNlb2ZcIjogcmVwbGFjZW1lbnQgPSBcImlzXCI7IGJyZWFrXG4gICAgY2FzZSBcIm5vdEluc3RhbmNlb2ZcIjogcmVwbGFjZW1lbnQgPSBcIm5vdFwiOyBicmVha1xuICAgIGNhc2UgXCJoYXNMZW5ndGhcIjogcmVwbGFjZW1lbnQgPSBcImVxdWFsXCI7IGJyZWFrXG4gICAgY2FzZSBcIm5vdExlbmd0aFwiOiByZXBsYWNlbWVudCA9IFwibm90RXF1YWxcIjsgYnJlYWtcbiAgICBjYXNlIFwibGVuZ3RoQXRMZWFzdFwiOiByZXBsYWNlbWVudCA9IFwiYXRMZWFzdFwiOyBicmVha1xuICAgIGNhc2UgXCJsZW5ndGhBdE1vc3RcIjogcmVwbGFjZW1lbnQgPSBcImF0TW9zdFwiOyBicmVha1xuICAgIGNhc2UgXCJsZW5ndGhBYm92ZVwiOiByZXBsYWNlbWVudCA9IFwiYWJvdmVcIjsgYnJlYWtcbiAgICBjYXNlIFwibGVuZ3RoQmVsb3dcIjogcmVwbGFjZW1lbnQgPSBcImJlbG93XCI7IGJyZWFrXG4gICAgY2FzZSBcIm5vdEluY2x1ZGVzQWxsXCI6IHJlcGxhY2VtZW50ID0gXCJub3RJbmNsdWRlc0FsbFwiOyBicmVha1xuICAgIGNhc2UgXCJub3RJbmNsdWRlc0xvb3NlQWxsXCI6IHJlcGxhY2VtZW50ID0gXCJub3RJbmNsdWRlc0FsbFwiOyBicmVha1xuICAgIGNhc2UgXCJub3RJbmNsdWRlc0RlZXBBbGxcIjogcmVwbGFjZW1lbnQgPSBcIm5vdEluY2x1ZGVzQWxsRGVlcFwiOyBicmVha1xuICAgIGNhc2UgXCJub3RJbmNsdWRlc01hdGNoQWxsXCI6IHJlcGxhY2VtZW50ID0gXCJub3RJbmNsdWRlc0FsbE1hdGNoXCI7IGJyZWFrXG4gICAgY2FzZSBcImluY2x1ZGVzQW55XCI6IHJlcGxhY2VtZW50ID0gXCJpbmNsdWRlc0FueVwiOyBicmVha1xuICAgIGNhc2UgXCJpbmNsdWRlc0xvb3NlQW55XCI6IHJlcGxhY2VtZW50ID0gXCJpbmNsdWRlc0FueVwiOyBicmVha1xuICAgIGNhc2UgXCJpbmNsdWRlc0RlZXBBbnlcIjogcmVwbGFjZW1lbnQgPSBcImluY2x1ZGVzQW55RGVlcFwiOyBicmVha1xuICAgIGNhc2UgXCJpbmNsdWRlc01hdGNoQW55XCI6IHJlcGxhY2VtZW50ID0gXCJpbmNsdWRlc0FueU1hdGNoXCI7IGJyZWFrXG4gICAgY2FzZSBcInVuZGVmaW5lZFwiOlxuICAgICAgICByZXR1cm4gXCJgdC51bmRlZmluZWQoKWAgaXMgZGVwcmVjYXRlZC4gVXNlIFwiICtcbiAgICAgICAgICAgIFwiYGFzc2VydC5lcXVhbCh1bmRlZmluZWQsIHZhbHVlKWAuIGZyb20gYHRoYWxsaXVtL2Fzc2VydGAgaW5zdGVhZC5cIlxuICAgIGNhc2UgXCJ0eXBlXCI6XG4gICAgICAgIHJldHVybiBcImB0LnR5cGUoKWAgaXMgZGVwcmVjYXRlZC4gVXNlIGBhc3NlcnQuaXNCb29sZWFuKClgL2V0Yy4gZnJvbSBcIiArXG4gICAgICAgICAgICBcImB0aGFsbGl1bS9hc3NlcnRgIGluc3RlYWQuXCJcbiAgICBkZWZhdWx0OiAvLyBpZ25vcmVcbiAgICB9XG5cbiAgICByZXR1cm4gXCJgdC5cIiArIG5hbWUgKyBcIigpYCBpcyBkZXByZWNhdGVkLiBVc2UgYGFzc2VydC5cIiArIHJlcGxhY2VtZW50ICtcbiAgICAgICAgXCIoKWAgZnJvbSBgdGhhbGxpdW0vYXNzZXJ0YCBpbnN0ZWFkLlwiXG59XG5cbi8qKlxuICogVGhlIGNvcmUgYXNzZXJ0aW9ucyBleHBvcnQsIGFzIGEgcGx1Z2luLlxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICh0KSB7XG4gICAgbWV0aG9kcy5mb3JFYWNoKGZ1bmN0aW9uIChtKSB7XG4gICAgICAgIHQuZGVmaW5lKG0ubmFtZSwgZGVwcmVjYXRlKGdldEFzc2VydGlvbkRlcHJlY2F0aW9uKG0ubmFtZSksIG0uY2FsbGJhY2spKVxuICAgIH0pXG4gICAgYWxpYXNlcy5mb3JFYWNoKGZ1bmN0aW9uIChhbGlhcykgeyB0W2FsaWFzLm5hbWVdID0gdFthbGlhcy5vcmlnaW5hbF0gfSlcbn1cblxuLy8gTGl0dGxlIGhlbHBlcnMgc28gdGhhdCB0aGVzZSBmdW5jdGlvbnMgb25seSBuZWVkIHRvIGJlIGNyZWF0ZWQgb25jZS5cbmZ1bmN0aW9uIGRlZmluZShuYW1lLCBjYWxsYmFjaykge1xuICAgIGNoZWNrKG5hbWUsIFwibmFtZVwiLCBcInN0cmluZ1wiKVxuICAgIGNoZWNrKGNhbGxiYWNrLCBcImNhbGxiYWNrXCIsIFwiZnVuY3Rpb25cIilcbiAgICBtZXRob2RzLnB1c2goe25hbWU6IG5hbWUsIGNhbGxiYWNrOiBjYWxsYmFja30pXG59XG5cbi8vIE11Y2ggZWFzaWVyIHRvIHR5cGVcbmZ1bmN0aW9uIG5lZ2F0ZShuYW1lKSB7XG4gICAgY2hlY2sobmFtZSwgXCJuYW1lXCIsIFwic3RyaW5nXCIpXG4gICAgcmV0dXJuIFwibm90XCIgKyBuYW1lWzBdLnRvVXBwZXJDYXNlKCkgKyBuYW1lLnNsaWNlKDEpXG59XG5cbi8vIFRoZSBiYXNpYyBhc3NlcnQuIEl0J3MgYWxtb3N0IHRoZXJlIGZvciBsb29rcywgZ2l2ZW4gaG93IGVhc3kgaXQgaXMgdG9cbi8vIGRlZmluZSB5b3VyIG93biBhc3NlcnRpb25zLlxuZnVuY3Rpb24gc2FuaXRpemUobWVzc2FnZSkge1xuICAgIHJldHVybiBtZXNzYWdlID8gU3RyaW5nKG1lc3NhZ2UpLnJlcGxhY2UoLyhcXHtcXHcrXFx9KS9nLCBcIlxcXFwkMVwiKSA6IFwiXCJcbn1cblxuZGVmaW5lKFwiYXNzZXJ0XCIsIGZ1bmN0aW9uICh0ZXN0LCBtZXNzYWdlKSB7XG4gICAgcmV0dXJuIHt0ZXN0OiB0ZXN0LCBtZXNzYWdlOiBzYW5pdGl6ZShtZXNzYWdlKX1cbn0pXG5cbmRlZmluZShcImZhaWxcIiwgZnVuY3Rpb24gKG1lc3NhZ2UpIHtcbiAgICByZXR1cm4ge3Rlc3Q6IGZhbHNlLCBtZXNzYWdlOiBzYW5pdGl6ZShtZXNzYWdlKX1cbn0pXG5cbi8qKlxuICogVGhlc2UgbWFrZXMgbWFueSBvZiB0aGUgY29tbW9uIG9wZXJhdG9ycyBtdWNoIGVhc2llciB0byBkby5cbiAqL1xuZnVuY3Rpb24gdW5hcnkobmFtZSwgZnVuYywgbWVzc2FnZXMpIHtcbiAgICBkZWZpbmUobmFtZSwgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0ZXN0OiBmdW5jKHZhbHVlKSxcbiAgICAgICAgICAgIGFjdHVhbDogdmFsdWUsXG4gICAgICAgICAgICBtZXNzYWdlOiBtZXNzYWdlc1swXSxcbiAgICAgICAgfVxuICAgIH0pXG5cbiAgICBkZWZpbmUobmVnYXRlKG5hbWUpLCBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHRlc3Q6ICFmdW5jKHZhbHVlKSxcbiAgICAgICAgICAgIGFjdHVhbDogdmFsdWUsXG4gICAgICAgICAgICBtZXNzYWdlOiBtZXNzYWdlc1sxXSxcbiAgICAgICAgfVxuICAgIH0pXG59XG5cbmZ1bmN0aW9uIGJpbmFyeShuYW1lLCBmdW5jLCBtZXNzYWdlcykge1xuICAgIGRlZmluZShuYW1lLCBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdGVzdDogZnVuYyhhY3R1YWwsIGV4cGVjdGVkKSxcbiAgICAgICAgICAgIGFjdHVhbDogYWN0dWFsLFxuICAgICAgICAgICAgZXhwZWN0ZWQ6IGV4cGVjdGVkLFxuICAgICAgICAgICAgbWVzc2FnZTogbWVzc2FnZXNbMF0sXG4gICAgICAgIH1cbiAgICB9KVxuXG4gICAgZGVmaW5lKG5lZ2F0ZShuYW1lKSwgZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHRlc3Q6ICFmdW5jKGFjdHVhbCwgZXhwZWN0ZWQpLFxuICAgICAgICAgICAgYWN0dWFsOiBhY3R1YWwsXG4gICAgICAgICAgICBleHBlY3RlZDogZXhwZWN0ZWQsXG4gICAgICAgICAgICBtZXNzYWdlOiBtZXNzYWdlc1sxXSxcbiAgICAgICAgfVxuICAgIH0pXG59XG5cbnVuYXJ5KFwib2tcIiwgZnVuY3Rpb24gKHgpIHsgcmV0dXJuICEheCB9LCBbXG4gICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBiZSBva1wiLFxuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGJlIG9rXCIsXG5dKVxuXG5cImJvb2xlYW4gZnVuY3Rpb24gbnVtYmVyIG9iamVjdCBzdHJpbmcgc3ltYm9sXCIuc3BsaXQoXCIgXCIpXG4uZm9yRWFjaChmdW5jdGlvbiAodHlwZSkge1xuICAgIHZhciBuYW1lID0gKHR5cGVbMF0gPT09IFwib1wiID8gXCJhbiBcIiA6IFwiYSBcIikgKyB0eXBlXG5cbiAgICB1bmFyeSh0eXBlLCBmdW5jdGlvbiAoeCkgeyByZXR1cm4gdHlwZW9mIHggPT09IHR5cGUgfSwgW1xuICAgICAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGJlIFwiICsgbmFtZSxcbiAgICAgICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgYmUgXCIgKyBuYW1lLFxuICAgIF0pXG59KVxuXG47W3RydWUsIGZhbHNlLCBudWxsLCB1bmRlZmluZWRdLmZvckVhY2goZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgdW5hcnkodmFsdWUgKyBcIlwiLCBmdW5jdGlvbiAoeCkgeyByZXR1cm4geCA9PT0gdmFsdWUgfSwgW1xuICAgICAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGJlIFwiICsgdmFsdWUsXG4gICAgICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGJlIFwiICsgdmFsdWUsXG4gICAgXSlcbn0pXG5cbnVuYXJ5KFwiZXhpc3RzXCIsIGZ1bmN0aW9uICh4KSB7IHJldHVybiB4ICE9IG51bGwgfSwgW1xuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gZXhpc3RcIixcbiAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBleGlzdFwiLFxuXSlcblxudW5hcnkoXCJhcnJheVwiLCBBcnJheS5pc0FycmF5LCBbXG4gICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBiZSBhbiBhcnJheVwiLFxuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGJlIGFuIGFycmF5XCIsXG5dKVxuXG5kZWZpbmUoXCJ0eXBlXCIsIGZ1bmN0aW9uIChvYmplY3QsIHR5cGUpIHtcbiAgICBjaGVja1R5cGVPZih0eXBlLCBcInR5cGVcIilcblxuICAgIHJldHVybiB7XG4gICAgICAgIHRlc3Q6IHR5cGVvZiBvYmplY3QgPT09IHR5cGUsXG4gICAgICAgIGV4cGVjdGVkOiB0eXBlLFxuICAgICAgICBhY3R1YWw6IHR5cGVvZiBvYmplY3QsXG4gICAgICAgIG86IG9iamVjdCxcbiAgICAgICAgbWVzc2FnZTogXCJFeHBlY3RlZCB0eXBlb2Yge299IHRvIGJlIHtleHBlY3RlZH0sIGJ1dCBmb3VuZCB7YWN0dWFsfVwiLFxuICAgIH1cbn0pXG5cbmRlZmluZShcIm5vdFR5cGVcIiwgZnVuY3Rpb24gKG9iamVjdCwgdHlwZSkge1xuICAgIGNoZWNrVHlwZU9mKHR5cGUsIFwidHlwZVwiKVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgdGVzdDogdHlwZW9mIG9iamVjdCAhPT0gdHlwZSxcbiAgICAgICAgZXhwZWN0ZWQ6IHR5cGUsXG4gICAgICAgIG86IG9iamVjdCxcbiAgICAgICAgbWVzc2FnZTogXCJFeHBlY3RlZCB0eXBlb2Yge299IHRvIG5vdCBiZSB7ZXhwZWN0ZWR9XCIsXG4gICAgfVxufSlcblxuZGVmaW5lKFwiaW5zdGFuY2VvZlwiLCBmdW5jdGlvbiAob2JqZWN0LCBUeXBlKSB7XG4gICAgY2hlY2soVHlwZSwgXCJUeXBlXCIsIFwiZnVuY3Rpb25cIilcblxuICAgIHJldHVybiB7XG4gICAgICAgIHRlc3Q6IG9iamVjdCBpbnN0YW5jZW9mIFR5cGUsXG4gICAgICAgIGV4cGVjdGVkOiBUeXBlLFxuICAgICAgICBhY3R1YWw6IG9iamVjdC5jb25zdHJ1Y3RvcixcbiAgICAgICAgbzogb2JqZWN0LFxuICAgICAgICBtZXNzYWdlOiBcIkV4cGVjdGVkIHtvfSB0byBiZSBhbiBpbnN0YW5jZSBvZiB7ZXhwZWN0ZWR9LCBidXQgZm91bmQge2FjdHVhbH1cIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtbGVuXG4gICAgfVxufSlcblxuZGVmaW5lKFwibm90SW5zdGFuY2VvZlwiLCBmdW5jdGlvbiAob2JqZWN0LCBUeXBlKSB7XG4gICAgY2hlY2soVHlwZSwgXCJUeXBlXCIsIFwiZnVuY3Rpb25cIilcblxuICAgIHJldHVybiB7XG4gICAgICAgIHRlc3Q6ICEob2JqZWN0IGluc3RhbmNlb2YgVHlwZSksXG4gICAgICAgIGV4cGVjdGVkOiBUeXBlLFxuICAgICAgICBvOiBvYmplY3QsXG4gICAgICAgIG1lc3NhZ2U6IFwiRXhwZWN0ZWQge299IHRvIG5vdCBiZSBhbiBpbnN0YW5jZSBvZiB7ZXhwZWN0ZWR9XCIsXG4gICAgfVxufSlcblxuYmluYXJ5KFwiZXF1YWxcIiwgc3RyaWN0SXMsIFtcbiAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGVxdWFsIHtleHBlY3RlZH1cIixcbiAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBlcXVhbCB7ZXhwZWN0ZWR9XCIsXG5dKVxuXG5iaW5hcnkoXCJlcXVhbExvb3NlXCIsIGxvb3NlSXMsIFtcbiAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGxvb3NlbHkgZXF1YWwge2V4cGVjdGVkfVwiLFxuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGxvb3NlbHkgZXF1YWwge2V4cGVjdGVkfVwiLFxuXSlcblxuZnVuY3Rpb24gY29tcChuYW1lLCBjb21wYXJlLCBtZXNzYWdlKSB7XG4gICAgZGVmaW5lKG5hbWUsIGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gICAgICAgIGNoZWNrKGFjdHVhbCwgXCJhY3R1YWxcIiwgXCJudW1iZXJcIilcbiAgICAgICAgY2hlY2soZXhwZWN0ZWQsIFwiZXhwZWN0ZWRcIiwgXCJudW1iZXJcIilcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdGVzdDogY29tcGFyZShhY3R1YWwsIGV4cGVjdGVkKSxcbiAgICAgICAgICAgIGFjdHVhbDogYWN0dWFsLFxuICAgICAgICAgICAgZXhwZWN0ZWQ6IGV4cGVjdGVkLFxuICAgICAgICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgICAgfVxuICAgIH0pXG59XG5cbi8qIGVzbGludC1kaXNhYmxlIG1heC1sZW4gKi9cblxuY29tcChcImF0TGVhc3RcIiwgZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGEgPj0gYiB9LCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGJlIGF0IGxlYXN0IHtleHBlY3RlZH1cIilcbmNvbXAoXCJhdE1vc3RcIiwgZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGEgPD0gYiB9LCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGJlIGF0IG1vc3Qge2V4cGVjdGVkfVwiKVxuY29tcChcImFib3ZlXCIsIGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBhID4gYiB9LCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGJlIGFib3ZlIHtleHBlY3RlZH1cIilcbmNvbXAoXCJiZWxvd1wiLCBmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYSA8IGIgfSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBiZSBiZWxvdyB7ZXhwZWN0ZWR9XCIpXG5cbmRlZmluZShcImJldHdlZW5cIiwgZnVuY3Rpb24gKGFjdHVhbCwgbG93ZXIsIHVwcGVyKSB7XG4gICAgY2hlY2soYWN0dWFsLCBcImFjdHVhbFwiLCBcIm51bWJlclwiKVxuICAgIGNoZWNrKGxvd2VyLCBcImxvd2VyXCIsIFwibnVtYmVyXCIpXG4gICAgY2hlY2sodXBwZXIsIFwidXBwZXJcIiwgXCJudW1iZXJcIilcblxuICAgIHJldHVybiB7XG4gICAgICAgIHRlc3Q6IGFjdHVhbCA+PSBsb3dlciAmJiBhY3R1YWwgPD0gdXBwZXIsXG4gICAgICAgIGFjdHVhbDogYWN0dWFsLFxuICAgICAgICBsb3dlcjogbG93ZXIsXG4gICAgICAgIHVwcGVyOiB1cHBlcixcbiAgICAgICAgbWVzc2FnZTogXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBiZSBiZXR3ZWVuIHtsb3dlcn0gYW5kIHt1cHBlcn1cIixcbiAgICB9XG59KVxuXG4vKiBlc2xpbnQtZW5hYmxlIG1heC1sZW4gKi9cblxuYmluYXJ5KFwiZGVlcEVxdWFsXCIsIG1hdGNoLnN0cmljdCwgW1xuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gZGVlcGx5IGVxdWFsIHtleHBlY3RlZH1cIixcbiAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBkZWVwbHkgZXF1YWwge2V4cGVjdGVkfVwiLFxuXSlcblxuYmluYXJ5KFwibWF0Y2hcIiwgbWF0Y2gubG9vc2UsIFtcbiAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG1hdGNoIHtleHBlY3RlZH1cIixcbiAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBtYXRjaCB7ZXhwZWN0ZWR9XCIsXG5dKVxuXG5mdW5jdGlvbiBoYXMobmFtZSwgXykgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1sZW4sIG1heC1wYXJhbXNcbiAgICBpZiAoXy5lcXVhbHMgPT09IGxvb3NlSXMpIHtcbiAgICAgICAgZGVmaW5lKG5hbWUsIGZ1bmN0aW9uIChvYmplY3QsIGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdGVzdDogXy5oYXMob2JqZWN0LCBrZXkpICYmIF8uaXMoXy5nZXQob2JqZWN0LCBrZXkpLCB2YWx1ZSksXG4gICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IHZhbHVlLFxuICAgICAgICAgICAgICAgIGFjdHVhbDogb2JqZWN0W2tleV0sXG4gICAgICAgICAgICAgICAga2V5OiBrZXksXG4gICAgICAgICAgICAgICAgb2JqZWN0OiBvYmplY3QsXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogXy5tZXNzYWdlc1swXSxcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcblxuICAgICAgICBkZWZpbmUobmVnYXRlKG5hbWUpLCBmdW5jdGlvbiAob2JqZWN0LCBrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHRlc3Q6ICFfLmhhcyhvYmplY3QsIGtleSkgfHwgIV8uaXMoXy5nZXQob2JqZWN0LCBrZXkpLCB2YWx1ZSksXG4gICAgICAgICAgICAgICAgYWN0dWFsOiB2YWx1ZSxcbiAgICAgICAgICAgICAgICBrZXk6IGtleSxcbiAgICAgICAgICAgICAgICBvYmplY3Q6IG9iamVjdCxcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBfLm1lc3NhZ2VzWzJdLFxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGRlZmluZShuYW1lLCBmdW5jdGlvbiAob2JqZWN0LCBrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICB2YXIgdGVzdCA9IF8uaGFzKG9iamVjdCwga2V5KVxuXG4gICAgICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSAzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgdGVzdDogdGVzdCAmJiBfLmlzKF8uZ2V0KG9iamVjdCwga2V5KSwgdmFsdWUpLFxuICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogdmFsdWUsXG4gICAgICAgICAgICAgICAgICAgIGFjdHVhbDogb2JqZWN0W2tleV0sXG4gICAgICAgICAgICAgICAgICAgIGtleToga2V5LFxuICAgICAgICAgICAgICAgICAgICBvYmplY3Q6IG9iamVjdCxcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogXy5tZXNzYWdlc1swXSxcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIHRlc3Q6IHRlc3QsXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBrZXksXG4gICAgICAgICAgICAgICAgICAgIGFjdHVhbDogb2JqZWN0LFxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBfLm1lc3NhZ2VzWzFdLFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcblxuICAgICAgICBkZWZpbmUobmVnYXRlKG5hbWUpLCBmdW5jdGlvbiAob2JqZWN0LCBrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICB2YXIgdGVzdCA9ICFfLmhhcyhvYmplY3QsIGtleSlcblxuICAgICAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gMykge1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIHRlc3Q6IHRlc3QgfHwgIV8uaXMoXy5nZXQob2JqZWN0LCBrZXkpLCB2YWx1ZSksXG4gICAgICAgICAgICAgICAgICAgIGFjdHVhbDogdmFsdWUsXG4gICAgICAgICAgICAgICAgICAgIGtleToga2V5LFxuICAgICAgICAgICAgICAgICAgICBvYmplY3Q6IG9iamVjdCxcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogXy5tZXNzYWdlc1syXSxcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIHRlc3Q6IHRlc3QsXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBrZXksXG4gICAgICAgICAgICAgICAgICAgIGFjdHVhbDogb2JqZWN0LFxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBfLm1lc3NhZ2VzWzNdLFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGhhc093bktleShvYmplY3QsIGtleSkgeyByZXR1cm4gaGFzT3duLmNhbGwob2JqZWN0LCBrZXkpIH1cbmZ1bmN0aW9uIGhhc0luS2V5KG9iamVjdCwga2V5KSB7IHJldHVybiBrZXkgaW4gb2JqZWN0IH1cbmZ1bmN0aW9uIGhhc0luQ29sbChvYmplY3QsIGtleSkgeyByZXR1cm4gb2JqZWN0LmhhcyhrZXkpIH1cbmZ1bmN0aW9uIGhhc09iamVjdEdldChvYmplY3QsIGtleSkgeyByZXR1cm4gb2JqZWN0W2tleV0gfVxuZnVuY3Rpb24gaGFzQ29sbEdldChvYmplY3QsIGtleSkgeyByZXR1cm4gb2JqZWN0LmdldChrZXkpIH1cblxuaGFzKFwiaGFzT3duXCIsIHtcbiAgICBpczogc3RyaWN0SXMsXG4gICAgaGFzOiBoYXNPd25LZXksXG4gICAgZ2V0OiBoYXNPYmplY3RHZXQsXG4gICAgbWVzc2FnZXM6IFtcbiAgICAgICAgXCJFeHBlY3RlZCB7b2JqZWN0fSB0byBoYXZlIG93biBrZXkge2tleX0gZXF1YWwgdG8ge2V4cGVjdGVkfSwgYnV0IGZvdW5kIHthY3R1YWx9XCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LWxlblxuICAgICAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGhhdmUgb3duIGtleSB7ZXhwZWN0ZWR9XCIsXG4gICAgICAgIFwiRXhwZWN0ZWQge29iamVjdH0gdG8gbm90IGhhdmUgb3duIGtleSB7a2V5fSBlcXVhbCB0byB7YWN0dWFsfVwiLFxuICAgICAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBoYXZlIG93biBrZXkge2V4cGVjdGVkfVwiLFxuICAgIF0sXG59KVxuXG5oYXMoXCJoYXNPd25Mb29zZVwiLCB7XG4gICAgaXM6IGxvb3NlSXMsXG4gICAgaGFzOiBoYXNPd25LZXksXG4gICAgZ2V0OiBoYXNPYmplY3RHZXQsXG4gICAgbWVzc2FnZXM6IFtcbiAgICAgICAgXCJFeHBlY3RlZCB7b2JqZWN0fSB0byBoYXZlIG93biBrZXkge2tleX0gbG9vc2VseSBlcXVhbCB0byB7ZXhwZWN0ZWR9LCBidXQgZm91bmQge2FjdHVhbH1cIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtbGVuXG4gICAgICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gaGF2ZSBvd24ga2V5IHtleHBlY3RlZH1cIixcbiAgICAgICAgXCJFeHBlY3RlZCB7b2JqZWN0fSB0byBub3QgaGF2ZSBvd24ga2V5IHtrZXl9IGxvb3NlbHkgZXF1YWwgdG8ge2FjdHVhbH1cIixcbiAgICAgICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgaGF2ZSBvd24ga2V5IHtleHBlY3RlZH1cIixcbiAgICBdLFxufSlcblxuaGFzKFwiaGFzS2V5XCIsIHtcbiAgICBpczogc3RyaWN0SXMsXG4gICAgaGFzOiBoYXNJbktleSxcbiAgICBnZXQ6IGhhc09iamVjdEdldCxcbiAgICBtZXNzYWdlczogW1xuICAgICAgICBcIkV4cGVjdGVkIHtvYmplY3R9IHRvIGhhdmUga2V5IHtrZXl9IGVxdWFsIHRvIHtleHBlY3RlZH0sIGJ1dCBmb3VuZCB7YWN0dWFsfVwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1sZW5cbiAgICAgICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBoYXZlIGtleSB7ZXhwZWN0ZWR9XCIsXG4gICAgICAgIFwiRXhwZWN0ZWQge29iamVjdH0gdG8gbm90IGhhdmUga2V5IHtrZXl9IGVxdWFsIHRvIHthY3R1YWx9XCIsXG4gICAgICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGhhdmUga2V5IHtleHBlY3RlZH1cIixcbiAgICBdLFxufSlcblxuaGFzKFwiaGFzS2V5TG9vc2VcIiwge1xuICAgIGlzOiBsb29zZUlzLFxuICAgIGhhczogaGFzSW5LZXksXG4gICAgZ2V0OiBoYXNPYmplY3RHZXQsXG4gICAgbWVzc2FnZXM6IFtcbiAgICAgICAgXCJFeHBlY3RlZCB7b2JqZWN0fSB0byBoYXZlIGtleSB7a2V5fSBsb29zZWx5IGVxdWFsIHRvIHtleHBlY3RlZH0sIGJ1dCBmb3VuZCB7YWN0dWFsfVwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1sZW5cbiAgICAgICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBoYXZlIGtleSB7ZXhwZWN0ZWR9XCIsXG4gICAgICAgIFwiRXhwZWN0ZWQge29iamVjdH0gdG8gbm90IGhhdmUga2V5IHtrZXl9IGxvb3NlbHkgZXF1YWwgdG8ge2FjdHVhbH1cIixcbiAgICAgICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgaGF2ZSBrZXkge2V4cGVjdGVkfVwiLFxuICAgIF0sXG59KVxuXG5oYXMoXCJoYXNcIiwge1xuICAgIGlzOiBzdHJpY3RJcyxcbiAgICBoYXM6IGhhc0luQ29sbCxcbiAgICBnZXQ6IGhhc0NvbGxHZXQsXG4gICAgbWVzc2FnZXM6IFtcbiAgICAgICAgXCJFeHBlY3RlZCB7b2JqZWN0fSB0byBoYXZlIGtleSB7a2V5fSBlcXVhbCB0byB7ZXhwZWN0ZWR9LCBidXQgZm91bmQge2FjdHVhbH1cIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtbGVuXG4gICAgICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gaGF2ZSBrZXkge2V4cGVjdGVkfVwiLFxuICAgICAgICBcIkV4cGVjdGVkIHtvYmplY3R9IHRvIG5vdCBoYXZlIGtleSB7a2V5fSBlcXVhbCB0byB7YWN0dWFsfVwiLFxuICAgICAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBoYXZlIGtleSB7ZXhwZWN0ZWR9XCIsXG4gICAgXSxcbn0pXG5cbmhhcyhcImhhc0xvb3NlXCIsIHtcbiAgICBpczogbG9vc2VJcyxcbiAgICBoYXM6IGhhc0luQ29sbCxcbiAgICBnZXQ6IGhhc0NvbGxHZXQsXG4gICAgbWVzc2FnZXM6IFtcbiAgICAgICAgXCJFeHBlY3RlZCB7b2JqZWN0fSB0byBoYXZlIGtleSB7a2V5fSBlcXVhbCB0byB7ZXhwZWN0ZWR9LCBidXQgZm91bmQge2FjdHVhbH1cIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtbGVuXG4gICAgICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gaGF2ZSBrZXkge2V4cGVjdGVkfVwiLFxuICAgICAgICBcIkV4cGVjdGVkIHtvYmplY3R9IHRvIG5vdCBoYXZlIGtleSB7a2V5fSBlcXVhbCB0byB7YWN0dWFsfVwiLFxuICAgICAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBoYXZlIGtleSB7ZXhwZWN0ZWR9XCIsXG4gICAgXSxcbn0pXG5cbmZ1bmN0aW9uIGdldE5hbWUoZnVuYykge1xuICAgIGlmIChmdW5jLm5hbWUgIT0gbnVsbCkgcmV0dXJuIGZ1bmMubmFtZSB8fCBcIjxhbm9ueW1vdXM+XCJcbiAgICBpZiAoZnVuYy5kaXNwbGF5TmFtZSAhPSBudWxsKSByZXR1cm4gZnVuYy5kaXNwbGF5TmFtZSB8fCBcIjxhbm9ueW1vdXM+XCJcbiAgICByZXR1cm4gXCI8YW5vbnltb3VzPlwiXG59XG5cbmZ1bmN0aW9uIHRocm93cyhuYW1lLCBfKSB7XG4gICAgZnVuY3Rpb24gcnVuKGludmVydCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGZ1bmMsIG1hdGNoZXIpIHtcbiAgICAgICAgICAgIGNoZWNrKGZ1bmMsIFwiZnVuY1wiLCBcImZ1bmN0aW9uXCIpXG4gICAgICAgICAgICBfLmNoZWNrKG1hdGNoZXIpXG5cbiAgICAgICAgICAgIHZhciB0ZXN0LCBlcnJvclxuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGZ1bmMoKVxuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIHRlc3QgPSBfLnRlc3QobWF0Y2hlciwgZXJyb3IgPSBlKVxuXG4gICAgICAgICAgICAgICAgLy8gUmV0aHJvdyB1bmtub3duIGVycm9ycyB0aGF0IGRvbid0IG1hdGNoIHdoZW4gYSBtYXRjaGVyIHdhc1xuICAgICAgICAgICAgICAgIC8vIHBhc3NlZCAtIGl0J3MgZWFzaWVyIHRvIGRlYnVnIHVuZXhwZWN0ZWQgZXJyb3JzIHdoZW4geW91IGhhdmVcbiAgICAgICAgICAgICAgICAvLyBhIHN0YWNrIHRyYWNlLiBEb24ndCByZXRocm93IG5vbi1lcnJvcnMsIHRob3VnaC5cbiAgICAgICAgICAgICAgICBpZiAoXy5yZXRocm93KG1hdGNoZXIsIGludmVydCwgdGVzdCwgZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0ZXN0OiAhIXRlc3QgXiBpbnZlcnQsXG4gICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IG1hdGNoZXIsXG4gICAgICAgICAgICAgICAgZXJyb3I6IGVycm9yLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IF8ubWVzc2FnZShtYXRjaGVyLCBpbnZlcnQsIHRlc3QpLFxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZGVmaW5lKG5hbWUsIHJ1bihmYWxzZSkpXG4gICAgZGVmaW5lKG5lZ2F0ZShuYW1lKSwgcnVuKHRydWUpKVxufVxuXG50aHJvd3MoXCJ0aHJvd3NcIiwge1xuICAgIHRlc3Q6IGZ1bmN0aW9uIChUeXBlLCBlKSB7IHJldHVybiBUeXBlID09IG51bGwgfHwgZSBpbnN0YW5jZW9mIFR5cGUgfSxcbiAgICBjaGVjazogZnVuY3Rpb24gKFR5cGUpIHsgY2hlY2soVHlwZSwgXCJUeXBlXCIsIFtcIm5vbmVcIiwgXCJmdW5jdGlvblwiXSkgfSxcblxuICAgIHJldGhyb3c6IGZ1bmN0aW9uIChtYXRjaGVyLCBpbnZlcnQsIHRlc3QsIGUpIHtcbiAgICAgICAgcmV0dXJuIG1hdGNoZXIgIT0gbnVsbCAmJiAhaW52ZXJ0ICYmICF0ZXN0ICYmIGUgaW5zdGFuY2VvZiBFcnJvclxuICAgIH0sXG5cbiAgICBtZXNzYWdlOiBmdW5jdGlvbiAoVHlwZSwgaW52ZXJ0LCB0ZXN0KSB7XG4gICAgICAgIHZhciBzdHIgPSBcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIFwiXG5cbiAgICAgICAgaWYgKGludmVydCkgc3RyICs9IFwibm90IFwiXG4gICAgICAgIHN0ciArPSBcInRocm93XCJcblxuICAgICAgICBpZiAoVHlwZSAhPSBudWxsKSB7XG4gICAgICAgICAgICBzdHIgKz0gXCIgYW4gaW5zdGFuY2Ugb2YgXCIgKyBnZXROYW1lKFR5cGUpXG4gICAgICAgICAgICBpZiAoIWludmVydCAmJiB0ZXN0ID09PSBmYWxzZSkgc3RyICs9IFwiLCBidXQgZm91bmQge2Vycm9yfVwiXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc3RyXG4gICAgfSxcbn0pXG5cbnRocm93cyhcInRocm93c01hdGNoXCIsIHtcbiAgICB0ZXN0OiBmdW5jdGlvbiAobWF0Y2hlciwgZSkge1xuICAgICAgICBpZiAodHlwZW9mIG1hdGNoZXIgPT09IFwic3RyaW5nXCIpIHJldHVybiBlLm1lc3NhZ2UgPT09IG1hdGNoZXJcbiAgICAgICAgaWYgKHR5cGVvZiBtYXRjaGVyID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiAhIW1hdGNoZXIoZSlcbiAgICAgICAgcmV0dXJuIG1hdGNoZXIudGVzdChlLm1lc3NhZ2UpXG4gICAgfSxcblxuICAgIGNoZWNrOiBmdW5jdGlvbiAobWF0Y2hlcikge1xuICAgICAgICAvLyBOb3QgYWNjZXB0aW5nIG9iamVjdHMgeWV0LlxuICAgICAgICBjaGVjayhtYXRjaGVyLCBcIm1hdGNoZXJcIiwgW1wic3RyaW5nXCIsIFwicmVnZXhwXCIsIFwiZnVuY3Rpb25cIl0pXG4gICAgfSxcblxuICAgIHJldGhyb3c6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIGZhbHNlIH0sXG5cbiAgICBtZXNzYWdlOiBmdW5jdGlvbiAoXywgaW52ZXJ0LCB0ZXN0KSB7XG4gICAgICAgIGlmIChpbnZlcnQpIHtcbiAgICAgICAgICAgIHJldHVybiBcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIG5vdCB0aHJvdyBhbiBlcnJvciB0aGF0IG1hdGNoZXMge2V4cGVjdGVkfVwiIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LWxlblxuICAgICAgICB9IGVsc2UgaWYgKHRlc3QgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIFwiRXhwZWN0ZWQgY2FsbGJhY2sgdG8gdGhyb3cgYW4gZXJyb3IgdGhhdCBtYXRjaGVzIHtleHBlY3RlZH0sIGJ1dCBmb3VuZCBubyBlcnJvclwiIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LWxlblxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIFwiRXhwZWN0ZWQgY2FsbGJhY2sgdG8gdGhyb3cgYW4gZXJyb3IgdGhhdCBtYXRjaGVzIHtleHBlY3RlZH0sIGJ1dCBmb3VuZCB7ZXJyb3J9XCIgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtbGVuXG4gICAgICAgIH1cbiAgICB9LFxufSlcblxuZnVuY3Rpb24gbGVuKG5hbWUsIGNvbXBhcmUsIG1lc3NhZ2UpIHtcbiAgICBkZWZpbmUobmFtZSwgZnVuY3Rpb24gKG9iamVjdCwgbGVuZ3RoKSB7XG4gICAgICAgIGNoZWNrKG9iamVjdCwgXCJvYmplY3RcIiwgXCJvYmplY3RcIilcbiAgICAgICAgY2hlY2sobGVuZ3RoLCBcImxlbmd0aFwiLCBcIm51bWJlclwiKVxuXG4gICAgICAgIHZhciBsZW4gPSBvYmplY3QubGVuZ3RoXG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHRlc3Q6IGxlbiAhPSBudWxsICYmIGNvbXBhcmUobGVuLCArbGVuZ3RoKSxcbiAgICAgICAgICAgIGV4cGVjdGVkOiBsZW5ndGgsXG4gICAgICAgICAgICBhY3R1YWw6IGxlbixcbiAgICAgICAgICAgIG9iamVjdDogb2JqZWN0LFxuICAgICAgICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgICAgfVxuICAgIH0pXG59XG5cbi8qIGVzbGludC1kaXNhYmxlIG1heC1sZW4gKi9cblxuLy8gTm90ZTogdGhlc2UgYWx3YXlzIGZhaWwgd2l0aCBOYU5zLlxubGVuKFwibGVuZ3RoXCIsIGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBhID09PSBiIH0sIFwiRXhwZWN0ZWQge29iamVjdH0gdG8gaGF2ZSBsZW5ndGgge2V4cGVjdGVkfSwgYnV0IGZvdW5kIHthY3R1YWx9XCIpXG5sZW4oXCJub3RMZW5ndGhcIiwgZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGEgIT09IGIgfSwgXCJFeHBlY3RlZCB7b2JqZWN0fSB0byBub3QgaGF2ZSBsZW5ndGgge2FjdHVhbH1cIilcbmxlbihcImxlbmd0aEF0TGVhc3RcIiwgZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGEgPj0gYiB9LCBcIkV4cGVjdGVkIHtvYmplY3R9IHRvIGhhdmUgbGVuZ3RoIGF0IGxlYXN0IHtleHBlY3RlZH0sIGJ1dCBmb3VuZCB7YWN0dWFsfVwiKVxubGVuKFwibGVuZ3RoQXRNb3N0XCIsIGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBhIDw9IGIgfSwgXCJFeHBlY3RlZCB7b2JqZWN0fSB0byBoYXZlIGxlbmd0aCBhdCBtb3N0IHtleHBlY3RlZH0sIGJ1dCBmb3VuZCB7YWN0dWFsfVwiKVxubGVuKFwibGVuZ3RoQWJvdmVcIiwgZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGEgPiBiIH0sIFwiRXhwZWN0ZWQge29iamVjdH0gdG8gaGF2ZSBsZW5ndGggYWJvdmUge2V4cGVjdGVkfSwgYnV0IGZvdW5kIHthY3R1YWx9XCIpXG5sZW4oXCJsZW5ndGhCZWxvd1wiLCBmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYSA8IGIgfSwgXCJFeHBlY3RlZCB7b2JqZWN0fSB0byBoYXZlIGxlbmd0aCBiZWxvdyB7ZXhwZWN0ZWR9LCBidXQgZm91bmQge2FjdHVhbH1cIilcblxuLyogZXNsaW50LWVuYWJsZSBtYXgtbGVuICovXG5cbi8vIE5vdGU6IHRoZXNlIHR3byBhbHdheXMgZmFpbCB3aGVuIGRlYWxpbmcgd2l0aCBOYU5zLlxuZGVmaW5lKFwiY2xvc2VUb1wiLCBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCwgZGVsdGEpIHtcbiAgICBjaGVjayhhY3R1YWwsIFwiYWN0dWFsXCIsIFwibnVtYmVyXCIpXG4gICAgY2hlY2soZXhwZWN0ZWQsIFwiZXhwZWN0ZWRcIiwgXCJudW1iZXJcIilcbiAgICBjaGVjayhkZWx0YSwgXCJkZWx0YVwiLCBcIm51bWJlclwiKVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgdGVzdDogTWF0aC5hYnMoYWN0dWFsIC0gZXhwZWN0ZWQpIDw9IE1hdGguYWJzKGRlbHRhKSxcbiAgICAgICAgYWN0dWFsOiBhY3R1YWwsXG4gICAgICAgIGV4cGVjdGVkOiBleHBlY3RlZCxcbiAgICAgICAgZGVsdGE6IGRlbHRhLFxuICAgICAgICBtZXNzYWdlOiBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGJlIHdpdGhpbiB7ZGVsdGF9IG9mIHtleHBlY3RlZH1cIixcbiAgICB9XG59KVxuXG5kZWZpbmUoXCJub3RDbG9zZVRvXCIsIGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkLCBkZWx0YSkge1xuICAgIGNoZWNrKGFjdHVhbCwgXCJhY3R1YWxcIiwgXCJudW1iZXJcIilcbiAgICBjaGVjayhleHBlY3RlZCwgXCJleHBlY3RlZFwiLCBcIm51bWJlclwiKVxuICAgIGNoZWNrKGRlbHRhLCBcImRlbHRhXCIsIFwibnVtYmVyXCIpXG5cbiAgICByZXR1cm4ge1xuICAgICAgICB0ZXN0OiBNYXRoLmFicyhhY3R1YWwgLSBleHBlY3RlZCkgPiBNYXRoLmFicyhkZWx0YSksXG4gICAgICAgIGFjdHVhbDogYWN0dWFsLFxuICAgICAgICBleHBlY3RlZDogZXhwZWN0ZWQsXG4gICAgICAgIGRlbHRhOiBkZWx0YSxcbiAgICAgICAgbWVzc2FnZTogXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgYmUgd2l0aGluIHtkZWx0YX0gb2Yge2V4cGVjdGVkfVwiLFxuICAgIH1cbn0pXG5cbi8qIGVzbGludC1kaXNhYmxlIG1heC1sZW4gKi9cblxuLyoqXG4gKiBUaGVyZSdzIDQgc2V0cyBvZiA0IHBlcm11dGF0aW9ucyBoZXJlIGZvciBgaW5jbHVkZXNgIGFuZCBgaGFzS2V5c2AsIGluc3RlYWRcbiAqIG9mIE4gc2V0cyBvZiAyICh3aGljaCB3b3VsZCBmaXQgdGhlIGBmb29gL2Bub3RGb29gIGlkaW9tIGJldHRlciksIHNvIGl0J3NcbiAqIGVhc2llciB0byBqdXN0IG1ha2UgYSBjb3VwbGUgc2VwYXJhdGUgRFNMcyBhbmQgdXNlIHRoYXQgdG8gZGVmaW5lIGV2ZXJ5dGhpbmcuXG4gKlxuICogSGVyZSdzIHRoZSB0b3AgbGV2ZWw6XG4gKlxuICogLSBzdHJpY3Qgc2hhbGxvd1xuICogLSBsb29zZSBzaGFsbG93XG4gKiAtIHN0cmljdCBkZWVwXG4gKiAtIHN0cnVjdHVyYWwgZGVlcFxuICpcbiAqIEFuZCB0aGUgc2Vjb25kIGxldmVsOlxuICpcbiAqIC0gaW5jbHVkZXMgYWxsL25vdCBtaXNzaW5nIHNvbWVcbiAqIC0gaW5jbHVkZXMgc29tZS9ub3QgbWlzc2luZyBhbGxcbiAqIC0gbm90IGluY2x1ZGluZyBhbGwvbWlzc2luZyBzb21lXG4gKiAtIG5vdCBpbmNsdWRpbmcgc29tZS9taXNzaW5nIGFsbFxuICpcbiAqIEhlcmUncyBhbiBleGFtcGxlIHVzaW5nIHRoZSBuYW1pbmcgc2NoZW1lIGZvciBgaGFzS2V5c2AsIGV0Yy5cbiAqXG4gKiAgICAgICAgICAgICAgIHwgc3RyaWN0IHNoYWxsb3cgIHwgICAgbG9vc2Ugc2hhbGxvdyAgICAgfCAgICAgc3RyaWN0IGRlZXAgICAgIHwgICAgIHN0cnVjdHVyYWwgZGVlcFxuICogLS0tLS0tLS0tLS0tLS18LS0tLS0tLS0tLS0tLS0tLS18LS0tLS0tLS0tLS0tLS0tLS0tLS0tLXwtLS0tLS0tLS0tLS0tLS0tLS0tLS18LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICogaW5jbHVkZXMgYWxsICB8IGBoYXNLZXlzYCAgICAgICB8IGBoYXNMb29zZUtleXNgICAgICAgIHwgYGhhc0RlZXBLZXlzYCAgICAgICB8IGBoYXNNYXRjaEtleXNgXG4gKiBpbmNsdWRlcyBzb21lIHwgYGhhc0FueUtleXNgICAgIHwgYGhhc0xvb3NlQW55S2V5c2AgICAgfCBgaGFzRGVlcEFueUtleXNgICAgIHwgYGhhc01hdGNoQW55S2V5c2BcbiAqIG1pc3Npbmcgc29tZSAgfCBgbm90SGFzQWxsS2V5c2AgfCBgbm90SGFzTG9vc2VBbGxLZXlzYCB8IGBub3RIYXNEZWVwQWxsS2V5c2AgfCBgbm90SGFzTWF0Y2hBbGxLZXlzYFxuICogbWlzc2luZyBhbGwgICB8IGBub3RIYXNLZXlzYCAgICB8IGBub3RIYXNMb29zZUtleXNgICAgIHwgYG5vdEhhc0RlZXBLZXlzYCAgICB8IGBub3RIYXNNYXRjaEtleXNgXG4gKlxuICogTm90ZSB0aGF0IHRoZSBgaGFzS2V5c2Agc2hhbGxvdyBjb21wYXJpc29uIHZhcmlhbnRzIGFyZSBhbHNvIG92ZXJsb2FkZWQgdG9cbiAqIGNvbnN1bWUgZWl0aGVyIGFuIGFycmF5IChpbiB3aGljaCBpdCBzaW1wbHkgY2hlY2tzIGFnYWluc3QgYSBsaXN0IG9mIGtleXMpIG9yXG4gKiBhbiBvYmplY3QgKHdoZXJlIGl0IGRvZXMgYSBmdWxsIGRlZXAgY29tcGFyaXNvbikuXG4gKi9cblxuLyogZXNsaW50LWVuYWJsZSBtYXgtbGVuICovXG5cbmZ1bmN0aW9uIG1ha2VJbmNsdWRlcyhhbGwsIGZ1bmMpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGFycmF5LCBrZXlzKSB7XG4gICAgICAgIGZ1bmN0aW9uIHRlc3Qoa2V5KSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKGZ1bmMoa2V5LCBhcnJheVtpXSkpIHJldHVybiB0cnVlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChhbGwpIHtcbiAgICAgICAgICAgIGlmIChhcnJheS5sZW5ndGggPCBrZXlzLmxlbmd0aCkgcmV0dXJuIGZhbHNlXG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmICghdGVzdChrZXlzW2ldKSkgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBrZXlzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRlc3Qoa2V5c1tqXSkpIHJldHVybiB0cnVlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gZGVmaW5lSW5jbHVkZXMobmFtZSwgZnVuYywgaW52ZXJ0LCBtZXNzYWdlKSB7XG4gICAgZnVuY3Rpb24gYmFzZShhcnJheSwgdmFsdWVzKSB7XG4gICAgICAgIC8vIENoZWFwIGNhc2VzIGZpcnN0XG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheShhcnJheSkpIHJldHVybiBmYWxzZVxuICAgICAgICBpZiAoYXJyYXkgPT09IHZhbHVlcykgcmV0dXJuIHRydWVcbiAgICAgICAgcmV0dXJuIGZ1bmMoYXJyYXksIHZhbHVlcylcbiAgICB9XG5cbiAgICBkZWZpbmUobmFtZSwgZnVuY3Rpb24gKGFycmF5LCB2YWx1ZXMpIHtcbiAgICAgICAgY2hlY2soYXJyYXksIFwiYXJyYXlcIiwgXCJhcnJheVwiKVxuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkodmFsdWVzKSkgdmFsdWVzID0gW3ZhbHVlc11cblxuICAgICAgICAvLyBleGNsdXNpdmUgb3IgdG8gaW52ZXJ0IHRoZSByZXN1bHQgaWYgYGludmVydGAgaXMgdHJ1ZVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdGVzdDogIXZhbHVlcy5sZW5ndGggfHwgaW52ZXJ0IF4gYmFzZShhcnJheSwgdmFsdWVzKSxcbiAgICAgICAgICAgIGFjdHVhbDogYXJyYXksXG4gICAgICAgICAgICB2YWx1ZXM6IHZhbHVlcyxcbiAgICAgICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgICAgIH1cbiAgICB9KVxufVxuXG52YXIgaW5jbHVkZXNBbGwgPSBtYWtlSW5jbHVkZXModHJ1ZSwgc3RyaWN0SXMpXG52YXIgaW5jbHVkZXNBbnkgPSBtYWtlSW5jbHVkZXMoZmFsc2UsIHN0cmljdElzKVxuXG4vKiBlc2xpbnQtZGlzYWJsZSBtYXgtbGVuICovXG5cbmRlZmluZUluY2x1ZGVzKFwiaW5jbHVkZXNcIiwgaW5jbHVkZXNBbGwsIGZhbHNlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGhhdmUgYWxsIHZhbHVlcyBpbiB7dmFsdWVzfVwiKVxuZGVmaW5lSW5jbHVkZXMoXCJub3RJbmNsdWRlc0FsbFwiLCBpbmNsdWRlc0FsbCwgdHJ1ZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgaGF2ZSBhbGwgdmFsdWVzIGluIHt2YWx1ZXN9XCIpXG5kZWZpbmVJbmNsdWRlcyhcImluY2x1ZGVzQW55XCIsIGluY2x1ZGVzQW55LCBmYWxzZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBoYXZlIGFueSB2YWx1ZSBpbiB7dmFsdWVzfVwiKVxuZGVmaW5lSW5jbHVkZXMoXCJub3RJbmNsdWRlc1wiLCBpbmNsdWRlc0FueSwgdHJ1ZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgaGF2ZSBhbnkgdmFsdWUgaW4ge3ZhbHVlc31cIilcblxudmFyIGluY2x1ZGVzTG9vc2VBbGwgPSBtYWtlSW5jbHVkZXModHJ1ZSwgbG9vc2VJcylcbnZhciBpbmNsdWRlc0xvb3NlQW55ID0gbWFrZUluY2x1ZGVzKGZhbHNlLCBsb29zZUlzKVxuXG5kZWZpbmVJbmNsdWRlcyhcImluY2x1ZGVzTG9vc2VcIiwgaW5jbHVkZXNMb29zZUFsbCwgZmFsc2UsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbG9vc2VseSBoYXZlIGFsbCB2YWx1ZXMgaW4ge3ZhbHVlc31cIilcbmRlZmluZUluY2x1ZGVzKFwibm90SW5jbHVkZXNMb29zZUFsbFwiLCBpbmNsdWRlc0xvb3NlQWxsLCB0cnVlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBsb29zZWx5IGhhdmUgYWxsIHZhbHVlcyBpbiB7dmFsdWVzfVwiKVxuZGVmaW5lSW5jbHVkZXMoXCJpbmNsdWRlc0xvb3NlQW55XCIsIGluY2x1ZGVzTG9vc2VBbnksIGZhbHNlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGxvb3NlbHkgaGF2ZSBhbnkgdmFsdWUgaW4ge3ZhbHVlc31cIilcbmRlZmluZUluY2x1ZGVzKFwibm90SW5jbHVkZXNMb29zZVwiLCBpbmNsdWRlc0xvb3NlQW55LCB0cnVlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBsb29zZWx5IGhhdmUgYW55IHZhbHVlIGluIHt2YWx1ZXN9XCIpXG5cbnZhciBpbmNsdWRlc0RlZXBBbGwgPSBtYWtlSW5jbHVkZXModHJ1ZSwgbWF0Y2guc3RyaWN0KVxudmFyIGluY2x1ZGVzRGVlcEFueSA9IG1ha2VJbmNsdWRlcyhmYWxzZSwgbWF0Y2guc3RyaWN0KVxuXG5kZWZpbmVJbmNsdWRlcyhcImluY2x1ZGVzRGVlcFwiLCBpbmNsdWRlc0RlZXBBbGwsIGZhbHNlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG1hdGNoIGFsbCB2YWx1ZXMgaW4ge3ZhbHVlc31cIilcbmRlZmluZUluY2x1ZGVzKFwibm90SW5jbHVkZXNEZWVwQWxsXCIsIGluY2x1ZGVzRGVlcEFsbCwgdHJ1ZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgbWF0Y2ggYWxsIHZhbHVlcyBpbiB7dmFsdWVzfVwiKVxuZGVmaW5lSW5jbHVkZXMoXCJpbmNsdWRlc0RlZXBBbnlcIiwgaW5jbHVkZXNEZWVwQW55LCBmYWxzZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBtYXRjaCBhbnkgdmFsdWUgaW4ge3ZhbHVlc31cIilcbmRlZmluZUluY2x1ZGVzKFwibm90SW5jbHVkZXNEZWVwXCIsIGluY2x1ZGVzRGVlcEFueSwgdHJ1ZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgbWF0Y2ggYW55IHZhbHVlIGluIHt2YWx1ZXN9XCIpXG5cbnZhciBpbmNsdWRlc01hdGNoQWxsID0gbWFrZUluY2x1ZGVzKHRydWUsIG1hdGNoLmxvb3NlKVxudmFyIGluY2x1ZGVzTWF0Y2hBbnkgPSBtYWtlSW5jbHVkZXMoZmFsc2UsIG1hdGNoLmxvb3NlKVxuXG5kZWZpbmVJbmNsdWRlcyhcImluY2x1ZGVzTWF0Y2hcIiwgaW5jbHVkZXNNYXRjaEFsbCwgZmFsc2UsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbWF0Y2ggYWxsIHZhbHVlcyBpbiB7dmFsdWVzfVwiKVxuZGVmaW5lSW5jbHVkZXMoXCJub3RJbmNsdWRlc01hdGNoQWxsXCIsIGluY2x1ZGVzTWF0Y2hBbGwsIHRydWUsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IG1hdGNoIGFsbCB2YWx1ZXMgaW4ge3ZhbHVlc31cIilcbmRlZmluZUluY2x1ZGVzKFwiaW5jbHVkZXNNYXRjaEFueVwiLCBpbmNsdWRlc01hdGNoQW55LCBmYWxzZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBtYXRjaCBhbnkgdmFsdWUgaW4ge3ZhbHVlc31cIilcbmRlZmluZUluY2x1ZGVzKFwibm90SW5jbHVkZXNNYXRjaFwiLCBpbmNsdWRlc01hdGNoQW55LCB0cnVlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBtYXRjaCBhbnkgdmFsdWUgaW4ge3ZhbHVlc31cIilcblxuLyogZXNsaW50LWVuYWJsZSBtYXgtbGVuICovXG5cbmZ1bmN0aW9uIGlzRW1wdHkob2JqZWN0KSB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkob2JqZWN0KSkgcmV0dXJuIG9iamVjdC5sZW5ndGggPT09IDBcbiAgICBpZiAodHlwZW9mIG9iamVjdCAhPT0gXCJvYmplY3RcIiB8fCBvYmplY3QgPT09IG51bGwpIHJldHVybiB0cnVlXG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKG9iamVjdCkubGVuZ3RoID09PSAwXG59XG5cbmZ1bmN0aW9uIG1ha2VIYXNPdmVybG9hZChuYW1lLCBtZXRob2RzLCBpbnZlcnQsIG1lc3NhZ2UpIHtcbiAgICBmdW5jdGlvbiBiYXNlKG9iamVjdCwga2V5cykge1xuICAgICAgICAvLyBDaGVhcCBjYXNlIGZpcnN0XG4gICAgICAgIGlmIChvYmplY3QgPT09IGtleXMpIHJldHVybiB0cnVlXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGtleXMpKSByZXR1cm4gbWV0aG9kcy5hcnJheShvYmplY3QsIGtleXMpXG4gICAgICAgIHJldHVybiBtZXRob2RzLm9iamVjdChvYmplY3QsIGtleXMpXG4gICAgfVxuXG4gICAgZGVmaW5lKG5hbWUsIGZ1bmN0aW9uIChvYmplY3QsIGtleXMpIHtcbiAgICAgICAgY2hlY2sob2JqZWN0LCBcIm9iamVjdFwiLCBcIm9iamVjdFwiKVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLy8gZXhjbHVzaXZlIG9yIHRvIGludmVydCB0aGUgcmVzdWx0IGlmIGBpbnZlcnRgIGlzIHRydWVcbiAgICAgICAgICAgIHRlc3Q6IGlzRW1wdHkoa2V5cykgfHwgaW52ZXJ0IF4gYmFzZShvYmplY3QsIGtleXMpLFxuICAgICAgICAgICAgYWN0dWFsOiBvYmplY3QsXG4gICAgICAgICAgICBrZXlzOiBrZXlzLFxuICAgICAgICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgICAgfVxuICAgIH0pXG59XG5cbmZ1bmN0aW9uIG1ha2VIYXNLZXlzKG5hbWUsIGZ1bmMsIGludmVydCwgbWVzc2FnZSkge1xuICAgIGZ1bmN0aW9uIGJhc2Uob2JqZWN0LCBrZXlzKSB7XG4gICAgICAgIHJldHVybiBvYmplY3QgPT09IGtleXMgfHwgZnVuYyhvYmplY3QsIGtleXMpXG4gICAgfVxuXG4gICAgZGVmaW5lKG5hbWUsIGZ1bmN0aW9uIChvYmplY3QsIGtleXMpIHtcbiAgICAgICAgY2hlY2sob2JqZWN0LCBcIm9iamVjdFwiLCBcIm9iamVjdFwiKVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLy8gZXhjbHVzaXZlIG9yIHRvIGludmVydCB0aGUgcmVzdWx0IGlmIGBpbnZlcnRgIGlzIHRydWVcbiAgICAgICAgICAgIHRlc3Q6IGlzRW1wdHkoa2V5cykgfHwgaW52ZXJ0IF4gYmFzZShvYmplY3QsIGtleXMpLFxuICAgICAgICAgICAgYWN0dWFsOiBvYmplY3QsXG4gICAgICAgICAgICBrZXlzOiBrZXlzLFxuICAgICAgICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgICAgfVxuICAgIH0pXG59XG5cbmZ1bmN0aW9uIGhhc0tleXNUeXBlKGFsbCwgZnVuYykge1xuICAgIHJldHVybiBmdW5jdGlvbiAob2JqZWN0LCBrZXlzKSB7XG4gICAgICAgIGlmICh0eXBlb2Yga2V5cyAhPT0gXCJvYmplY3RcIikgcmV0dXJuIHRydWVcbiAgICAgICAgaWYgKGtleXMgPT09IG51bGwpIHJldHVybiB0cnVlXG5cbiAgICAgICAgZnVuY3Rpb24gY2hlY2soa2V5KSB7XG4gICAgICAgICAgICByZXR1cm4gaGFzT3duLmNhbGwob2JqZWN0LCBrZXkpICYmIGZ1bmMoa2V5c1trZXldLCBvYmplY3Rba2V5XSlcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChhbGwpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGtleTEgaW4ga2V5cykge1xuICAgICAgICAgICAgICAgIGlmIChoYXNPd24uY2FsbChrZXlzLCBrZXkxKSAmJiAhY2hlY2soa2V5MSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZvciAodmFyIGtleTIgaW4ga2V5cykge1xuICAgICAgICAgICAgICAgIGlmIChoYXNPd24uY2FsbChrZXlzLCBrZXkyKSAmJiBjaGVjayhrZXkyKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBoYXNPdmVybG9hZFR5cGUoYWxsLCBmdW5jKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgb2JqZWN0OiBoYXNLZXlzVHlwZShhbGwsIGZ1bmMpLFxuICAgICAgICBhcnJheTogZnVuY3Rpb24gKG9iamVjdCwga2V5cykge1xuICAgICAgICAgICAgaWYgKGFsbCkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWhhc093bi5jYWxsKG9iamVjdCwga2V5c1tpXSkpIHJldHVybiBmYWxzZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGtleXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGhhc093bi5jYWxsKG9iamVjdCwga2V5c1tqXSkpIHJldHVybiB0cnVlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgIH1cbn1cblxuLyogZXNsaW50LWRpc2FibGUgbWF4LWxlbiAqL1xuXG52YXIgaGFzQWxsS2V5cyA9IGhhc092ZXJsb2FkVHlwZSh0cnVlLCBzdHJpY3RJcylcbnZhciBoYXNBbnlLZXlzID0gaGFzT3ZlcmxvYWRUeXBlKGZhbHNlLCBzdHJpY3RJcylcblxubWFrZUhhc092ZXJsb2FkKFwiaGFzS2V5c1wiLCBoYXNBbGxLZXlzLCBmYWxzZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBoYXZlIGFsbCBrZXlzIGluIHtrZXlzfVwiKVxubWFrZUhhc092ZXJsb2FkKFwibm90SGFzQWxsS2V5c1wiLCBoYXNBbGxLZXlzLCB0cnVlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBoYXZlIGFsbCBrZXlzIGluIHtrZXlzfVwiKVxubWFrZUhhc092ZXJsb2FkKFwiaGFzQW55S2V5c1wiLCBoYXNBbnlLZXlzLCBmYWxzZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBoYXZlIGFueSBrZXkgaW4ge2tleXN9XCIpXG5tYWtlSGFzT3ZlcmxvYWQoXCJub3RIYXNLZXlzXCIsIGhhc0FueUtleXMsIHRydWUsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGhhdmUgYW55IGtleSBpbiB7a2V5c31cIilcblxudmFyIGhhc0xvb3NlQWxsS2V5cyA9IGhhc092ZXJsb2FkVHlwZSh0cnVlLCBsb29zZUlzKVxudmFyIGhhc0xvb3NlQW55S2V5cyA9IGhhc092ZXJsb2FkVHlwZShmYWxzZSwgbG9vc2VJcylcblxubWFrZUhhc092ZXJsb2FkKFwiaGFzTG9vc2VLZXlzXCIsIGhhc0xvb3NlQWxsS2V5cywgZmFsc2UsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbG9vc2VseSBoYXZlIGFsbCBrZXlzIGluIHtrZXlzfVwiKVxubWFrZUhhc092ZXJsb2FkKFwibm90SGFzTG9vc2VBbGxLZXlzXCIsIGhhc0xvb3NlQWxsS2V5cywgdHJ1ZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgbG9vc2VseSBoYXZlIGFsbCBrZXlzIGluIHtrZXlzfVwiKVxubWFrZUhhc092ZXJsb2FkKFwiaGFzTG9vc2VBbnlLZXlzXCIsIGhhc0xvb3NlQW55S2V5cywgZmFsc2UsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbG9vc2VseSBoYXZlIGFueSBrZXkgaW4ge2tleXN9XCIpXG5tYWtlSGFzT3ZlcmxvYWQoXCJub3RIYXNMb29zZUtleXNcIiwgaGFzTG9vc2VBbnlLZXlzLCB0cnVlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBsb29zZWx5IGhhdmUgYW55IGtleSBpbiB7a2V5c31cIilcblxudmFyIGhhc0RlZXBBbGxLZXlzID0gaGFzS2V5c1R5cGUodHJ1ZSwgbWF0Y2guc3RyaWN0KVxudmFyIGhhc0RlZXBBbnlLZXlzID0gaGFzS2V5c1R5cGUoZmFsc2UsIG1hdGNoLnN0cmljdClcblxubWFrZUhhc0tleXMoXCJoYXNEZWVwS2V5c1wiLCBoYXNEZWVwQWxsS2V5cywgZmFsc2UsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gaGF2ZSBhbGwga2V5cyBpbiB7a2V5c31cIilcbm1ha2VIYXNLZXlzKFwibm90SGFzRGVlcEFsbEtleXNcIiwgaGFzRGVlcEFsbEtleXMsIHRydWUsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGhhdmUgYWxsIGtleXMgaW4ge2tleXN9XCIpXG5tYWtlSGFzS2V5cyhcImhhc0RlZXBBbnlLZXlzXCIsIGhhc0RlZXBBbnlLZXlzLCBmYWxzZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBoYXZlIGFueSBrZXkgaW4ge2tleXN9XCIpXG5tYWtlSGFzS2V5cyhcIm5vdEhhc0RlZXBLZXlzXCIsIGhhc0RlZXBBbnlLZXlzLCB0cnVlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBoYXZlIGFueSBrZXkgaW4ge2tleXN9XCIpXG5cbnZhciBoYXNNYXRjaEFsbEtleXMgPSBoYXNLZXlzVHlwZSh0cnVlLCBtYXRjaC5sb29zZSlcbnZhciBoYXNNYXRjaEFueUtleXMgPSBoYXNLZXlzVHlwZShmYWxzZSwgbWF0Y2gubG9vc2UpXG5cbm1ha2VIYXNLZXlzKFwiaGFzTWF0Y2hLZXlzXCIsIGhhc01hdGNoQWxsS2V5cywgZmFsc2UsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbWF0Y2ggYWxsIGtleXMgaW4ge2tleXN9XCIpXG5tYWtlSGFzS2V5cyhcIm5vdEhhc01hdGNoQWxsS2V5c1wiLCBoYXNNYXRjaEFsbEtleXMsIHRydWUsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IG1hdGNoIGFsbCBrZXlzIGluIHtrZXlzfVwiKVxubWFrZUhhc0tleXMoXCJoYXNNYXRjaEFueUtleXNcIiwgaGFzTWF0Y2hBbnlLZXlzLCBmYWxzZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBtYXRjaCBhbnkga2V5IGluIHtrZXlzfVwiKVxubWFrZUhhc0tleXMoXCJub3RIYXNNYXRjaEtleXNcIiwgaGFzTWF0Y2hBbnlLZXlzLCB0cnVlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBtYXRjaCBhbnkga2V5IGluIHtrZXlzfVwiKVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi9saWIvZG9tXCIpXG4iLCJcInVzZSBzdHJpY3RcIlxuXG4vKipcbiAqIE1haW4gZW50cnkgcG9pbnQsIGZvciB0aG9zZSB3YW50aW5nIHRvIHVzZSB0aGlzIGZyYW1ld29yayB3aXRoIHRoZSBjb3JlXG4gKiBhc3NlcnRpb25zLlxuICovXG52YXIgVGhhbGxpdW0gPSByZXF1aXJlKFwiLi9saWIvYXBpL3RoYWxsaXVtXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gbmV3IFRoYWxsaXVtKClcbiIsIlwidXNlIHN0cmljdFwiXG5cbnZhciBUaGFsbGl1bSA9IHJlcXVpcmUoXCIuL2xpYi9hcGkvdGhhbGxpdW1cIilcbnZhciBSZXBvcnRzID0gcmVxdWlyZShcIi4vbGliL2NvcmUvcmVwb3J0c1wiKVxudmFyIFR5cGVzID0gUmVwb3J0cy5UeXBlc1xuXG5leHBvcnRzLnJvb3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIG5ldyBUaGFsbGl1bSgpXG59XG5cbmZ1bmN0aW9uIGQoZHVyYXRpb24pIHtcbiAgICBpZiAoZHVyYXRpb24gPT0gbnVsbCkgcmV0dXJuIDEwXG4gICAgaWYgKHR5cGVvZiBkdXJhdGlvbiA9PT0gXCJudW1iZXJcIikgcmV0dXJuIGR1cmF0aW9ufDBcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgYGR1cmF0aW9uYCB0byBiZSBhIG51bWJlciBpZiBpdCBleGlzdHNcIilcbn1cblxuZnVuY3Rpb24gcyhzbG93KSB7XG4gICAgaWYgKHNsb3cgPT0gbnVsbCkgcmV0dXJuIDc1XG4gICAgaWYgKHR5cGVvZiBzbG93ID09PSBcIm51bWJlclwiKSByZXR1cm4gc2xvd3wwXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGBzbG93YCB0byBiZSBhIG51bWJlciBpZiBpdCBleGlzdHNcIilcbn1cblxuZnVuY3Rpb24gcChwYXRoKSB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkocGF0aCkpIHJldHVybiBwYXRoXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGBwYXRoYCB0byBiZSBhbiBhcnJheSBvZiBsb2NhdGlvbnNcIilcbn1cblxuZnVuY3Rpb24gaCh2YWx1ZSkge1xuICAgIGlmICh2YWx1ZSAhPSBudWxsICYmIHR5cGVvZiB2YWx1ZS5fID09PSBcIm51bWJlclwiKSByZXR1cm4gdmFsdWVcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgYHZhbHVlYCB0byBiZSBhIGhvb2sgZXJyb3JcIilcbn1cblxuLyoqXG4gKiBDcmVhdGUgYSBuZXcgcmVwb3J0LCBtYWlubHkgZm9yIHRlc3RpbmcgcmVwb3J0ZXJzLlxuICovXG5leHBvcnRzLnJlcG9ydHMgPSB7XG4gICAgc3RhcnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSZXBvcnRzLlN0YXJ0KClcbiAgICB9LFxuXG4gICAgZW50ZXI6IGZ1bmN0aW9uIChwYXRoLCBkdXJhdGlvbiwgc2xvdykge1xuICAgICAgICByZXR1cm4gbmV3IFJlcG9ydHMuRW50ZXIocChwYXRoKSwgZChkdXJhdGlvbiksIHMoc2xvdykpXG4gICAgfSxcblxuICAgIGxlYXZlOiBmdW5jdGlvbiAocGF0aCkge1xuICAgICAgICByZXR1cm4gbmV3IFJlcG9ydHMuTGVhdmUocChwYXRoKSlcbiAgICB9LFxuXG4gICAgcGFzczogZnVuY3Rpb24gKHBhdGgsIGR1cmF0aW9uLCBzbG93KSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVwb3J0cy5QYXNzKHAocGF0aCksIGQoZHVyYXRpb24pLCBzKHNsb3cpKVxuICAgIH0sXG5cbiAgICBmYWlsOiBmdW5jdGlvbiAocGF0aCwgdmFsdWUsIGR1cmF0aW9uLCBzbG93LCBpc0ZhaWxhYmxlKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LXBhcmFtcywgbWF4LWxlblxuICAgICAgICByZXR1cm4gbmV3IFJlcG9ydHMuRmFpbChcbiAgICAgICAgICAgIHAocGF0aCksIHZhbHVlLCBkKGR1cmF0aW9uKSwgcyhzbG93KSxcbiAgICAgICAgICAgICEhaXNGYWlsYWJsZSlcbiAgICB9LFxuXG4gICAgc2tpcDogZnVuY3Rpb24gKHBhdGgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSZXBvcnRzLlNraXAocChwYXRoKSlcbiAgICB9LFxuXG4gICAgZW5kOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVwb3J0cy5FbmQoKVxuICAgIH0sXG5cbiAgICBlcnJvcjogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVwb3J0cy5FcnJvcih2YWx1ZSlcbiAgICB9LFxuXG4gICAgaG9vazogZnVuY3Rpb24gKHBhdGgsIHJvb3RQYXRoLCB2YWx1ZSkge1xuICAgICAgICByZXR1cm4gbmV3IFJlcG9ydHMuSG9vayhwKHBhdGgpLCBwKHJvb3RQYXRoKSwgaCh2YWx1ZSkpXG4gICAgfSxcbn1cblxuLyoqXG4gKiBDcmVhdGUgYSBuZXcgaG9vayBlcnJvciwgbWFpbmx5IGZvciB0ZXN0aW5nIHJlcG9ydGVycy5cbiAqL1xuZXhwb3J0cy5ob29rRXJyb3JzID0ge1xuICAgIGJlZm9yZUFsbDogZnVuY3Rpb24gKGZ1bmMsIHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVwb3J0cy5Ib29rRXJyb3IoVHlwZXMuQmVmb3JlQWxsLCBmdW5jLCB2YWx1ZSlcbiAgICB9LFxuXG4gICAgYmVmb3JlRWFjaDogZnVuY3Rpb24gKGZ1bmMsIHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVwb3J0cy5Ib29rRXJyb3IoVHlwZXMuQmVmb3JlRWFjaCwgZnVuYywgdmFsdWUpXG4gICAgfSxcblxuICAgIGFmdGVyRWFjaDogZnVuY3Rpb24gKGZ1bmMsIHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVwb3J0cy5Ib29rRXJyb3IoVHlwZXMuQWZ0ZXJFYWNoLCBmdW5jLCB2YWx1ZSlcbiAgICB9LFxuXG4gICAgYWZ0ZXJBbGw6IGZ1bmN0aW9uIChmdW5jLCB2YWx1ZSkge1xuICAgICAgICByZXR1cm4gbmV3IFJlcG9ydHMuSG9va0Vycm9yKFR5cGVzLkFmdGVyQWxsLCBmdW5jLCB2YWx1ZSlcbiAgICB9LFxufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgbG9jYXRpb24sIG1haW5seSBmb3IgdGVzdGluZyByZXBvcnRlcnMuXG4gKi9cbmV4cG9ydHMubG9jYXRpb24gPSBmdW5jdGlvbiAobmFtZSwgaW5kZXgpIHtcbiAgICBpZiAodHlwZW9mIG5hbWUgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGBuYW1lYCB0byBiZSBhIHN0cmluZ1wiKVxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgaW5kZXggIT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGBpbmRleGAgdG8gYmUgYSBudW1iZXJcIilcbiAgICB9XG5cbiAgICByZXR1cm4ge25hbWU6IG5hbWUsIGluZGV4OiBpbmRleHwwfVxufVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxuZXhwb3J0cy5hZGRIb29rID0gZnVuY3Rpb24gKGxpc3QsIGNhbGxiYWNrKSB7XG4gICAgaWYgKGxpc3QgIT0gbnVsbCkge1xuICAgICAgICBsaXN0LnB1c2goY2FsbGJhY2spXG4gICAgICAgIHJldHVybiBsaXN0XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIFtjYWxsYmFja11cbiAgICB9XG59XG5cbmV4cG9ydHMucmVtb3ZlSG9vayA9IGZ1bmN0aW9uIChsaXN0LCBjYWxsYmFjaykge1xuICAgIGlmIChsaXN0ID09IG51bGwpIHJldHVybiB1bmRlZmluZWRcbiAgICBpZiAobGlzdC5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgaWYgKGxpc3RbMF0gPT09IGNhbGxiYWNrKSByZXR1cm4gdW5kZWZpbmVkXG4gICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGluZGV4ID0gbGlzdC5pbmRleE9mKGNhbGxiYWNrKVxuXG4gICAgICAgIGlmIChpbmRleCA+PSAwKSBsaXN0LnNwbGljZShpbmRleCwgMSlcbiAgICB9XG4gICAgcmV0dXJuIGxpc3Rcbn1cblxuZXhwb3J0cy5oYXNIb29rID0gZnVuY3Rpb24gKGxpc3QsIGNhbGxiYWNrKSB7XG4gICAgaWYgKGxpc3QgPT0gbnVsbCkgcmV0dXJuIGZhbHNlXG4gICAgaWYgKGxpc3QubGVuZ3RoID4gMSkgcmV0dXJuIGxpc3QuaW5kZXhPZihjYWxsYmFjaykgPj0gMFxuICAgIHJldHVybiBsaXN0WzBdID09PSBjYWxsYmFja1xufVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxudmFyIG1ldGhvZHMgPSByZXF1aXJlKFwiLi4vbWV0aG9kc1wiKVxudmFyIFRlc3RzID0gcmVxdWlyZShcIi4uL2NvcmUvdGVzdHNcIilcbnZhciBIb29rcyA9IHJlcXVpcmUoXCIuL2hvb2tzXCIpXG5cbi8qKlxuICogVGhpcyBjb250YWlucyB0aGUgbG93IGxldmVsLCBtb3JlIGFyY2FuZSB0aGluZ3MgdGhhdCBhcmUgZ2VuZXJhbGx5IG5vdFxuICogaW50ZXJlc3RpbmcgdG8gYW55b25lIG90aGVyIHRoYW4gcGx1Z2luIGRldmVsb3BlcnMuXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gUmVmbGVjdFxuZnVuY3Rpb24gUmVmbGVjdCh0ZXN0KSB7XG4gICAgdmFyIHJlZmxlY3QgPSB0ZXN0LnJlZmxlY3RcblxuICAgIGlmIChyZWZsZWN0ICE9IG51bGwpIHJldHVybiByZWZsZWN0XG4gICAgaWYgKHRlc3Qucm9vdCAhPT0gdGVzdCkgcmV0dXJuIHRlc3QucmVmbGVjdCA9IG5ldyBSZWZsZWN0Q2hpbGQodGVzdClcbiAgICByZXR1cm4gdGVzdC5yZWZsZWN0ID0gbmV3IFJlZmxlY3RSb290KHRlc3QpXG59XG5cbm1ldGhvZHMoUmVmbGVjdCwge1xuICAgIC8qKlxuICAgICAqIEdldCB0aGUgY3VycmVudGx5IGV4ZWN1dGluZyB0ZXN0LlxuICAgICAqL1xuICAgIGdldCBjdXJyZW50KCkge1xuICAgICAgICByZXR1cm4gbmV3IFJlZmxlY3QodGhpcy5fLnJvb3QuY3VycmVudClcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSByb290IHRlc3QuXG4gICAgICovXG4gICAgZ2V0IHJvb3QoKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVmbGVjdCh0aGlzLl8ucm9vdClcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBjdXJyZW50IHRvdGFsIHRlc3QgY291bnQuXG4gICAgICovXG4gICAgZ2V0IGNvdW50KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fLnRlc3RzID09IG51bGwgPyAwIDogdGhpcy5fLnRlc3RzLmxlbmd0aFxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgYSBjb3B5IG9mIHRoZSBjdXJyZW50IHRlc3QgbGlzdCwgYXMgYSBSZWZsZWN0IGNvbGxlY3Rpb24uIFRoaXMgaXNcbiAgICAgKiBpbnRlbnRpb25hbGx5IGEgc2xpY2UsIHNvIHlvdSBjYW4ndCBtdXRhdGUgdGhlIHJlYWwgY2hpbGRyZW4uXG4gICAgICovXG4gICAgZ2V0IGNoaWxkcmVuKCkge1xuICAgICAgICBpZiAodGhpcy5fLnRlc3RzID09IG51bGwpIHJldHVybiBbXVxuICAgICAgICByZXR1cm4gdGhpcy5fLnRlc3RzLm1hcChmdW5jdGlvbiAodGVzdCkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBSZWZsZWN0Q2hpbGQodGVzdClcbiAgICAgICAgfSlcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogSXMgdGhpcyB0ZXN0IHRoZSByb290LCBpLmUuIHRvcCBsZXZlbD9cbiAgICAgKi9cbiAgICBnZXQgaXNSb290KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fLnJvb3QgPT09IHRoaXMuX1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBJcyB0aGlzIGxvY2tlZCAoaS5lLiB1bnNhZmUgdG8gbW9kaWZ5KT9cbiAgICAgKi9cbiAgICBnZXQgaXNMb2NrZWQoKSB7XG4gICAgICAgIHJldHVybiAhIXRoaXMuXy5sb2NrZWRcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBvd24sIG5vdCBuZWNlc3NhcmlseSBhY3RpdmUsIHRpbWVvdXQuIDAgbWVhbnMgaW5oZXJpdCB0aGVcbiAgICAgKiBwYXJlbnQncywgYW5kIGBJbmZpbml0eWAgbWVhbnMgaXQncyBkaXNhYmxlZC5cbiAgICAgKi9cbiAgICBnZXQgb3duVGltZW91dCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuXy50aW1lb3V0IHx8IDBcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBhY3RpdmUgdGltZW91dCBpbiBtaWxsaXNlY29uZHMsIG5vdCBuZWNlc3NhcmlseSBvd24sIG9yIHRoZVxuICAgICAqIGZyYW1ld29yayBkZWZhdWx0IG9mIDIwMDAsIGlmIG5vbmUgd2FzIHNldC5cbiAgICAgKi9cbiAgICBnZXQgdGltZW91dCgpIHtcbiAgICAgICAgcmV0dXJuIFRlc3RzLnRpbWVvdXQodGhpcy5fKVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIG93biwgbm90IG5lY2Vzc2FyaWx5IGFjdGl2ZSwgc2xvdyB0aHJlc2hvbGQuIDAgbWVhbnMgaW5oZXJpdCB0aGVcbiAgICAgKiBwYXJlbnQncywgYW5kIGBJbmZpbml0eWAgbWVhbnMgaXQncyBkaXNhYmxlZC5cbiAgICAgKi9cbiAgICBnZXQgb3duU2xvdygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuXy5zbG93IHx8IDBcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBhY3RpdmUgc2xvdyB0aHJlc2hvbGQgaW4gbWlsbGlzZWNvbmRzLCBub3QgbmVjZXNzYXJpbHkgb3duLCBvclxuICAgICAqIHRoZSBmcmFtZXdvcmsgZGVmYXVsdCBvZiA3NSwgaWYgbm9uZSB3YXMgc2V0LlxuICAgICAqL1xuICAgIGdldCBzbG93KCkge1xuICAgICAgICByZXR1cm4gVGVzdHMuc2xvdyh0aGlzLl8pXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgdGVzdCdzIG93biBtYXggYXR0ZW1wdCBjb3VudC4gTm90ZSB0aGF0IHRoaXMgaXMgcGFyYXNpdGljYWxseVxuICAgICAqIGluaGVyaXRlZCBmcm9tIGl0cyBwYXJlbnQsIG5vdCBkZWxlZ2F0ZWQuXG4gICAgICovXG4gICAgZ2V0IGF0dGVtcHRzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fLmF0dGVtcHRzXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCB3aGV0aGVyIHRoaXMgdGVzdCBpcyBmYWlsYWJsZS4gTm90ZSB0aGF0IHRoaXMgaXMgcGFyYXNpdGljYWxseVxuICAgICAqIGluaGVyaXRlZCBmcm9tIGl0cyBwYXJlbnQsIG5vdCBkZWxlZ2F0ZWQuXG4gICAgICovXG4gICAgZ2V0IGlzRmFpbGFibGUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl8uaXNGYWlsYWJsZVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGQgYSBob29rIHRvIGJlIHJ1biBiZWZvcmUgZWFjaCBzdWJ0ZXN0LCBpbmNsdWRpbmcgdGhlaXIgc3VidGVzdHMgYW5kIHNvXG4gICAgICogb24uXG4gICAgICovXG4gICAgYmVmb3JlOiBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgY2FsbGJhY2sgdG8gYmUgYSBmdW5jdGlvbiBpZiBwYXNzZWRcIilcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuXy5iZWZvcmVFYWNoID0gSG9va3MuYWRkSG9vayh0aGlzLl8uYmVmb3JlRWFjaCwgY2FsbGJhY2spXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBhIGhvb2sgdG8gYmUgcnVuIG9uY2UgYmVmb3JlIGFsbCBzdWJ0ZXN0cyBhcmUgcnVuLlxuICAgICAqL1xuICAgIGJlZm9yZUFsbDogZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIGJlIGEgZnVuY3Rpb24gaWYgcGFzc2VkXCIpXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl8uYmVmb3JlQWxsID0gSG9va3MuYWRkSG9vayh0aGlzLl8uYmVmb3JlQWxsLCBjYWxsYmFjaylcbiAgICB9LFxuXG4gICAvKipcbiAgICAqIEFkZCBhIGhvb2sgdG8gYmUgcnVuIGFmdGVyIGVhY2ggc3VidGVzdCwgaW5jbHVkaW5nIHRoZWlyIHN1YnRlc3RzIGFuZCBzb1xuICAgICogb24uXG4gICAgKi9cbiAgICBhZnRlcjogZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIGJlIGEgZnVuY3Rpb24gaWYgcGFzc2VkXCIpXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl8uYWZ0ZXJFYWNoID0gSG9va3MuYWRkSG9vayh0aGlzLl8uYWZ0ZXJFYWNoLCBjYWxsYmFjaylcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGEgaG9vayB0byBiZSBydW4gb25jZSBhZnRlciBhbGwgc3VidGVzdHMgYXJlIHJ1bi5cbiAgICAgKi9cbiAgICBhZnRlckFsbDogZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIGJlIGEgZnVuY3Rpb24gaWYgcGFzc2VkXCIpXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl8uYWZ0ZXJBbGwgPSBIb29rcy5hZGRIb29rKHRoaXMuXy5hZnRlckFsbCwgY2FsbGJhY2spXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBhIGhvb2sgcHJldmlvdXNseSBhZGRlZCB3aXRoIGB0LmJlZm9yZWAgb3IgYHJlZmxlY3QuYmVmb3JlYC5cbiAgICAgKi9cbiAgICBoYXNCZWZvcmU6IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBjYWxsYmFjayB0byBiZSBhIGZ1bmN0aW9uIGlmIHBhc3NlZFwiKVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIEhvb2tzLmhhc0hvb2sodGhpcy5fLmJlZm9yZUVhY2gsIGNhbGxiYWNrKVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgYSBob29rIHByZXZpb3VzbHkgYWRkZWQgd2l0aCBgdC5iZWZvcmVBbGxgIG9yIGByZWZsZWN0LmJlZm9yZUFsbGAuXG4gICAgICovXG4gICAgaGFzQmVmb3JlQWxsOiBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgY2FsbGJhY2sgdG8gYmUgYSBmdW5jdGlvbiBpZiBwYXNzZWRcIilcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBIb29rcy5oYXNIb29rKHRoaXMuXy5iZWZvcmVBbGwsIGNhbGxiYWNrKVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgYSBob29rIHByZXZpb3VzbHkgYWRkZWQgd2l0aCBgdC5hZnRlcmAgb3JgcmVmbGVjdC5hZnRlcmAuXG4gICAgICovXG4gICAgaGFzQWZ0ZXI6IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBjYWxsYmFjayB0byBiZSBhIGZ1bmN0aW9uIGlmIHBhc3NlZFwiKVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIEhvb2tzLmhhc0hvb2sodGhpcy5fLmFmdGVyRWFjaCwgY2FsbGJhY2spXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBhIGhvb2sgcHJldmlvdXNseSBhZGRlZCB3aXRoIGB0LmFmdGVyQWxsYCBvciBgcmVmbGVjdC5hZnRlckFsbGAuXG4gICAgICovXG4gICAgaGFzQWZ0ZXJBbGw6IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBjYWxsYmFjayB0byBiZSBhIGZ1bmN0aW9uIGlmIHBhc3NlZFwiKVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIEhvb2tzLmhhc0hvb2sodGhpcy5fLmFmdGVyQWxsLCBjYWxsYmFjaylcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGEgaG9vayBwcmV2aW91c2x5IGFkZGVkIHdpdGggYHQuYmVmb3JlYCBvciBgcmVmbGVjdC5iZWZvcmVgLlxuICAgICAqL1xuICAgIHJlbW92ZUJlZm9yZTogZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIGJlIGEgZnVuY3Rpb24gaWYgcGFzc2VkXCIpXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgYmVmb3JlRWFjaCA9IEhvb2tzLnJlbW92ZUhvb2sodGhpcy5fLmJlZm9yZUVhY2gsIGNhbGxiYWNrKVxuXG4gICAgICAgIGlmIChiZWZvcmVFYWNoID09IG51bGwpIGRlbGV0ZSB0aGlzLl8uYmVmb3JlRWFjaFxuICAgICAgICBlbHNlIHRoaXMuXy5iZWZvcmVFYWNoID0gYmVmb3JlRWFjaFxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgYSBob29rIHByZXZpb3VzbHkgYWRkZWQgd2l0aCBgdC5iZWZvcmVBbGxgIG9yIGByZWZsZWN0LmJlZm9yZUFsbGAuXG4gICAgICovXG4gICAgcmVtb3ZlQmVmb3JlQWxsOiBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgY2FsbGJhY2sgdG8gYmUgYSBmdW5jdGlvbiBpZiBwYXNzZWRcIilcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBiZWZvcmVBbGwgPSBIb29rcy5yZW1vdmVIb29rKHRoaXMuXy5iZWZvcmVBbGwsIGNhbGxiYWNrKVxuXG4gICAgICAgIGlmIChiZWZvcmVBbGwgPT0gbnVsbCkgZGVsZXRlIHRoaXMuXy5iZWZvcmVBbGxcbiAgICAgICAgZWxzZSB0aGlzLl8uYmVmb3JlQWxsID0gYmVmb3JlQWxsXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBhIGhvb2sgcHJldmlvdXNseSBhZGRlZCB3aXRoIGB0LmFmdGVyYCBvcmByZWZsZWN0LmFmdGVyYC5cbiAgICAgKi9cbiAgICByZW1vdmVBZnRlcjogZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIGJlIGEgZnVuY3Rpb24gaWYgcGFzc2VkXCIpXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgYWZ0ZXJFYWNoID0gSG9va3MucmVtb3ZlSG9vayh0aGlzLl8uYWZ0ZXJFYWNoLCBjYWxsYmFjaylcblxuICAgICAgICBpZiAoYWZ0ZXJFYWNoID09IG51bGwpIGRlbGV0ZSB0aGlzLl8uYWZ0ZXJFYWNoXG4gICAgICAgIGVsc2UgdGhpcy5fLmFmdGVyRWFjaCA9IGFmdGVyRWFjaFxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgYSBob29rIHByZXZpb3VzbHkgYWRkZWQgd2l0aCBgdC5hZnRlckFsbGAgb3IgYHJlZmxlY3QuYWZ0ZXJBbGxgLlxuICAgICAqL1xuICAgIHJlbW92ZUFmdGVyQWxsOiBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgY2FsbGJhY2sgdG8gYmUgYSBmdW5jdGlvbiBpZiBwYXNzZWRcIilcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBhZnRlckFsbCA9IEhvb2tzLnJlbW92ZUhvb2sodGhpcy5fLmFmdGVyQWxsLCBjYWxsYmFjaylcblxuICAgICAgICBpZiAoYWZ0ZXJBbGwgPT0gbnVsbCkgZGVsZXRlIHRoaXMuXy5hZnRlckFsbFxuICAgICAgICBlbHNlIHRoaXMuXy5hZnRlckFsbCA9IGFmdGVyQWxsXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBhIGJsb2NrIG9yIGlubGluZSB0ZXN0LlxuICAgICAqL1xuICAgIHRlc3Q6IGZ1bmN0aW9uIChuYW1lLCBjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIG5hbWUgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBgbmFtZWAgdG8gYmUgYSBzdHJpbmdcIilcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIGJlIGEgZnVuY3Rpb24gaWYgcGFzc2VkXCIpXG4gICAgICAgIH1cblxuICAgICAgICBUZXN0cy5hZGROb3JtYWwodGhpcy5fLnJvb3QuY3VycmVudCwgbmFtZSwgY2FsbGJhY2spXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBhIHNraXBwZWQgYmxvY2sgb3IgaW5saW5lIHRlc3QuXG4gICAgICovXG4gICAgdGVzdFNraXA6IGZ1bmN0aW9uIChuYW1lLCBjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIG5hbWUgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBgbmFtZWAgdG8gYmUgYSBzdHJpbmdcIilcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIGJlIGEgZnVuY3Rpb24gaWYgcGFzc2VkXCIpXG4gICAgICAgIH1cblxuICAgICAgICBUZXN0cy5hZGRTa2lwcGVkKHRoaXMuXy5yb290LmN1cnJlbnQsIG5hbWUpXG4gICAgfSxcbn0pXG5cbmZ1bmN0aW9uIFJlZmxlY3RSb290KHJvb3QpIHtcbiAgICB0aGlzLl8gPSByb290XG59XG5cbm1ldGhvZHMoUmVmbGVjdFJvb3QsIFJlZmxlY3QsIHtcbiAgICAvKipcbiAgICAgKiBXaGV0aGVyIGEgcmVwb3J0ZXIgd2FzIHJlZ2lzdGVyZWQuXG4gICAgICovXG4gICAgaGFzUmVwb3J0ZXI6IGZ1bmN0aW9uIChyZXBvcnRlcikge1xuICAgICAgICBpZiAodHlwZW9mIHJlcG9ydGVyICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBgcmVwb3J0ZXJgIHRvIGJlIGEgZnVuY3Rpb25cIilcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLl8ucm9vdC5yZXBvcnRlcklkcy5pbmRleE9mKHJlcG9ydGVyKSA+PSAwXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBhIHJlcG9ydGVyLlxuICAgICAqL1xuICAgIHJlcG9ydGVyOiBmdW5jdGlvbiAocmVwb3J0ZXIsIGFyZykge1xuICAgICAgICBpZiAodHlwZW9mIHJlcG9ydGVyICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBgcmVwb3J0ZXJgIHRvIGJlIGEgZnVuY3Rpb25cIilcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciByb290ID0gdGhpcy5fLnJvb3RcblxuICAgICAgICBpZiAocm9vdC5jdXJyZW50ICE9PSByb290KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJSZXBvcnRlcnMgbWF5IG9ubHkgYmUgYWRkZWQgdG8gdGhlIHJvb3RcIilcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChyb290LnJlcG9ydGVySWRzLmluZGV4T2YocmVwb3J0ZXIpIDwgMCkge1xuICAgICAgICAgICAgcm9vdC5yZXBvcnRlcklkcy5wdXNoKHJlcG9ydGVyKVxuICAgICAgICAgICAgcm9vdC5yZXBvcnRlcnMucHVzaChyZXBvcnRlcihhcmcpKVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBhIHJlcG9ydGVyLlxuICAgICAqL1xuICAgIHJlbW92ZVJlcG9ydGVyOiBmdW5jdGlvbiAocmVwb3J0ZXIpIHtcbiAgICAgICAgaWYgKHR5cGVvZiByZXBvcnRlciAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgYHJlcG9ydGVyYCB0byBiZSBhIGZ1bmN0aW9uXCIpXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcm9vdCA9IHRoaXMuXy5yb290XG5cbiAgICAgICAgaWYgKHJvb3QuY3VycmVudCAhPT0gcm9vdCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUmVwb3J0ZXJzIG1heSBvbmx5IGJlIGFkZGVkIHRvIHRoZSByb290XCIpXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgaW5kZXggPSByb290LnJlcG9ydGVySWRzLmluZGV4T2YocmVwb3J0ZXIpXG5cbiAgICAgICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgICAgICAgIHJvb3QucmVwb3J0ZXJJZHMuc3BsaWNlKGluZGV4LCAxKVxuICAgICAgICAgICAgcm9vdC5yZXBvcnRlcnMuc3BsaWNlKGluZGV4LCAxKVxuICAgICAgICB9XG4gICAgfSxcbn0pXG5cbmZ1bmN0aW9uIFJlZmxlY3RDaGlsZChyb290KSB7XG4gICAgdGhpcy5fID0gcm9vdFxufVxuXG5tZXRob2RzKFJlZmxlY3RDaGlsZCwgUmVmbGVjdCwge1xuICAgIC8qKlxuICAgICAqIEdldCB0aGUgdGVzdCBuYW1lLCBvciBgdW5kZWZpbmVkYCBpZiBpdCdzIHRoZSByb290IHRlc3QuXG4gICAgICovXG4gICAgZ2V0IG5hbWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl8ubmFtZVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIHRlc3QgaW5kZXgsIG9yIGAtMWAgaWYgaXQncyB0aGUgcm9vdCB0ZXN0LlxuICAgICAqL1xuICAgIGdldCBpbmRleCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuXy5pbmRleFxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIHBhcmVudCB0ZXN0IGFzIGEgUmVmbGVjdC5cbiAgICAgKi9cbiAgICBnZXQgcGFyZW50KCkge1xuICAgICAgICByZXR1cm4gbmV3IFJlZmxlY3QodGhpcy5fLnBhcmVudClcbiAgICB9LFxufSlcbiIsIlwidXNlIHN0cmljdFwiXG5cbnZhciBtZXRob2RzID0gcmVxdWlyZShcIi4uL21ldGhvZHNcIilcbnZhciBUZXN0cyA9IHJlcXVpcmUoXCIuLi9jb3JlL3Rlc3RzXCIpXG52YXIgb25seUFkZCA9IHJlcXVpcmUoXCIuLi9jb3JlL29ubHlcIikub25seUFkZFxudmFyIGFkZEhvb2sgPSByZXF1aXJlKFwiLi9ob29rc1wiKS5hZGRIb29rXG52YXIgUmVmbGVjdCA9IHJlcXVpcmUoXCIuL3JlZmxlY3RcIilcblxubW9kdWxlLmV4cG9ydHMgPSBUaGFsbGl1bVxuZnVuY3Rpb24gVGhhbGxpdW0oKSB7XG4gICAgdGhpcy5fID0gVGVzdHMuY3JlYXRlUm9vdCh0aGlzKVxuICAgIC8vIEVTNiBtb2R1bGUgdHJhbnNwaWxlciBjb21wYXRpYmlsaXR5LlxuICAgIHRoaXMuZGVmYXVsdCA9IHRoaXNcbn1cblxubWV0aG9kcyhUaGFsbGl1bSwge1xuICAgIC8qKlxuICAgICAqIENhbGwgYSBwbHVnaW4gYW5kIHJldHVybiB0aGUgcmVzdWx0LiBUaGUgcGx1Z2luIGlzIGNhbGxlZCB3aXRoIGEgUmVmbGVjdFxuICAgICAqIGluc3RhbmNlIGZvciBhY2Nlc3MgdG8gcGxlbnR5IG9mIHBvdGVudGlhbGx5IHVzZWZ1bCBpbnRlcm5hbCBkZXRhaWxzLlxuICAgICAqL1xuICAgIGNhbGw6IGZ1bmN0aW9uIChwbHVnaW4sIGFyZykge1xuICAgICAgICB2YXIgcmVmbGVjdCA9IG5ldyBSZWZsZWN0KHRoaXMuXy5yb290LmN1cnJlbnQpXG5cbiAgICAgICAgcmV0dXJuIHBsdWdpbi5jYWxsKHJlZmxlY3QsIHJlZmxlY3QsIGFyZylcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogV2hpdGVsaXN0IHNwZWNpZmljIHRlc3RzLCB1c2luZyBhcnJheS1iYXNlZCBzZWxlY3RvcnMgd2hlcmUgZWFjaCBlbnRyeVxuICAgICAqIGlzIGVpdGhlciBhIHN0cmluZyBvciByZWd1bGFyIGV4cHJlc3Npb24uXG4gICAgICovXG4gICAgb25seTogZnVuY3Rpb24gKC8qIC4uLnNlbGVjdG9ycyAqLykge1xuICAgICAgICBvbmx5QWRkLmFwcGx5KHRoaXMuXy5yb290LmN1cnJlbnQsIGFyZ3VtZW50cylcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGEgcmVwb3J0ZXIuXG4gICAgICovXG4gICAgcmVwb3J0ZXI6IGZ1bmN0aW9uIChyZXBvcnRlciwgYXJnKSB7XG4gICAgICAgIGlmICh0eXBlb2YgcmVwb3J0ZXIgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGByZXBvcnRlcmAgdG8gYmUgYSBmdW5jdGlvbi5cIilcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciByb290ID0gdGhpcy5fLnJvb3RcblxuICAgICAgICBpZiAocm9vdC5jdXJyZW50ICE9PSByb290KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJSZXBvcnRlcnMgbWF5IG9ubHkgYmUgYWRkZWQgdG8gdGhlIHJvb3QuXCIpXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcmVzdWx0ID0gcmVwb3J0ZXIoYXJnKVxuXG4gICAgICAgIC8vIERvbid0IGFzc3VtZSBpdCdzIGEgZnVuY3Rpb24uIFZlcmlmeSBpdCBhY3R1YWxseSBpcywgc28gd2UgZG9uJ3QgaGF2ZVxuICAgICAgICAvLyBpbmV4cGxpY2FibGUgdHlwZSBlcnJvcnMgaW50ZXJuYWxseSBhZnRlciBpdCdzIGludm9rZWQsIGFuZCBzbyB1c2Vyc1xuICAgICAgICAvLyB3b24ndCBnZXQgdG9vIGNvbmZ1c2VkLlxuICAgICAgICBpZiAodHlwZW9mIHJlc3VsdCAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICAgICAgICAgIFwiRXhwZWN0ZWQgYHJlcG9ydGVyYCB0byByZXR1cm4gYSBmdW5jdGlvbi4gQ2hlY2sgd2l0aCB0aGUgXCIgK1xuICAgICAgICAgICAgICAgIFwicmVwb3J0ZXIncyBhdXRob3IsIGFuZCBoYXZlIHRoZW0gZml4IHRoZWlyIHJlcG9ydGVyLlwiKVxuICAgICAgICB9XG5cbiAgICAgICAgcm9vdC5yZXBvcnRlciA9IHJlc3VsdFxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDaGVjayBpZiB0aGlzIGhhcyBhIHJlcG9ydGVyLlxuICAgICAqL1xuICAgIGdldCBoYXNSZXBvcnRlcigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuXy5yb290LnJlcG9ydGVyICE9IG51bGxcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBjdXJyZW50IHRpbWVvdXQuIDAgbWVhbnMgaW5oZXJpdCB0aGUgcGFyZW50J3MsIGFuZCBgSW5maW5pdHlgXG4gICAgICogbWVhbnMgaXQncyBkaXNhYmxlZC5cbiAgICAgKi9cbiAgICBnZXQgdGltZW91dCgpIHtcbiAgICAgICAgcmV0dXJuIFRlc3RzLnRpbWVvdXQodGhpcy5fLnJvb3QuY3VycmVudClcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IHRoZSB0aW1lb3V0IGluIG1pbGxpc2Vjb25kcywgcm91bmRpbmcgbmVnYXRpdmVzIHRvIDAuIFNldHRpbmcgdGhlXG4gICAgICogdGltZW91dCB0byAwIG1lYW5zIHRvIGluaGVyaXQgdGhlIHBhcmVudCB0aW1lb3V0LCBhbmQgc2V0dGluZyBpdCB0b1xuICAgICAqIGBJbmZpbml0eWAgZGlzYWJsZXMgaXQuXG4gICAgICovXG4gICAgc2V0IHRpbWVvdXQodGltZW91dCkge1xuICAgICAgICB2YXIgY2FsY3VsYXRlZCA9IE1hdGguZmxvb3IoTWF0aC5tYXgoK3RpbWVvdXQsIDApKVxuXG4gICAgICAgIGlmIChjYWxjdWxhdGVkID09PSAwKSBkZWxldGUgdGhpcy5fLnJvb3QuY3VycmVudC50aW1lb3V0XG4gICAgICAgIGVsc2UgdGhpcy5fLnJvb3QuY3VycmVudC50aW1lb3V0ID0gY2FsY3VsYXRlZFxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIGN1cnJlbnQgc2xvdyB0aHJlc2hvbGQuIDAgbWVhbnMgaW5oZXJpdCB0aGUgcGFyZW50J3MsIGFuZFxuICAgICAqIGBJbmZpbml0eWAgbWVhbnMgaXQncyBkaXNhYmxlZC5cbiAgICAgKi9cbiAgICBnZXQgc2xvdygpIHtcbiAgICAgICAgcmV0dXJuIFRlc3RzLnNsb3codGhpcy5fLnJvb3QuY3VycmVudClcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IHRoZSBzbG93IHRocmVzaG9sZCBpbiBtaWxsaXNlY29uZHMsIHJvdW5kaW5nIG5lZ2F0aXZlcyB0byAwLiBTZXR0aW5nXG4gICAgICogdGhlIHRpbWVvdXQgdG8gMCBtZWFucyB0byBpbmhlcml0IHRoZSBwYXJlbnQgdGhyZXNob2xkLCBhbmQgc2V0dGluZyBpdCB0b1xuICAgICAqIGBJbmZpbml0eWAgZGlzYWJsZXMgaXQuXG4gICAgICovXG4gICAgc2V0IHNsb3coc2xvdykge1xuICAgICAgICB2YXIgY2FsY3VsYXRlZCA9IE1hdGguZmxvb3IoTWF0aC5tYXgoK3Nsb3csIDApKVxuXG4gICAgICAgIGlmIChjYWxjdWxhdGVkID09PSAwKSBkZWxldGUgdGhpcy5fLnJvb3QuY3VycmVudC5zbG93XG4gICAgICAgIGVsc2UgdGhpcy5fLnJvb3QuY3VycmVudC5zbG93ID0gY2FsY3VsYXRlZFxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIGN1cnJlbnQgYXR0ZW1wdCBjb3VudC4gYDBgIG1lYW5zIGluaGVyaXQgdGhlIHBhcmVudCdzLlxuICAgICAqL1xuICAgIGdldCBhdHRlbXB0cygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuXy5yb290LmN1cnJlbnQuYXR0ZW1wdHNcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IHRoZSBudW1iZXIgb2YgYXR0ZW1wdHMgYWxsb3dlZCwgcm91bmRpbmcgbmVnYXRpdmVzIHRvIDAuIFNldHRpbmcgdGhlXG4gICAgICogY291bnQgdG8gYDBgIG1lYW5zIHRvIGluaGVyaXQgdGhlIHBhcmVudCByZXRyeSBjb3VudC5cbiAgICAgKi9cbiAgICBzZXQgYXR0ZW1wdHMoYXR0ZW1wdHMpIHtcbiAgICAgICAgLy8gVGhpcyBpcyBkb25lIGRpZmZlcmVudGx5IHRvIGF2b2lkIGEgbWFzc2l2ZSBwZXJmb3JtYW5jZSBwZW5hbHR5LlxuICAgICAgICB2YXIgY2FsY3VsYXRlZCA9IE1hdGguZmxvb3IoTWF0aC5tYXgoYXR0ZW1wdHMsIDApKVxuICAgICAgICB2YXIgdGVzdCA9IHRoaXMuXy5yb290LmN1cnJlbnRcblxuICAgICAgICB0ZXN0LmF0dGVtcHRzID0gY2FsY3VsYXRlZCB8fCB0ZXN0LnBhcmVudC5hdHRlbXB0c1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgd2hldGhlciB0aGlzIHRlc3QgaXMgZmFpbGFibGUuXG4gICAgICovXG4gICAgZ2V0IGlzRmFpbGFibGUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl8ucm9vdC5jdXJyZW50LmlzRmFpbGFibGVcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHdoZXRoZXIgdGhpcyB0ZXN0IGlzIGZhaWxhYmxlLlxuICAgICAqL1xuICAgIHNldCBpc0ZhaWxhYmxlKGlzRmFpbGFibGUpIHtcbiAgICAgICAgdGhpcy5fLnJvb3QuY3VycmVudC5pc0ZhaWxhYmxlID0gISFpc0ZhaWxhYmxlXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJ1biB0aGUgdGVzdHMgKG9yIHRoZSB0ZXN0J3MgdGVzdHMgaWYgaXQncyBub3QgYSBiYXNlIGluc3RhbmNlKS5cbiAgICAgKi9cbiAgICBydW46IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMuXy5yb290ICE9PSB0aGlzLl8pIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgICBcIk9ubHkgdGhlIHJvb3QgdGVzdCBjYW4gYmUgcnVuIC0gSWYgeW91IG9ubHkgd2FudCB0byBydW4gYSBcIiArXG4gICAgICAgICAgICAgICAgXCJzdWJ0ZXN0LCB1c2UgYHQub25seShbXFxcInNlbGVjdG9yMVxcXCIsIC4uLl0pYCBpbnN0ZWFkLlwiKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuXy5sb2NrZWQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbid0IHJ1biB3aGlsZSB0ZXN0cyBhcmUgYWxyZWFkeSBydW5uaW5nLlwiKVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIFRlc3RzLnJ1blRlc3QodGhpcy5fKVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGQgYSB0ZXN0LlxuICAgICAqL1xuICAgIHRlc3Q6IGZ1bmN0aW9uIChuYW1lLCBjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIG5hbWUgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBgbmFtZWAgdG8gYmUgYSBzdHJpbmdcIilcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIGJlIGEgZnVuY3Rpb24gaWYgcGFzc2VkXCIpXG4gICAgICAgIH1cblxuICAgICAgICBUZXN0cy5hZGROb3JtYWwodGhpcy5fLnJvb3QuY3VycmVudCwgbmFtZSwgY2FsbGJhY2spXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBhIHNraXBwZWQgdGVzdC5cbiAgICAgKi9cbiAgICB0ZXN0U2tpcDogZnVuY3Rpb24gKG5hbWUsIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgbmFtZSAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGBuYW1lYCB0byBiZSBhIHN0cmluZ1wiKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgY2FsbGJhY2sgdG8gYmUgYSBmdW5jdGlvbiBpZiBwYXNzZWRcIilcbiAgICAgICAgfVxuXG4gICAgICAgIFRlc3RzLmFkZFNraXBwZWQodGhpcy5fLnJvb3QuY3VycmVudCwgbmFtZSlcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2xlYXIgYWxsIGV4aXN0aW5nIHRlc3RzLlxuICAgICAqL1xuICAgIGNsZWFyVGVzdHM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMuXy5yb290ICE9PSB0aGlzLl8pIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlRlc3RzIG1heSBvbmx5IGJlIGNsZWFyZWQgYXQgdGhlIHJvb3QuXCIpXG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5fLmxvY2tlZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2FuJ3QgY2xlYXIgdGVzdHMgd2hpbGUgdGhleSBhcmUgcnVubmluZy5cIilcbiAgICAgICAgfVxuXG4gICAgICAgIFRlc3RzLmNsZWFyVGVzdHModGhpcy5fKVxuICAgIH0sXG5cbiAgICBiZWZvcmU6IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBjYWxsYmFjayB0byBiZSBhIGZ1bmN0aW9uIGlmIHBhc3NlZFwiKVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHRlc3QgPSB0aGlzLl8ucm9vdC5jdXJyZW50XG5cbiAgICAgICAgdGVzdC5iZWZvcmVFYWNoID0gYWRkSG9vayh0ZXN0LmJlZm9yZUVhY2gsIGNhbGxiYWNrKVxuICAgIH0sXG5cbiAgICBiZWZvcmVBbGw6IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBjYWxsYmFjayB0byBiZSBhIGZ1bmN0aW9uIGlmIHBhc3NlZFwiKVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHRlc3QgPSB0aGlzLl8ucm9vdC5jdXJyZW50XG5cbiAgICAgICAgdGVzdC5iZWZvcmVBbGwgPSBhZGRIb29rKHRlc3QuYmVmb3JlQWxsLCBjYWxsYmFjaylcbiAgICB9LFxuXG4gICAgYWZ0ZXI6IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBjYWxsYmFjayB0byBiZSBhIGZ1bmN0aW9uIGlmIHBhc3NlZFwiKVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHRlc3QgPSB0aGlzLl8ucm9vdC5jdXJyZW50XG5cbiAgICAgICAgdGVzdC5hZnRlckVhY2ggPSBhZGRIb29rKHRlc3QuYWZ0ZXJFYWNoLCBjYWxsYmFjaylcbiAgICB9LFxuXG4gICAgYWZ0ZXJBbGw6IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBjYWxsYmFjayB0byBiZSBhIGZ1bmN0aW9uIGlmIHBhc3NlZFwiKVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHRlc3QgPSB0aGlzLl8ucm9vdC5jdXJyZW50XG5cbiAgICAgICAgdGVzdC5hZnRlckFsbCA9IGFkZEhvb2sodGVzdC5hZnRlckFsbCwgY2FsbGJhY2spXG4gICAgfSxcbn0pXG4iLCJcInVzZSBzdHJpY3RcIlxuXG4vKipcbiAqIFRoaXMgaXMgdGhlIGVudHJ5IHBvaW50IGZvciB0aGUgQnJvd3NlcmlmeSBidW5kbGUuIE5vdGUgdGhhdCBpdCAqYWxzbyogd2lsbFxuICogcnVuIGFzIHBhcnQgb2YgdGhlIHRlc3RzIGluIE5vZGUgKHVuYnVuZGxlZCksIGFuZCBpdCB0aGVvcmV0aWNhbGx5IGNvdWxkIGJlXG4gKiBydW4gaW4gTm9kZSBvciBhIHJ1bnRpbWUgbGltaXRlZCB0byBvbmx5IEVTNSBzdXBwb3J0IChlLmcuIFJoaW5vLCBOYXNob3JuLCBvclxuICogZW1iZWRkZWQgVjgpLCBzbyBkbyAqbm90KiBhc3N1bWUgYnJvd3NlciBnbG9iYWxzIGFyZSBwcmVzZW50LlxuICovXG5cbmV4cG9ydHMudCA9IHJlcXVpcmUoXCIuLi9pbmRleFwiKVxuZXhwb3J0cy5hc3NlcnQgPSByZXF1aXJlKFwiLi4vYXNzZXJ0XCIpXG5leHBvcnRzLnIgPSByZXF1aXJlKFwiLi4vclwiKVxudmFyIGRvbSA9IHJlcXVpcmUoXCIuLi9kb21cIilcblxuZXhwb3J0cy5kb20gPSBkb20uY3JlYXRlXG4vLyBpZiAoZ2xvYmFsLmRvY3VtZW50ICE9IG51bGwgJiYgZ2xvYmFsLmRvY3VtZW50LmN1cnJlbnRTY3JpcHQgIT0gbnVsbCkge1xuLy8gICAgIGRvbS5hdXRvbG9hZChnbG9iYWwuZG9jdW1lbnQuY3VycmVudFNjcmlwdClcbi8vIH1cblxudmFyIEludGVybmFsID0gcmVxdWlyZShcIi4uL2ludGVybmFsXCIpXG5cbmV4cG9ydHMucm9vdCA9IEludGVybmFsLnJvb3RcbmV4cG9ydHMucmVwb3J0cyA9IEludGVybmFsLnJlcG9ydHNcbmV4cG9ydHMuaG9va0Vycm9ycyA9IEludGVybmFsLmhvb2tFcnJvcnNcbmV4cG9ydHMubG9jYXRpb24gPSBJbnRlcm5hbC5sb2NhdGlvblxuXG4vLyBJbiBjYXNlIHRoZSB1c2VyIG5lZWRzIHRvIGFkanVzdCB0aGlzIChlLmcuIE5hc2hvcm4gKyBjb25zb2xlIG91dHB1dCkuXG52YXIgU2V0dGluZ3MgPSByZXF1aXJlKFwiLi9zZXR0aW5nc1wiKVxuXG5leHBvcnRzLnNldHRpbmdzID0ge1xuICAgIHdpbmRvd1dpZHRoOiB7XG4gICAgICAgIGdldDogU2V0dGluZ3Mud2luZG93V2lkdGgsXG4gICAgICAgIHNldDogU2V0dGluZ3Muc2V0V2luZG93V2lkdGgsXG4gICAgfSxcblxuICAgIG5ld2xpbmU6IHtcbiAgICAgICAgZ2V0OiBTZXR0aW5ncy5uZXdsaW5lLFxuICAgICAgICBzZXQ6IFNldHRpbmdzLnNldE5ld2xpbmUsXG4gICAgfSxcblxuICAgIHN5bWJvbHM6IHtcbiAgICAgICAgZ2V0OiBTZXR0aW5ncy5zeW1ib2xzLFxuICAgICAgICBzZXQ6IFNldHRpbmdzLnNldFN5bWJvbHMsXG4gICAgfSxcblxuICAgIGRlZmF1bHRPcHRzOiB7XG4gICAgICAgIGdldDogU2V0dGluZ3MuZGVmYXVsdE9wdHMsXG4gICAgICAgIHNldDogU2V0dGluZ3Muc2V0RGVmYXVsdE9wdHMsXG4gICAgfSxcblxuICAgIGNvbG9yU3VwcG9ydDoge1xuICAgICAgICBnZXQ6IFNldHRpbmdzLkNvbG9ycy5nZXRTdXBwb3J0LFxuICAgICAgICBzZXQ6IFNldHRpbmdzLkNvbG9ycy5zZXRTdXBwb3J0LFxuICAgIH0sXG59XG4iLCJcInVzZSBzdHJpY3RcIlxuXG4vKipcbiAqIFRoZSB3aGl0ZWxpc3QgaXMgYWN0dWFsbHkgc3RvcmVkIGFzIGEgdHJlZSBmb3IgZmFzdGVyIGxvb2t1cCB0aW1lcyB3aGVuIHRoZXJlXG4gKiBhcmUgbXVsdGlwbGUgc2VsZWN0b3JzLiBPYmplY3RzIGNhbid0IGJlIHVzZWQgZm9yIHRoZSBub2Rlcywgd2hlcmUga2V5c1xuICogcmVwcmVzZW50IHZhbHVlcyBhbmQgdmFsdWVzIHJlcHJlc2VudCBjaGlsZHJlbiwgYmVjYXVzZSByZWd1bGFyIGV4cHJlc3Npb25zXG4gKiBhcmVuJ3QgcG9zc2libGUgdG8gdXNlLlxuICovXG5cbmZ1bmN0aW9uIGlzRXF1aXZhbGVudChlbnRyeSwgaXRlbSkge1xuICAgIGlmICh0eXBlb2YgZW50cnkgPT09IFwic3RyaW5nXCIgJiYgdHlwZW9mIGl0ZW0gPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgcmV0dXJuIGVudHJ5ID09PSBpdGVtXG4gICAgfSBlbHNlIGlmIChlbnRyeSBpbnN0YW5jZW9mIFJlZ0V4cCAmJiBpdGVtIGluc3RhbmNlb2YgUmVnRXhwKSB7XG4gICAgICAgIHJldHVybiBlbnRyeS50b1N0cmluZygpID09PSBpdGVtLnRvU3RyaW5nKClcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG59XG5cbmZ1bmN0aW9uIG1hdGNoZXMoZW50cnksIGl0ZW0pIHtcbiAgICBpZiAodHlwZW9mIGVudHJ5ID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIHJldHVybiBlbnRyeSA9PT0gaXRlbVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBlbnRyeS50ZXN0KGl0ZW0pXG4gICAgfVxufVxuXG5mdW5jdGlvbiBPbmx5KHZhbHVlKSB7XG4gICAgdGhpcy52YWx1ZSA9IHZhbHVlXG4gICAgdGhpcy5jaGlsZHJlbiA9IHVuZGVmaW5lZFxufVxuXG5mdW5jdGlvbiBmaW5kRXF1aXZhbGVudChub2RlLCBlbnRyeSkge1xuICAgIGlmIChub2RlLmNoaWxkcmVuID09IG51bGwpIHJldHVybiB1bmRlZmluZWRcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbm9kZS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgY2hpbGQgPSBub2RlLmNoaWxkcmVuW2ldXG5cbiAgICAgICAgaWYgKGlzRXF1aXZhbGVudChjaGlsZC52YWx1ZSwgZW50cnkpKSByZXR1cm4gY2hpbGRcbiAgICB9XG5cbiAgICByZXR1cm4gdW5kZWZpbmVkXG59XG5cbmZ1bmN0aW9uIGZpbmRNYXRjaGVzKG5vZGUsIGVudHJ5KSB7XG4gICAgaWYgKG5vZGUuY2hpbGRyZW4gPT0gbnVsbCkgcmV0dXJuIHVuZGVmaW5lZFxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBub2RlLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBjaGlsZCA9IG5vZGUuY2hpbGRyZW5baV1cblxuICAgICAgICBpZiAobWF0Y2hlcyhjaGlsZC52YWx1ZSwgZW50cnkpKSByZXR1cm4gY2hpbGRcbiAgICB9XG5cbiAgICByZXR1cm4gdW5kZWZpbmVkXG59XG5cbi8qKlxuICogQWRkIGEgbnVtYmVyIG9mIHNlbGVjdG9yc1xuICpcbiAqIEB0aGlzIHtUZXN0fVxuICovXG5leHBvcnRzLm9ubHlBZGQgPSBmdW5jdGlvbiAoLyogLi4uc2VsZWN0b3JzICovKSB7XG4gICAgdGhpcy5vbmx5ID0gbmV3IE9ubHkoKVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHNlbGVjdG9yID0gYXJndW1lbnRzW2ldXG5cbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHNlbGVjdG9yKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICAgICAgICAgICBcIkV4cGVjdGVkIHNlbGVjdG9yIFwiICsgaSArIFwiIHRvIGJlIGFuIGFycmF5XCIpXG4gICAgICAgIH1cblxuICAgICAgICBvbmx5QWRkU2luZ2xlKHRoaXMub25seSwgc2VsZWN0b3IsIGkpXG4gICAgfVxufVxuXG5mdW5jdGlvbiBvbmx5QWRkU2luZ2xlKG5vZGUsIHNlbGVjdG9yLCBpbmRleCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2VsZWN0b3IubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGVudHJ5ID0gc2VsZWN0b3JbaV1cblxuICAgICAgICAvLyBTdHJpbmdzIGFuZCByZWd1bGFyIGV4cHJlc3Npb25zIGFyZSB0aGUgb25seSB0aGluZ3MgYWxsb3dlZC5cbiAgICAgICAgaWYgKHR5cGVvZiBlbnRyeSAhPT0gXCJzdHJpbmdcIiAmJiAhKGVudHJ5IGluc3RhbmNlb2YgUmVnRXhwKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICAgICAgICAgICBcIlNlbGVjdG9yIFwiICsgaW5kZXggKyBcIiBtdXN0IGNvbnNpc3Qgb2Ygb25seSBzdHJpbmdzIGFuZC9vciBcIiArXG4gICAgICAgICAgICAgICAgXCJyZWd1bGFyIGV4cHJlc3Npb25zXCIpXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgY2hpbGQgPSBmaW5kRXF1aXZhbGVudChub2RlLCBlbnRyeSlcblxuICAgICAgICBpZiAoY2hpbGQgPT0gbnVsbCkge1xuICAgICAgICAgICAgY2hpbGQgPSBuZXcgT25seShlbnRyeSlcbiAgICAgICAgICAgIGlmIChub2RlLmNoaWxkcmVuID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBub2RlLmNoaWxkcmVuID0gW2NoaWxkXVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBub2RlLmNoaWxkcmVuLnB1c2goY2hpbGQpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBub2RlID0gY2hpbGRcbiAgICB9XG59XG5cbi8qKlxuICogVGhpcyBjaGVja3MgaWYgdGhlIHRlc3Qgd2FzIHdoaXRlbGlzdGVkIGluIGEgYHQub25seSgpYCBjYWxsLCBvciBmb3JcbiAqIGNvbnZlbmllbmNlLCByZXR1cm5zIGB0cnVlYCBpZiBgdC5vbmx5KClgIHdhcyBuZXZlciBjYWxsZWQuXG4gKi9cbmV4cG9ydHMuaXNPbmx5ID0gZnVuY3Rpb24gKHRlc3QpIHtcbiAgICB2YXIgcGF0aCA9IFtdXG4gICAgdmFyIGkgPSAwXG5cbiAgICB3aGlsZSAodGVzdC5yb290ICE9PSB0ZXN0ICYmIHRlc3Qub25seSA9PSBudWxsKSB7XG4gICAgICAgIHBhdGgucHVzaCh0ZXN0Lm5hbWUpXG4gICAgICAgIHRlc3QgPSB0ZXN0LnBhcmVudFxuICAgICAgICBpKytcbiAgICB9XG5cbiAgICAvLyBJZiB0aGVyZSBpc24ndCBhbnkgYG9ubHlgIGFjdGl2ZSwgdGhlbiBsZXQncyBza2lwIHRoZSBjaGVjayBhbmQgcmV0dXJuXG4gICAgLy8gYHRydWVgIGZvciBjb252ZW5pZW5jZS5cbiAgICB2YXIgb25seSA9IHRlc3Qub25seVxuXG4gICAgaWYgKG9ubHkgIT0gbnVsbCkge1xuICAgICAgICB3aGlsZSAoaSAhPT0gMCkge1xuICAgICAgICAgICAgb25seSA9IGZpbmRNYXRjaGVzKG9ubHksIHBhdGhbLS1pXSlcbiAgICAgICAgICAgIGlmIChvbmx5ID09IG51bGwpIHJldHVybiBmYWxzZVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWVcbn1cbiIsIlwidXNlIHN0cmljdFwiXG5cbnZhciBtZXRob2RzID0gcmVxdWlyZShcIi4uL21ldGhvZHNcIilcblxuLyoqXG4gKiBBbGwgdGhlIHJlcG9ydCB0eXBlcy4gVGhlIG9ubHkgcmVhc29uIHRoZXJlIGFyZSBtb3JlIHRoYW4gdHdvIHR5cGVzIChub3JtYWxcbiAqIGFuZCBob29rKSBpcyBmb3IgdGhlIHVzZXIncyBiZW5lZml0IChkZXYgdG9vbHMsIGB1dGlsLmluc3BlY3RgLCBldGMuKVxuICovXG5cbnZhciBUeXBlcyA9IGV4cG9ydHMuVHlwZXMgPSBPYmplY3QuZnJlZXplKHtcbiAgICBTdGFydDogMCxcbiAgICBFbnRlcjogMSxcbiAgICBMZWF2ZTogMixcbiAgICBQYXNzOiAzLFxuICAgIEZhaWw6IDQsXG4gICAgU2tpcDogNSxcbiAgICBFbmQ6IDYsXG4gICAgRXJyb3I6IDcsXG5cbiAgICAvLyBOb3RlIHRoYXQgYEhvb2tgIGlzIGRlbm90ZWQgYnkgdGhlIDR0aCBiaXQgc2V0LCB0byBzYXZlIHNvbWUgc3BhY2UgKGFuZFxuICAgIC8vIHRvIHNpbXBsaWZ5IHRoZSB0eXBlIHJlcHJlc2VudGF0aW9uKS5cbiAgICBIb29rOiA4LFxuICAgIEJlZm9yZUFsbDogOCB8IDAsXG4gICAgQmVmb3JlRWFjaDogOCB8IDEsXG4gICAgQWZ0ZXJFYWNoOiA4IHwgMixcbiAgICBBZnRlckFsbDogOCB8IDMsXG59KVxuXG5leHBvcnRzLlJlcG9ydCA9IFJlcG9ydFxuZnVuY3Rpb24gUmVwb3J0KHR5cGUpIHtcbiAgICB0aGlzLl8gPSB0eXBlXG59XG5cbi8vIEF2b2lkIGEgcmVjdXJzaXZlIGNhbGwgd2hlbiBgaW5zcGVjdGBpbmcgYSByZXN1bHQgd2hpbGUgc3RpbGwga2VlcGluZyBpdFxuLy8gc3R5bGVkIGxpa2UgaXQgd291bGQgYmUgbm9ybWFsbHkuIEVhY2ggdHlwZSB1c2VzIGEgbmFtZWQgc2luZ2xldG9uIGZhY3RvcnkgdG9cbi8vIGVuc3VyZSBlbmdpbmVzIHNob3cgdGhlIGNvcnJlY3QgYG5hbWVgL2BkaXNwbGF5TmFtZWAgZm9yIHRoZSB0eXBlLlxuZnVuY3Rpb24gaW5pdEluc3BlY3QoaW5zcGVjdCwgcmVwb3J0KSB7XG4gICAgdmFyIHR5cGUgPSByZXBvcnQuX1xuXG4gICAgaWYgKHR5cGUgJiBUeXBlcy5Ib29rKSB7XG4gICAgICAgIGluc3BlY3Quc3RhZ2UgPSByZXBvcnQuc3RhZ2VcbiAgICB9XG5cbiAgICBpZiAodHlwZSAhPT0gVHlwZXMuU3RhcnQgJiZcbiAgICAgICAgICAgIHR5cGUgIT09IFR5cGVzLkVuZCAmJlxuICAgICAgICAgICAgdHlwZSAhPT0gVHlwZXMuRXJyb3IpIHtcbiAgICAgICAgaW5zcGVjdC5wYXRoID0gcmVwb3J0LnBhdGhcbiAgICB9XG5cbiAgICBpZiAodHlwZSAmIFR5cGVzLkhvb2spIHtcbiAgICAgICAgaW5zcGVjdC5yb290UGF0aCA9IHJlcG9ydC5yb290UGF0aFxuICAgIH1cblxuICAgIC8vIE9ubHkgYWRkIHRoZSByZWxldmFudCBwcm9wZXJ0aWVzXG4gICAgaWYgKHR5cGUgPT09IFR5cGVzLkZhaWwgfHxcbiAgICAgICAgICAgIHR5cGUgPT09IFR5cGVzLkVycm9yIHx8XG4gICAgICAgICAgICB0eXBlICYgVHlwZXMuSG9vaykge1xuICAgICAgICBpbnNwZWN0LnZhbHVlID0gcmVwb3J0LnZhbHVlXG4gICAgfVxuXG4gICAgaWYgKHR5cGUgPT09IFR5cGVzLkVudGVyIHx8XG4gICAgICAgICAgICB0eXBlID09PSBUeXBlcy5QYXNzIHx8XG4gICAgICAgICAgICB0eXBlID09PSBUeXBlcy5GYWlsKSB7XG4gICAgICAgIGluc3BlY3QuZHVyYXRpb24gPSByZXBvcnQuZHVyYXRpb25cbiAgICAgICAgaW5zcGVjdC5zbG93ID0gcmVwb3J0LnNsb3dcbiAgICB9XG5cbiAgICBpZiAodHlwZSA9PT0gVHlwZXMuRmFpbCkge1xuICAgICAgICBpbnNwZWN0LmlzRmFpbGFibGUgPSByZXBvcnQuaXNGYWlsYWJsZVxuICAgIH1cbn1cblxubWV0aG9kcyhSZXBvcnQsIHtcbiAgICAvLyBUaGUgcmVwb3J0IHR5cGVzXG4gICAgZ2V0IGlzU3RhcnQoKSB7IHJldHVybiB0aGlzLl8gPT09IFR5cGVzLlN0YXJ0IH0sXG4gICAgZ2V0IGlzRW50ZXIoKSB7IHJldHVybiB0aGlzLl8gPT09IFR5cGVzLkVudGVyIH0sXG4gICAgZ2V0IGlzTGVhdmUoKSB7IHJldHVybiB0aGlzLl8gPT09IFR5cGVzLkxlYXZlIH0sXG4gICAgZ2V0IGlzUGFzcygpIHsgcmV0dXJuIHRoaXMuXyA9PT0gVHlwZXMuUGFzcyB9LFxuICAgIGdldCBpc0ZhaWwoKSB7IHJldHVybiB0aGlzLl8gPT09IFR5cGVzLkZhaWwgfSxcbiAgICBnZXQgaXNTa2lwKCkgeyByZXR1cm4gdGhpcy5fID09PSBUeXBlcy5Ta2lwIH0sXG4gICAgZ2V0IGlzRW5kKCkgeyByZXR1cm4gdGhpcy5fID09PSBUeXBlcy5FbmQgfSxcbiAgICBnZXQgaXNFcnJvcigpIHsgcmV0dXJuIHRoaXMuXyA9PT0gVHlwZXMuRXJyb3IgfSxcbiAgICBnZXQgaXNIb29rKCkgeyByZXR1cm4gKHRoaXMuXyAmIFR5cGVzLkhvb2spICE9PSAwIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgYSBzdHJpbmdpZmllZCBkZXNjcmlwdGlvbiBvZiB0aGUgdHlwZS5cbiAgICAgKi9cbiAgICBnZXQgdHlwZSgpIHtcbiAgICAgICAgc3dpdGNoICh0aGlzLl8pIHtcbiAgICAgICAgY2FzZSBUeXBlcy5TdGFydDogcmV0dXJuIFwic3RhcnRcIlxuICAgICAgICBjYXNlIFR5cGVzLkVudGVyOiByZXR1cm4gXCJlbnRlclwiXG4gICAgICAgIGNhc2UgVHlwZXMuTGVhdmU6IHJldHVybiBcImxlYXZlXCJcbiAgICAgICAgY2FzZSBUeXBlcy5QYXNzOiByZXR1cm4gXCJwYXNzXCJcbiAgICAgICAgY2FzZSBUeXBlcy5GYWlsOiByZXR1cm4gXCJmYWlsXCJcbiAgICAgICAgY2FzZSBUeXBlcy5Ta2lwOiByZXR1cm4gXCJza2lwXCJcbiAgICAgICAgY2FzZSBUeXBlcy5FbmQ6IHJldHVybiBcImVuZFwiXG4gICAgICAgIGNhc2UgVHlwZXMuRXJyb3I6IHJldHVybiBcImVycm9yXCJcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGlmICh0aGlzLl8gJiBUeXBlcy5Ib29rKSByZXR1cm4gXCJob29rXCJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInVucmVhY2hhYmxlXCIpXG4gICAgICAgIH1cbiAgICB9LFxufSlcblxuZXhwb3J0cy5TdGFydCA9IFN0YXJ0UmVwb3J0XG5mdW5jdGlvbiBTdGFydFJlcG9ydCgpIHtcbiAgICBSZXBvcnQuY2FsbCh0aGlzLCBUeXBlcy5TdGFydClcbn1cbm1ldGhvZHMoU3RhcnRSZXBvcnQsIFJlcG9ydCwge1xuICAgIGluc3BlY3Q6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBmdW5jdGlvbiBSZXBvcnQocmVwb3J0KSB7XG4gICAgICAgICAgICBpbml0SW5zcGVjdCh0aGlzLCByZXBvcnQpXG4gICAgICAgIH0odGhpcylcbiAgICB9LFxufSlcblxuZXhwb3J0cy5FbnRlciA9IEVudGVyUmVwb3J0XG5mdW5jdGlvbiBFbnRlclJlcG9ydChwYXRoLCBkdXJhdGlvbiwgc2xvdykge1xuICAgIFJlcG9ydC5jYWxsKHRoaXMsIFR5cGVzLkVudGVyKVxuICAgIHRoaXMucGF0aCA9IHBhdGhcbiAgICB0aGlzLmR1cmF0aW9uID0gZHVyYXRpb25cbiAgICB0aGlzLnNsb3cgPSBzbG93XG59XG5tZXRob2RzKEVudGVyUmVwb3J0LCBSZXBvcnQsIHtcbiAgICAvKipcbiAgICAgKiBTbyB1dGlsLmluc3BlY3QgcHJvdmlkZXMgbW9yZSBzZW5zaWJsZSBvdXRwdXQgZm9yIHRlc3RpbmcvZXRjLlxuICAgICAqL1xuICAgIGluc3BlY3Q6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBmdW5jdGlvbiBFbnRlclJlcG9ydChyZXBvcnQpIHtcbiAgICAgICAgICAgIGluaXRJbnNwZWN0KHRoaXMsIHJlcG9ydClcbiAgICAgICAgfSh0aGlzKVxuICAgIH0sXG59KVxuXG5leHBvcnRzLkxlYXZlID0gTGVhdmVSZXBvcnRcbmZ1bmN0aW9uIExlYXZlUmVwb3J0KHBhdGgpIHtcbiAgICBSZXBvcnQuY2FsbCh0aGlzLCBUeXBlcy5MZWF2ZSlcbiAgICB0aGlzLnBhdGggPSBwYXRoXG59XG5tZXRob2RzKExlYXZlUmVwb3J0LCBSZXBvcnQsIHtcbiAgICAvKipcbiAgICAgKiBTbyB1dGlsLmluc3BlY3QgcHJvdmlkZXMgbW9yZSBzZW5zaWJsZSBvdXRwdXQgZm9yIHRlc3RpbmcvZXRjLlxuICAgICAqL1xuICAgIGluc3BlY3Q6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBmdW5jdGlvbiBMZWF2ZVJlcG9ydChyZXBvcnQpIHtcbiAgICAgICAgICAgIGluaXRJbnNwZWN0KHRoaXMsIHJlcG9ydClcbiAgICAgICAgfSh0aGlzKVxuICAgIH0sXG59KVxuXG5leHBvcnRzLlBhc3MgPSBQYXNzUmVwb3J0XG5mdW5jdGlvbiBQYXNzUmVwb3J0KHBhdGgsIGR1cmF0aW9uLCBzbG93KSB7XG4gICAgUmVwb3J0LmNhbGwodGhpcywgVHlwZXMuUGFzcylcbiAgICB0aGlzLnBhdGggPSBwYXRoXG4gICAgdGhpcy5kdXJhdGlvbiA9IGR1cmF0aW9uXG4gICAgdGhpcy5zbG93ID0gc2xvd1xufVxubWV0aG9kcyhQYXNzUmVwb3J0LCBSZXBvcnQsIHtcbiAgICAvKipcbiAgICAgKiBTbyB1dGlsLmluc3BlY3QgcHJvdmlkZXMgbW9yZSBzZW5zaWJsZSBvdXRwdXQgZm9yIHRlc3RpbmcvZXRjLlxuICAgICAqL1xuICAgIGluc3BlY3Q6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBmdW5jdGlvbiBQYXNzUmVwb3J0KHJlcG9ydCkge1xuICAgICAgICAgICAgaW5pdEluc3BlY3QodGhpcywgcmVwb3J0KVxuICAgICAgICB9KHRoaXMpXG4gICAgfSxcbn0pXG5cbmV4cG9ydHMuRmFpbCA9IEZhaWxSZXBvcnRcbmZ1bmN0aW9uIEZhaWxSZXBvcnQocGF0aCwgZXJyb3IsIGR1cmF0aW9uLCBzbG93LCBpc0ZhaWxhYmxlKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LXBhcmFtcywgbWF4LWxlblxuICAgIFJlcG9ydC5jYWxsKHRoaXMsIFR5cGVzLkZhaWwpXG4gICAgdGhpcy5wYXRoID0gcGF0aFxuICAgIHRoaXMuZXJyb3IgPSBlcnJvclxuICAgIHRoaXMuZHVyYXRpb24gPSBkdXJhdGlvblxuICAgIHRoaXMuc2xvdyA9IHNsb3dcbiAgICB0aGlzLmlzRmFpbGFibGUgPSBpc0ZhaWxhYmxlXG59XG5tZXRob2RzKEZhaWxSZXBvcnQsIFJlcG9ydCwge1xuICAgIC8qKlxuICAgICAqIFNvIHV0aWwuaW5zcGVjdCBwcm92aWRlcyBtb3JlIHNlbnNpYmxlIG91dHB1dCBmb3IgdGVzdGluZy9ldGMuXG4gICAgICovXG4gICAgaW5zcGVjdDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IGZ1bmN0aW9uIEZhaWxSZXBvcnQocmVwb3J0KSB7XG4gICAgICAgICAgICBpbml0SW5zcGVjdCh0aGlzLCByZXBvcnQpXG4gICAgICAgIH0odGhpcylcbiAgICB9LFxufSlcblxuZXhwb3J0cy5Ta2lwID0gU2tpcFJlcG9ydFxuZnVuY3Rpb24gU2tpcFJlcG9ydChwYXRoKSB7XG4gICAgUmVwb3J0LmNhbGwodGhpcywgVHlwZXMuU2tpcClcbiAgICB0aGlzLnBhdGggPSBwYXRoXG59XG5tZXRob2RzKFNraXBSZXBvcnQsIFJlcG9ydCwge1xuICAgIC8qKlxuICAgICAqIFNvIHV0aWwuaW5zcGVjdCBwcm92aWRlcyBtb3JlIHNlbnNpYmxlIG91dHB1dCBmb3IgdGVzdGluZy9ldGMuXG4gICAgICovXG4gICAgaW5zcGVjdDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IGZ1bmN0aW9uIFNraXBSZXBvcnQocmVwb3J0KSB7XG4gICAgICAgICAgICBpbml0SW5zcGVjdCh0aGlzLCByZXBvcnQpXG4gICAgICAgIH0odGhpcylcbiAgICB9LFxufSlcblxuZXhwb3J0cy5FbmQgPSBFbmRSZXBvcnRcbmZ1bmN0aW9uIEVuZFJlcG9ydCgpIHtcbiAgICBSZXBvcnQuY2FsbCh0aGlzLCBUeXBlcy5FbmQpXG59XG5tZXRob2RzKEVuZFJlcG9ydCwgUmVwb3J0LCB7XG4gICAgLyoqXG4gICAgICogU28gdXRpbC5pbnNwZWN0IHByb3ZpZGVzIG1vcmUgc2Vuc2libGUgb3V0cHV0IGZvciB0ZXN0aW5nL2V0Yy5cbiAgICAgKi9cbiAgICBpbnNwZWN0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgZnVuY3Rpb24gRW5kUmVwb3J0KHJlcG9ydCkge1xuICAgICAgICAgICAgaW5pdEluc3BlY3QodGhpcywgcmVwb3J0KVxuICAgICAgICB9KHRoaXMpXG4gICAgfSxcbn0pXG5cbmV4cG9ydHMuRXJyb3IgPSBFcnJvclJlcG9ydFxuZnVuY3Rpb24gRXJyb3JSZXBvcnQoZXJyb3IpIHtcbiAgICBSZXBvcnQuY2FsbCh0aGlzLCBUeXBlcy5FcnJvcilcbiAgICB0aGlzLmVycm9yID0gZXJyb3Jcbn1cbm1ldGhvZHMoRXJyb3JSZXBvcnQsIFJlcG9ydCwge1xuICAgIC8qKlxuICAgICAqIFNvIHV0aWwuaW5zcGVjdCBwcm92aWRlcyBtb3JlIHNlbnNpYmxlIG91dHB1dCBmb3IgdGVzdGluZy9ldGMuXG4gICAgICovXG4gICAgaW5zcGVjdDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IGZ1bmN0aW9uIEVycm9yUmVwb3J0KHJlcG9ydCkge1xuICAgICAgICAgICAgaW5pdEluc3BlY3QodGhpcywgcmVwb3J0KVxuICAgICAgICB9KHRoaXMpXG4gICAgfSxcbn0pXG5cbnZhciBIb29rTWV0aG9kcyA9IHtcbiAgICBnZXQgc3RhZ2UoKSB7XG4gICAgICAgIHN3aXRjaCAodGhpcy5fKSB7XG4gICAgICAgIGNhc2UgVHlwZXMuQmVmb3JlQWxsOiByZXR1cm4gXCJiZWZvcmUgYWxsXCJcbiAgICAgICAgY2FzZSBUeXBlcy5CZWZvcmVFYWNoOiByZXR1cm4gXCJiZWZvcmUgZWFjaFwiXG4gICAgICAgIGNhc2UgVHlwZXMuQWZ0ZXJFYWNoOiByZXR1cm4gXCJhZnRlciBlYWNoXCJcbiAgICAgICAgY2FzZSBUeXBlcy5BZnRlckFsbDogcmV0dXJuIFwiYWZ0ZXIgYWxsXCJcbiAgICAgICAgZGVmYXVsdDogdGhyb3cgbmV3IEVycm9yKFwidW5yZWFjaGFibGVcIilcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBnZXQgaXNCZWZvcmVBbGwoKSB7IHJldHVybiB0aGlzLl8gPT09IFR5cGVzLkJlZm9yZUFsbCB9LFxuICAgIGdldCBpc0JlZm9yZUVhY2goKSB7IHJldHVybiB0aGlzLl8gPT09IFR5cGVzLkJlZm9yZUVhY2ggfSxcbiAgICBnZXQgaXNBZnRlckVhY2goKSB7IHJldHVybiB0aGlzLl8gPT09IFR5cGVzLkFmdGVyRWFjaCB9LFxuICAgIGdldCBpc0FmdGVyQWxsKCkgeyByZXR1cm4gdGhpcy5fID09PSBUeXBlcy5BZnRlckFsbCB9LFxufVxuXG5leHBvcnRzLkhvb2tFcnJvciA9IEhvb2tFcnJvclxuZnVuY3Rpb24gSG9va0Vycm9yKHN0YWdlLCBmdW5jLCBlcnJvcikge1xuICAgIHRoaXMuXyA9IHN0YWdlXG4gICAgdGhpcy5uYW1lID0gZnVuYy5uYW1lIHx8IGZ1bmMuZGlzcGxheU5hbWUgfHwgXCJcIlxuICAgIHRoaXMuZXJyb3IgPSBlcnJvclxufVxubWV0aG9kcyhIb29rRXJyb3IsIEhvb2tNZXRob2RzKVxuXG5leHBvcnRzLkhvb2sgPSBIb29rUmVwb3J0XG5mdW5jdGlvbiBIb29rUmVwb3J0KHBhdGgsIHJvb3RQYXRoLCBob29rRXJyb3IpIHtcbiAgICBSZXBvcnQuY2FsbCh0aGlzLCBob29rRXJyb3IuXylcbiAgICB0aGlzLnBhdGggPSBwYXRoXG4gICAgdGhpcy5yb290UGF0aCA9IHJvb3RQYXRoXG4gICAgdGhpcy5uYW1lID0gaG9va0Vycm9yLm5hbWVcbiAgICB0aGlzLmVycm9yID0gaG9va0Vycm9yLmVycm9yXG59XG5tZXRob2RzKEhvb2tSZXBvcnQsIFJlcG9ydCwgSG9va01ldGhvZHMsIHtcbiAgICBnZXQgaG9va0Vycm9yKCkgeyByZXR1cm4gbmV3IEhvb2tFcnJvcih0aGlzLl8sIHRoaXMsIHRoaXMuZXJyb3IpIH0sXG59KVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxudmFyIG1ldGhvZHMgPSByZXF1aXJlKFwiLi4vbWV0aG9kc1wiKVxudmFyIHBlYWNoID0gcmVxdWlyZShcIi4uL3V0aWxcIikucGVhY2hcbnZhciBSZXBvcnRzID0gcmVxdWlyZShcIi4vcmVwb3J0c1wiKVxudmFyIGlzT25seSA9IHJlcXVpcmUoXCIuL29ubHlcIikuaXNPbmx5XG52YXIgVHlwZXMgPSBSZXBvcnRzLlR5cGVzXG5cbi8qKlxuICogVGhlIHRlc3RzIGFyZSBsYWlkIG91dCBpbiBhIHZlcnkgZGF0YS1kcml2ZW4gZGVzaWduLiBXaXRoIGV4Y2VwdGlvbiBvZiB0aGVcbiAqIHJlcG9ydHMsIHRoZXJlIGlzIG1pbmltYWwgb2JqZWN0IG9yaWVudGF0aW9uIGFuZCB6ZXJvIHZpcnR1YWwgZGlzcGF0Y2guXG4gKiBIZXJlJ3MgYSBxdWljayBvdmVydmlldzpcbiAqXG4gKiAtIFRoZSB0ZXN0IGhhbmRsaW5nIGRpc3BhdGNoZXMgYmFzZWQgb24gdmFyaW91cyBhdHRyaWJ1dGVzIHRoZSB0ZXN0IGhhcy4gRm9yXG4gKiAgIGV4YW1wbGUsIHJvb3RzIGFyZSBrbm93biBieSBhIGNpcmN1bGFyIHJvb3QgcmVmZXJlbmNlLCBhbmQgc2tpcHBlZCB0ZXN0c1xuICogICBhcmUga25vd24gYnkgbm90IGhhdmluZyBhIGNhbGxiYWNrLlxuICpcbiAqIC0gVGhlIHRlc3QgZXZhbHVhdGlvbiBpcyB2ZXJ5IHByb2NlZHVyYWwuIEFsdGhvdWdoIGl0J3MgdmVyeSBoaWdobHlcbiAqICAgYXN5bmNocm9ub3VzLCB0aGUgdXNlIG9mIHByb21pc2VzIGxpbmVhcml6ZSB0aGUgbG9naWMsIHNvIGl0IHJlYWRzIHZlcnlcbiAqICAgbXVjaCBsaWtlIGEgcmVjdXJzaXZlIHNldCBvZiBzdGVwcy5cbiAqXG4gKiAtIFRoZSBkYXRhIHR5cGVzIGFyZSBtb3N0bHkgZWl0aGVyIHBsYWluIG9iamVjdHMgb3IgY2xhc3NlcyB3aXRoIG5vIG1ldGhvZHMsXG4gKiAgIHRoZSBsYXR0ZXIgbW9zdGx5IGZvciBkZWJ1Z2dpbmcgaGVscC4gVGhpcyBhbHNvIGF2b2lkcyBtb3N0IG9mIHRoZVxuICogICBpbmRpcmVjdGlvbiByZXF1aXJlZCB0byBhY2NvbW1vZGF0ZSBicmVha2luZyBhYnN0cmFjdGlvbnMsIHdoaWNoIHRoZSBBUElcbiAqICAgbWV0aG9kcyBmcmVxdWVudGx5IG5lZWQgdG8gZG8uXG4gKi9cblxuLy8gUHJldmVudCBTaW5vbiBpbnRlcmZlcmVuY2Ugd2hlbiB0aGV5IGluc3RhbGwgdGhlaXIgbW9ja3NcbnZhciBzZXRUaW1lb3V0ID0gZ2xvYmFsLnNldFRpbWVvdXRcbnZhciBjbGVhclRpbWVvdXQgPSBnbG9iYWwuY2xlYXJUaW1lb3V0XG52YXIgbm93ID0gZ2xvYmFsLkRhdGUubm93XG5cbi8qKlxuICogQmFzaWMgZGF0YSB0eXBlc1xuICovXG5mdW5jdGlvbiBSZXN1bHQodGltZSwgYXR0ZW1wdCkge1xuICAgIHRoaXMudGltZSA9IHRpbWVcbiAgICB0aGlzLmNhdWdodCA9IGF0dGVtcHQuY2F1Z2h0XG4gICAgdGhpcy52YWx1ZSA9IGF0dGVtcHQuY2F1Z2h0ID8gYXR0ZW1wdC52YWx1ZSA6IHVuZGVmaW5lZFxufVxuXG4vKipcbiAqIE92ZXJ2aWV3IG9mIHRoZSB0ZXN0IHByb3BlcnRpZXM6XG4gKlxuICogLSBgbWV0aG9kc2AgLSBBIGRlcHJlY2F0ZWQgcmVmZXJlbmNlIHRvIHRoZSBBUEkgbWV0aG9kc1xuICogLSBgcm9vdGAgLSBUaGUgcm9vdCB0ZXN0XG4gKiAtIGByZXBvcnRlcnNgIC0gVGhlIGxpc3Qgb2YgcmVwb3J0ZXJzXG4gKiAtIGBjdXJyZW50YCAtIEEgcmVmZXJlbmNlIHRvIHRoZSBjdXJyZW50bHkgYWN0aXZlIHRlc3RcbiAqIC0gYHRpbWVvdXRgIC0gVGhlIHRlc3RzJ3MgdGltZW91dCwgb3IgMCBpZiBpbmhlcml0ZWRcbiAqIC0gYHNsb3dgIC0gVGhlIHRlc3RzJ3Mgc2xvdyB0aHJlc2hvbGRcbiAqIC0gYG5hbWVgIC0gVGhlIHRlc3QncyBuYW1lXG4gKiAtIGBpbmRleGAgLSBUaGUgdGVzdCdzIGluZGV4XG4gKiAtIGBwYXJlbnRgIC0gVGhlIHRlc3QncyBwYXJlbnRcbiAqIC0gYGNhbGxiYWNrYCAtIFRoZSB0ZXN0J3MgY2FsbGJhY2tcbiAqIC0gYHRlc3RzYCAtIFRoZSB0ZXN0J3MgY2hpbGQgdGVzdHNcbiAqIC0gYGJlZm9yZUFsbGAsIGBiZWZvcmVFYWNoYCwgYGFmdGVyRWFjaGAsIGBhZnRlckFsbGAgLSBUaGUgdGVzdCdzIHZhcmlvdXNcbiAqICAgc2NoZWR1bGVkIGhvb2tzXG4gKlxuICogTWFueSBvZiB0aGVzZSBwcm9wZXJ0aWVzIGFyZW4ndCBwcmVzZW50IG9uIGluaXRpYWxpemF0aW9uIHRvIHNhdmUgbWVtb3J5LlxuICovXG5cbi8vIFRPRE86IHJlbW92ZSBgdGVzdC5tZXRob2RzYCBpbiAwLjRcbmZ1bmN0aW9uIE5vcm1hbChuYW1lLCBpbmRleCwgcGFyZW50LCBjYWxsYmFjaykge1xuICAgIHZhciBjaGlsZCA9IE9iamVjdC5jcmVhdGUocGFyZW50Lm1ldGhvZHMpXG5cbiAgICBjaGlsZC5fID0gdGhpc1xuICAgIHRoaXMubWV0aG9kcyA9IGNoaWxkXG4gICAgdGhpcy5sb2NrZWQgPSB0cnVlXG4gICAgdGhpcy5yb290ID0gcGFyZW50LnJvb3RcbiAgICB0aGlzLm5hbWUgPSBuYW1lXG4gICAgdGhpcy5pbmRleCA9IGluZGV4fDBcbiAgICB0aGlzLnBhcmVudCA9IHBhcmVudFxuICAgIHRoaXMuY2FsbGJhY2sgPSBjYWxsYmFja1xuICAgIHRoaXMuaXNGYWlsYWJsZSA9IHBhcmVudC5pc0ZhaWxhYmxlXG4gICAgdGhpcy5hdHRlbXB0cyA9IHBhcmVudC5hdHRlbXB0c1xufVxuXG5mdW5jdGlvbiBTa2lwcGVkKG5hbWUsIGluZGV4LCBwYXJlbnQpIHtcbiAgICB0aGlzLmxvY2tlZCA9IHRydWVcbiAgICB0aGlzLnJvb3QgPSBwYXJlbnQucm9vdFxuICAgIHRoaXMubmFtZSA9IG5hbWVcbiAgICB0aGlzLmluZGV4ID0gaW5kZXh8MFxuICAgIHRoaXMucGFyZW50ID0gcGFyZW50XG59XG5cbi8vIFRPRE86IHJlbW92ZSBgdGVzdC5tZXRob2RzYCBpbiAwLjRcbmZ1bmN0aW9uIFJvb3QobWV0aG9kcykge1xuICAgIHRoaXMubG9ja2VkID0gZmFsc2VcbiAgICB0aGlzLm1ldGhvZHMgPSBtZXRob2RzXG4gICAgdGhpcy5yZXBvcnRlcklkcyA9IFtdXG4gICAgdGhpcy5yZXBvcnRlcnMgPSBbXVxuICAgIHRoaXMuY3VycmVudCA9IHRoaXNcbiAgICB0aGlzLnJvb3QgPSB0aGlzXG4gICAgdGhpcy50aW1lb3V0ID0gMFxuICAgIHRoaXMuc2xvdyA9IDBcbiAgICB0aGlzLmF0dGVtcHRzID0gMVxuICAgIHRoaXMuaXNGYWlsYWJsZSA9IGZhbHNlXG59XG5cbi8qKlxuICogQmFzZSB0ZXN0cyAoaS5lLiBkZWZhdWx0IGV4cG9ydCwgcmVzdWx0IG9mIGBpbnRlcm5hbC5yb290KClgKS5cbiAqL1xuXG5leHBvcnRzLmNyZWF0ZVJvb3QgPSBmdW5jdGlvbiAobWV0aG9kcykge1xuICAgIHJldHVybiBuZXcgUm9vdChtZXRob2RzKVxufVxuXG4vKipcbiAqIFNldCB1cCBlYWNoIHRlc3QgdHlwZS5cbiAqL1xuXG4vKipcbiAqIEEgbm9ybWFsIHRlc3QgdGhyb3VnaCBgdC50ZXN0KClgLlxuICovXG5cbmV4cG9ydHMuYWRkTm9ybWFsID0gZnVuY3Rpb24gKHBhcmVudCwgbmFtZSwgY2FsbGJhY2spIHtcbiAgICB2YXIgaW5kZXggPSBwYXJlbnQudGVzdHMgIT0gbnVsbCA/IHBhcmVudC50ZXN0cy5sZW5ndGggOiAwXG4gICAgdmFyIGJhc2UgPSBuZXcgTm9ybWFsKG5hbWUsIGluZGV4LCBwYXJlbnQsIGNhbGxiYWNrKVxuXG4gICAgaWYgKGluZGV4KSB7XG4gICAgICAgIHBhcmVudC50ZXN0cy5wdXNoKGJhc2UpXG4gICAgfSBlbHNlIHtcbiAgICAgICAgcGFyZW50LnRlc3RzID0gW2Jhc2VdXG4gICAgfVxufVxuXG4vKipcbiAqIEEgc2tpcHBlZCB0ZXN0IHRocm91Z2ggYHQudGVzdFNraXAoKWAuXG4gKi9cbmV4cG9ydHMuYWRkU2tpcHBlZCA9IGZ1bmN0aW9uIChwYXJlbnQsIG5hbWUpIHtcbiAgICB2YXIgaW5kZXggPSBwYXJlbnQudGVzdHMgIT0gbnVsbCA/IHBhcmVudC50ZXN0cy5sZW5ndGggOiAwXG4gICAgdmFyIGJhc2UgPSBuZXcgU2tpcHBlZChuYW1lLCBpbmRleCwgcGFyZW50KVxuXG4gICAgaWYgKGluZGV4KSB7XG4gICAgICAgIHBhcmVudC50ZXN0cy5wdXNoKGJhc2UpXG4gICAgfSBlbHNlIHtcbiAgICAgICAgcGFyZW50LnRlc3RzID0gW2Jhc2VdXG4gICAgfVxufVxuXG4vKipcbiAqIENsZWFyIHRoZSB0ZXN0cyBpbiBwbGFjZS5cbiAqL1xuZXhwb3J0cy5jbGVhclRlc3RzID0gZnVuY3Rpb24gKHBhcmVudCkge1xuICAgIHBhcmVudC50ZXN0cyA9IG51bGxcbn1cblxuLyoqXG4gKiBFeGVjdXRlIHRoZSB0ZXN0c1xuICovXG5cbmZ1bmN0aW9uIHBhdGgodGVzdCkge1xuICAgIHZhciByZXQgPSBbXVxuXG4gICAgd2hpbGUgKHRlc3Qucm9vdCAhPT0gdGVzdCkge1xuICAgICAgICByZXQucHVzaCh7bmFtZTogdGVzdC5uYW1lLCBpbmRleDogdGVzdC5pbmRleH0pXG4gICAgICAgIHRlc3QgPSB0ZXN0LnBhcmVudFxuICAgIH1cblxuICAgIHJldHVybiByZXQucmV2ZXJzZSgpXG59XG5cbi8vIFRPRE86IGNhY2hlIGFuZCByZW1vdmUgdGhlc2UgdHJhdmVyc2FscyBmb3IgMC40LlxuLy8gTm90ZSB0aGF0IGEgdGltZW91dCBvZiAwIG1lYW5zIHRvIGluaGVyaXQgdGhlIHBhcmVudC5cbmV4cG9ydHMudGltZW91dCA9IGZ1bmN0aW9uICh0ZXN0KSB7XG4gICAgd2hpbGUgKCF0ZXN0LnRpbWVvdXQgJiYgdGVzdC5yb290ICE9PSB0ZXN0KSB7XG4gICAgICAgIHRlc3QgPSB0ZXN0LnBhcmVudFxuICAgIH1cblxuICAgIHJldHVybiB0ZXN0LnRpbWVvdXQgfHwgMjAwMCAvLyBtcyAtIGRlZmF1bHQgdGltZW91dFxufVxuXG4vLyBOb3RlIHRoYXQgYSBzbG93bmVzcyB0aHJlc2hvbGQgb2YgMCBtZWFucyB0byBpbmhlcml0IHRoZSBwYXJlbnQuXG5leHBvcnRzLnNsb3cgPSBmdW5jdGlvbiAodGVzdCkge1xuICAgIHdoaWxlICghdGVzdC5zbG93ICYmIHRlc3Qucm9vdCAhPT0gdGVzdCkge1xuICAgICAgICB0ZXN0ID0gdGVzdC5wYXJlbnRcbiAgICB9XG5cbiAgICByZXR1cm4gdGVzdC5zbG93IHx8IDc1IC8vIG1zIC0gZGVmYXVsdCBzbG93IHRocmVzaG9sZFxufVxuXG5mdW5jdGlvbiByZXBvcnQodGVzdCwgdHlwZSwgYXJnMSwgYXJnMikge1xuICAgIGZ1bmN0aW9uIGludm9rZVJlcG9ydGVyKHJlcG9ydGVyKSB7XG4gICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICBjYXNlIFR5cGVzLlN0YXJ0OlxuICAgICAgICAgICAgcmV0dXJuIHJlcG9ydGVyKG5ldyBSZXBvcnRzLlN0YXJ0KCkpXG5cbiAgICAgICAgY2FzZSBUeXBlcy5FbnRlcjpcbiAgICAgICAgICAgIHJldHVybiByZXBvcnRlcihcbiAgICAgICAgICAgICAgICBuZXcgUmVwb3J0cy5FbnRlcihwYXRoKHRlc3QpLCBhcmcxLCBleHBvcnRzLnNsb3codGVzdCkpKVxuXG4gICAgICAgIGNhc2UgVHlwZXMuTGVhdmU6XG4gICAgICAgICAgICByZXR1cm4gcmVwb3J0ZXIobmV3IFJlcG9ydHMuTGVhdmUocGF0aCh0ZXN0KSkpXG5cbiAgICAgICAgY2FzZSBUeXBlcy5QYXNzOlxuICAgICAgICAgICAgcmV0dXJuIHJlcG9ydGVyKFxuICAgICAgICAgICAgICAgIG5ldyBSZXBvcnRzLlBhc3MocGF0aCh0ZXN0KSwgYXJnMSwgZXhwb3J0cy5zbG93KHRlc3QpKSlcblxuICAgICAgICBjYXNlIFR5cGVzLkZhaWw6XG4gICAgICAgICAgICByZXR1cm4gcmVwb3J0ZXIoXG4gICAgICAgICAgICAgICAgbmV3IFJlcG9ydHMuRmFpbChcbiAgICAgICAgICAgICAgICAgICAgcGF0aCh0ZXN0KSwgYXJnMSwgYXJnMixcbiAgICAgICAgICAgICAgICAgICAgZXhwb3J0cy5zbG93KHRlc3QpLFxuICAgICAgICAgICAgICAgICAgICAhIXRlc3QuaXNGYWlsYWJsZSkpXG5cbiAgICAgICAgY2FzZSBUeXBlcy5Ta2lwOlxuICAgICAgICAgICAgcmV0dXJuIHJlcG9ydGVyKG5ldyBSZXBvcnRzLlNraXAocGF0aCh0ZXN0KSkpXG5cbiAgICAgICAgY2FzZSBUeXBlcy5FbmQ6XG4gICAgICAgICAgICByZXR1cm4gcmVwb3J0ZXIobmV3IFJlcG9ydHMuRW5kKCkpXG5cbiAgICAgICAgY2FzZSBUeXBlcy5FcnJvcjpcbiAgICAgICAgICAgIHJldHVybiByZXBvcnRlcihuZXcgUmVwb3J0cy5FcnJvcihhcmcxKSlcblxuICAgICAgICBjYXNlIFR5cGVzLkhvb2s6XG4gICAgICAgICAgICByZXR1cm4gcmVwb3J0ZXIobmV3IFJlcG9ydHMuSG9vayhwYXRoKHRlc3QpLCBwYXRoKGFyZzEpLCBhcmcyKSlcblxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcInVucmVhY2hhYmxlXCIpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKClcbiAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0ZXN0LnJvb3QucmVwb3J0ZXIgPT0gbnVsbCkgcmV0dXJuIHVuZGVmaW5lZFxuICAgICAgICByZXR1cm4gaW52b2tlUmVwb3J0ZXIodGVzdC5yb290LnJlcG9ydGVyKVxuICAgIH0pXG4gICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgcmVwb3J0ZXJzID0gdGVzdC5yb290LnJlcG9ydGVyc1xuXG4gICAgICAgIC8vIFR3byBlYXN5IGNhc2VzLlxuICAgICAgICBpZiAocmVwb3J0ZXJzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHVuZGVmaW5lZFxuICAgICAgICBpZiAocmVwb3J0ZXJzLmxlbmd0aCA9PT0gMSkgcmV0dXJuIGludm9rZVJlcG9ydGVyKHJlcG9ydGVyc1swXSlcbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHJlcG9ydGVycy5tYXAoaW52b2tlUmVwb3J0ZXIpKVxuICAgIH0pXG59XG5cbi8qKlxuICogTm9ybWFsIHRlc3RzXG4gKi9cblxuLy8gUGhhbnRvbUpTIGFuZCBJRSBkb24ndCBhZGQgdGhlIHN0YWNrIHVudGlsIGl0J3MgdGhyb3duLiBJbiBmYWlsaW5nIGFzeW5jXG4vLyB0ZXN0cywgaXQncyBhbHJlYWR5IHRocm93biBpbiBhIHNlbnNlLCBzbyB0aGlzIHNob3VsZCBiZSBub3JtYWxpemVkIHdpdGhcbi8vIG90aGVyIHRlc3QgdHlwZXMuXG52YXIgYWRkU3RhY2sgPSB0eXBlb2YgbmV3IEVycm9yKCkuc3RhY2sgIT09IFwic3RyaW5nXCJcbiAgICA/IGZ1bmN0aW9uIGFkZFN0YWNrKGUpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmIChlIGluc3RhbmNlb2YgRXJyb3IgJiYgZS5zdGFjayA9PSBudWxsKSB0aHJvdyBlXG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICByZXR1cm4gZVxuICAgICAgICB9XG4gICAgfVxuICAgIDogZnVuY3Rpb24gKGUpIHsgcmV0dXJuIGUgfVxuXG5mdW5jdGlvbiBnZXRUaGVuKHJlcykge1xuICAgIGlmICh0eXBlb2YgcmVzID09PSBcIm9iamVjdFwiIHx8IHR5cGVvZiByZXMgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICByZXR1cm4gcmVzLnRoZW5cbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgfVxufVxuXG5mdW5jdGlvbiBBc3luY1N0YXRlKHN0YXJ0LCByZXNvbHZlLCBjb3VudCwgdGVzdCkge1xuICAgIHRoaXMuc3RhcnQgPSBzdGFydFxuICAgIHRoaXMucmVzb2x2ZSA9IHJlc29sdmVcbiAgICB0aGlzLmNvdW50ID0gY291bnRcbiAgICB0aGlzLnRlc3QgPSB0ZXN0XG4gICAgdGhpcy50aW1lciA9IHVuZGVmaW5lZFxufVxuXG52YXIgcCA9IFByb21pc2UucmVzb2x2ZSgpXG5cbmZ1bmN0aW9uIGFzeW5jRmluaXNoKHN0YXRlLCBhdHRlbXB0KSB7XG4gICAgLy8gQ2FwdHVyZSBpbW1lZGlhdGVseS4gV29yc3QgY2FzZSBzY2VuYXJpbywgaXQgZ2V0cyB0aHJvd24gYXdheS5cbiAgICB2YXIgZW5kID0gbm93KClcblxuICAgIGlmIChzdGF0ZS50aW1lcikge1xuICAgICAgICBjbGVhclRpbWVvdXQuY2FsbChnbG9iYWwsIHN0YXRlLnRpbWVyKVxuICAgICAgICBzdGF0ZS50aW1lciA9IHVuZGVmaW5lZFxuICAgIH1cblxuICAgIGlmIChhdHRlbXB0LmNhdWdodCAmJiBzdGF0ZS5jb3VudCA8IHN0YXRlLnRlc3QuYXR0ZW1wdHMpIHtcbiAgICAgICAgLy8gRG9uJ3QgcmVjdXJzZSBzeW5jaHJvbm91c2x5LCBzaW5jZSBpdCBtYXkgYmUgcmVzb2x2ZWQgc3luY2hyb25vdXNseVxuICAgICAgICBzdGF0ZS5yZXNvbHZlKHAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gaW52b2tlSW5pdChzdGF0ZS50ZXN0LCBzdGF0ZS5jb3VudCArIDEpXG4gICAgICAgIH0pKVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHN0YXRlLnJlc29sdmUobmV3IFJlc3VsdChlbmQgLSBzdGF0ZS5zdGFydCwgYXR0ZW1wdCkpXG4gICAgfVxufVxuXG4vLyBBdm9pZCBjcmVhdGluZyBhIGNsb3N1cmUgaWYgcG9zc2libGUsIGluIGNhc2UgaXQgZG9lc24ndCByZXR1cm4gYSB0aGVuYWJsZS5cbmZ1bmN0aW9uIGludm9rZUluaXQodGVzdCwgY291bnQpIHtcbiAgICB2YXIgc3RhcnQgPSBub3coKVxuICAgIHZhciB0cnlCb2R5ID0gdHJ5MSh0ZXN0LmNhbGxiYWNrLCB0ZXN0Lm1ldGhvZHMsIHRlc3QubWV0aG9kcylcbiAgICB2YXIgc3luY0VuZCA9IG5vdygpXG5cbiAgICAvLyBOb3RlOiBzeW5jaHJvbm91cyBmYWlsdXJlcyBhcmUgdGVzdCBmYWlsdXJlcywgbm90IGZhdGFsIGVycm9ycy5cbiAgICBpZiAodHJ5Qm9keS5jYXVnaHQpIHtcbiAgICAgICAgaWYgKGNvdW50IDwgdGVzdC5hdHRlbXB0cykgcmV0dXJuIGludm9rZUluaXQodGVzdCwgY291bnQgKyAxKVxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG5ldyBSZXN1bHQoc3luY0VuZCAtIHN0YXJ0LCB0cnlCb2R5KSlcbiAgICB9XG5cbiAgICB2YXIgdHJ5VGhlbiA9IHRyeTEoZ2V0VGhlbiwgdW5kZWZpbmVkLCB0cnlCb2R5LnZhbHVlKVxuXG4gICAgaWYgKHRyeVRoZW4uY2F1Z2h0KSB7XG4gICAgICAgIGlmIChjb3VudCA8IHRlc3QuYXR0ZW1wdHMpIHJldHVybiBpbnZva2VJbml0KHRlc3QsIGNvdW50ICsgMSlcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShuZXcgUmVzdWx0KHN5bmNFbmQgLSBzdGFydCwgdHJ5VGhlbikpXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiB0cnlUaGVuLnZhbHVlICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShuZXcgUmVzdWx0KHN5bmNFbmQgLSBzdGFydCwgdHJ5VGhlbikpXG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlKSB7XG4gICAgICAgIHZhciBzdGF0ZSA9IG5ldyBBc3luY1N0YXRlKHN0YXJ0LCByZXNvbHZlLCBjb3VudCwgdGVzdClcbiAgICAgICAgdmFyIHJlc3VsdCA9IHRyeTIodHJ5VGhlbi52YWx1ZSwgdHJ5Qm9keS52YWx1ZSxcbiAgICAgICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3RhdGUgPT0gbnVsbCkgcmV0dXJuXG4gICAgICAgICAgICAgICAgYXN5bmNGaW5pc2goc3RhdGUsIHRyeVBhc3MoKSlcbiAgICAgICAgICAgICAgICBzdGF0ZSA9IHVuZGVmaW5lZFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXRlID09IG51bGwpIHJldHVyblxuICAgICAgICAgICAgICAgIGFzeW5jRmluaXNoKHN0YXRlLCB0cnlGYWlsKGFkZFN0YWNrKGUpKSlcbiAgICAgICAgICAgICAgICBzdGF0ZSA9IHVuZGVmaW5lZFxuICAgICAgICAgICAgfSlcblxuICAgICAgICBpZiAoc3RhdGUgPT0gbnVsbCkgcmV0dXJuXG4gICAgICAgIGlmIChyZXN1bHQuY2F1Z2h0KSB7XG4gICAgICAgICAgICBhc3luY0ZpbmlzaChzdGF0ZSwgcmVzdWx0KVxuICAgICAgICAgICAgc3RhdGUgPSB1bmRlZmluZWRcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgLy8gU2V0IHRoZSB0aW1lb3V0ICphZnRlciogaW5pdGlhbGl6YXRpb24uIFRoZSB0aW1lb3V0IHdpbGwgbGlrZWx5IGJlXG4gICAgICAgIC8vIHNwZWNpZmllZCBkdXJpbmcgaW5pdGlhbGl6YXRpb24uXG4gICAgICAgIHZhciBtYXhUaW1lb3V0ID0gZXhwb3J0cy50aW1lb3V0KHRlc3QpXG5cbiAgICAgICAgLy8gU2V0dGluZyBhIHRpbWVvdXQgaXMgcG9pbnRsZXNzIGlmIGl0J3MgaW5maW5pdGUuXG4gICAgICAgIGlmIChtYXhUaW1lb3V0ICE9PSBJbmZpbml0eSkge1xuICAgICAgICAgICAgc3RhdGUudGltZXIgPSBzZXRUaW1lb3V0LmNhbGwoZ2xvYmFsLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXRlID09IG51bGwpIHJldHVyblxuICAgICAgICAgICAgICAgIGFzeW5jRmluaXNoKHN0YXRlLCB0cnlGYWlsKGFkZFN0YWNrKFxuICAgICAgICAgICAgICAgICAgICBuZXcgRXJyb3IoXCJUaW1lb3V0IG9mIFwiICsgbWF4VGltZW91dCArIFwiIHJlYWNoZWRcIikpKSlcbiAgICAgICAgICAgICAgICBzdGF0ZSA9IHVuZGVmaW5lZFxuICAgICAgICAgICAgfSwgbWF4VGltZW91dClcbiAgICAgICAgfVxuICAgIH0pXG59XG5cbmZ1bmN0aW9uIEVycm9yV3JhcCh0ZXN0LCBlcnJvcikge1xuICAgIHRoaXMudGVzdCA9IHRlc3RcbiAgICB0aGlzLmVycm9yID0gZXJyb3Jcbn1cbm1ldGhvZHMoRXJyb3JXcmFwLCBFcnJvciwge25hbWU6IFwiRXJyb3JXcmFwXCJ9KVxuXG5mdW5jdGlvbiBpbnZva2VIb29rKHRlc3QsIGxpc3QsIHN0YWdlKSB7XG4gICAgaWYgKGxpc3QgPT0gbnVsbCkgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpXG4gICAgcmV0dXJuIHBlYWNoKGxpc3QsIGZ1bmN0aW9uIChob29rKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm4gaG9vaygpXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcldyYXAodGVzdCwgbmV3IFJlcG9ydHMuSG9va0Vycm9yKHN0YWdlLCBob29rLCBlKSlcbiAgICAgICAgfVxuICAgIH0pXG59XG5cbmZ1bmN0aW9uIGludm9rZUJlZm9yZUVhY2godGVzdCkge1xuICAgIGlmICh0ZXN0LnJvb3QgPT09IHRlc3QpIHtcbiAgICAgICAgcmV0dXJuIGludm9rZUhvb2sodGVzdCwgdGVzdC5iZWZvcmVFYWNoLCBUeXBlcy5CZWZvcmVFYWNoKVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBpbnZva2VCZWZvcmVFYWNoKHRlc3QucGFyZW50KS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBpbnZva2VIb29rKHRlc3QsIHRlc3QuYmVmb3JlRWFjaCwgVHlwZXMuQmVmb3JlRWFjaClcbiAgICAgICAgfSlcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGludm9rZUFmdGVyRWFjaCh0ZXN0KSB7XG4gICAgaWYgKHRlc3Qucm9vdCA9PT0gdGVzdCkge1xuICAgICAgICByZXR1cm4gaW52b2tlSG9vayh0ZXN0LCB0ZXN0LmFmdGVyRWFjaCwgVHlwZXMuQWZ0ZXJFYWNoKVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBpbnZva2VIb29rKHRlc3QsIHRlc3QuYWZ0ZXJFYWNoLCBUeXBlcy5BZnRlckVhY2gpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIGludm9rZUFmdGVyRWFjaCh0ZXN0LnBhcmVudCkgfSlcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHJ1bkNoaWxkVGVzdHModGVzdCkge1xuICAgIGlmICh0ZXN0LnRlc3RzID09IG51bGwpIHJldHVybiB1bmRlZmluZWRcblxuICAgIGZ1bmN0aW9uIHJ1bkNoaWxkKGNoaWxkKSB7XG4gICAgICAgIHJldHVybiBpbnZva2VCZWZvcmVFYWNoKHRlc3QpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIHJ1bk5vcm1hbENoaWxkKGNoaWxkKSB9KVxuICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiBpbnZva2VBZnRlckVhY2godGVzdCkgfSlcbiAgICAgICAgLnRoZW4oXG4gICAgICAgICAgICBmdW5jdGlvbiAoKSB7IHRlc3Qucm9vdC5jdXJyZW50ID0gdGVzdCB9LFxuICAgICAgICAgICAgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICB0ZXN0LnJvb3QuY3VycmVudCA9IHRlc3RcbiAgICAgICAgICAgICAgICBpZiAoIShlIGluc3RhbmNlb2YgRXJyb3JXcmFwKSkgdGhyb3cgZVxuICAgICAgICAgICAgICAgIHJldHVybiByZXBvcnQoY2hpbGQsIFR5cGVzLkhvb2ssIGUudGVzdCwgZS5lcnJvcilcbiAgICAgICAgICAgIH0pXG4gICAgfVxuXG4gICAgdmFyIHJhbiA9IGZhbHNlXG5cbiAgICBmdW5jdGlvbiBtYXliZVJ1bkNoaWxkKGNoaWxkKSB7XG4gICAgICAgIC8vIE9ubHkgc2tpcHBlZCB0ZXN0cyBoYXZlIG5vIGNhbGxiYWNrXG4gICAgICAgIGlmIChjaGlsZC5jYWxsYmFjayA9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVwb3J0KGNoaWxkLCBUeXBlcy5Ta2lwKVxuICAgICAgICB9IGVsc2UgaWYgKCFpc09ubHkoY2hpbGQpKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKClcbiAgICAgICAgfSBlbHNlIGlmIChyYW4pIHtcbiAgICAgICAgICAgIHJldHVybiBydW5DaGlsZChjaGlsZClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJhbiA9IHRydWVcbiAgICAgICAgICAgIHJldHVybiBpbnZva2VIb29rKHRlc3QsIHRlc3QuYmVmb3JlQWxsLCBUeXBlcy5CZWZvcmVBbGwpXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiBydW5DaGlsZChjaGlsZCkgfSlcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBwZWFjaCh0ZXN0LnRlc3RzLCBmdW5jdGlvbiAoY2hpbGQpIHtcbiAgICAgICAgdGVzdC5yb290LmN1cnJlbnQgPSBjaGlsZFxuICAgICAgICByZXR1cm4gbWF5YmVSdW5DaGlsZChjaGlsZCkudGhlbihcbiAgICAgICAgICAgIGZ1bmN0aW9uICgpIHsgdGVzdC5yb290LmN1cnJlbnQgPSB0ZXN0IH0sXG4gICAgICAgICAgICBmdW5jdGlvbiAoZSkgeyB0ZXN0LnJvb3QuY3VycmVudCA9IHRlc3Q7IHRocm93IGUgfSlcbiAgICB9KVxuICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHJhbiA/IGludm9rZUhvb2sodGVzdCwgdGVzdC5hZnRlckFsbCwgVHlwZXMuQWZ0ZXJBbGwpIDogdW5kZWZpbmVkXG4gICAgfSlcbn1cblxuZnVuY3Rpb24gY2xlYXJDaGlsZHJlbih0ZXN0KSB7XG4gICAgaWYgKHRlc3QudGVzdHMgPT0gbnVsbCkgcmV0dXJuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0ZXN0LnRlc3RzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGRlbGV0ZSB0ZXN0LnRlc3RzW2ldLnRlc3RzXG4gICAgfVxufVxuXG5mdW5jdGlvbiBydW5Ob3JtYWxDaGlsZCh0ZXN0KSB7XG4gICAgdGVzdC5sb2NrZWQgPSBmYWxzZVxuXG4gICAgcmV0dXJuIGludm9rZUluaXQodGVzdCwgMSlcbiAgICAudGhlbihcbiAgICAgICAgZnVuY3Rpb24gKHJlc3VsdCkgeyB0ZXN0LmxvY2tlZCA9IHRydWU7IHJldHVybiByZXN1bHQgfSxcbiAgICAgICAgZnVuY3Rpb24gKGVycm9yKSB7IHRlc3QubG9ja2VkID0gdHJ1ZTsgdGhyb3cgZXJyb3IgfSlcbiAgICAudGhlbihmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgIGlmIChyZXN1bHQuY2F1Z2h0KSB7XG4gICAgICAgICAgICByZXR1cm4gcmVwb3J0KHRlc3QsIFR5cGVzLkZhaWwsIHJlc3VsdC52YWx1ZSwgcmVzdWx0LnRpbWUpXG4gICAgICAgIH0gZWxzZSBpZiAodGVzdC50ZXN0cyAhPSBudWxsKSB7XG4gICAgICAgICAgICAvLyBSZXBvcnQgdGhpcyBhcyBpZiBpdCB3YXMgYSBwYXJlbnQgdGVzdCBpZiBpdCdzIHBhc3NpbmcgYW5kIGhhc1xuICAgICAgICAgICAgLy8gY2hpbGRyZW4uXG4gICAgICAgICAgICByZXR1cm4gcmVwb3J0KHRlc3QsIFR5cGVzLkVudGVyLCByZXN1bHQudGltZSlcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIHJ1bkNoaWxkVGVzdHModGVzdCkgfSlcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIHJlcG9ydCh0ZXN0LCBUeXBlcy5MZWF2ZSkgfSlcbiAgICAgICAgICAgIC5jYXRjaChmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgIGlmICghKGUgaW5zdGFuY2VvZiBFcnJvcldyYXApKSB0aHJvdyBlXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcG9ydCh0ZXN0LCBUeXBlcy5MZWF2ZSkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXBvcnQodGVzdCwgVHlwZXMuSG9vaywgZS50ZXN0LCBlLmVycm9yKVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHJlcG9ydCh0ZXN0LCBUeXBlcy5QYXNzLCByZXN1bHQudGltZSlcbiAgICAgICAgfVxuICAgIH0pXG4gICAgLnRoZW4oXG4gICAgICAgIGZ1bmN0aW9uICgpIHsgY2xlYXJDaGlsZHJlbih0ZXN0KSB9LFxuICAgICAgICBmdW5jdGlvbiAoZSkgeyBjbGVhckNoaWxkcmVuKHRlc3QpOyB0aHJvdyBlIH0pXG59XG5cbi8qKlxuICogVGhpcyBydW5zIHRoZSByb290IHRlc3QgYW5kIHJldHVybnMgYSBwcm9taXNlIHJlc29sdmVkIHdoZW4gaXQncyBkb25lLlxuICovXG5leHBvcnRzLnJ1blRlc3QgPSBmdW5jdGlvbiAodGVzdCkge1xuICAgIHRlc3QubG9ja2VkID0gdHJ1ZVxuXG4gICAgcmV0dXJuIHJlcG9ydCh0ZXN0LCBUeXBlcy5TdGFydClcbiAgICAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiBydW5DaGlsZFRlc3RzKHRlc3QpIH0pXG4gICAgLmNhdGNoKGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIGlmICghKGUgaW5zdGFuY2VvZiBFcnJvcldyYXApKSB0aHJvdyBlXG4gICAgICAgIHJldHVybiByZXBvcnQodGVzdCwgVHlwZXMuSG9vaywgZS50ZXN0LCBlLmVycm9yKVxuICAgIH0pXG4gICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gcmVwb3J0KHRlc3QsIFR5cGVzLkVuZCkgfSlcbiAgICAvLyBUZWxsIHRoZSByZXBvcnRlciBzb21ldGhpbmcgaGFwcGVuZWQuIE90aGVyd2lzZSwgaXQnbGwgaGF2ZSB0byB3cmFwIHRoaXNcbiAgICAvLyBtZXRob2QgaW4gYSBwbHVnaW4sIHdoaWNoIHNob3VsZG4ndCBiZSBuZWNlc3NhcnkuXG4gICAgLmNhdGNoKGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHJldHVybiByZXBvcnQodGVzdCwgVHlwZXMuRXJyb3IsIGUpLnRoZW4oZnVuY3Rpb24gKCkgeyB0aHJvdyBlIH0pXG4gICAgfSlcbiAgICAudGhlbihcbiAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY2xlYXJDaGlsZHJlbih0ZXN0KVxuICAgICAgICAgICAgdGVzdC5sb2NrZWQgPSBmYWxzZVxuICAgICAgICB9LFxuICAgICAgICBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgY2xlYXJDaGlsZHJlbih0ZXN0KVxuICAgICAgICAgICAgdGVzdC5sb2NrZWQgPSBmYWxzZVxuICAgICAgICAgICAgdGhyb3cgZVxuICAgICAgICB9KVxufVxuXG4vLyBIZWxwIG9wdGltaXplIGZvciBpbmVmZmljaWVudCBleGNlcHRpb24gaGFuZGxpbmcgaW4gVjhcblxuZnVuY3Rpb24gdHJ5UGFzcyh2YWx1ZSkge1xuICAgIHJldHVybiB7Y2F1Z2h0OiBmYWxzZSwgdmFsdWU6IHZhbHVlfVxufVxuXG5mdW5jdGlvbiB0cnlGYWlsKGUpIHtcbiAgICByZXR1cm4ge2NhdWdodDogdHJ1ZSwgdmFsdWU6IGV9XG59XG5cbmZ1bmN0aW9uIHRyeTEoZiwgaW5zdCwgYXJnMCkge1xuICAgIHRyeSB7XG4gICAgICAgIHJldHVybiB0cnlQYXNzKGYuY2FsbChpbnN0LCBhcmcwKSlcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHJldHVybiB0cnlGYWlsKGUpXG4gICAgfVxufVxuXG5mdW5jdGlvbiB0cnkyKGYsIGluc3QsIGFyZzAsIGFyZzEpIHtcbiAgICB0cnkge1xuICAgICAgICByZXR1cm4gdHJ5UGFzcyhmLmNhbGwoaW5zdCwgYXJnMCwgYXJnMSkpXG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICByZXR1cm4gdHJ5RmFpbChlKVxuICAgIH1cbn1cbiIsIlwidXNlIHN0cmljdFwiXG5cbi8qKlxuICogVGhlIERPTSByZXBvcnRlciBhbmQgbG9hZGVyIGVudHJ5IHBvaW50LiBTZWUgdGhlIFJFQURNRS5tZCBmb3IgbW9yZSBkZXRhaWxzLlxuICovXG5cbnZhciBpbml0aWFsaXplID0gcmVxdWlyZShcIi4vaW5pdGlhbGl6ZVwiKVxuLy8gdmFyIHQgPSByZXF1aXJlKFwiLi4vLi4vaW5kZXhcIilcbi8vIHZhciBhc3NlcnQgPSByZXF1aXJlKFwiLi4vLi4vYXNzZXJ0XCIpXG5cbmV4cG9ydHMuY3JlYXRlID0gZnVuY3Rpb24gKG9wdHMpIHtcbiAgICBpZiAob3B0cyA9PSBudWxsKSByZXR1cm4gaW5pdGlhbGl6ZSh7fSlcbiAgICBpZiAoQXJyYXkuaXNBcnJheShvcHRzKSkgcmV0dXJuIGluaXRpYWxpemUoe2ZpbGVzOiBvcHRzfSlcbiAgICBpZiAodHlwZW9mIG9wdHMgPT09IFwib2JqZWN0XCIpIHJldHVybiBpbml0aWFsaXplKG9wdHMpXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBvcHRzYCBtdXN0IGJlIGFuIG9iamVjdCBvciBhcnJheSBvZiBmaWxlcyBpZiBwYXNzZWRcIilcbn1cblxuLy8gQ3VycmVudGx5IGJyb2tlbiwgYmVjYXVzZSB0aGlzIGlzbid0IGF1dG9sb2FkZWQgeWV0LlxuLy8gZXhwb3J0cy5hdXRvbG9hZCA9IGZ1bmN0aW9uIChzY3JpcHQpIHtcbi8vICAgICB2YXIgZmlsZXMgPSBzY3JpcHQuZ2V0QXR0cmlidXRlKFwiZGF0YS1maWxlc1wiKVxuLy9cbi8vICAgICBpZiAoIWZpbGVzKSByZXR1cm5cbi8vXG4vLyAgICAgZnVuY3Rpb24gc2V0KG9wdHMsIGF0dHIsIHRyYW5zZm9ybSkge1xuLy8gICAgICAgICB2YXIgdmFsdWUgPSBzY3JpcHQuZ2V0QXR0cmlidXRlKFwiZGF0YS1cIiArIGF0dHIpXG4vL1xuLy8gICAgICAgICBpZiAodmFsdWUpIG9wdHNbYXR0cl0gPSB0cmFuc2Zvcm0odmFsdWUpXG4vLyAgICAgfVxuLy9cbi8vICAgICB2YXIgb3B0cyA9IHtmaWxlczogZmlsZXMudHJpbSgpLnNwbGl0KC9cXHMrL2cpfVxuLy9cbi8vICAgICBzZXQob3B0cywgXCJ0aW1lb3V0XCIsIE51bWJlcilcbi8vICAgICBzZXQob3B0cywgXCJwcmVsb2FkXCIsIEZ1bmN0aW9uKVxuLy8gICAgIHNldChvcHRzLCBcInByZXJ1blwiLCBGdW5jdGlvbilcbi8vICAgICBzZXQob3B0cywgXCJwb3N0cnVuXCIsIEZ1bmN0aW9uKVxuLy8gICAgIHNldChvcHRzLCBcImVycm9yXCIsIGZ1bmN0aW9uIChhdHRyKSB7XG4vLyAgICAgICAgIHJldHVybiBuZXcgRnVuY3Rpb24oXCJlcnJcIiwgYXR0cikgLy8gZXNsaW50LWRpc2FibGUtbGluZVxuLy8gICAgIH0pXG4vL1xuLy8gICAgIC8vIENvbnZlbmllbmNlLlxuLy8gICAgIGdsb2JhbC50ID0gdFxuLy8gICAgIGdsb2JhbC5hc3NlcnQgPSBhc3NlcnRcbi8vXG4vLyAgICAgaWYgKGdsb2JhbC5kb2N1bWVudC5yZWFkeVN0YXRlICE9PSBcImxvYWRpbmdcIikge1xuLy8gICAgICAgICBpbml0aWFsaXplKG9wdHMpLnJ1bigpXG4vLyAgICAgfSBlbHNlIHtcbi8vICAgICAgICAgZ2xvYmFsLmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJET01Db250ZW50TG9hZGVkXCIsIGZ1bmN0aW9uICgpIHtcbi8vICAgICAgICAgICAgIGluaXRpYWxpemUob3B0cykucnVuKClcbi8vICAgICAgICAgfSlcbi8vICAgICB9XG4vLyB9XG4iLCJcInVzZSBzdHJpY3RcIlxuXG4vKipcbiAqIFRoZSByZXBvcnRlciBhbmQgdGVzdCBpbml0aWFsaXphdGlvbiBzZXF1ZW5jZSwgYW5kIHNjcmlwdCBsb2FkaW5nLiBUaGlzXG4gKiBkb2Vzbid0IHVuZGVyc3RhbmQgYW55dGhpbmcgdmlldy13aXNlLlxuICovXG5cbnZhciBkZWZhdWx0VCA9IHJlcXVpcmUoXCIuLi8uLi9pbmRleFwiKVxudmFyIFIgPSByZXF1aXJlKFwiLi4vcmVwb3J0ZXJcIilcbnZhciBEID0gcmVxdWlyZShcIi4vaW5qZWN0XCIpXG52YXIgcnVuVGVzdHMgPSByZXF1aXJlKFwiLi9ydW4tdGVzdHNcIilcbnZhciBpbmplY3RTdHlsZXMgPSByZXF1aXJlKFwiLi9pbmplY3Qtc3R5bGVzXCIpXG52YXIgVmlldyA9IHJlcXVpcmUoXCIuL3ZpZXdcIilcbnZhciBtZXRob2RzID0gcmVxdWlyZShcIi4uL21ldGhvZHNcIilcblxuZnVuY3Rpb24gVHJlZShuYW1lKSB7XG4gICAgdGhpcy5uYW1lID0gbmFtZVxuICAgIHRoaXMuc3RhdHVzID0gUi5TdGF0dXMuVW5rbm93blxuICAgIHRoaXMubm9kZSA9IG51bGxcbiAgICB0aGlzLmNoaWxkcmVuID0gT2JqZWN0LmNyZWF0ZShudWxsKVxufVxuXG52YXIgcmVwb3J0ZXIgPSBSLm9uKFwiZG9tXCIsIHtcbiAgICBhY2NlcHRzOiBbXSxcbiAgICBjcmVhdGU6IGZ1bmN0aW9uIChvcHRzLCBtZXRob2RzKSB7XG4gICAgICAgIHZhciByZXBvcnRlciA9IG5ldyBSLlJlcG9ydGVyKFRyZWUsIHVuZGVmaW5lZCwgbWV0aG9kcylcblxuICAgICAgICByZXBvcnRlci5vcHRzID0gb3B0c1xuICAgICAgICByZXR1cm4gcmVwb3J0ZXJcbiAgICB9LFxuXG4gICAgLy8gR2l2ZSB0aGUgYnJvd3NlciBhIGNoYW5jZSB0byByZXBhaW50IGJlZm9yZSBjb250aW51aW5nIChtaWNyb3Rhc2tzXG4gICAgLy8gbm9ybWFsbHkgYmxvY2sgcmVuZGVyaW5nKS5cbiAgICBhZnRlcjogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoVmlldy5uZXh0RnJhbWUpXG4gICAgfSxcblxuICAgIHJlcG9ydDogZnVuY3Rpb24gKF8sIHJlcG9ydCkge1xuICAgICAgICByZXR1cm4gVmlldy5yZXBvcnQoXywgcmVwb3J0KVxuICAgIH0sXG59KVxuXG5mdW5jdGlvbiBub29wKCkge31cblxuZnVuY3Rpb24gc2V0RGVmYXVsdHNDaGVja2VkKG9wdHMpIHtcbiAgICBpZiAob3B0cy50aXRsZSA9PSBudWxsKSBvcHRzLnRpdGxlID0gXCJUaGFsbGl1bSB0ZXN0c1wiXG4gICAgaWYgKG9wdHMudGltZW91dCA9PSBudWxsKSBvcHRzLnRpbWVvdXQgPSA1MDAwXG4gICAgaWYgKG9wdHMuZmlsZXMgPT0gbnVsbCkgb3B0cy5maWxlcyA9IFtdXG4gICAgaWYgKG9wdHMucHJlbG9hZCA9PSBudWxsKSBvcHRzLnByZWxvYWQgPSBub29wXG4gICAgaWYgKG9wdHMucHJlcnVuID09IG51bGwpIG9wdHMucHJlcnVuID0gbm9vcFxuICAgIGlmIChvcHRzLnBvc3RydW4gPT0gbnVsbCkgb3B0cy5wb3N0cnVuID0gbm9vcFxuICAgIGlmIChvcHRzLmVycm9yID09IG51bGwpIG9wdHMuZXJyb3IgPSBub29wXG4gICAgaWYgKG9wdHMudGhhbGxpdW0gPT0gbnVsbCkgb3B0cy50aGFsbGl1bSA9IGRlZmF1bHRUXG5cbiAgICBpZiAodHlwZW9mIG9wdHMudGl0bGUgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBvcHRzLnRpdGxlYCBtdXN0IGJlIGEgc3RyaW5nIGlmIHBhc3NlZFwiKVxuICAgIH1cblxuICAgIGlmICh0eXBlb2Ygb3B0cy50aW1lb3V0ICE9PSBcIm51bWJlclwiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJgb3B0cy50aW1lb3V0YCBtdXN0IGJlIGEgbnVtYmVyIGlmIHBhc3NlZFwiKVxuICAgIH1cblxuICAgIGlmICghQXJyYXkuaXNBcnJheShvcHRzLmZpbGVzKSkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYG9wdHMuZmlsZXNgIG11c3QgYmUgYW4gYXJyYXkgaWYgcGFzc2VkXCIpXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBvcHRzLnByZWxvYWQgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYG9wdHMucHJlbG9hZGAgbXVzdCBiZSBhIGZ1bmN0aW9uIGlmIHBhc3NlZFwiKVxuICAgIH1cblxuICAgIGlmICh0eXBlb2Ygb3B0cy5wcmVydW4gIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYG9wdHMucHJlcnVuYCBtdXN0IGJlIGEgZnVuY3Rpb24gaWYgcGFzc2VkXCIpXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBvcHRzLnBvc3RydW4gIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYG9wdHMucG9zdHJ1bmAgbXVzdCBiZSBhIGZ1bmN0aW9uIGlmIHBhc3NlZFwiKVxuICAgIH1cblxuICAgIGlmICh0eXBlb2Ygb3B0cy5lcnJvciAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJgb3B0cy5lcnJvcmAgbXVzdCBiZSBhIGZ1bmN0aW9uIGlmIHBhc3NlZFwiKVxuICAgIH1cblxuICAgIGlmICh0eXBlb2Ygb3B0cy50aGFsbGl1bSAhPT0gXCJvYmplY3RcIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICAgICAgXCJgb3B0cy50aGFsbGl1bWAgbXVzdCBiZSBhIFRoYWxsaXVtIGluc3RhbmNlIGlmIHBhc3NlZFwiKVxuICAgIH1cbn1cblxuZnVuY3Rpb24gb25SZWFkeShpbml0KSB7XG4gICAgaWYgKEQuZG9jdW1lbnQuYm9keSAhPSBudWxsKSByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGluaXQoKSlcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUpIHtcbiAgICAgICAgRC5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiRE9NQ29udGVudExvYWRlZFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXNvbHZlKGluaXQoKSlcbiAgICAgICAgfSwgZmFsc2UpXG4gICAgfSlcbn1cblxuZnVuY3Rpb24gRE9NKG9wdHMpIHtcbiAgICB0aGlzLl9vcHRzID0gb3B0c1xuICAgIHRoaXMuX2Rlc3Ryb3lQcm9taXNlID0gdW5kZWZpbmVkXG4gICAgdGhpcy5fZGF0YSA9IG9uUmVhZHkoZnVuY3Rpb24gKCkge1xuICAgICAgICBzZXREZWZhdWx0c0NoZWNrZWQob3B0cylcbiAgICAgICAgaWYgKCFELmRvY3VtZW50LnRpdGxlKSBELmRvY3VtZW50LnRpdGxlID0gb3B0cy50aXRsZVxuICAgICAgICBpbmplY3RTdHlsZXMoKVxuICAgICAgICB2YXIgZGF0YSA9IFZpZXcuaW5pdChvcHRzKVxuXG4gICAgICAgIG9wdHMudGhhbGxpdW0ucmVwb3J0ZXIocmVwb3J0ZXIsIGRhdGEuc3RhdGUpXG4gICAgICAgIHJldHVybiBkYXRhXG4gICAgfSlcbn1cblxubWV0aG9kcyhET00sIHtcbiAgICBydW46IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMuX2Rlc3Ryb3lQcm9taXNlICE9IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoXG4gICAgICAgICAgICAgICAgXCJUaGUgdGVzdCBzdWl0ZSBtdXN0IG5vdCBiZSBydW4gYWZ0ZXIgdGhlIHZpZXcgaGFzIGJlZW4gXCIgK1xuICAgICAgICAgICAgICAgIFwiZGV0YWNoZWQuXCJcbiAgICAgICAgICAgICkpXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgb3B0cyA9IHRoaXMuX29wdHNcblxuICAgICAgICByZXR1cm4gdGhpcy5fZGF0YS50aGVuKGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgICByZXR1cm4gcnVuVGVzdHMob3B0cywgZGF0YS5zdGF0ZSlcbiAgICAgICAgfSlcbiAgICB9LFxuXG4gICAgZGV0YWNoOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLl9kZXN0cm95UHJvbWlzZSAhPSBudWxsKSByZXR1cm4gdGhpcy5fZGVzdHJveVByb21pc2VcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzXG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX2Rlc3Ryb3lQcm9taXNlID0gc2VsZi5fZGF0YS50aGVuKGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgICBkYXRhLnN0YXRlLmxvY2tlZCA9IHRydWVcbiAgICAgICAgICAgIGlmIChkYXRhLnN0YXRlLmN1cnJlbnRQcm9taXNlID09IG51bGwpIHJldHVybiBkYXRhXG4gICAgICAgICAgICByZXR1cm4gZGF0YS5zdGF0ZS5jdXJyZW50UHJvbWlzZS50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIGRhdGEgfSlcbiAgICAgICAgfSlcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICAgIHNlbGYuX29wdHMgPSB1bmRlZmluZWRcbiAgICAgICAgICAgIHNlbGYuX2RhdGEgPSBzZWxmLl9kZXN0cm95UHJvbWlzZVxuXG4gICAgICAgICAgICB3aGlsZSAoZGF0YS5yb290LmZpcnN0Q2hpbGQpIHtcbiAgICAgICAgICAgICAgICBkYXRhLnJvb3QucmVtb3ZlQ2hpbGQoZGF0YS5yb290LmZpcnN0Q2hpbGQpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfSxcbn0pXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKG9wdHMpIHtcbiAgICByZXR1cm4gbmV3IERPTShvcHRzKVxufVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxudmFyIFV0aWwgPSByZXF1aXJlKFwiLi4vdXRpbFwiKVxudmFyIEQgPSByZXF1aXJlKFwiLi9pbmplY3RcIilcblxuLyoqXG4gKiBUaGUgcmVwb3J0ZXIgc3R5bGVzaGVldC4gSGVyZSdzIHRoZSBmb3JtYXQ6XG4gKlxuICogLy8gU2luZ2xlIGl0ZW1cbiAqIFwiLnNlbGVjdG9yXCI6IHtcbiAqICAgICAvLyBwcm9wcy4uLlxuICogfVxuICpcbiAqIC8vIER1cGxpY2F0ZSBlbnRyaWVzXG4gKiBcIi5zZWxlY3RvclwiOiB7XG4gKiAgICAgXCJwcm9wXCI6IFtcbiAqICAgICAgICAgLy8gdmFsdWVzLi4uXG4gKiAgICAgXSxcbiAqIH1cbiAqXG4gKiAvLyBEdXBsaWNhdGUgc2VsZWN0b3JzXG4gKiBcIi5zZWxlY3RvclwiOiBbXG4gKiAgICAgLy8gdmFsdWVzLi4uXG4gKiBdXG4gKlxuICogLy8gTWVkaWEgcXVlcnlcbiAqIFwiQG1lZGlhIHNjcmVlblwiOiB7XG4gKiAgICAgLy8gc2VsZWN0b3JzLi4uXG4gKiB9XG4gKlxuICogTm90ZSB0aGF0IENTUyBzdHJpbmdzICptdXN0KiBiZSBxdW90ZWQgaW5zaWRlIHRoZSB2YWx1ZS5cbiAqL1xuXG52YXIgc3R5bGVzID0gVXRpbC5sYXp5KGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eVxuXG4gICAgLyoqXG4gICAgICogUGFydGlhbGx5IHRha2VuIGFuZCBhZGFwdGVkIGZyb20gbm9ybWFsaXplLmNzcyAobGljZW5zZWQgdW5kZXIgdGhlIE1JVFxuICAgICAqIExpY2Vuc2UpLlxuICAgICAqIGh0dHBzOi8vZ2l0aHViLmNvbS9uZWNvbGFzL25vcm1hbGl6ZS5jc3NcbiAgICAgKi9cbiAgICB2YXIgc3R5bGVPYmplY3QgPSB7XG4gICAgICAgIFwiI3RsXCI6IHtcbiAgICAgICAgICAgIFwiZm9udC1mYW1pbHlcIjogXCJzYW5zLXNlcmlmXCIsXG4gICAgICAgICAgICBcImxpbmUtaGVpZ2h0XCI6IFwiMS4xNVwiLFxuICAgICAgICAgICAgXCItbXMtdGV4dC1zaXplLWFkanVzdFwiOiBcIjEwMCVcIixcbiAgICAgICAgICAgIFwiLXdlYmtpdC10ZXh0LXNpemUtYWRqdXN0XCI6IFwiMTAwJVwiLFxuICAgICAgICB9LFxuXG4gICAgICAgIFwiI3RsIGJ1dHRvblwiOiB7XG4gICAgICAgICAgICBcImZvbnQtZmFtaWx5XCI6IFwic2Fucy1zZXJpZlwiLFxuICAgICAgICAgICAgXCJsaW5lLWhlaWdodFwiOiBcIjEuMTVcIixcbiAgICAgICAgICAgIFwib3ZlcmZsb3dcIjogXCJ2aXNpYmxlXCIsXG4gICAgICAgICAgICBcImZvbnQtc2l6ZVwiOiBcIjEwMCVcIixcbiAgICAgICAgICAgIFwibWFyZ2luXCI6IFwiMFwiLFxuICAgICAgICAgICAgXCJ0ZXh0LXRyYW5zZm9ybVwiOiBcIm5vbmVcIixcbiAgICAgICAgICAgIFwiLXdlYmtpdC1hcHBlYXJhbmNlXCI6IFwiYnV0dG9uXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgaDFcIjoge1xuICAgICAgICAgICAgXCJmb250LXNpemVcIjogXCIyZW1cIixcbiAgICAgICAgICAgIFwibWFyZ2luXCI6IFwiMC42N2VtIDBcIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCBhXCI6IHtcbiAgICAgICAgICAgIFwiYmFja2dyb3VuZC1jb2xvclwiOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICAgICAgICBcIi13ZWJraXQtdGV4dC1kZWNvcmF0aW9uLXNraXBcIjogXCJvYmplY3RzXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgYTphY3RpdmUsICN0bCBhOmhvdmVyXCI6IHtcbiAgICAgICAgICAgIFwib3V0bGluZS13aWR0aFwiOiBcIjBcIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCBidXR0b246Oi1tb3otZm9jdXMtaW5uZXJcIjoge1xuICAgICAgICAgICAgXCJib3JkZXItc3R5bGVcIjogXCJub25lXCIsXG4gICAgICAgICAgICBcInBhZGRpbmdcIjogXCIwXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgYnV0dG9uOi1tb3otZm9jdXNyaW5nXCI6IHtcbiAgICAgICAgICAgIG91dGxpbmU6IFwiMXB4IGRvdHRlZCBCdXR0b25UZXh0XCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEJhc2Ugc3R5bGVzLiBOb3RlIHRoYXQgdGhpcyBDU1MgaXMgZGVzaWduZWQgdG8gaW50ZW50aW9uYWxseSBvdmVycmlkZVxuICAgICAgICAgKiBtb3N0IHRoaW5ncyB0aGF0IGNvdWxkIHByb3BhZ2F0ZS5cbiAgICAgICAgICovXG4gICAgICAgIFwiI3RsICpcIjogW1xuICAgICAgICAgICAge1widGV4dC1hbGlnblwiOiBcImxlZnRcIn0sXG4gICAgICAgICAgICB7XCJ0ZXh0LWFsaWduXCI6IFwic3RhcnRcIn0sXG4gICAgICAgIF0sXG5cbiAgICAgICAgXCIjdGwgLnRsLXJlcG9ydCwgI3RsIC50bC1yZXBvcnQgdWxcIjoge1xuICAgICAgICAgICAgXCJsaXN0LXN0eWxlLXR5cGVcIjogXCJub25lXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgbGkgfiAudGwtc3VpdGVcIjoge1xuICAgICAgICAgICAgXCJwYWRkaW5nLXRvcFwiOiBcIjFlbVwiLFxuICAgICAgICB9LFxuXG4gICAgICAgIFwiI3RsIC50bC1zdWl0ZSA+IGgyXCI6IHtcbiAgICAgICAgICAgIFwiY29sb3JcIjogXCJibGFja1wiLFxuICAgICAgICAgICAgXCJmb250LXNpemVcIjogXCIxLjVlbVwiLFxuICAgICAgICAgICAgXCJmb250LXdlaWdodFwiOiBcImJvbGRcIixcbiAgICAgICAgICAgIFwibWFyZ2luLWJvdHRvbVwiOiBcIjAuNWVtXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLXN1aXRlIC50bC1zdWl0ZSA+IGgyXCI6IHtcbiAgICAgICAgICAgIFwiZm9udC1zaXplXCI6IFwiMS4yZW1cIixcbiAgICAgICAgICAgIFwibWFyZ2luLWJvdHRvbVwiOiBcIjAuM2VtXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLXN1aXRlIC50bC1zdWl0ZSAudGwtc3VpdGUgPiBoMlwiOiB7XG4gICAgICAgICAgICBcImZvbnQtc2l6ZVwiOiBcIjEuMmVtXCIsXG4gICAgICAgICAgICBcIm1hcmdpbi1ib3R0b21cIjogXCIwLjJlbVwiLFxuICAgICAgICAgICAgXCJmb250LXdlaWdodFwiOiBcIm5vcm1hbFwiLFxuICAgICAgICB9LFxuXG4gICAgICAgIFwiI3RsIC50bC10ZXN0ID4gaDJcIjoge1xuICAgICAgICAgICAgXCJjb2xvclwiOiBcImJsYWNrXCIsXG4gICAgICAgICAgICBcImZvbnQtc2l6ZVwiOiBcIjFlbVwiLFxuICAgICAgICAgICAgXCJmb250LXdlaWdodFwiOiBcIm5vcm1hbFwiLFxuICAgICAgICAgICAgXCJtYXJnaW5cIjogXCIwXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLXRlc3QgPiA6Zmlyc3QtY2hpbGQ6OmJlZm9yZVwiOiB7XG4gICAgICAgICAgICBcImRpc3BsYXlcIjogXCJpbmxpbmUtYmxvY2tcIixcbiAgICAgICAgICAgIFwiZm9udC13ZWlnaHRcIjogXCJib2xkXCIsXG4gICAgICAgICAgICBcIndpZHRoXCI6IFwiMS4yZW1cIixcbiAgICAgICAgICAgIFwidGV4dC1hbGlnblwiOiBcImNlbnRlclwiLFxuICAgICAgICAgICAgXCJmb250LWZhbWlseVwiOiBcInNhbnMtc2VyaWZcIixcbiAgICAgICAgICAgIFwidGV4dC1zaGFkb3dcIjogXCIwIDNweCAycHggIzk2OTY5NlwiLFxuICAgICAgICB9LFxuXG4gICAgICAgIFwiI3RsIC50bC10ZXN0LnRsLWZhaWwgPiBoMiwgI3RsIC50bC10ZXN0LnRsLWVycm9yID4gaDJcIjoge1xuICAgICAgICAgICAgY29sb3I6IFwiI2MwMFwiLFxuICAgICAgICB9LFxuXG4gICAgICAgIFwiI3RsIC50bC10ZXN0LnRsLXNraXAgPiBoMlwiOiB7XG4gICAgICAgICAgICBjb2xvcjogXCIjMDhjXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLXRlc3QudGwtcGFzcyA+IDpmaXJzdC1jaGlsZDo6YmVmb3JlXCI6IHtcbiAgICAgICAgICAgIGNvbnRlbnQ6IFwiJ+KckydcIixcbiAgICAgICAgICAgIGNvbG9yOiBcIiMwYzBcIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCAudGwtdGVzdC50bC1mYWlsID4gOmZpcnN0LWNoaWxkOjpiZWZvcmVcIjoge1xuICAgICAgICAgICAgY29udGVudDogXCIn4pyWJ1wiLFxuICAgICAgICB9LFxuXG4gICAgICAgIFwiI3RsIC50bC10ZXN0LnRsLWVycm9yID4gOmZpcnN0LWNoaWxkOjpiZWZvcmVcIjoge1xuICAgICAgICAgICAgY29udGVudDogXCInISdcIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCAudGwtdGVzdC50bC1za2lwID4gOmZpcnN0LWNoaWxkOjpiZWZvcmVcIjoge1xuICAgICAgICAgICAgY29udGVudDogXCIn4oiSJ1wiLFxuICAgICAgICB9LFxuXG4gICAgICAgIFwiI3RsIC50bC1wcmUsICN0bCAudGwtZGlmZi1oZWFkZXJcIjoge1xuICAgICAgICAgICAgLy8gbm9ybWFsaXplLmNzczogQ29ycmVjdCB0aGUgaW5oZXJpdGFuY2UgYW5kIHNjYWxpbmcgb2YgZm9udCBzaXplXG4gICAgICAgICAgICAvLyBpbiBhbGwgYnJvd3NlcnNcbiAgICAgICAgICAgIFwiZm9udC1mYW1pbHlcIjogXCJtb25vc3BhY2UsIG1vbm9zcGFjZVwiLFxuICAgICAgICAgICAgXCJiYWNrZ3JvdW5kXCI6IFwiI2YwZjBmMFwiLFxuICAgICAgICAgICAgXCJ3aGl0ZS1zcGFjZVwiOiBcInByZVwiLFxuICAgICAgICAgICAgXCJmb250LXNpemVcIjogXCIwLjg1ZW1cIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCAudGwtcHJlXCI6IHtcbiAgICAgICAgICAgIFwibWluLXdpZHRoXCI6IFwiMTAwJVwiLFxuICAgICAgICAgICAgXCJmbG9hdFwiOiBcImxlZnRcIixcbiAgICAgICAgICAgIFwiY2xlYXJcIjogXCJsZWZ0XCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLWxpbmVcIjoge1xuICAgICAgICAgICAgZGlzcGxheTogXCJibG9ja1wiLFxuICAgICAgICAgICAgbWFyZ2luOiBcIjAgMC4yNWVtXCIsXG4gICAgICAgICAgICB3aWR0aDogXCI5OSVcIiwgLy8gQmVjYXVzZSBGaXJlZm94IHN1Y2tzXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLWRpZmYtaGVhZGVyID4gKlwiOiB7XG4gICAgICAgICAgICBwYWRkaW5nOiBcIjAuMjVlbVwiLFxuICAgICAgICB9LFxuXG4gICAgICAgIFwiI3RsIC50bC1kaWZmLWhlYWRlclwiOiB7XG4gICAgICAgICAgICBcInBhZGRpbmdcIjogXCIwLjI1ZW1cIixcbiAgICAgICAgICAgIFwibWFyZ2luLWJvdHRvbVwiOiBcIjAuNWVtXCIsXG4gICAgICAgICAgICBcImRpc3BsYXlcIjogXCJpbmxpbmUtYmxvY2tcIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCAudGwtbGluZTpmaXJzdC1jaGlsZCwgI3RsIC50bC1kaWZmLWhlYWRlciB+IC50bC1saW5lXCI6IHtcbiAgICAgICAgICAgIFwicGFkZGluZy10b3BcIjogXCIwLjI1ZW1cIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCAudGwtbGluZTpsYXN0LWNoaWxkXCI6IHtcbiAgICAgICAgICAgIFwicGFkZGluZy1ib3R0b21cIjogXCIwLjI1ZW1cIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCAudGwtZmFpbCAudGwtZGlzcGxheVwiOiB7XG4gICAgICAgICAgICBtYXJnaW46IFwiMC41ZW1cIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCAudGwtZGlzcGxheSA+ICpcIjoge1xuICAgICAgICAgICAgb3ZlcmZsb3c6IFwiYXV0b1wiLFxuICAgICAgICB9LFxuXG4gICAgICAgIFwiI3RsIC50bC1kaXNwbGF5ID4gOm5vdCg6bGFzdC1jaGlsZClcIjoge1xuICAgICAgICAgICAgXCJtYXJnaW4tYm90dG9tXCI6IFwiMC41ZW1cIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCAudGwtZGlmZi1hZGRlZFwiOiB7XG4gICAgICAgICAgICBcImNvbG9yXCI6IFwiIzBjMFwiLFxuICAgICAgICAgICAgXCJmb250LXdlaWdodFwiOiBcImJvbGRcIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCAudGwtZGlmZi1yZW1vdmVkXCI6IHtcbiAgICAgICAgICAgIFwiY29sb3JcIjogXCIjYzAwXCIsXG4gICAgICAgICAgICBcImZvbnQtd2VpZ2h0XCI6IFwiYm9sZFwiLFxuICAgICAgICB9LFxuXG4gICAgICAgIFwiI3RsIC50bC1zdGFjayAudGwtbGluZVwiOiB7XG4gICAgICAgICAgICBjb2xvcjogXCIjODAwXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLWRpZmY6OmJlZm9yZSwgI3RsIC50bC1zdGFjazo6YmVmb3JlXCI6IHtcbiAgICAgICAgICAgIFwiZm9udC13ZWlnaHRcIjogXCJub3JtYWxcIixcbiAgICAgICAgICAgIFwibWFyZ2luXCI6IFwiMC4yNWVtIDAuMjVlbSAwLjI1ZW0gMFwiLFxuICAgICAgICAgICAgXCJkaXNwbGF5XCI6IFwiYmxvY2tcIixcbiAgICAgICAgICAgIFwiZm9udC1zdHlsZVwiOiBcIml0YWxpY1wiLFxuICAgICAgICB9LFxuXG4gICAgICAgIFwiI3RsIC50bC1kaWZmOjpiZWZvcmVcIjoge1xuICAgICAgICAgICAgY29udGVudDogXCInRGlmZjonXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLXN0YWNrOjpiZWZvcmVcIjoge1xuICAgICAgICAgICAgY29udGVudDogXCInU3RhY2s6J1wiLFxuICAgICAgICB9LFxuXG4gICAgICAgIFwiI3RsIC50bC1oZWFkZXJcIjoge1xuICAgICAgICAgICAgXCJ0ZXh0LWFsaWduXCI6IFwicmlnaHRcIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCAudGwtaGVhZGVyID4gKlwiOiB7XG4gICAgICAgICAgICBcImRpc3BsYXlcIjogXCJpbmxpbmUtYmxvY2tcIixcbiAgICAgICAgICAgIFwidGV4dC1hbGlnblwiOiBcImNlbnRlclwiLFxuICAgICAgICAgICAgXCJwYWRkaW5nXCI6IFwiMC41ZW0gMC43NWVtXCIsXG4gICAgICAgICAgICBcImJvcmRlclwiOiBcIjJweCBzb2xpZCAjMDBjXCIsXG4gICAgICAgICAgICBcImJvcmRlci1yYWRpdXNcIjogXCIxZW1cIixcbiAgICAgICAgICAgIFwiYmFja2dyb3VuZC1jb2xvclwiOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICAgICAgICBcIm1hcmdpblwiOiBcIjAuMjVlbSAwLjVlbVwiLFxuICAgICAgICB9LFxuXG4gICAgICAgIFwiI3RsIC50bC1oZWFkZXIgPiA6Zm9jdXNcIjoge1xuICAgICAgICAgICAgb3V0bGluZTogXCJub25lXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLXJ1blwiOiB7XG4gICAgICAgICAgICBcImJvcmRlci1jb2xvclwiOiBcIiMwODBcIixcbiAgICAgICAgICAgIFwiYmFja2dyb3VuZC1jb2xvclwiOiBcIiMwYzBcIixcbiAgICAgICAgICAgIFwiY29sb3JcIjogXCJ3aGl0ZVwiLFxuICAgICAgICAgICAgXCJ3aWR0aFwiOiBcIjZlbVwiLFxuICAgICAgICB9LFxuXG4gICAgICAgIFwiI3RsIC50bC1ydW46aG92ZXJcIjoge1xuICAgICAgICAgICAgXCJiYWNrZ3JvdW5kLWNvbG9yXCI6IFwiIzhjOFwiLFxuICAgICAgICAgICAgXCJjb2xvclwiOiBcIndoaXRlXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLXRvZ2dsZS50bC1wYXNzXCI6IHtcbiAgICAgICAgICAgIFwiYm9yZGVyLWNvbG9yXCI6IFwiIzBjMFwiLFxuICAgICAgICB9LFxuXG4gICAgICAgIFwiI3RsIC50bC10b2dnbGUudGwtZmFpbFwiOiB7XG4gICAgICAgICAgICBcImJvcmRlci1jb2xvclwiOiBcIiNjMDBcIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCAudGwtdG9nZ2xlLnRsLXNraXBcIjoge1xuICAgICAgICAgICAgXCJib3JkZXItY29sb3JcIjogXCIjMDhjXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLXRvZ2dsZS50bC1wYXNzLnRsLWFjdGl2ZSwgI3RsIC50bC10b2dnbGUudGwtcGFzczphY3RpdmVcIjoge1xuICAgICAgICAgICAgXCJib3JkZXItY29sb3JcIjogXCIjMDgwXCIsXG4gICAgICAgICAgICBcImJhY2tncm91bmQtY29sb3JcIjogXCIjMGMwXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLXRvZ2dsZS50bC1mYWlsLnRsLWFjdGl2ZSwgI3RsIC50bC10b2dnbGUudGwtZmFpbDphY3RpdmVcIjoge1xuICAgICAgICAgICAgXCJib3JkZXItY29sb3JcIjogXCIjODAwXCIsXG4gICAgICAgICAgICBcImJhY2tncm91bmQtY29sb3JcIjogXCIjYzAwXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLXRvZ2dsZS50bC1za2lwLnRsLWFjdGl2ZSwgI3RsIC50bC10b2dnbGUudGwtc2tpcDphY3RpdmVcIjoge1xuICAgICAgICAgICAgXCJib3JkZXItY29sb3JcIjogXCIjMDU4XCIsXG4gICAgICAgICAgICBcImJhY2tncm91bmQtY29sb3JcIjogXCIjMDhjXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLXRvZ2dsZS50bC1wYXNzOmhvdmVyXCI6IHtcbiAgICAgICAgICAgIFwiYm9yZGVyLWNvbG9yXCI6IFwiIzBjMFwiLFxuICAgICAgICAgICAgXCJiYWNrZ3JvdW5kLWNvbG9yXCI6IFwiI2FmYVwiLFxuICAgICAgICB9LFxuXG4gICAgICAgIFwiI3RsIC50bC10b2dnbGUudGwtZmFpbDpob3ZlclwiOiB7XG4gICAgICAgICAgICBcImJvcmRlci1jb2xvclwiOiBcIiNjMDBcIixcbiAgICAgICAgICAgIFwiYmFja2dyb3VuZC1jb2xvclwiOiBcIiNmYWFcIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCAudGwtdG9nZ2xlLnRsLXNraXA6aG92ZXJcIjoge1xuICAgICAgICAgICAgXCJib3JkZXItY29sb3JcIjogXCIjMDhjXCIsXG4gICAgICAgICAgICBcImJhY2tncm91bmQtY29sb3JcIjogXCIjYmRmXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLXJlcG9ydC50bC1wYXNzIC50bC10ZXN0Om5vdCgudGwtcGFzcylcIjoge1xuICAgICAgICAgICAgZGlzcGxheTogXCJub25lXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLXJlcG9ydC50bC1mYWlsIC50bC10ZXN0Om5vdCgudGwtZmFpbClcIjoge1xuICAgICAgICAgICAgZGlzcGxheTogXCJub25lXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLXJlcG9ydC50bC1za2lwIC50bC10ZXN0Om5vdCgudGwtc2tpcClcIjoge1xuICAgICAgICAgICAgZGlzcGxheTogXCJub25lXCIsXG4gICAgICAgIH0sXG4gICAgfVxuXG4gICAgdmFyIGNzcyA9IFwiXCJcblxuICAgIGZ1bmN0aW9uIGFwcGVuZEJhc2Uoc2VsZWN0b3IsIHByb3BzKSB7XG4gICAgICAgIGNzcyArPSBzZWxlY3RvciArIFwie1wiXG5cbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkocHJvcHMpKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgYXBwZW5kUHJvcHMocHJvcHNbaV0pXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhcHBlbmRQcm9wcyhwcm9wcylcbiAgICAgICAgfVxuXG4gICAgICAgIGNzcyArPSBcIn1cIlxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFwcGVuZFByb3BzKHByb3BzKSB7XG4gICAgICAgIGZvciAodmFyIGtleSBpbiBwcm9wcykge1xuICAgICAgICAgICAgaWYgKGhhc093bi5jYWxsKHByb3BzLCBrZXkpKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBwcm9wc1trZXldID09PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgICAgICAgICAgIGFwcGVuZEJhc2Uoa2V5LCBwcm9wc1trZXldKVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNzcyArPSBrZXkgKyBcIjpcIiArIHByb3BzW2tleV0gKyBcIjtcIlxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZvciAodmFyIHNlbGVjdG9yIGluIHN0eWxlT2JqZWN0KSB7XG4gICAgICAgIGlmIChoYXNPd24uY2FsbChzdHlsZU9iamVjdCwgc2VsZWN0b3IpKSB7XG4gICAgICAgICAgICBhcHBlbmRCYXNlKHNlbGVjdG9yLCBzdHlsZU9iamVjdFtzZWxlY3Rvcl0pXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gY3NzLmNvbmNhdCgpIC8vIEhpbnQgdG8gZmxhdHRlbi5cbn0pXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKCkge1xuICAgIGlmIChELmRvY3VtZW50LmhlYWQucXVlcnlTZWxlY3RvcihcInN0eWxlW2RhdGEtdGwtc3R5bGVdXCIpID09IG51bGwpIHtcbiAgICAgICAgdmFyIHN0eWxlID0gRC5kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3R5bGVcIilcblxuICAgICAgICBzdHlsZS50eXBlID0gXCJ0ZXh0L2Nzc1wiXG4gICAgICAgIHN0eWxlLnNldEF0dHJpYnV0ZShcImRhdGEtdGwtc3R5bGVcIiwgXCJcIilcbiAgICAgICAgaWYgKHN0eWxlLnN0eWxlU2hlZXQpIHtcbiAgICAgICAgICAgIHN0eWxlLnN0eWxlU2hlZXQuY3NzVGV4dCA9IHN0eWxlcygpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzdHlsZS5hcHBlbmRDaGlsZChELmRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHN0eWxlcygpKSlcbiAgICAgICAgfVxuXG4gICAgICAgIEQuZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsZSlcbiAgICB9XG59XG4iLCJcInVzZSBzdHJpY3RcIlxuXG4vKipcbiAqIFRoZSBnbG9iYWwgaW5qZWN0aW9ucyBmb3IgdGhlIERPTS4gTWFpbmx5IGZvciBkZWJ1Z2dpbmcuXG4gKi9cblxuZXhwb3J0cy5kb2N1bWVudCA9IGdsb2JhbC5kb2N1bWVudFxuZXhwb3J0cy53aW5kb3cgPSBnbG9iYWwud2luZG93XG4iLCJcInVzZSBzdHJpY3RcIlxuXG52YXIgVXRpbCA9IHJlcXVpcmUoXCIuLi91dGlsXCIpXG52YXIgRCA9IHJlcXVpcmUoXCIuL2luamVjdFwiKVxudmFyIG5vdyA9IERhdGUubm93IC8vIEF2b2lkIFNpbm9uJ3MgbW9ja1xudmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHlcblxuLyoqXG4gKiBUZXN0IHJ1bm5lciBhbmQgc2NyaXB0IGxvYWRlclxuICovXG5cbmZ1bmN0aW9uIHVuY2FjaGVkKGZpbGUpIHtcbiAgICBpZiAoZmlsZS5pbmRleE9mKFwiP1wiKSA8IDApIHtcbiAgICAgICAgcmV0dXJuIGZpbGUgKyBcIj9sb2FkZWQ9XCIgKyBub3coKVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBmaWxlICsgXCImbG9hZGVkPVwiICsgbm93KClcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGxvYWRTY3JpcHQoZmlsZSwgdGltZW91dCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIHZhciBzY3JpcHQgPSBELmRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzY3JpcHRcIilcbiAgICAgICAgdmFyIHRpbWVyID0gZ2xvYmFsLnNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY2xlYXIoKVxuICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihcIlRpbWVvdXQgZXhjZWVkZWQgbG9hZGluZyAnXCIgKyBmaWxlICsgXCInXCIpKVxuICAgICAgICB9LCB0aW1lb3V0KVxuXG4gICAgICAgIGZ1bmN0aW9uIGNsZWFyKGV2KSB7XG4gICAgICAgICAgICBpZiAoZXYgIT0gbnVsbCkgZXYucHJldmVudERlZmF1bHQoKVxuICAgICAgICAgICAgaWYgKGV2ICE9IG51bGwpIGV2LnN0b3BQcm9wYWdhdGlvbigpXG4gICAgICAgICAgICBnbG9iYWwuY2xlYXJUaW1lb3V0KHRpbWVyKVxuICAgICAgICAgICAgc2NyaXB0Lm9ubG9hZCA9IHVuZGVmaW5lZFxuICAgICAgICAgICAgc2NyaXB0Lm9uZXJyb3IgPSB1bmRlZmluZWRcbiAgICAgICAgICAgIEQuZG9jdW1lbnQuaGVhZC5yZW1vdmVDaGlsZChzY3JpcHQpXG4gICAgICAgIH1cblxuICAgICAgICBzY3JpcHQuc3JjID0gdW5jYWNoZWQoZmlsZSlcbiAgICAgICAgc2NyaXB0LmFzeW5jID0gdHJ1ZVxuICAgICAgICBzY3JpcHQuZGVmZXIgPSB0cnVlXG4gICAgICAgIHNjcmlwdC5vbmxvYWQgPSBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgICAgIGNsZWFyKGV2KVxuICAgICAgICAgICAgcmVzb2x2ZSgpXG4gICAgICAgIH1cblxuICAgICAgICBzY3JpcHQub25lcnJvciA9IGZ1bmN0aW9uIChldikge1xuICAgICAgICAgICAgY2xlYXIoZXYpXG4gICAgICAgICAgICByZWplY3QoZXYpXG4gICAgICAgIH1cblxuICAgICAgICBELmRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc2NyaXB0KVxuICAgIH0pXG59XG5cbmZ1bmN0aW9uIHRyeURlbGV0ZShrZXkpIHtcbiAgICB0cnkge1xuICAgICAgICBkZWxldGUgZ2xvYmFsW2tleV1cbiAgICB9IGNhdGNoIChfKSB7XG4gICAgICAgIC8vIGlnbm9yZVxuICAgIH1cbn1cblxuZnVuY3Rpb24gZGVzY3JpcHRvckNoYW5nZWQoYSwgYikge1xuICAgIC8vIE5vdGU6IGlmIHRoZSBkZXNjcmlwdG9yIHdhcyByZW1vdmVkLCBpdCB3b3VsZCd2ZSBiZWVuIGRlbGV0ZWQsIGFueXdheXMuXG4gICAgaWYgKGEgPT0gbnVsbCkgcmV0dXJuIGZhbHNlXG4gICAgaWYgKGEuY29uZmlndXJhYmxlICE9PSBiLmNvbmZpZ3VyYWJsZSkgcmV0dXJuIHRydWVcbiAgICBpZiAoYS5lbnVtZXJhYmxlICE9PSBiLmVudW1lcmFibGUpIHJldHVybiB0cnVlXG4gICAgaWYgKGEud3JpdGFibGUgIT09IGIud3JpdGFibGUpIHJldHVybiB0cnVlXG4gICAgaWYgKGEuZ2V0ICE9PSBiLmdldCkgcmV0dXJuIHRydWVcbiAgICBpZiAoYS5zZXQgIT09IGIuc2V0KSByZXR1cm4gdHJ1ZVxuICAgIGlmIChhLnZhbHVlICE9PSBiLnZhbHVlKSByZXR1cm4gdHJ1ZVxuICAgIHJldHVybiBmYWxzZVxufVxuXG4vLyBUaGVzZSBmaXJlIGRlcHJlY2F0aW9uIHdhcm5pbmdzLCBhbmQgdGh1cyBzaG91bGQgYmUgYXZvaWRlZC5cbnZhciBibGFja2xpc3QgPSBPYmplY3QuZnJlZXplKHtcbiAgICB3ZWJraXRTdG9yYWdlSW5mbzogdHJ1ZSxcbiAgICB3ZWJraXRJbmRleGVkREI6IHRydWUsXG59KVxuXG5mdW5jdGlvbiBmaW5kR2xvYmFscygpIHtcbiAgICB2YXIgZm91bmQgPSBPYmplY3Qua2V5cyhnbG9iYWwpXG4gICAgdmFyIGdsb2JhbHMgPSBPYmplY3QuY3JlYXRlKG51bGwpXG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGZvdW5kLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBrZXkgPSBmb3VuZFtpXVxuXG4gICAgICAgIGlmICghaGFzT3duLmNhbGwoYmxhY2tsaXN0LCBrZXkpKSB7XG4gICAgICAgICAgICBnbG9iYWxzW2tleV0gPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKGdsb2JhbCwga2V5KVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGdsb2JhbHNcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAob3B0cywgc3RhdGUpIHtcbiAgICBpZiAoc3RhdGUubG9ja2VkKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoXG4gICAgICAgICAgICBcIlRoZSB0ZXN0IHN1aXRlIG11c3Qgbm90IGJlIHJ1biBhZnRlciB0aGUgdmlldyBoYXMgYmVlbiBkZXRhY2hlZC5cIlxuICAgICAgICApKVxuICAgIH1cblxuICAgIGlmIChzdGF0ZS5jdXJyZW50UHJvbWlzZSAhPSBudWxsKSByZXR1cm4gc3RhdGUuY3VycmVudFByb21pc2VcblxuICAgIG9wdHMudGhhbGxpdW0uY2xlYXJUZXN0cygpXG5cbiAgICAvLyBEZXRlY3QgYW5kIHJlbW92ZSBnbG9iYWxzIGNyZWF0ZWQgYnkgbG9hZGVkIHNjcmlwdHMuXG4gICAgdmFyIGdsb2JhbHMgPSBmaW5kR2xvYmFscygpXG5cbiAgICBmdW5jdGlvbiBjbGVhbnVwKCkge1xuICAgICAgICB2YXIgZm91bmQgPSBPYmplY3Qua2V5cyhnbG9iYWwpXG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBmb3VuZC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGtleSA9IGZvdW5kW2ldXG5cbiAgICAgICAgICAgIGlmICghaGFzT3duLmNhbGwoZ2xvYmFscywga2V5KSkge1xuICAgICAgICAgICAgICAgIHRyeURlbGV0ZShrZXkpXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGRlc2NyaXB0b3JDaGFuZ2VkKFxuICAgICAgICAgICAgICAgIE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IoZ2xvYmFsLCBrZXkpLFxuICAgICAgICAgICAgICAgIGdsb2JhbHNba2V5XVxuICAgICAgICAgICAgKSkge1xuICAgICAgICAgICAgICAgIHRyeURlbGV0ZShrZXkpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBzdGF0ZS5jdXJyZW50UHJvbWlzZSA9IHVuZGVmaW5lZFxuICAgIH1cblxuICAgIHJldHVybiBzdGF0ZS5jdXJyZW50UHJvbWlzZSA9IFByb21pc2UucmVzb2x2ZSgpXG4gICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICBzdGF0ZS5wYXNzLnRleHRDb250ZW50ID0gXCIwXCJcbiAgICAgICAgc3RhdGUuZmFpbC50ZXh0Q29udGVudCA9IFwiMFwiXG4gICAgICAgIHN0YXRlLnNraXAudGV4dENvbnRlbnQgPSBcIjBcIlxuICAgICAgICByZXR1cm4gb3B0cy5wcmVsb2FkKClcbiAgICB9KVxuICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIFV0aWwucGVhY2gob3B0cy5maWxlcywgZnVuY3Rpb24gKGZpbGUpIHtcbiAgICAgICAgICAgIHJldHVybiBsb2FkU2NyaXB0KGZpbGUsIG9wdHMudGltZW91dClcbiAgICAgICAgfSlcbiAgICB9KVxuICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIG9wdHMucHJlcnVuKCkgfSlcbiAgICAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiBvcHRzLnRoYWxsaXVtLnJ1bigpIH0pXG4gICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gb3B0cy5wb3N0cnVuKCkgfSlcbiAgICAuY2F0Y2goZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShvcHRzLmVycm9yKGUpKS50aGVuKGZ1bmN0aW9uICgpIHsgdGhyb3cgZSB9KVxuICAgIH0pXG4gICAgLnRoZW4oXG4gICAgICAgIGZ1bmN0aW9uICgpIHsgY2xlYW51cCgpIH0sXG4gICAgICAgIGZ1bmN0aW9uIChlKSB7IGNsZWFudXAoKTsgdGhyb3cgZSB9KVxufVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxudmFyIGRpZmYgPSByZXF1aXJlKFwiZGlmZlwiKVxudmFyIFIgPSByZXF1aXJlKFwiLi4vcmVwb3J0ZXJcIilcbnZhciBEID0gcmVxdWlyZShcIi4vaW5qZWN0XCIpXG52YXIgcnVuVGVzdHMgPSByZXF1aXJlKFwiLi9ydW4tdGVzdHNcIilcbnZhciBpbnNwZWN0ID0gcmVxdWlyZShcImNsZWFuLWFzc2VydC11dGlsXCIpLmluc3BlY3RcblxuLyoqXG4gKiBWaWV3IGxvZ2ljXG4gKi9cblxuZnVuY3Rpb24gdCh0ZXh0KSB7XG4gICAgcmV0dXJuIEQuZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGV4dClcbn1cblxuZnVuY3Rpb24gaCh0eXBlLCBhdHRycywgY2hpbGRyZW4pIHtcbiAgICB2YXIgcGFydHMgPSB0eXBlLnNwbGl0KC9cXHMrL2cpXG5cbiAgICBpZiAoQXJyYXkuaXNBcnJheShhdHRycykpIHtcbiAgICAgICAgY2hpbGRyZW4gPSBhdHRyc1xuICAgICAgICBhdHRycyA9IHVuZGVmaW5lZFxuICAgIH1cblxuICAgIGlmIChhdHRycyA9PSBudWxsKSBhdHRycyA9IHt9XG4gICAgaWYgKGNoaWxkcmVuID09IG51bGwpIGNoaWxkcmVuID0gW11cblxuICAgIHR5cGUgPSBwYXJ0c1swXVxuICAgIGF0dHJzLmNsYXNzTmFtZSA9IHBhcnRzLnNsaWNlKDEpLmpvaW4oXCIgXCIpXG5cbiAgICB2YXIgZWxlbSA9IEQuZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0eXBlKVxuXG4gICAgT2JqZWN0LmtleXMoYXR0cnMpLmZvckVhY2goZnVuY3Rpb24gKGF0dHIpIHtcbiAgICAgICAgZWxlbVthdHRyXSA9IGF0dHJzW2F0dHJdXG4gICAgfSlcblxuICAgIGNoaWxkcmVuLmZvckVhY2goZnVuY3Rpb24gKGNoaWxkKSB7XG4gICAgICAgIGlmIChjaGlsZCAhPSBudWxsKSBlbGVtLmFwcGVuZENoaWxkKGNoaWxkKVxuICAgIH0pXG5cbiAgICByZXR1cm4gZWxlbVxufVxuXG5mdW5jdGlvbiB1bmlmaWVkRGlmZihlcnIpIHtcbiAgICB2YXIgYWN0dWFsID0gaW5zcGVjdChlcnIuYWN0dWFsKVxuICAgIHZhciBleHBlY3RlZCA9IGluc3BlY3QoZXJyLmV4cGVjdGVkKVxuICAgIHZhciBtc2cgPSBkaWZmLmNyZWF0ZVBhdGNoKFwic3RyaW5nXCIsIGFjdHVhbCwgZXhwZWN0ZWQpXG4gICAgICAgIC5zcGxpdCgvXFxyP1xcbnxcXHIvZykuc2xpY2UoNClcbiAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAobGluZSkgeyByZXR1cm4gIS9eXFxAXFxAfF5cXFxcIE5vIG5ld2xpbmUvLnRlc3QobGluZSkgfSlcbiAgICB2YXIgZW5kID0gbXNnLmxlbmd0aFxuXG4gICAgd2hpbGUgKGVuZCAhPT0gMCAmJiAvXlxccyokL2cudGVzdChtc2dbZW5kIC0gMV0pKSBlbmQtLVxuICAgIHJldHVybiBoKFwiZGl2IHRsLWRpZmZcIiwgW1xuICAgICAgICBoKFwiZGl2IHRsLWRpZmYtaGVhZGVyXCIsIFtcbiAgICAgICAgICAgIGgoXCJzcGFuIHRsLWRpZmYtYWRkZWRcIiwgW3QoXCIrIGV4cGVjdGVkXCIpXSksXG4gICAgICAgICAgICBoKFwic3BhbiB0bC1kaWZmLXJlbW92ZWRcIiwgW3QoXCItIGFjdHVhbFwiKV0pLFxuICAgICAgICBdKSxcbiAgICAgICAgaChcImRpdiB0bC1wcmVcIiwgIWVuZFxuICAgICAgICAgICAgPyBbaChcInNwYW4gdGwtbGluZSB0bC1kaWZmLWFkZGVkXCIsIFt0KFwiIChub25lKVwiKV0pXVxuICAgICAgICAgICAgOiBtc2cuc2xpY2UoMCwgZW5kKVxuICAgICAgICAgICAgLm1hcChmdW5jdGlvbiAobGluZSkgeyByZXR1cm4gbGluZS50cmltUmlnaHQoKSB9KVxuICAgICAgICAgICAgLm1hcChmdW5jdGlvbiAobGluZSkge1xuICAgICAgICAgICAgICAgIGlmIChsaW5lWzBdID09PSBcIitcIikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaChcInNwYW4gdGwtbGluZSB0bC1kaWZmLWFkZGVkXCIsIFt0KGxpbmUpXSlcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGxpbmVbMF0gPT09IFwiLVwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBoKFwic3BhbiB0bC1saW5lIHRsLWRpZmYtcmVtb3ZlZFwiLCBbdChsaW5lKV0pXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGgoXCJzcGFuIHRsLWxpbmUgdGwtZGlmZi1ub25lXCIsIFt0KGxpbmUpXSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICApLFxuICAgIF0pXG59XG5cbmZ1bmN0aW9uIHRvTGluZXMoc3RyKSB7XG4gICAgcmV0dXJuIGgoXCJkaXYgdGwtcHJlXCIsIHN0ci5zcGxpdCgvXFxyP1xcbnxcXHIvZykubWFwKGZ1bmN0aW9uIChsaW5lKSB7XG4gICAgICAgIHJldHVybiBoKFwic3BhbiB0bC1saW5lXCIsIFt0KGxpbmUudHJpbVJpZ2h0KCkpXSlcbiAgICB9KSlcbn1cblxuZnVuY3Rpb24gZm9ybWF0RXJyb3IoZSwgc2hvd0RpZmYpIHtcbiAgICB2YXIgc3RhY2sgPSBSLnJlYWRTdGFjayhlKVxuXG4gICAgcmV0dXJuIGgoXCJkaXYgdGwtZGlzcGxheVwiLCBbXG4gICAgICAgIGgoXCJkaXYgdGwtbWVzc2FnZVwiLCBbdG9MaW5lcyhlLm5hbWUgKyBcIjogXCIgKyBlLm1lc3NhZ2UpXSksXG4gICAgICAgIHNob3dEaWZmID8gdW5pZmllZERpZmYoZSkgOiB1bmRlZmluZWQsXG4gICAgICAgIHN0YWNrID8gaChcImRpdiB0bC1zdGFja1wiLCBbdG9MaW5lcyhzdGFjayldKSA6IHVuZGVmaW5lZCxcbiAgICBdKVxufVxuXG5mdW5jdGlvbiBzaG93VGVzdChfLCByZXBvcnQsIGNsYXNzTmFtZSwgY2hpbGQpIHtcbiAgICB2YXIgZW5kID0gcmVwb3J0LnBhdGgubGVuZ3RoIC0gMVxuICAgIHZhciBuYW1lID0gcmVwb3J0LnBhdGhbZW5kXS5uYW1lXG4gICAgdmFyIHBhcmVudCA9IF8uZ2V0KHJlcG9ydC5wYXRoLCBlbmQpXG4gICAgdmFyIHNwZWVkID0gUi5zcGVlZChyZXBvcnQpXG5cbiAgICBpZiAoc3BlZWQgPT09IFwiZmFzdFwiKSB7XG4gICAgICAgIHBhcmVudC5ub2RlLmFwcGVuZENoaWxkKGgoXCJsaSBcIiArIGNsYXNzTmFtZSArIFwiIHRsLWZhc3RcIiwgW1xuICAgICAgICAgICAgaChcImgyXCIsIFt0KG5hbWUpXSksXG4gICAgICAgICAgICBjaGlsZCxcbiAgICAgICAgXSkpXG4gICAgfSBlbHNlIHtcbiAgICAgICAgcGFyZW50Lm5vZGUuYXBwZW5kQ2hpbGQoaChcImxpIFwiICsgY2xhc3NOYW1lICsgXCIgdGwtXCIgKyBzcGVlZCwgW1xuICAgICAgICAgICAgaChcImgyXCIsIFtcbiAgICAgICAgICAgICAgICB0KG5hbWUgKyBcIiAoXCIpLFxuICAgICAgICAgICAgICAgIGgoXCJzcGFuIHRsLWR1cmF0aW9uXCIsIFt0KFIuZm9ybWF0VGltZShyZXBvcnQuZHVyYXRpb24pKV0pLFxuICAgICAgICAgICAgICAgIHQoXCIpXCIpLFxuICAgICAgICAgICAgXSksXG4gICAgICAgICAgICBjaGlsZCxcbiAgICAgICAgXSkpXG4gICAgfVxuXG4gICAgXy5vcHRzLmR1cmF0aW9uLnRleHRDb250ZW50ID0gUi5mb3JtYXRUaW1lKF8uZHVyYXRpb24pXG59XG5cbmZ1bmN0aW9uIHNob3dTa2lwKF8sIHJlcG9ydCkge1xuICAgIHZhciBlbmQgPSByZXBvcnQucGF0aC5sZW5ndGggLSAxXG4gICAgdmFyIG5hbWUgPSByZXBvcnQucGF0aFtlbmRdLm5hbWVcbiAgICB2YXIgcGFyZW50ID0gXy5nZXQocmVwb3J0LnBhdGgsIGVuZClcblxuICAgIHBhcmVudC5ub2RlLmFwcGVuZENoaWxkKGgoXCJsaSB0bC10ZXN0IHRsLXNraXBcIiwgW1xuICAgICAgICBoKFwiaDJcIiwgW3QobmFtZSldKSxcbiAgICBdKSlcbn1cblxuZXhwb3J0cy5uZXh0RnJhbWUgPSBuZXh0RnJhbWVcbmZ1bmN0aW9uIG5leHRGcmFtZShmdW5jKSB7XG4gICAgaWYgKEQud2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSkge1xuICAgICAgICBELndpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZnVuYylcbiAgICB9IGVsc2Uge1xuICAgICAgICBnbG9iYWwuc2V0VGltZW91dChmdW5jLCAwKVxuICAgIH1cbn1cblxuZXhwb3J0cy5yZXBvcnQgPSBmdW5jdGlvbiAoXywgcmVwb3J0KSB7XG4gICAgaWYgKHJlcG9ydC5pc1N0YXJ0KSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSkge1xuICAgICAgICAgICAgLy8gQ2xlYXIgdGhlIGVsZW1lbnQgZmlyc3QsIGp1c3QgaW4gY2FzZS5cbiAgICAgICAgICAgIHdoaWxlIChfLm9wdHMucmVwb3J0LmZpcnN0Q2hpbGQpIHtcbiAgICAgICAgICAgICAgICBfLm9wdHMucmVwb3J0LnJlbW92ZUNoaWxkKF8ub3B0cy5yZXBvcnQuZmlyc3RDaGlsZClcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gRGVmZXIgdGhlIG5leHQgZnJhbWUsIHNvIHRoZSBjdXJyZW50IGNoYW5nZXMgY2FuIGJlIHNlbnQsIGluIGNhc2VcbiAgICAgICAgICAgIC8vIGl0J3MgY2xlYXJpbmcgb2xkIHRlc3QgcmVzdWx0cyBmcm9tIGEgbGFyZ2Ugc3VpdGUuIChDaHJvbWUgZG9lc1xuICAgICAgICAgICAgLy8gYmV0dGVyIGJhdGNoaW5nIHRoaXMgd2F5LCBhdCBsZWFzdC4pXG4gICAgICAgICAgICBuZXh0RnJhbWUoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIF8uZ2V0KHVuZGVmaW5lZCwgMCkubm9kZSA9IF8ub3B0cy5yZXBvcnRcbiAgICAgICAgICAgICAgICBfLm9wdHMuZHVyYXRpb24udGV4dENvbnRlbnQgPSBSLmZvcm1hdFRpbWUoMClcbiAgICAgICAgICAgICAgICBfLm9wdHMucGFzcy50ZXh0Q29udGVudCA9IFwiMFwiXG4gICAgICAgICAgICAgICAgXy5vcHRzLmZhaWwudGV4dENvbnRlbnQgPSBcIjBcIlxuICAgICAgICAgICAgICAgIF8ub3B0cy5za2lwLnRleHRDb250ZW50ID0gXCIwXCJcbiAgICAgICAgICAgICAgICByZXNvbHZlKClcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pXG4gICAgfSBlbHNlIGlmIChyZXBvcnQuaXNFbnRlcikge1xuICAgICAgICB2YXIgY2hpbGQgPSBoKFwidWxcIilcblxuICAgICAgICBfLmdldChyZXBvcnQucGF0aCkubm9kZSA9IGNoaWxkXG4gICAgICAgIHNob3dUZXN0KF8sIHJlcG9ydCwgXCJ0bC1zdWl0ZSB0bC1wYXNzXCIsIGNoaWxkKVxuICAgICAgICBfLm9wdHMucGFzcy50ZXh0Q29udGVudCA9IF8ucGFzc1xuICAgIH0gZWxzZSBpZiAocmVwb3J0LmlzUGFzcykge1xuICAgICAgICBzaG93VGVzdChfLCByZXBvcnQsIFwidGwtdGVzdCB0bC1wYXNzXCIpXG4gICAgICAgIF8ub3B0cy5wYXNzLnRleHRDb250ZW50ID0gXy5wYXNzXG4gICAgfSBlbHNlIGlmIChyZXBvcnQuaXNGYWlsKSB7XG4gICAgICAgIHNob3dUZXN0KF8sIHJlcG9ydCwgXCJ0bC10ZXN0IHRsLWZhaWxcIiwgZm9ybWF0RXJyb3IocmVwb3J0LmVycm9yLFxuICAgICAgICAgICAgcmVwb3J0LmVycm9yLm5hbWUgPT09IFwiQXNzZXJ0aW9uRXJyb3JcIiAmJlxuICAgICAgICAgICAgICAgIHJlcG9ydC5lcnJvci5zaG93RGlmZiAhPT0gZmFsc2UpKVxuICAgICAgICBfLm9wdHMuZmFpbC50ZXh0Q29udGVudCA9IF8uZmFpbFxuICAgIH0gZWxzZSBpZiAocmVwb3J0LmlzU2tpcCkge1xuICAgICAgICBzaG93U2tpcChfLCByZXBvcnQsIFwidGwtdGVzdCB0bC1za2lwXCIpXG4gICAgICAgIF8ub3B0cy5za2lwLnRleHRDb250ZW50ID0gXy5za2lwXG4gICAgfSBlbHNlIGlmIChyZXBvcnQuaXNFcnJvcikge1xuICAgICAgICBfLm9wdHMucmVwb3J0LmFwcGVuZENoaWxkKGgoXCJsaSB0bC1lcnJvclwiLCBbXG4gICAgICAgICAgICBoKFwiaDJcIiwgW3QoXCJJbnRlcm5hbCBlcnJvclwiKV0pLFxuICAgICAgICAgICAgZm9ybWF0RXJyb3IocmVwb3J0LmVycm9yLCBmYWxzZSksXG4gICAgICAgIF0pKVxuICAgIH1cblxuICAgIHJldHVybiB1bmRlZmluZWRcbn1cblxuZnVuY3Rpb24gbWFrZUNvdW50ZXIoc3RhdGUsIGNoaWxkLCBsYWJlbCwgbmFtZSkge1xuICAgIHJldHVybiBoKFwiYnV0dG9uIHRsLXRvZ2dsZSBcIiArIG5hbWUsIHtcbiAgICAgICAgb25jbGljazogZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgICAgICBldi5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKVxuXG4gICAgICAgICAgICBpZiAoL1xcYnRsLWFjdGl2ZVxcYi8udGVzdCh0aGlzLmNsYXNzTmFtZSkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNsYXNzTmFtZSA9IHRoaXMuY2xhc3NOYW1lXG4gICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXGJ0bC1hY3RpdmVcXGIvZywgXCJcIilcbiAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xccysvZywgXCIgXCIpXG4gICAgICAgICAgICAgICAgICAgIC50cmltKClcbiAgICAgICAgICAgICAgICBzdGF0ZS5yZXBvcnQuY2xhc3NOYW1lID0gc3RhdGUucmVwb3J0LmNsYXNzTmFtZVxuICAgICAgICAgICAgICAgICAgICAucmVwbGFjZShuZXcgUmVnRXhwKFwiXFxcXGJcIiArIG5hbWUgKyBcIlxcXFxiXCIsIFwiZ1wiKSwgXCJcIilcbiAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xccysvZywgXCIgXCIpXG4gICAgICAgICAgICAgICAgICAgIC50cmltKClcbiAgICAgICAgICAgICAgICBzdGF0ZS5hY3RpdmUgPSB1bmRlZmluZWRcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXRlLmFjdGl2ZSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0YXRlLmFjdGl2ZS5jbGFzc05hbWUgPSBzdGF0ZS5hY3RpdmUuY2xhc3NOYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxidGwtYWN0aXZlXFxiL2csIFwiXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxzKy9nLCBcIiBcIilcbiAgICAgICAgICAgICAgICAgICAgICAgIC50cmltKClcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBzdGF0ZS5hY3RpdmUgPSB0aGlzXG4gICAgICAgICAgICAgICAgdGhpcy5jbGFzc05hbWUgKz0gXCIgdGwtYWN0aXZlXCJcbiAgICAgICAgICAgICAgICBzdGF0ZS5yZXBvcnQuY2xhc3NOYW1lID0gc3RhdGUucmVwb3J0LmNsYXNzTmFtZVxuICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxidGwtKHBhc3N8ZmFpbHxza2lwKVxcYi9nLCBcIlwiKVxuICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxzKy9nLCBcIiBcIilcbiAgICAgICAgICAgICAgICAgICAgLnRyaW0oKSArIFwiIFwiICsgbmFtZVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgIH0sIFt0KGxhYmVsKSwgY2hpbGRdKVxufVxuXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiAob3B0cykge1xuICAgIHZhciBzdGF0ZSA9IHtcbiAgICAgICAgY3VycmVudFByb21pc2U6IHVuZGVmaW5lZCxcbiAgICAgICAgbG9ja2VkOiBmYWxzZSxcbiAgICAgICAgZHVyYXRpb246IGgoXCJlbVwiLCBbdChSLmZvcm1hdFRpbWUoMCkpXSksXG4gICAgICAgIHBhc3M6IGgoXCJlbVwiLCBbdChcIjBcIildKSxcbiAgICAgICAgZmFpbDogaChcImVtXCIsIFt0KFwiMFwiKV0pLFxuICAgICAgICBza2lwOiBoKFwiZW1cIiwgW3QoXCIwXCIpXSksXG4gICAgICAgIHJlcG9ydDogaChcInVsIHRsLXJlcG9ydFwiKSxcbiAgICAgICAgYWN0aXZlOiB1bmRlZmluZWQsXG4gICAgfVxuXG4gICAgdmFyIGhlYWRlciA9IGgoXCJkaXYgdGwtaGVhZGVyXCIsIFtcbiAgICAgICAgaChcImRpdiB0bC1kdXJhdGlvblwiLCBbdChcIkR1cmF0aW9uOiBcIiksIHN0YXRlLmR1cmF0aW9uXSksXG4gICAgICAgIG1ha2VDb3VudGVyKHN0YXRlLCBzdGF0ZS5wYXNzLCBcIlBhc3NlczogXCIsIFwidGwtcGFzc1wiKSxcbiAgICAgICAgbWFrZUNvdW50ZXIoc3RhdGUsIHN0YXRlLmZhaWwsIFwiRmFpbHVyZXM6IFwiLCBcInRsLWZhaWxcIiksXG4gICAgICAgIG1ha2VDb3VudGVyKHN0YXRlLCBzdGF0ZS5za2lwLCBcIlNraXBwZWQ6IFwiLCBcInRsLXNraXBcIiksXG4gICAgICAgIGgoXCJidXR0b24gdGwtcnVuXCIsIHtcbiAgICAgICAgICAgIG9uY2xpY2s6IGZ1bmN0aW9uIChldikge1xuICAgICAgICAgICAgICAgIGV2LnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgICAgICAgICAgIHJ1blRlc3RzKG9wdHMsIHN0YXRlKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSwgW3QoXCJSdW5cIildKSxcbiAgICBdKVxuXG4gICAgdmFyIHJvb3QgPSBELmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidGxcIilcblxuICAgIGlmIChyb290ID09IG51bGwpIHtcbiAgICAgICAgRC5kb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHJvb3QgPSBoKFwiZGl2XCIsIHtpZDogXCJ0bFwifSwgW1xuICAgICAgICAgICAgaGVhZGVyLFxuICAgICAgICAgICAgc3RhdGUucmVwb3J0LFxuICAgICAgICBdKSlcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBDbGVhciB0aGUgZWxlbWVudCBmaXJzdCwganVzdCBpbiBjYXNlLlxuICAgICAgICB3aGlsZSAocm9vdC5maXJzdENoaWxkKSByb290LnJlbW92ZUNoaWxkKHJvb3QuZmlyc3RDaGlsZClcbiAgICAgICAgcm9vdC5hcHBlbmRDaGlsZChoZWFkZXIpXG4gICAgICAgIHJvb3QuYXBwZW5kQ2hpbGQoc3RhdGUucmVwb3J0KVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIHJvb3Q6IHJvb3QsXG4gICAgICAgIHN0YXRlOiBzdGF0ZSxcbiAgICB9XG59XG4iLCJcInVzZSBzdHJpY3RcIlxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChCYXNlLCBTdXBlcikge1xuICAgIHZhciBzdGFydCA9IDJcblxuICAgIGlmICh0eXBlb2YgU3VwZXIgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICBCYXNlLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoU3VwZXIucHJvdG90eXBlKVxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoQmFzZS5wcm90b3R5cGUsIFwiY29uc3RydWN0b3JcIiwge1xuICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgICAgIHZhbHVlOiBCYXNlLFxuICAgICAgICB9KVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHN0YXJ0ID0gMVxuICAgIH1cblxuICAgIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgbWV0aG9kcyA9IGFyZ3VtZW50c1tpXVxuXG4gICAgICAgIGlmIChtZXRob2RzICE9IG51bGwpIHtcbiAgICAgICAgICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMobWV0aG9kcylcblxuICAgICAgICAgICAgZm9yICh2YXIgayA9IDA7IGsgPCBrZXlzLmxlbmd0aDsgaysrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGtleSA9IGtleXNba11cbiAgICAgICAgICAgICAgICB2YXIgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IobWV0aG9kcywga2V5KVxuXG4gICAgICAgICAgICAgICAgZGVzYy5lbnVtZXJhYmxlID0gZmFsc2VcbiAgICAgICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoQmFzZS5wcm90b3R5cGUsIGtleSwgZGVzYylcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cbiIsIlwidXNlIHN0cmljdFwiXG5cbi8qKlxuICogVGhpcyBjb250YWlucyB0aGUgYnJvd3NlciBjb25zb2xlIHN0dWZmLlxuICovXG5cbmV4cG9ydHMuU3ltYm9scyA9IE9iamVjdC5mcmVlemUoe1xuICAgIFBhc3M6IFwi4pyTXCIsXG4gICAgRmFpbDogXCLinJZcIixcbiAgICBEb3Q6IFwi4oCkXCIsXG4gICAgRG90RmFpbDogXCIhXCIsXG59KVxuXG5leHBvcnRzLndpbmRvd1dpZHRoID0gNzVcbmV4cG9ydHMubmV3bGluZSA9IFwiXFxuXCJcblxuLy8gQ29sb3Igc3VwcG9ydCBpcyB1bmZvcmNlZCBhbmQgdW5zdXBwb3J0ZWQsIHNpbmNlIHlvdSBjYW4gb25seSBzcGVjaWZ5XG4vLyBsaW5lLWJ5LWxpbmUgY29sb3JzIHZpYSBDU1MsIGFuZCBldmVuIHRoYXQgaXNuJ3QgdmVyeSBwb3J0YWJsZS5cbmV4cG9ydHMuY29sb3JTdXBwb3J0ID0gMFxuXG4vKipcbiAqIFNpbmNlIGJyb3dzZXJzIGRvbid0IGhhdmUgdW5idWZmZXJlZCBvdXRwdXQsIHRoaXMga2luZCBvZiBzaW11bGF0ZXMgaXQuXG4gKi9cblxudmFyIGFjYyA9IFwiXCJcblxuZXhwb3J0cy5kZWZhdWx0T3B0cyA9IHtcbiAgICB3cml0ZTogZnVuY3Rpb24gKHN0cikge1xuICAgICAgICBhY2MgKz0gc3RyXG5cbiAgICAgICAgdmFyIGluZGV4ID0gc3RyLmluZGV4T2YoXCJcXG5cIilcblxuICAgICAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgICAgICAgdmFyIGxpbmVzID0gc3RyLnNwbGl0KFwiXFxuXCIpXG5cbiAgICAgICAgICAgIGFjYyA9IGxpbmVzLnBvcCgpXG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGluZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBnbG9iYWwuY29uc29sZS5sb2cobGluZXNbaV0pXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgcmVzZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKGFjYyAhPT0gXCJcIikge1xuICAgICAgICAgICAgZ2xvYmFsLmNvbnNvbGUubG9nKGFjYylcbiAgICAgICAgICAgIGFjYyA9IFwiXCJcbiAgICAgICAgfVxuICAgIH0sXG59XG4iLCJcInVzZSBzdHJpY3RcIlxuXG52YXIgZGlmZiA9IHJlcXVpcmUoXCJkaWZmXCIpXG5cbnZhciBtZXRob2RzID0gcmVxdWlyZShcIi4uL21ldGhvZHNcIilcbnZhciBpbnNwZWN0ID0gcmVxdWlyZShcImNsZWFuLWFzc2VydC11dGlsXCIpLmluc3BlY3RcbnZhciBwZWFjaCA9IHJlcXVpcmUoXCIuLi91dGlsXCIpLnBlYWNoXG52YXIgUmVwb3J0ZXIgPSByZXF1aXJlKFwiLi9yZXBvcnRlclwiKVxudmFyIFV0aWwgPSByZXF1aXJlKFwiLi91dGlsXCIpXG52YXIgU2V0dGluZ3MgPSByZXF1aXJlKFwiLi4vc2V0dGluZ3NcIilcblxuZnVuY3Rpb24gcHJpbnRUaW1lKF8sIHAsIHN0cikge1xuICAgIGlmICghXy50aW1lUHJpbnRlZCkge1xuICAgICAgICBfLnRpbWVQcmludGVkID0gdHJ1ZVxuICAgICAgICBzdHIgKz0gVXRpbC5jb2xvcihcImxpZ2h0XCIsIFwiIChcIiArIFV0aWwuZm9ybWF0VGltZShfLmR1cmF0aW9uKSArIFwiKVwiKVxuICAgIH1cblxuICAgIHJldHVybiBwLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gXy5wcmludChzdHIpIH0pXG59XG5cbmZ1bmN0aW9uIHVuaWZpZWREaWZmKGVycikge1xuICAgIHZhciBhY3R1YWwgPSBpbnNwZWN0KGVyci5hY3R1YWwpXG4gICAgdmFyIGV4cGVjdGVkID0gaW5zcGVjdChlcnIuZXhwZWN0ZWQpXG4gICAgdmFyIG1zZyA9IGRpZmYuY3JlYXRlUGF0Y2goXCJzdHJpbmdcIiwgYWN0dWFsLCBleHBlY3RlZClcbiAgICB2YXIgaGVhZGVyID0gU2V0dGluZ3MubmV3bGluZSgpICtcbiAgICAgICAgVXRpbC5jb2xvcihcImRpZmYgYWRkZWRcIiwgXCIrIGV4cGVjdGVkXCIpICsgXCIgXCIgK1xuICAgICAgICBVdGlsLmNvbG9yKFwiZGlmZiByZW1vdmVkXCIsIFwiLSBhY3R1YWxcIikgK1xuICAgICAgICBTZXR0aW5ncy5uZXdsaW5lKClcblxuICAgIHJldHVybiBoZWFkZXIgKyBtc2cuc3BsaXQoL1xccj9cXG58XFxyL2cpLnNsaWNlKDQpXG4gICAgLmZpbHRlcihmdW5jdGlvbiAobGluZSkgeyByZXR1cm4gIS9eXFxAXFxAfF5cXFxcIE5vIG5ld2xpbmUvLnRlc3QobGluZSkgfSlcbiAgICAubWFwKGZ1bmN0aW9uIChsaW5lKSB7XG4gICAgICAgIGlmIChsaW5lWzBdID09PSBcIitcIikgcmV0dXJuIFV0aWwuY29sb3IoXCJkaWZmIGFkZGVkXCIsIGxpbmUpXG4gICAgICAgIGlmIChsaW5lWzBdID09PSBcIi1cIikgcmV0dXJuIFV0aWwuY29sb3IoXCJkaWZmIHJlbW92ZWRcIiwgbGluZSlcbiAgICAgICAgcmV0dXJuIGxpbmVcbiAgICB9KVxuICAgIC5tYXAoZnVuY3Rpb24gKGxpbmUpIHsgcmV0dXJuIFNldHRpbmdzLm5ld2xpbmUoKSArIGxpbmUgfSlcbiAgICAubWFwKGZ1bmN0aW9uIChsaW5lKSB7IHJldHVybiBsaW5lLnRyaW1SaWdodCgpIH0pXG4gICAgLmpvaW4oXCJcIilcbn1cblxuZnVuY3Rpb24gZ2V0RGlmZlN0YWNrKGUpIHtcbiAgICB2YXIgZGVzY3JpcHRpb24gPSAoZS5uYW1lICsgXCI6IFwiICsgZS5tZXNzYWdlKVxuICAgICAgICAucmVwbGFjZSgvXFxzKyQvZ20sIFwiXCIpXG4gICAgICAgIC5yZXBsYWNlKC9eKC4qKSQvZ20sIFV0aWwuY29sb3IoXCJmYWlsXCIsIFwiJDFcIikpXG5cbiAgICBpZiAoZS5uYW1lID09PSBcIkFzc2VydGlvbkVycm9yXCIgJiYgZS5zaG93RGlmZiAhPT0gZmFsc2UpIHtcbiAgICAgICAgZGVzY3JpcHRpb24gKz0gU2V0dGluZ3MubmV3bGluZSgpICsgdW5pZmllZERpZmYoZSkgKyBTZXR0aW5ncy5uZXdsaW5lKClcbiAgICB9XG5cbiAgICB2YXIgc3RyaXBwZWQgPSBVdGlsLnJlYWRTdGFjayhlKVxuICAgICAgICAucmVwbGFjZSgvXiguKikkL2dtLCBVdGlsLmNvbG9yKFwiZmFpbFwiLCBcIiQxXCIpKVxuXG4gICAgaWYgKHN0cmlwcGVkID09PSBcIlwiKSByZXR1cm4gZGVzY3JpcHRpb25cbiAgICByZXR1cm4gZGVzY3JpcHRpb24gKyBTZXR0aW5ncy5uZXdsaW5lKCkgKyBzdHJpcHBlZFxufVxuXG5mdW5jdGlvbiBwcmludEZhaWxMaXN0KF8sIGVycikge1xuICAgIHZhciBzdHIgPSBlcnIgaW5zdGFuY2VvZiBFcnJvciA/IGdldERpZmZTdGFjayhlcnIpIDogaW5zcGVjdChlcnIpXG4gICAgdmFyIHBhcnRzID0gc3RyLnNwbGl0KC9cXHI/XFxuL2cpXG5cbiAgICByZXR1cm4gXy5wcmludChcIiAgICBcIiArIHBhcnRzWzBdKVxuICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHBlYWNoKHBhcnRzLnNsaWNlKDEpLCBmdW5jdGlvbiAocGFydCkge1xuICAgICAgICAgICAgcmV0dXJuIF8ucHJpbnQocGFydCA/IFwiICAgICAgXCIgKyBwYXJ0IDogXCJcIilcbiAgICAgICAgfSlcbiAgICB9KVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChvcHRzLCBtZXRob2RzKSB7XG4gICAgcmV0dXJuIG5ldyBDb25zb2xlUmVwb3J0ZXIob3B0cywgbWV0aG9kcylcbn1cblxuLyoqXG4gKiBCYXNlIGNsYXNzIGZvciBtb3N0IGNvbnNvbGUgcmVwb3J0ZXJzLlxuICpcbiAqIE5vdGU6IHByaW50aW5nIGlzIGFzeW5jaHJvbm91cywgYmVjYXVzZSBvdGhlcndpc2UsIGlmIGVub3VnaCBlcnJvcnMgZXhpc3QsXG4gKiBOb2RlIHdpbGwgZXZlbnR1YWxseSBzdGFydCBkcm9wcGluZyBsaW5lcyBzZW50IHRvIGl0cyBidWZmZXIsIGVzcGVjaWFsbHkgd2hlblxuICogc3RhY2sgdHJhY2VzIGdldCBpbnZvbHZlZC4gSWYgVGhhbGxpdW0ncyBvdXRwdXQgaXMgcmVkaXJlY3RlZCwgdGhhdCBjYW4gYmUgYVxuICogYmlnIHByb2JsZW0gZm9yIGNvbnN1bWVycywgYXMgdGhleSBvbmx5IGhhdmUgcGFydCBvZiB0aGUgb3V0cHV0LCBhbmQgd29uJ3QgYmVcbiAqIGFibGUgdG8gc2VlIGFsbCB0aGUgZXJyb3JzIGxhdGVyLiBBbHNvLCBpZiBjb25zb2xlIHdhcm5pbmdzIGNvbWUgdXAgZW4tbWFzc2UsXG4gKiB0aGF0IHdvdWxkIGFsc28gY29udHJpYnV0ZS4gU28sIHdlIGhhdmUgdG8gd2FpdCBmb3IgZWFjaCBsaW5lIHRvIGZsdXNoIGJlZm9yZVxuICogd2UgY2FuIGNvbnRpbnVlLCBzbyB0aGUgZnVsbCBvdXRwdXQgbWFrZXMgaXRzIHdheSB0byB0aGUgY29uc29sZS5cbiAqXG4gKiBTb21lIHRlc3QgZnJhbWV3b3JrcyBsaWtlIFRhcGUgbWlzcyB0aGlzLCB0aG91Z2guXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9wdHMgVGhlIG9wdGlvbnMgZm9yIHRoZSByZXBvcnRlci5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IG9wdHMud3JpdGUgVGhlIHVuYnVmZmVycmVkIHdyaXRlciBmb3IgdGhlIHJlcG9ydGVyLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gb3B0cy5yZXNldCBBIHJlc2V0IGZ1bmN0aW9uIGZvciB0aGUgcHJpbnRlciArIHdyaXRlci5cbiAqIEBwYXJhbSB7U3RyaW5nW119IGFjY2VwdHMgVGhlIG9wdGlvbnMgYWNjZXB0ZWQuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBpbml0IFRoZSBpbml0IGZ1bmN0aW9uIGZvciB0aGUgc3ViY2xhc3MgcmVwb3J0ZXInc1xuICogICAgICAgICAgICAgICAgICAgICAgICBpc29sYXRlZCBzdGF0ZSAoY3JlYXRlZCBieSBmYWN0b3J5KS5cbiAqL1xuZnVuY3Rpb24gQ29uc29sZVJlcG9ydGVyKG9wdHMsIG1ldGhvZHMpIHtcbiAgICBSZXBvcnRlci5jYWxsKHRoaXMsIFV0aWwuVHJlZSwgb3B0cywgbWV0aG9kcywgdHJ1ZSlcblxuICAgIGlmICghVXRpbC5Db2xvcnMuZm9yY2VkKCkgJiYgbWV0aG9kcy5hY2NlcHRzLmluZGV4T2YoXCJjb2xvclwiKSA+PSAwKSB7XG4gICAgICAgIHRoaXMub3B0cy5jb2xvciA9IG9wdHMuY29sb3JcbiAgICB9XG5cbiAgICBVdGlsLmRlZmF1bHRpZnkodGhpcywgb3B0cywgXCJ3cml0ZVwiKVxuICAgIHRoaXMucmVzZXQoKVxufVxuXG5tZXRob2RzKENvbnNvbGVSZXBvcnRlciwgUmVwb3J0ZXIsIHtcbiAgICBwcmludDogZnVuY3Rpb24gKHN0cikge1xuICAgICAgICBpZiAoc3RyID09IG51bGwpIHN0ciA9IFwiXCJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLm9wdHMud3JpdGUoc3RyICsgXCJcXG5cIikpXG4gICAgfSxcblxuICAgIHdyaXRlOiBmdW5jdGlvbiAoc3RyKSB7XG4gICAgICAgIGlmIChzdHIgIT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLm9wdHMud3JpdGUoc3RyKSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIHByaW50UmVzdWx0czogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXNcblxuICAgICAgICBpZiAoIXRoaXMudGVzdHMgJiYgIXRoaXMuc2tpcCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucHJpbnQoXG4gICAgICAgICAgICAgICAgVXRpbC5jb2xvcihcInBsYWluXCIsIFwiICAwIHRlc3RzXCIpICtcbiAgICAgICAgICAgICAgICBVdGlsLmNvbG9yKFwibGlnaHRcIiwgXCIgKDBtcylcIikpXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiBzZWxmLnByaW50KCkgfSlcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLnByaW50KCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgcCA9IFByb21pc2UucmVzb2x2ZSgpXG5cbiAgICAgICAgICAgIGlmIChzZWxmLnBhc3MpIHtcbiAgICAgICAgICAgICAgICBwID0gcHJpbnRUaW1lKHNlbGYsIHAsXG4gICAgICAgICAgICAgICAgICAgIFV0aWwuY29sb3IoXCJicmlnaHQgcGFzc1wiLCBcIiAgXCIpICtcbiAgICAgICAgICAgICAgICAgICAgVXRpbC5jb2xvcihcImdyZWVuXCIsIHNlbGYucGFzcyArIFwiIHBhc3NpbmdcIikpXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzZWxmLnNraXApIHtcbiAgICAgICAgICAgICAgICBwID0gcHJpbnRUaW1lKHNlbGYsIHAsXG4gICAgICAgICAgICAgICAgICAgIFV0aWwuY29sb3IoXCJza2lwXCIsIFwiICBcIiArIHNlbGYuc2tpcCArIFwiIHNraXBwZWRcIikpXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzZWxmLmZhaWwpIHtcbiAgICAgICAgICAgICAgICBwID0gcHJpbnRUaW1lKHNlbGYsIHAsXG4gICAgICAgICAgICAgICAgICAgIFV0aWwuY29sb3IoXCJicmlnaHQgZmFpbFwiLCBcIiAgXCIpICtcbiAgICAgICAgICAgICAgICAgICAgVXRpbC5jb2xvcihcImZhaWxcIiwgc2VsZi5mYWlsICsgXCIgZmFpbGluZ1wiKSlcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHBcbiAgICAgICAgfSlcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gc2VsZi5wcmludCgpIH0pXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBwZWFjaChzZWxmLmVycm9ycywgZnVuY3Rpb24gKHJlcG9ydCwgaSkge1xuICAgICAgICAgICAgICAgIHZhciBuYW1lID0gaSArIDEgKyBcIikgXCIgKyBVdGlsLmpvaW5QYXRoKHJlcG9ydCkgK1xuICAgICAgICAgICAgICAgICAgICBVdGlsLmZvcm1hdFJlc3QocmVwb3J0KVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNlbGYucHJpbnQoXCIgIFwiICsgVXRpbC5jb2xvcihcInBsYWluXCIsIG5hbWUgKyBcIjpcIikpXG4gICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcHJpbnRGYWlsTGlzdChzZWxmLCByZXBvcnQuZXJyb3IpXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiBzZWxmLnByaW50KCkgfSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pXG4gICAgfSxcblxuICAgIHByaW50RXJyb3I6IGZ1bmN0aW9uIChyZXBvcnQpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgICAgIHZhciBsaW5lcyA9IHJlcG9ydC5lcnJvciBpbnN0YW5jZW9mIEVycm9yXG4gICAgICAgICAgICA/IFV0aWwuZ2V0U3RhY2socmVwb3J0LmVycm9yKVxuICAgICAgICAgICAgOiBpbnNwZWN0KHJlcG9ydC5lcnJvcilcblxuICAgICAgICByZXR1cm4gdGhpcy5wcmludCgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHBlYWNoKGxpbmVzLnNwbGl0KC9cXHI/XFxuL2cpLCBmdW5jdGlvbiAobGluZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBzZWxmLnByaW50KGxpbmUpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9KVxuICAgIH0sXG59KVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxudmFyIFV0aWwgPSByZXF1aXJlKFwiLi91dGlsXCIpXG5cbmV4cG9ydHMub24gPSByZXF1aXJlKFwiLi9vblwiKVxuZXhwb3J0cy5jb25zb2xlUmVwb3J0ZXIgPSByZXF1aXJlKFwiLi9jb25zb2xlLXJlcG9ydGVyXCIpXG5leHBvcnRzLlJlcG9ydGVyID0gcmVxdWlyZShcIi4vcmVwb3J0ZXJcIilcbmV4cG9ydHMuY29sb3IgPSBVdGlsLmNvbG9yXG5leHBvcnRzLkNvbG9ycyA9IFV0aWwuQ29sb3JzXG5leHBvcnRzLmZvcm1hdFJlc3QgPSBVdGlsLmZvcm1hdFJlc3RcbmV4cG9ydHMuZm9ybWF0VGltZSA9IFV0aWwuZm9ybWF0VGltZVxuZXhwb3J0cy5nZXRTdGFjayA9IFV0aWwuZ2V0U3RhY2tcbmV4cG9ydHMuam9pblBhdGggPSBVdGlsLmpvaW5QYXRoXG5leHBvcnRzLm5ld2xpbmUgPSBVdGlsLm5ld2xpbmVcbmV4cG9ydHMucmVhZFN0YWNrID0gVXRpbC5yZWFkU3RhY2tcbmV4cG9ydHMuc2V0Q29sb3IgPSBVdGlsLnNldENvbG9yXG5leHBvcnRzLnNwZWVkID0gVXRpbC5zcGVlZFxuZXhwb3J0cy5TdGF0dXMgPSBVdGlsLlN0YXR1c1xuZXhwb3J0cy5zeW1ib2xzID0gVXRpbC5zeW1ib2xzXG5leHBvcnRzLnVuc2V0Q29sb3IgPSBVdGlsLnVuc2V0Q29sb3JcbmV4cG9ydHMud2luZG93V2lkdGggPSBVdGlsLndpbmRvd1dpZHRoXG4iLCJcInVzZSBzdHJpY3RcIlxuXG52YXIgU3RhdHVzID0gcmVxdWlyZShcIi4vdXRpbFwiKS5TdGF0dXNcblxuLy8gQmVjYXVzZSBFUzUgc3Vja3MuIChBbmQsIGl0J3MgYnJlYWtpbmcgbXkgUGhhbnRvbUpTIGJ1aWxkcylcbmZ1bmN0aW9uIHNldE5hbWUocmVwb3J0ZXIsIG5hbWUpIHtcbiAgICB0cnkge1xuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkocmVwb3J0ZXIsIFwibmFtZVwiLCB7dmFsdWU6IG5hbWV9KVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgLy8gaWdub3JlXG4gICAgfVxufVxuXG4vKipcbiAqIEEgbWFjcm8gb2Ygc29ydHMsIHRvIHNpbXBsaWZ5IGNyZWF0aW5nIHJlcG9ydGVycy4gSXQgYWNjZXB0cyBhbiBvYmplY3Qgd2l0aFxuICogdGhlIGZvbGxvd2luZyBwYXJhbWV0ZXJzOlxuICpcbiAqIGBhY2NlcHRzOiBzdHJpbmdbXWAgLSBUaGUgcHJvcGVydGllcyBhY2NlcHRlZC4gRXZlcnl0aGluZyBlbHNlIGlzIGlnbm9yZWQsXG4gKiBhbmQgaXQncyBwYXJ0aWFsbHkgdGhlcmUgZm9yIGRvY3VtZW50YXRpb24uIFRoaXMgcGFyYW1ldGVyIGlzIHJlcXVpcmVkLlxuICpcbiAqIGBjcmVhdGUob3B0cywgbWV0aG9kcylgIC0gQ3JlYXRlIGEgbmV3IHJlcG9ydGVyIGluc3RhbmNlLiAgVGhpcyBwYXJhbWV0ZXIgaXNcbiAqIHJlcXVpcmVkLiBOb3RlIHRoYXQgYG1ldGhvZHNgIHJlZmVycyB0byB0aGUgcGFyYW1ldGVyIG9iamVjdCBpdHNlbGYuXG4gKlxuICogYGluaXQoc3RhdGUsIG9wdHMpYCAtIEluaXRpYWxpemUgZXh0cmEgcmVwb3J0ZXIgc3RhdGUsIGlmIGFwcGxpY2FibGUuXG4gKlxuICogYGJlZm9yZShyZXBvcnRlcilgIC0gRG8gdGhpbmdzIGJlZm9yZSBlYWNoIGV2ZW50LCByZXR1cm5pbmcgYSBwb3NzaWJsZVxuICogdGhlbmFibGUgd2hlbiBkb25lLiBUaGlzIGRlZmF1bHRzIHRvIGEgbm8tb3AuXG4gKlxuICogYGFmdGVyKHJlcG9ydGVyKWAgLSBEbyB0aGluZ3MgYWZ0ZXIgZWFjaCBldmVudCwgcmV0dXJuaW5nIGEgcG9zc2libGVcbiAqIHRoZW5hYmxlIHdoZW4gZG9uZS4gVGhpcyBkZWZhdWx0cyB0byBhIG5vLW9wLlxuICpcbiAqIGByZXBvcnQocmVwb3J0ZXIsIHJlcG9ydClgIC0gSGFuZGxlIGEgdGVzdCByZXBvcnQuIFRoaXMgbWF5IHJldHVybiBhIHBvc3NpYmxlXG4gKiB0aGVuYWJsZSB3aGVuIGRvbmUsIGFuZCBpdCBpcyByZXF1aXJlZC5cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAobmFtZSwgbWV0aG9kcykge1xuICAgIHNldE5hbWUocmVwb3J0ZXIsIG5hbWUpXG4gICAgcmVwb3J0ZXJbbmFtZV0gPSByZXBvcnRlclxuICAgIHJldHVybiByZXBvcnRlclxuICAgIGZ1bmN0aW9uIHJlcG9ydGVyKG9wdHMpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEluc3RlYWQgb2Ygc2lsZW50bHkgZmFpbGluZyB0byB3b3JrLCBsZXQncyBlcnJvciBvdXQgd2hlbiBhIHJlcG9ydCBpc1xuICAgICAgICAgKiBwYXNzZWQgaW4sIGFuZCBpbmZvcm0gdGhlIHVzZXIgaXQgbmVlZHMgaW5pdGlhbGl6ZWQuIENoYW5jZXMgYXJlLFxuICAgICAgICAgKiB0aGVyZSdzIG5vIGxlZ2l0aW1hdGUgcmVhc29uIHRvIGV2ZW4gcGFzcyBhIHJlcG9ydCwgYW55d2F5cy5cbiAgICAgICAgICovXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0cyA9PT0gXCJvYmplY3RcIiAmJiBvcHRzICE9PSBudWxsICYmXG4gICAgICAgICAgICAgICAgdHlwZW9mIG9wdHMuXyA9PT0gXCJudW1iZXJcIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICAgICAgICAgICBcIk9wdGlvbnMgY2Fubm90IGJlIGEgcmVwb3J0LiBEaWQgeW91IGZvcmdldCB0byBjYWxsIHRoZSBcIiArXG4gICAgICAgICAgICAgICAgXCJmYWN0b3J5IGZpcnN0P1wiKVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIF8gPSBtZXRob2RzLmNyZWF0ZShvcHRzLCBtZXRob2RzKVxuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAocmVwb3J0KSB7XG4gICAgICAgICAgICAvLyBPbmx5IHNvbWUgZXZlbnRzIGhhdmUgY29tbW9uIHN0ZXBzLlxuICAgICAgICAgICAgaWYgKHJlcG9ydC5pc1N0YXJ0KSB7XG4gICAgICAgICAgICAgICAgXy5ydW5uaW5nID0gdHJ1ZVxuICAgICAgICAgICAgfSBlbHNlIGlmIChyZXBvcnQuaXNFbnRlciB8fCByZXBvcnQuaXNQYXNzKSB7XG4gICAgICAgICAgICAgICAgXy5nZXQocmVwb3J0LnBhdGgpLnN0YXR1cyA9IFN0YXR1cy5QYXNzaW5nXG4gICAgICAgICAgICAgICAgXy5kdXJhdGlvbiArPSByZXBvcnQuZHVyYXRpb25cbiAgICAgICAgICAgICAgICBfLnRlc3RzKytcbiAgICAgICAgICAgICAgICBfLnBhc3MrK1xuICAgICAgICAgICAgfSBlbHNlIGlmIChyZXBvcnQuaXNGYWlsKSB7XG4gICAgICAgICAgICAgICAgXy5nZXQocmVwb3J0LnBhdGgpLnN0YXR1cyA9IFN0YXR1cy5GYWlsaW5nXG4gICAgICAgICAgICAgICAgXy5kdXJhdGlvbiArPSByZXBvcnQuZHVyYXRpb25cbiAgICAgICAgICAgICAgICBfLnRlc3RzKytcbiAgICAgICAgICAgICAgICBfLmZhaWwrK1xuICAgICAgICAgICAgfSBlbHNlIGlmIChyZXBvcnQuaXNIb29rKSB7XG4gICAgICAgICAgICAgICAgXy5nZXQocmVwb3J0LnBhdGgpLnN0YXR1cyA9IFN0YXR1cy5GYWlsaW5nXG4gICAgICAgICAgICAgICAgXy5nZXQocmVwb3J0LnJvb3RQYXRoKS5zdGF0dXMgPSBTdGF0dXMuRmFpbGluZ1xuICAgICAgICAgICAgICAgIF8uZmFpbCsrXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHJlcG9ydC5pc1NraXApIHtcbiAgICAgICAgICAgICAgICBfLmdldChyZXBvcnQucGF0aCkuc3RhdHVzID0gU3RhdHVzLlNraXBwZWRcbiAgICAgICAgICAgICAgICAvLyBTa2lwcGVkIHRlc3RzIGFyZW4ndCBjb3VudGVkIGluIHRoZSB0b3RhbCB0ZXN0IGNvdW50XG4gICAgICAgICAgICAgICAgXy5za2lwKytcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShcbiAgICAgICAgICAgICAgICB0eXBlb2YgbWV0aG9kcy5iZWZvcmUgPT09IFwiZnVuY3Rpb25cIlxuICAgICAgICAgICAgICAgICAgICA/IG1ldGhvZHMuYmVmb3JlKF8pXG4gICAgICAgICAgICAgICAgICAgIDogdW5kZWZpbmVkKVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gbWV0aG9kcy5yZXBvcnQoXywgcmVwb3J0KSB9KVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0eXBlb2YgbWV0aG9kcy5hZnRlciA9PT0gXCJmdW5jdGlvblwiXG4gICAgICAgICAgICAgICAgICAgID8gbWV0aG9kcy5hZnRlcihfKVxuICAgICAgICAgICAgICAgICAgICA6IHVuZGVmaW5lZFxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAocmVwb3J0LmlzRW5kIHx8IHJlcG9ydC5pc0Vycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIF8ucmVzZXQoKVxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIF8ub3B0cy5yZXNldCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gXy5vcHRzLnJlc2V0KClcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgfVxufVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxudmFyIG1ldGhvZHMgPSByZXF1aXJlKFwiLi4vbWV0aG9kc1wiKVxudmFyIGRlZmF1bHRpZnkgPSByZXF1aXJlKFwiLi91dGlsXCIpLmRlZmF1bHRpZnlcbnZhciBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5XG5cbmZ1bmN0aW9uIFN0YXRlKHJlcG9ydGVyKSB7XG4gICAgaWYgKHR5cGVvZiByZXBvcnRlci5tZXRob2RzLmluaXQgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAoMCwgcmVwb3J0ZXIubWV0aG9kcy5pbml0KSh0aGlzLCByZXBvcnRlci5vcHRzKVxuICAgIH1cbn1cblxuLyoqXG4gKiBUaGlzIGhlbHBzIHNwZWVkIHVwIGdldHRpbmcgcHJldmlvdXMgdHJlZXMsIHNvIGEgcG90ZW50aWFsbHkgZXhwZW5zaXZlXG4gKiB0cmVlIHNlYXJjaCBkb2Vzbid0IGhhdmUgdG8gYmUgcGVyZm9ybWVkLlxuICpcbiAqIChUaGlzIGRvZXMgYWN0dWFsbHkgbWFrZSBhIHNsaWdodCBwZXJmIGRpZmZlcmVuY2UgaW4gdGhlIHRlc3RzLilcbiAqL1xuZnVuY3Rpb24gaXNSZXBlYXQoY2FjaGUsIHBhdGgpIHtcbiAgICAvLyBDYW4ndCBiZSBhIHJlcGVhdCB0aGUgZmlyc3QgdGltZS5cbiAgICBpZiAoY2FjaGUucGF0aCA9PSBudWxsKSByZXR1cm4gZmFsc2VcbiAgICBpZiAocGF0aC5sZW5ndGggIT09IGNhY2hlLnBhdGgubGVuZ3RoKSByZXR1cm4gZmFsc2VcbiAgICBpZiAocGF0aCA9PT0gY2FjaGUucGF0aCkgcmV0dXJuIHRydWVcblxuICAgIC8vIEl0J3MgdW5saWtlbHkgdGhlIG5lc3Rpbmcgd2lsbCBiZSBjb25zaXN0ZW50bHkgbW9yZSB0aGFuIGEgZmV3IGxldmVsc1xuICAgIC8vIGRlZXAgKD49IDUpLCBzbyB0aGlzIHNob3VsZG4ndCBib2cgYW55dGhpbmcgZG93bi5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBhdGgubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKHBhdGhbaV0gIT09IGNhY2hlLnBhdGhbaV0pIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgY2FjaGUucGF0aCA9IHBhdGhcbiAgICByZXR1cm4gdHJ1ZVxufVxuXG4vKipcbiAqIFN1cGVyY2xhc3MgZm9yIGFsbCByZXBvcnRlcnMuIFRoaXMgY292ZXJzIHRoZSBzdGF0ZSBmb3IgcHJldHR5IG11Y2ggZXZlcnlcbiAqIHJlcG9ydGVyLlxuICpcbiAqIE5vdGUgdGhhdCBpZiB5b3UgZGVsYXkgdGhlIGluaXRpYWwgcmVzZXQsIHlvdSBzdGlsbCBtdXN0IGNhbGwgaXQgYmVmb3JlIHRoZVxuICogY29uc3RydWN0b3IgZmluaXNoZXMuXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gUmVwb3J0ZXJcbmZ1bmN0aW9uIFJlcG9ydGVyKFRyZWUsIG9wdHMsIG1ldGhvZHMsIGRlbGF5KSB7XG4gICAgdGhpcy5UcmVlID0gVHJlZVxuICAgIHRoaXMub3B0cyA9IHt9XG4gICAgdGhpcy5tZXRob2RzID0gbWV0aG9kc1xuICAgIGRlZmF1bHRpZnkodGhpcywgb3B0cywgXCJyZXNldFwiKVxuICAgIGlmICghZGVsYXkpIHRoaXMucmVzZXQoKVxufVxuXG5tZXRob2RzKFJlcG9ydGVyLCB7XG4gICAgcmVzZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5ydW5uaW5nID0gZmFsc2VcbiAgICAgICAgdGhpcy50aW1lUHJpbnRlZCA9IGZhbHNlXG4gICAgICAgIHRoaXMudGVzdHMgPSAwXG4gICAgICAgIHRoaXMucGFzcyA9IDBcbiAgICAgICAgdGhpcy5mYWlsID0gMFxuICAgICAgICB0aGlzLnNraXAgPSAwXG4gICAgICAgIHRoaXMuZHVyYXRpb24gPSAwXG4gICAgICAgIHRoaXMuZXJyb3JzID0gW11cbiAgICAgICAgdGhpcy5zdGF0ZSA9IG5ldyBTdGF0ZSh0aGlzKVxuICAgICAgICB0aGlzLmJhc2UgPSBuZXcgdGhpcy5UcmVlKHVuZGVmaW5lZClcbiAgICAgICAgdGhpcy5jYWNoZSA9IHtwYXRoOiB1bmRlZmluZWQsIHJlc3VsdDogdW5kZWZpbmVkLCBlbmQ6IDB9XG4gICAgfSxcblxuICAgIHB1c2hFcnJvcjogZnVuY3Rpb24gKHJlcG9ydCkge1xuICAgICAgICB0aGlzLmVycm9ycy5wdXNoKHJlcG9ydClcbiAgICB9LFxuXG4gICAgZ2V0OiBmdW5jdGlvbiAocGF0aCwgZW5kKSB7XG4gICAgICAgIGlmIChlbmQgPT0gbnVsbCkgZW5kID0gcGF0aC5sZW5ndGhcbiAgICAgICAgaWYgKGVuZCA9PT0gMCkgcmV0dXJuIHRoaXMuYmFzZVxuICAgICAgICBpZiAoaXNSZXBlYXQodGhpcy5jYWNoZSwgcGF0aCwgZW5kKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY2FjaGUucmVzdWx0XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgY2hpbGQgPSB0aGlzLmJhc2VcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgZW50cnkgPSBwYXRoW2ldXG5cbiAgICAgICAgICAgIGlmIChoYXNPd24uY2FsbChjaGlsZC5jaGlsZHJlbiwgZW50cnkuaW5kZXgpKSB7XG4gICAgICAgICAgICAgICAgY2hpbGQgPSBjaGlsZC5jaGlsZHJlbltlbnRyeS5pbmRleF1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY2hpbGQgPSBjaGlsZC5jaGlsZHJlbltlbnRyeS5pbmRleF0gPSBuZXcgdGhpcy5UcmVlKGVudHJ5Lm5hbWUpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNhY2hlLmVuZCA9IGVuZFxuICAgICAgICByZXR1cm4gdGhpcy5jYWNoZS5yZXN1bHQgPSBjaGlsZFxuICAgIH0sXG59KVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxudmFyIFV0aWwgPSByZXF1aXJlKFwiLi4vdXRpbFwiKVxudmFyIFNldHRpbmdzID0gcmVxdWlyZShcIi4uL3NldHRpbmdzXCIpXG5cbmV4cG9ydHMuc3ltYm9scyA9IFNldHRpbmdzLnN5bWJvbHNcbmV4cG9ydHMud2luZG93V2lkdGggPSBTZXR0aW5ncy53aW5kb3dXaWR0aFxuZXhwb3J0cy5uZXdsaW5lID0gU2V0dGluZ3MubmV3bGluZVxuXG4vKlxuICogU3RhY2sgbm9ybWFsaXphdGlvblxuICovXG5cbi8vIEV4cG9ydGVkIGZvciBkZWJ1Z2dpbmdcbmV4cG9ydHMucmVhZFN0YWNrID0gcmVhZFN0YWNrXG5mdW5jdGlvbiByZWFkU3RhY2soZSkge1xuICAgIHZhciBzdGFjayA9IFV0aWwuZ2V0U3RhY2soZSlcblxuICAgIC8vIElmIGl0IGRvZXNuJ3Qgc3RhcnQgd2l0aCB0aGUgbWVzc2FnZSwganVzdCByZXR1cm4gdGhlIHN0YWNrLlxuICAgIC8vICBGaXJlZm94LCBTYWZhcmkgICAgICAgICAgICAgICAgQ2hyb21lLCBJRVxuICAgIGlmICgvXihAKT9cXFMrXFw6XFxkKy8udGVzdChzdGFjaykgfHwgL15cXHMqYXQvLnRlc3Qoc3RhY2spKSB7XG4gICAgICAgIHJldHVybiBmb3JtYXRMaW5lQnJlYWtzKFwiXCIsIHN0YWNrKVxuICAgIH1cblxuICAgIHZhciBpbmRleCA9IHN0YWNrLmluZGV4T2YoZS5tZXNzYWdlKVxuXG4gICAgaWYgKGluZGV4IDwgMCkgcmV0dXJuIGZvcm1hdExpbmVCcmVha3MoXCJcIiwgVXRpbC5nZXRTdGFjayhlKSlcbiAgICB2YXIgcmUgPSAvXFxyP1xcbi9nXG5cbiAgICByZS5sYXN0SW5kZXggPSBpbmRleCArIGUubWVzc2FnZS5sZW5ndGhcbiAgICBpZiAoIXJlLnRlc3Qoc3RhY2spKSByZXR1cm4gXCJcIlxuICAgIHJldHVybiBmb3JtYXRMaW5lQnJlYWtzKFwiXCIsIHN0YWNrLnNsaWNlKHJlLmxhc3RJbmRleCkpXG59XG5cbmZ1bmN0aW9uIGZvcm1hdExpbmVCcmVha3MobGVhZCwgc3RyKSB7XG4gICAgcmV0dXJuIHN0clxuICAgICAgICAucmVwbGFjZSgvXFxzKyQvZ20sIFwiXCIpXG4gICAgICAgIC5yZXBsYWNlKC9eXFxzKy9nbSwgbGVhZClcbiAgICAgICAgLnJlcGxhY2UoL1xccj9cXG58XFxyL2csIFNldHRpbmdzLm5ld2xpbmUoKSlcbn1cblxuZXhwb3J0cy5nZXRTdGFjayA9IGZ1bmN0aW9uIChlKSB7XG4gICAgaWYgKCEoZSBpbnN0YW5jZW9mIEVycm9yKSkgcmV0dXJuIGZvcm1hdExpbmVCcmVha3MoXCJcIiwgVXRpbC5nZXRTdGFjayhlKSlcbiAgICB2YXIgZGVzY3JpcHRpb24gPSAoZS5uYW1lICsgXCI6IFwiICsgZS5tZXNzYWdlKS5yZXBsYWNlKC9cXHMrJC9nbSwgXCJcIilcbiAgICB2YXIgc3RyaXBwZWQgPSByZWFkU3RhY2soZSlcblxuICAgIGlmIChzdHJpcHBlZCA9PT0gXCJcIikgcmV0dXJuIGRlc2NyaXB0aW9uXG4gICAgcmV0dXJuIGRlc2NyaXB0aW9uICsgU2V0dGluZ3MubmV3bGluZSgpICsgc3RyaXBwZWRcbn1cblxudmFyIENvbG9ycyA9IGV4cG9ydHMuQ29sb3JzID0gU2V0dGluZ3MuQ29sb3JzXG5cbi8vIENvbG9yIHBhbGV0dGUgcHVsbGVkIGZyb20gTW9jaGFcbmZ1bmN0aW9uIGNvbG9yVG9OdW1iZXIobmFtZSkge1xuICAgIHN3aXRjaCAobmFtZSkge1xuICAgIGNhc2UgXCJwYXNzXCI6IHJldHVybiA5MFxuICAgIGNhc2UgXCJmYWlsXCI6IHJldHVybiAzMVxuXG4gICAgY2FzZSBcImJyaWdodCBwYXNzXCI6IHJldHVybiA5MlxuICAgIGNhc2UgXCJicmlnaHQgZmFpbFwiOiByZXR1cm4gOTFcbiAgICBjYXNlIFwiYnJpZ2h0IHllbGxvd1wiOiByZXR1cm4gOTNcblxuICAgIGNhc2UgXCJza2lwXCI6IHJldHVybiAzNlxuICAgIGNhc2UgXCJzdWl0ZVwiOiByZXR1cm4gMFxuICAgIGNhc2UgXCJwbGFpblwiOiByZXR1cm4gMFxuXG4gICAgY2FzZSBcImVycm9yIHRpdGxlXCI6IHJldHVybiAwXG4gICAgY2FzZSBcImVycm9yIG1lc3NhZ2VcIjogcmV0dXJuIDMxXG4gICAgY2FzZSBcImVycm9yIHN0YWNrXCI6IHJldHVybiA5MFxuXG4gICAgY2FzZSBcImNoZWNrbWFya1wiOiByZXR1cm4gMzJcbiAgICBjYXNlIFwiZmFzdFwiOiByZXR1cm4gOTBcbiAgICBjYXNlIFwibWVkaXVtXCI6IHJldHVybiAzM1xuICAgIGNhc2UgXCJzbG93XCI6IHJldHVybiAzMVxuICAgIGNhc2UgXCJncmVlblwiOiByZXR1cm4gMzJcbiAgICBjYXNlIFwibGlnaHRcIjogcmV0dXJuIDkwXG5cbiAgICBjYXNlIFwiZGlmZiBndXR0ZXJcIjogcmV0dXJuIDkwXG4gICAgY2FzZSBcImRpZmYgYWRkZWRcIjogcmV0dXJuIDMyXG4gICAgY2FzZSBcImRpZmYgcmVtb3ZlZFwiOiByZXR1cm4gMzFcbiAgICBkZWZhdWx0OiB0aHJvdyBuZXcgVHlwZUVycm9yKFwiSW52YWxpZCBuYW1lOiBcXFwiXCIgKyBuYW1lICsgXCJcXFwiXCIpXG4gICAgfVxufVxuXG5leHBvcnRzLmNvbG9yID0gY29sb3JcbmZ1bmN0aW9uIGNvbG9yKG5hbWUsIHN0cikge1xuICAgIGlmIChDb2xvcnMuc3VwcG9ydGVkKCkpIHtcbiAgICAgICAgcmV0dXJuIFwiXFx1MDAxYltcIiArIGNvbG9yVG9OdW1iZXIobmFtZSkgKyBcIm1cIiArIHN0ciArIFwiXFx1MDAxYlswbVwiXG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHN0ciArIFwiXCJcbiAgICB9XG59XG5cbmV4cG9ydHMuc2V0Q29sb3IgPSBmdW5jdGlvbiAoXykge1xuICAgIGlmIChfLm9wdHMuY29sb3IgIT0gbnVsbCkgQ29sb3JzLm1heWJlU2V0KF8ub3B0cy5jb2xvcilcbn1cblxuZXhwb3J0cy51bnNldENvbG9yID0gZnVuY3Rpb24gKF8pIHtcbiAgICBpZiAoXy5vcHRzLmNvbG9yICE9IG51bGwpIENvbG9ycy5tYXliZVJlc3RvcmUoKVxufVxuXG52YXIgU3RhdHVzID0gZXhwb3J0cy5TdGF0dXMgPSBPYmplY3QuZnJlZXplKHtcbiAgICBVbmtub3duOiAwLFxuICAgIFNraXBwZWQ6IDEsXG4gICAgUGFzc2luZzogMixcbiAgICBGYWlsaW5nOiAzLFxufSlcblxuZXhwb3J0cy5UcmVlID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgdGhpcy52YWx1ZSA9IHZhbHVlXG4gICAgdGhpcy5zdGF0dXMgPSBTdGF0dXMuVW5rbm93blxuICAgIHRoaXMuY2hpbGRyZW4gPSBPYmplY3QuY3JlYXRlKG51bGwpXG59XG5cbmV4cG9ydHMuZGVmYXVsdGlmeSA9IGZ1bmN0aW9uIChfLCBvcHRzLCBwcm9wKSB7XG4gICAgaWYgKF8ubWV0aG9kcy5hY2NlcHRzLmluZGV4T2YocHJvcCkgPj0gMCkge1xuICAgICAgICB2YXIgdXNlZCA9IG9wdHMgIT0gbnVsbCAmJiB0eXBlb2Ygb3B0c1twcm9wXSA9PT0gXCJmdW5jdGlvblwiXG4gICAgICAgICAgICA/IG9wdHNcbiAgICAgICAgICAgIDogU2V0dGluZ3MuZGVmYXVsdE9wdHMoKVxuXG4gICAgICAgIF8ub3B0c1twcm9wXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodXNlZFtwcm9wXS5hcHBseSh1c2VkLCBhcmd1bWVudHMpKVxuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBqb2luUGF0aChyZXBvcnRQYXRoKSB7XG4gICAgdmFyIHBhdGggPSBcIlwiXG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlcG9ydFBhdGgubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgcGF0aCArPSBcIiBcIiArIHJlcG9ydFBhdGhbaV0ubmFtZVxuICAgIH1cblxuICAgIHJldHVybiBwYXRoLnNsaWNlKDEpXG59XG5cbmV4cG9ydHMuam9pblBhdGggPSBmdW5jdGlvbiAocmVwb3J0KSB7XG4gICAgcmV0dXJuIGpvaW5QYXRoKHJlcG9ydC5wYXRoKVxufVxuXG5leHBvcnRzLnNwZWVkID0gZnVuY3Rpb24gKHJlcG9ydCkge1xuICAgIGlmIChyZXBvcnQuZHVyYXRpb24gPj0gcmVwb3J0LnNsb3cpIHJldHVybiBcInNsb3dcIlxuICAgIGlmIChyZXBvcnQuZHVyYXRpb24gPj0gcmVwb3J0LnNsb3cgLyAyKSByZXR1cm4gXCJtZWRpdW1cIlxuICAgIGlmIChyZXBvcnQuZHVyYXRpb24gPj0gMCkgcmV0dXJuIFwiZmFzdFwiXG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCJEdXJhdGlvbiBtdXN0IG5vdCBiZSBuZWdhdGl2ZVwiKVxufVxuXG5leHBvcnRzLmZvcm1hdFRpbWUgPSAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBzID0gMTAwMCAvKiBtcyAqL1xuICAgIHZhciBtID0gNjAgKiBzXG4gICAgdmFyIGggPSA2MCAqIG1cbiAgICB2YXIgZCA9IDI0ICogaFxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChtcykge1xuICAgICAgICBpZiAobXMgPj0gZCkgcmV0dXJuIE1hdGgucm91bmQobXMgLyBkKSArIFwiZFwiXG4gICAgICAgIGlmIChtcyA+PSBoKSByZXR1cm4gTWF0aC5yb3VuZChtcyAvIGgpICsgXCJoXCJcbiAgICAgICAgaWYgKG1zID49IG0pIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gbSkgKyBcIm1cIlxuICAgICAgICBpZiAobXMgPj0gcykgcmV0dXJuIE1hdGgucm91bmQobXMgLyBzKSArIFwic1wiXG4gICAgICAgIHJldHVybiBtcyArIFwibXNcIlxuICAgIH1cbn0pKClcblxuZXhwb3J0cy5mb3JtYXRSZXN0ID0gZnVuY3Rpb24gKHJlcG9ydCkge1xuICAgIGlmICghcmVwb3J0LmlzSG9vaykgcmV0dXJuIFwiXCJcbiAgICB2YXIgcGF0aCA9IFwiIChcIlxuXG4gICAgaWYgKHJlcG9ydC5yb290UGF0aC5sZW5ndGgpIHtcbiAgICAgICAgcGF0aCArPSByZXBvcnQuc3RhZ2VcbiAgICAgICAgaWYgKHJlcG9ydC5uYW1lKSBwYXRoICs9IFwiIOKAkiBcIiArIHJlcG9ydC5uYW1lXG4gICAgICAgIGlmIChyZXBvcnQucGF0aC5sZW5ndGggPiByZXBvcnQucm9vdFBhdGgubGVuZ3RoICsgMSkge1xuICAgICAgICAgICAgcGF0aCArPSBcIiwgaW4gXCIgKyBqb2luUGF0aChyZXBvcnQucm9vdFBhdGgpXG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBwYXRoICs9IFwiZ2xvYmFsIFwiICsgcmVwb3J0LnN0YWdlXG4gICAgICAgIGlmIChyZXBvcnQubmFtZSkgcGF0aCArPSBcIiDigJIgXCIgKyByZXBvcnQubmFtZVxuICAgIH1cblxuICAgIHJldHVybiBwYXRoICsgXCIpXCJcbn1cbiIsIlwidXNlIHN0cmljdFwiXG5cbi8vIEdlbmVyYWwgQ0xJIGFuZCByZXBvcnRlciBzZXR0aW5ncy4gSWYgc29tZXRoaW5nIG5lZWRzIHRvXG5cbnZhciBDb25zb2xlID0gcmVxdWlyZShcIi4vcmVwbGFjZWQvY29uc29sZVwiKVxuXG52YXIgd2luZG93V2lkdGggPSBDb25zb2xlLndpbmRvd1dpZHRoXG52YXIgbmV3bGluZSA9IENvbnNvbGUubmV3bGluZVxudmFyIFN5bWJvbHMgPSBDb25zb2xlLlN5bWJvbHNcbnZhciBkZWZhdWx0T3B0cyA9IENvbnNvbGUuZGVmYXVsdE9wdHNcblxuZXhwb3J0cy53aW5kb3dXaWR0aCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHdpbmRvd1dpZHRoIH1cbmV4cG9ydHMubmV3bGluZSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIG5ld2xpbmUgfVxuZXhwb3J0cy5zeW1ib2xzID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gU3ltYm9scyB9XG5leHBvcnRzLmRlZmF1bHRPcHRzID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gZGVmYXVsdE9wdHMgfVxuXG5leHBvcnRzLnNldFdpbmRvd1dpZHRoID0gZnVuY3Rpb24gKHZhbHVlKSB7IHJldHVybiB3aW5kb3dXaWR0aCA9IHZhbHVlIH1cbmV4cG9ydHMuc2V0TmV3bGluZSA9IGZ1bmN0aW9uICh2YWx1ZSkgeyByZXR1cm4gbmV3bGluZSA9IHZhbHVlIH1cbmV4cG9ydHMuc2V0U3ltYm9scyA9IGZ1bmN0aW9uICh2YWx1ZSkgeyByZXR1cm4gU3ltYm9scyA9IHZhbHVlIH1cbmV4cG9ydHMuc2V0RGVmYXVsdE9wdHMgPSBmdW5jdGlvbiAodmFsdWUpIHsgcmV0dXJuIGRlZmF1bHRPcHRzID0gdmFsdWUgfVxuXG4vLyBDb25zb2xlLmNvbG9yU3VwcG9ydCBpcyBhIG1hc2sgd2l0aCB0aGUgZm9sbG93aW5nIGJpdHM6XG4vLyAweDEgLSBpZiBzZXQsIGNvbG9ycyBzdXBwb3J0ZWQgYnkgZGVmYXVsdFxuLy8gMHgyIC0gaWYgc2V0LCBmb3JjZSBjb2xvciBzdXBwb3J0XG4vL1xuLy8gVGhpcyBpcyBwdXJlbHkgYW4gaW1wbGVtZW50YXRpb24gZGV0YWlsLCBhbmQgaXMgaW52aXNpYmxlIHRvIHRoZSBvdXRzaWRlXG4vLyB3b3JsZC5cbnZhciBjb2xvclN1cHBvcnQgPSBDb25zb2xlLmNvbG9yU3VwcG9ydFxudmFyIG1hc2sgPSBjb2xvclN1cHBvcnRcblxuZXhwb3J0cy5Db2xvcnMgPSB7XG4gICAgc3VwcG9ydGVkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiAobWFzayAmIDB4MSkgIT09IDBcbiAgICB9LFxuXG4gICAgZm9yY2VkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiAobWFzayAmIDB4MikgIT09IDBcbiAgICB9LFxuXG4gICAgbWF5YmVTZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICBpZiAoKG1hc2sgJiAweDIpID09PSAwKSBtYXNrID0gdmFsdWUgPyAweDEgOiAwXG4gICAgfSxcblxuICAgIG1heWJlUmVzdG9yZTogZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoKG1hc2sgJiAweDIpID09PSAwKSBtYXNrID0gY29sb3JTdXBwb3J0ICYgMHgxXG4gICAgfSxcblxuICAgIC8vIE9ubHkgZm9yIGRlYnVnZ2luZ1xuICAgIGZvcmNlU2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgbWFzayA9IHZhbHVlID8gMHgzIDogMHgyXG4gICAgfSxcblxuICAgIGZvcmNlUmVzdG9yZTogZnVuY3Rpb24gKCkge1xuICAgICAgICBtYXNrID0gY29sb3JTdXBwb3J0XG4gICAgfSxcblxuICAgIGdldFN1cHBvcnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN1cHBvcnRlZDogKGNvbG9yU3VwcG9ydCAmIDB4MSkgIT09IDAsXG4gICAgICAgICAgICBmb3JjZWQ6IChjb2xvclN1cHBvcnQgJiAweDIpICE9PSAwLFxuICAgICAgICB9XG4gICAgfSxcblxuICAgIHNldFN1cHBvcnQ6IGZ1bmN0aW9uIChvcHRzKSB7XG4gICAgICAgIG1hc2sgPSBjb2xvclN1cHBvcnQgPVxuICAgICAgICAgICAgKG9wdHMuc3VwcG9ydGVkID8gMHgxIDogMCkgfCAob3B0cy5mb3JjZWQgPyAweDIgOiAwKVxuICAgIH0sXG59XG4iLCJcInVzZSBzdHJpY3RcIlxuXG52YXIgbWV0aG9kcyA9IHJlcXVpcmUoXCIuL21ldGhvZHNcIilcblxuZXhwb3J0cy5nZXRUeXBlID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgaWYgKHZhbHVlID09IG51bGwpIHJldHVybiBcIm51bGxcIlxuICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkgcmV0dXJuIFwiYXJyYXlcIlxuICAgIHJldHVybiB0eXBlb2YgdmFsdWVcbn1cblxuLy8gUGhhbnRvbUpTLCBJRSwgYW5kIHBvc3NpYmx5IEVkZ2UgZG9uJ3Qgc2V0IHRoZSBzdGFjayB0cmFjZSB1bnRpbCB0aGUgZXJyb3IgaXNcbi8vIHRocm93bi4gTm90ZSB0aGF0IHRoaXMgcHJlZmVycyBhbiBleGlzdGluZyBzdGFjayBmaXJzdCwgc2luY2Ugbm9uLW5hdGl2ZVxuLy8gZXJyb3JzIGxpa2VseSBhbHJlYWR5IGNvbnRhaW4gdGhpcy4gTm90ZSB0aGF0IHRoaXMgaXNuJ3QgbmVjZXNzYXJ5IGluIHRoZVxuLy8gQ0xJIC0gdGhhdCBvbmx5IHRhcmdldHMgTm9kZS5cbmV4cG9ydHMuZ2V0U3RhY2sgPSBmdW5jdGlvbiAoZSkge1xuICAgIHZhciBzdGFjayA9IGUuc3RhY2tcblxuICAgIGlmICghKGUgaW5zdGFuY2VvZiBFcnJvcikgfHwgc3RhY2sgIT0gbnVsbCkgcmV0dXJuIHN0YWNrXG5cbiAgICB0cnkge1xuICAgICAgICB0aHJvdyBlXG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICByZXR1cm4gZS5zdGFja1xuICAgIH1cbn1cblxuZXhwb3J0cy5wY2FsbCA9IGZ1bmN0aW9uIChmdW5jKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmMoZnVuY3Rpb24gKGUsIHZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4gZSAhPSBudWxsID8gcmVqZWN0KGUpIDogcmVzb2x2ZSh2YWx1ZSlcbiAgICAgICAgfSlcbiAgICB9KVxufVxuXG5leHBvcnRzLnBlYWNoID0gZnVuY3Rpb24gKGxpc3QsIGZ1bmMpIHtcbiAgICB2YXIgbGVuID0gbGlzdC5sZW5ndGhcbiAgICB2YXIgcCA9IFByb21pc2UucmVzb2x2ZSgpXG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIHAgPSBwLnRoZW4oZnVuYy5iaW5kKHVuZGVmaW5lZCwgbGlzdFtpXSwgaSkpXG4gICAgfVxuXG4gICAgcmV0dXJuIHBcbn1cblxuLyoqXG4gKiBBIGxhenkgYWNjZXNzb3IsIGNvbXBsZXRlIHdpdGggdGhyb3duIGVycm9yIG1lbW9pemF0aW9uIGFuZCBhIGRlY2VudCBhbW91bnRcbiAqIG9mIG9wdGltaXphdGlvbiwgc2luY2UgaXQncyB1c2VkIGluIGEgbG90IG9mIGNvZGUuXG4gKlxuICogTm90ZSB0aGF0IHRoaXMgdXNlcyByZWZlcmVuY2UgaW5kaXJlY3Rpb24gYW5kIGRpcmVjdCBtdXRhdGlvbiB0byBrZWVwIG9ubHlcbiAqIGp1c3QgdGhlIGNvbXB1dGF0aW9uIG5vbi1jb25zdGFudCwgc28gZW5naW5lcyBjYW4gYXZvaWQgY2xvc3VyZSBhbGxvY2F0aW9uLlxuICogQWxzbywgYGNyZWF0ZWAgaXMgaW50ZW50aW9uYWxseSBrZXB0ICpvdXQqIG9mIGFueSBjbG9zdXJlLCBzbyBpdCBjYW4gYmUgbW9yZVxuICogZWFzaWx5IGNvbGxlY3RlZC5cbiAqL1xuZnVuY3Rpb24gTGF6eShjcmVhdGUpIHtcbiAgICB0aGlzLnZhbHVlID0gY3JlYXRlXG4gICAgdGhpcy5nZXQgPSB0aGlzLmluaXRcbn1cblxubWV0aG9kcyhMYXp5LCB7XG4gICAgcmVjdXJzaXZlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJMYXp5IGZ1bmN0aW9ucyBtdXN0IG5vdCBiZSBjYWxsZWQgcmVjdXJzaXZlbHkhXCIpXG4gICAgfSxcblxuICAgIHJldHVybjogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy52YWx1ZVxuICAgIH0sXG5cbiAgICB0aHJvdzogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aHJvdyB0aGlzLnZhbHVlXG4gICAgfSxcblxuICAgIGluaXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5nZXQgPSB0aGlzLnJlY3Vyc2l2ZVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0aGlzLnZhbHVlID0gKDAsIHRoaXMudmFsdWUpKClcbiAgICAgICAgICAgIHRoaXMuZ2V0ID0gdGhpcy5yZXR1cm5cbiAgICAgICAgICAgIHJldHVybiB0aGlzLnZhbHVlXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWUgPSBlXG4gICAgICAgICAgICB0aGlzLmdldCA9IHRoaXMudGhyb3dcbiAgICAgICAgICAgIHRocm93IHRoaXMudmFsdWVcbiAgICAgICAgfVxuICAgIH0sXG59KVxuXG5leHBvcnRzLmxhenkgPSBmdW5jdGlvbiAoY3JlYXRlKSB7XG4gICAgdmFyIHJlZiA9IG5ldyBMYXp5KGNyZWF0ZSlcblxuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiByZWYuZ2V0KClcbiAgICB9XG59XG4iLCJcInVzZSBzdHJpY3RcIlxuXG4vLyBUbyBzdXBwcmVzcyBkZXByZWNhdGlvbiBtZXNzYWdlc1xudmFyIHN1cHByZXNzRGVwcmVjYXRpb24gPSB0cnVlXG5cbmV4cG9ydHMuc2hvd0RlcHJlY2F0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgIHN1cHByZXNzRGVwcmVjYXRpb24gPSBmYWxzZVxufVxuXG5leHBvcnRzLmhpZGVEZXByZWNhdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICBzdXBwcmVzc0RlcHJlY2F0aW9uID0gdHJ1ZVxufVxuXG52YXIgY29uc29sZSA9IGdsb2JhbC5jb25zb2xlXG52YXIgc2hvdWxkUHJpbnQgPSBjb25zb2xlICE9IG51bGwgJiYgdHlwZW9mIGNvbnNvbGUud2FybiA9PT0gXCJmdW5jdGlvblwiICYmXG4gICAgIShnbG9iYWwucHJvY2VzcyAhPSBudWxsICYmIGdsb2JhbC5wcm9jZXNzLmVudiAhPSBudWxsICYmXG4gICAgICAgIGdsb2JhbC5wcm9jZXNzLmVudi5OT19NSUdSQVRFX1dBUk4pXG5cbmV4cG9ydHMud2FybiA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoc2hvdWxkUHJpbnQgJiYgIXN1cHByZXNzRGVwcmVjYXRpb24pIHtcbiAgICAgICAgY29uc29sZS53YXJuLmFwcGx5KGNvbnNvbGUsIGFyZ3VtZW50cylcbiAgICB9XG59XG5cbmV4cG9ydHMuZGVwcmVjYXRlID0gZnVuY3Rpb24gKG1lc3NhZ2UsIGZ1bmMpIHtcbiAgICB2YXIgcHJpbnRlZCA9ICFzaG91bGRQcmludFxuXG4gICAgLyoqIEB0aGlzICovXG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCFzdXBwcmVzc0RlcHJlY2F0aW9uKSB7XG4gICAgICAgICAgICBpZiAoIXByaW50ZWQpIHtcbiAgICAgICAgICAgICAgICBwcmludGVkID0gdHJ1ZVxuICAgICAgICAgICAgICAgIGNvbnNvbGUudHJhY2UoKVxuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihtZXNzYWdlKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBtZXNzYWdlID0gdW5kZWZpbmVkXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZnVuYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gICAgfVxufVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxuLyoqXG4gKiBCYWNrcG9ydCB3cmFwcGVyIHRvIHdhcm4gYWJvdXQgbW9zdCBvZiB0aGUgbWFqb3IgYnJlYWtpbmcgY2hhbmdlcyBmcm9tIHRoZVxuICogbGFzdCBtYWpvciB2ZXJzaW9uLCBhbmQgdG8gaGVscCBtZSBrZWVwIHRyYWNrIG9mIGFsbCB0aGUgY2hhbmdlcy5cbiAqXG4gKiBJdCBjb25zaXN0cyBvZiBzb2xlbHkgaW50ZXJuYWwgbW9ua2V5IHBhdGNoaW5nIHRvIHJldml2ZSBzdXBwb3J0IG9mIHByZXZpb3VzXG4gKiB2ZXJzaW9ucywgYWx0aG91Z2ggSSB0cmllZCB0byBsaW1pdCBob3cgbXVjaCBrbm93bGVkZ2Ugb2YgdGhlIGludGVybmFscyB0aGlzXG4gKiByZXF1aXJlcy5cbiAqL1xuXG52YXIgQ29tbW9uID0gcmVxdWlyZShcIi4vY29tbW9uXCIpXG52YXIgSW50ZXJuYWwgPSByZXF1aXJlKFwiLi4vaW50ZXJuYWxcIilcbnZhciBtZXRob2RzID0gcmVxdWlyZShcIi4uL2xpYi9tZXRob2RzXCIpXG52YXIgUmVwb3J0ID0gcmVxdWlyZShcIi4uL2xpYi9jb3JlL3JlcG9ydHNcIikuUmVwb3J0XG52YXIgUmVmbGVjdCA9IHJlcXVpcmUoXCIuLi9saWIvYXBpL3JlZmxlY3RcIilcbnZhciBUaGFsbGl1bSA9IHJlcXVpcmUoXCIuLi9saWIvYXBpL3RoYWxsaXVtXCIpXG5cbnZhciBhc3NlcnQgPSByZXF1aXJlKFwiY2xlYW4tYXNzZXJ0XCIpXG5cbi8qICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKlxuICogLSBgcmVmbGVjdC5jaGVja0luaXQoKWAgaXMgZGVwcmVjYXRlZCBpbiBmYXZvciBvZiBgcmVmbGVjdC5sb2NrZWRgIGFuZCAgICAqXG4gKiAgIGVpdGhlciBjb21wbGFpbmluZyB5b3Vyc2VsZiBvciBqdXN0IHVzaW5nIGByZWZsZWN0LmN1cnJlbnRgIHRvIGFkZCAgICAgICpcbiAqICAgdGhpbmdzLiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqL1xubWV0aG9kcyhSZWZsZWN0LCB7XG4gICAgY2hlY2tJbml0OiBDb21tb24uZGVwcmVjYXRlKFxuICAgICAgICBcImByZWZsZWN0LmNoZWNrSW5pdGAgaXMgZGVwcmVjYXRlZC4gVXNlIGByZWZsZWN0LmN1cnJlbnRgIGZvciB0aGUgXCIgK1xuICAgICAgICBcImN1cnJlbnQgdGVzdCBvciB1c2UgYHJlZmxlY3QubG9ja2VkYCBhbmQgY3JlYXRlIGFuZCB0aHJvdyB0aGUgZXJyb3IgXCIgK1xuICAgICAgICBcInlvdXJzZWxmLlwiLFxuICAgICAgICAvKiogQHRoaXMgKi8gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKHRoaXMubG9ja2VkKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFJlZmVyZW5jZUVycm9yKFwiSXQgaXMgb25seSBzYWZlIHRvIGNhbGwgdGVzdCBcIiArXG4gICAgICAgICAgICAgICAgICAgIFwibWV0aG9kcyBkdXJpbmcgaW5pdGlhbGl6YXRpb25cIilcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSksXG59KVxuXG4vKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICpcbiAqIC0gYHQuYXN5bmNgIC0+IGB0LnRlc3RgLCB3aGljaCBub3cgc3VwcG9ydHMgcHJvbWlzZXMuICAgICAgICAgICAgICAgICAgICAgKlxuICogLSBBbGwgdGVzdHMgYXJlIG5vdyBhc3luYy4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICovXG5cbnZhciB0ZXN0ID0gVGhhbGxpdW0ucHJvdG90eXBlLnRlc3RcblxuZnVuY3Rpb24gcnVuQXN5bmMoY2FsbGJhY2ssIHQsIHJlc29sdmUsIHJlamVjdCkge1xuICAgIHZhciByZXNvbHZlZCA9IGZhbHNlXG4gICAgdmFyIGdlbiA9IGNhbGxiYWNrLmNhbGwodCwgdCwgZnVuY3Rpb24gKGVycikge1xuICAgICAgICBpZiAocmVzb2x2ZWQpIHJldHVyblxuICAgICAgICBDb21tb24ud2FybihcImB0LmFzeW5jYCBpcyBkZXByZWNhdGVkLiBcIiArXG4gICAgICAgICAgICBcIlVzZSBgdC50ZXN0YCBhbmQgcmV0dXJuIGEgcHJvbWlzZSBpbnN0ZWFkLlwiKVxuXG4gICAgICAgIHJlc29sdmVkID0gdHJ1ZVxuICAgICAgICBpZiAoZXJyICE9IG51bGwpIHJlamVjdChlcnIpXG4gICAgICAgIGVsc2UgcmVzb2x2ZSgpXG4gICAgfSlcblxuICAgIGlmIChyZXNvbHZlZCkgcmV0dXJuXG5cbiAgICBpZiAodHlwZW9mIGdlbi5uZXh0ICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgLy8gQWxsb3cgdGhlIG1pZ3JhdGlvbiBwYXRoIHRvIHN0YW5kYXJkIHRoZW5hYmxlcy5cbiAgICAgICAgcmVzb2x2ZShnZW4pXG4gICAgICAgIHJldHVyblxuICAgIH1cblxuICAgIENvbW1vbi53YXJuKFwiYHQuYXN5bmNgIGlzIGRlcHJlY2F0ZWQuIFVzZSBgdC50ZXN0YCBhbmQgZWl0aGVyIHJldHVybiBhIFwiICtcbiAgICAgICAgXCJwcm9taXNlIG9yIHVzZSBgY29gL0VTMjAxNyBhc3luYyBmdW5jdGlvbnMgaW5zdGVhZC5cIilcblxuICAgIC8vIFRoaXMgaXMgYSBtb2RpZmllZCB2ZXJzaW9uIG9mIHRoZSBhc3luYy1hd2FpdCBvZmZpY2lhbCwgbm9uLW5vcm1hdGl2ZVxuICAgIC8vIGRlc3VnYXJpbmcgaGVscGVyLCBmb3IgYmV0dGVyIGVycm9yIGNoZWNraW5nIGFuZCBhZGFwdGVkIHRvIGFjY2VwdCBhblxuICAgIC8vIGFscmVhZHktaW5zdGFudGlhdGVkIGl0ZXJhdG9yIGluc3RlYWQgb2YgYSBnZW5lcmF0b3IuXG4gICAgZnVuY3Rpb24gaXRlcmF0ZShuZXh0KSB7XG4gICAgICAgIC8vIGZpbmlzaGVkIHdpdGggc3VjY2VzcywgcmVzb2x2ZSB0aGUgcHJvbWlzZVxuICAgICAgICBpZiAobmV4dC5kb25lKSByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG5leHQudmFsdWUpXG5cbiAgICAgICAgLy8gbm90IGZpbmlzaGVkLCBjaGFpbiBvZmYgdGhlIHlpZWxkZWQgcHJvbWlzZSBhbmQgc3RlcCBhZ2FpblxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG5leHQudmFsdWUpLnRoZW4oXG4gICAgICAgICAgICBmdW5jdGlvbiAodikgeyByZXR1cm4gaXRlcmF0ZShnZW4ubmV4dCh2KSkgfSxcbiAgICAgICAgICAgIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBnZW4udGhyb3cgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXRlcmF0ZShnZW4udGhyb3coZSkpXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgfVxuXG4gICAgaXRlcmF0ZShnZW4ubmV4dCh1bmRlZmluZWQpKS50aGVuKHJlc29sdmUsIHJlamVjdClcbn1cblxubWV0aG9kcyhUaGFsbGl1bSwge1xuICAgIGFzeW5jOiBmdW5jdGlvbiAobmFtZSwgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAvLyBSZXVzZSB0aGUgbm9ybWFsIGVycm9yIGhhbmRsaW5nLlxuICAgICAgICAgICAgcmV0dXJuIHRlc3QuYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRlc3QuY2FsbCh0aGlzLCBuYW1lLCBmdW5jdGlvbiAodCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBydW5Bc3luYyhjYWxsYmFjaywgdCwgcmVzb2x2ZSwgcmVqZWN0KVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIGFzeW5jU2tpcDogQ29tbW9uLmRlcHJlY2F0ZShcbiAgICAgICAgXCJgdC5hc3luY1NraXBgIGlzIGRlcHJlY2F0ZWQuIFVzZSBgdC50ZXN0U2tpcGAgaW5zdGVhZC5cIixcbiAgICAgICAgVGhhbGxpdW0ucHJvdG90eXBlLnRlc3RTa2lwKSxcbn0pXG5cbm1ldGhvZHMoUmVmbGVjdCwge1xuICAgIGdldCBpc0FzeW5jKCkge1xuICAgICAgICBDb21tb24ud2FybihcIlRlc3RzIGFyZSBub3cgYWx3YXlzIGFzeW5jLiBZb3Ugbm8gbG9uZ2VyIG5lZWQgdG8gXCIgK1xuICAgICAgICAgICAgXCJoYW5kbGUgdGhlIG90aGVyIGNhc2VcIilcbiAgICAgICAgcmV0dXJuIHRydWVcbiAgICB9LFxufSlcblxuLyogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqXG4gKiBgcmVmbGVjdC5kZWZpbmVgLCBgdC5kZWZpbmVgLCBgcmVmbGVjdC53cmFwYCwgYW5kIGByZWZsZWN0LmFkZGAsIGFyZSBhbGwgICpcbiAqIHJlbW92ZWQuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqL1xuXG5mdW5jdGlvbiBpc0xvY2tlZChtZXRob2QpIHtcbiAgICByZXR1cm4gbWV0aG9kID09PSBcIl9cIiB8fFxuICAgICAgICBtZXRob2QgPT09IFwicmVmbGVjdFwiIHx8XG4gICAgICAgIG1ldGhvZCA9PT0gXCJvbmx5XCIgfHxcbiAgICAgICAgbWV0aG9kID09PSBcInVzZVwiIHx8XG4gICAgICAgIG1ldGhvZCA9PT0gXCJyZXBvcnRlclwiIHx8XG4gICAgICAgIG1ldGhvZCA9PT0gXCJkZWZpbmVcIiB8fFxuICAgICAgICBtZXRob2QgPT09IFwidGltZW91dFwiIHx8XG4gICAgICAgIG1ldGhvZCA9PT0gXCJzbG93XCIgfHxcbiAgICAgICAgbWV0aG9kID09PSBcInJ1blwiIHx8XG4gICAgICAgIG1ldGhvZCA9PT0gXCJ0ZXN0XCIgfHxcbiAgICAgICAgbWV0aG9kID09PSBcInRlc3RTa2lwXCIgfHxcbiAgICAgICAgbWV0aG9kID09PSBcImFzeW5jXCIgfHxcbiAgICAgICAgbWV0aG9kID09PSBcImFzeW5jU2tpcFwiXG59XG5cbmZ1bmN0aW9uIGdldEVudW1lcmFibGVTeW1ib2xzKGtleXMsIG9iamVjdCkge1xuICAgIHZhciBzeW1ib2xzID0gT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhvYmplY3QpXG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN5bWJvbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHN5bSA9IHN5bWJvbHNbaV1cblxuICAgICAgICBpZiAoT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihzeW0pLmVudW1lcmFibGUpIGtleXMucHVzaChzeW0pXG4gICAgfVxufVxuXG4vLyBUaGlzIGhhbmRsZXMgbmFtZSArIGZ1bmMgdnMgb2JqZWN0IHdpdGggbWV0aG9kcy5cbmZ1bmN0aW9uIGl0ZXJhdGVTZXR0ZXIodGVzdCwgbmFtZSwgZnVuYywgaXRlcmF0b3IpIHtcbiAgICAvLyBDaGVjayBib3RoIHRoZSBuYW1lIGFuZCBmdW5jdGlvbiwgc28gRVM2IHN5bWJvbCBwb2x5ZmlsbHMgKHdoaWNoIHVzZVxuICAgIC8vIG9iamVjdHMgc2luY2UgaXQncyBpbXBvc3NpYmxlIHRvIGZ1bGx5IHBvbHlmaWxsIHByaW1pdGl2ZXMpIHdvcmsuXG4gICAgaWYgKHR5cGVvZiBuYW1lID09PSBcIm9iamVjdFwiICYmIG5hbWUgIT0gbnVsbCAmJiBmdW5jID09IG51bGwpIHtcbiAgICAgICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhuYW1lKVxuXG4gICAgICAgIGlmICh0eXBlb2YgT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICBnZXRFbnVtZXJhYmxlU3ltYm9scyhrZXlzLCBuYW1lKVxuICAgICAgICB9XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIga2V5ID0ga2V5c1tpXVxuXG4gICAgICAgICAgICBpZiAodHlwZW9mIG5hbWVba2V5XSAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGJvZHkgdG8gYmUgYSBmdW5jdGlvblwiKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0ZXN0Lm1ldGhvZHNba2V5XSA9IGl0ZXJhdG9yKHRlc3QsIGtleSwgbmFtZVtrZXldKVxuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHR5cGVvZiBmdW5jICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBib2R5IHRvIGJlIGEgZnVuY3Rpb25cIilcbiAgICAgICAgfVxuXG4gICAgICAgIHRlc3QubWV0aG9kc1tuYW1lXSA9IGl0ZXJhdG9yKHRlc3QsIG5hbWUsIGZ1bmMpXG4gICAgfVxufVxuXG4vKipcbiAqIEB0aGlzIHtTdGF0ZX1cbiAqIFJ1biBgZnVuY2Agd2l0aCBgLi4uYXJnc2Agd2hlbiBhc3NlcnRpb25zIGFyZSBydW4sIG9ubHkgaWYgdGhlIHRlc3QgaXNuJ3RcbiAqIHNraXBwZWQuIFRoaXMgaXMgaW1tZWRpYXRlbHkgZm9yIGJsb2NrIGFuZCBhc3luYyB0ZXN0cywgYnV0IGRlZmVycmVkIGZvclxuICogaW5saW5lIHRlc3RzLiBJdCdzIHVzZWZ1bCBmb3IgaW5saW5lIGFzc2VydGlvbnMuXG4gKi9cbmZ1bmN0aW9uIGF0dGVtcHQoZnVuYywgYSwgYiwgYy8qICwgLi4uYXJncyAqLykge1xuICAgIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgIGNhc2UgMDogdGhyb3cgbmV3IFR5cGVFcnJvcihcInVucmVhY2hhYmxlXCIpXG4gICAgY2FzZSAxOiBmdW5jKCk7IHJldHVyblxuICAgIGNhc2UgMjogZnVuYyhhKTsgcmV0dXJuXG4gICAgY2FzZSAzOiBmdW5jKGEsIGIpOyByZXR1cm5cbiAgICBjYXNlIDQ6IGZ1bmMoYSwgYiwgYyk7IHJldHVyblxuICAgIGRlZmF1bHQ6XG4gICAgICAgIHZhciBhcmdzID0gW11cblxuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJncy5wdXNoKGFyZ3VtZW50c1tpXSlcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmMuYXBwbHkodW5kZWZpbmVkLCBhcmdzKVxuICAgIH1cbn1cblxuZnVuY3Rpb24gZGVmaW5lQXNzZXJ0aW9uKHRlc3QsIG5hbWUsIGZ1bmMpIHtcbiAgICAvLyBEb24ndCBsZXQgbmF0aXZlIG1ldGhvZHMgZ2V0IG92ZXJyaWRkZW4gYnkgYXNzZXJ0aW9uc1xuICAgIGlmIChpc0xvY2tlZChuYW1lKSkge1xuICAgICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcihcIk1ldGhvZCAnXCIgKyBuYW1lICsgXCInIGlzIGxvY2tlZCFcIilcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBydW4oKSB7XG4gICAgICAgIHZhciByZXMgPSBmdW5jLmFwcGx5KHVuZGVmaW5lZCwgYXJndW1lbnRzKVxuXG4gICAgICAgIGlmICh0eXBlb2YgcmVzICE9PSBcIm9iamVjdFwiIHx8IHJlcyA9PT0gbnVsbCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIHJlc3VsdCB0byBiZSBhbiBvYmplY3RcIilcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghcmVzLnRlc3QpIHtcbiAgICAgICAgICAgIGFzc2VydC5mYWlsKHJlcy5tZXNzYWdlLCByZXMpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gLyoqIEB0aGlzICovIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBbcnVuXVxuXG4gICAgICAgIGFyZ3MucHVzaC5hcHBseShhcmdzLCBhcmd1bWVudHMpXG4gICAgICAgIGF0dGVtcHQuYXBwbHkodW5kZWZpbmVkLCBhcmdzKVxuICAgICAgICByZXR1cm4gdGhpc1xuICAgIH1cbn1cblxuZnVuY3Rpb24gd3JhcEFzc2VydGlvbih0ZXN0LCBuYW1lLCBmdW5jKSB7XG4gICAgLy8gRG9uJ3QgbGV0IGByZWZsZWN0YCBhbmQgYF9gIGNoYW5nZS5cbiAgICBpZiAobmFtZSA9PT0gXCJyZWZsZWN0XCIgfHwgbmFtZSA9PT0gXCJfXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCJNZXRob2QgJ1wiICsgbmFtZSArIFwiJyBpcyBsb2NrZWQhXCIpXG4gICAgfVxuXG4gICAgdmFyIG9sZCA9IHRlc3QubWV0aG9kc1tuYW1lXVxuXG4gICAgaWYgKHR5cGVvZiBvbGQgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICAgICAgXCJFeHBlY3RlZCB0LlwiICsgbmFtZSArIFwiIHRvIGFscmVhZHkgYmUgYSBmdW5jdGlvblwiKVxuICAgIH1cblxuICAgIC8qKiBAdGhpcyAqL1xuICAgIGZ1bmN0aW9uIGFwcGx5KGEsIGIsIGMsIGQpIHtcbiAgICAgICAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgIGNhc2UgMDogcmV0dXJuIGZ1bmMuY2FsbCh0aGlzLCBvbGQuYmluZCh0aGlzKSlcbiAgICAgICAgY2FzZSAxOiByZXR1cm4gZnVuYy5jYWxsKHRoaXMsIG9sZC5iaW5kKHRoaXMpLCBhKVxuICAgICAgICBjYXNlIDI6IHJldHVybiBmdW5jLmNhbGwodGhpcywgb2xkLmJpbmQodGhpcyksIGEsIGIpXG4gICAgICAgIGNhc2UgMzogcmV0dXJuIGZ1bmMuY2FsbCh0aGlzLCBvbGQuYmluZCh0aGlzKSwgYSwgYiwgYylcbiAgICAgICAgY2FzZSA0OiByZXR1cm4gZnVuYy5jYWxsKHRoaXMsIG9sZC5iaW5kKHRoaXMpLCBhLCBiLCBjLCBkKVxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgdmFyIGFyZ3MgPSBbb2xkLmJpbmQodGhpcyldXG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgYXJncy5wdXNoKGFyZ3VtZW50c1tpXSlcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGZ1bmMuYXBwbHkodGhpcywgYXJncylcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiAvKiogQHRoaXMgKi8gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgcmV0ID0gYXBwbHkuYXBwbHkodGhpcywgYXJndW1lbnRzKVxuXG4gICAgICAgIHJldHVybiByZXQgIT09IHVuZGVmaW5lZCA/IHJldCA6IHRoaXNcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGFkZEFzc2VydGlvbih0ZXN0LCBuYW1lLCBmdW5jKSB7XG4gICAgaWYgKHR5cGVvZiB0ZXN0Lm1ldGhvZHNbbmFtZV0gIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIk1ldGhvZCAnXCIgKyBuYW1lICsgXCInIGFscmVhZHkgZXhpc3RzIVwiKVxuICAgIH1cblxuICAgIC8qKiBAdGhpcyAqL1xuICAgIGZ1bmN0aW9uIGFwcGx5KGEsIGIsIGMsIGQpIHtcbiAgICAgICAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgIGNhc2UgMDogcmV0dXJuIGZ1bmMuY2FsbCh0aGlzLCB0aGlzKVxuICAgICAgICBjYXNlIDE6IHJldHVybiBmdW5jLmNhbGwodGhpcywgdGhpcywgYSlcbiAgICAgICAgY2FzZSAyOiByZXR1cm4gZnVuYy5jYWxsKHRoaXMsIHRoaXMsIGEsIGIpXG4gICAgICAgIGNhc2UgMzogcmV0dXJuIGZ1bmMuY2FsbCh0aGlzLCB0aGlzLCBhLCBiLCBjKVxuICAgICAgICBjYXNlIDQ6IHJldHVybiBmdW5jLmNhbGwodGhpcywgdGhpcywgYSwgYiwgYywgZClcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHZhciBhcmdzID0gW3RoaXNdXG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgYXJncy5wdXNoKGFyZ3VtZW50c1tpXSlcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGZ1bmMuYXBwbHkodGhpcywgYXJncylcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiAvKiogQHRoaXMgKi8gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgcmV0ID0gYXBwbHkuYXBwbHkodGhpcywgYXJndW1lbnRzKVxuXG4gICAgICAgIHJldHVybiByZXQgIT09IHVuZGVmaW5lZCA/IHJldCA6IHRoaXNcbiAgICB9XG59XG5cbm1ldGhvZHMoUmVmbGVjdCwge1xuICAgIGRlZmluZTogQ29tbW9uLmRlcHJlY2F0ZShcbiAgICAgICAgXCJgcmVmbGVjdC5kZWZpbmVgIGlzIGRlcHJlY2F0ZWQuIFVzZSBleHRlcm5hbCBtZXRob2RzIG9yIGRpcmVjdCBhc3NpZ25tZW50IGluc3RlYWQuXCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LWxlblxuICAgICAgICAvKiogQHRoaXMgKi8gZnVuY3Rpb24gKG5hbWUsIGZ1bmMpIHtcbiAgICAgICAgICAgIGl0ZXJhdGVTZXR0ZXIodGhpcy5fLmN1cnJlbnQudmFsdWUsIG5hbWUsIGZ1bmMsIGRlZmluZUFzc2VydGlvbilcbiAgICAgICAgfSksXG5cbiAgICB3cmFwOiBDb21tb24uZGVwcmVjYXRlKFxuICAgICAgICBcImByZWZsZWN0LndyYXBgIGlzIGRlcHJlY2F0ZWQuIFVzZSBleHRlcm5hbCBtZXRob2RzIG9yIGRpcmVjdCBhc3NpZ25tZW50IGluc3RlYWQuXCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LWxlblxuICAgICAgICAvKiogQHRoaXMgKi8gZnVuY3Rpb24gKG5hbWUsIGZ1bmMpIHtcbiAgICAgICAgICAgIGl0ZXJhdGVTZXR0ZXIodGhpcy5fLmN1cnJlbnQudmFsdWUsIG5hbWUsIGZ1bmMsIHdyYXBBc3NlcnRpb24pXG4gICAgICAgIH0pLFxuXG4gICAgYWRkOiBDb21tb24uZGVwcmVjYXRlKFxuICAgICAgICBcImByZWZsZWN0LmFkZGAgaXMgZGVwcmVjYXRlZC4gVXNlIGV4dGVybmFsIG1ldGhvZHMgb3IgZGlyZWN0IGFzc2lnbm1lbnQgaW5zdGVhZC5cIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtbGVuXG4gICAgICAgIC8qKiBAdGhpcyAqLyBmdW5jdGlvbiAobmFtZSwgZnVuYykge1xuICAgICAgICAgICAgaXRlcmF0ZVNldHRlcih0aGlzLl8uY3VycmVudC52YWx1ZSwgbmFtZSwgZnVuYywgYWRkQXNzZXJ0aW9uKVxuICAgICAgICB9KSxcbn0pXG5cbm1ldGhvZHMoVGhhbGxpdW0sIHtcbiAgICBkZWZpbmU6IENvbW1vbi5kZXByZWNhdGUoXG4gICAgICAgIFwiYHQuZGVmaW5lYCBpcyBkZXByZWNhdGVkLiBVc2UgZXh0ZXJuYWwgbWV0aG9kcyBvciBkaXJlY3QgYXNzaWdubWVudCBpbnN0ZWFkLlwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1sZW5cbiAgICAgICAgLyoqIEB0aGlzICovIGZ1bmN0aW9uIChuYW1lLCBmdW5jKSB7XG4gICAgICAgICAgICBpdGVyYXRlU2V0dGVyKHRoaXMuXy5jdXJyZW50LnZhbHVlLCBuYW1lLCBmdW5jLCBkZWZpbmVBc3NlcnRpb24pXG4gICAgICAgICAgICByZXR1cm4gdGhpc1xuICAgICAgICB9KSxcbn0pXG5cbi8qICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKlxuICogLSBgcmVmbGVjdC5kb2AgaXMgZGVwcmVjYXRlZCwgd2l0aCBubyByZXBsYWNlbWVudCAoaW5saW5lIHRlc3RzIGFyZSBhbHNvICAqXG4gKiAgIGRlcHJlY2F0ZWQpLiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqIC0gYHJlZmxlY3QuYmFzZWAgLT4gYGludGVybmFsLnJvb3RgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogLSBgcmVmbGVjdC5Bc3NlcnRpb25FcnJvcmAgLT4gYGFzc2VydC5Bc3NlcnRpb25FcnJvcmAuICAgICAgICAgICAgICAgICAgICAqXG4gKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICovXG5cbm1ldGhvZHMoUmVmbGVjdCwge1xuICAgIC8vIERlcHJlY2F0ZWQgYWxpYXNlc1xuICAgIGRvOiBDb21tb24uZGVwcmVjYXRlKFxuICAgICAgICBcImByZWZsZWN0LmRvYCBpcyBkZXByZWNhdGVkLiBUcmFuc2l0aW9uIHRvIGJsb2NrIHRlc3RzLCBpZiBuZWNlc3NhcnksIGFuZCBydW4gdGhlIGNvZGUgZGlyZWN0bHkuXCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LWxlblxuICAgICAgICAvKiogQHRoaXMgKi8gZnVuY3Rpb24gKGZ1bmMpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZnVuYyAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIGJlIGEgZnVuY3Rpb25cIilcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYXR0ZW1wdC5hcHBseSh1bmRlZmluZWQsIGFyZ3VtZW50cylcbiAgICAgICAgICAgIHJldHVybiB0aGlzXG4gICAgICAgIH0pLFxuICAgIGJhc2U6IENvbW1vbi5kZXByZWNhdGUoXG4gICAgICAgIFwiYHJlZmxlY3QuYmFzZWAgaXMgZGVwcmVjYXRlZC4gVXNlIGBpbnRlcm5hbC5yb290YCBmcm9tIGB0aGFsbGl1bS9pbnRlcm5hbGAgaW5zdGVhZC5cIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtbGVuXG4gICAgICAgIEludGVybmFsLnJvb3QpLFxufSlcblxuLy8gRVNMaW50IG9kZGx5IGNhbid0IHRlbGwgdGhlc2UgYXJlIHNoYWRvd2VkLlxuLyogZXNsaW50LWRpc2FibGUgbm8tZXh0ZW5kLW5hdGl2ZSAqL1xuXG5mdW5jdGlvbiBsb2NrRXJyb3IoQXNzZXJ0aW9uRXJyb3IpIHtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoUmVmbGVjdC5wcm90b3R5cGUsIFwiQXNzZXJ0aW9uRXJyb3JcIiwge1xuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6IEFzc2VydGlvbkVycm9yLFxuICAgIH0pXG4gICAgcmV0dXJuIEFzc2VydGlvbkVycm9yXG59XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShSZWZsZWN0LnByb3RvdHlwZSwgXCJBc3NlcnRpb25FcnJvclwiLCB7XG4gICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgIGdldDogQ29tbW9uLmRlcHJlY2F0ZShcbiAgICAgICAgXCJgcmVmbGVjdC5Bc3NlcnRpb25FcnJvcmAgaXMgZGVwcmVjYXRlZC4gVXNlIGBhc3NlcnQuQXNzZXJ0aW9uRXJyb3JgIGZyb20gYHRoYWxsaXVtL2Fzc2VydGAgaW5zdGVhZC5cIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtbGVuXG4gICAgICAgIGZ1bmN0aW9uICgpIHsgcmV0dXJuIGxvY2tFcnJvcihhc3NlcnQuQXNzZXJ0aW9uRXJyb3IpIH0pLFxuICAgIHNldDogQ29tbW9uLmRlcHJlY2F0ZShcbiAgICAgICAgXCJgcmVmbGVjdC5Bc3NlcnRpb25FcnJvcmAgaXMgZGVwcmVjYXRlZC4gVXNlIGBhc3NlcnQuQXNzZXJ0aW9uRXJyb3JgIGZyb20gYHRoYWxsaXVtL2Fzc2VydGAgaW5zdGVhZC5cIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtbGVuXG4gICAgICAgIGxvY2tFcnJvciksXG59KVxuXG4vKiBlc2xpbnQtZW5hYmxlIG5vLWV4dGVuZC1uYXRpdmUgKi9cblxubWV0aG9kcyhUaGFsbGl1bSwge1xuICAgIGJhc2U6IENvbW1vbi5kZXByZWNhdGUoXG4gICAgICAgIFwiYHQuYmFzZWAgaXMgZGVwcmVjYXRlZC4gVXNlIGB0LmNyZWF0ZWAgaW5zdGVhZC5cIixcbiAgICAgICAgZnVuY3Rpb24gKCkgeyByZXR1cm4gbmV3IFRoYWxsaXVtKCkgfSksXG59KVxuXG4vKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICpcbiAqIC0gYXNzZXJ0aW9ucyBkZWZpbmVkIG9uIG1haW4gZXhwb3J0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogLSBgdC4qYCBhc3NlcnRpb25zIC0+IGBhc3NlcnQuKmAgKHNvbWUgcmVuYW1lZCkgZnJvbSBgdGhhbGxpdW0vYXNzZXJ0YCAgICAqXG4gKiAtIGB0LnRydWVgL2V0Yy4gYXJlIGdvbmUgKGV4Y2VwdCBgdC51bmRlZmluZWRgIC0+IGBhc3NlcnQuaXNVbmRlZmluZWRgKSAgICpcbiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKi9cbkNvbW1vbi5oaWRlRGVwcmVjYXRpb24oKVxucmVxdWlyZShcIi4uL2Fzc2VydGlvbnNcIikocmVxdWlyZShcIi4uL2luZGV4XCIpKVxuQ29tbW9uLnNob3dEZXByZWNhdGlvbigpXG5cbi8qICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKlxuICogYGV4dHJhYCBldmVudHMgYXJlIG5vIGxvbmdlciBhIHRoaW5nLiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICovXG5tZXRob2RzKFJlcG9ydCwge1xuICAgIGdldCBpc0lubGluZSgpIHtcbiAgICAgICAgQ29tbW9uLndhcm4oXCJgZXh0cmFgIGV2ZW50cyBubyBsb25nZXIgZXhpc3QuIFlvdSBubyBsb25nZXIgbmVlZCB0byBcIiArXG4gICAgICAgICAgICBcImhhbmRsZSB0aGVtXCIpXG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgIH0sXG59KVxuXG4vKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICpcbiAqIC0gYHQucmVmbGVjdGAgYW5kIGB0LnVzZWAgLT4gbm9uLWNhY2hpbmcgYHQuY2FsbGAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqL1xudmFyIGNhbGwgPSBUaGFsbGl1bS5wcm90b3R5cGUuY2FsbFxuXG5mdW5jdGlvbiBpZCh4KSB7IHJldHVybiB4IH1cblxubWV0aG9kcyhUaGFsbGl1bSwge1xuICAgIHJlZmxlY3Q6IENvbW1vbi5kZXByZWNhdGUoXG4gICAgICAgIFwiYHQucmVmbGVjdGAgaXMgZGVwcmVjYXRlZC4gVXNlIGB0LmNhbGxgIGluc3RlYWQuXCIsXG4gICAgICAgIC8qKiBAdGhpcyAqLyBmdW5jdGlvbiAoKSB7IHJldHVybiBjYWxsLmNhbGwodGhpcywgaWQpIH0pLFxuXG4gICAgdXNlOiBDb21tb24uZGVwcmVjYXRlKFxuICAgICAgICBcImB0LnVzZWAgaXMgZGVwcmVjYXRlZC4gVXNlIGB0LmNhbGxgIGluc3RlYWQuXCIsXG4gICAgICAgIC8qKiBAdGhpcyAqLyBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgcmVmbGVjdCA9IGNhbGwuY2FsbCh0aGlzLCBpZClcblxuICAgICAgICAgICAgaWYgKCFyZWZsZWN0LnNraXBwZWQpIHtcbiAgICAgICAgICAgICAgICB2YXIgdGVzdCA9IHRoaXMuXy5jdXJyZW50LnZhbHVlXG5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcGx1Z2luID0gYXJndW1lbnRzW2ldXG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBwbHVnaW4gIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIkV4cGVjdGVkIGBwbHVnaW5gIHRvIGJlIGEgZnVuY3Rpb25cIilcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0ZXN0LnBsdWdpbnMgPT0gbnVsbCkgdGVzdC5wbHVnaW5zID0gW11cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRlc3QucGx1Z2lucy5pbmRleE9mKHBsdWdpbikgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBBZGQgcGx1Z2luIGJlZm9yZSBjYWxsaW5nIGl0LlxuICAgICAgICAgICAgICAgICAgICAgICAgdGVzdC5wbHVnaW5zLnB1c2gocGx1Z2luKVxuICAgICAgICAgICAgICAgICAgICAgICAgcGx1Z2luLmNhbGwodGhpcywgdGhpcylcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRoaXNcbiAgICAgICAgfSksXG59KVxuXG4vKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICpcbiAqIC0gYHJlZmxlY3QucmVwb3J0YCAtPiBgaW50ZXJuYWwucmVwb3J0LipgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogLSBgcmVmbGVjdC5sb2NgIC0+IGBpbnRlcm5hbC5sb2NhdGlvbmAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiAtIGByZWZsZWN0LnNjaGVkdWxlcmAgb2Jzb2xldGVkLiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKi9cblxudmFyIHJlcG9ydHMgPSBJbnRlcm5hbC5yZXBvcnRzXG5cbm1ldGhvZHMoUmVmbGVjdCwge1xuICAgIHJlcG9ydDogQ29tbW9uLmRlcHJlY2F0ZShcbiAgICAgICAgXCJgcmVmbGVjdC5yZXBvcnRgIGlzIGRlcHJlY2F0ZWQuIFVzZSBgaW50ZXJuYWwucmVwb3J0LipgIGZyb20gYHRoYWxsaXVtL2ludGVybmFsYCBpbnN0ZWFkLlwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1sZW5cbiAgICAgICAgZnVuY3Rpb24gKHR5cGUsIHBhdGgsIHZhbHVlLCBkdXJhdGlvbiwgc2xvdykgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1wYXJhbXMsIG1heC1sZW5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgdHlwZSAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBgdHlwZWAgdG8gYmUgYSBzdHJpbmdcIilcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgICAgICBjYXNlIFwic3RhcnRcIjogcmV0dXJuIHJlcG9ydHMuc3RhcnQoKVxuICAgICAgICAgICAgY2FzZSBcImVudGVyXCI6IHJldHVybiByZXBvcnRzLmVudGVyKHBhdGgsIGR1cmF0aW9uLCBzbG93KVxuICAgICAgICAgICAgY2FzZSBcImxlYXZlXCI6IHJldHVybiByZXBvcnRzLmxlYXZlKHBhdGgpXG4gICAgICAgICAgICBjYXNlIFwicGFzc1wiOiByZXR1cm4gcmVwb3J0cy5wYXNzKHBhdGgsIGR1cmF0aW9uLCBzbG93KVxuICAgICAgICAgICAgY2FzZSBcImZhaWxcIjogcmV0dXJuIHJlcG9ydHMuZmFpbChwYXRoLCB2YWx1ZSwgZHVyYXRpb24sIHNsb3cpXG4gICAgICAgICAgICBjYXNlIFwic2tpcFwiOiByZXR1cm4gcmVwb3J0cy5za2lwKHBhdGgpXG4gICAgICAgICAgICBjYXNlIFwiZW5kXCI6IHJldHVybiByZXBvcnRzLmVuZCgpXG4gICAgICAgICAgICBjYXNlIFwiZXJyb3JcIjogcmV0dXJuIHJlcG9ydHMuZXJyb3IodmFsdWUpXG4gICAgICAgICAgICBjYXNlIFwiaG9va1wiOiByZXR1cm4gcmVwb3J0cy5ob29rKHBhdGgsIHZhbHVlKVxuICAgICAgICAgICAgZGVmYXVsdDogdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCJVbmtub3duIHJlcG9ydCBgdHlwZWA6IFwiICsgdHlwZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSksXG5cbiAgICBsb2M6IENvbW1vbi5kZXByZWNhdGUoXG4gICAgICAgIFwiYHJlZmxlY3QubG9jYCBpcyBkZXByZWNhdGVkLiBVc2UgYGludGVybmFsLmxvY2F0aW9uYCBmcm9tIGB0aGFsbGl1bS9pbnRlcm5hbGAgaW5zdGVhZC5cIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtbGVuXG4gICAgICAgIEludGVybmFsLmxvY2F0aW9uKSxcblxuICAgIHNjaGVkdWxlcjogQ29tbW9uLmRlcHJlY2F0ZShcbiAgICAgICAgXCJgcmVmbGVjdC5zY2hlZHVsZXJgIGlzIGRlcHJlY2F0ZWQuIEl0IGlzIG5vIGxvbmdlciB1c2VmdWwgdG8gdGhlIGxpYnJhcnksIGFuZCBjYW4gYmUgc2FmZWx5IHJlbW92ZWQuXCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LWxlblxuICAgICAgICBmdW5jdGlvbiAoKSB7fSksXG59KVxuXG4vKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICpcbiAqIElubGluZSB0ZXN0cyBhcmUgZGVwcmVjYXRlZC4gVGhpcyBpcyBcImZpeGVkXCIgYnkganVzdCB0aHJvd2luZywgc2luY2UgaXQncyAqXG4gKiBoYXJkIHRvIHBhdGNoIGJhY2sgaW4gYW5kIGVhc3kgdG8gZml4IG9uIHRoZSB1c2VyJ3MgZW5kLiAgICAgICAgICAgICAgICAgICpcbiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKi9cbm1ldGhvZHMoVGhhbGxpdW0sIHtcbiAgICB0ZXN0OiBmdW5jdGlvbiAobmFtZSwgZnVuYykge1xuICAgICAgICBpZiAoZnVuYyA9PSBudWxsKSB7XG4gICAgICAgICAgICAvLyBDYXRjaCB0aGlzIHBhcnRpY3VsYXIgY2FzZSwgdG8gdGhyb3cgd2l0aCBhIG1vcmUgaW5mb3JtYXRpdmVcbiAgICAgICAgICAgIC8vIG1lc3NzYWdlLlxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICAgICAgICAgICBcIklubGluZSB0ZXN0cyBhcmUgZGVwcmVjYXRlZC4gVXNlIGJsb2NrIHRlc3RzIGluc3RlYWQuXCIpXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGVzdC5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gICAgfSxcbn0pXG5cbm1ldGhvZHMoUmVmbGVjdCwge1xuICAgIGdldCBpc0lubGluZSgpIHtcbiAgICAgICAgQ29tbW9uLndhcm4oXCJUZXN0cyBhcmUgbm93IG5ldmVyIGlubGluZS4gWW91IG5vIGxvbmdlciBuZWVkIHRvIFwiICtcbiAgICAgICAgICAgIFwiaGFuZGxlIHRoaXMgY2FzZVwiKVxuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICB9LFxufSlcblxuLyogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqXG4gKiBgcmVmbGVjdC5tZXRob2RzYCAtPiBgcmVmbGVjdC5jdXJyZW50YCBhbmQgdXNpbmcgbmV3IGByZWZsZWN0YCBtZXRob2RzICAgICpcbiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKi9cbm1ldGhvZHMoUmVmbGVjdCwge1xuICAgIGdldCBtZXRob2RzKCkge1xuICAgICAgICBDb21tb24ud2FybihcImByZWZsZWN0Lm1ldGhvZHNgIGlzIGRlcHJlY2F0ZWQuIFVzZSBgcmVmbGVjdC5jdXJyZW50YCwgXCIgK1xuICAgICAgICAgICAgXCJ0aGUgcmV0dXJuIHZhbHVlIG9mIGB0LmNhbGxgLCBhbmQgdGhlIGFwcHJvcHJpYXRlIG5ldyBgcmVmbGVjdGAgXCIgK1xuICAgICAgICAgICAgXCJtZXRob2RzIGluc3RlYWRcIilcbiAgICAgICAgcmV0dXJuIHRoaXMuXy5tZXRob2RzXG4gICAgfSxcbn0pXG5cbi8qICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKlxuICogYHJlZmxlY3QucmVwb3J0ZXJzYCAtPiBgcmVmbGVjdC5oYXNSZXBvcnRlcmAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICovXG5tZXRob2RzKFJlZmxlY3QsIHtcbiAgICBnZXQgcmVwb3J0ZXJzKCkge1xuICAgICAgICBDb21tb24ud2FybihcImByZWZsZWN0LnJlcG9ydGVyc2AgaXMgZGVwcmVjYXRlZC4gVXNlIFwiICtcbiAgICAgICAgICAgIFwiYHJlZmxlY3QuaGFzUmVwb3J0ZXJgIGluc3RlYWQgdG8gY2hlY2sgZm9yIGV4aXN0ZW5jZSBvZiBhIFwiICtcbiAgICAgICAgICAgIFwicmVwb3J0ZXIuXCIpXG4gICAgICAgIHJldHVybiB0aGlzLl8ubWV0aG9kc1xuICAgIH0sXG59KVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoeHMsIGYpIHtcbiAgICBpZiAoeHMubWFwKSByZXR1cm4geHMubWFwKGYpO1xuICAgIHZhciByZXMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHhzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciB4ID0geHNbaV07XG4gICAgICAgIGlmIChoYXNPd24uY2FsbCh4cywgaSkpIHJlcy5wdXNoKGYoeCwgaSwgeHMpKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbn07XG5cbnZhciBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuIiwidmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHhzLCBmLCBhY2MpIHtcbiAgICB2YXIgaGFzQWNjID0gYXJndW1lbnRzLmxlbmd0aCA+PSAzO1xuICAgIGlmIChoYXNBY2MgJiYgeHMucmVkdWNlKSByZXR1cm4geHMucmVkdWNlKGYsIGFjYyk7XG4gICAgaWYgKHhzLnJlZHVjZSkgcmV0dXJuIHhzLnJlZHVjZShmKTtcbiAgICBcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHhzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICghaGFzT3duLmNhbGwoeHMsIGkpKSBjb250aW51ZTtcbiAgICAgICAgaWYgKCFoYXNBY2MpIHtcbiAgICAgICAgICAgIGFjYyA9IHhzW2ldO1xuICAgICAgICAgICAgaGFzQWNjID0gdHJ1ZTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGFjYyA9IGYoYWNjLCB4c1tpXSwgaSk7XG4gICAgfVxuICAgIHJldHVybiBhY2M7XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCJcblxuLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9zdWJzdGFjay9ub2RlLWJyb3dzZXJpZnkvaXNzdWVzLzE2NzRcblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwidXRpbC1pbnNwZWN0XCIpXG4iLCJcInVzZSBzdHJpY3RcIlxuXG52YXIgaW5zcGVjdCA9IGV4cG9ydHMuaW5zcGVjdCA9IHJlcXVpcmUoXCIuL2luc3BlY3RcIilcbnZhciBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5XG52YXIgQXNzZXJ0aW9uRXJyb3JcblxuLy8gUGhhbnRvbUpTLCBJRSwgYW5kIHBvc3NpYmx5IEVkZ2UgZG9uJ3Qgc2V0IHRoZSBzdGFjayB0cmFjZSB1bnRpbCB0aGUgZXJyb3IgaXNcbi8vIHRocm93bi4gTm90ZSB0aGF0IHRoaXMgcHJlZmVycyBhbiBleGlzdGluZyBzdGFjayBmaXJzdCwgc2luY2Ugbm9uLW5hdGl2ZVxuLy8gZXJyb3JzIGxpa2VseSBhbHJlYWR5IGNvbnRhaW4gdGhpcy5cbmZ1bmN0aW9uIGdldFN0YWNrKGUpIHtcbiAgICB2YXIgc3RhY2sgPSBlLnN0YWNrXG5cbiAgICBpZiAoIShlIGluc3RhbmNlb2YgRXJyb3IpIHx8IHN0YWNrICE9IG51bGwpIHJldHVybiBzdGFja1xuXG4gICAgdHJ5IHtcbiAgICAgICAgdGhyb3cgZVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgcmV0dXJuIGUuc3RhY2tcbiAgICB9XG59XG5cbnRyeSB7XG4gICAgQXNzZXJ0aW9uRXJyb3IgPSBuZXcgRnVuY3Rpb24oWyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLW5ldy1mdW5jXG4gICAgICAgIFwiJ3VzZSBzdHJpY3QnO1wiLFxuICAgICAgICBcImNsYXNzIEFzc2VydGlvbkVycm9yIGV4dGVuZHMgRXJyb3Ige1wiLFxuICAgICAgICBcIiAgICBjb25zdHJ1Y3RvcihtZXNzYWdlLCBleHBlY3RlZCwgYWN0dWFsKSB7XCIsXG4gICAgICAgIFwiICAgICAgICBzdXBlcihtZXNzYWdlKVwiLFxuICAgICAgICBcIiAgICAgICAgdGhpcy5leHBlY3RlZCA9IGV4cGVjdGVkXCIsXG4gICAgICAgIFwiICAgICAgICB0aGlzLmFjdHVhbCA9IGFjdHVhbFwiLFxuICAgICAgICBcIiAgICB9XCIsXG4gICAgICAgIFwiXCIsXG4gICAgICAgIFwiICAgIGdldCBuYW1lKCkge1wiLFxuICAgICAgICBcIiAgICAgICAgcmV0dXJuICdBc3NlcnRpb25FcnJvcidcIixcbiAgICAgICAgXCIgICAgfVwiLFxuICAgICAgICBcIn1cIixcbiAgICAgICAgLy8gY2hlY2sgbmF0aXZlIHN1YmNsYXNzaW5nIHN1cHBvcnRcbiAgICAgICAgXCJuZXcgQXNzZXJ0aW9uRXJyb3IoJ21lc3NhZ2UnLCAxLCAyKVwiLFxuICAgICAgICBcInJldHVybiBBc3NlcnRpb25FcnJvclwiLFxuICAgIF0uam9pbihcIlxcblwiKSkoKVxufSBjYXRjaCAoZSkge1xuICAgIEFzc2VydGlvbkVycm9yID0gdHlwZW9mIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlID09PSBcImZ1bmN0aW9uXCJcbiAgICAgICAgPyBmdW5jdGlvbiBBc3NlcnRpb25FcnJvcihtZXNzYWdlLCBleHBlY3RlZCwgYWN0dWFsKSB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2UgPSBtZXNzYWdlIHx8IFwiXCJcbiAgICAgICAgICAgIHRoaXMuZXhwZWN0ZWQgPSBleHBlY3RlZFxuICAgICAgICAgICAgdGhpcy5hY3R1YWwgPSBhY3R1YWxcbiAgICAgICAgICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIHRoaXMuY29uc3RydWN0b3IpXG4gICAgICAgIH1cbiAgICAgICAgOiBmdW5jdGlvbiBBc3NlcnRpb25FcnJvcihtZXNzYWdlLCBleHBlY3RlZCwgYWN0dWFsKSB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2UgPSBtZXNzYWdlIHx8IFwiXCJcbiAgICAgICAgICAgIHRoaXMuZXhwZWN0ZWQgPSBleHBlY3RlZFxuICAgICAgICAgICAgdGhpcy5hY3R1YWwgPSBhY3R1YWxcbiAgICAgICAgICAgIHZhciBlID0gbmV3IEVycm9yKG1lc3NhZ2UpXG5cbiAgICAgICAgICAgIGUubmFtZSA9IFwiQXNzZXJ0aW9uRXJyb3JcIlxuICAgICAgICAgICAgdGhpcy5zdGFjayA9IGdldFN0YWNrKGUpXG4gICAgICAgIH1cblxuICAgIEFzc2VydGlvbkVycm9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRXJyb3IucHJvdG90eXBlKVxuXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEFzc2VydGlvbkVycm9yLnByb3RvdHlwZSwgXCJjb25zdHJ1Y3RvclwiLCB7XG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICB2YWx1ZTogQXNzZXJ0aW9uRXJyb3IsXG4gICAgfSlcblxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShBc3NlcnRpb25FcnJvci5wcm90b3R5cGUsIFwibmFtZVwiLCB7XG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICB2YWx1ZTogXCJBc3NlcnRpb25FcnJvclwiLFxuICAgIH0pXG59XG5cbmV4cG9ydHMuQXNzZXJ0aW9uRXJyb3IgPSBBc3NlcnRpb25FcnJvclxuXG4vKiBlc2xpbnQtZGlzYWJsZSBuby1zZWxmLWNvbXBhcmUgKi9cbi8vIEZvciBiZXR0ZXIgTmFOIGhhbmRsaW5nXG5leHBvcnRzLnN0cmljdElzID0gZnVuY3Rpb24gKGEsIGIpIHtcbiAgICByZXR1cm4gYSA9PT0gYiB8fCBhICE9PSBhICYmIGIgIT09IGJcbn1cblxuZXhwb3J0cy5sb29zZUlzID0gZnVuY3Rpb24gKGEsIGIpIHtcbiAgICByZXR1cm4gYSA9PSBiIHx8IGEgIT09IGEgJiYgYiAhPT0gYiAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGVxZXFlcVxufVxuXG4vKiBlc2xpbnQtZW5hYmxlIG5vLXNlbGYtY29tcGFyZSAqL1xuXG52YXIgdGVtcGxhdGVSZWdleHAgPSAvKC4/KVxceyguKz8pXFx9L2dcblxuZXhwb3J0cy5lc2NhcGUgPSBmdW5jdGlvbiAoc3RyaW5nKSB7XG4gICAgaWYgKHR5cGVvZiBzdHJpbmcgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBzdHJpbmdgIG11c3QgYmUgYSBzdHJpbmdcIilcbiAgICB9XG5cbiAgICByZXR1cm4gc3RyaW5nLnJlcGxhY2UodGVtcGxhdGVSZWdleHAsIGZ1bmN0aW9uIChtLCBwcmUpIHtcbiAgICAgICAgcmV0dXJuIHByZSArIFwiXFxcXFwiICsgbS5zbGljZSgxKVxuICAgIH0pXG59XG5cbi8vIFRoaXMgZm9ybWF0cyB0aGUgYXNzZXJ0aW9uIGVycm9yIG1lc3NhZ2VzLlxuZXhwb3J0cy5mb3JtYXQgPSBmdW5jdGlvbiAobWVzc2FnZSwgYXJncywgcHJldHRpZnkpIHtcbiAgICBpZiAocHJldHRpZnkgPT0gbnVsbCkgcHJldHRpZnkgPSBpbnNwZWN0XG5cbiAgICBpZiAodHlwZW9mIG1lc3NhZ2UgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBtZXNzYWdlYCBtdXN0IGJlIGEgc3RyaW5nXCIpXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBhcmdzICE9PSBcIm9iamVjdFwiIHx8IGFyZ3MgPT09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBhcmdzYCBtdXN0IGJlIGFuIG9iamVjdFwiKVxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgcHJldHRpZnkgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYHByZXR0aWZ5YCBtdXN0IGJlIGEgZnVuY3Rpb24gaWYgcGFzc2VkXCIpXG4gICAgfVxuXG4gICAgcmV0dXJuIG1lc3NhZ2UucmVwbGFjZSh0ZW1wbGF0ZVJlZ2V4cCwgZnVuY3Rpb24gKG0sIHByZSwgcHJvcCkge1xuICAgICAgICBpZiAocHJlID09PSBcIlxcXFxcIikge1xuICAgICAgICAgICAgcmV0dXJuIG0uc2xpY2UoMSlcbiAgICAgICAgfSBlbHNlIGlmIChoYXNPd24uY2FsbChhcmdzLCBwcm9wKSkge1xuICAgICAgICAgICAgcmV0dXJuIHByZSArIHByZXR0aWZ5KGFyZ3NbcHJvcF0sIHtkZXB0aDogNX0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gcHJlICsgbVxuICAgICAgICB9XG4gICAgfSlcbn1cblxuZXhwb3J0cy5mYWlsID0gZnVuY3Rpb24gKG1lc3NhZ2UsIGFyZ3MsIHByZXR0aWZ5KSB7XG4gICAgaWYgKGFyZ3MgPT0gbnVsbCkgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKG1lc3NhZ2UpXG4gICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKFxuICAgICAgICBleHBvcnRzLmZvcm1hdChtZXNzYWdlLCBhcmdzLCBwcmV0dGlmeSksXG4gICAgICAgIGFyZ3MuZXhwZWN0ZWQsXG4gICAgICAgIGFyZ3MuYWN0dWFsKVxufVxuXG4vLyBUaGUgYmFzaWMgYXNzZXJ0LCBsaWtlIGBhc3NlcnQub2tgLCBidXQgZ2l2ZXMgeW91IGFuIG9wdGlvbmFsIG1lc3NhZ2UuXG5leHBvcnRzLmFzc2VydCA9IGZ1bmN0aW9uICh0ZXN0LCBtZXNzYWdlKSB7XG4gICAgaWYgKCF0ZXN0KSB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IobWVzc2FnZSlcbn1cbiIsIlwidXNlIHN0cmljdFwiXG5cbi8qKlxuICogQ29yZSBUREQtc3R5bGUgYXNzZXJ0aW9ucy4gVGhlc2UgYXJlIGRvbmUgYnkgYSBjb21wb3NpdGlvbiBvZiBEU0xzLCBzaW5jZVxuICogdGhlcmUgaXMgKnNvKiBtdWNoIHJlcGV0aXRpb24uIEFsc28sIHRoaXMgaXMgc3BsaXQgaW50byBzZXZlcmFsIG5hbWVzcGFjZXMgdG9cbiAqIGtlZXAgdGhlIGZpbGUgc2l6ZSBtYW5hZ2VhYmxlLlxuICovXG5cbnZhciB1dGlsID0gcmVxdWlyZShcImNsZWFuLWFzc2VydC11dGlsXCIpXG52YXIgdHlwZSA9IHJlcXVpcmUoXCIuL2xpYi90eXBlXCIpXG52YXIgZXF1YWwgPSByZXF1aXJlKFwiLi9saWIvZXF1YWxcIilcbnZhciB0aHJvd3MgPSByZXF1aXJlKFwiLi9saWIvdGhyb3dzXCIpXG52YXIgaGFzID0gcmVxdWlyZShcIi4vbGliL2hhc1wiKVxudmFyIGluY2x1ZGVzID0gcmVxdWlyZShcIi4vbGliL2luY2x1ZGVzXCIpXG52YXIgaGFzS2V5cyA9IHJlcXVpcmUoXCIuL2xpYi9oYXMta2V5c1wiKVxuXG5leHBvcnRzLkFzc2VydGlvbkVycm9yID0gdXRpbC5Bc3NlcnRpb25FcnJvclxuZXhwb3J0cy5hc3NlcnQgPSB1dGlsLmFzc2VydFxuZXhwb3J0cy5mYWlsID0gdXRpbC5mYWlsXG5cbmV4cG9ydHMub2sgPSB0eXBlLm9rXG5leHBvcnRzLm5vdE9rID0gdHlwZS5ub3RPa1xuZXhwb3J0cy5pc0Jvb2xlYW4gPSB0eXBlLmlzQm9vbGVhblxuZXhwb3J0cy5ub3RCb29sZWFuID0gdHlwZS5ub3RCb29sZWFuXG5leHBvcnRzLmlzRnVuY3Rpb24gPSB0eXBlLmlzRnVuY3Rpb25cbmV4cG9ydHMubm90RnVuY3Rpb24gPSB0eXBlLm5vdEZ1bmN0aW9uXG5leHBvcnRzLmlzTnVtYmVyID0gdHlwZS5pc051bWJlclxuZXhwb3J0cy5ub3ROdW1iZXIgPSB0eXBlLm5vdE51bWJlclxuZXhwb3J0cy5pc09iamVjdCA9IHR5cGUuaXNPYmplY3RcbmV4cG9ydHMubm90T2JqZWN0ID0gdHlwZS5ub3RPYmplY3RcbmV4cG9ydHMuaXNTdHJpbmcgPSB0eXBlLmlzU3RyaW5nXG5leHBvcnRzLm5vdFN0cmluZyA9IHR5cGUubm90U3RyaW5nXG5leHBvcnRzLmlzU3ltYm9sID0gdHlwZS5pc1N5bWJvbFxuZXhwb3J0cy5ub3RTeW1ib2wgPSB0eXBlLm5vdFN5bWJvbFxuZXhwb3J0cy5leGlzdHMgPSB0eXBlLmV4aXN0c1xuZXhwb3J0cy5ub3RFeGlzdHMgPSB0eXBlLm5vdEV4aXN0c1xuZXhwb3J0cy5pc0FycmF5ID0gdHlwZS5pc0FycmF5XG5leHBvcnRzLm5vdEFycmF5ID0gdHlwZS5ub3RBcnJheVxuZXhwb3J0cy5pcyA9IHR5cGUuaXNcbmV4cG9ydHMubm90ID0gdHlwZS5ub3RcblxuZXhwb3J0cy5lcXVhbCA9IGVxdWFsLmVxdWFsXG5leHBvcnRzLm5vdEVxdWFsID0gZXF1YWwubm90RXF1YWxcbmV4cG9ydHMuZXF1YWxMb29zZSA9IGVxdWFsLmVxdWFsTG9vc2VcbmV4cG9ydHMubm90RXF1YWxMb29zZSA9IGVxdWFsLm5vdEVxdWFsTG9vc2VcbmV4cG9ydHMuZGVlcEVxdWFsID0gZXF1YWwuZGVlcEVxdWFsXG5leHBvcnRzLm5vdERlZXBFcXVhbCA9IGVxdWFsLm5vdERlZXBFcXVhbFxuZXhwb3J0cy5tYXRjaCA9IGVxdWFsLm1hdGNoXG5leHBvcnRzLm5vdE1hdGNoID0gZXF1YWwubm90TWF0Y2hcbmV4cG9ydHMuYXRMZWFzdCA9IGVxdWFsLmF0TGVhc3RcbmV4cG9ydHMuYXRNb3N0ID0gZXF1YWwuYXRNb3N0XG5leHBvcnRzLmFib3ZlID0gZXF1YWwuYWJvdmVcbmV4cG9ydHMuYmVsb3cgPSBlcXVhbC5iZWxvd1xuZXhwb3J0cy5iZXR3ZWVuID0gZXF1YWwuYmV0d2VlblxuZXhwb3J0cy5jbG9zZVRvID0gZXF1YWwuY2xvc2VUb1xuZXhwb3J0cy5ub3RDbG9zZVRvID0gZXF1YWwubm90Q2xvc2VUb1xuXG5leHBvcnRzLnRocm93cyA9IHRocm93cy50aHJvd3NcbmV4cG9ydHMudGhyb3dzTWF0Y2ggPSB0aHJvd3MudGhyb3dzTWF0Y2hcblxuZXhwb3J0cy5oYXNPd24gPSBoYXMuaGFzT3duXG5leHBvcnRzLm5vdEhhc093biA9IGhhcy5ub3RIYXNPd25cbmV4cG9ydHMuaGFzT3duTG9vc2UgPSBoYXMuaGFzT3duTG9vc2VcbmV4cG9ydHMubm90SGFzT3duTG9vc2UgPSBoYXMubm90SGFzT3duTG9vc2VcbmV4cG9ydHMuaGFzS2V5ID0gaGFzLmhhc0tleVxuZXhwb3J0cy5ub3RIYXNLZXkgPSBoYXMubm90SGFzS2V5XG5leHBvcnRzLmhhc0tleUxvb3NlID0gaGFzLmhhc0tleUxvb3NlXG5leHBvcnRzLm5vdEhhc0tleUxvb3NlID0gaGFzLm5vdEhhc0tleUxvb3NlXG5leHBvcnRzLmhhcyA9IGhhcy5oYXNcbmV4cG9ydHMubm90SGFzID0gaGFzLm5vdEhhc1xuZXhwb3J0cy5oYXNMb29zZSA9IGhhcy5oYXNMb29zZVxuZXhwb3J0cy5ub3RIYXNMb29zZSA9IGhhcy5ub3RIYXNMb29zZVxuXG4vKipcbiAqIFRoZXJlJ3MgMiBzZXRzIG9mIDEyIHBlcm11dGF0aW9ucyBoZXJlIGZvciBgaW5jbHVkZXNgIGFuZCBgaGFzS2V5c2AsIGluc3RlYWRcbiAqIG9mIE4gc2V0cyBvZiAyICh3aGljaCB3b3VsZCBmaXQgdGhlIGBmb29gL2Bub3RGb29gIGlkaW9tIGJldHRlciksIHNvIGl0J3NcbiAqIGVhc2llciB0byBqdXN0IG1ha2UgYSBjb3VwbGUgc2VwYXJhdGUgRFNMcyBhbmQgdXNlIHRoYXQgdG8gZGVmaW5lIGV2ZXJ5dGhpbmcuXG4gKlxuICogSGVyZSdzIHRoZSB0b3AgbGV2ZWw6XG4gKlxuICogLSBzaGFsbG93XG4gKiAtIHN0cmljdCBkZWVwXG4gKiAtIHN0cnVjdHVyYWwgZGVlcFxuICpcbiAqIEFuZCB0aGUgc2Vjb25kIGxldmVsOlxuICpcbiAqIC0gaW5jbHVkZXMgYWxsL25vdCBtaXNzaW5nIHNvbWVcbiAqIC0gaW5jbHVkZXMgc29tZS9ub3QgbWlzc2luZyBhbGxcbiAqIC0gbm90IGluY2x1ZGluZyBhbGwvbWlzc2luZyBzb21lXG4gKiAtIG5vdCBpbmNsdWRpbmcgc29tZS9taXNzaW5nIGFsbFxuICpcbiAqIEhlcmUncyBhbiBleGFtcGxlIHVzaW5nIHRoZSBuYW1pbmcgc2NoZW1lIGZvciBgaGFzS2V5cypgXG4gKlxuICogICAgICAgICAgICAgICB8ICAgICBzaGFsbG93ICAgICB8ICAgIHN0cmljdCBkZWVwICAgICAgfCAgIHN0cnVjdHVyYWwgZGVlcFxuICogLS0tLS0tLS0tLS0tLS18LS0tLS0tLS0tLS0tLS0tLS18LS0tLS0tLS0tLS0tLS0tLS0tLS0tfC0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAqIGluY2x1ZGVzIGFsbCAgfCBgaGFzS2V5c2AgICAgICAgfCBgaGFzS2V5c0RlZXBgICAgICAgIHwgYGhhc0tleXNNYXRjaGBcbiAqIGluY2x1ZGVzIHNvbWUgfCBgaGFzS2V5c0FueWAgICAgfCBgaGFzS2V5c0FueURlZXBgICAgIHwgYGhhc0tleXNBbnlNYXRjaGBcbiAqIG1pc3Npbmcgc29tZSAgfCBgbm90SGFzS2V5c0FsbGAgfCBgbm90SGFzS2V5c0FsbERlZXBgIHwgYG5vdEhhc0tleXNBbGxNYXRjaGBcbiAqIG1pc3NpbmcgYWxsICAgfCBgbm90SGFzS2V5c2AgICAgfCBgbm90SGFzS2V5c0RlZXBgICAgIHwgYG5vdEhhc0tleXNNYXRjaGBcbiAqXG4gKiBOb3RlIHRoYXQgdGhlIGBoYXNLZXlzYCBzaGFsbG93IGNvbXBhcmlzb24gdmFyaWFudHMgYXJlIGFsc28gb3ZlcmxvYWRlZCB0b1xuICogY29uc3VtZSBlaXRoZXIgYW4gYXJyYXkgKGluIHdoaWNoIGl0IHNpbXBseSBjaGVja3MgYWdhaW5zdCBhIGxpc3Qgb2Yga2V5cykgb3JcbiAqIGFuIG9iamVjdCAod2hlcmUgaXQgZG9lcyBhIGZ1bGwgZGVlcCBjb21wYXJpc29uKS5cbiAqL1xuXG5leHBvcnRzLmluY2x1ZGVzID0gaW5jbHVkZXMuaW5jbHVkZXNcbmV4cG9ydHMuaW5jbHVkZXNEZWVwID0gaW5jbHVkZXMuaW5jbHVkZXNEZWVwXG5leHBvcnRzLmluY2x1ZGVzTWF0Y2ggPSBpbmNsdWRlcy5pbmNsdWRlc01hdGNoXG5leHBvcnRzLmluY2x1ZGVzQW55ID0gaW5jbHVkZXMuaW5jbHVkZXNBbnlcbmV4cG9ydHMuaW5jbHVkZXNBbnlEZWVwID0gaW5jbHVkZXMuaW5jbHVkZXNBbnlEZWVwXG5leHBvcnRzLmluY2x1ZGVzQW55TWF0Y2ggPSBpbmNsdWRlcy5pbmNsdWRlc0FueU1hdGNoXG5leHBvcnRzLm5vdEluY2x1ZGVzQWxsID0gaW5jbHVkZXMubm90SW5jbHVkZXNBbGxcbmV4cG9ydHMubm90SW5jbHVkZXNBbGxEZWVwID0gaW5jbHVkZXMubm90SW5jbHVkZXNBbGxEZWVwXG5leHBvcnRzLm5vdEluY2x1ZGVzQWxsTWF0Y2ggPSBpbmNsdWRlcy5ub3RJbmNsdWRlc0FsbE1hdGNoXG5leHBvcnRzLm5vdEluY2x1ZGVzID0gaW5jbHVkZXMubm90SW5jbHVkZXNcbmV4cG9ydHMubm90SW5jbHVkZXNEZWVwID0gaW5jbHVkZXMubm90SW5jbHVkZXNEZWVwXG5leHBvcnRzLm5vdEluY2x1ZGVzTWF0Y2ggPSBpbmNsdWRlcy5ub3RJbmNsdWRlc01hdGNoXG5cbmV4cG9ydHMuaGFzS2V5cyA9IGhhc0tleXMuaGFzS2V5c1xuZXhwb3J0cy5oYXNLZXlzRGVlcCA9IGhhc0tleXMuaGFzS2V5c0RlZXBcbmV4cG9ydHMuaGFzS2V5c01hdGNoID0gaGFzS2V5cy5oYXNLZXlzTWF0Y2hcbmV4cG9ydHMuaGFzS2V5c0FueSA9IGhhc0tleXMuaGFzS2V5c0FueVxuZXhwb3J0cy5oYXNLZXlzQW55RGVlcCA9IGhhc0tleXMuaGFzS2V5c0FueURlZXBcbmV4cG9ydHMuaGFzS2V5c0FueU1hdGNoID0gaGFzS2V5cy5oYXNLZXlzQW55TWF0Y2hcbmV4cG9ydHMubm90SGFzS2V5c0FsbCA9IGhhc0tleXMubm90SGFzS2V5c0FsbFxuZXhwb3J0cy5ub3RIYXNLZXlzQWxsRGVlcCA9IGhhc0tleXMubm90SGFzS2V5c0FsbERlZXBcbmV4cG9ydHMubm90SGFzS2V5c0FsbE1hdGNoID0gaGFzS2V5cy5ub3RIYXNLZXlzQWxsTWF0Y2hcbmV4cG9ydHMubm90SGFzS2V5cyA9IGhhc0tleXMubm90SGFzS2V5c1xuZXhwb3J0cy5ub3RIYXNLZXlzRGVlcCA9IGhhc0tleXMubm90SGFzS2V5c0RlZXBcbmV4cG9ydHMubm90SGFzS2V5c01hdGNoID0gaGFzS2V5cy5ub3RIYXNLZXlzTWF0Y2hcbiIsIlwidXNlIHN0cmljdFwiXG5cbnZhciBtYXRjaCA9IHJlcXVpcmUoXCJjbGVhbi1tYXRjaFwiKVxudmFyIHV0aWwgPSByZXF1aXJlKFwiY2xlYW4tYXNzZXJ0LXV0aWxcIilcblxuZnVuY3Rpb24gYmluYXJ5KG51bWVyaWMsIGNvbXBhcmF0b3IsIG1lc3NhZ2UpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgICAgICAgaWYgKG51bWVyaWMpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgYWN0dWFsICE9PSBcIm51bWJlclwiKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBhY3R1YWxgIG11c3QgYmUgYSBudW1iZXJcIilcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBleHBlY3RlZCAhPT0gXCJudW1iZXJcIikge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJgZXhwZWN0ZWRgIG11c3QgYmUgYSBudW1iZXJcIilcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghY29tcGFyYXRvcihhY3R1YWwsIGV4cGVjdGVkKSkge1xuICAgICAgICAgICAgdXRpbC5mYWlsKG1lc3NhZ2UsIHthY3R1YWw6IGFjdHVhbCwgZXhwZWN0ZWQ6IGV4cGVjdGVkfSlcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0cy5lcXVhbCA9IGJpbmFyeShmYWxzZSxcbiAgICBmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gdXRpbC5zdHJpY3RJcyhhLCBiKSB9LFxuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gZXF1YWwge2V4cGVjdGVkfVwiKVxuXG5leHBvcnRzLm5vdEVxdWFsID0gYmluYXJ5KGZhbHNlLFxuICAgIGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiAhdXRpbC5zdHJpY3RJcyhhLCBiKSB9LFxuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGVxdWFsIHtleHBlY3RlZH1cIilcblxuZXhwb3J0cy5lcXVhbExvb3NlID0gYmluYXJ5KGZhbHNlLFxuICAgIGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiB1dGlsLmxvb3NlSXMoYSwgYikgfSxcbiAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGxvb3NlbHkgZXF1YWwge2V4cGVjdGVkfVwiKVxuXG5leHBvcnRzLm5vdEVxdWFsTG9vc2UgPSBiaW5hcnkoZmFsc2UsXG4gICAgZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuICF1dGlsLmxvb3NlSXMoYSwgYikgfSxcbiAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBsb29zZWx5IGVxdWFsIHtleHBlY3RlZH1cIilcblxuZXhwb3J0cy5hdExlYXN0ID0gYmluYXJ5KHRydWUsXG4gICAgZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGEgPj0gYiB9LFxuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gYmUgYXQgbGVhc3Qge2V4cGVjdGVkfVwiKVxuXG5leHBvcnRzLmF0TW9zdCA9IGJpbmFyeSh0cnVlLFxuICAgIGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBhIDw9IGIgfSxcbiAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGJlIGF0IG1vc3Qge2V4cGVjdGVkfVwiKVxuXG5leHBvcnRzLmFib3ZlID0gYmluYXJ5KHRydWUsXG4gICAgZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGEgPiBiIH0sXG4gICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBiZSBhYm92ZSB7ZXhwZWN0ZWR9XCIpXG5cbmV4cG9ydHMuYmVsb3cgPSBiaW5hcnkodHJ1ZSxcbiAgICBmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYSA8IGIgfSxcbiAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGJlIGJlbG93IHtleHBlY3RlZH1cIilcblxuZXhwb3J0cy5iZXR3ZWVuID0gZnVuY3Rpb24gKGFjdHVhbCwgbG93ZXIsIHVwcGVyKSB7XG4gICAgaWYgKHR5cGVvZiBhY3R1YWwgIT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBhY3R1YWxgIG11c3QgYmUgYSBudW1iZXJcIilcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGxvd2VyICE9PSBcIm51bWJlclwiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJgbG93ZXJgIG11c3QgYmUgYSBudW1iZXJcIilcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIHVwcGVyICE9PSBcIm51bWJlclwiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJgdXBwZXJgIG11c3QgYmUgYSBudW1iZXJcIilcbiAgICB9XG5cbiAgICAvLyBUaGUgbmVnYXRpb24gaXMgdG8gYWRkcmVzcyBOYU5zIGFzIHdlbGwsIHdpdGhvdXQgd3JpdGluZyBhIHRvbiBvZiBzcGVjaWFsXG4gICAgLy8gY2FzZSBib2lsZXJwbGF0ZVxuICAgIGlmICghKGFjdHVhbCA+PSBsb3dlciAmJiBhY3R1YWwgPD0gdXBwZXIpKSB7XG4gICAgICAgIHV0aWwuZmFpbChcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGJlIGJldHdlZW4ge2xvd2VyfSBhbmQge3VwcGVyfVwiLCB7XG4gICAgICAgICAgICBhY3R1YWw6IGFjdHVhbCxcbiAgICAgICAgICAgIGxvd2VyOiBsb3dlcixcbiAgICAgICAgICAgIHVwcGVyOiB1cHBlcixcbiAgICAgICAgfSlcbiAgICB9XG59XG5cbmV4cG9ydHMuZGVlcEVxdWFsID0gYmluYXJ5KGZhbHNlLFxuICAgIGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBtYXRjaC5zdHJpY3QoYSwgYikgfSxcbiAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGRlZXBseSBlcXVhbCB7ZXhwZWN0ZWR9XCIpXG5cbmV4cG9ydHMubm90RGVlcEVxdWFsID0gYmluYXJ5KGZhbHNlLFxuICAgIGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiAhbWF0Y2guc3RyaWN0KGEsIGIpIH0sXG4gICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgZGVlcGx5IGVxdWFsIHtleHBlY3RlZH1cIilcblxuZXhwb3J0cy5tYXRjaCA9IGJpbmFyeShmYWxzZSxcbiAgICBmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gbWF0Y2gubG9vc2UoYSwgYikgfSxcbiAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG1hdGNoIHtleHBlY3RlZH1cIilcblxuZXhwb3J0cy5ub3RNYXRjaCA9IGJpbmFyeShmYWxzZSxcbiAgICBmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gIW1hdGNoLmxvb3NlKGEsIGIpIH0sXG4gICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgbWF0Y2gge2V4cGVjdGVkfVwiKVxuXG4vLyBVc2VzIGRpdmlzaW9uIHRvIGFsbG93IGZvciBhIG1vcmUgcm9idXN0IGNvbXBhcmlzb24gb2YgZmxvYXRzLiBBbHNvLCB0aGlzXG4vLyBoYW5kbGVzIG5lYXItemVybyBjb21wYXJpc29ucyBjb3JyZWN0bHksIGFzIHdlbGwgYXMgYSB6ZXJvIHRvbGVyYW5jZSAoaS5lLlxuLy8gZXhhY3QgY29tcGFyaXNvbikuXG5mdW5jdGlvbiBjbG9zZVRvKGV4cGVjdGVkLCBhY3R1YWwsIHRvbGVyYW5jZSkge1xuICAgIGlmICh0b2xlcmFuY2UgPT09IEluZmluaXR5IHx8IGFjdHVhbCA9PT0gZXhwZWN0ZWQpIHJldHVybiB0cnVlXG4gICAgaWYgKHRvbGVyYW5jZSA9PT0gMCkgcmV0dXJuIGZhbHNlXG4gICAgaWYgKGFjdHVhbCA9PT0gMCkgcmV0dXJuIE1hdGguYWJzKGV4cGVjdGVkKSA8IHRvbGVyYW5jZVxuICAgIGlmIChleHBlY3RlZCA9PT0gMCkgcmV0dXJuIE1hdGguYWJzKGFjdHVhbCkgPCB0b2xlcmFuY2VcbiAgICByZXR1cm4gTWF0aC5hYnMoZXhwZWN0ZWQgLyBhY3R1YWwgLSAxKSA8IHRvbGVyYW5jZVxufVxuXG4vLyBOb3RlOiB0aGVzZSB0d28gYWx3YXlzIGZhaWwgd2hlbiBkZWFsaW5nIHdpdGggTmFOcy5cbmV4cG9ydHMuY2xvc2VUbyA9IGZ1bmN0aW9uIChleHBlY3RlZCwgYWN0dWFsLCB0b2xlcmFuY2UpIHtcbiAgICBpZiAodHlwZW9mIGFjdHVhbCAhPT0gXCJudW1iZXJcIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYGFjdHVhbGAgbXVzdCBiZSBhIG51bWJlclwiKVxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgZXhwZWN0ZWQgIT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBleHBlY3RlZGAgbXVzdCBiZSBhIG51bWJlclwiKVxuICAgIH1cblxuICAgIGlmICh0b2xlcmFuY2UgPT0gbnVsbCkgdG9sZXJhbmNlID0gMWUtMTBcblxuICAgIGlmICh0eXBlb2YgdG9sZXJhbmNlICE9PSBcIm51bWJlclwiIHx8IHRvbGVyYW5jZSA8IDApIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICAgICAgIFwiYHRvbGVyYW5jZWAgbXVzdCBiZSBhIG5vbi1uZWdhdGl2ZSBudW1iZXIgaWYgZ2l2ZW5cIilcbiAgICB9XG5cbiAgICBpZiAoYWN0dWFsICE9PSBhY3R1YWwgfHwgZXhwZWN0ZWQgIT09IGV4cGVjdGVkIHx8IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tc2VsZi1jb21wYXJlLCBtYXgtbGVuXG4gICAgICAgICAgICAhY2xvc2VUbyhleHBlY3RlZCwgYWN0dWFsLCB0b2xlcmFuY2UpKSB7XG4gICAgICAgIHV0aWwuZmFpbChcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGJlIGNsb3NlIHRvIHtleHBlY3RlZH1cIiwge1xuICAgICAgICAgICAgYWN0dWFsOiBhY3R1YWwsXG4gICAgICAgICAgICBleHBlY3RlZDogZXhwZWN0ZWQsXG4gICAgICAgIH0pXG4gICAgfVxufVxuXG5leHBvcnRzLm5vdENsb3NlVG8gPSBmdW5jdGlvbiAoZXhwZWN0ZWQsIGFjdHVhbCwgdG9sZXJhbmNlKSB7XG4gICAgaWYgKHR5cGVvZiBhY3R1YWwgIT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBhY3R1YWxgIG11c3QgYmUgYSBudW1iZXJcIilcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGV4cGVjdGVkICE9PSBcIm51bWJlclwiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJgZXhwZWN0ZWRgIG11c3QgYmUgYSBudW1iZXJcIilcbiAgICB9XG5cbiAgICBpZiAodG9sZXJhbmNlID09IG51bGwpIHRvbGVyYW5jZSA9IDFlLTEwXG5cbiAgICBpZiAodHlwZW9mIHRvbGVyYW5jZSAhPT0gXCJudW1iZXJcIiB8fCB0b2xlcmFuY2UgPCAwKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgICAgICBcImB0b2xlcmFuY2VgIG11c3QgYmUgYSBub24tbmVnYXRpdmUgbnVtYmVyIGlmIGdpdmVuXCIpXG4gICAgfVxuXG4gICAgaWYgKGV4cGVjdGVkICE9PSBleHBlY3RlZCB8fCBhY3R1YWwgIT09IGFjdHVhbCB8fCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXNlbGYtY29tcGFyZSwgbWF4LWxlblxuICAgICAgICAgICAgY2xvc2VUbyhleHBlY3RlZCwgYWN0dWFsLCB0b2xlcmFuY2UpKSB7XG4gICAgICAgIHV0aWwuZmFpbChcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBiZSBjbG9zZSB0byB7ZXhwZWN0ZWR9XCIsIHtcbiAgICAgICAgICAgIGFjdHVhbDogYWN0dWFsLFxuICAgICAgICAgICAgZXhwZWN0ZWQ6IGV4cGVjdGVkLFxuICAgICAgICB9KVxuICAgIH1cbn1cbiIsIlwidXNlIHN0cmljdFwiXG5cbnZhciBtYXRjaCA9IHJlcXVpcmUoXCJjbGVhbi1tYXRjaFwiKVxudmFyIHV0aWwgPSByZXF1aXJlKFwiY2xlYW4tYXNzZXJ0LXV0aWxcIilcbnZhciBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5XG5cbmZ1bmN0aW9uIGhhc0tleXMoYWxsLCBvYmplY3QsIGtleXMpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHRlc3QgPSBoYXNPd24uY2FsbChvYmplY3QsIGtleXNbaV0pXG5cbiAgICAgICAgaWYgKHRlc3QgIT09IGFsbCkgcmV0dXJuICFhbGxcbiAgICB9XG5cbiAgICByZXR1cm4gYWxsXG59XG5cbmZ1bmN0aW9uIGhhc1ZhbHVlcyhmdW5jLCBhbGwsIG9iamVjdCwga2V5cykge1xuICAgIGlmIChvYmplY3QgPT09IGtleXMpIHJldHVybiB0cnVlXG4gICAgdmFyIGxpc3QgPSBPYmplY3Qua2V5cyhrZXlzKVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBrZXkgPSBsaXN0W2ldXG4gICAgICAgIHZhciB0ZXN0ID0gaGFzT3duLmNhbGwob2JqZWN0LCBrZXkpICYmIGZ1bmMoa2V5c1trZXldLCBvYmplY3Rba2V5XSlcblxuICAgICAgICBpZiAodGVzdCAhPT0gYWxsKSByZXR1cm4gdGVzdFxuICAgIH1cblxuICAgIHJldHVybiBhbGxcbn1cblxuZnVuY3Rpb24gbWFrZUhhc092ZXJsb2FkKGFsbCwgaW52ZXJ0LCBtZXNzYWdlKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChvYmplY3QsIGtleXMpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBvYmplY3QgIT09IFwib2JqZWN0XCIgfHwgb2JqZWN0ID09IG51bGwpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJgb2JqZWN0YCBtdXN0IGJlIGFuIG9iamVjdFwiKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBrZXlzICE9PSBcIm9iamVjdFwiIHx8IGtleXMgPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBrZXlzYCBtdXN0IGJlIGFuIG9iamVjdCBvciBhcnJheVwiKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoa2V5cykpIHtcbiAgICAgICAgICAgIGlmIChrZXlzLmxlbmd0aCAmJiBoYXNLZXlzKGFsbCwgb2JqZWN0LCBrZXlzKSA9PT0gaW52ZXJ0KSB7XG4gICAgICAgICAgICAgICAgdXRpbC5mYWlsKG1lc3NhZ2UsIHthY3R1YWw6IG9iamVjdCwga2V5czoga2V5c30pXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoT2JqZWN0LmtleXMoa2V5cykubGVuZ3RoKSB7XG4gICAgICAgICAgICBpZiAoaGFzVmFsdWVzKHV0aWwuc3RyaWN0SXMsIGFsbCwgb2JqZWN0LCBrZXlzKSA9PT0gaW52ZXJ0KSB7XG4gICAgICAgICAgICAgICAgdXRpbC5mYWlsKG1lc3NhZ2UsIHthY3R1YWw6IG9iamVjdCwga2V5czoga2V5c30pXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIG1ha2VIYXNLZXlzKGZ1bmMsIGFsbCwgaW52ZXJ0LCBtZXNzYWdlKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChvYmplY3QsIGtleXMpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBvYmplY3QgIT09IFwib2JqZWN0XCIgfHwgb2JqZWN0ID09IG51bGwpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJgb2JqZWN0YCBtdXN0IGJlIGFuIG9iamVjdFwiKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBrZXlzICE9PSBcIm9iamVjdFwiIHx8IGtleXMgPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBrZXlzYCBtdXN0IGJlIGFuIG9iamVjdFwiKVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gZXhjbHVzaXZlIG9yIHRvIGludmVydCB0aGUgcmVzdWx0IGlmIGBpbnZlcnRgIGlzIHRydWVcbiAgICAgICAgaWYgKE9iamVjdC5rZXlzKGtleXMpLmxlbmd0aCkge1xuICAgICAgICAgICAgaWYgKGhhc1ZhbHVlcyhmdW5jLCBhbGwsIG9iamVjdCwga2V5cykgPT09IGludmVydCkge1xuICAgICAgICAgICAgICAgIHV0aWwuZmFpbChtZXNzYWdlLCB7YWN0dWFsOiBvYmplY3QsIGtleXM6IGtleXN9KVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG4vKiBlc2xpbnQtZGlzYWJsZSBtYXgtbGVuICovXG5cbmV4cG9ydHMuaGFzS2V5cyA9IG1ha2VIYXNPdmVybG9hZCh0cnVlLCBmYWxzZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBoYXZlIGFsbCBrZXlzIGluIHtrZXlzfVwiKVxuZXhwb3J0cy5oYXNLZXlzRGVlcCA9IG1ha2VIYXNLZXlzKG1hdGNoLnN0cmljdCwgdHJ1ZSwgZmFsc2UsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gaGF2ZSBhbGwga2V5cyBpbiB7a2V5c31cIilcbmV4cG9ydHMuaGFzS2V5c01hdGNoID0gbWFrZUhhc0tleXMobWF0Y2gubG9vc2UsIHRydWUsIGZhbHNlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG1hdGNoIGFsbCBrZXlzIGluIHtrZXlzfVwiKVxuZXhwb3J0cy5oYXNLZXlzQW55ID0gbWFrZUhhc092ZXJsb2FkKGZhbHNlLCBmYWxzZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBoYXZlIGFueSBrZXkgaW4ge2tleXN9XCIpXG5leHBvcnRzLmhhc0tleXNBbnlEZWVwID0gbWFrZUhhc0tleXMobWF0Y2guc3RyaWN0LCBmYWxzZSwgZmFsc2UsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gaGF2ZSBhbnkga2V5IGluIHtrZXlzfVwiKVxuZXhwb3J0cy5oYXNLZXlzQW55TWF0Y2ggPSBtYWtlSGFzS2V5cyhtYXRjaC5sb29zZSwgZmFsc2UsIGZhbHNlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG1hdGNoIGFueSBrZXkgaW4ge2tleXN9XCIpXG5leHBvcnRzLm5vdEhhc0tleXNBbGwgPSBtYWtlSGFzT3ZlcmxvYWQodHJ1ZSwgdHJ1ZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgaGF2ZSBhbGwga2V5cyBpbiB7a2V5c31cIilcbmV4cG9ydHMubm90SGFzS2V5c0FsbERlZXAgPSBtYWtlSGFzS2V5cyhtYXRjaC5zdHJpY3QsIHRydWUsIHRydWUsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGhhdmUgYWxsIGtleXMgaW4ge2tleXN9XCIpXG5leHBvcnRzLm5vdEhhc0tleXNBbGxNYXRjaCA9IG1ha2VIYXNLZXlzKG1hdGNoLmxvb3NlLCB0cnVlLCB0cnVlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBtYXRjaCBhbGwga2V5cyBpbiB7a2V5c31cIilcbmV4cG9ydHMubm90SGFzS2V5cyA9IG1ha2VIYXNPdmVybG9hZChmYWxzZSwgdHJ1ZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgaGF2ZSBhbnkga2V5IGluIHtrZXlzfVwiKVxuZXhwb3J0cy5ub3RIYXNLZXlzRGVlcCA9IG1ha2VIYXNLZXlzKG1hdGNoLnN0cmljdCwgZmFsc2UsIHRydWUsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGhhdmUgYW55IGtleSBpbiB7a2V5c31cIilcbmV4cG9ydHMubm90SGFzS2V5c01hdGNoID0gbWFrZUhhc0tleXMobWF0Y2gubG9vc2UsIGZhbHNlLCB0cnVlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBtYXRjaCBhbnkga2V5IGluIHtrZXlzfVwiKVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxudmFyIHV0aWwgPSByZXF1aXJlKFwiY2xlYW4tYXNzZXJ0LXV0aWxcIilcbnZhciBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5XG5cbmZ1bmN0aW9uIGhhcyhfKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LWxlbiwgbWF4LXBhcmFtc1xuICAgIHJldHVybiBmdW5jdGlvbiAob2JqZWN0LCBrZXksIHZhbHVlKSB7XG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDMpIHtcbiAgICAgICAgICAgIGlmICghXy5oYXMob2JqZWN0LCBrZXkpIHx8XG4gICAgICAgICAgICAgICAgICAgICF1dGlsLnN0cmljdElzKF8uZ2V0KG9iamVjdCwga2V5KSwgdmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgdXRpbC5mYWlsKF8ubWVzc2FnZXNbMF0sIHtcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IHZhbHVlLFxuICAgICAgICAgICAgICAgICAgICBhY3R1YWw6IG9iamVjdFtrZXldLFxuICAgICAgICAgICAgICAgICAgICBrZXk6IGtleSxcbiAgICAgICAgICAgICAgICAgICAgb2JqZWN0OiBvYmplY3QsXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICghXy5oYXMob2JqZWN0LCBrZXkpKSB7XG4gICAgICAgICAgICB1dGlsLmZhaWwoXy5tZXNzYWdlc1sxXSwge1xuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiB2YWx1ZSxcbiAgICAgICAgICAgICAgICBhY3R1YWw6IG9iamVjdFtrZXldLFxuICAgICAgICAgICAgICAgIGtleToga2V5LFxuICAgICAgICAgICAgICAgIG9iamVjdDogb2JqZWN0LFxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gaGFzTG9vc2UoXykge1xuICAgIHJldHVybiBmdW5jdGlvbiAob2JqZWN0LCBrZXksIHZhbHVlKSB7XG4gICAgICAgIGlmICghXy5oYXMob2JqZWN0LCBrZXkpIHx8ICF1dGlsLmxvb3NlSXMoXy5nZXQob2JqZWN0LCBrZXkpLCB2YWx1ZSkpIHtcbiAgICAgICAgICAgIHV0aWwuZmFpbChfLm1lc3NhZ2VzWzBdLCB7XG4gICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IHZhbHVlLFxuICAgICAgICAgICAgICAgIGFjdHVhbDogb2JqZWN0W2tleV0sXG4gICAgICAgICAgICAgICAga2V5OiBrZXksXG4gICAgICAgICAgICAgICAgb2JqZWN0OiBvYmplY3QsXG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBub3RIYXMoXykgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1sZW4sIG1heC1wYXJhbXNcbiAgICByZXR1cm4gZnVuY3Rpb24gKG9iamVjdCwga2V5LCB2YWx1ZSkge1xuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSAzKSB7XG4gICAgICAgICAgICBpZiAoXy5oYXMob2JqZWN0LCBrZXkpICYmXG4gICAgICAgICAgICAgICAgICAgIHV0aWwuc3RyaWN0SXMoXy5nZXQob2JqZWN0LCBrZXkpLCB2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICB1dGlsLmZhaWwoXy5tZXNzYWdlc1syXSwge1xuICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogdmFsdWUsXG4gICAgICAgICAgICAgICAgICAgIGFjdHVhbDogb2JqZWN0W2tleV0sXG4gICAgICAgICAgICAgICAgICAgIGtleToga2V5LFxuICAgICAgICAgICAgICAgICAgICBvYmplY3Q6IG9iamVjdCxcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKF8uaGFzKG9iamVjdCwga2V5KSkge1xuICAgICAgICAgICAgdXRpbC5mYWlsKF8ubWVzc2FnZXNbM10sIHtcbiAgICAgICAgICAgICAgICBleHBlY3RlZDogdmFsdWUsXG4gICAgICAgICAgICAgICAgYWN0dWFsOiBvYmplY3Rba2V5XSxcbiAgICAgICAgICAgICAgICBrZXk6IGtleSxcbiAgICAgICAgICAgICAgICBvYmplY3Q6IG9iamVjdCxcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIG5vdEhhc0xvb3NlKF8pIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtbGVuLCBtYXgtcGFyYW1zXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChvYmplY3QsIGtleSwgdmFsdWUpIHtcbiAgICAgICAgaWYgKF8uaGFzKG9iamVjdCwga2V5KSAmJiB1dGlsLmxvb3NlSXMoXy5nZXQob2JqZWN0LCBrZXkpLCB2YWx1ZSkpIHtcbiAgICAgICAgICAgIHV0aWwuZmFpbChfLm1lc3NhZ2VzWzJdLCB7XG4gICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IHZhbHVlLFxuICAgICAgICAgICAgICAgIGFjdHVhbDogb2JqZWN0W2tleV0sXG4gICAgICAgICAgICAgICAga2V5OiBrZXksXG4gICAgICAgICAgICAgICAgb2JqZWN0OiBvYmplY3QsXG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBoYXNPd25LZXkob2JqZWN0LCBrZXkpIHsgcmV0dXJuIGhhc093bi5jYWxsKG9iamVjdCwga2V5KSB9XG5mdW5jdGlvbiBoYXNJbktleShvYmplY3QsIGtleSkgeyByZXR1cm4ga2V5IGluIG9iamVjdCB9XG5mdW5jdGlvbiBoYXNJbkNvbGwob2JqZWN0LCBrZXkpIHsgcmV0dXJuIG9iamVjdC5oYXMoa2V5KSB9XG5mdW5jdGlvbiBoYXNPYmplY3RHZXQob2JqZWN0LCBrZXkpIHsgcmV0dXJuIG9iamVjdFtrZXldIH1cbmZ1bmN0aW9uIGhhc0NvbGxHZXQob2JqZWN0LCBrZXkpIHsgcmV0dXJuIG9iamVjdC5nZXQoa2V5KSB9XG5cbmZ1bmN0aW9uIGNyZWF0ZUhhcyhoYXMsIGdldCwgbWVzc2FnZXMpIHtcbiAgICByZXR1cm4ge2hhczogaGFzLCBnZXQ6IGdldCwgbWVzc2FnZXM6IG1lc3NhZ2VzfVxufVxuXG52YXIgaGFzT3duTWV0aG9kcyA9IGNyZWF0ZUhhcyhoYXNPd25LZXksIGhhc09iamVjdEdldCwgW1xuICAgIFwiRXhwZWN0ZWQge29iamVjdH0gdG8gaGF2ZSBvd24ga2V5IHtrZXl9IGVxdWFsIHRvIHtleHBlY3RlZH0sIGJ1dCBmb3VuZCB7YWN0dWFsfVwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1sZW5cbiAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGhhdmUgb3duIGtleSB7ZXhwZWN0ZWR9XCIsXG4gICAgXCJFeHBlY3RlZCB7b2JqZWN0fSB0byBub3QgaGF2ZSBvd24ga2V5IHtrZXl9IGVxdWFsIHRvIHthY3R1YWx9XCIsXG4gICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgaGF2ZSBvd24ga2V5IHtleHBlY3RlZH1cIixcbl0pXG5cbnZhciBoYXNLZXlNZXRob2RzID0gY3JlYXRlSGFzKGhhc0luS2V5LCBoYXNPYmplY3RHZXQsIFtcbiAgICBcIkV4cGVjdGVkIHtvYmplY3R9IHRvIGhhdmUga2V5IHtrZXl9IGVxdWFsIHRvIHtleHBlY3RlZH0sIGJ1dCBmb3VuZCB7YWN0dWFsfVwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1sZW5cbiAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGhhdmUga2V5IHtleHBlY3RlZH1cIixcbiAgICBcIkV4cGVjdGVkIHtvYmplY3R9IHRvIG5vdCBoYXZlIGtleSB7a2V5fSBlcXVhbCB0byB7YWN0dWFsfVwiLFxuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGhhdmUga2V5IHtleHBlY3RlZH1cIixcbl0pXG5cbnZhciBoYXNNZXRob2RzID0gY3JlYXRlSGFzKGhhc0luQ29sbCwgaGFzQ29sbEdldCwgW1xuICAgIFwiRXhwZWN0ZWQge29iamVjdH0gdG8gaGF2ZSBrZXkge2tleX0gZXF1YWwgdG8ge2V4cGVjdGVkfSwgYnV0IGZvdW5kIHthY3R1YWx9XCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LWxlblxuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gaGF2ZSBrZXkge2V4cGVjdGVkfVwiLFxuICAgIFwiRXhwZWN0ZWQge29iamVjdH0gdG8gbm90IGhhdmUga2V5IHtrZXl9IGVxdWFsIHRvIHthY3R1YWx9XCIsXG4gICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgaGF2ZSBrZXkge2V4cGVjdGVkfVwiLFxuXSlcblxuZXhwb3J0cy5oYXNPd24gPSBoYXMoaGFzT3duTWV0aG9kcylcbmV4cG9ydHMubm90SGFzT3duID0gbm90SGFzKGhhc093bk1ldGhvZHMpXG5leHBvcnRzLmhhc093bkxvb3NlID0gaGFzTG9vc2UoaGFzT3duTWV0aG9kcylcbmV4cG9ydHMubm90SGFzT3duTG9vc2UgPSBub3RIYXNMb29zZShoYXNPd25NZXRob2RzKVxuXG5leHBvcnRzLmhhc0tleSA9IGhhcyhoYXNLZXlNZXRob2RzKVxuZXhwb3J0cy5ub3RIYXNLZXkgPSBub3RIYXMoaGFzS2V5TWV0aG9kcylcbmV4cG9ydHMuaGFzS2V5TG9vc2UgPSBoYXNMb29zZShoYXNLZXlNZXRob2RzKVxuZXhwb3J0cy5ub3RIYXNLZXlMb29zZSA9IG5vdEhhc0xvb3NlKGhhc0tleU1ldGhvZHMpXG5cbmV4cG9ydHMuaGFzID0gaGFzKGhhc01ldGhvZHMpXG5leHBvcnRzLm5vdEhhcyA9IG5vdEhhcyhoYXNNZXRob2RzKVxuZXhwb3J0cy5oYXNMb29zZSA9IGhhc0xvb3NlKGhhc01ldGhvZHMpXG5leHBvcnRzLm5vdEhhc0xvb3NlID0gbm90SGFzTG9vc2UoaGFzTWV0aG9kcylcbiIsIlwidXNlIHN0cmljdFwiXG5cbnZhciBtYXRjaCA9IHJlcXVpcmUoXCJjbGVhbi1tYXRjaFwiKVxudmFyIHV0aWwgPSByZXF1aXJlKFwiY2xlYW4tYXNzZXJ0LXV0aWxcIilcblxuZnVuY3Rpb24gaW5jbHVkZXMoZnVuYywgYWxsLCBhcnJheSwgdmFsdWVzKSB7XG4gICAgLy8gQ2hlYXAgY2FzZXMgZmlyc3RcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkoYXJyYXkpKSByZXR1cm4gZmFsc2VcbiAgICBpZiAoYXJyYXkgPT09IHZhbHVlcykgcmV0dXJuIHRydWVcbiAgICBpZiAoYWxsICYmIGFycmF5Lmxlbmd0aCA8IHZhbHVlcy5sZW5ndGgpIHJldHVybiBmYWxzZVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB2YWx1ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHZhbHVlID0gdmFsdWVzW2ldXG4gICAgICAgIHZhciB0ZXN0ID0gZmFsc2VcblxuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGFycmF5Lmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICBpZiAoZnVuYyh2YWx1ZSwgYXJyYXlbal0pKSB7XG4gICAgICAgICAgICAgICAgdGVzdCA9IHRydWVcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRlc3QgIT09IGFsbCkgcmV0dXJuIHRlc3RcbiAgICB9XG5cbiAgICByZXR1cm4gYWxsXG59XG5cbmZ1bmN0aW9uIGRlZmluZUluY2x1ZGVzKGZ1bmMsIGFsbCwgaW52ZXJ0LCBtZXNzYWdlKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChhcnJheSwgdmFsdWVzKSB7XG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheShhcnJheSkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJgYXJyYXlgIG11c3QgYmUgYW4gYXJyYXlcIilcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheSh2YWx1ZXMpKSB2YWx1ZXMgPSBbdmFsdWVzXVxuXG4gICAgICAgIGlmICh2YWx1ZXMubGVuZ3RoICYmIGluY2x1ZGVzKGZ1bmMsIGFsbCwgYXJyYXksIHZhbHVlcykgPT09IGludmVydCkge1xuICAgICAgICAgICAgdXRpbC5mYWlsKG1lc3NhZ2UsIHthY3R1YWw6IGFycmF5LCB2YWx1ZXM6IHZhbHVlc30pXG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8qIGVzbGludC1kaXNhYmxlIG1heC1sZW4gKi9cblxuZXhwb3J0cy5pbmNsdWRlcyA9IGRlZmluZUluY2x1ZGVzKHV0aWwuc3RyaWN0SXMsIHRydWUsIGZhbHNlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGhhdmUgYWxsIHZhbHVlcyBpbiB7dmFsdWVzfVwiKVxuZXhwb3J0cy5pbmNsdWRlc0RlZXAgPSBkZWZpbmVJbmNsdWRlcyhtYXRjaC5zdHJpY3QsIHRydWUsIGZhbHNlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG1hdGNoIGFsbCB2YWx1ZXMgaW4ge3ZhbHVlc31cIilcbmV4cG9ydHMuaW5jbHVkZXNNYXRjaCA9IGRlZmluZUluY2x1ZGVzKG1hdGNoLmxvb3NlLCB0cnVlLCBmYWxzZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBtYXRjaCBhbGwgdmFsdWVzIGluIHt2YWx1ZXN9XCIpXG5leHBvcnRzLmluY2x1ZGVzQW55ID0gZGVmaW5lSW5jbHVkZXModXRpbC5zdHJpY3RJcywgZmFsc2UsIGZhbHNlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGhhdmUgYW55IHZhbHVlIGluIHt2YWx1ZXN9XCIpXG5leHBvcnRzLmluY2x1ZGVzQW55RGVlcCA9IGRlZmluZUluY2x1ZGVzKG1hdGNoLnN0cmljdCwgZmFsc2UsIGZhbHNlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG1hdGNoIGFueSB2YWx1ZSBpbiB7dmFsdWVzfVwiKVxuZXhwb3J0cy5pbmNsdWRlc0FueU1hdGNoID0gZGVmaW5lSW5jbHVkZXMobWF0Y2gubG9vc2UsIGZhbHNlLCBmYWxzZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBtYXRjaCBhbnkgdmFsdWUgaW4ge3ZhbHVlc31cIilcbmV4cG9ydHMubm90SW5jbHVkZXNBbGwgPSBkZWZpbmVJbmNsdWRlcyh1dGlsLnN0cmljdElzLCB0cnVlLCB0cnVlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBoYXZlIGFsbCB2YWx1ZXMgaW4ge3ZhbHVlc31cIilcbmV4cG9ydHMubm90SW5jbHVkZXNBbGxEZWVwID0gZGVmaW5lSW5jbHVkZXMobWF0Y2guc3RyaWN0LCB0cnVlLCB0cnVlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBtYXRjaCBhbGwgdmFsdWVzIGluIHt2YWx1ZXN9XCIpXG5leHBvcnRzLm5vdEluY2x1ZGVzQWxsTWF0Y2ggPSBkZWZpbmVJbmNsdWRlcyhtYXRjaC5sb29zZSwgdHJ1ZSwgdHJ1ZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgbWF0Y2ggYWxsIHZhbHVlcyBpbiB7dmFsdWVzfVwiKVxuZXhwb3J0cy5ub3RJbmNsdWRlcyA9IGRlZmluZUluY2x1ZGVzKHV0aWwuc3RyaWN0SXMsIGZhbHNlLCB0cnVlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBoYXZlIGFueSB2YWx1ZSBpbiB7dmFsdWVzfVwiKVxuZXhwb3J0cy5ub3RJbmNsdWRlc0RlZXAgPSBkZWZpbmVJbmNsdWRlcyhtYXRjaC5zdHJpY3QsIGZhbHNlLCB0cnVlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBtYXRjaCBhbnkgdmFsdWUgaW4ge3ZhbHVlc31cIilcbmV4cG9ydHMubm90SW5jbHVkZXNNYXRjaCA9IGRlZmluZUluY2x1ZGVzKG1hdGNoLmxvb3NlLCBmYWxzZSwgdHJ1ZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgbWF0Y2ggYW55IHZhbHVlIGluIHt2YWx1ZXN9XCIpXG4iLCJcInVzZSBzdHJpY3RcIlxuXG52YXIgdXRpbCA9IHJlcXVpcmUoXCJjbGVhbi1hc3NlcnQtdXRpbFwiKVxuXG5mdW5jdGlvbiBnZXROYW1lKGZ1bmMpIHtcbiAgICB2YXIgbmFtZSA9IGZ1bmMubmFtZVxuXG4gICAgaWYgKG5hbWUgPT0gbnVsbCkgbmFtZSA9IGZ1bmMuZGlzcGxheU5hbWVcbiAgICBpZiAobmFtZSkgcmV0dXJuIHV0aWwuZXNjYXBlKG5hbWUpXG4gICAgcmV0dXJuIFwiPGFub255bW91cz5cIlxufVxuXG5leHBvcnRzLnRocm93cyA9IGZ1bmN0aW9uIChUeXBlLCBjYWxsYmFjaykge1xuICAgIGlmIChjYWxsYmFjayA9PSBudWxsKSB7XG4gICAgICAgIGNhbGxiYWNrID0gVHlwZVxuICAgICAgICBUeXBlID0gbnVsbFxuICAgIH1cblxuICAgIGlmIChUeXBlICE9IG51bGwgJiYgdHlwZW9mIFR5cGUgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYFR5cGVgIG11c3QgYmUgYSBmdW5jdGlvbiBpZiBwYXNzZWRcIilcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBjYWxsYmFja2AgbXVzdCBiZSBhIGZ1bmN0aW9uXCIpXG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgICAgY2FsbGJhY2soKSAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGNhbGxiYWNrLXJldHVyblxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgaWYgKFR5cGUgIT0gbnVsbCAmJiAhKGUgaW5zdGFuY2VvZiBUeXBlKSkge1xuICAgICAgICAgICAgdXRpbC5mYWlsKFxuICAgICAgICAgICAgICAgIFwiRXhwZWN0ZWQgY2FsbGJhY2sgdG8gdGhyb3cgYW4gaW5zdGFuY2Ugb2YgXCIgKyBnZXROYW1lKFR5cGUpICtcbiAgICAgICAgICAgICAgICBcIiwgYnV0IGZvdW5kIHthY3R1YWx9XCIsXG4gICAgICAgICAgICAgICAge2FjdHVhbDogZX0pXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgdGhyb3cgbmV3IHV0aWwuQXNzZXJ0aW9uRXJyb3IoXCJFeHBlY3RlZCBjYWxsYmFjayB0byB0aHJvd1wiKVxufVxuXG5mdW5jdGlvbiB0aHJvd3NNYXRjaFRlc3QobWF0Y2hlciwgZSkge1xuICAgIGlmICh0eXBlb2YgbWF0Y2hlciA9PT0gXCJzdHJpbmdcIikgcmV0dXJuIGUubWVzc2FnZSA9PT0gbWF0Y2hlclxuICAgIGlmICh0eXBlb2YgbWF0Y2hlciA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4gISFtYXRjaGVyKGUpXG4gICAgaWYgKG1hdGNoZXIgaW5zdGFuY2VvZiBSZWdFeHApIHJldHVybiAhIW1hdGNoZXIudGVzdChlLm1lc3NhZ2UpXG5cbiAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKG1hdGNoZXIpXG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGtleSA9IGtleXNbaV1cblxuICAgICAgICBpZiAoIShrZXkgaW4gZSkgfHwgIXV0aWwuc3RyaWN0SXMobWF0Y2hlcltrZXldLCBlW2tleV0pKSByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZVxufVxuXG5mdW5jdGlvbiBpc1BsYWluT2JqZWN0KG9iamVjdCkge1xuICAgIHJldHVybiBvYmplY3QgPT0gbnVsbCB8fCBPYmplY3QuZ2V0UHJvdG90eXBlT2Yob2JqZWN0KSA9PT0gT2JqZWN0LnByb3RvdHlwZVxufVxuXG5leHBvcnRzLnRocm93c01hdGNoID0gZnVuY3Rpb24gKG1hdGNoZXIsIGNhbGxiYWNrKSB7XG4gICAgaWYgKHR5cGVvZiBtYXRjaGVyICE9PSBcInN0cmluZ1wiICYmXG4gICAgICAgICAgICB0eXBlb2YgbWF0Y2hlciAhPT0gXCJmdW5jdGlvblwiICYmXG4gICAgICAgICAgICAhKG1hdGNoZXIgaW5zdGFuY2VvZiBSZWdFeHApICYmXG4gICAgICAgICAgICAhaXNQbGFpbk9iamVjdChtYXRjaGVyKSkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICAgICAgXCJgbWF0Y2hlcmAgbXVzdCBiZSBhIHN0cmluZywgZnVuY3Rpb24sIFJlZ0V4cCwgb3Igb2JqZWN0XCIpXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJgY2FsbGJhY2tgIG11c3QgYmUgYSBmdW5jdGlvblwiKVxuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICAgIGNhbGxiYWNrKCkgLy8gZXNsaW50LWRpc2FibGUtbGluZSBjYWxsYmFjay1yZXR1cm5cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGlmICghdGhyb3dzTWF0Y2hUZXN0KG1hdGNoZXIsIGUpKSB7XG4gICAgICAgICAgICB1dGlsLmZhaWwoXG4gICAgICAgICAgICAgICAgXCJFeHBlY3RlZCBjYWxsYmFjayB0byAgdGhyb3cgYW4gZXJyb3IgdGhhdCBtYXRjaGVzIFwiICtcbiAgICAgICAgICAgICAgICBcIntleHBlY3RlZH0sIGJ1dCBmb3VuZCB7YWN0dWFsfVwiLFxuICAgICAgICAgICAgICAgIHtleHBlY3RlZDogbWF0Y2hlciwgYWN0dWFsOiBlfSlcbiAgICAgICAgfVxuICAgICAgICByZXR1cm5cbiAgICB9XG5cbiAgICB0aHJvdyBuZXcgdXRpbC5Bc3NlcnRpb25FcnJvcihcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIHRocm93LlwiKVxufVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxudmFyIHV0aWwgPSByZXF1aXJlKFwiY2xlYW4tYXNzZXJ0LXV0aWxcIilcblxuZXhwb3J0cy5vayA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKCF4KSB1dGlsLmZhaWwoXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBiZSB0cnV0aHlcIiwge2FjdHVhbDogeH0pXG59XG5cbmV4cG9ydHMubm90T2sgPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh4KSB1dGlsLmZhaWwoXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBiZSBmYWxzeVwiLCB7YWN0dWFsOiB4fSlcbn1cblxuZXhwb3J0cy5pc0Jvb2xlYW4gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh0eXBlb2YgeCAhPT0gXCJib29sZWFuXCIpIHtcbiAgICAgICAgdXRpbC5mYWlsKFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gYmUgYSBib29sZWFuXCIsIHthY3R1YWw6IHh9KVxuICAgIH1cbn1cblxuZXhwb3J0cy5ub3RCb29sZWFuID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAodHlwZW9mIHggPT09IFwiYm9vbGVhblwiKSB7XG4gICAgICAgIHV0aWwuZmFpbChcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBiZSBhIGJvb2xlYW5cIiwge2FjdHVhbDogeH0pXG4gICAgfVxufVxuXG5leHBvcnRzLmlzRnVuY3Rpb24gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh0eXBlb2YgeCAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHV0aWwuZmFpbChcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGJlIGEgZnVuY3Rpb25cIiwge2FjdHVhbDogeH0pXG4gICAgfVxufVxuXG5leHBvcnRzLm5vdEZ1bmN0aW9uID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAodHlwZW9mIHggPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB1dGlsLmZhaWwoXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgYmUgYSBmdW5jdGlvblwiLCB7YWN0dWFsOiB4fSlcbiAgICB9XG59XG5cbmV4cG9ydHMuaXNOdW1iZXIgPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh0eXBlb2YgeCAhPT0gXCJudW1iZXJcIikge1xuICAgICAgICB1dGlsLmZhaWwoXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBiZSBhIG51bWJlclwiLCB7YWN0dWFsOiB4fSlcbiAgICB9XG59XG5cbmV4cG9ydHMubm90TnVtYmVyID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAodHlwZW9mIHggPT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgdXRpbC5mYWlsKFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGJlIGEgbnVtYmVyXCIsIHthY3R1YWw6IHh9KVxuICAgIH1cbn1cblxuZXhwb3J0cy5pc09iamVjdCA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHR5cGVvZiB4ICE9PSBcIm9iamVjdFwiIHx8IHggPT0gbnVsbCkge1xuICAgICAgICB1dGlsLmZhaWwoXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBiZSBhbiBvYmplY3RcIiwge2FjdHVhbDogeH0pXG4gICAgfVxufVxuXG5leHBvcnRzLm5vdE9iamVjdCA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHR5cGVvZiB4ID09PSBcIm9iamVjdFwiICYmIHggIT0gbnVsbCkge1xuICAgICAgICB1dGlsLmZhaWwoXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgYmUgYW4gb2JqZWN0XCIsIHthY3R1YWw6IHh9KVxuICAgIH1cbn1cblxuZXhwb3J0cy5pc1N0cmluZyA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHR5cGVvZiB4ICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIHV0aWwuZmFpbChcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGJlIGEgc3RyaW5nXCIsIHthY3R1YWw6IHh9KVxuICAgIH1cbn1cblxuZXhwb3J0cy5ub3RTdHJpbmcgPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh0eXBlb2YgeCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICB1dGlsLmZhaWwoXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgYmUgYSBzdHJpbmdcIiwge2FjdHVhbDogeH0pXG4gICAgfVxufVxuXG5leHBvcnRzLmlzU3ltYm9sID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAodHlwZW9mIHggIT09IFwic3ltYm9sXCIpIHtcbiAgICAgICAgdXRpbC5mYWlsKFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gYmUgYSBzeW1ib2xcIiwge2FjdHVhbDogeH0pXG4gICAgfVxufVxuXG5leHBvcnRzLm5vdFN5bWJvbCA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHR5cGVvZiB4ID09PSBcInN5bWJvbFwiKSB7XG4gICAgICAgIHV0aWwuZmFpbChcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBiZSBhIHN5bWJvbFwiLCB7YWN0dWFsOiB4fSlcbiAgICB9XG59XG5cbmV4cG9ydHMuZXhpc3RzID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAoeCA9PSBudWxsKSB7XG4gICAgICAgIHV0aWwuZmFpbChcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGV4aXN0XCIsIHthY3R1YWw6IHh9KVxuICAgIH1cbn1cblxuZXhwb3J0cy5ub3RFeGlzdHMgPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh4ICE9IG51bGwpIHtcbiAgICAgICAgdXRpbC5mYWlsKFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGV4aXN0XCIsIHthY3R1YWw6IHh9KVxuICAgIH1cbn1cblxuZXhwb3J0cy5pc0FycmF5ID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkoeCkpIHtcbiAgICAgICAgdXRpbC5mYWlsKFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gYmUgYW4gYXJyYXlcIiwge2FjdHVhbDogeH0pXG4gICAgfVxufVxuXG5leHBvcnRzLm5vdEFycmF5ID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh4KSkge1xuICAgICAgICB1dGlsLmZhaWwoXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgYmUgYW4gYXJyYXlcIiwge2FjdHVhbDogeH0pXG4gICAgfVxufVxuXG5leHBvcnRzLmlzID0gZnVuY3Rpb24gKFR5cGUsIG9iamVjdCkge1xuICAgIGlmICh0eXBlb2YgVHlwZSAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJgVHlwZWAgbXVzdCBiZSBhIGZ1bmN0aW9uXCIpXG4gICAgfVxuXG4gICAgaWYgKCEob2JqZWN0IGluc3RhbmNlb2YgVHlwZSkpIHtcbiAgICAgICAgdXRpbC5mYWlsKFwiRXhwZWN0ZWQge29iamVjdH0gdG8gYmUgYW4gaW5zdGFuY2Ugb2Yge2V4cGVjdGVkfVwiLCB7XG4gICAgICAgICAgICBleHBlY3RlZDogVHlwZSxcbiAgICAgICAgICAgIGFjdHVhbDogb2JqZWN0LmNvbnN0cnVjdG9yLFxuICAgICAgICAgICAgb2JqZWN0OiBvYmplY3QsXG4gICAgICAgIH0pXG4gICAgfVxufVxuXG5leHBvcnRzLm5vdCA9IGZ1bmN0aW9uIChUeXBlLCBvYmplY3QpIHtcbiAgICBpZiAodHlwZW9mIFR5cGUgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYFR5cGVgIG11c3QgYmUgYSBmdW5jdGlvblwiKVxuICAgIH1cblxuICAgIGlmIChvYmplY3QgaW5zdGFuY2VvZiBUeXBlKSB7XG4gICAgICAgIHV0aWwuZmFpbChcIkV4cGVjdGVkIHtvYmplY3R9IHRvIG5vdCBiZSBhbiBpbnN0YW5jZSBvZiB7ZXhwZWN0ZWR9XCIsIHtcbiAgICAgICAgICAgIGV4cGVjdGVkOiBUeXBlLFxuICAgICAgICAgICAgb2JqZWN0OiBvYmplY3QsXG4gICAgICAgIH0pXG4gICAgfVxufVxuIiwiLyoqXG4gKiBAbGljZW5zZVxuICogY2xlYW4tbWF0Y2hcbiAqXG4gKiBBIHNpbXBsZSwgZmFzdCBFUzIwMTUrIGF3YXJlIGRlZXAgbWF0Y2hpbmcgdXRpbGl0eS5cbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTYgYW5kIGxhdGVyLCBJc2lhaCBNZWFkb3dzIDxtZUBpc2lhaG1lYWRvd3MuY29tPi5cbiAqXG4gKiBQZXJtaXNzaW9uIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBhbmQvb3IgZGlzdHJpYnV0ZSB0aGlzIHNvZnR3YXJlIGZvciBhbnlcbiAqIHB1cnBvc2Ugd2l0aCBvciB3aXRob3V0IGZlZSBpcyBoZXJlYnkgZ3JhbnRlZCwgcHJvdmlkZWQgdGhhdCB0aGUgYWJvdmVcbiAqIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2UgYXBwZWFyIGluIGFsbCBjb3BpZXMuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiBBTkQgVEhFIEFVVEhPUiBESVNDTEFJTVMgQUxMIFdBUlJBTlRJRVMgV0lUSFxuICogUkVHQVJEIFRPIFRISVMgU09GVFdBUkUgSU5DTFVESU5HIEFMTCBJTVBMSUVEIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZXG4gKiBBTkQgRklUTkVTUy4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUiBCRSBMSUFCTEUgRk9SIEFOWSBTUEVDSUFMLCBESVJFQ1QsXG4gKiBJTkRJUkVDVCwgT1IgQ09OU0VRVUVOVElBTCBEQU1BR0VTIE9SIEFOWSBEQU1BR0VTIFdIQVRTT0VWRVIgUkVTVUxUSU5HIEZST01cbiAqIExPU1MgT0YgVVNFLCBEQVRBIE9SIFBST0ZJVFMsIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBORUdMSUdFTkNFIE9SXG4gKiBPVEhFUiBUT1JUSU9VUyBBQ1RJT04sIEFSSVNJTkcgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgVVNFIE9SXG4gKiBQRVJGT1JNQU5DRSBPRiBUSElTIFNPRlRXQVJFLlxuICovXG5cbi8qIGVzbGludC1kaXNhYmxlICovXG47KGZ1bmN0aW9uIChnbG9iYWwsIGZhY3RvcnkpIHtcbiAgICBpZiAodHlwZW9mIGV4cG9ydHMgPT09IFwib2JqZWN0XCIgJiYgZXhwb3J0cyAhPSBudWxsKSB7XG4gICAgICAgIGZhY3RvcnkoZ2xvYmFsLCBleHBvcnRzKVxuICAgIH0gZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIGRlZmluZShcImNsZWFuLW1hdGNoXCIsIFtcImV4cG9ydHNcIl0sIGZ1bmN0aW9uIChleHBvcnRzKSB7XG4gICAgICAgICAgICBmYWN0b3J5KGdsb2JhbCwgZXhwb3J0cylcbiAgICAgICAgfSlcbiAgICB9IGVsc2Uge1xuICAgICAgICBmYWN0b3J5KGdsb2JhbCwgZ2xvYmFsLm1hdGNoID0ge30pXG4gICAgfVxufSkodHlwZW9mIGdsb2JhbCA9PT0gXCJvYmplY3RcIiAmJiBnbG9iYWwgIT09IG51bGwgPyBnbG9iYWxcbiAgICA6IHR5cGVvZiBzZWxmID09PSBcIm9iamVjdFwiICYmIHNlbGYgIT09IG51bGwgPyBzZWxmXG4gICAgOiB0eXBlb2Ygd2luZG93ID09PSBcIm9iamVjdFwiICYmIHdpbmRvdyAhPT0gbnVsbCA/IHdpbmRvd1xuICAgIDogdGhpcyxcbmZ1bmN0aW9uIChnbG9iYWwsIGV4cG9ydHMpIHtcbiAgICAvKiBlc2xpbnQtZW5hYmxlICovXG4gICAgXCJ1c2Ugc3RyaWN0XCJcblxuICAgIC8qIGdsb2JhbCBTeW1ib2wsIFVpbnQ4QXJyYXksIERhdGFWaWV3LCBBcnJheUJ1ZmZlciwgQXJyYXlCdWZmZXJWaWV3LCBNYXAsXG4gICAgU2V0ICovXG5cbiAgICAvKipcbiAgICAgKiBEZWVwIG1hdGNoaW5nIGFsZ29yaXRobSwgd2l0aCB6ZXJvIGRlcGVuZGVuY2llcy4gTm90ZSB0aGUgZm9sbG93aW5nOlxuICAgICAqXG4gICAgICogLSBUaGlzIGlzIHJlbGF0aXZlbHkgcGVyZm9ybWFuY2UtdHVuZWQsIGFsdGhvdWdoIGl0IHByZWZlcnMgaGlnaFxuICAgICAqICAgY29ycmVjdG5lc3MuIFBhdGNoIHdpdGggY2FyZSwgc2luY2UgcGVyZm9ybWFuY2UgaXMgYSBjb25jZXJuLlxuICAgICAqIC0gVGhpcyBkb2VzIHBhY2sgYSAqbG90KiBvZiBmZWF0dXJlcywgd2hpY2ggc2hvdWxkIGV4cGxhaW4gdGhlIGxlbmd0aC5cbiAgICAgKiAtIFNvbWUgb2YgdGhlIGR1cGxpY2F0aW9uIGlzIGludGVudGlvbmFsLiBJdCdzIGdlbmVyYWxseSBjb21tZW50ZWQsIGJ1dFxuICAgICAqICAgaXQncyBtYWlubHkgZm9yIHBlcmZvcm1hbmNlLCBzaW5jZSB0aGUgZW5naW5lIG5lZWRzIGl0cyB0eXBlIGluZm8uXG4gICAgICogLSBQb2x5ZmlsbGVkIGNvcmUtanMgU3ltYm9scyBmcm9tIGNyb3NzLW9yaWdpbiBjb250ZXh0cyB3aWxsIG5ldmVyXG4gICAgICogICByZWdpc3RlciBhcyBiZWluZyBhY3R1YWwgU3ltYm9scy5cbiAgICAgKlxuICAgICAqIEFuZCBpbiBjYXNlIHlvdSdyZSB3b25kZXJpbmcgYWJvdXQgdGhlIGxvbmdlciBmdW5jdGlvbnMgYW5kIG9jY2FzaW9uYWxcbiAgICAgKiByZXBldGl0aW9uLCBpdCdzIGJlY2F1c2UgVjgncyBpbmxpbmVyIGlzbid0IGFsd2F5cyBpbnRlbGxpZ2VudCBlbm91Z2ggdG9cbiAgICAgKiBkZWFsIHdpdGggdGhlIHN1cGVyIGhpZ2hseSBwb2x5bW9ycGhpYyBkYXRhIHRoaXMgb2Z0ZW4gZGVhbHMgd2l0aCwgYW5kIEpTXG4gICAgICogZG9lc24ndCBoYXZlIGNvbXBpbGUtdGltZSBtYWNyb3MuXG4gICAgICovXG5cbiAgICB2YXIgb2JqZWN0VG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nXG4gICAgdmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHlcblxuICAgIHZhciBzdXBwb3J0c1VuaWNvZGUgPSBoYXNPd24uY2FsbChSZWdFeHAucHJvdG90eXBlLCBcInVuaWNvZGVcIilcbiAgICB2YXIgc3VwcG9ydHNTdGlja3kgPSBoYXNPd24uY2FsbChSZWdFeHAucHJvdG90eXBlLCBcInN0aWNreVwiKVxuXG4gICAgLy8gTGVnYWN5IGVuZ2luZXMgaGF2ZSBzZXZlcmFsIGlzc3VlcyB3aGVuIGl0IGNvbWVzIHRvIGB0eXBlb2ZgLlxuICAgIHZhciBpc0Z1bmN0aW9uID0gKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZnVuY3Rpb24gU2xvd0lzRnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBudWxsKSByZXR1cm4gZmFsc2VcblxuICAgICAgICAgICAgdmFyIHRhZyA9IG9iamVjdFRvU3RyaW5nLmNhbGwodmFsdWUpXG5cbiAgICAgICAgICAgIHJldHVybiB0YWcgPT09IFwiW29iamVjdCBGdW5jdGlvbl1cIiB8fFxuICAgICAgICAgICAgICAgIHRhZyA9PT0gXCJbb2JqZWN0IEdlbmVyYXRvckZ1bmN0aW9uXVwiIHx8XG4gICAgICAgICAgICAgICAgdGFnID09PSBcIltvYmplY3QgQXN5bmNGdW5jdGlvbl1cIiB8fFxuICAgICAgICAgICAgICAgIHRhZyA9PT0gXCJbb2JqZWN0IFByb3h5XVwiXG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBpc1BvaXNvbmVkKG9iamVjdCkge1xuICAgICAgICAgICAgcmV0dXJuIG9iamVjdCAhPSBudWxsICYmIHR5cGVvZiBvYmplY3QgIT09IFwiZnVuY3Rpb25cIlxuICAgICAgICB9XG5cbiAgICAgICAgLy8gSW4gU2FmYXJpIDEwLCBgdHlwZW9mIFByb3h5ID09PSBcIm9iamVjdFwiYFxuICAgICAgICBpZiAoaXNQb2lzb25lZChnbG9iYWwuUHJveHkpKSByZXR1cm4gU2xvd0lzRnVuY3Rpb25cblxuICAgICAgICAvLyBJbiBTYWZhcmkgOCwgc2V2ZXJhbCB0eXBlZCBhcnJheSBjb25zdHJ1Y3RvcnMgYXJlXG4gICAgICAgIC8vIGB0eXBlb2YgQyA9PT0gXCJvYmplY3RcImBcbiAgICAgICAgaWYgKGlzUG9pc29uZWQoZ2xvYmFsLkludDhBcnJheSkpIHJldHVybiBTbG93SXNGdW5jdGlvblxuXG4gICAgICAgIC8vIEluIG9sZCBWOCwgUmVnRXhwcyBhcmUgY2FsbGFibGVcbiAgICAgICAgaWYgKHR5cGVvZiAveC8gPT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIFNsb3dJc0Z1bmN0aW9uIC8vIGVzbGludC1kaXNhYmxlLWxpbmVcblxuICAgICAgICAvLyBMZWF2ZSB0aGlzIGZvciBub3JtYWwgdGhpbmdzLiBJdCdzIGVhc2lseSBpbmxpbmVkLlxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gaXNGdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gXCJmdW5jdGlvblwiXG4gICAgICAgIH1cbiAgICB9KSgpXG5cbiAgICAvLyBTZXQgdXAgb3VyIG93biBidWZmZXIgY2hlY2suIFdlIHNob3VsZCBhbHdheXMgYWNjZXB0IHRoZSBwb2x5ZmlsbCwgZXZlblxuICAgIC8vIGluIE5vZGUuIE5vdGUgdGhhdCBpdCB1c2VzIGBnbG9iYWwuQnVmZmVyYCB0byBhdm9pZCBpbmNsdWRpbmcgYGJ1ZmZlcmAgaW5cbiAgICAvLyB0aGUgYnVuZGxlLlxuXG4gICAgdmFyIEJ1ZmZlck5hdGl2ZSA9IDBcbiAgICB2YXIgQnVmZmVyUG9seWZpbGwgPSAxXG4gICAgdmFyIEJ1ZmZlclNhZmFyaSA9IDJcblxuICAgIHZhciBidWZmZXJTdXBwb3J0ID0gKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZnVuY3Rpb24gRmFrZUJ1ZmZlcigpIHt9XG4gICAgICAgIEZha2VCdWZmZXIuaXNCdWZmZXIgPSBmdW5jdGlvbiAoKSB7IHJldHVybiB0cnVlIH1cblxuICAgICAgICAvLyBPbmx5IFNhZmFyaSA1LTcgaGFzIGV2ZXIgaGFkIHRoaXMgaXNzdWUuXG4gICAgICAgIGlmIChuZXcgRmFrZUJ1ZmZlcigpLmNvbnN0cnVjdG9yICE9PSBGYWtlQnVmZmVyKSByZXR1cm4gQnVmZmVyU2FmYXJpXG4gICAgICAgIGlmICghaXNGdW5jdGlvbihnbG9iYWwuQnVmZmVyKSkgcmV0dXJuIEJ1ZmZlclBvbHlmaWxsXG4gICAgICAgIGlmICghaXNGdW5jdGlvbihnbG9iYWwuQnVmZmVyLmlzQnVmZmVyKSkgcmV0dXJuIEJ1ZmZlclBvbHlmaWxsXG4gICAgICAgIC8vIEF2b2lkIGdsb2JhbCBwb2x5ZmlsbHNcbiAgICAgICAgaWYgKGdsb2JhbC5CdWZmZXIuaXNCdWZmZXIobmV3IEZha2VCdWZmZXIoKSkpIHJldHVybiBCdWZmZXJQb2x5ZmlsbFxuICAgICAgICByZXR1cm4gQnVmZmVyTmF0aXZlXG4gICAgfSkoKVxuXG4gICAgdmFyIGdsb2JhbElzQnVmZmVyID0gYnVmZmVyU3VwcG9ydCA9PT0gQnVmZmVyTmF0aXZlXG4gICAgICAgID8gZ2xvYmFsLkJ1ZmZlci5pc0J1ZmZlclxuICAgICAgICA6IHVuZGVmaW5lZFxuXG4gICAgZnVuY3Rpb24gaXNCdWZmZXIob2JqZWN0KSB7XG4gICAgICAgIGlmIChidWZmZXJTdXBwb3J0ID09PSBCdWZmZXJOYXRpdmUgJiYgZ2xvYmFsSXNCdWZmZXIob2JqZWN0KSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgfSBlbHNlIGlmIChidWZmZXJTdXBwb3J0ID09PSBCdWZmZXJTYWZhcmkgJiYgb2JqZWN0Ll9pc0J1ZmZlcikge1xuICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBCID0gb2JqZWN0LmNvbnN0cnVjdG9yXG5cbiAgICAgICAgaWYgKCFpc0Z1bmN0aW9uKEIpKSByZXR1cm4gZmFsc2VcbiAgICAgICAgaWYgKCFpc0Z1bmN0aW9uKEIuaXNCdWZmZXIpKSByZXR1cm4gZmFsc2VcbiAgICAgICAgcmV0dXJuIEIuaXNCdWZmZXIob2JqZWN0KVxuICAgIH1cblxuICAgIC8vIGNvcmUtanMnIHN5bWJvbHMgYXJlIG9iamVjdHMsIGFuZCBzb21lIG9sZCB2ZXJzaW9ucyBvZiBWOCBlcnJvbmVvdXNseSBoYWRcbiAgICAvLyBgdHlwZW9mIFN5bWJvbCgpID09PSBcIm9iamVjdFwiYC5cbiAgICB2YXIgc3ltYm9sc0FyZU9iamVjdHMgPSBpc0Z1bmN0aW9uKGdsb2JhbC5TeW1ib2wpICYmXG4gICAgICAgIHR5cGVvZiBTeW1ib2woKSA9PT0gXCJvYmplY3RcIlxuXG4gICAgLy8gYGNvbnRleHRgIGlzIGEgYml0IGZpZWxkLCB3aXRoIHRoZSBmb2xsb3dpbmcgYml0cy4gVGhpcyBpcyBub3QgYXMgbXVjaFxuICAgIC8vIGZvciBwZXJmb3JtYW5jZSB0aGFuIHRvIGp1c3QgcmVkdWNlIHRoZSBudW1iZXIgb2YgcGFyYW1ldGVycyBJIG5lZWQgdG8gYmVcbiAgICAvLyB0aHJvd2luZyBhcm91bmQuXG4gICAgdmFyIFN0cmljdCA9IDFcbiAgICB2YXIgSW5pdGlhbCA9IDJcbiAgICB2YXIgU2FtZVByb3RvID0gNFxuXG4gICAgZXhwb3J0cy5sb29zZSA9IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgIHJldHVybiBtYXRjaChhLCBiLCBJbml0aWFsLCB1bmRlZmluZWQsIHVuZGVmaW5lZClcbiAgICB9XG5cbiAgICBleHBvcnRzLnN0cmljdCA9IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgIHJldHVybiBtYXRjaChhLCBiLCBTdHJpY3QgfCBJbml0aWFsLCB1bmRlZmluZWQsIHVuZGVmaW5lZClcbiAgICB9XG5cbiAgICAvLyBGZWF0dXJlLXRlc3QgZGVsYXllZCBzdGFjayBhZGRpdGlvbnMgYW5kIGV4dHJhIGtleXMuIFBoYW50b21KUyBhbmQgSUVcbiAgICAvLyBib3RoIHdhaXQgdW50aWwgdGhlIGVycm9yIHdhcyBhY3R1YWxseSB0aHJvd24gZmlyc3QsIGFuZCBhc3NpZ24gdGhlbSBhc1xuICAgIC8vIG93biBwcm9wZXJ0aWVzLCB3aGljaCBpcyB1bmhlbHBmdWwgZm9yIGFzc2VydGlvbnMuIFRoaXMgcmV0dXJucyBhXG4gICAgLy8gZnVuY3Rpb24gdG8gc3BlZWQgdXAgY2FzZXMgd2hlcmUgYE9iamVjdC5rZXlzYCBpcyBzdWZmaWNpZW50IChlLmcuIGluXG4gICAgLy8gQ2hyb21lL0ZGL05vZGUpLlxuICAgIC8vXG4gICAgLy8gVGhpcyB3b3VsZG4ndCBiZSBuZWNlc3NhcnkgaWYgdGhvc2UgZW5naW5lcyB3b3VsZCBtYWtlIHRoZSBzdGFjayBhXG4gICAgLy8gZ2V0dGVyLCBhbmQgcmVjb3JkIGl0IHdoZW4gdGhlIGVycm9yIHdhcyBjcmVhdGVkLCBub3Qgd2hlbiBpdCB3YXMgdGhyb3duLlxuICAgIC8vIEl0IHNwZWNpZmljYWxseSBmaWx0ZXJzIG91dCBlcnJvcnMgYW5kIG9ubHkgY2hlY2tzIGV4aXN0aW5nIGRlc2NyaXB0b3JzLFxuICAgIC8vIGp1c3QgdG8ga2VlcCB0aGUgbWVzcyBmcm9tIGFmZmVjdGluZyBldmVyeXRoaW5nIChpdCdzIG5vdCBmdWxseSBjb3JyZWN0LFxuICAgIC8vIGJ1dCBpdCdzIG5lY2Vzc2FyeSkuXG4gICAgdmFyIHJlcXVpcmVzUHJveHkgPSAoZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdGVzdCA9IG5ldyBFcnJvcigpXG4gICAgICAgIHZhciBvbGQgPSBPYmplY3QuY3JlYXRlKG51bGwpXG5cbiAgICAgICAgT2JqZWN0LmtleXModGVzdCkuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7IG9sZFtrZXldID0gdHJ1ZSB9KVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0aHJvdyB0ZXN0XG4gICAgICAgIH0gY2F0Y2ggKF8pIHtcbiAgICAgICAgICAgIC8vIGlnbm9yZVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHRlc3QpLnNvbWUoZnVuY3Rpb24gKGtleSkgeyByZXR1cm4gIW9sZFtrZXldIH0pXG4gICAgfSkoKVxuXG4gICAgZnVuY3Rpb24gaXNJZ25vcmVkKG9iamVjdCwga2V5KSB7XG4gICAgICAgIHN3aXRjaCAoa2V5KSB7XG4gICAgICAgIGNhc2UgXCJsaW5lXCI6IGlmICh0eXBlb2Ygb2JqZWN0LmxpbmUgIT09IFwibnVtYmVyXCIpIHJldHVybiBmYWxzZTsgYnJlYWtcbiAgICAgICAgY2FzZSBcInNvdXJjZVVSTFwiOlxuICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmplY3Quc291cmNlVVJMICE9PSBcInN0cmluZ1wiKSByZXR1cm4gZmFsc2U7IGJyZWFrXG4gICAgICAgIGNhc2UgXCJzdGFja1wiOiBpZiAodHlwZW9mIG9iamVjdC5zdGFjayAhPT0gXCJzdHJpbmdcIikgcmV0dXJuIGZhbHNlOyBicmVha1xuICAgICAgICBkZWZhdWx0OiByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihvYmplY3QsIGtleSlcblxuICAgICAgICByZXR1cm4gIWRlc2MuY29uZmlndXJhYmxlICYmIGRlc2MuZW51bWVyYWJsZSAmJiAhZGVzYy53cml0YWJsZVxuICAgIH1cblxuICAgIC8vIFRoaXMgaXMgb25seSBpbnZva2VkIHdpdGggZXJyb3JzLCBzbyBpdCdzIG5vdCBnb2luZyB0byBwcmVzZW50IGFcbiAgICAvLyBzaWduaWZpY2FudCBzbG93IGRvd24uXG4gICAgZnVuY3Rpb24gZ2V0S2V5c1N0cmlwcGVkKG9iamVjdCkge1xuICAgICAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKG9iamVjdClcbiAgICAgICAgdmFyIGNvdW50ID0gMFxuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKCFpc0lnbm9yZWQob2JqZWN0LCBrZXlzW2ldKSkga2V5c1tjb3VudCsrXSA9IGtleXNbaV1cbiAgICAgICAgfVxuXG4gICAgICAgIGtleXMubGVuZ3RoID0gY291bnRcbiAgICAgICAgcmV0dXJuIGtleXNcbiAgICB9XG5cbiAgICAvLyBXYXkgZmFzdGVyLCBzaW5jZSB0eXBlZCBhcnJheSBpbmRpY2VzIGFyZSBhbHdheXMgZGVuc2UgYW5kIGNvbnRhaW5cbiAgICAvLyBudW1iZXJzLlxuXG4gICAgLy8gU2V0dXAgZm9yIGBpc0J1ZmZlck9yVmlld2AgYW5kIGBpc1ZpZXdgXG4gICAgdmFyIEFycmF5QnVmZmVyTm9uZSA9IDBcbiAgICB2YXIgQXJyYXlCdWZmZXJMZWdhY3kgPSAxXG4gICAgdmFyIEFycmF5QnVmZmVyQ3VycmVudCA9IDJcblxuICAgIHZhciBhcnJheUJ1ZmZlclN1cHBvcnQgPSAoZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIWlzRnVuY3Rpb24oZ2xvYmFsLlVpbnQ4QXJyYXkpKSByZXR1cm4gQXJyYXlCdWZmZXJOb25lXG4gICAgICAgIGlmICghaXNGdW5jdGlvbihnbG9iYWwuRGF0YVZpZXcpKSByZXR1cm4gQXJyYXlCdWZmZXJOb25lXG4gICAgICAgIGlmICghaXNGdW5jdGlvbihnbG9iYWwuQXJyYXlCdWZmZXIpKSByZXR1cm4gQXJyYXlCdWZmZXJOb25lXG4gICAgICAgIGlmIChpc0Z1bmN0aW9uKGdsb2JhbC5BcnJheUJ1ZmZlci5pc1ZpZXcpKSByZXR1cm4gQXJyYXlCdWZmZXJDdXJyZW50XG4gICAgICAgIGlmIChpc0Z1bmN0aW9uKGdsb2JhbC5BcnJheUJ1ZmZlclZpZXcpKSByZXR1cm4gQXJyYXlCdWZmZXJMZWdhY3lcbiAgICAgICAgcmV0dXJuIEFycmF5QnVmZmVyTm9uZVxuICAgIH0pKClcblxuICAgIC8vIElmIHR5cGVkIGFycmF5cyBhcmVuJ3Qgc3VwcG9ydGVkICh0aGV5IHdlcmVuJ3QgdGVjaG5pY2FsbHkgcGFydCBvZlxuICAgIC8vIEVTNSwgYnV0IG1hbnkgZW5naW5lcyBpbXBsZW1lbnRlZCBLaHJvbm9zJyBzcGVjIGJlZm9yZSBFUzYpLCB0aGVuXG4gICAgLy8ganVzdCBmYWxsIGJhY2sgdG8gZ2VuZXJpYyBidWZmZXIgZGV0ZWN0aW9uLlxuXG4gICAgZnVuY3Rpb24gZmxvYXRJcyhhLCBiKSB7XG4gICAgICAgIC8vIFNvIE5hTnMgYXJlIGNvbnNpZGVyZWQgZXF1YWwuXG4gICAgICAgIHJldHVybiBhID09PSBiIHx8IGEgIT09IGEgJiYgYiAhPT0gYiAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXNlbGYtY29tcGFyZSwgbWF4LWxlblxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1hdGNoVmlldyhhLCBiKSB7XG4gICAgICAgIHZhciBjb3VudCA9IGEubGVuZ3RoXG5cbiAgICAgICAgaWYgKGNvdW50ICE9PSBiLmxlbmd0aCkgcmV0dXJuIGZhbHNlXG5cbiAgICAgICAgd2hpbGUgKGNvdW50KSB7XG4gICAgICAgICAgICBjb3VudC0tXG4gICAgICAgICAgICBpZiAoIWZsb2F0SXMoYVtjb3VudF0sIGJbY291bnRdKSkgcmV0dXJuIGZhbHNlXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cblxuICAgIHZhciBpc1ZpZXcgPSAoZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoYXJyYXlCdWZmZXJTdXBwb3J0ID09PSBBcnJheUJ1ZmZlck5vbmUpIHJldHVybiB1bmRlZmluZWRcbiAgICAgICAgLy8gRVM2IHR5cGVkIGFycmF5c1xuICAgICAgICBpZiAoYXJyYXlCdWZmZXJTdXBwb3J0ID09PSBBcnJheUJ1ZmZlckN1cnJlbnQpIHJldHVybiBBcnJheUJ1ZmZlci5pc1ZpZXdcbiAgICAgICAgLy8gbGVnYWN5IHR5cGVkIGFycmF5c1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gaXNWaWV3KG9iamVjdCkge1xuICAgICAgICAgICAgcmV0dXJuIG9iamVjdCBpbnN0YW5jZW9mIEFycmF5QnVmZmVyVmlld1xuICAgICAgICB9XG4gICAgfSkoKVxuXG4gICAgLy8gU3VwcG9ydCBjaGVja2luZyBtYXBzIGFuZCBzZXRzIGRlZXBseS4gVGhleSBhcmUgb2JqZWN0LWxpa2UgZW5vdWdoIHRvXG4gICAgLy8gY291bnQsIGFuZCBhcmUgdXNlZnVsIGluIHRoZWlyIG93biByaWdodC4gVGhlIGNvZGUgaXMgcmF0aGVyIG1lc3N5LCBidXRcbiAgICAvLyBtYWlubHkgdG8ga2VlcCB0aGUgb3JkZXItaW5kZXBlbmRlbnQgY2hlY2tpbmcgZnJvbSBiZWNvbWluZyBpbnNhbmVseVxuICAgIC8vIHNsb3cuXG4gICAgdmFyIHN1cHBvcnRzTWFwID0gaXNGdW5jdGlvbihnbG9iYWwuTWFwKVxuICAgIHZhciBzdXBwb3J0c1NldCA9IGlzRnVuY3Rpb24oZ2xvYmFsLlNldClcblxuICAgIC8vIE9uZSBvZiB0aGUgc2V0cyBhbmQgYm90aCBtYXBzJyBrZXlzIGFyZSBjb252ZXJ0ZWQgdG8gYXJyYXlzIGZvciBmYXN0ZXJcbiAgICAvLyBoYW5kbGluZy5cbiAgICBmdW5jdGlvbiBrZXlMaXN0KG1hcCkge1xuICAgICAgICB2YXIgbGlzdCA9IG5ldyBBcnJheShtYXAuc2l6ZSlcbiAgICAgICAgdmFyIGkgPSAwXG4gICAgICAgIHZhciBpdGVyID0gbWFwLmtleXMoKVxuXG4gICAgICAgIGZvciAodmFyIG5leHQgPSBpdGVyLm5leHQoKTsgIW5leHQuZG9uZTsgbmV4dCA9IGl0ZXIubmV4dCgpKSB7XG4gICAgICAgICAgICBsaXN0W2krK10gPSBuZXh0LnZhbHVlXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbGlzdFxuICAgIH1cblxuICAgIC8vIFRoZSBwYWlyIG9mIGFycmF5cyBhcmUgYWxpZ25lZCBpbiBhIHNpbmdsZSBPKG5eMikgb3BlcmF0aW9uIChtb2QgZGVlcFxuICAgIC8vIG1hdGNoaW5nIGFuZCByb3RhdGlvbiksIGFkYXB0aW5nIHRvIE8obikgd2hlbiB0aGV5J3JlIGFscmVhZHkgYWxpZ25lZC5cbiAgICBmdW5jdGlvbiBtYXRjaEtleShjdXJyZW50LCBha2V5cywgc3RhcnQsIGVuZCwgY29udGV4dCwgbGVmdCwgcmlnaHQpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtcGFyYW1zLCBtYXgtbGVuXG4gICAgICAgIGZvciAodmFyIGkgPSBzdGFydCArIDE7IGkgPCBlbmQ7IGkrKykge1xuICAgICAgICAgICAgdmFyIGtleSA9IGFrZXlzW2ldXG5cbiAgICAgICAgICAgIGlmIChtYXRjaChjdXJyZW50LCBrZXksIGNvbnRleHQsIGxlZnQsIHJpZ2h0KSkge1xuICAgICAgICAgICAgICAgIC8vIFRPRE86IG9uY2UgZW5naW5lcyBhY3R1YWxseSBvcHRpbWl6ZSBgY29weVdpdGhpbmAsIHVzZSB0aGF0XG4gICAgICAgICAgICAgICAgLy8gaW5zdGVhZC4gSXQnbGwgYmUgbXVjaCBmYXN0ZXIgdGhhbiB0aGlzIGxvb3AuXG4gICAgICAgICAgICAgICAgd2hpbGUgKGkgPiBzdGFydCkgYWtleXNbaV0gPSBha2V5c1stLWldXG4gICAgICAgICAgICAgICAgYWtleXNbaV0gPSBrZXlcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWF0Y2hWYWx1ZXMoYSwgYiwgYWtleXMsIGJrZXlzLCBlbmQsIGNvbnRleHQsIGxlZnQsIHJpZ2h0KSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LXBhcmFtcywgbWF4LWxlblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoIW1hdGNoKGEuZ2V0KGFrZXlzW2ldKSwgYi5nZXQoYmtleXNbaV0pLFxuICAgICAgICAgICAgICAgICAgICBjb250ZXh0LCBsZWZ0LCByaWdodCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuXG4gICAgLy8gUG9zc2libHkgZXhwZW5zaXZlIG9yZGVyLWluZGVwZW5kZW50IGtleS12YWx1ZSBtYXRjaC4gRmlyc3QsIHRyeSB0byBhdm9pZFxuICAgIC8vIGl0IGJ5IGNvbnNlcnZhdGl2ZWx5IGFzc3VtaW5nIGV2ZXJ5dGhpbmcgaXMgaW4gb3JkZXIgLSBhIGNoZWFwIE8obikgaXNcbiAgICAvLyBhbHdheXMgbmljZXIgdGhhbiBhbiBleHBlbnNpdmUgTyhuXjIpLlxuICAgIGZ1bmN0aW9uIG1hdGNoTWFwKGEsIGIsIGNvbnRleHQsIGxlZnQsIHJpZ2h0KSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LXBhcmFtcywgbWF4LWxlblxuICAgICAgICB2YXIgZW5kID0gYS5zaXplXG4gICAgICAgIHZhciBha2V5cyA9IGtleUxpc3QoYSlcbiAgICAgICAgdmFyIGJrZXlzID0ga2V5TGlzdChiKVxuICAgICAgICB2YXIgaSA9IDBcblxuICAgICAgICB3aGlsZSAoaSAhPT0gZW5kICYmIG1hdGNoKGFrZXlzW2ldLCBia2V5c1tpXSwgY29udGV4dCwgbGVmdCwgcmlnaHQpKSB7XG4gICAgICAgICAgICBpKytcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpID09PSBlbmQpIHtcbiAgICAgICAgICAgIHJldHVybiBtYXRjaFZhbHVlcyhhLCBiLCBha2V5cywgYmtleXMsIGVuZCwgY29udGV4dCwgbGVmdCwgcmlnaHQpXG4gICAgICAgIH1cblxuICAgICAgICAvLyBEb24ndCBjb21wYXJlIHRoZSBzYW1lIGtleSB0d2ljZVxuICAgICAgICBpZiAoIW1hdGNoS2V5KGJrZXlzW2ldLCBha2V5cywgaSwgZW5kLCBjb250ZXh0LCBsZWZ0LCByaWdodCkpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgdGhlIGFib3ZlIGZhaWxzLCB3aGlsZSB3ZSdyZSBhdCBpdCwgbGV0J3Mgc29ydCB0aGVtIGFzIHdlIGdvLCBzb1xuICAgICAgICAvLyB0aGUga2V5IG9yZGVyIG1hdGNoZXMuXG4gICAgICAgIHdoaWxlICgrK2kgPCBlbmQpIHtcbiAgICAgICAgICAgIHZhciBrZXkgPSBia2V5c1tpXVxuXG4gICAgICAgICAgICAvLyBBZGFwdCBpZiB0aGUga2V5cyBhcmUgYWxyZWFkeSBpbiBvcmRlciwgd2hpY2ggaXMgZnJlcXVlbnRseSB0aGVcbiAgICAgICAgICAgIC8vIGNhc2UuXG4gICAgICAgICAgICBpZiAoIW1hdGNoKGtleSwgYWtleXNbaV0sIGNvbnRleHQsIGxlZnQsIHJpZ2h0KSAmJlxuICAgICAgICAgICAgICAgICAgICAhbWF0Y2hLZXkoa2V5LCBha2V5cywgaSwgZW5kLCBjb250ZXh0LCBsZWZ0LCByaWdodCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBtYXRjaFZhbHVlcyhhLCBiLCBha2V5cywgYmtleXMsIGVuZCwgY29udGV4dCwgbGVmdCwgcmlnaHQpXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaGFzQWxsSWRlbnRpY2FsKGFsaXN0LCBiKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYWxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmICghYi5oYXMoYWxpc3RbaV0pKSByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuXG4gICAgLy8gQ29tcGFyZSB0aGUgdmFsdWVzIHN0cnVjdHVyYWxseSwgYW5kIGluZGVwZW5kZW50IG9mIG9yZGVyLlxuICAgIGZ1bmN0aW9uIHNlYXJjaEZvcihhdmFsdWUsIG9iamVjdHMsIGNvbnRleHQsIGxlZnQsIHJpZ2h0KSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LXBhcmFtcywgbWF4LWxlblxuICAgICAgICBmb3IgKHZhciBqIGluIG9iamVjdHMpIHtcbiAgICAgICAgICAgIGlmIChoYXNPd24uY2FsbChvYmplY3RzLCBqKSkge1xuICAgICAgICAgICAgICAgIGlmIChtYXRjaChhdmFsdWUsIG9iamVjdHNbal0sIGNvbnRleHQsIGxlZnQsIHJpZ2h0KSkge1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgb2JqZWN0c1tqXVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGhhc1N0cnVjdHVyZSh2YWx1ZSwgY29udGV4dCkge1xuICAgICAgICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiICYmIHZhbHVlICE9PSBudWxsIHx8XG4gICAgICAgICAgICAgICAgIShjb250ZXh0ICYgU3RyaWN0KSAmJiB0eXBlb2YgdmFsdWUgPT09IFwic3ltYm9sXCJcbiAgICB9XG5cbiAgICAvLyBUaGUgc2V0IGFsZ29yaXRobSBpcyBzdHJ1Y3R1cmVkIGEgbGl0dGxlIGRpZmZlcmVudGx5LiBJdCB0YWtlcyBvbmUgb2YgdGhlXG4gICAgLy8gc2V0cyBpbnRvIGFuIGFycmF5LCBkb2VzIGEgY2hlYXAgaWRlbnRpdHkgY2hlY2ssIHRoZW4gZG9lcyB0aGUgZGVlcFxuICAgIC8vIGNoZWNrLlxuICAgIGZ1bmN0aW9uIG1hdGNoU2V0KGEsIGIsIGNvbnRleHQsIGxlZnQsIHJpZ2h0KSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LXBhcmFtcywgbWF4LWxlblxuICAgICAgICAvLyBUaGlzIGlzIHRvIHRyeSB0byBhdm9pZCBhbiBleHBlbnNpdmUgc3RydWN0dXJhbCBtYXRjaCBvbiB0aGUga2V5cy5cbiAgICAgICAgLy8gVGVzdCBmb3IgaWRlbnRpdHkgZmlyc3QuXG4gICAgICAgIHZhciBhbGlzdCA9IGtleUxpc3QoYSlcblxuICAgICAgICBpZiAoaGFzQWxsSWRlbnRpY2FsKGFsaXN0LCBiKSkgcmV0dXJuIHRydWVcblxuICAgICAgICB2YXIgaXRlciA9IGIudmFsdWVzKClcbiAgICAgICAgdmFyIGNvdW50ID0gMFxuICAgICAgICB2YXIgb2JqZWN0c1xuXG4gICAgICAgIC8vIEdhdGhlciBhbGwgdGhlIG9iamVjdHNcbiAgICAgICAgZm9yICh2YXIgbmV4dCA9IGl0ZXIubmV4dCgpOyAhbmV4dC5kb25lOyBuZXh0ID0gaXRlci5uZXh0KCkpIHtcbiAgICAgICAgICAgIHZhciBidmFsdWUgPSBuZXh0LnZhbHVlXG5cbiAgICAgICAgICAgIGlmIChoYXNTdHJ1Y3R1cmUoYnZhbHVlLCBjb250ZXh0KSkge1xuICAgICAgICAgICAgICAgIC8vIENyZWF0ZSB0aGUgb2JqZWN0cyBtYXAgbGF6aWx5LiBOb3RlIHRoYXQgdGhpcyBhbHNvIGdyYWJzXG4gICAgICAgICAgICAgICAgLy8gU3ltYm9scyB3aGVuIG5vdCBzdHJpY3RseSBtYXRjaGluZywgc2luY2UgdGhlaXIgZGVzY3JpcHRpb25cbiAgICAgICAgICAgICAgICAvLyBpcyBjb21wYXJlZC5cbiAgICAgICAgICAgICAgICBpZiAoY291bnQgPT09IDApIG9iamVjdHMgPSBPYmplY3QuY3JlYXRlKG51bGwpXG4gICAgICAgICAgICAgICAgb2JqZWN0c1tjb3VudCsrXSA9IGJ2YWx1ZVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgZXZlcnl0aGluZyBpcyBhIHByaW1pdGl2ZSwgdGhlbiBhYm9ydC5cbiAgICAgICAgaWYgKGNvdW50ID09PSAwKSByZXR1cm4gZmFsc2VcblxuICAgICAgICAvLyBJdGVyYXRlIHRoZSBvYmplY3QsIHJlbW92aW5nIGVhY2ggb25lIHJlbWFpbmluZyB3aGVuIG1hdGNoZWQgKGFuZFxuICAgICAgICAvLyBhYm9ydGluZyBpZiBub25lIGNhbiBiZSkuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xuICAgICAgICAgICAgdmFyIGF2YWx1ZSA9IGFsaXN0W2ldXG5cbiAgICAgICAgICAgIGlmIChoYXNTdHJ1Y3R1cmUoYXZhbHVlLCBjb250ZXh0KSAmJlxuICAgICAgICAgICAgICAgICAgICAhc2VhcmNoRm9yKGF2YWx1ZSwgb2JqZWN0cywgY29udGV4dCwgbGVmdCwgcmlnaHQpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1hdGNoUmVnRXhwKGEsIGIpIHtcbiAgICAgICAgcmV0dXJuIGEuc291cmNlID09PSBiLnNvdXJjZSAmJlxuICAgICAgICAgICAgYS5nbG9iYWwgPT09IGIuZ2xvYmFsICYmXG4gICAgICAgICAgICBhLmlnbm9yZUNhc2UgPT09IGIuaWdub3JlQ2FzZSAmJlxuICAgICAgICAgICAgYS5tdWx0aWxpbmUgPT09IGIubXVsdGlsaW5lICYmXG4gICAgICAgICAgICAoIXN1cHBvcnRzVW5pY29kZSB8fCBhLnVuaWNvZGUgPT09IGIudW5pY29kZSkgJiZcbiAgICAgICAgICAgICghc3VwcG9ydHNTdGlja3kgfHwgYS5zdGlja3kgPT09IGIuc3RpY2t5KVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1hdGNoUHJlcGFyZURlc2NlbmQoYSwgYiwgY29udGV4dCwgbGVmdCwgcmlnaHQpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtcGFyYW1zLCBtYXgtbGVuXG4gICAgICAgIC8vIENoZWNrIGZvciBjaXJjdWxhciByZWZlcmVuY2VzIGFmdGVyIHRoZSBmaXJzdCBsZXZlbCwgd2hlcmUgaXQnc1xuICAgICAgICAvLyByZWR1bmRhbnQuIE5vdGUgdGhhdCB0aGV5IGhhdmUgdG8gcG9pbnQgdG8gdGhlIHNhbWUgbGV2ZWwgdG8gYWN0dWFsbHlcbiAgICAgICAgLy8gYmUgY29uc2lkZXJlZCBkZWVwbHkgZXF1YWwuXG4gICAgICAgIGlmICghKGNvbnRleHQgJiBJbml0aWFsKSkge1xuICAgICAgICAgICAgdmFyIGxlZnRJbmRleCA9IGxlZnQuaW5kZXhPZihhKVxuICAgICAgICAgICAgdmFyIHJpZ2h0SW5kZXggPSByaWdodC5pbmRleE9mKGIpXG5cbiAgICAgICAgICAgIGlmIChsZWZ0SW5kZXggIT09IHJpZ2h0SW5kZXgpIHJldHVybiBmYWxzZVxuICAgICAgICAgICAgaWYgKGxlZnRJbmRleCA+PSAwKSByZXR1cm4gdHJ1ZVxuXG4gICAgICAgICAgICBsZWZ0LnB1c2goYSlcbiAgICAgICAgICAgIHJpZ2h0LnB1c2goYilcblxuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IG1hdGNoSW5uZXIoYSwgYiwgY29udGV4dCwgbGVmdCwgcmlnaHQpXG5cbiAgICAgICAgICAgIGxlZnQucG9wKClcbiAgICAgICAgICAgIHJpZ2h0LnBvcCgpXG5cbiAgICAgICAgICAgIHJldHVybiByZXN1bHRcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBtYXRjaElubmVyKGEsIGIsIGNvbnRleHQgJiB+SW5pdGlhbCwgW2FdLCBbYl0pXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtYXRjaFNhbWVQcm90byhhLCBiLCBjb250ZXh0LCBsZWZ0LCByaWdodCkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1wYXJhbXMsIG1heC1sZW5cbiAgICAgICAgaWYgKHN5bWJvbHNBcmVPYmplY3RzICYmIGEgaW5zdGFuY2VvZiBTeW1ib2wpIHtcbiAgICAgICAgICAgIHJldHVybiAhKGNvbnRleHQgJiBTdHJpY3QpICYmIGEudG9TdHJpbmcoKSA9PT0gYi50b1N0cmluZygpXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoYSBpbnN0YW5jZW9mIFJlZ0V4cCkgcmV0dXJuIG1hdGNoUmVnRXhwKGEsIGIpXG4gICAgICAgIGlmIChhIGluc3RhbmNlb2YgRGF0ZSkgcmV0dXJuIGEudmFsdWVPZigpID09PSBiLnZhbHVlT2YoKVxuICAgICAgICBpZiAoYXJyYXlCdWZmZXJTdXBwb3J0ICE9PSBBcnJheUJ1ZmZlck5vbmUpIHtcbiAgICAgICAgICAgIGlmIChhIGluc3RhbmNlb2YgRGF0YVZpZXcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbWF0Y2hWaWV3KFxuICAgICAgICAgICAgICAgICAgICBuZXcgVWludDhBcnJheShhLmJ1ZmZlciwgYS5ieXRlT2Zmc2V0LCBhLmJ5dGVMZW5ndGgpLFxuICAgICAgICAgICAgICAgICAgICBuZXcgVWludDhBcnJheShiLmJ1ZmZlciwgYi5ieXRlT2Zmc2V0LCBiLmJ5dGVMZW5ndGgpKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGEgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikge1xuICAgICAgICAgICAgICAgIHJldHVybiBtYXRjaFZpZXcobmV3IFVpbnQ4QXJyYXkoYSksIG5ldyBVaW50OEFycmF5KGIpKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlzVmlldyhhKSkgcmV0dXJuIG1hdGNoVmlldyhhLCBiKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGlzQnVmZmVyKGEpKSByZXR1cm4gbWF0Y2hWaWV3KGEsIGIpXG5cbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoYSkpIHtcbiAgICAgICAgICAgIGlmIChhLmxlbmd0aCAhPT0gYi5sZW5ndGgpIHJldHVybiBmYWxzZVxuICAgICAgICAgICAgaWYgKGEubGVuZ3RoID09PSAwKSByZXR1cm4gdHJ1ZVxuICAgICAgICB9IGVsc2UgaWYgKHN1cHBvcnRzTWFwICYmIGEgaW5zdGFuY2VvZiBNYXApIHtcbiAgICAgICAgICAgIGlmIChhLnNpemUgIT09IGIuc2l6ZSkgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgICBpZiAoYS5zaXplID09PSAwKSByZXR1cm4gdHJ1ZVxuICAgICAgICB9IGVsc2UgaWYgKHN1cHBvcnRzU2V0ICYmIGEgaW5zdGFuY2VvZiBTZXQpIHtcbiAgICAgICAgICAgIGlmIChhLnNpemUgIT09IGIuc2l6ZSkgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgICBpZiAoYS5zaXplID09PSAwKSByZXR1cm4gdHJ1ZVxuICAgICAgICB9IGVsc2UgaWYgKG9iamVjdFRvU3RyaW5nLmNhbGwoYSkgPT09IFwiW29iamVjdCBBcmd1bWVudHNdXCIpIHtcbiAgICAgICAgICAgIGlmIChvYmplY3RUb1N0cmluZy5jYWxsKGIpICE9PSBcIltvYmplY3QgQXJndW1lbnRzXVwiKSByZXR1cm4gZmFsc2VcbiAgICAgICAgICAgIGlmIChhLmxlbmd0aCAhPT0gYi5sZW5ndGgpIHJldHVybiBmYWxzZVxuICAgICAgICAgICAgaWYgKGEubGVuZ3RoID09PSAwKSByZXR1cm4gdHJ1ZVxuICAgICAgICB9IGVsc2UgaWYgKG9iamVjdFRvU3RyaW5nLmNhbGwoYikgPT09IFwiW29iamVjdCBBcmd1bWVudHNdXCIpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG1hdGNoUHJlcGFyZURlc2NlbmQoYSwgYiwgY29udGV4dCwgbGVmdCwgcmlnaHQpXG4gICAgfVxuXG4gICAgLy8gTW9zdCBzcGVjaWFsIGNhc2VzIHJlcXVpcmUgYm90aCB0eXBlcyB0byBtYXRjaCwgYW5kIGlmIG9ubHkgb25lIG9mIHRoZW1cbiAgICAvLyBhcmUsIHRoZSBvYmplY3RzIHRoZW1zZWx2ZXMgZG9uJ3QgbWF0Y2guXG4gICAgZnVuY3Rpb24gbWF0Y2hEaWZmZXJlbnRQcm90byhhLCBiLCBjb250ZXh0LCBsZWZ0LCByaWdodCkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1wYXJhbXMsIG1heC1sZW5cbiAgICAgICAgaWYgKHN5bWJvbHNBcmVPYmplY3RzKSB7XG4gICAgICAgICAgICBpZiAoYSBpbnN0YW5jZW9mIFN5bWJvbCB8fCBiIGluc3RhbmNlb2YgU3ltYm9sKSByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuICAgICAgICBpZiAoY29udGV4dCAmIFN0cmljdCkgcmV0dXJuIGZhbHNlXG4gICAgICAgIGlmIChhcnJheUJ1ZmZlclN1cHBvcnQgIT09IEFycmF5QnVmZmVyTm9uZSkge1xuICAgICAgICAgICAgaWYgKGEgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlciB8fCBiIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpc1ZpZXcoYSkgfHwgaXNWaWV3KGIpKSByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShhKSB8fCBBcnJheS5pc0FycmF5KGIpKSByZXR1cm4gZmFsc2VcbiAgICAgICAgaWYgKHN1cHBvcnRzTWFwICYmIChhIGluc3RhbmNlb2YgTWFwIHx8IGIgaW5zdGFuY2VvZiBNYXApKSByZXR1cm4gZmFsc2VcbiAgICAgICAgaWYgKHN1cHBvcnRzU2V0ICYmIChhIGluc3RhbmNlb2YgU2V0IHx8IGIgaW5zdGFuY2VvZiBTZXQpKSByZXR1cm4gZmFsc2VcbiAgICAgICAgaWYgKG9iamVjdFRvU3RyaW5nLmNhbGwoYSkgPT09IFwiW29iamVjdCBBcmd1bWVudHNdXCIpIHtcbiAgICAgICAgICAgIGlmIChvYmplY3RUb1N0cmluZy5jYWxsKGIpICE9PSBcIltvYmplY3QgQXJndW1lbnRzXVwiKSByZXR1cm4gZmFsc2VcbiAgICAgICAgICAgIGlmIChhLmxlbmd0aCAhPT0gYi5sZW5ndGgpIHJldHVybiBmYWxzZVxuICAgICAgICAgICAgaWYgKGEubGVuZ3RoID09PSAwKSByZXR1cm4gdHJ1ZVxuICAgICAgICB9XG4gICAgICAgIGlmIChvYmplY3RUb1N0cmluZy5jYWxsKGIpID09PSBcIltvYmplY3QgQXJndW1lbnRzXVwiKSByZXR1cm4gZmFsc2VcbiAgICAgICAgcmV0dXJuIG1hdGNoUHJlcGFyZURlc2NlbmQoYSwgYiwgY29udGV4dCwgbGVmdCwgcmlnaHQpXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWF0Y2goYSwgYiwgY29udGV4dCwgbGVmdCwgcmlnaHQpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtcGFyYW1zLCBtYXgtbGVuXG4gICAgICAgIGlmIChhID09PSBiKSByZXR1cm4gdHJ1ZVxuICAgICAgICAvLyBOYU5zIGFyZSBlcXVhbFxuICAgICAgICBpZiAoYSAhPT0gYSkgcmV0dXJuIGIgIT09IGIgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1zZWxmLWNvbXBhcmVcbiAgICAgICAgaWYgKGEgPT09IG51bGwgfHwgYiA9PT0gbnVsbCkgcmV0dXJuIGZhbHNlXG4gICAgICAgIGlmICh0eXBlb2YgYSA9PT0gXCJzeW1ib2xcIiAmJiB0eXBlb2YgYiA9PT0gXCJzeW1ib2xcIikge1xuICAgICAgICAgICAgcmV0dXJuICEoY29udGV4dCAmIFN0cmljdCkgJiYgYS50b1N0cmluZygpID09PSBiLnRvU3RyaW5nKClcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIGEgIT09IFwib2JqZWN0XCIgfHwgdHlwZW9mIGIgIT09IFwib2JqZWN0XCIpIHJldHVybiBmYWxzZVxuXG4gICAgICAgIC8vIFVzdWFsbHksIGJvdGggb2JqZWN0cyBoYXZlIGlkZW50aWNhbCBwcm90b3R5cGVzLCBhbmQgdGhhdCBhbGxvd3MgZm9yXG4gICAgICAgIC8vIGhhbGYgdGhlIHR5cGUgY2hlY2tpbmcuXG4gICAgICAgIGlmIChPYmplY3QuZ2V0UHJvdG90eXBlT2YoYSkgPT09IE9iamVjdC5nZXRQcm90b3R5cGVPZihiKSkge1xuICAgICAgICAgICAgcmV0dXJuIG1hdGNoU2FtZVByb3RvKGEsIGIsIGNvbnRleHQgfCBTYW1lUHJvdG8sIGxlZnQsIHJpZ2h0KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG1hdGNoRGlmZmVyZW50UHJvdG8oYSwgYiwgY29udGV4dCwgbGVmdCwgcmlnaHQpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtYXRjaEFycmF5TGlrZShhLCBiLCBjb250ZXh0LCBsZWZ0LCByaWdodCkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1wYXJhbXMsIG1heC1sZW5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoIW1hdGNoKGFbaV0sIGJbaV0sIGNvbnRleHQsIGxlZnQsIHJpZ2h0KSkgcmV0dXJuIGZhbHNlXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cblxuICAgIC8vIFBoYW50b21KUyBhbmQgU2xpbWVySlMgYm90aCBoYXZlIG15c3RlcmlvdXMgaXNzdWVzIHdoZXJlIGBFcnJvcmAgaXNcbiAgICAvLyBzb21ldGltZXMgZXJyb25lb3VzbHkgb2YgYSBkaWZmZXJlbnQgYHdpbmRvd2AsIGFuZCBpdCBzaG93cyB1cCBpbiB0aGVcbiAgICAvLyB0ZXN0cy4gVGhpcyBtZWFucyBJIGhhdmUgdG8gdXNlIGEgbXVjaCBzbG93ZXIgYWxnb3JpdGhtIHRvIGRldGVjdCBFcnJvcnMuXG4gICAgLy9cbiAgICAvLyBQaGFudG9tSlM6IGh0dHBzOi8vZ2l0aHViLmNvbS9wZXRrYWFudG9ub3YvYmx1ZWJpcmQvaXNzdWVzLzExNDZcbiAgICAvLyBTbGltZXJKUzogaHR0cHM6Ly9naXRodWIuY29tL2xhdXJlbnRqL3NsaW1lcmpzL2lzc3Vlcy80MDBcbiAgICAvL1xuICAgIC8vIChZZXMsIHRoZSBQaGFudG9tSlMgYnVnIGlzIGRldGFpbGVkIGluIHRoZSBCbHVlYmlyZCBpc3N1ZSB0cmFja2VyLilcbiAgICB2YXIgY2hlY2tDcm9zc09yaWdpbiA9IChmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmIChnbG9iYWwud2luZG93ID09IG51bGwgfHwgZ2xvYmFsLndpbmRvdy5uYXZpZ2F0b3IgPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIC9zbGltZXJqc3xwaGFudG9tanMvaS50ZXN0KGdsb2JhbC53aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudClcbiAgICB9KSgpXG5cbiAgICB2YXIgZXJyb3JTdHJpbmdUeXBlcyA9IHtcbiAgICAgICAgXCJbb2JqZWN0IEVycm9yXVwiOiB0cnVlLFxuICAgICAgICBcIltvYmplY3QgRXZhbEVycm9yXVwiOiB0cnVlLFxuICAgICAgICBcIltvYmplY3QgUmFuZ2VFcnJvcl1cIjogdHJ1ZSxcbiAgICAgICAgXCJbb2JqZWN0IFJlZmVyZW5jZUVycm9yXVwiOiB0cnVlLFxuICAgICAgICBcIltvYmplY3QgU3ludGF4RXJyb3JdXCI6IHRydWUsXG4gICAgICAgIFwiW29iamVjdCBUeXBlRXJyb3JdXCI6IHRydWUsXG4gICAgICAgIFwiW29iamVjdCBVUklFcnJvcl1cIjogdHJ1ZSxcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc1Byb3hpZWRFcnJvcihvYmplY3QpIHtcbiAgICAgICAgd2hpbGUgKG9iamVjdCAhPSBudWxsKSB7XG4gICAgICAgICAgICBpZiAoZXJyb3JTdHJpbmdUeXBlc1tvYmplY3RUb1N0cmluZy5jYWxsKG9iamVjdCldKSByZXR1cm4gdHJ1ZVxuICAgICAgICAgICAgb2JqZWN0ID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKG9iamVjdClcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1hdGNoSW5uZXIoYSwgYiwgY29udGV4dCwgbGVmdCwgcmlnaHQpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtc3RhdGVtZW50cywgbWF4LXBhcmFtcywgbWF4LWxlblxuICAgICAgICB2YXIgYWtleXMsIGJrZXlzXG4gICAgICAgIHZhciBpc1VucHJveGllZEVycm9yID0gZmFsc2VcblxuICAgICAgICBpZiAoY29udGV4dCAmIFNhbWVQcm90bykge1xuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoYSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbWF0Y2hBcnJheUxpa2UoYSwgYiwgY29udGV4dCwgbGVmdCwgcmlnaHQpXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzdXBwb3J0c01hcCAmJiBhIGluc3RhbmNlb2YgTWFwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1hdGNoTWFwKGEsIGIsIGNvbnRleHQsIGxlZnQsIHJpZ2h0KVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoc3VwcG9ydHNTZXQgJiYgYSBpbnN0YW5jZW9mIFNldCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBtYXRjaFNldChhLCBiLCBjb250ZXh0LCBsZWZ0LCByaWdodClcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKG9iamVjdFRvU3RyaW5nLmNhbGwoYSkgPT09IFwiW29iamVjdCBBcmd1bWVudHNdXCIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbWF0Y2hBcnJheUxpa2UoYSwgYiwgY29udGV4dCwgbGVmdCwgcmlnaHQpXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChyZXF1aXJlc1Byb3h5ICYmXG4gICAgICAgICAgICAgICAgICAgIChjaGVja0Nyb3NzT3JpZ2luID8gaXNQcm94aWVkRXJyb3IoYSlcbiAgICAgICAgICAgICAgICAgICAgICAgIDogYSBpbnN0YW5jZW9mIEVycm9yKSkge1xuICAgICAgICAgICAgICAgIGFrZXlzID0gZ2V0S2V5c1N0cmlwcGVkKGEpXG4gICAgICAgICAgICAgICAgYmtleXMgPSBnZXRLZXlzU3RyaXBwZWQoYilcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYWtleXMgPSBPYmplY3Qua2V5cyhhKVxuICAgICAgICAgICAgICAgIGJrZXlzID0gT2JqZWN0LmtleXMoYilcbiAgICAgICAgICAgICAgICBpc1VucHJveGllZEVycm9yID0gYSBpbnN0YW5jZW9mIEVycm9yXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAob2JqZWN0VG9TdHJpbmcuY2FsbChhKSA9PT0gXCJbb2JqZWN0IEFyZ3VtZW50c11cIikge1xuICAgICAgICAgICAgICAgIHJldHVybiBtYXRjaEFycmF5TGlrZShhLCBiLCBjb250ZXh0LCBsZWZ0LCByaWdodClcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gSWYgd2UgcmVxdWlyZSBhIHByb3h5LCBiZSBwZXJtaXNzaXZlIGFuZCBjaGVjayB0aGUgYHRvU3RyaW5nYFxuICAgICAgICAgICAgLy8gdHlwZS4gVGhpcyBpcyBzbyBpdCB3b3JrcyBjcm9zcy1vcmlnaW4gaW4gUGhhbnRvbUpTIGluXG4gICAgICAgICAgICAvLyBwYXJ0aWN1bGFyLlxuICAgICAgICAgICAgaWYgKGNoZWNrQ3Jvc3NPcmlnaW4gPyBpc1Byb3hpZWRFcnJvcihhKSA6IGEgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYWtleXMgPSBPYmplY3Qua2V5cyhhKVxuICAgICAgICAgICAgYmtleXMgPSBPYmplY3Qua2V5cyhiKVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGNvdW50ID0gYWtleXMubGVuZ3RoXG5cbiAgICAgICAgaWYgKGNvdW50ICE9PSBia2V5cy5sZW5ndGgpIHJldHVybiBmYWxzZVxuXG4gICAgICAgIC8vIFNob3J0Y3V0IGlmIHRoZXJlJ3Mgbm90aGluZyB0byBtYXRjaFxuICAgICAgICBpZiAoY291bnQgPT09IDApIHJldHVybiB0cnVlXG5cbiAgICAgICAgdmFyIGlcblxuICAgICAgICBpZiAoaXNVbnByb3hpZWRFcnJvcikge1xuICAgICAgICAgICAgLy8gU2hvcnRjdXQgaWYgdGhlIHByb3BlcnRpZXMgYXJlIGRpZmZlcmVudC5cbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKGFrZXlzW2ldICE9PSBcInN0YWNrXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFoYXNPd24uY2FsbChiLCBha2V5c1tpXSkpIHJldHVybiBmYWxzZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gVmVyaWZ5IHRoYXQgYWxsIHRoZSBha2V5cycgdmFsdWVzIG1hdGNoZWQuXG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChha2V5c1tpXSAhPT0gXCJzdGFja1wiICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAhbWF0Y2goYVtha2V5c1tpXV0sIGJbYWtleXNbaV1dLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHQsIGxlZnQsIHJpZ2h0KSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBTaG9ydGN1dCBpZiB0aGUgcHJvcGVydGllcyBhcmUgZGlmZmVyZW50LlxuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoIWhhc093bi5jYWxsKGIsIGFrZXlzW2ldKSkgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFZlcmlmeSB0aGF0IGFsbCB0aGUgYWtleXMnIHZhbHVlcyBtYXRjaGVkLlxuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoIW1hdGNoKGFbYWtleXNbaV1dLCBiW2FrZXlzW2ldXSwgY29udGV4dCwgbGVmdCwgcmlnaHQpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgfVxufSk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgc2VtaVxuIiwiLy8gU2VlOiBodHRwOi8vY29kZS5nb29nbGUuY29tL3AvZ29vZ2xlLWRpZmYtbWF0Y2gtcGF0Y2gvd2lraS9BUElcbmV4cG9ydCBmdW5jdGlvbiBjb252ZXJ0Q2hhbmdlc1RvRE1QKGNoYW5nZXMpIHtcbiAgbGV0IHJldCA9IFtdLFxuICAgICAgY2hhbmdlLFxuICAgICAgb3BlcmF0aW9uO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGNoYW5nZXMubGVuZ3RoOyBpKyspIHtcbiAgICBjaGFuZ2UgPSBjaGFuZ2VzW2ldO1xuICAgIGlmIChjaGFuZ2UuYWRkZWQpIHtcbiAgICAgIG9wZXJhdGlvbiA9IDE7XG4gICAgfSBlbHNlIGlmIChjaGFuZ2UucmVtb3ZlZCkge1xuICAgICAgb3BlcmF0aW9uID0gLTE7XG4gICAgfSBlbHNlIHtcbiAgICAgIG9wZXJhdGlvbiA9IDA7XG4gICAgfVxuXG4gICAgcmV0LnB1c2goW29wZXJhdGlvbiwgY2hhbmdlLnZhbHVlXSk7XG4gIH1cbiAgcmV0dXJuIHJldDtcbn1cbiIsImV4cG9ydCBmdW5jdGlvbiBjb252ZXJ0Q2hhbmdlc1RvWE1MKGNoYW5nZXMpIHtcbiAgbGV0IHJldCA9IFtdO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGNoYW5nZXMubGVuZ3RoOyBpKyspIHtcbiAgICBsZXQgY2hhbmdlID0gY2hhbmdlc1tpXTtcbiAgICBpZiAoY2hhbmdlLmFkZGVkKSB7XG4gICAgICByZXQucHVzaCgnPGlucz4nKTtcbiAgICB9IGVsc2UgaWYgKGNoYW5nZS5yZW1vdmVkKSB7XG4gICAgICByZXQucHVzaCgnPGRlbD4nKTtcbiAgICB9XG5cbiAgICByZXQucHVzaChlc2NhcGVIVE1MKGNoYW5nZS52YWx1ZSkpO1xuXG4gICAgaWYgKGNoYW5nZS5hZGRlZCkge1xuICAgICAgcmV0LnB1c2goJzwvaW5zPicpO1xuICAgIH0gZWxzZSBpZiAoY2hhbmdlLnJlbW92ZWQpIHtcbiAgICAgIHJldC5wdXNoKCc8L2RlbD4nKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJldC5qb2luKCcnKTtcbn1cblxuZnVuY3Rpb24gZXNjYXBlSFRNTChzKSB7XG4gIGxldCBuID0gcztcbiAgbiA9IG4ucmVwbGFjZSgvJi9nLCAnJmFtcDsnKTtcbiAgbiA9IG4ucmVwbGFjZSgvPC9nLCAnJmx0OycpO1xuICBuID0gbi5yZXBsYWNlKC8+L2csICcmZ3Q7Jyk7XG4gIG4gPSBuLnJlcGxhY2UoL1wiL2csICcmcXVvdDsnKTtcblxuICByZXR1cm4gbjtcbn1cbiIsImltcG9ydCBEaWZmIGZyb20gJy4vYmFzZSc7XG5cbmV4cG9ydCBjb25zdCBhcnJheURpZmYgPSBuZXcgRGlmZigpO1xuYXJyYXlEaWZmLnRva2VuaXplID0gYXJyYXlEaWZmLmpvaW4gPSBmdW5jdGlvbih2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUuc2xpY2UoKTtcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBkaWZmQXJyYXlzKG9sZEFyciwgbmV3QXJyLCBjYWxsYmFjaykgeyByZXR1cm4gYXJyYXlEaWZmLmRpZmYob2xkQXJyLCBuZXdBcnIsIGNhbGxiYWNrKTsgfVxuIiwiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gRGlmZigpIHt9XG5cbkRpZmYucHJvdG90eXBlID0ge1xuICBkaWZmKG9sZFN0cmluZywgbmV3U3RyaW5nLCBvcHRpb25zID0ge30pIHtcbiAgICBsZXQgY2FsbGJhY2sgPSBvcHRpb25zLmNhbGxiYWNrO1xuICAgIGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgY2FsbGJhY2sgPSBvcHRpb25zO1xuICAgICAgb3B0aW9ucyA9IHt9O1xuICAgIH1cbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuXG4gICAgbGV0IHNlbGYgPSB0aGlzO1xuXG4gICAgZnVuY3Rpb24gZG9uZSh2YWx1ZSkge1xuICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IGNhbGxiYWNrKHVuZGVmaW5lZCwgdmFsdWUpOyB9LCAwKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gQWxsb3cgc3ViY2xhc3NlcyB0byBtYXNzYWdlIHRoZSBpbnB1dCBwcmlvciB0byBydW5uaW5nXG4gICAgb2xkU3RyaW5nID0gdGhpcy5jYXN0SW5wdXQob2xkU3RyaW5nKTtcbiAgICBuZXdTdHJpbmcgPSB0aGlzLmNhc3RJbnB1dChuZXdTdHJpbmcpO1xuXG4gICAgb2xkU3RyaW5nID0gdGhpcy5yZW1vdmVFbXB0eSh0aGlzLnRva2VuaXplKG9sZFN0cmluZykpO1xuICAgIG5ld1N0cmluZyA9IHRoaXMucmVtb3ZlRW1wdHkodGhpcy50b2tlbml6ZShuZXdTdHJpbmcpKTtcblxuICAgIGxldCBuZXdMZW4gPSBuZXdTdHJpbmcubGVuZ3RoLCBvbGRMZW4gPSBvbGRTdHJpbmcubGVuZ3RoO1xuICAgIGxldCBlZGl0TGVuZ3RoID0gMTtcbiAgICBsZXQgbWF4RWRpdExlbmd0aCA9IG5ld0xlbiArIG9sZExlbjtcbiAgICBsZXQgYmVzdFBhdGggPSBbeyBuZXdQb3M6IC0xLCBjb21wb25lbnRzOiBbXSB9XTtcblxuICAgIC8vIFNlZWQgZWRpdExlbmd0aCA9IDAsIGkuZS4gdGhlIGNvbnRlbnQgc3RhcnRzIHdpdGggdGhlIHNhbWUgdmFsdWVzXG4gICAgbGV0IG9sZFBvcyA9IHRoaXMuZXh0cmFjdENvbW1vbihiZXN0UGF0aFswXSwgbmV3U3RyaW5nLCBvbGRTdHJpbmcsIDApO1xuICAgIGlmIChiZXN0UGF0aFswXS5uZXdQb3MgKyAxID49IG5ld0xlbiAmJiBvbGRQb3MgKyAxID49IG9sZExlbikge1xuICAgICAgLy8gSWRlbnRpdHkgcGVyIHRoZSBlcXVhbGl0eSBhbmQgdG9rZW5pemVyXG4gICAgICByZXR1cm4gZG9uZShbe3ZhbHVlOiB0aGlzLmpvaW4obmV3U3RyaW5nKSwgY291bnQ6IG5ld1N0cmluZy5sZW5ndGh9XSk7XG4gICAgfVxuXG4gICAgLy8gTWFpbiB3b3JrZXIgbWV0aG9kLiBjaGVja3MgYWxsIHBlcm11dGF0aW9ucyBvZiBhIGdpdmVuIGVkaXQgbGVuZ3RoIGZvciBhY2NlcHRhbmNlLlxuICAgIGZ1bmN0aW9uIGV4ZWNFZGl0TGVuZ3RoKCkge1xuICAgICAgZm9yIChsZXQgZGlhZ29uYWxQYXRoID0gLTEgKiBlZGl0TGVuZ3RoOyBkaWFnb25hbFBhdGggPD0gZWRpdExlbmd0aDsgZGlhZ29uYWxQYXRoICs9IDIpIHtcbiAgICAgICAgbGV0IGJhc2VQYXRoO1xuICAgICAgICBsZXQgYWRkUGF0aCA9IGJlc3RQYXRoW2RpYWdvbmFsUGF0aCAtIDFdLFxuICAgICAgICAgICAgcmVtb3ZlUGF0aCA9IGJlc3RQYXRoW2RpYWdvbmFsUGF0aCArIDFdLFxuICAgICAgICAgICAgb2xkUG9zID0gKHJlbW92ZVBhdGggPyByZW1vdmVQYXRoLm5ld1BvcyA6IDApIC0gZGlhZ29uYWxQYXRoO1xuICAgICAgICBpZiAoYWRkUGF0aCkge1xuICAgICAgICAgIC8vIE5vIG9uZSBlbHNlIGlzIGdvaW5nIHRvIGF0dGVtcHQgdG8gdXNlIHRoaXMgdmFsdWUsIGNsZWFyIGl0XG4gICAgICAgICAgYmVzdFBhdGhbZGlhZ29uYWxQYXRoIC0gMV0gPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgY2FuQWRkID0gYWRkUGF0aCAmJiBhZGRQYXRoLm5ld1BvcyArIDEgPCBuZXdMZW4sXG4gICAgICAgICAgICBjYW5SZW1vdmUgPSByZW1vdmVQYXRoICYmIDAgPD0gb2xkUG9zICYmIG9sZFBvcyA8IG9sZExlbjtcbiAgICAgICAgaWYgKCFjYW5BZGQgJiYgIWNhblJlbW92ZSkge1xuICAgICAgICAgIC8vIElmIHRoaXMgcGF0aCBpcyBhIHRlcm1pbmFsIHRoZW4gcHJ1bmVcbiAgICAgICAgICBiZXN0UGF0aFtkaWFnb25hbFBhdGhdID0gdW5kZWZpbmVkO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU2VsZWN0IHRoZSBkaWFnb25hbCB0aGF0IHdlIHdhbnQgdG8gYnJhbmNoIGZyb20uIFdlIHNlbGVjdCB0aGUgcHJpb3JcbiAgICAgICAgLy8gcGF0aCB3aG9zZSBwb3NpdGlvbiBpbiB0aGUgbmV3IHN0cmluZyBpcyB0aGUgZmFydGhlc3QgZnJvbSB0aGUgb3JpZ2luXG4gICAgICAgIC8vIGFuZCBkb2VzIG5vdCBwYXNzIHRoZSBib3VuZHMgb2YgdGhlIGRpZmYgZ3JhcGhcbiAgICAgICAgaWYgKCFjYW5BZGQgfHwgKGNhblJlbW92ZSAmJiBhZGRQYXRoLm5ld1BvcyA8IHJlbW92ZVBhdGgubmV3UG9zKSkge1xuICAgICAgICAgIGJhc2VQYXRoID0gY2xvbmVQYXRoKHJlbW92ZVBhdGgpO1xuICAgICAgICAgIHNlbGYucHVzaENvbXBvbmVudChiYXNlUGF0aC5jb21wb25lbnRzLCB1bmRlZmluZWQsIHRydWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGJhc2VQYXRoID0gYWRkUGF0aDsgICAvLyBObyBuZWVkIHRvIGNsb25lLCB3ZSd2ZSBwdWxsZWQgaXQgZnJvbSB0aGUgbGlzdFxuICAgICAgICAgIGJhc2VQYXRoLm5ld1BvcysrO1xuICAgICAgICAgIHNlbGYucHVzaENvbXBvbmVudChiYXNlUGF0aC5jb21wb25lbnRzLCB0cnVlLCB1bmRlZmluZWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgb2xkUG9zID0gc2VsZi5leHRyYWN0Q29tbW9uKGJhc2VQYXRoLCBuZXdTdHJpbmcsIG9sZFN0cmluZywgZGlhZ29uYWxQYXRoKTtcblxuICAgICAgICAvLyBJZiB3ZSBoYXZlIGhpdCB0aGUgZW5kIG9mIGJvdGggc3RyaW5ncywgdGhlbiB3ZSBhcmUgZG9uZVxuICAgICAgICBpZiAoYmFzZVBhdGgubmV3UG9zICsgMSA+PSBuZXdMZW4gJiYgb2xkUG9zICsgMSA+PSBvbGRMZW4pIHtcbiAgICAgICAgICByZXR1cm4gZG9uZShidWlsZFZhbHVlcyhzZWxmLCBiYXNlUGF0aC5jb21wb25lbnRzLCBuZXdTdHJpbmcsIG9sZFN0cmluZywgc2VsZi51c2VMb25nZXN0VG9rZW4pKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBPdGhlcndpc2UgdHJhY2sgdGhpcyBwYXRoIGFzIGEgcG90ZW50aWFsIGNhbmRpZGF0ZSBhbmQgY29udGludWUuXG4gICAgICAgICAgYmVzdFBhdGhbZGlhZ29uYWxQYXRoXSA9IGJhc2VQYXRoO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGVkaXRMZW5ndGgrKztcbiAgICB9XG5cbiAgICAvLyBQZXJmb3JtcyB0aGUgbGVuZ3RoIG9mIGVkaXQgaXRlcmF0aW9uLiBJcyBhIGJpdCBmdWdseSBhcyB0aGlzIGhhcyB0byBzdXBwb3J0IHRoZVxuICAgIC8vIHN5bmMgYW5kIGFzeW5jIG1vZGUgd2hpY2ggaXMgbmV2ZXIgZnVuLiBMb29wcyBvdmVyIGV4ZWNFZGl0TGVuZ3RoIHVudGlsIGEgdmFsdWVcbiAgICAvLyBpcyBwcm9kdWNlZC5cbiAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgIChmdW5jdGlvbiBleGVjKCkge1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgIC8vIFRoaXMgc2hvdWxkIG5vdCBoYXBwZW4sIGJ1dCB3ZSB3YW50IHRvIGJlIHNhZmUuXG4gICAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgICAgICBpZiAoZWRpdExlbmd0aCA+IG1heEVkaXRMZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjaygpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICghZXhlY0VkaXRMZW5ndGgoKSkge1xuICAgICAgICAgICAgZXhlYygpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSwgMCk7XG4gICAgICB9KCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICB3aGlsZSAoZWRpdExlbmd0aCA8PSBtYXhFZGl0TGVuZ3RoKSB7XG4gICAgICAgIGxldCByZXQgPSBleGVjRWRpdExlbmd0aCgpO1xuICAgICAgICBpZiAocmV0KSB7XG4gICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICBwdXNoQ29tcG9uZW50KGNvbXBvbmVudHMsIGFkZGVkLCByZW1vdmVkKSB7XG4gICAgbGV0IGxhc3QgPSBjb21wb25lbnRzW2NvbXBvbmVudHMubGVuZ3RoIC0gMV07XG4gICAgaWYgKGxhc3QgJiYgbGFzdC5hZGRlZCA9PT0gYWRkZWQgJiYgbGFzdC5yZW1vdmVkID09PSByZW1vdmVkKSB7XG4gICAgICAvLyBXZSBuZWVkIHRvIGNsb25lIGhlcmUgYXMgdGhlIGNvbXBvbmVudCBjbG9uZSBvcGVyYXRpb24gaXMganVzdFxuICAgICAgLy8gYXMgc2hhbGxvdyBhcnJheSBjbG9uZVxuICAgICAgY29tcG9uZW50c1tjb21wb25lbnRzLmxlbmd0aCAtIDFdID0ge2NvdW50OiBsYXN0LmNvdW50ICsgMSwgYWRkZWQ6IGFkZGVkLCByZW1vdmVkOiByZW1vdmVkIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbXBvbmVudHMucHVzaCh7Y291bnQ6IDEsIGFkZGVkOiBhZGRlZCwgcmVtb3ZlZDogcmVtb3ZlZCB9KTtcbiAgICB9XG4gIH0sXG4gIGV4dHJhY3RDb21tb24oYmFzZVBhdGgsIG5ld1N0cmluZywgb2xkU3RyaW5nLCBkaWFnb25hbFBhdGgpIHtcbiAgICBsZXQgbmV3TGVuID0gbmV3U3RyaW5nLmxlbmd0aCxcbiAgICAgICAgb2xkTGVuID0gb2xkU3RyaW5nLmxlbmd0aCxcbiAgICAgICAgbmV3UG9zID0gYmFzZVBhdGgubmV3UG9zLFxuICAgICAgICBvbGRQb3MgPSBuZXdQb3MgLSBkaWFnb25hbFBhdGgsXG5cbiAgICAgICAgY29tbW9uQ291bnQgPSAwO1xuICAgIHdoaWxlIChuZXdQb3MgKyAxIDwgbmV3TGVuICYmIG9sZFBvcyArIDEgPCBvbGRMZW4gJiYgdGhpcy5lcXVhbHMobmV3U3RyaW5nW25ld1BvcyArIDFdLCBvbGRTdHJpbmdbb2xkUG9zICsgMV0pKSB7XG4gICAgICBuZXdQb3MrKztcbiAgICAgIG9sZFBvcysrO1xuICAgICAgY29tbW9uQ291bnQrKztcbiAgICB9XG5cbiAgICBpZiAoY29tbW9uQ291bnQpIHtcbiAgICAgIGJhc2VQYXRoLmNvbXBvbmVudHMucHVzaCh7Y291bnQ6IGNvbW1vbkNvdW50fSk7XG4gICAgfVxuXG4gICAgYmFzZVBhdGgubmV3UG9zID0gbmV3UG9zO1xuICAgIHJldHVybiBvbGRQb3M7XG4gIH0sXG5cbiAgZXF1YWxzKGxlZnQsIHJpZ2h0KSB7XG4gICAgcmV0dXJuIGxlZnQgPT09IHJpZ2h0O1xuICB9LFxuICByZW1vdmVFbXB0eShhcnJheSkge1xuICAgIGxldCByZXQgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoYXJyYXlbaV0pIHtcbiAgICAgICAgcmV0LnB1c2goYXJyYXlbaV0pO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmV0O1xuICB9LFxuICBjYXN0SW5wdXQodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH0sXG4gIHRva2VuaXplKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlLnNwbGl0KCcnKTtcbiAgfSxcbiAgam9pbihjaGFycykge1xuICAgIHJldHVybiBjaGFycy5qb2luKCcnKTtcbiAgfVxufTtcblxuZnVuY3Rpb24gYnVpbGRWYWx1ZXMoZGlmZiwgY29tcG9uZW50cywgbmV3U3RyaW5nLCBvbGRTdHJpbmcsIHVzZUxvbmdlc3RUb2tlbikge1xuICBsZXQgY29tcG9uZW50UG9zID0gMCxcbiAgICAgIGNvbXBvbmVudExlbiA9IGNvbXBvbmVudHMubGVuZ3RoLFxuICAgICAgbmV3UG9zID0gMCxcbiAgICAgIG9sZFBvcyA9IDA7XG5cbiAgZm9yICg7IGNvbXBvbmVudFBvcyA8IGNvbXBvbmVudExlbjsgY29tcG9uZW50UG9zKyspIHtcbiAgICBsZXQgY29tcG9uZW50ID0gY29tcG9uZW50c1tjb21wb25lbnRQb3NdO1xuICAgIGlmICghY29tcG9uZW50LnJlbW92ZWQpIHtcbiAgICAgIGlmICghY29tcG9uZW50LmFkZGVkICYmIHVzZUxvbmdlc3RUb2tlbikge1xuICAgICAgICBsZXQgdmFsdWUgPSBuZXdTdHJpbmcuc2xpY2UobmV3UG9zLCBuZXdQb3MgKyBjb21wb25lbnQuY291bnQpO1xuICAgICAgICB2YWx1ZSA9IHZhbHVlLm1hcChmdW5jdGlvbih2YWx1ZSwgaSkge1xuICAgICAgICAgIGxldCBvbGRWYWx1ZSA9IG9sZFN0cmluZ1tvbGRQb3MgKyBpXTtcbiAgICAgICAgICByZXR1cm4gb2xkVmFsdWUubGVuZ3RoID4gdmFsdWUubGVuZ3RoID8gb2xkVmFsdWUgOiB2YWx1ZTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29tcG9uZW50LnZhbHVlID0gZGlmZi5qb2luKHZhbHVlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbXBvbmVudC52YWx1ZSA9IGRpZmYuam9pbihuZXdTdHJpbmcuc2xpY2UobmV3UG9zLCBuZXdQb3MgKyBjb21wb25lbnQuY291bnQpKTtcbiAgICAgIH1cbiAgICAgIG5ld1BvcyArPSBjb21wb25lbnQuY291bnQ7XG5cbiAgICAgIC8vIENvbW1vbiBjYXNlXG4gICAgICBpZiAoIWNvbXBvbmVudC5hZGRlZCkge1xuICAgICAgICBvbGRQb3MgKz0gY29tcG9uZW50LmNvdW50O1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjb21wb25lbnQudmFsdWUgPSBkaWZmLmpvaW4ob2xkU3RyaW5nLnNsaWNlKG9sZFBvcywgb2xkUG9zICsgY29tcG9uZW50LmNvdW50KSk7XG4gICAgICBvbGRQb3MgKz0gY29tcG9uZW50LmNvdW50O1xuXG4gICAgICAvLyBSZXZlcnNlIGFkZCBhbmQgcmVtb3ZlIHNvIHJlbW92ZXMgYXJlIG91dHB1dCBmaXJzdCB0byBtYXRjaCBjb21tb24gY29udmVudGlvblxuICAgICAgLy8gVGhlIGRpZmZpbmcgYWxnb3JpdGhtIGlzIHRpZWQgdG8gYWRkIHRoZW4gcmVtb3ZlIG91dHB1dCBhbmQgdGhpcyBpcyB0aGUgc2ltcGxlc3RcbiAgICAgIC8vIHJvdXRlIHRvIGdldCB0aGUgZGVzaXJlZCBvdXRwdXQgd2l0aCBtaW5pbWFsIG92ZXJoZWFkLlxuICAgICAgaWYgKGNvbXBvbmVudFBvcyAmJiBjb21wb25lbnRzW2NvbXBvbmVudFBvcyAtIDFdLmFkZGVkKSB7XG4gICAgICAgIGxldCB0bXAgPSBjb21wb25lbnRzW2NvbXBvbmVudFBvcyAtIDFdO1xuICAgICAgICBjb21wb25lbnRzW2NvbXBvbmVudFBvcyAtIDFdID0gY29tcG9uZW50c1tjb21wb25lbnRQb3NdO1xuICAgICAgICBjb21wb25lbnRzW2NvbXBvbmVudFBvc10gPSB0bXA7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gU3BlY2lhbCBjYXNlIGhhbmRsZSBmb3Igd2hlbiBvbmUgdGVybWluYWwgaXMgaWdub3JlZC4gRm9yIHRoaXMgY2FzZSB3ZSBtZXJnZSB0aGVcbiAgLy8gdGVybWluYWwgaW50byB0aGUgcHJpb3Igc3RyaW5nIGFuZCBkcm9wIHRoZSBjaGFuZ2UuXG4gIGxldCBsYXN0Q29tcG9uZW50ID0gY29tcG9uZW50c1tjb21wb25lbnRMZW4gLSAxXTtcbiAgaWYgKGNvbXBvbmVudExlbiA+IDFcbiAgICAgICYmIChsYXN0Q29tcG9uZW50LmFkZGVkIHx8IGxhc3RDb21wb25lbnQucmVtb3ZlZClcbiAgICAgICYmIGRpZmYuZXF1YWxzKCcnLCBsYXN0Q29tcG9uZW50LnZhbHVlKSkge1xuICAgIGNvbXBvbmVudHNbY29tcG9uZW50TGVuIC0gMl0udmFsdWUgKz0gbGFzdENvbXBvbmVudC52YWx1ZTtcbiAgICBjb21wb25lbnRzLnBvcCgpO1xuICB9XG5cbiAgcmV0dXJuIGNvbXBvbmVudHM7XG59XG5cbmZ1bmN0aW9uIGNsb25lUGF0aChwYXRoKSB7XG4gIHJldHVybiB7IG5ld1BvczogcGF0aC5uZXdQb3MsIGNvbXBvbmVudHM6IHBhdGguY29tcG9uZW50cy5zbGljZSgwKSB9O1xufVxuIiwiaW1wb3J0IERpZmYgZnJvbSAnLi9iYXNlJztcblxuZXhwb3J0IGNvbnN0IGNoYXJhY3RlckRpZmYgPSBuZXcgRGlmZigpO1xuZXhwb3J0IGZ1bmN0aW9uIGRpZmZDaGFycyhvbGRTdHIsIG5ld1N0ciwgY2FsbGJhY2spIHsgcmV0dXJuIGNoYXJhY3RlckRpZmYuZGlmZihvbGRTdHIsIG5ld1N0ciwgY2FsbGJhY2spOyB9XG4iLCJpbXBvcnQgRGlmZiBmcm9tICcuL2Jhc2UnO1xuXG5leHBvcnQgY29uc3QgY3NzRGlmZiA9IG5ldyBEaWZmKCk7XG5jc3NEaWZmLnRva2VuaXplID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlLnNwbGl0KC8oW3t9OjssXXxcXHMrKS8pO1xufTtcblxuZXhwb3J0IGZ1bmN0aW9uIGRpZmZDc3Mob2xkU3RyLCBuZXdTdHIsIGNhbGxiYWNrKSB7IHJldHVybiBjc3NEaWZmLmRpZmYob2xkU3RyLCBuZXdTdHIsIGNhbGxiYWNrKTsgfVxuIiwiaW1wb3J0IERpZmYgZnJvbSAnLi9iYXNlJztcbmltcG9ydCB7bGluZURpZmZ9IGZyb20gJy4vbGluZSc7XG5cbmNvbnN0IG9iamVjdFByb3RvdHlwZVRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcblxuXG5leHBvcnQgY29uc3QganNvbkRpZmYgPSBuZXcgRGlmZigpO1xuLy8gRGlzY3JpbWluYXRlIGJldHdlZW4gdHdvIGxpbmVzIG9mIHByZXR0eS1wcmludGVkLCBzZXJpYWxpemVkIEpTT04gd2hlcmUgb25lIG9mIHRoZW0gaGFzIGFcbi8vIGRhbmdsaW5nIGNvbW1hIGFuZCB0aGUgb3RoZXIgZG9lc24ndC4gVHVybnMgb3V0IGluY2x1ZGluZyB0aGUgZGFuZ2xpbmcgY29tbWEgeWllbGRzIHRoZSBuaWNlc3Qgb3V0cHV0OlxuanNvbkRpZmYudXNlTG9uZ2VzdFRva2VuID0gdHJ1ZTtcblxuanNvbkRpZmYudG9rZW5pemUgPSBsaW5lRGlmZi50b2tlbml6ZTtcbmpzb25EaWZmLmNhc3RJbnB1dCA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gIGNvbnN0IHt1bmRlZmluZWRSZXBsYWNlbWVudH0gPSB0aGlzLm9wdGlvbnM7XG5cbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgPyB2YWx1ZSA6IEpTT04uc3RyaW5naWZ5KGNhbm9uaWNhbGl6ZSh2YWx1ZSksIGZ1bmN0aW9uKGssIHYpIHtcbiAgICBpZiAodHlwZW9mIHYgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkUmVwbGFjZW1lbnQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIHY7XG4gIH0sICcgICcpO1xufTtcbmpzb25EaWZmLmVxdWFscyA9IGZ1bmN0aW9uKGxlZnQsIHJpZ2h0KSB7XG4gIHJldHVybiBEaWZmLnByb3RvdHlwZS5lcXVhbHMobGVmdC5yZXBsYWNlKC8sKFtcXHJcXG5dKS9nLCAnJDEnKSwgcmlnaHQucmVwbGFjZSgvLChbXFxyXFxuXSkvZywgJyQxJykpO1xufTtcblxuZXhwb3J0IGZ1bmN0aW9uIGRpZmZKc29uKG9sZE9iaiwgbmV3T2JqLCBvcHRpb25zKSB7IHJldHVybiBqc29uRGlmZi5kaWZmKG9sZE9iaiwgbmV3T2JqLCBvcHRpb25zKTsgfVxuXG4vLyBUaGlzIGZ1bmN0aW9uIGhhbmRsZXMgdGhlIHByZXNlbmNlIG9mIGNpcmN1bGFyIHJlZmVyZW5jZXMgYnkgYmFpbGluZyBvdXQgd2hlbiBlbmNvdW50ZXJpbmcgYW5cbi8vIG9iamVjdCB0aGF0IGlzIGFscmVhZHkgb24gdGhlIFwic3RhY2tcIiBvZiBpdGVtcyBiZWluZyBwcm9jZXNzZWQuXG5leHBvcnQgZnVuY3Rpb24gY2Fub25pY2FsaXplKG9iaiwgc3RhY2ssIHJlcGxhY2VtZW50U3RhY2spIHtcbiAgc3RhY2sgPSBzdGFjayB8fCBbXTtcbiAgcmVwbGFjZW1lbnRTdGFjayA9IHJlcGxhY2VtZW50U3RhY2sgfHwgW107XG5cbiAgbGV0IGk7XG5cbiAgZm9yIChpID0gMDsgaSA8IHN0YWNrLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgaWYgKHN0YWNrW2ldID09PSBvYmopIHtcbiAgICAgIHJldHVybiByZXBsYWNlbWVudFN0YWNrW2ldO1xuICAgIH1cbiAgfVxuXG4gIGxldCBjYW5vbmljYWxpemVkT2JqO1xuXG4gIGlmICgnW29iamVjdCBBcnJheV0nID09PSBvYmplY3RQcm90b3R5cGVUb1N0cmluZy5jYWxsKG9iaikpIHtcbiAgICBzdGFjay5wdXNoKG9iaik7XG4gICAgY2Fub25pY2FsaXplZE9iaiA9IG5ldyBBcnJheShvYmoubGVuZ3RoKTtcbiAgICByZXBsYWNlbWVudFN0YWNrLnB1c2goY2Fub25pY2FsaXplZE9iaik7XG4gICAgZm9yIChpID0gMDsgaSA8IG9iai5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgY2Fub25pY2FsaXplZE9ialtpXSA9IGNhbm9uaWNhbGl6ZShvYmpbaV0sIHN0YWNrLCByZXBsYWNlbWVudFN0YWNrKTtcbiAgICB9XG4gICAgc3RhY2sucG9wKCk7XG4gICAgcmVwbGFjZW1lbnRTdGFjay5wb3AoKTtcbiAgICByZXR1cm4gY2Fub25pY2FsaXplZE9iajtcbiAgfVxuXG4gIGlmIChvYmogJiYgb2JqLnRvSlNPTikge1xuICAgIG9iaiA9IG9iai50b0pTT04oKTtcbiAgfVxuXG4gIGlmICh0eXBlb2Ygb2JqID09PSAnb2JqZWN0JyAmJiBvYmogIT09IG51bGwpIHtcbiAgICBzdGFjay5wdXNoKG9iaik7XG4gICAgY2Fub25pY2FsaXplZE9iaiA9IHt9O1xuICAgIHJlcGxhY2VtZW50U3RhY2sucHVzaChjYW5vbmljYWxpemVkT2JqKTtcbiAgICBsZXQgc29ydGVkS2V5cyA9IFtdLFxuICAgICAgICBrZXk7XG4gICAgZm9yIChrZXkgaW4gb2JqKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgZWxzZSAqL1xuICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgIHNvcnRlZEtleXMucHVzaChrZXkpO1xuICAgICAgfVxuICAgIH1cbiAgICBzb3J0ZWRLZXlzLnNvcnQoKTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgc29ydGVkS2V5cy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAga2V5ID0gc29ydGVkS2V5c1tpXTtcbiAgICAgIGNhbm9uaWNhbGl6ZWRPYmpba2V5XSA9IGNhbm9uaWNhbGl6ZShvYmpba2V5XSwgc3RhY2ssIHJlcGxhY2VtZW50U3RhY2spO1xuICAgIH1cbiAgICBzdGFjay5wb3AoKTtcbiAgICByZXBsYWNlbWVudFN0YWNrLnBvcCgpO1xuICB9IGVsc2Uge1xuICAgIGNhbm9uaWNhbGl6ZWRPYmogPSBvYmo7XG4gIH1cbiAgcmV0dXJuIGNhbm9uaWNhbGl6ZWRPYmo7XG59XG4iLCJpbXBvcnQgRGlmZiBmcm9tICcuL2Jhc2UnO1xuaW1wb3J0IHtnZW5lcmF0ZU9wdGlvbnN9IGZyb20gJy4uL3V0aWwvcGFyYW1zJztcblxuZXhwb3J0IGNvbnN0IGxpbmVEaWZmID0gbmV3IERpZmYoKTtcbmxpbmVEaWZmLnRva2VuaXplID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgbGV0IHJldExpbmVzID0gW10sXG4gICAgICBsaW5lc0FuZE5ld2xpbmVzID0gdmFsdWUuc3BsaXQoLyhcXG58XFxyXFxuKS8pO1xuXG4gIC8vIElnbm9yZSB0aGUgZmluYWwgZW1wdHkgdG9rZW4gdGhhdCBvY2N1cnMgaWYgdGhlIHN0cmluZyBlbmRzIHdpdGggYSBuZXcgbGluZVxuICBpZiAoIWxpbmVzQW5kTmV3bGluZXNbbGluZXNBbmROZXdsaW5lcy5sZW5ndGggLSAxXSkge1xuICAgIGxpbmVzQW5kTmV3bGluZXMucG9wKCk7XG4gIH1cblxuICAvLyBNZXJnZSB0aGUgY29udGVudCBhbmQgbGluZSBzZXBhcmF0b3JzIGludG8gc2luZ2xlIHRva2Vuc1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGxpbmVzQW5kTmV3bGluZXMubGVuZ3RoOyBpKyspIHtcbiAgICBsZXQgbGluZSA9IGxpbmVzQW5kTmV3bGluZXNbaV07XG5cbiAgICBpZiAoaSAlIDIgJiYgIXRoaXMub3B0aW9ucy5uZXdsaW5lSXNUb2tlbikge1xuICAgICAgcmV0TGluZXNbcmV0TGluZXMubGVuZ3RoIC0gMV0gKz0gbGluZTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy5pZ25vcmVXaGl0ZXNwYWNlKSB7XG4gICAgICAgIGxpbmUgPSBsaW5lLnRyaW0oKTtcbiAgICAgIH1cbiAgICAgIHJldExpbmVzLnB1c2gobGluZSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJldExpbmVzO1xufTtcblxuZXhwb3J0IGZ1bmN0aW9uIGRpZmZMaW5lcyhvbGRTdHIsIG5ld1N0ciwgY2FsbGJhY2spIHsgcmV0dXJuIGxpbmVEaWZmLmRpZmYob2xkU3RyLCBuZXdTdHIsIGNhbGxiYWNrKTsgfVxuZXhwb3J0IGZ1bmN0aW9uIGRpZmZUcmltbWVkTGluZXMob2xkU3RyLCBuZXdTdHIsIGNhbGxiYWNrKSB7XG4gIGxldCBvcHRpb25zID0gZ2VuZXJhdGVPcHRpb25zKGNhbGxiYWNrLCB7aWdub3JlV2hpdGVzcGFjZTogdHJ1ZX0pO1xuICByZXR1cm4gbGluZURpZmYuZGlmZihvbGRTdHIsIG5ld1N0ciwgb3B0aW9ucyk7XG59XG4iLCJpbXBvcnQgRGlmZiBmcm9tICcuL2Jhc2UnO1xuXG5cbmV4cG9ydCBjb25zdCBzZW50ZW5jZURpZmYgPSBuZXcgRGlmZigpO1xuc2VudGVuY2VEaWZmLnRva2VuaXplID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlLnNwbGl0KC8oXFxTLis/Wy4hP10pKD89XFxzK3wkKS8pO1xufTtcblxuZXhwb3J0IGZ1bmN0aW9uIGRpZmZTZW50ZW5jZXMob2xkU3RyLCBuZXdTdHIsIGNhbGxiYWNrKSB7IHJldHVybiBzZW50ZW5jZURpZmYuZGlmZihvbGRTdHIsIG5ld1N0ciwgY2FsbGJhY2spOyB9XG4iLCJpbXBvcnQgRGlmZiBmcm9tICcuL2Jhc2UnO1xuaW1wb3J0IHtnZW5lcmF0ZU9wdGlvbnN9IGZyb20gJy4uL3V0aWwvcGFyYW1zJztcblxuLy8gQmFzZWQgb24gaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvTGF0aW5fc2NyaXB0X2luX1VuaWNvZGVcbi8vXG4vLyBSYW5nZXMgYW5kIGV4Y2VwdGlvbnM6XG4vLyBMYXRpbi0xIFN1cHBsZW1lbnQsIDAwODDigJMwMEZGXG4vLyAgLSBVKzAwRDcgIMOXIE11bHRpcGxpY2F0aW9uIHNpZ25cbi8vICAtIFUrMDBGNyAgw7cgRGl2aXNpb24gc2lnblxuLy8gTGF0aW4gRXh0ZW5kZWQtQSwgMDEwMOKAkzAxN0Zcbi8vIExhdGluIEV4dGVuZGVkLUIsIDAxODDigJMwMjRGXG4vLyBJUEEgRXh0ZW5zaW9ucywgMDI1MOKAkzAyQUZcbi8vIFNwYWNpbmcgTW9kaWZpZXIgTGV0dGVycywgMDJCMOKAkzAyRkZcbi8vICAtIFUrMDJDNyAgy4cgJiM3MTE7ICBDYXJvblxuLy8gIC0gVSswMkQ4ICDLmCAmIzcyODsgIEJyZXZlXG4vLyAgLSBVKzAyRDkgIMuZICYjNzI5OyAgRG90IEFib3ZlXG4vLyAgLSBVKzAyREEgIMuaICYjNzMwOyAgUmluZyBBYm92ZVxuLy8gIC0gVSswMkRCICDLmyAmIzczMTsgIE9nb25la1xuLy8gIC0gVSswMkRDICDLnCAmIzczMjsgIFNtYWxsIFRpbGRlXG4vLyAgLSBVKzAyREQgIMudICYjNzMzOyAgRG91YmxlIEFjdXRlIEFjY2VudFxuLy8gTGF0aW4gRXh0ZW5kZWQgQWRkaXRpb25hbCwgMUUwMOKAkzFFRkZcbmNvbnN0IGV4dGVuZGVkV29yZENoYXJzID0gL15bYS16QS1aXFx1e0MwfS1cXHV7RkZ9XFx1e0Q4fS1cXHV7RjZ9XFx1e0Y4fS1cXHV7MkM2fVxcdXsyQzh9LVxcdXsyRDd9XFx1ezJERX0tXFx1ezJGRn1cXHV7MUUwMH0tXFx1ezFFRkZ9XSskL3U7XG5cbmNvbnN0IHJlV2hpdGVzcGFjZSA9IC9cXFMvO1xuXG5leHBvcnQgY29uc3Qgd29yZERpZmYgPSBuZXcgRGlmZigpO1xud29yZERpZmYuZXF1YWxzID0gZnVuY3Rpb24obGVmdCwgcmlnaHQpIHtcbiAgcmV0dXJuIGxlZnQgPT09IHJpZ2h0IHx8ICh0aGlzLm9wdGlvbnMuaWdub3JlV2hpdGVzcGFjZSAmJiAhcmVXaGl0ZXNwYWNlLnRlc3QobGVmdCkgJiYgIXJlV2hpdGVzcGFjZS50ZXN0KHJpZ2h0KSk7XG59O1xud29yZERpZmYudG9rZW5pemUgPSBmdW5jdGlvbih2YWx1ZSkge1xuICBsZXQgdG9rZW5zID0gdmFsdWUuc3BsaXQoLyhcXHMrfFxcYikvKTtcblxuICAvLyBKb2luIHRoZSBib3VuZGFyeSBzcGxpdHMgdGhhdCB3ZSBkbyBub3QgY29uc2lkZXIgdG8gYmUgYm91bmRhcmllcy4gVGhpcyBpcyBwcmltYXJpbHkgdGhlIGV4dGVuZGVkIExhdGluIGNoYXJhY3RlciBzZXQuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdG9rZW5zLmxlbmd0aCAtIDE7IGkrKykge1xuICAgIC8vIElmIHdlIGhhdmUgYW4gZW1wdHkgc3RyaW5nIGluIHRoZSBuZXh0IGZpZWxkIGFuZCB3ZSBoYXZlIG9ubHkgd29yZCBjaGFycyBiZWZvcmUgYW5kIGFmdGVyLCBtZXJnZVxuICAgIGlmICghdG9rZW5zW2kgKyAxXSAmJiB0b2tlbnNbaSArIDJdXG4gICAgICAgICAgJiYgZXh0ZW5kZWRXb3JkQ2hhcnMudGVzdCh0b2tlbnNbaV0pXG4gICAgICAgICAgJiYgZXh0ZW5kZWRXb3JkQ2hhcnMudGVzdCh0b2tlbnNbaSArIDJdKSkge1xuICAgICAgdG9rZW5zW2ldICs9IHRva2Vuc1tpICsgMl07XG4gICAgICB0b2tlbnMuc3BsaWNlKGkgKyAxLCAyKTtcbiAgICAgIGktLTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdG9rZW5zO1xufTtcblxuZXhwb3J0IGZ1bmN0aW9uIGRpZmZXb3JkcyhvbGRTdHIsIG5ld1N0ciwgY2FsbGJhY2spIHtcbiAgbGV0IG9wdGlvbnMgPSBnZW5lcmF0ZU9wdGlvbnMoY2FsbGJhY2ssIHtpZ25vcmVXaGl0ZXNwYWNlOiB0cnVlfSk7XG4gIHJldHVybiB3b3JkRGlmZi5kaWZmKG9sZFN0ciwgbmV3U3RyLCBvcHRpb25zKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBkaWZmV29yZHNXaXRoU3BhY2Uob2xkU3RyLCBuZXdTdHIsIGNhbGxiYWNrKSB7XG4gIHJldHVybiB3b3JkRGlmZi5kaWZmKG9sZFN0ciwgbmV3U3RyLCBjYWxsYmFjayk7XG59XG4iLCIvKiBTZWUgTElDRU5TRSBmaWxlIGZvciB0ZXJtcyBvZiB1c2UgKi9cblxuLypcbiAqIFRleHQgZGlmZiBpbXBsZW1lbnRhdGlvbi5cbiAqXG4gKiBUaGlzIGxpYnJhcnkgc3VwcG9ydHMgdGhlIGZvbGxvd2luZyBBUElTOlxuICogSnNEaWZmLmRpZmZDaGFyczogQ2hhcmFjdGVyIGJ5IGNoYXJhY3RlciBkaWZmXG4gKiBKc0RpZmYuZGlmZldvcmRzOiBXb3JkIChhcyBkZWZpbmVkIGJ5IFxcYiByZWdleCkgZGlmZiB3aGljaCBpZ25vcmVzIHdoaXRlc3BhY2VcbiAqIEpzRGlmZi5kaWZmTGluZXM6IExpbmUgYmFzZWQgZGlmZlxuICpcbiAqIEpzRGlmZi5kaWZmQ3NzOiBEaWZmIHRhcmdldGVkIGF0IENTUyBjb250ZW50XG4gKlxuICogVGhlc2UgbWV0aG9kcyBhcmUgYmFzZWQgb24gdGhlIGltcGxlbWVudGF0aW9uIHByb3Bvc2VkIGluXG4gKiBcIkFuIE8oTkQpIERpZmZlcmVuY2UgQWxnb3JpdGhtIGFuZCBpdHMgVmFyaWF0aW9uc1wiIChNeWVycywgMTk4NikuXG4gKiBodHRwOi8vY2l0ZXNlZXJ4LmlzdC5wc3UuZWR1L3ZpZXdkb2Mvc3VtbWFyeT9kb2k9MTAuMS4xLjQuNjkyN1xuICovXG5pbXBvcnQgRGlmZiBmcm9tICcuL2RpZmYvYmFzZSc7XG5pbXBvcnQge2RpZmZDaGFyc30gZnJvbSAnLi9kaWZmL2NoYXJhY3Rlcic7XG5pbXBvcnQge2RpZmZXb3JkcywgZGlmZldvcmRzV2l0aFNwYWNlfSBmcm9tICcuL2RpZmYvd29yZCc7XG5pbXBvcnQge2RpZmZMaW5lcywgZGlmZlRyaW1tZWRMaW5lc30gZnJvbSAnLi9kaWZmL2xpbmUnO1xuaW1wb3J0IHtkaWZmU2VudGVuY2VzfSBmcm9tICcuL2RpZmYvc2VudGVuY2UnO1xuXG5pbXBvcnQge2RpZmZDc3N9IGZyb20gJy4vZGlmZi9jc3MnO1xuaW1wb3J0IHtkaWZmSnNvbiwgY2Fub25pY2FsaXplfSBmcm9tICcuL2RpZmYvanNvbic7XG5cbmltcG9ydCB7ZGlmZkFycmF5c30gZnJvbSAnLi9kaWZmL2FycmF5JztcblxuaW1wb3J0IHthcHBseVBhdGNoLCBhcHBseVBhdGNoZXN9IGZyb20gJy4vcGF0Y2gvYXBwbHknO1xuaW1wb3J0IHtwYXJzZVBhdGNofSBmcm9tICcuL3BhdGNoL3BhcnNlJztcbmltcG9ydCB7c3RydWN0dXJlZFBhdGNoLCBjcmVhdGVUd29GaWxlc1BhdGNoLCBjcmVhdGVQYXRjaH0gZnJvbSAnLi9wYXRjaC9jcmVhdGUnO1xuXG5pbXBvcnQge2NvbnZlcnRDaGFuZ2VzVG9ETVB9IGZyb20gJy4vY29udmVydC9kbXAnO1xuaW1wb3J0IHtjb252ZXJ0Q2hhbmdlc1RvWE1MfSBmcm9tICcuL2NvbnZlcnQveG1sJztcblxuZXhwb3J0IHtcbiAgRGlmZixcblxuICBkaWZmQ2hhcnMsXG4gIGRpZmZXb3JkcyxcbiAgZGlmZldvcmRzV2l0aFNwYWNlLFxuICBkaWZmTGluZXMsXG4gIGRpZmZUcmltbWVkTGluZXMsXG4gIGRpZmZTZW50ZW5jZXMsXG5cbiAgZGlmZkNzcyxcbiAgZGlmZkpzb24sXG5cbiAgZGlmZkFycmF5cyxcblxuICBzdHJ1Y3R1cmVkUGF0Y2gsXG4gIGNyZWF0ZVR3b0ZpbGVzUGF0Y2gsXG4gIGNyZWF0ZVBhdGNoLFxuICBhcHBseVBhdGNoLFxuICBhcHBseVBhdGNoZXMsXG4gIHBhcnNlUGF0Y2gsXG4gIGNvbnZlcnRDaGFuZ2VzVG9ETVAsXG4gIGNvbnZlcnRDaGFuZ2VzVG9YTUwsXG4gIGNhbm9uaWNhbGl6ZVxufTtcbiIsImltcG9ydCB7cGFyc2VQYXRjaH0gZnJvbSAnLi9wYXJzZSc7XG5pbXBvcnQgZGlzdGFuY2VJdGVyYXRvciBmcm9tICcuLi91dGlsL2Rpc3RhbmNlLWl0ZXJhdG9yJztcblxuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5UGF0Y2goc291cmNlLCB1bmlEaWZmLCBvcHRpb25zID0ge30pIHtcbiAgaWYgKHR5cGVvZiB1bmlEaWZmID09PSAnc3RyaW5nJykge1xuICAgIHVuaURpZmYgPSBwYXJzZVBhdGNoKHVuaURpZmYpO1xuICB9XG5cbiAgaWYgKEFycmF5LmlzQXJyYXkodW5pRGlmZikpIHtcbiAgICBpZiAodW5pRGlmZi5sZW5ndGggPiAxKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2FwcGx5UGF0Y2ggb25seSB3b3JrcyB3aXRoIGEgc2luZ2xlIGlucHV0LicpO1xuICAgIH1cblxuICAgIHVuaURpZmYgPSB1bmlEaWZmWzBdO1xuICB9XG5cbiAgLy8gQXBwbHkgdGhlIGRpZmYgdG8gdGhlIGlucHV0XG4gIGxldCBsaW5lcyA9IHNvdXJjZS5zcGxpdCgvXFxyXFxufFtcXG5cXHZcXGZcXHJcXHg4NV0vKSxcbiAgICAgIGRlbGltaXRlcnMgPSBzb3VyY2UubWF0Y2goL1xcclxcbnxbXFxuXFx2XFxmXFxyXFx4ODVdL2cpIHx8IFtdLFxuICAgICAgaHVua3MgPSB1bmlEaWZmLmh1bmtzLFxuXG4gICAgICBjb21wYXJlTGluZSA9IG9wdGlvbnMuY29tcGFyZUxpbmUgfHwgKChsaW5lTnVtYmVyLCBsaW5lLCBvcGVyYXRpb24sIHBhdGNoQ29udGVudCkgPT4gbGluZSA9PT0gcGF0Y2hDb250ZW50KSxcbiAgICAgIGVycm9yQ291bnQgPSAwLFxuICAgICAgZnV6ekZhY3RvciA9IG9wdGlvbnMuZnV6ekZhY3RvciB8fCAwLFxuICAgICAgbWluTGluZSA9IDAsXG4gICAgICBvZmZzZXQgPSAwLFxuXG4gICAgICByZW1vdmVFT0ZOTCxcbiAgICAgIGFkZEVPRk5MO1xuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhlIGh1bmsgZXhhY3RseSBmaXRzIG9uIHRoZSBwcm92aWRlZCBsb2NhdGlvblxuICAgKi9cbiAgZnVuY3Rpb24gaHVua0ZpdHMoaHVuaywgdG9Qb3MpIHtcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IGh1bmsubGluZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgIGxldCBsaW5lID0gaHVuay5saW5lc1tqXSxcbiAgICAgICAgICBvcGVyYXRpb24gPSBsaW5lWzBdLFxuICAgICAgICAgIGNvbnRlbnQgPSBsaW5lLnN1YnN0cigxKTtcblxuICAgICAgaWYgKG9wZXJhdGlvbiA9PT0gJyAnIHx8IG9wZXJhdGlvbiA9PT0gJy0nKSB7XG4gICAgICAgIC8vIENvbnRleHQgc2FuaXR5IGNoZWNrXG4gICAgICAgIGlmICghY29tcGFyZUxpbmUodG9Qb3MgKyAxLCBsaW5lc1t0b1Bvc10sIG9wZXJhdGlvbiwgY29udGVudCkpIHtcbiAgICAgICAgICBlcnJvckNvdW50Kys7XG5cbiAgICAgICAgICBpZiAoZXJyb3JDb3VudCA+IGZ1enpGYWN0b3IpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdG9Qb3MrKztcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8vIFNlYXJjaCBiZXN0IGZpdCBvZmZzZXRzIGZvciBlYWNoIGh1bmsgYmFzZWQgb24gdGhlIHByZXZpb3VzIG9uZXNcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBodW5rcy5sZW5ndGg7IGkrKykge1xuICAgIGxldCBodW5rID0gaHVua3NbaV0sXG4gICAgICAgIG1heExpbmUgPSBsaW5lcy5sZW5ndGggLSBodW5rLm9sZExpbmVzLFxuICAgICAgICBsb2NhbE9mZnNldCA9IDAsXG4gICAgICAgIHRvUG9zID0gb2Zmc2V0ICsgaHVuay5vbGRTdGFydCAtIDE7XG5cbiAgICBsZXQgaXRlcmF0b3IgPSBkaXN0YW5jZUl0ZXJhdG9yKHRvUG9zLCBtaW5MaW5lLCBtYXhMaW5lKTtcblxuICAgIGZvciAoOyBsb2NhbE9mZnNldCAhPT0gdW5kZWZpbmVkOyBsb2NhbE9mZnNldCA9IGl0ZXJhdG9yKCkpIHtcbiAgICAgIGlmIChodW5rRml0cyhodW5rLCB0b1BvcyArIGxvY2FsT2Zmc2V0KSkge1xuICAgICAgICBodW5rLm9mZnNldCA9IG9mZnNldCArPSBsb2NhbE9mZnNldDtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGxvY2FsT2Zmc2V0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBTZXQgbG93ZXIgdGV4dCBsaW1pdCB0byBlbmQgb2YgdGhlIGN1cnJlbnQgaHVuaywgc28gbmV4dCBvbmVzIGRvbid0IHRyeVxuICAgIC8vIHRvIGZpdCBvdmVyIGFscmVhZHkgcGF0Y2hlZCB0ZXh0XG4gICAgbWluTGluZSA9IGh1bmsub2Zmc2V0ICsgaHVuay5vbGRTdGFydCArIGh1bmsub2xkTGluZXM7XG4gIH1cblxuICAvLyBBcHBseSBwYXRjaCBodW5rc1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGh1bmtzLmxlbmd0aDsgaSsrKSB7XG4gICAgbGV0IGh1bmsgPSBodW5rc1tpXSxcbiAgICAgICAgdG9Qb3MgPSBodW5rLm9mZnNldCArIGh1bmsubmV3U3RhcnQgLSAxO1xuICAgIGlmIChodW5rLm5ld0xpbmVzID09IDApIHsgdG9Qb3MrKzsgfVxuXG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBodW5rLmxpbmVzLmxlbmd0aDsgaisrKSB7XG4gICAgICBsZXQgbGluZSA9IGh1bmsubGluZXNbal0sXG4gICAgICAgICAgb3BlcmF0aW9uID0gbGluZVswXSxcbiAgICAgICAgICBjb250ZW50ID0gbGluZS5zdWJzdHIoMSksXG4gICAgICAgICAgZGVsaW1pdGVyID0gaHVuay5saW5lZGVsaW1pdGVyc1tqXTtcblxuICAgICAgaWYgKG9wZXJhdGlvbiA9PT0gJyAnKSB7XG4gICAgICAgIHRvUG9zKys7XG4gICAgICB9IGVsc2UgaWYgKG9wZXJhdGlvbiA9PT0gJy0nKSB7XG4gICAgICAgIGxpbmVzLnNwbGljZSh0b1BvcywgMSk7XG4gICAgICAgIGRlbGltaXRlcnMuc3BsaWNlKHRvUG9zLCAxKTtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBlbHNlICovXG4gICAgICB9IGVsc2UgaWYgKG9wZXJhdGlvbiA9PT0gJysnKSB7XG4gICAgICAgIGxpbmVzLnNwbGljZSh0b1BvcywgMCwgY29udGVudCk7XG4gICAgICAgIGRlbGltaXRlcnMuc3BsaWNlKHRvUG9zLCAwLCBkZWxpbWl0ZXIpO1xuICAgICAgICB0b1BvcysrO1xuICAgICAgfSBlbHNlIGlmIChvcGVyYXRpb24gPT09ICdcXFxcJykge1xuICAgICAgICBsZXQgcHJldmlvdXNPcGVyYXRpb24gPSBodW5rLmxpbmVzW2ogLSAxXSA/IGh1bmsubGluZXNbaiAtIDFdWzBdIDogbnVsbDtcbiAgICAgICAgaWYgKHByZXZpb3VzT3BlcmF0aW9uID09PSAnKycpIHtcbiAgICAgICAgICByZW1vdmVFT0ZOTCA9IHRydWU7XG4gICAgICAgIH0gZWxzZSBpZiAocHJldmlvdXNPcGVyYXRpb24gPT09ICctJykge1xuICAgICAgICAgIGFkZEVPRk5MID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIEhhbmRsZSBFT0ZOTCBpbnNlcnRpb24vcmVtb3ZhbFxuICBpZiAocmVtb3ZlRU9GTkwpIHtcbiAgICB3aGlsZSAoIWxpbmVzW2xpbmVzLmxlbmd0aCAtIDFdKSB7XG4gICAgICBsaW5lcy5wb3AoKTtcbiAgICAgIGRlbGltaXRlcnMucG9wKCk7XG4gICAgfVxuICB9IGVsc2UgaWYgKGFkZEVPRk5MKSB7XG4gICAgbGluZXMucHVzaCgnJyk7XG4gICAgZGVsaW1pdGVycy5wdXNoKCdcXG4nKTtcbiAgfVxuICBmb3IgKGxldCBfayA9IDA7IF9rIDwgbGluZXMubGVuZ3RoIC0gMTsgX2srKykge1xuICAgIGxpbmVzW19rXSA9IGxpbmVzW19rXSArIGRlbGltaXRlcnNbX2tdO1xuICB9XG4gIHJldHVybiBsaW5lcy5qb2luKCcnKTtcbn1cblxuLy8gV3JhcHBlciB0aGF0IHN1cHBvcnRzIG11bHRpcGxlIGZpbGUgcGF0Y2hlcyB2aWEgY2FsbGJhY2tzLlxuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5UGF0Y2hlcyh1bmlEaWZmLCBvcHRpb25zKSB7XG4gIGlmICh0eXBlb2YgdW5pRGlmZiA9PT0gJ3N0cmluZycpIHtcbiAgICB1bmlEaWZmID0gcGFyc2VQYXRjaCh1bmlEaWZmKTtcbiAgfVxuXG4gIGxldCBjdXJyZW50SW5kZXggPSAwO1xuICBmdW5jdGlvbiBwcm9jZXNzSW5kZXgoKSB7XG4gICAgbGV0IGluZGV4ID0gdW5pRGlmZltjdXJyZW50SW5kZXgrK107XG4gICAgaWYgKCFpbmRleCkge1xuICAgICAgcmV0dXJuIG9wdGlvbnMuY29tcGxldGUoKTtcbiAgICB9XG5cbiAgICBvcHRpb25zLmxvYWRGaWxlKGluZGV4LCBmdW5jdGlvbihlcnIsIGRhdGEpIHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgcmV0dXJuIG9wdGlvbnMuY29tcGxldGUoZXJyKTtcbiAgICAgIH1cblxuICAgICAgbGV0IHVwZGF0ZWRDb250ZW50ID0gYXBwbHlQYXRjaChkYXRhLCBpbmRleCwgb3B0aW9ucyk7XG4gICAgICBvcHRpb25zLnBhdGNoZWQoaW5kZXgsIHVwZGF0ZWRDb250ZW50LCBmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIHJldHVybiBvcHRpb25zLmNvbXBsZXRlKGVycik7XG4gICAgICAgIH1cblxuICAgICAgICBwcm9jZXNzSW5kZXgoKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIHByb2Nlc3NJbmRleCgpO1xufVxuIiwiaW1wb3J0IHtkaWZmTGluZXN9IGZyb20gJy4uL2RpZmYvbGluZSc7XG5cbmV4cG9ydCBmdW5jdGlvbiBzdHJ1Y3R1cmVkUGF0Y2gob2xkRmlsZU5hbWUsIG5ld0ZpbGVOYW1lLCBvbGRTdHIsIG5ld1N0ciwgb2xkSGVhZGVyLCBuZXdIZWFkZXIsIG9wdGlvbnMpIHtcbiAgaWYgKCFvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IHt9O1xuICB9XG4gIGlmICh0eXBlb2Ygb3B0aW9ucy5jb250ZXh0ID09PSAndW5kZWZpbmVkJykge1xuICAgIG9wdGlvbnMuY29udGV4dCA9IDQ7XG4gIH1cblxuICBjb25zdCBkaWZmID0gZGlmZkxpbmVzKG9sZFN0ciwgbmV3U3RyLCBvcHRpb25zKTtcbiAgZGlmZi5wdXNoKHt2YWx1ZTogJycsIGxpbmVzOiBbXX0pOyAgIC8vIEFwcGVuZCBhbiBlbXB0eSB2YWx1ZSB0byBtYWtlIGNsZWFudXAgZWFzaWVyXG5cbiAgZnVuY3Rpb24gY29udGV4dExpbmVzKGxpbmVzKSB7XG4gICAgcmV0dXJuIGxpbmVzLm1hcChmdW5jdGlvbihlbnRyeSkgeyByZXR1cm4gJyAnICsgZW50cnk7IH0pO1xuICB9XG5cbiAgbGV0IGh1bmtzID0gW107XG4gIGxldCBvbGRSYW5nZVN0YXJ0ID0gMCwgbmV3UmFuZ2VTdGFydCA9IDAsIGN1clJhbmdlID0gW10sXG4gICAgICBvbGRMaW5lID0gMSwgbmV3TGluZSA9IDE7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZGlmZi5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGN1cnJlbnQgPSBkaWZmW2ldLFxuICAgICAgICAgIGxpbmVzID0gY3VycmVudC5saW5lcyB8fCBjdXJyZW50LnZhbHVlLnJlcGxhY2UoL1xcbiQvLCAnJykuc3BsaXQoJ1xcbicpO1xuICAgIGN1cnJlbnQubGluZXMgPSBsaW5lcztcblxuICAgIGlmIChjdXJyZW50LmFkZGVkIHx8IGN1cnJlbnQucmVtb3ZlZCkge1xuICAgICAgLy8gSWYgd2UgaGF2ZSBwcmV2aW91cyBjb250ZXh0LCBzdGFydCB3aXRoIHRoYXRcbiAgICAgIGlmICghb2xkUmFuZ2VTdGFydCkge1xuICAgICAgICBjb25zdCBwcmV2ID0gZGlmZltpIC0gMV07XG4gICAgICAgIG9sZFJhbmdlU3RhcnQgPSBvbGRMaW5lO1xuICAgICAgICBuZXdSYW5nZVN0YXJ0ID0gbmV3TGluZTtcblxuICAgICAgICBpZiAocHJldikge1xuICAgICAgICAgIGN1clJhbmdlID0gb3B0aW9ucy5jb250ZXh0ID4gMCA/IGNvbnRleHRMaW5lcyhwcmV2LmxpbmVzLnNsaWNlKC1vcHRpb25zLmNvbnRleHQpKSA6IFtdO1xuICAgICAgICAgIG9sZFJhbmdlU3RhcnQgLT0gY3VyUmFuZ2UubGVuZ3RoO1xuICAgICAgICAgIG5ld1JhbmdlU3RhcnQgLT0gY3VyUmFuZ2UubGVuZ3RoO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIE91dHB1dCBvdXIgY2hhbmdlc1xuICAgICAgY3VyUmFuZ2UucHVzaCguLi4gbGluZXMubWFwKGZ1bmN0aW9uKGVudHJ5KSB7XG4gICAgICAgIHJldHVybiAoY3VycmVudC5hZGRlZCA/ICcrJyA6ICctJykgKyBlbnRyeTtcbiAgICAgIH0pKTtcblxuICAgICAgLy8gVHJhY2sgdGhlIHVwZGF0ZWQgZmlsZSBwb3NpdGlvblxuICAgICAgaWYgKGN1cnJlbnQuYWRkZWQpIHtcbiAgICAgICAgbmV3TGluZSArPSBsaW5lcy5sZW5ndGg7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvbGRMaW5lICs9IGxpbmVzLmxlbmd0aDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gSWRlbnRpY2FsIGNvbnRleHQgbGluZXMuIFRyYWNrIGxpbmUgY2hhbmdlc1xuICAgICAgaWYgKG9sZFJhbmdlU3RhcnQpIHtcbiAgICAgICAgLy8gQ2xvc2Ugb3V0IGFueSBjaGFuZ2VzIHRoYXQgaGF2ZSBiZWVuIG91dHB1dCAob3Igam9pbiBvdmVybGFwcGluZylcbiAgICAgICAgaWYgKGxpbmVzLmxlbmd0aCA8PSBvcHRpb25zLmNvbnRleHQgKiAyICYmIGkgPCBkaWZmLmxlbmd0aCAtIDIpIHtcbiAgICAgICAgICAvLyBPdmVybGFwcGluZ1xuICAgICAgICAgIGN1clJhbmdlLnB1c2goLi4uIGNvbnRleHRMaW5lcyhsaW5lcykpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIGVuZCB0aGUgcmFuZ2UgYW5kIG91dHB1dFxuICAgICAgICAgIGxldCBjb250ZXh0U2l6ZSA9IE1hdGgubWluKGxpbmVzLmxlbmd0aCwgb3B0aW9ucy5jb250ZXh0KTtcbiAgICAgICAgICBjdXJSYW5nZS5wdXNoKC4uLiBjb250ZXh0TGluZXMobGluZXMuc2xpY2UoMCwgY29udGV4dFNpemUpKSk7XG5cbiAgICAgICAgICBsZXQgaHVuayA9IHtcbiAgICAgICAgICAgIG9sZFN0YXJ0OiBvbGRSYW5nZVN0YXJ0LFxuICAgICAgICAgICAgb2xkTGluZXM6IChvbGRMaW5lIC0gb2xkUmFuZ2VTdGFydCArIGNvbnRleHRTaXplKSxcbiAgICAgICAgICAgIG5ld1N0YXJ0OiBuZXdSYW5nZVN0YXJ0LFxuICAgICAgICAgICAgbmV3TGluZXM6IChuZXdMaW5lIC0gbmV3UmFuZ2VTdGFydCArIGNvbnRleHRTaXplKSxcbiAgICAgICAgICAgIGxpbmVzOiBjdXJSYW5nZVxuICAgICAgICAgIH07XG4gICAgICAgICAgaWYgKGkgPj0gZGlmZi5sZW5ndGggLSAyICYmIGxpbmVzLmxlbmd0aCA8PSBvcHRpb25zLmNvbnRleHQpIHtcbiAgICAgICAgICAgIC8vIEVPRiBpcyBpbnNpZGUgdGhpcyBodW5rXG4gICAgICAgICAgICBsZXQgb2xkRU9GTmV3bGluZSA9ICgvXFxuJC8udGVzdChvbGRTdHIpKTtcbiAgICAgICAgICAgIGxldCBuZXdFT0ZOZXdsaW5lID0gKC9cXG4kLy50ZXN0KG5ld1N0cikpO1xuICAgICAgICAgICAgaWYgKGxpbmVzLmxlbmd0aCA9PSAwICYmICFvbGRFT0ZOZXdsaW5lKSB7XG4gICAgICAgICAgICAgIC8vIHNwZWNpYWwgY2FzZTogb2xkIGhhcyBubyBlb2wgYW5kIG5vIHRyYWlsaW5nIGNvbnRleHQ7IG5vLW5sIGNhbiBlbmQgdXAgYmVmb3JlIGFkZHNcbiAgICAgICAgICAgICAgY3VyUmFuZ2Uuc3BsaWNlKGh1bmsub2xkTGluZXMsIDAsICdcXFxcIE5vIG5ld2xpbmUgYXQgZW5kIG9mIGZpbGUnKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIW9sZEVPRk5ld2xpbmUgfHwgIW5ld0VPRk5ld2xpbmUpIHtcbiAgICAgICAgICAgICAgY3VyUmFuZ2UucHVzaCgnXFxcXCBObyBuZXdsaW5lIGF0IGVuZCBvZiBmaWxlJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGh1bmtzLnB1c2goaHVuayk7XG5cbiAgICAgICAgICBvbGRSYW5nZVN0YXJ0ID0gMDtcbiAgICAgICAgICBuZXdSYW5nZVN0YXJ0ID0gMDtcbiAgICAgICAgICBjdXJSYW5nZSA9IFtdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBvbGRMaW5lICs9IGxpbmVzLmxlbmd0aDtcbiAgICAgIG5ld0xpbmUgKz0gbGluZXMubGVuZ3RoO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB7XG4gICAgb2xkRmlsZU5hbWU6IG9sZEZpbGVOYW1lLCBuZXdGaWxlTmFtZTogbmV3RmlsZU5hbWUsXG4gICAgb2xkSGVhZGVyOiBvbGRIZWFkZXIsIG5ld0hlYWRlcjogbmV3SGVhZGVyLFxuICAgIGh1bmtzOiBodW5rc1xuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVHdvRmlsZXNQYXRjaChvbGRGaWxlTmFtZSwgbmV3RmlsZU5hbWUsIG9sZFN0ciwgbmV3U3RyLCBvbGRIZWFkZXIsIG5ld0hlYWRlciwgb3B0aW9ucykge1xuICBjb25zdCBkaWZmID0gc3RydWN0dXJlZFBhdGNoKG9sZEZpbGVOYW1lLCBuZXdGaWxlTmFtZSwgb2xkU3RyLCBuZXdTdHIsIG9sZEhlYWRlciwgbmV3SGVhZGVyLCBvcHRpb25zKTtcblxuICBjb25zdCByZXQgPSBbXTtcbiAgaWYgKG9sZEZpbGVOYW1lID09IG5ld0ZpbGVOYW1lKSB7XG4gICAgcmV0LnB1c2goJ0luZGV4OiAnICsgb2xkRmlsZU5hbWUpO1xuICB9XG4gIHJldC5wdXNoKCc9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09Jyk7XG4gIHJldC5wdXNoKCctLS0gJyArIGRpZmYub2xkRmlsZU5hbWUgKyAodHlwZW9mIGRpZmYub2xkSGVhZGVyID09PSAndW5kZWZpbmVkJyA/ICcnIDogJ1xcdCcgKyBkaWZmLm9sZEhlYWRlcikpO1xuICByZXQucHVzaCgnKysrICcgKyBkaWZmLm5ld0ZpbGVOYW1lICsgKHR5cGVvZiBkaWZmLm5ld0hlYWRlciA9PT0gJ3VuZGVmaW5lZCcgPyAnJyA6ICdcXHQnICsgZGlmZi5uZXdIZWFkZXIpKTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGRpZmYuaHVua3MubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBodW5rID0gZGlmZi5odW5rc1tpXTtcbiAgICByZXQucHVzaChcbiAgICAgICdAQCAtJyArIGh1bmsub2xkU3RhcnQgKyAnLCcgKyBodW5rLm9sZExpbmVzXG4gICAgICArICcgKycgKyBodW5rLm5ld1N0YXJ0ICsgJywnICsgaHVuay5uZXdMaW5lc1xuICAgICAgKyAnIEBAJ1xuICAgICk7XG4gICAgcmV0LnB1c2guYXBwbHkocmV0LCBodW5rLmxpbmVzKTtcbiAgfVxuXG4gIHJldHVybiByZXQuam9pbignXFxuJykgKyAnXFxuJztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVBhdGNoKGZpbGVOYW1lLCBvbGRTdHIsIG5ld1N0ciwgb2xkSGVhZGVyLCBuZXdIZWFkZXIsIG9wdGlvbnMpIHtcbiAgcmV0dXJuIGNyZWF0ZVR3b0ZpbGVzUGF0Y2goZmlsZU5hbWUsIGZpbGVOYW1lLCBvbGRTdHIsIG5ld1N0ciwgb2xkSGVhZGVyLCBuZXdIZWFkZXIsIG9wdGlvbnMpO1xufVxuIiwiZXhwb3J0IGZ1bmN0aW9uIHBhcnNlUGF0Y2godW5pRGlmZiwgb3B0aW9ucyA9IHt9KSB7XG4gIGxldCBkaWZmc3RyID0gdW5pRGlmZi5zcGxpdCgvXFxyXFxufFtcXG5cXHZcXGZcXHJcXHg4NV0vKSxcbiAgICAgIGRlbGltaXRlcnMgPSB1bmlEaWZmLm1hdGNoKC9cXHJcXG58W1xcblxcdlxcZlxcclxceDg1XS9nKSB8fCBbXSxcbiAgICAgIGxpc3QgPSBbXSxcbiAgICAgIGkgPSAwO1xuXG4gIGZ1bmN0aW9uIHBhcnNlSW5kZXgoKSB7XG4gICAgbGV0IGluZGV4ID0ge307XG4gICAgbGlzdC5wdXNoKGluZGV4KTtcblxuICAgIC8vIFBhcnNlIGRpZmYgbWV0YWRhdGFcbiAgICB3aGlsZSAoaSA8IGRpZmZzdHIubGVuZ3RoKSB7XG4gICAgICBsZXQgbGluZSA9IGRpZmZzdHJbaV07XG5cbiAgICAgIC8vIEZpbGUgaGVhZGVyIGZvdW5kLCBlbmQgcGFyc2luZyBkaWZmIG1ldGFkYXRhXG4gICAgICBpZiAoL14oXFwtXFwtXFwtfFxcK1xcK1xcK3xAQClcXHMvLnRlc3QobGluZSkpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIC8vIERpZmYgaW5kZXhcbiAgICAgIGxldCBoZWFkZXIgPSAoL14oPzpJbmRleDp8ZGlmZig/OiAtciBcXHcrKSspXFxzKyguKz8pXFxzKiQvKS5leGVjKGxpbmUpO1xuICAgICAgaWYgKGhlYWRlcikge1xuICAgICAgICBpbmRleC5pbmRleCA9IGhlYWRlclsxXTtcbiAgICAgIH1cblxuICAgICAgaSsrO1xuICAgIH1cblxuICAgIC8vIFBhcnNlIGZpbGUgaGVhZGVycyBpZiB0aGV5IGFyZSBkZWZpbmVkLiBVbmlmaWVkIGRpZmYgcmVxdWlyZXMgdGhlbSwgYnV0XG4gICAgLy8gdGhlcmUncyBubyB0ZWNobmljYWwgaXNzdWVzIHRvIGhhdmUgYW4gaXNvbGF0ZWQgaHVuayB3aXRob3V0IGZpbGUgaGVhZGVyXG4gICAgcGFyc2VGaWxlSGVhZGVyKGluZGV4KTtcbiAgICBwYXJzZUZpbGVIZWFkZXIoaW5kZXgpO1xuXG4gICAgLy8gUGFyc2UgaHVua3NcbiAgICBpbmRleC5odW5rcyA9IFtdO1xuXG4gICAgd2hpbGUgKGkgPCBkaWZmc3RyLmxlbmd0aCkge1xuICAgICAgbGV0IGxpbmUgPSBkaWZmc3RyW2ldO1xuXG4gICAgICBpZiAoL14oSW5kZXg6fGRpZmZ8XFwtXFwtXFwtfFxcK1xcK1xcKylcXHMvLnRlc3QobGluZSkpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9IGVsc2UgaWYgKC9eQEAvLnRlc3QobGluZSkpIHtcbiAgICAgICAgaW5kZXguaHVua3MucHVzaChwYXJzZUh1bmsoKSk7XG4gICAgICB9IGVsc2UgaWYgKGxpbmUgJiYgb3B0aW9ucy5zdHJpY3QpIHtcbiAgICAgICAgLy8gSWdub3JlIHVuZXhwZWN0ZWQgY29udGVudCB1bmxlc3MgaW4gc3RyaWN0IG1vZGVcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIGxpbmUgJyArIChpICsgMSkgKyAnICcgKyBKU09OLnN0cmluZ2lmeShsaW5lKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpKys7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gUGFyc2VzIHRoZSAtLS0gYW5kICsrKyBoZWFkZXJzLCBpZiBub25lIGFyZSBmb3VuZCwgbm8gbGluZXNcbiAgLy8gYXJlIGNvbnN1bWVkLlxuICBmdW5jdGlvbiBwYXJzZUZpbGVIZWFkZXIoaW5kZXgpIHtcbiAgICBjb25zdCBoZWFkZXJQYXR0ZXJuID0gL14oLS0tfFxcK1xcK1xcKylcXHMrKFtcXFMgXSopKD86XFx0KC4qPylcXHMqKT8kLztcbiAgICBjb25zdCBmaWxlSGVhZGVyID0gaGVhZGVyUGF0dGVybi5leGVjKGRpZmZzdHJbaV0pO1xuICAgIGlmIChmaWxlSGVhZGVyKSB7XG4gICAgICBsZXQga2V5UHJlZml4ID0gZmlsZUhlYWRlclsxXSA9PT0gJy0tLScgPyAnb2xkJyA6ICduZXcnO1xuICAgICAgaW5kZXhba2V5UHJlZml4ICsgJ0ZpbGVOYW1lJ10gPSBmaWxlSGVhZGVyWzJdO1xuICAgICAgaW5kZXhba2V5UHJlZml4ICsgJ0hlYWRlciddID0gZmlsZUhlYWRlclszXTtcblxuICAgICAgaSsrO1xuICAgIH1cbiAgfVxuXG4gIC8vIFBhcnNlcyBhIGh1bmtcbiAgLy8gVGhpcyBhc3N1bWVzIHRoYXQgd2UgYXJlIGF0IHRoZSBzdGFydCBvZiBhIGh1bmsuXG4gIGZ1bmN0aW9uIHBhcnNlSHVuaygpIHtcbiAgICBsZXQgY2h1bmtIZWFkZXJJbmRleCA9IGksXG4gICAgICAgIGNodW5rSGVhZGVyTGluZSA9IGRpZmZzdHJbaSsrXSxcbiAgICAgICAgY2h1bmtIZWFkZXIgPSBjaHVua0hlYWRlckxpbmUuc3BsaXQoL0BAIC0oXFxkKykoPzosKFxcZCspKT8gXFwrKFxcZCspKD86LChcXGQrKSk/IEBALyk7XG5cbiAgICBsZXQgaHVuayA9IHtcbiAgICAgIG9sZFN0YXJ0OiArY2h1bmtIZWFkZXJbMV0sXG4gICAgICBvbGRMaW5lczogK2NodW5rSGVhZGVyWzJdIHx8IDEsXG4gICAgICBuZXdTdGFydDogK2NodW5rSGVhZGVyWzNdLFxuICAgICAgbmV3TGluZXM6ICtjaHVua0hlYWRlcls0XSB8fCAxLFxuICAgICAgbGluZXM6IFtdLFxuICAgICAgbGluZWRlbGltaXRlcnM6IFtdXG4gICAgfTtcblxuICAgIGxldCBhZGRDb3VudCA9IDAsXG4gICAgICAgIHJlbW92ZUNvdW50ID0gMDtcbiAgICBmb3IgKDsgaSA8IGRpZmZzdHIubGVuZ3RoOyBpKyspIHtcbiAgICAgIC8vIExpbmVzIHN0YXJ0aW5nIHdpdGggJy0tLScgY291bGQgYmUgbWlzdGFrZW4gZm9yIHRoZSBcInJlbW92ZSBsaW5lXCIgb3BlcmF0aW9uXG4gICAgICAvLyBCdXQgdGhleSBjb3VsZCBiZSB0aGUgaGVhZGVyIGZvciB0aGUgbmV4dCBmaWxlLiBUaGVyZWZvcmUgcHJ1bmUgc3VjaCBjYXNlcyBvdXQuXG4gICAgICBpZiAoZGlmZnN0cltpXS5pbmRleE9mKCctLS0gJykgPT09IDBcbiAgICAgICAgICAgICYmIChpICsgMiA8IGRpZmZzdHIubGVuZ3RoKVxuICAgICAgICAgICAgJiYgZGlmZnN0cltpICsgMV0uaW5kZXhPZignKysrICcpID09PSAwXG4gICAgICAgICAgICAmJiBkaWZmc3RyW2kgKyAyXS5pbmRleE9mKCdAQCcpID09PSAwKSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBsZXQgb3BlcmF0aW9uID0gZGlmZnN0cltpXVswXTtcblxuICAgICAgaWYgKG9wZXJhdGlvbiA9PT0gJysnIHx8IG9wZXJhdGlvbiA9PT0gJy0nIHx8IG9wZXJhdGlvbiA9PT0gJyAnIHx8IG9wZXJhdGlvbiA9PT0gJ1xcXFwnKSB7XG4gICAgICAgIGh1bmsubGluZXMucHVzaChkaWZmc3RyW2ldKTtcbiAgICAgICAgaHVuay5saW5lZGVsaW1pdGVycy5wdXNoKGRlbGltaXRlcnNbaV0gfHwgJ1xcbicpO1xuXG4gICAgICAgIGlmIChvcGVyYXRpb24gPT09ICcrJykge1xuICAgICAgICAgIGFkZENvdW50Kys7XG4gICAgICAgIH0gZWxzZSBpZiAob3BlcmF0aW9uID09PSAnLScpIHtcbiAgICAgICAgICByZW1vdmVDb3VudCsrO1xuICAgICAgICB9IGVsc2UgaWYgKG9wZXJhdGlvbiA9PT0gJyAnKSB7XG4gICAgICAgICAgYWRkQ291bnQrKztcbiAgICAgICAgICByZW1vdmVDb3VudCsrO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBIYW5kbGUgdGhlIGVtcHR5IGJsb2NrIGNvdW50IGNhc2VcbiAgICBpZiAoIWFkZENvdW50ICYmIGh1bmsubmV3TGluZXMgPT09IDEpIHtcbiAgICAgIGh1bmsubmV3TGluZXMgPSAwO1xuICAgIH1cbiAgICBpZiAoIXJlbW92ZUNvdW50ICYmIGh1bmsub2xkTGluZXMgPT09IDEpIHtcbiAgICAgIGh1bmsub2xkTGluZXMgPSAwO1xuICAgIH1cblxuICAgIC8vIFBlcmZvcm0gb3B0aW9uYWwgc2FuaXR5IGNoZWNraW5nXG4gICAgaWYgKG9wdGlvbnMuc3RyaWN0KSB7XG4gICAgICBpZiAoYWRkQ291bnQgIT09IGh1bmsubmV3TGluZXMpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdBZGRlZCBsaW5lIGNvdW50IGRpZCBub3QgbWF0Y2ggZm9yIGh1bmsgYXQgbGluZSAnICsgKGNodW5rSGVhZGVySW5kZXggKyAxKSk7XG4gICAgICB9XG4gICAgICBpZiAocmVtb3ZlQ291bnQgIT09IGh1bmsub2xkTGluZXMpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdSZW1vdmVkIGxpbmUgY291bnQgZGlkIG5vdCBtYXRjaCBmb3IgaHVuayBhdCBsaW5lICcgKyAoY2h1bmtIZWFkZXJJbmRleCArIDEpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gaHVuaztcbiAgfVxuXG4gIHdoaWxlIChpIDwgZGlmZnN0ci5sZW5ndGgpIHtcbiAgICBwYXJzZUluZGV4KCk7XG4gIH1cblxuICByZXR1cm4gbGlzdDtcbn1cbiIsIi8vIEl0ZXJhdG9yIHRoYXQgdHJhdmVyc2VzIGluIHRoZSByYW5nZSBvZiBbbWluLCBtYXhdLCBzdGVwcGluZ1xuLy8gYnkgZGlzdGFuY2UgZnJvbSBhIGdpdmVuIHN0YXJ0IHBvc2l0aW9uLiBJLmUuIGZvciBbMCwgNF0sIHdpdGhcbi8vIHN0YXJ0IG9mIDIsIHRoaXMgd2lsbCBpdGVyYXRlIDIsIDMsIDEsIDQsIDAuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbihzdGFydCwgbWluTGluZSwgbWF4TGluZSkge1xuICBsZXQgd2FudEZvcndhcmQgPSB0cnVlLFxuICAgICAgYmFja3dhcmRFeGhhdXN0ZWQgPSBmYWxzZSxcbiAgICAgIGZvcndhcmRFeGhhdXN0ZWQgPSBmYWxzZSxcbiAgICAgIGxvY2FsT2Zmc2V0ID0gMTtcblxuICByZXR1cm4gZnVuY3Rpb24gaXRlcmF0b3IoKSB7XG4gICAgaWYgKHdhbnRGb3J3YXJkICYmICFmb3J3YXJkRXhoYXVzdGVkKSB7XG4gICAgICBpZiAoYmFja3dhcmRFeGhhdXN0ZWQpIHtcbiAgICAgICAgbG9jYWxPZmZzZXQrKztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHdhbnRGb3J3YXJkID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIC8vIENoZWNrIGlmIHRyeWluZyB0byBmaXQgYmV5b25kIHRleHQgbGVuZ3RoLCBhbmQgaWYgbm90LCBjaGVjayBpdCBmaXRzXG4gICAgICAvLyBhZnRlciBvZmZzZXQgbG9jYXRpb24gKG9yIGRlc2lyZWQgbG9jYXRpb24gb24gZmlyc3QgaXRlcmF0aW9uKVxuICAgICAgaWYgKHN0YXJ0ICsgbG9jYWxPZmZzZXQgPD0gbWF4TGluZSkge1xuICAgICAgICByZXR1cm4gbG9jYWxPZmZzZXQ7XG4gICAgICB9XG5cbiAgICAgIGZvcndhcmRFeGhhdXN0ZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIGlmICghYmFja3dhcmRFeGhhdXN0ZWQpIHtcbiAgICAgIGlmICghZm9yd2FyZEV4aGF1c3RlZCkge1xuICAgICAgICB3YW50Rm9yd2FyZCA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIC8vIENoZWNrIGlmIHRyeWluZyB0byBmaXQgYmVmb3JlIHRleHQgYmVnaW5uaW5nLCBhbmQgaWYgbm90LCBjaGVjayBpdCBmaXRzXG4gICAgICAvLyBiZWZvcmUgb2Zmc2V0IGxvY2F0aW9uXG4gICAgICBpZiAobWluTGluZSA8PSBzdGFydCAtIGxvY2FsT2Zmc2V0KSB7XG4gICAgICAgIHJldHVybiAtbG9jYWxPZmZzZXQrKztcbiAgICAgIH1cblxuICAgICAgYmFja3dhcmRFeGhhdXN0ZWQgPSB0cnVlO1xuICAgICAgcmV0dXJuIGl0ZXJhdG9yKCk7XG4gICAgfVxuXG4gICAgLy8gV2UgdHJpZWQgdG8gZml0IGh1bmsgYmVmb3JlIHRleHQgYmVnaW5uaW5nIGFuZCBiZXlvbmQgdGV4dCBsZW5naHQsIHRoZW5cbiAgICAvLyBodW5rIGNhbid0IGZpdCBvbiB0aGUgdGV4dC4gUmV0dXJuIHVuZGVmaW5lZFxuICB9O1xufVxuIiwiZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlT3B0aW9ucyhvcHRpb25zLCBkZWZhdWx0cykge1xuICBpZiAodHlwZW9mIG9wdGlvbnMgPT09ICdmdW5jdGlvbicpIHtcbiAgICBkZWZhdWx0cy5jYWxsYmFjayA9IG9wdGlvbnM7XG4gIH0gZWxzZSBpZiAob3B0aW9ucykge1xuICAgIGZvciAobGV0IG5hbWUgaW4gb3B0aW9ucykge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIGVsc2UgKi9cbiAgICAgIGlmIChvcHRpb25zLmhhc093blByb3BlcnR5KG5hbWUpKSB7XG4gICAgICAgIGRlZmF1bHRzW25hbWVdID0gb3B0aW9uc1tuYW1lXTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIGRlZmF1bHRzO1xufVxuIiwiXG52YXIgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcbnZhciB0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZm9yRWFjaCAob2JqLCBmbiwgY3R4KSB7XG4gICAgaWYgKHRvU3RyaW5nLmNhbGwoZm4pICE9PSAnW29iamVjdCBGdW5jdGlvbl0nKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ2l0ZXJhdG9yIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuICAgIH1cbiAgICB2YXIgbCA9IG9iai5sZW5ndGg7XG4gICAgaWYgKGwgPT09ICtsKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICBmbi5jYWxsKGN0eCwgb2JqW2ldLCBpLCBvYmopO1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZm9yICh2YXIgayBpbiBvYmopIHtcbiAgICAgICAgICAgIGlmIChoYXNPd24uY2FsbChvYmosIGspKSB7XG4gICAgICAgICAgICAgICAgZm4uY2FsbChjdHgsIG9ialtrXSwgaywgb2JqKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn07XG5cbiIsIlxudmFyIGluZGV4T2YgPSBbXS5pbmRleE9mO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGFyciwgb2JqKXtcbiAgaWYgKGluZGV4T2YpIHJldHVybiBhcnIuaW5kZXhPZihvYmopO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7ICsraSkge1xuICAgIGlmIChhcnJbaV0gPT09IG9iaikgcmV0dXJuIGk7XG4gIH1cbiAgcmV0dXJuIC0xO1xufTsiLCJtb2R1bGUuZXhwb3J0cyA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24gKGFycikge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGFycikgPT0gJ1tvYmplY3QgQXJyYXldJztcbn07XG4iLCIvKiEgSlNPTiB2My4zLjAgfCBodHRwOi8vYmVzdGllanMuZ2l0aHViLmlvL2pzb24zIHwgQ29weXJpZ2h0IDIwMTItMjAxNCwgS2l0IENhbWJyaWRnZSB8IGh0dHA6Ly9raXQubWl0LWxpY2Vuc2Uub3JnICovXG47KGZ1bmN0aW9uIChyb290KSB7XG4gIC8vIERldGVjdCB0aGUgYGRlZmluZWAgZnVuY3Rpb24gZXhwb3NlZCBieSBhc3luY2hyb25vdXMgbW9kdWxlIGxvYWRlcnMuIFRoZVxuICAvLyBzdHJpY3QgYGRlZmluZWAgY2hlY2sgaXMgbmVjZXNzYXJ5IGZvciBjb21wYXRpYmlsaXR5IHdpdGggYHIuanNgLlxuICB2YXIgaXNMb2FkZXIgPSB0eXBlb2YgZGVmaW5lID09PSBcImZ1bmN0aW9uXCIgJiYgZGVmaW5lLmFtZDtcblxuICAvLyBVc2UgdGhlIGBnbG9iYWxgIG9iamVjdCBleHBvc2VkIGJ5IE5vZGUgKGluY2x1ZGluZyBCcm93c2VyaWZ5IHZpYVxuICAvLyBgaW5zZXJ0LW1vZHVsZS1nbG9iYWxzYCksIE5hcndoYWwsIGFuZCBSaW5nbyBhcyB0aGUgZGVmYXVsdCBjb250ZXh0LlxuICAvLyBSaGlubyBleHBvcnRzIGEgYGdsb2JhbGAgZnVuY3Rpb24gaW5zdGVhZC5cbiAgdmFyIGZyZWVHbG9iYWwgPSB0eXBlb2YgZ2xvYmFsID09IFwib2JqZWN0XCIgJiYgZ2xvYmFsO1xuICBpZiAoZnJlZUdsb2JhbCAmJiAoZnJlZUdsb2JhbFtcImdsb2JhbFwiXSA9PT0gZnJlZUdsb2JhbCB8fCBmcmVlR2xvYmFsW1wid2luZG93XCJdID09PSBmcmVlR2xvYmFsKSkge1xuICAgIHJvb3QgPSBmcmVlR2xvYmFsO1xuICB9XG5cbiAgLy8gUHVibGljOiBJbml0aWFsaXplcyBKU09OIDMgdXNpbmcgdGhlIGdpdmVuIGBjb250ZXh0YCBvYmplY3QsIGF0dGFjaGluZyB0aGVcbiAgLy8gYHN0cmluZ2lmeWAgYW5kIGBwYXJzZWAgZnVuY3Rpb25zIHRvIHRoZSBzcGVjaWZpZWQgYGV4cG9ydHNgIG9iamVjdC5cbiAgZnVuY3Rpb24gcnVuSW5Db250ZXh0KGNvbnRleHQsIGV4cG9ydHMpIHtcbiAgICBjb250ZXh0IHx8IChjb250ZXh0ID0gcm9vdFtcIk9iamVjdFwiXSgpKTtcbiAgICBleHBvcnRzIHx8IChleHBvcnRzID0gcm9vdFtcIk9iamVjdFwiXSgpKTtcblxuICAgIC8vIE5hdGl2ZSBjb25zdHJ1Y3RvciBhbGlhc2VzLlxuICAgIHZhciBOdW1iZXIgPSBjb250ZXh0W1wiTnVtYmVyXCJdIHx8IHJvb3RbXCJOdW1iZXJcIl0sXG4gICAgICAgIFN0cmluZyA9IGNvbnRleHRbXCJTdHJpbmdcIl0gfHwgcm9vdFtcIlN0cmluZ1wiXSxcbiAgICAgICAgT2JqZWN0ID0gY29udGV4dFtcIk9iamVjdFwiXSB8fCByb290W1wiT2JqZWN0XCJdLFxuICAgICAgICBEYXRlID0gY29udGV4dFtcIkRhdGVcIl0gfHwgcm9vdFtcIkRhdGVcIl0sXG4gICAgICAgIFN5bnRheEVycm9yID0gY29udGV4dFtcIlN5bnRheEVycm9yXCJdIHx8IHJvb3RbXCJTeW50YXhFcnJvclwiXSxcbiAgICAgICAgVHlwZUVycm9yID0gY29udGV4dFtcIlR5cGVFcnJvclwiXSB8fCByb290W1wiVHlwZUVycm9yXCJdLFxuICAgICAgICBNYXRoID0gY29udGV4dFtcIk1hdGhcIl0gfHwgcm9vdFtcIk1hdGhcIl0sXG4gICAgICAgIG5hdGl2ZUpTT04gPSBjb250ZXh0W1wiSlNPTlwiXSB8fCByb290W1wiSlNPTlwiXTtcblxuICAgIC8vIERlbGVnYXRlIHRvIHRoZSBuYXRpdmUgYHN0cmluZ2lmeWAgYW5kIGBwYXJzZWAgaW1wbGVtZW50YXRpb25zLlxuICAgIGlmICh0eXBlb2YgbmF0aXZlSlNPTiA9PSBcIm9iamVjdFwiICYmIG5hdGl2ZUpTT04pIHtcbiAgICAgIGV4cG9ydHMuc3RyaW5naWZ5ID0gbmF0aXZlSlNPTi5zdHJpbmdpZnk7XG4gICAgICBleHBvcnRzLnBhcnNlID0gbmF0aXZlSlNPTi5wYXJzZTtcbiAgICB9XG5cbiAgICAvLyBDb252ZW5pZW5jZSBhbGlhc2VzLlxuICAgIHZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGUsXG4gICAgICAgIGdldENsYXNzID0gb2JqZWN0UHJvdG8udG9TdHJpbmcsXG4gICAgICAgIGlzUHJvcGVydHksIGZvckVhY2gsIHVuZGVmO1xuXG4gICAgLy8gVGVzdCB0aGUgYERhdGUjZ2V0VVRDKmAgbWV0aG9kcy4gQmFzZWQgb24gd29yayBieSBAWWFmZmxlLlxuICAgIHZhciBpc0V4dGVuZGVkID0gbmV3IERhdGUoLTM1MDk4MjczMzQ1NzMyOTIpO1xuICAgIHRyeSB7XG4gICAgICAvLyBUaGUgYGdldFVUQ0Z1bGxZZWFyYCwgYE1vbnRoYCwgYW5kIGBEYXRlYCBtZXRob2RzIHJldHVybiBub25zZW5zaWNhbFxuICAgICAgLy8gcmVzdWx0cyBmb3IgY2VydGFpbiBkYXRlcyBpbiBPcGVyYSA+PSAxMC41My5cbiAgICAgIGlzRXh0ZW5kZWQgPSBpc0V4dGVuZGVkLmdldFVUQ0Z1bGxZZWFyKCkgPT0gLTEwOTI1MiAmJiBpc0V4dGVuZGVkLmdldFVUQ01vbnRoKCkgPT09IDAgJiYgaXNFeHRlbmRlZC5nZXRVVENEYXRlKCkgPT09IDEgJiZcbiAgICAgICAgLy8gU2FmYXJpIDwgMi4wLjIgc3RvcmVzIHRoZSBpbnRlcm5hbCBtaWxsaXNlY29uZCB0aW1lIHZhbHVlIGNvcnJlY3RseSxcbiAgICAgICAgLy8gYnV0IGNsaXBzIHRoZSB2YWx1ZXMgcmV0dXJuZWQgYnkgdGhlIGRhdGUgbWV0aG9kcyB0byB0aGUgcmFuZ2Ugb2ZcbiAgICAgICAgLy8gc2lnbmVkIDMyLWJpdCBpbnRlZ2VycyAoWy0yICoqIDMxLCAyICoqIDMxIC0gMV0pLlxuICAgICAgICBpc0V4dGVuZGVkLmdldFVUQ0hvdXJzKCkgPT0gMTAgJiYgaXNFeHRlbmRlZC5nZXRVVENNaW51dGVzKCkgPT0gMzcgJiYgaXNFeHRlbmRlZC5nZXRVVENTZWNvbmRzKCkgPT0gNiAmJiBpc0V4dGVuZGVkLmdldFVUQ01pbGxpc2Vjb25kcygpID09IDcwODtcbiAgICB9IGNhdGNoIChleGNlcHRpb24pIHt9XG5cbiAgICAvLyBJbnRlcm5hbDogRGV0ZXJtaW5lcyB3aGV0aGVyIHRoZSBuYXRpdmUgYEpTT04uc3RyaW5naWZ5YCBhbmQgYHBhcnNlYFxuICAgIC8vIGltcGxlbWVudGF0aW9ucyBhcmUgc3BlYy1jb21wbGlhbnQuIEJhc2VkIG9uIHdvcmsgYnkgS2VuIFNueWRlci5cbiAgICBmdW5jdGlvbiBoYXMobmFtZSkge1xuICAgICAgaWYgKGhhc1tuYW1lXSAhPT0gdW5kZWYpIHtcbiAgICAgICAgLy8gUmV0dXJuIGNhY2hlZCBmZWF0dXJlIHRlc3QgcmVzdWx0LlxuICAgICAgICByZXR1cm4gaGFzW25hbWVdO1xuICAgICAgfVxuICAgICAgdmFyIGlzU3VwcG9ydGVkO1xuICAgICAgaWYgKG5hbWUgPT0gXCJidWctc3RyaW5nLWNoYXItaW5kZXhcIikge1xuICAgICAgICAvLyBJRSA8PSA3IGRvZXNuJ3Qgc3VwcG9ydCBhY2Nlc3Npbmcgc3RyaW5nIGNoYXJhY3RlcnMgdXNpbmcgc3F1YXJlXG4gICAgICAgIC8vIGJyYWNrZXQgbm90YXRpb24uIElFIDggb25seSBzdXBwb3J0cyB0aGlzIGZvciBwcmltaXRpdmVzLlxuICAgICAgICBpc1N1cHBvcnRlZCA9IFwiYVwiWzBdICE9IFwiYVwiO1xuICAgICAgfSBlbHNlIGlmIChuYW1lID09IFwianNvblwiKSB7XG4gICAgICAgIC8vIEluZGljYXRlcyB3aGV0aGVyIGJvdGggYEpTT04uc3RyaW5naWZ5YCBhbmQgYEpTT04ucGFyc2VgIGFyZVxuICAgICAgICAvLyBzdXBwb3J0ZWQuXG4gICAgICAgIGlzU3VwcG9ydGVkID0gaGFzKFwianNvbi1zdHJpbmdpZnlcIikgJiYgaGFzKFwianNvbi1wYXJzZVwiKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciB2YWx1ZSwgc2VyaWFsaXplZCA9ICd7XCJhXCI6WzEsdHJ1ZSxmYWxzZSxudWxsLFwiXFxcXHUwMDAwXFxcXGJcXFxcblxcXFxmXFxcXHJcXFxcdFwiXX0nO1xuICAgICAgICAvLyBUZXN0IGBKU09OLnN0cmluZ2lmeWAuXG4gICAgICAgIGlmIChuYW1lID09IFwianNvbi1zdHJpbmdpZnlcIikge1xuICAgICAgICAgIHZhciBzdHJpbmdpZnkgPSBleHBvcnRzLnN0cmluZ2lmeSwgc3RyaW5naWZ5U3VwcG9ydGVkID0gdHlwZW9mIHN0cmluZ2lmeSA9PSBcImZ1bmN0aW9uXCIgJiYgaXNFeHRlbmRlZDtcbiAgICAgICAgICBpZiAoc3RyaW5naWZ5U3VwcG9ydGVkKSB7XG4gICAgICAgICAgICAvLyBBIHRlc3QgZnVuY3Rpb24gb2JqZWN0IHdpdGggYSBjdXN0b20gYHRvSlNPTmAgbWV0aG9kLlxuICAgICAgICAgICAgKHZhbHVlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgICAgIH0pLnRvSlNPTiA9IHZhbHVlO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgc3RyaW5naWZ5U3VwcG9ydGVkID1cbiAgICAgICAgICAgICAgICAvLyBGaXJlZm94IDMuMWIxIGFuZCBiMiBzZXJpYWxpemUgc3RyaW5nLCBudW1iZXIsIGFuZCBib29sZWFuXG4gICAgICAgICAgICAgICAgLy8gcHJpbWl0aXZlcyBhcyBvYmplY3QgbGl0ZXJhbHMuXG4gICAgICAgICAgICAgICAgc3RyaW5naWZ5KDApID09PSBcIjBcIiAmJlxuICAgICAgICAgICAgICAgIC8vIEZGIDMuMWIxLCBiMiwgYW5kIEpTT04gMiBzZXJpYWxpemUgd3JhcHBlZCBwcmltaXRpdmVzIGFzIG9iamVjdFxuICAgICAgICAgICAgICAgIC8vIGxpdGVyYWxzLlxuICAgICAgICAgICAgICAgIHN0cmluZ2lmeShuZXcgTnVtYmVyKCkpID09PSBcIjBcIiAmJlxuICAgICAgICAgICAgICAgIHN0cmluZ2lmeShuZXcgU3RyaW5nKCkpID09ICdcIlwiJyAmJlxuICAgICAgICAgICAgICAgIC8vIEZGIDMuMWIxLCAyIHRocm93IGFuIGVycm9yIGlmIHRoZSB2YWx1ZSBpcyBgbnVsbGAsIGB1bmRlZmluZWRgLCBvclxuICAgICAgICAgICAgICAgIC8vIGRvZXMgbm90IGRlZmluZSBhIGNhbm9uaWNhbCBKU09OIHJlcHJlc2VudGF0aW9uICh0aGlzIGFwcGxpZXMgdG9cbiAgICAgICAgICAgICAgICAvLyBvYmplY3RzIHdpdGggYHRvSlNPTmAgcHJvcGVydGllcyBhcyB3ZWxsLCAqdW5sZXNzKiB0aGV5IGFyZSBuZXN0ZWRcbiAgICAgICAgICAgICAgICAvLyB3aXRoaW4gYW4gb2JqZWN0IG9yIGFycmF5KS5cbiAgICAgICAgICAgICAgICBzdHJpbmdpZnkoZ2V0Q2xhc3MpID09PSB1bmRlZiAmJlxuICAgICAgICAgICAgICAgIC8vIElFIDggc2VyaWFsaXplcyBgdW5kZWZpbmVkYCBhcyBgXCJ1bmRlZmluZWRcImAuIFNhZmFyaSA8PSA1LjEuNyBhbmRcbiAgICAgICAgICAgICAgICAvLyBGRiAzLjFiMyBwYXNzIHRoaXMgdGVzdC5cbiAgICAgICAgICAgICAgICBzdHJpbmdpZnkodW5kZWYpID09PSB1bmRlZiAmJlxuICAgICAgICAgICAgICAgIC8vIFNhZmFyaSA8PSA1LjEuNyBhbmQgRkYgMy4xYjMgdGhyb3cgYEVycm9yYHMgYW5kIGBUeXBlRXJyb3JgcyxcbiAgICAgICAgICAgICAgICAvLyByZXNwZWN0aXZlbHksIGlmIHRoZSB2YWx1ZSBpcyBvbWl0dGVkIGVudGlyZWx5LlxuICAgICAgICAgICAgICAgIHN0cmluZ2lmeSgpID09PSB1bmRlZiAmJlxuICAgICAgICAgICAgICAgIC8vIEZGIDMuMWIxLCAyIHRocm93IGFuIGVycm9yIGlmIHRoZSBnaXZlbiB2YWx1ZSBpcyBub3QgYSBudW1iZXIsXG4gICAgICAgICAgICAgICAgLy8gc3RyaW5nLCBhcnJheSwgb2JqZWN0LCBCb29sZWFuLCBvciBgbnVsbGAgbGl0ZXJhbC4gVGhpcyBhcHBsaWVzIHRvXG4gICAgICAgICAgICAgICAgLy8gb2JqZWN0cyB3aXRoIGN1c3RvbSBgdG9KU09OYCBtZXRob2RzIGFzIHdlbGwsIHVubGVzcyB0aGV5IGFyZSBuZXN0ZWRcbiAgICAgICAgICAgICAgICAvLyBpbnNpZGUgb2JqZWN0IG9yIGFycmF5IGxpdGVyYWxzLiBZVUkgMy4wLjBiMSBpZ25vcmVzIGN1c3RvbSBgdG9KU09OYFxuICAgICAgICAgICAgICAgIC8vIG1ldGhvZHMgZW50aXJlbHkuXG4gICAgICAgICAgICAgICAgc3RyaW5naWZ5KHZhbHVlKSA9PT0gXCIxXCIgJiZcbiAgICAgICAgICAgICAgICBzdHJpbmdpZnkoW3ZhbHVlXSkgPT0gXCJbMV1cIiAmJlxuICAgICAgICAgICAgICAgIC8vIFByb3RvdHlwZSA8PSAxLjYuMSBzZXJpYWxpemVzIGBbdW5kZWZpbmVkXWAgYXMgYFwiW11cImAgaW5zdGVhZCBvZlxuICAgICAgICAgICAgICAgIC8vIGBcIltudWxsXVwiYC5cbiAgICAgICAgICAgICAgICBzdHJpbmdpZnkoW3VuZGVmXSkgPT0gXCJbbnVsbF1cIiAmJlxuICAgICAgICAgICAgICAgIC8vIFlVSSAzLjAuMGIxIGZhaWxzIHRvIHNlcmlhbGl6ZSBgbnVsbGAgbGl0ZXJhbHMuXG4gICAgICAgICAgICAgICAgc3RyaW5naWZ5KG51bGwpID09IFwibnVsbFwiICYmXG4gICAgICAgICAgICAgICAgLy8gRkYgMy4xYjEsIDIgaGFsdHMgc2VyaWFsaXphdGlvbiBpZiBhbiBhcnJheSBjb250YWlucyBhIGZ1bmN0aW9uOlxuICAgICAgICAgICAgICAgIC8vIGBbMSwgdHJ1ZSwgZ2V0Q2xhc3MsIDFdYCBzZXJpYWxpemVzIGFzIFwiWzEsdHJ1ZSxdLFwiLiBGRiAzLjFiM1xuICAgICAgICAgICAgICAgIC8vIGVsaWRlcyBub24tSlNPTiB2YWx1ZXMgZnJvbSBvYmplY3RzIGFuZCBhcnJheXMsIHVubGVzcyB0aGV5XG4gICAgICAgICAgICAgICAgLy8gZGVmaW5lIGN1c3RvbSBgdG9KU09OYCBtZXRob2RzLlxuICAgICAgICAgICAgICAgIHN0cmluZ2lmeShbdW5kZWYsIGdldENsYXNzLCBudWxsXSkgPT0gXCJbbnVsbCxudWxsLG51bGxdXCIgJiZcbiAgICAgICAgICAgICAgICAvLyBTaW1wbGUgc2VyaWFsaXphdGlvbiB0ZXN0LiBGRiAzLjFiMSB1c2VzIFVuaWNvZGUgZXNjYXBlIHNlcXVlbmNlc1xuICAgICAgICAgICAgICAgIC8vIHdoZXJlIGNoYXJhY3RlciBlc2NhcGUgY29kZXMgYXJlIGV4cGVjdGVkIChlLmcuLCBgXFxiYCA9PiBgXFx1MDAwOGApLlxuICAgICAgICAgICAgICAgIHN0cmluZ2lmeSh7IFwiYVwiOiBbdmFsdWUsIHRydWUsIGZhbHNlLCBudWxsLCBcIlxceDAwXFxiXFxuXFxmXFxyXFx0XCJdIH0pID09IHNlcmlhbGl6ZWQgJiZcbiAgICAgICAgICAgICAgICAvLyBGRiAzLjFiMSBhbmQgYjIgaWdub3JlIHRoZSBgZmlsdGVyYCBhbmQgYHdpZHRoYCBhcmd1bWVudHMuXG4gICAgICAgICAgICAgICAgc3RyaW5naWZ5KG51bGwsIHZhbHVlKSA9PT0gXCIxXCIgJiZcbiAgICAgICAgICAgICAgICBzdHJpbmdpZnkoWzEsIDJdLCBudWxsLCAxKSA9PSBcIltcXG4gMSxcXG4gMlxcbl1cIiAmJlxuICAgICAgICAgICAgICAgIC8vIEpTT04gMiwgUHJvdG90eXBlIDw9IDEuNywgYW5kIG9sZGVyIFdlYktpdCBidWlsZHMgaW5jb3JyZWN0bHlcbiAgICAgICAgICAgICAgICAvLyBzZXJpYWxpemUgZXh0ZW5kZWQgeWVhcnMuXG4gICAgICAgICAgICAgICAgc3RyaW5naWZ5KG5ldyBEYXRlKC04LjY0ZTE1KSkgPT0gJ1wiLTI3MTgyMS0wNC0yMFQwMDowMDowMC4wMDBaXCInICYmXG4gICAgICAgICAgICAgICAgLy8gVGhlIG1pbGxpc2Vjb25kcyBhcmUgb3B0aW9uYWwgaW4gRVMgNSwgYnV0IHJlcXVpcmVkIGluIDUuMS5cbiAgICAgICAgICAgICAgICBzdHJpbmdpZnkobmV3IERhdGUoOC42NGUxNSkpID09ICdcIisyNzU3NjAtMDktMTNUMDA6MDA6MDAuMDAwWlwiJyAmJlxuICAgICAgICAgICAgICAgIC8vIEZpcmVmb3ggPD0gMTEuMCBpbmNvcnJlY3RseSBzZXJpYWxpemVzIHllYXJzIHByaW9yIHRvIDAgYXMgbmVnYXRpdmVcbiAgICAgICAgICAgICAgICAvLyBmb3VyLWRpZ2l0IHllYXJzIGluc3RlYWQgb2Ygc2l4LWRpZ2l0IHllYXJzLiBDcmVkaXRzOiBAWWFmZmxlLlxuICAgICAgICAgICAgICAgIHN0cmluZ2lmeShuZXcgRGF0ZSgtNjIxOTg3NTUyZTUpKSA9PSAnXCItMDAwMDAxLTAxLTAxVDAwOjAwOjAwLjAwMFpcIicgJiZcbiAgICAgICAgICAgICAgICAvLyBTYWZhcmkgPD0gNS4xLjUgYW5kIE9wZXJhID49IDEwLjUzIGluY29ycmVjdGx5IHNlcmlhbGl6ZSBtaWxsaXNlY29uZFxuICAgICAgICAgICAgICAgIC8vIHZhbHVlcyBsZXNzIHRoYW4gMTAwMC4gQ3JlZGl0czogQFlhZmZsZS5cbiAgICAgICAgICAgICAgICBzdHJpbmdpZnkobmV3IERhdGUoLTEpKSA9PSAnXCIxOTY5LTEyLTMxVDIzOjU5OjU5Ljk5OVpcIic7XG4gICAgICAgICAgICB9IGNhdGNoIChleGNlcHRpb24pIHtcbiAgICAgICAgICAgICAgc3RyaW5naWZ5U3VwcG9ydGVkID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlzU3VwcG9ydGVkID0gc3RyaW5naWZ5U3VwcG9ydGVkO1xuICAgICAgICB9XG4gICAgICAgIC8vIFRlc3QgYEpTT04ucGFyc2VgLlxuICAgICAgICBpZiAobmFtZSA9PSBcImpzb24tcGFyc2VcIikge1xuICAgICAgICAgIHZhciBwYXJzZSA9IGV4cG9ydHMucGFyc2U7XG4gICAgICAgICAgaWYgKHR5cGVvZiBwYXJzZSA9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIC8vIEZGIDMuMWIxLCBiMiB3aWxsIHRocm93IGFuIGV4Y2VwdGlvbiBpZiBhIGJhcmUgbGl0ZXJhbCBpcyBwcm92aWRlZC5cbiAgICAgICAgICAgICAgLy8gQ29uZm9ybWluZyBpbXBsZW1lbnRhdGlvbnMgc2hvdWxkIGFsc28gY29lcmNlIHRoZSBpbml0aWFsIGFyZ3VtZW50IHRvXG4gICAgICAgICAgICAgIC8vIGEgc3RyaW5nIHByaW9yIHRvIHBhcnNpbmcuXG4gICAgICAgICAgICAgIGlmIChwYXJzZShcIjBcIikgPT09IDAgJiYgIXBhcnNlKGZhbHNlKSkge1xuICAgICAgICAgICAgICAgIC8vIFNpbXBsZSBwYXJzaW5nIHRlc3QuXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBwYXJzZShzZXJpYWxpemVkKTtcbiAgICAgICAgICAgICAgICB2YXIgcGFyc2VTdXBwb3J0ZWQgPSB2YWx1ZVtcImFcIl0ubGVuZ3RoID09IDUgJiYgdmFsdWVbXCJhXCJdWzBdID09PSAxO1xuICAgICAgICAgICAgICAgIGlmIChwYXJzZVN1cHBvcnRlZCkge1xuICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgLy8gU2FmYXJpIDw9IDUuMS4yIGFuZCBGRiAzLjFiMSBhbGxvdyB1bmVzY2FwZWQgdGFicyBpbiBzdHJpbmdzLlxuICAgICAgICAgICAgICAgICAgICBwYXJzZVN1cHBvcnRlZCA9ICFwYXJzZSgnXCJcXHRcIicpO1xuICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7fVxuICAgICAgICAgICAgICAgICAgaWYgKHBhcnNlU3VwcG9ydGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgLy8gRkYgNC4wIGFuZCA0LjAuMSBhbGxvdyBsZWFkaW5nIGArYCBzaWducyBhbmQgbGVhZGluZ1xuICAgICAgICAgICAgICAgICAgICAgIC8vIGRlY2ltYWwgcG9pbnRzLiBGRiA0LjAsIDQuMC4xLCBhbmQgSUUgOS0xMCBhbHNvIGFsbG93XG4gICAgICAgICAgICAgICAgICAgICAgLy8gY2VydGFpbiBvY3RhbCBsaXRlcmFscy5cbiAgICAgICAgICAgICAgICAgICAgICBwYXJzZVN1cHBvcnRlZCA9IHBhcnNlKFwiMDFcIikgIT09IDE7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge31cbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIGlmIChwYXJzZVN1cHBvcnRlZCkge1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgIC8vIEZGIDQuMCwgNC4wLjEsIGFuZCBSaGlubyAxLjdSMy1SNCBhbGxvdyB0cmFpbGluZyBkZWNpbWFsXG4gICAgICAgICAgICAgICAgICAgICAgLy8gcG9pbnRzLiBUaGVzZSBlbnZpcm9ubWVudHMsIGFsb25nIHdpdGggRkYgMy4xYjEgYW5kIDIsXG4gICAgICAgICAgICAgICAgICAgICAgLy8gYWxzbyBhbGxvdyB0cmFpbGluZyBjb21tYXMgaW4gSlNPTiBvYmplY3RzIGFuZCBhcnJheXMuXG4gICAgICAgICAgICAgICAgICAgICAgcGFyc2VTdXBwb3J0ZWQgPSBwYXJzZShcIjEuXCIpICE9PSAxO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChleGNlcHRpb24pIHt9XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIChleGNlcHRpb24pIHtcbiAgICAgICAgICAgICAgcGFyc2VTdXBwb3J0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaXNTdXBwb3J0ZWQgPSBwYXJzZVN1cHBvcnRlZDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGhhc1tuYW1lXSA9ICEhaXNTdXBwb3J0ZWQ7XG4gICAgfVxuXG4gICAgaWYgKCFoYXMoXCJqc29uXCIpKSB7XG4gICAgICAvLyBDb21tb24gYFtbQ2xhc3NdXWAgbmFtZSBhbGlhc2VzLlxuICAgICAgdmFyIGZ1bmN0aW9uQ2xhc3MgPSBcIltvYmplY3QgRnVuY3Rpb25dXCIsXG4gICAgICAgICAgZGF0ZUNsYXNzID0gXCJbb2JqZWN0IERhdGVdXCIsXG4gICAgICAgICAgbnVtYmVyQ2xhc3MgPSBcIltvYmplY3QgTnVtYmVyXVwiLFxuICAgICAgICAgIHN0cmluZ0NsYXNzID0gXCJbb2JqZWN0IFN0cmluZ11cIixcbiAgICAgICAgICBhcnJheUNsYXNzID0gXCJbb2JqZWN0IEFycmF5XVwiLFxuICAgICAgICAgIGJvb2xlYW5DbGFzcyA9IFwiW29iamVjdCBCb29sZWFuXVwiO1xuXG4gICAgICAvLyBEZXRlY3QgaW5jb21wbGV0ZSBzdXBwb3J0IGZvciBhY2Nlc3Npbmcgc3RyaW5nIGNoYXJhY3RlcnMgYnkgaW5kZXguXG4gICAgICB2YXIgY2hhckluZGV4QnVnZ3kgPSBoYXMoXCJidWctc3RyaW5nLWNoYXItaW5kZXhcIik7XG5cbiAgICAgIC8vIERlZmluZSBhZGRpdGlvbmFsIHV0aWxpdHkgbWV0aG9kcyBpZiB0aGUgYERhdGVgIG1ldGhvZHMgYXJlIGJ1Z2d5LlxuICAgICAgaWYgKCFpc0V4dGVuZGVkKSB7XG4gICAgICAgIHZhciBmbG9vciA9IE1hdGguZmxvb3I7XG4gICAgICAgIC8vIEEgbWFwcGluZyBiZXR3ZWVuIHRoZSBtb250aHMgb2YgdGhlIHllYXIgYW5kIHRoZSBudW1iZXIgb2YgZGF5cyBiZXR3ZWVuXG4gICAgICAgIC8vIEphbnVhcnkgMXN0IGFuZCB0aGUgZmlyc3Qgb2YgdGhlIHJlc3BlY3RpdmUgbW9udGguXG4gICAgICAgIHZhciBNb250aHMgPSBbMCwgMzEsIDU5LCA5MCwgMTIwLCAxNTEsIDE4MSwgMjEyLCAyNDMsIDI3MywgMzA0LCAzMzRdO1xuICAgICAgICAvLyBJbnRlcm5hbDogQ2FsY3VsYXRlcyB0aGUgbnVtYmVyIG9mIGRheXMgYmV0d2VlbiB0aGUgVW5peCBlcG9jaCBhbmQgdGhlXG4gICAgICAgIC8vIGZpcnN0IGRheSBvZiB0aGUgZ2l2ZW4gbW9udGguXG4gICAgICAgIHZhciBnZXREYXkgPSBmdW5jdGlvbiAoeWVhciwgbW9udGgpIHtcbiAgICAgICAgICByZXR1cm4gTW9udGhzW21vbnRoXSArIDM2NSAqICh5ZWFyIC0gMTk3MCkgKyBmbG9vcigoeWVhciAtIDE5NjkgKyAobW9udGggPSArKG1vbnRoID4gMSkpKSAvIDQpIC0gZmxvb3IoKHllYXIgLSAxOTAxICsgbW9udGgpIC8gMTAwKSArIGZsb29yKCh5ZWFyIC0gMTYwMSArIG1vbnRoKSAvIDQwMCk7XG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIC8vIEludGVybmFsOiBEZXRlcm1pbmVzIGlmIGEgcHJvcGVydHkgaXMgYSBkaXJlY3QgcHJvcGVydHkgb2YgdGhlIGdpdmVuXG4gICAgICAvLyBvYmplY3QuIERlbGVnYXRlcyB0byB0aGUgbmF0aXZlIGBPYmplY3QjaGFzT3duUHJvcGVydHlgIG1ldGhvZC5cbiAgICAgIGlmICghKGlzUHJvcGVydHkgPSBvYmplY3RQcm90by5oYXNPd25Qcm9wZXJ0eSkpIHtcbiAgICAgICAgaXNQcm9wZXJ0eSA9IGZ1bmN0aW9uIChwcm9wZXJ0eSkge1xuICAgICAgICAgIHZhciBtZW1iZXJzID0ge30sIGNvbnN0cnVjdG9yO1xuICAgICAgICAgIGlmICgobWVtYmVycy5fX3Byb3RvX18gPSBudWxsLCBtZW1iZXJzLl9fcHJvdG9fXyA9IHtcbiAgICAgICAgICAgIC8vIFRoZSAqcHJvdG8qIHByb3BlcnR5IGNhbm5vdCBiZSBzZXQgbXVsdGlwbGUgdGltZXMgaW4gcmVjZW50XG4gICAgICAgICAgICAvLyB2ZXJzaW9ucyBvZiBGaXJlZm94IGFuZCBTZWFNb25rZXkuXG4gICAgICAgICAgICBcInRvU3RyaW5nXCI6IDFcbiAgICAgICAgICB9LCBtZW1iZXJzKS50b1N0cmluZyAhPSBnZXRDbGFzcykge1xuICAgICAgICAgICAgLy8gU2FmYXJpIDw9IDIuMC4zIGRvZXNuJ3QgaW1wbGVtZW50IGBPYmplY3QjaGFzT3duUHJvcGVydHlgLCBidXRcbiAgICAgICAgICAgIC8vIHN1cHBvcnRzIHRoZSBtdXRhYmxlICpwcm90byogcHJvcGVydHkuXG4gICAgICAgICAgICBpc1Byb3BlcnR5ID0gZnVuY3Rpb24gKHByb3BlcnR5KSB7XG4gICAgICAgICAgICAgIC8vIENhcHR1cmUgYW5kIGJyZWFrIHRoZSBvYmplY3RncyBwcm90b3R5cGUgY2hhaW4gKHNlZSBzZWN0aW9uIDguNi4yXG4gICAgICAgICAgICAgIC8vIG9mIHRoZSBFUyA1LjEgc3BlYykuIFRoZSBwYXJlbnRoZXNpemVkIGV4cHJlc3Npb24gcHJldmVudHMgYW5cbiAgICAgICAgICAgICAgLy8gdW5zYWZlIHRyYW5zZm9ybWF0aW9uIGJ5IHRoZSBDbG9zdXJlIENvbXBpbGVyLlxuICAgICAgICAgICAgICB2YXIgb3JpZ2luYWwgPSB0aGlzLl9fcHJvdG9fXywgcmVzdWx0ID0gcHJvcGVydHkgaW4gKHRoaXMuX19wcm90b19fID0gbnVsbCwgdGhpcyk7XG4gICAgICAgICAgICAgIC8vIFJlc3RvcmUgdGhlIG9yaWdpbmFsIHByb3RvdHlwZSBjaGFpbi5cbiAgICAgICAgICAgICAgdGhpcy5fX3Byb3RvX18gPSBvcmlnaW5hbDtcbiAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIENhcHR1cmUgYSByZWZlcmVuY2UgdG8gdGhlIHRvcC1sZXZlbCBgT2JqZWN0YCBjb25zdHJ1Y3Rvci5cbiAgICAgICAgICAgIGNvbnN0cnVjdG9yID0gbWVtYmVycy5jb25zdHJ1Y3RvcjtcbiAgICAgICAgICAgIC8vIFVzZSB0aGUgYGNvbnN0cnVjdG9yYCBwcm9wZXJ0eSB0byBzaW11bGF0ZSBgT2JqZWN0I2hhc093blByb3BlcnR5YCBpblxuICAgICAgICAgICAgLy8gb3RoZXIgZW52aXJvbm1lbnRzLlxuICAgICAgICAgICAgaXNQcm9wZXJ0eSA9IGZ1bmN0aW9uIChwcm9wZXJ0eSkge1xuICAgICAgICAgICAgICB2YXIgcGFyZW50ID0gKHRoaXMuY29uc3RydWN0b3IgfHwgY29uc3RydWN0b3IpLnByb3RvdHlwZTtcbiAgICAgICAgICAgICAgcmV0dXJuIHByb3BlcnR5IGluIHRoaXMgJiYgIShwcm9wZXJ0eSBpbiBwYXJlbnQgJiYgdGhpc1twcm9wZXJ0eV0gPT09IHBhcmVudFtwcm9wZXJ0eV0pO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9XG4gICAgICAgICAgbWVtYmVycyA9IG51bGw7XG4gICAgICAgICAgcmV0dXJuIGlzUHJvcGVydHkuY2FsbCh0aGlzLCBwcm9wZXJ0eSk7XG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIC8vIEludGVybmFsOiBBIHNldCBvZiBwcmltaXRpdmUgdHlwZXMgdXNlZCBieSBgaXNIb3N0VHlwZWAuXG4gICAgICB2YXIgUHJpbWl0aXZlVHlwZXMgPSB7XG4gICAgICAgIFwiYm9vbGVhblwiOiAxLFxuICAgICAgICBcIm51bWJlclwiOiAxLFxuICAgICAgICBcInN0cmluZ1wiOiAxLFxuICAgICAgICBcInVuZGVmaW5lZFwiOiAxXG4gICAgICB9O1xuXG4gICAgICAvLyBJbnRlcm5hbDogRGV0ZXJtaW5lcyBpZiB0aGUgZ2l2ZW4gb2JqZWN0IGBwcm9wZXJ0eWAgdmFsdWUgaXMgYVxuICAgICAgLy8gbm9uLXByaW1pdGl2ZS5cbiAgICAgIHZhciBpc0hvc3RUeXBlID0gZnVuY3Rpb24gKG9iamVjdCwgcHJvcGVydHkpIHtcbiAgICAgICAgdmFyIHR5cGUgPSB0eXBlb2Ygb2JqZWN0W3Byb3BlcnR5XTtcbiAgICAgICAgcmV0dXJuIHR5cGUgPT0gXCJvYmplY3RcIiA/ICEhb2JqZWN0W3Byb3BlcnR5XSA6ICFQcmltaXRpdmVUeXBlc1t0eXBlXTtcbiAgICAgIH07XG5cbiAgICAgIC8vIEludGVybmFsOiBOb3JtYWxpemVzIHRoZSBgZm9yLi4uaW5gIGl0ZXJhdGlvbiBhbGdvcml0aG0gYWNyb3NzXG4gICAgICAvLyBlbnZpcm9ubWVudHMuIEVhY2ggZW51bWVyYXRlZCBrZXkgaXMgeWllbGRlZCB0byBhIGBjYWxsYmFja2AgZnVuY3Rpb24uXG4gICAgICBmb3JFYWNoID0gZnVuY3Rpb24gKG9iamVjdCwgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIHNpemUgPSAwLCBQcm9wZXJ0aWVzLCBtZW1iZXJzLCBwcm9wZXJ0eTtcblxuICAgICAgICAvLyBUZXN0cyBmb3IgYnVncyBpbiB0aGUgY3VycmVudCBlbnZpcm9ubWVudCdzIGBmb3IuLi5pbmAgYWxnb3JpdGhtLiBUaGVcbiAgICAgICAgLy8gYHZhbHVlT2ZgIHByb3BlcnR5IGluaGVyaXRzIHRoZSBub24tZW51bWVyYWJsZSBmbGFnIGZyb21cbiAgICAgICAgLy8gYE9iamVjdC5wcm90b3R5cGVgIGluIG9sZGVyIHZlcnNpb25zIG9mIElFLCBOZXRzY2FwZSwgYW5kIE1vemlsbGEuXG4gICAgICAgIChQcm9wZXJ0aWVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHRoaXMudmFsdWVPZiA9IDA7XG4gICAgICAgIH0pLnByb3RvdHlwZS52YWx1ZU9mID0gMDtcblxuICAgICAgICAvLyBJdGVyYXRlIG92ZXIgYSBuZXcgaW5zdGFuY2Ugb2YgdGhlIGBQcm9wZXJ0aWVzYCBjbGFzcy5cbiAgICAgICAgbWVtYmVycyA9IG5ldyBQcm9wZXJ0aWVzKCk7XG4gICAgICAgIGZvciAocHJvcGVydHkgaW4gbWVtYmVycykge1xuICAgICAgICAgIC8vIElnbm9yZSBhbGwgcHJvcGVydGllcyBpbmhlcml0ZWQgZnJvbSBgT2JqZWN0LnByb3RvdHlwZWAuXG4gICAgICAgICAgaWYgKGlzUHJvcGVydHkuY2FsbChtZW1iZXJzLCBwcm9wZXJ0eSkpIHtcbiAgICAgICAgICAgIHNpemUrKztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgUHJvcGVydGllcyA9IG1lbWJlcnMgPSBudWxsO1xuXG4gICAgICAgIC8vIE5vcm1hbGl6ZSB0aGUgaXRlcmF0aW9uIGFsZ29yaXRobS5cbiAgICAgICAgaWYgKCFzaXplKSB7XG4gICAgICAgICAgLy8gQSBsaXN0IG9mIG5vbi1lbnVtZXJhYmxlIHByb3BlcnRpZXMgaW5oZXJpdGVkIGZyb20gYE9iamVjdC5wcm90b3R5cGVgLlxuICAgICAgICAgIG1lbWJlcnMgPSBbXCJ2YWx1ZU9mXCIsIFwidG9TdHJpbmdcIiwgXCJ0b0xvY2FsZVN0cmluZ1wiLCBcInByb3BlcnR5SXNFbnVtZXJhYmxlXCIsIFwiaXNQcm90b3R5cGVPZlwiLCBcImhhc093blByb3BlcnR5XCIsIFwiY29uc3RydWN0b3JcIl07XG4gICAgICAgICAgLy8gSUUgPD0gOCwgTW96aWxsYSAxLjAsIGFuZCBOZXRzY2FwZSA2LjIgaWdub3JlIHNoYWRvd2VkIG5vbi1lbnVtZXJhYmxlXG4gICAgICAgICAgLy8gcHJvcGVydGllcy5cbiAgICAgICAgICBmb3JFYWNoID0gZnVuY3Rpb24gKG9iamVjdCwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHZhciBpc0Z1bmN0aW9uID0gZ2V0Q2xhc3MuY2FsbChvYmplY3QpID09IGZ1bmN0aW9uQ2xhc3MsIHByb3BlcnR5LCBsZW5ndGg7XG4gICAgICAgICAgICB2YXIgaGFzUHJvcGVydHkgPSAhaXNGdW5jdGlvbiAmJiB0eXBlb2Ygb2JqZWN0LmNvbnN0cnVjdG9yICE9IFwiZnVuY3Rpb25cIiAmJiBpc0hvc3RUeXBlKG9iamVjdCwgXCJoYXNPd25Qcm9wZXJ0eVwiKSA/IG9iamVjdC5oYXNPd25Qcm9wZXJ0eSA6IGlzUHJvcGVydHk7XG4gICAgICAgICAgICBmb3IgKHByb3BlcnR5IGluIG9iamVjdCkge1xuICAgICAgICAgICAgICAvLyBHZWNrbyA8PSAxLjAgZW51bWVyYXRlcyB0aGUgYHByb3RvdHlwZWAgcHJvcGVydHkgb2YgZnVuY3Rpb25zIHVuZGVyXG4gICAgICAgICAgICAgIC8vIGNlcnRhaW4gY29uZGl0aW9uczsgSUUgZG9lcyBub3QuXG4gICAgICAgICAgICAgIGlmICghKGlzRnVuY3Rpb24gJiYgcHJvcGVydHkgPT0gXCJwcm90b3R5cGVcIikgJiYgaGFzUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3BlcnR5KSkge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKHByb3BlcnR5KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gTWFudWFsbHkgaW52b2tlIHRoZSBjYWxsYmFjayBmb3IgZWFjaCBub24tZW51bWVyYWJsZSBwcm9wZXJ0eS5cbiAgICAgICAgICAgIGZvciAobGVuZ3RoID0gbWVtYmVycy5sZW5ndGg7IHByb3BlcnR5ID0gbWVtYmVyc1stLWxlbmd0aF07IGhhc1Byb3BlcnR5LmNhbGwob2JqZWN0LCBwcm9wZXJ0eSkgJiYgY2FsbGJhY2socHJvcGVydHkpKTtcbiAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2UgaWYgKHNpemUgPT0gMikge1xuICAgICAgICAgIC8vIFNhZmFyaSA8PSAyLjAuNCBlbnVtZXJhdGVzIHNoYWRvd2VkIHByb3BlcnRpZXMgdHdpY2UuXG4gICAgICAgICAgZm9yRWFjaCA9IGZ1bmN0aW9uIChvYmplY3QsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAvLyBDcmVhdGUgYSBzZXQgb2YgaXRlcmF0ZWQgcHJvcGVydGllcy5cbiAgICAgICAgICAgIHZhciBtZW1iZXJzID0ge30sIGlzRnVuY3Rpb24gPSBnZXRDbGFzcy5jYWxsKG9iamVjdCkgPT0gZnVuY3Rpb25DbGFzcywgcHJvcGVydHk7XG4gICAgICAgICAgICBmb3IgKHByb3BlcnR5IGluIG9iamVjdCkge1xuICAgICAgICAgICAgICAvLyBTdG9yZSBlYWNoIHByb3BlcnR5IG5hbWUgdG8gcHJldmVudCBkb3VibGUgZW51bWVyYXRpb24uIFRoZVxuICAgICAgICAgICAgICAvLyBgcHJvdG90eXBlYCBwcm9wZXJ0eSBvZiBmdW5jdGlvbnMgaXMgbm90IGVudW1lcmF0ZWQgZHVlIHRvIGNyb3NzLVxuICAgICAgICAgICAgICAvLyBlbnZpcm9ubWVudCBpbmNvbnNpc3RlbmNpZXMuXG4gICAgICAgICAgICAgIGlmICghKGlzRnVuY3Rpb24gJiYgcHJvcGVydHkgPT0gXCJwcm90b3R5cGVcIikgJiYgIWlzUHJvcGVydHkuY2FsbChtZW1iZXJzLCBwcm9wZXJ0eSkgJiYgKG1lbWJlcnNbcHJvcGVydHldID0gMSkgJiYgaXNQcm9wZXJ0eS5jYWxsKG9iamVjdCwgcHJvcGVydHkpKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2socHJvcGVydHkpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBObyBidWdzIGRldGVjdGVkOyB1c2UgdGhlIHN0YW5kYXJkIGBmb3IuLi5pbmAgYWxnb3JpdGhtLlxuICAgICAgICAgIGZvckVhY2ggPSBmdW5jdGlvbiAob2JqZWN0LCBjYWxsYmFjaykge1xuICAgICAgICAgICAgdmFyIGlzRnVuY3Rpb24gPSBnZXRDbGFzcy5jYWxsKG9iamVjdCkgPT0gZnVuY3Rpb25DbGFzcywgcHJvcGVydHksIGlzQ29uc3RydWN0b3I7XG4gICAgICAgICAgICBmb3IgKHByb3BlcnR5IGluIG9iamVjdCkge1xuICAgICAgICAgICAgICBpZiAoIShpc0Z1bmN0aW9uICYmIHByb3BlcnR5ID09IFwicHJvdG90eXBlXCIpICYmIGlzUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3BlcnR5KSAmJiAhKGlzQ29uc3RydWN0b3IgPSBwcm9wZXJ0eSA9PT0gXCJjb25zdHJ1Y3RvclwiKSkge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKHByb3BlcnR5KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gTWFudWFsbHkgaW52b2tlIHRoZSBjYWxsYmFjayBmb3IgdGhlIGBjb25zdHJ1Y3RvcmAgcHJvcGVydHkgZHVlIHRvXG4gICAgICAgICAgICAvLyBjcm9zcy1lbnZpcm9ubWVudCBpbmNvbnNpc3RlbmNpZXMuXG4gICAgICAgICAgICBpZiAoaXNDb25zdHJ1Y3RvciB8fCBpc1Byb3BlcnR5LmNhbGwob2JqZWN0LCAocHJvcGVydHkgPSBcImNvbnN0cnVjdG9yXCIpKSkge1xuICAgICAgICAgICAgICBjYWxsYmFjayhwcm9wZXJ0eSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZm9yRWFjaChvYmplY3QsIGNhbGxiYWNrKTtcbiAgICAgIH07XG5cbiAgICAgIC8vIFB1YmxpYzogU2VyaWFsaXplcyBhIEphdmFTY3JpcHQgYHZhbHVlYCBhcyBhIEpTT04gc3RyaW5nLiBUaGUgb3B0aW9uYWxcbiAgICAgIC8vIGBmaWx0ZXJgIGFyZ3VtZW50IG1heSBzcGVjaWZ5IGVpdGhlciBhIGZ1bmN0aW9uIHRoYXQgYWx0ZXJzIGhvdyBvYmplY3QgYW5kXG4gICAgICAvLyBhcnJheSBtZW1iZXJzIGFyZSBzZXJpYWxpemVkLCBvciBhbiBhcnJheSBvZiBzdHJpbmdzIGFuZCBudW1iZXJzIHRoYXRcbiAgICAgIC8vIGluZGljYXRlcyB3aGljaCBwcm9wZXJ0aWVzIHNob3VsZCBiZSBzZXJpYWxpemVkLiBUaGUgb3B0aW9uYWwgYHdpZHRoYFxuICAgICAgLy8gYXJndW1lbnQgbWF5IGJlIGVpdGhlciBhIHN0cmluZyBvciBudW1iZXIgdGhhdCBzcGVjaWZpZXMgdGhlIGluZGVudGF0aW9uXG4gICAgICAvLyBsZXZlbCBvZiB0aGUgb3V0cHV0LlxuICAgICAgaWYgKCFoYXMoXCJqc29uLXN0cmluZ2lmeVwiKSkge1xuICAgICAgICAvLyBJbnRlcm5hbDogQSBtYXAgb2YgY29udHJvbCBjaGFyYWN0ZXJzIGFuZCB0aGVpciBlc2NhcGVkIGVxdWl2YWxlbnRzLlxuICAgICAgICB2YXIgRXNjYXBlcyA9IHtcbiAgICAgICAgICA5MjogXCJcXFxcXFxcXFwiLFxuICAgICAgICAgIDM0OiAnXFxcXFwiJyxcbiAgICAgICAgICA4OiBcIlxcXFxiXCIsXG4gICAgICAgICAgMTI6IFwiXFxcXGZcIixcbiAgICAgICAgICAxMDogXCJcXFxcblwiLFxuICAgICAgICAgIDEzOiBcIlxcXFxyXCIsXG4gICAgICAgICAgOTogXCJcXFxcdFwiXG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gSW50ZXJuYWw6IENvbnZlcnRzIGB2YWx1ZWAgaW50byBhIHplcm8tcGFkZGVkIHN0cmluZyBzdWNoIHRoYXQgaXRzXG4gICAgICAgIC8vIGxlbmd0aCBpcyBhdCBsZWFzdCBlcXVhbCB0byBgd2lkdGhgLiBUaGUgYHdpZHRoYCBtdXN0IGJlIDw9IDYuXG4gICAgICAgIHZhciBsZWFkaW5nWmVyb2VzID0gXCIwMDAwMDBcIjtcbiAgICAgICAgdmFyIHRvUGFkZGVkU3RyaW5nID0gZnVuY3Rpb24gKHdpZHRoLCB2YWx1ZSkge1xuICAgICAgICAgIC8vIFRoZSBgfHwgMGAgZXhwcmVzc2lvbiBpcyBuZWNlc3NhcnkgdG8gd29yayBhcm91bmQgYSBidWcgaW5cbiAgICAgICAgICAvLyBPcGVyYSA8PSA3LjU0dTIgd2hlcmUgYDAgPT0gLTBgLCBidXQgYFN0cmluZygtMCkgIT09IFwiMFwiYC5cbiAgICAgICAgICByZXR1cm4gKGxlYWRpbmdaZXJvZXMgKyAodmFsdWUgfHwgMCkpLnNsaWNlKC13aWR0aCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gSW50ZXJuYWw6IERvdWJsZS1xdW90ZXMgYSBzdHJpbmcgYHZhbHVlYCwgcmVwbGFjaW5nIGFsbCBBU0NJSSBjb250cm9sXG4gICAgICAgIC8vIGNoYXJhY3RlcnMgKGNoYXJhY3RlcnMgd2l0aCBjb2RlIHVuaXQgdmFsdWVzIGJldHdlZW4gMCBhbmQgMzEpIHdpdGhcbiAgICAgICAgLy8gdGhlaXIgZXNjYXBlZCBlcXVpdmFsZW50cy4gVGhpcyBpcyBhbiBpbXBsZW1lbnRhdGlvbiBvZiB0aGVcbiAgICAgICAgLy8gYFF1b3RlKHZhbHVlKWAgb3BlcmF0aW9uIGRlZmluZWQgaW4gRVMgNS4xIHNlY3Rpb24gMTUuMTIuMy5cbiAgICAgICAgdmFyIHVuaWNvZGVQcmVmaXggPSBcIlxcXFx1MDBcIjtcbiAgICAgICAgdmFyIHF1b3RlID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgdmFyIHJlc3VsdCA9ICdcIicsIGluZGV4ID0gMCwgbGVuZ3RoID0gdmFsdWUubGVuZ3RoLCB1c2VDaGFySW5kZXggPSAhY2hhckluZGV4QnVnZ3kgfHwgbGVuZ3RoID4gMTA7XG4gICAgICAgICAgdmFyIHN5bWJvbHMgPSB1c2VDaGFySW5kZXggJiYgKGNoYXJJbmRleEJ1Z2d5ID8gdmFsdWUuc3BsaXQoXCJcIikgOiB2YWx1ZSk7XG4gICAgICAgICAgZm9yICg7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgICAgICB2YXIgY2hhckNvZGUgPSB2YWx1ZS5jaGFyQ29kZUF0KGluZGV4KTtcbiAgICAgICAgICAgIC8vIElmIHRoZSBjaGFyYWN0ZXIgaXMgYSBjb250cm9sIGNoYXJhY3RlciwgYXBwZW5kIGl0cyBVbmljb2RlIG9yXG4gICAgICAgICAgICAvLyBzaG9ydGhhbmQgZXNjYXBlIHNlcXVlbmNlOyBvdGhlcndpc2UsIGFwcGVuZCB0aGUgY2hhcmFjdGVyIGFzLWlzLlxuICAgICAgICAgICAgc3dpdGNoIChjaGFyQ29kZSkge1xuICAgICAgICAgICAgICBjYXNlIDg6IGNhc2UgOTogY2FzZSAxMDogY2FzZSAxMjogY2FzZSAxMzogY2FzZSAzNDogY2FzZSA5MjpcbiAgICAgICAgICAgICAgICByZXN1bHQgKz0gRXNjYXBlc1tjaGFyQ29kZV07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgaWYgKGNoYXJDb2RlIDwgMzIpIHtcbiAgICAgICAgICAgICAgICAgIHJlc3VsdCArPSB1bmljb2RlUHJlZml4ICsgdG9QYWRkZWRTdHJpbmcoMiwgY2hhckNvZGUudG9TdHJpbmcoMTYpKTtcbiAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXN1bHQgKz0gdXNlQ2hhckluZGV4ID8gc3ltYm9sc1tpbmRleF0gOiB2YWx1ZS5jaGFyQXQoaW5kZXgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcmVzdWx0ICsgJ1wiJztcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBJbnRlcm5hbDogUmVjdXJzaXZlbHkgc2VyaWFsaXplcyBhbiBvYmplY3QuIEltcGxlbWVudHMgdGhlXG4gICAgICAgIC8vIGBTdHIoa2V5LCBob2xkZXIpYCwgYEpPKHZhbHVlKWAsIGFuZCBgSkEodmFsdWUpYCBvcGVyYXRpb25zLlxuICAgICAgICB2YXIgc2VyaWFsaXplID0gZnVuY3Rpb24gKHByb3BlcnR5LCBvYmplY3QsIGNhbGxiYWNrLCBwcm9wZXJ0aWVzLCB3aGl0ZXNwYWNlLCBpbmRlbnRhdGlvbiwgc3RhY2spIHtcbiAgICAgICAgICB2YXIgdmFsdWUsIGNsYXNzTmFtZSwgeWVhciwgbW9udGgsIGRhdGUsIHRpbWUsIGhvdXJzLCBtaW51dGVzLCBzZWNvbmRzLCBtaWxsaXNlY29uZHMsIHJlc3VsdHMsIGVsZW1lbnQsIGluZGV4LCBsZW5ndGgsIHByZWZpeCwgcmVzdWx0O1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBOZWNlc3NhcnkgZm9yIGhvc3Qgb2JqZWN0IHN1cHBvcnQuXG4gICAgICAgICAgICB2YWx1ZSA9IG9iamVjdFtwcm9wZXJ0eV07XG4gICAgICAgICAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7fVxuICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT0gXCJvYmplY3RcIiAmJiB2YWx1ZSkge1xuICAgICAgICAgICAgY2xhc3NOYW1lID0gZ2V0Q2xhc3MuY2FsbCh2YWx1ZSk7XG4gICAgICAgICAgICBpZiAoY2xhc3NOYW1lID09IGRhdGVDbGFzcyAmJiAhaXNQcm9wZXJ0eS5jYWxsKHZhbHVlLCBcInRvSlNPTlwiKSkge1xuICAgICAgICAgICAgICBpZiAodmFsdWUgPiAtMSAvIDAgJiYgdmFsdWUgPCAxIC8gMCkge1xuICAgICAgICAgICAgICAgIC8vIERhdGVzIGFyZSBzZXJpYWxpemVkIGFjY29yZGluZyB0byB0aGUgYERhdGUjdG9KU09OYCBtZXRob2RcbiAgICAgICAgICAgICAgICAvLyBzcGVjaWZpZWQgaW4gRVMgNS4xIHNlY3Rpb24gMTUuOS41LjQ0LiBTZWUgc2VjdGlvbiAxNS45LjEuMTVcbiAgICAgICAgICAgICAgICAvLyBmb3IgdGhlIElTTyA4NjAxIGRhdGUgdGltZSBzdHJpbmcgZm9ybWF0LlxuICAgICAgICAgICAgICAgIGlmIChnZXREYXkpIHtcbiAgICAgICAgICAgICAgICAgIC8vIE1hbnVhbGx5IGNvbXB1dGUgdGhlIHllYXIsIG1vbnRoLCBkYXRlLCBob3VycywgbWludXRlcyxcbiAgICAgICAgICAgICAgICAgIC8vIHNlY29uZHMsIGFuZCBtaWxsaXNlY29uZHMgaWYgdGhlIGBnZXRVVEMqYCBtZXRob2RzIGFyZVxuICAgICAgICAgICAgICAgICAgLy8gYnVnZ3kuIEFkYXB0ZWQgZnJvbSBAWWFmZmxlJ3MgYGRhdGUtc2hpbWAgcHJvamVjdC5cbiAgICAgICAgICAgICAgICAgIGRhdGUgPSBmbG9vcih2YWx1ZSAvIDg2NGU1KTtcbiAgICAgICAgICAgICAgICAgIGZvciAoeWVhciA9IGZsb29yKGRhdGUgLyAzNjUuMjQyNSkgKyAxOTcwIC0gMTsgZ2V0RGF5KHllYXIgKyAxLCAwKSA8PSBkYXRlOyB5ZWFyKyspO1xuICAgICAgICAgICAgICAgICAgZm9yIChtb250aCA9IGZsb29yKChkYXRlIC0gZ2V0RGF5KHllYXIsIDApKSAvIDMwLjQyKTsgZ2V0RGF5KHllYXIsIG1vbnRoICsgMSkgPD0gZGF0ZTsgbW9udGgrKyk7XG4gICAgICAgICAgICAgICAgICBkYXRlID0gMSArIGRhdGUgLSBnZXREYXkoeWVhciwgbW9udGgpO1xuICAgICAgICAgICAgICAgICAgLy8gVGhlIGB0aW1lYCB2YWx1ZSBzcGVjaWZpZXMgdGhlIHRpbWUgd2l0aGluIHRoZSBkYXkgKHNlZSBFU1xuICAgICAgICAgICAgICAgICAgLy8gNS4xIHNlY3Rpb24gMTUuOS4xLjIpLiBUaGUgZm9ybXVsYSBgKEEgJSBCICsgQikgJSBCYCBpcyB1c2VkXG4gICAgICAgICAgICAgICAgICAvLyB0byBjb21wdXRlIGBBIG1vZHVsbyBCYCwgYXMgdGhlIGAlYCBvcGVyYXRvciBkb2VzIG5vdFxuICAgICAgICAgICAgICAgICAgLy8gY29ycmVzcG9uZCB0byB0aGUgYG1vZHVsb2Agb3BlcmF0aW9uIGZvciBuZWdhdGl2ZSBudW1iZXJzLlxuICAgICAgICAgICAgICAgICAgdGltZSA9ICh2YWx1ZSAlIDg2NGU1ICsgODY0ZTUpICUgODY0ZTU7XG4gICAgICAgICAgICAgICAgICAvLyBUaGUgaG91cnMsIG1pbnV0ZXMsIHNlY29uZHMsIGFuZCBtaWxsaXNlY29uZHMgYXJlIG9idGFpbmVkIGJ5XG4gICAgICAgICAgICAgICAgICAvLyBkZWNvbXBvc2luZyB0aGUgdGltZSB3aXRoaW4gdGhlIGRheS4gU2VlIHNlY3Rpb24gMTUuOS4xLjEwLlxuICAgICAgICAgICAgICAgICAgaG91cnMgPSBmbG9vcih0aW1lIC8gMzZlNSkgJSAyNDtcbiAgICAgICAgICAgICAgICAgIG1pbnV0ZXMgPSBmbG9vcih0aW1lIC8gNmU0KSAlIDYwO1xuICAgICAgICAgICAgICAgICAgc2Vjb25kcyA9IGZsb29yKHRpbWUgLyAxZTMpICUgNjA7XG4gICAgICAgICAgICAgICAgICBtaWxsaXNlY29uZHMgPSB0aW1lICUgMWUzO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICB5ZWFyID0gdmFsdWUuZ2V0VVRDRnVsbFllYXIoKTtcbiAgICAgICAgICAgICAgICAgIG1vbnRoID0gdmFsdWUuZ2V0VVRDTW9udGgoKTtcbiAgICAgICAgICAgICAgICAgIGRhdGUgPSB2YWx1ZS5nZXRVVENEYXRlKCk7XG4gICAgICAgICAgICAgICAgICBob3VycyA9IHZhbHVlLmdldFVUQ0hvdXJzKCk7XG4gICAgICAgICAgICAgICAgICBtaW51dGVzID0gdmFsdWUuZ2V0VVRDTWludXRlcygpO1xuICAgICAgICAgICAgICAgICAgc2Vjb25kcyA9IHZhbHVlLmdldFVUQ1NlY29uZHMoKTtcbiAgICAgICAgICAgICAgICAgIG1pbGxpc2Vjb25kcyA9IHZhbHVlLmdldFVUQ01pbGxpc2Vjb25kcygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBTZXJpYWxpemUgZXh0ZW5kZWQgeWVhcnMgY29ycmVjdGx5LlxuICAgICAgICAgICAgICAgIHZhbHVlID0gKHllYXIgPD0gMCB8fCB5ZWFyID49IDFlNCA/ICh5ZWFyIDwgMCA/IFwiLVwiIDogXCIrXCIpICsgdG9QYWRkZWRTdHJpbmcoNiwgeWVhciA8IDAgPyAteWVhciA6IHllYXIpIDogdG9QYWRkZWRTdHJpbmcoNCwgeWVhcikpICtcbiAgICAgICAgICAgICAgICAgIFwiLVwiICsgdG9QYWRkZWRTdHJpbmcoMiwgbW9udGggKyAxKSArIFwiLVwiICsgdG9QYWRkZWRTdHJpbmcoMiwgZGF0ZSkgK1xuICAgICAgICAgICAgICAgICAgLy8gTW9udGhzLCBkYXRlcywgaG91cnMsIG1pbnV0ZXMsIGFuZCBzZWNvbmRzIHNob3VsZCBoYXZlIHR3b1xuICAgICAgICAgICAgICAgICAgLy8gZGlnaXRzOyBtaWxsaXNlY29uZHMgc2hvdWxkIGhhdmUgdGhyZWUuXG4gICAgICAgICAgICAgICAgICBcIlRcIiArIHRvUGFkZGVkU3RyaW5nKDIsIGhvdXJzKSArIFwiOlwiICsgdG9QYWRkZWRTdHJpbmcoMiwgbWludXRlcykgKyBcIjpcIiArIHRvUGFkZGVkU3RyaW5nKDIsIHNlY29uZHMpICtcbiAgICAgICAgICAgICAgICAgIC8vIE1pbGxpc2Vjb25kcyBhcmUgb3B0aW9uYWwgaW4gRVMgNS4wLCBidXQgcmVxdWlyZWQgaW4gNS4xLlxuICAgICAgICAgICAgICAgICAgXCIuXCIgKyB0b1BhZGRlZFN0cmluZygzLCBtaWxsaXNlY29uZHMpICsgXCJaXCI7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSBudWxsO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiB2YWx1ZS50b0pTT04gPT0gXCJmdW5jdGlvblwiICYmICgoY2xhc3NOYW1lICE9IG51bWJlckNsYXNzICYmIGNsYXNzTmFtZSAhPSBzdHJpbmdDbGFzcyAmJiBjbGFzc05hbWUgIT0gYXJyYXlDbGFzcykgfHwgaXNQcm9wZXJ0eS5jYWxsKHZhbHVlLCBcInRvSlNPTlwiKSkpIHtcbiAgICAgICAgICAgICAgLy8gUHJvdG90eXBlIDw9IDEuNi4xIGFkZHMgbm9uLXN0YW5kYXJkIGB0b0pTT05gIG1ldGhvZHMgdG8gdGhlXG4gICAgICAgICAgICAgIC8vIGBOdW1iZXJgLCBgU3RyaW5nYCwgYERhdGVgLCBhbmQgYEFycmF5YCBwcm90b3R5cGVzLiBKU09OIDNcbiAgICAgICAgICAgICAgLy8gaWdub3JlcyBhbGwgYHRvSlNPTmAgbWV0aG9kcyBvbiB0aGVzZSBvYmplY3RzIHVubGVzcyB0aGV5IGFyZVxuICAgICAgICAgICAgICAvLyBkZWZpbmVkIGRpcmVjdGx5IG9uIGFuIGluc3RhbmNlLlxuICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLnRvSlNPTihwcm9wZXJ0eSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgICAgLy8gSWYgYSByZXBsYWNlbWVudCBmdW5jdGlvbiB3YXMgcHJvdmlkZWQsIGNhbGwgaXQgdG8gb2J0YWluIHRoZSB2YWx1ZVxuICAgICAgICAgICAgLy8gZm9yIHNlcmlhbGl6YXRpb24uXG4gICAgICAgICAgICB2YWx1ZSA9IGNhbGxiYWNrLmNhbGwob2JqZWN0LCBwcm9wZXJ0eSwgdmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAodmFsdWUgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBcIm51bGxcIjtcbiAgICAgICAgICB9XG4gICAgICAgICAgY2xhc3NOYW1lID0gZ2V0Q2xhc3MuY2FsbCh2YWx1ZSk7XG4gICAgICAgICAgaWYgKGNsYXNzTmFtZSA9PSBib29sZWFuQ2xhc3MpIHtcbiAgICAgICAgICAgIC8vIEJvb2xlYW5zIGFyZSByZXByZXNlbnRlZCBsaXRlcmFsbHkuXG4gICAgICAgICAgICByZXR1cm4gXCJcIiArIHZhbHVlO1xuICAgICAgICAgIH0gZWxzZSBpZiAoY2xhc3NOYW1lID09IG51bWJlckNsYXNzKSB7XG4gICAgICAgICAgICAvLyBKU09OIG51bWJlcnMgbXVzdCBiZSBmaW5pdGUuIGBJbmZpbml0eWAgYW5kIGBOYU5gIGFyZSBzZXJpYWxpemVkIGFzXG4gICAgICAgICAgICAvLyBgXCJudWxsXCJgLlxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlID4gLTEgLyAwICYmIHZhbHVlIDwgMSAvIDAgPyBcIlwiICsgdmFsdWUgOiBcIm51bGxcIjtcbiAgICAgICAgICB9IGVsc2UgaWYgKGNsYXNzTmFtZSA9PSBzdHJpbmdDbGFzcykge1xuICAgICAgICAgICAgLy8gU3RyaW5ncyBhcmUgZG91YmxlLXF1b3RlZCBhbmQgZXNjYXBlZC5cbiAgICAgICAgICAgIHJldHVybiBxdW90ZShcIlwiICsgdmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBSZWN1cnNpdmVseSBzZXJpYWxpemUgb2JqZWN0cyBhbmQgYXJyYXlzLlxuICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgLy8gQ2hlY2sgZm9yIGN5Y2xpYyBzdHJ1Y3R1cmVzLiBUaGlzIGlzIGEgbGluZWFyIHNlYXJjaDsgcGVyZm9ybWFuY2VcbiAgICAgICAgICAgIC8vIGlzIGludmVyc2VseSBwcm9wb3J0aW9uYWwgdG8gdGhlIG51bWJlciBvZiB1bmlxdWUgbmVzdGVkIG9iamVjdHMuXG4gICAgICAgICAgICBmb3IgKGxlbmd0aCA9IHN0YWNrLmxlbmd0aDsgbGVuZ3RoLS07KSB7XG4gICAgICAgICAgICAgIGlmIChzdGFja1tsZW5ndGhdID09PSB2YWx1ZSkge1xuICAgICAgICAgICAgICAgIC8vIEN5Y2xpYyBzdHJ1Y3R1cmVzIGNhbm5vdCBiZSBzZXJpYWxpemVkIGJ5IGBKU09OLnN0cmluZ2lmeWAuXG4gICAgICAgICAgICAgICAgdGhyb3cgVHlwZUVycm9yKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIEFkZCB0aGUgb2JqZWN0IHRvIHRoZSBzdGFjayBvZiB0cmF2ZXJzZWQgb2JqZWN0cy5cbiAgICAgICAgICAgIHN0YWNrLnB1c2godmFsdWUpO1xuICAgICAgICAgICAgcmVzdWx0cyA9IFtdO1xuICAgICAgICAgICAgLy8gU2F2ZSB0aGUgY3VycmVudCBpbmRlbnRhdGlvbiBsZXZlbCBhbmQgaW5kZW50IG9uZSBhZGRpdGlvbmFsIGxldmVsLlxuICAgICAgICAgICAgcHJlZml4ID0gaW5kZW50YXRpb247XG4gICAgICAgICAgICBpbmRlbnRhdGlvbiArPSB3aGl0ZXNwYWNlO1xuICAgICAgICAgICAgaWYgKGNsYXNzTmFtZSA9PSBhcnJheUNsYXNzKSB7XG4gICAgICAgICAgICAgIC8vIFJlY3Vyc2l2ZWx5IHNlcmlhbGl6ZSBhcnJheSBlbGVtZW50cy5cbiAgICAgICAgICAgICAgZm9yIChpbmRleCA9IDAsIGxlbmd0aCA9IHZhbHVlLmxlbmd0aDsgaW5kZXggPCBsZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50ID0gc2VyaWFsaXplKGluZGV4LCB2YWx1ZSwgY2FsbGJhY2ssIHByb3BlcnRpZXMsIHdoaXRlc3BhY2UsIGluZGVudGF0aW9uLCBzdGFjayk7XG4gICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKGVsZW1lbnQgPT09IHVuZGVmID8gXCJudWxsXCIgOiBlbGVtZW50KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXN1bHQgPSByZXN1bHRzLmxlbmd0aCA/ICh3aGl0ZXNwYWNlID8gXCJbXFxuXCIgKyBpbmRlbnRhdGlvbiArIHJlc3VsdHMuam9pbihcIixcXG5cIiArIGluZGVudGF0aW9uKSArIFwiXFxuXCIgKyBwcmVmaXggKyBcIl1cIiA6IChcIltcIiArIHJlc3VsdHMuam9pbihcIixcIikgKyBcIl1cIikpIDogXCJbXVwiO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgLy8gUmVjdXJzaXZlbHkgc2VyaWFsaXplIG9iamVjdCBtZW1iZXJzLiBNZW1iZXJzIGFyZSBzZWxlY3RlZCBmcm9tXG4gICAgICAgICAgICAgIC8vIGVpdGhlciBhIHVzZXItc3BlY2lmaWVkIGxpc3Qgb2YgcHJvcGVydHkgbmFtZXMsIG9yIHRoZSBvYmplY3RcbiAgICAgICAgICAgICAgLy8gaXRzZWxmLlxuICAgICAgICAgICAgICBmb3JFYWNoKHByb3BlcnRpZXMgfHwgdmFsdWUsIGZ1bmN0aW9uIChwcm9wZXJ0eSkge1xuICAgICAgICAgICAgICAgIHZhciBlbGVtZW50ID0gc2VyaWFsaXplKHByb3BlcnR5LCB2YWx1ZSwgY2FsbGJhY2ssIHByb3BlcnRpZXMsIHdoaXRlc3BhY2UsIGluZGVudGF0aW9uLCBzdGFjayk7XG4gICAgICAgICAgICAgICAgaWYgKGVsZW1lbnQgIT09IHVuZGVmKSB7XG4gICAgICAgICAgICAgICAgICAvLyBBY2NvcmRpbmcgdG8gRVMgNS4xIHNlY3Rpb24gMTUuMTIuMzogXCJJZiBgZ2FwYCB7d2hpdGVzcGFjZX1cbiAgICAgICAgICAgICAgICAgIC8vIGlzIG5vdCB0aGUgZW1wdHkgc3RyaW5nLCBsZXQgYG1lbWJlcmAge3F1b3RlKHByb3BlcnR5KSArIFwiOlwifVxuICAgICAgICAgICAgICAgICAgLy8gYmUgdGhlIGNvbmNhdGVuYXRpb24gb2YgYG1lbWJlcmAgYW5kIHRoZSBgc3BhY2VgIGNoYXJhY3Rlci5cIlxuICAgICAgICAgICAgICAgICAgLy8gVGhlIFwiYHNwYWNlYCBjaGFyYWN0ZXJcIiByZWZlcnMgdG8gdGhlIGxpdGVyYWwgc3BhY2VcbiAgICAgICAgICAgICAgICAgIC8vIGNoYXJhY3Rlciwgbm90IHRoZSBgc3BhY2VgIHt3aWR0aH0gYXJndW1lbnQgcHJvdmlkZWQgdG9cbiAgICAgICAgICAgICAgICAgIC8vIGBKU09OLnN0cmluZ2lmeWAuXG4gICAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2gocXVvdGUocHJvcGVydHkpICsgXCI6XCIgKyAod2hpdGVzcGFjZSA/IFwiIFwiIDogXCJcIikgKyBlbGVtZW50KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICByZXN1bHQgPSByZXN1bHRzLmxlbmd0aCA/ICh3aGl0ZXNwYWNlID8gXCJ7XFxuXCIgKyBpbmRlbnRhdGlvbiArIHJlc3VsdHMuam9pbihcIixcXG5cIiArIGluZGVudGF0aW9uKSArIFwiXFxuXCIgKyBwcmVmaXggKyBcIn1cIiA6IChcIntcIiArIHJlc3VsdHMuam9pbihcIixcIikgKyBcIn1cIikpIDogXCJ7fVwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gUmVtb3ZlIHRoZSBvYmplY3QgZnJvbSB0aGUgdHJhdmVyc2VkIG9iamVjdCBzdGFjay5cbiAgICAgICAgICAgIHN0YWNrLnBvcCgpO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gUHVibGljOiBgSlNPTi5zdHJpbmdpZnlgLiBTZWUgRVMgNS4xIHNlY3Rpb24gMTUuMTIuMy5cbiAgICAgICAgZXhwb3J0cy5zdHJpbmdpZnkgPSBmdW5jdGlvbiAoc291cmNlLCBmaWx0ZXIsIHdpZHRoKSB7XG4gICAgICAgICAgdmFyIHdoaXRlc3BhY2UsIGNhbGxiYWNrLCBwcm9wZXJ0aWVzLCBjbGFzc05hbWU7XG4gICAgICAgICAgaWYgKHR5cGVvZiBmaWx0ZXIgPT0gXCJmdW5jdGlvblwiIHx8IHR5cGVvZiBmaWx0ZXIgPT0gXCJvYmplY3RcIiAmJiBmaWx0ZXIpIHtcbiAgICAgICAgICAgIGlmICgoY2xhc3NOYW1lID0gZ2V0Q2xhc3MuY2FsbChmaWx0ZXIpKSA9PSBmdW5jdGlvbkNsYXNzKSB7XG4gICAgICAgICAgICAgIGNhbGxiYWNrID0gZmlsdGVyO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChjbGFzc05hbWUgPT0gYXJyYXlDbGFzcykge1xuICAgICAgICAgICAgICAvLyBDb252ZXJ0IHRoZSBwcm9wZXJ0eSBuYW1lcyBhcnJheSBpbnRvIGEgbWFrZXNoaWZ0IHNldC5cbiAgICAgICAgICAgICAgcHJvcGVydGllcyA9IHt9O1xuICAgICAgICAgICAgICBmb3IgKHZhciBpbmRleCA9IDAsIGxlbmd0aCA9IGZpbHRlci5sZW5ndGgsIHZhbHVlOyBpbmRleCA8IGxlbmd0aDsgdmFsdWUgPSBmaWx0ZXJbaW5kZXgrK10sICgoY2xhc3NOYW1lID0gZ2V0Q2xhc3MuY2FsbCh2YWx1ZSkpLCBjbGFzc05hbWUgPT0gc3RyaW5nQ2xhc3MgfHwgY2xhc3NOYW1lID09IG51bWJlckNsYXNzKSAmJiAocHJvcGVydGllc1t2YWx1ZV0gPSAxKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICh3aWR0aCkge1xuICAgICAgICAgICAgaWYgKChjbGFzc05hbWUgPSBnZXRDbGFzcy5jYWxsKHdpZHRoKSkgPT0gbnVtYmVyQ2xhc3MpIHtcbiAgICAgICAgICAgICAgLy8gQ29udmVydCB0aGUgYHdpZHRoYCB0byBhbiBpbnRlZ2VyIGFuZCBjcmVhdGUgYSBzdHJpbmcgY29udGFpbmluZ1xuICAgICAgICAgICAgICAvLyBgd2lkdGhgIG51bWJlciBvZiBzcGFjZSBjaGFyYWN0ZXJzLlxuICAgICAgICAgICAgICBpZiAoKHdpZHRoIC09IHdpZHRoICUgMSkgPiAwKSB7XG4gICAgICAgICAgICAgICAgZm9yICh3aGl0ZXNwYWNlID0gXCJcIiwgd2lkdGggPiAxMCAmJiAod2lkdGggPSAxMCk7IHdoaXRlc3BhY2UubGVuZ3RoIDwgd2lkdGg7IHdoaXRlc3BhY2UgKz0gXCIgXCIpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNsYXNzTmFtZSA9PSBzdHJpbmdDbGFzcykge1xuICAgICAgICAgICAgICB3aGl0ZXNwYWNlID0gd2lkdGgubGVuZ3RoIDw9IDEwID8gd2lkdGggOiB3aWR0aC5zbGljZSgwLCAxMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIE9wZXJhIDw9IDcuNTR1MiBkaXNjYXJkcyB0aGUgdmFsdWVzIGFzc29jaWF0ZWQgd2l0aCBlbXB0eSBzdHJpbmcga2V5c1xuICAgICAgICAgIC8vIChgXCJcImApIG9ubHkgaWYgdGhleSBhcmUgdXNlZCBkaXJlY3RseSB3aXRoaW4gYW4gb2JqZWN0IG1lbWJlciBsaXN0XG4gICAgICAgICAgLy8gKGUuZy4sIGAhKFwiXCIgaW4geyBcIlwiOiAxfSlgKS5cbiAgICAgICAgICByZXR1cm4gc2VyaWFsaXplKFwiXCIsICh2YWx1ZSA9IHt9LCB2YWx1ZVtcIlwiXSA9IHNvdXJjZSwgdmFsdWUpLCBjYWxsYmFjaywgcHJvcGVydGllcywgd2hpdGVzcGFjZSwgXCJcIiwgW10pO1xuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICAvLyBQdWJsaWM6IFBhcnNlcyBhIEpTT04gc291cmNlIHN0cmluZy5cbiAgICAgIGlmICghaGFzKFwianNvbi1wYXJzZVwiKSkge1xuICAgICAgICB2YXIgZnJvbUNoYXJDb2RlID0gU3RyaW5nLmZyb21DaGFyQ29kZTtcblxuICAgICAgICAvLyBJbnRlcm5hbDogQSBtYXAgb2YgZXNjYXBlZCBjb250cm9sIGNoYXJhY3RlcnMgYW5kIHRoZWlyIHVuZXNjYXBlZFxuICAgICAgICAvLyBlcXVpdmFsZW50cy5cbiAgICAgICAgdmFyIFVuZXNjYXBlcyA9IHtcbiAgICAgICAgICA5MjogXCJcXFxcXCIsXG4gICAgICAgICAgMzQ6ICdcIicsXG4gICAgICAgICAgNDc6IFwiL1wiLFxuICAgICAgICAgIDk4OiBcIlxcYlwiLFxuICAgICAgICAgIDExNjogXCJcXHRcIixcbiAgICAgICAgICAxMTA6IFwiXFxuXCIsXG4gICAgICAgICAgMTAyOiBcIlxcZlwiLFxuICAgICAgICAgIDExNDogXCJcXHJcIlxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIEludGVybmFsOiBTdG9yZXMgdGhlIHBhcnNlciBzdGF0ZS5cbiAgICAgICAgdmFyIEluZGV4LCBTb3VyY2U7XG5cbiAgICAgICAgLy8gSW50ZXJuYWw6IFJlc2V0cyB0aGUgcGFyc2VyIHN0YXRlIGFuZCB0aHJvd3MgYSBgU3ludGF4RXJyb3JgLlxuICAgICAgICB2YXIgYWJvcnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgSW5kZXggPSBTb3VyY2UgPSBudWxsO1xuICAgICAgICAgIHRocm93IFN5bnRheEVycm9yKCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gSW50ZXJuYWw6IFJldHVybnMgdGhlIG5leHQgdG9rZW4sIG9yIGBcIiRcImAgaWYgdGhlIHBhcnNlciBoYXMgcmVhY2hlZFxuICAgICAgICAvLyB0aGUgZW5kIG9mIHRoZSBzb3VyY2Ugc3RyaW5nLiBBIHRva2VuIG1heSBiZSBhIHN0cmluZywgbnVtYmVyLCBgbnVsbGBcbiAgICAgICAgLy8gbGl0ZXJhbCwgb3IgQm9vbGVhbiBsaXRlcmFsLlxuICAgICAgICB2YXIgbGV4ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHZhciBzb3VyY2UgPSBTb3VyY2UsIGxlbmd0aCA9IHNvdXJjZS5sZW5ndGgsIHZhbHVlLCBiZWdpbiwgcG9zaXRpb24sIGlzU2lnbmVkLCBjaGFyQ29kZTtcbiAgICAgICAgICB3aGlsZSAoSW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICAgIGNoYXJDb2RlID0gc291cmNlLmNoYXJDb2RlQXQoSW5kZXgpO1xuICAgICAgICAgICAgc3dpdGNoIChjaGFyQ29kZSkge1xuICAgICAgICAgICAgICBjYXNlIDk6IGNhc2UgMTA6IGNhc2UgMTM6IGNhc2UgMzI6XG4gICAgICAgICAgICAgICAgLy8gU2tpcCB3aGl0ZXNwYWNlIHRva2VucywgaW5jbHVkaW5nIHRhYnMsIGNhcnJpYWdlIHJldHVybnMsIGxpbmVcbiAgICAgICAgICAgICAgICAvLyBmZWVkcywgYW5kIHNwYWNlIGNoYXJhY3RlcnMuXG4gICAgICAgICAgICAgICAgSW5kZXgrKztcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSAxMjM6IGNhc2UgMTI1OiBjYXNlIDkxOiBjYXNlIDkzOiBjYXNlIDU4OiBjYXNlIDQ0OlxuICAgICAgICAgICAgICAgIC8vIFBhcnNlIGEgcHVuY3R1YXRvciB0b2tlbiAoYHtgLCBgfWAsIGBbYCwgYF1gLCBgOmAsIG9yIGAsYCkgYXRcbiAgICAgICAgICAgICAgICAvLyB0aGUgY3VycmVudCBwb3NpdGlvbi5cbiAgICAgICAgICAgICAgICB2YWx1ZSA9IGNoYXJJbmRleEJ1Z2d5ID8gc291cmNlLmNoYXJBdChJbmRleCkgOiBzb3VyY2VbSW5kZXhdO1xuICAgICAgICAgICAgICAgIEluZGV4Kys7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICAgICAgICBjYXNlIDM0OlxuICAgICAgICAgICAgICAgIC8vIGBcImAgZGVsaW1pdHMgYSBKU09OIHN0cmluZzsgYWR2YW5jZSB0byB0aGUgbmV4dCBjaGFyYWN0ZXIgYW5kXG4gICAgICAgICAgICAgICAgLy8gYmVnaW4gcGFyc2luZyB0aGUgc3RyaW5nLiBTdHJpbmcgdG9rZW5zIGFyZSBwcmVmaXhlZCB3aXRoIHRoZVxuICAgICAgICAgICAgICAgIC8vIHNlbnRpbmVsIGBAYCBjaGFyYWN0ZXIgdG8gZGlzdGluZ3Vpc2ggdGhlbSBmcm9tIHB1bmN0dWF0b3JzIGFuZFxuICAgICAgICAgICAgICAgIC8vIGVuZC1vZi1zdHJpbmcgdG9rZW5zLlxuICAgICAgICAgICAgICAgIGZvciAodmFsdWUgPSBcIkBcIiwgSW5kZXgrKzsgSW5kZXggPCBsZW5ndGg7KSB7XG4gICAgICAgICAgICAgICAgICBjaGFyQ29kZSA9IHNvdXJjZS5jaGFyQ29kZUF0KEluZGV4KTtcbiAgICAgICAgICAgICAgICAgIGlmIChjaGFyQ29kZSA8IDMyKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFVuZXNjYXBlZCBBU0NJSSBjb250cm9sIGNoYXJhY3RlcnMgKHRob3NlIHdpdGggYSBjb2RlIHVuaXRcbiAgICAgICAgICAgICAgICAgICAgLy8gbGVzcyB0aGFuIHRoZSBzcGFjZSBjaGFyYWN0ZXIpIGFyZSBub3QgcGVybWl0dGVkLlxuICAgICAgICAgICAgICAgICAgICBhYm9ydCgpO1xuICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjaGFyQ29kZSA9PSA5Mikge1xuICAgICAgICAgICAgICAgICAgICAvLyBBIHJldmVyc2Ugc29saWR1cyAoYFxcYCkgbWFya3MgdGhlIGJlZ2lubmluZyBvZiBhbiBlc2NhcGVkXG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnRyb2wgY2hhcmFjdGVyIChpbmNsdWRpbmcgYFwiYCwgYFxcYCwgYW5kIGAvYCkgb3IgVW5pY29kZVxuICAgICAgICAgICAgICAgICAgICAvLyBlc2NhcGUgc2VxdWVuY2UuXG4gICAgICAgICAgICAgICAgICAgIGNoYXJDb2RlID0gc291cmNlLmNoYXJDb2RlQXQoKytJbmRleCk7XG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAoY2hhckNvZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICBjYXNlIDkyOiBjYXNlIDM0OiBjYXNlIDQ3OiBjYXNlIDk4OiBjYXNlIDExNjogY2FzZSAxMTA6IGNhc2UgMTAyOiBjYXNlIDExNDpcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJldml2ZSBlc2NhcGVkIGNvbnRyb2wgY2hhcmFjdGVycy5cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlICs9IFVuZXNjYXBlc1tjaGFyQ29kZV07XG4gICAgICAgICAgICAgICAgICAgICAgICBJbmRleCsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgY2FzZSAxMTc6XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBgXFx1YCBtYXJrcyB0aGUgYmVnaW5uaW5nIG9mIGEgVW5pY29kZSBlc2NhcGUgc2VxdWVuY2UuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBBZHZhbmNlIHRvIHRoZSBmaXJzdCBjaGFyYWN0ZXIgYW5kIHZhbGlkYXRlIHRoZVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZm91ci1kaWdpdCBjb2RlIHBvaW50LlxuICAgICAgICAgICAgICAgICAgICAgICAgYmVnaW4gPSArK0luZGV4O1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChwb3NpdGlvbiA9IEluZGV4ICsgNDsgSW5kZXggPCBwb3NpdGlvbjsgSW5kZXgrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBjaGFyQ29kZSA9IHNvdXJjZS5jaGFyQ29kZUF0KEluZGV4KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQSB2YWxpZCBzZXF1ZW5jZSBjb21wcmlzZXMgZm91ciBoZXhkaWdpdHMgKGNhc2UtXG4gICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGluc2Vuc2l0aXZlKSB0aGF0IGZvcm0gYSBzaW5nbGUgaGV4YWRlY2ltYWwgdmFsdWUuXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghKGNoYXJDb2RlID49IDQ4ICYmIGNoYXJDb2RlIDw9IDU3IHx8IGNoYXJDb2RlID49IDk3ICYmIGNoYXJDb2RlIDw9IDEwMiB8fCBjaGFyQ29kZSA+PSA2NSAmJiBjaGFyQ29kZSA8PSA3MCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJbnZhbGlkIFVuaWNvZGUgZXNjYXBlIHNlcXVlbmNlLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFib3J0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJldml2ZSB0aGUgZXNjYXBlZCBjaGFyYWN0ZXIuXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSArPSBmcm9tQ2hhckNvZGUoXCIweFwiICsgc291cmNlLnNsaWNlKGJlZ2luLCBJbmRleCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEludmFsaWQgZXNjYXBlIHNlcXVlbmNlLlxuICAgICAgICAgICAgICAgICAgICAgICAgYWJvcnQoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNoYXJDb2RlID09IDM0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgLy8gQW4gdW5lc2NhcGVkIGRvdWJsZS1xdW90ZSBjaGFyYWN0ZXIgbWFya3MgdGhlIGVuZCBvZiB0aGVcbiAgICAgICAgICAgICAgICAgICAgICAvLyBzdHJpbmcuXG4gICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY2hhckNvZGUgPSBzb3VyY2UuY2hhckNvZGVBdChJbmRleCk7XG4gICAgICAgICAgICAgICAgICAgIGJlZ2luID0gSW5kZXg7XG4gICAgICAgICAgICAgICAgICAgIC8vIE9wdGltaXplIGZvciB0aGUgY29tbW9uIGNhc2Ugd2hlcmUgYSBzdHJpbmcgaXMgdmFsaWQuXG4gICAgICAgICAgICAgICAgICAgIHdoaWxlIChjaGFyQ29kZSA+PSAzMiAmJiBjaGFyQ29kZSAhPSA5MiAmJiBjaGFyQ29kZSAhPSAzNCkge1xuICAgICAgICAgICAgICAgICAgICAgIGNoYXJDb2RlID0gc291cmNlLmNoYXJDb2RlQXQoKytJbmRleCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLy8gQXBwZW5kIHRoZSBzdHJpbmcgYXMtaXMuXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlICs9IHNvdXJjZS5zbGljZShiZWdpbiwgSW5kZXgpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoc291cmNlLmNoYXJDb2RlQXQoSW5kZXgpID09IDM0KSB7XG4gICAgICAgICAgICAgICAgICAvLyBBZHZhbmNlIHRvIHRoZSBuZXh0IGNoYXJhY3RlciBhbmQgcmV0dXJuIHRoZSByZXZpdmVkIHN0cmluZy5cbiAgICAgICAgICAgICAgICAgIEluZGV4Kys7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIFVudGVybWluYXRlZCBzdHJpbmcuXG4gICAgICAgICAgICAgICAgYWJvcnQoKTtcbiAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAvLyBQYXJzZSBudW1iZXJzIGFuZCBsaXRlcmFscy5cbiAgICAgICAgICAgICAgICBiZWdpbiA9IEluZGV4O1xuICAgICAgICAgICAgICAgIC8vIEFkdmFuY2UgcGFzdCB0aGUgbmVnYXRpdmUgc2lnbiwgaWYgb25lIGlzIHNwZWNpZmllZC5cbiAgICAgICAgICAgICAgICBpZiAoY2hhckNvZGUgPT0gNDUpIHtcbiAgICAgICAgICAgICAgICAgIGlzU2lnbmVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgIGNoYXJDb2RlID0gc291cmNlLmNoYXJDb2RlQXQoKytJbmRleCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIFBhcnNlIGFuIGludGVnZXIgb3IgZmxvYXRpbmctcG9pbnQgdmFsdWUuXG4gICAgICAgICAgICAgICAgaWYgKGNoYXJDb2RlID49IDQ4ICYmIGNoYXJDb2RlIDw9IDU3KSB7XG4gICAgICAgICAgICAgICAgICAvLyBMZWFkaW5nIHplcm9lcyBhcmUgaW50ZXJwcmV0ZWQgYXMgb2N0YWwgbGl0ZXJhbHMuXG4gICAgICAgICAgICAgICAgICBpZiAoY2hhckNvZGUgPT0gNDggJiYgKChjaGFyQ29kZSA9IHNvdXJjZS5jaGFyQ29kZUF0KEluZGV4ICsgMSkpLCBjaGFyQ29kZSA+PSA0OCAmJiBjaGFyQ29kZSA8PSA1NykpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gSWxsZWdhbCBvY3RhbCBsaXRlcmFsLlxuICAgICAgICAgICAgICAgICAgICBhYm9ydCgpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgaXNTaWduZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgIC8vIFBhcnNlIHRoZSBpbnRlZ2VyIGNvbXBvbmVudC5cbiAgICAgICAgICAgICAgICAgIGZvciAoOyBJbmRleCA8IGxlbmd0aCAmJiAoKGNoYXJDb2RlID0gc291cmNlLmNoYXJDb2RlQXQoSW5kZXgpKSwgY2hhckNvZGUgPj0gNDggJiYgY2hhckNvZGUgPD0gNTcpOyBJbmRleCsrKTtcbiAgICAgICAgICAgICAgICAgIC8vIEZsb2F0cyBjYW5ub3QgY29udGFpbiBhIGxlYWRpbmcgZGVjaW1hbCBwb2ludDsgaG93ZXZlciwgdGhpc1xuICAgICAgICAgICAgICAgICAgLy8gY2FzZSBpcyBhbHJlYWR5IGFjY291bnRlZCBmb3IgYnkgdGhlIHBhcnNlci5cbiAgICAgICAgICAgICAgICAgIGlmIChzb3VyY2UuY2hhckNvZGVBdChJbmRleCkgPT0gNDYpIHtcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb24gPSArK0luZGV4O1xuICAgICAgICAgICAgICAgICAgICAvLyBQYXJzZSB0aGUgZGVjaW1hbCBjb21wb25lbnQuXG4gICAgICAgICAgICAgICAgICAgIGZvciAoOyBwb3NpdGlvbiA8IGxlbmd0aCAmJiAoKGNoYXJDb2RlID0gc291cmNlLmNoYXJDb2RlQXQocG9zaXRpb24pKSwgY2hhckNvZGUgPj0gNDggJiYgY2hhckNvZGUgPD0gNTcpOyBwb3NpdGlvbisrKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBvc2l0aW9uID09IEluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgLy8gSWxsZWdhbCB0cmFpbGluZyBkZWNpbWFsLlxuICAgICAgICAgICAgICAgICAgICAgIGFib3J0KCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgSW5kZXggPSBwb3NpdGlvbjtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIC8vIFBhcnNlIGV4cG9uZW50cy4gVGhlIGBlYCBkZW5vdGluZyB0aGUgZXhwb25lbnQgaXNcbiAgICAgICAgICAgICAgICAgIC8vIGNhc2UtaW5zZW5zaXRpdmUuXG4gICAgICAgICAgICAgICAgICBjaGFyQ29kZSA9IHNvdXJjZS5jaGFyQ29kZUF0KEluZGV4KTtcbiAgICAgICAgICAgICAgICAgIGlmIChjaGFyQ29kZSA9PSAxMDEgfHwgY2hhckNvZGUgPT0gNjkpIHtcbiAgICAgICAgICAgICAgICAgICAgY2hhckNvZGUgPSBzb3VyY2UuY2hhckNvZGVBdCgrK0luZGV4KTtcbiAgICAgICAgICAgICAgICAgICAgLy8gU2tpcCBwYXN0IHRoZSBzaWduIGZvbGxvd2luZyB0aGUgZXhwb25lbnQsIGlmIG9uZSBpc1xuICAgICAgICAgICAgICAgICAgICAvLyBzcGVjaWZpZWQuXG4gICAgICAgICAgICAgICAgICAgIGlmIChjaGFyQ29kZSA9PSA0MyB8fCBjaGFyQ29kZSA9PSA0NSkge1xuICAgICAgICAgICAgICAgICAgICAgIEluZGV4Kys7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLy8gUGFyc2UgdGhlIGV4cG9uZW50aWFsIGNvbXBvbmVudC5cbiAgICAgICAgICAgICAgICAgICAgZm9yIChwb3NpdGlvbiA9IEluZGV4OyBwb3NpdGlvbiA8IGxlbmd0aCAmJiAoKGNoYXJDb2RlID0gc291cmNlLmNoYXJDb2RlQXQocG9zaXRpb24pKSwgY2hhckNvZGUgPj0gNDggJiYgY2hhckNvZGUgPD0gNTcpOyBwb3NpdGlvbisrKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBvc2l0aW9uID09IEluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgLy8gSWxsZWdhbCBlbXB0eSBleHBvbmVudC5cbiAgICAgICAgICAgICAgICAgICAgICBhYm9ydCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIEluZGV4ID0gcG9zaXRpb247XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAvLyBDb2VyY2UgdGhlIHBhcnNlZCB2YWx1ZSB0byBhIEphdmFTY3JpcHQgbnVtYmVyLlxuICAgICAgICAgICAgICAgICAgcmV0dXJuICtzb3VyY2Uuc2xpY2UoYmVnaW4sIEluZGV4KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gQSBuZWdhdGl2ZSBzaWduIG1heSBvbmx5IHByZWNlZGUgbnVtYmVycy5cbiAgICAgICAgICAgICAgICBpZiAoaXNTaWduZWQpIHtcbiAgICAgICAgICAgICAgICAgIGFib3J0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIGB0cnVlYCwgYGZhbHNlYCwgYW5kIGBudWxsYCBsaXRlcmFscy5cbiAgICAgICAgICAgICAgICBpZiAoc291cmNlLnNsaWNlKEluZGV4LCBJbmRleCArIDQpID09IFwidHJ1ZVwiKSB7XG4gICAgICAgICAgICAgICAgICBJbmRleCArPSA0O1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzb3VyY2Uuc2xpY2UoSW5kZXgsIEluZGV4ICsgNSkgPT0gXCJmYWxzZVwiKSB7XG4gICAgICAgICAgICAgICAgICBJbmRleCArPSA1O1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc291cmNlLnNsaWNlKEluZGV4LCBJbmRleCArIDQpID09IFwibnVsbFwiKSB7XG4gICAgICAgICAgICAgICAgICBJbmRleCArPSA0O1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIFVucmVjb2duaXplZCB0b2tlbi5cbiAgICAgICAgICAgICAgICBhYm9ydCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBSZXR1cm4gdGhlIHNlbnRpbmVsIGAkYCBjaGFyYWN0ZXIgaWYgdGhlIHBhcnNlciBoYXMgcmVhY2hlZCB0aGUgZW5kXG4gICAgICAgICAgLy8gb2YgdGhlIHNvdXJjZSBzdHJpbmcuXG4gICAgICAgICAgcmV0dXJuIFwiJFwiO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIEludGVybmFsOiBQYXJzZXMgYSBKU09OIGB2YWx1ZWAgdG9rZW4uXG4gICAgICAgIHZhciBnZXQgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICB2YXIgcmVzdWx0cywgaGFzTWVtYmVycztcbiAgICAgICAgICBpZiAodmFsdWUgPT0gXCIkXCIpIHtcbiAgICAgICAgICAgIC8vIFVuZXhwZWN0ZWQgZW5kIG9mIGlucHV0LlxuICAgICAgICAgICAgYWJvcnQoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICBpZiAoKGNoYXJJbmRleEJ1Z2d5ID8gdmFsdWUuY2hhckF0KDApIDogdmFsdWVbMF0pID09IFwiQFwiKSB7XG4gICAgICAgICAgICAgIC8vIFJlbW92ZSB0aGUgc2VudGluZWwgYEBgIGNoYXJhY3Rlci5cbiAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlLnNsaWNlKDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gUGFyc2Ugb2JqZWN0IGFuZCBhcnJheSBsaXRlcmFscy5cbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcIltcIikge1xuICAgICAgICAgICAgICAvLyBQYXJzZXMgYSBKU09OIGFycmF5LCByZXR1cm5pbmcgYSBuZXcgSmF2YVNjcmlwdCBhcnJheS5cbiAgICAgICAgICAgICAgcmVzdWx0cyA9IFtdO1xuICAgICAgICAgICAgICBmb3IgKDs7IGhhc01lbWJlcnMgfHwgKGhhc01lbWJlcnMgPSB0cnVlKSkge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gbGV4KCk7XG4gICAgICAgICAgICAgICAgLy8gQSBjbG9zaW5nIHNxdWFyZSBicmFja2V0IG1hcmtzIHRoZSBlbmQgb2YgdGhlIGFycmF5IGxpdGVyYWwuXG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlID09IFwiXVwiKSB7XG4gICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gSWYgdGhlIGFycmF5IGxpdGVyYWwgY29udGFpbnMgZWxlbWVudHMsIHRoZSBjdXJyZW50IHRva2VuXG4gICAgICAgICAgICAgICAgLy8gc2hvdWxkIGJlIGEgY29tbWEgc2VwYXJhdGluZyB0aGUgcHJldmlvdXMgZWxlbWVudCBmcm9tIHRoZVxuICAgICAgICAgICAgICAgIC8vIG5leHQuXG4gICAgICAgICAgICAgICAgaWYgKGhhc01lbWJlcnMpIHtcbiAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcIixcIikge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IGxleCgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT0gXCJdXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAvLyBVbmV4cGVjdGVkIHRyYWlsaW5nIGAsYCBpbiBhcnJheSBsaXRlcmFsLlxuICAgICAgICAgICAgICAgICAgICAgIGFib3J0KCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEEgYCxgIG11c3Qgc2VwYXJhdGUgZWFjaCBhcnJheSBlbGVtZW50LlxuICAgICAgICAgICAgICAgICAgICBhYm9ydCgpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBFbGlzaW9ucyBhbmQgbGVhZGluZyBjb21tYXMgYXJlIG5vdCBwZXJtaXR0ZWQuXG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlID09IFwiLFwiKSB7XG4gICAgICAgICAgICAgICAgICBhYm9ydCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goZ2V0KHZhbHVlKSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHZhbHVlID09IFwie1wiKSB7XG4gICAgICAgICAgICAgIC8vIFBhcnNlcyBhIEpTT04gb2JqZWN0LCByZXR1cm5pbmcgYSBuZXcgSmF2YVNjcmlwdCBvYmplY3QuXG4gICAgICAgICAgICAgIHJlc3VsdHMgPSB7fTtcbiAgICAgICAgICAgICAgZm9yICg7OyBoYXNNZW1iZXJzIHx8IChoYXNNZW1iZXJzID0gdHJ1ZSkpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IGxleCgpO1xuICAgICAgICAgICAgICAgIC8vIEEgY2xvc2luZyBjdXJseSBicmFjZSBtYXJrcyB0aGUgZW5kIG9mIHRoZSBvYmplY3QgbGl0ZXJhbC5cbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT0gXCJ9XCIpIHtcbiAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBJZiB0aGUgb2JqZWN0IGxpdGVyYWwgY29udGFpbnMgbWVtYmVycywgdGhlIGN1cnJlbnQgdG9rZW5cbiAgICAgICAgICAgICAgICAvLyBzaG91bGQgYmUgYSBjb21tYSBzZXBhcmF0b3IuXG4gICAgICAgICAgICAgICAgaWYgKGhhc01lbWJlcnMpIHtcbiAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcIixcIikge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IGxleCgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT0gXCJ9XCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAvLyBVbmV4cGVjdGVkIHRyYWlsaW5nIGAsYCBpbiBvYmplY3QgbGl0ZXJhbC5cbiAgICAgICAgICAgICAgICAgICAgICBhYm9ydCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBBIGAsYCBtdXN0IHNlcGFyYXRlIGVhY2ggb2JqZWN0IG1lbWJlci5cbiAgICAgICAgICAgICAgICAgICAgYWJvcnQoKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gTGVhZGluZyBjb21tYXMgYXJlIG5vdCBwZXJtaXR0ZWQsIG9iamVjdCBwcm9wZXJ0eSBuYW1lcyBtdXN0IGJlXG4gICAgICAgICAgICAgICAgLy8gZG91YmxlLXF1b3RlZCBzdHJpbmdzLCBhbmQgYSBgOmAgbXVzdCBzZXBhcmF0ZSBlYWNoIHByb3BlcnR5XG4gICAgICAgICAgICAgICAgLy8gbmFtZSBhbmQgdmFsdWUuXG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlID09IFwiLFwiIHx8IHR5cGVvZiB2YWx1ZSAhPSBcInN0cmluZ1wiIHx8IChjaGFySW5kZXhCdWdneSA/IHZhbHVlLmNoYXJBdCgwKSA6IHZhbHVlWzBdKSAhPSBcIkBcIiB8fCBsZXgoKSAhPSBcIjpcIikge1xuICAgICAgICAgICAgICAgICAgYWJvcnQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmVzdWx0c1t2YWx1ZS5zbGljZSgxKV0gPSBnZXQobGV4KCkpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybiByZXN1bHRzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gVW5leHBlY3RlZCB0b2tlbiBlbmNvdW50ZXJlZC5cbiAgICAgICAgICAgIGFib3J0KCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBJbnRlcm5hbDogVXBkYXRlcyBhIHRyYXZlcnNlZCBvYmplY3QgbWVtYmVyLlxuICAgICAgICB2YXIgdXBkYXRlID0gZnVuY3Rpb24gKHNvdXJjZSwgcHJvcGVydHksIGNhbGxiYWNrKSB7XG4gICAgICAgICAgdmFyIGVsZW1lbnQgPSB3YWxrKHNvdXJjZSwgcHJvcGVydHksIGNhbGxiYWNrKTtcbiAgICAgICAgICBpZiAoZWxlbWVudCA9PT0gdW5kZWYpIHtcbiAgICAgICAgICAgIGRlbGV0ZSBzb3VyY2VbcHJvcGVydHldO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzb3VyY2VbcHJvcGVydHldID0gZWxlbWVudDtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gSW50ZXJuYWw6IFJlY3Vyc2l2ZWx5IHRyYXZlcnNlcyBhIHBhcnNlZCBKU09OIG9iamVjdCwgaW52b2tpbmcgdGhlXG4gICAgICAgIC8vIGBjYWxsYmFja2AgZnVuY3Rpb24gZm9yIGVhY2ggdmFsdWUuIFRoaXMgaXMgYW4gaW1wbGVtZW50YXRpb24gb2YgdGhlXG4gICAgICAgIC8vIGBXYWxrKGhvbGRlciwgbmFtZSlgIG9wZXJhdGlvbiBkZWZpbmVkIGluIEVTIDUuMSBzZWN0aW9uIDE1LjEyLjIuXG4gICAgICAgIHZhciB3YWxrID0gZnVuY3Rpb24gKHNvdXJjZSwgcHJvcGVydHksIGNhbGxiYWNrKSB7XG4gICAgICAgICAgdmFyIHZhbHVlID0gc291cmNlW3Byb3BlcnR5XSwgbGVuZ3RoO1xuICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT0gXCJvYmplY3RcIiAmJiB2YWx1ZSkge1xuICAgICAgICAgICAgLy8gYGZvckVhY2hgIGNhbid0IGJlIHVzZWQgdG8gdHJhdmVyc2UgYW4gYXJyYXkgaW4gT3BlcmEgPD0gOC41NFxuICAgICAgICAgICAgLy8gYmVjYXVzZSBpdHMgYE9iamVjdCNoYXNPd25Qcm9wZXJ0eWAgaW1wbGVtZW50YXRpb24gcmV0dXJucyBgZmFsc2VgXG4gICAgICAgICAgICAvLyBmb3IgYXJyYXkgaW5kaWNlcyAoZS5nLiwgYCFbMSwgMiwgM10uaGFzT3duUHJvcGVydHkoXCIwXCIpYCkuXG4gICAgICAgICAgICBpZiAoZ2V0Q2xhc3MuY2FsbCh2YWx1ZSkgPT0gYXJyYXlDbGFzcykge1xuICAgICAgICAgICAgICBmb3IgKGxlbmd0aCA9IHZhbHVlLmxlbmd0aDsgbGVuZ3RoLS07KSB7XG4gICAgICAgICAgICAgICAgdXBkYXRlKHZhbHVlLCBsZW5ndGgsIGNhbGxiYWNrKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgZm9yRWFjaCh2YWx1ZSwgZnVuY3Rpb24gKHByb3BlcnR5KSB7XG4gICAgICAgICAgICAgICAgdXBkYXRlKHZhbHVlLCBwcm9wZXJ0eSwgY2FsbGJhY2spO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGNhbGxiYWNrLmNhbGwoc291cmNlLCBwcm9wZXJ0eSwgdmFsdWUpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIFB1YmxpYzogYEpTT04ucGFyc2VgLiBTZWUgRVMgNS4xIHNlY3Rpb24gMTUuMTIuMi5cbiAgICAgICAgZXhwb3J0cy5wYXJzZSA9IGZ1bmN0aW9uIChzb3VyY2UsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgdmFyIHJlc3VsdCwgdmFsdWU7XG4gICAgICAgICAgSW5kZXggPSAwO1xuICAgICAgICAgIFNvdXJjZSA9IFwiXCIgKyBzb3VyY2U7XG4gICAgICAgICAgcmVzdWx0ID0gZ2V0KGxleCgpKTtcbiAgICAgICAgICAvLyBJZiBhIEpTT04gc3RyaW5nIGNvbnRhaW5zIG11bHRpcGxlIHRva2VucywgaXQgaXMgaW52YWxpZC5cbiAgICAgICAgICBpZiAobGV4KCkgIT0gXCIkXCIpIHtcbiAgICAgICAgICAgIGFib3J0KCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIFJlc2V0IHRoZSBwYXJzZXIgc3RhdGUuXG4gICAgICAgICAgSW5kZXggPSBTb3VyY2UgPSBudWxsO1xuICAgICAgICAgIHJldHVybiBjYWxsYmFjayAmJiBnZXRDbGFzcy5jYWxsKGNhbGxiYWNrKSA9PSBmdW5jdGlvbkNsYXNzID8gd2FsaygodmFsdWUgPSB7fSwgdmFsdWVbXCJcIl0gPSByZXN1bHQsIHZhbHVlKSwgXCJcIiwgY2FsbGJhY2spIDogcmVzdWx0O1xuICAgICAgICB9O1xuICAgICAgfVxuICAgIH1cblxuICAgIGV4cG9ydHNbXCJydW5JbkNvbnRleHRcIl0gPSBydW5JbkNvbnRleHQ7XG4gICAgcmV0dXJuIGV4cG9ydHM7XG4gIH1cblxuICBpZiAodHlwZW9mIGV4cG9ydHMgPT0gXCJvYmplY3RcIiAmJiBleHBvcnRzICYmICFleHBvcnRzLm5vZGVUeXBlICYmICFpc0xvYWRlcikge1xuICAgIC8vIEV4cG9ydCBmb3IgQ29tbW9uSlMgZW52aXJvbm1lbnRzLlxuICAgIHJ1bkluQ29udGV4dChyb290LCBleHBvcnRzKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBFeHBvcnQgZm9yIHdlYiBicm93c2VycyBhbmQgSmF2YVNjcmlwdCBlbmdpbmVzLlxuICAgIHZhciBuYXRpdmVKU09OID0gcm9vdC5KU09OO1xuICAgIHZhciBKU09OMyA9IHJ1bkluQ29udGV4dChyb290LCAocm9vdFtcIkpTT04zXCJdID0ge1xuICAgICAgLy8gUHVibGljOiBSZXN0b3JlcyB0aGUgb3JpZ2luYWwgdmFsdWUgb2YgdGhlIGdsb2JhbCBgSlNPTmAgb2JqZWN0IGFuZFxuICAgICAgLy8gcmV0dXJucyBhIHJlZmVyZW5jZSB0byB0aGUgYEpTT04zYCBvYmplY3QuXG4gICAgICBcIm5vQ29uZmxpY3RcIjogZnVuY3Rpb24gKCkge1xuICAgICAgICByb290LkpTT04gPSBuYXRpdmVKU09OO1xuICAgICAgICByZXR1cm4gSlNPTjM7XG4gICAgICB9XG4gICAgfSkpO1xuXG4gICAgcm9vdC5KU09OID0ge1xuICAgICAgXCJwYXJzZVwiOiBKU09OMy5wYXJzZSxcbiAgICAgIFwic3RyaW5naWZ5XCI6IEpTT04zLnN0cmluZ2lmeVxuICAgIH07XG4gIH1cblxuICAvLyBFeHBvcnQgZm9yIGFzeW5jaHJvbm91cyBtb2R1bGUgbG9hZGVycy5cbiAgaWYgKGlzTG9hZGVyKSB7XG4gICAgZGVmaW5lKGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBKU09OMztcbiAgICB9KTtcbiAgfVxufSh0aGlzKSk7XG4iLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG52YXIgdG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuXG52YXIgaXNGdW5jdGlvbiA9IGZ1bmN0aW9uIChmbikge1xuXHRyZXR1cm4gKHR5cGVvZiBmbiA9PT0gJ2Z1bmN0aW9uJyAmJiAhKGZuIGluc3RhbmNlb2YgUmVnRXhwKSkgfHwgdG9TdHJpbmcuY2FsbChmbikgPT09ICdbb2JqZWN0IEZ1bmN0aW9uXSc7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGZvckVhY2gob2JqLCBmbikge1xuXHRpZiAoIWlzRnVuY3Rpb24oZm4pKSB7XG5cdFx0dGhyb3cgbmV3IFR5cGVFcnJvcignaXRlcmF0b3IgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cdH1cblx0dmFyIGksIGssXG5cdFx0aXNTdHJpbmcgPSB0eXBlb2Ygb2JqID09PSAnc3RyaW5nJyxcblx0XHRsID0gb2JqLmxlbmd0aCxcblx0XHRjb250ZXh0ID0gYXJndW1lbnRzLmxlbmd0aCA+IDIgPyBhcmd1bWVudHNbMl0gOiBudWxsO1xuXHRpZiAobCA9PT0gK2wpIHtcblx0XHRmb3IgKGkgPSAwOyBpIDwgbDsgaSsrKSB7XG5cdFx0XHRpZiAoY29udGV4dCA9PT0gbnVsbCkge1xuXHRcdFx0XHRmbihpc1N0cmluZyA/IG9iai5jaGFyQXQoaSkgOiBvYmpbaV0sIGksIG9iaik7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRmbi5jYWxsKGNvbnRleHQsIGlzU3RyaW5nID8gb2JqLmNoYXJBdChpKSA6IG9ialtpXSwgaSwgb2JqKTtcblx0XHRcdH1cblx0XHR9XG5cdH0gZWxzZSB7XG5cdFx0Zm9yIChrIGluIG9iaikge1xuXHRcdFx0aWYgKGhhc093bi5jYWxsKG9iaiwgaykpIHtcblx0XHRcdFx0aWYgKGNvbnRleHQgPT09IG51bGwpIHtcblx0XHRcdFx0XHRmbihvYmpba10sIGssIG9iaik7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Zm4uY2FsbChjb250ZXh0LCBvYmpba10sIGssIG9iaik7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cbn07XG5cbiIsIlwidXNlIHN0cmljdFwiO1xuXG4vLyBtb2RpZmllZCBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9lcy1zaGltcy9lczUtc2hpbVxudmFyIGhhcyA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHksXG5cdHRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZyxcblx0Zm9yRWFjaCA9IHJlcXVpcmUoJy4vZm9yZWFjaCcpLFxuXHRpc0FyZ3MgPSByZXF1aXJlKCcuL2lzQXJndW1lbnRzJyksXG5cdGhhc0RvbnRFbnVtQnVnID0gISh7J3RvU3RyaW5nJzogbnVsbH0pLnByb3BlcnR5SXNFbnVtZXJhYmxlKCd0b1N0cmluZycpLFxuXHRoYXNQcm90b0VudW1CdWcgPSAoZnVuY3Rpb24gKCkge30pLnByb3BlcnR5SXNFbnVtZXJhYmxlKCdwcm90b3R5cGUnKSxcblx0ZG9udEVudW1zID0gW1xuXHRcdFwidG9TdHJpbmdcIixcblx0XHRcInRvTG9jYWxlU3RyaW5nXCIsXG5cdFx0XCJ2YWx1ZU9mXCIsXG5cdFx0XCJoYXNPd25Qcm9wZXJ0eVwiLFxuXHRcdFwiaXNQcm90b3R5cGVPZlwiLFxuXHRcdFwicHJvcGVydHlJc0VudW1lcmFibGVcIixcblx0XHRcImNvbnN0cnVjdG9yXCJcblx0XTtcblxudmFyIGtleXNTaGltID0gZnVuY3Rpb24ga2V5cyhvYmplY3QpIHtcblx0dmFyIGlzT2JqZWN0ID0gb2JqZWN0ICE9PSBudWxsICYmIHR5cGVvZiBvYmplY3QgPT09ICdvYmplY3QnLFxuXHRcdGlzRnVuY3Rpb24gPSB0b1N0cmluZy5jYWxsKG9iamVjdCkgPT09ICdbb2JqZWN0IEZ1bmN0aW9uXScsXG5cdFx0aXNBcmd1bWVudHMgPSBpc0FyZ3Mob2JqZWN0KSxcblx0XHR0aGVLZXlzID0gW107XG5cblx0aWYgKCFpc09iamVjdCAmJiAhaXNGdW5jdGlvbiAmJiAhaXNBcmd1bWVudHMpIHtcblx0XHR0aHJvdyBuZXcgVHlwZUVycm9yKFwiT2JqZWN0LmtleXMgY2FsbGVkIG9uIGEgbm9uLW9iamVjdFwiKTtcblx0fVxuXG5cdGlmIChpc0FyZ3VtZW50cykge1xuXHRcdGZvckVhY2gob2JqZWN0LCBmdW5jdGlvbiAodmFsdWUsIGluZGV4KSB7XG5cdFx0XHR0aGVLZXlzLnB1c2goaW5kZXgpO1xuXHRcdH0pO1xuXHR9IGVsc2Uge1xuXHRcdHZhciBuYW1lLFxuXHRcdFx0c2tpcFByb3RvID0gaGFzUHJvdG9FbnVtQnVnICYmIGlzRnVuY3Rpb247XG5cblx0XHRmb3IgKG5hbWUgaW4gb2JqZWN0KSB7XG5cdFx0XHRpZiAoIShza2lwUHJvdG8gJiYgbmFtZSA9PT0gJ3Byb3RvdHlwZScpICYmIGhhcy5jYWxsKG9iamVjdCwgbmFtZSkpIHtcblx0XHRcdFx0dGhlS2V5cy5wdXNoKG5hbWUpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGlmIChoYXNEb250RW51bUJ1Zykge1xuXHRcdHZhciBjdG9yID0gb2JqZWN0LmNvbnN0cnVjdG9yLFxuXHRcdFx0c2tpcENvbnN0cnVjdG9yID0gY3RvciAmJiBjdG9yLnByb3RvdHlwZSA9PT0gb2JqZWN0O1xuXG5cdFx0Zm9yRWFjaChkb250RW51bXMsIGZ1bmN0aW9uIChkb250RW51bSkge1xuXHRcdFx0aWYgKCEoc2tpcENvbnN0cnVjdG9yICYmIGRvbnRFbnVtID09PSAnY29uc3RydWN0b3InKSAmJiBoYXMuY2FsbChvYmplY3QsIGRvbnRFbnVtKSkge1xuXHRcdFx0XHR0aGVLZXlzLnB1c2goZG9udEVudW0pO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG5cdHJldHVybiB0aGVLZXlzO1xufTtcblxua2V5c1NoaW0uc2hpbSA9IGZ1bmN0aW9uIHNoaW1PYmplY3RLZXlzKCkge1xuXHRpZiAoIU9iamVjdC5rZXlzKSB7XG5cdFx0T2JqZWN0LmtleXMgPSBrZXlzU2hpbTtcblx0fVxuXHRyZXR1cm4gT2JqZWN0LmtleXMgfHwga2V5c1NoaW07XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGtleXNTaGltO1xuXG4iLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIHRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc0FyZ3VtZW50cyh2YWx1ZSkge1xuXHR2YXIgc3RyID0gdG9TdHJpbmcuY2FsbCh2YWx1ZSk7XG5cdHZhciBpc0FyZ3VtZW50cyA9IHN0ciA9PT0gJ1tvYmplY3QgQXJndW1lbnRzXSc7XG5cdGlmICghaXNBcmd1bWVudHMpIHtcblx0XHRpc0FyZ3VtZW50cyA9IHN0ciAhPT0gJ1tvYmplY3QgQXJyYXldJ1xuXHRcdFx0JiYgdmFsdWUgIT09IG51bGxcblx0XHRcdCYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCdcblx0XHRcdCYmIHR5cGVvZiB2YWx1ZS5sZW5ndGggPT09ICdudW1iZXInXG5cdFx0XHQmJiB2YWx1ZS5sZW5ndGggPj0gMFxuXHRcdFx0JiYgdG9TdHJpbmcuY2FsbCh2YWx1ZS5jYWxsZWUpID09PSAnW29iamVjdCBGdW5jdGlvbl0nO1xuXHR9XG5cdHJldHVybiBpc0FyZ3VtZW50cztcbn07XG5cbiIsIlxuLyoqXG4gKiBNb2R1bGUgZGVwZW5kZW5jaWVzLlxuICovXG5cbnZhciBtYXAgPSByZXF1aXJlKCdhcnJheS1tYXAnKTtcbnZhciBpbmRleE9mID0gcmVxdWlyZSgnaW5kZXhvZicpO1xudmFyIGlzQXJyYXkgPSByZXF1aXJlKCdpc2FycmF5Jyk7XG52YXIgZm9yRWFjaCA9IHJlcXVpcmUoJ2ZvcmVhY2gnKTtcbnZhciByZWR1Y2UgPSByZXF1aXJlKCdhcnJheS1yZWR1Y2UnKTtcbnZhciBnZXRPYmplY3RLZXlzID0gcmVxdWlyZSgnb2JqZWN0LWtleXMnKTtcbnZhciBKU09OID0gcmVxdWlyZSgnanNvbjMnKTtcblxuLyoqXG4gKiBNYWtlIHN1cmUgYE9iamVjdC5rZXlzYCB3b3JrIGZvciBgdW5kZWZpbmVkYFxuICogdmFsdWVzIHRoYXQgYXJlIHN0aWxsIHRoZXJlLCBsaWtlIGBkb2N1bWVudC5hbGxgLlxuICogaHR0cDovL2xpc3RzLnczLm9yZy9BcmNoaXZlcy9QdWJsaWMvcHVibGljLWh0bWwvMjAwOUp1bi8wNTQ2Lmh0bWxcbiAqXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBvYmplY3RLZXlzKHZhbCl7XG4gIGlmIChPYmplY3Qua2V5cykgcmV0dXJuIE9iamVjdC5rZXlzKHZhbCk7XG4gIHJldHVybiBnZXRPYmplY3RLZXlzKHZhbCk7XG59XG5cbi8qKlxuICogTW9kdWxlIGV4cG9ydHMuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBpbnNwZWN0O1xuXG4vKipcbiAqIEVjaG9zIHRoZSB2YWx1ZSBvZiBhIHZhbHVlLiBUcnlzIHRvIHByaW50IHRoZSB2YWx1ZSBvdXRcbiAqIGluIHRoZSBiZXN0IHdheSBwb3NzaWJsZSBnaXZlbiB0aGUgZGlmZmVyZW50IHR5cGVzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmogVGhlIG9iamVjdCB0byBwcmludCBvdXQuXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0cyBPcHRpb25hbCBvcHRpb25zIG9iamVjdCB0aGF0IGFsdGVycyB0aGUgb3V0cHV0LlxuICogQGxpY2Vuc2UgTUlUICjCqSBKb3llbnQpXG4gKi9cbi8qIGxlZ2FjeTogb2JqLCBzaG93SGlkZGVuLCBkZXB0aCwgY29sb3JzKi9cblxuZnVuY3Rpb24gaW5zcGVjdChvYmosIG9wdHMpIHtcbiAgLy8gZGVmYXVsdCBvcHRpb25zXG4gIHZhciBjdHggPSB7XG4gICAgc2VlbjogW10sXG4gICAgc3R5bGl6ZTogc3R5bGl6ZU5vQ29sb3JcbiAgfTtcbiAgLy8gbGVnYWN5Li4uXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDMpIGN0eC5kZXB0aCA9IGFyZ3VtZW50c1syXTtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gNCkgY3R4LmNvbG9ycyA9IGFyZ3VtZW50c1szXTtcbiAgaWYgKGlzQm9vbGVhbihvcHRzKSkge1xuICAgIC8vIGxlZ2FjeS4uLlxuICAgIGN0eC5zaG93SGlkZGVuID0gb3B0cztcbiAgfSBlbHNlIGlmIChvcHRzKSB7XG4gICAgLy8gZ290IGFuIFwib3B0aW9uc1wiIG9iamVjdFxuICAgIF9leHRlbmQoY3R4LCBvcHRzKTtcbiAgfVxuICAvLyBzZXQgZGVmYXVsdCBvcHRpb25zXG4gIGlmIChpc1VuZGVmaW5lZChjdHguc2hvd0hpZGRlbikpIGN0eC5zaG93SGlkZGVuID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguZGVwdGgpKSBjdHguZGVwdGggPSAyO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmNvbG9ycykpIGN0eC5jb2xvcnMgPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jdXN0b21JbnNwZWN0KSkgY3R4LmN1c3RvbUluc3BlY3QgPSB0cnVlO1xuICBpZiAoY3R4LmNvbG9ycykgY3R4LnN0eWxpemUgPSBzdHlsaXplV2l0aENvbG9yO1xuICByZXR1cm4gZm9ybWF0VmFsdWUoY3R4LCBvYmosIGN0eC5kZXB0aCk7XG59XG5cbi8vIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQU5TSV9lc2NhcGVfY29kZSNncmFwaGljc1xuaW5zcGVjdC5jb2xvcnMgPSB7XG4gICdib2xkJyA6IFsxLCAyMl0sXG4gICdpdGFsaWMnIDogWzMsIDIzXSxcbiAgJ3VuZGVybGluZScgOiBbNCwgMjRdLFxuICAnaW52ZXJzZScgOiBbNywgMjddLFxuICAnd2hpdGUnIDogWzM3LCAzOV0sXG4gICdncmV5JyA6IFs5MCwgMzldLFxuICAnYmxhY2snIDogWzMwLCAzOV0sXG4gICdibHVlJyA6IFszNCwgMzldLFxuICAnY3lhbicgOiBbMzYsIDM5XSxcbiAgJ2dyZWVuJyA6IFszMiwgMzldLFxuICAnbWFnZW50YScgOiBbMzUsIDM5XSxcbiAgJ3JlZCcgOiBbMzEsIDM5XSxcbiAgJ3llbGxvdycgOiBbMzMsIDM5XVxufTtcblxuLy8gRG9uJ3QgdXNlICdibHVlJyBub3QgdmlzaWJsZSBvbiBjbWQuZXhlXG5pbnNwZWN0LnN0eWxlcyA9IHtcbiAgJ3NwZWNpYWwnOiAnY3lhbicsXG4gICdudW1iZXInOiAneWVsbG93JyxcbiAgJ2Jvb2xlYW4nOiAneWVsbG93JyxcbiAgJ3VuZGVmaW5lZCc6ICdncmV5JyxcbiAgJ251bGwnOiAnYm9sZCcsXG4gICdzdHJpbmcnOiAnZ3JlZW4nLFxuICAnZGF0ZSc6ICdtYWdlbnRhJyxcbiAgLy8gXCJuYW1lXCI6IGludGVudGlvbmFsbHkgbm90IHN0eWxpbmdcbiAgJ3JlZ2V4cCc6ICdyZWQnXG59O1xuXG5mdW5jdGlvbiBzdHlsaXplTm9Db2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICByZXR1cm4gc3RyO1xufVxuXG5mdW5jdGlvbiBpc0Jvb2xlYW4oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnYm9vbGVhbic7XG59XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG5cbmZ1bmN0aW9uIHN0eWxpemVXaXRoQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgdmFyIHN0eWxlID0gaW5zcGVjdC5zdHlsZXNbc3R5bGVUeXBlXTtcblxuICBpZiAoc3R5bGUpIHtcbiAgICByZXR1cm4gJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVswXSArICdtJyArIHN0ciArXG4gICAgICAgICAgICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMV0gKyAnbSc7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHN0cjtcbiAgfVxufVxuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gaXNTdHJpbmcoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnc3RyaW5nJztcbn1cblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cblxuZnVuY3Rpb24gaXNOdWxsKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsO1xufVxuXG5mdW5jdGlvbiBoYXNPd24ob2JqLCBwcm9wKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKTtcbn1cblxuZnVuY3Rpb24gaXNSZWdFeHAocmUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KHJlKSAmJiBvYmplY3RUb1N0cmluZyhyZSkgPT09ICdbb2JqZWN0IFJlZ0V4cF0nO1xufVxuXG5mdW5jdGlvbiBpc09iamVjdChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGFyZyAhPT0gbnVsbDtcbn1cblxuZnVuY3Rpb24gaXNFcnJvcihlKSB7XG4gIHJldHVybiBpc09iamVjdChlKSAmJlxuICAgICAgKG9iamVjdFRvU3RyaW5nKGUpID09PSAnW29iamVjdCBFcnJvcl0nIHx8IGUgaW5zdGFuY2VvZiBFcnJvcik7XG59XG5cbmZ1bmN0aW9uIGlzRGF0ZShkKSB7XG4gIHJldHVybiBpc09iamVjdChkKSAmJiBvYmplY3RUb1N0cmluZyhkKSA9PT0gJ1tvYmplY3QgRGF0ZV0nO1xufVxuXG5mdW5jdGlvbiBvYmplY3RUb1N0cmluZyhvKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwobyk7XG59XG5cbmZ1bmN0aW9uIGFycmF5VG9IYXNoKGFycmF5KSB7XG4gIHZhciBoYXNoID0ge307XG5cbiAgZm9yRWFjaChhcnJheSwgZnVuY3Rpb24odmFsLCBpZHgpIHtcbiAgICBoYXNoW3ZhbF0gPSB0cnVlO1xuICB9KTtcblxuICByZXR1cm4gaGFzaDtcbn1cblxuZnVuY3Rpb24gZm9ybWF0QXJyYXkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5cykge1xuICB2YXIgb3V0cHV0ID0gW107XG4gIGZvciAodmFyIGkgPSAwLCBsID0gdmFsdWUubGVuZ3RoOyBpIDwgbDsgKytpKSB7XG4gICAgaWYgKGhhc093bih2YWx1ZSwgU3RyaW5nKGkpKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBTdHJpbmcoaSksIHRydWUpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3V0cHV0LnB1c2goJycpO1xuICAgIH1cbiAgfVxuICBmb3JFYWNoKGtleXMsIGZ1bmN0aW9uKGtleSkge1xuICAgIGlmICgha2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBrZXksIHRydWUpKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb3V0cHV0O1xufVxuXG5mdW5jdGlvbiBmb3JtYXRFcnJvcih2YWx1ZSkge1xuICByZXR1cm4gJ1snICsgRXJyb3IucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpICsgJ10nO1xufVxuXG5mdW5jdGlvbiBmb3JtYXRWYWx1ZShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMpIHtcbiAgLy8gUHJvdmlkZSBhIGhvb2sgZm9yIHVzZXItc3BlY2lmaWVkIGluc3BlY3QgZnVuY3Rpb25zLlxuICAvLyBDaGVjayB0aGF0IHZhbHVlIGlzIGFuIG9iamVjdCB3aXRoIGFuIGluc3BlY3QgZnVuY3Rpb24gb24gaXRcbiAgaWYgKGN0eC5jdXN0b21JbnNwZWN0ICYmXG4gICAgICB2YWx1ZSAmJlxuICAgICAgaXNGdW5jdGlvbih2YWx1ZS5pbnNwZWN0KSAmJlxuICAgICAgLy8gRmlsdGVyIG91dCB0aGUgdXRpbCBtb2R1bGUsIGl0J3MgaW5zcGVjdCBmdW5jdGlvbiBpcyBzcGVjaWFsXG4gICAgICB2YWx1ZS5pbnNwZWN0ICE9PSBpbnNwZWN0ICYmXG4gICAgICAvLyBBbHNvIGZpbHRlciBvdXQgYW55IHByb3RvdHlwZSBvYmplY3RzIHVzaW5nIHRoZSBjaXJjdWxhciBjaGVjay5cbiAgICAgICEodmFsdWUuY29uc3RydWN0b3IgJiYgdmFsdWUuY29uc3RydWN0b3IucHJvdG90eXBlID09PSB2YWx1ZSkpIHtcbiAgICB2YXIgcmV0ID0gdmFsdWUuaW5zcGVjdChyZWN1cnNlVGltZXMsIGN0eCk7XG4gICAgaWYgKCFpc1N0cmluZyhyZXQpKSB7XG4gICAgICByZXQgPSBmb3JtYXRWYWx1ZShjdHgsIHJldCwgcmVjdXJzZVRpbWVzKTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbiAgfVxuXG4gIC8vIFByaW1pdGl2ZSB0eXBlcyBjYW5ub3QgaGF2ZSBwcm9wZXJ0aWVzXG4gIHZhciBwcmltaXRpdmUgPSBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSk7XG4gIGlmIChwcmltaXRpdmUpIHtcbiAgICByZXR1cm4gcHJpbWl0aXZlO1xuICB9XG5cbiAgLy8gTG9vayB1cCB0aGUga2V5cyBvZiB0aGUgb2JqZWN0LlxuICB2YXIga2V5cyA9IG9iamVjdEtleXModmFsdWUpO1xuICB2YXIgdmlzaWJsZUtleXMgPSBhcnJheVRvSGFzaChrZXlzKTtcblxuICBpZiAoY3R4LnNob3dIaWRkZW4gJiYgT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMpIHtcbiAgICBrZXlzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModmFsdWUpO1xuICB9XG5cbiAgLy8gSUUgZG9lc24ndCBtYWtlIGVycm9yIGZpZWxkcyBub24tZW51bWVyYWJsZVxuICAvLyBodHRwOi8vbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvaWUvZHd3NTJzYnQodj12cy45NCkuYXNweFxuICBpZiAoaXNFcnJvcih2YWx1ZSlcbiAgICAgICYmIChpbmRleE9mKGtleXMsICdtZXNzYWdlJykgPj0gMCB8fCBpbmRleE9mKGtleXMsICdkZXNjcmlwdGlvbicpID49IDApKSB7XG4gICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIC8vIFNvbWUgdHlwZSBvZiBvYmplY3Qgd2l0aG91dCBwcm9wZXJ0aWVzIGNhbiBiZSBzaG9ydGN1dHRlZC5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgICB2YXIgbmFtZSA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbRnVuY3Rpb24nICsgbmFtZSArICddJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9XG4gICAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShEYXRlLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ2RhdGUnKTtcbiAgICB9XG4gICAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIHZhciBiYXNlID0gJycsIGFycmF5ID0gZmFsc2UsIGJyYWNlcyA9IFsneycsICd9J107XG5cbiAgLy8gTWFrZSBBcnJheSBzYXkgdGhhdCB0aGV5IGFyZSBBcnJheVxuICBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcbiAgICBhcnJheSA9IHRydWU7XG4gICAgYnJhY2VzID0gWydbJywgJ10nXTtcbiAgfVxuXG4gIC8vIE1ha2UgZnVuY3Rpb25zIHNheSB0aGF0IHRoZXkgYXJlIGZ1bmN0aW9uc1xuICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICB2YXIgbiA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgIGJhc2UgPSAnIFtGdW5jdGlvbicgKyBuICsgJ10nO1xuICB9XG5cbiAgLy8gTWFrZSBSZWdFeHBzIHNheSB0aGF0IHRoZXkgYXJlIFJlZ0V4cHNcbiAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBkYXRlcyB3aXRoIHByb3BlcnRpZXMgZmlyc3Qgc2F5IHRoZSBkYXRlXG4gIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIERhdGUucHJvdG90eXBlLnRvVVRDU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBlcnJvciB3aXRoIG1lc3NhZ2UgZmlyc3Qgc2F5IHRoZSBlcnJvclxuICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwICYmICghYXJyYXkgfHwgdmFsdWUubGVuZ3RoID09IDApKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyBicmFjZXNbMV07XG4gIH1cblxuICBpZiAocmVjdXJzZVRpbWVzIDwgMCkge1xuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW09iamVjdF0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuXG4gIGN0eC5zZWVuLnB1c2godmFsdWUpO1xuXG4gIHZhciBvdXRwdXQ7XG4gIGlmIChhcnJheSkge1xuICAgIG91dHB1dCA9IGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpO1xuICB9IGVsc2Uge1xuICAgIG91dHB1dCA9IG1hcChrZXlzLCBmdW5jdGlvbihrZXkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KTtcbiAgICB9KTtcbiAgfVxuXG4gIGN0eC5zZWVuLnBvcCgpO1xuXG4gIHJldHVybiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcyk7XG59XG5cbmZ1bmN0aW9uIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpIHtcbiAgdmFyIG5hbWUsIHN0ciwgZGVzYztcbiAgZGVzYyA9IHsgdmFsdWU6IHZhbHVlW2tleV0gfTtcbiAgaWYgKE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IpIHtcbiAgICBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih2YWx1ZSwga2V5KSB8fCBkZXNjO1xuICB9XG4gIGlmIChkZXNjLmdldCkge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXIvU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tTZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKCFoYXNPd24odmlzaWJsZUtleXMsIGtleSkpIHtcbiAgICBuYW1lID0gJ1snICsga2V5ICsgJ10nO1xuICB9XG4gIGlmICghc3RyKSB7XG4gICAgaWYgKGluZGV4T2YoY3R4LnNlZW4sIGRlc2MudmFsdWUpIDwgMCkge1xuICAgICAgaWYgKGlzTnVsbChyZWN1cnNlVGltZXMpKSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgbnVsbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIHJlY3Vyc2VUaW1lcyAtIDEpO1xuICAgICAgfVxuICAgICAgaWYgKHN0ci5pbmRleE9mKCdcXG4nKSA+IC0xKSB7XG4gICAgICAgIGlmIChhcnJheSkge1xuICAgICAgICAgIHN0ciA9IG1hcChzdHIuc3BsaXQoJ1xcbicpLCBmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJykuc3Vic3RyKDIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0ciA9ICdcXG4nICsgbWFwKHN0ci5zcGxpdCgnXFxuJyksIGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tDaXJjdWxhcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoaXNVbmRlZmluZWQobmFtZSkpIHtcbiAgICBpZiAoYXJyYXkgJiYga2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG4gICAgbmFtZSA9IEpTT04uc3RyaW5naWZ5KCcnICsga2V5KTtcbiAgICBpZiAobmFtZS5tYXRjaCgvXlwiKFthLXpBLVpfXVthLXpBLVpfMC05XSopXCIkLykpIHtcbiAgICAgIG5hbWUgPSBuYW1lLnN1YnN0cigxLCBuYW1lLmxlbmd0aCAtIDIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICduYW1lJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hbWUgPSBuYW1lLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8oXlwifFwiJCkvZywgXCInXCIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICdzdHJpbmcnKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbmFtZSArICc6ICcgKyBzdHI7XG59XG5cbmZ1bmN0aW9uIGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKSB7XG4gIGlmIChpc1VuZGVmaW5lZCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCd1bmRlZmluZWQnLCAndW5kZWZpbmVkJyk7XG4gIGlmIChpc1N0cmluZyh2YWx1ZSkpIHtcbiAgICB2YXIgc2ltcGxlID0gJ1xcJycgKyBKU09OLnN0cmluZ2lmeSh2YWx1ZSkucmVwbGFjZSgvXlwifFwiJC9nLCAnJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJykgKyAnXFwnJztcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoc2ltcGxlLCAnc3RyaW5nJyk7XG4gIH1cbiAgaWYgKGlzTnVtYmVyKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJycgKyB2YWx1ZSwgJ251bWJlcicpO1xuICBpZiAoaXNCb29sZWFuKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJycgKyB2YWx1ZSwgJ2Jvb2xlYW4nKTtcbiAgLy8gRm9yIHNvbWUgcmVhc29uIHR5cGVvZiBudWxsIGlzIFwib2JqZWN0XCIsIHNvIHNwZWNpYWwgY2FzZSBoZXJlLlxuICBpZiAoaXNOdWxsKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ251bGwnLCAnbnVsbCcpO1xufVxuXG5mdW5jdGlvbiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcykge1xuICB2YXIgbnVtTGluZXNFc3QgPSAwO1xuICB2YXIgbGVuZ3RoID0gcmVkdWNlKG91dHB1dCwgZnVuY3Rpb24ocHJldiwgY3VyKSB7XG4gICAgbnVtTGluZXNFc3QrKztcbiAgICBpZiAoY3VyLmluZGV4T2YoJ1xcbicpID49IDApIG51bUxpbmVzRXN0Kys7XG4gICAgcmV0dXJuIHByZXYgKyBjdXIucmVwbGFjZSgvXFx1MDAxYlxcW1xcZFxcZD9tL2csICcnKS5sZW5ndGggKyAxO1xuICB9LCAwKTtcblxuICBpZiAobGVuZ3RoID4gNjApIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICtcbiAgICAgICAgICAgKGJhc2UgPT09ICcnID8gJycgOiBiYXNlICsgJ1xcbiAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIG91dHB1dC5qb2luKCcsXFxuICAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIGJyYWNlc1sxXTtcbiAgfVxuXG4gIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgJyAnICsgb3V0cHV0LmpvaW4oJywgJykgKyAnICcgKyBicmFjZXNbMV07XG59XG5cbmZ1bmN0aW9uIF9leHRlbmQob3JpZ2luLCBhZGQpIHtcbiAgLy8gRG9uJ3QgZG8gYW55dGhpbmcgaWYgYWRkIGlzbid0IGFuIG9iamVjdFxuICBpZiAoIWFkZCB8fCAhaXNPYmplY3QoYWRkKSkgcmV0dXJuIG9yaWdpbjtcblxuICB2YXIga2V5cyA9IG9iamVjdEtleXMoYWRkKTtcbiAgdmFyIGkgPSBrZXlzLmxlbmd0aDtcbiAgd2hpbGUgKGktLSkge1xuICAgIG9yaWdpbltrZXlzW2ldXSA9IGFkZFtrZXlzW2ldXTtcbiAgfVxuICByZXR1cm4gb3JpZ2luO1xufVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxuLy8gVGhpcyBpcyBhIHJlcG9ydGVyIHRoYXQgbWltaWNzIE1vY2hhJ3MgYGRvdGAgcmVwb3J0ZXJcblxudmFyIFIgPSByZXF1aXJlKFwiLi4vbGliL3JlcG9ydGVyXCIpXG5cbmZ1bmN0aW9uIHdpZHRoKCkge1xuICAgIHJldHVybiBSLndpbmRvd1dpZHRoKCkgKiA0IC8gMyB8IDBcbn1cblxuZnVuY3Rpb24gcHJpbnREb3QoXywgY29sb3IpIHtcbiAgICBmdW5jdGlvbiBlbWl0KCkge1xuICAgICAgICByZXR1cm4gXy53cml0ZShSLmNvbG9yKGNvbG9yLFxuICAgICAgICAgICAgY29sb3IgPT09IFwiZmFpbFwiID8gUi5zeW1ib2xzKCkuRG90RmFpbCA6IFIuc3ltYm9scygpLkRvdCkpXG4gICAgfVxuXG4gICAgaWYgKF8uc3RhdGUuY291bnRlcisrICUgd2lkdGgoKSA9PT0gMCkge1xuICAgICAgICByZXR1cm4gXy53cml0ZShSLm5ld2xpbmUoKSArIFwiICBcIikudGhlbihlbWl0KVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBlbWl0KClcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUi5vbihcImRvdFwiLCB7XG4gICAgYWNjZXB0czogW1wid3JpdGVcIiwgXCJyZXNldFwiLCBcImNvbG9yc1wiXSxcbiAgICBjcmVhdGU6IFIuY29uc29sZVJlcG9ydGVyLFxuICAgIGJlZm9yZTogUi5zZXRDb2xvcixcbiAgICBhZnRlcjogUi51bnNldENvbG9yLFxuICAgIGluaXQ6IGZ1bmN0aW9uIChzdGF0ZSkgeyBzdGF0ZS5jb3VudGVyID0gMCB9LFxuXG4gICAgcmVwb3J0OiBmdW5jdGlvbiAoXywgcmVwb3J0KSB7XG4gICAgICAgIGlmIChyZXBvcnQuaXNFbnRlciB8fCByZXBvcnQuaXNQYXNzKSB7XG4gICAgICAgICAgICByZXR1cm4gcHJpbnREb3QoXywgUi5zcGVlZChyZXBvcnQpKVxuICAgICAgICB9IGVsc2UgaWYgKHJlcG9ydC5pc0hvb2sgfHwgcmVwb3J0LmlzRmFpbCkge1xuICAgICAgICAgICAgXy5wdXNoRXJyb3IocmVwb3J0KVxuICAgICAgICAgICAgLy8gUHJpbnQgYSBkb3QgcmVnYXJkbGVzcyBvZiBob29rIHN1Y2Nlc3NcbiAgICAgICAgICAgIHJldHVybiBwcmludERvdChfLCBcImZhaWxcIilcbiAgICAgICAgfSBlbHNlIGlmIChyZXBvcnQuaXNTa2lwKSB7XG4gICAgICAgICAgICByZXR1cm4gcHJpbnREb3QoXywgXCJza2lwXCIpXG4gICAgICAgIH0gZWxzZSBpZiAocmVwb3J0LmlzRW5kKSB7XG4gICAgICAgICAgICByZXR1cm4gXy5wcmludCgpLnRoZW4oXy5wcmludFJlc3VsdHMuYmluZChfKSlcbiAgICAgICAgfSBlbHNlIGlmIChyZXBvcnQuaXNFcnJvcikge1xuICAgICAgICAgICAgaWYgKF8uc3RhdGUuY291bnRlcikge1xuICAgICAgICAgICAgICAgIHJldHVybiBfLnByaW50KCkudGhlbihfLnByaW50RXJyb3IuYmluZChfLCByZXBvcnQpKVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gXy5wcmludEVycm9yKHJlcG9ydClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWRcbiAgICAgICAgfVxuICAgIH0sXG59KVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxuZXhwb3J0cy5kb3QgPSByZXF1aXJlKFwiLi9kb3RcIilcbmV4cG9ydHMuc3BlYyA9IHJlcXVpcmUoXCIuL3NwZWNcIilcbmV4cG9ydHMudGFwID0gcmVxdWlyZShcIi4vdGFwXCIpXG4iLCJcInVzZSBzdHJpY3RcIlxuXG4vLyBUaGlzIGlzIGEgcmVwb3J0ZXIgdGhhdCBtaW1pY3MgTW9jaGEncyBgc3BlY2AgcmVwb3J0ZXIuXG5cbnZhciBSID0gcmVxdWlyZShcIi4uL2xpYi9yZXBvcnRlclwiKVxudmFyIGMgPSBSLmNvbG9yXG5cbmZ1bmN0aW9uIGluZGVudChsZXZlbCkge1xuICAgIHZhciByZXQgPSBcIlwiXG5cbiAgICB3aGlsZSAobGV2ZWwtLSkgcmV0ICs9IFwiICBcIlxuICAgIHJldHVybiByZXRcbn1cblxuZnVuY3Rpb24gZ2V0TmFtZShsZXZlbCwgcmVwb3J0KSB7XG4gICAgcmV0dXJuIHJlcG9ydC5wYXRoW2xldmVsIC0gMV0ubmFtZVxufVxuXG5mdW5jdGlvbiBwcmludFJlcG9ydChfLCByZXBvcnQsIGluaXQpIHtcbiAgICBpZiAoXy5zdGF0ZS5sZWF2aW5nKSB7XG4gICAgICAgIF8uc3RhdGUubGVhdmluZyA9IGZhbHNlXG4gICAgICAgIHJldHVybiBfLnByaW50KCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gXy5wcmludChpbmRlbnQoXy5zdGF0ZS5sZXZlbCkgKyBpbml0KCkpXG4gICAgICAgIH0pXG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIF8ucHJpbnQoaW5kZW50KF8uc3RhdGUubGV2ZWwpICsgaW5pdCgpKVxuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBSLm9uKFwic3BlY1wiLCB7XG4gICAgYWNjZXB0czogW1wid3JpdGVcIiwgXCJyZXNldFwiLCBcImNvbG9yc1wiXSxcbiAgICBjcmVhdGU6IFIuY29uc29sZVJlcG9ydGVyLFxuICAgIGJlZm9yZTogUi5zZXRDb2xvcixcbiAgICBhZnRlcjogUi51bnNldENvbG9yLFxuXG4gICAgaW5pdDogZnVuY3Rpb24gKHN0YXRlKSB7XG4gICAgICAgIHN0YXRlLmxldmVsID0gMVxuICAgICAgICBzdGF0ZS5sZWF2aW5nID0gZmFsc2VcbiAgICB9LFxuXG4gICAgcmVwb3J0OiBmdW5jdGlvbiAoXywgcmVwb3J0KSB7XG4gICAgICAgIGlmIChyZXBvcnQuaXNTdGFydCkge1xuICAgICAgICAgICAgcmV0dXJuIF8ucHJpbnQoKVxuICAgICAgICB9IGVsc2UgaWYgKHJlcG9ydC5pc0VudGVyKSB7XG4gICAgICAgICAgICB2YXIgbGV2ZWwgPSBfLnN0YXRlLmxldmVsKytcbiAgICAgICAgICAgIHZhciBsYXN0ID0gcmVwb3J0LnBhdGhbbGV2ZWwgLSAxXVxuXG4gICAgICAgICAgICBfLnN0YXRlLmxlYXZpbmcgPSBmYWxzZVxuICAgICAgICAgICAgaWYgKGxhc3QuaW5kZXgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gXy5wcmludCgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXy5wcmludChpbmRlbnQobGV2ZWwpICsgbGFzdC5uYW1lKVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBfLnByaW50KGluZGVudChsZXZlbCkgKyBsYXN0Lm5hbWUpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAocmVwb3J0LmlzTGVhdmUpIHtcbiAgICAgICAgICAgIF8uc3RhdGUubGV2ZWwtLVxuICAgICAgICAgICAgXy5zdGF0ZS5sZWF2aW5nID0gdHJ1ZVxuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuICAgICAgICB9IGVsc2UgaWYgKHJlcG9ydC5pc1Bhc3MpIHtcbiAgICAgICAgICAgIHJldHVybiBwcmludFJlcG9ydChfLCByZXBvcnQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgc3RyID1cbiAgICAgICAgICAgICAgICAgICAgYyhcImNoZWNrbWFya1wiLCBSLnN5bWJvbHMoKS5QYXNzICsgXCIgXCIpICtcbiAgICAgICAgICAgICAgICAgICAgYyhcInBhc3NcIiwgZ2V0TmFtZShfLnN0YXRlLmxldmVsLCByZXBvcnQpKVxuXG4gICAgICAgICAgICAgICAgdmFyIHNwZWVkID0gUi5zcGVlZChyZXBvcnQpXG5cbiAgICAgICAgICAgICAgICBpZiAoc3BlZWQgIT09IFwiZmFzdFwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0ciArPSBjKHNwZWVkLCBcIiAoXCIgKyByZXBvcnQuZHVyYXRpb24gKyBcIm1zKVwiKVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBzdHJcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0gZWxzZSBpZiAocmVwb3J0LmlzSG9vayB8fCByZXBvcnQuaXNGYWlsKSB7XG4gICAgICAgICAgICBfLnB1c2hFcnJvcihyZXBvcnQpXG5cbiAgICAgICAgICAgIC8vIERvbid0IHByaW50IHRoZSBkZXNjcmlwdGlvbiBsaW5lIG9uIGN1bXVsYXRpdmUgaG9va3NcbiAgICAgICAgICAgIGlmIChyZXBvcnQuaXNIb29rICYmIChyZXBvcnQuaXNCZWZvcmVBbGwgfHwgcmVwb3J0LmlzQWZ0ZXJBbGwpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gcHJpbnRSZXBvcnQoXywgcmVwb3J0LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGMoXCJmYWlsXCIsXG4gICAgICAgICAgICAgICAgICAgIF8uZXJyb3JzLmxlbmd0aCArIFwiKSBcIiArIGdldE5hbWUoXy5zdGF0ZS5sZXZlbCwgcmVwb3J0KSArXG4gICAgICAgICAgICAgICAgICAgIFIuZm9ybWF0UmVzdChyZXBvcnQpKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSBlbHNlIGlmIChyZXBvcnQuaXNTa2lwKSB7XG4gICAgICAgICAgICByZXR1cm4gcHJpbnRSZXBvcnQoXywgcmVwb3J0LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGMoXCJza2lwXCIsIFwiLSBcIiArIGdldE5hbWUoXy5zdGF0ZS5sZXZlbCwgcmVwb3J0KSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cblxuICAgICAgICBpZiAocmVwb3J0LmlzRW5kKSByZXR1cm4gXy5wcmludFJlc3VsdHMoKVxuICAgICAgICBpZiAocmVwb3J0LmlzRXJyb3IpIHJldHVybiBfLnByaW50RXJyb3IocmVwb3J0KVxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgfSxcbn0pXG4iLCJcInVzZSBzdHJpY3RcIlxuXG4vLyBUaGlzIGlzIGEgYmFzaWMgVEFQLWdlbmVyYXRpbmcgcmVwb3J0ZXIuXG5cbnZhciBwZWFjaCA9IHJlcXVpcmUoXCIuLi9saWIvdXRpbFwiKS5wZWFjaFxudmFyIFIgPSByZXF1aXJlKFwiLi4vbGliL3JlcG9ydGVyXCIpXG52YXIgaW5zcGVjdCA9IHJlcXVpcmUoXCJjbGVhbi1hc3NlcnQtdXRpbFwiKS5pbnNwZWN0XG5cbmZ1bmN0aW9uIHNob3VsZEJyZWFrKG1pbkxlbmd0aCwgc3RyKSB7XG4gICAgcmV0dXJuIHN0ci5sZW5ndGggPiBSLndpbmRvd1dpZHRoKCkgLSBtaW5MZW5ndGggfHwgL1xccj9cXG58Wzo/LV0vLnRlc3Qoc3RyKVxufVxuXG5mdW5jdGlvbiB0ZW1wbGF0ZShfLCByZXBvcnQsIHRtcGwsIHNraXApIHtcbiAgICBpZiAoIXNraXApIF8uc3RhdGUuY291bnRlcisrXG4gICAgdmFyIHBhdGggPSBSLmpvaW5QYXRoKHJlcG9ydCkucmVwbGFjZSgvXFwkL2csIFwiJCQkJFwiKVxuXG4gICAgcmV0dXJuIF8ucHJpbnQoXG4gICAgICAgIHRtcGwucmVwbGFjZSgvJWMvZywgXy5zdGF0ZS5jb3VudGVyKVxuICAgICAgICAgICAgLnJlcGxhY2UoLyVwL2csIHBhdGggKyBSLmZvcm1hdFJlc3QocmVwb3J0KSkpXG59XG5cbmZ1bmN0aW9uIHByaW50TGluZXMoXywgdmFsdWUsIHNraXBGaXJzdCkge1xuICAgIHZhciBsaW5lcyA9IHZhbHVlLnNwbGl0KC9cXHI/XFxuL2cpXG5cbiAgICBpZiAoc2tpcEZpcnN0KSBsaW5lcy5zaGlmdCgpXG4gICAgcmV0dXJuIHBlYWNoKGxpbmVzLCBmdW5jdGlvbiAobGluZSkgeyByZXR1cm4gXy5wcmludChcIiAgICBcIiArIGxpbmUpIH0pXG59XG5cbmZ1bmN0aW9uIHByaW50UmF3KF8sIGtleSwgc3RyKSB7XG4gICAgaWYgKHNob3VsZEJyZWFrKGtleS5sZW5ndGgsIHN0cikpIHtcbiAgICAgICAgcmV0dXJuIF8ucHJpbnQoXCIgIFwiICsga2V5ICsgXCI6IHwtXCIpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIHByaW50TGluZXMoXywgc3RyLCBmYWxzZSkgfSlcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gXy5wcmludChcIiAgXCIgKyBrZXkgKyBcIjogXCIgKyBzdHIpXG4gICAgfVxufVxuXG5mdW5jdGlvbiBwcmludFZhbHVlKF8sIGtleSwgdmFsdWUpIHtcbiAgICByZXR1cm4gcHJpbnRSYXcoXywga2V5LCBpbnNwZWN0KHZhbHVlKSlcbn1cblxuZnVuY3Rpb24gcHJpbnRMaW5lKHAsIF8sIGxpbmUpIHtcbiAgICByZXR1cm4gcC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIF8ucHJpbnQobGluZSkgfSlcbn1cblxuZnVuY3Rpb24gcHJpbnRFcnJvcihfLCByZXBvcnQpIHtcbiAgICB2YXIgZXJyID0gcmVwb3J0LmVycm9yXG5cbiAgICBpZiAoIShlcnIgaW5zdGFuY2VvZiBFcnJvcikpIHtcbiAgICAgICAgcmV0dXJuIHByaW50VmFsdWUoXywgXCJ2YWx1ZVwiLCBlcnIpXG4gICAgfVxuXG4gICAgLy8gTGV0J3MgKm5vdCogZGVwZW5kIG9uIHRoZSBjb25zdHJ1Y3RvciBiZWluZyBUaGFsbGl1bSdzLi4uXG4gICAgaWYgKGVyci5uYW1lICE9PSBcIkFzc2VydGlvbkVycm9yXCIpIHtcbiAgICAgICAgcmV0dXJuIF8ucHJpbnQoXCIgIHN0YWNrOiB8LVwiKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBwcmludExpbmVzKF8sIFIuZ2V0U3RhY2soZXJyKSwgZmFsc2UpXG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgcmV0dXJuIHByaW50VmFsdWUoXywgXCJleHBlY3RlZFwiLCBlcnIuZXhwZWN0ZWQpXG4gICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gcHJpbnRWYWx1ZShfLCBcImFjdHVhbFwiLCBlcnIuYWN0dWFsKSB9KVxuICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIHByaW50UmF3KF8sIFwibWVzc2FnZVwiLCBlcnIubWVzc2FnZSkgfSlcbiAgICAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiBfLnByaW50KFwiICBzdGFjazogfC1cIikgfSlcbiAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBtZXNzYWdlID0gZXJyLm1lc3NhZ2VcblxuICAgICAgICBlcnIubWVzc2FnZSA9IFwiXCJcbiAgICAgICAgcmV0dXJuIHByaW50TGluZXMoXywgUi5nZXRTdGFjayhlcnIpLCB0cnVlKVxuICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7IGVyci5tZXNzYWdlID0gbWVzc2FnZSB9KVxuICAgIH0pXG59XG5cbm1vZHVsZS5leHBvcnRzID0gUi5vbihcInRhcFwiLCB7XG4gICAgYWNjZXB0czogW1wid3JpdGVcIiwgXCJyZXNldFwiXSxcbiAgICBjcmVhdGU6IFIuY29uc29sZVJlcG9ydGVyLFxuICAgIGluaXQ6IGZ1bmN0aW9uIChzdGF0ZSkgeyBzdGF0ZS5jb3VudGVyID0gMCB9LFxuXG4gICAgcmVwb3J0OiBmdW5jdGlvbiAoXywgcmVwb3J0KSB7XG4gICAgICAgIGlmIChyZXBvcnQuaXNTdGFydCkge1xuICAgICAgICAgICAgcmV0dXJuIF8ucHJpbnQoXCJUQVAgdmVyc2lvbiAxM1wiKVxuICAgICAgICB9IGVsc2UgaWYgKHJlcG9ydC5pc0VudGVyKSB7XG4gICAgICAgICAgICAvLyBQcmludCBhIGxlYWRpbmcgY29tbWVudCwgdG8gbWFrZSBzb21lIFRBUCBmb3JtYXR0ZXJzIHByZXR0aWVyLlxuICAgICAgICAgICAgcmV0dXJuIHRlbXBsYXRlKF8sIHJlcG9ydCwgXCIjICVwXCIsIHRydWUpXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiB0ZW1wbGF0ZShfLCByZXBvcnQsIFwib2sgJWNcIikgfSlcbiAgICAgICAgfSBlbHNlIGlmIChyZXBvcnQuaXNQYXNzKSB7XG4gICAgICAgICAgICByZXR1cm4gdGVtcGxhdGUoXywgcmVwb3J0LCBcIm9rICVjICVwXCIpXG4gICAgICAgIH0gZWxzZSBpZiAocmVwb3J0LmlzRmFpbCB8fCByZXBvcnQuaXNIb29rKSB7XG4gICAgICAgICAgICByZXR1cm4gdGVtcGxhdGUoXywgcmVwb3J0LCBcIm5vdCBvayAlYyAlcFwiKVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gXy5wcmludChcIiAgLS0tXCIpIH0pXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiBwcmludEVycm9yKF8sIHJlcG9ydCkgfSlcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIF8ucHJpbnQoXCIgIC4uLlwiKSB9KVxuICAgICAgICB9IGVsc2UgaWYgKHJlcG9ydC5pc1NraXApIHtcbiAgICAgICAgICAgIHJldHVybiB0ZW1wbGF0ZShfLCByZXBvcnQsIFwib2sgJWMgIyBza2lwICVwXCIpXG4gICAgICAgIH0gZWxzZSBpZiAocmVwb3J0LmlzRW5kKSB7XG4gICAgICAgICAgICB2YXIgcCA9IF8ucHJpbnQoXCIxLi5cIiArIF8uc3RhdGUuY291bnRlcilcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIF8ucHJpbnQoXCIjIHRlc3RzIFwiICsgXy50ZXN0cykgfSlcblxuICAgICAgICAgICAgaWYgKF8ucGFzcykgcCA9IHByaW50TGluZShwLCBfLCBcIiMgcGFzcyBcIiArIF8ucGFzcylcbiAgICAgICAgICAgIGlmIChfLmZhaWwpIHAgPSBwcmludExpbmUocCwgXywgXCIjIGZhaWwgXCIgKyBfLmZhaWwpXG4gICAgICAgICAgICBpZiAoXy5za2lwKSBwID0gcHJpbnRMaW5lKHAsIF8sIFwiIyBza2lwIFwiICsgXy5za2lwKVxuICAgICAgICAgICAgcmV0dXJuIHByaW50TGluZShwLCBfLCBcIiMgZHVyYXRpb24gXCIgKyBSLmZvcm1hdFRpbWUoXy5kdXJhdGlvbikpXG4gICAgICAgIH0gZWxzZSBpZiAocmVwb3J0LmlzRXJyb3IpIHtcbiAgICAgICAgICAgIHJldHVybiBfLnByaW50KFwiQmFpbCBvdXQhXCIpXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiBfLnByaW50KFwiICAtLS1cIikgfSlcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIHByaW50RXJyb3IoXywgcmVwb3J0KSB9KVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gXy5wcmludChcIiAgLi4uXCIpIH0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgICAgIH1cbiAgICB9LFxufSlcbiIsIlwidXNlIHN0cmljdFwiXG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4uL2xpYi9icm93c2VyLWJ1bmRsZVwiKVxuXG5yZXF1aXJlKFwiLi4vbWlncmF0ZS9pbmRleFwiKVxuXG4vLyBOb3RlOiBib3RoIG9mIHRoZXNlIGFyZSBkZXByZWNhdGVkXG5tb2R1bGUuZXhwb3J0cy5hc3NlcnRpb25zID0gcmVxdWlyZShcIi4uL2Fzc2VydGlvbnNcIilcbm1vZHVsZS5leHBvcnRzLmNyZWF0ZSA9IHJlcXVpcmUoXCIuLi9taWdyYXRlL2NvbW1vblwiKS5kZXByZWNhdGUoXG4gICAgXCJgdGwuY3JlYXRlYCBpcyBkZXByZWNhdGVkLiBQbGVhc2UgdXNlIGB0bC5yb290YCBpbnN0ZWFkLlwiLFxuICAgIG1vZHVsZS5leHBvcnRzLnJvb3QpXG4iXX0=
