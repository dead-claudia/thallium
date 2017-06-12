"use strict"

/**
 * Replaces the old `t.call` non-invasively.
 */
exports.call = function (t, plugin) {
    var reflect = t.reflect
    var args = [reflect]

    for (var i = 2; i < arguments.length; i++) {
        args.push(arguments[i])
    }

    return plugin.apply(reflect, args)
}
