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
    Locked:    0x01, // If the test is locked.
    Root:      0x02, // If the test is the root test.
    Reporting: 0x04, // If the test has its own reporters
    Skipped:   0x08, // If the test is explicitly skipped.
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
    Hook: 8,
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
    get start() { return this._ === Types.Start },
    get enter() { return this._ === Types.Enter },
    get leave() { return this._ === Types.Leave },
    get pass() { return this._ === Types.Pass },
    get fail() { return this._ === Types.Fail },
    get skip() { return this._ === Types.Skip },
    get end() { return this._ === Types.End },
    get error() { return this._ === Types.Error },
    get hook() { return this._ === Types.Hook },

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
        case Types.Hook: return "hook"
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
            this.type = self.type
            this.path = self.path

            // Only add the relevant properties
            if (self.fail || self.error || self.hook) {
                this.value = self.value
            }

            if (self.enter || self.pass || self.fail) {
                this.duration = self.duration
                this.slow = self.slow
            }
        }()
    },
})

function Base(methods, status, reporters, blocking, name, index, parent, callback) { // eslint-disable-line max-params, max-len
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

    // Placeholder for `only` tree
    this.only = undefined

    // 0 means inherit timeout
    this.timeout = 0

    // 0 means inherit slow timeout.
    this.slow = 0
}

/**
 * Base tests (i.e. default export, result of `internal.createBase()`).
 */

exports.base = function (methods) {
    return new Base(
        methods,
        Flags.Root | Flags.Reporting,
        [], [],
        undefined, 0, undefined, undefined)
}

/**
 * Set up each test type.
 */

exports.addNormal = function (parent, name, callback) {
    var child = Object.create(parent.methods)
    var base = child._ = new Base(
        child, 0,
        parent.reporters, parent.blocking,
        name, parent.tests.length, parent, callback)

    parent.tests.push(base)
}

/**
 * Either a skipped block test through `t.testSkip()`.
 */
exports.addSkipped = function (parent, name) {
    var child = Object.create(parent.methods)
    var base = child._ = new Base(
        child, Flags.Skipped,
        parent.reporters, parent.blocking,
        name, parent.tests.length, parent, undefined)

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
        if (test.blocking[i]) {
            promise = promise.return(test.reporters[i]).then(invokeReporter)
        } else {
            concurrent.push(test.reporters[i])
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
    ;(0, state.resolve)(new Result(end - state.start, attempt))
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

var Stage = Object.freeze({
    BeforeAll: 0,
    BeforeEach: 1,
    AfterEach: 2,
    AfterAll: 3,
})

function HookError(func, value, stage) {
    this.func = func.name || func.displayName || "<anonymous>"
    this.value = value
    this.stage = stage
}

methods(HookError, Error, {
    name: "HookError",
})

function HookInfo(error) {
    this._ = error
}

methods(HookInfo, {
    get stage() {
        switch (this._.stage) {
        case Stage.BeforeAll: return "before all"
        case Stage.BeforeEach: return "before each"
        case Stage.AfterEach: return "after each"
        case Stage.AfterAll: return "after all"
        default: throw new Error("unreachable")
        }
    },

    get value() {
        return this._.value
    },

    get beforeAll() { return this._.stage === Stage.BeforeAll },
    get beforeEach() { return this._.stage === Stage.BeforeEach },
    get afterEach() { return this._.stage === Stage.AfterEach },
    get afterAll() { return this._.stage === Stage.AfterAll },

    inspect: function () {
        var self = this

        // Avoid a recursive call when `inspect`ing a result while still keeping
        // it styled like it would be normally. The named singleton factory is
        // to ensure engines show the `name`/`displayName` for the type.
        return new function HookReport() {
            this.stage = self.stage
            this.value = self.value
        }()
    },
})

function invokeHook(list, stage) {
    return Promise.each(list, function (hook) {
        try {
            return hook()
        } catch (e) {
            throw new HookError(hook, e, stage)
        }
    })
}

function invokeBeforeEach(test) {
    if (test.status & Flags.Root) {
        return invokeHook(test.beforeEach, Stage.BeforeEach)
    } else {
        return invokeBeforeEach(test.parent).then(function () {
            return invokeHook(test.beforeEach, Stage.BeforeEach)
        })
    }
}

function invokeAfterEach(test) {
    if (test.status & Flags.Root) {
        return invokeHook(test.afterEach, Stage.AfterEach)
    } else {
        return invokeHook(test.afterEach, Stage.AfterEach)
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
function isOnly(test, path) {
    var i = path.length|0

    while (!(test.status & Flags.Root) && test.only == null) {
        path.push(test.name)
        test = test.parent
        i++
    }

    // If there isn't any `only` active, then let's skip the check and return
    // `true` for convenience.
    var current = test.only

    if (current != null) {
        while (i !== 0) {
            current = findMatches(current, path[--i])
            if (current == null) return false
        }
    }

    return true
}

function runChildTests(test) {
    if (test.tests.length === 0) return undefined

    var p = invokeHook(test.beforeAll, Stage.BeforeAll)

    for (var i = 0; i < test.tests.length; i++) {
        var child = test.tests[i]

        if (child.status & Flags.Skipped) {
            p = p.return([child, Types.Skip]).spread(reportSimple)
        } else if (isOnly(child, [])) {
            p = p.return(test).then(invokeBeforeEach)
            p = p.return(child).then(runNormalChild)
            p = p.return(test).then(invokeAfterEach)
        }
    }

    return p
    .then(function () { return invokeHook(test.afterAll, Stage.AfterAll) })
    .catch(HookError, function (e) {
        return report(test, r(Types.Hook, new HookInfo(e), -1))
    })
}

function reportSimple(test, type) {
    return report(test, r(type, undefined, -1))
}

function runNormalChild(test) {
    test.status &= ~Flags.Locked

    return Promise.resolve(invokeInit(test))
    .then(function (result) {
        test.status |= Flags.Locked

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
    .finally(function () {
        for (var i = 0; i < test.tests.length; i++) {
            test.tests[i].tests = []
        }
    })
}

/**
 * This runs the root test and returns a promise resolved when it's done.
 */
exports.runTest = function (test) {
    test.status |= Flags.Locked

    return reportSimple(test, Types.Start)
    .then(function () { return runChildTests(test) })
    .then(function () { return reportSimple(test, Types.End) })
    // Tell the reporter something happened. Otherwise, it'll have to wrap this
    // method in a plugin, which shouldn't be necessary.
    .catch(function (e) {
        return report(test, r(Types.Error, e, -1)).throw(e)
    })
    .finally(function () {
        for (var i = 0; i < test.tests.length; i++) {
            test.tests[i].tests = []
        }
        test.status &= ~Flags.Locked
    })
}

// Help optimize for inefficient exception handling in most JS engines

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
