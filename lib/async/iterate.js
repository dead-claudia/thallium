"use strict"

var messages = require("../constants.js").messages
var util = require("../util/util.js")
var bind = util.bind
var isThenable = util.isThenable
var timers = require("../util/timers.js")
var o = require("../util/option.js")
var methods = require("../util/methods.js")

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
function castOption(result) {
    return typeof result === "object" ? result : undefined
}

function Iterator(gen, pass, fail) {
    this.gen = gen
    this.pass = pass
    this.fail = fail
}

methods(Iterator, {
    // This implements IteratorClose from ES6, section 7.4.6, but adapted
    // for this, and waits for promise resolution. The iterators need to be
    // able to clean up.
    close: function (isSuccess, value) {
        if (this.gen.return === undefined) {
            return (isSuccess ? this.pass : this.fail)(value)
        }

        var defer = false
        var self = this

        if (isSuccess) {
            try {
                o(this.gen.return()).map(castOption).else(function () {
                    throw new TypeError(messages.iteratorReturn)
                }).map(function (res) {
                    var maybe = res.value

                    if (isThenable(maybe)) {
                        defer = true
                        return resolveKnownThenable(maybe, self.pass, self.fail)
                    } else {
                        return undefined
                    }
                })

                // If an error was thrown, it won't get this far.
                if (defer) return undefined
            } catch (e) {
                return (0, this.fail)(e)
            }

            return (0, this.pass)(value)
        }

        try {
            o(this.gen.return()).map(castOption).map(function (res) {
                // It's okay to not complain about an incorrect shape, since
                // errors are normally suppressed here, anyways.
                var thenable = res.value

                if (isThenable(thenable)) {
                    defer = true
                    return resolveKnownThenable(
                        thenable,
                        function () { return (0, self.fail)(value) },
                        function () { return (0, self.fail)(value) })
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

        return timers.nextTick(this.fail, value)
    },

    tryHandle: function (success, value) {
        var result

        try {
            if (success) {
                result = this.gen.next(value)
            } else if (typeof this.gen.throw === "function") {
                result = this.gen.throw(value)
            } else {
                // If it's an error, and there's no `throw` to handle it,
                // then it should close the iterator.
                throw value
            }
        } catch (e) {
            return this.close(false, e)
        }

        return this.handle(success, result)
    },

    handle: function (success, result) {
        var self = this

        o(result).map(castOption).then(function (result) {
            var value = result.value

            if (result.done) {
                if (isThenable(value)) {
                    return timers.nextTick(resolveThenable, value,
                        bind(self.close, self))
                } else {
                    return timers.nextTick(bind(self.close, self), true, value)
                }
            } else if (isThenable(value)) {
                return timers.nextTick(resolveThenable, value,
                    bind(self.tryHandle, self))
            } else {
                return timers.nextTick(bind(self.tryHandle, self), true, value)
            }
        }, function () {
            var message = success
                ? messages.iteratorNext
                : messages.iteratorThrow

            return timers.nextTick(bind(self.tryHandle, self), false,
                new TypeError(message))
        })
    },

    run: function () {
        var initial

        try {
            initial = this.gen.next()
        } catch (ex) {
            return timers.nextTick(bind(this.fail, this), ex)
        }

        return this.handle(true, initial)
    },
})

module.exports = function (gen, pass, fail) {
    return new Iterator(gen, pass, fail).run()
}
