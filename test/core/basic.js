"use strict"

/* eslint max-nested-callbacks: [2, 5] */

// Note: updates to this should also be reflected in
// fixtures/mid-coffee/spec/basic.coffee, as it's trying to represent more
// real-world usage.

describe("core (basic)", function () {
    describe("create()", function () {
        it("exists", function () {
            assert.function(t.create)
        })
    })

    describe("reflect()", function () {
        it("exists", function () {
            assert.function(t.reflect)
        })

        it("has parent()", function () {
            var tt = t.create()

            assert.equal(tt.reflect().parent(), undefined)
            assert.equal(tt.test("test").reflect().parent(), tt)
        })
    })

    describe("test()", function () {
        it("exists", function () {
            assert.function(t.create().test)
        })

        it("accepts a string + function", function () {
            var tt = t.create()

            tt.test("test", function () {})
        })

        it("accepts a string", function () {
            var tt = t.create()

            tt.test("test")
        })

        it("returns the current instance when given a callback", function () {
            var tt = t.create()
            var test = tt.test("test", function () {})

            assert.equal(test, tt)
        })

        it("returns a prototypal clone when not given a callback", function () {
            var tt = t.create()
            var test = tt.test("test")

            assert.notEqual(test, tt)
            assert.equal(Object.getPrototypeOf(test), tt)
        })
    })

    describe("run()", function () {
        it("exists", function () {
            assert.function(t.create().run)
        })

        it("runs block tests within tests", function () {
            var tt = t.create()
            var called = 0

            tt.test("test", function (tt) {
                tt.test("foo", function () { called++ })
            })

            return tt.run().then(function () { assert.equal(called, 1) })
        })

        it("runs successful inline tests within tests", function () {
            var tt = t.create()
            var err

            tt.reporter(function (res) {
                if (res.fail()) err = res.value
            })

            tt.test("test", function (tt) {
                tt.test("foo").use(function () {})
            })

            return tt.run().then(function () { assert.notOk(err) })
        })
    })

    describe("try()", function () {
        it("exists", function () {
            assert.function(t.create().try)
            assert.function(t.reflect().try)
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
                assert.throws(function () { t.create().try() }, TypeError)
                assert.throws(function () { t.create().try(1) }, TypeError)
                assert.throws(function () { t.create().try("foo") }, TypeError)
                assert.throws(function () { t.create().try(true) }, TypeError)
                assert.throws(function () { t.create().try({}) }, TypeError)
                assert.throws(function () { t.create().try([]) }, TypeError)
                assert.throws(function () { t.create().try(null) }, TypeError)
                if (typeof Symbol === "function") { // eslint-disable-line no-undef, max-len
                    assert.throws(function () { t.create().try(Symbol()) }, TypeError) // eslint-disable-line no-undef, max-len
                }
            })

            it("succeeds with 0 args", function () {
                var spy = makeSpy()
                var tt = t.create()

                tt.try(spy)
                assert.match(spy.this, [undefined])
                assert.match(spy.args, [[]])
            })

            it("succeeds with 1 arg", function () {
                var spy = makeSpy()
                var tt = t.create()

                tt.try(spy, {value: 1})
                assert.match(spy.this, [undefined])
                assert.match(spy.args, [[{value: 1}]])
            })

            it("succeeds with 2 args", function () {
                var spy = makeSpy()
                var tt = t.create()

                tt.try(spy, {value: 1}, {value: 2})
                assert.match(spy.this, [undefined])
                assert.match(spy.args, [[{value: 1}, {value: 2}]])
            })

            it("succeeds with 3 args", function () {
                var spy = makeSpy()
                var tt = t.create()

                tt.try(spy, {value: 1}, {value: 2}, {value: 3})
                assert.match(spy.this, [undefined])
                assert.match(spy.args, [[{value: 1}, {value: 2}, {value: 3}]])
            })

            it("succeeds with 4 args", function () {
                var spy = makeSpy()
                var tt = t.create()

                tt.try(spy, {value: 1}, {value: 2}, {value: 3}, {value: 4})
                assert.match(spy.this, [undefined])
                assert.match(spy.args, [
                    [{value: 1}, {value: 2}, {value: 3}, {value: 4}],
                ])
            })
        })

        context("with inline tests", function () {
            it("requires a function", function () {
                assert.throws(function () { t.create().try() }, TypeError)
                assert.throws(function () { t.create().try(1) }, TypeError)
                assert.throws(function () { t.create().try("foo") }, TypeError)
                assert.throws(function () { t.create().try(true) }, TypeError)
                assert.throws(function () { t.create().try({}) }, TypeError)
                assert.throws(function () { t.create().try([]) }, TypeError)
                assert.throws(function () { t.create().try(null) }, TypeError)
                if (typeof Symbol === "function") { // eslint-disable-line no-undef, max-len
                    assert.throws(function () { t.create().try(Symbol()) }, TypeError) // eslint-disable-line no-undef, max-len
                }
            })

            it("succeeds with 0 args", function () {
                var spy = makeSpy()
                var tt = t.create()

                tt.test("test")
                .try(spy)

                return tt.run().then(function () {
                    assert.match(spy.this, [undefined])
                    assert.match(spy.args, [[]])
                })
            })

            it("succeeds with 1 arg", function () {
                var spy = makeSpy()
                var tt = t.create()

                tt.test("test")
                .try(spy, {value: 1})

                return tt.run().then(function () {
                    assert.match(spy.this, [undefined])
                    assert.match(spy.args, [[{value: 1}]])
                })
            })

            it("succeeds with 2 args", function () {
                var spy = makeSpy()
                var tt = t.create()

                tt.test("test")
                .try(spy, {value: 1}, {value: 2})

                return tt.run().then(function () {
                    assert.match(spy.this, [undefined])
                    assert.match(spy.args, [[{value: 1}, {value: 2}]])
                })
            })

            it("succeeds with 3 args", function () {
                var spy = makeSpy()
                var tt = t.create()

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
                var tt = t.create()

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
