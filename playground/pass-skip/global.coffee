'use strict'

t = require '../../index.js'

fail = -> @fail 'fail'

t.test 'works', ->
t.testSkip "doesn't work"
t.test 'what', ->
t.test 'ever', ->
t.test 'you may stop now', ->
