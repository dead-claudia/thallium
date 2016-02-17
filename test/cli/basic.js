"use strict"

var mockery = require("mockery")
var requireUncached = require("require-uncached")

var t = require("../../index.js")
var assertions = require("../../assertions.js")
var util = require("../../test-util/base.js")

var hasOwn = {}.hasOwnProperty

suite("cli (basic)", function () {
    var core, index, cli

    setup(function () {
        mockery.enable({
            useCleanCache: true,
            // That's going to get annoying real quick if these aren't disabled.
            warnOnUnregistered: false,
        })

        core = t.base()
        index = t.base().use(assertions)

        function resolve(mod, opts, callback) {
            if (hasOwn.call(util.paths, mod)) {
                return process.nextTick(function () {
                    callback(null, util.paths[mod])
                })
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
        cli = requireUncached("../../lib/cli/cli.js")
    })

    teardown(function () {
        core = index = cli = null
        mockery.disable()
        mockery.deregisterAll()
        mockery.resetCache()
    })

    test("fails with no config", function (done) {
        var ret = []

        index.reporter(util.push(ret))
        cli(util.fixture("cli/no-config"), [], function (err) {
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
