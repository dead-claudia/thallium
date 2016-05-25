'use strict'

t = require '../../index.js'

fail = -> @fail 'fail'

t.testSkip 'works'
t.test "doesn't work", fail
t.testSkip 'what'
t.testSkip 'ever'
t.testSkip 'you may stop now'
