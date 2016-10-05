"use strict"

/* eslint max-nested-callbacks: [2, 5] */

describe("core (reflect)", function () {
    var n = Util.n
    var p = Util.p

    describe("methods()", function () {
        it("exists", function () {
            assert.function(t.reflect().methods)
        })

        it("returns the correct methods", function () {
            var tt = t.create()

            assert.equal(tt.reflect().methods(), tt)
        })

        it("returns the correct methods in an inner inline test", function () {
            var tt = t.create()
            var inner = tt.test("test")
            var reflect = inner.reflect().methods()

            assert.equal(reflect, inner)
        })

        it("returns the correct methods in an inner block test", function () {
            var tt = t.create()
            var inner, reflect

            tt.test("test", function (tt) {
                inner = tt
                reflect = tt.reflect().methods()
            })

            return tt.run().then(function () {
                assert.equal(reflect, inner)
            })
        })

        it("returns the correct methods in an inner async test", function () {
            var tt = t.create()
            var inner, reflect

            tt.async("test", function (tt) {
                inner = tt
                reflect = tt.reflect().methods()
                return Util.Promise.resolve()
            })

            return tt.run().then(function () {
                assert.equal(reflect, inner)
            })
        })

        it("returns the correct methods from a previously run test", function () { // eslint-disable-line max-len
            var tt = t.create()
            var inner = tt.test("test")

            return tt.run().then(function () {
                assert.equal(inner.reflect().methods(), inner)
            })
        })
    })

    describe("try()", function () {
        it("exists", function () {
            assert.function(t.reflect().try)
        })

        it("runs blocks in sync tests", function () {
            var tt = t.create()
            var ret = []
            var len, self // eslint-disable-line consistent-this

            tt.reporter(Util.push(ret))

            tt.test("test", function (tt) {
                tt.reflect().try(/** @this */ function () {
                    len = arguments.length
                    self = this
                })
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
                tt.reflect().try(function () { throw sentinel })
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

            tt.async("test", function (tt) {
                tt.reflect().try(/** @this */ function () {
                    len = arguments.length
                    self = this
                })

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

            tt.async("test", function (tt) {
                tt.reflect().try(function () { throw sentinel })
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

            tt.test("test").reflect().try(/** @this */ function () {
                len = arguments.length
                self = this
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

        it("propagates errors from blocks in inline sync tests", function () {
            var tt = t.create()
            var ret = []
            var sentinel = new Error("sentinel")

            sentinel.marker = function () {}

            tt.reporter(Util.push(ret))

            tt.test("test").reflect().try(function () { throw sentinel })

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
        it("exists", function () {
            assert.function(t.reflect().checkInit)
        })

        it("catches errors correctly", function () {
            var inner

            return t.create()
            .test("foo", function (tt) {
                inner = tt
            })
            .run().then(function () {
                assert.throws(
                    function () { inner.reflect().checkInit() },
                    ReferenceError)
            })
        })
    })

    describe("runnable()", function () {
        it("exists", function () {
            assert.function(t.reflect().runnable)
        })

        it("checks roots", function () {
            assert.equal(t.create().reflect().runnable(), false)
        })

        it("checks inline normal tests", function () {
            var tt = t.create()

            assert.equal(tt.test("test").reflect().runnable(), false)
        })

        it("checks inline skipped tests", function () {
            var tt = t.create()

            assert.equal(tt.testSkip("test").reflect().runnable(), true)
        })

        it("checks block normal tests", function () {
            var tt = t.create()
            var runnable

            tt.test("test", function (tt) {
                runnable = tt.reflect().runnable()
            })

            return tt.run().then(function () {
                assert.equal(runnable, false)
            })
        })

        it("misses block skipped tests", function () {
            var tt = t.create()
            var runnable

            tt.testSkip("test", function (tt) {
                runnable = tt.reflect().runnable()
            })

            return tt.run().then(function () {
                assert.equal(runnable, undefined)
            })
        })

        it("checks whitelisted `.only()` inline tests", function () {
            var tt = t.create()

            tt.only(["test"])
            assert.equal(tt.test("test").reflect().runnable(), false)
        })

        it("checks non-whitelisted `.only()` inline tests", function () {
            var tt = t.create()

            tt.only(["nope"])
            assert.equal(tt.test("test").reflect().runnable(), true)
        })

        it("checks whitelisted `.only()` block tests", function () {
            var tt = t.create()
            var runnable

            tt.only(["test"])

            tt.test("test", function (tt) {
                runnable = tt.reflect().runnable()
            })

            return tt.run().then(function () {
                assert.equal(runnable, false)
            })
        })

        it("misses non-whitelisted `.only()` block tests", function () {
            var tt = t.create()
            var runnable

            tt.only(["nope"])

            tt.test("test", function (tt) {
                runnable = tt.reflect().runnable()
            })

            return tt.run().then(function () {
                assert.equal(runnable, undefined)
            })
        })
    })

    describe("skipped()", function () {
        it("exists", function () {
            assert.function(t.reflect().skipped)
        })

        it("checks roots", function () {
            assert.equal(t.create().reflect().skipped(), false)
        })

        it("checks inline normal tests", function () {
            var tt = t.create()

            assert.equal(tt.test("test").reflect().skipped(), false)
        })

        it("checks inline skipped tests", function () {
            var tt = t.create()

            assert.equal(tt.testSkip("test").reflect().skipped(), true)
        })

        it("checks block normal tests", function () {
            var tt = t.create()
            var skipped

            tt.test("test", function (tt) {
                skipped = tt.reflect().skipped()
            })

            return tt.run().then(function () {
                assert.equal(skipped, false)
            })
        })

        it("misses block skipped tests", function () {
            var tt = t.create()
            var skipped

            tt.testSkip("test", function (tt) {
                skipped = tt.reflect().skipped()
            })

            return tt.run().then(function () {
                assert.equal(skipped, undefined)
            })
        })

        it("checks whitelisted `.only()` inline tests", function () {
            var tt = t.create()

            tt.only(["test"])
            assert.equal(tt.test("test").reflect().skipped(), false)
        })

        it("checks non-whitelisted `.only()` inline tests", function () {
            var tt = t.create()

            tt.only(["nope"])
            assert.equal(tt.test("test").reflect().skipped(), false)
        })

        it("checks whitelisted `.only()` block tests", function () {
            var tt = t.create()
            var skipped

            tt.only(["test"])

            tt.test("test", function (tt) {
                skipped = tt.reflect().skipped()
            })

            return tt.run().then(function () {
                assert.equal(skipped, false)
            })
        })

        it("misses non-whitelisted `.only()` block tests", function () {
            var tt = t.create()
            var skipped

            tt.only(["nope"])

            tt.test("test", function (tt) {
                skipped = tt.reflect().skipped()
            })

            return tt.run().then(function () {
                assert.equal(skipped, undefined)
            })
        })
    })

    describe("report()", function () {
        var Report = Util.Tests.Report
        var r = Util.Tests.toReportType

        it("correctly creates `start` reports", function () {
            var report = t.reflect().report("start", [], {value: "hello"})
            var expected = new Report(r("start"), [], undefined, -1, 0)

            assert.match(report, expected)
        })

        it("correctly creates `enter` reports", function () {
            var report = t.reflect().report("enter", [], {value: "hello"})
            var expected = new Report(r("enter"), [], undefined, 10, 75)

            assert.match(report, expected)
        })

        it("correctly creates `enter` reports with duration", function () {
            var report = t.reflect().report("enter", [], {value: "hello"}, 20)
            var expected = new Report(r("enter"), [], undefined, 20, 75)

            assert.match(report, expected)
        })

        it("correctly creates `enter` reports with slow", function () {
            var report = t.reflect().report("enter", [], {value: "hello"}, null, 10) // eslint-disable-line max-len
            var expected = new Report(r("enter"), [], undefined, 10, 10)

            assert.match(report, expected)
        })

        it("correctly creates `enter` reports with duration + slow", function () { // eslint-disable-line max-len
            var report = t.reflect().report("enter", [], {value: "hello"}, null, 10) // eslint-disable-line max-len
            var expected = new Report(r("enter"), [], undefined, 10, 10)

            assert.match(report, expected)
        })

        it("correctly creates `leave` reports", function () {
            var report = t.reflect().report("leave", [], {value: "hello"})
            var expected = new Report(r("leave"), [], undefined, -1, 0)

            assert.match(report, expected)
        })

        it("correctly creates `pass` reports", function () {
            var report = t.reflect().report("pass", [], {value: "hello"})
            var expected = new Report(r("pass"), [], undefined, 10, 75)

            assert.match(report, expected)
        })

        it("correctly creates `pass` reports with duration", function () {
            var report = t.reflect().report("pass", [], {value: "hello"}, 20)
            var expected = new Report(r("pass"), [], undefined, 20, 75)

            assert.match(report, expected)
        })

        it("correctly creates `pass` reports with slow", function () {
            var report = t.reflect().report("pass", [], {value: "hello"}, null, 10) // eslint-disable-line max-len
            var expected = new Report(r("pass"), [], undefined, 10, 10)

            assert.match(report, expected)
        })

        it("correctly creates `pass` reports with duration + slow", function () { // eslint-disable-line max-len
            var report = t.reflect().report("pass", [], {value: "hello"}, null, 10) // eslint-disable-line max-len
            var expected = new Report(r("pass"), [], undefined, 10, 10)

            assert.match(report, expected)
        })

        it("correctly creates `fail` reports", function () {
            var report = t.reflect().report("fail", [], {value: "hello"})
            var expected = new Report(r("fail"), [], {value: "hello"}, 10, 75)

            assert.match(report, expected)
        })

        it("correctly creates `fail` reports with duration", function () {
            var report = t.reflect().report("fail", [], {value: "hello"}, 20)
            var expected = new Report(r("fail"), [], {value: "hello"}, 20, 75)

            assert.match(report, expected)
        })

        it("correctly creates `fail` reports with slow", function () {
            var report = t.reflect().report("fail", [], {value: "hello"}, null, 10) // eslint-disable-line max-len
            var expected = new Report(r("fail"), [], {value: "hello"}, 10, 10)

            assert.match(report, expected)
        })

        it("correctly creates `fail` reports with duration + slow", function () { // eslint-disable-line max-len
            var report = t.reflect().report("fail", [], {value: "hello"}, null, 10) // eslint-disable-line max-len
            var expected = new Report(r("fail"), [], {value: "hello"}, 10, 10)

            assert.match(report, expected)
        })

        it("correctly creates `skip` reports", function () {
            var report = t.reflect().report("skip", [], {value: "hello"})
            var expected = new Report(r("skip"), [], undefined, -1, 0)

            assert.match(report, expected)
        })

        it("correctly creates `end` reports", function () {
            var report = t.reflect().report("end", [], {value: "hello"})
            var expected = new Report(r("end"), [], undefined, -1, 0)

            assert.match(report, expected)
        })

        it("correctly creates `error` reports", function () {
            var report = t.reflect().report("error", [], {value: "hello"})
            var expected = new Report(r("error"), [], {value: "hello"}, -1, 0)

            assert.match(report, expected)
        })

        it("correctly creates `extra` reports", function () {
            var extra = t.reflect().extra(2, null, "")
            var report = t.reflect().report("extra", [], extra)
            var expected = new Report(r("extra"), [], extra, -1, 0)

            assert.match(report, expected)
        })

        context("type checkers", function () {
            it("correctly identifies `start` reports", function () {
                var report = t.reflect().report("start", [])

                assert.equal(report.start(), true)
                assert.equal(report.enter(), false)
                assert.equal(report.leave(), false)
                assert.equal(report.pass(), false)
                assert.equal(report.fail(), false)
                assert.equal(report.skip(), false)
                assert.equal(report.end(), false)
                assert.equal(report.error(), false)
                assert.equal(report.extra(), false)
            })

            it("correctly identifies `enter` reports", function () {
                var report = t.reflect().report("enter", [])

                assert.equal(report.start(), false)
                assert.equal(report.enter(), true)
                assert.equal(report.leave(), false)
                assert.equal(report.pass(), false)
                assert.equal(report.fail(), false)
                assert.equal(report.skip(), false)
                assert.equal(report.end(), false)
                assert.equal(report.error(), false)
                assert.equal(report.extra(), false)
            })

            it("correctly identifies `leave` reports", function () {
                var report = t.reflect().report("leave", [])

                assert.equal(report.start(), false)
                assert.equal(report.enter(), false)
                assert.equal(report.leave(), true)
                assert.equal(report.pass(), false)
                assert.equal(report.fail(), false)
                assert.equal(report.skip(), false)
                assert.equal(report.end(), false)
                assert.equal(report.error(), false)
                assert.equal(report.extra(), false)
            })

            it("correctly identifies `pass` reports", function () {
                var report = t.reflect().report("pass", [])

                assert.equal(report.start(), false)
                assert.equal(report.enter(), false)
                assert.equal(report.leave(), false)
                assert.equal(report.pass(), true)
                assert.equal(report.fail(), false)
                assert.equal(report.skip(), false)
                assert.equal(report.end(), false)
                assert.equal(report.error(), false)
                assert.equal(report.extra(), false)
            })

            it("correctly identifies `fail` reports", function () {
                var report = t.reflect().report("fail", [])

                assert.equal(report.start(), false)
                assert.equal(report.enter(), false)
                assert.equal(report.leave(), false)
                assert.equal(report.pass(), false)
                assert.equal(report.fail(), true)
                assert.equal(report.skip(), false)
                assert.equal(report.end(), false)
                assert.equal(report.error(), false)
                assert.equal(report.extra(), false)
            })

            it("correctly identifies `skip` reports", function () {
                var report = t.reflect().report("skip", [])

                assert.equal(report.start(), false)
                assert.equal(report.enter(), false)
                assert.equal(report.leave(), false)
                assert.equal(report.pass(), false)
                assert.equal(report.fail(), false)
                assert.equal(report.skip(), true)
                assert.equal(report.end(), false)
                assert.equal(report.error(), false)
                assert.equal(report.extra(), false)
            })

            it("correctly identifies `end` reports", function () {
                var report = t.reflect().report("end", [])

                assert.equal(report.start(), false)
                assert.equal(report.enter(), false)
                assert.equal(report.leave(), false)
                assert.equal(report.pass(), false)
                assert.equal(report.fail(), false)
                assert.equal(report.skip(), false)
                assert.equal(report.end(), true)
                assert.equal(report.error(), false)
                assert.equal(report.extra(), false)
            })

            it("correctly identifies `error` reports", function () {
                var report = t.reflect().report("error", [])

                assert.equal(report.start(), false)
                assert.equal(report.enter(), false)
                assert.equal(report.leave(), false)
                assert.equal(report.pass(), false)
                assert.equal(report.fail(), false)
                assert.equal(report.skip(), false)
                assert.equal(report.end(), false)
                assert.equal(report.error(), true)
                assert.equal(report.extra(), false)
            })

            it("correctly identifies `extra` reports", function () {
                var reflect = t.reflect()
                var report = reflect.report("extra", [],
                    reflect.extra(2, null, ""))

                assert.equal(report.start(), false)
                assert.equal(report.enter(), false)
                assert.equal(report.leave(), false)
                assert.equal(report.pass(), false)
                assert.equal(report.fail(), false)
                assert.equal(report.skip(), false)
                assert.equal(report.end(), false)
                assert.equal(report.error(), false)
                assert.equal(report.extra(), true)
            })
        })

        context("type()", function () {
            it("returns correct value for `start` reports", function () {
                var report = t.reflect().report("start", [])

                assert.match(report.type(), "start")
            })

            it("returns correct value for `enter` reports", function () {
                var report = t.reflect().report("enter", [])

                assert.match(report.type(), "enter")
            })

            it("returns correct value for `leave` reports", function () {
                var report = t.reflect().report("leave", [])

                assert.match(report.type(), "leave")
            })

            it("returns correct value for `pass` reports", function () {
                var report = t.reflect().report("pass", [])

                assert.match(report.type(), "pass")
            })

            it("returns correct value for `fail` reports", function () {
                var report = t.reflect().report("fail", [])

                assert.match(report.type(), "fail")
            })

            it("returns correct value for `skip` reports", function () {
                var report = t.reflect().report("skip", [])

                assert.match(report.type(), "skip")
            })

            it("returns correct value for `end` reports", function () {
                var report = t.reflect().report("end", [])

                assert.match(report.type(), "end")
            })

            it("returns correct value for `error` reports", function () {
                var report = t.reflect().report("error", [])

                assert.match(report.type(), "error")
            })

            it("returns correct value for `extra` reports", function () {
                var reflect = t.reflect()
                var report = reflect.report("extra", [],
                    reflect.extra(2, null, ""))

                assert.match(report.type(), "extra")
            })
        })
    })
})
