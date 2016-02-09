"use strict"

/**
 * This file is dual-licensed under the MIT and ISC license. Most of it is a
 * close copy from substack's node-deep-equal, which itself is derived from
 * Node, but there are a few differences and modifications.
 */

/**
 * Tests for arguments
 */

var toString = {}.toString

// For consistent NaN handling

function strictIs(a, b) {
    return a === b || a !== a && b !== b // eslint-disable-line no-self-compare
}

function looseIs(a, b) {
    /* eslint-disable no-self-compare, eqeqeq */
    return a == b || a != a && b != b
    /* eslint-enable no-self-compare, eqeqeq */
}

exports.strictIs = strictIs
exports.looseIs = looseIs

exports.looseDeepEqual = function (actual, expected) {
    return deepEqual(actual, expected, false)
}

exports.deepEqual = function (actual, expected) {
    return deepEqual(actual, expected, true)
}

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

    // equivalent values for every corresponding key, and possibly expensive
    // deep test
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

    // Most of the time, there aren't any non-index to check. Let's do that
    // before sorting, as this is easy to test.
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
    if (strict && Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) {
        return false
    }

    // Arguments object doesn't seem to like Object.keys. Checking it as an
    // array fixes this.
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
