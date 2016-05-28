"use strict"

var Promise = require("bluebird")
var Common = require("./common.js")
var r = Common.r
var report = Common.report
var Flags = Common.Flags

function Test() {
    this.plugins = []
    this.tests = []

    // Placeholder for reporters - this is non-null if reporters exist.
    this.reporters = null

    // The status of this test, a mask whose bits are detailed in the Flags
    // enum in `./common.js`.
    this.status = 0

    // Inline tests need to be marked immediately before running.
    this.deinit = []

    // 0 means inherit timeout
    this.timeout = 0

    // 0 means inherit slow timeout.
    this.slow = 0
}

function fire(ctx, name) {
    return report(ctx, r(name))
}

Common.methods(Test, {
    /**
     * This runs the test, and returns a promise resolved when it's done.
     *
     * @this {Test} The current context
     * @param {Boolean} isMain Whether the test is run directly as the main
     *                         test or as a child test.
     */
    run: function (isMain) {
        if ((this.status & Flags.Running) !== 0) {
            throw new Error(Common.m("run.concurrent"))
        }

        this.status |= Flags.Running

        return Promise.bind(this, isMain ? fire(this, "start") : undefined)
        .then(/** @this */ function () {
            this.status |= Flags.Init
            return this.init()
        })
        // If an error occurs, the initialization still finished (albeit
        // unsuccessfully)
        .finally(/** @this */ function () {
            this.status &= ~Flags.Init

            for (var i = 0; i < this.deinit.length; i++) {
                this.deinit[i].status &= ~Flags.Init
            }
        })
        .then(/** @this */ function () {
            if (isMain) {
                // Errors at the top level are considered fatal for the parent.
                if (Common.testFail()) throw Common.testError()
                return Promise.bind(this, this.tests)
                .each(function (test) { return test.run(false) })
                .then(/** @this */ function () { return fire(this, "end") })
            } else if (Common.testFail()) {
                return report(this, r("fail", Common.testError()))
            } else if (this.tests.length !== 0) {
                // Report this as if it was a parent test if it's passing
                // and it has children.
                return Promise.bind(this, this.tests)
                .tap(/** @this */ function () { return fire(this, "enter") })
                .each(function (test) { return test.run(false) })
                .tap(/** @this */ function () { return fire(this, "leave") })
            } else {
                return report(this, r("pass"))
            }
        })
        .finally(/** @this */ function () { this.status &= ~Flags.Running })
    },
})

// Prevent Sinon interference when they install their mocks
var setTimeout = global.setTimeout
var clearTimeout = global.clearTimeout

function Iterator(gen, resolve, reject) {
    this.gen = gen
    this.resolve = resolve
    this.reject = reject
}

Common.methods(Iterator, {
    step: function (func, value, message) {
        var next = Common.try1(func, this.gen, value)

        if (Common.tryCaught()) {
            // finished with failure, reject the promise
            return this.reject(Common.tryError())
        }

        if (typeof next !== "object" || next === null) {
            // finished with failure, reject the promise
            return this.reject(new TypeError(Common.m(message)))
        }

        if (next.done) {
            // finished with success, resolve the promise
            return this.resolve(next.value)
        }

        // not finished, chain off the yielded promise and `step` again
        return Promise.bind(this, next.value).then(
            /** @this */ function (v) {
                return this.step(this.gen.next, v, "type.iterate.next")
            },
            /** @this */ function (e) {
                var func = this.gen.throw

                if (typeof func === "function") {
                    return this.step(func, e, "type.iterate.throw")
                } else {
                    return this.reject(e)
                }
            })
    },
})

/**
 * This is a modified version of the async-await official, non-normative
 * desugaring helper, for better error checking and adapted to accept an
 * already-instantiated iterator instead of a generator.
 */
function iterate(gen) {
    return new Promise(function (resolve, reject) {
        var iter = new Iterator(gen, resolve, reject)

        iter.step(gen.next, undefined, "type.iterate.next")
    })
}

// TODO: add slow semantics
function AsyncState(ctx, resolve) {
    this.ctx = ctx
    this.resolve = resolve

    this.count = 0
    this.interesting = false
    this.resolved = false
    this.timer = null
    this.timeout = 0
}

