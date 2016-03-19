import * as mockery from "mockery"
import requireUncached from "require-uncached"

import t from "../../src/index.js"
import assertions from "../../src/assertions.js"
import * as util from "../../test-util/base.js"

const hasOwn = {}.hasOwnProperty

suite.skip("cli (basic)", () => {
    let core, index, cli

    setup(() => {
        mockery.enable({
            useCleanCache: true,
            // That's going to get annoying real quick if these aren't disabled.
            warnOnUnregistered: false,
        })

        core = t.base()
        index = t.base().use(assertions)

        function resolve(mod, opts, callback) {
            if (hasOwn.call(util.paths, mod)) {
                return process.nextTick(() => callback(null, util.paths[mod]))
            } else {
                return util.resolveAsync(mod, opts, callback)
            }
        }

        resolve.sync = function (mod, opts) {
            if (hasOwn.call(util.paths, mod)) {
                return util.paths[mod]
            } else {
                return util.resolve(mod, opts)
            }
        }

        // Use fresh references for the fixtures.
        mockery.registerMock("techtonic", index)
        mockery.registerMock("techtonic/core", core)
        mockery.registerMock("techtonic/assertions", assertions)
        mockery.registerMock("resolve", resolve)

        // This needs to be required *after* the mocks have taken effect.
        cli = requireUncached("../../src/cli/cli.js")
    })

    teardown(() => {
        core = index = cli = null
        mockery.disable()
        mockery.deregisterAll()
        mockery.resetCache()
    })

    test("fails with no config", done => {
        cli(util.fixture("cli/no-config"), [], err => {
            try {
                t.ok(err)
                t.hasOwn(err, "code", "ENOTESTCONFIG")
            } catch (e) {
                return done(e)
            }

            return done()
        })
    })
})
