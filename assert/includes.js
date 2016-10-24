"use strict"

var Util = require("./util.js")
var match = require("../match.js")
var hasOwn = Object.prototype.hasOwnProperty

function makeIncludes(all, func) {
    return function (array, keys) {
        function test(key) {
            for (var i = 0; i < array.length; i++) {
                if (func(key, array[i])) return true
            }
            return false
        }

        if (all) {
            if (array.length < keys.length) return false

            for (var i = 0; i < keys.length; i++) {
                if (!test(keys[i])) return false
            }
            return true
        } else {
            for (var j = 0; j < keys.length; j++) {
                if (test(keys[j])) return true
            }
            return false
        }
    }
}

function defineIncludes(func, invert, message) {
    function base(array, values) {
        // Cheap cases first
        if (!Array.isArray(array)) return false
        if (array === values) return true
        return func(array, values)
    }

    return function (array, values) {
        if (!Array.isArray(array)) {
            throw new TypeError("`array` must be an array")
        }

        if (!Array.isArray(values)) values = [values]

        // exclusive or to invert the result if `invert` is true
        if (values.length && invert ^ !base(array, values)) {
            Util.fail(message, {actual: array, values: values})
        }
    }
}

var includesAll = makeIncludes(true, Util.strictIs)
var includesAny = makeIncludes(false, Util.strictIs)

/* eslint-disable max-len */

exports.includes = defineIncludes(includesAll, false, "Expected {actual} to have all values in {values}")
exports.notIncludesAll = defineIncludes(includesAll, true, "Expected {actual} to not have all values in {values}")
exports.includesAny = defineIncludes(includesAny, false, "Expected {actual} to have any value in {values}")
exports.notIncludes = defineIncludes(includesAny, true, "Expected {actual} to not have any value in {values}")

var includesLooseAll = makeIncludes(true, Util.looseIs)
var includesLooseAny = makeIncludes(false, Util.looseIs)

exports.includesLoose = defineIncludes(includesLooseAll, false, "Expected {actual} to loosely have all values in {values}")
exports.notIncludesLooseAll = defineIncludes(includesLooseAll, true, "Expected {actual} to not loosely have all values in {values}")
exports.includesLooseAny = defineIncludes(includesLooseAny, false, "Expected {actual} to loosely have any value in {values}")
exports.notIncludesLoose = defineIncludes(includesLooseAny, true, "Expected {actual} to not loosely have any value in {values}")

var includesDeepAll = makeIncludes(true, match.strict)
var includesDeepAny = makeIncludes(false, match.strict)

exports.includesDeep = defineIncludes(includesDeepAll, false, "Expected {actual} to match all values in {values}")
exports.notIncludesDeepAll = defineIncludes(includesDeepAll, true, "Expected {actual} to not match all values in {values}")
exports.includesDeepAny = defineIncludes(includesDeepAny, false, "Expected {actual} to match any value in {values}")
exports.notIncludesDeep = defineIncludes(includesDeepAny, true, "Expected {actual} to not match any value in {values}")

var includesMatchAll = makeIncludes(true, match.match)
var includesMatchAny = makeIncludes(false, match.match)

exports.includesMatch = defineIncludes(includesMatchAll, false, "Expected {actual} to match all values in {values}")
exports.notIncludesMatchAll = defineIncludes(includesMatchAll, true, "Expected {actual} to not match all values in {values}")
exports.includesMatchAny = defineIncludes(includesMatchAny, false, "Expected {actual} to match any value in {values}")
exports.notIncludesMatch = defineIncludes(includesMatchAny, true, "Expected {actual} to not match any value in {values}")

/* eslint-enable max-len */

function isEmpty(object) {
    if (Array.isArray(object)) return object.length === 0
    if (typeof object !== "object" || object === null) return true
    return Object.keys(object).length === 0
}

function makeHasOverload(methods, invert, message) {
    function base(object, keys) {
        // Cheap case first
        if (object === keys) return true
        if (Array.isArray(keys)) return methods.array(object, keys)
        return methods.object(object, keys)
    }

    if (invert) {
        return function (object, keys) {
            if (typeof object !== "object" || object == null) {
                throw new TypeError("`object` must be a number")
            }

            if (!isEmpty(keys) && base(object, keys)) {
                Util.fail(message, {actual: object, keys: keys})
            }
        }
    } else {
        return function (object, keys) {
            if (typeof object !== "object" || object == null) {
                throw new TypeError("`object` must be a number")
            }

            if (!isEmpty(keys) && !base(object, keys)) {
                Util.fail(message, {actual: object, keys: keys})
            }
        }
    }
}

