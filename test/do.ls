'use strict'

require! {
    '../src/index': {t}
    '../test-util/base': {n, p, push, a}
}

run = (name) !->
    suite "#{name}()", !->
        test 'exists', !->
            tt = t.base!
            t.hasKey tt, name
            t.function tt[name]

        test 'runs blocks in sync tests', ->
            tt = t.base!
            len = self = void
            ret = []

            tt.reporter push ret

            tt.test 'test', (tt) ->
                tt[name] !->
                    len := &length
                    self := @

            tt.run!then !->
                t.undefined self
                t.equal len, 0
                t.deepEqual ret, a do
                    n 'start', []
                    n 'start', a p 'test', 0
                    n 'end', a p 'test', 0
                    n 'pass', a p 'test', 0
                    n 'end', []
                    n 'exit', []

        test 'propagates errors from blocks in sync tests', ->
            tt = t.base!
            ret = []
            sentinel = new Error 'sentinel'
            sentinel.marker = !->

            tt.reporter push ret

            tt.test 'test', (tt) ->
                tt[name] !-> throw sentinel

            tt.run!then !->
                t.deepEqual ret, a do
                    n 'start', []
                    n 'start', a p 'test', 0
                    n 'end', a p 'test', 0
                    n 'fail', (a p 'test', 0), sentinel
                    n 'end', []
                    n 'exit', []

        test 'runs blocks in async tests', ->
            tt = t.base!
            len = self = void
            ret = []

            tt.reporter push ret

            tt.async 'test', (tt, done) !->
                tt[name] !->
                    len := &length
                    self := @
                done!

            tt.run!then !->
                t.undefined self
                t.equal len, 0
                t.deepEqual ret, a do
                    n 'start', []
                    n 'start', a p 'test', 0
                    n 'end', a p 'test', 0
                    n 'pass', a p 'test', 0
                    n 'end', []
                    n 'exit', []

        test 'propagates errors from blocks in async tests', ->
            tt = t.base!
            ret = []
            sentinel = new Error 'sentinel'
            sentinel.marker = !->

            tt.reporter push ret

            tt.async 'test', (tt, done) !->
                tt[name] !-> throw sentinel
                done!

            tt.run!then !->
                t.deepEqual ret, a do
                    n 'start', []
                    n 'start', a p 'test', 0
                    n 'end', a p 'test', 0
                    n 'fail', (a p 'test', 0), sentinel
                    n 'end', []
                    n 'exit', []

        test 'runs blocks in inline sync tests', ->
            tt = t.base!
            len = self = void
            ret = []

            tt.reporter push ret

            tt.test 'test' .[name] !->
                len := &length
                self := @

            tt.run!then !->
                t.undefined self
                t.equal len, 0
                t.deepEqual ret, a do
                    n 'start', []
                    n 'start', a p 'test', 0
                    n 'end', a p 'test', 0
                    n 'pass', a p 'test', 0
                    n 'end', []
                    n 'exit', []

        test 'propagates errors from blocks in inline sync tests', ->
            tt = t.base!
            ret = []
            sentinel = new Error 'sentinel'
            sentinel.marker = !->

            tt.reporter push ret

            tt.test 'test' .[name] !-> throw sentinel

            tt.run!then !->
                t.deepEqual ret, a do
                    n 'start', []
                    n 'start', a p 'test', 0
                    n 'end', a p 'test', 0
                    n 'fail', (a p 'test', 0), sentinel
                    n 'end', []
                    n 'exit', []

run 'do'
run 'block'
