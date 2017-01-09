"use strict"

/* eslint-env mocha */

/**
 * Global settings. These are also configurable in Node via the environment.
 */
var settings = {
    migrate: false,
    release: false,
}

if (global.process != null && global.process.env != null) {
    if (!settings.migrate) settings.migrate = !!global.process.env.MIGRATE
    if (!settings.release) global.process.env.NODE_ENV = "development"
} else {
    // Polyfill Promise
    require("es6-promise/auto") // eslint-disable-line global-require
}

/**
 * This exports everything as globals, and it is Browserified as well.
 */
var Thallium = require("../lib/browser-bundle.js")
var Tests = require("../lib/core/tests.js")

var assert = global.assert = Thallium.assert
var Util = global.Util = {
    r: Thallium.r,
    create: Thallium.root,
    n: Thallium.reports,
    p: Thallium.location,
    hooks: Thallium.hookErrors,
    Tests: Tests,

    /* eslint-disable global-require */

    Reports: require("../lib/core/reports.js"),

    // Various dependencies used throughout the tests, minus the CLI tests. It's
    // easier to inject them into this bundle rather than to try to implement a
    // module loader.

    peach: require("../lib/util.js").peach,

    // Chrome complains of an illegal invocation without a bound `this`.
    setTimeout: function (func, duration) {
        return global.setTimeout(func, duration)
    },

    methods: require("../lib/methods.js"),
    R: require("../lib/reporter/index.js"),
    inspect: require("../lib/replaced/inspect.js"),

    /* eslint-enable global-require */

    // For some of the reporters
    const: function (x) {
        return function () { return x }
    },
}

// Inject a no-op into browsers (so the relevant tests actually run), but not
// into older Node versions unsupported by jsdom and JS environments that don't
// support the DOM nor CommonJS APIs.
Util.jsdom = (function () {
    if (!global.process) {
        if (!global.window || !global.console) return undefined

        var EventEmitter = require("events").EventEmitter // eslint-disable-line global-require, max-len

        return function () {
            var console = global.console
            var keys = Object.keys(console)
            var emitter

            // Adapted from jsdom's own adapter
            function wrapConsoleMethod(method) {
                return function () {
                    var args = [method]

                    for (var i = 0; i < arguments.length; i++) {
                        args.push(arguments[i])
                    }

                    emitter.emit.apply(emitter, args)
                }
            }

            function ConsoleMock() {
                for (var i = 0; i < keys.length; i++) {
                    this[keys[i]] = wrapConsoleMethod(keys[i])
                }
            }

            beforeEach("jsdom injection", function () {
                emitter = new EventEmitter()
                emitter.on("error", function () {
                    // Don't throw an exception if the emitter doesn't have any
                    // "error" event listeners.
                })
                global.console = new ConsoleMock()
            })

            afterEach("jsdom injection", function () {
                global.console = console
                emitter = undefined
            })

            return {
                window: function () { return global.window },
                console: function () { return emitter },
            }
        }
    } else {
        var exec = /^v(\d+)/.exec(global.process.version)

        // Update this version number whenever jsdom increases their minimum
        // supported Node version.
        if (exec == null || exec[1] < 4) return undefined

        var jsdom = require("jsdom") // eslint-disable-line global-require
        var html = '<!doctype html><meta charset="utf-8">'

        return function (opts) {
            var document

            beforeEach("jsdom injection", function () {
                if (opts == null) opts = {}
                if (opts.features == null) opts.features = {}
                if (opts.features.FetchExternalResources == null) {
                    opts.features.FetchExternalResources = false
                }
                if (opts.features.ProcessExternalResources == null) {
                    opts.features.ProcessExternalResources = false
                }

                document = jsdom.jsdom(html, opts)
            })

            afterEach("jsdom injection", function () {
                document = undefined
            })

            return {
                window: function () {
                    return document.defaultView
                },
                console: function () {
                    return jsdom.getVirtualConsole(document.defaultView)
                },
            }
        }
    }
})()

Util.push = function (ret) {
    var keep = false

    if (!Array.isArray(ret)) {
        keep = ret.keep
        ret = ret.ret
    }

    return function push(report) {
        // Any equality tests on either of these are inherently flaky.
        // Only add the relevant properties
        if (report.isFail || report.isError || report.isHook) {
            assert.hasOwn(report, "error")
        }

        if (report.isEnter || report.isPass || report.isFail) {
            assert.hasOwn(report, "duration")
            assert.hasOwn(report, "slow")
            assert.isNumber(report.duration)
            assert.isNumber(report.slow)
            if (!keep) {
                report.duration = 10
                report.slow = 75
            }
        }

        ret.push(report)
    }
}

var AssertionError = assert.AssertionError

Util.fail = function (name) {
    var args = []

    for (var i = 1; i < arguments.length; i++) {
        args.push(arguments[i])
    }

    // Silently swallowing exceptions is bad, so we can't use traditional
    // Thallium assertions to test.
    try {
        assert[name].apply(undefined, args)
    } catch (e) {
        if (e instanceof AssertionError) return
        throw e
    }

    throw new AssertionError(
        "Expected t." + name + " to throw an AssertionError",
        AssertionError)
}

Util.basic = function (desc, callback) {
    describe(desc, function () {
        it("works", callback)
    })
}

if (settings.migrate) Thallium.migrate()
