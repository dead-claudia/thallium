"use strict"

var Promise = require("bluebird")
var m = require("../messages.js")

function checkResult(result, message) {
    if (typeof result !== "object") {
        throw new TypeError(m(message))
    }

    return result
}

// This is a modified version of the async-await official, non-normative
// desugaring helper, for better error checking and adapted to accept an
// already-instantiated iterator instead of a generator.
module.exports = function (gen) {
    return new Promise(function (resolve, reject) {
        function step(func, value, message) {
            var next

            try {
                next = checkResult(func.call(gen, value), message)
            } catch (e) {
                // finished with failure, reject the promise
                return reject(e)
            }

            if (next.done) {
                // finished with success, resolve the promise
                return resolve(next.value)
            }

            // not finished, chain off the yielded promise and `step` again
            return Promise.resolve(next.value).then(function (v) {
                return step(gen.next, v, "type.iterate.next")
            }, function (e) {
                var func = gen.throw

                if (typeof func === "function") {
                    return step(func, e, "type.iterate.throw")
                } else {
                    return reject(e)
                }
            })
        }

        return step(gen.next, undefined, "type.iterate.next")
    })
}
