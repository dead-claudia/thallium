'use strict'

###
Note: updates to this should also be reflected in test/core/timeouts.js, as this
is trying to represent more real-world usage.
###

t = require 'thallium'
assert = require 'thallium/assert'
{Report, Location, toReportType} = require '../../../lib/tests.js'

# Note that this entire section may be flaky on slower machines. Thankfully,
# these have been tested against a slower machine, so it should hopefully not
# be too bad.
t.test 'core (timeouts) (FLAKE)', ->
    n = @reflect().report
    p = @reflect().loc

    push = (ret) -> (arg, done) ->
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
        done()

    @async 'succeeds with own', ->
        tt = @create()
        ret = []

        tt.reporter push(ret)

        tt.async 'test', (_, done) ->
            # It's highly unlikely the engine will take this long to finish.
            @timeout 10
            done()

        tt.run().then ->
            assert.match ret, [
                n 'start', []
                n 'pass', [p('test', 0)]
                n 'end', []
            ]

    @async 'fails with own', ->
        tt = @create()
        ret = []

        tt.reporter push(ret)

        tt.async 'test', (_, done) ->
            @timeout 50
            # It's highly unlikely the engine will take this long to finish
            setTimeout (-> done()), 200

        tt.run().then ->
            assert.match ret, [
                n 'start', []
                n 'fail', [p('test', 0)], new Error 'Timeout of 50 reached'
                n 'end', []
            ]

    @async 'succeeds with inherited', ->
        tt = @create()
        ret = []

        tt.reporter push(ret)

        tt.test 'test'
        .timeout 50
        .async 'inner', (_, done) -> done()

        tt.run().then ->
            assert.match ret, [
                n 'start', []
                n 'enter', [p('test', 0)]
                n 'pass', [p('test', 0), p('inner', 0)]
                n 'leave', [p('test', 0)]
                n 'end', []
            ]

    @async 'fails with inherited', ->
        tt = @create()
        ret = []

        tt.reporter push(ret)

        tt.test 'test'
        .timeout 50
        .async 'inner', (_, done) ->
            # It's highly unlikely the engine will take this long to finish.
            setTimeout (-> done()), 200

        tt.run().then ->
            assert.match ret, [
                n 'start', []
                n 'enter', [p('test', 0)]
                n 'fail', [p('test', 0), p('inner', 0)],
                    new Error 'Timeout of 50 reached'
                n 'leave', [p('test', 0)]
                n 'end', []
            ]

    @async 'gets own block timeout', ->
        tt = @create()
        active = raw = undefined

        tt.test 'test', ->
            @timeout 50
            active = @reflect().activeTimeout()
            raw = @reflect().timeout()

        tt.run().then ->
            assert.equal active, 50
            assert.equal raw, 50

    @test 'gets own inline timeout', ->
        tt = @create()
        ttt = tt.test('test').timeout 50

        assert.equal ttt.reflect().activeTimeout(), 50
        assert.equal ttt.reflect().timeout(), 50

    @async 'gets inherited block timeout', ->
        tt = @create()
        active = raw = undefined

        tt.test 'test'
        .timeout 50
        .test 'inner', ->
            active = @reflect().activeTimeout()
            raw = @reflect().timeout()

        tt.run().then ->
            assert.equal active, 50
            assert.equal raw, 0

    @test 'gets inherited inline timeout', ->
        tt = @create()

        ttt = tt.test 'test'
        .timeout 50
        .test 'inner'

        assert.equal ttt.reflect().activeTimeout(), 50
        assert.equal ttt.reflect().timeout(), 0

    @async 'gets default timeout', ->
        tt = @create()
        active = raw = undefined

        tt.test 'test', ->
            active = @reflect().activeTimeout()
            raw = @reflect().timeout()

        tt.run().then ->
            assert.equal active, 2000
            assert.equal raw, 0
