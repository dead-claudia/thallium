'use strict'

require! {
    '../../src/index': {t}
    '../../test-util/base': {n, p, push, a}
}

suite 'core (timeouts)', !->
    test 'succeeds with own', ->
        tt = t.base!
        ret = []

        tt.reporter push ret

        tt.async 'test', (tt, done) !->
            tt.timeout 10
            done!

        tt.run!then !->
            t.deepEqual ret, a do
                n 'start', []
                n 'start', a p 'test', 0
                n 'end', a p 'test', 0
                n 'pass', a p 'test', 0
                n 'end', []
                n 'exit', []

    test 'fails with own', ->
        tt = t.base!
        ret = []

        tt.reporter push ret

        tt.async 'test', (tt, done) !->
            tt.timeout 50
            # It's highly unlikely the engine will take this long to finish.
            setTimeout (!-> done!), 200

        tt.run!then !->
            t.deepEqual ret, a do
                n 'start', []
                n 'start', a p 'test', 0
                n 'end', a p 'test', 0
                n 'fail', (a p 'test', 0), new Error 'Timeout of 50 reached.'
                n 'end', []
                n 'exit', []

    test 'succeeds with inherited', ->
        tt = t.base!
        ret = []

        tt.reporter push ret

        tt.test 'test'
        .timeout 50
        .async 'inner', (tt, done) !-> done!

        tt.run!then !->
            t.deepEqual ret, a do
                n 'start', []
                n 'start', a p 'test', 0
                n 'start', a (p 'test', 0), (p 'inner', 0)
                n 'end', a (p 'test', 0), (p 'inner', 0)
                n 'pass', a (p 'test', 0), (p 'inner', 0)
                n 'end', a p 'test', 0
                n 'pass', a p 'test', 0
                n 'end', []
                n 'exit', []

    test 'fails with inherited', ->
        tt = t.base!
        ret = []

        tt.reporter push ret

        tt.test 'test'
        .timeout 50
        .async 'inner', (tt, done) !->
            # It's highly unlikely the engine will take this long to finish.
            setTimeout (-> done!), 200

        tt.run!then !->
            t.deepEqual ret, a do
                n 'start', []
                n 'start', a p 'test', 0
                n 'start', a (p 'test', 0), (p 'inner', 0)
                n 'end', a (p 'test', 0), (p 'inner', 0)
                n 'fail', (a (p 'test', 0), (p 'inner', 0)),
                    new Error 'Timeout of 50 reached.'
                n 'end', a p 'test', 0
                n 'pass', a p 'test', 0
                n 'end', []
                n 'exit', []

    test 'gets own set timeout', ->
        tt = t.base!
        timeout = void

        tt.test 'test', (tt) !->
            tt.timeout 50
            timeout := tt.timeout!

        tt.run!then -> t.equal timeout, 50

    test 'gets own set timeout', ->
        tt = t.base!
        timeout = void

        tt.test 'test'
        .timeout 50
        .test 'inner', (tt) !-> timeout := tt.timeout!

        tt.run!then -> t.equal timeout, 50

    test 'gets own sync inner timeout', ->
        tt = t.base!

        timeout = tt.test 'test'
        .timeout 50
        .test 'inner' .timeout!

        tt.run!then -> t.equal timeout, 50

    test 'gets default timeout', ->
        tt = t.base!
        timeout = void

        tt.test 'test', (tt) !-> timeout := tt.timeout!

        tt.run!then -> t.equal timeout, 2000
