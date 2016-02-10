;(function (value, factory) { // eslint-disable-line
    "use strict"
    /* eslint-disable no-undef */
    if (typeof global !== "undefined") {
        value = global
    } else if (typeof self !== "undefined") {
        value = self
    } else if (typeof window !== "undefined") {
        value = window
    }
    /* eslint-enable no-undef */

    var t = factory(value)
    /* eslint-disable no-undef */
    if (typeof module === "object" && module != null && module.exports) {
        module.exports = t
    } else if (typeof define === "function" && define.amd) {
        define("techtonic/core", function () { return t })
        /* eslint-enable no-undef */
    } else {
        value.t = value.techtonic = t
    }
})(this, function (global, undefined) { // eslint-disable-line
    "use strict"

    var inspect = (function () {
        /**
         * This file contains code under the MIT license. Most of said code is a
         * close copy from util-inspect, which itself is derived from Node, but
         * there are a few differences and modifications, including the fact
         * this requires ES5. All code in this file under the MIT license is in
         * this IIFE.
         */

        // ES6, section 24.2.3.3 - QuoteJSONString(value)
        // http://www.ecma-international.org/ecma-262/6.0/#sec-quotejsonstring
        //
        // This deviates by returning a single-quoted string instead, because
        // the rest of this uses that instead.
        function quote(value) {
            // Step 1
            var product = "'"

            // Step 2 - iterate through characters
            //
            // Technically, the spec says to iterate through code points, but
            // you can safely ignore this unless you need to manipulate
            // surrogates, which isn't the case here.
            for (var i = 0; i < value.length; i++) {
                var code = value.charCodeAt(i)

                switch (code) {
                // Step 2.a
                case 0x27 /* single quote */: product += "\\'"; break
                case 0x5c /* backslash */: product += "\\\\"; break

                // Step 2.b
                case 0x08 /* backspace */: product += "\\b"; break
                case 0x0a /* newline */: product += "\\n"; break
                case 0x0b /* tab */: product += "\\t"; break
                case 0x0c /* form feed */: product += "\\f"; break
                case 0x0d /* carriage return */: product += "\\r"; break

                default:
                    // Step 2.c
                    if (code < 0x20 /* space */) {
                        // Doing it this way so I don't have to pad the string.
                        product += code < 0x10 ? "\\u000" : "\\u00"
                        product += code.toString(16)
                    } else {
                        // Step 2.d
                        product += value[i]
                    }
                }
            }

            return product + "'"
        }

        /**
         * Echos the value of a value. Trys to print the value out
         * in the best way possible given the different types.
         *
         * @param {Object} obj The object to print out.
         * @param {Object} opts Optional options object that alters the output.
         * @license MIT (© Joyent)
         */

        /* legacy: obj, showHidden, depth, colors*/
        inspect = function (obj, opts) {
            // default options
            var ctx = {
                seen: [],
                stylize: stylizeNoColor,
            }
            // legacy...
            if (arguments.length >= 3) ctx.depth = arguments[2]
            if (arguments.length >= 4) ctx.colors = arguments[3]
            if (typeof opts === "boolean") {
                // legacy...
                ctx.showHidden = opts
            } else if (opts) {
                // got an "options" object
                _extend(ctx, opts)
            }
            // set default options
            if (ctx.showHidden === undefined) ctx.showHidden = false
            if (ctx.depth === undefined) ctx.depth = 2
            if (ctx.colors === undefined) ctx.colors = false
            if (ctx.customInspect === undefined) ctx.customInspect = true
            if (ctx.colors) ctx.stylize = stylizeWithColor
            return formatValue(ctx, obj, ctx.depth)
        }

        // http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
        var inspectColors = {
            bold: [1, 22],
            italic: [3, 23],
            underline: [4, 24],
            inverse: [7, 27],
            white: [37, 39],
            grey: [90, 39],
            black: [30, 39],
            blue: [34, 39],
            cyan: [36, 39],
            green: [32, 39],
            magenta: [35, 39],
            red: [31, 39],
            yellow: [33, 39],
        }

        // Don't use 'blue' not visible on cmd.exe
        var inspectStyles = {
            special: "cyan",
            number: "yellow",
            boolean: "yellow",
            undefined: "grey",
            null: "bold",
            string: "green",
            date: "magenta",
            // name: intentionally not styling
            regexp: "red",
        }

        function stylizeNoColor(str) {
            return str
        }

        function stylizeWithColor(str, styleType) {
            var style = inspectStyles[styleType]

            if (style) {
                return "\u001b[" + inspectColors[style][0] + "m" + str +
                   "\u001b[" + inspectColors[style][1] + "m"
            } else {
                return str
            }
        }

        var hasOwn = {}.hasOwnProperty
        var toString = {}.toString

        function isError(e) {
            return e != null &&
                (toString.call(e) === "[object Error]" || e instanceof Error)
        }

        function arrayToHash(array) {
            var hash = {}

            array.forEach(function (val) {
                hash[val] = true
            })

            return hash
        }

        function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
            var output = []
            for (var i = 0, l = value.length; i < l; ++i) {
                if (hasOwn.call(value, i)) {
                    output.push(formatProperty(ctx, value, recurseTimes,
                        visibleKeys, String(i), true))
                } else {
                    output.push("")
                }
            }

            keys.forEach(function (key) {
                if (!key.match(/^\d+$/)) {
                    output.push(formatProperty(ctx, value, recurseTimes,
                        visibleKeys, key, true))
                }
            })

            return output
        }

        var errorToString = Error.prototype.toString

        function formatError(value) {
            return "[" + errorToString.call(value) + "]"
        }

        var regexpToString = /./.toString
        var dateToString = new Date().toString
        var dateToUTCString = new Date().toUTCString

        function formatValue(ctx, value, recurseTimes) { // eslint-disable-line max-statements, max-len
            // Provide a hook for user-specified inspect functions.
            // Check that value is an object with an inspect function on it
            if (ctx.customInspect &&
                    value != null && typeof value.inspect === "function" &&
                    // Also filter out any prototype objects using the circular
                    // check.
                    !(value.constructor &&
                        value.constructor.prototype === value)) {
                var ret = value.inspect(recurseTimes, ctx)
                if (typeof ret === "string") return ret
                return formatValue(ctx, ret, recurseTimes)
            }

            // Primitive types cannot have properties
            var primitive = formatPrimitive(ctx, value)
            if (primitive) {
                return primitive
            }

            // Look up the keys of the object.
            var keys = Object.keys(value)
            var visibleKeys = arrayToHash(keys)

            if (ctx.showHidden && Object.getOwnPropertyNames) {
                keys = Object.getOwnPropertyNames(value)
            }

            // IE doesn't make error fields non-enumerable
            // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
            if (isError(value) &&
                    (keys.indexOf("message") >= 0 ||
                    keys.indexOf("description") >= 0)) {
                return formatError(value)
            }

            // Some type of object without properties can be shortcutted.
            if (keys.length === 0) {
                if (typeof value === "function") {
                    var name = value.name ? ": " + value.name : ""
                    return ctx.stylize("[Function" + name + "]", "special")
                }
                if (toString.call(value) === "[object RegExp]") {
                    return ctx.stylize(regexpToString.call(value), "regexp")
                }

                if (toString.call(value) === "[object Date]") {
                    return ctx.stylize(dateToString.call(value), "date")
                }

                if (isError(value)) {
                    return formatError(value)
                }
            }

            var base = ""
            var array = false
            var braces = ["{", "}"]

            // Make Array say that they are Array
            if (Array.isArray(value)) {
                array = true
                braces = ["[", "]"]
            }

            // Make functions say that they are functions
            if (typeof value === "function") {
                var n = value.name ? ": " + value.name : ""
                base = " [Function" + n + "]"
            }

            // Make RegExps say that they are RegExps
            if (toString.call(value) === "[object RegExp]") {
                base = " " + regexpToString.call(value)
            }

            // Make dates with properties first say the date
            if (toString.call(value) === "[object Date]") {
                base = " " + dateToUTCString.call(value)
            }

            // Make error with message first say the error
            if (isError(value)) {
                base = " " + formatError(value)
            }

            if (keys.length === 0 && (!array || value.length === 0)) {
                return braces[0] + base + braces[1]
            }

            if (recurseTimes < 0) {
                if (toString.call(value) === "[object RegExp]") {
                    return ctx.stylize(regexpToString.call(value), "regexp")
                } else {
                    return ctx.stylize("[Object]", "special")
                }
            }

            ctx.seen.push(value)

            var output
            if (array) {
                output = formatArray(ctx, value, recurseTimes, visibleKeys,
                    keys)
            } else {
                output = keys.map(function (key) {
                    return formatProperty(ctx, value, recurseTimes, visibleKeys,
                        key, array)
                })
            }

            ctx.seen.pop()

            return reduceToSingleString(output, base, braces)
        }

        function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) { // eslint-disable-line max-statements, max-len
            var name, str, desc
            desc = {value: value[key]}

            if (Object.getOwnPropertyDescriptor) {
                desc = Object.getOwnPropertyDescriptor(value, key) || desc
            }

            if (desc.get) {
                if (desc.set) {
                    str = ctx.stylize("[Getter/Setter]", "special")
                } else {
                    str = ctx.stylize("[Getter]", "special")
                }
            } else if (desc.set) {
                str = ctx.stylize("[Setter]", "special")
            }

            if (!hasOwn.call(visibleKeys, key)) {
                name = "[" + key + "]"
            }

            if (!str) {
                if (ctx.seen.indexOf(desc.value) < 0) {
                    if (recurseTimes === null) {
                        str = formatValue(ctx, desc.value, null)
                    } else {
                        str = formatValue(ctx, desc.value, recurseTimes - 1)
                    }
                    if (str.indexOf("\n") > -1) {
                        if (array) {
                            str = str.replace(/\n(?!$)/g, "\n  ").slice(2)
                        } else {
                            str = "\n" + str.replace(/\n(?!$)/g, "\n   ")
                        }
                    }
                } else {
                    str = ctx.stylize("[Circular]", "special")
                }
            }
            if (name === undefined) {
                if (array && key.match(/^\d+$/)) {
                    return str
                }
                name = quote("" + key)
                if (name.match(/^'([a-zA-Z_][a-zA-Z_0-9]*)'$/)) {
                    name = name.substr(1, name.length - 2)
                    name = ctx.stylize(name, "name")
                } else {
                    name = ctx.stylize(name, "string")
                }
            }

            return name + ": " + str
        }

        var symbolToString = typeof Symbol === "function"
            ? Symbol().toString
            : undefined

        function formatPrimitive(ctx, value) {
            if (value === undefined) {
                return ctx.stylize("undefined", "undefined")
            }

            if (typeof value === "string") {
                return ctx.stylize(quote(value), "string")
            }

            if (typeof value === "symbol") {
                return ctx.stylize(symbolToString.call(value), "symbol")
            }

            if (typeof value === "number") {
                return ctx.stylize("" + value, "number")
            }

            if (typeof value === "boolean") {
                return ctx.stylize("" + value, "boolean")
            }

            // For some reason typeof null is "object", so special case here.
            if (value === null) {
                return ctx.stylize("null", "null")
            }
        }

        function reduceToSingleString(output, base, braces) {
            var numLinesEst = 0
            var length = output.reduce(function (prev, cur) {
                numLinesEst++
                if (/\n/.test(cur)) numLinesEst++
                return prev + cur.replace(/\u001b\[\d\d?m/g, "").length + 1
            }, 0)

            if (length > 60) {
                return braces[0] +
                   (base === "" ? "" : base + "\n ") +
                   " " +
                   output.join(",\n  ") +
                   " " +
                   braces[1]
            }

            return braces[0] + base + " " + output.join(", ") + " " + braces[1]
        }

        function _extend(origin, add) {
            // Don't do anything if add isn't an object
            if (typeof add !== "object" || add === null) return origin

            var keys = Object.keys(add)
            var i = keys.length
            while (i--) {
                origin[keys[i]] = add[keys[i]]
            }
            return origin
        }

        return inspect
    })()

    var AssertionError

    try {
        // If it's an ES6 engine, let's use a native subclass. If it isn't, or
        // the `Function` constructor is blocked because of CSP, there is a
        // graceful fallback.
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
            // Test that native subclasses are actually *supported*. Some
            // engines with incomplete ES6 support will fail here.
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

    /** @this {number} The start index */
    function rest() {
        var i
        if (this == null) {
            var args = new Array(arguments.length)
            for (i = 0; i < arguments.length; i++) args[i] = arguments[i]
            return args
        } else {
            for (i = 0; i < arguments.length; i++) this.push(arguments[i])
            return this
        }
    }

    var poll, nextTick

    (function () {
        function dispatcher(defer, arg) {
            return function (func) {
                var x1, x2, x3, x4
                switch (arguments.length) {
                case 0: throw new TypeError("Expected at least a function!")
                case 1: defer(func, arg); return

                case 2:
                    x1 = arguments[1]
                    defer(function () {
                        return func(x1)
                    }, arg)
                    return

                case 3:
                    x1 = arguments[1]
                    x2 = arguments[2]
                    defer(function () {
                        return func(x1, x2)
                    }, arg)
                    return

                case 4:
                    x1 = arguments[1]
                    x2 = arguments[2]
                    x3 = arguments[3]
                    defer(function () {
                        return func(x1, x2, x3)
                    }, arg)
                    return

                case 5:
                    x1 = arguments[1]
                    x2 = arguments[2]
                    x3 = arguments[3]
                    x4 = arguments[4]
                    defer(function () {
                        return func(x1, x2, x3, x4)
                    }, arg)
                    return

                default:
                    var args = rest.apply(null, arguments)
                    defer(function () {
                        return func.apply(null, args)
                    }, arg)
                }
            }
        }

        if (typeof global.process === "object") {
            // Node 0.x need the dispatcher for nextTick, but the others accept
            // raw arguments.
            nextTick = /^v0\./.test(global.process.version)
                ? dispatcher(global.process.nextTick)
                : global.process.nextTick

            poll = global.setImmediate
        } else {
            // rAF doesn't work well for polling, since it blocks rendering, and
            // thus may block normal execution. It might be preferable in
            // browsers to include a setImmediate polyfill if the polling runs
            // too slow, but the performance needs tested first.

            if (typeof global.requestAnimationFrame === "function") {
                nextTick = dispatcher(global.requestAnimationFrame)
            }

            if (typeof global.window.setImmediate === "function") {
                poll = dispatcher(global.window.setImmediate)
            } else {
                poll = dispatcher(global.setTimeout, 4)
            }

            nextTick = nextTick || poll
        }
    })()

    // Only use this if it's already known to be a thenable.
    function resolveKnownThenable(value, pass, fail) {
        var resolved = false
        return value.then(function (value) {
            if (resolved) return
            resolved = true
            return poll(pass, value)
        }, function (err) {
            if (resolved) return
            resolved = true
            return poll(fail, err)
        })
    }

    function resolveThenable(value, callback) {
        try {
            return resolveKnownThenable(
                value,
                callback.bind(null, true),
                callback.bind(null, false))
        } catch (err) {
            return callback(false, err)
        }
    }

    function runTests(ctx, res, callback) {
        // Tests are called in sequence for obvious reasons.
        function iterate(i) {
            if (i === ctx.tests.length) return callback(null, res)
            ctx.tests[i].run(false, function (err) {
                if (err != null) return callback(err)
                return iterate(i + 1)
            })
        }

        if (res.type === "pass") {
            iterate(0)
        } else {
            // If the init failed, then this has already failed.
            return callback(null, res)
        }
    }

    function checkInit(ctx) {
        if (!ctx.initializing) {
            throw new ReferenceError(
                "It is only safe to call test methods during initialization")
        }
    }

    function run(ctx, init, isMain, callback) {
        if (ctx.running) {
            throw new Error("Can't run the same test concurrently")
        }

        ctx.running = true

        var index = isMain ? -1 : ctx.index

        function finish(err) {
            if (err != null) return callback(err)
            if (isMain) {
                return report(ctx, {type: "exit", index: 0}, function (err) {
                    if (err != null) return callback(err)
                    ctx.running = false
                    return callback()
                })
            } else {
                ctx.running = false
                return callback()
            }
        }

        function next(err) {
            if (err != null) return callback(err)
            ctx.initializing = true
            return init(ctx, function (err, res) {
                if (err != null) return callback(err)
                ctx.initializing = false

                for (var i = 0; i < ctx.deinit.length; i++) {
                    ctx.deinit[i].initializing = false
                }

                return runTests(ctx, res, function (err, res) {
                    if (err != null) return callback(err)
                    return report(ctx, {
                        type: "end",
                        index: index,
                    }, function (err) {
                        if (err != null) return callback(err)
                        return report(ctx, {
                            type: res.type,
                            index: index,
                            value: res.value,
                        }, finish)
                    })
                })
            })
        }

        nextTick(report, ctx, {type: "start", index: index}, next)
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

    function once(func) {
        return /** @this */ function () {
            if (func == null) return
            var f = func
            func = null
            return f.apply(this, arguments)
        }
    }

    function nodeifyThen(func, value, callback) {
        var resolved = false

        function errback(err) {
            if (resolved) return
            resolved = true
            return nextTick(callback, err)
        }

        try {
            var res = func(value, errback)

            if (isThenable(res)) {
                return res.then(function () {
                    if (resolved) return
                    resolved = true
                    return nextTick(callback)
                }, errback)
            }
        } catch (err) {
            return nextTick(callback, err)
        }
    }

    function report(ctx, args, callback) {
        // Reporters are allowed to block, and these are always called first.
        var reporters = activeReporters(ctx)

        // If this becomes a bottleneck, there's other issues.
        var blocking = reporters.filter(function (x) { return x.block })
        var concurrent = reporters.filter(function (x) { return !x.block })

        // Note: Reporter errors are always fatal.
        function call(reporter, callback) {
            var parent = args.parent
            if (!ctx.isBase && parent == null) {
                parent = getData(ctx.parent)
            }

            try {
                return nodeifyThen(reporter, {
                    type: args.type, index: args.index, value: args.value,
                    name: ctx.name,
                    parent: parent,
                }, callback)
            } catch (e) {
                return nextTick(callback, e)
            }
        }

        // Call the non-blocking reporters all at once.
        function callConcurrent(callback) {
            var count = concurrent.length
            if (count === 0) return callback()

            function next(err) {
                if (count === 0) return
                if (err != null) {
                    count = 0
                    return callback(err)
                } else {
                    count--
                    if (count === 0) return callback()
                }
            }

            for (var i = 0; i < concurrent.length; i++) {
                call(concurrent[i], once(next))
            }
        }

        // Call the blocking reporters individually.
        function callBlocking(i, next) {
            if (i === blocking.length) return next()
            var reporter = blocking[i]
            return call(reporter, once(function (err) {
                if (err != null) return nextTick(next, err)
                return nextTick(callBlocking, i + 1, next)
            }))
        }

        callBlocking(0, function (err) {
            if (err != null) return callback(err)
            return callConcurrent(callback)
        })
    }

    var DEFAULT_TIMEOUT = 2000

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

            // 0 means inherit timeout
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

            run: function (_, callback) {
                this.running = true

                var self = this

                function finish(err) {
                    if (err != null) return callback(err)
                    return report(self, {
                        type: "exit",
                        index: 0,
                    }, function (err) {
                        if (err != null) return callback(err)
                        self.running = false
                        return callback()
                    })
                }

                function next(err) {
                    if (err != null) return callback(err)

                    // Only unset it to run the tests.
                    self.initializing = false

                    return runTests(self, {type: "pass"}, function (err) {
                        if (err != null) return callback(err)
                        self.initializing = true
                        return report(self, {type: "end", index: -1}, finish)
                    })
                }

                nextTick(report, self, {type: "start", index: -1}, next)
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
    }, function (ctx, callback) {
        for (var i = 0; i < ctx.inline.length; i++) {
            var inline = ctx.inline[i]
            try {
                inline.run.apply(null, inline.args)
            } catch (e) {
                // If an assertion failed, then this has already failed.
                return nextTick(callback, null, {type: "fail", value: e})
            }
        }

        return nextTick(callback, null, {type: "pass"})
    })

    var blockTest = factory(function (methods, name, index, callback) {
        return {methods: methods, name: name, index: index, callback: callback}
    }, function (ctx, callback) {
        var methods = Object.create(ctx.methods)
        methods._ = ctx

        try {
            ctx.callback.call(methods, methods)
        } catch (e) {
            return nextTick(callback, null, {type: "fail", value: e})
        }

        return nextTick(callback, null, {type: "pass"})
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
        // 0 means inherit timeout
        if (ctx.timeout || ctx.isBase) {
            return {isSelf: true, timeout: ctx.timeout || DEFAULT_TIMEOUT}
        }

        while (!ctx.timeout && !ctx.isBase) {
            ctx = ctx.parent
        }
        return {isSelf: false, timeout: ctx.timeout || DEFAULT_TIMEOUT}
    }

    // Note: do *not* add any other variables to this, as Node and this only
    // optimizes up to 4 arguments (and polling has to be as quick as possible).
    //
    // This doesn't use `nextTick`, because that will prevent I/O, which may
    // occur during the test.

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
            return poll(pollParentTimeout, timeout, ctx, start, data)
        }
    }

    function pollThisTimeout(timeout, ctx, start, data) {
        if (data.resolved) return

        if (ctx.timeout) {
            if (+new Date() - start >= ctx.timeout) {
                return data.timerFail(ctx.timeout)
            } else {
                return poll(pollThisTimeout, timeout, ctx, start, data)
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

    // Adapted from https://www.promisejs.org/generators/
    function runIterator(gen, pass, fail) {
        // This implements IteratorClose from ES6, section 7.4.6, but adapted
        // for this, and waits for promise resolution. The iterators need to be
        // able to clean up.
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

            return nextTick(fail, value)
        }

        function tryHandle(success, value) {
            var result
            try {
                if (success) {
                    result = gen.next(value)
                } else if (typeof gen.throw === "function") {
                    result = gen.throw(value)
                } else {
                    // If it's an error, and there's no `throw` to handle it,
                    // then it should close the iterator.
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
                return nextTick(tryHandle, false, new TypeError(message))
            }

            var value = result.value

            if (result.done) {
                if (isThenable(value)) {
                    return poll(resolveThenable, value, close)
                } else {
                    return poll(close, true, value)
                }
            } else if (isThenable(value)) {
                return poll(resolveThenable, value, tryHandle)
            } else {
                return poll(tryHandle, true, value)
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
    }, function (ctx, callback) {
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
            if (pollData.resolved) return
            pollData.resolved = true
            return nextTick(callback, null, {type: "pass"})
        }

        function fail(err) {
            if (pollData.resolved) return
            pollData.resolved = true
            return nextTick(callback, null, {type: "fail", value: err})
        }

        function done(err) {
            if (count++) {
                // Since this can't really give this through the standard
                // sequence, the full path is required. Error are ignored in
                // this callback, since there is no reliable way to handle them.
                nextTick(report, ctx, {
                    type: "extra",
                    index: ctx.index,
                    value: {
                        count: count,
                        value: err,
                    },
                    parent: getPath(ctx.parent),
                }, function () {})
            } else {
                return err != null ? fail(err) : pass()
            }
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
            return nextTick(fail, e)
        }
    })

    /**
     * Primitive for defining test assertions.
     */

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

    function techtonic() {
        var ret = {
            // Placeholder for a circular reference
            _: null,

            // Exposed for testing, but might be interesting for consumers.
            base: techtonic,

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
                    return ctx.timeout || DEFAULT_TIMEOUT
                }
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
                checkInit(this._)

                if (this._.running) {
                    throw new Error("Can't run the same test concurrently")
                }

                if (typeof callback === "function") {
                    this._.run(true, callback)
                } else {
                    var state = {
                        ready: false,
                        error: null,
                        pass: null,
                        fail: null,
                    }

                    this._.run(true, function (err) {
                        if (state.ready) {
                            return err != null
                                ? (0, state.fail)(err)
                                : (0, state.pass)()
                        } else {
                            state.ready = true
                            state.error = err
                        }
                    })

                    return {
                        then: function (resolve, reject) {
                            if (state.ready) {
                                return state.err != null
                                    ? reject(state.err)
                                    : resolve()
                            } else {
                                state.ready = true
                                state.pass = resolve
                                state.fail = reject
                            }
                        },
                    }
                }
            },

            test: function (name, callback) {
                if (typeof name !== "string") {
                    throw new TypeError("Expected name to be a string")
                }

                if (typeof callback !== "function" && callback != null) {
                    throw new TypeError(
                        "Expected callback to be a function or not exist")
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

            // Call to get a list of active reporters, either on this instance
            // or on the closest parent. This is the *only* method that can be
            // called at any point, as the result is a different reference.
            reporters: function () {
                return activeReporters(this._).slice()
            },

            // Add a single reporter. Multiple calls to this are allowed, and
            // this may be passed either a single reporter or any number of
            // possibly nested lists of them.
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

    return techtonic()
})
