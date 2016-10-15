"use strict"

/* eslint max-nested-callbacks: [2, 5] */

describe("core (reflect)", function () {
    var n = Util.n
    var p = Util.p

    describe("methods()", function () {
        function methods(reflect) { return reflect.methods() }

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

    describe("runnable()", function () {
        function runnable(reflect) { return reflect.runnable() }

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

    describe("skipped()", function () {
        function skipped(reflect) { return reflect.skipped() }

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

    describe("report()", function () {
        var Report = Util.Tests.Report
        var Types = Util.Tests.Types
        var create = t.call(function (reflect) { return reflect.report })

        it("correctly creates `start` reports", function () {
            var report = create("start", [], {value: "hello"})
            var expected = new Report(Types.Start, [], undefined, -1, 0)

            assert.match(report, expected)
        })

        it("correctly creates `enter` reports", function () {
            var report = create("enter", [], {value: "hello"})
            var expected = new Report(Types.Enter, [], undefined, 10, 75)

            assert.match(report, expected)
        })

        it("correctly creates `enter` reports with duration", function () {
            var report = create("enter", [], {value: "hello"}, 20)
            var expected = new Report(Types.Enter, [], undefined, 20, 75)

            assert.match(report, expected)
        })

        it("correctly creates `enter` reports with slow", function () {
            var report = create("enter", [], {value: "hello"}, null, 10) // eslint-disable-line max-len
            var expected = new Report(Types.Enter, [], undefined, 10, 10)

            assert.match(report, expected)
        })

        it("correctly creates `enter` reports with duration + slow", function () { // eslint-disable-line max-len
            var report = create("enter", [], {value: "hello"}, null, 10) // eslint-disable-line max-len
            var expected = new Report(Types.Enter, [], undefined, 10, 10)

            assert.match(report, expected)
        })

        it("correctly creates `leave` reports", function () {
            var report = create("leave", [], {value: "hello"})
            var expected = new Report(Types.Leave, [], undefined, -1, 0)

            assert.match(report, expected)
        })

        it("correctly creates `pass` reports", function () {
            var report = create("pass", [], {value: "hello"})
            var expected = new Report(Types.Pass, [], undefined, 10, 75)

            assert.match(report, expected)
        })

        it("correctly creates `pass` reports with duration", function () {
            var report = create("pass", [], {value: "hello"}, 20)
            var expected = new Report(Types.Pass, [], undefined, 20, 75)

            assert.match(report, expected)
        })

        it("correctly creates `pass` reports with slow", function () {
            var report = create("pass", [], {value: "hello"}, null, 10) // eslint-disable-line max-len
            var expected = new Report(Types.Pass, [], undefined, 10, 10)

            assert.match(report, expected)
        })

        it("correctly creates `pass` reports with duration + slow", function () { // eslint-disable-line max-len
            var report = create("pass", [], {value: "hello"}, null, 10) // eslint-disable-line max-len
            var expected = new Report(Types.Pass, [], undefined, 10, 10)

            assert.match(report, expected)
        })

        it("correctly creates `fail` reports", function () {
            var report = create("fail", [], {value: "hello"})
            var expected = new Report(Types.Fail, [], {value: "hello"}, 10, 75)

            assert.match(report, expected)
        })

        it("correctly creates `fail` reports with duration", function () {
            var report = create("fail", [], {value: "hello"}, 20)
            var expected = new Report(Types.Fail, [], {value: "hello"}, 20, 75)

            assert.match(report, expected)
        })

        it("correctly creates `fail` reports with slow", function () {
            var report = create("fail", [], {value: "hello"}, null, 10) // eslint-disable-line max-len
            var expected = new Report(Types.Fail, [], {value: "hello"}, 10, 10)

            assert.match(report, expected)
        })

        it("correctly creates `fail` reports with duration + slow", function () { // eslint-disable-line max-len
            var report = create("fail", [], {value: "hello"}, null, 10) // eslint-disable-line max-len
            var expected = new Report(Types.Fail, [], {value: "hello"}, 10, 10)

            assert.match(report, expected)
        })

        it("correctly creates `skip` reports", function () {
            var report = create("skip", [], {value: "hello"})
            var expected = new Report(Types.Skip, [], undefined, -1, 0)

            assert.match(report, expected)
        })

        it("correctly creates `end` reports", function () {
            var report = create("end", [], {value: "hello"})
            var expected = new Report(Types.End, [], undefined, -1, 0)

            assert.match(report, expected)
        })

        it("correctly creates `error` reports", function () {
            var report = create("error", [], {value: "hello"})
            var expected = new Report(Types.Error, [], {value: "hello"}, -1, 0)

            assert.match(report, expected)
        })

        context("type checkers", function () {
            it("correctly identifies `start` reports", function () {
                var report = create("start", [])

                assert.equal(report.start(), true)
                assert.equal(report.enter(), false)
                assert.equal(report.leave(), false)
                assert.equal(report.pass(), false)
                assert.equal(report.fail(), false)
                assert.equal(report.skip(), false)
                assert.equal(report.end(), false)
                assert.equal(report.error(), false)
            })

            it("correctly identifies `enter` reports", function () {
                var report = create("enter", [])

                assert.equal(report.start(), false)
                assert.equal(report.enter(), true)
                assert.equal(report.leave(), false)
                assert.equal(report.pass(), false)
                assert.equal(report.fail(), false)
                assert.equal(report.skip(), false)
                assert.equal(report.end(), false)
                assert.equal(report.error(), false)
            })

            it("correctly identifies `leave` reports", function () {
                var report = create("leave", [])

                assert.equal(report.start(), false)
                assert.equal(report.enter(), false)
                assert.equal(report.leave(), true)
                assert.equal(report.pass(), false)
                assert.equal(report.fail(), false)
                assert.equal(report.skip(), false)
                assert.equal(report.end(), false)
                assert.equal(report.error(), false)
            })

            it("correctly identifies `pass` reports", function () {
                var report = create("pass", [])

                assert.equal(report.start(), false)
                assert.equal(report.enter(), false)
                assert.equal(report.leave(), false)
                assert.equal(report.pass(), true)
                assert.equal(report.fail(), false)
                assert.equal(report.skip(), false)
                assert.equal(report.end(), false)
                assert.equal(report.error(), false)
            })

            it("correctly identifies `fail` reports", function () {
                var report = create("fail", [])

                assert.equal(report.start(), false)
                assert.equal(report.enter(), false)
                assert.equal(report.leave(), false)
                assert.equal(report.pass(), false)
                assert.equal(report.fail(), true)
                assert.equal(report.skip(), false)
                assert.equal(report.end(), false)
                assert.equal(report.error(), false)
            })

            it("correctly identifies `skip` reports", function () {
                var report = create("skip", [])

                assert.equal(report.start(), false)
                assert.equal(report.enter(), false)
                assert.equal(report.leave(), false)
                assert.equal(report.pass(), false)
                assert.equal(report.fail(), false)
                assert.equal(report.skip(), true)
                assert.equal(report.end(), false)
                assert.equal(report.error(), false)
            })

            it("correctly identifies `end` reports", function () {
                var report = create("end", [])

                assert.equal(report.start(), false)
                assert.equal(report.enter(), false)
                assert.equal(report.leave(), false)
                assert.equal(report.pass(), false)
                assert.equal(report.fail(), false)
                assert.equal(report.skip(), false)
                assert.equal(report.end(), true)
                assert.equal(report.error(), false)
            })

            it("correctly identifies `error` reports", function () {
                var report = create("error", [])

                assert.equal(report.start(), false)
                assert.equal(report.enter(), false)
                assert.equal(report.leave(), false)
                assert.equal(report.pass(), false)
                assert.equal(report.fail(), false)
                assert.equal(report.skip(), false)
                assert.equal(report.end(), false)
                assert.equal(report.error(), true)
            })
        })

        context("type()", function () {
            it("returns correct value for `start` reports", function () {
                assert.match(create("start", []).type(), "start")
            })

            it("returns correct value for `enter` reports", function () {
                assert.match(create("enter", []).type(), "enter")
            })

            it("returns correct value for `leave` reports", function () {
                assert.match(create("leave", []).type(), "leave")
            })

            it("returns correct value for `pass` reports", function () {
                assert.match(create("pass", []).type(), "pass")
            })

            it("returns correct value for `fail` reports", function () {
                assert.match(create("fail", []).type(), "fail")
            })

            it("returns correct value for `skip` reports", function () {
                assert.match(create("skip", []).type(), "skip")
            })

            it("returns correct value for `end` reports", function () {
                assert.match(create("end", []).type(), "end")
            })

            it("returns correct value for `error` reports", function () {
                assert.match(create("error", []).type(), "error")
            })
        })
    })
})
