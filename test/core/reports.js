/* eslint-disable max-statements */

/**
 * The report objects are very non-trivial, and so is the logic for detecting
 * them. This simultaneously tests both are correct and work.
 */
describe("core/reports", function () {
    "use strict"

    var r = Util.report
    var R = Util.Reports

    function create() {
        var tt = t.internal.root()

        // Silence it.
        tt.reporter = function () {}
        return tt
    }

    function check(report, opts) {
        assert.equal(report.type, opts.type)
        assert.equal(report.isStart, opts.type === "start")
        assert.equal(report.isEnter, opts.type === "enter")
        assert.equal(report.isLeave, opts.type === "leave")
        assert.equal(report.isPass, opts.type === "pass")
        assert.equal(report.isFail, opts.type === "fail")
        assert.equal(report.isSkip, opts.type === "skip")
        assert.equal(report.isEnd, opts.type === "end")
        assert.equal(report.isError, opts.type === "error")
        assert.equal(report.isBeforeAll, opts.type === "before all")
        assert.equal(report.isBeforeEach, opts.type === "before each")
        assert.equal(report.isAfterEach, opts.type === "after each")
        assert.equal(report.isAfterAll, opts.type === "after all")
        assert.equal(report.isHook,
            opts.type === "before all" || opts.type === "before each" ||
            opts.type === "after each" || opts.type === "after all"
        )
        assert.equal(report.parent, opts.parent)
        assert.equal(report.duration, opts.duration || 0)
        assert.equal(report.origin, opts.origin || report)
        assert.equal(report.error, opts.error)
        assert.equal(report.hookName, opts.hookName)
        assert.equal(report.name, opts.name)
        assert.equal(report.index, opts.index)
        assert.equal(report.slow, opts.slow || 75)
        assert.equal(report.timeout, opts.timeout || 2000)
        assert.equal(report.isFailable, !!opts.isFailable)
        assert.equal(report.fullName, opts.fullName)
    }

    function test(name, opts) {
        (opts.it || it)(name, function () {
            return r.wrap(opts.expected, opts.init.bind(opts))
        })
    }

    test("root", {
        init: function (_) {
            var tt = create()

            _.push(R.start(tt._))
            _.push(R.end(tt._))
            return _.check().then(function () {
                check(_.get(0), {type: "start"})
                check(_.get(1), {type: "end"})
            })
        },
        expected: [],
    })

    test("test pass", {
        init: function (_) {
            var tt = create()
            var root = R.start(tt._)

            _.push(root)

            tt.test("test", function () {
                _.push(R.pass(tt.reflect.current._, root, 10))
            })

            return tt.run()
            .then(function () {
                _.push(R.end(tt._))
                return _.check()
            })
            .then(function () {
                check(_.get(0), {type: "start"})
                check(_.get(1), {
                    type: "pass",
                    parent: root,
                    name: "test",
                    index: 0,
                    duration: 10,
                    fullName: "test",
                })
                check(_.get(2), {type: "end"})
            })
        },
        expected: [
            r.pass("test", {duration: 10}),
        ],
    })

    test("test fail", {
        init: function (_) {
            var tt = create()
            var root = R.start(tt._)
            var error = new Error("fail")

            _.push(root)

            tt.test("test", function () {
                var child = tt.reflect.current

                _.push(R.fail(child._, root, 10, error))
            })

            return tt.run()
            .then(function () {
                _.push(R.end(tt._))
                return _.check()
            })
            .then(function () {
                check(_.get(0), {type: "start"})
                check(_.get(1), {
                    type: "fail",
                    parent: root,
                    name: "test",
                    index: 0,
                    error: error,
                    duration: 10,
                    fullName: "test",
                })
                check(_.get(2), {type: "end"})
            })
        },
        expected: [
            r.fail("test", new Error("fail"), {duration: 10}),
        ],
    })

    test("test skip", {
        init: function (_) {
            var tt = create()
            var root = R.start(tt._)

            _.push(root)

            tt.test("test", function () {
                _.push(R.skip(tt.reflect.current._, root))
            })

            return tt.run()
            .then(function () {
                _.push(R.end(tt._))
                return _.check()
            })
            .then(function () {
                check(_.get(0), {type: "start"})
                check(_.get(1), {
                    type: "skip",
                    parent: root,
                    name: "test",
                    index: 0,
                    fullName: "test",
                })
                check(_.get(2), {type: "end"})
            })
        },
        expected: [
            r.skip("test"),
        ],
    })

    test("test enter/leave", {
        init: function (_) {
            var tt = create()
            var root = R.start(tt._)

            _.push(root)

            tt.test("test", function () {
                _.push(R.enter(tt.reflect.current._, root, 10))
                _.push(R.leave(tt.reflect.current._, root))
            })

            return tt.run()
            .then(function () {
                _.push(R.end(tt._))
                return _.check()
            })
            .then(function () {
                check(_.get(0), {type: "start"})
                check(_.get(1), {
                    type: "enter",
                    parent: root,
                    name: "test",
                    index: 0,
                    duration: 10,
                    fullName: "test",
                })
                check(_.get(2), {
                    type: "leave",
                    parent: root,
                    name: "test",
                    index: 0,
                    fullName: "test",
                })
                check(_.get(3), {type: "end"})
            })
        },
        expected: [
            r.suite("test", {duration: 10}, []),
        ],
    })

    test("root error", {
        init: function (_) {
            var tt = create()
            var root = R.start(tt._)
            var error = new Error("fail")

            _.push(root)
            _.push(R.error(root, error))

            return _.check().then(function () {
                check(_.get(0), {type: "start"})
                check(_.get(1), {type: "error", error: error})
            })
        },
        expected: [
            r.error(new Error("fail")),
        ],
    })

    function hookFail() {}

    test("root before all fail", {
        init: function (_) {
            var tt = create()
            var root = R.start(tt._)
            var error = new Error("fail")

            _.push(root)
            _.push(R.beforeAll(tt._, root, root, error, hookFail))
            _.push(R.end(tt._))

            return _.check().then(function () {
                check(_.get(0), {type: "start"})
                check(_.get(1), {
                    type: "before all",
                    parent: root,
                    origin: root,
                    error: error,
                    hookName: hookFail.name,
                })
                check(_.get(2), {type: "end"})
            })
        },
        expected: [
            r.origin(hookFail),
            r.suiteHook("before all", hookFail, new Error("fail")),
        ],
    })

    test("root before each fail", {
        init: function (_) {
            var tt = create()
            var root = R.start(tt._)
            var error = new Error("fail")

            _.push(root)
            _.push(R.beforeEach(tt._, root, root, error, hookFail))
            _.push(R.end(tt._))

            return _.check().then(function () {
                check(_.get(0), {type: "start"})
                check(_.get(1), {
                    type: "before each",
                    parent: root,
                    origin: root,
                    error: error,
                    hookName: hookFail.name,
                })
                check(_.get(2), {type: "end"})
            })
        },
        expected: [
            r.origin(hookFail),
            r.suiteHook("before each", hookFail, new Error("fail")),
        ],
    })

    test("root after each fail", {
        init: function (_) {
            var tt = create()
            var root = R.start(tt._)
            var error = new Error("fail")

            _.push(root)
            tt.test("test", function () {
                _.push(R.pass(tt.reflect.current._, root, 10))
                _.push(R.afterEach(tt._, root, root, error, hookFail))
            })

            return tt.run()
            .then(function () {
                _.push(R.end(tt._))
                return _.check()
            })
            .then(function () {
                check(_.get(0), {type: "start"})
                check(_.get(1), {
                    type: "pass",
                    parent: root,
                    name: "test",
                    index: 0,
                    duration: 10,
                    fullName: "test",
                })
                check(_.get(2), {
                    type: "after each",
                    parent: root,
                    origin: root,
                    error: error,
                    hookName: hookFail.name,
                })
                check(_.get(3), {type: "end"})
            })
        },
        expected: [
            r.origin(hookFail),
            r.pass("test", {duration: 10}),
            r.suiteHook("after each", hookFail, new Error("fail")),
        ],
    })

    test("root after all fail", {
        init: function (_) {
            var tt = create()
            var root = R.start(tt._)
            var error = new Error("fail")

            _.push(root)
            _.push(R.afterAll(tt._, root, root, error, hookFail))
            _.push(R.end(tt._))

            return _.check().then(function () {
                check(_.get(0), {type: "start"})
                check(_.get(1), {
                    type: "after all",
                    parent: root,
                    origin: root,
                    error: error,
                    hookName: hookFail.name,
                })
                check(_.get(2), {type: "end"})
            })
        },
        expected: [
            r.origin(hookFail),
            r.suiteHook("after all", hookFail, new Error("fail")),
        ],
    })

    test("inner test pass", {
        init: function (_) {
            var tt = create()
            var root = R.start(tt._)
            var test

            _.push(root)

            tt.test("test", function () {
                test = R.enter(tt.reflect.current._, root, 10)
                tt.beforeAll(function () {
                    _.push(test)
                })
                tt.test("inner", function () {
                    _.push(R.pass(tt.reflect.current._, test, 10))
                })
                tt.afterAll(function () {
                    _.push(R.leave(tt.reflect.current._, root))
                })
            })

            return tt.run()
            .then(function () {
                _.push(R.end(tt._))
                return _.check()
            })
            .then(function () {
                check(_.get(0), {type: "start"})
                check(_.get(1), {
                    type: "enter",
                    parent: root,
                    name: "test",
                    index: 0,
                    duration: 10,
                    fullName: "test",
                })
                check(_.get(2), {
                    type: "pass",
                    parent: test,
                    name: "inner",
                    index: 0,
                    duration: 10,
                    fullName: "test inner",
                })
                check(_.get(3), {
                    type: "leave",
                    parent: root,
                    name: "test",
                    index: 0,
                    fullName: "test",
                })
                check(_.get(4), {type: "end"})
            })
        },
        expected: [
            r.suite("test", {duration: 10}, [
                r.pass("inner", {duration: 10}),
            ]),
        ],
    })

    test("inner test fail", {
        init: function (_) {
            var tt = create()
            var root = R.start(tt._)
            var error = new Error("fail")
            var test

            _.push(root)

            tt.test("test", function () {
                test = R.enter(tt.reflect.current._, root, 10)
                tt.beforeAll(function () {
                    _.push(test)
                })
                tt.test("inner", function () {
                    _.push(R.fail(tt.reflect.current._, test, 10, error))
                })
                tt.afterAll(function () {
                    _.push(R.leave(tt.reflect.current._, root))
                })
            })

            return tt.run()
            .then(function () {
                _.push(R.end(tt._))
                return _.check()
            })
            .then(function () {
                check(_.get(0), {type: "start"})
                check(_.get(1), {
                    type: "enter",
                    parent: root,
                    name: "test",
                    index: 0,
                    duration: 10,
                    fullName: "test",
                })
                check(_.get(2), {
                    type: "fail",
                    parent: test,
                    name: "inner",
                    index: 0,
                    error: error,
                    duration: 10,
                    fullName: "test inner",
                })
                check(_.get(3), {
                    type: "leave",
                    parent: root,
                    name: "test",
                    index: 0,
                    fullName: "test",
                })
                check(_.get(4), {type: "end"})
            })
        },
        expected: [
            r.suite("test", {duration: 10}, [
                r.fail("inner", new Error("fail"), {duration: 10}),
            ]),
        ],
    })

    test("inner test skip", {
        init: function (_) {
            var tt = create()
            var root = R.start(tt._)
            var test

            _.push(root)

            tt.test("test", function () {
                test = R.enter(tt.reflect.current._, root, 10)
                tt.beforeAll(function () {
                    _.push(test)
                })
                tt.test("inner", function () {
                    _.push(R.skip(tt.reflect.current._, test))
                })
                tt.afterAll(function () {
                    _.push(R.leave(tt.reflect.current._, root))
                })
            })

            return tt.run()
            .then(function () {
                _.push(R.end(tt._))
                return _.check()
            })
            .then(function () {
                check(_.get(0), {type: "start"})
                check(_.get(1), {
                    type: "enter",
                    parent: root,
                    name: "test",
                    index: 0,
                    duration: 10,
                    fullName: "test",
                })
                check(_.get(2), {
                    type: "skip",
                    parent: test,
                    name: "inner",
                    index: 0,
                    fullName: "test inner",
                })
                check(_.get(3), {
                    type: "leave",
                    parent: root,
                    name: "test",
                    index: 0,
                    fullName: "test",
                })
                check(_.get(4), {type: "end"})
            })
        },
        expected: [
            r.suite("test", {duration: 10}, [
                r.skip("inner"),
            ]),
        ],
    })

    test("inner test enter/leave", {
        init: function (_) {
            var tt = create()
            var root = R.start(tt._)
            var test

            _.push(root)

            tt.test("test", function () {
                test = R.enter(tt.reflect.current._, root, 10)
                tt.beforeAll(function () {
                    _.push(test)
                })
                tt.test("inner", function () {
                    _.push(R.enter(tt.reflect.current._, test, 10))
                    _.push(R.leave(tt.reflect.current._, test))
                })
                tt.afterAll(function () {
                    _.push(R.leave(tt.reflect.current._, root))
                })
            })

            return tt.run()
            .then(function () {
                _.push(R.end(tt._))
                return _.check()
            })
            .then(function () {
                check(_.get(0), {type: "start"})
                check(_.get(1), {
                    type: "enter",
                    parent: root,
                    name: "test",
                    index: 0,
                    duration: 10,
                    fullName: "test",
                })
                check(_.get(2), {
                    type: "enter",
                    parent: test,
                    name: "inner",
                    index: 0,
                    duration: 10,
                    fullName: "test inner",
                })
                check(_.get(3), {
                    type: "leave",
                    parent: test,
                    name: "inner",
                    index: 0,
                    fullName: "test inner",
                })
                check(_.get(4), {
                    type: "leave",
                    parent: root,
                    name: "test",
                    index: 0,
                    fullName: "test",
                })
                check(_.get(5), {type: "end"})
            })
        },
        expected: [
            r.suite("test", {duration: 10}, [
                r.suite("inner", {duration: 10}, []),
            ]),
        ],
    })

    test("inner test error", {
        init: function (_) {
            var tt = create()
            var root = R.start(tt._)
            var error = new Error("fail")
            var test

            _.push(root)

            tt.test("test", function () {
                test = R.enter(tt.reflect.current._, root, 10)
                tt.beforeAll(function () {
                    _.push(test)
                })
                tt.test("inner", function () {
                    _.push(R.error(root, error))
                })
            })

            return tt.run()
            .then(function () { return _.check() })
            .then(function () {
                check(_.get(0), {type: "start"})
                check(_.get(1), {
                    type: "enter",
                    parent: root,
                    name: "test",
                    index: 0,
                    duration: 10,
                    fullName: "test",
                })
                check(_.get(2), {type: "error", error: error})
            })
        },
        expected: [
            r.suite("test", {duration: 10}, [
                r.error(new Error("fail")),
            ]),
        ],
    })

    test("inner test before all fail", {
        init: function (_) {
            var tt = create()
            var root = R.start(tt._)
            var error = new Error("fail")
            var test

            _.push(root)

            tt.test("test", function () {
                test = R.enter(tt.reflect.current._, root, 10)
                _.push(test)
                _.push(R.beforeAll(tt.reflect.current._, test, root, error,
                    hookFail))
                _.push(R.leave(tt.reflect.current._, root))
            })

            return tt.run()
            .then(function () {
                _.push(R.end(tt._))
                return _.check()
            })
            .then(function () {
                check(_.get(0), {type: "start"})
                check(_.get(1), {
                    type: "enter",
                    parent: root,
                    name: "test",
                    index: 0,
                    duration: 10,
                    fullName: "test",
                })
                check(_.get(2), {
                    type: "before all",
                    parent: test,
                    origin: root,
                    name: "test",
                    index: 0,
                    error: error,
                    hookName: hookFail.name,
                    fullName: "test",
                })
                check(_.get(3), {
                    type: "leave",
                    parent: root,
                    name: "test",
                    index: 0,
                    fullName: "test",
                })
                check(_.get(4), {type: "end"})
            })
        },
        expected: [
            r.origin(hookFail),
            r.suite("test", {duration: 10}, [
                r.suiteHook("before all", hookFail, new Error("fail")),
            ]),
        ],
    })

    test("inner test before each fail", {
        init: function (_) {
            var tt = create()
            var root = R.start(tt._)
            var error = new Error("fail")
            var test

            _.push(root)

            tt.test("test", function () {
                _.push(test = R.enter(tt.reflect.current._, root, 10))
                _.push(R.beforeEach(tt.reflect.current._, test, root, error,
                    hookFail))
                _.push(R.leave(tt.reflect.current._, root))
            })

            return tt.run()
            .then(function () {
                _.push(R.end(tt._))
                return _.check()
            })
            .then(function () {
                check(_.get(0), {type: "start"})
                check(_.get(1), {
                    type: "enter",
                    parent: root,
                    name: "test",
                    index: 0,
                    duration: 10,
                    fullName: "test",
                })
                check(_.get(2), {
                    type: "before each",
                    parent: test,
                    origin: root,
                    name: "test",
                    index: 0,
                    error: error,
                    hookName: hookFail.name,
                    fullName: "test",
                })
                check(_.get(3), {
                    type: "leave",
                    parent: root,
                    name: "test",
                    index: 0,
                    fullName: "test",
                })
                check(_.get(4), {type: "end"})
            })
        },
        expected: [
            r.origin(hookFail),
            r.suite("test", {duration: 10}, [
                r.suiteHook("before each", hookFail, new Error("fail")),
            ]),
        ],
    })

    test("inner test after each fail", {
        it: it.skip,
        init: function (_) {
            var tt = create()
            var root = R.start(tt._)
            var error = new Error("fail")
            var test

            _.push(root)

            tt.test("test", function () {
                _.push(test = R.enter(tt.reflect.current._, root, 10))
                tt.test("inner", function () {
                    _.push(R.skip(tt.reflect.current._, test))
                })
                tt.afterAll(function () {
                    _.push(R.afterEach(tt.reflect.current._, test, root, error,
                        hookFail))
                    _.push(R.leave(tt.reflect.current._, root))
                })
            })

            return tt.run()
            .then(function () {
                _.push(R.end(tt._))
                return _.check()
            })
            .then(function () {
                check(_.get(0), {type: "start"})
                check(_.get(1), {
                    type: "enter",
                    parent: root,
                    name: "test",
                    index: 0,
                    duration: 10,
                    fullName: "test",
                })
                check(_.get(2), {
                    type: "skip",
                    parent: test,
                    name: "inner",
                    index: 0,
                    fullName: "test inner",
                })
                check(_.get(3), {
                    type: "after each",
                    parent: test,
                    origin: root,
                    name: "inner",
                    index: 0,
                    error: error,
                    hookName: hookFail.name,
                    fullName: "test inner",
                })
                check(_.get(4), {
                    type: "leave",
                    parent: root,
                    name: "test",
                    index: 0,
                    fullName: "test",
                })
                check(_.get(5), {type: "end"})
            })
        },
        expected: [
            r.origin(hookFail),
            r.suite("test", {duration: 10}, [
                r.skip("inner"),
                r.testHook("inner", "after each", hookFail, new Error("fail")),
            ]),
        ],
    })

    test("inner test after all fail", {
        init: function (_) {
            var tt = create()
            var root = R.start(tt._)
            var error = new Error("fail")
            var test

            _.push(root)

            tt.test("test", function () {
                test = R.enter(tt.reflect.current._, root, 10)
                _.push(test)
                tt.test("inner", function () {
                    _.push(R.skip(tt.reflect.current._, test))
                })
                tt.afterAll(function () {
                    _.push(R.afterAll(tt.reflect.current._, test, root, error,
                        hookFail))
                    _.push(R.leave(tt.reflect.current._, root))
                })
            })

            return tt.run()
            .then(function () {
                _.push(R.end(tt._))
                return _.check()
            })
            .then(function () {
                check(_.get(0), {type: "start"})
                check(_.get(1), {
                    type: "enter",
                    parent: root,
                    name: "test",
                    index: 0,
                    duration: 10,
                    fullName: "test",
                })
                check(_.get(2), {
                    type: "skip",
                    parent: test,
                    name: "inner",
                    index: 0,
                    fullName: "test inner",
                })
                check(_.get(3), {
                    type: "after all",
                    parent: test,
                    origin: root,
                    name: "test",
                    index: 0,
                    error: error,
                    hookName: hookFail.name,
                    fullName: "test",
                })
                check(_.get(4), {
                    type: "leave",
                    parent: root,
                    name: "test",
                    index: 0,
                    fullName: "test",
                })
                check(_.get(5), {type: "end"})
            })
        },
        expected: [
            r.origin(hookFail),
            r.suite("test", {duration: 10}, [
                r.skip("inner"),
                r.suiteHook("after all", hookFail, new Error("fail")),
            ]),
        ],
    })
})
