/* global Map, Set */

"use strict"

/**
 * This code was initially derived from node-deep-equal by James Halliday
 * (substack), which itself is derived from Node, but at this point, it's been
 * through several changes.
 */

var Util = require("./util.js")
var isBuffer = require("./is-buffer.js")

var hasOwn = Object.prototype.hasOwnProperty
var LOOSE = 1
var STRICT = 2

module.exports = function (a, b, type) {
    var converted = 0

    if (type === "strict") converted = STRICT
    else if (type === "loose") converted = LOOSE

    return deepEqual(a, b, converted)
}

function symbolMatch(a, b) {
    return typeof a === "symbol" && typeof b === "symbol" &&
        a.toString() === b.toString()
}

function isObject(a) {
    return typeof a === "object" && a !== null
}

// Way faster than deepEqual, as everything here is always a number
function bufferContentsMatch(a, b) {
    if (a.length !== b.length) return false

    for (var i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false
    }

    return true
}

function bufferMatch(a, b, type) {
    return bufferContentsMatch(a, b) && arrayPropsMatch(a, b, type)
}

function keyCheck(f, a, b, keys, type) { // eslint-disable-line max-params
    for (var i = 0; i < keys.length; i++) {
        if (!f(a[keys[i]], b[keys[i]], type)) {
            return false
        }
    }

    return true
}

function similarPrims(a, b, type) {
    return !isObject(a) && !isObject(b) && deepEqualPrim(a, b, type)
}

function deepEqual(a, b, type) {
    if (!isObject(a)) {
        return !isObject(b) && deepEqualPrim(a, b, type)
    } else {
        return isObject(b) && objMatch(a, b, type)
    }
}

function deepEqualPrim(a, b, type) {
    if (type === LOOSE) return Util.looseIs(a, b) || symbolMatch(a, b)
    if (type === STRICT) return Util.strictIs(a, b)
    return Util.strictIs(a, b) || symbolMatch(a, b)
}

function hasAllKeys(b, keys) {
    for (var i = 0; i < keys.length; i++) {
        if (!hasOwn.call(b, keys[i])) return false
    }

    return true
}

function nope() { return false }

var isMap = nope
var isSet = nope

// The `Map` and `Set` comparison functions both depend on Set existing, and
// it's highly unlikely `Map` exists and `Set` doesn't.

if (typeof Map === "function" && typeof Set === "function") {
    isMap = function (a) { return a instanceof Map }
    isSet = function (a) { return a instanceof Set }
}

var ignored = {}

function keyIsIgnored(obj, key) {
    var desc = Object.getOwnPropertyDescriptor(obj, key)
    var test = ignored[key]

    if (test.get !== (desc.get !== undefined)) return false
    if (test.set !== (desc.set !== undefined)) return false
    if (test.value !== Util.getType(desc.value)) return false
    if (test.configurable !== desc.configurable) return false
    if (test.enumerable !== desc.enumerable) return false
    if (test.writable !== desc.writable) return false
    return true
}

function stripIgnores(obj) {
    var result = []

    for (var key in obj) {
        if (hasOwn.call(obj, key)) {
            if (!hasOwn.call(ignored, key) || !keyIsIgnored(obj, key)) {
                result.push(key)
            }
        }
    }

    return result
}

