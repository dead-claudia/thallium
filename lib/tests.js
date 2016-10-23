"use strict"

var peach = require("./util.js").peach
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
    Locked:    0x01, // If the test is locked.
    Root:      0x02, // If the test is the root test.
    Reporting: 0x04, // If the test has its own reporters
    Skipped:   0x08, // If the test is explicitly skipped.
})

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

    // Note that `Hook` is denoted by the 4th bit set.
    Hook: 8,
    BeforeAll: 8 | 0,
    BeforeEach: 8 | 1,
    AfterEach: 8 | 2,
    AfterAll: 8 | 3,
})

exports.Report = Report
function Report(type) {
    this._ = type
}

// Avoid a recursive call when `inspect`ing a result while still keeping it
// styled like it would be normally. The named singleton factory is to ensure
// engines show the correct `name`/`displayName` for the type.
var ReportInspect = (function () {
    return function Report(report) {
        this.type = report.type

        var type = report._ & Types.Mask

        if (type & Types.Hook) {
            this.stage = report.stage
        }

        if (type !== Types.Start &&
                type !== Types.End &&
                type !== Types.Error) {
            this.path = report.path
        }

        // Only add the relevant properties
        if (type === Types.Fail ||
                type === Types.Error ||
                type & Types.Hook) {
            this.value = report.value
        }

        if (type === Types.Enter ||
                type === Types.Pass ||
                type === Types.Fail) {
            this.duration = report.duration
            this.slow = report.slow
        }
    }
})()

methods(Report, {
    // The report types
    get isStart() { return this._ === Types.Start },
    get isEnter() { return this._ === Types.Enter },
    get isLeave() { return this._ === Types.Leave },
    get isPass() { return this._ === Types.Pass },
    get isFail() { return this._ === Types.Fail },
    get isSkip() { return this._ === Types.Skip },
    get isEnd() { return this._ === Types.End },
    get isError() { return this._ === Types.Error },
    get isHook() { return (this._ & Types.Hook) !== 0 },

    /**
     * Get a stringified description of the type.
     */
    get type() {
        switch (this._) {
        case Types.Start: return "start"
        case Types.Enter: return "enter"
        case Types.Leave: return "leave"
        case Types.Pass: return "pass"
        case Types.Fail: return "fail"
        case Types.Skip: return "skip"
        case Types.End: return "end"
        case Types.Error: return "error"
        default:
            if (this._ & Types.Hook) return "hook"
            throw new Error("unreachable")
        }
    },

    /**
     * So util.inspect provides more sensible output for testing/etc.
     */
    inspect: function () {
        return new ReportInspect(this)
    },
})

methods(StartReport, Report)
function StartReport() {
    Report.call(this, Types.Start)
}

methods(EnterReport, Report)
function EnterReport(path, duration, slow) {
    Report.call(this, Types.Enter)
    this.path = path
    this.duration = duration
    this.slow = slow
}

methods(LeaveReport, Report)
function LeaveReport(path) {
    Report.call(this, Types.Leave)
    this.path = path
}

methods(PassReport, Report)
function PassReport(path, duration, slow) {
    Report.call(this, Types.Pass)
    this.path = path
    this.duration = duration
    this.slow = slow
}

methods(FailReport, Report)
function FailReport(path, error, duration, slow) {
    Report.call(this, Types.Fail)
    this.path = path
    this.error = error
    this.duration = duration
    this.slow = slow
}

methods(SkipReport, Report)
function SkipReport(path) {
    Report.call(this, Types.Skip)
    this.path = path
}

methods(EndReport, Report)
function EndReport() {
    Report.call(this, Types.End)
}

methods(ErrorReport, Report)
function ErrorReport(error) {
    Report.call(this, Types.Error)
    this.error = error
}

exports.HookError = HookError
function HookError(stage, func, error) {
    this._ = stage
    this.name = func.name || func.displayName || ""
    this.error = error
}
methods(HookError, {
    get stage() {
        switch (this._) {
        case Types.BeforeAll: return "before all"
        case Types.BeforeEach: return "before each"
        case Types.AfterEach: return "after each"
        case Types.AfterAll: return "after all"
        default: throw new Error("unreachable")
        }
    },
})

