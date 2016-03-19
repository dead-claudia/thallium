/* global setTimeout */

import t from "../../src/index.js"
import {n, p, push} from "../../test-util/base.js"

suite("core (timeouts)", () => {
    test("succeeds with own", () => {
        const tt = t.base()
        const ret = []

        tt.reporter(push(ret))

        tt.async("test", (tt, done) => {
            tt.timeout(10)
            done()
        })

        return tt.run().then(() => {
            t.deepEqual(ret, [
                n("start", []),
                n("start", [p("test", 0)]),
                n("end", [p("test", 0)]),
                n("pass", [p("test", 0)]),
                n("end", []),
                n("exit", []),
            ])
        })
    })

    test("fails with own", () => {
        const tt = t.base()
        const ret = []

        tt.reporter(push(ret))

        tt.async("test", (tt, done) => {
            tt.timeout(50)
            // It's highly unlikely the engine will take this long to
            // finish.
            setTimeout(() => done(), 200)
        })

        return tt.run().then(() => {
            t.deepEqual(ret, [
                n("start", []),
                n("start", [p("test", 0)]),
                n("end", [p("test", 0)]),
                n("fail", [p("test", 0)], new Error("Timeout of 50 reached.")),
                n("end", []),
                n("exit", []),
            ])
        })
    })

    test("succeeds with inherited", () => {
        const tt = t.base()
        const ret = []

        tt.reporter(push(ret))

        tt.test("test")
        .timeout(50)
        .async("inner", (tt, done) => done())

        return tt.run().then(() => {
            t.deepEqual(ret, [
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

    test("fails with inherited", () => {
        const tt = t.base()
        const ret = []

        tt.reporter(push(ret))

        tt.test("test")
        .timeout(50)
        .async("inner", (tt, done) => {
            // It's highly unlikely the engine will take this long to
            // finish.
            setTimeout(() => done(), 200)
        })

        return tt.run().then(() => {
            t.deepEqual(ret, [
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

    test("gets own set timeout", () => {
        const tt = t.base()
        let timeout

        tt.test("test", tt => {
            tt.timeout(50)
            timeout = tt.timeout()
        })

        return tt.run().then(() => t.equal(timeout, 50))
    })

    test("gets own set timeout", () => {
        const tt = t.base()
        let timeout

        tt.test("test")
        .timeout(50)
        .test("inner", tt => { timeout = tt.timeout() })

        return tt.run().then(() => t.equal(timeout, 50))
    })

    test("gets own sync inner timeout", () => {
        const tt = t.base()

        const timeout = tt.test("test")
        .timeout(50)
        .test("inner").timeout()

        return tt.run().then(() => t.equal(timeout, 50))
    })

    test("gets default timeout", () => {
        const tt = t.base()
        let timeout

        tt.test("test", tt => { timeout = tt.timeout() })

        return tt.run().then(() => t.equal(timeout, 2000))
    })
})
