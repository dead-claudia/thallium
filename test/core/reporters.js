describe("core/reporters", function () { // eslint-disable-line max-statements
    "use strict"

    var r = Util.report

    // Use thenables, not actual Promises.
    function resolve(value) {
        return {then: function (resolve) { resolve(value) }}
    }

    function reject(value) {
        return {then: function (_, reject) { reject(value) }}
    }

    function wrap3(tree1, tree2, tree3, callback) {
        return r.wrap(tree1, function (_1) {
            return r.wrap(tree2, function (_2) {
                return r.wrap(tree3, function (_3) {
                    return callback(_1, _2, _3)
                })
            })
        })
    }

    context("normal", function () {
        it("added to root correctly", function () {
            return r.wrap([
                r.pass("test 1"),
                r.pass("test 2"),
            ], function (_) {
                var tt = t.internal.root()

                assert.equal(tt.hasReporter, false)
                tt.reporter = _.push.bind(_)
                assert.equal(tt.hasReporter, true)
                tt.test("test 1", function () {})
                tt.test("test 2", function () {})
                return tt.run().then(_.check.bind(_))
            })
        })

        r.test("errors if added to children", {
            init: function (tt) {
                tt.test("test", function () {
                    assert.throws(function () {
                        tt.reporter = ["spec"]
                    })

                    assert.throws(function () {
                        tt.reporter = function () {}
                    })
                })
            },
            expected: [
                r.pass("test"),
            ],
        })

        it("uses last added", function () {
            return wrap3(undefined, [
                r.pass("test 1"),
                r.pass("test 2"),
            ], undefined, function (_1, _2, _3) {
                var tt = t.internal.root()

                tt.reporter = _1.push.bind(_1)
                var push2 = tt.reporter = _2.push.bind(_2)
                var push3 = tt.reporter = _3.push.bind(_3)

                tt.reporter = push3
                tt.reporter = push2

                tt.test("test 1", function () {})
                tt.test("test 2", function () {})

                return tt.run()
                .then(_1.check.bind(_1))
                .then(_2.check.bind(_2))
                .then(_3.check.bind(_3))
            })
        })
    })

    context("reflect", function () {
        function notHasReporter(tt, ref) {
            if (tt.reflect.hasReporter(ref)) {
                assert.fail("Expected test to not have reporter {actual}", {
                    actual: ref,
                })
            }
        }

        function hasReporter(tt, ref) {
            if (!tt.reflect.hasReporter(ref)) {
                assert.fail("Expected test to have reporter {expected}", {
                    expected: ref,
                })
            }
        }

        r.test("added to root correctly", {
            init: function (tt) {
                function reporter() {}
                tt.reflect.addReporter(reporter)
                hasReporter(tt, reporter)
            },
        })

        r.test("errors if added to children", {
            reporter: function () {},
            init: function (tt, ctx) {
                tt.reflect.addReporter(ctx.reporter)
                hasReporter(tt, ctx.reporter)

                tt.test("test", function () {
                    function inner() {}

                    assert.throws(function () {
                        tt.reflect.addReporter(inner)
                    })
                    notHasReporter(tt, inner)
                })
            },
            expected: [
                r.pass("test"),
            ],
            after: function (tt) {
                hasReporter(tt, this.reporter)
            },
        })

        r.test("removed individually correctly", {
            init: function (tt) {
                function reporter() {}
                tt.reflect.addReporter(reporter)
                tt.reflect.removeReporter(reporter)
                notHasReporter(tt, reporter)
            },
        })

        r.test("errors if \"removed\" from children", {
            reporter: function () {},
            init: function (tt, ctx) {
                tt.reflect.addReporter(ctx.reporter)

                tt.test("test", function () {
                    assert.throws(function () {
                        tt.reflect.removeReporter(ctx.reporter)
                    })

                    assert.throws(function () {
                        tt.reflect.removeReporter(function () {})
                    })
                })
            },
            expected: [
                r.pass("test"),
            ],
            after: function (tt) {
                hasReporter(tt, this.reporter)
            },
        })

        it("only added once", function () {
            var expected = [
                r.pass("test 1"),
                r.pass("test 2"),
            ]

            return wrap3(expected, expected, expected, function (_1, _2, _3) {
                var tt = t.internal.root()
                var push1, push3

                // Silence it
                tt.reporter = function () {}
                tt.reflect.addReporter(push1 = _1.push.bind(_1))
                tt.reflect.addReporter(_2.push.bind(_2))
                tt.reflect.addReporter(push3 = _3.push.bind(_3))

                tt.reflect.addReporter(push3)
                tt.reflect.addReporter(push1)

                tt.test("test 1", function () {})
                tt.test("test 2", function () {})
                return tt.run()
                .then(_1.check.bind(_1))
                .then(_2.check.bind(_2))
                .then(_3.check.bind(_3))
            })
        })
    })

    r.test("called correctly with sync passing", {
        init: function (tt) {
            tt.test("test", function () {})
            tt.test("test", function () {})
        },
        expected: [
            r.pass("test"),
            r.pass("test"),
        ],
    })

    r.test("called correctly with sync failing", {
        init: function (tt) {
            tt.test("one", function () { throw new Error("sentinel") })
            tt.test("two", function () { throw new Error("sentinel") })
        },
        expected: [
            r.fail("one", new Error("sentinel")),
            r.fail("two", new Error("sentinel")),
        ],
    })

    r.test("called correctly with sync both", {
        init: function (tt) {
            tt.test("one", function () { throw new Error("sentinel") })
            tt.test("two", function () {})
        },
        expected: [
            r.fail("one", new Error("sentinel")),
            r.pass("two"),
        ],
    })

    r.test("called correctly with inline passing", {
        init: function (tt) {
            tt.test("test", function () {})
            tt.test("test", function () {})
        },
        expected: [
            r.pass("test"),
            r.pass("test"),
        ],
    })

    r.test("called correctly with inline failing", {
        it: Util.phantomFix(it),
        init: function (tt) {
            tt.test("one", function () { assert.fail("fail") })
            tt.test("two", function () { assert.fail("fail") })
        },
        expected: [
            r.fail("one", new assert.AssertionError("fail")),
            r.fail("two", new assert.AssertionError("fail")),
        ],
    })

    r.test("called correctly with inline both", {
        it: Util.phantomFix(it),
        init: function (tt) {
            tt.test("one", function () { assert.fail("fail") })
            tt.test("two", function () {})
        },
        expected: [
            r.fail("one", new assert.AssertionError("fail")),
            r.pass("two"),
        ],
    })

    r.test("called correctly with async passing", {
        init: function (tt) {
            tt.test("test", function () { return resolve() })
            tt.test("test", function () {})
        },
        expected: [
            r.pass("test"),
            r.pass("test"),
        ],
    })

    r.test("called correctly with async failing", {
        init: function (tt) {
            tt.test("one", function () { return reject(new Error("sentinel")) })
            tt.test("two", function () { throw new Error("sentinel") })
        },
        expected: [
            r.fail("one", new Error("sentinel")),
            r.fail("two", new Error("sentinel")),
        ],
    })

    r.test("called correctly with async both", {
        init: function (tt) {
            tt.test("one", function () { return reject(new Error("sentinel")) })
            tt.test("two", function () { return resolve() })
        },
        expected: [
            r.fail("one", new Error("sentinel")),
            r.pass("two"),
        ],
    })

    r.test("called correctly with async + promise passing", {
        init: function (tt) {
            tt.test("test", function () { return resolve() })
            tt.test("test", function () {})
        },
        expected: [
            r.pass("test"),
            r.pass("test"),
        ],
    })

    r.test("called correctly with async + promise failing", {
        init: function (tt) {
            tt.test("one", function () { return reject(new Error("sentinel")) })
            tt.test("two", function () { throw new Error("sentinel") })
        },
        expected: [
            r.fail("one", new Error("sentinel")),
            r.fail("two", new Error("sentinel")),
        ],
    })

    r.test("called correctly with async + promise both", {
        init: function (tt) {
            tt.test("one", function () { return reject(new Error("sentinel")) })
            tt.test("two", function () { return resolve() })
        },
        expected: [
            r.fail("one", new Error("sentinel")),
            r.pass("two"),
        ],
    })

    r.test("called correctly with child passing tests", {
        init: function (tt) {
            tt.test("test", function () {
                tt.test("one", function () {})
                tt.test("two", function () {})
            })
        },
        expected: [
            r.suite("test", [
                r.pass("one"),
                r.pass("two"),
            ]),
        ],
    })

    r.test("called correctly with child failing tests", {
        init: function (tt) {
            tt.test("parent one", function () {
                tt.test("child one", function () {
                    throw new Error("sentinel one")
                })
                tt.test("child two", function () {
                    throw new Error("sentinel one")
                })
            })

            tt.test("parent two", function () {
                tt.test("child one", function () {
                    throw new Error("sentinel two")
                })
                tt.test("child two", function () {
                    throw new Error("sentinel two")
                })
            })
        },
        expected: [
            r.suite("parent one", [
                r.fail("child one", new Error("sentinel one")),
                r.fail("child two", new Error("sentinel one")),
            ]),
            r.suite("parent two", [
                r.fail("child one", new Error("sentinel two")),
                r.fail("child two", new Error("sentinel two")),
            ]),
        ],
    })

    r.test("called correctly with child both", {
        init: function (tt) {
            tt.test("parent one", function () {
                tt.test("child one", function () {
                    throw new Error("sentinel one")
                })
                tt.test("child two", function () {})
            })

            tt.test("parent two", function () {
                tt.test("child one", function () {
                    throw new Error("sentinel two")
                })
                tt.test("child two", function () {})
            })
        },
        expected: [
            r.suite("parent one", [
                r.fail("child one", new Error("sentinel one")),
                r.pass("child two"),
            ]),
            r.suite("parent two", [
                r.fail("child one", new Error("sentinel two")),
                r.pass("child two"),
            ]),
        ],
    })

    r.test("locks itself when running", {
        init: function (tt, ctx) {
            tt.reporter = function (report) {
                if (report.isFail) ctx.err = report.error
            }

            tt.test("test", function () {
                tt.run()
            })
        },
        after: function () {
            assert.is(Error, this.err)
        },
    })

    r.test("called correctly with complex sequence", {
        it: Util.phantomFix(it),
        init: function (tt) {
            tt.test("mod-one", function () {
                tt.test("1 === 1", function () { assert.equal(1, 1) })

                tt.test("foo()", function () {
                    assert.notEqual(1, 1)
                })

                tt.test("bar()", function () {
                    return {
                        then: function (_, reject) {
                            Util.setTimeout(function () {
                                reject(new Error("fail"))
                            }, 0)
                        },
                    }
                })

                tt.test("baz()", function () {
                    return {
                        then: function (_, reject) {
                            Util.setTimeout(function () {
                                reject(new Error("sentinel"))
                            }, 0)
                        },
                    }
                })

                tt.test("nested", function () {
                    tt.test("nested 2", function () {
                        assert.equal(true, true)
                    })
                })
            })

            tt.test("mod-two", function () {
                tt.test("1 === 2", function () { assert.equal(1, 2) })
            })
        },
        expected: [
            r.suite("mod-one", [
                r.pass("1 === 1"),
                r.fail("foo()", new assert.AssertionError(
                    "Expected 1 to not equal 1", 1, 1)),
                r.fail("bar()", new Error("fail")),
                r.fail("baz()", new Error("sentinel")),
                r.suite("nested", [
                    r.pass("nested 2"),
                ]),
            ]),

            r.suite("mod-two", [
                r.fail("1 === 2", new assert.AssertionError(
                    "Expected 1 to equal 2", 2, 1)),
            ]),
        ],
    })

    it("can return a resolving thenable", function () {
        return r.wrap([
            r.pass("test"),
            r.pass("test"),
        ], function (_) {
            var tt = t.internal.root()

            tt.reporter = function (arg) {
                return {
                    then: function (resolve) {
                        resolve(_.push(arg))
                    },
                }
            }

            tt.test("test", function () {})
            tt.test("test", function () {})

            return tt.run().then(_.check.bind(_))
        })
    })

    it("can return a rejecting thenable", function () {
        var tt = t.internal.root()
        var sentinel = new Error("sentinel")

        tt.reporter = function () {
            return {then: function (_, reject) { return reject(sentinel) }}
        }

        tt.test("test", function () {})
        tt.test("test", function () {})

        return tt.run().then(
            function () { assert.fail("Expected a rejection") },
            function (err) { assert.equal(err, sentinel) })
    })

    it("reports reporter errors", function () {
        var tt = t.internal.root()
        var sentinel = new Error("sentinel")
        var reported

        tt.reporter = function (report) {
            if (report.isError) reported = report.error
            if (report.isStart) throw sentinel
        }

        return tt.run().then(
            function () { assert.fail("Expected a rejection") },
            function (rejected) {
                assert.equal(rejected, sentinel)
                assert.equal(reported, sentinel)
            })
    })

    // This is a bit too tightly coupled to the implementation than I'd normally
    // be comfortable with...
    it("reports internal errors", function () {
        var tt = t.internal.root()
        var reported

        tt.reporter = function (report) {
            if (report.isError) reported = report.error
        }

        tt.test("test", function () {
            tt._.root.current = undefined
            tt._.root = undefined
        })

        return tt.run().then(
            function () { assert.fail("Expected a rejection") },
            function (rejected) {
                assert.is(Error, rejected)
                assert.equal(reported, rejected)
            })
    })

    r.test("has repeatable output", {
        repeat: true,
        it: Util.phantomFix(it),
        init: function (tt) {
            tt.test("mod-one", function () {
                tt.test("1 === 1", function () { assert.equal(1, 1) })

                tt.test("foo()", function () {
                    assert.notEqual(1, 1)
                })

                tt.test("bar()", function () {
                    return {
                        then: function (_, reject) {
                            Util.setTimeout(function () {
                                reject(new Error("fail"))
                            }, 0)
                        },
                    }
                })

                tt.test("baz()", function () {
                    return {
                        then: function (_, reject) {
                            Util.setTimeout(function () {
                                reject(new Error("sentinel"))
                            }, 0)
                        },
                    }
                })

                tt.test("nested", function () {
                    tt.test("nested 2", function () {
                        assert.equal(true, true)
                    })
                })
            })

            tt.test("mod-two", function () {
                tt.test("1 === 2", function () { assert.equal(1, 2) })
            })
        },
        expected: [
            r.suite("mod-one", [
                r.pass("1 === 1"),
                r.fail("foo()", new assert.AssertionError(
                    "Expected 1 to not equal 1", 1, 1)),
                r.fail("bar()", new Error("fail")),
                r.fail("baz()", new Error("sentinel")),
                r.suite("nested", [
                    r.pass("nested 2"),
                ]),
            ]),

            r.suite("mod-two", [
                r.fail("1 === 2", new assert.AssertionError(
                    "Expected 1 to equal 2", 2, 1)),
            ]),
        ],
    })

    function hookFail() {
        throw new Error("sentinel")
    }

    r.test("reports global `before all` failures", {
        init: function (tt) {
            tt.beforeAll(hookFail)
            tt.test("foo", function () {})
        },
        expected: [
            r.origin(hookFail),
            r.suiteHook("before all", hookFail, new Error("sentinel")),
        ],
    })

    r.test("reports global `before each` failures", {
        init: function (tt) {
            tt.before(hookFail)
            tt.test("foo", function () {})
        },
        expected: [
            r.origin(hookFail),
            r.testHook("foo", "before each", hookFail, new Error("sentinel")),
        ],
    })

    r.test("reports global `after each` failures", {
        init: function (tt) {
            tt.after(hookFail)
            tt.test("foo", function () {})
        },
        expected: [
            r.origin(hookFail),
            r.pass("foo"),
            r.testHook("foo", "after each", hookFail, new Error("sentinel")),
        ],
    })

    r.test("reports global `after all` failures", {
        init: function (tt) {
            tt.afterAll(hookFail)
            tt.test("foo", function () {})
        },
        expected: [
            r.origin(hookFail),
            r.pass("foo"),
            r.suiteHook("after all", hookFail, new Error("sentinel")),
        ],
    })

    r.test("reports local `before all` failures", {
        init: function (tt) {
            tt.test("foo", function () {
                tt.beforeAll(hookFail)
                tt.test("inner", function () {})
            })
        },
        expected: [
            r.suite("foo", [
                r.origin(hookFail),
                r.suiteHook("before all", hookFail, new Error("sentinel")),
            ]),
        ],
    })

    r.test("reports local `before each` failures", {
        init: function (tt) {
            tt.test("foo", function () {
                tt.before(hookFail)
                tt.test("inner", function () {})
            })
        },
        expected: [
            r.suite("foo", [
                r.origin(hookFail),
                r.testHook("inner", "before each", hookFail,
                    new Error("sentinel")),
            ]),
        ],
    })

    r.test("reports local `after each` failures", {
        init: function (tt) {
            tt.test("foo", function () {
                tt.after(hookFail)
                tt.test("inner", function () {})
            })
        },
        expected: [
            r.suite("foo", [
                r.origin(hookFail),
                r.pass("inner"),
                r.testHook("inner", "after each", hookFail,
                    new Error("sentinel")),
            ]),
        ],
    })

    r.test("reports local `after all` failures", {
        init: function (tt) {
            tt.test("foo", function () {
                tt.afterAll(hookFail)
                tt.test("inner", function () {})
            })
        },
        expected: [
            r.suite("foo", [
                r.origin(hookFail),
                r.pass("inner"),
                r.suiteHook("after all", hookFail, new Error("sentinel")),
            ]),
        ],
    })

    context("stack traces", function () {
        it("pretty-prints single-line errors with no stack", function () {
            var e = new Error("test")

            e.stack = e.message
            assert.match(Util.R.getStack(e), "Error: test")
        })

        it("pretty-prints multi-line errors with no stack", function () {
            var e = new Error("test\ntest")

            e.stack = e.message
            assert.match(
                Util.R.getStack(e),
                "Error: test" + Util.R.Console.newline + "test"
            )
        })

        it("trims the message correctly", function () {
            var e = new Error("  test\n   test")

            e.stack = e.message + "\n at Foo "
            assert.match(
                Util.R.getStack(e),
                "Error:   test" + Util.R.Console.newline +
                "   test" + Util.R.Console.newline +
                "at Foo"
            )
        })
    })
})
