'use strict'

t = require '../../index.js'

fail = -> @fail 'fail'

t.test 'core (timeouts) (FLAKE)', ->
    @test 'succeeds with own', fail
    @test 'fails with own', fail
    @test 'succeeds with inherited', fail
    @test 'fails with inherited', fail
    @test 'gets own set timeout', fail
    @test 'gets own inline set timeout', fail
    @test 'gets own sync inner timeout', fail
    @test 'gets default timeout', fail
