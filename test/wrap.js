"use strict"

var t = require("../index.js")
var createBase = require("../lib/core.js")

suite("add", function () {
    test("exists", function () {
        var tt = createBase()
        t.hasKey(tt, "wrap")
        t.function(tt.wrap)
    })

    test("works with string + function", function () {
        var tt = createBase()

        var sentinel = {}

        tt.f1 = function () {}
        tt.f2 = function (x) { t.equal(x, sentinel) }
        tt.f3 = function () { t.equal(this, tt) }
        tt.f4 = function () {}
        tt.f5 = function () {}

        tt.wrap("f1", /** @this */ function () { return this })
        tt.wrap("f2", function (f) { return f(sentinel) })
        tt.wrap("f3", function (f) { return f() })
        tt.wrap("f4", function (f, ctx) { t.equal(ctx, tt) })
        tt.wrap("f5", function (f, ctx, x) { return x })

        t.equal(tt.f1(), tt)
        tt.f2()
        tt.f3()
        tt.f4()
        t.equal(tt.f5(sentinel), sentinel)
    })

    test("works with object", function () {
        var tt = createBase()

        var sentinel = {}

        tt.f1 = function () {}
        tt.f2 = function (x) { t.equal(x, sentinel) }
        tt.f3 = function () { t.equal(this, tt) }
        tt.f4 = function () {}
        tt.f5 = function () {}

        tt.wrap({
            f1: function () { return this },
            f2: function (f) { return f(sentinel) },
            f3: function (f) { return f() },
            f4: function (f, ctx) { t.equal(ctx, tt) },
            f5: function (f, ctx, x) { return x },
        })

        t.equal(tt.f1(), tt)
        tt.f2()
        tt.f3()
        tt.f4()
        t.equal(tt.f5(sentinel), sentinel)
    })
})
