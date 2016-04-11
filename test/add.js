"use strict"

const t = require("../index.js")

describe("add()", () => {
    it("exists", () => {
        const tt = t.base()

        t.hasKey(tt, "add")
        t.function(tt.add)
    })

    it("works with string + function", () => {
        const tt = t.base()

        tt.add("foo", /** @this */ function () { return this })
        tt.add("bar", x => x)
        tt.add("baz", (_, x) => x)

        t.equal(tt.foo(), tt)
        t.equal(tt.bar(), tt)

        const obj = {}

        t.equal(tt.baz(obj), obj)
    })

    it("works with object", () => {
        const tt = t.base()

        tt.add({
            foo() { return this },
            bar(x) { return x },
            baz(_, x) { return x },
        })

        t.equal(tt.foo(), tt)
        t.equal(tt.bar(), tt)

        const obj = {}

        t.equal(tt.baz(obj), obj)
    })
})
