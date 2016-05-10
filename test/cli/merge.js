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

        describe("techtonic", () => {
            // Just treat any object as a duck. If it blows up in their face, it
            // should hopefully be obvious why.
            valid("object", {techtonic: {}})
            invalid("string", {techtonic: "foo"})
            invalid("number", {techtonic: 1})
            invalid("true", {techtonic: true})
            invalid("false", {techtonic: false})
            invalid("null", {techtonic: null})
            invalid("array", {techtonic: []})
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
                t.equal(name, opts.module || "techtonic")
                return opts.techtonic || {}
            }
        }

        function merge(files, config, load) {
            return m.merge(files, config, load, ".")
        }

        it("merges an empty object", () => {
            const techtonic = {techtonic: true}
            const files = ["test/**"]
            const config = merge(files, {}, load({techtonic}))

            t.match(config, {techtonic, files})
            t.equal(config.techtonic, techtonic)
        })

        it("merges `module`", () => {
            const techtonic = {techtonic: true}
            const module = "./some-techtonic-wrapper"
            const files = ["test/**"]
            const config = merge(files, {module}, load({module, techtonic}))

            t.match(config, {techtonic, files})
            t.equal(config.techtonic, techtonic)
        })

        it("merges `techtonic`", () => {
            const techtonic = {techtonic: true}
            const files = ["test/**"]
            const config = merge(files, {techtonic}, load({}))

            t.match(config, {techtonic, files})
            t.equal(config.techtonic, techtonic)
        })

        it("merges `files`", () => {
            const techtonic = {techtonic: true}
            const files = ["test/**"]
            const extra = ["other/**"]
            const config = merge(files, {files: extra}, load({techtonic}))

            t.match(config, {techtonic, files})
            t.equal(config.techtonic, techtonic)
        })

        it("merges everything", () => {
            const techtonic = {techtonic: true}
            const module = "./some-techtonic-wrapper"
            const files = ["test/**"]
            const extra = ["other/**"]
            const config = merge(files, {module, techtonic, files: extra},
                load({module}))

            t.match(config, {techtonic, files})
            t.equal(config.techtonic, techtonic)
        })
    })
})
