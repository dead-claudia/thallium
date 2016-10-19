'use strict'

###
Note: updates to this should also be reflected in test/core/timeouts.js, as this
is trying to represent more real-world usage.
###

t = require 'thallium'
assert = require 'thallium/assert'
{
    createReport: n
    createLocation: p
    createBase: create
} = require 'thallium/internal'

# Note that this entire section may be flaky on slower machines. Thankfully,
# these have been tested against a slower machine, so it should hopefully not
# be too bad.
t.test 'core (timeouts) (FLAKE)', ->
    push = (ret) -> (ev) ->
        # Any equality tests on either of these are inherently flaky.
        assert.hasOwn ev, 'duration'
        assert.number ev.duration
        assert.hasOwn ev, 'slow'
        assert.number ev.slow
        if ev.pass or ev.fail or ev.enter
            ev.duration = 10
            ev.slow = 75
        else
            ev.duration = -1
            ev.slow = 0
        ret.push(ev)

    t.test 'succeeds with own', ->
        tt = create()
        ret = []

        tt.reporter push(ret)

        tt.test 'test', ->
            # It's highly unlikely the engine will take this long to finish.
            tt.timeout = 10
            then: (resolve) -> resolve()

        tt.run().then ->
            assert.match ret, [
                n 'start', []
                n 'pass', [p('test', 0)]
                n 'end', []
            ]

    t.test 'fails with own', ->
        tt = create()
        ret = []

        tt.reporter push(ret)

        tt.test 'test', ->
            tt.timeout = 50
            # It's highly unlikely the engine will take this long to finish
            then: (resolve) -> setTimeout resolve, 200

        tt.run().then ->
            assert.match ret, [
                n 'start', []
                n 'fail', [p('test', 0)], new Error 'Timeout of 50 reached'
                n 'end', []
            ]

    t.test 'succeeds with inherited', ->
        tt = create()
        ret = []

        tt.reporter push(ret)

        tt.test 'test', ->
            tt.timeout = 50
            tt.test 'inner', -> then: (resolve) -> resolve()

        tt.run().then ->
            assert.match ret, [
                n 'start', []
                n 'enter', [p('test', 0)]
                n 'pass', [p('test', 0), p('inner', 0)]
                n 'leave', [p('test', 0)]
                n 'end', []
            ]

    t.test 'fails with inherited', ->
        tt = create()
        ret = []

        tt.reporter push(ret)

        tt.test 'test', ->
            tt.timeout = 50
            tt.test 'inner', ->
                # It's highly unlikely the engine will take this long to finish.
                then: (resolve) -> setTimeout resolve, 200

        tt.run().then ->
            assert.match ret, [
                n 'start', []
                n 'enter', [p('test', 0)]
                n 'fail', [p('test', 0), p('inner', 0)],
                    new Error 'Timeout of 50 reached'
                n 'leave', [p('test', 0)]
                n 'end', []
            ]

    t.test 'gets own timeout', ->
        tt = create()
        active = raw = undefined

        tt.test 'test', ->
            tt.timeout = 50
            active = tt.call -> @activeTimeout
            raw = tt.call -> @timeout

        tt.run().then ->
            assert.equal active, 50
            assert.equal raw, 50

    t.test 'gets inherited timeout', ->
        tt = create()
        active = raw = undefined

        tt.test 'test', ->
            tt.timeout = 50
            tt.test 'inner', ->
                active = tt.call -> @activeTimeout
                raw = tt.call -> @timeout

        tt.run().then ->
            assert.equal active, 50
            assert.equal raw, 0

    t.test 'gets default timeout', ->
        tt = create()
        active = raw = undefined

        tt.test 'test', ->
            active = tt.call -> @activeTimeout
            raw = tt.call -> @timeout

        tt.run().then ->
            assert.equal active, 2000
            assert.equal raw, 0
