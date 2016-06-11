"use strict"

var path = require("path")

var t = require("../../index.js")
var Args = require("../../lib/cli/args.js")

describe("cli arguments", function () {
    var defaultCwd = "base"

    function alias(description, str, opts) {
        opts.cwd = opts.cwd || defaultCwd

        str = str.trim()
        it(description, function () {
            var parsed = Args.parse(defaultCwd, str ? str.split(/\s+/g) : [])

            t.match(parsed, new Args.Args(opts))
        })
    }

    context("basic pass", function () {
        var it = alias

        it("works with defaults", "", {})
        it("works with --color", "--color", {color: true})
        it("works with --no-color", "--no-color", {color: false})
        it("works with --color --no-color", "--color --no-color", {color: false}) // eslint-disable-line max-len
        it("works with --no-color --color", "--no-color --color", {color: true})
        it("works with --help", "--help", {help: "simple"})
        it("works with -h", "-h", {help: "simple"})
        it("works with --help-detailed", "--help-detailed", {help: "detailed"})
        it("works with -H", "-H", {help: "detailed"})
        it("works with --cwd", "--cwd foo", {cwd: "foo"})
        it("works with --config", "--config foo", {config: "foo"})
        it("works with -c", "-c foo", {config: "foo"})

        it("works with --require (with ext + dot)",
            "--require .ext:module",
            {require: [".ext:module"]})

        it("works with --require (with ext + no dot)",
            "--require ext:module",
            {require: ["ext:module"]})

        it("works with -r (no dot + no module)",
            "-r module/register",
            {require: ["module/register"]})

        var my = path.join("my-test", "**", "*")
        var other = path.join("other-test", "**", "*")

        it("works with file arguments",
            my + " " + other,
            {files: [my, other]})

        it("works with rest files with invalid options",
            my + " -- --weird-file",
            {files: [my, "--weird-file"]})

        it("works with rest files with valid options",
            my + " -- --help",
            {files: [my, "--help"]})

        it("ignores invalid options", "--why -AM -i --here", {})
    })

    context("basic fail", function () {
        function throws(str) {
            str = str.trim()
            var args = str ? str.split(/\s+/g) : []

            it("fails with missing argument for " + str, function () {
                t.throws(function () {
                    Args.parse("base", args)
                }, Args.ArgumentError)
            })
        }

        throws("-c")
        throws("--config")
        throws("--cwd")

        throws("-c --")
        throws("--config --")
        throws("--cwd --")
        throws("-r --")
        throws("--require --")
    })

    context("multiple pass", function () {
        var it = alias

        it("works with multiple hooks via --require",
            "--require foo:module1 --require bar:module2",
            {require: ["foo:module1", "bar:module2"]})

        it("works with multiple hooks via -r",
            "-r foo:module1 -r bar:module2",
            {require: ["foo:module1", "bar:module2"]})

        it("works with file + hook via --require",
            "--require module1 --require bar:module2",
            {require: ["module1", "bar:module2"]})

        it("works with file + hook via -r",
            "-r module1 -r bar:module2",
            {require: ["module1", "bar:module2"]})
    })
})
