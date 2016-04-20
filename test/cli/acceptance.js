"use strict"

const path = require("path")
const t = require("../../index.js")
const cp = require("child_process")

describe("cli acceptance", () => {
    const techtonic = path.resolve(__dirname, "../../bin/techtonic.js")

    function run(cmd) {
        if (typeof cmd === "string") {
            cmd = cmd.trim()
            cmd = cmd ? cmd.split(/\s+/g) : []
        }
    }
})
