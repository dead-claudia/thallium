"use strict"

// Note: updates to this should also be reflected in
// test-fixtures/acceptance/large-coffee/timeouts.coffee, as it's trying to
// represent more real-world usage.

const t = require("../../index.js")
const Util = require("../../test-util/base.js")
const n = Util.n
const p = Util.p

// Note that this entire section may be flaky on slower machines. Thankfully,
// these have been tested against a slower machine, so it should hopefully not
// be too bad.
describe("core (timeouts)", () => {
    it("succeeds with own", () => {
        const tt = t.base()
        const ret = []

        tt.reporter(Util.push(ret))

        tt.async("test", (tt, done) => {
            // It's highly unlikely the engine will take this long to finish.
            tt.timeout(10)
            done()
        })

        return tt.run().then(() => {
            t.match(ret, [
                n("start", []),
                n("start", [p("test", 0)]),
                n("end", [p("test", 0)]),
                n("pass", [p("test", 0)]),
                n("end", []),
                n("exit", []),
            ])
        })
    })

    it("fails with own", () => {
        const tt = t.base()
        const ret = []

        tt.reporter(Util.push(ret))

        tt.async("test", (tt, done) => {
            tt.timeout(50)
            // It's highly unlikely the engine will take this long to finish
            setTimeout(() => { done() }, 200)
        })

        return tt.run().then(() => {
            t.match(ret, [
                n("start", []),
                n("start", [p("test", 0)]),
                n("end", [p("test", 0)]),
                n("fail", [p("test", 0)], new Error("Timeout of 50 reached.")),
                n("end", []),
                n("exit", []),
            ])
        })
    })

    it("succeeds with inherited", () => {
        const tt = t.base()
        const ret = []

        tt.reporter(Util.push(ret))

        tt.test("test")
        .timeout(50)
        .async("inner", (tt, done) => { done() })

        return tt.run().then(() => {
            t.match(ret, [
                n("start", []),
                n("start", [p("test", 0)]),
                n("start", [p("test", 0), p("inner", 0)]),
                n("end", [p("test", 0), p("inner", 0)]),
                n("pass", [p("test", 0), p("inner", 0)]),
                n("end", [p("test", 0)]),
                n("pass", [p("test", 0)]),
                n("end", []),
                n("exit", []),
            ])
        })
    })

    it("fails with inherited", () => {
        const tt = t.base()
        const ret = []

        tt.reporter(Util.push(ret))

        tt.test("test")
        .timeout(50)
        .async("inner", (tt, done) => {
            // It's highly unlikely the engine will take this long to finish.
            setTimeout(() => { done() }, 200)
        })

        return tt.run().then(() => {
            t.match(ret, [
                n("start", []),
                n("start", [p("test", 0)]),
                n("start", [p("test", 0), p("inner", 0)]),
                n("end", [p("test", 0), p("inner", 0)]),
                n("fail", [p("test", 0), p("inner", 0)],
                    new Error("Timeout of 50 reached.")),
                n("end", [p("test", 0)]),
                n("pass", [p("test", 0)]),
                n("end", []),
                n("exit", []),
            ])
        })
    })

    it("gets own set timeout", () => {
        const tt = t.base()
        let timeout

        tt.test("test", tt => {
            tt.timeout(50)
            timeout = tt.timeout()
        })

        return tt.run().then(() => { t.equal(timeout, 50) })
    })

    it("gets own inline set timeout", () => {
        const tt = t.base()
        let timeout

        tt.test("test")
        .timeout(50)
        .test("inner", tt => { timeout = tt.timeout() })

        return tt.run().then(() => { t.equal(timeout, 50) })
    })

    it("gets own sync inner timeout", () => {
        const tt = t.base()

        const timeout = tt.test("test")
        .timeout(50)
        .test("inner").timeout()

        return tt.run().then(() => { t.equal(timeout, 50) })
    })

    it("gets default timeout", () => {
        const tt = t.base()
        let timeout

        tt.test("test", tt => { timeout = tt.timeout() })

        return tt.run().then(() => { t.equal(timeout, 2000) })
    })
})
