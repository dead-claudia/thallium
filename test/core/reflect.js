"use strict"

/* eslint max-nested-callbacks: [2, 5] */

describe("core (reflect)", function () {
    describe("get methods", function () {
        function methods(reflect) { return reflect.methods }

        it("returns the correct methods", function () {
            var tt = Util.create()

            assert.equal(tt.call(methods), tt)
        })

        it("returns the correct methods in a child test", function () {
            var tt = Util.create()
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
            var tt = Util.create()
            var inner, reflect

            tt.test("test", function (tt) {
                reflect = tt.call(function (r) { return r })
                inner = tt
            })

            return tt.run().then(function () {
                assert.equal(reflect.methods, inner)
            })
        })
    })

    describe("checkInit()", function () {
        it("catches errors correctly", function () {
            var tt = Util.create()
            var inner

            tt.test("foo", function (tt) {
                inner = tt.call(function (reflect) { return reflect })
            })

            return tt.run().then(function () {
                assert.throws(function () { inner.checkInit() }, ReferenceError)
            })
        })
    })

    describe("get runnable", function () {
        // TODO: detect this while executing tests (i.e. this property will
        // become useless).
        function runnable(reflect) { return reflect.runnable }

        it("checks roots", function () {
            assert.equal(Util.create().call(runnable), true)
        })

        it("checks normal tests", function () {
            var tt = Util.create()
            var inner

            tt.test("test", function (tt) {
                inner = tt.call(runnable)
            })

            return tt.run().then(function () {
                assert.equal(inner, true)
            })
        })

        it("misses skipped tests", function () {
            var tt = Util.create()
            var inner

            tt.testSkip("test", function (tt) {
                inner = tt.call(runnable)
            })

            return tt.run().then(function () {
                assert.equal(inner, undefined)
            })
        })

        it("checks whitelisted `.only()` tests", function () {
            var tt = Util.create()
            var inner

            tt.only(["test"])

            tt.test("test", function (tt) {
                inner = tt.call(runnable)
            })

            return tt.run().then(function () {
                assert.equal(inner, true)
            })
        })

        it("misses non-whitelisted `.only()` tests", function () {
            var tt = Util.create()
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
})
