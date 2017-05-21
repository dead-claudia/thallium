"use strict"

var methods = require("../methods")
var peach = require("../util").peach
var Reports = require("./reports")
var Filter = require("./filter")
var HookStage = Reports.HookStage

/**
 * The tests are laid out in a very data-driven design. With exception of the
 * reports, there is minimal object orientation and zero virtual dispatch.
 * Here's a quick overview:
 *
 * - The test handling dispatches based on various attributes the test has. For
 *   example, roots are known by a circular root reference, and skipped tests
 *   are known by not having a callback.
 *
 * - The test evaluation is very procedural. Although it's very highly
 *   asynchronous, the use of promises linearize the logic, so it reads very
 *   much like a recursive set of steps.
 *
 * - The data types are mostly either plain objects or classes with no methods,
 *   the latter mostly for debugging help. This also avoids most of the
 *   indirection required to accommodate breaking abstractions, which the API
 *   methods frequently need to do.
 */

// Prevent Sinon interference when they install their mocks
var setTimeout = global.setTimeout
var clearTimeout = global.clearTimeout
var now = global.Date.now

/**
 * Basic data types
 */
function Result(time, attempt) {
    this.time = time
    this.caught = attempt.caught
    this.value = attempt.caught ? attempt.value : undefined
}

/**
 * Overview of the test properties:
 *
 * - `root` - The root test
 * - `reporters` - The list of reporters
 * - `current` - A reference to the currently active test
 * - `timeout` - The tests's timeout, or 0 if inherited
 * - `slow` - The tests's slow threshold
 * - `name` - The test's name
 * - `index` - The test's index
 * - `parent` - The test's parent
 * - `callback` - The test's callback
 * - `tests` - The test's child tests
 * - `beforeAll`, `beforeEach`, `afterEach`, `afterAll` - The test's various
 *   scheduled hooks
 *
 * Many of these properties aren't present on initialization to save memory.
 */

function Normal(name, index, parent, callback) {
    this.locked = true
    this.root = parent.root
    this.name = name
    this.index = index|0
    this.parent = parent
    this.callback = callback
    this.isFailable = parent.isFailable
    this.attempts = parent.attempts

    this.timeout = parent.timeout
    this.slow = parent.slow
    this.tests = undefined
    this.beforeAll = undefined
    this.beforeEach = undefined
    this.afterEach = undefined
    this.afterAll = undefined
    this.reporter = undefined
    this.reflect = undefined
}

function Skipped(name, index, parent) {
    this.locked = true
    this.root = parent.root
    this.name = name
    this.index = index|0
    this.parent = parent

    // Only for reflection.
    this.isFailable = parent.isFailable
    this.attempts = parent.attempts
    this.reporter = undefined
    this.reflect = undefined
}

function Root() {
    this.locked = false
    this.reporterIds = []
    this.reporters = []
    this.current = this
    this.root = this
    this.timeout = 0
    this.slow = 0
    this.attempts = 1
    this.isFailable = false

    this.tests = undefined
    this.reporter = undefined
    this.reflect = undefined
    this.beforeAll = undefined
    this.beforeEach = undefined
    this.afterEach = undefined
    this.afterAll = undefined
}

function Context(root) {
    this.root = root
    this.tests = []
    this.isSuccess = true
}

/**
 * Base tests (i.e. default export, result of `internal.root()`).
 */

exports.createRoot = function (methods) {
    return new Root(methods)
}

/**
 * Set up each test type.
 */

/**
 * A normal test through `t.test()`.
 */

exports.addNormal = function (parent, name, callback) {
    var index = parent.tests != null ? parent.tests.length : 0
    var base = new Normal(name, index, parent, callback)

    if (index) {
        parent.tests.push(base)
    } else {
        parent.tests = [base]
    }
}

/**
 * A skipped test through `t.testSkip()`.
 */
exports.addSkipped = function (parent, name) {
    var index = parent.tests != null ? parent.tests.length : 0
    var base = new Skipped(name, index, parent)

    if (index) {
        parent.tests.push(base)
    } else {
        parent.tests = [base]
    }
}

/**
 * Clear the tests in place.
 */
exports.clearTests = function (parent) {
    parent.tests = null
}

/**
 * Execute the tests
 */

exports.defaultTimeout = 2000 // ms
exports.defaultSlow = 75 // ms

function makeSlice(tests, length) {
    var ret = new Array(length)

    for (var i = 0; i < length; i++) {
        ret[i] = {name: tests[i].name, index: tests[i].index}
    }

    return ret
}

function reportWith(context, func) {
    return Promise.resolve()
    .then(function () {
        if (context.root.reporter == null) return undefined
        return func(context.root.reporter)
    })
    .then(function () {
        var reporters = context.root.reporters

        // Two easy cases.
        if (reporters.length === 0) return undefined
        if (reporters.length === 1) return func(reporters[0])
        return Promise.all(reporters.map(func))
    })
}

function reportStart(context) {
    return reportWith(context, function (reporter) {
        return reporter(new Reports.Start())
    })
}

