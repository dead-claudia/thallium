'use strict'

###
Note: updates to this should also be reflected in test/core/basic.js, as this
is trying to represent more real-world usage.
###

Promise = require 'bluebird'
t = require 'thallium'
assert = require 'thallium/assert'

t.test 'core (basic)', ->
    @test 'reflect()', ->
        @test('exists').try assert.function, @reflect

        @test 'parent()', ->
            @test 'works on the root instance', ->
                tt = @create()
                assert.equal tt.reflect().parent(), undefined

            @test 'works on children', ->
                tt = @create()
                assert.equal tt.test('test').reflect().parent(), tt

        @test 'count()', ->
            tt = @create()
            reflect = tt.reflect()

            @test('works with 0 tests').try assert.equal, reflect.count(), 0
            tt.test('test')
            @test('works with 1 test').try assert.equal, reflect.count(), 1
            tt.test('test')
            @test('works with 2 tests').try assert.equal, reflect.count(), 2
            tt.test('test')
            @test('works with 3 tests').try assert.equal, reflect.count(), 3

            # Test this test itself
            count = @reflect().count()
            @test('works with itself').try assert.equal, count, 4

        @test 'name()', ->
            tt = @create()

            @test 'works with the root test', ->
                assert.equal tt.reflect().name(), undefined

            @test 'works with child tests', ->
                assert.equal tt.test('test').reflect().name(), 'test'

            @test 'works with itself', ->
                assert.equal @reflect().name(), 'works with itself'

        @test 'index()', ->
            tt = @create()

            @test 'works with the root test', ->
                assert.equal tt.reflect().index(), -1

            first = tt.test('test')
            @test 'works with the first child test', ->
                assert.equal first.reflect().index(), 0

            second = tt.test('test')
            @test 'works with the second child test', ->
                assert.equal second.reflect().index(), 1

            @test 'works with itself', ->
                assert.equal @reflect().index(), 3

        @test 'children()', ->
            @test 'works with 0 tests', ->
                tt = t.create()
                assert.match tt.reflect().children(), []

            @test 'works with 1 test', ->
                tt = @create()
                test = tt.test('test').reflect()
                assert.match tt.reflect().children(), [test]

            @test 'works with 2 tests', ->
                tt = @create()
                first = tt.test('first').reflect()
                second = tt.test('second').reflect()
                assert.match tt.reflect().children(), [first, second]

            @test 'returns a copy', ->
                tt = @create()
                slice = tt.reflect().children()
                tt.test('test')
                assert.match slice, []

    @test 'test()', ->
        @test('exists').try assert.function, @create().test

        @test 'accepts a string + function', ->
            tt = @create()
            tt.test 'test', ->

        @test 'accepts a string', ->
            tt = @create()
            tt.test('test')

        @test 'returns the current instance when given a callback', ->
            tt = @create()
            test = tt.test 'test', ->
            assert.equal test, tt

        @test 'returns a prototypal clone when not given a callback', ->
            tt = @create()
            test = tt.test('test')

            assert.notEqual test, tt
            assert.equal Object.getPrototypeOf(test), tt

    @test 'run()', ->
        @test('exists').try assert.function, @create().run

        @test 'runs block tests within tests', ->
            tt = @create()
            called = 0

            tt.test 'test', ->
                @test 'foo', -> called++

            tt.run().then -> assert.equal called, 1

        @test 'runs successful inline tests within tests', ->
            tt = @create()
            err = undefined

            tt.reporter (res) ->
                err = res.value if res.fail()
                return

            tt.test 'test', ->
                @test('foo').use ->

            tt.run().then -> assert.notOk err
