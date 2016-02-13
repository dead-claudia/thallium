"use strict"

/* global setTimeout */

var t = require("../../index.js")
var util = require("../../test-util/base.js")
var p = util.p
var n = util.n

suite("core (reporters)", function () {
    function resolve(value) {
        return {
            then: function (resolve) {
                resolve(value)
            },
        }
    }

    function reject(value) {
        return {
            then: function (resolve, reject) {
                reject(value)
            },
        }
    }

    test("added individually correctly", function () {
        var tt = t.base()
        function plugin() {}
        tt.reporter(plugin)
        t.deepEqual(tt.reporters(), [plugin])
    })

    test("added in batches correctly", function () {
        var tt = t.base()
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

    test("added on children correctly", function () {
        var tt = t.base()
        function plugin1() {}
        function plugin2() {}
        function plugin3() {}
        function plugin4() {}
        function plugin5() {}
        function plugin6() {}

        tt.reporter(plugin6)

        var ttt = tt.test("test")
        .reporter([plugin1, plugin2, [[plugin3], plugin4], [[[plugin5]]]])

        t.deepEqual(ttt.reporters(), [
            plugin1, plugin2, plugin3, plugin4, plugin5,
        ])

        t.deepEqual(tt.reporters(), [plugin6])
    })

    test("read on children correctly", function () {
        var tt = t.base()
        function plugin1() {}
        function plugin2() {}
        function plugin3() {}
        function plugin4() {}
        function plugin5() {}

        tt.reporter([plugin1, plugin2, [[plugin3], plugin4], [[[plugin5]]]])
        var ttt = tt.test("test")

        t.deepEqual(ttt.reporters(), [
            plugin1, plugin2, plugin3, plugin4, plugin5,
        ])
    })

    test("only added once", function () {
        var tt = t.base()
        function plugin1() {}
        function plugin2() {}
        function plugin3() {}

        tt.reporter([plugin1, plugin2, plugin3])
        tt.reporter([plugin3, plugin1])

        t.deepEqual(tt.reporters(), [
            plugin1, plugin2, plugin3,
        ])
    })

    test("called correctly with sync passing", function (done) {
        var tt = t.base()

        var ret = []

        tt.reporter(util.push(ret))

        tt.test("test", function () {})
        tt.test("test", function () {})

        tt.run(util.wrap(done, function () {
            t.deepEqual(ret, [
                n("start", undefined, -1),
                n("start", "test", 0),
                n("end", "test", 0),
                n("pass", "test", 0),
                n("start", "test", 1),
                n("end", "test", 1),
                n("pass", "test", 1),
                n("end", undefined, -1),
                n("exit", undefined, 0),
            ])
        }))
    })

    test("called correctly with sync failing", function (done) {
        var tt = t.base()

        var ret = []
        var sentinel = new Error("sentinel")
        // Something that can only be checked with identity.
        sentinel.marker = function () {}

        tt.reporter(util.push(ret))

        tt.test("one", function () { throw sentinel })
        tt.test("two", function () { throw sentinel })

        tt.run(util.wrap(done, function () {
            t.deepEqual(ret, [
                n("start", undefined, -1),

                n("start", "one", 0),
                n("end", "one", 0),
                n("fail", "one", 0, undefined, sentinel),

                n("start", "two", 1),
                n("end", "two", 1),
                n("fail", "two", 1, undefined, sentinel),

                n("end", undefined, -1),
                n("exit", undefined, 0),
            ])
        }))
    })

    test("called correctly with sync both", function (done) {
        var tt = t.base()

        var ret = []
        var sentinel = new Error("sentinel")
        // Something that can only be checked with identity.
        sentinel.marker = function () {}

        tt.reporter(util.push(ret))

        tt.test("one", function () { throw sentinel })
        tt.test("two", function () {})

        tt.run(util.wrap(done, function () {
            t.deepEqual(ret, [
                n("start", undefined, -1),

                n("start", "one", 0),
                n("end", "one", 0),
                n("fail", "one", 0, undefined, sentinel),

                n("start", "two", 1),
                n("end", "two", 1),
                n("pass", "two", 1),

                n("end", undefined, -1),
                n("exit", undefined, 0),
            ])
        }))
    })

    test("called correctly with inline passing", function (done) {
        var tt = t.base()

        var ret = []

        tt.reporter(util.push(ret))

        tt.test("test")
        tt.test("test")

        tt.run(util.wrap(done, function () {
            t.deepEqual(ret, [
                n("start", undefined, -1),
                n("start", "test", 0),
                n("end", "test", 0),
                n("pass", "test", 0),
                n("start", "test", 1),
                n("end", "test", 1),
                n("pass", "test", 1),
                n("end", undefined, -1),
                n("exit", undefined, 0),
            ])
        }))
    })

    test("called correctly with inline failing", function (done) {
        var tt = t.base()

        var ret = []

        tt.reporter(util.push(ret))

        tt.define("fail", function () { return {test: false, message: "fail"} })

        tt.test("one").fail()
        tt.test("two").fail()

        tt.run(util.wrap(done, function () {
            t.deepEqual(ret, [
                n("start", undefined, -1),

                n("start", "one", 0),
                n("end", "one", 0),
                n("fail", "one", 0, undefined, new t.AssertionError("fail")),

                n("start", "two", 1),
                n("end", "two", 1),
                n("fail", "two", 1, undefined, new t.AssertionError("fail")),

                n("end", undefined, -1),
                n("exit", undefined, 0),
            ])
        }))
    })

    test("called correctly with inline both", function (done) {
        var tt = t.base()

        var ret = []

        tt.reporter(util.push(ret))

        tt.define("fail", function () { return {test: false, message: "fail"} })

        tt.test("one").fail()
        tt.test("two", function () {})

        tt.run(util.wrap(done, function () {
            t.deepEqual(ret, [
                n("start", undefined, -1),

                n("start", "one", 0),
                n("end", "one", 0),
                n("fail", "one", 0, undefined, new t.AssertionError("fail")),

                n("start", "two", 1),
                n("end", "two", 1),
                n("pass", "two", 1),

                n("end", undefined, -1),
                n("exit", undefined, 0),
            ])
        }))
    })

    test("called correctly with async passing", function (done) {
        var tt = t.base()

        var ret = []

        tt.reporter(util.push(ret))

        tt.async("test", function (t, done) { done() })
        tt.test("test", function () {})

        tt.run(util.wrap(done, function () {
            t.deepEqual(ret, [
                n("start", undefined, -1),
                n("start", "test", 0),
                n("end", "test", 0),
                n("pass", "test", 0),
                n("start", "test", 1),
                n("end", "test", 1),
                n("pass", "test", 1),
                n("end", undefined, -1),
                n("exit", undefined, 0),
            ])
        }))
    })

    test("called correctly with async failing", function (done) {
        var tt = t.base()

        var ret = []
        var sentinel = new Error("sentinel")
        // Something that can only be checked with identity.
        sentinel.marker = function () {}

        tt.reporter(util.push(ret))

        tt.async("one", function (t, done) { done(sentinel) })
        tt.test("two", function () { throw sentinel })

        tt.run(util.wrap(done, function () {
            t.deepEqual(ret, [
                n("start", undefined, -1),

                n("start", "one", 0),
                n("end", "one", 0),
                n("fail", "one", 0, undefined, sentinel),

                n("start", "two", 1),
                n("end", "two", 1),
                n("fail", "two", 1, undefined, sentinel),

                n("end", undefined, -1),
                n("exit", undefined, 0),
            ])
        }))
    })

    test("called correctly with async both", function (done) {
        var tt = t.base()

        var ret = []
        var sentinel = new Error("sentinel")
        // Something that can only be checked with identity.
        sentinel.marker = function () {}

        tt.reporter(util.push(ret))

        tt.async("one", function (t, done) { done(sentinel) })
        tt.async("two", function (t, done) { done() })

        tt.run(util.wrap(done, function () {
            t.deepEqual(ret, [
                n("start", undefined, -1),

                n("start", "one", 0),
                n("end", "one", 0),
                n("fail", "one", 0, undefined, sentinel),

                n("start", "two", 1),
                n("end", "two", 1),
                n("pass", "two", 1),

                n("end", undefined, -1),
                n("exit", undefined, 0),
            ])
        }))
    })

    test("called correctly with async + promise passing", function (done) {
        var tt = t.base()

        var ret = []

        tt.reporter(util.push(ret))

        tt.async("test", function () { return resolve() })
        tt.test("test", function () {})

        tt.run(util.wrap(done, function () {
            t.deepEqual(ret, [
                n("start", undefined, -1),
                n("start", "test", 0),
                n("end", "test", 0),
                n("pass", "test", 0),
                n("start", "test", 1),
                n("end", "test", 1),
                n("pass", "test", 1),
                n("end", undefined, -1),
                n("exit", undefined, 0),
            ])
        }))
    })

    test("called correctly with async + promise failing", function (done) {
        var tt = t.base()

        var ret = []
        var sentinel = new Error("sentinel")
        // Something that can only be checked with identity.
        sentinel.marker = function () {}

        tt.reporter(util.push(ret))

        tt.async("one", function () { return reject(sentinel) })
        tt.test("two", function () { throw sentinel })

        tt.run(util.wrap(done, function () {
            t.deepEqual(ret, [
                n("start", undefined, -1),

                n("start", "one", 0),
                n("end", "one", 0),
                n("fail", "one", 0, undefined, sentinel),

                n("start", "two", 1),
                n("end", "two", 1),
                n("fail", "two", 1, undefined, sentinel),

                n("end", undefined, -1),
                n("exit", undefined, 0),
            ])
        }))
    })

    test("called correctly with async + promise both", function (done) {
        var tt = t.base()

        var ret = []
        var sentinel = new Error("sentinel")
        // Something that can only be checked with identity.
        sentinel.marker = function () {}

        tt.reporter(util.push(ret))

        tt.async("one", function () { return reject(sentinel) })
        tt.async("two", function () { return resolve() })

        tt.run(util.wrap(done, function () {
            t.deepEqual(ret, [
                n("start", undefined, -1),

                n("start", "one", 0),
                n("end", "one", 0),
                n("fail", "one", 0, undefined, sentinel),

                n("start", "two", 1),
                n("end", "two", 1),
                n("pass", "two", 1),

                n("end", undefined, -1),
                n("exit", undefined, 0),
            ])
        }))
    })

    test("called correctly with child passing tests", function (done) {
        var tt = t.base()

        var ret = []

        tt.reporter(util.push(ret))

        tt.test("test", function (tt) {
            tt.test("one", function () {})
            tt.test("two", function () {})
        })

        tt.run(util.wrap(done, function () {
            t.deepEqual(ret, [
                n("start", undefined, -1),
                n("start", "test", 0),

                n("start", "one", 0, p("test", 0)),
                n("end", "one", 0, p("test", 0)),
                n("pass", "one", 0, p("test", 0)),

                n("start", "two", 1, p("test", 0)),
                n("end", "two", 1, p("test", 0)),
                n("pass", "two", 1, p("test", 0)),

                n("end", "test", 0),
                n("pass", "test", 0),

                n("end", undefined, -1),
                n("exit", undefined, 0),
            ])
        }))
    })

    test("called correctly with child failing tests", function (done) {
        var tt = t.base()

        var ret = []
        var sentinel1 = new Error("sentinel one")
        // Something that can only be checked with identity.
        sentinel1.marker = function () {}

        var sentinel2 = new Error("sentinel two")
        // Something that can only be checked with identity.
        sentinel2.marker = function () {}

        tt.reporter(util.push(ret))

        tt.test("parent one", function (tt) {
            tt.test("child one", function () { throw sentinel1 })
            tt.test("child two", function () { throw sentinel1 })
        })

        tt.test("parent two", function (tt) {
            tt.test("child one", function () { throw sentinel2 })
            tt.test("child two", function () { throw sentinel2 })
        })

        tt.run(util.wrap(done, function () {
            t.deepEqual(ret, [
                n("start", undefined, -1),
                n("start", "parent one", 0),

                n("start", "child one", 0, p("parent one", 0)),
                n("end", "child one", 0, p("parent one", 0)),
                n("fail", "child one", 0, p("parent one", 0), sentinel1),

                n("start", "child two", 1, p("parent one", 0)),
                n("end", "child two", 1, p("parent one", 0)),
                n("fail", "child two", 1, p("parent one", 0), sentinel1),

                n("end", "parent one", 0),
                n("pass", "parent one", 0),

                n("start", "parent two", 1),

                n("start", "child one", 0, p("parent two", 1)),
                n("end", "child one", 0, p("parent two", 1)),
                n("fail", "child one", 0, p("parent two", 1), sentinel2),

                n("start", "child two", 1, p("parent two", 1)),
                n("end", "child two", 1, p("parent two", 1)),
                n("fail", "child two", 1, p("parent two", 1), sentinel2),

                n("end", "parent two", 1),
                n("pass", "parent two", 1),

                n("end", undefined, -1),
                n("exit", undefined, 0),
            ])
        }))
    })

    test("called correctly with child both", function (done) {
        var tt = t.base()

        var ret = []
        var sentinel1 = new Error("sentinel one")
        // Something that can only be checked with identity.
        sentinel1.marker = function () {}

        var sentinel2 = new Error("sentinel two")
        // Something that can only be checked with identity.
        sentinel2.marker = function () {}

        tt.reporter(util.push(ret))

        tt.test("parent one", function (tt) {
            tt.test("child one", function () { throw sentinel1 })
            tt.test("child two", function () {})
        })

        tt.test("parent two", function (tt) {
            tt.test("child one", function () { throw sentinel2 })
            tt.test("child two", function () {})
        })

        tt.run(util.wrap(done, function () {
            t.deepEqual(ret, [
                n("start", undefined, -1),
                n("start", "parent one", 0),

                n("start", "child one", 0, p("parent one", 0)),
                n("end", "child one", 0, p("parent one", 0)),
                n("fail", "child one", 0, p("parent one", 0), sentinel1),

                n("start", "child two", 1, p("parent one", 0)),
                n("end", "child two", 1, p("parent one", 0)),
                n("pass", "child two", 1, p("parent one", 0)),

                n("end", "parent one", 0),
                n("pass", "parent one", 0),

                n("start", "parent two", 1),

                n("start", "child one", 0, p("parent two", 1)),
                n("end", "child one", 0, p("parent two", 1)),
                n("fail", "child one", 0, p("parent two", 1), sentinel2),

                n("start", "child two", 1, p("parent two", 1)),
                n("end", "child two", 1, p("parent two", 1)),
                n("pass", "child two", 1, p("parent two", 1)),

                n("end", "parent two", 1),
                n("pass", "parent two", 1),

                n("end", undefined, -1),
                n("exit", undefined, 0),
            ])
        }))
    })

    test("called correctly with subtest run", function (done) {
        var tt = t.base()

        var ret = []
        tt.reporter(util.push(ret))

        var ttt = tt.test("test")

        ttt.test("foo", function () {})

        ttt.run(util.wrap(done, function () {
            t.deepEqual(ret, [
                n("start", "test", -1),
                n("start", "foo", 0, p("test", 0)),
                n("end", "foo", 0, p("test", 0)),
                n("pass", "foo", 0, p("test", 0)),
                n("end", "test", -1),
                n("pass", "test", -1),
                n("exit", "test", 0),
            ])
        }))
    })

    test("called correctly with complex sequence", function (done) {
        var tt = t.base()

        var ret = []
        // Something that can only be checked with identity.
        var sentinel = new Error("sentinel")
        sentinel.marker = function () {}

        tt.reporter(util.push(ret))

        /* eslint-disable global-require */
        tt.use(require("../../assertions.js"))
        /* eslint-enable global-require */

        tt.test("module-1", function (tt) {
            tt.test("1 === 1").equal(1, 1)

            tt.test("foo()", function (tt) {
                tt.foo = 1
                tt.notEqual(1, 1)
            })

            tt.async("bar()", function (t, done) {
                setTimeout(function () {
                    done(new Error("fail"))
                }, 0)
            })

            tt.async("baz()", function () {
                return {
                    then: function (resolve, reject) {
                        setTimeout(function () {
                            reject(sentinel)
                        }, 0)
                    },
                }
            })

            tt.test("nested", function (tt) {
                tt.test("nested 2", function (tt) {
                    tt.true(true)
                })
            })
        })

        tt.test("module-2", function (tt) {
            tt.test("1 === 2").equal(1, 2)
            tt.test("expandos don't transfer").notHaveKey(tt, "foo")
        })

        tt.run(util.wrap(done, function () {
            t.deepEqual(ret, [
                n("start", undefined, -1),

                n("start", "module-1", 0),

                n("start", "1 === 1", 0, p("module-1", 0)),
                n("end", "1 === 1", 0, p("module-1", 0)),
                n("pass", "1 === 1", 0, p("module-1", 0)),

                n("start", "foo()", 1, p("module-1", 0)),
                n("end", "foo()", 1, p("module-1", 0)),
                n("fail", "foo()", 1, p("module-1", 0),
                    new t.AssertionError("Expected 1 to not equal 1",
                        1, 1)),

                n("start", "bar()", 2, p("module-1", 0)),
                n("end", "bar()", 2, p("module-1", 0)),
                n("fail", "bar()", 2, p("module-1", 0), new Error("fail")),

                n("start", "baz()", 3, p("module-1", 0)),
                n("end", "baz()", 3, p("module-1", 0)),
                n("fail", "baz()", 3, p("module-1", 0), sentinel),

                n("start", "nested", 4, p("module-1", 0)),

                n("start", "nested 2", 0, p("nested", 4, p("module-1", 0))),
                n("end", "nested 2", 0, p("nested", 4, p("module-1", 0))),
                n("pass", "nested 2", 0, p("nested", 4, p("module-1", 0))),

                n("end", "nested", 4, p("module-1", 0)),
                n("pass", "nested", 4, p("module-1", 0)),

                n("end", "module-1", 0),
                n("pass", "module-1", 0),

                n("start", "module-2", 1),

                n("start", "1 === 2", 0, p("module-2", 1)),
                n("end", "1 === 2", 0, p("module-2", 1)),
                n("fail", "1 === 2", 0, p("module-2", 1),
                    new t.AssertionError("Expected 1 to equal 2", 2, 1)),

                n("start", "expandos don't transfer", 1, p("module-2", 1)),
                n("end", "expandos don't transfer", 1, p("module-2", 1)),
                n("pass", "expandos don't transfer", 1, p("module-2", 1)),

                n("end", "module-2", 1),
                n("pass", "module-2", 1),

                n("end", undefined, -1),
                n("exit", undefined, 0),
            ])
        }))
    })
})