function reportEnter(context, duration) {
    var test = context.root.current
    var slow = test.slow || exports.defaultSlow

    return reportWith(context, function (reporter) {
        var path = makeSlice(context.tests, context.tests.length)

        return reporter(new Reports.Enter(path, duration, slow))
    })
}

function reportLeave(context) {
    return reportWith(context, function (reporter) {
        return reporter(new Reports.Leave(
            makeSlice(context.tests, context.tests.length)))
    })
}

function reportPass(context, duration) {
    var test = context.root.current
    var slow = test.slow || exports.defaultSlow

    return reportWith(context, function (reporter) {
        var path = makeSlice(context.tests, context.tests.length)

        return reporter(new Reports.Pass(path, duration, slow))
    })
}

function reportFail(context, error, duration) {
    var test = context.root.current
    var slow = test.slow || exports.defaultSlow
    var isFailable = test.isFailable

    return reportWith(context, function (reporter) {
        var path = makeSlice(context.tests, context.tests.length)

        return reporter(new Reports.Fail(
            path, error, duration, slow, isFailable))
    })
}

function reportSkip(context) {
    return reportWith(context, function (reporter) {
        return reporter(new Reports.Skip(
            makeSlice(context.tests, context.tests.length)))
    })
}

function reportEnd(context) {
    return reportWith(context, function (reporter) {
        return reporter(new Reports.End())
    })
}

function reportError(context, error) {
    return reportWith(context, function (reporter) {
        return reporter(new Reports.Error(error))
    })
}

function reportHook(context, test, error) {
    return reportWith(context, function (reporter) {
        return reporter(new Reports.Hook(
            makeSlice(context.tests, context.tests.length),
            makeSlice(context.tests, context.tests.indexOf(test) + 1),
            error))
    })
}

/**
 * Normal tests
 */

// PhantomJS and IE don't add the stack until it's thrown. In failing async
// tests, it's already thrown in a sense, so this should be normalized with
// other test types.
var addStack = typeof new Error().stack !== "string"
    ? function addStack(e) {
        try {
            if (e instanceof Error && e.stack == null) throw e
        } finally {
            return e
        }
    }
    : function (e) { return e }

function getThen(res) {
    if (typeof res === "object" || typeof res === "function") {
        return res.then
    } else {
        return undefined
    }
}

function AsyncState(context, start, resolve, count) {
    this.context = context
    this.start = start
    this.resolve = resolve
    this.count = count
    this.timer = undefined
}

var p = Promise.resolve()

function asyncFinish(state, attempt) {
    // Capture immediately. Worst case scenario, it gets thrown away.
    var end = now()

    if (state.timer) {
        clearTimeout.call(global, state.timer)
        state.timer = undefined
    }

    if (attempt.caught && state.count < state.context.root.current.attempts) {
        // Don't recurse synchronously, since it may be resolved synchronously
        state.resolve(p.then(function () {
            return invokeInit(state.context, state.count + 1)
        }))
    } else {
        state.resolve(new Result(end - state.start, attempt))
    }
}

// Avoid creating a closure if possible, in case it doesn't return a thenable.
function invokeInit(context, count) {
    var test = context.root.current
    var start = now()
    var tryBody = try0(test.callback)
    var syncEnd = now()

    // Note: synchronous failures are test failures, not fatal errors.
    if (tryBody.caught) {
        if (count < test.attempts) return invokeInit(context, count + 1)
        return Promise.resolve(new Result(syncEnd - start, tryBody))
    }

    var tryThen = try1(getThen, undefined, tryBody.value)

    if (tryThen.caught) {
        if (count < test.attempts) return invokeInit(context, count + 1)
        return Promise.resolve(new Result(syncEnd - start, tryThen))
    }

    if (typeof tryThen.value !== "function") {
        return Promise.resolve(new Result(syncEnd - start, tryThen))
    }

    return new Promise(function (resolve) {
        var state = new AsyncState(context, start, resolve, count)
        var result = try2(tryThen.value, tryBody.value,
            function () {
                if (state == null) return
                asyncFinish(state, tryPass())
                state = undefined
            },
            function (e) {
                if (state == null) return
                asyncFinish(state, tryFail(addStack(e)))
                state = undefined
            })

        if (state == null) return
        if (result.caught) {
            asyncFinish(state, result)
            state = undefined
            return
        }

        // Set the timeout *after* initialization. The timeout will likely be
        // specified during initialization.
        var maxTimeout = test.timeout || exports.defaultTimeout

        // Setting a timeout is pointless if it's infinite.
        if (maxTimeout !== Infinity) {
            state.timer = setTimeout.call(global, function () {
                if (state == null) return
                asyncFinish(state, tryFail(addStack(
                    new Error("Timeout of " + maxTimeout + " reached"))))
                state = undefined
            }, maxTimeout)
        }
    })
}

function ErrorWrap(test, error) {
    this.test = test
    this.error = error
}
methods(ErrorWrap, Error, {name: "ErrorWrap"})

