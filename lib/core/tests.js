"use strict"

var m = require("../messages.js")
var Try = require("./try.js")
var Flags = require("./flags.js")
var Test = require("./test.js")

exports.async = require("./async.js")

// Prevent Sinon interference when they install their mocks
var now = global.Date.now

exports.base = function (methods) {
    var test = Test.initBase(methods, undefined, 0)

    test.status |= Flags.Root | Flags.Init | Flags.HasReporter | Flags.OnlyChild
    test.reporters = []
    test.methods = methods
    test.parent = undefined
    return test
}

/**
 * The sync namespace, for `t.test()`
 */
var warnNoArgs = (function () {
    var process = global.process
    var console = global.console

    var canWarn = typeof process === "object"
        ? typeof process.env === "object" && !process.env.THALLIUM_NOWARN
        // Always warn in browsers.
        : typeof console === "object" && typeof console.warn === "function"

    if (canWarn) {
        return function (test) {
            var name = ""

            while (!(test.status & Flags.Root)) {
                name = test.name + " " + name
                test = test.parent
            }

            console.warn(m("missing.inline.body.0", name.slice(0, -1)))
            console.warn(m("missing.inline.body.1"))
            console.warn(m("missing.inline.body.2"))
        }
    } else {
        return function () {}
    }
})()

function inlineInit(test) {
    var inline = test.state.inline
    var end = inline.length

    // The unit tests use child-less inline tests a ton, as it's easier to
    // type. But for users, it's likely a mistake, and they probably meant
    // to use `t.testSkip()`.
    if (end === 0 && !(test.status & Flags.HasSkip)) {
        warnNoArgs(test)
    }

    var start = now()
    var attempt = Try.pass()

    for (var i = 0; i < end && !attempt.caught; i++) {
        var child = inline[i]

        // Stop immediately like what block tests do.
        attempt = Try.tryN(child.run, undefined, child.args)
    }

    end = now() - start

    return attempt.caught ? attempt : Try.pass(end)
}

function initInline(methods, name, index) {
    var test = Test.initTest(methods, name, index)

    // Initialize the test now, because the methods are immediately
    // returned, instead of being revealed through the callback.
    test.status |= Flags.Init | Flags.Inline
    return test
}

function blockInit(test) {
    var start = now()
    var attempt = Try.try1(test.state.callback, test.methods, test.methods)
    var end = now() - start

    return attempt.caught ? attempt : Try.pass(end)
}

exports.Sync = Object.freeze({
    inline: function (methods, name, index) {
        var test = initInline(methods, name, index)

        test.state = {
            inline: [],
            init: inlineInit,
        }

        return test
    },

    block: function (methods, name, index, callback) {
        var test = Test.initTest(methods, name, index)

        test.state = {
            callback: callback,
            init: blockInit,
        }

        return test
    },
})

/**
 * This is for inline tests filtered out by `t.only()` or children of inline
 * `t.testSkip()` tests. It does nothing when run.
 */
exports.dummyInline = function (methods, name, index) {
    var test = initInline(methods, name, index)

    test.status = (test.status | Flags.Skipped | Flags.Dummy) & ~Flags.OnlyChild
    test.state = {
        inline: [],
        init: inlineInit,
    }

    return test
}

/**
 * This namespace is for `t.testSkip()` and `t.asyncSkip()`.
 */
exports.Skip = Object.freeze({
    /**
     * This has to look like an inline test, because the methods still have
     * to be exposed, even though the tests aren't run.
     */
    inline: function (methods, name, index) {
        var test = initInline(methods, name, index)

        test.status |= Flags.Skipped | Flags.HasSkip
        test.state = {
            inline: [],
            init: inlineInit,
        }

        return test
    },

    block: function (methods, name, index) {
        var test = Test.initTest(methods, name, index)

        test.status |= Flags.Skipped | Flags.HasSkip
        return test
    },
})
