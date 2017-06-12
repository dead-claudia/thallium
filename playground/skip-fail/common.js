"use strict"

var t = require("thallium")
var assert = require("thallium/assert")

function fail() {
    assert.match(
        {propertyOne: 1, propertyTwo: 2, propertyThree: 5, propertyFour: 4},
        {propertyOne: 1, propertyTwo: 2, propertyThree: 3, propertyFour: 4}
    )
}

function skip() {
    t.skip()
}

t.test("cli common", function () {
    t.test("isObjectLike()", function () {
        t.test("passes for objects and functions", skip)
        t.test("fails for other things", skip)
    })

    t.test("resolveDefault()", function () {
        t.test("gets CJS default functions", skip)
        t.test("gets CJS default functions with `default` property", skip)
        t.test("gets CJS default arrays with `default` property", skip)
        t.test("gets CJS default objects", skip)
        t.test("gets CJS default primitives", skip)
        t.test("gets ES6 default functions", skip)
        t.test("gets ES6 default objects", skip)
        t.test("gets ES6 default arrays", skip)
        t.test("gets ES6 default objects with `default` property", fail)
        t.test("gets ES6 default functions with `default` property", fail)
        t.test("gets ES6 default arrays with `default` property", fail)
        t.test("gets ES6 default primitives", skip)
    })

    t.test("normalizeGlob()", function () {
        t.test("current directory", function () {
            t.test("normalizes a file", skip)
            t.test("normalizes a glob", skip)
            t.test("retains trailing slashes", skip)
            t.test("retains negative", skip)
            t.test("retains negative + trailing slashes", skip)
        })

        t.test("absolute directory", function () {
            t.test("normalizes a file", skip)
            t.test("normalizes a glob", skip)
            t.test("retains trailing slashes", skip)
            t.test("retains negative", skip)
            t.test("retains negative + trailing slashes", skip)
        })

        t.test("relative directory", function () {
            t.test("normalizes a file", skip)
            t.test("normalizes a glob", skip)
            t.test("retains trailing slashes", skip)
            t.test("retains negative", skip)
            t.test("retains negative + trailing slashes", skip)
        })

        t.test("edge cases", function () {
            t.test("normalizes `.` with a cwd of `.`", skip)
            t.test("normalizes `..` with a cwd of `.`", skip)
            t.test("normalizes `.` with a cwd of `..`", skip)
            t.test("normalizes directories with a cwd of `..`", fail)
            t.test("removes excess `.`", skip)
            t.test("removes excess `..`", skip)
            t.test("removes excess combined junk", skip)
        })
    })

    t.test("globParent()", function () {
        t.test("strips glob magic to return parent path", skip)
        t.test("returns parent dirname from non-glob paths", skip)
        t.test("gets a base name", skip)
        t.test("gets a base name from a nested glob", skip)
        t.test("gets a base name from a flat file", skip)
        t.test("gets a base name from character class pattern", skip)
        t.test("gets a base name from brace , expansion", skip)
        t.test("gets a base name from brace .. expansion", skip)
        t.test("gets a base name from extglob", fail)
        t.test("gets a base name from a complex brace glob", fail)
    })
})
