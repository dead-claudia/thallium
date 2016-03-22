'use strict'

/**
 * Core TDD-style assertions. These are done by a composition of DSLs, since
 * there is *so* much repetition.
 */

require! {
    './util/is': {strictIs, looseIs}
    './util/deep-equal': {deepEqual: deepEqualImpl}
}

toString = Object::toString
hasOwn = Object::hasOwnProperty

looseDeepEqual = (actual, expected) -> deepEqualImpl actual, expected, false
deepEqual = (actual, expected) -> deepEqualImpl actual, expected, true

# This holds everything to be added.
methods = []

/**
 * The core assertions export, as a plugin.
 */
export assertions = !->
    for m in methods
        @define m.name, m.callback

# Little helper so that these functions only need to be created once.
define = (name, callback) -> methods.push {name, callback}

# Much easier to type
negate = (name) -> "not#{name.0.toUpperCase! + name.slice 1}"

# The basic assert. It's almost there for looks, given how easy it is to
# define your own assertions.
sanitize = (message) ->
    if message then "#{message}".replace /(\{\w+\})/g, '\\$1' else ''

define 'assert', (test, message) -> {test, message: sanitize message}
define 'fail', (message) -> {-test, message: sanitize message}

/**
 * These makes many of the common operators much easier to do.
 */
unary = (name, func, notTrue, notFalse) ->
    define name, (x) ->
        test: func x
        actual: x
        message: notTrue

    define (negate name), (x) ->
        test: not func x
        actual: x
        message: notFalse

binary = (name, func, notTrue, notFalse) ->
    define name, (a, b) ->
        test: func a, b
        actual: a
        expected: b
        message: notTrue

    define (negate name), (a, b) ->
        test: not func a, b
        actual: a
        expected: b
        message: notFalse

unary 'ok', (-> it),
    'Expected {actual} to be ok'
    'Expected {actual} to not be ok'

for let type in <[boolean function number object string symbol]>
    unary type, (-> typeof it == type),
        "Expected typeof {actual} to be #{type}"
        "Expected typeof {actual} to not be #{type}"

for let value in [true, false, null, undefined]
    unary "#{value}", (== value),
        "Expected {actual} to be #{value}"
        "Expected {actual} to not be #{value}"

unary 'array', Array.isArray,
    'Expected {actual} to be an array'
    'Expected {actual} to not be an array'

define 'type', (object, type) ->
    test: typeof object == type
    expected: type
    actual: typeof object
    o: object
    message: 'Expected typeof {o} to be {expected}, but found {actual}'

define 'notType', (object, type) ->
    test: typeof object != type
    expected: type
    o: object
    message: 'Expected typeof {o} to not be {expected}'

define 'instanceof', (object, Type) ->
    test: object instanceof Type
    expected: Type
    actual: object.constructor
    o: object
    message: 'Expected {o} to be an instance of {expected}, but found {actual}'

define 'notInstanceof', (object, Type) ->
    test: object not instanceof Type
    expected: Type
    o: object
    message: 'Expected {o} to not be an instance of {expected}'

binary 'equal', strictIs,
    'Expected {actual} to equal {expected}'
    'Expected {actual} to not equal {expected}'

binary 'looseEqual', looseIs,
    'Expected {actual} to loosely equal {expected}'
    'Expected {actual} to not loosely equal {expected}'

binary 'deepEqual', deepEqual,
    'Expected {actual} to deeply equal {expected}'
    'Expected {actual} to not deeply equal {expected}'

binary 'looseDeepEqual', looseDeepEqual,
    'Expected {actual} to loosely equal {expected}'
    'Expected {actual} to not loosely equal {expected}'

has = (name, equals, check, messages) ->
    define name, (object, key, value) ->
        test = check object, key

        if &length >= 3
            test: test and equals object[key], value
            expected: value
            actual: object[key]
            key: key
            object: object
            message: messages.0
        else
            test: test
            expected: key
            actual: object
            message: messages.1

    define negate(name), (object, key, value) ->
        test = not check object, key

        if &length >= 3
            test: test or not equals object[key], value
            actual: value
            key: key
            object: object
            message: messages.2
        else
            test: test
            expected: key
            actual: object
            message: messages.3