function HookReport(path, hookError) {
    Report.call(this, hookError._)
    this.path = path
    this.name = hookError.name
    this.error = hookError.error
}
methods(HookReport, Report, {
    get stage() {
        switch (this._) {
        case Types.BeforeAll: return "before all"
        case Types.BeforeEach: return "before each"
        case Types.AfterEach: return "after each"
        case Types.AfterAll: return "after all"
        default: throw new Error("unreachable")
        }
    },

    get hookError() { return new HookError(this._, this, this.error) },

    get isBeforeAll() { return this._ === Types.BeforeAll },
    get isBeforeEach() { return this._ === Types.BeforeEach },
    get isAfterEach() { return this._ === Types.AfterEach },
    get isAfterAll() { return this._ === Types.AfterAll },
})

exports.Reports = Object.freeze({
    Start: StartReport,
    Enter: EnterReport,
    Leave: LeaveReport,
    Pass: PassReport,
    Fail: FailReport,
    Skip: SkipReport,
    End: EndReport,
    Error: ErrorReport,
    Hook: HookReport,
})

function Test(methods, status, reporters, blocking, name, index, parent, callback, current) { // eslint-disable-line max-params, max-len
    // The methods in the public API.
    this.methods = methods

    // The status of this test, a mask detailed in the Flags enum.
    this.status = status

    // The active, not necessarily own, reporter list.
    this.reporters = reporters
    this.blocking = blocking

    // The test-specific data.
    this.tests = []
    this.beforeAll = []
    this.afterAll = []
    this.beforeEach = []
    this.afterEach = []

    this.name = name
    this.index = index|0
    this.parent = parent
    this.callback = callback

    // For the root test, this is the currently executing test. For child tests,
    // this points to the root test.
    this.current = current

    // Placeholder for `only` tree
    this.only = undefined

    // So `reflect` instances are persistent
    this.reflect = undefined

    // 0 means inherit timeout
    this.timeout = 0

    // 0 means inherit slow timeout.
    this.slow = 0
}

