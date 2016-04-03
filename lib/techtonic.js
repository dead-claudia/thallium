"use strict"

var m = require("./messages").m

var AssertionError = require("./assertion-error.js").AssertionError
var inspect = require("./util/inspect.js").inspect

var createBaseTest = require("./test/base.js").createBaseTest
var sync = require("./test/sync.js")
var fake = require("./test/fake.js")
var async = require("./test/async.js")

var activeReporters = require("./test/common.js").activeReporters
var bind = require("./util/util.js").bind

var dummy = fake.dummy
var skip = fake.skip

/**
 * The whitelist is actually stored as a binary search tree for faster lookup
 * times when there are multiple selectors. Objects can't be used for the nodes,
 * where keys represent values and values represent children, because regular
 * expressions aren't possible to use. The other option, using a Map, would not
 * work well because I want to maintain ES5 compatibility.
 */
function nodeIndexOf(node, item) {
    for (var i = 0; i < node.children.length; i++) {
        var entry = node.children[i]

        if (typeof entry.value === "string" && typeof item === "string") {
            if (entry.value === item) return i
        } else if (entry.value instanceof RegExp && item instanceof RegExp) {
            if (entry.toString() === item.toString()) return i
        } // else, ignore different types
    }

    return -1
}

function nodeCheck(node, current) {
    for (var i = 0; i < node.children.length; i++) {
        var test = node.children[i]

        if (typeof test.value === "string") {
            if (current === test.value) return i
        } else if (test.value.test(current)) {
            // `test.value` is a regular expression
            return i
        }
    }

    return -1
}

function createNode(value) {
    return {value: value, children: []}
}

function createOnly() {
    return {node: createNode(null)}
}

function onlyAdd(only, selector) {
    var node = only.node

    for (var i = 0; i < selector.length; i++) {
        var entry = selector[i]

        // If it's not a string, make it so. This is also Symbol-proof
        if (typeof entry !== "string" && !(entry instanceof RegExp)) {
            throw new TypeError(m("type.only.path"))
        }

        var index = nodeIndexOf(node, entry)

        if (index === -1) {
            var child = createNode(entry)

            node.children.push(node = child)
        } else {
            node = node.children[index]
        }
    }
}

// Do note that this requires the stack to be reversed. It is also mutated
function onlyCheck(only, path) {
    var node = only.node

    // The non-null check is to not recurse into subtests of the childmost
    // selector.
    while (path.length && node != null) {
        var index = nodeCheck(node, path.pop())

        if (index === -1) return false
        node = node.children[index]
    }

    return true
}

function checkInit(ctx) {
    if (!ctx.initializing) {
        throw new ReferenceError(m("fail.checkInit"))
    }
}

/**
 * This is used to pull the common part out of `do()` and `block()`, so if one's
 * changed, the other still has the correct implementation.
 *
 * @this {Techtonic} The Techtonic instance
 * @param {func} The function to execute.
 */
