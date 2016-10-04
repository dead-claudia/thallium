"use strict"

var Promise = require("bluebird")
var t = require("../../index.js")
var assert = require("../../assert.js")

t.test("mod-one", function (t) {
    t.test("1 === 1").try(assert.equal, 1, 1)

    t.test("foo()", function (t) {
        t.try(assert.notEqual, 1, 1)
    })

    t.async("bar()", function (t, done) {
        global.setTimeout(function () { done(new Error("fail")) }, 0)
    })

    t.async("baz()", function () {
        return Promise.reject(new Error("sentinel"))
    })

    t.test("nested", function (t) {
        t.test("nested 2", function () { assert.equal(true, true) })
    })
})
