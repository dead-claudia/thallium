"use strict"

/**
 * Backport wrapper to warn about most of the major breaking changes from the
 * last major version.
 *
 * It consists of solely internal monkey patching to revive support of previous
 * versions, although I tried to limit how much knowledge of the internals this
 * requires.
 */

var Common = require("./common")
var methods = require("../lib/methods")
var Thallium = require("../lib/api/thallium")
var Reflect = require("../lib/api/reflect")

// Note: here's a sample template of how each notice should be structured:
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * - `reflect.isFoo()` is deprecated in favor of the `reflect.isFoo` getter. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * - `t.testSkip()` is deprecated in favor of calling `t.skip()` within the  *
 *   test body.                                                              *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
var tlTest = Thallium.prototype.test
var tlSkip = Thallium.prototype.skip

methods(Thallium, {
    testSkip: Common.deprecate(
        "`t.testSkip` is deprecated. Please call `t.skip()` inside the test " +
        "body instead.",
        /** @this */ function (name, callback) { // eslint-disable-line no-unused-vars, max-len
            return tlTest.call(this, name, tlSkip.bind(this))
        }),
})

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * - `reflect.testSkip()` is deprecated in favor of calling `reflect.skip()` *
 *   within the test body.                                                   *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
var reflectTest = Thallium.prototype.test
var reflectSkip = Thallium.prototype.skip

methods(Reflect, {
    testSkip: Common.deprecate(
        "`reflect.testSkip` is deprecated. Please call `reflect.skip()` " +
        "inside the test body instead.",
        /** @this */ function (name, callback) { // eslint-disable-line no-unused-vars, max-len
            return reflectTest.call(this, name, reflectSkip.bind(this))
        }),
})
