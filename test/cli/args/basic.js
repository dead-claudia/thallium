"use strict"

var path = require("path")

var t = require("../../../index.js")
var parseArgs = require("../../../lib/cli/parse-args")

describe("cli arguments (basic)", function () {
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

    it("works with defaults", "", {})
    it("works with --help", "--help", {help: arg(true, "simple")})
    it("works with -h", "-h", {help: arg(true, "simple")})
    it("works with --help-detailed", "--help-detailed", {help: arg(true, "detailed")}) // eslint-disable-line max-len
    it("works with -H", "-H", {help: arg(true, "detailed")})
    it("works with --cwd", "--cwd foo", {cwd: arg(true, "foo")})
    it("works with --config", "--config foo", {config: arg(true, "foo")})
    it("works with -c", "-c foo", {config: arg(true, "foo")})

    it("works with --register (with dot + no module)",
        "--register .ext",
        {register: arg(true, [".ext"])})

    it("works with --register (no dot + no module)",
        "--register ext",
        {register: arg(true, ["ext"])})

    it("works with --register (with dot + with module)",
        "--register .ext:module",
        {register: arg(true, [".ext:module"])})

    it("works with --register (no dot + with module)",
        "--register ext:module",
        {register: arg(true, ["ext:module"])})

    it("works with -r (no dot + no module)",
        "-r ext",
        {register: arg(true, ["ext"])})

    it("works with -r (no dot + with module)",
        "-r ext:module",
        {register: arg(true, ["ext:module"])})

    var my = path.join("my-test", "**", "*")
    var other = path.join("other-test", "**", "*")

    it("works with file arguments",
        my + " " + other,
        {files: arg(true, [my, other])})

    it("works with rest files with invalid options",
        my + " -- --weird-file",
        {files: arg(true, [my, "--weird-file"])})

    it("works with rest files with valid options",
        my + " -- --help",
        {files: arg(true, [my, "--help"])})

    // Note: this is a slightly flaky test.
    it("ignores invalid options", "--why -AM -i --here", {})
})
