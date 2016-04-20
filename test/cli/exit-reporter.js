"use strict"

const t = require("../../index.js")
const exitReporter = require("../../lib/cli/run.js").exitReporter
const resolveAny = require("../../lib/util.js").resolveAny

describe("cli exit reporter", () => {
    const map = {
        fail: new Error("fail"),
        extra: new Error("fail"),
    }

    function execute(reporter, type) {
        return resolveAny(reporter, undefined, {
            type,
            value: map[type],
            path: {name: "test", index: 0},
        })
    }

    for (const type of ["start", "end", "pass", "pending", "exit"]) {
        it(`doesn't trigger for "${type} events"`, () => {
            const state = {fail: false}
            const reporter = exitReporter(state)

            return execute(reporter, type).then(() => t.false(state.fail))
        })
    }

    for (const type of ["fail", "extra"]) {
        it(`doesn't trigger for "${type} events"`, () => {
            const state = {fail: false}
            const reporter = exitReporter(state)

            return execute(reporter, type).then(() => t.true(state.fail))
        })
    }

    it("doesn't trigger from numerous calls", () => {
        const state = {fail: false}
        const reporter = exitReporter(state)

        return execute(reporter, "start")
        .then(() => execute(reporter, "end"))
        .then(() => execute(reporter, "pass"))
        .then(() => execute(reporter, "start"))
        .then(() => execute(reporter, "end"))
        .then(() => execute(reporter, "pass"))
        .then(() => t.false(state.fail))
    })

    it("stays triggered", () => {
        const state = {fail: false}
        const reporter = exitReporter(state)

        return execute(reporter, "start")
        .then(() => execute(reporter, "end"))
        .then(() => execute(reporter, "fail"))
        .then(() => execute(reporter, "start"))
        .then(() => execute(reporter, "end"))
        .then(() => execute(reporter, "pass"))
        .then(() => t.true(state.fail))
    })

    it("is cleared on \"exit\" + \"start\"", () => {
        const state = {fail: false}
        const reporter = exitReporter(state)

        return execute(reporter, "start")
        .then(() => execute(reporter, "end"))
        .then(() => execute(reporter, "fail"))
        .then(() => execute(reporter, "start"))
        .then(() => execute(reporter, "end"))
        .then(() => execute(reporter, "pass"))
        .then(() => execute(reporter, "exit"))
        .then(() => execute(reporter, "start"))
        .then(() => t.false(state.fail))
    })
})
