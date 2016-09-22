"use strict"

/**
 * Deep matching algorithm for `t.match` and `t.matchStrict`. Note the
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
 *
 * And in case you're wondering about the longer functions and mass repetition,
 * it's because V8's inliner isn't intelligent enough to deal with the super
 * highly polymorphic data this often deals with, and JS doesn't have
 * compile-time macros. (Also, Sweet.js isn't worth the hassle.)
 */

var isBuffer = require("./replaced/is-buffer.js")

var isArray = Array.isArray
var getPrototypeOf = Object.getPrototypeOf
var objectProto = Object.prototype
var hasOwn = objectProto.hasOwnProperty
var objectKeys = Object.keys
var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor

var supportsUnicode = hasOwn.call(RegExp.prototype, "unicode")
var supportsSticky = hasOwn.call(RegExp.prototype, "sticky")
var supportsSymbols = typeof global.Symbol === "function" &&
    typeof global.Symbol() === "symbol"

var symbolToString = supportsSymbols
    ? global.Symbol.prototype.toString
    : undefined

var left, right

exports.match = function (a, b) {
    return matchInitial(a, b, false)
}

exports.strict = function (a, b) {
    return matchInitial(a, b, true)
}

function isCircularLeft(value) {
    return left != null && left.indexOf(value) !== -1
}

function isCircularRight(value) {
    return right != null && right.indexOf(value) !== -1
}

// Using character codes for speed (doing this for every array entry is rather
// costly for larger arrays).
function isNonIndex(str) {
    for (var i = 0; i < str.length; i++) {
        var ch = str.charCodeAt(i)|0

        if (ch < 48 /* 0 */ || ch > 57 /* 9 */) return false
    }

    return true
}

