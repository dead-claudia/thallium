'use strict'

t = require '../../index.js'

fail = -> @fail 'fail'

t.test 'core (basic)', ->
    @test 'has `base()`', ->
    @test 'has `test()`', ->
    @test 'has `parent()`', ->
    @test 'can accept a string + function', ->
    @test 'can accept a string', ->
    @test 'returns the current instance when given a callback', fail
    @test 'returns a prototypal clone when not given a callback', fail
    @test 'runs block tests within tests', ->
    @test 'runs successful inline tests within tests', ->
    @test 'accepts a callback with `t.run()`', ->
