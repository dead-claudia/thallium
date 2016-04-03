"use strict"

var t = require("../lib/index.js").t

describe("add()", function () {
    it("exists", function () {
        var tt = t.base()

        t.hasKey(tt, "add")
        t.function(tt.add)
    })

    it("works with string + function", function () {
        var tt = t.base()

        tt.add("foo", /** @this */ function () { return this })
        tt.add("bar", function (x) { return x })
        tt.add("baz", function (_, x) { return x })

        t.equal(tt.foo(), tt)
        t.equal(tt.bar(), tt)

        var obj = {}

        t.equal(tt.baz(obj), obj)
    })

    it("works with object", function () {
        var tt = t.base()

        tt.add({
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
