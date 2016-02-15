"use strict"

var timers = require("../util/timers.js")
var isThenable = require("../util/util.js").isThenable

exports.wrap = wrap
function wrap(exit, f) {
    return function (err) {
        if (err != null) return exit(err)

        var args = []

        for (var i = 1; i < arguments.length; i++) {
            args.push(arguments[i])
        }
        return f.apply(null, args)
    }
}

exports.activeReporters = activeReporters
function activeReporters(ctx) {
    while (ctx.reporters == null) {
        ctx = ctx.parent
    }
    return ctx.reporters
}

function getData(ctx) {
    if (ctx.isBase) return undefined
    return {
        name: ctx.name,
        index: ctx.index,
        parent: getData(ctx.parent),
    }
}

function once(func) {
    return /** @this */ function () {
        if (func == null) return undefined
        var f = func

        func = null
        return f.apply(this, arguments)
    }
}

function nodeifyThen(func, value, callback) {
    var resolved = false

    function errback(err) {
        if (resolved) return undefined
        resolved = true
        return timers.nextTick(callback, err)
    }

    try {
        var res = func(value, errback)

        if (isThenable(res)) {
            return res.then(function () {
                if (resolved) return undefined
                resolved = true
                return timers.nextTick(callback)
            }, errback)
        }
    } catch (err) {
        return timers.nextTick(callback, err)
    }

    return undefined
}

exports.report = report
function report(ctx, args, callback) {
    // Reporters are allowed to block, and these are always called first.
    var reporters = activeReporters(ctx)

    // If this becomes a bottleneck, there's other issues.
    var blocking = reporters.filter(function (x) { return x.block })
    var concurrent = reporters.filter(function (x) { return !x.block })

    // Note: Reporter errors are always fatal.
    function call(reporter, callback) {
        var parent = args.parent

        if (!ctx.isBase && parent == null) {
            parent = getData(ctx.parent)
        }

        try {
            // Don't mutate the object. Reporters should be able to assume
            // a fresh instance each time.
            return nodeifyThen(reporter, {
                type: args.type,
                index: args.index,
                value: args.value,
                name: ctx.name,
                parent: parent,
            }, callback)
        } catch (e) {
            return timers.nextTick(callback, e)
        }
    }

    // Call the non-blocking reporters all at once.
    function callConcurrent(callback) {
        var count = concurrent.length

        if (count === 0) return callback()

        function next(err) {
            if (count === 0) return undefined
            if (err != null) {
                count = 0
                return callback(err)
            } else {
                count--
                if (count === 0) return callback()
                return undefined
            }
        }

        for (var i = 0; i < concurrent.length; i++) {
            call(concurrent[i], once(next))
        }

        return undefined
    }

    // Call the blocking reporters individually.
    function callBlocking(i, next) {
        if (i === blocking.length) return next()

        var reporter = blocking[i]

        return call(reporter, once(function (err) {
            if (err != null) return timers.nextTick(next, err)
            return timers.nextTick(callBlocking, i + 1, next)
        }))
    }

    callBlocking(0, function (err) {
        if (err != null) return callback(err)
        return callConcurrent(callback)
    })
}

exports.runTests = runTests
function runTests(ctx, res, callback) {
    // Tests are called in sequence for obvious reasons.
    function iterate(i) {
        if (i === ctx.tests.length) return callback(null, res)
        ctx.tests[i].run(false, wrap(callback, function () {
            return iterate(i + 1)
        }))
        return undefined
    }

    if (res.type === "pass") {
        return iterate(0)
    } else {
        // If the init failed, then this has already failed.
        return callback(null, res)
    }
}
