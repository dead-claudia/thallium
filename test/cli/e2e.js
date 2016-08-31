"use strict"

// Note: these tests are flaky for the following reasons:
//
// 1. The tests may take a while, which is why the timeouts are relatively high.
// 2. The order the files are read are non-deterministic, but they are rarely
//    read in non-alphabetical order.

var path = require("path")
var cp = require("child_process")
var fixture = require("../../scripts/cli.js").fixture

describe("cli end-to-end (FLAKE)", function () {
    function formatList(msgs) {
        return msgs.replace(/\r?\n/g, "\n").replace(/\n{2,}/g, "\n").trim()
    }

    var binary = path.resolve(__dirname, "../../bin/thallium.js")

    function test(name, opts) {
        (opts.skip ? it.skip : it)(name, /** @this */ function () {
            this.slow(1500)
            this.timeout(opts.timeout)

            if (Array.isArray(opts.messages)) {
                var newline = process.platform === "win32" ? "\r\n" : "\n"

                opts.messages = opts.messages.join(newline)
            }

            opts.args.unshift(binary)

            var child = cp.spawn(process.argv[0], opts.args, {
                stdio: [process.stdin, "pipe", process.stderr],
            })

            var output = ""

            child.stdout.setEncoding("utf-8")
            child.stdout.on("data", function (data) { output += data })

            return Util.Promise.all([
                new Util.Promise(function (resolve, reject) {
                    child.on("error", reject)
                    child.stdout.on("error", reject)
                    child.stdout.on("end", resolve)
                }),
                new Util.Promise(function (resolve, reject) {
                    child.on("close", function (code, signal) {
                        if (signal == null) return resolve(code)
                        return reject(
                            new Error("terminated with signal " + signal))
                    })
                }),
                new Util.Promise(function (resolve, reject) {
                    child.on("exit", function (code, signal) {
                        if (signal == null) return resolve(code)
                        return reject(
                            new Error("terminated with signal " + signal))
                    })
                }),
            ])
            .then(function (list) {
                var code = list[1] != null ? list[1] : list[2]

                t.equal(formatList(output), formatList(opts.messages))
                t.equal(code, opts.code)
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

    test("runs small sized test suites", {
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
            "pass [1: mod-two] > [1: expandos don't transfer] = undefined",
            "fail [1: mod-two] > [2: what a fail...] = \"AssertionError: Expected 'yep' to be a nope\"",
            "leave [1: mod-two] = undefined",
            "end = undefined",
        ],
        /* eslint-enable max-len */
    })

    /* eslint-disable max-len */

    var midCoffeeMessages = [
        "start = undefined",
        "enter [0: core (basic)] = undefined",
        "enter [0: core (basic)] > [0: reflect()] = undefined",
        "pass [0: core (basic)] > [0: reflect()] > [0: exists] = undefined",
        "pass [0: core (basic)] > [0: reflect()] > [1: has base()] = undefined",
        "pass [0: core (basic)] > [0: reflect()] > [2: has parent()] = undefined",
        "leave [0: core (basic)] > [0: reflect()] = undefined",
        "enter [0: core (basic)] > [1: test()] = undefined",
        "pass [0: core (basic)] > [1: test()] > [0: exists] = undefined",
        "pass [0: core (basic)] > [1: test()] > [1: accepts a string + function] = undefined",
        "pass [0: core (basic)] > [1: test()] > [2: accepts a string] = undefined",
        "pass [0: core (basic)] > [1: test()] > [3: returns the current instance when given a callback] = undefined",
        "pass [0: core (basic)] > [1: test()] > [4: returns a prototypal clone when not given a callback] = undefined",
        "leave [0: core (basic)] > [1: test()] = undefined",
        "enter [0: core (basic)] > [2: run()] = undefined",
        "pass [0: core (basic)] > [2: run()] > [0: exists] = undefined",
        "pass [0: core (basic)] > [2: run()] > [1: runs block tests within tests] = undefined",
        "pass [0: core (basic)] > [2: run()] > [2: runs successful inline tests within tests] = undefined",
        "pass [0: core (basic)] > [2: run()] > [3: accepts a callback] = undefined",
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
        "pass [2: core (timeouts) (FLAKE)] > [4: gets own block timeout] = undefined",
        "pass [2: core (timeouts) (FLAKE)] > [5: gets own inline timeout] = undefined",
        "pass [2: core (timeouts) (FLAKE)] > [6: gets inherited block timeout] = undefined",
        "pass [2: core (timeouts) (FLAKE)] > [7: gets inherited inline timeout] = undefined",
        "pass [2: core (timeouts) (FLAKE)] > [8: gets default timeout] = undefined",
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
})
