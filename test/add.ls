'use strict'

require! '../src/index': {t}

suite 'add()', !->
    test 'exists', !->
        tt = t.base!
        t.hasKey tt, 'add'
        t.function tt.add

    test 'works with string + function', !->
        tt = t.base!

        tt.add 'foo', -> @
        tt.add 'bar', -> it
        tt.add 'baz', (_, x) -> x

        t.equal tt.foo!, tt
        t.equal tt.bar!, tt

        obj = {}
        t.equal (tt.baz obj), obj

    test 'works with object', !->
        tt = t.base!

        tt.add do
            foo: -> @
            bar: -> it
            baz: (_, x) -> x

        t.equal tt.foo!, tt
        t.equal tt.bar!, tt

        obj = {}
        t.equal (tt.baz obj), obj
