"use strict"

var Promise = require("bluebird")
var m = require("../messages.js")
var Flags = require("./flags.js")
var Common = require("./common.js")
var Types = require("./report.js").Types
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
    test.status |= Flags.Init
    for (var i = 0; i < test.tests.length; i++) {
        resetTest(test.tests[i])
    }
}

function breakReferences(test) {
    // This loop is to break all the circular references, to tell
    // not-as-sophisticated GCs it's safe to collect.
    for (var j = 0; j < test.tests.length; j++) {
        breakReferences(test.tests[j])
        test.tests[j].data = null
    }

    test.tests = []
}

function resetTest(test) {
    // If the children are accessible, don't forget to reinit the inline
    // tests. Otherwise, remove the child tests so running tests is
    // repeatable.
    if (test.status & Flags.Inline) {
        reinitInline(test)
    } else {
        for (var i = 0; i < test.tests.length; i++) {
            // Inline tests cannot be collected.
            if (!(test.tests[i].status & Flags.Inline)) {
                breakReferences(test.tests[i])
            }
        }

        test.tests = []
    }
}

function reportSimple(test, type) {
    return report(test, r(type, undefined, -1))
}

function runSkipTest(test, isMain) {
    if (isMain) {
        return reportSimple(test, Types.Start)
        .then(function () { return reportSimple(test, Types.End) })
    } else {
        return reportSimple(test, Types.Skip)
    }
}

function runRootTest(test) {
    return reportSimple(test, Types.Start)
    .then(function () {
        deinitTest(test)
        return runChildTests(test.tests)
    })
    .then(function () { return reportSimple(test, Types.End) })
    // Don't forget to reinit the inline tests
    .finally(function () { reinitInline(test) })
}

function runMainChild(test) {
    return reportSimple(test, Types.Start)
    .then(function () {
        test.status |= Flags.Init

        return (0, test.data.state.init)(test)
    })
    .then(function (result) {
        deinitTest(test)

        // Errors at the top level are considered fatal for the parent.
        if (result.caught) throw result.value
        return runChildTests(test.tests)
        .then(function () { return reportSimple(test, Types.End) })
    })
    .finally(function () { resetTest(test) })
}

function runNormalChild(test) {
    test.status |= Flags.Init

    return Promise.resolve((0, test.data.state.init)(test))
    .then(function (result) {
        deinitTest(test)

        if (result.caught) {
            return report(test, r(Types.Fail, result.value, result.time))
        } else if (test.tests.length !== 0) {
            // Report this as if it was a parent test if it's passing and has
            // children.
            return report(test, r(Types.Enter, undefined, result.time))
            .then(function () { return runChildTests(test.tests) })
            .then(function () { return reportSimple(test, Types.Leave) })
        } else {
            return report(test, r(Types.Pass, undefined, result.time))
        }
    })
    .finally(function () { resetTest(test) })
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
 * @param {Test} test The current test
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

exports.Data = function Data(name, index, parent, state) {
    this.name = name
    this.index = index
    this.parent = parent
    this.state = state
}

exports.Base = Base
function Base(methods, status, reporters, data) {
    // The methods in the public API.
    this.methods = methods

    // The status of this test, a mask detailed in the Flags enum.
    this.status = status

    // The active, not necessarily own, reporter list.
    this.reporters = reporters

    // The test-specific data, if any. It exists only for the base.
    this.data = data
    this.plugins = []
    this.tests = []

    // Placeholder for `only` tree
    this.only = undefined

    // 0 means inherit timeout
    this.timeout = 0

    // 0 means inherit slow timeout.
    this.slow = 0
}

exports.create = function (methods, mask, data) {
    var child = Object.create(methods)

    return child._ = new Base(
        child,
        data.parent.status & (Flags.Skipped | Flags.OnlyChild) | mask,
        data.parent.reporters,
        data)
}
