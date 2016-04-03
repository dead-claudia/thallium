"use strict"

/**
 * Core TDD-style assertions. These are done by a composition of DSLs, since
 * there is *so* much repetition.
 */

var is = require("./util/is.js")
var deepEqualImpl = require("./util/deep-equal.js").deepEqual
var strictIs = is.strictIs
var looseIs = is.looseIs

var toString = Object.prototype.toString
var hasOwn = Object.prototype.hasOwnProperty

function wrapDeepEqual(type) {
    return function (a, b) {
        return deepEqualImpl(a, b, type)
    }
}

var looseDeepEqual = wrapDeepEqual("loose")
var deepEqual = wrapDeepEqual("strict")
var deepEqualMatch = wrapDeepEqual("match")

// This holds everything to be added.
var methods = []
var aliases = []

/**
 * The core assertions export, as a plugin.
 */
exports.assertions = function (t) {
    methods.forEach(function (m) {
        t.define(m.name, m.callback)
    })

    aliases.forEach(function (alias) {
        t[alias.name] = t[alias.original]
    })
}

// Little helpers so that these functions only need to be created once.
function define(name, callback) {
    methods.push({name: name, callback: callback})
}

function alias(name, original) {
    aliases.push({name: name, original: original})
}

// Much easier to type
function negate(name) {
    return "not" + name[0].toUpperCase() + name.slice(1)
}

// The basic assert. It's almost there for looks, given how easy it is to
// define your own assertions.
function sanitize(message) {
    return message ? (message + "").replace(/(\{\w+\})/g, "\\$1") : ""
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
    define(name, function (x) {
        return {
            test: func(x),
            actual: x,
            message: messages[0],
        }
    })

    define(negate(name), function (x) {
        return {
            test: !func(x),
            actual: x,
            message: messages[1],
        }
    })
}

function binary(name, func, messages) {
    define(name, function (a, b) {
        return {
            test: func(a, b),
            actual: a,
            expected: b,
            message: messages[0],
        }
    })

    define(negate(name), function (a, b) {
        return {
            test: !func(a, b),
            actual: a,
            expected: b,
            message: messages[1],
        }
    })
}

unary("ok", function (x) { return !!x }, [
    "Expected {actual} to be ok",
    "Expected {actual} to not be ok",
])

;["boolean", "function", "number", "object", "string", "symbol"]
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
    return {
        test: typeof object === type,
        expected: type,
        actual: typeof object,
        o: object,
        message: "Expected typeof {o} to be {expected}, but found {actual}",
    }
})

define("notType", function (object, type) {
    return {
        test: typeof object !== type,
        expected: type,
        o: object,
        message: "Expected typeof {o} to not be {expected}",
    }
})

define("instanceof", function (object, Type) {
    return {
        test: object instanceof Type,
        expected: Type,
        actual: object.constructor,
        o: object,
        message: "Expected {o} to be an instance of {expected}, but found {actual}", // eslint-disable-line max-len
    }
})

