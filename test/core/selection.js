/* eslint max-nested-callbacks: [2, 5] */

describe("core/selection", function () {
    "use strict"

    var p = Util.p
    var n = Util.n

    describe("skip", function () {
        it("filters correctly", function () {
            var tt = Util.create()
            var ret = []

            tt.reporter(Util.push, ret)

            tt.test("one", function () {
                tt.testSkip("inner", function () { assert.fail("fail") })
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

    describe("only", function () {
        it("filters correctly with strings", function () {
            var tt = Util.create()
            var ret = []

            tt.reporter(Util.push, ret)
            tt.only(["one", "inner"])

            tt.test("one", function () {
                tt.test("inner", function () {})
                tt.test("other", function () { assert.fail("fail") })
            })

            tt.test("two", function () {
                tt.test("inner", function () { assert.fail("fail") })
                tt.test("other", function () { assert.fail("fail") })
            })

            return tt.run().then(function () {
                assert.match(ret, [
                    n.start(),
                    n.enter([p("one", 0)]),
                    n.pass([p("one", 0), p("inner", 0)]),
                    n.leave([p("one", 0)]),
                    n.end(),
                ])
            })
        })

        it("filters correctly with regexps", function () {
            var tt = Util.create()
            var ret = []

            tt.reporter(Util.push, ret)
            tt.only([/^one$/, "inner"])

            tt.test("one", function () {
                tt.test("inner", function () {})
                tt.test("other", function () { assert.fail("fail") })
            })

            tt.test("two", function () {
                tt.test("inner", function () { assert.fail("fail") })
                tt.test("other", function () { assert.fail("fail") })
            })

            return tt.run().then(function () {
                assert.match(ret, [
                    n.start(),
                    n.enter([p("one", 0)]),
                    n.pass([p("one", 0), p("inner", 0)]),
                    n.leave([p("one", 0)]),
                    n.end(),
                ])
            })
        })
    })
})
