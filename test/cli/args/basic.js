"use strict"

var t = require("../../../index.js")
var parseArgs = require("../../../lib/cli/parse-args.js")
var path = require("path")

// Pull it out to safely wrap.
var test1 = test

suite("cli arguments (basic)", function () { // eslint-disable-line max-statements, max-len
    // Mostly for consistency
    var cwd = "base"
    var config = path.join("test", ".techtonic")
    var testDir = path.join("test", "**")

    function set(set, value) {
        return {set: set, value: value}
    }

    function test(description, str, result) {
        str = str.trim()
        test1(description, function () {
            t.deepEqual(parseArgs(cwd, str ? str.split(/\s+/g) : []), {
                config: result.config || set(false, config),
                module: result.module || set(false, null),

                cwd: result.cwd || set(false, cwd),
                register: result.register || set(false, []),
                files: result.files || set(false, [testDir]),
                reporter: result.reporter || set(false, []),

                help: result.help || null,
            })
        })
    }

    test("works with defaults", "", {})
    test("works with --help", "--help", {help: "simple"})
    test("works with -h", "-h", {help: "simple"})
    test("works with --help-detailed", "--help-detailed", {help: "detailed"})
    test("works with -H", "-H", {help: "detailed"})
    test("works with --cwd", "--cwd foo", {cwd: set(true, "foo")})
    test("works with --config", "--config foo", {config: set(true, "foo")})
    test("works with -c", "-c foo", {config: set(true, "foo")})

    test("works with --register (with dot + no module)",
        "--register .ext",
        {register: set(true, [".ext"])})

    test("works with --register (no dot + no module)",
        "--register ext",
        {register: set(true, ["ext"])})

    test("works with --register (with dot + with module)",
        "--register .ext:module",
        {register: set(true, [".ext:module"])})

    test("works with --register (no dot + with module)",
        "--register ext:module",
        {register: set(true, ["ext:module"])})

    test("works with -r (with dot + no module)",
        "-r .ext",
        {register: set(true, [".ext"])})

    test("works with -r (no dot + no module)",
        "-r ext",
        {register: set(true, ["ext"])})

    test("works with -r (with dot + with module)",
        "-r .ext:module",
        {register: set(true, [".ext:module"])})

    test("works with -r (no dot + with module)",
        "-r ext:module",
        {register: set(true, ["ext:module"])})

    test("works with --module", "--module foo", {module: set(true, "foo")})
    test("works with -m", "-m foo", {module: set(true, "foo")})

    test("works with --reporter",
        "--reporter foo",
        {reporter: set(true, ["foo"])})

    test("works with -R",
        "-R foo",
        {reporter: set(true, ["foo"])})

    var my = path.join("my-test", "**", "*.js")
    var other = path.join("other-test", "**", "*.js")

    test("works with file arguments",
        my + " " + other,
        {
            config: set(false, path.join("my-test", ".techtonic")),
            files: set(true, [my, other]),
        })

    test("works with rest files with invalid options",
        my + " -- --weird-file.js",
        {
            config: set(false, path.join("my-test", ".techtonic")),
            files: set(true, [my, "--weird-file.js"]),
        })

    test("works with rest files with valid options",
        my + " -- --module",
        {
            config: set(false, path.join("my-test", ".techtonic")),
            files: set(true, [my, "--module"]),
        })

    // Note: this is a slightly flaky test.
    test("ignores invalid options", "--why -AM -i --here", {})
})
