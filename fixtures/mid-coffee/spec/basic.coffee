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

        @test 'has parent()', ->
            tt = @create()

            assert.equal tt.reflect().parent(), undefined
            assert.equal tt.test('test').reflect().parent(), tt

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

        @async 'runs block tests within tests', ->
            tt = @create()
            called = 0

            tt.test 'test', ->
                @test 'foo', -> called++

            tt.run().then -> assert.equal called, 1

        @async 'runs successful inline tests within tests', ->
            tt = @create()
            err = undefined

            tt.reporter (res, done) ->
                if res.fail()
                    err = res.value
                done()

            tt.test 'test', ->
                @test('foo').use ->

            tt.run().then -> assert.notOk err

        @async 'accepts a callback', ->
            tt = @create()
            err = undefined

            tt.reporter (res, done) ->
                if res.fail()
                    err = res.value
                done()

            tt.test 'test', ->
                @test('foo').use ->

            Promise.fromCallback (cb) -> tt.run(cb)
            .then -> assert.notOk err
