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
            parent = -> @parent

            @test 'works on the root instance', ->
                assert.equal create().call(parent), undefined

            @test 'works on children', ->
                tt = create()
                methods = undefined
                tt.test 'test', -> methods = @call(parent).methods
                tt.run().then -> assert.equal methods, tt

        @test 'get count', ->
            tt = create()
            count = -> @count
            @check = (name, expected) ->
                found = tt.call(count)
                @test name, -> assert.equal found, expected

            @check 'works with 0 tests', 0
            tt.test 'test', ->
            @check 'works with 1 test', 1
            tt.test 'test', ->
            @check 'works with 2 tests', 2
            tt.test 'test', ->
            @check 'works with 3 tests', 3

            # Test this test itself
            testCount = @call count
            @test 'works with itself', -> assert.equal testCount, 4

        @test 'get name', ->
            name = -> @name

            @test 'works with the root test', ->
                assert.equal create().call(name), undefined

            @test 'works with child tests', ->
                tt = create()
                child = undefined
                tt.test 'test', -> child = @call name
                tt.run().then -> assert.equal child, 'test'

            @test 'works with itself', ->
                assert.equal @call(name), 'works with itself'

        @test 'get index', ->
            tt = create()
            index = -> @index
            first = second = undefined

            @test 'works with the root test', ->
                assert.equal tt.call(index), -1

            tt.test 'test', -> first = @call index
            tt.test 'test', -> second = @call index

            tt.run().then =>
                @test 'works with the first child test', ->
                    assert.equal first, 0

                @test 'works with the second child test', ->
                    assert.equal second, 1

                @test 'works with itself', ->
                    assert.equal @call(index), 3

        @test 'get children', ->
            children = -> @children

            @test 'works with 0 tests', ->
                tt = create()
                assert.match tt.call(children), []

            @test 'works with 1 test', ->
                tt = create()
                test = undefined
                tt.test 'test', -> test = @call -> this
                tt.run().then ->
                    assert.match tt.call(children), [test]

            @test 'works with 2 tests', ->
                tt = create()
                first = second = undefined
                tt.test 'first', -> first = @call -> this
                tt.test 'second', -> second = @call -> this
                tt.run().then ->
                    assert.match tt.call(children), [first, second]

            @test 'returns a copy', ->
                tt = create()
                slice = tt.call(children)
                tt.test 'test', ->
                assert.match slice, []

    @test 'test()', ->
        @test 'returns the current instance', ->
            tt = create()
            test = tt.test 'test', ->
            assert.equal test, tt

        @test 'returns a prototypal clone inside', ->
            tt = create()
            inner = undefined
            test = tt.test 'test', -> inner = this
            tt.run().then -> assert.equal Object.getPrototypeOf(inner), tt

    @test 'run()', ->
        @test 'runs child tests', ->
            tt = create()
            called = 0
            err = undefined

            tt.reporter (res) ->
                err = res.value if res.fail
                return

            tt.test 'test', ->
                @test 'foo', -> called++

            tt.run().then ->
                assert.equal called, 1
                assert.notOk err
