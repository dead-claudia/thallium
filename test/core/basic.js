"use strict"

var t = require("../../index.js")
var createBase = require("../../lib/core.js")

suite("core (basics)", function () {
    test("has `test()`", function () {
        var tt = createBase()
        t.hasKey(tt, "test")
        t.function(tt.test)
    })

    test("can accept a string + function", function () {
        var tt = createBase()
        tt.test("test", function () {})
    })

    test("can accept a string", function () {
        var tt = createBase()
        tt.test("test")
    })

    test("returns the current instance when given a callback", function () {
        var tt = createBase()
        var test = tt.test("test", function () {})
        t.equal(test, tt)
    })

    test("returns a prototypal clone when given a callback", function () {
        var tt = createBase()
        var test = tt.test("test")
        t.notEqual(test, tt)
        t.equal(Object.getPrototypeOf(test), tt)
    })
})
