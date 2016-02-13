;(function (value, factory) { // eslint-disable-line
    "use strict"
    /* eslint-disable no-undef */
    if (typeof global !== "undefined") {
        value = global
    } else if (typeof self !== "undefined") {
        value = self
    } else if (typeof window !== "undefined") {
        value = window
    }
    /* eslint-enable no-undef */

    var plugin = factory(value)
    /* eslint-disable no-undef */
    if (typeof module === "object" && module != null && module.exports) {
        // CommonJS, Browserify
        module.exports = plugin
    } else if (typeof define === "function" && define.amd) {
        define("techtonic/assertions", function () { return t })
        /* eslint-enable no-undef */
    } else {
        value.techtonicAssertions = plugin
    }
})(this, function (global, undefined) { // eslint-disable-line
    "use strict"

    /**
     * Core TDD-style assertions
     */

    var hasOwn = {}.hasOwnProperty
    var toString = {}.toString

    // For consistent NaN handling

    function strictIs(a, b) {
        /* eslint-disable no-self-compare */
        return a === b || a !== a && b !== b
        /* eslint-enable no-self-compare */
    }

    function looseIs(a, b) {
        /* eslint-disable no-self-compare, eqeqeq */
        return a == b || a != a && b != b
        /* eslint-enable no-self-compare, eqeqeq */
    }

    var deepEqualImpl = (function () {
        /**
         * This file contains code under the MIT license. Most of said code is a
         * close copy from node-deep-equal, which itself is derived from Node,
         * but there are a few differences and modifications, including the fact
         * this requires ES5. All code in this file under the MIT license is in
         * this specific IIFE.
         */

        var symbolToString

        if (typeof Symbol === "function" && typeof Symbol() === "symbol") {
            symbolToString = Symbol().toString
        }

        function symbolEqual(a, b) {
            return typeof a === "symbol" && typeof b === "symbol" &&
                symbolToString.call(a) === symbolToString.call(b)
        }

        function deepEqual(actual, expected, strict) {
            if (typeof actual !== "object" && typeof expected !== "object") {
                return strict
                    ? strictIs(actual, expected)
                    : looseIs(actual, expected) || symbolEqual(actual, expected)
            }

            if (strict) {
                if (actual === null) return expected === null
                if (expected === null) return false

                if (actual === undefined) return expected === undefined
                if (expected === undefined) return false
            } else {
                if (actual == null) return expected == null
                if (expected == null) return false
            }

            if (typeof actual !== "object" || typeof expected !== "object") {
                return false
            }

            if (actual instanceof Date && expected instanceof Date) {
                return actual.getTime() === expected.getTime()
            }

            return objEquiv(actual, expected, strict)
        }

        function isBuffer(x) {
            if (!x || typeof x !== "object" || typeof x.length !== "number") {
                return false
            }

            if (typeof x.copy !== "function" || typeof x.slice !== "function") {
                return false
            }

            if (x.length > 0 && typeof x[0] !== "number") return false
            return true
        }

        // Way faster than deep-equal, as everything here is always a number
        function checkBuffer(a, b) {
            if (a.length !== b.length) return false

            for (var i = 0; i < a.length; i++) {
                if (a[i] !== b[i]) return false
            }
            return true
        }

        function checkKeys(a, b, akeys, bkeys, strict) {
            // the same set of keys (although not necessarily the same order),
            akeys.sort()
            bkeys.sort()

            // cheap key test
            for (var i = 0; i < akeys.length; i++) {
                if (akeys[i] !== bkeys[i]) return false
            }

            // equivalent values for every corresponding key, and possibly
            // expensive deep test
            for (i = 0; i < akeys.length; i++) {
                var key = akeys[i]
                if (!deepEqual(a[key], b[key], strict)) return false
            }

            return true
        }

        function checkArrayLike(a, b, strict) {
            if (a.length !== b.length) return false

            for (var i = 0; i < a.length; i++) {
                if (!deepEqual(a[i], b[i], strict)) return false
            }

            var akeys = Object.keys(a)
            var bkeys = Object.keys(b)

            // Same number of own properties
            if (akeys.length !== bkeys.length) return false

            // Most of the time, there aren't any non-index to check. Let's do
            // that before sorting, as this is easy to test.
            var acount = 0
            var bcount = 0

            for (i = 0; i < akeys.length; i++) {
                var akey = akeys[i]
                if (akey === "length" || /^\d+$/.test(akey)) acount++
                var bkey = bkeys[i]
                if (bkey === "length" || /^\d+$/.test(bkey)) bcount++
            }

            return acount === 0 && bcount === 0 ||
                checkKeys(a, b, akeys, bkeys, false, strict)
        }

        function objEquiv(a, b, strict) {
            if (a == null || b == null) return false

            // an identical 'prototype' property.
            if (strict) {
                if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) {
                    return false
                }
            }

            // Arguments object doesn't seem to like Object.keys. Checking it as
            // an array fixes this.
            if (toString.call(a) === "[object Arguments]") {
                return toString.call(b) === "[object Arguments]" &&
                    checkArrayLike(a, b, strict)
            }

            if (isBuffer(a)) return isBuffer(b) && checkBuffer(a, b)

            // If it's an array, no point checking keys.
            if (Array.isArray(a)) {
                return Array.isArray(b) && checkArrayLike(a, b, strict)
            }

            try {
                var akeys = Object.keys(a)
                var bkeys = Object.keys(b)
            } catch (e) {
                // Happens when one is a string literal and the other isn't
                return false
            }

            // Same number of own properties
            return akeys.length === bkeys.length &&
                checkKeys(a, b, akeys, bkeys, strict)
        }

        return deepEqual
    })()

    function looseDeepEqual(actual, expected) {
        return deepEqualImpl(actual, expected, false)
    }

    function deepEqual(actual, expected) {
        return deepEqualImpl(actual, expected, true)
    }

    var methods = []

    function plugin(t) {
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

    function sanitize(message) {
        if (message) {
            return (message + "").replace(/(\{\w+\})/g, "\\$1")
        } else {
            return ""
        }
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
                /* eslint-disable eqeqeq */
                test: test && object[key] == value,
                /* eslint-enable eqeqeq */
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
                /* eslint-disable eqeqeq */
                test: test || object[key] != value,
                /* eslint-enable eqeqeq */
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
                /* eslint-disable eqeqeq */
                test: test && object[key] == value,
                /* eslint-enable eqeqeq */
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
                /* eslint-disable eqeqeq */
                test: test || object[key] != value,
                /* eslint-enable eqeqeq */
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
        var test, error
        try {
            func()
        } catch (e) {
            test = tryMatch(matcher, error = e)
        }
        return {
            test: test,
            expected: matcher,
            func: func,
            error: error,
            message: "Expected {func} to throw an error that matches {expected} but found " + // eslint-disable-line max-len
                (test !== undefined ? "{error}" : "no error"),
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
            message: "Expected {func} to not throw an error that matches {expected}", // eslint-disable-line max-len
        }
    })

    define("length", function (object, length) {
        return {
            test: object.length != null && object.length === +length,
            expected: length,
            actual: object.length,
            o: object,
            message: "Expected {o} to have length {expected}, but found {actual}", // eslint-disable-line max-len
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

    var includesAll = makeIncludes(true, strictIs)
    var includesAny = makeIncludes(false, strictIs)

    defineIncludes("includes", includesAll, false,
        "Expected {actual} to have all values in {keys}")

    defineIncludes("notIncludesAll", includesAll, true,
        "Expected {actual} to not have all values in {keys}")

    defineIncludes("includesAny", includesAny, false,
        "Expected {actual} to have any value in {keys}")

    defineIncludes("notIncludes", includesAny, true,
        "Expected {actual} to not have any value in {keys}")

    var includesLooseAll = makeIncludes(true, looseIs)
    var includesLooseAny = makeIncludes(false, looseIs)

    defineIncludes("includesLoose", includesLooseAll, false,
        "Expected {actual} to loosely have all values in {keys}")

    defineIncludes("notIncludesLooseAll", includesLooseAll, true,
        "Expected {actual} to loosely not have all values in {keys}")

    defineIncludes("includesLooseAny", includesLooseAny, false,
        "Expected {actual} to loosely have any value in {keys}")

    defineIncludes("notIncludesLoose", includesLooseAny, true,
        "Expected {actual} to loosely not have any value in {keys}")

    var includesDeepAll = makeIncludes(true, deepEqual)
    var includesDeepAny = makeIncludes(false, deepEqual)

    defineIncludes("includesDeep", includesDeepAll, false,
        "Expected {actual} to match all values in {keys}")

    defineIncludes("notIncludesDeepAll", includesDeepAll, true,
        "Expected {actual} to not match all values in {keys}")

    defineIncludes("includesDeepAny", includesDeepAny, false,
        "Expected {actual} to match any value in {keys}")

    defineIncludes("notIncludesDeep", includesDeepAny, true,
        "Expected {actual} to not match any value in {keys}")

    var includesLooseDeepAll = makeIncludes(true, looseDeepEqual)
    var includesLooseDeepAny = makeIncludes(false, looseDeepEqual)

    defineIncludes("includesLooseDeep", includesLooseDeepAll, false,
        "Expected {actual} to loosely match all values in {keys}")

    defineIncludes("notIncludesLooseDeepAll", includesLooseDeepAll, true,
        "Expected {actual} to loosely not match all values in {keys}")

    defineIncludes("includesLooseDeepAny", includesLooseDeepAny, false,
        "Expected {actual} to loosely match any value in {keys}")

    defineIncludes("notIncludesLooseDeep", includesLooseDeepAny, true,
        "Expected {actual} to loosely not match any value in {keys}")

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

    var hasAllKeys = hasKeysType(true, strictIs)
    var hasAnyKeys = hasKeysType(false, strictIs)

    makeHasKeys("hasKeys", hasAllKeys, false,
        "Expected {actual} to have all keys in {keys}")

    makeHasKeys("notHasAllKeys", hasAllKeys, true,
        "Expected {actual} to not have all keys in {keys}")

    makeHasKeys("hasAnyKeys", hasAnyKeys, false,
        "Expected {actual} to have any key in {keys}")

    makeHasKeys("notHasKeys", hasAnyKeys, true,
        "Expected {actual} to not have any key in {keys}")

    var hasLooseAllKeys = hasKeysType(true, looseIs)
    var hasLooseAnyKeys = hasKeysType(false, looseIs)

    makeHasKeys("hasLooseKeys", hasLooseAllKeys, false,
        "Expected {actual} to loosely have all keys in {keys}")

    makeHasKeys("notHasLooseAllKeys", hasLooseAllKeys, true,
        "Expected {actual} to loosely not have all keys in {keys}")

    makeHasKeys("hasLooseAnyKeys", hasLooseAnyKeys, false,
        "Expected {actual} to loosely have any key in {keys}")

    makeHasKeys("notHasLooseKeys", hasLooseAnyKeys, true,
        "Expected {actual} to loosely not have any key in {keys}")

    var hasDeepAllKeys = hasKeysType(true, deepEqual)
    var hasDeepAnyKeys = hasKeysType(false, deepEqual)

    makeHasKeys("hasDeepKeys", hasDeepAllKeys, false,
        "Expected {actual} to match all keys in {keys}")

    makeHasKeys("notHasDeepAllKeys", hasDeepAllKeys, true,
        "Expected {actual} to not match all keys in {keys}")

    makeHasKeys("hasDeepAnyKeys", hasDeepAnyKeys, false,
        "Expected {actual} to match any key in {keys}")

    makeHasKeys("notHasDeepKeys", hasDeepAnyKeys, true,
        "Expected {actual} to not match any key in {keys}")

    var hasLooseDeepAllKeys = hasKeysType(true, looseDeepEqual)
    var hasLooseDeepAnyKeys = hasKeysType(false, looseDeepEqual)

    makeHasKeys("hasLooseDeepKeys", hasLooseDeepAllKeys, false,
        "Expected {actual} to loosely match all keys in {keys}")

    makeHasKeys("notHasLooseDeepAllKeys", hasLooseDeepAllKeys, true,
        "Expected {actual} to loosely not match all keys in {keys}")

    makeHasKeys("hasLooseDeepAnyKeys", hasLooseDeepAnyKeys, false,
        "Expected {actual} to loosely match any key in {keys}")

    makeHasKeys("notHasLooseDeepKeys", hasLooseDeepAnyKeys, true,
        "Expected {actual} to loosely not match any key in {keys}")

    if (typeof global.techtonic !== "undefined") {
        global.techtonic.use(plugin)
    }

    return plugin
})
