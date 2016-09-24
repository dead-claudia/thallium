"use strict"

/**
 * Deep matching algorithm for `t.match` and `t.deepEqual`. Note the
 * following:
 *
 * - This is relatively performance-tuned, although it prefers high correctness.
 *   Patch with care, since performance is a concern.
 * - This does pack a *lot* of features. There's a reason why this is almost 800
 *   lines long.
 * - Some of the duplication is intentional. It's generally commented, but it's
 *   mainly for performance, since the engine needs its type info.
 * - Arguments objects aren't handled specially, mainly because they extend
 *   `Object.prototype`, all the indices are keys, and they're rarely compared
 *   to begin with.
 * - Polyfilled core-js Symbols from cross-origin contexts will never register
 *   as being actual Symbols.
 *
 * And in case you're wondering about the longer functions and mass repetition,
 * it's because V8's inliner isn't intelligent enough to deal with the super
 * highly polymorphic data this often deals with, and JS doesn't have
 * compile-time macros. (Also, Sweet.js isn't worth the hassle.)
 */

var isBuffer = require("./replaced/is-buffer.js")

// So NaNs are considered equal.
function floatIs(a, b) {
    return a === b || a !== a && b !== b // eslint-disable-line no-self-compare
}

var objectToString = Object.prototype.toString
var hasOwn = Object.prototype.hasOwnProperty

var supportsUnicode = hasOwn.call(RegExp.prototype, "unicode")
var supportsSticky = hasOwn.call(RegExp.prototype, "sticky")

var Symbol = global.Symbol

var supportsRealSymbol = typeof Symbol === "function" &&
    typeof Symbol() === "symbol"

// core-js' symbols are objects, and some old versions of V8 erroneously had
// `typeof Symbol() === "object"`.
var symbolsAreObjects = typeof Symbol === "function" &&
    typeof Symbol() === "object"

// Accept core-js's almost-correct polyfill
var supportsIterator = typeof Symbol === "function" && Symbol.iterator != null
var symbolIterator = supportsIterator ? Symbol.iterator : undefined

var Bits = Object.freeze({
    Strict: 1,
    Initial: 2,
    SameProto: 4,
})

var left = []
var right = []

// The try-finally clauses are to prevent a memory leak in case an error occurs
// (which would also corrupt the contents, leaving junk for the next call).
exports.match = function (a, b) {
    return match(a, b, Bits.Initial)
}

exports.strict = function (a, b) {
    return match(a, b, Bits.Strict | Bits.Initial)
}

// Feature-test delayed stack additions and extra keys. PhantomJS and IE both
// wait until the error was actually thrown first, and assign them as own
// properties, which is unhelpful for assertions. This returns a function to
// speed up cases where `Object.keys` is sufficient (e.g. in Chrome/FF/Node).
//
// This wouldn't be necessary if those engines would make the stack a getter,
// and record it when the error was created, not when it was thrown. It
// specifically filters out errors and only checks existing descriptors, just to
// keep the mess from affecting everything (it's not fully correct, but it's
// necessary).

// Runtime component.
var requiresProxy = false
var ignoredKeys = Object.create(null)

function matchType(type, value) {
    switch (type) {
    case "array": return Array.isArray(value)
    case "boolean": return typeof value === "boolean"
    case "null": return value === null
    case "number": return typeof value === "number"
    case "string": return typeof value === "string"
    case "symbol": return typeof value === "symbol"
    case "function": return typeof value === "function"
    case "undefined": return typeof value === "undefined"
    case "object": return typeof value === "object"
    default: throw new TypeError("Unknown type: " + type)
    }
}

// Note that this will likely be rarely invoked.
function isIgnored(object, key) {
    var test = ignoredKeys[key]
    var desc

    if (test.isValue) {
        if (matchType(test.type, object[key])) return false
        desc = Object.getOwnPropertyDescriptor(object, key)
    } else {
        desc = Object.getOwnPropertyDescriptor(object, key)
        if (test.get !== desc.get) return false
        if (test.set !== desc.set) return false
    }

    if (test.configurable !== desc.configurable) return false
    if (test.enumerable !== desc.enumerable) return false
    if (test.writable !== desc.writable) return false
    return true
}

