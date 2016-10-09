"use strict"

/* eslint max-nested-callbacks: [2, 5] */

var Run = require("../../lib/cli/run.js")
var Cli = require("../../scripts/cli.js")

describe("cli runner", function () {
    var n = Util.n
    var p = Util.p

    describe("exitReporter()", function () {
        var map = {
            fail: new Error("fail"),
            error: new Error("fail"),
        }

        function execute(reporter, type) {
            return Util.Promise.resolve(
                reporter(n(type, [p("test", 0)], map[type])))
        }

        ["start", "enter", "leave", "pass", "skip", "end"]
        .forEach(function (type) {
            it("doesn't trigger for \"" + type + "\" events", function () {
                var state = {fail: false}
                var reporter = Run.exitReporter(state)

                return execute(reporter, type)
                .then(function () { assert.notOk(state.fail) })
            })
        })

        ;["fail", "error"].forEach(function (type) {
            it("does trigger for \"" + type + "\" events", function () {
                var state = {fail: false}
                var reporter = Run.exitReporter(state)

                return execute(reporter, type).then(function () {
                    assert.ok(state.fail)
                })
            })
        })

        it("doesn't trigger from numerous calls", function () {
            var state = {fail: false}
            var reporter = Run.exitReporter(state)

            return execute(reporter, "start")
            .then(function () { return execute(reporter, "pass") })
            .then(function () { return execute(reporter, "pass") })
            .then(function () { assert.notOk(state.fail) })
        })

        it("stays triggered", function () {
            var state = {fail: false}
            var reporter = Run.exitReporter(state)

            return execute(reporter, "start")
            .then(function () { return execute(reporter, "fail") })
            .then(function () { return execute(reporter, "pass") })
            .then(function () { assert.ok(state.fail) })
        })

        it("is cleared on \"end\" + \"start\"", function () {
            var state = {fail: false}
            var reporter = Run.exitReporter(state)

            return execute(reporter, "start")
            .then(function () { return execute(reporter, "fail") })
            .then(function () { return execute(reporter, "pass") })
            .then(function () { return execute(reporter, "end") })
            .then(function () { return execute(reporter, "start") })
            .then(function () { assert.notOk(state.fail) })
        })
    })

    describe("run()", /* @this */ function () {
        this.slow(150)

        /**
         * Most of these are integration tests.
         */

        // When Mocha reloads this module, the module defining the tests also
        // gets reloaded, so the warnings need re-suppressed.
        Util.silenceEmptyInlineWarnings()

        function run(opts) {
            var tt = t.create()
            var tree = opts.tree(tt)

            if (tree["node_modules"] == null) tree["node_modules"] = {}
            tree["node_modules"].thallium = function () { return tt }

            var util = Cli.mock(tree)
            var cwd = opts.cwd != null ? opts.cwd : util.cwd()
            var argv = opts.args

            if (typeof argv === "string") {
                argv = opts.args.trim()
                argv = argv ? argv.split(/\s+/g) : []
            }

            return Run.run({argv: argv, cwd: cwd, util: util})
        }

        it("runs valid tests in the root", function () {
            var ret = []

            return run({
                args: "",
                tree: function (t) {
                    return {
                        test: {
                            ".tl.js": function () {
                                t.reporter(Util.push(ret))
                            },

                            "one.js": function () {
                                t.test("test 1")
                            },

                            "two.js": function () {
                                t.test("test 2")
                            },
                        },
                    }
                },
            }).then(function (code) {
                assert.equal(code, 0)
                assert.match(ret, [
                    n("start", []),
                    n("pass", [p("test 1", 0)]),
                    n("pass", [p("test 2", 1)]),
                    n("end", []),
                ])
            })
        })

        it("doesn't run tests without extensions", function () {
            var ret = []

            return run({
                args: "",
                tree: function (t) {
                    return {
                        test: {
                            ".tl.js": function () {
                                t.reporter(Util.push(ret))
                            },

                            "one": function () {
                                t.test("test 1")
                            },

                            "two.js": function () {
                                t.test("test 2")
                            },
                        },
                    }
                },
            }).then(function (code) {
                assert.equal(code, 0)
                assert.match(ret, [
                    n("start", []),
                    n("pass", [p("test 2", 0)]),
                    n("end", []),
                ])
            })
        })

        it("doesn't run tests with wrong extensions", function () {
            var ret = []

            return run({
                args: "",
                tree: function (t) {
                    return {
                        test: {
                            ".tl.coffee": function () {
                                t.reporter(Util.push(ret))
                            },

                            "one.js": function () {
                                t.test("test 1")
                            },

                            "two.coffee": function () {
                                t.test("test 2")
                            },
                        },
                    }
                },
            }).then(function (code) {
                assert.equal(code, 0)
                assert.match(ret, [
                    n("start", []),
                    n("pass", [p("test 2", 0)]),
                    n("end", []),
                ])
            })
        })

        it("runs failing tests", function () {
            var ret = []
            var AssertionError = assert.AssertionError

            return run({
                args: "",
                tree: function (t) {
                    return {
                        test: {
                            ".tl.js": function () {
                                t.reporter(Util.push(ret))
                            },

                            "one.js": function () {
                                t.test("test 1")
                            },

                            "two.js": function () {
                                t.test("test 2").try(assert.fail, "oops")
                            },
                        },
                    }
                },
            }).then(function (code) {
                assert.equal(code, 1)
                assert.match(ret, [
                    n("start", []),
                    n("pass", [p("test 1", 0)]),
                    n("fail", [p("test 2", 1)], new AssertionError("oops")),
                    n("end", []),
                ])
            })
        })

        it("runs moderately sized test suites", function () {
            var AssertionError = assert.AssertionError
            var ret = []
            var fail = new AssertionError("Expected 1 to not equal 1", 1, 1)
            var fail2 = new AssertionError("Expected 1 to equal 2", 2, 1)
            var fail3 = new AssertionError("Expected 'yep' to be a nope",
                undefined, "yep")
            var sentinel = new Error("sentinel")

            sentinel.marker = function () {}

            function isNope(x) {
                if (x !== "nope") {
                    assert.failFormat(
                        "Expected {actual} to be a nope",
                        {actual: x})
                }
            }

            function modOne(t) {
                t.test("mod-one", function (t) {
                    t.test("1 === 1").try(assert.equal, 1, 1)

                    t.test("foo()", function () {
                        assert.notEqual(1, 1)
                    })

                    t.async("bar()", function () {
                        return Util.Promise.delay(0).throw(new Error("fail"))
                    })

                    t.async("baz()", function () {
                        return Util.Promise.reject(sentinel)
                    })

                    t.test("nested", function (t) {
                        t.test("nested 2", function () {
                            assert.ok(true)
                        })
                    })
                })
            }

            function modTwo(t) {
                t.test("mod-two", function (t) {
                    t.test("1 === 2").try(assert.equal, 1, 2)

                    t.test("expandos don't transfer", function (t) {
                        assert.notHasKey(t, "foo")
                    })

                    t.test("what a fail...").try(isNope, "yep")
                })
            }

            var expected = [
                n("start", []),
                n("enter", [p("mod-one", 0)]),
                n("pass", [p("mod-one", 0), p("1 === 1", 0)]),
                n("fail", [p("mod-one", 0), p("foo()", 1)], fail),
                n("fail", [p("mod-one", 0), p("bar()", 2)], new Error("fail")),
                n("fail", [p("mod-one", 0), p("baz()", 3)], sentinel),
                n("enter", [p("mod-one", 0), p("nested", 4)]),
                n("pass", [p("mod-one", 0), p("nested", 4), p("nested 2", 0)]),
                n("leave", [p("mod-one", 0), p("nested", 4)]),
                n("leave", [p("mod-one", 0)]),
                n("enter", [p("mod-two", 1)]),
                n("fail", [p("mod-two", 1), p("1 === 2", 0)], fail2),
                n("pass", [p("mod-two", 1), p("expandos don't transfer", 1)]),
                n("fail", [p("mod-two", 1), p("what a fail...", 2)], fail3),
                n("leave", [p("mod-two", 1)]),
                n("end", []),
            ]

            return run({
                args: "",
                tree: function (t) {
                    return {
                        test: {
                            ".tl.js": function () {
                                t.reporter(Util.push(ret))
                            },

                            "mod-one.js": function () { modOne(t) },
                            "mod-two.js": function () { modTwo(t) },
                        },
                    }
                },
            }).then(function (code) {
                assert.equal(code, 1)
                assert.match(ret, expected)
            })
        })

        it("adheres to the config correctly", function () {
            var ret = []
            var custom = t.create()

            function noop() {}

            return run({
                args: "",
                tree: function () {
                    return {
                        "node_modules": {
                            "coffee-script": function () {},
                        },

                        ".tl.js": function () {
                            custom.reporter(Util.push(ret))

                            return {
                                thallium: custom,
                                files: [
                                    "totally-not-a-test/**/*.coffee",
                                    "whatever/**/*.js",
                                ],
                            }
                        },

                        "totally-not-a-test": {
                            "test.coffee": function () {
                                custom.test("test").try(noop)
                            },
                        },

                        "whatever": {
                            "other.js": function () {
                                custom.test("other").try(noop)
                            },
                        },
                    }
                },
            }).then(function () {
                assert.match(ret, [
                    n("start", []),
                    n("pass", [p("test", 0)]),
                    n("pass", [p("other", 1)]),
                    n("end", []),
                ])
            })
        })
    })
})
