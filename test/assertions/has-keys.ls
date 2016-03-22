'use strict'

require! {
    '../../src/index': {t}
    '../../test-util/assertions': {fail}
}

suite 'assertions (has keys)', !->
    # It's much easier to find problems when the tests are generated.
    shallow = (name, opts) ->
        run = (succeed, ...args) ->
            | succeed => t[name] ...args
            | otherwise => fail name, ...args

        suite "t.#{name}()", !->
            test 'checks numbers', !->
                run not opts.invert, {1: true, 2: true, 3: false}, 1
                run not opts.invert, {1: true, 2: true, 3: false}, [1]
                run not opts.invert, {1: true, 2: true, 3: false}, {1: true}

            test 'checks strings', !->
                run not opts.invert, {foo: true, bar: false, baz: 1}, 'foo'
                run not opts.invert, {foo: true, bar: false, baz: 1}, ['foo']
                run not opts.invert, {foo: true, bar: false, baz: 1}, {foo: true}

            test 'is strict', !->
                run (opts.invert xor opts.loose), {foo: '1', bar: 2, baz: 3}, {foo: 1}

            test 'checks objects', !->
                obj1 = {}
                obj2 = {}
                obj3 = {}

                run not opts.invert, {obj1, obj3, prop: 3, foo: 'foo'}, {obj1, obj3}
                run not opts.invert, {obj1, obj2, obj3}, {obj1, obj2, obj3}
                run not opts.invert, {obj1, obj2, obj3}, {obj1, obj3}
                run not (opts.invert xor opts.all), {obj1, obj3}, {obj1, obj2, obj3}

                run not (opts.invert xor opts.all),
                    {obj1, prop: 3, obj3, foo: 'foo'},
                    {obj1, obj2, obj3}

            test 'checks nothing', !->
                run true, {foo: {}, bar: {}}, {}

            test 'checks missing keys', !->
                run opts.invert, {foo: 1, bar: 2, baz: 3}, 10
                run opts.invert, {foo: 1, bar: 2, baz: 3}, [10]
                run opts.invert, {foo: 1, bar: 2, baz: 3}, {a: 10}
                run opts.invert, {foo: 1, bar: 2, baz: 3}, {foo: 10}

            test 'checks missing objects', !->
                obj1 = {}
                obj2 = {}
                obj3 = {}

                run opts.invert, {obj1, obj2, a: 3, b: 'foo', c: {}}, {c: {}}
                run opts.invert, {obj1, obj2, obj3}, {a: {}}
                run opts.invert, {obj1, obj2, obj3}, {a: []}
                run (opts.invert xor not opts.all), {obj1, obj2, obj3}, {a: [], obj1}

    shallow 'hasKeys', {+all}
    shallow 'notHasAllKeys', {+all, +invert}
    shallow 'hasAnyKeys', {}
    shallow 'notHasKeys', {+invert}
    shallow 'hasLooseKeys', {+loose, +all}
    shallow 'notHasLooseAllKeys', {+loose, +all, +invert}
    shallow 'hasLooseAnyKeys', {+loose}
    shallow 'notHasLooseKeys', {+loose, +invert}

    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

    deep = (name, opts) ->
        run = (succeed, ...args) ->
            | succeed => t[name] ...args
            | otherwise => fail name, ...args

        suite "t.#{name}()", !->
            test 'checks numbers', !->
                run not opts.invert, {1: true, 2: false, 3: 0}, 1
                run not opts.invert, {1: true, 2: false, 3: 0}, [1]
                run not opts.invert, {1: true, 2: false, 3: 0}, {1: true}

            test 'checks strings', !->
                run not opts.invert, {foo: 1, bar: 2, baz: 3}, 'foo'
                run not opts.invert, {foo: 1, bar: 2, baz: 3}, ['foo']
                run not opts.invert, {foo: 1, bar: 2, baz: 3}, {foo: 1}

            test 'is strict', !->
                run (opts.invert xor opts.loose),
                    {foo: '1', bar: 2, baz: 3},
                    {foo: 1}

            test 'checks objects', !->
                obj1 = {}
                obj2 = {}
                obj3 = {}

                run not opts.invert, {obj1, prop: 3, obj3, foo: 'foo'}, {obj1, obj3}
                run not opts.invert, {obj1, obj2, obj3}, {obj1, obj2, obj3}
                run not opts.invert, {obj1, obj2, obj3}, {obj1, obj3}
                run not (opts.invert xor opts.all), {obj1, obj3}, {obj1, obj2, obj3}

                run not (opts.invert xor opts.all),
                    {obj1, foo: 3, obj3, bar: 'foo'},
                    {obj1, obj2, obj3}

                run not opts.invert, {
                    foo: {foo: 1},
                    bar: {bar: 2},
                    baz: 3,
                    quux: 'foo',
                    spam: {},
                }, {foo: {foo: 1}}

                run not opts.invert, {
                    foo: {foo: 1},
                    bar: {bar: 2},
                    baz: {},
                }, {bar: {bar: 2}, baz: {}}

                run opts.invert, {
                    foo: {foo: 1},
                    bar: {bar: 2},
                    baz: [],
                }, {bar: []}

            test 'checks nothing', !->
                run true, [{}, {}], []

            test 'checks missing numbers', !->
                run opts.invert, {foo: 1, bar: 2, baz: 3}, {foo: 10}

            test 'checks missing objects', !->
                run opts.invert, {
                    foo: {foo: 1},
                    bar: {bar: 2},
                    baz: {},
                }, {quux: []}

                run (opts.invert xor not opts.all), {
                    foo: {foo: 1},
                    bar: {bar: 2},
                    baz: {},
                }, {quux: [], foo: {foo: 1}}

    deep 'hasDeepKeys', {+all}
    deep 'notHasDeepAllKeys', {+invert, +all}
    deep 'hasDeepAnyKeys', {}
    deep 'notHasDeepKeys', {+invert}
    deep 'hasLooseDeepKeys', {+loose, +all}
    deep 'notHasLooseDeepAllKeys', {+loose, +invert, +all}
    deep 'hasLooseDeepAnyKeys', {+loose}
    deep 'notHasLooseDeepKeys', {+loose, +invert}
