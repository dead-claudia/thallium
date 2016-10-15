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

                assert.equal(tt.call(parent), undefined)
                assert.equal(tt.test("test").call(parent).methods, tt)
            })
        })

        describe("count", function () {
            function count(reflect) { return reflect.count }

            it("works with 0 tests", function () {
                var tt = Util.create()

                assert.equal(tt.call(count), 0)
            })

            it("works with 1 test", function () {
                var tt = Util.create()

                tt.test("test")

                assert.equal(tt.call(count), 1)
            })

            it("works with 2 tests", function () {
                var tt = Util.create()

                tt.test("test")
                tt.test("test")

                assert.equal(tt.call(count), 2)
            })

            it("works with 3 tests", function () {
                var tt = Util.create()

                tt.test("test")
                tt.test("test")
                tt.test("test")

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
                var tt = Util.create().test("test")

                assert.equal(tt.call(name), "test")
            })
        })

        describe("get index", function () {
            function index(reflect) { return reflect.index }

            it("works with the root test", function () {
                var tt = Util.create()

                assert.equal(tt.call(index), -1)
            })

            it("works with the first child test", function () {
                var tt = Util.create().test("test")

                assert.equal(tt.call(index), 0)
            })

            it("works with the second child test", function () {
                var tt = Util.create()

                tt.test("test")
                var second = tt.test("test")

                assert.equal(second.call(index), 1)
            })
        })

        describe("get children", function () {
            function children(reflect) { return reflect.children }

            it("works with 0 tests", function () {
                var tt = Util.create()

                assert.match(tt.call(children), [])
            })

            it("works with 1 test", function () {
                var tt = Util.create()
                var test = tt.test("test").call(function (r) { return r })

                assert.match(tt.call(children), [test])
            })

            it("works with 2 tests", function () {
                var tt = Util.create()
                var first = tt.test("first").call(function (r) { return r })
                var second = tt.test("second").call(function (r) { return r })

                assert.match(tt.call(children), [first, second])
            })

            it("returns a copy", function () {
                var tt = Util.create()
                var slice = tt.call(children)

                tt.test("test")
                assert.match(slice, [])
            })
        })
    })

    describe("test()", function () {
        it("exists", function () {
            assert.function(Util.create().test)
        })

        it("accepts a string + function", function () {
            var tt = Util.create()

            tt.test("test", function () {})
        })

        it("accepts a string", function () {
            var tt = Util.create()

            tt.test("test")
        })

        it("returns the current instance when given a callback", function () {
            var tt = Util.create()
            var test = tt.test("test", function () {})

            assert.equal(test, tt)
        })

        it("returns a prototypal clone when not given a callback", function () {
            var tt = Util.create()
            var test = tt.test("test")

            assert.notEqual(test, tt)
            assert.equal(Object.getPrototypeOf(test), tt)
        })
    })

    describe("run()", function () {
        it("exists", function () {
            assert.function(Util.create().run)
        })

        it("runs block tests within tests", function () {
            var tt = Util.create()
            var called = 0

            tt.test("test", function (tt) {
                tt.test("foo", function () { called++ })
            })

            return tt.run().then(function () { assert.equal(called, 1) })
        })

        it("runs successful inline tests within tests", function () {
            var tt = Util.create()
            var err

            tt.reporter(function (res) {
                if (res.fail) err = res.value
            })

            tt.test("test", function (tt) {
                tt.test("foo").call(function () {})
            })

            return tt.run().then(function () { assert.notOk(err) })
        })
    })

    describe("try()", function () {
        it("exists", function () {
            assert.function(Util.create().try)
            t.call(function (reflect) { assert.function(reflect.try) })
        })

        function makeSpy(result) {
            /** @this */
            function spy() {
                var args = []

                for (var i = 0; i < arguments.length; i++) {
                    args.push(arguments[i])
                }

                spy.this.push(this)
                spy.args.push(args)

                if (result != null) throw result
            }

            spy.this = []
            spy.args = []
            return spy
        }

        context("with block tests", function () {
            it("requires a function", function () {
                assert.throws(function () { Util.create().try() }, TypeError)
                assert.throws(function () { Util.create().try(1) }, TypeError)
                assert.throws(function () { Util.create().try("foo") }, TypeError) // eslint-disable-line max-len
                assert.throws(function () { Util.create().try(true) }, TypeError) // eslint-disable-line max-len
                assert.throws(function () { Util.create().try({}) }, TypeError)
                assert.throws(function () { Util.create().try([]) }, TypeError)
                assert.throws(function () { Util.create().try(null) }, TypeError) // eslint-disable-line max-len
                if (typeof Symbol === "function") { // eslint-disable-line no-undef, max-len
                    assert.throws(function () { Util.create().try(Symbol()) }, TypeError) // eslint-disable-line no-undef, max-len
                }
            })

            it("succeeds with 0 args", function () {
                var spy = makeSpy()
                var tt = Util.create()

                tt.try(spy)
                assert.match(spy.this, [undefined])
                assert.match(spy.args, [[]])
            })

            it("succeeds with 1 arg", function () {
                var spy = makeSpy()
                var tt = Util.create()

                tt.try(spy, {value: 1})
                assert.match(spy.this, [undefined])
                assert.match(spy.args, [[{value: 1}]])
            })

            it("succeeds with 2 args", function () {
                var spy = makeSpy()
                var tt = Util.create()

                tt.try(spy, {value: 1}, {value: 2})
                assert.match(spy.this, [undefined])
                assert.match(spy.args, [[{value: 1}, {value: 2}]])
            })

            it("succeeds with 3 args", function () {
                var spy = makeSpy()
                var tt = Util.create()

                tt.try(spy, {value: 1}, {value: 2}, {value: 3})
                assert.match(spy.this, [undefined])
                assert.match(spy.args, [[{value: 1}, {value: 2}, {value: 3}]])
            })

            it("succeeds with 4 args", function () {
                var spy = makeSpy()
                var tt = Util.create()

                tt.try(spy, {value: 1}, {value: 2}, {value: 3}, {value: 4})
                assert.match(spy.this, [undefined])
                assert.match(spy.args, [
                    [{value: 1}, {value: 2}, {value: 3}, {value: 4}],
                ])
            })
        })

        context("with inline tests", function () {
            it("requires a function", function () {
                assert.throws(function () { Util.create().try() }, TypeError)
                assert.throws(function () { Util.create().try(1) }, TypeError)
                assert.throws(function () { Util.create().try("foo") }, TypeError) // eslint-disable-line max-len
                assert.throws(function () { Util.create().try(true) }, TypeError) // eslint-disable-line max-len
                assert.throws(function () { Util.create().try({}) }, TypeError)
                assert.throws(function () { Util.create().try([]) }, TypeError)
                assert.throws(function () { Util.create().try(null) }, TypeError) // eslint-disable-line max-len
                if (typeof Symbol === "function") { // eslint-disable-line no-undef, max-len
                    assert.throws(function () { Util.create().try(Symbol()) }, TypeError) // eslint-disable-line no-undef, max-len
                }
            })

            it("succeeds with 0 args", function () {
                var spy = makeSpy()
                var tt = Util.create()

                tt.test("test")
                .try(spy)

                return tt.run().then(function () {
                    assert.match(spy.this, [undefined])
                    assert.match(spy.args, [[]])
                })
            })

            it("succeeds with 1 arg", function () {
                var spy = makeSpy()
                var tt = Util.create()

                tt.test("test")
                .try(spy, {value: 1})

                return tt.run().then(function () {
                    assert.match(spy.this, [undefined])
                    assert.match(spy.args, [[{value: 1}]])
                })
            })

            it("succeeds with 2 args", function () {
                var spy = makeSpy()
                var tt = Util.create()

                tt.test("test")
                .try(spy, {value: 1}, {value: 2})

                return tt.run().then(function () {
                    assert.match(spy.this, [undefined])
                    assert.match(spy.args, [[{value: 1}, {value: 2}]])
                })
            })

            it("succeeds with 3 args", function () {
                var spy = makeSpy()
                var tt = Util.create()

                tt.test("test")
                .try(spy, {value: 1}, {value: 2}, {value: 3})

                return tt.run().then(function () {
                    assert.match(spy.this, [undefined])
                    assert.match(spy.args, [
                        [{value: 1}, {value: 2}, {value: 3}],
                    ])
                })
            })

            it("succeeds with 4 args", function () {
                var spy = makeSpy()
                var tt = Util.create()

                tt.test("test")
                .try(spy, {value: 1}, {value: 2}, {value: 3}, {value: 4})

                return tt.run().then(function () {
                    assert.match(spy.this, [undefined])
                    assert.match(spy.args, [
                        [{value: 1}, {value: 2}, {value: 3}, {value: 4}],
                    ])
                })
            })
        })
    })
})
