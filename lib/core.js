"use strict"

var inspect = require("./inspect.js")

var Promise = typeof global.Promise === "function"
    ? global.Promise
    : function () {
        throw new ReferenceError("A promise implementation is needed")
    }

var AssertionError
try {
    // If it's an ES6 engine, let's use a native subclass. If it isn't, or the
    // `Function` constructor is blocked because of CSP, there is a graceful
    // fallback.
    /* eslint-disable no-new-func */
    AssertionError = new Function(
        "'use strict'\n" +
        "class AssertionError extends Error {\n" +
        "    constructor(message, expected, actual) {\n" +
        "        super(message)\n" +
        "\n" +
        "        this.expected = expected\n" +
        "        this.actual = actual\n" +
        "    }\n" +
        "\n" +
        "    get name() {\n" +
        "        return 'AssertionError'\n" +
        "    }\n" +
        "\n" +
        "    toJSON(includeStack) {\n" +
        "        return {\n" +
        "            name: this.name,\n" +
        "            message: this.message,\n" +
        "            expected: this.expected,\n" +
        "            actual: this.actual,\n" +
        "            stack: includeStack ? this.stack : undefined,\n" +
        "        }\n" +
        "    }\n" +
        "}\n" +
        // Test that native subclasses are actually *supported*. Some engines
        // with incomplete ES6 support will fail here.
        "new AssertionError('test', true, false)\n" +
        "return AssertionError"
    )()
    /* eslint-enable no-new-func */
} catch (e) {
    AssertionError = (function () {
        function AssertionError(message, expected, actual) {
            this.message = message
            this.expected = expected
            this.actual = actual

            if (typeof Error.captureStackTrace === "function") {
                Error.captureStackTrace(this, AssertionError)
            } else {
                var e = new Error(message)
                e.name = this.name
                this.stack = e.stack
            }
        }

        AssertionError.prototype = Object.create(Error.prototype)
        AssertionError.prototype.constructor = AssertionError
        AssertionError.prototype.name = "AssertionError"

        AssertionError.prototype.toJSON = function (includeStack) {
            return {
                name: this.name,
                message: this.message,
                expected: this.expected,
                actual: this.actual,
                stack: includeStack ? this.stack : undefined,
            }
        }

        return AssertionError
    })()
}

function runTests(ctx, res) {
    if (res.type === "pass") {
        // Tests are called in sequence for obvious reasons.
        return ctx.tests
        .reduce(
            function (p, test) {
                return p.then(function () { return test.run() })
            },
            Promise.resolve())
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
        return new Promise(function (resolve, reject) {
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
        Promise.resolve())
    // Call the non-blocking reporters all at once.
    .then(function () { return Promise.all(concurrent.map(call)) })
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

var asyncTest = factory(function (methods, name, index, callback) {
    return {methods: methods, name: name, index: index, callback: callback}
}, function (ctx) {
    return new Promise(function (resolve) {
        var methods = Object.create(ctx.methods)
        methods._ = ctx

        var count = 0

        function error(err) {
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

            if (err != null) return error(err)
            return resolve({type: "pass"})
        }

        try {
            var res = ctx.callback.call(methods, methods, done)
            if (res != null && typeof res.then === "function") {
                res.then(function () { return resolve({type: "pass"}) }, error)
            }
        } catch (e) {
            // Synchronous failures when initializing an async test are test
            // failures, not fatal errors.
            return error(e)
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

function define(base, name, func) {
    if (typeof func !== "function") {
        throw new TypeError("Expected body of t." + name + " to be a function")
    }

    function run() {
        var res = func.apply(null, arguments)

        if (typeof res !== "object" || res == null) {
            throw new TypeError("Expected result for t." + name +
                " to be an object")
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
                Promise = P
            } else {
                return Promise
            }
        },

        use: function (plugin) {
            checkInit(this._)
            if (this._.plugins.indexOf(plugin) < 0) {
                // Add plugin before calling it.
                this._.plugins.push(plugin)
                plugin.call(this, this)
            }
            return this
        },

        define: function (name, func) {
            checkInit(this._)
            if (typeof name === "object") {
                for (var key in name) {
                    if ({}.hasOwnProperty.call(name, key)) {
                        define(this, key, name[key])
                    }
                }
            } else {
                if (typeof name !== "string") {
                    throw new TypeError("name must be a string if func exists")
                }

                define(this, name, func)
            }
            return this
        },

        // This should *always* be used by plugin authors if a method modifies
        // state.
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

            if (typeof callback !== "function") {
                throw new TypeError(
                    "Expected callback to either be a function or not exist")
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
        reporter: function (reporter) {
            checkInit(this._)

            if (Array.isArray(reporter)) {
                for (var i = 0; i < reporter.length; i++) {
                    this.reporter(reporter[i])
                }
            } else {
                if (typeof reporter !== "function") {
                    throw new TypeError("Expected reporter to be a function")
                }

                if (this._.reporters == null) {
                    this._.reporters = [reporter]
                } else if (this._.reporters.indexOf(reporter) < 0) {
                    this._.reporters.push(reporter)
                }
            }

            return this
        },

        // Export the AssertionError constructor
        AssertionError: AssertionError,
    }
    ret._ = baseTest(ret)
    return ret
}
