"use strict"

var path = require("path")
var Args = require("../../lib/cli/args")
var hasOwn = Object.prototype.hasOwnProperty

describe("cli/args", function () {
    function alias(description, str, opts) {
        str = str.trim()
        var expected = new Args.Args()

        for (var key in opts) {
            if (hasOwn.call(opts, key)) {
                expected[key] = opts[key]
            }
        }

        it(description, function () {
            var parsed = Args.parse(str ? str.split(/\s+/g) : [])

            assert.match(parsed, expected)
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
        it("works with --env", "--env foo=bar", {env: {foo: "bar"}})
        it("works with -e", "-e foo=bar", {env: {foo: "bar"}})

        it("works with --require (with ext + dot)",
            "--require .ext:module",
            {require: [".ext:module"]})

        it("works with --require (with ext + no dot)",
            "--require ext:module",
            {require: ["ext:module"]})

        it("works with -r (no dot + no module)",
            "-r module/register",
            {require: ["module/register"]})

        it("works with --respawn-as",
            "--respawn-as electron",
            {respawnAs: "electron"})

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
            unknown: ["--why", "--here"],
        })
    })

    context("basic fail", function () {
        function throws(str) {
            str = str.trim()
            var args = str ? str.split(/\s+/g) : []

            function isString(x) {
                return typeof x === "string"
            }

            it("fails with missing argument for " + str, function () {
                assert.throwsMatch(isString, function () { Args.parse(args) })
            })

            it("fails with missing argument for " + str + " --", function () {
                assert.throwsMatch(isString, function () {
                    Args.parse(args.concat(["--"]))
                })
            })
        }

        throws("-c")
        throws("--config")
        throws("--cwd")
        throws("-r")
        throws("--require")
        throws("--respawn-as")
    })

    context("precedence", function () {
        var it = alias

        it("overrides --color with --no-color",
            "--color --no-color",
            {color: false})

        it("overrides --no-color with --color",
            "--no-color --color",
            {color: true})

        it("overrides --cwd with latest",
            "--cwd foo --cwd bar",
            {cwd: "bar"})

        it("overrides --help with --help-detailed",
            "--help --help-detailed",
            {help: "detailed"})

        it("overrides --help-detailed with --help",
            "--help-detailed --help",
            {help: "simple"})

        it("overrides --respawn-as with latest",
            "--respawn-as foo --respawn-as bar",
            {respawnAs: "bar"})
    })

    context("multiple pass", function () {
        var it = alias

        it("works with multiple vars via --env",
            "--env foo=value1 --env bar=value2",
            {env: {foo: "value1", bar: "value2"}})

        it("works with multiple vars via -e",
            "-e foo=value1 -e bar=value2",
            {env: {foo: "value1", bar: "value2"}})

        it("works with duplicate vars via --env",
            "--env foo=value1 --env bar=value2 --env foo=value3",
            {env: {foo: "value3", bar: "value2"}})

        it("works with duplicate vars via -e",
            "-e foo=value1 -e bar=value2 -e foo=value3",
            {env: {foo: "value3", bar: "value2"}})

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
