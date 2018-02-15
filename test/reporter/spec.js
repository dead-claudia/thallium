// Note: the reports *must* be well formed. The reporter assumes the reports are
// correct, and it will *not* verify this.

describe("reporter/spec", function () {
    "use strict"

    var r = Util.report
    var c = Util.R.color
    var Console = Util.R.Console

    it("validates no arguments", function () {
        Util.r.spec()
    })

    it("validates a single empty options object", function () {
        Util.r.spec({})
    })

    function stack(e) {
        var lines = Util.R.readStack(e).trimRight().split(/\r?\n/g)

        for (var i = 0; i < lines.length; i++) {
            lines[i] = lines[i].trimRight()
            if (lines[i]) lines[i] = "      " + c("fail", lines[i])
        }

        return lines
    }

    function pass(name) {
        return c("checkmark", Console.symbols.Pass + " ") + c("pass", name)
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

                if (opts.repeat) opts.output = opts.output.concat(opts.output)

                return r.walk(opts.input, reporter)
                .then(function () {
                    if (!opts.repeat) return undefined
                    return r.walk(opts.input, reporter)
                })
                .then(function () {
                    assert.match(list, opts.output)
                })
            })
        }
    }

    function forceSet(isSupported, isForced) {
        Console.colorSupport.isSupported = !!isSupported
        Console.colorSupport.isForced = !!isForced
    }

    function run(envColors, reporterColors) { // eslint-disable-line max-statements, max-len
        var isSupported = Console.colorSupport.isSupported
        var isForced = Console.colorSupport.isForced

        forceSet(envColors, true)
        beforeEach(function () { forceSet(envColors, true) })
        afterEach(function () { forceSet(isSupported, isForced) })

        var test = makeTest(reporterColors)

        // So I can verify colors are enabled.
        if (envColors || reporterColors) {
            test("empty test", {
                input: [],
                output: [
                    "",
                    c("plain", "  0 tests") + time("0ms"),
                    "",
                ],
            })
        } else {
            test("empty test", {
                input: [],
                output: [
                    "",
                    "  0 tests (0ms)",
                    "",
                ],
            })
        }

        test("pass 2", {
            input: [
                r.pass("test"),
                r.pass("test"),
            ],
            output: [
                "",
                "  " + pass("test"),
                "  " + pass("test"),
                "",
                c("green", "  2 passing") + time("20ms"),
                "",
            ],
        })

        var sentinel = new Error("sentinel")

        test("fail 2 with Error", {
            input: [
                r.fail("one", sentinel),
                r.fail("two", sentinel),
            ],
            output: [].concat([
                "",
                "  " + c("fail", "1) one"),
                "  " + c("fail", "2) two"),
                "",
                c("fail", "  2 failing") + time("20ms"),
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
                r.pass("one"),
                r.fail("two", sentinel),
            ],
            output: [].concat([
                "",
                "  " + pass("one"),
                "  " + c("fail", "1) two"),
                "",
                c("green", "  1 passing") + time("20ms"),
                c("fail", "  1 failing"),
                "",
                "  " + c("plain", "1) two:"),
                "    " + c("fail", "Error: sentinel"),
            ], stack(sentinel), [
                "",
            ]),
        })

        test("fail with Error + pass", {
            input: [
                r.fail("one", sentinel),
                r.pass("two"),
            ],
            output: [].concat([
                "",
                "  " + c("fail", "1) one"),
                "  " + pass("two"),
                "",
                c("green", "  1 passing") + time("20ms"),
                c("fail", "  1 failing"),
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
                r.fail("one", assertion),
                r.fail("two", assertion),
            ],
            output: [].concat([
                "",
                "  " + c("fail", "1) one"),
                "  " + c("fail", "2) two"),
                "",
                c("fail", "  2 failing") + time("20ms"),
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
                r.pass("one"),
                r.fail("two", assertion),
            ],
            output: [].concat([
                "",
                "  " + pass("one"),
                "  " + c("fail", "1) two"),
                "",
                c("green", "  1 passing") + time("20ms"),
                c("fail", "  1 failing"),
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
                r.fail("one", assertion),
                r.pass("two"),
            ],
            output: [].concat([
                "",
                "  " + c("fail", "1) one"),
                "  " + pass("two"),
                "",
                c("green", "  1 passing") + time("20ms"),
                c("fail", "  1 failing"),
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
                r.skip("one"),
                r.skip("two"),
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
                r.pass("one"),
                r.skip("two"),
            ],
            output: [
                "",
                "  " + pass("one"),
                "  " + c("skip", "- two"),
                "",
                c("green", "  1 passing") + time("10ms"),
                c("skip", "  1 skipped"),
                "",
            ],
        })

        test("skip + pass", {
            input: [
                r.skip("one"),
                r.pass("two"),
            ],
            output: [
                "",
                "  " + c("skip", "- one"),
                "  " + pass("two"),
                "",
                c("green", "  1 passing") + time("10ms"),
                c("skip", "  1 skipped"),
                "",
            ],
        })

        test("fail + skip", {
            input: [
                r.fail("one", sentinel),
                r.skip("two"),
            ],
            output: [].concat([
                "",
                "  " + c("fail", "1) one"),
                "  " + c("skip", "- two"),
                "",
                c("skip", "  1 skipped") + time("10ms"),
                c("fail", "  1 failing"),
                "",
                "  " + c("plain", "1) one:"),
                "    " + c("fail", "Error: sentinel"),
            ], stack(sentinel), [
                "",
            ]),
        })

        test("skip + fail", {
            input: [
                r.skip("one"),
                r.fail("two", sentinel),
            ],
            output: [].concat([
                "",
                "  " + c("skip", "- one"),
                "  " + c("fail", "1) two"),
                "",
                c("skip", "  1 skipped") + time("10ms"),
                c("fail", "  1 failing"),
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
                r.suite("test", [
                    r.suite("inner", [
                        r.fail("fail", badType),
                        r.error(badType),
                    ]),
                ]),
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
                r.suite("core (basic)", [
                    r.pass("has `base()`"),
                    r.pass("has `test()`"),
                    r.pass("has `parent()`"),
                    r.pass("can accept a string + function"),
                    r.pass("can accept a string"),
                    r.pass("returns the current instance when given a callback"),
                    r.pass("returns a prototypal clone when not given a callback"),
                    r.pass("runs block tests within tests"),
                    r.pass("runs successful inline tests within tests"),
                    r.pass("accepts a callback with `run()`"),
                ]),
                r.suite("cli normalize glob", [
                    r.suite("current directory", [
                        r.pass("normalizes a file"),
                        r.pass("normalizes a glob"),
                        r.pass("retains trailing slashes"),
                        r.pass("retains negative"),
                        r.pass("retains negative + trailing slashes"),
                    ]),
                    r.suite("absolute directory", [
                        r.pass("normalizes a file"),
                        r.pass("normalizes a glob"),
                        r.pass("retains trailing slashes"),
                        r.pass("retains negative"),
                        r.pass("retains negative + trailing slashes"),
                    ]),
                    r.suite("relative directory", [
                        r.pass("normalizes a file"),
                        r.pass("normalizes a glob"),
                        r.pass("retains trailing slashes"),
                        r.pass("retains negative"),
                        r.pass("retains negative + trailing slashes"),
                    ]),
                    r.suite("edge cases", [
                        r.pass("normalizes `.` with a cwd of `.`"),
                        r.pass("normalizes `..` with a cwd of `.`"),
                        r.pass("normalizes `.` with a cwd of `..`"),
                        r.pass("normalizes directories with a cwd of `..`"),
                        r.pass("removes excess `.`"),
                        r.pass("removes excess `..`"),
                        r.pass("removes excess combined junk"),
                    ]),
                ]),
                r.suite("core (timeouts)", [
                    r.pass("succeeds with own"),
                    r.pass("fails with own"),
                    r.pass("succeeds with inherited"),
                    r.pass("fails with inherited"),
                    r.pass("gets own set timeout"),
                    r.pass("gets own inline set timeout"),
                    r.pass("gets own sync inner timeout"),
                    r.pass("gets default timeout"),
                ]),
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
                c("green", "  47 passing") + time("470ms"),
                "",
            ],

            /* eslint-enable max-len */
        })

        test("long mixed bag", {
            /* eslint-disable max-len */

            input: [
                r.suite("core (basic)", [
                    r.pass("has `base()`"),
                    r.pass("has `test()`"),
                    r.pass("has `parent()`"),
                    r.skip("can accept a string + function"),
                    r.pass("can accept a string"),
                    r.pass("returns the current instance when given a callback"),
                    r.fail("returns a prototypal clone when not given a callback", badType),
                    r.pass("runs block tests within tests"),
                    r.pass("runs successful inline tests within tests"),
                    r.pass("accepts a callback with `run()`"),
                ]),
                r.suite("cli normalize glob", [
                    r.suite("current directory", [
                        r.fail("normalizes a file", sentinel),
                        r.pass("normalizes a glob"),
                        r.pass("retains trailing slashes"),
                        r.pass("retains negative"),
                        r.pass("retains negative + trailing slashes"),
                    ]),
                    r.suite("absolute directory", [
                        r.pass("normalizes a file"),
                        r.pass("normalizes a glob"),
                        r.pass("retains trailing slashes"),
                        r.skip("retains negative"),
                        r.pass("retains negative + trailing slashes"),
                    ]),
                    r.suite("relative directory", [
                        r.pass("normalizes a file"),
                        r.pass("normalizes a glob"),
                        r.pass("retains trailing slashes"),
                        r.pass("retains negative"),
                        r.fail("retains negative + trailing slashes", badType),
                    ]),
                    r.suite("edge cases", [
                        r.pass("normalizes `.` with a cwd of `.`"),
                        r.pass("normalizes `..` with a cwd of `.`"),
                        r.pass("normalizes `.` with a cwd of `..`"),
                        r.pass("normalizes directories with a cwd of `..`"),
                        r.pass("removes excess `.`"),
                        r.pass("removes excess `..`"),
                        r.pass("removes excess combined junk"),
                    ]),
                ]),
                r.suite("core (timeouts)", [
                    r.skip("succeeds with own"),
                    r.pass("fails with own"),
                    r.pass("succeeds with inherited"),
                    r.pass("fails with inherited"),
                    r.pass("gets own set timeout"),
                    r.fail("gets own inline set timeout", sentinel),
                    r.skip("gets own sync inner timeout"),
                    r.pass("gets default timeout"),
                ]),
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
                c("green", "  39 passing") + time("430ms"),
                c("skip", "  4 skipped"),
                c("fail", "  4 failing"),
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

        var multiline = new AssertionError(
            "Test:\n  expected: {id: 1}\n  found: {id: 2}",
            {id: 1}, {id: 2})

        test("multiline fail with AssertionError + pass", {
            input: [
                r.fail("one", multiline),
                r.pass("two"),
            ],
            output: [].concat([
                "",
                "  " + c("fail", "1) one"),
                "  " + pass("two"),
                "",
                c("green", "  1 passing") + time("20ms"),
                c("fail", "  1 failing"),
                "",
                "  " + c("plain", "1) one:"),
                "    " + c("fail", "AssertionError: Test:"),
                "      " + c("fail", "  expected: {id: 1}"),
                "      " + c("fail", "  found: {id: 2}"),
                "",
                "      " + c("diff added", "+ expected") + " " +
                    c("diff removed", "- actual"),
                "",
                "      " + c("diff removed", "-{ id: 2 }"),
                "      " + c("diff added", "+{ id: 1 }"),
                "",
            ], stack(multiline), [
                "",
            ]),
        })

        context("restarting", function () {
            test("empty test", {
                repeat: true,
                input: [],
                output: [
                    "",
                    c("plain", "  0 tests") + time("0ms"),
                    "",
                ],
            })

            test("pass 2", {
                repeat: true,
                input: [
                    r.pass("test"),
                    r.pass("test"),
                ],
                output: [
                    "",
                    "  " + pass("test"),
                    "  " + pass("test"),
                    "",
                    c("green", "  2 passing") + time("20ms"),
                    "",
                ],
            })

            var sentinel = new Error("sentinel")

            test("fail 2 with Error", {
                repeat: true,
                input: [
                    r.fail("one", sentinel),
                    r.fail("two", sentinel),
                ],
                output: [].concat([
                    "",
                    "  " + c("fail", "1) one"),
                    "  " + c("fail", "2) two"),
                    "",
                    c("fail", "  2 failing") +
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
                repeat: true,
                input: [
                    r.pass("one"),
                    r.fail("two", sentinel),
                ],
                output: [].concat([
                    "",
                    "  " + pass("one"),
                    "  " + c("fail", "1) two"),
                    "",
                    c("green", "  1 passing") + time("20ms"),
                    c("fail", "  1 failing"),
                    "",
                    "  " + c("plain", "1) two:"),
                    "    " + c("fail", "Error: sentinel"),
                ], stack(sentinel), [
                    "",
                ]),
            })

            test("fail with Error + pass", {
                repeat: true,
                input: [
                    r.fail("one", sentinel),
                    r.pass("two"),
                ],
                output: [].concat([
                    "",
                    "  " + c("fail", "1) one"),
                    "  " + pass("two"),
                    "",
                    c("green", "  1 passing") + time("20ms"),
                    c("fail", "  1 failing"),
                    "",
                    "  " + c("plain", "1) one:"),
                    "    " + c("fail", "Error: sentinel"),
                ], stack(sentinel), [
                    "",
                ]),
            })

            var assertion = new AssertionError("Expected 1 to equal 2", 1, 2)

            test("fail 2 with AssertionError", {
                repeat: true,
                input: [
                    r.fail("one", assertion),
                    r.fail("two", assertion),
                ],
                output: [].concat([
                    "",
                    "  " + c("fail", "1) one"),
                    "  " + c("fail", "2) two"),
                    "",
                    c("fail", "  2 failing") +
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
                repeat: true,
                input: [
                    r.pass("one"),
                    r.fail("two", assertion),
                ],
                output: [].concat([
                    "",
                    "  " + pass("one"),
                    "  " + c("fail", "1) two"),
                    "",
                    c("green", "  1 passing") + time("20ms"),
                    c("fail", "  1 failing"),
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
                repeat: true,
                input: [
                    r.fail("one", assertion),
                    r.pass("two"),
                ],
                output: [].concat([
                    "",
                    "  " + c("fail", "1) one"),
                    "  " + pass("two"),
                    "",
                    c("green", "  1 passing") + time("20ms"),
                    c("fail", "  1 failing"),
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
        })

        forceSet(isSupported, isForced)
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
            if (speed === "slow") return {duration: 80}
            if (speed === "medium") return {duration: 40}
            if (speed === "fast") return {duration: 20}
            throw new RangeError("Unknown speed: `" + speed + "`")
        }

        test("is marked with color", {
            /* eslint-disable max-len */

            input: [
                r.suite("core (basic)", at("fast"), [
                    r.pass("has `base()`", at("fast")),
                    r.pass("has `test()`", at("fast")),
                    r.pass("has `parent()`", at("fast")),
                    r.pass("can accept a string + function", at("fast")),
                    r.pass("can accept a string", at("fast")),
                    r.pass("returns the current instance when given a callback", at("medium")),
                    r.pass("returns a prototypal clone when not given a callback", at("medium")),
                    r.pass("runs block tests within tests", at("fast")),
                    r.pass("runs successful inline tests within tests", at("fast")),
                    r.pass("accepts a callback with `run()`", at("fast")),
                ]),
                r.suite("cli normalize glob", at("fast"), [
                    r.suite("current directory", at("fast"), [
                        r.pass("normalizes a file", at("fast")),
                        r.pass("normalizes a glob", at("fast")),
                        r.pass("retains trailing slashes", at("fast")),
                        r.pass("retains negative", at("fast")),
                        r.pass("retains negative + trailing slashes", at("fast")),
                    ]),
                    r.suite("absolute directory", at("fast"), [
                        r.pass("normalizes a file", at("fast")),
                        r.pass("normalizes a glob", at("fast")),
                        r.pass("retains trailing slashes", at("fast")),
                        r.pass("retains negative", at("fast")),
                        r.pass("retains negative + trailing slashes", at("fast")),
                    ]),
                    r.suite("relative directory", at("fast"), [
                        r.pass("normalizes a file", at("fast")),
                        r.pass("normalizes a glob", at("fast")),
                        r.pass("retains trailing slashes", at("fast")),
                        r.pass("retains negative", at("fast")),
                        r.pass("retains negative + trailing slashes", at("fast")),
                    ]),
                    r.suite("edge cases", at("fast"), [
                        r.pass("normalizes `.` with a cwd of `.`", at("fast")),
                        r.pass("normalizes `..` with a cwd of `.`", at("fast")),
                        r.pass("normalizes `.` with a cwd of `..`", at("fast")),
                        r.pass("normalizes directories with a cwd of `..`", at("fast")),
                        r.pass("removes excess `.`", at("fast")),
                        r.pass("removes excess `..`", at("fast")),
                        r.pass("removes excess combined junk", at("fast")),
                    ]),
                ]),
                r.suite("core (timeouts)", at("fast"), [
                    r.pass("succeeds with own", at("medium")),
                    r.pass("fails with own", at("medium")),
                    r.pass("succeeds with inherited", at("slow")),
                    r.pass("fails with inherited", at("slow")),
                    r.pass("gets own set timeout", at("fast")),
                    r.pass("gets own inline set timeout", at("fast")),
                    r.pass("gets own sync inner timeout", at("fast")),
                    r.pass("gets default timeout", at("medium")),
                ]),
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
                c("green", "  47 passing") + time("1s"),
                "",
            ],

            /* eslint-enable max-len */
        })
    })
})
