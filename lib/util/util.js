"use strict"

exports.r = function (type, index, value) {
    return {
        type: type,
        index: index,
        value: value,
    }
}

exports.isThenable = function (value) {
    return value != null &&
        (typeof value === "object" || typeof value === "function") &&
        typeof value.then === "function"
}

exports.isIterator = function (value) {
    // Note that `return` isn't checked because V8 only partially
    // supports it natively.
    return value != null &&
        (typeof value === "object" || typeof value === "function") &&
        typeof value.next === "function"
}

// For consistent NaN handling

exports.strictIs = function strictIs(a, b) {
    /* eslint-disable no-self-compare */
    return a === b || a !== a && b !== b
    /* eslint-enable no-self-compare */
}

exports.looseIs = function looseIs(a, b) {
    /* eslint-disable no-self-compare, eqeqeq */
    return a == b || a != a && b != b
    /* eslint-enable no-self-compare, eqeqeq */
}
