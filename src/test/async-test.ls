'use strict'

require! {
    bluebird: Promise
    '../messages': {m}
    './test': {Test}
    './common': {report}
    '../util/util': {r, isThenable, isIterator}
}

checkResult = (result, message) ->
    unless typeof result == 'object' and result?
        throw new TypeError m message

    result

/**
 * This is a modified version of the async-await official, non-normative
 * desugaring helper, for better error checking and adapted to accept an
 * already-instantiated iterator instead of a generator.
 */
iterate = (gen) -> new Promise (resolve, reject) ->
    step = (func, value, message) ->
        try
            next = checkResult (func.call gen, value), message
        catch e
            # finished with failure, reject the promise
            return reject e

        if next.done
            # finished with success, resolve the promise
            resolve next.value
        else
            # not finished, chain off the yielded promise and `step` again
            Promise.resolve next.value .then do
                (v) -> step gen.next, v, 'type.iterate.next'
                (e) ->
                    if typeof (func = gen.throw) == 'function'
                        step func, e, 'type.iterate.throw'
                    else
                        reject e

    step gen.next, void, 'type.iterate.next'

DEFAULT_TIMEOUT = 2000ms

/**
 * Gets the active timeout for the test. This is exported for use in the API.
 *
 * Note that a timeout of 0 means to inherit the parent.
 */
export getTimeout = (ctx) ->
    until ctx.timeout or ctx.isBase
        ctx = ctx.parent

    ctx.timeout or DEFAULT_TIMEOUT

init = ->
    ctx = @
    methods = Object.create ctx.methods
    methods._ = ctx

    # There's no real way to avoid using the Promise constructor, since
    # it's difficult to handle the cancellation and failing test semantics
    # properly as well.
    new Promise (resolve) !->
        count = 0
        interesting = false
        timer = void

        end = (value) ->
            if timer
                clearTimeout timer
                timer = void

            resolve value

        pass = -> end r 'pass'
        fail = (err) -> end r 'fail', err

        try
            res = ctx.callback.call methods, methods, (err) !->
                # Ignore calls to this if something interesting was
                # already returned.
                | interesting =>
                # Errors are ignored here, since there is no reliable
                # way to handle them after the test ends.
                | count++ => report ctx, r 'extra', count: count, value: err
                | err? => fail err
                | otherwise => pass!

            # It can't be interesting if the result's nullish.
            interesting = res?

            switch
            | isThenable res => Promise.resolve res .then pass, fail
            # No, Bluebird's coroutines don't work.
            | isIterator res => iterate res .then pass, fail
            # Not interesting enough. Mark it as such.
            | otherwise => interesting = false
        catch e
            # Synchronous failures when initializing an async test are test
            # failures, not fatal errors.
            return fail e

        # Start the polling after the initialization. The timeout *must* be
        # synchronously set, but the timer won't be affected by a slow
        # initialization.
        timeout = getTimeout ctx

        # Don't waste time setting a timeout if it was `Infinity`.
        if timeout != Infinity
            timer = setTimeout do
                -> fail new Error m 'async.timeout', timeout
                timeout

export AsyncTest = (methods, name, index, callback) ->
    Test! <<< {methods, name, index, callback, init, parent: methods._}
