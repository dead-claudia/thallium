"use strict"

var m = require("./messages.js")
var AssertionError = require("./assertion-error.js")
var inspect = require("util").inspect
var Base = require("./test/base.js")
var Sync = require("./test/sync.js")
var Fake = require("./test/fake.js")
var Async = require("./test/async.js")
var activeReporters = require("./test/common.js").activeReporters
var bind = require("./util/util.js").bind
var Only = require("./only.js")

function checkInit(ctx) {
    if (!ctx.initializing) {
        throw new ReferenceError(m("fail.checkInit"))
    }
}

/**
 * Prototype of all Techtonic instances.
 */
var Techtonic = exports

// Placeholder
Techtonic._ = null

/**
 * Exposed for internal use, but might be interesting for consumers.
 */
Techtonic.base = function () {
    var ret = Object.create(Techtonic)

    ret._ = Base.create(ret)
    return ret
}

/**
 * Whitelist specific tests, using array-based selectors where each entry
 * is either a string or regular expression.
 *
 * Returns the current instance for chaining.
 */
Techtonic.only = function (/* ...selectors */) {
    checkInit(this._)
    this._.only = Only.create()

    for (var i = 0; i < arguments.length; i++) {
        var selector = arguments[i]

        if (!Array.isArray(selector)) {
            throw new TypeError(m("type.only.index", i))
        }

        Only.add(this._.only, selector)
    }

    return this
}

/**
 * Run `func` when tests are run. This is synchronous for block and async
 * tests, but not inline tests. It's probably most useful for plugin
 * authors. `t.block` is an ES3-compatible alias of this.
 *
 * Returns the current instance for chaining.
 */
Techtonic.do = Techtonic.block = function (func) {
    if (typeof func !== "function") {
        throw new TypeError(m("type.any.callback"))
    }

    checkInit(this._)

    if (this._.inline) {
        this._.inline.push({run: func, args: []})
    } else {
        func()
    }

    return this
}

// This handles possibly nested arrays of arguments.
function createWalk(method, message, func) {
    Techtonic[method] = function iterate(/* ...args */) {
        checkInit(this._)

        for (var i = 0; i < arguments.length; i++) {
            var entry = arguments[i]

            if (Array.isArray(entry)) {
                iterate.apply(this, entry)
            } else if (typeof func === "function") {
                func(this, entry)
            } else {
                throw new TypeError(m(message))
            }
        }

        return this
    }
}

/**
 * Use a number of plugins. Possibly nested lists of them are also
 * supported.
 *
 * Returns the current instance for chaining.
 */
createWalk("use", "type.plugin", function (t, plugin) {
    if (t._.plugins.indexOf(plugin) < 0) {
        // Add plugin before calling it.
        t._.plugins.push(plugin)
        plugin.call(t, t)
    }
})

/**
 * Add a number of reporters. Possibly nested lists of them are also
 * supported.
 *
 * Returns the current instance for chaining.
 */
createWalk("reporter", "type.reporter", function (t, reporter) {
    if (t._.reporters == null) {
        t._.reporters = [reporter]
    } else if (t._.reporters.indexOf(reporter) < 0) {
        t._.reporters.push(reporter)
    }
})

// This handles name + func vs object with methods.
function makeSetterCheck(func, name) {
    if (typeof func === "function") return func
    throw new TypeError(m("type.define.callback", name))
}

function makeSetter(method, iterator) {
    Techtonic[method] = function (name, func) {
        checkInit(this._)

        if (typeof name === "object") {
            var keys = Object.keys(name)

            for (var i = 0; i < keys.length; i++) {
                var key = keys[i]

                iterator(this, key, makeSetterCheck(name[key], key))
            }
        } else {
            iterator(this, name, makeSetterCheck(func, name))
        }

        return this
    }
}

var hasOwn = Object.prototype.hasOwnProperty

// This formats the assertion error messages.
function format(object) {
    if (!object.message) return "unspecified"

    return object.message.replace(/(.?)\{(.+?)\}/g, function (m, pre, prop) {
        if (pre === "\\") return m.slice(1)
        if (hasOwn.call(object, prop)) return pre + inspect(object[prop])
        return m
    })
}

// This checks if the test was whitelisted in a `t.only()` call, or for
// convenience, returns `true` if `t.only()` was never called.
function isOnly(test, name) {
    var path = [name]

    // This gets the path in reverse order. A FIFO stack is appropriate here.
    while (test.only == null && !test.isRoot) {
        path.push(test.name)
        test = test.parent
    }

    // If no `only` is active, then anything works.
    return test.only == null || Only.check(test.only, path)
}

/**
 * Define one or more (if an object is passed) assertions.
 *
 * Returns the current instance for chaining.
 */
