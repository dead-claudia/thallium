"use strict"

/**
 * This code was initially derived from node-deep-equal by James Halliday
 * (substack), which itself is derived from Node, but at this point, it's been
 * through several changes.
 */

var Util = require("./util.js")
var isBuffer = require("./replaced/is-buffer.js")

var hasOwn = Object.prototype.hasOwnProperty

var Types = Object.freeze({
    Match: 0,
    Loose: 1,
    Strict: 2,
})

exports.match = function (a, b) {
    return deepEqual(new Matcher(Types.Match), a, b)
}

exports.strict = function (a, b) {
    return deepEqual(new Matcher(Types.Strict), a, b)
}

exports.loose = function (a, b) {
    return deepEqual(new Matcher(Types.Loose), a, b)
}

function Matcher(type) {
    this.type = type
    this.left = undefined
    this.right = undefined
}

function pushContext(matcher, a, b) {
    if (matcher.left == null) {
        matcher.left = [a]
    } else {
        matcher.left.push(a)
    }

    if (matcher.right == null) {
        matcher.right = [b]
    } else {
        matcher.right.push(b)
    }
}

function isCircularLeft(matcher, value) {
    return matcher.left != null &&
        matcher.left.indexOf(value) !== -1
}

function isCircularRight(matcher, value) {
    return matcher.right != null &&
        matcher.right.indexOf(value) !== -1
}

function popContext(matcher) {
    if (matcher.left.length === 1) {
        matcher.left = undefined
    } else {
        matcher.left.pop()
    }

    if (matcher.right.length === 1) {
        matcher.right = undefined
    } else {
        matcher.right.pop()
    }
}

function symbolMatch(a, b) {
    return typeof a === "symbol" && typeof b === "symbol" &&
        a.toString() === b.toString()
}

function isObject(a) {
    return typeof a === "object" && a !== null
}

function isArguments(obj) {
    return toString.call(obj) === "[object Arguments]"
}

var dateValueOf = Date.prototype.valueOf
var getPrototypeOf = Object.getPrototypeOf
var supportsUnicode = hasOwn.call(RegExp.prototype, "unicode")
var supportsSticky = hasOwn.call(RegExp.prototype, "sticky")

// Way faster, since everything here is always a number. It's just a heuristic.
var isTypedArray = (function () {
    var int8Proto = getPrototypeOf(global.Int8Array.prototype)
    var int16Proto = getPrototypeOf(global.Int16Array.prototype)

    if (int8Proto !== int16Proto || int8Proto === Object.prototype) {
        var Uint8Array = global.Uint8Array
        var Uint8ClampedArray = global.Uint8ClampedArray
        var Uint16Array = global.Uint16Array
        var Uint32Array = global.Uint32Array
        var Int8Array = global.Int8Array
        var Int16Array = global.Int16Array
        var Int32Array = global.Int32Array

        return function (a) {
            return isBuffer(a) ||
                Uint8Array != null && a instanceof Uint8Array ||
                Uint8ClampedArray != null && a instanceof Uint8ClampedArray ||
                Uint16Array != null && a instanceof Uint16Array ||
                Uint32Array != null && a instanceof Uint32Array ||
                Int8Array != null && a instanceof Int8Array ||
                Int16Array != null && a instanceof Int16Array ||
                Int32Array != null && a instanceof Int32Array
        }
    }

    var TypedArray = int8Proto.constructor

    return function (a) {
        // Buffers are TypedArrays in recent Node.
        return a instanceof TypedArray || isBuffer(a)
    }
})()

function typedArrayContentsMatch(a, b) {
    if (a.length !== b.length) return false

    for (var i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false
    }

    return true
}

function typedArrayMatch(matcher, a, b) {
    return typedArrayContentsMatch(a, b) && arrayPropsMatch(matcher, a, b)
}

function keyCheck(f, matcher, a, b, keys) { // eslint-disable-line max-params
    for (var i = 0; i < keys.length; i++) {
        if (!f(matcher, a[keys[i]], b[keys[i]])) {
            return false
        }
    }

    return true
}

function similarPrims(matcher, a, b) {
    return !isObject(a) && !isObject(b) && deepEqualPrim(matcher, a, b)
}

function deepEqual(matcher, a, b) {
    if (!isObject(a)) {
        return !isObject(b) && deepEqualPrim(matcher, a, b)
    } else {
        return isObject(b) && objMatch(matcher, a, b)
    }
}

function deepEqualPrim(matcher, a, b) {
    if (matcher.type === Types.Loose) {
        return Util.looseIs(a, b) || symbolMatch(a, b)
    } else if (matcher.type === Types.Strict) {
        return Util.strictIs(a, b)
    } else {
        return Util.strictIs(a, b) || symbolMatch(a, b)
    }
}