// This is only invoked with errors, so it's not going to present a significant
// slow down.
function getKeysStripped(object) {
    var keys = Object.keys(object)

    if (object instanceof Error) {
        var count = 0

        for (var i = 0; i < keys.length; i++) {
            if (!hasOwn.call(ignoredKeys, keys[i]) ||
                    !isIgnored(object, keys[i])) {
                keys[count++] = keys[i]
            }
        }

        keys.length = count
    }

    return keys
}

// Initialization

function descriptorIsDifferent(old, desc) {
    if (old === undefined) return true
    if (desc.configurable !== old.configurable) return true
    if (desc.enumerable !== old.enumerable) return true
    if (desc.writable !== old.writable) return true
    if (hasOwn.call(desc, "value")) {
        if (!hasOwn.call(old, "value")) return true
        if (desc.value !== old.value) return true
    } else {
        if (hasOwn.call(old, "value")) return true
        if (desc.get !== old.get) return true
        if (desc.set !== old.set) return true
    }
    return false
}

var testError = new Error()
var testErrorDescriptors = Object.create(null)

Object.keys(testError).forEach(function (key) {
    testErrorDescriptors[key] = Object.getOwnPropertyDescriptor(testError, key)
})

try {
    throw testError
} catch (_) {
    // ignore
}

Object.keys(testError).forEach(function (key) {
    var old = testErrorDescriptors[key]
    var desc = Object.getOwnPropertyDescriptor(testError, key)

    if (descriptorIsDifferent(old, desc)) {
        requiresProxy = true

        if (hasOwn.call(desc, "value")) {
            var type

            if (desc.value == null) type = "null"
            else if (Array.isArray(desc.value)) type = "array"
            else type = typeof desc.value

            ignoredKeys[key] = {
                isValue: true,
                type: type,
                configurable: desc.configurable,
                enumerable: desc.enumerable,
                writable: desc.writable,
            }
        } else {
            ignoredKeys[key] = {
                isValue: false,
                get: desc.get,
                set: desc.set,
                configurable: desc.configurable,
                enumerable: desc.enumerable,
            }
        }
    }
})

// Way faster, since typed array indices are always dense and contain numbers.

// Setup for `isView`
var Float32Array = global.Float32Array
var Float64Array = global.Float64Array
var DataView = global.DataView
var ArrayBuffer = global.ArrayBuffer
var supportsFloatArray = typeof Float32Array === "function" ||
    typeof Float64Array === "function"
var supportsArrayBuffer = typeof ArrayBuffer === "function" &&
    typeof DataView === "function" &&
    typeof ArrayBuffer.isView === "function"

// If typed arrays aren't supported (they weren't technically part of
// ES5, but many engines implemented Khronos' spec before ES6), then
// just fall back to generic buffer detection.
var isView = isBuffer
var matchView = matchViewIndexed
var isBufferView

function matchViewIndexed(a, b) {
    var count = a.length

    if (count !== b.length) return false
    if (!count) return true

    for (var i = 0; i < count; i++) {
        if (!floatIs(a[i], b[i])) return false
    }

    return true
}

function matchViewBytes(a, b) {
    // Node 0.12: Buffer is an exotic custom array object, not a typed array.
    if (!isBufferView(a)) return matchViewIndexed(a, b)

    // Two floating point numbers can be equal despite being represented with
    // different bytes.
    if (supportsFloatArray &&
            (a instanceof Float32Array || a instanceof Float64Array)) {
        return matchViewIndexed(a, b)
    }

    var count = a.byteLength

    if (count !== b.byteLength) return false
    if (!count) return true

    var aview = a instanceof DataView
        ? a
        : new DataView(a.buffer, a.byteOffset, count)

    var bview = b instanceof DataView
        ? b
        : new DataView(b.buffer, b.byteOffset, count)

    for (var i = 0; i < count; i++) {
        if (aview.getUint8(i) !== bview.getUint8(i)) return false
    }

    return true
}

