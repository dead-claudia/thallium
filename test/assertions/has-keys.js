"use strict"

var t = require("../../index.js")
var fail = require("../../test-util/assertions.js").fail

suite("assertions (has keys)", function () {
    // It's much easier to find problems when the tests are generated.
    function shallow(name, opts) {
        function run(succeed) {
            var args = []

            if (!succeed) args.push(name)

            for (var i = 1; i < arguments.length; i++) {
                args.push(arguments[i])
            }

            if (succeed) {
                return t[name].apply(t, args)
            } else {
                return fail.apply(null, args)
            }
        }

        suite("t." + name + "()", function () {
            test("checks numbers", function () {
                run(!opts.invert, {1: true, 2: true, 3: false}, 1)
                run(!opts.invert, {1: true, 2: true, 3: false}, [1])
                run(!opts.invert, {1: true, 2: true, 3: false}, {1: true})
            })

            test("checks strings", function () {
                run(!opts.invert, {foo: true, bar: false, baz: 1}, "foo")
                run(!opts.invert, {foo: true, bar: false, baz: 1}, ["foo"])
                run(!opts.invert, {foo: true, bar: false, baz: 1}, {foo: true})
            })

            test("is strict", function () {
                run(opts.invert ^ opts.loose,
                    {foo: "1", bar: 2, baz: 3},
                    {foo: 1})
            })

            test("checks objects", function () {
                var obj1 = {}
                var obj2 = {}
                var obj3 = {}

                run(!opts.invert, {
                    obj1: obj1,
                    prop: 3,
                    obj3: obj3,
                    foo: "foo",
                }, {
                    obj1: obj1,
                    obj3: obj3,
                })

                run(!opts.invert, {
                    obj1: obj1,
                    obj2: obj2,
                    obj3: obj3,
                }, {
                    obj1: obj1,
                    obj2: obj2,
                    obj3: obj3,
                })

                run(!opts.invert, {
                    obj1: obj1,
                    obj2: obj2,
                    obj3: obj3,
                }, {
                    obj1: obj1,
                    obj3: obj3,
                })

                run(!opts.invert ^ opts.all, {
                    obj1: obj1,
                    obj3: obj3,
                }, {
                    obj1: obj1,
                    obj2: obj2,
                    obj3: obj3,
                })

                run(!opts.invert, {
                    obj1: obj1,
                    prop: 3,
                    obj3: obj3,
                    foo: "foo",
                }, {
                    obj1: obj1,
                    obj3: obj3,
                })

                run(!opts.invert ^ opts.all,
                    {obj1: obj1, prop: 3, obj3: obj3, foo: "foo"},
                    {obj1: obj1, obj2: obj2, obj3: obj3})
            })

            test("checks nothing", function () {
                run(true, {foo: {}, bar: {}}, {})
            })

            test("checks missing keys", function () {
                run(opts.invert,
                    {foo: 1, bar: 2, baz: 3, quux: 4, spam: 5},
                    10)

                run(opts.invert,
                    {foo: 1, bar: 2, baz: 3, quux: 4, spam: 5},
                    [10])

                run(opts.invert,
                    {foo: 1, bar: 2, baz: 3, quux: 4, spam: 5},
                    {a: 10})

                run(opts.invert,
                    {foo: 1, bar: 2, baz: 3, quux: 4},
                    {foo: 10})
            })

            test("checks missing objects", function () {
                var obj1 = {}
                var obj2 = {}
                var obj3 = {}

                run(opts.invert, {
                    obj1: obj1,
                    obj2: obj2,
                    a: 3, b: "foo", c: {},
                }, {c: {}})

                run(opts.invert, {
                    obj1: obj1,
                    obj2: obj2,
                    obj3: obj3,
                }, {a: {}})

                run(opts.invert, {
                    obj1: obj1,
                    obj2: obj2,
                    obj3: obj3,
                }, {a: []})

                run(opts.invert ^ !opts.all, {
                    obj1: obj1,
                    obj2: obj2,
                    obj3: obj3,
                }, {a: [], obj1: obj1})
            })
        })
    }

    shallow("hasKeys", {all: true})
    shallow("notHasAllKeys", {all: true, invert: true})
    shallow("hasAnyKeys", {})
    shallow("notHasKeys", {invert: true})
    shallow("hasLooseKeys", {loose: true, all: true})
    shallow("notHasLooseAllKeys", {loose: true, all: true, invert: true})
    shallow("hasLooseAnyKeys", {loose: true})
    shallow("notHasLooseKeys", {loose: true, invert: true})

    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

    function deep(name, opts) {
        function run(succeed) {
            var args = []

            if (!succeed) args.push(name)

            for (var i = 1; i < arguments.length; i++) {
                args.push(arguments[i])
            }

            if (succeed) {
                return t[name].apply(t, args)
            } else {
                return fail.apply(null, args)
            }
        }

        suite("t." + name + "()", function () {
            test("checks numbers", function () {
                run(!opts.invert, {1: true, 2: false, 3: 0}, 1)
                run(!opts.invert, {1: true, 2: false, 3: 0}, [1])
                run(!opts.invert, {1: true, 2: false, 3: 0}, {1: true})
            })

            test("checks strings", function () {
                run(!opts.invert, {foo: 1, bar: 2, baz: 3}, "foo")
                run(!opts.invert, {foo: 1, bar: 2, baz: 3}, ["foo"])
                run(!opts.invert, {foo: 1, bar: 2, baz: 3}, {foo: 1})
            })

            test("is strict", function () {
                run(opts.invert ^ opts.loose,
                    {foo: "1", bar: 2, baz: 3},
                    {foo: 1})
            })

            test("checks objects", function () {
                var obj1 = {}
                var obj2 = {}
                var obj3 = {}

                run(!opts.invert,
                    {obj1: obj1, prop: 3, obj3: obj3, foo: "foo"},
                    {obj1: obj1, obj3: obj3})

                run(!opts.invert, {
                    obj1: obj1,
                    obj2: obj2,
                    obj3: obj3,
                }, {
                    obj1: obj1,
                    obj2: obj2,
                    obj3: obj3,
                })

                run(!opts.invert, {
                    obj1: obj1,
                    obj2: obj2,
                    obj3: obj3,
                }, {
                    obj1: obj1,
                    obj3: obj3,
                })

                run(!opts.invert ^ opts.all, {
                    obj1: obj1,
                    obj3: obj3,
                }, {
                    obj1: obj1,
                    obj2: obj2,
                    obj3: obj3,
                })

                run(!opts.invert,
                    {obj1: obj1, foo: 3, obj3: obj3, bar: "foo"},
                    {obj1: obj1, obj3: obj3})

                run(!opts.invert ^ opts.all,
                    {obj1: obj1, foo: 3, obj3: obj3, bar: "foo"},
                    {obj1: obj1, obj2: obj2, obj3: obj3})

                run(!opts.invert, {
                    foo: {foo: 1},
                    bar: {bar: 2},
                    baz: 3,
                    quux: "foo",
                    spam: {},
                }, {foo: {foo: 1}})

                run(!opts.invert, {
                    foo: {foo: 1},
                    bar: {bar: 2},
                    baz: {},
                }, {bar: {bar: 2}, baz: {}})

                run(opts.invert, {
                    foo: {foo: 1},
                    bar: {bar: 2},
                    baz: [],
                }, {bar: []})
            })

            test("checks nothing", function () {
                run(true, [{}, {}], [])
            })

            test("checks missing numbers", function () {
                run(opts.invert, {
                    foo: 1,
                    bar: 2,
                    baz: 3,
                }, {foo: 10})
            })

            test("checks missing objects", function () {
                run(opts.invert, {
                    foo: {foo: 1},
                    bar: {bar: 2},
                    baz: {},
                }, {quux: []})

                run(opts.invert ^ !opts.all, {
                    foo: {foo: 1},
                    bar: {bar: 2},
                    baz: {},
                }, {quux: [], foo: {foo: 1}})
            })
        })
    }

    deep("hasDeepKeys", {all: true})
    deep("notHasDeepAllKeys", {invert: true, all: true})
    deep("hasDeepAnyKeys", {})
    deep("notHasDeepKeys", {invert: true})
    deep("hasLooseDeepKeys", {loose: true, all: true})
    deep("notHasLooseDeepAllKeys", {loose: true, invert: true, all: true})
    deep("hasLooseDeepAnyKeys", {loose: true})
    deep("notHasLooseDeepKeys", {loose: true, invert: true})
})
