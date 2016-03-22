'use strict'

require! {
    '../../src/index': {t}
    '../../test-util/base': {n, p, push, a}
    '../../src/assertions': {assertions}
}

suite 'core (reporters)', !->
    # Use thenables, not actual Promises.
    resolve = (value) -> then: (resolve) -> resolve value
    reject = (value) -> then: (resolve, reject) -> reject value

    test 'added individually correctly', !->
        tt = t.base!
        plugin = !->

        tt.reporter plugin
        t.deepEqual tt.reporters!, [plugin]

    test 'added in batches correctly', !->
        tt = t.base!

        plugin1 = !->
        plugin2 = !->
        plugin3 = !->
        plugin4 = !->
        plugin5 = !->

        tt.reporter [plugin1, plugin2, [[plugin3], plugin4], [[[plugin5]]]]
        t.deepEqual tt.reporters!, [plugin1, plugin2, plugin3, plugin4, plugin5]

    test 'added on children correctly', !->
        tt = t.base!

        plugin1 = !->
        plugin2 = !->
        plugin3 = !->
        plugin4 = !->
        plugin5 = !->
        plugin6 = !->

        tt.reporter(plugin6)

        ttt = tt.test 'test'
        .reporter [plugin1, plugin2, [[plugin3], plugin4], [[[plugin5]]]]

        t.deepEqual ttt.reporters!, [plugin1, plugin2, plugin3, plugin4, plugin5]
        t.deepEqual tt.reporters!, [plugin6]

    test 'read on children correctly', !->
        tt = t.base!

        plugin1 = !->
        plugin2 = !->
        plugin3 = !->
        plugin4 = !->
        plugin5 = !->

        tt.reporter [plugin1, plugin2, [[plugin3], plugin4], [[[plugin5]]]]
        ttt = tt.test 'test'

        t.deepEqual ttt.reporters!, [plugin1, plugin2, plugin3, plugin4, plugin5]

    test 'only added once', !->
        tt = t.base!

        plugin1 = !->
        plugin2 = !->
        plugin3 = !->

        tt.reporter [plugin1, plugin2, plugin3]
        tt.reporter [plugin3, plugin1]

        t.deepEqual tt.reporters!, [plugin1, plugin2, plugin3]

    test 'called correctly with sync passing', ->
        tt = t.base!
        ret = []

        tt.reporter push ret

        tt.test 'test', !->
        tt.test 'test', !->

        tt.run!then !->
            t.deepEqual ret, a do
                n 'start', []
                n 'start', a p 'test', 0
                n 'end', a p 'test', 0
                n 'pass', a p 'test', 0
                n 'start', a p 'test', 1
                n 'end', a p 'test', 1
                n 'pass', a p 'test', 1
                n 'end', []
                n 'exit', []

    test 'called correctly with sync failing', ->
        tt = t.base!
        ret = []
        sentinel = new Error 'sentinel'
        sentinel.marker = !->

        tt.reporter push ret

        tt.test 'one', -> throw sentinel
        tt.test 'two', -> throw sentinel

        tt.run!then !->
            t.deepEqual ret, a do
                n 'start', []
                n 'start', a p 'one', 0
                n 'end', a p 'one', 0
                n 'fail', (a p 'one', 0), sentinel
                n 'start', a p 'two', 1
                n 'end', a p 'two', 1
                n 'fail', (a p 'two', 1), sentinel
                n 'end', []
                n 'exit', []

    test 'called correctly with sync both', ->
        tt = t.base!
        ret = []
        sentinel = new Error 'sentinel'
        sentinel.marker = !->

        tt.reporter push ret

        tt.test 'one', -> throw sentinel
        tt.test 'two', !->

        tt.run!then !->
            t.deepEqual ret, a do
                n 'start', []
                n 'start', a p 'one', 0
                n 'end', a p 'one', 0
                n 'fail', (a p 'one', 0), sentinel
                n 'start', a p 'two', 1
                n 'end', a p 'two', 1
                n 'pass', a p 'two', 1
                n 'end', []
                n 'exit', []

    test 'called correctly with inline passing', ->
        tt = t.base!
        ret = []

        tt.reporter push ret

        tt.test 'test'
        tt.test 'test'

        tt.run!then !->
            t.deepEqual ret, a do
                n 'start', []
                n 'start', a p 'test', 0
                n 'end', a p 'test', 0
                n 'pass', a p 'test', 0
                n 'start', a p 'test', 1
                n 'end', a p 'test', 1
                n 'pass', a p 'test', 1
                n 'end', []
                n 'exit', []

    test 'called correctly with inline failing', ->
        tt = t.base!
        ret = []

        tt.reporter push ret

        tt.define 'fail', -> {-test, message: 'fail'}

        tt.test 'one' .fail!
        tt.test 'two' .fail!

        tt.run!then !->
            t.deepEqual ret, a do
                n 'start', []
                n 'start', a p 'one', 0
                n 'end', a p 'one', 0
                n 'fail', (a p 'one', 0), new t.AssertionError 'fail'
                n 'start', a p 'two', 1
                n 'end', a p 'two', 1
                n 'fail', (a p 'two', 1), new t.AssertionError 'fail'
                n 'end', []
                n 'exit', []

    test 'called correctly with inline both', ->
        tt = t.base!
        ret = []

        tt.reporter push ret

        tt.define 'fail', -> {-test, message: 'fail'}

        tt.test 'one' .fail!
        tt.test 'two', !->

        tt.run!then !->
            t.deepEqual ret, a do
                n 'start', []
                n 'start', a p 'one', 0
                n 'end', a p 'one', 0
                n 'fail', (a p 'one', 0), new t.AssertionError 'fail'
                n 'start', a p 'two', 1
                n 'end', a p 'two', 1
                n 'pass', a p 'two', 1
                n 'end', []
                n 'exit', []

    test 'called correctly with async passing', ->
        tt = t.base!
        ret = []

        tt.reporter push ret

        tt.async 'test', (t, done) !-> done!
        tt.test 'test', !->

        tt.run!then !->
            t.deepEqual ret, a do
                n 'start', []
                n 'start', a p 'test', 0
                n 'end', a p 'test', 0
                n 'pass', a p 'test', 0
                n 'start', a p 'test', 1
                n 'end', a p 'test', 1
                n 'pass', a p 'test', 1
                n 'end', []
                n 'exit', []

    test 'called correctly with async failing', ->
        tt = t.base!
        ret = []
        sentinel = new Error 'sentinel'
        sentinel.marker = !->

        tt.reporter push ret

        tt.async 'one', (t, done) !-> done sentinel
        tt.test 'two', -> throw sentinel

        tt.run!then !->
            t.deepEqual ret, a do
                n 'start', []
                n 'start', a p 'one', 0
                n 'end', a p 'one', 0
                n 'fail', (a p 'one', 0), sentinel
                n 'start', a p 'two', 1
                n 'end', a p 'two', 1
                n 'fail', (a p 'two', 1), sentinel
                n 'end', []
                n 'exit', []

    test 'called correctly with async both', ->
        tt = t.base!
        ret = []
        sentinel = new Error 'sentinel'
        sentinel.marker = !->

        tt.reporter push ret

        tt.async 'one', (t, done) !-> done sentinel
        tt.async 'two', (t, done) !-> done!

        tt.run!then !->
            t.deepEqual ret, a do
                n 'start', []
                n 'start', a p 'one', 0
                n 'end', a p 'one', 0
                n 'fail', (a p 'one', 0), sentinel
                n 'start', a p 'two', 1
                n 'end', a p 'two', 1
                n 'pass', a p 'two', 1
                n 'end', []
                n 'exit', []

    test 'called correctly with async + promise passing', ->
        tt = t.base!
        ret = []

        tt.reporter push ret

        tt.async 'test', -> resolve!
        tt.test 'test', ->

        tt.run!then !->
            t.deepEqual ret, a do
                n 'start', []
                n 'start', a p 'test', 0
                n 'end', a p 'test', 0
                n 'pass', a p 'test', 0
                n 'start', a p 'test', 1
                n 'end', a p 'test', 1
                n 'pass', a p 'test', 1
                n 'end', []
                n 'exit', []

    test 'called correctly with async + promise failing', ->
        tt = t.base!
        ret = []
        sentinel = new Error 'sentinel'
        sentinel.marker = !->

        tt.reporter push ret

        tt.async 'one', -> reject sentinel
        tt.test 'two', -> throw sentinel

        tt.run!then !->
            t.deepEqual ret, a do
                n 'start', []
                n 'start', a p 'one', 0
                n 'end', a p 'one', 0
                n 'fail', (a p 'one', 0), sentinel
                n 'start', a p 'two', 1
                n 'end', a p 'two', 1
                n 'fail', (a p 'two', 1), sentinel
                n 'end', []
                n 'exit', []

    test 'called correctly with async + promise both', ->
        tt = t.base!
        ret = []
        sentinel = new Error 'sentinel'
        sentinel.marker = !->

        tt.reporter push ret

        tt.async 'one', -> reject sentinel
        tt.async 'two', -> resolve!

        tt.run!then !->
            t.deepEqual ret, a do
                n 'start', []
                n 'start', a p 'one', 0
                n 'end', a p 'one', 0
                n 'fail', (a p 'one', 0), sentinel
                n 'start', a p 'two', 1
                n 'end', a p 'two', 1
                n 'pass', a p 'two', 1
                n 'end', []
                n 'exit', []

    test 'called correctly with child passing tests', ->
        tt = t.base!
        ret = []

        tt.reporter push ret

        tt.test 'test', ->
            @test 'one', !->
            @test 'two', !->

        tt.run!then !->
            t.deepEqual ret, a do
                n 'start', []
                n 'start', a p 'test', 0
                n 'start', a (p 'test', 0), (p 'one', 0)
                n 'end', a (p 'test', 0), (p 'one', 0)
                n 'pass', a (p 'test', 0), (p 'one', 0)
                n 'start', a (p 'test', 0), (p 'two', 1)
                n 'end', a (p 'test', 0), (p 'two', 1)
                n 'pass', a (p 'test', 0), (p 'two', 1)
                n 'end', a p 'test', 0
                n 'pass', a p 'test', 0
                n 'end', []
                n 'exit', []

    test 'called correctly with child failing tests', ->
        tt = t.base!
        ret = []
        sentinel1 = new Error 'sentinel one'
        sentinel1.marker = !->

        sentinel2 = new Error 'sentinel two'
        sentinel2.marker = !->

        tt.reporter push ret

        tt.test 'parent one', ->
            @test 'child one', !-> throw sentinel1
            @test 'child two', !-> throw sentinel1

        tt.test 'parent two', ->
            @test 'child one', !-> throw sentinel2
            @test 'child two', !-> throw sentinel2

        tt.run!then !->
            t.deepEqual ret, a do
                n 'start', []
                n 'start', a p 'parent one', 0
                n 'start', a (p 'parent one', 0), (p 'child one', 0)
                n 'end', a (p 'parent one', 0), (p 'child one', 0)
                n 'fail', (a (p 'parent one', 0), (p 'child one', 0)), sentinel1
                n 'start', a (p 'parent one', 0), (p 'child two', 1)
                n 'end', a (p 'parent one', 0), (p 'child two', 1)
                n 'fail', (a (p 'parent one', 0), (p 'child two', 1)), sentinel1
                n 'end', a p 'parent one', 0
                n 'pass', a p 'parent one', 0
                n 'start', a p 'parent two', 1
                n 'start', a (p 'parent two', 1), (p 'child one', 0)
                n 'end', a (p 'parent two', 1), (p 'child one', 0)
                n 'fail', (a (p 'parent two', 1), (p 'child one', 0)), sentinel2
                n 'start', a (p 'parent two', 1), (p 'child two', 1)
                n 'end', a (p 'parent two', 1), (p 'child two', 1)
                n 'fail', (a (p 'parent two', 1), (p 'child two', 1)), sentinel2
                n 'end', a p 'parent two', 1
                n 'pass', a p 'parent two', 1
                n 'end', []
                n 'exit', []

    test 'called correctly with child both', ->
        tt = t.base!
        ret = []
        sentinel1 = new Error 'sentinel one'
        sentinel1.marker = !->

        sentinel2 = new Error 'sentinel two'
        sentinel2.marker = !->

        tt.reporter push ret

        tt.test 'parent one', ->
            @test 'child one', !-> throw sentinel1
            @test 'child two', !->

        tt.test 'parent two', ->
            @test 'child one', !-> throw sentinel2
            @test 'child two', !->

        tt.run!then !->
            t.deepEqual ret, a do
                n 'start', []
                n 'start', a p 'parent one', 0
                n 'start', a (p 'parent one', 0), (p 'child one', 0)
                n 'end', a (p 'parent one', 0), (p 'child one', 0)
                n 'fail', (a (p 'parent one', 0), (p 'child one', 0)), sentinel1
                n 'start', a (p 'parent one', 0), (p 'child two', 1)
                n 'end', a (p 'parent one', 0), (p 'child two', 1)
                n 'pass', a (p 'parent one', 0), (p 'child two', 1)
                n 'end', a p 'parent one', 0
                n 'pass', a p 'parent one', 0
                n 'start', a p 'parent two', 1
                n 'start', a (p 'parent two', 1), (p 'child one', 0)
                n 'end', a (p 'parent two', 1), (p 'child one', 0)
                n 'fail', (a (p 'parent two', 1), (p 'child one', 0)), sentinel2
                n 'start', a (p 'parent two', 1), (p 'child two', 1)
                n 'end', a (p 'parent two', 1), (p 'child two', 1)
                n 'pass', a (p 'parent two', 1), (p 'child two', 1)
                n 'end', a p 'parent two', 1
                n 'pass', a p 'parent two', 1
                n 'end', []
                n 'exit', []

    test 'called correctly with subtest run', ->
        tt = t.base!
        ret = []

        tt.reporter push ret

        tt.test 'test'
        .test 'foo', !->
        .run!then !->
            t.deepEqual ret, a do
                n 'start', a p 'test', 0
                n 'start', a (p 'test', 0), (p 'foo', 0)
                n 'end', a (p 'test', 0), (p 'foo', 0)
                n 'pass', a (p 'test', 0), (p 'foo', 0)
                n 'end', a p 'test', 0
                n 'pass', a p 'test', 0
                n 'exit', a p 'test', 0

    test 'called correctly with complex sequence', ->
        tt = t.base!
        ret = []
        sentinel = new Error 'sentinel'
        sentinel.marker = !->

        tt.reporter push ret
        tt.use assertions

        tt.test 'module-1', ->
            @test '1 === 1' .equal 1, 1

            @test 'foo()', ->
                @foo = 1
                @notEqual 1, 1

            @async 'bar()', (t, done) ->
                setTimeout (-> done new Error 'fail'), 0

            @async 'baz()', ->
                then: (resolve, reject) ->
                    setTimeout (-> reject sentinel), 0

            @test 'nested', ->
                @test 'nested 2', -> @true true

        tt.test 'module-2', ->
            @test '1 === 2' .equal 1, 2
            @test 'expandos don\'t transfer' .notHasKey tt, 'foo'

        fail1 = new t.AssertionError 'Expected 1 to not equal 1', 1, 1
        fail2 = new t.AssertionError 'Expected 1 to equal 2', 2, 1

        tt.run!then !->
            t.deepEqual ret, a do
                n 'start', []
                n 'start', a p 'module-1', 0
                n 'start', a (p 'module-1', 0), (p '1 === 1', 0)
                n 'end', a (p 'module-1', 0), (p '1 === 1', 0)
                n 'pass', a (p 'module-1', 0), (p '1 === 1', 0)
                n 'start', a (p 'module-1', 0), (p 'foo()', 1)
                n 'end', a (p 'module-1', 0), (p 'foo()', 1)
                n 'fail', (a (p 'module-1', 0), (p 'foo()', 1)), fail1
                n 'start', a (p 'module-1', 0), (p 'bar()', 2)
                n 'end', a (p 'module-1', 0), (p 'bar()', 2)
                n 'fail', (a (p 'module-1', 0), (p 'bar()', 2)), new Error 'fail'
                n 'start', a (p 'module-1', 0), (p 'baz()', 3)
                n 'end', a (p 'module-1', 0), (p 'baz()', 3)
                n 'fail', (a (p 'module-1', 0), (p 'baz()', 3)), sentinel
                n 'start', a (p 'module-1', 0), (p 'nested', 4)
                n 'start', a (p 'module-1', 0), (p 'nested', 4), (p 'nested 2', 0)
                n 'end', a (p 'module-1', 0), (p 'nested', 4), (p 'nested 2', 0)
                n 'pass', a (p 'module-1', 0), (p 'nested', 4), (p 'nested 2', 0)
                n 'end', a (p 'module-1', 0), (p 'nested', 4)
                n 'pass', a (p 'module-1', 0), (p 'nested', 4)
                n 'end', a p 'module-1', 0
                n 'pass', a p 'module-1', 0
                n 'start', a p 'module-2', 1
                n 'start', a (p 'module-2', 1), (p '1 === 2', 0)
                n 'end', a (p 'module-2', 1), (p '1 === 2', 0)
                n 'fail', (a (p 'module-2', 1), (p '1 === 2', 0)), fail2
                n 'start', a (p 'module-2', 1), (p 'expandos don\'t transfer', 1)
                n 'end', a (p 'module-2', 1), (p 'expandos don\'t transfer', 1)
                n 'pass', a (p 'module-2', 1), (p 'expandos don\'t transfer', 1)
                n 'end', a p 'module-2', 1
                n 'pass', a p 'module-2', 1
                n 'end', []
                n 'exit', []

    test 'can return a resolving thenable', ->
        tt = t.base!
        ret = []

        tt.reporter (entry) ->
            then: (resolve) ->
                ret.push entry
                resolve!

        tt.test 'test', !->
        tt.test 'test', !->

        tt.run!then !->
            t.deepEqual ret, a do
                n 'start', []
                n 'start', a p 'test', 0
                n 'end', a p 'test', 0
                n 'pass', a p 'test', 0
                n 'start', a p 'test', 1
                n 'end', a p 'test', 1
                n 'pass', a p 'test', 1
                n 'end', []
                n 'exit', []

    test 'can return a rejecting thenable', ->
        tt = t.base!
        sentinel = new Error 'sentinel'

        tt.reporter ->
            then: (resolve, reject) -> reject sentinel

        tt.test 'test', !->
        tt.test 'test', !->

        tt.run!then do
            -> t.fail 'Expected a rejection'
            (err) -> t.equal err, sentinel
