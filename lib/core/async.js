"use strict"

var Promise = require("bluebird")
var m = require("../messages.js")
var Common = require("./common.js")
var Try = require("./try.js")
var Flags = require("./flags.js")
var Test = require("./test.js")
var Util = require("../util.js")

var r = Common.r
var report = Common.report

// Prevent Sinon interference when they install their mocks
var setTimeout = global.setTimeout
var clearTimeout = global.clearTimeout
var now = global.Date.now

function iteratorStep(iter, func, value, message) {
    var attempt = Try.try1(func, iter.gen, value)

    if (attempt.caught) {
        // finished with failure, reject the promise
        return iter.reject(attempt.value)
    }

    var next = attempt.value

    if (typeof next !== "object" || next === null) {
        // finished with failure, reject the promise
        return iter.reject(new TypeError(m(message)))
    }

    if (next.done) {
        // finished with success, resolve the promise
        return iter.resolve(next.value)
    }

    // not finished, chain off the yielded promise and `step` again
    return Promise.resolve(next.value).then(
        function (v) {
            return iteratorStep(iter, iter.gen.next, v, "type.iterate.next")
        },
        function (e) {
            var func = iter.gen.throw

            if (typeof func === "function") {
                return iteratorStep(iter, func, e, "type.iterate.throw")
            } else {
                return iter.reject(e)
            }
        })
}

/**
 * This is a modified version of the async-await official, non-normative
 * desugaring helper, for better error checking and adapted to accept an
 * already-instantiated iterator instead of a generator.
 */
function iterate(gen) {
    return new Promise(function (resolve, reject) {
        var iter = {gen: gen, resolve: resolve, reject: reject}

        iteratorStep(iter, gen.next, undefined, "type.iterate.next")
    })
}

// TODO: add slow semantics
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

function asyncPass(state) {
    // Capture immediately. Worst case scenario, it gets thrown away.
    var end = now()

    if (state.resolved) return undefined
    if (state.timer) {
        clearTimeout(state.timer)
        state.timer = null
    }

    state.resolved = true
    return state.resolve(Try.pass(end - state.start))
}

function asyncFail(state, e) {
    if (state.resolved) return undefined
    if (state.timer) {
        clearTimeout(state.timer)
        state.timer = null
    }

    state.resolved = true
    return state.resolve(Try.fail(e))
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

        report(state.test, r("extra", {
            count: state.count,
            value: err,
            // Trim the initial newline
            stack: e.stack.slice(1),
        }))

        return undefined
    }

    if (err != null) return asyncFail(state, err)
    else return asyncPass(state)
}

function checkSpecial(state, res) {
    // It can't be interesting if the result's nullish.
    state.interesting = res != null

    var isThenable = Try.try1(Common.isThenable, undefined, res)

    if (isThenable.caught) return asyncFail(state, isThenable.value)

    if (isThenable.value) {
        Promise.resolve(res).then(
            Util.bind1(asyncPass, state),
            Util.part1(asyncFail, state))
        return undefined
    }

    var isIterator = Try.try1(Common.isIterator, undefined, res)

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

function asyncRun(state) {
    var methods = state.test.methods
    var callback = Util.part1(asyncCallback, state)

    state.start = now()

    var res = Try.try2(state.test.state.callback, methods, methods, callback)

    // Note: synchronous failures when initializing an async test are test
    // failures, not fatal errors.

    if (res.caught) return asyncFail(state, res.value)

    checkSpecial(state, res.value)

    // Set the timeout *after* initialization. The timeout will likely
    // be specified during initialization.

    state.timeout = Common.timeout(state.test)

    // Don't bother checking/setting a timeout if it was `Infinity`.
    if (state.timeout !== Infinity) {
        state.timer = setTimeout(function () {
            return asyncFail(state, Common.timeoutFail(state.timeout))
        }, state.timeout)
    }

    return undefined
}

function asyncInit(test) {
    return new Promise(function (resolve) {
        return asyncRun(new AsyncState(test, resolve))
    })
}

module.exports = function (methods, name, index, callback) {
    var test = Test.initTest(methods, name, index)

    test.status |= Flags.Async
    test.state = {
        callback: callback,
        init: asyncInit,
    }

    return test
}
