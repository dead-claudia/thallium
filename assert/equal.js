"use strict"

var match = require("../match.js")
var Util = require("./util.js")

function binary(numeric, comparator, message) {
    return function (actual, expected) {
        if (numeric) {
            if (typeof actual !== "number") {
                throw new TypeError("`actual` must be a number")
            }

            if (typeof expected !== "number") {
                throw new TypeError("`expected` must be a number")
            }
        }

        if (!comparator(actual, expected)) {
            Util.fail(message, {actual: actual, expected: expected})
        }
    }
}

exports.equal = binary(false,
    function (a, b) { return Util.strictIs(a, b) },
    "Expected {actual} to equal {expected}")

exports.notEqual = binary(false,
    function (a, b) { return !Util.strictIs(a, b) },
    "Expected {actual} to not equal {expected}")

exports.equalLoose = binary(false,
    function (a, b) { return Util.looseIs(a, b) },
    "Expected {actual} to loosely equal {expected}")

exports.notEqualLoose = binary(false,
    function (a, b) { return !Util.looseIs(a, b) },
    "Expected {actual} to not loosely equal {expected}")

exports.atLeast = binary(true,
    function (a, b) { return a >= b },
    "Expected {actual} to be at least {expected}")

exports.atMost = binary(true,
    function (a, b) { return a <= b },
    "Expected {actual} to be at most {expected}")

exports.above = binary(true,
    function (a, b) { return a > b },
    "Expected {actual} to be above {expected}")

exports.below = binary(true,
    function (a, b) { return a < b },
    "Expected {actual} to be below {expected}")

exports.between = function (actual, lower, upper) {
    if (typeof actual !== "number") {
        throw new TypeError("`actual` must be a number")
    }

    if (typeof lower !== "number") {
        throw new TypeError("`lower` must be a number")
    }

    if (typeof upper !== "number") {
        throw new TypeError("`upper` must be a number")
    }

    // The negation is to address NaNs as well, without writing a ton of special
    // case boilerplate
    if (!(actual >= lower && actual <= upper)) {
        Util.fail("Expected {actual} to be between {lower} and {upper}", {
            actual: actual,
            lower: lower,
            upper: upper,
        })
    }
}

exports.deepEqual = binary(false,
    function (a, b) { return match.strict(a, b) },
    "Expected {actual} to deeply equal {expected}")

exports.notDeepEqual = binary(false,
    function (a, b) { return !match.strict(a, b) },
    "Expected {actual} to not deeply equal {expected}")

exports.match = binary(false,
    function (a, b) { return match.match(a, b) },
    "Expected {actual} to match {expected}")

exports.notMatch = binary(false,
    function (a, b) { return !match.match(a, b) },
    "Expected {actual} to not match {expected}")

// Note: these two always fail when dealing with NaNs.
exports.closeTo = function (actual, expected, delta) {
    if (typeof actual !== "number") {
        throw new TypeError("`actual` must be a number")
    }

    if (typeof expected !== "number") {
        throw new TypeError("`expected` must be a number")
    }

    if (typeof delta !== "number") {
        throw new TypeError("`delta` must be a number")
    }

    // The negation is to address NaNs as well, without writing a ton of special
    // case boilerplate
    if (!(Math.abs(actual - expected) <= Math.abs(delta))) {
        Util.fail("Expected {actual} to be within {delta} of {expected}", {
            actual: actual,
            expected: expected,
            delta: delta,
        })
    }
}

exports.notCloseTo = function (actual, expected, delta) {
    if (typeof actual !== "number") {
        throw new TypeError("`actual` must be a number")
    }

    if (typeof expected !== "number") {
        throw new TypeError("`expected` must be a number")
    }

    if (typeof delta !== "number") {
        throw new TypeError("`delta` must be a number")
    }

    // The negation is to address NaNs as well, without writing a ton of special
    // case boilerplate
    if (!(Math.abs(actual - expected) > Math.abs(delta))) {
        Util.fail("Expected {actual} to not be within {delta} of {expected}", {
            actual: actual,
            expected: expected,
            delta: delta,
        })
    }
}