function hasAllKeys(b, keys) {
    for (var i = 0; i < keys.length; i++) {
        if (!hasOwn.call(b, keys[i])) return false
    }

    return true
}

// Feature-test delayed stack additions and extra keys. PhantomJS and IE both
// wait until the error was actually thrown first. This returns a function to
// speed up cases where `Object.keys` is sufficient (e.g. in Chrome/FF/Node).
var getKeys = (function () {
    var ignoredKeys = {}

    function keyIsIgnored(obj, key) {
        var desc = Object.getOwnPropertyDescriptor(obj, key)
        var test = ignoredKeys[key]

        if (test.get !== (desc.get !== undefined)) return false
        if (test.set !== (desc.set !== undefined)) return false
        if (test.value !== Util.getType(desc.value)) return false
        if (test.configurable !== desc.configurable) return false
        if (test.enumerable !== desc.enumerable) return false
        if (test.writable !== desc.writable) return false
        return true
    }

    function descriptorIsDifferent(old, desc) {
        if (old === undefined) return true
        if (desc.configurable !== old.configurable) return true
        if (desc.enumerable !== old.enumerable) return true
        if (desc.writable !== old.writable) return true
        if (desc.get !== old.get) return true
        if (desc.set !== old.set) return true
        if (desc.value !== old.value) return true
        return false
    }

    function getRawKeys(matcher, obj) {
        return Object.keys(obj)
    }

    function getStrippedKeys(matcher, obj) {
        if (matcher.type === Types.Strict) return Object.keys(obj)

        var result = []

        for (var key in obj) {
            if (hasOwn.call(obj, key)) {
                if (!hasOwn.call(ignoredKeys, key) || !keyIsIgnored(obj, key)) {
                    result.push(key)
                }
            }
        }

        return result
    }

    var e = new Error()
    var oldKeys = Object.keys(e)
    var oldDescs = {}
    var result = getRawKeys

    for (var i = 0; i < oldKeys.length; i++) {
        oldDescs[oldKeys[i]] = Object.getOwnPropertyDescriptor(e, oldKeys[i])
    }

    try {
        throw e
    } catch (_) {
        // ignore
    }

    var newKeys = Object.keys(e)

    for (var j = 0; j < newKeys.length; j++) {
        var key = newKeys[j]
        var old = oldDescs[key]
        var desc = Object.getOwnPropertyDescriptor(e, key)

        if (descriptorIsDifferent(old, desc)) {
            result = getStrippedKeys
            ignoredKeys[key] = {
                get: desc.get !== undefined &&
                    (old !== undefined || desc.get === old.get),
                set: desc.set !== undefined &&
                    (old !== undefined || desc.set === old.set),
                value: Util.getType(desc.value),
                configurable: desc.configurable,
                enumerable: desc.enumerable,
                writable: desc.writable,
            }
        }
    }

    return result
})()

// The `Map` and `Set` comparison functions both depend on Set existing, and
// it's highly unlikely `Map` exists and `Set` doesn't.
function alwaysFalse() {
    return false
}

var isMap = alwaysFalse
var isSet = alwaysFalse
var mapMatch = alwaysFalse
var setMatch = alwaysFalse