if (supportsArrayBuffer) {
    isBufferView = ArrayBuffer.isView
    matchView = matchViewBytes
    // ES6 typed arrays - extra check is required since the browser polyfill for
    // `Buffer` doesn't necessarily subclass Uint8Array like recent Node does.
    isView = function (a) {
        return isBuffer(a) || isBufferView(a)
    }
}

// Support checking maps and sets deeply. They are object-like enough to count,
// and are useful in their own right. The code is rather messy, but mainly to
// keep the order-independent checking from becoming insanely slow.
var Map = global.Map
var Set = global.Set
var supportsMap = typeof Map === "function"
var supportsSet = typeof Set === "function"

// One of the sets and both maps' keys are converted to arrays for faster
// handling.
function keyList(map) {
    var list = new Array(map.size)
    var i = 0
    var iter = map.keys()

    for (var next = iter.next(); !next.done; next = iter.next()) {
        list[i++] = next.value
    }

    return list
}

// The pair of arrays are aligned in a single O(n^2) operation (mod deep
// matching and rotation), adapting to O(n) when they're already aligned.
//
// Below is how entries are rotated.
//
// TODO: once engines actually optimize `copyWithin`, use that instead. It'll be
// much faster than this naïve loop.
function rotateWithin(list, source, target) {
    var item = list[source]

    if (Math.abs(source - target) === 1) {
        list[source] = list[target]
    } else if (source < target) {
        while (source < target) {
            list[source] = list[source + 1]
            source++
        }
    } else {
        while (source > target) {
            list[source] = list[source - 1]
            source--
        }
    }

    list[target] = item
}

// Possibly expensive order-independent key-value match. First, try to avoid it
// by assuming everything is in order a cheap O(n) is always nicer than an
// expensive O(n^2).
function matchMap(a, b, mask) {
    var end = a.size
    var akeys = keyList(a)
    var bkeys = keyList(b)
    var start = 0

    while (start !== end && match(akeys[start], bkeys[start], mask)) {
        start++
    }

    // If the above fails, while we're at it, let's sort them as we go, so the
    // key order matches.
    for (var hit = false; start < end; start++) {
        var key = bkeys[start]

        // Adapt if the keys are already in order, which is frequently the case.
        // Also, don't compare the first pair twice (hence the `!hit`).
        if (!hit || !match(key, akeys[start], mask)) {
            var index = start

            while (++index < end) {
                if (match(key, akeys[index], mask)) break
            }

            if (index === start) return false
            rotateWithin(akeys, index, start)
        }

        hit = true
    }

    // Now, try the expensive linear check against the respective values.
    for (var i = 0; i < end; i++) {
        if (!match(a.get(akeys[i]), b.get(bkeys[i]), mask)) {
            return false
        }
    }

    return true
}

// The set algorithm is structured a little differently. It takes one of the
// sets into an array, does a cheap identity check, then does the deep check.
function matchSet(a, b, mask) { // eslint-disable-line max-statements
    // This is to try to avoid an expensive structural match on the keys. Test
    // for identity first.
    var alist = keyList(a)
    var missed = false

    for (var i = 0; i < alist.length; i++) {
        if (!b.has(alist[i])) {
            missed = true
            break
        }
    }

    if (!missed) return true

    // Gather all the objects, and if none are encountered, abort.
    var iter = b.values()
    var count = 0
    var objects

    for (var next = iter.next(); !next.done; next = iter.next()) {
        var value = next.value

        if (typeof value === "object" && value !== null ||
                !(mask & Bits.Strict) && typeof value === "symbol") {
            // Create the objects map lazily. Note that this also grabs Symbols
            // when not strictly matching, since their description is compared.
            if (!count) objects = Object.create(null)
            objects[count++] = value
        }
    }

    // Compare the values structurally, and independent of order.
    if (!count) return false

    // Iterate the object, removing each one remaining when matched (and
    // aborting if none can be).
    for (var j = 0; count; j++) {
        var found = false
        var avalue = alist[j]

        for (var k in objects) {
            if (hasOwn.call(objects, k)) {
                if (match(avalue, objects[k], mask)) {
                    delete objects[k]
                    count--
                    found = true
                    break
                }
            }
        }

        if (!found) return false
    }

    return true
}

