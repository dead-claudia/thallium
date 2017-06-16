'use strict'

###
Note: updates to this should also be reflected in test/core/timeouts.js, as this
is trying to represent more real-world usage.
###

t = require 'thallium'
assert = require 'thallium/assert'
{root: create} = require 'thallium/internal'
r = require '../../../test-util/reports'

# Note that this entire section may be flaky on slower machines. Thankfully,
# these have been tested against a slower machine, so it should hopefully not
# be too bad.
t.test 'core (timeouts) (FLAKE)', ->
    t.test 'succeeds with own', -> r.check
        init: (tt) ->
            tt.test 'test', ->
                # It's highly unlikely the engine will take this long to finish.
                tt.timeout = 10
                then: (resolve) -> resolve()

        expected: [
            r.pass 'test'
        ]

    t.test 'fails with own', -> r.check
        init: (tt) ->
            tt.test 'test', ->
                tt.timeout = 50
                # It's highly unlikely the engine will take this long to finish
                then: (resolve) -> setTimeout resolve, 200

        expected: [
            r.fail 'test', new Error('Timeout of 50 reached')
        ]

    t.test 'succeeds with inherited', -> r.check
        init: (tt) ->
            tt.test 'test', ->
                tt.timeout = 50
                tt.test 'inner', -> then: (resolve) -> resolve()

        expected: [
            r.suite 'test', [
                r.pass 'inner'
            ]
        ]

    t.test 'fails with inherited', -> r.check
        init: (tt) ->
            tt.test 'test', ->
                tt.timeout = 50
                tt.test 'inner', ->
                    # It's highly unlikely the engine will take this long to
                    # finish.
                    then: (resolve) -> setTimeout resolve, 200

        expected: [
            r.suite 'test', [
                r.fail 'inner', new Error('Timeout of 50 reached')
            ]
        ]

    t.test 'gets own timeout', -> r.check
        init: (tt) ->
            tt.test 'test', =>
                tt.timeout = 50
                @active = tt.reflect.timeout
        after: ->
            assert.equal @active, 50

    t.test 'gets inherited timeout', -> r.check
        init: (tt) ->
            tt.test 'test', =>
                tt.timeout = 50
                tt.test 'inner', =>
                    @active = tt.reflect.timeout
        after: ->
            assert.equal @active, 50

    t.test 'gets default timeout', -> r.check
        init: (tt) ->
            tt.test 'test', =>
                @active = tt.reflect.timeout
        after: ->
            assert.equal @active, 2000
