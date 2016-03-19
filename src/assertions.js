/**
 * Core TDD-style assertions. These are done by a composition of DSLs, since
 * there is *so* much repetition.
 */

import * as is from "./util/is.js"
import deepEqualImpl from "./util/deep-equal.js"

const toString = Object.prototype.toString
const hasOwn = Object.prototype.hasOwnProperty

function looseDeepEqual(actual, expected) {
    return deepEqualImpl(actual, expected, false)
}

function deepEqual(actual, expected) {
    return deepEqualImpl(actual, expected, true)
}

// This holds everything to be added.
const methods = []

/**
 * The core assertions export, as a plugin.
 */
export default function assertions(t) {
    methods.forEach(m => t.define(m.name, m.callback))
}

// Little helper so that these functions only need to be created once.
function define(name, callback) {
    methods.push({name, callback})
}

// Much easier to type
function negate(name) {
    return `not${name[0].toUpperCase() + name.slice(1)}`
}

// The basic assert. It's almost there for looks, given how easy it is to
// define your own assertions.
function sanitize(message) {
    if (message) {
        return `${message}`.replace(/(\{\w+\})/g, "\\$1")
    } else {
        return ""
    }
}

define("assert", (test, message) => ({test, message: sanitize(message)}))

define("fail", message => ({test: false, message: sanitize(message)}))

/**
 * These makes many of the common operators much easier to do.
 */
function unary(name, func, notTrue, notFalse) {
    define(name, x => ({
        test: func(x),
        actual: x,
        message: notTrue,
    }))

    define(negate(name), x => ({
        test: !func(x),
        actual: x,
        message: notFalse,
    }))
}

function binary(name, func, notTrue, notFalse) {
    define(name, (a, b) => ({
        test: func(a, b),
        actual: a,
        expected: b,
        message: notTrue,
    }))

    define(negate(name), (a, b) => ({
        test: !func(a, b),
        actual: a,
        expected: b,
        message: notFalse,
    }))
}

unary("ok", x => x,
    "Expected {actual} to be ok",
    "Expected {actual} to not be ok")

"boolean function number object string symbol"
.split(" ")
.forEach(type =>
    unary(type, x => typeof x === type,
        `Expected typeof {actual} to be ${type}`,
        `Expected typeof {actual} to not be ${type}`))

;[true, false, null, undefined]
.forEach(value =>
    unary(`${value}`, x => x === value,
        `Expected {actual} to be ${value}`,
        `Expected {actual} to not be ${value}`))

unary("array", Array.isArray,
    "Expected {actual} to be an array",
    "Expected {actual} to not be an array")

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
    message: "Expected {o} to be an instance of {expected}, but found {actual}", // eslint-disable-line max-len
}))

define("notInstanceof", (object, Type) => ({
    test: !(object instanceof Type),
    expected: Type,
    o: object,
    message: "Expected {o} to not be an instance of {expected}",
}))

binary("equal", is.strictIs,
    "Expected {actual} to equal {expected}",
    "Expected {actual} to not equal {expected}")

binary("looseEqual", is.looseIs,
    "Expected {actual} to loosely equal {expected}",
    "Expected {actual} to not loosely equal {expected}")

binary("deepEqual", deepEqual,
    "Expected {actual} to deeply equal {expected}",
    "Expected {actual} to not deeply equal {expected}")

binary("looseDeepEqual", looseDeepEqual,
    "Expected {actual} to loosely equal {expected}",
    "Expected {actual} to not loosely equal {expected}")

