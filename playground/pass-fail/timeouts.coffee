'use strict'

t = require '../../index.js'

fail = -> @fail 'fail'

t.test 'core (timeouts) (FLAKE)', ->
    @test 'succeeds with own', ->
    @test 'fails with own', ->
    @test 'succeeds with inherited', ->
    @test 'fails with inherited', ->
    @test 'gets own set timeout', fail
    @test 'gets own inline set timeout', fail
    @test 'gets own sync inner timeout', fail
    @test 'gets default timeout', ->
