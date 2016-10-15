"use strict"

/**
 * Backport wrapper to warn about the major breaking changes from the last major
 * version, and to help me keep track of all the changes.
 *
 * It consists of solely internal monkey patching to revive support of previous
 * versions.
 */

var Common = require("./common.js")
var methods = require("../lib/methods.js")
var Promise = require("../lib/bluebird.js")

var Tests = require("../lib/tests.js")
var Flags = Tests.Flags
var Report = Tests.Report

var assert = require("../assert.js")
var AssertionError = assert.AssertionError
var format = assert.format

var Thallium = require("../lib/thallium.js")
var Reflect = new Thallium().call(function (r) { return r.constructor })

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * - `t.async` -> `t.test`, which now supports promises.                     *
 * - All tests are now async.                                                *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

var test = Thallium.prototype.test

function runAsync(callback, t, resolve, reject) {
    var resolved = false
    var gen = callback.call(t, t, function (err) {
        if (resolved) return
        Common.warn("`t.async` is deprecated. " +
            "Use `t.test` and return a promise instead.")

        resolved = true
        if (err != null) reject(err)
        else resolve()
    })

    if (resolved) return

    if (typeof gen.next !== "function") {
        // Allow the migration path to standard thenables.
        resolve(gen)
        return
    }

    Common.warn("`t.async` is deprecated. Use `t.test` and either return a " +
        "promise or use `co`/ES8 async functions instead.")

    // This is a modified version of the async-await official, non-normative
    // desugaring helper, for better error checking and adapted to accept an
    // already-instantiated iterator instead of a generator.
    function iterate(next) {
        // finished with success, resolve the promise
        if (next.done) return Promise.resolve(next.value)

        // not finished, chain off the yielded promise and step again
        return Promise.resolve(next.value).then(
            function (v) { return iterate(gen.next(v)) },
            function (e) {
                if (typeof gen.throw === "function") {
                    return iterate(gen.throw(e))
                } else {
                    throw e
                }
            })
    }

    iterate(gen.next(undefined)).then(resolve, reject)
}

methods(Thallium, {
    async: function (name, callback) {
        if (typeof callback !== "function") {
            // Reuse the normal error handling.
            return test.apply(this, arguments)
        } else {
            return test.call(this, name, function (t) {
                return new Promise(function (resolve, reject) {
                    return runAsync(callback, t, resolve, reject)
                })
            })
        }
    },

    asyncSkip: Thallium.prototype.testSkip,
})

methods(Reflect, {
    async: function () {
        new Reflect(this._).checkInit()
        return true
    },
})

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * `reflect.define`, `t.define`, `reflect.wrap`, and `reflect.add`, are all  *
 * removed.                                                                  *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

function isLocked(method) {
    return method === "_" ||
        method === "reflect" ||
        method === "only" ||
        method === "use" ||
        method === "reporter" ||
        method === "define" ||
        method === "timeout" ||
        method === "slow" ||
        method === "run" ||
        method === "test" ||
        method === "testSkip" ||
        method === "async" ||
        method === "asyncSkip"
}

function getEnumerableSymbols(keys, object) {
    var symbols = Object.getOwnPropertySymbols(object)

    for (var i = 0; i < symbols.length; i++) {
        var sym = symbols[i]

        if (Object.getOwnPropertyDescriptor(sym).enumerable) keys.push(sym)
    }
}

// This handles name + func vs object with methods.
function iterateSetter(test, name, func, iterator) {
    new Reflect(test).checkInit()
    if (test.status & Flags.Skipped) return

    // Check both the name and function, so ES6 symbol polyfills (which use
    // objects since it's impossible to fully polyfill primitives) work.
    if (typeof name === "object" && name != null && func == null) {
        var keys = Object.keys(name)

        if (typeof Object.getOwnPropertySymbols === "function") {
            getEnumerableSymbols(keys, name)
        }

        for (var i = 0; i < keys.length; i++) {
            var key = keys[i]

            if (typeof name[key] !== "function") {
                throw new TypeError("Expected body to be a function")
            }

            test.methods[key] = iterator(test, key, name[key])
        }
    } else {
        if (typeof func !== "function") {
            throw new TypeError("Expected body to be a function")
        }

        test.methods[name] = iterator(test, name, func)
    }
}

