'use strict'

###
Note: updates to this should also be reflected in test/core/basic.js, as this
is trying to represent more real-world usage.
###

Promise = require 'bluebird'
t = require '../../../index.js'

t.test 'core (basic)', ->
    @test('has `base()`').equal @base().base, @base
    @test('has `test()`').function @base().test

    @test 'has `parent()`', ->
        tt = @base()
        @hasKey tt, 'parent'
        @function tt.parent
        @equal tt.test('test').parent(), tt
        @undefined tt.parent()

    @test 'can accept a string + function', ->
        @base().test 'test', ->

    @test 'can accept a string', ->
        @base().test 'test'

    @test 'returns the current instance when given a callback', ->
        tt = @base()
        test = tt.test 'test', ->
        @equal(test, tt)

    @test 'returns a prototypal clone when not given a callback', ->
        tt = @base()
        test = tt.test('test')

        @notEqual test, tt
        @equal Object.getPrototypeOf(test), tt

    @async 'runs block tests within tests', ->
        tt = @base()
        called = 0

        tt.test 'test', ->
            @test 'foo', -> called++

        tt.run().then => @equal(called, 1)

    @async 'runs successful inline tests within tests', ->
        tt = @base()
        err = undefined

        tt.reporter (res, done) ->
            if res.type is 'fail'
                err = res.value

            done()

        tt.test 'test', ->
            @test('foo').use ->

        tt.run().then => @notOk(err)

    @async 'accepts a callback with `t.run()`', ->
        tt = @base()
        err = undefined

        tt.reporter (res, done) ->
            if res.type is 'fail'
                err = res.value

            done()

        tt.test 'test', ->
            @test('foo').use ->

        Promise.fromCallback (cb) -> tt.run(cb)
        .then => @notOk(err)
