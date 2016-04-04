"use strict"

var mockery = require("mockery")
var requireUncached = require("require-uncached")

var t = require("../../index.js")
var assertions = require("../../assertions.js")
var Util = require("../../test-util/base.js")

var hasOwn = Object.prototype.hasOwnProperty

describe.skip("cli (basic)", function () {
    var core, index, cli

    beforeEach(function () {
        mockery.enable({
            useCleanCache: true,
            // Too noisy when this complains of unregistered modules.
            warnOnUnregistered: false,
        })

        core = t.base()
        index = t.base().use(assertions)

        function resolve(mod, opts, callback) {
            if (hasOwn.call(Util.paths, mod)) {
                process.nextTick(function () {
                    callback(null, Util.paths[mod])
                })
            } else {
                Util.resolveAsync(mod, opts, callback)
            }
        }

        resolve.sync = function (mod, opts) {
            if (hasOwn.call(Util.paths, mod)) {
                return Util.paths[mod]
            } else {
                return Util.resolve(mod, opts)
            }
        }

        // Use fresh references for the fixtures.
        mockery.registerMock("techtonic", index)
        mockery.registerMock("techtonic/core", core)
        mockery.registerMock("techtonic/assertions", assertions)
        mockery.registerMock("resolve", resolve)

        // This needs to be required *after* the mocks have taken effect.
        cli = requireUncached("../../lib/cli/cli")
    })

    afterEach(function () {
        core = index = cli = undefined
        mockery.disable()
        mockery.deregisterAll()
        mockery.resetCache()
    })

    it("fails with no config", function () {
        return cli(Util.fixture("cli/no-config"), [])
        .then(
            function () { t.fail("Expected an error to be thrown") },
            function (err) { t.hasOwn(err, "code", "ENOTESTCONFIG") })
    })
})
