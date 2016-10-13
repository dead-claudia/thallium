"use strict"

var Promise = require("./bluebird.js")
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
 *    dispatch. There is no behavioral OO with methods/etc. beyond the API.
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

function r(type, value, duration) {
    return {type: type, value: value, duration: duration}
}

function Result(time, attempt) {
    this.time = time
    this.caught = attempt.caught
    this.value = attempt.caught ? attempt.value : undefined
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
})

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
        default: throw new Error("unreachable")
        }
    },

    /**
     * So util.inspect provides more sensible output for testing/etc.
     */
    inspect: function () {
        var self = this

        // Avoid a recursive call when `inspect`ing a result while still keeping
        // it styled like it would be normally. The named singleton factory is
        // to ensure engines show the `name`/`displayName` for the type.
        return new function Report() {
            this.type = self.type()
            this.path = self.path

            // Only add the relevant properties
            if (self.fail() || self.error()) {
                this.value = self.value
            } else if (self.enter() || self.pass() || self.fail()) {
                this.duration = self.duration
                this.slow = self.slow
            }
        }()
    },
})

function Data(name, index, parent, context) {
    this.name = name
    this.index = index
    this.parent = parent
    this.context = context
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
        ret.push({name: test.data.name, index: test.data.index|0})
        test = test.data.parent
    }

    return ret.reverse()
}

