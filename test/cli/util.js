"use strict"

const path = require("path")
const t = require("../../index.js")
const Util = require("../../lib/cli/util.js")
const fixture = require("../../test-util/cli.js").fixture

// Mostly sanity tests.
describe("cli fs utils", () => {
    let old

    beforeEach(() => { old = process.cwd() })
    afterEach(() => { process.chdir(old) })

    describe("chdir()", () => {
        it("works", () => {
            Util.chdir(__dirname)
            t.equal(process.cwd(), __dirname)
        })
    })

    describe("load()", () => {
        it("works", () => {
            process.chdir(__dirname)
            t.equal(Util.load(fixture("util/test-module.js")), "hi!")
        })
    })

    describe("exists()", () => {
        it("checks files", () => {
            process.chdir(__dirname)
            t.true(Util.exists(fixture("util/test-module.js")))
        })

        it("checks directories", () => {
            process.chdir(__dirname)
            t.false(Util.exists(fixture("util")))
        })

        it("checks things that don't exist", () => {
            process.chdir(__dirname)
            t.false(Util.exists(fixture("util/nope.js")))
        })
    })

    describe("readGlob()", () => {
        it("works", () => {
            process.chdir(__dirname)
            return Util.readGlob(fixture("util/test-glob/*.js"))
            .then(() => {
                process.chdir(fixture("util/test-glob"))
                t.equal(require.cache[path.resolve("foo.js")].exports, "foo")
                t.equal(require.cache[path.resolve("bar.js")].exports, "bar")
                t.equal(require.cache[path.resolve("baz.js")].exports, "baz")
            })
        })
    })
})
