"use strict"

var m = require("../messages.js")
var Flags = require("./flags.js")
var Only = require("./only.js")

exports.restify = restify

/** @this {Array} */
function restify() {
    for (var i = 0; i < arguments.length; i++) {
        this.push(arguments[i])
    }

    return this
}

exports.checkInit = function (test) {
    if (!(test.status & Flags.Init)) {
        throw new ReferenceError(m("fail.checkInit"))
    }
}

/**
 * Find the relevant `only` for this test, starting with `path`. Note that it
 * also mutates `path` with the names of the tests it ascends to, and that
 * `path` is assumed to be an array-based stack.
 */
function seekOnly(path, test) {
    while (!(test.status & (Flags.Root | Flags.HasOnly))) {
        path.push(test.name)
        test = test.parent
    }

    return test
}

// This is literally run for most of the primary API, so it must be fast.
exports.isSkipped = isSkipped
function isSkipped(test) {
    // Roots aren't skippable, so that must be checked as well.
    return test.status & (
        Flags.Root |
        Flags.Skipped |
        Flags.OnlyChild
    ) === Flags.Skipped
}

// This handles name + func vs object with methods.
exports.iterateSetter = function (test, name, func, iterator) {
    if (!isSkipped(test)) {
        // Check both the name and function, so ES6 symbol polyfills (which use
        // objects since it's impossible to fully polyfill primitives) work.
        if (typeof name === "object" && name != null && func == null) {
            var keys = Object.keys(name)

            for (var i = 0; i < keys.length; i++) {
                var key = keys[i]

                if (typeof name[key] !== "function") {
                    throw new TypeError(m("type.define.callback", key))
                }

                test.methods[key] = iterator(test, key, name[key])
            }
        } else {
            if (typeof func !== "function") {
                throw new TypeError(m("type.define.callback", name))
            }

            test.methods[name] = iterator(test, name, func)
        }
    }
}

// This checks if the test was whitelisted in a `t.only()` call, or for
// convenience, returns `true` if `t.only()` was never called.
exports.isOnly = function (test, name) {
    // Much easier to use a stack here.
    var path = [name]

    test = seekOnly(path, test)

    // If there isn't any `only` active, then let's return `true` for
    // convenience.
    return !(test.status & Flags.HasOnly) || Only.check(test.only, path)
}
