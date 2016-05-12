"use strict"

// Note: updates to this should also be reflected in
// test-fixtures/acceptance/large-coffee/test/normalize-glob.coffee, as it's
// trying to represent more real-world usage.

const t = require("../../index.js")
const path = require("path")
const normalize = require("../../lib/cli/normalize-glob.js")

function p(str) {
    return str.replace(/[\\\/]/g, path.sep)
}

describe("cli normalize glob", () => {
    function test(name, base, results) {
        context(name, () => {
            it("normalizes a file", () => {
                t.equal(normalize(results.file[0], base), p(results.file[1]))
            })

            it("normalizes a glob", () => {
                t.equal(normalize(results.glob[0], base), p(results.glob[1]))
            })

            it("retains trailing slashes", () => {
                t.equal(normalize(results.slash[0], base), p(results.slash[1]))
            })

            it("retains negative", () => {
                t.equal(
                    normalize(results.negate[0], base),
                    p(results.negate[1]))
            })

            it("retains negative + trailing slashes", () => {
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
        slash: ["a/*/", `${path.resolve(__dirname, "a/*")}/`],
        negate: ["!a/*", `!${path.resolve(__dirname, "a/*")}`],
        negateSlash: ["!a/*/", `!${path.resolve(__dirname, "a/*")}/`],
    })

    test("relative directory", "foo", {
        file: ["a", "foo/a"],
        glob: ["a/*.js", "foo/a/*.js"],
        slash: ["a/*/", "foo/a/*/"],
        negate: ["!a/*", "!foo/a/*"],
        negateSlash: ["!a/*/", "!foo/a/*/"],
    })

    // Some of these aren't likely to ever show up, but just in case.
    context("edge cases", () => {
        it("normalizes `.` with a cwd of `.`", () => {
            t.equal(normalize(".", "."), ".")
        })

        it("normalizes `..` with a cwd of `.`", () => {
            t.equal(normalize("..", "."), "..")
        })

        it("normalizes `.` with a cwd of `..`", () => {
            t.equal(normalize(".", ".."), "..")
        })

        it("normalizes directories with a cwd of `..`", () => {
            t.equal(normalize("foo/bar", ".."), "../foo/bar")
        })

        it("removes excess `.`", () => {
            t.equal(normalize("././././.", "foo"), "foo")
        })

        it("removes excess `..`", () => {
            t.equal(normalize("foo/../bar/baz/..", "dir"), "dir/bar")
        })

        it("removes excess combined junk", () => {
            t.equal(normalize("foo/./bar/../baz/./what", "."), "foo/baz/what")
        })
    })
})
