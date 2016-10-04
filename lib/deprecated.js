"use strict"

/**
 * This module houses most of the deprecated extensions, so they're easier to
 * manage. Remove them (and their uses) when no longer needed.
 */

var methods = require("./methods.js")

// Don't print deprecation messages when setting up deprecated methods
var suppressDeprecation = false

/**
 * 0.2.x:
 *
 * - assertions defined on object
 * - `t.instanceof` -> `assert.inherits`
 * - `t.notInstanceof` -> `assert.notInherits`
 * - `t.*` -> `assert.*` from `thallium/assert` for assertions
 * - `t.true`/etc. are gone (except `t.undefined` -> `assert.undefined`)
 */
var assertions = require("../assertions.js")

exports.main = function (t) {
    suppressDeprecation = true
    assertions(t)
    suppressDeprecation = false
}

var console = global.console
var mustPrint = console != null && typeof console.warn === "function"

function getAssertionDeprecation(name) {
    switch (name) {
    case "instanceof": return getAssertionDeprecation("inherits")
    case "notInstanceof": return getAssertionDeprecation("notInherits")
    default:
        return "`t." + name + "()` is deprecated. Use `assert." + name +
            "()` from the `thallium/assert` module instead."
    }
}

function deprecate(message, func) {
    var printed = !mustPrint

    /** @this */
    return function () {
        if (!suppressDeprecation) {
            if (!printed) {
                printed = true
                console.trace()
                console.warn(message)
            }

            message = undefined
        }

        return func.apply(this, arguments)
    }
}

exports.wrapAssertion = function (name, func) {
    return deprecate(getAssertionDeprecation(name), func)
}

/**
 * 0.2.x: `reflect.define`, `t.define`, `reflect.wrap`, and `reflect.add`, are
 * all removed.
 */

var assert = require("../assert.js")
var AssertionError = assert.AssertionError
var format = assert.format

function stripDefines(Thallium, Reflect, util) {
    var checkInit = util.checkInit
    var isSkipped = util.isSkipped

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
        checkInit(test)
        if (isSkipped(test)) return

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

        return /** @this */ function () {
            checkInit(this._)

            if (!isSkipped(this._)) {
                switch (arguments.length) {
                case 0: return try_.call(this, run)
                case 1: return try_.call(this, run, arguments[0])
                case 2: return try_.call(this, run, arguments[0], arguments[1])
                case 3:
                    return try_.call(this, run,
                        arguments[0],
                        arguments[1],
                        arguments[2])
                case 4:
                    return try_.call(this, run,
                        arguments[0],
                        arguments[1],
                        arguments[2],
                        arguments[3])

                default:
                    var args = [run]

                    for (var i = 0; i < arguments.length; i++) {
                        args.push(arguments[i])
                    }

                    return try_.apply(this, args)
                }
            }

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

        return /** @this */ function () {
            var args = [old.bind(this)]

            for (var i = 0; i < arguments.length; i++) {
                args.push(arguments[i])
            }

            var ret = func.apply(this, args)

            return ret !== undefined ? ret : this
        }
    }

    function addAssertion(test, name, func) {
        if (typeof test.methods[name] !== "undefined") {
            throw new TypeError("Method '" + name + "' already exists!")
        }

        return /** @this */ function () {
            checkInit(this._)

            var args = [this]

            for (var i = 0; i < arguments.length; i++) {
                args.push(arguments[i])
            }

            var ret = func.apply(this, args)

            return ret !== undefined ? ret : this
        }
    }

    methods(Reflect, {
        base: deprecate(
            "`reflect.base`: Use `t.create` instead",
            function () { return new Thallium() }),

        define: deprecate(
            "`reflect.define`: Use external methods or direct assignment instead.", // eslint-disable-line max-len
            /** @this */ function (name, func) {
                iterateSetter(this._, name, func, defineAssertion)
            }),

        wrap: deprecate(
            "`reflect.wrap`: Use external methods or direct assignment instead.", // eslint-disable-line max-len
            /** @this */ function (name, func) {
                iterateSetter(this._, name, func, wrapAssertion)
            }),

        add: deprecate(
            "`reflect.add`: Use external methods or direct assignment instead.", // eslint-disable-line max-len
            /** @this */ function (name, func) {
                iterateSetter(this._, name, func, addAssertion)
            }),
    })

    methods(Thallium, {
        define: deprecate(
            "`t.define`: Use external methods or direct assignment instead.", // eslint-disable-line max-len
            /** @this */ function (name, func) {
                iterateSetter(this._, name, func, defineAssertion)
                return this
            }),
    })
}

/**
 * 0.2.x:
 *
 * - `reflect.do` -> `reflect.try`
 * - `reflect.base` -> `t.create`
 * - `reflect.AssertionError` -> `assert.AssertionError` on direct module.
 */

exports.coreProto = function (Thallium, Reflect, util) {
    stripDefines(Thallium, Reflect, util)

    methods(Reflect, {
        // Deprecated aliases
        do: deprecate(
            "`reflect.do`: Use `reflect.try` or `t.try` instead",
            Reflect.prototype.try),
        AssertionError: AssertionError,
        base: deprecate(
            "`reflect.base`: Use `t.create` instead",
            function () { return new Thallium() }),
    })

    // ESLint oddly can't tell these are locally shadowed values.

    function lockError(AssertionError) {
        Object.defineProperty(Reflect.prototype, "AssertionError", { // eslint-disable-line no-extend-native, max-len
            writable: true,
            value: AssertionError,
        })
        return AssertionError
    }

    Object.defineProperty(Reflect.prototype, "AssertionError", { // eslint-disable-line no-extend-native, max-len
        configurable: true,
        enumerable: false,
        get: deprecate(
            "`reflect.AssertionError`: Use `assert.AssertionError` from `thallium/assert` instead", // eslint-disable-line max-len
            function () { return lockError(AssertionError) }),
        set: deprecate(
            "`reflect.AssertionError`: Use `assert.AssertionError` from `thallium/assert` instead", // eslint-disable-line max-len
            lockError),
    })

    methods(Thallium, {
        base: deprecate(
            "`t.base`: Use `t.create` instead",
            function () { return new Thallium() }),
    })
}
