import t from "../src/index.js"

suite("add()", () => {
    test("exists", () => {
        const tt = t.base()

        t.hasKey(tt, "add")
        t.function(tt.add)
    })

    test("works with string + function", () => {
        const tt = t.base()

        tt.add("foo", /** @this */ function () { return this })
        tt.add("bar", ttt => ttt)
        tt.add("baz", (_, x) => x)

        t.equal(tt.foo(), tt)
        t.equal(tt.bar(), tt)

        const obj = {}

        t.equal(tt.baz(obj), obj)
    })

    test("works with object", () => {
        const tt = t.base()

        tt.add({
            foo() { return this },
            bar(ttt) { return ttt },
            baz(_, x) { return x },
        })

        t.equal(tt.foo(), tt)
        t.equal(tt.bar(), tt)

        const obj = {}

        t.equal(tt.baz(obj), obj)
    })
})
