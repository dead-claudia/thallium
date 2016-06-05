"use strict"

var Promise = require("bluebird")
var t = require("../../index.js")
var assertions = require("../../assertions.js")
var resolveAny = require("../../lib/core/common.js").resolveAny
var Run = require("../../lib/cli/run.js")
var Cli = require("../../helpers/cli.js")
var Base = require("../../helpers/base.js")
var n = Base.n
var p = Base.p
var push = Base.push

describe("cli runner", function () {
    describe("exitReporter()", function () {
        var map = {
            fail: new Error("fail"),
            extra: new Error("fail"),
        }

        function execute(reporter, type) {
            return function () {
                return resolveAny(reporter, undefined, {
                    type: type,
                    value: map[type],
                    path: {name: "test", index: 0},
                })
            }
        }

        ["start", "pass", "skip", "end"]
        .forEach(function (type) {
            it("doesn't trigger for \"" + type + "\" events", function () {
                var state = {fail: false}
                var reporter = Run.exitReporter(state)

                return execute(reporter, type)().then(function () {
                    t.false(state.fail)
                })
            })
        })

        ;["fail", "extra"].forEach(function (type) {
            it("does trigger for \"" + type + "\" events", function () {
                var state = {fail: false}
                var reporter = Run.exitReporter(state)

                return execute(reporter, type)().then(function () {
                    t.true(state.fail)
                })
            })
        })

        it("doesn't trigger from numerous calls", function () {
            var state = {fail: false}
            var reporter = Run.exitReporter(state)

            return execute(reporter, "start")()
            .then(execute(reporter, "pass"))
            .then(execute(reporter, "pass"))
            .then(function () { t.false(state.fail) })
        })

        it("stays triggered", function () {
            var state = {fail: false}
            var reporter = Run.exitReporter(state)

            return execute(reporter, "start")()
            .then(execute(reporter, "fail"))
            .then(execute(reporter, "pass"))
            .then(function () { t.true(state.fail) })
        })

        it("is cleared on \"end\" + \"start\"", function () {
            var state = {fail: false}
            var reporter = Run.exitReporter(state)

            return execute(reporter, "start")()
            .then(execute(reporter, "fail"))
            .then(execute(reporter, "pass"))
            .then(execute(reporter, "end"))
            .then(execute(reporter, "start"))
            .then(function () { t.false(state.fail) })
        })
    })

    describe("load()", function () {
        it("loads the config file", function () {
            var file = "config.js"
            var map = Object.create(null)
            var result = {config: true}
            var loaded, baseDir

            function init(file, base) {
                loaded = file
                baseDir = base
                return result
            }

            return Run.load(init, file, map, ".").then(function (config) {
                t.equal(loaded, file)
                t.equal(baseDir, ".")
                t.equal(config, result)
            })
        })

        it("registers all the loaders from the map", function () {
            var mods = ["one", "two", "three", "four", "five"]
            var list = []
            var map = Object.create(null)

            mods.forEach(function (m) {
                map[m] = {register: function () { list.push(m) }}
            })

            return Run.load(function () {}, "config.js", map, ".")
            .then(function () {
                t.match(list, mods)
            })
        })

        it("does both", function () {
            var file = "config.js"
            var mods = ["one", "two", "three", "four", "five"]
            var list = []
            var map = Object.create(null)
            var result = {config: true}
            var loaded, baseDir

            mods.forEach(function (m) {
                map[m] = {register: function () { list.push(m) }}
            })

            function init(file, base) {
                loaded = file
                baseDir = base
                return result
            }

            return Run.load(init, file, map, ".").then(function (config) {
                t.match(list, mods)
                t.equal(loaded, file)
                t.equal(baseDir, ".")
                t.equal(config, result)
            })
        })
    })

    describe("run()", /* @this */ function () {
        this.slow(150)

        /**
         * Most of these are integration tests.
         */

        function run(opts) {
            var tt = t.reflect().base().use(assertions)
            var tree = opts.tree(tt)

            tree["node_modules"] = {thallium: function () { return tt }}

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
                                t.reporter(push(ret))
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
                t.equal(code, 0)
                t.match(ret, [
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
                                t.reporter(push(ret))
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
                t.equal(code, 0)
                t.match(ret, [
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
                                t.reporter(push(ret))
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
                t.equal(code, 0)
                t.match(ret, [
                    n("start", []),
                    n("pass", [p("test 2", 0)]),
                    n("end", []),
                ])
            })
        })

        it("runs failing tests", function () {
            var ret = []
            var AssertionError = t.reflect().AssertionError

            return run({
                args: "",
                tree: function (t) {
                    return {
                        test: {
                            ".tl.js": function () {
                                t.reporter(push(ret))
                            },

                            "one.js": function () {
                                t.test("test 1")
                            },

                            "two.js": function () {
                                t.test("test 2").fail("oops")
                            },
                        },
                    }
                },
            }).then(function (code) {
                t.equal(code, 1)
                t.match(ret, [
                    n("start", []),
                    n("pass", [p("test 1", 0)]),
                    n("fail", [p("test 2", 1)], new AssertionError("oops")),
                    n("end", []),
                ])
            })
        })

        it("runs moderately sized test suites", function () {
            var AssertionError = t.reflect().AssertionError
            var ret = []
            var fail1 = new AssertionError("Expected 1 to not equal 1", 1, 1)
            var fail2 = new AssertionError("Expected 1 to equal 2", 2, 1)
            var fail3 = new AssertionError("Expected 'yep' to be a nope",
                undefined, "yep")
            var sentinel = new Error("sentinel")

            sentinel.marker = function () {}

            function isNope(x) {
                return {
                    test: x === "nope",
                    actual: x,
                    message: "Expected {actual} to be a nope",
                }
            }

            function modOne(t) {
                t.test("mod-one", function (t) {
                    t.test("1 === 1").equal(1, 1)

                    t.test("foo()", function (t) {
                        t.notEqual(1, 1)
                    })

                    t.async("bar()", function (t, done) {
                        setTimeout(function () {
                            done(new Error("fail"))
                        }, 0)
                    })

                    t.async("baz()", function () {
                        return Promise.reject(sentinel)
                    })

                    t.test("nested", function (t) {
                        t.test("nested 2", function (t) {
                            t.true(true)
                        })
                    })
                })
            }

            function modTwo(t) {
                t.test("mod-two", function (t) {
                    t.test("1 === 2").equal(1, 2)

                    t.test("expandos don't transfer", function (t) {
                        t.notHasKey(t, "foo")
                    })

                    t.test("what a fail...").isNope("yep")
                })
            }

            var expected = [
                n("start", []),
                n("enter", [p("mod-one", 0)]),
                n("pass", [p("mod-one", 0), p("1 === 1", 0)]),
                n("fail", [p("mod-one", 0), p("foo()", 1)], fail1),
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
                                t.reporter(push(ret))
                                t.define("isNope", isNope)
                            },

                            "mod-one.js": function () { modOne(t) },
                            "mod-two.js": function () { modTwo(t) },
                        },
                    }
                },
            }).then(function (code) {
                t.equal(code, 1)
                t.match(ret, expected)
            })
        })
    })
})
