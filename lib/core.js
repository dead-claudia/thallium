"use strict"

var inspect = require("./inspect.js")
var rest = require("./core-utils.js").rest
var timers = require("./timers.js")
var AssertionError = require("./assertion-error.js")

function getPromise(ctx) {
    while (ctx.Promise == null) {
        ctx = ctx.parent
    }
    return ctx.Promise
}

function runTests(ctx, res) {
    if (res.type === "pass") {
        // Tests are called in sequence for obvious reasons.
        return ctx.tests
        .reduce(
            function (p, test) {
                return p.then(function () { return test.run() })
            },
            getPromise(ctx).resolve())
        .then(function () { return res })
    } else {
        // If the init failed, then this has already failed.
        return res
    }
}

function checkInit(ctx) {
    if (!ctx.initializing) {
        throw new ReferenceError(
            "It is only safe to call test methods during initialization")
    }
}

function run(ctx, init, isMain) {
    if (ctx.running) {
        throw new Error("Can't run the same test concurrently")
    }

    ctx.running = true

    var index = isMain ? -1 : ctx.index
    return report(ctx, "start", index)
    .then(function () { ctx.initializing = true })
    .then(function () { return init(ctx) })
    .then(function (res) {
        ctx.initializing = false

        for (var i = 0; i < ctx.deinit.length; i++) {
            ctx.deinit[i].initializing = false
        }

        return res
    })
    .then(function (res) { return runTests(ctx, res) })
    .then(function (res) {
        return report(ctx, "end", index).then(function () { return res })
    })
    .then(function (res) {
        return report(ctx, res.type, ctx.index, res.value)
    })
    .then(function () { if (isMain) return report(ctx, "exit", 0) })
    .then(function () { ctx.running = false })
}

function activeReporters(ctx) {
    while (ctx.reporters == null) {
        ctx = ctx.parent
    }
    return ctx.reporters
}

function getData(ctx) {
    if (ctx.isBase) return
    return {
        name: ctx.name,
        index: ctx.index,
        parent: getData(ctx.parent),
    }
}

function report(ctx, type, index, value, parent) {
    // Reporters are allowed to block, and these are always called first.
    var reporters = activeReporters(ctx)

    // If this becomes a bottleneck, there's other issues.
    var blocking = reporters.filter(function (x) { return x.block })
    var concurrent = reporters.filter(function (x) { return !x.block })

    // Note: Reporter errors are always fatal.
    function call(reporter) {
        return new (getPromise(ctx))(function (resolve, reject) {
            var parent1 = parent
            if (!ctx.isBase && parent1 == null) {
                parent1 = getData(ctx.parent)
            }

            return reporter({
                type: type, index: index, value: value,
                name: ctx.name,
                parent: parent1,
            }, function (err) {
                return err != null ? reject(err) : resolve()
            })
        })
    }

    // Call the blocking reporters individually.
    return blocking.reduce(
        function (p, reporter) {
            p.then(function () { return call(reporter) })
        },
        getPromise(ctx).resolve())
    // Call the non-blocking reporters all at once.
    .then(function () { return getPromise(ctx).all(concurrent.map(call)) })
    // Don't return an array of undefineds. This is unnecessary.
    .then(function () {})
}

function factory(create, init) {
    return function () {
        var data = create.apply(null, arguments)
        if (data.parent == null) data.parent = data.methods._
        data.plugins = []

        // This is a placeholder, in case a subtest gets its own reporters.
        // data.reporters = null
        data.tests = []

        // In case this is called out of its own init, that error is caught.
        // Don't override an existing `true`, though.
        data.initializing = !!data.initializing

        // Keep this from being run multiple times concurrently.
        data.running = false

        // Necessary for inline tests, which need explicitly marked.
        data.deinit = []

        // Default timeout. 0 means inherit the parent or the default of 2000 ms
        data.timeout = 0

        // If a custom runner is provided, use that.
        data.run = data.run || run.bind(null, data, init)

        return data
    }
}

var baseTest = factory(function (methods) {
    return {
        methods: methods,
        index: 0,
        reporters: [],
        isBase: true,
        initializing: true,

        Promise: typeof global.Promise === "function"
            ? global.Promise
            : function () {
                throw new ReferenceError("A promise implementation is needed")
            },

        run: function () {
            if (this.running) {
                throw new Error("Can't run the same test concurrently")
            }

            this.running = true

            var self = this
            return report(this, "start", -1)
            // Only unset it to run the tests.
            .then(function () { self.initializing = false })
            .then(function () { return runTests(self, {type: "pass"}) })
            .then(function () { self.initializing = true })
            .then(function () { return report(self, "end", -1) })
            .then(function () { return report(self, "exit", 0) })
            .then(function () { self.running = false })
        },
    }
})