function bind(f, inst) {
    return function (arg) {
        return f.call(inst, arg)
    }
}

Common.methods(AsyncState, {
    pass: function () {
        if (this.resolved) return undefined
        if (this.timer) {
            clearTimeout(this.timer)
            this.timer = null
        }

        this.resolved = true
        Common.testPassing()
        return this.resolve()
    },

    fail: function (e) {
        if (this.resolved) return undefined
        if (this.timer) {
            clearTimeout(this.timer)
            this.timer = null
        }

        this.resolved = true
        Common.testFailing(e)
        return this.resolve()
    },

    callback: function (err) {
        // Ignore calls to this if something interesting was already
        // returned.
        if (this.interesting) return undefined

        // Errors are ignored here, since there is no reliable way
        // to handle them after the test ends. Bluebird will warn
        // about unhandled errors to the console, anyways, so it'll
        // be hard to miss.
        if (this.count++) {
            // Create a helpful stack to display.
            var e = new Error()

            e.name = ""

            Common.report(this.ctx, Common.r("extra", {
                count: this.count,
                value: err,
                // Trim the initial newline
                stack: e.stack.slice(1),
            }))

            return undefined
        }

        if (err != null) return this.fail(err)
        else return this.pass()
    },

    timeoutFail: function () {
        return this.fail(Common.timeoutFail(this.timeout))
    },

    initTimeout: function () {
        this.timeout = Common.timeout(this.ctx)

        // Don't bother checking/setting a timeout if it was `Infinity`.
        if (this.timeout !== Infinity) {
            var self = this

            this.timer = setTimeout(function () {
                self.timeoutFail()
            }, this.timeout)
        }

        return undefined
    },

    checkSpecial: function (res) {
        // It can't be interesting if the result's nullish.
        this.interesting = res != null

        var isThenable = Common.try1(Common.isThenable, undefined, res)

        if (Common.tryCaught()) return this.fail(Common.tryError())

        if (isThenable) {
            Promise.bind(this, res).then(this.pass, this.fail)
            return undefined
        }

        var isIterator = Common.try1(Common.isIterator, undefined, res)

        if (Common.tryCaught()) return this.fail(Common.tryError())

        if (isIterator) {
            // No, Bluebird's coroutines don't work.
            iterate(res).bind(this).then(this.pass, this.fail)
        } else {
            // Not interesting enough. Mark it as such.
            this.interesting = false
        }

        return undefined
    },

    run: function () {
        var methods = Object.create(this.ctx.methods)

        methods._ = this.ctx

        var callback = bind(this.callback, this)
        var res = Common.try2(this.ctx.callback, methods, methods, callback)

        // Note: synchronous failures when initializing an async test are test
        // failures, not fatal errors.

        if (Common.tryCaught()) return this.fail(Common.tryError())

        this.checkSpecial(res)

        // Set the timeout *after* initialization. The timeout will likely
        // be specified during initialization.

        this.timeout = Common.timeout(this.ctx)

        // Don't bother checking/setting a timeout if it was `Infinity`.
        if (this.timeout !== Infinity) {
            var timeoutFail = bind(this.timeoutFail, this)

            this.timer = setTimeout(timeoutFail, this.timeout)
        }

        return undefined
    },
})

exports.Async = Async
function Async(methods, name, index, callback) {
    Test.call(this)

    this.status |= Common.Flags.Async
    this.methods = methods
    this.name = name
    this.index = index
    this.callback = callback
    this.parent = methods._
}

Common.methods(Async, Test, {
    init: function () {
        var self = this

        return new Promise(function (resolve) {
            return new AsyncState(self, resolve).run()
        })
    },
})

exports.Base = Base
function Base(methods) {
    Test.call(this, methods)

    this.status |= Flags.Root | Flags.Init
    this.methods = methods
    this.index = 0
    this.reporters = []
}

