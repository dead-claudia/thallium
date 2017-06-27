/* eslint max-nested-callbacks: [2, 5] */

describe("core/selection", function () {
    "use strict"

    var r = Util.report

    describe("skip (dynamic)", function () {
        r.testTree("filters correctly from instance", {
            init: function (tt) {
                tt.test("one", function () {
                    tt.test("inner", function () { tt.skip() })
                    tt.test("other", r.noop)
                })

                tt.test("two", function () {
                    tt.test("inner", r.noop)
                    tt.test("other", r.noop)
                })
            },
            expected: [
                r.suite("one", [
                    r.skip("inner"),
                    r.pass("other"),
                ]),
                r.suite("two", [
                    r.pass("inner"),
                    r.pass("other"),
                ]),
            ],
        })

        r.testTree("filters correctly from reflect", {
            init: function (tt) {
                tt.test("one", function () {
                    tt.test("inner", function () { tt.reflect.skip() })
                    tt.test("other", r.noop)
                })

                tt.test("two", function () {
                    tt.test("inner", r.noop)
                    tt.test("other", r.noop)
                })
            },
            expected: [
                r.suite("one", [
                    r.skip("inner"),
                    r.pass("other"),
                ]),
                r.suite("two", [
                    r.pass("inner"),
                    r.pass("other"),
                ]),
            ],
        })
    })

    function test(name, opts) {
        var init = opts.init

        opts.init = function (tt) {
            tt.test("one", function () {
                tt.test("inner", r.noop)
                tt.test("other", r.noop)
            })

            tt.test("two", function () {
                tt.test("inner", r.noop)
                tt.test("other", r.noop)
            })

            if (init != null) init.call(this, tt)
        }

        describe(name, function () {
            var stringInst = Object.create(opts)
            var regexpInst = Object.create(opts)

            stringInst.selector = [["one", "inner"]]
            regexpInst.selector = [[/^one$/, "inner"]]

            r.testTree("filters correctly with strings", stringInst)
            r.testTree("filters correctly with regexps", regexpInst)
        })
    }

    var skipOutput = [
        r.suite("one", [
            r.skip("inner"),
            r.pass("other"),
        ]),
        r.suite("two", [
            r.pass("inner"),
            r.pass("other"),
        ]),
    ]

    test("skip (per-run)", {
        expected: skipOutput,
        get opts() { return {skip: this.selector} },
    })

    test("skip (defaults)", {
        expected: skipOutput,
        init: function (tt) { tt.options = {skip: this.selector} },
    })

    test("skip (defaults + per-run)", {
        expected: skipOutput,
        get opts() { return {skip: this.selector} },
        init: function (tt) { tt.options = {skip: [["two", "inner"]]} },
    })

    var onlyOutput = [
        r.suite("one", [
            r.pass("inner"),
        ]),
    ]

    test("only (global)", {
        expected: onlyOutput,
        init: function (tt) { tt.only = this.selector },
    })

    test("only (defaults)", {
        expected: onlyOutput,
        init: function (tt) { tt.options = {only: this.selector} },
    })

    test("only (per-run)", {
        expected: onlyOutput,
        get opts() { return {only: this.selector} },
    })

    test("only (defaults, per-run)", {
        expected: onlyOutput,
        get opts() { return {only: this.selector} },
        init: function (tt) { tt.options = {only: []} },
    })

    test("only (global, per-run)", {
        expected: onlyOutput,
        get opts() { return {only: this.selector} },
        init: function (tt) {
            tt.only = this.selector.concat([["two", "inner"]])
        },
    })

    test("only (global, defaults, per-run)", {
        expected: onlyOutput,
        get opts() { return {only: this.selector} },
        init: function (tt) {
            tt.options = {only: []}
            tt.only = this.selector.concat([["two", "inner"]])
        },
    })
})
