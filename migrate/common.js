"use strict"

/**
 * @fileoverview
 * This module exports the following utility functions:
 *
 * - `Common.showDeprecation()` - Allow deprecation messages to be shown.
 * - `Common.hideDeprecation()` - Prevent deprecation messages from being shown.
 * - `Common.warn(...args)` - Print a deprecation warning
 * - `Common.deprecate(message, func)` - Wrap a function to print a deprecation
 *   message before its first use.
 */

// To suppress deprecation messages
var suppressDeprecation = true

exports.showDeprecation = function () {
    suppressDeprecation = false
}

exports.hideDeprecation = function () {
    suppressDeprecation = true
}

var console = global.console
var shouldPrint = console != null && typeof console.warn === "function" &&
    !(global.process != null && global.process.env != null &&
        global.process.env.NO_MIGRATE_WARN)

exports.warn = function () {
    if (shouldPrint && !suppressDeprecation) {
        console.warn.apply(console, arguments)
    }
}

exports.deprecate = function (message, func) {
    var printed = !shouldPrint

    /** @this */
    return function () {
        if (!suppressDeprecation) {
            if (!printed) {
                printed = true
                console.trace()
                console.warn(message)
            }

            message = undefined
        }

        return func.apply(this, arguments)
    }
}
