'use strict'

t = require '../../index.js'

fail = -> @fail 'fail'

t.test 'core (basic)', ->
    @testSkip 'has `base()`'
    @testSkip 'has `test()`'
    @testSkip 'has `parent()`'
    @testSkip 'can accept a string + function'
    @testSkip 'can accept a string'
    @test 'returns the current instance when given a callback', fail
    @test 'returns a prototypal clone when not given a callback', fail
    @testSkip 'runs block tests within tests'
    @testSkip 'runs successful inline tests within tests'
    @testSkip 'accepts a callback with `t.run()`'
