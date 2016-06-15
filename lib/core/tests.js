"use strict"

var m = require("../messages.js")
var Try = require("./try.js")
var Flags = require("./flags.js")
var Test = require("./test.js")
var result = require("./common.js").result

exports.async = require("./async.js")

// Prevent Sinon interference when they install their mocks
var now = global.Date.now

exports.base = function (methods) {
    return new Test.Base(
        methods,
        Flags.Root | Flags.Init | Flags.HasReporter | Flags.OnlyChild,
        [],
        undefined)
}

/**
 * The sync namespace, for `t.test()`.
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
                name = test.data.name + " " + name
                test = test.data.parent
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
    var inline = test.data.state.inline
    var end = inline.length

    // The unit tests use child-less inline tests a ton, as it's easier to
    // type. But for users, it's likely a mistake, and they probably meant
    // to use `t.testSkip()`.
    if (end === 0 && !(test.status & Flags.HasSkip)) {
        warnNoArgs(test)
    }

    var start = now()
    var attempt = Try.pass()

    // Stop immediately like what block tests do.
    for (var i = 0; i < end && !attempt.caught; i++) {
        attempt = Try.tryN(inline[i].run, undefined, inline[i].args)
    }

    return result(now() - start, attempt)
}

function initInline(methods, name, index, mask) {
    // Initialize the test now, because the methods are immediately
    // returned, instead of being revealed through the callback.
    return Test.create(methods, Flags.Init | Flags.Inline | mask,
        new Test.Data(name, index, methods._, {
            inline: [],
            init: inlineInit,
        }))
}

function blockInit(test) {
    var init = test.data.state.callback
    var start = now()
    var attempt = Try.try1(init, test.methods, test.methods)

    return result(now() - start, attempt)
}

exports.Sync = Object.freeze({
    inline: function (methods, name, index) {
        return initInline(methods, name, index, 0)
    },
    block: function (methods, name, index, callback) {
        return Test.create(methods, 0,
            new Test.Data(name, index, methods._, {
                callback: callback,
                init: blockInit,
            }))
    },
})

/**
 * This is for inline tests filtered out by `t.only()` or children of inline
 * `t.testSkip()` tests. It does nothing when run.
 */
exports.dummyInline = function (methods, name, index) {
    var test = initInline(methods, name, index, Flags.Skipped | Flags.Dummy)

    test.status &= ~Flags.OnlyChild
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
        return initInline(methods, name, index, Flags.Skipped | Flags.HasSkip)
    },

    block: function (methods, name, index) {
        return Test.create(methods, Flags.Skipped | Flags.HasSkip,
            new Test.Data(name, index, methods._, undefined))
    },
})
