/* eslint max-nested-callbacks: [2, 5] */
// Note: the reports *must* be well formed. The reporter assumes the reports are
// correct, and it will *not* verify this.

// Skipped because it hasn't been finished yet.
describe("reporter dom", function () { // eslint-disable-line max-statements
    "use strict"

    var p = Util.p
    var n = Util.n

    // Easy checking
    test.skip = function (name, opts) {
        if (Array.isArray(opts)) opts = {states: opts}
        opts.skip = true
        test(name, opts)
    }
    function test(name, opts) {
        if (Array.isArray(opts)) opts = {states: opts}

        var it = opts.dom ? Util.DOM.it.dom : Util.DOM.it

        it = opts.skip ? Util.DOM.it.skip : Util.DOM.it
        it(name, function (h, mock) {
            var context = Object.create(null)
            var t = context.t = {
                _reporter: undefined,
                _cleared: 0,
                _runs: 0,

                reporter: function (reporter, arg) {
                    this._reporter = reporter(arg)
                },

                clearTests: function () {
                    this._cleared++
                },

                run: function () {
                    this._runs++
                    var self = this

                    return Util.peach(opts.states, function (state) {
                        if (typeof state === "function") {
                            return state(context, h)
                        } else {
                            return mock.resolveFrames(
                                (0, self._reporter)(state))
                        }
                    })
                },
            }
            var reporterOpts = {thallium: t}

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

            context.fail = function (name, e, diff, speed, duration) { // eslint-disable-line max-params, max-len
                speed = speed || "fast"
                duration = duration || "10ms"
                var stack = Util.R.readStack(e)

                return h("li.tl-test.tl-fail.tl-" + speed, [
                    showName(speed, name, duration),
                    h("div.tl-display", [
                        h("div.tl-message", [toLines(e.name + ": " + e.message)]), // eslint-disable-line max-len
                        diff == null ? undefined : wrapDiff(diff),
                        !stack ? undefined : h("div.tl-stack", [toLines(stack)]), // eslint-disable-line max-len
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

            return new Promise(function (resolve) {
                if (opts.init != null) resolve(opts.init(context, reporterOpts))
                resolve()
            })
            .then(function () {
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

                var runner = Util.dom.create(reporterOpts)

                assert.equal(document().getElementById("tl"), context.root)
                assert.ok(document().head.getElementsByTagName("style").length)
                return runner.run()
            })
            .then(function () {
                assert.equal(context.t._runs, 1)
                assert.equal(context.t._cleared, 1)
                return opts.after == null ? undefined : opts.after(context, h)
            })
        })
    }

    test("empty test", [
        n.start(),
        function (_) {
            _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
        },

        n.end(),
        function (_) {
            _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
        },
    ])

    test("pass 2", [
        n.start(),
        function (_) {
            _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
        },

        n.pass([p("test", 0)]),
        function (_) {
            _.match({duration: 10, pass: 1, fail: 0, skip: 0, reports: [
                _.pass("test"),
            ]})
        },

        n.pass([p("test", 1)]),
        function (_) {
            _.match({duration: 20, pass: 2, fail: 0, skip: 0, reports: [
                _.pass("test"),
                _.pass("test"),
            ]})
        },

        n.end(),
        function (_) {
            _.match({duration: 20, pass: 2, fail: 0, skip: 0, reports: [
                _.pass("test"),
                _.pass("test"),
            ]})
        },
    ])

    var sentinel = new Error("sentinel")

    test("fail 2 with Error", [
        n.start(),
        function (_) {
            _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
        },

        n.fail([p("one", 0)], sentinel),
        function (_) {
            _.match({duration: 10, pass: 0, fail: 1, skip: 0, reports: [
                _.fail("one", sentinel),
            ]})
        },

        n.fail([p("two", 1)], sentinel),
        function (_) {
            _.match({duration: 20, pass: 0, fail: 2, skip: 0, reports: [
                _.fail("one", sentinel),
                _.fail("two", sentinel),
            ]})
        },

        n.end(),
        function (_) {
            _.match({duration: 20, pass: 0, fail: 2, skip: 0, reports: [
                _.fail("one", sentinel),
                _.fail("two", sentinel),
            ]})
        },
    ])

    test("pass + fail with Error", [
        n.start(),
        function (_) {
            _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
        },

        n.pass([p("one", 0)]),
        function (_) {
            _.match({duration: 10, pass: 1, fail: 0, skip: 0, reports: [
                _.pass("one"),
            ]})
        },

        n.fail([p("two", 1)], sentinel),
        function (_) {
            _.match({duration: 20, pass: 1, fail: 1, skip: 0, reports: [
                _.pass("one"),
                _.fail("two", sentinel),
            ]})
        },

        n.end(),
        function (_) {
            _.match({duration: 20, pass: 1, fail: 1, skip: 0, reports: [
                _.pass("one"),
                _.fail("two", sentinel),
            ]})
        },
    ])

    test("fail with Error + pass", [
        n.start(),
        function (_) {
            _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
        },

        n.fail([p("one", 0)], sentinel),
        function (_) {
            _.match({duration: 10, pass: 0, fail: 1, skip: 0, reports: [
                _.fail("one", sentinel),
            ]})
        },

        n.pass([p("two", 1)]),
        function (_) {
            _.match({duration: 20, pass: 1, fail: 1, skip: 0, reports: [
                _.fail("one", sentinel),
                _.pass("two"),
            ]})
        },

        n.end(),
        function (_) {
            _.match({duration: 20, pass: 1, fail: 1, skip: 0, reports: [
                _.fail("one", sentinel),
                _.pass("two"),
            ]})
        },
    ])

    var AssertionError = assert.AssertionError
    var assertion = new AssertionError("Expected 1 to equal 2", 1, 2)

    function assertionDiff(_) {
        return [
            _.removed("2"),
            _.added("1"),
        ]
    }

    test("fail 2 with AssertionError", [
        n.start(),
        function (_) {
            _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
        },

        n.fail([p("one", 0)], assertion),
        function (_) {
            _.match({duration: 10, pass: 0, fail: 1, skip: 0, reports: [
                _.fail("one", assertion, assertionDiff(_)),
            ]})
        },

        n.fail([p("two", 1)], assertion),
        function (_) {
            _.match({duration: 20, pass: 0, fail: 2, skip: 0, reports: [
                _.fail("one", assertion, assertionDiff(_)),
                _.fail("two", assertion, assertionDiff(_)),
            ]})
        },

        n.end(),
        function (_) {
            _.match({duration: 20, pass: 0, fail: 2, skip: 0, reports: [
                _.fail("one", assertion, assertionDiff(_)),
                _.fail("two", assertion, assertionDiff(_)),
            ]})
        },
    ])

    test("pass + fail with AssertionError", [
        n.start(),
        function (_) {
            _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
        },

        n.pass([p("one", 0)]),
        function (_) {
            _.match({duration: 10, pass: 1, fail: 0, skip: 0, reports: [
                _.pass("one"),
            ]})
        },

        n.fail([p("two", 1)], assertion),
        function (_) {
            _.match({duration: 20, pass: 1, fail: 1, skip: 0, reports: [
                _.pass("one"),
                _.fail("two", assertion, assertionDiff(_)),
            ]})
        },

        n.end(),
        function (_) {
            _.match({duration: 20, pass: 1, fail: 1, skip: 0, reports: [
                _.pass("one"),
                _.fail("two", assertion, assertionDiff(_)),
            ]})
        },
    ])

    test("fail with AssertionError + pass", [
        n.start(),
        function (_) {
            _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
        },

        n.fail([p("one", 0)], assertion),
        function (_) {
            _.match({duration: 10, pass: 0, fail: 1, skip: 0, reports: [
                _.fail("one", assertion, assertionDiff(_)),
            ]})
        },

        n.pass([p("two", 1)]),
        function (_) {
            _.match({duration: 20, pass: 1, fail: 1, skip: 0, reports: [
                _.fail("one", assertion, assertionDiff(_)),
                _.pass("two"),
            ]})
        },

        n.end(),
        function (_) {
            _.match({duration: 20, pass: 1, fail: 1, skip: 0, reports: [
                _.fail("one", assertion, assertionDiff(_)),
                _.pass("two"),
            ]})
        },
    ])

    test("skip 2", [
        n.start(),
        function (_) {
            _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
        },

        n.skip([p("one", 0)]),
        function (_) {
            _.match({duration: 0, pass: 0, fail: 0, skip: 1, reports: [
                _.skip("one"),
            ]})
        },

        n.skip([p("two", 1)]),
        function (_) {
            _.match({duration: 0, pass: 0, fail: 0, skip: 2, reports: [
                _.skip("one"),
                _.skip("two"),
            ]})
        },

        n.end(),
        function (_) {
            _.match({duration: 0, pass: 0, fail: 0, skip: 2, reports: [
                _.skip("one"),
                _.skip("two"),
            ]})
        },
    ])

    test("pass + skip", [
        n.start(),
        function (_) {
            _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
        },

        n.pass([p("one", 0)]),
        function (_) {
            _.match({duration: 10, pass: 1, fail: 0, skip: 0, reports: [
                _.pass("one"),
            ]})
        },

        n.skip([p("two", 1)]),
        function (_) {
            _.match({duration: 10, pass: 1, fail: 0, skip: 1, reports: [
                _.pass("one"),
                _.skip("two"),
            ]})
        },

        n.end(),
        function (_) {
            _.match({duration: 10, pass: 1, fail: 0, skip: 1, reports: [
                _.pass("one"),
                _.skip("two"),
            ]})
        },
    ])

    test("skip + pass", [
        n.start(),
        function (_) {
            _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
        },

        n.skip([p("one", 0)]),
        function (_) {
            _.match({duration: 0, pass: 0, fail: 0, skip: 1, reports: [
                _.skip("one"),
            ]})
        },

        n.pass([p("two", 1)]),
        function (_) {
            _.match({duration: 10, pass: 1, fail: 0, skip: 1, reports: [
                _.skip("one"),
                _.pass("two"),
            ]})
        },

        n.end(),
        function (_) {
            _.match({duration: 10, pass: 1, fail: 0, skip: 1, reports: [
                _.skip("one"),
                _.pass("two"),
            ]})
        },
    ])

    test("fail + skip", [
        n.start(),
        function (_) {
            _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
        },

        n.fail([p("one", 0)], sentinel),
        function (_) {
            _.match({duration: 10, pass: 0, fail: 1, skip: 0, reports: [
                _.fail("one", sentinel),
            ]})
        },

        n.skip([p("two", 1)]),
        function (_) {
            _.match({duration: 10, pass: 0, fail: 1, skip: 1, reports: [
                _.fail("one", sentinel),
                _.skip("two"),
            ]})
        },

        n.end(),
        function (_) {
            _.match({duration: 10, pass: 0, fail: 1, skip: 1, reports: [
                _.fail("one", sentinel),
                _.skip("two"),
            ]})
        },
    ])

    test("skip + fail", [
        n.start(),
        function (_) {
            _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
        },

        n.skip([p("one", 1)]),
        function (_) {
            _.match({duration: 0, pass: 0, fail: 0, skip: 1, reports: [
                _.skip("one"),
            ]})
        },

        n.fail([p("two", 0)], sentinel),
        function (_) {
            _.match({duration: 10, pass: 0, fail: 1, skip: 1, reports: [
                _.skip("one"),
                _.fail("two", sentinel),
            ]})
        },

        n.end(),
        function (_) {
            _.match({duration: 10, pass: 0, fail: 1, skip: 1, reports: [
                _.skip("one"),
                _.fail("two", sentinel),
            ]})
        },
    ])

    var badType = new TypeError("undefined is not a function")

    test("internal errors", [
        n.start(),
        function (_) {
            _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
        },

        n.enter([p("test", 0)]),
        function (_) {
            _.match({duration: 10, pass: 1, fail: 0, skip: 0, reports: [
                _.suite("test", []),
            ]})
        },

        n.enter([p("test", 0), p("inner", 0)]),
        function (_) {
            _.match({duration: 20, pass: 2, fail: 0, skip: 0, reports: [
                _.suite("test", [
                    _.suite("inner", []),
                ]),
            ]})
        },

        n.fail([p("test", 0), p("inner", 0), p("fail", 0)], badType),
        function (_) {
            _.match({duration: 30, pass: 2, fail: 1, skip: 0, reports: [
                _.suite("test", [
                    _.suite("inner", [
                        _.fail("fail", badType),
                    ]),
                ]),
            ]})
        },

        n.error(badType),
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
                        h("div.tl-message", [_.toLines("TypeError: undefined is not a function")]), // eslint-disable-line max-len
                        !stack ? undefined : h("div.tl-stack", [_.toLines(stack)]), // eslint-disable-line max-len
                    ]),
                ]),
            ]})
        },
    ])

    /* eslint-disable max-len */

    test("long passing sequence", [
        n.start(),
        function (_) {
            _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
        },

        n.enter([p("core (basic)", 0)]),
        function (_) {
            _.match({duration: 10, pass: 1, fail: 0, skip: 0, reports: [
                _.suite("core (basic)", []),
            ]})
        },

        n.pass([p("core (basic)", 0), p("has `base()`", 0)]),
        function (_) {
            _.match({duration: 20, pass: 2, fail: 0, skip: 0, reports: [
                _.suite("core (basic)", [
                    _.pass("has `base()`"),
                ]),
            ]})
        },

        n.pass([p("core (basic)", 0), p("has `test()`", 1)]),
        function (_) {
            _.match({duration: 30, pass: 3, fail: 0, skip: 0, reports: [
                _.suite("core (basic)", [
                    _.pass("has `base()`"),
                    _.pass("has `test()`"),
                ]),
            ]})
        },

        n.pass([p("core (basic)", 0), p("has `parent()`", 2)]),
        function (_) {
            _.match({duration: 40, pass: 4, fail: 0, skip: 0, reports: [
                _.suite("core (basic)", [
                    _.pass("has `base()`"),
                    _.pass("has `test()`"),
                    _.pass("has `parent()`"),
                ]),
            ]})
        },

        n.pass([p("core (basic)", 0), p("can accept a string + function", 3)]),
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

        n.pass([p("core (basic)", 0), p("can accept a string", 4)]),
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

        n.pass([p("core (basic)", 0), p("returns the current instance when given a callback", 5)]),
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

        n.pass([p("core (basic)", 0), p("returns a prototypal clone when not given a callback", 6)]),
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

        n.pass([p("core (basic)", 0), p("runs block tests within tests", 7)]),
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

        n.pass([p("core (basic)", 0), p("runs successful inline tests within tests", 8)]),
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

        n.pass([p("core (basic)", 0), p("accepts a callback with `run()`", 9)]),
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

        n.leave([p("core (basic)", 0)]),
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

        n.enter([p("cli normalize glob", 1)]),
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

        n.enter([p("cli normalize glob", 1), p("current directory", 0)]),
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

        n.pass([p("cli normalize glob", 1), p("current directory", 0), p("normalizes a file", 0)]),
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

        n.pass([p("cli normalize glob", 1), p("current directory", 0), p("normalizes a glob", 1)]),
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

        n.pass([p("cli normalize glob", 1), p("current directory", 0), p("retains trailing slashes", 2)]),
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

        n.pass([p("cli normalize glob", 1), p("current directory", 0), p("retains negative", 3)]),
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

        n.pass([p("cli normalize glob", 1), p("current directory", 0), p("retains negative + trailing slashes", 4)]),
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

        n.leave([p("cli normalize glob", 1), p("current directory", 0)]),
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

        n.enter([p("cli normalize glob", 1), p("absolute directory", 1)]),
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

        n.pass([p("cli normalize glob", 1), p("absolute directory", 1), p("normalizes a file", 0)]),
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

        n.pass([p("cli normalize glob", 1), p("absolute directory", 1), p("normalizes a glob", 1)]),
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

        n.pass([p("cli normalize glob", 1), p("absolute directory", 1), p("retains trailing slashes", 2)]),
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

        n.pass([p("cli normalize glob", 1), p("absolute directory", 1), p("retains negative", 3)]),
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

        n.pass([p("cli normalize glob", 1), p("absolute directory", 1), p("retains negative + trailing slashes", 4)]),
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

        n.leave([p("cli normalize glob", 1), p("absolute directory", 1)]),
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

        n.enter([p("cli normalize glob", 1), p("relative directory", 2)]),
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

        n.pass([p("cli normalize glob", 1), p("relative directory", 2), p("normalizes a file", 0)]),
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

        n.pass([p("cli normalize glob", 1), p("relative directory", 2), p("normalizes a glob", 1)]),
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

        n.pass([p("cli normalize glob", 1), p("relative directory", 2), p("retains trailing slashes", 2)]),
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

        n.pass([p("cli normalize glob", 1), p("relative directory", 2), p("retains negative", 3)]),
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

        n.pass([p("cli normalize glob", 1), p("relative directory", 2), p("retains negative + trailing slashes", 4)]),
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

        n.leave([p("cli normalize glob", 1), p("relative directory", 2)]),
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

        n.enter([p("cli normalize glob", 1), p("edge cases", 3)]),
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

        n.pass([p("cli normalize glob", 1), p("edge cases", 3), p("normalizes `.` with a cwd of `.`", 0)]),
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

        n.pass([p("cli normalize glob", 1), p("edge cases", 3), p("normalizes `..` with a cwd of `.`", 1)]),
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

        n.pass([p("cli normalize glob", 1), p("edge cases", 3), p("normalizes `.` with a cwd of `..`", 2)]),
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

        n.pass([p("cli normalize glob", 1), p("edge cases", 3), p("normalizes directories with a cwd of `..`", 3)]),
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

        n.pass([p("cli normalize glob", 1), p("edge cases", 3), p("removes excess `.`", 4)]),
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

        n.pass([p("cli normalize glob", 1), p("edge cases", 3), p("removes excess `..`", 5)]),
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

        n.pass([p("cli normalize glob", 1), p("edge cases", 3), p("removes excess combined junk", 6)]),
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

        n.leave([p("cli normalize glob", 1), p("edge cases", 3)]),
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

        n.leave([p("cli normalize glob", 1)]),
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

        n.enter([p("core (timeouts)", 2)]),
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

        n.pass([p("core (timeouts)", 2), p("succeeds with own", 0)]),
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

        n.pass([p("core (timeouts)", 2), p("fails with own", 1)]),
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

        n.pass([p("core (timeouts)", 2), p("succeeds with inherited", 2)]),
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

        n.pass([p("core (timeouts)", 2), p("fails with inherited", 3)]),
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

        n.pass([p("core (timeouts)", 2), p("gets own set timeout", 4)]),
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

        n.pass([p("core (timeouts)", 2), p("gets own inline set timeout", 5)]),
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

        n.pass([p("core (timeouts)", 2), p("gets own sync inner timeout", 6)]),
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

        n.pass([p("core (timeouts)", 2), p("gets default timeout", 7)]),
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

        n.leave([p("core (timeouts)", 2)]),
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

        n.end(),
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
    ])

    /* eslint-enable max-len */

    /* eslint-disable max-len */

    test("long mixed bag", [
        n.start(),
        function (_) {
            _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
        },

        n.enter([p("core (basic)", 0)]),
        function (_) {
            _.match({duration: 10, pass: 1, fail: 0, skip: 0, reports: [
                _.suite("core (basic)", []),
            ]})
        },

        n.pass([p("core (basic)", 0), p("has `base()`", 0)]),
        function (_) {
            _.match({duration: 20, pass: 2, fail: 0, skip: 0, reports: [
                _.suite("core (basic)", [
                    _.pass("has `base()`"),
                ]),
            ]})
        },

        n.pass([p("core (basic)", 0), p("has `test()`", 1)]),
        function (_) {
            _.match({duration: 30, pass: 3, fail: 0, skip: 0, reports: [
                _.suite("core (basic)", [
                    _.pass("has `base()`"),
                    _.pass("has `test()`"),
                ]),
            ]})
        },

        n.pass([p("core (basic)", 0), p("has `parent()`", 2)]),
        function (_) {
            _.match({duration: 40, pass: 4, fail: 0, skip: 0, reports: [
                _.suite("core (basic)", [
                    _.pass("has `base()`"),
                    _.pass("has `test()`"),
                    _.pass("has `parent()`"),
                ]),
            ]})
        },

        n.skip([p("core (basic)", 0), p("can accept a string + function", 3)]),
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

        n.pass([p("core (basic)", 0), p("can accept a string", 4)]),
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

        n.pass([p("core (basic)", 0), p("returns the current instance when given a callback", 5)]),
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

        n.fail([p("core (basic)", 0), p("returns a prototypal clone when not given a callback", 6)], badType),
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

        n.pass([p("core (basic)", 0), p("runs block tests within tests", 7)]),
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

        n.pass([p("core (basic)", 0), p("runs successful inline tests within tests", 8)]),
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

        n.pass([p("core (basic)", 0), p("accepts a callback with `run()`", 9)]),
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

        n.leave([p("core (basic)", 0)]),
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

        n.enter([p("cli normalize glob", 1)]),
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

        n.enter([p("cli normalize glob", 1), p("current directory", 0)]),
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

        n.fail([p("cli normalize glob", 1), p("current directory", 0), p("normalizes a file", 0)], sentinel),
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

        n.pass([p("cli normalize glob", 1), p("current directory", 0), p("normalizes a glob", 1)]),
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

        n.pass([p("cli normalize glob", 1), p("current directory", 0), p("retains trailing slashes", 2)]),
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

        n.pass([p("cli normalize glob", 1), p("current directory", 0), p("retains negative", 3)]),
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

        n.pass([p("cli normalize glob", 1), p("current directory", 0), p("retains negative + trailing slashes", 4)]),
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

        n.leave([p("cli normalize glob", 1), p("current directory", 0)]),
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

        n.enter([p("cli normalize glob", 1), p("absolute directory", 1)]),
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

        n.pass([p("cli normalize glob", 1), p("absolute directory", 1), p("normalizes a file", 0)]),
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

        n.pass([p("cli normalize glob", 1), p("absolute directory", 1), p("normalizes a glob", 1)]),
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

        n.pass([p("cli normalize glob", 1), p("absolute directory", 1), p("retains trailing slashes", 2)]),
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

        n.skip([p("cli normalize glob", 1), p("absolute directory", 1), p("retains negative", 3)]),
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

        n.pass([p("cli normalize glob", 1), p("absolute directory", 1), p("retains negative + trailing slashes", 4)]),
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

        n.leave([p("cli normalize glob", 1), p("absolute directory", 1)]),
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

        n.enter([p("cli normalize glob", 1), p("relative directory", 2)]),
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

        n.pass([p("cli normalize glob", 1), p("relative directory", 2), p("normalizes a file", 0)]),
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

        n.pass([p("cli normalize glob", 1), p("relative directory", 2), p("normalizes a glob", 1)]),
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

        n.pass([p("cli normalize glob", 1), p("relative directory", 2), p("retains trailing slashes", 2)]),
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

        n.pass([p("cli normalize glob", 1), p("relative directory", 2), p("retains negative", 3)]),
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

        n.fail([p("cli normalize glob", 1), p("relative directory", 2), p("retains negative + trailing slashes", 4)], badType),
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

        n.leave([p("cli normalize glob", 1), p("relative directory", 2)]),
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

        n.enter([p("cli normalize glob", 1), p("edge cases", 3)]),
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

        n.pass([p("cli normalize glob", 1), p("edge cases", 3), p("normalizes `.` with a cwd of `.`", 0)]),
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

        n.pass([p("cli normalize glob", 1), p("edge cases", 3), p("normalizes `..` with a cwd of `.`", 1)]),
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

        n.pass([p("cli normalize glob", 1), p("edge cases", 3), p("normalizes `.` with a cwd of `..`", 2)]),
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

        n.pass([p("cli normalize glob", 1), p("edge cases", 3), p("normalizes directories with a cwd of `..`", 3)]),
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

        n.pass([p("cli normalize glob", 1), p("edge cases", 3), p("removes excess `.`", 4)]),
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

        n.pass([p("cli normalize glob", 1), p("edge cases", 3), p("removes excess `..`", 5)]),
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

        n.pass([p("cli normalize glob", 1), p("edge cases", 3), p("removes excess combined junk", 6)]),
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

        n.leave([p("cli normalize glob", 1), p("edge cases", 3)]),
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

        n.leave([p("cli normalize glob", 1)]),
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

        n.enter([p("core (timeouts)", 2)]),
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

        n.skip([p("core (timeouts)", 2), p("succeeds with own", 0)]),
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

        n.pass([p("core (timeouts)", 2), p("fails with own", 1)]),
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

        n.pass([p("core (timeouts)", 2), p("succeeds with inherited", 2)]),
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

        n.pass([p("core (timeouts)", 2), p("fails with inherited", 3)]),
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

        n.pass([p("core (timeouts)", 2), p("gets own set timeout", 4)]),
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

        n.fail([p("core (timeouts)", 2), p("gets own inline set timeout", 5)], sentinel),
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

        n.skip([p("core (timeouts)", 2), p("gets own sync inner timeout", 6)]),
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

        n.pass([p("core (timeouts)", 2), p("gets default timeout", 7)]),
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

        n.leave([p("core (timeouts)", 2)]),
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

        n.end(),
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
    ])

    /* eslint-enable max-len */

    var multiline = new AssertionError(
        "Test:\n  expected: {id: 1}\n  found: {id: 2}",
        {id: 1}, {id: 2})

    test("multiline fail with AssertionError + pass", [
        n.start(),
        function (_) {
            _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
        },

        n.fail([p("one", 0)], multiline),
        function (_) {
            _.match({duration: 10, pass: 0, fail: 1, skip: 0, reports: [
                _.fail("one", multiline, [
                    _.removed("{ id: 2 }"),
                    _.added("{ id: 1 }"),
                ]),
            ]})
        },

        n.pass([p("two", 1)]),
        function (_) {
            _.match({duration: 20, pass: 1, fail: 1, skip: 0, reports: [
                _.fail("one", multiline, [
                    _.removed("{ id: 2 }"),
                    _.added("{ id: 1 }"),
                ]),
                _.pass("two"),
            ]})
        },

        n.end(),
        function (_) {
            _.match({duration: 20, pass: 1, fail: 1, skip: 0, reports: [
                _.fail("one", multiline, [
                    _.removed("{ id: 2 }"),
                    _.added("{ id: 1 }"),
                ]),
                _.pass("two"),
            ]})
        },
    ])

    context("restarting", function () {
        test("empty test", [
            n.start(),
            function (_) {
                _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
            },

            n.end(),
            function (_) {
                _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
            },

            n.start(),
            function (_) {
                _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
            },

            n.end(),
            function (_) {
                _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
            },
        ])

        test("pass 2", [
            n.start(),
            function (_) {
                _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
            },

            n.pass([p("test", 0)]),
            function (_) {
                _.match({duration: 10, pass: 1, fail: 0, skip: 0, reports: [
                    _.pass("test"),
                ]})
            },

            n.pass([p("test", 1)]),
            function (_) {
                _.match({duration: 20, pass: 2, fail: 0, skip: 0, reports: [
                    _.pass("test"),
                    _.pass("test"),
                ]})
            },

            n.end(),
            function (_) {
                _.match({duration: 20, pass: 2, fail: 0, skip: 0, reports: [
                    _.pass("test"),
                    _.pass("test"),
                ]})
            },

            n.start(),
            function (_) {
                _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
            },

            n.pass([p("test", 0)]),
            function (_) {
                _.match({duration: 10, pass: 1, fail: 0, skip: 0, reports: [
                    _.pass("test"),
                ]})
            },

            n.pass([p("test", 1)]),
            function (_) {
                _.match({duration: 20, pass: 2, fail: 0, skip: 0, reports: [
                    _.pass("test"),
                    _.pass("test"),
                ]})
            },

            n.end(),
            function (_) {
                _.match({duration: 20, pass: 2, fail: 0, skip: 0, reports: [
                    _.pass("test"),
                    _.pass("test"),
                ]})
            },
        ])

        var sentinel = new Error("sentinel")

        test("fail 2 with Error", [
            n.start(),
            function (_) {
                _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
            },

            n.fail([p("one", 0)], sentinel),
            function (_) {
                _.match({duration: 10, pass: 0, fail: 1, skip: 0, reports: [
                    _.fail("one", sentinel),
                ]})
            },

            n.fail([p("two", 1)], sentinel),
            function (_) {
                _.match({duration: 20, pass: 0, fail: 2, skip: 0, reports: [
                    _.fail("one", sentinel),
                    _.fail("two", sentinel),
                ]})
            },

            n.end(),
            function (_) {
                _.match({duration: 20, pass: 0, fail: 2, skip: 0, reports: [
                    _.fail("one", sentinel),
                    _.fail("two", sentinel),
                ]})
            },

            n.start(),
            function (_) {
                _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
            },

            n.fail([p("one", 0)], sentinel),
            function (_) {
                _.match({duration: 10, pass: 0, fail: 1, skip: 0, reports: [
                    _.fail("one", sentinel),
                ]})
            },

            n.fail([p("two", 1)], sentinel),
            function (_) {
                _.match({duration: 20, pass: 0, fail: 2, skip: 0, reports: [
                    _.fail("one", sentinel),
                    _.fail("two", sentinel),
                ]})
            },

            n.end(),
            function (_) {
                _.match({duration: 20, pass: 0, fail: 2, skip: 0, reports: [
                    _.fail("one", sentinel),
                    _.fail("two", sentinel),
                ]})
            },
        ])

        test("pass + fail with Error", [
            n.start(),
            function (_) {
                _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
            },

            n.pass([p("one", 0)]),
            function (_) {
                _.match({duration: 10, pass: 1, fail: 0, skip: 0, reports: [
                    _.pass("one"),
                ]})
            },

            n.fail([p("two", 1)], sentinel),
            function (_) {
                _.match({duration: 20, pass: 1, fail: 1, skip: 0, reports: [
                    _.pass("one"),
                    _.fail("two", sentinel),
                ]})
            },

            n.end(),
            function (_) {
                _.match({duration: 20, pass: 1, fail: 1, skip: 0, reports: [
                    _.pass("one"),
                    _.fail("two", sentinel),
                ]})
            },

            n.start(),
            function (_) {
                _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
            },

            n.pass([p("one", 0)]),
            function (_) {
                _.match({duration: 10, pass: 1, fail: 0, skip: 0, reports: [
                    _.pass("one"),
                ]})
            },

            n.fail([p("two", 1)], sentinel),
            function (_) {
                _.match({duration: 20, pass: 1, fail: 1, skip: 0, reports: [
                    _.pass("one"),
                    _.fail("two", sentinel),
                ]})
            },

            n.end(),
            function (_) {
                _.match({duration: 20, pass: 1, fail: 1, skip: 0, reports: [
                    _.pass("one"),
                    _.fail("two", sentinel),
                ]})
            },
        ])

        test("fail with Error + pass", [
            n.start(),
            function (_) {
                _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
            },

            n.fail([p("one", 0)], sentinel),
            function (_) {
                _.match({duration: 10, pass: 0, fail: 1, skip: 0, reports: [
                    _.fail("one", sentinel),
                ]})
            },

            n.pass([p("two", 1)]),
            function (_) {
                _.match({duration: 20, pass: 1, fail: 1, skip: 0, reports: [
                    _.fail("one", sentinel),
                    _.pass("two"),
                ]})
            },

            n.end(),
            function (_) {
                _.match({duration: 20, pass: 1, fail: 1, skip: 0, reports: [
                    _.fail("one", sentinel),
                    _.pass("two"),
                ]})
            },

            n.start(),
            function (_) {
                _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
            },

            n.fail([p("one", 0)], sentinel),
            function (_) {
                _.match({duration: 10, pass: 0, fail: 1, skip: 0, reports: [
                    _.fail("one", sentinel),
                ]})
            },

            n.pass([p("two", 1)]),
            function (_) {
                _.match({duration: 20, pass: 1, fail: 1, skip: 0, reports: [
                    _.fail("one", sentinel),
                    _.pass("two"),
                ]})
            },

            n.end(),
            function (_) {
                _.match({duration: 20, pass: 1, fail: 1, skip: 0, reports: [
                    _.fail("one", sentinel),
                    _.pass("two"),
                ]})
            },
        ])

        var assertion = new AssertionError("Expected 1 to equal 2", 1, 2)

        test("fail 2 with AssertionError", [
            n.start(),
            function (_) {
                _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
            },

            n.fail([p("one", 0)], assertion),
            function (_) {
                _.match({duration: 10, pass: 0, fail: 1, skip: 0, reports: [
                    _.fail("one", assertion, assertionDiff(_)),
                ]})
            },

            n.fail([p("two", 1)], assertion),
            function (_) {
                _.match({duration: 20, pass: 0, fail: 2, skip: 0, reports: [
                    _.fail("one", assertion, assertionDiff(_)),
                    _.fail("two", assertion, assertionDiff(_)),
                ]})
            },

            n.end(),
            function (_) {
                _.match({duration: 20, pass: 0, fail: 2, skip: 0, reports: [
                    _.fail("one", assertion, assertionDiff(_)),
                    _.fail("two", assertion, assertionDiff(_)),
                ]})
            },

            n.start(),
            function (_) {
                _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
            },

            n.fail([p("one", 0)], assertion),
            function (_) {
                _.match({duration: 10, pass: 0, fail: 1, skip: 0, reports: [
                    _.fail("one", assertion, assertionDiff(_)),
                ]})
            },

            n.fail([p("two", 1)], assertion),
            function (_) {
                _.match({duration: 20, pass: 0, fail: 2, skip: 0, reports: [
                    _.fail("one", assertion, assertionDiff(_)),
                    _.fail("two", assertion, assertionDiff(_)),
                ]})
            },

            n.end(),
            function (_) {
                _.match({duration: 20, pass: 0, fail: 2, skip: 0, reports: [
                    _.fail("one", assertion, assertionDiff(_)),
                    _.fail("two", assertion, assertionDiff(_)),
                ]})
            },
        ])

        test("pass + fail with AssertionError", [
            n.start(),
            function (_) {
                _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
            },

            n.pass([p("one", 0)]),
            function (_) {
                _.match({duration: 10, pass: 1, fail: 0, skip: 0, reports: [
                    _.pass("one"),
                ]})
            },

            n.fail([p("two", 1)], assertion),
            function (_) {
                _.match({duration: 20, pass: 1, fail: 1, skip: 0, reports: [
                    _.pass("one"),
                    _.fail("two", assertion, assertionDiff(_)),
                ]})
            },

            n.end(),
            function (_) {
                _.match({duration: 20, pass: 1, fail: 1, skip: 0, reports: [
                    _.pass("one"),
                    _.fail("two", assertion, assertionDiff(_)),
                ]})
            },

            n.start(),
            function (_) {
                _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
            },

            n.pass([p("one", 0)]),
            function (_) {
                _.match({duration: 10, pass: 1, fail: 0, skip: 0, reports: [
                    _.pass("one"),
                ]})
            },

            n.fail([p("two", 1)], assertion),
            function (_) {
                _.match({duration: 20, pass: 1, fail: 1, skip: 0, reports: [
                    _.pass("one"),
                    _.fail("two", assertion, assertionDiff(_)),
                ]})
            },

            n.end(),
            function (_) {
                _.match({duration: 20, pass: 1, fail: 1, skip: 0, reports: [
                    _.pass("one"),
                    _.fail("two", assertion, assertionDiff(_)),
                ]})
            },
        ])

        test("fail with AssertionError + pass", [
            n.start(),
            function (_) {
                _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
            },

            n.fail([p("one", 0)], assertion),
            function (_) {
                _.match({duration: 10, pass: 0, fail: 1, skip: 0, reports: [
                    _.fail("one", assertion, assertionDiff(_)),
                ]})
            },

            n.pass([p("two", 1)]),
            function (_) {
                _.match({duration: 20, pass: 1, fail: 1, skip: 0, reports: [
                    _.fail("one", assertion, assertionDiff(_)),
                    _.pass("two"),
                ]})
            },

            n.end(),
            function (_) {
                _.match({duration: 20, pass: 1, fail: 1, skip: 0, reports: [
                    _.fail("one", assertion, assertionDiff(_)),
                    _.pass("two"),
                ]})
            },

            n.start(),
            function (_) {
                _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
            },

            n.fail([p("one", 0)], assertion),
            function (_) {
                _.match({duration: 10, pass: 0, fail: 1, skip: 0, reports: [
                    _.fail("one", assertion, assertionDiff(_)),
                ]})
            },

            n.pass([p("two", 1)]),
            function (_) {
                _.match({duration: 20, pass: 1, fail: 1, skip: 0, reports: [
                    _.fail("one", assertion, assertionDiff(_)),
                    _.pass("two"),
                ]})
            },

            n.end(),
            function (_) {
                _.match({duration: 20, pass: 1, fail: 1, skip: 0, reports: [
                    _.fail("one", assertion, assertionDiff(_)),
                    _.pass("two"),
                ]})
            },
        ])
    })

    context("speed", function () {
        // Speed affects `"pass"` and `"enter"` events only.

        function at(speed) {
            if (speed === "slow") return 80
            if (speed === "medium") return 40
            if (speed === "fast") return 20
            throw new RangeError("Unknown speed: `" + speed + "`")
        }

        /* eslint-disable max-len */

        test("is marked with color", [
            n.start(),
            function (_) {
                _.match({duration: 0, pass: 0, fail: 0, skip: 0, reports: []})
            },

            n.enter([p("core (basic)", 0)], at("fast")),
            function (_) {
                _.match({duration: 20, pass: 1, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", [], "fast", "20ms"),
                ]})
            },

            n.pass([p("core (basic)", 0), p("has `base()`", 0)], at("fast")),
            function (_) {
                _.match({duration: 40, pass: 2, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`", "fast", "20ms"),
                    ], "fast", "20ms"),
                ]})
            },

            n.pass([p("core (basic)", 0), p("has `test()`", 1)], at("fast")),
            function (_) {
                _.match({duration: 60, pass: 3, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`", "fast", "20ms"),
                        _.pass("has `test()`", "fast", "20ms"),
                    ], "fast", "20ms"),
                ]})
            },

            n.pass([p("core (basic)", 0), p("has `parent()`", 2)], at("fast")),
            function (_) {
                _.match({duration: 80, pass: 4, fail: 0, skip: 0, reports: [
                    _.suite("core (basic)", [
                        _.pass("has `base()`", "fast", "20ms"),
                        _.pass("has `test()`", "fast", "20ms"),
                        _.pass("has `parent()`", "fast", "20ms"),
                    ], "fast", "20ms"),
                ]})
            },

            n.pass([p("core (basic)", 0), p("can accept a string + function", 3)], at("fast")),
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

            n.pass([p("core (basic)", 0), p("can accept a string", 4)], at("fast")),
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

            n.pass([p("core (basic)", 0), p("returns the current instance when given a callback", 5)], at("medium")),
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

            n.pass([p("core (basic)", 0), p("returns a prototypal clone when not given a callback", 6)], at("medium")),
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

            n.pass([p("core (basic)", 0), p("runs block tests within tests", 7)], at("fast")),
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

            n.pass([p("core (basic)", 0), p("runs successful inline tests within tests", 8)], at("fast")),
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

            n.pass([p("core (basic)", 0), p("accepts a callback with `run()`", 9)], at("fast")),
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

            n.leave([p("core (basic)", 0)]),
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

            n.enter([p("cli normalize glob", 1)], at("fast")),
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

            n.enter([p("cli normalize glob", 1), p("current directory", 0)], at("fast")),
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

            n.pass([p("cli normalize glob", 1), p("current directory", 0), p("normalizes a file", 0)], at("fast")),
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

            n.pass([p("cli normalize glob", 1), p("current directory", 0), p("normalizes a glob", 1)], at("fast")),
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

            n.pass([p("cli normalize glob", 1), p("current directory", 0), p("retains trailing slashes", 2)], at("fast")),
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

            n.pass([p("cli normalize glob", 1), p("current directory", 0), p("retains negative", 3)], at("fast")),
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

            n.pass([p("cli normalize glob", 1), p("current directory", 0), p("retains negative + trailing slashes", 4)], at("fast")),
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

            n.leave([p("cli normalize glob", 1), p("current directory", 0)]),
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

            n.enter([p("cli normalize glob", 1), p("absolute directory", 1)], at("fast")),
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

            n.pass([p("cli normalize glob", 1), p("absolute directory", 1), p("normalizes a file", 0)], at("fast")),
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

            n.pass([p("cli normalize glob", 1), p("absolute directory", 1), p("normalizes a glob", 1)], at("fast")),
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

            n.pass([p("cli normalize glob", 1), p("absolute directory", 1), p("retains trailing slashes", 2)], at("fast")),
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

            n.pass([p("cli normalize glob", 1), p("absolute directory", 1), p("retains negative", 3)], at("fast")),
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

            n.pass([p("cli normalize glob", 1), p("absolute directory", 1), p("retains negative + trailing slashes", 4)], at("fast")),
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

            n.leave([p("cli normalize glob", 1), p("absolute directory", 1)]),
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

            n.enter([p("cli normalize glob", 1), p("relative directory", 2)], at("fast")),
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

            n.pass([p("cli normalize glob", 1), p("relative directory", 2), p("normalizes a file", 0)], at("fast")),
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

            n.pass([p("cli normalize glob", 1), p("relative directory", 2), p("normalizes a glob", 1)], at("fast")),
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

            n.pass([p("cli normalize glob", 1), p("relative directory", 2), p("retains trailing slashes", 2)], at("fast")),
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

            n.pass([p("cli normalize glob", 1), p("relative directory", 2), p("retains negative", 3)], at("fast")),
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

            n.pass([p("cli normalize glob", 1), p("relative directory", 2), p("retains negative + trailing slashes", 4)], at("fast")),
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

            n.leave([p("cli normalize glob", 1), p("relative directory", 2)]),
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

            n.enter([p("cli normalize glob", 1), p("edge cases", 3)], at("fast")),
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

            n.pass([p("cli normalize glob", 1), p("edge cases", 3), p("normalizes `.` with a cwd of `.`", 0)], at("fast")),
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

            n.pass([p("cli normalize glob", 1), p("edge cases", 3), p("normalizes `..` with a cwd of `.`", 1)], at("fast")),
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

            n.pass([p("cli normalize glob", 1), p("edge cases", 3), p("normalizes `.` with a cwd of `..`", 2)], at("fast")),
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

            n.pass([p("cli normalize glob", 1), p("edge cases", 3), p("normalizes directories with a cwd of `..`", 3)], at("fast")),
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

            n.pass([p("cli normalize glob", 1), p("edge cases", 3), p("removes excess `.`", 4)], at("fast")),
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

            n.pass([p("cli normalize glob", 1), p("edge cases", 3), p("removes excess `..`", 5)], at("fast")),
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

            n.pass([p("cli normalize glob", 1), p("edge cases", 3), p("removes excess combined junk", 6)], at("fast")),
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

            n.leave([p("cli normalize glob", 1), p("edge cases", 3)]),
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

            n.leave([p("cli normalize glob", 1)]),
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

            n.enter([p("core (timeouts)", 2)], at("fast")),
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

            n.pass([p("core (timeouts)", 2), p("succeeds with own", 0)], at("medium")),
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

            n.pass([p("core (timeouts)", 2), p("fails with own", 1)], at("medium")),
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

            n.pass([p("core (timeouts)", 2), p("succeeds with inherited", 2)], at("slow")),
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

            n.pass([p("core (timeouts)", 2), p("fails with inherited", 3)], at("slow")),
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

            n.pass([p("core (timeouts)", 2), p("gets own set timeout", 4)], at("fast")),
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

            n.pass([p("core (timeouts)", 2), p("gets own inline set timeout", 5)], at("fast")),
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

            n.pass([p("core (timeouts)", 2), p("gets own sync inner timeout", 6)], at("fast")),
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

            n.pass([p("core (timeouts)", 2), p("gets default timeout", 7)], at("medium")),
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

            n.leave([p("core (timeouts)", 2)]),
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

            n.end(),
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
        ])

        /* eslint-enable max-len */
    })
})
