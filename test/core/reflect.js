"use strict"

/* eslint max-nested-callbacks: [2, 5] */

describe("core (reflect)", function () {
    function identity(r) { return r }

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
                reflect = tt.call(identity)
                inner = tt
            })

            return tt.run().then(function () {
                assert.equal(reflect.methods, inner)
            })
        })
    })

    describe("get current", function () {
        function current(reflect) { return reflect.current }

        it("returns the correct methods", function () {
            var tt = Util.create()

            assert.equal(tt.call(current).methods, tt)
        })

        it("returns the correct methods in a child test", function () {
            var tt = Util.create()
            var inner, found

            tt.test("test", function (tt) {
                inner = tt
                found = tt.call(current)
            })

            return tt.run().then(function () {
                assert.equal(found.methods, inner)
            })
        })
    })
})
