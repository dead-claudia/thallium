'use strict'

require! {
    'bluebird': Promise
    '../../src/index': {t}
}

suite 'core (basic)', !->
    test 'has `base()`', !->
        t.hasKey t, 'base'
        t.equal t.base!base, t.base

    test 'has `test()`', !->
        tt = t.base!
        t.hasKey tt, 'test'
        t.function tt.test

    test 'has `parent()`', !->
        tt = t.base!
        t.hasKey tt, 'parent'
        t.function tt.parent
        t.equal (tt.test 'test' .parent!), tt
        t.undefined tt.parent!

    test 'can accept a string + function', !->
        tt = t.base!
        tt.test 'test', !->

    test 'can accept a string', !->
        tt = t.base!
        tt.test 'test'

    test 'returns the current instance when given a callback', !->
        tt = t.base!
        test = tt.test 'test', !->
        t.equal test, tt

    test 'returns a prototypal clone when given a callback', !->
        tt = t.base!
        test = tt.test('test')

        t.notEqual test, tt
        t.equal (Object.getPrototypeOf test), tt

    test 'runs block tests within tests', ->
        tt = t.base!
        called = false

        tt.test 'test', ->
            @test 'foo', !-> called := true

        tt.run!then !-> t.true called

    test 'runs successful inline tests within tests', !->
        tt = t.base!
        err = void

        tt.reporter (res, done) ->
            if res.type == 'fail'
                err = res.value
            done!

        tt.test 'test', ->
            @test 'foo' .use !->

        tt.run!then !-> t.notOk err

    test 'accepts a callback with `t.run()`', !->
        tt = t.base!
        err = void

        tt.reporter (res, done) ->
            if res.type == 'fail'
                err = res.value
            done!

        tt.test 'test', ->
            @test 'foo' .use !->

        Promise.fromNode (-> tt.run it) .then -> t.notOk err
