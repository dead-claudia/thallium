import t from "../../src/index.js"
import {n, p, push} from "../../test-util/base.js"
import assertions from "../../src/assertions.js"
import global from "../../src/global.js"

suite("core (reporters)", () => { // eslint-disable-line max-statements
    // Use thenables, not actual Promises.
    function resolve(value) {
        return {then(resolve) { resolve(value) }}
    }

    function reject(value) {
        return {then(resolve, reject) { reject(value) }}
    }

    test("added individually correctly", () => {
        const tt = t.base()

        function plugin() {}
        tt.reporter(plugin)
        t.deepEqual(tt.reporters(), [plugin])
    })

    test("added in batches correctly", () => {
        const tt = t.base()

        function plugin1() {}
        function plugin2() {}
        function plugin3() {}
        function plugin4() {}
        function plugin5() {}
        tt.reporter([plugin1, plugin2, [[plugin3], plugin4], [[[plugin5]]]])
        t.deepEqual(tt.reporters(), [
            plugin1, plugin2, plugin3, plugin4, plugin5,
        ])
    })

    test("added on children correctly", () => {
        const tt = t.base()

        function plugin1() {}
        function plugin2() {}
        function plugin3() {}
        function plugin4() {}
        function plugin5() {}
        function plugin6() {}

        tt.reporter(plugin6)

        const ttt = tt.test("test")
        .reporter([plugin1, plugin2, [[plugin3], plugin4], [[[plugin5]]]])

        t.deepEqual(ttt.reporters(), [
            plugin1, plugin2, plugin3, plugin4, plugin5,
        ])

        t.deepEqual(tt.reporters(), [plugin6])
    })

    test("read on children correctly", () => {
        const tt = t.base()

        function plugin1() {}
        function plugin2() {}
        function plugin3() {}
        function plugin4() {}
        function plugin5() {}

        tt.reporter([plugin1, plugin2, [[plugin3], plugin4], [[[plugin5]]]])
        const ttt = tt.test("test")

        t.deepEqual(ttt.reporters(), [
            plugin1, plugin2, plugin3, plugin4, plugin5,
        ])
    })

    test("only added once", () => {
        const tt = t.base()

        function plugin1() {}
        function plugin2() {}
        function plugin3() {}

        tt.reporter([plugin1, plugin2, plugin3])
        tt.reporter([plugin3, plugin1])

        t.deepEqual(tt.reporters(), [
            plugin1, plugin2, plugin3,
        ])
    })

    test("called correctly with sync passing", () => {
        const tt = t.base()
        const ret = []

        tt.reporter(push(ret))

        tt.test("test", () => {})
        tt.test("test", () => {})

        return tt.run().then(() => {
            t.deepEqual(ret, [
                n("start", []),
                n("start", [p("test", 0)]),
                n("end", [p("test", 0)]),
                n("pass", [p("test", 0)]),
                n("start", [p("test", 1)]),
                n("end", [p("test", 1)]),
                n("pass", [p("test", 1)]),
                n("end", []),
                n("exit", []),
            ])
        })
    })

    test("called correctly with sync failing", () => {
        const tt = t.base()
        const ret = []
        const sentinel = new Error("sentinel")

        sentinel.marker = () => {}

        tt.reporter(push(ret))

        tt.test("one", () => { throw sentinel })
        tt.test("two", () => { throw sentinel })

        return tt.run().then(() => {
            t.deepEqual(ret, [
                n("start", []),
                n("start", [p("one", 0)]),
                n("end", [p("one", 0)]),
                n("fail", [p("one", 0)], sentinel),
                n("start", [p("two", 1)]),
                n("end", [p("two", 1)]),
                n("fail", [p("two", 1)], sentinel),
                n("end", []),
                n("exit", []),
            ])
        })
    })

    test("called correctly with sync both", () => {
        const tt = t.base()
        const ret = []
        const sentinel = new Error("sentinel")

        sentinel.marker = () => {}

        tt.reporter(push(ret))

        tt.test("one", () => { throw sentinel })
        tt.test("two", () => {})

        return tt.run().then(() => {
            t.deepEqual(ret, [
                n("start", []),
                n("start", [p("one", 0)]),
                n("end", [p("one", 0)]),
                n("fail", [p("one", 0)], sentinel),
                n("start", [p("two", 1)]),
                n("end", [p("two", 1)]),
                n("pass", [p("two", 1)]),
                n("end", []),
                n("exit", []),
            ])
        })
    })

    test("called correctly with inline passing", () => {
        const tt = t.base()
        const ret = []

        tt.reporter(push(ret))

        tt.test("test")
        tt.test("test")

        return tt.run().then(() => {
            t.deepEqual(ret, [
                n("start", []),
                n("start", [p("test", 0)]),
                n("end", [p("test", 0)]),
                n("pass", [p("test", 0)]),
                n("start", [p("test", 1)]),
                n("end", [p("test", 1)]),
                n("pass", [p("test", 1)]),
                n("end", []),
                n("exit", []),
            ])
        })
    })

    test("called correctly with inline failing", () => {
        const tt = t.base()
        const ret = []

        tt.reporter(push(ret))

        tt.define("fail", () => ({test: false, message: "fail"}))

        tt.test("one").fail()
        tt.test("two").fail()

        return tt.run().then(() => {
            t.deepEqual(ret, [
                n("start", []),
                n("start", [p("one", 0)]),
                n("end", [p("one", 0)]),
                n("fail", [p("one", 0)], new t.AssertionError("fail")),
                n("start", [p("two", 1)]),
                n("end", [p("two", 1)]),
                n("fail", [p("two", 1)], new t.AssertionError("fail")),
                n("end", []),
                n("exit", []),
            ])
        })
    })

    test("called correctly with inline both", () => {
        const tt = t.base()
        const ret = []

        tt.reporter(push(ret))

        tt.define("fail", () => ({test: false, message: "fail"}))

        tt.test("one").fail()
        tt.test("two", () => {})

        return tt.run().then(() => {
            t.deepEqual(ret, [
                n("start", []),
                n("start", [p("one", 0)]),
                n("end", [p("one", 0)]),
                n("fail", [p("one", 0)], new t.AssertionError("fail")),
                n("start", [p("two", 1)]),
                n("end", [p("two", 1)]),
                n("pass", [p("two", 1)]),
                n("end", []),
                n("exit", []),
            ])
        })
    })

    test("called correctly with async passing", () => {
        const tt = t.base()
        const ret = []

        tt.reporter(push(ret))

        tt.async("test", (t, done) => { done() })
        tt.test("test", () => {})

        return tt.run().then(() => {
            t.deepEqual(ret, [
                n("start", []),
                n("start", [p("test", 0)]),
                n("end", [p("test", 0)]),
                n("pass", [p("test", 0)]),
                n("start", [p("test", 1)]),
                n("end", [p("test", 1)]),
                n("pass", [p("test", 1)]),
                n("end", []),
                n("exit", []),
            ])
        })
    })

    test("called correctly with async failing", () => {
        const tt = t.base()
        const ret = []
        const sentinel = new Error("sentinel")

        sentinel.marker = () => {}

        tt.reporter(push(ret))

        tt.async("one", (t, done) => { done(sentinel) })
        tt.test("two", () => { throw sentinel })

        return tt.run().then(() => {
            t.deepEqual(ret, [
                n("start", []),
                n("start", [p("one", 0)]),
                n("end", [p("one", 0)]),
                n("fail", [p("one", 0)], sentinel),
                n("start", [p("two", 1)]),
                n("end", [p("two", 1)]),
                n("fail", [p("two", 1)], sentinel),
                n("end", []),
                n("exit", []),
            ])
        })
    })

    test("called correctly with async both", () => {
        const tt = t.base()
        const ret = []
        const sentinel = new Error("sentinel")

        sentinel.marker = () => {}

        tt.reporter(push(ret))

        tt.async("one", (t, done) => { done(sentinel) })
        tt.async("two", (t, done) => { done() })

        return tt.run().then(() => {
            t.deepEqual(ret, [
                n("start", []),
                n("start", [p("one", 0)]),
                n("end", [p("one", 0)]),
                n("fail", [p("one", 0)], sentinel),
                n("start", [p("two", 1)]),
                n("end", [p("two", 1)]),
                n("pass", [p("two", 1)]),
                n("end", []),
                n("exit", []),
            ])
        })
    })

    test("called correctly with async + promise passing", () => {
        const tt = t.base()
        const ret = []

        tt.reporter(push(ret))

        tt.async("test", () => resolve())
        tt.test("test", () => {})

        return tt.run().then(() => {
            t.deepEqual(ret, [
                n("start", []),
                n("start", [p("test", 0)]),
                n("end", [p("test", 0)]),
                n("pass", [p("test", 0)]),
                n("start", [p("test", 1)]),
                n("end", [p("test", 1)]),
                n("pass", [p("test", 1)]),
                n("end", []),
                n("exit", []),
            ])
        })
    })

    test("called correctly with async + promise failing", () => {
        const tt = t.base()
        const ret = []
        const sentinel = new Error("sentinel")

        sentinel.marker = () => {}

        tt.reporter(push(ret))

        tt.async("one", () => reject(sentinel))
        tt.test("two", () => { throw sentinel })

        return tt.run().then(() => {
            t.deepEqual(ret, [
                n("start", []),
                n("start", [p("one", 0)]),
                n("end", [p("one", 0)]),
                n("fail", [p("one", 0)], sentinel),
                n("start", [p("two", 1)]),
                n("end", [p("two", 1)]),
                n("fail", [p("two", 1)], sentinel),
                n("end", []),
                n("exit", []),
            ])
        })
    })

    test("called correctly with async + promise both", () => {
        const tt = t.base()
        const ret = []
        const sentinel = new Error("sentinel")

        sentinel.marker = () => {}

        tt.reporter(push(ret))

        tt.async("one", () => reject(sentinel))
        tt.async("two", () => resolve())

        return tt.run().then(() => {
            t.deepEqual(ret, [
                n("start", []),
                n("start", [p("one", 0)]),
                n("end", [p("one", 0)]),
                n("fail", [p("one", 0)], sentinel),
                n("start", [p("two", 1)]),
                n("end", [p("two", 1)]),
                n("pass", [p("two", 1)]),
                n("end", []),
                n("exit", []),
            ])
        })
    })

    test("called correctly with child passing tests", () => {
        const tt = t.base()
        const ret = []

        tt.reporter(push(ret))

        tt.test("test", tt => {
            tt.test("one", () => {})
            tt.test("two", () => {})
        })

        return tt.run().then(() => {
            t.deepEqual(ret, [
                n("start", []),
                n("start", [p("test", 0)]),
                n("start", [p("test", 0), p("one", 0)]),
                n("end", [p("test", 0), p("one", 0)]),
                n("pass", [p("test", 0), p("one", 0)]),
                n("start", [p("test", 0), p("two", 1)]),
                n("end", [p("test", 0), p("two", 1)]),
                n("pass", [p("test", 0), p("two", 1)]),
                n("end", [p("test", 0)]),
                n("pass", [p("test", 0)]),
                n("end", []),
                n("exit", []),
            ])
        })
    })

    test("called correctly with child failing tests", () => {
        const tt = t.base()
        const ret = []
        const sentinel1 = new Error("sentinel one")

        sentinel1.marker = () => {}

        const sentinel2 = new Error("sentinel two")

        sentinel2.marker = () => {}

        tt.reporter(push(ret))

        tt.test("parent one", tt => {
            tt.test("child one", () => { throw sentinel1 })
            tt.test("child two", () => { throw sentinel1 })
        })

        tt.test("parent two", tt => {
            tt.test("child one", () => { throw sentinel2 })
            tt.test("child two", () => { throw sentinel2 })
        })

        return tt.run().then(() => {
            t.deepEqual(ret, [
                n("start", []),
                n("start", [p("parent one", 0)]),
                n("start", [p("parent one", 0), p("child one", 0)]),
                n("end", [p("parent one", 0), p("child one", 0)]),
                n("fail", [p("parent one", 0), p("child one", 0)], sentinel1),
                n("start", [p("parent one", 0), p("child two", 1)]),
                n("end", [p("parent one", 0), p("child two", 1)]),
                n("fail", [p("parent one", 0), p("child two", 1)], sentinel1),
                n("end", [p("parent one", 0)]),
                n("pass", [p("parent one", 0)]),
                n("start", [p("parent two", 1)]),
                n("start", [p("parent two", 1), p("child one", 0)]),
                n("end", [p("parent two", 1), p("child one", 0)]),
                n("fail", [p("parent two", 1), p("child one", 0)], sentinel2),
                n("start", [p("parent two", 1), p("child two", 1)]),
                n("end", [p("parent two", 1), p("child two", 1)]),
                n("fail", [p("parent two", 1), p("child two", 1)], sentinel2),
                n("end", [p("parent two", 1)]),
                n("pass", [p("parent two", 1)]),
                n("end", []),
                n("exit", []),
            ])
        })
    })

    test("called correctly with child both", () => {
        const tt = t.base()
        const ret = []
        const sentinel1 = new Error("sentinel one")

        sentinel1.marker = () => {}

        const sentinel2 = new Error("sentinel two")

        sentinel2.marker = () => {}

        tt.reporter(push(ret))

        tt.test("parent one", tt => {
            tt.test("child one", () => { throw sentinel1 })
            tt.test("child two", () => {})
        })

        tt.test("parent two", tt => {
            tt.test("child one", () => { throw sentinel2 })
            tt.test("child two", () => {})
        })

        return tt.run().then(() => {
            t.deepEqual(ret, [
                n("start", []),
                n("start", [p("parent one", 0)]),
                n("start", [p("parent one", 0), p("child one", 0)]),
                n("end", [p("parent one", 0), p("child one", 0)]),
                n("fail", [p("parent one", 0), p("child one", 0)], sentinel1),
                n("start", [p("parent one", 0), p("child two", 1)]),
                n("end", [p("parent one", 0), p("child two", 1)]),
                n("pass", [p("parent one", 0), p("child two", 1)]),
                n("end", [p("parent one", 0)]),
                n("pass", [p("parent one", 0)]),
                n("start", [p("parent two", 1)]),
                n("start", [p("parent two", 1), p("child one", 0)]),
                n("end", [p("parent two", 1), p("child one", 0)]),
                n("fail", [p("parent two", 1), p("child one", 0)], sentinel2),
                n("start", [p("parent two", 1), p("child two", 1)]),
                n("end", [p("parent two", 1), p("child two", 1)]),
                n("pass", [p("parent two", 1), p("child two", 1)]),
                n("end", [p("parent two", 1)]),
                n("pass", [p("parent two", 1)]),
                n("end", []),
                n("exit", []),
            ])
        })
    })

    test("called correctly with subtest run", () => {
        const tt = t.base()
        const ret = []

        tt.reporter(push(ret))

        const ttt = tt.test("test")

        ttt.test("foo", () => {})

        return ttt.run().then(() => {
            t.deepEqual(ret, [
                n("start", [p("test", 0)]),
                n("start", [p("test", 0), p("foo", 0)]),
                n("end", [p("test", 0), p("foo", 0)]),
                n("pass", [p("test", 0), p("foo", 0)]),
                n("end", [p("test", 0)]),
                n("pass", [p("test", 0)]),
                n("exit", [p("test", 0)]),
            ])
        })
    })

    test("called correctly with complex sequence", () => {
        const tt = t.base()
        const ret = []
        const sentinel = new Error("sentinel")

        sentinel.marker = () => {}

        tt.reporter(push(ret))

        tt.use(assertions)

        tt.test("module-1", tt => {
            tt.test("1 === 1").equal(1, 1)

            tt.test("foo()", tt => {
                tt.foo = 1
                tt.notEqual(1, 1)
            })

            tt.async("bar()", (t, done) => {
                global.setTimeout(() => done(new Error("fail")), 0)
            })

            tt.async("baz()", () => {
                return {
                    then(resolve, reject) {
                        global.setTimeout(() => reject(sentinel), 0)
                    },
                }
            })

            tt.test("nested", tt => {
                tt.test("nested 2", tt => tt.true(true))
            })
        })

        tt.test("module-2", tt => {
            tt.test("1 === 2").equal(1, 2)
            tt.test("expandos don't transfer").notHasKey(tt, "foo")
        })

        const fail1 = new t.AssertionError("Expected 1 to not equal 1", 1, 1)
        const fail2 = new t.AssertionError("Expected 1 to equal 2", 2, 1)

        return tt.run().then(() => {
            t.deepEqual(ret, [
                n("start", []),
                n("start", [p("module-1", 0)]),
                n("start", [p("module-1", 0), p("1 === 1", 0)]),
                n("end", [p("module-1", 0), p("1 === 1", 0)]),
                n("pass", [p("module-1", 0), p("1 === 1", 0)]),
                n("start", [p("module-1", 0), p("foo()", 1)]),
                n("end", [p("module-1", 0), p("foo()", 1)]),
                n("fail", [p("module-1", 0), p("foo()", 1)], fail1),
                n("start", [p("module-1", 0), p("bar()", 2)]),
                n("end", [p("module-1", 0), p("bar()", 2)]),
                n("fail", [p("module-1", 0), p("bar()", 2)], new Error("fail")),
                n("start", [p("module-1", 0), p("baz()", 3)]),
                n("end", [p("module-1", 0), p("baz()", 3)]),
                n("fail", [p("module-1", 0), p("baz()", 3)], sentinel),
                n("start", [p("module-1", 0), p("nested", 4)]),
                n("start", [p("module-1", 0), p("nested", 4), p("nested 2", 0)]), // eslint-disable-line max-len
                n("end", [p("module-1", 0), p("nested", 4), p("nested 2", 0)]),
                n("pass", [p("module-1", 0), p("nested", 4), p("nested 2", 0)]),
                n("end", [p("module-1", 0), p("nested", 4)]),
                n("pass", [p("module-1", 0), p("nested", 4)]),
                n("end", [p("module-1", 0)]),
                n("pass", [p("module-1", 0)]),
                n("start", [p("module-2", 1)]),
                n("start", [p("module-2", 1), p("1 === 2", 0)]),
                n("end", [p("module-2", 1), p("1 === 2", 0)]),
                n("fail", [p("module-2", 1), p("1 === 2", 0)], fail2),
                n("start", [p("module-2", 1), p("expandos don't transfer", 1)]),
                n("end", [p("module-2", 1), p("expandos don't transfer", 1)]),
                n("pass", [p("module-2", 1), p("expandos don't transfer", 1)]),
                n("end", [p("module-2", 1)]),
                n("pass", [p("module-2", 1)]),
                n("end", []),
                n("exit", []),
            ])
        })
    })

    test("can return a resolving thenable", () => {
        const tt = t.base()
        const ret = []

        tt.reporter(entry => ({
            then(resolve) {
                ret.push(entry)
                resolve()
            },
        }))

        tt.test("test", () => {})
        tt.test("test", () => {})

        return tt.run().then(() => {
            t.deepEqual(ret, [
                n("start", []),
                n("start", [p("test", 0)]),
                n("end", [p("test", 0)]),
                n("pass", [p("test", 0)]),
                n("start", [p("test", 1)]),
                n("end", [p("test", 1)]),
                n("pass", [p("test", 1)]),
                n("end", []),
                n("exit", []),
            ])
        })
    })

    test("can return a rejecting thenable", () => {
        const tt = t.base()

        const sentinel = new Error("sentinel")

        tt.reporter(() => ({
            then(resolve, reject) {
                reject(sentinel)
            },
        }))

        tt.test("test", () => {})
        tt.test("test", () => {})

        return tt.run().then(
            () => t.fail("Expected a rejection"),
            err => t.equal(err, sentinel))
    })
})
