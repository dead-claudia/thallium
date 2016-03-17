"use strict"

var Promise = require("bluebird")
var isThenable = require("../util/util.js").isThenable

exports.activeReporters = activeReporters
function activeReporters(ctx) {
    while (ctx.reporters == null) {
        ctx = ctx.parent
    }
    return ctx.reporters
}

// This is uncached, so reporters can expect a new object each time.
function getPath(ctx) {
    var ret = []

    while (!ctx.isBase) {
        ret.unshift({
            name: ctx.name,
            index: ctx.index,
        })
        ctx = ctx.parent
    }

    return ret
}

function maybePromisify(func, value) {
    return new Promise(function (resolve, reject) {
        var res = func(value, function (err) {
            if (err != null) {
                return reject(err)
            } else {
                return resolve()
            }
        })

        if (isThenable(res)) {
            return resolve(res)
        } else {
            return undefined
        }
    })
}

exports.report = report
function report(ctx, args) {
    // Reporters are allowed to block, and these are always called first.
    var reporters = activeReporters(ctx)

    // If this becomes a bottleneck, there's other issues.
    var blocking = reporters.filter(function (x) { return x.block })
    var concurrent = reporters.filter(function (x) { return !x.block })

    function pcall(reporter) {
        return maybePromisify(reporter, {
            type: args.type,
            value: args.value,
            path: getPath(ctx),
        })
    }

    return Promise.map(concurrent, pcall)
    .return(blocking)
    .each(pcall)
    .return(undefined)
}

exports.runTests = runTests
function runTests(ctx, res) {
    if (res.type !== "pass") {
        // If the init failed, then this has already failed.
        return Promise.resolve(res)
    } else {
        // Tests are called in sequence for obvious reasons.
        return Promise.each(ctx.tests, function (test) {
            return test.run(false)
        })
        .return(res)
    }
}
