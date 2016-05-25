'use strict'

t = require '../../index.js'

t.test 'core (basic)', ->
    @testSkip 'has `base()`'
    @testSkip 'has `test()`'
    @testSkip 'has `parent()`'
    @testSkip 'can accept a string + function'
    @testSkip 'can accept a string'
    @testSkip 'returns the current instance when given a callback'
    @testSkip 'returns a prototypal clone when not given a callback'
    @testSkip 'runs block tests within tests'
    @testSkip 'runs successful inline tests within tests'
    @testSkip 'accepts a callback with `t.run()`'
