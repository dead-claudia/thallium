"use strict"

var path = require("path")
var t = require("../index.js")
var Util = require("../lib/cli-fs-util.js")
var fixture = require("../helpers/cli.js").fixture

// Mostly sanity tests.
describe("cli fs utils", function () {
    var old

    beforeEach(function () { old = process.cwd() })
    afterEach(function () { process.chdir(old) })

    describe("chdir()", function () {
        it("works", function () {
            Util.chdir(__dirname)
            t.equal(process.cwd(), __dirname)
        })
    })

    describe("load()", function () {
        it("works", function () {
            process.chdir(__dirname)
            t.equal(Util.load(fixture("util/test-module.js")), "hi!")
        })
    })

    describe("exists()", function () {
        it("checks files", function () {
            process.chdir(__dirname)
            t.true(Util.exists(fixture("util/test-module.js")))
        })

        it("checks directories", function () {
            process.chdir(__dirname)
            t.false(Util.exists(fixture("util")))
        })

        it("checks things that don't exist", function () {
            process.chdir(__dirname)
            t.false(Util.exists(fixture("util/nope.js")))
        })
    })

    describe("readGlob()", function () {
        it("works", function () {
            process.chdir(__dirname)
            return Util.readGlob(fixture("util/test-glob/*.js"))
            .then(function () {
                process.chdir(fixture("util/test-glob"))
                t.equal(require.cache[path.resolve("foo.js")].exports, "foo")
                t.equal(require.cache[path.resolve("bar.js")].exports, "bar")
                t.equal(require.cache[path.resolve("baz.js")].exports, "baz")
            })
        })
    })
})