function getStrippedKeys(obj, type) {
    return type === STRICT
        ? Object.keys(obj)
        : stripIgnores(obj)
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

// Feature-test delayed stack additions and extra keys. PhantomJS and IE both
// wait until the error was actually thrown first. This returns a function to
// speed up cases where `Object.keys` is sufficient (e.g. in Chrome/FF/Node).
var getKeys = (function () {
    var e = new Error()
    var oldKeys = Object.keys(e)
    var oldDescs = {}
    var result = Object.keys

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
            ignored[key] = {
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

function isArguments(obj) {
    return toString.call(obj) === "[object Arguments]"
}

function objMatch(a, b, type) {
    // Check for an identical 'prototype' property.
    if (type === STRICT) {
        if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false
    }

    if (a instanceof Date && b instanceof Date) return +a === +b
    if (isArguments(a)) return isArguments(b) && arrayLikeMatch(a, b, type)
    if (isBuffer(a)) return isBuffer(b) && bufferMatch(a, b)
    if (Array.isArray(a)) return Array.isArray(b) && arrayMatch(a, b, type)
    if (isMap(a)) return isMap(b) && mapMatch(a, b, type)
    if (isSet(a)) return isSet(b) && setMatch(a, b, type)

    var keys = getKeys(a, type)

    // Same number of own properties
    if (keys.length !== Object.keys(b).length) return false
    if (keys.length === 0) return true

    // the same set of keys
    if (!hasAllKeys(b, keys)) return false

    return keyCheck(similarPrims, a, b, keys, type) ||
        keyCheck(deepEqual, a, b, keys, type)
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

function arrayCheck(f, a, b, type) {
    for (var i = 0; i < a.length; i++) {
        if (!f(a[i], b[i], type)) return false
    }

    return true
}

function arrayLikeMatch(a, b, type) {
    if (a.length !== b.length) return false
    return arrayCheck(similarPrims, a, b, type) ||
        arrayCheck(deepEqual, a, b, type)
}

function arrayPropsMatch(a, b, type) {
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

    return keyCheck(similarPrims, a, b, filtered, type) ||
        keyCheck(deepEqual, a, b, filtered, type)
}

function arrayMatch(a, b, type) {
    return arrayLikeMatch(a, b, type) && arrayPropsMatch(a, b, type)
}

function collExtras(a, b, type) {
    var akeys = Object.keys(a)
    var bkeys = Object.keys(b)

    // Same number of own properties
    if (akeys.length !== bkeys.length) return false
    if (akeys.length === 0) return true
    if (!hasAllKeys(b, akeys)) return false

    return keyCheck(similarPrims, a, b, akeys, type) ||
        keyCheck(deepEqual, a, b, akeys, type)
}

function mapCheck(f, a, akeys, b, bkeys, type) { // eslint-disable-line max-params, max-len
    var iter1 = akeys.keys()
    var iter2 = bkeys.keys()
    var res1 = iter1.next()
    var res2 = iter2.next()
    var hasNext

    while ((hasNext = !res1.done && !res2.done)) {
        if (!f(a.get(res1.value), b.get(res2.value), type)) {
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

function keysDuckMatch(akeys, bkeys, type) {
    var set = filterObjects(bkeys)
    var keySet = setToArray(akeys)

    for (var i = 0; i < keySet.length && set.size !== 0; i++) {
        var key = keySet[i]
        var iter = set.values()
        var found = false

        for (var next = iter.next(); !next.done; next = iter.next()) {
            var item = next.value

            if (deepEqual(key, item, type)) {
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

// Loose key searches are horrendously slow. This is an O(n log n) search, and
// there's few ways to speed this up. Sets are used because the keys need to
// remain unordered, and the similar keys are removed to reduce the number of
// checks.
function hasLooseKeys(akeys, bkeys) {
    var count = akeys.size
    var list = []

    if (akeys.size !== 0 && bkeys.size !== 0) {
        var iter1 = akeys.values()

        for (var next1 = iter1.next(); !next1.done; next1 = iter1.next()) {
            var akey = next1.value
            var iter2 = bkeys.values()

            for (var next2 = iter2.next(); !next2.done; next2 = iter2.next()) {
                var bkey = next2.value

                if (Util.looseIs(akey, bkey)) {
                    list.push(akey)
                    bkeys.delete(bkey)
                    count--
                    break
                }
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

function mapMatch(a, b, type) {
    if (a.size !== b.size) return false
    if (a.size === 0) return true

    var akeys = new Set(a.keys())
    var bkeys = new Set(b.keys())

    // Possibly slow structural key match, try to avoid it by checking that
    // they're all non-objects first.
    if (!hasAllCollKeys(akeys, bkeys)) {
        // This check is required for loose checking. Sadly, it requires a full
        // O(n log n) check on the keys for loose equality, since it's not doing
        // pure equality.
        if (type !== LOOSE || !hasLooseKeys(akeys, bkeys)) {
            if (noneIsObject(akeys)) return false
            if (!keysDuckMatch(akeys, bkeys, type)) return false
        }
    }

    // equivalent values for every corresponding key, and possibly
    // expensive deep test
    return (mapCheck(similarPrims, a, akeys, b, bkeys, type) ||
        mapCheck(deepEqual, a, akeys, b, bkeys, type)) &&
        collExtras(a, b, type)
}

function compareValues(akeys, bkeys, type) {
    var set = filterObjects(bkeys)

    if (akeys.size === 0 || set.size === 0) {
        return false
    }

    var iter1 = akeys.values()

    for (var next1 = iter1.next(); !next1.done; next1 = iter1.next()) {
        var iter2 = set.values()
        var found = false

        for (var next2 = iter2.next(); !next2.done; next2 = iter2.next()) {
            if (deepEqual(next1.value, next2.value, type)) {
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

function setMatch(a, b, type) {
    if (a.size !== b.size) return false
    if (a.size === 0) return true

    var akeys = new Set(a.keys())
    var bkeys = new Set(b.keys())

    if (!hasAllCollKeys(akeys, bkeys)) {
        // This check is required for loose checking. Sadly, it requires a full
        // O(n log n) check on the keys for loose equality, since it's not doing
        // pure equality.
        if (type !== LOOSE || !hasLooseKeys(akeys, bkeys)) {
            if (noneIsObject(akeys)) return false
            if (!compareValues(akeys, bkeys, type)) return false
        }
    }

    return collExtras(a, b, type)
}
