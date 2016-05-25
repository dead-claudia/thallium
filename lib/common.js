"use strict"

var Promise = require("bluebird")

/**
 * The messages for everything, including the CLI.
 */

/* eslint-disable max-len */

var Messages = Object.freeze({
    "async.timeout": "Timeout of {0} reached",
    "fail.checkInit": "It is only safe to call test methods during initialization",
    "missing.cli.argument": "Option was passed without a required argument: {0}",
    "missing.cli.shorthand": "Shorthand option -{0} requires a value immediately after it",
    "missing.inline.body.0": "WARNING: inline test defined without body. Did you mean to use `t.testSkip()`?",
    "missing.inline.body.1": "WARNING: {0}",
    "missing.wrap.callback": "Expected t.{0} to already be a function",
    "run.concurrent": "Can't run the same test concurrently",
    "syntax.cli.register": "Invalid syntax for --register value: {0}",
    "type.any.callback": "Expected callback to be a function",
    "type.async.callback": "Expected callback to be a function or generator",
    "type.define.callback": "Expected body of t.{0} to be a function",
    "type.define.return": "Expected result for t.{0} to be an object",
    "type.iterate.next": "Iterator next() must return an object",
    "type.iterate.throw": "Iterator throw() must return an object",
    "type.only.index": "Expected argument {0} to be an array",
    "type.only.selector": "Expected `only` path to be an array of strings or regular expressions",
    "type.plugin": "Expected plugin to be a function",
    "type.reporter": "Expected reporter to be a function",
    "type.setters.name": "name must be a string if func exists",
    "type.callback.optional": "Expected callback to be a function or not exist",
    "type.test.name": "Expected `name` to be a string",
    "type.cli.config": "Expected config.{0} to be a(n) {1} if it exists, but found a(n) {2}",
    "type.cli.config.files": "Expected config.files[{0}] to be a string",
    "type.reporter.argument": "Options cannot be a report. Did you forget to call the reporter first?",
})

/* eslint-enable max-len */

// This expands templates with {0} -> args[0], {1} -> args[1], etc.
exports.m = m
function m(name) {
    var args = []

    for (var i = 1; i < arguments.length; i++) {
        args.push(arguments[i])
    }

    return Messages[name].replace(/\{(\d+)\}/g, function (_, i) {
        return args[i]
    })
}

/**
 * These are bit flags, to compress the test's data size by a lot. Also, it's
 * not likely tests will need more than this in a single mask.
 *
 * If you're unfamiliar about how bit masks work, here's some of the basics:
 *
 * To set a bit:   value | bit
 * To unset a bit: value & ~bit
 *
 * To test if a bit is set:   (value & bit) !== 0 or (value & bit) === bit
 * To test if a bit is unset: (value & bit) === 0
 *
 * To test if many bits are set:   (value & bits) === bits
 * To test if many bits are unset: (value & bits) === 0
 *
 * There are others, but these are the most common operations.
 */
/* eslint-disable key-spacing */

var Flags = exports.Flags = Object.freeze({
    Inline:  0x01, // If the test is inline, e.g. `t.test("test")`
    Async:   0x02, // If the test is async, e.g. `t.async("test", ...)`
    Init:    0x04, // If the test is initializing.
    Running: 0x08, // If the test is currently running.
    Root:    0x10, // If the test is the root test.
    HasOnly: 0x20, // If the test has an `only` restriction.
})

/* eslint-enable key-spacing */

// General utilities

exports.methods = function (Base, Super) {
    var methods = []

    if (typeof Super !== "function") {
        methods.push(Super)
    } else if (Super != null) {
        Base.prototype = Object.create(Super.prototype)
        Object.defineProperty(Base.prototype, "constructor", Base)
    }

    for (var i = 0; i < arguments.length; i++) {
        methods.push(arguments[i])
    }

    for (var j = 0; j < methods.length; j++) {
        var object = methods[j]
        var keys = Object.keys(object)

        for (var k = 0; k < keys.length; k++) {
            var key = keys[k]
            var desc = Object.getOwnPropertyDescriptor(object, key)

            desc.enumerable = false
            Object.defineProperty(Base.prototype, key, desc)
        }
    }

    return Base
}

function setStack(inst, stack) {
    Object.defineProperty(inst, "stack", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: stack,
    })
}

