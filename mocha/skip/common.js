"use strict"

var t = require("../../index.js")

describe("cli common", function () {
    describe("isObjectLike()", function () {
        it("passes for objects and functions")
        it("fails for other things")
    })

    describe("resolveDefault()", function () {
        it("gets CJS default functions")
        it("gets CJS default functions with `default` property")
        it("gets CJS default arrays with `default` property")
        it("gets CJS default objects")
        it("gets CJS default primitives")
        it("gets ES6 default functions")
        it("gets ES6 default objects")
        it("gets ES6 default arrays")
        it("gets ES6 default objects with `default` property")
        it("gets ES6 default functions with `default` property")
        it("gets ES6 default arrays with `default` property")
        it("gets ES6 default primitives")
    })

    describe("normalizeGlob()", function () {
        describe("current directory", function () {
            it("normalizes a file")
            it("normalizes a glob")
            it("retains trailing slashes")
            it("retains negative")
            it("retains negative + trailing slashes")
        })

        describe("absolute directory", function () {
            it("normalizes a file")
            it("normalizes a glob")
            it("retains trailing slashes")
            it("retains negative")
            it("retains negative + trailing slashes")
        })

        describe("relative directory", function () {
            it("normalizes a file")
            it("normalizes a glob")
            it("retains trailing slashes")
            it("retains negative")
            it("retains negative + trailing slashes")
        })

        describe("edge cases", function () {
            it("normalizes `.` with a cwd of `.`")
            it("normalizes `..` with a cwd of `.`")
            it("normalizes `.` with a cwd of `..`")
            it("normalizes directories with a cwd of `..`")
            it("removes excess `.`")
            it("removes excess `..`")
            it("removes excess combined junk")
        })
    })

    describe("globParent()", function () {
        it("strips glob magic to return parent path")
        it("returns parent dirname from non-glob paths")
        it("gets a base name")
        it("gets a base name from a nested glob")
        it("gets a base name from a flat file")
        it("gets a base name from character class pattern")
        it("gets a base name from brace , expansion")
        it("gets a base name from brace .. expansion")
        it("gets a base name from extglob")
        it("gets a base name from a complex brace glob")
    })
})
