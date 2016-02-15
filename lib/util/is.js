"use strict"

// For better NaN handling
/* eslint-disable no-self-compare */

exports.strict = function (a, b) {
    return a === b || a !== a && b !== b
}

exports.loose = function (a, b) {
    return a == b || a != a && b != b // eslint-disable-line eqeqeq
}
