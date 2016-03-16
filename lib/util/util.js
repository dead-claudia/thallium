"use strict"

exports.r = function (type, value) {
    return {
        type: type,
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

// Make function binding as lightweight as possible.
exports.bind = function (f, inst) {
    return function () {
        return f.apply(inst, arguments)
    }
}
