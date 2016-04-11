"use strict"

const Promise = require("bluebird")
const t = require("../../index.js")

describe("core (basic)", () => {
    it("has `base()`", () => {
        t.hasKey(t, "base")
        t.equal(t.base().base, t.base)
    })

    it("has `test()`", () => {
        const tt = t.base()

        t.hasKey(tt, "test")
        t.function(tt.test)
    })

    it("has `parent()`", () => {
        const tt = t.base()

        t.hasKey(tt, "parent")
        t.function(tt.parent)
        t.equal(tt.test("test").parent(), tt)
        t.undefined(tt.parent())
    })

    it("can accept a string + function", () => {
        const tt = t.base()

        tt.test("test", () => {})
    })

    it("can accept a string", () => {
        const tt = t.base()

        tt.test("test")
    })

    it("returns the current instance when given a callback", () => {
        const tt = t.base()
        const test = tt.test("test", () => {})

        t.equal(test, tt)
    })

    it("returns a prototypal clone when not given a callback", () => {
        const tt = t.base()
        const test = tt.test("test")

        t.notEqual(test, tt)
        t.equal(Object.getPrototypeOf(test), tt)
    })

    it("runs block tests within tests", () => {
        const tt = t.base()
        let called = 0

        tt.test("test", tt => {
            tt.test("foo", () => { called++ })
        })

        return tt.run().then(() => t.equal(called, 1))
    })

    it("runs successful inline tests within tests", () => {
        const tt = t.base()
        let err

        tt.reporter((res, done) => {
            if (res.type === "fail") {
                err = res.value
            }

            done()
        })

        tt.test("test", tt => {
            tt.test("foo").use(() => {})
        })

        return tt.run().then(() => t.notOk(err))
    })

    it("accepts a callback with `t.run()`", () => {
        const tt = t.base()
        let err

        tt.reporter((res, done) => {
            if (res.type === "fail") {
                err = res.value
            }

            done()
        })

        tt.test("test", tt => {
            tt.test("foo").use(() => {})
        })

        return Promise.fromCallback(cb => tt.run(cb))
        .then(() => t.notOk(err))
    })
})
