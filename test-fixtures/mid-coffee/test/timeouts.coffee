'use strict'

###
Note: updates to this should also be reflected in test/core/timeouts.js, as this
is trying to represent more real-world usage.
###

t = require 'thallium'
{n, p} = Util = require '../../../test-util/base.js'

# Note that this entire section may be flaky on slower machines. Thankfully,
# these have been tested against a slower machine, so it should hopefully not
# be too bad.
t.test 'core (timeouts)', ->
    @async 'succeeds with own', ->
        tt = @base()
        ret = []

        tt.reporter Util.push(ret)

        tt.async 'test', (_, done) ->
            # It's highly unlikely the engine will take this long to finish.
            @timeout(10)
            done()

        tt.run().then =>
            @match ret, [
                n 'start', []
                n 'pass', [p('test', 0)]
                n 'end', []
            ]

    @async 'fails with own', ->
        tt = @base()
        ret = []

        tt.reporter Util.push(ret)

        tt.async 'test', (_, done) ->
            @timeout(50)
            # It's highly unlikely the engine will take this long to finish
            setTimeout((-> done()), 200)

        tt.run().then =>
            @match ret, [
                n 'start', []
                n 'fail', [p('test', 0)], new Error 'Timeout of 50 reached.'
                n 'end', []
            ]

    @async 'succeeds with inherited', ->
        tt = @base()
        ret = []

        tt.reporter Util.push(ret)

        tt.test 'test'
        .timeout 50
        .async 'inner', (_, done) -> done()

        tt.run().then =>
            @match ret, [
                n 'start', []
                n 'enter', [p('test', 0)]
                n 'pass', [p('test', 0), p('inner', 0)]
                n 'leave', [p('test', 0)]
                n 'end', []
            ]

    @async 'fails with inherited', ->
        tt = @base()
        ret = []

        tt.reporter Util.push(ret)

        tt.test 'test'
        .timeout 50
        .async 'inner', (_, done) ->
            # It's highly unlikely the engine will take this long to finish.
            setTimeout((-> done()), 200)

        tt.run().then =>
            @match ret, [
                n 'start', []
                n 'enter', [p('test', 0)]
                n 'fail', [p('test', 0), p('inner', 0)],
                    new Error 'Timeout of 50 reached.'
                n 'leave', [p('test', 0)]
                n 'end', []
            ]

    @async 'gets own set timeout', ->
        tt = @base()
        timeout = undefined

        tt.test 'test', ->
            @timeout 50
            timeout = @timeout()

        tt.run().then => @equal(timeout, 50)

    @async 'gets own inline set timeout', ->
        tt = @base()
        timeout = undefined

        tt.test 'test'
        .timeout 50
        .test 'inner', -> timeout = @timeout()

        tt.run().then => @equal(timeout, 50)

    @async 'gets own sync inner timeout', ->
        tt = @base()

        timeout = tt.test 'test'
        .timeout 50
        .test('inner').timeout()

        tt.run().then => @equal(timeout, 50)

    @async 'gets default timeout', ->
        tt = t.base()
        timeout = undefined

        tt.test 'test', -> timeout = @timeout()

        tt.run().then => @equal(timeout, 2000)
