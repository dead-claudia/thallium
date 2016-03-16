"use strict"

var t = require("../../index.js")
var util = require("../../test-util/base.js")
var assertions = require("../../assertions.js")
var p = util.p
var n = util.n

suite("core (reporters)", function () { // eslint-disable-line max-statements
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
        }))
    })

    test("called correctly with sync failing", function (done) {
        var tt = t.base()
        var ret = []
        var sentinel = new Error("sentinel")

        sentinel.marker = function () {}

        tt.reporter(util.push(ret))

        tt.test("one", function () { throw sentinel })
        tt.test("two", function () { throw sentinel })

        tt.run(util.wrap(done, function () {
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
        }))
    })

    test("called correctly with sync both", function (done) {
        var tt = t.base()
        var ret = []
        var sentinel = new Error("sentinel")

        sentinel.marker = function () {}

        tt.reporter(util.push(ret))

        tt.test("one", function () { throw sentinel })
        tt.test("two", function () {})

        tt.run(util.wrap(done, function () {
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
        }))
    })

    test("called correctly with async failing", function (done) {
        var tt = t.base()
        var ret = []
        var sentinel = new Error("sentinel")

        sentinel.marker = function () {}

        tt.reporter(util.push(ret))

        tt.async("one", function (t, done) { done(sentinel) })
        tt.test("two", function () { throw sentinel })

        tt.run(util.wrap(done, function () {
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
        }))
    })

    test("called correctly with async both", function (done) {
        var tt = t.base()
        var ret = []
        var sentinel = new Error("sentinel")

        sentinel.marker = function () {}

        tt.reporter(util.push(ret))

        tt.async("one", function (t, done) { done(sentinel) })
        tt.async("two", function (t, done) { done() })

        tt.run(util.wrap(done, function () {
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
        }))
    })

    test("called correctly with async + promise failing", function (done) {
        var tt = t.base()
        var ret = []
        var sentinel = new Error("sentinel")

        sentinel.marker = function () {}

        tt.reporter(util.push(ret))

        tt.async("one", function () { return reject(sentinel) })
        tt.test("two", function () { throw sentinel })

        tt.run(util.wrap(done, function () {
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
        }))
    })

    test("called correctly with async + promise both", function (done) {
        var tt = t.base()
        var ret = []
        var sentinel = new Error("sentinel")

        sentinel.marker = function () {}

        tt.reporter(util.push(ret))

        tt.async("one", function () { return reject(sentinel) })
        tt.async("two", function () { return resolve() })

        tt.run(util.wrap(done, function () {
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
        }))
    })

    test("called correctly with child failing tests", function (done) {
        var tt = t.base()
        var ret = []
        var sentinel1 = new Error("sentinel one")

        sentinel1.marker = function () {}

        var sentinel2 = new Error("sentinel two")

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
        }))
    })

    test("called correctly with child both", function (done) {
        var tt = t.base()
        var ret = []
        var sentinel1 = new Error("sentinel one")

        sentinel1.marker = function () {}

        var sentinel2 = new Error("sentinel two")

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
                n("start", [p("test", 0)]),
                n("start", [p("test", 0), p("foo", 0)]),
                n("end", [p("test", 0), p("foo", 0)]),
                n("pass", [p("test", 0), p("foo", 0)]),
                n("end", [p("test", 0)]),
                n("pass", [p("test", 0)]),
                n("exit", [p("test", 0)]),
            ])
        }))
    })

    test("called correctly with complex sequence", function (done) {
        var tt = t.base()
        var ret = []
        var sentinel = new Error("sentinel")

        sentinel.marker = function () {}

        tt.reporter(util.push(ret))

        tt.use(assertions)

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
            tt.test("expandos don't transfer").notHasKey(tt, "foo")
        })

        var fail1 = new t.AssertionError("Expected 1 to not equal 1", 1, 1)
        var fail2 = new t.AssertionError("Expected 1 to equal 2", 2, 1)

        tt.run(util.wrap(done, function () {
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
        }))
    })

    test("can return a resolving thenable", function (done) {
        var tt = t.base()
        var ret = []

        tt.reporter(function (entry) {
            return {
                then: function (resolve) {
                    ret.push(entry)
                    resolve()
                },
            }
        })

        tt.test("test", function () {})
        tt.test("test", function () {})

        tt.run(util.wrap(done, function () {
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
        }))
    })

    test("can return a rejecting thenable", function (done) {
        var tt = t.base()

        var sentinel = new Error("sentinel")

        tt.reporter(function () {
            return {
                then: function (resolve, reject) {
                    reject(sentinel)
                },
            }
        })

        tt.test("test", function () {})
        tt.test("test", function () {})

        tt.run(function (err) {
            util.wrap(done, function () {
                t.equal(err, sentinel)
            })()
        })
    })
})