var try_ = Thallium.prototype.try

function defineAssertion(test, name, func) {
    // Don't let native methods get overridden by assertions
    if (isLocked(name)) {
        throw new RangeError("Method '" + name + "' is locked!")
    }

    function run() {
        var res = func.apply(undefined, arguments)

        if (typeof res !== "object" || res === null) {
            throw new TypeError("Expected result to be an object")
        }

        if (!res.test) {
            throw new AssertionError(
                format(res.message, res),
                res.expected, res.actual)
        }
    }

    /** @this */
    function attempt(a, b, c, d) {
        switch (arguments.length) {
        case 0: return try_.call(this, run)
        case 1: return try_.call(this, run, a)
        case 2: return try_.call(this, run, a, b)
        case 3: return try_.call(this, run, a, b, c)
        case 4: return try_.call(this, run, a, b, c, d)
        default:
            var args = [run]

            for (var i = 0; i < arguments.length; i++) {
                args.push(arguments[i])
            }

            return try_.apply(this, args)
        }
    }

    return /** @this */ function () {
        new Reflect(this._).checkInit()
        if (!(this._.status & Flags.Skipped)) attempt.apply(this, arguments)
        return this
    }
}

function wrapAssertion(test, name, func) {
    // Don't let `reflect` and `_` change.
    if (name === "reflect" || name === "_") {
        throw new RangeError("Method '" + name + "' is locked!")
    }

    var old = test.methods[name]

    if (typeof old !== "function") {
        throw new TypeError(
            "Expected t." + name + " to already be a function")
    }

    /** @this */
    function apply(a, b, c, d) {
        switch (arguments.length) {
        case 0: return func.call(this, old.bind(this))
        case 1: return func.call(this, old.bind(this), a)
        case 2: return func.call(this, old.bind(this), a, b)
        case 3: return func.call(this, old.bind(this), a, b, c)
        case 4: return func.call(this, old.bind(this), a, b, c, d)
        default:
            var args = [old.bind(this)]

            for (var i = 0; i < arguments.length; i++) {
                args.push(arguments[i])
            }

            return func.apply(this, args)
        }
    }

    return /** @this */ function () {
        var ret = apply.apply(this, arguments)

        return ret !== undefined ? ret : this
    }
}

function addAssertion(test, name, func) {
    if (typeof test.methods[name] !== "undefined") {
        throw new TypeError("Method '" + name + "' already exists!")
    }

    /** @this */
    function apply(a, b, c, d) {
        switch (arguments.length) {
        case 0: return func.call(this, this)
        case 1: return func.call(this, this, a)
        case 2: return func.call(this, this, a, b)
        case 3: return func.call(this, this, a, b, c)
        case 4: return func.call(this, this, a, b, c, d)
        default:
            var args = [this]

            for (var i = 0; i < arguments.length; i++) {
                args.push(arguments[i])
            }

            return func.apply(this, args)
        }
    }

    return /** @this */ function () {
        new Reflect(this._).checkInit()
        var ret = apply.apply(this, arguments)

        return ret !== undefined ? ret : this
    }
}

methods(Reflect, {
    define: Common.deprecate(
        "`reflect.define` is deprecated. Use external methods or direct assignment instead.", // eslint-disable-line max-len
        /** @this */ function (name, func) {
            iterateSetter(this._, name, func, defineAssertion)
        }),

    wrap: Common.deprecate(
        "`reflect.wrap` is deprecated. Use external methods or direct assignment instead.", // eslint-disable-line max-len
        /** @this */ function (name, func) {
            iterateSetter(this._, name, func, wrapAssertion)
        }),

    add: Common.deprecate(
        "`reflect.add` is deprecated. Use external methods or direct assignment instead.", // eslint-disable-line max-len
        /** @this */ function (name, func) {
            iterateSetter(this._, name, func, addAssertion)
        }),
})

