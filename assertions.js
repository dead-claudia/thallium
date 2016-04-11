"use strict"

/**
 * Core TDD-style assertions. These are done by a composition of DSLs, since
 * there is *so* much repetition.
 */

const Util = require("./lib/util.js")
const deepEqualImpl = require("./lib/deep-equal.js")

const toString = Object.prototype.toString
const hasOwn = Object.prototype.hasOwnProperty

const looseDeepEqual = (a, b) => deepEqualImpl(a, b, "loose")
const deepEqual = (a, b) => deepEqualImpl(a, b, "strict")
const deepEqualMatch = (a, b) => deepEqualImpl(a, b, "match")

// This holds everything to be added.
const methods = []
const aliases = []

/**
 * The core assertions export, as a plugin.
 */
module.exports = t => {
    methods.forEach(m => t.define(m.name, m.callback))
    aliases.forEach(alias => t[alias.name] = t[alias.original])
}

// Little helpers so that these functions only need to be created once.
function define(name, callback) {
    methods.push({name, callback})
}

function alias(name, original) {
    aliases.push({name, original})
}

// Much easier to type
function negate(name) {
    return `not${name[0].toUpperCase()}${name.slice(1)}`
}

// The basic assert. It's almost there for looks, given how easy it is to
// define your own assertions.
function sanitize(message) {
    return message ? `${message}`.replace(/(\{\w+\})/g, "\\$1") : ""
}

define("assert", (test, message) => ({test, message: sanitize(message)}))
define("fail", message => ({test: false, message: sanitize(message)}))

/**
 * These makes many of the common operators much easier to do.
 */
function unary(name, func, messages) {
    define(name, x => ({
        test: func(x),
        actual: x,
        message: messages[0],
    }))

    define(negate(name), x => ({
        test: !func(x),
        actual: x,
        message: messages[1],
    }))
}

function binary(name, func, messages) {
    define(name, (a, b) => ({
        test: func(a, b),
        actual: a,
        expected: b,
        message: messages[0],
    }))

    define(negate(name), (a, b) => ({
        test: !func(a, b),
        actual: a,
        expected: b,
        message: messages[1],
    }))
}

unary("ok", x => !!x, [
    "Expected {actual} to be ok",
    "Expected {actual} to not be ok",
])

for (const type of "boolean function number object string symbol".split(" ")) {
    const name = (type[0] === "o" ? "an " : "a ") + type

    unary(type, x => typeof x === type, [
        `Expected {actual} to be ${name}`,
        `Expected {actual} to not be ${name}`,
    ])
}

for (const value of [true, false, null, undefined]) {
    unary(`${value}`, x => x === value, [
        `Expected {actual} to be ${value}`,
        `Expected {actual} to not be ${value}`,
    ])
}

unary("exists", x => x != null, [
    "Expected {actual} to exist",
    "Expected {actual} to not exist",
])

unary("array", Array.isArray, [
    "Expected {actual} to be an array",
    "Expected {actual} to not be an array",
])

define("type", (object, type) => ({
    test: typeof object === type,
    expected: type,
    actual: typeof object,
    o: object,
    message: "Expected typeof {o} to be {expected}, but found {actual}",
}))

define("notType", (object, type) => ({
    test: typeof object !== type,
    expected: type,
    o: object,
    message: "Expected typeof {o} to not be {expected}",
}))

define("instanceof", (object, Type) => ({
    test: object instanceof Type,
    expected: Type,
    actual: object.constructor,
    o: object,
    message: "Expected {o} to be an instance of {expected}, but found {actual}",
}))

define("notInstanceof", (object, Type) => ({
    test: !(object instanceof Type),
    expected: Type,
    o: object,
    message: "Expected {o} to not be an instance of {expected}",
}))

binary("equal", Util.strictIs, [
    "Expected {actual} to equal {expected}",
    "Expected {actual} to not equal {expected}",
])

binary("looseEqual", Util.looseIs, [
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
    "Expected {actual} to match {expected}",
    "Expected {actual} to not match {expected}",
])