function matchRegExp(a, b) {
    if (a.source !== b.source) return false
    if (a.global !== b.global) return false
    if (a.ignoreCase !== b.ignoreCase) return false
    if (a.multiline !== b.multiline) return false
    if (supportsUnicode && a.unicode !== b.unicode) return false
    if (supportsSticky && a.sticky !== b.sticky) return false
    return true
}

// Accept the naïve "@@iterator" protocol, too, but only if `Symbol.iterator`
// doesn't exist.
function isIterable(object) {
    return supportsIterator
        ? typeof object[symbolIterator] === "function"
        : typeof object["@@iterator"] === "function"
}

function isOrdinaryIterable(object) {
    return isIterable(object) &&
        !Array.isArray(object) &&
        !isView(object) &&
        objectToString.call(object) !== "[object Arguments]"
}

function matchIterBody(aiter, biter, mask) {
    var anext = aiter.next()
    var bnext = biter.next()

    while (!anext.done && !bnext.done) {
        if (!match(anext.value, bnext.value, mask)) {
            return false
        }

        anext = aiter.next()
        bnext = biter.next()
    }

    return anext.done && bnext.done
}

function matchIter(aiter, biter, mask) { // eslint-disable-line consistent-return, max-len
    var thrown = false
    var err

    try {
        return matchIterBody(aiter, biter, mask)
    } catch (e) {
        thrown = true
        err = e
    } finally {
        try {
            if (typeof aiter.return === "function") aiter.return()
        } finally {
            try {
                if (typeof biter.return === "function") biter.return()
            } finally {
                if (thrown) throw err
            }
        }
    }
}

function matchIterFunc(a, b, mask) {
    if (mask & Bits.Strict &&
            Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) {
        return false
    }

    // Check for circular references, but not at the first level where it's
    // redundant. Note that they have to point to the same level to actually
    // be considered deeply equal.
    if (!(mask & Bits.Initial)) {
        var leftIndex = left.indexOf(a)
        var rightIndex = right.indexOf(b)

        if (leftIndex !== rightIndex) return false
        if (leftIndex >= 0) return true
    }

    left.push(a)
    right.push(b)
    mask &= ~Bits.Initial

    var result = supportsIterator
        ? matchIter(a[symbolIterator](), b[symbolIterator](), mask)
        : matchIter(a["@@iterator"](), b["@@iterator"](), mask)

    left.pop()
    right.pop()

    return result
}

function tryMatchIterFunc(a, b, mask) {
    try {
        return matchIterFunc(a, b, mask)
    } finally {
        left.length = right.length = 0
    }
}

function maybeMatchFuncObject(a, b, mask) {
    return isOrdinaryIterable(a, mask) && isIterable(b) && (
        mask & Bits.Initial
            ? tryMatchIterFunc(a, b, mask)
            : matchIterFunc(a, b, mask)
    )
}

function maybeMatchFuncFunc(a, b, mask) {
    return isIterable(a) && isIterable(b) && (
        mask & Bits.Initial
            ? tryMatchIterFunc(a, b, mask)
            : matchIterFunc(a, b, mask)
    )
}

