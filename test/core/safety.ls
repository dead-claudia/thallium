'use strict'

require! {
    '../../src/index': {t}
    '../../test-util/base': {p, n, push, a}
}

suite 'core (safety)', !->
    test 'disallows non-nullish non-functions as `test` impls', !->
        tt = t.base!

        t.throws (-> tt.test 'test', 1), TypeError
        t.throws (-> tt.test 'test', 0), TypeError
        t.throws (-> tt.test 'test', true), TypeError
        t.throws (-> tt.test 'test', false), TypeError
        t.throws (-> tt.test 'test', 'hi'), TypeError
        t.throws (-> tt.test 'test', ''), TypeError
        t.throws (-> tt.test 'test', []), TypeError
        t.throws (-> tt.test 'test', [1, 2, 3, 4, 5]), TypeError
        t.throws (-> tt.test 'test', {hello: 'world'}), TypeError
        t.throws (-> tt.test 'test', {}), TypeError
        t.throws (-> tt.test 'test', {valueOf: -> false}), TypeError
        t.throws (-> tt.test 'test', {valueOf: -> void}), TypeError

        tt.test 'test'
        tt.test 'test', void
        tt.test 'test', null
        tt.test 'test', !->
        tt.test 'test', (t) !->
        tt.test 'test', (t, done) !-> # too many arguments
        tt.test 'test', -> next: -> {+done}

    test 'disallows non-functions as `async` impls', !->
        tt = t.base!

        t.throws (-> tt.async 'test', 1), TypeError
        t.throws (-> tt.async 'test', 0), TypeError
        t.throws (-> tt.async 'test', true), TypeError
        t.throws (-> tt.async 'test', false), TypeError
        t.throws (-> tt.async 'test', 'hi'), TypeError
        t.throws (-> tt.async 'test', ''), TypeError
        t.throws (-> tt.async 'test', []), TypeError
        t.throws (-> tt.async 'test', [1, 2, 3, 4, 5]), TypeError
        t.throws (-> tt.async 'test', {hello: 'world'}), TypeError
        t.throws (-> tt.async 'test', {}), TypeError
        t.throws (-> tt.async 'test', {valueOf: -> false}), TypeError
        t.throws (-> tt.async 'test', {valueOf: -> void}), TypeError
        t.throws (-> tt.async 'test'), TypeError
        t.throws (-> tt.async 'test', void), TypeError
        t.throws (-> tt.async 'test', null), TypeError

        tt.async 'test', !->
        tt.async 'test', (t) !->
        tt.async 'test', (t, done) !->
        tt.async 'test', (t, done, wtf) !-> # too many arguments
        tt.async 'test', -> next: -> {+done}

    test 'catches unsafe access', ->
        tt = t.base!
        ret = []

        tt.reporter push ret

        error = new ReferenceError 'It is only safe to call test methods during initialization'

        plugin = !->

        tt.test 'one', -> tt.test 'hi'
        tt.test 'two', -> tt.define 'hi', !->
        tt.define 'assert', -> {+test}
        tt.test 'three', -> tt.assert!
        tt.test 'four', -> tt.use plugin

        tt.test 'five', ->
            @test 'inner', ~> @use plugin

        tt.test 'six', ->
            @test 'inner', ~> @reporter (_, done) -> done!

        tt.test 'seven', -> tt.add 'inner', !->

        tt.test 'eight', ->
            tt.wrap 'test', (func) -> func!

        tt.run!then !->
            t.deepEqual ret, a do
                n 'start', []
                n 'start', a p 'one', 0
                n 'end', a p 'one', 0
                n 'fail', (a p 'one', 0), error
                n 'start', a p 'two', 1
                n 'end', a p 'two', 1
                n 'fail', (a p 'two', 1), error
                n 'start', a p 'three', 2
                n 'end', a p 'three', 2
                n 'fail', (a p 'three', 2), error
                n 'start', a p 'four', 3
                n 'end', a p 'four', 3
                n 'fail', (a p 'four', 3), error
                n 'start', a p 'five', 4
                n 'start', a (p 'five', 4), (p 'inner', 0)
                n 'end', a (p 'five', 4), (p 'inner', 0)
                n 'fail', (a (p 'five', 4), (p 'inner', 0)), error
                n 'end', a p 'five', 4
                n 'pass', a p 'five', 4
                n 'start', a p 'six', 5
                n 'start', a (p 'six', 5), (p 'inner', 0)
                n 'end', a (p 'six', 5), (p 'inner', 0)
                n 'fail', (a (p 'six', 5), (p 'inner', 0)), error
                n 'end', a p 'six', 5
                n 'pass', a p 'six', 5
                n 'start', a p 'seven', 6
                n 'end', a p 'seven', 6
                n 'fail', (a p 'seven', 6), error
                n 'start', a p 'eight', 7
                n 'end', a p 'eight', 7
                n 'fail', (a p 'eight', 7), error
                n 'end', []
                n 'exit', []

    test 'reports extraneous async done', ->
        tt = t.base!
        ret = []

        sentinel = new Error 'sentinel'
        sentinel.marker = !->

        tt.reporter push ret

        tt.test 'test', !->
            @test 'inner', !->
                @async 'fail', (tt, done) !->
                    done!
                    done!
                    done sentinel

        tt.run!then !->
            t.includesDeepAny do
                [4, 5, 6, 7, 8, 9, 10, 11, 12].map (i) ->
                    splice1 = n 'extra',
                        (a (p 'test', 0), (p 'inner', 0), (p 'fail', 0)),
                        {count: 2, value: void}

                    splice2 = n 'extra',
                        (a (p 'test', 0), (p 'inner', 0), (p 'fail', 0)),
                        {count: 3, value: sentinel}

                    node = a do
                        n 'start', []
                        n 'start', a (p 'test', 0)
                        n 'start', a (p 'test', 0), p('inner', 0)
                        n 'start', a (p 'test', 0), p('inner', 0), p('fail', 0)
                        # Extras should first appear here.
                        n 'end', a (p 'test', 0), p('inner', 0), p('fail', 0)
                        n 'pass', a (p 'test', 0), p('inner', 0), p('fail', 0)
                        n 'end', a (p 'test', 0), p('inner', 0)
                        n 'pass', a (p 'test', 0), p('inner', 0)
                        n 'end', a (p 'test', 0)
                        n 'pass', a (p 'test', 0)
                        n 'end', []
                        n 'exit', []
                    node.splice i, 0, splice1, splice2
                    node
                [ret]

    test 'catches concurrent runs', ->
        tt = t.base!
        tt.reporter (_, done) -> done!
        res = tt.run!
        t.throws tt~run, Error
        res

    test 'catches concurrent runs when given a callback', (done) !->
        tt = t.base!
        tt.reporter (_, done) -> done!
        tt.run done
        t.throws tt~run, Error

    test 'allows non-concurrent runs with reporter error', ->
        tt = t.base!
        sentinel = new Error 'fail'

        tt.reporter (_, done) -> done sentinel

        tt.run!then do
            -> t.fail 'Expected a rejection'
            (err) -> t.equal err, sentinel
        .then ->
            tt.run!then do
                -> t.fail 'Expected a rejection'
                (err) -> t.equal err, sentinel
