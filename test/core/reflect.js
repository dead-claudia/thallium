"use strict"

/* eslint max-nested-callbacks: [2, 5] */

var t = require("../../index.js")
var Util = require("../../helpers/base.js")
var n = Util.n
var p = Util.p

describe("core (reflect)", function () {
    describe("methods()", function () {
        it("exists", function () {
            t.function(t.reflect().methods)
        })

        it("returns the correct methods", function () {
            var base = t.reflect().base()

            t.equal(base.reflect().methods(), base)
        })

        it("returns the correct methods in an inner inline test", function () {
            var tt = t.reflect().base()
            var inner = tt.test("test")
            var reflect = inner.reflect().methods()

            t.equal(reflect, inner)
        })

        it("returns the correct methods in an inner block test", function () {
            var tt = t.reflect().base()
            var inner, reflect

            tt.test("test", function (tt) {
                inner = tt
                reflect = tt.reflect().methods()
            })

            return tt.run().then(function () {
                t.equal(reflect, inner)
            })
        })

        it("returns the correct methods in an inner async test", function () {
            var tt = t.reflect().base()
            var inner, reflect

            tt.async("test", function (tt, done) {
                inner = tt
                reflect = tt.reflect().methods()
                return done()
            })

            return tt.run().then(function () {
                t.equal(reflect, inner)
            })
        })

        it("returns the correct methods from a previously run test", function () { // eslint-disable-line max-len
            var tt = t.reflect().base()
            var inner = tt.test("test")

            return tt.run().then(function () {
                t.equal(inner.reflect().methods(), inner)
            })
        })
    })

    describe("do()", function () {
        it("exists", function () {
            t.function(t.reflect().do)
        })

        it("runs blocks in sync tests", function () {
            var tt = t.reflect().base()
            var ret = []
            var len, self // eslint-disable-line consistent-this

            tt.reporter(Util.push(ret))

            tt.test("test", function (tt) {
                tt.reflect().do(/** @this */ function () {
                    len = arguments.length
                    self = this
                })
            })

            return tt.run().then(function () {
                t.undefined(self)
                t.equal(len, 0)
                t.match(ret, [
                    n("start", []),
                    n("pass", [p("test", 0)]),
                    n("end", []),
                ])
            })
        })

        it("propagates errors from blocks in sync tests", function () {
            var tt = t.reflect().base()
            var ret = []
            var sentinel = new Error("sentinel")

            sentinel.marker = function () {}

            tt.reporter(Util.push(ret))

            tt.test("test", function (tt) {
                tt.reflect().do(function () { throw sentinel })
            })

            return tt.run().then(function () {
                t.match(ret, [
                    n("start", []),
                    n("fail", [p("test", 0)], sentinel),
                    n("end", []),
                ])
            })
        })

        it("runs blocks in async tests", function () {
            var tt = t.reflect().base()
            var ret = []
            var len, self // eslint-disable-line consistent-this

            tt.reporter(Util.push(ret))

            tt.async("test", function (tt, done) {
                tt.reflect().do(/** @this */ function () {
                    len = arguments.length
                    self = this
                })

                done()
            })

            return tt.run().then(function () {
                t.undefined(self)
                t.equal(len, 0)
                t.match(ret, [
                    n("start", []),
                    n("pass", [p("test", 0)]),
                    n("end", []),
                ])
            })
        })

        it("propagates errors from blocks in async tests", function () {
            var tt = t.reflect().base()
            var ret = []
            var sentinel = new Error("sentinel")

            sentinel.marker = function () {}

            tt.reporter(Util.push(ret))

            tt.async("test", function (tt, done) {
                tt.reflect().do(function () { throw sentinel })
                done()
            })

            return tt.run().then(function () {
                t.match(ret, [
                    n("start", []),
                    n("fail", [p("test", 0)], sentinel),
                    n("end", []),
                ])
            })
        })

        it("runs blocks in inline sync tests", function () {
            var tt = t.reflect().base()
            var ret = []
            var len, self // eslint-disable-line consistent-this

            tt.reporter(Util.push(ret))

            tt.test("test").reflect().do(/** @this */ function () {
                len = arguments.length
                self = this
            })

            return tt.run().then(function () {
                t.undefined(self)
                t.equal(len, 0)
                t.match(ret, [
                    n("start", []),
                    n("pass", [p("test", 0)]),
                    n("end", []),
                ])
            })
        })

        it("propagates errors from blocks in inline sync tests", function () {
            var tt = t.reflect().base()
            var ret = []
            var sentinel = new Error("sentinel")

            sentinel.marker = function () {}

            tt.reporter(Util.push(ret))

            tt.test("test").reflect().do(function () { throw sentinel })

            return tt.run().then(function () {
                t.match(ret, [
                    n("start", []),
                    n("fail", [p("test", 0)], sentinel),
                    n("end", []),
                ])
            })
        })
    })

    function testDefine(define) {
        it("works with string + function", function () {
            var AssertionError = t.reflect().AssertionError
            var tt = t.reflect().base()
            var self // eslint-disable-line consistent-this

            define(tt, "assert", /** @this */ function (test, exp, act) {
                self = this
                return {
                    test: test,
                    expected: exp,
                    actual: act,
                    message: "{expected} :: {actual}",
                }
            })

            tt.assert(true, {}, {})
            t.undefined(self)

            var expected = {}
            var actual = {}

            try {
                tt.assert(false, expected, actual)
            } catch (e) {
                t.undefined(self)
                t.instanceof(e, AssertionError)
                t.hasKeys(e, {
                    expected: expected,
                    actual: actual,
                    message: "{} :: {}",
                })
                return
            }

            throw new AssertionError("Expected tt.assert to throw an error")
        })

        it("works with object", function () {
            var AssertionError = t.reflect().AssertionError
            var tt = t.reflect().base()
            var self // eslint-disable-line consistent-this

            define(tt, {
                assert: function (test, exp, act) {
                    self = this
                    return {
                        test: test,
                        expected: exp,
                        actual: act,
                        message: "{expected} :: {actual}",
                    }
                },
            })

            tt.assert(true, {}, {})
            t.undefined(self)

            var expected = {}
            var actual = {}

            try {
                tt.assert(false, expected, actual)
            } catch (e) {
                t.undefined(self)
                t.instanceof(e, AssertionError)
                t.hasKeys(e, {
                    expected: expected,
                    actual: actual,
                    message: "{} :: {}",
                })
                return
            }

            throw new AssertionError("Expected tt.assert to throw an error")
        })

        it("interpolates arbitrary properties in the message", function () {
            var AssertionError = t.reflect().AssertionError
            var tt = t.reflect().base()

            define(tt, "assert", function (test, extra) {
                return {
                    test: test,
                    extra: extra,
                    message: "{extra}",
                }
            })

            try {
                tt.assert(false, "message")
            } catch (e) {
                t.instanceof(e, AssertionError)
                t.hasKeys(e, {
                    expected: undefined,
                    actual: undefined,
                    message: "'message'",
                })
                return
            }

            throw new AssertionError("Expected tt.assert to throw an error")
        })
    }

    describe("define()", function () {
        context("on base", function () {
            it("exists", function () {
                t.function(t.reflect().base().define)
            })

            testDefine(function (tt, name, func) {
                tt.define(name, func)
            })
        })

        context("on reflect", function () {
            it("exists", function () {
                t.function(t.reflect().define)
            })

            testDefine(function (tt, name, func) {
                tt.reflect().define(name, func)
            })
        })
    })

    describe("wrap()", function () {
        it("exists", function () {
            t.function(t.reflect().wrap)
        })

        function spy(f) {
            /** @this */ function g() {
                g.called = true
                return f.apply(this, arguments)
            }

            g.called = false
            return g
        }

        it("works with string + function", function () {
            var tt = t.reflect().base()
            var r = tt.reflect()
            var sentinel = {}

            var f1 = tt.f1 = spy(function () {})
            var f2 = tt.f2 = spy(function (x) { t.equal(x, sentinel) })
            var f3 = tt.f3 = spy(/** @this */ function () { t.equal(this, tt) })
            var f4 = tt.f4 = spy(function () {})

            r.wrap("f1", /** @this */ function () { t.equal(this, tt) })
            r.wrap("f2", function (f) { f(sentinel) })
            r.wrap("f3", function (f) { f() })
            r.wrap("f4", function (f, x) { return x })

            tt.f1()
            t.false(f1.called)

            tt.f2()
            t.true(f2.called)

            tt.f3()
            t.true(f3.called)

            t.equal(tt.f4(sentinel), sentinel)
            t.false(f4.called)
        })

        it("works with object", function () {
            var tt = t.reflect().base()
            var sentinel = {}

            var f1 = tt.f1 = spy(function () {})
            var f2 = tt.f2 = spy(function (x) { t.equal(x, sentinel) })
            var f3 = tt.f3 = spy(/** @this */ function () { t.equal(this, tt) })
            var f4 = tt.f4 = spy(function () {})

            tt.reflect().wrap({
                f1: function () { t.equal(this, tt) },
                f2: function (f) { return f(sentinel) },
                f3: function (f) { return f() },
                f4: function (f, x) { return x },
            })

            tt.f1()
            t.false(f1.called)

            tt.f2()
            t.true(f2.called)

            tt.f3()
            t.true(f3.called)

            t.equal(tt.f4(sentinel), sentinel)
            t.false(f4.called)
        })
    })

    describe("add()", function () {
        it("exists", function () {
            t.function(t.reflect().add)
        })

        it("works with string + function", function () {
            var tt = t.reflect().base()
            var r = tt.reflect()

            r.add("foo", /** @this */ function () { return this })
            r.add("bar", function (x) { return x })
            r.add("baz", function (_, x) { return x })

            t.equal(tt.foo(), tt)
            t.equal(tt.bar(), tt)

            var obj = {}

            t.equal(tt.baz(obj), obj)
        })

        it("works with object", function () {
            var tt = t.reflect().base()

            tt.reflect().add({
                foo: function () { return this },
                bar: function (x) { return x },
                baz: function (_, x) { return x },
            })

            t.equal(tt.foo(), tt)
            t.equal(tt.bar(), tt)

            var obj = {}

            t.equal(tt.baz(obj), obj)
        })
    })

    describe("checkInit()", function () {
        it("exists", function () {
            t.function(t.reflect().checkInit)
        })

        it("catches errors correctly", function () {
            var inner

            return t.reflect().base()
            .test("foo", function (tt) {
                inner = tt
            })
            .run().then(function () {
                t.throws(function () { inner.reflect().checkInit() },
                    ReferenceError)
            })
        })
    })

    describe("runnable()", function () {
        it("exists", function () {
            t.function(t.reflect().runnable)
        })

        it("checks roots", function () {
            t.false(t.reflect().base().reflect().runnable())
        })

        it("checks inline normal tests", function () {
            var tt = t.reflect().base()

            t.false(tt.test("test").reflect().runnable())
        })

        it("checks inline skipped tests", function () {
            var tt = t.reflect().base()

            t.true(tt.testSkip("test").reflect().runnable())
        })

        it("checks block normal tests", function () {
            var tt = t.reflect().base()
            var runnable

            tt.test("test", function (tt) {
                runnable = tt.reflect().runnable()
            })

            return tt.run().then(function () {
                t.false(runnable)
            })
        })

        it("misses block skipped tests", function () {
            var tt = t.reflect().base()
            var runnable

            tt.testSkip("test", function (tt) {
                runnable = tt.reflect().runnable()
            })

            return tt.run().then(function () {
                t.undefined(runnable)
            })
        })

        it("checks whitelisted `.only()` inline tests", function () {
            var tt = t.reflect().base()

            tt.only(["test"])
            t.false(tt.test("test").reflect().runnable())
        })

        it("checks non-whitelisted `.only()` inline tests", function () {
            var tt = t.reflect().base()

            tt.only(["nope"])
            t.true(tt.test("test").reflect().runnable())
        })

        it("checks whitelisted `.only()` block tests", function () {
            var tt = t.reflect().base()
            var runnable

            tt.only(["test"])

            tt.test("test", function (tt) {
                runnable = tt.reflect().runnable()
            })

            return tt.run().then(function () {
                t.false(runnable)
            })
        })

        it("misses non-whitelisted `.only()` block tests", function () {
            var tt = t.reflect().base()
            var runnable

            tt.only(["nope"])

            tt.test("test", function (tt) {
                runnable = tt.reflect().runnable()
            })

            return tt.run().then(function () {
                t.undefined(runnable)
            })
        })
    })

    describe("skipped()", function () {
        it("exists", function () {
            t.function(t.reflect().skipped)
        })

        it("checks roots", function () {
            t.false(t.reflect().base().reflect().skipped())
        })

        it("checks inline normal tests", function () {
            var tt = t.reflect().base()

            t.false(tt.test("test").reflect().skipped())
        })

        it("checks inline skipped tests", function () {
            var tt = t.reflect().base()

            t.true(tt.testSkip("test").reflect().skipped())
        })

        it("checks block normal tests", function () {
            var tt = t.reflect().base()
            var skipped

            tt.test("test", function (tt) {
                skipped = tt.reflect().skipped()
            })

            return tt.run().then(function () {
                t.false(skipped)
            })
        })

        it("misses block skipped tests", function () {
            var tt = t.reflect().base()
            var skipped

            tt.testSkip("test", function (tt) {
                skipped = tt.reflect().skipped()
            })

            return tt.run().then(function () {
                t.undefined(skipped)
            })
        })

        it("checks whitelisted `.only()` inline tests", function () {
            var tt = t.reflect().base()

            tt.only(["test"])
            t.false(tt.test("test").reflect().skipped())
        })

        it("checks non-whitelisted `.only()` inline tests", function () {
            var tt = t.reflect().base()

            tt.only(["nope"])
            t.false(tt.test("test").reflect().skipped())
        })

        it("checks whitelisted `.only()` block tests", function () {
            var tt = t.reflect().base()
            var skipped

            tt.only(["test"])

            tt.test("test", function (tt) {
                skipped = tt.reflect().skipped()
            })

            return tt.run().then(function () {
                t.false(skipped)
            })
        })

        it("misses non-whitelisted `.only()` block tests", function () {
            var tt = t.reflect().base()
            var skipped

            tt.only(["nope"])

            tt.test("test", function (tt) {
                skipped = tt.reflect().skipped()
            })

            return tt.run().then(function () {
                t.undefined(skipped)
            })
        })
    })
})
