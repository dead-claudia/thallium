"use strict"

var t = require("../../index.js")
var assert = require("../../assert/index.js")

t.test("mod-one", function () {
    t.test("1 === 1", function () {
        assert.equal(1, 1)
    })

    t.test("foo()", function () {
        assert.notEqual(1, 1)
    })

    t.test("bar()", function () {
        return new Promise(function (_, reject) {
            global.setTimeout(function () {
                reject(new Error("fail"))
            }, 0)
        })
    })

    t.test("baz()", function () {
        return Promise.reject(new Error("sentinel"))
    })

    t.test("nested", function () {
        t.test("nested 2", function () { assert.equal(true, true) })
    })
})
