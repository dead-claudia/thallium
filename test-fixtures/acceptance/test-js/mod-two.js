"use strict"

const t = require("../../../index.js")

t.test("mod-two", t => {
    t.test("1 === 2").equal(1, 2)

    t.test("expandos don't transfer", t => {
        t.notHasKey(t, "foo")
    })

    t.test("what a fail...").isNope("yep")
})
