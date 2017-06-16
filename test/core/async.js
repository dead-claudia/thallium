describe("core/async", function () {
    "use strict"

    var r = Util.report

    function test(name, opts) {
        it(name, function () {
            var called = false
            var ret = r.check({
                init: function (tt) {
                    opts.init(tt, function () { called = true })
                },
                expected: opts.expected,
            })
            .then(function () { assert.equal(called, true) })

            assert.equal(called, false)
            return ret
        })
    }

    test("with sync tests", {
        init: function (tt, setCalled) {
            tt.test("test", setCalled)
        },
    })

    test("with async tests + sync resolve", {
        init: function (tt, setCalled) {
            tt.test("test", function () {
                setCalled()
                return {then: function (resolve) { resolve() }}
            })
        },
    })

    test("with async tests + async resolve", {
        init: function (tt, setCalled) {
            tt.test("test", function () {
                setCalled()
                return {
                    then: function (resolve) {
                        Util.setTimeout(resolve, 0)
                    },
                }
            })
        },
    })

    test("with async tests + duplicate thenable resolution", {
        init: function (tt, setCalled) {
            tt.test("test", function () {
                setCalled()
                return {
                    then: function (resolve) {
                        resolve()
                        resolve()
                        resolve()
                    },
                }
            })
        },
    })

    test("with async tests + duplicate thenable rejection", {
        init: function (tt, setCalled) {
            tt.test("test", function () {
                setCalled()
                return {
                    then: function (_, reject) {
                        reject(new Error("sentinel"))
                        reject()
                        reject()
                    },
                }
            })
        },
        expected: r.root([
            r.fail("test", new Error("sentinel")),
        ]),
    })

    test("with async tests + mixed thenable (resolve first)", {
        init: function (tt, setCalled) {
            tt.test("test", function () {
                setCalled()
                return {
                    then: function (resolve, reject) {
                        resolve()
                        reject(new Error("sentinel"))
                        resolve()
                        reject()
                    },
                }
            })
        },
        expected: r.root([
            r.pass("test"),
        ]),
    })

    test("with async tests + mixed thenable (reject first)", {
        init: function (tt, setCalled) {
            tt.test("test", function () {
                setCalled()
                return {
                    then: function (resolve, reject) {
                        reject(new Error("sentinel"))
                        resolve()
                        reject()
                        resolve()
                    },
                }
            })
        },
        expected: r.root([
            r.fail("test", new Error("sentinel")),
        ]),
    })
})
