"use strict"

const t = require("../../index.js")
const m = require("../../lib/cli/merge.js")

describe("cli config merging", () => {
    context("validate", () => {
        function valid(name, config) {
            it(`${name} is valid`, () => { m.validate(config) })
        }

        function invalid(name, config) {
            it(`${name} is invalid`, () => {
                t.throws(() => m.validate(config), TypeError)
            })
        }

        valid("empty object", {})

        describe("module", () => {
            valid("string", {module: "foo"})
            invalid("number", {module: 1})
            invalid("true", {module: true})
            invalid("false", {module: false})
            invalid("null", {module: null})
            invalid("object", {module: {}})
            invalid("array", {module: []})
        })

        describe("thallium", () => {
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

        describe("files", () => {
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

    context("merge", () => {
        function load(opts) {
            return name => {
                t.equal(name, opts.module || "thallium")
                return opts.thallium || {}
            }
        }

        function merge(files, config, load) {
            return m.merge(files, config, load, ".")
        }

        it("merges an empty object", () => {
            const thallium = {thallium: true}
            const files = ["test/**"]
            const config = merge(files, {}, load({thallium}))

            t.match(config, {thallium, files})
            t.equal(config.thallium, thallium)
        })

        it("merges `module`", () => {
            const thallium = {thallium: true}
            const module = "./some-thallium-wrapper"
            const files = ["test/**"]
            const config = merge(files, {module}, load({module, thallium}))

            t.match(config, {thallium, files})
            t.equal(config.thallium, thallium)
        })

        it("merges `thallium`", () => {
            const thallium = {thallium: true}
            const files = ["test/**"]
            const config = merge(files, {thallium}, load({}))

            t.match(config, {thallium, files})
            t.equal(config.thallium, thallium)
        })

        it("merges `files`", () => {
            const thallium = {thallium: true}
            const files = ["test/**"]
            const extra = ["other/**"]
            const config = merge(files, {files: extra}, load({thallium}))

            t.match(config, {thallium, files})
            t.equal(config.thallium, thallium)
        })

        it("merges everything", () => {
            const thallium = {thallium: true}
            const module = "./some-thallium-wrapper"
            const files = ["test/**"]
            const extra = ["other/**"]
            const config = merge(files, {module, thallium, files: extra},
                load({module}))

            t.match(config, {thallium, files})
            t.equal(config.thallium, thallium)
        })
    })
})
