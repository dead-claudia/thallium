// Note: the reports *must* be well formed. The reporter assumes the reports are
// correct, and it will *not* verify this.

describe("reporter/dot", function () {
    "use strict"

    var p = Util.p
    var n = Util.n
    var c = Util.R.color

    it("is not itself a reporter", function () {
        var dot = Util.r.dot

        assert.throws(TypeError, function () { dot(n.start()) })
        assert.throws(TypeError, function () { dot(n.enter([p("test", 0)])) })
        assert.throws(TypeError, function () { dot(n.leave([p("test", 0)])) })
        assert.throws(TypeError, function () { dot(n.pass([p("test", 0)])) })
        assert.throws(TypeError, function () { dot(n.fail([p("test", 0)])) })
        assert.throws(TypeError, function () { dot(n.skip([p("test", 0)])) })
        assert.throws(TypeError, function () { dot(n.end()) })
    })

    it("validates no arguments", function () {
        Util.r.dot()
    })

    it("validates a single empty options object", function () {
        Util.r.dot({})
    })

    function stack(e) {
        var lines = Util.R.readStack(e).trimRight().split(/\r?\n/g)

        for (var i = 0; i < lines.length; i++) {
            lines[i] = lines[i].trimRight()
            if (lines[i]) lines[i] = "      " + c("fail", lines[i])
        }

        return lines
    }

    function time(duration) {
        return c("light", " (" + duration + ")")
    }

    function makeTest(colors) {
        return function (name, opts) {
            it(name, function () {
                var list = []
                var acc = ""
                var reporter = Util.r.dot({
                    colors: colors,

                    write: function (str) {
                        // So lines are printed consistently.
                        var lines = (acc + str).split(/\r?\n/g)

                        acc = lines.pop()
                        list.push.apply(list, lines)
                    },

                    reset: function () {
                        if (acc !== "") {
                            list.push(acc)
                            acc = ""
                        }
                    },
                })

                return Util.peach(opts.input, reporter).then(function () {
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
        var fail = c("fail", Util.R.symbols().DotFail)
        var skip = c("skip", Util.R.symbols().Dot)
        var test = makeTest(reporterColors)

        // So I can verify colors are enabled.
        if (envColors || reporterColors) {
            test("empty test", {
                input: [
                    n.start(),
                    n.end(),
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
                    n.start(),
                    n.end(),
                ],
                output: [
                    "",
                    "  0 tests (0ms)",
                    "",
                ],
            })
        }

        test("pass 2", {
            input: [
                n.start(),
                n.pass([p("test", 0)]),
                n.pass([p("test", 1)]),
                n.end(),
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
                n.start(),
                n.fail([p("one", 0)], sentinel),
                n.fail([p("two", 1)], sentinel),
                n.end(),
            ],
            output: [].concat([
                "",
                "  " + fail + fail,
                "",
                c("bright fail", "  ") + c("fail", "2 failing") + time("20ms"),
                "",
                "  " + c("plain", "1) one:"),
                "    " + c("fail", "Error: sentinel"),
            ], stack(sentinel), [
                "",
                "  " + c("plain", "2) two:"),
                "    " + c("fail", "Error: sentinel"),
            ], stack(sentinel), [
                "",
            ]),
        })

        test("pass + fail with Error", {
            input: [
                n.start(),
                n.pass([p("one", 0)]),
                n.fail([p("two", 1)], sentinel),
                n.end(),
            ],
            output: [].concat([
                "",
                "  " + pass + fail,
                "",
                c("bright pass", "  ") + c("green", "1 passing") + time("20ms"),
                c("bright fail", "  ") + c("fail", "1 failing"),
                "",
                "  " + c("plain", "1) two:"),
                "    " + c("fail", "Error: sentinel"),
            ], stack(sentinel), [
                "",
            ]),
        })

        test("fail with Error + pass", {
            input: [
                n.start(),
                n.fail([p("one", 0)], sentinel),
                n.pass([p("two", 1)]),
                n.end(),
            ],
            output: [].concat([
                "",
                "  " + fail + pass,
                "",
                c("bright pass", "  ") + c("green", "1 passing") + time("20ms"),
                c("bright fail", "  ") + c("fail", "1 failing"),
                "",
                "  " + c("plain", "1) one:"),
                "    " + c("fail", "Error: sentinel"),
            ], stack(sentinel), [
                "",
            ]),
        })

        var AssertionError = assert.AssertionError
        var assertion = new AssertionError("Expected 1 to equal 2", 1, 2)

        test("fail 2 with AssertionError", {
            input: [
                n.start(),
                n.fail([p("one", 0)], assertion),
                n.fail([p("two", 1)], assertion),
                n.end(),
            ],
            output: [].concat([
                "",
                "  " + fail + fail,
                "",
                c("bright fail", "  ") + c("fail", "2 failing") + time("20ms"),
                "",
                "  " + c("plain", "1) one:"),
                "    " + c("fail", "AssertionError: Expected 1 to equal 2"),
                "",
                "      " + c("diff added", "+ expected") + " " +
                    c("diff removed", "- actual"),
                "",
                "      " + c("diff removed", "-2"),
                "      " + c("diff added", "+1"),
                "",
            ], stack(assertion), [
                "",
                "  " + c("plain", "2) two:"),
                "    " + c("fail", "AssertionError: Expected 1 to equal 2"),
                "",
                "      " + c("diff added", "+ expected") + " " +
                    c("diff removed", "- actual"),
                "",
                "      " + c("diff removed", "-2"),
                "      " + c("diff added", "+1"),
                "",
            ], stack(assertion), [
                "",
            ]),
        })

        test("pass + fail with AssertionError", {
            input: [
                n.start(),
                n.pass([p("one", 0)]),
                n.fail([p("two", 1)], assertion),
                n.end(),
            ],
            output: [].concat([
                "",
                "  " + pass + fail,
                "",
                c("bright pass", "  ") + c("green", "1 passing") + time("20ms"),
                c("bright fail", "  ") + c("fail", "1 failing"),
                "",
                "  " + c("plain", "1) two:"),
                "    " + c("fail", "AssertionError: Expected 1 to equal 2"),
                "",
                "      " + c("diff added", "+ expected") + " " +
                    c("diff removed", "- actual"),
                "",
                "      " + c("diff removed", "-2"),
                "      " + c("diff added", "+1"),
                "",
            ], stack(assertion), [
                "",
            ]),
        })

        test("fail with AssertionError + pass", {
            input: [
                n.start(),
                n.fail([p("one", 0)], assertion),
                n.pass([p("two", 1)]),
                n.end(),
            ],
            output: [].concat([
                "",
                "  " + fail + pass,
                "",
                c("bright pass", "  ") + c("green", "1 passing") + time("20ms"),
                c("bright fail", "  ") + c("fail", "1 failing"),
                "",
                "  " + c("plain", "1) one:"),
                "    " + c("fail", "AssertionError: Expected 1 to equal 2"),
                "",
                "      " + c("diff added", "+ expected") + " " +
                    c("diff removed", "- actual"),
                "",
                "      " + c("diff removed", "-2"),
                "      " + c("diff added", "+1"),
                "",
            ], stack(assertion), [
                "",
            ]),
        })

        test("skip 2", {
            input: [
                n.start(),
                n.skip([p("one", 0)]),
                n.skip([p("two", 1)]),
                n.end(),
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
                n.start(),
                n.pass([p("one", 0)]),
                n.skip([p("two", 1)]),
                n.end(),
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
                n.start(),
                n.skip([p("one", 0)]),
                n.pass([p("two", 1)]),
                n.end(),
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
                n.start(),
                n.fail([p("one", 0)], sentinel),
                n.skip([p("two", 1)]),
                n.end(),
            ],
            output: [].concat([
                "",
                "  " + fail + skip,
                "",
                c("skip", "  1 skipped") + time("10ms"),
                c("bright fail", "  ") + c("fail", "1 failing"),
                "",
                "  " + c("plain", "1) one:"),
                "    " + c("fail", "Error: sentinel"),
            ], stack(sentinel), [
                "",
            ]),
        })

        test("skip + fail", {
            input: [
                n.start(),
                n.skip([p("one", 0)]),
                n.fail([p("two", 1)], sentinel),
                n.end(),
            ],
            output: [].concat([
                "",
                "  " + skip + fail,
                "",
                c("skip", "  1 skipped") + time("10ms"),
                c("bright fail", "  ") + c("fail", "1 failing"),
                "",
                "  " + c("plain", "1) two:"),
                "    " + c("fail", "Error: sentinel"),
            ], stack(sentinel), [
                "",
            ]),
        })

        var badType = new TypeError("undefined is not a function")

        test("internal errors", {
            input: [
                n.start(),
                n.enter([p("test", 0)]),
                n.enter([p("test", 0), p("inner", 0)]),
                n.fail([p("test", 0), p("inner", 0), p("fail", 0)], badType),
                n.error(badType),
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
                n.start(),
                n.enter([p("core (basic)", 0)]),
                n.pass([p("core (basic)", 0), p("has `base()`", 0)]),
                n.pass([p("core (basic)", 0), p("has `test()`", 1)]),
                n.pass([p("core (basic)", 0), p("has `parent()`", 2)]),
                n.pass([p("core (basic)", 0), p("can accept a string + function", 3)]),
                n.pass([p("core (basic)", 0), p("can accept a string", 4)]),
                n.pass([p("core (basic)", 0), p("returns the current instance when given a callback", 5)]),
                n.pass([p("core (basic)", 0), p("returns a prototypal clone when not given a callback", 6)]),
                n.pass([p("core (basic)", 0), p("runs block tests within tests", 7)]),
                n.pass([p("core (basic)", 0), p("runs successful inline tests within tests", 8)]),
                n.pass([p("core (basic)", 0), p("accepts a callback with `run()`", 9)]),
                n.leave([p("core (basic)", 0)]),
                n.enter([p("cli normalize glob", 1)]),
                n.enter([p("cli normalize glob", 1), p("current directory", 0)]),
                n.pass([p("cli normalize glob", 1), p("current directory", 0), p("normalizes a file", 0)]),
                n.pass([p("cli normalize glob", 1), p("current directory", 0), p("normalizes a glob", 1)]),
                n.pass([p("cli normalize glob", 1), p("current directory", 0), p("retains trailing slashes", 2)]),
                n.pass([p("cli normalize glob", 1), p("current directory", 0), p("retains negative", 3)]),
                n.pass([p("cli normalize glob", 1), p("current directory", 0), p("retains negative + trailing slashes", 4)]),
                n.leave([p("cli normalize glob", 1), p("current directory", 0)]),
                n.enter([p("cli normalize glob", 1), p("absolute directory", 1)]),
                n.pass([p("cli normalize glob", 1), p("absolute directory", 1), p("normalizes a file", 0)]),
                n.pass([p("cli normalize glob", 1), p("absolute directory", 1), p("normalizes a glob", 1)]),
                n.pass([p("cli normalize glob", 1), p("absolute directory", 1), p("retains trailing slashes", 2)]),
                n.pass([p("cli normalize glob", 1), p("absolute directory", 1), p("retains negative", 3)]),
                n.pass([p("cli normalize glob", 1), p("absolute directory", 1), p("retains negative + trailing slashes", 4)]),
                n.leave([p("cli normalize glob", 1), p("absolute directory", 1)]),
                n.enter([p("cli normalize glob", 1), p("relative directory", 2)]),
                n.pass([p("cli normalize glob", 1), p("relative directory", 2), p("normalizes a file", 0)]),
                n.pass([p("cli normalize glob", 1), p("relative directory", 2), p("normalizes a glob", 1)]),
                n.pass([p("cli normalize glob", 1), p("relative directory", 2), p("retains trailing slashes", 2)]),
                n.pass([p("cli normalize glob", 1), p("relative directory", 2), p("retains negative", 3)]),
                n.pass([p("cli normalize glob", 1), p("relative directory", 2), p("retains negative + trailing slashes", 4)]),
                n.leave([p("cli normalize glob", 1), p("relative directory", 2)]),
                n.enter([p("cli normalize glob", 1), p("edge cases", 3)]),
                n.pass([p("cli normalize glob", 1), p("edge cases", 3), p("normalizes `.` with a cwd of `.`", 0)]),
                n.pass([p("cli normalize glob", 1), p("edge cases", 3), p("normalizes `..` with a cwd of `.`", 1)]),
                n.pass([p("cli normalize glob", 1), p("edge cases", 3), p("normalizes `.` with a cwd of `..`", 2)]),
                n.pass([p("cli normalize glob", 1), p("edge cases", 3), p("normalizes directories with a cwd of `..`", 3)]),
                n.pass([p("cli normalize glob", 1), p("edge cases", 3), p("removes excess `.`", 4)]),
                n.pass([p("cli normalize glob", 1), p("edge cases", 3), p("removes excess `..`", 5)]),
                n.pass([p("cli normalize glob", 1), p("edge cases", 3), p("removes excess combined junk", 6)]),
                n.leave([p("cli normalize glob", 1), p("edge cases", 3)]),
                n.leave([p("cli normalize glob", 1)]),
                n.enter([p("core (timeouts)", 2)]),
                n.pass([p("core (timeouts)", 2), p("succeeds with own", 0)]),
                n.pass([p("core (timeouts)", 2), p("fails with own", 1)]),
                n.pass([p("core (timeouts)", 2), p("succeeds with inherited", 2)]),
                n.pass([p("core (timeouts)", 2), p("fails with inherited", 3)]),
                n.pass([p("core (timeouts)", 2), p("gets own set timeout", 4)]),
                n.pass([p("core (timeouts)", 2), p("gets own inline set timeout", 5)]),
                n.pass([p("core (timeouts)", 2), p("gets own sync inner timeout", 6)]),
                n.pass([p("core (timeouts)", 2), p("gets default timeout", 7)]),
                n.leave([p("core (timeouts)", 2)]),
                n.end(),
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
                n.start(),
                n.enter([p("core (basic)", 0)]),
                n.pass([p("core (basic)", 0), p("has `base()`", 0)]),
                n.pass([p("core (basic)", 0), p("has `test()`", 1)]),
                n.pass([p("core (basic)", 0), p("has `parent()`", 2)]),
                n.skip([p("core (basic)", 0), p("can accept a string + function", 3)]),
                n.pass([p("core (basic)", 0), p("can accept a string", 4)]),
                n.pass([p("core (basic)", 0), p("returns the current instance when given a callback", 5)]),
                n.fail([p("core (basic)", 0), p("returns a prototypal clone when not given a callback", 6)], badType),
                n.pass([p("core (basic)", 0), p("runs block tests within tests", 7)]),
                n.pass([p("core (basic)", 0), p("runs successful inline tests within tests", 8)]),
                n.pass([p("core (basic)", 0), p("accepts a callback with `run()`", 9)]),
                n.leave([p("core (basic)", 0)]),
                n.enter([p("cli normalize glob", 1)]),
                n.enter([p("cli normalize glob", 1), p("current directory", 0)]),
                n.fail([p("cli normalize glob", 1), p("current directory", 0), p("normalizes a file", 0)], sentinel),
                n.pass([p("cli normalize glob", 1), p("current directory", 0), p("normalizes a glob", 1)]),
                n.pass([p("cli normalize glob", 1), p("current directory", 0), p("retains trailing slashes", 2)]),
                n.pass([p("cli normalize glob", 1), p("current directory", 0), p("retains negative", 3)]),
                n.pass([p("cli normalize glob", 1), p("current directory", 0), p("retains negative + trailing slashes", 4)]),
                n.leave([p("cli normalize glob", 1), p("current directory", 0)]),
                n.enter([p("cli normalize glob", 1), p("absolute directory", 1)]),
                n.pass([p("cli normalize glob", 1), p("absolute directory", 1), p("normalizes a file", 0)]),
                n.pass([p("cli normalize glob", 1), p("absolute directory", 1), p("normalizes a glob", 1)]),
                n.pass([p("cli normalize glob", 1), p("absolute directory", 1), p("retains trailing slashes", 2)]),
                n.skip([p("cli normalize glob", 1), p("absolute directory", 1), p("retains negative", 3)]),
                n.pass([p("cli normalize glob", 1), p("absolute directory", 1), p("retains negative + trailing slashes", 4)]),
                n.leave([p("cli normalize glob", 1), p("absolute directory", 1)]),
                n.enter([p("cli normalize glob", 1), p("relative directory", 2)]),
                n.pass([p("cli normalize glob", 1), p("relative directory", 2), p("normalizes a file", 0)]),
                n.pass([p("cli normalize glob", 1), p("relative directory", 2), p("normalizes a glob", 1)]),
                n.pass([p("cli normalize glob", 1), p("relative directory", 2), p("retains trailing slashes", 2)]),
                n.pass([p("cli normalize glob", 1), p("relative directory", 2), p("retains negative", 3)]),
                n.fail([p("cli normalize glob", 1), p("relative directory", 2), p("retains negative + trailing slashes", 4)], badType),
                n.leave([p("cli normalize glob", 1), p("relative directory", 2)]),
                n.enter([p("cli normalize glob", 1), p("edge cases", 3)]),
                n.pass([p("cli normalize glob", 1), p("edge cases", 3), p("normalizes `.` with a cwd of `.`", 0)]),
                n.pass([p("cli normalize glob", 1), p("edge cases", 3), p("normalizes `..` with a cwd of `.`", 1)]),
                n.pass([p("cli normalize glob", 1), p("edge cases", 3), p("normalizes `.` with a cwd of `..`", 2)]),
                n.pass([p("cli normalize glob", 1), p("edge cases", 3), p("normalizes directories with a cwd of `..`", 3)]),
                n.pass([p("cli normalize glob", 1), p("edge cases", 3), p("removes excess `.`", 4)]),
                n.pass([p("cli normalize glob", 1), p("edge cases", 3), p("removes excess `..`", 5)]),
                n.pass([p("cli normalize glob", 1), p("edge cases", 3), p("removes excess combined junk", 6)]),
                n.leave([p("cli normalize glob", 1), p("edge cases", 3)]),
                n.leave([p("cli normalize glob", 1)]),
                n.enter([p("core (timeouts)", 2)]),
                n.skip([p("core (timeouts)", 2), p("succeeds with own", 0)]),
                n.pass([p("core (timeouts)", 2), p("fails with own", 1)]),
                n.pass([p("core (timeouts)", 2), p("succeeds with inherited", 2)]),
                n.pass([p("core (timeouts)", 2), p("fails with inherited", 3)]),
                n.pass([p("core (timeouts)", 2), p("gets own set timeout", 4)]),
                n.fail([p("core (timeouts)", 2), p("gets own inline set timeout", 5)], sentinel),
                n.skip([p("core (timeouts)", 2), p("gets own sync inner timeout", 6)]),
                n.pass([p("core (timeouts)", 2), p("gets default timeout", 7)]),
                n.leave([p("core (timeouts)", 2)]),
                n.end(),
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
                c("bright fail", "  ") + c("fail", "4 failing"),
                "",
                "  " + c("plain", "1) core (basic) returns a prototypal clone when not given a callback:"),
                "    " + c("fail", "TypeError: undefined is not a function"),
            ], stack(badType), [
                "",
                "  " + c("plain", "2) cli normalize glob current directory normalizes a file:"),
                "    " + c("fail", "Error: sentinel"),
            ], stack(sentinel), [
                "",
                "  " + c("plain", "3) cli normalize glob relative directory retains negative + trailing slashes:"),
                "    " + c("fail", "TypeError: undefined is not a function"),
            ], stack(badType), [
                "",
                "  " + c("plain", "4) core (timeouts) gets own inline set timeout:"),
                "    " + c("fail", "Error: sentinel"),
            ], stack(sentinel), [
                "",
            ]),

            /* eslint-enable max-len */
        })

        context("restarting", function () {
            test("empty test", {
                input: [
                    n.start(),
                    n.end(),
                    n.start(),
                    n.end(),
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

            test("pass 2", {
                input: [
                    n.start(),
                    n.pass([p("test", 0)]),
                    n.pass([p("test", 1)]),
                    n.end(),
                    n.start(),
                    n.pass([p("test", 0)]),
                    n.pass([p("test", 1)]),
                    n.end(),
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
                    n.start(),
                    n.fail([p("one", 0)], sentinel),
                    n.fail([p("two", 1)], sentinel),
                    n.end(),
                    n.start(),
                    n.fail([p("one", 0)], sentinel),
                    n.fail([p("two", 1)], sentinel),
                    n.end(),
                ],
                output: [].concat([
                    "",
                    "  " + fail + fail,
                    "",
                    c("bright fail", "  ") + c("fail", "2 failing") +
                        time("20ms"),
                    "",
                    "  " + c("plain", "1) one:"),
                    "    " + c("fail", "Error: sentinel"),
                ], stack(sentinel), [
                    "",
                    "  " + c("plain", "2) two:"),
                    "    " + c("fail", "Error: sentinel"),
                ], stack(sentinel), [
                    "",
                    "",
                    "  " + fail + fail,
                    "",
                    c("bright fail", "  ") + c("fail", "2 failing") +
                        time("20ms"),
                    "",
                    "  " + c("plain", "1) one:"),
                    "    " + c("fail", "Error: sentinel"),
                ], stack(sentinel), [
                    "",
                    "  " + c("plain", "2) two:"),
                    "    " + c("fail", "Error: sentinel"),
                ], stack(sentinel), [
                    "",
                ]),
            })

            test("pass + fail with Error", {
                input: [
                    n.start(),
                    n.pass([p("one", 0)]),
                    n.fail([p("two", 1)], sentinel),
                    n.end(),
                    n.start(),
                    n.pass([p("one", 0)]),
                    n.fail([p("two", 1)], sentinel),
                    n.end(),
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
                    "    " + c("fail", "Error: sentinel"),
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
                    "    " + c("fail", "Error: sentinel"),
                ], stack(sentinel), [
                    "",
                ]),
            })

            test("fail with Error + pass", {
                input: [
                    n.start(),
                    n.fail([p("one", 0)], sentinel),
                    n.pass([p("two", 1)]),
                    n.end(),
                    n.start(),
                    n.fail([p("one", 0)], sentinel),
                    n.pass([p("two", 1)]),
                    n.end(),
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
                    "    " + c("fail", "Error: sentinel"),
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
                    "    " + c("fail", "Error: sentinel"),
                ], stack(sentinel), [
                    "",
                ]),
            })

            var assertion = new AssertionError("Expected 1 to equal 2", 1, 2)

            test("fail 2 with AssertionError", {
                input: [
                    n.start(),
                    n.fail([p("one", 0)], assertion),
                    n.fail([p("two", 1)], assertion),
                    n.end(),
                    n.start(),
                    n.fail([p("one", 0)], assertion),
                    n.fail([p("two", 1)], assertion),
                    n.end(),
                ],
                output: [].concat([
                    "",
                    "  " + fail + fail,
                    "",
                    c("bright fail", "  ") + c("fail", "2 failing") +
                        time("20ms"),
                    "",
                    "  " + c("plain", "1) one:"),
                    "    " + c("fail", "AssertionError: Expected 1 to equal 2"),
                    "",
                    "      " + c("diff added", "+ expected") + " " +
                        c("diff removed", "- actual"),
                    "",
                    "      " + c("diff removed", "-2"),
                    "      " + c("diff added", "+1"),
                    "",
                ], stack(assertion), [
                    "",
                    "  " + c("plain", "2) two:"),
                    "    " + c("fail", "AssertionError: Expected 1 to equal 2"),
                    "",
                    "      " + c("diff added", "+ expected") + " " +
                        c("diff removed", "- actual"),
                    "",
                    "      " + c("diff removed", "-2"),
                    "      " + c("diff added", "+1"),
                    "",
                ], stack(assertion), [
                    "",
                    "",
                    "  " + fail + fail,
                    "",
                    c("bright fail", "  ") + c("fail", "2 failing") +
                        time("20ms"),
                    "",
                    "  " + c("plain", "1) one:"),
                    "    " + c("fail", "AssertionError: Expected 1 to equal 2"),
                    "",
                    "      " + c("diff added", "+ expected") + " " +
                        c("diff removed", "- actual"),
                    "",
                    "      " + c("diff removed", "-2"),
                    "      " + c("diff added", "+1"),
                    "",
                ], stack(assertion), [
                    "",
                    "  " + c("plain", "2) two:"),
                    "    " + c("fail", "AssertionError: Expected 1 to equal 2"),
                    "",
                    "      " + c("diff added", "+ expected") + " " +
                        c("diff removed", "- actual"),
                    "",
                    "      " + c("diff removed", "-2"),
                    "      " + c("diff added", "+1"),
                    "",
                ], stack(assertion), [
                    "",
                ]),
            })

            test("pass + fail with AssertionError", {
                input: [
                    n.start(),
                    n.pass([p("one", 0)]),
                    n.fail([p("two", 1)], assertion),
                    n.end(),
                    n.start(),
                    n.pass([p("one", 0)]),
                    n.fail([p("two", 1)], assertion),
                    n.end(),
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
                    "    " + c("fail", "AssertionError: Expected 1 to equal 2"),
                    "",
                    "      " + c("diff added", "+ expected") + " " +
                        c("diff removed", "- actual"),
                    "",
                    "      " + c("diff removed", "-2"),
                    "      " + c("diff added", "+1"),
                    "",
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
                    "    " + c("fail", "AssertionError: Expected 1 to equal 2"),
                    "",
                    "      " + c("diff added", "+ expected") + " " +
                        c("diff removed", "- actual"),
                    "",
                    "      " + c("diff removed", "-2"),
                    "      " + c("diff added", "+1"),
                    "",
                ], stack(assertion), [
                    "",
                ]),
            })

            test("fail with AssertionError + pass", {
                input: [
                    n.start(),
                    n.fail([p("one", 0)], assertion),
                    n.pass([p("two", 1)]),
                    n.end(),
                    n.start(),
                    n.fail([p("one", 0)], assertion),
                    n.pass([p("two", 1)]),
                    n.end(),
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
                    "    " + c("fail", "AssertionError: Expected 1 to equal 2"),
                    "",
                    "      " + c("diff added", "+ expected") + " " +
                        c("diff removed", "- actual"),
                    "",
                    "      " + c("diff removed", "-2"),
                    "      " + c("diff added", "+1"),
                    "",
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
                    "    " + c("fail", "AssertionError: Expected 1 to equal 2"),
                    "",
                    "      " + c("diff added", "+ expected") + " " +
                        c("diff removed", "- actual"),
                    "",
                    "      " + c("diff removed", "-2"),
                    "      " + c("diff added", "+1"),
                    "",
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
                n.start(),
                n.enter([p("core (basic)", 0)], at("fast")),
                n.pass([p("core (basic)", 0), p("has `base()`", 0)], at("fast")),
                n.pass([p("core (basic)", 0), p("has `test()`", 1)], at("fast")),
                n.pass([p("core (basic)", 0), p("has `parent()`", 2)], at("fast")),
                n.pass([p("core (basic)", 0), p("can accept a string + function", 3)], at("fast")),
                n.pass([p("core (basic)", 0), p("can accept a string", 4)], at("fast")),
                n.pass([p("core (basic)", 0), p("returns the current instance when given a callback", 5)], at("medium")),
                n.pass([p("core (basic)", 0), p("returns a prototypal clone when not given a callback", 6)], at("medium")),
                n.pass([p("core (basic)", 0), p("runs block tests within tests", 7)], at("fast")),
                n.pass([p("core (basic)", 0), p("runs successful inline tests within tests", 8)], at("fast")),
                n.pass([p("core (basic)", 0), p("accepts a callback with `run()`", 9)], at("fast")),
                n.leave([p("core (basic)", 0)]),
                n.enter([p("cli normalize glob", 1)], at("fast")),
                n.enter([p("cli normalize glob", 1), p("current directory", 0)], at("fast")),
                n.pass([p("cli normalize glob", 1), p("current directory", 0), p("normalizes a file", 0)], at("fast")),
                n.pass([p("cli normalize glob", 1), p("current directory", 0), p("normalizes a glob", 1)], at("fast")),
                n.pass([p("cli normalize glob", 1), p("current directory", 0), p("retains trailing slashes", 2)], at("fast")),
                n.pass([p("cli normalize glob", 1), p("current directory", 0), p("retains negative", 3)], at("fast")),
                n.pass([p("cli normalize glob", 1), p("current directory", 0), p("retains negative + trailing slashes", 4)], at("fast")),
                n.leave([p("cli normalize glob", 1), p("current directory", 0)]),
                n.enter([p("cli normalize glob", 1), p("absolute directory", 1)], at("fast")),
                n.pass([p("cli normalize glob", 1), p("absolute directory", 1), p("normalizes a file", 0)], at("fast")),
                n.pass([p("cli normalize glob", 1), p("absolute directory", 1), p("normalizes a glob", 1)], at("fast")),
                n.pass([p("cli normalize glob", 1), p("absolute directory", 1), p("retains trailing slashes", 2)], at("fast")),
                n.pass([p("cli normalize glob", 1), p("absolute directory", 1), p("retains negative", 3)], at("fast")),
                n.pass([p("cli normalize glob", 1), p("absolute directory", 1), p("retains negative + trailing slashes", 4)], at("fast")),
                n.leave([p("cli normalize glob", 1), p("absolute directory", 1)]),
                n.enter([p("cli normalize glob", 1), p("relative directory", 2)], at("fast")),
                n.pass([p("cli normalize glob", 1), p("relative directory", 2), p("normalizes a file", 0)], at("fast")),
                n.pass([p("cli normalize glob", 1), p("relative directory", 2), p("normalizes a glob", 1)], at("fast")),
                n.pass([p("cli normalize glob", 1), p("relative directory", 2), p("retains trailing slashes", 2)], at("fast")),
                n.pass([p("cli normalize glob", 1), p("relative directory", 2), p("retains negative", 3)], at("fast")),
                n.pass([p("cli normalize glob", 1), p("relative directory", 2), p("retains negative + trailing slashes", 4)], at("fast")),
                n.leave([p("cli normalize glob", 1), p("relative directory", 2)]),
                n.enter([p("cli normalize glob", 1), p("edge cases", 3)], at("fast")),
                n.pass([p("cli normalize glob", 1), p("edge cases", 3), p("normalizes `.` with a cwd of `.`", 0)], at("fast")),
                n.pass([p("cli normalize glob", 1), p("edge cases", 3), p("normalizes `..` with a cwd of `.`", 1)], at("fast")),
                n.pass([p("cli normalize glob", 1), p("edge cases", 3), p("normalizes `.` with a cwd of `..`", 2)], at("fast")),
                n.pass([p("cli normalize glob", 1), p("edge cases", 3), p("normalizes directories with a cwd of `..`", 3)], at("fast")),
                n.pass([p("cli normalize glob", 1), p("edge cases", 3), p("removes excess `.`", 4)], at("fast")),
                n.pass([p("cli normalize glob", 1), p("edge cases", 3), p("removes excess `..`", 5)], at("fast")),
                n.pass([p("cli normalize glob", 1), p("edge cases", 3), p("removes excess combined junk", 6)], at("fast")),
                n.leave([p("cli normalize glob", 1), p("edge cases", 3)]),
                n.leave([p("cli normalize glob", 1)]),
                n.enter([p("core (timeouts)", 2)], at("fast")),
                n.pass([p("core (timeouts)", 2), p("succeeds with own", 0)], at("medium")),
                n.pass([p("core (timeouts)", 2), p("fails with own", 1)], at("medium")),
                n.pass([p("core (timeouts)", 2), p("succeeds with inherited", 2)], at("slow")),
                n.pass([p("core (timeouts)", 2), p("fails with inherited", 3)], at("slow")),
                n.pass([p("core (timeouts)", 2), p("gets own set timeout", 4)], at("fast")),
                n.pass([p("core (timeouts)", 2), p("gets own inline set timeout", 5)], at("fast")),
                n.pass([p("core (timeouts)", 2), p("gets own sync inner timeout", 6)], at("fast")),
                n.pass([p("core (timeouts)", 2), p("gets default timeout", 7)], at("medium")),
                n.leave([p("core (timeouts)", 2)]),
                n.end(),
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
