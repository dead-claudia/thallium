'use strict'

require! {
    '../../src/index': {t}
    '../../test-util/base': {n, p, push, a}
}

suite 'core (asynchronous behavior)', !->
    test 'with normal tests', ->
        tt = t.base!
        called = false

        tt.test 'test', -> called := true

        ret = tt.run!then -> t.true called
        t.false called
        ret

    test 'with shorthand tests', ->
        tt = t.base!
        called = false

        tt.define 'assert', ->
            called := true
            {-test, message: 'should never happen'}

        tt.test 'test' .assert!

        ret = tt.run!then -> t.true called
        t.false called
        ret

    test 'with async tests + sync done call', ->
        tt = t.base!
        called = false

        tt.async 'test', (_, done) !->
            called := true
            done!

        ret = tt.run!then -> t.true called
        t.false called
        ret

    test 'with async tests + async done call', ->
        tt = t.base!
        called = false

        tt.async 'test', (_, done) !->
            called := true
            setTimeout (-> done!), 0

        ret = tt.run!then -> t.true called
        t.false called
        ret

    test 'with async tests + duplicate thenable resolution', ->
        tt = t.base!
        called = false

        tt.async 'test', ->
            called := true
            then: (resolve) ->
                resolve!
                resolve!
                resolve!

        ret = tt.run!then -> t.true called
        t.false called
        ret

    test 'with async tests + duplicate thenable rejection', ->
        tt = t.base!
        called = false
        ret = []
        sentinel = new Error 'sentinel'
        sentinel.marker = !->

        tt.reporter push ret

        tt.async 'test', ->
            called := true
            then: (_, reject) ->
                reject sentinel
                reject!
                reject!

        result = tt.run!then !->
            t.deepEqual ret, a do
                n 'start', []
                n 'start', a p 'test', 0
                n 'end', a p 'test', 0
                n 'fail', (a p 'test', 0), sentinel
                n 'end', []
                n 'exit', []

        t.false called
        return result

    test 'with async tests + mixed thenable (resolve first)', ->
        tt = t.base!
        called = false
        ret = []
        sentinel = new Error 'sentinel'
        sentinel.marker = !->

        tt.reporter push ret

        tt.async 'test', ->
            called := true
            then: (resolve, reject) ->
                resolve!
                reject sentinel
                resolve!
                reject!

        result = tt.run!then !->
            t.deepEqual ret, a do
                n 'start', []
                n 'start', a p 'test', 0
                n 'end', a p 'test', 0
                n 'pass', a p 'test', 0
                n 'end', []
                n 'exit', []

        t.false called
        return result

    test 'with async tests + mixed thenable (reject first)', ->
        tt = t.base!
        called = false
        ret = []
        sentinel = new Error 'sentinel'
        sentinel.marker = !->

        tt.reporter push ret

        tt.async 'test', ->
            called := true
            then: (resolve, reject) ->
                reject sentinel
                resolve!
                reject!
                resolve!

        result = tt.run!then !->
            t.deepEqual ret, a do
                n 'start', []
                n 'start', a p 'test', 0
                n 'end', a p 'test', 0
                n 'fail', (a p 'test', 0), sentinel
                n 'end', []
                n 'exit', []

        t.false called
        result
