// Note: the reports *must* be well formed. The reporter assumes the reports are
// correct, and it will *not* verify this.

describe("reporter spec", function () {
    "use strict"

    var c = Util.R.color
    var p = Util.p
    var n = Util.n

    it("is not itself a reporter", function () {
        var spec = Util.r.spec

        assert.throws(TypeError, function () { spec(n.start()) })
        assert.throws(TypeError, function () { spec(n.enter([p("test", 0)])) })
        assert.throws(TypeError, function () { spec(n.leave([p("test", 0)])) })
        assert.throws(TypeError, function () { spec(n.pass([p("test", 0)])) })
        assert.throws(TypeError, function () { spec(n.fail([p("test", 0)])) })
        assert.throws(TypeError, function () { spec(n.skip([p("test", 0)])) })
        assert.throws(TypeError, function () { spec(n.end()) })
    })

    it("validates no arguments", function () {
        Util.r.spec()
    })

    it("validates a single empty options object", function () {
        Util.r.spec({})
    })

    function stack(e) {
        var lines = Util.R.getStack(e).split(/\r?\n/g)

        lines[0] = "    " + c("fail", lines[0])

        for (var i = 1; i < lines.length; i++) {
            lines[i] = "      " + c("fail", lines[i])
        }

        return lines
    }

    function pass(name) {
        return c("checkmark", Util.R.symbols().Pass + " ") + c("pass", name)
    }

    function time(duration) {
        return c("light", " (" + duration + ")")
    }

    function makeTest(colors) {
        return function (name, opts) {
            it(name, function () {
                var list = []
                var acc = ""
                var reporter = Util.r.spec({
                    colors: colors,
                    write: function (str) {
                        // So lines are printed consistently.
                        var lines = (acc + str).split(/\r?\n/g)

                        acc = lines.pop()
                        list.push.apply(list, lines)
                    },
                    reset: function () {},
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

        test("passing 2", {
            input: [
                n.start(),
                n.pass([p("test", 0)]),
                n.pass([p("test", 1)]),
                n.end(),
            ],
            output: [
                "",
                "  " + pass("test"),
                "  " + pass("test"),
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
                "  " + c("fail", "1) one"),
                "  " + c("fail", "2) two"),
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
                n.start(),
                n.pass([p("one", 0)]),
                n.fail([p("two", 1)], sentinel),
                n.end(),
            ],
            output: [].concat([
                "",
                "  " + pass("one"),
                "  " + c("fail", "1) two"),
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
                n.start(),
                n.fail([p("one", 0)], sentinel),
                n.pass([p("two", 1)]),
                n.end(),
            ],
            output: [].concat([
                "",
                "  " + c("fail", "1) one"),
                "  " + pass("two"),
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
                n.start(),
                n.fail([p("one", 0)], assertion),
                n.fail([p("two", 1)], assertion),
                n.end(),
            ],
            output: [].concat([
                "",
                "  " + c("fail", "1) one"),
                "  " + c("fail", "2) two"),
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
                n.start(),
                n.pass([p("one", 0)]),
                n.fail([p("two", 1)], assertion),
                n.end(),
            ],
            output: [].concat([
                "",
                "  " + pass("one"),
                "  " + c("fail", "1) two"),
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
                n.start(),
                n.fail([p("one", 0)], assertion),
                n.pass([p("two", 1)]),
                n.end(),
            ],
            output: [].concat([
                "",
                "  " + c("fail", "1) one"),
                "  " + pass("two"),
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
                n.start(),
                n.skip([p("one", 0)]),
                n.skip([p("two", 1)]),
                n.end(),
            ],
            output: [
                "",
                "  " + c("skip", "- one"),
                "  " + c("skip", "- two"),
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
                "  " + pass("one"),
                "  " + c("skip", "- two"),
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
                "  " + c("skip", "- one"),
                "  " + pass("two"),
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
                "  " + c("fail", "1) one"),
                "  " + c("skip", "- two"),
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
                n.start(),
                n.skip([p("one", 0)]),
                n.fail([p("two", 1)], sentinel),
                n.end(),
            ],
            output: [].concat([
                "",
                "  " + c("skip", "- one"),
                "  " + c("fail", "1) two"),
                "",
                c("skip", "  1 skipped") + time("10ms"),
                c("bright fail", "  ") + c("fail", "1 failing"),
                "",
                "  " + c("plain", "1) two:"),
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
                "  test",
                "    inner",
                "      " + c("fail", "1) fail"),
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
                "    " + pass("accepts a callback with `run()`"),
                "",
                "  cli normalize glob",
                "    current directory",
                "      " + pass("normalizes a file"),
                "      " + pass("normalizes a glob"),
                "      " + pass("retains trailing slashes"),
                "      " + pass("retains negative"),
                "      " + pass("retains negative + trailing slashes"),
                "",
                "    absolute directory",
                "      " + pass("normalizes a file"),
                "      " + pass("normalizes a glob"),
                "      " + pass("retains trailing slashes"),
                "      " + pass("retains negative"),
                "      " + pass("retains negative + trailing slashes"),
                "",
                "    relative directory",
                "      " + pass("normalizes a file"),
                "      " + pass("normalizes a glob"),
                "      " + pass("retains trailing slashes"),
                "      " + pass("retains negative"),
                "      " + pass("retains negative + trailing slashes"),
                "",
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
                "    " + pass("accepts a callback with `run()`"),
                "",
                "  cli normalize glob",
                "    current directory",
                "      " + c("fail", "2) normalizes a file"),
                "      " + pass("normalizes a glob"),
                "      " + pass("retains trailing slashes"),
                "      " + pass("retains negative"),
                "      " + pass("retains negative + trailing slashes"),
                "",
                "    absolute directory",
                "      " + pass("normalizes a file"),
                "      " + pass("normalizes a glob"),
                "      " + pass("retains trailing slashes"),
                "      " + c("skip", "- retains negative"),
                "      " + pass("retains negative + trailing slashes"),
                "",
                "    relative directory",
                "      " + pass("normalizes a file"),
                "      " + pass("normalizes a glob"),
                "      " + pass("retains trailing slashes"),
                "      " + pass("retains negative"),
                "      " + c("fail", "3) retains negative + trailing slashes"),
                "",
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
                "    " + c("fail", "4) gets own inline set timeout"),
                "    " + c("skip", "- gets own sync inner timeout"),
                "    " + pass("gets default timeout"),
                "",
                c("bright pass", "  ") + c("green", "39 passing") + time("430ms"),
                c("skip", "  4 skipped"),
                c("bright fail", "  ") + c("fail", "4 failing"),
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
                "  " + c("plain", "4) core (timeouts) gets own inline set timeout:"),
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

            test("passing 2", {
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
                    "  " + pass("test"),
                    "  " + pass("test"),
                    "",
                    c("bright pass", "  ") + c("green", "2 passing") +
                        time("20ms"),
                    "",
                    "",
                    "  " + pass("test"),
                    "  " + pass("test"),
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
                    "  " + c("fail", "1) one"),
                    "  " + c("fail", "2) two"),
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
                    "  " + c("fail", "1) one"),
                    "  " + c("fail", "2) two"),
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
                    "  " + pass("one"),
                    "  " + c("fail", "1) two"),
                    "",
                    c("bright pass", "  ") + c("green", "1 passing") +
                        time("20ms"),
                    c("bright fail", "  ") + c("fail", "1 failing"),
                    "",
                    "  " + c("plain", "1) two:"),
                ], stack(sentinel), [
                    "",
                    "",
                    "  " + pass("one"),
                    "  " + c("fail", "1) two"),
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
                    "  " + c("fail", "1) one"),
                    "  " + pass("two"),
                    "",
                    c("bright pass", "  ") + c("green", "1 passing") +
                        time("20ms"),
                    c("bright fail", "  ") + c("fail", "1 failing"),
                    "",
                    "  " + c("plain", "1) one:"),
                ], stack(sentinel), [
                    "",
                    "",
                    "  " + c("fail", "1) one"),
                    "  " + pass("two"),
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
                    "  " + c("fail", "1) one"),
                    "  " + c("fail", "2) two"),
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
                    "  " + c("fail", "1) one"),
                    "  " + c("fail", "2) two"),
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
                    "  " + pass("one"),
                    "  " + c("fail", "1) two"),
                    "",
                    c("bright pass", "  ") + c("green", "1 passing") +
                        time("20ms"),
                    c("bright fail", "  ") + c("fail", "1 failing"),
                    "",
                    "  " + c("plain", "1) two:"),
                ], stack(assertion), [
                    "",
                    "",
                    "  " + pass("one"),
                    "  " + c("fail", "1) two"),
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
                    "  " + c("fail", "1) one"),
                    "  " + pass("two"),
                    "",
                    c("bright pass", "  ") + c("green", "1 passing") +
                        time("20ms"),
                    c("bright fail", "  ") + c("fail", "1 failing"),
                    "",
                    "  " + c("plain", "1) one:"),
                ], stack(assertion), [
                    "",
                    "",
                    "  " + c("fail", "1) one"),
                    "  " + pass("two"),
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
        })

        Util.R.Colors.forceRestore()
    }

    context("no env color + no color opt", function () { run(false, false) })
    context("with env color + no color opt", function () { run(true, false) })
    context("no env color + with color opt", function () { run(false, true) })
    context("with env color + with color opt", function () { run(true, true) })

    context("speed", function () {
        var test = makeTest(true)

        // Speed affects `"pass"` and `"enter"` events only.
        var medium = c("medium", " (40ms)")
        var slow = c("slow", " (80ms)")

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
                "  core (basic)",
                "    " + pass("has `base()`"),
                "    " + pass("has `test()`"),
                "    " + pass("has `parent()`"),
                "    " + pass("can accept a string + function"),
                "    " + pass("can accept a string"),
                "    " + pass("returns the current instance when given a callback") + medium,
                "    " + pass("returns a prototypal clone when not given a callback") + medium,
                "    " + pass("runs block tests within tests"),
                "    " + pass("runs successful inline tests within tests"),
                "    " + pass("accepts a callback with `run()`"),
                "",
                "  cli normalize glob",
                "    current directory",
                "      " + pass("normalizes a file"),
                "      " + pass("normalizes a glob"),
                "      " + pass("retains trailing slashes"),
                "      " + pass("retains negative"),
                "      " + pass("retains negative + trailing slashes"),
                "",
                "    absolute directory",
                "      " + pass("normalizes a file"),
                "      " + pass("normalizes a glob"),
                "      " + pass("retains trailing slashes"),
                "      " + pass("retains negative"),
                "      " + pass("retains negative + trailing slashes"),
                "",
                "    relative directory",
                "      " + pass("normalizes a file"),
                "      " + pass("normalizes a glob"),
                "      " + pass("retains trailing slashes"),
                "      " + pass("retains negative"),
                "      " + pass("retains negative + trailing slashes"),
                "",
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
                "    " + pass("succeeds with own") + medium,
                "    " + pass("fails with own") + medium,
                "    " + pass("succeeds with inherited") + slow,
                "    " + pass("fails with inherited") + slow,
                "    " + pass("gets own set timeout"),
                "    " + pass("gets own inline set timeout"),
                "    " + pass("gets own sync inner timeout"),
                "    " + pass("gets default timeout") + medium,
                "",
                c("bright pass", "  ") + c("green", "47 passing") + time("1s"),
                "",
            ],

            /* eslint-enable max-len */
        })
    })
})
