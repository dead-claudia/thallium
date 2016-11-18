"use strict"

// Note: updates to isObjectLike(), resolveDefault(), normalizeGlob(), and
// globParent() must be reflected in fixtures/mid-coffee/spec/common.coffee, as
// it's trying to represent more real-world usage. The rest don't need ported
// over.

var path = require("path")
var Common = require("../../lib/cli/common")
var gp = require("../../lib/cli/init-common").globParent

describe("cli common", function () {
    var p = path.normalize

    describe("isObjectLike()", function () {
        var isObjectLike = Common.isObjectLike

        it("passes for objects and functions", function () {
            assert.ok(isObjectLike({}))
            assert.ok(isObjectLike([]))
            assert.ok(isObjectLike(function () {}))
        })

        it("fails for other things", function () {
            assert.notOk(isObjectLike(""))
            assert.notOk(isObjectLike("foo"))
            assert.notOk(isObjectLike(true))
            assert.notOk(isObjectLike(false))
            assert.notOk(isObjectLike(0))
            assert.notOk(isObjectLike(1))
            assert.notOk(isObjectLike(NaN))
            assert.notOk(isObjectLike(null))
            assert.notOk(isObjectLike(undefined))
            assert.notOk(isObjectLike())
            assert.notOk(isObjectLike(Symbol())) // eslint-disable-line no-undef, max-len
        })
    })

    describe("resolveDefault()", function () {
        var resolveDefault = Common.resolveDefault

        it("gets CJS default functions", function () {
            function f() {}

            assert.equal(f, resolveDefault(f))
        })

        it("gets CJS default functions with `default` property", function () {
            function f() {}
            f.default = "foo"

            assert.equal(f, resolveDefault(f))
        })

        it("gets CJS default arrays with `default` property", function () {
            var array = []

            array.default = "foo"
            assert.equal(array, resolveDefault(array))
        })

        it("gets CJS default objects", function () {
            var obj = {}

            assert.equal(obj, resolveDefault(obj))
        })

        it("gets CJS default primitives", function () {
            assert.equal("", resolveDefault(""))
            assert.equal("foo", resolveDefault("foo"))
            assert.equal(true, resolveDefault(true))
            assert.equal(false, resolveDefault(false))
            assert.equal(0, resolveDefault(0))
            assert.equal(1, resolveDefault(1))
            assert.equal(NaN, resolveDefault(NaN))
            assert.equal(null, resolveDefault(null))
            assert.equal(undefined, resolveDefault(undefined))
            assert.equal(undefined, resolveDefault())

            var sym = Symbol() // eslint-disable-line no-undef

            assert.equal(sym, resolveDefault(sym))
        })

        it("gets ES6 default functions", function () {
            function f() {}

            assert.equal(f, resolveDefault({default: f}))
        })

        it("gets ES6 default objects", function () {
            var obj = {}

            assert.equal(obj, resolveDefault({default: obj}))
        })

        it("gets ES6 default arrays", function () {
            var array = []

            assert.equal(array, resolveDefault({default: array}))
        })

        it("gets ES6 default objects with `default` property", function () {
            var obj = {default: {}}

            assert.equal(obj, resolveDefault({default: obj}))
        })

        it("gets ES6 default functions with `default` property", function () {
            function f() {}
            f.default = "foo"

            assert.equal(f, resolveDefault({default: f}))
        })

        it("gets ES6 default arrays with `default` property", function () {
            var array = []

            array.default = "foo"
            assert.equal(array, resolveDefault({default: array}))
        })

        it("gets ES6 default primitives", function () {
            assert.equal("", resolveDefault({default: ""}))
            assert.equal("foo", resolveDefault({default: "foo"}))
            assert.equal(true, resolveDefault({default: true}))
            assert.equal(false, resolveDefault({default: false}))
            assert.equal(0, resolveDefault({default: 0}))
            assert.equal(1, resolveDefault({default: 1}))
            assert.equal(NaN, resolveDefault({default: NaN}))
            assert.equal(null, resolveDefault({default: null}))
            assert.equal(undefined, resolveDefault({default: undefined}))

            var sym = Symbol() // eslint-disable-line no-undef

            assert.equal(sym, resolveDefault({default: sym}))
        })
    })

    describe("normalizeGlob()", function () {
        var normalizeGlob = Common.normalizeGlob

        function format(str) {
            return str.replace(/[\\\/]/g, path.sep)
        }

        function test(name, base, res) {
            function check(name, pair) {
                it(name, function () {
                    assert.equal(
                        normalizeGlob(format(pair[0]), p(base)),
                        p(pair[1]))
                })
            }

            context(name, function () {
                check("normalizes a file", res.file)
                check("normalizes a glob", res.glob)
                check("retains trailing slashes", res.slash)
                check("retains negative", res.negate)
                check("retains negative + trailing slashes", res.negateSlash)
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
                assert.equal(normalizeGlob(".", "."), ".")
            })

            it("normalizes `..` with a cwd of `.`", function () {
                assert.equal(normalizeGlob("..", "."), "..")
            })

            it("normalizes `.` with a cwd of `..`", function () {
                assert.equal(normalizeGlob(".", ".."), "..")
            })

            it("normalizes directories with a cwd of `..`", function () {
                assert.equal(
                    normalizeGlob(format("foo/bar"), ".."),
                    p("../foo/bar"))
            })

            it("removes excess `.`", function () {
                assert.equal(normalizeGlob(format("././././."), "foo"), "foo")
            })

            it("removes excess `..`", function () {
                assert.equal(
                    normalizeGlob(format("foo/../bar/baz/.."), "dir"),
                    p("dir/bar"))
            })

            it("removes excess combined junk", function () {
                assert.equal(
                    normalizeGlob(format("foo/./bar/../baz/./what"), "."),
                    p("foo/baz/what"))
            })
        })
    })

    describe("globParent()", function () {
        it("strips glob magic to return parent path", function () {
            assert.equal(gp(p("path/to/*.js")), p("path/to"))
            assert.equal(gp(p("/root/path/to/*.js")), p("/root/path/to"))
            assert.equal(gp(p("/*.js")), p("/"))
            assert.equal(gp(p("*.js")), ".")
            assert.equal(gp(p("**/*.js")), ".")
            assert.equal(gp(p("path/{to,from}")), "path")
            assert.equal(gp(p("path/!(to|from)")), "path")
            assert.equal(gp(p("path/?(to|from)")), "path")
            assert.equal(gp(p("path/+(to|from)")), "path")
            assert.equal(gp(p("path/*(to|from)")), "path")
            assert.equal(gp(p("path/@(to|from)")), "path")
            assert.equal(gp(p("path/**/*")), "path")
            assert.equal(gp(p("path/**/subdir/foo.*")), "path")
        })

        it("returns parent dirname from non-glob paths", function () {
            assert.equal(gp(p("path/foo/bar.js")), p("path/foo/bar.js"))
            assert.equal(gp(p("path/foo/")), p("path/foo"))
            assert.equal(gp(p("path/foo")), p("path/foo"))
        })

        it("gets a base name", function () {
            assert.equal(gp(p("js/*.js")), "js")
        })

        it("gets a base name from a nested glob", function () {
            assert.equal(gp(p("js/**/test/*.js")), "js")
        })

        it("gets a base name from a flat file", function () {
            assert.equal(gp(p("js/test/wow.js")), p("js/test/wow.js"))
        })

        it("gets a base name from character class pattern", function () {
            assert.equal(gp(p("js/t[a-z]st}/*.js")), "js")
        })

        it("gets a base name from brace , expansion", function () {
            assert.equal(gp(p("js/{src,test}/*.js")), "js")
        })

        it("gets a base name from brace .. expansion", function () {
            assert.equal(gp(p("js/test{0..9}/*.js")), "js")
        })

        it("gets a base name from extglob", function () {
            assert.equal(gp(p("js/t+(wo|est)/*.js")), "js")
        })

        it("gets a base name from a complex brace glob", function () {
            assert.equal(
                gp(p("lib/{components,pages}/**/{test,another}/*.txt")),
                "lib")

            assert.equal(
                gp(p("js/test/**/{images,components}/*.js")),
                p("js/test"))

            assert.equal(
                gp(p("ooga/{booga,sooga}/**/dooga/{eooga,fooga}")),
                "ooga")
        })
    })

    context("validate()", function () {
        function valid(name, config) {
            it(name + " is valid", function () { Common.validate(config) })
        }

        function invalid(name, config) {
            it(name + " is invalid", function () {
                assert.throws(TypeError, function () { Common.validate(config) }) // eslint-disable-line max-len
            })
        }

        valid("empty object", {})

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
                assert.equal(name, "thallium")
                return opts.thallium || {}
            }
        }

        function merge(files, config, load, isDefault) {
            return Common.merge({
                files: files,
                config: config,
                load: load,
                isDefault: isDefault,
                baseDir: ".",
            })
        }

        context("default", function () {
            it("merges an empty object", function () {
                var thallium = {thallium: true}
                var files = [p("custom/**")]
                var config = merge(files, {}, load({thallium: thallium}), true)

                assert.match(config, {thallium: thallium, files: files})
                assert.equal(config.thallium, thallium)
            })

            it("merges `thallium`", function () {
                var thallium = {thallium: true}
                var files = [p("custom/**")]
                var config = merge(files, {thallium: thallium}, load({}), true)

                assert.match(config, {thallium: thallium, files: files})
                assert.equal(config.thallium, thallium)
            })

            it("merges `files`", function () {
                var thallium = {thallium: true}
                var files = [p("custom/**")]
                var extra = [p("other/**")]
                var config = merge(
                    files,
                    {files: extra},
                    load({thallium: thallium}),
                    true)

                assert.match(config, {thallium: thallium, files: extra})
                assert.equal(config.thallium, thallium)
            })

            it("merges everything", function () {
                var thallium = {thallium: true}
                var files = [p("custom/**")]
                var extra = [p("other/**")]
                var config = merge(
                    files,
                    {thallium: thallium, files: extra},
                    load({}),
                    true)

                assert.match(config, {thallium: thallium, files: extra})
                assert.equal(config.thallium, thallium)
            })
        })

        context("with args", function () {
            it("merges an empty object", function () {
                var thallium = {thallium: true}
                var files = [p("custom/**")]
                var config = merge(files, {}, load({thallium: thallium}))

                assert.match(config, {thallium: thallium, files: files})
                assert.equal(config.thallium, thallium)
            })

            it("merges `thallium`", function () {
                var thallium = {thallium: true}
                var files = [p("custom/**")]
                var config = merge(files, {thallium: thallium}, load({}))

                assert.match(config, {thallium: thallium, files: files})
                assert.equal(config.thallium, thallium)
            })

            it("merges `files`", function () {
                var thallium = {thallium: true}
                var files = [p("custom/**")]
                var extra = [p("other/**")]
                var config = merge(
                    files,
                    {files: extra},
                    load({thallium: thallium}))

                assert.match(config, {thallium: thallium, files: files})
                assert.equal(config.thallium, thallium)
            })

            it("merges everything", function () {
                var thallium = {thallium: true}
                var files = [p("custom/**")]
                var extra = [p("other/**")]
                var config = merge(
                    files,
                    {thallium: thallium, files: extra},
                    load({}))

                assert.match(config, {thallium: thallium, files: files})
                assert.equal(config.thallium, thallium)
            })
        })
    })
})
