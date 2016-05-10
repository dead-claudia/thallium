"use strict"

const t = require("../index.js")
const Util = require("../test-util/base.js")
const n = Util.n
const p = Util.p

describe("do()", () => {
    it("exists", () => {
        const tt = t.base()

        t.hasKey(tt, "do")
        t.function(tt.do)
    })

    it("runs blocks in sync tests", () => {
        const tt = t.base()
        const ret = []
        let len, self // eslint-disable-line consistent-this

        tt.reporter(Util.push(ret))

        tt.test("test", tt => {
            tt.do(/** @this */ function () {
                len = arguments.length
                self = this
            })
        })

        return tt.run().then(() => {
            t.undefined(self)
            t.equal(len, 0)
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

    it("propagates errors from blocks in sync tests", () => {
        const tt = t.base()
        const ret = []
        const sentinel = new Error("sentinel")

        sentinel.marker = () => {}

        tt.reporter(Util.push(ret))

        tt.test("test", tt => {
            tt.do(() => { throw sentinel })
        })

        return tt.run().then(() => {
            t.match(ret, [
                n("start", []),
                n("start", [p("test", 0)]),
                n("end", [p("test", 0)]),
                n("fail", [p("test", 0)], sentinel),
                n("end", []),
                n("exit", []),
            ])
        })
    })

    it("runs blocks in async tests", () => {
        const tt = t.base()
        const ret = []
        let len, self // eslint-disable-line consistent-this

        tt.reporter(Util.push(ret))

        tt.async("test", (tt, done) => {
            tt.do(/** @this */ function () {
                len = arguments.length
                self = this
            })

            done()
        })

        return tt.run().then(() => {
            t.undefined(self)
            t.equal(len, 0)
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

    it("propagates errors from blocks in async tests", () => {
        const tt = t.base()
        const ret = []
        const sentinel = new Error("sentinel")

        sentinel.marker = () => {}

        tt.reporter(Util.push(ret))

        tt.async("test", (tt, done) => {
            tt.do(() => { throw sentinel })
            done()
        })

        return tt.run().then(() => {
            t.match(ret, [
                n("start", []),
                n("start", [p("test", 0)]),
                n("end", [p("test", 0)]),
                n("fail", [p("test", 0)], sentinel),
                n("end", []),
                n("exit", []),
            ])
        })
    })

    it("runs blocks in inline sync tests", () => {
        const tt = t.base()
        const ret = []
        let len, self // eslint-disable-line consistent-this

        tt.reporter(Util.push(ret))

        tt.test("test").do(/** @this */ function () {
            len = arguments.length
            self = this
        })

        return tt.run().then(() => {
            t.undefined(self)
            t.equal(len, 0)
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

    it("propagates errors from blocks in inline sync tests", () => {
        const tt = t.base()
        const ret = []
        const sentinel = new Error("sentinel")

        sentinel.marker = () => {}

        tt.reporter(Util.push(ret))

        tt.test("test").do(() => { throw sentinel })

        return tt.run().then(() => {
            t.match(ret, [
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
