'use strict'

t = require '../../../index.js'

t.test 'core (timeouts) (FLAKE) succeeds with own', ->
t.test 'core (timeouts) (FLAKE) fails with own', ->
t.test 'core (timeouts) (FLAKE) succeeds with inherited', ->
t.test 'core (timeouts) (FLAKE) fails with inherited', ->
t.testSkip 'core (timeouts) (FLAKE) gets own set timeout'
t.testSkip 'core (timeouts) (FLAKE) gets own inline set timeout'
t.testSkip 'core (timeouts) (FLAKE) gets own sync inner timeout'
t.test 'core (timeouts) (FLAKE) gets default timeout', ->