alias("matchLoose", "looseDeepEqual")
alias("notMatchLoose", "notLooseDeepEqual")

function has(name, equals, check, messages) {
    define(name, function (object, key, value) {
        const test = check(object, key)

        if (arguments.length >= 3) {
            return {
                test: test && equals(object[key], value),
                expected: value,
                actual: object[key],
                key, object,
                message: messages[0],
            }
        } else {
            return {
                test,
                expected: key,
                actual: object,
                message: messages[1],
            }
        }
    })

    define(negate(name), function (object, key, value) {
        const test = !check(object, key)

        if (arguments.length >= 3) {
            return {
                test: test || !equals(object[key], value),
                actual: value,
                key, object,
                message: messages[2],
            }
        } else {
            return {
                test,
                expected: key,
                actual: object,
                message: messages[3],
            }
        }
    })
}

const hasOwnKey = (object, key) => hasOwn.call(object, key)
const hasInKey = (object, key) => key in object

has("hasOwn", Util.strictIs, hasOwnKey, [
    "Expected {object} to have own key {key} equal to {expected}, but found {actual}", // eslint-disable-line max-len
    "Expected {actual} to have own key {expected}",
    "Expected {object} to not have own key {key} equal to {actual}",
    "Expected {actual} to not have own key {expected}",
])

has("looseHasOwn", Util.looseIs, hasOwnKey, [
    "Expected {object} to have own key {key} loosely equal to {expected}, but found {actual}", // eslint-disable-line max-len
    "Expected {actual} to have own key {expected}",
    "Expected {object} to not have own key {key} loosely equal to {actual}",
    "Expected {actual} to not have own key {expected}",
])

has("hasKey", Util.strictIs, hasInKey, [
    "Expected {object} to have key {key} equal to {expected}, but found {actual}", // eslint-disable-line max-len
    "Expected {actual} to have key {expected}",
    "Expected {object} to not have key {key} equal to {actual}",
    "Expected {actual} to not have key {expected}",
])

has("looseHasKey", Util.looseIs, hasInKey, [
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
        let test, error

        try {
            func()
        } catch (e) {
            test = methods.check(matcher, error = e)
        }

        if (invert) test = !test

        return {
            test: test !== false,
            expected: matcher,
            func, error,
            message: methods.message(matcher, invert, test),
        }
    }

    define(name, (func, test) => run(false, func, test))
    define(negate(name), (func, test) => run(true, func, test))
}

throws("throws", {
    check(Type, e) {
        return Type == null || e instanceof Type
    },

    message(Type, invert, test) {
        let str = "Expected {func} to "

        if (invert) str += "not "
        str += "throw"

        if (Type != null) {
            str += ` an instance of ${getName(Type)}`
            if (!invert && test !== undefined) str += ", but found {error}"
        }

        return str
    },
})

