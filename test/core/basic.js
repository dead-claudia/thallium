"use strict"

/* eslint max-nested-callbacks: [2, 5] */

// Note: updates to this should also be reflected in
// fixtures/mid-coffee/spec/basic.coffee, as it's trying to represent more
// real-world usage.

describe("core (basic)", function () {
    describe("reflect", function () {
        describe("get parent", function () {
            function parent(reflect) { return reflect.parent }

            it("works on the root instance", function () {
                var tt = Util.create()

                assert.equal(tt.call(parent), undefined)
            })

            it("works on children", function () {
                var tt = Util.create()
                var methods

                tt.test("test", function () {
                    methods = tt.call(parent).methods
                })

                return tt.run().then(function () {
                    assert.equal(methods, tt)
                })
            })
        })

        describe("get count", function () {
            function count(reflect) { return reflect.count }

            it("works with 0 tests", function () {
                var tt = Util.create()

                assert.equal(tt.call(count), 0)
            })

            it("works with 1 test", function () {
                var tt = Util.create()

                tt.test("test", function () {})

                assert.equal(tt.call(count), 1)
            })

            it("works with 2 tests", function () {
                var tt = Util.create()

                tt.test("test", function () {})
                tt.test("test", function () {})

                assert.equal(tt.call(count), 2)
            })

            it("works with 3 tests", function () {
                var tt = Util.create()

                tt.test("test", function () {})
                tt.test("test", function () {})
                tt.test("test", function () {})

                assert.equal(tt.call(count), 3)
            })
        })

        describe("get name", function () {
            function name(reflect) { return reflect.name }

            it("works with the root test", function () {
                var tt = Util.create()

                assert.equal(tt.call(name), undefined)
            })

            it("works with child tests", function () {
                var tt = Util.create()
                var child

                tt.test("test", function () {
                    child = tt.call(name)
                })

                return tt.run().then(function () {
                    assert.equal(child, "test")
                })
            })
        })

        describe("get index", function () {
            function index(reflect) { return reflect.index }

            it("works with the root test", function () {
                var tt = Util.create()

                assert.equal(tt.call(index), -1)
            })

            it("works with the first child test", function () {
                var tt = Util.create()
                var first

                tt.test("test", function () {
                    first = tt.call(index)
                })

                return tt.run().then(function () {
                    assert.equal(first, 0)
                })
            })

            it("works with the second child test", function () {
                var tt = Util.create()
                var second

                tt.test("test", function () {})
                tt.test("test", function () {
                    second = tt.call(index)
                })

                return tt.run().then(function () {
                    assert.equal(second, 1)
                })
            })
        })

        describe("get children", function () {
            function children(reflect) { return reflect.children }
            function identity(reflect) { return reflect }

            it("works with 0 tests", function () {
                var tt = Util.create()

                assert.match(tt.call(children), [])
            })

            it("works with 1 test", function () {
                var tt = Util.create()
                var test

                tt.test("test", function () {
                    test = tt.call(identity)
                })

                return tt.run().then(function () {
                    assert.match(tt.call(children), [test])
                })
            })

            it("works with 2 tests", function () {
                var tt = Util.create()
                var first, second

                tt.test("first", function () {
                    first = tt.call(identity)
                })

                tt.test("second", function () {
                    second = tt.call(identity)
                })

                return tt.run().then(function () {
                    assert.match(tt.call(children), [first, second])
                })
            })

            it("returns a copy", function () {
                var tt = Util.create()
                var slice = tt.call(children)

                tt.test("test", function () {})
                assert.match(slice, [])
            })
        })
    })

    /**
     * TODO: This is deprecated
     */
    describe("test()", function () {
        it("returns a prototypal clone inside", function () {
            var tt = Util.create()
            var test

            tt.test("test", function (tt) { test = tt })

            return tt.run().then(function () {
                assert.notEqual(test, tt)
                assert.equal(Object.getPrototypeOf(test), tt)
            })
        })
    })

    describe("run()", function () {
        it("runs child tests", function () {
            var tt = Util.create()
            var called = 0
            var err

            tt.reporter(function (res) {
                if (res.fail) err = res.value
            })

            tt.test("test", function () {
                tt.test("foo", function () { called++ })
            })

            return tt.run().then(function () {
                assert.equal(called, 1)
                assert.notOk(err)
            })
        })

        function createSentinel(name) {
            var e = new Error(name)

            e.marker = function () {}
            return e
        }

        it("catches concurrent runs", function () {
            var tt = Util.create()
            var res = tt.run()

            assert.throws(function () { tt.run() }, Error)
            return res
        })

        it("allows non-concurrent runs with reporter error", function () {
            var tt = Util.create()
            var sentinel = createSentinel("fail")

            tt.reporter(function () { throw sentinel })

            return tt.run().then(
                function () { assert.fail("Expected a rejection") },
                function (err) { assert.equal(err, sentinel) })
            .then(function () {
                return tt.run().then(
                    function () { assert.fail("Expected a rejection") },
                    function (err) { assert.equal(err, sentinel) })
            })
        })
    })
})