function has(name, is, check, messages) {
    define(name, function (object, key, value) {
        const test = check(object, key)

        if (arguments.length >= 3) { // eslint-disable-line prefer-rest-params
            return {
                test: test && is(object[key], value),
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

        if (arguments.length >= 3) { // eslint-disable-line prefer-rest-params
            return {
                test: test || !is(object[key], value),
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

has("hasOwn", is.strictIs, (obj, key) => hasOwn.call(obj, key), [
    "Expected {object} to have own key {key} equal to {expected}, but found {actual}", // eslint-disable-line max-len
    "Expected {actual} to have own key {expected}",
    "Expected {object} to not have own key {key} equal to {actual}",
    "Expected {actual} to not have own key {expected}",
])

has("looseHasOwn", is.looseIs, (obj, key) => hasOwn.call(obj, key), [
    "Expected {object} to have own key {key} loosely equal to {expected}, but found {actual}", // eslint-disable-line max-len
    "Expected {actual} to have own key {expected}",
    "Expected {object} to not have own key {key} loosely equal to {actual}",
    "Expected {actual} to not have own key {expected}",
])

has("hasKey", is.strictIs, (obj, key) => key in obj, [
    "Expected {object} to have key {key} equal to {expected}, but found {actual}", // eslint-disable-line max-len
    "Expected {actual} to have key {expected}",
    "Expected {object} to not have key {key} equal to {actual}",
    "Expected {actual} to not have key {expected}",
])

has("looseHasKey", is.looseIs, (obj, key) => key in obj, [
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

function throws(name, check, message) {
    function run(invert, func, match) {
        let test = false
        let error

        try {
            func()
        } catch (e) {
            test = check(match, error = e)
        }

        if (invert) test = !test

        return {
            test,
            expected: match,
            func, error,
            message: message(match, invert, test),
        }
    }

    define(name, run.bind(null, false))
    define(negate(name), run.bind(null, true))
}

throws("throws",
    (Type, e) => Type == null || e instanceof Type,
    (Type, invert) => {
        let str = `Expected {func} to ${invert ? "not " : ""}throw`

        if (Type != null) str += ` an instance of ${getName(Type)}`
        return str
    })

throws("throwsMatch",
    (matcher, e) => {
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
    (_, invert, test) =>
        invert
            ? "Expected {func} to not throw an error that matches {expected}"
            : `Expected {func} to throw an error that matches {expected}, but found ${test !== undefined ? "{error}" : "no error"}` // eslint-disable-line max-len
)

function len(name, compare, message) {
    define(name, (object, length) => ({
        test: object.length != null && compare(object.length, +length),
        expected: length,
        actual: object.length,
        object, message,
    }))
}

// Note: these always fail with NaNs.
/* eslint-disable max-len */

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
 * fit the `foo`/`notFoo` idiom better), so it's easier to just make a
 * functional DSL and use that to define everything.
 *
 * Here's the top level:
 *
 * - strict includes
 * - loose includes
 * - strict deep includes
 * - loose deep includes
 *
 * And the second level (below uses "any" instead of "some" in its idioms):
 *
 * - includes all/not missing some
 * - including some/not missing all
 * - not including all/missing some
 * - not including some/missing all
 *
 * A near-identical DSL is used to define the hasKeys set as well, although
 * the internals use it to also overload all of them to consume either an
 * array (in which it simply searches keys) or an object (where it does a
 * full comparison). Do note that most of the hasKeys set are effectively
 * aliases for half of the methods if called with an array, since no actual
 * property access occurs.
 */

function makeIncludes(all, func) {
    return (array, keys) =>
        all ? keys.every(key => array.some(i => func(key, i)))
            : keys.some(key => array.some(i => func(key, i)))
}

function defineIncludes(name, func, invert, message) {
    function base(array, keys, func) {
        // Cheap cases first
        if (!Array.isArray(array)) return false
        if (array === keys) return true
        if (array.length < keys.length) return false

        return func(array, keys)
    }

    define(name, (array, keys) => {
        if (!Array.isArray(keys)) keys = [keys]
        return {
            test: !keys.length || invert ^ base(array, keys, func),
            actual: array, keys, message,
        }
    })
}

const includesAll = makeIncludes(true, is.strictIs)
const includesAny = makeIncludes(false, is.strictIs)

/* eslint-disable max-len */

defineIncludes("includes", includesAll, false, "Expected {actual} to have all values in {keys}")
defineIncludes("notIncludesAll", includesAll, true, "Expected {actual} to not have all values in {keys}")
defineIncludes("includesAny", includesAny, false, "Expected {actual} to have any value in {keys}")
defineIncludes("notIncludes", includesAny, true, "Expected {actual} to not have any value in {keys}")

/* eslint-enable max-len */

const includesLooseAll = makeIncludes(true, is.looseIs)
const includesLooseAny = makeIncludes(false, is.looseIs)

/* eslint-disable max-len */

defineIncludes("includesLoose", includesLooseAll, false, "Expected {actual} to loosely have all values in {keys}")
defineIncludes("notIncludesLooseAll", includesLooseAll, true, "Expected {actual} to loosely not have all values in {keys}")
defineIncludes("includesLooseAny", includesLooseAny, false, "Expected {actual} to loosely have any value in {keys}")
defineIncludes("notIncludesLoose", includesLooseAny, true, "Expected {actual} to loosely not have any value in {keys}")

/* eslint-enable max-len */

const includesDeepAll = makeIncludes(true, deepEqual)
const includesDeepAny = makeIncludes(false, deepEqual)

/* eslint-disable max-len */

defineIncludes("includesDeep", includesDeepAll, false, "Expected {actual} to match all values in {keys}")
defineIncludes("notIncludesDeepAll", includesDeepAll, true, "Expected {actual} to not match all values in {keys}")
defineIncludes("includesDeepAny", includesDeepAny, false, "Expected {actual} to match any value in {keys}")
defineIncludes("notIncludesDeep", includesDeepAny, true, "Expected {actual} to not match any value in {keys}")

/* eslint-enable max-len */

const includesLooseDeepAll = makeIncludes(true, looseDeepEqual)
const includesLooseDeepAny = makeIncludes(false, looseDeepEqual)

/* eslint-disable max-len */

defineIncludes("includesLooseDeep", includesLooseDeepAll, false, "Expected {actual} to loosely match all values in {keys}")
defineIncludes("notIncludesLooseDeepAll", includesLooseDeepAll, true, "Expected {actual} to loosely not match all values in {keys}")
defineIncludes("includesLooseDeepAny", includesLooseDeepAny, false, "Expected {actual} to loosely match any value in {keys}")
defineIncludes("notIncludesLooseDeep", includesLooseDeepAny, true, "Expected {actual} to loosely not match any value in {keys}")

/* eslint-enable max-len */

function isEmpty(object) {
    if (Array.isArray(object)) return object.length === 0
    if (typeof object !== "object" || object == null) return true
    return Object.keys(object).length === 0
}

function makeHasKeys(name, methods, invert, message) {
    function base(object, keys, methods) {
        // Cheap cases first
        if (object === keys) return true

        if (Array.isArray(keys)) {
            return methods.array(object, keys)
        } else {
            return methods.object(object, keys)
        }
    }

    define(name, (object, keys) => {
        if (typeof keys !== "object") keys = [keys]
        return {
            // exclusive or to invert the result if `invert` is true
            test: isEmpty(keys) || invert ^ base(object, keys, methods),
            actual: object, keys, message,
        }
    })
}

function hasKeysType(all, func) {
    return {
        object(object, keys) {
            const f = k => hasOwn.call(object, k) && func(keys[k], object[k])

            return typeof keys !== "object" || keys == null ||
                (all
                    ? Object.keys(keys).every(f)
                    : Object.keys(keys).some(f))
        },

        array(object, keys) {
            return all
                ? keys.every(k => hasOwn.call(object, k))
                : keys.some(k => hasOwn.call(object, k))
        },
    }
}

const hasAllKeys = hasKeysType(true, is.strictIs)
const hasAnyKeys = hasKeysType(false, is.strictIs)

/* eslint-disable max-len */

makeHasKeys("hasKeys", hasAllKeys, false, "Expected {actual} to have all keys in {keys}")
makeHasKeys("notHasAllKeys", hasAllKeys, true, "Expected {actual} to not have all keys in {keys}")
makeHasKeys("hasAnyKeys", hasAnyKeys, false, "Expected {actual} to have any key in {keys}")
makeHasKeys("notHasKeys", hasAnyKeys, true, "Expected {actual} to not have any key in {keys}")

/* eslint-enable max-len */

const hasLooseAllKeys = hasKeysType(true, is.looseIs)
const hasLooseAnyKeys = hasKeysType(false, is.looseIs)

/* eslint-disable max-len */

makeHasKeys("hasLooseKeys", hasLooseAllKeys, false, "Expected {actual} to loosely have all keys in {keys}")
makeHasKeys("notHasLooseAllKeys", hasLooseAllKeys, true, "Expected {actual} to loosely not have all keys in {keys}")
makeHasKeys("hasLooseAnyKeys", hasLooseAnyKeys, false, "Expected {actual} to loosely have any key in {keys}")
makeHasKeys("notHasLooseKeys", hasLooseAnyKeys, true, "Expected {actual} to loosely not have any key in {keys}")

/* eslint-enable max-len */

const hasDeepAllKeys = hasKeysType(true, deepEqual)
const hasDeepAnyKeys = hasKeysType(false, deepEqual)

/* eslint-disable max-len */

makeHasKeys("hasDeepKeys", hasDeepAllKeys, false, "Expected {actual} to match all keys in {keys}")
makeHasKeys("notHasDeepAllKeys", hasDeepAllKeys, true, "Expected {actual} to not match all keys in {keys}")
makeHasKeys("hasDeepAnyKeys", hasDeepAnyKeys, false, "Expected {actual} to match any key in {keys}")
makeHasKeys("notHasDeepKeys", hasDeepAnyKeys, true, "Expected {actual} to not match any key in {keys}")

/* eslint-enable max-len */

const hasLooseDeepAllKeys = hasKeysType(true, looseDeepEqual)
const hasLooseDeepAnyKeys = hasKeysType(false, looseDeepEqual)

/* eslint-disable max-len */

makeHasKeys("hasLooseDeepKeys", hasLooseDeepAllKeys, false, "Expected {actual} to loosely match all keys in {keys}")
makeHasKeys("notHasLooseDeepAllKeys", hasLooseDeepAllKeys, true, "Expected {actual} to loosely not match all keys in {keys}")
makeHasKeys("hasLooseDeepAnyKeys", hasLooseDeepAnyKeys, false, "Expected {actual} to loosely match any key in {keys}")
makeHasKeys("notHasLooseDeepKeys", hasLooseDeepAnyKeys, true, "Expected {actual} to loosely not match any key in {keys}")

/* eslint-enable max-len */