throws("throwsMatch", {
    check(matcher, e) {
        if (typeof matcher === "string") return e.message === matcher
        if (toString.call(matcher) === "[object RegExp]") {
            return matcher.test(e.message)
        }
        // Not accepting objects yet.
        if (typeof matcher !== "function") {
            throw new TypeError(`Unexpected matcher type: ${typeof matcher}`)
        }
        return !!matcher(e)
    },

    message(_, invert, test) {
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
    define(name, (object, length) => ({
        test: object.length != null && compare(object.length, +length),
        expected: length,
        actual: object.length,
        object, message,
    }))
}

/* eslint-disable max-len */

// Note: these always fail with NaNs.
len("length", (a, b) => a === b, "Expected {object} to have length {expected}, but found {actual}")
len("notLength", (a, b) => a !== b, "Expected {object} to not have length {actual}")
len("lengthAtLeast", (a, b) => a >= b, "Expected {object} to have length at least {expected}, but found {actual}")
len("lengthAtMost", (a, b) => a <= b, "Expected {object} to have length at most {expected}, but found {actual}")
len("lengthAbove", (a, b) => a > b, "Expected {object} to have length above {expected}, but found {actual}")
len("lengthBelow", (a, b) => a < b, "Expected {object} to have length below {expected}, but found {actual}")

/* eslint-enable max-len */

// Note: these two always fail when dealing with NaNs.
define("closeTo", (actual, expected, delta) => ({
    test: Math.abs(actual - expected) <= Math.abs(delta),
    actual, expected, delta,
    message: "Expected {actual} to be within {delta} of {expected}",
}))

define("notCloseTo", (actual, expected, delta) => ({
    test: Math.abs(actual - expected) > Math.abs(delta),
    actual, expected, delta,
    message: "Expected {actual} to not be within {delta} of {expected}",
}))

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
            return array.length >= keys.length &&
                keys.every(key => array.some(i => func(key, i)))
        } else {
            return keys.some(key => array.some(i => func(key, i)))
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

    define(name, (array, values) => {
        if (!Array.isArray(values)) values = [values]

        // exclusive or to invert the result if `invert` is true
        return {
            test: !values.length || invert ^ base(array, values),
            actual: array,
            values, message,
        }
    })
}

const includesAll = makeIncludes(true, Util.strictIs)
const includesAny = makeIncludes(false, Util.strictIs)

/* eslint-disable max-len */

defineIncludes("includes", includesAll, false, "Expected {actual} to have all values in {value}")
defineIncludes("notIncludesAll", includesAll, true, "Expected {actual} to not have all values in {value}")
defineIncludes("includesAny", includesAny, false, "Expected {actual} to have any value in {value}")
defineIncludes("notIncludes", includesAny, true, "Expected {actual} to not have any value in {value}")

const includesLooseAll = makeIncludes(true, Util.looseIs)
const includesLooseAny = makeIncludes(false, Util.looseIs)

defineIncludes("includesLoose", includesLooseAll, false, "Expected {actual} to loosely have all values in {value}")
defineIncludes("notIncludesLooseAll", includesLooseAll, true, "Expected {actual} to not loosely have all values in {value}")
defineIncludes("includesLooseAny", includesLooseAny, false, "Expected {actual} to loosely have any value in {value}")
defineIncludes("notIncludesLoose", includesLooseAny, true, "Expected {actual} to not loosely have any value in {value}")

const includesDeepAll = makeIncludes(true, deepEqual)
const includesDeepAny = makeIncludes(false, deepEqual)

defineIncludes("includesDeep", includesDeepAll, false, "Expected {actual} to match all values in {value}")
defineIncludes("notIncludesDeepAll", includesDeepAll, true, "Expected {actual} to not match all values in {value}")
defineIncludes("includesDeepAny", includesDeepAny, false, "Expected {actual} to match any value in {value}")
defineIncludes("notIncludesDeep", includesDeepAny, true, "Expected {actual} to not match any value in {value}")

const includesLooseDeepAll = makeIncludes(true, looseDeepEqual)
const includesLooseDeepAny = makeIncludes(false, looseDeepEqual)

defineIncludes("includesLooseDeep", includesLooseDeepAll, false, "Expected {actual} to loosely match all values in {value}")
defineIncludes("notIncludesLooseDeepAll", includesLooseDeepAll, true, "Expected {actual} to not loosely match all values in {value}")
defineIncludes("includesLooseDeepAny", includesLooseDeepAny, false, "Expected {actual} to loosely match any value in {value}")
defineIncludes("notIncludesLooseDeep", includesLooseDeepAny, true, "Expected {actual} to not loosely match any value in {value}")

const includesMatchDeepAll = makeIncludes(true, deepEqualMatch)
const includesMatchDeepAny = makeIncludes(false, deepEqualMatch)

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

    define(name, (object, keys) => ({
        // exclusive or to invert the result if `invert` is true
        test: isEmpty(keys) || invert ^ base(object, keys),
        actual: object,
        keys, message,
    }))
}

function makeHasKeys(name, func, invert, message) {
    function base(object, keys) {
        return object === keys || func(object, keys)
    }

    define(name, (object, keys) => ({
        // exclusive or to invert the result if `invert` is true
        test: isEmpty(keys) || invert ^ base(object, keys),
        actual: object,
        keys, message,
    }))
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
        array(object, keys) {
            const f = key => hasOwn.call(object, key)

            return all ? keys.every(f) : keys.some(f)
        },
    }
}

