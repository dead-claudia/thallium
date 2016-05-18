"use strict"

var Promise = require("bluebird")

function isObjectLike(v) {
    return v != null && (typeof v === "object" || typeof v === "function")
}

/**
 * Load the config using the file from `find-config.js` and the loader map.
 * `load` is `state.util.load` from the command line state, `file` is the config
 * file, and `loaders` contain all the loaders to register. It returns a promise
 * to the loaded config.
 */
module.exports = function (load, file, loaders, baseDir) {
    // Load all previously marked modules.
    var iter = loaders.values()

    for (var next = iter.next(); !next.done; next = iter.next()) {
        next.value.register(baseDir)
    }

    if (file == null) return {}

    return Promise.resolve(load(file, baseDir)).then(function (data) {
        if (!isObjectLike(data)) return {}
        // not ES6 transpiled module
        if (isObjectLike(data.default)) return data.default
        return data
    })
}
