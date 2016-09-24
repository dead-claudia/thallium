"use strict"

/**
 * Deep matching algorithm for `t.match` and `t.deepEqual`, with zero
 * dependencies. Note the following:
 *
 * - This is relatively performance-tuned, although it prefers high correctness.
 *   Patch with care, since performance is a concern.
 * - This does pack a *lot* of features. There's a reason why this is so long.
 * - Some of the duplication is intentional. It's generally commented, but it's
 *   mainly for performance, since the engine needs its type info.
 * - Arguments objects aren't handled specially, mainly because they extend
 *   `Object.prototype`, all the indices are keys, and they're rarely compared
 *   to begin with.
 * - Polyfilled core-js Symbols from cross-origin contexts will never register
 *   as being actual Symbols.
 *
 * And in case you're wondering about the longer functions and occasional
 * repetition, it's because V8's inliner isn't always intelligent enough to deal
 * with the super highly polymorphic data this often deals with, and JS doesn't
 * have compile-time macros. (Also, Sweet.js isn't worth the hassle.)
 */

// Set up our own buffer check. We should always accept the polyfill, even in
// Node.
function FakeBuffer() {}
FakeBuffer.isBuffer = function () { return true }

var canUseConstructor = new FakeBuffer().constructor === FakeBuffer
var supportsGlobalBuffer = canUseConstructor &&
    typeof global.Buffer === "function" &&
    typeof global.Buffer.isBuffer === "function" &&
    // Avoid the polyfill
    !global.Buffer.isBuffer(new FakeBuffer())
var globalIsBuffer = supportsGlobalBuffer ? global.Buffer.isBuffer : undefined

function isPolyfilledFastBuffer(object) {
    var Buffer = object.constructor

    if (typeof Buffer !== "function") return false
    if (typeof Buffer.isBuffer !== "function") return false
    return Buffer.isBuffer(object)
}

function isBuffer(object) {
    if (object == null) return false
    if (supportsGlobalBuffer) {
        if (globalIsBuffer(object)) return true
    } else if (!canUseConstructor) {
        if (object._isBuffer) return true
    }

    if (isPolyfilledFastBuffer(object)) return true

    // Node v0.10 support
    if (typeof object.readFloatLE !== "function") return false
    if (typeof object.slice !== "function") return false

    var slice = object.slice(0, 0)

    return slice != null && isPolyfilledFastBuffer(slice)
}

// So NaNs are considered equal.
function floatIs(a, b) {
    return a === b || a !== a && b !== b // eslint-disable-line no-self-compare
}

var objectToString = Object.prototype.toString
var hasOwn = Object.prototype.hasOwnProperty

var supportsUnicode = hasOwn.call(RegExp.prototype, "unicode")
var supportsSticky = hasOwn.call(RegExp.prototype, "sticky")

var Symbol = global.Symbol

// core-js' symbols are objects, and some old versions of V8 erroneously had
// `typeof Symbol() === "object"`.
var symbolsAreObjects = typeof Symbol === "function" &&
    typeof Symbol() === "object"

// `mask` is a bit field, with the following bits. This is not as much for
// performance than to just reduce the number of parameters I need to be
// throwing around.
var Strict = 1
var Initial = 2
var SameProto = 4

exports.match = function (a, b) {
    return match(a, b, Initial, undefined, undefined)
}

