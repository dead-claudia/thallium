// Note: the reports *must* be well formed. The reporter assumes the reports are
// correct, and it will *not* verify this.

describe("reporter/tap", function () { // eslint-disable-line max-statements
    "use strict"

    var p = t.internal.location
    var n = t.internal.reports

    it("validates no arguments", function () {
        t.r.tap()
    })

    it("validates a single empty options object", function () {
        t.r.tap({})
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
            var reporter = t.r.tap({
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

    test("empty test", {
        input: [
            n.start(),
            n.end(),
        ],
        output: [
            "TAP version 13",
            "1..0",
            "# tests 0",
            "# duration 0ms",
        ],
    })

    test("pass 2", {
        input: [
            n.start(),
            n.pass([p("test", 0)]),
            n.pass([p("test", 1)]),
            n.end(),
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
            n.start(),
            n.fail([p("one", 0)], sentinel),
            n.fail([p("two", 1)], sentinel),
            n.end(),
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
            n.start(),
            n.pass([p("one", 0)]),
            n.fail([p("two", 1)], sentinel),
            n.end(),
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
            n.start(),
            n.fail([p("one", 0)], sentinel),
            n.pass([p("two", 1)]),
            n.end(),
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
            n.start(),
            n.fail([p("one", 0)], assertion),
            n.fail([p("two", 1)], assertion),
            n.end(),
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
            n.start(),
            n.pass([p("one", 0)]),
            n.fail([p("two", 1)], assertion),
            n.end(),
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
            n.start(),
            n.fail([p("one", 0)], assertion),
            n.pass([p("two", 1)]),
            n.end(),
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
            n.start(),
            n.skip([p("one", 0)]),
            n.skip([p("two", 1)]),
            n.end(),
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
            n.start(),
            n.pass([p("one", 0)]),
            n.skip([p("two", 1)]),
            n.end(),
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
            n.start(),
            n.skip([p("one", 0)]),
            n.pass([p("two", 1)]),
            n.end(),
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
            n.start(),
            n.fail([p("one", 0)], sentinel),
            n.skip([p("two", 1)]),
            n.end(),
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
            n.start(),
            n.skip([p("one", 0)]),
            n.fail([p("two", 1)], sentinel),
            n.end(),
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
            n.start(),
            n.enter([p("test", 0)]),
            n.enter([p("test", 0), p("inner", 0)]),
            n.fail([p("test", 0), p("inner", 0), p("fail", 0)], badType),
            n.leave([p("test", 0), p("inner", 0)]),
            n.error(badType),
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
            input: [
                n.start(),
                n.end(),
                n.start(),
                n.end(),
            ],
            output: [
                "TAP version 13",
                "1..0",
                "# tests 0",
                "# duration 0ms",
                "TAP version 13",
                "1..0",
                "# tests 0",
                "# duration 0ms",
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
                "TAP version 13",
                "ok 1 test",
                "ok 2 test",
                "1..2",
                "# tests 2",
                "# pass 2",
                "# duration 20ms",
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
