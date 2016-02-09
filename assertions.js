"use strict"

var util = require("./lib/util.js")

/**
 * Core TDD-style assertions
 */

var toString = Object.prototype.toString
var hasOwn = Object.prototype.hasOwnProperty

var methods = []

module.exports = function (t) {
    methods.forEach(function (m) {
        t.define(m.name, m.callback)
    })
}

// Little helper so that these functions only exist once.
function define(name, callback) {
    methods.push({name: name, callback: callback})
}

// The basic assert. It's almost there for looks, given how easy it is to
// define your own assertions.

define("assert", function (test, message) {
    return {
        test: test,
        message: (message ? message + "" : "").replace(/(\{\w+\})/g, "\\$1"),
    }
})

define("fail", function (message) {
    return {
        test: false,
        message: (message ? message + "" : "").replace(/(\{\w+\})/g, "\\$1"),
    }
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

    define("not" + name[0].toUpperCase() + name.slice(1), function (x) {
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

    define("not" + name[0].toUpperCase() + name.slice(1), function (a, b) {
        return {
            test: !func(a, b),
            actual: a,
            expected: b,
            message: messages[1],
        }
    })
}

unary("ok", function (a) { return !!a }, [
    "Expected {actual} to be ok",
    "Expected {actual} to not be ok",
])

"boolean function number object string symbol undefined"
.split(" ")
.forEach(function (type) {
    unary(type, function (x) { return typeof x === type }, [
        "Expected typeof {actual} to be " + type,
        "Expected typeof {actual} to not be " + type,
    ])
})

;[true, false, null, undefined].forEach(function (value) {
    unary(value + "", function (x) { return x === value }, [
        "Expected {actual} to be " + value,
        "Expected {actual} to not be " + value,
    ])
})

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
        message: "Expected typeof {o} to be {expected}, but found {actual}",
    }
})

define("notInstanceof", function (object, Type) {
    return {
        test: !(object instanceof Type),
        expected: Type,
        o: object,
        message: "Expected typeof {o} to not be {expected}",
    }
})

binary("equal", util.strictIs, [
    "Expected {actual} to equal {expected}",
    "Expected {actual} to not equal {expected}",
])

binary("looseEqual", util.looseIs, [
    "Expected {actual} to loosely equal {expected}",
    "Expected {actual} to not loosely equal {expected}",
])

binary("deepEqual", util.deepEqual, [
    "Expected {actual} to deeply equal {expected}",
    "Expected {actual} to not deeply equal {expected}",
])

binary("looseDeepEqual", util.looseDeepEqual, [
    "Expected {actual} to loosely equal {expected}",
    "Expected {actual} to not loosely equal {expected}",
])

define("hasOwn", function (object, key, value) {
    var test = hasOwn.call(object, key)
    if (arguments.length === 3) {
        return {
            test: test && object[key] === value,
            expected: value,
            actual: object[key],
            k: key,
            o: object,
            message: "Expected {o} to have own key {key} of {expected}, but found {actual}", // eslint-disable-line max-len
        }
    } else {
        return {
            test: test,
            expected: key,
            actual: object,
            message: "Expected {actual} to have own key {expected}",
        }
    }
})

define("notHasOwn", function (object, key, value) {
    var test = !hasOwn.call(object, key)
    if (arguments.length === 3) {
        return {
            test: test || object[key] !== value,
            actual: value,
            k: key,
            o: object,
            message: "Expected {o} to not have own key {key} of {actual}", // eslint-disable-line max-len
        }
    } else {
        return {
            test: test,
            expected: key,
            actual: object,
            message: "Expected {actual} to not have own key {expected}",
        }
    }
})

define("looseHasOwn", function (object, key, value) {
    var test = hasOwn.call(object, key)
    if (arguments.length === 3) {
        return {
            test: test && object[key] == value, // eslint-disable-line eqeqeq
            expected: value,
            actual: object[key],
            k: key,
            o: object,
            message: "Expected {o} to have own key {key} loosely equal to {expected}, but found {actual}", // eslint-disable-line max-len
        }
    } else {
        return {
            test: test,
            expected: key,
            actual: object,
            message: "Expected {actual} to have own key {expected}",
        }
    }
})

