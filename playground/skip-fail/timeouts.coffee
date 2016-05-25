'use strict'

t = require '../../index.js'

fail = -> @fail 'fail'

t.test 'core (timeouts) (FLAKE)', ->
    @testSkip 'succeeds with own'
    @testSkip 'fails with own'
    @testSkip 'succeeds with inherited'
    @testSkip 'fails with inherited'
    @test 'gets own set timeout', fail
    @test 'gets own inline set timeout', fail
    @test 'gets own sync inner timeout', fail
    @testSkip 'gets default timeout'
