'use strict'

t = require '../../index.js'

t.test 'core (timeouts) (FLAKE)', ->
    @test 'succeeds with own', ->
    @test 'fails with own', ->
    @test 'succeeds with inherited', ->
    @test 'fails with inherited', ->
    @test 'gets own set timeout', ->
    @test 'gets own inline set timeout', ->
    @test 'gets own sync inner timeout', ->
    @test 'gets default timeout', ->
