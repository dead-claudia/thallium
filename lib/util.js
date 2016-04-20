"use strict"

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

exports.resolveAny = function (func, inst) {
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
