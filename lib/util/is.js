"use strict"

/* eslint-disable no-self-compare */
// For better NaN handling

exports.strict = function (a, b) {
    return a === b || a !== a && b !== b
}

exports.loose = function (a, b) {
    return a == b || a !== a && b !== b // eslint-disable-line eqeqeq
}
