"use strict"

var Promise = require("./bluebird.js")
var m = require("./messages.js")
var Errors = require("./errors.js")
var Resolver = require("./resolver.js")
var methods = require("./methods.js")

/**
 * The way the tests are laid out is very similar to the DCI (Data, Context,
 * Interaction) pattern. Here's how they loosely correlate:
 *
 * - The data types like `Base` represent the "Data".
 * - The tests' tags like async, inline, or skipped (represented as part of a
 *   bit mask detailed in the Flags enum), represent their "Roles".
 * - The `data` property of each test object, the test type-specific state,
 *   loosely represents the "Context".
 * - The `runTest` method and friends loosely represent the "Interactions".
 *
 * This is more of a coincidence than anything, since I didn't write this with
 * DCI in mind, but it just ended up the easiest way to structure and implement
 * the framework's core. Also, unlike traditional DCI, there are a few
 * differences:
 *
 * 1. The "interactions" are done partially via a centralized static function
 *    dispatch, rather than completely via a dynamic, decentralized object-based
 *    dispatch. Object orientation is minimal, almost to the point of C, but
 *    there is exactly one dynamically called function: `test.data.state.init`.
 *
 * 2. The "role" and "context" are highly coupled in their types and
 *    "interactions". This is because the test state is inherently coupled to
 *    the test type (inline tests don't need the same data that async tests do,
 *    for example).
 */

// Prevent Sinon interference when they install their mocks
var setTimeout = global.setTimeout
var clearTimeout = global.clearTimeout
var now = global.Date.now

/**
 * Basic data types
 */

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
    Inline:      0x0001, // If the test is inline, e.g. `t.test("test")`
    Async:       0x0002, // If the test is async, e.g. `t.async("test", ...)`
    Init:        0x0004, // If the test is initializing.
    Running:     0x0008, // If the test is currently running.
    Root:        0x0010, // If the test is the root test.
    HasOnly:     0x0020, // If the test has an `only` restriction.
    HasReporter: 0x0040, // If the test has its own reporters
    Skipped:     0x0080, // If the test is skipped or blacklisted by `t.only()`
    OnlyChild:   0x0100, // If the test is whitelisted by `t.only()`
    HasSkip:     0x0200, // If the test is explicitly skipped.
    Dummy:       0x0400, // If the test is inline and blacklisted by `t.only()`
})

exports.ExtraCall = ExtraCall
function ExtraCall(count, value, stack) {
    this.count = count
    this.value = value
    this.stack = stack
}

function R(type, value, duration) {
    this.type = type
    this.value = value
    this.duration = duration
}

function Result(time, attempt) {
    this.time = time
    this.caught = attempt.caught
    this.value = attempt.caught ? attempt.value : undefined
}

exports.Location = Location
function Location(name, index) {
    this.name = name
    this.index = index
}

var Types = exports.Types = Object.freeze({
    Start: 0,
    Enter: 1,
    Leave: 2,
    Pass: 3,
    Fail: 4,
    Skip: 5,
    End: 6,
    Error: 7,
    Extra: 8,
})

/**
 * Convert a stringified type to an internal numeric enum member.
 */
exports.toReportType = function (type) {
    switch (type) {
    case "start": return Types.Start
    case "enter": return Types.Enter
    case "leave": return Types.Leave
    case "pass": return Types.Pass
    case "fail": return Types.Fail
    case "skip": return Types.Skip
    case "end": return Types.End
    case "error": return Types.Error
    case "extra": return Types.Extra
    default: throw new RangeError(m("type.report.type.unknown", type))
    }
}

// Avoid a recursive call when `inspect`ing a result while still keeping it
// styled like it would be normally. The IIFE is mainly to doubly ensure engines
// don't muck up the `name`/`displayName` of the function.
var ReportWrapper = (function () {
    return function Report(report) {
        this.type = report.type()
        this.path = report.path

        // Only add the relevant properties
        if (report.fail() || report.error() || report.extra()) {
            this.value = report.value
        }

        if (report.enter() || report.pass() || report.fail()) {
            this.duration = report.duration
            this.slow = report.slow
        }
    }
})()

exports.Report = Report
function Report(type, path, value, duration, slow) { // eslint-disable-line max-params, max-len
    this._ = type
    this.path = path
    this.value = value
    this.duration = duration
    this.slow = slow
}

