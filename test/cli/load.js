"use strict"

var t = require("../../index.js")
var load = require("../../lib/cli/load.js")

describe("cli config loading", function () {
    it("loads the config file", function () {
        var file = "config.js"
        var map = Object.create(null)
        var result = {config: true}
        var loaded, baseDir

        function init(file, base) {
            loaded = file
            baseDir = base
            return result
        }

        return load(init, file, map, ".").then(function (config) {
            t.equal(loaded, file)
            t.equal(baseDir, ".")
            t.equal(config, result)
        })
    })

    it("registers all the loaders from the map", function () {
        var mods = ["one", "two", "three", "four", "five"]
        var list = []
        var map = Object.create(null)

        mods.forEach(function (m) {
            map[m] = {register: function () { list.push(m) }}
        })

        return load(function () {}, "config.js", map, ".").then(function () {
            t.match(list, mods)
        })
    })

    it("does both", function () {
        var file = "config.js"
        var mods = ["one", "two", "three", "four", "five"]
        var list = []
        var map = Object.create(null)
        var result = {config: true}
        var loaded, baseDir

        mods.forEach(function (m) {
            map[m] = {register: function () { list.push(m) }}
        })

        function init(file, base) {
            loaded = file
            baseDir = base
            return result
        }

        return load(init, file, map, ".").then(function (config) {
            t.match(list, mods)
            t.equal(loaded, file)
            t.equal(baseDir, ".")
            t.equal(config, result)
        })
    })
})
