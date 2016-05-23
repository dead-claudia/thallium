"use strict"

var t = require("../../index.js")
var exitReporter = require("../../lib/cli/run.js").exitReporter
var resolveAny = require("../../lib/util.js").resolveAny

describe("cli exit reporter", function () {
    var map = {
        fail: new Error("fail"),
        extra: new Error("fail"),
    }

    function execute(reporter, type) {
        return function () {
            return resolveAny(reporter, undefined, {
                type: type,
                value: map[type],
                path: {name: "test", index: 0},
            })
        }
    }

    ["start", "pass", "skip", "end"]
    .forEach(function (type) {
        it("doesn't trigger for \"" + type + "\" events", function () {
            var state = {fail: false}
            var reporter = exitReporter(state)

            return execute(reporter, type)().then(function () {
                t.false(state.fail)
            })
        })
    })

    ;["fail", "extra"].forEach(function (type) {
        it("does trigger for \"" + type + "\" events", function () {
            var state = {fail: false}
            var reporter = exitReporter(state)

            return execute(reporter, type)().then(function () {
                t.true(state.fail)
            })
        })
    })

    it("doesn't trigger from numerous calls", function () {
        var state = {fail: false}
        var reporter = exitReporter(state)

        return execute(reporter, "start")()
        .then(execute(reporter, "pass"))
        .then(execute(reporter, "pass"))
        .then(function () { t.false(state.fail) })
    })

    it("stays triggered", function () {
        var state = {fail: false}
        var reporter = exitReporter(state)

        return execute(reporter, "start")()
        .then(execute(reporter, "fail"))
        .then(execute(reporter, "pass"))
        .then(function () { t.true(state.fail) })
    })

    it("is cleared on \"end\" + \"start\"", function () {
        var state = {fail: false}
        var reporter = exitReporter(state)

        return execute(reporter, "start")()
        .then(execute(reporter, "fail"))
        .then(execute(reporter, "pass"))
        .then(execute(reporter, "end"))
        .then(execute(reporter, "start"))
        .then(function () { t.false(state.fail) })
    })
})
