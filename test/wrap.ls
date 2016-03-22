'use strict'

require! '../src/index': {t}

suite 'wrap()', !->
    test 'exists', !->
        tt = t.base!
        t.hasKey tt, 'wrap'
        t.function tt.wrap

    spy = (f) ->
        g = ->
            g.called = true
            f.apply @, &
        g.called = false
        g

    test 'works with string + function', !->
        tt = t.base!
        sentinel = {}

        f1 = tt.f1 = spy ->
        f2 = tt.f2 = spy (x) !-> t.equal x, sentinel
        f3 = tt.f3 = spy !-> t.equal @, tt
        f4 = tt.f4 = spy ->

        tt.wrap 'f1', !-> t.undefined @
        tt.wrap 'f2', (f) -> f sentinel
        tt.wrap 'f3', (f) -> f!
        tt.wrap 'f4', (f, x) -> x

        tt.f1!
        t.false f1.called

        tt.f2!
        t.true f2.called

        tt.f3!
        t.true f3.called

        t.equal (tt.f4 sentinel), sentinel
        t.false f4.called

    test 'works with object', !->
        tt = t.base!
        sentinel = {}

        f1 = tt.f1 = spy ->
        f2 = tt.f2 = spy (x) !-> t.equal x, sentinel
        f3 = tt.f3 = spy !-> t.equal @, tt
        f4 = tt.f4 = spy ->

        tt.wrap do
            f1: !-> t.undefined @
            f2: (f) -> f sentinel
            f3: (f) -> f!
            f4: (f, x) -> x

        tt.f1!
        t.false f1.called

        tt.f2!
        t.true f2.called

        tt.f3!
        t.true f3.called

        t.equal (tt.f4 sentinel), sentinel
        t.false f4.called
