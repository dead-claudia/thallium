'use strict'

t = require '../../index.js'

t.test 'core (timeouts) (FLAKE)', ->
    @testSkip 'succeeds with own'
    @testSkip 'fails with own'
    @testSkip 'succeeds with inherited'
    @testSkip 'fails with inherited'
    @testSkip 'gets own set timeout'
    @testSkip 'gets own inline set timeout'
    @testSkip 'gets own sync inner timeout'
    @testSkip 'gets default timeout'
