/* global Map, Set */

"use strict"

/**
 * This code was initially derived from node-deep-equal by James Halliday
 * (substack), which itself is derived from Node, but at this point, it's been
 * through several changes.
 */

var Util = require("./common.js")

var hasOwn = Object.prototype.hasOwnProperty

function symbolMatch(a, b) {
    return typeof a === "symbol" && typeof b === "symbol" &&
        a.toString() === b.toString()
}

function isObject(a) {
    return typeof a === "object" && a !== null
}

// Way faster than deepEqual, as everything here is always a number
function bufferMatch(a, b) {
    if (a.length !== b.length) return false

    for (var i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false
    }

    return true
}

// Most of the time, there aren't any non-index members to check. Let's do that
// before sorting, as this is easy to test.
function keyCount(keys) {
    if (keys.length === 0) return 0

    var count = 0

    for (var i = 0; i < keys.length; i++) {
        if (keys[i] === "length" || /^\d+$/.test(keys[i])) {
            count++
        }
    }

    return count
}

function similarPrims(a, b, type) {
    return !isObject(a) && !isObject(b) && deepEqualPrim(a, b, type)
}

module.exports = deepEqual
function deepEqual(a, b, type) {
    if (!isObject(a)) {
        return !isObject(b) && deepEqualPrim(a, b, type)
    } else {
        return isObject(b) && objMatch(a, b, type)
    }
}

function deepEqualPrim(a, b, type) {
    if (a != null && b != null) {
        return primMatch(a, b, type)
    } else {
        return type === "loose"
            ? a == null && b == null
            : a == null && a === b
    }
}

function primMatch(a, b, type) {
    if (type === "loose" && Util.looseIs(a, b)) return true
    else if (Util.strictIs(a, b)) return true
    return type !== "strict" && symbolMatch(a, b)
}

function keysCheck(f, a, b, keys, type) { // eslint-disable-line max-params
    for (var i = 0; i < keys.length; i++) {
        if (!f(a[keys[i]], b[keys[i]], type)) {
            return false
        }
    }

    return true
}

