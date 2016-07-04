"use strict"

var Promise = require("bluebird")
var m = require("../messages.js")
var Common = require("./common.js")
var Resolver = require("../resolver.js")
var Try = require("./try.js")
var Flags = require("./flags.js")
var Test = require("./test.js")
var Util = require("../util.js")
var Report = require("./report.js")

// Prevent Sinon interference when they install their mocks
var setTimeout = global.setTimeout
var clearTimeout = global.clearTimeout
var now = global.Date.now

/**
 * This is a modified version of the async-await official, non-normative
 * desugaring helper, for better error checking and adapted to accept an
 * already-instantiated iterator instead of a generator.
 */

function iterNext(iter, v) {
    return iterStep(iter, iter.gen.next, v, true)
}

function iterThrow(iter, e) {
    var func = iter.gen.throw

    if (typeof func === "function") {
        return iterStep(iter, func, e, false)
    } else {
        return iter.reject(e)
    }
}

function iterStep(iter, func, value, isNext) {
    var attempt = Try.try1(func, iter.gen, value)

    if (attempt.caught) {
        // finished with failure, reject the promise
        return iter.reject(attempt.value)
    }

    var next = attempt.value

    if (typeof next !== "object" || next === null) {
        // finished with failure, reject the promise
        return iter.reject(new TypeError(m(
            isNext ? "type.iterate.next" : "type.iterate.throw")))
    }

    if (next.done) {
        // finished with success, resolve the promise
        return iter.resolve(next.value)
    }

    // not finished, chain off the yielded promise and `step` again
    return Promise.resolve(next.value).then(
        Util.part1(iterNext, iter),
        Util.part1(iterThrow, iter))
}

function Iterator(gen, resolve, reject) {
    this.gen = gen
    this.resolve = resolve
    this.reject = reject
}

function iterate(gen) {
    return new Promise(function (resolve, reject) {
        var iter = new Iterator(gen, resolve, reject)

        iterStep(iter, gen.next, undefined, true)
    })
}

function AsyncState(test, resolve) {
    this.test = test
    this.resolve = resolve

    this.count = 0
    this.interesting = false
    this.resolved = false
    this.timer = null
    this.timeout = 0
    this.start = 0
}

function asyncFinish(state, attempt) {
    // Capture immediately. Worst case scenario, it gets thrown away.
    var end = now()

    if (state.resolved) return undefined
    if (state.timer) {
        clearTimeout(state.timer)
        state.timer = null
    }

    state.resolved = true
    return state.resolve(Common.result(end - state.start, attempt))
}

function asyncPass(state) {
    return asyncFinish(state, Try.pass())
}

// PhantomJS and IE don't add the stack until it's thrown. In failing async
// tests, it's already thrown in a sense, so this should be normalized with
// other test types.
function addStack(e) {
    try {
        if (e instanceof Error && e.stack == null) throw e
    } finally {
        return e
    }
}

function asyncFail(state, e) {
    return asyncFinish(state, Try.fail(addStack(e)))
}

function asyncCallback(state, err) {
    // Ignore calls to this if something interesting was already
    // returned.
    if (state.interesting) return undefined

    // Errors are ignored here, since there is no reliable way
    // to handle them after the test ends. Bluebird will warn
    // about unhandled errors to the console, anyways, so it'll
    // be hard to miss.
    if (state.count++) {
        // Create a helpful stack to display.
        var e = new Error()

        e.name = ""

        Common.report(state.test, Common.r(
            Report.Types.Extra,
            // Trim the initial newline
            new Report.ExtraCall(state.count, err, Util.getStack(e).slice(1)),
            -1))

        return undefined
    }

    if (err != null) return asyncFail(state, err)
    else return asyncPass(state)
}

function checkSpecial(state, res) {
    // It can't be interesting if the result's nullish.
    state.interesting = res != null

    var isThenable = Try.try1(Resolver.isThenable, undefined, res)

    if (isThenable.caught) return asyncFail(state, isThenable.value)

    if (isThenable.value) {
        Promise.resolve(res).then(
            Util.bind1(asyncPass, state),
            Util.part1(asyncFail, state))
        return undefined
    }

    var isIterator = Try.try1(Resolver.isIterator, undefined, res)

    if (isIterator.caught) return asyncFail(state, isIterator.value)

    if (isIterator.value) {
        // No, Bluebird's coroutines don't work.
        iterate(res).then(
            Util.bind1(asyncPass, state),
            Util.part1(asyncFail, state))
    } else {
        // Not interesting enough. Mark it as such.
        state.interesting = false
    }

    return undefined
}

function asyncTimeout(state) {
    return asyncFail(state, new Error(m("async.timeout", state.timeout)))
}

function asyncRun(state) {
    var methods = state.test.methods
    var callback = Util.part1(asyncCallback, state)
    var init = state.test.data.state.callback

    state.start = now()

    var res = Try.try2(init, methods, methods, callback)

    // Note: synchronous failures when initializing an async test are test
    // failures, not fatal errors.

    if (res.caught) return asyncFail(state, res.value)

    checkSpecial(state, res.value)

    // If an error was thrown from `checkSpecial()`, don't set the timer.
    if (!state.resolved) {
        // Set the timeout *after* initialization. The timeout will likely be
        // specified during initialization.

        state.timeout = Common.timeout(state.test)

        // Don't bother checking/setting a timeout if it was `Infinity`.
        if (state.timeout !== Infinity) {
            state.timer = setTimeout(Util.bind1(asyncTimeout, state),
                state.timeout)
        }
    }

    return undefined
}

function asyncInit(test) {
    return new Promise(function (resolve) {
        return asyncRun(new AsyncState(test, resolve))
    })
}

module.exports = function (methods, name, index, callback) {
    return Test.create(methods, Flags.Async,
        new Test.Data(name, index, methods._, {
            callback: callback,
            init: asyncInit,
        }))
}
