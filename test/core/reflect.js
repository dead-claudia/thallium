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
        it("passes in the root", function () {
            Util.create().call(function (reflect) {
                reflect.checkInit()
            })
        })

        it("passes in subtests", function () {
            var tt = Util.create()
            var err

            tt.reporter(function (ev) {
                if (ev.fail) err = ev.value
            })

            tt.test("test", function (tt) {
                tt.call(function (reflect) { reflect.checkInit() })
            })

            return tt.run().then(function () {
                assert.notOk(err)
            })
        })

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
})