methods(Report, {
    // The report types
    start: function () { return this._ === Types.Start },
    enter: function () { return this._ === Types.Enter },
    leave: function () { return this._ === Types.Leave },
    pass: function () { return this._ === Types.Pass },
    fail: function () { return this._ === Types.Fail },
    skip: function () { return this._ === Types.Skip },
    end: function () { return this._ === Types.End },
    error: function () { return this._ === Types.Error },
    extra: function () { return this._ === Types.Extra },

    /**
     * Get a stringified description of the type.
     */
    type: function () {
        switch (this._) {
        case Types.Start: return "start"
        case Types.Enter: return "enter"
        case Types.Leave: return "leave"
        case Types.Pass: return "pass"
        case Types.Fail: return "fail"
        case Types.Skip: return "skip"
        case Types.End: return "end"
        case Types.Error: return "error"
        case Types.Extra: return "extra"
        default: throw new Error("unreachable")
        }
    },

    /**
     * So util.inspect provides more sensible output for testing/etc.
     */
    inspect: function () {
        return new ReportWrapper(this)
    },
})

function Data(name, index, parent, state) {
    this.name = name
    this.index = index
    this.parent = parent
    this.state = state
}

function Base(methods, status, reporters, data) {
    // The methods in the public API.
    this.methods = methods

    // The status of this test, a mask detailed in the Flags enum.
    this.status = status

    // The active, not necessarily own, reporter list.
    this.reporters = reporters

    // The test-specific data, if any. It exists only for the base.
    this.data = data
    this.plugins = []
    this.tests = []

    // Placeholder for `only` tree
    this.only = undefined

    // 0 means inherit timeout
    this.timeout = 0

    // 0 means inherit slow timeout.
    this.slow = 0
}

function createTest(methods, mask, data) {
    var child = Object.create(methods)

    return child._ = new Base(
       child,
       data.parent.status & (Flags.Skipped | Flags.OnlyChild) | mask,
       data.parent.reporters,
       data)
}

/**
 * Execute the tests
 */

function path(test) {
    var ret = []

    while (!(test.status & Flags.Root)) {
        ret.push(new Location(test.data.name, test.data.index))
        test = test.data.parent
    }

    return ret.reverse()
}

function makeReport(args, test) {
    var type = args.type

    if (type === Types.Pass || type === Types.Fail || type === Types.Enter) {
        return new Report(type, path(test), args.value, args.duration,
            slow(test))
    } else {
        return new Report(type, path(test), args.value, -1, 0)
    }
}

function report(test, args) {
    // Reporters are allowed to block, and these are always called first.
    var blocking = []
    var concurrent = []

    for (var i = 0; i < test.reporters.length; i++) {
        var reporter = test.reporters[i]

        if (reporter.block) {
            blocking.push(reporter)
        } else {
            concurrent.push(reporter)
        }
    }

    function pcall(reporter) {
        return Resolver.resolve1(reporter, undefined, makeReport(args, test))
    }

    return Promise.each(blocking, pcall)
    .return(concurrent)
    .map(pcall)
    .return()
}

exports.reportError = function (test, e) {
    return report(test, new R(Types.Error, e, -1))
}

// Note that a timeout of 0 means to inherit the parent.
exports.timeout = timeout
function timeout(test) {
    while (test.timeout === 0 && !(test.status & Flags.Root)) {
        test = test.data.parent
    }

    return test.timeout !== 0 ? test.timeout : 2000 // ms - default timeout
}

// Note that a slowness threshold of 0 means to inherit the parent.
exports.slow = slow
function slow(test) {
    while (test.slow === 0 && !(test.status & Flags.Root)) {
        test = test.data.parent
    }

    return test.slow !== 0 ? test.slow : 75 // ms - default slow threshold
}

function runChildTest(p, test) {
    return p.then(function () {
        return runTest(test, false)
    })
}

function runChildTests(tests) {
    var p = Promise.resolve()

    for (var i = 0; i < tests.length; i++) {
        p = runChildTest(p, tests[i])
    }

    return p
}

function deinitTest(test) {
    test.status &= ~Flags.Init

    for (var i = 0; i < test.tests.length; i++) {
        var child = test.tests[i]

        if (child.status & Flags.Inline) {
            deinitTest(child)
        }
    }
}

function reinitInline(test) {
    test.status |= Flags.Init
    for (var i = 0; i < test.tests.length; i++) {
        resetTest(test.tests[i])
    }
}

function breakReferences(test) {
    // This loop is to break all the circular references, to tell
    // not-as-sophisticated GCs it's safe to collect.
    for (var i = 0; i < test.tests.length; i++) {
        breakReferences(test.tests[i])
        test.tests[i].data = null
    }

    test.tests = []
}

function resetTest(test) {
    // If the children are accessible, don't forget to reinit the inline
    // tests. Otherwise, remove the child tests so running tests is
    // repeatable.
    if (test.status & Flags.Inline) {
        reinitInline(test)
    } else {
        for (var i = 0; i < test.tests.length; i++) {
            // Inline tests cannot be collected.
            if (!(test.tests[i].status & Flags.Inline)) {
                breakReferences(test.tests[i])
            }
        }

        test.tests = []
    }
}

