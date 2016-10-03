"use strict"

describe("core (asynchronous behavior)", function () {
    var n = Util.n
    var p = Util.p

    it("with normal tests", function () {
        var tt = t.base()
        var called = false

        tt.test("test", function () { called = true })

        var ret = tt.run().then(function () { assert.ok(called) })

        assert.notOk(called)
        return ret
    })

    it("with shorthand tests", function () {
        var tt = t.base()
        var called = false

        function fail() {
            called = true
            return assert.fail()
        }

        tt.test("test").try(fail)

        var ret = tt.run().then(function () { assert.ok(called) })

        assert.notOk(called)
        return ret
    })

    it("with async tests + sync done call", function () {
        var tt = t.base()
        var called = false

        tt.async("test", function (_, done) {
            called = true
            return done()
        })

        var ret = tt.run().then(function () { assert.ok(called) })

        assert.notOk(called)
        return ret
    })

    it("with async tests + async done call", function () {
        var tt = t.base()
        var called = false

        tt.async("test", function (_, done) {
            called = true
            Util.setTimeout(function () { done() }, 0)
        })

        var ret = tt.run().then(function () { assert.ok(called) })

        assert.notOk(called)
        return ret
    })

    it("with async tests + duplicate thenable resolution", function () {
        var tt = t.base()
        var called = false

        tt.async("test", function () {
            called = true
            return {
                then: function (resolve) {
                    resolve()
                    resolve()
                    resolve()
                },
            }
        })

        var ret = tt.run().then(function () { assert.ok(called) })

        assert.notOk(called)
        return ret
    })

    it("with async tests + duplicate thenable rejection", function () {
        var tt = t.base()
        var called = false
        var ret = []
        var sentinel = new Error("sentinel")

        sentinel.marker = function () {}

        tt.reporter(Util.push(ret))

        tt.async("test", function () {
            called = true
            return {
                then: function (_, reject) {
                    reject(sentinel)
                    reject()
                    reject()
                },
            }
        })

        var result = tt.run().then(function () {
            assert.match(ret, [
                n("start", []),
                n("fail", [p("test", 0)], sentinel),
                n("end", []),
            ])
        })

        assert.notOk(called)
        return result
    })

    it("with async tests + mixed thenable (resolve first)", function () {
        var tt = t.base()
        var called = false
        var ret = []
        var sentinel = new Error("sentinel")

        sentinel.marker = function () {}

        tt.reporter(Util.push(ret))

        tt.async("test", function () {
            called = true
            return {
                then: function (resolve, reject) {
                    resolve()
                    reject(sentinel)
                    resolve()
                    reject()
                },
            }
        })

        var result = tt.run().then(function () {
            assert.match(ret, [
                n("start", []),
                n("pass", [p("test", 0)]),
                n("end", []),
            ])
        })

        assert.notOk(called)
        return result
    })

    it("with async tests + mixed thenable (reject first)", function () {
        var tt = t.base()
        var called = false
        var ret = []
        var sentinel = new Error("sentinel")

        sentinel.marker = function () {}

        tt.reporter(Util.push(ret))

        tt.async("test", function () {
            called = true

            return {
                then: function (resolve, reject) {
                    reject(sentinel)
                    resolve()
                    reject()
                    resolve()
                },
            }
        })

        var result = tt.run().then(function () {
            assert.match(ret, [
                n("start", []),
                n("fail", [p("test", 0)], sentinel),
                n("end", []),
            ])
        })

        assert.notOk(called)
        return result
    })
})