makeSetter("define", function (t, name, func) {
    function run() {
        var res = func.apply(undefined, arguments)

        if (typeof res !== "object" || res === null) {
            throw new TypeError(m("type.define.return", name))
        }

        if (!res.test) {
            throw new AssertionError(format(res), res.expected, res.actual)
        }
    }

    t[name] = function () {
        checkInit(this._)

        if (this._.inline) {
            var args = []

            for (var i = 0; i < arguments.length; i++) {
                args.push(arguments[i])
            }

            this._.inline.push({run: run, args: args})
        } else {
            run.apply(undefined, arguments)
        }

        return this
    }
})

/**
 * Wrap one or more (if an object is passed) existing methods.
 *
 * Returns the current instance for chaining.
 */
makeSetter("wrap", function (t, name, func) {
    var old = t[name]

    if (typeof old !== "function") {
        throw new TypeError(m("missing.wrap.callback", name))
    }

    t[name] = function () {
        checkInit(this._)

        var args = [bind(old, this)]

        for (var i = 0; i < arguments.length; i++) {
            args.push(arguments[i])
        }

        var ret = func.apply(undefined, args)

        return ret !== undefined ? ret : this
    }
})

/**
 * Define one or more (if an object is passed) new methods.
 *
 * Returns the current instance for chaining.
 */
makeSetter("add", function (t, name, func) {
    t[name] = function () {
        checkInit(this._)

        var args = [this]

        for (var i = 0; i < arguments.length; i++) {
            args.push(arguments[i])
        }

        var ret = func.apply(this, args)

        return ret !== undefined ? ret : this
    }
})

/**
 * If an argument was passed, this sets the timeout in milliseconds,
 * rounding negatives to 0, and returns the current instance for chaining.
 * Setting the timeout to 0 means to inherit the parent timeout, and setting
 * it to `Infinity` disables it.
 *
 * Otherwise, it returns the active (not necessarily own) timeout, or the
 * framework default of 2000 milliseconds.
 */
Techtonic.timeout = function (timeout) {
    if (timeout != null) {
        checkInit(this._)
        this._.timeout = Math.max(+timeout, 0)
        return this
    } else {
        return Async.getTimeout(this._)
    }
}

/**
 * Get the parent test. Mostly useful for plugin authors.
 */
Techtonic.parent = function () {
    if (this._.isRoot) return undefined
    else return this._.parent.methods
}

/**
 * Assert that this test is currently being initialized (and is thus safe to
 * modify). This should *always* be used by plugin authors if a test method
 * modifies state. If you use `define`, `wrap` or `add`, this is already
 * done for you.
 *
 * Returns the current instance for chaining.
 */
Techtonic.checkInit = function () {
    checkInit(this._)
    return this
}

/**
 * Run the tests (or the test's tests if it's not a base instance). Pass a
 * `callback` to be called with a possible error, and this returns a promise
 * otherwise.
 */
Techtonic.run = function (callback) {
    if (typeof callback !== "function" && callback != null) {
        throw new TypeError(m("type.callback.optional"))
    }

    checkInit(this._)

    if (this._.running) {
        throw new Error(m("run.concurrent"))
    }

    return this._.run(true)
    .bind(undefined).return(undefined) // So it's returning the right thing.
    .asCallback(callback)
}

function runTest(method, namespace) {
    Techtonic[method] = function (name, callback) {
        if (typeof name !== "string") {
            throw new TypeError(m("type.test.name"))
        }

        if (typeof callback !== "function" && callback != null) {
            throw new TypeError(m("type.callback.optional"))
        }

        checkInit(this._)

        var ns = isOnly(this._, name) ? namespace : Fake.Dummy
        var index = this._.tests.length

        if (callback != null) {
            this._.tests.push(ns.createBlock(this, name, index, callback))
            return this
        } else {
            var t = ns.createInline(this, name, index)

            this._.tests.push(t)
            return t.methods
        }
    }
}

/**
 * Add a Skipped block or inline test.
 */
runTest("testSkip", Fake.Skip)

/**
 * Add a block or inline test.
 */
runTest("test", Sync)

function runAsync(method, createTest) {
    Techtonic[method] = function (name, callback) {
        if (typeof name !== "string") {
            throw new TypeError(m("type.test.name"))
        }

        if (typeof callback !== "function") {
            throw new TypeError(m("type.async.callback"))
        }

        checkInit(this._)

        var factory = isOnly(this._, name) ? createTest : Fake.Dummy.createBlock
        var index = this._.tests.length

        this._.tests.push(factory(this, name, index, callback))
        return this
    }
}

/**
 * Add a Skipped async test.
 */
runAsync("asyncSkip", Fake.Skip.createBlock)

/**
 * Add an async test.
 */
runAsync("async", Async.create)

/**
 * Get a list of all active reporters, either on this instance or on the
 * closest parent.
 */
Techtonic.reporters = function () {
    return activeReporters(this._).slice()
}

/**
* Check if this is an inline test. Mostly useful for plugin authors.
*/
Techtonic.inline = function () { return this._.inline }

// Export the AssertionError constructor
Techtonic.AssertionError = AssertionError
