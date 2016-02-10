"use strict"

var t = require("../../index.js")

suite("core (basics)", function () {
    test("has `base()`", function () {
        t.hasKey(t, "base")
        t.equal(t.base().base, t.base)
    })

    test("has `test()`", function () {
        var tt = t.base()
        t.hasKey(tt, "test")
        t.function(tt.test)
    })

    test("can accept a string + function", function () {
        var tt = t.base()
        tt.test("test", function () {})
    })

    test("can accept a string", function () {
        var tt = t.base()
        tt.test("test")
    })

    test("returns the current instance when given a callback", function () {
        var tt = t.base()
        var test = tt.test("test", function () {})
        t.equal(test, tt)
    })

    test("returns a prototypal clone when given a callback", function () {
        var tt = t.base()
        var test = tt.test("test")
        t.notEqual(test, tt)
        t.equal(Object.getPrototypeOf(test), tt)
    })
})