has 'hasOwn', strictIs, ((obj, key) -> hasOwn.call obj, key), [
    'Expected {object} to have own key {key} equal to {expected}, but found {actual}'
    'Expected {actual} to have own key {expected}'
    'Expected {object} to not have own key {key} equal to {actual}'
    'Expected {actual} to not have own key {expected}'
]

has 'looseHasOwn', looseIs, ((obj, key) -> hasOwn.call obj, key), [
    'Expected {object} to have own key {key} loosely equal to {expected}, but found {actual}'
    'Expected {actual} to have own key {expected}'
    'Expected {object} to not have own key {key} loosely equal to {actual}'
    'Expected {actual} to not have own key {expected}'
]

has 'hasKey', strictIs, ((obj, key) -> key of obj), [
    'Expected {object} to have key {key} equal to {expected}, but found {actual}'
    'Expected {actual} to have key {expected}'
    'Expected {object} to not have key {key} equal to {actual}'
    'Expected {actual} to not have key {expected}'
]

has 'looseHasKey', looseIs, ((obj, key) -> key of obj), [
    'Expected {object} to have key {key} loosely equal to {expected}, but found {actual}'
    'Expected {actual} to have key {expected}'
    'Expected {object} to not have key {key} loosely equal to {actual}'
    'Expected {actual} to not have key {expected}'
]

getName = (func) ->
    | func.name? => func.name or '<anonymous>'
    | func.displayName? => func.displayName or '<anonymous>'
    | otherwise => '<anonymous>'

throws = (name, check, message) ->
    run = (invert, func, matcher) ->
        try
            func!
        catch e
            test = check matcher, error = e

        not = test if invert

        test: test != false
        expected: matcher
        func: func
        error: error
        message: message matcher, invert, test

    define name, (func, Type) -> run false, func, Type
    define (negate name), (func, matcher) -> run true, func, matcher

throws 'throws',
    (Type, e) -> not Type? or e instanceof Type
    (Type, invert, test) ->
        str = "Expected {func} to #{if invert then 'not ' else ''}throw"

        if Type?
            str += " an instance of #{getName Type}"
            unless invert or test == void
                str += ', but found {error}'

        str

throws 'throwsMatch',
    (matcher, e) ->
        | typeof matcher == 'string' => e.message == matcher
        | (toString.call matcher) == '[object RegExp]' => matcher.test e.message
        # Not accepting objects yet.
        | typeof matcher != 'function' =>
            throw new TypeError "Unexpected matcher type: #{typeof matcher}"
        | otherwise => !!matcher e
    (_, invert, test) ->
        | invert => 'Expected {func} to not throw an error that matches {expected}'
        | test == void => 'Expected {func} to throw an error that matches {expected}, but found no error'
        | otherwise => 'Expected {func} to throw an error that matches {expected}, but found {error}'

len = (name, compare, message) ->
    define name, (object, length) ->
        test: object.length? and compare object.length, +length
        expected: length
        actual: object.length
        object: object
        message: message

# Note: these always fail with NaNs.
len 'length', (==), 'Expected {object} to have length {expected}, but found {actual}'
len 'notLength', (!=), 'Expected {object} to not have length {actual}'
len 'lengthAtLeast', (>=), 'Expected {object} to have length at least {expected}, but found {actual}'
len 'lengthAtMost', (<=), 'Expected {object} to have length at most {expected}, but found {actual}'
len 'lengthAbove', (>), 'Expected {object} to have length above {expected}, but found {actual}'
len 'lengthBelow', (<), 'Expected {object} to have length below {expected}, but found {actual}'

# Note: these two always fail when dealing with NaNs.

define 'closeTo', (actual, expected, delta) ->
    test: (Math.abs actual - expected) <= (Math.abs delta)
    actual: actual
    expected: expected
    delta: delta
    message: 'Expected {actual} to be within {delta} of {expected}'

