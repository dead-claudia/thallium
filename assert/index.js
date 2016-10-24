"use strict"

/**
 * Core TDD-style assertions. These are done by a composition of DSLs, since
 * there is *so* much repetition. Also, this is split into several namespaces to
 * keep the file size manageable.
 */

var Util = require("./util.js")
var Type = require("./type.js")
var Equal = require("./equal.js")
var Throws = require("./throws.js")
var Has = require("./has.js")
var Includes = require("./includes.js")
var HasKeys = require("./has-keys.js")

exports.AssertionError = Util.AssertionError

// The basic assert, like `assert.ok`, but gives you an optional message.
exports.assert = function (test, message) {
    if (!test) throw new Util.AssertionError(message)
}

exports.fail = function (message, expected, actual) {
    throw new Util.AssertionError(message, expected, actual)
}

exports.escapeFormat = Util.escape
exports.failFormat = Util.fail
exports.ok = Type.ok
exports.notOk = Type.notOk
exports.boolean = Type.boolean
exports.notBoolean = Type.notBoolean
exports.function = Type.function
exports.notFunction = Type.notFunction
exports.number = Type.number
exports.notNumber = Type.notNumber
exports.object = Type.object
exports.notObject = Type.notObject
exports.string = Type.string
exports.notString = Type.notString
exports.symbol = Type.symbol
exports.notSymbol = Type.notSymbol
exports.exists = Type.exists
exports.notExists = Type.notExists
exports.array = Type.array
exports.notArray = Type.notArray
exports.is = Type.is
exports.notIs = Type.notIs
exports.length = Type.length
exports.notLength = Type.notLength
exports.lengthAtLeast = Type.lengthAtLeast
exports.lengthAtMost = Type.lengthAtMost
exports.lengthAbove = Type.lengthAbove
exports.lengthBelow = Type.lengthBelow

exports.equal = Equal.equal
exports.notEqual = Equal.notEqual
exports.equalLoose = Equal.equalLoose
exports.notEqualLoose = Equal.notEqualLoose
exports.deepEqual = Equal.deepEqual
exports.notDeepEqual = Equal.notDeepEqual
exports.match = Equal.match
exports.notMatch = Equal.notMatch
exports.atLeast = Equal.atLeast
exports.atMost = Equal.atMost
exports.above = Equal.above
exports.below = Equal.below
exports.between = Equal.between
exports.closeTo = Equal.closeTo
exports.notCloseTo = Equal.notCloseTo

exports.throws = Throws.throws
exports.notThrows = Throws.notThrows
exports.throwsMatch = Throws.throwsMatch
exports.notThrowsMatch = Throws.notThrowsMatch

/* eslint-disable max-len */

/**
 * There's 3 sets of 16 permutations here for `includes` and `hasKeys`, instead
 * of N sets of 2 (which would fit the `foo`/`notFoo` idiom better), so it's
 * easier to just make a couple separate DSLs and use that to define everything.
 *
 * Here's the top level:
 *
 * - shallow
 * - strict deep
 * - structural deep
 *
 * And the second level:
 *
 * - includes all/not missing some
 * - includes some/not missing all
 * - not including all/missing some
 * - not including some/missing all
 *
 * Here's an example using the naming scheme for `hasKeys`, etc.
 *
 *               | strict shallow  |    loose shallow     |     strict deep     |     structural deep
 * --------------|-----------------|----------------------|---------------------|-------------------------
 * includes all  | `hasKeys`       | `hasLooseKeys`       | `hasDeepKeys`       | `hasMatchKeys`
 * includes some | `hasAnyKeys`    | `hasLooseAnyKeys`    | `hasDeepAnyKeys`    | `hasMatchKeys`
 * missing some  | `notHasAllKeys` | `notHasLooseAllKeys` | `notHasDeepAllKeys` | `notHasMatchAllKeys`
 * missing all   | `notHasKeys`    | `notHasLooseKeys`    | `notHasDeepKeys`    | `notHasMatchKeys`
 *
 * Note that the `hasKeys` shallow comparison variants are also overloaded to
 * consume either an array (in which it simply checks against a list of keys) or
 * an object (where it does a full deep comparison).
 */

/* eslint-enable max-len */

exports.hasOwn = Has.hasOwn
exports.notHasOwn = Has.notHasOwn
exports.hasOwnLoose = Has.hasOwnLoose
exports.notHasOwnLoose = Has.notHasOwnLoose
exports.hasKey = Has.hasKey
exports.notHasKey = Has.notHasKey
exports.hasKeyLoose = Has.hasKeyLoose
exports.notHasKeyLoose = Has.notHasKeyLoose
exports.has = Has.has
exports.notHas = Has.notHas
exports.hasLoose = Has.hasLoose
exports.notHasLoose = Has.notHasLoose

exports.includes = Includes.includes
exports.notIncludesAll = Includes.notIncludesAll
exports.includesAny = Includes.includesAny
exports.notIncludes = Includes.notIncludes
exports.includesLoose = Includes.includesLoose
exports.notIncludesLooseAll = Includes.notIncludesLooseAll
exports.includesLooseAny = Includes.includesLooseAny
exports.notIncludesLoose = Includes.notIncludesLoose
exports.includesDeep = Includes.includesDeep
exports.notIncludesDeepAll = Includes.notIncludesDeepAll
exports.includesDeepAny = Includes.includesDeepAny
exports.notIncludesDeep = Includes.notIncludesDeep
exports.includesMatch = Includes.includesMatch
exports.notIncludesMatchAll = Includes.notIncludesMatchAll
exports.includesMatchAny = Includes.includesMatchAny
exports.notIncludesMatch = Includes.notIncludesMatch

exports.hasKeys = HasKeys.hasKeys
exports.notHasAllKeys = HasKeys.notHasAllKeys
exports.hasAnyKeys = HasKeys.hasAnyKeys
exports.notHasKeys = HasKeys.notHasKeys
exports.hasLooseKeys = HasKeys.hasLooseKeys
exports.notHasLooseAllKeys = HasKeys.notHasLooseAllKeys
exports.hasLooseAnyKeys = HasKeys.hasLooseAnyKeys
exports.notHasLooseKeys = HasKeys.notHasLooseKeys
exports.hasDeepKeys = HasKeys.hasDeepKeys
exports.notHasDeepAllKeys = HasKeys.notHasDeepAllKeys
exports.hasDeepAnyKeys = HasKeys.hasDeepAnyKeys
exports.notHasDeepKeys = HasKeys.notHasDeepKeys
exports.hasMatchKeys = HasKeys.hasMatchKeys
exports.notHasMatchAllKeys = HasKeys.notHasMatchAllKeys
exports.hasMatchAnyKeys = HasKeys.hasMatchAnyKeys
exports.notHasMatchKeys = HasKeys.notHasMatchKeys