var inlineTest = factory(function (methods, name, index) {
    // Initialize the test now, because the methods are immediately
    // returned, instead of being revealed through the callback.
    var data = {
        methods: Object.create(methods),
        parent: methods._,
        name: name,
        index: index,
        inline: [],
        initializing: true,
    }
    methods._.deinit.push(data)
    data.methods._ = data
    return data
}, function (ctx) {
    for (var i = 0; i < ctx.inline.length; i++) {
        var inline = ctx.inline[i]
        try {
            inline.run.apply(null, inline.args)
        } catch (e) {
            // If an assertion failed, then this has already failed.
            return {type: "fail", value: e}
        }
    }

    return {type: "pass"}
})

var blockTest = factory(function (methods, name, index, callback) {
    return {methods: methods, name: name, index: index, callback: callback}
}, function (ctx) {
    var methods = Object.create(ctx.methods)
    methods._ = ctx

    try {
        ctx.callback.call(methods, methods)
    } catch (e) {
        return {type: "fail", value: e}
    }

    return {type: "pass"}
})

// Note: this doesn't save the parent, because either it uses a shared
// reference, which may surprise some consumers, or it creates a redundant
// map of nodes and parent nodes, which is wasteful in memory, especially
// for an object likely to be thrown away. If you want the parent, you get
// the entry of the previous index.
function getPath(node) {
    var ret = []

    while (!node.isBase) {
        ret.unshift({
            name: node.name,
            index: node.index,
        })
        node = node.parent
    }

    return ret
}

function getTimeout(ctx) {
    // The default timeout is 2000 ms
    if (ctx.timeout || ctx.isBase) {
        return {isSelf: true, timeout: ctx.timeout || 2000}
    }

    while (!ctx.timeout && !ctx.isBase) {
        ctx = ctx.parent
    }
    return {isSelf: false, timeout: ctx.timeout || 2000}
}

// There's no other realistic way to get around slow scheduling. Also note: do
// *not* add any other variables to this, as Node and this only optimizes up to
// 4 arguments (and polling has to be as quick as possible).

// The polling is organized as a set of asynchronous coroutines to minimize
// state and allocation.
function pollParentTimeout(timeout, ctx, start, data) {
    if (data.resolved) return

    if (ctx.timeout) {
        // Stop inheriting
        return pollThisTimeout(timeout, ctx, start, data)
    } else if (+new Date() - start >= timeout) {
        return data.timerFail(timeout)
    } else {
        return timers.poll(pollParentTimeout, timeout, ctx, start, data)
    }
}

function pollThisTimeout(timeout, ctx, start, data) {
    if (data.resolved) return

    if (ctx.timeout) {
        if (+new Date() - start >= ctx.timeout) {
            return data.timerFail(ctx.timeout)
        } else {
            return timers.poll(pollThisTimeout, timeout, ctx, start, data)
        }
    } else {
        // Start inheriting
        return pollParentTimeout(timeout, ctx, start, data)
    }
}

function isThenable(value) {
    return value != null &&
        (typeof value === "object" || typeof value === "function") &&
        typeof value.then === "function"
}

function isIterator(value) {
    // Note that `return` isn't checked because V8 only partially
    // supports it natively.
    return value != null &&
        (typeof value === "object" || typeof value === "function") &&
        typeof value.next === "function"
}

// Only use this if it's already known to be a thenable.
function resolveKnownThenable(value, pass, fail) {
    var resolved = false
    return value.then(function (value) {
        if (resolved) return
        resolved = true
        return timers.nextTick(pass, value)
    }, function (err) {
        if (resolved) return
        resolved = true
        return timers.nextTick(fail, err)
    })
}

function resolveThenable(value, callback) {
    try {
        return resolveKnownThenable(
            value,
            callback.bind(null, true),
            callback.bind(null, false))
    } catch (err) {
        return timers.nextTick(callback, false, err)
    }
}

