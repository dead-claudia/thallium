"use strict"

const assert = require("assert")
const Promise = require("bluebird")

exports.r = (type, value) => ({type, value})

function objectLike(value) {
    return value != null &&
        (typeof value === "object" || typeof value === "function")
}

exports.isThenable = isThenable
function isThenable(value) {
    return objectLike(value) && typeof value.then === "function"
}

exports.isIterator = value => {
    return objectLike(value) && typeof value.next === "function"
}

// Make function binding as lightweight as possible.
exports.bind = (func, inst) => {
    if (process.env.NODE_ENV === "development") {
        assert.equal(typeof func, "function")
    }

    return function () {
        return func.apply(inst, arguments)
    }
}

exports.resolveAny = function (func, inst) {
    if (process.env.NODE_ENV === "development") {
        assert.equal(typeof func, "function")
    }

    const args = []

    for (let i = 2; i < arguments.length; i++) {
        args.push(arguments[i])
    }

    return new Promise((resolve, reject) => {
        args.push(err => err != null ? reject(err) : resolve())

        const res = func.apply(inst, args)

        if (isThenable(res)) return resolve(res)
        else return undefined
    })
}

/* eslint-disable no-self-compare */
// For better NaN handling

exports.strictIs = (a, b) => a === b || a !== a && b !== b
exports.looseIs = (a, b) => a == b || a !== a && b !== b // eslint-disable-line eqeqeq, max-len
