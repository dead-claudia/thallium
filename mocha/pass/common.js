"use strict"

var t = require("../../index.js")

describe("cli common", function () {
    describe("isObjectLike()", function () {
        it("passes for objects and functions", function () {})
        it("fails for other things", function () {})
    })

    describe("resolveDefault()", function () {
        it("gets CJS default functions", function () {})
        it("gets CJS default functions with `default` property", function () {})  // eslint-disable-line max-len
        it("gets CJS default arrays with `default` property", function () {})  // eslint-disable-line max-len
        it("gets CJS default objects", function () {})
        it("gets CJS default primitives", function () {})
        it("gets ES6 default functions", function () {})
        it("gets ES6 default objects", function () {})
        it("gets ES6 default arrays", function () {})
        it("gets ES6 default objects with `default` property", function () {})  // eslint-disable-line max-len
        it("gets ES6 default functions with `default` property", function () {})  // eslint-disable-line max-len
        it("gets ES6 default arrays with `default` property", function () {})  // eslint-disable-line max-len
        it("gets ES6 default primitives", function () {})
    })

    describe("normalizeGlob()", function () {
        describe("current directory", function () {
            it("normalizes a file", function () {})
            it("normalizes a glob", function () {})
            it("retains trailing slashes", function () {})
            it("retains negative", function () {})
            it("retains negative + trailing slashes", function () {})
        })

        describe("absolute directory", function () {
            it("normalizes a file", function () {})
            it("normalizes a glob", function () {})
            it("retains trailing slashes", function () {})
            it("retains negative", function () {})
            it("retains negative + trailing slashes", function () {})
        })

        describe("relative directory", function () {
            it("normalizes a file", function () {})
            it("normalizes a glob", function () {})
            it("retains trailing slashes", function () {})
            it("retains negative", function () {})
            it("retains negative + trailing slashes", function () {})
        })

        describe("edge cases", function () {
            it("normalizes `.` with a cwd of `.`", function () {})
            it("normalizes `..` with a cwd of `.`", function () {})
            it("normalizes `.` with a cwd of `..`", function () {})
            it("normalizes directories with a cwd of `..`", function () {})
            it("removes excess `.`", function () {})
            it("removes excess `..`", function () {})
            it("removes excess combined junk", function () {})
        })
    })

    describe("globParent()", function () {
        it("strips glob magic to return parent path", function () {})
        it("returns parent dirname from non-glob paths", function () {})
        it("gets a base name", function () {})
        it("gets a base name from a nested glob", function () {})
        it("gets a base name from a flat file", function () {})
        it("gets a base name from character class pattern", function () {})
        it("gets a base name from brace , expansion", function () {})
        it("gets a base name from brace .. expansion", function () {})
        it("gets a base name from extglob", function () {})
        it("gets a base name from a complex brace glob", function () {})
    })
})