// Adapted from https://www.promisejs.org/generators/
function runIterator(gen, pass, fail) {
    // This implements IteratorClose from ES6, section 7.4.6, but adapted for
    // this, and waits for promise resolution. The iterators need to be able to
    // clean up.
    function close(isSuccess, value) {
        if (gen.return === undefined) {
            return (isSuccess ? pass : fail)(value)
        }

        var result

        if (isSuccess) {
            try {
                result = gen.return()
                if (result == null || typeof result !== "object") {
                    return fail(new TypeError(
                        "Iterator return() must return an object"))
                }

                value = result.value

                if (isThenable(value)) {
                    return resolveKnownThenable(value, pass, fail)
                }
            } catch (e) {
                return fail(e)
            }

            return pass(value)
        }

        try {
            result = gen.return()
            // It's okay to not complain about an incorrect shape, since
            // errors are normally suppressed, anyways.
            if (result != null && typeof result === "object") {
                var thenable = result.value

                if (isThenable(thenable)) {
                    return resolveKnownThenable(
                        thenable,
                        fail.bind(null, value),
                        fail.bind(null, value))
                }
            }
        } catch (_) {
            // Errors are ignored when closing an iterator from an abrupt
            // completion. In this case, `finally` isn't used because of the
            // early return in the `try` body.
        }

        return fail(value)
    }

    function tryHandle(success, value) {
        var result
        try {
            if (success) {
                result = gen.next(value)
            } else if (typeof gen.throw === "function") {
                result = gen.throw(value)
            } else {
                // If it's an error, and there's no `throw` to handle it, then
                // it should close the iterator.
                throw value
            }
        } catch (e) {
            return close(false, e)
        }

        return handle(success, result)
    }

    function handle(success, result) {
        if (result == null || typeof result !== "object") {
            var message = success
                ? "Iterator next() must return an object"
                : "Iterator throw() must return an object"
            return timers.nextTick(tryHandle, false, new TypeError(message))
        }

        var value = result.value

        if (result.done) {
            if (isThenable(value)) {
                return timers.nextTick(resolveThenable, value, close)
            } else {
                return timers.nextTick(close, true, value)
            }
        } else if (isThenable(value)) {
            return timers.nextTick(resolveThenable, value, tryHandle)
        } else {
            return timers.nextTick(tryHandle, true, value)
        }
    }

    var initial

    try {
        initial = gen.next()
    } catch (ex) {
        return fail(ex)
    }

    return handle(true, initial)
}

var asyncTest = factory(function (methods, name, index, callback) {
    return {methods: methods, name: name, index: index, callback: callback}
}, function (ctx) {
    return new (getPromise(ctx))(function (resolve) {
        var methods = Object.create(ctx.methods)
        methods._ = ctx

        var pollData = {
            resolved: false,
            timerFail: function (timeout) {
                return fail(new Error("Timeout of " + timeout + " reached."))
            },
        }

        var count = 0

        function pass() {
            pollData.resolved = true
            return resolve({type: "pass"})
        }

        function fail(err) {
            pollData.resolved = true
            return resolve({type: "fail", value: err})
        }

        function done(err) {
            if (count++) {
                // Since this can't really give this through the standard
                // sequence, the full path is required.
                report(ctx, "extra", ctx.index, {
                    count: count,
                    value: err,
                }, getPath(ctx.parent))
                return
            }

            if (err != null) return fail(err)
            return pass()
        }

        var timeoutData = getTimeout(ctx)

        if (timeoutData.isSelf) {
            pollParentTimeout(timeoutData.timeout, ctx, +new Date(), pollData)
        } else {
            pollThisTimeout(timeoutData.timeout, ctx, +new Date(), pollData)
        }

        try {
            var res = ctx.callback.call(methods, methods, done)
            if (res != null) {
                // Thenable
                if (isThenable(res)) {
                    res.then(pass, fail)
                    return
                }

                // Generator
                if (isIterator(res)) {
                    runIterator(res, pass, fail)
                    return
                }
            }
        } catch (e) {
            // Synchronous failures when initializing an async test are test
            // failures, not fatal errors.
            return fail(e)
        }
    })
})

/**
 * Primitive for defining test assertions.
 */

function format(obj) {
    if (!obj.message) obj.message = "unspecified"
    return obj.message.replace(/(.?)\{(.+?)\}/g, function (m, pre, prop) {
        if (pre === "\\") return m.slice(1)
        if ({}.hasOwnProperty.call(obj, prop)) return pre + inspect(obj[prop])
        return m
    })
}

function makeSetter(run) {
    return /** @this */ function (name, func) {
        checkInit(this._)
        if (typeof name === "object") {
            for (var key in name) {
                if ({}.hasOwnProperty.call(name, key)) {
                    run(this, key, name[key])
                }
            }
        } else {
            if (typeof name !== "string") {
                throw new TypeError("name must be a string if func exists")
            }

            run(this, name, func)
        }
        return this
    }
}

function iterateCall(func) {
    return /** @this */ function method() {
        checkInit(this._)

        for (var i = 0; i < arguments.length; i++) {
            var arg = arguments[i]
            if (Array.isArray(arg)) {
                method.apply(this, arg)
            } else {
                func(this, arg)
            }
        }

        return this
    }
}

/**
 * Factory for creating Testiphile instances
 */

