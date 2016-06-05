"use strict"

var path = require("path")
var t = require("../../index.js")
var Util = require("../../lib/cli/util.js")
var fixture = require("../../helpers/cli.js").fixture

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
            return Util.load(fixture("util/test-module.js"))
            .then(function (result) {
                t.match(result, {exports: "hi!"})
            })
        })
    })

    describe("stat()", function () {
        it("checks files", function () {
            process.chdir(__dirname)
            return Util.stat(fixture("util/test-module.js"))
            .then(function (stat) {
                t.true(stat.isFile())
                t.false(stat.isDirectory())
            })
        })

        it("checks directories", function () {
            process.chdir(__dirname)
            return Util.stat(fixture("util"))
            .then(function (stat) {
                t.false(stat.isFile())
                t.true(stat.isDirectory())
            })
        })

        it("checks things that don't exist", function () {
            process.chdir(__dirname)
            return Util.stat(fixture("util/nope.js"))
            .then(function (stat) {
                t.false(stat.isFile())
                t.false(stat.isDirectory())
            })
        })
    })

    describe("readGlob()", function () {
        it("works", function () {
            process.chdir(__dirname)
            return Util.readGlob([fixture("util/test-glob/*.js")])
            .then(function () {
                process.chdir(fixture("util/test-glob"))
                t.equal(require.cache[path.resolve("foo.js")].exports, "foo")
                t.equal(require.cache[path.resolve("bar.js")].exports, "bar")
                t.equal(require.cache[path.resolve("baz.js")].exports, "baz")
            })
        })
    })
})
