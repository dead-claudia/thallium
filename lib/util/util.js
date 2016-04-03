"use strict"

exports.r = function (type, value) {
    return {type: type, value: value}
}

function objectLike(value) {
    return value != null &&
        (typeof value === "object" || typeof value === "function")
}

exports.isThenable = function (value) {
    return objectLike(value) && typeof value.then === "function"
}

exports.isIterator = function (value) {
    return objectLike(value) && typeof value.next === "function"
}

// Make function binding as lightweight as possible.
exports.bind = function (f, inst) {
    return function () {
        return f.apply(inst, arguments)
    }
}
