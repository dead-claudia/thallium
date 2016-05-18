"use strict"

var t = require("../index.js")

describe("wrap()", function () {
    it("exists", function () {
        var tt = t.base()

        t.hasKey(tt, "wrap")
        t.function(tt.wrap)
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
        var tt = t.base()
        var sentinel = {}

        var f1 = tt.f1 = spy(function () {})
        var f2 = tt.f2 = spy(function (x) { t.equal(x, sentinel) })
        var f3 = tt.f3 = spy(/** @this */ function () { t.equal(this, tt) })
        var f4 = tt.f4 = spy(function () {})

        tt.wrap("f1", /** @this */ function () { t.undefined(this) })
        tt.wrap("f2", function (f) { f(sentinel) })
        tt.wrap("f3", function (f) { f() })
        tt.wrap("f4", function (f, x) { return x })

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
        var tt = t.base()
        var sentinel = {}

        var f1 = tt.f1 = spy(function () {})
        var f2 = tt.f2 = spy(function (x) { t.equal(x, sentinel) })
        var f3 = tt.f3 = spy(/** @this */ function () { t.equal(this, tt) })
        var f4 = tt.f4 = spy(function () {})

        tt.wrap({
            f1: function () { t.undefined(this) },
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
