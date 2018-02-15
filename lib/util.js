"use strict"

var methods = require("./methods")

// Quick assert
exports.assert = function (cond) {
    if (!cond) throw new AssertFail()
}

// Quick hack to ensure there's a stack
var captureStackTrace = typeof Error.captureStackTrace === "function"
    ? Error.captureStackTrace : function (inst) {
        var e = new Error()

        e.name = inst.name
        inst.stack = exports.getStack(e)
    }

function AssertFail() {
    captureStackTrace(this, exports.assert)
}

methods(AssertFail, Error, {
    name: "Assertion failed",
})

exports.getType = function (value) {
    if (value == null) return "null"
    if (Array.isArray(value)) return "array"
    return typeof value
}

// PhantomJS, IE, and possibly Edge don't set the stack trace until the error is
// thrown. Note that this prefers an existing stack first, since non-native
// errors likely already contain this. Note that this isn't necessary in the
// CLI - that only targets Node.
exports.getStack = function (e) {
    var stack = e.stack

    if (!(e instanceof Error) || stack != null) return stack

    try {
        throw e
    } catch (e) {
        return e.stack
    }
}

exports.pcall = function (func) {
    exports.assert(typeof func === "function")
    return new Promise(function (resolve, reject) {
        return func(function (e, value) {
            return e != null ? reject(e) : resolve(value)
        })
    })
}

exports.peach = function (list, func) {
    exports.assert(Array.isArray(list))
    exports.assert(typeof func === "function")

    var len = list.length
    var p = Promise.resolve()

    for (var i = 0; i < len; i++) {
        p = p.then(func.bind(undefined, list[i], i))
    }

    return p
}

exports.ptry = function (func) {
    return new Promise(function (resolve) {
        resolve(func())
    })
}

exports.pfinally = function (p, func) {
    return p.then(
        function (v) {
            return Promise.resolve(func())
            .then(function () { return v })
        },
        function (e) {
            return Promise.resolve(func())
            .then(function () { throw e })
        }
    )
}

/**
 * A lazy accessor, complete with thrown error memoization and a decent amount
 * of optimization, since it's used in a lot of code.
 *
 * Note that this uses reference indirection and direct mutation to keep only
 * just the computation non-constant, so engines can avoid closure allocation.
 * Also, `create` is intentionally kept *out* of any closure, so it can be more
 * easily collected.
 */
exports.lazy = function (create) {
    exports.assert(typeof create === "function")

    var ref = {value: create, get: lazyInit}

    return function () {
        return ref.get()
    }
}

/** @this {Lazy} */
function lazyInit() {
    this.get = lazyRecursive

    try {
        this.value = (0, this.value)()
        this.get = lazyReturn
        return this.value
    } catch (e) {
        this.value = e
        this.get = lazyThrow
        throw this.value
    }
}

function lazyRecursive() {
    throw new TypeError("Lazy functions must not be called recursively!")
}

/** @this {Lazy} */
function lazyReturn() {
    return this.value
}

/** @this {Lazy} */
function lazyThrow() {
    throw this.value
}
