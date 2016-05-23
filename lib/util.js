"use strict"

var Promise = require("bluebird")

exports.r = function (type, value, slow) {
    return {type: type, value: value, slow: !!slow}
}

exports.p = function (passing, value) {
    return {passing: passing, value: value}
}

function objectLike(value) {
    return value != null &&
        (typeof value === "object" || typeof value === "function")
}

exports.isThenable = isThenable
function isThenable(value) {
    return objectLike(value) && typeof value.then === "function"
}

exports.isIterator = function (value) {
    return objectLike(value) && typeof value.next === "function"
}

exports.resolveAny = function (func, inst) {
    var args = []

    for (var i = 2; i < arguments.length; i++) {
        args.push(arguments[i])
    }

    return new Promise(function (resolve, reject) {
        args.push(function (err) {
            return err != null ? reject(err) : resolve()
        })

        var res = func.apply(inst, args)

        if (isThenable(res)) return resolve(res)
        else return undefined
    })
}

/* eslint-disable no-self-compare */
// For better NaN handling

exports.strictIs = function (a, b) {
    return a === b || a !== a && b !== b
}

exports.looseIs = function (a, b) {
    return a == b || a !== a && b !== b // eslint-disable-line eqeqeq
}