methods(Thallium, {
    define: Common.deprecate(
        "`t.define` is deprecated. Use external methods or direct assignment instead.", // eslint-disable-line max-len
        /** @this */ function (name, func) {
            iterateSetter(this._, name, func, defineAssertion)
            return this
        }),
})

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * - `reflect.do` -> `reflect.try`/`t.try`                                   *
 * - `reflect.base` -> `t.create`                                            *
 * - `reflect.AssertionError` -> `assert.AssertionError`.                    *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

methods(Reflect, {
    // Deprecated aliases
    do: Common.deprecate(
        "`reflect.do` was renamed to `reflect.try`, aliased `t.try`.",
        Reflect.prototype.try),
    base: Common.deprecate(
        "`reflect.base` was renamed to `t.create`.",
        function () { return new Thallium() }),
})

// ESLint oddly can't tell these are shadowed.
/* eslint-disable no-extend-native */

function lockError(AssertionError) {
    Object.defineProperty(Reflect.prototype, "AssertionError", {
        writable: true,
        value: AssertionError,
    })
    return AssertionError
}

Object.defineProperty(Reflect.prototype, "AssertionError", {
    configurable: true,
    enumerable: false,
    get: Common.deprecate(
        "`reflect.AssertionError` is deprecated. Use `assert.AssertionError` from `thallium/assert` instead", // eslint-disable-line max-len
        function () { return lockError(AssertionError) }),
    set: Common.deprecate(
        "`reflect.AssertionError` is deprecated. Use `assert.AssertionError` from `thallium/assert` instead", // eslint-disable-line max-len
        lockError),
})

/* eslint-enable no-extend-native */

methods(Thallium, {
    base: Common.deprecate(
        "`t.base` is deprecated. Use `t.create` instead",
        function () { return new Thallium() }),
})

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * - assertions defined on main export                                       *
 * - `t.instanceof` -> `assert.inherits`                                     *
 * - `t.notInstanceof` -> `assert.notInherits`                               *
 * - `t.*` -> `assert.*` from `thallium/assert` for assertions               *
 * - `t.true`/etc. are gone (except `t.undefined` -> `assert.undefined`)     *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
Common.hideDeprecation()
require("../assertions.js")(require("../index.js"))
Common.showDeprecation()

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * `extra` events are no longer a thing.                                     *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
methods(Report, {
    extra: Common.deprecate(
        "`extra` events no longer exist. You no longer need to handle them",
        function () { return false }),
})

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * - `t.reflect` and `t.use` -> non-caching `t.call`                         *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
var call = Thallium.prototype.call

function id(x) { return x }

methods(Thallium, {
    reflect: Common.deprecate(
        "`t.reflect` is deprecated. Use `t.call` instead",
        /** @this */ function () { return call.call(this, id) }),

    use: Common.deprecate(
        "`t.use` is deprecated. Use `t.call` instead",
        /** @this */ function () {
            var reflect = call.call(this, id)

            if (!reflect.skipped) {
                for (var i = 0; i < arguments.length; i++) {
                    var plugin = arguments[i]

                    if (typeof plugin !== "function") {
                        throw new TypeError(
                            "Expected `plugin` to be a function")
                    }

                    if (this._.plugins == null) this._.plugins = []
                    if (this._.plugins.indexOf(plugin) === -1) {
                        // Add plugin before calling it.
                        this._.plugins.push(plugin)
                        plugin.call(this, this)
                    }
                }
            }

            return this
        }),
})

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * - `reflect.report` -> `internal.createReport`                             *
 * - `reflect.loc` -> `internal.createLocation`                              *
 * - `reflect.scheduler` -> `internal.setScheduler`                          *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

var Internal = require("../internal.js")

methods(Reflect, {
    report: Common.deprecate(
        "`reflect.report` is deprecated. Use `internal.createReport` from thallium/internal instead", // eslint-disable-line max-len
        Internal.createReport),

    loc: Common.deprecate(
        "`reflect.loc` is deprecated. Use `internal.createLocation` from thallium/internal instead", // eslint-disable-line max-len
        Internal.createLocation),

    scheduler: Common.deprecate(
        "`reflect.scheduler` is deprecated. Use `internal.setScheduler` from thallium/internal instead", // eslint-disable-line max-len
        Internal.setScheduler),
})
