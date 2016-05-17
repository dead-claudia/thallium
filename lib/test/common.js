"use strict"

const Promise = require("bluebird")
const resolveAny = require("../util.js").resolveAny
const m = require("../messages.js")

exports.activeReporters = activeReporters
function activeReporters(ctx) {
    while (ctx.reporters == null) {
        ctx = ctx.parent
    }
    return ctx.reporters
}

// This is uncached, so reporters can expect a new object each time.
function getPath(ctx) {
    const ret = []

    while (!ctx.isRoot) {
        ret.unshift({
            name: ctx.name,
            index: ctx.index,
        })
        ctx = ctx.parent
    }

    return ret
}

exports.report = (ctx, args) => {
    // Reporters are allowed to block, and these are always called first.
    const blocking = []
    const concurrent = []
    const reporters = activeReporters(ctx)

    for (const reporter of reporters) {
        if (reporter.block) {
            blocking.push(reporter)
        } else {
            concurrent.push(reporter)
        }
    }

    function pcall(reporter) {
        return resolveAny(reporter, undefined, {
            type: args.type,
            path: getPath(ctx),
            value: args.value,
            slow: !!args.slow,
        })
    }

    return Promise.each(blocking, pcall)
    .return(concurrent)
    .map(pcall)
    .return(undefined)
}

const DEFAULT_TIMEOUT = 2000 // ms

// Note that a timeout of 0 means to inherit the parent.
exports.getTimeout = getTimeout
function getTimeout(ctx) {
    while (!ctx.timeout && !ctx.isRoot) {
        ctx = ctx.parent
    }

    return ctx.timeout || DEFAULT_TIMEOUT
}

const DEFAULT_SLOW = 75 // ms

// Note that a slowness threshold of 0 means to inherit the parent.
exports.getSlow = getSlow
function getSlow(ctx) {
    while (!ctx.slow && !ctx.isRoot) {
        ctx = ctx.parent
    }

    return ctx.slow || DEFAULT_SLOW
}

exports.timeoutFail = timeout => new Error(m("async.timeout", timeout))

exports.runTests = (ctx, res) => {
    // If the init failed, then this has already failed.
    if (res.type !== "pass") return Promise.resolve(res)

    // Tests are called in sequence for obvious reasons.
    return Promise.each(ctx.tests, test => test.run(false))
    .return(res)
}
