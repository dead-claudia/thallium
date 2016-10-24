"use strict"

var path = require("path")
var FSUtil = require("../../lib/cli/util.js")
var fixture = require("../../test-util/cli/cli.js").fixture

// Mostly sanity tests.
describe("cli fs utils", function () {
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
            process.chdir(__dirname)
            return FSUtil.load(fixture("util/test-module.js"))
            .then(function (result) {
                assert.match(result, {exports: "hi!"})
            })
        })
    })

    describe("stat()", function () {
        it("checks files", function () {
            process.chdir(__dirname)
            return FSUtil.stat(fixture("util/test-module.js"))
            .then(function (stat) {
                assert.ok(stat.isFile())
                assert.notOk(stat.isDirectory())
            })
        })

        it("checks directories", function () {
            process.chdir(__dirname)
            return FSUtil.stat(fixture("util"))
            .then(function (stat) {
                assert.notOk(stat.isFile())
                assert.ok(stat.isDirectory())
            })
        })

        it("checks things that don't exist", function () {
            process.chdir(__dirname)
            return FSUtil.stat(fixture("util/nope.js"))
            .then(function (stat) {
                assert.notOk(stat.isFile())
                assert.notOk(stat.isDirectory())
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