function report(test, args) {
    // Reporters are allowed to block, and these are always called first.
    var promise = Promise.resolve()
    var concurrent = []

    function invokeReporter(reporter) {
        var duration = -1
        var slowTimeout = 0

        if (args.type === Types.Pass ||
                args.type === Types.Fail ||
                args.type === Types.Enter) {
            duration = args.duration
            slowTimeout = slow(test)
        }

        return reporter(
            new Report(args.type, path(test), args.value,
                duration, slowTimeout))
    }

    for (var i = 0; i < test.reporters.length; i++) {
        var reporter = test.reporters[i]

        if (reporter.block) {
            promise = promise.return(reporter).then(invokeReporter)
        } else {
            concurrent.push(reporter)
        }
    }

    return promise
    .return(concurrent).map(invokeReporter)
    .return()
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

/**
 * Block tests
 */

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

/**
 * Inline tests
 */

var warnOnEmptyInline = typeof global.console === "object" &&
    global.console != null && typeof global.console.warn === "function"

function warnEmptyInline(test) {
    var name = ""

    while (!(test.status & Flags.Root)) {
        name = test.data.name + " " + name
        test = test.data.parent
    }

    global.console.warn("WARNING: In test: " + name.slice(0, -1))
    global.console.warn("WARNING: inline test defined without body. Did you mean to use `t.testSkip()`?") // eslint-disable-line max-len
    global.console.warn("WARNING: ======================================================================") // eslint-disable-line max-len
}

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

function invokeInline(test) {
    var inline = test.data.context

    // An inline test without assertions or children is likely a mistake,
    // and they probably meant to use `t.testSkip()` instead.
    if (shouldWarnEmpty(test, inline.length)) warnEmptyInline(test)

    var start = now()
    var attempt = tryPass()

    // Stop immediately like what block tests do.
    for (var i = 0; i < inline.length && !attempt.caught; i++) {
        attempt = tryN(inline[i].func, undefined, inline[i].args)
    }

    return new Result(now() - start, attempt)
}

function getThen(res) {
    if (typeof res === "object" || typeof res === "function") {
        return res.then
    } else {
        return undefined
    }
}

function invokeAsync(test, res, start, resolve, reject) { // eslint-disable-line max-params, max-len
    var resolved = false
    var timer

    function asyncFinish(attempt) {
        // Capture immediately. Worst case scenario, it gets thrown away.
        var end = now()

        if (resolved) return
        if (timer) {
            clearTimeout.call(global, timer)
            timer = null
        }

        resolved = true
        resolve(new Result(end - start, attempt))
    }

    Promise.resolve(res).then(
        function () { asyncFinish(tryPass()) },
        function (e) { asyncFinish(tryFail(addStack(e))) })
    .catch(reject)

    // Set the timeout *after* initialization. The timeout will likely be
    // specified during initialization.
    var maxTimeout = timeout(test)

    // Setting a timeout is pointless if it's infinite.
    if (maxTimeout !== Infinity) {
        timer = setTimeout.call(global, function () {
            asyncFinish(tryFail(addStack(
                new Error("Timeout of " + maxTimeout + " reached"))))
        }, maxTimeout)
    }
}

// Avoid a closure if possible, in case it doesn't return a thenable.
function invokeBlock(test) {
    var start = now()
    var tryBody = try2(test.data.context, test.methods, test.methods)

    // Note: synchronous failures are test failures, not fatal errors.
    if (tryBody.caught) return new Result(now() - start, tryBody)
    var res = tryBody.value
    var tryThen = try1(getThen, undefined, res)

    if (tryThen.caught) return new Result(now() - start, tryThen)
    var then = tryThen.value

    if (typeof then !== "function") return new Result(now() - start, tryThen)

    return new Promise(function (resolve, reject) {
        invokeAsync(test, res, start, resolve, reject)
    })
}

function invokeInit(test) {
    if (test.status & Flags.Inline) {
        return invokeInline(test)
    } else {
        return invokeBlock(test)
    }
}

function runChildTests(test) {
    var p = Promise.resolve()

    for (var i = 0; i < test.tests.length; i++) {
        p = p.return(test.tests[i]).then(runTest)
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
    return report(test, r(type, undefined, -1))
}

function runRootTest(test) {
    return reportSimple(test, Types.Start)
    .then(function () {
        deinitTest(test)
        return runChildTests(test)
    })
    .then(function () { return reportSimple(test, Types.End) })
    // Tell the reporter something happened. Otherwise, it'll have to wrap this
    // method in a plugin, which shouldn't be necessary.
    .catch(function (e) {
        return report(test, r(Types.Error, e, -1)).throw(e)
    })
    // Don't forget to reinit the inline tests
    .finally(function () { reinitInline(test) })
}

function runNormalChild(test) {
    test.status |= Flags.Init

    return Promise.resolve(invokeInit(test))
    .then(function (result) {
        deinitTest(test)

        if (result.caught) {
            return report(test, r(Types.Fail, result.value, result.time))
        } else if (test.tests.length !== 0) {
            // Report this as if it was a parent test if it's passing and has
            // children.
            return report(test, r(Types.Enter, undefined, result.time))
            .then(function () { return runChildTests(test) })
            .then(function () { return reportSimple(test, Types.Leave) })
        } else {
            return report(test, r(Types.Pass, undefined, result.time))
        }
    })
    .finally(function () { resetTest(test) })
}

function runTestBody(test) {
    if (test.status & Flags.HasSkip) {
        return reportSimple(test, Types.Skip)
    } else if (test.status & Flags.Root) {
        return runRootTest(test)
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
function runTest(test) {
    if (test.status & Flags.Dummy) {
        return Promise.resolve()
    }

    test.status |= Flags.Running

    return runTestBody(test)
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

exports.block = function (methods, name, index, callback) {
    return createTest(methods, 0, new Data(name, index, methods._, callback))
}

/**
 * Base tests (i.e. default export, result of `t.create()`).
 */

exports.base = function (methods) {
    return new Base(
        methods,
        Flags.Root | Flags.Init | Flags.HasReporter | Flags.OnlyChild,
        [],
        undefined)
}

/**
 * Either a skipped block test through `t.testSkip()`.
 */
exports.skipBlock = function (methods, name, index) {
    return createTest(methods, Flags.Skipped | Flags.HasSkip,
        new Data(name, index, methods._, undefined))
}

/**
 * Various inline tests - all are initialized on creation because the methods
 * are immediately returned instead of being revealed through the callback.
 */

/**
 * Normal inline tests, through `t.test()`.
 */
exports.inline = function (methods, name, index) {
    return createTest(methods, Flags.Init | Flags.Inline,
        new Data(name, index, methods._, []))
}

/**
 * Dummy inline tests, either tests filtered out by `t.only()` or children of
 * inline `t.testSkip()` tests. They do nothing when run.
 */
exports.dummyInline = function (methods, name, index) {
    var test = createTest(methods,
        Flags.Skipped | Flags.Dummy | Flags.Init | Flags.Inline,
        new Data(name, index, methods._, []))

    test.status &= ~Flags.OnlyChild
    return test
}

/**
 * Skipped inline tests, through `t.testSkip()`. They report themselves as
 * skipped.
 */
exports.skipInline = function (methods, name, index) {
    return createTest(methods,
        Flags.Skipped | Flags.HasSkip | Flags.Init | Flags.Inline,
        new Data(name, index, methods._, []))
}
