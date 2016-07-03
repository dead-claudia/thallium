"use strict"

/* eslint-env mocha */

/**
 * This exports everything as globals, and it is Browserified as well.
 */
var Thallium = require("../lib/browser-bundle.js")
var t = global.t = Thallium.t
var Util = global.Util = {
    assertions: Thallium.assertions,
    r: Thallium.r,

    /* eslint-disable global-require */

    // Various dependencies used throughout the tests, minus the CLI tests. It's
    // easier to inject them into this bundle rather than to try to implement a
    // module loader.
    Promise: require("bluebird"),
    setTimeout: global.setTimeout.bind(global),
    getStack: require("../lib/util.js").getStack,
    m: require("../lib/messages.js"),
    methods: require("../lib/methods.js"),
    R: require("../lib/reporter/index.js"),
    Resolver: require("../lib/resolver.js"),
    inspect: require("../lib/inspect.js"),
    silenceEmptyInlineWarnings: function () {
        require("../lib/core/tests.js").silenceEmptyInlineWarnings()
    },

    /* eslint-enable global-require */
}

// We need to set the environment to not warn on inline tests not having
// children, because they're used so extensively in testing. It remains an
// external function since if the module gets reloaded, it may need
// re-suppressed.
Util.silenceEmptyInlineWarnings()

// Inject a no-op into browsers (so the relevant tests actually run), but not
// into older Node versions unsupported by jsdom.
if (!global.process) {
    Util.jsdom = function () {}
} else {
    var exec = /^v(\d+)/.exec(global.process.version)

    // Update this version number whenever jsdom increases their minimum
    // supported Node version.
    if (exec != null && exec[1] >= 4) {
        var jsdom = require("jsdom-global") // eslint-disable-line global-require, max-len

        Util.jsdom = function (opts) {
            var cleanup

            beforeEach(function () { cleanup = jsdom(undefined, opts) })
            afterEach(function () { cleanup() })
        }
    }
}

var AssertionError = t.reflect().AssertionError

function fixArg(arg, type) {
    if (type === "pass" || type === "fail" || type === "enter") {
        arg.duration = 10
        arg.slow = 75
    } else {
        arg.duration = -1
        arg.slow = 0
    }
}

Util.push = function (ret, keep) {
    return function push(arg, done) {
        // Any equality tests on either of these are inherently flaky.
        t.hasOwn(arg, "duration")
        t.hasOwn(arg, "slow")
        t.number(arg.duration)
        t.number(arg.slow)
        if (!keep) fixArg(arg, arg.type)
        ret.push(arg)
        return done()
    }
}

Util.n = function (type, path, value, extra) {
    if (extra == null) fixArg(extra = {}, type)
    return {
        type: type,
        path: path,
        value: value,
        duration: extra.duration,
        slow: extra.slow|0,
    }
}

Util.p = function (name, index) {
    return {name: name, index: index}
}

Util.fail = function (name) {
    var args = []

    for (var i = 1; i < arguments.length; i++) {
        args.push(arguments[i])
    }

    // Silently swallowing exceptions is bad, so we can't use traditional
    // Thallium assertions to test.
    try {
        t[name].apply(t, args)
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
