"use strict"

var messages = require("../constants.js").messages
var util = require("../util/util.js")
var bind = util.bind
var timers = require("../util/timers.js")
var nextTick = timers.nextTick
var methods = require("../util/methods.js")

// Only use this if it's already known to be a thenable.
function resolveKnown(value, pass, fail) {
    var resolved = false

    return value.then(
        function (value) {
            if (resolved) return undefined
            resolved = true
            return timers.poll(pass, value)
        },
        function (e) {
            if (resolved) return undefined
            resolved = true
            return timers.poll(fail, e)
        })
}

function resolve(value, callback) {
    try {
        return resolveKnown(value,
            function (v) { return callback(true, v) },
            function (v) { return callback(false, v) })
    } catch (err) {
        return callback(false, err)
    }
}

// Adapted from https://www.promisejs.org/generators/
function Iterator(gen, pass, fail) {
    this.gen = gen
    this.pass = pass
    this.fail = fail
}

methods(Iterator, {
    // This implements IteratorClose from ES6, section 7.4.6, but adapted for
    // this, and waits for promise resolution. The iterators need to be able to
    // clean up.
    close: function (isSuccess, value) {
        if (typeof this.gen.return !== "function") {
            return (isSuccess ? this.pass : this.fail)(value)
        }

        try {
            var result = this.gen.return()

            if (typeof result !== "object") {
                throw new TypeError(messages.iteratorReturn)
            }

            var thenable = result.value

            if (util.isThenable(thenable)) {
                if (isSuccess) {
                    return resolveKnown(thenable, this.pass, this.fail)
                } else {
                    var self = this

                    return resolveKnown(thenable,
                        function () { return (0, self.fail)(value) },
                        function () { return (0, self.fail)(value) })
                }
            }
        } catch (e) {
            // Errors are ignored when closing an iterator from an abrupt
            // completion.
            if (isSuccess) return (0, this.fail)(e)
        }

        if (isSuccess) {
            // If an error was thrown, it won't get this far.
            return (0, this.pass)(value)
        } else {
            return nextTick(this.fail, value)
        }
    },

    tryHandle: function (success, value) {
        var result

        try {
            if (success) {
                result = this.gen.next(value)
            } else if (typeof this.gen.throw === "function") {
                result = this.gen.throw(value)
            } else {
                // If it's an error, and there's no `throw` to handle it, then
                // it should close the iterator.
                throw value
            }
        } catch (e) {
            return this.close(false, e)
        }

        return this.handle(success, result)
    },

    handle: function (success, result) {
        if (typeof result === "object") {
            var value = result.value

            if (result.done) {
                if (util.isThenable(value)) {
                    return nextTick(resolve, value, bind(this.close, this))
                } else {
                    return nextTick(bind(this.close, this), true, value)
                }
            } else if (util.isThenable(value)) {
                return nextTick(resolve, value, bind(this.tryHandle, this))
            } else {
                return nextTick(bind(this.tryHandle, this), true, value)
            }
        } else {
            var message = success
                ? messages.iteratorNext
                : messages.iteratorThrow

            return nextTick(bind(this.tryHandle, this), false,
                new TypeError(message))
        }
    },

    run: function () {
        var initial

        try {
            initial = this.gen.next()
        } catch (e) {
            return nextTick(bind(this.fail, this), e)
        }

        return this.handle(true, initial)
    },
})

module.exports = function (gen, pass, fail) {
    return new Iterator(gen, pass, fail).run()
}
