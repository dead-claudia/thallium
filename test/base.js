"use strict"

/* global setTimeout */

var t = require("../index.js")
var createBase = require("../lib/core.js")

suite("createBase()", function () {
    test("has `test()`", function () {
        var tt = createBase()
        t.hasKey(tt, "test")
        t.function(tt.test)
    })

    test("can accept a string + function", function () {
        var tt = createBase()
        tt.test("test", function () {})
    })

    test("can accept a string", function () {
        var tt = createBase()
        tt.test("test")
    })

    test("returns the current instance when given a callback", function () {
        var tt = createBase()
        var test = tt.test("test", function () {})
        t.equal(test, tt)
    })

    test("returns a prototypal clone when given a callback", function () {
        var tt = createBase()
        var test = tt.test("test")
        t.notEqual(test, tt)
        t.equal(Object.getPrototypeOf(test), tt)
    })

    function wrap(done, func) {
        return function (err) {
            if (err != null) return done(err)
            try {
                func()
            } catch (e) {
                return done(e)
            }
            return done()
        }
    }

    suite("asynchronous behavior", function () {
        test("with normal tests", function (done) {
            var tt = createBase()
            var called = false

            tt.test("test", function () { called = true })
            tt.run(wrap(done, function () { t.true(called) }))
            t.false(called)
        })

        test("with shorthand tests", function (done) {
            var tt = createBase()
            var called = false

            tt.define("assert", function () {
                called = true
                return {test: false, message: "should never happen"}
            })

            tt.test("test").assert()
            tt.run(wrap(done, function () { t.true(called) }))
            t.false(called)
        })

        test("with async tests + sync done call", function (done) {
            var tt = createBase()
            var called = false

            tt.async("test", function (_, done) {
                called = true
                done()
            })
            tt.run(wrap(done, function () { t.true(called) }))

            t.false(called)
        })

        test("with async tests + async done call", function (done) {
            var tt = createBase()
            var called = false

            tt.async("test", function (_, done) {
                called = true
                setTimeout(function () { return done() })
            })

            tt.run(wrap(done, function () { t.true(called) }))

            t.false(called)
        })
    })

    test("returns promise without callback", function () {
        var tt = createBase()
        var called = false

        tt.async("test", function (_, done) {
            called = true
            setTimeout(function () { return done() })
        })

        return tt.run().then(function () {
            t.true(called)
        })
    })

    suite("reporters", function () {
        function push(ret) {
            return function (arg, done) {
                ret.push(arg)
                return done()
            }
        }

        function n(type, name, index, parent, value) {
            return {
                type: type,
                name: name,
                index: index,
                parent: parent,
                value: value,
            }
        }

        function p(name, index, parent) {
            return {name: name, index: index, parent: parent}
        }

        test("added individually correctly", function () {
            var tt = createBase()
            function plugin() {}
            tt.reporter(plugin)
            t.deepEqual(tt.reporters(), [plugin])
        })

        test("added in batches correctly", function () {
            var tt = createBase()
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
            var tt = createBase()
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
            var tt = createBase()
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
            var tt = createBase()
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
            var tt = createBase()

            var ret = []

            tt.reporter(push(ret))

            tt.test("test", function () {})
            tt.test("test", function () {})

            tt.run(wrap(done, function () {
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
            var tt = createBase()

            var ret = []
            var sentinel = new Error("sentinel")
            // Something that can only be checked with identity.
            sentinel.marker = function () {}

            tt.reporter(push(ret))

            tt.test("one", function () { throw sentinel })
            tt.test("two", function () { throw sentinel })

            tt.run(wrap(done, function () {
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
            var tt = createBase()

            var ret = []
            var sentinel = new Error("sentinel")
            // Something that can only be checked with identity.
            sentinel.marker = function () {}

            tt.reporter(push(ret))

            tt.test("one", function () { throw sentinel })
            tt.test("two", function () {})

            tt.run(wrap(done, function () {
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

        test("called correctly with async passing", function (done) {
            var tt = createBase()

            var ret = []

            tt.reporter(push(ret))

            tt.async("test", function (t, done) { done() })
            tt.test("test", function () {})

            tt.run(wrap(done, function () {
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
            var tt = createBase()

            var ret = []
            var sentinel = new Error("sentinel")
            // Something that can only be checked with identity.
            sentinel.marker = function () {}

            tt.reporter(push(ret))

            tt.async("one", function (t, done) { done(sentinel) })
            tt.test("two", function () { throw sentinel })

            tt.run(wrap(done, function () {
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
            var tt = createBase()

            var ret = []
            var sentinel = new Error("sentinel")
            // Something that can only be checked with identity.
            sentinel.marker = function () {}

            tt.reporter(push(ret))

            tt.async("one", function (t, done) { done(sentinel) })
            tt.async("two", function (t, done) { done() })

            tt.run(wrap(done, function () {
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
            var tt = createBase()

            var ret = []

            tt.reporter(push(ret))

            tt.async("test", function () { return Promise.resolve() })
            tt.test("test", function () {})

            tt.run(wrap(done, function () {
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
            var tt = createBase()

            var ret = []
            var sentinel = new Error("sentinel")
            // Something that can only be checked with identity.
            sentinel.marker = function () {}

            tt.reporter(push(ret))

            tt.async("one", function () { return Promise.reject(sentinel) })
            tt.test("two", function () { throw sentinel })

            tt.run(wrap(done, function () {
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
            var tt = createBase()

            var ret = []
            var sentinel = new Error("sentinel")
            // Something that can only be checked with identity.
            sentinel.marker = function () {}

            tt.reporter(push(ret))

            tt.async("one", function () { return Promise.reject(sentinel) })
            tt.async("two", function () { return Promise.resolve() })

            tt.run(wrap(done, function () {
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
            var tt = createBase()

            var ret = []

            tt.reporter(push(ret))

            tt.test("test", function (tt) {
                tt.test("one", function () {})
                tt.test("two", function () {})
            })

            tt.run(wrap(done, function () {
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
            var tt = createBase()

            var ret = []
            var sentinel1 = new Error("sentinel one")
            // Something that can only be checked with identity.
            sentinel1.marker = function () {}

            var sentinel2 = new Error("sentinel two")
            // Something that can only be checked with identity.
            sentinel2.marker = function () {}

            tt.reporter(push(ret))

            tt.test("parent one", function (tt) {
                tt.test("child one", function () { throw sentinel1 })
                tt.test("child two", function () { throw sentinel1 })
            })

            tt.test("parent two", function (tt) {
                tt.test("child one", function () { throw sentinel2 })
                tt.test("child two", function () { throw sentinel2 })
            })

            tt.run(wrap(done, function () {
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
            var tt = createBase()

            var ret = []
            var sentinel1 = new Error("sentinel one")
            // Something that can only be checked with identity.
            sentinel1.marker = function () {}

            var sentinel2 = new Error("sentinel two")
            // Something that can only be checked with identity.
            sentinel2.marker = function () {}

            tt.reporter(push(ret))

            tt.test("parent one", function (tt) {
                tt.test("child one", function () { throw sentinel1 })
                tt.test("child two", function () {})
            })

            tt.test("parent two", function (tt) {
                tt.test("child one", function () { throw sentinel2 })
                tt.test("child two", function () {})
            })

            tt.run(wrap(done, function () {
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

        test("called correctly with unsafe test access", function () {
            var tt = createBase()

            var ret = []
            tt.reporter(push(ret))
        })

        test("called correctly with complex sequence", function () {
            var tt = createBase()

            var ret = []
            // Something that can only be checked with identity.
            var sentinel = new Error("sentinel")
            sentinel.marker = function () {}

            tt.reporter(push(ret))

            /* eslint-disable global-require */
            tt.use(require("../assertions.js"))
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
                    return new Promise(function (resolve) {
                        setTimeout(resolve, 0)
                    }).then(function () {
                        throw sentinel
                    })
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

            return tt.run().then(function () {
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
            })
        })

        test("catches unsafe access", function () {
            var tt = createBase()
            var ret = []

            tt.reporter(push(ret))

            var error = new ReferenceError(
                "It is only safe to call test methods during initialization")

            function plugin() {}

            tt.test("one", function () {
                tt.test("hi")
            })

            tt.test("two", function () {
                tt.define("hi", function () {})
            })

            tt.define("assert", function () { return {test: true} })

            tt.test("three", function () {
                tt.assert()
            })

            tt.test("four", function () {
                tt.use(plugin)
            })

            tt.test("five", function (tt) {
                tt.test("inner", function () {
                    tt.use(plugin)
                })
            })

            tt.test("six", function (tt) {
                tt.test("inner", function () {
                    tt.use(plugin)
                })
            })

            return tt.run().then(function () {
                t.deepEqual(ret, [
                    n("start", undefined, -1),

                    n("start", "one", 0),
                    n("end", "one", 0),
                    n("fail", "one", 0, undefined, error),

                    n("start", "two", 1),
                    n("end", "two", 1),
                    n("fail", "two", 1, undefined, error),

                    n("start", "three", 2),
                    n("end", "three", 2),
                    n("fail", "three", 2, undefined, error),

                    n("start", "four", 3),
                    n("end", "four", 3),
                    n("fail", "four", 3, undefined, error),

                    n("start", "five", 4),

                    n("start", "inner", 0, p("five", 4)),
                    n("end", "inner", 0, p("five", 4)),
                    n("fail", "inner", 0, p("five", 4), error),

                    n("end", "five", 4),
                    n("pass", "five", 4),

                    n("start", "six", 5),

                    n("start", "inner", 0, p("six", 5)),
                    n("end", "inner", 0, p("six", 5)),
                    n("fail", "inner", 0, p("six", 5), error),

                    n("end", "six", 5),
                    n("pass", "six", 5),

                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])
            })
        })

        test("reports extraneous async done", function () {
            var tt = createBase()
            var ret = []

            var sentinel = new Error("true")
            // Only unique property
            sentinel.marker = function () {}

            tt.reporter(push(ret))

            tt.test("test", function (tt) {
                tt.test("inner", function (tt) {
                    tt.async("fail", function (tt, done) {
                        done()
                        done()
                        done(sentinel)
                    })
                })
            })

            function r(name, index) {
                return {name: name, index: index}
            }

            return tt.run().then(function () {
                t.deepEqual(ret, [
                    n("start", undefined, -1),
                    n("start", "test", 0),
                    n("start", "inner", 0, p("test", 0)),
                    n("start", "fail", 0, p("inner", 0, p("test", 0))),
                    n("extra", "fail", 0, [r("test", 0), r("inner", 0)], {
                        count: 2,
                        value: undefined,
                    }),
                    n("extra", "fail", 0, [r("test", 0), r("inner", 0)], {
                        count: 3,
                        value: sentinel,
                    }),
                    n("end", "fail", 0, p("inner", 0, p("test", 0))),
                    n("pass", "fail", 0, p("inner", 0, p("test", 0))),
                    n("end", "inner", 0, p("test", 0)),
                    n("pass", "inner", 0, p("test", 0)),
                    n("end", "test", 0),
                    n("pass", "test", 0),
                    n("end", undefined, -1),
                    n("exit", undefined, 0),
                ])
            })
        })
    })

    test("catches concurrent runs", function () {
        var tt = createBase()
        tt.reporter(function (_, done) { done() })
        var p = tt.run()
        t.throws(function () { tt.run() }, Error)
        return p
    })
})