;(function () {
    var Map = global.Map
    var Set = global.Set

    if (typeof Map !== "function" || typeof Set !== "function") {
        return
    }

    isMap = function (a) {
        return a instanceof Map
    }

    isSet = function (a) {
        return a instanceof Set
    }

    function collExtras(matcher, a, b) {
        var akeys = getKeys(matcher, a)
        var bkeys = getKeys(matcher, b)

        // Same number of own properties
        if (akeys.length !== bkeys.length) return false
        if (akeys.length === 0) return true
        if (!hasAllKeys(b, akeys)) return false

        return keyCheck(similarPrims, matcher, a, b, akeys) ||
            keyCheck(deepEqual, matcher, a, b, akeys)
    }

    function mapCheck(f, matcher, a, akeys, b, bkeys) { // eslint-disable-line max-params, max-len
        var iter1 = akeys.keys()
        var iter2 = bkeys.keys()
        var res1 = iter1.next()
        var res2 = iter2.next()
        var hasNext

        while ((hasNext = !res1.done && !res2.done)) {
            if (!f(matcher, a.get(res1.value), b.get(res2.value))) {
                return false
            }

            res1 = iter1.next()
            res2 = iter2.next()
        }

        return !hasNext
    }

    // Note: only call this with Sets.
    function noneIsObject(keys) {
        if (keys.size === 0) return false

        var iter = keys.values()

        for (var next = iter.next(); !next.done; next = iter.next()) {
            if (isObject(next.value)) return false
        }

        return true
    }

    // Note: only call this with Sets.
    function filterObjects(keys) {
        var set = new Set()

        if (keys.size !== 0) {
            var iter = keys.values()

            for (var next = iter.next(); !next.done; next = iter.next()) {
                if (isObject(next.value)) set.add(next.value)
            }
        }

        return set
    }

    function moveToFront(set, key) {
        set.delete(key)
        set.add(key)
    }

    function setToArray(set) {
        var array = new Array(set.size)
        var i = 0

        if (set.size !== 0) {
            var iter = set.values()

            for (var next = iter.next(); !next.done; next = iter.next()) {
                array[i++] = next.value
            }
        }

        return array
    }

    function keysDuckMatch(matcher, akeys, bkeys) {
        var set = filterObjects(bkeys)
        var keySet = setToArray(akeys)

        for (var i = 0; i < keySet.length && set.size !== 0; i++) {
            var key = keySet[i]
            var iter = set.values()
            var found = false

            for (var next = iter.next(); !next.done; next = iter.next()) {
                var item = next.value

                if (deepEqual(matcher, key, item)) {
                    set.delete(item)

                    moveToFront(akeys, key)
                    moveToFront(bkeys, item)

                    found = true
                    break
                }
            }

            if (!found) return false
        }

        return true
    }

    // Loose key searches are horrendously slow. This is an O(n log n) search,
    // and there's few ways to speed this up. Sets are used because the keys
    // need to remain unordered, and the similar keys are removed to reduce the
    // number of checks.
    function hasLooseKey(bkeys, akey, list) {
        var iter2 = bkeys.values()

        for (var next2 = iter2.next(); !next2.done; next2 = iter2.next()) {
            var bkey = next2.value

            if (Util.looseIs(akey, bkey)) {
                list.push(akey)
                bkeys.delete(bkey)
                return true
            }
        }

        return false
    }

    function hasLooseKeys(akeys, bkeys) {
        var count = akeys.size
        var list = []

        if (akeys.size !== 0 && bkeys.size !== 0) {
            var iter1 = akeys.values()

            for (var next1 = iter1.next(); !next1.done; next1 = iter1.next()) {
                if (hasLooseKey(bkeys, next1.value, list)) {
                    count--
                }
            }
        }

        for (var i = 0; i < list.length; i++) {
            akeys.delete(list[i])
        }

        return count === 0
    }

    function hasAllCollKeys(akeys, bkeys) {
        var keySet = setToArray(akeys)

        for (var i = 0; i < keySet.length; i++) {
            var key = keySet[i]

            if (!bkeys.has(key)) return false
            moveToFront(akeys, key)
            moveToFront(bkeys, key)
        }

        return true
    }

    mapMatch = function (matcher, a, b) {
        if (a.size !== b.size) return false
        if (a.size === 0) return true

        var akeys = new Set(a.keys())
        var bkeys = new Set(b.keys())

        // Possibly slow structural key match, try to avoid it by checking that
        // they're all non-objects first.
        if (!hasAllCollKeys(akeys, bkeys)) {
            // This check is required for loose checking. Sadly, it requires a
            // full O(n log n) check on the keys for loose equality, since it's
            // not doing pure equality.
            if (matcher.type !== Types.Loose || !hasLooseKeys(akeys, bkeys)) {
                if (noneIsObject(akeys)) return false
                if (!keysDuckMatch(matcher, akeys, bkeys)) return false
            }
        }

        // equivalent values for every corresponding key, and possibly
        // expensive deep test
        return (mapCheck(similarPrims, matcher, a, akeys, b, bkeys) ||
            mapCheck(deepEqual, matcher, a, akeys, b, bkeys)) &&
            collExtras(matcher, a, b)
    }

    function compareValues(matcher, akeys, bkeys) {
        var set = filterObjects(bkeys)

        if (akeys.size === 0 || set.size === 0) {
            return false
        }

        var iter1 = akeys.values()

        for (var next1 = iter1.next(); !next1.done; next1 = iter1.next()) {
            var iter2 = set.values()
            var found = false

            for (var next2 = iter2.next(); !next2.done; next2 = iter2.next()) {
                if (deepEqual(matcher, next1.value, next2.value)) {
                    set.delete(next2.value)
                    found = true
                    break
                }
            }

            if (!found) return false
            if (set.size === 0) break
        }

        return true
    }

    setMatch = function (matcher, a, b) {
        if (a.size !== b.size) return false
        if (a.size === 0) return true

        var akeys = new Set(a.keys())
        var bkeys = new Set(b.keys())

        if (!hasAllCollKeys(akeys, bkeys)) {
            // This check is required for loose checking. Sadly, it requires a
            // full O(n log n) check on the keys for loose equality, since it's
            // not doing pure equality.
            if (matcher.type !== Types.Loose || !hasLooseKeys(akeys, bkeys)) {
                if (noneIsObject(akeys)) return false
                if (!compareValues(matcher, akeys, bkeys)) return false
            }
        }

        return collExtras(matcher, a, b)
    }
})()

