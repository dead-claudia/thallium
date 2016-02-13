"use strict"

var messages = require("../constants.js").messages
var isThenable = require("../util.js").isThenable
var timers = require("../timers.js")

// Only use this if it's already known to be a thenable.
function resolveKnownThenable(value, pass, fail) {
    var resolved = false
    return value.then(
        function (value) {
            if (resolved) return
            resolved = true
            return timers.poll(pass, value)
        },
        function (err) {
            if (resolved) return
            resolved = true
            return timers.poll(fail, err)
        })
}

function resolveThenable(value, callback) {
    try {
        return resolveKnownThenable(
            value,
            function (v) { return callback(true, v) },
            function (v) { return callback(false, v) })
    } catch (err) {
        return callback(false, err)
    }
}

// Adapted from https://www.promisejs.org/generators/
module.exports = iterate
function iterate(gen, pass, fail) {
    // This implements IteratorClose from ES6, section 7.4.6, but adapted
    // for this, and waits for promise resolution. The iterators need to be
    // able to clean up.
    function close(isSuccess, value) {
        if (gen.return === undefined) {
            return (isSuccess ? pass : fail)(value)
        }

        var result

        if (isSuccess) {
            try {
                result = gen.return()
                if (result == null || typeof result !== "object") {
                    return fail(new TypeError(messages.iteratorReturn))
                }

                value = result.value

                if (isThenable(value)) {
                    return resolveKnownThenable(value, pass, fail)
                }
            } catch (e) {
                return fail(e)
            }

            return pass(value)
        }

        try {
            result = gen.return()
            // It's okay to not complain about an incorrect shape, since
            // errors are normally suppressed, anyways.
            if (result != null && typeof result === "object") {
                var thenable = result.value

                if (isThenable(thenable)) {
                    return resolveKnownThenable(
                        thenable,
                        function () { return fail(value) },
                        function () { return fail(value) })
                }
            }
        } catch (_) {
            // Errors are ignored when closing an iterator from an abrupt
            // completion. In this case, `finally` isn't used because of the
            // early return in the `try` body.
        }

        return timers.nextTick(fail, value)
    }

    function tryHandle(success, value) {
        var result
        try {
            if (success) {
                result = gen.next(value)
            } else if (typeof gen.throw === "function") {
                result = gen.throw(value)
            } else {
                // If it's an error, and there's no `throw` to handle it,
                // then it should close the iterator.
                throw value
            }
        } catch (e) {
            return close(false, e)
        }

        return handle(success, result)
    }

    function handle(success, result) {
        if (result == null || typeof result !== "object") {
            var message = success
                ? messages.iteratorNext
                : messages.iteratorThrow
            return timers.nextTick(tryHandle, false, new TypeError(message))
        }

        var value = result.value

        if (result.done) {
            if (isThenable(value)) {
                return timers.nextTick(resolveThenable, value, close)
            } else {
                return timers.nextTick(close, true, value)
            }
        } else if (isThenable(value)) {
            return timers.nextTick(resolveThenable, value, tryHandle)
        } else {
            return timers.nextTick(tryHandle, true, value)
        }
    }

    var initial

    try {
        initial = gen.next()
    } catch (ex) {
        return fail(ex)
    }

    return handle(true, initial)
}