define("notLooseHasOwn", function (object, key, value) {
    var test = !hasOwn.call(object, key)
    if (arguments.length === 3) {
        return {
            test: test || object[key] != value, // eslint-disable-line eqeqeq
            actual: value,
            k: key,
            o: object,
            message: "Expected {o} to not have own key {key} loosely equal to {actual}", // eslint-disable-line max-len
        }
    } else {
        return {
            test: test,
            expected: key,
            actual: object,
            message: "Expected {actual} to not have own key {expected}",
        }
    }
})

define("hasKey", function (object, key, value) {
    var test = key in object
    if (arguments.length === 3) {
        return {
            test: test && object[key] === value,
            expected: value,
            actual: object[key],
            k: key,
            o: object,
            message: "Expected {o} to have key {key} of {expected}, but found {actual}", // eslint-disable-line max-len
        }
    } else {
        return {
            test: test,
            expected: key,
            actual: object,
            message: "Expected {actual} to have key {expected}",
        }
    }
})

define("notHaveKey", function (object, key, value) {
    var test = !(key in object)
    if (arguments.length === 3) {
        return {
            test: test || object[key] !== value,
            actual: value,
            k: key,
            o: object,
            message: "Expected {o} to not have own key {key} loosely equal to {actual}", // eslint-disable-line max-len
        }
    } else {
        return {
            test: test,
            expected: key,
            actual: object,
            message: "Expected {actual} to not have own key {expected}",
        }
    }
})

define("looseHasKey", function (object, key, value) {
    var test = key in object
    if (arguments.length === 3) {
        return {
            test: test && object[key] == value, // eslint-disable-line eqeqeq
            expected: value,
            actual: object[key],
            k: key,
            o: object,
            message: "Expected {o} to have key {key} loosely equal to {expected}, but found {actual}", // eslint-disable-line max-len
        }
    } else {
        return {
            test: test,
            expected: key,
            actual: object,
            message: "Expected {actual} to have key {expected}",
        }
    }
})

define("notLooseHasKey", function (object, key, value) {
    var test = !(key in object)
    if (arguments.length === 3) {
        return {
            test: test || object[key] != value, // eslint-disable-line eqeqeq
            actual: value,
            k: key,
            o: object,
            message: "Expected {o} to not have own key {key} loosely equal to {actual}", // eslint-disable-line max-len
        }
    } else {
        return {
            test: test,
            expected: key,
            actual: object,
            message: "Expected {actual} to not have own key {expected}",
        }
    }
})

function getName(func) {
    if (func.name != null) return func.name || "<anonymous>"
    if (func.displayName != null) return func.displayName || "<anonymous>"
    return "<anonymous>"
}

define("throws", function (func, Type) {
    var test = false
    try {
        func()
    } catch (e) {
        test = Type == null || e instanceof Type
    }
    return {
        test: test,
        expected: Type,
        func: func,
        message: Type != null
            ? "Expected {func} to throw an instance of " + getName(Type)
            : "Expected {func} to throw",
    }
})

define("notThrows", function (func, Type) {
    var test = true
    try {
        func()
    } catch (e) {
        test = Type != null && !(e instanceof Type)
    }
    return {
        test: test,
        expected: Type,
        func: func,
        message: Type != null
            ? "Expected {func} to not throw an instance of " + getName(Type)
            : "Expected {func} to not throw",
    }
})

function tryMatch(matcher, e) {
    if (typeof matcher === "string") return e.message === matcher

    if (toString.call(matcher) === "[object RegExp]") {
        return matcher.test(e.message)
    }

    // Don't accept objects yet.
    if (typeof matcher !== "function") {
        throw new TypeError("Unexpected matcher type: " + typeof matcher)
    }

    return !!matcher(e)
}

define("throwsMatch", function (func, matcher) {
    var test = false
    try {
        func()
    } catch (e) {
        test = tryMatch(matcher, e)
    }
    return {
        test: test,
        expected: matcher,
        func: func,
        message: "Expected {func} to match {expected}",
    }
})

define("notThrowsMatch", function (func, matcher) {
    var test = true
    try {
        func()
    } catch (e) {
        test = !tryMatch(matcher, e)
    }
    return {
        test: test,
        expected: matcher,
        func: func,
        message: "Expected {func} to not match {expected}",
    }
})

define("length", function (object, length) {
    return {
        test: object.length != null && object.length === +length,
        expected: length,
        actual: object.length,
        o: object,
        message: "Expected {o} to have length {expected}, but found {actual}",
    }
})