exports.readStack = function (inst) {
    if (typeof Error.captureStackTrace === "function") {
        Error.captureStackTrace(inst, inst.constructor)
    } else {
        Object.defineProperty(inst, "stack", {
            configurable: true,
            enumerable: true,
            get: function () {
                var e = new Error(this.message)

                e.name = this.name
                setStack(this, e.stack)
            },
            set: function (stack) {
                setStack(this, stack)
            },
        })
    }
}

exports.defineError = function (es6, props) {
    if (Array.isArray(es6)) es6 = es6.join("\n")
    try {
        return new Function("'use strict';" + es6)() // eslint-disable-line no-new-func, max-len
    } catch (_) {
        var C = props.constructor

        delete props.constructor
        return exports.methods(C, Error, props)
    }
}

exports.r = function (type, value, slow) {
    return {type: type, value: value, slow: !!slow}
}

function objectLike(value) {
    return value != null &&
        (typeof value === "object" || typeof value === "function")
}

exports.isThenable = function (value) {
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

        if (exports.isThenable(res)) return resolve(res)
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

/* eslint-enable no-self-compare */

exports.reporters = function (ctx) {
    while (ctx.reporters == null) {
        ctx = ctx.parent
    }

    return ctx.reporters
}

// This is uncached, so reporters can expect a new object each time.
exports.path = function (ctx) {
    var ret = []

    while ((ctx.status & Flags.Root) === 0) {
        ret.unshift({
            name: ctx.name,
            index: ctx.index,
        })
        ctx = ctx.parent
    }

    return ret
}

exports.report = function (ctx, args) {
    // Reporters are allowed to block, and these are always called first.
    var blocking = []
    var concurrent = []
    var reporters = exports.reporters(ctx)

    for (var i = 0; i < reporters.length; i++) {
        var reporter = reporters[i]

        if (reporter.block) {
            blocking.push(reporter)
        } else {
            concurrent.push(reporter)
        }
    }

    function pcall(reporter) {
        return exports.resolveAny(reporter, undefined, {
            type: args.type,
            path: exports.path(ctx),
            value: args.value,
            slow: !!args.slow,
        })
    }

    return Promise.each(blocking, pcall)
    .return(concurrent)
    .map(pcall)
    .return()
}

// Note that a timeout of 0 means to inherit the parent.
exports.timeout = function (ctx) {
    while (ctx.timeout === 0 && (ctx.status & Flags.Root) === 0) {
        ctx = ctx.parent
    }

    return ctx.timeout || 2000 // ms - default timeout
}

// Note that a slowness threshold of 0 means to inherit the parent.
exports.slow = function (ctx) {
    while (ctx.slow === 0 && (ctx.status & Flags.Root) === 0) {
        ctx = ctx.parent
    }

    return ctx.slow || 75 // ms - default slow threshold
}

exports.timeoutFail = function (timeout) {
    return new Error(m("async.timeout", timeout))
}

var tryCaught = false
var tryError

exports.tryCaught = function () {
    return tryCaught
}

exports.tryError = function () {
    var e = tryError

    tryError = undefined
    return e
}

function apply(f, inst, args) {
    switch (args.length) {
    case 0: return f.call(inst)
    case 1: return f.call(inst, args[0])
    case 2: return f.call(inst, args[0], args[1])
    case 3: return f.call(inst, args[0], args[1], args[2])
    case 4: return f.call(inst, args[0], args[1], args[2], args[3])
    default: return f.apply(inst, args)
    }
}

function tryFail(e) {
    tryCaught = true
    tryError = e
}

exports.try0 = function (f, inst) {
    try {
        tryCaught = false
        return f.call(inst)
    } catch (e) {
        return tryFail(e)
    }
}

exports.try1 = function (f, inst, arg) {
    try {
        tryCaught = false
        return f.call(inst, arg)
    } catch (e) {
        return tryFail(e)
    }
}

exports.try2 = function (f, inst, arg0, arg1) {
    try {
        tryCaught = false
        return f.call(inst, arg0, arg1)
    } catch (e) {
        return tryFail(e)
    }
}

exports.tryN = function (f, inst, args) {
    try {
        tryCaught = false
        return apply(f, inst, args)
    } catch (e) {
        return tryFail(e)
    }
}

var testFail = false
var testError

exports.testPassing = function () {
    testFail = false
}

exports.testFailing = function (value) {
    testFail = true
    testError = value
}

exports.testFail = function () {
    return testFail
}

exports.testError = function () {
    var e = testError

    testError = undefined
    return e
}
