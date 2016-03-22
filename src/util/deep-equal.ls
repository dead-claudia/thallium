'use strict'

/**
 * This code is largely derived from node-deep-equal by James Halliday
 * (substack), which itself is derived from Node, but there are a few
 * differences and modifications, including the fact this requires at least an
 * ES5 shim (node-deep-equal is ES3-compatible, and Node's assert.deepEqual
 * implementation requires ES6 and internal V8 APIs), and that it is in
 * LiveScript.
 */

require! './is': {strictIs, looseIs}

symbolToString = if typeof Symbol == 'function' and typeof Symbol() == 'symbol'
    Symbol::toString
else
    void

symbolEqual = (a, b) ->
    typeof a == 'symbol' and typeof b == 'symbol' and
        (symbolToString.call a) == (symbolToString.call b)

export deepEqual = (actual, expected, strict) ->
    if typeof actual != 'object' and typeof expected != 'object'
        return if strict
            strictIs actual, expected
        else
            looseIs actual, expected or symbolEqual actual, expected

    if strict
        return expected == null if actual == null
        return false if expected == null
        return expected == void if actual == void
        return false if expected == void
    else
        return not expected? if not actual?
        return false if not expected?

    if typeof actual != 'object' or typeof expected != 'object'
        false
    else if actual instanceof Date and expected instanceof Date
        actual.getTime! == expected.getTime!
    else
        objEquiv actual, expected, strict

isBuffer = (x) ->
    | not x or typeof x != 'object' or typeof x.length != 'number' => false
    | typeof x.copy != 'function' or typeof x.slice != 'function' => false
    | otherwise => x.length <= 0 or typeof x.0 == 'number'

# Way faster than deepEqual, as everything here is always a number
checkBuffer = (a, b) ->
    return false if a.length != b.length

    for i til a.length | a[i] != b[i]
        return false

    true

keyPair = (object, keys) -> {object, keys}

checkKeys = (a, b, strict) ->
    # the same set of keys (although not necessarily the same order),
    a.keys.sort!
    b.keys.sort!

    # cheap key test
    for i til a.keys.length | a.keys[i] != b.keys[i]
        return false

    # equivalent values for every corresponding key, and possibly
    # expensive deep test
    for key in a.keys
        unless deepEqual a.object[key], b.object[key], strict
            return false

    true

checkArrayLike = (a, b, strict) ->
    return false if a.length != b.length

    for i til a.length
        unless deepEqual a[i], b[i], strict
            return false

    akeys = Object.keys a
    bkeys = Object.keys b

    # Same number of own properties
    return false if akeys.length != bkeys.length

    # Most of the time, there aren't any non-index to check. Let's do
    # that before sorting, as this is easy to test.
    acount = 0
    bcount = 0

    for i til akeys.length
        akey = akeys[i]
        bkey = bkeys[i]

        acount++ if akey == 'length' or /^\d+$/.test akey
        bcount++ if bkey == 'length' or /^\d+$/.test bkey

    acount == 0 and bcount == 0 or
        checkKeys (keyPair a, akeys), (keyPair b, bkeys), strict

objEquiv = (a, b, strict) ->
    return false unless a? and b?

    # an identical 'prototype' property.
    if strict and (Object.getPrototypeOf a) != (Object.getPrototypeOf b)
        return false

    # Arguments object doesn't seem to like Object.keys. Checking it as
    # an array fixes this.
    if (toString.call a) == '[object Arguments]'
        return (toString.call b) == '[object Arguments]' and
            checkArrayLike a, b, strict

    if isBuffer a
        return isBuffer b and checkBuffer a, b

    # If it's an array, no point checking keys.
    if Array.isArray a
        return Array.isArray b and checkArrayLike a, b, strict

    try
        akeys = Object.keys(a)
        bkeys = Object.keys(b)
    catch
        # Happens when one is a string literal and the other isn't
        return false

    # Same number of own properties
    akeys.length == bkeys.length and
        checkKeys (keyPair a, akeys), (keyPair b, bkeys), strict
