'use strict'

t = require '../../../index.js'

fail = -> @fail 'fail'

t.test 'core (basic) has `base()`', ->
t.test 'core (basic) has `test()`', ->
t.test 'core (basic) has `parent()`', ->
t.test 'core (basic) can accept a string + function', ->
t.test 'core (basic) can accept a string', ->
t.test 'core (basic) returns the current instance when given a callback', fail
t.test 'core (basic) returns a prototypal clone when not given a callback', fail
t.test 'core (basic) runs block tests within tests', ->
t.test 'core (basic) runs successful inline tests within tests', ->
t.testSkip 'core (basic) accepts a callback with `t.run()`'
