"use strict"

var Promise = require("bluebird")
var Flags = require("./flags.js")
var m = require("../messages.js")

exports.r = function (type, value/* , slow */) {
    return {type: type, value: value/* , slow: !!slow */}
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

/**
 * Engines like consistent numbers of arguments. And since reporters are
 * frequently called, this helps.
 */

exports.resolveAny = resolveAny
function resolveAny(func, inst, arg0) {
    return new Promise(function (resolve, reject) {
        var res = func.call(inst, arg0, function (err) {
            return err != null ? reject(err) : resolve()
        })

        if (isThenable(res)) return resolve(res)
        else return undefined
    })
}

exports.pathEntry = pathEntry
function pathEntry(name, index) {
    return {name: name, index: index}
}

// Uncache the path, so mutations are safe.
function clonePath(path) {
    var ret = []

    for (var i = 0; i < path.length; i++) {
        ret[i] = pathEntry(path[i].name, path[i].index)
    }

    return ret
}

function makeReport(type, path, value/* , slow */) {
    return {
        type: type,
        path: path,
        value: value,
        // slow: slow,
    }
}

exports.report = function (test, args) {
    // Reporters are allowed to block, and these are always called first.
    var blocking = []
    var concurrent = []
    var list = test.reporters

    for (var i = 0; i < list.length; i++) {
        var reporter = list[i]

        if (reporter.block) {
            blocking.push(reporter)
        } else {
            concurrent.push(reporter)
        }
    }

    function pcall(reporter) {
        return resolveAny(reporter, undefined,
            makeReport(args.type, clonePath(test.path), args.value
                /* , !!args.slow */))
    }

    return Promise.each(blocking, pcall)
    .return(concurrent)
    .map(pcall)
    .return()
}

// Note that a timeout of 0 means to inherit the parent.
exports.timeout = function (test) {
    var ctx = test

    while (ctx.timeout === 0 && !(ctx.status & Flags.Root)) {
        ctx = ctx.parent
    }

    return ctx.timeout || 2000 // ms - default timeout
}

// Note that a slowness threshold of 0 means to inherit the parent.
exports.slow = function (test) {
    var ctx = test

    while (ctx.slow === 0 && !(ctx.status & Flags.Root)) {
        ctx = ctx.parent
    }

    return ctx.slow || 75 // ms - default slow threshold
}

exports.timeoutFail = function (timeout) {
    return new Error(m("async.timeout", timeout))
}
