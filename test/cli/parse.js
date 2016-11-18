"use strict"

var path = require("path")
var parse = require("../../lib/cli/parse")
var Warning = require("../../lib/cli/init-common").Warning

describe("cli args parsing", function () {
    function alias(description, str, opts) {
        str = str.trim()
        it(description, function () {
            var parsed = parse(str ? str.split(/\s+/g) : [])

            if (opts.color == null) opts.color = undefined
            if (opts.config == null) opts.config = undefined
            if (opts.cwd == null) opts.cwd = undefined
            if (opts.files == null) opts.files = []
            if (opts.forceLocal == null) opts.forceLocal = false
            if (opts.help == null) opts.help = undefined
            if (opts.opts == null) opts.opts = undefined
            if (opts.require == null) opts.require = []
            if (opts.respawn == null) opts.respawn = true
            if (opts.unknown == null) opts.unknown = []

            assert.match(parsed, opts)
        })
    }

    context("basic pass", function () { // eslint-disable-line max-statements
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

        it("works with --respawn", "--respawn", {respawn: true})
        it("works with --no-respawn", "--no-respawn", {respawn: false})
        it("works with --force-local", "--force-local", {forceLocal: true})
        it("works with --no-force-local", "--no-force-local", {forceLocal: false}) // eslint-disable-line max-len

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

        it("tracks invalid long options", "--why -AM -i --here", {
            unknown: ["why", "here"],
        })
    })

    context("basic fail", function () {
        function throws(str) {
            str = str.trim()
            var args = str ? str.split(/\s+/g) : []

            it("fails with missing argument for " + str, function () {
                assert.throws(Warning, function () { parse(args) })
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
