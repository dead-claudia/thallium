"use strict"

var path = require("path")

var t = require("../../../index.js")
var parseArgs = require("../../../lib/cli/parse-args")

describe("cli arguments (multiple)", function () {
    var defaultCwd = "base"
    var testDir = path.join("test", "**")

    function arg(passed, value) {
        return {passed: passed, value: value}
    }

    function it(description, str, opts) {
        if (!opts.config) opts.config = arg(false, null)
        if (!opts.cwd) opts.cwd = arg(false, defaultCwd)
        if (!opts.register) opts.register = arg(false, [])
        if (!opts.files) opts.files = arg(false, [testDir])
        if (!opts.help) opts.help = arg(false, null)

        str = str.trim()
        global.it(description, function () {
            var parsed = parseArgs(defaultCwd, str ? str.split(/\s+/g) : [])

            t.deepEqual(parsed, opts)
        })
    }

    it("works with multiple register hooks via --register",
        "--register foo:module1 --register bar:module2",
        {register: arg(true, ["foo:module1", "bar:module2"])})

    it("works with multiple register hooks via -r",
        "-r foo:module1 -r bar:module2",
        {register: arg(true, ["foo:module1", "bar:module2"])})
})
