'use strict'

t = require '../../index.js'

t.test 'core (basic)', ->
    @test 'has `base()`', ->
    @test 'has `test()`', ->
    @test 'has `parent()`', ->
    @test 'can accept a string + function', ->
    @test 'can accept a string', ->
    @testSkip 'returns the current instance when given a callback'
    @testSkip 'returns a prototypal clone when not given a callback'
    @test 'runs block tests within tests', ->
    @test 'runs successful inline tests within tests', ->
    @test 'accepts a callback with `t.run()`', ->