function objMatch(matcher, a, b) {
    // Check for an identical 'prototype' property.
    if (matcher.type === Types.Strict) {
        if (getPrototypeOf(a) !== getPrototypeOf(b)) return false
    }

    if (a instanceof Date && b instanceof Date) {
        if (dateValueOf.call(a) !== dateValueOf.call(b)) return false
    }

    if (a instanceof RegExp && b instanceof RegExp) {
        if (a.source !== b.source) return false
        if (a.global !== b.global) return false
        if (a.ignoreCase !== b.ignoreCase) return false
        if (a.multiline !== b.multiline) return false
        if (supportsUnicode && a.unicode !== b.unicode) return false
        if (supportsSticky && a.sticky !== b.sticky) return false
    }

    // Check for circular references
    if (isCircularLeft(matcher, a)) return isCircularRight(matcher, b)
    if (isCircularRight(matcher, b)) return false

    pushContext(matcher, a, b)

    var result = objMatchInner(matcher, a, b)

    popContext(matcher)

    return result
}

// Can't just be done inline - the context has to be handled outside of this.
function objMatchInner(matcher, a, b) {
    if (isArguments(a)) {
        return isArguments(b) && arrayLikeMatch(matcher, a, b)
    }

    if (isTypedArray(a)) {
        return isTypedArray(b) && typedArrayMatch(matcher, a, b)
    }

    if (Array.isArray(a)) {
        return Array.isArray(b) && arrayMatch(matcher, a, b)
    }

    if (isMap(a)) return isMap(b) && mapMatch(matcher, a, b)
    if (isSet(a)) return isSet(b) && setMatch(matcher, a, b)

    var keys = getKeys(matcher, a)

    // Same number of own properties
    if (keys.length !== getKeys(matcher, b).length) return false

    // No keys to check
    if (keys.length === 0) return true

    // The same set of keys
    if (!hasAllKeys(b, keys)) return false

    return keyCheck(similarPrims, matcher, a, b, keys) ||
        keyCheck(deepEqual, matcher, a, b, keys)
}

// Using character codes for speed (doing this for every array entry is rather
// costly for larger arrays).
function isArrayKey(str) {
    for (var i = 0; i < str.length; i++) {
        var ch = str.charCodeAt(i)|0

        if (ch < 48 || ch > 57) return false
    }

    return true
}

// Most of the time, there aren't any non-index members to check. Let's check
// that before sorting, as this is easy to test. Note that these two functions
// are duplicated to merge the two phases of testing length and iterating keys,
// since allocation is generally cheap.
function keyCount(keys) {
    var count = 0

    for (var i = 0; i < keys.length; i++) {
        if (isArrayKey(keys[i])) count++
    }

    return count
}

function filterNonIndex(keys) {
    var list = []

    for (var i = 0; i < keys.length; i++) {
        if (isArrayKey(keys[i])) list.push(keys[i])
    }

    return list
}

function arrayCheck(f, matcher, a, b) {
    for (var i = 0; i < a.length; i++) {
        if (!f(matcher, a[i], b[i])) return false
    }

    return true
}

function arrayLikeMatch(matcher, a, b) {
    if (a.length !== b.length) return false
    return arrayCheck(similarPrims, matcher, a, b) ||
        arrayCheck(deepEqual, matcher, a, b)
}

function arrayPropsMatch(matcher, a, b) {
    var akeys = Object.keys(a)
    var bkeys = Object.keys(b)

    // Same number of own properties
    if (akeys.length !== bkeys.length) return false
    if (akeys.length === 0) return true

    // Most of the time, there aren't any non-index to check. Let's do
    // that before sorting, as this is easy to test. Also, only check the
    // non-index keys.
    var filtered = filterNonIndex(akeys)
    var bcount = keyCount(bkeys)

    // same number of non-index keys
    if (filtered.length !== bcount) return false
    if (bcount === 0) return true
    if (!hasAllKeys(b, akeys)) return false

    return keyCheck(similarPrims, matcher, a, b, filtered) ||
        keyCheck(deepEqual, matcher, a, b, filtered)
}

function arrayMatch(matcher, a, b) {
    return arrayLikeMatch(matcher, a, b) && arrayPropsMatch(matcher, a, b)
}
