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

symbolToString = if typeof Symbol == 'function' and typeof Symbol! == 'symbol'
    Symbol::toString
else
    void

symbolIs = (a, b) ->
    typeof a == 'symbol' and typeof b == 'symbol' and
        (symbolToString.call a) == (symbolToString.call b)

isBuffer = (x) ->
    | not x or typeof x != 'object' or typeof x.length != 'number' => false
    | typeof x.copy != 'function' or typeof x.slice != 'function' => false
    | otherwise => x.length <= 0 or typeof x.0 == 'number'

# Way faster than deepEqual, as everything here is always a number
bufferMatch = (a, b) ->
    return false if a.length != b.length

    for i til a.length | a[i] != b[i]
        return false

    true

getProto = Object.getPrototypeOf
keys = Object.keys

isPrim = (a) -> typeof a != 'object' and typeof a != 'undefined'
isArguments = (a) -> (toString.call a) == '[object Arguments]'

any = (xs, f) ->
    for i til xs.length | f xs[i], i
        return true
    false

all = (xs, f) ->
    for i til xs.length | not f xs[i], i
        return false
    true

# Most of the time, there aren't any non-index members to check. Let's do that
# before sorting, as this is easy to test.
keyCount = (keys) ->
    return 0 if keys.length == 0
    count = 0
    for x in keys | x == 'length' or /^\d+$/.test x
        count++
    count

export deepEqual = (actual, expected, type) ->
    deepEqual = (a, b) ->
        | isPrim a and isPrim b => primMatch a, b
        | type == 'loose' => looseMatch a, b
        | otherwise => strictMatch a, b

    primMatch = (a, b) ->
        | type == 'strict' => strictIs a, b
        | type == 'match' => strictIs a, b or symbolIs a, b
        | type == 'loose' => looseIs a, b or symbolIs a, b
        | otherwise => throw new Error 'unreachable'

    looseMatch = (a, b) ->
        | not a? => not b?
        | not b? => false
        | otherwise => objMatch a, b

    strictMatch = (a, b) ->
        | a == null => b == null
        | b == null => false
        | a == void => b == void
        | b == void => false
        | otherwise => objMatch a, b

    keysMatch = (a, akeys, b, bkeys) ->
        # the same set of keys (although not necessarily the same order),
        akeys.sort!
        bkeys.sort!

        # cheap key test
        all akeys, ((key, i) -> key == bkeys[i]) and

        # equivalent values for every corresponding key, and possibly
        # expensive deep test
        all akeys, ((key) -> deepEqual a[key], b[key])

    arrayMatch = (a, b) ->
        | a.length != b.length => false
        | not all a, ((x, i) -> deepEqual x, b[i]) => false
        # Same number of own properties
        | (akeys = keys a).length != (bkeys = keys b).length => false
        | otherwise =>
            # Most of the time, there aren't any non-index to check. Let's do
            # that before sorting, as this is easy to test.
            acount = keyCount akeys
            bcount = keyCount bkeys
            acount == 0 and bcount == 0 or
            acount == bcount and keysMatch a, akeys, b, bkeys

    objMatch = (a, b) ->
        | typeof a != 'object' or typeof b != 'object' => false
        | a instanceof Date and b instanceof Date => a.getTime! == b.getTime!
        # an identical 'prototype' property.
        | type == 'strict' and (getProto a) != (getProto b) => false
        # Arguments object doesn't seem to like Object.keys. Checking it as
        # an array fixes this.
        | isArguments a => isArguments b and arrayMatch a, b
        | isBuffer a => isBuffer b and bufferMatch a, b
        # If it's an array, no point checking keys.
        | Array.isArray a => Array.isArray b and arrayMatch a, b
        # Same number of own properties
        | (akeys = keys a).length != (bkeys = keys b).length => false
        | otherwise => keysMatch a, akeys, b, bkeys

    deepEqual actual, expected