module.exports = function () {
    var ret = {
        // Placeholder for a circular reference
        _: null,

        promise: function (P) {
            if (arguments.length) {
                this._.Promise = P
                return this
            } else {
                return this._.Promise
            }
        },

        use: iterateCall(function (ctx, plugin) {
            if (ctx._.plugins.indexOf(plugin) < 0) {
                // Add plugin before calling it.
                ctx._.plugins.push(plugin)
                plugin.call(ctx, ctx)
            }
        }),

        define: makeSetter(function (base, name, func) {
            if (typeof func !== "function") {
                throw new TypeError("Expected body of t." + name +
                    " to be a function")
            }

            function run() {
                var res = func.apply(null, arguments)

                if (typeof res !== "object" || res == null) {
                    throw new TypeError("Expected result for t." + name +
                        " to be an object")
                }

                if (!res.test) {
                    throw new AssertionError(format(res), res.expected,
                        res.actual)
                }
            }

            base[name] = function () {
                checkInit(this._)
                if (this._.inline) {
                    var args = rest.apply(null, arguments)
                    this._.inline.push({run: run, args: args})
                } else {
                    run.apply(null, arguments)
                }

                return this
            }
        }),

        wrap: makeSetter(function (base, name, func) {
            if (typeof func !== "function") {
                throw new TypeError("Expected body of t." + name +
                    " to be a function")
            }

            var old = base[name]

            if (typeof old !== "function") {
                throw new TypeError("Expected t." + name +
                    " to already be a function")
            }

            base[name] = function () {
                checkInit(this._)
                var args = rest.apply([old.bind(this), this], arguments)
                var ret = func.apply(this, args)
                return ret !== undefined ? ret : this
            }
        }),

        add: makeSetter(function add(base, name, func) {
            if (typeof func !== "function") {
                throw new TypeError("Expected body of t." + name +
                    " to be a function")
            }

            base[name] = function () {
                checkInit(this._)
                var ret = func.apply(this, rest.apply([this], arguments))
                return ret !== undefined ? ret : this
            }
        }),

        // 0 means inherit the parent.
        timeout: function (timeout) {
            checkInit(this._)
            if (arguments.length) {
                if (timeout < 0) timeout = 0
                this._.timeout = timeout
                return this
            } else {
                var ctx = this._
                while (!ctx.timeout && !ctx.isBase) {
                    ctx = ctx.parent
                }
                return ctx.timeout || 2000
            }
        },

        // This should *always* be used by plugin authors if a test method
        // modifies state. If you use `define`, `wrap` or `add`, this is already
        // done for you.
        checkInit: function () {
            checkInit(this._)
            return this
        },

        // This returns a promise unless given a callback. The callback is
        // called with a single possible error argument.
        run: function (callback) {
            checkInit(this._)
            if (typeof callback === "function") {
                this._.run(true).then(function () {
                    callback()
                }, function (err) {
                    callback(err)
                })
            } else {
                return this._.run(true)
            }
        },

        test: function (name, callback) {
            if (typeof name !== "string") {
                throw new TypeError("Expected name to be a string")
            }

            if (typeof callback !== "function" && callback != null) {
                throw new TypeError(
                    "Expected callback to either be a function or not exist")
            }

            checkInit(this._)

            var index = this._.tests.length

            if (callback == null) {
                var t = inlineTest(this, name, index)
                this._.tests.push(t)
                return t.methods
            } else {
                this._.tests.push(blockTest(this, name, index, callback))
                return this
            }
        },

        async: function (name, callback) {
            if (typeof name !== "string") {
                throw new TypeError("Expected name to be a string")
            }

            if (typeof callback !== "function" && !isIterator(callback)) {
                throw new TypeError(
                    "Expected callback to be a function or iterator")
            }

            checkInit(this._)

            var index = this._.tests.length

            this._.tests.push(asyncTest(this, name, index, callback))
            return this
        },

        // Call to get a list of active reporters, either on this instance or on
        // the closest parent. This is the *only* method that can be called at
        // any point, as the result is a different reference.
        reporters: function () {
            return activeReporters(this._).slice()
        },

        // Add a single reporter. Multiple calls to this are allowed, and this
        // may be passed either a single reporter or a possibly nested list of
        // them.
        reporter: iterateCall(function (ctx, reporter) {
            if (typeof reporter !== "function") {
                throw new TypeError("Expected reporter to be a function")
            }

            if (ctx._.reporters == null) {
                ctx._.reporters = [reporter]
            } else if (ctx._.reporters.indexOf(reporter) < 0) {
                ctx._.reporters.push(reporter)
            }
        }),

        // Export the AssertionError constructor
        AssertionError: AssertionError,
    }
    ret._ = baseTest(ret)
    return ret
}
