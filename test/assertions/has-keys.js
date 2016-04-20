"use strict"

const t = require("../../index.js")
const fail = require("../../test-util/assertions.js").fail

describe("assertions (has keys)", () => {
    it("correct aliases", () => {
        t.equal(t.hasMatchLooseKeys, t.hasDeepLooseKeys)
        t.equal(t.notHasMatchLooseAllKeys, t.notHasDeepLooseAllKeys)
        t.equal(t.hasMatchLooseAnyKeys, t.hasDeepLooseAnyKeys)
        t.equal(t.notHasMatchLooseKeys, t.notHasDeepLooseKeys)
    })

    // It"s much easier to find problems when the tests are generated.
    function shallow(name, opts) {
        function run(succeed) {
            const args = []

            for (let i = 1; i < arguments.length; i++) {
                args.push(arguments[i])
            }

            if (succeed) {
                return t[name].apply(t, args)
            } else {
                return fail.apply(undefined, [name].concat(args))
            }
        }

        describe(`t.${name}()`, () => {
            it("exists", () => {
                t.function(t[name])
            })

            if (opts.keys) {
                it("checks number keys", () => {
                    run(!opts.invert,
                        {1: true, 2: true, 3: false},
                        [1])
                })

                it("checks string keys", () => {
                    run(!opts.invert,
                        {foo: true, bar: false, baz: 1},
                        ["foo"])
                })
            }

            it("checks numbers", () => {
                run(!opts.invert,
                    {1: true, 2: true, 3: false},
                    {1: true})
            })

            it("checks strings", () => {
                run(!opts.invert, {foo: true, bar: false, baz: 1}, {foo: true})
            })

            it("is strict", () => {
                run(opts.invert ^ opts.loose,
                    {foo: "1", bar: 2, baz: 3},
                    {foo: 1})
            })

            it("checks objects", () => {
                const obj1 = {}
                const obj2 = {}
                const obj3 = {}

                run(!opts.invert,
                    {obj1, obj3, prop: 3, foo: "foo"},
                    {obj1, obj3})

                run(!opts.invert, {obj1, obj2, obj3}, {obj1, obj2, obj3})
                run(!opts.invert, {obj1, obj2, obj3}, {obj1, obj3})
                run(!(opts.invert ^ opts.all), {obj1, obj3}, {obj1, obj2, obj3})

                run(!(opts.invert ^ opts.all),
                    {obj1, obj3, prop: 3, foo: "foo"},
                    {obj1, obj2, obj3})
            })

            it("checks nothing", () => {
                run(true, {foo: {}, bar: {}}, {})
            })

            it("checks missing keys", () => {
                if (opts.keys) run(opts.invert, {foo: 1, bar: 2, baz: 3}, [10])
                run(opts.invert, {foo: 1, bar: 2, baz: 3}, {a: 10})
                run(opts.invert, {foo: 1, bar: 2, baz: 3}, {foo: 10})
            })

            it("checks missing objects", () => {
                const obj1 = {}
                const obj2 = {}
                const obj3 = {}

                run(opts.invert, {obj1, obj2, a: 3, b: "foo", c: {}}, {c: {}})
                run(opts.invert, {obj1, obj2, obj3}, {a: {}})
                run(opts.invert, {obj1, obj2, obj3}, {a: []})
                run(opts.invert ^ !opts.all, {obj1, obj2, obj3}, {a: [], obj1})
            })
        })
    }

    shallow("hasKeys", {keys: true, all: true})
    shallow("notHasAllKeys", {keys: true, all: true, invert: true})
    shallow("hasAnyKeys", {keys: true})
    shallow("notHasKeys", {keys: true, invert: true})
    shallow("hasLooseKeys", {loose: true, all: true})
    shallow("notHasLooseAllKeys", {loose: true, all: true, invert: true})
    shallow("hasLooseAnyKeys", {loose: true})
    shallow("notHasLooseKeys", {loose: true, invert: true})

    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

    function deep(name, opts) {
        function run(succeed) {
            const args = []

            for (let i = 1; i < arguments.length; i++) {
                args.push(arguments[i])
            }

            if (succeed) {
                return t[name].apply(t, args)
            } else {
                return fail.apply(undefined, [name].concat(args))
            }
        }

        describe(`t.${name}()`, () => {
            it("exists", () => {
                t.function(t[name])
            })

            it("checks numbers", () => {
                run(!opts.invert, {1: true, 2: false, 3: 0}, {1: true})
            })

            it("checks strings", () => {
                run(!opts.invert, {foo: 1, bar: 2, baz: 3}, {foo: 1})
            })

            it("is strict", () => {
                run(opts.invert ^ opts.loose,
                    {foo: "1", bar: 2, baz: 3},
                    {foo: 1})
            })

            it("checks objects", () => {
                const obj1 = {}
                const obj2 = {}
                const obj3 = {}

                run(!opts.invert,
                    {obj1, obj3, prop: 3, foo: "foo"},
                    {obj1, obj3})

                run(!opts.invert, {obj1, obj2, obj3}, {obj1, obj2, obj3})
                run(!opts.invert, {obj1, obj2, obj3}, {obj1, obj3})
                run(!(opts.invert ^ opts.all), {obj1, obj3}, {obj1, obj2, obj3})

                run(!(opts.invert ^ opts.all),
                    {obj1, obj3, foo: 3, bar: "foo"},
                    {obj1, obj2, obj3})

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

            it("checks nothing", () => {
                run(true, [{}, {}], [])
            })

            it("checks missing numbers", () => {
                run(opts.invert, {foo: 1, bar: 2, baz: 3}, {foo: 10})
            })

            it("checks missing objects", () => {
                run(opts.invert,
                    {foo: {foo: 1}, bar: {bar: 2}, baz: {}},
                    {quux: []})

                run(opts.invert ^ !opts.all,
                    {foo: {foo: 1}, bar: {bar: 2}, baz: {}},
                    {quux: [], foo: {foo: 1}})
            })
        })
    }

    deep("hasDeepKeys", {all: true})
    deep("notHasDeepAllKeys", {invert: true, all: true})
    deep("hasDeepAnyKeys", {})
    deep("notHasDeepKeys", {invert: true})
    deep("hasDeepLooseKeys", {loose: true, all: true})
    deep("notHasDeepLooseAllKeys", {loose: true, invert: true, all: true})
    deep("hasDeepLooseAnyKeys", {loose: true})
    deep("notHasDeepLooseKeys", {loose: true, invert: true})
})