// This edits the keys in place, moving all the non-index keys to the bottom,
// and then truncates the array. The return value is the new length.
function filterNonIndex(keys) {
    var count = 0

    for (var i = 0; i < keys.length; i++) {
        if (isNonIndex(keys[i])) keys[count++] = keys[i]
    }

    keys.length = count
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

// Runtime component
var requiresProxy = false

var ignoredKeys = Object.create(null)

function matchType(value, type) {
    if (type === "null") return value === null
    if (type === "array") return isArray(value)
    return typeof value === type
}

function hasNonIgnored(object, key) {
    return hasOwn.call(object, key) &&
        !hasOwn.call(ignoredKeys, key) &&
        !isIgnored(object, key)
}

function isIgnored(object, key) {
    var desc = getOwnPropertyDescriptor(object, key)
    var test = ignoredKeys[key]

    if (test.get !== desc.get) return false
    if (test.set !== desc.set) return false
    if (matchType(desc.value, test.value)) return false
    if (test.configurable !== desc.configurable) return false
    if (test.enumerable !== desc.enumerable) return false
    if (test.writable !== desc.writable) return false
    return true
}

function getKeysStripped(object) {
    var keys = objectKeys(object)

    if (object instanceof Error) {
        var count = 0

        for (var i = 0; i < keys.length; i++) {
            if (hasNonIgnored(object, keys[i])) keys[count++] = keys[i]
        }

        keys.length = count
    }

    return keys
}

function isEmpty(object) {
    if (isArray(object)) {
        if (hasOwn.call(object, "length")) return false
        if (object.length !== 0) return false
    }

    var key

    if (requiresProxy && object instanceof Error) {
        for (key in object) {
            if (hasOwn.call(object, key)) return hasNonIgnored(object, key)
        }
    } else {
        for (key in object) {
            if (hasOwn.call(object, key)) return false
        }
    }

    return true
}

// Initialization

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

var testError = new Error()
var testErrorDescriptors = Object.create(null)

Object.keys(testError).forEach(function (key) {
    testErrorDescriptors[key] = getOwnPropertyDescriptor(testError, key)
})

try {
    throw testError
} catch (_) {
    // ignore
}

Object.keys(testError).forEach(function (key) {
    var old = testErrorDescriptors[key]
    var desc = getOwnPropertyDescriptor(testError, key)

    if (descriptorIsDifferent(old, desc)) {
        requiresProxy = true

        var type

        if (desc.value == null) type = "null"
        else if (isArray(desc.value)) type = "array"
        else type = typeof desc.value

        ignoredKeys[key] = {
            get: old != null ? old.get : undefined,
            set: old != null ? old.set : undefined,
            value: type,
            configurable: desc.configurable,
            enumerable: desc.enumerable,
            writable: desc.writable,
        }
    }
})

// Way faster, since typed array indices are always dense and contain numbers.

// Setup for `isTypedArray`
var Uint8Array = global.Uint8Array
var Uint8ClampedArray = global.Uint8ClampedArray
var Uint16Array = global.Uint16Array
var Uint32Array = global.Uint32Array
var Int8Array = global.Int8Array
var Int16Array = global.Int16Array
var Int32Array = global.Int32Array

// If typed arrays aren't supported (they weren't technically part of
// ES5, but many engines implemented Khronos' spec before ES6), then
// just fall back to generic buffer detection.
var isTypedArray = isBuffer

function getProto(Type) {
    return typeof Type === "function"
        ? Object.getPrototypeOf(Type.prototype)
        : undefined
}

function getTypedArrayConstructor() {
    var proto

    proto = getProto(Uint8Array)
    if (proto != null && proto !== Object.prototype) {
        return proto.constructor
    }

    proto = getProto(Uint8ClampedArray)
    if (proto != null && proto !== Object.prototype) {
        return proto.constructor
    }

    proto = getProto(Uint16Array)
    if (proto != null && proto !== Object.prototype) {
        return proto.constructor
    }

    proto = getProto(Uint32Array)
    if (proto != null && proto !== Object.prototype) {
        return proto.constructor
    }

    proto = getProto(Int8Array)
    if (proto != null && proto !== Object.prototype) {
        return proto.constructor
    }

    proto = getProto(Int16Array)
    if (proto != null && proto !== Object.prototype) {
        return proto.constructor
    }

    proto = getProto(Int32Array)
    if (proto != null && proto !== Object.prototype) {
        return proto.constructor
    }

    return undefined
}

var supportsKhronos =
    getProto(Uint8Array) === Object.prototype ||
    getProto(Uint8ClampedArray) === Object.prototype ||
    getProto(Uint16Array) === Object.prototype ||
    getProto(Uint32Array) === Object.prototype ||
    getProto(Int8Array) === Object.prototype ||
    getProto(Int16Array) === Object.prototype ||
    getProto(Int32Array) === Object.prototype

// Khronos' Typed Array Specification - typed arrays have no common supertype.
function isKhronosTypedArray(a) {
    return isBuffer(a) ||
        Uint8Array != null && a instanceof Uint8Array ||
        Uint8ClampedArray != null && a instanceof Uint8ClampedArray ||
        Uint16Array != null && a instanceof Uint16Array ||
        Uint32Array != null && a instanceof Uint32Array ||
        Int8Array != null && a instanceof Int8Array ||
        Int16Array != null && a instanceof Int16Array ||
        Int32Array != null && a instanceof Int32Array
}

if (supportsKhronos) {
    isTypedArray = isKhronosTypedArray
} else {
    var TypedArray = getTypedArrayConstructor()

    if (typeof TypedArray === "function") {
        if (getProto(Uint8Array) === TypedArray.prototype) {
            // ES6 typed arrays - extra check is required since only in *recent
            // Node* does Buffer subtype Uint8Array (which is not necessarily
            // the case in the browser polyfill).
            isTypedArray = function (a) {
                return isBuffer(a) || a instanceof TypedArray
            }
        } else {
            // Fall back to the Khronos version, since this implementation is
            // incomplete and possibly broken.
            isTypedArray = isKhronosTypedArray
        }
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

// The pair of arrays are aligned in a single O(n log n) operation (mod deep
// matching and rotation), adapting to O(n) when they're already aligned.
//
// Below is how entries are rotated.
var copyWithin = Array.prototype.copyWithin
var abs = Math.abs

// `copyWithin` won't be much slower than a simple loop, and can be better
// optimized by engines in the future.
function rotateCopyWithin(list, source, target) {
    var item = list[source]

    if (abs(source - target) === 1) {
        list[source] = list[target]
    } else if (source < target) {
        copyWithin.call(list, source, source + 1, target + 1)
    } else {
        copyWithin.call(list, target + 1, target, source)
    }

    list[target] = item
}

// Fall back to a simple loop.
function rotateLoopWithin(list, source, target) {
    var item = list[source]

    if (abs(source - target) === 1) {
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

var rotateWithin = typeof copyWithin === "function"
    ? rotateCopyWithin
    : rotateLoopWithin

function getMatchStart(akeys, bkeys, strict, end) {
    var start = 0

    while (start !== end && match(akeys[start], bkeys[start], strict)) {
        start++
    }

    return start
}

function matchIndexOf(akeys, key, strict, start, end) { // eslint-disable-line max-len, max-params
    while (start < end) {
        if (match(key, akeys[start], strict)) return start
        start++
    }

    // This value is impossible - the first iteration never calls this function
    // on the first match. It's better than -1, which isn't a 31-bit value that
    // V8 likes.
    return 0
}

function matchMap(a, b, strict, end) {
    // Possibly expensive structural key match - try to avoid it by checking for
    // identity and that they're all non-objects first.
    var akeys = keyList(a)
    var bkeys = keyList(b)
    var start = getMatchStart(akeys, bkeys, strict, end)

    // And while we're at it, let's sort them as we go, so the key order
    // matches.
    for (; start < end; start++) {
        var key = bkeys[start]

        // Adapt if the keys are already in order, which is frequently the case.
        if (!match(key, akeys[start], strict)) {
            var index = matchIndexOf(akeys, key, strict, start + 1, end)

            // Zero is our sentinel here.
            if (index === 0) return false
            rotateWithin(akeys, index, start)
        }
    }

    // Now, try the expensive linear check against the respective values.
    for (var i = 0; i < end; i++) {
        if (!match(a.get(akeys[i]), b.get(bkeys[i]), strict)) {
            return false
        }
    }

    return true
}

// The set algorithm is structured a little differently. It takes one of the
// sets into an array, does a cheap identity check, then does the deep check.

function matchSet(a, b, strict) { // eslint-disable-line max-statements
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
                !strict && typeof value === "symbol") {
            // Create the objects map lazily. Note that this also grabs Symbols
            // when not strictly matching, since their description is compared.
            if (count === 0) objects = Object.create(null)
            objects[count++] = value
        }
    }

    // Compare the values structurally, and independent of order.
    if (count === 0) return false

    // Iterate the object, removing each one remaining when matched (and
    // aborting if none can be).
    for (var j = 0; count !== 0; j++) {
        var found = false
        var avalue = alist[j]

        for (var k in objects) {
            if (hasOwn.call(objects, k)) {
                if (match(avalue, objects[k], strict)) {
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

function matchEmpty(a, b, strict) { // eslint-disable-line max-statements
    if (isTypedArray(a)) return isTypedArray(b)
    if (isArray(a)) return isArray(b)

    if (a instanceof Date) {
        return b instanceof Date && a.valueOf() === b.valueOf()
    }

    if (a instanceof RegExp) {
        return b instanceof RegExp && matchRegExp(a, b)
    }

    var count, result

    if (supportsMap && a instanceof Map) {
        if (!(b instanceof Map)) return false
        count = a.size
        if (count !== b.size) return false
        if (count === 0) return true

        // Check for circular references, but only if necessary
        if (isCircularLeft(a)) return isCircularRight(b)
        if (isCircularRight(b)) return false

        left.push(a)
        right.push(b)
        result = matchMap(a, b, strict, count)
        left.pop()
        right.pop()
        return result
    }

    if (supportsSet && a instanceof Set) {
        if (!(b instanceof Set)) return false
        count = a.size
        if (count !== b.size) return false
        if (count === 0) return true

        // Check for circular references, but only if necessary
        if (isCircularLeft(a)) return isCircularRight(b)
        if (isCircularRight(b)) return false

        left.push(a)
        right.push(b)
        result = matchSet(a, b, strict, count)
        left.pop()
        right.pop()
        return result
    }

    return false
}

// Exceptionally common case.
function matchObjects(a, b, strict) {
    var keys = objectKeys(a)
    var count = keys.length

    if (count !== objectKeys(b).length) return false
    if (count === 0) return false

    if (isCircularLeft(a)) return isCircularRight(b)
    if (isCircularRight(b)) return false

    // Shortcut if the properties are different.
    for (var i = 0; i < count; i++) {
        if (!hasOwn.call(b, keys[i])) return false
    }

    left.push(a)
    right.push(b)

    var result = true

    // Verify that all the keys' values matched.
    for (var j = 0; j < count; j++) {
        if (!match(a[keys[j]], b[keys[j]], strict)) {
            result = false
            break
        }
    }

    left.pop()
    right.pop()

    return result
}

function match(a, b, strict) { // eslint-disable-line max-statements
    if (typeof a === "boolean" && typeof b === "boolean") return a === b
    if (typeof a === "number" && typeof b === "number") {
        // NaNs are considered equal
        return a === b || a !== a && b !== b // eslint-disable-line no-self-compare, max-len
    }
    if (typeof a === "string" && typeof b === "string") return a === b
    if (typeof a === "function" && typeof b === "function") return a === b
    if (typeof a === "symbol" && typeof b === "symbol") {
        return a === b ||
            !strict && symbolToString.call(a) === symbolToString.call(b)
    }
    if (a == null) return a === b
    if (typeof a !== "object" || typeof b !== "object") return false
    if (a === b) return true

    var proto = getPrototypeOf(a)

    if (strict) {
        // Check for an identical 'prototype' property on objects.
        if (proto !== getPrototypeOf(b)) return false
        if (proto === objectProto) return matchObjects(a, b, strict)
        if (isEmpty(a)) return isEmpty(b) && matchEmpty(a, b, strict)
        if (a instanceof Date) {
            if (a.valueOf() !== b.valueOf()) return false
        } else if (a instanceof RegExp) {
            if (!matchRegExp(a, b)) return false
        }
    } else if (isEmpty(a)) {
        return isEmpty(b) && matchEmpty(a, b, strict)
    } else if (proto === objectProto && getPrototypeOf(b) === objectProto) {
        return matchObjects(a, b, strict)
    } else if (a instanceof Date) {
        if (b instanceof Date && a.valueOf() !== b.valueOf()) return false
    } else if (a instanceof RegExp) {
        if (b instanceof RegExp && !matchRegExp(a, b)) return false
    }

    // Check for circular references
    if (isCircularLeft(a)) return isCircularRight(b)
    if (isCircularRight(b)) return false

    left.push(a)
    right.push(b)

    var result = matchInner(a, b, strict)

    left.pop()
    right.pop()

    return result
}

function matchInnerTypedArray(a, b) {
    var count = a.length

    if (count !== b.length) return undefined
    for (var i = 0; i < count; i++) {
        if (a[i] !== b[i]) return undefined
    }
    var keys = objectKeys(a)

    if (keys.length !== objectKeys(b).length) return undefined
    filterNonIndex(keys)
    return keys
}

function matchInnerArray(a, b, strict) {
    var count = a.length

    if (count !== b.length) return undefined
    for (var i = 0; i < count; i++) {
        if (!match(a[i], b[i], strict)) return undefined
    }
    var keys = objectKeys(a)

    if (keys.length !== objectKeys(b).length) return undefined
    filterNonIndex(keys)
    return keys
}

function matchInnerMap(a, b, strict) {
    var count = a.size

    if (count !== b.size) return undefined
    if (count !== 0 && !matchMap(a, b, strict, count)) return undefined
    var keys = objectKeys(a)

    if (keys.length !== objectKeys(b).length) return undefined
    return keys
}

function matchInnerSet(a, b, strict) {
    var count = a.size

    if (count !== b.size) return undefined
    if (count !== 0 && !matchSet(a, b, strict)) return undefined
    var keys = objectKeys(a)

    if (keys.length !== objectKeys(b).length) return undefined
    return keys
}

function matchInnerKeys(a, b, strict) {
    if (isTypedArray(a)) {
        return strict || isTypedArray(b)
            ? matchInnerTypedArray(a, b)
            : undefined
    }
    if (!strict && isTypedArray(b)) return undefined

    if (isArray(a)) {
        return strict || isArray(b)
            ? matchInnerArray(a, b, strict)
            : undefined
    }
    if (!strict && isArray(b)) return undefined

    if (supportsMap) {
        if (a instanceof Map) {
            return strict || b instanceof Map
                ? matchInnerMap(a, b, strict)
                : undefined
        }
        if (!strict && b instanceof Map) return undefined
    }

    if (supportsSet) {
        if (a instanceof Set) {
            return strict || b instanceof Set
                ? matchInnerSet(a, b, strict)
                : undefined
        }
        if (!strict && b instanceof Set) return undefined
    }

    var keys = requiresProxy && a instanceof Error
        ? getKeysStripped(a)
        : objectKeys(a)

    if (requiresProxy && b instanceof Error) {
        if (keys.length !== getKeysStripped(b).length) return undefined
    } else if (keys.length !== objectKeys(b).length) {
        return undefined
    }

    return keys
}

function matchInner(a, b, strict) {
    var keys = matchInnerKeys(a, b, strict)

    // Shortcut if there's nothing to match
    if (keys === undefined || keys.length === 0) return false

    // Shortcut if the properties are different.
    for (var i = 0; i < keys.length; i++) {
        if (!hasOwn.call(b, keys[i])) return false
    }

    // Verify that all the keys' values matched.
    for (var j = 0; j < keys.length; j++) {
        if (!match(a[keys[j]], b[keys[j]], strict)) return false
    }

    return true
}

// Avoid the try-catch and an allocation by optimizing the first test.
function matchEmptyInitial(a, b, strict) { // eslint-disable-line max-statements
    if (isTypedArray(a)) return isTypedArray(b)
    if (isArray(a)) return isArray(b)

    if (a instanceof Date) {
        return b instanceof Date && a.valueOf() === b.valueOf()
    }

    if (a instanceof RegExp) {
        return b instanceof RegExp && matchRegExp(a, b)
    }

    var count = 0
    var result = false

    if (supportsMap && a instanceof Map) {
        if (!(b instanceof Map)) return false
        count = a.size

        if (count !== b.size) return false
        if (count === 0) return true

        left = [a]
        right = [b]
        result = matchMap(a, b, strict, count)
        left = right = undefined
        return result
    }

    if (supportsSet && a instanceof Set) {
        if (!(b instanceof Set)) return false
        count = a.size

        if (count !== b.size) return false
        if (count === 0) return true

        left = [a]
        right = [b]
        result = matchSet(a, b, strict)
        left = right = undefined
        return result
    }

    return false
}

function matchInitialKeys(a, b, strict, keys, count) { // eslint-disable-line max-len, max-params
    // Verify that all the keys' values matched.
    for (var j = 0; j < count; j++) {
        if (!match(a[keys[j]], b[keys[j]], strict)) return false
    }

    return true
}

function matchObjectsInitial(a, b, strict) {
    var keys = objectKeys(a)
    var count = keys.length

    if (count !== objectKeys(b).length) return false
    if (count === 0) return true

    // Shortcut if the properties are different.
    for (var i = 0; i < count; i++) {
        if (!hasOwn.call(b, keys[i])) return false
    }

    left = [a]
    right = [b]
    var result = matchInitialKeys(a, b, strict, keys, count)

    left = right = undefined
    return result
}

function matchInitial(a, b, strict) { // eslint-disable-line max-statements
    if (typeof a === "boolean" && typeof b === "boolean") return a === b
    if (typeof a === "number" && typeof b === "number") {
        // NaNs are considered equal
        return a === b || a !== a && b !== b // eslint-disable-line no-self-compare, max-len
    }
    if (typeof a === "string" && typeof b === "string") return a === b
    if (typeof a === "function" && typeof b === "function") return a === b
    if (typeof a === "symbol" && typeof b === "symbol") {
        return a === b ||
            !strict && symbolToString.call(a) === symbolToString.call(b)
    }
    if (a == null) return a === b
    if (typeof a !== "object" || typeof b !== "object") return false
    if (a === b) return true

    var proto = getPrototypeOf(a)

    if (strict) {
        // Check for an identical 'prototype' property on objeccts.
        if (proto !== getPrototypeOf(b)) return false
        if (proto === objectProto) return matchObjectsInitial(a, b, true)
        if (isEmpty(a)) return isEmpty(b) && matchEmptyInitial(a, b, strict)
        if (a instanceof Date) {
            if (a.valueOf() !== b.valueOf()) return false
        } else if (a instanceof RegExp) {
            if (!matchRegExp(a, b)) return false
        }
    } else if (isEmpty(a)) {
        return isEmpty(b) && matchEmptyInitial(a, b, strict)
    } else if (proto === objectProto && getPrototypeOf(b) === objectProto) {
        return matchObjectsInitial(a, b, false)
    } else if (a instanceof Date) {
        if (b instanceof Date && a.valueOf() !== b.valueOf()) return false
    } else if (a instanceof RegExp) {
        if (b instanceof RegExp && !matchRegExp(a, b)) return false
    }

    left = [a]
    right = [b]
    var result = matchInner(a, b, strict)

    left = right = undefined
    return result
}
