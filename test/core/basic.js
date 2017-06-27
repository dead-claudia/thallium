/* eslint max-nested-callbacks: [2, 5] */

// Note: updates to this should also be reflected in
// fixtures/mid-coffee/spec/basic.coffee, as it's trying to represent more
// real-world usage.

describe("core/basic", function () {
    "use strict"

    var r = Util.report

    describe("reflect", function () {
        describe("get reflect", function () {
            it("is equivalent to this/arg in tt.call()", function () {
                var tt = r.silent()

                assert.equal(tt.reflect, tt.call(
                    /** @this */ function () { return this }
                ))
                assert.equal(tt.reflect, tt.call(function (x) { return x }))
            })
        })

        describe("get parent", function () {
            it("works on the root instance", function () {
                var tt = r.silent()

                assert.equal(tt.reflect.parent, undefined)
            })

            it("works on children", function () {
                var tt = r.silent()
                var inner

                tt.test("test", function () {
                    inner = tt.reflect.parent
                })

                return tt.runTree().then(function () {
                    assert.equal(inner, tt.reflect)
                })
            })
        })

        describe("get count", function () {
            it("works with 0 tests", function () {
                var tt = r.silent()

                assert.equal(tt.reflect.count, 0)
            })

            it("works with 1 test", function () {
                var tt = r.silent()

                tt.test("test", r.noop)

                assert.equal(tt.reflect.count, 1)
            })

            it("works with 2 tests", function () {
                var tt = r.silent()

                tt.test("test", r.noop)
                tt.test("test", r.noop)

                assert.equal(tt.reflect.count, 2)
            })

            it("works with 3 tests", function () {
                var tt = r.silent()

                tt.test("test", r.noop)
                tt.test("test", r.noop)
                tt.test("test", r.noop)

                assert.equal(tt.reflect.count, 3)
            })
        })

        describe("get name", function () {
            it("works with the root test", function () {
                var tt = r.silent()

                assert.equal(tt.reflect.name, undefined)
            })

            it("works with child tests", function () {
                var tt = r.silent()
                var child

                tt.test("test", function () {
                    child = tt.reflect.name
                })

                return tt.runTree().then(function () {
                    assert.equal(child, "test")
                })
            })
        })

        describe("get index", function () {
            it("works with the root test", function () {
                var tt = r.silent()

                assert.equal(tt.reflect.index, undefined)
            })

            it("works with the first child test", function () {
                var tt = r.silent()
                var first

                tt.test("test", function () {
                    first = tt.reflect.index
                })

                return tt.runTree().then(function () {
                    assert.equal(first, 0)
                })
            })

            it("works with the second child test", function () {
                var tt = r.silent()
                var second

                tt.test("test", r.noop)
                tt.test("test", function () {
                    second = tt.reflect.index
                })

                return tt.runTree().then(function () {
                    assert.equal(second, 1)
                })
            })
        })

        describe("get children", function () {
            it("works with 0 tests", function () {
                var tt = r.silent()

                assert.match(tt.reflect.children, [])
            })

            it("works with 1 test", function () {
                var tt = r.silent()
                var test

                tt.test("test", function () {
                    test = tt.reflect
                })

                return tt.runTree().then(function () {
                    assert.match(tt.reflect.children, [test])
                })
            })

            it("works with 2 tests", function () {
                var tt = r.silent()
                var first, second

                tt.test("first", function () {
                    first = tt.reflect
                })

                tt.test("second", function () {
                    second = tt.reflect
                })

                return tt.runTree().then(function () {
                    assert.match(tt.reflect.children, [first, second])
                })
            })

            it("returns a copy", function () {
                var tt = r.silent()
                var slice = tt.reflect.children

                tt.test("test", r.noop)
                assert.match(slice, [])
            })
        })
    })

    describe("run()", function () {
        it("runs child tests", function () {
            var tt = t.internal.root()
            var called = 0
            var err

            tt.reporter = function (res) {
                if (res.isFail) err = res.error
            }

            tt.test("test", function () {
                tt.test("foo", function () { called++ })
            })

            return tt.runTree().then(function () {
                assert.equal(called, 1)
                assert.notOk(err)
            })
        })

        it("catches concurrent runs", function () {
            var tt = r.silent()
            var res = tt.runTree()

            assert.throws(Error, function () { tt.runTree() })
            return res
        })

        it("allows non-concurrent runs with reporter error", function () {
            var tt = t.internal.root()
            var sentinel = new Error("fail")

            tt.reporter = function () { throw sentinel }

            return tt.runTree().then(
                function () { assert.fail("Expected a rejection") },
                function (err) { assert.equal(err, sentinel) })
            .then(function () {
                return tt.runTree().then(
                    function () { assert.fail("Expected a rejection") },
                    function (err) { assert.equal(err, sentinel) })
            })
        })
    })
})
