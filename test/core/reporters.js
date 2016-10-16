"use strict"

describe("core (reporters)", function () { // eslint-disable-line max-statements
    var n = Util.n
    var p = Util.p

    // Use thenables, not actual Promises.
    function resolve(value) {
        return {then: function (resolve) { resolve(value) }}
    }

    function reject(value) {
        return {then: function (_, reject) { reject(value) }}
    }

    function createSentinel(name) {
        var e = new Error(name)

        e.marker = function () {}
        return e
    }

    function reporters(reflect) {
        return reflect.reporters
    }

    function activeReporters(reflect) {
        return reflect.activeReporters
    }

    it("added individually correctly", function () {
        var tt = Util.create()

        function plugin() {}

        tt.reporter(plugin)
        assert.match(tt.call(reporters), [plugin])
    })

    it("added in batches correctly", function () {
        var tt = Util.create()

        function plugin1() {}
        function plugin2() {}
        function plugin3() {}
        function plugin4() {}
        function plugin5() {}

        tt.reporter(plugin1, plugin2, plugin3, plugin4, plugin5)
        assert.match(
            tt.call(reporters),
            [plugin1, plugin2, plugin3, plugin4, plugin5])
    })

    it("added on children correctly", function () {
        var tt = Util.create()
        var child

        function plugin1() {}
        function plugin2() {}
        function plugin3() {}
        function plugin4() {}
        function plugin5() {}
        function plugin6() {}

        tt.reporter(plugin6)

        tt.test("test", function (tt) {
            tt.reporter(plugin1, plugin2, plugin3, plugin4, plugin5)
            child = tt.call(function (r) { return r })
        })

        return tt.run().then(function () {
            assert.match(
                child.reporters,
                [plugin1, plugin2, plugin3, plugin4, plugin5])

            assert.match(
                child.activeReporters,
                [plugin1, plugin2, plugin3, plugin4, plugin5])

            assert.match(tt.call(reporters), [plugin6])
        })
    })

    it("read on children correctly", function () {
        var tt = Util.create()
        var child

        function plugin1() {}
        function plugin2() {}
        function plugin3() {}
        function plugin4() {}
        function plugin5() {}

        tt.reporter(plugin1, plugin2, plugin3, plugin4, plugin5)

        tt.test("test", function (tt) {
            child = tt.call(function (r) { return r })
        })

        return tt.run().then(function () {
            assert.match(child.reporters, [])

            assert.match(
                child.activeReporters,
                [plugin1, plugin2, plugin3, plugin4, plugin5])
        })
    })

    it("removed individually correctly", function () {
        var tt = Util.create()

        function plugin() {}

        tt.reporter(plugin)
        tt.removeReporter(plugin)
        assert.match(tt.call(reporters), [])
    })

    it("removed in batches correctly", function () {
        var tt = Util.create()

        function plugin1() {}
        function plugin2() {}
        function plugin3() {}
        function plugin4() {}
        function plugin5() {}

        tt.reporter(plugin1, plugin2, plugin3, plugin4, plugin5)
        tt.removeReporter(plugin1, plugin2, plugin4)
        assert.match(tt.call(reporters), [plugin3, plugin5])
    })

    it("removed on children correctly", function () {
        var tt = Util.create()
        var child

        function plugin1() {}
        function plugin2() {}
        function plugin3() {}
        function plugin4() {}
        function plugin5() {}
        function plugin6() {}

        tt.reporter(plugin6)

        tt.test("test", function (tt) {
            tt.reporter(plugin1, plugin2, plugin3, plugin4, plugin5)
            tt.removeReporter(plugin1, plugin2, plugin4)
            child = tt.call(function (r) { return r })
        })

        return tt.run().then(function () {
            assert.match(child.reporters, [plugin3, plugin5])
            assert.match(child.activeReporters, [plugin3, plugin5])
            assert.match(tt.call(reporters), [plugin6])
        })
    })

    it("only added once", function () {
        var tt = Util.create()

        function plugin1() {}
        function plugin2() {}
        function plugin3() {}

        tt.reporter(plugin1, plugin2, plugin3)
        tt.reporter(plugin3, plugin1)

        assert.match(tt.call(reporters), [plugin1, plugin2, plugin3])

        assert.match(
            tt.call(activeReporters),
            [plugin1, plugin2, plugin3])
    })

    it("called correctly with sync passing", function () {
        var tt = Util.create()
        var ret = []

        tt.reporter(Util.push(ret))

        tt.test("test", function () {})
        tt.test("test", function () {})

        return tt.run().then(function () {
            assert.match(ret, [
                n("start", []),
                n("pass", [p("test", 0)]),
                n("pass", [p("test", 1)]),
                n("end", []),
            ])
        })
    })

    it("called correctly with sync failing", function () {
        var tt = Util.create()
        var ret = []
        var sentinel = createSentinel("sentinel")

        tt.reporter(Util.push(ret))

        tt.test("one", function () { throw sentinel })
        tt.test("two", function () { throw sentinel })

        return tt.run().then(function () {
            assert.match(ret, [
                n("start", []),
                n("fail", [p("one", 0)], sentinel),
                n("fail", [p("two", 1)], sentinel),
                n("end", []),
            ])
        })
    })

    it("called correctly with sync both", function () {
        var tt = Util.create()
        var ret = []
        var sentinel = createSentinel("sentinel")

        tt.reporter(Util.push(ret))

        tt.test("one", function () { throw sentinel })
        tt.test("two", function () {})

        return tt.run().then(function () {
            assert.match(ret, [
                n("start", []),
                n("fail", [p("one", 0)], sentinel),
                n("pass", [p("two", 1)]),
                n("end", []),
            ])
        })
    })

    it("called correctly with inline passing", function () {
        var tt = Util.create()
        var ret = []

        tt.reporter(Util.push(ret))

        tt.test("test", function () {})
        tt.test("test", function () {})

        return tt.run().then(function () {
            assert.match(ret, [
                n("start", []),
                n("pass", [p("test", 0)]),
                n("pass", [p("test", 1)]),
                n("end", []),
            ])
        })
    })

    it("called correctly with inline failing", function () {
        var AssertionError = assert.AssertionError
        var tt = Util.create()
        var ret = []

        tt.reporter(Util.push(ret))
        tt.test("one", function () { assert.fail("fail") })
        tt.test("two", function () { assert.fail("fail") })

        return tt.run().then(function () {
            assert.match(ret, [
                n("start", []),
                n("fail", [p("one", 0)], new AssertionError("fail")),
                n("fail", [p("two", 1)], new AssertionError("fail")),
                n("end", []),
            ])
        })
    })

    it("called correctly with inline both", function () {
        var AssertionError = assert.AssertionError
        var tt = Util.create()
        var ret = []

        tt.reporter(Util.push(ret))
        tt.test("one", function () { assert.fail("fail") })
        tt.test("two", function () {})

        return tt.run().then(function () {
            assert.match(ret, [
                n("start", []),
                n("fail", [p("one", 0)], new AssertionError("fail")),
                n("pass", [p("two", 1)]),
                n("end", []),
            ])
        })
    })

    it("called correctly with async passing", function () {
        var tt = Util.create()
        var ret = []

        tt.reporter(Util.push(ret))

        tt.test("test", function () { return resolve() })
        tt.test("test", function () {})

        return tt.run().then(function () {
            assert.match(ret, [
                n("start", []),
                n("pass", [p("test", 0)]),
                n("pass", [p("test", 1)]),
                n("end", []),
            ])
        })
    })

    it("called correctly with async failing", function () {
        var tt = Util.create()
        var ret = []
        var sentinel = createSentinel("sentinel")

        tt.reporter(Util.push(ret))

        tt.test("one", function () { return reject(sentinel) })
        tt.test("two", function () { throw sentinel })

        return tt.run().then(function () {
            assert.match(ret, [
                n("start", []),
                n("fail", [p("one", 0)], sentinel),
                n("fail", [p("two", 1)], sentinel),
                n("end", []),
            ])
        })
    })

    it("called correctly with async both", function () {
        var tt = Util.create()
        var ret = []
        var sentinel = createSentinel("sentinel")

        tt.reporter(Util.push(ret))

        tt.test("one", function () { return reject(sentinel) })
        tt.test("two", function () { return resolve() })

        return tt.run().then(function () {
            assert.match(ret, [
                n("start", []),
                n("fail", [p("one", 0)], sentinel),
                n("pass", [p("two", 1)]),
                n("end", []),
            ])
        })
    })

    it("called correctly with async + promise passing", function () {
        var tt = Util.create()
        var ret = []

        tt.reporter(Util.push(ret))

        tt.test("test", function () { return resolve() })
        tt.test("test", function () {})

        return tt.run().then(function () {
            assert.match(ret, [
                n("start", []),
                n("pass", [p("test", 0)]),
                n("pass", [p("test", 1)]),
                n("end", []),
            ])
        })
    })

    it("called correctly with async + promise failing", function () {
        var tt = Util.create()
        var ret = []
        var sentinel = createSentinel("sentinel")

        tt.reporter(Util.push(ret))

        tt.test("one", function () { return reject(sentinel) })
        tt.test("two", function () { throw sentinel })

        return tt.run().then(function () {
            assert.match(ret, [
                n("start", []),
                n("fail", [p("one", 0)], sentinel),
                n("fail", [p("two", 1)], sentinel),
                n("end", []),
            ])
        })
    })

    it("called correctly with async + promise both", function () {
        var tt = Util.create()
        var ret = []
        var sentinel = createSentinel("sentinel")

        tt.reporter(Util.push(ret))

        tt.test("one", function () { return reject(sentinel) })
        tt.test("two", function () { return resolve() })

        return tt.run().then(function () {
            assert.match(ret, [
                n("start", []),
                n("fail", [p("one", 0)], sentinel),
                n("pass", [p("two", 1)]),
                n("end", []),
            ])
        })
    })

    it("called correctly with child passing tests", function () {
        var tt = Util.create()
        var ret = []

        tt.reporter(Util.push(ret))

        tt.test("test", function (tt) {
            tt.test("one", function () {})
            tt.test("two", function () {})
        })

        return tt.run().then(function () {
            assert.match(ret, [
                n("start", []),
                n("enter", [p("test", 0)]),
                n("pass", [p("test", 0), p("one", 0)]),
                n("pass", [p("test", 0), p("two", 1)]),
                n("leave", [p("test", 0)]),
                n("end", []),
            ])
        })
    })

    it("called correctly with child failing tests", function () {
        var tt = Util.create()
        var ret = []
        var sentinel1 = createSentinel("sentinel one")
        var sentinel2 = createSentinel("sentinel two")

        tt.reporter(Util.push(ret))

        tt.test("parent one", function (tt) {
            tt.test("child one", function () { throw sentinel1 })
            tt.test("child two", function () { throw sentinel1 })
        })

        tt.test("parent two", function (tt) {
            tt.test("child one", function () { throw sentinel2 })
            tt.test("child two", function () { throw sentinel2 })
        })

        return tt.run().then(function () {
            assert.match(ret, [
                n("start", []),
                n("enter", [p("parent one", 0)]),
                n("fail", [p("parent one", 0), p("child one", 0)], sentinel1),
                n("fail", [p("parent one", 0), p("child two", 1)], sentinel1),
                n("leave", [p("parent one", 0)]),
                n("enter", [p("parent two", 1)]),
                n("fail", [p("parent two", 1), p("child one", 0)], sentinel2),
                n("fail", [p("parent two", 1), p("child two", 1)], sentinel2),
                n("leave", [p("parent two", 1)]),
                n("end", []),
            ])
        })
    })

    it("called correctly with child both", function () {
        var tt = Util.create()
        var ret = []
        var sentinel1 = createSentinel("sentinel one")
        var sentinel2 = createSentinel("sentinel two")

        tt.reporter(Util.push(ret))

        tt.test("parent one", function (tt) {
            tt.test("child one", function () { throw sentinel1 })
            tt.test("child two", function () {})
        })

        tt.test("parent two", function (tt) {
            tt.test("child one", function () { throw sentinel2 })
            tt.test("child two", function () {})
        })

        return tt.run().then(function () {
            assert.match(ret, [
                n("start", []),
                n("enter", [p("parent one", 0)]),
                n("fail", [p("parent one", 0), p("child one", 0)], sentinel1),
                n("pass", [p("parent one", 0), p("child two", 1)]),
                n("leave", [p("parent one", 0)]),
                n("enter", [p("parent two", 1)]),
                n("fail", [p("parent two", 1), p("child one", 0)], sentinel2),
                n("pass", [p("parent two", 1), p("child two", 1)]),
                n("leave", [p("parent two", 1)]),
                n("end", []),
            ])
        })
    })

    it("called correctly with subtest run", function () {
        var tt = Util.create()
        var child

        tt.test("test", function (tt) {
            child = tt
        })

        return tt.run().then(function () {
            assert.throws(function () { child.run() }, Error)
        })
    })

    it("called correctly with complex sequence", function () {
        var AssertionError = assert.AssertionError
        var tt = Util.create()
        var ret = []
        var sentinel = createSentinel("sentinel")

        tt.reporter(Util.push(ret))

        tt.test("mod-one", function (tt) {
            tt.test("1 === 1", function () { assert.equal(1, 1) })

            tt.test("foo()", function (tt) {
                tt.foo = 1
                assert.notEqual(1, 1)
            })

            tt.test("bar()", function () {
                return {
                    then: function (_, reject) {
                        Util.setTimeout(function () {
                            reject(new Error("fail"))
                        }, 0)
                    },
                }
            })

            tt.test("baz()", function () {
                return {
                    then: function (_, reject) {
                        Util.setTimeout(function () { reject(sentinel) }, 0)
                    },
                }
            })

            tt.test("nested", function (tt) {
                tt.test("nested 2", function () { assert.equal(true, true) })
            })
        })

        tt.test("mod-two", function (tt) {
            tt.test("1 === 2", function () { assert.equal(1, 2) })
            tt.test("expandos don't transfer", function () {
                assert.notHasKey(tt, "foo")
            })
        })

        var fail = new AssertionError("Expected 1 to not equal 1", 1, 1)
        var fail2 = new AssertionError("Expected 1 to equal 2", 2, 1)

        return tt.run().then(function () {
            assert.match(ret, [
                n("start", []),
                n("enter", [p("mod-one", 0)]),
                n("pass", [p("mod-one", 0), p("1 === 1", 0)]),
                n("fail", [p("mod-one", 0), p("foo()", 1)], fail),
                n("fail", [p("mod-one", 0), p("bar()", 2)], new Error("fail")),
                n("fail", [p("mod-one", 0), p("baz()", 3)], sentinel),
                n("enter", [p("mod-one", 0), p("nested", 4)]),
                n("pass", [p("mod-one", 0), p("nested", 4), p("nested 2", 0)]),
                n("leave", [p("mod-one", 0), p("nested", 4)]),
                n("leave", [p("mod-one", 0)]),
                n("enter", [p("mod-two", 1)]),
                n("fail", [p("mod-two", 1), p("1 === 2", 0)], fail2),
                n("pass", [p("mod-two", 1), p("expandos don't transfer", 1)]),
                n("leave", [p("mod-two", 1)]),
                n("end", []),
            ])
        })
    })

    it("can return a resolving thenable", function () {
        var tt = Util.create()
        var ret = []
        var push = Util.push(ret)

        tt.reporter(function (arg) {
            return {
                then: function (resolve) {
                    resolve(push(arg))
                },
            }
        })

        tt.test("test", function () {})
        tt.test("test", function () {})

        return tt.run().then(function () {
            assert.match(ret, [
                n("start", []),
                n("pass", [p("test", 0)]),
                n("pass", [p("test", 1)]),
                n("end", []),
            ])
        })
    })

    it("can return a rejecting thenable", function () {
        var tt = Util.create()
        var sentinel = createSentinel("sentinel")

        tt.reporter(function () {
            return {then: function (_, reject) { return reject(sentinel) }}
        })

        tt.test("test", function () {})
        tt.test("test", function () {})

        return tt.run().then(
            function () { assert.fail("Expected a rejection") },
            function (err) { assert.equal(err, sentinel) })
    })

    it("reports reporter errors", function () {
        var tt = Util.create()
        var sentinel = createSentinel("sentinel")
        var reported

        tt.reporter(function (ev) {
            if (ev.error) reported = ev.value
            if (ev.start) throw sentinel
        })

        return tt.run().then(
            function () { assert.fail("Expected a rejection") },
            function (rejected) {
                assert.equal(rejected, sentinel)
                assert.equal(reported, sentinel)
            })
    })

    // This is a bit too tightly coupled to the implementation than I'd normally
    // be comfortable with...
    it("reports internal errors", function () {
        var tt = Util.create()
        var sentinel = createSentinel("sentinel")
        var reported

        tt.reporter(function (ev) {
            if (ev.error) reported = ev.value
        })

        tt.test("test", function (tt) {
            Object.defineProperty(tt._, "status", {
                get: function () { throw sentinel },
                set: function () { throw sentinel },
            })
        })

        return tt.run().then(
            function () { assert.fail("Expected a rejection") },
            function (rejected) {
                assert.equal(rejected, sentinel)
                assert.equal(reported, sentinel)
            })
    })

    it("has repeatable output", function () {
        var AssertionError = assert.AssertionError
        var tt = Util.create()
        var ret = []
        var sentinel = createSentinel("sentinel")

        tt.reporter(Util.push(ret))

        tt.test("mod-one", function (tt) {
            tt.test("1 === 1", function () { assert.equal(1, 1) })

            tt.test("foo()", function (tt) {
                tt.foo = 1
                assert.notEqual(1, 1)
            })

            tt.test("bar()", function () {
                return {
                    then: function (_, reject) {
                        Util.setTimeout(function () {
                            reject(new Error("fail"))
                        }, 0)
                    },
                }
            })

            tt.test("baz()", function () {
                return {
                    then: function (_, reject) {
                        Util.setTimeout(function () { reject(sentinel) }, 0)
                    },
                }
            })

            tt.test("nested", function (tt) {
                tt.test("nested 2", function () { assert.equal(true, true) })
            })
        })

        tt.test("mod-two", function (tt) {
            tt.test("1 === 2", function () { assert.equal(1, 2) })
            tt.test("expandos don't transfer", function () {
                assert.notHasKey(tt, "foo")
            })
        })

        var fail = new AssertionError("Expected 1 to not equal 1", 1, 1)
        var fail2 = new AssertionError("Expected 1 to equal 2", 2, 1)

        return tt.run().then(function () {
            assert.match(ret, [
                n("start", []),
                n("enter", [p("mod-one", 0)]),
                n("pass", [p("mod-one", 0), p("1 === 1", 0)]),
                n("fail", [p("mod-one", 0), p("foo()", 1)], fail),
                n("fail", [p("mod-one", 0), p("bar()", 2)], new Error("fail")),
                n("fail", [p("mod-one", 0), p("baz()", 3)], sentinel),
                n("enter", [p("mod-one", 0), p("nested", 4)]),
                n("pass", [p("mod-one", 0), p("nested", 4), p("nested 2", 0)]),
                n("leave", [p("mod-one", 0), p("nested", 4)]),
                n("leave", [p("mod-one", 0)]),
                n("enter", [p("mod-two", 1)]),
                n("fail", [p("mod-two", 1), p("1 === 2", 0)], fail2),
                n("pass", [p("mod-two", 1), p("expandos don't transfer", 1)]),
                n("leave", [p("mod-two", 1)]),
                n("end", []),
            ])
        })
        .then(function () {
            while (ret.length) ret.pop()
            return tt.run()
        })
        .then(function () {
            assert.match(ret, [
                n("start", []),
                n("enter", [p("mod-one", 0)]),
                n("pass", [p("mod-one", 0), p("1 === 1", 0)]),
                n("fail", [p("mod-one", 0), p("foo()", 1)], fail),
                n("fail", [p("mod-one", 0), p("bar()", 2)], new Error("fail")),
                n("fail", [p("mod-one", 0), p("baz()", 3)], sentinel),
                n("enter", [p("mod-one", 0), p("nested", 4)]),
                n("pass", [p("mod-one", 0), p("nested", 4), p("nested 2", 0)]),
                n("leave", [p("mod-one", 0), p("nested", 4)]),
                n("leave", [p("mod-one", 0)]),
                n("enter", [p("mod-two", 1)]),
                n("fail", [p("mod-two", 1), p("1 === 2", 0)], fail2),
                n("pass", [p("mod-two", 1), p("expandos don't transfer", 1)]),
                n("leave", [p("mod-two", 1)]),
                n("end", []),
            ])
        })
    })
})