exports.strict = function (a, b) {
    return match(a, b, Strict | Initial, undefined, undefined)
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
    if (type === "array") return Array.isArray(value)
    if (type === "null") return value === null
    return typeof value === type
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
    // `Buffer` doesn't necessarily subclass Uint8Array, unlike what recent Node
    // does.
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
function matchKey(current, akeys, start, end, mask, left, right) { // eslint-disable-line max-params, max-len
    for (var i = start + 1; i < end; i++) {
        var key = akeys[i]

        if (match(current, key, mask, left, right)) {
            // TODO: once engines actually optimize `copyWithin`, use that
            // instead. It'll be much faster than this loop.
            while (i > start) akeys[i] = akeys[--i]
            akeys[i] = key
            return true
        }
    }

    return false
}

function matchValues(a, b, akeys, bkeys, end, mask, left, right) { // eslint-disable-line max-params, max-len
    for (var i = 0; i < end; i++) {
        if (!match(a.get(akeys[i]), b.get(bkeys[i]), mask, left, right)) {
            return false
        }
    }

    return true
}

// Possibly expensive order-independent key-value match. First, try to avoid it
// by assuming everything is in order a cheap O(n) is always nicer than an
// expensive O(n^2).
function matchMap(a, b, mask, left, right) { // eslint-disable-line max-params
    var end = a.size
    var akeys = keyList(a)
    var bkeys = keyList(b)
    var start = 0

    while (start !== end &&
            match(akeys[start], bkeys[start], mask, left, right)) {
        start++
    }

    if (start === end) {
        return matchValues(a, b, akeys, bkeys, end, mask, left, right)
    }

    // Don't compare the same key twice
    if (!matchKey(bkeys[start], akeys, start, end, mask, left, right)) {
        return false
    }

    // If the above fails, while we're at it, let's sort them as we go, so
    // the key order matches.
    while (++start < end) {
        var key = bkeys[start]

        // Adapt if the keys are already in order, which is frequently the
        // case.
        if (!match(key, akeys[start], mask, left, right) &&
                !matchKey(key, akeys, start, end, mask, left, right)) {
            return false
        }
    }

    return matchValues(a, b, akeys, bkeys, end, mask, left, right)
}

function hasAllIdentical(alist, b) {
    for (var i = 0; i < alist.length; i++) {
        if (!b.has(alist[i])) return false
    }

    return true
}

// Compare the values structurally, and independent of order.
function searchFor(avalue, objects, mask, left, right) { // eslint-disable-line max-params, max-len
    for (var j in objects) {
        if (hasOwn.call(objects, j)) {
            if (match(avalue, objects[j], mask, left, right)) {
                delete objects[j]
                return true
            }
        }
    }

    return false
}

// The set algorithm is structured a little differently. It takes one of the
// sets into an array, does a cheap identity check, then does the deep check.
function matchSet(a, b, mask, left, right) { // eslint-disable-line max-params
    // This is to try to avoid an expensive structural match on the keys. Test
    // for identity first.
    var alist = keyList(a)

    if (hasAllIdentical(alist, b)) return true

    var iter = b.values()
    var count = 0
    var objects

    // Gather all the objects
    for (var next = iter.next(); !next.done; next = iter.next()) {
        var value = next.value

        if (typeof value === "object" && value !== null ||
                !(mask & Strict) && typeof value === "symbol") {
            // Create the objects map lazily. Note that this also grabs Symbols
            // when not strictly matching, since their description is compared.
            if (!count) objects = Object.create(null)
            objects[count++] = value
        }
    }

    // If none are encountered, abort.
    if (!count) return false

    // Iterate the object, removing each one remaining when matched (and
    // aborting if none can be).
    for (var i = 0; i < count; i++) {
        if (!searchFor(alist[i], objects, mask, left, right)) return false
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

function matchPrepareDescend(a, b, mask, left, right) { // eslint-disable-line max-params, max-len
    // Check for circular references after the first level, where it's
    // redundant. Note that they have to point to the same level to actually
    // be considered deeply equal.
    if (!(mask & Initial)) {
        var leftIndex = left.indexOf(a)
        var rightIndex = right.indexOf(b)

        if (leftIndex !== rightIndex) return false
        if (leftIndex >= 0) return true

        left.push(a)
        right.push(b)

        var result = matchInner(a, b, mask, left, right)

        left.pop()
        right.pop()

        return result
    } else {
        return matchInner(a, b, mask & ~Initial, [a], [b])
    }
}

function matchSameProto(a, b, mask, left, right) { // eslint-disable-line max-params, max-len
    if (symbolsAreObjects && a instanceof Symbol) {
        return !(mask & Strict) && a.toString() === b.toString()
    }

    if (isView(a)) return matchView(a, b)
    if (a instanceof RegExp) return matchRegExp(a, b)
    if (a instanceof Date) return a.valueOf() === b.valueOf()
    if (supportsArrayBuffer && a instanceof ArrayBuffer) {
        return matchViewBytes(new DataView(a), new DataView(b))
    }
    return matchPrepareDescend(a, b, mask, left, right)
}

function matchDifferentProto(a, b, mask, left, right) { // eslint-disable-line max-params, max-len
    if (symbolsAreObjects) {
        if (a instanceof Symbol || b instanceof Symbol) return false
    }
    if (mask & Strict) return false
    if (isView(a) || isView(b)) return false
    if (supportsArrayBuffer) {
        if (a instanceof ArrayBuffer || b instanceof ArrayBuffer) return false
    }
    return matchPrepareDescend(a, b, mask, left, right)
}

function match(a, b, mask, left, right) { // eslint-disable-line max-params
    if (typeof a === "boolean" && typeof b === "boolean") return a === b
    if (typeof a === "number" && typeof b === "number") return floatIs(a, b)
    if (typeof a === "string" && typeof b === "string") return a === b
    if (typeof a === "function" && typeof b === "function") return a === b
    if (typeof a === "symbol" && typeof b === "symbol") {
        return a === b || !(mask & Strict) && a.toString() === b.toString()
    }
    if (a == null) return a === b
    if (b == null) return false
    if (typeof a !== "object" || typeof b !== "object") return false
    if (a === b) return true

    // It's easy to optimize for same prototypes.
    if (Object.getPrototypeOf(a) === Object.getPrototypeOf(b)) {
        return matchSameProto(a, b, mask | SameProto, left, right)
    } else {
        return matchDifferentProto(a, b, mask, left, right)
    }
}

function matchArrayLike(a, b, mask, left, right) { // eslint-disable-line max-params, max-len
    for (var i = 0; i < a.length; i++) {
        if (!match(a[i], b[i], mask, left, right)) return false
    }

    return true
}

function matchInner(a, b, mask, left, right) { // eslint-disable-line max-statements, max-params, max-len
    var count = 0

    if (mask & SameProto) {
        if (Array.isArray(a)) {
            count = a.length
            if (count !== b.length) return false
            return !count || matchArrayLike(a, b, mask, left, right)
        }

        if (supportsMap && a instanceof Map) {
            count = a.size
            if (count !== b.size) return false
            return !count || matchMap(a, b, mask, left, right)
        }

        if (supportsSet && a instanceof Set) {
            count = a.size
            if (count !== b.size) return false
            return !count || matchSet(a, b, mask, left, right)
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

    if (objectToString.call(a) === "[object Arguments]") {
        if (objectToString.call(b) !== "[object Arguments]") return false
        count = a.length
        if (count !== b.length) return false
        return !count || matchArrayLike(a, b, mask, left, right)
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
        if (!match(a[akeys[j]], b[akeys[j]], mask, left, right)) return false
    }

    return true
}
