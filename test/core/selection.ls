'use strict'

require! {
    '../../src/index': {t}
    '../../test-util/base': {p, n, push, a}
}

suite 'core (selection)', !->
    fail = -> @define 'fail', -> {-test, message: 'fail'}

    test 'skips tests with callbacks', ->
        tt = t.base!use fail
        ret = []

        tt.reporter push ret

        tt.test 'one', ->
            @testSkip 'inner', (.fail!)
            @test 'other'

        tt.test 'two', ->
            @test 'inner'
            @test 'other'

        tt.run!then !->
            t.deepEqual ret, a do
                n 'start', []
                n 'start', a p 'one', 0
                n 'pending', a (p 'one', 0), (p 'inner', 0)
                n 'start', a (p 'one', 0), (p 'other', 1)
                n 'end', a (p 'one', 0), (p 'other', 1)
                n 'pass', a (p 'one', 0), (p 'other', 1)
                n 'end', a p 'one', 0
                n 'pass', a p 'one', 0
                n 'start', a p 'two', 1
                n 'start', a (p 'two', 1), (p 'inner', 0)
                n 'end', a (p 'two', 1), (p 'inner', 0)
                n 'pass', a (p 'two', 1), (p 'inner', 0)
                n 'start', a (p 'two', 1), (p 'other', 1)
                n 'end', a (p 'two', 1), (p 'other', 1)
                n 'pass', a (p 'two', 1), (p 'other', 1)
                n 'end', a p 'two', 1
                n 'pass', a p 'two', 1
                n 'end', []
                n 'exit', []

    test 'skips tests without callbacks', ->
        tt = t.base!use fail
        ret = []

        tt.reporter push ret

        tt.test 'one', ->
            @testSkip 'inner' .fail!
            @test 'other'

        tt.test 'two', ->
            @test 'inner'
            @test 'other'

        tt.run!then !->
            t.deepEqual ret, a do
                n 'start', []
                n 'start', a p 'one', 0
                n 'pending', a (p 'one', 0), (p 'inner', 0)
                n 'start', a (p 'one', 0), (p 'other', 1)
                n 'end', a (p 'one', 0), (p 'other', 1)
                n 'pass', a (p 'one', 0), (p 'other', 1)
                n 'end', a p 'one', 0
                n 'pass', a p 'one', 0
                n 'start', a p 'two', 1
                n 'start', a (p 'two', 1), (p 'inner', 0)
                n 'end', a (p 'two', 1), (p 'inner', 0)
                n 'pass', a (p 'two', 1), (p 'inner', 0)
                n 'start', a (p 'two', 1), (p 'other', 1)
                n 'end', a (p 'two', 1), (p 'other', 1)
                n 'pass', a (p 'two', 1), (p 'other', 1)
                n 'end', a p 'two', 1
                n 'pass', a p 'two', 1
                n 'end', []
                n 'exit', []

    test 'skips async tests', ->
        tt = t.base!use fail
        ret = []

        tt.reporter push ret

        tt.test 'one', ->
            @asyncSkip 'inner', (.fail!)
            @test 'other'

        tt.test 'two', ->
            @test 'inner'
            @test 'other'

        tt.run!then !->
            t.deepEqual ret, a do
                n 'start', []
                n 'start', a p 'one', 0
                n 'pending', a (p 'one', 0), (p 'inner', 0)
                n 'start', a (p 'one', 0), (p 'other', 1)
                n 'end', a (p 'one', 0), (p 'other', 1)
                n 'pass', a (p 'one', 0), (p 'other', 1)
                n 'end', a p 'one', 0
                n 'pass', a p 'one', 0
                n 'start', a p 'two', 1
                n 'start', a (p 'two', 1), (p 'inner', 0)
                n 'end', a (p 'two', 1), (p 'inner', 0)
                n 'pass', a (p 'two', 1), (p 'inner', 0)
                n 'start', a (p 'two', 1), (p 'other', 1)
                n 'end', a (p 'two', 1), (p 'other', 1)
                n 'pass', a (p 'two', 1), (p 'other', 1)
                n 'end', a p 'two', 1
                n 'pass', a p 'two', 1
                n 'end', []
                n 'exit', []

    test 'skips inline tests run directly', ->
        ret = []
        tt = t.base!reporter push ret
        ttt = tt.testSkip 'test'

        ttt.run!then !->
            t.deepEqual ret, a do
                n 'pending', a p 'test', 0
                n 'exit', a p 'test', 0

    test 'only tests with callbacks', ->
        tt = t.base!use fail
        ret = []

        tt.reporter push ret
        tt.only <[one inner]>

        tt.test 'one', ->
            @test 'inner', !->
            @test 'other', (.fail!)

        tt.test 'two', ->
            @test 'inner', (.fail!)
            @test 'other', (.fail!)

        tt.run!then !->
            t.deepEqual ret, a do
                n 'start', []
                n 'start', a p 'one', 0
                n 'start', a (p 'one', 0), (p 'inner', 0)
                n 'end', a (p 'one', 0), (p 'inner', 0)
                n 'pass', a (p 'one', 0), (p 'inner', 0)
                n 'end', a p 'one', 0
                n 'pass', a p 'one', 0
                n 'end', []
                n 'exit', []

    test 'only tests without callbacks', ->
        tt = t.base!use fail
        ret = []

        tt.reporter push ret
        tt.only <[one inner]>

        tt.test 'one', ->
            @test 'inner'
            @test 'other' .fail!

        tt.test 'two', ->
            @test 'inner' .fail!
            @test 'other' .fail!

        tt.run!then !->
            t.deepEqual ret, a do
                n 'start', []
                n 'start', a p 'one', 0
                n 'start', a (p 'one', 0), (p 'inner', 0)
                n 'end', a (p 'one', 0), (p 'inner', 0)
                n 'pass', a (p 'one', 0), (p 'inner', 0)
                n 'end', a p 'one', 0
                n 'pass', a p 'one', 0
                n 'end', []
                n 'exit', []

    test 'only async tests', ->
        tt = t.base!use fail
        ret = []

        tt.reporter push ret
        tt.only <[one inner]>

        tt.test 'one', ->
            @async 'inner', (_, done) -> done!
            @async 'other', (.fail!)

        tt.test 'two', ->
            @async 'inner', (.fail!)
            @async 'other', (.fail!)

        tt.run!then !->
            t.deepEqual ret, a do
                n 'start', []
                n 'start', a p 'one', 0
                n 'start', a (p 'one', 0), (p 'inner', 0)
                n 'end', a (p 'one', 0), (p 'inner', 0)
                n 'pass', a (p 'one', 0), (p 'inner', 0)
                n 'end', a p 'one', 0
                n 'pass', a p 'one', 0
                n 'end', []
                n 'exit', []

    test 'only tests as index with callbacks', ->
        tt = t.base!use fail
        ret = []

        tt.reporter push ret
        tt.only <[one inner]>

        tt.test '0', ->
            @test 'inner', !->
            @test 'other' .fail!

        tt.test '1', ->
            @test 'inner' .fail!
            @test 'other' .fail!

        tt.run!then !->
            t.deepEqual ret, a do
                n 'start', []
                n 'end', []
                n 'exit', []

    test 'only tests as index index without callbacks', ->
        tt = t.base!use fail
        ret = []

        tt.reporter push ret
        tt.only <[one inner]>

        tt.test '0', ->
            @test 'inner'
            @test 'other' .fail!

        tt.test '1', ->
            @test 'inner' .fail!
            @test 'other' .fail!

        tt.run!then !->
            t.deepEqual ret, a do
                n 'start', []
                n 'end', []
                n 'exit', []

    test 'only async tests as index', ->
        tt = t.base!use fail
        ret = []

        tt.reporter push ret
        tt.only <[one inner]>

        tt.test '0', ->
            @async 'inner', (_, done) -> done!
            @async 'other', (.fail!)

        tt.test '1', ->
            @async 'inner', (.fail!)
            @async 'other', (.fail!)

        tt.run!then !->
            t.deepEqual ret, a do
                n 'start', []
                n 'end', []
                n 'exit', []

    test 'only against regexp', ->
        tt = t.base!use fail
        ret = []

        tt.reporter push ret
        tt.only([/^one$/, 'inner'])

        tt.test 'one', ->
            @test 'inner', !->
            @test 'other', (.fail!)

        tt.test 'two', ->
            @test 'inner', (.fail!)
            @test 'other', (.fail!)

        tt.run!then !->
            t.deepEqual ret, a do
                n 'start', []
                n 'start', a p 'one', 0
                n 'start', a (p 'one', 0), (p 'inner', 0)
                n 'end', a (p 'one', 0), (p 'inner', 0)
                n 'pass', a (p 'one', 0), (p 'inner', 0)
                n 'end', a p 'one', 0
                n 'pass', a p 'one', 0
                n 'end', []
                n 'exit', []
