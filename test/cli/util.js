"use strict"

var path = require("path")
var FSUtil = require("../../lib/cli/util")
var fixture = require("../../test-util/cli/cli").fixture

// Mostly sanity tests.
describe("cli/util", function () {
    var old

    beforeEach(function () { old = process.cwd() })
    afterEach(function () { process.chdir(old) })

    describe("chdir()", function () {
        it("works", function () {
            FSUtil.chdir(__dirname)
            assert.equal(process.cwd(), __dirname)
        })
    })

    describe("load()", function () {
        it("works", function () {
            return assert.async.equal(
                FSUtil.load("./test-module.js", fixture("util")),
                "hi!")
        })
    })

    describe("stat()", function () {
        it("checks files", function () {
            process.chdir(__dirname)
            var stat = FSUtil.stat(fixture("util/test-module.js"))

            assert.ok(stat.isFile())
            assert.notOk(stat.isDirectory())
        })

        it("checks directories", function () {
            process.chdir(__dirname)
            var stat = FSUtil.stat(fixture("util"))

            assert.notOk(stat.isFile())
            assert.ok(stat.isDirectory())
        })

        it("checks things that don't exist", function () {
            process.chdir(__dirname)

            assert.throwsMatch({code: "ENOENT"}, function () {
                FSUtil.stat(fixture("util/nope.js"))
            })
        })
    })

    describe("readGlob()", function () {
        it("works", function () {
            process.chdir(__dirname)
            return FSUtil.readGlob([fixture("util/test-glob/*.js")])
            .then(function () {
                process.chdir(fixture("util/test-glob"))

                assert.equal(
                    require.cache[path.resolve("foo.js")].exports,
                    "foo")

                assert.equal(
                    require.cache[path.resolve("bar.js")].exports,
                    "bar")

                assert.equal(
                    require.cache[path.resolve("baz.js")].exports,
                    "baz")
            })
        })
    })
})
