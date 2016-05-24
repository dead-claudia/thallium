"use strict"

var inspect = require("util").inspect
var Common = require("./common.js")
var Tests = require("./tests.js")
var m = Common.m
var Flags = Common.Flags

var AssertionError = Common.defineError([
    "class AssertionError extends Error {",
    "    constructor(message, expected, actual) {",
    "        super()",
    "        this.message = message",
    "        this.expected = expected",
    "        this.actual = actual",
    "    }",
    "",
    "    get name() {",
    "        return 'AssertionError'",
    "    }",
    "}",
    "new AssertionError('message', 1, 2)", // check native subclassing support
    "return AssertionError",
], {
    constructor: function (message, expected, actual) {
        Common.readStack(this)
        this.message = message
        this.expected = expected
        this.actual = actual
    },

    name: "AssertionError",
})

/**
 * The whitelist is actually stored as a binary search tree for faster lookup
 * times when there are multiple selectors. Objects can't be used for the nodes,
 * where keys represent values and values represent children, because regular
 * expressions aren't possible to use.
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

function Node(value) {
    this.value = value
    this.children = []
}

Common.methods(Node, {
    find: function (condition, item) {
        for (var i = 0; i < this.children.length; i++) {
            var child = this.children[i]

            if (condition(child.value, item)) {
                return child
            }
        }

        return undefined
    },

    check: function (current) {
        return this.find(matches, current)
    },

    addSingle: function (entry) {
        var child = this.find(isEquivalent, entry)

        if (child != null) return child

        var node = new Node(entry)

        this.children.push(node)
        return node
    },
})

function Only() {
    this.node = new Node(null)
}

Common.methods(Only, {
    add: function (selector) {
        if (!Array.isArray(selector)) {
            throw new TypeError(m("type.only.selector"))
        }

        var node = this.node

        for (var i = 0; i < selector.length; i++) {
            var entry = selector[i]

            // Strings are the only things allowed.
            if (typeof entry !== "string" && !(entry instanceof RegExp)) {
                throw new TypeError(m("type.only.selector"))
            }

            node = node.addSingle(entry)
        }
    },

    // Do note that this accepts a reversed stack, that is itself mutated.
    check: function (path) {
        var node = this.node

        while (path.length) {
            node = node.check(path.pop())
            if (node == null) return false
        }

        return true
    },
})

function checkInit(ctx) {
    if ((ctx.status & Flags.Init) === 0) {
        throw new ReferenceError(m("fail.checkInit"))
    }
}

// This handles possibly nested arrays of arguments.
/** @this {Thallium} */
function walk(args, message, func) {
    checkInit(this._)

    for (var i = 0; i < args.length; i++) {
        var entry = args[i]

        if (Array.isArray(entry)) {
            walk.call(this, entry, message, func)
        } else if (typeof entry === "function") {
            func(entry)
        } else {
            throw new TypeError(m(message))
        }
    }

    return this
}

// This handles name + func vs object with methods.
function isSetter(func, name) {
    if (typeof func === "function") return func
    throw new TypeError(m("type.define.callback", name))
}

var hasOwn = Object.prototype.hasOwnProperty

/** @this {Thallium} */
function iterateSetter(name, func, iterator) {
    checkInit(this._)

    if (typeof name === "object" && name != null) {
        var keys = Object.keys(name)

        for (var i = 0; i < keys.length; i++) {
            var key = keys[i]

            iterator(key, isSetter(name[key], key))
        }
    } else {
        iterator(name, isSetter(func, name))
    }

    return this
}

// This formats the assertion error messages.
function format(object) {
    object.message += ""

    if (!object.message) return "unspecified"

    return object.message.replace(/(.?)\{(.+?)\}/g, function (m, pre, prop) {
        if (pre === "\\") return m.slice(1)
        if (hasOwn.call(object, prop)) return pre + inspect(object[prop])
        return pre + m
    })
}

// This checks if the test was whitelisted in a `t.only()` call, or for
// convenience, returns `true` if `t.only()` was never called.
function isOnly(test, name) {
    // Much easier to use a stack here.
    var path = [name]

    while ((test.status & (Flags.Root | Flags.HasOnly)) === 0) {
        path.push(test.name)
        test = test.parent
    }

    // If no `only` is active, then anything works.
    return test.only == null || test.only.check(path)
}

/** @this {Thallium} */
function runTest(namespace, name, callback) {
    if (typeof name !== "string") {
        throw new TypeError(m("type.test.name"))
    }

    if (typeof callback !== "function" && callback != null) {
        throw new TypeError(m("type.callback.optional"))
    }

    checkInit(this._)

    var ns = isOnly(this._, name) ? namespace : Tests.Dummy
    var index = this._.tests.length

    if (callback != null) {
        this._.tests.push(new ns.Block(this, name, index, callback))
        return this
    } else {
        var tt = new ns.Inline(this, name, index)

        this._.tests.push(tt)
        return tt.methods
    }
}

/** @this {Thallium} */
function runAsync(Test, name, callback) {
    if (typeof name !== "string") {
        throw new TypeError(m("type.test.name"))
    }

    if (typeof callback !== "function") {
        throw new TypeError(m("type.async.callback"))
    }

    checkInit(this._)

    var T = isOnly(this._, name) ? Test : Tests.Dummy.Block
    var index = this._.tests.length

    this._.tests.push(new T(this, name, index, callback))
    return this
}

module.exports = Thallium

function Thallium() {
    this._ = new Tests.Base(this)
}