function Root(methods) {
    Test.call(this,
        methods,
        Flags.Root | Flags.Reporting,
        [], [],
        undefined, 0, undefined, undefined,
        {value: this})
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

exports.addNormal = function (parent, name, callback) {
    var child = Object.create(parent.methods)
    var base = child._ = new Test(
        child, Flags.Locked,
        parent.reporters, parent.blocking,
        name, parent.tests.length, parent, callback,
        parent.current)

    parent.tests.push(base)
}

/**
 * Either a skipped block test through `t.testSkip()`.
 */
exports.addSkipped = function (parent, name) {
    var child = Object.create(parent.methods)
    var base = child._ = new Test(
        child, Flags.Locked | Flags.Skipped,
        parent.reporters, parent.blocking,
        name, parent.tests.length, parent, undefined,
        parent.current)

    parent.tests.push(base)
}

/**
 * Execute the tests
 */

function path(test) {
    var ret = []

    while (!(test.status & Flags.Root)) {
        ret.push({name: test.name, index: test.index|0})
        test = test.parent
    }

    return ret.reverse()
}

// Note that a timeout of 0 means to inherit the parent.
exports.timeout = timeout
function timeout(test) {
    while (test.timeout === 0 && !(test.status & Flags.Root)) {
        test = test.parent
    }

    return test.timeout !== 0 ? test.timeout : 2000 // ms - default timeout
}

// Note that a slowness threshold of 0 means to inherit the parent.
exports.slow = slow
function slow(test) {
    while (test.slow === 0 && !(test.status & Flags.Root)) {
        test = test.parent
    }

    return test.slow !== 0 ? test.slow : 75 // ms - default slow threshold
}

function report(test, type, arg1, arg2) {
    // Reporters are allowed to block, and these are always called first.
    var blocking = []
    var concurrent = []
    var len = test.reporters.length

    function invokeReporter(reporter) {
        switch (type) {
        case Types.Start:
            return reporter(new StartReport())

        case Types.Enter:
            return reporter(new EnterReport(path(test), arg1, slow(test)))

        case Types.Leave:
            return reporter(new LeaveReport(path(test)))

        case Types.Pass:
            return reporter(new PassReport(path(test), arg1, slow(test)))

        case Types.Fail:
            return reporter(new FailReport(path(test), arg1, arg2, slow(test)))

        case Types.Skip:
            return reporter(new SkipReport(path(test)))

        case Types.End:
            return reporter(new EndReport())

        case Types.Error:
            return reporter(new ErrorReport(arg1))

        case Types.Hook:
            return reporter(new HookReport(path(test), arg1))

        default:
            throw new TypeError("unreachable")
        }
    }

    // Two easy cases.
    if (len === 0) return Promise.resolve()
    if (len === 1) {
        return new Promise(function (resolve) {
            return resolve(invokeReporter(test.reporters[0]))
        })
    }

    for (var i = 0; i < len; i++) {
        if (test.blocking[i]) {
            blocking.push(test.reporters[i])
        } else {
            concurrent.push(test.reporters[i])
        }
    }

    return peach(blocking, invokeReporter)
    .then(function () { return Promise.all(concurrent.map(invokeReporter)) })
}

/**
 * Block tests
 */

// PhantomJS and IE don't add the stack until it's thrown. In failing async
// tests, it's already thrown in a sense, so this should be normalized with
// other test types.
var mustAddStack = typeof new Error().stack !== "string"

function addStack(e) {
    try { throw e } finally { return e }
}

function getThen(res) {
    if (typeof res === "object" || typeof res === "function") {
        return res.then
    } else {
        return undefined
    }
}

function AsyncState(start, resolve) {
    this.start = start
    this.resolve = resolve
    this.resolved = false
    this.timer = undefined
}

function asyncFinish(state, attempt) {
    // Capture immediately. Worst case scenario, it gets thrown away.
    var end = now()

    if (state.resolved) return
    if (state.timer) {
        clearTimeout.call(global, state.timer)
        state.timer = undefined
    }

    state.resolved = true
    state.resolve(new Result(end - state.start, attempt))
}

// Avoid a closure if possible, in case it doesn't return a thenable.
function invokeInit(test) {
    var start = now()
    var tryBody = try1(test.callback, test.methods, test.methods)

    // Note: synchronous failures are test failures, not fatal errors.
    if (tryBody.caught) return new Result(now() - start, tryBody)
    var tryThen = try1(getThen, undefined, tryBody.value)

    if (tryThen.caught || typeof tryThen.value !== "function") {
        return new Result(now() - start, tryThen)
    }

    return new Promise(function (resolve) {
        var state = new AsyncState(start, resolve)
        var result = try2(tryThen.value, tryBody.value,
            function () {
                if (state == null) return
                asyncFinish(state, tryPass())
                state = undefined
            },
            function (e) {
                if (state == null) return
                asyncFinish(state, tryFail(
                    mustAddStack || e instanceof Error && e.stack == null
                        ? addStack(e) : e))
                state = undefined
            })

        if (result.caught) {
            asyncFinish(state, result)
            state = undefined
            return
        }

        // Set the timeout *after* initialization. The timeout will likely be
        // specified during initialization.
        var maxTimeout = timeout(test)

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

function invokeHook(list, stage) {
    return peach(list, function (hook) {
        try {
            return hook()
        } catch (e) {
            throw new HookError(stage, hook, e)
        }
    })
}

function invokeBeforeEach(test) {
    if (test.status & Flags.Root) {
        return invokeHook(test.beforeEach, Types.BeforeEach)
    } else {
        return invokeBeforeEach(test.parent).then(function () {
            return invokeHook(test.beforeEach, Types.BeforeEach)
        })
    }
}

function invokeAfterEach(test) {
    if (test.status & Flags.Root) {
        return invokeHook(test.afterEach, Types.AfterEach)
    } else {
        return invokeHook(test.afterEach, Types.AfterEach)
        .then(function () { return invokeAfterEach(test.parent) })
    }
}

/**
 * The whitelist is actually stored as a tree for faster lookup times when there
 * are multiple selectors. Objects can't be used for the nodes, where keys
 * represent values and values represent children, because regular expressions
 * aren't possible to use.
 */

function isEquivalent(entry, item) {
    if (typeof entry === "string" && typeof item === "string") {
        return entry === item
    } else if (entry instanceof RegExp && item instanceof RegExp) {
        return entry.toString() === item.toString()
    } else {
        return false
    }
}

function matches(entry, item) {
    if (typeof entry === "string") {
        return entry === item
    } else {
        return entry.test(item)
    }
}

function Only(value) {
    this.value = value
    this.children = []
}

function findEquivalent(node, entry) {
    for (var i = 0; i < node.children.length; i++) {
        var child = node.children[i]

        if (isEquivalent(child.value, entry)) return child
    }

    return undefined
}

function findMatches(node, entry) {
    for (var i = 0; i < node.children.length; i++) {
        var child = node.children[i]

        if (matches(child.value, entry)) return child
    }

    return undefined
}

/**
 * Add a number of selectors
 *
 * @this {Test}
 */
exports.onlyAdd = function (/* ...selectors */) {
    this.only = new Only()

    for (var i = 0; i < arguments.length; i++) {
        var selector = arguments[i]

        if (!Array.isArray(selector)) {
            throw new TypeError(
                "Expected selector " + i + " to be an array")
        }

        onlyAddSingle(this.only, selector, i)
    }
}

function onlyAddSingle(node, selector, index) {
    for (var i = 0; i < selector.length; i++) {
        var entry = selector[i]

        // Strings and regular expressions are the only things allowed.
        if (typeof entry !== "string" && !(entry instanceof RegExp)) {
            throw new TypeError(
                "Selector " + index + " must consist of only strings and/or " +
                "regular expressions")
        }

        var child = findEquivalent(node, entry)

        if (child == null) {
            child = new Only(entry)
            node.children.push(child)
        }

        node = child
    }
}

/**
 * This checks if the test was whitelisted in a `t.only()` call, or for
 * convenience, returns `true` if `t.only()` was never called. Note that `path`
 * is assumed to be an array-based stack, and it will be mutated.
 */
function isOnly(test) {
    var path = []
    var i = 0

    while (!(test.status & Flags.Root) && test.only == null) {
        path.push(test.name)
        test = test.parent
        i++
    }

    // If there isn't any `only` active, then let's skip the check and return
    // `true` for convenience.
    var only = test.only

    if (only != null) {
        while (i !== 0) {
            only = findMatches(only, path[--i])
            if (only == null) return false
        }
    }

    return true
}

function runChildTests(test) {
    if (test.tests.length === 0) return undefined

    var ran = false

    function runChild(child) {
        if (child.status & Flags.Skipped) {
            return report(child, Types.Skip)
        } else if (!isOnly(child)) {
            return Promise.resolve()
        } else if (ran) {
            return invokeBeforeEach(test)
            .then(function () { return runNormalChild(child) })
            .then(function () { return invokeAfterEach(test) })
        } else {
            ran = true
            return invokeHook(test.beforeAll, Types.BeforeAll)
            .then(function () { return invokeBeforeEach(test) })
            .then(function () { return runNormalChild(child) })
            .then(function () { return invokeAfterEach(test) })
        }
    }

    return peach(test.tests, function (child) {
        test.current.value = child
        return runChild(child).then(
            function () { test.current.value = test },
            function (e) { test.current.value = test; throw e })
    })
    .then(function () {
        return ran ? invokeHook(test.afterAll, Types.AfterAll) : undefined
    })
    .catch(function (e) {
        if (!(e instanceof HookError)) throw e
        return report(test, Types.Hook, e)
    })
}

function clearChildren(test) {
    for (var i = 0; i < test.tests.length; i++) {
        test.tests[i].tests = []
    }
}

function runNormalChild(test) {
    test.status &= ~Flags.Locked

    return Promise.resolve(invokeInit(test))
    .then(function (result) {
        test.status |= Flags.Locked

        if (result.caught) {
            return report(test, Types.Fail, result.value, result.time)
        } else if (test.tests.length !== 0) {
            // Report this as if it was a parent test if it's passing and has
            // children.
            return report(test, Types.Enter, result.time)
            .then(function () { return runChildTests(test) })
            .then(function () { return report(test, Types.Leave) })
        } else {
            return report(test, Types.Pass, result.time)
        }
    })
    .then(
        function () { clearChildren(test) },
        function (e) { clearChildren(test); throw e })
}

/**
 * This runs the root test and returns a promise resolved when it's done.
 */
exports.runTest = function (test) {
    test.status |= Flags.Locked

    return report(test, Types.Start)
    .then(function () { return runChildTests(test) })
    .then(function () { return report(test, Types.End) })
    // Tell the reporter something happened. Otherwise, it'll have to wrap this
    // method in a plugin, which shouldn't be necessary.
    .catch(function (e) {
        return report(test, Types.Error, e).then(function () { throw e })
    })
    .then(
        function () {
            clearChildren(test)
            test.status &= ~Flags.Locked
        },
        function (e) {
            clearChildren(test)
            test.status &= ~Flags.Locked
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
