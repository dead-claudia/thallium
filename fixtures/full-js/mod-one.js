"use strict"

var Promise = require("bluebird")
var t = require("../../index.js")
var assert = require("../../assert.js")

t.test("mod-one", function (t) {
    t.test("1 === 1").try(assert.equal, 1, 1)

    t.test("foo()", function () {
        assert.notEqual(1, 1)
    })

    t.test("bar()", function () {
        return Promise.delay(0).throw(new Error("fail"))
    })

    t.test("baz()", function () {
        return Promise.reject(new Error("sentinel"))
    })

    t.test("nested", function (t) {
        t.test("nested 2", function () { assert.equal(true, true) })
    })
})
