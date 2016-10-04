"use strict"

/**
 * Core TDD-style assertions. These are done by a composition of DSLs, since
 * there is *so* much repetition.
 */

var match = require("./match.js")
var deprecated = require("./lib/deprecated.js")

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

/**
 * The core assertions export, as a plugin.
 */
module.exports = function (t) {
    methods.forEach(function (m) {
        t.define(m.name, deprecated.wrapAssertion(m.name, m.callback))
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
