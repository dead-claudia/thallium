"use strict"

var methods = require("./lib/methods.js")
var constants = require("./lib/constants.js")
var messages = constants.messages
var templates = constants.templates

var inspect = require("./lib/inspect.js")
var AssertionError = require("./lib/assertion-error.js")
var BaseTest = require("./lib/base-test.js")
var InlineTest = require("./lib/inline-test.js")
var BlockTest = require("./lib/block-test.js")
var dummy = require("./lib/dummy-test.js")
var skip = require("./lib/skip-test.js")
var activeReporters = require("./lib/common.js").activeReporters
var isIterator = require("./lib/util.js").isIterator
var AsyncTest = require("./lib/async-test.js")
var Only = require("./lib/only.js")

function checkInit(ctx) {
    if (!ctx.initializing) {
        throw new ReferenceError(messages.unsafeInitCall)
    }
}

/**
 * Factory for creating Testiphile instances
 */
function Techtonic() {
    this._ = new BaseTest(this)
}

methods(Techtonic, {
    // Exposed for testing, but might be interesting for consumers.
    base: function () {
        return new Techtonic()
    },

    // The `only` data is stored in an object hash tree. Much faster lookup
    // times.
    only: function () {
        var only = this._.only = new Only()

        for (var i = 0; i < arguments.length; i++) {
            var selector = arguments[i]
            if (!Array.isArray(selector)) {
                throw new TypeError(templates.onlyType(i))
            }

            only.add(selector)
        }

        return this
    },
})

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

methods(Techtonic, {
    use: iterateCall(function (ctx, plugin) {
        if (typeof plugin !== "function") {
            throw new TypeError(messages.pluginImpl)
        }

        if (ctx._.plugins.indexOf(plugin) < 0) {
            // Add plugin before calling it.
            ctx._.plugins.push(plugin)
            plugin.call(ctx, ctx)
        }
    }),

    // Add a single reporter. Multiple calls to this are allowed, and
    // this may be passed either a single reporter or any number of
    // possibly nested lists of them.
    reporter: iterateCall(function (ctx, reporter) {
        if (typeof reporter !== "function") {
            throw new TypeError(messages.reporterImpl)
        }

        if (ctx._.reporters == null) {
            ctx._.reporters = [reporter]
        } else if (ctx._.reporters.indexOf(reporter) < 0) {
            ctx._.reporters.push(reporter)
        }
    }),
})

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
                throw new TypeError(messages.makeSetterName)
            }

            run(this, name, func)
        }
        return this
    }
}

function format(obj) {
    if (!obj.message) obj.message = "unspecified"
    return obj.message.replace(/(.?)\{(.+?)\}/g, function (m, pre, prop) {
        if (pre === "\\") return m.slice(1)
        if ({}.hasOwnProperty.call(obj, prop)) {
            return pre + inspect(obj[prop])
        }
        return m
    })
}

methods(Techtonic, {
    // Primitive for defining test assertions
    define: makeSetter(function (base, name, func) {
        if (typeof func !== "function") {
            throw new TypeError(templates.defineBadImplType(name))
        }

        function run() {
            var res = func.apply(null, arguments)

            if (typeof res !== "object" || res == null) {
                throw new TypeError(templates.defineBadReturnType(name))
            }

            if (!res.test) {
                throw new AssertionError(format(res), res.expected, res.actual)
            }
        }

        base[name] = function () {
            checkInit(this._)
            if (this._.inline) {
                var args = []
                for (var i = 0; i < arguments.length; i++) {
                    args.push(arguments[i])
                }
                this._.inline.push({run: run, args: args})
            } else {
                run.apply(null, arguments)
            }

            return this
        }
    }),

    wrap: makeSetter(function (base, name, func) {
        if (typeof func !== "function") {
            throw new TypeError(templates.defineBadImplType(name))
        }

        var old = base[name]

        if (typeof old !== "function") {
            throw new TypeError(templates.wrapMissingMethod(name))
        }

        base[name] = function () {
            checkInit(this._)
            var self = this

            function bound() {
                return old.apply(self, arguments)
            }

            var args = [bound, this]
            for (var i = 0; i < arguments.length; i++) {
                args.push(arguments[i])
            }

            var ret = func.apply(this, args)
            return ret !== undefined ? ret : this
        }
    }),

    add: makeSetter(function (base, name, func) {
        if (typeof func !== "function") {
            throw new TypeError(templates.defineBadImplType(name))
        }

        base[name] = function () {
            checkInit(this._)

            var args = [this]
            for (var i = 0; i < arguments.length; i++) {
                args.push(arguments[i])
            }

            var ret = func.apply(this, args)
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

            return ctx.timeout || constants.DEFAULT_TIMEOUT
        }
    },

    // Mostly useful for plugin authors.
    parent: function () {
        if (this._.isBase) return undefined
        return this._.parent.methods
    },

    // This should *always* be used by plugin authors if a test method
    // modifies state. If you use `define`, `wrap` or `add`, this is
    // already done for you.
    checkInit: function () {
        checkInit(this._)
        return this
    },

    // This returns a thenable unless given a callback. The callback is
    // called with a single possible error argument.
    run: function (callback) {
        if (typeof callback !== "function") {
            throw new TypeError(messages.runCallback)
        }

        checkInit(this._)

        if (this._.running) {
            throw new Error(messages.unsafeRun)
        }

        this._.run(true, callback)
    },
})

function isOnly(test, name) {
    var path = [name]

    // This gets the path in reverse order. A FIFO stack is appropriate
    // here.
    while (test.only == null && !test.isBase) {
        path.push(test.name)
        test = test.parent
    }

    // If no `only` is active, then anything works.
    if (test.only == null) return true
    return test.only.check(path)
}

function makeTest(Inline, Block) {
    return /** @this */ function (name, callback) {
        if (typeof name !== "string") {
            throw new TypeError(messages.testName)
        }

        if (typeof callback !== "function" && callback != null) {
            throw new TypeError(messages.testCallback)
        }

        checkInit(this._)

        var I, B

        if (isOnly(this._, name)) {
            I = Inline
            B = Block
        } else {
            I = dummy.InlineTest
            B = dummy.BlockTest
        }

        var index = this._.tests.length

        if (callback == null) {
            var t = new I(this, name, index)
            this._.tests.push(t)
            return t.methods
        } else {
            this._.tests.push(new B(this, name, index, callback))
            return this
        }
    }
}

function makeAsync(Test) {
    return /** @this */ function (name, callback) {
        if (typeof name !== "string") {
            throw new TypeError(messages.testName)
        }

        if (typeof callback !== "function" && !isIterator(callback)) {
            throw new TypeError(messages.asyncCallback)
        }

        checkInit(this._)

        var T = isOnly(this._, name) ? Test : dummy.BlockTest
        var index = this._.tests.length

        this._.tests.push(new T(this, name, index, callback))
        return this
    }
}

methods(Techtonic, {
    testSkip: makeTest(skip.InlineTest, skip.BlockTest),
    test: makeTest(InlineTest, BlockTest),

    asyncSkip: makeAsync(skip.BlockTest),
    async: makeAsync(AsyncTest),

    // Call to get a list of active reporters, either on this instance
    // or on the closest parent. This is the *only* method that can be
    // called at any point, as the result is a different reference.
    reporters: function () {
        return activeReporters(this._).slice()
    },

    // Export the AssertionError constructor
    AssertionError: AssertionError,
})

module.exports = new Techtonic()