function hasAllKeys(b, keys) {
    for (var i = 0; i < keys.length; i++) {
        if (!hasOwn.call(b, keys[i])) {
            return false
        }
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

function objMatch(a, b, type) {
    // Check for an identical 'prototype' property.
    if (type === "strict") {
        if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false
    }

    if (a instanceof Date && b instanceof Date) return +a === +b

    // Arguments objects are array-like
    if (toString.call(a) === "[object Arguments]") {
        return toString.call(b) === "[object Arguments]" &&
            arrayLikeMatch(a, b, type)
    }

    /* eslint-disable no-undef */

    if (Buffer.isBuffer(a)) {
        return Buffer.isBuffer(b) && bufferMatch(a, b)
    }

    /* eslint-enable no-undef */

    if (Array.isArray(a)) return Array.isArray(b) && arrayMatch(a, b, type)
    if (isMap(a)) return isMap(b) && mapMatch(a, b, type)
    if (isSet(a)) return isSet(b) && setMatch(a, b, type)

    var keys = Object.keys(a)

    // Same number of own properties
    if (keys.length !== Object.keys(b).length) return false

    // no properties
    if (keys.length === 0) return true

    // the same set of keys
    if (!hasAllKeys(b, keys)) return false

    return keysCheck(similarPrims, a, b, keys, type) ||
        keysCheck(deepEqual, a, b, keys, type)
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

function arrayMatch(a, b, type) {
    if (arrayLikeMatch(a, b, type)) return true

    var akeys = Object.keys(a)
    var bkeys = Object.keys(b)

    // Same number of own properties
    if (akeys.length !== bkeys.length) return false

    // no properties
    if (akeys.length === 0) return true

    // Most of the time, there aren't any non-index to check. Let's do
    // that before sorting, as this is easy to test.
    var acount = keyCount(akeys)
    var bcount = keyCount(bkeys)

    if (acount === 0 || bcount === 0) return true
    if (acount !== bcount) return false

    // the same set of keys
    if (!hasAllKeys(b, akeys)) return false

    return keysCheck(similarPrims, a, b, akeys, type) ||
        keysCheck(deepEqual, a, b, akeys, type)
}

function collExtras(a, b, type) {
    var akeys = Object.keys(a)
    var bkeys = Object.keys(b)

    // Same number of own properties
    if (akeys.length !== bkeys.length) return false

    // no properties
    if (akeys.length === 0) return true

    // the same set of keys
    if (!hasAllKeys(b, akeys)) return false

    return keysCheck(similarPrims, a, b, akeys, type) ||
        keysCheck(deepEqual, a, b, akeys, type)
}

function mapCheck(f, a, b, type) {
    var iter1 = a.keys.keys()
    var iter2 = b.keys.keys()
    var res1 = iter1.next()
    var res2 = iter2.next()

    while (!res1.done && !res2.done) {
        if (!f(a.map.get(res1.value), b.map.get(res2.value), type)) {
            return false
        }

        res1 = iter1.next()
        res2 = iter2.next()
    }

    return true
}

// Note: only call this with Sets.
function noneIsObject(keys) {
    var iter = keys.values()

    for (var next = iter.next(); !next.done; next = iter.next()) {
        if (isObject(next.value)) return false
    }

    return true
}

// Note: only call this with Sets.
function filterObjects(keys) {
    var set = new Set()
    var iter = keys.values()

    for (var next = iter.next(); !next.done; next = iter.next()) {
        if (isObject(next.value)) set.add(next.value)
    }

    return set
}

function moveToFront(set, key) {
    set.delete(key)
    set.add(key)
}

function setToArray(set) {
    var array = new Array(set.size)
    var iter = set.values()
    var i = 0

    for (var next = iter.next(); !next.done; next = iter.next()) {
        array[i++] = next.value
    }

    return array
}

function keysDuckMatch(akeys, bkeys, type) {
    var set = filterObjects(bkeys)
    var keySet = setToArray(akeys)

    loop: // eslint-disable-line no-labels
    for (var i = 0; i < keySet.length; i++) {
        if (set.size === 0) break

        var key = keySet[i]
        var iter = set.values()

        for (var next = iter.next(); !next.done; next = iter.next()) {
            var item = next.value

            if (deepEqual(key, item, type)) {
                set.delete(item)

                moveToFront(akeys, key)
                moveToFront(bkeys, item)

                continue loop // eslint-disable-line no-labels
            }
        }

        return false
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
    var iter1 = akeys.values()

    loop: // eslint-disable-line no-labels
    for (var next1 = iter1.next(); !next1.done; next1 = iter1.next()) {
        var iter2 = bkeys.values()

        for (var next2 = iter2.next(); !next2.done; next2 = iter2.next()) {
            if (Util.looseIs(next1.value, next2.value)) {
                list.push(next1.value)
                bkeys.delete(next2.value)
                count--
                continue loop // eslint-disable-line no-labels
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
        if (type !== "loose" || !hasLooseKeys(akeys, bkeys)) {
            if (noneIsObject(akeys)) return false
            if (!keysDuckMatch(akeys, bkeys, type)) return false
        }
    }

    var dataA = {map: a, keys: akeys}
    var dataB = {map: b, keys: bkeys}

    // equivalent values for every corresponding key, and possibly
    // expensive deep test
    return (mapCheck(similarPrims, dataA, dataB, type) ||
        mapCheck(deepEqual, dataA, dataB, type)) &&
        collExtras(a, b, type)
}

function compareValues(akeys, bkeys, type) {
    var set = filterObjects(bkeys)
    var iter1 = akeys.values()

    loop: // eslint-disable-line no-labels
    for (var next1 = iter1.next(); !next1.done; next1 = iter1.next()) {
        if (set.size === 0) break

        var iter2 = set.values()

        for (var next2 = iter2.next(); !next2.done; next2 = iter2.next()) {
            if (deepEqual(next1.value, next2.value, type)) {
                set.delete(next2.value)
                continue loop // eslint-disable-line no-labels
            }
        }

        return false
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
        if (type !== "loose" || !hasLooseKeys(akeys, bkeys)) {
            if (noneIsObject(akeys)) return false
            if (!compareValues(akeys, bkeys, type)) return false
        }
    }

    return collExtras(a, b, type)
}
