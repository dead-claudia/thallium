"use strict"

// Note: updates to isObjectLike(), resolveDefault(), normalizeGlob(), and
// globParent() must be reflected in fixtures/mid-coffee/test/common.coffee, as
// it's trying to represent more real-world usage. The rest don't need ported
// over.

var t = require("../../index.js")
var path = require("path")
var Common = require("../../lib/cli/common.js")

function p(str) {
    return str.replace(/[\\\/]/g, path.sep)
}

describe("cli common", function () {
    describe("isObjectLike()", function () {
        var isObjectLike = Common.isObjectLike

        it("passes for objects and functions", function () {
            t.true(isObjectLike({}))
            t.true(isObjectLike([]))
            t.true(isObjectLike(function () {}))
        })

        it("fails for other things", function () {
            t.false(isObjectLike(""))
            t.false(isObjectLike("foo"))
            t.false(isObjectLike(true))
            t.false(isObjectLike(false))
            t.false(isObjectLike(0))
            t.false(isObjectLike(1))
            t.false(isObjectLike(NaN))
            t.false(isObjectLike(null))
            t.false(isObjectLike(undefined))
            t.false(isObjectLike())
            if (typeof Symbol === "function") t.false(isObjectLike(Symbol())) // eslint-disable-line no-undef, max-len
        })
    })

    describe("resolveDefault()", function () {
        var resolveDefault = Common.resolveDefault

        it("gets CJS default functions", function () {
            function f() {}

            t.equal(f, resolveDefault(f))
        })

        it("gets CJS default functions with `default` property", function () {
            function f() {}
            f.default = "foo"

            t.equal(f, resolveDefault(f))
        })

        it("gets CJS default arrays with `default` property", function () {
            var array = []

            array.default = "foo"
            t.equal(array, resolveDefault(array))
        })

        it("gets CJS default objects", function () {
            var obj = {}

            t.equal(obj, resolveDefault(obj))
        })

        it("gets CJS default primitives", function () {
            t.equal("", resolveDefault(""))
            t.equal("foo", resolveDefault("foo"))
            t.equal(true, resolveDefault(true))
            t.equal(false, resolveDefault(false))
            t.equal(0, resolveDefault(0))
            t.equal(1, resolveDefault(1))
            t.equal(NaN, resolveDefault(NaN))
            t.equal(null, resolveDefault(null))
            t.equal(undefined, resolveDefault(undefined))
            t.equal(undefined, resolveDefault())

            if (typeof Symbol === "function") { // eslint-disable-line no-undef
                var sym = Symbol() // eslint-disable-line no-undef

                t.equal(sym, resolveDefault(sym))
            }
        })

        it("gets ES6 default functions", function () {
            function f() {}

            t.equal(f, resolveDefault({default: f}))
        })

        it("gets ES6 default objects", function () {
            var obj = {}

            t.equal(obj, resolveDefault({default: obj}))
        })

        it("gets ES6 default arrays", function () {
            var array = []

            t.equal(array, resolveDefault({default: array}))
        })

        it("gets ES6 default objects with `default` property", function () {
            var obj = {default: {}}

            t.equal(obj, resolveDefault({default: obj}))
        })

        it("gets ES6 default functions with `default` property", function () {
            function f() {}
            f.default = "foo"

            t.equal(f, resolveDefault({default: f}))
        })

        it("gets ES6 default arrays with `default` property", function () {
            var array = []

            array.default = "foo"
            t.equal(array, resolveDefault({default: array}))
        })

        it("gets ES6 default primitives", function () {
            t.equal("", resolveDefault({default: ""}))
            t.equal("foo", resolveDefault({default: "foo"}))
            t.equal(true, resolveDefault({default: true}))
            t.equal(false, resolveDefault({default: false}))
            t.equal(0, resolveDefault({default: 0}))
            t.equal(1, resolveDefault({default: 1}))
            t.equal(NaN, resolveDefault({default: NaN}))
            t.equal(null, resolveDefault({default: null}))
            t.equal(undefined, resolveDefault({default: undefined}))

            if (typeof Symbol === "function") { // eslint-disable-line no-undef
                var sym = Symbol() // eslint-disable-line no-undef

                t.equal(sym, resolveDefault({default: sym}))
            }
        })
    })

    describe("normalizeGlob()", function () {
        var normalizeGlob = Common.normalizeGlob

        function test(name, base, res) {
            context(name, function () {
                it("normalizes a file", function () {
                    t.equal(normalizeGlob(res.file[0], base), p(res.file[1]))
                })

                it("normalizes a glob", function () {
                    t.equal(normalizeGlob(res.glob[0], base), p(res.glob[1]))
                })

                it("retains trailing slashes", function () {
                    t.equal(normalizeGlob(res.slash[0], base), p(res.slash[1]))
                })

                it("retains negative", function () {
                    t.equal(
                        normalizeGlob(res.negate[0], base),
                        p(res.negate[1]))
                })

                it("retains negative + trailing slashes", function () {
                    t.equal(
                        normalizeGlob(res.negateSlash[0], base),
                        p(res.negateSlash[1]))
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
                t.equal(normalizeGlob(".", "."), ".")
            })

            it("normalizes `..` with a cwd of `.`", function () {
                t.equal(normalizeGlob("..", "."), "..")
            })

            it("normalizes `.` with a cwd of `..`", function () {
                t.equal(normalizeGlob(".", ".."), "..")
            })

            it("normalizes directories with a cwd of `..`", function () {
                t.equal(normalizeGlob("foo/bar", ".."), "../foo/bar")
            })

            it("removes excess `.`", function () {
                t.equal(normalizeGlob("././././.", "foo"), "foo")
            })

            it("removes excess `..`", function () {
                t.equal(normalizeGlob("foo/../bar/baz/..", "dir"), "dir/bar")
            })

            it("removes excess combined junk", function () {
                t.equal(normalizeGlob("foo/./bar/../baz/./what", "."),
                    "foo/baz/what")
            })
        })
    })

    describe("globParent()", function () {
        var gp = Common.globParent

        it("strips glob magic to return parent path", function () {
            t.equal(gp("path/to/*.js"), "path/to")
            t.equal(gp("/root/path/to/*.js"), "/root/path/to")
            t.equal(gp("/*.js"), "/")
            t.equal(gp("*.js"), ".")
            t.equal(gp("**/*.js"), ".")
            t.equal(gp("path/{to,from}"), "path")
            t.equal(gp("path/!(to|from)"), "path")
            t.equal(gp("path/?(to|from)"), "path")
            t.equal(gp("path/+(to|from)"), "path")
            t.equal(gp("path/*(to|from)"), "path")
            t.equal(gp("path/@(to|from)"), "path")
            t.equal(gp("path/**/*"), "path")
            t.equal(gp("path/**/subdir/foo.*"), "path")
        })

        it("returns parent dirname from non-glob paths", function () {
            t.equal(gp("path/foo/bar.js"), "path/foo")
            t.equal(gp("path/foo/"), "path/foo")
            t.equal(gp("path/foo"), "path")
        })

        it("gets a base name", function () {
            t.equal(gp("js/*.js") + "/", "js/")
        })

        it("gets a base name from a nested glob", function () {
            t.equal(gp("js/**/test/*.js") + "/", "js/")
        })

        it("gets a base name from a flat file", function () {
            t.equal(gp("js/test/wow.js") + "/", "js/test/")
        })

        it("gets a base name from character class pattern", function () {
            t.equal(gp("js/t[a-z]st}/*.js") + "/", "js/")
        })

        it("gets a base name from brace , expansion", function () {
            t.equal(gp("js/{src,test}/*.js") + "/", "js/")
        })

        it("gets a base name from brace .. expansion", function () {
            t.equal(gp("js/test{0..9}/*.js") + "/", "js/")
        })

        it("gets a base name from extglob", function () {
            t.equal(gp("js/t+(wo|est)/*.js") + "/", "js/")
        })

        it("gets a base name from a complex brace glob", function () {
            t.equal(gp("lib/{components,pages}/**/{test,another}/*.txt") + "/",
                "lib/")
            t.equal(gp("js/test/**/{images,components}/*.js") + "/", "js/test/")
            t.equal(gp("ooga/{booga,sooga}/**/dooga/{eooga,fooga}") + "/",
                "ooga/")
        })
    })

    context("validate()", function () {
        function valid(name, config) {
            it(name + " is valid", function () { Common.validate(config) })
        }

        function invalid(name, config) {
            it(name + " is invalid", function () {
                t.throws(function () { Common.validate(config) }, TypeError)
            })
        }

        valid("empty object", {})

        describe("module", function () {
            valid("string", {module: "foo"})
            invalid("number", {module: 1})
            invalid("true", {module: true})
            invalid("false", {module: false})
            invalid("null", {module: null})
            invalid("object", {module: {}})
            invalid("array", {module: []})
        })

        describe("thallium", function () {
            // Just treat any object as a duck. If it blows up in their face, it
            // should hopefully be obvious why.
            valid("object", {thallium: {}})
            invalid("string", {thallium: "foo"})
            invalid("number", {thallium: 1})
            invalid("true", {thallium: true})
            invalid("false", {thallium: false})
            invalid("null", {thallium: null})
            invalid("array", {thallium: []})
        })

        describe("files", function () {
            valid("[\"test/**\"]", {files: ["test/**"]})
            valid("[\"what???!:\\n\"]", {files: ["what???!:\n"]})
            valid("[]", {files: []})
            valid("string", {files: "test/**"})
            invalid("number", {files: 1})
            invalid("true", {files: true})
            invalid("false", {files: false})
            invalid("null", {files: null})
            invalid("object", {files: {}})
            invalid("[number]", {files: [1]})
            invalid("[true]", {files: [true]})
            invalid("[false]", {files: [false]})
            invalid("[null]", {files: [null]})
            invalid("[object]", {files: [{}]})
        })
    })

    context("merge()", function () {
        function load(opts) {
            return function (name) {
                t.equal(name, opts.module || "thallium")
                return opts.thallium || {}
            }
        }

        function merge(files, config, load) {
            return Common.merge(files, config, load, ".")
        }

        it("merges an empty object", function () {
            var thallium = {thallium: true}
            var files = ["test/**"]
            var config = merge(files, {}, load({thallium: thallium}))

            t.match(config, {thallium: thallium, files: files})
            t.equal(config.thallium, thallium)
        })

        it("merges `module`", function () {
            var thallium = {thallium: true}
            var module = "./some-thallium-wrapper"
            var files = ["test/**"]
            var config = merge(files, {module: module}, load({
                module: module,
                thallium: thallium,
            }))

            t.match(config, {thallium: thallium, files: files})
            t.equal(config.thallium, thallium)
        })

        it("merges `thallium`", function () {
            var thallium = {thallium: true}
            var files = ["test/**"]
            var config = merge(files, {thallium: thallium}, load({}))

            t.match(config, {thallium: thallium, files: files})
            t.equal(config.thallium, thallium)
        })

        it("merges `files`", function () {
            var thallium = {thallium: true}
            var files = ["test/**"]
            var extra = ["other/**"]
            var config = merge(files, {files: extra}, load({
                thallium: thallium,
            }))

            t.match(config, {thallium: thallium, files: files})
            t.equal(config.thallium, thallium)
        })

        it("merges everything", function () {
            var thallium = {thallium: true}
            var module = "./some-thallium-wrapper"
            var files = ["test/**"]
            var extra = ["other/**"]
            var config = merge(files, {
                module: module,
                thallium: thallium,
                files: extra,
            }, load({module: module}))

            t.match(config, {thallium: thallium, files: files})
            t.equal(config.thallium, thallium)
        })
    })
})
