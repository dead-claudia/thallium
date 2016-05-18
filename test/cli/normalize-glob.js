"use strict"

// Note: updates to this should also be reflected in
// test-fixtures/acceptance/large-coffee/test/normalize-glob.coffee, as it's
// trying to represent more real-world usage.

var t = require("../../index.js")
var path = require("path")
var normalize = require("../../lib/cli/normalize-glob.js")

function p(str) {
    return str.replace(/[\\\/]/g, path.sep)
}

describe("cli normalize glob", function () {
    function test(name, base, results) {
        context(name, function () {
            it("normalizes a file", function () {
                t.equal(normalize(results.file[0], base), p(results.file[1]))
            })

            it("normalizes a glob", function () {
                t.equal(normalize(results.glob[0], base), p(results.glob[1]))
            })

            it("retains trailing slashes", function () {
                t.equal(normalize(results.slash[0], base), p(results.slash[1]))
            })

            it("retains negative", function () {
                t.equal(
                    normalize(results.negate[0], base),
                    p(results.negate[1]))
            })

            it("retains negative + trailing slashes", function () {
                t.equal(
                    normalize(results.negateSlash[0], base),
                    p(results.negateSlash[1]))
            })
        })
    }

    test("current directory", ".", {
        file: ["a", "a"],
        glob: ["a/*.js", "a/*.js"],
        slash: ["a/*/", "a/*/"],
        negate: ["!a/*", "!a/*"],
        negateSlash: ["!a/*/", "!a/*/"],
    })

    test("absolute directory", __dirname, {
        file: ["a", path.resolve(__dirname, "a")],
        glob: ["a/*.js", path.resolve(__dirname, "a/*.js")],
        slash: ["a/*/", path.resolve(__dirname, "a/*") + "/"],
        negate: ["!a/*", "!" + path.resolve(__dirname, "a/*")],
        negateSlash: ["!a/*/", "!" + path.resolve(__dirname, "a/*") + "/"],
    })

    test("relative directory", "foo", {
        file: ["a", "foo/a"],
        glob: ["a/*.js", "foo/a/*.js"],
        slash: ["a/*/", "foo/a/*/"],
        negate: ["!a/*", "!foo/a/*"],
        negateSlash: ["!a/*/", "!foo/a/*/"],
    })

    // Some of these aren't likely to ever show up, but just in case.
    context("edge cases", function () {
        it("normalizes `.` with a cwd of `.`", function () {
            t.equal(normalize(".", "."), ".")
        })

        it("normalizes `..` with a cwd of `.`", function () {
            t.equal(normalize("..", "."), "..")
        })

        it("normalizes `.` with a cwd of `..`", function () {
            t.equal(normalize(".", ".."), "..")
        })

        it("normalizes directories with a cwd of `..`", function () {
            t.equal(normalize("foo/bar", ".."), "../foo/bar")
        })

        it("removes excess `.`", function () {
            t.equal(normalize("././././.", "foo"), "foo")
        })

        it("removes excess `..`", function () {
            t.equal(normalize("foo/../bar/baz/..", "dir"), "dir/bar")
        })

        it("removes excess combined junk", function () {
            t.equal(normalize("foo/./bar/../baz/./what", "."), "foo/baz/what")
        })
    })
})
