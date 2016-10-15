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
    push = (ret) -> (arg) ->
        # Any equality tests on either of these are inherently flaky.
        assert.hasOwn arg, 'duration'
        assert.number arg.duration
        assert.hasOwn arg, 'slow'
        assert.number arg.slow
        if arg.pass() or arg.fail() or arg.enter()
            arg.duration = 10
            arg.slow = 75
        else
            arg.duration = -1
            arg.slow = 0
        ret.push(arg)

    @test 'succeeds with own', ->
        tt = create()
        ret = []

        tt.reporter push(ret)

        tt.test 'test', ->
            # It's highly unlikely the engine will take this long to finish.
            @timeout 10
            then: (resolve) -> resolve()

        tt.run().then ->
            assert.match ret, [
                n 'start', []
                n 'pass', [p('test', 0)]
                n 'end', []
            ]

    @test 'fails with own', ->
        tt = create()
        ret = []

        tt.reporter push(ret)

        tt.test 'test', ->
            @timeout 50
            # It's highly unlikely the engine will take this long to finish
            then: (resolve) -> setTimeout resolve, 200

        tt.run().then ->
            assert.match ret, [
                n 'start', []
                n 'fail', [p('test', 0)], new Error 'Timeout of 50 reached'
                n 'end', []
            ]

    @test 'succeeds with inherited', ->
        tt = create()
        ret = []

        tt.reporter push(ret)

        tt.test 'test'
        .timeout 50
        .test 'inner', -> then: (resolve) -> resolve()

        tt.run().then ->
            assert.match ret, [
                n 'start', []
                n 'enter', [p('test', 0)]
                n 'pass', [p('test', 0), p('inner', 0)]
                n 'leave', [p('test', 0)]
                n 'end', []
            ]

    @test 'fails with inherited', ->
        tt = create()
        ret = []

        tt.reporter push(ret)

        tt.test 'test'
        .timeout 50
        .test 'inner', ->
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

    @test 'gets own block timeout', ->
        tt = create()
        active = raw = undefined

        tt.test 'test', ->
            @timeout 50
            active = @call -> @activeTimeout
            raw = @call -> @timeout

        tt.run().then ->
            assert.equal active, 50
            assert.equal raw, 50

    @test 'gets own inline timeout', ->
        tt = create()
        ttt = tt.test('test').timeout 50

        assert.equal ttt.call(-> @activeTimeout), 50
        assert.equal ttt.call(-> @timeout), 50

    @test 'gets inherited block timeout', ->
        tt = create()
        active = raw = undefined

        tt.test 'test'
        .timeout 50
        .test 'inner', ->
            active = @call -> @activeTimeout
            raw = @call -> @timeout

        tt.run().then ->
            assert.equal active, 50
            assert.equal raw, 0

    @test 'gets inherited inline timeout', ->
        tt = create()

        ttt = tt.test 'test'
        .timeout 50
        .test 'inner'

        assert.equal ttt.call(-> @activeTimeout), 50
        assert.equal ttt.call(-> @timeout), 0

    @test 'gets default timeout', ->
        tt = create()
        active = raw = undefined

        tt.test 'test', ->
            active = @call -> @activeTimeout
            raw = @call -> @timeout

        tt.run().then ->
            assert.equal active, 2000
            assert.equal raw, 0
