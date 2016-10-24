"use strict"

// Note: these tests are flaky for the following reasons:
//
// 1. The tests may take a while, which is why the timeouts are relatively high.
// 2. The order the files are read are non-deterministic, but they are rarely
//    read in non-alphabetical order.

var path = require("path")
var cp = require("child_process")
var fixture = require("../../test-util/cli/cli.js").fixture

describe("cli end-to-end (FLAKE)", /** @this */ function () {
    this.retries(3)

    function formatList(msgs) {
        return msgs
            .replace(/\r?\n/g, Util.R.newline())
            .replace(/\n{2,}/g, Util.R.newline())
            .trim()
    }

    function test(name, opts) {
        opts.args.unshift("--force-local")
        opts.args.unshift(path.resolve(__dirname, "../../bin/tl.js"))

        if (Array.isArray(opts.messages)) {
            opts.messages = opts.messages.join(Util.R.newline())
        }

        (opts.skip ? it.skip : it)(name, /** @this */ function () {
            this.slow(1500)
            this.timeout(opts.timeout)

            var child = cp.spawn(process.argv[0], opts.args, {
                stdio: [process.stdin, "pipe", process.stderr],
                cwd: opts.cwd,
            })

            var output = ""

            child.stdout.setEncoding("utf-8")
            child.stdout.on("data", function (data) { output += data })

            return Promise.all([
                new Promise(function (resolve, reject) {
                    child.on("error", reject)
                    child.stdout.on("error", reject)
                    child.stdout.on("end", resolve)
                }),
                new Promise(function (resolve, reject) {
                    child.on("close", function (code, signal) {
                        if (signal == null) return resolve(code)
                        return reject(
                            new Error("terminated with signal " + signal))
                    })
                }),
                new Promise(function (resolve, reject) {
                    child.on("exit", function (code, signal) {
                        if (signal == null) return resolve(code)
                        return reject(
                            new Error("terminated with signal " + signal))
                    })
                }),
            ])
            .then(function (list) {
                var code = list[1] != null ? list[1] : list[2]

                assert.equal(formatList(output), formatList(opts.messages))
                assert.equal(code, opts.code)
            })
        })
    }

    test("runs simple valid tests", {
        args: ["--cwd", fixture("simple")],
        code: 0,
        timeout: 5000,
        messages: [
            "start = undefined",
            "pass [0: test 1] = undefined",
            "pass [1: test 2] = undefined",
            "end = undefined",
        ],
    })

    test("runs small sized failing test suites", {
        args: ["--cwd", fixture("."), "full-js/**"],
        code: 1,
        timeout: 5000,

        /* eslint-disable max-len */
        messages: [
            "start = undefined",
            "enter [0: mod-one] = undefined",
            "pass [0: mod-one] > [0: 1 === 1] = undefined",
            "fail [0: mod-one] > [1: foo()] = \"AssertionError: Expected 1 to not equal 1\"",
            "fail [0: mod-one] > [2: bar()] = \"Error: fail\"",
            "fail [0: mod-one] > [3: baz()] = \"Error: sentinel\"",
            "enter [0: mod-one] > [4: nested] = undefined",
            "pass [0: mod-one] > [4: nested] > [0: nested 2] = undefined",
            "leave [0: mod-one] > [4: nested] = undefined",
            "leave [0: mod-one] = undefined",
            "enter [1: mod-two] = undefined",
            "fail [1: mod-two] > [0: 1 === 2] = \"AssertionError: Expected 1 to equal 2\"",
            "fail [1: mod-two] > [1: what a fail...] = \"AssertionError: Expected 'yep' to be a nope\"",
            "leave [1: mod-two] = undefined",
            "end = undefined",
        ],
        /* eslint-enable max-len */
    })

    /* eslint-disable max-len */

    var midCoffeeMessages = [
        "start = undefined",
        "enter [0: core (basic)] = undefined",
        "enter [0: core (basic)] > [0: reflect] = undefined",
        "enter [0: core (basic)] > [0: reflect] > [0: get parent] = undefined",
        "pass [0: core (basic)] > [0: reflect] > [0: get parent] > [0: works on the root instance] = undefined",
        "pass [0: core (basic)] > [0: reflect] > [0: get parent] > [1: works on children] = undefined",
        "leave [0: core (basic)] > [0: reflect] > [0: get parent] = undefined",
        "enter [0: core (basic)] > [0: reflect] > [1: get count] = undefined",
        "pass [0: core (basic)] > [0: reflect] > [1: get count] > [0: works with 0 tests] = undefined",
        "pass [0: core (basic)] > [0: reflect] > [1: get count] > [1: works with 1 test] = undefined",
        "pass [0: core (basic)] > [0: reflect] > [1: get count] > [2: works with 2 tests] = undefined",
        "pass [0: core (basic)] > [0: reflect] > [1: get count] > [3: works with 3 tests] = undefined",
        "pass [0: core (basic)] > [0: reflect] > [1: get count] > [4: works with itself] = undefined",
        "leave [0: core (basic)] > [0: reflect] > [1: get count] = undefined",
        "enter [0: core (basic)] > [0: reflect] > [2: get name] = undefined",
        "pass [0: core (basic)] > [0: reflect] > [2: get name] > [0: works with the root test] = undefined",
        "pass [0: core (basic)] > [0: reflect] > [2: get name] > [1: works with child tests] = undefined",
        "pass [0: core (basic)] > [0: reflect] > [2: get name] > [2: works with itself] = undefined",
        "leave [0: core (basic)] > [0: reflect] > [2: get name] = undefined",
        "enter [0: core (basic)] > [0: reflect] > [3: get index] = undefined",
        "pass [0: core (basic)] > [0: reflect] > [3: get index] > [0: works with the root test] = undefined",
        "pass [0: core (basic)] > [0: reflect] > [3: get index] > [1: works with the first child test] = undefined",
        "pass [0: core (basic)] > [0: reflect] > [3: get index] > [2: works with the second child test] = undefined",
        "pass [0: core (basic)] > [0: reflect] > [3: get index] > [3: works with itself] = undefined",
        "leave [0: core (basic)] > [0: reflect] > [3: get index] = undefined",
        "enter [0: core (basic)] > [0: reflect] > [4: get children] = undefined",
        "pass [0: core (basic)] > [0: reflect] > [4: get children] > [0: works with 0 tests] = undefined",
        "pass [0: core (basic)] > [0: reflect] > [4: get children] > [1: works with 1 test] = undefined",
        "pass [0: core (basic)] > [0: reflect] > [4: get children] > [2: works with 2 tests] = undefined",
        "pass [0: core (basic)] > [0: reflect] > [4: get children] > [3: returns a copy] = undefined",
        "leave [0: core (basic)] > [0: reflect] > [4: get children] = undefined",
        "leave [0: core (basic)] > [0: reflect] = undefined",
        "enter [0: core (basic)] > [1: test()] = undefined",
        "pass [0: core (basic)] > [1: test()] > [0: returns a prototypal clone inside] = undefined",
        "leave [0: core (basic)] > [1: test()] = undefined",
        "enter [0: core (basic)] > [2: run()] = undefined",
        "pass [0: core (basic)] > [2: run()] > [0: runs child tests] = undefined",
        "leave [0: core (basic)] > [2: run()] = undefined",
        "leave [0: core (basic)] = undefined",
        "enter [1: cli common] = undefined",
        "enter [1: cli common] > [0: isObjectLike()] = undefined",
        "pass [1: cli common] > [0: isObjectLike()] > [0: passes for objects and functions] = undefined",
        "pass [1: cli common] > [0: isObjectLike()] > [1: fails for other things] = undefined",
        "leave [1: cli common] > [0: isObjectLike()] = undefined",
        "enter [1: cli common] > [1: resolveDefault()] = undefined",
        "pass [1: cli common] > [1: resolveDefault()] > [0: gets CJS default functions] = undefined",
        "pass [1: cli common] > [1: resolveDefault()] > [1: gets CJS default functions with `default` property] = undefined",
        "pass [1: cli common] > [1: resolveDefault()] > [2: gets CJS default arrays with `default` property] = undefined",
        "pass [1: cli common] > [1: resolveDefault()] > [3: gets CJS default objects] = undefined",
        "pass [1: cli common] > [1: resolveDefault()] > [4: gets CJS default primitives] = undefined",
        "pass [1: cli common] > [1: resolveDefault()] > [5: gets ES6 default functions] = undefined",
        "pass [1: cli common] > [1: resolveDefault()] > [6: gets ES6 default objects] = undefined",
        "pass [1: cli common] > [1: resolveDefault()] > [7: gets ES6 default arrays] = undefined",
        "pass [1: cli common] > [1: resolveDefault()] > [8: gets ES6 default objects with `default` property] = undefined",
        "pass [1: cli common] > [1: resolveDefault()] > [9: gets ES6 default functions with `default` property] = undefined",
        "pass [1: cli common] > [1: resolveDefault()] > [10: gets ES6 default arrays with `default` property] = undefined",
        "pass [1: cli common] > [1: resolveDefault()] > [11: gets ES6 default primitives] = undefined",
        "leave [1: cli common] > [1: resolveDefault()] = undefined",
        "enter [1: cli common] > [2: normalizeGlob()] = undefined",
        "enter [1: cli common] > [2: normalizeGlob()] > [0: current directory] = undefined",
        "pass [1: cli common] > [2: normalizeGlob()] > [0: current directory] > [0: normalizes a file] = undefined",
        "pass [1: cli common] > [2: normalizeGlob()] > [0: current directory] > [1: normalizes a glob] = undefined",
        "pass [1: cli common] > [2: normalizeGlob()] > [0: current directory] > [2: retains trailing slashes] = undefined",
        "pass [1: cli common] > [2: normalizeGlob()] > [0: current directory] > [3: retains negative] = undefined",
        "pass [1: cli common] > [2: normalizeGlob()] > [0: current directory] > [4: retains negative + trailing slashes] = undefined",
        "leave [1: cli common] > [2: normalizeGlob()] > [0: current directory] = undefined",
        "enter [1: cli common] > [2: normalizeGlob()] > [1: absolute directory] = undefined",
        "pass [1: cli common] > [2: normalizeGlob()] > [1: absolute directory] > [0: normalizes a file] = undefined",
        "pass [1: cli common] > [2: normalizeGlob()] > [1: absolute directory] > [1: normalizes a glob] = undefined",
        "pass [1: cli common] > [2: normalizeGlob()] > [1: absolute directory] > [2: retains trailing slashes] = undefined",
        "pass [1: cli common] > [2: normalizeGlob()] > [1: absolute directory] > [3: retains negative] = undefined",
        "pass [1: cli common] > [2: normalizeGlob()] > [1: absolute directory] > [4: retains negative + trailing slashes] = undefined",
        "leave [1: cli common] > [2: normalizeGlob()] > [1: absolute directory] = undefined",
        "enter [1: cli common] > [2: normalizeGlob()] > [2: relative directory] = undefined",
        "pass [1: cli common] > [2: normalizeGlob()] > [2: relative directory] > [0: normalizes a file] = undefined",
        "pass [1: cli common] > [2: normalizeGlob()] > [2: relative directory] > [1: normalizes a glob] = undefined",
        "pass [1: cli common] > [2: normalizeGlob()] > [2: relative directory] > [2: retains trailing slashes] = undefined",
        "pass [1: cli common] > [2: normalizeGlob()] > [2: relative directory] > [3: retains negative] = undefined",
        "pass [1: cli common] > [2: normalizeGlob()] > [2: relative directory] > [4: retains negative + trailing slashes] = undefined",
        "leave [1: cli common] > [2: normalizeGlob()] > [2: relative directory] = undefined",
        "enter [1: cli common] > [2: normalizeGlob()] > [3: edge cases] = undefined",
        "pass [1: cli common] > [2: normalizeGlob()] > [3: edge cases] > [0: normalizes `.` with a cwd of `.`] = undefined",
        "pass [1: cli common] > [2: normalizeGlob()] > [3: edge cases] > [1: normalizes `..` with a cwd of `.`] = undefined",
        "pass [1: cli common] > [2: normalizeGlob()] > [3: edge cases] > [2: normalizes `.` with a cwd of `..`] = undefined",
        "pass [1: cli common] > [2: normalizeGlob()] > [3: edge cases] > [3: normalizes directories with a cwd of `..`] = undefined",
        "pass [1: cli common] > [2: normalizeGlob()] > [3: edge cases] > [4: removes excess `.`] = undefined",
        "pass [1: cli common] > [2: normalizeGlob()] > [3: edge cases] > [5: removes excess `..`] = undefined",
        "pass [1: cli common] > [2: normalizeGlob()] > [3: edge cases] > [6: removes excess combined junk] = undefined",
        "leave [1: cli common] > [2: normalizeGlob()] > [3: edge cases] = undefined",
        "leave [1: cli common] > [2: normalizeGlob()] = undefined",
        "enter [1: cli common] > [3: globParent()] = undefined",
        "pass [1: cli common] > [3: globParent()] > [0: strips glob magic to return parent path] = undefined",
        "pass [1: cli common] > [3: globParent()] > [1: returns glob itself from non-glob paths] = undefined",
        "pass [1: cli common] > [3: globParent()] > [2: gets a base name] = undefined",
        "pass [1: cli common] > [3: globParent()] > [3: gets a base name from a nested glob] = undefined",
        "pass [1: cli common] > [3: globParent()] > [4: gets a base name from a flat file] = undefined",
        "pass [1: cli common] > [3: globParent()] > [5: gets a base name from character class pattern] = undefined",
        "pass [1: cli common] > [3: globParent()] > [6: gets a base name from brace , expansion] = undefined",
        "pass [1: cli common] > [3: globParent()] > [7: gets a base name from brace .. expansion] = undefined",
        "pass [1: cli common] > [3: globParent()] > [8: gets a base name from extglob] = undefined",
        "pass [1: cli common] > [3: globParent()] > [9: gets a base name from a complex brace glob] = undefined",
        "leave [1: cli common] > [3: globParent()] = undefined",
        "leave [1: cli common] = undefined",
        "enter [2: core (timeouts) (FLAKE)] = undefined",
        "pass [2: core (timeouts) (FLAKE)] > [0: succeeds with own] = undefined",
        "pass [2: core (timeouts) (FLAKE)] > [1: fails with own] = undefined",
        "pass [2: core (timeouts) (FLAKE)] > [2: succeeds with inherited] = undefined",
        "pass [2: core (timeouts) (FLAKE)] > [3: fails with inherited] = undefined",
        "pass [2: core (timeouts) (FLAKE)] > [4: gets own timeout] = undefined",
        "pass [2: core (timeouts) (FLAKE)] > [5: gets inherited timeout] = undefined",
        "pass [2: core (timeouts) (FLAKE)] > [6: gets default timeout] = undefined",
        "leave [2: core (timeouts) (FLAKE)] = undefined",
        "end = undefined",
    ]

    /* eslint-enable max-len */

    test("runs moderately sized test suites + registered extension", {
        args: [
            "--cwd", fixture("mid-coffee"),
            "--require", "coffee:coffee-script/register",
            "spec/**/*.coffee",
        ],
        code: 0,
        timeout: 7500,
        messages: midCoffeeMessages,
    })

    test("runs moderately sized test suites + an inferred non-JS config", {
        args: ["--cwd", fixture("mid-coffee")],
        code: 0,
        timeout: 7500,
        messages: midCoffeeMessages,
    })

    var relative = path.relative(
        process.cwd(),
        fixture("mid-coffee/spec/**/*.coffee"))

    test("runs moderately sized test suites + relative path", {
        args: [relative],
        code: 0,
        timeout: 7500,
        messages: midCoffeeMessages,
    })

    test("runs larger test suites with --cwd and relative path", {
        args: ["--cwd", process.cwd(), relative],
        code: 0,
        timeout: 7500,
        messages: midCoffeeMessages,
    })

    var inexact = path.relative(
        process.cwd(),
        fixture("mid-coffee/spec/**"))

    test("runs moderately sized test suites + inferred ext", {
        args: [inexact],
        code: 0,
        timeout: 7500,
        messages: midCoffeeMessages,
    })

    test("runs larger test suites with --cwd and inferred ext", {
        args: ["--cwd", process.cwd(), inexact],
        code: 0,
        timeout: 7500,
        messages: midCoffeeMessages,
    })

    var optsMessages = [
        "start = undefined",
        "pass [0: injection worked] = undefined",
        "end = undefined",
    ]

    test("runs tests with .tl.opts", {
        args: [],
        cwd: fixture("js-opts"),
        code: 0,
        timeout: 5000,
        messages: optsMessages,
    })

    test("runs tests with .tl.opts and files", {
        args: [fixture("js-opts/test/**")],
        code: 0,
        timeout: 5000,
        messages: optsMessages,
    })

    test("runs tests with specified --opts", {
        args: ["--opts", fixture("js-opts/config.opts")],
        cwd: fixture("js-opts"),
        code: 0,
        timeout: 5000,
        messages: optsMessages,
    })
})
