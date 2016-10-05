"use strict"

// Note: the reports *must* be well formed. The reporter assumes the reports are
// correct, and it will *not* verify this.

describe("reporter dot", function () {
    var p = Util.p
    var n = Util.n
    var c = Util.R.color

    it("is not itself a reporter", function () {
        var dot = Util.r.dot

        assert.throws(function () { dot(n("start", [])) }, TypeError)
        assert.throws(function () { dot(n("enter", [p("test", 0)])) }, TypeError) // eslint-disable-line max-len
        assert.throws(function () { dot(n("leave", [p("test", 0)])) }, TypeError) // eslint-disable-line max-len
        assert.throws(function () { dot(n("pass", [p("test", 0)])) }, TypeError)
        assert.throws(function () { dot(n("fail", [p("test", 0)])) }, TypeError)
        assert.throws(function () { dot(n("skip", [p("test", 0)])) }, TypeError)
        assert.throws(function () { dot(n("end", [])) }, TypeError)
    })

    function stack(e) {
        var lines = Util.R.getStack(e).split(/\r?\n/g)

        lines[0] = "    " + c("fail", lines[0])

        for (var i = 1; i < lines.length; i++) {
            lines[i] = "      " + c("fail", lines[i])
        }

        return lines
    }

    function Options(list, colors) {
        this._list = list
        this._acc = ""
        this.colors = colors
    }

    Util.methods(Options, {
        print: function (line) {
            if (this._acc !== "") {
                line += this._acc
                this._acc = ""
            }

            var lines = line.split(/\r?\n/g)

            // So lines are printed consistently.
            for (var i = 0; i < lines.length; i++) {
                this._list.push(lines[i])
            }

            return Util.Promise.resolve()
        },

        write: function (str) {
            var index = str.search(/\r?\n/g)

            if (index < 0) {
                this._acc += str
                return Util.Promise.resolve()
            }

            this._list.push(this._acc + str.slice(0, index))

            var lines = str.slice(index + (str[index] === "\r" ? 2 : 1))
                .split(/\r?\n/g)

            this._acc = lines.pop()

            for (var i = 0; i < lines.length; i++) {
                this._list.push(lines[i])
            }

            return Util.Promise.resolve()
        },

        reset: function () {
            if (this._acc !== "") {
                this._list.push(this._acc)
                this._acc = ""
            }

            return Util.Promise.resolve()
        },
    })

    function time(duration) {
        return c("light", " (" + duration + ")")
    }

    function makeTest(colors) {
        return function (name, opts) {
            it(name, function () {
                var list = []
                var reporter = Util.r.dot(new Options(list, colors))

                return Util.Promise.each(opts.input, function (i) {
                    return Util.Resolver.resolve1(reporter, undefined, i)
                })
                .then(function () {
                    assert.match(list, opts.output)
                })
            })
        }
    }

    function run(envColors, reporterColors) { // eslint-disable-line max-statements, max-len
        Util.R.Colors.forceSet(envColors)
        beforeEach(function () { Util.R.Colors.forceSet(envColors) })
        afterEach(function () { Util.R.Colors.forceRestore() })

        var pass = c("fast", Util.R.symbols().Dot)
        var fail = c("fail", Util.R.symbols().Dot)
        var skip = c("skip", Util.R.symbols().Dot)
        var test = makeTest(reporterColors)

        // So I can verify colors are enabled.
        if (envColors || reporterColors) {
            test("empty test", {
                input: [
                    n("start", []),
                    n("end", []),
                ],
                output: [
                    "",
                    c("plain", "  0 tests") + time("0ms"),
                    "",
                ],
            })
        } else {
            test("empty test", {
                input: [
                    n("start", []),
                    n("end", []),
                ],
                output: [
                    "",
                    "  0 tests (0ms)",
                    "",
                ],
            })
        }

        test("passing 2", {
            input: [
                n("start", []),
                n("pass", [p("test", 0)]),
                n("pass", [p("test", 1)]),
                n("end", []),
            ],
            output: [
                "",
                "  " + pass + pass,
                "",
                c("bright pass", "  ") + c("green", "2 passing") + time("20ms"),
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
                "  " + fail + fail,
                "",
                c("bright fail", "  ") + c("fail", "2 failing") + time("20ms"),
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
                "  " + pass + fail,
                "",
                c("bright pass", "  ") + c("green", "1 passing") + time("20ms"),
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
                "  " + fail + pass,
                "",
                c("bright pass", "  ") + c("green", "1 passing") + time("20ms"),
                c("bright fail", "  ") + c("fail", "1 failing"),
                "",
                "  " + c("plain", "1) one:"),
            ], stack(sentinel), [
                "",
            ]),
        })

        var AssertionError = assert.AssertionError
        var assertion = new AssertionError("Expected 1 to equal 2", 1, 2)

        test("fail 2 with AssertionError", {
            input: [
                n("start", []),
                n("fail", [p("one", 0)], assertion),
                n("fail", [p("two", 1)], assertion),
                n("end", []),
            ],
            output: [].concat([
                "",
                "  " + fail + fail,
                "",
                c("bright fail", "  ") + c("fail", "2 failing") + time("20ms"),
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
                "  " + pass + fail,
                "",
                c("bright pass", "  ") + c("green", "1 passing") + time("20ms"),
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
                "  " + fail + pass,
                "",
                c("bright pass", "  ") + c("green", "1 passing") + time("20ms"),
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
                "  " + skip + skip,
                "",
                c("skip", "  2 skipped") + time("0ms"),
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
                "  " + pass + skip,
                "",
                c("bright pass", "  ") + c("green", "1 passing") + time("10ms"),
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
                "  " + skip + pass,
                "",
                c("bright pass", "  ") + c("green", "1 passing") + time("10ms"),
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
                "  " + fail + skip,
                "",
                c("skip", "  1 skipped") + time("10ms"),
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
                "  " + skip + fail,
                "",
                c("skip", "  1 skipped") + time("10ms"),
                c("bright fail", "  ") + c("fail", "1 failing"),
                "",
                "  " + c("plain", "1) two:"),
            ], stack(sentinel), [
                "",
            ]),
        })

        var extra = (function () {
            var e = new Error("extra")
            var parts = []
            var stack

            e.name = ""
            stack = Util.R.getStack(e).split(/\r?\n/g).slice(1)

            parts.push("    " + c("fail", "- " + stack[0].trim()))

            for (var i = 1; i < stack.length; i++) {
                parts.push("      " + c("fail", stack[i].trim()))
            }

            return {
                stack: stack.join(Util.R.newline()),
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
                    Util.extra(2, undefined, extra.stack)),
                n("extra", [p("test", 0), p("inner", 0), p("fail", 0)],
                    Util.extra(3, sentinel, extra.stack)),
                n("leave", [p("test", 0)]),
                n("end", []),
            ],
            output: [].concat([
                "",
                "  " + pass + pass + pass,
                "",
                c("bright pass", "  ") + c("green", "3 passing") + time("30ms"),
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
                    Util.extra(2, undefined, extra.stack)),
                n("extra", [p("test", 0), p("inner", 0), p("fail", 0)],
                    Util.extra(3, sentinel, extra.stack)),
                n("leave", [p("test", 0)]),
                n("end", []),
            ],
            output: [].concat([
                "",
                "  " + pass + pass + fail,
                "",
                c("bright pass", "  ") + c("green", "2 passing") + time("30ms"),
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
                "  " + pass + pass + fail,
                "",
            ], Util.R.getStack(badType).split(/\r?\n/g)),
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
                n("pass", [p("core (basic)", 0), p("accepts a callback with `run()`", 9)]),
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
                "  " +
                // core (basic)
                    pass +
                    pass + pass + pass + pass + pass + pass + pass + pass +
                    pass + pass +

                // cli normalize glob
                    pass +

                // cli normalize glob current directory
                    pass +
                    pass + pass + pass + pass + pass +

                // cli normalize glob absolute directory
                    pass +
                    pass + pass + pass + pass + pass +

                // cli normalize glob relative directory
                    pass +
                    pass + pass + pass + pass + pass +

                // cli normalize glob edge cases
                    pass +
                    pass + pass + pass + pass + pass + pass + pass +

                // core (timeouts)
                    pass +
                    pass + pass + pass + pass + pass + pass + pass + pass,
                "",
                c("bright pass", "  ") + c("green", "47 passing") + time("470ms"),
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
                n("pass", [p("core (basic)", 0), p("accepts a callback with `run()`", 9)]),
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
                    Util.extra(2, badType, extra.stack)),
                n("fail", [p("core (timeouts)", 2), p("gets own inline set timeout", 5)], sentinel),
                n("skip", [p("core (timeouts)", 2), p("gets own sync inner timeout", 6)]),
                n("pass", [p("core (timeouts)", 2), p("gets default timeout", 7)]),
                n("leave", [p("core (timeouts)", 2)]),
                n("end", []),
            ],

            output: [].concat([
                "",
                "  " +
                // core (basic)
                    pass +
                    pass + pass + pass + skip + pass + pass + fail + pass +
                    pass + pass +

                // cli normalize glob
                    pass +

                // cli normalize glob current directory
                    pass +
                    fail + pass + pass + pass + pass +

                // cli normalize glob absolute directory
                    pass +
                    pass + pass + pass + skip + pass +

                // cli normalize glob relative directory
                    pass +
                    pass + pass + pass + pass + fail +

                // cli normalize glob edge cases
                    pass +
                    pass + pass + pass + pass + pass + pass + pass +

                // core (timeouts)
                    pass +
                    skip + pass + pass + pass + pass + fail + skip + pass,
                "",
                c("bright pass", "  ") + c("green", "39 passing") + time("430ms"),
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
                    c("plain", "  0 tests") + time("0ms"),
                    "",
                    "",
                    c("plain", "  0 tests") + time("0ms"),
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
                    "  " + pass + pass,
                    "",
                    c("bright pass", "  ") + c("green", "2 passing") +
                        time("20ms"),
                    "",
                    "",
                    "  " + pass + pass,
                    "",
                    c("bright pass", "  ") + c("green", "2 passing") +
                        time("20ms"),
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
                    "  " + fail + fail,
                    "",
                    c("bright fail", "  ") + c("fail", "2 failing") +
                        time("20ms"),
                    "",
                    "  " + c("plain", "1) one:"),
                ], stack(sentinel), [
                    "",
                    "  " + c("plain", "2) two:"),
                ], stack(sentinel), [
                    "",
                    "",
                    "  " + fail + fail,
                    "",
                    c("bright fail", "  ") + c("fail", "2 failing") +
                        time("20ms"),
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
                    "  " + pass + fail,
                    "",
                    c("bright pass", "  ") + c("green", "1 passing") +
                        time("20ms"),
                    c("bright fail", "  ") + c("fail", "1 failing"),
                    "",
                    "  " + c("plain", "1) two:"),
                ], stack(sentinel), [
                    "",
                    "",
                    "  " + pass + fail,
                    "",
                    c("bright pass", "  ") + c("green", "1 passing") +
                        time("20ms"),
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
                    "  " + fail + pass,
                    "",
                    c("bright pass", "  ") + c("green", "1 passing") +
                        time("20ms"),
                    c("bright fail", "  ") + c("fail", "1 failing"),
                    "",
                    "  " + c("plain", "1) one:"),
                ], stack(sentinel), [
                    "",
                    "",
                    "  " + fail + pass,
                    "",
                    c("bright pass", "  ") + c("green", "1 passing") +
                        time("20ms"),
                    c("bright fail", "  ") + c("fail", "1 failing"),
                    "",
                    "  " + c("plain", "1) one:"),
                ], stack(sentinel), [
                    "",
                ]),
            })

            var assertion = new AssertionError("Expected 1 to equal 2", 1, 2)

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
                    "  " + fail + fail,
                    "",
                    c("bright fail", "  ") + c("fail", "2 failing") +
                        time("20ms"),
                    "",
                    "  " + c("plain", "1) one:"),
                ], stack(assertion), [
                    "",
                    "  " + c("plain", "2) two:"),
                ], stack(assertion), [
                    "",
                    "",
                    "  " + fail + fail,
                    "",
                    c("bright fail", "  ") + c("fail", "2 failing") +
                        time("20ms"),
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
                    "  " + pass + fail,
                    "",
                    c("bright pass", "  ") + c("green", "1 passing") +
                        time("20ms"),
                    c("bright fail", "  ") + c("fail", "1 failing"),
                    "",
                    "  " + c("plain", "1) two:"),
                ], stack(assertion), [
                    "",
                    "",
                    "  " + pass + fail,
                    "",
                    c("bright pass", "  ") + c("green", "1 passing") +
                        time("20ms"),
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
                    "  " + fail + pass,
                    "",
                    c("bright pass", "  ") + c("green", "1 passing") +
                        time("20ms"),
                    c("bright fail", "  ") + c("fail", "1 failing"),
                    "",
                    "  " + c("plain", "1) one:"),
                ], stack(assertion), [
                    "",
                    "",
                    "  " + fail + pass,
                    "",
                    c("bright pass", "  ") + c("green", "1 passing") +
                        time("20ms"),
                    c("bright fail", "  ") + c("fail", "1 failing"),
                    "",
                    "  " + c("plain", "1) one:"),
                ], stack(assertion), [
                    "",
                ]),
            })

            Util.R.Colors.forceRestore()
        })
    }

    context("no env color + no color opt", function () { run(false, false) })
    context("with env color + no color opt", function () { run(true, false) })
    context("no env color + with color opt", function () { run(false, true) })
    context("with env color + with color opt", function () { run(true, true) })

    context("speed", function () {
        var test = makeTest(true)

        // Speed affects `"pass"` and `"enter"` events only.
        var fast = c("fast", Util.R.symbols().Dot)
        var medium = c("medium", Util.R.symbols().Dot)
        var slow = c("slow", Util.R.symbols().Dot)

        function at(speed) {
            if (speed === "slow") return 80
            if (speed === "medium") return 40
            if (speed === "fast") return 20
            throw new RangeError("Unknown speed: `" + speed + "`")
        }

        test("is marked with color", {
            /* eslint-disable max-len */

            input: [
                n("start", []),
                n("enter", [p("core (basic)", 0)], undefined, at("fast"), 75),
                n("pass", [p("core (basic)", 0), p("has `base()`", 0)], undefined, at("fast"), 75),
                n("pass", [p("core (basic)", 0), p("has `test()`", 1)], undefined, at("fast"), 75),
                n("pass", [p("core (basic)", 0), p("has `parent()`", 2)], undefined, at("fast"), 75),
                n("pass", [p("core (basic)", 0), p("can accept a string + function", 3)], undefined, at("fast"), 75),
                n("pass", [p("core (basic)", 0), p("can accept a string", 4)], undefined, at("fast"), 75),
                n("pass", [p("core (basic)", 0), p("returns the current instance when given a callback", 5)], undefined, at("medium"), 75),
                n("pass", [p("core (basic)", 0), p("returns a prototypal clone when not given a callback", 6)], undefined, at("medium"), 75),
                n("pass", [p("core (basic)", 0), p("runs block tests within tests", 7)], undefined, at("fast"), 75),
                n("pass", [p("core (basic)", 0), p("runs successful inline tests within tests", 8)], undefined, at("fast"), 75),
                n("pass", [p("core (basic)", 0), p("accepts a callback with `run()`", 9)], undefined, at("fast"), 75),
                n("leave", [p("core (basic)", 0)]),
                n("enter", [p("cli normalize glob", 1)], undefined, at("fast"), 75),
                n("enter", [p("cli normalize glob", 1), p("current directory", 0)], undefined, at("fast"), 75),
                n("pass", [p("cli normalize glob", 1), p("current directory", 0), p("normalizes a file", 0)], undefined, at("fast"), 75),
                n("pass", [p("cli normalize glob", 1), p("current directory", 0), p("normalizes a glob", 1)], undefined, at("fast"), 75),
                n("pass", [p("cli normalize glob", 1), p("current directory", 0), p("retains trailing slashes", 2)], undefined, at("fast"), 75),
                n("pass", [p("cli normalize glob", 1), p("current directory", 0), p("retains negative", 3)], undefined, at("fast"), 75),
                n("pass", [p("cli normalize glob", 1), p("current directory", 0), p("retains negative + trailing slashes", 4)], undefined, at("fast"), 75),
                n("leave", [p("cli normalize glob", 1), p("current directory", 0)]),
                n("enter", [p("cli normalize glob", 1), p("absolute directory", 1)], undefined, at("fast"), 75),
                n("pass", [p("cli normalize glob", 1), p("absolute directory", 1), p("normalizes a file", 0)], undefined, at("fast"), 75),
                n("pass", [p("cli normalize glob", 1), p("absolute directory", 1), p("normalizes a glob", 1)], undefined, at("fast"), 75),
                n("pass", [p("cli normalize glob", 1), p("absolute directory", 1), p("retains trailing slashes", 2)], undefined, at("fast"), 75),
                n("pass", [p("cli normalize glob", 1), p("absolute directory", 1), p("retains negative", 3)], undefined, at("fast"), 75),
                n("pass", [p("cli normalize glob", 1), p("absolute directory", 1), p("retains negative + trailing slashes", 4)], undefined, at("fast"), 75),
                n("leave", [p("cli normalize glob", 1), p("absolute directory", 1)]),
                n("enter", [p("cli normalize glob", 1), p("relative directory", 2)], undefined, at("fast"), 75),
                n("pass", [p("cli normalize glob", 1), p("relative directory", 2), p("normalizes a file", 0)], undefined, at("fast"), 75),
                n("pass", [p("cli normalize glob", 1), p("relative directory", 2), p("normalizes a glob", 1)], undefined, at("fast"), 75),
                n("pass", [p("cli normalize glob", 1), p("relative directory", 2), p("retains trailing slashes", 2)], undefined, at("fast"), 75),
                n("pass", [p("cli normalize glob", 1), p("relative directory", 2), p("retains negative", 3)], undefined, at("fast"), 75),
                n("pass", [p("cli normalize glob", 1), p("relative directory", 2), p("retains negative + trailing slashes", 4)], undefined, at("fast"), 75),
                n("leave", [p("cli normalize glob", 1), p("relative directory", 2)]),
                n("enter", [p("cli normalize glob", 1), p("edge cases", 3)], undefined, at("fast"), 75),
                n("pass", [p("cli normalize glob", 1), p("edge cases", 3), p("normalizes `.` with a cwd of `.`", 0)], undefined, at("fast"), 75),
                n("pass", [p("cli normalize glob", 1), p("edge cases", 3), p("normalizes `..` with a cwd of `.`", 1)], undefined, at("fast"), 75),
                n("pass", [p("cli normalize glob", 1), p("edge cases", 3), p("normalizes `.` with a cwd of `..`", 2)], undefined, at("fast"), 75),
                n("pass", [p("cli normalize glob", 1), p("edge cases", 3), p("normalizes directories with a cwd of `..`", 3)], undefined, at("fast"), 75),
                n("pass", [p("cli normalize glob", 1), p("edge cases", 3), p("removes excess `.`", 4)], undefined, at("fast"), 75),
                n("pass", [p("cli normalize glob", 1), p("edge cases", 3), p("removes excess `..`", 5)], undefined, at("fast"), 75),
                n("pass", [p("cli normalize glob", 1), p("edge cases", 3), p("removes excess combined junk", 6)], undefined, at("fast"), 75),
                n("leave", [p("cli normalize glob", 1), p("edge cases", 3)]),
                n("leave", [p("cli normalize glob", 1)]),
                n("enter", [p("core (timeouts)", 2)], undefined, at("fast"), 75),
                n("pass", [p("core (timeouts)", 2), p("succeeds with own", 0)], undefined, at("medium"), 75),
                n("pass", [p("core (timeouts)", 2), p("fails with own", 1)], undefined, at("medium"), 75),
                n("pass", [p("core (timeouts)", 2), p("succeeds with inherited", 2)], undefined, at("slow"), 75),
                n("pass", [p("core (timeouts)", 2), p("fails with inherited", 3)], undefined, at("slow"), 75),
                n("pass", [p("core (timeouts)", 2), p("gets own set timeout", 4)], undefined, at("fast"), 75),
                n("pass", [p("core (timeouts)", 2), p("gets own inline set timeout", 5)], undefined, at("fast"), 75),
                n("pass", [p("core (timeouts)", 2), p("gets own sync inner timeout", 6)], undefined, at("fast"), 75),
                n("pass", [p("core (timeouts)", 2), p("gets default timeout", 7)], undefined, at("medium"), 75),
                n("leave", [p("core (timeouts)", 2)]),
                n("end", []),
            ],

            output: [
                "",
                "  " +
                // core (basic)
                    fast +
                    fast + fast + fast + fast + fast + medium + medium + fast +
                    fast + fast +

                // cli normalize glob
                    fast +

                // cli normalize glob current directory
                    fast +
                    fast + fast + fast + fast + fast +

                // cli normalize glob absolute directory
                    fast +
                    fast + fast + fast + fast + fast +

                // cli normalize glob relative directory
                    fast +
                    fast + fast + fast + fast + fast +

                // cli normalize glob edge cases
                    fast +
                    fast + fast + fast + fast + fast + fast + fast +

                // core (timeouts)
                    fast +
                    medium + medium + slow + slow + fast + fast + fast + medium,
                "",
                c("bright pass", "  ") + c("green", "47 passing") + time("1s"),
                "",
            ],

            /* eslint-enable max-len */
        })
    })
})