Common.methods(Thallium, {
    /**
     * Exposed for internal use, but might be interesting for consumers.
     */
    base: function () {
        return new Thallium()
    },

    /**
     * Whitelist specific tests, using array-based selectors where each entry
     * is either a string or regular expression.
     *
     * Returns the current instance for chaining.
     */
    only: function (/* ...selectors */) {
        checkInit(this._)
        this._.status |= Flags.Only
        this._.only = new Only()

        for (var i = 0; i < arguments.length; i++) {
            var selector = arguments[i]

            if (!Array.isArray(selector)) {
                throw new TypeError(m("type.only.index", i))
            }

            this._.only.add(selector)
        }

        return this
    },

    /**
     * Run `func` when tests are run. This is synchronous for block and async
     * tests, but not inline tests. It's probably most useful for plugin
     * authors. `t.block` is an ES3-compatible alias of `t.do`.
     *
     * Returns the current instance for chaining.
     */
    do: function (func) {
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
    },

    /**
     * Use a number of plugins. Possibly nested lists of them are also
     * supported.
     *
     * Returns the current instance for chaining.
     */
    use: function () {
        var args = []
        var self = this

        for (var i = 0; i < arguments.length; i++) {
            args.push(arguments[i])
        }

        return walk.call(this, args, "type.plugin", function (plugin) {
            if (self._.plugins.indexOf(plugin) < 0) {
                // Add plugin before calling it.
                self._.plugins.push(plugin)
                plugin.call(self, self)
            }
        })
    },

    /**
     * Add a number of reporters. Possibly nested lists of them are also
     * supported.
     *
     * Returns the current instance for chaining.
     */
    reporter: function () {
        var args = []
        var self = this

        for (var i = 0; i < arguments.length; i++) {
            args.push(arguments[i])
        }

        return walk.call(this, args, "type.reporter", function (reporter) {
            if (self._.reporters == null) {
                self._.reporters = [reporter]
            } else if (self._.reporters.indexOf(reporter) < 0) {
                self._.reporters.push(reporter)
            }
        })
    },

    /**
     * Define one or more (if an object is passed) assertions.
     *
     * Returns the current instance for chaining.
     */
    define: function (name, func) {
        var self = this

        return iterateSetter.call(this, name, func, function (name, func) {
            function run() {
                var res = func.apply(undefined, arguments)

                if (typeof res !== "object" || res === null) {
                    throw new TypeError(m("type.define.return", name))
                }

                if (!res.test) {
                    throw new AssertionError(format(res), res.expected,
                        res.actual)
                }
            }

            self[name] = function () {
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
    },

    /**
     * Wrap one or more (if an object is passed) existing methods.
     *
     * Returns the current instance for chaining.
     */
    wrap: function (name, func) {
        var self = this

        return iterateSetter.call(this, name, func, function (name, func) {
            var old = self[name]

            if (typeof old !== "function") {
                throw new TypeError(m("missing.wrap.callback", name))
            }

            self[name] = function () {
                checkInit(this._)

                var args = [old.bind(this)]

                for (var i = 0; i < arguments.length; i++) {
                    args.push(arguments[i])
                }

                var ret = func.apply(undefined, args)

                return ret !== undefined ? ret : this
            }
        })
    },

    /**
     * Define one or more (if an object is passed) new methods.
     *
     * Returns the current instance for chaining.
     */
    add: function (name, func) {
        var self = this

        return iterateSetter.call(this, name, func, function (name, func) {
            self[name] = function () {
                checkInit(this._)

                var args = [this]

                for (var i = 0; i < arguments.length; i++) {
                    args.push(arguments[i])
                }

                var ret = func.apply(this, args)

                return ret !== undefined ? ret : this
            }
        })
    },

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
            return Common.timeout(this._)
        }
    },

    /**
     * If an argument was passed, this sets the slowness threshold in
     * milliseconds, rounding negatives to 0, and returns the current instance
     * for chaining. Setting the timeout to 0 means to inherit the parent
     * threshold, and setting it to `Infinity` disables it.
     *
     * Otherwise, it returns the active (not necessarily own) slowness
     * threshold, or the framework default of 75 milliseconds.
     */
    slow: function (slow) {
        if (slow != null) {
            checkInit(this._)
            this._.slow = Math.max(+slow, 0)
            return this
        } else {
            return Common.slow(this._)
        }
    },

    /**
     * Get the parent test. Mostly useful for plugin authors.
     */
    parent: function () {
        if ((this._.status & Flags.Root) !== 0) return undefined
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

        if ((this._.status & Flags.Running) !== 0) {
            throw new Error(m("run.concurrent"))
        }

        return this._.run(true).bind(this)
        // Tell the reporter something happened. Otherwise, it'll have to wrap
        // this method in a plugin.
        .catch(/** @this */ function (e) {
            return Common.report(this._, Common.r("error", e)).throw(e)
        })
        .bind().return()
        .asCallback(callback)
    },

    /**
     * Add a Skipped block or inline test.
     */
    testSkip: function (name, callback) {
        return runTest.call(this, Tests.Skip, name, callback)
    },

    /**
     * Add a block or inline test.
     */
    test: function (name, callback) {
        return runTest.call(this, Tests.Sync, name, callback)
    },

    /**
     * Add a Skipped async test.
     */
    asyncSkip: function (name, callback) {
        return runAsync.call(this, Tests.Skip.Block, name, callback)
    },

    /**
     * Add an async test.
     */
    async: function (name, callback) {
        return runAsync.call(this, Tests.Async, name, callback)
    },

    /**
     * Get a list of all active reporters, either on this instance or on the
     * closest parent.
     */
    reporters: function () {
        return Common.reporters(this._).slice()
    },

    /**
     * Check if this is an inline test. Mostly useful for plugin authors.
     */
    inline: function () {
        return this._.inline
    },

    // Export the AssertionError constructor
    AssertionError: AssertionError,
})