define 'notCloseTo', (actual, expected, delta) ->
    test: (Math.abs actual - expected) > (Math.abs delta)
    actual: actual
    expected: expected
    delta: delta
    message: 'Expected {actual} to not be within {delta} of {expected}'

/**
 * There's 4 sets of 4 permutations here instead of N sets of 2 (which would
 * fit the `foo`/`notFoo` idiom better), so it's easier to just make a
 * functional DSL and use that to define everything.
 *
 * Here's the top level:
 *
 * - strict includes
 * - loose includes
 * - strict deep includes
 * - loose deep includes
 *
 * And the second level (below uses 'any' instead of 'some' in its idioms):
 *
 * - includes all/not missing some
 * - including some/not missing all
 * - not including all/missing some
 * - not including some/missing all
 *
 * A near-identical DSL is used to define the hasKeys set as well, although
 * the internals use it to also overload all of them to consume either an
 * array (in which it simply searches keys) or an object (where it does a
 * full comparison). Do note that most of the hasKeys set are effectively
 * aliases for half of the methods if called with an array, since no actual
 * property access occurs.
 */

makeIncludes = (all, func, array, keys) -->
    | all => keys.every (key) -> array.some (i) -> func key, i
    | otherwise => keys.some (key) -> array.some (i) -> func key, i

defineIncludes = (name, func, invert, message) ->
    base = (array, keys, func) ->
        # Cheap cases first
        | not Array.isArray array => false
        | array == keys => true
        | array.length < keys.length => false
        | otherwise => func array, keys

    define name, (array, keys) ->
        keys = [keys] unless Array.isArray keys
        # exclusive or to invert the result if `invert` is true
        test: not keys.length or invert xor base array, keys, func
        actual: array
        keys: keys
        message: message

includesAll = makeIncludes true, strictIs
includesAny = makeIncludes false, strictIs

defineIncludes 'includes', includesAll, false, 'Expected {actual} to have all values in {keys}'
defineIncludes 'notIncludesAll', includesAll, true, 'Expected {actual} to not have all values in {keys}'
defineIncludes 'includesAny', includesAny, false, 'Expected {actual} to have any value in {keys}'
defineIncludes 'notIncludes', includesAny, true, 'Expected {actual} to not have any value in {keys}'

includesLooseAll = makeIncludes true, looseIs
includesLooseAny = makeIncludes false, looseIs

defineIncludes 'includesLoose', includesLooseAll, false, 'Expected {actual} to loosely have all values in {keys}'
defineIncludes 'notIncludesLooseAll', includesLooseAll, true, 'Expected {actual} to loosely not have all values in {keys}'
defineIncludes 'includesLooseAny', includesLooseAny, false, 'Expected {actual} to loosely have any value in {keys}'
defineIncludes 'notIncludesLoose', includesLooseAny, true, 'Expected {actual} to loosely not have any value in {keys}'

includesDeepAll = makeIncludes true, deepEqual
includesDeepAny = makeIncludes false, deepEqual

defineIncludes 'includesDeep', includesDeepAll, false, 'Expected {actual} to match all values in {keys}'
defineIncludes 'notIncludesDeepAll', includesDeepAll, true, 'Expected {actual} to not match all values in {keys}'
defineIncludes 'includesDeepAny', includesDeepAny, false, 'Expected {actual} to match any value in {keys}'
defineIncludes 'notIncludesDeep', includesDeepAny, true, 'Expected {actual} to not match any value in {keys}'

includesLooseDeepAll = makeIncludes true, looseDeepEqual
includesLooseDeepAny = makeIncludes false, looseDeepEqual

defineIncludes 'includesLooseDeep', includesLooseDeepAll, false, 'Expected {actual} to loosely match all values in {keys}'
defineIncludes 'notIncludesLooseDeepAll', includesLooseDeepAll, true, 'Expected {actual} to loosely not match all values in {keys}'
defineIncludes 'includesLooseDeepAny', includesLooseDeepAny, false, 'Expected {actual} to loosely match any value in {keys}'
defineIncludes 'notIncludesLooseDeep', includesLooseDeepAny, true, 'Expected {actual} to loosely not match any value in {keys}'