Common.methods(Base, Test, {
    run: function () {
        this.status |= Flags.Running

        return report(this, r("start")).bind(this)
        .then(/** @this */ function () {
            // Only unset it to run the tests.
            this.status &= ~Flags.Init
            return Promise.each(this.tests, function (test) {
                return test.run(false)
            })
        })
        .finally(/** @this */ function () { this.status |= Flags.Init })
        .then(/** @this */ function () { return report(this, r("end")) })
        .finally(/** @this */ function () { this.status &= ~Flags.Running })
    },
})

/**
 * The sync namespace, for `t.test()`
 */
var Sync = exports.Sync = {Inline: Inline, Block: Block}

function Inline(methods, name, index, callback) {
    Test.call(this)

    this.name = name
    this.index = index
    this.callback = callback
    this.parent = methods._

    // Initialize the test now, because the methods are immediately
    // returned, instead of being revealed through the callback.
    this.inline = []
    this.status |= Flags.Init | Flags.Inline
    this.methods = Object.create(methods)
    this.methods._ = this
}

var warnNoArgs = (function () {
    var process = global.process
    var console = global.console

    var canWarn = typeof process === "object"
        ? typeof process.env === "object" && !process.env.THALLIUM_NOWARN
        // Always warn in browsers.
        : typeof console === "object" && typeof console.warn === "function"

    if (canWarn) {
        return function (ctx) {
            var name = "name:"
            var e, stack

            while ((ctx.status & Flags.Root) === 0) {
                name += " " + ctx.name
                ctx = ctx.parent
            }

            console.warn(Common.m("missing.inline.body.0"))
            console.warn(Common.m("missing.inline.body.1", name))

            e = new Error()
            e.name = ""
            stack = e.stack.split(/\r?\n/g)

            for (var i = 0; i < stack.length; i++) {
                console.warn(Common.m("missing.inline.body.1", stack[i]))
            }
        }
    } else {
        return function () {}
    }
})()

Common.methods(Inline, Test, {
    init: function () {
        var end = this.inline.length

        // The unit tests use child-less inline tests a ton, as it's easier to
        // type. But for users, it's likely a mistake, and they probably meant
        // to use `t.testSkip()`.
        if (end === 0) warnNoArgs(this)

        for (var i = 0; i < end; i++) {
            var test = this.inline[i]

            Common.tryN(test.run, undefined, test.args)

            if (Common.tryCaught()) {
                // Stop immediately like what block tests do.
                Common.testFailing(Common.tryError())
                return
            }
        }

        Common.testPassing()
    },
})

function Block(methods, name, index, callback) {
    Test.call(this)

    this.name = name
    this.index = index
    this.callback = callback
    this.methods = methods
    this.parent = methods._
}

Common.methods(Block, Test, {
    init: function () {
        var methods = Object.create(this.methods)

        methods._ = this
        Common.try1(this.callback, methods, methods)

        if (Common.tryCaught()) {
            Common.testFailing(Common.tryError())
        } else {
            Common.testPassing()
        }
    },
})

/**
 * The namespaces for skipped/filtered out tests
 */

function createNs(run) {
    return Object.freeze({
        /**
         * This has to look like an inline test, because the methods still have
         * to be exposed, even though the tests aren't run.
         */
        Inline: Common.methods(function Inline() {
            Sync.Inline.apply(this, arguments)
        }, Sync.Inline, {run: run}),

        Block: Common.methods(function Block(methods, name, index) {
            Test.call(this)

            this.methods = methods
            this.name = name
            this.index = index
            this.parent = methods._
        }, Sync.Block, {run: run}),
    })
}

/**
 * This namespace is for tests that are filtered out by the `t.only()`
 * whitelist if one exists.
 */
exports.Dummy = createNs(function () {})

/**
 * This namespace is for `t.testSkip()` and `t.asyncSkip()`.
 */
exports.Skip = createNs(/** @this */ function (isMain) {
    this.status |= Flags.Running

    if (isMain) {
        return Common.report(this, r("start")).bind(this)
        .then(/** @this */ function () { return Common.report(this, r("end")) })
        .finally(/** @this */ function () { this.status &= ~Flags.Running })
    } else {
        return Common.report(this, r("skip")).bind(this)
        .finally(/** @this */ function () { this.status &= ~Flags.Running })
    }
})
