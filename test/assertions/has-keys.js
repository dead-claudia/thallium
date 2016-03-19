import t from "../../src/index.js"
import {fail} from "../../test-util/assertions.js"

suite("assertions (has keys)", () => {
    // It's much easier to find problems when the tests are generated.
    function shallow(name, opts) {
        const run = (succeed, ...args) =>
            succeed
                ? t[name](...args)
                : fail(name, ...args)

        suite(`t.${name}()`, () => {
            test("checks numbers", () => {
                run(!opts.invert, {1: true, 2: true, 3: false}, 1)
                run(!opts.invert, {1: true, 2: true, 3: false}, [1])
                run(!opts.invert, {1: true, 2: true, 3: false}, {1: true})
            })

            test("checks strings", () => {
                run(!opts.invert, {foo: true, bar: false, baz: 1}, "foo")
                run(!opts.invert, {foo: true, bar: false, baz: 1}, ["foo"])
                run(!opts.invert, {foo: true, bar: false, baz: 1}, {foo: true})
            })

            test("is strict", () => {
                run(opts.invert ^ opts.loose,
                    {foo: "1", bar: 2, baz: 3},
                    {foo: 1})
            })

            test("checks objects", () => {
                const obj1 = {}
                const obj2 = {}
                const obj3 = {}

                run(!opts.invert, {
                    obj1, obj3,
                    prop: 3,
                    foo: "foo",
                }, {obj1, obj3})

                run(!opts.invert, {obj1, obj2, obj3}, {obj1, obj2, obj3})
                run(!opts.invert, {obj1, obj2, obj3}, {obj1, obj3})
                run(!opts.invert ^ opts.all, {obj1, obj3}, {obj1, obj2, obj3})

                run(!opts.invert ^ opts.all,
                    {obj1, prop: 3, obj3, foo: "foo"},
                    {obj1, obj2, obj3})
            })

            test("checks nothing", () => {
                run(true, {foo: {}, bar: {}}, {})
            })

            test("checks missing keys", () => {
                run(opts.invert, {foo: 1, bar: 2, baz: 3}, 10)
                run(opts.invert, {foo: 1, bar: 2, baz: 3}, [10])
                run(opts.invert, {foo: 1, bar: 2, baz: 3}, {a: 10})
                run(opts.invert, {foo: 1, bar: 2, baz: 3}, {foo: 10})
            })

            test("checks missing objects", () => {
                const obj1 = {}
                const obj2 = {}
                const obj3 = {}

                run(opts.invert, {
                    obj1, obj2,
                    a: 3, b: "foo", c: {},
                }, {c: {}})

                run(opts.invert, {obj1, obj2, obj3}, {a: {}})
                run(opts.invert, {obj1, obj2, obj3}, {a: []})
                run(opts.invert ^ !opts.all, {obj1, obj2, obj3}, {a: [], obj1})
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
        const run = (succeed, ...args) =>
            succeed
                ? t[name](...args)
                : fail(name, ...args)

        suite(`t.${name}()`, () => {
            test("checks numbers", () => {
                run(!opts.invert, {1: true, 2: false, 3: 0}, 1)
                run(!opts.invert, {1: true, 2: false, 3: 0}, [1])
                run(!opts.invert, {1: true, 2: false, 3: 0}, {1: true})
            })

            test("checks strings", () => {
                run(!opts.invert, {foo: 1, bar: 2, baz: 3}, "foo")
                run(!opts.invert, {foo: 1, bar: 2, baz: 3}, ["foo"])
                run(!opts.invert, {foo: 1, bar: 2, baz: 3}, {foo: 1})
            })

            test("is strict", () => {
                run(opts.invert ^ opts.loose,
                    {foo: "1", bar: 2, baz: 3},
                    {foo: 1})
            })

            test("checks objects", () => {
                const obj1 = {}
                const obj2 = {}
                const obj3 = {}

                run(!opts.invert,
                    {obj1, prop: 3, obj3, foo: "foo"},
                    {obj1, obj3})

                run(!opts.invert, {obj1, obj2, obj3}, {obj1, obj2, obj3})
                run(!opts.invert, {obj1, obj2, obj3}, {obj1, obj3})
                run(!opts.invert ^ opts.all, {obj1, obj3}, {obj1, obj2, obj3})

                run(!opts.invert ^ opts.all,
                    {obj1, foo: 3, obj3, bar: "foo"},
                    {obj1, obj2, obj3})

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

            test("checks nothing", () => {
                run(true, [{}, {}], [])
            })

            test("checks missing numbers", () => {
                run(opts.invert, {foo: 1, bar: 2, baz: 3}, {foo: 10})
            })

            test("checks missing objects", () => {
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
