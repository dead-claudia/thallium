"use strict"

var fail = require("./util.js").fail

exports.ok = function (x) {
    if (!x) fail("Expected {actual} to be truthy", {actual: x})
}

exports.notOk = function (x) {
    if (x) fail("Expected {actual} to be falsy", {actual: x})
}

exports.boolean = function (x) {
    if (typeof x !== "boolean") {
        fail("Expected {actual} to be a boolean", {actual: x})
    }
}

exports.notBoolean = function (x) {
    if (typeof x === "boolean") {
        fail("Expected {actual} to not be a boolean", {actual: x})
    }
}

exports.function = function (x) {
    if (typeof x !== "function") {
        fail("Expected {actual} to be a function", {actual: x})
    }
}

exports.notFunction = function (x) {
    if (typeof x === "function") {
        fail("Expected {actual} to not be a function", {actual: x})
    }
}

exports.number = function (x) {
    if (typeof x !== "number") {
        fail("Expected {actual} to be a number", {actual: x})
    }
}

exports.notNumber = function (x) {
    if (typeof x === "number") {
        fail("Expected {actual} to not be a number", {actual: x})
    }
}

exports.object = function (x) {
    if (typeof x !== "object" || x == null) {
        fail("Expected {actual} to be an object", {actual: x})
    }
}

exports.notObject = function (x) {
    if (typeof x === "object" && x != null) {
        fail("Expected {actual} to not be an object", {actual: x})
    }
}

exports.string = function (x) {
    if (typeof x !== "string") {
        fail("Expected {actual} to be a string", {actual: x})
    }
}

exports.notString = function (x) {
    if (typeof x === "string") {
        fail("Expected {actual} to not be a string", {actual: x})
    }
}

exports.symbol = function (x) {
    if (typeof x !== "symbol") {
        fail("Expected {actual} to be a symbol", {actual: x})
    }
}

exports.notSymbol = function (x) {
    if (typeof x === "symbol") {
        fail("Expected {actual} to not be a symbol", {actual: x})
    }
}

exports.exists = function (x) {
    if (x == null) {
        fail("Expected {actual} to exist", {actual: x})
    }
}

exports.notExists = function (x) {
    if (x != null) {
        fail("Expected {actual} to not exist", {actual: x})
    }
}

exports.array = function (x) {
    if (!Array.isArray(x)) {
        fail("Expected {actual} to be an array", {actual: x})
    }
}

exports.notArray = function (x) {
    if (Array.isArray(x)) {
        fail("Expected {actual} to not be an array", {actual: x})
    }
}

exports.inherits = function (object, Type) {
    if (typeof Type !== "function") {
        throw new TypeError("`Type` must be a function")
    }

    if (!(object instanceof Type)) {
        fail("Expected {object} to be an instance of {expected}", {
            expected: Type,
            actual: object.constructor,
            object: object,
        })
    }
}

exports.notInherits = function (object, Type) {
    if (typeof Type !== "function") {
        throw new TypeError("`Type` must be a function")
    }

    if (object instanceof Type) {
        fail("Expected {object} to not be an instance of {expected}", {
            expected: Type,
            object: object,
        })
    }
}

function len(compare, message) {
    return function (object, length) {
        if (typeof length !== "number") {
            throw new TypeError("`length` must be a number")
        }

        var found = object.length

        if (!compare(+found, length)) {
            fail(message, {
                expected: length,
                actual: found,
                object: object,
            })
        }
    }
}

// Note: these always fail with NaNs.
exports.length = len(
    function (a, b) { return a === b },
    "Expected {object} to have length {expected}, but found {actual}")

exports.notLength = len(
    function (a, b) { return a !== b && a === a && b === b }, // eslint-disable-line max-len, no-self-compare
    "Expected {object} to not have length {actual}")

exports.lengthAtLeast = len(
    function (a, b) { return a >= b },
    "Expected {object} to have length at least {expected}, but found {actual}")

exports.lengthAtMost = len(
    function (a, b) { return a <= b },
    "Expected {object} to have length at most {expected}, but found {actual}")

exports.lengthAbove = len(
    function (a, b) { return a > b },
    "Expected {object} to have length above {expected}, but found {actual}")

exports.lengthBelow = len(
    function (a, b) { return a < b },
    "Expected {object} to have length below {expected}, but found {actual}")
