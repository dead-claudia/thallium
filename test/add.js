"use strict"

var t = require("../index.js")

suite("add", function () {
    test("exists", function () {
        var tt = t.base()
        t.hasKey(tt, "add")
        t.function(tt.add)
    })

    test("works with string + function", function () {
        var tt = t.base()

        tt.add("foo", /** @this */ function () { return this })
        tt.add("bar", function (ttt) { return ttt })
        tt.add("baz", function (_, x) { return x })

        t.equal(tt.foo(), tt)
        t.equal(tt.bar(), tt)

        var obj = {}
        t.equal(tt.baz(obj), obj)
    })

    test("works with object", function () {
        var tt = t.base()

        tt.add({
            foo: function () { return this },
            bar: function (ttt) { return ttt },
            baz: function (_, x) { return x },
        })

        t.equal(tt.foo(), tt)
        t.equal(tt.bar(), tt)

        var obj = {}
        t.equal(tt.baz(obj), obj)
    })
})
