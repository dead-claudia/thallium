import Promise from "bluebird"
import t from "../../src/index.js"

suite("core (basic)", () => {
    test("has `base()`", () => {
        t.hasKey(t, "base")
        t.equal(t.base().base, t.base)
    })

    test("has `test()`", () => {
        const tt = t.base()

        t.hasKey(tt, "test")
        t.function(tt.test)
    })

    test("has `parent()`", () => {
        const tt = t.base()

        t.hasKey(tt, "parent")
        t.function(tt.parent)
        t.equal(tt.test("test").parent(), tt)
        t.undefined(tt.parent())
    })

    test("can accept a string + function", () => {
        const tt = t.base()

        tt.test("test", () => {})
    })

    test("can accept a string", () => {
        const tt = t.base()

        tt.test("test")
    })

    test("returns the current instance when given a callback", () => {
        const tt = t.base()
        const test = tt.test("test", () => {})

        t.equal(test, tt)
    })

    test("returns a prototypal clone when given a callback", () => {
        const tt = t.base()
        const test = tt.test("test")

        t.notEqual(test, tt)
        t.equal(Object.getPrototypeOf(test), tt)
    })

    test("runs block tests within tests", () => {
        const tt = t.base()
        let called = false

        tt.test("test", tt => {
            tt.test("foo", () => { called = true })
        })

        return tt.run().then(() => t.true(called))
    })

    test("runs successful inline tests within tests", () => {
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

    test("accepts a callback with `t.run()`", () => {
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

        return Promise.fromNode(cb => tt.run(cb))
        .then(() => t.notOk(err))
    })
})
