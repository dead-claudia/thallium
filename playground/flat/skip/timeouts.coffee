'use strict'

t = require '../../../index.js'

t.testSkip 'core (timeouts) (FLAKE) succeeds with own'
t.testSkip 'core (timeouts) (FLAKE) fails with own'
t.testSkip 'core (timeouts) (FLAKE) succeeds with inherited'
t.testSkip 'core (timeouts) (FLAKE) fails with inherited'
t.testSkip 'core (timeouts) (FLAKE) gets own set timeout'
t.testSkip 'core (timeouts) (FLAKE) gets own inline set timeout'
t.testSkip 'core (timeouts) (FLAKE) gets own sync inner timeout'
t.testSkip 'core (timeouts) (FLAKE) gets default timeout'