function doBlock(func) {
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
function iterateCall(message, func) {
    /** @this */ function iterate() {
        for (var i = 0; i < arguments.length; i++) {
            var entry = arguments[i]

            if (Array.isArray(entry)) {
                iterate.apply(this, entry)
            } else if (typeof func === "function") {
                func.call(this, entry)
            } else {
                throw new TypeError(m(message))
            }
        }
    }

    return /** @this */ function () {
        checkInit(this._)
        iterate.apply(this, arguments)
        return this
    }
}

// This handles name + func vs object with methods.
function makeSetterCheck(func, name) {
    if (typeof func === "function") return func
    throw new TypeError(m("type.define.callback", name))
}

function makeSetter(iterator) {
    return /** @this */ function (name, func) {
        checkInit(this._)

        if (typeof name === "object") {
            var keys = Object.keys(name)

            for (var i = 0; i < keys.length; i++) {
                var key = keys[i]

                iterator.call(this, key, makeSetterCheck(name[key], key))
            }
        } else {
            iterator.call(this, name, makeSetterCheck(func, name))
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
    while (test.only == null && !test.isBase) {
        path.push(test.name)
        test = test.parent
    }

    // If no `only` is active, then anything works.
    return test.only == null || onlyCheck(test.only, path)
}

function runTest(namespace) {
    return /** @this */ function (name, callback) {
        if (typeof name !== "string") {
            throw new TypeError(m("type.test.name"))
        }

        if (typeof callback !== "function" && callback != null) {
            throw new TypeError(m("type.callback.optional"))
        }

        checkInit(this._)

        var ns = isOnly(this._, name) ? namespace : dummy
        var index = this._.tests.length

        if (callback != null) {
            this._.tests.push(ns.createBlockTest(this, name, index, callback))
            return this
        } else {
            var t = ns.createInlineTest(this, name, index)

            this._.tests.push(t)
            return t.methods
        }
    }
}

function runAsync(Test) {
    return /** @this */ function (name, callback) {
        if (typeof name !== "string") {
            throw new TypeError(m("type.test.name"))
        }

        if (typeof callback !== "function") {
            throw new TypeError(m("type.async.callback"))
        }

        checkInit(this._)

        var createTest = isOnly(this._, name) ? Test : dummy.createBlockTest
        var index = this._.tests.length

        this._.tests.push(createTest(this, name, index, callback))
        return this
    }
}

/**
 * Prototype of all Techtonic instances
 */
var Techtonic = exports.Techtonic = {
    // Placeholder
    _: null,

    /**
     * Exposed for testing, but might be interesting for consumers.
     */
    base: function () {
        var ret = Object.create(Techtonic)

        ret._ = createBaseTest(ret)
        return ret
    },

    /**
     * Whitelist specific tests, using array-based selectors where each entry
     * is either a string or regular expression.
     *
     * Returns the current instance for chaining.
     */
    only: function (/* ...selectors */) {
        checkInit(this._)
        this._.only = createOnly()

        for (var i = 0; i < arguments.length; i++) {
            var selector = arguments[i]

            if (!Array.isArray(selector)) {
                throw new TypeError(m("type.only.index", i))
            }

            onlyAdd(this._.only, selector)
        }

        return this
    },

    /**
     * Run `func` when tests are run. This is synchronous for block and async
     * tests, but not inline tests. It's probably most useful for plugin
     * authors.
     *
     * Returns the current instance for chaining.
     */
    do: doBlock,

    /**
     * ES3-compatible alias of `t.do()`. Does exactly the same thing.
     */
    block: doBlock,

    /**
     * Use a number of plugins. Possibly nested lists of them are also
     * supported.
     *
     * Returns the current instance for chaining.
     */
    use: iterateCall("type.plugin", /** @this */ function (plugin) {
        if (this._.plugins.indexOf(plugin) < 0) {
            // Add plugin before calling it.
            this._.plugins.push(plugin)
            plugin.call(this, this)
        }
    }),

    /**
     * Add a number of reporters. Possibly nested lists of them are also
     * supported.
     *
     * Returns the current instance for chaining.
     */
    reporter: iterateCall("type.reporter", /** @this */ function (reporter) {
        if (this._.reporters == null) {
            this._.reporters = [reporter]
        } else if (this._.reporters.indexOf(reporter) < 0) {
            this._.reporters.push(reporter)
        }
    }),

    /**
     * Define one or more (if an object is passed) assertions.
     *
     * Returns the current instance for chaining.
     */
    define: makeSetter(/** @this */ function (name, func) {
        function run() {
            var res = func.apply(undefined, arguments)

            if (typeof res !== "object" || res === null) {
                throw new TypeError(m("type.define.return", name))
            }

            if (!res.test) {
                throw new AssertionError(format(res), res.expected, res.actual)
            }
        }

        this[name] = function () {
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
    }),

    /**
     * Wrap one or more (if an object is passed) existing methods.
     *
     * Returns the current instance for chaining.
     */
    wrap: makeSetter(/** @this */ function (name, func) {
        var old = this[name]

        if (typeof old !== "function") {
            throw new TypeError(m("missing.wrap.callback", name))
        }

        this[name] = function () {
            checkInit(this._)

            var args = [bind(old, this)]

            for (var i = 0; i < arguments.length; i++) {
                args.push(arguments[i])
            }

            var ret = func.apply(undefined, args)

            return ret !== undefined ? ret : this
        }
    }),

    /**
     * Define one or more (if an object is passed) new methods.
     *
     * Returns the current instance for chaining.
     */
    add: makeSetter(/** @this */ function (name, func) {
        this[name] = function () {
            checkInit(this._)

            var args = [this]

            for (var i = 0; i < arguments.length; i++) {
                args.push(arguments[i])
            }

            var ret = func.apply(this, args)

            return ret !== undefined ? ret : this
        }
    }),

    /**
     * If an argument was passed, this sets the timeout in milliseconds,
     * rounding negatives to 0, and returns the current instance for chaining.
     * Setting the timeout to 0 means to inherit the parent timeout, and setting
     * it to `Infinity` disables it.
     *
     * Otherwise, it returns the active (not necessarily own) timeout, or the
     * framework default of 2000 milliseconds.
     */
    timeout: function (timeout) {
        if (timeout != null) {
            checkInit(this._)
            this._.timeout = Math.max(+timeout, 0)
            return this
        } else {
            return async.getTimeout(this._)
        }
    },

    /**
     * Get the parent test. Mostly useful for plugin authors.
     */
    parent: function () {
        if (this._.isBase) return undefined
        else return this._.parent.methods
    },

    /**
     * Assert that this test is currently being initialized (and is thus safe to
     * modify). This should *always* be used by plugin authors if a test method
     * modifies state. If you use `define`, `wrap` or `add`, this is already
     * done for you.
     *
     * Returns the current instance for chaining.
     */
    checkInit: function () {
        checkInit(this._)
        return this
    },

    /**
     * Run the tests (or the test's tests if it's not a base instance). Pass a
     * `callback` to be called with a possible error, and this returns a promise
     * otherwise.
     */
    run: function (callback) {
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
    },

    /**
     * Add a skipped block or inline test.
     */
    testSkip: runTest(skip),

    /**
     * Add a block or inline test.
     */
    test: runTest(sync),

    /**
     * Add a skipped async test.
     */
    asyncSkip: runAsync(skip.createBlockTest),

    /**
     * Add an async test.
     */
    async: runAsync(async.createAsyncTest),

    /**
     * Get a list of all active reporters, either on this instance or on the
     * closest parent.
     */
    reporters: function () {
        return activeReporters(this._).slice()
    },

    /**
     * Check if this is an inline test. Mostly useful for plugin authors.
     */
    inline: function () { return this._.inline },

    // Export the AssertionError constructor
    AssertionError: AssertionError,
}
