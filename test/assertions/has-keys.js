"use strict"

describe("assertions (has keys)", function () {
    // It"s much easier to find problems when the tests are generated.
    function shallow(name, opts) {
        function run(succeed) {
            var args = []

            for (var i = 1; i < arguments.length; i++) {
                args.push(arguments[i])
            }

            if (succeed) {
                return t[name].apply(t, args)
            } else {
                return Util.fail.apply(undefined, [name].concat(args))
            }
        }

        describe("t." + name + "()", function () {
            it("exists", function () {
                t.function(t[name])
            })

            if (opts.keys) {
                it("checks number keys", function () {
                    run(!opts.invert,
                        {1: true, 2: true, 3: false},
                        [1])
                })

                it("checks string keys", function () {
                    run(!opts.invert,
                        {foo: true, bar: false, baz: 1},
                        ["foo"])
                })
            }

            it("checks numbers", function () {
                run(!opts.invert,
                    {1: true, 2: true, 3: false},
                    {1: true})
            })

            it("checks strings", function () {
                run(!opts.invert, {foo: true, bar: false, baz: 1}, {foo: true})
            })

            it("is strict", function () {
                run(opts.invert,
                    {foo: "1", bar: 2, baz: 3},
                    {foo: 1})
            })

            it("checks objects", function () {
                var obj1 = {}
                var obj2 = {}
                var obj3 = {}

                run(!opts.invert,
                    {obj1: obj1, obj3: obj3, prop: 3, foo: "foo"},
                    {obj1: obj1, obj3: obj3})

                run(!opts.invert,
                    {obj1: obj1, obj2: obj2, obj3: obj3},
                    {obj1: obj1, obj2: obj2, obj3: obj3})

                run(!opts.invert,
                    {obj1: obj1, obj2: obj2, obj3: obj3},
                    {obj1: obj1, obj3: obj3})

                run(!(opts.invert ^ opts.all),
                    {obj1: obj1, obj3: obj3},
                    {obj1: obj1, obj2: obj2, obj3: obj3})

                run(!(opts.invert ^ opts.all),
                    {obj1: obj1, obj3: obj3, prop: 3, foo: "foo"},
                    {obj1: obj1, obj2: obj2, obj3: obj3})
            })

            it("checks nothing", function () {
                run(true, {foo: {}, bar: {}}, {})
            })

            it("checks missing keys", function () {
                if (opts.keys) run(opts.invert, {foo: 1, bar: 2, baz: 3}, [10])
                run(opts.invert, {foo: 1, bar: 2, baz: 3}, {a: 10})
                run(opts.invert, {foo: 1, bar: 2, baz: 3}, {foo: 10})
            })

            it("checks missing objects", function () {
                var obj1 = {}
                var obj2 = {}
                var obj3 = {}

                run(opts.invert,
                    {obj1: obj1, obj2: obj2, a: 3, b: "foo", c: {}},
                    {c: {}})

                run(opts.invert, {obj1: obj1, obj2: obj2, obj3: obj3}, {a: {}})

                run(opts.invert, {obj1: obj1, obj2: obj2, obj3: obj3}, {a: []})

                run(opts.invert ^ !opts.all,
                    {obj1: obj1, obj2: obj2, obj3: obj3},
                    {a: [], obj1: obj1})
            })
        })
    }

    shallow("hasKeys", {keys: true, all: true})
    shallow("notHasAllKeys", {keys: true, all: true, invert: true})
    shallow("hasAnyKeys", {keys: true})
    shallow("notHasKeys", {keys: true, invert: true})

    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

    function deep(name, opts) {
        function run(succeed) {
            var args = []

            for (var i = 1; i < arguments.length; i++) {
                args.push(arguments[i])
            }

            if (succeed) {
                return t[name].apply(t, args)
            } else {
                return Util.fail.apply(undefined, [name].concat(args))
            }
        }

        describe("t." + name + "()", function () {
            it("exists", function () {
                t.function(t[name])
            })

            it("checks numbers", function () {
                run(!opts.invert, {1: true, 2: false, 3: 0}, {1: true})
            })

            it("checks strings", function () {
                run(!opts.invert, {foo: 1, bar: 2, baz: 3}, {foo: 1})
            })

            it("is strict", function () {
                run(opts.invert,
                    {foo: "1", bar: 2, baz: 3},
                    {foo: 1})
            })

            it("checks objects", function () {
                var obj1 = {}
                var obj2 = {}
                var obj3 = {}

                run(!opts.invert,
                    {obj1: obj1, obj3: obj3, prop: 3, foo: "foo"},
                    {obj1: obj1, obj3: obj3})

                run(!opts.invert,
                    {obj1: obj1, obj2: obj2, obj3: obj3},
                    {obj1: obj1, obj2: obj2, obj3: obj3})

                run(!opts.invert,
                    {obj1: obj1, obj2: obj2, obj3: obj3},
                    {obj1: obj1, obj3: obj3})

                run(!(opts.invert ^ opts.all),
                    {obj1: obj1, obj3: obj3},
                    {obj1: obj1, obj2: obj2, obj3: obj3})

                run(!(opts.invert ^ opts.all),
                    {obj1: obj1, obj3: obj3, foo: 3, bar: "foo"},
                    {obj1: obj1, obj2: obj2, obj3: obj3})

                run(!opts.invert,
                    {foo: {foo: 1}, bar: {foo: 2}, baz: 3, quux: {}},
                    {foo: {foo: 1}})

                run(!opts.invert,
                    {foo: {foo: 1}, bar: {bar: 2}, baz: {}},
                    {bar: {bar: 2}, baz: {}})

                run(opts.invert,
                    {foo: {foo: 1}, bar: {bar: 2}, baz: []},
                    {bar: []})
            })

            it("checks nothing", function () {
                run(true, [{}, {}], [])
            })

            it("checks missing numbers", function () {
                run(opts.invert, {foo: 1, bar: 2, baz: 3}, {foo: 10})
            })

            it("checks missing objects", function () {
                run(opts.invert,
                    {foo: {foo: 1}, bar: {bar: 2}, baz: {}},
                    {quux: []})

                run(opts.invert ^ !opts.all,
                    {foo: {foo: 1}, bar: {bar: 2}, baz: {}},
                    {quux: [], foo: {foo: 1}})
            })

            it("checks structurally", function () {
                function A() { this.foo = 1 }
                function B() { this.foo = 1 }

                run(opts.invert ^ opts.match, [new A()], [new B()])
            })
        })
    }

    deep("hasDeepKeys", {all: true})
    deep("notHasDeepAllKeys", {invert: true, all: true})
    deep("hasDeepAnyKeys", {})
    deep("notHasDeepKeys", {invert: true})
    deep("hasMatchKeys", {match: true, all: true})
    deep("notHasMatchAllKeys", {match: true, invert: true, all: true})
    deep("hasMatchAnyKeys", {match: true})
    deep("notHasMatchKeys", {match: true, invert: true})
})