function invokeHook(test, list, stage) {
    if (list == null) return Promise.resolve()
    return peach(list, function (hook) {
        try {
            return hook()
        } catch (e) {
            throw new ErrorWrap(test, new Reports.HookError(stage, hook, e))
        }
    })
}

function invokeBeforeEach(test) {
    if (test.root === test) {
        return invokeHook(test, test.beforeEach, HookStage.BeforeEach)
    } else {
        return invokeBeforeEach(test.parent).then(function () {
            return invokeHook(test, test.beforeEach, HookStage.BeforeEach)
        })
    }
}

function invokeAfterEach(test) {
    if (test.root === test) {
        return invokeHook(test, test.afterEach, HookStage.AfterEach)
    } else {
        return invokeHook(test, test.afterEach, HookStage.AfterEach)
        .then(function () { return invokeAfterEach(test.parent) })
    }
}

/**
 * This checks if the test was whitelisted in a `t.only()` call, or for
 * convenience, returns `true` if `t.only()` was never called.
 */
function isOnly(test) {
    var path = []

    while (test.parent != null && test.only == null) {
        path.push(test.name)
        test = test.parent
    }

    // If there isn't any `only` active, then let's skip the check and return
    // `true` for convenience.
    if (test.only == null) return true
    return Filter.test(test.only, path)
}

function runChildTests(test, context) {
    if (test.tests == null) return undefined

    function leave() {
        test.root.current = test
        context.tests.pop()
    }

    function runChild(child) {
        test.root.current = child
        context.tests.push(child)

        return invokeBeforeEach(test)
        .then(function () { return runNormalChild(child, context) })
        .then(function () { return invokeAfterEach(test) })
        .catch(function (e) {
            if (!(e instanceof ErrorWrap)) throw e
            return reportHook(context, e.test, e.error)
        })
        .then(leave, function (e) { leave(); throw e })
    }

    var ran = false

    return peach(test.tests, function (child) {
        // Only skipped tests have no callback
        if (child.callback == null) {
            test.root.current = child
            context.tests.push(child)

            return reportSkip(context)
            .then(leave, function (e) { leave(); throw e })
        } else if (!isOnly(child)) {
            return Promise.resolve()
        } else if (ran) {
            return runChild(child)
        } else {
            ran = true
            return invokeHook(test, test.beforeAll, HookStage.BeforeAll)
            .then(function () { return runChild(child) })
        }
    })
    .then(function () {
        if (!ran) return undefined
        return invokeHook(test, test.afterAll, HookStage.AfterAll)
    })
}

function clearChildren(test) {
    if (test.tests == null) return
    for (var i = 0; i < test.tests.length; i++) {
        test.tests[i].tests = undefined
    }
}

function runNormalChild(test, context) {
    test.locked = false

    return invokeInit(context, 1)
    .then(
        function (result) { test.locked = true; return result },
        function (error) { test.locked = true; throw error })
    .then(function (result) {
        if (result.caught) {
            if (!test.isFailable) context.isSuccess = false
            return reportFail(context, result.value, result.time)
        } else if (test.tests != null) {
            // Report this as if it was a parent test if it's passing and has
            // children.
            return reportEnter(context, result.time)
            .then(function () { return runChildTests(test, context) })
            .then(function () { return reportLeave(context) })
            .catch(function (e) {
                if (!(e instanceof ErrorWrap)) throw e
                return reportLeave(context).then(function () {
                    return reportHook(context, e.test, e.error)
                })
            })
        } else {
            return reportPass(context, result.time)
        }
    })
    .then(
        function () { clearChildren(test) },
        function (e) { clearChildren(test); throw e })
}

/**
 * This runs the root test and returns a promise resolved when it's done.
 */
exports.runTest = function (root, opts) {
    var context = new Context(root, opts)

    root.locked = true
    return reportStart(context)
    .then(function () { return runChildTests(root, context) })
    .catch(function (e) {
        if (!(e instanceof ErrorWrap)) throw e
        return reportHook(context, e.test, e.error)
    })
    .then(function () { return reportEnd(context) })
    // Tell the reporter something happened. Otherwise, it'll have to wrap this
    // method in a plugin, which shouldn't be necessary.
    .catch(function (e) {
        return reportError(context, e).then(function () { throw e })
    })
    .then(
        function () {
            clearChildren(root)
            root.locked = false
            return {
                isSuccess: context.isSuccess,
            }
        },
        function (e) {
            clearChildren(root)
            root.locked = false
            throw e
        })
}

// Help optimize for inefficient exception handling in V8

function tryPass(value) {
    return {caught: false, value: value}
}

function tryFail(e) {
    return {caught: true, value: e}
}

function try0(f) {
    try {
        return tryPass(f())
    } catch (e) {
        return tryFail(e)
    }
}

function try1(f, inst, arg0) {
    try {
        return tryPass(f.call(inst, arg0))
    } catch (e) {
        return tryFail(e)
    }
}

function try2(f, inst, arg0, arg1) {
    try {
        return tryPass(f.call(inst, arg0, arg1))
    } catch (e) {
        return tryFail(e)
    }
}
