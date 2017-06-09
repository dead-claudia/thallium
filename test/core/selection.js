/* eslint max-nested-callbacks: [2, 5] */

describe("core/selection", function () {
    "use strict"

    var p = t.internal.location
    var n = t.internal.reports

    describe("skip (per-test)", function () {
        it("filters correctly", function () {
            var tt = t.internal.root()
            var ret = []

            tt.reporter = Util.push(ret)

            tt.test("one", function () {
                tt.testSkip("inner", function () {})
                tt.test("other", function () {})
            })

            tt.test("two", function () {
                tt.test("inner", function () {})
                tt.test("other", function () {})
            })

            return tt.run().then(function () {
                assert.match(ret, [
                    n.start(),
                    n.enter([p("one", 0)]),
                    n.skip([p("one", 0), p("inner", 0)]),
                    n.pass([p("one", 0), p("other", 1)]),
                    n.leave([p("one", 0)]),
                    n.enter([p("two", 1)]),
                    n.pass([p("two", 1), p("inner", 0)]),
                    n.pass([p("two", 1), p("other", 1)]),
                    n.leave([p("two", 1)]),
                    n.end(),
                ])
            })
        })
    })

    function testSel(result, name, init) {
        describe(name, function () {
            it("filters correctly with strings", function () {
                var tt = t.internal.root()
                var ret = []

                tt.reporter = Util.push(ret)

                tt.test("one", function () {
                    tt.test("inner", function () {})
                    tt.test("other", function () {})
                })

                tt.test("two", function () {
                    tt.test("inner", function () {})
                    tt.test("other", function () {})
                })

                return init(tt, [["one", "inner"]]).then(function () {
                    assert.match(ret, result)
                })
            })

            it("filters correctly with regexps", function () {
                var tt = t.internal.root()
                var ret = []

                tt.reporter = Util.push(ret)

                tt.test("one", function () {
                    tt.test("inner", function () {})
                    tt.test("other", function () {})
                })

                tt.test("two", function () {
                    tt.test("inner", function () {})
                    tt.test("other", function () {})
                })

                return init(tt, [[/^one$/, "inner"]]).then(function () {
                    assert.match(ret, result)
                })
            })
        })
    }

    var skipOutput = [
        n.start(),
        n.enter([p("one", 0)]),
        n.skip([p("one", 0), p("inner", 0)]),
        n.pass([p("one", 0), p("other", 1)]),
        n.leave([p("one", 0)]),
        n.enter([p("two", 1)]),
        n.pass([p("two", 1), p("inner", 0)]),
        n.pass([p("two", 1), p("other", 1)]),
        n.leave([p("two", 1)]),
        n.end(),
    ]

    testSel(skipOutput, "skip (per-run)", function (tt, skip) {
        return tt.run({skip: skip})
    })

    testSel(skipOutput, "skip (defaults)", function (tt, skip) {
        tt.options = {skip: skip}
        return tt.run()
    })

    testSel(skipOutput, "skip (defaults + per-run)", function (tt, skip) {
        tt.options = {skip: [["two", "inner"]]}
        return tt.run({skip: skip})
    })

    var onlyOutput = [
        n.start(),
        n.enter([p("one", 0)]),
        n.pass([p("one", 0), p("inner", 0)]),
        n.leave([p("one", 0)]),
        n.end(),
    ]

    testSel(onlyOutput, "only (global)", function (tt, only) {
        tt.only = only
        return tt.run()
    })

    testSel(onlyOutput, "only (defaults)", function (tt, only) {
        tt.options = {only: only}
        return tt.run()
    })

    testSel(onlyOutput, "only (per-run)", function (tt, only) {
        return tt.run({only: only})
    })

    testSel(onlyOutput, "only (defaults, per-run)", function (tt, only) {
        tt.options = {only: []}
        return tt.run({only: only})
    })

    testSel(onlyOutput, "only (global, per-run)", function (tt, only) {
        tt.only = only.concat([["two", "inner"]])
        return tt.run({only: only})
    })

    testSel(onlyOutput, "only (global, defaults, per-run)",
        function (tt, only) {
            tt.only = only.concat([["two", "inner"]])
            tt.options = {only: []}
            return tt.run({only: only})
        }
    )
})
