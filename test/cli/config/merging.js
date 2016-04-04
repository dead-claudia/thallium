"use strict"

var t = require("../../../index.js")
var merge = require("../../../lib/cli/merge-config").merge

describe("cli config (merging)", function () {
    function load(opts) {
        return function (name) {
            t.equal(name, opts.module || "techtonic")
            return opts.techtonic || {}
        }
    }

    it("merges an empty object", function () {
        var techtonic = {techtonic: true}
        var files = ["test/**"]
        var config = merge(files, {}, load({techtonic: techtonic}))

        t.deepEqual(config, {techtonic: techtonic, files: files})
        t.equal(config.techtonic, techtonic)
    })

    it("merges `module`", function () {
        var techtonic = {techtonic: true}
        var module = "./some-techtonic-wrapper"
        var files = ["test/**"]
        var config = merge(files, {module: module},
            load({module: module, techtonic: techtonic}))

        t.deepEqual(config, {techtonic: techtonic, files: files})
        t.equal(config.techtonic, techtonic)
    })

    it("merges `techtonic`", function () {
        var techtonic = {techtonic: true}
        var files = ["test/**"]
        var config = merge(files, {techtonic: techtonic}, load({}))

        t.deepEqual(config, {techtonic: techtonic, files: files})
        t.equal(config.techtonic, techtonic)
    })

    it("merges `files`", function () {
        var techtonic = {techtonic: true}
        var files = ["test/**"]
        var extra = ["other/**"]
        var config = merge(files, {files: extra}, load({techtonic: techtonic}))

        t.deepEqual(config, {techtonic: techtonic, files: files.concat(extra)})
        t.equal(config.techtonic, techtonic)
    })

    it("merges everything", function () {
        var techtonic = {techtonic: true}
        var module = "./some-techtonic-wrapper"
        var files = ["test/**"]
        var extra = ["other/**"]
        var config = merge(files, {
            module: module,
            techtonic: techtonic,
            files: extra,
        }, load({module: module}))

        t.deepEqual(config, {techtonic: techtonic, files: files.concat(extra)})
        t.equal(config.techtonic, techtonic)
    })
})
