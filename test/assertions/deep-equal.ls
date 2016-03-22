'use strict'

require! {
    '../../src/index': {t}
}

suite 'assertions (deep equal)', !->
    test 'equal', !->
        t.looseDeepEqual do
            {a: [2, 3], b: [4]}
            {a: [2, 3], b: [4]}

    test 'not equal', !->
        t.notLooseDeepEqual do
            {x: 5, y: [6]}
            {x: 5, y: 6}

    test 'nested nulls', !->
        t.looseDeepEqual do
            [null, null, null]
            [null, null, null]

    test 'strict equal', !->
        t.notDeepEqual do
            [{a: 3}, {b: 4}]
            [{a: '3'}, {b: '4'}]

    test 'non-objects', !->
        t.looseDeepEqual 3, 3
        t.looseDeepEqual 'beep', 'beep'
        t.looseDeepEqual '3', 3
        t.notDeepEqual '3', 3
        t.notLooseDeepEqual '3', [3]

    test 'arguments class', !->
        t.looseDeepEqual do
            (-> &) 1, 2, 3
            (-> &) 1, 2, 3

        t.notLooseDeepEqual do
            (-> &) 1, 2, 3
            [1, 2, 3]

    test 'dates', !->
        t.looseDeepEqual do
            new Date 1387585278000
            new Date 'Fri Dec 20 2013 16:21:18 GMT-0800 (PST)'

    if typeof Buffer == 'function'
        test 'buffers', !->
            t.looseDeepEqual do
                new Buffer 'xyz'
                new Buffer 'xyz'

    test 'booleans and arrays', !->
        t.notLooseDeepEqual true, []

    test 'null == void', !->
        t.looseDeepEqual null, void
        t.looseDeepEqual void, null

        t.notDeepEqual null, void
        t.notDeepEqual void, null

    test 'prototypes', !->
        class A
        class B

        t.looseDeepEqual new A, new A
        t.looseDeepEqual new A, new B

        t.looseDeepEqual new A, new A
        t.notDeepEqual new A, new B

    test 'one is object', !->
        t.notLooseDeepEqual 'foo', {bar: 1}
        t.notLooseDeepEqual {foo: 1}, 'bar'

        t.notDeepEqual 'foo', {bar: 1}
        t.notDeepEqual {foo: 1}, 'bar'

    test 'both are strings', !->
        t.looseDeepEqual 'foo', 'foo'
        t.notLooseDeepEqual 'foo', 'bar'

        t.deepEqual 'foo', 'foo'
        t.notDeepEqual 'foo', 'bar'

    test 'differing keys', !->
        t.notDeepEqual {a: 1, b: 2}, {b: 1, c: 2}
        t.notLooseDeepEqual {a: 1, b: 2}, {b: 1, c: 2}

    if typeof Symbol == 'function'
        test 'both are symbols', !->
            t.looseDeepEqual do
                Symbol 'foo'
                Symbol 'foo'
            t.notLooseDeepEqual do
                Symbol 'foo'
                Symbol 'bar'

            t.notDeepEqual do
                Symbol 'foo'
                Symbol 'foo'
            t.notDeepEqual do
                Symbol 'foo'
                Symbol 'bar'
