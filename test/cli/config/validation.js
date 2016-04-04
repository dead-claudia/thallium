"use strict"

var t = require("../../../index.js")
var validate = require("../../../lib/cli/merge-config").validate

describe("cli merging (validation)", function () {
    function valid(name, config) {
        it(name + " is valid", function () { validate(config) })
    }

    function invalid(name, config) {
        it(name + " is invalid", function () {
            t.throws(function () { validate(config) }, TypeError)
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

    describe("techtonic", function () {
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