define("notInstanceof", function (object, Type) {
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

binary("looseEqual", looseIs, [
    "Expected {actual} to loosely equal {expected}",
    "Expected {actual} to not loosely equal {expected}",
])

binary("deepEqual", deepEqual, [
    "Expected {actual} to deeply equal {expected}",
    "Expected {actual} to not deeply equal {expected}",
])

binary("looseDeepEqual", looseDeepEqual, [
    "Expected {actual} to loosely match {expected}",
    "Expected {actual} to not loosely match {expected}",
])

binary("match", deepEqualMatch, [
    "Expected {actual} to match {keys}",
    "Expected {actual} to not match {keys}",
])

alias("matchLoose", "looseDeepEqual")
alias("notMatchLoose", "notLooseDeepEqual")

function has(name, equals, check, messages) {
    define(name, function (object, key, value) {
        var test = check(object, key)

        if (arguments.length >= 3) {
            return {
                test: test && equals(object[key], value),
                expected: value,
                actual: object[key],
                key: key,
                object: object,
                message: messages[0],
            }
        } else {
            return {
                test: test,
                expected: key,
                actual: object,
                message: messages[1],
            }
        }
    })

    define(negate(name), function (object, key, value) {
        var test = !check(object, key)

        if (arguments.length >= 3) {
            return {
                test: test || !equals(object[key], value),
                actual: value,
                key: key,
                object: object,
                message: messages[2],
            }
        } else {
            return {
                test: test,
                expected: key,
                actual: object,
                message: messages[3],
            }
        }
    })
}

function hasOwnKey(object, key) { return hasOwn.call(object, key) }
function hasInKey(object, key) { return key in object }

has("hasOwn", strictIs, hasOwnKey, [
    "Expected {object} to have own key {key} equal to {expected}, but found {actual}", // eslint-disable-line max-len
    "Expected {actual} to have own key {expected}",
    "Expected {object} to not have own key {key} equal to {actual}",
    "Expected {actual} to not have own key {expected}",
])

has("looseHasOwn", looseIs, hasOwnKey, [
    "Expected {object} to have own key {key} loosely equal to {expected}, but found {actual}", // eslint-disable-line max-len
    "Expected {actual} to have own key {expected}",
    "Expected {object} to not have own key {key} loosely equal to {actual}",
    "Expected {actual} to not have own key {expected}",
])

has("hasKey", strictIs, hasInKey, [
    "Expected {object} to have key {key} equal to {expected}, but found {actual}", // eslint-disable-line max-len
    "Expected {actual} to have key {expected}",
    "Expected {object} to not have key {key} equal to {actual}",
    "Expected {actual} to not have key {expected}",
])

has("looseHasKey", looseIs, hasInKey, [
    "Expected {object} to have key {key} loosely equal to {expected}, but found {actual}", // eslint-disable-line max-len
    "Expected {actual} to have key {expected}",
    "Expected {object} to not have key {key} loosely equal to {actual}",
    "Expected {actual} to not have key {expected}",
])

function getName(func) {
    if (func.name != null) return func.name || "<anonymous>"
    if (func.displayName != null) return func.displayName || "<anonymous>"
    return "<anonymous>"
}

function throws(name, methods) {
    function run(invert, func, matcher) {
        var test, error

        try {
            func()
        } catch (e) {
            test = methods.check(matcher, error = e)
        }

        if (invert) test = !test

        return {
            test: test !== false,
            expected: matcher,
            func: func,
            error: error,
            message: methods.message(matcher, invert, test),
        }
    }

    define(name, function (func, test) { return run(false, func, test) })
    define(negate(name), function (func, test) { return run(true, func, test) })
}

throws("throws", {
    check: function (Type, e) {
        return Type == null || e instanceof Type
    },

    message: function (Type, invert, test) {
        var str = "Expected {func} to "

        if (invert) str += "not "
        str += "throw"

        if (Type != null) {
            str += " an instance of " + getName(Type)
            if (!invert && test !== undefined) str += ", but found {error}"
        }

        return str
    },
})

throws("throwsMatch", {
    check: function (matcher, e) {
        if (typeof matcher === "string") return e.message === matcher
        if (toString.call(matcher) === "[object RegExp]") {
            return matcher.test(e.message)
        }
        // Not accepting objects yet.
        if (typeof matcher !== "function") {
            throw new TypeError("Unexpected matcher type: " + typeof matcher)
        }
        return !!matcher(e)
    },

    message: function (_, invert, test) {
        if (invert) {
            return "Expected {func} to not throw an error that matches {expected}" // eslint-disable-line max-len
        } else if (test === undefined) {
            return "Expected {func} to throw an error that matches {expected}, but found no error" // eslint-disable-line max-len
        } else {
            return "Expected {func} to throw an error that matches {expected}, but found {error}" // eslint-disable-line max-len
        }
    },
})

function len(name, compare, message) {
    define(name, function (object, length) {
        return {
            test: object.length != null && compare(object.length, +length),
            expected: length,
            actual: object.length,
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
    return {
        test: Math.abs(actual - expected) <= Math.abs(delta),
        actual: actual,
        expected: expected,
        delta: delta,
        message: "Expected {actual} to be within {delta} of {expected}",
    }
})

define("notCloseTo", function (actual, expected, delta) {
    return {
        test: Math.abs(actual - expected) > Math.abs(delta),
        actual: actual,
        expected: expected,
        delta: delta,
        message: "Expected {actual} to not be within {delta} of {expected}",
    }
})

/**
 * There's 4 sets of 4 permutations here instead of N sets of 2 (which would
 * fit the `foo`/`notFoo` idiom better), so it's easier to just make a DSL and
 * use that to define everything.
 *
 * Here's the top level:
 *
 * - strict includes
 * - loose includes
 * - strict deep includes
 * - loose deep includes
 *
 * And the second level (below uses 'any' instead of 'some' in its idioms):
 *
 * - includes all/not missing some
 * - including some/not missing all
 * - not including all/missing some
 * - not including some/missing all
 *
 * A near-identical DSL is used to define the hasKeys set as well, although
 * those are also overloaded to consume either an array (in which it simply
 * compares the object's keys to a list of keys) or an object (where it does a
 * full deep comparison). Do note that most of the hasKeys set are effectively
 * aliases for half of the methods if called with an array, since no actual
 * property access occurs.
 */
function makeIncludes(all, func) {
    return function (array, keys) {
        if (all) {
            return array.length >= keys.length && keys.every(function (key) {
                return array.some(function (i) { return func(key, i) })
            })
        } else {
            return keys.some(function (key) {
                return array.some(function (i) { return func(key, i) })
            })
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

defineIncludes("includes", includesAll, false, "Expected {actual} to have all values in {value}")
defineIncludes("notIncludesAll", includesAll, true, "Expected {actual} to not have all values in {value}")
defineIncludes("includesAny", includesAny, false, "Expected {actual} to have any value in {value}")
defineIncludes("notIncludes", includesAny, true, "Expected {actual} to not have any value in {value}")

var includesLooseAll = makeIncludes(true, looseIs)
var includesLooseAny = makeIncludes(false, looseIs)

defineIncludes("includesLoose", includesLooseAll, false, "Expected {actual} to loosely have all values in {value}")
defineIncludes("notIncludesLooseAll", includesLooseAll, true, "Expected {actual} to not loosely have all values in {value}")
defineIncludes("includesLooseAny", includesLooseAny, false, "Expected {actual} to loosely have any value in {value}")
defineIncludes("notIncludesLoose", includesLooseAny, true, "Expected {actual} to not loosely have any value in {value}")

var includesDeepAll = makeIncludes(true, deepEqual)
var includesDeepAny = makeIncludes(false, deepEqual)

defineIncludes("includesDeep", includesDeepAll, false, "Expected {actual} to match all values in {value}")
defineIncludes("notIncludesDeepAll", includesDeepAll, true, "Expected {actual} to not match all values in {value}")
defineIncludes("includesDeepAny", includesDeepAny, false, "Expected {actual} to match any value in {value}")
defineIncludes("notIncludesDeep", includesDeepAny, true, "Expected {actual} to not match any value in {value}")

var includesLooseDeepAll = makeIncludes(true, looseDeepEqual)
var includesLooseDeepAny = makeIncludes(false, looseDeepEqual)

defineIncludes("includesLooseDeep", includesLooseDeepAll, false, "Expected {actual} to loosely match all values in {value}")
defineIncludes("notIncludesLooseDeepAll", includesLooseDeepAll, true, "Expected {actual} to not loosely match all values in {value}")
defineIncludes("includesLooseDeepAny", includesLooseDeepAny, false, "Expected {actual} to loosely match any value in {value}")
defineIncludes("notIncludesLooseDeep", includesLooseDeepAny, true, "Expected {actual} to not loosely match any value in {value}")

var includesMatchDeepAll = makeIncludes(true, deepEqualMatch)
var includesMatchDeepAny = makeIncludes(false, deepEqualMatch)

defineIncludes("includesMatch", includesMatchDeepAll, false, "Expected {actual} to match all values in {value}")
defineIncludes("notIncludesMatchAll", includesMatchDeepAll, true, "Expected {actual} to not match all values in {value}")
defineIncludes("includesMatchAny", includesMatchDeepAny, false, "Expected {actual} to match any value in {value}")
defineIncludes("notIncludesMatch", includesMatchDeepAny, true, "Expected {actual} to not match any value in {value}")

alias("includesMatchLoose", "includesLooseDeep")
alias("notIncludesMatchLooseAll", "notIncludesLooseDeepAll")
alias("includesMatchLooseAny", "includesLooseDeepAny")
alias("notIncludesMatchLoose", "notIncludesLooseDeep")

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

        function f(key) {
            return hasOwn.call(object, key) && func(keys[key], object[key])
        }

        if (all) {
            return Object.keys(keys).every(f)
        } else {
            return Object.keys(keys).some(f)
        }
    }
}

function hasOverloadType(all, func) {
    return {
        object: hasKeysType(all, func),
        array: function (object, keys) {
            function f(key) { return hasOwn.call(object, key) }
            return all ? keys.every(f) : keys.some(f)
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

var hasLooseAllKeys = hasKeysType(true, looseIs)
var hasLooseAnyKeys = hasKeysType(false, looseIs)

makeHasKeys("hasLooseKeys", hasLooseAllKeys, false, "Expected {actual} to loosely have all keys in {keys}")
makeHasKeys("notHasLooseAllKeys", hasLooseAllKeys, true, "Expected {actual} to not loosely have all keys in {keys}")
makeHasKeys("hasLooseAnyKeys", hasLooseAnyKeys, false, "Expected {actual} to loosely have any key in {keys}")
makeHasKeys("notHasLooseKeys", hasLooseAnyKeys, true, "Expected {actual} to not loosely have any key in {keys}")

var hasDeepAllKeys = hasKeysType(true, deepEqual)
var hasDeepAnyKeys = hasKeysType(false, deepEqual)

makeHasKeys("hasDeepKeys", hasDeepAllKeys, false, "Expected {actual} to have all keys in {keys}")
makeHasKeys("notHasDeepAllKeys", hasDeepAllKeys, true, "Expected {actual} to not have all keys in {keys}")
makeHasKeys("hasDeepAnyKeys", hasDeepAnyKeys, false, "Expected {actual} to have any key in {keys}")
makeHasKeys("notHasDeepKeys", hasDeepAnyKeys, true, "Expected {actual} to not have any key in {keys}")

var hasLooseDeepAllKeys = hasKeysType(true, looseDeepEqual)
var hasLooseDeepAnyKeys = hasKeysType(false, looseDeepEqual)

makeHasKeys("hasLooseDeepKeys", hasLooseDeepAllKeys, false, "Expected {actual} to loosely match all keys in {keys}")
makeHasKeys("notHasLooseDeepAllKeys", hasLooseDeepAllKeys, true, "Expected {actual} to not loosely match all keys in {keys}")
makeHasKeys("hasLooseDeepAnyKeys", hasLooseDeepAnyKeys, false, "Expected {actual} to loosely match any key in {keys}")
makeHasKeys("notHasLooseDeepKeys", hasLooseDeepAnyKeys, true, "Expected {actual} to not loosely match any key in {keys}")

var hasMatchAllKeys = hasKeysType(true, deepEqualMatch)
var hasMatchAnyKeys = hasKeysType(false, deepEqualMatch)

makeHasKeys("hasMatchKeys", hasMatchAllKeys, false, "Expected {actual} to match all keys in {keys}")
makeHasKeys("notHasMatchAllKeys", hasMatchAllKeys, true, "Expected {actual} to not match all keys in {keys}")
makeHasKeys("hasMatchAnyKeys", hasMatchAnyKeys, false, "Expected {actual} to match any key in {keys}")
makeHasKeys("notHasMatchKeys", hasMatchAnyKeys, true, "Expected {actual} to not match any key in {keys}")

alias("hasMatchLooseKeys", "hasLooseDeepKeys")
alias("notHasMatchLooseAllKeys", "notHasLooseDeepAllKeys")
alias("hasMatchLooseAnyKeys", "hasLooseDeepAnyKeys")
alias("notHasMatchLooseKeys", "notHasLooseDeepKeys")