function reportSimple(test, type) {
    return report(test, new R(type, undefined, -1))
}

function runSkipTest(test, isMain) {
    if (isMain) {
        return reportSimple(test, Types.Start)
        .then(function () { return reportSimple(test, Types.End) })
    } else {
        return reportSimple(test, Types.Skip)
    }
}

function runRootTest(test) {
    return reportSimple(test, Types.Start)
    .then(function () {
        deinitTest(test)
        return runChildTests(test.tests)
    })
    .then(function () { return reportSimple(test, Types.End) })
    // Don't forget to reinit the inline tests
    .finally(function () { reinitInline(test) })
}

function runMainChild(test) {
    return reportSimple(test, Types.Start)
    .then(function () {
        test.status |= Flags.Init

        return (0, test.data.state.init)(test)
    })
    .then(function (result) {
        deinitTest(test)

        // Errors at the top level are considered fatal for the parent.
        if (result.caught) throw result.value
        return runChildTests(test.tests)
        .then(function () { return reportSimple(test, Types.End) })
    })
    .finally(function () { resetTest(test) })
}

function runNormalChild(test) {
    test.status |= Flags.Init

    return Promise.resolve((0, test.data.state.init)(test))
    .then(function (result) {
        deinitTest(test)

        if (result.caught) {
            return report(test, new R(Types.Fail, result.value, result.time))
        } else if (test.tests.length !== 0) {
            // Report this as if it was a parent test if it's passing and has
            // children.
            return report(test, new R(Types.Enter, undefined, result.time))
            .then(function () { return runChildTests(test.tests) })
            .then(function () { return reportSimple(test, Types.Leave) })
        } else {
            return report(test, new R(Types.Pass, undefined, result.time))
        }
    })
    .finally(function () { resetTest(test) })
}

function runTestBody(test, isMain) {
    if (test.status & Flags.HasSkip) {
        return runSkipTest(test, isMain)
    } else if (test.status & Flags.Root) {
        return runRootTest(test)
    } else if (isMain) {
        return runMainChild(test)
    } else {
        return runNormalChild(test)
    }
}

/**
 * This runs the test, and returns a promise resolved when it's done.
 *
 * @param {Test} test The current test
 * @param {Boolean} isMain Whether the test is run directly as the main
 *                         test or as a child test.
 */
exports.runTest = runTest
function runTest(test, isMain) {
    if (test.status & Flags.Dummy) {
        return Promise.resolve()
    }

    if (test.status & Flags.Running) {
        throw new Error(m("run.concurrent"))
    }

    test.status |= Flags.Running

    return runTestBody(test, !!isMain)
    .finally(function () { test.status &= ~Flags.Running })
}

// Help optimize for inefficient exception handling in most JS engines

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

function tryPass(value) {
    return {caught: false, value: value}
}

function tryFail(e) {
    return {caught: true, value: e}
}

function try1(f, inst, arg) {
    try {
        return tryPass(f.call(inst, arg))
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

function tryN(f, inst, args) {
    try {
        return tryPass(apply(f, inst, args))
    } catch (e) {
        return tryFail(e)
    }
}

/**
 * Set up each test type.
 */

/**
 * Async tests
 */

function part1(f, arg1) {
    return function (arg2) {
        return f(arg1, arg2)
    }
}

function bind1(f, arg) {
    return function () {
        return f(arg)
    }
}

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
    var attempt = try1(func, iter.gen, value)

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
        part1(iterNext, iter),
        part1(iterThrow, iter))
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
    return state.resolve(new Result(end - state.start, attempt))
}

function asyncPass(state) {
    return asyncFinish(state, tryPass())
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
    return asyncFinish(state, tryFail(addStack(e)))
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

        report(state.test, new R(
            Types.Extra,
            // Trim the initial newline
            new ExtraCall(state.count, err, Errors.getStack(e).slice(1)),
            -1))

        return undefined
    }

    if (err != null) return asyncFail(state, err)
    else return asyncPass(state)
}

