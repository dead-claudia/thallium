"use strict"

/* eslint max-nested-callbacks: [2, 5] */

var parse = require("../../lib/cli/args").parse
var Run = require("../../lib/cli/run")
var Cli = require("../../test-util/cli/cli")

describe("cli/run", function () {
    var r = Util.report

    describe("run()", /* @this */ function () {
        this.slow(150)

        /**
         * Most of these are integration tests.
         */

        function test(name, opts) {
            it(name, function () {
                return r.wrap(opts.expected, function (reporter, check) {
                    var tt = t.internal.root()
                    var tree = opts.tree(tt, reporter)

                    if (tree["node_modules"] == null) tree["node_modules"] = {}
                    tree["node_modules"].thallium = function () { return tt }

                    var args = opts.args

                    if (typeof args === "string") {
                        args = opts.args.trim()
                        args = args ? args.split(/\s+/g) : []
                    }

                    return Run.run(parse(args), Cli.mock(tree))
                    .then(function (code) {
                        assert.equal(code, opts.code || 0)
                        check()
                    })
                })
            })
        }

        test("runs valid tests in the root", {
            args: "",
            tree: function (t, reporter) {
                return {
                    test: {
                        ".tl.js": function () {
                            t.reporter = reporter
                        },

                        "one.js": function () {
                            t.test("test 1", function () {})
                        },

                        "two.js": function () {
                            t.test("test 2", function () {})
                        },
                    },
                }
            },
            expected: r.root([
                r.pass("test 1", 0),
                r.pass("test 2", 1),
            ]),
        })

        test("doesn't run tests without extensions", {
            args: "",
            tree: function (t, reporter) {
                return {
                    test: {
                        ".tl.js": function () {
                            t.reporter = reporter
                        },

                        "one": function () {
                            t.test("test 1", function () {})
                        },

                        "two.js": function () {
                            t.test("test 2", function () {})
                        },
                    },
                }
            },
            expected: r.root([
                r.pass("test 2", 0),
            ]),
        })

        test("doesn't run tests without extensions", {
            args: "",
            tree: function (t, reporter) {
                return {
                    test: {
                        ".tl.js": function () {
                            t.reporter = reporter
                        },

                        "one": function () {
                            t.test("test 1", function () {})
                        },

                        "two.js": function () {
                            t.test("test 2", function () {})
                        },
                    },
                }
            },
            expected: r.root([
                r.pass("test 2", 0),
            ]),
        })

        test("doesn't run tests with wrong extensions", {
            args: "",
            tree: function (t, reporter) {
                return {
                    test: {
                        ".tl.coffee": function () {
                            t.reporter = reporter
                        },

                        "one.js": function () {
                            t.test("test 1", function () {})
                        },

                        "two.coffee": function () {
                            t.test("test 2", function () {})
                        },
                    },
                }
            },
            expected: r.root([
                r.pass("test 2", 0),
            ]),
        })

        test("runs failing tests", {
            args: "",
            tree: function (t, reporter) {
                return {
                    test: {
                        ".tl.js": function () {
                            t.reporter = reporter
                        },

                        "one.js": function () {
                            t.test("test 1", function () {})
                        },

                        "two.js": function () {
                            t.test("test 2", function () {
                                assert.fail("oops")
                            })
                        },
                    },
                }
            },
            code: 1,
            expected: r.root([
                r.pass("test 1"),
                r.fail("test 2", new assert.AssertionError("oops")),
            ]),
        })

        function isNope(x) {
            if (x !== "nope") {
                assert.fail("Expected {actual} to be a nope", {actual: x})
            }
        }

        test("runs moderately sized test suites", {
            args: "",
            tree: function (t, reporter) {
                return {
                    test: {
                        ".tl.js": function () {
                            t.reporter = reporter
                        },

                        "mod-one.js": function () {
                            t.test("mod-one", function () {
                                t.test("1 === 1", function () {
                                    assert.equal(1, 1)
                                })

                                t.test("foo()", function () {
                                    assert.notEqual(1, 1)
                                })

                                t.test("bar()", function () {
                                    return new Promise(function (_, reject) {
                                        global.setTimeout(function () {
                                            reject(new Error("fail"))
                                        }, 0)
                                    })
                                })

                                t.test("baz()", function () {
                                    return Promise.reject(new Error("sentinel"))
                                })

                                t.test("nested", function () {
                                    t.test("nested 2", function () {
                                        assert.ok(true)
                                    })
                                })
                            })
                        },

                        "mod-two.js": function () {
                            t.test("mod-two", function () {
                                t.test("1 === 2", function () {
                                    assert.equal(1, 2)
                                })

                                t.test("expandos don't transfer", function () {
                                    assert.notHasKey(t, "foo")
                                })

                                t.test("what a fail...", function () {
                                    isNope("yep")
                                })
                            })
                        },
                    },
                }
            },
            code: 1,
            expected: r.root([
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
                    r.pass("expandos don't transfer"),
                    r.fail("what a fail...", new assert.AssertionError(
                        "Expected 'yep' to be a nope", undefined, "yep")),
                ]),
            ]),
        })

        test("adheres to the config correctly", {
            args: "",
            tree: function (_, reporter) {
                var custom = t.internal.root()

                return {
                    "node_modules": {
                        "coffee-script": function () {},
                    },

                    ".tl.js": function () {
                        custom.reporter = reporter
                        custom.files = [
                            "totally-not-a-test/**/*.coffee",
                            "whatever/**/*.js",
                        ]

                        return Promise.resolve(custom)
                    },

                    "totally-not-a-test": {
                        "test.coffee": function () {
                            custom.test("test", function () {})
                        },
                    },

                    "whatever": {
                        "other.js": function () {
                            custom.test("other", function () {})
                        },
                    },
                }
            },
            expected: r.root([
                r.pass("test"),
                r.pass("other"),
            ]),
        })
    })
})
