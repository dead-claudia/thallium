'use strict'

t = require '../../../index.js'

fail = -> @fail 'fail'

t.test 'core (timeouts) (FLAKE) succeeds with own', ->
t.test 'core (timeouts) (FLAKE) fails with own', ->
t.test 'core (timeouts) (FLAKE) succeeds with inherited', ->
t.test 'core (timeouts) (FLAKE) fails with inherited', ->
t.test 'core (timeouts) (FLAKE) gets own set timeout', fail
t.test 'core (timeouts) (FLAKE) gets own inline set timeout', fail
t.test 'core (timeouts) (FLAKE) gets own sync inner timeout', fail
t.test 'core (timeouts) (FLAKE) gets default timeout', ->
