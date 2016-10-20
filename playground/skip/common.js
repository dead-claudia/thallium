"use strict"

var t = require("../../index.js")

t.test("cli common", function () {
    t.test("isObjectLike()", function () {
        t.testSkip("passes for objects and functions")
        t.testSkip("fails for other things")
    })

    t.test("resolveDefault()", function () {
        t.testSkip("gets CJS default functions")
        t.testSkip("gets CJS default functions with `default` property")
        t.testSkip("gets CJS default arrays with `default` property")
        t.testSkip("gets CJS default objects")
        t.testSkip("gets CJS default primitives")
        t.testSkip("gets ES6 default functions")
        t.testSkip("gets ES6 default objects")
        t.testSkip("gets ES6 default arrays")
        t.testSkip("gets ES6 default objects with `default` property")
        t.testSkip("gets ES6 default functions with `default` property")
        t.testSkip("gets ES6 default arrays with `default` property")
        t.testSkip("gets ES6 default primitives")
    })

    t.test("normalizeGlob()", function () {
        t.test("current directory", function () {
            t.testSkip("normalizes a file")
            t.testSkip("normalizes a glob")
            t.testSkip("retains trailing slashes")
            t.testSkip("retains negative")
            t.testSkip("retains negative + trailing slashes")
        })

        t.test("absolute directory", function () {
            t.testSkip("normalizes a file")
            t.testSkip("normalizes a glob")
            t.testSkip("retains trailing slashes")
            t.testSkip("retains negative")
            t.testSkip("retains negative + trailing slashes")
        })

        t.test("relative directory", function () {
            t.testSkip("normalizes a file")
            t.testSkip("normalizes a glob")
            t.testSkip("retains trailing slashes")
            t.testSkip("retains negative")
            t.testSkip("retains negative + trailing slashes")
        })

        t.test("edge cases", function () {
            t.testSkip("normalizes `.` with a cwd of `.`")
            t.testSkip("normalizes `..` with a cwd of `.`")
            t.testSkip("normalizes `.` with a cwd of `..`")
            t.testSkip("normalizes directories with a cwd of `..`")
            t.testSkip("removes excess `.`")
            t.testSkip("removes excess `..`")
            t.testSkip("removes excess combined junk")
        })
    })

    t.test("globParent()", function () {
        t.testSkip("strips glob magic to return parent path")
        t.testSkip("returns parent dirname from non-glob paths")
        t.testSkip("gets a base name")
        t.testSkip("gets a base name from a nested glob")
        t.testSkip("gets a base name from a flat file")
        t.testSkip("gets a base name from character class pattern")
        t.testSkip("gets a base name from brace , expansion")
        t.testSkip("gets a base name from brace .. expansion")
        t.testSkip("gets a base name from extglob")
        t.testSkip("gets a base name from a complex brace glob")
    })
})