isEmpty = (object) ->
    | Array.isArray object => object.length == 0
    | typeof object != 'object' or not object? => true
    | otherwise => Object.keys object .length == 0

makeHasKeys = (name, methods, invert, message) ->
    base = (object, keys, methods) ->
        # Cheap case first
        | object == keys => true
        | Array.isArray keys => methods.array object, keys
        | otherwise => methods.object object, keys

    define name, (object, keys) ->
        keys = [keys] unless typeof keys == 'object' and keys
        # exclusive or to invert the result if `invert` is true
        test: isEmpty keys or invert xor base object, keys, methods
        actual: object
        keys: keys
        message: message

hasKeysType = (all, func) ->
    object: (object, keys) ->
        f = (k) -> hasOwn.call object, k and func keys[k], object[k]
        typeof keys != 'object' or not keys? or if all
            Object.keys keys .every f
        else
            Object.keys keys .some f

    array: (object, keys) ->
        | all => keys.every (k) -> hasOwn.call object, k
        | otherwise => keys.some (k) -> hasOwn.call object, k

hasAllKeys = hasKeysType true, strictIs
hasAnyKeys = hasKeysType false, strictIs

makeHasKeys 'hasKeys', hasAllKeys, false, 'Expected {actual} to have all keys in {keys}'
makeHasKeys 'notHasAllKeys', hasAllKeys, true, 'Expected {actual} to not have all keys in {keys}'
makeHasKeys 'hasAnyKeys', hasAnyKeys, false, 'Expected {actual} to have any key in {keys}'
makeHasKeys 'notHasKeys', hasAnyKeys, true, 'Expected {actual} to not have any key in {keys}'

hasLooseAllKeys = hasKeysType true, looseIs
hasLooseAnyKeys = hasKeysType false, looseIs

makeHasKeys 'hasLooseKeys', hasLooseAllKeys, false, 'Expected {actual} to loosely have all keys in {keys}'
makeHasKeys 'notHasLooseAllKeys', hasLooseAllKeys, true, 'Expected {actual} to loosely not have all keys in {keys}'
makeHasKeys 'hasLooseAnyKeys', hasLooseAnyKeys, false, 'Expected {actual} to loosely have any key in {keys}'
makeHasKeys 'notHasLooseKeys', hasLooseAnyKeys, true, 'Expected {actual} to loosely not have any key in {keys}'

hasDeepAllKeys = hasKeysType true, deepEqual
hasDeepAnyKeys = hasKeysType false, deepEqual

makeHasKeys 'hasDeepKeys', hasDeepAllKeys, false, 'Expected {actual} to match all keys in {keys}'
makeHasKeys 'notHasDeepAllKeys', hasDeepAllKeys, true, 'Expected {actual} to not match all keys in {keys}'
makeHasKeys 'hasDeepAnyKeys', hasDeepAnyKeys, false, 'Expected {actual} to match any key in {keys}'
makeHasKeys 'notHasDeepKeys', hasDeepAnyKeys, true, 'Expected {actual} to not match any key in {keys}'

hasLooseDeepAllKeys = hasKeysType true, looseDeepEqual
hasLooseDeepAnyKeys = hasKeysType false, looseDeepEqual

makeHasKeys 'hasLooseDeepKeys', hasLooseDeepAllKeys, false, 'Expected {actual} to loosely match all keys in {keys}'
makeHasKeys 'notHasLooseDeepAllKeys', hasLooseDeepAllKeys, true, 'Expected {actual} to loosely not match all keys in {keys}'
makeHasKeys 'hasLooseDeepAnyKeys', hasLooseDeepAnyKeys, false, 'Expected {actual} to loosely match any key in {keys}'
makeHasKeys 'notHasLooseDeepKeys', hasLooseDeepAnyKeys, true, 'Expected {actual} to loosely not match any key in {keys}'
