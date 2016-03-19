/* eslint max-nested-callbacks: [2, 5] */
import t from "../src/index.js"
import {n, p, push} from "../test-util/base.js"

run("do")
run("block")

function run(name) {
    suite(`${name}()`, () => {
        test("exists", () => {
            const tt = t.base()

            t.hasKey(tt, name)
            t.function(tt[name])
        })

        test("runs blocks in sync tests", () => {
            const tt = t.base()
            let len, self // eslint-disable-line consistent-this
            const ret = []

            tt.reporter(push(ret))

            tt.test("test", tt => {
                tt[name](/** @this */ function () {
                    /* eslint-disable prefer-rest-params */

                    len = arguments.length
                    self = this

                    /* eslint-enable prefer-rest-params */
                })
            })

            return tt.run().then(() => {
                t.undefined(self)
                t.equal(len, 0)
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

        test("propagates errors from blocks in sync tests", () => {
            const tt = t.base()
            const ret = []
            const sentinel = new Error("sentinel")

            sentinel.marker = () => {}

            tt.reporter(push(ret))

            tt.test("test", tt => {
                tt[name](() => { throw sentinel })
            })

            return tt.run().then(() => {
                t.deepEqual(ret, [
                    n("start", []),
                    n("start", [p("test", 0)]),
                    n("end", [p("test", 0)]),
                    n("fail", [p("test", 0)], sentinel),
                    n("end", []),
                    n("exit", []),
                ])
            })
        })

        test("runs blocks in async tests", () => {
            const tt = t.base()
            let len, self // eslint-disable-line consistent-this
            const ret = []

            tt.reporter(push(ret))

            tt.async("test", (tt, done) => {
                tt[name](/** @this */ function () {
                    /* eslint-disable prefer-rest-params */

                    len = arguments.length
                    self = this

                    /* eslint-enable prefer-rest-params */
                })
                done()
            })

            return tt.run().then(() => {
                t.undefined(self)
                t.equal(len, 0)
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

        test("propagates errors from blocks in async tests", () => {
            const tt = t.base()
            const ret = []
            const sentinel = new Error("sentinel")

            sentinel.marker = () => {}

            tt.reporter(push(ret))

            tt.async("test", (tt, done) => {
                tt[name](() => { throw sentinel })
                done()
            })

            return tt.run().then(() => {
                t.deepEqual(ret, [
                    n("start", []),
                    n("start", [p("test", 0)]),
                    n("end", [p("test", 0)]),
                    n("fail", [p("test", 0)], sentinel),
                    n("end", []),
                    n("exit", []),
                ])
            })
        })

        test("runs blocks in inline sync tests", () => {
            const tt = t.base()
            let len, self // eslint-disable-line consistent-this
            const ret = []

            tt.reporter(push(ret))

            tt.test("test")[name](/** @this */ function () {
                /* eslint-disable prefer-rest-params */

                len = arguments.length
                self = this

                /* eslint-enable prefer-rest-params */
            })

            return tt.run().then(() => {
                t.undefined(self)
                t.equal(len, 0)
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

        test("propagates errors from blocks in inline sync tests", () => {
            const tt = t.base()
            const ret = []
            const sentinel = new Error("sentinel")

            sentinel.marker = () => {}

            tt.reporter(push(ret))

            tt.test("test")[name](() => { throw sentinel })

            return tt.run().then(() => {
                t.deepEqual(ret, [
                    n("start", []),
                    n("start", [p("test", 0)]),
                    n("end", [p("test", 0)]),
                    n("fail", [p("test", 0)], sentinel),
                    n("end", []),
                    n("exit", []),
                ])
            })
        })
    })
}