function checkSpecial(state, res) {
    // It can't be interesting if the result's nullish.
    state.interesting = res != null

    var isThenable = try1(Resolver.isThenable, undefined, res)

    if (isThenable.caught) return asyncFail(state, isThenable.value)

    if (isThenable.value) {
        Promise.resolve(res).then(
            bind1(asyncPass, state),
            part1(asyncFail, state))
        return undefined
    }

    var isIterator = try1(Resolver.isIterator, undefined, res)

    if (isIterator.caught) return asyncFail(state, isIterator.value)

    if (isIterator.value) {
        // No, Bluebird's coroutines don't work.
        iterate(res).then(
            bind1(asyncPass, state),
            part1(asyncFail, state))
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
    var callback = part1(asyncCallback, state)
    var init = state.test.data.state.callback

    state.start = now()

    var res = try2(init, methods, methods, callback)

    // Note: synchronous failures when initializing an async test are test
    // failures, not fatal errors.

    if (res.caught) return asyncFail(state, res.value)

    checkSpecial(state, res.value)

    // If an error was thrown from `checkSpecial()`, don't set the timer.
    if (!state.resolved) {
        // Set the timeout *after* initialization. The timeout will likely be
        // specified during initialization.

        state.timeout = timeout(state.test)

        // Don't bother checking/setting a timeout if it was `Infinity`.
        if (state.timeout !== Infinity) {
            state.timer = setTimeout(bind1(asyncTimeout, state), state.timeout)
        }
    }

    return undefined
}

function asyncInit(test) {
    return new Promise(function (resolve) {
        return asyncRun(new AsyncState(test, resolve))
    })
}

exports.async = function (methods, name, index, callback) {
    return createTest(methods, Flags.Async,
        new Data(name, index, methods._, {
            callback: callback,
            init: asyncInit,
        }))
}

/**
 * Base tests (i.e. default export, result of `t.base()`).
 */

exports.base = function (methods) {
    return new Base(
        methods,
        Flags.Root | Flags.Init | Flags.HasReporter | Flags.OnlyChild,
        [],
        undefined)
}

/**
 * The sync namespace, for `t.test()`. This includes both inline and block
 * tests.
 */

/* eslint-disable no-undef */

var warnOnEmptyInline = typeof console === "object" && console != null &&
    typeof console.warn === "function"

function warnEmptyInline(test) {
    var name = ""

    while (!(test.status & Flags.Root)) {
        name = test.data.name + " " + name
        test = test.data.parent
    }

    console.warn(m("missing.inline.body.0", name.slice(0, -1)))
    console.warn(m("missing.inline.body.1"))
    console.warn(m("missing.inline.body.2"))
}

/* eslint-enable no-undef */

// Exported for testing - empty inline tests are way too frequently used in
// testing, but they're likely a mistake normally
exports.silenceEmptyInlineWarnings = function () {
    warnOnEmptyInline = false
}

function shouldWarnEmpty(test, inlineLength) {
    return warnOnEmptyInline &&
        !(test.status & Flags.HasSkip) &&
        inlineLength === 0 &&
        test.tests.length === 0
}

function inlineInit(test) {
    var inline = test.data.state.inline
    var end = inline.length

    // An inline test without assertions or children is likely a mistake, and
    // they probably meant to use `t.testSkip()` instead.
    if (shouldWarnEmpty(test, end)) warnEmptyInline(test)

    var start = now()
    var attempt = tryPass()

    // Stop immediately like what block tests do.
    for (var i = 0; i < end && !attempt.caught; i++) {
        attempt = tryN(inline[i].run, undefined, inline[i].args)
    }

    return new Result(now() - start, attempt)
}

function initInline(methods, name, index, mask) {
    // Initialize the test now, because the methods are immediately
    // returned, instead of being revealed through the callback.
    return createTest(methods, mask | Flags.Init | Flags.Inline,
        new Data(name, index, methods._, {
            inline: [],
            init: inlineInit,
        }))
}

/**
 * Normal inline tests, through `t.test()`.
 */
exports.syncInline = function (methods, name, index) {
    return initInline(methods, name, index, 0)
}

function blockInit(test) {
    var init = test.data.state.callback
    var start = now()
    var attempt = try1(init, test.methods, test.methods)

    return new Result(now() - start, attempt)
}

/**
 * Sync block tests, through `t.test()`.
 */
exports.syncBlock = function (methods, name, index, callback) {
    return createTest(methods, 0,
        new Data(name, index, methods._, {
            callback: callback,
            init: blockInit,
        }))
}

/**
 * Dummy inline tests, either tests filtered out by `t.only()` or children of
 * inline `t.testSkip()` tests. They do nothing when run.
 */
exports.dummyInline = function (methods, name, index) {
    var test = initInline(methods, name, index, Flags.Skipped | Flags.Dummy)

    test.status &= ~Flags.OnlyChild
    return test
}

/**
 * Skipped inline tests, through `t.testSkip()`. Note that this still has to
 * look like an inline test, because the methods still have to be exposed, even
 * though the tests aren't run.
 */
exports.skipInline = function (methods, name, index) {
    return initInline(methods, name, index, Flags.Skipped | Flags.HasSkip)
}

/**
 * Either a skipped block test through `t.testSkip()` or a skipped async test
 * through `t.asyncSkip()`.
 */
exports.skipBlock = function (methods, name, index) {
    return createTest(methods, Flags.Skipped | Flags.HasSkip,
        new Data(name, index, methods._, undefined))
}
