"use strict"

const t = require("../../index.js")
const load = require("../../lib/cli/load.js")

describe("cli config loading", () => {
    it("loads the config file", () => {
        const file = "config.js"
        const map = new Map()
        const result = {config: true}
        let loaded, baseDir

        function init(file, base) {
            debugger
            loaded = file
            baseDir = base
            return result
        }

        return load(init, file, map, ".").then(config => {
            t.equal(loaded, file)
            t.equal(baseDir, ".")
            t.equal(config, result)
        })
    })

    it("registers all the loaders from the map", () => {
        const mods = ["one", "two", "three", "four", "five"]
        const list = []
        const map = new Map(mods.map(m => [m, {register() { list.push(m) }}]))

        return load(() => {}, "config.js", map, ".").then(() => {
            t.match(list, mods)
        })
    })

    it("does both", () => {
        const file = "config.js"
        const mods = ["one", "two", "three", "four", "five"]
        const list = []
        const map = new Map(mods.map(m => [m, {register() { list.push(m) }}]))
        const result = {config: true}
        let loaded, baseDir

        function init(file, base) {
            loaded = file
            baseDir = base
            return result
        }

        return load(init, file, map, ".").then(config => {
            t.match(list, mods)
            t.equal(loaded, file)
            t.equal(baseDir, ".")
            t.equal(config, result)
        })
    })
})
