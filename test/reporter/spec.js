"use strict"

// Note: the reports *must* be well formed. The reporter assumes the reports are
// correct, and it will *not* verify this.

var Promise = require("bluebird")
var resolveAny = require("../../lib/common.js").resolveAny
var t = require("../../index.js")
var spec = require("../../r/spec.js")
var R = require("../../lib/reporter/index.js")
var Util = require("../../helpers/base.js")

var Symbols = R.Symbols
var c = R.color
var p = Util.p
var n = Util.n
var oldUseColors = R.useColors()

describe("reporter spec", function () {
    it("is not itself a reporter", function () {
        t.throws(function () { spec(n("start", [])) }, TypeError)
        t.throws(function () { spec(n("enter", [p("test", 0)])) }, TypeError)
        t.throws(function () { spec(n("leave", [p("test", 0)])) }, TypeError)
        t.throws(function () { spec(n("pass", [p("test", 0)])) }, TypeError)
        t.throws(function () { spec(n("fail", [p("test", 0)])) }, TypeError)
        t.throws(function () { spec(n("skip", [p("test", 0)])) }, TypeError)
        t.throws(function () { spec(n("end", [])) }, TypeError)
    })

    function run(useColors) { // eslint-disable-line max-statements
        R.useColors(useColors)
        beforeEach(function () { R.useColors(useColors) })
        afterEach(function () { R.useColors(oldUseColors) })

        function stack(err) {
            var lines = ("    " + err.stack.replace(/^ +/gm, "      "))
                .split(/\r?\n/g)

            lines[0] = "    " + c("fail", lines[0].slice(4))

            for (var i = 1; i < lines.length; i++) {
                lines[i] = "      " + c("fail", lines[i].slice(6))
            }

            return lines
        }

        function pass(name) {
            return c("checkmark", Symbols.Pass + " ") + c("pass", name)
        }

        function test(name, opts) {
            it(name, function () {
                var list = []
                var reporter = spec({print: function (arg) { list.push(arg) }})

                return Promise.each(opts.input, function (i) {
                    return resolveAny(reporter, undefined, i)
                })
                .then(function () {
                    t.match(list, opts.output)
                })
            })
        }

        test("empty test", {
            input: [
                n("start", []),
                n("end", []),
            ],
            output: [
                "",
                c("plain", "  0 tests"),
                "",
            ],
        })

        test("passing 2", {
            input: [
                n("start", []),
                n("pass", [p("test", 0)]),
                n("pass", [p("test", 1)]),
                n("end", []),
            ],
            output: [
                "",
                "  " + pass("test"),
                "  " + pass("test"),
                "",
                c("plain", "  2 tests"),
                c("bright pass", "  ") + c("green", "2 passing"),
                "",
            ],
        })

        var sentinel = new Error("sentinel")

        test("fail 2 with Error", {
            input: [
                n("start", []),
                n("fail", [p("one", 0)], sentinel),
                n("fail", [p("two", 1)], sentinel),
                n("end", []),
            ],
            output: [].concat([
                "",
                "  " + c("fail", "1) one"),
                "  " + c("fail", "2) two"),
                "",
                c("plain", "  2 tests"),
                c("bright fail", "  ") + c("fail", "2 failing"),
                "",
                "  " + c("plain", "1) one:"),
            ], stack(sentinel), [
                "",
                "  " + c("plain", "2) two:"),
            ], stack(sentinel), [
                "",
            ]),
        })

        test("pass + fail with Error", {
            input: [
                n("start", []),
                n("pass", [p("one", 0)]),
                n("fail", [p("two", 1)], sentinel),
                n("end", []),
            ],
            output: [].concat([
                "",
                "  " + pass("one"),
                "  " + c("fail", "1) two"),
                "",
                c("plain", "  2 tests"),
                c("bright pass", "  ") + c("green", "1 passing"),
                c("bright fail", "  ") + c("fail", "1 failing"),
                "",
                "  " + c("plain", "1) two:"),
            ], stack(sentinel), [
                "",
            ]),
        })

        test("fail with Error + pass", {
            input: [
                n("start", []),
                n("fail", [p("one", 0)], sentinel),
                n("pass", [p("two", 1)]),
                n("end", []),
            ],
            output: [].concat([
                "",
                "  " + c("fail", "1) one"),
                "  " + pass("two"),
                "",
                c("plain", "  2 tests"),
                c("bright pass", "  ") + c("green", "1 passing"),
                c("bright fail", "  ") + c("fail", "1 failing"),
                "",
                "  " + c("plain", "1) one:"),
            ], stack(sentinel), [
                "",
            ]),
        })

        var assertion = new t.AssertionError("Expected 1 to equal 2", 1, 2)

        test("fail 2 with AssertionError", {
            input: [
                n("start", []),
                n("fail", [p("one", 0)], assertion),
                n("fail", [p("two", 1)], assertion),
                n("end", []),
            ],
            output: [].concat([
                "",
                "  " + c("fail", "1) one"),
                "  " + c("fail", "2) two"),
                "",
                c("plain", "  2 tests"),
                c("bright fail", "  ") + c("fail", "2 failing"),
                "",
                "  " + c("plain", "1) one:"),
            ], stack(assertion), [
                "",
                "  " + c("plain", "2) two:"),
            ], stack(assertion), [
                "",
            ]),
        })

        test("pass + fail with AssertionError", {
            input: [
                n("start", []),
                n("pass", [p("one", 0)]),
                n("fail", [p("two", 1)], assertion),
                n("end", []),
            ],
            output: [].concat([
                "",
                "  " + pass("one"),
                "  " + c("fail", "1) two"),
                "",
                c("plain", "  2 tests"),
                c("bright pass", "  ") + c("green", "1 passing"),
                c("bright fail", "  ") + c("fail", "1 failing"),
                "",
                "  " + c("plain", "1) two:"),
            ], stack(assertion), [
                "",
            ]),
        })

        test("fail with AssertionError + pass", {
            input: [
                n("start", []),
                n("fail", [p("one", 0)], assertion),
                n("pass", [p("two", 1)]),
                n("end", []),
            ],
            output: [].concat([
                "",
                "  " + c("fail", "1) one"),
                "  " + pass("two"),
                "",
                c("plain", "  2 tests"),
                c("bright pass", "  ") + c("green", "1 passing"),
                c("bright fail", "  ") + c("fail", "1 failing"),
                "",
                "  " + c("plain", "1) one:"),
            ], stack(assertion), [
                "",
            ]),
        })

        test("skip 2", {
            input: [
                n("start", []),
                n("skip", [p("one", 0)]),
                n("skip", [p("two", 1)]),
                n("end", []),
            ],
            output: [
                "",
                "  " + c("skip", "- one"),
                "  " + c("skip", "- two"),
                "",
                c("plain", "  0 tests"),
                c("skip", "  2 skipped"),
                "",
            ],
        })

        test("pass + skip", {
            input: [
                n("start", []),
                n("pass", [p("one", 0)]),
                n("skip", [p("two", 1)]),
                n("end", []),
            ],
            output: [
                "",
                "  " + pass("one"),
                "  " + c("skip", "- two"),
                "",
                c("plain", "  1 test"),
                c("bright pass", "  ") + c("green", "1 passing"),
                c("skip", "  1 skipped"),
                "",
            ],
        })

        test("skip + pass", {
            input: [
                n("start", []),
                n("skip", [p("one", 0)]),
                n("pass", [p("two", 1)]),
                n("end", []),
            ],
            output: [
                "",
                "  " + c("skip", "- one"),
                "  " + pass("two"),
                "",
                c("plain", "  1 test"),
                c("bright pass", "  ") + c("green", "1 passing"),
                c("skip", "  1 skipped"),
                "",
            ],
        })

        test("fail + skip", {
            input: [
                n("start", []),
                n("fail", [p("one", 0)], sentinel),
                n("skip", [p("two", 1)]),
                n("end", []),
            ],
            output: [].concat([
                "",
                "  " + c("fail", "1) one"),
                "  " + c("skip", "- two"),
                "",
                c("plain", "  1 test"),
                c("skip", "  1 skipped"),
                c("bright fail", "  ") + c("fail", "1 failing"),
                "",
                "  " + c("plain", "1) one:"),
            ], stack(sentinel), [
                "",
            ]),
        })

        test("skip + fail", {
            input: [
                n("start", []),
                n("skip", [p("one", 0)]),
                n("fail", [p("two", 1)], sentinel),
                n("end", []),
            ],
            output: [].concat([
                "",
                "  " + c("skip", "- one"),
                "  " + c("fail", "1) two"),
                "",
                c("plain", "  1 test"),
                c("skip", "  1 skipped"),
                c("bright fail", "  ") + c("fail", "1 failing"),
                "",
                "  " + c("plain", "1) two:"),
            ], stack(sentinel), [
                "",
            ]),
        })

        var extra = (function () {
            var e = new Error()
            var parts = []
            var stack

            e.name = ""
            stack = e.stack.split(/\r?\n/g).slice(1)

            parts.push("    " + c("fail", "- " + stack[0].trim()))

            for (var i = 1; i < stack.length; i++) {
                parts.push("      " + c("fail", stack[i].trim()))
            }

            return {
                stack: stack.join("\n"),
                parts: parts,
            }
        })()

        test("extra pass", {
            input: [
                n("start", []),
                n("enter", [p("test", 0)]),
                n("enter", [p("test", 0), p("inner", 0)]),
                n("pass", [p("test", 0), p("inner", 0), p("fail", 0)]),
                n("leave", [p("test", 0), p("inner", 0)]),
                n("extra", [p("test", 0), p("inner", 0), p("fail", 0)],
                    {count: 2, value: undefined, stack: extra.stack}),
                n("extra", [p("test", 0), p("inner", 0), p("fail", 0)],
                    {count: 3, value: sentinel, stack: extra.stack}),
                n("leave", [p("test", 0)]),
                n("end", []),
            ],
            output: [].concat([
                "",
                "  test",
                "    inner",
                "      " + pass("fail"),
                "",
                c("plain", "  3 tests"),
                c("bright pass", "  ") + c("green", "3 passing"),
                c("bright fail", "  ") + c("fail", "1 failing"),
                "",
                "  " + c("plain", "1) test inner fail: (extra)"),
                "    " + c("fail", "- value: undefined"),
            ], extra.parts, [
                "",
                "  " + c("plain", "2) test inner fail: (extra)"),
                "    " + c("fail", "- value: [Error: sentinel]"),
            ], extra.parts, [
                "",
            ]),
        })

        var badType = new TypeError("undefined is not a function")

        test("extra fail", {
            input: [
                n("start", []),
                n("enter", [p("test", 0)]),
                n("enter", [p("test", 0), p("inner", 0)]),
                n("fail", [p("test", 0), p("inner", 0), p("fail", 0)], badType),
                n("leave", [p("test", 0), p("inner", 0)]),
                n("extra", [p("test", 0), p("inner", 0), p("fail", 0)],
                    {count: 2, value: undefined, stack: extra.stack}),
                n("extra", [p("test", 0), p("inner", 0), p("fail", 0)],
                    {count: 3, value: sentinel, stack: extra.stack}),
                n("leave", [p("test", 0)]),
                n("end", []),
            ],
            output: [].concat([
                "",
                "  test",
                "    inner",
                "      " + c("fail", "1) fail"),
                "",
                c("plain", "  3 tests"),
                c("bright pass", "  ") + c("green", "2 passing"),
                c("bright fail", "  ") + c("fail", "1 failing"),
                "",
                "  " + c("plain", "1) test inner fail:"),
            ], stack(badType), [
                "",
                "  " + c("plain", "2) test inner fail: (extra)"),
                "    " + c("fail", "- value: undefined"),
            ], extra.parts, [
                "",
                "  " + c("plain", "3) test inner fail: (extra)"),
                "    " + c("fail", "- value: [Error: sentinel]"),
            ], extra.parts, [
                "",
            ]),
        })

        test("internal errors", {
            input: [
                n("start", []),
                n("enter", [p("test", 0)]),
                n("enter", [p("test", 0), p("inner", 0)]),
                n("fail", [p("test", 0), p("inner", 0), p("fail", 0)], badType),
                n("error", [p("test", 0), p("inner", 0)], badType),
            ],
            output: [].concat([
                "",
                "  test",
                "    inner",
                "      " + c("fail", "1) fail"),
                "",
            ], badType.stack.split(/\r?\n/g)),
        })

        test("long passing sequence", {
            /* eslint-disable max-len */

            input: [
                n("start", []),
                n("enter", [p("core (basic)", 0)]),
                n("pass", [p("core (basic)", 0), p("has `base()`", 0)]),
                n("pass", [p("core (basic)", 0), p("has `test()`", 1)]),
                n("pass", [p("core (basic)", 0), p("has `parent()`", 2)]),
                n("pass", [p("core (basic)", 0), p("can accept a string + function", 3)]),
                n("pass", [p("core (basic)", 0), p("can accept a string", 4)]),
                n("pass", [p("core (basic)", 0), p("returns the current instance when given a callback", 5)]),
                n("pass", [p("core (basic)", 0), p("returns a prototypal clone when not given a callback", 6)]),
                n("pass", [p("core (basic)", 0), p("runs block tests within tests", 7)]),
                n("pass", [p("core (basic)", 0), p("runs successful inline tests within tests", 8)]),
                n("pass", [p("core (basic)", 0), p("accepts a callback with `t.run()`", 9)]),
                n("leave", [p("core (basic)", 0)]),
                n("enter", [p("cli normalize glob", 1)]),
                n("enter", [p("cli normalize glob", 1), p("current directory", 0)]),
                n("pass", [p("cli normalize glob", 1), p("current directory", 0), p("normalizes a file", 0)]),
                n("pass", [p("cli normalize glob", 1), p("current directory", 0), p("normalizes a glob", 1)]),
                n("pass", [p("cli normalize glob", 1), p("current directory", 0), p("retains trailing slashes", 2)]),
                n("pass", [p("cli normalize glob", 1), p("current directory", 0), p("retains negative", 3)]),
                n("pass", [p("cli normalize glob", 1), p("current directory", 0), p("retains negative + trailing slashes", 4)]),
                n("leave", [p("cli normalize glob", 1), p("current directory", 0)]),
                n("enter", [p("cli normalize glob", 1), p("absolute directory", 1)]),
                n("pass", [p("cli normalize glob", 1), p("absolute directory", 1), p("normalizes a file", 0)]),
                n("pass", [p("cli normalize glob", 1), p("absolute directory", 1), p("normalizes a glob", 1)]),
                n("pass", [p("cli normalize glob", 1), p("absolute directory", 1), p("retains trailing slashes", 2)]),
                n("pass", [p("cli normalize glob", 1), p("absolute directory", 1), p("retains negative", 3)]),
                n("pass", [p("cli normalize glob", 1), p("absolute directory", 1), p("retains negative + trailing slashes", 4)]),
                n("leave", [p("cli normalize glob", 1), p("absolute directory", 1)]),
                n("enter", [p("cli normalize glob", 1), p("relative directory", 2)]),
                n("pass", [p("cli normalize glob", 1), p("relative directory", 2), p("normalizes a file", 0)]),
                n("pass", [p("cli normalize glob", 1), p("relative directory", 2), p("normalizes a glob", 1)]),
                n("pass", [p("cli normalize glob", 1), p("relative directory", 2), p("retains trailing slashes", 2)]),
                n("pass", [p("cli normalize glob", 1), p("relative directory", 2), p("retains negative", 3)]),
                n("pass", [p("cli normalize glob", 1), p("relative directory", 2), p("retains negative + trailing slashes", 4)]),
                n("leave", [p("cli normalize glob", 1), p("relative directory", 2)]),
                n("enter", [p("cli normalize glob", 1), p("edge cases", 3)]),
                n("pass", [p("cli normalize glob", 1), p("edge cases", 3), p("normalizes `.` with a cwd of `.`", 0)]),
                n("pass", [p("cli normalize glob", 1), p("edge cases", 3), p("normalizes `..` with a cwd of `.`", 1)]),
                n("pass", [p("cli normalize glob", 1), p("edge cases", 3), p("normalizes `.` with a cwd of `..`", 2)]),
                n("pass", [p("cli normalize glob", 1), p("edge cases", 3), p("normalizes directories with a cwd of `..`", 3)]),
                n("pass", [p("cli normalize glob", 1), p("edge cases", 3), p("removes excess `.`", 4)]),
                n("pass", [p("cli normalize glob", 1), p("edge cases", 3), p("removes excess `..`", 5)]),
                n("pass", [p("cli normalize glob", 1), p("edge cases", 3), p("removes excess combined junk", 6)]),
                n("leave", [p("cli normalize glob", 1), p("edge cases", 3)]),
                n("leave", [p("cli normalize glob", 1)]),
                n("enter", [p("core (timeouts)", 2)]),
                n("pass", [p("core (timeouts)", 2), p("succeeds with own", 0)]),
                n("pass", [p("core (timeouts)", 2), p("fails with own", 1)]),
                n("pass", [p("core (timeouts)", 2), p("succeeds with inherited", 2)]),
                n("pass", [p("core (timeouts)", 2), p("fails with inherited", 3)]),
                n("pass", [p("core (timeouts)", 2), p("gets own set timeout", 4)]),
                n("pass", [p("core (timeouts)", 2), p("gets own inline set timeout", 5)]),
                n("pass", [p("core (timeouts)", 2), p("gets own sync inner timeout", 6)]),
                n("pass", [p("core (timeouts)", 2), p("gets default timeout", 7)]),
                n("leave", [p("core (timeouts)", 2)]),
                n("end", []),
            ],

            output: [
                "",
                "  core (basic)",
                "    " + pass("has `base()`"),
                "    " + pass("has `test()`"),
                "    " + pass("has `parent()`"),
                "    " + pass("can accept a string + function"),
                "    " + pass("can accept a string"),
                "    " + pass("returns the current instance when given a callback"),
                "    " + pass("returns a prototypal clone when not given a callback"),
                "    " + pass("runs block tests within tests"),
                "    " + pass("runs successful inline tests within tests"),
                "    " + pass("accepts a callback with `t.run()`"),
                "",
                "  cli normalize glob",
                "    current directory",
                "      " + pass("normalizes a file"),
                "      " + pass("normalizes a glob"),
                "      " + pass("retains trailing slashes"),
                "      " + pass("retains negative"),
                "      " + pass("retains negative + trailing slashes"),
                "    absolute directory",
                "      " + pass("normalizes a file"),
                "      " + pass("normalizes a glob"),
                "      " + pass("retains trailing slashes"),
                "      " + pass("retains negative"),
                "      " + pass("retains negative + trailing slashes"),
                "    relative directory",
                "      " + pass("normalizes a file"),
                "      " + pass("normalizes a glob"),
                "      " + pass("retains trailing slashes"),
                "      " + pass("retains negative"),
                "      " + pass("retains negative + trailing slashes"),
                "    edge cases",
                "      " + pass("normalizes `.` with a cwd of `.`"),
                "      " + pass("normalizes `..` with a cwd of `.`"),
                "      " + pass("normalizes `.` with a cwd of `..`"),
                "      " + pass("normalizes directories with a cwd of `..`"),
                "      " + pass("removes excess `.`"),
                "      " + pass("removes excess `..`"),
                "      " + pass("removes excess combined junk"),
                "",
                "  core (timeouts)",
                "    " + pass("succeeds with own"),
                "    " + pass("fails with own"),
                "    " + pass("succeeds with inherited"),
                "    " + pass("fails with inherited"),
                "    " + pass("gets own set timeout"),
                "    " + pass("gets own inline set timeout"),
                "    " + pass("gets own sync inner timeout"),
                "    " + pass("gets default timeout"),
                "",
                c("plain", "  47 tests"),
                c("bright pass", "  ") + c("green", "47 passing"),
                "",
            ],

            /* eslint-enable max-len */
        })

        test("long mixed bag", {
            /* eslint-disable max-len */

            input: [
                n("start", []),
                n("enter", [p("core (basic)", 0)]),
                n("pass", [p("core (basic)", 0), p("has `base()`", 0)]),
                n("pass", [p("core (basic)", 0), p("has `test()`", 1)]),
                n("pass", [p("core (basic)", 0), p("has `parent()`", 2)]),
                n("skip", [p("core (basic)", 0), p("can accept a string + function", 3)]),
                n("pass", [p("core (basic)", 0), p("can accept a string", 4)]),
                n("pass", [p("core (basic)", 0), p("returns the current instance when given a callback", 5)]),
                n("fail", [p("core (basic)", 0), p("returns a prototypal clone when not given a callback", 6)], badType),
                n("pass", [p("core (basic)", 0), p("runs block tests within tests", 7)]),
                n("pass", [p("core (basic)", 0), p("runs successful inline tests within tests", 8)]),
                n("pass", [p("core (basic)", 0), p("accepts a callback with `t.run()`", 9)]),
                n("leave", [p("core (basic)", 0)]),
                n("enter", [p("cli normalize glob", 1)]),
                n("enter", [p("cli normalize glob", 1), p("current directory", 0)]),
                n("fail", [p("cli normalize glob", 1), p("current directory", 0), p("normalizes a file", 0)], sentinel),
                n("pass", [p("cli normalize glob", 1), p("current directory", 0), p("normalizes a glob", 1)]),
                n("pass", [p("cli normalize glob", 1), p("current directory", 0), p("retains trailing slashes", 2)]),
                n("pass", [p("cli normalize glob", 1), p("current directory", 0), p("retains negative", 3)]),
                n("pass", [p("cli normalize glob", 1), p("current directory", 0), p("retains negative + trailing slashes", 4)]),
                n("leave", [p("cli normalize glob", 1), p("current directory", 0)]),
                n("enter", [p("cli normalize glob", 1), p("absolute directory", 1)]),
                n("pass", [p("cli normalize glob", 1), p("absolute directory", 1), p("normalizes a file", 0)]),
                n("pass", [p("cli normalize glob", 1), p("absolute directory", 1), p("normalizes a glob", 1)]),
                n("pass", [p("cli normalize glob", 1), p("absolute directory", 1), p("retains trailing slashes", 2)]),
                n("skip", [p("cli normalize glob", 1), p("absolute directory", 1), p("retains negative", 3)]),
                n("pass", [p("cli normalize glob", 1), p("absolute directory", 1), p("retains negative + trailing slashes", 4)]),
                n("leave", [p("cli normalize glob", 1), p("absolute directory", 1)]),
                n("enter", [p("cli normalize glob", 1), p("relative directory", 2)]),
                n("pass", [p("cli normalize glob", 1), p("relative directory", 2), p("normalizes a file", 0)]),
                n("pass", [p("cli normalize glob", 1), p("relative directory", 2), p("normalizes a glob", 1)]),
                n("pass", [p("cli normalize glob", 1), p("relative directory", 2), p("retains trailing slashes", 2)]),
                n("pass", [p("cli normalize glob", 1), p("relative directory", 2), p("retains negative", 3)]),
                n("fail", [p("cli normalize glob", 1), p("relative directory", 2), p("retains negative + trailing slashes", 4)], badType),
                n("leave", [p("cli normalize glob", 1), p("relative directory", 2)]),
                n("enter", [p("cli normalize glob", 1), p("edge cases", 3)]),
                n("pass", [p("cli normalize glob", 1), p("edge cases", 3), p("normalizes `.` with a cwd of `.`", 0)]),
                n("pass", [p("cli normalize glob", 1), p("edge cases", 3), p("normalizes `..` with a cwd of `.`", 1)]),
                n("pass", [p("cli normalize glob", 1), p("edge cases", 3), p("normalizes `.` with a cwd of `..`", 2)]),
                n("pass", [p("cli normalize glob", 1), p("edge cases", 3), p("normalizes directories with a cwd of `..`", 3)]),
                n("pass", [p("cli normalize glob", 1), p("edge cases", 3), p("removes excess `.`", 4)]),
                n("pass", [p("cli normalize glob", 1), p("edge cases", 3), p("removes excess `..`", 5)]),
                n("pass", [p("cli normalize glob", 1), p("edge cases", 3), p("removes excess combined junk", 6)]),
                n("leave", [p("cli normalize glob", 1), p("edge cases", 3)]),
                n("leave", [p("cli normalize glob", 1)]),
                n("enter", [p("core (timeouts)", 2)]),
                n("skip", [p("core (timeouts)", 2), p("succeeds with own", 0)]),
                n("pass", [p("core (timeouts)", 2), p("fails with own", 1)]),
                n("pass", [p("core (timeouts)", 2), p("succeeds with inherited", 2)]),
                n("pass", [p("core (timeouts)", 2), p("fails with inherited", 3)]),
                n("pass", [p("core (timeouts)", 2), p("gets own set timeout", 4)]),
                n("extra", [p("core (timeouts)", 2), p("fails with own", 1)],
                    {count: 2, value: badType, stack: extra.stack}),
                n("fail", [p("core (timeouts)", 2), p("gets own inline set timeout", 5)], sentinel),
                n("skip", [p("core (timeouts)", 2), p("gets own sync inner timeout", 6)]),
                n("pass", [p("core (timeouts)", 2), p("gets default timeout", 7)]),
                n("leave", [p("core (timeouts)", 2)]),
                n("end", []),
            ],

            output: [].concat([
                "",
                "  core (basic)",
                "    " + pass("has `base()`"),
                "    " + pass("has `test()`"),
                "    " + pass("has `parent()`"),
                "    " + c("skip", "- can accept a string + function"),
                "    " + pass("can accept a string"),
                "    " + pass("returns the current instance when given a callback"),
                "    " + c("fail", "1) returns a prototypal clone when not given a callback"),
                "    " + pass("runs block tests within tests"),
                "    " + pass("runs successful inline tests within tests"),
                "    " + pass("accepts a callback with `t.run()`"),
                "",
                "  cli normalize glob",
                "    current directory",
                "      " + c("fail", "2) normalizes a file"),
                "      " + pass("normalizes a glob"),
                "      " + pass("retains trailing slashes"),
                "      " + pass("retains negative"),
                "      " + pass("retains negative + trailing slashes"),
                "    absolute directory",
                "      " + pass("normalizes a file"),
                "      " + pass("normalizes a glob"),
                "      " + pass("retains trailing slashes"),
                "      " + c("skip", "- retains negative"),
                "      " + pass("retains negative + trailing slashes"),
                "    relative directory",
                "      " + pass("normalizes a file"),
                "      " + pass("normalizes a glob"),
                "      " + pass("retains trailing slashes"),
                "      " + pass("retains negative"),
                "      " + c("fail", "3) retains negative + trailing slashes"),
                "    edge cases",
                "      " + pass("normalizes `.` with a cwd of `.`"),
                "      " + pass("normalizes `..` with a cwd of `.`"),
                "      " + pass("normalizes `.` with a cwd of `..`"),
                "      " + pass("normalizes directories with a cwd of `..`"),
                "      " + pass("removes excess `.`"),
                "      " + pass("removes excess `..`"),
                "      " + pass("removes excess combined junk"),
                "",
                "  core (timeouts)",
                "    " + c("skip", "- succeeds with own"),
                "    " + pass("fails with own"),
                "    " + pass("succeeds with inherited"),
                "    " + pass("fails with inherited"),
                "    " + pass("gets own set timeout"),
                "    " + c("fail", "5) gets own inline set timeout"),
                "    " + c("skip", "- gets own sync inner timeout"),
                "    " + pass("gets default timeout"),
                "",
                c("plain", "  43 tests"),
                c("bright pass", "  ") + c("green", "39 passing"),
                c("skip", "  4 skipped"),
                c("bright fail", "  ") + c("fail", "5 failing"),
                "",
                "  " + c("plain", "1) core (basic) returns a prototypal clone when not given a callback:"),
            ], stack(badType), [
                "",
                "  " + c("plain", "2) cli normalize glob current directory normalizes a file:"),
            ], stack(sentinel), [
                "",
                "  " + c("plain", "3) cli normalize glob relative directory retains negative + trailing slashes:"),
            ], stack(badType), [
                "",
                "  " + c("plain", "4) core (timeouts) fails with own: (extra)"),
                "    " + c("fail", "- value: [TypeError: undefined is not a function]"),
            ], extra.parts, [
                "",
                "  " + c("plain", "5) core (timeouts) gets own inline set timeout:"),
            ], stack(sentinel), [
                "",
            ]),

            /* eslint-enable max-len */
        })

        context("restarting", function () {
            test("empty test", {
                input: [
                    n("start", []),
                    n("end", []),
                    n("start", []),
                    n("end", []),
                ],
                output: [
                    "",
                    c("plain", "  0 tests"),
                    "",
                    "",
                    c("plain", "  0 tests"),
                    "",
                ],
            })

            test("passing 2", {
                input: [
                    n("start", []),
                    n("pass", [p("test", 0)]),
                    n("pass", [p("test", 1)]),
                    n("end", []),
                    n("start", []),
                    n("pass", [p("test", 0)]),
                    n("pass", [p("test", 1)]),
                    n("end", []),
                ],
                output: [
                    "",
                    "  " + pass("test"),
                    "  " + pass("test"),
                    "",
                    c("plain", "  2 tests"),
                    c("bright pass", "  ") + c("green", "2 passing"),
                    "",
                    "",
                    "  " + pass("test"),
                    "  " + pass("test"),
                    "",
                    c("plain", "  2 tests"),
                    c("bright pass", "  ") + c("green", "2 passing"),
                    "",
                ],
            })

            var sentinel = new Error("sentinel")

            test("fail 2 with Error", {
                input: [
                    n("start", []),
                    n("fail", [p("one", 0)], sentinel),
                    n("fail", [p("two", 1)], sentinel),
                    n("end", []),
                    n("start", []),
                    n("fail", [p("one", 0)], sentinel),
                    n("fail", [p("two", 1)], sentinel),
                    n("end", []),
                ],
                output: [].concat([
                    "",
                    "  " + c("fail", "1) one"),
                    "  " + c("fail", "2) two"),
                    "",
                    c("plain", "  2 tests"),
                    c("bright fail", "  ") + c("fail", "2 failing"),
                    "",
                    "  " + c("plain", "1) one:"),
                ], stack(sentinel), [
                    "",
                    "  " + c("plain", "2) two:"),
                ], stack(sentinel), [
                    "",
                    "",
                    "  " + c("fail", "1) one"),
                    "  " + c("fail", "2) two"),
                    "",
                    c("plain", "  2 tests"),
                    c("bright fail", "  ") + c("fail", "2 failing"),
                    "",
                    "  " + c("plain", "1) one:"),
                ], stack(sentinel), [
                    "",
                    "  " + c("plain", "2) two:"),
                ], stack(sentinel), [
                    "",
                ]),
            })

            test("pass + fail with Error", {
                input: [
                    n("start", []),
                    n("pass", [p("one", 0)]),
                    n("fail", [p("two", 1)], sentinel),
                    n("end", []),
                    n("start", []),
                    n("pass", [p("one", 0)]),
                    n("fail", [p("two", 1)], sentinel),
                    n("end", []),
                ],
                output: [].concat([
                    "",
                    "  " + pass("one"),
                    "  " + c("fail", "1) two"),
                    "",
                    c("plain", "  2 tests"),
                    c("bright pass", "  ") + c("green", "1 passing"),
                    c("bright fail", "  ") + c("fail", "1 failing"),
                    "",
                    "  " + c("plain", "1) two:"),
                ], stack(sentinel), [
                    "",
                    "",
                    "  " + pass("one"),
                    "  " + c("fail", "1) two"),
                    "",
                    c("plain", "  2 tests"),
                    c("bright pass", "  ") + c("green", "1 passing"),
                    c("bright fail", "  ") + c("fail", "1 failing"),
                    "",
                    "  " + c("plain", "1) two:"),
                ], stack(sentinel), [
                    "",
                ]),
            })

            test("fail with Error + pass", {
                input: [
                    n("start", []),
                    n("fail", [p("one", 0)], sentinel),
                    n("pass", [p("two", 1)]),
                    n("end", []),
                    n("start", []),
                    n("fail", [p("one", 0)], sentinel),
                    n("pass", [p("two", 1)]),
                    n("end", []),
                ],
                output: [].concat([
                    "",
                    "  " + c("fail", "1) one"),
                    "  " + pass("two"),
                    "",
                    c("plain", "  2 tests"),
                    c("bright pass", "  ") + c("green", "1 passing"),
                    c("bright fail", "  ") + c("fail", "1 failing"),
                    "",
                    "  " + c("plain", "1) one:"),
                ], stack(sentinel), [
                    "",
                    "",
                    "  " + c("fail", "1) one"),
                    "  " + pass("two"),
                    "",
                    c("plain", "  2 tests"),
                    c("bright pass", "  ") + c("green", "1 passing"),
                    c("bright fail", "  ") + c("fail", "1 failing"),
                    "",
                    "  " + c("plain", "1) one:"),
                ], stack(sentinel), [
                    "",
                ]),
            })

            var assertion = new t.AssertionError("Expected 1 to equal 2", 1, 2)

            test("fail 2 with AssertionError", {
                input: [
                    n("start", []),
                    n("fail", [p("one", 0)], assertion),
                    n("fail", [p("two", 1)], assertion),
                    n("end", []),
                    n("start", []),
                    n("fail", [p("one", 0)], assertion),
                    n("fail", [p("two", 1)], assertion),
                    n("end", []),
                ],
                output: [].concat([
                    "",
                    "  " + c("fail", "1) one"),
                    "  " + c("fail", "2) two"),
                    "",
                    c("plain", "  2 tests"),
                    c("bright fail", "  ") + c("fail", "2 failing"),
                    "",
                    "  " + c("plain", "1) one:"),
                ], stack(assertion), [
                    "",
                    "  " + c("plain", "2) two:"),
                ], stack(assertion), [
                    "",
                    "",
                    "  " + c("fail", "1) one"),
                    "  " + c("fail", "2) two"),
                    "",
                    c("plain", "  2 tests"),
                    c("bright fail", "  ") + c("fail", "2 failing"),
                    "",
                    "  " + c("plain", "1) one:"),
                ], stack(assertion), [
                    "",
                    "  " + c("plain", "2) two:"),
                ], stack(assertion), [
                    "",
                ]),
            })

            test("pass + fail with AssertionError", {
                input: [
                    n("start", []),
                    n("pass", [p("one", 0)]),
                    n("fail", [p("two", 1)], assertion),
                    n("end", []),
                    n("start", []),
                    n("pass", [p("one", 0)]),
                    n("fail", [p("two", 1)], assertion),
                    n("end", []),
                ],
                output: [].concat([
                    "",
                    "  " + pass("one"),
                    "  " + c("fail", "1) two"),
                    "",
                    c("plain", "  2 tests"),
                    c("bright pass", "  ") + c("green", "1 passing"),
                    c("bright fail", "  ") + c("fail", "1 failing"),
                    "",
                    "  " + c("plain", "1) two:"),
                ], stack(assertion), [
                    "",
                    "",
                    "  " + pass("one"),
                    "  " + c("fail", "1) two"),
                    "",
                    c("plain", "  2 tests"),
                    c("bright pass", "  ") + c("green", "1 passing"),
                    c("bright fail", "  ") + c("fail", "1 failing"),
                    "",
                    "  " + c("plain", "1) two:"),
                ], stack(assertion), [
                    "",
                ]),
            })

            test("fail with AssertionError + pass", {
                input: [
                    n("start", []),
                    n("fail", [p("one", 0)], assertion),
                    n("pass", [p("two", 1)]),
                    n("end", []),
                    n("start", []),
                    n("fail", [p("one", 0)], assertion),
                    n("pass", [p("two", 1)]),
                    n("end", []),
                ],
                output: [].concat([
                    "",
                    "  " + c("fail", "1) one"),
                    "  " + pass("two"),
                    "",
                    c("plain", "  2 tests"),
                    c("bright pass", "  ") + c("green", "1 passing"),
                    c("bright fail", "  ") + c("fail", "1 failing"),
                    "",
                    "  " + c("plain", "1) one:"),
                ], stack(assertion), [
                    "",
                    "",
                    "  " + c("fail", "1) one"),
                    "  " + pass("two"),
                    "",
                    c("plain", "  2 tests"),
                    c("bright pass", "  ") + c("green", "1 passing"),
                    c("bright fail", "  ") + c("fail", "1 failing"),
                    "",
                    "  " + c("plain", "1) one:"),
                ], stack(assertion), [
                    "",
                ]),
            })
        })
    }

    context("no color", function () { run(false) })
    context("with color", function () { run(true) })
})
