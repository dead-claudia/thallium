'use strict'

t = require '../../index.js'

fail = -> @fail 'fail'

t.test 'core (basic)', ->
    @test 'has `base()`', fail
    @test 'has `test()`', fail
    @test 'has `parent()`', fail
    @test 'can accept a string + function', fail
    @test 'can accept a string', fail
    @test 'returns the current instance when given a callback', fail
    @test 'returns a prototypal clone when not given a callback', fail
    @test 'runs block tests within tests', fail
    @test 'runs successful inline tests within tests', fail
    @test 'accepts a callback with `t.run()`', fail
