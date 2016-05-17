"use strict"

const t = require("../../index.js")
const assertions = require("../../assertions.js")
const run1 = require("../../lib/cli/run.js").run
const Cli = require("../../test-util/cli.js")
const Base = require("../../test-util/base.js")
const n = Base.n
const p = Base.p
const push = Base.push

describe("cli config runner", function () {
    this.slow(150) // eslint-disable-line no-invalid-this

    /**
     * Most of these are integration tests.
     */

    function run(opts) {
        const tt = t.base().use(assertions)
        const tree = opts.tree(tt)

        tree["node_modules"] = {thallium: () => tt}

        const util = Cli.mock(tree)
        const cwd = opts.cwd != null ? opts.cwd : util.cwd()
        let argv = opts.args

        if (typeof argv === "string") {
            argv = opts.args.trim()
            argv = argv ? argv.split(/\s+/g) : []
        }

        return run1({argv, cwd, util})
    }

    it("runs valid tests in the root", () => {
        const ret = []

        return run({
            args: "",
            tree: t => ({
                test: {
                    ".tl.js"() {
                        t.reporter(push(ret))
                    },

                    "one.js"() {
                        t.test("test 1")
                    },

                    "two.js"() {
                        t.test("test 2")
                    },
                },
            }),
        }).then(code => {
            t.equal(code, 0)
            t.match(ret, [
                n("start", []),
                n("start", [p("test 1", 0)]),
                n("end", [p("test 1", 0)]),
                n("pass", [p("test 1", 0)]),
                n("start", [p("test 2", 1)]),
                n("end", [p("test 2", 1)]),
                n("pass", [p("test 2", 1)]),
                n("end", []),
                n("exit", []),
            ])
        })
    })

    it("doesn't run tests without extensions", () => {
        const ret = []

        return run({
            args: "",
            tree: t => ({
                test: {
                    ".tl.js"() {
                        t.reporter(push(ret))
                    },

                    "one"() {
                        t.test("test 1")
                    },

                    "two.js"() {
                        t.test("test 2")
                    },
                },
            }),
        }).then(code => {
            t.equal(code, 0)
            t.match(ret, [
                n("start", []),
                n("start", [p("test 2", 0)]),
                n("end", [p("test 2", 0)]),
                n("pass", [p("test 2", 0)]),
                n("end", []),
                n("exit", []),
            ])
        })
    })

    it("doesn't run tests with wrong extensions", () => {
        const ret = []

        return run({
            args: "",
            tree: t => ({
                test: {
                    ".tl.coffee"() {
                        t.reporter(push(ret))
                    },

                    "one.js"() {
                        t.test("test 1")
                    },

                    "two.coffee"() {
                        t.test("test 2")
                    },
                },
            }),
        }).then(code => {
            t.equal(code, 0)
            t.match(ret, [
                n("start", []),
                n("start", [p("test 2", 0)]),
                n("end", [p("test 2", 0)]),
                n("pass", [p("test 2", 0)]),
                n("end", []),
                n("exit", []),
            ])
        })
    })

    it("runs failing tests", () => {
        const ret = []

        return run({
            args: "",
            tree: t => ({
                test: {
                    ".tl.js"() {
                        t.reporter(push(ret))
                    },

                    "one.js"() {
                        t.test("test 1")
                    },

                    "two.js"() {
                        t.test("test 2").fail("oops")
                    },
                },
            }),
        }).then(code => {
            t.equal(code, 1)
            t.match(ret, [
                n("start", []),
                n("start", [p("test 1", 0)]),
                n("end", [p("test 1", 0)]),
                n("pass", [p("test 1", 0)]),
                n("start", [p("test 2", 1)]),
                n("end", [p("test 2", 1)]),
                n("fail", [p("test 2", 1)], new t.AssertionError("oops")),
                n("end", []),
                n("exit", []),
            ])
        })
    })

    it("runs moderately sized test suites", () => {
        const ret = []
        const fail1 = new t.AssertionError("Expected 1 to not equal 1", 1, 1)
        const fail2 = new t.AssertionError("Expected 1 to equal 2", 2, 1)
        const fail3 = new t.AssertionError("Expected 'yep' to be a nope",
            undefined, "yep")
        const sentinel = new Error("sentinel")

        sentinel.marker = () => {}

        return run({
            args: "",
            tree: t => ({
                test: {
                    ".tl.js"() {
                        t.reporter(push(ret))
                        t.define("isNope", x => ({
                            test: x === "nope",
                            actual: x,
                            message: "Expected {actual} to be a nope",
                        }))
                    },

                    "mod-one.js"() {
                        t.test("mod-one", t => {
                            t.test("1 === 1").equal(1, 1)

                            t.test("foo()", t => {
                                t.notEqual(1, 1)
                            })

                            t.async("bar()", (t, done) => {
                                setTimeout(() => done(new Error("fail")), 0)
                            })

                            t.async("baz()", () => Promise.reject(sentinel))

                            t.test("nested", t => {
                                t.test("nested 2", tt => tt.true(true))
                            })
                        })
                    },

                    "mod-two.js"() {
                        t.test("mod-two", t => {
                            t.test("1 === 2").equal(1, 2)

                            t.test("expandos don't transfer", t => {
                                t.notHasKey(t, "foo")
                            })

                            t.test("what a fail...").isNope("yep")
                        })
                    },
                },
            }),
        }).then(code => {
            t.equal(code, 1)
            t.match(ret, [
                n("start", []),
                n("start", [p("mod-one", 0)]),
                n("start", [p("mod-one", 0), p("1 === 1", 0)]),
                n("end", [p("mod-one", 0), p("1 === 1", 0)]),
                n("pass", [p("mod-one", 0), p("1 === 1", 0)]),
                n("start", [p("mod-one", 0), p("foo()", 1)]),
                n("end", [p("mod-one", 0), p("foo()", 1)]),
                n("fail", [p("mod-one", 0), p("foo()", 1)], fail1),
                n("start", [p("mod-one", 0), p("bar()", 2)]),
                n("end", [p("mod-one", 0), p("bar()", 2)]),
                n("fail", [p("mod-one", 0), p("bar()", 2)], new Error("fail")),
                n("start", [p("mod-one", 0), p("baz()", 3)]),
                n("end", [p("mod-one", 0), p("baz()", 3)]),
                n("fail", [p("mod-one", 0), p("baz()", 3)], sentinel),
                n("start", [p("mod-one", 0), p("nested", 4)]),
                n("start", [p("mod-one", 0), p("nested", 4), p("nested 2", 0)]),
                n("end", [p("mod-one", 0), p("nested", 4), p("nested 2", 0)]),
                n("pass", [p("mod-one", 0), p("nested", 4), p("nested 2", 0)]),
                n("end", [p("mod-one", 0), p("nested", 4)]),
                n("pass", [p("mod-one", 0), p("nested", 4)]),
                n("end", [p("mod-one", 0)]),
                n("pass", [p("mod-one", 0)]),
                n("start", [p("mod-two", 1)]),
                n("start", [p("mod-two", 1), p("1 === 2", 0)]),
                n("end", [p("mod-two", 1), p("1 === 2", 0)]),
                n("fail", [p("mod-two", 1), p("1 === 2", 0)], fail2),
                n("start", [p("mod-two", 1), p("expandos don't transfer", 1)]),
                n("end", [p("mod-two", 1), p("expandos don't transfer", 1)]),
                n("pass", [p("mod-two", 1), p("expandos don't transfer", 1)]),
                n("start", [p("mod-two", 1), p("what a fail...", 2)]),
                n("end", [p("mod-two", 1), p("what a fail...", 2)]),
                n("fail", [p("mod-two", 1), p("what a fail...", 2)], fail3),
                n("end", [p("mod-two", 1)]),
                n("pass", [p("mod-two", 1)]),
                n("end", []),
                n("exit", []),
            ])
        })
    })
})
