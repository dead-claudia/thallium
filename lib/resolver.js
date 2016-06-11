"use strict"

var Promise = require("bluebird")

function isObjectLike(value) {
    return value != null &&
        (typeof value === "object" || typeof value === "function")
}

exports.isIterator = function (value) {
    return isObjectLike(value) && typeof value.next === "function"
}

exports.isThenable = isThenable
function isThenable(value) {
    return isObjectLike(value) && typeof value.then === "function"
}

function resolveAny(init) {
    return new Promise(function (resolve, reject) {
        var res = init(function (err) {
            return err != null ? reject(err) : resolve()
        })

        if (isThenable(res)) return resolve(res)
        else return undefined
    })
}

/**
 * Engines like consistent numbers of arguments. And since reporters are
 * frequently called, and reporters frequently write things (even the default
 * reporter hooks use this), this helps.
 */

exports.resolve1 = function (func, inst, arg0) {
    return resolveAny(function (callback) {
        return func.call(inst, arg0, callback)
    })
}

exports.resolve0 = function (func, inst) {
    return resolveAny(function (callback) {
        return func.call(inst, callback)
    })
}
