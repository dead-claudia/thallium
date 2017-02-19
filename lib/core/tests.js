"use strict"

var methods = require("../methods")
var peach = require("../util").peach
var Reports = require("./reports")
var Filter = require("./filter")
var Types = Reports.Types

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
 * - `methods` - A deprecated reference to the API methods
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

// TODO: remove `test.methods` in 0.4
function Normal(name, index, parent, callback) {
    var child = Object.create(parent.methods)

    child._ = this
    this.methods = child
    this.locked = true
    this.root = parent.root
    this.name = name
    this.index = index|0
    this.parent = parent
    this.callback = callback
    this.isFailable = parent.isFailable
    this.attempts = parent.attempts

    this.timeout = 0
    this.slow = 0
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

// TODO: remove `test.methods` in 0.4
function Root(methods) {
    this.locked = false
    this.methods = methods
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

// TODO: cache and remove these traversals for 0.4.
// Note that a timeout of 0 means to inherit the parent.
function findTimeout(tests) {
    for (var i = tests.length - 1; i >= 0; i--) {
        if (tests[i].timeout) return tests[i].timeout
    }

    return 2000 // ms - default timeout
}

// Note that a slowness threshold of 0 means to inherit the parent.
function findSlow(tests) {
    for (var i = tests.length - 1; i >= 0; i--) {
        if (tests[i].slow) return tests[i].slow
    }

    return 75 // ms - default slow threshold
}

function makeSlice(tests, length) {
    var ret = new Array(length)

    for (var i = 0; i < length; i++) {
        ret[i] = {name: tests[i].name, index: tests[i].index}
    }

    return ret
}

function report(context, type, arg1, arg2) {
    function invokeReporter(reporter) {
        switch (type) {
        case Types.Start:
            return reporter(new Reports.Start())

        case Types.Enter:
            return reporter(
                new Reports.Enter(
                    makeSlice(context.tests, context.tests.length), arg1,
                    findSlow(context.tests)))

        case Types.Leave:
            return reporter(new Reports.Leave(
                makeSlice(context.tests, context.tests.length)))

        case Types.Pass:
            return reporter(
                new Reports.Pass(
                    makeSlice(context.tests, context.tests.length), arg1,
                    findSlow(context.tests)))

        case Types.Fail:
            return reporter(
                new Reports.Fail(
                    makeSlice(context.tests, context.tests.length), arg1, arg2,
                    findSlow(context.tests),
                    !!context.root.current.isFailable))

        case Types.Skip:
            return reporter(new Reports.Skip(
                makeSlice(context.tests, context.tests.length)))

        case Types.End:
            return reporter(new Reports.End())

        case Types.Error:
            return reporter(new Reports.Error(arg1))

        case Types.Hook:
            // Include the last test. This also implicitly sets the end to 0 for
            // root tests.
            return reporter(new Reports.Hook(
                makeSlice(context.tests, context.tests.length),
                makeSlice(context.tests, context.tests.indexOf(arg1) + 1),
                arg2))

        default:
            throw new TypeError("unreachable")
        }
    }

    return Promise.resolve()
    .then(function () {
        if (context.root.reporter == null) return undefined
        return invokeReporter(context.root.reporter)
    })
    .then(function () {
        var reporters = context.root.reporters

        // Two easy cases.
        if (reporters.length === 0) return undefined
        if (reporters.length === 1) return invokeReporter(reporters[0])
        return Promise.all(reporters.map(invokeReporter))
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
    var tryBody = try1(test.callback, test.methods, test.methods)
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
        var maxTimeout = findTimeout(context.tests)

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
        return invokeHook(test, test.beforeEach, Types.BeforeEach)
    } else {
        return invokeBeforeEach(test.parent).then(function () {
            return invokeHook(test, test.beforeEach, Types.BeforeEach)
        })
    }
}

function invokeAfterEach(test) {
    if (test.root === test) {
        return invokeHook(test, test.afterEach, Types.AfterEach)
    } else {
        return invokeHook(test, test.afterEach, Types.AfterEach)
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
            return report(context, Types.Hook, e.test, e.error)
        })
        .then(leave, function (e) { leave(); throw e })
    }

    var ran = false

    return peach(test.tests, function (child) {
        // Only skipped tests have no callback
        if (child.callback == null) {
            test.root.current = child
            context.tests.push(child)

            return report(context, Types.Skip)
            .then(leave, function (e) { leave(); throw e })
        } else if (!isOnly(child)) {
            return Promise.resolve()
        } else if (ran) {
            return runChild(child)
        } else {
            ran = true
            return invokeHook(test, test.beforeAll, Types.BeforeAll)
            .then(function () { return runChild(child) })
        }
    })
    .then(function () {
        return ran ? invokeHook(test, test.afterAll, Types.AfterAll) : undefined
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
            return report(context, Types.Fail, result.value, result.time)
        } else if (test.tests != null) {
            // Report this as if it was a parent test if it's passing and has
            // children.
            return report(context, Types.Enter, result.time)
            .then(function () { return runChildTests(test, context) })
            .then(function () { return report(context, Types.Leave) })
            .catch(function (e) {
                if (!(e instanceof ErrorWrap)) throw e
                return report(context, Types.Leave).then(function () {
                    return report(context, Types.Hook, e.test, e.error)
                })
            })
        } else {
            return report(context, Types.Pass, result.time)
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
    return report(context, Types.Start)
    .then(function () { return runChildTests(root, context) })
    .catch(function (e) {
        if (!(e instanceof ErrorWrap)) throw e
        return report(context, Types.Hook, e.test, e.error)
    })
    .then(function () { return report(context, Types.End) })
    // Tell the reporter something happened. Otherwise, it'll have to wrap this
    // method in a plugin, which shouldn't be necessary.
    .catch(function (e) {
        return report(context, Types.Error, e).then(function () { throw e })
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
