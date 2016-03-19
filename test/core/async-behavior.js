/* global setTimeout */

import t from "../../src/index.js"
import {n, p, push} from "../../test-util/base.js"

suite("core (asynchronous behavior)", () => {
    test("with normal tests", () => {
        const tt = t.base()
        let called = false

        tt.test("test", () => { called = true })

        const ret = tt.run().then(() => t.true(called))

        t.false(called)
        return ret
    })

    test("with shorthand tests", () => {
        const tt = t.base()
        let called = false

        tt.define("assert", () => {
            called = true
            return {test: false, message: "should never happen"}
        })

        tt.test("test").assert()

        const ret = tt.run().then(() => t.true(called))

        t.false(called)
        return ret
    })

    test("with async tests + sync done call", () => {
        const tt = t.base()
        let called = false

        tt.async("test", (_, done) => {
            called = true
            done()
        })

        const ret = tt.run().then(() => t.true(called))

        t.false(called)
        return ret
    })

    test("with async tests + async done call", () => {
        const tt = t.base()
        let called = false

        tt.async("test", (_, done) => {
            called = true
            setTimeout(() => done())
        })

        const ret = tt.run().then(() => t.true(called))

        t.false(called)
        return ret
    })

    test("with async tests + duplicate thenable resolution", () => {
        const tt = t.base()
        let called = false

        tt.async("test", () => {
            called = true
            return {
                then(resolve) {
                    resolve()
                    resolve()
                    resolve()
                },
            }
        })

        const ret = tt.run().then(() => t.true(called))

        t.false(called)
        return ret
    })

    test("with async tests + duplicate thenable rejection", () => {
        const tt = t.base()
        let called = false
        const ret = []
        const sentinel = new Error("sentinel")

        sentinel.marker = () => {}

        tt.reporter(push(ret))

        tt.async("test", () => {
            called = true
            return {
                then(resolve, reject) {
                    reject(sentinel)
                    reject()
                    reject()
                },
            }
        })

        const result = tt.run().then(() => {
            t.deepEqual(ret, [
                n("start", []),
                n("start", [p("test", 0)]),
                n("end", [p("test", 0)]),
                n("fail", [p("test", 0)], sentinel),
                n("end", []),
                n("exit", []),
            ])
        })

        t.false(called)
        return result
    })

    test("with async tests + mixed thenable (resolve first)", () => {
        const tt = t.base()
        let called = false
        const ret = []
        const sentinel = new Error("sentinel")

        sentinel.marker = () => {}

        tt.reporter(push(ret))

        tt.async("test", () => {
            called = true
            return {
                then(resolve, reject) {
                    resolve()
                    reject(sentinel)
                    resolve()
                    reject()
                },
            }
        })

        const result = tt.run().then(() => {
            t.deepEqual(ret, [
                n("start", []),
                n("start", [p("test", 0)]),
                n("end", [p("test", 0)]),
                n("pass", [p("test", 0)]),
                n("end", []),
                n("exit", []),
            ])
        })

        t.false(called)
        return result
    })

    test("with async tests + mixed thenable (reject first)", () => {
        const tt = t.base()
        let called = false
        const ret = []
        const sentinel = new Error("sentinel")

        sentinel.marker = () => {}

        tt.reporter(push(ret))

        tt.async("test", () => {
            called = true
            return {
                then(resolve, reject) {
                    reject(sentinel)
                    resolve()
                    reject()
                    resolve()
                },
            }
        })

        const result = tt.run().then(() => {
            t.deepEqual(ret, [
                n("start", []),
                n("start", [p("test", 0)]),
                n("end", [p("test", 0)]),
                n("fail", [p("test", 0)], sentinel),
                n("end", []),
                n("exit", []),
            ])
        })

        t.false(called)
        return result
    })
})
