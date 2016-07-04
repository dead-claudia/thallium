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
        @test('has base()').function @reflect().base

        @test 'has parent()', ->
            tt = @reflect().base()

            @undefined tt.reflect().parent()
            @equal tt.test('test').reflect().parent(), tt

    @test 'test()', ->
        @test('exists').function @reflect().base().test

        @test 'accepts a string + function', ->
            tt = @reflect().base()
            tt.test 'test', ->

        @test 'accepts a string', ->
            tt = @reflect().base()
            tt.test('test')

        @test 'returns the current instance when given a callback', ->
            tt = @reflect().base()
            test = tt.test 'test', ->
            @equal test, tt

        @test 'returns a prototypal clone when not given a callback', ->
            tt = @reflect().base()
            test = tt.test('test')

            @notEqual test, tt
            @equal Object.getPrototypeOf(test), tt

    @test 'run()', ->
        @test('exists').function @reflect().base().run

        @async 'runs block tests within tests', ->
            tt = @reflect().base()
            called = 0

            tt.test 'test', ->
                @test 'foo', -> called++

            tt.run().then => @equal called, 1

        @async 'runs successful inline tests within tests', ->
            tt = @reflect().base()
            err = undefined

            tt.reporter (res, done) ->
                if res.fail()
                    err = res.value
                done()

            tt.test 'test', ->
                @test('foo').use ->

            tt.run().then => @notOk err

        @async 'accepts a callback', ->
            tt = @reflect().base()
            err = undefined

            tt.reporter (res, done) ->
                if res.fail()
                    err = res.value
                done()

            tt.test 'test', ->
                @test('foo').use ->

            Promise.fromCallback (cb) -> tt.run(cb)
            .then => @notOk err
