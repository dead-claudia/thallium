"use strict"

const t = require("../../../index.js")

t.test("mod-one", t => {
    t.test("1 === 1").equal(1, 1)

    t.test("foo()", t => {
        t.notEqual(1, 1)
    })

    t.async("bar()", (t, done) => {
        setTimeout(() => done(new Error("fail")), 0)
    })

    t.async("baz()", () => Promise.reject(new Error("sentinel")))

    t.test("nested", t => {
        t.test("nested 2", tt => tt.true(true))
    })
})