define("notLength", function (object, length) {
    return {
        test: object.length != null && object.length !== +length,
        actual: object.length,
        o: object,
        message: "Expected {o} to not have length {actual}",
    }
})

define("lengthAtLeast", function (object, length) {
    return {
        test: object.length != null && object.length >= +length,
        expected: length,
        actual: object.length,
        o: object,
        message: "Expected {o} to have length at least {expected}, but found {actual}", // eslint-disable-line max-len,
    }
})

define("lengthAtMost", function (object, length) {
    return {
        test: object.length != null && object.length <= +length,
        expected: length,
        actual: object.length,
        o: object,
        message: "Expected {o} to have length at most {expected}, but found {actual}", // eslint-disable-line max-len,
    }
})

define("lengthAbove", function (object, length) {
    return {
        test: object.length != null && object.length > +length,
        expected: length,
        actual: object.length,
        o: object,
        message: "Expected {o} to have length above {expected}, but found {actual}", // eslint-disable-line max-len,
    }
})

define("lengthBelow", function (object, length) {
    return {
        test: object.length != null && object.length < +length,
        expected: length,
        actual: object.length,
        o: object,
        message: "Expected {o} to have length below {expected}, but found {actual}", // eslint-disable-line max-len,
    }
})

// Note: these two always fail when dealing with NaNs.

define("closeTo", function (actual, expected, delta) {
    return {
        test: Math.abs(actual - expected) <= Math.abs(delta),
        actual: actual, expected: expected, delta: delta,
        message: "Expected {actual} to be within {delta} of {expected}",
    }
})

define("notCloseTo", function (actual, expected, delta) {
    return {
        test: Math.abs(actual - expected) > Math.abs(delta),
        actual: actual, expected: expected, delta: delta,
        message: "Expected {actual} to not be within {delta} of {expected}",
    }
})

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
    return function (array, keys) {
        function f(key) {
            return array.some(function (i) { return func(key, i) })
        }
        return all ? keys.every(f) : keys.some(f)
    }
}

function defineIncludes(name, func, invert, message) {
    function base(array, keys, func) {
        // Cheap cases first
        if (!Array.isArray(array)) return false
        if (array === keys) return true
        if (array.length < keys.length) return false

        return func(array, keys)
    }

    define(name, function (array, keys) {
        if (!Array.isArray(keys)) keys = [keys]
        return {
            test: !keys.length || invert ^ base(array, keys, func),
            actual: array, keys: keys, message: message,
        }
    })
}

var includesAll = makeIncludes(true, util.strictIs)
var includesAny = makeIncludes(false, util.strictIs)

defineIncludes("includes", includesAll, false,
    "Expected {actual} to have all keys in {keys}")

defineIncludes("notIncludesAll", includesAll, true,
    "Expected {actual} to not have all keys in {keys}")

defineIncludes("includesAny", includesAny, false,
    "Expected {actual} to have any key in {keys}")

defineIncludes("notIncludes", includesAny, true,
    "Expected {actual} to not have any key in {keys}")

var includesLooseAll = makeIncludes(true, util.looseIs)
var includesLooseAny = makeIncludes(false, util.looseIs)

defineIncludes("includesLoose", includesLooseAll, false,
    "Expected {actual} to loosely have all keys in {keys}")

defineIncludes("notIncludesLooseAll", includesLooseAll, true,
    "Expected {actual} to loosely not have all keys in {keys}")

defineIncludes("includesLooseAny", includesLooseAny, false,
    "Expected {actual} to loosely have any key in {keys}")

defineIncludes("notIncludesLoose", includesLooseAny, true,
    "Expected {actual} to loosely not have any key in {keys}")

var includesDeepAll = makeIncludes(true, util.deepEqual)
var includesDeepAny = makeIncludes(false, util.deepEqual)

defineIncludes("includesDeep", includesDeepAll, false,
    "Expected {actual} to match all keys in {keys}")

defineIncludes("notIncludesDeepAll", includesDeepAll, true,
    "Expected {actual} to not match all keys in {keys}")

defineIncludes("includesDeepAny", includesDeepAny, false,
    "Expected {actual} to match any key in {keys}")

defineIncludes("notIncludesDeep", includesDeepAny, true,
    "Expected {actual} to not match any key in {keys}")