function makeHasKeys(func, invert, message) {
    if (invert) {
        return function (object, keys) {
            if (typeof object !== "object" || object == null) {
                throw new TypeError("`object` must be a number")
            }

            // exclusive or to invert the result if `invert` is true
            if (!isEmpty(keys) && (object === keys || func(object, keys))) {
                Util.fail(message, {actual: object, keys: keys})
            }
        }
    } else {
        return function (object, keys) {
            if (typeof object !== "object" || object == null) {
                throw new TypeError("`object` must be a number")
            }

            // exclusive or to invert the result if `invert` is true
            if (!isEmpty(keys) && object !== keys && !func(object, keys)) {
                Util.fail(message, {actual: object, keys: keys})
            }
        }
    }
}

function hasKeysType(all, func) {
    return function (object, keys) {
        if (typeof keys !== "object") return true
        if (keys === null) return true

        function check(key) {
            return hasOwn.call(object, key) && func(keys[key], object[key])
        }

        if (all) {
            for (var key1 in keys) {
                if (hasOwn.call(keys, key1) && !check(key1)) {
                    return false
                }
            }
            return true
        } else {
            for (var key2 in keys) {
                if (hasOwn.call(keys, key2) && check(key2)) {
                    return true
                }
            }
            return false
        }
    }
}

function hasOverloadType(all, func) {
    return {
        object: hasKeysType(all, func),
        array: function (object, keys) {
            if (all) {
                for (var i = 0; i < keys.length; i++) {
                    if (!hasOwn.call(object, keys[i])) return false
                }
                return true
            } else {
                for (var j = 0; j < keys.length; j++) {
                    if (hasOwn.call(object, keys[j])) return true
                }
                return false
            }
        },
    }
}

/* eslint-disable max-len */

var hasAllKeys = hasOverloadType(true, Util.strictIs)
var hasAnyKeys = hasOverloadType(false, Util.strictIs)

exports.hasKeys = makeHasOverload(hasAllKeys, false, "Expected {actual} to have all keys in {keys}")
exports.notHasAllKeys = makeHasOverload(hasAllKeys, true, "Expected {actual} to not have all keys in {keys}")
exports.hasAnyKeys = makeHasOverload(hasAnyKeys, false, "Expected {actual} to have any key in {keys}")
exports.notHasKeys = makeHasOverload(hasAnyKeys, true, "Expected {actual} to not have any key in {keys}")

var hasLooseAllKeys = hasOverloadType(true, Util.looseIs)
var hasLooseAnyKeys = hasOverloadType(false, Util.looseIs)

exports.hasLooseKeys = makeHasOverload(hasLooseAllKeys, false, "Expected {actual} to loosely have all keys in {keys}")
exports.notHasLooseAllKeys = makeHasOverload(hasLooseAllKeys, true, "Expected {actual} to not loosely have all keys in {keys}")
exports.hasLooseAnyKeys = makeHasOverload(hasLooseAnyKeys, false, "Expected {actual} to loosely have any key in {keys}")
exports.notHasLooseKeys = makeHasOverload(hasLooseAnyKeys, true, "Expected {actual} to not loosely have any key in {keys}")

var hasDeepAllKeys = hasKeysType(true, match.strict)
var hasDeepAnyKeys = hasKeysType(false, match.strict)

exports.hasDeepKeys = makeHasKeys(hasDeepAllKeys, false, "Expected {actual} to have all keys in {keys}")
exports.notHasDeepAllKeys = makeHasKeys(hasDeepAllKeys, true, "Expected {actual} to not have all keys in {keys}")
exports.hasDeepAnyKeys = makeHasKeys(hasDeepAnyKeys, false, "Expected {actual} to have any key in {keys}")
exports.notHasDeepKeys = makeHasKeys(hasDeepAnyKeys, true, "Expected {actual} to not have any key in {keys}")

var hasMatchAllKeys = hasKeysType(true, match.match)
var hasMatchAnyKeys = hasKeysType(false, match.match)

exports.hasMatchKeys = makeHasKeys(hasMatchAllKeys, false, "Expected {actual} to match all keys in {keys}")
exports.notHasMatchAllKeys = makeHasKeys(hasMatchAllKeys, true, "Expected {actual} to not match all keys in {keys}")
exports.hasMatchAnyKeys = makeHasKeys(hasMatchAnyKeys, false, "Expected {actual} to match any key in {keys}")
exports.notHasMatchKeys = makeHasKeys(hasMatchAnyKeys, true, "Expected {actual} to not match any key in {keys}")
