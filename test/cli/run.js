"use strict"

var Promise = require("bluebird")
var t = require("../../index.js")
var assertions = require("../../assertions.js")
var run1 = require("../../lib/cli/run.js").run
var Cli = require("../../test-util/cli.js")
var Base = require("../../test-util/base.js")
var n = Base.n
var p = Base.p
var push = Base.push

describe("cli config runner", /* @this */ function () {
    this.slow(150)

    /**
     * Most of these are integration tests.
     */

    function run(opts) {
        var tt = t.base().use(assertions)
        var tree = opts.tree(tt)

        tree["node_modules"] = {thallium: function () { return tt }}

        var util = Cli.mock(tree)
        var cwd = opts.cwd != null ? opts.cwd : util.cwd()
        var argv = opts.args

        if (typeof argv === "string") {
            argv = opts.args.trim()
            argv = argv ? argv.split(/\s+/g) : []
        }

        return run1({argv: argv, cwd: cwd, util: util})
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
                n("fail", [p("test 2", 1)], new t.AssertionError("oops")),
                n("end", []),
            ])
        })
    })

    it("runs moderately sized test suites", function () {
        var ret = []
        var fail1 = new t.AssertionError("Expected 1 to not equal 1", 1, 1)
        var fail2 = new t.AssertionError("Expected 1 to equal 2", 2, 1)
        var fail3 = new t.AssertionError("Expected 'yep' to be a nope",
            undefined, "yep")
        var sentinel = new Error("sentinel")

        sentinel.marker = function () {}

        return run({
            args: "",
            tree: function (t) {
                return {
                    test: {
                        ".tl.js": function () {
                            t.reporter(push(ret))
                            t.define("isNope", function (x) {
                                return {
                                    test: x === "nope",
                                    actual: x,
                                    message: "Expected {actual} to be a nope",
                                }
                            })
                        },

                        "mod-one.js": function () {
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
                        },

                        "mod-two.js": function () {
                            t.test("mod-two", function (t) {
                                t.test("1 === 2").equal(1, 2)

                                t.test("expandos don't transfer", function (t) {
                                    t.notHasKey(t, "foo")
                                })

                                t.test("what a fail...").isNope("yep")
                            })
                        },
                    },
                }
            },
        }).then(function (code) {
            t.equal(code, 1)
            t.match(ret, [
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
            ])
        })
    })
})