/* eslint-disable max-len */

const hasAllKeys = hasOverloadType(true, Util.strictIs)
const hasAnyKeys = hasOverloadType(false, Util.strictIs)

makeHasOverload("hasKeys", hasAllKeys, false, "Expected {actual} to have all keys in {keys}")
makeHasOverload("notHasAllKeys", hasAllKeys, true, "Expected {actual} to not have all keys in {keys}")
makeHasOverload("hasAnyKeys", hasAnyKeys, false, "Expected {actual} to have any key in {keys}")
makeHasOverload("notHasKeys", hasAnyKeys, true, "Expected {actual} to not have any key in {keys}")

const hasLooseAllKeys = hasKeysType(true, Util.looseIs)
const hasLooseAnyKeys = hasKeysType(false, Util.looseIs)

makeHasKeys("hasLooseKeys", hasLooseAllKeys, false, "Expected {actual} to loosely have all keys in {keys}")
makeHasKeys("notHasLooseAllKeys", hasLooseAllKeys, true, "Expected {actual} to not loosely have all keys in {keys}")
makeHasKeys("hasLooseAnyKeys", hasLooseAnyKeys, false, "Expected {actual} to loosely have any key in {keys}")
makeHasKeys("notHasLooseKeys", hasLooseAnyKeys, true, "Expected {actual} to not loosely have any key in {keys}")

const hasDeepAllKeys = hasKeysType(true, deepEqual)
const hasDeepAnyKeys = hasKeysType(false, deepEqual)

makeHasKeys("hasDeepKeys", hasDeepAllKeys, false, "Expected {actual} to have all keys in {keys}")
makeHasKeys("notHasDeepAllKeys", hasDeepAllKeys, true, "Expected {actual} to not have all keys in {keys}")
makeHasKeys("hasDeepAnyKeys", hasDeepAnyKeys, false, "Expected {actual} to have any key in {keys}")
makeHasKeys("notHasDeepKeys", hasDeepAnyKeys, true, "Expected {actual} to not have any key in {keys}")

const hasLooseDeepAllKeys = hasKeysType(true, looseDeepEqual)
const hasLooseDeepAnyKeys = hasKeysType(false, looseDeepEqual)

makeHasKeys("hasLooseDeepKeys", hasLooseDeepAllKeys, false, "Expected {actual} to loosely match all keys in {keys}")
makeHasKeys("notHasLooseDeepAllKeys", hasLooseDeepAllKeys, true, "Expected {actual} to not loosely match all keys in {keys}")
makeHasKeys("hasLooseDeepAnyKeys", hasLooseDeepAnyKeys, false, "Expected {actual} to loosely match any key in {keys}")
makeHasKeys("notHasLooseDeepKeys", hasLooseDeepAnyKeys, true, "Expected {actual} to not loosely match any key in {keys}")

const hasMatchAllKeys = hasKeysType(true, deepEqualMatch)
const hasMatchAnyKeys = hasKeysType(false, deepEqualMatch)

makeHasKeys("hasMatchKeys", hasMatchAllKeys, false, "Expected {actual} to match all keys in {keys}")
makeHasKeys("notHasMatchAllKeys", hasMatchAllKeys, true, "Expected {actual} to not match all keys in {keys}")
makeHasKeys("hasMatchAnyKeys", hasMatchAnyKeys, false, "Expected {actual} to match any key in {keys}")
makeHasKeys("notHasMatchKeys", hasMatchAnyKeys, true, "Expected {actual} to not match any key in {keys}")

alias("hasMatchLooseKeys", "hasLooseDeepKeys")
alias("notHasMatchLooseAllKeys", "notHasLooseDeepAllKeys")
alias("hasMatchLooseAnyKeys", "hasLooseDeepAnyKeys")
alias("notHasMatchLooseKeys", "notHasLooseDeepKeys")
