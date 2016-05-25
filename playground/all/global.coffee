'use strict'

t = require '../../index.js'

fail = -> @fail 'fail'

t.test 'works', ->
t.test "doesn't work", fail
t.test 'what', ->
t.testSkip 'ever'
t.test 'you may stop now', ->
