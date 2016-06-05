"use strict"

var t = require("../../index.js")

function fail() {
    t.fail("fail")
}

describe("cli common", function () {
    describe("isObjectLike()", function () {
        it("passes for objects and functions", fail)
        it("fails for other things", fail)
    })

    describe("resolveDefault()", function () {
        it("gets CJS default functions", fail)
        it("gets CJS default functions with `default` property", fail)
        it("gets CJS default arrays with `default` property", fail)
        it("gets CJS default objects", fail)
        it("gets CJS default primitives", fail)
        it("gets ES6 default functions", fail)
        it("gets ES6 default objects", fail)
        it("gets ES6 default arrays", fail)
        it("gets ES6 default objects with `default` property", fail)
        it("gets ES6 default functions with `default` property", fail)
        it("gets ES6 default arrays with `default` property", fail)
        it("gets ES6 default primitives", fail)
    })

    describe("normalizeGlob()", function () {
        describe("current directory", function () {
            it("normalizes a file", fail)
            it("normalizes a glob", fail)
            it("retains trailing slashes", fail)
            it("retains negative", fail)
            it("retains negative + trailing slashes", fail)
        })

        describe("absolute directory", function () {
            it("normalizes a file", fail)
            it("normalizes a glob", fail)
            it("retains trailing slashes", fail)
            it("retains negative", fail)
            it("retains negative + trailing slashes", fail)
        })

        describe("relative directory", function () {
            it("normalizes a file", fail)
            it("normalizes a glob", fail)
            it("retains trailing slashes", fail)
            it("retains negative", fail)
            it("retains negative + trailing slashes", fail)
        })

        describe("edge cases", function () {
            it("normalizes `.` with a cwd of `.`", fail)
            it("normalizes `..` with a cwd of `.`", fail)
            it("normalizes `.` with a cwd of `..`", fail)
            it("normalizes directories with a cwd of `..`", fail)
            it("removes excess `.`", fail)
            it("removes excess `..`", fail)
            it("removes excess combined junk", fail)
        })
    })

    describe("globParent()", function () {
        it("strips glob magic to return parent path", fail)
        it("returns parent dirname from non-glob paths", fail)
        it("gets a base name", fail)
        it("gets a base name from a nested glob", fail)
        it("gets a base name from a flat file", fail)
        it("gets a base name from character class pattern", fail)
        it("gets a base name from brace , expansion", fail)
        it("gets a base name from brace .. expansion", fail)
        it("gets a base name from extglob", fail)
        it("gets a base name from a complex brace glob", fail)
    })
})