function match(a, b, mask) { // eslint-disable-line max-statements
    if (typeof a === "boolean" && typeof b === "boolean") return a === b
    if (typeof a === "number" && typeof b === "number") return floatIs(a, b)
    if (typeof a === "string" && typeof b === "string") return a === b
    if (typeof a === "function" && typeof b === "function") {
        return a === b || maybeMatchFuncFunc(a, b, mask)
    }
    if (a == null) return a === b
    if (b == null) return false
    if (typeof a === "object") {
        if (typeof b === "function") return maybeMatchFuncObject(a, b, mask)
        if (typeof b !== "object") return false
        if (a === b) return true
    } else if (typeof b === "object" && typeof a === "function") {
        return maybeMatchFuncObject(b, a, mask)
    } else {
        if (supportsRealSymbol &&
                typeof a === "symbol" && typeof b === "symbol") {
            return a === b ||
                !(mask & Bits.Strict) && a.toString() === b.toString()
        }
        return false
    }

    var sameProto = Object.getPrototypeOf(a) === Object.getPrototypeOf(b)

    // Check for an identical 'prototype' property on objects.
    if (sameProto) {
        if (symbolsAreObjects && a instanceof Symbol) {
            return !(mask & Bits.Strict) && a.toString() === b.toString()
        }

        if (isView(a)) return matchView(a, b)
        if (a instanceof RegExp) return matchRegExp(a, b)
        if (a instanceof Date) return a.valueOf() === b.valueOf()
        if (supportsArrayBuffer && a instanceof ArrayBuffer) {
            return matchViewBytes(new DataView(a), new DataView(b))
        }
        mask |= Bits.SameProto
    } else {
        if (symbolsAreObjects) {
            if (a instanceof Symbol || b instanceof Symbol) return false
        }
        if (mask & Bits.Strict) return false
        if (isView(a) || isView(b)) return false
        if (supportsArrayBuffer &&
                (a instanceof ArrayBuffer || b instanceof ArrayBuffer)) {
            return false
        }
    }

    var result = false

    // Check for circular references, but not at the first level where it's
    // redundant. Note that they have to point to the same level to actually be
    // considered deeply equal.
    if (mask & Bits.Initial) {
        left.push(a)
        right.push(b)
        result = tryMatchInner(a, b, mask & ~Bits.Initial)
    } else {
        var leftIndex = left.indexOf(a)
        var rightIndex = right.indexOf(b)

        if (leftIndex !== rightIndex) return false
        if (leftIndex >= 0) return true

        left.push(a)
        right.push(b)
        result = matchInner(a, b, mask)
    }

    left.pop()
    right.pop()
    return result
}

function matchArrayLike(a, b, mask) {
    for (var i = 0; i < a.length; i++) {
        if (!match(a[i], b[i], mask)) return false
    }

    return true
}

function tryMatchInner(a, b, mask) {
    try {
        return matchInner(a, b, mask)
    } finally {
        left.length = right.length = 0
    }
}

function matchInner(a, b, mask) { // eslint-disable-line max-statements
    var count = 0

    if (mask & Bits.SameProto) {
        if (Array.isArray(a)) {
            count = a.length
            if (count !== b.length) return false
            return !count || matchArrayLike(a, b, mask)
        }

        if (supportsMap && a instanceof Map) {
            count = a.size
            return count === b.size && (!count || matchMap(a, b, mask))
        }

        if (supportsSet && a instanceof Set) {
            count = a.size
            return count === b.size && (!count || matchSet(a, b, mask))
        }
    } else {
        if (Array.isArray(a) || Array.isArray(b)) return false
        if (supportsMap && (a instanceof Map || b instanceof Map)) {
            return false
        }
        if (supportsSet && (a instanceof Set || b instanceof Set)) {
            return false
        }
    }

    if (isIterable(a)) {
        if (!isIterable(b)) return false
        if (supportsIterator) {
            return matchIter(a[symbolIterator](), b[symbolIterator](), mask)
        } else {
            return matchIter(a["@@iterator"](), b["@@iterator"](), mask)
        }
    }
    if (isIterable(b)) return false

    if (objectToString.call(a) === "[object Arguments]") {
        if (objectToString.call(b) !== "[object Arguments]") return false
        count = a.length
        return count === b.length && (!count || matchArrayLike(a, b, mask))
    }
    if (objectToString.call(b) === "[object Arguments]") return false

    var akeys = requiresProxy && a instanceof Error
        ? getKeysStripped(a)
        : Object.keys(a)

    var bkeys = requiresProxy && b instanceof Error
        ? getKeysStripped(b)
        : Object.keys(b)

    count = akeys.length
    if (count !== bkeys.length) return false

    // Shortcut if there's nothing to match
    if (!count) return true

    // Shortcut if the properties are different.
    for (var i = 0; i < count; i++) {
        if (!hasOwn.call(b, akeys[i])) return false
    }

    // Verify that all the akeys' values matched.
    for (var j = 0; j < count; j++) {
        if (!match(a[akeys[j]], b[akeys[j]], mask)) return false
    }

    return true
}
