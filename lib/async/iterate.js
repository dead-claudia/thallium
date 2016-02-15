"use strict"

var messages = require("../constants.js").messages
var isThenable = require("../util/util.js").isThenable
var timers = require("../util/timers.js")
var o = require("../util/option.js")

// Only use this if it's already known to be a thenable.
function resolveKnownThenable(value, pass, fail) {
    var resolved = false

    return value.then(
        function (value) {
            if (resolved) return undefined
            resolved = true
            return timers.poll(pass, value)
        },
        function (err) {
            if (resolved) return undefined
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
    function castOption(result) {
        return typeof result === "object" ? result : undefined
    }

    // This implements IteratorClose from ES6, section 7.4.6, but adapted
    // for this, and waits for promise resolution. The iterators need to be
    // able to clean up.
    function close(isSuccess, value) {
        if (gen.return === undefined) {
            return (isSuccess ? pass : fail)(value)
        }

        var defer = false

        if (isSuccess) {
            try {
                o(gen.return()).map(castOption).else(function () {
                    throw new TypeError(messages.iteratorReturn)
                }).map(function (res) {
                    var maybe = res.value

                    if (isThenable(maybe)) {
                        defer = true
                        return resolveKnownThenable(maybe, pass, fail)
                    } else {
                        return undefined
                    }
                })

                // If an error was thrown, it won't get this far.
                if (defer) return undefined
            } catch (e) {
                return fail(e)
            }

            return pass(value)
        }

        try {
            o(gen.return()).map(castOption).map(function (res) {
                // It's okay to not complain about an incorrect shape, since
                // errors are normally suppressed here, anyways.
                var thenable = res.value

                if (isThenable(thenable)) {
                    defer = true
                    return resolveKnownThenable(
                        thenable,
                        function () { return fail(value) },
                        function () { return fail(value) })
                } else {
                    return undefined
                }
            })

            if (defer) return undefined
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
        o(result).map(castOption).then(function (result) {
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
        }, function () {
            var message = success
                ? messages.iteratorNext
                : messages.iteratorThrow

            return timers.nextTick(tryHandle, false, new TypeError(message))
        })
    }

    var initial

    try {
        initial = gen.next()
    } catch (ex) {
        return fail(ex)
    }

    return handle(true, initial)
}
