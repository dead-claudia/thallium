// Note: the reports *must* be well formed. The reporter assumes the reports are
// correct, and it will *not* verify this.

describe("reporter/tap", function () { // eslint-disable-line max-statements
    "use strict"

    var r = Util.report

    it("validates no arguments", function () {
        Util.r.tap()
    })

    it("validates a single empty options object", function () {
        Util.r.tap({})
    })

    function stack(err) {
        var stack = Util.R.getStack(err).split(/\r?\n/g)

        if (err.name === "AssertionError") {
            stack = stack.slice(1)
        }

        return ["  stack: |-"].concat(
            stack.map(function (line) { return "    " + line }))
    }

    function test(name, opts) {
        it(name, function () {
            var list = []
            var acc = ""
            var reporter = Util.r.tap({
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

    test("empty test", {
        input: [],
        output: [
            "TAP version 13",
            "1..0",
            "# tests 0",
            "# duration 0ms",
        ],
    })

    test("pass 2", {
        input: [
            r.pass("test"),
            r.pass("test"),
        ],
        output: [
            "TAP version 13",
            "ok 1 test",
            "ok 2 test",
            "1..2",
            "# tests 2",
            "# pass 2",
            "# duration 20ms",
        ],
    })

    var sentinel = new Error("sentinel")

    test("fail 2 with Error", {
        input: [
            r.fail("one", sentinel),
            r.fail("two", sentinel),
        ],
        output: [].concat([
            "TAP version 13",
            "not ok 1 one",
            "  ---",
        ], stack(sentinel), [
            "  ...",
            "not ok 2 two",
            "  ---",
        ], stack(sentinel), [
            "  ...",
            "1..2",
            "# tests 2",
            "# fail 2",
            "# duration 20ms",
        ]),
    })

    test("pass + fail with Error", {
        input: [
            r.pass("one"),
            r.fail("two", sentinel),
        ],
        output: [].concat([
            "TAP version 13",
            "ok 1 one",
            "not ok 2 two",
            "  ---",
        ], stack(sentinel), [
            "  ...",
            "1..2",
            "# tests 2",
            "# pass 1",
            "# fail 1",
            "# duration 20ms",
        ]),
    })

    test("fail with Error + pass", {
        input: [
            r.fail("one", sentinel),
            r.pass("two"),
        ],
        output: [].concat([
            "TAP version 13",
            "not ok 1 one",
            "  ---",
        ], stack(sentinel), [
            "  ...",
            "ok 2 two",
            "1..2",
            "# tests 2",
            "# pass 1",
            "# fail 1",
            "# duration 20ms",
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
            "TAP version 13",
            "not ok 1 one",
            "  ---",
            "  expected: 1",
            "  actual: 2",
            "  message: Expected 1 to equal 2",
        ], stack(assertion), [
            "  ...",
            "not ok 2 two",
            "  ---",
            "  expected: 1",
            "  actual: 2",
            "  message: Expected 1 to equal 2",
        ], stack(assertion), [
            "  ...",
            "1..2",
            "# tests 2",
            "# fail 2",
            "# duration 20ms",
        ]),
    })

    test("pass + fail with AssertionError", {
        input: [
            r.pass("one"),
            r.fail("two", assertion),
        ],
        output: [].concat([
            "TAP version 13",
            "ok 1 one",
            "not ok 2 two",
            "  ---",
            "  expected: 1",
            "  actual: 2",
            "  message: Expected 1 to equal 2",
        ], stack(assertion), [
            "  ...",
            "1..2",
            "# tests 2",
            "# pass 1",
            "# fail 1",
            "# duration 20ms",
        ]),
    })

    test("fail with AssertionError + pass", {
        input: [
            r.fail("one", assertion),
            r.pass("two"),
        ],
        output: [].concat([
            "TAP version 13",
            "not ok 1 one",
            "  ---",
            "  expected: 1",
            "  actual: 2",
            "  message: Expected 1 to equal 2",
        ], stack(assertion), [
            "  ...",
            "ok 2 two",
            "1..2",
            "# tests 2",
            "# pass 1",
            "# fail 1",
            "# duration 20ms",
        ]),
    })

    test("skip 2", {
        input: [
            r.skip("one"),
            r.skip("two"),
        ],
        output: [
            "TAP version 13",
            "ok 1 # skip one",
            "ok 2 # skip two",
            "1..2",
            "# tests 0",
            "# skip 2",
            "# duration 0ms",
        ],
    })

    test("pass + skip", {
        input: [
            r.pass("one"),
            r.skip("two"),
        ],
        output: [
            "TAP version 13",
            "ok 1 one",
            "ok 2 # skip two",
            "1..2",
            "# tests 1",
            "# pass 1",
            "# skip 1",
            "# duration 10ms",
        ],
    })

    test("skip + pass", {
        input: [
            r.skip("one"),
            r.pass("two"),
        ],
        output: [
            "TAP version 13",
            "ok 1 # skip one",
            "ok 2 two",
            "1..2",
            "# tests 1",
            "# pass 1",
            "# skip 1",
            "# duration 10ms",
        ],
    })

    test("fail + skip", {
        input: [
            r.fail("one", sentinel),
            r.skip("two"),
        ],
        output: [].concat([
            "TAP version 13",
            "not ok 1 one",
            "  ---",
        ], stack(sentinel), [
            "  ...",
            "ok 2 # skip two",
            "1..2",
            "# tests 1",
            "# fail 1",
            "# skip 1",
            "# duration 10ms",
        ]),
    })

    test("skip + fail", {
        input: [
            r.skip("one"),
            r.fail("two", sentinel),
        ],
        output: [].concat([
            "TAP version 13",
            "ok 1 # skip one",
            "not ok 2 two",
            "  ---",
        ], stack(sentinel), [
            "  ...",
            "1..2",
            "# tests 1",
            "# fail 1",
            "# skip 1",
            "# duration 10ms",
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
            "TAP version 13",
            "# test",
            "ok 1",
            "# test inner",
            "ok 2",
            "not ok 3 test inner fail",
            "  ---",
        ], stack(badType), [
            "  ...",
            "Bail out!",
            "  ---",
        ], stack(badType), [
            "  ...",
        ]),
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
            "TAP version 13",
            "# core (basic)",
            "ok 1",
            "ok 2 core (basic) has `base()`",
            "ok 3 core (basic) has `test()`",
            "ok 4 core (basic) has `parent()`",
            "ok 5 core (basic) can accept a string + function",
            "ok 6 core (basic) can accept a string",
            "ok 7 core (basic) returns the current instance when given a callback",
            "ok 8 core (basic) returns a prototypal clone when not given a callback",
            "ok 9 core (basic) runs block tests within tests",
            "ok 10 core (basic) runs successful inline tests within tests",
            "ok 11 core (basic) accepts a callback with `run()`",
            "# cli normalize glob",
            "ok 12",
            "# cli normalize glob current directory",
            "ok 13",
            "ok 14 cli normalize glob current directory normalizes a file",
            "ok 15 cli normalize glob current directory normalizes a glob",
            "ok 16 cli normalize glob current directory retains trailing slashes",
            "ok 17 cli normalize glob current directory retains negative",
            "ok 18 cli normalize glob current directory retains negative + trailing slashes",
            "# cli normalize glob absolute directory",
            "ok 19",
            "ok 20 cli normalize glob absolute directory normalizes a file",
            "ok 21 cli normalize glob absolute directory normalizes a glob",
            "ok 22 cli normalize glob absolute directory retains trailing slashes",
            "ok 23 cli normalize glob absolute directory retains negative",
            "ok 24 cli normalize glob absolute directory retains negative + trailing slashes",
            "# cli normalize glob relative directory",
            "ok 25",
            "ok 26 cli normalize glob relative directory normalizes a file",
            "ok 27 cli normalize glob relative directory normalizes a glob",
            "ok 28 cli normalize glob relative directory retains trailing slashes",
            "ok 29 cli normalize glob relative directory retains negative",
            "ok 30 cli normalize glob relative directory retains negative + trailing slashes",
            "# cli normalize glob edge cases",
            "ok 31",
            "ok 32 cli normalize glob edge cases normalizes `.` with a cwd of `.`",
            "ok 33 cli normalize glob edge cases normalizes `..` with a cwd of `.`",
            "ok 34 cli normalize glob edge cases normalizes `.` with a cwd of `..`",
            "ok 35 cli normalize glob edge cases normalizes directories with a cwd of `..`",
            "ok 36 cli normalize glob edge cases removes excess `.`",
            "ok 37 cli normalize glob edge cases removes excess `..`",
            "ok 38 cli normalize glob edge cases removes excess combined junk",
            "# core (timeouts)",
            "ok 39",
            "ok 40 core (timeouts) succeeds with own",
            "ok 41 core (timeouts) fails with own",
            "ok 42 core (timeouts) succeeds with inherited",
            "ok 43 core (timeouts) fails with inherited",
            "ok 44 core (timeouts) gets own set timeout",
            "ok 45 core (timeouts) gets own inline set timeout",
            "ok 46 core (timeouts) gets own sync inner timeout",
            "ok 47 core (timeouts) gets default timeout",
            "1..47",
            "# tests 47",
            "# pass 47",
            "# duration 470ms",
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
            "TAP version 13",
            "# core (basic)",
            "ok 1",
            "ok 2 core (basic) has `base()`",
            "ok 3 core (basic) has `test()`",
            "ok 4 core (basic) has `parent()`",
            "ok 5 # skip core (basic) can accept a string + function",
            "ok 6 core (basic) can accept a string",
            "ok 7 core (basic) returns the current instance when given a callback",
            "not ok 8 core (basic) returns a prototypal clone when not given a callback",
            "  ---",
        ], stack(badType), [
            "  ...",
            "ok 9 core (basic) runs block tests within tests",
            "ok 10 core (basic) runs successful inline tests within tests",
            "ok 11 core (basic) accepts a callback with `run()`",
            "# cli normalize glob",
            "ok 12",
            "# cli normalize glob current directory",
            "ok 13",
            "not ok 14 cli normalize glob current directory normalizes a file",
            "  ---",
        ], stack(sentinel), [
            "  ...",
            "ok 15 cli normalize glob current directory normalizes a glob",
            "ok 16 cli normalize glob current directory retains trailing slashes",
            "ok 17 cli normalize glob current directory retains negative",
            "ok 18 cli normalize glob current directory retains negative + trailing slashes",
            "# cli normalize glob absolute directory",
            "ok 19",
            "ok 20 cli normalize glob absolute directory normalizes a file",
            "ok 21 cli normalize glob absolute directory normalizes a glob",
            "ok 22 cli normalize glob absolute directory retains trailing slashes",
            "ok 23 # skip cli normalize glob absolute directory retains negative",
            "ok 24 cli normalize glob absolute directory retains negative + trailing slashes",
            "# cli normalize glob relative directory",
            "ok 25",
            "ok 26 cli normalize glob relative directory normalizes a file",
            "ok 27 cli normalize glob relative directory normalizes a glob",
            "ok 28 cli normalize glob relative directory retains trailing slashes",
            "ok 29 cli normalize glob relative directory retains negative",
            "not ok 30 cli normalize glob relative directory retains negative + trailing slashes",
            "  ---",
        ], stack(badType), [
            "  ...",
            "# cli normalize glob edge cases",
            "ok 31",
            "ok 32 cli normalize glob edge cases normalizes `.` with a cwd of `.`",
            "ok 33 cli normalize glob edge cases normalizes `..` with a cwd of `.`",
            "ok 34 cli normalize glob edge cases normalizes `.` with a cwd of `..`",
            "ok 35 cli normalize glob edge cases normalizes directories with a cwd of `..`",
            "ok 36 cli normalize glob edge cases removes excess `.`",
            "ok 37 cli normalize glob edge cases removes excess `..`",
            "ok 38 cli normalize glob edge cases removes excess combined junk",
            "# core (timeouts)",
            "ok 39",
            "ok 40 # skip core (timeouts) succeeds with own",
            "ok 41 core (timeouts) fails with own",
            "ok 42 core (timeouts) succeeds with inherited",
            "ok 43 core (timeouts) fails with inherited",
            "ok 44 core (timeouts) gets own set timeout",
            "not ok 45 core (timeouts) gets own inline set timeout",
            "  ---",
        ], stack(sentinel), [
            "  ...",
            "ok 46 # skip core (timeouts) gets own sync inner timeout",
            "ok 47 core (timeouts) gets default timeout",
            "1..47",
            "# tests 43",
            "# pass 39",
            "# fail 4",
            "# skip 4",
            "# duration 430ms",
        ]),

        /* eslint-enable max-len */
    })

    context("restarting", function () {
        test("empty test", {
            repeat: true,
            input: [],
            output: [
                "TAP version 13",
                "1..0",
                "# tests 0",
                "# duration 0ms",
            ],
        })

        test("pass 2", {
            repeat: true,
            input: [
                r.pass("test"),
                r.pass("test"),
            ],
            output: [
                "TAP version 13",
                "ok 1 test",
                "ok 2 test",
                "1..2",
                "# tests 2",
                "# pass 2",
                "# duration 20ms",
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
                "TAP version 13",
                "not ok 1 one",
                "  ---",
            ], stack(sentinel), [
                "  ...",
                "not ok 2 two",
                "  ---",
            ], stack(sentinel), [
                "  ...",
                "1..2",
                "# tests 2",
                "# fail 2",
                "# duration 20ms",
            ]),
        })

        test("pass + fail with Error", {
            repeat: true,
            input: [
                r.pass("one"),
                r.fail("two", sentinel),
            ],
            output: [].concat([
                "TAP version 13",
                "ok 1 one",
                "not ok 2 two",
                "  ---",
            ], stack(sentinel), [
                "  ...",
                "1..2",
                "# tests 2",
                "# pass 1",
                "# fail 1",
                "# duration 20ms",
            ]),
        })

        test("fail with Error + pass", {
            repeat: true,
            input: [
                r.fail("one", sentinel),
                r.pass("two"),
            ],
            output: [].concat([
                "TAP version 13",
                "not ok 1 one",
                "  ---",
            ], stack(sentinel), [
                "  ...",
                "ok 2 two",
                "1..2",
                "# tests 2",
                "# pass 1",
                "# fail 1",
                "# duration 20ms",
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
                "TAP version 13",
                "not ok 1 one",
                "  ---",
                "  expected: 1",
                "  actual: 2",
                "  message: Expected 1 to equal 2",
            ], stack(assertion), [
                "  ...",
                "not ok 2 two",
                "  ---",
                "  expected: 1",
                "  actual: 2",
                "  message: Expected 1 to equal 2",
            ], stack(assertion), [
                "  ...",
                "1..2",
                "# tests 2",
                "# fail 2",
                "# duration 20ms",
            ]),
        })

        test("pass + fail with AssertionError", {
            repeat: true,
            input: [
                r.pass("one"),
                r.fail("two", assertion),
            ],
            output: [].concat([
                "TAP version 13",
                "ok 1 one",
                "not ok 2 two",
                "  ---",
                "  expected: 1",
                "  actual: 2",
                "  message: Expected 1 to equal 2",
            ], stack(assertion), [
                "  ...",
                "1..2",
                "# tests 2",
                "# pass 1",
                "# fail 1",
                "# duration 20ms",
            ]),
        })

        test("fail with AssertionError + pass", {
            repeat: true,
            input: [
                r.fail("one", assertion),
                r.pass("two"),
            ],
            output: [].concat([
                "TAP version 13",
                "not ok 1 one",
                "  ---",
                "  expected: 1",
                "  actual: 2",
                "  message: Expected 1 to equal 2",
            ], stack(assertion), [
                "  ...",
                "ok 2 two",
                "1..2",
                "# tests 2",
                "# pass 1",
                "# fail 1",
                "# duration 20ms",
            ]),
        })
    })
})
