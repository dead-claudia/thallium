'use strict'

###
Note: updates to this should also be reflected in test/core/basic.js, as this
is trying to represent more real-world usage.
###

Promise = require 'bluebird'
t = require 'thallium'

t.test 'core (basic)', ->
    @test 'reflect()', ->
        @test('exists').function @reflect

        @test 'has parent()', ->
            tt = @base()

            @undefined tt.reflect().parent()
            @equal tt.test('test').reflect().parent(), tt

    @test 'test()', ->
        @test('exists').function @base().test

        @test 'accepts a string + function', ->
            tt = @base()
            tt.test 'test', ->

        @test 'accepts a string', ->
            tt = @base()
            tt.test('test')

        @test 'returns the current instance when given a callback', ->
            tt = @base()
            test = tt.test 'test', ->
            @equal test, tt

        @test 'returns a prototypal clone when not given a callback', ->
            tt = @base()
            test = tt.test('test')

            @notEqual test, tt
            @equal Object.getPrototypeOf(test), tt

    @test 'run()', ->
        @test('exists').function @base().run

        @async 'runs block tests within tests', ->
            tt = @base()
            called = 0

            tt.test 'test', ->
                @test 'foo', -> called++

            tt.run().then => @equal called, 1

        @async 'runs successful inline tests within tests', ->
            tt = @base()
            err = undefined

            tt.reporter (res, done) ->
                if res.fail()
                    err = res.value
                done()

            tt.test 'test', ->
                @test('foo').use ->

            tt.run().then => @notOk err

        @async 'accepts a callback', ->
            tt = @base()
            err = undefined

            tt.reporter (res, done) ->
                if res.fail()
                    err = res.value
                done()

            tt.test 'test', ->
                @test('foo').use ->

            Promise.fromCallback (cb) -> tt.run(cb)
            .then => @notOk err
