'use strict'

require! {
    mockery
    'require-uncached': requireUncached

    '../../src/index': {t}
    '../../src/assertions': {assertions}
    '../../test-util/base': util
}

hasOwn = Object::hasOwnProperty

suite.skip 'cli (basic)', !->
    core = index = cli = void

    setup !->
        mockery.enable do
            useCleanCache: true
            # That's going to get annoying real quick if these aren't disabled.
            warnOnUnregistered: false

        core = t.base!
        index = t.base!use assertions

        resolve = (mod, opts, callback) ->
            | hasOwn.call util.paths, mod =>
                process.nextTick -> callback null, util.paths[mod]
            | otherwise => util.resolveAsync mod, opts, callback

        resolve.sync = (mod, opts) ->
            | hasOwn.call util.paths, mod => util.paths[mod]
            | otherwise => util.resolve mod, opts

        # Use fresh references for the fixtures.
        mockery.registerMock 'techtonic', index
        mockery.registerMock 'techtonic/core', core
        mockery.registerMock 'techtonic/assertions', assertions
        mockery.registerMock 'resolve', resolve

        # This needs to be required *after* the mocks have taken effect.
        cli = requireUncached '../../src/cli/cli'

    teardown !->
        core = index = cli = void
        mockery.disable!
        mockery.deregisterAll!
        mockery.resetCache!

    test 'fails with no config', (done) ->
        cli (util.fixture 'cli/no-config'), []
        .then do
            -> t.fail 'Expected an error to be thrown'
            (err) -> t.hasOwn err, 'code', 'ENOTESTCONFIG'