var includesLooseDeepAll = makeIncludes(true, util.looseDeepEqual)
var includesLooseDeepAny = makeIncludes(false, util.looseDeepEqual)

defineIncludes("includesLooseDeep", includesLooseDeepAll, false,
    "Expected {actual} to loosely match all keys in {keys}")

defineIncludes("notIncludesLooseDeepAll", includesLooseDeepAll, true,
    "Expected {actual} to loosely not match all keys in {keys}")

defineIncludes("includesLooseDeepAny", includesLooseDeepAny, false,
    "Expected {actual} to loosely match any key in {keys}")

defineIncludes("notIncludesLooseDeep", includesLooseDeepAny, true,
    "Expected {actual} to loosely not match any key in {keys}")

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

    define(name, function (array, keys) {
        if (typeof keys !== "object") keys = [keys]
        return {
            // exclusive or to invert the result if `invert` is true
            test: isEmpty(keys) || invert ^ base(array, keys, methods),
            actual: array, keys: keys, message: message,
        }
    })
}

function hasKeysType(all, func) {
    return {
        object: function (object, keys) {
            function f(k) {
                return hasOwn.call(object, k) && func(keys[k], object[k])
            }
            if (typeof keys !== "object" || keys == null) return true
            var list = Object.keys(keys)
            return all ? list.every(f) : list.some(f)
        },

        array: function (object, keys) {
            function f(k) {
                return hasOwn.call(object, k)
            }
            return all ? keys.every(f) : keys.some(f)
        },
    }
}

var hasAllKeys = hasKeysType(true, util.strictIs)
var hasAnyKeys = hasKeysType(false, util.strictIs)

makeHasKeys("hasKeys", hasAllKeys, false,
    "Expected {actual} to have all keys in {keys}")

makeHasKeys("notHasAllKeys", hasAllKeys, true,
    "Expected {actual} to not have all keys in {keys}")

makeHasKeys("hasAnyKeys", hasAnyKeys, false,
    "Expected {actual} to have any key in {keys}")

makeHasKeys("notHasKeys", hasAnyKeys, true,
    "Expected {actual} to not have any key in {keys}")

var hasLooseAllKeys = hasKeysType(true, util.looseIs)
var hasLooseAnyKeys = hasKeysType(false, util.looseIs)

makeHasKeys("hasLooseKeys", hasLooseAllKeys, false,
    "Expected {actual} to loosely have all keys in {keys}")

makeHasKeys("notHasLooseAllKeys", hasLooseAllKeys, true,
    "Expected {actual} to loosely not have all keys in {keys}")

makeHasKeys("hasLooseAnyKeys", hasLooseAnyKeys, false,
    "Expected {actual} to loosely have any key in {keys}")

makeHasKeys("notHasLooseKeys", hasLooseAnyKeys, true,
    "Expected {actual} to loosely not have any key in {keys}")

var hasDeepAllKeys = hasKeysType(true, util.deepEqual)
var hasDeepAnyKeys = hasKeysType(false, util.deepEqual)

makeHasKeys("hasDeepKeys", hasDeepAllKeys, false,
    "Expected {actual} to match all keys in {keys}")

makeHasKeys("notHasDeepAllKeys", hasDeepAllKeys, true,
    "Expected {actual} to not match all keys in {keys}")

makeHasKeys("hasDeepAnyKeys", hasDeepAnyKeys, false,
    "Expected {actual} to match any key in {keys}")

makeHasKeys("notHasDeepKeys", hasDeepAnyKeys, true,
    "Expected {actual} to not match any key in {keys}")

var hasLooseDeepAllKeys = hasKeysType(true, util.looseDeepEqual)
var hasLooseDeepAnyKeys = hasKeysType(false, util.looseDeepEqual)

makeHasKeys("hasLooseDeepKeys", hasLooseDeepAllKeys, false,
    "Expected {actual} to loosely match all keys in {keys}")

makeHasKeys("notHasLooseDeepAllKeys", hasLooseDeepAllKeys, true,
    "Expected {actual} to loosely not match all keys in {keys}")

makeHasKeys("hasLooseDeepAnyKeys", hasLooseDeepAnyKeys, false,
    "Expected {actual} to loosely match any key in {keys}")

makeHasKeys("notHasLooseDeepKeys", hasLooseDeepAnyKeys, true,
    "Expected {actual} to loosely not match any key in {keys}")
