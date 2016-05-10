"use strict"

const m = require("../../lib/messages.js")
const t = require("../../index.js")
const Util = require("../../test-util/base.js")
const p = Util.p
const n = Util.n

describe("core (safety)", () => {
    const valueOf = value => ({valueOf: () => value})
    const noopReporter = (_, done) => done()
    const createSentinel = name => Object.assign(new Error(name), {marker() {}})

    it("disallows non-nullish non-functions as `test` impls", () => {
        const tt = t.base()

        t.throws(() => tt.test("test", 1), TypeError)
        t.throws(() => tt.test("test", 0), TypeError)
        t.throws(() => tt.test("test", true), TypeError)
        t.throws(() => tt.test("test", false), TypeError)
        t.throws(() => tt.test("test", "hi"), TypeError)
        t.throws(() => tt.test("test", ""), TypeError)
        t.throws(() => tt.test("test", []), TypeError)
        t.throws(() => tt.test("test", [1, 2, 3, 4, 5]), TypeError)
        t.throws(() => tt.test("test", {hello: "world"}), TypeError)
        t.throws(() => tt.test("test", {}), TypeError)
        t.throws(() => tt.test("test", valueOf(false)), TypeError)
        t.throws(() => tt.test("test", valueOf(undefined)), TypeError)

        /* eslint-disable no-unused-vars */

        tt.test("test")
        tt.test("test", undefined)
        tt.test("test", null)
        tt.test("test", () => {})
        tt.test("test", t => {})
        tt.test("test", (t, done) => {}) // too many arguments
        tt.test("test", () => ({next: () => ({done: true})}))

        /* eslint-enable no-unused-vars */
    })

    it("disallows non-functions as `async` impls", () => {
        const tt = t.base()

        t.throws(() => tt.async("test", 1), TypeError)
        t.throws(() => tt.async("test", 0), TypeError)
        t.throws(() => tt.async("test", true), TypeError)
        t.throws(() => tt.async("test", false), TypeError)
        t.throws(() => tt.async("test", "hi"), TypeError)
        t.throws(() => tt.async("test", ""), TypeError)
        t.throws(() => tt.async("test", []), TypeError)
        t.throws(() => tt.async("test", [1, 2, 3, 4, 5]), TypeError)
        t.throws(() => tt.async("test", {hello: "world"}), TypeError)
        t.throws(() => tt.async("test", {}), TypeError)
        t.throws(() => tt.async("test", valueOf(false)), TypeError)
        t.throws(() => tt.async("test", valueOf(undefined)), TypeError)
        t.throws(() => tt.async("test"), TypeError)
        t.throws(() => tt.async("test", undefined), TypeError)
        t.throws(() => tt.async("test", null), TypeError)

        /* eslint-disable no-unused-vars */

        tt.async("test", () => {})
        tt.async("test", t => {})
        tt.async("test", (t, done) => {})
        tt.async("test", (t, done, wtf) => {}) // too many arguments
        tt.async("test", () => ({next: () => ({done: true})}))

        /* eslint-enable no-unused-vars */
    })

    it("catches unsafe access", () => {
        const tt = t.base()
        const ret = []

        tt.reporter(Util.push(ret))

        const error = new ReferenceError(m("fail.checkInit"))

        function plugin() {}

        tt.test("one", () => tt.test("hi"))
        tt.test("two", () => tt.define("hi", () => {}))
        tt.define("assert", () => ({test: true}))
        tt.test("three", () => tt.assert())
        tt.test("four", () => tt.use(plugin))

        tt.test("five", tt => {
            tt.test("inner", () => tt.use(plugin))
        })

        tt.test("six", tt => {
            tt.test("inner", () => tt.reporter(noopReporter))
        })

        tt.test("seven", () => tt.add("inner", () => {}))

        tt.test("eight", () => {
            tt.wrap("test", func => func())
        })

        return tt.run().then(() => {
            t.match(ret, [
                n("start", []),
                n("start", [p("one", 0)]),
                n("end", [p("one", 0)]),
                n("fail", [p("one", 0)], error),
                n("start", [p("two", 1)]),
                n("end", [p("two", 1)]),
                n("fail", [p("two", 1)], error),
                n("start", [p("three", 2)]),
                n("end", [p("three", 2)]),
                n("fail", [p("three", 2)], error),
                n("start", [p("four", 3)]),
                n("end", [p("four", 3)]),
                n("fail", [p("four", 3)], error),
                n("start", [p("five", 4)]),
                n("start", [p("five", 4), p("inner", 0)]),
                n("end", [p("five", 4), p("inner", 0)]),
                n("fail", [p("five", 4), p("inner", 0)], error),
                n("end", [p("five", 4)]),
                n("pass", [p("five", 4)]),
                n("start", [p("six", 5)]),
                n("start", [p("six", 5), p("inner", 0)]),
                n("end", [p("six", 5), p("inner", 0)]),
                n("fail", [p("six", 5), p("inner", 0)], error),
                n("end", [p("six", 5)]),
                n("pass", [p("six", 5)]),
                n("start", [p("seven", 6)]),
                n("end", [p("seven", 6)]),
                n("fail", [p("seven", 6)], error),
                n("start", [p("eight", 7)]),
                n("end", [p("eight", 7)]),
                n("fail", [p("eight", 7)], error),
                n("end", []),
                n("exit", []),
            ])
        })
    })

    it("reports extraneous async done", () => {
        const tt = t.base()
        const ret = []
        const sentinel = createSentinel("sentinel")

        tt.reporter(Util.push(ret))

        tt.test("test", tt => {
            tt.test("inner", tt => {
                tt.async("fail", (tt, done) => {
                    done() // eslint-disable-line callback-return
                    done() // eslint-disable-line callback-return
                    done(sentinel) // eslint-disable-line callback-return
                })
            })
        })

        return tt.run().then(() => {
            t.includesDeepAny(
                [4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => {
                    const splice1 = n("extra",
                        [p("test", 0), p("inner", 0), p("fail", 0)],
                        {count: 2, value: undefined})

                    const splice2 = n("extra",
                        [p("test", 0), p("inner", 0), p("fail", 0)],
                        {count: 3, value: sentinel})

                    const node = [
                        n("start", []),
                        n("start", [p("test", 0)]),
                        n("start", [p("test", 0), p("inner", 0)]),
                        n("start", [p("test", 0), p("inner", 0), p("fail", 0)]),
                        // Extras should first appear here.
                        n("end", [p("test", 0), p("inner", 0), p("fail", 0)]),
                        n("pass", [p("test", 0), p("inner", 0), p("fail", 0)]),
                        n("end", [p("test", 0), p("inner", 0)]),
                        n("pass", [p("test", 0), p("inner", 0)]),
                        n("end", [p("test", 0)]),
                        n("pass", [p("test", 0)]),
                        n("end", []),
                        n("exit", []),
                    ]

                    node.splice(i, 0, splice1, splice2)
                    return node
                }),
                [ret])
        })
    })

    it("catches concurrent runs", () => {
        const tt = t.base()

        tt.reporter(noopReporter)

        const res = tt.run()

        t.throws(() => tt.run(), Error)
        return res
    })

    it("catches concurrent runs when given a callback", done => {
        const tt = t.base()

        tt.reporter(noopReporter)
        tt.run(done)
        t.throws(() => tt.run(done), Error)
    })

    it("allows non-concurrent runs with reporter error", () => {
        const tt = t.base()
        const sentinel = createSentinel("fail")

        tt.reporter((_, done) => done(sentinel))

        return tt.run().then(
            () => t.fail("Expected a rejection"),
            err => t.equal(err, sentinel))
        .then(() =>
            tt.run().then(
                () => t.fail("Expected a rejection"),
                err => t.equal(err, sentinel)))
    })
})
