"use strict"

/**
 * This code is largely derived from node-deep-equal by James Halliday
 * (substack), which itself is derived from Node, but there are a few
 * differences and modifications, including the fact this requires at least an
 * ES5 shim (node-deep-equal is ES3-compatible, and Node's assert.deepEqual
 * implementation requires ES6 and internal V8 APIs), and that it is in
 * LiveScript.
 */

var Is = require("./is.js")

function symbolMatch(a, b) {
    return typeof a === "symbol" && typeof b === "symbol" &&
        a.toString() === b.toString()
}

function isBuffer(x) {
    if (x == null) return false
    if (typeof x !== "object") return false
    if (typeof x.length !== "number") return false

    if (typeof x.copy !== "function" || typeof x.slice !== "function") {
        return false
    }

    return x <= 0 || typeof x[0] === "number"
}

// Way faster than deepEqual, as everything here is always a number
function bufferMatch(a, b) {
    if (a.length !== b.length) return false

    for (var i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false
    }

    return true
}

function isPrim(a) {
    return typeof a !== "object" && a != null
}

function isArguments(a) {
    return toString.call(a) === "[object Arguments]"
}

// Most of the time, there aren't any non-index members to check. Let's do that
// before sorting, as this is easy to test.
function keyCount(keys) {
    if (keys.length === 0) return 0

    var count = 0

    for (var i = 0; i < keys.length; i++) {
        var key = keys[i]

        if (key === "length" || /^\d+$/.test(key)) {
            count++
        }
    }

    return count
}

module.exports = function (actual, expected, type) {
    function deepEqual(a, b) {
        if (isPrim(a) && isPrim(b)) return primMatch(a, b)
        if (type === "loose") return looseMatch(a, b)
        return strictMatch(a, b)
    }

    function primMatch(a, b) {
        switch (type) {
        case "strict": return Is.strict(a, b)
        case "match": return Is.strict(a, b) || symbolMatch(a, b)
        case "loose": return Is.loose(a, b) || symbolMatch(a, b)
        default: throw new Error("unreachable")
        }
    }

    function looseMatch(a, b) {
        if (a == null) return b == null
        return b != null && objMatch(a, b)
    }

    function strictMatch(a, b) {
        if (a === null) return b === null
        if (b === null) return false
        if (a === undefined) return b === undefined
        if (b === undefined) return false
        return objMatch(a, b)
    }

    function keysMatch(a, akeys, b, bkeys) {
        // the same set of keys (although not necessarily the same order),
        akeys.sort()
        bkeys.sort()

        var i

        // cheap key test
        for (i = 0; i < akeys.length; i++) {
            if (akeys[i] !== bkeys[i]) return false
        }

        // equivalent values for every corresponding key, and possibly
        // expensive deep test
        for (i = 0; i < akeys.length; i++) {
            var key = akeys[i]

            if (!deepEqual(a[key], b[key])) return false
        }

        return true
    }

    function arrayMatch(a, b, arrayLike) {
        if (a.length !== b.length) return false

        for (var i = 0; i < a.length; i++) {
            if (!deepEqual(a[i], b[i])) return false
        }

        if (arrayLike) return true

        var akeys = Object.keys(a)
        var bkeys = Object.keys(b)

        // Same number of own properties
        if (akeys.length !== bkeys.length) return false

        // Most of the time, there aren't any non-index to check. Let's do
        // that before sorting, as this is easy to test.
        var acount = keyCount(akeys)
        var bcount = keyCount(bkeys)

        if (acount === 0 || bcount === 0) return true

        return acount === bcount && keysMatch(a, akeys, b, bkeys)
    }

    function objMatch(a, b) {
        if (typeof a !== "object" || typeof b !== "object") return false
        if (a instanceof Date && b instanceof Date) return +a === +b
        if (type === "strict") {
            // Check for an identical 'prototype' property.
            if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) {
                return false
            }
        }

        // Arguments objects are array-like
        if (isArguments(a)) return isArguments(b) && arrayMatch(a, b, true)
        if (isBuffer(a)) return isBuffer(b) && bufferMatch(a, b)

        if (Array.isArray(a)) return Array.isArray(b) && arrayMatch(a, b, false)

        var akeys = Object.keys(a)
        var bkeys = Object.keys(b)

        // Same number of own properties
        if (akeys.length !== bkeys.length) return false

        return keysMatch(a, akeys, b, bkeys)
    }

    return deepEqual(actual, expected)
}
