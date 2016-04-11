"use strict"

/**
 * This code was initially derived from node-deep-equal by James Halliday
 * (substack), which itself is derived from Node, but at this point, it's been
 * through several changes, including that it's in ES6.
 */

const assert = require("assert")
const Util = require("./util.js")

const hasOwn = Object.prototype.hasOwnProperty

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

    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false
    }

    return true
}

// Most of the time, there aren't any non-index members to check. Let's do that
// before sorting, as this is easy to test.
function keyCount(keys) {
    if (process.env.NODE_ENV === "development") {
        assert(Array.isArray(keys))
    }

    if (keys.length === 0) return 0

    let count = 0

    for (let i = 0; i < keys.length; i++) {
        if (keys[i] === "length" || /^\d+$/.test(keys[i])) {
            count++
        }
    }

    return count
}

function getKeys(coll) {
    if (process.env.NODE_ENV === "development") {
        assert(coll instanceof Map || coll instanceof Set,
            `Expected coll to be a Map or Set, but found ${coll}`)
    }

    return new Set(coll.keys())
}

function noneIsObject(keys) {
    for (const key of keys) {
        if (isObject(key)) return false
    }

    return true
}

function hasAllKeys(b, keys) {
    for (const key of keys) {
        if (!hasOwn.call(b, key)) return false
    }

    return true
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
    if (process.env.NODE_ENV === "development") {
        assert.notEqual(typeof a, "object")
        assert.notEqual(typeof b, "object")
    }

    if (type === "loose" && Util.looseIs(a, b)) return true
    else if (Util.strictIs(a, b)) return true
    return type !== "strict" && symbolMatch(a, b)
}

function keysCheck(f, a, b, keys, type) { // eslint-disable-line max-params
    for (let i = 0; i < keys.length; i++) {
        if (!f(a[keys[i]], b[keys[i]], type)) {
            return false
        }
    }

    return true
}

function objMatch(a, b, type) {
    if (process.env.NODE_ENV === "development") {
        assert.equal(typeof a, "object")
        assert.notEqual(a, null)
        assert.equal(typeof b, "object")
        assert.notEqual(b, null)
    }

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

    if (Buffer.isBuffer(a)) {
        return Buffer.isBuffer(b) && bufferMatch(a, b)
    }

    if (Array.isArray(a)) return Array.isArray(b) && arrayMatch(a, b, type)
    if (a instanceof Map) return b instanceof Map && mapMatch(a, b, type)
    if (a instanceof Set) return b instanceof Set && setMatch(a, b, type)

    const keys = Object.keys(a)

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
    for (let i = 0; i < a.length; i++) {
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

    const akeys = Object.keys(a)
    const bkeys = Object.keys(b)

    // Same number of own properties
    if (akeys.length !== bkeys.length) return false

    // no properties
    if (akeys.length === 0) return true

    // Most of the time, there aren't any non-index to check. Let's do
    // that before sorting, as this is easy to test.
    const acount = keyCount(akeys)
    const bcount = keyCount(bkeys)

    if (acount === 0 || bcount === 0) return true
    if (acount !== bcount) return false

    // the same set of keys
    if (!hasAllKeys(b, akeys)) return false

    return keysCheck(similarPrims, a, b, akeys, type) ||
        keysCheck(deepEqual, a, b, akeys, type)
}

function collExtras(a, b, type) {
    const akeys = Object.keys(a)
    const bkeys = Object.keys(b)

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
    assert.equal(a.keys.size, b.keys.size)

    const iter1 = a.keys.keys()
    const iter2 = b.keys.keys()
    let res1 = iter1.next()
    let res2 = iter2.next()

    while (!res1.done && !res2.done) {
        if (!f(a.map.get(res1.value), b.map.get(res2.value), type)) {
            return false
        }

        res1 = iter1.next()
        res2 = iter2.next()
    }

    return true
}

function filterObjects(keys) {
    const set = new Set()

    for (const key of keys) {
        if (isObject(key)) set.add(key)
    }

    return set
}

function moveToFront(set, key) {
    set.delete(key)
    set.add(key)
}

function keysDuckMatch(akeys, bkeys, type) {
    const set = filterObjects(bkeys)

    loop: // eslint-disable-line no-labels
    for (const key of Array.from(akeys)) {
        if (set.size === 0) break

        for (const item of set) {
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
    let count = akeys.size
    const list = []

    loop: // eslint-disable-line no-labels
    for (const akey of akeys) {
        for (const bkey of bkeys) {
            if (Util.looseIs(akey, bkey)) {
                list.push(akey)
                bkeys.delete(bkey)
                count--
                continue loop // eslint-disable-line no-labels
            }
        }
    }

    for (let i = 0; i < list.length; i++) {
        akeys.delete(list[i])
    }

    return count === 0
}

function hasAllCollKeys(akeys, bkeys) {
    for (const key of Array.from(akeys)) {
        if (!bkeys.has(key)) return false
        moveToFront(akeys, key)
        moveToFront(bkeys, key)
    }

    return true
}

function mapMatch(a, b, type) {
    if (a.size !== b.size) return false
    if (a.size === 0) return true

    const akeys = getKeys(a)
    const bkeys = getKeys(b)

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

    const dataA = {map: a, keys: akeys}
    const dataB = {map: b, keys: bkeys}

    // equivalent values for every corresponding key, and possibly
    // expensive deep test
    return (mapCheck(similarPrims, dataA, dataB, type) ||
        mapCheck(deepEqual, dataA, dataB, type)) &&
        collExtras(a, b, type)
}

function compareValues(akeys, bkeys, type) {
    const set = filterObjects(bkeys)

    loop: // eslint-disable-line no-labels
    for (const key of akeys) {
        if (set.size === 0) break

        for (const item of set) {
            if (deepEqual(key, item, type)) {
                set.delete(item)
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

    const akeys = getKeys(a)
    const bkeys = getKeys(b)

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
