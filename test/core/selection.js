import t from "../../src/index.js"
import {p, n, push} from "../../test-util/base.js"

suite("core (selection)", () => {
    function fail(tt) {
        tt.define("fail", () => ({test: false, message: "fail"}))
    }

    test("skips tests with callbacks", () => {
        const tt = t.base().use(fail)
        const ret = []

        tt.reporter(push(ret))

        tt.test("one", tt => {
            tt.testSkip("inner", tt => tt.fail())
            tt.test("other")
        })

        tt.test("two", tt => {
            tt.test("inner")
            tt.test("other")
        })

        return tt.run().then(() => {
            t.deepEqual(ret, [
                n("start", []),
                n("start", [p("one", 0)]),
                n("pending", [p("one", 0), p("inner", 0)]),
                n("start", [p("one", 0), p("other", 1)]),
                n("end", [p("one", 0), p("other", 1)]),
                n("pass", [p("one", 0), p("other", 1)]),
                n("end", [p("one", 0)]),
                n("pass", [p("one", 0)]),
                n("start", [p("two", 1)]),
                n("start", [p("two", 1), p("inner", 0)]),
                n("end", [p("two", 1), p("inner", 0)]),
                n("pass", [p("two", 1), p("inner", 0)]),
                n("start", [p("two", 1), p("other", 1)]),
                n("end", [p("two", 1), p("other", 1)]),
                n("pass", [p("two", 1), p("other", 1)]),
                n("end", [p("two", 1)]),
                n("pass", [p("two", 1)]),
                n("end", []),
                n("exit", []),
            ])
        })
    })

    test("skips tests without callbacks", () => {
        const tt = t.base().use(fail)
        const ret = []

        tt.reporter(push(ret))

        tt.test("one", tt => {
            tt.testSkip("inner").fail()
            tt.test("other")
        })

        tt.test("two", tt => {
            tt.test("inner")
            tt.test("other")
        })

        return tt.run().then(() => {
            t.deepEqual(ret, [
                n("start", []),
                n("start", [p("one", 0)]),
                n("pending", [p("one", 0), p("inner", 0)]),
                n("start", [p("one", 0), p("other", 1)]),
                n("end", [p("one", 0), p("other", 1)]),
                n("pass", [p("one", 0), p("other", 1)]),
                n("end", [p("one", 0)]),
                n("pass", [p("one", 0)]),
                n("start", [p("two", 1)]),
                n("start", [p("two", 1), p("inner", 0)]),
                n("end", [p("two", 1), p("inner", 0)]),
                n("pass", [p("two", 1), p("inner", 0)]),
                n("start", [p("two", 1), p("other", 1)]),
                n("end", [p("two", 1), p("other", 1)]),
                n("pass", [p("two", 1), p("other", 1)]),
                n("end", [p("two", 1)]),
                n("pass", [p("two", 1)]),
                n("end", []),
                n("exit", []),
            ])
        })
    })

    test("skips async tests", () => {
        const tt = t.base().use(fail)
        const ret = []

        tt.reporter(push(ret))

        tt.test("one", tt => {
            tt.asyncSkip("inner", tt => tt.fail())
            tt.test("other")
        })

        tt.test("two", tt => {
            tt.test("inner")
            tt.test("other")
        })

        return tt.run().then(() => {
            t.deepEqual(ret, [
                n("start", []),
                n("start", [p("one", 0)]),
                n("pending", [p("one", 0), p("inner", 0)]),
                n("start", [p("one", 0), p("other", 1)]),
                n("end", [p("one", 0), p("other", 1)]),
                n("pass", [p("one", 0), p("other", 1)]),
                n("end", [p("one", 0)]),
                n("pass", [p("one", 0)]),
                n("start", [p("two", 1)]),
                n("start", [p("two", 1), p("inner", 0)]),
                n("end", [p("two", 1), p("inner", 0)]),
                n("pass", [p("two", 1), p("inner", 0)]),
                n("start", [p("two", 1), p("other", 1)]),
                n("end", [p("two", 1), p("other", 1)]),
                n("pass", [p("two", 1), p("other", 1)]),
                n("end", [p("two", 1)]),
                n("pass", [p("two", 1)]),
                n("end", []),
                n("exit", []),
            ])
        })
    })

    test("skips inline tests run directly", () => {
        const ret = []
        const tt = t.base().reporter(push(ret))
        const ttt = tt.testSkip("test")

        return ttt.run().then(() => {
            t.deepEqual(ret, [
                n("pending", [p("test", 0)]),
                n("exit", [p("test", 0)]),
            ])
        })
    })

    test("only tests with callbacks", () => {
        const tt = t.base().use(fail)
        const ret = []

        tt.reporter(push(ret))
        tt.only(["one", "inner"])

        tt.test("one", tt => {
            tt.test("inner", () => {})
            tt.test("other", tt => tt.fail())
        })

        tt.test("two", tt => {
            tt.test("inner", tt => tt.fail())
            tt.test("other", tt => tt.fail())
        })

        return tt.run().then(() => {
            t.deepEqual(ret, [
                n("start", []),
                n("start", [p("one", 0)]),
                n("start", [p("one", 0), p("inner", 0)]),
                n("end", [p("one", 0), p("inner", 0)]),
                n("pass", [p("one", 0), p("inner", 0)]),
                n("end", [p("one", 0)]),
                n("pass", [p("one", 0)]),
                n("end", []),
                n("exit", []),
            ])
        })
    })

    test("only tests without callbacks", () => {
        const tt = t.base().use(fail)
        const ret = []

        tt.reporter(push(ret))
        tt.only(["one", "inner"])

        tt.test("one", tt => {
            tt.test("inner")
            tt.test("other").fail()
        })

        tt.test("two", tt => {
            tt.test("inner").fail()
            tt.test("other").fail()
        })

        return tt.run().then(() => {
            t.deepEqual(ret, [
                n("start", []),
                n("start", [p("one", 0)]),
                n("start", [p("one", 0), p("inner", 0)]),
                n("end", [p("one", 0), p("inner", 0)]),
                n("pass", [p("one", 0), p("inner", 0)]),
                n("end", [p("one", 0)]),
                n("pass", [p("one", 0)]),
                n("end", []),
                n("exit", []),
            ])
        })
    })

    test("only async tests", () => {
        const tt = t.base().use(fail)
        const ret = []

        tt.reporter(push(ret))
        tt.only(["one", "inner"])

        tt.test("one", tt => {
            tt.async("inner", (_, done) => done())
            tt.async("other", tt => tt.fail())
        })

        tt.test("two", tt => {
            tt.async("inner", tt => tt.fail())
            tt.async("other", tt => tt.fail())
        })

        return tt.run().then(() => {
            t.deepEqual(ret, [
                n("start", []),
                n("start", [p("one", 0)]),
                n("start", [p("one", 0), p("inner", 0)]),
                n("end", [p("one", 0), p("inner", 0)]),
                n("pass", [p("one", 0), p("inner", 0)]),
                n("end", [p("one", 0)]),
                n("pass", [p("one", 0)]),
                n("end", []),
                n("exit", []),
            ])
        })
    })

    test("only tests as index with callbacks", () => {
        const tt = t.base().use(fail)
        const ret = []

        tt.reporter(push(ret))
        tt.only(["one", "inner"])

        tt.test("0", tt => {
            tt.test("inner", () => {})
            tt.test("other").fail()
        })

        tt.test("1", tt => {
            tt.test("inner").fail()
            tt.test("other").fail()
        })

        return tt.run().then(() => {
            t.deepEqual(ret, [
                n("start", []),
                n("end", []),
                n("exit", []),
            ])
        })
    })

    test("only tests as index index without callbacks", () => {
        const tt = t.base().use(fail)
        const ret = []

        tt.reporter(push(ret))
        tt.only(["one", "inner"])

        tt.test("0", tt => {
            tt.test("inner")
            tt.test("other").fail()
        })

        tt.test("1", tt => {
            tt.test("inner").fail()
            tt.test("other").fail()
        })

        return tt.run().then(() => {
            t.deepEqual(ret, [
                n("start", []),
                n("end", []),
                n("exit", []),
            ])
        })
    })

    test("only async tests as index", () => {
        const tt = t.base().use(fail)
        const ret = []

        tt.reporter(push(ret))
        tt.only(["one", "inner"])

        tt.test("0", tt => {
            tt.async("inner", (_, done) => done())
            tt.async("other", tt => tt.fail())
        })

        tt.test("1", tt => {
            tt.async("inner", tt => tt.fail())
            tt.async("other", tt => tt.fail())
        })

        return tt.run().then(() => {
            t.deepEqual(ret, [
                n("start", []),
                n("end", []),
                n("exit", []),
            ])
        })
    })

    test("only against regexp", () => {
        const tt = t.base().use(fail)
        const ret = []

        tt.reporter(push(ret))
        tt.only([/^one$/, "inner"])

        tt.test("one", tt => {
            tt.test("inner", () => {})
            tt.test("other", tt => tt.fail())
        })

        tt.test("two", tt => {
            tt.test("inner", tt => tt.fail())
            tt.test("other", tt => tt.fail())
        })

        return tt.run().then(() => {
            t.deepEqual(ret, [
                n("start", []),
                n("start", [p("one", 0)]),
                n("start", [p("one", 0), p("inner", 0)]),
                n("end", [p("one", 0), p("inner", 0)]),
                n("pass", [p("one", 0), p("inner", 0)]),
                n("end", [p("one", 0)]),
                n("pass", [p("one", 0)]),
                n("end", []),
                n("exit", []),
            ])
        })
    })
})
