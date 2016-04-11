"use strict"

const t = require("../index.js")

describe("wrap()", () => {
    it("exists", () => {
        const tt = t.base()

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

    it("works with string + function", () => {
        const tt = t.base()
        const sentinel = {}

        const f1 = tt.f1 = spy(() => {})
        const f2 = tt.f2 = spy(x => { t.equal(x, sentinel) })
        const f3 = tt.f3 = spy(/** @this */ function () { t.equal(this, tt) })
        const f4 = tt.f4 = spy(() => {})

        tt.wrap("f1", /** @this */ function () { t.undefined(this) })
        tt.wrap("f2", f => f(sentinel))
        tt.wrap("f3", f => f())
        tt.wrap("f4", (f, x) => x)

        tt.f1()
        t.false(f1.called)

        tt.f2()
        t.true(f2.called)

        tt.f3()
        t.true(f3.called)

        t.equal(tt.f4(sentinel), sentinel)
        t.false(f4.called)
    })

    it("works with object", () => {
        const tt = t.base()
        const sentinel = {}

        const f1 = tt.f1 = spy(() => {})
        const f2 = tt.f2 = spy(x => { t.equal(x, sentinel) })
        const f3 = tt.f3 = spy(/** @this */ function () { t.equal(this, tt) })
        const f4 = tt.f4 = spy(() => {})

        tt.wrap({
            f1() { t.undefined(this) },
            f2(f) { return f(sentinel) },
            f3(f) { return f() },
            f4(f, x) { return x },
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
