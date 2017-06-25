/* eslint max-nested-callbacks: [2, 5] */
// Note: the reports *must* be well formed. The reporter assumes the reports are
// correct, and it will *not* verify this.
describe("reporter/dom", function () { // eslint-disable-line max-statements
    "use strict"

    var r = Util.report

    function test(name, opts) {
        var it = opts.dom ? Util.DOM.it.dom : Util.DOM.it

        ;(opts.skip ? it.skip : it)(name, function (h, mock) {
            var context = Object.create(null)
            var inst = context.inst = {
                _reporter: undefined,
                _cleared: 0,
                _runs: 0,
                _count: 0,

                set reporter(reporter) {
                    this._reporter = reporter
                },

                clearTests: function () {
                    this._cleared++
                    this._count = 0
                },

                run: function () {
                    this._runs++
                    var self = this

                    return r.walk(opts.input, function (state, i) {
                        return mock.resolveFrames((0, self._reporter)(state))
                        .then(function () {
                            self._count++
                            return (0, opts.output[i])(context, h)
                        })
                    })
                },
            }
            var reporterOpts = {thallium: inst}

            context.mock = mock
            context.match = function (_) {
                assert.match(this.root.inspect(), h("div", {id: "tl"}, [
                    h("div.tl-header", [
                        h("div.tl-duration", [
                            h.text("Duration: "), h("em", [
                                h.text(Util.R.formatTime(_.duration)),
                            ]),
                        ]),
                        h("button.tl-toggle.tl-pass", {onclick: true}, [
                            h.text("Passes: "), h("em", [h.text(_.pass)]),
                        ]),
                        h("button.tl-toggle.tl-fail", {onclick: true}, [
                            h.text("Failures: "), h("em", [h.text(_.fail)]),
                        ]),
                        h("button.tl-toggle.tl-skip", {onclick: true}, [
                            h.text("Skipped: "), h("em", [h.text(_.skip)]),
                        ]),
                        h("button.tl-run", {onclick: true}, [h.text("Run")]),
                    ]),
                    h("ul.tl-report", _.reports),
                ]).inspect())
            }

            function document() {
                return Util.DOM.D.document
            }

            function showName(speed, name, duration) {
                return speed === "fast"
                    ? h("h2", [h.text(name)])
                    : h("h2", [
                        h.text(name + " ("),
                        h("span.tl-duration", [h.text(duration)]),
                        h.text(")"),
                    ])
            }

            context.pass = function (name, speed, duration) {
                speed = speed || "fast"
                duration = duration || "10ms"
                return h("li.tl-test.tl-pass.tl-" + speed, [
                    showName(speed, name, duration),
                ])
            }

            context.toLines = toLines
            function toLines(str) {
                return h("div.tl-pre",
                    str.split(/\r?\n|\r/g).map(function (line) {
                        return h("span.tl-line", [h.text(line.trimRight())])
                    })
                )
            }

            function wrapDiff(diff) {
                return h("div.tl-diff", [
                    h("div.tl-diff-header", [
                        h("span.tl-diff-added", [h.text("+ expected")]),
                        h("span.tl-diff-removed", [h.text("- actual")]),
                    ]),
                    h("div.tl-pre", diff),
                ])
            }

            context.fail = function ( // eslint-disable-line max-params
                name, e, diff, speed, duration
            ) {
                speed = speed || "fast"
                duration = duration || "10ms"
                var stack = Util.R.readStack(e)

                return h("li.tl-test.tl-fail.tl-" + speed, [
                    showName(speed, name, duration),
                    h("div.tl-display", [
                        h("div.tl-message", [
                            toLines(e.name + ": " + e.message),
                        ]),
                        diff == null ? undefined : wrapDiff(diff),
                        !stack ? undefined
                            : h("div.tl-stack", [toLines(stack)]),
                    ]),
                ])
            }

            context.added = function (line) {
                return h("span.tl-line.tl-diff-added", [h.text("+" + line)])
            }

            context.removed = function (line) {
                return h("span.tl-line.tl-diff-removed", [h.text("-" + line)])
            }

            context.none = function (line) {
                return h("span.tl-line.tl-diff-none", [h.text(" " + line)])
            }

            context.skip = function (name) {
                return h("li.tl-test.tl-skip", [
                    h("h2", [h.text(name)]),
                ])
            }

            context.suite = function (name, children, speed, duration) {
                speed = speed || "fast"
                duration = duration || "10ms"
                return h("li.tl-suite.tl-pass.tl-" + speed, [
                    showName(speed, name, duration),
                    h("ul", children),
                ])
            }

            var found = document().getElementById("tl")

            if (found != null) {
                context.root = found
            } else {
                document().body.appendChild(context.root =
                    h("div", {id: "tl"}, [
                        h.text("some garbage value that should be deleted"),
                    ])
                )
            }

            var runner = t.dom(reporterOpts)

            assert.equal(document().getElementById("tl"), context.root)
            assert.ok(document().head.getElementsByTagName("style").length)

            return runner.run().then(function () {
                assert.hasKeys(context.inst, {
                    _count: opts.output.length,
                    _runs: 1,
                    _cleared: 1,
                })

                if (!opts.repeat) return undefined
                return runner.run().then(function () {
                    assert.hasKeys(context.inst, {
                        _count: opts.output.length,
                        _runs: 1,
                        _cleared: 1,
                    })
                })
            })
        })
    }

    /* eslint-disable max-len */

    test("empty test", {
        input: [],
        output: [
            function (_) {
                _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
            },

            function (_) {
                _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
            },
        ],
    })

    test("pass 2", {
        input: [
            r.pass("test"),
            r.pass("test"),
        ],
        output: [
            function (_) {
                _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
            },

            function (_) {
                _.match({duration: 10, pass: 1, fail: 0, skip: 0, reports: [
                    _.pass("test"),
                ]})
            },

            function (_) {
                _.match({duration: 20, pass: 2, fail: 0, skip: 0, reports: [
                    _.pass("test"),
                    _.pass("test"),
                ]})
            },

            function (_) {
                _.match({duration: 20, pass: 2, fail: 0, skip: 0, reports: [
                    _.pass("test"),
                    _.pass("test"),
                ]})
            },
        ],
    })

    var sentinel = new Error("sentinel")

    test("fail 2 with Error", {
        input: [
            r.fail("one", sentinel),
            r.fail("two", sentinel),
        ],
        output: [
            function (_) {
                _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
            },

            function (_) {
                _.match({duration: 10, pass: 0, fail: 1, skip: 0, reports: [
                    _.fail("one", sentinel),
                ]})
            },

            function (_) {
                _.match({duration: 20, pass: 0, fail: 2, skip: 0, reports: [
                    _.fail("one", sentinel),
                    _.fail("two", sentinel),
                ]})
            },

            function (_) {
                _.match({duration: 20, pass: 0, fail: 2, skip: 0, reports: [
                    _.fail("one", sentinel),
                    _.fail("two", sentinel),
                ]})
            },
        ],
    })

    test("pass + fail with Error", {
        input: [
            r.pass("one"),
            r.fail("two", sentinel),
        ],
        output: [
            function (_) {
                _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
            },

            function (_) {
                _.match({duration: 10, pass: 1, fail: 0, skip: 0, reports: [
                    _.pass("one"),
                ]})
            },

            function (_) {
                _.match({duration: 20, pass: 1, fail: 1, skip: 0, reports: [
                    _.pass("one"),
                    _.fail("two", sentinel),
                ]})
            },

            function (_) {
                _.match({duration: 20, pass: 1, fail: 1, skip: 0, reports: [
                    _.pass("one"),
                    _.fail("two", sentinel),
                ]})
            },
        ],
    })

    test("fail with Error + pass", {
        input: [
            r.fail("one", sentinel),
            r.pass("two"),
        ],
        output: [
            function (_) {
                _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
            },

            function (_) {
                _.match({duration: 10, pass: 0, fail: 1, skip: 0, reports: [
                    _.fail("one", sentinel),
                ]})
            },

            function (_) {
                _.match({duration: 20, pass: 1, fail: 1, skip: 0, reports: [
                    _.fail("one", sentinel),
                    _.pass("two"),
                ]})
            },

            function (_) {
                _.match({duration: 20, pass: 1, fail: 1, skip: 0, reports: [
                    _.fail("one", sentinel),
                    _.pass("two"),
                ]})
            },
        ],
    })

    var AssertionError = assert.AssertionError
    var assertion = new AssertionError("Expected 1 to equal 2", 1, 2)

    function assertionDiff(_) {
        return [
            _.removed("2"),
            _.added("1"),
        ]
    }

    test("fail 2 with AssertionError", {
        input: [
            r.fail("one", assertion),
            r.fail("two", assertion),
        ],
        output: [
            function (_) {
                _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
            },

            function (_) {
                _.match({duration: 10, pass: 0, fail: 1, skip: 0, reports: [
                    _.fail("one", assertion, assertionDiff(_)),
                ]})
            },

            function (_) {
                _.match({duration: 20, pass: 0, fail: 2, skip: 0, reports: [
                    _.fail("one", assertion, assertionDiff(_)),
                    _.fail("two", assertion, assertionDiff(_)),
                ]})
            },

            function (_) {
                _.match({duration: 20, pass: 0, fail: 2, skip: 0, reports: [
                    _.fail("one", assertion, assertionDiff(_)),
                    _.fail("two", assertion, assertionDiff(_)),
                ]})
            },
        ],
    })

    test("pass + fail with AssertionError", {
        input: [
            r.pass("one"),
            r.fail("two", assertion),
        ],
        output: [
            function (_) {
                _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
            },

            function (_) {
                _.match({duration: 10, pass: 1, fail: 0, skip: 0, reports: [
                    _.pass("one"),
                ]})
            },

            function (_) {
                _.match({duration: 20, pass: 1, fail: 1, skip: 0, reports: [
                    _.pass("one"),
                    _.fail("two", assertion, assertionDiff(_)),
                ]})
            },

            function (_) {
                _.match({duration: 20, pass: 1, fail: 1, skip: 0, reports: [
                    _.pass("one"),
                    _.fail("two", assertion, assertionDiff(_)),
                ]})
            },
        ],
    })

    test("fail with AssertionError + pass", {
        input: [
            r.fail("one", assertion),
            r.pass("two"),
        ],
        output: [
            function (_) {
                _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
            },

            function (_) {
                _.match({duration: 10, pass: 0, fail: 1, skip: 0, reports: [
                    _.fail("one", assertion, assertionDiff(_)),
                ]})
            },

            function (_) {
                _.match({duration: 20, pass: 1, fail: 1, skip: 0, reports: [
                    _.fail("one", assertion, assertionDiff(_)),
                    _.pass("two"),
                ]})
            },

            function (_) {
                _.match({duration: 20, pass: 1, fail: 1, skip: 0, reports: [
                    _.fail("one", assertion, assertionDiff(_)),
                    _.pass("two"),
                ]})
            },
        ],
    })

    test("skip 2", {
        input: [
            r.skip("one"),
            r.skip("two"),
        ],
        output: [
            function (_) {
                _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
            },

            function (_) {
                _.match({duration: 0, pass: 0, fail: 0, skip: 1, reports: [
                    _.skip("one"),
                ]})
            },

            function (_) {
                _.match({duration: 0, pass: 0, fail: 0, skip: 2, reports: [
                    _.skip("one"),
                    _.skip("two"),
                ]})
            },

            function (_) {
                _.match({duration: 0, pass: 0, fail: 0, skip: 2, reports: [
                    _.skip("one"),
                    _.skip("two"),
                ]})
            },
        ],
    })

    test("pass + skip", {
        input: [
            r.pass("one"),
            r.skip("two"),
        ],
        output: [
            function (_) {
                _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
            },

            function (_) {
                _.match({duration: 10, pass: 1, fail: 0, skip: 0, reports: [
                    _.pass("one"),
                ]})
            },

            function (_) {
                _.match({duration: 10, pass: 1, fail: 0, skip: 1, reports: [
                    _.pass("one"),
                    _.skip("two"),
                ]})
            },

            function (_) {
                _.match({duration: 10, pass: 1, fail: 0, skip: 1, reports: [
                    _.pass("one"),
                    _.skip("two"),
                ]})
            },
        ],
    })

    test("skip + pass", {
        input: [
            r.skip("one"),
            r.pass("two"),
        ],
        output: [
            function (_) {
                _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
            },

            function (_) {
                _.match({duration: 0, pass: 0, fail: 0, skip: 1, reports: [
                    _.skip("one"),
                ]})
            },

            function (_) {
                _.match({duration: 10, pass: 1, fail: 0, skip: 1, reports: [
                    _.skip("one"),
                    _.pass("two"),
                ]})
            },

            function (_) {
                _.match({duration: 10, pass: 1, fail: 0, skip: 1, reports: [
                    _.skip("one"),
                    _.pass("two"),
                ]})
            },
        ],
    })

    test("fail + skip", {
        input: [
            r.fail("one", sentinel),
            r.skip("two"),
        ],
        output: [
            function (_) {
                _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
            },

            function (_) {
                _.match({duration: 10, pass: 0, fail: 1, skip: 0, reports: [
                    _.fail("one", sentinel),
                ]})
            },

            function (_) {
                _.match({duration: 10, pass: 0, fail: 1, skip: 1, reports: [
                    _.fail("one", sentinel),
                    _.skip("two"),
                ]})
            },

            function (_) {
                _.match({duration: 10, pass: 0, fail: 1, skip: 1, reports: [
                    _.fail("one", sentinel),
                    _.skip("two"),
                ]})
            },
        ],
    })

    test("skip + fail", {
        input: [
            r.skip("one"),
            r.fail("two", sentinel),
        ],
        output: [
            function (_) {
                _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
            },

            function (_) {
                _.match({duration: 0, pass: 0, fail: 0, skip: 1, reports: [
                    _.skip("one"),
                ]})
            },

            function (_) {
                _.match({duration: 10, pass: 0, fail: 1, skip: 1, reports: [
                    _.skip("one"),
                    _.fail("two", sentinel),
                ]})
            },

            function (_) {
                _.match({duration: 10, pass: 0, fail: 1, skip: 1, reports: [
                    _.skip("one"),
                    _.fail("two", sentinel),
                ]})
            },
        ],
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
        output: [
            function (_) {
                _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
            },

            function (_) {
                _.match({duration: 10, pass: 1, fail: 0, skip: 0, reports: [
                    _.suite("test", []),
                ]})
            },

            function (_) {
                _.match({duration: 20, pass: 2, fail: 0, skip: 0, reports: [
                    _.suite("test", [
                        _.suite("inner", []),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 30, pass: 2, fail: 1, skip: 0, reports: [
                    _.suite("test", [
                        _.suite("inner", [
                            _.fail("fail", badType),
                        ]),
                    ]),
                ]})
            },

            function (_, h) {
                var stack = Util.R.readStack(badType)

                _.match({duration: 30, pass: 2, fail: 1, skip: 0, reports: [
                    _.suite("test", [
                        _.suite("inner", [
                            _.fail("fail", badType),
                        ]),
                    ]),
                    h("li.tl-error", [
                        h("h2", [h.text("Internal error")]),
                        h("div.tl-display", [
                            h("div.tl-message", [_.toLines(
                                "TypeError: undefined is not a function")]),
                            !stack ? undefined
                                : h("div.tl-stack", [_.toLines(stack)]),
                        ]),
                    ]),
                ]})
            },
        ],
    })

    test("long passing sequence", {
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
            function (_) {
                _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
            },

            function (_) {
                _.match({duration: 10, pass: 1, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", []),
                ]})
            },

            function (_) {
                _.match({duration: 20, pass: 2, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 30, pass: 3, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 40, pass: 4, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 50, pass: 5, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.pass("can accept a string + function"),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 60, pass: 6, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.pass("can accept a string + function"),
                        _.pass("can accept a string"),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 70, pass: 7, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.pass("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 80, pass: 8, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.pass("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.pass("returns a prototypal clone when not given a callback"),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 90, pass: 9, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.pass("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.pass("returns a prototypal clone when not given a callback"),
                        _.pass("runs block tests within tests"),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 100, pass: 10, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.pass("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.pass("returns a prototypal clone when not given a callback"),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 110, pass: 11, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.pass("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.pass("returns a prototypal clone when not given a callback"),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 110, pass: 11, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.pass("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.pass("returns a prototypal clone when not given a callback"),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 120, pass: 12, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.pass("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.pass("returns a prototypal clone when not given a callback"),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", []),
                ]})
            },

            function (_) {
                _.match({duration: 130, pass: 13, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.pass("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.pass("returns a prototypal clone when not given a callback"),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", []),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 140, pass: 14, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.pass("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.pass("returns a prototypal clone when not given a callback"),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.pass("normalizes a file"),
                        ]),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 150, pass: 15, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.pass("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.pass("returns a prototypal clone when not given a callback"),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                        ]),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 160, pass: 16, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.pass("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.pass("returns a prototypal clone when not given a callback"),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                        ]),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 170, pass: 17, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.pass("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.pass("returns a prototypal clone when not given a callback"),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                        ]),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 180, pass: 18, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.pass("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.pass("returns a prototypal clone when not given a callback"),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 180, pass: 18, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.pass("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.pass("returns a prototypal clone when not given a callback"),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 190, pass: 19, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.pass("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.pass("returns a prototypal clone when not given a callback"),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", []),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 200, pass: 20, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.pass("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.pass("returns a prototypal clone when not given a callback"),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                        ]),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 210, pass: 21, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.pass("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.pass("returns a prototypal clone when not given a callback"),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                        ]),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 220, pass: 22, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.pass("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.pass("returns a prototypal clone when not given a callback"),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                        ]),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 230, pass: 23, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.pass("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.pass("returns a prototypal clone when not given a callback"),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                        ]),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 240, pass: 24, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.pass("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.pass("returns a prototypal clone when not given a callback"),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 240, pass: 24, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.pass("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.pass("returns a prototypal clone when not given a callback"),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 250, pass: 25, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.pass("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.pass("returns a prototypal clone when not given a callback"),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("relative directory", []),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 260, pass: 26, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.pass("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.pass("returns a prototypal clone when not given a callback"),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("relative directory", [
                            _.pass("normalizes a file"),
                        ]),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 270, pass: 27, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.pass("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.pass("returns a prototypal clone when not given a callback"),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("relative directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                        ]),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 280, pass: 28, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.pass("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.pass("returns a prototypal clone when not given a callback"),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("relative directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                        ]),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 290, pass: 29, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.pass("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.pass("returns a prototypal clone when not given a callback"),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("relative directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                        ]),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 300, pass: 30, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.pass("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.pass("returns a prototypal clone when not given a callback"),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("relative directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 300, pass: 30, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.pass("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.pass("returns a prototypal clone when not given a callback"),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("relative directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 310, pass: 31, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.pass("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.pass("returns a prototypal clone when not given a callback"),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("relative directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("edge cases", []),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 320, pass: 32, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.pass("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.pass("returns a prototypal clone when not given a callback"),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("relative directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("edge cases", [
                            _.pass("normalizes `.` with a cwd of `.`"),
                        ]),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 330, pass: 33, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.pass("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.pass("returns a prototypal clone when not given a callback"),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("relative directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("edge cases", [
                            _.pass("normalizes `.` with a cwd of `.`"),
                            _.pass("normalizes `..` with a cwd of `.`"),
                        ]),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 340, pass: 34, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.pass("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.pass("returns a prototypal clone when not given a callback"),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("relative directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("edge cases", [
                            _.pass("normalizes `.` with a cwd of `.`"),
                            _.pass("normalizes `..` with a cwd of `.`"),
                            _.pass("normalizes `.` with a cwd of `..`"),
                        ]),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 350, pass: 35, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.pass("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.pass("returns a prototypal clone when not given a callback"),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("relative directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("edge cases", [
                            _.pass("normalizes `.` with a cwd of `.`"),
                            _.pass("normalizes `..` with a cwd of `.`"),
                            _.pass("normalizes `.` with a cwd of `..`"),
                            _.pass("normalizes directories with a cwd of `..`"),
                        ]),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 360, pass: 36, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.pass("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.pass("returns a prototypal clone when not given a callback"),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("relative directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("edge cases", [
                            _.pass("normalizes `.` with a cwd of `.`"),
                            _.pass("normalizes `..` with a cwd of `.`"),
                            _.pass("normalizes `.` with a cwd of `..`"),
                            _.pass("normalizes directories with a cwd of `..`"),
                            _.pass("removes excess `.`"),
                        ]),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 370, pass: 37, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.pass("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.pass("returns a prototypal clone when not given a callback"),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("relative directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("edge cases", [
                            _.pass("normalizes `.` with a cwd of `.`"),
                            _.pass("normalizes `..` with a cwd of `.`"),
                            _.pass("normalizes `.` with a cwd of `..`"),
                            _.pass("normalizes directories with a cwd of `..`"),
                            _.pass("removes excess `.`"),
                            _.pass("removes excess `..`"),
                        ]),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 380, pass: 38, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.pass("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.pass("returns a prototypal clone when not given a callback"),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("relative directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("edge cases", [
                            _.pass("normalizes `.` with a cwd of `.`"),
                            _.pass("normalizes `..` with a cwd of `.`"),
                            _.pass("normalizes `.` with a cwd of `..`"),
                            _.pass("normalizes directories with a cwd of `..`"),
                            _.pass("removes excess `.`"),
                            _.pass("removes excess `..`"),
                            _.pass("removes excess combined junk"),
                        ]),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 380, pass: 38, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.pass("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.pass("returns a prototypal clone when not given a callback"),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("relative directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("edge cases", [
                            _.pass("normalizes `.` with a cwd of `.`"),
                            _.pass("normalizes `..` with a cwd of `.`"),
                            _.pass("normalizes `.` with a cwd of `..`"),
                            _.pass("normalizes directories with a cwd of `..`"),
                            _.pass("removes excess `.`"),
                            _.pass("removes excess `..`"),
                            _.pass("removes excess combined junk"),
                        ]),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 380, pass: 38, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.pass("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.pass("returns a prototypal clone when not given a callback"),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("relative directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("edge cases", [
                            _.pass("normalizes `.` with a cwd of `.`"),
                            _.pass("normalizes `..` with a cwd of `.`"),
                            _.pass("normalizes `.` with a cwd of `..`"),
                            _.pass("normalizes directories with a cwd of `..`"),
                            _.pass("removes excess `.`"),
                            _.pass("removes excess `..`"),
                            _.pass("removes excess combined junk"),
                        ]),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 390, pass: 39, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.pass("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.pass("returns a prototypal clone when not given a callback"),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("relative directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("edge cases", [
                            _.pass("normalizes `.` with a cwd of `.`"),
                            _.pass("normalizes `..` with a cwd of `.`"),
                            _.pass("normalizes `.` with a cwd of `..`"),
                            _.pass("normalizes directories with a cwd of `..`"),
                            _.pass("removes excess `.`"),
                            _.pass("removes excess `..`"),
                            _.pass("removes excess combined junk"),
                        ]),
                    ]),
                    _.suite("core (timeouts)", []),
                ]})
            },

            function (_) {
                _.match({duration: 400, pass: 40, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.pass("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.pass("returns a prototypal clone when not given a callback"),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("relative directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("edge cases", [
                            _.pass("normalizes `.` with a cwd of `.`"),
                            _.pass("normalizes `..` with a cwd of `.`"),
                            _.pass("normalizes `.` with a cwd of `..`"),
                            _.pass("normalizes directories with a cwd of `..`"),
                            _.pass("removes excess `.`"),
                            _.pass("removes excess `..`"),
                            _.pass("removes excess combined junk"),
                        ]),
                    ]),
                    _.suite("core (timeouts)", [
                        _.pass("succeeds with own"),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 410, pass: 41, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.pass("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.pass("returns a prototypal clone when not given a callback"),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("relative directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("edge cases", [
                            _.pass("normalizes `.` with a cwd of `.`"),
                            _.pass("normalizes `..` with a cwd of `.`"),
                            _.pass("normalizes `.` with a cwd of `..`"),
                            _.pass("normalizes directories with a cwd of `..`"),
                            _.pass("removes excess `.`"),
                            _.pass("removes excess `..`"),
                            _.pass("removes excess combined junk"),
                        ]),
                    ]),
                    _.suite("core (timeouts)", [
                        _.pass("succeeds with own"),
                        _.pass("fails with own"),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 420, pass: 42, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.pass("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.pass("returns a prototypal clone when not given a callback"),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("relative directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("edge cases", [
                            _.pass("normalizes `.` with a cwd of `.`"),
                            _.pass("normalizes `..` with a cwd of `.`"),
                            _.pass("normalizes `.` with a cwd of `..`"),
                            _.pass("normalizes directories with a cwd of `..`"),
                            _.pass("removes excess `.`"),
                            _.pass("removes excess `..`"),
                            _.pass("removes excess combined junk"),
                        ]),
                    ]),
                    _.suite("core (timeouts)", [
                        _.pass("succeeds with own"),
                        _.pass("fails with own"),
                        _.pass("succeeds with inherited"),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 430, pass: 43, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.pass("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.pass("returns a prototypal clone when not given a callback"),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("relative directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("edge cases", [
                            _.pass("normalizes `.` with a cwd of `.`"),
                            _.pass("normalizes `..` with a cwd of `.`"),
                            _.pass("normalizes `.` with a cwd of `..`"),
                            _.pass("normalizes directories with a cwd of `..`"),
                            _.pass("removes excess `.`"),
                            _.pass("removes excess `..`"),
                            _.pass("removes excess combined junk"),
                        ]),
                    ]),
                    _.suite("core (timeouts)", [
                        _.pass("succeeds with own"),
                        _.pass("fails with own"),
                        _.pass("succeeds with inherited"),
                        _.pass("fails with inherited"),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 440, pass: 44, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.pass("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.pass("returns a prototypal clone when not given a callback"),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("relative directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("edge cases", [
                            _.pass("normalizes `.` with a cwd of `.`"),
                            _.pass("normalizes `..` with a cwd of `.`"),
                            _.pass("normalizes `.` with a cwd of `..`"),
                            _.pass("normalizes directories with a cwd of `..`"),
                            _.pass("removes excess `.`"),
                            _.pass("removes excess `..`"),
                            _.pass("removes excess combined junk"),
                        ]),
                    ]),
                    _.suite("core (timeouts)", [
                        _.pass("succeeds with own"),
                        _.pass("fails with own"),
                        _.pass("succeeds with inherited"),
                        _.pass("fails with inherited"),
                        _.pass("gets own set timeout"),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 450, pass: 45, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.pass("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.pass("returns a prototypal clone when not given a callback"),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("relative directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("edge cases", [
                            _.pass("normalizes `.` with a cwd of `.`"),
                            _.pass("normalizes `..` with a cwd of `.`"),
                            _.pass("normalizes `.` with a cwd of `..`"),
                            _.pass("normalizes directories with a cwd of `..`"),
                            _.pass("removes excess `.`"),
                            _.pass("removes excess `..`"),
                            _.pass("removes excess combined junk"),
                        ]),
                    ]),
                    _.suite("core (timeouts)", [
                        _.pass("succeeds with own"),
                        _.pass("fails with own"),
                        _.pass("succeeds with inherited"),
                        _.pass("fails with inherited"),
                        _.pass("gets own set timeout"),
                        _.pass("gets own inline set timeout"),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 460, pass: 46, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.pass("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.pass("returns a prototypal clone when not given a callback"),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("relative directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("edge cases", [
                            _.pass("normalizes `.` with a cwd of `.`"),
                            _.pass("normalizes `..` with a cwd of `.`"),
                            _.pass("normalizes `.` with a cwd of `..`"),
                            _.pass("normalizes directories with a cwd of `..`"),
                            _.pass("removes excess `.`"),
                            _.pass("removes excess `..`"),
                            _.pass("removes excess combined junk"),
                        ]),
                    ]),
                    _.suite("core (timeouts)", [
                        _.pass("succeeds with own"),
                        _.pass("fails with own"),
                        _.pass("succeeds with inherited"),
                        _.pass("fails with inherited"),
                        _.pass("gets own set timeout"),
                        _.pass("gets own inline set timeout"),
                        _.pass("gets own sync inner timeout"),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 470, pass: 47, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.pass("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.pass("returns a prototypal clone when not given a callback"),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("relative directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("edge cases", [
                            _.pass("normalizes `.` with a cwd of `.`"),
                            _.pass("normalizes `..` with a cwd of `.`"),
                            _.pass("normalizes `.` with a cwd of `..`"),
                            _.pass("normalizes directories with a cwd of `..`"),
                            _.pass("removes excess `.`"),
                            _.pass("removes excess `..`"),
                            _.pass("removes excess combined junk"),
                        ]),
                    ]),
                    _.suite("core (timeouts)", [
                        _.pass("succeeds with own"),
                        _.pass("fails with own"),
                        _.pass("succeeds with inherited"),
                        _.pass("fails with inherited"),
                        _.pass("gets own set timeout"),
                        _.pass("gets own inline set timeout"),
                        _.pass("gets own sync inner timeout"),
                        _.pass("gets default timeout"),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 470, pass: 47, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.pass("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.pass("returns a prototypal clone when not given a callback"),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("relative directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("edge cases", [
                            _.pass("normalizes `.` with a cwd of `.`"),
                            _.pass("normalizes `..` with a cwd of `.`"),
                            _.pass("normalizes `.` with a cwd of `..`"),
                            _.pass("normalizes directories with a cwd of `..`"),
                            _.pass("removes excess `.`"),
                            _.pass("removes excess `..`"),
                            _.pass("removes excess combined junk"),
                        ]),
                    ]),
                    _.suite("core (timeouts)", [
                        _.pass("succeeds with own"),
                        _.pass("fails with own"),
                        _.pass("succeeds with inherited"),
                        _.pass("fails with inherited"),
                        _.pass("gets own set timeout"),
                        _.pass("gets own inline set timeout"),
                        _.pass("gets own sync inner timeout"),
                        _.pass("gets default timeout"),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 470, pass: 47, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.pass("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.pass("returns a prototypal clone when not given a callback"),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("relative directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("edge cases", [
                            _.pass("normalizes `.` with a cwd of `.`"),
                            _.pass("normalizes `..` with a cwd of `.`"),
                            _.pass("normalizes `.` with a cwd of `..`"),
                            _.pass("normalizes directories with a cwd of `..`"),
                            _.pass("removes excess `.`"),
                            _.pass("removes excess `..`"),
                            _.pass("removes excess combined junk"),
                        ]),
                    ]),
                    _.suite("core (timeouts)", [
                        _.pass("succeeds with own"),
                        _.pass("fails with own"),
                        _.pass("succeeds with inherited"),
                        _.pass("fails with inherited"),
                        _.pass("gets own set timeout"),
                        _.pass("gets own inline set timeout"),
                        _.pass("gets own sync inner timeout"),
                        _.pass("gets default timeout"),
                    ]),
                ]})
            },
        ],
    })

    test("long mixed bag", {
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
        output: [
            function (_) {
                _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
            },

            function (_) {
                _.match({duration: 10, pass: 1, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", []),
                ]})
            },

            function (_) {
                _.match({duration: 20, pass: 2, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 30, pass: 3, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 40, pass: 4, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 40, pass: 4, fail: 0, skip: 1, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.skip("can accept a string + function"),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 50, pass: 5, fail: 0, skip: 1, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.skip("can accept a string + function"),
                        _.pass("can accept a string"),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 60, pass: 6, fail: 0, skip: 1, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.skip("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 70, pass: 6, fail: 1, skip: 1, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.skip("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.fail("returns a prototypal clone when not given a callback", badType),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 80, pass: 7, fail: 1, skip: 1, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.skip("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.fail("returns a prototypal clone when not given a callback", badType),
                        _.pass("runs block tests within tests"),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 90, pass: 8, fail: 1, skip: 1, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.skip("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.fail("returns a prototypal clone when not given a callback", badType),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 100, pass: 9, fail: 1, skip: 1, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.skip("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.fail("returns a prototypal clone when not given a callback", badType),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 100, pass: 9, fail: 1, skip: 1, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.skip("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.fail("returns a prototypal clone when not given a callback", badType),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 110, pass: 10, fail: 1, skip: 1, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.skip("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.fail("returns a prototypal clone when not given a callback", badType),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", []),
                ]})
            },

            function (_) {
                _.match({duration: 120, pass: 11, fail: 1, skip: 1, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.skip("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.fail("returns a prototypal clone when not given a callback", badType),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", []),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 130, pass: 11, fail: 2, skip: 1, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.skip("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.fail("returns a prototypal clone when not given a callback", badType),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.fail("normalizes a file", sentinel),
                        ]),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 140, pass: 12, fail: 2, skip: 1, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.skip("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.fail("returns a prototypal clone when not given a callback", badType),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.fail("normalizes a file", sentinel),
                            _.pass("normalizes a glob"),
                        ]),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 150, pass: 13, fail: 2, skip: 1, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.skip("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.fail("returns a prototypal clone when not given a callback", badType),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.fail("normalizes a file", sentinel),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                        ]),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 160, pass: 14, fail: 2, skip: 1, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.skip("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.fail("returns a prototypal clone when not given a callback", badType),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.fail("normalizes a file", sentinel),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                        ]),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 170, pass: 15, fail: 2, skip: 1, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.skip("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.fail("returns a prototypal clone when not given a callback", badType),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.fail("normalizes a file", sentinel),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 170, pass: 15, fail: 2, skip: 1, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.skip("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.fail("returns a prototypal clone when not given a callback", badType),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.fail("normalizes a file", sentinel),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 180, pass: 16, fail: 2, skip: 1, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.skip("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.fail("returns a prototypal clone when not given a callback", badType),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.fail("normalizes a file", sentinel),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", []),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 190, pass: 17, fail: 2, skip: 1, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.skip("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.fail("returns a prototypal clone when not given a callback", badType),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.fail("normalizes a file", sentinel),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                        ]),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 200, pass: 18, fail: 2, skip: 1, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.skip("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.fail("returns a prototypal clone when not given a callback", badType),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.fail("normalizes a file", sentinel),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                        ]),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 210, pass: 19, fail: 2, skip: 1, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.skip("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.fail("returns a prototypal clone when not given a callback", badType),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.fail("normalizes a file", sentinel),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                        ]),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 210, pass: 19, fail: 2, skip: 2, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.skip("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.fail("returns a prototypal clone when not given a callback", badType),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.fail("normalizes a file", sentinel),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.skip("retains negative"),
                        ]),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 220, pass: 20, fail: 2, skip: 2, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.skip("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.fail("returns a prototypal clone when not given a callback", badType),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.fail("normalizes a file", sentinel),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.skip("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 220, pass: 20, fail: 2, skip: 2, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.skip("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.fail("returns a prototypal clone when not given a callback", badType),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.fail("normalizes a file", sentinel),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.skip("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 230, pass: 21, fail: 2, skip: 2, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.skip("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.fail("returns a prototypal clone when not given a callback", badType),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.fail("normalizes a file", sentinel),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.skip("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("relative directory", []),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 240, pass: 22, fail: 2, skip: 2, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.skip("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.fail("returns a prototypal clone when not given a callback", badType),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.fail("normalizes a file", sentinel),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.skip("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("relative directory", [
                            _.pass("normalizes a file"),
                        ]),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 250, pass: 23, fail: 2, skip: 2, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.skip("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.fail("returns a prototypal clone when not given a callback", badType),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.fail("normalizes a file", sentinel),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.skip("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("relative directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                        ]),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 260, pass: 24, fail: 2, skip: 2, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.skip("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.fail("returns a prototypal clone when not given a callback", badType),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.fail("normalizes a file", sentinel),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.skip("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("relative directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                        ]),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 270, pass: 25, fail: 2, skip: 2, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.skip("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.fail("returns a prototypal clone when not given a callback", badType),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.fail("normalizes a file", sentinel),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.skip("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("relative directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                        ]),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 280, pass: 25, fail: 3, skip: 2, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.skip("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.fail("returns a prototypal clone when not given a callback", badType),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.fail("normalizes a file", sentinel),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.skip("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("relative directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.fail("retains negative + trailing slashes", badType),
                        ]),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 280, pass: 25, fail: 3, skip: 2, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.skip("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.fail("returns a prototypal clone when not given a callback", badType),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.fail("normalizes a file", sentinel),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.skip("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("relative directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.fail("retains negative + trailing slashes", badType),
                        ]),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 290, pass: 26, fail: 3, skip: 2, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.skip("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.fail("returns a prototypal clone when not given a callback", badType),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.fail("normalizes a file", sentinel),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.skip("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("relative directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.fail("retains negative + trailing slashes", badType),
                        ]),
                        _.suite("edge cases", []),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 300, pass: 27, fail: 3, skip: 2, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.skip("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.fail("returns a prototypal clone when not given a callback", badType),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.fail("normalizes a file", sentinel),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.skip("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("relative directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.fail("retains negative + trailing slashes", badType),
                        ]),
                        _.suite("edge cases", [
                            _.pass("normalizes `.` with a cwd of `.`"),
                        ]),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 310, pass: 28, fail: 3, skip: 2, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.skip("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.fail("returns a prototypal clone when not given a callback", badType),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.fail("normalizes a file", sentinel),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.skip("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("relative directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.fail("retains negative + trailing slashes", badType),
                        ]),
                        _.suite("edge cases", [
                            _.pass("normalizes `.` with a cwd of `.`"),
                            _.pass("normalizes `..` with a cwd of `.`"),
                        ]),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 320, pass: 29, fail: 3, skip: 2, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.skip("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.fail("returns a prototypal clone when not given a callback", badType),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.fail("normalizes a file", sentinel),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.skip("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("relative directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.fail("retains negative + trailing slashes", badType),
                        ]),
                        _.suite("edge cases", [
                            _.pass("normalizes `.` with a cwd of `.`"),
                            _.pass("normalizes `..` with a cwd of `.`"),
                            _.pass("normalizes `.` with a cwd of `..`"),
                        ]),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 330, pass: 30, fail: 3, skip: 2, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.skip("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.fail("returns a prototypal clone when not given a callback", badType),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.fail("normalizes a file", sentinel),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.skip("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("relative directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.fail("retains negative + trailing slashes", badType),
                        ]),
                        _.suite("edge cases", [
                            _.pass("normalizes `.` with a cwd of `.`"),
                            _.pass("normalizes `..` with a cwd of `.`"),
                            _.pass("normalizes `.` with a cwd of `..`"),
                            _.pass("normalizes directories with a cwd of `..`"),
                        ]),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 340, pass: 31, fail: 3, skip: 2, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.skip("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.fail("returns a prototypal clone when not given a callback", badType),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.fail("normalizes a file", sentinel),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.skip("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("relative directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.fail("retains negative + trailing slashes", badType),
                        ]),
                        _.suite("edge cases", [
                            _.pass("normalizes `.` with a cwd of `.`"),
                            _.pass("normalizes `..` with a cwd of `.`"),
                            _.pass("normalizes `.` with a cwd of `..`"),
                            _.pass("normalizes directories with a cwd of `..`"),
                            _.pass("removes excess `.`"),
                        ]),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 350, pass: 32, fail: 3, skip: 2, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.skip("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.fail("returns a prototypal clone when not given a callback", badType),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.fail("normalizes a file", sentinel),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.skip("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("relative directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.fail("retains negative + trailing slashes", badType),
                        ]),
                        _.suite("edge cases", [
                            _.pass("normalizes `.` with a cwd of `.`"),
                            _.pass("normalizes `..` with a cwd of `.`"),
                            _.pass("normalizes `.` with a cwd of `..`"),
                            _.pass("normalizes directories with a cwd of `..`"),
                            _.pass("removes excess `.`"),
                            _.pass("removes excess `..`"),
                        ]),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 360, pass: 33, fail: 3, skip: 2, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.skip("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.fail("returns a prototypal clone when not given a callback", badType),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.fail("normalizes a file", sentinel),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.skip("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("relative directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.fail("retains negative + trailing slashes", badType),
                        ]),
                        _.suite("edge cases", [
                            _.pass("normalizes `.` with a cwd of `.`"),
                            _.pass("normalizes `..` with a cwd of `.`"),
                            _.pass("normalizes `.` with a cwd of `..`"),
                            _.pass("normalizes directories with a cwd of `..`"),
                            _.pass("removes excess `.`"),
                            _.pass("removes excess `..`"),
                            _.pass("removes excess combined junk"),
                        ]),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 360, pass: 33, fail: 3, skip: 2, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.skip("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.fail("returns a prototypal clone when not given a callback", badType),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.fail("normalizes a file", sentinel),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.skip("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("relative directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.fail("retains negative + trailing slashes", badType),
                        ]),
                        _.suite("edge cases", [
                            _.pass("normalizes `.` with a cwd of `.`"),
                            _.pass("normalizes `..` with a cwd of `.`"),
                            _.pass("normalizes `.` with a cwd of `..`"),
                            _.pass("normalizes directories with a cwd of `..`"),
                            _.pass("removes excess `.`"),
                            _.pass("removes excess `..`"),
                            _.pass("removes excess combined junk"),
                        ]),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 360, pass: 33, fail: 3, skip: 2, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.skip("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.fail("returns a prototypal clone when not given a callback", badType),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.fail("normalizes a file", sentinel),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.skip("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("relative directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.fail("retains negative + trailing slashes", badType),
                        ]),
                        _.suite("edge cases", [
                            _.pass("normalizes `.` with a cwd of `.`"),
                            _.pass("normalizes `..` with a cwd of `.`"),
                            _.pass("normalizes `.` with a cwd of `..`"),
                            _.pass("normalizes directories with a cwd of `..`"),
                            _.pass("removes excess `.`"),
                            _.pass("removes excess `..`"),
                            _.pass("removes excess combined junk"),
                        ]),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 370, pass: 34, fail: 3, skip: 2, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.skip("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.fail("returns a prototypal clone when not given a callback", badType),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.fail("normalizes a file", sentinel),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.skip("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("relative directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.fail("retains negative + trailing slashes", badType),
                        ]),
                        _.suite("edge cases", [
                            _.pass("normalizes `.` with a cwd of `.`"),
                            _.pass("normalizes `..` with a cwd of `.`"),
                            _.pass("normalizes `.` with a cwd of `..`"),
                            _.pass("normalizes directories with a cwd of `..`"),
                            _.pass("removes excess `.`"),
                            _.pass("removes excess `..`"),
                            _.pass("removes excess combined junk"),
                        ]),
                    ]),
                    _.suite("core (timeouts)", []),
                ]})
            },

            function (_) {
                _.match({duration: 370, pass: 34, fail: 3, skip: 3, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.skip("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.fail("returns a prototypal clone when not given a callback", badType),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.fail("normalizes a file", sentinel),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.skip("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("relative directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.fail("retains negative + trailing slashes", badType),
                        ]),
                        _.suite("edge cases", [
                            _.pass("normalizes `.` with a cwd of `.`"),
                            _.pass("normalizes `..` with a cwd of `.`"),
                            _.pass("normalizes `.` with a cwd of `..`"),
                            _.pass("normalizes directories with a cwd of `..`"),
                            _.pass("removes excess `.`"),
                            _.pass("removes excess `..`"),
                            _.pass("removes excess combined junk"),
                        ]),
                    ]),
                    _.suite("core (timeouts)", [
                        _.skip("succeeds with own"),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 380, pass: 35, fail: 3, skip: 3, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.skip("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.fail("returns a prototypal clone when not given a callback", badType),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.fail("normalizes a file", sentinel),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.skip("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("relative directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.fail("retains negative + trailing slashes", badType),
                        ]),
                        _.suite("edge cases", [
                            _.pass("normalizes `.` with a cwd of `.`"),
                            _.pass("normalizes `..` with a cwd of `.`"),
                            _.pass("normalizes `.` with a cwd of `..`"),
                            _.pass("normalizes directories with a cwd of `..`"),
                            _.pass("removes excess `.`"),
                            _.pass("removes excess `..`"),
                            _.pass("removes excess combined junk"),
                        ]),
                    ]),
                    _.suite("core (timeouts)", [
                        _.skip("succeeds with own"),
                        _.pass("fails with own"),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 390, pass: 36, fail: 3, skip: 3, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.skip("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.fail("returns a prototypal clone when not given a callback", badType),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.fail("normalizes a file", sentinel),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.skip("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("relative directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.fail("retains negative + trailing slashes", badType),
                        ]),
                        _.suite("edge cases", [
                            _.pass("normalizes `.` with a cwd of `.`"),
                            _.pass("normalizes `..` with a cwd of `.`"),
                            _.pass("normalizes `.` with a cwd of `..`"),
                            _.pass("normalizes directories with a cwd of `..`"),
                            _.pass("removes excess `.`"),
                            _.pass("removes excess `..`"),
                            _.pass("removes excess combined junk"),
                        ]),
                    ]),
                    _.suite("core (timeouts)", [
                        _.skip("succeeds with own"),
                        _.pass("fails with own"),
                        _.pass("succeeds with inherited"),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 400, pass: 37, fail: 3, skip: 3, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.skip("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.fail("returns a prototypal clone when not given a callback", badType),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.fail("normalizes a file", sentinel),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.skip("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("relative directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.fail("retains negative + trailing slashes", badType),
                        ]),
                        _.suite("edge cases", [
                            _.pass("normalizes `.` with a cwd of `.`"),
                            _.pass("normalizes `..` with a cwd of `.`"),
                            _.pass("normalizes `.` with a cwd of `..`"),
                            _.pass("normalizes directories with a cwd of `..`"),
                            _.pass("removes excess `.`"),
                            _.pass("removes excess `..`"),
                            _.pass("removes excess combined junk"),
                        ]),
                    ]),
                    _.suite("core (timeouts)", [
                        _.skip("succeeds with own"),
                        _.pass("fails with own"),
                        _.pass("succeeds with inherited"),
                        _.pass("fails with inherited"),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 410, pass: 38, fail: 3, skip: 3, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.skip("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.fail("returns a prototypal clone when not given a callback", badType),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.fail("normalizes a file", sentinel),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.skip("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("relative directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.fail("retains negative + trailing slashes", badType),
                        ]),
                        _.suite("edge cases", [
                            _.pass("normalizes `.` with a cwd of `.`"),
                            _.pass("normalizes `..` with a cwd of `.`"),
                            _.pass("normalizes `.` with a cwd of `..`"),
                            _.pass("normalizes directories with a cwd of `..`"),
                            _.pass("removes excess `.`"),
                            _.pass("removes excess `..`"),
                            _.pass("removes excess combined junk"),
                        ]),
                    ]),
                    _.suite("core (timeouts)", [
                        _.skip("succeeds with own"),
                        _.pass("fails with own"),
                        _.pass("succeeds with inherited"),
                        _.pass("fails with inherited"),
                        _.pass("gets own set timeout"),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 420, pass: 38, fail: 4, skip: 3, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.skip("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.fail("returns a prototypal clone when not given a callback", badType),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.fail("normalizes a file", sentinel),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.skip("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("relative directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.fail("retains negative + trailing slashes", badType),
                        ]),
                        _.suite("edge cases", [
                            _.pass("normalizes `.` with a cwd of `.`"),
                            _.pass("normalizes `..` with a cwd of `.`"),
                            _.pass("normalizes `.` with a cwd of `..`"),
                            _.pass("normalizes directories with a cwd of `..`"),
                            _.pass("removes excess `.`"),
                            _.pass("removes excess `..`"),
                            _.pass("removes excess combined junk"),
                        ]),
                    ]),
                    _.suite("core (timeouts)", [
                        _.skip("succeeds with own"),
                        _.pass("fails with own"),
                        _.pass("succeeds with inherited"),
                        _.pass("fails with inherited"),
                        _.pass("gets own set timeout"),
                        _.fail("gets own inline set timeout", sentinel),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 420, pass: 38, fail: 4, skip: 4, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.skip("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.fail("returns a prototypal clone when not given a callback", badType),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.fail("normalizes a file", sentinel),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.skip("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("relative directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.fail("retains negative + trailing slashes", badType),
                        ]),
                        _.suite("edge cases", [
                            _.pass("normalizes `.` with a cwd of `.`"),
                            _.pass("normalizes `..` with a cwd of `.`"),
                            _.pass("normalizes `.` with a cwd of `..`"),
                            _.pass("normalizes directories with a cwd of `..`"),
                            _.pass("removes excess `.`"),
                            _.pass("removes excess `..`"),
                            _.pass("removes excess combined junk"),
                        ]),
                    ]),
                    _.suite("core (timeouts)", [
                        _.skip("succeeds with own"),
                        _.pass("fails with own"),
                        _.pass("succeeds with inherited"),
                        _.pass("fails with inherited"),
                        _.pass("gets own set timeout"),
                        _.fail("gets own inline set timeout", sentinel),
                        _.skip("gets own sync inner timeout"),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 430, pass: 39, fail: 4, skip: 4, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.skip("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.fail("returns a prototypal clone when not given a callback", badType),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.fail("normalizes a file", sentinel),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.skip("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("relative directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.fail("retains negative + trailing slashes", badType),
                        ]),
                        _.suite("edge cases", [
                            _.pass("normalizes `.` with a cwd of `.`"),
                            _.pass("normalizes `..` with a cwd of `.`"),
                            _.pass("normalizes `.` with a cwd of `..`"),
                            _.pass("normalizes directories with a cwd of `..`"),
                            _.pass("removes excess `.`"),
                            _.pass("removes excess `..`"),
                            _.pass("removes excess combined junk"),
                        ]),
                    ]),
                    _.suite("core (timeouts)", [
                        _.skip("succeeds with own"),
                        _.pass("fails with own"),
                        _.pass("succeeds with inherited"),
                        _.pass("fails with inherited"),
                        _.pass("gets own set timeout"),
                        _.fail("gets own inline set timeout", sentinel),
                        _.skip("gets own sync inner timeout"),
                        _.pass("gets default timeout"),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 430, pass: 39, fail: 4, skip: 4, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.skip("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.fail("returns a prototypal clone when not given a callback", badType),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.fail("normalizes a file", sentinel),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.skip("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("relative directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.fail("retains negative + trailing slashes", badType),
                        ]),
                        _.suite("edge cases", [
                            _.pass("normalizes `.` with a cwd of `.`"),
                            _.pass("normalizes `..` with a cwd of `.`"),
                            _.pass("normalizes `.` with a cwd of `..`"),
                            _.pass("normalizes directories with a cwd of `..`"),
                            _.pass("removes excess `.`"),
                            _.pass("removes excess `..`"),
                            _.pass("removes excess combined junk"),
                        ]),
                    ]),
                    _.suite("core (timeouts)", [
                        _.skip("succeeds with own"),
                        _.pass("fails with own"),
                        _.pass("succeeds with inherited"),
                        _.pass("fails with inherited"),
                        _.pass("gets own set timeout"),
                        _.fail("gets own inline set timeout", sentinel),
                        _.skip("gets own sync inner timeout"),
                        _.pass("gets default timeout"),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 430, pass: 39, fail: 4, skip: 4, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`"),
                        _.pass("has `test()`"),
                        _.pass("has `parent()`"),
                        _.skip("can accept a string + function"),
                        _.pass("can accept a string"),
                        _.pass("returns the current instance when given a callback"),
                        _.fail("returns a prototypal clone when not given a callback", badType),
                        _.pass("runs block tests within tests"),
                        _.pass("runs successful inline tests within tests"),
                        _.pass("accepts a callback with `run()`"),
                    ]),
                    _.suite("cli normalize glob", [
                        _.suite("current directory", [
                            _.fail("normalizes a file", sentinel),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("absolute directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.skip("retains negative"),
                            _.pass("retains negative + trailing slashes"),
                        ]),
                        _.suite("relative directory", [
                            _.pass("normalizes a file"),
                            _.pass("normalizes a glob"),
                            _.pass("retains trailing slashes"),
                            _.pass("retains negative"),
                            _.fail("retains negative + trailing slashes", badType),
                        ]),
                        _.suite("edge cases", [
                            _.pass("normalizes `.` with a cwd of `.`"),
                            _.pass("normalizes `..` with a cwd of `.`"),
                            _.pass("normalizes `.` with a cwd of `..`"),
                            _.pass("normalizes directories with a cwd of `..`"),
                            _.pass("removes excess `.`"),
                            _.pass("removes excess `..`"),
                            _.pass("removes excess combined junk"),
                        ]),
                    ]),
                    _.suite("core (timeouts)", [
                        _.skip("succeeds with own"),
                        _.pass("fails with own"),
                        _.pass("succeeds with inherited"),
                        _.pass("fails with inherited"),
                        _.pass("gets own set timeout"),
                        _.fail("gets own inline set timeout", sentinel),
                        _.skip("gets own sync inner timeout"),
                        _.pass("gets default timeout"),
                    ]),
                ]})
            },
        ],
    })

    var multiline = new AssertionError(
        "Test:\n  expected: {id: 1}\n  found: {id: 2}",
        {id: 1}, {id: 2})

    test("multiline fail with AssertionError + pass", {
        input: [
            r.fail("one", multiline),
            r.pass("two"),
        ],
        output: [
            function (_) {
                _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
            },

            function (_) {
                _.match({duration: 10, pass: 0, fail: 1, skip: 0, reports: [
                    _.fail("one", multiline, [
                        _.removed("{ id: 2 }"),
                        _.added("{ id: 1 }"),
                    ]),
                ]})
            },

            function (_) {
                _.match({duration: 20, pass: 1, fail: 1, skip: 0, reports: [
                    _.fail("one", multiline, [
                        _.removed("{ id: 2 }"),
                        _.added("{ id: 1 }"),
                    ]),
                    _.pass("two"),
                ]})
            },

            function (_) {
                _.match({duration: 20, pass: 1, fail: 1, skip: 0, reports: [
                    _.fail("one", multiline, [
                        _.removed("{ id: 2 }"),
                        _.added("{ id: 1 }"),
                    ]),
                    _.pass("two"),
                ]})
            },
        ],
    })

    context("restarting", function () {
        test("empty test", {
            repeat: true,
            input: [],
            output: [
                function (_) {
                    _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
                },

                function (_) {
                    _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
                },
            ],
        })

        test("pass 2", {
            repeat: true,
            input: [
                r.pass("test"),
                r.pass("test"),
            ],
            output: [
                function (_) {
                    _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
                },

                function (_) {
                    _.match({duration: 10, pass: 1, fail: 0, skip: 0, reports: [
                        _.pass("test"),
                    ]})
                },

                function (_) {
                    _.match({duration: 20, pass: 2, fail: 0, skip: 0, reports: [
                        _.pass("test"),
                        _.pass("test"),
                    ]})
                },

                function (_) {
                    _.match({duration: 20, pass: 2, fail: 0, skip: 0, reports: [
                        _.pass("test"),
                        _.pass("test"),
                    ]})
                },
            ],
        })

        var sentinel = new Error("sentinel")

        test("fail 2 with Error", {
            repeat: true,
            input: [
                r.fail("one", sentinel),
                r.fail("two", sentinel),
            ],
            output: [
                function (_) {
                    _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
                },

                function (_) {
                    _.match({duration: 10, pass: 0, fail: 1, skip: 0, reports: [
                        _.fail("one", sentinel),
                    ]})
                },

                function (_) {
                    _.match({duration: 20, pass: 0, fail: 2, skip: 0, reports: [
                        _.fail("one", sentinel),
                        _.fail("two", sentinel),
                    ]})
                },

                function (_) {
                    _.match({duration: 20, pass: 0, fail: 2, skip: 0, reports: [
                        _.fail("one", sentinel),
                        _.fail("two", sentinel),
                    ]})
                },
            ],
        })

        test("pass + fail with Error", {
            repeat: true,
            input: [
                r.pass("one"),
                r.fail("two", sentinel),
            ],
            output: [
                function (_) {
                    _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
                },

                function (_) {
                    _.match({duration: 10, pass: 1, fail: 0, skip: 0, reports: [
                        _.pass("one"),
                    ]})
                },

                function (_) {
                    _.match({duration: 20, pass: 1, fail: 1, skip: 0, reports: [
                        _.pass("one"),
                        _.fail("two", sentinel),
                    ]})
                },

                function (_) {
                    _.match({duration: 20, pass: 1, fail: 1, skip: 0, reports: [
                        _.pass("one"),
                        _.fail("two", sentinel),
                    ]})
                },
            ],
        })

        test("fail with Error + pass", {
            repeat: true,
            input: [
                r.fail("one", sentinel),
                r.pass("two"),
            ],
            output: [
                function (_) {
                    _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
                },

                function (_) {
                    _.match({duration: 10, pass: 0, fail: 1, skip: 0, reports: [
                        _.fail("one", sentinel),
                    ]})
                },

                function (_) {
                    _.match({duration: 20, pass: 1, fail: 1, skip: 0, reports: [
                        _.fail("one", sentinel),
                        _.pass("two"),
                    ]})
                },

                function (_) {
                    _.match({duration: 20, pass: 1, fail: 1, skip: 0, reports: [
                        _.fail("one", sentinel),
                        _.pass("two"),
                    ]})
                },
            ],
        })

        var assertion = new AssertionError("Expected 1 to equal 2", 1, 2)

        test("fail 2 with AssertionError", {
            repeat: true,
            input: [
                r.fail("one", assertion),
                r.fail("two", assertion),
            ],
            output: [
                function (_) {
                    _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
                },

                function (_) {
                    _.match({duration: 10, pass: 0, fail: 1, skip: 0, reports: [
                        _.fail("one", assertion, assertionDiff(_)),
                    ]})
                },

                function (_) {
                    _.match({duration: 20, pass: 0, fail: 2, skip: 0, reports: [
                        _.fail("one", assertion, assertionDiff(_)),
                        _.fail("two", assertion, assertionDiff(_)),
                    ]})
                },

                function (_) {
                    _.match({duration: 20, pass: 0, fail: 2, skip: 0, reports: [
                        _.fail("one", assertion, assertionDiff(_)),
                        _.fail("two", assertion, assertionDiff(_)),
                    ]})
                },
            ],
        })

        test("pass + fail with AssertionError", {
            repeat: true,
            input: [
                r.pass("one"),
                r.fail("two", assertion),
            ],
            output: [
                function (_) {
                    _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
                },

                function (_) {
                    _.match({duration: 10, pass: 1, fail: 0, skip: 0, reports: [
                        _.pass("one"),
                    ]})
                },

                function (_) {
                    _.match({duration: 20, pass: 1, fail: 1, skip: 0, reports: [
                        _.pass("one"),
                        _.fail("two", assertion, assertionDiff(_)),
                    ]})
                },

                function (_) {
                    _.match({duration: 20, pass: 1, fail: 1, skip: 0, reports: [
                        _.pass("one"),
                        _.fail("two", assertion, assertionDiff(_)),
                    ]})
                },
            ],
        })

        test("fail with AssertionError + pass", {
            repeat: true,
            input: [
                r.fail("one", assertion),
                r.pass("two"),
            ],
            output: [
                function (_) {
                    _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
                },

                function (_) {
                    _.match({duration: 10, pass: 0, fail: 1, skip: 0, reports: [
                        _.fail("one", assertion, assertionDiff(_)),
                    ]})
                },

                function (_) {
                    _.match({duration: 20, pass: 1, fail: 1, skip: 0, reports: [
                        _.fail("one", assertion, assertionDiff(_)),
                        _.pass("two"),
                    ]})
                },

                function (_) {
                    _.match({duration: 20, pass: 1, fail: 1, skip: 0, reports: [
                        _.fail("one", assertion, assertionDiff(_)),
                        _.pass("two"),
                    ]})
                },
            ],
        })
    })

    context("speed", function () {
        // Speed affects `"pass"` and `"enter"` events only.

        function at(speed) {
            if (speed === "slow") return 80
            if (speed === "medium") return 40
            if (speed === "fast") return 20
            throw new RangeError("Unknown speed: `" + speed + "`")
        }

        test("is marked with color", {
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
                function (_) {
                    _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
                },

                function (_) {
                    _.match({duration: 20, pass: 1, fail: 0, skip: 0, reports: [
                        _.suite("core (basic)", [], "fast", "20ms"),
                    ]})
                },

                function (_) {
                    _.match({duration: 40, pass: 2, fail: 0, skip: 0, reports: [
                        _.suite("core (basic)", [
                            _.pass("has `base()`", "fast", "20ms"),
                        ], "fast", "20ms"),
                    ]})
                },

                function (_) {
                    _.match({duration: 60, pass: 3, fail: 0, skip: 0, reports: [
                        _.suite("core (basic)", [
                            _.pass("has `base()`", "fast", "20ms"),
                            _.pass("has `test()`", "fast", "20ms"),
                        ], "fast", "20ms"),
                    ]})
                },

                function (_) {
                    _.match({duration: 80, pass: 4, fail: 0, skip: 0, reports: [
                        _.suite("core (basic)", [
                            _.pass("has `base()`", "fast", "20ms"),
                            _.pass("has `test()`", "fast", "20ms"),
                            _.pass("has `parent()`", "fast", "20ms"),
                        ], "fast", "20ms"),
                    ]})
                },

                function (_) {
                    _.match({duration: 100, pass: 5, fail: 0, skip: 0, reports: [
                        _.suite("core (basic)", [
                            _.pass("has `base()`", "fast", "20ms"),
                            _.pass("has `test()`", "fast", "20ms"),
                            _.pass("has `parent()`", "fast", "20ms"),
                            _.pass("can accept a string + function", "fast", "20ms"),
                        ], "fast", "20ms"),
                    ]})
                },

                function (_) {
                    _.match({duration: 120, pass: 6, fail: 0, skip: 0, reports: [
                        _.suite("core (basic)", [
                            _.pass("has `base()`", "fast", "20ms"),
                            _.pass("has `test()`", "fast", "20ms"),
                            _.pass("has `parent()`", "fast", "20ms"),
                            _.pass("can accept a string + function", "fast", "20ms"),
                            _.pass("can accept a string", "fast", "20ms"),
                        ], "fast", "20ms"),
                    ]})
                },

                function (_) {
                    _.match({duration: 160, pass: 7, fail: 0, skip: 0, reports: [
                        _.suite("core (basic)", [
                            _.pass("has `base()`", "fast", "20ms"),
                            _.pass("has `test()`", "fast", "20ms"),
                            _.pass("has `parent()`", "fast", "20ms"),
                            _.pass("can accept a string + function", "fast", "20ms"),
                            _.pass("can accept a string", "fast", "20ms"),
                            _.pass("returns the current instance when given a callback", "medium", "40ms"),
                        ], "fast", "20ms"),
                    ]})
                },

                function (_) {
                    _.match({duration: 200, pass: 8, fail: 0, skip: 0, reports: [
                        _.suite("core (basic)", [
                            _.pass("has `base()`", "fast", "20ms"),
                            _.pass("has `test()`", "fast", "20ms"),
                            _.pass("has `parent()`", "fast", "20ms"),
                            _.pass("can accept a string + function", "fast", "20ms"),
                            _.pass("can accept a string", "fast", "20ms"),
                            _.pass("returns the current instance when given a callback", "medium", "40ms"),
                            _.pass("returns a prototypal clone when not given a callback", "medium", "40ms"),
                        ], "fast", "20ms"),
                    ]})
                },

                function (_) {
                    _.match({duration: 220, pass: 9, fail: 0, skip: 0, reports: [
                        _.suite("core (basic)", [
                            _.pass("has `base()`", "fast", "20ms"),
                            _.pass("has `test()`", "fast", "20ms"),
                            _.pass("has `parent()`", "fast", "20ms"),
                            _.pass("can accept a string + function", "fast", "20ms"),
                            _.pass("can accept a string", "fast", "20ms"),
                            _.pass("returns the current instance when given a callback", "medium", "40ms"),
                            _.pass("returns a prototypal clone when not given a callback", "medium", "40ms"),
                            _.pass("runs block tests within tests", "fast", "20ms"),
                        ], "fast", "20ms"),
                    ]})
                },

                function (_) {
                    _.match({duration: 240, pass: 10, fail: 0, skip: 0, reports: [
                        _.suite("core (basic)", [
                            _.pass("has `base()`", "fast", "20ms"),
                            _.pass("has `test()`", "fast", "20ms"),
                            _.pass("has `parent()`", "fast", "20ms"),
                            _.pass("can accept a string + function", "fast", "20ms"),
                            _.pass("can accept a string", "fast", "20ms"),
                            _.pass("returns the current instance when given a callback", "medium", "40ms"),
                            _.pass("returns a prototypal clone when not given a callback", "medium", "40ms"),
                            _.pass("runs block tests within tests", "fast", "20ms"),
                            _.pass("runs successful inline tests within tests", "fast", "20ms"),
                        ], "fast", "20ms"),
                    ]})
                },

                function (_) {
                    _.match({duration: 260, pass: 11, fail: 0, skip: 0, reports: [
                        _.suite("core (basic)", [
                            _.pass("has `base()`", "fast", "20ms"),
                            _.pass("has `test()`", "fast", "20ms"),
                            _.pass("has `parent()`", "fast", "20ms"),
                            _.pass("can accept a string + function", "fast", "20ms"),
                            _.pass("can accept a string", "fast", "20ms"),
                            _.pass("returns the current instance when given a callback", "medium", "40ms"),
                            _.pass("returns a prototypal clone when not given a callback", "medium", "40ms"),
                            _.pass("runs block tests within tests", "fast", "20ms"),
                            _.pass("runs successful inline tests within tests", "fast", "20ms"),
                            _.pass("accepts a callback with `run()`", "fast", "20ms"),
                        ], "fast", "20ms"),
                    ]})
                },

                function (_) {
                    _.match({duration: 260, pass: 11, fail: 0, skip: 0, reports: [
                        _.suite("core (basic)", [
                            _.pass("has `base()`", "fast", "20ms"),
                            _.pass("has `test()`", "fast", "20ms"),
                            _.pass("has `parent()`", "fast", "20ms"),
                            _.pass("can accept a string + function", "fast", "20ms"),
                            _.pass("can accept a string", "fast", "20ms"),
                            _.pass("returns the current instance when given a callback", "medium", "40ms"),
                            _.pass("returns a prototypal clone when not given a callback", "medium", "40ms"),
                            _.pass("runs block tests within tests", "fast", "20ms"),
                            _.pass("runs successful inline tests within tests", "fast", "20ms"),
                            _.pass("accepts a callback with `run()`", "fast", "20ms"),
                        ], "fast", "20ms"),
                    ]})
                },

                function (_) {
                    _.match({duration: 280, pass: 12, fail: 0, skip: 0, reports: [
                        _.suite("core (basic)", [
                            _.pass("has `base()`", "fast", "20ms"),
                            _.pass("has `test()`", "fast", "20ms"),
                            _.pass("has `parent()`", "fast", "20ms"),
                            _.pass("can accept a string + function", "fast", "20ms"),
                            _.pass("can accept a string", "fast", "20ms"),
                            _.pass("returns the current instance when given a callback", "medium", "40ms"),
                            _.pass("returns a prototypal clone when not given a callback", "medium", "40ms"),
                            _.pass("runs block tests within tests", "fast", "20ms"),
                            _.pass("runs successful inline tests within tests", "fast", "20ms"),
                            _.pass("accepts a callback with `run()`", "fast", "20ms"),
                        ], "fast", "20ms"),
                        _.suite("cli normalize glob", [], "fast", "20ms"),
                    ]})
                },

                function (_) {
                    _.match({duration: 300, pass: 13, fail: 0, skip: 0, reports: [
                        _.suite("core (basic)", [
                            _.pass("has `base()`", "fast", "20ms"),
                            _.pass("has `test()`", "fast", "20ms"),
                            _.pass("has `parent()`", "fast", "20ms"),
                            _.pass("can accept a string + function", "fast", "20ms"),
                            _.pass("can accept a string", "fast", "20ms"),
                            _.pass("returns the current instance when given a callback", "medium", "40ms"),
                            _.pass("returns a prototypal clone when not given a callback", "medium", "40ms"),
                            _.pass("runs block tests within tests", "fast", "20ms"),
                            _.pass("runs successful inline tests within tests", "fast", "20ms"),
                            _.pass("accepts a callback with `run()`", "fast", "20ms"),
                        ], "fast", "20ms"),
                        _.suite("cli normalize glob", [
                            _.suite("current directory", [], "fast", "20ms"),
                        ], "fast", "20ms"),
                    ]})
                },

                function (_) {
                    _.match({duration: 320, pass: 14, fail: 0, skip: 0, reports: [
                        _.suite("core (basic)", [
                            _.pass("has `base()`", "fast", "20ms"),
                            _.pass("has `test()`", "fast", "20ms"),
                            _.pass("has `parent()`", "fast", "20ms"),
                            _.pass("can accept a string + function", "fast", "20ms"),
                            _.pass("can accept a string", "fast", "20ms"),
                            _.pass("returns the current instance when given a callback", "medium", "40ms"),
                            _.pass("returns a prototypal clone when not given a callback", "medium", "40ms"),
                            _.pass("runs block tests within tests", "fast", "20ms"),
                            _.pass("runs successful inline tests within tests", "fast", "20ms"),
                            _.pass("accepts a callback with `run()`", "fast", "20ms"),
                        ], "fast", "20ms"),
                        _.suite("cli normalize glob", [
                            _.suite("current directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                            ], "fast", "20ms"),
                        ], "fast", "20ms"),
                    ]})
                },

                function (_) {
                    _.match({duration: 340, pass: 15, fail: 0, skip: 0, reports: [
                        _.suite("core (basic)", [
                            _.pass("has `base()`", "fast", "20ms"),
                            _.pass("has `test()`", "fast", "20ms"),
                            _.pass("has `parent()`", "fast", "20ms"),
                            _.pass("can accept a string + function", "fast", "20ms"),
                            _.pass("can accept a string", "fast", "20ms"),
                            _.pass("returns the current instance when given a callback", "medium", "40ms"),
                            _.pass("returns a prototypal clone when not given a callback", "medium", "40ms"),
                            _.pass("runs block tests within tests", "fast", "20ms"),
                            _.pass("runs successful inline tests within tests", "fast", "20ms"),
                            _.pass("accepts a callback with `run()`", "fast", "20ms"),
                        ], "fast", "20ms"),
                        _.suite("cli normalize glob", [
                            _.suite("current directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                            ], "fast", "20ms"),
                        ], "fast", "20ms"),
                    ]})
                },

                function (_) {
                    _.match({duration: 360, pass: 16, fail: 0, skip: 0, reports: [
                        _.suite("core (basic)", [
                            _.pass("has `base()`", "fast", "20ms"),
                            _.pass("has `test()`", "fast", "20ms"),
                            _.pass("has `parent()`", "fast", "20ms"),
                            _.pass("can accept a string + function", "fast", "20ms"),
                            _.pass("can accept a string", "fast", "20ms"),
                            _.pass("returns the current instance when given a callback", "medium", "40ms"),
                            _.pass("returns a prototypal clone when not given a callback", "medium", "40ms"),
                            _.pass("runs block tests within tests", "fast", "20ms"),
                            _.pass("runs successful inline tests within tests", "fast", "20ms"),
                            _.pass("accepts a callback with `run()`", "fast", "20ms"),
                        ], "fast", "20ms"),
                        _.suite("cli normalize glob", [
                            _.suite("current directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                        ], "fast", "20ms"),
                    ]})
                },

                function (_) {
                    _.match({duration: 380, pass: 17, fail: 0, skip: 0, reports: [
                        _.suite("core (basic)", [
                            _.pass("has `base()`", "fast", "20ms"),
                            _.pass("has `test()`", "fast", "20ms"),
                            _.pass("has `parent()`", "fast", "20ms"),
                            _.pass("can accept a string + function", "fast", "20ms"),
                            _.pass("can accept a string", "fast", "20ms"),
                            _.pass("returns the current instance when given a callback", "medium", "40ms"),
                            _.pass("returns a prototypal clone when not given a callback", "medium", "40ms"),
                            _.pass("runs block tests within tests", "fast", "20ms"),
                            _.pass("runs successful inline tests within tests", "fast", "20ms"),
                            _.pass("accepts a callback with `run()`", "fast", "20ms"),
                        ], "fast", "20ms"),
                        _.suite("cli normalize glob", [
                            _.suite("current directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                            ], "fast", "20ms"),
                        ], "fast", "20ms"),
                    ]})
                },

                function (_) {
                    _.match({duration: 400, pass: 18, fail: 0, skip: 0, reports: [
                        _.suite("core (basic)", [
                            _.pass("has `base()`", "fast", "20ms"),
                            _.pass("has `test()`", "fast", "20ms"),
                            _.pass("has `parent()`", "fast", "20ms"),
                            _.pass("can accept a string + function", "fast", "20ms"),
                            _.pass("can accept a string", "fast", "20ms"),
                            _.pass("returns the current instance when given a callback", "medium", "40ms"),
                            _.pass("returns a prototypal clone when not given a callback", "medium", "40ms"),
                            _.pass("runs block tests within tests", "fast", "20ms"),
                            _.pass("runs successful inline tests within tests", "fast", "20ms"),
                            _.pass("accepts a callback with `run()`", "fast", "20ms"),
                        ], "fast", "20ms"),
                        _.suite("cli normalize glob", [
                            _.suite("current directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                        ], "fast", "20ms"),
                    ]})
                },

                function (_) {
                    _.match({duration: 400, pass: 18, fail: 0, skip: 0, reports: [
                        _.suite("core (basic)", [
                            _.pass("has `base()`", "fast", "20ms"),
                            _.pass("has `test()`", "fast", "20ms"),
                            _.pass("has `parent()`", "fast", "20ms"),
                            _.pass("can accept a string + function", "fast", "20ms"),
                            _.pass("can accept a string", "fast", "20ms"),
                            _.pass("returns the current instance when given a callback", "medium", "40ms"),
                            _.pass("returns a prototypal clone when not given a callback", "medium", "40ms"),
                            _.pass("runs block tests within tests", "fast", "20ms"),
                            _.pass("runs successful inline tests within tests", "fast", "20ms"),
                            _.pass("accepts a callback with `run()`", "fast", "20ms"),
                        ], "fast", "20ms"),
                        _.suite("cli normalize glob", [
                            _.suite("current directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                        ], "fast", "20ms"),
                    ]})
                },

                function (_) {
                    _.match({duration: 420, pass: 19, fail: 0, skip: 0, reports: [
                        _.suite("core (basic)", [
                            _.pass("has `base()`", "fast", "20ms"),
                            _.pass("has `test()`", "fast", "20ms"),
                            _.pass("has `parent()`", "fast", "20ms"),
                            _.pass("can accept a string + function", "fast", "20ms"),
                            _.pass("can accept a string", "fast", "20ms"),
                            _.pass("returns the current instance when given a callback", "medium", "40ms"),
                            _.pass("returns a prototypal clone when not given a callback", "medium", "40ms"),
                            _.pass("runs block tests within tests", "fast", "20ms"),
                            _.pass("runs successful inline tests within tests", "fast", "20ms"),
                            _.pass("accepts a callback with `run()`", "fast", "20ms"),
                        ], "fast", "20ms"),
                        _.suite("cli normalize glob", [
                            _.suite("current directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("absolute directory", [], "fast", "20ms"),
                        ], "fast", "20ms"),
                    ]})
                },

                function (_) {
                    _.match({duration: 440, pass: 20, fail: 0, skip: 0, reports: [
                        _.suite("core (basic)", [
                            _.pass("has `base()`", "fast", "20ms"),
                            _.pass("has `test()`", "fast", "20ms"),
                            _.pass("has `parent()`", "fast", "20ms"),
                            _.pass("can accept a string + function", "fast", "20ms"),
                            _.pass("can accept a string", "fast", "20ms"),
                            _.pass("returns the current instance when given a callback", "medium", "40ms"),
                            _.pass("returns a prototypal clone when not given a callback", "medium", "40ms"),
                            _.pass("runs block tests within tests", "fast", "20ms"),
                            _.pass("runs successful inline tests within tests", "fast", "20ms"),
                            _.pass("accepts a callback with `run()`", "fast", "20ms"),
                        ], "fast", "20ms"),
                        _.suite("cli normalize glob", [
                            _.suite("current directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("absolute directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                            ], "fast", "20ms"),
                        ], "fast", "20ms"),
                    ]})
                },

                function (_) {
                    _.match({duration: 460, pass: 21, fail: 0, skip: 0, reports: [
                        _.suite("core (basic)", [
                            _.pass("has `base()`", "fast", "20ms"),
                            _.pass("has `test()`", "fast", "20ms"),
                            _.pass("has `parent()`", "fast", "20ms"),
                            _.pass("can accept a string + function", "fast", "20ms"),
                            _.pass("can accept a string", "fast", "20ms"),
                            _.pass("returns the current instance when given a callback", "medium", "40ms"),
                            _.pass("returns a prototypal clone when not given a callback", "medium", "40ms"),
                            _.pass("runs block tests within tests", "fast", "20ms"),
                            _.pass("runs successful inline tests within tests", "fast", "20ms"),
                            _.pass("accepts a callback with `run()`", "fast", "20ms"),
                        ], "fast", "20ms"),
                        _.suite("cli normalize glob", [
                            _.suite("current directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("absolute directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                            ], "fast", "20ms"),
                        ], "fast", "20ms"),
                    ]})
                },

                function (_) {
                    _.match({duration: 480, pass: 22, fail: 0, skip: 0, reports: [
                        _.suite("core (basic)", [
                            _.pass("has `base()`", "fast", "20ms"),
                            _.pass("has `test()`", "fast", "20ms"),
                            _.pass("has `parent()`", "fast", "20ms"),
                            _.pass("can accept a string + function", "fast", "20ms"),
                            _.pass("can accept a string", "fast", "20ms"),
                            _.pass("returns the current instance when given a callback", "medium", "40ms"),
                            _.pass("returns a prototypal clone when not given a callback", "medium", "40ms"),
                            _.pass("runs block tests within tests", "fast", "20ms"),
                            _.pass("runs successful inline tests within tests", "fast", "20ms"),
                            _.pass("accepts a callback with `run()`", "fast", "20ms"),
                        ], "fast", "20ms"),
                        _.suite("cli normalize glob", [
                            _.suite("current directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("absolute directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                        ], "fast", "20ms"),
                    ]})
                },

                function (_) {
                    _.match({duration: 500, pass: 23, fail: 0, skip: 0, reports: [
                        _.suite("core (basic)", [
                            _.pass("has `base()`", "fast", "20ms"),
                            _.pass("has `test()`", "fast", "20ms"),
                            _.pass("has `parent()`", "fast", "20ms"),
                            _.pass("can accept a string + function", "fast", "20ms"),
                            _.pass("can accept a string", "fast", "20ms"),
                            _.pass("returns the current instance when given a callback", "medium", "40ms"),
                            _.pass("returns a prototypal clone when not given a callback", "medium", "40ms"),
                            _.pass("runs block tests within tests", "fast", "20ms"),
                            _.pass("runs successful inline tests within tests", "fast", "20ms"),
                            _.pass("accepts a callback with `run()`", "fast", "20ms"),
                        ], "fast", "20ms"),
                        _.suite("cli normalize glob", [
                            _.suite("current directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("absolute directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                            ], "fast", "20ms"),
                        ], "fast", "20ms"),
                    ]})
                },

                function (_) {
                    _.match({duration: 520, pass: 24, fail: 0, skip: 0, reports: [
                        _.suite("core (basic)", [
                            _.pass("has `base()`", "fast", "20ms"),
                            _.pass("has `test()`", "fast", "20ms"),
                            _.pass("has `parent()`", "fast", "20ms"),
                            _.pass("can accept a string + function", "fast", "20ms"),
                            _.pass("can accept a string", "fast", "20ms"),
                            _.pass("returns the current instance when given a callback", "medium", "40ms"),
                            _.pass("returns a prototypal clone when not given a callback", "medium", "40ms"),
                            _.pass("runs block tests within tests", "fast", "20ms"),
                            _.pass("runs successful inline tests within tests", "fast", "20ms"),
                            _.pass("accepts a callback with `run()`", "fast", "20ms"),
                        ], "fast", "20ms"),
                        _.suite("cli normalize glob", [
                            _.suite("current directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("absolute directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                        ], "fast", "20ms"),
                    ]})
                },

                function (_) {
                    _.match({duration: 520, pass: 24, fail: 0, skip: 0, reports: [
                        _.suite("core (basic)", [
                            _.pass("has `base()`", "fast", "20ms"),
                            _.pass("has `test()`", "fast", "20ms"),
                            _.pass("has `parent()`", "fast", "20ms"),
                            _.pass("can accept a string + function", "fast", "20ms"),
                            _.pass("can accept a string", "fast", "20ms"),
                            _.pass("returns the current instance when given a callback", "medium", "40ms"),
                            _.pass("returns a prototypal clone when not given a callback", "medium", "40ms"),
                            _.pass("runs block tests within tests", "fast", "20ms"),
                            _.pass("runs successful inline tests within tests", "fast", "20ms"),
                            _.pass("accepts a callback with `run()`", "fast", "20ms"),
                        ], "fast", "20ms"),
                        _.suite("cli normalize glob", [
                            _.suite("current directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("absolute directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                        ], "fast", "20ms"),
                    ]})
                },

                function (_) {
                    _.match({duration: 540, pass: 25, fail: 0, skip: 0, reports: [
                        _.suite("core (basic)", [
                            _.pass("has `base()`", "fast", "20ms"),
                            _.pass("has `test()`", "fast", "20ms"),
                            _.pass("has `parent()`", "fast", "20ms"),
                            _.pass("can accept a string + function", "fast", "20ms"),
                            _.pass("can accept a string", "fast", "20ms"),
                            _.pass("returns the current instance when given a callback", "medium", "40ms"),
                            _.pass("returns a prototypal clone when not given a callback", "medium", "40ms"),
                            _.pass("runs block tests within tests", "fast", "20ms"),
                            _.pass("runs successful inline tests within tests", "fast", "20ms"),
                            _.pass("accepts a callback with `run()`", "fast", "20ms"),
                        ], "fast", "20ms"),
                        _.suite("cli normalize glob", [
                            _.suite("current directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("absolute directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("relative directory", [], "fast", "20ms"),
                        ], "fast", "20ms"),
                    ]})
                },

                function (_) {
                    _.match({duration: 560, pass: 26, fail: 0, skip: 0, reports: [
                        _.suite("core (basic)", [
                            _.pass("has `base()`", "fast", "20ms"),
                            _.pass("has `test()`", "fast", "20ms"),
                            _.pass("has `parent()`", "fast", "20ms"),
                            _.pass("can accept a string + function", "fast", "20ms"),
                            _.pass("can accept a string", "fast", "20ms"),
                            _.pass("returns the current instance when given a callback", "medium", "40ms"),
                            _.pass("returns a prototypal clone when not given a callback", "medium", "40ms"),
                            _.pass("runs block tests within tests", "fast", "20ms"),
                            _.pass("runs successful inline tests within tests", "fast", "20ms"),
                            _.pass("accepts a callback with `run()`", "fast", "20ms"),
                        ], "fast", "20ms"),
                        _.suite("cli normalize glob", [
                            _.suite("current directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("absolute directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("relative directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                            ], "fast", "20ms"),
                        ], "fast", "20ms"),
                    ]})
                },

                function (_) {
                    _.match({duration: 580, pass: 27, fail: 0, skip: 0, reports: [
                        _.suite("core (basic)", [
                            _.pass("has `base()`", "fast", "20ms"),
                            _.pass("has `test()`", "fast", "20ms"),
                            _.pass("has `parent()`", "fast", "20ms"),
                            _.pass("can accept a string + function", "fast", "20ms"),
                            _.pass("can accept a string", "fast", "20ms"),
                            _.pass("returns the current instance when given a callback", "medium", "40ms"),
                            _.pass("returns a prototypal clone when not given a callback", "medium", "40ms"),
                            _.pass("runs block tests within tests", "fast", "20ms"),
                            _.pass("runs successful inline tests within tests", "fast", "20ms"),
                            _.pass("accepts a callback with `run()`", "fast", "20ms"),
                        ], "fast", "20ms"),
                        _.suite("cli normalize glob", [
                            _.suite("current directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("absolute directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("relative directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                            ], "fast", "20ms"),
                        ], "fast", "20ms"),
                    ]})
                },

                function (_) {
                    _.match({duration: 600, pass: 28, fail: 0, skip: 0, reports: [
                        _.suite("core (basic)", [
                            _.pass("has `base()`", "fast", "20ms"),
                            _.pass("has `test()`", "fast", "20ms"),
                            _.pass("has `parent()`", "fast", "20ms"),
                            _.pass("can accept a string + function", "fast", "20ms"),
                            _.pass("can accept a string", "fast", "20ms"),
                            _.pass("returns the current instance when given a callback", "medium", "40ms"),
                            _.pass("returns a prototypal clone when not given a callback", "medium", "40ms"),
                            _.pass("runs block tests within tests", "fast", "20ms"),
                            _.pass("runs successful inline tests within tests", "fast", "20ms"),
                            _.pass("accepts a callback with `run()`", "fast", "20ms"),
                        ], "fast", "20ms"),
                        _.suite("cli normalize glob", [
                            _.suite("current directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("absolute directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("relative directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                        ], "fast", "20ms"),
                    ]})
                },

                function (_) {
                    _.match({duration: 620, pass: 29, fail: 0, skip: 0, reports: [
                        _.suite("core (basic)", [
                            _.pass("has `base()`", "fast", "20ms"),
                            _.pass("has `test()`", "fast", "20ms"),
                            _.pass("has `parent()`", "fast", "20ms"),
                            _.pass("can accept a string + function", "fast", "20ms"),
                            _.pass("can accept a string", "fast", "20ms"),
                            _.pass("returns the current instance when given a callback", "medium", "40ms"),
                            _.pass("returns a prototypal clone when not given a callback", "medium", "40ms"),
                            _.pass("runs block tests within tests", "fast", "20ms"),
                            _.pass("runs successful inline tests within tests", "fast", "20ms"),
                            _.pass("accepts a callback with `run()`", "fast", "20ms"),
                        ], "fast", "20ms"),
                        _.suite("cli normalize glob", [
                            _.suite("current directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("absolute directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("relative directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                            ], "fast", "20ms"),
                        ], "fast", "20ms"),
                    ]})
                },

                function (_) {
                    _.match({duration: 640, pass: 30, fail: 0, skip: 0, reports: [
                        _.suite("core (basic)", [
                            _.pass("has `base()`", "fast", "20ms"),
                            _.pass("has `test()`", "fast", "20ms"),
                            _.pass("has `parent()`", "fast", "20ms"),
                            _.pass("can accept a string + function", "fast", "20ms"),
                            _.pass("can accept a string", "fast", "20ms"),
                            _.pass("returns the current instance when given a callback", "medium", "40ms"),
                            _.pass("returns a prototypal clone when not given a callback", "medium", "40ms"),
                            _.pass("runs block tests within tests", "fast", "20ms"),
                            _.pass("runs successful inline tests within tests", "fast", "20ms"),
                            _.pass("accepts a callback with `run()`", "fast", "20ms"),
                        ], "fast", "20ms"),
                        _.suite("cli normalize glob", [
                            _.suite("current directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("absolute directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("relative directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                        ], "fast", "20ms"),
                    ]})
                },

                function (_) {
                    _.match({duration: 640, pass: 30, fail: 0, skip: 0, reports: [
                        _.suite("core (basic)", [
                            _.pass("has `base()`", "fast", "20ms"),
                            _.pass("has `test()`", "fast", "20ms"),
                            _.pass("has `parent()`", "fast", "20ms"),
                            _.pass("can accept a string + function", "fast", "20ms"),
                            _.pass("can accept a string", "fast", "20ms"),
                            _.pass("returns the current instance when given a callback", "medium", "40ms"),
                            _.pass("returns a prototypal clone when not given a callback", "medium", "40ms"),
                            _.pass("runs block tests within tests", "fast", "20ms"),
                            _.pass("runs successful inline tests within tests", "fast", "20ms"),
                            _.pass("accepts a callback with `run()`", "fast", "20ms"),
                        ], "fast", "20ms"),
                        _.suite("cli normalize glob", [
                            _.suite("current directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("absolute directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("relative directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                        ], "fast", "20ms"),
                    ]})
                },

                function (_) {
                    _.match({duration: 660, pass: 31, fail: 0, skip: 0, reports: [
                        _.suite("core (basic)", [
                            _.pass("has `base()`", "fast", "20ms"),
                            _.pass("has `test()`", "fast", "20ms"),
                            _.pass("has `parent()`", "fast", "20ms"),
                            _.pass("can accept a string + function", "fast", "20ms"),
                            _.pass("can accept a string", "fast", "20ms"),
                            _.pass("returns the current instance when given a callback", "medium", "40ms"),
                            _.pass("returns a prototypal clone when not given a callback", "medium", "40ms"),
                            _.pass("runs block tests within tests", "fast", "20ms"),
                            _.pass("runs successful inline tests within tests", "fast", "20ms"),
                            _.pass("accepts a callback with `run()`", "fast", "20ms"),
                        ], "fast", "20ms"),
                        _.suite("cli normalize glob", [
                            _.suite("current directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("absolute directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("relative directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("edge cases", [], "fast", "20ms"),
                        ], "fast", "20ms"),
                    ]})
                },

                function (_) {
                    _.match({duration: 680, pass: 32, fail: 0, skip: 0, reports: [
                        _.suite("core (basic)", [
                            _.pass("has `base()`", "fast", "20ms"),
                            _.pass("has `test()`", "fast", "20ms"),
                            _.pass("has `parent()`", "fast", "20ms"),
                            _.pass("can accept a string + function", "fast", "20ms"),
                            _.pass("can accept a string", "fast", "20ms"),
                            _.pass("returns the current instance when given a callback", "medium", "40ms"),
                            _.pass("returns a prototypal clone when not given a callback", "medium", "40ms"),
                            _.pass("runs block tests within tests", "fast", "20ms"),
                            _.pass("runs successful inline tests within tests", "fast", "20ms"),
                            _.pass("accepts a callback with `run()`", "fast", "20ms"),
                        ], "fast", "20ms"),
                        _.suite("cli normalize glob", [
                            _.suite("current directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("absolute directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("relative directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("edge cases", [
                                _.pass("normalizes `.` with a cwd of `.`", "fast", "20ms"),
                            ], "fast", "20ms"),
                        ], "fast", "20ms"),
                    ]})
                },

                function (_) {
                    _.match({duration: 700, pass: 33, fail: 0, skip: 0, reports: [
                        _.suite("core (basic)", [
                            _.pass("has `base()`", "fast", "20ms"),
                            _.pass("has `test()`", "fast", "20ms"),
                            _.pass("has `parent()`", "fast", "20ms"),
                            _.pass("can accept a string + function", "fast", "20ms"),
                            _.pass("can accept a string", "fast", "20ms"),
                            _.pass("returns the current instance when given a callback", "medium", "40ms"),
                            _.pass("returns a prototypal clone when not given a callback", "medium", "40ms"),
                            _.pass("runs block tests within tests", "fast", "20ms"),
                            _.pass("runs successful inline tests within tests", "fast", "20ms"),
                            _.pass("accepts a callback with `run()`", "fast", "20ms"),
                        ], "fast", "20ms"),
                        _.suite("cli normalize glob", [
                            _.suite("current directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("absolute directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("relative directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("edge cases", [
                                _.pass("normalizes `.` with a cwd of `.`", "fast", "20ms"),
                                _.pass("normalizes `..` with a cwd of `.`", "fast", "20ms"),
                            ], "fast", "20ms"),
                        ], "fast", "20ms"),
                    ]})
                },

                function (_) {
                    _.match({duration: 720, pass: 34, fail: 0, skip: 0, reports: [
                        _.suite("core (basic)", [
                            _.pass("has `base()`", "fast", "20ms"),
                            _.pass("has `test()`", "fast", "20ms"),
                            _.pass("has `parent()`", "fast", "20ms"),
                            _.pass("can accept a string + function", "fast", "20ms"),
                            _.pass("can accept a string", "fast", "20ms"),
                            _.pass("returns the current instance when given a callback", "medium", "40ms"),
                            _.pass("returns a prototypal clone when not given a callback", "medium", "40ms"),
                            _.pass("runs block tests within tests", "fast", "20ms"),
                            _.pass("runs successful inline tests within tests", "fast", "20ms"),
                            _.pass("accepts a callback with `run()`", "fast", "20ms"),
                        ], "fast", "20ms"),
                        _.suite("cli normalize glob", [
                            _.suite("current directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("absolute directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("relative directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("edge cases", [
                                _.pass("normalizes `.` with a cwd of `.`", "fast", "20ms"),
                                _.pass("normalizes `..` with a cwd of `.`", "fast", "20ms"),
                                _.pass("normalizes `.` with a cwd of `..`", "fast", "20ms"),
                            ], "fast", "20ms"),
                        ], "fast", "20ms"),
                    ]})
                },

                function (_) {
                    _.match({duration: 740, pass: 35, fail: 0, skip: 0, reports: [
                        _.suite("core (basic)", [
                            _.pass("has `base()`", "fast", "20ms"),
                            _.pass("has `test()`", "fast", "20ms"),
                            _.pass("has `parent()`", "fast", "20ms"),
                            _.pass("can accept a string + function", "fast", "20ms"),
                            _.pass("can accept a string", "fast", "20ms"),
                            _.pass("returns the current instance when given a callback", "medium", "40ms"),
                            _.pass("returns a prototypal clone when not given a callback", "medium", "40ms"),
                            _.pass("runs block tests within tests", "fast", "20ms"),
                            _.pass("runs successful inline tests within tests", "fast", "20ms"),
                            _.pass("accepts a callback with `run()`", "fast", "20ms"),
                        ], "fast", "20ms"),
                        _.suite("cli normalize glob", [
                            _.suite("current directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("absolute directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("relative directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("edge cases", [
                                _.pass("normalizes `.` with a cwd of `.`", "fast", "20ms"),
                                _.pass("normalizes `..` with a cwd of `.`", "fast", "20ms"),
                                _.pass("normalizes `.` with a cwd of `..`", "fast", "20ms"),
                                _.pass("normalizes directories with a cwd of `..`", "fast", "20ms"),
                            ], "fast", "20ms"),
                        ], "fast", "20ms"),
                    ]})
                },

                function (_) {
                    _.match({duration: 760, pass: 36, fail: 0, skip: 0, reports: [
                        _.suite("core (basic)", [
                            _.pass("has `base()`", "fast", "20ms"),
                            _.pass("has `test()`", "fast", "20ms"),
                            _.pass("has `parent()`", "fast", "20ms"),
                            _.pass("can accept a string + function", "fast", "20ms"),
                            _.pass("can accept a string", "fast", "20ms"),
                            _.pass("returns the current instance when given a callback", "medium", "40ms"),
                            _.pass("returns a prototypal clone when not given a callback", "medium", "40ms"),
                            _.pass("runs block tests within tests", "fast", "20ms"),
                            _.pass("runs successful inline tests within tests", "fast", "20ms"),
                            _.pass("accepts a callback with `run()`", "fast", "20ms"),
                        ], "fast", "20ms"),
                        _.suite("cli normalize glob", [
                            _.suite("current directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("absolute directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("relative directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("edge cases", [
                                _.pass("normalizes `.` with a cwd of `.`", "fast", "20ms"),
                                _.pass("normalizes `..` with a cwd of `.`", "fast", "20ms"),
                                _.pass("normalizes `.` with a cwd of `..`", "fast", "20ms"),
                                _.pass("normalizes directories with a cwd of `..`", "fast", "20ms"),
                                _.pass("removes excess `.`", "fast", "20ms"),
                            ], "fast", "20ms"),
                        ], "fast", "20ms"),
                    ]})
                },

                function (_) {
                    _.match({duration: 780, pass: 37, fail: 0, skip: 0, reports: [
                        _.suite("core (basic)", [
                            _.pass("has `base()`", "fast", "20ms"),
                            _.pass("has `test()`", "fast", "20ms"),
                            _.pass("has `parent()`", "fast", "20ms"),
                            _.pass("can accept a string + function", "fast", "20ms"),
                            _.pass("can accept a string", "fast", "20ms"),
                            _.pass("returns the current instance when given a callback", "medium", "40ms"),
                            _.pass("returns a prototypal clone when not given a callback", "medium", "40ms"),
                            _.pass("runs block tests within tests", "fast", "20ms"),
                            _.pass("runs successful inline tests within tests", "fast", "20ms"),
                            _.pass("accepts a callback with `run()`", "fast", "20ms"),
                        ], "fast", "20ms"),
                        _.suite("cli normalize glob", [
                            _.suite("current directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("absolute directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("relative directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("edge cases", [
                                _.pass("normalizes `.` with a cwd of `.`", "fast", "20ms"),
                                _.pass("normalizes `..` with a cwd of `.`", "fast", "20ms"),
                                _.pass("normalizes `.` with a cwd of `..`", "fast", "20ms"),
                                _.pass("normalizes directories with a cwd of `..`", "fast", "20ms"),
                                _.pass("removes excess `.`", "fast", "20ms"),
                                _.pass("removes excess `..`", "fast", "20ms"),
                            ], "fast", "20ms"),
                        ], "fast", "20ms"),
                    ]})
                },

                function (_) {
                    _.match({duration: 800, pass: 38, fail: 0, skip: 0, reports: [
                        _.suite("core (basic)", [
                            _.pass("has `base()`", "fast", "20ms"),
                            _.pass("has `test()`", "fast", "20ms"),
                            _.pass("has `parent()`", "fast", "20ms"),
                            _.pass("can accept a string + function", "fast", "20ms"),
                            _.pass("can accept a string", "fast", "20ms"),
                            _.pass("returns the current instance when given a callback", "medium", "40ms"),
                            _.pass("returns a prototypal clone when not given a callback", "medium", "40ms"),
                            _.pass("runs block tests within tests", "fast", "20ms"),
                            _.pass("runs successful inline tests within tests", "fast", "20ms"),
                            _.pass("accepts a callback with `run()`", "fast", "20ms"),
                        ], "fast", "20ms"),
                        _.suite("cli normalize glob", [
                            _.suite("current directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("absolute directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("relative directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("edge cases", [
                                _.pass("normalizes `.` with a cwd of `.`", "fast", "20ms"),
                                _.pass("normalizes `..` with a cwd of `.`", "fast", "20ms"),
                                _.pass("normalizes `.` with a cwd of `..`", "fast", "20ms"),
                                _.pass("normalizes directories with a cwd of `..`", "fast", "20ms"),
                                _.pass("removes excess `.`", "fast", "20ms"),
                                _.pass("removes excess `..`", "fast", "20ms"),
                                _.pass("removes excess combined junk", "fast", "20ms"),
                            ], "fast", "20ms"),
                        ], "fast", "20ms"),
                    ]})
                },

                function (_) {
                    _.match({duration: 800, pass: 38, fail: 0, skip: 0, reports: [
                        _.suite("core (basic)", [
                            _.pass("has `base()`", "fast", "20ms"),
                            _.pass("has `test()`", "fast", "20ms"),
                            _.pass("has `parent()`", "fast", "20ms"),
                            _.pass("can accept a string + function", "fast", "20ms"),
                            _.pass("can accept a string", "fast", "20ms"),
                            _.pass("returns the current instance when given a callback", "medium", "40ms"),
                            _.pass("returns a prototypal clone when not given a callback", "medium", "40ms"),
                            _.pass("runs block tests within tests", "fast", "20ms"),
                            _.pass("runs successful inline tests within tests", "fast", "20ms"),
                            _.pass("accepts a callback with `run()`", "fast", "20ms"),
                        ], "fast", "20ms"),
                        _.suite("cli normalize glob", [
                            _.suite("current directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("absolute directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("relative directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("edge cases", [
                                _.pass("normalizes `.` with a cwd of `.`", "fast", "20ms"),
                                _.pass("normalizes `..` with a cwd of `.`", "fast", "20ms"),
                                _.pass("normalizes `.` with a cwd of `..`", "fast", "20ms"),
                                _.pass("normalizes directories with a cwd of `..`", "fast", "20ms"),
                                _.pass("removes excess `.`", "fast", "20ms"),
                                _.pass("removes excess `..`", "fast", "20ms"),
                                _.pass("removes excess combined junk", "fast", "20ms"),
                            ], "fast", "20ms"),
                        ], "fast", "20ms"),
                    ]})
                },

                function (_) {
                    _.match({duration: 800, pass: 38, fail: 0, skip: 0, reports: [
                        _.suite("core (basic)", [
                            _.pass("has `base()`", "fast", "20ms"),
                            _.pass("has `test()`", "fast", "20ms"),
                            _.pass("has `parent()`", "fast", "20ms"),
                            _.pass("can accept a string + function", "fast", "20ms"),
                            _.pass("can accept a string", "fast", "20ms"),
                            _.pass("returns the current instance when given a callback", "medium", "40ms"),
                            _.pass("returns a prototypal clone when not given a callback", "medium", "40ms"),
                            _.pass("runs block tests within tests", "fast", "20ms"),
                            _.pass("runs successful inline tests within tests", "fast", "20ms"),
                            _.pass("accepts a callback with `run()`", "fast", "20ms"),
                        ], "fast", "20ms"),
                        _.suite("cli normalize glob", [
                            _.suite("current directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("absolute directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("relative directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("edge cases", [
                                _.pass("normalizes `.` with a cwd of `.`", "fast", "20ms"),
                                _.pass("normalizes `..` with a cwd of `.`", "fast", "20ms"),
                                _.pass("normalizes `.` with a cwd of `..`", "fast", "20ms"),
                                _.pass("normalizes directories with a cwd of `..`", "fast", "20ms"),
                                _.pass("removes excess `.`", "fast", "20ms"),
                                _.pass("removes excess `..`", "fast", "20ms"),
                                _.pass("removes excess combined junk", "fast", "20ms"),
                            ], "fast", "20ms"),
                        ], "fast", "20ms"),
                    ]})
                },

                function (_) {
                    _.match({duration: 820, pass: 39, fail: 0, skip: 0, reports: [
                        _.suite("core (basic)", [
                            _.pass("has `base()`", "fast", "20ms"),
                            _.pass("has `test()`", "fast", "20ms"),
                            _.pass("has `parent()`", "fast", "20ms"),
                            _.pass("can accept a string + function", "fast", "20ms"),
                            _.pass("can accept a string", "fast", "20ms"),
                            _.pass("returns the current instance when given a callback", "medium", "40ms"),
                            _.pass("returns a prototypal clone when not given a callback", "medium", "40ms"),
                            _.pass("runs block tests within tests", "fast", "20ms"),
                            _.pass("runs successful inline tests within tests", "fast", "20ms"),
                            _.pass("accepts a callback with `run()`", "fast", "20ms"),
                        ], "fast", "20ms"),
                        _.suite("cli normalize glob", [
                            _.suite("current directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("absolute directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("relative directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("edge cases", [
                                _.pass("normalizes `.` with a cwd of `.`", "fast", "20ms"),
                                _.pass("normalizes `..` with a cwd of `.`", "fast", "20ms"),
                                _.pass("normalizes `.` with a cwd of `..`", "fast", "20ms"),
                                _.pass("normalizes directories with a cwd of `..`", "fast", "20ms"),
                                _.pass("removes excess `.`", "fast", "20ms"),
                                _.pass("removes excess `..`", "fast", "20ms"),
                                _.pass("removes excess combined junk", "fast", "20ms"),
                            ], "fast", "20ms"),
                        ], "fast", "20ms"),
                        _.suite("core (timeouts)", [], "fast", "20ms"),
                    ]})
                },

                function (_) {
                    _.match({duration: 860, pass: 40, fail: 0, skip: 0, reports: [
                        _.suite("core (basic)", [
                            _.pass("has `base()`", "fast", "20ms"),
                            _.pass("has `test()`", "fast", "20ms"),
                            _.pass("has `parent()`", "fast", "20ms"),
                            _.pass("can accept a string + function", "fast", "20ms"),
                            _.pass("can accept a string", "fast", "20ms"),
                            _.pass("returns the current instance when given a callback", "medium", "40ms"),
                            _.pass("returns a prototypal clone when not given a callback", "medium", "40ms"),
                            _.pass("runs block tests within tests", "fast", "20ms"),
                            _.pass("runs successful inline tests within tests", "fast", "20ms"),
                            _.pass("accepts a callback with `run()`", "fast", "20ms"),
                        ], "fast", "20ms"),
                        _.suite("cli normalize glob", [
                            _.suite("current directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("absolute directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("relative directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("edge cases", [
                                _.pass("normalizes `.` with a cwd of `.`", "fast", "20ms"),
                                _.pass("normalizes `..` with a cwd of `.`", "fast", "20ms"),
                                _.pass("normalizes `.` with a cwd of `..`", "fast", "20ms"),
                                _.pass("normalizes directories with a cwd of `..`", "fast", "20ms"),
                                _.pass("removes excess `.`", "fast", "20ms"),
                                _.pass("removes excess `..`", "fast", "20ms"),
                                _.pass("removes excess combined junk", "fast", "20ms"),
                            ], "fast", "20ms"),
                        ], "fast", "20ms"),
                        _.suite("core (timeouts)", [
                            _.pass("succeeds with own", "medium", "40ms"),
                        ], "fast", "20ms"),
                    ]})
                },

                function (_) {
                    _.match({duration: 900, pass: 41, fail: 0, skip: 0, reports: [
                        _.suite("core (basic)", [
                            _.pass("has `base()`", "fast", "20ms"),
                            _.pass("has `test()`", "fast", "20ms"),
                            _.pass("has `parent()`", "fast", "20ms"),
                            _.pass("can accept a string + function", "fast", "20ms"),
                            _.pass("can accept a string", "fast", "20ms"),
                            _.pass("returns the current instance when given a callback", "medium", "40ms"),
                            _.pass("returns a prototypal clone when not given a callback", "medium", "40ms"),
                            _.pass("runs block tests within tests", "fast", "20ms"),
                            _.pass("runs successful inline tests within tests", "fast", "20ms"),
                            _.pass("accepts a callback with `run()`", "fast", "20ms"),
                        ], "fast", "20ms"),
                        _.suite("cli normalize glob", [
                            _.suite("current directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("absolute directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("relative directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("edge cases", [
                                _.pass("normalizes `.` with a cwd of `.`", "fast", "20ms"),
                                _.pass("normalizes `..` with a cwd of `.`", "fast", "20ms"),
                                _.pass("normalizes `.` with a cwd of `..`", "fast", "20ms"),
                                _.pass("normalizes directories with a cwd of `..`", "fast", "20ms"),
                                _.pass("removes excess `.`", "fast", "20ms"),
                                _.pass("removes excess `..`", "fast", "20ms"),
                                _.pass("removes excess combined junk", "fast", "20ms"),
                            ], "fast", "20ms"),
                        ], "fast", "20ms"),
                        _.suite("core (timeouts)", [
                            _.pass("succeeds with own", "medium", "40ms"),
                            _.pass("fails with own", "medium", "40ms"),
                        ], "fast", "20ms"),
                    ]})
                },

                function (_) {
                    _.match({duration: 980, pass: 42, fail: 0, skip: 0, reports: [
                        _.suite("core (basic)", [
                            _.pass("has `base()`", "fast", "20ms"),
                            _.pass("has `test()`", "fast", "20ms"),
                            _.pass("has `parent()`", "fast", "20ms"),
                            _.pass("can accept a string + function", "fast", "20ms"),
                            _.pass("can accept a string", "fast", "20ms"),
                            _.pass("returns the current instance when given a callback", "medium", "40ms"),
                            _.pass("returns a prototypal clone when not given a callback", "medium", "40ms"),
                            _.pass("runs block tests within tests", "fast", "20ms"),
                            _.pass("runs successful inline tests within tests", "fast", "20ms"),
                            _.pass("accepts a callback with `run()`", "fast", "20ms"),
                        ], "fast", "20ms"),
                        _.suite("cli normalize glob", [
                            _.suite("current directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("absolute directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("relative directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("edge cases", [
                                _.pass("normalizes `.` with a cwd of `.`", "fast", "20ms"),
                                _.pass("normalizes `..` with a cwd of `.`", "fast", "20ms"),
                                _.pass("normalizes `.` with a cwd of `..`", "fast", "20ms"),
                                _.pass("normalizes directories with a cwd of `..`", "fast", "20ms"),
                                _.pass("removes excess `.`", "fast", "20ms"),
                                _.pass("removes excess `..`", "fast", "20ms"),
                                _.pass("removes excess combined junk", "fast", "20ms"),
                            ], "fast", "20ms"),
                        ], "fast", "20ms"),
                        _.suite("core (timeouts)", [
                            _.pass("succeeds with own", "medium", "40ms"),
                            _.pass("fails with own", "medium", "40ms"),
                            _.pass("succeeds with inherited", "slow", "80ms"),
                        ], "fast", "20ms"),
                    ]})
                },

                function (_) {
                    _.match({duration: 1060, pass: 43, fail: 0, skip: 0, reports: [
                        _.suite("core (basic)", [
                            _.pass("has `base()`", "fast", "20ms"),
                            _.pass("has `test()`", "fast", "20ms"),
                            _.pass("has `parent()`", "fast", "20ms"),
                            _.pass("can accept a string + function", "fast", "20ms"),
                            _.pass("can accept a string", "fast", "20ms"),
                            _.pass("returns the current instance when given a callback", "medium", "40ms"),
                            _.pass("returns a prototypal clone when not given a callback", "medium", "40ms"),
                            _.pass("runs block tests within tests", "fast", "20ms"),
                            _.pass("runs successful inline tests within tests", "fast", "20ms"),
                            _.pass("accepts a callback with `run()`", "fast", "20ms"),
                        ], "fast", "20ms"),
                        _.suite("cli normalize glob", [
                            _.suite("current directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("absolute directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("relative directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("edge cases", [
                                _.pass("normalizes `.` with a cwd of `.`", "fast", "20ms"),
                                _.pass("normalizes `..` with a cwd of `.`", "fast", "20ms"),
                                _.pass("normalizes `.` with a cwd of `..`", "fast", "20ms"),
                                _.pass("normalizes directories with a cwd of `..`", "fast", "20ms"),
                                _.pass("removes excess `.`", "fast", "20ms"),
                                _.pass("removes excess `..`", "fast", "20ms"),
                                _.pass("removes excess combined junk", "fast", "20ms"),
                            ], "fast", "20ms"),
                        ], "fast", "20ms"),
                        _.suite("core (timeouts)", [
                            _.pass("succeeds with own", "medium", "40ms"),
                            _.pass("fails with own", "medium", "40ms"),
                            _.pass("succeeds with inherited", "slow", "80ms"),
                            _.pass("fails with inherited", "slow", "80ms"),
                        ], "fast", "20ms"),
                    ]})
                },

                function (_) {
                    _.match({duration: 1080, pass: 44, fail: 0, skip: 0, reports: [
                        _.suite("core (basic)", [
                            _.pass("has `base()`", "fast", "20ms"),
                            _.pass("has `test()`", "fast", "20ms"),
                            _.pass("has `parent()`", "fast", "20ms"),
                            _.pass("can accept a string + function", "fast", "20ms"),
                            _.pass("can accept a string", "fast", "20ms"),
                            _.pass("returns the current instance when given a callback", "medium", "40ms"),
                            _.pass("returns a prototypal clone when not given a callback", "medium", "40ms"),
                            _.pass("runs block tests within tests", "fast", "20ms"),
                            _.pass("runs successful inline tests within tests", "fast", "20ms"),
                            _.pass("accepts a callback with `run()`", "fast", "20ms"),
                        ], "fast", "20ms"),
                        _.suite("cli normalize glob", [
                            _.suite("current directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("absolute directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("relative directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("edge cases", [
                                _.pass("normalizes `.` with a cwd of `.`", "fast", "20ms"),
                                _.pass("normalizes `..` with a cwd of `.`", "fast", "20ms"),
                                _.pass("normalizes `.` with a cwd of `..`", "fast", "20ms"),
                                _.pass("normalizes directories with a cwd of `..`", "fast", "20ms"),
                                _.pass("removes excess `.`", "fast", "20ms"),
                                _.pass("removes excess `..`", "fast", "20ms"),
                                _.pass("removes excess combined junk", "fast", "20ms"),
                            ], "fast", "20ms"),
                        ], "fast", "20ms"),
                        _.suite("core (timeouts)", [
                            _.pass("succeeds with own", "medium", "40ms"),
                            _.pass("fails with own", "medium", "40ms"),
                            _.pass("succeeds with inherited", "slow", "80ms"),
                            _.pass("fails with inherited", "slow", "80ms"),
                            _.pass("gets own set timeout", "fast", "20ms"),
                        ], "fast", "20ms"),
                    ]})
                },

                function (_) {
                    _.match({duration: 1100, pass: 45, fail: 0, skip: 0, reports: [
                        _.suite("core (basic)", [
                            _.pass("has `base()`", "fast", "20ms"),
                            _.pass("has `test()`", "fast", "20ms"),
                            _.pass("has `parent()`", "fast", "20ms"),
                            _.pass("can accept a string + function", "fast", "20ms"),
                            _.pass("can accept a string", "fast", "20ms"),
                            _.pass("returns the current instance when given a callback", "medium", "40ms"),
                            _.pass("returns a prototypal clone when not given a callback", "medium", "40ms"),
                            _.pass("runs block tests within tests", "fast", "20ms"),
                            _.pass("runs successful inline tests within tests", "fast", "20ms"),
                            _.pass("accepts a callback with `run()`", "fast", "20ms"),
                        ], "fast", "20ms"),
                        _.suite("cli normalize glob", [
                            _.suite("current directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("absolute directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("relative directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("edge cases", [
                                _.pass("normalizes `.` with a cwd of `.`", "fast", "20ms"),
                                _.pass("normalizes `..` with a cwd of `.`", "fast", "20ms"),
                                _.pass("normalizes `.` with a cwd of `..`", "fast", "20ms"),
                                _.pass("normalizes directories with a cwd of `..`", "fast", "20ms"),
                                _.pass("removes excess `.`", "fast", "20ms"),
                                _.pass("removes excess `..`", "fast", "20ms"),
                                _.pass("removes excess combined junk", "fast", "20ms"),
                            ], "fast", "20ms"),
                        ], "fast", "20ms"),
                        _.suite("core (timeouts)", [
                            _.pass("succeeds with own", "medium", "40ms"),
                            _.pass("fails with own", "medium", "40ms"),
                            _.pass("succeeds with inherited", "slow", "80ms"),
                            _.pass("fails with inherited", "slow", "80ms"),
                            _.pass("gets own set timeout", "fast", "20ms"),
                            _.pass("gets own inline set timeout", "fast", "20ms"),
                        ], "fast", "20ms"),
                    ]})
                },

                function (_) {
                    _.match({duration: 1120, pass: 46, fail: 0, skip: 0, reports: [
                        _.suite("core (basic)", [
                            _.pass("has `base()`", "fast", "20ms"),
                            _.pass("has `test()`", "fast", "20ms"),
                            _.pass("has `parent()`", "fast", "20ms"),
                            _.pass("can accept a string + function", "fast", "20ms"),
                            _.pass("can accept a string", "fast", "20ms"),
                            _.pass("returns the current instance when given a callback", "medium", "40ms"),
                            _.pass("returns a prototypal clone when not given a callback", "medium", "40ms"),
                            _.pass("runs block tests within tests", "fast", "20ms"),
                            _.pass("runs successful inline tests within tests", "fast", "20ms"),
                            _.pass("accepts a callback with `run()`", "fast", "20ms"),
                        ], "fast", "20ms"),
                        _.suite("cli normalize glob", [
                            _.suite("current directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("absolute directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("relative directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("edge cases", [
                                _.pass("normalizes `.` with a cwd of `.`", "fast", "20ms"),
                                _.pass("normalizes `..` with a cwd of `.`", "fast", "20ms"),
                                _.pass("normalizes `.` with a cwd of `..`", "fast", "20ms"),
                                _.pass("normalizes directories with a cwd of `..`", "fast", "20ms"),
                                _.pass("removes excess `.`", "fast", "20ms"),
                                _.pass("removes excess `..`", "fast", "20ms"),
                                _.pass("removes excess combined junk", "fast", "20ms"),
                            ], "fast", "20ms"),
                        ], "fast", "20ms"),
                        _.suite("core (timeouts)", [
                            _.pass("succeeds with own", "medium", "40ms"),
                            _.pass("fails with own", "medium", "40ms"),
                            _.pass("succeeds with inherited", "slow", "80ms"),
                            _.pass("fails with inherited", "slow", "80ms"),
                            _.pass("gets own set timeout", "fast", "20ms"),
                            _.pass("gets own inline set timeout", "fast", "20ms"),
                            _.pass("gets own sync inner timeout", "fast", "20ms"),
                        ], "fast", "20ms"),
                    ]})
                },

                function (_) {
                    _.match({duration: 1160, pass: 47, fail: 0, skip: 0, reports: [
                        _.suite("core (basic)", [
                            _.pass("has `base()`", "fast", "20ms"),
                            _.pass("has `test()`", "fast", "20ms"),
                            _.pass("has `parent()`", "fast", "20ms"),
                            _.pass("can accept a string + function", "fast", "20ms"),
                            _.pass("can accept a string", "fast", "20ms"),
                            _.pass("returns the current instance when given a callback", "medium", "40ms"),
                            _.pass("returns a prototypal clone when not given a callback", "medium", "40ms"),
                            _.pass("runs block tests within tests", "fast", "20ms"),
                            _.pass("runs successful inline tests within tests", "fast", "20ms"),
                            _.pass("accepts a callback with `run()`", "fast", "20ms"),
                        ], "fast", "20ms"),
                        _.suite("cli normalize glob", [
                            _.suite("current directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("absolute directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("relative directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("edge cases", [
                                _.pass("normalizes `.` with a cwd of `.`", "fast", "20ms"),
                                _.pass("normalizes `..` with a cwd of `.`", "fast", "20ms"),
                                _.pass("normalizes `.` with a cwd of `..`", "fast", "20ms"),
                                _.pass("normalizes directories with a cwd of `..`", "fast", "20ms"),
                                _.pass("removes excess `.`", "fast", "20ms"),
                                _.pass("removes excess `..`", "fast", "20ms"),
                                _.pass("removes excess combined junk", "fast", "20ms"),
                            ], "fast", "20ms"),
                        ], "fast", "20ms"),
                        _.suite("core (timeouts)", [
                            _.pass("succeeds with own", "medium", "40ms"),
                            _.pass("fails with own", "medium", "40ms"),
                            _.pass("succeeds with inherited", "slow", "80ms"),
                            _.pass("fails with inherited", "slow", "80ms"),
                            _.pass("gets own set timeout", "fast", "20ms"),
                            _.pass("gets own inline set timeout", "fast", "20ms"),
                            _.pass("gets own sync inner timeout", "fast", "20ms"),
                            _.pass("gets default timeout", "medium", "40ms"),
                        ], "fast", "20ms"),
                    ]})
                },

                function (_) {
                    _.match({duration: 1160, pass: 47, fail: 0, skip: 0, reports: [
                        _.suite("core (basic)", [
                            _.pass("has `base()`", "fast", "20ms"),
                            _.pass("has `test()`", "fast", "20ms"),
                            _.pass("has `parent()`", "fast", "20ms"),
                            _.pass("can accept a string + function", "fast", "20ms"),
                            _.pass("can accept a string", "fast", "20ms"),
                            _.pass("returns the current instance when given a callback", "medium", "40ms"),
                            _.pass("returns a prototypal clone when not given a callback", "medium", "40ms"),
                            _.pass("runs block tests within tests", "fast", "20ms"),
                            _.pass("runs successful inline tests within tests", "fast", "20ms"),
                            _.pass("accepts a callback with `run()`", "fast", "20ms"),
                        ], "fast", "20ms"),
                        _.suite("cli normalize glob", [
                            _.suite("current directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("absolute directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("relative directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("edge cases", [
                                _.pass("normalizes `.` with a cwd of `.`", "fast", "20ms"),
                                _.pass("normalizes `..` with a cwd of `.`", "fast", "20ms"),
                                _.pass("normalizes `.` with a cwd of `..`", "fast", "20ms"),
                                _.pass("normalizes directories with a cwd of `..`", "fast", "20ms"),
                                _.pass("removes excess `.`", "fast", "20ms"),
                                _.pass("removes excess `..`", "fast", "20ms"),
                                _.pass("removes excess combined junk", "fast", "20ms"),
                            ], "fast", "20ms"),
                        ], "fast", "20ms"),
                        _.suite("core (timeouts)", [
                            _.pass("succeeds with own", "medium", "40ms"),
                            _.pass("fails with own", "medium", "40ms"),
                            _.pass("succeeds with inherited", "slow", "80ms"),
                            _.pass("fails with inherited", "slow", "80ms"),
                            _.pass("gets own set timeout", "fast", "20ms"),
                            _.pass("gets own inline set timeout", "fast", "20ms"),
                            _.pass("gets own sync inner timeout", "fast", "20ms"),
                            _.pass("gets default timeout", "medium", "40ms"),
                        ], "fast", "20ms"),
                    ]})
                },

                function (_) {
                    _.match({duration: 1160, pass: 47, fail: 0, skip: 0, reports: [
                        _.suite("core (basic)", [
                            _.pass("has `base()`", "fast", "20ms"),
                            _.pass("has `test()`", "fast", "20ms"),
                            _.pass("has `parent()`", "fast", "20ms"),
                            _.pass("can accept a string + function", "fast", "20ms"),
                            _.pass("can accept a string", "fast", "20ms"),
                            _.pass("returns the current instance when given a callback", "medium", "40ms"),
                            _.pass("returns a prototypal clone when not given a callback", "medium", "40ms"),
                            _.pass("runs block tests within tests", "fast", "20ms"),
                            _.pass("runs successful inline tests within tests", "fast", "20ms"),
                            _.pass("accepts a callback with `run()`", "fast", "20ms"),
                        ], "fast", "20ms"),
                        _.suite("cli normalize glob", [
                            _.suite("current directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("absolute directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("relative directory", [
                                _.pass("normalizes a file", "fast", "20ms"),
                                _.pass("normalizes a glob", "fast", "20ms"),
                                _.pass("retains trailing slashes", "fast", "20ms"),
                                _.pass("retains negative", "fast", "20ms"),
                                _.pass("retains negative + trailing slashes", "fast", "20ms"),
                            ], "fast", "20ms"),
                            _.suite("edge cases", [
                                _.pass("normalizes `.` with a cwd of `.`", "fast", "20ms"),
                                _.pass("normalizes `..` with a cwd of `.`", "fast", "20ms"),
                                _.pass("normalizes `.` with a cwd of `..`", "fast", "20ms"),
                                _.pass("normalizes directories with a cwd of `..`", "fast", "20ms"),
                                _.pass("removes excess `.`", "fast", "20ms"),
                                _.pass("removes excess `..`", "fast", "20ms"),
                                _.pass("removes excess combined junk", "fast", "20ms"),
                            ], "fast", "20ms"),
                        ], "fast", "20ms"),
                        _.suite("core (timeouts)", [
                            _.pass("succeeds with own", "medium", "40ms"),
                            _.pass("fails with own", "medium", "40ms"),
                            _.pass("succeeds with inherited", "slow", "80ms"),
                            _.pass("fails with inherited", "slow", "80ms"),
                            _.pass("gets own set timeout", "fast", "20ms"),
                            _.pass("gets own inline set timeout", "fast", "20ms"),
                            _.pass("gets own sync inner timeout", "fast", "20ms"),
                            _.pass("gets default timeout", "medium", "40ms"),
                        ], "fast", "20ms"),
                    ]})
                },
            ],
        })
    })
})
