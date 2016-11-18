"use strict"

var t = require("../..")
var fail = require("../../assert").fail

t.test("cli common", function () {
    t.test("isObjectLike()", function () {
        t.test("passes for objects and functions", fail)
        t.test("fails for other things", fail)
    })

    t.test("resolveDefault()", function () {
        t.test("gets CJS default functions", fail)
        t.test("gets CJS default functions with `default` property", fail)
        t.test("gets CJS default arrays with `default` property", fail)
        t.test("gets CJS default objects", fail)
        t.test("gets CJS default primitives", fail)
        t.test("gets ES6 default functions", fail)
        t.test("gets ES6 default objects", fail)
        t.test("gets ES6 default arrays", fail)
        t.test("gets ES6 default objects with `default` property", fail)
        t.test("gets ES6 default functions with `default` property", fail)
        t.test("gets ES6 default arrays with `default` property", fail)
        t.test("gets ES6 default primitives", fail)
    })

    t.test("normalizeGlob()", function () {
        t.test("current directory", function () {
            t.test("normalizes a file", fail)
            t.test("normalizes a glob", fail)
            t.test("retains trailing slashes", fail)
            t.test("retains negative", fail)
            t.test("retains negative + trailing slashes", fail)
        })

        t.test("absolute directory", function () {
            t.test("normalizes a file", fail)
            t.test("normalizes a glob", fail)
            t.test("retains trailing slashes", fail)
            t.test("retains negative", fail)
            t.test("retains negative + trailing slashes", fail)
        })

        t.test("relative directory", function () {
            t.test("normalizes a file", fail)
            t.test("normalizes a glob", fail)
            t.test("retains trailing slashes", fail)
            t.test("retains negative", fail)
            t.test("retains negative + trailing slashes", fail)
        })

        t.test("edge cases", function () {
            t.test("normalizes `.` with a cwd of `.`", fail)
            t.test("normalizes `..` with a cwd of `.`", fail)
            t.test("normalizes `.` with a cwd of `..`", fail)
            t.test("normalizes directories with a cwd of `..`", fail)
            t.test("removes excess `.`", fail)
            t.test("removes excess `..`", fail)
            t.test("removes excess combined junk", fail)
        })
    })

    t.test("globParent()", function () {
        t.test("strips glob magic to return parent path", fail)
        t.test("returns parent dirname from non-glob paths", fail)
        t.test("gets a base name", fail)
        t.test("gets a base name from a nested glob", fail)
        t.test("gets a base name from a flat file", fail)
        t.test("gets a base name from character class pattern", fail)
        t.test("gets a base name from brace , expansion", fail)
        t.test("gets a base name from brace .. expansion", fail)
        t.test("gets a base name from extglob", fail)
        t.test("gets a base name from a complex brace glob", fail)
    })
})
