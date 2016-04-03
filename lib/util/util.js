"use strict"

exports.r = function (type, value) {
    return {type: type, value: value}
}

function canHaveProp(value) {
    return value != null &&
        (typeof value === "object" || typeof value === "function")
}

exports.isThenable = function (value) {
    return canHaveProp(value) && typeof value.then === "function"
}

exports.isIterator = function (value) {
    return canHaveProp(value) && typeof value.next === "function"
}

// Make function binding as lightweight as possible.
exports.bind = function (f, inst) {
    return function () {
        return f.apply(inst, arguments)
    }
}
