'use strict'

###
Note: updates to this should also be reflected in test/core/basic.js, as this
is trying to represent more real-world usage.
###

Promise = require 'bluebird'
t = require 'thallium'
assert = require 'thallium/assert'
{createBase: create} = require 'thallium/internal'

t.test 'core (basic)', ->
    @test 'reflect', ->
        @test 'get parent', ->
            tt = create()
            parent = -> @parent

            @test 'works on the root instance', ->
                assert.equal tt.call(parent), undefined

            @test 'works on children', ->
                assert.equal tt.test('test').call(parent).methods, tt

        @test 'get count', (t) ->
            tt = create()
            count = -> @count

            @test('works with 0 tests').try assert.equal, tt.call(count), 0
            tt.test('test')
            @test('works with 1 test').try assert.equal, tt.call(count), 1
            tt.test('test')
            @test('works with 2 tests').try assert.equal, tt.call(count), 2
            tt.test('test')
            @test('works with 3 tests').try assert.equal, tt.call(count), 3

            # Test this test itself
            @test('works with itself').try assert.equal, @call(count), 5

        @test 'get name', ->
            tt = create()
            name = -> @name

            @test 'works with the root test', ->
                assert.equal tt.call(name), undefined

            @test 'works with child tests', ->
                assert.equal tt.test('test').call(name), 'test'

            @test 'works with itself', ->
                assert.equal @call(name), 'works with itself'

        @test 'get index', ->
            tt = create()
            index = -> @index

            @test 'works with the root test', ->
                assert.equal tt.call(index), -1

            first = tt.test('test')
            @test 'works with the first child test', ->
                assert.equal first.call(index), 0

            second = tt.test('test')
            @test 'works with the second child test', ->
                assert.equal second.call(index), 1

            @test 'works with itself', ->
                assert.equal @call(index), 3

        @test 'get children', ->
            children = -> @children

            @test 'works with 0 tests', ->
                tt = create()
                assert.match tt.call(children), []

            @test 'works with 1 test', ->
                tt = create()
                test = tt.test('test').call -> this
                assert.match tt.call(children), [test]

            @test 'works with 2 tests', ->
                tt = create()
                first = tt.test('first').call -> this
                second = tt.test('second').call -> this
                assert.match tt.call(children), [first, second]

            @test 'returns a copy', ->
                tt = create()
                slice = tt.call(children)
                tt.test('test')
                assert.match slice, []

    @test 'test()', ->
        @test('exists').try assert.function, create().test

        @test 'accepts a string + function', ->
            tt = create()
            tt.test 'test', ->

        @test 'accepts a string', ->
            tt = create()
            tt.test('test')

        @test 'returns the current instance when given a callback', ->
            tt = create()
            test = tt.test 'test', ->
            assert.equal test, tt

        @test 'returns a prototypal clone when not given a callback', ->
            tt = create()
            test = tt.test('test')

            assert.notEqual test, tt
            assert.equal Object.getPrototypeOf(test), tt

    @test 'run()', ->
        @test('exists').try assert.function, create().run

        @test 'runs block tests within tests', ->
            tt = create()
            called = 0

            tt.test 'test', ->
                @test 'foo', -> called++

            tt.run().then -> assert.equal called, 1

        @test 'runs successful inline tests within tests', ->
            tt = create()
            err = undefined

            tt.reporter (res) ->
                err = res.value if res.fail()
                return

            tt.test 'test', ->
                @test('foo').call ->

            tt.run().then -> assert.notOk err
