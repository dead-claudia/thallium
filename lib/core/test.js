"use strict"

var Promise = require("bluebird")
var m = require("../messages.js")
var Flags = require("./flags.js")
var Common = require("./common.js")
var r = Common.r
var report = Common.report

function runChildTest(p, test) {
    return p.then(function () {
        return runTest(test, false)
    })
}

function runChildTests(tests) {
    var p = Promise.resolve()

    for (var i = 0; i < tests.length; i++) {
        p = runChildTest(p, tests[i])
    }

    return p
}

function deinitTest(test) {
    test.status &= ~Flags.Init

    for (var i = 0; i < test.tests.length; i++) {
        var child = test.tests[i]

        if (child.status & Flags.Inline) {
            deinitTest(child)
        }
    }
}

function reinitInline(test) {
    for (var i = 0; i < test.tests.length; i++) {
        var child = test.tests[i]

        if (child.status & Flags.Inline) {
            child.status |= Flags.Init
            reinitInline(child)
        }
    }
}

function removeChildren(test) {
    // This loop to break all the circular references, including to this test.
    for (var i = 0; i < test.tests.length; i++) {
        var child = test.tests[i]

        // Inline tests need to keep their data.
        if (!(child.status & Flags.Inline)) {
            child.parent = undefined
            removeChildren(child)
        }
    }

    test.tests = []
}

function runSkipTest(test, isMain) {
    if (isMain) {
        return report(test, r("start"))
        .then(function () { return report(test, r("end")) })
    } else {
        return report(test, r("skip"))
    }
}

function runRootTest(test) {
    return report(test, r("start"))
    .then(function () {
        deinitTest(test)
        return runChildTests(test.tests)
    })
    .then(function () { return report(test, r("end")) })
    // Don't forget to reinit the inline tests
    .finally(function () {
        test.status |= Flags.Init
        reinitInline(test)
    })
}

function runMainChild(test) {
    return report(test, r("start"))
    .then(function () {
        test.status |= Flags.Init

        return (0, test.state.init)(test)
    })
    .then(function (result) {
        deinitTest(test)

        // Errors at the top level are considered fatal for the parent.
        if (result.caught) throw result.value
        return runChildTests(test.tests)
        .then(function () { return report(test, r("end")) })
    })
    .finally(function () {
        // If the children are accessible, don't forget to reinit the inline
        // tests. Otherwise, remove the child tests so running tests is
        // repeatable.
        if (test.status & Flags.Inline) {
            reinitInline(test)
        } else {
            removeChildren(test)
        }
    })
}

function runNormalChild(test) {
    test.status |= Flags.Init

    return Promise.resolve((0, test.state.init)(test))
    .then(function (result) {
        deinitTest(test)

        if (result.attempt.caught) {
            return report(test, r("fail", result.attempt.value, result.time))
        } else if (test.tests.length !== 0) {
            // Report this as if it was a parent test if it's passing and has
            // children.
            return report(test, r("enter", undefined, result.time))
            .then(function () { return runChildTests(test.tests) })
            .then(function () { return report(test, r("leave")) })
        } else {
            return report(test, r("pass", undefined, result.time))
        }
    })
    .finally(function () {
        // If the children are accessible, don't forget to reinit the inline
        // tests. Otherwise, remove the child tests so running tests is
        // repeatable.
        if (test.status & Flags.Inline) {
            reinitInline(test)
        } else {
            removeChildren(test)
        }
    })
}

function runTestBody(test, isMain) {
    if (test.status & Flags.HasSkip) {
        return runSkipTest(test, isMain)
    } else if (test.status & Flags.Root) {
        return runRootTest(test)
    } else if (isMain) {
        return runMainChild(test)
    } else {
        return runNormalChild(test)
    }
}

/**
 * This runs the test, and returns a promise resolved when it's done.
 *
 * @param {test} test The current test
 * @param {Boolean} isMain Whether the test is run directly as the main
 *                         test or as a child test.
 */
exports.runTest = runTest
function runTest(test, isMain) {
    if (test.status & Flags.Dummy) {
        return Promise.resolve()
    }

    if (test.status & Flags.Running) {
        throw new Error(m("run.concurrent"))
    }

    test.status |= Flags.Running

    return runTestBody(test, !!isMain)
    .finally(function () { test.status &= ~Flags.Running })
}

exports.initBase = initBase
function initBase(methods, name, index) {
    return Object.seal({
        // Placeholders
        methods: null,
        parent: null,
        reporters: null,

        plugins: [],
        tests: [],

        name: name,
        index: index|0,

        // Placeholder for `only` tree
        only: null,

        // Placeholder for test-specific state
        state: null,

        // Placeholder for callback
        callback: null,

        // The status of this test, a mask whose bits are detailed in the Flags
        // enum.
        status: 0,

        // 0 means inherit timeout
        timeout: 0,

        // 0 means inherit slow timeout.
        slow: 0,
    })
}

exports.initTest = function (methods, name, index) {
    var test = initBase(methods, name, index|0)

    test.methods = Object.create(methods)
    test.parent = methods._
    test.methods._ = test
    test.reporters = methods._.reporters

    // The status of this test, a mask whose bits are detailed in the Flags
    // enum.
    test.status = methods._.status & (Flags.Skipped | Flags.OnlyChild)
    return test
}
