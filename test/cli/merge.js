"use strict"

var t = require("../../index.js")
var m = require("../../lib/cli/merge.js")

describe("cli config merging", function () {
    context("validate", function () {
        function valid(name, config) {
            it(name + " is valid", function () { m.validate(config) })
        }

        function invalid(name, config) {
            it(name + " is invalid", function () {
                t.throws(function () { m.validate(config) }, TypeError)
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

    context("merge", function () {
        function load(opts) {
            return function (name) {
                t.equal(name, opts.module || "thallium")
                return opts.thallium || {}
            }
        }

        function merge(files, config, load) {
            return m.merge(files, config, load, ".")
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
