"use strict"

/* eslint max-nested-callbacks: [2, 5] */

describe("core (reflect)", function () {
    var n = Util.n
    var p = Util.p

    describe("get methods", function () {
        function methods(reflect) { return reflect.methods }

        it("returns the correct methods", function () {
            var tt = t.create()

            assert.equal(tt.call(methods), tt)
        })

        it("returns the correct methods in an inner inline test", function () {
            var tt = t.create()
            var inner = tt.test("test")

            assert.equal(inner.call(methods), inner)
        })

        it("returns the correct methods in an inner block test", function () {
            var tt = t.create()
            var inner, found

            tt.test("test", function (tt) {
                inner = tt
                found = tt.call(methods)
            })

            return tt.run().then(function () {
                assert.equal(found, inner)
            })
        })

        it("returns the correct methods from a previously run test", function () { // eslint-disable-line max-len
            var tt = t.create()
            var inner = tt.test("test")

            return tt.run().then(function () {
                assert.equal(inner.call(methods), inner)
            })
        })
    })

    describe("try()", function () {
        function attempt() {
            var args = []

            for (var i = 0; i < arguments.length; i++) {
                args.push(arguments[i])
            }

            return function (reflect) {
                return reflect.try.apply(reflect, args)
            }
        }

        it("runs blocks in sync tests", function () {
            var tt = t.create()
            var ret = []
            var len, self // eslint-disable-line consistent-this

            tt.reporter(Util.push(ret))

            tt.test("test", function (tt) {
                tt.call(attempt(/** @this */ function () {
                    len = arguments.length
                    self = this
                }))
            })

            return tt.run().then(function () {
                assert.equal(self, undefined)
                assert.equal(len, 0)
                assert.match(ret, [
                    n("start", []),
                    n("pass", [p("test", 0)]),
                    n("end", []),
                ])
            })
        })

        it("propagates errors from blocks in sync tests", function () {
            var tt = t.create()
            var ret = []
            var sentinel = new Error("sentinel")

            sentinel.marker = function () {}

            tt.reporter(Util.push(ret))

            tt.test("test", function (tt) {
                tt.call(attempt(function () { throw sentinel }))
            })

            return tt.run().then(function () {
                assert.match(ret, [
                    n("start", []),
                    n("fail", [p("test", 0)], sentinel),
                    n("end", []),
                ])
            })
        })

        it("runs blocks in async tests", function () {
            var tt = t.create()
            var ret = []
            var len, self // eslint-disable-line consistent-this

            tt.reporter(Util.push(ret))

            tt.test("test", function (tt) {
                tt.call(attempt(/** @this */ function () {
                    len = arguments.length
                    self = this
                }))

                return Util.Promise.resolve()
            })

            return tt.run().then(function () {
                assert.equal(self, undefined)
                assert.equal(len, 0)
                assert.match(ret, [
                    n("start", []),
                    n("pass", [p("test", 0)]),
                    n("end", []),
                ])
            })
        })

        it("propagates errors from blocks in async tests", function () {
            var tt = t.create()
            var ret = []
            var sentinel = new Error("sentinel")

            sentinel.marker = function () {}

            tt.reporter(Util.push(ret))

            tt.test("test", function (tt) {
                tt.call(attempt(function () { throw sentinel }))
                return Util.Promise.resolve()
            })

            return tt.run().then(function () {
                assert.match(ret, [
                    n("start", []),
                    n("fail", [p("test", 0)], sentinel),
                    n("end", []),
                ])
            })
        })

        it("runs blocks in inline sync tests", function () {
            var tt = t.create()
            var ret = []
            var len, self // eslint-disable-line consistent-this

            tt.reporter(Util.push(ret))

            tt.test("test").call(attempt(/** @this */ function () {
                len = arguments.length
                self = this
            }))

            return tt.run().then(function () {
                assert.equal(self, undefined)
                assert.equal(len, 0)
                assert.match(ret, [
                    n("start", []),
                    n("pass", [p("test", 0)]),
                    n("end", []),
                ])
            })
        })

        it("propagates errors from blocks in inline sync tests", function () {
            var tt = t.create()
            var ret = []
            var sentinel = new Error("sentinel")

            sentinel.marker = function () {}

            tt.reporter(Util.push(ret))

            tt.test("test").call(attempt(function () { throw sentinel }))

            return tt.run().then(function () {
                assert.match(ret, [
                    n("start", []),
                    n("fail", [p("test", 0)], sentinel),
                    n("end", []),
                ])
            })
        })
    })

    describe("checkInit()", function () {
        it("catches errors correctly", function () {
            var inner

            return t.create()
            .test("foo", function (tt) {
                inner = tt.call(function (reflect) { return reflect })
            })
            .run().then(function () {
                assert.throws(function () { inner.checkInit() }, ReferenceError)
            })
        })
    })

    describe("get runnable", function () {
        function runnable(reflect) { return reflect.runnable }

        it("checks roots", function () {
            assert.equal(t.create().call(runnable), true)
        })

        it("checks inline normal tests", function () {
            var tt = t.create()

            assert.equal(tt.test("test").call(runnable), true)
        })

        it("checks inline skipped tests", function () {
            var tt = t.create()

            assert.equal(tt.testSkip("test").call(runnable), false)
        })

        it("checks block normal tests", function () {
            var tt = t.create()
            var inner

            tt.test("test", function (tt) {
                inner = tt.call(runnable)
            })

            return tt.run().then(function () {
                assert.equal(inner, true)
            })
        })

        it("misses block skipped tests", function () {
            var tt = t.create()
            var inner

            tt.testSkip("test", function (tt) {
                inner = tt.call(runnable)
            })

            return tt.run().then(function () {
                assert.equal(inner, undefined)
            })
        })

        it("checks whitelisted `.only()` inline tests", function () {
            var tt = t.create()

            tt.only(["test"])
            assert.equal(tt.test("test").call(runnable), true)
        })

        it("checks non-whitelisted `.only()` inline tests", function () {
            var tt = t.create()

            tt.only(["nope"])
            assert.equal(tt.test("test").call(runnable), false)
        })

        it("checks whitelisted `.only()` block tests", function () {
            var tt = t.create()
            var inner

            tt.only(["test"])

            tt.test("test", function (tt) {
                inner = tt.call(runnable)
            })

            return tt.run().then(function () {
                assert.equal(inner, true)
            })
        })

        it("misses non-whitelisted `.only()` block tests", function () {
            var tt = t.create()
            var inner

            tt.only(["nope"])

            tt.test("test", function (tt) {
                inner = tt.call(runnable)
            })

            return tt.run().then(function () {
                assert.equal(inner, undefined)
            })
        })
    })

    describe("get skipped", function () {
        function skipped(reflect) { return reflect.skipped }

        it("checks roots", function () {
            assert.equal(t.create().call(skipped), false)
        })

        it("checks inline normal tests", function () {
            var tt = t.create()

            assert.equal(tt.test("test").call(skipped), false)
        })

        it("checks inline skipped tests", function () {
            var tt = t.create()

            assert.equal(tt.testSkip("test").call(skipped), true)
        })

        it("checks block normal tests", function () {
            var tt = t.create()
            var inner

            tt.test("test", function (tt) {
                inner = tt.call(skipped)
            })

            return tt.run().then(function () {
                assert.equal(inner, false)
            })
        })

        it("misses block skipped tests", function () {
            var tt = t.create()
            var inner

            tt.testSkip("test", function (tt) {
                inner = tt.call(skipped)
            })

            return tt.run().then(function () {
                assert.equal(inner, undefined)
            })
        })

        it("checks whitelisted `.only()` inline tests", function () {
            var tt = t.create()

            tt.only(["test"])
            assert.equal(tt.test("test").call(skipped), false)
        })

        it("checks non-whitelisted `.only()` inline tests", function () {
            var tt = t.create()

            tt.only(["nope"])
            assert.equal(tt.test("test").call(skipped), false)
        })

        it("checks whitelisted `.only()` block tests", function () {
            var tt = t.create()
            var inner

            tt.only(["test"])

            tt.test("test", function (tt) {
                inner = tt.call(skipped)
            })

            return tt.run().then(function () {
                assert.equal(inner, false)
            })
        })

        it("misses non-whitelisted `.only()` block tests", function () {
            var tt = t.create()
            var inner

            tt.only(["nope"])

            tt.test("test", function (tt) {
                inner = tt.call(skipped)
            })

            return tt.run().then(function () {
                assert.equal(inner, undefined)
            })
        })
    })
})
